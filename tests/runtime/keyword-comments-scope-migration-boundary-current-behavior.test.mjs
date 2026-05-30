import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_KEYWORD_COMMENTS_SCOPE_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const backgroundPath = 'js/background.js';

const authoritySymbols = [
  'keywordCommentsScopeMigrationContract',
  'keywordCommentsScopeMigrationReport',
  'keywordCommentsScopeRowMutationReport',
  'keywordCommentsScopeRootProfileDecision',
  'keywordCommentsScopeListModeParityReport',
  'keywordCommentsScopeAliasRowPolicy',
  'keywordCommentsScopeKidsRowPolicy',
  'keywordCommentsScopeInstallUpdateSequence',
  'keywordCommentsScopeFailureRollbackReport',
  'keywordCommentsScopeStorageRevision',
  'keywordCommentsScopeFixtureProvenance',
  'keywordCommentsScopeMetricArtifact'
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function sourceBlocks() {
  const background = read(backgroundPath);
  const onInstalledStart = background.indexOf('browserAPI.runtime.onInstalled.addListener(function (details) {');
  return {
    background,
    constants: sliceBetween(background, 'const CURRENT_VERSION =', 'function compareSemver'),
    keywordMigration: sliceBetween(background, 'function applyKeywordCommentsScopeMigrationOnce', 'function schedulePostBlockEnrichment'),
    onInstalled: sliceBetween(background, 'browserAPI.runtime.onInstalled.addListener(function (details) {', 'function handleFetchShortsIdentityMessage'),
    installBranch: sliceBetween(background, "    if (details.reason === 'install') {", "    } else if (details.reason === 'update') {", onInstalledStart),
    updateBranch: sliceBetween(background, "    } else if (details.reason === 'update') {", '        // You could handle migration of settings between versions here if needed', onInstalledStart)
  };
}

function loadMigrationHarness({ initialStorage = {}, throwFirstSet = false } = {}) {
  const blocks = sourceBlocks();
  const storage = clone(initialStorage);
  const writes = [];
  let setCalls = 0;
  const browserAPI = {
    runtime: {
      getManifest: () => ({ version: '3.3.1' })
    },
    storage: {
      local: {
        get(keys, callback) {
          const result = {};
          for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(storage, key)) {
              result[key] = clone(storage[key]);
            }
          }
          callback(result);
        },
        set(updates, callback) {
          setCalls += 1;
          if (throwFirstSet && setCalls === 1) {
            throw new Error('simulated first write failure');
          }
          const copied = clone(updates);
          writes.push(copied);
          Object.assign(storage, copied);
          if (callback) callback();
        }
      }
    }
  };
  const context = vm.createContext({
    __browserAPI: browserAPI,
    __storage: storage,
    __writes: writes
  });

  vm.runInContext(`
    const browserAPI = globalThis.__browserAPI;
    ${blocks.constants}
    ${blocks.keywordMigration}
    globalThis.__exports = {
      applyKeywordCommentsScopeMigrationOnce
    };
  `, context);

  return {
    api: context.__exports,
    storage,
    writes
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('keyword-comments scope migration audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, settings patch, migration patch/);
  assert.match(doc, /keyword-comments scope migration boundary source files: 1/);
  assert.match(doc, /keyword-comments scope migration source\/effect blocks: 5/);
  assert.match(doc, /runtime keyword-comments scope migration fixtures: 7/);
  assert.ok(doc.includes(`| \`js/background.js\` | 6270 | 282251 | \`${sha256(backgroundPath)}\` |`));
});

