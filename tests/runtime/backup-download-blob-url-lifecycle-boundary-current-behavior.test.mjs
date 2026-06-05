import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKUP_DOWNLOAD_BLOB_URL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/background.js': [6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5'],
  'js/io_manager.js': [2030, 96914, 'd04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21'],
  'js/tab-view.js': [14584, 676581, '7f3de6750e95adb81bfdec5df53425427be86b08044a833bc0288bfe8cbe6e58']
};

const blockSpecs = {
  backgroundRevokeBlobUrl: {
    file: 'js/background.js',
    start: 'function revokeBackgroundBlobUrlLater(blobUrl, delayMs = 60000) {',
    end: 'function downloadWithBrowserApi',
    startLine: 725,
    lines: 10,
    bytes: 298,
    hash: 'd85a173fda417aca64d0b6f1be00d529f092e402e5757996ba306e9977337142'
  },
  backgroundDownloadWithBrowserApi: {
    file: 'js/background.js',
    start: 'function downloadWithBrowserApi(downloadOptions) {',
    end: 'async function createAutoBackupInBackground',
    startLine: 735,
    lines: 47,
    bytes: 1804,
    hash: '4960a2ef5ddf331992a6710efa0401f083cb81d3708747010d2b0e70b2f65819'
  },
  backgroundAutoBackupBlobDownload: {
    file: 'js/background.js',
    start: '    const jsonData = JSON.stringify(exportObject, null, 2);',
    end: '\n\n    if (!result.ok) {',
    startLine: 848,
    lines: 16,
    bytes: 637,
    hash: 'd49b03990155d3ee85efc9a9862d168bbc316fbd8d7655eaecdc4b7000369475'
  },
  ioRevokeDownloadBlobUrl: {
    file: 'js/io_manager.js',
    start: '    function revokeDownloadBlobUrlLater(blobUrl, delayMs = 60000) {',
    end: '\n\n    function downloadWithRuntimeApi',
    startLine: 48,
    lines: 9,
    bytes: 330,
    hash: '3795b2ece3edfcc4980ed14742a82bacae310a5e9b876017536d4240403a2891'
  },
  ioDownloadWithRuntimeApi: {
    file: 'js/io_manager.js',
    start: '    function downloadWithRuntimeApi(downloadOptions) {',
    end: '\n\n    function normalizeBool',
    startLine: 58,
    lines: 46,
    bytes: 1988,
    hash: 'd936f57b125a029f0e08efa03570ce11e23952a52498a395e8fa13f5cfaaa55e'
  },
  ioDirectoryProbeDownload: {
    file: 'js/io_manager.js',
    start: '    async function getBackupDirectory() {',
    end: '    /**\n     * Saves backup file using Chrome downloads API',
    startLine: 1875,
    lines: 40,
    bytes: 1791,
    hash: 'e49ec15eeb2a71db8778bb14ef1b49157b21aa836f201bddb7024495e6072882'
  },
  ioSaveBackupFile: {
    file: 'js/io_manager.js',
    start: '    async function saveBackupFile(data, filename, options = {}) {',
    end: '\n\n    /**\n     * Rotates backup files',
    startLine: 1937,
    lines: 29,
    bytes: 1269,
    hash: '162e600e6ecb4c9e86195f7bb1d363828182329079336bf9084fb47bae508b20'
  },
  tabRevokeBlobUrl: {
    file: 'js/tab-view.js',
    start: '    function revokeBlobUrlLater(blobUrl, delayMs = 60000) {',
    end: '\n\n    /**\n     * Fallback download via anchor click',
    startLine: 9038,
    lines: 10,
    bytes: 363,
    hash: '5c7be08580711c5ee2c0b3032728069e36dba664e228bdc8ac3d324d1f272f70'
  },
  tabDownloadViaAnchor: {
    file: 'js/tab-view.js',
    start: '    function downloadViaAnchor(blob, filename) {',
    end: '\n\n    function downloadJsonToDownloadsFolder',
    startLine: 9053,
    lines: 26,
    bytes: 956,
    hash: '6f04762a80c47f638df2adb986fb8ea0d376801426e095ecc285fe351b2405c5'
  },
  tabDownloadJsonToDownloadsFolder: {
    file: 'js/tab-view.js',
    start: '    function downloadJsonToDownloadsFolder(folder, filename, obj, options = {}) {',
    end: '\n\n\n    async function runExportV3()',
    startLine: 9080,
    lines: 40,
    bytes: 2028,
    hash: '95b1310ddf6fe63a1e058f1916c17506fb7d6e9868c4d0229f246becd61a74e1'
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
    hash: sha256(block),
    block
  };
}

