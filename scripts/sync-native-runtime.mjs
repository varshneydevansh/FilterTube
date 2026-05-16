import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const publicRepoRoot = process.cwd();
const appRepoFromEnv = (process.env.FILTERTUBE_APP_REPO || "").trim();
const defaultSiblingAppRepo = path.resolve(publicRepoRoot, "..", "FilterTubeApp");
const appRepo = path.resolve(appRepoFromEnv || defaultSiblingAppRepo);
const syncScript = path.join(appRepo, "tools", "sync-runtime-from-extension.mjs");

if (!fs.existsSync(syncScript)) {
  console.error("Cannot find native runtime sync script.");
  console.error(`Expected: ${syncScript}`);
  console.error("");
  console.error("Set FILTERTUBE_APP_REPO=/absolute/path/to/FilterTubeApp if the app repo is not a sibling directory.");
  process.exit(1);
}

console.log(`Syncing extension runtime into native app repo: ${appRepo}`);

const result = spawnSync(process.execPath, [syncScript], {
  cwd: appRepo,
  env: {
    ...process.env,
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
