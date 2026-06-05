import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES } from '../../scripts/run-test-lane.mjs';

const repoRoot = process.cwd();
const boundaryDocPath = 'docs/audit/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md';
const templatePath = 'docs/audit/artifacts/release-live-youtube-spa-smoke/template.json';
const runnerPath = 'docs/audit/artifacts/release-live-youtube-spa-smoke/run-live-smoke.mjs';
const verifierPath = 'docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs';
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const liveSmokeTestPath = 'tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs';
const verifierTestPath = 'tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs';

const requiredRows = [
  'FT-LIVE-SPA-00-home-to-search',
  'FT-LIVE-SPA-01-search-to-channel',
  'FT-LIVE-SPA-02-channel-to-watch',
  'FT-LIVE-SPA-03-watch-to-home',
  'FT-LIVE-SPA-04-watch-rail-scroll',
  'FT-LIVE-SPA-05-cache-repeat-navigation'
];
const managedRows = [
  'FT-MANAGED-LIVE-00-protected-profile-preflight',
  'FT-MANAGED-LIVE-01-main-kids-route-gate',
  'FT-MANAGED-LIVE-02-time-budget-active-tab',
  'FT-MANAGED-LIVE-03-zero-budget-timeout-overlay',
  'FT-MANAGED-LIVE-04-parent-history-redaction',
  'FT-MANAGED-LIVE-05-command-center-bulk-rail',
  'FT-MANAGED-LIVE-06-no-policy-no-work'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('release and smoke lanes keep the live YouTube SPA smoke boundary visible', () => {
  const matrix = read(matrixPath);
  const pkg = readJson('package.json');

  assert.ok(LANES.release.tests.includes(liveSmokeTestPath));
  assert.ok(LANES.smoke.tests.includes(liveSmokeTestPath));
  assert.ok(LANES.release.tests.includes(verifierTestPath));
  assert.ok(LANES.smoke.tests.includes(verifierTestPath));
  assert.equal(pkg.scripts['smoke:youtube'], `node ${runnerPath}`);
  assert.equal(pkg.scripts['smoke:youtube:verify'], `node ${verifierPath}`);

  assert.ok(matrix.includes(boundaryDocPath));
  assert.ok(matrix.includes(templatePath));
  assert.ok(matrix.includes(runnerPath));
  assert.ok(matrix.includes(verifierPath));
  assert.ok(matrix.includes('npm run smoke:youtube'));
  assert.ok(matrix.includes('npm run smoke:youtube:verify -- docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json'));
  assert.ok(matrix.includes(liveSmokeTestPath));
  assert.ok(matrix.includes(verifierTestPath));
  assert.match(matrix, /Manual YouTube Smoke Handoff/);
  assert.match(matrix, /Automated lanes prove source and fixture contracts/);
  assert.match(matrix, /That test does not claim the manual smoke has passed/);
  assert.match(matrix, /installedByteParity\.verdict=GO/);
  assert.match(matrix, /changeContext/);
  assert.match(matrix, /automated lane evidence/);
  assert.match(matrix, /FILTERTUBE_LOGICAL_CHANGE_TYPE="runtime hot-path change"/);
  assert.match(matrix, /FILTERTUBE_REQUIRED_LANES="test:json,test:performance"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_COMMAND="npm run test:changed"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_STATUS="passed"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_SUMMARY="test:changed passed for the classified lanes"/);
  assert.match(matrix, /FILTERTUBE_AUTOMATED_PROOF_LANES="test:json,test:performance"/);
});

test('manual smoke handoff covers the release-critical visible behavior set', () => {
  const matrix = read(matrixPath);
  const requiredTerms = [
    'no-rule/no-work performance',
    'blocklist keyword/channel hiding',
    'whitelist-only mode',
    'Shorts behavior',
    'end-screen behavior',
    'quick-block and 3-dot menus',
    'JSON-first and DOM fallback',
    'settings/profile/storage',
    'release packaging'
  ];

  for (const term of requiredTerms) {
    assert.match(matrix, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const row of requiredRows) {
    assert.ok(matrix.includes(row), `matrix missing ${row}`);
  }
  for (const row of managedRows) {
    assert.ok(matrix.includes(row), `matrix missing managed row ${row}`);
  }
});

test('live smoke boundary remains explicit that current release smoke is missing', () => {
  const doc = read(boundaryDocPath);

  assert.match(doc, /Status: audit-only release boundary/);
  assert.match(doc, /live YouTube SPA smoke status: missing/);
  assert.match(doc, /executed live smoke result artifacts committed: 0/);
  assert.match(doc, /release readiness from this slice: NO-GO until live smoke is recorded/);
  assert.match(doc, /runner output accepted as release proof now: NO-GO/);
  assert.match(doc, /FILTERTUBE_LOGICAL_CHANGE_TYPE/);
  assert.match(doc, /FILTERTUBE_REQUIRED_LANES/);
  assert.match(doc, /FILTERTUBE_AUTOMATED_PROOF_COMMAND/);
  assert.match(doc, /FILTERTUBE_AUTOMATED_PROOF_STATUS=passed/);
  assert.match(doc, /FILTERTUBE_AUTOMATED_PROOF_SUMMARY/);
  assert.match(doc, /FILTERTUBE_AUTOMATED_PROOF_LANES/);
  assert.match(doc, /does not cover every required lane/);
  assert.match(doc, /same known `test:\*` lane vocabulary/);
  assert.match(doc, /template accepted as release proof now: NO-GO/);
  assert.match(doc, /live smoke artifact verifier status: defined/);
  assert.match(doc, /A dated artifact is not release-ready until this verifier returns zero errors/);
  assert.match(doc, /live YouTube SPA smoke complete: NO/);
  assert.match(doc, /release package ready because runtime tests pass: NO/);
  assert.match(doc, /public performance claim ready: NO/);

  for (const row of requiredRows) {
    assert.ok(doc.includes(row), `boundary doc missing ${row}`);
  }
  for (const row of managedRows) {
    assert.ok(doc.includes(row), `boundary doc missing managed row ${row}`);
  }
});

test('live smoke template is non-executed and cannot satisfy release readiness', () => {
  const template = readJson(templatePath);

  assert.equal(template.artifactType, 'filtertube-release-live-youtube-spa-smoke');
  assert.equal(template.schemaVersion, 5);
  assert.equal(template.status, 'template-not-executed');
  assert.equal(template.smokeSliceReadiness, 'NO-GO');
  assert.equal(template.releaseReadiness, 'NO-GO');
  assert.equal(template.runtimeBehaviorChanged, false);
  assert.deepEqual(template.changeContext.requiredLanes, []);
  assert.deepEqual(template.changeContext.automatedLaneEvidence, []);
  assert.equal(template.boundaryDoc, boundaryDocPath);
  assert.equal(template.installedByteParity.verdict, 'NO-GO');
  assert.equal(template.installedByteParity.reason, 'Template is not executed; installed visible-tab byte parity is missing.');

  assert.deepEqual(template.requiredRows.map(row => row.id), requiredRows);
  assert.deepEqual([...new Set(template.requiredRows.map(row => row.status))], ['missing']);
  assert.equal(template.managedControlSmoke.applicable, false);
  assert.deepEqual(template.managedControlSmoke.requiredRows.map(row => row.id), managedRows);
  assert.deepEqual([...new Set(template.managedControlSmoke.requiredRows.map(row => row.status))], ['missing']);
  assert.equal(template.completionRules.allRecordingFieldsRequired, true);
  assert.equal(template.completionRules.allRowsMustPass, true);
  assert.equal(template.completionRules.consoleErrorsMustBeClassified, true);
  assert.equal(template.completionRules.installedByteParityMustPass, true);
  assert.equal(template.completionRules.automatedLaneEvidenceMustPass, true);
  assert.equal(template.completionRules.automatedLaneEvidenceMustCoverRequiredLanes, true);
  assert.equal(template.completionRules.releaseReadinessWhenTemplate, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenByteParityMissing, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenAutomatedLaneEvidenceMissing, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenAnyRowMissing, 'NO-GO');
  assert.equal(template.completionRules.managedControlRowsRequiredWhenApplicable, true);
  assert.equal(template.completionRules.managedControlRowsRequiredForManagedLogicalChanges, true);
});

test('live smoke runner contract writes a dated artifact but no executed artifact is committed now', () => {
  const runner = read(runnerPath);
  const artifactDir = path.join(repoRoot, 'docs/audit/artifacts/release-live-youtube-spa-smoke');
  const executedArtifacts = fs.readdirSync(artifactDir)
    .filter(name => name.endsWith('.json') && name !== 'template.json');

  assert.match(runner, /artifactType: 'filtertube-release-live-youtube-spa-smoke'/);
  assert.match(runner, /boundaryDoc: 'docs\/audit\/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md'/);
  assert.match(runner, /const smokeSliceReadiness = allRowsPassed && consoleIssues\.length === 0 \?/);
  assert.match(runner, /const changeContext = buildChangeContext\(\)/);
  assert.match(runner, /function buildManagedControlSmokePlaceholder\(\)/);
  assert.match(runner, /LIVE_SMOKE_MANAGED_CONTROL_ROWS\.map/);
  assert.match(runner, /const KNOWN_TEST_LANES = new Set\(Object\.keys\(LANES\)\.map\(lane => `test:\$\{lane\}`\)\)/);
  assert.match(runner, /function hasOnlyKnownTestLanes\(lanes\)/);
  assert.match(runner, /hasOnlyKnownTestLanes\(changeContext\.requiredLanes\)/);
  assert.match(runner, /releaseReadiness: smokeSliceReadiness === 'GO-FOR-THIS-SMOKE-SLICE' && installedByteParity\.verdict === 'GO' && changeContextReady \?/);
  assert.match(runner, /const artifactPath = path\.join\(artifactRoot, `\$\{runId\}\.json`\)/);
  assert.match(runner, /fs\.writeFileSync\(artifactPath, `\$\{JSON\.stringify\(artifact, null, 2\)\}\\n`\)/);
  assert.match(read(verifierPath), /export function validateLiveSmokeArtifact/);
  assert.match(read(verifierPath), /releaseReadiness must be GO-FOR-RELEASE-SMOKE/);
  assert.match(read(verifierPath), /managedControlSmoke\.applicable must be true for managed-control changes/);
  assert.match(read(verifierPath), /installedByteParity\.verdict must be GO/);
  assert.match(read(verifierPath), /changeContext\.automatedLaneEvidence/);
  assert.deepEqual(executedArtifacts, []);
});
