import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_FINGERPRINT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-source-locus-fingerprint-boundary-current-behavior.test.mjs';
const sourceOwnerMapPath = 'docs/audit/artifacts/first-optimization/metric-foundation/source-owner-map.json';

const sourceDocs = {
  sourceLocusCallable: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_CALLABLE_ANCHOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerMapContract: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  sourceOwnerMatrix: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorApproval: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  collectorInsertion: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  implementationReadiness: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  runtimeResults: 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'
};

const ledgerDocs = {
  objectiveLedger: 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  trackedIndex: 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
};

const expectedRows = [
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

const runtimeSourceFiles = [
  'js/seed.js',
  'js/filter_logic.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/handle_resolver.js',
  'js/background.js',
  'js/state_manager.js',
  'js/settings_shared.js',
  'js/io_manager.js',
  'build.js',
  'scripts/build-extension-ui.mjs',
  'scripts/build-nanah-vendor.mjs',
  'scripts/sync-native-runtime.mjs'
];

const auditAnchorFiles = [
  'tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs',
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'
];

const expectedFingerprints = {
  'js/seed.js': {
    lines: 1136,
    bytes: 50026,
    hash: 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'
  },
  'js/filter_logic.js': {
    lines: 3652,
    bytes: 172174,
    hash: '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'
  },
  'js/content_bridge.js': {
    lines: 13623,
    bytes: 603362,
    hash: 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c'
  },
  'js/content/dom_fallback.js': {
    lines: 5030,
    bytes: 235555,
    hash: 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5'
  },
  'js/content/block_channel.js': {
    lines: 3189,
    bytes: 127857,
    hash: 'c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba'
  },
  'js/content/handle_resolver.js': {
    lines: 282,
    bytes: 9785,
    hash: '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'
  },
  'js/background.js': {
    lines: 6343,
    bytes: 286370,
    hash: '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad'
  },
  'js/state_manager.js': {
    lines: 2491,
    bytes: 99780,
    hash: '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'
  },
  'js/settings_shared.js': {
    lines: 1181,
    bytes: 57535,
    hash: '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'
  },
  'js/io_manager.js': {
    lines: 2030,
    bytes: 96914,
    hash: 'd04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21'
  },
  'build.js': {
    lines: 740,
    bytes: 26978,
    hash: 'c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04'
  },
  'scripts/build-extension-ui.mjs': {
    lines: 50,
    bytes: 1188,
    hash: '6326362ebf90f448ccdbf68945b3fb522b7b215edaf9b3e28589a4e166239cf3'
  },
  'scripts/build-nanah-vendor.mjs': {
    lines: 65,
    bytes: 1818,
    hash: 'dae8d3ef29c4cd44b0bf975090e9d53f3bb05b523355f5038930fc03b27e921c'
  },
  'scripts/sync-native-runtime.mjs': {
    lines: 34,
    bytes: 1070,
    hash: '4f46c13bf6099092193712790d231ff4809b00b1b0061d04af71ac3ba6bf21c6'
  },
  'tests/runtime/first-optimization-source-owner-approval-boundary-current-behavior.test.mjs': {
    lines: 297,
    bytes: 12983,
    hash: '0d5217c6674b32ac2a4cb4dcace0cda60558ad6481e01e5a0fb1de39fe6d5521'
  },
  'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md': {
    lines: 254,
    bytes: 16411,
    hash: 'ddab073bf8fe0b5d0f5f69d2c31e92990ba47c46eda93d3d5fe669cd05290c88'
  }
};

const futureAuthorityTokens = [
  'firstOptimizationSourceLocusFingerprintBoundary',
  'firstOptimizationSourceLocusFingerprintReport',
  'sourceLocusFingerprintApproval',
  'sourceLocusHashOwnerApproval',
  'jsonFirstSourceLocusHashGate',
  'whitelistSourceLocusHashGate',
  'metricFoundationSourceHashAuthority',
  'runtimeSourceFingerprintOwnerMap',
  'runtimeSourceFingerprintCollector',
  'sourceLocusFingerprintMetricArtifact'
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(filePath(file));
}

function lineCount(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function walk(relativePath, result = []) {
  const absolutePath = filePath(relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === '.next' || entry === '.vercel') continue;
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  if (/\.(js|mjs|cjs|ts|tsx|json|html|css|md)$/.test(relativePath)) {
    result.push(relativePath.replaceAll(path.sep, '/'));
  }
  return result;
}

function productSource() {
  const files = [
    ...walk('js'),
    ...walk('scripts'),
    ...walk('website'),
    'build.js'
  ];
  return files.map((file) => read(file)).join('\n');
}

function docFingerprintRows() {
  const doc = read(docPath);
  return [...doc.matchAll(/^\| `([^`]+)` \| (\d+) \| (\d+) \| `([a-f0-9]{64})` \|$/gm)]
    .map((match) => ({
      file: match[1],
      lines: Number(match[2]),
      bytes: Number(match[3]),
      hash: match[4]
    }));
}

test('source-locus fingerprint boundary is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior first optimization source-locus\s+fingerprint boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch, optimization patch/);
  assert.match(doc, /line anchors alone\s+do not prove revision freshness/);
  assert.match(doc, /Source hashes are a freshness pin, not approval/);
  assert.match(doc, /JSON-first runtime behavior patch: NO-GO/);
  assert.match(doc, /whitelist optimization patch: NO-GO/);
  assert.match(doc, /continue proof-backed audit: GO/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('source-locus fingerprint rows counts and files stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-SOURCE-LOCUS-CALLABLE-[^`]+)` \|/gm)].map((row) => row[1]);
  const fingerprintRows = docFingerprintRows().map((row) => row.file);

  assert.deepEqual(rows, expectedRows);
  assert.equal(rows.length, 12);
  assert.deepEqual(fingerprintRows, Object.keys(expectedFingerprints));
  assert.equal(fingerprintRows.length, 16);
  assert.match(doc, /source-locus fingerprint boundary rows: 12/);
  assert.match(doc, /source-locus callable rows covered: 12/);
  assert.match(doc, /current fingerprint rows covered: 16/);
  assert.match(doc, /runtime source files fingerprinted: 14/);
  assert.match(doc, /audit\/test anchor files fingerprinted: 2/);
  assert.match(doc, /upstream line anchors covered: 38/);
  assert.match(doc, /committed source-owner map files: 0/);
  assert.match(doc, /runtime source-owner approvals: 0/);
  assert.match(doc, /runtime metric collector approvals: 0/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /implementation-ready source-locus fingerprint rows: 0/);
  assert.match(doc, /expected runtime audit tests: 4457/);
  assert.match(doc, /expected runtime audit pass: 4457/);
  assert.match(doc, /expected runtime audit fail: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const file of [...runtimeSourceFiles, ...auditAnchorFiles]) {
    assert.ok(doc.includes(file), `missing fingerprinted file ${file}`);
  }
});

test('source-locus fingerprint table matches current file bytes', () => {
  const doc = read(docPath);
  const rows = docFingerprintRows();

  assert.equal(rows.length, 16);
  for (const row of rows) {
    const expected = expectedFingerprints[row.file];
    assert.deepEqual(row, { file: row.file, ...expected }, `doc fingerprint drifted for ${row.file}`);
    const buffer = readBuffer(row.file);
    const source = buffer.toString('utf8');
    assert.equal(lineCount(source), expected.lines, `${row.file} line count drifted`);
    assert.equal(buffer.length, expected.bytes, `${row.file} byte count drifted`);
    assert.equal(sha256(row.file), expected.hash, `${row.file} hash drifted`);
    assert.ok(doc.includes(`| \`${row.file}\` | ${expected.lines} | ${expected.bytes} | \`${expected.hash}\` |`));
  }
});

