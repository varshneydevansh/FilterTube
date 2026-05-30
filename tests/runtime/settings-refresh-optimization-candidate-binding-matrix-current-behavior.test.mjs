import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
];

const bindingRows = [
  'FT-SRCB-00-scope',
  'FT-SRCB-01-applysettings-forced',
  'FT-SRCB-02-refreshnow-forced',
  'FT-SRCB-03-rule-ui-storage',
  'FT-SRCB-04-channelmap-only',
  'FT-SRCB-05-videochannelmap-only',
  'FT-SRCB-06-videometamap-targeted',
  'FT-SRCB-07-seed-no-json-clear',
  'FT-SRCB-08-seed-active-replay',
  'FT-SRCB-09-observer-menu-quick',
  'FT-SRCB-10-import-sync-profile',
  'FT-SRCB-11-diagnostic-rollout-binding'
];

const bindingClosureRows = [
  'FT-SRCBC-00-scope',
  'FT-SRCBC-01-applysettings-forced',
  'FT-SRCBC-02-refreshnow-forced',
  'FT-SRCBC-03-rule-ui-storage',
  'FT-SRCBC-04-channelmap-only',
  'FT-SRCBC-05-videochannelmap-only',
  'FT-SRCBC-06-videometamap-targeted',
  'FT-SRCBC-07-seed-no-json-clear',
  'FT-SRCBC-08-seed-active-replay',
  'FT-SRCBC-09-observer-menu-quick',
  'FT-SRCBC-10-import-sync-profile',
  'FT-SRCBC-11-diagnostic-rollout'
];

const readinessRows = [
  'FT-SROR-00-scope',
  'FT-SROR-01-applysettings-forced-reprocess',
  'FT-SROR-02-refreshnow-forced-reprocess',
  'FT-SROR-03-rule-ui-storage-force',
  'FT-SROR-04-channelmap-only-early-return',
  'FT-SROR-05-videochannelmap-nonforced-refresh',
  'FT-SROR-06-videometamap-targeted-rerun',
  'FT-SROR-07-seed-no-json-clear',
  'FT-SROR-08-seed-active-json-replay',
  'FT-SROR-09-observer-menu-quick-refresh',
  'FT-SROR-10-import-sync-profile-write',
  'FT-SROR-11-first-optimization-binding'
];

const candidateIds = Array.from({ length: 12 }, (_, index) => `FT-OPT-${String(index).padStart(2, '0')}`);

const firstOptimizationGateIds = Array.from(
  { length: 14 },
  (_, index) => `FT-FIRSTOPT-READY-${String(index).padStart(2, '0')}`
);

const futureAuthorityTokens = [
  'settingsRefreshOptimizationCandidateBindingMatrix',
  'settingsRefreshOptimizationCandidateDecisionReport',
  'settingsRefreshCandidateMetricArtifact',
  'settingsRefreshCandidateWorkDecision',
  'settingsRefreshCandidateNoOpReport',
  'settingsRefreshCandidateSideEffectBudget',
  'settingsRefreshCandidateRollbackProof',
  'settingsRefreshCandidateParityReport',
  'settingsRefreshCandidateDiagnosticPrivacyReport',
  'settingsRefreshCandidateRuntimeApproval',
  'settingsRefreshCandidateBindingChainClosure',
  'settingsRefreshCandidateBindingChainRuntimeApproval',
  'settingsRefreshCandidateBindingImplementationReadiness'
];

const productRoots = [
  'js',
  'html',
  'css',
  'scripts',
  'website',
  'package.json',
  'manifest.json'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function doc() {
  return read(docPath);
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
      walk(path.join(relativePath, entry).replaceAll(path.sep, '/'), result);
    }
    return result;
  }
  if (/\.(?:js|mjs|cjs|json|html|css|md)$/.test(relativePath)) {
    result.push(relativePath.replaceAll(path.sep, '/'));
  }
  return result;
}

function productSource() {
  return productRoots.flatMap(root => walk(root)).map(read).join('\n');
}

