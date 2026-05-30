import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_BACKUP_NANAH_TRUSTED_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sourceLineCount(text) {
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function plainJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function blockStats(text) {
  return {
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text),
    hash: sha256Text(text)
  };
}

const sources = {
  ioManager: read('js/io_manager.js'),
  tabView: read('js/tab-view.js'),
  nanahAdapter: read('js/nanah_sync_adapter.js')
};

function blocks() {
  return {
    normalizeNanahBackupState: sliceBetween(
      sources.ioManager,
      'function normalizeNanahBackupState(value) {',
      '/**\n     * Entry point for imports'
    ),
    importV3: sliceBetween(
      sources.ioManager,
      "async function importV3(json, { strategy = 'merge', scope = 'auto', auth = null, targetProfileId = null } = {}) {",
      'async function exportV3Encrypted'
    ),
    nanahRestoreWrite: sliceBetween(
      sources.ioManager,
      'let restoredNanahState = false;',
      'return { ok: true, result, restoredNanahState };'
    ),
    exportV3Encrypted: sliceBetween(
      sources.ioManager,
      "async function exportV3Encrypted({ scope = 'auto', password = '', auth = null, includeTrustedNanahState = false } = {}) {",
      'async function importV3Encrypted'
    ),
    importV3Encrypted: sliceBetween(
      sources.ioManager,
      "async function importV3Encrypted(container, { password = '', strategy = 'merge', scope = 'auto', auth = null } = {}) {",
      '// ============================================================================\n    // AUTO-BACKUP SYSTEM'
    ),
    runExportV3Encrypted: sliceBetween(
      sources.tabView,
      'async function runExportV3Encrypted() {',
      'async function runImportV3FromFile(file) {'
    ),
    runImportV3FromFile: sliceBetween(
      sources.tabView,
      'async function runImportV3FromFile(file) {',
      'if (ftExportV3Btn) {'
    ),
    nanahPortableApply: sliceBetween(
      sources.nanahAdapter,
      "async function buildPortablePayload({ scope = 'active', auth = null } = {}) {",
      'function getDeviceDescriptor'
    )
  };
}

function defaultProfilesV4(activeProfileId = 'default') {
  return {
    schemaVersion: 4,
    activeProfileId,
    profiles: {
      default: {
        type: 'account',
        parentProfileId: null,
        name: 'Default',
        settings: {},
        main: {
          mode: 'blocklist',
          channels: [],
          keywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        },
        kids: {
          mode: 'blocklist',
          strictMode: true,
          blockedChannels: [],
          blockedKeywords: [],
          whitelistChannels: [],
          whitelistKeywords: []
        }
      }
    }
  };
}

function makeIoContext(initialStorage = {}) {
  const storage = { ...initialStorage };
  const context = {
    console,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    __storage: storage
  };

  const chrome = {
    runtime: { lastError: null },
    storage: {
      local: {
        get(keys, callback) {
          let result = {};
          if (Array.isArray(keys)) {
            for (const key of keys) result[key] = storage[key];
          } else if (typeof keys === 'string') {
            result[keys] = storage[keys];
          } else if (keys && typeof keys === 'object') {
            result = { ...keys };
            for (const key of Object.keys(keys)) {
              if (Object.prototype.hasOwnProperty.call(storage, key)) result[key] = storage[key];
            }
          } else {
            result = { ...storage };
          }
          callback(result);
        },
        set(payload, callback) {
          Object.assign(storage, payload);
          callback?.();
        }
      }
    },
    downloads: {
      download(_options, callback) {
        callback?.(1);
        return 1;
      },
      search(_options, callback) {
        callback?.([]);
      },
      erase(_options, callback) {
        callback?.([]);
      }
    }
  };

  context.chrome = chrome;
  context.window = context;
  context.FilterTubeSettings = {
    loadSettings: async () => ({ ...storage.__settings }),
    saveSettings: async (payload) => {
      storage.__savedSettings = payload;
      return { compiledSettings: {}, error: null };
    },
    setThemePreference: async (theme) => {
      storage.__theme = theme;
    }
  };
  context.FilterTubeSecurity = {
    encryptJson: async (payload, password) => ({ payload, password }),
    decryptJson: async (encrypted) => encrypted?.payload ?? encrypted
  };

  vm.runInNewContext(sources.ioManager, context, { filename: path.join(repoRoot, 'js', 'io_manager.js') });
  return context;
}

