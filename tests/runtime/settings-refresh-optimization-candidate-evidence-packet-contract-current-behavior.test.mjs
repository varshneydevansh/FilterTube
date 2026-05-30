import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
];

const evidenceRows = [
  'FT-SRCEP-00-scope',
  'FT-SRCEP-01-applysettings-forced',
  'FT-SRCEP-02-refreshnow-forced',
  'FT-SRCEP-03-rule-ui-storage',
  'FT-SRCEP-04-channelmap-only',
  'FT-SRCEP-05-videochannelmap-only',
  'FT-SRCEP-06-videometamap-targeted',
  'FT-SRCEP-07-seed-no-json-clear',
  'FT-SRCEP-08-seed-active-replay',
  'FT-SRCEP-09-observer-menu-quick',
  'FT-SRCEP-10-import-sync-profile',
  'FT-SRCEP-11-diagnostic-rollout'
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

const chainRows = [
  'FT-SRCEC-00-scope',
  'FT-SRCEC-01-applysettings-forced',
  'FT-SRCEC-02-refreshnow-forced',
  'FT-SRCEC-03-rule-ui-storage',
  'FT-SRCEC-04-channelmap-only',
  'FT-SRCEC-05-videochannelmap-only',
  'FT-SRCEC-06-videometamap-targeted',
  'FT-SRCEC-07-seed-no-json-clear',
  'FT-SRCEC-08-seed-active-replay',
  'FT-SRCEC-09-observer-menu-quick',
  'FT-SRCEC-10-import-sync-profile',
  'FT-SRCEC-11-diagnostic-rollout'
];

const firstEvidenceRows = Array.from({ length: 10 }, (_, index) => {
  const names = [
    'candidate-obligation-binding',
    'route-surface-mode-scope',
    'metric-artifact',
    'positive-negative-fixtures',
    'false-hide-leak-restore',
    'json-dom-native-parity',
    'lifecycle-budget',
    'settings-mutation-profile',
    'diagnostic-privacy',
    'rollout-claim-boundary'
  ];
  return `FT-EVIDENCE-${String(index).padStart(2, '0')}-${names[index]}`;
});

const requiredPacketFields = [
  'packetId',
  'settingsRefreshRowId',
  'candidateBindingRowId',
  'optimizationCandidateId',
  'firstOptimizationGateIds',
  'producerPath',
  'consumerPath',
  'changedKeys',
  'route',
  'surface',
  'profileType',
  'listMode',
  'ruleState',
  'activeJsonWork',
  'activeDomWork',
  'activeMenuOrQuickWork',
  'forceReprocessPolicy',
  'mapOnlyStaleProof',
  'seedReplayBudget',
  'lifecycleBudget',
  'importSyncRollbackProof',
  'noOpDecision',
  'metricArtifact',
  'positiveFixture',
  'negativeSiblingFixture',
  'sideEffectBudget',
  'parityReport',
  'diagnosticPrivacyClass',
  'rolloutClaimBoundary'
];

const futureAuthorityTokens = [
  'settingsRefreshOptimizationCandidateEvidencePacketContract',
  'settingsRefreshOptimizationCandidateEvidencePacket',
  'settingsRefreshEvidencePacketApproval',
  'settingsRefreshEvidencePacketMetricArtifact',
  'settingsRefreshEvidencePacketNoOpDecision',
  'settingsRefreshEvidencePacketSideEffectBudget',
  'settingsRefreshEvidencePacketRollbackProof',
  'settingsRefreshEvidencePacketParityReport',
  'settingsRefreshEvidencePacketDiagnosticPrivacy',
  'settingsRefreshEvidencePacketRuntimeApproval',
  'settingsRefreshEvidenceChainClosure',
  'settingsRefreshEvidenceChainRuntimeApproval'
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

test('settings refresh candidate evidence packet contract is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior settings refresh optimization candidate\s+evidence packet contract/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /settings refresh candidate evidence packet rows: 12/);
  assert.match(text, /settings refresh candidate binding rows covered: 12/);
  assert.match(text, /settings refresh readiness rows covered: 12/);
  assert.match(text, /first optimization evidence packet rows referenced: 10/);
  assert.match(text, /required settings refresh packet fields: 29/);
  assert.match(text, /implementation-ready settings refresh evidence packets: 0/);
  assert.match(text, /runtime settings refresh evidence packet approvals: 0/);
  assert.match(text, /settings refresh evidence packet approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /settings refresh evidence chain closure rows: 12/);
  assert.match(text, /settings refresh readiness rows linked: 12/);
  assert.match(text, /candidate binding rows linked: 12/);
  assert.match(text, /evidence packet rows linked: 12/);
  assert.match(text, /first optimization evidence row families referenced: 10/);
  assert.match(text, /committed settings refresh evidence artifacts: 0/);
  assert.match(text, /runtime settings refresh chain approvals: 0/);
  assert.match(text, /settings refresh evidence chain closure: CHAIN-CLOSED/);
  assert.match(text, /settings refresh implementation readiness from chain closure: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `evidence packet contract does not cite ${sourceDoc}`);
  }
});

