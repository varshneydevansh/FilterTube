import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MESSAGE_TRANSPORT_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/background.js': [6789, 306239, '618e41011a6031c7a4eb3d022c4612536942a7a58a3c41eb0fd7e31c29a60311'],
  'js/content/bridge_injection.js': [127, 4741, 'd1b84cf4c43ec5ff5cdc3bd607d8f3d3bf448c12829780b0d05fb9fc14fb5d3e'],
  'js/content/bridge_settings.js': [1113, 44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853'],
  'js/content/collab_dialog.js': [393, 14623, 'dc34bba556b310da8b7516d106e9d67addea59d8a707a02f21607ac97af1f72a'],
  'js/content/first_run_prompt.js': [190, 7453, '5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content/release_notes_prompt.js': [250, 9866, '30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/injector.js': [3593, 155830, '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04'],
  'js/managed_admin_authority.js': [171, 7314, 'c9355520ba9779c0b94b67cf67a68c446b84ea4532995d83ef52a3e708a975aa'],
  'js/popup.js': [1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/tab-view.js': [14933, 696285, '7bad04c75b1c2c31748d8796ec1c4a350077cecf9a135cb848ea1d6573cf7a1f']
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
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

function productScriptFiles() {
  return git(['ls-files', '*.js', '*.mjs', '*.jsx'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.includes('/vendor/'));
}

function transportRows() {
  const patterns = [
    ['runtime.onMessage.addListener', /(?:browserAPI|browserAPI_BRIDGE|chrome|runtimeAPI|api)\.runtime\.onMessage\.addListener\s*\(/],
    ['runtime.sendMessage', /(?:browserAPI|browserAPI_BRIDGE|chrome|runtimeAPI|api|runtimeApi)\.runtime\.sendMessage\s*\(/],
    ['tabs.sendMessage', /(?:browserAPI|chrome|runtimeAPI)\.tabs\.sendMessage\s*\(|\btabsApi\.sendMessage\s*\(/],
    ['window.postMessage', /\bwindow\.postMessage\s*\(/],
    ['window.addEventListener(message)', /\bwindow\.addEventListener\s*\(\s*['"]message['"]/]
  ];
  const rows = [];

  for (const file of productScriptFiles()) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**')) return;
      for (const [operation, regex] of patterns) {
        regex.lastIndex = 0;
        if (regex.test(line)) {
          rows.push({ file, line: index + 1, operation, text: trimmed });
        }
      }
    });
  }

  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function messageDirection(row) {
  return row.operation.includes('addListener') || row.operation.includes('addEventListener') ? 'receiver' : 'sender';
}

function messageBoundary(row) {
  if (row.operation.startsWith('runtime.')) return 'extension-runtime';
  if (row.operation.startsWith('tabs.')) return 'tab-message';
  if (row.operation.startsWith('window.')) return 'page-message';
  return 'other';
}

function messageOwnerLayer(file) {
  if (file === 'js/background.js') return 'background';
  if (file === 'js/content_bridge.js') return 'isolated-content-runtime';
  if (file.startsWith('js/content/')) return 'isolated-content-runtime';
  if (file === 'js/injector.js' || file === 'js/seed.js' || file === 'js/filter_logic.js') return 'main-world-page-runtime';
  if (file === 'js/popup.js' || file === 'js/tab-view.js' || file === 'js/state_manager.js') return 'extension-ui-state';
  return 'other';
}

function assertMessageSenderReceiverOwnerSnapshot(text) {
  const rows = transportRows();

  assert.match(text, /Message Sender\/Receiver and Owner Layer Addendum - 2026-05-27/);
  assert.match(text, /message sender rows: 57/);
  assert.match(text, /message receiver rows: 8/);
  assert.match(text, /extension runtime transport rows: 32/);
  assert.match(text, /page-message transport rows: 30/);
  assert.match(text, /tab-message transport rows: 3/);
  assert.match(text, /owner-layer rows: isolated-content-runtime 33, main-world-page-runtime 19, extension-ui-state 10, background 3/);
  assert.match(text, /message sender\/receiver authority: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
  assert.deepEqual(countBy(rows.map(row => ({ direction: messageDirection(row) })), 'direction'), {
    receiver: 8,
    sender: 57
  });
  assert.deepEqual(countBy(rows.map(row => ({ boundary: messageBoundary(row) })), 'boundary'), {
    'extension-runtime': 32,
    'page-message': 30,
    'tab-message': 3
  });
  assert.deepEqual(countBy(rows.map(row => ({ ownerLayer: messageOwnerLayer(row.file) })), 'ownerLayer'), {
    background: 3,
    'extension-ui-state': 10,
    'isolated-content-runtime': 33,
    'main-world-page-runtime': 19
  });

  for (const phrase of [
    '| `sender` | 57 |',
    '| `receiver` | 8 |',
    '| `extension-runtime` | 32 |',
    '| `page-message` | 30 |',
    '| `tab-message` | 3 |',
    '| `isolated-content-runtime` | 33 |',
    '| `main-world-page-runtime` | 19 |',
    '| `extension-ui-state` | 10 |',
    '| `background` | 3 |',
    'The sender-to-receiver imbalance is the main audit risk',
    'hardening only background runtime messages would leave the isolated/main-world',
    'include two broad runtime receivers'
  ]) {
    assert.ok(text.includes(phrase), `missing message sender/owner phrase ${phrase}`);
  }
}

test('message transport callsite register is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /tracked product JS\/JSX\/MJS files scanned: 71/);
  assert.match(text, /js\/managed_parent_command_center\.js.*zero message\s+transport\s+rows/s);
  assert.match(text, /js\/managed_admin_authority\.js.*zero message\s+transport rows/s);
  assert.match(text, /js\/nanah_managed_live_policy\.js.*zero message\s+transport rows/s);
  assert.match(text, /js\/nanah_managed_open_sync\.js.*zero message\s+transport rows/s);
  assert.match(text, /tracked product files with message transport rows: 14/);
  assert.match(text, /message transport rows: 65/);
  assert.match(text, /runtime.onMessage.addListener rows: 4/);
  assert.match(text, /runtime.sendMessage rows: 28/);
  assert.match(text, /tabs.sendMessage rows: 3/);
  assert.match(text, /window.addEventListener\("message"\) rows: 4/);
  assert.match(text, /window.postMessage rows: 26/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for message sender authority/);
  assertMessageSenderReceiverOwnerSnapshot(text);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('message transport callsite counts remain source-derived', () => {
  const rows = transportRows();
  const text = doc();

  assert.equal(productScriptFiles().length, 71);
  assert.equal(rows.length, 65);
  assert.deepEqual(countBy(rows, 'operation'), {
    'runtime.onMessage.addListener': 4,
    'runtime.sendMessage': 28,
    'tabs.sendMessage': 3,
    'window.addEventListener(message)': 4,
    'window.postMessage': 26
  });
  assert.deepEqual(countBy(rows, 'file'), {
    'js/background.js': 3,
    'js/content/bridge_injection.js': 1,
    'js/content/bridge_settings.js': 7,
    'js/content/collab_dialog.js': 1,
    'js/content/first_run_prompt.js': 2,
    'js/content/handle_resolver.js': 4,
    'js/content/release_notes_prompt.js': 3,
    'js/content_bridge.js': 15,
    'js/filter_logic.js': 6,
    'js/injector.js': 12,
    'js/popup.js': 1,
    'js/seed.js': 1,
    'js/state_manager.js': 6,
    'js/tab-view.js': 3
  });

  for (const row of rows) {
    assert.ok(
      text.includes(`${row.file}:${row.line}:${row.operation}:`),
      `missing transport row ${row.file}:${row.line}:${row.operation}`
    );
  }
});

test('message transport register records current split boundaries and future proof fields', () => {
  const text = doc();

  assert.match(text, /primaryBackgroundActionReceiver/);
  assert.match(text, /secondaryBackgroundTypeReceiver/);
  assert.match(text, /contentRuntimeActionReceiver/);
  assert.match(text, /dashboardRuntimeMessageReceiver/);
  assert.match(text, /contentBridgeMainWorldMessageReceiver/);
  assert.match(text, /subscriptionImportMainWorldReceiver/);
  assert.match(text, /mainWorldBridgeReceiver/);
  assert.match(text, /settingsRelayToMainWorld/);
  assert.match(text, /filterLogicVideoChannelMapBatch/);
  assert.match(text, /seedVideoChannelMapUpdate/);
  assert.match(text, /addChannelPersistentRuntimeMutation/);
  assert.match(text, /kidsBlockChannelRuntimeMutation/);
  assert.match(text, /subscriptionsImportContentRequest/);
  assert.match(text, /Four `window.addEventListener\("message", \.\.\.\)` receivers/);
  assert.match(text, /messageTransportReference/);
  assert.match(text, /senderClass/);
  assert.match(text, /pendingRequestIdPolicy/);
  assert.match(text, /noncePolicy/);
  assert.match(text, /originPolicy/);
  assert.match(text, /settingsRevisionPolicy/);
  assert.match(text, /noWorkBudget/);
  assert.match(text, /negativeSenderFixture/);
});

test('message transport authority symbols do not exist in product transport source yet', () => {
  const productSource = Object.keys(sourceFingerprints).map(read).join('\n');
  const text = doc();
  const missingSymbols = [
    'messageTransportCallsiteAuthority',
    'messageTransportEffectReport',
    'runtimeMessageSenderContract',
    'pageMessageNonceContract',
    'messageTransportReceiverManifest',
    'messageTransportTabBroadcastAuthority',
    'messageTransportPendingRequestRegistry',
    'messageTransportNoWorkBudget',
    'messageTransportSpoofFixtureReport',
    'messageTransportTeardownRegistry'
  ];

  for (const symbol of missingSymbols) {
    assert.match(text, new RegExp(`\\b${symbol}\\b`));
    assert.doesNotMatch(productSource, new RegExp(`\\b${symbol}\\b`));
  }
});
