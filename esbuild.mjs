import * as esbuild from "esbuild";
import { argv } from "process";

const watch = argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node20",
  sourcemap: true,
});

if (watch) {
  await ctx.watch();
  console.log("Watching extension...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Extension built.");
}