test('source-locus fingerprint boundary preserves approval and artifact absence', () => {
  const doc = read(docPath);
  const sourceLocusCallable = read(sourceDocs.sourceLocusCallable);
  const sourceOwnerApproval = read(sourceDocs.sourceOwnerApproval);
  const sourceOwnerMapContract = read(sourceDocs.sourceOwnerMapContract);
  const collectorApproval = read(sourceDocs.collectorApproval);
  const collectorInsertion = read(sourceDocs.collectorInsertion);
  const implementationReadiness = read(sourceDocs.implementationReadiness);

  assert.equal(fs.existsSync(filePath(sourceOwnerMapPath)), false);
  assert.match(sourceLocusCallable, /line anchors covered: 38/);
  assert.match(sourceLocusCallable, /no source-owner approval exists/);
  assert.match(sourceOwnerApproval, /Runtime source-owner approvals: 0/);
  assert.match(sourceOwnerMapContract, /commit source-owner-map\.json now: NO-GO/);
  assert.match(collectorApproval, /0 runtime metric collector approvals/);
  assert.match(collectorInsertion, /runtime collector insertion points approved: 0/);
  assert.match(implementationReadiness, /First optimization implementation gate decision: NO-GO/);
  assert.match(doc, /runtime source-owner approval now: NO-GO/);
  assert.match(doc, /runtime metric collector approval now: NO-GO/);
  assert.match(doc, /commit source-owner-map\.json now: NO-GO/);
});

test('source-locus fingerprint future authority symbols are absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.equal(source.includes(token), false, `future authority token leaked into product source: ${token}`);
  }
});

test('source-locus fingerprint boundary is linked from ledgers and adjacent gates', () => {
  const requiredLinkFiles = {
    sourceLocusCallable: sourceDocs.sourceLocusCallable,
    sourceOwnerApproval: sourceDocs.sourceOwnerApproval,
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