function baseStorage(overrides = {}) {
  const profiles = defaultProfilesV4();
  return {
    ftProfilesV4: profiles,
    ftProfilesV3: {
      main: {
        mode: 'blocklist',
        whitelistedChannels: [],
        whitelistedKeywords: [],
        videoIds: [],
        subscriptions: []
      },
      kids: {
        mode: 'blocklist',
        strictMode: true,
        blockedChannels: [],
        blockedKeywords: [],
        whitelistedChannels: [],
        whitelistedKeywords: [],
        videoIds: [],
        subscriptions: []
      }
    },
    __settings: {
      theme: 'dark',
      enabled: true,
      channels: [],
      keywords: [],
      channelMap: {},
      ftProfilesV4: profiles
    },
    ...overrides
  };
}

test('backup Nanah trusted-state boundary audit is audit-only and source pinned', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'Status: audit-only current-behavior proof. Runtime behavior is unchanged.',
    'This is not an implementation patch, backup policy patch, Nanah sync patch',
    'Backup Nanah trusted-state source/effect blocks: 8.',
    'Runtime trusted-state boundary fixtures: 5.',
    'Full encrypted export with `includeTrustedNanahState: true` emits `nanahState`',
    'Importing the same full backup with `restoreTrustedNanahState: true` merges trusted links',
    'No `backupNanahTrustedStateBoundaryContract`'
  ]) {
    assert.ok(doc.includes(marker), `missing marker: ${marker}`);
  }

  const expectedSources = [
    ['js/io_manager.js', 2030, 96914, 'd04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21'],
    ['js/tab-view.js', 11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7'],
    ['js/nanah_sync_adapter.js', 433, 17072, '8094261e6fb9fa72a86e6e79e8614bf18b93134f54dcca7327114b5410447824']
  ];

  for (const [file, lines, bytes, hash] of expectedSources) {
    const source = read(file);
    assert.equal(sourceLineCount(source), lines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count drifted`);
    assert.equal(sha256Text(source), hash, `${file} hash drifted`);
    assert.ok(doc.includes(`| \`${file}\` | ${lines} | ${bytes} | \`${hash}\` |`));
  }
});

