import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BATCH_WHITELIST_IMPORT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const sourcePaths = ['js/background.js', 'js/state_manager.js'];

const authoritySymbols = [
  'batchWhitelistImportPersistenceContract',
  'batchWhitelistImportMutationReport',
  'batchWhitelistImportRollbackPolicy',
  'batchWhitelistImportProfileLockReport',
  'batchWhitelistImportModeEffectReport',
  'batchWhitelistImportChannelMapPolicy',
  'batchWhitelistImportV3MirrorPolicy',
  'batchWhitelistImportCacheInvalidationReport',
  'batchWhitelistImportBackupRefreshBudget',
  'batchWhitelistImportFixtureProvenance',
  'batchWhitelistImportMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function sourceBlocks() {
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');

  return {
    background,
    stateManager,
    normalizeEntry: sliceBetween(
      background,
      'function normalizeImportedWhitelistChannelEntry',
      '\n\nfunction importedWhitelistEntriesMatch'
    ),
    matchEntry: sliceBetween(
      background,
      'function importedWhitelistEntriesMatch',
      '\n\nfunction mergeImportedWhitelistChannelEntry'
    ),
    mergeEntry: sliceBetween(
      background,
      'function mergeImportedWhitelistChannelEntry',
      '\n\nfunction mergeImportedWhitelistChannels'
    ),
    mergeList: sliceBetween(
      background,
      'function mergeImportedWhitelistChannels',
      '\n\nfunction extractPinVerifierFromProfilesV4'
    ),
    batchAction: sliceBetween(
      background,
      "} else if (action === 'FilterTube_BatchImportWhitelistChannels')",
      "} else if (action === 'FilterTube_KidsWhitelistChannel')"
    ),
    stateImport: sliceBetween(
      stateManager,
      'async function importSubscribedChannelsToWhitelist(options = {}) {',
      '\n\n    /**\n     * Remove a channel'
    )
  };
}

function selectedSource(blocks) {
  return [
    blocks.normalizeEntry,
    blocks.matchEntry,
    blocks.mergeEntry,
    blocks.mergeList,
    blocks.batchAction,
    blocks.stateImport
  ].join('\n');
}

function runMergeFixture(blocks, existingList, incomingList) {
  const context = {
    __existingList: existingList,
    __incomingList: incomingList,
    __result: null
  };
  const helperSource = `
    const FilterTubeIdentity = {
      normalizeHandleValue(value) {
        const text = normalizeString(value);
        return text.startsWith('@') ? text : '';
      },
      canonicalizeChannelInput(value) {
        const text = normalizeString(value);
        if (/^UC[a-zA-Z0-9_-]{22}$/.test(text)) return { type: 'ucid', value: text };
        if (text.startsWith('@')) return { type: 'handle', value: text };
        return null;
      },
      extractChannelIdFromPath(value) {
        const text = normalizeString(value);
        const match = text.match(/UC[a-zA-Z0-9_-]{22}/);
        return match ? match[0] : '';
      },
      extractCustomUrlFromPath(value) {
        const text = normalizeString(value);
        return text.startsWith('/c/') || text.startsWith('/channel/') ? text : '';
      }
    };
    function normalizeString(value) {
      if (value == null) return '';
      return String(value).trim();
    }
    function safeArray(value) {
      return Array.isArray(value) ? value : [];
    }
    function nowTs() {
      return 1700000000000;
    }
    function normalizeHandleForStorage(value) {
      const normalized = typeof FilterTubeIdentity?.normalizeHandleValue === 'function'
        ? FilterTubeIdentity.normalizeHandleValue(value)
        : normalizeString(value);
      return typeof normalized === 'string' && normalized.trim().startsWith('@') ? normalized.trim() : '';
    }
    function isHandleLike(value) {
      return typeof value === 'string' && value.trim().startsWith('@');
    }
    function isProbablyNotChannelName(value) {
      if (!value || typeof value !== 'string') return true;
      const trimmed = value.trim();
      if (!trimmed) return true;
      if (isHandleLike(trimmed)) return true;
      if (/^UC[\\w-]{22}$/i.test(trimmed)) return true;
      if (trimmed.includes('•')) return true;
      if (/\\bviews?\\b/i.test(trimmed)) return true;
      if (/\\bago\\b/i.test(trimmed)) return true;
      if (/\\bwatching\\b/i.test(trimmed)) return true;
      const lower = trimmed.toLowerCase();
      if (lower === 'channel') return true;
      if (lower.startsWith('mix')) return true;
      if (lower.startsWith('my mix')) return true;
      return false;
    }
    function sanitizeImportedWhitelistChannelName(value) {
      if (!value || typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (isProbablyNotChannelName(trimmed)) return '';
      return trimmed;
    }
    ${blocks.normalizeEntry}
    ${blocks.matchEntry}
    ${blocks.mergeEntry}
    ${blocks.mergeList}
    __result = mergeImportedWhitelistChannels(__existingList, __incomingList);
  `;
  vm.runInNewContext(helperSource, context);
  return context.__result;
}

