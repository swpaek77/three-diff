import React, { useRef, useEffect, useCallback } from "react";
import type { AlignedRow, CellStatus } from "../lib/diff";

interface FilePanelProps {
  name: string;
  path: string;
  column: "a" | "b" | "c";
  rows: AlignedRow[];
  rowDisplay: (string | null)[]; // pre-computed HTML for each row (null = spacer)
  syncScrollTop: number;
  onScroll: (top: number) => void;
  onOpenFile: (path: string) => void;
}

const ROW_BG: Record<CellStatus, string> = {
  equal:   "",
  changed: "bg-diff-changed",
  only:    "bg-diff-only",
  spacer:  "bg-diff-spacer",
};
const ROW_BORDER: Record<CellStatus, string> = {
  equal:   "border-l-transparent",
  changed: "border-l-[#d29922]",
  only:    "border-l-[#f85149]",
  spacer:  "border-l-transparent",
};

export function FilePanel({ name, path, column, rows, rowDisplay, syncScrollTop, onScroll, onOpenFile }: FilePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (!scrollRef.current || syncing.current) return;
    scrollRef.current.scrollTop = syncScrollTop;
  }, [syncScrollTop]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    syncing.current = true;
    onScroll(scrollRef.current.scrollTop);
    requestAnimationFrame(() => { syncing.current = false; });
  }, [onScroll]);

  return (
    <div className="flex flex-col flex-1 min-w-0 border-r border-[var(--border)] last:border-r-0 overflow-hidden">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 bg-[var(--header-bg)] border-b border-[var(--border)] shrink-0 hover:opacity-80 text-left w-full truncate"
        onClick={() => onOpenFile(path)} title={path}
      >
        <svg className="w-4 h-4 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm truncate font-medium">{name}</span>
      </button>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-auto">
        <div className="min-w-max">
          {rows.map((row, i) => {
            const lineNo = row[column] as number | null;
            const status: CellStatus = column === "a" ? row.sa : column === "b" ? row.sb : row.sc;
            const html = rowDisplay[i];
            const isSpacer = html === null;

            return (
              <div
                key={i}
                className={`flex items-stretch border-l-[3px] ${ROW_BORDER[status]} ${isSpacer ? "bg-diff-spacer" : ROW_BG[status]}`}
                style={{ minHeight: "1.5em" }}
              >
                <span className="select-none text-xs text-right shrink-0 w-12 pr-3 py-[1px] opacity-40 code-font">
                  {lineNo ?? ""}
                </span>
                {isSpacer ? (
                  <span className="flex-1" />
                ) : (
                  <span
                    className="code-font flex-1 px-2 py-[1px] whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: html || " " }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
