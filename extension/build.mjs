import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: { background: join(root, "src/background.ts"), popup: join(root, "src/popup.ts") },
  outdir: join(root, "dist"),
  bundle: true,
  format: "iife",
  target: "chrome120",
  minify: true,
  legalComments: "none",
});

console.log("Built extension/dist");
