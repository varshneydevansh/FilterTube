import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md';
const readinessDocPath = 'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25.md';
const sourceLocusDocPath = 'docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md';
const pendingDocPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const pendingTestPath = 'tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs';

const sourceInputs = [
  pendingDocPath,
  pendingTestPath,
  'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
  sourceLocusDocPath
];

const expectedRows = [
  'FT-WLPENDING-INTAKE-00-owner',
  'FT-WLPENDING-INTAKE-01-native-overlay',
  'FT-WLPENDING-INTAKE-02-list-mode',
  'FT-WLPENDING-INTAKE-03-empty-whitelist',
  'FT-WLPENDING-INTAKE-04-route-exclusion',
  'FT-WLPENDING-INTAKE-05-remove-only',
  'FT-WLPENDING-INTAKE-06-resource-only',
  'FT-WLPENDING-INTAKE-07-nested-card',
  'FT-WLPENDING-INTAKE-08-candidate-cap',
  'FT-WLPENDING-INTAKE-09-timer-parity',
  'FT-WLPENDING-INTAKE-10-apply-parity',
  'FT-WLPENDING-INTAKE-11-proof-boundary'
];

const futureSymbols = [
  'whitelistPendingIntakeNoWorkContract',
  'shouldRunWhitelistPendingIntake',
  'whitelistPendingIntakeDecision',
  'whitelistPendingIntakeBudgetReport',
  'whitelistPendingIntakeRouteDecision',
  'whitelistPendingIntakeMutationDecision',
  'whitelistPendingIntakeMetricArtifact',
  'whitelistPendingIntakeRollbackGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end: ${endNeedle}`);
  return text.slice(start, end);
}

