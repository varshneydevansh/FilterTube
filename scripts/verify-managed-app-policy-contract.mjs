import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appRepo = path.resolve((process.env.FILTERTUBE_APP_REPO || "").trim() || path.join(repoRoot, "..", "FilterTubeApp"));
const contractDocPath = "docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md";
const contractArtifactPath = "docs/audit/artifacts/managed-app-policy-contract-v1.json";
const appManifestPath = path.join(appRepo, "tools", "runtime-sync-manifest.json");

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function fail(message) {
  console.error(`Managed app policy contract check failed: ${message}`);
  process.exit(1);
}

function parseDocContract() {
  const doc = readText(contractDocPath);
  const match = doc.match(/## Contract Snapshot JSON[\s\S]*?```json\n([\s\S]*?)\n```/);
  if (!match) fail(`missing Contract Snapshot JSON block in ${contractDocPath}`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`invalid contract JSON in ${contractDocPath}: ${error.message}`);
  }
}

function assertDeepEqual(name, left, right) {
  const leftJson = JSON.stringify(left, null, 2);
  const rightJson = JSON.stringify(right, null, 2);
  if (leftJson !== rightJson) fail(`${name} drifted`);
}

function assertSourceExists(sourcePath) {
  const absolutePath = path.join(repoRoot, sourcePath);
  if (!fs.existsSync(absolutePath)) fail(`missing source ${sourcePath}`);
}

function verifyManifestEntries(contract) {
  if (!fs.existsSync(appManifestPath)) {
    console.log(`Managed app policy contract verified. App manifest not found at ${appManifestPath}; skipped app manifest copy checks.`);
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(appManifestPath, "utf8"));
  } catch (error) {
    fail(`invalid app runtime sync manifest at ${appManifestPath}: ${error.message}`);
  }
  if (!Array.isArray(manifest)) fail(`app runtime sync manifest must be an array: ${appManifestPath}`);

  const requiredCopyRows = [
    {
      source: contract.artifact.sourcePath,
      destination: contract.artifact.appDestination,
      syncMode: contract.artifact.manifestSyncMode,
    },
    ...contract.runtimeHelperSync.map((row) => ({
      source: row.sourcePath,
      destination: row.appDestination,
      syncMode: row.manifestSyncMode,
    })),
  ];

  for (const expected of requiredCopyRows) {
    const row = manifest.find((entry) => entry.source === expected.source);
    if (!row) fail(`app manifest missing source ${expected.source}`);
    if (row.destination !== expected.destination) fail(`app manifest destination mismatch for ${expected.source}`);
    if (row.syncMode !== expected.syncMode) fail(`app manifest syncMode mismatch for ${expected.source}`);
  }

  console.log(`Managed app policy contract verified against ${appManifestPath}.`);
}

const docContract = parseDocContract();
const artifactContract = JSON.parse(readText(contractArtifactPath));

if (docContract.schema !== "filtertube_managed_app_policy_contract") fail("unexpected contract schema");
if (docContract.version !== 1) fail("unexpected contract version");
if (docContract.artifact?.sourcePath !== contractArtifactPath) fail("artifact sourcePath mismatch");

assertDeepEqual("Markdown contract JSON and artifact JSON", docContract, artifactContract);

for (const row of [
  docContract.artifact,
  ...docContract.runtimeHelperSync,
  ...docContract.uiHelperMirror,
]) {
  assertSourceExists(row.sourcePath);
}

verifyManifestEntries(docContract);
