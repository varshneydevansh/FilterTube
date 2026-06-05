import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LANES, classifyPaths } from '../../scripts/run-test-lane.mjs';
import {
  LIVE_SMOKE_BOUNDARY_DOC,
  MANAGED_CONTROL_LIVE_SMOKE_ROWS,
  REQUIRED_LIVE_SMOKE_ROWS,
  validateLiveSmokeArtifact
} from '../../docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs';

const repoRoot = process.cwd();
const verifierPath = 'docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs';
const templatePath = 'docs/audit/artifacts/release-live-youtube-spa-smoke/template.json';
const matrixPath = 'docs/audit/TEST_LANE_MATRIX.md';
const boundaryDocPath = LIVE_SMOKE_BOUNDARY_DOC;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function baseSnapshot(rowId) {
  return {
    url: `https://www.youtube.com/live-smoke/${rowId}`,
    title: rowId,
    readyState: 'complete',
    bodyTextLength: 5000,
    seedReady: true,
    filterTubeMainWorld: true,
    filterTubeEngine: true,
    ytdApp: true,
    visibleVideoCards: 4,
    hiddenByFilterTube: 1,
    whitelistPending: 0,
    stampedVideoIds: 4,
    stampedChannelIds: 3,
    playerPresent: rowId.includes('watch') || rowId.includes('rail') || rowId.includes('cache'),
    titlePresent: true,
    ownerRowPresent: true,
    mastheadPresent: true,
    channelHeaderPresent: rowId.includes('channel')
  };
}

function managedControlSmoke({ applicable = false } = {}) {
  return {
    applicable,
    parentProfileId: applicable ? 'parent-profile-01' : '',
    protectedProfileId: applicable ? 'child-profile-01' : '',
    observedPolicyRevision: applicable ? 'managed r7' : '',
    observedTimeBudgetState: applicable ? 'zero budget overlay plus active-tab budget observed' : '',
    observedHistoryState: applicable ? 'redacted accepted/rejected managed rows observed' : '',
    requiredRows: MANAGED_CONTROL_LIVE_SMOKE_ROWS.map((id, index) => ({
      id,
      routeAction: `managed row ${index}`,
      requiredObservation: `managed observation ${index}`,
      status: applicable ? 'passed' : 'missing',
      ...(applicable ? {
        observation: { pass: true, summary: `${id} passed` },
        evidence: {
          parentProfileId: 'parent-profile-01',
          protectedProfileId: 'child-profile-01',
          installedExtensionId: 'gkgjigdfdccckblmglboobikfcpeelio',
          policyRevision: 7
        },
        durationMs: 750 + index
      } : {})
    }))
  };
}