test('keyword-comments scope migration source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const rows = [
    ['keyword-comments migration constants block', blocks.constants, 7, 379],
    ['applyKeywordCommentsScopeMigrationOnce block', blocks.keywordMigration, 87, 4395],
    ['onInstalled handler block', blocks.onInstalled, 93, 4239],
    ['install branch block', blocks.installBranch, 47, 2072],
    ['update branch block', blocks.updateBranch, 41, 2010]
  ];

  for (const [label, block, expectedLines, expectedBytes] of rows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.keywordMigration, 'KEYWORD_COMMENTS_SCOPE_MIGRATION_KEY'), 4);
  assert.equal(countLiteral(blocks.keywordMigration, 'filterComments'), 6);
  assert.equal(countLiteral(blocks.keywordMigration, 'hideAllComments'), 2);
  assert.equal(countLiteral(blocks.keywordMigration, 'uiKeywords'), 4);
  assert.equal(countLiteral(blocks.keywordMigration, 'filterChannels'), 4);
  assert.equal(countLiteral(blocks.keywordMigration, 'comments'), 10);
  assert.equal(countLiteral(blocks.keywordMigration, 'filterAllComments'), 1);
  assert.equal(countLiteral(blocks.keywordMigration, 'storage.local.get'), 1);
  assert.equal(countLiteral(blocks.keywordMigration, 'storage.local.set'), 2);
  assert.equal(countLiteral(blocks.keywordMigration, 'resolve(true)'), 1);
  assert.equal(countLiteral(blocks.keywordMigration, 'resolve(false)'), 2);
  assert.equal(countLiteral(blocks.keywordMigration, 'Object.entries(profilesV4.profiles)'), 1);
  assert.equal(countLiteral(blocks.keywordMigration, 'migrateKeywordList'), 4);
  assert.equal(countLiteral(blocks.keywordMigration, 'migrateChannelList'), 4);
  assert.equal(countLiteral(blocks.keywordMigration, 'sanitizeSettings'), 2);
  assert.equal(countLiteral(blocks.keywordMigration, 'blockedKeywords'), 0);
  assert.equal(countLiteral(blocks.keywordMigration, 'blockedChannels'), 0);
  assert.equal(countLiteral(blocks.keywordMigration, 'kids'), 0);
  assert.equal(countLiteral(blocks.installBranch, 'applyKeywordCommentsScopeMigrationOnce'), 1);
  assert.equal(countLiteral(blocks.updateBranch, 'applyKeywordCommentsScopeMigrationOnce'), 1);

  assert.match(doc, /applyKeywordCommentsScopeMigrationOnce marker tokens: 4/);
  assert.match(doc, /applyKeywordCommentsScopeMigrationOnce filterComments tokens: 6/);
  assert.match(doc, /applyKeywordCommentsScopeMigrationOnce storage\.local\.set callsites: 2/);
  assert.match(doc, /applyKeywordCommentsScopeMigrationOnce blockedKeywords tokens: 0/);
  assert.match(doc, /applyKeywordCommentsScopeMigrationOnce kids tokens: 0/);
});

test('keyword-comments scope migration skips when marker is already applied', async () => {
  const { api, writes } = loadMigrationHarness({
    initialStorage: { keywordCommentsScopeMigrationV332Applied: true }
  });

  assert.equal(await api.applyKeywordCommentsScopeMigrationOnce(), false);
  assert.deepEqual(writes, []);
});

test('root disabled-comments migration clears root keyword and channel comment flags', async () => {
  const { api, storage, writes } = loadMigrationHarness({
    initialStorage: {
      hideAllComments: true,
      filterComments: true,
      uiKeywords: [
        { text: 'alpha', comments: true, exact: true },
        'raw-keyword'
      ],
      filterChannels: [
        { name: 'Channel A', filterAllComments: true },
        'raw-channel'
      ]
    }
  });

  assert.equal(await api.applyKeywordCommentsScopeMigrationOnce(), true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].keywordCommentsScopeMigrationV332Applied, true);
  assert.equal(writes[0].filterComments, false);
  assert.equal(writes[0].uiKeywords[0].comments, false);
  assert.equal(writes[0].uiKeywords[0].exact, true);
  assert.equal(writes[0].uiKeywords[1], 'raw-keyword');
  assert.equal(writes[0].filterChannels[0].filterAllComments, false);
  assert.equal(writes[0].filterChannels[1], 'raw-channel');
  assert.equal(storage.filterComments, false);
});

test('root comments-enabled migration preserves row comment flags but still clears root filterComments', async () => {
  const { api, writes } = loadMigrationHarness({
    initialStorage: {
      hideAllComments: false,
      filterComments: true,
      uiKeywords: [
        { text: 'alpha', comments: true },
        { text: 'beta', comments: false }
      ],
      filterChannels: [
        { name: 'Channel A', filterAllComments: true },
        { name: 'Channel B', filterAllComments: false }
      ]
    }
  });

  assert.equal(await api.applyKeywordCommentsScopeMigrationOnce(), true);
  assert.equal(writes[0].filterComments, false);
  assert.deepEqual(writes[0].uiKeywords, [
    { text: 'alpha', comments: true },
    { text: 'beta', comments: false }
  ]);
  assert.deepEqual(writes[0].filterChannels, [
    { name: 'Channel A', filterAllComments: true },
    { name: 'Channel B', filterAllComments: false }
  ]);
});