function selectedSource() {
  return Object.keys(sourceFingerprints).map(read).join('\n');
}

test('backup download blob URL lifecycle doc records audit-only boundary', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior boundary/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /backup\/export download lifecycle/);
  assert.match(doc, /object URL creation/);
  assert.match(doc, /delayed object URL\s+revocation/);
  assert.match(doc, /backup download blob URL lifecycle source files pinned \| 3/);
  assert.match(doc, /backup download blob URL lifecycle source\/effect blocks pinned \| 10/);
  assert.match(doc, /selected removeFile tokens \| 0/);
  assert.match(doc, /selected clearObjectUrl tokens \| 0/);
});

test('source fingerprints for backup download blob URL files remain current', () => {
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

test('source effect block metrics for backup download blob URL paths remain current', () => {
  const doc = read(docPath);

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.equal(metric.hash, spec.hash, `${name} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(spec.file)}:${spec.startLine}\` \\| ${spec.startLine} \\| ${spec.lines.toLocaleString('en-US')} \\| ${spec.bytes.toLocaleString('en-US')} \\| \`${spec.hash}\` \\|`)
    );
  }
});

test('selected backup download blob URL token counts remain current', () => {
  const background = read('js/background.js');
  const ioManager = read('js/io_manager.js');
  const tabView = read('js/tab-view.js');
  const selected = selectedSource();
  const doc = read(docPath);

  const counts = {
    'selected URL.createObjectURL tokens': countLiteral(selected, 'URL.createObjectURL'),
    'selected URL.revokeObjectURL tokens': countLiteral(selected, 'URL.revokeObjectURL'),
    'selected Blob([ tokens': countLiteral(selected, 'Blob(['),
    'selected downloads.download tokens': countLiteral(selected, 'downloads.download'),
    'selected downloads.search tokens': countLiteral(selected, 'downloads.search'),
    'selected downloads.erase tokens': countLiteral(selected, 'downloads.erase'),
    'selected setTimeout tokens': countLiteral(selected, 'setTimeout('),
    'selected downloadViaAnchor tokens': countLiteral(selected, 'downloadViaAnchor'),
    'selected data:application/json tokens': countLiteral(selected, 'data:application/json'),
    'background URL.createObjectURL tokens': countLiteral(background, 'URL.createObjectURL'),
    'background data:application/json tokens': countLiteral(background, 'data:application/json'),
    'io_manager URL.createObjectURL tokens': countLiteral(ioManager, 'URL.createObjectURL'),
    'tab-view URL.createObjectURL tokens': countLiteral(tabView, 'URL.createObjectURL'),
    "tab-view document.createElement('a') tokens": countLiteral(tabView, "document.createElement('a')"),
    'tab-view document.body.appendChild(a) tokens': countLiteral(tabView, 'document.body.appendChild(a)'),
    'tab-view document.body.removeChild(a) tokens': countLiteral(tabView, 'document.body.removeChild(a)'),
    'selected removeFile tokens': countLiteral(selected, 'removeFile'),
    'selected clearObjectUrl tokens': countLiteral(selected, 'clearObjectUrl')
  };

  assert.deepEqual(counts, {
    'selected URL.createObjectURL tokens': 6,
    'selected URL.revokeObjectURL tokens': 6,
    'selected Blob([ tokens': 4,
    'selected downloads.download tokens': 8,
    'selected downloads.search tokens': 3,
    'selected downloads.erase tokens': 3,
    'selected setTimeout tokens': 26,
    'selected downloadViaAnchor tokens': 3,
    'selected data:application/json tokens': 1,
    'background URL.createObjectURL tokens': 2,
    'background data:application/json tokens': 1,
    'io_manager URL.createObjectURL tokens': 2,
    'tab-view URL.createObjectURL tokens': 2,
    "tab-view document.createElement('a') tokens": 2,
    'tab-view document.body.appendChild(a) tokens': 1,
    'tab-view document.body.removeChild(a) tokens': 1,
    'selected removeFile tokens': 0,
    'selected clearObjectUrl tokens': 0
  });

  for (const [label, count] of Object.entries(counts)) {
    assert.match(doc, new RegExp(`${escapeRegExp(label)} \\| ${count}`), `doc missing token count ${label}`);
  }
});

