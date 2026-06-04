import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NETWORK_CREDENTIAL_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';

const sourceFingerprints = {
  'js/background.js': [6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/injector.js': [3593, 155830, '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04'],
  'js/tab-view.js': [11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7']
};

const expectedCredentialRows = [
  ['js/background.js', 2892, 'Background Shorts identity HTML fetch', 'include'],
  ['js/background.js', 3008, 'Background Kids watch identity HTML fetch', 'include'],
  ['js/background.js', 3101, 'Background Main watch identity HTML fetch', 'include'],
  ['js/background.js', 4644, 'Background channel info primary HTML fetch', 'include'],
  ['js/background.js', 4658, 'Background channel info handle fallback HTML fetch', 'include'],
  ['js/background.js', 4811, 'Background channel info public fallback HTML fetch', 'omit'],
  ['js/content/handle_resolver.js', 240, 'Content handle resolver direct same-origin HTML fetch', 'same-origin'],
  ['js/content_bridge.js', 1944, 'Content bridge watch metadata direct HTML fetch', 'same-origin'],
  ['js/content_bridge.js', 8707, 'Content bridge Shorts direct HTML fetch', 'same-origin'],
  ['js/content_bridge.js', 8856, 'Content bridge watch identity direct HTML fetch', 'same-origin'],
  ['js/injector.js', 1473, 'Main-world subscription import YouTubei POST', 'include']
];

const credentiallessFetchRows = [
  ['js/background.js', 1723, 'Background release-note extension-resource fetch'],
  ['js/tab-view.js', 2664, 'Dashboard release-note extension-resource fetch']
];

const futureAuthorityTokens = [
  'networkCredentialPolicyMatrixContract',
  'networkCredentialPolicyReport',
  'networkCredentialDecision',
  'ownerCredentialPolicy',
  'networkCredentialRequestReasonReport',
  'networkCredentialPrivacyClassReport',
  'networkCredentialNoWorkBudget',
  'networkCredentialFixtureProvenance',
  'networkCredentialMetricArtifact',
  'networkCredentialJsonFirstGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineAt(file, lineNumber) {
  return read(file).split(/\r?\n/)[lineNumber - 1] || '';
}

function hasCredentialOptionNearFetch(file, fetchLine) {
  const lines = read(file).split(/\r?\n/);
  return lines
    .slice(fetchLine - 1, fetchLine + 6)
    .some((line) => /credentials:\s*'[^']+'/.test(line));
}

function scopedSource() {
  return Object.keys(sourceFingerprints).map(read).join('\n');
}

function credentialRows() {
  const rows = [];
  for (const file of Object.keys(sourceFingerprints)) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      const match = line.match(/credentials:\s*'([^']+)'/);
      if (match) rows.push([file, index + 1, match[1]]);
    });
  }
  return rows;
}

function fetchRows() {
  const rows = [];
  for (const file of Object.keys(sourceFingerprints)) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('//') && /\bfetch\s*\(/.test(line)) rows.push([file, index + 1]);
    });
  }
  return rows;
}

test('network credential policy matrix is audit-only and source pinned', () => {
  const text = read(docPath);

  assert.match(text, /Status: audit-only current-behavior proof slice/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, network-policy patch/);
  assert.match(text, /network credential policy matrix source files: 5/);
  assert.match(text, /product fetch callsites in scoped files: 13/);
  assert.match(text, /fetch callsites with explicit credentials: 11/);
  assert.match(text, /fetch callsites without explicit credentials: 2/);
  assert.match(text, /runtime network credential policy matrix fixtures: 5/);
  assert.match(text, /not completion proof for network credential policy authority/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('current credential rows and modes stay source-derived', () => {
  const rows = credentialRows();
  const byMode = rows.reduce((acc, [, , mode]) => {
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {});

  assert.equal(rows.length, 11);
  assert.deepEqual(byMode, { include: 6, 'same-origin': 4, omit: 1 });
  assert.deepEqual(rows, expectedCredentialRows.map(([file, line, , mode]) => [file, line, mode]));

  for (const [file, line, owner, mode] of expectedCredentialRows) {
    assert.match(lineAt(file, line), new RegExp(`credentials:\\s*'${escapeRegExp(mode)}'`));
    assert.match(read(docPath), new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${line} \\| ${escapeRegExp(owner)} \\| \`${escapeRegExp(mode)}\` \\|`));
  }
});

test('credentialless fetch rows are extension-resource boundaries, not identity authority', () => {
  const rows = fetchRows();
  const explicitFetches = rows.filter(([file, line]) => hasCredentialOptionNearFetch(file, line));
  const withoutCredentials = rows.filter(([file, line]) => !hasCredentialOptionNearFetch(file, line));
  const text = read(docPath);

  assert.equal(rows.length, 13);
  assert.equal(explicitFetches.length, 11);
  assert.deepEqual(withoutCredentials, credentiallessFetchRows.map(([file, line]) => [file, line]));

  for (const [file, line, owner] of credentiallessFetchRows) {
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${line} \\| ${escapeRegExp(owner)} \\| No explicit credentials option\\. \\|`));
  }
  assert.match(text, /They are not YouTube identity repair, YouTubei mutation, or\s+JSON filtering authority/);
});

test('network credential policy matrix is linked from audit ledgers and runtime results', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex
  ]) {
    assert.match(artifact, /Network credential policy matrix addendum/);
    assert.ok(artifact.includes('docs/audit/FILTERTUBE_NETWORK_CREDENTIAL_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'));
    assert.ok(artifact.includes('tests/runtime/network-credential-policy-matrix-current-behavior.test.mjs'));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});

test('first-class network credential authority tokens are absent from product runtime', () => {
  const text = read(docPath);
  const productSource = scopedSource();

  for (const token of futureAuthorityTokens) {
    assert.match(text, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(productSource, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }

  assert.doesNotMatch(productSource, /networkFetchXhrCallsiteAuthority/);
  assert.doesNotMatch(productSource, /backgroundIdentityFetchCredentialPolicy/);
});