function validArtifact() {
  const generatedAt = '2026-06-01T00:00:00.000Z';
  return {
    artifactType: 'filtertube-release-live-youtube-spa-smoke',
    schemaVersion: 4,
    status: 'executed',
    smokeSliceReadiness: 'GO-FOR-THIS-SMOKE-SLICE',
    releaseReadiness: 'GO-FOR-RELEASE-SMOKE',
    runtimeBehaviorChanged: false,
    generatedAt,
    boundaryDoc: LIVE_SMOKE_BOUNDARY_DOC,
    changeContext: {
      logicalChangeType: 'runtime hot-path change',
      requiredLanes: ['test:json', 'test:dom', 'test:performance', 'test:whitelist', 'test:blocking'],
      automatedLaneEvidence: [{
        command: 'npm run test:changed',
        status: 'passed',
        summary: 'json, dom, performance, whitelist, and blocking lanes passed before live smoke',
        lanes: ['test:json', 'test:dom', 'test:performance', 'test:whitelist', 'test:blocking']
      }]
    },
    browserNameVersion: 'Chrome/136.0.0.0',
    extensionId: 'gkgjigdfdccckblmglboobikfcpeelio',
    extensionBuildSourcePath: repoRoot,
    storageSetupContext: 'extension-target',
    profileListModeSettings: 'ftProfilesV4.default.main.mode=whitelist; enabled=true',
    whitelistEntriesUsed: [{ id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', handle: '@GoogleDevelopers' }],
    routeSequence: [...REQUIRED_LIVE_SMOKE_ROWS],
    observedStallOrNoStall: REQUIRED_LIVE_SMOKE_ROWS.map(row => `${row}: 1200ms`).join('; '),
    observedFalseHideLeakResult: 'No row-level false-hide/leak condition observed.',
    consoleErrorSummary: [],
    installedByteParity: {
      packet_id: 'FT-WLCACHE-SPA-PACKET-01-installed-profile-bytes',
      workspace_revision_or_hash: 'abc123',
      tester_initials: 'dv',
      manual_timestamp: generatedAt,
      chrome_profile_label: 'Default',
      chrome_user_data_dir: '/tmp/filtertube-profile',
      extension_id: 'gkgjigdfdccckblmglboobikfcpeelio',
      extension_path: repoRoot,
      manifest_version: '3.3.2',
      service_worker_version: 'js/background.js',
      active_tab_url: 'https://www.youtube.com/watch?v=abc12345678',
      content_script_marker_or_hash: 'runtime-marker:ftSeedInitialized+filterTubeMainWorld',
      extension_reload_timestamp: generatedAt,
      tab_reload_timestamp: generatedAt,
      browser_name_version: 'Chrome/136.0.0.0',
      source_hashes: {
        'manifest.json': 'hash',
        'js/content_bridge.js': 'hash'
      },
      content_script_files: ['js/seed.js', 'js/content_bridge.js'],
      missing_fields: [],
      verdict: 'GO',
      reason: 'Installed visible-tab byte parity recorded.'
    },
    manualTimestamp: generatedAt,
    testerInitials: 'dv',
    requiredRows: REQUIRED_LIVE_SMOKE_ROWS.map((id, index) => ({
      id,
      routeAction: `route ${index}`,
      requiredObservation: `observation ${index}`,
      status: 'passed',
      observation: { pass: true, summary: `row ${index} passed` },
      snapshot: baseSnapshot(id),
      durationMs: 1200 + index
    })),
    managedControlSmoke: managedControlSmoke(),
    completionRules: {
      allRecordingFieldsRequired: true,
      allRowsMustPass: true,
      consoleErrorsMustBeClassified: true,
      installedByteParityMustPass: true
    }
  };
}

test('live smoke artifact verifier is wired into release and smoke lane proof', () => {
  const matrix = read(matrixPath);
  const boundaryDoc = read(boundaryDocPath);

  assert.ok(LANES.release.tests.includes('tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(LANES.smoke.tests.includes('tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs'));
  assert.ok(matrix.includes(verifierPath));
  assert.ok(boundaryDoc.includes(verifierPath));
  assert.match(boundaryDoc, /live smoke artifact verifier status: defined/);
  assert.match(boundaryDoc, /A dated artifact is not release-ready until this verifier returns zero errors/);
});

test('classifier treats live smoke artifact tools as release and smoke proof', () => {
  const result = classifyPaths([verifierPath, templatePath]);

  assert.deepEqual(result.lanes, ['release', 'smoke']);
  assert.deepEqual(result.unmatched, []);
  assert.equal(result.classifications[0].matched[0].id, 'live-smoke-artifact-surface');
});

test('verifier rejects the non-executed template and missing byte parity', () => {
  const template = readJson(templatePath);
  const errors = validateLiveSmokeArtifact(template);

  assert.ok(errors.includes('status must be executed'));
  assert.ok(errors.includes('smokeSliceReadiness must be GO-FOR-THIS-SMOKE-SLICE'));
  assert.ok(errors.includes('releaseReadiness must be GO-FOR-RELEASE-SMOKE'));
  assert.ok(errors.includes('changeContext.logicalChangeType is required'));
  assert.ok(errors.includes('changeContext.requiredLanes must list required test lanes'));
  assert.ok(errors.includes('changeContext.automatedLaneEvidence must contain at least one passed lane command'));
  assert.ok(errors.includes('installedByteParity.verdict must be GO'));
  assert.ok(errors.includes('artifact.routeSequence must exactly match the required live SPA row order'));
  assert.ok(errors.includes('FT-LIVE-SPA-00-home-to-search.status must be passed'));
});

test('verifier accepts a complete executed artifact with byte parity and clean rows', () => {
  assert.deepEqual(validateLiveSmokeArtifact(validArtifact()), []);
});

test('verifier requires managed child sync and time-limit rows for managed-control artifacts', () => {
  const managed = validArtifact();
  managed.changeContext.logicalChangeType = 'managed parent time-limit change';
  managed.changeContext.requiredLanes = ['test:settings', 'test:smoke'];
  managed.changeContext.automatedLaneEvidence = [{
    command: 'npm run test:changed',
    status: 'passed',
    summary: 'settings and smoke lanes passed for managed time-limit change',
    lanes: ['test:settings', 'test:smoke']
  }];

  const missingManagedRows = validateLiveSmokeArtifact(managed);
  assert.ok(missingManagedRows.includes('managedControlSmoke.applicable must be true for managed-control changes'));

  managed.managedControlSmoke = managedControlSmoke({ applicable: true });
  assert.deepEqual(validateLiveSmokeArtifact(managed), []);

  managed.managedControlSmoke.requiredRows[2].status = 'failed';
  managed.managedControlSmoke.requiredRows[2].observation.pass = false;
  delete managed.managedControlSmoke.requiredRows[2].evidence.protectedProfileId;

  const failedManagedRows = validateLiveSmokeArtifact(managed);
  assert.ok(failedManagedRows.includes('FT-MANAGED-LIVE-02-time-budget-active-tab.status must be passed'));
  assert.ok(failedManagedRows.includes('FT-MANAGED-LIVE-02-time-budget-active-tab.observation.pass must be true'));
  assert.ok(failedManagedRows.includes('FT-MANAGED-LIVE-02-time-budget-active-tab.evidence.protectedProfileId is required'));
});

test('verifier rejects row failures console issues and stale route order', () => {
  const artifact = validArtifact();
  artifact.routeSequence = [...REQUIRED_LIVE_SMOKE_ROWS].reverse();
  artifact.requiredRows[2].status = 'failed';
  artifact.requiredRows[2].observation.pass = false;
  artifact.requiredRows[3].snapshot.seedReady = false;
  artifact.consoleErrorSummary = [{ method: 'Runtime.exceptionThrown', text: 'boom' }];
  artifact.installedByteParity.missing_fields = ['tab_reload_timestamp'];

  const errors = validateLiveSmokeArtifact(artifact);
  assert.ok(errors.includes('artifact.routeSequence must exactly match the required live SPA row order'));
  assert.ok(errors.includes('FT-LIVE-SPA-02-channel-to-watch.status must be passed'));
  assert.ok(errors.includes('FT-LIVE-SPA-02-channel-to-watch.observation.pass must be true'));
  assert.ok(errors.includes('FT-LIVE-SPA-03-watch-to-home.snapshot.seedReady must be true'));
  assert.ok(errors.includes('consoleErrorSummary must be empty for release-ready smoke'));
  assert.ok(errors.includes('installedByteParity.missing_fields must be empty'));
});

test('verifier rejects incomplete installed byte parity contracts', () => {
  const artifact = validArtifact();
  artifact.installedByteParity.missing_fields = 'tab_reload_timestamp';
  artifact.installedByteParity.source_hashes = {};
  artifact.installedByteParity.content_script_files = [];

  const errors = validateLiveSmokeArtifact(artifact);
  assert.ok(errors.includes('installedByteParity.missing_fields must be an array'));
  assert.ok(errors.includes('installedByteParity.source_hashes must not be empty'));
  assert.ok(errors.includes('installedByteParity.content_script_files must list installed content scripts'));
});

test('verifier rejects missing or failed automated lane evidence', () => {
  const missing = validArtifact();
  missing.changeContext.requiredLanes = [];
  missing.changeContext.automatedLaneEvidence = [];

  const failed = validArtifact();
  failed.changeContext.automatedLaneEvidence = [{
    command: 'npm run test:changed',
    status: 'failed',
    summary: 'release lane failed',
    lanes: ['test:json']
  }];

  const missingErrors = validateLiveSmokeArtifact(missing);
  const failedErrors = validateLiveSmokeArtifact(failed);

  assert.ok(missingErrors.includes('changeContext.requiredLanes must list required test lanes'));
  assert.ok(missingErrors.includes('changeContext.automatedLaneEvidence must contain at least one passed lane command'));
  assert.ok(failedErrors.includes('changeContext.automatedLaneEvidence[0].status must be passed'));
});

test('verifier rejects unknown required lanes and uncovered proof lanes', () => {
  const unknown = validArtifact();
  unknown.changeContext.requiredLanes = ['json'];

  const missingCoverage = validArtifact();
  missingCoverage.changeContext.requiredLanes = ['test:json', 'test:performance'];
  missingCoverage.changeContext.automatedLaneEvidence = [{
    command: 'npm run test:json',
    status: 'passed',
    summary: 'json lane passed only',
    lanes: ['test:json']
  }];

  const missingLaneList = validArtifact();
  missingLaneList.changeContext.automatedLaneEvidence[0].lanes = [];

  const unknownErrors = validateLiveSmokeArtifact(unknown);
  const coverageErrors = validateLiveSmokeArtifact(missingCoverage);
  const missingLaneListErrors = validateLiveSmokeArtifact(missingLaneList);

  assert.ok(unknownErrors.includes('changeContext.requiredLanes[0] must be a known test lane'));
  assert.ok(coverageErrors.includes('changeContext.requiredLanes must be covered by automatedLaneEvidence.lanes: test:performance'));
  assert.ok(missingLaneListErrors.includes('changeContext.automatedLaneEvidence[0].lanes must list covered test lanes'));
});

test('verifier CLI exits nonzero for template and zero for complete artifact', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-live-smoke-'));
  const artifactPath = path.join(tempDir, 'executed.json');
  fs.writeFileSync(artifactPath, `${JSON.stringify(validArtifact(), null, 2)}\n`);

  const templateRun = spawnSync(process.execPath, [verifierPath, templatePath], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const validRun = spawnSync(process.execPath, [verifierPath, artifactPath], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  assert.equal(templateRun.status, 1);
  assert.match(templateRun.stdout, /"valid": false/);
  assert.equal(validRun.status, 0);
  assert.match(validRun.stdout, /"valid": true/);
});
