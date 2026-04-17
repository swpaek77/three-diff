import React, { useEffect, useState, useCallback, useMemo, Component } from "react";
import type { ReactNode } from "react";
import { FilePanel } from "./components/FilePanel";
import { computeAlignment, type AlignedRow } from "./lib/diff";
import { highlightFile, wordDiff } from "./lib/highlight";

interface FileData { path: string; name: string; content: string; }

const vscode = (() => {
  try { return (window as any).acquireVsCodeApi() as { postMessage: (m: unknown) => void }; }
  catch { return { postMessage: (_: unknown) => {} }; }
})();

class ErrorBoundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null };
  static getDerivedStateFromError(e: Error) { return { err: e.message }; }
  render() {
    if (this.state.err)
      return <pre style={{ padding: 24, color: "#f85149", whiteSpace: "pre-wrap" }}>
        Three Compare error:{"\n"}{this.state.err}
      </pre>;
    return this.props.children;
  }
}

function ThreeCompare() {
  const embedded: FileData[] | undefined = (window as any).__THREE_COMPARE_FILES__;
  const [files, setFiles] = useState<FileData[]>(embedded ?? []);
  const [syncScrollTop, setSyncScrollTop] = useState(0);

  useEffect(() => {
    if (files.length > 0) return;
    vscode.postMessage({ type: "ready" });
    const h = (ev: MessageEvent) => {
      const m = ev.data;
      if (m?.type === "files" && Array.isArray(m.files) && m.files.length === 3)
        setFiles(m.files as FileData[]);
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, []); // eslint-disable-line

  const rows: AlignedRow[] = useMemo(() => {
    if (files.length < 3) return [];
    try { return computeAlignment(files[0].content, files[1].content, files[2].content); }
    catch { return []; }
  }, [files]);

  // Per-row display HTML for each panel.
  // Changed lines get word-level diff instead of syntax highlighting.
  const { dispA, dispB, dispC } = useMemo(() => {
    if (files.length < 3 || rows.length === 0)
      return { dispA: [] as (string | null)[], dispB: [] as (string | null)[], dispC: [] as (string | null)[] };

    const rawA = files[0].content.split("\n");
    const rawB = files[1].content.split("\n");
    const rawC = files[2].content.split("\n");
    const hlA = highlightFile(files[0].content, files[0].name);
    const hlB = highlightFile(files[1].content, files[1].name);
    const hlC = highlightFile(files[2].content, files[2].name);

    const dispA: (string | null)[] = [];
    const dispB: (string | null)[] = [];
    const dispC: (string | null)[] = [];

    for (const row of rows) {
      let ha = row.a !== null ? (hlA[row.a - 1] ?? "") : null;
      let hb = row.b !== null ? (hlB[row.b - 1] ?? "") : null;
      let hc = row.c !== null ? (hlC[row.c - 1] ?? "") : null;

      // A↔B word diff
      if (row.a !== null && row.b !== null && row.sa === "changed") {
        try {
          const [wa, wb] = wordDiff(rawA[row.a - 1] ?? "", rawB[row.b - 1] ?? "");
          ha = wa; hb = wb;
        } catch { /* keep syntax hl */ }
      }

      // B↔C word diff (don't overwrite B if already set by A-B diff)
      if (row.b !== null && row.c !== null && row.sc === "changed") {
        try {
          const [wb2, wc] = wordDiff(rawB[row.b - 1] ?? "", rawC[row.c - 1] ?? "");
          if (row.sa !== "changed") hb = wb2;
          hc = wc;
        } catch { /* keep syntax hl */ }
      }

      dispA.push(ha);
      dispB.push(hb);
      dispC.push(hc);
    }

    return { dispA, dispB, dispC };
  }, [files, rows]);

  const handleScroll = useCallback((top: number) => setSyncScrollTop(top), []);
  const handleOpen = useCallback((path: string) => vscode.postMessage({ type: "openFile", path }), []);

  if (files.length === 0)
    return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", opacity:0.4, fontSize:13 }}>Loading…</div>;

  const diffCount = rows.filter(r => r.sa !== "equal" || r.sb !== "equal" || r.sc !== "equal").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-1 bg-[var(--header-bg)] border-b border-[var(--border)] text-xs shrink-0 select-none">
        <span className="opacity-50">Diff:</span>
        <Dot color="rgba(210,153,34,0.3)" border="#d29922" label="Changed" />
        <Dot color="rgba(248,81,73,0.25)" border="#f85149" label="Only here" />
        <Dot color="rgba(46,160,67,0.3)" border="#2ea043" label="Word add" />
        <Dot color="rgba(248,81,73,0.3)" border="#f85149" label="Word del" />
        <span className="ml-auto opacity-40">{diffCount} diff · {rows.length} rows · click filename to open</span>
      </div>
      <div className="flex flex-1 min-h-0">
        {(["a","b","c"] as const).map((col, idx) => (
          <FilePanel key={col}
            name={files[idx].name} path={files[idx].path}
            column={col} rows={rows}
            rowDisplay={col === "a" ? dispA : col === "b" ? dispB : dispC}
            syncScrollTop={syncScrollTop} onScroll={handleScroll}
            onOpenFile={handleOpen}
          />
        ))}
      </div>
    </div>
  );
}

function Dot({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color, outline: `1.5px solid ${border}` }} />
      <span>{label}</span>
    </span>
  );
}

export default function App() {
  return <ErrorBoundary><ThreeCompare /></ErrorBoundary>;
}
