#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIVE_SMOKE_BOUNDARY_DOC = 'docs/audit/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md';

export const REQUIRED_LIVE_SMOKE_ROWS = Object.freeze([
  'FT-LIVE-SPA-00-home-to-search',
  'FT-LIVE-SPA-01-search-to-channel',
  'FT-LIVE-SPA-02-channel-to-watch',
  'FT-LIVE-SPA-03-watch-to-home',
  'FT-LIVE-SPA-04-watch-rail-scroll',
  'FT-LIVE-SPA-05-cache-repeat-navigation'
]);

const REQUIRED_RECORDING_FIELDS = Object.freeze([
  'browserNameVersion',
  'extensionBuildSourcePath',
  'profileListModeSettings',
  'whitelistEntriesUsed',
  'routeSequence',
  'observedStallOrNoStall',
  'observedFalseHideLeakResult',
  'manualTimestamp',
  'testerInitials'
]);

const REQUIRED_BYTE_PARITY_FIELDS = Object.freeze([
  'workspace_revision_or_hash',
  'tester_initials',
  'manual_timestamp',
  'chrome_profile_label',
  'chrome_user_data_dir',
  'extension_id',
  'extension_path',
  'manifest_version',
  'service_worker_version',
  'active_tab_url',
  'content_script_marker_or_hash',
  'extension_reload_timestamp',
  'tab_reload_timestamp',
  'browser_name_version'
]);

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function sameItems(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function addMissingFieldErrors(errors, source, fields, prefix) {
  for (const field of fields) {
    if (isBlank(source?.[field])) errors.push(`${prefix}.${field} is required`);
  }
}

export function validateLiveSmokeArtifact(artifact) {
  const errors = [];
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return ['artifact must be a JSON object'];
  }

  if (artifact.artifactType !== 'filtertube-release-live-youtube-spa-smoke') errors.push('artifactType must be filtertube-release-live-youtube-spa-smoke');
  if (artifact.schemaVersion !== 2) errors.push('schemaVersion must be 2');
  if (artifact.status !== 'executed') errors.push('status must be executed');
  if (artifact.boundaryDoc !== LIVE_SMOKE_BOUNDARY_DOC) errors.push(`boundaryDoc must be ${LIVE_SMOKE_BOUNDARY_DOC}`);
  if (artifact.smokeSliceReadiness !== 'GO-FOR-THIS-SMOKE-SLICE') errors.push('smokeSliceReadiness must be GO-FOR-THIS-SMOKE-SLICE');
  if (artifact.releaseReadiness !== 'GO-FOR-RELEASE-SMOKE') errors.push('releaseReadiness must be GO-FOR-RELEASE-SMOKE');

  addMissingFieldErrors(errors, artifact, REQUIRED_RECORDING_FIELDS, 'artifact');
  if (!Array.isArray(artifact.whitelistEntriesUsed) || artifact.whitelistEntriesUsed.length === 0) {
    errors.push('artifact.whitelistEntriesUsed must contain at least one allow entry');
  }
  if (!sameItems(artifact.routeSequence, REQUIRED_LIVE_SMOKE_ROWS)) {
    errors.push('artifact.routeSequence must exactly match the required live SPA row order');
  }

  const rows = Array.isArray(artifact.requiredRows) ? artifact.requiredRows : [];
  if (!sameItems(rows.map(row => row?.id), REQUIRED_LIVE_SMOKE_ROWS)) {
    errors.push('requiredRows must exactly match the required live SPA rows');
  }
  for (const row of rows) {
    const rowId = row?.id || '<missing-row-id>';
    if (row?.status !== 'passed') errors.push(`${rowId}.status must be passed`);
    if (row?.observation?.pass !== true) errors.push(`${rowId}.observation.pass must be true`);
    if (!Number.isFinite(row?.durationMs) || row.durationMs < 0) errors.push(`${rowId}.durationMs must be a non-negative finite number`);
    if (isBlank(row?.snapshot?.url)) errors.push(`${rowId}.snapshot.url is required`);
    if (row?.snapshot?.seedReady !== true) errors.push(`${rowId}.snapshot.seedReady must be true`);
    if (row?.snapshot?.filterTubeMainWorld !== true) errors.push(`${rowId}.snapshot.filterTubeMainWorld must be true`);
    if (row?.snapshot?.ytdApp !== true) errors.push(`${rowId}.snapshot.ytdApp must be true`);
  }

  if (!Array.isArray(artifact.consoleErrorSummary)) {
    errors.push('consoleErrorSummary must be an array');
  } else if (artifact.consoleErrorSummary.length !== 0) {
    errors.push('consoleErrorSummary must be empty for release-ready smoke');
  }

  const parity = artifact.installedByteParity;
  if (!parity || typeof parity !== 'object' || Array.isArray(parity)) {
    errors.push('installedByteParity must be an object');
  } else {
    if (parity.verdict !== 'GO') errors.push('installedByteParity.verdict must be GO');
    if (!Array.isArray(parity.missing_fields)) {
      errors.push('installedByteParity.missing_fields must be an array');
    } else if (parity.missing_fields.length > 0) {
      errors.push('installedByteParity.missing_fields must be empty');
    }
    addMissingFieldErrors(errors, parity, REQUIRED_BYTE_PARITY_FIELDS, 'installedByteParity');
    if (!parity.source_hashes || typeof parity.source_hashes !== 'object' || Array.isArray(parity.source_hashes)) {
      errors.push('installedByteParity.source_hashes must be an object');
    } else if (Object.keys(parity.source_hashes).length === 0) {
      errors.push('installedByteParity.source_hashes must not be empty');
    }
    if (!Array.isArray(parity.content_script_files) || parity.content_script_files.length === 0) {
      errors.push('installedByteParity.content_script_files must list installed content scripts');
    }
  }

  return errors;
}

export function readLiveSmokeArtifact(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const artifactPath = process.argv[2];
  if (!artifactPath) {
    console.error('Usage: node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs <artifact.json>');
    process.exit(2);
  }

  const resolved = path.resolve(process.cwd(), artifactPath);
  const artifact = readLiveSmokeArtifact(resolved);
  const errors = validateLiveSmokeArtifact(artifact);
  const summary = {
    artifact: path.relative(process.cwd(), resolved).replaceAll(path.sep, '/'),
    valid: errors.length === 0,
    errors
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(errors.length === 0 ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
