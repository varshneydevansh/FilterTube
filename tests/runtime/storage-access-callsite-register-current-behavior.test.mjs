import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STORAGE_ACCESS_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md';

const sourceFingerprints = {
  'js/background.js': [6803, 306710, '57ddc6c3e31112c30734ede78c9b37b01bd31533fc8a1d16856b13d2b295f0d7'],
  'js/content/bridge_settings.js': [1127, 44545, 'fad07aba48391021d5e42096b34f32c58a6337a1a4d303a8706927c541d47f71'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/io_manager.js': [2030, 96914, 'd04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/tab-view.js': [14926, 695872, '5cdae945aca165b11af3c3f9fc246e89da3ce6780939013081e5d035b4163323']
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function storageFiles() {
  return git([
    'ls-files',
    '*.js',
    '*.mjs',
    ':(exclude)docs/**',
    ':(exclude)tests/**'
  ])
    .filter(file => !file.includes('/vendor/'));
}

function scanRows(patterns, family) {
  const rows = [];
  for (const file of storageFiles()) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**')) return;
      for (const [operation, regex] of patterns) {
        regex.lastIndex = 0;
        if (regex.test(line)) {
          rows.push({ family, file, line: index + 1, operation, text: trimmed });
        }
      }
    });
  }
  return rows;
}

function directRows() {
  const patterns = [
    ['local.get', /(?:browserAPI|browserAPI_BRIDGE|chrome|runtimeAPI)\.storage\.local\.get\b|STORAGE_NAMESPACE\??\.get\b/],
    ['local.set', /(?:browserAPI|browserAPI_BRIDGE|chrome|runtimeAPI)\.storage\.local\.set\b|STORAGE_NAMESPACE\??\.set\b/],
    ['local.remove', /(?:browserAPI|browserAPI_BRIDGE|chrome|runtimeAPI)\.storage\.local\.remove\b|STORAGE_NAMESPACE\??\.remove\b/],
    ['onChanged.addListener', /(?:browserAPI|browserAPI_BRIDGE|chrome)\.storage\.onChanged\.addListener\b/]
  ];
  return scanRows(patterns, 'direct').filter(row => (
    !/^async function\s+(readStorage|writeStorage)|^function\s+storageGet/.test(row.text)
  ));
}

