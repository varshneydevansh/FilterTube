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

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('release and smoke lanes keep the live YouTube SPA smoke boundary visible', () => {
  const matrix = read(matrixPath);

  assert.ok(LANES.release.tests.includes(liveSmokeTestPath));
  assert.ok(LANES.smoke.tests.includes(liveSmokeTestPath));
  assert.ok(LANES.release.tests.includes(verifierTestPath));
  assert.ok(LANES.smoke.tests.includes(verifierTestPath));

  assert.ok(matrix.includes(boundaryDocPath));
  assert.ok(matrix.includes(templatePath));
  assert.ok(matrix.includes(runnerPath));
  assert.ok(matrix.includes(verifierPath));
  assert.ok(matrix.includes(liveSmokeTestPath));
  assert.ok(matrix.includes(verifierTestPath));
  assert.match(matrix, /Manual YouTube Smoke Handoff/);
  assert.match(matrix, /Automated lanes prove source and fixture contracts/);
  assert.match(matrix, /That test does not claim the manual smoke has passed/);
  assert.match(matrix, /installedByteParity\.verdict=GO/);
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
});

test('live smoke boundary remains explicit that current release smoke is missing', () => {
  const doc = read(boundaryDocPath);

  assert.match(doc, /Status: audit-only release boundary/);
  assert.match(doc, /live YouTube SPA smoke status: missing/);
  assert.match(doc, /executed live smoke result artifacts committed: 0/);
  assert.match(doc, /release readiness from this slice: NO-GO until live smoke is recorded/);
  assert.match(doc, /runner output accepted as release proof now: NO-GO/);
  assert.match(doc, /template accepted as release proof now: NO-GO/);
  assert.match(doc, /live smoke artifact verifier status: defined/);
  assert.match(doc, /A dated artifact is not release-ready until this verifier returns zero errors/);
  assert.match(doc, /live YouTube SPA smoke complete: NO/);
  assert.match(doc, /release package ready because runtime tests pass: NO/);
  assert.match(doc, /public performance claim ready: NO/);

  for (const row of requiredRows) {
    assert.ok(doc.includes(row), `boundary doc missing ${row}`);
  }
});

test('live smoke template is non-executed and cannot satisfy release readiness', () => {
  const template = readJson(templatePath);

  assert.equal(template.artifactType, 'filtertube-release-live-youtube-spa-smoke');
  assert.equal(template.schemaVersion, 2);
  assert.equal(template.status, 'template-not-executed');
  assert.equal(template.smokeSliceReadiness, 'NO-GO');
  assert.equal(template.releaseReadiness, 'NO-GO');
  assert.equal(template.runtimeBehaviorChanged, false);
  assert.equal(template.boundaryDoc, boundaryDocPath);
  assert.equal(template.installedByteParity.verdict, 'NO-GO');
  assert.equal(template.installedByteParity.reason, 'Template is not executed; installed visible-tab byte parity is missing.');

  assert.deepEqual(template.requiredRows.map(row => row.id), requiredRows);
  assert.deepEqual([...new Set(template.requiredRows.map(row => row.status))], ['missing']);
  assert.equal(template.completionRules.allRecordingFieldsRequired, true);
  assert.equal(template.completionRules.allRowsMustPass, true);
  assert.equal(template.completionRules.consoleErrorsMustBeClassified, true);
  assert.equal(template.completionRules.installedByteParityMustPass, true);
  assert.equal(template.completionRules.releaseReadinessWhenTemplate, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenByteParityMissing, 'NO-GO');
  assert.equal(template.completionRules.releaseReadinessWhenAnyRowMissing, 'NO-GO');
});

test('live smoke runner contract writes a dated artifact but no executed artifact is committed now', () => {
  const runner = read(runnerPath);
  const artifactDir = path.join(repoRoot, 'docs/audit/artifacts/release-live-youtube-spa-smoke');
  const executedArtifacts = fs.readdirSync(artifactDir)
    .filter(name => name.endsWith('.json') && name !== 'template.json');

  assert.match(runner, /artifactType: 'filtertube-release-live-youtube-spa-smoke'/);
  assert.match(runner, /boundaryDoc: 'docs\/audit\/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md'/);
  assert.match(runner, /const smokeSliceReadiness = allRowsPassed && consoleIssues\.length === 0 \?/);
  assert.match(runner, /releaseReadiness: smokeSliceReadiness === 'GO-FOR-THIS-SMOKE-SLICE' && installedByteParity\.verdict === 'GO' \?/);
  assert.match(runner, /const artifactPath = path\.join\(artifactRoot, `\$\{runId\}\.json`\)/);
  assert.match(runner, /fs\.writeFileSync\(artifactPath, `\$\{JSON\.stringify\(artifact, null, 2\)\}\\n`\)/);
  assert.match(read(verifierPath), /export function validateLiveSmokeArtifact/);
  assert.match(read(verifierPath), /releaseReadiness must be GO-FOR-RELEASE-SMOKE/);
  assert.match(read(verifierPath), /installedByteParity\.verdict must be GO/);
  assert.deepEqual(executedArtifacts, []);
});
