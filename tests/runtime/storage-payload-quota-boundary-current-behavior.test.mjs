import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STORAGE_PAYLOAD_QUOTA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/background.js': [6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
  'js/io_manager.js': [2030, 96914, 'd04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21'],
  'js/nanah_sync_adapter.js': [433, 17072, '8094261e6fb9fa72a86e6e79e8614bf18b93134f54dcca7327114b5410447824'],
  'js/tab-view.js': [11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6']
};

const blockSpecs = {
  backgroundRotateAutoBackups: {
    file: 'js/background.js',
    start: "function rotateAutoBackups(keepCount = 10, label = '') {",
    end: 'function revokeBackgroundBlobUrlLater(blobUrl, delayMs = 60000) {',
    startLine: 680,
    lines: 45,
    bytes: 1681
  },
  backgroundCreateAutoBackup: {
    file: 'js/background.js',
    start: 'async function createAutoBackupInBackground(triggerType, options = {}) {',
    end: 'function scheduleAutoBackupInBackground(triggerType, options = {}, delay = 1000) {',
    startLine: 782,
    lines: 97,
    bytes: 3751
  },
  backgroundMapCacheCluster: {
    file: 'js/background.js',
    start: 'function ensureChannelMapCache() {',
    end: 'function enqueueVideoChannelMapUpdate(videoId, channelId) {',
    startLine: 1452,
    lines: 196,
    bytes: 6514
  },
  ioWriteStorage: {
    file: 'js/io_manager.js',
    start: 'async function writeStorage(payload) {',
    end: '    /**\n     * Reads the serialized profile object',
    startLine: 421,
    lines: 14,
    bytes: 473
  },
  ioExportV3: {
    file: 'js/io_manager.js',
    start: "async function exportV3({ scope = 'auto', auth = null } = {}) {",
    end: "async function importV3(json, { strategy = 'merge', scope = 'auto', auth = null, targetProfileId = null } = {}) {",
    startLine: 1146,
    lines: 96,
    bytes: 3941
  },
  ioCreateAutoBackup: {
    file: 'js/io_manager.js',
    start: 'async function createAutoBackup(triggerType, options = {}) {',
    end: '    /**\n     * Determines the best backup directory location',
    startLine: 1782,
    lines: 89,
    bytes: 4063
  },
  ioSaveBackupFile: {
    file: 'js/io_manager.js',
    start: 'async function saveBackupFile(data, filename, options = {}) {',
    end: '    /**\n     * Rotates backup files',
    startLine: 1922,
    lines: 30,
    bytes: 1267
  },
  ioRotateBackups: {
    file: 'js/io_manager.js',
    start: 'async function rotateBackups(keepCount = 10) {',
    end: '    /**\n     * Schedules a backup',
    startLine: 1956,
    lines: 34,
    bytes: 1377
  },
  nanahBuildPortablePayload: {
    file: 'js/nanah_sync_adapter.js',
    start: "async function buildPortablePayload({ scope = 'active', auth = null } = {}) {",
    end: 'async function buildSyncEnvelope',
    startLine: 307,
    lines: 16,
    bytes: 633
  },
  nanahBuildSyncEnvelope: {
    file: 'js/nanah_sync_adapter.js',
    start: "async function buildSyncEnvelope({ scope = 'active', auth = null } = {}) {",
    end: 'async function buildControlProposal',
    startLine: 322,
    lines: 13,
    bytes: 397
  },
  nanahBuildControlProposal: {
    file: 'js/nanah_sync_adapter.js',
    start: "async function buildControlProposal({ scope = 'active', strategy = 'merge', auth = null } = {}) {",
    end: 'function extractPortableFromEnvelope',
    startLine: 334,
    lines: 20,
    bytes: 742
  },
  tabParseNanahEnvelopeDetails: {
    file: 'js/tab-view.js',
    start: 'function parseNanahEnvelopeDetails(envelope) {',
    end: 'function shouldAutoApplyNanahProposal',
    startLine: 7593,
    lines: 50,
    bytes: 2632
  },
  tabAttachNanahProposalPolicy: {
    file: 'js/tab-view.js',
    start: 'function attachNanahProposalPolicy(envelope, policy) {',
    end: 'function resolveTrustedNanahManagedApply',
    startLine: 7740,
    lines: 23,
    bytes: 1050
  },
  statePersistChannelMap: {
    file: 'js/state_manager.js',
    start: 'async function persistChannelMap(channelId, channelHandle) {',
    end: '    // ============================================================================\n    // CHECKBOX SETTINGS',
    startLine: 1995,
    lines: 15,
    bytes: 464
  }
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec.start, spec.end);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    block
  };
}

function selectedSource() {
  return Object.keys(sourceFingerprints).map(read).join('\n');
}

test('storage payload quota doc records audit-only boundary', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior boundary/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /storage payload and quota-adjacent behavior/);
  assert.match(doc, /settings export\/import, automatic backups, learned identity maps, and Nanah\s+sync envelopes/);
  assert.match(doc, /storage payload quota boundary source files pinned \| 5/);
  assert.match(doc, /storage payload quota source\/effect blocks pinned \| 14/);
  assert.match(doc, /selected getBytesInUse tokens \| 0/);
  assert.match(doc, /selected QUOTA tokens \| 0/);
});

