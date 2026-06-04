import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/background.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function sourceStats() {
  const buffer = readBuffer(sourcePath);
  const source = buffer.toString('utf8');
  return {
    bytes: buffer.length,
    sha256: sha256(sourcePath),
    splitLines: source.split(/\r?\n/).length,
    wcLines: (source.match(/\n/g) || []).length
  };
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

function groupForMethod(name) {
  if (['safeArray', 'safeObject', 'normalizeString', 'sendMessageToTabQuietly', 'nowTs', 'installFilterTubeBackgroundConsoleGate'].includes(name)) return 'defensiveHelpersAndMessaging';
  if (['isValidProfilesV4', 'buildAutoBackupPayload', 'readAutoBackupState'].includes(name)) return 'profileBackupExportState';
  if ([
    'isTrustedUiSender',
    'buildSubscriptionsImportLogSample',
    'getSubscriptionsImportTrackedMatches',
    'isHandleLike',
    'normalizeHandleForStorage',
    'isProbablyNotChannelName',
    'sanitizeImportedWhitelistChannelName',
    'normalizeImportedWhitelistChannelEntry',
    'importedWhitelistEntriesMatch',
    'mergeImportedWhitelistChannelEntry',
    'mergeImportedWhitelistChannels'
  ].includes(name)) return 'subscriptionImportAndSenderNormalization';
  if (['extractPinVerifierFromProfilesV4', 'isProfileSessionAuthorized', 'verifyAndCacheSessionPin'].includes(name)) return 'securitySessionAndPin';
  if ([
    'rotateAutoBackups',
    'revokeBackgroundBlobUrlLater',
    'downloadWithBrowserApi',
    'createAutoBackupInBackground',
    'scheduleAutoBackupInBackground',
    'shouldWaitForPostBlockEnrichmentBeforeBackup',
    'waitForPostBlockEnrichmentBeforeBackup'
  ].includes(name)) return 'backupDownloadAndScheduling';
  if (['compareSemver', 'isVersionAtLeast', 'applyQuickBlockDefaultMigrationOnce', 'applyKeywordCommentsScopeMigrationOnce'].includes(name)) return 'migrationAndVersioning';
  if ([
    'schedulePostBlockEnrichment',
    'getChannelDerivedKeywordRef',
    'getChannelDerivedKeywordWord',
    'parsePackedChannelKeywordSource',
    'syncStoredMainKeywordsWithChannels'
  ].includes(name)) return 'postBlockEnrichmentAndChannelKeywords';
  if (['isKidsUrl', 'buildProfilesV4FromLegacyState', 'getCompiledSettings', 'storageGet'].includes(name)) return 'profileCompileAndStorage';
  if ([
    'ensureChannelMapCache',
    'flushChannelMapUpdates',
    'scheduleChannelMapFlush',
    'enqueueChannelMapUpdate',
    'enqueueChannelMapMappings',
    'ensureVideoChannelMapCache',
    'ensureVideoMetaMapCache',
    'enforceVideoChannelMapCap',
    'enforceVideoMetaMapCap',
    'flushVideoChannelMapUpdates',
    'flushVideoMetaMapUpdates',
    'scheduleVideoChannelMapFlush',
    'scheduleVideoMetaMapFlush',
    'enqueueVideoChannelMapUpdate',
    'enqueueVideoMetaMapUpdate'
  ].includes(name)) return 'learnedIdentityMapCaches';
  if (['loadReleaseNotesData', 'buildReleaseNotesPayload', 'getBackgroundRuntimeLabel', 'shouldSuppressFirstRunPromptInjectionError'].includes(name)) return 'releaseNotesAndRuntimeInfo';
  if ([
    'handleFetchShortsIdentityMessage',
    'handleFetchWatchIdentityMessage',
    'identityHasAlternateMetadata',
    'mergeStoredVideoIdentity',
    'buildStoredVideoIdentity',
    'performShortsIdentityFetch',
    'extractIdentityFromPreview',
    'extractKidsWatchIdentityFromPreview',
    'performKidsWatchIdentityFetch',
    'performWatchIdentityFetch',
    'extractCustomUrlFromPath',
    'fetchChannelInfo'
  ].includes(name)) return 'identityResolverNetwork';
  if (['handleAddFilteredChannel', 'handleToggleChannelFilterAll'].includes(name)) return 'ruleMutationAndChannelPersistence';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const source = read(sourcePath);
  const rows = [];
  source.split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: match[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name)
      });
    }
  });
  return rows;
}

