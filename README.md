# Three File Compare

A VS Code extension that compares **3 files side by side** — like IntelliJ's 3-way diff.

## Demo

<video
  src="https://raw.githubusercontent.com/swpaek77/three-diff/main/media/three-diff-demo.mp4"
  poster="https://raw.githubusercontent.com/swpaek77/three-diff/main/media/three-diff-demo-poster.png"
  controls
  muted
  playsinline
  width="960">
</video>

If the embedded preview does not render in your current Markdown viewer, [open the demo video directly](https://raw.githubusercontent.com/swpaek77/three-diff/main/media/three-diff-demo.mp4).

## Features

- **3-panel side-by-side diff** — see all three files at once
- **Synchronized scrolling** — all panels scroll together
- **Syntax highlighting** — keywords, strings, types, functions, numbers
- **Word-level diff** — highlights exactly which words changed within a line
- **Color-coded rows**
  - 🟡 Yellow — line differs between panels
  - 🔴 Red — line exists in only one panel
  - Green/Red marks — intra-line word additions / deletions

## Usage

### Method 1 — Right-click in Explorer (recommended)

Right-click files one at a time in the file explorer:

1. Right-click the **first file** → **Three File Compare: Add to Compare**
2. Right-click the **second file** → **Three File Compare: Add to Compare**
3. Right-click the **third file** → **Three File Compare: Add to Compare**

The panel opens automatically when the 3rd file is added.

> **Tip:** You can also select multiple files with `Cmd/Ctrl+Click` or `Shift+Click` in the explorer and right-click to add them all at once.

### Method 2 — Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **`Three Compare: Compare 3 Files`**
3. Select exactly 3 files in the file picker

### Navigating results

- Click a **filename header** to open that file in the editor
- All 3 panels **scroll in sync** — scroll any panel to navigate all
- Use **`Cmd/Ctrl+F`** inside the compare view to search with VS Code's built-in webview find widget

## Legend

| Color | Meaning |
|-------|---------|
| Yellow background + left border | Line is different across panels |
| Red background + left border | Line only exists in this panel |
| Faint striped row | Spacer (other panels have a line here, this one doesn't) |
| `wd-add` green mark | Word added vs adjacent panel |
| `wd-del` red mark | Word deleted vs adjacent panel |
