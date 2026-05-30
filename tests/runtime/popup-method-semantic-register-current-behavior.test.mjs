import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_POPUP_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/popup.js';

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

function groupForMethod(name, line) {
  if (['initializePopupFiltersTabs', 'hexToRgba', 'applyControlGroupTheme'].includes(name)) {
    return 'popupBootstrapAndContentDom';
  }
  if ([
    'updatePopupVideoFilterUI',
    'applyPopupContentFilters',
    'applyPopupKidsContentFilters',
    'updatePopupVideoFiltersVisibility',
    'applyPopupVideoFiltersForActiveProfile',
    'savePopupVideoFilters'
  ].includes(name)) return 'popupVideoFilterControls';
  if (name === 'resolveProfileTypeFromTabs') {
    return line < 700 ? 'popupVideoFilterControls' : 'popupListModeControls';
  }
  if (['applyPopupContentControlsVisibility'].includes(name)) return 'popupContentControlVisibility';
  if (['sendRuntimeMessage', 'syncSessionUnlockStateFromBackground', 'notifyBackgroundUnlocked'].includes(name)) {
    return 'popupRuntimeMessagingAndSessionUnlock';
  }
  if (['renderListModeControls', 'handleModeToggle'].includes(name)) return 'popupListModeControls';
  if (['safeObject', 'normalizeString'].includes(name)) return 'popupDefensiveHelpers';
  if ([
    'updateSubscriptionsShortcut',
    'extractMasterPinVerifier',
    'extractProfilePinVerifier',
    'isProfileLocked',
    'getProfileName',
    'buildProfileLabel',
    'buildProfileSubtitle',
    'getProfileType',
    'getProfileAccessCopy',
    'getParentAccountId',
    'getSortedIdsByName',
    'getAccountIds',
    'getChildrenForAccount',
    'getProfileColors',
    'getProfileInitial'
  ].includes(name)) return 'popupProfileMetadataHelpers';
  if ([
    'closeProfileDropdown',
    'positionProfileDropdown',
    'toggleProfileDropdown',
    'showPromptModal',
    'cleanup',
    'closeWith',
    'verifyPin',
    'ensureProfileUnlocked'
  ].includes(name)) return 'popupDropdownModalAndPinUnlock';
  if ([
    'isUiLocked',
    'applyLockGateIfNeeded',
    'renderProfileSelector',
    'appendProfileBtn',
    'refreshProfilesUI',
    'switchToProfile'
  ].includes(name)) return 'popupLockGateAndProfileSwitch';
  if (['renderKeywords', 'renderChannels', 'filterContentControlsPopup', 'updateCheckboxes'].includes(name)) {
    return 'popupRenderingAndSearchSync';
  }
  if (name === 'handleToggle') return 'popupEnabledToggle';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    let match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: match[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name, index + 1)
      });
      return;
    }

    match = line.match(/^\s*(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: /async/.test(line) ? `async ${match[1]} arrow` : `${match[1]} arrow`,
        name,
        group: groupForMethod(name, index + 1)
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

function getElementIds() {
  return Array.from(new Set(
    [...read(sourcePath).matchAll(/document\.getElementById\('([^']+)'\)/g)].map((match) => match[1])
  )).sort();
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
  const source = read(sourcePath);
  const declaration = new RegExp(`(?:^|\\n)(\\s*)(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const match = declaration.exec(source);
  assert.notEqual(match, null, `missing function ${name}`);

  const startIndex = match.index + (match[0].startsWith('\n') ? 1 : 0);
  const openBrace = source.indexOf('{', match.index + match[0].length);
  assert.notEqual(openBrace, -1, `missing function body for ${name}`);

  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] || '';

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === '\'' || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  assert.fail(`unterminated function body for ${name}`);
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
    Promise,
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

function makeMiniRow({ search = '', hasCatalogToggle = false } = {}) {
  return {
    hidden: false,
    style: { display: '' },
    getAttribute(name) {
      if (name === 'data-ft-search') return search;
      return '';
    },
    querySelector(selector) {
      if (selector === 'input[type="checkbox"][data-ft-setting]' && hasCatalogToggle) return {};
      return null;
    }
  };
}

function makeMiniGroup({ id, title, rows }) {
  return {
    hidden: false,
    style: { display: '' },
    getAttribute(name) {
      if (name === 'data-ft-group-id') return id;
      if (name === 'data-ft-group-title') return title;
      return '';
    },
    querySelectorAll(selector) {
      if (selector === '.toggle-row' || selector === '[data-ft-control-row]') return rows;
      return [];
    }
  };
}

test('popup method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/popup\.js/);
  assert.match(text, /line count: 1841/);
  assert.match(text, /named declarations: 53/);
  assert.match(text, /plain function declarations: 36/);
  assert.match(text, /async function declarations: 11/);
  assert.match(text, /const arrow helper declarations: 3/);
  assert.match(text, /async const arrow helper declarations: 3/);
  assert.match(text, /public exported API entries: 0/);
  assert.match(text, /semantic method groups: 11/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for every popup DOM element/);
});

test('popup register pins source fingerprint and broad callable reconciliation', () => {
  const stats = sourceStats();
  const rows = methodRows();
  const broadRows = broadCallableRows();
  const broadCounts = countNames(broadRows);
  const controlArtifacts = broadCounts.if || 0;
  const heldOutsideRegister = broadRows.length - rows.length - controlArtifacts;
  const text = doc();

  assert.deepEqual(stats, {
    bytes: 75587,
    sha256: 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a',
    splitLines: 1842,
    wcLines: 1841
  });
  assert.equal(broadRows.length, 131);
  assert.equal(controlArtifacts, 78);
  assert.equal(heldOutsideRegister, 0);
  assert.deepEqual({ if: broadCounts.if }, { if: 78 });

  for (const expected of [
    'source split lines: 1842',
    'source wc -l: 1841',
    'source bytes: 75587',
    'source sha256: cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a',
    'broad lexical callable matches: 131',
    'accepted named declaration rows: 53',
    'semantic method rows promoted: 53',
    'control-flow lexical artifacts: 78 (`if`: 78)',
    'local/listener/timer callbacks held outside this named method register: 0',
    'executable current-behavior probes: 6'
  ]) {
    assert.ok(text.includes(expected), `missing source reconciliation line ${expected}`);
  }
});

test('popup register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 53);
  assert.deepEqual(countBy(rows, 'kind'), {
    'async const arrow': 3,
    'async function': 11,
    'const arrow': 3,
    function: 36
  });
  assert.deepEqual(countBy(rows, 'group'), {
    popupBootstrapAndContentDom: 3,
    popupContentControlVisibility: 1,
    popupDefensiveHelpers: 2,
    popupDropdownModalAndPinUnlock: 8,
    popupEnabledToggle: 1,
    popupListModeControls: 3,
    popupLockGateAndProfileSwitch: 6,
    popupProfileMetadataHelpers: 15,
    popupRenderingAndSearchSync: 4,
    popupRuntimeMessagingAndSessionUnlock: 3,
    popupVideoFilterControls: 7
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('popup register preserves every source row and DOM id entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing popup method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  assert.deepEqual(getElementIds(), [
    'addChannelBtn',
    'addKeywordBtn',
    'channelInput',
    'channelList',
    'extensionStatusText',
    'ftProfileBadgeBtnPopup',
    'ftProfileDropdownPopup',
    'ftProfileMenuPopup',
    'ftTopBarListModeControlsPopup',
    'keywordList',
    'newKeywordInput',
    'openInTabBtn',
    'popupFiltersTabsContainer',
    'popupVideoFilter_duration_enabled',
    'popupVideoFilter_duration_enabled_kids',
    'popupVideoFilter_uploadDate_enabled',
    'popupVideoFilter_uploadDate_enabled_kids',
    'popupVideoFilter_uppercase_enabled',
    'popupVideoFilter_uppercase_enabled_kids',
    'searchChannelsPopup',
    'searchContentControlsPopup',
    'searchKeywordsPopup',
    'toggleEnabledBrandBtn'
  ]);

  for (const id of getElementIds()) {
    assert.ok(text.includes(id), `missing popup DOM id ${id}`);
  }
});

test('popup register pins DOM listener timer and dependency surface counts', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal((source.match(/document\.getElementById\(/g) || []).length, 52);
  assert.equal(getElementIds().length, 23);
  assert.equal((source.match(/document\.createElement\(/g) || []).length, 82);
  assert.equal((source.match(/document\.querySelector\(/g) || []).length, 3);
  assert.equal((source.match(/\.querySelector\(/g) || []).length, 4);
  assert.equal((source.match(/\.querySelectorAll\(/g) || []).length, 6);
  assert.equal((source.match(/\.addEventListener\(/g) || []).length, 30);
  assert.equal((source.match(/document\.addEventListener\(/g) || []).length, 3);
  assert.equal((source.match(/\bsetTimeout\(/g) || []).length, 2);
  assert.equal((source.match(/\bclearTimeout\(/g) || []).length, 0);
  assert.equal((source.match(/\bsetInterval\(/g) || []).length, 0);
  assert.equal((source.match(/\brequestAnimationFrame\(/g) || []).length, 1);
  assert.equal((source.match(/\.innerHTML\s*=/g) || []).length, 5);
  assert.equal((source.match(/\.textContent\s*=/g) || []).length, 29);
  assert.equal((source.match(/\.setAttribute\(/g) || []).length, 34);
  assert.equal((source.match(/\.style\.setProperty\(/g) || []).length, 9);
  assert.equal((source.match(/\.style\.display\s*=/g) || []).length, 6);
  assert.equal((source.match(/\.hidden\s*=/g) || []).length, 9);
  assert.equal((source.match(/\.appendChild\(/g) || []).length, 76);
  assert.equal((source.match(/\bStateManager\./g) || []).length, 19);
  assert.equal((source.match(/\bRenderEngine\./g) || []).length, 2);
  assert.equal((source.match(/\bUIComponents\./g) || []).length, 13);
  assert.equal((source.match(/\bsendRuntimeMessage\(/g) || []).length, 4);
  assert.equal((source.match(/runtime\.sendMessage\(/g) || []).length, 1);
  assert.equal((source.match(/tabsApi\.query\(/g) || []).length, 3);
  assert.equal((source.match(/tabsApi\.create\(/g) || []).length, 2);
  assert.equal((source.match(/window\.open\(/g) || []).length, 5);
  assert.equal((source.match(/window\.confirm\(/g) || []).length, 2);
  assert.equal((source.match(/\balert\(/g) || []).length, 2);
  assert.equal((source.match(/FilterTubeIO/g) || []).length, 2);
  assert.equal((source.match(/FilterTubeSecurity/g) || []).length, 1);
  assert.equal((source.match(/FilterTubeSettings/g) || []).length, 1);

  for (const token of [
    'document.getElementById calls: 52',
    'unique getElementById ids: 23',
    'document.createElement calls: 82',
    'document.querySelector calls: 3',
    'querySelector calls: 4',
    'querySelectorAll calls: 6',
    'addEventListener calls: 30',
    'document.addEventListener calls: 3',
    'setTimeout calls: 2',
    'clearTimeout calls: 0',
    'setInterval calls: 0',
    'requestAnimationFrame calls: 1',
    'innerHTML writes: 5',
    'textContent writes: 29',
    'setAttribute calls: 34',
    'style.setProperty calls: 9',
    'style.display writes: 6',
    'hidden writes: 9',
    'appendChild calls: 76',
    'StateManager references: 19',
    'RenderEngine references: 2',
    'UIComponents references: 13',
    'sendRuntimeMessage occurrences: 4',
    'runtime.sendMessage calls: 1',
    'tabs.query calls: 3',
    'tabs.create calls: 2',
    'window.open calls: 5',
    'window.confirm calls: 2',
    'alert calls: 2',
    'FilterTubeIO references: 2',
    'FilterTubeSecurity references: 1',
    'FilterTubeSettings references: 1'
  ]) {
    assert.ok(text.includes(token), `missing popup surface token ${token}`);
  }
});

test('popup source still proves current behavior boundaries', () => {
  const source = read(sourcePath);

  assert.match(source, /function initializePopupFiltersTabs\(\)/);
  assert.match(source, /document\.addEventListener\('DOMContentLoaded', async \(\) => \{/);
  assert.match(source, /window\.FilterTubeIsUiLocked = \(\) => true/);
  assert.match(source, /const catalog = window\.FilterTubeContentControlsCatalog\?\.getCatalog\?\.\(\) \|\| \[\]/);
  assert.match(source, /setTimeout\(\(\) => \{[\s\S]*manageInTab\.addEventListener\('click'/);
  assert.match(source, /StateManager\.subscribe\(\(eventType, data\) => \{/);
  assert.match(source, /action: 'FilterTube_SessionPinAuth'/);
  assert.match(source, /action: 'FilterTube_TransferWhitelistToBlocklist'/);
  assert.match(source, /action: 'FilterTube_SetListMode'/);
  assert.match(source, /await StateManager\.loadSettings\(\)/);
  assert.match(source, /StateManager\.updateKidsContentFilters\(\{/);
  assert.match(source, /StateManager\.updateContentFilters\(\{/);
  assert.match(source, /await StateManager\.updateSetting\(key, el\.checked\)/);
  assert.match(source, /await StateManager\.updateSetting\('enabled', !enabled\)/);
  assert.match(source, /RenderEngine\.renderKeywordList\(keywordList/);
  assert.match(source, /RenderEngine\.renderChannelList\(channelListEl/);
  assert.match(source, /await io\.saveProfilesV4\(\{/);
  assert.match(source, /const ok = await verifyPin\(normalized, verifier\)/);
  assert.match(source, /requestAnimationFrame\(\(\) => positionProfileDropdown\(\)\)/);
});

test('popup executable probes route resolution and Main/Kids video filter saves', async () => {
  const calls = [];
  const elements = new Map([
    ['popupVideoFilter_duration_enabled', { checked: true }],
    ['popupVideoFilter_uploadDate_enabled', { checked: false }],
    ['popupVideoFilter_uppercase_enabled', { checked: true }],
    ['popupVideoFilter_duration_enabled_kids', { checked: false }],
    ['popupVideoFilter_uploadDate_enabled_kids', { checked: true }],
    ['popupVideoFilter_uppercase_enabled_kids', { checked: false }]
  ]);
  const helpers = loadExtractedFunctions(['resolveProfileTypeFromTabs', 'savePopupVideoFilters'], {
    chrome: {
      tabs: {
        query(queryInfo, callback) {
          callback([{ url: 'https://www.youtubekids.com/watch?v=abc' }]);
        }
      }
    },
    document: {
      getElementById(id) {
        return elements.get(id) || null;
      }
    },
    StateManager: {
      getState() {
        return {
          contentFilters: {
            duration: { enabled: false, condition: 'longer' },
            uploadDate: { enabled: true, condition: 'newer' },
            uppercase: { enabled: false, mode: 'single_word' }
          },
          kids: {
            contentFilters: {
              duration: { enabled: true, condition: 'shorter' },
              uploadDate: { enabled: false, condition: 'older' },
              uppercase: { enabled: true, mode: 'all_caps' }
            }
          }
        };
      },
      updateContentFilters(payload) {
        calls.push(['main', plain(payload)]);
        return { ok: true };
      },
      updateKidsContentFilters(payload) {
        calls.push(['kids', plain(payload)]);
        return { ok: true };
      }
    }
  });

  assert.equal(await helpers.resolveProfileTypeFromTabs(), 'kids');
  helpers.savePopupVideoFilters('main');
  helpers.savePopupVideoFilters('kids');

  assert.deepEqual(calls, [
    ['main', {
      duration: { enabled: true, condition: 'longer' },
      uploadDate: { enabled: false, condition: 'newer' },
      uppercase: { enabled: true, mode: 'single_word' }
    }],
    ['kids', {
      duration: { enabled: false, condition: 'shorter' },
      uploadDate: { enabled: true, condition: 'older' },
      uppercase: { enabled: false, mode: 'all_caps' }
    }]
  ]);
});

test('popup executable probes profile metadata and lock copy helpers', () => {
  const helpers = loadExtractedFunctions([
    'safeObject',
    'normalizeString',
    'extractMasterPinVerifier',
    'extractProfilePinVerifier',
    'isProfileLocked',
    'getProfileName',
    'buildProfileLabel',
    'buildProfileSubtitle',
    'getProfileType',
    'getProfileAccessCopy',
    'getParentAccountId',
    'getSortedIdsByName',
    'getAccountIds',
    'getChildrenForAccount',
    'getProfileInitial'
  ]);
  const profilesV4 = {
    activeProfileId: 'account-b',
    profiles: {
      default: { name: 'Default', type: 'account', security: { masterPinVerifier: { salt: 'm' } } },
      'account-b': { name: 'Beta', type: 'account' },
      'account-a': { name: 'Alpha', type: 'account', security: { profilePinVerifier: { salt: 'a' } } },
      'child-z': { name: 'Zed', type: 'child', parentProfileId: 'account-b' },
      'child-a': { name: 'Ava', type: 'child', parentProfileId: 'missing' },
      orphan: { name: '', type: 'child' }
    }
  };

  assert.deepEqual(plain(helpers.extractMasterPinVerifier(profilesV4)), { salt: 'm' });
  assert.deepEqual(plain(helpers.extractProfilePinVerifier(profilesV4, 'account-a')), { salt: 'a' });
  assert.equal(helpers.isProfileLocked(profilesV4, 'default'), true);
  assert.equal(helpers.isProfileLocked(profilesV4, 'account-b'), false);
  assert.equal(helpers.getProfileName(profilesV4, 'orphan'), 'Profile');
  assert.equal(helpers.getProfileType(profilesV4, 'default'), 'account');
  assert.equal(helpers.getProfileType(profilesV4, 'child-z'), 'child');
  assert.equal(helpers.buildProfileLabel(profilesV4, 'default'), 'Default (Master, locked)');
  assert.equal(helpers.buildProfileSubtitle(profilesV4, 'account-a'), 'Account • Locked');
  assert.equal(helpers.getParentAccountId(profilesV4, 'child-z'), 'account-b');
  assert.equal(helpers.getParentAccountId(profilesV4, 'child-a'), 'default');
  assert.deepEqual(plain(helpers.getAccountIds(profilesV4)), ['default', 'account-a', 'account-b']);
  assert.deepEqual(plain(helpers.getChildrenForAccount(profilesV4, 'default')), ['child-a', 'orphan']);
  assert.equal(helpers.getProfileInitial(profilesV4, 'child-z'), 'Z');
  assert.equal(helpers.getProfileAccessCopy(profilesV4, 'child-z').gateTitle, 'Protected Child Profile');
});

test('popup executable probes content-control visibility and search filtering', () => {
  const feedCatalogRow = makeMiniRow({ search: 'duration feed', hasCatalogToggle: true });
  const feedPopupOnlyRow = makeMiniRow({ search: 'uppercase feed', hasCatalogToggle: false });
  const shortsRow = makeMiniRow({ search: 'shorts shelf', hasCatalogToggle: false });
  const feedGroup = makeMiniGroup({ id: 'feed', title: 'Feed', rows: [feedCatalogRow, feedPopupOnlyRow] });
  const shortsGroup = makeMiniGroup({ id: 'shorts', title: 'Shorts', rows: [shortsRow] });
  const groups = [feedGroup, shortsGroup];
  const searchInput = { value: '' };

  const helpers = loadExtractedFunctions(['applyPopupContentControlsVisibility', 'filterContentControlsPopup'], {
    contentControlsContainer: {
      querySelectorAll(selector) {
        if (selector === '[data-ft-control-group]') return groups;
        return [];
      }
    },
    document: {
      getElementById(id) {
        return id === 'searchContentControlsPopup' ? searchInput : null;
      }
    }
  });

  helpers.applyPopupContentControlsVisibility('kids');
  assert.equal(feedGroup.hidden, false);
  assert.equal(shortsGroup.hidden, true);
  assert.equal(feedCatalogRow.hidden, true);
  assert.equal(feedPopupOnlyRow.hidden, false);
  assert.equal(shortsRow.hidden, false);

  helpers.applyPopupContentControlsVisibility('main');
  assert.equal(feedGroup.hidden, false);
  assert.equal(shortsGroup.hidden, false);
  assert.equal(feedCatalogRow.hidden, false);

  searchInput.value = 'upper';
  helpers.filterContentControlsPopup();
  assert.equal(feedCatalogRow.style.display, 'none');
  assert.equal(feedPopupOnlyRow.style.display, '');
  assert.equal(shortsGroup.style.display, 'none');
});

test('popup executable probes runtime session unlock message trimming', async () => {
  const messages = [];
  const helpers = loadExtractedFunctions(['normalizeString', 'sendRuntimeMessage', 'notifyBackgroundUnlocked'], {
    chrome: {
      runtime: {
        lastError: null,
        sendMessage(payload, callback) {
          messages.push(plain(payload));
          callback({ ok: true });
        }
      }
    }
  });

  await helpers.notifyBackgroundUnlocked(' child-1 ', ' 1234 ');
  await helpers.notifyBackgroundUnlocked(' child-2 ', '   ');

  assert.deepEqual(messages, [{
    action: 'FilterTube_SessionPinAuth',
    profileId: 'child-1',
    pin: '1234'
  }]);
});

test('popup register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerUi',
    'domIdsRead',
    'domIdsWritten',
    'selectorsRead',
    'elementsCreated',
    'listenersRegistered',
    'listenerTeardown',
    'timerEffect',
    'frameEffect',
    'runtimeMessageAction',
    'stateManagerMethod',
    'renderEngineMethod',
    'uiComponentsMethod',
    'profileType',
    'profileId',
    'listModeInput',
    'lockStateInput',
    'tabRouteInput',
    'popupSearchInput',
    'mainKidsVisibilityEffect',
    'profileSwitchEffect',
    'pinVerificationEffect',
    'backgroundSessionEffect',
    'tabOpenEffect',
    'windowFallbackEffect',
    'confirmDialogEffect',
    'alertEffect',
    'toastEffect',
    'positiveFixture',
    'negativeLockFixture',
    'negativeModeFixture',
    'negativeRouteFixture',
    'negativeProfileFixture',
    'negativeDomFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks popup method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'popupMethodAuthority',
    'popupDomEffectReport',
    'popupListenerLifecycleContract',
    'popupListModeMutationReport',
    'popupProfileLockAccessReport',
    'popupProfileSwitchMutationPlan',
    'popupContentControlVisibilityReport',
    'popupVideoFilterRoutePolicy',
    'popupRuntimeMessageContract',
    'popupRenderStateDependencyReport',
    'popupAccessibilityContract',
    'popupFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