test('batch whitelist import persistence audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, whitelist import patch/);
  assert.match(doc, /permission to change filtering,\s+storage, backup, cache, refresh, or list-mode behavior/);
  assert.match(doc, /batch whitelist import persistence source files: 2/);
  assert.match(doc, /batch whitelist import persistence source\/effect blocks: 6/);
  assert.match(doc, /runtime batch whitelist import persistence fixtures: 7/);
  assert.match(doc, /not completion proof for batch whitelist import persistence authority/);

  for (const file of sourcePaths) {
    const source = read(file);
    assert.ok(doc.includes(`| \`${file}\` | ${lineCount(source)} | ${Buffer.byteLength(source)} | \`${sha256(file)}\` |`), file);
  }
});

test('batch whitelist import persistence source and effect counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['background normalizeImportedWhitelistChannelEntry block', blocks.normalizeEntry, 57, 2426],
    ['background importedWhitelistEntriesMatch block', blocks.matchEntry, 29, 1228],
    ['background mergeImportedWhitelistChannelEntry block', blocks.mergeEntry, 33, 2544],
    ['background mergeImportedWhitelistChannels block', blocks.mergeList, 44, 1463],
    ['background FilterTube_BatchImportWhitelistChannels action block', blocks.batchAction, 170, 7012],
    ['StateManager importSubscribedChannelsToWhitelist block', blocks.stateImport, 109, 4527]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  const selected = selectedSource(blocks);
  for (const [label, literal, expected] of [
    ['selected isTrustedUiSender tokens: 1', 'isTrustedUiSender', 1],
    ['selected isProfileSessionAuthorized tokens: 1', 'isProfileSessionAuthorized', 1],
    ['selected activeId tokens: 5', 'activeId', 5],
    ['selected targetProfileId tokens: 19', 'targetProfileId', 19],
    ['selected mergeImportedWhitelistChannels tokens: 2', 'mergeImportedWhitelistChannels', 2],
    ['selected storageGet tokens: 1', 'storageGet', 1],
    ['selected storage.local.set tokens: 1', 'storage.local.set', 1],
    ['selected compiledSettingsCache tokens: 2', 'compiledSettingsCache', 2],
    ['selected scheduleAutoBackupInBackground tokens: 1', 'scheduleAutoBackupInBackground', 1],
    ['selected tabs.query tokens: 1', 'tabs.query', 1],
    ['selected sendMessageToTabQuietly tokens: 1', 'sendMessageToTabQuietly', 1],
    ['selected channelMap tokens: 4', 'channelMap', 4],
    ['selected ftProfilesV3 tokens: 3', 'ftProfilesV3', 3],
    ['selected FT_PROFILES_V4_KEY tokens: 3', 'FT_PROFILES_V4_KEY', 3],
    ['selected whitelistedChannels tokens: 1', 'whitelistedChannels', 1],
    ['selected currentMode tokens: 7', 'currentMode', 7],
    ['selected requestId tokens: 14', 'requestId', 14],
    ['selected counts tokens: 14', 'counts', 14],
    ['selected sendResponse callsites: 7', 'sendResponse?.', 7],
    ['selected errorCode tokens: 16', 'errorCode', 16]
  ]) {
    assert.equal(countLiteral(selected, literal), expected, label);
    assert.ok(doc.includes(label), label);
  }
});

test('merge helpers preserve current identity matching and count behavior', () => {
  const blocks = sourceBlocks();
  const existing = [{
    id: 'UCaaaaaaaaaaaaaaaaaaaaaa',
    handle: '@existing',
    handleDisplay: '@existing',
    canonicalHandle: '@existing',
    customUrl: '/c/existing',
    name: 'Existing Channel',
    logo: '',
    filterAll: false,
    filterAllComments: false,
    source: 'manual',
    originalInput: '@existing',
    addedAt: 10
  }];
  const incoming = [
    {
      id: 'UCaaaaaaaaaaaaaaaaaaaaaa',
      handle: '@existing',
      name: 'Incoming Better Name',
      logo: 'logo-new',
      filterAll: true,
      filterAllComments: true,
      source: 'subscriptions_import',
      originalInput: 'UCaaaaaaaaaaaaaaaaaaaaaa',
      addedAt: 50
    },
    { handle: '@fresh', name: 'Fresh Channel', customUrl: '/c/fresh', addedAt: 70 },
    { handle: '@fresh', name: 'Fresh Channel', customUrl: '/c/fresh', addedAt: 70 },
    { name: 'No Identity' }
  ];

  const result = runMergeFixture(blocks, existing, incoming);
  assert.deepEqual(JSON.parse(JSON.stringify(result.counts)), { imported: 1, updated: 1, duplicates: 1, skipped: 1 });
  assert.equal(result.channels.length, 2);
  assert.equal(result.channels[0].handle, '@fresh');
  assert.equal(result.channels[0].filterAllComments, true);
  assert.equal(result.channels[1].id, 'UCaaaaaaaaaaaaaaaaaaaaaa');
  assert.equal(result.channels[1].name, 'Existing Channel');
  assert.equal(result.channels[1].logo, 'logo-new');
  assert.equal(result.channels[1].filterAll, true);
  assert.equal(result.channels[1].filterAllComments, false);
  assert.equal(result.channels[1].addedAt, 10);
});

