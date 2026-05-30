import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FIXTURE_PROVENANCE_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-fixture-provenance-ownership-boundary-current-behavior.test.mjs';
const fixtureProvenancePath = 'docs/audit/artifacts/first-optimization/metric-foundation/fixture-provenance.json';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';
const sideEffectBudgetPath = 'docs/audit/artifacts/first-optimization/metric-foundation/side-effect-budget.json';
const noWorkPreservationPath = 'docs/audit/artifacts/first-optimization/metric-foundation/no-work-preservation.json';

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusFingerprint: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusTeardown: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_TEARDOWN_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusNoWork: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_NO_WORK_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceLocusSideEffect: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_SIDE_EFFECT_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  fixtureContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  traceability: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
  rawIndex: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
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
  'FT-SOURCE-LOCUS-FIXTURE-00-settings-scope',
  'FT-SOURCE-LOCUS-FIXTURE-01-fixture-audit-envelope',
  'FT-SOURCE-LOCUS-FIXTURE-02-transport-json',
  'FT-SOURCE-LOCUS-FIXTURE-03-filter-engine',
  'FT-SOURCE-LOCUS-FIXTURE-04-dom-fallback',
  'FT-SOURCE-LOCUS-FIXTURE-05-menu-quickblock',
  'FT-SOURCE-LOCUS-FIXTURE-06-network-resolver',
  'FT-SOURCE-LOCUS-FIXTURE-07-storage-map-mutation',
  'FT-SOURCE-LOCUS-FIXTURE-08-hide-restore-visual',
  'FT-SOURCE-LOCUS-FIXTURE-09-whitelist-policy',
  'FT-SOURCE-LOCUS-FIXTURE-10-diagnostic-privacy',
  'FT-SOURCE-LOCUS-FIXTURE-11-parity-release-verification'
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

const collectorFixtureRows = [
  'FT-COLLECTOR-FIXTURE-00-disabled-all-intercepts-provenance',
  'FT-COLLECTOR-FIXTURE-01-empty-blocklist-desktop-home-provenance',
  'FT-COLLECTOR-FIXTURE-02-empty-blocklist-mobile-home-provenance',
  'FT-COLLECTOR-FIXTURE-03-empty-blocklist-watch-player-provenance',
  'FT-COLLECTOR-FIXTURE-04-empty-blocklist-watch-next-provenance',
  'FT-COLLECTOR-FIXTURE-05-empty-blocklist-guide-provenance',
  'FT-COLLECTOR-FIXTURE-06-empty-whitelist-main-json-provenance',
  'FT-COLLECTOR-FIXTURE-07-nonempty-blocklist-core-routes-provenance',
  'FT-COLLECTOR-FIXTURE-08-nonempty-whitelist-unresolved-identity-provenance',
  'FT-COLLECTOR-FIXTURE-09-content-category-empty-values-provenance',
  'FT-COLLECTOR-FIXTURE-10-lifecycle-affordance-off-provenance',
  'FT-COLLECTOR-FIXTURE-11-diagnostic-measurement-budget-provenance'
];

const fixtureContractRows = [
  'FT-FIXTURE-PROVENANCE-00-packet-binding',
  'FT-FIXTURE-PROVENANCE-01-artifact-binding',
  'FT-FIXTURE-PROVENANCE-02-raw-source',
  'FT-FIXTURE-PROVENANCE-03-committed-fixture',
  'FT-FIXTURE-PROVENANCE-04-positive-fixture',
  'FT-FIXTURE-PROVENANCE-05-negative-sibling-fixture',
  'FT-FIXTURE-PROVENANCE-06-no-rule-disabled-empty',
  'FT-FIXTURE-PROVENANCE-07-json-dom-parity',
  'FT-FIXTURE-PROVENANCE-08-source-owner-coverage',
  'FT-FIXTURE-PROVENANCE-09-side-effect-no-work',
  'FT-FIXTURE-PROVENANCE-10-parity-rollout',
  'FT-FIXTURE-PROVENANCE-11-verification'
];

const fixtureFields = [
  'positiveFixture',
  'negativeSiblingFixture',
  'noRuleFixture',
  'disabledFixture',
  'emptyListFixture',
  'unrelatedSurfaceFixture',
  'domParityFixture',
  'nativeParityFixture'
];

const riskClasses = [
  'raw-source-provenance',
  'committed-fixture-scope',
  'positive-negative-sibling-proof',
  'no-rule-disabled-empty-proof',
  'json-dom-parity-proof',
  'source-owner-coverage',
  'side-effect-no-work-coupling',
  'native-release-public-rollout'
];