function lineOfAfter(file, anchorNeedle, needle) {
  const text = read(file);
  const anchorIndex = text.indexOf(anchorNeedle);
  assert.notEqual(anchorIndex, -1, `missing anchor: ${anchorNeedle}`);
  const index = text.indexOf(needle, anchorIndex);
  assert.notEqual(index, -1, `missing needle after anchor: ${needle}`);
  return text.slice(0, index).split(/\r?\n/).length;
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('whitelist pending intake no-work contract is audit-only and source-backed', () => {
  const doc = read(docPath);
  const readinessDoc = read(readinessDocPath);
  const sourceLocusDoc = read(sourceLocusDocPath);

  assert.match(doc, /Status: current-behavior contract with the narrow pending-intake runtime patch/);
  assert.match(doc, /narrow runtime behavior changed: yes/);
  assert.match(doc, /not a broad whitelist behavior patch/);
  assert.match(doc, /not completion proof for whitelist optimization readiness/);
  assert.match(readinessDoc, /Status: implementation-readiness gate with the narrow pending-intake runtime\s+patch implemented/);
  assert.match(readinessDoc, /narrow runtime behavior changed: yes/);
  assert.match(readinessDoc, /not a broad whitelist behavior patch/);
  assert.match(readinessDoc, /narrow runtime whitelist pending intake patch in this audit slice: GO/);
  assert.match(sourceLocusDoc, /Status: source-locus boundary with the narrow runtime patch implemented/);
  assert.match(sourceLocusDoc, /narrow runtime behavior changed: yes/);
  assert.match(sourceLocusDoc, /not a selector scope expansion/);
  assert.match(sourceLocusDoc, /narrow runtime whitelist pending intake patch in this audit slice: GO/);

  for (const sourceInput of sourceInputs) {
    assert.ok(doc.includes(sourceInput), `missing source input ${sourceInput}`);
    assert.ok(readinessDoc.includes(sourceInput), `missing readiness source input ${sourceInput}`);
    assert.ok(fs.existsSync(path.join(repoRoot, sourceInput)), `source input missing on disk ${sourceInput}`);
  }
  assert.ok(fs.existsSync(path.join(repoRoot, readinessDocPath)), `readiness doc missing on disk ${readinessDocPath}`);
  assert.ok(fs.existsSync(path.join(repoRoot, sourceLocusDocPath)), `source locus doc missing on disk ${sourceLocusDocPath}`);

  assert.match(doc, /queue intake now rejects mode and route exclusions before selector traversal/);
  assert.match(doc, /nested containers avoid querySelector and querySelectorAll on rejected no-op gates/);
  assert.match(doc, /candidate-cap exhaustion now rejects before nested containers/);
  assert.match(readinessDoc, /narrow implementation packet is defined enough to prepare: GO/);
  assert.match(readinessDoc, /narrow implementation-ready whitelist pending intake rows: 1/);
  assert.match(sourceLocusDoc, /narrow whitelist pending-intake source locus identified: GO/);
  assert.match(sourceLocusDoc, /runtime source file families allowed for narrow patch: 1/);
  assert.match(sourceLocusDoc, /allowed runtime file: js\/content_bridge\.js/);
});

test('whitelist pending intake contract rows and counts stay pinned', () => {
  const doc = read(docPath);
  const readinessDoc = read(readinessDocPath);
  const sourceLocusDoc = read(sourceLocusDocPath);
  const rows = [...doc.matchAll(/^\| `(FT-WLPENDING-INTAKE-[^`]+)` \|/gm)].map((match) => match[1]);
  const readinessRows = [...readinessDoc.matchAll(/^\| `(FT-WLPENDING-READY-[^`]+)` \|/gm)].map((match) => match[1]);
  const sourceLocusRows = [...sourceLocusDoc.matchAll(/^\| `(FT-WLPENDING-LOCUS-[^`]+)` \|/gm)].map((match) => match[1]);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.equal(readinessRows.length, 14);
  assert.deepEqual(readinessRows, [
    'FT-WLPENDING-READY-00-scope',
    'FT-WLPENDING-READY-01-owner',
    'FT-WLPENDING-READY-02-native-overlay',
    'FT-WLPENDING-READY-03-list-mode',
    'FT-WLPENDING-READY-04-route',
    'FT-WLPENDING-READY-05-remove-only',
    'FT-WLPENDING-READY-06-resource-only',
    'FT-WLPENDING-READY-07-cap',
    'FT-WLPENDING-READY-08-empty-whitelist',
    'FT-WLPENDING-READY-09-nested-discovery',
    'FT-WLPENDING-READY-10-timer-parity',
    'FT-WLPENDING-READY-11-apply-parity',
    'FT-WLPENDING-READY-12-fixtures',
    'FT-WLPENDING-READY-13-release'
  ]);
  assert.deepEqual(sourceLocusRows, [
    'FT-WLPENDING-LOCUS-00-file-owner',
    'FT-WLPENDING-LOCUS-01-queue-owner',
    'FT-WLPENDING-LOCUS-02-native-overlay',
    'FT-WLPENDING-LOCUS-03-list-mode',
    'FT-WLPENDING-LOCUS-04-route',
    'FT-WLPENDING-LOCUS-05-remove-only',
    'FT-WLPENDING-LOCUS-06-resource-only',
    'FT-WLPENDING-LOCUS-07-candidate-cap',
    'FT-WLPENDING-LOCUS-08-nested-discovery',
    'FT-WLPENDING-LOCUS-09-timer',
    'FT-WLPENDING-LOCUS-10-apply-parity',
    'FT-WLPENDING-LOCUS-11-non-touch'
  ]);
  assert.equal(sourceLocusRows.length, 12);
  assert.match(doc, /whitelist pending intake no-work contract rows: 12/);
  assert.match(readinessDoc, /whitelist pending intake implementation readiness rows: 14/);
  assert.match(readinessDoc, /source inputs covered: 8/);
  assert.match(sourceLocusDoc, /whitelist pending intake patch source-locus rows: 12/);
  assert.match(sourceLocusDoc, /runtime source file families allowed for narrow patch: 1/);
  assert.match(sourceLocusDoc, /read-only parity runtime source loci: 4/);
  assert.match(sourceLocusDoc, /forbidden runtime source families: 8/);
  assert.match(sourceLocusDoc, /narrow semantic-change approval rows: 1/);
  assert.match(readinessDoc, /required future no-work fixture names covered: 10/);
  assert.match(sourceLocusDoc, /required future no-work fixture names covered: 10/);
  assert.match(doc, /release whitelist-pending intake gate rows covered: 10/);
  assert.match(doc, /runtime content bridge whitelist pending refresh fixtures covered: 9/);
  assert.match(readinessDoc, /runtime content bridge whitelist pending refresh fixtures covered: 9/);
  assert.match(sourceLocusDoc, /runtime content bridge whitelist pending refresh fixtures covered: 9/);
  assert.match(doc, /narrow implementation-ready whitelist pending intake rows: 1/);
  assert.match(readinessDoc, /narrow implementation-ready whitelist pending intake rows: 1/);
  assert.match(sourceLocusDoc, /narrow implementation-ready whitelist pending intake rows: 1/);
  assert.match(doc, /runtime whitelist pending intake authority symbols: 0/);
  assert.match(readinessDoc, /implemented runtime authority symbols: 0/);
  assert.match(doc, /narrow runtime behavior changed: yes/);
  assert.match(readinessDoc, /narrow runtime behavior changed: yes/);
  assert.match(sourceLocusDoc, /narrow runtime behavior changed: yes/);
  assert.match(readinessDoc, /release patch approval: NO-GO/);
  assert.match(sourceLocusDoc, /patch source locus approval: GO/);
});

test('current source proves mode and route gates now run before queue collection', () => {
  const contentBridge = read('js/content_bridge.js');
  const sourceLocusDoc = read(sourceLocusDocPath);
  const queueBlock = sliceBetween(
    contentBridge,
    '        function queueWhitelistPendingHide(mutations, delayMs = 40) {',
    '        function applyWhitelistPendingHide(candidates) {'
  );
  const applyBlock = sliceBetween(
    contentBridge,
    '        function applyWhitelistPendingHide(candidates) {',
    '        function fallbackRelevantSelector() {'
  );
  const observerBlock = sliceBetween(
    contentBridge,
    '        function fallbackRelevantSelector() {',
    '        refreshFilterTubeRuntimeObservers();'
  );

  assert.match(queueBlock, /node\.querySelector\?\.\(VIDEO_CARD_SELECTORS\)/);
  assert.match(queueBlock, /node\.querySelectorAll\?\.\(VIDEO_CARD_SELECTORS\)/);
  assert.match(queueBlock, /currentSettings\?\.listMode !== 'whitelist'/);
  assert.match(queueBlock, /const path = document\.location\?\.pathname \|\| ''/);
  assert.match(queueBlock, /path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)/);
  assert.ok(
    queueBlock.indexOf("currentSettings?.listMode !== 'whitelist'") <
    queueBlock.indexOf('node.querySelector?.(VIDEO_CARD_SELECTORS)'),
    'list mode gate must precede selector traversal'
  );
  assert.ok(
    queueBlock.indexOf("path === '/'") <
    queueBlock.indexOf('node.querySelector?.(VIDEO_CARD_SELECTORS)'),
    'route gate must precede selector traversal'
  );

  assert.match(applyBlock, /const listMode = currentSettings\?\.listMode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(applyBlock, /if \(listMode !== 'whitelist'\) return/);
  assert.match(applyBlock, /path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)/);

  assert.match(observerBlock, /const mutationSummary = fallbackMutationSummary\(mutations\)/);
  assert.match(observerBlock, /if \(mutationSummary\.hasAddedNodes\) \{/);
  assert.match(observerBlock, /queueWhitelistPendingHide\(mutations\)/);

  for (const line of [
    lineOfAfter('js/content_bridge.js', 'async function initializeDOMFallback(settings) {', 'const WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT = 160;'),
    lineOfAfter('js/content_bridge.js', 'async function initializeDOMFallback(settings) {', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {'),
    lineOfAfter('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', 'if (isFilterTubeNativeOverlayQuietMode() || isFilterTubeManagedViewingRouteDenied()) return;'),
    lineOfAfter('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', "if (currentSettings?.listMode !== 'whitelist') return;"),
    lineOfAfter('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', "const path = document.location?.pathname || '';"),
    lineOfAfter('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', 'if (whitelistPendingRefreshState.pendingHideCandidates.length >= WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT) return;'),
    lineOfAfter('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', 'if (node.matches?.(VIDEO_CARD_SELECTORS)) return queueCandidate(node);'),
    lineOfAfter('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', 'if (!node.querySelector?.(VIDEO_CARD_SELECTORS)) return;'),
    lineOfAfter('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', 'const nested = node.querySelectorAll?.(VIDEO_CARD_SELECTORS) || [];'),
    lineOfAfter('js/content_bridge.js', 'async function initializeDOMFallback(settings) {', 'function applyWhitelistPendingHide(candidates) {'),
    lineOfAfter('js/content_bridge.js', 'function applyWhitelistPendingHide(candidates) {', "if (listMode !== 'whitelist') return;"),
    lineOfAfter('js/content_bridge.js', 'function applyWhitelistPendingHide(candidates) {', "const path = document.location?.pathname || '';"),
    lineOfAfter('js/content_bridge.js', 'async function initializeDOMFallback(settings) {', 'function fallbackMutationSummary(mutations) {'),
    lineOfAfter('js/content_bridge.js', 'const observer = new MutationObserver(mutations => {', 'queueWhitelistPendingHide(mutations);')
  ]) {
    assert.ok(sourceLocusDoc.includes(`js/content_bridge.js:${line}`), `source locus doc missing current line ${line}`);
  }
});

test('current executable proof covers nested no-op and cap traversal risks', () => {
  const pendingDoc = read(pendingDocPath);
  const pendingTest = read(pendingTestPath);

  assert.match(pendingDoc, /runtime content bridge whitelist pending refresh fixtures: 9/);
  assert.match(pendingDoc, /Nested added containers now avoid `querySelector\(\)` and `querySelectorAll\(\)`/);
  assert.match(pendingDoc, /A full pending-hide candidate queue now returns before nested traversal/);
  assert.match(pendingTest, /blocklistModeRejectsBeforeSelectorTraversal/);
  assert.match(pendingTest, /fullCandidateQueueRejectsBeforeNestedTraversal/);
});

test('future fixture shape names the required release-patch checks', () => {
  const doc = read(docPath);
  const readinessDoc = read(readinessDocPath);
  const sourceLocusDoc = read(sourceLocusDocPath);

  for (const fixtureName of [
    'blocklistModeRejectsBeforeSelectorTraversal',
    'homeRouteRejectsBeforeSelectorTraversal',
    'searchRouteRejectsBeforeSelectorTraversal',
    'feedChannelsRouteRejectsBeforeSelectorTraversal',
    'watchRouteRejectsBeforeSelectorTraversal',
    'removeOnlyMutationsRejectBeforeQueue',
    'resourceOnlyAddedNodesRejectBeforeSelectorTraversal',
    'fullCandidateQueueRejectsBeforeNestedTraversal',
    'emptyWhitelistAdmittedRoutePreservesPendingHide',
    'whitelistRulesAdmittedRoutePreservesNestedDiscovery'
  ]) {
    assert.match(doc, new RegExp(`\\b${fixtureName}\\b`), `missing fixture ${fixtureName}`);
    assert.match(readinessDoc, new RegExp(`\\b${fixtureName}\\b`), `missing readiness fixture ${fixtureName}`);
    assert.match(sourceLocusDoc, new RegExp(`\\b${fixtureName}\\b`), `missing source locus fixture ${fixtureName}`);
  }
});

test('whitelist pending intake authority symbols remain absent from product runtime', () => {
  const doc = read(docPath);
  const readinessDoc = read(readinessDocPath);
  const sourceLocusDoc = read(sourceLocusDocPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /runtime whitelist pending intake patch now: GO/);
  assert.match(doc, /runtime whitelist optimization patch now: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);
  assert.match(readinessDoc, /prepare narrow whitelist pending-intake implementation patch: GO/);
  assert.match(readinessDoc, /narrow runtime whitelist pending intake patch in this audit slice: GO/);
  assert.match(readinessDoc, /cache behavior patch now: NO-GO/);
  assert.match(sourceLocusDoc, /define whitelist pending-intake patch source locus: GO/);
  assert.match(sourceLocusDoc, /patch source locus approval: GO/);
  assert.match(sourceLocusDoc, /DOM fallback behavior patch now: NO-GO/);
  assert.match(sourceLocusDoc, /narrow runtime whitelist pending intake patch in this audit slice: GO/);

  for (const symbol of futureSymbols) {
    assert.match(doc, new RegExp(`\\b${symbol}\\b`), `missing doc symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
  }
  for (const broadSymbol of [
    'whitelistOptimizationAuthority',
    'jsonFirstWhitelistAuthority',
    'whitelistPendingMetricArtifact',
    'releaseWhitelistApproval'
  ]) {
    assert.match(readinessDoc, new RegExp(`\\b${broadSymbol}\\b`), `missing readiness symbol ${broadSymbol}`);
    assert.equal(runtime.includes(broadSymbol), false, `${broadSymbol} unexpectedly exists in product runtime`);
  }
});