function broadCallableRows() {
  const source = read(sourcePath);
  const re = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  const rows = [];
  let match;
  while ((match = re.exec(source))) {
    rows.push(match.slice(1).find(Boolean));
  }
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countNames(rows) {
  const out = {};
  for (const name of rows) out[name] = (out[name] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function sliceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `missing slice start ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `missing slice end ${end}`);
  return source.slice(startIndex, endIndex);
}

function backgroundPureBlocks() {
  const source = read(sourcePath);
  return {
    defensive: sliceBetween(source, 'function safeArray', '\nfunction isValidProfilesV4'),
    autoBackupPayload: sliceBetween(source, 'function safeArray', '\nfunction readAutoBackupState'),
    importMerge: sliceBetween(source, 'function safeArray', '\nfunction extractPinVerifierFromProfilesV4'),
    syncKeywords: sliceBetween(source, 'function getChannelDerivedKeywordRef', '\n// Deep link into the tab-view dashboard'),
    trustedSender: sliceBetween(source, 'function isTrustedUiSender', '\nfunction buildSubscriptionsImportLogSample'),
    customUrl: sliceBetween(source, 'function extractCustomUrlFromPath', '\nasync function fetchChannelInfo')
  };
}

function runSnippet(source, body, extraContext = {}) {
  const context = {
    console: { log() {}, warn() {}, error() {} },
    Date,
    Math,
    URL,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    Promise,
    ...extraContext
  };
  vm.createContext(context);
  vm.runInContext(`${source}\n${body}`, context);
  return context;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('background method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/background\.js/);
  assert.match(text, /top-level function declarations: 76/);
  assert.match(text, /plain function declarations: 63/);
  assert.match(text, /async function declarations: 13/);
  assert.match(text, /semantic method groups: 12/);
  assert.match(text, /covered by separate action register: 31 runtime message action\/type branches/);
  assert.match(text, /not completion proof for every inline listener callback/);
});

test('background method semantic register pins source fingerprint and broad callable reconciliation', () => {
  const stats = sourceStats();
  const rows = methodRows();
  const broadRows = broadCallableRows();
  const broadCounts = countNames(broadRows);
  const controlArtifacts = (broadCounts.if || 0) + (broadCounts.for || 0) + (broadCounts.while || 0) + (broadCounts.catch || 0);
  const heldOutsideRegister = broadRows.length - rows.length - controlArtifacts;
  const text = doc();

  assert.deepEqual(stats, {
    bytes: 298986,
    sha256: 'f05fe6f65f9de1218299374ac3c82dd6b6ae9e17e3d862926a20e6c2981c19c7',
    splitLines: 6344,
    wcLines: 6641
  });
  assert.equal(broadRows.length, 442);
  assert.equal(controlArtifacts, 300);
  assert.equal(heldOutsideRegister, 66);
  assert.deepEqual({
    if: broadCounts.if,
    for: broadCounts.for,
    while: broadCounts.while,
    catch: broadCounts.catch
  }, {
    if: 285,
    for: 10,
    while: 3,
    catch: 2
  });

  for (const expected of [
    'source split lines: 6344',
    'source wc -l: 6641',
    'source bytes: 298986',
    'source sha256: f05fe6f65f9de1218299374ac3c82dd6b6ae9e17e3d862926a20e6c2981c19c7',
    'broad lexical callable matches: 442',
    'accepted top-level method rows: 76',
    'control-flow lexical artifacts: 300 (`if`: 285, `for`: 10, `while`: 3, `catch`: 2)',
    'local/helper/listener/timer callbacks held outside this top-level register: 66',
    'executable current-behavior probes: 6'
  ]) {
    assert.ok(text.includes(expected), `missing source reconciliation line ${expected}`);
  }
});

test('background method semantic register accounts for every current top-level background function', () => {
  const rows = methodRows();

  assert.equal(rows.length, 76);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async function': 13,
    function: 63
  });
  assert.deepEqual(countBy(rows, 'group'), {
    backupDownloadAndScheduling: 7,
    defensiveHelpersAndMessaging: 6,
    identityResolverNetwork: 12,
    learnedIdentityMapCaches: 15,
    migrationAndVersioning: 4,
    postBlockEnrichmentAndChannelKeywords: 5,
    profileBackupExportState: 3,
    profileCompileAndStorage: 4,
    releaseNotesAndRuntimeInfo: 4,
    ruleMutationAndChannelPersistence: 2,
    securitySessionAndPin: 3,
    subscriptionImportAndSenderNormalization: 11
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('background method semantic register preserves every source row and future proof field', () => {
  const rows = methodRows();
  const text = doc();

  for (const row of rows) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing background method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'ownerRuntime',
    'callerClass',
    'triggerAction',
    'senderClass',
    'profileType',
    'profileId',
    'listModeInput',
    'targetList',
    'storageKeysTouched',
    'compiledCacheEffect',
    'networkEffect',
    'scriptInjectionEffect',
    'tabBroadcastEffect',
    'backupEffect',
    'statsEffect',
    'learnedIdentityEffect',
    'lockSessionState',
    'disabledBehavior',
    'noRuleBehavior',
    'emptyListBehavior',
    'teardownOrFlushBoundary',
    'positiveFixture',
    'negativeSenderFixture',
    'negativePayloadFixture',
    'rollbackFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('background source still proves method behavior boundaries', () => {
  const source = read(sourcePath);

  assert.ok(
    source.indexOf('if (!forceRefresh && compiledSettingsCache[targetProfile])') <
      source.indexOf("browserAPI.storage.local.get([\n            'enabled'"),
    'getCompiledSettings should return cached compiled settings before storage hydration'
  );
  assert.match(source, /compiledSettingsCache\[targetProfile\] = compiledSettings/);

  assert.match(source, /await browserAPI\.storage\.local\.set\(\{ channelMap: map \}\)/);
  assert.match(source, /await browserAPI\.storage\.local\.set\(\{ videoChannelMap: map \}\)/);
  assert.match(source, /await browserAPI\.storage\.local\.set\(\{ videoMetaMap: map \}\)/);
  assert.match(source, /channelMapFlushTimer = setTimeout\(\(\) => \{[\s\S]*flushChannelMapUpdates\(\);[\s\S]*\}, 250\)/);
  assert.match(source, /videoChannelMapFlushTimer = setTimeout\(\(\) => \{[\s\S]*flushVideoChannelMapUpdates\(\);[\s\S]*\}, 50\)/);
  assert.match(source, /videoMetaMapFlushTimer = setTimeout\(\(\) => \{[\s\S]*flushVideoMetaMapUpdates\(\);[\s\S]*\}, 75\)/);

  assert.match(source, /function scheduleAutoBackupInBackground\(triggerType, options = \{\}, delay = 1000\)/);
  assert.match(source, /if \(autoBackupTimer\) \{[\s\S]*clearTimeout\(autoBackupTimer\);[\s\S]*\}/);
  assert.match(source, /if \(shouldWaitForPostBlockEnrichmentBeforeBackup\(trigger, opts\)\) \{[\s\S]*await waitForPostBlockEnrichmentBeforeBackup\(\);[\s\S]*\}/);
  assert.match(source, /await createAutoBackupInBackground\(trigger, opts \|\| \{\}\)/);

  assert.match(source, /fetch\(`https:\/\/www\.youtube\.com\/shorts\/\$\{videoId\}`,[\s\S]*credentials: 'include'/);
  assert.match(source, /fetch\(`https:\/\/www\.youtubekids\.com\/watch\?v=\$\{videoId\}`,[\s\S]*credentials: 'include'/);
  assert.match(source, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`,[\s\S]*credentials: 'include'/);
  assert.match(source, /const timeoutId = setTimeout\(\(\) => controller\.abort\('timeout'\), SHORTS_FETCH_TIMEOUT_MS\)/);

  assert.match(source, /async function handleAddFilteredChannel\(input, filterAll = false/);
  assert.match(source, /channelInfo = await fetchChannelInfo\(lookupValue\)/);
  assert.match(source, /compiledSettingsCache\.main = null/);
  assert.match(source, /compiledSettingsCache\.kids = null/);
  assert.match(source, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\)/);

  assert.match(source, /async function handleToggleChannelFilterAll\(channelId, value\)/);
  assert.match(source, /syncStoredMainKeywordsWithChannels\(/);
  assert.match(source, /browserAPI\.storage\.local\.set\(payload, resolve\)/);
});

test('background executable method probes preserve current pure helper behavior', () => {
  const blocks = backgroundPureBlocks();

  const messageCalls = [];
  const warnCalls = [];
  runSnippet(blocks.defensive, `
    sendMessageToTabQuietly(0, { action: 'ignored' });
    sendMessageToTabQuietly(42, { action: 'FilterTube_RefreshNow' });
  `, {
    browserAPI: {
      runtime: { lastError: { message: 'Receiving end does not exist.' } },
      tabs: {
        sendMessage(tabId, payload, callback) {
          messageCalls.push({ tabId, payload });
          callback();
        }
      }
    },
    console: {
      log() {},
      warn(...args) { warnCalls.push(args); },
      error() {}
    }
  });
  assert.deepEqual(plain(messageCalls), [{ tabId: 42, payload: { action: 'FilterTube_RefreshNow' } }]);
  assert.deepEqual(warnCalls, []);

  const backupContext = runSnippet(blocks.autoBackupPayload, `
    __payload = buildAutoBackupPayload(__input);
  `, {
    __input: {
      theme: 'dark',
      settings: {
        hideShorts: true,
        ftProfilesV4: {
          schemaVersion: 4,
          activeProfileId: 'work',
          profiles: {
            default: { name: 'Default', main: { mode: 'blocklist' } },
            work: {
              name: 'Work Profile',
              main: {
                mode: 'whitelist',
                whitelistChannels: [{ id: 'UCallow000000000000000001', name: 'Allowed' }],
                whitelistKeywords: [{ word: 'allowed', exact: true }]
              },
              kids: {
                mode: 'blocklist',
                strictMode: false,
                blockedChannels: [{ id: 'UCkidsblock000000000001' }]
              },
              settings: { syncKidsToMain: true }
            }
          }
        }
      },
      profilesV3: {
        main: { mode: 'blocklist', applyKidsRulesOnMain: false },
        kids: { mode: 'whitelist', strictMode: true }
      }
    }
  });
  assert.equal(backupContext.__payload.meta.exportType, 'profile');
  assert.equal(backupContext.__payload.meta.profileId, 'work');
  assert.equal(backupContext.__payload.meta.profileName, 'Work Profile');
  assert.deepEqual(Object.keys(backupContext.__payload.profilesV4.profiles), ['work']);
  assert.equal(backupContext.__payload.settings.main.mode, 'whitelist');
  assert.equal(backupContext.__payload.settings.main.applyKidsRulesOnMain, true);
  assert.equal(backupContext.__payload.profiles.main.whitelistChannels[0].id, 'UCallow000000000000000001');

  const trustedContext = runSnippet(blocks.trustedSender, `
    __trusted = [
      isTrustedUiSender({ url: 'chrome-extension://filtertube/html/popup.html' }),
      isTrustedUiSender({ url: 'https://www.youtube.com/watch?v=abc' }),
      isTrustedUiSender(null)
    ];
  `, {
    browserAPI: {
      runtime: {
        getURL(pathValue = '') {
          return `chrome-extension://filtertube/${pathValue}`;
        }
      }
    }
  });
  assert.deepEqual(plain(trustedContext.__trusted), [true, false, false]);

  const mergeContext = runSnippet(blocks.importMerge, `
    __result = mergeImportedWhitelistChannels(__existing, __incoming);
  `, {
    __existing: [{
      id: 'UCexistingaaaaaaaaaaaaaa',
      handle: '@sample',
      name: 'UCexistingaaaaaaaaaaaaaa',
      source: 'manual',
      filterAll: false,
      addedAt: 200
    }],
    __incoming: [{
      handle: '@Sample',
      name: 'Readable Channel',
      customUrl: 'c/sample',
      filterAll: true,
      filterAllComments: false,
      originalInput: '@Sample',
      addedAt: 100
    }],
    FilterTubeIdentity: {
      normalizeHandleValue(value) {
        const text = typeof value === 'string' ? value.trim() : '';
        return text.startsWith('@') ? text : '';
      },
      canonicalizeChannelInput(value) {
        const text = typeof value === 'string' ? value.trim() : '';
        if (/^UC[a-zA-Z0-9_-]{22}$/.test(text)) return { type: 'ucid', value: text };
        if (text.startsWith('@')) return { type: 'handle', value: text };
        return null;
      },
      extractChannelIdFromPath(value) {
        const text = typeof value === 'string' ? value : '';
        const match = text.match(/UC[a-zA-Z0-9_-]{22}/);
        return match ? match[0] : '';
      },
      extractCustomUrlFromPath(value) {
        const text = typeof value === 'string' ? value.trim() : '';
        return text.startsWith('c/') || text.startsWith('user/') ? text : '';
      }
    }
  });
  assert.deepEqual(plain(mergeContext.__result.counts), {
    imported: 0,
    updated: 1,
    duplicates: 0,
    skipped: 0
  });
  assert.equal(mergeContext.__result.channels.length, 1);
  assert.equal(mergeContext.__result.channels[0].name, 'Readable Channel');
  assert.equal(mergeContext.__result.channels[0].customUrl, 'c/sample');
  assert.equal(mergeContext.__result.channels[0].source, 'manual');
  assert.equal(mergeContext.__result.channels[0].filterAll, true);
  assert.equal(mergeContext.__result.channels[0].filterAllComments, false);

  const syncContext = runSnippet(blocks.syncKeywords, `
    __synced = syncStoredMainKeywordsWithChannels(__keywords, __channels);
  `, {
    __keywords: [
      { word: 'manual keyword', source: 'manual' },
      { word: 'packed old', source: 'channel:ucactive000000000000000001|old', addedAt: 5 },
      { word: 'stale', source: 'channel', channelRef: 'ucstale000000000000000001' },
      'primitive keyword'
    ],
    __channels: [
      { id: 'UCactive000000000000000001', name: 'Active Channel', filterAll: true, filterAllComments: true, addedAt: 20 },
      { id: 'UCnew000000000000000000001', name: 'New Channel', filterAll: true, filterAllComments: false, addedAt: 30 },
      { id: 'UCignored0000000000000001', name: 'Ignored Channel', filterAll: false }
    ]
  });
  assert.equal(syncContext.__synced.some(entry => entry?.channelRef === 'ucstale000000000000000001'), false);
  assert.ok(syncContext.__synced.includes('primitive keyword'));
  assert.ok(syncContext.__synced.some(entry => entry?.source === 'manual' && entry.word === 'manual keyword'));
  assert.ok(syncContext.__synced.some(entry =>
    entry?.channelRef === 'ucactive000000000000000001'
    && entry.word === 'Active Channel'
    && entry.comments === true
    && entry.addedAt === 5
  ));
  assert.ok(syncContext.__synced.some(entry =>
    entry?.channelRef === 'ucnew000000000000000000001'
    && entry.word === 'New Channel'
    && entry.comments === false
    && entry.addedAt === 30
  ));

  const customContext = runSnippet(blocks.customUrl, `
    __values = [
      extractCustomUrlFromPath('https://www.youtube.com/c/Creator%20Name/videos?view=57'),
      extractCustomUrlFromPath('/user/LegacyUser?feature=watch'),
      extractCustomUrlFromPath('/watch?v=abc')
    ];
  `);
  assert.deepEqual(plain(customContext.__values), ['c/Creator Name', 'user/LegacyUser', '']);
});

test('runtime source lacks background method semantic authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'backgroundMethodAuthority',
    'backgroundMethodEffectReport',
    'backgroundMethodNoWorkBudget',
    'backgroundStorageRevisionReport',
    'backgroundNetworkResolverBudget',
    'backgroundRuleMutationContract',
    'backgroundBackupScheduleAuthority'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