test('background action keeps sender profile lock and empty-import behavior source-pinned', () => {
  const doc = read(docPath);
  const { batchAction } = sourceBlocks();

  assert.match(batchAction, /if \(!isTrustedUiSender\(sender\)\)/);
  assert.match(batchAction, /storageGet\(\[FT_PROFILES_V4_KEY, 'ftProfilesV3', 'channelMap'\]\)/);
  assert.match(batchAction, /buildProfilesV4FromLegacyState\(storage, \{\}\)/);
  assert.match(batchAction, /activeId !== targetProfileId/);
  assert.match(batchAction, /isProfileSessionAuthorized\(profilesV4, targetProfileId\)/);
  assert.match(batchAction, /errorCode: 'profile_locked'/);
  assert.match(batchAction, /incomingChannels\.length === 0/);
  assert.match(batchAction, /channels: existingWhitelist/);
  assert.doesNotMatch(sliceBetween(batchAction, 'if (incomingChannels.length === 0)', 'profiles[targetProfileId] ='), /storage\.local\.set/);

  assert.match(doc, /The background action requires `isTrustedUiSender\(sender\)`, active profile equality, and `isProfileSessionAuthorized/);
  assert.match(doc, /Shared profile-lock mutation contract/);
});

test('background action writes profile mirrors channel map cache invalidation backup and refresh without changing mode', () => {
  const doc = read(docPath);
  const { batchAction } = sourceBlocks();

  assert.match(batchAction, /const targetMode = targetMain\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(batchAction, /whitelistChannels: mergedChannels/);
  assert.match(batchAction, /ftProfilesV3/);
  assert.match(batchAction, /whitelistedChannels: mergedChannels/);
  assert.match(batchAction, /writePayload\.channelMap = nextChannelMap/);
  assert.match(batchAction, /await browserAPI\.storage\.local\.set\(writePayload\)/);
  assert.match(batchAction, /compiledSettingsCache\.main = null/);
  assert.match(batchAction, /compiledSettingsCache\.kids = null/);
  assert.match(batchAction, /scheduleAutoBackupInBackground\('whitelist_subscriptions_imported'\)/);
  assert.match(batchAction, /browserAPI\.tabs\.query\(\{ url: \['\*:\/\/\*\.youtube\.com\/\*'\] \}/);
  assert.match(batchAction, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\)/);
  assert.match(batchAction, /currentMode: targetMode/);
  assert.doesNotMatch(batchAction, /targetMain\.mode = 'whitelist'|mode: 'whitelist'/);

  assert.match(doc, /does not switch blocklist to whitelist/);
  assert.match(doc, /Cache invalidation report, backup\/refresh budget/);
});

test('StateManager caller keeps profile stability and post-write reload refresh behavior pinned', () => {
  const doc = read(docPath);
  const { stateImport } = sourceBlocks();

  assert.match(stateImport, /if \(isUiLocked\(\)\)/);
  assert.match(stateImport, /targetProfileId/);
  assert.match(stateImport, /initialProfileContext\.activeId !== targetProfileId/);
  assert.match(stateImport, /latestProfileContext\.activeId !== targetProfileId/);
  assert.match(stateImport, /FilterTube_BatchImportWhitelistChannels/);
  assert.match(stateImport, /channels/);
  assert.match(stateImport, /await loadSettings\(\{ notify: true \}\)/);
  assert.match(stateImport, /await requestRefresh\('main'\)/);
  assert.match(stateImport, /currentMode: response\.currentMode/);

  assert.match(doc, /The caller gates profile state, but storage mutation authority moves to background/);
  assert.match(doc, /End-to-end mutation report/);
});

test('future batch whitelist import persistence authority symbols remain absent from product runtime source', () => {
  const doc = read(docPath);
  const runtimeSource = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc records missing symbol ${symbol}`);
    assert.equal(runtimeSource.includes(symbol), false, `runtime source unexpectedly contains ${symbol}`);
  }

  assert.match(doc, /No `batchWhitelistImportPersistenceContract`/);
  assert.match(doc, /`batchWhitelistImportMetricArtifact` exists in product runtime source yet/);
});
