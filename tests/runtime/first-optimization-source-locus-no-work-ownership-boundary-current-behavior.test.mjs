import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-no-work-ownership-boundary-current-behavior.test.mjs';
const noWorkPreservationPath = 'docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusTeardown: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  noWorkMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  noWorkContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
  'FT-SOURCE-LOCUS-NOWORK-00-settings-scope',
  'FT-SOURCE-LOCUS-NOWORK-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-NOWORK-02-transport-json',
  'FT-SOURCE-LOCUS-NOWORK-03-filter-engine',
  'FT-SOURCE-LOCUS-NOWORK-04-dom-fallback',
  'FT-SOURCE-LOCUS-NOWORK-05-menu-quickblock',
  'FT-SOURCE-LOCUS-NOWORK-06-network-resolver',
  'FT-SOURCE-LOCUS-NOWORK-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-NOWORK-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-NOWORK-09-whitelist-policy',
  'FT-SOURCE-LOCUS-NOWORK-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-NOWORK-11-parity-release-verification'
];

const sourceLocusRows = [
  'FT-SOURCE-LOCUS-CALLABLE-00-settings-scope',
  'FT-SOURCE-LOCUS-CALLABLE-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-CALLABLE-02-transport-json',
  'FT-SOURCE-LOCUS-CALLABLE-03-filter-engine',
  'FT-SOURCE-LOCUS-CALLABLE-04-dom-fallback',
  'FT-SOURCE-LOCUS-CALLABLE-05-menu-quickblock',
  'FT-SOURCE-LOCUS-CALLABLE-06-network-resolver',
  'FT-SOURCE-LOCUS-CALLABLE-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-CALLABLE-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-CALLABLE-09-whitelist-policy',
  'FT-SOURCE-LOCUS-CALLABLE-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-CALLABLE-11-parity-release-verification'
];

const collectorNoWorkRows = [
  'FT-COLLECTOR-NOWORK-00-settings-snapshot-preservation',
  'FT-COLLECTOR-NOWORK-01-fixture-envelope-preservation',
  'FT-COLLECTOR-NOWORK-02-fetch-pass-through-preservation',
  'FT-COLLECTOR-NOWORK-03-xhr-hook-preservation',
  'FT-COLLECTOR-NOWORK-04-engine-harvest-preservation',
  'FT-COLLECTOR-NOWORK-05-dom-quiet-preservation',
  'FT-COLLECTOR-NOWORK-06-menu-quick-off-preservation',
  'FT-COLLECTOR-NOWORK-07-network-zero-fetch-preservation',
  'FT-COLLECTOR-NOWORK-08-storage-zero-mutation-preservation',
  'FT-COLLECTOR-NOWORK-09-visual-no-mutation-preservation',
  'FT-COLLECTOR-NOWORK-10-whitelist-fail-state-preservation',
  'FT-COLLECTOR-NOWORK-11-diagnostic-claim-preservation'
];

const classifiedSourceFiles = [
  'js/seed.js',
  'js/filter_logic.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/handle_resolver.js',
  'js/background.js',
  'js/state_manager.js',
  'js/settings_shared.js',
  'js/io_manager.js',
  'build.js',
  'scripts/build-extension-ui.mjs',
  'scripts/build-nanah-vendor.mjs',
  'scripts/sync-native-runtime.mjs'
];

const noWorkEvidenceFiles = [
  'js/settings_shared.js',
  'js/state_manager.js',
  'js/seed.js',
  'js/filter_logic.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/handle_resolver.js',
  'js/background.js',
  'js/io_manager.js',
  'js/content_bridge.js',
  'build.js',
  'scripts/sync-native-runtime.mjs'
];

const noWorkFixtureNames = [
  'empty_blocklist_desktop_home_no_work',
  'empty_blocklist_mobile_home_no_work',
  'empty_blocklist_watch_no_player_mutation',
  'disabled_extension_no_mutation'
];

const noWorkCounterGroups = [
  'responseJson',
  'jsonParse',
  'jsonStringify',
  'processData',
  'harvestOnly',
  'direct network fetches',
  'DOM scans',
  'quick/fallback menu sweeps',
  'stats/map/storage writes'
];