test('source fingerprints for storage payload quota files remain current', () => {
  const doc = read(docPath);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('source effect block metrics for storage payload quota paths remain current', () => {
  const doc = read(docPath);

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(spec.file)}:${spec.startLine}\` \\| ${spec.startLine} \\| ${spec.lines.toLocaleString('en-US')} \\| ${spec.bytes.toLocaleString('en-US')} \\|`)
    );
  }
});

test('selected storage payload quota token counts remain current', () => {
  const doc = read(docPath);
  const selected = [
    ['background storage.local.set tokens | 24', 'js/background.js', 'storage.local.set', 24],
    ['background storage.local.get tokens | 11', 'js/background.js', 'storage.local.get', 11],
    ['background runtime.lastError tokens | 14', 'js/background.js', 'runtime.lastError', 14],
    ['background JSON.stringify tokens | 5', 'js/background.js', 'JSON.stringify', 5],
    ['background Blob([ tokens | 1', 'js/background.js', 'Blob([', 1],
    ['background downloads.download tokens | 4', 'js/background.js', 'downloads.download', 4],
    ['background downloads.search tokens | 2', 'js/background.js', 'downloads.search', 2],
    ['background downloads.erase tokens | 1', 'js/background.js', 'downloads.erase', 1],
    ['background channelMap tokens | 93', 'js/background.js', 'channelMap', 93],
    ['background videoChannelMap tokens | 46', 'js/background.js', 'videoChannelMap', 46],
    ['background videoMetaMap tokens | 40', 'js/background.js', 'videoMetaMap', 40],
    ['io_manager storage.local.set tokens | 1', 'js/io_manager.js', 'storage.local.set', 1],
    ['io_manager storage.local.get tokens | 1', 'js/io_manager.js', 'storage.local.get', 1],
    ['io_manager JSON.stringify tokens | 1', 'js/io_manager.js', 'JSON.stringify', 1],
    ['io_manager Blob([ tokens | 2', 'js/io_manager.js', 'Blob([', 2],
    ['io_manager downloads.download tokens | 3', 'js/io_manager.js', 'downloads.download', 3],
    ['io_manager downloads.search tokens | 1', 'js/io_manager.js', 'downloads.search', 1],
    ['io_manager downloads.erase tokens | 2', 'js/io_manager.js', 'downloads.erase', 2],
    ['io_manager backup tokens | 43', 'js/io_manager.js', 'backup', 43],
    ['nanah_sync_adapter JSON.stringify tokens | 3', 'js/nanah_sync_adapter.js', 'JSON.stringify', 3],
    ['nanah_sync_adapter JSON.parse tokens | 3', 'js/nanah_sync_adapter.js', 'JSON.parse', 3],
    ['nanah_sync_adapter payload tokens | 18', 'js/nanah_sync_adapter.js', 'payload', 18],
    ['tab-view JSON.stringify tokens | 5', 'js/tab-view.js', 'JSON.stringify', 5],
    ['tab-view JSON.parse tokens | 4', 'js/tab-view.js', 'JSON.parse', 4],
    ['tab-view Blob([ tokens | 1', 'js/tab-view.js', 'Blob([', 1],
    ['tab-view downloads.download tokens | 1', 'js/tab-view.js', 'downloads.download', 1],
    ['tab-view payload tokens | 36', 'js/tab-view.js', 'payload', 36],
    ['state_manager channelMap tokens | 14', 'js/state_manager.js', 'channelMap', 14]
  ];

  for (const [docLine, file, token, expected] of selected) {
    assert.equal(countLiteral(read(file), token), expected, `${file} ${token} count drifted`);
    assert.match(doc, new RegExp(escapeRegExp(docLine)));
  }

  const source = selectedSource();
  assert.equal(countLiteral(source, 'getBytesInUse'), 0);
  assert.equal(countLiteral(source, 'QUOTA'), 0);
}
);

test('background map caps are entry count caps not storage byte budgets', () => {
  const block = blockMetric(blockSpecs.backgroundMapCacheCluster).block;

  assert.match(block, /await browserAPI\.storage\.local\.set\(\{ channelMap: map \}\)/);
  assert.match(block, /await browserAPI\.storage\.local\.set\(\{ videoChannelMap: map \}\)/);
  assert.match(block, /await browserAPI\.storage\.local\.set\(\{ videoMetaMap: map \}\)/);
  assert.match(block, /if \(keys\.length <= 1000\) return/);
  assert.match(block, /keys\.slice\(0, 100\)\.forEach/);
  assert.match(block, /const MAX_VIDEO_META_ENTRIES = 2000/);
  assert.match(block, /const EVICT_COUNT = 500/);
  assert.match(block, /keys\.slice\(0, EVICT_COUNT\)\.forEach/);
  assert.doesNotMatch(block, /getBytesInUse|QUOTA|byteLength|JSON\.stringify\(map\)|storagePayloadByteBudgetReport|storageMapEntryAndByteCapPolicy/);
});