test('backup Nanah trusted-state source and effect blocks remain pinned', () => {
  const doc = read(auditDocPath);
  const currentBlocks = blocks();
  const expected = {
    normalizeNanahBackupState: ['normalizeNanahBackupState()', 16, 492, '32c348752d0edd259b7927a4474ef8f90704feeda5904400e3878530efe1c730'],
    importV3: ['importV3()', 489, 30694, '67e6f816226c8f7ff52f45a35d7d3a07106bfe6fdc1a9f7270646d1c15b77eb0'],
    nanahRestoreWrite: ['Nanah restore write block', 36, 1686, '617a6985d6dc7b45accaca959b37d84331090655de4183fdec70ff0fe5a353a2'],
    exportV3Encrypted: ['exportV3Encrypted()', 31, 1415, '8fc1d83f05b775479fe78ba92c604d90a805149db70025262cb63c77a601186a'],
    importV3Encrypted: ['importV3Encrypted()', 15, 688, '2b11d86cd824732c4f263137b735ded57474e465015f47f194e23d61e7976896'],
    runExportV3Encrypted: ['runExportV3Encrypted()', 82, 3969, '2747728a2eb843e610cb81b7837273591e632f23881c78b29b02c0b57b3a4e4e'],
    runImportV3FromFile: ['runImportV3FromFile()', 152, 6968, 'e51c26ee4f50fbbea6b15840d6116c81b64bf41ddbbcec2e341043184b639574'],
    nanahPortableApply: ['portable payload/apply cluster', 93, 3587, 'bc9c135619cfe9f1c93f66ff8a6364f3173f05c7b73e7bc3e226b63a9f4c9ed7']
  };

  for (const [key, [label, lines, bytes, hash]] of Object.entries(expected)) {
    const stats = blockStats(currentBlocks[key]);
    assert.equal(stats.lines, lines, `${label} line count drifted`);
    assert.equal(stats.bytes, bytes, `${label} byte count drifted`);
    assert.equal(stats.hash, hash, `${label} hash drifted`);
    assert.ok(doc.includes(`| ${lines} | ${bytes} | \`${hash}\``), `${label} doc row missing`);
  }

  assert.equal(countLiteral(currentBlocks.exportV3Encrypted, 'includeTrustedNanahState'), 2);
  assert.equal(countLiteral(currentBlocks.exportV3Encrypted, 'containsNanahTrustedState'), 1);
  assert.equal(countLiteral(currentBlocks.exportV3Encrypted, 'NANAH_TRUSTED_LINKS_KEY'), 2);
  assert.equal(countLiteral(currentBlocks.exportV3Encrypted, 'NANAH_DEVICE_ID_KEY'), 2);
  assert.equal(countLiteral(currentBlocks.importV3, 'targetProfileId'), 10);
  assert.equal(countLiteral(currentBlocks.importV3, 'restoreTrustedNanahState'), 1);
  assert.equal(countLiteral(currentBlocks.importV3, 'incomingNanahState'), 5);
  assert.equal(countLiteral(currentBlocks.importV3, 'SettingsAPI.saveSettings'), 2);
  assert.equal(countLiteral(currentBlocks.importV3, 'saveProfilesV4'), 1);
  assert.equal(countLiteral(currentBlocks.importV3, 'compiledSettingsRevision'), 0);
  assert.equal(countLiteral(currentBlocks.importV3, 'FilterTube_ApplySettings'), 0);
  assert.equal(countLiteral(currentBlocks.nanahRestoreWrite, 'NANAH_TRUSTED_LINKS_KEY'), 3);
  assert.equal(countLiteral(currentBlocks.nanahRestoreWrite, 'NANAH_DEVICE_ID_KEY'), 2);
  assert.equal(countLiteral(currentBlocks.importV3Encrypted, 'targetProfileId'), 0);
  assert.equal(countLiteral(currentBlocks.runImportV3FromFile, 'showChoiceModal'), 1);
  assert.equal(countLiteral(currentBlocks.runImportV3FromFile, 'StateManager.loadSettings'), 1);
  assert.equal(countLiteral(currentBlocks.runImportV3FromFile, 'updateNanahUi'), 1);
  assert.equal(countLiteral(currentBlocks.nanahPortableApply, 'targetProfileId'), 3);
});

test('full encrypted export includes trusted Nanah state only for full backup scope', async () => {
  const context = makeIoContext(baseStorage({
    ftNanahTrustedLinks: [{ remoteDeviceId: 'remote-a', linkId: 'link-a' }],
    ftNanahDeviceId: 'local-device-a'
  }));

  const full = await context.FilterTubeIO.exportV3Encrypted({
    scope: 'auto',
    password: 'pw',
    includeTrustedNanahState: true
  });
  assert.equal(full.meta.exportType, 'full');
  assert.equal(full.meta.containsNanahTrustedState, true);
  assert.deepEqual(plainJson(full.encrypted.payload.nanahState), {
    deviceId: 'local-device-a',
    trustedLinks: [{ remoteDeviceId: 'remote-a', linkId: 'link-a' }]
  });

  const active = await context.FilterTubeIO.exportV3Encrypted({
    scope: 'active',
    password: 'pw',
    includeTrustedNanahState: true
  });
  assert.equal(active.meta.exportType, 'profile');
  assert.equal(active.meta.containsNanahTrustedState, false);
  assert.equal(active.encrypted.payload.nanahState, undefined);
});

