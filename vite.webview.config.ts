import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "webview-src"),
  build: {
    outDir: resolve(__dirname, "dist/webview"),
    emptyOutDir: true,
    cssCodeSplit: false,
  },
  base: "./",
});
