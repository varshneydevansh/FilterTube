import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appRepo = path.resolve((process.env.FILTERTUBE_APP_REPO || "").trim() || path.join(repoRoot, "..", "FilterTubeApp"));
const contractDocPath = "docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md";
const contractArtifactPath = "docs/audit/artifacts/managed-app-policy-contract-v1.json";
const appManifestPath = path.join(appRepo, "tools", "runtime-sync-manifest.json");
const packageJson = JSON.parse(readText("package.json"));

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

function assertIncludes(name, collection, expectedValue) {
  if (!Array.isArray(collection) || !collection.includes(expectedValue)) {
    fail(`${name} missing ${expectedValue}`);
  }
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

assertDeepEqual(
  "managed delivery parent labels",
  docContract.managedDelivery?.parentFacingTransports?.map((row) => row.label),
  ["Send Update", "Internet Pickup", "Home Pickup"],
);
assertDeepEqual(
  "managed delivery transport mapping",
  docContract.managedDelivery?.parentFacingTransports?.map((row) => row.transport),
  ["live_nanah", "encrypted_mailbox", "configured_local_network_gateway"],
);
assertDeepEqual(
  "managed delivery family device map UI model",
  docContract.managedDelivery?.familyDeviceMapUiModel,
  {
    identity: "one_family_device_map_for_live_same_network_and_internet_devices",
    states: [
      "live_now_send_update",
      "same_network_home_pickup",
      "away_or_internet_internet_pickup",
      "offline_last_valid_policy",
    ],
    boundary: "delivery state is not authority; every applied update still requires trusted link target profile scope revision device binding policy hash and signature validation",
  },
);
assertIncludes(
  "managed delivery UI boundaries",
  docContract.managedDelivery?.requiredUiBoundaries,
  "one_family_device_map_represents_live_same_network_and_internet_devices",
);
assertIncludes(
  "managed delivery UI boundaries",
  docContract.managedDelivery?.requiredUiBoundaries,
  "installed_app_smoke_records_family_device_map_delivery_states",
);
assertIncludes(
  "managed delivery UI boundaries",
  docContract.managedDelivery?.requiredUiBoundaries,
  "apps_and_pickup_provider_software_must_not_treat_delivery_labels_as_authority",
);
assertDeepEqual(
  "managed delivery Internet Pickup provider methods",
  docContract.managedDelivery?.configuredInternetPickupProvider?.requiredMethods,
  [
    "uploadManagedMailboxItems",
    "pullDecryptedMailboxItems",
    "ackMailboxItems",
    "pullManagedDeliveryAcks",
    "purgeManagedMailboxItems",
    "checkManagedMailboxServer",
  ],
);
assertDeepEqual(
  "managed delivery Home Pickup provider methods",
  docContract.managedDelivery?.configuredLocalNetworkProvider?.requiredMethods,
  [
    "publishManagedPolicyCandidates",
    "discoverManagedPolicyCandidates",
    "ackLocalNetworkCandidates",
    "pullManagedDeliveryAcks",
    "purgeLocalNetworkCandidates",
    "checkManagedLocalNetworkBridge",
  ],
);
assertDeepEqual(
  "managed delivery Internet Pickup endpoint classes",
  docContract.managedDelivery?.configuredInternetPickupProvider?.allowedEndpointClasses,
  ["https"],
);
assertIncludes(
  "managed delivery Internet Pickup forbidden authority",
  docContract.managedDelivery?.configuredInternetPickupProvider?.forbiddenAuthority,
  "plaintext_rule_storage",
);
assertIncludes(
  "managed delivery Home Pickup forbidden authority",
  docContract.managedDelivery?.configuredLocalNetworkProvider?.forbiddenAuthority,
  "lan_reachability",
);
assertDeepEqual(
  "managed delivery reference provider status and storage contract",
  {
    storageMode: docContract.managedDelivery?.referenceProvider?.storageMode,
    defaultPort: docContract.managedDelivery?.referenceProvider?.defaultPort,
    browserStatusPage: docContract.managedDelivery?.referenceProvider?.browserStatusPage,
    apiStatusPayload: docContract.managedDelivery?.referenceProvider?.apiStatusPayload,
    browserCorsPreflight: docContract.managedDelivery?.referenceProvider?.browserCorsPreflight,
  },
  {
    storageMode: "in_memory_or_optional_json_file_store",
    defaultPort: 8787,
    browserStatusPage: true,
    apiStatusPayload: true,
    browserCorsPreflight: true,
  },
);
for (const requiredProviderSupport of [
  "browser_safe_status_page",
  "read_only_api_status_payload",
  "redacted_queue_and_receipt_counts",
  "optional_json_file_persistent_store",
  "terminal_ack_queue_cleanup",
  "receipt_retention_expiry",
  "retention_expiry_cap",
  "purge_by_state",
]) {
  assertIncludes(
    "managed delivery reference provider supports",
    docContract.managedDelivery?.referenceProvider?.supports,
    requiredProviderSupport,
  );
}
for (const forbiddenProviderClaim of [
  "automatic_lan_peer_discovery",
  "hosted_internet_pickup_service_ownership",
  "managed_database_service",
  "profile_authority",
  "pin_authority",
  "trusted_link_authority",
  "signature_authority",
  "native_android_ios_parity",
]) {
  assertIncludes(
    "managed delivery reference provider doesNotProvide",
    docContract.managedDelivery?.referenceProvider?.doesNotProvide,
    forbiddenProviderClaim,
  );
}
assertIncludes(
  "app native owned responsibilities",
  docContract.appBoundary?.nativeOwnedResponsibilities,
  "native_family_device_map_delivery_state_ui",
);

for (const row of [
  docContract.artifact,
  ...docContract.runtimeHelperSync,
  ...docContract.uiHelperMirror,
]) {
  assertSourceExists(row.sourcePath);
}

if (docContract.managedDelivery?.referenceProvider?.sourcePath) {
  assertSourceExists(docContract.managedDelivery.referenceProvider.sourcePath);
}

if (docContract.managedDelivery?.referenceProvider?.auditPath) {
  assertSourceExists(docContract.managedDelivery.referenceProvider.auditPath);
}

if (docContract.managedDelivery?.referenceProvider?.packageScript) {
  const scriptName = docContract.managedDelivery.referenceProvider.packageScript;
  if (!packageJson.scripts?.[scriptName]) fail(`package.json missing managed delivery provider script ${scriptName}`);
  if (!packageJson.scripts[scriptName].includes(docContract.managedDelivery.referenceProvider.sourcePath)) {
    fail(`package.json script ${scriptName} does not run ${docContract.managedDelivery.referenceProvider.sourcePath}`);
  }
}

verifyManifestEntries(docContract);