const fixtureAnchorFiles = [
  'tests/runtime/fixtures/captures/main-home-rich-video-renderer.json',
  'tests/runtime/fixtures/captures/main-watch-player-fragment-metadata.json',
  'tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json',
  'tests/runtime/fixtures/captures/main-guide-entry-renderer.json',
  'tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json',
  'tests/runtime/fixtures/captures/ytm-watch-player-dom.html',
  'tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html',
  'tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json'
];

const anchorChecks = [
  { file: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md', line: 12, needle: 'workspace currently has 47 ignored capture entries' },
  { file: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md', line: 13, needle: 'paths, 44 committed reduced fixture fragments' },
  { file: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md', line: 21, needle: 'no committed clean Main watch end-screen DOM wall fixture exists' },
  { file: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md', line: 22, needle: 'No literal `compactAutoplayRenderer` fragment has a committed fixture' },
  { file: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md', line: 49, needle: 'releaseInputAllowed: false' },
  { file: 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md', line: 55, needle: 'P0 capture fixture traceability is not implementation-ready' },
  { file: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md', line: 5, needle: 'Raw captures are evidence, not product source' },
  { file: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md', line: 7, needle: 'Loose substring matches are forbidden' },
  { file: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md', line: 14, needle: '47 ignored capture entries' },
  { file: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md', line: 15, needle: '46 unique ignored capture paths' },
  { file: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md', line: 16, needle: '45 present in this local workspace' },
  { file: 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md', line: 18, needle: 'releaseInputAllowed: false' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 41, needle: 'collector fixture provenance rows: 12' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 45, needle: 'required fixture/parity fields covered: 8' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md', line: 47, needle: 'unique raw capture obligation paths covered: 46' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 58, needle: 'first optimization fixture provenance contract rows: 12' },
  { file: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md', line: 59, needle: 'reserved fixture provenance paths covered: 1' },
  { file: 'tests/runtime/fixtures/captures/main-home-rich-video-renderer.json', line: 3, needle: '"source": "logs.json"' },
  { file: 'tests/runtime/fixtures/captures/main-watch-player-fragment-metadata.json', line: 4, needle: '"sourceSha256":' },
  { file: 'tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json', line: 3, needle: '"source": "YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json"' },
  { file: 'tests/runtime/fixtures/captures/main-guide-entry-renderer.json', line: 8, needle: '"route": "guide"' },
  { file: 'tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json', line: 4, needle: '"rendererType": "compactVideoRenderer"' },
  { file: 'tests/runtime/fixtures/captures/ytm-watch-player-dom.html', line: 4, needle: 'Raw shape: rendered mobile watch/player DOM after FilterTube mutation.' },
  { file: 'tests/runtime/fixtures/captures/main-collab-resolved-search-card-dialog.html', line: 15, needle: 'data-filtertube-collaborators=' },
  { file: 'tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json', line: 6, needle: '"reason": "minimal showSheetCommand collaborator roster with multiple UC browse IDs"' }
];

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusFixtureProvenanceBoundary',
  'firstOptimizationSourceLocusFixtureProvenanceReport',
  'sourceLocusFixtureProvenanceApproval',
  'sourceLocusFixtureOwnerApproval',
  'jsonFirstSourceLocusFixtureGate',
  'whitelistSourceLocusFixtureGate',
  'metricFoundationFixtureProvenanceAuthority',
  'runtimeSourceFixtureProvenanceMap',
  'sourceLocusFixtureProvenanceArtifact',
  'sourceLocusFixtureProvenancePacket',
  'runtimeFixtureProvenanceOptimizationAuthority',
  'sourceLocusFixtureTraceabilityReport'
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
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function productSource() {
  const files = [
    ...walk('js'),
    ...walk('scripts'),
    ...walk('website'),
    'build.js'
  ];
  return files
    .filter((file) => /\.(?:js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(file))
    .map((file) => fs.existsSync(path.join(repoRoot, file)) ? read(file) : '')
    .join('\n');
}

function fixtureFiles() {
  return walk('tests/runtime/fixtures/captures').sort();
}

test('source-locus fixture provenance ownership boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus\s+fixture provenance ownership boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is\s+not an implementation patch, optimization patch/);
  assert.match(doc, /This is fixture provenance ownership classification, not fixture provenance\s+approval/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus fixture provenance rows counts and corpus counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-FIXTURE-[^`]+)` \|/gm)].map((row) => row[1]);
  const fixtures = fixtureFiles();

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.equal(fixtures.length, 44);
  assert.equal(fixtures.filter((file) => file.endsWith('.json')).length, 33);
  assert.equal(fixtures.filter((file) => file.endsWith('.html')).length, 11);
  assert.match(doc, /source-locus fixture provenance boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /source-locus fingerprint rows covered: 12/);
  assert.match(doc, /source-locus teardown rows covered: 12/);
  assert.match(doc, /source-locus no-work rows covered: 12/);
  assert.match(doc, /source-locus side-effect rows covered: 12/);
  assert.match(doc, /collector fixture provenance rows covered: 12/);
  assert.match(doc, /fixture provenance contract rows covered: 12/);
  assert.match(doc, /P0 capture traceability rows covered: 11/);
  assert.match(doc, /unique raw capture obligation paths covered: 46/);
  assert.match(doc, /ignored raw capture entries covered: 47/);
  assert.match(doc, /present local raw capture paths covered: 45/);
  assert.match(doc, /committed reduced fixture fragments covered: 44/);
  assert.match(doc, /fixture corpus JSON files covered: 33/);
  assert.match(doc, /fixture corpus HTML files covered: 11/);
  assert.match(doc, /fixture provenance anchor files covered: 12/);
  assert.match(doc, /current fixture provenance anchors covered: 25/);
  assert.match(doc, /fixture provenance risk classes covered: 8/);
  assert.match(doc, /committed fixture provenance files: 0/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /committed side-effect budget files: 0/);
  assert.match(doc, /committed no-work preservation files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-locus fixture provenance rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const row of sourceLocusRows) assert.ok(doc.includes(row), `missing source-locus row ${row}`);
  for (const row of collectorFixtureRows) assert.ok(doc.includes(row), `missing collector fixture row ${row}`);
  for (const row of fixtureContractRows) assert.ok(doc.includes(row), `missing fixture contract row ${row}`);
  for (const field of fixtureFields) assert.ok(doc.includes(field), `missing fixture field ${field}`);
  for (const riskClass of riskClasses) assert.ok(doc.includes(riskClass), `missing risk class ${riskClass}`);
  for (const fixtureFile of fixtureAnchorFiles) assert.ok(doc.includes(fixtureFile), `missing fixture anchor file ${fixtureFile}`);
});

test('source-locus fixture provenance anchors resolve to current source and fixture text', () => {
  const doc = read(docPath);

  assert.equal(anchorChecks.length, 25);
  for (const anchor of anchorChecks) {
    assert.ok(doc.includes(`| \`${anchor.file}\` | ${anchor.line} |`), `doc missing anchor ${anchor.file}:${anchor.line}`);
    assert.ok(lineAt(anchor.file, anchor.line).includes(anchor.needle), `anchor ${anchor.file}:${anchor.line} no longer matches ${anchor.needle}`);
  }
});

test('source-locus fixture provenance boundary preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const sourceLocusSideEffect = read(sourceDocs.sourceLocusSideEffect);
  const fixtureMatrix = read(sourceDocs.fixtureMatrix);
  const fixtureContract = read(sourceDocs.fixtureContract);
  const traceability = read(sourceDocs.traceability);
  const rawIndex = read(sourceDocs.rawIndex);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.equal(fs.existsSync(path.join(repoRoot, fixtureProvenancePath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, sourceOwnerMapPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, sideEffectBudgetPath)), false);
  assert.equal(fs.existsSync(path.join(repoRoot, noWorkPreservationPath)), false);
  assert.match(sourceLocusSideEffect, /implementation-ready source-locus side-effect rows: 0/);
  assert.match(fixtureMatrix, /runtime collector fixture packets approved: 0/);
  assert.match(fixtureMatrix, /collector fixture provenance rows implementation-ready: 0/);
  assert.match(fixtureContract, /Committed fixture provenance files: 0/);
  assert.match(fixtureContract, /runtime metric collector approvals: 0/);
  assert.match(traceability, /P0 capture fixture traceability is not implementation-ready/);
  assert.match(rawIndex, /Raw captures are evidence, not product source/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(doc, /runtime source-owner approval now: NO-GO/);
  assert.match(doc, /commit fixture-provenance\.json now: NO-GO/);
  assert.match(doc, /runtime metric collector approval now: NO-GO/);
});

test('source-locus fixture provenance future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source-locus fixture provenance boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusCallable: sourceDocs.sourceLocusCallable,
    sourceLocusFingerprint: sourceDocs.sourceLocusFingerprint,
    sourceLocusTeardown: sourceDocs.sourceLocusTeardown,
    sourceLocusNoWork: sourceDocs.sourceLocusNoWork,
    sourceLocusSideEffect: sourceDocs.sourceLocusSideEffect,
    fixtureMatrix: sourceDocs.fixtureMatrix,
    fixtureContract: sourceDocs.fixtureContract,
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
