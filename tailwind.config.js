/** @type {import('tailwindcss').Config} */
export default {
  content: ["./webview-src/**/*.{ts,tsx,html}"],
  safelist: [
    "bg-diff-changed",
    "bg-diff-only",
    "bg-diff-spacer",
    "border-l-transparent",
    "border-l-[#d29922]",
    "border-l-[#f85149]",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--vscode-editor-font-family)", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