test('backup export paths stringify entire payloads without payload byte budget', () => {
  const backgroundBackup = blockMetric(blockSpecs.backgroundCreateAutoBackup).block;
  const ioExport = blockMetric(blockSpecs.ioExportV3).block;
  const ioBackup = blockMetric(blockSpecs.ioCreateAutoBackup).block;
  const ioSave = blockMetric(blockSpecs.ioSaveBackupFile).block;
  const backgroundRotation = blockMetric(blockSpecs.backgroundRotateAutoBackups).block;
  const ioRotation = blockMetric(blockSpecs.ioRotateBackups).block;

  assert.match(backgroundBackup, /const jsonData = JSON\.stringify\(exportObject, null, 2\)/);
  assert.match(backgroundBackup, /new Blob\(\[jsonData\], \{ type: 'application\/json' \}\)/);
  assert.match(backgroundBackup, /`data:application\/json;charset=utf-8,\$\{encodeURIComponent\(jsonData\)\}`/);
  assert.match(ioExport, /return buildV3Export/);
  assert.match(ioBackup, /const backupData = buildV3Export/);
  assert.match(ioSave, /const jsonData = JSON\.stringify\(data, null, 2\)/);
  assert.match(ioSave, /new Blob\(\[jsonData\], \{ type: 'application\/json' \}\)/);
  assert.match(backgroundRotation, /limit: 100/);
  assert.match(backgroundRotation, /const toDelete = backups\.slice\(keepCount\)/);
  assert.match(ioRotation, /limit: 100/);
  assert.match(ioRotation, /const toDelete = backupFiles\.slice\(keepCount\)/);

  for (const block of [backgroundBackup, ioExport, ioBackup, ioSave, backgroundRotation, ioRotation]) {
    assert.doesNotMatch(block, /getBytesInUse|QUOTA|byteLength|storageBackupPayloadBudget|storageBackupRotationByteReport|storagePayloadByteBudgetReport/);
  }
});

test('nanah envelopes stringify payloads without size or quota gate', () => {
  const buildPortable = blockMetric(blockSpecs.nanahBuildPortablePayload).block;
  const syncEnvelope = blockMetric(blockSpecs.nanahBuildSyncEnvelope).block;
  const controlProposal = blockMetric(blockSpecs.nanahBuildControlProposal).block;
  const parseDetails = blockMetric(blockSpecs.tabParseNanahEnvelopeDetails).block;
  const attachPolicy = blockMetric(blockSpecs.tabAttachNanahProposalPolicy).block;

  assert.match(buildPortable, /const payload = \(normalizedScope === 'main' \|\| normalizedScope === 'kids'\)/);
  assert.match(syncEnvelope, /payload: JSON\.stringify\(built\.portable\)/);
  assert.match(controlProposal, /payload: JSON\.stringify\(\{/);
  assert.match(parseDetails, /const parsed = safeObject\(JSON\.parse\(root\.payload\)\)/);
  assert.match(parseDetails, /portable: JSON\.parse\(root\.payload\)/);
  assert.match(attachPolicy, /const parsed = safeObject\(JSON\.parse\(root\.payload\)\)/);
  assert.match(attachPolicy, /root\.payload = JSON\.stringify\(parsed\)/);

  for (const block of [buildPortable, syncEnvelope, controlProposal, parseDetails, attachPolicy]) {
    assert.doesNotMatch(block, /getBytesInUse|QUOTA|byteLength|storageNanahEnvelopeSizePolicy|storagePayloadByteBudgetReport/);
  }
});

test('storage write paths lack shared quota authority symbols', () => {
  const doc = read(docPath);
  const source = selectedSource();
  const ioWrite = blockMetric(blockSpecs.ioWriteStorage).block;
  const statePersist = blockMetric(blockSpecs.statePersistChannelMap).block;

  assert.match(ioWrite, /STORAGE_NAMESPACE\.set\(payload/);
  assert.match(ioWrite, /chrome\?\.runtime\?\.lastError/);
  assert.match(statePersist, /await chrome\.storage\?\.local\.set\(\{ channelMap: state\.channelMap \}\)/);
  assert.doesNotMatch(statePersist, /getBytesInUse|QUOTA|storagePayloadByteBudgetReport/);

  for (const missing of [
    'storagePayloadQuotaBoundaryContract',
    'storagePayloadByteBudgetReport',
    'storageGetBytesInUsePreflight',
    'storageQuotaErrorClassifier',
    'storageMapEntryAndByteCapPolicy',
    'storageBackupPayloadBudget',
    'storageNanahEnvelopeSizePolicy',
    'storageExportImportPayloadManifest',
    'storageBackupRotationByteReport',
    'storageQuotaFixtureProvenance'
  ]) {
    assert.match(doc, new RegExp(escapeRegExp(missing)));
    assert.doesNotMatch(source, new RegExp(escapeRegExp(missing)));
  }
});