test('background download lifecycle keeps current object URL and API branch behavior', () => {
  const revoke = blockMetric(blockSpecs.backgroundRevokeBlobUrl).block;
  const wrapper = blockMetric(blockSpecs.backgroundDownloadWithBrowserApi).block;
  const backup = blockMetric(blockSpecs.backgroundAutoBackupBlobDownload).block;

  assert.match(revoke, /delayMs = 60000/);
  assert.match(revoke, /typeof URL\.revokeObjectURL !== 'function'/);
  assert.match(revoke, /setTimeout\(\(\) => \{/);
  assert.match(revoke, /URL\.revokeObjectURL\(blobUrl\)/);

  assert.match(wrapper, /reason: 'downloads_unavailable'/);
  assert.match(wrapper, /let settled = false/);
  assert.match(wrapper, /if \(settled\) return/);
  assert.match(wrapper, /if \(IS_FIREFOX\)/);
  assert.match(wrapper, /browserAPI\.runtime\?\.lastError/);
  assert.doesNotMatch(wrapper, /setTimeout|AbortController|timeoutMs|downloadTimeout/);

  assert.match(backup, /const jsonData = JSON\.stringify\(exportObject, null, 2\)/);
  assert.match(backup, /typeof URL !== 'undefined' && typeof URL\.createObjectURL === 'function'/);
  assert.match(backup, /URL\.createObjectURL\(new Blob\(\[jsonData\], \{ type: 'application\/json' \}\)\)/);
  assert.match(backup, /data:application\/json;charset=utf-8/);
  assert.match(backup, /downloadWithBrowserApi\(\{/);
  assert.match(backup, /revokeBackgroundBlobUrlLater\(downloadUrl\)/);
  assert.doesNotMatch(backup, /finally|downloadViaAnchor|removeFile/);
});

test('IO manager download lifecycle keeps probe and save behavior', () => {
  const revoke = blockMetric(blockSpecs.ioRevokeDownloadBlobUrl).block;
  const wrapper = blockMetric(blockSpecs.ioDownloadWithRuntimeApi).block;
  const probe = blockMetric(blockSpecs.ioDirectoryProbeDownload).block;
  const save = blockMetric(blockSpecs.ioSaveBackupFile).block;

  assert.match(revoke, /delayMs = 60000/);
  assert.match(revoke, /URL\.revokeObjectURL\(blobUrl\)/);
  assert.match(wrapper, /Downloads API unavailable/);
  assert.match(wrapper, /let settled = false/);
  assert.match(wrapper, /IS_FIREFOX_IO_MANAGER/);
  assert.match(wrapper, /runtimeAPI\.runtime\?\.lastError/);
  assert.doesNotMatch(wrapper, /setTimeout|AbortController|timeoutMs|downloadTimeout/);

  assert.match(probe, /const testPath = 'FilterTube Backup\/\.test'/);
  assert.match(probe, /URL\.createObjectURL\(new Blob\(\['test'\], \{ type: 'text\/plain' \}\)\)/);
  assert.match(probe, /downloadWithRuntimeApi\(\{/);
  assert.match(probe, /revokeDownloadBlobUrlLater\(blobUrl\)/);
  assert.match(probe, /runtimeAPI\.downloads\.erase\(\{ id: result\.downloadId \}\)/);

  assert.match(save, /const jsonData = JSON\.stringify\(data, null, 2\)/);
  assert.match(save, /const blobUrl = URL\.createObjectURL\(new Blob\(\[jsonData\], \{ type: 'application\/json' \}\)\)/);
  assert.match(save, /const backupDir = await getBackupDirectory\(\)/);
  assert.match(save, /downloadWithRuntimeApi\(\{/);
  assert.match(save, /revokeDownloadBlobUrlLater\(blobUrl\)/);
  assert.doesNotMatch(`${probe}\n${save}`, /finally|removeFile|downloadTimeout/);
});

test('tab-view download lifecycle keeps anchor fallback and delayed cleanup behavior', () => {
  const revoke = blockMetric(blockSpecs.tabRevokeBlobUrl).block;
  const anchor = blockMetric(blockSpecs.tabDownloadViaAnchor).block;
  const download = blockMetric(blockSpecs.tabDownloadJsonToDownloadsFolder).block;

  assert.match(revoke, /delayMs = 60000/);
  assert.match(revoke, /URL\.revokeObjectURL\(blobUrl\)/);
  assert.match(anchor, /const blobUrl = URL\.createObjectURL\(blob\)/);
  assert.match(anchor, /const a = document\.createElement\('a'\)/);
  assert.match(anchor, /document\.body\.appendChild\(a\)/);
  assert.match(anchor, /a\.click\(\)/);
  assert.match(anchor, /document\.body\.removeChild\(a\)/);
  assert.match(anchor, /\}, 2000\)/);
  assert.match(anchor, /revokeBlobUrlLater\(blobUrl\)/);
  assert.match(anchor, /\}, 250\)/);

  assert.match(download, /const json = JSON\.stringify\(obj, null, 2\)/);
  assert.match(download, /const blob = new Blob\(\[json\], \{ type: 'application\/json' \}\)/);
  assert.match(download, /preferAnchor === true/);
  assert.match(download, /IS_FIREFOX_TAB_VIEW/);
  assert.match(download, /downloadViaAnchor\(blob, filename\)\.then\(resolve\)\.catch\(reject\)/);
  assert.match(download, /const blobUrl = URL\.createObjectURL\(blob\)/);
  assert.match(download, /runtimeAPI\.downloads\.download\(\{/);
  assert.match(download, /revokeBlobUrlLater\(blobUrl\)/);
  assert.match(download, /Downloads API failed, using anchor fallback/);
  assert.match(download, /downloadViaAnchor\(blob, filename\)/);
  assert.doesNotMatch(download, /downloadWithRuntimeApi|downloadWithBrowserApi|removeFile/);
});

test('backup download blob URL lifecycle authority symbols are absent from selected runtime source', () => {
  const doc = read(docPath);
  const selected = selectedSource();
  const authorities = [
    'backupDownloadBlobUrlLifecycleContract',
    'backupDownloadObjectUrlRegistry',
    'backupDownloadRevokePolicy',
    'backupDownloadApiResultReport',
    'backupDownloadAnchorFallbackPolicy',
    'backupDownloadProbePolicy',
    'backupDownloadFilesystemDeletionProof',
    'backupDownloadTimeoutBudget',
    'backupDownloadErrorClassificationReport',
    'backupDownloadCleanupMetricArtifact'
  ];

  for (const authority of authorities) {
    assert.ok(doc.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(selected, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in selected runtime source`);
  }
});
