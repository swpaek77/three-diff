import { diffLines } from "diff";

export type CellStatus = "equal" | "changed" | "only" | "spacer";

export interface AlignedRow {
  a: number | null; // 1-based line number in file A (null = spacer)
  b: number | null;
  c: number | null;
  sa: CellStatus;
  sb: CellStatus;
  sc: CellStatus;
}

interface TwoWayRow {
  ln: number | null;
  ls: CellStatus;
  rn: number | null;
  rs: CellStatus;
}

function alignTwo(src: string, tgt: string): TwoWayRow[] {
  const changes = diffLines(src, tgt);
  const rows: TwoWayRow[] = [];
  let ln = 1,
    rn = 1,
    i = 0;

  while (i < changes.length) {
    const ch = changes[i];
    const count = ch.count ?? 1;

    if (ch.removed) {
      const nxt = changes[i + 1];
      if (nxt?.added) {
        // Changed block: pair up removed and added lines
        const nc = nxt.count ?? 1;
        const max = Math.max(count, nc);
        for (let j = 0; j < max; j++) {
          rows.push({
            ln: j < count ? ln++ : null,
            ls: j < count ? "changed" : "spacer",
            rn: j < nc ? rn++ : null,
            rs: j < nc ? "changed" : "spacer",
          });
        }
        i += 2;
        continue;
      }
      for (let j = 0; j < count; j++) {
        rows.push({ ln: ln++, ls: "only", rn: null, rs: "spacer" });
      }
    } else if (ch.added) {
      for (let j = 0; j < count; j++) {
        rows.push({ ln: null, ls: "spacer", rn: rn++, rs: "only" });
      }
    } else {
      for (let j = 0; j < count; j++) {
        rows.push({ ln: ln++, ls: "equal", rn: rn++, rs: "equal" });
      }
    }
    i++;
  }

  return rows;
}

export function computeAlignment(a: string, b: string, c: string): AlignedRow[] {
  const ab = alignTwo(a, b);
  const bc = alignTwo(b, c);
  const out: AlignedRow[] = [];
  let iab = 0,
    ibc = 0;

  while (iab < ab.length || ibc < bc.length) {
    const rab = iab < ab.length ? ab[iab] : null;
    const rbc = ibc < bc.length ? bc[ibc] : null;

    // A-only: AB row has no B side
    if (rab && rab.rn === null) {
      out.push({ a: rab.ln, b: null, c: null, sa: rab.ls, sb: "spacer", sc: "spacer" });
      iab++;
      continue;
    }

    // C-only: BC row has no B side
    if (rbc && rbc.ln === null) {
      out.push({ a: null, b: null, c: rbc.rn, sa: "spacer", sb: "spacer", sc: rbc.rs });
      ibc++;
      continue;
    }

    if (!rab && !rbc) break;

    if (!rbc) {
      out.push({ a: rab!.ln, b: rab!.rn, c: null, sa: rab!.ls, sb: rab!.rs, sc: "spacer" });
      iab++;
      continue;
    }

    if (!rab) {
      out.push({ a: null, b: rbc!.ln, c: rbc!.rn, sa: "spacer", sb: rbc!.ls, sc: rbc!.rs });
      ibc++;
      continue;
    }

    // Both have B lines — merge into one row
    const sb: CellStatus =
      rab.rs === "changed" || rab.rs === "only" || rbc.ls === "changed" || rbc.ls === "only"
        ? "changed"
        : rab.rs === "equal" && rbc.ls === "equal"
        ? "equal"
        : "only";

    out.push({ a: rab.ln, b: rab.rn, c: rbc.rn, sa: rab.ls, sb, sc: rbc.rs });
    iab++;
    ibc++;
  }

  return out;
}