test('settings refresh optimization candidate binding matrix is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior settings refresh optimization candidate\s+binding matrix/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /settings refresh optimization candidate binding rows: 12/);
  assert.match(text, /settings refresh readiness rows covered: 12/);
  assert.match(text, /optimization candidates referenced: 12/);
  assert.match(text, /first optimization readiness gates referenced: 14/);
  assert.match(text, /implementation-ready settings refresh candidate bindings: 0/);
  assert.match(text, /runtime settings refresh candidate binding approvals: 0/);
  assert.match(text, /settings refresh candidate binding approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /settings refresh candidate binding chain closure rows: 12/);
  assert.match(text, /settings refresh readiness rows linked by binding closure: 12/);
  assert.match(text, /candidate binding rows linked by binding closure: 12/);
  assert.match(text, /optimization candidate ids linked by binding closure: 12/);
  assert.match(text, /first optimization readiness gates referenced by binding closure: 14/);
  assert.match(text, /runtime settings refresh binding chain approvals: 0/);
  assert.match(text, /implementation-ready settings refresh binding chain rows: 0/);
  assert.match(text, /settings refresh candidate binding chain closure: BINDING-CHAIN-CLOSED/);
  assert.match(text, /settings refresh implementation readiness from binding closure: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `binding matrix does not cite ${sourceDoc}`);
  }
});

