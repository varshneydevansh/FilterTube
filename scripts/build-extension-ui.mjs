import { mkdir } from "node:fs/promises";
import path from "node:path";

import { build } from "esbuild";

const root = process.cwd();

const entryPoints = [
  {
    input: path.join(root, "src/extension-shell/popup.jsx"),
    output: path.join(root, "js/ui-shell/popup-shell.js"),
  },
  {
    input: path.join(root, "src/extension-shell/tab-view-decor.jsx"),
    output: path.join(root, "js/ui-shell/tab-view-decor.js"),
  },
];

async function ensureOutputDirectories() {
  await mkdir(path.join(root, "js/ui-shell"), { recursive: true });
}

async function bundleAll() {
  await ensureOutputDirectories();

  await Promise.all(
    entryPoints.map(({ input, output }) =>
      build({
        entryPoints: [input],
        outfile: output,
        bundle: true,
        format: "iife",
        platform: "browser",
        target: ["chrome111", "firefox109"],
        jsxFactory: "h",
        jsxFragment: "Fragment",
        legalComments: "none",
        sourcemap: false,
        minify: false,
        logLevel: "info",
      })
    )
  );
}

bundleAll().catch((error) => {
  console.error("FilterTube UI shell build failed.");
  console.error(error);
  process.exitCode = 1;
});