const anchorChecks = [
  { file: 'js/settings_shared.js', line: 564, needle: 'function loadSettings()' },
  { file: 'js/state_manager.js', line: 178, needle: 'async function loadSettings(options = {})' },
  { file: 'js/seed.js', line: 391, needle: "pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now(), reason: reason || '' })" },
  { file: 'js/seed.js', line: 411, needle: 'if (cachedSettings.enabled === false)' },
  { file: 'js/seed.js', line: 423, needle: 'window.FilterTubeEngine.harvestOnly(data, cachedSettings || { filterChannels: [], filterKeywords: [] })' },
  { file: 'js/seed.js', line: 701, needle: 'return response.clone().json().then(jsonData =>' },
  { file: 'js/seed.js', line: 819, needle: 'if (cachedSettings.enabled === false) return' },
  { file: 'js/seed.js', line: 843, needle: 'jsonData = JSON.parse(trimmed)' },
  { file: 'js/seed.js', line: 863, needle: "Object.defineProperty(xhr, 'response'" },
  { file: 'js/filter_logic.js', line: 3442, needle: 'this._harvestChannelData(data)' },
  { file: 'js/filter_logic.js', line: 3444, needle: "console.warn('FilterTube: Harvesting failed', e)" },
  { file: 'js/filter_logic.js', line: 3449, needle: 'if (this.settings.enabled === false)' },
  { file: 'js/filter_logic.js', line: 3459, needle: 'const filtered = this.filter(data)' },
  { file: 'js/content/dom_fallback.js', line: 1933, needle: 'function hasActiveDOMFallbackWork(settings)' },
  { file: 'js/content/dom_fallback.js', line: 2035, needle: 'async function applyDOMFallback(settings, options = {})' },
  { file: 'js/content/dom_fallback.js', line: 2304, needle: 'if (effectiveSettings.enabled === false)' },
  { file: 'js/content/dom_fallback.js', line: 2310, needle: "document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]')" },
  { file: 'js/content/dom_fallback.js', line: 2326, needle: "const videoElements = (onlyWhitelistPending && listMode === 'whitelist')" },
  { file: 'js/content/dom_fallback.js', line: 2488, needle: 'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })' },
  { file: 'js/content/block_channel.js', line: 1211, needle: 'currentSettings.showQuickBlockButton !== true' },
  { file: 'js/content/block_channel.js', line: 1962, needle: 'quickBlockSweepTimer = setTimeout(() =>' },
  { file: 'js/content/block_channel.js', line: 2201, needle: "document.addEventListener('pointermove'" },
  { file: 'js/content/block_channel.js', line: 2218, needle: 'const observer = new MutationObserver((mutations) =>' },
  { file: 'js/content/block_channel.js', line: 2277, needle: "document.addEventListener('yt-navigate-finish'" },
  { file: 'js/content/handle_resolver.js', line: 149, needle: 'async function fetchIdForHandle(handle, options = {})' },
  { file: 'js/content/handle_resolver.js', line: 167, needle: "const storage = await browserAPI_BRIDGE.storage.local.get(['channelMap'])" },
  { file: 'js/content/handle_resolver.js', line: 192, needle: "resolvedHandleCache.set(cleanHandle, 'PENDING')" },
  { file: 'js/content/handle_resolver.js', line: 239, needle: 'response = await fetch(path' },
  { file: 'js/content/handle_resolver.js', line: 240, needle: "credentials: 'same-origin'" },
  { file: 'js/background.js', line: 1480, needle: 'pendingChannelMapUpdates.clear()' },
  { file: 'js/background.js', line: 1481, needle: 'await browserAPI.storage.local.set({ channelMap: map })' },
  { file: 'js/background.js', line: 1489, needle: 'channelMapFlushTimer = setTimeout(() =>' },
  { file: 'js/state_manager.js', line: 2004, needle: 'await chrome.storage?.local.set({ channelMap: state.channelMap })' },
  { file: 'js/io_manager.js', line: 2000, needle: 'clearTimeout(backupScheduleTimer)' },
  { file: 'js/io_manager.js', line: 2003, needle: 'backupScheduleTimer = setTimeout(async () =>' },
  { file: 'js/content_bridge.js', line: 3713, needle: "chrome.storage.local.get(['stats', 'statsBySurface']" },
  { file: 'js/content_bridge.js', line: 6158, needle: 'whitelistPendingRefreshState.timer = setTimeout(() =>' },
  { file: 'js/content_bridge.js', line: 6208, needle: 'whitelistPendingRefreshState.pendingHideTimer = setTimeout(() =>' },
  { file: 'js/content_bridge.js', line: 6297, needle: "element.classList.add('filtertube-hidden')" },
  { file: 'js/content_bridge.js', line: 6298, needle: "element.setAttribute('data-filtertube-hidden', 'true')" },
  { file: 'js/content_bridge.js', line: 12216, needle: "prevHiddenAttr: element.getAttribute('data-filtertube-hidden')" },
  { file: 'js/content_bridge.js', line: 12229, needle: "element.classList.add('filtertube-hidden')" },
  { file: 'js/seed.js', line: 153, needle: 'FilterTube (Seed):' },
  { file: 'js/filter_logic.js', line: 1581, needle: "console.log('FilterTube Whitelist (JSON):'" },
  { file: 'js/content/dom_fallback.js', line: 4559, needle: "console.log('FilterTube Whitelist (DOM):'" },
  { file: 'build.js', line: 82, needle: "execSync('node scripts/build-extension-ui.mjs', { stdio: 'inherit' })" },
  { file: 'build.js', line: 184, needle: "const zipPath = path.join('dist', zipName)" },
  { file: 'scripts/sync-native-runtime.mjs', line: 21, needle: 'const result = spawnSync(process.execPath, [syncScript]' }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusNoWorkBoundary',
  'firstOptimizationSourceLocusNoWorkReport',
  'sourceLocusNoWorkApproval',
  'sourceLocusCallableNoWorkOwnerApproval',
  'jsonFirstSourceLocusNoWorkGate',
  'whitelistSourceLocusNoWorkGate',
  'metricFoundationNoWorkAuthority',
  'runtimeSourceNoWorkOwnerMap',
  'runtimeSourceNoWorkCollector',
  'sourceLocusNoWorkMetricArtifact',
  'sourceLocusNoWorkPreservationPacket',
  'runtimeNoWorkOptimizationAuthority'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineAt(file, lineNumber) {
  return read(file).split(/\r?\n/)[lineNumber - 1] || '';
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next' || entry === '.vercel') continue;
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  if (/\.(js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(relativePath)) {
    result.push(relativePath.replaceAll(path.sep, '/'));
  }
  return result;
}

function productSource() {
  const files = [
    ...walk('js'),
    ...walk('scripts'),
    ...walk('website'),
    'build.js'
  ];
  return files.map((file) => read(file)).join('\n');
}

test('source-locus no-work ownership boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus no-work\s+ownership boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /This is no-work ownership classification, not no-work approval/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus no-work rows counts and classified files stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-NOWORK-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /source-locus no-work boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 12/);
  assert.match(doc, /source-locus teardown rows covered: 12/);
  assert.match(doc, /collector no-work rows covered: 12/);
  assert.match(doc, /P0 no-work fixture names covered: 4/);
  assert.match(doc, /required no-work counter groups covered: 9/);
  assert.match(doc, /runtime\/build source files classified: 14/);
  assert.match(doc, /runtime\/build source files with no-work evidence covered: 12/);
  assert.match(doc, /audit\/test anchor files covered: 2/);
  assert.match(doc, /current source no-work anchors covered: 48/);
  assert.match(doc, /no-work risk classes covered: 7/);
  assert.match(doc, /committed no-work preservation files: 0/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-locus no-work rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const row of sourceLocusRows) {
    assert.ok(doc.includes(row), `missing source-locus row ${row}`);
  }
  for (const row of collectorNoWorkRows) {
    assert.ok(doc.includes(row), `missing collector no-work row ${row}`);
  }
  for (const sourceFile of classifiedSourceFiles) {
    assert.ok(doc.includes(sourceFile), `missing classified file ${sourceFile}`);
  }
  for (const sourceFile of noWorkEvidenceFiles) {
    assert.ok(doc.includes(sourceFile), `missing no-work evidence file ${sourceFile}`);
  }
  for (const fixtureName of noWorkFixtureNames) {
    assert.ok(doc.includes(fixtureName), `missing no-work fixture name ${fixtureName}`);
  }
  for (const counterGroup of noWorkCounterGroups) {
    assert.ok(doc.includes(counterGroup), `missing no-work counter group ${counterGroup}`);
  }
});

test('source-locus no-work anchors resolve to current source text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 48);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`| \`${anchor.file}\` | ${anchor.line} |`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source-locus no-work boundary preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const sourceLocusTeardown = read(sourceDocs.sourceLocusTeardown);
  const noWorkMatrix = read(sourceDocs.noWorkMatrix);
  const noWorkContract = read(sourceDocs.noWorkContract);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.equal(fs.existsSync(path.join(repoRoot, noWorkPreservationPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false);
  assert.match(sourceLocusTeardown, /implementation-ready source-locus teardown rows: 0/);
  assert.match(noWorkMatrix, /runtime collector no-work proofs approved: 0/);
  assert.match(noWorkMatrix, /required no-work counter groups covered: 9/);
  assert.match(noWorkContract, /Committed no-work preservation files: 0/);
  assert.match(noWorkContract, /runtime metric collector approvals: 0/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(doc, /runtime source-owner approval now: NO-GO/);
  assert.match(doc, /commit no-work-preservation\.json now: NO-GO/);
  assert.match(doc, /runtime metric collector approval now: NO-GO/);
});

test('source-locus no-work future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source-locus no-work boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusCallable: sourceDocs.sourceLocusCallable,
    sourceLocusFingerprint: sourceDocs.sourceLocusFingerprint,
    sourceLocusTeardown: sourceDocs.sourceLocusTeardown,
    noWorkMatrix: sourceDocs.noWorkMatrix,
    noWorkContract: sourceDocs.noWorkContract,
    runtimeResults: sourceDocs.runtimeResults,
    ...ledgerDocs
  };
  const doc = read(docPath);

  for (const [label, file] of Object.entries(requiredLinkFiles)) {
    assert.ok(read(file).includes(docPath), `${label} missing doc link`);
    assert.ok(read(file).includes(runtimeTestPath), `${label} missing test link`);
  }

  assert.ok(read(sourceDocs.runtimeResults).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.objectiveLedger).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.activeGoal).includes('expected runtime audit tests: 4457'));
  assert.ok(read(ledgerDocs.trackedIndex).includes('expected runtime audit tests: 4457'));
  assert.ok(doc.includes(runtimeTestPath));
});