test('full import restores trusted Nanah state only when restore flag is true', async () => {
  const exporter = makeIoContext(baseStorage({
    ftNanahTrustedLinks: [{ remoteDeviceId: 'remote-new', linkId: 'link-new' }],
    ftNanahDeviceId: 'incoming-device'
  }));
  const exported = await exporter.FilterTubeIO.exportV3Encrypted({
    scope: 'auto',
    password: 'pw',
    includeTrustedNanahState: true
  });
  const payload = exported.encrypted.payload;

  const noRestore = makeIoContext(baseStorage({
    ftNanahTrustedLinks: [{ remoteDeviceId: 'remote-old', linkId: 'link-old' }],
    ftNanahDeviceId: 'existing-device'
  }));
  const skipped = await noRestore.FilterTubeIO.importV3(payload, {
    strategy: 'merge',
    scope: 'auto',
    auth: { restoreTrustedNanahState: false }
  });
  assert.equal(skipped.restoredNanahState, false);
  assert.deepEqual(plainJson(noRestore.__storage.ftNanahTrustedLinks), [{ remoteDeviceId: 'remote-old', linkId: 'link-old' }]);
  assert.equal(noRestore.__storage.ftNanahDeviceId, 'existing-device');

  const restore = makeIoContext(baseStorage({
    ftNanahTrustedLinks: [{ remoteDeviceId: 'remote-old', linkId: 'link-old' }],
    ftNanahDeviceId: 'existing-device'
  }));
  const restored = await restore.FilterTubeIO.importV3(payload, {
    strategy: 'merge',
    scope: 'auto',
    auth: { restoreTrustedNanahState: true }
  });
  assert.equal(restored.restoredNanahState, true);
  assert.deepEqual(plainJson(restore.__storage.ftNanahTrustedLinks), [
    { remoteDeviceId: 'remote-old', linkId: 'link-old' },
    { remoteDeviceId: 'remote-new', linkId: 'link-new' }
  ]);
  assert.equal(restore.__storage.ftNanahDeviceId, 'incoming-device');
});

test('manual UI and encrypted import helper keep restore choice and target-profile gaps explicit', () => {
  const currentBlocks = blocks();

  assert.match(currentBlocks.runImportV3FromFile, /title: 'Restore Trusted Devices Too\?'/);
  assert.match(currentBlocks.runImportV3FromFile, /Use this only when restoring the same device after reinstall or local data loss\./);
  assert.match(currentBlocks.runImportV3FromFile, /Restoring it on a different device can clone the saved Nanah device identity\./);
  assert.match(currentBlocks.runImportV3FromFile, /recommended: true/);
  assert.match(currentBlocks.runImportV3FromFile, /restoreTrustedNanahState = restoreChoice === 'restore_trust'/);
  assert.match(currentBlocks.runImportV3FromFile, /await StateManager\.loadSettings\(\)/);
  assert.match(currentBlocks.runImportV3FromFile, /updateNanahUi\(\)/);

  assert.match(currentBlocks.importV3Encrypted, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(currentBlocks.importV3Encrypted, /targetProfileId/);
});

test('Nanah adapter full and scoped paths do not create a trusted-state recovery authority', () => {
  const block = blocks().nanahPortableApply;

  assert.match(block, /await io\.exportV3\(\{ scope: normalizedScope, auth \}\)/);
  assert.match(block, /return io\.importV3\(extracted\.portable, \{/);
  assert.match(block, /targetProfileId/);
  assert.match(block, /return applyScopedPortablePayload\(io, extracted\.portable, \{/);
  assert.doesNotMatch(block, /restoreTrustedNanahState|nanahState|ftNanahTrustedLinks|ftNanahDeviceId|backupNanahTrustedState/);
});

test('future backup Nanah trusted-state authority symbols are absent from product runtime source', () => {
  const runtimeSource = [
    'js/io_manager.js',
    'js/tab-view.js',
    'js/nanah_sync_adapter.js',
    'js/background.js',
    'js/state_manager.js'
  ].map(read).join('\n');

  for (const symbol of [
    'backupNanahTrustedStateBoundaryContract',
    'backupNanahTrustedStateDecisionReport',
    'backupNanahTrustedStateSameDeviceProof',
    'backupNanahTrustedStateExportPolicy',
    'backupNanahTrustedStateRestorePolicy',
    'backupNanahTrustedStateProfileScopeReport',
    'backupNanahTrustedStateTargetProfileReport',
    'backupNanahTrustedStateStorageWriteReport',
    'backupNanahTrustedStatePostImportRevision',
    'backupNanahTrustedStateFixtureProvenance',
    'backupNanahTrustedStateMetricArtifact',
    'nanahTrustedRecoveryAuthority'
  ]) {
    assert.equal(runtimeSource.includes(symbol), false, `${symbol} unexpectedly exists in runtime source`);
  }
});
