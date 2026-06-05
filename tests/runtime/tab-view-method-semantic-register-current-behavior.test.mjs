import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/tab-view.js';

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

function groupForLine(line) {
  if (line <= 45) return 'responsiveNavigationShell';
  if (line <= 1375) return 'mainFiltersContentControls';
  if (line <= 2542) return 'kidsFiltersContentControls';
  if (line <= 2656) return 'routeIntentAndReleaseNotes';
  if (line <= 3151) return 'runtimeMessagingBrowserTabs';
  if (line >= 3172 && line <= 3297) return 'profileAccessAndManagedChild';
  if (line <= 3480) return 'runtimeMessagingBrowserTabs';
  if (line <= 3867) return 'subscriptionsImportBridge';
  if (line <= 4155) return 'profileDropdownAndBackupControls';
  if (line <= 5826) return 'profileAccessAndManagedChild';
  if (line <= 6238) return 'lockNavigationAndSubscriptionFlow';
  if (line <= 6502) return 'modalDialogHelpers';
  if (line <= 7475) return 'nanahModeScopePolicyModal';
  if (line <= 8077) return 'nanahTargetProfileDevicePolicy';
  if (line <= 8903) return 'nanahTrustedLinkStorage';
  if (line <= 9751) return 'nanahSessionUiAndEnvelope';
  if (line <= 10823) return 'nanahApplyProposalTransport';
  if (line <= 11445) return 'pinProfilesManager';
  if (line <= 11864) return 'importExportDownload';
  if (line <= 12591) return 'settingsSyncAccountPolicyHandlers';
  if (line <= 12925) return 'dateFilterHelpers';
  if (line <= 13182) return 'managedRowsListModeRender';
  if (line <= 13507) return 'dashboardStatsFiltering';
  if (line <= 14000) return 'dateFilterHelpers';
  if (line <= 14269) return 'navigationAndToasts';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    let match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const sourceLine = index + 1;
      rows.push({
        line: sourceLine,
        kind: match[1] ? 'async function' : 'function',
        name: match[2],
        group: groupForLine(sourceLine)
      });
      return;
    }

    match = line.match(/^\s*(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    if (match) {
      const sourceLine = index + 1;
      rows.push({
        line: sourceLine,
        kind: /async/.test(line) ? `async ${match[1]} arrow` : `${match[1]} arrow`,
        name: match[2],
        group: groupForLine(sourceLine)
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

function stateManagerCalls() {
  return [...read(sourcePath).matchAll(/StateManager\.([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]);
}

function renderEngineCalls() {
  return [...read(sourcePath).matchAll(/RenderEngine\.([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]);
}

function actionLiterals() {
  return [...read(sourcePath).matchAll(/\baction:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function extractFunctionSource(name) {
  const lines = read(sourcePath).split(/\r?\n/);
  const declaration = new RegExp(`^(\\s*)(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const startIndex = lines.findIndex((line) => declaration.test(line));
  assert.notEqual(startIndex, -1, `missing function ${name}`);
  const indent = lines[startIndex].match(/^\s*/)[0];
  const nextDeclaration = new RegExp(`^${indent}(?:async\\s+)?function\\s+[A-Za-z_$][\\w$]*\\s*\\(`);
  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (nextDeclaration.test(lines[index])) {
      endIndex = index;
      break;
    }
  }
  return lines.slice(startIndex, endIndex).join('\n');
}

function loadExtractedFunctions(names, extraContext = {}) {
  const uniqueNames = [...new Set(names)];
  const context = {
    console: { log() {}, warn() {}, error() {} },
    Date,
    URL,
    JSON,
    Math,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    ...extraContext
  };
  vm.createContext(context);
  const body = uniqueNames.map(extractFunctionSource).join('\n\n');
  vm.runInContext(`${body}\nthis.__exports = { ${uniqueNames.join(', ')} };`, context);
  return context.__exports;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('tab-view method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior changed: profile-scoped Nanah managed trusted-link lookup, storage, connected target chooser, and signed fanout./);
  assert.match(text, /source file: js\/tab-view\.js/);
  assert.match(text, /named declarations: 397/);
  assert.match(text, /plain function declarations: 267/);
  assert.match(text, /async function declarations: 97/);
  assert.match(text, /const arrow helper declarations: 31/);
  assert.match(text, /async const arrow helper declarations: 2/);
  assert.match(text, /semantic method groups: 22/);
  assert.match(text, /addEventListener sites: 151/);
  assert.match(text, /direct StateManager calls: 42/);
  assert.match(text, /unique StateManager methods reached: 14/);
  assert.match(text, /RenderEngine calls: 4/);
  assert.match(text, /sendRuntimeMessage calls: 8/);
  assert.match(text, /not completion proof for every inline callback/);
});

test('tab-view register pins source fingerprint and broad callable reconciliation', () => {
  const stats = sourceStats();
  const rows = methodRows();
  const broadRows = broadCallableRows();
  const broadCounts = countNames(broadRows);
  const controlArtifacts = (broadCounts.if || 0) + (broadCounts.for || 0) + (broadCounts.while || 0);
  const heldOutsideRegister = broadRows.length - rows.length - controlArtifacts;
  const text = doc();

  assert.deepEqual(stats, {
    bytes: 663047,
    sha256: '7515fbce26e7718b820e35bc5b77bc2d8298cb7dacc3aa1421e671894028d867',
    splitLines: 14270,
    wcLines: 14269
  });
  assert.equal(broadRows.length, 1048);
  assert.equal(controlArtifacts, 651);
  assert.equal(heldOutsideRegister, 0);
  assert.deepEqual({
    if: broadCounts.if,
    for: broadCounts.for,
    while: broadCounts.while
  }, {
    if: 644,
    for: 5,
    while: 2
  });

  for (const expected of [
    'source split lines: 14270',
    'source wc -l: 14269',
    'source bytes: 663047',
    'source sha256: 7515fbce26e7718b820e35bc5b77bc2d8298cb7dacc3aa1421e671894028d867',
    'broad lexical callable matches: 1048',
    'accepted named declaration rows: 397',
    'semantic method rows promoted: 397',
    'control-flow lexical artifacts: 651 (`if`: 644, `for`: 5, `while`: 2)',
    'local/listener/timer callbacks held outside this named method register: 0',
    'executable current-behavior probes: 6'
  ]) {
    assert.ok(text.includes(expected), `missing source reconciliation line ${expected}`);
  }
});

test('tab-view register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 397);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async const arrow': 2,
    'async function': 97,
    'const arrow': 31,
    function: 267
  });
  assert.deepEqual(countBy(rows, 'group'), {
    dashboardStatsFiltering: 10,
    dateFilterHelpers: 7,
    importExportDownload: 8,
    kidsFiltersContentControls: 18,
    lockNavigationAndSubscriptionFlow: 7,
    mainFiltersContentControls: 20,
    managedRowsListModeRender: 15,
    modalDialogHelpers: 7,
    nanahApplyProposalTransport: 20,
    nanahModeScopePolicyModal: 47,
    nanahSessionUiAndEnvelope: 12,
    nanahTargetProfileDevicePolicy: 37,
    nanahTrustedLinkStorage: 36,
    navigationAndToasts: 3,
    pinProfilesManager: 8,
    profileAccessAndManagedChild: 86,
    profileDropdownAndBackupControls: 11,
    responsiveNavigationShell: 3,
    routeIntentAndReleaseNotes: 4,
    runtimeMessagingBrowserTabs: 17,
    settingsSyncAccountPolicyHandlers: 3,
    subscriptionsImportBridge: 18
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('tab-view register preserves every source row', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing tab-view method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('tab-view register pins current DOM listener timer and dependency surface', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal((source.match(/\.addEventListener\(/g) || []).length, 151);
  assert.equal((source.match(/document\.addEventListener\(/g) || []).length, 2);
  assert.equal((source.match(/window\.addEventListener\(/g) || []).length, 5);
  assert.equal((source.match(/\bsetTimeout\(/g) || []).length, 14);
  assert.equal((source.match(/\bsetInterval\(/g) || []).length, 1);
  assert.equal((source.match(/\bclearInterval\(/g) || []).length, 1);
  assert.equal((source.match(/\brequestAnimationFrame\(/g) || []).length, 11);
  assert.equal((source.match(/\bMutationObserver\b/g) || []).length, 0);
  assert.equal((source.match(/document\.getElementById\(/g) || []).length, 248);
  assert.equal((source.match(/\.querySelector\(/g) || []).length, 33);
  assert.equal((source.match(/\.querySelectorAll\(/g) || []).length, 28);
  assert.equal((source.match(/document\.createElement\(/g) || []).length, 354);
  assert.equal((source.match(/\.innerHTML\s*=/g) || []).length, 40);
  assert.equal((source.match(/\.setAttribute\(/g) || []).length, 61);
  assert.equal((source.match(/\.dataset\.[A-Za-z_$][\w$]*\s*=/g) || []).length, 15);
  assert.equal((source.match(/window\.confirm\(/g) || []).length, 6);
  assert.equal((source.match(/showPromptModal\(/g) || []).length, 14);
  assert.equal((source.match(/showChoiceModal\(/g) || []).length, 10);

  for (const token of [
    'document.getElementById calls: 248',
    'querySelector calls: 33',
    'querySelectorAll calls: 28',
    'document.createElement calls: 354',
    'innerHTML writes: 40',
    'dataset writes: 15',
    'setAttribute calls: 61',
    'requestAnimationFrame calls: 11'
  ]) {
    assert.ok(text.includes(token), `missing current DOM/lifecycle token ${token}`);
  }
});

test('tab-view register pins current StateManager RenderEngine and action crossings', () => {
  const text = doc();
  const stateCalls = stateManagerCalls();
  const rendererCalls = renderEngineCalls();
  const actions = actionLiterals();

  assert.equal(stateCalls.length, 42);
  assert.deepEqual([...new Set(stateCalls)].sort(), [
    'addChannel',
    'addKeyword',
    'addKidsChannel',
    'addKidsKeyword',
    'getState',
    'importSubscribedChannelsToWhitelist',
    'loadSettings',
    'subscribe',
    'toggleTheme',
    'updateCategoryFilters',
    'updateContentFilters',
    'updateKidsCategoryFilters',
    'updateKidsContentFilters',
    'updateSetting'
  ]);

  assert.equal(rendererCalls.length, 4);
  assert.deepEqual([...new Set(rendererCalls)].sort(), [
    'renderChannelList',
    'renderKeywordList'
  ]);

  assert.equal(actions.length, 10);
  assert.deepEqual([...new Set(actions)].sort(), [
    'FilterTube_ClearSessionPin',
    'FilterTube_EnsureSubscriptionsImportBridge',
    'FilterTube_Ping',
    'FilterTube_ScheduleAutoBackup',
    'FilterTube_SessionPinAuth',
    'FilterTube_SetListMode',
    'FilterTube_TransferWhitelistToBlocklist',
    'apply_once',
    'save'
  ]);

  for (const token of [
    'direct StateManager calls: 42',
    'unique StateManager methods reached: 14',
    'RenderEngine calls: 4',
    'unique RenderEngine methods reached: 2',
    'sendRuntimeMessage calls: 8',
    'action literal count: 10',
    'FilterTube_SetListMode',
    'FilterTube_TransferWhitelistToBlocklist',
    'importSubscribedChannelsToWhitelist'
  ]) {
    assert.ok(text.includes(token), `missing dependency/action token ${token}`);
  }
});

test('tab-view source still proves current behavior boundaries', () => {
  const source = read(sourcePath);

  assert.match(source, /document\.addEventListener\('DOMContentLoaded', async \(\) => \{/);
  assert.match(source, /window\.FilterTubeIsUiLocked = \(\) => true/);
  assert.match(source, /initializeResponsiveNav\(\);/);
  assert.match(source, /initializeFiltersTabs\(\);/);
  assert.match(source, /initializeKidsTabs\(\);/);
  assert.match(source, /setupNavigation\(\);/);
  assert.match(source, /await StateManager\.loadSettings\(\);/);
  assert.match(source, /runtimeAPI\.runtime\.sendMessage\(payload/);
  assert.match(source, /action: 'FilterTube_SessionPinAuth'/);
  assert.match(source, /action: 'FilterTube_ClearSessionPin'/);
  assert.match(source, /action: 'FilterTube_EnsureSubscriptionsImportBridge'/);
  assert.match(source, /result = await StateManager\.importSubscribedChannelsToWhitelist\(/);
  assert.match(source, /action: 'FilterTube_SetListMode'[\s\S]*copyBlocklist: false/);
  assert.match(source, /window\.__filtertubeSaveManagedChildSurface = saveManagedChildSurface/);
  assert.match(source, /RenderEngine\.renderKeywordList\(keywordListEl/);
  assert.match(source, /RenderEngine\.renderChannelList\(channelListEl/);
  assert.match(source, /action: 'FilterTube_TransferWhitelistToBlocklist'/);
  assert.match(source, /dashboardStatsRotationTimer = setInterval\(\(\) => \{/);
  assert.match(source, /window\.addEventListener\('hashchange', handleNavigationIntent\)/);
  assert.match(source, /window\.addEventListener\('popstate', handleNavigationIntent\)/);
  assert.match(source, /window\.switchView = switchView/);
  assert.match(source, /URL\.revokeObjectURL\(blobUrl\)/);
});

test('tab-view executable probes subscription import URL and tab ordering helpers', () => {
  const helpers = loadExtractedFunctions([
    'normalizeString',
    'isMainYoutubeUrl',
    'isYoutubeChannelsFeedUrl',
    'isYoutubeSignInUrl',
    'buildYoutubeChannelsFeedUrl',
    'getOrderedYoutubeTabs',
    'pickBestYoutubeTab',
    'describeSubscriptionsImportError'
  ]);

  assert.equal(helpers.isMainYoutubeUrl('https://www.youtube.com/watch?v=abc'), true);
  assert.equal(helpers.isMainYoutubeUrl('https://m.youtube.com/feed/channels'), true);
  assert.equal(helpers.isMainYoutubeUrl('https://youtubekids.com/watch?v=abc'), false);
  assert.equal(helpers.isYoutubeChannelsFeedUrl('https://m.youtube.com/feed/channels'), true);
  assert.equal(helpers.isYoutubeChannelsFeedUrl('https://www.youtube.com/feed/subscriptions'), false);
  assert.equal(helpers.isYoutubeSignInUrl('https://accounts.google.com/signin/v2'), true);
  assert.equal(helpers.isYoutubeSignInUrl('https://www.youtube.com/signin'), true);
  assert.equal(helpers.buildYoutubeChannelsFeedUrl('https://www.youtube.com/feed/subscriptions'), 'https://m.youtube.com/feed/channels');

  const tabs = [
    { id: 1, url: 'https://www.youtube.com/', active: true, status: 'complete' },
    { id: 2, url: 'https://m.youtube.com/feed/channels', active: true, status: 'complete' },
    { id: 3, url: 'https://www.youtube.com/feed/channels', active: false, status: 'loading' },
    { id: 4, url: 'https://youtubekids.com/', active: true, status: 'complete' }
  ];
  assert.deepEqual(plain(helpers.getOrderedYoutubeTabs(tabs, 3).map((tab) => tab.id)), [2, 1, 3]);
  assert.equal(helpers.pickBestYoutubeTab(tabs, 3).id, 2);

  assert.equal(
    helpers.describeSubscriptionsImportError({ errorCode: 'receiver_unavailable' }),
    'The YouTube tab is still starting FilterTube. Keep it open for a moment, then retry.'
  );
  assert.equal(
    helpers.describeSubscriptionsImportError({ error: '  custom import failure  ' }),
    'custom import failure'
  );
});

test('tab-view executable probes managed child profile normalizers and surfaces', () => {
  const helpers = loadExtractedFunctions([
    'safeObject',
    'normalizeString',
    'clonePlain',
    'normalizeProfileKeyword',
    'normalizeProfileChannel',
    'getProfileSurface',
    'setProfileSurface'
  ]);

  assert.deepEqual(
    { ...plain(helpers.normalizeProfileKeyword('  Alpha  ', { exact: true, comments: true, source: 'channel', channelRef: 'ucmain' })), addedAt: 0 },
    { word: 'Alpha', exact: true, semantic: false, source: 'channel', channelRef: 'ucmain', comments: true, addedAt: 0 }
  );
  assert.equal(helpers.normalizeProfileKeyword('   '), null);
  assert.deepEqual(
    { ...plain(helpers.normalizeProfileChannel('@Creator')), addedAt: 0 },
    { name: '@Creator', id: '@Creator', handle: '@Creator', customUrl: null, originalInput: '@Creator', source: 'user', filterAll: false, addedAt: 0 }
  );
  assert.deepEqual(
    { ...plain(helpers.normalizeProfileChannel('/c/Creator')), addedAt: 0 },
    { name: '/c/Creator', id: 'c/Creator', handle: null, customUrl: 'c/Creator', originalInput: '/c/Creator', source: 'user', filterAll: false, addedAt: 0 }
  );
  assert.equal(helpers.normalizeProfileChannel('plain channel name'), null);

  const profile = {
    main: {
      mode: 'whitelist',
      blockedKeywords: [{ word: 'legacy' }],
      blockedChannels: [{ id: 'UCLEGACY' }],
      whitelistKeywords: [{ word: 'allow' }]
    },
    kids: {
      mode: 'not-valid',
      blockedKeywords: [{ word: 'kid' }],
      strictMode: false
    }
  };
  const mainSurface = helpers.getProfileSurface(profile, 'main');
  assert.deepEqual(plain(mainSurface.keywords), [{ word: 'legacy' }]);
  assert.deepEqual(plain(mainSurface.channels), [{ id: 'UCLEGACY' }]);
  assert.equal(mainSurface.mode, 'whitelist');
  mainSurface.keywords[0].word = 'changed';
  assert.equal(profile.main.blockedKeywords[0].word, 'legacy');

  const kidsSurface = helpers.getProfileSurface(profile, 'kids');
  assert.equal(kidsSurface.mode, 'blocklist');
  assert.equal(kidsSurface.strictMode, false);

  const nextMain = helpers.setProfileSurface(profile, 'main', {
    mode: 'whitelist',
    keywords: [{ word: 'next' }],
    channels: [{ id: 'UCNEXT' }]
  });
  assert.deepEqual(plain(nextMain.main.blockedKeywords), [{ word: 'next' }]);
  assert.deepEqual(plain(nextMain.main.blockedChannels), [{ id: 'UCNEXT' }]);
  assert.equal(nextMain.main.mode, 'whitelist');
});

test('tab-view executable probes date helpers and Nanah policy normalization', () => {
  const helpers = loadExtractedFunctions([
    'safeObject',
    'normalizeString',
    'toDateInputValue',
    'parseDateInput',
    'normalizeNanahCode',
    'extractNanahCodeFromInput',
    'getNanahScopeList',
    'getNanahManagedPolicyScopeList',
    'getNanahManagedSendScopeList',
    'classifyNanahTrustedLink',
    'getNanahReconnectMode',
    'getNanahLockedChildMode',
    'getNanahChildProtectionLevel',
    'getNanahTargetProfileBehavior',
    'buildNanahProfileScopedLinkId',
    'getNanahTrustedLinkTargetProfileId',
    'getNanahTrustedLinkIdentityKey',
    'normalizeNanahTrustedLink'
  ]);

  assert.equal(helpers.toDateInputValue(new Date(2026, 4, 25, 12, 30)), '2026-05-25');
  assert.equal(helpers.toDateInputValue(new Date('not-a-date')), '');
  assert.equal(helpers.parseDateInput('2026-05-25'), new Date(2026, 4, 25, 0, 0, 0, 0).getTime());
  assert.equal(helpers.parseDateInput('2026-05-25', true), new Date(2026, 4, 25, 23, 59, 59, 999).getTime());
  assert.equal(helpers.parseDateInput('bad-input'), null);

  assert.equal(helpers.normalizeNanahCode('abcio10!23456789'), 'ABC23456');
  assert.equal(helpers.extractNanahCodeFromInput('nanah://pair?code=abc23456'), 'ABC23456');
  assert.deepEqual(plain(helpers.getNanahScopeList(['full', 'kids', 'bad', 'kids'])), ['full', 'kids']);
  assert.deepEqual(plain(helpers.getNanahScopeList([])), ['active']);
  assert.deepEqual(plain(helpers.getNanahManagedPolicyScopeList(['keywords', 'channels', 'full', 'keywords'])), ['keywords', 'channels', 'main', 'kids', 'viewing_space', 'time_limits']);
  assert.deepEqual(plain(helpers.getNanahManagedSendScopeList(['keywords', 'channels', 'full', 'keywords'])), ['keywords', 'channels', 'full']);
  assert.equal(helpers.classifyNanahTrustedLink('source', 'replica'), 'managed_link');
  assert.equal(helpers.classifyNanahTrustedLink('peer', 'peer'), 'peer_link');

  const managedLink = plain(helpers.normalizeNanahTrustedLink({
    remoteDeviceId: ' device-1 ',
    localRole: 'source',
    remoteRole: 'replica',
    policy: {
      allowedScopes: ['main', 'kids', 'kids', 'bogus'],
      applyMode: 'replace',
      autoApplyControlProposals: true,
      targetProfileBehavior: 'fixed',
      targetProfileId: ' child-1 ',
      targetProfileName: ' Kid One '
    }
  }));
  assert.equal(managedLink.remoteDeviceId, 'device-1');
  assert.equal(managedLink.linkId, 'nanah-device-1-target-child-1');
  assert.equal(managedLink.trustedLinkIdentityKey, 'managed:device-1:source:replica:child-1');
  assert.equal(managedLink.identityKey, 'managed:device-1:source:replica:child-1');
  assert.equal(managedLink.linkType, 'managed_link');
  assert.equal(managedLink.policy.decisionMode, 'source');
  assert.deepEqual(managedLink.policy.allowedScopes, ['main', 'kids']);
  assert.equal(managedLink.policy.defaultScope, 'main');
  assert.equal(managedLink.policy.applyMode, 'replace');
  assert.equal(managedLink.policy.autoApplyControlProposals, true);
  assert.equal(managedLink.policy.reconnectMode, 'approval_needed');
  assert.equal(managedLink.policy.targetProfileBehavior, 'fixed_profile');
  assert.equal(managedLink.policy.targetProfileId, 'child-1');

  const customManagedLink = plain(helpers.normalizeNanahTrustedLink({
    linkId: 'custom-link-1',
    remoteDeviceId: 'device-1',
    localRole: 'source',
    remoteRole: 'replica',
    policy: {
      targetProfileBehavior: 'fixed_profile',
      targetProfileId: 'child-2'
    }
  }));
  assert.equal(customManagedLink.linkId, 'custom-link-1');
  assert.equal(customManagedLink.trustedLinkIdentityKey, 'managed:device-1:source:replica:child-2');

  const granularManagedLink = plain(helpers.normalizeNanahTrustedLink({
    remoteDeviceId: ' device-2 ',
    localRole: 'replica',
    remoteRole: 'source',
    policy: {
      allowedScopes: ['keywords', 'channels', 'main', 'bogus'],
      defaultScope: 'keywords'
    }
  }));
  assert.deepEqual(granularManagedLink.policy.allowedScopes, ['keywords', 'channels', 'main']);
  assert.equal(granularManagedLink.policy.defaultScope, 'keywords');

  const peerLink = plain(helpers.normalizeNanahTrustedLink({ remoteDeviceId: 'peer-1', localRole: 'peer', remoteRole: 'peer' }));
  assert.equal(peerLink.linkType, 'peer_link');
  assert.equal(peerLink.linkId, 'nanah-peer-1');
  assert.equal(peerLink.trustedLinkIdentityKey, 'device:peer-1:peer:peer:peer_link');
  assert.equal(peerLink.policy.decisionMode, 'receiver');
  assert.equal(peerLink.policy.autoApplyControlProposals, false);
  assert.equal(peerLink.policy.reconnectMode, 'fast');
});

test('tab-view register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerUi',
    'profileType',
    'profileId',
    'activeView',
    'listModeInput',
    'stateSource',
    'managedChildEditState',
    'lockSessionState',
    'runtimeMessageAction',
    'ioMutationEffect',
    'stateManagerMutationEffect',
    'renderEngineDelegation',
    'nanahScope',
    'nanahStrategy',
    'importExportScope',
    'browserTabTarget',
    'domSelectorTarget',
    'domWriteEffect',
    'listenerEffect',
    'timerEffect',
    'frameEffect',
    'globalExportEffect',
    'backupScheduleEffect',
    'navigationEffect',
    'modalEffect',
    'accessibilityFixture',
    'positiveFixture',
    'negativeModeFixture',
    'negativeLockFixture',
    'negativeProfileFixture',
    'negativeSyncFixture',
    'negativeImportFixture',
    'negativeSiblingFixture',
    'performanceBudget',
    'teardownPolicy',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks tab-view method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'tabViewMethodAuthority',
    'tabViewListenerLifecycleContract',
    'tabViewListModeMutationReport',
    'tabViewManagedChildEditContract',
    'tabViewNanahSyncPolicyReport',
    'tabViewImportExportMutationPlan',
    'tabViewProfileLockAccessReport',
    'tabViewDashboardRenderBudget',
    'tabViewNavigationStateContract'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