test('evidence packet rows cover every settings refresh candidate binding row', () => {
  const text = doc();
  const bindingMatrix = read('docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md');
  const foundRows = [...text.matchAll(/^\| `(FT-SRCEP-[^`]+)` \|/gm)].map(match => match[1]);
  const foundChainRows = [...text.matchAll(/^\| `(FT-SRCEC-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, evidenceRows);
  assert.deepEqual(foundChainRows, chainRows);
  for (const bindingRow of bindingRows) {
    assert.ok(text.includes(bindingRow), `evidence contract missing binding row ${bindingRow}`);
    assert.ok(bindingMatrix.includes(bindingRow), `binding matrix missing ${bindingRow}`);
  }
  for (const readinessRow of readinessRows) {
    assert.ok(text.includes(readinessRow), `evidence chain missing readiness row ${readinessRow}`);
  }
  assert.match(text, /ASCII flow:/);
  assert.match(text, /settings refresh candidate binding/);
  assert.match(text, /0 settings-refresh evidence packets are implementation-ready/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /Evidence packet NO-GO/);
});

test('contract references generic first optimization evidence rows and keeps them unapproved', () => {
  const text = doc();
  const firstEvidence = read('docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md');
  const readiness = read('docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md');

  assert.match(firstEvidence, /first optimization evidence packet rows: 10/);
  assert.match(firstEvidence, /Implementation-ready optimization rows: 0/);
  assert.match(readiness, /runtime first optimization approvals: 0/);
  assert.match(readiness, /implementation-ready first optimization rows: 0/);

  for (const firstEvidenceRow of firstEvidenceRows) {
    assert.ok(text.includes(firstEvidenceRow), `settings evidence contract missing ${firstEvidenceRow}`);
    assert.ok(firstEvidence.includes(firstEvidenceRow), `first evidence contract missing ${firstEvidenceRow}`);
  }
});

test('forced refresh and visible rule evidence packets remain NO-GO', () => {
  const text = doc();
  const readiness = read('docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md');
  const stopGo = read('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md');

  assert.match(readiness, /approve forced refresh pruning now: NO-GO/);
  assert.match(stopGo, /Stop-now whitelist optimization decision: NO-GO/);
  assert.match(text, /FT-SRCEP-01-applysettings-forced[\s\S]*?NO-GO[\s\S]*?forced ApplySettings cannot be pruned/);
  assert.match(text, /FT-SRCEP-02-refreshnow-forced[\s\S]*?NO-GO[\s\S]*?RefreshNow has no producer-specific work budget/);
  assert.match(text, /FT-SRCEP-03-rule-ui-storage[\s\S]*?NO-GO[\s\S]*?visible rule correctness currently depends on forced refresh/);
});

test('map seed lifecycle import and rollout packet burdens stay explicit', () => {
  const text = doc();

  for (const phrase of [
    'map-only no-op, visible-card stale behavior, map-write provenance',
    'watch, Shorts, playlist, YTM, Kids, and visible identity parity',
    'duration/date/category field effects, metadata fetch budget, targeted rerun cost',
    'snapshot clearing cannot suppress later required replay',
    'active JSON replay, duplicate replay policy, mutation budget',
    'DOM observer, menu repair, quick-block availability, prefetch',
    'actor trust, rollback, list revision, profile mirror',
    'metric foundation, diagnostic privacy, artifact verification'
  ]) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('required settings refresh evidence packet fields and NO-GO decisions remain explicit', () => {
  const text = doc();
  const fieldBlock = text.match(/## Required Settings Refresh Evidence Packet Fields\s+```text\n([\s\S]*?)\n```/);
  assert.ok(fieldBlock, 'missing required settings refresh evidence packet field block');
  const listedFields = fieldBlock[1].split('\n').filter(Boolean);

  assert.deepEqual(listedFields, requiredPacketFields);
  assert.equal(listedFields.length, 29);

  for (const field of requiredPacketFields) {
    assert.ok(text.includes(field), `missing packet field ${field}`);
  }

  for (const decision of [
    'approve settings refresh evidence packet authority now: NO-GO',
    'approve forced refresh evidence packet now: NO-GO',
    'approve map-only evidence packet now: NO-GO',
    'approve seed replay evidence packet now: NO-GO',
    'approve observer/menu/quick evidence packet now: NO-GO',
    'approve import/sync evidence packet now: NO-GO',
    'approve metric collector insertion from this contract now: NO-GO',
    'approve whitelist optimization from this contract now: NO-GO',
    'approve JSON-first promotion from this contract now: NO-GO',
    'approve release/public claims from this contract now: NO-GO',
    'close settings refresh evidence chain documentation now: GO',
    'accept chain closure as implementation-ready evidence now: NO-GO',
    'accept chain closure as metric artifact evidence now: NO-GO',
    'accept chain closure as collector insertion approval now: NO-GO',
    'accept chain closure as forced refresh pruning approval now: NO-GO',
    'accept chain closure as whitelist optimization approval now: NO-GO',
    'accept chain closure as JSON-first promotion approval now: NO-GO',
    'accept chain closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }
});

test('settings refresh evidence packet authorities and artifacts remain absent', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/settings-refresh-optimization-candidate-evidence-packet.json',
    'docs/audit/artifacts/settings-refresh-evidence-packet-metric-artifact.json',
    'docs/audit/artifacts/settings-refresh-evidence-packet-no-op-decision.json',
    'docs/audit/artifacts/settings-refresh-evidence-packet-rollback-proof.json',
    'docs/audit/artifacts/settings-refresh-evidence-packet-parity-report.json'
  ];

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const artifactPath of artifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This contract is not a completion claim/);
});
