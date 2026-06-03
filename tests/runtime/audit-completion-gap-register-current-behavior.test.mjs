import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';
const runtimeTestIndexPath = 'docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const metricCoverageGatePath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const artifactCommitReadinessPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const sourceLocusImplementationAuthorityPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const sourceOwnerMapDraftReadinessPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_DRAFT_READINESS_CURRENT_BEHAVIOR_2026-05-29.md';
const packetManifestContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const metricSampleContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const fixtureProvenanceContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const noWorkPreservationContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const sideEffectBudgetContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const diagnosticPrivacyContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const parityRolloutContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const verificationOutputContractPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md';
const releaseRegressionPath = 'docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md';
const optimizationStopGoPath = 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md';
const modeSurfaceEffectPath = 'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md';
const collaboratorIdentityPromotionPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23.md';
const settingsRefreshOptimizationReadinessPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md';
const settingsRefreshOptimizationCandidateBindingPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';
const settingsRefreshOptimizationCandidateEvidencePath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-29.md';
const settingsRefreshDirtyKeyConsumerPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_CONSUMER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';
const settingsRefreshDirtyKeyProducerPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';
const settingsRefreshDirtyKeyProducerConsumerJoinPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_CONSUMER_JOIN_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';
const whitelistCacheSpaMetricPacketGatePath = 'docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29.md';
const contentFilterRouteSurfaceNoWorkBudgetPath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md';
const contentFilterFieldSemanticsPath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_SEMANTICS_CONTRACT_GATE_CURRENT_BEHAVIOR_2026-05-29.md';
const contentFilterFieldEffectManifestPath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_MANIFEST_GATE_CURRENT_BEHAVIOR_2026-05-29.md';
const contentFilterFieldEffectRouteSurfacePath = 'docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function runtimeFixtureIndexStats() {
  const runtimeResults = read(runtimeResultsPath);
  const tick = '`';
  const testFiles = fs.readdirSync(path.join(repoRoot, 'tests', 'runtime'))
    .filter(file => file.endsWith('.test.mjs'))
    .map(file => `tests/runtime/${file}`)
    .sort();
  const exactBackticked = testFiles.filter(file => runtimeResults.includes(`${tick}${file}${tick}`));

  return {
    testFiles: testFiles.length,
    exactBackticked: exactBackticked.length,
    missingExactBackticked: testFiles.length - exactBackticked.length
  };
}

function runtimeTestProvenanceIndexStats() {
  const index = read(runtimeTestIndexPath);
  const rows = [...index.matchAll(/^\| (\d+) \| `([^`]+)` \| (\d+) \| `(yes|no)` \| (.*) \|$/gm)];
  const yesRows = rows.filter(row => row[4] === 'yes').length;
  const noRows = rows.filter(row => row[4] === 'no').length;
  const declarations = rows.reduce((total, row) => total + Number(row[3]), 0);

  return {
    rows: rows.length,
    files: rows.map(row => row[2]).sort(),
    yesRows,
    noRows,
    declarations
  };
}

function runtimeTestProvenanceDriftStats() {
  const index = read(runtimeTestIndexPath);
  const rows = [...index.matchAll(/^\| (\d+) \| `([^`]+)` \| (\d+) \| `(yes|no)` \| (.*) \|$/gm)];
  const rowMap = new Map(rows.map(row => [row[2], Number(row[3])]));
  const sourceStats = currentRuntimeTestSourceStats();
  const missingFiles = sourceStats.files.filter(file => !rowMap.has(file));
  const staleRows = rows.map(row => row[2]).filter(file => !sourceStats.files.includes(file));
  const countMismatches = sourceStats.files
    .filter(file => rowMap.has(file))
    .map(file => {
      const current = (read(file).match(/(?:^|\n)\s*test\s*\(/g) || []).length;
      return { file, indexed: rowMap.get(file), current };
    })
    .filter(row => row.indexed !== row.current);

  return { missingFiles, staleRows, countMismatches };
}

function currentRuntimeTestSourceStats() {
  const files = fs.readdirSync(path.join(repoRoot, 'tests', 'runtime'))
    .filter(file => file.endsWith('.test.mjs'))
    .map(file => `tests/runtime/${file}`)
    .sort();
  const declarations = files.reduce((total, file) => {
    const source = read(file);
    return total + (source.match(/(?:^|\n)\s*test\s*\(/g) || []).length;
  }, 0);

  return { files, declarations };
}

function runtimeCountDriftCensusStats() {
  const excluded = new Set([
    docPath,
    'tests/runtime/audit-completion-gap-register-current-behavior.test.mjs'
  ]);
  const roots = ['docs/audit', 'tests/runtime'];
  const files = [];

  function walk(relativePath) {
    const absolutePath = path.join(repoRoot, relativePath);
    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolutePath)) {
        walk(path.join(relativePath, entry).replaceAll(path.sep, '/'));
      }
      return;
    }
    if (!/\.(?:md|mjs)$/.test(relativePath) || excluded.has(relativePath)) return;
    files.push(relativePath);
  }

  for (const root of roots) walk(root);

  const tokenStats = (token) => {
    let occurrences = 0;
    let fileCount = 0;
    for (const file of files) {
      const matches = read(file).match(new RegExp(token, 'g')) || [];
      if (!matches.length) continue;
      occurrences += matches.length;
      fileCount += 1;
    }
    return { occurrences, fileCount };
  };

  return {
    scannedFiles: files.length,
    legacy: tokenStats('4457'),
    current: tokenStats('4660')
  };
}

function currentAuditDocLayoutStats() {
  const docsRootFiles = fs.readdirSync(path.join(repoRoot, 'docs'))
    .filter(file => /^FILTERTUBE_.*\.md$/.test(file));
  const auditFiles = fs.readdirSync(path.join(repoRoot, 'docs', 'audit'))
    .filter(file => /^FILTERTUBE_.*\.md$/.test(file));

  return {
    rootFilterTubeDocs: docsRootFiles.length,
    auditFilterTubeDocs: auditFiles.length
  };
}

function runtimeMissingLeadTokenStats() {
  const index = read(runtimeTestIndexPath);
  const rows = [...index.matchAll(/^\| (\d+) \| `([^`]+)` \| (\d+) \| `(yes|no)` \| (.*) \|$/gm)];
  const groups = new Map();

  for (const row of rows.filter(entry => entry[4] === 'no')) {
    const token = row[2]
      .replace(/^tests\/runtime\//, '')
      .replace(/-current-behavior\.test\.mjs$/, '')
      .split('-')[0];
    groups.set(token, (groups.get(token) || 0) + 1);
  }

  const entries = [...groups.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = entries.slice(0, 9);
  const topTotal = top.reduce((total, entry) => total + entry[1], 0);

  return {
    groupCount: entries.length,
    top,
    topTotal,
    remainder: rows.filter(entry => entry[4] === 'no').length - topTotal
  };
}

function domRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('dom-fallback-lifecycle') || stem.startsWith('dom-fallback-run-state')) return 'dom fallback lifecycle/run-state';
  if (stem.startsWith('dom-fallback-method')) return 'dom fallback methods';
  if (stem.startsWith('dom-fallback-selector') || stem.startsWith('dom-selector-instance')) return 'dom selector inventory';
  if (stem.startsWith('dom-extractors')) return 'dom extractor methods';
  if (stem.startsWith('dom-route') || stem.startsWith('dom-target')) return 'dom route/target source';
  if (stem.startsWith('dom-hide') || stem.startsWith('dom-broad') || stem.startsWith('dom-identity')) return 'dom hide/identity boundary';
  if (stem.startsWith('doms-html')) return 'dom fixture classification';

  return 'dom other';
}

function filterRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('filter-all-toggle')) return 'filter all toggle/list target';
  if (stem.startsWith('filter-logic-direct-renderer')) return 'filter direct-renderer rules';
  if (stem.startsWith('filter-engine')) return 'filter engine fixtures';
  if (stem.startsWith('filter-logic-method')) return 'filter logic methods';
  if (stem.startsWith('filter-logic-rule-field-effect')) return 'filter rule field effects';
  if (stem.startsWith('filter-logic-rule-path')) return 'filter rule paths';

  return 'filter other';
}

function identityRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('waterfall')) return 'identity waterfall/order';
  if (stem.includes('resolver')) return 'identity resolver/cache/fanout';
  if (stem.includes('effect-obligation')) return 'identity effect obligation';
  if (stem.includes('flow-diagram')) return 'identity flow diagrams';
  if (stem.includes('work-budget')) return 'identity work budget';

  return 'identity other';
}

function settingsRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('settings-refresh')) return 'settings refresh/fanout parity';
  if (stem.startsWith('settings-mode')) return 'settings mode/source matrix';
  if (stem.startsWith('settings-authority')) return 'settings authority/source';
  if (stem.startsWith('settings-shared-method')) return 'settings shared methods';

  return 'settings other';
}

function bridgeRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('bridge-injection')) return 'bridge injection methods';
  if (stem.startsWith('bridge-settings-listener')) return 'bridge settings listener/timer';
  if (stem.startsWith('bridge-settings-method')) return 'bridge settings methods';

  return 'bridge other';
}

function extensionRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('extension-asset')) return 'extension asset/data package';
  if (stem.startsWith('extension-icon')) return 'extension icon/logo parity';
  if (stem.startsWith('extension-ui-css')) return 'extension UI CSS/page state';

  return 'extension other';
}

function learnedRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('authority')) return 'learned identity authority';
  if (stem.includes('cache-persistence')) return 'learned map cache/persistence';
  if (stem.includes('write-entrypoint')) return 'learned map write entrypoint';

  return 'learned other';
}

function nanahRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('nanah-sync-adapter')) return 'nanah sync adapter';
  if (stem.startsWith('nanah-vendor-build')) return 'nanah vendor build';
  if (stem.startsWith('nanah-vendor-runtime-session')) return 'nanah vendor runtime session';

  return 'nanah other';
}

function nativeRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('native-runtime-sync')) return 'native runtime sync';
  if (stem.startsWith('native-overlay')) return 'native overlay/fullscreen';

  return 'native other';
}

function quickRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('block-menu-affordance')) return 'quick block affordance';
  if (stem.includes('default-migration')) return 'quick block default migration';
  if (stem.includes('hover-lifecycle')) return 'quick block hover lifecycle/timer';

  return 'quick other';
}

function sourceRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem === 'source-boundary') return 'source boundary';
  if (stem.startsWith('source-of-truth')) return 'source of truth claims';
  if (stem === 'source-surface') return 'source surface inventory';
  if (stem.startsWith('source-tier')) return 'source tier/effect authority';

  return 'source other';
}

function stateRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('state-manager-method')) return 'state manager methods';
  if (stem.startsWith('state-manager-request-refresh')) return 'state manager request refresh';
  if (stem.startsWith('state-manager-storage-reload')) return 'state manager storage reload';

  return 'state other';
}

function uiRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('ui-components-method')) return 'UI components methods';
  if (stem.startsWith('ui-components-portal')) return 'UI components portal lifecycle';
  if (stem.startsWith('ui-row-list-mode')) return 'UI row/list-mode authority';
  if (stem.startsWith('ui-settings-callable')) return 'UI settings callable';

  return 'UI other';
}

function backupRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('download-blob-url')) return 'backup download blob URL lifecycle';
  if (stem.includes('export-authority')) return 'backup export authority';
  if (stem.includes('nanah-trusted-state')) return 'backup Nanah trusted state';

  return 'backup other';
}

function buildRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('release-method')) return 'build release methods';
  if (stem.includes('website-callable')) return 'build/website callable';

  return 'build other';
}

function collabRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('lifecycle')) return 'collab dialog lifecycle';
  if (stem.includes('method-semantic')) return 'collab dialog methods';

  return 'collab other';
}

function compiledRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('cache-authority')) return 'compiled cache authority';
  if (stem.includes('profile-list-mode')) return 'compiled profile/list-mode assembly';
  if (stem.includes('field-register')) return 'compiled settings fields';

  return 'compiled other';
}

function generatedRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('local-output')) return 'generated local output/dependency surface';
  if (stem.includes('ui-shell')) return 'generated UI shell methods';

  return 'generated other';
}

function ignoredRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('local-planning')) return 'ignored local planning text';
  if (stem.includes('root-evidence')) return 'ignored root evidence corpus';
  if (stem.includes('whitelist-bundle')) return 'ignored whitelist bundle';

  return 'ignored other';
}

function injectorRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('main-world-message')) return 'injector main-world message dispatch';
  if (stem.includes('method-semantic')) return 'injector methods';
  if (stem.includes('settings-capability')) return 'injector settings capability';

  return 'injector other';
}

function legacyRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('method-semantic')) return 'legacy layout methods';
  if (stem.includes('quarantine-package')) return 'legacy layout quarantine package';

  return 'legacy other';
}

function mainRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('filter-all-comments')) return 'main comments/filter-all scope';
  if (stem.includes('compact-radio')) return 'main compact/radio authority';
  if (stem.includes('collab') || stem.includes('community')) return 'main collab/community fixtures';
  if (stem.includes('search')) return 'main search fixtures';
  if (stem.includes('guide') || stem.includes('home') || stem.includes('next-reload')) return 'main guide/home/next fixtures';
  if (stem.includes('watch') || stem.includes('upnext')) return 'main watch/upnext/end-screen fixtures';

  return 'main other';
}

function p0RuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('mutation')) return 'P0 mutation authority';
  if (stem.includes('capture-fixture') || stem.includes('family-proof') || stem.includes('fixture-gate')) return 'P0 fixture/gate traceability';
  if (stem.includes('dom-renderer') || stem.includes('renderer-authority') || stem.includes('selector-authority')) return 'P0 renderer/selector authority';
  if (stem.includes('endpoint') || stem.includes('external-navigation') || stem.includes('network-authority')) return 'P0 endpoint/network/navigation authority';
  if (stem.includes('optimization')) return 'P0 optimization metrics/route surface';
  if (stem.includes('obligation')) return 'P0 obligation/readiness gate';
  if (stem.includes('manifest') || stem.includes('release-package')) return 'P0 manifest/release package';
  if (stem.includes('hide-restore') || stem.includes('keyword-match')) return 'P0 hide/keyword behavior';
  if (stem.includes('backup-export')) return 'P0 backup/export';
  if (stem.includes('compiled-rule-state')) return 'P0 compiled rule state';
  if (stem.includes('content-category')) return 'P0 content/category';
  if (stem.includes('learned-identity')) return 'P0 learned identity';
  if (stem.includes('lifecycle')) return 'P0 lifecycle';
  if (stem.includes('native-runtime-sync')) return 'P0 native runtime sync';
  if (stem.includes('no-work')) return 'P0 no-work';
  if (stem.includes('profile-viewing-space')) return 'P0 profile/viewing-space';
  if (stem.includes('prompt-onboarding')) return 'P0 prompt onboarding';
  if (stem.includes('security-pin-lock')) return 'P0 security PIN lock';
  if (stem.includes('stats-time-saved')) return 'P0 stats/time saved';
  if (stem.includes('storage-cache')) return 'P0 storage/cache';
  if (stem.includes('watch-player')) return 'P0 watch/player';

  return 'P0 other';
}

function popupRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('lifecycle-selector')) return 'popup lifecycle selector';
  if (stem.includes('method-semantic')) return 'popup methods';

  return 'popup other';
}

function promptRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('onboarding-authority')) return 'prompt onboarding authority';
  if (stem.includes('method-semantic')) return 'prompt onboarding methods';
  if (stem.includes('release-overlay')) return 'prompt release overlay';

  return 'prompt other';
}

function releaseRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('build-artifact')) return 'release build artifact claims';
  if (stem.includes('notes-json')) return 'release notes JSON version gate';
  if (stem.includes('package-parity')) return 'release package parity';

  return 'release other';
}

function rootRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('evidence-source')) return 'root evidence source taxonomy';
  if (stem.includes('package-metadata')) return 'root package metadata/script surface';
  if (stem.includes('planning-doc')) return 'root planning doc boundary';

  return 'root other';
}

function securityRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('crypto-payload')) return 'security crypto payload';
  if (stem.includes('manager-method')) return 'security manager methods';
  if (stem.includes('pin-lock-authority')) return 'security PIN lock authority';

  return 'security other';
}

function staticRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('generated-vendor')) return 'static generated/vendor';
  if (stem.includes('html-support')) return 'static HTML support scripts';

  return 'static other';
}

function storageRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('access-callsite')) return 'storage access callsites';
  if (stem.includes('key-authority')) return 'storage key authority';
  if (stem.includes('payload-quota')) return 'storage payload quota';

  return 'storage other';
}

function tabRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('lifecycle-selector')) return 'tab view lifecycle selector';
  if (stem.includes('method-semantic')) return 'tab view methods';

  return 'tab other';
}

function trackedRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('audit-coverage')) return 'tracked file audit coverage';
  if (stem.includes('obligation-index')) return 'tracked file obligation index';
  if (stem.includes('public-doc-claim')) return 'tracked public doc claim surface';

  return 'tracked other';
}

function videoRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('video-info')) return 'video info DOM cleanup';
  if (stem.includes('video-sidebar')) return 'video sidebar DOM cleanup';

  return 'video other';
}

function watchRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('endscreen')) return 'watch end-screen authority';
  if (stem.includes('embedded-post')) return 'watch page embedded post renderer';
  if (stem.includes('player-control')) return 'watch player control authority';
  if (stem.includes('playlist-panel')) return 'watch playlist panel DOM cleanup';

  return 'watch other';
}

function activeRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('goal-completion')) return 'active goal completion';
  if (stem.includes('rule-authority')) return 'active rule authority';

  return 'active other';
}

function addRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('filtered-channel-filter-all-comments')) return 'addFilteredChannel Filter All comments default';

  return 'add other';
}

function aliasRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('ingress-preservation')) return 'alias ingress preservation';

  return 'alias other';
}

function batchRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('whitelist-import-persistence')) return 'batch whitelist import persistence';

  return 'batch other';
}

function blockRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('channel-method')) return 'block channel methods';

  return 'block other';
}

function browserRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('manifest-runtime-load-order')) return 'browser manifest runtime load order';

  return 'browser other';
}

function jsonRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('json-comment-')) return 'comment provenance/parity';
  if (stem.startsWith('json-first-network-snapshot-')) return 'network snapshot';
  if (stem.startsWith('json-first-route-surface-fixture-')) return 'route/surface fixture contract';
  if (stem.startsWith('json-first-route-surface-metric-')) return 'route/surface metric contract';
  if (stem.startsWith('json-first-route-surface-implementation-')) return 'route/surface implementation boundary';
  if (stem.startsWith('json-first-video-meta-')) return 'video metadata';
  if (stem.startsWith('json-first-hide-') || stem.startsWith('json-first-disable-')) return 'feature hide/toggle boundary';
  if (stem.startsWith('json-first-')) return 'core policy/contract';

  return 'coverage/path authority';
}

function runtimeJsonFamilyStats() {
  const index = read(runtimeTestIndexPath);
  const rows = [...index.matchAll(/^\| (\d+) \| `([^`]+)` \| (\d+) \| `(yes|no)` \| (.*) \|$/gm)]
    .map(row => ({
      file: row[2],
      tests: Number(row[3]),
      exact: row[4]
    }))
    .filter(row => row.file.startsWith('tests/runtime/json'));
  const familyMap = new Map();

  for (const row of rows) {
    const family = jsonRuntimeFamily(row.file);
    const current = familyMap.get(family) || { files: 0, tests: 0, yes: 0, no: 0 };
    current.files += 1;
    current.tests += row.tests;
    current[row.exact] += 1;
    familyMap.set(family, current);
  }

  return {
    files: rows.length,
    tests: rows.reduce((total, row) => total + row.tests, 0),
    yes: rows.filter(row => row.exact === 'yes').length,
    no: rows.filter(row => row.exact === 'no').length,
    families: [...familyMap.entries()]
      .sort((a, b) => b[1].no - a[1].no || b[1].files - a[1].files || a[0].localeCompare(b[0]))
  };
}

function contentRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('content-bridge-collaborator-')) return 'content bridge collaborator';
  if (stem.startsWith('content-bridge-menu-')) return 'content bridge menu';
  if (stem.startsWith('content-bridge-')) return 'content bridge lifecycle/message';
  if (stem.startsWith('content-control-')) return 'content control';
  if (stem.startsWith('content-controls-')) return 'content controls catalog';
  if (stem.startsWith('content-direct-')) return 'content direct identity';
  if (stem.startsWith('content-helper-')) return 'content helper callable';
  if (stem.startsWith('content-menu-')) return 'content menu method';
  if (stem.startsWith('content-category-')) return 'content category predicate';

  return 'content other';
}

function runtimeContentFamilyStats() {
  const index = read(runtimeTestIndexPath);
  const rows = [...index.matchAll(/^\| (\d+) \| `([^`]+)` \| (\d+) \| `(yes|no)` \| (.*) \|$/gm)]
    .map(row => ({
      file: row[2],
      tests: Number(row[3]),
      exact: row[4]
    }))
    .filter(row => row.file.startsWith('tests/runtime/content'));
  const familyMap = new Map();

  for (const row of rows) {
    const family = contentRuntimeFamily(row.file);
    const current = familyMap.get(family) || { files: 0, tests: 0, yes: 0, no: 0 };
    current.files += 1;
    current.tests += row.tests;
    current[row.exact] += 1;
    familyMap.set(family, current);
  }

  return {
    files: rows.length,
    tests: rows.reduce((total, row) => total + row.tests, 0),
    yes: rows.filter(row => row.exact === 'yes').length,
    no: rows.filter(row => row.exact === 'no').length,
    families: [...familyMap.entries()]
      .sort((a, b) => b[1].no - a[1].no || b[1].files - a[1].files || a[0].localeCompare(b[0]))
  };
}

function backgroundRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('identity') || stem.includes('script-injection')) return 'background identity/network/script trust';
  if (stem.includes('message') || stem.includes('method')) return 'background message/method authority';
  if (stem.includes('backup') || stem.includes('compiled-cache')) return 'background scheduler/cache lifecycle';
  if (stem.includes('add-filtered-channel')) return 'background rule/list mutation';

  return 'background other';
}

function websiteRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.startsWith('website-route-')) return 'website route/build surface';
  if (stem.includes('client-lifecycle')) return 'website client lifecycle';
  if (stem.includes('dynamic-route-method')) return 'website dynamic route methods';
  if (stem.includes('package-config')) return 'website package/dependency surface';
  if (stem.includes('remote-request')) return 'website remote request boundary';

  return 'website other';
}

function seedRuntimeFamily(file) {
  const stem = file
    .replace(/^tests\/runtime\//, '')
    .replace(/-current-behavior\.test\.mjs$/, '');

  if (stem.includes('no-work-list-mode')) return 'seed no-work/list-mode';
  if (stem.includes('initial-global')) return 'seed initial global';
  if (stem.includes('method-semantic')) return 'seed method semantics';
  if (stem.includes('network')) return 'seed network fixtures';
  if (stem.includes('page-global-patch')) return 'seed page global patch';
  if (stem.includes('settings-replay')) return 'seed settings replay';

  return 'seed other';
}

function runtimePrefixFamilyStats(prefix, classify) {
  const index = read(runtimeTestIndexPath);
  const rows = [...index.matchAll(/^\| (\d+) \| `([^`]+)` \| (\d+) \| `(yes|no)` \| (.*) \|$/gm)]
    .map(row => ({
      file: row[2],
      tests: Number(row[3]),
      exact: row[4]
    }))
    .filter(row => row.file.startsWith(`tests/runtime/${prefix}`));
  const familyMap = new Map();

  for (const row of rows) {
    const family = classify(row.file);
    const current = familyMap.get(family) || { files: 0, tests: 0, yes: 0, no: 0 };
    current.files += 1;
    current.tests += row.tests;
    current[row.exact] += 1;
    familyMap.set(family, current);
  }

  return {
    files: rows.length,
    tests: rows.reduce((total, row) => total + row.tests, 0),
    yes: rows.filter(row => row.exact === 'yes').length,
    no: rows.filter(row => row.exact === 'no').length,
    families: [...familyMap.entries()]
      .sort((a, b) => b[1].no - a[1].no || b[1].files - a[1].files || a[0].localeCompare(b[0]))
  };
}

function assertReleaseHotPathProofStackAddendum(source) {
  const releaseSlices = [
    {
      label: 'Lifecycle hot path',
      path: 'docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md',
      rows: 17,
      proof: /release hot-path lifecycle semantic rows: 17/
    },
    {
      label: 'Settings mode hot path',
      path: 'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md',
      rows: 9,
      proof: /release settings-mode semantic rows: 9/
    },
    {
      label: 'Network JSON no-work',
      path: 'docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
      rows: 9,
      proof: /release network no-work semantic rows: 9/
    },
    {
      label: 'DOM selector hot path',
      path: 'docs/audit/FILTERTUBE_DOM_SELECTOR_INSTANCE_REGISTER_2026-05-18.md',
      rows: 12,
      proof: /release hot-path selector rows: 12/
    },
    {
      label: 'Cross-feature hot path',
      path: 'docs/audit/FILTERTUBE_CROSS_FEATURE_AUTHORITY_MATRIX_2026-05-18.md',
      rows: 5,
      proof: /release cross-feature interaction rows: 5/
    },
    {
      label: 'Method semantic triage',
      path: 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
      rows: 13,
      proof: /selected release hot-path semantic triage rows: 13/
    }
  ];
  const totalRows = releaseSlices.reduce((total, slice) => total + slice.rows, 0);

  assert.match(source, /Release Hot-Path Proof Stack Addendum - 2026-05-27/);
  assert.match(source, /2026-05-27 release hot-path checkpoint/);
  assert.match(source, /source behavior inspected after lag\/menu\/blocklist fixes/);
  assert.match(source, /five release proof slices plus method semantic triage/);
  assert.match(source, /flowchart TD/);
  assert.match(source, /Settings and mode gates/);
  assert.match(source, /No-work JSON transport gate/);
  assert.match(source, /Blocklist and whitelist behavior remains release-tested/);
  assert.match(source, /release hot-path proof slices: 6/);
  assert.match(source, new RegExp(`release hot-path documented rows: ${totalRows}`));
  assert.match(source, /runtime behavior changed by this addendum: no/);
  assert.match(source, /full codebase audit completion from this stack: NO-GO/);
  assert.match(source, /JSON-first promotion approval from this stack: NO-GO/);
  assert.match(source, /what changed and why it matters/);

  for (const slice of releaseSlices) {
    assert.ok(source.includes(`| ${slice.label} |`), `missing proof-stack row for ${slice.label}`);
    assert.ok(source.includes(`\`${slice.path}\``), `missing proof-stack path for ${slice.path}`);
    assert.match(read(slice.path), slice.proof);
  }

  for (const phrase of [
    'Empty/no-useful rules',
    'Whitelist pending-hide',
    'Network JSON transport',
    'Visible blocklist refresh',
    'Main keyword alias',
    'Native/comment menus',
    'Topic bylines',
    'No-work gates short-circuit seed/injector JSON work',
    'Storage refresh coalescing preserves `forceReprocess`',
    'Background compilation prefers `main.keywords`',
    'Close handling repairs stale FilterTube hidden state',
    'Collaborator parsing no longer treats `&` as a collaborator separator',
    'Kully B & Gussy G - Topic'
  ]) {
    assert.ok(source.includes(phrase), `missing release behavior checkpoint phrase: ${phrase}`);
  }

  assert.match(source, /2026-05-28 topic stale collaborator state continuation/);
  assert.match(source, /same-video `data-filtertube-collaborators` attrs/);
  assert.match(source, /topic stale collaborator state\s+rows: 5/);
  assert.match(source, /topic stale ampersand-topic guard rows:\s+4/);
  assert.match(source, /topic stale\s+action-layer trust rows: 0/);
  assert.match(source, /topic stale installed-tab parity status:\s+MISSING/);
  assert.match(source, /topic stale collaborator state risk:\s+GATED_FOR_NAME_ONLY_AMPERSAND_TOPIC/);
  assert.match(source, /Runtime behavior\s+changed by this continuation: yes/);
  assert.match(source, /2026-05-28 collaborator cache provenance readiness continuation/);
  assert.match(source, /same-video literal ampersand Topic name-only rosters/);
  assert.match(source, /Block All cleanup branch deletes only under a `!has\(videoId\)`\s+guard/);
  assert.match(source, /collaborator cache provenance readiness rows:\s+7/);
  assert.match(source, /collaborator cache\s+ampersand-topic guard rows: 1/);
  assert.match(source, /collaborator cache\s+source-label write-only rows: 2/);
  assert.match(source, /collaborator cache stale-delete no-op rows:\s+1/);
  assert.match(source, /collaborator cache\s+provenance validation rows: 1/);
  assert.match(source, /collaborator\s+cache provenance risk:\s+PARTIAL/);
  assert.match(source, /Runtime behavior changed by this continuation:\s+yes/);
  assert.match(source, /2026-05-29 installed Topic menu parity continuation/);
  assert.match(source, /data-filtertube-collab-state="resolved"/);
  assert.match(source, /installed Topic menu parity rows:\s+5/);
  assert.match(source, /installed Topic menu live DOM shape:\s+OBSERVED_BY_USER/);
  assert.match(source, /ampersand Topic reader guard status:\s+PRESENT/);
  assert.match(source, /collaborator writer grammar authority:\s+NO-GO/);
  assert.match(source, /quick-block Topic parity proof:\s+PARTIAL_GO/);
  assert.match(source, /menu renderer Topic parity proof:\s+PARTIAL_GO_SOURCE/);
  assert.match(source, /installed-tab byte parity trace:\s+MISSING/);
  assert.match(source, /Runtime behavior changed by this\s+continuation: yes/);
  assert.match(source, /2026-05-29 Topic writer-side readiness continuation/);
  assert.match(source, /applyResolvedCollaborators\(\)/);
  assert.match(source, /applyCollaboratorsByVideoId\(\)/);
  assert.match(source, /Topic writer-side\s+readiness rows:\s+6/);
  assert.match(source, /writer-side reusable guard available:\s+PRESENT/);
  assert.match(source, /applyResolved writer guard\s+status:\s+PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(source, /applyByVideoId writer guard\s+status:\s+PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(source, /renderer hydration writer guard\s+status:\s+PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(source, /cache-result writer guard\s+status:\s+PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(source, /action-layer patch as primary\s+fix:\s+NO-GO/);
  assert.match(source, /narrow runtime patch approval from this addendum:\s+USED_2026_05_29/);
  assert.match(source, /Runtime behavior changed by this continuation:\s+yes/);
  assert.match(source, /stale collaborator-shaped quick-block action:\s+SINGLE_CHANNEL_AFTER_TOPIC_GUARD/);
  assert.match(source, /quick-block full Topic parity authority:\s+PARTIAL_GO/);
  assert.match(source, /2026-05-29 Topic menu renderer parity report contract continuation/);
  assert.match(source, /clean primary-menu,\s+clean old-menu, stale attr cleanup, stale resolved-cache cleanup, placeholder,\s+true-collab positive, single-channel `and` negative, quick-block crosscheck,\s+installed-tab trace, and release-gate rows/);
  assert.match(source, /Topic menu renderer\s+parity contract rows: 10/);
  assert.match(source, /required Topic menu renderer parity fields: 20/);
  assert.match(source, /implementation-ready Topic menu renderer rows: 7/);
  assert.match(source, /runtime Topic menu\s+renderer approvals: 1/);
  assert.match(source, /menu renderer Topic parity proof from contract:\s+PARTIAL_GO_SOURCE/);
  assert.match(source, /Runtime behavior\s+changed by this contract: yes/);
  assert.match(source, /2026-05-30 installed Topic reload parity gap continuation/);
  assert.ok(source.includes(collaboratorIdentityPromotionPath));
  assert.match(source, /source tests prove\s+`Kully B & Gussy G - Topic` stays a single Topic channel label/);
  assert.match(source, /already-open\s+YouTube document can still show collaborator-shaped Topic state/);
  assert.match(source, /installed Topic\s+reload parity rows: 4/);
  assert.match(source, /source-focused Topic guard tests: PASS/);
  assert.match(source, /installed\s+reloaded-tab byte trace: MISSING/);
  assert.match(source, /uncovered writer-path proof: MISSING/);
  assert.match(source, /menu-layer grammar fix approval: NO-GO/);
  assert.match(source, /Runtime behavior changed by reload\s+parity addendum: no/);
  assert.match(source, /2026-05-30 Topic writer-path source census continuation/);
  assert.match(source, /writer and near-writer paths that can stamp\s+or preserve collaborator-shaped state/);
  assert.match(source, /Topic writer-path source census rows:\s+9/);
  assert.match(source, /DOM collaborator attr writer rows covered:\s+6/);
  assert.match(source, /resolved-map writer rows\s+covered: 5/);
  assert.match(source, /entrypoint funnel rows covered:\s+3/);
  assert.match(source, /known content_bridge DOM\s+attr writer coverage: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(source, /uncovered\s+writer-path proof from source census: PARTIAL_SOURCE_CENSUS/);
  assert.match(source, /runtime behavior changed by writer-path\s+census addendum: no/);
  assert.match(source, /narrows but does not close installed-tab parity/);
  assert.match(source, /2026-05-30 ampersand Topic root-cause boundary continuation/);
  assert.match(source, /false menu requires upstream collaborator-shaped state/);
  assert.match(source, /ampersand Topic root-cause\s+rows: 5/);
  assert.match(source, /menu root-cause status: DOWNSTREAM_RENDERER_NOT_CLASSIFIER/);
  assert.match(source, /current source fresh parser status: NO_PLAIN_AMPERSAND_SPLIT/);
  assert.match(source, /current source\s+stale name-only roster status: REJECTED_FOR_VISIBLE_TOPIC_LABEL/);
  assert.match(source, /true\s+collaborator preservation status: STRONGER_EVIDENCE_STILL_ADMITTED/);
  assert.match(source, /runtime behavior changed by root-cause addendum: no/);
  assert.match(source, /2026-05-30 installed Chrome DOM evidence boundary continuation/);
  assert.match(source, /live connected-profile DOM evidence without\s+claiming installed source-byte parity/);
  assert.match(source, /sampled URL\s+`https:\/\/www\.youtube\.com\/watch\?v=aJOTlE1K90k`/);
  assert.match(source, /301 FilterTube-stamped DOM\s+nodes/);
  assert.match(source, /236 `data-filtertube-video-id` attrs/);
  assert.match(source, /235 processed card attrs/);
  assert.match(source, /20\s+hidden attrs/);
  assert.match(source, /4 quick-block event wrapper attrs/);
  assert.match(source, /0 collaborator attrs observed\s+in the sampled Maroon 5 watch tab/);
  assert.match(source, /installed Chrome extension activity status\s+`OBSERVED_DOM_STAMPS`/);
  assert.match(source, /source resource probe\s+`BLOCKED_BY_BROWSER_POLICY`/);
  assert.match(source, /source byte parity status `NOT_PROVED`/);
  assert.match(source, /runtime behavior changed by installed Chrome DOM evidence addendum: no/);
  assert.match(source, /Installed source byte parity, the `Kully B & Gussy G - Topic` live negative\s+fixture/);
  assert.match(source, /2026-05-30 ampersand Topic cross-feature matrix linkage/);
  assert.match(source, /FILTERTUBE_CROSS_FEATURE_AUTHORITY_MATRIX_2026-05-18\.md/);
  assert.match(source, /Ampersand Topic Single-Channel Collaborator Boundary - 2026-05-30/);
  assert.match(source, /parser evidence gating, name-only writer rejection, menu single-channel\s+normalization, identity normalization, quick-block candidate stripping/);
  assert.match(source, /ampersand Topic boundary rows: 6/);
  assert.match(source, /literal `Kully B & Gussy G - Topic`\s+without avatar stack\/two links\/N-more: single-channel/);
  assert.match(source, /stale name-only\s+ampersand Topic roster behavior:\s+clear-or-reject-before-writer-menu-quick-block/);
  assert.match(source, /true collaborator behavior\s+changed by this addendum: no/);
  assert.match(source, /runtime behavior changed by this addendum: no/);
  assert.match(source, /collaborator JSON-first authority promotion: NO-GO/);
  assert.match(source, /installed open-tab parity\s+proof: still required/);
  assert.match(source, /release\/public-claim use: NO-GO/);
  assert.match(source, /Runtime behavior\s+changed by this linkage: no/);

  const collaboratorDoc = read(collaboratorIdentityPromotionPath);
  assert.match(collaboratorDoc, /Installed Topic Reload Parity Gap Addendum - 2026-05-30/);
  assert.match(collaboratorDoc, /installed Topic reload parity rows: 4/);
  assert.match(collaboratorDoc, /source-focused Topic guard tests: PASS/);
  assert.match(collaboratorDoc, /runtime behavior changed by reload parity addendum: no/);
  assert.match(collaboratorDoc, /Topic Writer-Path Source Census Addendum - 2026-05-30/);
  assert.match(collaboratorDoc, /Topic writer-path source census rows: 9/);
  assert.match(collaboratorDoc, /uncovered writer-path proof from source census: PARTIAL_SOURCE_CENSUS/);

  const methodGapDoc = read('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md');
  assert.match(methodGapDoc, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGapDoc, /repo-wide behavior-change approval from method proof: NO-GO/);
  assert.match(methodGapDoc, /selected visual-writer semantic triage rows: 8/);
  assert.match(methodGapDoc, /selected collaborator-cache semantic triage rows: 7/);
  assert.match(methodGapDoc, /selected native-dropdown lifecycle semantic triage rows: 12/);
  assert.match(methodGapDoc, /selected JSON active-work semantic triage rows: 12/);
  assert.match(methodGapDoc, /selected rule\/settings mutation persistence semantic triage rows: 13/);
  assert.match(methodGapDoc, /selected DOM fallback run\/selector traversal semantic triage rows: 12/);
  assert.match(methodGapDoc, /selected content-bridge runtime lifecycle semantic triage rows: 13/);
  assert.match(methodGapDoc, /selected background compiled-cache\/refresh semantic triage rows: 14/);
  assert.match(methodGapDoc, /selected quick-block affordance lifecycle semantic triage rows: 20/);
  assert.match(methodGapDoc, /visual hide\/stats\/media policy approved for behavior change: NO-GO/);
  assert.match(methodGapDoc, /container restore authority approved: NO-GO/);
  assert.match(methodGapDoc, /Collaborator Cache Provenance Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /collaborator cache provenance validation approved: NO-GO/);
  assert.match(methodGapDoc, /collaborator stale-state invalidation approved: PARTIAL_FOR_NAME_ONLY_AMPERSAND_TOPIC/);
  assert.match(methodGapDoc, /Native Dropdown\/Menu Lifecycle Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /native dropdown lifecycle optimization approved: NO-GO/);
  assert.match(methodGapDoc, /native reusable-node menu state authority approved: NO-GO/);
  assert.match(methodGapDoc, /JSON Active-Work Predicate Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /shared JSON active-work predicate authority approved: NO-GO/);
  assert.match(methodGapDoc, /JSON-first predicate merge optimization approved: NO-GO/);
  assert.match(methodGapDoc, /JSON-first first-class runtime promotion approved: NO-GO/);
  assert.match(methodGapDoc, /Rule\/Settings Mutation Persistence Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /rule mutation persistence optimization approved: NO-GO/);
  assert.match(methodGapDoc, /blocklist\/whitelist mutation authority approved: NO-GO/);
  assert.match(methodGapDoc, /cross-context settings refresh authority approved: NO-GO/);
  assert.match(methodGapDoc, /DOM Fallback Run\/Selector Traversal Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /DOM fallback run admission optimization approved: NO-GO/);
  assert.match(methodGapDoc, /DOM selector traversal narrowing approved: NO-GO/);
  assert.match(methodGapDoc, /DOM fallback hide\/restore behavior change approved: NO-GO/);
  assert.match(methodGapDoc, /Content Bridge Runtime Lifecycle Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /content-bridge lifecycle pruning approved: NO-GO/);
  assert.match(methodGapDoc, /content-bridge observer\/listener\/timer cleanup approved: NO-GO/);
  assert.match(methodGapDoc, /content-bridge prefetch\/whitelist pending budget authority approved: NO-GO/);
  assert.match(methodGapDoc, /Background Compiled-Cache\/Refresh Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /background compiled-cache authority approved: NO-GO/);
  assert.match(methodGapDoc, /background refresh delivery optimization approved: NO-GO/);
  assert.match(methodGapDoc, /learned-map cache patching authority approved: NO-GO/);
  assert.match(methodGapDoc, /Quick-Block Affordance Lifecycle Semantic Addendum - 2026-05-28/);
  assert.match(methodGapDoc, /quick-block affordance availability optimization approved: NO-GO/);
  assert.match(methodGapDoc, /quick-block selector\/anchor rewrite approved: NO-GO/);
  assert.match(methodGapDoc, /quick-block mutation and optimistic-hide behavior change approved: NO-GO/);
  assert.match(source, /DOM visual-writer continuation/);
  assert.match(source, /8 source-pinned `js\/content\/dom_helpers\.js` rows/);
  assert.match(source, /visual\s+hide\/stats\/media policy and container restore authority at `NO-GO`/);
  assert.match(source, /collaborator cache provenance continuation/);
  assert.match(source, /6 source-pinned `js\/content_bridge\.js` rows/);
  assert.match(source, /Kully B &\s+Gussy G - Topic/);
  assert.match(source, /collaborator cache\s+provenance validation and stale-state invalidation at `NO-GO`/);
  assert.match(source, /native dropdown\/menu lifecycle continuation/);
  assert.match(source, /12 source-pinned `js\/content_bridge\.js` and\s+`js\/content\/block_channel\.js` rows/);
  assert.match(source, /comment\/native 3-dot menu\s+regression/);
  assert.match(source, /native dropdown lifecycle optimization and reusable\s+menu state authority at `NO-GO`/);
  assert.match(source, /JSON active-work predicate continuation/);
  assert.match(source, /12 source-pinned `js\/seed\.js`, `js\/injector\.js`,\s+`js\/content_bridge\.js`, and `js\/filter_logic\.js` rows/);
  assert.match(source, /strict\s+content-filter admission, JSON rule branches, route\/layout skip policy/);
  assert.match(source, /filter-engine harvest-before-mutate\s+behavior/);
  assert.match(source, /shared JSON active-work authority, predicate merge\s+optimization, and JSON-first runtime promotion at `NO-GO`/);
  assert.match(source, /rule\/settings mutation persistence continuation/);
  assert.match(source, /13 source-pinned `js\/state_manager\.js`,\s+`js\/settings_shared\.js`, `js\/background\.js`, `js\/content_bridge\.js`, and\s+`js\/io_manager\.js` rows/);
  assert.match(source, /mode-inferred keyword\/channel writes,\s+dual-schema profile persistence, subscribed-channel import handoff/);
  assert.match(source, /blocklist, channel blocking, and whitelist behavior/);
  assert.match(source, /rule\s+mutation persistence, blocklist\/whitelist mutation authority, and\s+cross-context settings refresh authority at `NO-GO`/);
  assert.match(source, /DOM fallback run\/selector traversal continuation/);
  assert.match(source, /12 source-pinned `js\/content\/dom_fallback\.js` rows/);
  assert.match(source, /active-work admission, stale marker cleanup, run-state serialization/);
  assert.match(source, /main card selector scope, processed identity skip gates, channel\s+identity selector waterfall/);
  assert.match(source, /YouTube lag and\s+false-hide\/leak risk/);
  assert.match(source, /DOM fallback run\s+admission optimization, selector traversal narrowing, and hide\/restore\s+behavior changes at `NO-GO`/);
  assert.match(source, /content-bridge runtime lifecycle continuation/);
  assert.match(source, /13 source-pinned `js\/content_bridge\.js` rows/);
  assert.match(source, /identity\s+prefetch scan scheduling, IntersectionObserver card attachment, document\s+visibility listeners/);
  assert.match(source, /whitelist pending recheck and pending-hide\s+timers, DOM fallback observer refresh, fallback menu scan lifecycle/);
  assert.match(source, /SPA lag and whitelist\s+pending behavior/);
  assert.match(source, /content-bridge\s+lifecycle pruning, observer\/listener\/timer cleanup, and prefetch\/whitelist\s+pending budget authority at `NO-GO`/);
  assert.match(source, /background compiled-cache\/refresh continuation/);
  assert.match(source, /14 source-pinned `js\/background\.js` rows/);
  assert.match(source, /compiled-settings\s+cache shape, learned channel\/video\/meta map cache patching, storage flush\s+scheduling/);
  assert.match(source, /list-mode transitions, whitelist import and\s+transfer refreshes, `FilterTube_ApplySettings` recompile broadcasts/);
  assert.match(source, /stale visible-card, SPA refresh, and\s+post-whitelist cache risk/);
  assert.match(source, /compiled-cache\s+authority, refresh delivery optimization, and learned-map cache\s+patching authority at `NO-GO`/);
  assert.match(source, /quick-block affordance lifecycle continuation/);
  assert.match(source, /20 source-pinned `js\/content\/block_channel\.js` rows/);
  assert.match(source, /quick-block refresh admission, lazy observer startup, disabled\/whitelist\s+cleanup, desktop hover intent/);
  assert.match(source, /Shorts surface detection, host and anchor\s+resolution, bounded target lookup, first-rule mode gating/);
  assert.match(source, /fallback mutation ingress,\s+optimistic hide writes, button wrap\/listener insertion/);
  assert.match(source, /missing quick-cross, Shorts\/Home placement, and\s+no-work desktop lag risk/);
  assert.match(source, /quick-block\s+availability optimization, selector\/anchor rewrites, and mutation\/optimistic\s+hide behavior changes at `NO-GO`/);
  assert.match(source, /2026-05-31 Home\/Shorts quick-cross placement preflight/);
  assert.match(source, /6 source-pinned placement rows/);
  assert.match(source, /nested Shorts target detection, outer-host promotion, renderable anchor\s+selection, desktop hover-lazy placement, mobile\/coarse force-visible\s+placement, and release gating/);
  assert.match(source, /desktop Home\/Shorts quick-cross\s+display is hover\/focus\/pointer-recovery behavior today, not an always-visible\s+startup guarantee/);
  assert.match(source, /live installed Home\/Shorts placement proof and\s+placement behavior-change approval remain `NO-GO`/);
  assert.match(source, /2026-05-30 method semantic convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/all-callable-index-current-behavior.test.mjs'));
  assert.match(source, /10 method semantic convergence rows across repo\s+census, zero complete files, family weight, hot runtime dominance, selected\s+triage-not-closure, required field gate, parser visibility debt,\s+affected-callable packet gap, JSON-first blocker, and authority absence/);
  assert.match(source, /0 implementation-ready method semantic convergence rows, 149 selected\s+semantic triage rows, 4 rejected closure candidates, 0 affected-callable\s+semantic approvals/);
  assert.match(source, /source-derived ASCII and Mermaid diagrams/);
  assert.match(source, /product\s+source absence for `methodSemanticCoverageComplete`,\s+`callableBehaviorProofReady`, `behaviorPatchMayProceed`,\s+`methodSemanticAuthority`, `callableEffectReport`, `callableNoWorkBudget`, and\s+`callableTeardownRegistry`/);
  assert.match(source, /Method deletion, method merging,\s+affected-callable closure, whitelist\/cache method optimization, JSON-first\s+method promotion, release\/public-claim use, and broad audit completion remain\s+`NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no/);
  assert.match(methodGapDoc, /Method Semantic Convergence Boundary - 2026-05-30/);
  assert.match(methodGapDoc, /method semantic convergence rows: 10/);
  assert.match(methodGapDoc, /implementation-ready method semantic convergence rows: 0/);
  assert.match(methodGapDoc, /methodSemanticCoverageComplete product source symbol: absent/);
  assert.match(methodGapDoc, /method deletion approval: NO-GO/);
  assert.match(methodGapDoc, /JSON-first method promotion approval: NO-GO/);

  const engagementBudgetDoc = read('docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(source, /Engagement Side-Effect Token Snapshot Addendum - 2026-05-27/);
  assert.match(source, /pins 4 active `await fetch\(` tokens, 8\s+synthetic `\.click\(` tokens, 7 media pause\/stop tokens, 10 `dispatchEvent\(`/);
  assert.match(source, /passive filtering might look\s+like engagement to YouTube/);
  assert.match(source, /remain blocked until side-effect budgets have owner, route, rule, user-action,\s+dedupe, and max-per-navigation proof/);
  assert.match(engagementBudgetDoc, /Observable Side-Effect Token Snapshot - 2026-05-27/);
  assert.match(engagementBudgetDoc, /\| \*\*Total\*\* \| \*\*4\*\* \| \*\*8\*\* \| \*\*4\*\* \| \*\*1\*\* \| \*\*1\*\* \| \*\*1\*\* \| \*\*10\*\* \| \*\*1\*\* \| \*\*3\*\* \| \*\*4\*\* \|/);

  const networkRegisterDoc = read('docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md');
  assert.match(source, /Passive YouTubei Transport Token Snapshot Addendum - 2026-05-27/);
  assert.match(source, /pins 5 watched\s+YouTubei endpoint names in both the fetch and XHR endpoint arrays/);
  assert.match(source, /6 fetch\s+wrapper token rows, and 11 XHR wrapper token rows/);
  assert.match(source, /FilterTube was not issuing explicit product `fetch\(\.\.\.\)` requests/);
  assert.match(source, /passive transport approval at `NO-GO`/);
  assert.match(source, /preserve the no-work bypass before `response\.clone\(\)\.json\(\)`/);
  assert.match(source, /before XHR\s+`JSON\.parse`, and before queued initial-data replay/);
  assert.match(networkRegisterDoc, /Passive YouTubei Transport Patch Token Snapshot - 2026-05-27/);
  assert.match(networkRegisterDoc, /Fetch and XHR both watch the same 5 YouTubei endpoint families/);
  assert.match(networkRegisterDoc, /\| `originalFetch\.apply` \| 3 \|/);
  assert.match(networkRegisterDoc, /\| `originalRemoveEventListener` \| 4 \|/);
  assert.match(source, /YouTubei Endpoint Admission Owner Flow Addendum - 2026-05-27/);
  assert.match(source, /YouTubei endpoint admission owner-flow addendum with ASCII\s+and Mermaid diagrams/);
  assert.match(source, /pins fetch endpoint ownership, XHR endpoint\s+ownership, fetch URL\/dataName classification/);
  assert.match(source, /XHR open\/send marking, shared\s+active-work predicates, fetch response rebuild behavior, XHR parse\/override\s+behavior, and seed\/injector replay cleanup/);
  assert.match(source, /endpoint arrays admit only known YouTubei families/);
  assert.match(source, /active-work\s+gate must run before fetch clone\/parse, before XHR parse\/override, and before\s+queued replay/);
  assert.match(source, /YouTubei endpoint admission source proof is `PARTIAL`/);
  assert.match(source, /endpoint policy promotion, JSON-first endpoint ownership, response mutation\s+rewrites, and XHR patch simplification remain at `NO-GO`/);
  assert.match(source, /route, surface, settings revision, list mode, body\s+work, mutation effect, no-work proof, and negative sibling-visible proof/);
  assert.match(networkRegisterDoc, /YouTubei Endpoint Admission Owner Flow Addendum - 2026-05-27/);
  assert.match(networkRegisterDoc, /YouTubei endpoint admission owner rows: 8/);
  assert.match(networkRegisterDoc, /ASCII YouTubei endpoint admission flow diagram: present/);
  assert.match(networkRegisterDoc, /Mermaid YouTubei endpoint admission flow diagram: present/);
  assert.match(networkRegisterDoc, /YouTubei endpoint admission source proof: PARTIAL/);
  assert.match(networkRegisterDoc, /endpoint policy promotion approval from owner flow: NO-GO/);
  assert.match(networkRegisterDoc, /runtime behavior changed by this addendum: no/);
  assert.match(networkRegisterDoc, /flowchart TD/);
  assert.match(networkRegisterDoc, /\| `youtubei_fetch_endpoint_array_owner` \| `js\/seed\.js:667-673` \|/);
  assert.match(networkRegisterDoc, /\| `youtubei_xhr_marking_owner` \| `js\/seed\.js:924-950` \|/);
  assert.match(networkRegisterDoc, /\| `youtubei_active_work_owner` \| `js\/seed\.js:234-260`; `js\/injector\.js:185-188` \|/);
  assert.match(networkRegisterDoc, /\| `youtubei_replay_queue_owner` \| `js\/seed\.js:1002-1014`; `js\/injector\.js:1940-1944`; `js\/injector\.js:3412-3436` \|/);

  const storageRegisterDoc = read('docs/audit/FILTERTUBE_STORAGE_ACCESS_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md');
  assert.match(source, /Storage Cache Write-Pressure Addendum - 2026-05-27/);
  assert.match(source, /pins 40 write-capable storage rows, 33 direct\s+`local\.set` rows, 7 wrapper `writeStorage` rows/);
  assert.match(source, /3 storage-change listener\s+rows, and 8 map\/cache write labels/);
  assert.match(source, /spanning background, content bridge, and\s+IO\/Nanah owners/);
  assert.match(source, /Cache invalidation, map-only refresh behavior, dashboard\s+reload, import\/export writes, Nanah writes/);
  assert.match(source, /shared storage key authority\s+and write revision contract exist/);
  assert.match(storageRegisterDoc, /Storage Cache Write-Pressure Snapshot - 2026-05-27/);
  assert.match(storageRegisterDoc, /write-capable storage rows: 40/);
  assert.match(storageRegisterDoc, /\| `videoChannelMapFlushWrite` \| `js\/background\.js:1604:local\.set` \|/);
  assert.match(storageRegisterDoc, /\| `nanahChannelMapMergeWrite` \| `js\/io_manager\.js:1688:writeStorage` \|/);
  assert.match(source, /Storage Payload Shape and Owner Layer Addendum - 2026-05-27/);
  assert.match(source, /same 84 storage access rows are classified into 41 reads, 40 writes, and 3\s+listeners/);
  assert.match(source, /17 inline object writes, 15 named payload\s+writes, and 8 inline computed-key writes/);
  assert.match(source, /background has 27 read, 24 write, and 1 listener row/);
  assert.match(source, /content runtime has 5\s+read, 2 write, and 1 listener row/);
  assert.match(source, /Storage payload\/layer authority remains `NO-GO`/);
  assert.match(storageRegisterDoc, /Storage Payload Shape and Owner Layer Addendum - 2026-05-27/);
  assert.match(storageRegisterDoc, /storage access rows classified by payload shape: 84/);
  assert.match(storageRegisterDoc, /layered write owners: background 24, content-runtime 2, io-import-export 8, ui-settings 6/);
  assert.match(storageRegisterDoc, /\| `named-payload-write` \| 15 \|/);
  assert.match(storageRegisterDoc, /\| `inline-computed-key-write` \| 8 \|/);
  assert.match(storageRegisterDoc, /\| `background` \| 27 \| 24 \| 1 \| 52 \|/);

  const settingsRefreshDoc = read('docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(source, /Settings Runtime Refresh Authority Addendum - 2026-05-27/);
  assert.match(source, /settings runtime refresh authority snapshot with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /pins shared settings load\/save, StateManager\s+refresh requests, background compiled cache reads\/invalidations/);
  assert.match(source, /bridge runtime refresh, main-world delivery,\s+storage coalescing, and observer refresh/);
  assert.match(source, /Settings\/runtime refresh authority,\s+compiled-cache revision authority, and storage-key consumer matrix authority\s+remain at `NO-GO`/);
  assert.match(source, /share one revisioned dirty-key report with\s+consumer-specific JSON\/DOM\/menu\/quick work decisions and no-op proof/);
  assert.match(settingsRefreshDoc, /Settings Runtime Refresh Authority Snapshot - 2026-05-27/);
  assert.match(settingsRefreshDoc, /settings\/runtime refresh authority approval: NO-GO/);
  assert.match(settingsRefreshDoc, /compiled-cache revision authority approval: NO-GO/);
  assert.match(settingsRefreshDoc, /storage-key consumer matrix approval: NO-GO/);
  assert.match(settingsRefreshDoc, /runtime behavior changed by this addendum: no/);
  assert.match(settingsRefreshDoc, /flowchart TD/);
  assert.match(settingsRefreshDoc, /\| Shared save and alias mirroring \| `js\/settings_shared\.js:742-954` \|/);
  assert.match(settingsRefreshDoc, /\| Background compiled cache \| `js\/background\.js:1288`, `js\/background\.js:1774-1781`, `js\/background\.js:3244-3261` \|/);
  assert.match(settingsRefreshDoc, /\| Bridge storage coalescing \| `js\/content\/bridge_settings\.js:519-651` \|/);

  const singleChannelMutationDoc = read('docs/audit/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md');
  assert.match(source, /Menu Quick Rule Mutation Ingress Addendum - 2026-05-27/);
  assert.match(source, /menu and quick-block rule mutation ingress snapshot with ASCII\s+and Mermaid flow diagrams/);
  assert.match(source, /pins quick-cross enablement and mutation handoff,\s+3-dot menu injection and block handler behavior/);
  assert.match(source, /Dashboard Main add\/remove, Main whitelist background add, legacy\s+block add, and the shared helper storage\/cache fanout/);
  assert.match(source, /Menu\/quick rule\s+mutation ingress authority, single-channel list-target authority, and\s+single-channel side-effect budget authority remain at `NO-GO`/);
  assert.match(source, /one actor\/profile\/list-target decision with\s+optimistic-hide, backup, refresh, cache invalidation, identity-fetch, and\s+negative no-op\/rollback proof/);
  assert.match(singleChannelMutationDoc, /Menu And Quick-Block Rule Mutation Ingress Snapshot - 2026-05-27/);
  assert.match(singleChannelMutationDoc, /menu\/quick rule mutation ingress authority: NO-GO/);
  assert.match(singleChannelMutationDoc, /single-channel list-target authority: NO-GO/);
  assert.match(singleChannelMutationDoc, /single-channel side-effect budget authority: NO-GO/);
  assert.match(singleChannelMutationDoc, /runtime behavior changed by this addendum: no/);
  assert.match(singleChannelMutationDoc, /flowchart TD/);
  assert.match(singleChannelMutationDoc, /\| Quick-cross enabled gate \| `js\/content\/block_channel\.js:1205-1222` \|/);
  assert.match(singleChannelMutationDoc, /\| 3-dot menu injected gate \| `js\/content_bridge\.js:10517-10529` \|/);
  assert.match(singleChannelMutationDoc, /\| Shared helper storage\/cache fanout \| `js\/background\.js:5309-6192` \|/);

  const menuObserverDoc = read('docs/audit/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md');
  assert.match(source, /Native Dropdown Open-Close Owner Flow Addendum - 2026-05-27/);
  assert.match(source, /native dropdown open-close owner-flow addendum with ASCII and\s+Mermaid diagrams/);
  assert.match(source, /pins menu button capture, forced-hidden state repair,\s+dropdown visibility observation/);
  assert.match(source, /outside-pointer close filtering, bounded discovery observer\s+lifetimes, keyboard discovery/);
  assert.match(source, /pending-fetch cancellation, and stale item cleanup/);
  assert.match(source, /user-observed 3-dot menu regression trail/);
  assert.match(source, /Native dropdown open-close source proof is\s+`PARTIAL`/);
  assert.match(source, /menu lifecycle optimization, close-helper simplification,\s+outside-pointer policy changes, quick-block\/menu unification, and reusable\s+YouTube node state cleanup remain at `NO-GO`/);
  assert.match(source, /route, surface, menu owner, user action, dropdown node/);
  assert.match(source, /injected state,\s+close reason, pending fetch effect, stale-item effect/);
  assert.match(source, /no-work budget, and\s+negative outside-click\/comment-menu proof/);
  assert.match(menuObserverDoc, /Native Dropdown Open-Close Owner Flow Addendum - 2026-05-27/);
  assert.match(menuObserverDoc, /native dropdown open-close owner rows: 10/);
  assert.match(menuObserverDoc, /ASCII native dropdown open-close flow diagram: present/);
  assert.match(menuObserverDoc, /Mermaid native dropdown open-close flow diagram: present/);
  assert.match(menuObserverDoc, /native dropdown open-close source proof: PARTIAL/);
  assert.match(menuObserverDoc, /menu lifecycle optimization approval from owner flow: NO-GO/);
  assert.match(menuObserverDoc, /runtime behavior changed by this addendum: no/);
  assert.match(menuObserverDoc, /flowchart TD/);
  assert.match(menuObserverDoc, /\| `native_dropdown_forced_hidden_repair_owner` \| `js\/content\/block_channel\.js:2325-2353` \|/);
  assert.match(menuObserverDoc, /\| `native_dropdown_outside_pointer_owner` \| `js\/content\/block_channel\.js:2469-2513` \|/);
  assert.match(menuObserverDoc, /\| `native_dropdown_bounded_discovery_owner` \| `js\/content\/block_channel\.js:2515-2566` \|/);
  assert.match(menuObserverDoc, /\| `native_dropdown_identity_injection_owner` \| `js\/content\/block_channel\.js:2913-3169` \|/);
  assert.match(source, /2026-05-28 bounded discovery executable continuation/);
  assert.match(source, /2500 ms dropdown discovery shutdown timer and the no-helper\s+outside-pointer close fallback/);
  assert.match(source, /native dropdown discovery stop\s+executable rows:\s+1/);
  assert.match(source, /native dropdown escape fallback executable rows:\s+1/);
  assert.match(source, /native\s+dropdown executable continuation behavior changed:\s+no/);
  assert.match(source, /native dropdown\s+executable continuation approval:\s+`NO-GO`/);
  assert.match(menuObserverDoc, /Bounded Discovery Executable Continuation - 2026-05-28/);
  assert.match(menuObserverDoc, /shared closer absent -> Escape fallback/);
  assert.match(menuObserverDoc, /native dropdown discovery stop executable rows: 1/);
  assert.match(menuObserverDoc, /native dropdown escape fallback executable rows: 1/);
  assert.match(menuObserverDoc, /native dropdown executable continuation approval: NO-GO/);

  const listModeRuntimeDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md');
  assert.match(source, /List-Mode Runtime Invariant Addendum - 2026-05-27/);
  assert.match(source, /list-mode runtime invariant snapshot with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /pins shared save alias mirroring, background profile list-mode\s+compilation, seed\/injector no-work predicates, JSON decision-engine behavior/);
  assert.match(source, /DOM fallback list-mode behavior, bridge refresh and delivery,\s+storage refresh\s+force-reprocess preservation, whitelist pending-hide gates, and quick-block\s+mode gates/);
  assert.match(source, /block matching content, allow only whitelisted content,\s+and keep empty\/no-useful blocklist low-work/);
  assert.match(source, /List-mode runtime invariant authority,\s+blocklist\/whitelist parity authority, and empty-list no-work\/fail-close\s+authority remain at `NO-GO`/);
  assert.match(source, /one profile\/mode\/source-row\s+decision report with negative no-op, stale-refresh, and sibling-visible proof/);
  assert.match(listModeRuntimeDoc, /List-Mode Runtime Invariant Snapshot - 2026-05-27/);
  assert.match(listModeRuntimeDoc, /list-mode runtime invariant authority: NO-GO/);
  assert.match(listModeRuntimeDoc, /blocklist\/whitelist parity authority: NO-GO/);
  assert.match(listModeRuntimeDoc, /empty-list no-work\/fail-close authority: NO-GO/);
  assert.match(listModeRuntimeDoc, /runtime behavior changed by this addendum: no/);
  assert.match(listModeRuntimeDoc, /flowchart TD/);
  assert.match(listModeRuntimeDoc, /\| Background profile list-mode compiler \| `js\/background\.js:1984-2022`, `js\/background\.js:2056-2076`, `js\/background\.js:2212-2224` \|/);
  assert.match(listModeRuntimeDoc, /\| Seed JSON no-work predicate \| `js\/seed\.js:220-260` \|/);
  assert.match(listModeRuntimeDoc, /\| JSON decision engine \| `js\/filter_logic\.js:1846-2036`, `js\/filter_logic\.js:2038-2108` \|/);
  assert.match(listModeRuntimeDoc, /\| DOM fallback list-mode gate \| `js\/content\/dom_fallback\.js:1933-2088`, `js\/content\/dom_fallback\.js:4547-4746` \|/);
  assert.match(listModeRuntimeDoc, /\| Whitelist pending and quick-block gates \| `js\/content_bridge\.js:6014-6037`, `js\/content\/block_channel\.js:1205-1222` \|/);

  const settingsModeSourceEffectDoc = read('docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md');
  assert.match(source, /Settings Mode Owner Flow Addendum - 2026-05-27/);
  assert.match(source, /list-mode owner flow addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /popup\/dashboard\/import intent, the background\s+`FilterTube_SetListMode` transition writer/);
  assert.match(source, /seed\/injector JSON admission, filter_logic decisions, DOM fallback,\s+whitelist pending-hide, quick-block, and native menu action gates/);
  assert.match(source, /dated "what changed and why" release trail/);
  assert.match(source, /Settings-mode owner-flow source proof is\s+`PARTIAL`/);
  assert.match(source, /settings-mode optimization, alias cleanup, simultaneous\s+allow\/block mode, and JSON-first promotion remain at `NO-GO`/);
  assert.match(source, /source\/effect decision report with profile, mode, route,\s+storage revision, visible rows, compiled rows, side effects, no-op proof, and\s+sibling-visible proof/);
  assert.match(settingsModeSourceEffectDoc, /List-Mode Owner Flow Addendum - 2026-05-27/);
  assert.match(settingsModeSourceEffectDoc, /list-mode owner flow rows: 8/);
  assert.match(settingsModeSourceEffectDoc, /ASCII list-mode owner flow diagram: present/);
  assert.match(settingsModeSourceEffectDoc, /Mermaid list-mode owner flow diagram: present/);
  assert.match(settingsModeSourceEffectDoc, /settings-mode owner-flow source proof: PARTIAL/);
  assert.match(settingsModeSourceEffectDoc, /settings-mode optimization approval from owner flow: NO-GO/);
  assert.match(settingsModeSourceEffectDoc, /runtime behavior changed by this addendum: no/);
  assert.match(settingsModeSourceEffectDoc, /flowchart TD/);
  assert.match(settingsModeSourceEffectDoc, /\| `list_mode_ui_intent` \| `js\/popup\.js:816-860`; `js\/tab-view\.js:4648-4660`; `js\/tab-view\.js:10540-10630` \|/);
  assert.match(settingsModeSourceEffectDoc, /\| `list_mode_transition_writer` \| `js\/background\.js:3292-3500` \|/);
  assert.match(settingsModeSourceEffectDoc, /\| `list_mode_compile_owner` \| `js\/background\.js:1984-2022`; `js\/background\.js:2056-2076`; `js\/background\.js:2212-2224` \|/);
  assert.match(settingsModeSourceEffectDoc, /\| `list_mode_dom_action_owner` \| `js\/content\/dom_fallback\.js:2117-2183`; `js\/content\/dom_fallback\.js:2219-2273`; `js\/content_bridge\.js:6222-6273`; `js\/content\/block_channel\.js:1212-1229`; `js\/content_bridge\.js:10725-10737` \|/);
  assert.match(source, /2026-05-30 settings\/profile\/list-mode convergence continuation/);
  assert.match(source, /Settings\/Profile\/List-Mode Convergence Boundary - 2026-05-30/);
  assert.match(source, /visible\s+row versus compiled source drift, empty blocklist versus empty whitelist\s+policy, Main\/Kids profile selection, `syncKidsToMain` merge behavior/);
  assert.match(source, /list-mode transition storage, seed\/injector JSON admission, JSON decision\s+comment exceptions, DOM pending\/action gates, content-control active-work, and\s+refresh\/cache revision fanout into 10 settings\/profile\/list-mode convergence\s+rows/);
  assert.match(source, /implementation-ready\s+settings\/profile\/list-mode convergence rows 0/);
  assert.match(source, /product-source absence\s+for `settingsModeSourceEffectAuthority`, `settingsSourceEffectDecision`, and\s+`modeSurfaceEffectAuthority`/);
  assert.match(source, /settings-mode implementation,\s+alias cleanup, simultaneous allow\/block mode, whitelist\/cache optimization,\s+JSON-first promotion, refresh pruning, release\/public-claim use, and runtime\s+behavior changes at `NO-GO`/);
  assert.match(settingsModeSourceEffectDoc, /Settings\/Profile\/List-Mode Convergence Boundary - 2026-05-30/);
  assert.match(settingsModeSourceEffectDoc, /settings\/profile\/list-mode convergence rows: 10/);
  assert.match(settingsModeSourceEffectDoc, /implementation-ready settings\/profile\/list-mode convergence rows: 0/);
  assert.match(settingsModeSourceEffectDoc, /settingsModeSourceEffectAuthority product source symbol: absent/);
  assert.match(settingsModeSourceEffectDoc, /settings-mode refresh pruning approval: NO-GO/);

  const jsonFirstNoWorkDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md');
  assert.match(source, /JSON-First Owner Budget Addendum - 2026-05-27/);
  assert.match(source, /JSON-first owner budget ledger addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins seed transport admission, injector transport admission,\s+filter_logic renderer\/list-mode decision ownership, DOM fallback rendered-card\s+ownership/);
  assert.match(source, /bridge whitelist-pending\/action ownership, and release proof\s+ownership/);
  assert.match(source, /first-class JSON planning path/);
  assert.match(source, /JSON-first\s+source proof is `PARTIAL`/);
  assert.match(source, /JSON-first promotion authority,\s+JSON-vs-DOM owner authority, and unsupported renderer policy authority remain\s+at `NO-GO`/);
  assert.match(source, /share one owner decision report with no-op and negative sibling proof/);
  assert.match(jsonFirstNoWorkDoc, /JSON-First Owner Budget Ledger Addendum - 2026-05-27/);
  assert.match(jsonFirstNoWorkDoc, /flowchart TD/);
  assert.match(jsonFirstNoWorkDoc, /\| Seed transport admission \| `js\/seed\.js:220-260`, `js\/seed\.js:383-430`, `js\/seed\.js:1002-1014` \|/);
  assert.match(jsonFirstNoWorkDoc, /\| Injector transport admission \| `js\/injector\.js:171-188`, `js\/injector\.js:1940-1944`, `js\/injector\.js:3405-3437` \|/);
  assert.match(jsonFirstNoWorkDoc, /\| JSON renderer owner \| `js\/filter_logic\.js:435-529`, `js\/filter_logic\.js:1721-2261`, `js\/filter_logic\.js:3588-3619` \|/);
  assert.match(jsonFirstNoWorkDoc, /\| DOM fallback owner \| `js\/content\/dom_fallback\.js:1933-1999`, `js\/content\/dom_fallback\.js:2035-2088`, `js\/content\/dom_fallback\.js:4547-4752` \|/);
  assert.match(jsonFirstNoWorkDoc, /\| Bridge\/action owner \| `js\/content_bridge\.js:6014-6037`, `js\/content\/block_channel\.js:1205-1222` \|/);
  assert.match(jsonFirstNoWorkDoc, /JSON-first owner budget proof slices: 6/);
  assert.match(jsonFirstNoWorkDoc, /JSON-first source proof: PARTIAL/);
  assert.match(jsonFirstNoWorkDoc, /JSON-first promotion authority: NO-GO/);
  assert.match(jsonFirstNoWorkDoc, /JSON-vs-DOM owner authority: NO-GO/);
  assert.match(jsonFirstNoWorkDoc, /unsupported renderer policy authority: NO-GO/);
  assert.match(jsonFirstNoWorkDoc, /runtime behavior changed by this addendum: no/);

  const jsonFirstImplementationAuthorityDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md');
  assert.match(source, /JSON-First Source-Flow Addendum - 2026-05-27/);
  assert.match(source, /current JSON-first source-flow addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins seed\/injector active-work gates, seed fetch\/XHR\s+transport processing/);
  assert.match(source, /injector page-world replay, `filter_logic` renderer\s+rules, settings\/list-mode reconstruction/);
  assert.match(source, /harvest versus mutation, category\s+metadata requests, DOM fallback parity, quick-block action lifecycle, and\s+fallback menu action lifecycle/);
  assert.match(source, /JSON-first filtering is the\s+right first-class direction/);
  assert.match(source, /Current\s+JSON-first source-flow proof is `PARTIAL`/);
  assert.match(source, /runtime JSON-first implementation\s+approvals remain `0`/);
  assert.match(source, /implementation-ready JSON-first source-flow rows remain\s+`0`/);
  assert.match(source, /JSON-first promotion, transport simplification, DOM fallback pruning,\s+category metadata pruning, quick\/menu action pruning, diagnostic cleanup, and\s+release rollout remain at `NO-GO`/);
  assert.match(source, /work-decision report with endpoint, route, surface, list mode, active rule,\s+allowed effect, forbidden effect, metric, parity, rollback, and negative\s+sibling-visible proof/);
  assert.match(jsonFirstImplementationAuthorityDoc, /Current JSON-First Source-Flow Addendum - 2026-05-27/);
  assert.match(jsonFirstImplementationAuthorityDoc, /current JSON-first source-flow rows: 12/);
  assert.match(jsonFirstImplementationAuthorityDoc, /ASCII JSON-first source-flow diagram: present/);
  assert.match(jsonFirstImplementationAuthorityDoc, /Mermaid JSON-first source-flow diagram: present/);
  assert.match(jsonFirstImplementationAuthorityDoc, /current JSON-first source-flow proof: PARTIAL/);
  assert.match(jsonFirstImplementationAuthorityDoc, /runtime JSON-first implementation approvals: 0/);
  assert.match(jsonFirstImplementationAuthorityDoc, /implementation-ready JSON-first source-flow rows: 0/);
  assert.match(jsonFirstImplementationAuthorityDoc, /runtime behavior changed by this addendum: no/);
  assert.match(jsonFirstImplementationAuthorityDoc, /flowchart TD/);
  assert.match(jsonFirstImplementationAuthorityDoc, /\| `json_flow_seed_active_work_gate` \| `js\/seed\.js:220-260` \|/);
  assert.match(jsonFirstImplementationAuthorityDoc, /\| `json_flow_seed_fetch_response_owner` \| `js\/seed\.js:666-754` \|/);
  assert.match(jsonFirstImplementationAuthorityDoc, /\| `json_flow_seed_xhr_response_owner` \| `js\/seed\.js:757-971` \|/);
  assert.match(jsonFirstImplementationAuthorityDoc, /\| `json_flow_injector_processing_replay_owner` \| `js\/injector\.js:3405-3476` \|/);
  assert.match(jsonFirstImplementationAuthorityDoc, /\| `json_flow_renderer_rule_owner` \| `js\/filter_logic\.js:435-844` \|/);
  assert.match(jsonFirstImplementationAuthorityDoc, /\| `json_flow_dom_fallback_parity_owner` \| `js\/content\/dom_fallback\.js:1933-1995`; `js\/content_bridge\.js:6356-6466` \|/);
  assert.match(jsonFirstImplementationAuthorityDoc, /\| `json_flow_fallback_menu_action_owner` \| `js\/content_bridge\.js:6489-7206`; `js\/content_bridge\.js:7233-7265` \|/);

  const diagnosticLoggingPolicyDoc = read('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md');
  assert.match(source, /Runtime Diagnostic Source-Flow Addendum - 2026-05-27/);
  assert.match(source, /runtime diagnostic source-flow addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins seed debug gates and relays, injector `postLog`\s+relays, filter-logic engine diagnostics/);
  assert.match(source, /content-bridge request\/response\s+diagnostics, menu and identity extraction diagnostics/);
  assert.match(source, /background settings\s+and identity repair diagnostics, import\/export and backup diagnostics/);
  assert.match(source, /quick-block\/menu helper diagnostics, and build\/release\/native-sync script\s+diagnostics/);
  assert.match(source, /Diagnostic source-flow proof is `PARTIAL`/);
  assert.match(source, /runtime\s+diagnostic policy approvals remain `0`/);
  assert.match(source, /implementation-ready diagnostic rows\s+remain `0`/);
  assert.match(source, /diagnostic cleanup, logging removal, metric replacement,\s+privacy redaction, JSON-first diagnostic reuse, whitelist optimization\s+measurement, and release\/public-claim use remain at `NO-GO`/);
  assert.match(source, /owner decision report with route, surface, profile, list mode,\s+user-action reason, privacy class, redaction rule, no-work budget, metric\s+replacement, fixture provenance, parity, rollback, and release boundary/);
  assert.match(diagnosticLoggingPolicyDoc, /Runtime Diagnostic Source-Flow Addendum - 2026-05-27/);
  assert.match(diagnosticLoggingPolicyDoc, /current diagnostic source-flow rows: 9/);
  assert.match(diagnosticLoggingPolicyDoc, /ASCII diagnostic source-flow diagram: present/);
  assert.match(diagnosticLoggingPolicyDoc, /Mermaid diagnostic source-flow diagram: present/);
  assert.match(diagnosticLoggingPolicyDoc, /diagnostic source-flow proof: PARTIAL/);
  assert.match(diagnosticLoggingPolicyDoc, /runtime diagnostic policy approvals: 0/);
  assert.match(diagnosticLoggingPolicyDoc, /implementation-ready diagnostic rows: 0/);
  assert.match(diagnosticLoggingPolicyDoc, /runtime behavior changed by this addendum: no/);
  assert.match(diagnosticLoggingPolicyDoc, /flowchart TD/);
  assert.match(diagnosticLoggingPolicyDoc, /\| `diagnostic_flow_seed_gate_and_relay` \| `js\/seed\.js:25-33`, `js\/seed\.js:139-168`, `js\/seed\.js:253-260`, `js\/seed\.js:983-1014` \|/);
  assert.match(diagnosticLoggingPolicyDoc, /\| `diagnostic_flow_injector_postlog_relay` \| `js\/injector\.js:105-130`, `js\/injector\.js:1925-2047`, `js\/injector\.js:3382-3495` \|/);
  assert.match(diagnosticLoggingPolicyDoc, /\| `diagnostic_flow_filter_logic_engine` \| `js\/filter_logic\.js:19-44`, `js\/filter_logic\.js:1566-1595`, `js\/filter_logic\.js:3588-3650` \|/);
  assert.match(diagnosticLoggingPolicyDoc, /\| `diagnostic_flow_bridge_request_response` \| `js\/content_bridge\.js:5424-5524`, `js\/content_bridge\.js:5780-5986` \|/);
  assert.match(diagnosticLoggingPolicyDoc, /\| `diagnostic_flow_bridge_menu_identity` \| `js\/content_bridge\.js:7303-7452`, `js\/content_bridge\.js:10010-10630`, `js\/content_bridge\.js:12237-13151` \|/);
  assert.match(diagnosticLoggingPolicyDoc, /\| `diagnostic_flow_build_release_scripts` \| `build\.js:75-190`, `build\.js:536-716`, `scripts\/build-extension-ui\.mjs:47-48`, `scripts\/build-nanah-vendor\.mjs:62-63`, `scripts\/sync-native-runtime\.mjs:12-30` \|/);

  const jsonPathAuthorityDoc = read('docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(source, /Executable JSON Path Owner Flow Addendum - 2026-05-27/);
  assert.match(source, /executable JSON path owner flow addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins `getByPath\(\)` dot-path syntax, `getTextFromPaths\(\)`,\s+hand-authored `FILTER_RULES`, candidate field extraction, `_shouldBlock\(\)`/);
  assert.match(source, /content\/category field effects, learned map writes,\s+collaboration identity extraction, and `processData\(\)` export/);
  assert.match(source, /"every JSON path" and JSON-first planning rows/);
  assert.match(source, /JSON path source proof is `PARTIAL`/);
  assert.match(source, /JSON-first promotion, generated path manifests, unsupported renderer policy,\s+field-effect authority, and JSON-vs-DOM ownership all remain at `NO-GO`/);
  assert.match(source, /normalized syntax, source\s+provenance, endpoint\/route\/surface, list-mode behavior, identity confidence,\s+allowed effect, forbidden effect, no-work budget, and negative sibling-visible\s+proof/);
  assert.match(jsonPathAuthorityDoc, /Executable JSON Path Owner Flow Addendum - 2026-05-27/);
  assert.match(jsonPathAuthorityDoc, /executable JSON path owner rows: 8/);
  assert.match(jsonPathAuthorityDoc, /ASCII executable JSON path flow diagram: present/);
  assert.match(jsonPathAuthorityDoc, /Mermaid executable JSON path flow diagram: present/);
  assert.match(jsonPathAuthorityDoc, /JSON path source proof: PARTIAL/);
  assert.match(jsonPathAuthorityDoc, /JSON-first promotion approval from path owner flow: NO-GO/);
  assert.match(jsonPathAuthorityDoc, /runtime behavior changed by this addendum: no/);
  assert.match(jsonPathAuthorityDoc, /flowchart TD/);
  assert.match(jsonPathAuthorityDoc, /\| `json_path_syntax_owner` \| `js\/filter_logic\.js:163-177`; `js\/filter_logic\.js:221-233` \|/);
  assert.match(jsonPathAuthorityDoc, /\| `json_decision_effect_owner` \| `js\/filter_logic\.js:1957-2249` \|/);
  assert.match(jsonPathAuthorityDoc, /\| `json_learned_map_owner` \| `js\/filter_logic\.js:58-88`; `js\/filter_logic\.js:91-149`; `js\/filter_logic\.js:1256-1283`; `js\/filter_logic\.js:1290-1324` \|/);
  assert.match(jsonPathAuthorityDoc, /\| `json_collaboration_identity_owner` \| `js\/filter_logic\.js:3033-3285` \|/);
  assert.match(jsonPathAuthorityDoc, /\| `json_process_export_owner` \| `js\/filter_logic\.js:3588-3633` \|/);
  assert.match(source, /2026-05-30 JSON path convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/json-path-authority-current-behavior.test.mjs'));
  assert.match(source, /10 JSON path convergence rows across\s+documentation-not-runtime authority, syntax boundary, executable owner flow,\s+runtime coverage classes, section index, executable rule paths, field-effect\s+gap, JSON-first promotion gate, method dependency, and authority absence/);
  assert.match(source, /0 implementation-ready JSON path convergence rows, 8 executable JSON path\s+owner rows, 5 runtime coverage classes, 20 section rows, 5\s+unsupported\/direct-gap section rows, 440 effective runtime path rows, 174\s+effective unique path literals, 177 renderer-field pairs, 13 blocked JSON-first\s+promotion rows, 0 complete method semantic proof files/);
  assert.match(source, /source-derived ASCII\s+and Mermaid diagrams/);
  assert.match(source, /product source absence for `jsonPathAuthority`,\s+`rulePathManifest`, `jsonPathProvenance`, `jsonRuntimeCoverageAuthority`,\s+`rendererFieldCoverageClass`, `jsonFieldEffectAuthority`,\s+`jsonSectionCoverageDecision`, `documentedJsonSectionAuthority`,\s+`jsonFirstFilterReadinessGate`, `jsonFirstPathSyntaxManifest`, and\s+`jsonFirstOptimizationBudget`/);
  assert.match(source, /Renderer promotion, JSON-first behavior, DOM\s+fallback deletion, no-work optimization, whitelist\/cache optimization,\s+release\/public-claim use, and broad audit completion remain `NO-GO`/);
  assert.match(source, /Runtime\s+behavior changed by this continuation: no/);
  assert.match(jsonPathAuthorityDoc, /JSON Path Convergence Boundary - 2026-05-30/);
  assert.match(jsonPathAuthorityDoc, /JSON path convergence rows: 10/);
  assert.match(jsonPathAuthorityDoc, /implementation-ready JSON path convergence rows: 0/);
  assert.match(jsonPathAuthorityDoc, /effective runtime path rows: 440/);
  assert.match(jsonPathAuthorityDoc, /JSON-first promotion rows blocked: 13/);
  assert.match(jsonPathAuthorityDoc, /jsonPathAuthority product source symbol: absent/);
  assert.match(jsonPathAuthorityDoc, /JSON-first behavior approval: NO-GO/);

  const activeWorkPredicateDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md');
  assert.match(source, /Active-Work Predicate Drift Addendum - 2026-05-27/);
  assert.match(source, /active-work predicate drift addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /pins seed JSON work, injector JSON work, bridge MAIN-world and\s+identity-prefetch work/);
  assert.match(source, /DOM fallback lifecycle work, quick-block action\/rule\s+context, native menu action gates, and filter-engine harvest\/mutation gates/);
  assert.match(source, /no-work and JSON-first optimization audit/);
  assert.match(source, /Active-work predicate source proof is `PARTIAL`/);
  assert.match(source, /shared active-work authority, predicate merge optimization authority, and\s+JSON-first active-work promotion authority remain at `NO-GO`/);
  assert.match(source, /names the owner, predicate, settings revision, route, surface, list mode,\s+action type, and work class/);
  assert.match(activeWorkPredicateDoc, /Active-Work Predicate Drift Addendum - 2026-05-27/);
  assert.match(activeWorkPredicateDoc, /flowchart TD/);
  assert.match(activeWorkPredicateDoc, /\| Seed JSON active work \| `js\/seed\.js:202-238`, `js\/seed\.js:253-260`, `js\/seed\.js:383-430` \|/);
  assert.match(activeWorkPredicateDoc, /\| Injector JSON active work \| `js\/injector\.js:153-188`, `js\/injector\.js:1940-1944`, `js\/injector\.js:3405-3437` \|/);
  assert.match(activeWorkPredicateDoc, /\| Bridge MAIN-world and identity work \| `js\/content_bridge\.js:1005-1058`, `js\/content_bridge\.js:1060-1071` \|/);
  assert.match(activeWorkPredicateDoc, /\| DOM fallback lifecycle work \| `js\/content\/dom_fallback\.js:2117-2184`, `js\/content\/dom_fallback\.js:2185-2218`, `js\/content_bridge\.js:6408-6417` \|/);
  assert.match(activeWorkPredicateDoc, /\| Quick-block action and rule context \| `js\/content\/block_channel\.js:1212-1296`, `js\/content\/block_channel\.js:1993-2042` \|/);
  assert.match(activeWorkPredicateDoc, /\| Native\/fallback menu action gate \| `js\/content_bridge\.js:10725-10737` \|/);
  assert.match(activeWorkPredicateDoc, /active-work predicate drift proof slices: 7/);
  assert.match(activeWorkPredicateDoc, /active-work predicate source proof: PARTIAL/);
  assert.match(activeWorkPredicateDoc, /shared active-work authority: NO-GO/);
  assert.match(activeWorkPredicateDoc, /predicate merge optimization authority: NO-GO/);
  assert.match(activeWorkPredicateDoc, /JSON-first active-work promotion authority: NO-GO/);
  assert.match(activeWorkPredicateDoc, /runtime behavior changed by this addendum: no/);
  assert.match(source, /JSON-First Work-Class Decision Linkage - 2026-05-30/);
  assert.match(source, /work-class decision linkage addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /passive JSON body parsing,\s+queued initial-data replay, MAIN-world runtime injection, identity prefetch,\s+filter-logic harvest, filter-logic mutation, DOM fallback scan\/stale cleanup,\s+and quick\/menu user-action affordance work/);
  assert.match(source, /empty\/no-rule performance needs early body pass-through/);
  assert.match(source, /harvest can be\s+allowed while mutation is forbidden/);
  assert.match(source, /first-rule quick\/menu affordances can remain available even when passive\s+filtering work is inactive/);
  assert.match(source, /`jsonFirstWorkClassDecisionReport` proves work class, route, surface, endpoint/);
  assert.match(activeWorkPredicateDoc, /Work-Class Decision Linkage - 2026-05-30/);
  assert.match(activeWorkPredicateDoc, /JSON-first work-class rows: 8/);
  assert.match(activeWorkPredicateDoc, /shared work-class decision authority: NO-GO/);
  assert.match(activeWorkPredicateDoc, /JSON-first first-class promotion from work-class linkage: NO-GO/);
  assert.match(activeWorkPredicateDoc, /jsonFirstWorkClassDecisionReport/);
  assert.match(activeWorkPredicateDoc, /\| `passive_json_body_parsing` \| `js\/seed\.js`, `js\/injector\.js` \|/);
  assert.match(activeWorkPredicateDoc, /\| `identity_prefetch_observer` \| `js\/content_bridge\.js` \|/);
  assert.match(activeWorkPredicateDoc, /\| `filter_logic_harvest` \| `js\/filter_logic\.js` \|/);
  assert.match(activeWorkPredicateDoc, /\| `dom_fallback_scan_cleanup` \| `js\/content\/dom_fallback\.js`, `js\/content_bridge\.js` \|/);
  assert.match(activeWorkPredicateDoc, /\| `quick_menu_user_action_affordance` \| `js\/content\/block_channel\.js`, `js\/content_bridge\.js` \|/);

  const releasePackageDoc = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(source, /Installed Runtime Provenance Addendum - 2026-05-27/);
  assert.match(source, /installed runtime provenance snapshot with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins package\.json version\/scripts, Chrome manifest script\s+order, build package roots\/flow\/manifest repair\/zip output\/README mutation/);
  assert.match(source, /Kully\/Gussy Topic source\/test proof/);
  assert.match(source, /workspace-to-installed\s+runtime boundary/);
  assert.match(source, /Installed extension provenance authority,\s+workspace-to-loaded-runtime parity authority, and reload\/package attestation\s+gate remain at `NO-GO`/);
  assert.match(source, /loaded extension ID\/path\/hash\/reload-time\s+report/);
  assert.match(releasePackageDoc, /Installed Runtime Provenance Snapshot - 2026-05-27/);
  assert.match(releasePackageDoc, /installed extension id \+ loaded path \+ manifest version \+ source hash/);
  assert.match(releasePackageDoc, /flowchart TD/);
  assert.match(releasePackageDoc, /\| Package command\/version surface \| `package\.json:3-18` \|/);
  assert.match(releasePackageDoc, /\| Default Chrome manifest load order \| `manifest\.json:1-88`, `manifest\.json:42-56` \|/);
  assert.match(releasePackageDoc, /\| Current Topic ampersand and bare-`and` source proof \| `js\/content_bridge\.js:2759-2814`, `js\/content_bridge\.js:4784-4812`, `js\/content_bridge\.js:4902-4928`, `tests\/runtime\/content-bridge-collaborator-identity-promotion-handoff-current-behavior\.test\.mjs:510-544` \|/);
  assert.match(releasePackageDoc, /Kully B & Gussy G - Topic/);
  assert.match(releasePackageDoc, /installed extension provenance authority: NO-GO/);
  assert.match(releasePackageDoc, /workspace-to-loaded-runtime parity authority: NO-GO/);
  assert.match(releasePackageDoc, /reload\/package attestation gate: NO-GO/);
  assert.match(releasePackageDoc, /runtime behavior changed by this addendum: no/);
  assert.match(source, /Chrome Default Unpacked Workspace Byte Snapshot - 2026-05-27/);
  assert.match(source, /Chrome Default unpacked workspace byte snapshot with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /Secure Preferences path\s+`\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(source, /current workspace hashes for\s+`manifest\.json`, `package\.json`, and `js\/content_bridge\.js`/);
  assert.match(source, /ampersand Topic fix token in the workspace content bridge/);
  assert.match(source, /Default profile unpacked workspace path proof and workspace byte hash\s+snapshot are now present/);
  assert.match(source, /running-tab content-script byte authority and\s+extension reload timestamp authority remain at `NO-GO`/);
  assert.match(releasePackageDoc, /Chrome Default Unpacked Workspace Byte Snapshot - 2026-05-27/);
  assert.match(releasePackageDoc, /secure preferences path matches workspace root: yes/);
  assert.match(releasePackageDoc, /Default packed Extensions directory for this id exists: no/);
  assert.match(releasePackageDoc, /workspace content_bridge ampersand Topic fix token present: yes/);
  assert.match(releasePackageDoc, /running-tab content-script byte authority: NO-GO/);
  assert.match(releasePackageDoc, /extension reload timestamp authority: NO-GO/);
  assert.match(source, /Default Installed Permission Parity Crosscheck - 2026-05-30/);
  assert.match(source, /active and granted API permissions as `activeTab`,\s+`downloads`, `scripting`, `storage`, and `tabs`/);
  assert.match(source, /active and granted explicit\s+hosts as `youtube-nocookie\.com`, `youtube\.com`, and `youtubekids\.com`/);
  assert.match(source, /active\s+and granted scriptable hosts as `youtube\.com` and `youtubekids\.com`/);
  assert.match(source, /Installed permission parity authority is\s+`PARTIAL`/);
  assert.match(source, /active-tab permission use proof, visible YouTube tab\s+content-script byte parity, and extension reload timestamp authority remain\s+at `NO-GO`/);
  assert.match(releasePackageDoc, /Default Installed Permission Parity Crosscheck - 2026-05-30/);
  assert.match(releasePackageDoc, /installed active API permissions: activeTab, downloads, scripting, storage, tabs/);
  assert.match(releasePackageDoc, /installed granted API permissions: activeTab, downloads, scripting, storage, tabs/);
  assert.match(releasePackageDoc, /installed active explicit hosts: youtube-nocookie\.com, youtube\.com, youtubekids\.com/);
  assert.match(releasePackageDoc, /installed granted explicit hosts: youtube-nocookie\.com, youtube\.com, youtubekids\.com/);
  assert.match(releasePackageDoc, /installed permission parity authority: PARTIAL/);
  assert.match(releasePackageDoc, /active-tab permission use proof: NO-GO/);
  assert.match(source, /Live Chrome Process Attestation Boundary - 2026-05-27/);
  assert.match(source, /live Chrome process attestation boundary with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /visible Default Chrome\s+and the separate automation Chrome profile/);
  assert.match(source, /Default Chrome is the user-visible\s+profile path but has no observed `--remote-debugging-port`/);
  assert.match(source, /`\/private\/tmp\/filtertube-live-spa-chrome-profile`/);
  assert.match(source, /exposes CDP on port 9222/);
  assert.match(source, /same workspace extension id\/path/);
  assert.match(source, /automation-profile evidence from being confused with visible-tab proof/);
  assert.match(source, /Visible Default Chrome CDP target\s+list authority, visible YouTube tab content-script byte parity authority, and\s+visible YouTube tab extension reload timestamp authority remain at `NO-GO`/);
  assert.match(source, /active-tab URL, extension id,\s+extension path, manifest version, content-script byte hash or equivalent\s+runtime marker, and reload timestamp evidence/);
  assert.match(releasePackageDoc, /Live Chrome Process Attestation Boundary - 2026-05-27/);
  assert.match(releasePackageDoc, /Default Chrome --remote-debugging-port flag observed: no/);
  assert.match(releasePackageDoc, /automation profile extension path: \/Users\/devanshvarshney\/FilterTube/);
  assert.match(releasePackageDoc, /automation CDP \/json\/list target count observed: 0/);
  assert.match(releasePackageDoc, /visible YouTube tab content-script byte parity authority: NO-GO/);
  assert.match(source, /Browser Manifest Package Reference Closure Addendum - 2026-05-27/);
  assert.match(source, /browser manifest package reference closure snapshot with ASCII\s+and Mermaid flow diagrams/);
  assert.match(source, /pins the four browser manifests, 24 combined\s+unique manifest-referenced paths, 0 unresolved manifest file references, 0\s+manifest referenced roots outside `COMMON_DIRS`, and 0 manifest content-script\s+CSS references/);
  assert.match(source, /Manifest package reference source proof is\s+`PARTIAL`/);
  assert.match(source, /build-time manifest reference validation, committed package\s+manifest authority, installed-runtime byte parity, and reload\/package\s+attestation remain at `NO-GO`/);
  assert.match(source, /pre-zip reference validation, and loaded Chrome\/runtime byte proof/);
  assert.match(releasePackageDoc, /Browser Manifest Package Reference Closure Addendum - 2026-05-27/);
  assert.match(releasePackageDoc, /combined unique referenced paths across browser manifests: 24/);
  assert.match(releasePackageDoc, /unresolved manifest file references: 0/);
  assert.match(releasePackageDoc, /manifest referenced roots outside COMMON_DIRS: 0/);
  assert.match(releasePackageDoc, /manifest content-script CSS references: 0/);
  assert.match(releasePackageDoc, /build-time manifest reference validation: absent/);
  assert.match(releasePackageDoc, /Release package parity authority remains NO-GO/);
  assert.match(releasePackageDoc, /manifest\.opera\.json` \| 28 \| 23 \| 0/);
  assert.match(releasePackageDoc, /build\.js still lacks validatePackagedReferences \/ releasePackageParity gate/);
  assert.match(source, /Browser Manifest Permission And Resource Validation Snapshot - 2026-05-27/);
  assert.match(source, /browser manifest permission\/resource validation snapshot\s+with ASCII and Mermaid flow diagrams/);
  assert.match(source, /same\s+five permissions, the same three host permissions, the same two active\s+content-script and web-accessible-resource match hosts/);
  assert.match(source, /4 host-only `youtube-nocookie\.com` gaps/);
  assert.match(source, /Chrome\/default manifests have\s+explicit `MAIN` and `ISOLATED` worlds/);
  assert.match(source, /Firefox has one implicit-world content\s+script entry, and Opera has two implicit-world content script entries/);
  assert.match(source, /Manifest\s+permission\/resource source proof is `PARTIAL`/);
  assert.match(source, /build-time permission,\s+host, web-accessible-resource, content-script world, committed package manifest,\s+installed-runtime byte parity, and reload\/package validation remain at `NO-GO`/);
  assert.match(releasePackageDoc, /Browser Manifest Permission And Resource Validation Snapshot - 2026-05-27/);
  assert.match(releasePackageDoc, /exact permission list per manifest: storage, activeTab, scripting, tabs, downloads/);
  assert.match(releasePackageDoc, /host-only youtube-nocookie gap manifests: 4/);
  assert.match(releasePackageDoc, /build-time permission\/resource\/world validation: absent/);
  assert.match(releasePackageDoc, /manifest\.firefox\.json` \| 1 \| 14 \| none \| 5 \| yes/);
  assert.match(releasePackageDoc, /manifest\.opera\.json` \| 2 \| 15 \| none \| 4 \| yes/);
  assert.match(source, /Current Local Dist Package Snapshot - 2026-05-27/);
  assert.match(source, /current local `dist\/` package snapshot with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /3 browser staged directories, 59 staged files per browser, 3 ZIP\s+artifacts, 180 total `dist` files including ZIPs/);
  assert.match(source, /58 source-backed\s+non-manifest staged files per browser, 54 byte-identical source-backed\s+non-manifest staged files per browser/);
  assert.match(source, /browser manifest hashes, and ZIP\s+hashes for Chrome, Firefox, and Opera/);
  assert.match(source, /Local dist snapshot proof is\s+`PARTIAL`/);
  assert.match(source, /committed package manifest authority, reproducible package\s+build authority, loaded-browser package\/runtime parity authority, upload proof,\s+public-claim proof, and release publication authority remain at `NO-GO`/);
  assert.match(releasePackageDoc, /Current Local Dist Package Snapshot - 2026-05-27/);
  assert.match(releasePackageDoc, /browser staged directories: 3/);
  assert.match(releasePackageDoc, /browser staged files per directory: 59/);
  assert.match(releasePackageDoc, /dist zip artifacts: 3/);
  assert.match(releasePackageDoc, /total dist files including zips: 180/);
  assert.match(releasePackageDoc, /source-backed staged files per browser excluding manifest: 58/);
  assert.match(releasePackageDoc, /byte-identical source-backed staged files per browser excluding manifest: 54/);
  assert.match(releasePackageDoc, /chrome` \| 59 \| 2513 \|/);
  assert.match(releasePackageDoc, /firefox` \| 59 \| 2603 \|/);
  assert.match(releasePackageDoc, /opera` \| 59 \| 2518 \|/);
  assert.match(releasePackageDoc, /local dist snapshot proof: PARTIAL/);
  assert.match(releasePackageDoc, /reproducible package build authority: NO-GO/);
  assert.match(releasePackageDoc, /loaded-browser package\/runtime parity authority: NO-GO/);

  const selectorAuthorityDoc = read('docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md');
  assert.match(source, /Selector Target Ownership Addendum - 2026-05-27/);
  assert.match(source, /source-derived selector target ownership census with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 646 selector API sites into YouTube DOM contracts,\s+dynamic\/caller-owned expressions, FilterTube page-owned selectors/);
  assert.match(source, /Central selector authority, selector rewrite authority,\s+route\/surface ownership authority, and selector-family restore\/sibling-visible\s+authority remain at `NO-GO`/);
  assert.match(selectorAuthorityDoc, /Selector Target Ownership Addendum - 2026-05-27/);
  assert.match(selectorAuthorityDoc, /\| `youtube-dom-contract` \| 251 \| 244 \| 7 \| 178 \|/);
  assert.match(selectorAuthorityDoc, /\| `dynamic-or-caller-owned` \| 147 \| 105 \| 42 \| 76 \|/);
  assert.match(selectorAuthorityDoc, /page-runtime selector sites: 493/);
  assert.match(selectorAuthorityDoc, /selector ownership behavior-change approval: NO-GO/);
  assert.match(selectorAuthorityDoc, /runtime behavior changed by this addendum: no/);
  assert.match(source, /2026-05-30 selector convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/selector-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 10 selector convergence rows across instance census,\s+page-runtime dominance, YouTube DOM contract ownership, dynamic\/caller-owned\s+selectors, content_bridge hot-file selectors, DOM fallback hot-file selectors,\s+quick\/menu release hot-path selectors, watch\/comment\/playlist boundaries,\s+extension UI mutation selectors, and legacy\/inventory boundaries/);
  assert.match(source, /implementation-ready selector convergence rows at 0/);
  assert.match(source, /absence for `selectorAuthority`, `selectorEffectReport`,\s+`selectorTargetDecision`, `selectorRouteSurfaceAuthority`, and\s+`selectorRestoreAuthority`/);
  assert.match(source, /source-derived ASCII and Mermaid diagrams/);
  assert.match(source, /selector rewrites, DOM fallback selector pruning, quick\/menu\s+selector rewrites, watch-shell selector behavior changes, legacy layout\s+reactivation, JSON-first selector promotion, release\/public-claim use, and\s+runtime behavior changes at `NO-GO`/);
  assert.match(source, /2026-05-30 full runtime freshness closure after audit-drift repair/);
  assert.match(source, /initial full runtime rerun result: 4665\/4667 pass, 2 fail/);
  assert.match(source, /failed freshness owners: native runtime sync app HEAD fingerprint; truth-claim register exact line references/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md'));
  assert.match(source, /focused drift repair proof: 10\/10 pass/);
  assert.match(source, /latest broad runtime audit command: npm run audit:runtime/);
  assert.match(source, /latest broad runtime audit result: 4731 tests, 4580 pass, 151 fail/);
  assert.match(source, /current runtime test files: 537/);
  assert.match(source, /current source top-level test declarations counted: 4731/);
  assert.match(source, /current broad runtime proof for generated 4731 declaration set: NO-GO/);
  assert.match(source, /full codebase audit completion from full runtime proof: NO-GO/);
  assert.match(source, /first optimization implementation approval from full runtime proof: NO-GO/);
  assert.match(source, /JSON-first first-class promotion from full runtime proof: NO-GO/);
  assert.match(source, /whitelist\/cache optimization from full runtime proof: NO-GO/);
  assert.match(source, /release\/public-claim use from full runtime proof: NO-GO/);
  assert.match(source, /runtime behavior changed by this continuation: no/);
  assert.match(source, /Runtime backlog remains open/);
  assert.match(source, /Executable broad-audit freshness: NO-GO/);
  assert.match(selectorAuthorityDoc, /Selector Convergence Boundary - 2026-05-30/);
  assert.match(selectorAuthorityDoc, /selector convergence rows: 10/);
  assert.match(selectorAuthorityDoc, /implementation-ready selector convergence rows: 0/);
  assert.match(selectorAuthorityDoc, /selectorEffectReport product source symbol: absent/);
  assert.match(selectorAuthorityDoc, /JSON-first selector promotion approval: NO-GO/);

  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');
  assert.match(source, /Lifecycle Install\/Teardown Imbalance Addendum - 2026-05-27/);
  assert.match(source, /source-derived install\/teardown imbalance addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 524 lifecycle instances into 469 install\/schedule\s+sites and 55 explicit teardown\/clear\/cancel sites/);
  assert.match(source, /Shared lifecycle registry authority, lifecycle cleanup\s+authority, route-teardown authority, observer disconnect authority, and\s+no-rule lifecycle budget authority remain at `NO-GO`/);
  assert.match(lifecycleDoc, /Install\/Teardown Imbalance Addendum - 2026-05-27/);
  assert.match(lifecycleDoc, /\| `install-or-schedule` \| `addEventListener`, `MutationObserver`, `IntersectionObserver`, `setInterval`, `setTimeout`, `requestAnimationFrame` \| 469 \|/);
  assert.match(lifecycleDoc, /\| `explicit-teardown` \| `removeEventListener`, `clearInterval`, `clearTimeout`, `cancelAnimationFrame` \| 55 \|/);
  assert.match(lifecycleDoc, /install-to-teardown ratio: 8\.5:1/);
  assert.match(lifecycleDoc, /lifecycle cleanup approval from imbalance addendum: NO-GO/);
  assert.match(lifecycleDoc, /runtime behavior changed by this addendum: no/);

  assert.match(source, /Event Listener Option Shape Addendum - 2026-05-28/);
  assert.match(source, /source-derived event-listener option-shape addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 292 current `addEventListener` installs into 236\s+omitted-option listeners, 23 boolean capture listeners, 30 object-option\s+listeners, 1 explicit bubble listener, and 2 generated expression\/identifier\s+option listeners/);
  assert.match(source, /Listener option cleanup authority remains at\s+`NO-GO` until every listener option shape has owner, event type, route\/surface,\s+active predicate, ordering impact, passive impact, teardown reason, and\s+positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Event Listener Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener option rows: 292/);
  assert.match(lifecycleDoc, /no-third-argument listener installs: 236/);
  assert.match(lifecycleDoc, /boolean true capture listener installs: 23/);
  assert.match(lifecycleDoc, /object passive true listener installs: 16/);
  assert.match(lifecycleDoc, /object passive true plus capture true listener installs: 6/);
  assert.match(lifecycleDoc, /object once true listener installs: 7/);
  assert.match(lifecycleDoc, /expression or identifier listener option installs: 2/);
  assert.match(lifecycleDoc, /listener option cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII listener option flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid listener option flow diagram: present/);

  assert.match(source, /Event Listener Event-Type Addendum - 2026-05-28/);
  assert.match(source, /source-derived event-listener event-type addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 292 current `addEventListener` installs into 114\s+click listeners, 57 change listeners, 20 input listeners, 14 keydown listeners,\s+8 `DOMContentLoaded` listeners, 1 `ended` media listener, 74 other literal\s+event listeners, 4 non-literal event expressions, and 0 missing event\s+arguments/);
  assert.match(source, /Listener event\s+cleanup authority remains at `NO-GO` until every event has owner, target,\s+route\/surface, settings\/list-mode predicate, native\/menu ordering impact,\s+engagement side-effect status, teardown reason, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Event Listener Event-Type Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener event rows: 292/);
  assert.match(lifecycleDoc, /click listener installs: 114/);
  assert.match(lifecycleDoc, /change listener installs: 57/);
  assert.match(lifecycleDoc, /input listener installs: 20/);
  assert.match(lifecycleDoc, /keydown listener installs: 14/);
  assert.match(lifecycleDoc, /DOMContentLoaded listener installs: 8/);
  assert.match(lifecycleDoc, /ended listener installs: 1/);
  assert.match(lifecycleDoc, /nonliteral event listener installs: 4/);
  assert.match(lifecycleDoc, /missing event listener installs: 0/);
  assert.match(lifecycleDoc, /listener event cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII listener event flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid listener event flow diagram: present/);

  assert.match(source, /Event Listener Target Addendum - 2026-05-28/);
  assert.match(source, /source-derived event-listener target addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 292 current `addEventListener` installs into 205\s+local element targets, 17 optional local element targets, 41 document targets,\s+19 window targets, 8 vendor transport targets, and 2 generated shell targets/);
  assert.match(source, /Listener target cleanup authority remains at `NO-GO` until\s+every target has owner, route\/surface, event, option policy, native\/menu\s+impact, settings\/list-mode predicate, teardown reason, and positive\/negative\s+fixtures/);
  assert.match(lifecycleDoc, /Event Listener Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener target rows: 292/);
  assert.match(lifecycleDoc, /local element listener targets: 205/);
  assert.match(lifecycleDoc, /optional local element listener targets: 17/);
  assert.match(lifecycleDoc, /document listener targets: 41/);
  assert.match(lifecycleDoc, /window listener targets: 19/);
  assert.match(lifecycleDoc, /vendor transport listener targets: 8/);
  assert.match(lifecycleDoc, /generated shell listener targets: 2/);
  assert.match(lifecycleDoc, /listener target cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII listener target flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid listener target flow diagram: present/);

  assert.match(source, /Event Listener Event-Target Matrix Addendum - 2026-05-28/);
  assert.match(source, /source-derived event-target matrix addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /10 document click pairs, 7 document `DOMContentLoaded` pairs, 3\s+document keydown pairs, 4 document pointer\/mouse pairs, 4 window message pairs,\s+2 window route pairs, 9 window scroll\/resize\/orientation pairs, 1 window\s+storage\/visibility pair, 104 local click pairs, 70 local change\/input\/keydown\s+pairs, 8 vendor transport lifecycle pairs, and 2 generated shell nonliteral\s+pairs/);
  assert.match(source, /Event-target cleanup authority remains\s+`NO-GO` until every pair has owner, route\/surface, settings\/list-mode\s+predicate, side-effect proof, teardown or page-lifetime reason, and\s+positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Event Listener Event-Target Matrix Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener event-target matrix rows: 292/);
  assert.match(lifecycleDoc, /document click listener pairs: 10/);
  assert.match(lifecycleDoc, /document DOMContentLoaded listener pairs: 7/);
  assert.match(lifecycleDoc, /document keydown listener pairs: 3/);
  assert.match(lifecycleDoc, /window message listener pairs: 4/);
  assert.match(lifecycleDoc, /local element click listener pairs: 104/);
  assert.match(lifecycleDoc, /listener event-target cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII listener event-target flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid listener event-target flow diagram: present/);

  assert.match(source, /Observer Observe Target Addendum - 2026-05-28/);
  assert.match(source, /source-derived observer observe target addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 21 current tracked/);
  assert.ok(source.includes('`.observe(...)` activation calls'));
  assert.match(source, /4 card\/row targets/);
  assert.match(source, /3 `document\.body` targets/);
  assert.match(source, /4 dropdown targets/);
  assert.match(source, /3\s+generic target expressions/);
  assert.match(source, /2 panel\/rail targets/);
  assert.match(source, /1 select target/);
  assert.match(source, /4 other\s+website targets/);
  assert.match(source, /Observer\s+observe target cleanup authority remains at `NO-GO` until every target has\s+owner, observer type, install trigger, route\/surface, settings\/list-mode\s+predicate, no-work budget, disconnect reason, mutation\/visibility side effect,\s+and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Observer Observe Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer observe rows: 21/);
  assert.match(lifecycleDoc, /document body observe targets: 3/);
  assert.match(lifecycleDoc, /dropdown observe targets: 4/);
  assert.match(lifecycleDoc, /generic target observe targets: 3/);
  assert.match(lifecycleDoc, /card or row observe targets: 4/);
  assert.match(lifecycleDoc, /panel or rail observe targets: 2/);
  assert.match(lifecycleDoc, /select observe targets: 1/);
  assert.match(lifecycleDoc, /other observe targets: 4/);
  assert.match(lifecycleDoc, /observer observe target cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII observer observe target flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid observer observe target flow diagram: present/);

  assert.match(source, /Observer Observe Option Shape Addendum - 2026-05-28/);
  assert.match(source, /source-derived observer observe option-shape addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /classifies all 21 current tracked `\.observe\(\.\.\.\)` activation\s+calls by option shape: 9 `childList \+ subtree` observers, 1 `childList`-only\s+observer, 5 no-option visibility\/website observers, and 5 attribute-filter\s+observers/);
  assert.match(source, /2 style\/hidden attribute filters, 1 `aria-hidden`\s+attribute filter, 1 `disabled` attribute filter, 1 collaborator identity\s+attribute filter, 16 content-runtime observer observe option rows, 1\s+extension UI\/background observer observe option row, and 4 website component\s+observer observe option rows/);
  assert.match(source, /proves option shape\s+only; it does not prove wake-frequency safety, subtree necessity, or teardown\s+authority/);
  assert.match(source, /Observer observe option-shape cleanup authority\s+remains at `NO-GO` until each option shape has owner, observer type, target,\s+route\/surface, settings\/list-mode predicate, callback side effects,\s+wake-frequency evidence, no-work budget, release reason, and positive\/negative\s+fixtures/);
  assert.match(lifecycleDoc, /Observer Observe Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer observe option rows: 21/);
  assert.match(lifecycleDoc, /observer observe childList subtree option rows: 9/);
  assert.match(lifecycleDoc, /observer observe childList only option rows: 1/);
  assert.match(lifecycleDoc, /observer observe no-options rows: 5/);
  assert.match(lifecycleDoc, /observer observe attribute filter rows: 5/);
  assert.match(lifecycleDoc, /observer observe option-shape cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII observer observe option-shape flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid observer observe option-shape flow diagram: present/);

  assert.match(source, /Observer Disconnect Addendum - 2026-05-28/);
  assert.match(source, /source-derived observer disconnect addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 14 current tracked observer `\.disconnect\(\)` and\s+optional-chain `\.disconnect\?\.\(\)` invocations/);
  assert.match(source, /6 local `observer` variable\s+disconnects, 2 dropdown close observer disconnects, 1 dropdown discovery\s+observer disconnect, 1 collaborator dialog observer disconnect, 1 playlist\s+fallback row observer state disconnect, and 3 other website observer\s+disconnects/);
  assert.match(source, /Observer disconnect cleanup authority remains at\s+`NO-GO` until every disconnect call has its matching observe target, install\s+trigger, route\/surface, settings\/list-mode predicate, native\/menu impact,\s+page-lifetime reason, no-work budget, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Observer Disconnect Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer disconnect rows: 14/);
  assert.match(lifecycleDoc, /local observer variable disconnect calls: 6/);
  assert.match(lifecycleDoc, /dropdown close observer disconnect calls: 2/);
  assert.match(lifecycleDoc, /dropdown discovery observer disconnect calls: 1/);
  assert.match(lifecycleDoc, /collab dialog observer disconnect calls: 1/);
  assert.match(lifecycleDoc, /popover row observer state disconnect calls: 1/);
  assert.match(lifecycleDoc, /other observer disconnect receiver calls: 3/);
  assert.match(lifecycleDoc, /observer disconnect cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII observer disconnect flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid observer disconnect flow diagram: present/);

  assert.match(source, /Observer Observe\/Release Parity Addendum - 2026-05-28/);
  assert.match(source, /source-derived observer observe\/release parity addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /joins all 21 current tracked `\.observe\(\.\.\.\)` activation rows\s+to 15 release rows: 14 `\.disconnect\(\.\.\.\)` or `\.disconnect\?\.\(\.\.\.\)` rows and 1\s+`\.unobserve\(\.\.\.\)` row/);
  assert.match(source, /current row-count delta is 6 observe rows over\s+release rows/);
  assert.match(source, /11 local `observer` observe rows, 2 local `obs` observe\s+rows, 8 exact named observer observe rows, 7 exact named observer observe rows\s+with release, 1 exact named observer observe row without release, 1\s+`prefetchObserver\.observe\(card\)` row without direct release/);
  assert.match(source, /content-runtime\s+observe\/release delta of 5, and an extension UI\/background observe\/release\s+delta of 1 plus a website component observe\/release delta of 0/);
  assert.match(source, /Observer\s+observe\/release cleanup authority remains at `NO-GO` until every activation has\s+owner, observer type, target, route\/surface, settings\/list-mode predicate,\s+release reason, no-work budget, mutation\/visibility side effect, and\s+positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Observer Observe\/Release Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer observe rows for release parity: 21/);
  assert.match(lifecycleDoc, /observer release rows for parity: 15/);
  assert.match(lifecycleDoc, /observer disconnect release rows: 14/);
  assert.match(lifecycleDoc, /observer unobserve release rows: 1/);
  assert.match(lifecycleDoc, /observer observe-minus-release delta: 6/);
  assert.match(lifecycleDoc, /exact named observer observe rows without release: 1/);
  assert.match(lifecycleDoc, /prefetch observer observe rows without release: 1/);
  assert.match(lifecycleDoc, /observer observe\/release cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII observer observe\/release parity flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid observer observe\/release parity flow diagram: present/);

  assert.match(source, /Observer Constructor\/Observe Type Parity Addendum - 2026-05-28/);
  assert.match(source, /source-derived observer constructor\/observe type parity addendum with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /compares all 20 observer constructor rows to all 21\s+`\.observe\(\.\.\.\)` activation rows by observer type/);
  assert.match(source, /16 `MutationObserver`\s+constructor rows, 4 `IntersectionObserver` constructor rows, 19 mutation\s+observer observe rows, and 2 intersection observer observe rows/);
  assert.match(source, /constructor-minus-observe delta is -1 overall, -3 for mutation\s+observer rows, 2 for intersection observer rows, 0 for content-runtime rows,\s+0 for extension UI\/background rows, and -1 for website component rows/);
  assert.match(source, /proves count\/type parity only; it\s+does not prove teardown authority or no-work safety for any observer owner/);
  assert.match(source, /Observer constructor\/observe type cleanup authority remains at `NO-GO` until\s+each constructor is tied to owner, callback side effect, observe target,\s+route\/surface, settings\/list-mode predicate, release reason, no-work budget,\s+and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Observer Constructor\/Observe Type Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer constructor rows for type parity: 20/);
  assert.match(lifecycleDoc, /MutationObserver constructor rows for type parity: 16/);
  assert.match(lifecycleDoc, /IntersectionObserver constructor rows for type parity: 4/);
  assert.match(lifecycleDoc, /observer observe rows for type parity: 21/);
  assert.match(lifecycleDoc, /observer constructor-minus-observe delta: -1/);
  assert.match(lifecycleDoc, /observer constructor\/observe type cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII observer constructor\/observe type parity flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid observer constructor\/observe type parity flow diagram: present/);

  assert.match(source, /Observer Constructor Callback Identity Addendum - 2026-05-28/);
  assert.match(source, /source-derived observer constructor callback identity addendum with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /classifies all 20 current `new MutationObserver\(\.\.\.\)`\s+and `new IntersectionObserver\(\.\.\.\)` callback arguments into 20 inline arrow\s+callbacks, 0 identifier callbacks, and 0 missing callbacks/);
  assert.match(source, /9 observer callbacks with a `mutations` parameter, 2\s+observer callbacks with an `entries` parameter, 7 observer callbacks with no\s+parameter, 2 other callback-parameter shapes, 16 content-runtime observer\s+constructor callbacks, 1 extension UI\/background observer constructor callback,\s+and 3 website component observer constructor callbacks/);
  assert.match(source, /proves callback shape only;\s+it does not prove callback side-effect safety, wake frequency, or teardown\s+authority/);
  assert.match(source, /Observer constructor callback cleanup authority remains at `NO-GO` until each\s+callback has owner, observed target, route\/surface, settings\/list-mode\s+predicate, callback side effects, no-work budget, wake-frequency evidence,\s+release reason, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Observer Constructor Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer constructor callback rows: 20/);
  assert.match(lifecycleDoc, /inline arrow observer constructor callbacks: 20/);
  assert.match(lifecycleDoc, /observer callbacks with mutations parameter: 9/);
  assert.match(lifecycleDoc, /observer callbacks with entries parameter: 2/);
  assert.match(lifecycleDoc, /observer callbacks with no parameter: 7/);
  assert.match(lifecycleDoc, /observer constructor callback cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII observer constructor callback flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid observer constructor callback flow diagram: present/);

  assert.match(source, /Timer Delay Shape Addendum - 2026-05-28/);
  assert.match(source, /source-derived timer delay-shape addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 126 current `setTimeout` and `setInterval` delay arguments\s+into 123 `setTimeout` delay rows, 3 `setInterval` delay rows, 16 zero-delay\s+timers, 16 1-99ms timers, 18 100-199ms timers, 17 200-999ms timers, 13\s+1000-4999ms timers, 4 5000ms-plus timers, 37 named\/expression timers, 5\s+`Math\.max\(\.\.\.\)` expression timers, and 0 missing delay arguments/);
  assert.match(source, /Timer delay cleanup authority remains at\s+`NO-GO` until every timer has owner, route\/surface, settings\/list-mode\s+predicate, no-rule budget, stale-route cancellation, scheduled side effect,\s+native\/menu impact, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Timer Delay Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /timer delay rows: 126/);
  assert.match(lifecycleDoc, /setTimeout delay rows: 123/);
  assert.match(lifecycleDoc, /setInterval delay rows: 3/);
  assert.match(lifecycleDoc, /numeric zero timer delays: 16/);
  assert.match(lifecycleDoc, /numeric 1-99ms timer delays: 16/);
  assert.match(lifecycleDoc, /numeric 100-199ms timer delays: 18/);
  assert.match(lifecycleDoc, /numeric 200-999ms timer delays: 17/);
  assert.match(lifecycleDoc, /numeric 1000-4999ms timer delays: 13/);
  assert.match(lifecycleDoc, /numeric 5000ms plus timer delays: 4/);
  assert.match(lifecycleDoc, /named or expression timer delays: 37/);
  assert.match(lifecycleDoc, /math max expression timer delays: 5/);
  assert.match(lifecycleDoc, /missing timer delay arguments: 0/);
  assert.match(lifecycleDoc, /timer delay cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII timer delay flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid timer delay flow diagram: present/);

  assert.match(source, /Timer Callback Identity Addendum - 2026-05-28/);
  assert.match(source, /source-derived timer callback identity addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 126 current `setTimeout` and `setInterval`\s+callback arguments into 123 `setTimeout` callback rows, 3 `setInterval`\s+callback rows, 107 inline arrow timer callbacks, 19 identifier timer\s+callbacks, 0 inline function timer callbacks, 0 member-reference timer\s+callbacks, 0 missing callback arguments, 86 content-runtime callbacks, 39\s+extension UI\/background callbacks, and 1 website-component callback/);
  assert.match(source, /Timer\s+callback cleanup authority remains at `NO-GO` until every timer callback has\s+owner, route\/surface, delay, handle\/cancel policy, captured-state proof,\s+settings\/list-mode predicate, scheduled DOM\/message\/storage\/network side\s+effect, stale-route cancellation, no-rule budget, and positive\/negative\s+fixtures/);
  assert.match(lifecycleDoc, /Timer Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /timer callback rows: 126/);
  assert.match(lifecycleDoc, /setTimeout callback rows: 123/);
  assert.match(lifecycleDoc, /setInterval callback rows: 3/);
  assert.match(lifecycleDoc, /inline arrow timer callbacks: 107/);
  assert.match(lifecycleDoc, /identifier timer callbacks: 19/);
  assert.match(lifecycleDoc, /inline function timer callbacks: 0/);
  assert.match(lifecycleDoc, /member reference timer callbacks: 0/);
  assert.match(lifecycleDoc, /missing timer callback arguments: 0/);
  assert.match(lifecycleDoc, /content runtime timer callbacks: 86/);
  assert.match(lifecycleDoc, /extension UI background timer callbacks: 39/);
  assert.match(lifecycleDoc, /website component timer callbacks: 1/);
  assert.match(lifecycleDoc, /timer callback cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII timer callback flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid timer callback flow diagram: present/);

  assert.match(source, /Timer Schedule\/Clear Parity Addendum - 2026-05-28/);
  assert.match(source, /source-derived timer schedule\/clear parity addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /joins all 123 current `setTimeout` schedule rows, 34\s+`clearTimeout` rows, 3 `setInterval` schedule rows, and 4 `clearInterval`\s+rows by direct lexical handle where one exists/);
  assert.match(source, /89 timeout\s+schedule-minus-clear delta, -1 interval schedule-minus-clear delta, 11 timeout\s+schedules with assigned local id handles, 24 assigned named state handles, 10\s+assigned property-held handles, 63 fire-and-forget schedules, 14 promise\s+sleep\/timeout schedules, 1 returned timer handle schedule, 3 interval schedules\s+with assigned named state handles, 32 `clearTimeout` rows with direct schedule\s+handle, 2 `clearTimeout` rows without direct schedule handle, 26 handled\s+timeout schedule rows with clear handle, 19 handled timeout schedule rows\s+without clear handle, 18 distinct scheduled timeout handles without clear, 4\s+`clearInterval` rows with direct schedule handle, 0 `clearInterval` rows\s+without direct schedule handle, 3 handled interval schedule rows with clear\s+handle, 0 handled interval schedule rows without clear handle, and 0 distinct\s+scheduled interval handles without clear/);
  assert.match(source, /Timer schedule\/clear cleanup authority\s+remains at `NO-GO` until every timer has owner, route\/surface,\s+settings\/list-mode predicate, no-rule budget, stale-route cancellation,\s+scheduled side effect, native\/menu impact, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Timer Schedule\/Clear Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /setTimeout schedule rows for parity: 123/);
  assert.match(lifecycleDoc, /clearTimeout rows for parity: 34/);
  assert.match(lifecycleDoc, /setInterval schedule rows for parity: 3/);
  assert.match(lifecycleDoc, /clearInterval rows for parity: 4/);
  assert.match(lifecycleDoc, /setTimeout schedule-minus-clear delta: 89/);
  assert.match(lifecycleDoc, /setInterval schedule-minus-clear delta: -1/);
  assert.match(lifecycleDoc, /timeout schedules with assigned local id handle: 11/);
  assert.match(lifecycleDoc, /timeout schedules with assigned named state handle: 24/);
  assert.match(lifecycleDoc, /timeout schedules with assigned property-held handle: 10/);
  assert.match(lifecycleDoc, /timeout fire-and-forget schedules: 63/);
  assert.match(lifecycleDoc, /timeout promise sleep or timeout schedules: 14/);
  assert.match(lifecycleDoc, /timeout returned handle schedules: 1/);
  assert.match(lifecycleDoc, /interval schedules with assigned named state handle: 3/);
  assert.match(lifecycleDoc, /clearTimeout rows with direct schedule handle: 32/);
  assert.match(lifecycleDoc, /clearTimeout rows without direct schedule handle: 2/);
  assert.match(lifecycleDoc, /handled timeout schedule rows with clear handle: 26/);
  assert.match(lifecycleDoc, /handled timeout schedule rows without clear handle: 19/);
  assert.match(lifecycleDoc, /distinct scheduled timeout handles without clear: 18/);
  assert.match(lifecycleDoc, /clearInterval rows with direct schedule handle: 4/);
  assert.match(lifecycleDoc, /clearInterval rows without direct schedule handle: 0/);
  assert.match(lifecycleDoc, /handled interval schedule rows with clear handle: 3/);
  assert.match(lifecycleDoc, /handled interval schedule rows without clear handle: 0/);
  assert.match(lifecycleDoc, /distinct scheduled interval handles without clear: 0/);
  assert.match(lifecycleDoc, /content runtime timer schedule\/clear delta: 61/);
  assert.match(lifecycleDoc, /extension UI background timer schedule\/clear delta: 28/);
  assert.match(lifecycleDoc, /website component timer schedule\/clear delta: -1/);
  assert.match(lifecycleDoc, /timer schedule\/clear cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII timer schedule\/clear parity flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid timer schedule\/clear parity flow diagram: present/);

  assert.match(source, /Explicit Teardown Handle Addendum - 2026-05-28/);
  assert.match(source, /source-derived explicit teardown handle addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 55 current explicit teardown rows into 13\s+`removeEventListener` rows, 34 `clearTimeout` rows, 4 `clearInterval` rows, 4\s+`cancelAnimationFrame` rows, 7 listener document targets, 2 listener window\s+targets, 2 generated shell listener targets, 2 other listener targets, 12 local timeout id handles, 14\s+named timeout state handles, 8 property-held timeout handles, 2 engine-check\s+interval handles, 1 warmup interval handle, 1 dashboard rotation interval\s+handle, 2 profile dropdown frame handles, 1 generic position frame handle, and\s+1 other frame handle/);
  assert.match(source, /Explicit teardown cleanup authority remains at `NO-GO` until every\s+clear\/remove\/cancel has its matching install\/schedule row, owner,\s+route\/surface, settings\/list-mode predicate, callback identity proof,\s+stale-route policy, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Explicit Teardown Handle Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /explicit teardown handle rows: 55/);
  assert.match(lifecycleDoc, /removeEventListener teardown rows: 13/);
  assert.match(lifecycleDoc, /clearTimeout teardown rows: 34/);
  assert.match(lifecycleDoc, /clearInterval teardown rows: 4/);
  assert.match(lifecycleDoc, /cancelAnimationFrame teardown rows: 4/);
  assert.match(lifecycleDoc, /listener document teardown targets: 7/);
  assert.match(lifecycleDoc, /listener window teardown targets: 2/);
  assert.match(lifecycleDoc, /listener generated shell teardown targets: 2/);
  assert.match(lifecycleDoc, /listener other teardown targets: 2/);
  assert.match(lifecycleDoc, /timeout local id teardown handles: 12/);
  assert.match(lifecycleDoc, /timeout named state teardown handles: 14/);
  assert.match(lifecycleDoc, /timeout property held teardown handles: 8/);
  assert.match(lifecycleDoc, /interval engine check teardown handles: 2/);
  assert.match(lifecycleDoc, /interval warmup teardown handles: 1/);
  assert.match(lifecycleDoc, /interval dashboard rotation teardown handles: 1/);
  assert.match(lifecycleDoc, /frame profile dropdown teardown handles: 2/);
  assert.match(lifecycleDoc, /frame position teardown handles: 1/);
  assert.match(lifecycleDoc, /frame other teardown handles: 1/);
  assert.match(lifecycleDoc, /explicit teardown cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII explicit teardown flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid explicit teardown flow diagram: present/);

  assert.match(source, /Event Listener Callback Identity Addendum - 2026-05-28/);
  assert.match(source, /source-derived listener callback identity addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 292 current `addEventListener` callback arguments\s+into 252 inline arrow callbacks, 37 identifier callback references, 1 member\s+callback reference, 2 generated expression callbacks, 74 content-runtime\s+callbacks, 201 extension UI\/background callbacks, 2 generated-output\s+callbacks, 8 vendor-bundle callbacks, and 7 website-component callbacks/);
  assert.match(source, /Listener callback cleanup authority remains at\s+`NO-GO` until every callback has target, event, option, owner,\s+closure-capture,\s+settings\/list-mode predicate, native\/menu impact, teardown or\s+page-lifetime\s+reason, duplicate-install proof, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Event Listener Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener callback rows: 292/);
  assert.match(lifecycleDoc, /inline arrow listener callbacks: 252/);
  assert.match(lifecycleDoc, /identifier listener callbacks: 37/);
  assert.match(lifecycleDoc, /member reference listener callbacks: 1/);
  assert.match(lifecycleDoc, /other generated expression listener callbacks: 2/);
  assert.match(lifecycleDoc, /missing listener callback arguments: 0/);
  assert.match(lifecycleDoc, /content runtime listener callbacks: 74/);
  assert.match(lifecycleDoc, /extension UI background listener callbacks: 201/);
  assert.match(lifecycleDoc, /generated output listener callbacks: 2/);
  assert.match(lifecycleDoc, /vendor bundle listener callbacks: 8/);
  assert.match(lifecycleDoc, /website component listener callbacks: 7/);
  assert.match(lifecycleDoc, /listener callback cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII listener callback flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid listener callback flow diagram: present/);

  assert.match(source, /Event Listener Add\/Remove Parity Addendum - 2026-05-28/);
  assert.match(source, /source-derived listener add\/remove parity addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /joins all 292 current `addEventListener` install rows and 13\s+current `removeEventListener` teardown rows by target, event, callback, and\s+capture semantics/);
  assert.match(source, /279 install-minus-remove delta, 13\s+capture-equivalent remove pairs, 12 exact option-shape remove pairs, 1\s+capture-equivalent option-shape mismatch pair, 0 remove rows without a\s+capture-equivalent add pair, 51 page-global listener installs without explicit\s+remove, 252 inline listener installs without remove handle, 70 content-runtime\s+add\/remove delta, 201 extension UI\/background delta, 0 generated-output delta,\s+8 vendor-bundle delta, 0 website-component delta, 7 document listener removes,\s+2 window listener removes, and 2 generated shell listener removes/);
  assert.match(source, /Listener add\/remove\s+cleanup authority remains at `NO-GO` until every listener has owner,\s+route\/page lifetime, target\/event\/callback\/options, duplicate-install\s+behavior, native menu impact, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Event Listener Add\/Remove Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener install rows for parity: 292/);
  assert.match(lifecycleDoc, /removeEventListener teardown rows for parity: 13/);
  assert.match(lifecycleDoc, /listener install-minus-remove delta: 279/);
  assert.match(lifecycleDoc, /capture-equivalent listener remove pairs: 13/);
  assert.match(lifecycleDoc, /exact option-shape listener remove pairs: 12/);
  assert.match(lifecycleDoc, /capture-equivalent option-shape mismatch listener pairs: 1/);
  assert.match(lifecycleDoc, /listener remove rows without capture-equivalent add pair: 0/);
  assert.match(lifecycleDoc, /page-global listener installs without explicit remove: 51/);
  assert.match(lifecycleDoc, /inline listener installs without remove handle: 252/);
  assert.match(lifecycleDoc, /content runtime listener add\/remove delta: 70/);
  assert.match(lifecycleDoc, /extension UI background listener add\/remove delta: 201/);
  assert.match(lifecycleDoc, /generated UI output listener add\/remove delta: 0/);
  assert.match(lifecycleDoc, /vendor bundle listener add\/remove delta: 8/);
  assert.match(lifecycleDoc, /website component listener add\/remove delta: 0/);
  assert.match(lifecycleDoc, /document listener removes: 7/);
  assert.match(lifecycleDoc, /window listener removes: 2/);
  assert.match(lifecycleDoc, /generated shell listener removes: 2/);
  assert.match(lifecycleDoc, /listener add\/remove cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII listener add\/remove parity flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid listener add\/remove parity flow diagram: present/);

  assert.match(source, /Content Runtime Page-Global Listener Boundary Addendum - 2026-05-28/);
  assert.match(source, /source-derived content-runtime page-global listener boundary addendum with\s+ASCII and Mermaid flow diagrams/);
  assert.match(source, /isolates all 42 current content-runtime\s+`document`\/`window` listener rows from the broader 292-listener inventory/);
  assert.match(source, /32 document listener rows, 10 window listener rows, 8\s+source files, 12 quick-block global rows, 3 native menu global rows, 1 Kids\s+passive menu row/);
  assert.match(source, /5 content bridge prefetch\/whitelist rows, 7 content bridge\s+fallback menu rows, 1 content bridge main-world message row, 2 injector\s+main-world message rows, 7 click rows, 6 DOMContentLoaded rows, 5\s+`yt-navigate-finish` rows, 4 message rows, and 4 scroll rows/);
  assert.match(source, /Content-runtime page-global listener cleanup\s+authority remains at `NO-GO` until each row has owner, route, surface,\s+mode\/list predicate, duplicate-install behavior, native menu impact,\s+page-message trust impact, no-work budget, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /content runtime page-global listener rows: 42/);
  assert.match(lifecycleDoc, /content runtime document listener rows: 32/);
  assert.match(lifecycleDoc, /content runtime window listener rows: 10/);
  assert.match(lifecycleDoc, /content runtime page-global source files: 8/);
  assert.match(lifecycleDoc, /quick-block global listener rows: 12/);
  assert.match(lifecycleDoc, /native menu global listener rows: 3/);
  assert.match(lifecycleDoc, /kids passive menu listener rows: 1/);
  assert.match(lifecycleDoc, /content bridge prefetch whitelist listener rows: 5/);
  assert.match(lifecycleDoc, /content bridge fallback menu listener rows: 7/);
  assert.match(lifecycleDoc, /content bridge main-world message listener rows: 1/);
  assert.match(lifecycleDoc, /injector main-world message listener rows: 2/);
  assert.match(lifecycleDoc, /page-global click listener rows: 7/);
  assert.match(lifecycleDoc, /page-global DOMContentLoaded listener rows: 6/);
  assert.match(lifecycleDoc, /page-global yt-navigate-finish listener rows: 5/);
  assert.match(lifecycleDoc, /page-global message listener rows: 4/);
  assert.match(lifecycleDoc, /page-global scroll listener rows: 4/);
  assert.match(lifecycleDoc, /content runtime page-global listener cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII content runtime page-global listener flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid content runtime page-global listener flow diagram: present/);

  assert.match(source, /Content Runtime Page-Global Listener Row Context Addendum - 2026-05-28/);
  assert.match(source, /source-derived row-context addendum for the same 42 current content-runtime\s+`document`\/`window` listener rows/);
  assert.match(source, /classifies each row into a current owner,\s+route scope, surface scope, active predicate class, and duplicate-install\s+boundary/);
  assert.match(source, /42 row-context rows, 16 route scopes, 16 surface scopes,\s+14 active predicate classes, and 20 duplicate-install boundary classes/);
  assert.match(source, /12 quick-block enabled-gated rows, 6 fallback menu eager-or-hover gated\s+rows, 4 main-world message source-gated rows, 3 identity prefetch-work gated\s+rows, and 2 whitelist non-watch gated rows/);
  assert.match(source, /Content-runtime page-global row-context cleanup authority remains at\s+`NO-GO` until native menu impact, page-message trust impact, no-work budget,\s+positive fixtures, negative sibling fixtures, and teardown or page-lifetime\s+justification are proven per row/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Row Context Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /content runtime page-global row-context rows: 42/);
  assert.match(lifecycleDoc, /content runtime page-global route scopes: 16/);
  assert.match(lifecycleDoc, /content runtime page-global surface scopes: 16/);
  assert.match(lifecycleDoc, /content runtime page-global predicate classes: 14/);
  assert.match(lifecycleDoc, /content runtime page-global duplicate guard classes: 20/);
  assert.match(lifecycleDoc, /page-global quick-block enabled-gated rows: 12/);
  assert.match(lifecycleDoc, /page-global fallback menu eager-or-hover gated rows: 6/);
  assert.match(lifecycleDoc, /page-global main-world message source-gated rows: 4/);
  assert.match(lifecycleDoc, /page-global identity prefetch-work gated rows: 3/);
  assert.match(lifecycleDoc, /page-global whitelist non-watch gated rows: 2/);
  assert.match(lifecycleDoc, /content runtime page-global row-context cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII content runtime page-global row-context flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid content runtime page-global row-context flow diagram: present/);

  assert.match(source, /Content Runtime Page-Global Listener Impact And Fixture Addendum - 2026-05-28/);
  assert.match(source, /source-derived impact and fixture addendum for the same 42 current\s+content-runtime `document`\/`window` listener rows/);
  assert.match(source, /classifies each row into\s+native\/menu impact, page-message trust impact, no-work budget, positive fixture,\s+negative fixture, and page-lifetime justification classes/);
  assert.match(source, /42 impact rows, 10 native\/menu impact classes, 6\s+page-message trust classes, 14 no-work budget classes, 13 positive fixture\s+classes, 12 negative fixture classes, and 6 page-lifetime classes/);
  assert.match(source, /12 quick-block affordance impact rows, 7 custom fallback menu impact rows, 5\s+page-message impact rows, 37 no page-message trust impact rows, and 30 module\s+singleton page-lifetime rows/);
  assert.match(source, /Content-runtime page-global impact\/fixture cleanup authority\s+remains at `NO-GO` until actual fixture artifacts and metric\/no-work evidence\s+prove each row's positive behavior, negative sibling behavior, native\/menu\s+impact, trust boundary, and page-lifetime or transient-remove justification/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Impact And Fixture Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /content runtime page-global impact rows: 42/);
  assert.match(lifecycleDoc, /content runtime page-global native\/menu impact classes: 10/);
  assert.match(lifecycleDoc, /content runtime page-global page-message trust classes: 6/);
  assert.match(lifecycleDoc, /content runtime page-global no-work budget classes: 14/);
  assert.match(lifecycleDoc, /content runtime page-global positive fixture classes: 13/);
  assert.match(lifecycleDoc, /content runtime page-global negative fixture classes: 12/);
  assert.match(lifecycleDoc, /content runtime page-global page-lifetime classes: 6/);
  assert.match(lifecycleDoc, /page-global quick-block affordance impact rows: 12/);
  assert.match(lifecycleDoc, /page-global custom fallback menu impact rows: 7/);
  assert.match(lifecycleDoc, /page-global page-message impact rows: 5/);
  assert.match(lifecycleDoc, /page-global no page-message trust impact rows: 37/);
  assert.match(lifecycleDoc, /page-global module singleton page-lifetime rows: 30/);
  assert.match(lifecycleDoc, /content runtime page-global impact\/fixture cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII content runtime page-global impact fixture flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid content runtime page-global impact fixture flow diagram: present/);

  assert.match(source, /Animation Frame Schedule Addendum - 2026-05-28/);
  assert.match(source, /source-derived animation frame schedule addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /classifies all 31 current `requestAnimationFrame` schedules into\s+2 assigned positioning frame handles, 15 inline anonymous frame callbacks, 7\s+identifier callback frames, 5 inline `scrollIntoView` frames, 2 inline timeout\s+hop frames, 13 content-runtime frame schedules, 16 extension UI\/background\s+frame schedules, 2 website component frame schedules, 1 `positionRaf`\s+assignment, and 1\s+`profileDropdownPositionRaf` assignment/);
  assert.match(source, /Animation frame schedule cleanup authority remains at\s+`NO-GO` until every frame schedule has owner, route\/surface,\s+settings\/list-mode predicate, scheduled DOM\/message\/timer side effect,\s+stale-route cancellation policy, matching cancel proof when a handle is\s+stored, and positive\/negative no-work fixtures/);
  assert.match(lifecycleDoc, /Animation Frame Schedule Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /requestAnimationFrame schedule rows: 31/);
  assert.match(lifecycleDoc, /assigned positioning frame handle schedules: 2/);
  assert.match(lifecycleDoc, /inline anonymous frame schedules: 15/);
  assert.match(lifecycleDoc, /identifier callback frame schedules: 7/);
  assert.match(lifecycleDoc, /inline scrollIntoView frame schedules: 5/);
  assert.match(lifecycleDoc, /inline timeout hop frame schedules: 2/);
  assert.match(lifecycleDoc, /content runtime frame schedules: 13/);
  assert.match(lifecycleDoc, /extension UI background frame schedules: 16/);
  assert.match(lifecycleDoc, /website component frame schedules: 2/);
  assert.match(lifecycleDoc, /positionRaf assigned frame schedules: 1/);
  assert.match(lifecycleDoc, /profileDropdownPositionRaf assigned frame schedules: 1/);
  assert.match(lifecycleDoc, /animation frame schedule cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII animation frame schedule flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid animation frame schedule flow diagram: present/);

  assert.match(source, /Animation Frame Schedule\/Cancel Parity Addendum - 2026-05-28/);
  assert.match(source, /source-derived animation frame schedule\/cancel parity addendum with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /joins all 31 current `requestAnimationFrame`\s+schedule rows and 4 current `cancelAnimationFrame` rows by direct lexical\s+handle where one exists/);
  assert.match(source, /27 frame schedule-minus-cancel delta, 29\s+frame schedules without assigned handles, 2 frame schedules with assigned\s+handles, 3 `cancelAnimationFrame` rows with direct schedule handles, 1\s+`cancelAnimationFrame` row without direct schedule handle, 2 handled frame\s+schedule rows with cancel handles, 0 handled frame schedule rows without\s+cancel handles, 0 distinct scheduled frame handles without cancel, 13\s+content-runtime frame schedule\/cancel delta, 13 extension UI\/background frame\s+schedule\/cancel delta, 1 `positionRaf` cancel row, 2\s+`profileDropdownPositionRaf` cancel rows, and 1 `frameId` website cancel row/);
  assert.match(source, /Animation frame schedule\/cancel cleanup authority remains at `NO-GO` until\s+every frame has owner, route\/surface, settings\/list-mode predicate, frame side\s+effect, stale-route policy, no-work budget, native\/menu impact, and\s+positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Animation Frame Schedule\/Cancel Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /requestAnimationFrame schedule rows for parity: 31/);
  assert.match(lifecycleDoc, /cancelAnimationFrame rows for parity: 4/);
  assert.match(lifecycleDoc, /animation frame schedule-minus-cancel delta: 27/);
  assert.match(lifecycleDoc, /frame schedules without assigned handle: 29/);
  assert.match(lifecycleDoc, /frame schedules with assigned handle: 2/);
  assert.match(lifecycleDoc, /cancelAnimationFrame rows with direct schedule handle: 3/);
  assert.match(lifecycleDoc, /cancelAnimationFrame rows without direct schedule handle: 1/);
  assert.match(lifecycleDoc, /handled frame schedule rows with cancel handle: 2/);
  assert.match(lifecycleDoc, /handled frame schedule rows without cancel handle: 0/);
  assert.match(lifecycleDoc, /distinct scheduled frame handles without cancel: 0/);
  assert.match(lifecycleDoc, /content runtime frame schedule\/cancel delta: 13/);
  assert.match(lifecycleDoc, /extension UI background frame schedule\/cancel delta: 13/);
  assert.match(lifecycleDoc, /website component frame schedule\/cancel delta: 1/);
  assert.match(lifecycleDoc, /positionRaf cancel rows: 1/);
  assert.match(lifecycleDoc, /profileDropdownPositionRaf cancel rows: 2/);
  assert.match(lifecycleDoc, /frameId cancel rows: 1/);
  assert.match(lifecycleDoc, /animation frame schedule\/cancel cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII animation frame schedule\/cancel parity flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid animation frame schedule\/cancel parity flow diagram: present/);

  assert.match(source, /Background Timer Owner\/Reason Addendum - 2026-05-28/);
  assert.match(source, /source-derived background timer owner\/reason addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /classifies all 14 current `js\/background\.js` timer lifecycle\s+rows into 10 `setTimeout` schedule rows and 4 `clearTimeout` rows/);
  assert.match(source, /3\s+backup\/download rows, 2 post-block enrichment rows, 3 identity map flush rows,\s+and 6 identity fetch network timeout rows/);
  assert.match(source, /1 auto-backup debounce schedule row, 1 auto-backup\s+debounce clear row, 1 blob URL revoke delay row, 1 post-block enrichment\s+wait-cap row, 1 post-block enrichment jitter row/);
  assert.match(source, /1 channel map flush debounce\s+row, 1 video channel map flush debounce row, 1 video meta map flush debounce\s+row, 3 fetch abort timeout schedule rows, 3 fetch abort timeout clear rows, and\s+0 explicit revision-token rows/);
  assert.match(source, /Background timer owner\/reason cleanup authority remains at `NO-GO`\s+until every timer has owner, trigger, storage\/network side effect, handle\s+ownership, profile\/list-mode relation, revision or stale-state policy,\s+no-work budget, and positive\/negative fixtures/);
  assert.match(lifecycleDoc, /Background Timer Owner\/Reason Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /background timer lifecycle rows: 14/);
  assert.match(lifecycleDoc, /background setTimeout schedule rows: 10/);
  assert.match(lifecycleDoc, /background clearTimeout rows: 4/);
  assert.match(lifecycleDoc, /backup\/download background timer rows: 3/);
  assert.match(lifecycleDoc, /post-block enrichment background timer rows: 2/);
  assert.match(lifecycleDoc, /identity map flush background timer rows: 3/);
  assert.match(lifecycleDoc, /identity fetch network timeout rows: 6/);
  assert.match(lifecycleDoc, /background timer explicit revision-token rows: 0/);
  assert.match(lifecycleDoc, /background timer owner\/reason cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII background timer owner\/reason flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid background timer owner\/reason flow diagram: present/);

  assert.match(source, /Generated\/Vendor Lifecycle Freshness Addendum - 2026-05-28/);
  assert.match(source, /source-derived generated\/vendor lifecycle freshness addendum with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /classifies all 12 current lifecycle rows owned by\s+generated UI shell output and vendor bundles into 8 vendor-bundle lifecycle\s+rows and 4 generated-shell output lifecycle rows/);
  assert.match(source, /8 vendor `addEventListener` rows, 0 vendor\s+`removeEventListener` rows, 2 generated-shell `addEventListener` rows, 2\s+generated-shell `removeEventListener` rows, 2 generated-shell lifecycle files,\s+1 vendor lifecycle file, 3 generated-shell source files, 2 generated-shell\s+output files, 1 generated UI build script file, 2 vendor bundle files, and 0\s+committed generated freshness manifest files/);
  assert.match(source, /Generated\/vendor lifecycle freshness cleanup authority remains at\s+`NO-GO` until each generated or vendor lifecycle row has source provenance,\s+package hash, build command or upstream version, manifest\/reference owner,\s+release package status, teardown\/page-lifetime reason, and positive\/negative\s+freshness fixtures/);
  assert.match(lifecycleDoc, /Generated\/Vendor Lifecycle Freshness Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /generated\/vendor lifecycle rows: 12/);
  assert.match(lifecycleDoc, /vendor bundle lifecycle rows: 8/);
  assert.match(lifecycleDoc, /generated shell output lifecycle rows: 4/);
  assert.match(lifecycleDoc, /vendor lifecycle addEventListener rows: 8/);
  assert.match(lifecycleDoc, /vendor lifecycle removeEventListener rows: 0/);
  assert.match(lifecycleDoc, /generated shell lifecycle addEventListener rows: 2/);
  assert.match(lifecycleDoc, /generated shell lifecycle removeEventListener rows: 2/);
  assert.match(lifecycleDoc, /committed generated freshness manifest files: 0/);
  assert.match(lifecycleDoc, /generated\/vendor lifecycle freshness cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII generated\/vendor lifecycle freshness flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid generated\/vendor lifecycle freshness flow diagram: present/);

  assert.match(source, /Website Component Lifecycle Boundary Addendum - 2026-05-28/);
  assert.match(source, /source-derived website component lifecycle boundary addendum with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /classifies all 23 current website component lifecycle\s+rows into 14 website other lifecycle rows, 5 scene scheduler lifecycle rows,\s+and 4 theme sync lifecycle rows/);
  assert.match(source, /13 install-or-schedule rows, 10 explicit-teardown rows, 7\s+website component `addEventListener` rows, 7 website component\s+`removeEventListener` rows, 1 website component `setTimeout` row, 2 website\s+component `clearTimeout` rows, 2 website component `requestAnimationFrame`\s+rows, 1 website component `cancelAnimationFrame` row, 4 lifecycle source files,\s+14 website other lifecycle rows/);
  assert.match(source, /2 scene scheduler\s+install-or-schedule rows, 3\s+scene scheduler explicit-teardown rows, 2 theme\s+sync install-or-schedule rows,\s+and 2 theme sync explicit-teardown rows/);
  assert.match(source, /Website component lifecycle cleanup authority\s+remains at `NO-GO` until every website lifecycle row has route, hydration\s+phase, unmount proof, storage\/theme side-effect proof, timer budget,\s+visibility\/background behavior, deploy artifact evidence, browser fixture\s+evidence, and public-claim impact proof/);
  assert.match(lifecycleDoc, /Website Component Lifecycle Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /website component lifecycle rows: 23/);
  assert.match(lifecycleDoc, /website component install-or-schedule rows: 13/);
  assert.match(lifecycleDoc, /website component explicit-teardown rows: 10/);
  assert.match(lifecycleDoc, /website other lifecycle rows: 14/);
  assert.match(lifecycleDoc, /website scene scheduler lifecycle rows: 5/);
  assert.match(lifecycleDoc, /website theme sync lifecycle rows: 4/);
  assert.match(lifecycleDoc, /website component lifecycle cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII website component lifecycle boundary flow diagram: present/);
  assert.match(lifecycleDoc, /Mermaid website component lifecycle boundary flow diagram: present/);

  const lifecycleTeardownDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20.md');
  assert.match(source, /Current Teardown Ownership Source-Flow Addendum - 2026-05-27/);
  assert.match(source, /current teardown ownership source-flow addendum with ASCII and\s+Mermaid diagrams/);
  assert.match(source, /pins seed XHR prototype wrapping, injector readiness\s+interval cleanup/);
  assert.match(source, /bridge identity prefetch, playlist prefetch, right-rail\s+whitelist observation/);
  assert.match(source, /whitelist pending timers, DOM fallback observer\s+disconnect\/reconnect, fallback menu scanning/);
  assert.match(source, /playlist fallback popover\s+cleanup, quick-block page lifecycle, and DOM fallback playlist\/player guards/);
  assert.match(source, /Current teardown source proof is `PARTIAL`/);
  assert.match(source, /shared lifecycle\s+teardown authority, route lifecycle pause authority, page-lifetime listener\s+budget authority, and no-work counter artifact authority remain at `NO-GO`/);
  assert.match(source, /route, surface, mode, trigger, active predicate, cleanup\s+primitive, page-lifetime reason, scheduled side effect, positive fixture, and\s+negative no-work fixture proof/);
  assert.match(lifecycleTeardownDoc, /Current Teardown Ownership Source-Flow Addendum - 2026-05-27/);
  assert.match(lifecycleTeardownDoc, /current teardown owner-flow rows: 11/);
  assert.match(lifecycleTeardownDoc, /ASCII teardown owner-flow diagram: present/);
  assert.match(lifecycleTeardownDoc, /Mermaid teardown owner-flow diagram: present/);
  assert.match(lifecycleTeardownDoc, /current teardown source proof: PARTIAL/);
  assert.match(lifecycleTeardownDoc, /shared lifecycle teardown authority: NO-GO/);
  assert.match(lifecycleTeardownDoc, /runtime behavior changed by this addendum: no/);
  assert.match(lifecycleTeardownDoc, /flowchart TD/);
  assert.match(lifecycleTeardownDoc, /\| `teardown_seed_xhr_patch_owner` \| `js\/seed\.js:757-921` \|/);
  assert.match(lifecycleTeardownDoc, /\| `teardown_bridge_dom_fallback_observer_owner` \| `js\/content_bridge\.js:6356-6466` \|/);
  assert.match(lifecycleTeardownDoc, /\| `teardown_bridge_fallback_menu_scanner_owner` \| `js\/content_bridge\.js:7094-7206` \|/);
  assert.match(lifecycleTeardownDoc, /\| `teardown_quick_block_page_lifecycle_owner` \| `js\/content\/block_channel\.js:1961-2289` \|/);
  assert.match(lifecycleTeardownDoc, /\| `teardown_dom_fallback_playlist_guard_owner` \| `js\/content\/dom_fallback\.js:2035-2418` \|/);

  const idleObserverDoc = read('docs/audit/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26.md');
  assert.match(source, /Performance risks \| `docs\/audit\/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18\.md`; `docs\/audit\/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26\.md`/);
  assert.match(source, /Empty-Install Idle Observer Budget Addendum - 2026-05-27/);
  assert.match(source, /idle observer budget ledger addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /quick-block idle gates, native dropdown discovery,\s+fallback menu eager gates, collaborator dialog pending-card lifecycle/);
  assert.match(source, /DOM\s+fallback\/prefetch gates, seed JSON idle pass-through, and the focused\s+executable harness/);
  assert.match(source, /empty desktop YouTube lag boundary/);
  assert.match(source, /Empty-install idle observer release proof is `PARTIAL`/);
  assert.match(source, /live\s+Chrome performance trace authority, active-rule\/mobile\/whitelist observer\s+budget authority, and broad observer\/listener\/timer completion remain at\s+`NO-GO`/);
  assert.match(idleObserverDoc, /Idle Observer Budget Ledger Addendum - 2026-05-27/);
  assert.match(idleObserverDoc, /flowchart TD/);
  assert.match(idleObserverDoc, /\| Quick-block idle gate \| `js\/content\/block_channel\.js:353`, `js\/content\/block_channel\.js:1291`, `js\/content\/block_channel\.js:1979-2022` \|/);
  assert.match(idleObserverDoc, /\| Native dropdown discovery \| `js\/content\/block_channel\.js:2493-2541` \|/);
  assert.match(idleObserverDoc, /\| Focused executable harness \| `tests\/runtime\/empty-install-idle-observer-budget-current-behavior\.test\.mjs` \|/);
  assert.match(idleObserverDoc, /empty-install idle observer release proof: PARTIAL/);
  assert.match(idleObserverDoc, /live Chrome performance trace authority: NO-GO/);
  assert.match(idleObserverDoc, /active-rule\/mobile\/whitelist observer budget authority: NO-GO/);
  assert.match(idleObserverDoc, /broad observer\/listener\/timer completion: NO-GO/);
  assert.match(idleObserverDoc, /runtime behavior changed by this addendum: no/);

  assert.match(source, /Mode-Split Observer Budget Addendum - 2026-05-27/);
  assert.match(source, /mode-split observer budget addendum with ASCII and Mermaid flow diagrams/);
  assert.match(source, /separates empty desktop blocklist proof from active desktop blocklist,\s+mobile\/coarse, whitelist, watch, YouTube Music, and Kids observer budgets/);
  assert.match(source, /empty desktop observer budget proof is\s+only `PARTIAL`/);
  assert.match(source, /active blocklist observer budget authority,\s+mobile\/coarse observer budget authority, whitelist observer budget authority,\s+and watch\/YTM\/Kids observer budget authority remain at `NO-GO`/);
  assert.match(lifecycleDoc, /Mode-Split Observer Budget Addendum - 2026-05-27/);
  assert.match(lifecycleDoc, /flowchart TD/);
  assert.match(lifecycleDoc, /\| Empty desktop blocklist \| `docs\/audit\/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26\.md:81-145` \|/);
  assert.match(lifecycleDoc, /\| Active desktop blocklist \| `js\/content\/block_channel\.js:353-365`, `js\/content\/block_channel\.js:1979-2028` \|/);
  assert.match(lifecycleDoc, /\| Mobile\/coarse YouTube \| `js\/content\/block_channel\.js:1291-1293`, `js\/content_bridge\.js:6473-6487`, `js\/content_bridge\.js:7139-7149` \|/);
  assert.match(lifecycleDoc, /\| Whitelist mode \| `js\/content_bridge\.js:1006-1015`, `js\/content_bridge\.js:1211-1226`, `js\/content_bridge\.js:1286-1301` \|/);
  assert.match(lifecycleDoc, /empty desktop observer budget proof: PARTIAL/);
  assert.match(lifecycleDoc, /active blocklist observer budget authority: NO-GO/);
  assert.match(lifecycleDoc, /mobile\/coarse observer budget authority: NO-GO/);
  assert.match(lifecycleDoc, /whitelist observer budget authority: NO-GO/);
  assert.match(lifecycleDoc, /watch\/YTM\/Kids observer budget authority: NO-GO/);
  assert.match(lifecycleDoc, /runtime behavior changed by this addendum: no/);

  const rightRailWhitelistDoc = read('docs/audit/FILTERTUBE_RIGHT_RAIL_WHITELIST_OBSERVER_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(source, /Whitelist Observer Budget Matrix Addendum - 2026-05-27/);
  assert.match(source, /whitelist observer budget matrix addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins seed\/injector JSON admission, identity prefetch,\s+right-rail observer install, whitelist pending timers, DOM fallback active\s+predicate, and quick\/menu quiet gates/);
  assert.match(source, /watch\/right-rail change/);
  assert.match(source, /Watch\/right-rail whitelist authority,\s+JSON-vs-DOM whitelist owner authority, and active whitelist live trace\s+authority remain at `NO-GO`/);
  assert.match(rightRailWhitelistDoc, /Whitelist Observer Budget Matrix Addendum - 2026-05-27/);
  assert.match(rightRailWhitelistDoc, /flowchart TD/);
  assert.match(rightRailWhitelistDoc, /\| JSON transport admission \| `js\/seed\.js:234-238`, `js\/injector\.js:185-188` \|/);
  assert.match(rightRailWhitelistDoc, /\| Right-rail observer install \| `js\/content_bridge\.js:1211-1226`, `js\/content_bridge\.js:1286-1301` \|/);
  assert.match(rightRailWhitelistDoc, /\| Whitelist pending timers \| `js\/content_bridge\.js:5992-6040` \|/);
  assert.match(rightRailWhitelistDoc, /whitelist observer budget proof slices: 6/);
  assert.match(rightRailWhitelistDoc, /watch\/right-rail whitelist authority: NO-GO/);
  assert.match(rightRailWhitelistDoc, /JSON-vs-DOM whitelist owner authority: NO-GO/);
  assert.match(rightRailWhitelistDoc, /active whitelist live trace authority: NO-GO/);
  assert.match(rightRailWhitelistDoc, /runtime behavior changed by this addendum: no/);

  const activeRuleDoc = read('docs/audit/FILTERTUBE_ACTIVE_RULE_AUTHORITY_AUDIT_2026-05-18.md');
  assert.match(source, /Active Blocklist Observer Budget Addendum - 2026-05-27/);
  assert.match(source, /active blocklist observer budget addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins seed\/injector JSON admission, DOM fallback active\s+predicate, quick-block lifecycle gating, quick-block rule-context helper,\s+native menu action gates, storage force-reprocess coalescing, and Main\s+blocklist canonical compile/);
  assert.match(source, /active desktop blocklist budget/);
  assert.match(source, /Active desktop blocklist source proof\s+is `PARTIAL`/);
  assert.match(source, /active blocklist observer budget authority, quick\/menu\s+shared active-state authority, and active blocklist live trace authority remain\s+at `NO-GO`/);
  assert.match(activeRuleDoc, /Active Blocklist Observer Budget Addendum - 2026-05-27/);
  assert.match(activeRuleDoc, /flowchart TD/);
  assert.match(activeRuleDoc, /\| JSON transport admission \| `js\/seed\.js:234-238`, `js\/injector\.js:185-188` \|/);
  assert.match(activeRuleDoc, /\| DOM fallback active predicate \| `js\/content\/dom_fallback\.js:1933-1995`, `js\/content\/dom_fallback\.js:2075-2082` \|/);
  assert.match(activeRuleDoc, /\| Quick-block lifecycle gate \| `js\/content\/block_channel\.js:353-365`, `js\/content\/block_channel\.js:1205-1222`, `js\/content\/block_channel\.js:1291-1293`, `js\/content\/block_channel\.js:1979-2028` \|/);
  assert.match(activeRuleDoc, /\| Native menu action gate \| `js\/content_bridge\.js:10517-10498`, `js\/content\/block_channel\.js:2913-2921` \|/);
  assert.match(activeRuleDoc, /active blocklist observer budget proof slices: 7/);
  assert.match(activeRuleDoc, /active desktop blocklist source proof: PARTIAL/);
  assert.match(activeRuleDoc, /quick\/menu shared active-state authority: NO-GO/);
  assert.match(activeRuleDoc, /active blocklist live trace authority: NO-GO/);
  assert.match(activeRuleDoc, /runtime behavior changed by this addendum: no/);

  assert.match(source, /Mobile\/Coarse Observer Budget Addendum - 2026-05-27/);
  assert.match(source, /mobile\/coarse observer budget addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins shared mobile\/coarse classification drift,\s+force-visible quick-cross behavior, quick-block mobile body observation,\s+fallback eager admission, visible-card fallback scan coalescing, fallback\s+observer\/listener\/warmup behavior, and native overlay quiet gates/);
  assert.match(source, /mobile\/touch YouTube lag and action-affordance audit path/);
  assert.match(source, /Mobile\/coarse source proof is\s+`PARTIAL`/);
  assert.match(source, /mobile\/coarse live device trace authority, mobile\s+fallback\/quick shared action gate authority, and mobile\/coarse teardown\s+authority remain at `NO-GO`/);
  assert.match(lifecycleDoc, /Mobile\/Coarse Observer Budget Addendum - 2026-05-27/);
  assert.match(lifecycleDoc, /\| Surface classifier \| `js\/content\/block_channel\.js:121-141`, `js\/content_bridge\.js:6473-6483` \|/);
  assert.match(lifecycleDoc, /\| Quick-block mobile observer \| `js\/content\/block_channel\.js:1979-1989`, `js\/content\/block_channel\.js:2212-2275`, `js\/content\/block_channel\.js:2277-2289` \|/);
  assert.match(lifecycleDoc, /\| Fallback observer\/listener\/warmup budget \| `js\/content_bridge\.js:7094-7139`, `js\/content_bridge\.js:7151-7206` \|/);
  assert.match(lifecycleDoc, /mobile\/coarse observer budget proof slices: 7/);
  assert.match(lifecycleDoc, /mobile\/coarse source proof: PARTIAL/);
  assert.match(lifecycleDoc, /mobile\/coarse live device trace authority: NO-GO/);
  assert.match(lifecycleDoc, /mobile fallback\/quick shared action gate authority: NO-GO/);
  assert.match(lifecycleDoc, /mobile\/coarse teardown authority: NO-GO/);
  assert.match(lifecycleDoc, /runtime behavior changed by this addendum: no/);

  assert.match(source, /Watch\/YTM\/Kids Observer Budget Addendum - 2026-05-27/);
  assert.match(source, /watch\/YTM\/Kids observer budget addendum with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins watch playlist-panel identity prefetch, whitelist\s+right-rail `\/watch` skip behavior, DOM playlist click\/autoplay guards,\s+YTM\/watch\/Kids quick-block selector admission, YTM fallback menu host and scan\s+lifecycle, Kids passive native-block observation, and existing YTM\/Kids fixture\s+proof slices/);
  assert.match(source, /watch-player, YouTube Music, and Kids passive-block audit\s+path/);
  assert.match(source, /Watch\/YTM\/Kids source proof is\s+`PARTIAL`/);
  assert.match(source, /watch\/YTM\/Kids live trace authority, watch\s+JSON\/DOM\/player\/menu owner authority, and Kids passive mutation authority remain\s+at `NO-GO`/);
  assert.match(lifecycleDoc, /Watch\/YTM\/Kids Observer Budget Addendum - 2026-05-27/);
  assert.match(lifecycleDoc, /\| Watch playlist prefetch hook \| `js\/content_bridge\.js:1162-1209` \|/);
  assert.match(lifecycleDoc, /\| DOM playlist click\/autoplay guards \| `js\/content\/dom_fallback\.js:2337-2440` \|/);
  assert.match(lifecycleDoc, /\| YTM\/watch\/Kids quick-block selectors \| `js\/content\/block_channel\.js:1089-1133`, `js\/content\/block_channel\.js:1979-2028` \|/);
  assert.match(lifecycleDoc, /\| Kids passive menu listener \| `js\/content\/block_channel\.js:2304-2307`, `js\/content\/block_channel\.js:2595-2639`, `js\/content\/block_channel\.js:2764-2859` \|/);
  assert.match(lifecycleDoc, /watch\/YTM\/Kids observer budget proof slices: 7/);
  assert.match(lifecycleDoc, /watch\/YTM\/Kids source proof: PARTIAL/);
  assert.match(lifecycleDoc, /watch\/YTM\/Kids live trace authority: NO-GO/);
  assert.match(lifecycleDoc, /watch JSON\/DOM\/player\/menu owner authority: NO-GO/);
  assert.match(lifecycleDoc, /Kids passive mutation authority: NO-GO/);
  assert.match(lifecycleDoc, /runtime behavior changed by this addendum: no/);

  assert.match(source, /Hot YouTube SPA Lifecycle Owner Matrix Addendum - 2026-05-29/);
  assert.match(source, /hot YouTube SPA lifecycle owner matrix addendum with ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /pins 16 high-risk owner rows across quick-block setup, hover\s+pointer recovery, native menu setup, dropdown discovery and visibility,\s+identity prefetch, playlist prefetch, whitelist right-rail refresh, DOM\s+fallback observation, fallback menu scanning, video metadata reruns, DOM\s+fallback pending reruns, pending metadata rechecks, seed replay transport,\s+injector startup polling, and bridge settings refresh debounce/);
  assert.match(source, /YouTube SPA lag, whitelist\/cache, menu, quick-block,\s+DOM fallback, JSON transport, and no-work budget audit path/);
  assert.match(source, /Hot lifecycle source-locus proof is `PARTIAL`/);
  assert.match(source, /shared\s+hot lifecycle registry authority, lifecycle cleanup\/pruning approval, and\s+route\/surface no-work budget authority remain at `NO-GO`/);
  assert.match(lifecycleDoc, /Hot YouTube SPA Lifecycle Owner Matrix Addendum - 2026-05-29/);
  assert.match(lifecycleDoc, /flowchart TD/);
  assert.match(lifecycleDoc, /\| `hot_lifecycle_quick_block_setup_owner` \| `js\/content\/block_channel\.js:1979-2289` \|/);
  assert.match(lifecycleDoc, /\| `hot_lifecycle_fallback_menu_owner` \| `js\/content_bridge\.js:6473-7206` \|/);
  assert.match(lifecycleDoc, /\| `hot_lifecycle_seed_replay_transport_owner` \| `js\/seed\.js:97-134` \|/);
  assert.match(lifecycleDoc, /hot YouTube SPA lifecycle owner rows: 16/);
  assert.match(lifecycleDoc, /hot lifecycle source-locus proof: PARTIAL/);
  assert.match(lifecycleDoc, /shared hot lifecycle registry authority: NO-GO/);
  assert.match(lifecycleDoc, /lifecycle cleanup\/pruning approval: NO-GO/);
  assert.match(lifecycleDoc, /route\/surface no-work budget authority: NO-GO/);
  assert.match(lifecycleDoc, /runtime behavior changed by this addendum: no/);

  assert.match(source, /List-Mode And Alias Current-Source Addendum - 2026-05-27/);
  assert.match(source, /Main blocklist compilation reads canonical `keywords` and `channels`\s+before the `blockedKeywords` \/ `blockedChannels` migration aliases/);
  assert.match(source, /shared save mirrors the aliases only in blocklist mode/);
  assert.match(source, /`FilterTube_SetListMode` reads\s+`copyBlocklist`, but has 0 background behavior branches/);
  assert.match(source, /rule mutation authority and transition fixture proof/);
  assert.match(activeRuleDoc, /Post-Release List-Mode And Alias Snapshot - 2026-05-27/);
  assert.match(activeRuleDoc, /background list-mode copy flag behavior branches: 0/);
  assert.match(activeRuleDoc, /canonical Main keyword precedence rows: 1/);
  assert.match(activeRuleDoc, /\| `shared_save_blocklist_alias_mirror` \| `js\/settings_shared\.js:922-927` \|/);

  const pageMessageDoc = read('docs/audit/FILTERTUBE_PAGE_MESSAGE_TRUST_AUDIT_2026-05-18.md');
  assert.match(source, /Page-Message Learned Identity Trust Addendum - 2026-05-27/);
  assert.match(source, /pins 12 accepted\s+`content_bridge\.js` `FilterTube_\*` message rows/);
  assert.match(source, /8 state-changing rows without\s+required pending request ownership/);
  assert.match(source, /3 pending request maps, 1 injector\s+string-source listener, 1 subscription string-source listener, and 1 wildcard\s+collaborator dialog broadcaster/);
  assert.match(source, /false-hide\/leak coverage for learned identity and collaborator\s+state/);
  assert.match(source, /per-message sender, request ownership, route,\s+side-effect, stale\/replay, and negative spoof fixtures/);
  assert.match(pageMessageDoc, /Same-Window State-Changing Message Snapshot - 2026-05-27/);
  assert.match(pageMessageDoc, /content_bridge accepted FilterTube message rows: 12/);
  assert.match(pageMessageDoc, /state-changing rows without required pending request ownership: 8/);
  assert.match(pageMessageDoc, /\| `FilterTube_UpdateVideoChannelMap` \| `js\/content_bridge\.js:5903` \|/);
  assert.match(pageMessageDoc, /\| `collab_dialog_broadcast` \| `js\/content\/collab_dialog\.js:244-247` \|/);

  const messageTransportDoc = read('docs/audit/FILTERTUBE_MESSAGE_TRANSPORT_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md');
  assert.match(source, /Message Sender\/Receiver and Owner Layer Addendum - 2026-05-27/);
  assert.match(source, /classifies 56 sender rows and 8 receiver\s+rows, with 31 extension-runtime transport rows, 30 page-message rows, and 3\s+tab-message rows/);
  assert.match(source, /32 isolated content-runtime\s+rows, 19 main-world page-runtime rows, 10 extension UI\/state rows, and 3\s+background rows/);
  assert.match(source, /Message sender\/receiver authority\s+remains `NO-GO`/);
  assert.match(messageTransportDoc, /Message Sender\/Receiver and Owner Layer Addendum - 2026-05-27/);
  assert.match(messageTransportDoc, /message sender rows: 56/);
  assert.match(messageTransportDoc, /message receiver rows: 8/);
  assert.match(messageTransportDoc, /owner-layer rows: isolated-content-runtime 32, main-world-page-runtime 19, extension-ui-state 10, background 3/);
  assert.match(messageTransportDoc, /\| `isolated-content-runtime` \| 32 \|/);
  assert.match(messageTransportDoc, /\| `main-world-page-runtime` \| 19 \|/);

  const statsAuthorityDoc = read('docs/audit/FILTERTUBE_STATS_TIME_SAVED_AUTHORITY_AUDIT_2026-05-18.md');
  assert.match(source, /Hide\/Stats Side-Effect Current-Source Addendum - 2026-05-27/);
  assert.match(source, /current-source hide\/stats side-effect snapshot with both ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /pins the shared `toggleVisibility\(\)` side-effect\s+shape, whitelist pending direct hide, content stats increment\/restore/);
  assert.match(source, /legacy background `recordTimeSaved` writer/);
  assert.match(source, /Hide\/stats side-effect policy, media side-effect\s+budget, and background time-saved mutation authority all remain at `NO-GO`/);
  assert.match(statsAuthorityDoc, /Hide\/Stats Side-Effect Snapshot - 2026-05-27/);
  assert.match(statsAuthorityDoc, /hide\/stats side-effect policy approval: NO-GO/);
  assert.match(statsAuthorityDoc, /media side-effect budget approval: NO-GO/);
  assert.match(statsAuthorityDoc, /background recordTimeSaved authority approval: NO-GO/);
  assert.match(statsAuthorityDoc, /runtime behavior changed by this addendum: no/);
  assert.match(statsAuthorityDoc, /flowchart TD/);
  assert.match(statsAuthorityDoc, /\| Shared hide helper \| `js\/content\/dom_helpers\.js:67-148` \|/);
  assert.match(statsAuthorityDoc, /\| Background time writer \| `js\/background\.js:4449-4458` \|/);

  const importExportNanahDoc = read('docs/audit/FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md');
  assert.match(source, /Import Export Nanah Ingress Addendum - 2026-05-27/);
  assert.match(source, /current-source external settings ingress snapshot with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /pins plain import, encrypted import, trusted Nanah\s+state export\/restore, scoped Nanah apply/);
  assert.match(source, /background\s+cache convergence, and StateManager external reload/);
  assert.match(source, /External settings ingress mutation\s+authority, Nanah apply promotion authority, and dual allow\/block migration\s+through import\/sync remain at `NO-GO`/);
  assert.match(importExportNanahDoc, /External Settings Ingress Snapshot - 2026-05-27/);
  assert.match(importExportNanahDoc, /external settings ingress mutation authority: NO-GO/);
  assert.match(importExportNanahDoc, /Nanah apply promotion authority: NO-GO/);
  assert.match(importExportNanahDoc, /dual allow\/block migration through import\/sync: NO-GO/);
  assert.match(importExportNanahDoc, /runtime behavior changed by this addendum: no/);
  assert.match(importExportNanahDoc, /flowchart TD/);
  assert.match(importExportNanahDoc, /\| Plain V3\/V4 import \| `js\/io_manager\.js:1241-1726` \|/);
  assert.match(importExportNanahDoc, /\| Nanah scoped apply \| `js\/nanah_sync_adapter\.js:186-277` \|/);

  const nativeSyncDoc = read('docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_AUTHORITY_AUDIT_2026-05-18.md');
  assert.match(source, /Native Runtime Release Handoff Addendum - 2026-05-27/);
  assert.match(source, /current-source native release handoff snapshot with ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /pins the public wrapper script, package entrypoint, app sync\s+script, direct manifest copies, generated app assets/);
  assert.match(source, /Android\/iOS build boundary as one native parity gate/);
  assert.match(source, /Native release handoff, generated runtime source authority,\s+and iOS release sync gate all remain at `NO-GO`/);
  assert.match(nativeSyncDoc, /Native Release Handoff Snapshot - 2026-05-27/);
  assert.match(nativeSyncDoc, /native release handoff approval: NO-GO/);
  assert.match(nativeSyncDoc, /native generated runtime source authority: NO-GO/);
  assert.match(nativeSyncDoc, /iOS release sync gate approval: NO-GO/);
  assert.match(nativeSyncDoc, /runtime behavior changed by this addendum: no/);
  assert.match(nativeSyncDoc, /flowchart TD/);
  assert.match(nativeSyncDoc, /\| Public wrapper script \| `scripts\/sync-native-runtime\.mjs:5-34` \|/);
  assert.match(nativeSyncDoc, /\| Direct manifest copies \| `\/Users\/devanshvarshney\/FilterTubeApp\/tools\/runtime-sync-manifest\.json` \|/);

  const securityPinDoc = read('docs/audit/FILTERTUBE_SECURITY_PIN_LOCK_AUTHORITY_AUDIT_2026-05-18.md');
  assert.match(source, /Profile PIN Mutation Gate Addendum - 2026-05-27/);
  assert.match(source, /current-source profile\/PIN mutation gate snapshot with ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /pins dashboard session unlock state, PIN verifier\s+lookup, profile unlock prompts, child\/admin UI capability gates/);
  assert.match(source, /account and child creation, Master PIN mutation, managed child surface\s+writes, import\/export UI auth, import\/export writer auth, and Nanah send\/apply/);
  assert.match(source, /Profile\/PIN mutation authority, managed child mutation authority, and\s+import\/Nanah trust restoration authority remain at `NO-GO`/);
  assert.match(source, /required unlock class, sender\/actor class, storage revision, and negative\s+fixtures for locked, child, stale-profile, wrong-target, spoofed-sender,\s+trusted-link, and replay cases/);
  assert.match(securityPinDoc, /Profile\/PIN Mutation Gate Snapshot - 2026-05-27/);
  assert.match(securityPinDoc, /profile\/PIN mutation authority approval: NO-GO/);
  assert.match(securityPinDoc, /managed child mutation authority approval: NO-GO/);
  assert.match(securityPinDoc, /import\/Nanah trust restoration authority approval: NO-GO/);
  assert.match(securityPinDoc, /runtime behavior changed by this addendum: no/);
  assert.match(securityPinDoc, /flowchart TD/);
  assert.match(securityPinDoc, /\| Dashboard session state \| `js\/tab-view\.js:3000-3106` \|/);
  assert.match(securityPinDoc, /\| Account creation \| `js\/tab-view\.js:9787-9905` \|/);
  assert.match(securityPinDoc, /\| Managed child surface writes \| `js\/tab-view\.js:4207-4278`, `js\/tab-view\.js:10314-10419`, `js\/tab-view\.js:10532-10647`, `js\/tab-view\.js:11410-11428` \|/);
  assert.match(securityPinDoc, /\| Import\/export writer auth \| `js\/io_manager\.js:190-212`, `js\/io_manager\.js:1241-1289`, `js\/io_manager\.js:1691-1770` \|/);
  assert.match(securityPinDoc, /\| Nanah send\/receive auth \| `js\/tab-view\.js:7488-7580`, `js\/tab-view\.js:9663-9709`, `js\/nanah_sync_adapter\.js:186-277` \|/);

  const securityManagerMethodDoc = read('docs/audit/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md');
  assert.match(source, /Security Manager Caller Boundary Addendum - 2026-05-27/);
  assert.match(source, /caller-boundary snapshot with ASCII and Mermaid flow diagrams/);
  assert.match(source, /pure `FilterTubeSecurity` helper surface against popup unlock,\s+dashboard unlock, background session cache, IO PIN checks/);
  assert.match(source, /Security manager caller mutation authority, encrypted payload caller authority,\s+and profile unlock authority remain at `NO-GO`/);
  assert.match(source, /wrong PIN, wrong password, malformed payload, stale profile, wrong target, and\s+unauthorized sender/);
  assert.match(securityManagerMethodDoc, /Caller Boundary Snapshot - 2026-05-27/);
  assert.match(securityManagerMethodDoc, /security manager caller mutation authority: NO-GO/);
  assert.match(securityManagerMethodDoc, /security manager encrypted payload caller authority: NO-GO/);
  assert.match(securityManagerMethodDoc, /security manager profile unlock authority: NO-GO/);
  assert.match(securityManagerMethodDoc, /runtime behavior changed by this addendum: no/);
  assert.match(securityManagerMethodDoc, /flowchart TD/);
  assert.match(securityManagerMethodDoc, /\| Popup unlock wrapper \| `js\/popup\.js:1226-1262` \|/);
  assert.match(securityManagerMethodDoc, /\| Background session cache \| `js\/background\.js:634-655`, `js\/background\.js:3268-3284`, `js\/background\.js:3571-3579` \|/);
  assert.match(securityManagerMethodDoc, /\| IO encrypted export\/import \| `js\/io_manager\.js:1729-1770` \|/);
  assert.match(securityManagerMethodDoc, /\| Dashboard encrypted import decrypt \| `js\/tab-view\.js:9299-9315` \|/);
}

function assertRuntimeCountReconciliationAddendum(source) {
  const metricGate = read(metricCoverageGatePath);
  const runtimeResults = read(runtimeResultsPath);
  const runtimeTestIndex = read(runtimeTestIndexPath);
  const releaseRegression = read(releaseRegressionPath);
  const sourceStats = currentRuntimeTestSourceStats();
  const driftStats = runtimeCountDriftCensusStats();

  assert.match(source, /Runtime Count Reconciliation Authority Addendum - 2026-05-27/);
  assert.match(source, /old metric contract rows that still say `4457`/);
  assert.match(source, /runtime test index moved to\s+`4731` source top-level declarations/);
  assert.match(source, /count-reconciled optimization readiness: NO-GO/);
  assert.match(source, /count-reconciliation proof slices: 3/);
  assert.match(source, /legacy metric contract expected tests: 4457/);
  assert.match(source, /current generated runtime test declarations: 4731/);
  assert.match(source, /latest historical full runtime pass count observed: 4663/);
  assert.match(source, /latest historical full runtime pass freshness: 2026-05-30 full runtime rerun covers 4663 generated declarations before later audit-only declarations expanded the source count/);
  assert.match(source, /first-optimization count reconciliation status: BLOCKED/);
  assert.match(source, /full codebase audit completion from count reconciliation: NO-GO/);
  assert.match(source, /runtime behavior changed by this addendum: no/);
  assert.match(source, /2026-05-30 lifecycle convergence proof-test drift/);
  assert.match(source, /current source top-level test declarations counted: 4663/);
  assert.match(source, /new declarations since previous full runtime proof: 3/);
  assert.match(source, /fresh full runtime proof after lifecycle convergence additions: 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(source, /count reconciliation status after lifecycle convergence additions: CURRENT-FULL-PROOF-REFRESHED/);
  assert.match(source, /broad audit completion from lifecycle convergence count drift: NO-GO/);
  assert.ok(source.includes(metricCoverageGatePath));
  assert.ok(source.includes(runtimeTestIndexPath));
  assert.ok(source.includes(releaseRegressionPath));
  assert.ok(source.includes('| Legacy first-optimization metric contract rows |'));
  assert.ok(source.includes('| Generated runtime test provenance |'));
  assert.ok(source.includes('| Latest historical full runtime evidence |'));
  assert.ok(source.includes('| Completion decision |'));
  assert.match(source, /No first-optimization, JSON-first promotion, whitelist optimization, or broad audit completion approval/);
  assert.match(source, /flowchart TD/);
  assert.match(source, /Keep first optimization and broad audit blocked/);

  assert.match(metricGate, /Runtime Count Reconciliation Addendum - 2026-05-27/);
  assert.match(metricGate, /legacy metric contract expected tests: 4457/);
  assert.match(metricGate, /current generated runtime test declarations: 4731/);
  assert.match(metricGate, /latest historical full runtime pass count observed: 4663/);
  assert.match(metricGate, /current broad runtime audit snapshot: 4731 tests, 4580 pass, 151 fail/);
  assert.match(metricGate, /current broad runtime proof for generated 4731 declaration set: NO-GO/);
  assert.match(metricGate, /count reconciliation status for metric foundation: BLOCKED/);
  assert.match(source, /metric foundation inline draft coverage gate/);
  assert.match(source, /combined metric-foundation\s+inline artifact chain and coverage gate verifier is `61\/61` pass/);
  assert.match(source, /closes the inline coverage documentation chain/);
  assert.match(source, /12\s+closure rows cover 12 coverage rows and link 9 reserved artifact paths, 9\s+contract docs, 9 contract tests, 9 inline draft sources, and 9 inline verifier\s+tests/);
  assert.match(source, /committed foundation metric artifacts, runtime metric\s+collector approvals, artifact readiness/);
  assert.match(source, /artifact root creation, artifact file\s+commits, JSON-first runtime behavior changes, whitelist optimization,\s+release\/public-claim use, and runtime behavior changes at `NO-GO`/);
  assert.match(metricGate, /metric foundation inline coverage closure rows: 12/);
  assert.match(metricGate, /coverage rows covered by closure: 12/);
  assert.match(metricGate, /reserved artifact paths linked by closure: 9/);
  assert.match(metricGate, /contract docs linked by closure: 9/);
  assert.match(metricGate, /contract tests linked by closure: 9/);
  assert.match(metricGate, /inline draft sources linked by closure: 9/);
  assert.match(metricGate, /inline draft verifier tests linked by closure: 9/);
  assert.match(metricGate, /committed foundation metric artifacts from closure: 0/);
  assert.match(metricGate, /runtime metric collector approvals from closure: 0/);
  assert.match(metricGate, /metric foundation inline coverage closure: COVERAGE-CHAIN-CLOSED/);
  assert.match(metricGate, /metric foundation artifact readiness from closure: NO-GO/);
  assert.match(metricGate, /close metric foundation inline coverage documentation chain now: GO/);
  assert.match(metricGate, /accept coverage closure as artifact root creation approval now: NO-GO/);
  assert.match(metricGate, /accept coverage closure as artifact file commit approval now: NO-GO/);
  assert.match(metricGate, /accept coverage closure as collector insertion approval now: NO-GO/);
  assert.match(metricGate, /accept coverage closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(metricGate, /accept coverage closure as whitelist optimization approval now: NO-GO/);
  assert.match(metricGate, /accept coverage closure as release\/public-claim approval now: NO-GO/);
  assert.match(runtimeTestIndex, /source top-level test declarations counted: 4731/);
  assert.match(releaseRegression, /node --test --test-reporter=tap tests\/runtime\/\*\.test\.mjs/);
  assert.match(releaseRegression, /stored TAP output: \/private\/tmp\/filtertube-runtime-full-after-lifecycle-convergence\.tap/);
  assert.match(releaseRegression, /full runtime proof result: 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(source, /current live runtime source scan: 540 files, 4754 source top-level test declarations/);
  assert.match(source, /latest broad runtime backlog snapshot: 4754 tests, 4661 pass, 93 fail/);
  assert.match(source, /generated provenance index remains stale at 537 rows and 4731 declarations/);
  assert.equal(sourceStats.declarations, 4754);

  assert.match(source, /Runtime Count Drift Census Addendum - 2026-05-27/);
  assert.match(source, /census exclusions: this gap register and its verifier/);
  assert.match(source, /runtime count drift census status: BLOCKED/);
  assert.match(source, /runtime count drift census authority: PARTIAL/);
  assert.match(source, /runtime count reconciliation approval: NO-GO/);
  assert.match(source, /first optimization implementation approval from count rows: NO-GO/);
  assert.match(source, /runtime behavior changed by this census: no/);
  assert.match(source, /Future count reconciliation is a multi-document audit cleanup/);
  assert.match(source, /explicitly converted into dated historical snapshots with no completion\s+authority/);
  assert.match(source, /flowchart TD/);
  assert.match(source, /Keep optimization and broad audit authority blocked/);

  assert.match(source, /Runtime Fixture Results Historical Snapshot Addendum - 2026-05-28/);
  assert.match(source, /opening TAP block as a historical 2026-05-17 ledger snapshot/);
  assert.match(source, /current generated index plus current full-run proof/);
  assert.match(source, /runtime-results ledger completion authority: NO-GO/);
  assert.match(source, /Keep optimization, JSON-first promotion, whitelist changes, and broad audit completion blocked/);
  assert.match(runtimeResults, /Historical 2026-05-17 ledger snapshot:/);
  assert.match(runtimeResults, /historical snapshot count above: 4457/);
  assert.match(runtimeResults, /current generated source top-level declarations: 4731/);
  assert.match(runtimeResults, /latest historical full runtime pass evidence: current 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(runtimeResults, /current broad runtime proof: 4731 tests, 4580 pass, 151 fail/);
  assert.match(runtimeResults, /stored TAP output: \/private\/tmp\/filtertube-runtime-full-after-lifecycle-convergence\.tap/);
  assert.match(runtimeResults, /runtime-results ledger completion authority: NO-GO/);

  assert.equal(driftStats.scannedFiles, 1098);
  assert.equal(driftStats.legacy.occurrences, 1230);
  assert.equal(driftStats.legacy.fileCount, 167);
  assert.equal(driftStats.current.occurrences, 11);
  assert.equal(driftStats.current.fileCount, 4);
  assert.match(source, new RegExp(`census files scanned: ${driftStats.scannedFiles}`));
  assert.match(source, new RegExp(`legacy runtime-count token 4457 occurrences: ${driftStats.legacy.occurrences}`));
  assert.match(source, new RegExp(`legacy runtime-count token 4457 files: ${driftStats.legacy.fileCount}`));
  assert.match(source, new RegExp(`current runtime-count token 4660 occurrences: ${driftStats.current.occurrences}`));
  assert.match(source, new RegExp(`current runtime-count token 4660 files: ${driftStats.current.fileCount}`));
}

function assertSettingsModeStopGoContinuation(source) {
  const stopGo = read(optimizationStopGoPath);
  const modeSurface = read(modeSurfaceEffectPath);

  assert.match(source, /Settings Mode Stop\/Go Continuation - 2026-05-28/);
  assert.ok(source.includes(optimizationStopGoPath));
  assert.ok(source.includes(modeSurfaceEffectPath));
  assert.match(source, /optimization work\s+cannot use "empty", "disabled", or "inactive" as a single permission model/);
  assert.match(source, /six cross-feature inactive-state rows/);
  assert.match(source, /settings-mode stop\/go continuation rows: 6/);
  assert.match(source, /settings-mode broad optimization approval: NO-GO/);
  assert.match(source, /settings-mode JSON-first promotion approval: NO-GO/);
  assert.match(source, /settings-mode lifecycle pruning approval: NO-GO/);
  assert.match(source, /runtime behavior changed by this continuation: no/);
  assert.match(source, /flowchart TD/);

  assert.match(stopGo, /Settings Mode Cross-Feature Stop\/Go Continuation - 2026-05-28/);
  assert.match(stopGo, /settings-mode stop\/go continuation rows: 6/);
  assert.match(stopGo, /empty-blocklist broad no-work shortcut decision: NO-GO/);
  assert.match(stopGo, /empty-whitelist shortcut reuse decision: NO-GO/);
  assert.match(stopGo, /content-control no-rule shortcut decision: NO-GO/);
  assert.match(modeSurface, /Settings Mode Cross-Feature Continuation - 2026-05-28/);
}

function assertFirstOptimizationArtifactCommitBlockerClosure(source) {
  const blocker = read(artifactCommitReadinessPath);

  assert.match(source, /artifact commit readiness inline draft blocker/);
  assert.ok(source.includes(artifactCommitReadinessPath));
  assert.ok(source.includes('tests/runtime/first-optimization-artifact-commit-readiness-gate-current-behavior.test.mjs'));
  assert.match(source, /nine inline draft sources as a\s+commit-blocker layer/);
  assert.match(source, /108\s+inline sections/);
  assert.match(source, /nine `NO-GO` artifact-promotion decisions/);
  assert.match(source, /metric-foundation coverage gate to record the `61\/61` inline chain plus\s+coverage verifier/);
  assert.match(source, /combined metric-foundation inline artifact\s+chain, coverage gate, and artifact commit readiness verifier is `67\/67` pass/);
  assert.match(source, /closes the artifact commit documentation chain/);
  assert.match(source, /12 closure\s+rows cover 12 commit-readiness rows and link 9 reserved artifact paths, 9\s+inline draft sources, and 9 inline verifier tests/);
  assert.match(source, /artifact\s+promotion approvals, runtime optimization approvals, artifact root creation,\s+artifact file commits, collector insertion/);
  assert.match(source, /verification-output persistence,\s+rollback implementation, JSON-first runtime behavior changes, whitelist\s+optimization/);
  assert.match(source, /release\/public-claim use, and runtime behavior changes at\s+`NO-GO`/);

  assert.match(blocker, /first optimization artifact commit readiness rows: 12/);
  assert.match(blocker, /reserved artifact files covered: 9/);
  assert.match(blocker, /metric foundation inline draft sources covered: 9/);
  assert.match(blocker, /metric foundation inline draft verifier tests covered: 9/);
  assert.match(blocker, /metric foundation inline draft sections covered: 108/);
  assert.match(blocker, /metric foundation inline draft artifact promotion decisions: 9 NO-GO/);
  assert.match(blocker, /combined metric-foundation inline artifact chain plus coverage gate verifier tests observed: 61/);
  assert.match(blocker, /committed metric foundation artifact files: 0/);
  assert.match(blocker, /runtime metric collector approvals: 0/);
  assert.match(blocker, /runtime rollback approvals: 0/);
  assert.match(blocker, /runtime unclaimed-surface approvals: 0/);
  assert.match(blocker, /implementation-ready artifact commit rows: 0/);
  assert.match(blocker, /first optimization artifact commit blocker closure rows: 12/);
  assert.match(blocker, /artifact commit rows covered by closure: 12/);
  assert.match(blocker, /reserved artifact paths linked by closure: 9/);
  assert.match(blocker, /inline draft sources linked by closure: 9/);
  assert.match(blocker, /inline draft verifier tests linked by closure: 9/);
  assert.match(blocker, /artifact promotion approvals from closure: 0/);
  assert.match(blocker, /runtime optimization approvals from closure: 0/);
  assert.match(blocker, /artifact commit blocker closure: BLOCKER-CHAIN-CLOSED/);
  assert.match(blocker, /artifact commit readiness from closure: NO-GO/);
  assert.match(blocker, /commit metric foundation artifact root now: NO-GO/);
  assert.match(blocker, /commit metric foundation artifact files now: NO-GO/);
  assert.match(blocker, /persist verification-output\.tap now: NO-GO/);
  assert.match(blocker, /runtime metric collector insertion: NO-GO/);
  assert.match(blocker, /runtime rollback implementation: NO-GO/);
  assert.match(blocker, /affected callable semantic proof: NO-GO/);
  assert.match(blocker, /close artifact commit blocker documentation chain now: GO/);
  assert.match(blocker, /accept blocker closure as artifact root creation approval now: NO-GO/);
  assert.match(blocker, /accept blocker closure as artifact file commit approval now: NO-GO/);
  assert.match(blocker, /accept blocker closure as collector insertion approval now: NO-GO/);
  assert.match(blocker, /accept blocker closure as verification-output persistence approval now: NO-GO/);
  assert.match(blocker, /accept blocker closure as rollback implementation approval now: NO-GO/);
  assert.match(blocker, /accept blocker closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(blocker, /accept blocker closure as whitelist optimization approval now: NO-GO/);
  assert.match(blocker, /accept blocker closure as release\/public-claim approval now: NO-GO/);
  assert.match(blocker, /runtime behavior changed: no/);
}

function assertSourceLocusImplementationClosure(source) {
  const sourceLocus = read(sourceLocusImplementationAuthorityPath);

  assert.match(source, /source-locus implementation closure/);
  assert.ok(source.includes(sourceLocusImplementationAuthorityPath));
  assert.ok(source.includes('tests/runtime/first-optimization-source-locus-implementation-authority-boundary-current-behavior.test.mjs'));
  assert.match(source, /close the source-locus implementation authority chain without opening runtime\s+implementation authority/);
  assert.match(source, /12 closure rows, 12 implementation\s+rows covered, 12 callable rows linked, 8 risk classes linked, 9 reserved\s+artifact paths linked/);
  assert.match(source, /0 runtime implementation approvals, 0 runtime\s+source-owner approvals, 0 runtime collector approvals/);
  assert.match(source, /source-locus\s+implementation closure `IMPLEMENTATION-CHAIN-CLOSED`/);
  assert.match(source, /source-locus\s+implementation readiness from closure `NO-GO`/);
  assert.match(source, /runtime optimization,\s+source-owner approval, collector insertion, metric artifact commit approval/);
  assert.match(source, /JSON-first runtime behavior changes, whitelist optimization, release\/public\s+claim use, and runtime behavior changes at `NO-GO`/);

  assert.match(sourceLocus, /source-locus implementation authority boundary rows: 12/);
  assert.match(sourceLocus, /source-locus implementation closure rows: 12/);
  assert.match(sourceLocus, /implementation rows covered by closure: 12/);
  assert.match(sourceLocus, /callable rows linked by closure: 12/);
  assert.match(sourceLocus, /risk classes linked by closure: 8/);
  assert.match(sourceLocus, /reserved artifact paths linked by closure: 9/);
  assert.match(sourceLocus, /runtime implementation approvals from closure: 0/);
  assert.match(sourceLocus, /runtime source-owner approvals from closure: 0/);
  assert.match(sourceLocus, /runtime collector approvals from closure: 0/);
  assert.match(sourceLocus, /source-locus implementation closure: IMPLEMENTATION-CHAIN-CLOSED/);
  assert.match(sourceLocus, /source-locus implementation readiness from closure: NO-GO/);
  assert.match(sourceLocus, /runtime behavior changed: no/);
  assert.match(sourceLocus, /close source-locus implementation documentation chain now: GO/);
  assert.match(sourceLocus, /accept source-locus closure as runtime optimization approval now: NO-GO/);
  assert.match(sourceLocus, /accept source-locus closure as source-owner approval now: NO-GO/);
  assert.match(sourceLocus, /accept source-locus closure as collector insertion approval now: NO-GO/);
  assert.match(sourceLocus, /accept source-locus closure as metric artifact commit approval now: NO-GO/);
  assert.match(sourceLocus, /accept source-locus closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(sourceLocus, /accept source-locus closure as whitelist optimization approval now: NO-GO/);
  assert.match(sourceLocus, /accept source-locus closure as release\/public-claim approval now: NO-GO/);
}

function assertSettingsRefreshDirtyKeyConsumerClosure(source) {
  const consumer = read(settingsRefreshDirtyKeyConsumerPath);

  assert.match(source, /settings refresh dirty-key consumer matrix/);
  assert.ok(source.includes(settingsRefreshDirtyKeyConsumerPath));
  assert.ok(source.includes('tests/runtime/settings-refresh-dirty-key-consumer-matrix-current-behavior.test.mjs'));
  assert.match(source, /matrix pins 13 rows, 7 consumer work families, and 3 dirty-key special cases/);
  assert.match(source, /`channelMap`-only storage changes return early, `videoChannelMap`\/`videoMetaMap`\s+changes refresh settings without forced DOM reprocess/);
  assert.match(source, /ordinary relevant\s+keys force background settings refresh plus DOM fallback reprocess/);
  assert.match(source, /settings refresh dirty-key authority, compiled-cache revision authority,\s+settings no-op refresh authority/);
  assert.match(source, /broad whitelist optimization, JSON-first\s+promotion, release\/public-claim use, and runtime behavior changes at `NO-GO`/);
  assert.match(source, /closes the settings-refresh dirty-key consumer\s+documentation chain/);
  assert.match(source, /13 consumer closure rows link all 13 consumer matrix rows,\s+7 consumer work families, 3 dirty-key special cases, and 6 source input\s+families/);
  assert.match(source, /runtime dirty-key consumer closure approvals 0,\s+implementation-ready dirty-key consumer rows 0/);
  assert.match(source, /settings-refresh dirty-key\s+consumer closure `CONSUMER-CHAIN-CLOSED`/);
  assert.match(source, /settings-refresh consumer\s+implementation readiness from closure `NO-GO`/);
  assert.match(source, /dirty-key consumer\s+authority, compiled-cache revision authority, settings no-op refresh authority/);
  assert.match(source, /seed replay budget evidence, DOM fallback budget evidence, observer\/menu\/quick\s+budget evidence/);
  assert.match(source, /release\/public-claim use, and runtime behavior changes at `NO-GO`/);

  assert.match(consumer, /settings refresh dirty-key consumer matrix rows: 13/);
  assert.match(consumer, /settings refresh consumer work families covered: 7/);
  assert.match(consumer, /dirty-key special cases covered: 3/);
  assert.match(consumer, /runtime dirty-key authority approvals: 0/);
  assert.match(consumer, /settings refresh dirty-key consumer matrix approval: NO-GO/);
  assert.match(consumer, /settings refresh dirty-key consumer closure rows: 13/);
  assert.match(consumer, /consumer matrix rows linked by closure: 13/);
  assert.match(consumer, /consumer work families linked by closure: 7/);
  assert.match(consumer, /dirty-key special cases linked by closure: 3/);
  assert.match(consumer, /source input families linked by consumer closure: 6/);
  assert.match(consumer, /runtime dirty-key consumer closure approvals: 0/);
  assert.match(consumer, /implementation-ready dirty-key consumer rows: 0/);
  assert.match(consumer, /settings refresh dirty-key consumer closure: CONSUMER-CHAIN-CLOSED/);
  assert.match(consumer, /settings refresh consumer implementation readiness from closure: NO-GO/);
  assert.match(consumer, /define settings refresh dirty-key consumer matrix: GO/);
  assert.match(consumer, /approve settings refresh dirty-key authority now: NO-GO/);
  assert.match(consumer, /approve compiled-cache revision authority now: NO-GO/);
  assert.match(consumer, /approve settings no-op refresh authority now: NO-GO/);
  assert.match(consumer, /approve broad whitelist optimization from current settings refresh gates: NO-GO/);
  assert.match(consumer, /approve JSON-first promotion from current settings refresh gates: NO-GO/);
  assert.match(consumer, /close settings refresh dirty-key consumer documentation chain now: GO/);
  assert.match(consumer, /accept consumer closure as dirty-key consumer authority now: NO-GO/);
  assert.match(consumer, /accept consumer closure as compiled-cache revision authority now: NO-GO/);
  assert.match(consumer, /accept consumer closure as settings no-op refresh authority now: NO-GO/);
  assert.match(consumer, /accept consumer closure as seed replay budget evidence now: NO-GO/);
  assert.match(consumer, /accept consumer closure as DOM fallback budget evidence now: NO-GO/);
  assert.match(consumer, /accept consumer closure as observer\/menu\/quick budget evidence now: NO-GO/);
  assert.match(consumer, /accept consumer closure as whitelist optimization approval now: NO-GO/);
  assert.match(consumer, /accept consumer closure as JSON-first promotion approval now: NO-GO/);
  assert.match(consumer, /accept consumer closure as release\/public-claim approval now: NO-GO/);
  assert.match(consumer, /runtime behavior changed by this matrix: no/);
}

function assertSourceOwnerMapDraftReadinessClosure(source) {
  const draft = read(sourceOwnerMapDraftReadinessPath);

  assert.match(source, /source-owner map inline JSON draft shape/);
  assert.ok(source.includes(sourceOwnerMapDraftReadinessPath));
  assert.ok(source.includes('tests/runtime/first-optimization-source-owner-map-draft-readiness-current-behavior.test.mjs'));
  assert.match(source, /12 draft rows bound to the 12 upstream source-owner contract\s+rows/);
  assert.match(source, /parseable `sections`, `contractRow`, `mapSection`, and\s+`requiredProof` fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/source-owner-map\.json`\s+file and artifact root are absent/);
  assert.match(source, /Artifact promotion, collector insertion,\s+JSON-first runtime behavior changes, whitelist optimization/);
  assert.match(source, /closes the source-owner draft documentation chain/);
  assert.match(source, /12\s+closure rows link all 12 draft rows, 12 upstream contract rows, 12 inline JSON\s+sections, 12 source-locus callable rows, 16 source-locus fingerprint rows, 12\s+metric source-owner rows, and 12 source-owner approval rows/);
  assert.match(source, /runtime source-owner draft closure approvals 0, implementation-ready\s+source-owner draft closure rows 0/);
  assert.match(source, /source-owner draft closure\s+`SOURCE-OWNER-DRAFT-CHAIN-CLOSED`/);
  assert.match(source, /source-owner draft implementation\s+readiness from closure `NO-GO`/);
  assert.match(source, /committed artifact approval, artifact\s+root creation, runtime collector insertion, source-owner authority, JSON-first\s+runtime behavior, whitelist optimization/);

  assert.match(draft, /source owner map draft readiness rows: 12/);
  assert.match(draft, /source owner map contract rows covered: 12/);
  assert.match(draft, /source-locus callable rows covered: 12/);
  assert.match(draft, /source-locus fingerprint rows covered: 16/);
  assert.match(draft, /metric source-owner rows covered: 12/);
  assert.match(draft, /source-owner approval rows covered: 12/);
  assert.match(draft, /inline draft JSON sections covered: 12/);
  assert.match(draft, /inline draft JSON artifact promotion decision: NO-GO/);
  assert.match(draft, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(draft, /files with complete per-callable semantic proof: 0/);
  assert.match(draft, /source-owner draft closure rows: 12/);
  assert.match(draft, /source-owner draft rows linked by closure: 12/);
  assert.match(draft, /upstream contract rows linked by draft closure: 12/);
  assert.match(draft, /inline draft JSON sections linked by closure: 12/);
  assert.match(draft, /source-locus callable rows linked by draft closure: 12/);
  assert.match(draft, /source-locus fingerprint rows linked by draft closure: 16/);
  assert.match(draft, /metric source-owner rows linked by draft closure: 12/);
  assert.match(draft, /source-owner approval rows linked by draft closure: 12/);
  assert.match(draft, /runtime source-owner draft closure approvals: 0/);
  assert.match(draft, /implementation-ready source-owner draft closure rows: 0/);
  assert.match(draft, /source-owner draft closure: SOURCE-OWNER-DRAFT-CHAIN-CLOSED/);
  assert.match(draft, /source-owner draft implementation readiness from closure: NO-GO/);
  assert.match(draft, /close source-owner draft documentation chain now: GO/);
  assert.match(draft, /accept source-owner draft closure as committed artifact approval now: NO-GO/);
  assert.match(draft, /accept source-owner draft closure as artifact root creation approval now: NO-GO/);
  assert.match(draft, /accept source-owner draft closure as runtime collector insertion approval now: NO-GO/);
  assert.match(draft, /accept source-owner draft closure as source-owner authority approval now: NO-GO/);
  assert.match(draft, /accept source-owner draft closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(draft, /accept source-owner draft closure as whitelist optimization approval now: NO-GO/);
  assert.match(draft, /accept source-owner draft closure as release\/public-claim approval now: NO-GO/);
  assert.match(draft, /runtime behavior changed: no/);
}

function assertPacketManifestDraftClosure(source) {
  const manifest = read(packetManifestContractPath);

  assert.match(source, /packet manifest inline JSON draft shape/);
  assert.ok(source.includes(packetManifestContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-packet-manifest-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured JSON draft for the future\s+`packet-manifest\.json`/);
  assert.match(source, /12 manifest rows bound to parseable `sections`,\s+`requiredFields`, artifact path, candidate id, and packet id fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/packet-manifest\.json`\s+file is absent/);
  assert.match(source, /Packet artifact promotion, collector insertion, JSON-first\s+runtime behavior changes, whitelist optimization/);
  assert.match(source, /closes the packet-manifest documentation chain/);
  assert.match(source, /12\s+closure rows link all 12 manifest rows, 12 inline manifest JSON sections, 10\s+artifact path boundary rows, 12 foundation packet rows, 12 metric schema rows,\s+12 metric source-owner rows, and 5 collector readiness families/);
  assert.match(source, /runtime packet manifest closure approvals 0, implementation-ready packet\s+manifest closure rows 0/);
  assert.match(source, /packet manifest draft closure\s+`PACKET-MANIFEST-CHAIN-CLOSED`/);
  assert.match(source, /packet manifest implementation readiness\s+from closure `NO-GO`/);
  assert.match(source, /committed artifact approval, artifact root\s+creation, runtime collector insertion, JSON-first runtime behavior, whitelist\s+optimization/);

  assert.match(manifest, /first optimization packet manifest contract rows: 12/);
  assert.match(manifest, /reserved manifest paths covered: 1/);
  assert.match(manifest, /committed packet manifest files: 0/);
  assert.match(manifest, /runtime metric collector approvals: 0/);
  assert.match(manifest, /implementation-ready manifest contract rows: 0/);
  assert.match(manifest, /artifact path boundary rows covered: 10/);
  assert.match(manifest, /foundation packet rows covered: 12/);
  assert.match(manifest, /metric schema rows covered: 12/);
  assert.match(manifest, /source-owner rows covered: 12/);
  assert.match(manifest, /collector insertion rows covered: 12/);
  assert.match(manifest, /collector no-work rows covered: 12/);
  assert.match(manifest, /collector side-effect rows covered: 12/);
  assert.match(manifest, /collector fixture provenance rows covered: 12/);
  assert.match(manifest, /collector parity rollout rows covered: 12/);
  assert.match(manifest, /inline manifest JSON sections covered: 12/);
  assert.match(manifest, /inline manifest artifact promotion decision: NO-GO/);
  assert.match(manifest, /packet manifest draft closure rows: 12/);
  assert.match(manifest, /manifest rows linked by closure: 12/);
  assert.match(manifest, /inline manifest JSON sections linked by closure: 12/);
  assert.match(manifest, /artifact path boundary rows linked by manifest closure: 10/);
  assert.match(manifest, /foundation packet rows linked by manifest closure: 12/);
  assert.match(manifest, /metric schema rows linked by manifest closure: 12/);
  assert.match(manifest, /metric source-owner rows linked by manifest closure: 12/);
  assert.match(manifest, /collector readiness families linked by manifest closure: 5/);
  assert.match(manifest, /runtime packet manifest closure approvals: 0/);
  assert.match(manifest, /implementation-ready packet manifest closure rows: 0/);
  assert.match(manifest, /packet manifest draft closure: PACKET-MANIFEST-CHAIN-CLOSED/);
  assert.match(manifest, /packet manifest implementation readiness from closure: NO-GO/);
  assert.match(manifest, /define packet manifest contract: GO/);
  assert.match(manifest, /commit packet-manifest\.json now: NO-GO/);
  assert.match(manifest, /runtime metric collector insertion: NO-GO/);
  assert.match(manifest, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(manifest, /whitelist optimization patch: NO-GO/);
  assert.match(manifest, /native\/release\/public rollout claim: NO-GO/);
  assert.match(manifest, /close packet manifest documentation chain now: GO/);
  assert.match(manifest, /accept packet manifest closure as committed artifact approval now: NO-GO/);
  assert.match(manifest, /accept packet manifest closure as artifact root creation approval now: NO-GO/);
  assert.match(manifest, /accept packet manifest closure as runtime collector insertion approval now: NO-GO/);
  assert.match(manifest, /accept packet manifest closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(manifest, /accept packet manifest closure as whitelist optimization approval now: NO-GO/);
  assert.match(manifest, /accept packet manifest closure as release\/public-claim approval now: NO-GO/);
  assert.match(manifest, /runtime behavior changed: no/);
}

function assertMetricSampleDraftClosure(source) {
  const sample = read(metricSampleContractPath);

  assert.match(source, /metric sample inline JSON draft shape/);
  assert.ok(source.includes(metricSampleContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured JSON draft for the future\s+`metric-sample\.json`/);
  assert.match(source, /12 metric sample rows bound to parseable `sections`,\s+`requiredFields`, sample id, packet id, candidate id, and metric sample path\s+fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/metric-sample\.json`\s+file is absent/);
  assert.match(source, /Metric sample artifact promotion, collector insertion,\s+JSON-first runtime behavior changes, whitelist optimization/);
  assert.match(source, /closes the metric-sample documentation chain/);
  assert.match(source, /12 closure\s+rows link all 12 sample rows, 12 inline metric sample JSON sections, 12\s+manifest contract rows, 10 artifact path boundary rows, 12 foundation packet\s+rows, 12 metric schema rows, 12 metric source-owner rows, 5 collector\s+readiness families, 69 method semantic proof gap files, and 5,697 lexical\s+callables/);
  assert.match(source, /runtime metric sample closure approvals 0,\s+implementation-ready metric sample closure rows 0/);
  assert.match(source, /metric sample draft closure\s+`METRIC-SAMPLE-CHAIN-CLOSED`/);
  assert.match(source, /metric sample implementation readiness from\s+closure `NO-GO`/);
  assert.match(source, /committed artifact approval, artifact root creation,\s+runtime collector insertion, JSON-first runtime behavior, whitelist\s+optimization/);

  assert.match(sample, /first optimization metric sample contract rows: 12/);
  assert.match(sample, /reserved metric sample paths covered: 1/);
  assert.match(sample, /committed metric sample files: 0/);
  assert.match(sample, /runtime metric collector approvals: 0/);
  assert.match(sample, /implementation-ready metric sample contract rows: 0/);
  assert.match(sample, /manifest contract rows covered: 12/);
  assert.match(sample, /artifact path boundary rows covered: 10/);
  assert.match(sample, /foundation packet rows covered: 12/);
  assert.match(sample, /metric schema rows covered: 12/);
  assert.match(sample, /source-owner rows covered: 12/);
  assert.match(sample, /collector insertion rows covered: 12/);
  assert.match(sample, /collector no-work rows covered: 12/);
  assert.match(sample, /collector side-effect rows covered: 12/);
  assert.match(sample, /collector fixture provenance rows covered: 12/);
  assert.match(sample, /collector parity rollout rows covered: 12/);
  assert.match(sample, /method semantic proof gap files covered: 69/);
  assert.match(sample, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(sample, /files with complete per-callable semantic proof: 0/);
  assert.match(sample, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(sample, /inline metric sample JSON sections covered: 12/);
  assert.match(sample, /inline metric sample artifact promotion decision: NO-GO/);
  assert.match(sample, /metric sample draft closure rows: 12/);
  assert.match(sample, /metric sample rows linked by closure: 12/);
  assert.match(sample, /inline metric sample JSON sections linked by closure: 12/);
  assert.match(sample, /manifest contract rows linked by sample closure: 12/);
  assert.match(sample, /artifact path boundary rows linked by sample closure: 10/);
  assert.match(sample, /foundation packet rows linked by sample closure: 12/);
  assert.match(sample, /metric schema rows linked by sample closure: 12/);
  assert.match(sample, /metric source-owner rows linked by sample closure: 12/);
  assert.match(sample, /collector readiness families linked by sample closure: 5/);
  assert.match(sample, /method semantic proof gap files linked by sample closure: 69/);
  assert.match(sample, /lexical callables linked by sample closure: 5736/);
  assert.match(sample, /runtime metric sample closure approvals: 0/);
  assert.match(sample, /implementation-ready metric sample closure rows: 0/);
  assert.match(sample, /metric sample draft closure: METRIC-SAMPLE-CHAIN-CLOSED/);
  assert.match(sample, /metric sample implementation readiness from closure: NO-GO/);
  assert.match(sample, /define metric sample contract: GO/);
  assert.match(sample, /commit metric-sample\.json now: NO-GO/);
  assert.match(sample, /runtime metric collector insertion: NO-GO/);
  assert.match(sample, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(sample, /whitelist optimization patch: NO-GO/);
  assert.match(sample, /native\/release\/public rollout claim: NO-GO/);
  assert.match(sample, /close metric sample documentation chain now: GO/);
  assert.match(sample, /accept metric sample closure as committed artifact approval now: NO-GO/);
  assert.match(sample, /accept metric sample closure as artifact root creation approval now: NO-GO/);
  assert.match(sample, /accept metric sample closure as runtime collector insertion approval now: NO-GO/);
  assert.match(sample, /accept metric sample closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(sample, /accept metric sample closure as whitelist optimization approval now: NO-GO/);
  assert.match(sample, /accept metric sample closure as release\/public-claim approval now: NO-GO/);
  assert.match(sample, /runtime behavior changed: no/);
}

function assertFixtureProvenanceDraftClosure(source) {
  const fixture = read(fixtureProvenanceContractPath);

  assert.match(source, /fixture provenance inline JSON draft shape/);
  assert.ok(source.includes(fixtureProvenanceContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-fixture-provenance-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured JSON draft for the future\s+`fixture-provenance\.json`/);
  assert.match(source, /12 fixture provenance rows bound to parseable `sections`,\s+`requiredFields`, provenance id, sample id, source owner map id, candidate id,\s+and fixture provenance path fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/fixture-provenance\.json`\s+file is absent/);
  assert.match(source, /Fixture provenance artifact promotion, collector insertion,\s+JSON-first runtime behavior changes, whitelist optimization/);
  assert.match(source, /closes the fixture-provenance\s+documentation chain/);
  assert.match(source, /12 closure rows link all 12 fixture provenance rows, 12\s+inline fixture provenance JSON sections, 12 source owner map contract rows, 12\s+metric sample contract rows, 12 manifest contract rows, 10 artifact path\s+boundary rows, 12 foundation packet rows, 12 metric schema rows, 12 metric\s+source-owner rows, 5 collector readiness families, 69 method semantic proof\s+gap files, and 5,697 lexical callables/);
  assert.match(source, /runtime fixture\s+provenance closure approvals 0, implementation-ready fixture provenance\s+closure rows 0/);
  assert.match(source, /fixture provenance draft closure\s+`FIXTURE-PROVENANCE-CHAIN-CLOSED`/);
  assert.match(source, /fixture provenance implementation\s+readiness from closure `NO-GO`/);
  assert.match(source, /committed artifact approval, artifact\s+root creation, runtime collector insertion, JSON-first runtime behavior,\s+whitelist optimization/);

  assert.match(fixture, /first optimization fixture provenance contract rows: 12/);
  assert.match(fixture, /reserved fixture provenance paths covered: 1/);
  assert.match(fixture, /committed fixture provenance files: 0/);
  assert.match(fixture, /runtime metric collector approvals: 0/);
  assert.match(fixture, /implementation-ready fixture provenance contract rows: 0/);
  assert.match(fixture, /source owner map contract rows covered: 12/);
  assert.match(fixture, /metric sample contract rows covered: 12/);
  assert.match(fixture, /manifest contract rows covered: 12/);
  assert.match(fixture, /artifact path boundary rows covered: 10/);
  assert.match(fixture, /foundation packet rows covered: 12/);
  assert.match(fixture, /metric schema rows covered: 12/);
  assert.match(fixture, /source-owner rows covered: 12/);
  assert.match(fixture, /collector insertion rows covered: 12/);
  assert.match(fixture, /collector no-work rows covered: 12/);
  assert.match(fixture, /collector side-effect rows covered: 12/);
  assert.match(fixture, /collector fixture provenance rows covered: 12/);
  assert.match(fixture, /collector parity rollout rows covered: 12/);
  assert.match(fixture, /method semantic proof gap files covered: 69/);
  assert.match(fixture, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(fixture, /files with complete per-callable semantic proof: 0/);
  assert.match(fixture, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(fixture, /inline fixture provenance JSON sections covered: 12/);
  assert.match(fixture, /inline fixture provenance artifact promotion decision: NO-GO/);
  assert.match(fixture, /fixture provenance draft closure rows: 12/);
  assert.match(fixture, /fixture provenance rows linked by closure: 12/);
  assert.match(fixture, /inline fixture provenance JSON sections linked by closure: 12/);
  assert.match(fixture, /source owner map contract rows linked by fixture closure: 12/);
  assert.match(fixture, /metric sample contract rows linked by fixture closure: 12/);
  assert.match(fixture, /manifest contract rows linked by fixture closure: 12/);
  assert.match(fixture, /artifact path boundary rows linked by fixture closure: 10/);
  assert.match(fixture, /foundation packet rows linked by fixture closure: 12/);
  assert.match(fixture, /metric schema rows linked by fixture closure: 12/);
  assert.match(fixture, /metric source-owner rows linked by fixture closure: 12/);
  assert.match(fixture, /collector readiness families linked by fixture closure: 5/);
  assert.match(fixture, /method semantic proof gap files linked by fixture closure: 69/);
  assert.match(fixture, /lexical callables linked by fixture closure: 5736/);
  assert.match(fixture, /runtime fixture provenance closure approvals: 0/);
  assert.match(fixture, /implementation-ready fixture provenance closure rows: 0/);
  assert.match(fixture, /fixture provenance draft closure: FIXTURE-PROVENANCE-CHAIN-CLOSED/);
  assert.match(fixture, /fixture provenance implementation readiness from closure: NO-GO/);
  assert.match(fixture, /define fixture provenance contract: GO/);
  assert.match(fixture, /commit fixture-provenance\.json now: NO-GO/);
  assert.match(fixture, /runtime metric collector insertion: NO-GO/);
  assert.match(fixture, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(fixture, /whitelist optimization patch: NO-GO/);
  assert.match(fixture, /native\/release\/public rollout claim: NO-GO/);
  assert.match(fixture, /close fixture provenance documentation chain now: GO/);
  assert.match(fixture, /accept fixture provenance closure as committed artifact approval now: NO-GO/);
  assert.match(fixture, /accept fixture provenance closure as artifact root creation approval now: NO-GO/);
  assert.match(fixture, /accept fixture provenance closure as runtime collector insertion approval now: NO-GO/);
  assert.match(fixture, /accept fixture provenance closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(fixture, /accept fixture provenance closure as whitelist optimization approval now: NO-GO/);
  assert.match(fixture, /accept fixture provenance closure as release\/public-claim approval now: NO-GO/);
  assert.match(fixture, /runtime behavior changed: no/);
}

function assertNoWorkPreservationDraftClosure(source) {
  const noWork = read(noWorkPreservationContractPath);

  assert.match(source, /no-work preservation inline JSON draft shape/);
  assert.ok(source.includes(noWorkPreservationContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-no-work-preservation-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured JSON draft for the future\s+`no-work-preservation\.json`/);
  assert.match(source, /12 no-work preservation rows bound to parseable `sections`,\s+`requiredFields`, preservation id, fixture provenance id, candidate id, and\s+no-work preservation path fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/no-work-preservation\.json`\s+file is absent/);
  assert.match(source, /No-work preservation artifact promotion, collector insertion,\s+JSON-first runtime behavior changes, whitelist optimization/);
  assert.match(source, /closes the no-work preservation\s+documentation chain/);
  assert.match(source, /12 closure rows link all 12 no-work preservation rows, 12\s+inline no-work preservation JSON sections, 12 fixture provenance contract\s+rows, 12 source owner map contract rows, 12 metric sample contract rows, 12\s+manifest contract rows, 10 artifact path boundary rows, 12 foundation packet\s+rows, 12 metric schema rows, 12 metric source-owner rows, 5 collector\s+readiness families, 69 method semantic proof gap files, and 5,697 lexical\s+callables/);
  assert.match(source, /runtime no-work preservation closure approvals 0,\s+implementation-ready no-work preservation closure rows 0/);
  assert.match(source, /no-work preservation\s+draft closure `NO-WORK-PRESERVATION-CHAIN-CLOSED`/);
  assert.match(source, /no-work preservation\s+implementation readiness from closure `NO-GO`/);
  assert.match(source, /committed artifact\s+approval, artifact root creation, runtime collector insertion, JSON-first\s+runtime behavior, whitelist optimization/);

  assert.match(noWork, /first optimization no-work preservation contract rows: 12/);
  assert.match(noWork, /reserved no-work preservation paths covered: 1/);
  assert.match(noWork, /committed no-work preservation files: 0/);
  assert.match(noWork, /runtime metric collector approvals: 0/);
  assert.match(noWork, /implementation-ready no-work preservation contract rows: 0/);
  assert.match(noWork, /fixture provenance contract rows covered: 12/);
  assert.match(noWork, /source owner map contract rows covered: 12/);
  assert.match(noWork, /metric sample contract rows covered: 12/);
  assert.match(noWork, /manifest contract rows covered: 12/);
  assert.match(noWork, /artifact path boundary rows covered: 10/);
  assert.match(noWork, /foundation packet rows covered: 12/);
  assert.match(noWork, /metric schema rows covered: 12/);
  assert.match(noWork, /source-owner rows covered: 12/);
  assert.match(noWork, /collector insertion rows covered: 12/);
  assert.match(noWork, /collector no-work rows covered: 12/);
  assert.match(noWork, /collector side-effect rows covered: 12/);
  assert.match(noWork, /collector fixture provenance rows covered: 12/);
  assert.match(noWork, /collector parity rollout rows covered: 12/);
  assert.match(noWork, /method semantic proof gap files covered: 69/);
  assert.match(noWork, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(noWork, /files with complete per-callable semantic proof: 0/);
  assert.match(noWork, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(noWork, /inline no-work preservation JSON sections covered: 12/);
  assert.match(noWork, /inline no-work preservation artifact promotion decision: NO-GO/);
  assert.match(noWork, /no-work preservation draft closure rows: 12/);
  assert.match(noWork, /no-work preservation rows linked by closure: 12/);
  assert.match(noWork, /inline no-work preservation JSON sections linked by closure: 12/);
  assert.match(noWork, /fixture provenance contract rows linked by no-work closure: 12/);
  assert.match(noWork, /source owner map contract rows linked by no-work closure: 12/);
  assert.match(noWork, /metric sample contract rows linked by no-work closure: 12/);
  assert.match(noWork, /manifest contract rows linked by no-work closure: 12/);
  assert.match(noWork, /artifact path boundary rows linked by no-work closure: 10/);
  assert.match(noWork, /foundation packet rows linked by no-work closure: 12/);
  assert.match(noWork, /metric schema rows linked by no-work closure: 12/);
  assert.match(noWork, /metric source-owner rows linked by no-work closure: 12/);
  assert.match(noWork, /collector readiness families linked by no-work closure: 5/);
  assert.match(noWork, /method semantic proof gap files linked by no-work closure: 69/);
  assert.match(noWork, /lexical callables linked by no-work closure: 5736/);
  assert.match(noWork, /runtime no-work preservation closure approvals: 0/);
  assert.match(noWork, /implementation-ready no-work preservation closure rows: 0/);
  assert.match(noWork, /no-work preservation draft closure: NO-WORK-PRESERVATION-CHAIN-CLOSED/);
  assert.match(noWork, /no-work preservation implementation readiness from closure: NO-GO/);
  assert.match(noWork, /define no-work preservation contract: GO/);
  assert.match(noWork, /commit no-work-preservation\.json now: NO-GO/);
  assert.match(noWork, /runtime metric collector insertion: NO-GO/);
  assert.match(noWork, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(noWork, /whitelist optimization patch: NO-GO/);
  assert.match(noWork, /native\/release\/public rollout claim: NO-GO/);
  assert.match(noWork, /close no-work preservation documentation chain now: GO/);
  assert.match(noWork, /accept no-work preservation closure as committed artifact approval now: NO-GO/);
  assert.match(noWork, /accept no-work preservation closure as artifact root creation approval now: NO-GO/);
  assert.match(noWork, /accept no-work preservation closure as runtime collector insertion approval now: NO-GO/);
  assert.match(noWork, /accept no-work preservation closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(noWork, /accept no-work preservation closure as whitelist optimization approval now: NO-GO/);
  assert.match(noWork, /accept no-work preservation closure as release\/public-claim approval now: NO-GO/);
  assert.match(noWork, /runtime behavior changed: no/);
}

function assertSideEffectBudgetDraftClosure(source) {
  const sideEffect = read(sideEffectBudgetContractPath);

  assert.match(source, /side-effect budget inline JSON draft shape/);
  assert.ok(source.includes(sideEffectBudgetContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-side-effect-budget-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured JSON draft for the future\s+`side-effect-budget\.json`/);
  assert.match(source, /12 side-effect budget rows bound to parseable `sections`,\s+`requiredFields`, budget id, no-work preservation id, candidate id, and\s+side-effect budget path fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/side-effect-budget\.json`\s+file is absent/);
  assert.match(source, /Side-effect budget artifact promotion, collector insertion,\s+JSON-first runtime behavior changes, whitelist optimization/);
  assert.match(source, /closes the side-effect budget\s+documentation chain/);
  assert.match(source, /12 closure rows link all 12 side-effect budget rows, 12\s+inline side-effect budget JSON sections, 12 no-work preservation contract\s+rows, 12 fixture provenance contract rows, 12 source owner map contract rows,\s+12 metric sample contract rows, 12 manifest contract rows, 10 artifact path\s+boundary rows, 12 foundation packet rows, 12 metric schema rows, 12 metric\s+source-owner rows, 5 collector readiness families, 69 method semantic proof\s+gap files, and 5,697 lexical callables/);
  assert.match(source, /runtime side-effect\s+budget closure approvals 0, implementation-ready side-effect budget closure\s+rows 0/);
  assert.match(source, /side-effect budget draft closure\s+`SIDE-EFFECT-BUDGET-CHAIN-CLOSED`/);
  assert.match(source, /side-effect budget implementation\s+readiness from closure `NO-GO`/);
  assert.match(source, /committed artifact approval, artifact\s+root creation, runtime collector insertion, JSON-first runtime behavior,\s+whitelist optimization/);

  assert.match(sideEffect, /first optimization side-effect budget contract rows: 12/);
  assert.match(sideEffect, /reserved side-effect budget paths covered: 1/);
  assert.match(sideEffect, /committed side-effect budget files: 0/);
  assert.match(sideEffect, /runtime metric collector approvals: 0/);
  assert.match(sideEffect, /implementation-ready side-effect budget contract rows: 0/);
  assert.match(sideEffect, /no-work preservation contract rows covered: 12/);
  assert.match(sideEffect, /fixture provenance contract rows covered: 12/);
  assert.match(sideEffect, /source owner map contract rows covered: 12/);
  assert.match(sideEffect, /metric sample contract rows covered: 12/);
  assert.match(sideEffect, /manifest contract rows covered: 12/);
  assert.match(sideEffect, /artifact path boundary rows covered: 10/);
  assert.match(sideEffect, /foundation packet rows covered: 12/);
  assert.match(sideEffect, /metric schema rows covered: 12/);
  assert.match(sideEffect, /source-owner rows covered: 12/);
  assert.match(sideEffect, /collector insertion rows covered: 12/);
  assert.match(sideEffect, /collector no-work rows covered: 12/);
  assert.match(sideEffect, /collector side-effect rows covered: 12/);
  assert.match(sideEffect, /collector fixture provenance rows covered: 12/);
  assert.match(sideEffect, /collector parity rollout rows covered: 12/);
  assert.match(sideEffect, /method semantic proof gap files covered: 69/);
  assert.match(sideEffect, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(sideEffect, /files with complete per-callable semantic proof: 0/);
  assert.match(sideEffect, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(sideEffect, /inline side-effect budget JSON sections covered: 12/);
  assert.match(sideEffect, /inline side-effect budget artifact promotion decision: NO-GO/);
  assert.match(sideEffect, /side-effect budget draft closure rows: 12/);
  assert.match(sideEffect, /side-effect budget rows linked by closure: 12/);
  assert.match(sideEffect, /inline side-effect budget JSON sections linked by closure: 12/);
  assert.match(sideEffect, /no-work preservation contract rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /fixture provenance contract rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /source owner map contract rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /metric sample contract rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /manifest contract rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /artifact path boundary rows linked by side-effect closure: 10/);
  assert.match(sideEffect, /foundation packet rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /metric schema rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /metric source-owner rows linked by side-effect closure: 12/);
  assert.match(sideEffect, /collector readiness families linked by side-effect closure: 5/);
  assert.match(sideEffect, /method semantic proof gap files linked by side-effect closure: 69/);
  assert.match(sideEffect, /lexical callables linked by side-effect closure: 5736/);
  assert.match(sideEffect, /runtime side-effect budget closure approvals: 0/);
  assert.match(sideEffect, /implementation-ready side-effect budget closure rows: 0/);
  assert.match(sideEffect, /side-effect budget draft closure: SIDE-EFFECT-BUDGET-CHAIN-CLOSED/);
  assert.match(sideEffect, /side-effect budget implementation readiness from closure: NO-GO/);
  assert.match(sideEffect, /define side-effect budget contract: GO/);
  assert.match(sideEffect, /commit side-effect-budget\.json now: NO-GO/);
  assert.match(sideEffect, /runtime metric collector insertion: NO-GO/);
  assert.match(sideEffect, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(sideEffect, /whitelist optimization patch: NO-GO/);
  assert.match(sideEffect, /native\/release\/public rollout claim: NO-GO/);
  assert.match(sideEffect, /close side-effect budget documentation chain now: GO/);
  assert.match(sideEffect, /accept side-effect budget closure as committed artifact approval now: NO-GO/);
  assert.match(sideEffect, /accept side-effect budget closure as artifact root creation approval now: NO-GO/);
  assert.match(sideEffect, /accept side-effect budget closure as runtime collector insertion approval now: NO-GO/);
  assert.match(sideEffect, /accept side-effect budget closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(sideEffect, /accept side-effect budget closure as whitelist optimization approval now: NO-GO/);
  assert.match(sideEffect, /accept side-effect budget closure as release\/public-claim approval now: NO-GO/);
  assert.match(sideEffect, /runtime behavior changed: no/);
}

function assertDiagnosticPrivacyDraftClosure(source) {
  const diagnostic = read(diagnosticPrivacyContractPath);

  assert.match(source, /diagnostic privacy inline JSON draft shape/);
  assert.ok(source.includes(diagnosticPrivacyContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-diagnostic-privacy-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured JSON draft for the future\s+`diagnostic-privacy\.json`/);
  assert.match(source, /12 diagnostic privacy rows bound to parseable `sections`,\s+`requiredFields`, privacy id, side-effect budget id, no-work preservation id,\s+candidate id, and diagnostic privacy path fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/diagnostic-privacy\.json`\s+file is absent/);
  assert.match(source, /Diagnostic privacy artifact promotion, collector insertion,\s+diagnostic logging removal, JSON-first runtime behavior changes, whitelist/);
  assert.match(source, /closes the diagnostic privacy\s+documentation chain/);
  assert.match(source, /12 closure rows link all 12 diagnostic privacy rows, 12\s+inline diagnostic privacy JSON sections, 12 side-effect budget contract rows,\s+12 no-work preservation contract rows, 12 fixture provenance contract rows, 12\s+source owner map contract rows, 12 metric sample contract rows, 12 manifest\s+contract rows, 10 artifact path boundary rows, 12 foundation packet rows, 12\s+metric schema rows, 12 metric source-owner rows, 5 collector readiness\s+families, 21 diagnostic logging policy source files, 419 active console\s+callsites, 69 method semantic proof gap files, and 5,697 lexical callables/);
  assert.match(source, /runtime diagnostic privacy closure approvals 0,\s+implementation-ready diagnostic privacy closure rows 0/);
  assert.match(source, /diagnostic privacy\s+draft closure `DIAGNOSTIC-PRIVACY-CHAIN-CLOSED`/);
  assert.match(source, /diagnostic privacy\s+implementation readiness from closure `NO-GO`/);
  assert.match(source, /runtime collector insertion, diagnostic\s+logging removal, JSON-first runtime behavior, whitelist optimization/);

  assert.match(diagnostic, /first optimization diagnostic privacy contract rows: 12/);
  assert.match(diagnostic, /reserved diagnostic privacy paths covered: 1/);
  assert.match(diagnostic, /committed diagnostic privacy files: 0/);
  assert.match(diagnostic, /runtime metric collector approvals: 0/);
  assert.match(diagnostic, /implementation-ready diagnostic privacy contract rows: 0/);
  assert.match(diagnostic, /side-effect budget contract rows covered: 12/);
  assert.match(diagnostic, /no-work preservation contract rows covered: 12/);
  assert.match(diagnostic, /fixture provenance contract rows covered: 12/);
  assert.match(diagnostic, /source owner map contract rows covered: 12/);
  assert.match(diagnostic, /metric sample contract rows covered: 12/);
  assert.match(diagnostic, /manifest contract rows covered: 12/);
  assert.match(diagnostic, /artifact path boundary rows covered: 10/);
  assert.match(diagnostic, /foundation packet rows covered: 12/);
  assert.match(diagnostic, /metric schema rows covered: 12/);
  assert.match(diagnostic, /source-owner rows covered: 12/);
  assert.match(diagnostic, /collector insertion rows covered: 12/);
  assert.match(diagnostic, /collector no-work rows covered: 12/);
  assert.match(diagnostic, /collector side-effect rows covered: 12/);
  assert.match(diagnostic, /collector fixture provenance rows covered: 12/);
  assert.match(diagnostic, /collector parity rollout rows covered: 12/);
  assert.match(diagnostic, /diagnostic logging policy source files covered: 21/);
  assert.match(diagnostic, /active console callsites covered: 418/);
  assert.match(diagnostic, /console\.log callsites covered: 203/);
  assert.match(diagnostic, /console\.warn callsites covered: 123/);
  assert.match(diagnostic, /console\.error callsites covered: 68/);
  assert.match(diagnostic, /console\.debug callsites covered: 24/);
  assert.match(diagnostic, /console\.info callsites covered: 0/);
  assert.match(diagnostic, /method semantic proof gap files covered: 69/);
  assert.match(diagnostic, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(diagnostic, /files with complete per-callable semantic proof: 0/);
  assert.match(diagnostic, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(diagnostic, /inline diagnostic privacy JSON sections covered: 12/);
  assert.match(diagnostic, /inline diagnostic privacy artifact promotion decision: NO-GO/);
  assert.match(diagnostic, /diagnostic privacy draft closure rows: 12/);
  assert.match(diagnostic, /diagnostic privacy rows linked by closure: 12/);
  assert.match(diagnostic, /inline diagnostic privacy JSON sections linked by closure: 12/);
  assert.match(diagnostic, /side-effect budget contract rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /no-work preservation contract rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /fixture provenance contract rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /source owner map contract rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /metric sample contract rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /manifest contract rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /artifact path boundary rows linked by diagnostic closure: 10/);
  assert.match(diagnostic, /foundation packet rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /metric schema rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /metric source-owner rows linked by diagnostic closure: 12/);
  assert.match(diagnostic, /collector readiness families linked by diagnostic closure: 5/);
  assert.match(diagnostic, /diagnostic logging policy source files linked by diagnostic closure: 21/);
  assert.match(diagnostic, /active console callsites linked by diagnostic closure: 418/);
  assert.match(diagnostic, /method semantic proof gap files linked by diagnostic closure: 69/);
  assert.match(diagnostic, /lexical callables linked by diagnostic closure: 5736/);
  assert.match(diagnostic, /runtime diagnostic privacy closure approvals: 0/);
  assert.match(diagnostic, /implementation-ready diagnostic privacy closure rows: 0/);
  assert.match(diagnostic, /diagnostic privacy draft closure: DIAGNOSTIC-PRIVACY-CHAIN-CLOSED/);
  assert.match(diagnostic, /diagnostic privacy implementation readiness from closure: NO-GO/);
  assert.match(diagnostic, /define diagnostic privacy contract: GO/);
  assert.match(diagnostic, /commit diagnostic-privacy\.json now: NO-GO/);
  assert.match(diagnostic, /runtime metric collector insertion: NO-GO/);
  assert.match(diagnostic, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(diagnostic, /whitelist optimization patch: NO-GO/);
  assert.match(diagnostic, /diagnostic logging removal patch: NO-GO/);
  assert.match(diagnostic, /native\/release\/public rollout claim: NO-GO/);
  assert.match(diagnostic, /close diagnostic privacy documentation chain now: GO/);
  assert.match(diagnostic, /accept diagnostic privacy closure as committed artifact approval now: NO-GO/);
  assert.match(diagnostic, /accept diagnostic privacy closure as artifact root creation approval now: NO-GO/);
  assert.match(diagnostic, /accept diagnostic privacy closure as runtime collector insertion approval now: NO-GO/);
  assert.match(diagnostic, /accept diagnostic privacy closure as diagnostic logging removal approval now: NO-GO/);
  assert.match(diagnostic, /accept diagnostic privacy closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(diagnostic, /accept diagnostic privacy closure as whitelist optimization approval now: NO-GO/);
  assert.match(diagnostic, /accept diagnostic privacy closure as release\/public-claim approval now: NO-GO/);
  assert.match(diagnostic, /runtime behavior changed: no/);
}

function assertParityRolloutDraftClosure(source) {
  const parity = read(parityRolloutContractPath);

  assert.match(source, /parity rollout inline JSON draft shape/);
  assert.ok(source.includes(parityRolloutContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured JSON draft for the future\s+`parity-rollout\.json`/);
  assert.match(source, /12 parity rollout rows bound to parseable `sections`,\s+`requiredFields`, rollout id, diagnostic privacy id, candidate id, and parity\s+rollout path fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/parity-rollout\.json`\s+file is absent/);
  assert.match(source, /Parity rollout artifact promotion, collector insertion,\s+JSON-first runtime behavior changes, whitelist optimization, native sync/);
  assert.match(source, /closes the parity rollout documentation\s+chain/);
  assert.match(source, /12 closure rows link all 12 parity rollout rows, 12 inline parity\s+rollout JSON sections, 12 diagnostic privacy contract rows, 12 side-effect\s+budget contract rows, 12 no-work preservation contract rows, 12 fixture\s+provenance contract rows, 12 source owner map contract rows, 12 metric sample\s+contract rows, 12 manifest contract rows, 10 artifact path boundary rows, 12\s+foundation packet rows, 12 metric schema rows, 12 metric source-owner rows, 5\s+collector readiness families, 2 evidence parity rollout rows, 8 parity and\s+release boundary source docs, 69 method semantic proof gap files, and 5,697\s+lexical callables/);
  assert.match(source, /runtime parity rollout closure approvals 0,\s+implementation-ready parity rollout closure rows 0/);
  assert.match(source, /parity rollout draft\s+closure `PARITY-ROLLOUT-CHAIN-CLOSED`/);
  assert.match(source, /parity rollout implementation\s+readiness from closure `NO-GO`/);
  assert.match(source, /runtime collector insertion, native sync, release package,\s+public claim, JSON-first runtime behavior, whitelist optimization/);

  assert.match(parity, /first optimization parity rollout contract rows: 12/);
  assert.match(parity, /reserved parity rollout paths covered: 1/);
  assert.match(parity, /committed parity rollout files: 0/);
  assert.match(parity, /runtime metric collector approvals: 0/);
  assert.match(parity, /implementation-ready parity rollout contract rows: 0/);
  assert.match(parity, /diagnostic privacy contract rows covered: 12/);
  assert.match(parity, /side-effect budget contract rows covered: 12/);
  assert.match(parity, /no-work preservation contract rows covered: 12/);
  assert.match(parity, /fixture provenance contract rows covered: 12/);
  assert.match(parity, /source owner map contract rows covered: 12/);
  assert.match(parity, /metric sample contract rows covered: 12/);
  assert.match(parity, /manifest contract rows covered: 12/);
  assert.match(parity, /artifact path boundary rows covered: 10/);
  assert.match(parity, /foundation packet rows covered: 12/);
  assert.match(parity, /metric schema rows covered: 12/);
  assert.match(parity, /source-owner rows covered: 12/);
  assert.match(parity, /collector insertion rows covered: 12/);
  assert.match(parity, /collector no-work rows covered: 12/);
  assert.match(parity, /collector side-effect rows covered: 12/);
  assert.match(parity, /collector fixture provenance rows covered: 12/);
  assert.match(parity, /collector parity rollout rows covered: 12/);
  assert.match(parity, /evidence parity rollout rows covered: 2/);
  assert.match(parity, /parity and release boundary source docs covered: 8/);
  assert.match(parity, /method semantic proof gap files covered: 69/);
  assert.match(parity, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(parity, /files with complete per-callable semantic proof: 0/);
  assert.match(parity, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(parity, /inline parity rollout JSON sections covered: 12/);
  assert.match(parity, /inline parity rollout artifact promotion decision: NO-GO/);
  assert.match(parity, /parity rollout draft closure rows: 12/);
  assert.match(parity, /parity rollout rows linked by closure: 12/);
  assert.match(parity, /inline parity rollout JSON sections linked by closure: 12/);
  assert.match(parity, /diagnostic privacy contract rows linked by parity closure: 12/);
  assert.match(parity, /side-effect budget contract rows linked by parity closure: 12/);
  assert.match(parity, /no-work preservation contract rows linked by parity closure: 12/);
  assert.match(parity, /fixture provenance contract rows linked by parity closure: 12/);
  assert.match(parity, /source owner map contract rows linked by parity closure: 12/);
  assert.match(parity, /metric sample contract rows linked by parity closure: 12/);
  assert.match(parity, /manifest contract rows linked by parity closure: 12/);
  assert.match(parity, /artifact path boundary rows linked by parity closure: 10/);
  assert.match(parity, /foundation packet rows linked by parity closure: 12/);
  assert.match(parity, /metric schema rows linked by parity closure: 12/);
  assert.match(parity, /metric source-owner rows linked by parity closure: 12/);
  assert.match(parity, /collector readiness families linked by parity closure: 5/);
  assert.match(parity, /evidence parity rollout rows linked by parity closure: 2/);
  assert.match(parity, /parity and release boundary source docs linked by parity closure: 8/);
  assert.match(parity, /method semantic proof gap files linked by parity closure: 69/);
  assert.match(parity, /lexical callables linked by parity closure: 5736/);
  assert.match(parity, /runtime parity rollout closure approvals: 0/);
  assert.match(parity, /implementation-ready parity rollout closure rows: 0/);
  assert.match(parity, /parity rollout draft closure: PARITY-ROLLOUT-CHAIN-CLOSED/);
  assert.match(parity, /parity rollout implementation readiness from closure: NO-GO/);
  assert.match(parity, /define parity rollout contract: GO/);
  assert.match(parity, /commit parity-rollout\.json now: NO-GO/);
  assert.match(parity, /runtime metric collector insertion: NO-GO/);
  assert.match(parity, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(parity, /whitelist optimization patch: NO-GO/);
  assert.match(parity, /native sync patch: NO-GO/);
  assert.match(parity, /release package patch: NO-GO/);
  assert.match(parity, /public claim patch: NO-GO/);
  assert.match(parity, /close parity rollout documentation chain now: GO/);
  assert.match(parity, /accept parity rollout closure as committed artifact approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as artifact root creation approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as runtime collector insertion approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as native sync approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as release package approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as public claim approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as whitelist optimization approval now: NO-GO/);
  assert.match(parity, /accept parity rollout closure as release\/public-claim approval now: NO-GO/);
  assert.match(parity, /runtime behavior changed: no/);
}

function assertVerificationOutputDraftClosure(source) {
  const verification = read(verificationOutputContractPath);

  assert.match(source, /verification output inline metadata JSON draft shape/);
  assert.ok(source.includes(verificationOutputContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs'));
  assert.match(source, /parse and verify an inline structured metadata JSON draft for the future\s+`verification-output\.tap`/);
  assert.match(source, /12 verification output rows bound to parseable `sections`,\s+`requiredFields`, verification run id, manifest id, parity rollout id,\s+diagnostic privacy id, candidate id, and verification output path fields/);
  assert.match(source, /reserved\s+`docs\/audit\/artifacts\/first-optimization\/metric-foundation\/verification-output\.tap`\s+file is absent/);
  assert.match(source, /Verification output persistence, artifact promotion, collector\s+insertion, JSON-first runtime behavior changes, whitelist optimization, native\s+sync, release packages, public claim use/);
  assert.match(source, /closes the verification output\s+documentation chain/);
  assert.match(source, /12 closure rows link all 12 verification output rows, 12\s+inline verification output JSON sections, 12 parity rollout contract rows, 12\s+diagnostic privacy contract rows, 12 side-effect budget contract rows, 12\s+no-work preservation contract rows, 12 fixture provenance contract rows, 12\s+source owner map contract rows, 12 metric sample contract rows, 12 manifest\s+contract rows, 10 artifact path boundary rows, 12 foundation packet rows, 12\s+metric schema rows, 12 metric source-owner rows, 5 collector readiness\s+families, 69 method semantic proof gap files, 5,697 lexical callables, 4,457\s+expected runtime audit tests, 4,457 expected runtime audit passes, and 0\s+expected runtime audit failures/);
  assert.match(source, /runtime verification output\s+closure approvals 0, persisted verification output closure approvals 0/);
  assert.match(source, /verification output\s+draft closure `VERIFICATION-OUTPUT-CHAIN-CLOSED`/);
  assert.match(source, /verification output\s+implementation readiness from closure `NO-GO`/);
  assert.match(source, /persisted verification\s+output approval, committed artifact approval, artifact root creation, runtime\s+collector insertion, native sync, release package, public claim, JSON-first\s+runtime behavior, whitelist optimization/);

  assert.match(verification, /first optimization verification output contract rows: 12/);
  assert.match(verification, /reserved verification output paths covered: 1/);
  assert.match(verification, /committed verification output files: 0/);
  assert.match(verification, /runtime metric collector approvals: 0/);
  assert.match(verification, /implementation-ready verification output contract rows: 0/);
  assert.match(verification, /parity rollout contract rows covered: 12/);
  assert.match(verification, /diagnostic privacy contract rows covered: 12/);
  assert.match(verification, /side-effect budget contract rows covered: 12/);
  assert.match(verification, /no-work preservation contract rows covered: 12/);
  assert.match(verification, /fixture provenance contract rows covered: 12/);
  assert.match(verification, /source owner map contract rows covered: 12/);
  assert.match(verification, /metric sample contract rows covered: 12/);
  assert.match(verification, /manifest contract rows covered: 12/);
  assert.match(verification, /artifact path boundary rows covered: 10/);
  assert.match(verification, /foundation packet rows covered: 12/);
  assert.match(verification, /metric schema rows covered: 12/);
  assert.match(verification, /source-owner rows covered: 12/);
  assert.match(verification, /collector insertion rows covered: 12/);
  assert.match(verification, /collector no-work rows covered: 12/);
  assert.match(verification, /collector side-effect rows covered: 12/);
  assert.match(verification, /collector fixture provenance rows covered: 12/);
  assert.match(verification, /collector parity rollout rows covered: 12/);
  assert.match(verification, /method semantic proof gap files covered: 69/);
  assert.match(verification, /method semantic proof gap lexical callables covered: 5736/);
  assert.match(verification, /files with complete per-callable semantic proof: 0/);
  assert.match(verification, /lexical callables requiring semantic proof before behavior changes: 5736/);
  assert.match(verification, /expected runtime audit tests: 4457/);
  assert.match(verification, /expected runtime audit pass: 4457/);
  assert.match(verification, /expected runtime audit fail: 0/);
  assert.match(verification, /inline verification output JSON sections covered: 12/);
  assert.match(verification, /inline verification output artifact promotion decision: NO-GO/);
  assert.match(verification, /verification output draft closure rows: 12/);
  assert.match(verification, /verification output rows linked by closure: 12/);
  assert.match(verification, /inline verification output JSON sections linked by closure: 12/);
  assert.match(verification, /parity rollout contract rows linked by verification closure: 12/);
  assert.match(verification, /diagnostic privacy contract rows linked by verification closure: 12/);
  assert.match(verification, /side-effect budget contract rows linked by verification closure: 12/);
  assert.match(verification, /no-work preservation contract rows linked by verification closure: 12/);
  assert.match(verification, /fixture provenance contract rows linked by verification closure: 12/);
  assert.match(verification, /source owner map contract rows linked by verification closure: 12/);
  assert.match(verification, /metric sample contract rows linked by verification closure: 12/);
  assert.match(verification, /manifest contract rows linked by verification closure: 12/);
  assert.match(verification, /artifact path boundary rows linked by verification closure: 10/);
  assert.match(verification, /foundation packet rows linked by verification closure: 12/);
  assert.match(verification, /metric schema rows linked by verification closure: 12/);
  assert.match(verification, /metric source-owner rows linked by verification closure: 12/);
  assert.match(verification, /collector readiness families linked by verification closure: 5/);
  assert.match(verification, /method semantic proof gap files linked by verification closure: 69/);
  assert.match(verification, /lexical callables linked by verification closure: 5736/);
  assert.match(verification, /runtime fixture result count rows linked by verification closure: 3/);
  assert.match(verification, /runtime verification output closure approvals: 0/);
  assert.match(verification, /persisted verification output closure approvals: 0/);
  assert.match(verification, /implementation-ready verification output closure rows: 0/);
  assert.match(verification, /verification output draft closure: VERIFICATION-OUTPUT-CHAIN-CLOSED/);
  assert.match(verification, /verification output implementation readiness from closure: NO-GO/);
  assert.match(verification, /define verification output contract: GO/);
  assert.match(verification, /commit verification-output\.tap now: NO-GO/);
  assert.match(verification, /runtime metric collector insertion: NO-GO/);
  assert.match(verification, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(verification, /whitelist optimization patch: NO-GO/);
  assert.match(verification, /native sync patch: NO-GO/);
  assert.match(verification, /release package patch: NO-GO/);
  assert.match(verification, /public claim patch: NO-GO/);
  assert.match(verification, /close verification output documentation chain now: GO/);
  assert.match(verification, /accept verification output closure as persisted verification output approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as committed artifact approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as artifact root creation approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as runtime collector insertion approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as native sync approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as release package approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as public claim approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as JSON-first runtime behavior approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as whitelist optimization approval now: NO-GO/);
  assert.match(verification, /accept verification output closure as release\/public-claim approval now: NO-GO/);
  assert.match(verification, /runtime behavior changed: no/);
}

function assertContentFilterFieldEffectRouteSurfaceClosure(source) {
  const semantics = read(contentFilterFieldSemanticsPath);
  const manifest = read(contentFilterFieldEffectManifestPath);
  const matrix = read(contentFilterFieldEffectRouteSurfacePath);

  assert.match(source, /content-filter field semantics contract gate/);
  assert.ok(source.includes(contentFilterFieldSemanticsPath));
  assert.ok(source.includes('tests/runtime/content-filter-field-semantics-contract-gate-current-behavior.test.mjs'));
  assert.match(source, /pins 12 content-filter field semantics contract rows, 16 content\/category\s+semantic callable rows already lifted into the method gate/);
  assert.match(source, /keeps content-filter field semantics contract authority, JSON-first\s+content-filter first-class authority, DOM fallback content-filter deletion/);

  assert.match(source, /content-filter field-effect manifest gate/);
  assert.ok(source.includes(contentFilterFieldEffectManifestPath));
  assert.ok(source.includes('tests/runtime/content-filter-field-effect-manifest-gate-current-behavior.test.mjs'));
  assert.match(source, /pins 12 content-filter field-effect manifest rows, 3 JSON pure decision rows,\s+1 JSON metadata-fetch side-effect row, 5 DOM side-effect rows, and 2\s+bridge\/background metadata side-effect rows/);
  assert.match(source, /pending attrs, metadata fetch scheduling, visibility markers, pending rerun\s+timers, duration attrs, and selected playlist row side effects/);

  assert.match(source, /content-filter field-effect route\/surface matrix/);
  assert.ok(source.includes(contentFilterFieldEffectRouteSurfacePath));
  assert.ok(source.includes('tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs'));
  assert.match(source, /The matrix pins 12 route\/surface rows and 9 route\/surface classes covering JSON\s+renderers/);
  assert.match(source, /watch rail\/playlist behavior, Shorts shelves\/cards, comments exclusion,\s+mobile\/YTM browse and watch playlist rows, Kids sparse cards/);
  assert.match(source, /JSON-first content-filter route\/surface\s+authority, DOM fallback route deletion, YTM selected-row parity, Kids\/native\s+parity/);
  assert.match(source, /closes the content-filter route\/surface documentation\s+chain/);
  assert.match(source, /12 route\/surface closure rows link all 12 route\/surface matrix rows, 12\s+field-effect manifest rows, 12 field-semantics contract rows, 9 route\/surface\s+classes, and 8 source input families/);
  assert.match(source, /runtime route\/surface\s+closure approvals 0, implementation-ready route\/surface rows 0/);
  assert.match(source, /content-filter\s+route\/surface closure `ROUTE-SURFACE-CHAIN-CLOSED`/);
  assert.match(source, /content-filter\s+route\/surface implementation readiness from closure `NO-GO`/);
  assert.match(source, /JSON-first content-filter route authority, DOM fallback deletion, YTM parity,\s+Kids\/native parity, comment-exclusion broad approval/);

  assert.match(semantics, /content-filter field semantics contract rows: 12/);
  assert.match(semantics, /content\/category semantic callable rows already lifted into method gate: 16/);
  assert.match(semantics, /content-filter field semantics contract approval: NO-GO/);
  assert.match(manifest, /content-filter field-effect manifest rows: 12/);
  assert.match(manifest, /JSON pure decision rows: 3/);
  assert.match(manifest, /DOM side-effect rows: 5/);
  assert.match(manifest, /content-filter field-effect manifest approval: NO-GO/);
  assert.match(matrix, /content-filter field-effect route\/surface rows: 12/);
  assert.match(matrix, /route\/surface classes covered: 9/);
  assert.match(matrix, /content-filter route\/surface matrix approval: NO-GO/);
  assert.match(matrix, /content-filter field-effect route\/surface closure rows: 12/);
  assert.match(matrix, /route\/surface matrix rows linked by closure: 12/);
  assert.match(matrix, /field-effect manifest rows linked by closure: 12/);
  assert.match(matrix, /field semantics contract rows linked by closure: 12/);
  assert.match(matrix, /route\/surface classes linked by closure: 9/);
  assert.match(matrix, /source input families linked by route\/surface closure: 8/);
  assert.match(matrix, /runtime route\/surface closure approvals: 0/);
  assert.match(matrix, /implementation-ready route\/surface rows: 0/);
  assert.match(matrix, /content-filter route\/surface closure: ROUTE-SURFACE-CHAIN-CLOSED/);
  assert.match(matrix, /content-filter route\/surface implementation readiness from closure: NO-GO/);
  assert.match(matrix, /close content-filter route\/surface documentation chain now: GO/);
  assert.match(matrix, /accept route\/surface closure as JSON-first content-filter route authority now: NO-GO/);
  assert.match(matrix, /accept route\/surface closure as DOM fallback deletion approval now: NO-GO/);
  assert.match(matrix, /accept route\/surface closure as YTM parity proof now: NO-GO/);
  assert.match(matrix, /accept route\/surface closure as Kids\/native parity proof now: NO-GO/);
  assert.match(matrix, /accept route\/surface closure as comment-exclusion broad approval now: NO-GO/);
  assert.match(matrix, /accept route\/surface closure as release\/public-claim approval now: NO-GO/);
  assert.match(matrix, /runtime behavior changed by this matrix: no/);
}

function assertSettingsRefreshDirtyKeyProducerClosure(source) {
  const producer = read(settingsRefreshDirtyKeyProducerPath);

  assert.match(source, /settings refresh dirty-key producer matrix/);
  assert.ok(source.includes(settingsRefreshDirtyKeyProducerPath));
  assert.ok(source.includes('tests/runtime/settings-refresh-dirty-key-producer-matrix-current-behavior.test.mjs'));
  assert.match(source, /matrix pins 14 rows, 8 producer work families, 4 persistence shapes, and 4\s+broadcast shapes/);
  assert.match(source, /shared settings saves, StateManager direct profile\s+writes, background mode changes, batch whitelist imports, menu\/quick channel\s+mutations/);
  assert.match(source, /settings refresh dirty-key\s+producer authority, producer-to-consumer revision authority, settings no-op\s+write authority/);
  assert.match(source, /broad whitelist optimization, JSON-first promotion,\s+release\/public-claim use, and runtime behavior changes at `NO-GO`/);
  assert.match(source, /closes the settings-refresh dirty-key producer\s+documentation chain/);
  assert.match(source, /14 producer closure rows link all 14 producer matrix rows,\s+8 producer work families, 4 persistence shapes, 4 broadcast shapes, and 7\s+source input families/);
  assert.match(source, /runtime dirty-key producer closure\s+approvals 0, implementation-ready dirty-key producer rows 0/);
  assert.match(source, /settings-refresh\s+dirty-key producer closure `PRODUCER-CHAIN-CLOSED`/);
  assert.match(source, /settings-refresh\s+producer implementation readiness from closure `NO-GO`/);
  assert.match(source, /dirty-key\s+producer authority, producer-to-consumer revision authority, settings no-op\s+write authority/);
  assert.match(source, /rule mutation report evidence, import\/sync write report\s+evidence, map producer budget evidence/);
  assert.match(source, /release\/public-claim use, and runtime behavior changes at `NO-GO`/);

  assert.match(producer, /settings refresh dirty-key producer matrix rows: 14/);
  assert.match(producer, /settings refresh producer work families covered: 8/);
  assert.match(producer, /producer persistence shapes covered: 4/);
  assert.match(producer, /producer broadcast shapes covered: 4/);
  assert.match(producer, /runtime dirty-key producer authority approvals: 0/);
  assert.match(producer, /settings refresh dirty-key producer matrix approval: NO-GO/);
  assert.match(producer, /settings refresh dirty-key producer closure rows: 14/);
  assert.match(producer, /producer matrix rows linked by closure: 14/);
  assert.match(producer, /producer work families linked by closure: 8/);
  assert.match(producer, /producer persistence shapes linked by closure: 4/);
  assert.match(producer, /producer broadcast shapes linked by closure: 4/);
  assert.match(producer, /source input families linked by producer closure: 7/);
  assert.match(producer, /runtime dirty-key producer closure approvals: 0/);
  assert.match(producer, /implementation-ready dirty-key producer rows: 0/);
  assert.match(producer, /settings refresh dirty-key producer closure: PRODUCER-CHAIN-CLOSED/);
  assert.match(producer, /settings refresh producer implementation readiness from closure: NO-GO/);
  assert.match(producer, /define settings refresh dirty-key producer matrix: GO/);
  assert.match(producer, /approve settings refresh dirty-key producer authority now: NO-GO/);
  assert.match(producer, /approve producer-to-consumer revision authority now: NO-GO/);
  assert.match(producer, /approve settings no-op write authority now: NO-GO/);
  assert.match(producer, /approve broad whitelist optimization from current producer gates: NO-GO/);
  assert.match(producer, /approve JSON-first promotion from current producer gates: NO-GO/);
  assert.match(producer, /close settings refresh dirty-key producer documentation chain now: GO/);
  assert.match(producer, /accept producer closure as dirty-key producer authority now: NO-GO/);
  assert.match(producer, /accept producer closure as producer-to-consumer revision authority now: NO-GO/);
  assert.match(producer, /accept producer closure as settings no-op write authority now: NO-GO/);
  assert.match(producer, /accept producer closure as rule mutation report evidence now: NO-GO/);
  assert.match(producer, /accept producer closure as import\/sync write report evidence now: NO-GO/);
  assert.match(producer, /accept producer closure as map producer budget evidence now: NO-GO/);
  assert.match(producer, /accept producer closure as whitelist optimization approval now: NO-GO/);
  assert.match(producer, /accept producer closure as JSON-first promotion approval now: NO-GO/);
  assert.match(producer, /accept producer closure as release\/public-claim approval now: NO-GO/);
  assert.match(producer, /runtime behavior changed by this matrix: no/);
}

function assertSettingsRefreshProducerConsumerJoinClosure(source) {
  const join = read(settingsRefreshDirtyKeyProducerConsumerJoinPath);

  assert.match(source, /settings refresh producer-consumer join matrix/);
  assert.ok(source.includes(settingsRefreshDirtyKeyProducerConsumerJoinPath));
  assert.ok(source.includes('tests/runtime/settings-refresh-dirty-key-producer-consumer-join-matrix-current-behavior.test.mjs'));
  assert.match(source, /14 rows, 8 joined producer families, 7 joined consumer work\s+families, and 5 refresh\/broadcast shapes/);
  assert.match(source, /ApplySettings, RefreshNow,\s+rule\/UI storage keys, video-map non-forced refresh, channelMap-only early return/);
  assert.match(source, /seed no-work\/active replay, and observer\/menu\/quick-block refreshes/);
  assert.match(source, /settings refresh producer-consumer join authority, write-consumer revision\s+authority, JSON\/DOM consumer budget/);
  assert.match(source, /seed replay budget, observer\/menu\/quick\s+budget, broad whitelist optimization/);
  assert.match(source, /release\/public-claim\s+use, and runtime behavior changes at `NO-GO`/);
  assert.match(source, /closes the producer-consumer chain documentation/);
  assert.match(source, /14\s+closure rows link 14 producer rows, 13 consumer rows, and 14 join rows/);
  assert.match(source, /committed producer-consumer join artifacts, runtime chain approvals,\s+implementation readiness, JSON\/DOM work-budget evidence/);
  assert.match(source, /seed replay budget\s+evidence, observer\/menu\/quick budget evidence, whitelist optimization,\s+JSON-first promotion/);
  assert.match(source, /release\/public-claim use, and runtime behavior changes at\s+`NO-GO`/);

  assert.match(join, /settings refresh producer-consumer join matrix rows: 14/);
  assert.match(join, /settings refresh producer families joined: 8/);
  assert.match(join, /settings refresh consumer work families joined: 7/);
  assert.match(join, /join refresh\/broadcast shapes covered: 5/);
  assert.match(join, /runtime producer-consumer join authority approvals: 0/);
  assert.match(join, /settings refresh producer-consumer join matrix approval: NO-GO/);
  assert.match(join, /settings refresh producer-consumer chain closure rows: 14/);
  assert.match(join, /producer rows linked by closure: 14/);
  assert.match(join, /consumer rows linked by closure: 13/);
  assert.match(join, /join rows linked by closure: 14/);
  assert.match(join, /committed producer-consumer join artifacts: 0/);
  assert.match(join, /runtime producer-consumer chain approvals: 0/);
  assert.match(join, /settings refresh producer-consumer chain closure: CHAIN-CLOSED/);
  assert.match(join, /settings refresh producer-consumer implementation readiness from closure: NO-GO/);
  assert.match(join, /define settings refresh producer-consumer join matrix: GO/);
  assert.match(join, /approve settings refresh producer-consumer join authority now: NO-GO/);
  assert.match(join, /approve settings refresh write-consumer revision now: NO-GO/);
  assert.match(join, /approve JSON\/DOM consumer work budget now: NO-GO/);
  assert.match(join, /approve seed replay budget from current joins now: NO-GO/);
  assert.match(join, /approve observer\/menu\/quick-block work budget now: NO-GO/);
  assert.match(join, /approve broad whitelist optimization from current joins: NO-GO/);
  assert.match(join, /approve JSON-first promotion from current joins: NO-GO/);
  assert.match(join, /close settings refresh producer-consumer chain documentation now: GO/);
  assert.match(join, /accept chain closure as producer-consumer join authority now: NO-GO/);
  assert.match(join, /accept chain closure as write-consumer revision evidence now: NO-GO/);
  assert.match(join, /accept chain closure as JSON\/DOM work-budget evidence now: NO-GO/);
  assert.match(join, /accept chain closure as seed replay budget evidence now: NO-GO/);
  assert.match(join, /accept chain closure as observer\/menu\/quick budget evidence now: NO-GO/);
  assert.match(join, /accept chain closure as whitelist optimization approval now: NO-GO/);
  assert.match(join, /accept chain closure as JSON-first promotion approval now: NO-GO/);
  assert.match(join, /accept chain closure as release\/public-claim approval now: NO-GO/);
  assert.match(join, /runtime behavior changed by this matrix: no/);
}

function assertSettingsRefreshOptimizationReadinessContinuation(source) {
  const readiness = read(settingsRefreshOptimizationReadinessPath);

  assert.match(source, /settings refresh optimization readiness boundary/);
  assert.ok(source.includes(settingsRefreshOptimizationReadinessPath));
  assert.ok(source.includes('tests/runtime/settings-refresh-optimization-readiness-boundary-current-behavior.test.mjs'));
  assert.match(source, /12 rows, 6 readiness classes, 8 blocked\s+proof families, and 0 implementation-ready optimization rows/);
  assert.match(source, /ApplySettings, RefreshNow, rule\/UI storage keys, map-only storage keys, seed\s+JSON replay, observer\/menu\/quick-block refresh, and import\/sync profile writes/);
  assert.match(source, /settings refresh optimization authority, forced refresh pruning,\s+map-only pruning, seed replay pruning, observer\/menu\/quick-block pruning/);
  assert.match(source, /broad whitelist optimization, JSON-first promotion,\s+release\/public-claim use, and runtime behavior changes at `NO-GO`/);
  assert.match(source, /closes the settings-refresh readiness classification\s+chain documentation/);
  assert.match(source, /12 classification closure rows link 14 producer-consumer\s+join rows to 12 readiness rows, 6 readiness classes, and 8 blocked proof\s+families/);
  assert.match(source, /runtime readiness classification approvals 0,\s+implementation-ready readiness classification rows 0/);
  assert.match(source, /settings-refresh\s+readiness classification closure `READINESS-CHAIN-CLOSED`/);
  assert.match(source, /settings-refresh implementation readiness from classification closure `NO-GO`/);
  assert.match(source, /settings refresh optimization, forced refresh pruning, map-only\s+pruning, seed replay pruning, observer\/menu\/quick pruning, import\/sync pruning/);
  assert.match(source, /metric collector insertion, whitelist optimization, JSON-first promotion,\s+release\/public-claim use, and runtime behavior changes at `NO-GO`/);

  assert.match(readiness, /settings refresh optimization readiness rows: 12/);
  assert.match(readiness, /settings refresh readiness classes covered: 6/);
  assert.match(readiness, /settings refresh blocked proof families: 8/);
  assert.match(readiness, /settings refresh implementation-ready optimization rows: 0/);
  assert.match(readiness, /runtime settings refresh optimization approvals: 0/);
  assert.match(readiness, /settings refresh optimization readiness approval: NO-GO/);
  assert.match(readiness, /runtime behavior changed: no/);
  assert.match(readiness, /settings refresh readiness classification closure rows: 12/);
  assert.match(readiness, /producer-consumer join rows linked by readiness closure: 14/);
  assert.match(readiness, /settings refresh readiness rows linked by readiness closure: 12/);
  assert.match(readiness, /settings refresh readiness classes linked by closure: 6/);
  assert.match(readiness, /settings refresh blocked proof families linked by closure: 8/);
  assert.match(readiness, /runtime settings refresh readiness classification approvals: 0/);
  assert.match(readiness, /implementation-ready readiness classification rows: 0/);
  assert.match(readiness, /settings refresh readiness classification closure: READINESS-CHAIN-CLOSED/);
  assert.match(readiness, /settings refresh implementation readiness from classification closure: NO-GO/);
  assert.match(readiness, /define settings refresh optimization readiness boundary: GO/);
  assert.match(readiness, /approve forced refresh pruning now: NO-GO/);
  assert.match(readiness, /approve map-only refresh pruning now: NO-GO/);
  assert.match(readiness, /approve seed replay pruning now: NO-GO/);
  assert.match(readiness, /approve observer\/menu\/quick-block pruning now: NO-GO/);
  assert.match(readiness, /approve import\/sync refresh pruning now: NO-GO/);
  assert.match(readiness, /close settings refresh readiness classification documentation now: GO/);
  assert.match(readiness, /accept readiness classification closure as settings refresh optimization approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as forced refresh pruning approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as map-only pruning approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as seed replay pruning approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as observer\/menu\/quick pruning approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as import\/sync pruning approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as metric collector insertion approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as whitelist optimization approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as JSON-first promotion approval now: NO-GO/);
  assert.match(readiness, /accept readiness classification closure as release\/public-claim approval now: NO-GO/);
  assert.match(readiness, /runtime behavior changed by this boundary: no/);
}

function assertSettingsRefreshOptimizationCandidateBindingContinuation(source) {
  const binding = read(settingsRefreshOptimizationCandidateBindingPath);

  assert.match(source, /settings refresh optimization candidate binding matrix/);
  assert.ok(source.includes(settingsRefreshOptimizationCandidateBindingPath));
  assert.ok(source.includes('tests/runtime/settings-refresh-optimization-candidate-binding-matrix-current-behavior.test.mjs'));
  assert.match(source, /12 settings-refresh readiness rows covered, 12 optimization\s+candidates referenced, 14 first-optimization readiness gates referenced/);
  assert.match(source, /0\s+implementation-ready settings-refresh candidate bindings, and 0 runtime\s+settings-refresh candidate binding approvals/);
  assert.match(source, /settings refresh\s+candidate binding authority, forced refresh candidate pruning, map-only\s+candidate pruning, seed replay candidate pruning/);
  assert.match(source, /metric collector insertion, whitelist\s+optimization, JSON-first promotion, release\/public-claim use, and runtime\s+behavior changes at `NO-GO`/);
  assert.match(source, /closes the settings-refresh candidate binding chain\s+documentation/);
  assert.match(source, /12 binding closure rows link 12 readiness rows, 12 candidate\s+binding rows, 12 optimization candidate ids, and the 14 first-optimization\s+readiness gates/);
  assert.match(source, /runtime binding chain approvals 0,\s+implementation-ready binding chain rows 0/);
  assert.match(source, /settings-refresh candidate binding\s+chain closure `BINDING-CHAIN-CLOSED`/);
  assert.match(source, /settings-refresh implementation\s+readiness from binding closure `NO-GO`/);
  assert.match(source, /settings refresh optimization,\s+forced refresh pruning, map-only pruning, seed replay pruning,\s+observer\/menu\/quick pruning, import\/sync pruning, metric collector insertion/);
  assert.match(source, /whitelist optimization, JSON-first promotion, release\/public-claim use, and\s+runtime behavior changes at `NO-GO`/);

  assert.match(binding, /settings refresh optimization candidate binding rows: 12/);
  assert.match(binding, /settings refresh readiness rows covered: 12/);
  assert.match(binding, /optimization candidates referenced: 12/);
  assert.match(binding, /first optimization readiness gates referenced: 14/);
  assert.match(binding, /implementation-ready settings refresh candidate bindings: 0/);
  assert.match(binding, /runtime settings refresh candidate binding approvals: 0/);
  assert.match(binding, /settings refresh candidate binding approval: NO-GO/);
  assert.match(binding, /runtime behavior changed: no/);
  assert.match(binding, /settings refresh candidate binding chain closure rows: 12/);
  assert.match(binding, /settings refresh readiness rows linked by binding closure: 12/);
  assert.match(binding, /candidate binding rows linked by binding closure: 12/);
  assert.match(binding, /optimization candidate ids linked by binding closure: 12/);
  assert.match(binding, /first optimization readiness gates referenced by binding closure: 14/);
  assert.match(binding, /runtime settings refresh binding chain approvals: 0/);
  assert.match(binding, /implementation-ready settings refresh binding chain rows: 0/);
  assert.match(binding, /settings refresh candidate binding chain closure: BINDING-CHAIN-CLOSED/);
  assert.match(binding, /settings refresh implementation readiness from binding closure: NO-GO/);
  assert.match(binding, /define settings refresh optimization candidate binding matrix: GO/);
  assert.match(binding, /approve forced refresh candidate pruning now: NO-GO/);
  assert.match(binding, /approve metric collector insertion from this matrix now: NO-GO/);
  assert.match(binding, /approve whitelist optimization from this matrix now: NO-GO/);
  assert.match(binding, /approve JSON-first promotion from this matrix now: NO-GO/);
  assert.match(binding, /approve release\/public claims from this matrix now: NO-GO/);
  assert.match(binding, /close settings refresh candidate binding chain documentation now: GO/);
  assert.match(binding, /accept binding closure as settings refresh optimization approval now: NO-GO/);
  assert.match(binding, /accept binding closure as forced refresh pruning approval now: NO-GO/);
  assert.match(binding, /accept binding closure as map-only pruning approval now: NO-GO/);
  assert.match(binding, /accept binding closure as seed replay pruning approval now: NO-GO/);
  assert.match(binding, /accept binding closure as observer\/menu\/quick pruning approval now: NO-GO/);
  assert.match(binding, /accept binding closure as import\/sync pruning approval now: NO-GO/);
  assert.match(binding, /accept binding closure as metric collector insertion approval now: NO-GO/);
  assert.match(binding, /accept binding closure as whitelist optimization approval now: NO-GO/);
  assert.match(binding, /accept binding closure as JSON-first promotion approval now: NO-GO/);
  assert.match(binding, /accept binding closure as release\/public-claim approval now: NO-GO/);
  assert.match(binding, /runtime behavior changed by this matrix: no/);
}

function assertSettingsRefreshOptimizationCandidateEvidenceContinuation(source) {
  const evidence = read(settingsRefreshOptimizationCandidateEvidencePath);

  assert.match(source, /settings refresh optimization candidate evidence packet contract/);
  assert.ok(source.includes(settingsRefreshOptimizationCandidateEvidencePath));
  assert.ok(source.includes('tests/runtime/settings-refresh-optimization-candidate-evidence-packet-contract-current-behavior.test.mjs'));
  assert.match(source, /12 evidence packet rows, 12\s+settings-refresh candidate binding rows covered, 12 settings-refresh readiness\s+rows covered, 10 first-optimization evidence packet rows referenced, 29\s+required packet fields/);
  assert.match(source, /0 implementation-ready settings-refresh evidence\s+packets, and 0 runtime settings-refresh evidence packet approvals/);
  assert.match(source, /settings refresh evidence packet authority, forced refresh evidence packets,\s+map-only evidence packets, seed replay evidence packets, observer\/menu\/quick\s+evidence packets/);
  assert.match(source, /metric collector insertion,\s+whitelist optimization, JSON-first promotion, release\/public-claim use, and\s+runtime behavior changes at `NO-GO`/);
  assert.match(source, /closes the settings-refresh evidence chain documentation/);
  assert.match(source, /12 chain closure rows link 12 readiness rows, 12 candidate binding rows, and 12\s+evidence packet rows/);
  assert.match(source, /keeping committed settings-refresh evidence\s+artifacts, runtime chain approvals, implementation readiness, metric artifact\s+evidence/);
  assert.match(source, /collector insertion, forced refresh pruning, whitelist optimization,\s+JSON-first promotion, release\/public-claim use, and runtime behavior changes at\s+`NO-GO`/);

  assert.match(evidence, /settings refresh candidate evidence packet rows: 12/);
  assert.match(evidence, /settings refresh candidate binding rows covered: 12/);
  assert.match(evidence, /settings refresh readiness rows covered: 12/);
  assert.match(evidence, /first optimization evidence packet rows referenced: 10/);
  assert.match(evidence, /required settings refresh packet fields: 29/);
  assert.match(evidence, /implementation-ready settings refresh evidence packets: 0/);
  assert.match(evidence, /runtime settings refresh evidence packet approvals: 0/);
  assert.match(evidence, /settings refresh evidence packet approval: NO-GO/);
  assert.match(evidence, /runtime behavior changed: no/);
  assert.match(evidence, /settings refresh evidence chain closure rows: 12/);
  assert.match(evidence, /settings refresh readiness rows linked: 12/);
  assert.match(evidence, /candidate binding rows linked: 12/);
  assert.match(evidence, /evidence packet rows linked: 12/);
  assert.match(evidence, /first optimization evidence row families referenced: 10/);
  assert.match(evidence, /committed settings refresh evidence artifacts: 0/);
  assert.match(evidence, /runtime settings refresh chain approvals: 0/);
  assert.match(evidence, /settings refresh evidence chain closure: CHAIN-CLOSED/);
  assert.match(evidence, /settings refresh implementation readiness from chain closure: NO-GO/);
  assert.match(evidence, /define settings refresh candidate evidence packet contract: GO/);
  assert.match(evidence, /approve forced refresh evidence packet now: NO-GO/);
  assert.match(evidence, /approve metric collector insertion from this contract now: NO-GO/);
  assert.match(evidence, /approve whitelist optimization from this contract now: NO-GO/);
  assert.match(evidence, /approve JSON-first promotion from this contract now: NO-GO/);
  assert.match(evidence, /approve release\/public claims from this contract now: NO-GO/);
  assert.match(evidence, /close settings refresh evidence chain documentation now: GO/);
  assert.match(evidence, /accept chain closure as implementation-ready evidence now: NO-GO/);
  assert.match(evidence, /accept chain closure as metric artifact evidence now: NO-GO/);
  assert.match(evidence, /accept chain closure as collector insertion approval now: NO-GO/);
  assert.match(evidence, /accept chain closure as forced refresh pruning approval now: NO-GO/);
  assert.match(evidence, /accept chain closure as whitelist optimization approval now: NO-GO/);
  assert.match(evidence, /accept chain closure as JSON-first promotion approval now: NO-GO/);
  assert.match(evidence, /accept chain closure as release\/public-claim approval now: NO-GO/);
  assert.match(evidence, /runtime behavior changed by this contract: no/);
}

function assertSettingsRefreshFanoutMetricSampleLinkageContinuation(source) {
  const sample = read(metricSampleContractPath);
  const readiness = read(settingsRefreshOptimizationReadinessPath);

  assert.match(source, /settings refresh fanout metric sample linkage/);
  assert.ok(source.includes(metricSampleContractPath));
  assert.ok(source.includes('tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs'));
  assert.ok(source.includes(settingsRefreshOptimizationReadinessPath));
  assert.match(source, /9 fanout metric sample\s+rows, 9 source settings-refresh fanout rows linked, 8 inline\s+`domLifecycleCounters` fanout fields linked/);
  assert.match(source, /0 committed metric sample files\s+from fanout linkage/);
  assert.match(source, /runtime collector insertion from fanout linkage `NO-GO`/);
  assert.match(source, /observer\/menu\/quick pruning from fanout linkage `NO-GO`/);
  assert.match(source, /whitelist optimization\s+from fanout linkage `NO-GO`/);
  assert.match(source, /JSON-first promotion from fanout linkage `NO-GO`/);
  assert.match(source, /runtime behavior changed by fanout linkage: no/);
  assert.match(source, /settings-refresh\s+fanout measurement first-class/);
  assert.match(source, /metric artifact commits, runtime\s+collector insertion, observer\/menu\/quick pruning, whitelist optimization/);

  assert.match(sample, /Settings Refresh Fanout Metric Sample Linkage Addendum/);
  assert.match(sample, /settings refresh fanout metric sample linkage rows: 9/);
  assert.match(sample, /source settings-refresh fanout rows linked: 9/);
  assert.match(sample, /inline domLifecycleCounters fanout fields linked: 8/);
  assert.match(sample, /committed metric sample files from fanout linkage: 0/);
  assert.match(sample, /runtime collector insertion from fanout linkage: NO-GO/);
  assert.match(sample, /observer\/menu\/quick pruning from fanout linkage: NO-GO/);
  assert.match(sample, /whitelist optimization from fanout linkage: NO-GO/);
  assert.match(sample, /JSON-first promotion from fanout linkage: NO-GO/);
  assert.match(sample, /runtime behavior changed by fanout linkage: no/);
  assert.match(readiness, /Settings Refresh Runtime Fanout Detail - 2026-05-30/);
  assert.match(readiness, /settings refresh runtime fanout detail rows: 9/);
  assert.match(readiness, /committed settings refresh fanout metric artifacts: 0/);
}

function assertWhitelistCacheSpaMetricPacketContinuation(source) {
  const packet = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA metric packet gate/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /release-lag, whitelist cache, live YouTube SPA smoke, route\/surface\s+metric artifact, behavior-invariant, and JSON-first promotion gates/);
  assert.match(source, /12 packet rows, 6 live YouTube SPA smoke\s+rows required, 5 route\/surface metric artifact files required/);
  assert.match(source, /0 committed\s+whitelist\/cache SPA metric packet files, 0 committed live smoke result files, 0\s+runtime metric collectors/);
  assert.match(source, /0 runtime whitelist\/cache optimization approvals, 0\s+runtime JSON-first first-class promotion approvals, and release readiness\s+`NO-GO`/);
  assert.match(source, /use of the live smoke template as executed proof,\s+route\/surface metric artifact commits, active installed-tab byte parity claims, broad\s+whitelist\/cache optimization, JSON-first first-class filtering/);
  assert.match(source, /performance claims, and runtime behavior changes at `NO-GO`/);

  assert.match(packet, /whitelist\/cache SPA metric packet rows: 12/);
  assert.match(packet, /live YouTube SPA smoke rows required: 6/);
  assert.match(packet, /route\/surface metric artifact files required: 5/);
  assert.match(packet, /committed whitelist\/cache SPA metric packet files: 0/);
  assert.match(packet, /committed live YouTube SPA smoke result files: 0/);
  assert.match(packet, /runtime metric collectors approved: 0/);
  assert.match(packet, /runtime whitelist\/cache optimization approvals: 0/);
  assert.match(packet, /runtime JSON-first first-class promotion approvals: 0/);
  assert.match(packet, /release readiness from this gate: NO-GO/);
  assert.match(packet, /non-executed live smoke artifact template/);
  assert.match(packet, /that is contract\/tooling, not execution\s+proof/);
  assert.match(packet, /commit route\/surface metric artifact files now: NO-GO/);
  assert.match(packet, /approve broad whitelist\/cache optimization now: NO-GO/);
  assert.match(packet, /approve JSON-first as first-class filter authority now: NO-GO/);
  assert.match(packet, /continue proof-backed audit: GO/);
}

function assertWhitelistCacheSpaInstalledByteParityContinuation(source) {
  const gate = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA installed byte parity gate/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /12 installed byte parity rows, 14 required installed byte parity\s+fields/);
  assert.match(source, /runner installed byte parity schema as `PRESENT`,\s+`smokeSliceReadiness` as `NONRELEASE_ONLY`, visible Default profile workspace\s+path proof as `PARTIAL`, active YouTube tab content-script byte authority/);
  assert.match(source, /extension reload timestamp authority, automation profile substitution\s+authority/);
  assert.match(source, /automation profile substitution\s+authority, incognito runtime\s+availability authority, and live smoke acceptance\s+from this gate at `NO-GO`/);
  assert.match(source, /Default Secure Preferences as active-tab parity proof, automation CDP\s+profile proof as visible-tab proof, live smoke template use as executed proof/);
  assert.match(source, /runner `smokeSliceReadiness` as release proof without byte parity/);
  assert.match(source, /whitelist\/cache optimization, JSON-first\s+first-class\s+filtering, release\/public performance claims, and runtime behavior\s+changes at\s+`NO-GO`/);

  assert.match(gate, /selected packet row: FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes/);
  assert.match(gate, /installed byte parity gate rows: 12/);
  assert.match(gate, /required installed byte parity fields: 14/);
  assert.match(gate, /runner installed byte parity schema: PRESENT/);
  assert.match(gate, /runner smoke-slice readiness without byte parity: NONRELEASE_ONLY/);
  assert.match(gate, /visible Default profile workspace path proof: PARTIAL/);
  assert.match(gate, /active YouTube tab content-script byte authority: NO-GO/);
  assert.match(gate, /extension reload timestamp authority: NO-GO/);
  assert.match(gate, /automation profile substitution authority: NO-GO/);
  assert.match(gate, /incognito runtime availability authority: NO-GO/);
  assert.match(gate, /live smoke acceptance from this gate: NO-GO/);
  assert.match(gate, /accept Default Secure Preferences as active-tab parity proof now: NO-GO/);
  assert.match(gate, /accept automation CDP profile proof as visible-tab proof now: NO-GO/);
  assert.match(gate, /accept live smoke template as executed proof now: NO-GO/);
  assert.match(gate, /accept runner smokeSliceReadiness as release proof without byte parity now: NO-GO/);
  assert.match(gate, /approve whitelist\/cache optimization from this gate now: NO-GO/);
  assert.match(gate, /approve JSON-first first-class filtering from this gate now: NO-GO/);
  assert.match(gate, /continue proof-backed audit: GO/);
}

function assertWhitelistCacheSpaRouteModeMatrixContinuation(source) {
  const gate = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA route-mode matrix gate/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /FT-WLCACHE-SPA-PACKET-02-route-sequence/);
  assert.match(source, /FT-WLCACHE-SPA-PACKET-03-list-modes/);
  assert.match(source, /6 route sequence rows, 6 list-mode states, 36 required\s+route-mode observation cells, 16 required route-mode fields/);
  assert.match(source, /0 committed\s+route-mode matrix files, 0 runtime route-mode smoke approvals, and route-mode\s+release readiness `NO-GO`/);
  assert.match(source, /six route template rows as executed\s+route-mode proof, source-only list-mode fixtures as live route-mode proof/);
  assert.match(source, /route-mode matrices without installed byte parity, route-mode matrices without\s+behavior invariants/);
  assert.match(source, /whitelist\/cache optimization, JSON-first first-class\s+filtering, release\/public performance claims, and runtime behavior changes at\s+`NO-GO`/);

  assert.match(gate, /selected packet rows: FT-WLCACHE-SPA-PACKET-02-route-sequence, FT-WLCACHE-SPA-PACKET-03-list-modes/);
  assert.match(gate, /route sequence rows required: 6/);
  assert.match(gate, /list-mode states required: 6/);
  assert.match(gate, /route-mode observation cells required: 36/);
  assert.match(gate, /required route-mode fields: 16/);
  assert.match(gate, /committed route-mode matrix files: 0/);
  assert.match(gate, /runtime route-mode smoke approvals: 0/);
  assert.match(gate, /route-mode release readiness: NO-GO/);
  assert.match(gate, /define route sequence and list-mode matrix gate: GO/);
  assert.match(gate, /accept six route template rows as executed route-mode proof now: NO-GO/);
  assert.match(gate, /accept source-only list-mode fixtures as live route-mode proof now: NO-GO/);
  assert.match(gate, /accept route-mode matrix without installed byte parity now: NO-GO/);
  assert.match(gate, /accept route-mode matrix without behavior invariants now: NO-GO/);
  assert.match(gate, /approve whitelist\/cache optimization from route-mode matrix now: NO-GO/);
  assert.match(gate, /approve JSON-first first-class filtering from route-mode matrix now: NO-GO/);
  assert.match(gate, /continue proof-backed audit: GO/);
}

function assertWhitelistCacheSpaWorkBudgetContinuation(source) {
  const gate = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA transport and DOM lifecycle budget gate/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /FT-WLCACHE-SPA-PACKET-04-transport-no-work/);
  assert.match(source, /FT-WLCACHE-SPA-PACKET-05-dom-lifecycle/);
  assert.match(source, /8 transport budget rows, 10 DOM\s+lifecycle budget rows, 18 required work-budget fields/);
  assert.match(source, /0 committed route-mode\s+work-budget files, 0 runtime work-budget collectors, and work-budget release\s+readiness `NO-GO`/);
  assert.match(source, /source-only no-work gates as route-mode budget\s+proof, live smoke without transport counters, live smoke without DOM lifecycle\s+counters/);
  assert.match(source, /work-budget matrices without route-mode coverage, whitelist\/cache\s+optimization, JSON-first first-class filtering, release\/public performance\s+claims, and runtime behavior changes at `NO-GO`/);

  assert.match(gate, /selected packet rows: FT-WLCACHE-SPA-PACKET-04-transport-no-work, FT-WLCACHE-SPA-PACKET-05-dom-lifecycle/);
  assert.match(gate, /transport budget rows required: 8/);
  assert.match(gate, /DOM lifecycle budget rows required: 10/);
  assert.match(gate, /required work-budget fields: 18/);
  assert.match(gate, /committed route-mode work-budget files: 0/);
  assert.match(gate, /runtime work-budget collectors approved: 0/);
  assert.match(gate, /work-budget release readiness: NO-GO/);
  assert.match(gate, /define transport and DOM lifecycle budget gate: GO/);
  assert.match(gate, /accept source-only no-work gates as route-mode budget proof now: NO-GO/);
  assert.match(gate, /accept live smoke without transport counters now: NO-GO/);
  assert.match(gate, /accept live smoke without DOM lifecycle counters now: NO-GO/);
  assert.match(gate, /accept work-budget matrix without route-mode coverage now: NO-GO/);
  assert.match(gate, /approve whitelist\/cache optimization from work-budget gate now: NO-GO/);
  assert.match(gate, /approve JSON-first first-class filtering from work-budget gate now: NO-GO/);
  assert.match(gate, /approve public performance claim from work-budget gate now: NO-GO/);
  assert.match(gate, /runtime behavior changed: no/);
  assert.match(gate, /continue proof-backed audit: GO/);
}

function assertWhitelistCacheSpaPendingCacheContinuation(source) {
  const gate = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA pending-rail and cache refresh gate/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /FT-WLCACHE-SPA-PACKET-06-whitelist-pending-rail/);
  assert.match(source, /FT-WLCACHE-SPA-PACKET-07-cache-refresh/);
  assert.match(source, /10\s+pending-hide rail rows, 10 cache refresh rows, 20 required pending\/cache\s+fields/);
  assert.match(source, /0 committed pending\/cache metric files, 0 runtime pending\/cache\s+collectors, and pending\/cache release readiness `NO-GO`/);
  assert.match(source, /source-only\s+pending-hide tests as route-mode behavior proof, source-only cache hot-path\s+tests as route-mode behavior proof/);
  assert.match(source, /live smoke without false-hide and leak\s+samples, live smoke without `forceReprocess` upgrade samples/);
  assert.match(source, /pending\/cache\s+matrices without installed byte parity, whitelist\/cache optimization/);
  assert.match(source, /JSON-first first-class filtering, release\/public performance claims, and\s+runtime behavior changes at `NO-GO`/);

  assert.match(gate, /selected packet rows: FT-WLCACHE-SPA-PACKET-06-whitelist-pending-rail, FT-WLCACHE-SPA-PACKET-07-cache-refresh/);
  assert.match(gate, /pending-hide rail rows required: 10/);
  assert.match(gate, /cache refresh rows required: 10/);
  assert.match(gate, /required pending\/cache fields: 20/);
  assert.match(gate, /committed pending\/cache metric files: 0/);
  assert.match(gate, /runtime pending\/cache collectors approved: 0/);
  assert.match(gate, /pending\/cache release readiness: NO-GO/);
  assert.match(gate, /define whitelist pending-rail and cache refresh gate: GO/);
  assert.match(gate, /accept source-only pending-hide tests as route-mode behavior proof now: NO-GO/);
  assert.match(gate, /accept source-only cache hot-path tests as route-mode behavior proof now: NO-GO/);
  assert.match(gate, /accept live smoke without false-hide and leak samples now: NO-GO/);
  assert.match(gate, /accept live smoke without forceReprocess upgrade samples now: NO-GO/);
  assert.match(gate, /accept pending\/cache matrix without installed byte parity now: NO-GO/);
  assert.match(gate, /approve whitelist\/cache optimization from pending\/cache gate now: NO-GO/);
  assert.match(gate, /approve JSON-first first-class filtering from pending\/cache gate now: NO-GO/);
  assert.match(gate, /approve public performance claim from pending\/cache gate now: NO-GO/);
  assert.match(gate, /runtime behavior changed: no/);
  assert.match(gate, /continue proof-backed audit: GO/);
}

function assertWhitelistCacheSpaSettingsBehaviorContinuation(source) {
  const gate = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA settings mutation and behavior invariant gate/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /FT-WLCACHE-SPA-PACKET-08-settings-mutation/);
  assert.match(source, /FT-WLCACHE-SPA-PACKET-09-behavior-invariants/);
  assert.match(source, /10 settings mutation rows, 10 behavior invariant\s+rows, 20 required settings\/behavior fields/);
  assert.match(source, /0 committed settings\/behavior\s+metric files, 0 runtime settings\/behavior collectors, and settings\/behavior\s+release readiness `NO-GO`/);
  assert.match(source, /source-only settings refresh tests as\s+route-mode mutation proof, source-only behavior fixture tests as live invariant\s+proof/);
  assert.match(source, /live smoke without settings revision before\/after, live smoke without\s+blocklist and whitelist invariant samples/);
  assert.match(source, /live smoke without menu and\s+quick-block invariant samples, settings\/behavior matrices without installed\s+byte parity/);
  assert.match(source, /whitelist\/cache optimization, JSON-first first-class filtering,\s+release\/public performance claims, and runtime behavior changes at `NO-GO`/);

  assert.match(gate, /selected packet rows: FT-WLCACHE-SPA-PACKET-08-settings-mutation, FT-WLCACHE-SPA-PACKET-09-behavior-invariants/);
  assert.match(gate, /settings mutation rows required: 10/);
  assert.match(gate, /behavior invariant rows required: 10/);
  assert.match(gate, /required settings\/behavior fields: 20/);
  assert.match(gate, /committed settings\/behavior metric files: 0/);
  assert.match(gate, /runtime settings\/behavior collectors approved: 0/);
  assert.match(gate, /settings\/behavior release readiness: NO-GO/);
  assert.match(gate, /define settings mutation and behavior invariant gate: GO/);
  assert.match(gate, /accept source-only settings refresh tests as route-mode mutation proof now: NO-GO/);
  assert.match(gate, /accept source-only behavior fixture tests as live invariant proof now: NO-GO/);
  assert.match(gate, /accept live smoke without settings revision before\/after now: NO-GO/);
  assert.match(gate, /accept live smoke without blocklist and whitelist invariant samples now: NO-GO/);
  assert.match(gate, /accept live smoke without menu and quick-block invariant samples now: NO-GO/);
  assert.match(gate, /accept settings\/behavior matrix without installed byte parity now: NO-GO/);
  assert.match(gate, /approve whitelist\/cache optimization from settings\/behavior gate now: NO-GO/);
  assert.match(gate, /approve JSON-first first-class filtering from settings\/behavior gate now: NO-GO/);
  assert.match(gate, /approve public performance claim from settings\/behavior gate now: NO-GO/);
  assert.match(gate, /runtime behavior changed: no/);
  assert.match(gate, /continue proof-backed audit: GO/);
}

function assertWhitelistCacheSpaJsonRolloutContinuation(source) {
  const gate = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA JSON-first promotion and rollout nonclaim gate/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /FT-WLCACHE-SPA-PACKET-10-json-first-first-class-gate/);
  assert.match(source, /FT-WLCACHE-SPA-PACKET-11-rollout-nonclaim/);
  assert.match(source, /10 JSON-first promotion rows, 10 rollout nonclaim rows, 20\s+required JSON-first\/rollout fields/);
  assert.match(source, /0 committed JSON-first\/rollout metric\s+files, 0 runtime JSON-first\/rollout collectors, and JSON-first\/rollout release\s+readiness `NO-GO`/);
  assert.match(source, /JSON-first as first-class authority, route\/surface\s+contracts without committed artifacts/);
  assert.match(source, /promotion without recommendation\s+engagement noninteraction proof, rollout without explicit rollback plan/);
  assert.match(source, /browser packet use as native\/mobile\/TV proof, public performance claims/);
  assert.match(source, /whitelist\/cache optimization, JSON-first first-class filtering, release ship\s+decisions, and runtime behavior changes at `NO-GO`/);

  assert.match(gate, /selected packet rows: FT-WLCACHE-SPA-PACKET-10-json-first-first-class-gate, FT-WLCACHE-SPA-PACKET-11-rollout-nonclaim/);
  assert.match(gate, /JSON-first promotion rows required: 10/);
  assert.match(gate, /rollout nonclaim rows required: 10/);
  assert.match(gate, /required JSON-first\/rollout fields: 20/);
  assert.match(gate, /committed JSON-first\/rollout metric files: 0/);
  assert.match(gate, /runtime JSON-first\/rollout collectors approved: 0/);
  assert.match(gate, /JSON-first\/rollout release readiness: NO-GO/);
  assert.match(gate, /define JSON-first promotion and rollout nonclaim gate: GO/);
  assert.match(gate, /accept JSON-first as first-class authority now: NO-GO/);
  assert.match(gate, /accept route\/surface contracts without committed artifacts now: NO-GO/);
  assert.match(gate, /accept promotion without recommendation-engagement noninteraction proof now: NO-GO/);
  assert.match(gate, /accept rollout without explicit rollback plan now: NO-GO/);
  assert.match(gate, /accept browser packet as native\/mobile\/TV proof now: NO-GO/);
  assert.match(gate, /accept public performance claims from this packet now: NO-GO/);
  assert.match(gate, /approve whitelist\/cache optimization from JSON-first\/rollout gate now: NO-GO/);
  assert.match(gate, /approve JSON-first first-class filtering from JSON-first\/rollout gate now: NO-GO/);
  assert.match(gate, /approve release ship decision from JSON-first\/rollout gate now: NO-GO/);
  assert.match(gate, /runtime behavior changed: no/);
  assert.match(gate, /continue proof-backed audit: GO/);
}

function assertWhitelistCacheSpaPacketExpansionClosure(source) {
  const gate = read(whitelistCacheSpaMetricPacketGatePath);

  assert.match(source, /whitelist\/cache SPA packet row expansion closure/);
  assert.ok(source.includes(whitelistCacheSpaMetricPacketGatePath));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /7 packet\s+row expansion rows, 12 packet rows covered by expansion rows, 0 packet rows\s+without an expansion row/);
  assert.match(source, /0 implementation packet artifacts committed, 0\s+executed live smoke artifacts committed/);
  assert.match(source, /packet row expansion closure\s+`ROW-EXPANSION-CLOSED`, and release readiness from expansion closure `NO-GO`/);
  assert.match(source, /row expansion as live smoke evidence, row expansion as route-mode\s+metric artifact evidence/);
  assert.match(source, /row expansion as optimization approval, row expansion\s+as JSON-first first-class approval, row expansion as release ship decision, and\s+runtime behavior changes at `NO-GO`/);

  assert.match(gate, /packet row expansion rows: 7/);
  assert.match(gate, /packet rows covered by expansion rows: 12/);
  assert.match(gate, /packet rows without an expansion row: 0/);
  assert.match(gate, /implementation packet artifacts committed: 0/);
  assert.match(gate, /executed live smoke artifacts committed: 0/);
  assert.match(gate, /packet row expansion closure: ROW-EXPANSION-CLOSED/);
  assert.match(gate, /release readiness from expansion closure: NO-GO/);
  assert.match(gate, /close packet row documentation expansion now: GO/);
  assert.match(gate, /accept row expansion as live smoke evidence now: NO-GO/);
  assert.match(gate, /accept row expansion as route-mode metric artifact evidence now: NO-GO/);
  assert.match(gate, /accept row expansion as optimization approval now: NO-GO/);
  assert.match(gate, /accept row expansion as JSON-first first-class approval now: NO-GO/);
  assert.match(gate, /accept row expansion as release ship decision now: NO-GO/);
  assert.match(gate, /runtime behavior changed: no/);
  assert.match(gate, /continue proof-backed audit: GO/);
}

function assertContentFilterRouteSurfaceNoWorkBudgetContinuation(source) {
  const budget = read(contentFilterRouteSurfaceNoWorkBudgetPath);

  assert.match(source, /content-filter route\/surface no-work budget/);
  assert.ok(source.includes(contentFilterRouteSurfaceNoWorkBudgetPath));
  assert.ok(source.includes('tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs'));
  assert.match(source, /12 no-work rows, 7 current cheap no-work gate\s+families, and 6 known over-work gap families/);
  assert.match(source, /seed network pass-through,\s+JSON\/main-world active-work predicates, identity prefetch, DOM fallback active\s+predicates/);
  assert.match(source, /metadata scheduler needs, comment exclusion, and empty-install idle observer\s+limits/);
  assert.match(source, /JSON-first content-filter no-work authority, DOM fallback\s+route deletion, broad empty-install completion, broad whitelist optimization/);
  assert.match(source, /metadata fetch route\/surface authority, release\/public-claim use, and runtime\s+behavior changes at `NO-GO`/);
  assert.match(source, /closes the content-filter no-work documentation chain/);
  assert.match(source, /7\s+closure rows cover all 12 budget rows and link 7 source input families/);
  assert.match(source, /committed no-work metric artifacts, live trace artifacts, runtime\s+closure approvals, implementation readiness/);
  assert.match(source, /JSON-first no-work authority, DOM\s+fallback deletion, whitelist optimization, metadata scheduler fetch authority,\s+release\/public-claim use, and runtime behavior changes at `NO-GO`/);

  assert.match(budget, /content-filter route\/surface no-work budget rows: 12/);
  assert.match(budget, /current cheap no-work gate families covered: 7/);
  assert.match(budget, /known over-work gap families covered: 6/);
  assert.match(budget, /runtime no-work authority approvals: 0/);
  assert.match(budget, /content-filter no-work budget approval: NO-GO/);
  assert.match(budget, /content-filter no-work closure rows: 7/);
  assert.match(budget, /budget rows covered by closure rows: 12/);
  assert.match(budget, /source input families linked: 7/);
  assert.match(budget, /committed no-work metric artifacts: 0/);
  assert.match(budget, /committed live trace artifacts: 0/);
  assert.match(budget, /runtime no-work closure approvals: 0/);
  assert.match(budget, /content-filter no-work closure: BUDGET-CHAIN-CLOSED/);
  assert.match(budget, /content-filter implementation readiness from closure: NO-GO/);
  assert.match(budget, /define content-filter route\/surface no-work budget: GO/);
  assert.match(budget, /approve JSON-first content-filter no-work authority now: NO-GO/);
  assert.match(budget, /delete DOM fallback no-work route behavior now: NO-GO/);
  assert.match(budget, /use empty-install idle observer proof as broad no-work completion now: NO-GO/);
  assert.match(budget, /use whitelist pending-intake patch as broad whitelist optimization proof now: NO-GO/);
  assert.match(budget, /use metadata scheduler no-work gates as route\/surface fetch authority now: NO-GO/);
  assert.match(budget, /close content-filter no-work documentation chain now: GO/);
  assert.match(budget, /accept closure as JSON-first no-work authority now: NO-GO/);
  assert.match(budget, /accept closure as DOM fallback deletion approval now: NO-GO/);
  assert.match(budget, /accept closure as live trace or metric artifact evidence now: NO-GO/);
  assert.match(budget, /accept closure as whitelist optimization approval now: NO-GO/);
  assert.match(budget, /accept closure as metadata scheduler fetch authority now: NO-GO/);
  assert.match(budget, /accept closure as release\/public-claim approval now: NO-GO/);
  assert.match(budget, /runtime behavior changed: no/);
  assert.match(budget, /continue proof-backed audit: GO/);
}

test('audit_completion_gap_register_is_audit_only_and_keeps_goal_open', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /Completion is not proven/);
  assert.match(source, /active audit goal remains open/);
  assert.match(source, /current broad\s+`npm run audit:runtime` result is a backlog signal for the expanded runtime\s+declaration set/);
  assert.match(source, /focused lanes prove scoped current-behavior claims only/);
  assert.match(source, /do not prove that every feature, file, method, JSON path, DOM selector/);
  assertRuntimeCountReconciliationAddendum(source);
  assertSettingsModeStopGoContinuation(source);
  assertFirstOptimizationArtifactCommitBlockerClosure(source);
  assertSourceLocusImplementationClosure(source);
  assertSourceOwnerMapDraftReadinessClosure(source);
  assertPacketManifestDraftClosure(source);
  assertMetricSampleDraftClosure(source);
  assertFixtureProvenanceDraftClosure(source);
  assertNoWorkPreservationDraftClosure(source);
  assertSideEffectBudgetDraftClosure(source);
  assertDiagnosticPrivacyDraftClosure(source);
  assertParityRolloutDraftClosure(source);
  assertVerificationOutputDraftClosure(source);
  assertContentFilterFieldEffectRouteSurfaceClosure(source);
  assertSettingsRefreshDirtyKeyConsumerClosure(source);
  assertSettingsRefreshDirtyKeyProducerClosure(source);
  assertSettingsRefreshProducerConsumerJoinClosure(source);
  assertSettingsRefreshOptimizationReadinessContinuation(source);
  assertSettingsRefreshOptimizationCandidateBindingContinuation(source);
  assertSettingsRefreshOptimizationCandidateEvidenceContinuation(source);
  assertSettingsRefreshFanoutMetricSampleLinkageContinuation(source);
  assertWhitelistCacheSpaMetricPacketContinuation(source);
  assertWhitelistCacheSpaInstalledByteParityContinuation(source);
  assertWhitelistCacheSpaRouteModeMatrixContinuation(source);
  assertWhitelistCacheSpaWorkBudgetContinuation(source);
  assertWhitelistCacheSpaPendingCacheContinuation(source);
  assertWhitelistCacheSpaSettingsBehaviorContinuation(source);
  assertWhitelistCacheSpaJsonRolloutContinuation(source);
  assertWhitelistCacheSpaPacketExpansionClosure(source);
  assertContentFilterRouteSurfaceNoWorkBudgetContinuation(source);
  assertReleaseHotPathProofStackAddendum(source);
});

test('audit_completion_gap_register_derives_every_objective_term_into_a_closed_gate', () => {
  const source = doc();

  for (const term of [
    'Every feature',
    'Every file',
    'Every method',
    'Every JSON path',
    'Every DOM selector',
    'Every observer/listener/timer/frame/patch',
    'Every settings mode',
    'Every cross-feature interaction',
    'Reliability risks',
    'False-hide risks',
    'Leak risks',
    'Performance risks',
    'Code-burden risks',
    'Implementation-change boundary'
  ]) {
    assert.ok(source.includes(`| ${term} |`), `missing completion row for ${term}`);
  }

  const closedRows = source.match(/\| closed \|/g) || [];
  assert.equal(closedRows.length, 14);
});

test('audit_completion_gap_register_lists_required_evidence_classes', () => {
  const source = doc();
  const layoutDoc = read('docs/audit/FILTERTUBE_AUDIT_DOC_LAYOUT_CURRENT_BEHAVIOR_2026-05-24.md');
  const lifecycleDoc = read('docs/audit/FILTERTUBE_REPO_LIFECYCLE_PRIMITIVE_COVERAGE_2026-05-18.md');
  const runtimeResults = read(runtimeResultsPath);
  const runtimeTestIndex = read(runtimeTestIndexPath);
  const stats = runtimeFixtureIndexStats();
  const auditLayoutStats = currentAuditDocLayoutStats();
  const provenanceStats = runtimeTestProvenanceIndexStats();
  const provenanceDriftStats = runtimeTestProvenanceDriftStats();
  const missingLeadTokenStats = runtimeMissingLeadTokenStats();
  const jsonFamilyStats = runtimeJsonFamilyStats();
  const contentFamilyStats = runtimeContentFamilyStats();
  const backgroundFamilyStats = runtimePrefixFamilyStats('background', backgroundRuntimeFamily);
  const websiteFamilyStats = runtimePrefixFamilyStats('website', websiteRuntimeFamily);
  const seedFamilyStats = runtimePrefixFamilyStats('seed', seedRuntimeFamily);
  const domFamilyStats = runtimePrefixFamilyStats('dom', domRuntimeFamily);
  const filterFamilyStats = runtimePrefixFamilyStats('filter', filterRuntimeFamily);
  const identityFamilyStats = runtimePrefixFamilyStats('identity', identityRuntimeFamily);
  const settingsFamilyStats = runtimePrefixFamilyStats('settings', settingsRuntimeFamily);
  const bridgeFamilyStats = runtimePrefixFamilyStats('bridge', bridgeRuntimeFamily);
  const extensionFamilyStats = runtimePrefixFamilyStats('extension', extensionRuntimeFamily);
  const learnedFamilyStats = runtimePrefixFamilyStats('learned', learnedRuntimeFamily);
  const nanahFamilyStats = runtimePrefixFamilyStats('nanah', nanahRuntimeFamily);
  const nativeFamilyStats = runtimePrefixFamilyStats('native', nativeRuntimeFamily);
  const quickFamilyStats = runtimePrefixFamilyStats('quick', quickRuntimeFamily);
  const sourceFamilyStats = runtimePrefixFamilyStats('source', sourceRuntimeFamily);
  const stateFamilyStats = runtimePrefixFamilyStats('state', stateRuntimeFamily);
  const uiFamilyStats = runtimePrefixFamilyStats('ui', uiRuntimeFamily);
  const backupFamilyStats = runtimePrefixFamilyStats('backup', backupRuntimeFamily);
  const buildFamilyStats = runtimePrefixFamilyStats('build', buildRuntimeFamily);
  const collabFamilyStats = runtimePrefixFamilyStats('collab', collabRuntimeFamily);
  const compiledFamilyStats = runtimePrefixFamilyStats('compiled', compiledRuntimeFamily);
  const generatedFamilyStats = runtimePrefixFamilyStats('generated', generatedRuntimeFamily);
  const ignoredFamilyStats = runtimePrefixFamilyStats('ignored', ignoredRuntimeFamily);
  const injectorFamilyStats = runtimePrefixFamilyStats('injector', injectorRuntimeFamily);
  const legacyFamilyStats = runtimePrefixFamilyStats('legacy', legacyRuntimeFamily);
  const mainFamilyStats = runtimePrefixFamilyStats('main', mainRuntimeFamily);
  const p0FamilyStats = runtimePrefixFamilyStats('p0', p0RuntimeFamily);
  const popupFamilyStats = runtimePrefixFamilyStats('popup', popupRuntimeFamily);
  const promptFamilyStats = runtimePrefixFamilyStats('prompt', promptRuntimeFamily);
  const releaseFamilyStats = runtimePrefixFamilyStats('release', releaseRuntimeFamily);
  const rootFamilyStats = runtimePrefixFamilyStats('root', rootRuntimeFamily);
  const securityFamilyStats = runtimePrefixFamilyStats('security', securityRuntimeFamily);
  const staticFamilyStats = runtimePrefixFamilyStats('static', staticRuntimeFamily);
  const storageFamilyStats = runtimePrefixFamilyStats('storage', storageRuntimeFamily);
  const tabFamilyStats = runtimePrefixFamilyStats('tab', tabRuntimeFamily);
  const trackedFamilyStats = runtimePrefixFamilyStats('tracked', trackedRuntimeFamily);
  const videoFamilyStats = runtimePrefixFamilyStats('video', videoRuntimeFamily);
  const watchFamilyStats = runtimePrefixFamilyStats('watch', watchRuntimeFamily);
  const activeFamilyStats = runtimePrefixFamilyStats('active', activeRuntimeFamily);
  const addFamilyStats = runtimePrefixFamilyStats('add', addRuntimeFamily);
  const aliasFamilyStats = runtimePrefixFamilyStats('alias', aliasRuntimeFamily);
  const batchFamilyStats = runtimePrefixFamilyStats('batch', batchRuntimeFamily);
  const blockFamilyStats = runtimePrefixFamilyStats('block', blockRuntimeFamily);
  const browserFamilyStats = runtimePrefixFamilyStats('browser', browserRuntimeFamily);

  for (const phrase of [
    'Positive and negative fixtures',
    'Behavior, release, quarantine, asset-budget, or audit-layout proof',
    'audit-layout proof',
    'Owner, caller class, trigger',
    'Every documented path classified',
    'Surface, route, action, target, owner',
    'Install trigger, active predicate, disabled/no-rule cost',
    'per-file primitive footprint',
    'Profile type, viewing space, lock state, list mode',
    'End-to-end authority records',
    'Counters for zero parse, zero clone, zero rewrite, zero scan',
    'Package/support/provenance cleanup separated from behavior-carrying paths',
    'Recent Layout And Lifecycle Proof Addendum',
    'docs/audit/FILTERTUBE_AUDIT_DOC_LAYOUT_CURRENT_BEHAVIOR_2026-05-24.md',
    'tests/runtime/audit-doc-layout-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_REPO_LIFECYCLE_PRIMITIVE_COVERAGE_2026-05-18.md',
    'tests/runtime/repo-lifecycle-primitive-coverage-current-behavior.test.mjs',
    '0 root-level `FILTERTUBE_*.md`',
    'files under plain `docs/`',
    '63 per-file primitive footprint rows',
    'Runtime Fixture Index Completeness Addendum',
    'FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
    'top-level `tests/runtime/*.test.mjs` files',
    '3 top-level runtime test file without exact',
    'tests/runtime/change-safety-goal-requirement-audit-current-behavior.test.mjs',
    'file-level provenance gap',
    'runtime-results exact-row drift remains open',
    'JSON-first provenance remains exact-row complete for indexed JSON-family files',
    '`tests/runtime/content*.test.mjs` files',
    'Content-runtime bridge and control provenance is now',
    '`tests/runtime/background*.test.mjs` files',
    '`tests/runtime/website*.test.mjs` files',
    '`tests/runtime/seed*.test.mjs` files',
    '`tests/runtime/dom*.test.mjs` files',
    '`tests/runtime/filter*.test.mjs` files',
    '`tests/runtime/identity*.test.mjs` files',
    '`tests/runtime/settings*.test.mjs` files',
    '`tests/runtime/bridge*.test.mjs` files',
    '`tests/runtime/extension*.test.mjs` files',
    '`tests/runtime/learned*.test.mjs` files',
    '`tests/runtime/nanah*.test.mjs` files',
    '`tests/runtime/native*.test.mjs` files',
    '`tests/runtime/quick*.test.mjs` files',
    '`tests/runtime/source*.test.mjs` files',
    '`tests/runtime/state*.test.mjs` files',
    '`tests/runtime/ui*.test.mjs` files',
    '`tests/runtime/backup*.test.mjs` files',
    '`tests/runtime/build*.test.mjs` files',
    '`tests/runtime/collab*.test.mjs` files',
    '`tests/runtime/compiled*.test.mjs` files',
    '`tests/runtime/generated*.test.mjs` files',
    '`tests/runtime/ignored*.test.mjs` files',
    '`tests/runtime/injector*.test.mjs` files',
    '`tests/runtime/legacy*.test.mjs` files',
    '`tests/runtime/main*.test.mjs` files',
    '`tests/runtime/p0*.test.mjs` files',
    '`tests/runtime/popup*.test.mjs` files',
    '`tests/runtime/prompt*.test.mjs` files',
    '`tests/runtime/release*.test.mjs` files',
    '`tests/runtime/root*.test.mjs` files',
    '`tests/runtime/security*.test.mjs` files',
    '`tests/runtime/static*.test.mjs` files',
    '`tests/runtime/storage*.test.mjs` files',
    '`tests/runtime/tab*.test.mjs` files',
    '`tests/runtime/tracked*.test.mjs` files',
    '`tests/runtime/video*.test.mjs` files',
    '`tests/runtime/watch*.test.mjs` files',
    '`tests/runtime/active*.test.mjs` files',
    '`tests/runtime/add*.test.mjs` file',
    '`tests/runtime/alias*.test.mjs` file',
    '`tests/runtime/batch*.test.mjs` file',
    '`tests/runtime/block*.test.mjs` file',
    '`tests/runtime/browser*.test.mjs` file',
    'remaining tail',
    'complete semantic coverage evidence',
    'not behavior safety or',
    'optimization readiness'
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const sourceTestStats = currentRuntimeTestSourceStats();
  for (const phrase of [
    `${auditLayoutStats.auditFilterTubeDocs} \`docs/audit/FILTERTUBE_*.md\``,
    `${sourceTestStats.files.length} current top-level \`tests/runtime/*.test.mjs\` files`,
    `${sourceTestStats.declarations} live source top-level test declarations`,
    `${stats.exactBackticked} exact backticked test-path entries`,
    `${provenanceStats.rows} runtime test file rows`,
    `${provenanceStats.declarations} source top-level test declarations`,
    `${provenanceStats.noRows} \`no\` rows`,
    `${stats.missingExactBackticked} top-level runtime test file without exact backticked entries`
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.deepEqual(stats, {
    testFiles: sourceTestStats.files.length,
    exactBackticked: 537,
    missingExactBackticked: 3
  });
  assert.equal(provenanceStats.rows, 537);
  assert.equal(provenanceStats.yesRows, 537);
  assert.equal(provenanceStats.noRows, 0);
  assert.equal(provenanceStats.declarations, 4731);
  assert.deepEqual(provenanceDriftStats.missingFiles, [
    'tests/runtime/change-safety-goal-requirement-audit-current-behavior.test.mjs',
    'tests/runtime/managed-parent-authority-inventory-current-behavior.test.mjs',
    'tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs'
  ]);
  assert.deepEqual(provenanceDriftStats.staleRows, []);
  assert.deepEqual(provenanceDriftStats.countMismatches, [
    {
      file: 'tests/runtime/audit-runtime-backlog-current-behavior.test.mjs',
      indexed: 3,
      current: 4
    },
    {
      file: 'tests/runtime/content-bridge-collaborator-main-world-merge-mutation-current-behavior.test.mjs',
      indexed: 11,
      current: 15
    }
  ]);
  assert.deepEqual(missingLeadTokenStats, {
    groupCount: 0,
    top: [],
    topTotal: 0,
    remainder: 0
  });

  const familySnapshots = [
    jsonFamilyStats, contentFamilyStats, backgroundFamilyStats, websiteFamilyStats,
    seedFamilyStats, domFamilyStats, filterFamilyStats, identityFamilyStats,
    settingsFamilyStats, bridgeFamilyStats, extensionFamilyStats, learnedFamilyStats,
    nanahFamilyStats, nativeFamilyStats, quickFamilyStats, sourceFamilyStats,
    stateFamilyStats, uiFamilyStats, backupFamilyStats, buildFamilyStats,
    collabFamilyStats, compiledFamilyStats, generatedFamilyStats, ignoredFamilyStats,
    injectorFamilyStats, legacyFamilyStats, mainFamilyStats, p0FamilyStats,
    popupFamilyStats, promptFamilyStats, releaseFamilyStats, rootFamilyStats,
    securityFamilyStats, staticFamilyStats, storageFamilyStats, tabFamilyStats,
    trackedFamilyStats, videoFamilyStats, watchFamilyStats, activeFamilyStats,
    addFamilyStats, aliasFamilyStats, batchFamilyStats, blockFamilyStats,
    browserFamilyStats
  ];
  for (const snapshot of familySnapshots) {
    assert.equal(snapshot.no, 0);
    assert.equal(snapshot.yes, snapshot.files);
    assert.ok(snapshot.files > 0);
    assert.ok(snapshot.tests > 0);
  }
  assert.match(layoutDoc, /current root FilterTube audit docs: 0/);
  assert.match(layoutDoc, new RegExp(`current docs/audit FilterTube audit docs: ${auditLayoutStats.auditFilterTubeDocs}`));
  assert.match(lifecycleDoc, /Per-file primitive footprint rows: 69/);
  for (const text of [runtimeResults]) {
    assert.match(text, /Runtime Fixture Index Completeness/);
    assert.match(text, /JSON Runtime-Test Exact Row Backfill/);
    assert.match(text, /Content Runtime-Test Exact Row Backfill/);
    assert.match(text, /Background Runtime-Test Exact Row Backfill/);
    assert.match(text, /Website Runtime-Test Exact Row Backfill/);
    assert.match(text, /Seed Runtime-Test Exact Row Backfill/);
    assert.match(text, /DOM Runtime-Test Exact Row Backfill/);
    assert.match(text, /Filter Runtime-Test Exact Row Backfill/);
    assert.match(text, /Identity Runtime-Test Exact Row Backfill/);
    assert.match(text, /Settings Runtime-Test Exact Row Backfill/);
    assert.match(text, /Bridge Runtime-Test Exact Row Backfill/);
    assert.match(text, /Extension Runtime-Test Exact Row Backfill/);
    assert.match(text, /Learned Identity Runtime-Test Exact Row Backfill/);
    assert.match(text, /Nanah Runtime-Test Exact Row Backfill/);
    assert.match(text, /Native Runtime-Test Exact Row Backfill/);
    assert.match(text, /Quick Block Runtime-Test Exact Row Backfill/);
    assert.match(text, /Source Runtime-Test Exact Row Backfill/);
    assert.match(text, /State Manager Runtime-Test Exact Row Backfill/);
    assert.match(text, /UI Runtime-Test Exact Row Backfill/);
    assert.match(text, /Backup Runtime-Test Exact Row Backfill/);
    assert.match(text, /Build Runtime-Test Exact Row Backfill/);
    assert.match(text, /Collab Runtime-Test Exact Row Backfill/);
    assert.match(text, /Compiled Settings Runtime-Test Exact Row Backfill/);
    assert.match(text, /Generated Runtime-Test Exact Row Backfill/);
    assert.match(text, /Ignored Output Runtime-Test Exact Row Backfill/);
    assert.match(text, /Injector Runtime-Test Exact Row Backfill/);
    assert.match(text, /Legacy Layout Runtime-Test Exact Row Backfill/);
    assert.match(text, /Main Runtime-Test Exact Row Backfill/);
    assert.match(text, /P0 Runtime-Test Exact Row Backfill/);
    assert.match(text, /Popup Runtime-Test Exact Row Backfill/);
    assert.match(text, /Prompt Runtime-Test Exact Row Backfill/);
    assert.match(text, /Release Runtime-Test Exact Row Backfill/);
    assert.match(text, /Root Runtime-Test Exact Row Backfill/);
    assert.match(text, /Security Runtime-Test Exact Row Backfill/);
    assert.match(text, /Static Runtime-Test Exact Row Backfill/);
    assert.match(text, /Storage Runtime-Test Exact Row Backfill/);
    assert.match(text, /Tab View Runtime-Test Exact Row Backfill/);
    assert.match(text, /Tracked File Runtime-Test Exact Row Backfill/);
    assert.match(text, /Video Runtime-Test Exact Row Backfill/);
    assert.match(text, /Watch Runtime-Test Exact Row Backfill/);
    assert.match(text, /Active Runtime-Test Exact Row Backfill/);
    assert.match(text, /Add Filtered Channel Runtime-Test Exact Row Backfill/);
    assert.match(text, /Alias Runtime-Test Exact Row Backfill/);
    assert.match(text, /Batch Runtime-Test Exact Row Backfill/);
    assert.match(text, /Block Channel Runtime-Test Exact Row Backfill/);
    assert.match(text, /Browser Runtime-Test Exact Row Backfill/);
    assert.match(text, /Remaining Tail Runtime-Test Exact Row Backfill/);
    assert.match(text, /top-level `tests\/runtime\/\*\.test\.mjs` files/);
    assert.match(text, /537/);
    assert.match(text, /537 exact backticked test-path/);
    assert.match(text, /0 top-level runtime test files without exact backticked entries/);
    assert.match(text, /generated per-test provenance rows: 537/);
    assert.match(text, /source top-level test declarations counted by generated index: 4731/);
    assert.match(text, /complete semantic\s+coverage evidence/);
  }
  assert.match(runtimeTestIndex, /Status: audit-only generated current-behavior index/);
  assert.match(runtimeTestIndex, /top-level runtime test files: 537/);
  assert.match(runtimeTestIndex, /indexed runtime test rows: 537/);
  assert.match(runtimeTestIndex, /source top-level test declarations counted: 4731/);
  assert.match(runtimeTestIndex, /Full Runtime Freshness Boundary - 2026-06-01/);
  assert.match(runtimeTestIndex, /latest broad runtime audit command: npm run audit:runtime/);
  assert.match(runtimeTestIndex, /latest broad runtime audit tests: 4731/);
  assert.match(runtimeTestIndex, /latest broad runtime audit pass: 4580/);
  assert.match(runtimeTestIndex, /latest broad runtime audit fail: 151/);
  assert.match(runtimeTestIndex, /fresh full runtime exit status for 4731 declaration set: nonzero/);
  assert.match(runtimeTestIndex, /current full runtime proof for generated 4731 declaration set: NO-GO/);
  assert.match(runtimeTestIndex, /runtime results exact backticked test-path rows: 537/);
  assert.match(runtimeTestIndex, /runtime results missing exact backticked test-path rows: 0/);
  assert.match(runtimeTestIndex, /This is file-level provenance proof only/);
  assert.match(runtimeTestIndex, /This snapshot closes the file-level runtime-test provenance gap/);
  assert.equal(missingLeadTokenStats.groupCount, 0);
  assert.equal(missingLeadTokenStats.top.length, 0);
  assert.equal(missingLeadTokenStats.remainder, 0);
  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assertIndexSummary = (title, familyStats) => {
    assert.match(runtimeTestIndex, new RegExp(escapeRegex(title)));
    assert.equal(familyStats.no, 0);
    for (const [family, counts] of familyStats.families) {
      assert.match(runtimeTestIndex, new RegExp(`\| ${escapeRegex(family)} \| ${counts.files} \| ${counts.tests} \| ${counts.yes} \| ${counts.no} \|`));
    }
  };

  for (const [title, familyStats] of [
    ['Quick Block Runtime-Test Family Snapshot', quickFamilyStats],
    ['Source Runtime-Test Family Snapshot', sourceFamilyStats],
    ['State Manager Runtime-Test Family Snapshot', stateFamilyStats],
    ['UI Runtime-Test Family Snapshot', uiFamilyStats],
    ['Backup Runtime-Test Family Snapshot', backupFamilyStats],
    ['Build Runtime-Test Family Snapshot', buildFamilyStats],
    ['Collab Runtime-Test Family Snapshot', collabFamilyStats],
    ['Compiled Settings Runtime-Test Family Snapshot', compiledFamilyStats],
    ['Generated Runtime-Test Family Snapshot', generatedFamilyStats],
    ['Ignored Output Runtime-Test Family Snapshot', ignoredFamilyStats],
    ['Injector Runtime-Test Family Snapshot', injectorFamilyStats],
    ['Legacy Layout Runtime-Test Family Snapshot', legacyFamilyStats],
    ['Main Runtime-Test Family Snapshot', mainFamilyStats],
    ['P0 Runtime-Test Family Snapshot', p0FamilyStats],
    ['Popup Runtime-Test Family Snapshot', popupFamilyStats],
    ['Prompt Runtime-Test Family Snapshot', promptFamilyStats],
    ['Release Runtime-Test Family Snapshot', releaseFamilyStats],
    ['Root Runtime-Test Family Snapshot', rootFamilyStats],
    ['Security Runtime-Test Family Snapshot', securityFamilyStats],
    ['Static Runtime-Test Family Snapshot', staticFamilyStats],
    ['Storage Runtime-Test Family Snapshot', storageFamilyStats],
    ['Tab View Runtime-Test Family Snapshot', tabFamilyStats],
    ['Tracked File Runtime-Test Family Snapshot', trackedFamilyStats],
    ['Video Runtime-Test Family Snapshot', videoFamilyStats],
    ['Watch Runtime-Test Family Snapshot', watchFamilyStats],
    ['Active Runtime-Test Family Snapshot', activeFamilyStats],
    ['Add Filtered Channel Runtime-Test Family Snapshot', addFamilyStats],
    ['Alias Runtime-Test Family Snapshot', aliasFamilyStats],
    ['Batch Runtime-Test Family Snapshot', batchFamilyStats],
    ['Block Channel Runtime-Test Family Snapshot', blockFamilyStats],
    ['Browser Runtime-Test Family Snapshot', browserFamilyStats]
  ]) {
    assertIndexSummary(title, familyStats);
  }
  assert.match(runtimeTestIndex, /Remaining Tail Runtime-Test Family Snapshot/);
  assert.match(runtimeTestIndex, /runtime test files with/);
  assert.match(runtimeTestIndex, /have exact runtime-results ledger entries and 0 do not/);});

test('audit_completion_gap_register_pins_identity_waterfall_over_old_four_step_shorthand', () => {
  const source = doc();

  assert.match(source, /The four-step identity shorthand is not enough/);
  assert.match(source, /channelMap \/ videoChannelMap \/ videoMetaMap/);
  assert.match(source, /DOM extraction and video-id joins/);
  assert.match(source, /background watch \/ Shorts \/ Kids \/ channel resolver/);
  assert.match(source, /XHR JSON is the preferred evidence tier when it carries the needed fields/);
  assert.match(source, /not an authority by itself/);
  assert.match(source, /not proof that every visible YouTube\s+card has full channel identity before render/);
  assert.match(source, /video id can be only a\s+join key/);
  assert.match(source, /Learned maps can be\s+`joinedByVideoId`/);
});

test('audit_completion_gap_register_blocks_implementation_categories', () => {
  const source = doc();
  const releaseRegression = read(releaseRegressionPath);
  const readinessGate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  for (const blocker of [
    'Changing JSON filtering behavior',
    'Deleting, broadening, or moving DOM fallback behavior',
    'Changing empty whitelist or empty blocklist semantics',
    'Introducing simultaneous allow/block data migration',
    'Trusting learned maps more strongly without provenance/confidence',
    'Removing watch, Shorts, Kids, or channel background resolvers',
    'Changing message sender trust behavior',
    'Changing lifecycle teardown, fullscreen, native-overlay, menu, or quick-block gates',
    'Publishing release, website, extension, Android, iOS, TV, Kids, or sync claims without artifact proof'
  ]) {
    assert.ok(source.includes(blocker), `missing blocker ${blocker}`);
  }

  assert.match(source, /2026-05-30 hot SPA lifecycle current-source rerun/);
  assert.match(source, /Focused proof passed 70\/70 with 0 failures in 10\.7s/);
  assert.match(source, /Lifecycle cleanup\/pruning approval, route\/surface no-work budget authority,\s+JSON-first promotion, whitelist optimization, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /2026-05-30 timer immediate\/short surface ownership continuation/);
  assert.match(source, /pins 50 immediate\/short\s+timer surface rows, 7 surface classes, 33 YouTube SPA content runtime rows, 5\s+extension dashboard UI rows, 2 extension popup UI rows, 3 content prompt\s+overlay rows/);
  assert.match(source, /Immediate\/short timer surface cleanup approval, timer\s+delay changes, route teardown, native\/menu timing authority, whitelist\/cache\s+optimization, JSON-first first-class promotion, and release\/public-claim use\s+remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA immediate\/short predicate crosswalk continuation/);
  assert.match(source, /pins 33\s+YouTube SPA immediate\/short predicate crosswalk rows, 7 predicate classes, 12\s+direct user-action gated rows, 6 bootstrap\/readiness gated rows, 5 DOM\s+fallback inherited rows, 4 eager surface-gated rows/);
  assert.match(source, /YouTube\s+SPA immediate\/short predicate crosswalk cleanup approval, timer delay changes,\s+route teardown, native\/menu timing authority, whitelist\/cache optimization,\s+JSON-first first-class promotion, and release\/public-claim use remain\s+`NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA eager hot timer candidate continuation/);
  assert.match(source, /pins 4 YouTube SPA eager\s+hot timer rows, 2 candidate classes, 3 fallback menu eager hot timer rows, 1\s+quick-block eager sweep hot timer row, 4 rule-list independent YouTube SPA\s+eager hot timer rows/);
  assert.match(source, /YouTube SPA eager hot timer cleanup approval, timer delay changes,\s+route teardown, native\/menu timing authority, quick-block affordance changes,\s+whitelist\/cache optimization, JSON-first first-class promotion, and\s+release\/public-claim use remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA eager hot timer route admission continuation/);
  assert.match(source, /pins 4 YouTube SPA eager hot timer\s+route admission rows, 3 fallback menu mobile\/coarse route-admitted hot timer\s+rows, 1 quick-block mobile\/coarse route-admitted hot timer row/);
  assert.match(source, /0\s+source-admitted desktop hover\/fine eager hot timer rows, 4 rule-list\s+independent YouTube SPA eager hot timer rows, no shared eager surface\s+classifier/);
  assert.match(source, /YouTube\s+SPA eager hot timer route admission cleanup approval, timer delay changes,\s+route teardown, native\/menu timing authority, quick-block affordance changes,\s+whitelist\/cache optimization, JSON-first first-class promotion, and\s+release\/public-claim use remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop hover\/fine residual hot timer continuation/);
  assert.match(source, /pins 29 YouTube SPA\s+desktop hover\/fine residual hot timer rows, 6 residual predicate classes, 12\s+direct user-action gated rows, 6 bootstrap\/readiness gated rows, 5 DOM\s+fallback inherited rows/);
  assert.match(source, /2 explicit list-mode route-gated rows, 2 page-global\s+user-input gated rows, 2 storage dirty-state gated rows, 0 residual\s+eager-surface gated rows/);
  assert.match(source, /YouTube SPA desktop hover\/fine residual cleanup approval,\s+timer delay changes, route teardown, native\/menu timing authority, quick-block\s+affordance changes, whitelist\/cache optimization, JSON-first first-class\s+promotion, and release\/public-claim use remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop direct user-action hot timer continuation/);
  assert.match(source, /pins\s+12 YouTube SPA desktop direct user-action hot timer rows, 12 `setTimeout`\s+rows, 4 `content_bridge` rows, 4 `block_channel` rows, 4 `dom_fallback` rows,\s+3 native dropdown injection rows, 2 block-action menu close rows,\s+4 watch playlist navigation rows/);
  assert.match(source, /1 quick-block fallback rerun row,\s+1 fallback row feedback row, 1 native focus-release row/);
  assert.match(source, /YouTube SPA desktop direct\s+user-action cleanup approval, native\/menu timing rewrites, timer delay\s+changes, menu close rewrites, playlist navigation rewrites, quick-block\s+fallback rewrites, whitelist\/cache optimization, JSON-first first-class\s+promotion, and release\/public-claim use remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop startup\/readiness hot timer continuation/);
  assert.match(source, /pins 6 YouTube SPA desktop\s+startup\/readiness hot timer rows, 5 `setTimeout` rows, 1 `setInterval` row,\s+1 content bridge startup row, 2 bridge injection rows, 2 quick\/menu body\s+readiness rows, 1 injector readiness poll row/);
  assert.match(source, /YouTube SPA desktop\s+startup\/readiness cleanup approval, timer delay changes, route teardown,\s+native\/menu timing authority, bridge injection changes, whitelist\/cache\s+optimization, JSON-first first-class promotion, and release\/public-claim use\s+remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop DOM-fallback inherited hot timer continuation/);
  assert.match(source, /pins 5 YouTube SPA desktop\s+DOM-fallback inherited hot timer rows, 5 `setTimeout` rows,\s+3 `content_bridge` rows, 2 `dom_fallback` rows, 2 collaborator rerun rows,\s+1 identity stamp rerun row, 1 active yield row, 1 pending rerun row/);
  assert.match(source, /YouTube SPA\s+desktop DOM-fallback inherited cleanup approval, timer delay changes, route\s+teardown, collaborator rerun changes, identity-stamp rerun changes,\s+whitelist\/cache optimization, JSON-first first-class promotion, and\s+release\/public-claim use remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop storage dirty-state hot timer continuation/);
  assert.match(source, /pins 2 YouTube SPA desktop\s+storage dirty-state hot timer rows, 2 `setTimeout` rows, 2 `filter_logic`\s+rows, 1 `videoChannelMap` flush row, 1 `videoMetaMap` flush row, 2 bridge\s+message consumers/);
  assert.match(source, /YouTube SPA desktop storage dirty-state cleanup approval, timer\s+delay changes, route teardown, map freshness rewrites, bridge message\s+rewrites, whitelist\/cache optimization, JSON-first first-class promotion, and\s+release\/public-claim use remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop explicit list-mode route hot timer continuation/);
  assert.match(source, /pins\s+2 YouTube SPA desktop explicit list-mode route hot timer rows,\s+2 `setTimeout` rows, 1 immediate refresh row, 1 follow-up refresh row,\s+2 `content_bridge` rows, 2 force-reprocess rows/);
  assert.match(source, /YouTube SPA desktop\s+explicit list-mode route cleanup approval, timer delay changes, route\s+teardown, whitelist refresh rewrites, DOM fallback pruning, whitelist\/cache\s+optimization, JSON-first first-class promotion, and release\/public-claim use\s+remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop page-global quick-block refresh hot timer\s+continuation/);
  assert.match(source, /pins\s+2 YouTube SPA desktop page-global quick-block refresh hot timer rows,\s+2 `setTimeout` rows, 1 focusout refresh row, 1 click refresh row,\s+2 runtime refresh rows/);
  assert.match(source, /YouTube SPA desktop page-global quick-block\s+refresh cleanup approval, timer delay changes, route teardown, quick-block\s+refresh rewrites, native\/menu timing rewrites, whitelist\/cache optimization,\s+JSON-first first-class promotion, and release\/public-claim use remain\s+`NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA desktop residual hot timer class-closure continuation/);
  assert.match(source, /pins 29 YouTube SPA desktop residual class-closure hot timer rows,\s+6 predicate classes, 6 source files, 12 direct user-action rows,\s+6 startup\/readiness rows, 5 DOM-fallback inherited rows,\s+2 storage dirty-state rows, 2 page-global quick-block rows,\s+2 explicit list-mode route rows/);
  assert.match(source, /10 `content_bridge` rows,\s+8 `block_channel` rows, 6 `dom_fallback` rows, 2 `bridge_injection` rows,\s+2 `filter_logic` rows, 1 `injector` row/);
  assert.match(source, /YouTube SPA desktop residual class-closure\s+cleanup approval, timer delay changes, owner merges, route teardown,\s+native\/menu timing rewrites, whitelist\/cache optimization, JSON-first\s+first-class promotion, and release\/public-claim use remain `NO-GO`/);
  assert.match(source, /2026-05-30 YouTube SPA runtime optimization boundary continuation/);
  assert.match(source, /pins 8 YouTube\s+SPA runtime optimization boundary rows, 33 classified YouTube SPA hot timer\s+lifecycle rows, 29 classified desktop residual lifecycle rows,\s+4 classified mobile\/coarse eager lifecycle rows/);
  assert.match(source, /0 implementation-ready\s+YouTube SPA runtime optimization rows, and source-derived ASCII\/Mermaid\s+runtime optimization boundary diagrams/);
  assert.match(source, /Runtime YouTube SPA optimization\s+patch approval, whitelist cache optimization approval, JSON-first promotion,\s+timer cleanup, observer\/listener cleanup, DOM fallback pruning, quick-block\s+behavior changes, native menu timing changes, and release\/public-claim use\s+remain `NO-GO`/);
  assert.match(source, /2026-05-30 store-feedback engagement\/end-screen linkage/);
  assert.match(source, /blocked topics may worsen\s+recommendations, and blocked videos can leak into the end-screen video wall/);
  assert.match(source, /This is not a YouTube ranking proof/);
  assert.match(source, /direct `endScreenVideoRenderer` JSON rows are supported/);
  assert.match(source, /compact\/autoplay\s+renderers and player DOM wall\/card overlays remain under-proven/);
  assert.match(source, /observable\s+fetch\/click\/scroll\/pause\/stop paths still lack shared owner, route, rule,\s+user-action, dedupe, and max-per-navigation budgets/);
  assert.match(source, /End-screen behavior\s+changes, engagement-side-effect pruning, JSON-first promotion, whitelist\s+optimization, release\/public-claim use, and broad-audit completion remain\s+`NO-GO`/);
  assert.match(source, /2026-05-31 store-feedback readiness gate linkage/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_WATCH_ENDSCREEN_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_DIRECT_WATCH_CARD_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.match(source, /direct and nested\s+`endScreenVideoRenderer` JSON rows are source-supported, but\s+`compactAutoplayRenderer`, endpoint-only `autoplayVideo`\/`nextButtonVideo`\/\s+`previousButtonVideo`, direct watch-card child rows, player DOM wall\/card\s+overlays, direct identity fetches, synthetic playlist\/player clicks, media\s+pause\/stop paths, and recommendation-observable side effects still lack one\s+shared authority/);
  assert.match(source, /End-screen behavior changes, recommendation side-effect\s+pruning, JSON-first promotion, whitelist\/cache optimization, DOM fallback\s+pruning, release\/public-claim use, and broad-audit completion remain `NO-GO`/);
  assert.match(source, /runtime behavior changed by this linkage: no/);
  assert.match(readinessGate, /Store feedback engagement\/end-screen readiness boundary - 2026-05-31/);
  assert.match(readinessGate, /user\/store feedback about recommendation degradation and\s+end-screen video-wall leaks into the global implementation gate/);
  assert.match(source, /2026-05-30 watch recommendation renderer topology continuation/);
  assert.match(source, /direct watch-card, compact autoplay, lockup, and end-screen\s+recommendation paths into one audit-only topology/);
  assert.match(source, /`compactVideoRenderer`, `watchCardCompactVideoRenderer`,\s+`endScreenVideoRenderer`, `lockupViewModel`, and the\s+`universalWatchCardRenderer` title\/channel wrapper/);
  assert.match(source, /direct `watchCardRichHeaderRenderer`, direct\s+`watchCardHeroVideoRenderer`, direct `watchCardRHPanelVideoRenderer`,\s+`compactAutoplayRenderer`, and the real universal hero\s+`navigationEndpoint\.watchEndpoint\.videoId` path/);
  assert.match(source, /JSON-first\s+promotion, whitelist optimization, DOM fallback pruning, recommendation\s+side-effect pruning, release\/public-claim use, and broad-audit completion\s+remain `NO-GO`/);
  assert.match(source, /`watchRecommendationRendererAuthority` proves renderer\s+family, direct-versus-wrapper source, route, endpoint, identity confidence,\s+video-id path policy, blocklist result, whitelist result, sibling visibility,\s+side-effect budget, and no-rule work budget/);
  assert.match(source, /2026-05-30 watch\/player route convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/watch-player-control-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 8 watch\/player convergence rows, 0 implementation-ready\s+watch\/player convergence rows/);
  assert.match(source, /UI\/settings\/cache split proof, content refresh\s+compensation proof, `\/next` endpoint-policy gaps, `\/player` metadata-only\s+gaps, comment continuation\/scaffold split proof, recommendation renderer\s+topology gaps, selected-row side-effect gaps, whitelist\/fullscreen no-work\s+gaps/);
  assert.match(source, /source-derived ASCII\/Mermaid route convergence diagrams/);
  assert.match(source, /Route-scoped\s+`\/next` optimization, metadata-only `\/player` optimization, selected-row\s+JSON-first promotion, watch whitelist\/fullscreen no-work approval,\s+recommendation renderer generalization, whitelist\/cache optimization,\s+JSON-first first-class promotion, and release\/public-claim use remain\s+`NO-GO`/);
  assert.match(source, /2026-05-30 storage\/cache key convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_STORAGE_KEY_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/storage-key-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 10 storage\/cache convergence rows, 0 implementation-ready\s+storage\/cache convergence rows/);
  assert.match(source, /compiler\/invalidation drift proof, content\s+bridge map-only refresh proof, force-reprocess coalescing proof, StateManager\s+reload drift proof, shared settings load proof, background map dirty-state\s+proof, profile\/import\/Nanah revision gaps, stats dashboard reload gaps,\s+settings-refresh evidence packet gaps, whitelist-cache hot-path gaps/);
  assert.match(source, /source-derived ASCII\/Mermaid convergence diagrams/);
  assert.match(source, /Map-only pruning,\s+compiled-cache invalidation changes, broad whitelist\/cache optimization,\s+JSON-first first-class promotion, settings-refresh collector insertion,\s+release\/public-claim use, and runtime behavior changes remain `NO-GO`/);
  assert.match(source, /2026-05-30 message side-effect convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/message-side-effect-register-current-behavior.test.mjs'));
  assert.match(source, /pins 10 message side-effect convergence rows, 0\s+implementation-ready message side-effect convergence rows/);
  assert.match(source, /background receiver\s+trust split proof, settings cache broadcast proof, refresh\/DOM rerun broadcast\s+proof, page-world request ownership gaps, learned identity write gaps, rule\s+mutation storage\/backup\/refresh gaps, stats storage gaps, script\/tab\/network\s+authority gaps, import\/Nanah\/backup trust gaps, negative spoof fixture gaps/);
  assert.match(source, /source-derived ASCII\/Mermaid convergence diagrams/);
  assert.match(source, /Message trust\s+hardening, rule mutation optimization, storage\/cache optimization,\s+JSON-first first-class promotion, release\/public-claim use, and runtime\s+behavior changes remain `NO-GO`/);
  assert.match(source, /2026-05-30 rule mutation convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/rule-mutation-entrypoint-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 10 rule mutation convergence rows, 0 implementation-ready\s+rule mutation convergence rows/);
  assert.match(source, /StateManager mode-inferred row gaps,\s+background sender split gaps, quick\/menu action payload gaps, Filter All\s+comment-scope gaps, list-mode transfer copy-policy gaps, batch whitelist\s+import mode gaps, managed child direct-write gaps, import\/Nanah apply gaps,\s+storage\/cache\/backup\/refresh fanout gaps, learned identity rule-input gaps/);
  assert.match(source, /source-derived ASCII\/Mermaid convergence diagrams/);
  assert.match(source, /Rule mutation\s+implementation, blocklist\/whitelist mutation optimization, quick\/menu\s+rewrites, Filter All optimization, import\/Nanah mutation optimization,\s+storage\/cache optimization from rule mutation, JSON-first first-class\s+promotion, release\/public-claim use, and runtime behavior changes remain\s+`NO-GO`/);
  assert.match(source, /YTM ShowSheet JSON-First Parity Continuation/);
  assert.match(source, /2026-05-30 YTM showSheet injector\/filter-logic central-ledger linkage/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/ytm-show-sheet-injector-filter-logic-parity-current-behavior.test.mjs'));
  assert.match(source, /cross-owner JSON-first gap/);
  assert.match(source, /captured `showSheetCommand\.sheetViewModel` collaborators Shakira, Spotify,\s+and Beele/);
  assert.match(source, /`js\/filter_logic\.js` still has 0 `showSheetCommand` tokens/);
  assert.match(source, /display byline `Shakira and 2 more`/);
  assert.match(source, /Matching collaborator\s+channel blocklist rules therefore leak the row/);
  assert.match(source, /matching collaborator\s+channel whitelist rules false-hide the row/);
  assert.match(source, /Shared collaborator extraction,\s+snapshot-to-filter candidate parity, YTM blocklist parity, YTM whitelist parity,\s+side-effect\/no-work budgets, JSON-first promotion, release\/public-claim use,\s+and broad-audit completion remain `NO-GO`/);
  assert.match(source, /runtime behavior changed by this\s+continuation: no/);
  assert.match(releaseRegression, /2026-05-30 Hot SPA Lifecycle Current-Source Rerun/);
  assert.match(releaseRegression, /focused lifecycle proof result: 70\/70 pass, 0 fail, 10\.7s/);
  assert.match(releaseRegression, /new standalone audit file created: no/);
  assert.match(releaseRegression, /lifecycle cleanup or pruning approval from this rerun: NO-GO/);
});

test('audit_completion_gap_register_has_no_runtime_authority_symbol_yet', () => {
  const source = doc();
  assert.match(source, /No shared runtime authority exists yet/);
  assert.match(source, /This document is a current audit register, not a runtime decision system/);

  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js'
  ].map(read).join('\n');

  assert.doesNotMatch(runtime, /auditCompletionAuthority/);
  assert.doesNotMatch(runtime, /completeProofAuthority/);
  assert.doesNotMatch(runtime, /implementationGateOpen/);
});

test('reference_docs_do_not_reintroduce_old_proactive_xhr_instant_blocking_claim', () => {
  const source = [
    read('docs/CHANNEL_BLOCKING_SYSTEM.md'),
    read('docs/PROACTIVE_CHANNEL_IDENTITY.md')
  ].join('\n');

  assert.doesNotMatch(source, /proactive, XHR-first/i);
  assert.doesNotMatch(source, /minimizing network calls and ensuring instant blocking/i);
  assert.match(source, /JSON-first identity strategy/);
  assert.match(source, /not a guarantee\s+that identity exists before DOM render/);
  assert.match(source, /videoId` as a join key/);
  assert.match(source, /Last resort; not globally budgeted yet/);
});

test('audit completion gap register records runtime lifecycle convergence without closing the goal', () => {
  const source = doc();
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');
  const readinessDoc = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  assert.match(source, /2026-05-30 runtime lifecycle convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(source, /pins 10 runtime lifecycle\s+convergence rows, 0 implementation-ready runtime lifecycle convergence rows,\s+524 tracked lifecycle primitive instances, 469 install-or-schedule rows,\s+55 explicit teardown rows, 16 hot YouTube SPA lifecycle owner rows, 33\s+YouTube SPA immediate\/short hot timer rows/);
  assert.match(source, /primitive\/listener\/observer\/timer\s+surface proof, mode\/surface budget proof, teardown\/effect-budget proof,\s+menu\/overlay timing proof, method\/JSON dependency proof, authority absence\s+proof, and source-derived ASCII\/Mermaid convergence diagrams/);
  assert.match(source, /Runtime\s+lifecycle cleanup, route teardown, listener removal, observer disconnect\s+changes, timer\/frame cancellation changes, native-overlay pause rewrites,\s+whitelist\/cache optimization, JSON-first first-class promotion,\s+release\/public-claim use, and broad-audit completion remain `NO-GO`/);
  assert.match(source, /runtime\s+behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /runtime lifecycle convergence rows: 10/);
  assert.match(lifecycleDoc, /implementation-ready runtime lifecycle convergence rows: 0/);
  assert.match(lifecycleDoc, /runtime lifecycle cleanup approval: NO-GO/);
  assert.match(readinessDoc, /Runtime lifecycle convergence boundary - 2026-05-30/);
});

test('audit completion gap register records content-filter route surface convergence without closing the goal', () => {
  const source = doc();
  const routeDoc = read(contentFilterFieldEffectRouteSurfacePath);
  const noWorkDoc = read(contentFilterRouteSurfaceNoWorkBudgetPath);
  const readinessDoc = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const diagnosticDoc = read('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md');
  const installedDoc = read('docs/audit/FILTERTUBE_INSTALLED_CHROME_UNPACKED_PATH_PARITY_CURRENT_BEHAVIOR_2026-05-30.md');
  const visibleInstalledTabParity = read('docs/audit/FILTERTUBE_VISIBLE_INSTALLED_TAB_BYTE_PARITY_PREFLIGHT_CURRENT_BEHAVIOR_2026-05-31.md');

  assert.match(source, /2026-05-30 content-filter route\/surface convergence continuation/);
  assert.ok(source.includes(contentFilterFieldEffectRouteSurfacePath));
  assert.ok(source.includes(contentFilterRouteSurfaceNoWorkBudgetPath));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs'));
  assert.match(source, /joins field semantics, field-effect manifests, JSON renderer\s+content\/category decisions, metadata fetch side effects, DOM fallback\s+route\/surface effects, watch selected-row risks, whitelist pending-hide\s+no-work gates, comment exclusions, YTM\/Kids\/native parity gaps, and missing\s+no-work artifacts into one implementation-gate convergence boundary/);
  assert.match(source, /pins 10 content-filter route\/surface convergence rows,\s+12 field-effect route\/surface rows, 12 no-work budget rows, 9 route\/surface\s+classes, 7 cheap no-work gate families, and 6 known over-work gap families/);
  assert.match(source, /implementation-ready content-filter convergence rows 0, runtime\s+content-filter convergence approvals 0/);
  assert.match(source, /product-source absence for\s+`contentFilterRouteSurfaceConvergenceAuthority`,\s+`contentFilterRouteSurfaceConvergenceReport`, and\s+`contentFilterRouteSurfaceNoWorkBudget`/);
  assert.match(source, /JSON-first\s+content-filter authority, DOM fallback deletion, metadata fetch pruning,\s+watch\/YTM\/Kids parity, whitelist\/cache optimization, release\/public-claim use,\s+and runtime behavior changes at `NO-GO`/);
  assert.match(routeDoc, /Content-Filter Route\/Surface Convergence Boundary - 2026-05-30/);
  assert.match(routeDoc, /content-filter route\/surface convergence rows: 10/);
  assert.match(noWorkDoc, /Content-Filter Convergence Handoff/);
  assert.match(noWorkDoc, /runtime content-filter convergence approvals: 0/);
  assert.match(readinessDoc, /Content-filter route\/surface convergence boundary - 2026-05-30/);
  assert.match(source, /2026-05-30 diagnostic logging convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs'));
  assert.match(source, /extend the gap register from diagnostic source-flow proof into one audit-only\s+diagnostic logging convergence boundary/);
  assert.match(source, /pins 10 diagnostic logging convergence rows, 21 diagnostic\s+logging policy source files, 419 active console callsites, 9 diagnostic\s+source-flow rows/);
  assert.match(source, /source-derived ASCII\/Mermaid convergence diagrams, and 0\s+implementation-ready diagnostic logging convergence rows/);
  assert.match(source, /joins console\s+inventory, hot runtime file cost, level split, relay\/direct console paths,\s+identity privacy exposure, JSON decision diagnostics, no-work logging budget/);
  assert.match(source, /Diagnostic logging cleanup, diagnostic metric replacement, privacy\/redaction\s+promotion, whitelist\/cache optimization, JSON-first first-class promotion,\s+release\/public-claim use, and broad-audit completion remain `NO-GO`/);
  assert.match(source, /runtime\s+behavior changed by this continuation: no/);
  assert.match(source, /2026-05-31 production console gate coverage reconciliation/);
  assert.match(source, /extend the gap register from diagnostic logging convergence into exact\s+production-console gate owner coverage/);
  assert.match(source, /pins 3 runtime console\s+gate owner files \(`js\/background\.js`, `js\/content\/dom_fallback\.js`, and\s+`js\/content_bridge\.js`\)/);
  assert.match(source, /background `log\/debug\/info` gating, isolated-world DOM\s+fallback `log\/debug\/info` gating, content-bridge backup `log\/debug` gating/);
  assert.match(source, /no `warn\/error` suppression, no MAIN-world global console override, no\s+extension-UI cleanup approval, no live installed-tab console sampling proof/);
  assert.match(source, /route\/mode console budgets,\s+whitelist\/cache optimization, JSON-first first-class promotion,\s+release\/public-claim use, and broad-audit completion remain `NO-GO`/);
  assert.match(source, /runtime\s+behavior changed by this reconciliation: no/);
  assert.match(source, /2026-05-31 production console residual hot-path preflight/);
  assert.match(source, /extend the gap register from source-order gate owner coverage into a residual\s+hot-path preflight that separates textual console callsites from execution-time\s+production console work/);
  assert.match(source, /preflight pins 7 residual rows, 210 selected\s+routine `log\/debug\/info` token rows, 126 textual content-bridge routine rows/);
  assert.match(source, /1 content-bridge top-level executed routine\s+row before that backup gate, 124 content-bridge function-body rows that execute\s+through post-install entrypoints/);
  assert.match(source, /62 background routine rows behind the startup\s+gate, 135 manifest-isolated routine rows behind the `dom_fallback` gate, 7\s+MAIN-world local-debug rows, and 6 extension-UI\/inactive-layout rows outside\s+the YouTube hot path/);
  assert.match(source, /Live installed-tab console sampling, route\/mode console\s+budgets, release cleanup, whitelist\/cache optimization, JSON-first first-class\s+promotion, release\/public-claim use, and broad-audit completion remain\s+`NO-GO`/);
  assert.match(source, /runtime behavior changed by this preflight: no/);
  assert.match(diagnosticDoc, /Diagnostic Logging Convergence Boundary - 2026-05-30/);
  assert.match(diagnosticDoc, /Production Console Gate Coverage Reconciliation - 2026-05-31/);
  assert.match(diagnosticDoc, /Production Console Residual Hot-Path Preflight - 2026-05-31/);
  assert.match(diagnosticDoc, /Connected Chrome Console Sampling Precondition Recheck - 2026-05-31/);
  assert.match(diagnosticDoc, /implementation-ready diagnostic logging convergence rows: 0/);
  assert.match(readinessDoc, /Diagnostic logging convergence boundary - 2026-05-30/);
  assert.match(readinessDoc, /Production console gate coverage reconciliation - 2026-05-31/);
  assert.match(readinessDoc, /Production console residual hot-path preflight - 2026-05-31/);
  assert.match(source, /2026-05-31 installed Chrome unpacked path parity gate linkage/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_INSTALLED_CHROME_UNPACKED_PATH_PARITY_CURRENT_BEHAVIOR_2026-05-30.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.match(source, /extend the gap register from installed-profile evidence into the global\s+implementation gate without treating path ownership as live injected-byte\s+proof/);
  assert.match(source, /pins extension id `gkgjigdfdccckblmglboobikfcpeelio`,\s+Chrome Default profile source path `\/Users\/devanshvarshney\/FilterTube`,\s+matching workspace root/);
  assert.match(source, /no CRX-style copy under `Default\/Extensions`,\s+Default-profile local extension storage presence, service worker version\s+`3\.3\.2`, and `incognito: null`/);
  assert.match(source, /Default-profile source-path owner status is\s+`GO_PATH`, but already-open visible-tab injected byte freshness, incognito\s+runtime availability, stale open-tab cache cleanup, live `Kully B & Gussy G -\s+Topic` negative fixture proof, live smoke acceptance, release\/public-claim use,\s+and broad-audit completion remain `NO-GO`/);
  assert.match(source, /runtime behavior changed by this\s+linkage: no/);

  assert.match(installedDoc, /Status: audit-only current-state proof\. Runtime behavior changed: no/);
  assert.match(installedDoc, /"path": "\/Users\/devanshvarshney\/FilterTube"/);
  assert.match(installedDoc, /"from_webstore": false/);
  assert.match(installedDoc, /"version": "3\.3\.2"/);
  assert.match(installedDoc, /"incognito": null/);
  assert.match(installedDoc, /installed_default_profile_unpacked_path/);
  assert.match(installedDoc, /workspace_path_match/);
  assert.match(installedDoc, /packed_copy_exclusion/);
  assert.match(installedDoc, /default_profile_storage_presence/);
  assert.match(installedDoc, /NO_GO_INCOGNITO/);
  assert.match(installedDoc, /NO_GO_VISIBLE_TAB/);
  assert.match(installedDoc, /NO_GO_LIVE_FIXTURE/);
  assert.match(readinessDoc, /Installed Chrome unpacked path parity boundary - 2026-05-31/);
  assert.match(source, /2026-05-31 visible installed-tab byte parity preflight boundary/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_VISIBLE_INSTALLED_TAB_BYTE_PARITY_PREFLIGHT_CURRENT_BEHAVIOR_2026-05-31.md'));
  assert.match(source, /extend the gap register from installed path ownership into the exact\s+visible-tab byte\/reload evidence contract/);
  assert.match(source, /pins the Chrome runtime\s+parity set to 17 unique files across service worker, MAIN declarative content\s+script, ISOLATED declarative content scripts, and MAIN web-accessible\/injected\s+resources/);
  assert.match(source, /requires future evidence for Default-profile target ownership,\s+active YouTube URL, extension id\/path\/version, `js\/background\.js` service\s+worker hash, every content\/runtime entrypoint hash or equivalent marker/);
  assert.match(source, /MAIN\/ISOLATED runtime injection markers, reload timestamp, stale open-tab\s+status, incognito split, and automation-profile exclusion/);
  assert.match(source, /Installed path\s+ownership remains `GO_PATH`, but visible-tab byte parity, service-worker reload\s+freshness, stale open-tab proof, incognito availability, release\/public-claim\s+use, and broad-audit completion remain `NO-GO`/);
  assert.match(source, /runtime behavior changed by\s+this preflight: no/);
  assert.match(visibleInstalledTabParity, /Default Secure Preferences path proof/);
  assert.match(visibleInstalledTabParity, /manifest runtime parity set known/);
  assert.match(visibleInstalledTabParity, /visible tab still needs active bytes and reload timestamp/);
  assert.match(visibleInstalledTabParity, /release\/use claim remains NO-GO/);
  assert.match(visibleInstalledTabParity, /automation-profile exclusion/);
  assert.match(readinessDoc, /Visible installed-tab byte parity preflight boundary - 2026-05-31/);
  assert.match(source, /2026-05-31 connected Chrome tab inventory recheck boundary/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.match(source, /record a read-only connected-Chrome inventory recheck/);
  assert.match(source, /reachable and reported 45 open top-level tabs, but 0 relevant\s+YouTube\/FilterTube targets/);
  assert.match(source, /committed no raw unrelated tab titles or\s+URLs, claimed no tab, performed no navigation\/reload\/storage mutation/);
  assert.match(source, /ran no\s+live smoke runner, wrote no installed-byte artifact, and collected no\s+production console runtime sample/);
  assert.match(source, /visible installed-tab byte parity, six-row SPA smoke, console\s+sampling, release\/public-claim use, and broad-audit completion remain\s+`NO-GO`/);
  assert.match(source, /runtime behavior changed by this recheck: no/);
  assert.match(visibleInstalledTabParity, /Connected Chrome Tab Inventory Recheck - 2026-05-31/);
  assert.match(visibleInstalledTabParity, /connected open top-level tabs observed: 45/);
  assert.match(visibleInstalledTabParity, /connected relevant YouTube\/FilterTube tabs observed: 0/);
  assert.match(readinessDoc, /Connected Chrome tab inventory recheck boundary - 2026-05-31/);
});
