#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("sharp 패키지가 없어요. 먼저: pnpm add -D sharp");
  process.exit(1);
}

const ROOT = path.join(__dirname, "..");

async function main() {
  const svg = fs.readFileSync(path.join(ROOT, "icon.svg"));
  await sharp(svg)
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ROOT, "icon.png"));
  console.log("✓ icon.png (128×128)");
}

main().catch((e) => { console.error(e); process.exit(1); });