function wrapperRows() {
  const patterns = [
    ['storageGet', /\bstorageGet\s*\(/],
    ['readStorage', /\breadStorage\s*\(/],
    ['writeStorage', /\bwriteStorage\s*\(/]
  ];
  return scanRows(patterns, 'wrapper').filter(row => (
    !/^async function\s+(readStorage|writeStorage)\s*\(|^function\s+storageGet\s*\(/.test(row.text)
  ));
}

function storagePayloadShape(row) {
  const text = row.text;
  if (row.operation === 'local.get' || row.operation === 'storageGet' || row.operation === 'readStorage') return 'read';
  if (row.operation === 'onChanged.addListener') return 'listener';
  if (/\{\s*\[[^\]]+\]/.test(text)) return 'inline-computed-key-write';
  if (/\.set\s*\(\s*\{/.test(text) || /writeStorage\s*\(\s*\{/.test(text)) return 'inline-object-write';
  if (/\.set\s*\(\s*[A-Za-z_$][\w$]*\s*[),]/.test(text) || /writeStorage\s*\(\s*[A-Za-z_$][\w$]*\s*[),]/.test(text)) {
    return 'named-payload-write';
  }
  return 'other-write';
}

function storageOwnerLayer(file) {
  if (file === 'js/background.js') return 'background';
  if (file.startsWith('js/content') || file === 'js/content_bridge.js' || file === 'js/injector.js' || file === 'js/seed.js') return 'content-runtime';
  if (file === 'js/io_manager.js') return 'io-import-export';
  if (file === 'js/settings_shared.js' || file === 'js/state_manager.js' || file === 'js/tab-view.js' || file === 'js/popup.js') return 'ui-settings';
  return 'other';
}

function countStorageOwnerLayerRows(rows) {
  const out = {};
  for (const row of rows) {
    const layer = storageOwnerLayer(row.file);
    out[layer] ||= { read: 0, write: 0, listener: 0, total: 0 };
    const shape = storagePayloadShape(row);
    if (shape === 'read') out[layer].read += 1;
    else if (shape === 'listener') out[layer].listener += 1;
    else out[layer].write += 1;
    out[layer].total += 1;
  }
  return Object.fromEntries(Object.entries(out).sort());
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function assertStorageCacheWritePressureSnapshot(text) {
  const direct = directRows();
  const wrappers = wrapperRows();
  const writeRows = [
    ...direct.filter(row => row.operation === 'local.set'),
    ...wrappers.filter(row => row.operation === 'writeStorage')
  ];
  const listenerRows = direct.filter(row => row.operation === 'onChanged.addListener');
  const mapCacheRows = [
    ['channelMapFlushWrite', 'js/background.js', 1481, 'local.set'],
    ['videoChannelMapFlushWrite', 'js/background.js', 1604, 'local.set'],
    ['videoMetaMapFlushWrite', 'js/background.js', 1626, 'local.set'],
    ['backgroundChannelMapDirectWrite', 'js/background.js', 4332, 'local.set'],
    ['addChannelCustomUrlMapWrite', 'js/background.js', 6041, 'local.set'],
    ['addChannelHandleMapWrite', 'js/background.js', 6066, 'local.set'],
    ['subscriptionImportChannelMapWrite', 'js/content_bridge.js', 5933, 'local.set'],
    ['nanahChannelMapMergeWrite', 'js/io_manager.js', 1688, 'writeStorage']
  ];

  assert.match(text, /Storage Cache Write-Pressure Snapshot - 2026-05-27/);
  assert.match(text, /write-capable storage rows: 40/);
  assert.match(text, /direct local\.set rows: 33/);
  assert.match(text, /wrapper writeStorage rows: 7/);
  assert.match(text, /storage change listener rows: 3/);
  assert.match(text, /map\/cache write labels pinned: 8/);
  assert.match(text, /shared storage key authority present: no/);
  assert.match(text, /shared storage write revision contract present: no/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
  assert.match(text, /source-pinned risk ledger, not a storage optimization or\s+cleanup approval/);
  assert.equal(writeRows.length, 40);
  assert.equal(listenerRows.length, 3);

  for (const [label, file, line, operation] of mapCacheRows) {
    assert.ok(
      [...direct, ...wrappers].some(row => (
        row.file === file &&
        row.line === line &&
        row.operation === operation
      )),
      `missing source row for ${label}`
    );
    assert.ok(text.includes(`| \`${label}\` | \`${file}:${line}:${operation}\` |`), `missing map/cache row ${label}`);
  }
}

function assertStoragePayloadShapeAndOwnerLayerSnapshot(text) {
  const rows = [...directRows(), ...wrapperRows()];

  assert.match(text, /Storage Payload Shape and Owner Layer Addendum - 2026-05-27/);
  assert.match(text, /storage access rows classified by payload shape: 84/);
  assert.match(text, /read rows: 41/);
  assert.match(text, /write rows: 40/);
  assert.match(text, /listener rows: 3/);
  assert.match(text, /inline object writes: 17/);
  assert.match(text, /named payload writes: 15/);
  assert.match(text, /inline computed-key writes: 8/);
  assert.match(text, /layered write owners: background 24, content-runtime 2, io-import-export 8, ui-settings 6/);
  assert.match(text, /storage payload\/layer authority: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
  assert.deepEqual(countBy(rows.map(row => ({ shape: storagePayloadShape(row) })), 'shape'), {
    'inline-computed-key-write': 8,
    'inline-object-write': 17,
    listener: 3,
    'named-payload-write': 15,
    read: 41
  });
  assert.deepEqual(countStorageOwnerLayerRows(rows), {
    background: { read: 27, write: 24, listener: 1, total: 52 },
    'content-runtime': { read: 5, write: 2, listener: 1, total: 8 },
    'io-import-export': { read: 5, write: 8, listener: 0, total: 13 },
    'ui-settings': { read: 4, write: 6, listener: 1, total: 11 }
  });

  for (const phrase of [
    '| `named-payload-write` | 15 |',
    '| `inline-computed-key-write` | 8 |',
    '| `background` | 27 | 24 | 1 | 52 |',
    '| `content-runtime` | 5 | 2 | 1 | 8 |',
    '| `io-import-export` | 5 | 8 | 0 | 13 |',
    '| `ui-settings` | 4 | 6 | 1 | 11 |',
    'Named-payload and computed-key writes are the highest schema-proof burden',
    'The three listener rows do not share one dirty-key report'
  ]) {
    assert.ok(text.includes(phrase), `missing storage payload/layer phrase ${phrase}`);
  }
}

test('storage access callsite register is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /tracked non-vendor JavaScript files with current storage access: 8/);
  assert.match(text, /raw direct storage rows: 57/);
  assert.match(text, /wrapper callsite rows: 27/);
  assert.match(text, /combined current storage access rows: 84/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for settings-mode authority/);
  assertStorageCacheWritePressureSnapshot(text);
  assertStoragePayloadShapeAndOwnerLayerSnapshot(text);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('storage access callsite counts remain source-derived', () => {
  const text = doc();
  const direct = directRows();
  const wrappers = wrapperRows();

  assert.equal(direct.length, 57);
  assert.equal(wrappers.length, 27);
  assert.deepEqual(countBy(direct, 'file'), {
    'js/background.js': 36,
    'js/content/bridge_settings.js': 1,
    'js/content/handle_resolver.js': 1,
    'js/content_bridge.js': 6,
    'js/io_manager.js': 2,
    'js/settings_shared.js': 8,
    'js/state_manager.js': 1,
    'js/tab-view.js': 2
  });
  assert.deepEqual(countBy(wrappers, 'file'), {
    'js/background.js': 16,
    'js/io_manager.js': 11
  });
  assert.deepEqual(countBy(direct, 'operation'), {
    'local.get': 21,
    'local.set': 33,
    'onChanged.addListener': 3
  });
  assert.deepEqual(countBy(wrappers, 'operation'), {
    readStorage: 4,
    storageGet: 16,
    writeStorage: 7
  });

  for (const row of [...direct, ...wrappers]) {
    assert.ok(
      text.includes(`${row.file}:${row.line}:${row.operation}:`),
      `missing storage access row ${row.file}:${row.line}:${row.operation}`
    );
  }
});

test('storage access register records current split owners and risk boundaries', () => {
  const text = doc();

  assert.match(text, /backgroundCacheInvalidationListener/);
  assert.match(text, /contentSettingsRefreshListener/);
  assert.match(text, /dashboardExternalReloadListener/);
  assert.match(text, /compiledSettingsReadPathWrite/);
  assert.match(text, /channelMapFlushWrite/);
  assert.match(text, /videoChannelMapFlushWrite/);
  assert.match(text, /videoMetaMapFlushWrite/);
  assert.match(text, /subscriptionImportChannelMapWrite/);
  assert.match(text, /nanahChannelMapMergeWrite/);
  assert.match(text, /nanahTrustedLinkWrite/);
  assert.match(text, /Several writes are payload-shaped/);
  assert.match(text, /Dashboard Nanah trusted-link helpers use a dynamic `\[key\]` storage shape/);
  assert.match(text, /listener key sets and wrapper owners are local decisions/);
  assert.match(text, /Map-only fast paths exist locally/);
  assert.match(text, /Future Proof Fields/);
  assert.match(text, /storageAccessReference/);
  assert.match(text, /dynamicKeyPolicy/);
  assert.match(text, /readPathWriteDecision/);
  assert.match(text, /noWorkBudget/);
});

test('storage access authority symbols do not exist in product storage source yet', () => {
  const productSource = Object.keys(sourceFingerprints).map(read).join('\n');
  const missingSymbols = [
    'storageAccessCallsiteAuthority',
    'storageOperationEffectReport',
    'storageKeySchemaManifest',
    'storageKeyStaticDynamicClassifier',
    'storageListenerParityReport',
    'storageWriteRevisionContract',
    'storageReadPathMutationReport',
    'storageWrapperParityContract',
    'storageMapOnlyBudget',
    'storageSettingsModeGate'
  ];

  for (const symbol of missingSymbols) {
    assert.doesNotMatch(productSource, new RegExp(`\\b${symbol}\\b`));
    assert.match(doc(), new RegExp(`\\b${symbol}\\b`));
  }
});
