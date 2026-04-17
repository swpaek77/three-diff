import { diffWords } from "diff";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const KW = new Set([
  "abstract","as","async","await","break","case","catch","class","const",
  "constructor","continue","declare","default","delete","do","else","enum",
  "export","extends","finally","for","from","function","get","if","implements",
  "import","in","instanceof","interface","let","module","namespace","new","null",
  "of","override","private","protected","public","readonly","return","set",
  "static","super","switch","this","throw","true","false","try","type","typeof",
  "undefined","var","void","while","with","yield",
]);

function tokenizeLine(line: string): string {
  const trimmed = line.trimStart();
  // Full-line comment
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
    return `<span class="tc-cmt">${esc(line)}</span>`;
  }

  const parts: string[] = [];
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    // Inline // comment
    if (ch === "/" && line[i + 1] === "/") {
      parts.push(`<span class="tc-cmt">${esc(line.slice(i))}</span>`);
      break;
    }

    // String / template literal
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\" ) { j += 2; continue; }
        if (line[j] === ch) { j++; break; }
        j++;
      }
      parts.push(`<span class="tc-str">${esc(line.slice(i, j))}</span>`);
      i = j;
      continue;
    }

    // Identifier / keyword / type
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KW.has(word)) {
        parts.push(`<span class="tc-kw">${esc(word)}</span>`);
      } else {
        // skip whitespace to peek at next char
        let k = j;
        while (k < line.length && line[k] === " ") k++;
        if (line[k] === "(") {
          parts.push(`<span class="tc-fn">${esc(word)}</span>`);
        } else if (word[0] >= "A" && word[0] <= "Z") {
          parts.push(`<span class="tc-type">${esc(word)}</span>`);
        } else {
          parts.push(esc(word));
        }
      }
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[\d.eExXoObB_]/.test(line[j])) j++;
      parts.push(`<span class="tc-num">${esc(line.slice(i, j))}</span>`);
      i = j;
      continue;
    }

    parts.push(esc(ch));
    i++;
  }

  return parts.join("");
}

export function highlightFile(content: string, _filename: string): string[] {
  return content.split("\n").map(tokenizeLine);
}

export function wordDiff(lineA: string, lineB: string): [string, string] {
  const changes = diffWords(lineA, lineB);
  let a = "", b = "";
  for (const ch of changes) {
    const v = esc(ch.value);
    if (ch.removed) a += `<mark class="wd-del">${v}</mark>`;
    else if (ch.added) b += `<mark class="wd-add">${v}</mark>`;
    else { a += v; b += v; }
  }
  return [a, b];
}