test('binding rows map every settings refresh readiness row in stable order', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-SRCB-[^`]+)` \|/gm)].map(match => match[1]);
  const foundClosureRows = [...text.matchAll(/^\| `(FT-SRCBC-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, bindingRows);
  assert.deepEqual(foundClosureRows, bindingClosureRows);
  for (const readinessRow of readinessRows) {
    assert.ok(text.includes(readinessRow), `missing settings refresh readiness row ${readinessRow}`);
  }
  assert.match(text, /ASCII flow:/);
  assert.match(text, /settings refresh readiness row/);
  assert.match(text, /0 settings-refresh candidate bindings are implementation-ready/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /Candidate binding NO-GO/);
});

test('binding matrix references all ranked optimization candidates and implementation gates', () => {
  const text = doc();
  const candidateRegister = read('docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md');
  const readinessGate = read('docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md');

  assert.match(candidateRegister, /optimization priority candidates: 12/);
  assert.match(candidateRegister, /implementation-ready candidates: 0/);
  assert.match(readinessGate, /first optimization implementation readiness rows: 14/);
  assert.match(readinessGate, /runtime first optimization approvals: 0/);
  assert.match(readinessGate, /implementation-ready first optimization rows: 0/);

  for (const candidateId of candidateIds) {
    assert.ok(text.includes(candidateId), `missing optimization candidate ${candidateId}`);
    assert.ok(candidateRegister.includes(candidateId), `candidate register missing ${candidateId}`);
  }

  for (const gateId of firstOptimizationGateIds) {
    assert.ok(readinessGate.includes(gateId), `readiness gate missing ${gateId}`);
  }

  for (const requiredGate of [
    'FT-FIRSTOPT-READY-00-stop-go-decision',
    'FT-FIRSTOPT-READY-02-p0-work-authority',
    'FT-FIRSTOPT-READY-03-route-surface-obligation',
    'FT-FIRSTOPT-READY-04-whitelist-readiness',
    'FT-FIRSTOPT-READY-05-evidence-packet',
    'FT-FIRSTOPT-READY-07-metric-artifact-schema',
    'FT-FIRSTOPT-READY-10-no-work-preservation',
    'FT-FIRSTOPT-READY-11-side-effect-budget',
    'FT-FIRSTOPT-READY-12-fixture-provenance',
    'FT-FIRSTOPT-READY-13-parity-rollout'
  ]) {
    assert.ok(text.includes(requiredGate), `binding matrix missing gate ${requiredGate}`);
  }
});

test('forced refresh and storage bindings stay blocked by visible rule correctness', () => {
  const text = doc();
  const readiness = read('docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md');
  const whitelistGap = read('docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md');
  const stopGo = read('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md');

  assert.match(readiness, /approve forced refresh pruning now: NO-GO/);
  assert.match(readiness, /approve broad whitelist optimization from settings refresh readiness: NO-GO/);
  assert.match(whitelistGap, /implementation-ready whitelist optimization rows: 0/);
  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);

  assert.match(text, /FT-SRCB-01-applysettings-forced[\s\S]*?NO-GO[\s\S]*?forced ApplySettings is correctness-critical/);
  assert.match(text, /FT-SRCB-02-refreshnow-forced[\s\S]*?NO-GO[\s\S]*?lacks producer reason and target-tab work budget/);
  assert.match(text, /FT-SRCB-03-rule-ui-storage[\s\S]*?NO-GO[\s\S]*?visible blocklist\/whitelist rule changes must still force reprocess/);
});

test('map seed lifecycle and import bindings remain gated or NO-GO', () => {
  const text = doc();

  for (const phrase of [
    'future pruning needs visible-card stale-proof and map-write provenance',
    'Shorts, watch, playlist, and visible identity parity remain required',
    'duration/date/category field-effect metrics are still missing',
    'snapshot clearing needs replay-suppression and harvest side-effect proof',
    'active JSON replay needs duplicate replay, mutation, and route/surface budget',
    'action affordance and lifecycle budgets are still separate',
    'profile writes need actor trust, rollback, list revision, native parity, and no-op proof',
    'first optimization still starts with metric foundation and diagnostic privacy'
  ]) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(text, /FT-OPT-01-seed-fetch-pass-through/);
  assert.match(text, /FT-OPT-02-seed-xhr-pass-through/);
  assert.match(text, /FT-OPT-06-dom-lifecycle-budget/);
  assert.match(text, /FT-OPT-07-fallback-menu-lifecycle-budget/);
  assert.match(text, /FT-OPT-08-quick-block-lifecycle-budget/);
  assert.match(text, /FT-OPT-11-native-release-parity-rollout/);
});

test('required binding proof fields and NO-GO decisions remain explicit', () => {
  const text = doc();

  for (const field of [
    'settingsRefreshRowId',
    'optimizationCandidateId',
    'firstOptimizationGateId',
    'producerPath',
    'consumerPath',
    'changedKeys',
    'route',
    'surface',
    'profileType',
    'listMode',
    'ruleState',
    'workDecision',
    'noOpDecision',
    'metricArtifact',
    'positiveFixture',
    'negativeSiblingFixture',
    'sideEffectBudget',
    'rollbackProof',
    'parityReport',
    'diagnosticPrivacyClass'
  ]) {
    assert.ok(text.includes(field), `missing proof field ${field}`);
  }

  for (const decision of [
    'approve settings refresh candidate binding authority now: NO-GO',
    'approve forced refresh candidate pruning now: NO-GO',
    'approve map-only candidate pruning now: NO-GO',
    'approve seed replay candidate pruning now: NO-GO',
    'approve observer/menu/quick candidate pruning now: NO-GO',
    'approve import/sync candidate pruning now: NO-GO',
    'approve metric collector insertion from this matrix now: NO-GO',
    'approve whitelist optimization from this matrix now: NO-GO',
    'approve JSON-first promotion from this matrix now: NO-GO',
    'approve release/public claims from this matrix now: NO-GO',
    'close settings refresh candidate binding chain documentation now: GO',
    'accept binding closure as settings refresh optimization approval now: NO-GO',
    'accept binding closure as forced refresh pruning approval now: NO-GO',
    'accept binding closure as map-only pruning approval now: NO-GO',
    'accept binding closure as seed replay pruning approval now: NO-GO',
    'accept binding closure as observer/menu/quick pruning approval now: NO-GO',
    'accept binding closure as import/sync pruning approval now: NO-GO',
    'accept binding closure as metric collector insertion approval now: NO-GO',
    'accept binding closure as whitelist optimization approval now: NO-GO',
    'accept binding closure as JSON-first promotion approval now: NO-GO',
    'accept binding closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }
});

test('settings refresh candidate binding authority symbols and artifacts remain absent', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/settings-refresh-optimization-candidate-binding-matrix.json',
    'docs/audit/artifacts/settings-refresh-candidate-work-decision.json',
    'docs/audit/artifacts/settings-refresh-candidate-side-effect-budget.json',
    'docs/audit/artifacts/settings-refresh-candidate-rollback-proof.json',
    'docs/audit/artifacts/settings-refresh-candidate-parity-report.json',
    'docs/audit/artifacts/settings-refresh-candidate-binding-chain-closure.json',
    'docs/audit/artifacts/settings-refresh-candidate-binding-implementation-readiness.json'
  ];

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const artifactPath of artifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This matrix is not a completion claim/);
});