test('V4 profile migration deletes settings filterComments and migrates only main row families', async () => {
  const initialProfiles = {
    activeProfileId: 'default',
    profiles: {
      default: {
        settings: {
          filterComments: true,
          hideComments: false,
          hideHomeFeed: true
        },
        main: {
          keywords: [{ text: 'keep-comments', comments: true }],
          channels: [{ name: 'Keep Channel', filterAllComments: true }],
          whitelistKeywords: [{ text: 'allow-comments', comments: true }],
          whitelistChannels: [{ name: 'Allow Channel', filterAllComments: true }],
          blockedKeywords: [{ text: 'alias-keyword', comments: true }],
          blockedChannels: [{ name: 'Alias Channel', filterAllComments: true }]
        }
      },
      child: {
        settings: {
          filterComments: true,
          hideComments: true,
          hideSearchShelves: true
        },
        main: {
          keywords: [{ text: 'clear-comments', comments: true }],
          channels: [{ name: 'Clear Channel', filterAllComments: true }],
          whitelistKeywords: [{ text: 'allow-clear', comments: true }],
          whitelistChannels: [{ name: 'Allow Clear', filterAllComments: true }],
          blockedKeywords: [{ text: 'alias-keyword-child', comments: true }],
          blockedChannels: [{ name: 'Alias Channel Child', filterAllComments: true }]
        }
      }
    }
  };
  const { api, writes } = loadMigrationHarness({
    initialStorage: {
      ftProfilesV4: initialProfiles,
      filterComments: false
    }
  });

  assert.equal(await api.applyKeywordCommentsScopeMigrationOnce(), true);
  const profiles = writes[0].ftProfilesV4.profiles;

  assert.equal(Object.hasOwn(profiles.default.settings, 'filterComments'), false);
  assert.equal(profiles.default.settings.hideHomeFeed, true);
  assert.equal(profiles.default.main.keywords[0].comments, true);
  assert.equal(profiles.default.main.channels[0].filterAllComments, true);
  assert.equal(profiles.default.main.whitelistKeywords[0].comments, true);
  assert.equal(profiles.default.main.whitelistChannels[0].filterAllComments, true);
  assert.equal(profiles.default.main.blockedKeywords[0].comments, true);
  assert.equal(profiles.default.main.blockedChannels[0].filterAllComments, true);

  assert.equal(Object.hasOwn(profiles.child.settings, 'filterComments'), false);
  assert.equal(profiles.child.settings.hideSearchShelves, true);
  assert.equal(profiles.child.main.keywords[0].comments, false);
  assert.equal(profiles.child.main.channels[0].filterAllComments, false);
  assert.equal(profiles.child.main.whitelistKeywords[0].comments, false);
  assert.equal(profiles.child.main.whitelistChannels[0].filterAllComments, false);
  assert.equal(profiles.child.main.blockedKeywords[0].comments, true);
  assert.equal(profiles.child.main.blockedChannels[0].filterAllComments, true);
});

test('keyword-comments scope migration catch path marks migration and clears root filterComments only', async () => {
  const { api, writes } = loadMigrationHarness({
    initialStorage: {
      uiKeywords: [{ text: 'alpha', comments: true }]
    },
    throwFirstSet: true
  });

  assert.equal(await api.applyKeywordCommentsScopeMigrationOnce(), false);
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], {
    keywordCommentsScopeMigrationV332Applied: true,
    filterComments: false
  });
});

test('onInstalled install and update branches both call keyword-comments scope migration', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.installBranch, /applyKeywordCommentsScopeMigrationOnce\(\)\.catch/);
  assert.match(blocks.updateBranch, /applyKeywordCommentsScopeMigrationOnce\(\)\.catch/);
  assert.ok(
    blocks.installBranch.indexOf('applyQuickBlockDefaultMigrationOnce({ isInstall: true })') <
      blocks.installBranch.indexOf('applyKeywordCommentsScopeMigrationOnce()'),
    'install branch currently calls quick-block migration before keyword-comments scope migration'
  );
  assert.ok(
    blocks.updateBranch.indexOf("applyQuickBlockDefaultMigrationOnce({ previousVersion: details.previousVersion || '' })") <
      blocks.updateBranch.indexOf('applyKeywordCommentsScopeMigrationOnce()'),
    'update branch currently calls quick-block migration before keyword-comments scope migration'
  );
});

test('product runtime still lacks first-class keyword-comments scope migration authority symbols', () => {
  const doc = read(docPath);
  const source = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.match(doc, new RegExp(symbol));
    assert.doesNotMatch(source, new RegExp(symbol));
  }
});
