import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_QUICK_BLOCK_DEFAULT_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const backgroundPath = 'js/background.js';

const authoritySymbols = [
  'quickBlockDefaultMigrationContract',
  'quickBlockDefaultMigrationReport',
  'quickBlockDefaultProfileMutationReport',
  'quickBlockDefaultInstallUpdateGate',
  'quickBlockDefaultRootProfilePrecedencePolicy',
  'quickBlockDefaultMarkerVersionReport',
  'quickBlockDefaultFailureRollbackReport',
  'quickBlockDefaultStorageRevision',
  'quickBlockDefaultFixtureProvenance',
  'quickBlockDefaultMetricArtifact'
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
    compareSemver: sliceBetween(background, 'function compareSemver', 'function isVersionAtLeast'),
    isVersionAtLeast: sliceBetween(background, 'function isVersionAtLeast', 'function applyQuickBlockDefaultMigrationOnce'),
    quickMigration: sliceBetween(background, 'function applyQuickBlockDefaultMigrationOnce', 'function applyKeywordCommentsScopeMigrationOnce'),
    onInstalled: sliceBetween(background, 'browserAPI.runtime.onInstalled.addListener(function (details) {', 'function handleFetchShortsIdentityMessage'),
    installBranch: sliceBetween(background, "    if (details.reason === 'install') {", "    } else if (details.reason === 'update') {", onInstalledStart),
    updateBranch: sliceBetween(background, "    } else if (details.reason === 'update') {", '        // You could handle migration of settings between versions here if needed', onInstalledStart)
  };
}

function loadMigrationHarness({ currentVersion = '3.3.1', initialStorage = {} } = {}) {
  const blocks = sourceBlocks();
  const storage = clone(initialStorage);
  const writes = [];
  const browserAPI = {
    runtime: {
      getManifest: () => ({ version: currentVersion })
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
    ${blocks.compareSemver}
    ${blocks.isVersionAtLeast}
    ${blocks.quickMigration}
    globalThis.__exports = {
      compareSemver,
      isVersionAtLeast,
      applyQuickBlockDefaultMigrationOnce
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

test('quick-block default migration audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const backgroundSource = read(backgroundPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, settings patch, migration patch/);
  assert.match(doc, /quick-block default migration boundary source files: 1/);
  assert.match(doc, /quick-block default migration source\/effect blocks: 7/);
  assert.match(doc, /runtime quick-block default migration fixtures: 6/);
  assert.ok(doc.includes(`| \`js/background.js\` | ${lineCount(backgroundSource)} | ${Buffer.byteLength(backgroundSource)} | \`${sha256(backgroundPath)}\` |`));
});

test('quick-block default migration source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const rows = [
    ['quick-block migration constants block', blocks.constants, 7, 379],
    ['compareSemver block', blocks.compareSemver, 18, 513],
    ['isVersionAtLeast block', blocks.isVersionAtLeast, 4, 98],
    ['applyQuickBlockDefaultMigrationOnce block', blocks.quickMigration, 53, 2485],
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

  assert.equal(countLiteral(blocks.quickMigration, 'showQuickBlockButton'), 3);
  assert.equal(countLiteral(blocks.quickMigration, 'QUICK_BLOCK_DEFAULT_MIGRATION_KEY'), 4);
  assert.equal(countLiteral(blocks.quickMigration, 'storage.local.get'), 1);
  assert.equal(countLiteral(blocks.quickMigration, 'storage.local.set'), 2);
  assert.equal(countLiteral(blocks.quickMigration, 'resolve(true)'), 1);
  assert.equal(countLiteral(blocks.quickMigration, 'resolve(false)'), 3);
  assert.equal(countLiteral(blocks.quickMigration, 'Object.entries(profilesV4.profiles)'), 1);
  assert.equal(countLiteral(blocks.installBranch, 'showQuickBlockButton'), 1);
  assert.equal(countLiteral(blocks.updateBranch, 'showQuickBlockButton'), 0);

  assert.match(doc, /applyQuickBlockDefaultMigrationOnce showQuickBlockButton tokens: 3/);
  assert.match(doc, /applyQuickBlockDefaultMigrationOnce migration-key tokens: 4/);
  assert.match(doc, /applyQuickBlockDefaultMigrationOnce storage\.local\.get callsites: 1/);
  assert.match(doc, /applyQuickBlockDefaultMigrationOnce storage\.local\.set callsites: 2/);
  assert.match(doc, /applyQuickBlockDefaultMigrationOnce resolve true tokens: 1/);
  assert.match(doc, /applyQuickBlockDefaultMigrationOnce resolve false tokens: 3/);
});

test('quick-block default migration semver helpers keep current comparison behavior', () => {
  const { api } = loadMigrationHarness();

  assert.equal(api.compareSemver('3.2.8', '3.2.9'), -1);
  assert.equal(api.compareSemver('3.2.9', '3.2.9'), 0);
  assert.equal(api.compareSemver('3.3.1', '3.2.9'), 1);
  assert.equal(api.compareSemver('', '3.2.9'), -1);
  assert.equal(api.isVersionAtLeast('3.3.1', '3.2.9'), true);
  assert.equal(api.isVersionAtLeast('3.2.8', '3.2.9'), false);
});

test('quick-block default migration skips marker current-version and previous-version negative cases', async () => {
  {
    const { api, writes } = loadMigrationHarness({
      initialStorage: { quickBlockDefaultV327Applied: true }
    });
    assert.equal(await api.applyQuickBlockDefaultMigrationOnce({ previousVersion: '3.2.8' }), false);
    assert.deepEqual(writes, []);
  }

  {
    const { api, writes } = loadMigrationHarness({ currentVersion: '3.2.8' });
    assert.equal(await api.applyQuickBlockDefaultMigrationOnce({ isInstall: true }), false);
    assert.deepEqual(writes, []);
  }

  {
    const { api, writes } = loadMigrationHarness();
    assert.equal(await api.applyQuickBlockDefaultMigrationOnce({ previousVersion: '3.2.9' }), false);
    assert.deepEqual(writes, []);
  }
});

test('quick-block default migration writes root and profile settings when updating from a pre-target version', async () => {
  const initialProfiles = {
    activeProfileId: 'default',
    profiles: {
      default: {
        name: 'Default',
        settings: {
          hideHomeFeed: true,
          showQuickBlockButton: false
        }
      },
      child: {
        name: 'Child',
        settings: {
          showBlockMenuItem: false
        }
      }
    }
  };
  const { api, storage, writes } = loadMigrationHarness({
    initialStorage: {
      ftProfilesV4: initialProfiles,
      showQuickBlockButton: false
    }
  });

  assert.equal(await api.applyQuickBlockDefaultMigrationOnce({ previousVersion: '3.2.8' }), true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].quickBlockDefaultV327Applied, true);
  assert.equal(writes[0].showQuickBlockButton, true);
  assert.equal(writes[0].ftProfilesV4.activeProfileId, 'default');
  assert.equal(writes[0].ftProfilesV4.profiles.default.settings.showQuickBlockButton, true);
  assert.equal(writes[0].ftProfilesV4.profiles.default.settings.hideHomeFeed, true);
  assert.equal(writes[0].ftProfilesV4.profiles.child.settings.showQuickBlockButton, true);
  assert.equal(writes[0].ftProfilesV4.profiles.child.settings.showBlockMenuItem, false);
  assert.equal(storage.quickBlockDefaultV327Applied, true);
  assert.equal(storage.showQuickBlockButton, true);
});

test('onInstalled install and update branches wire quick-block default migration through current argument shapes', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.installBranch, /browserAPI\.storage\.local\.set\(\{[\s\S]*showQuickBlockButton: true,[\s\S]*showBlockMenuItem: true/);
  assert.match(blocks.installBranch, /applyQuickBlockDefaultMigrationOnce\(\{ isInstall: true \}\)/);
  assert.ok(
    blocks.installBranch.indexOf('showQuickBlockButton: true') <
      blocks.installBranch.indexOf('applyQuickBlockDefaultMigrationOnce({ isInstall: true })'),
    'install branch should write root defaults before calling quick-block migration'
  );
  assert.match(blocks.updateBranch, /applyQuickBlockDefaultMigrationOnce\(\{ previousVersion: details\.previousVersion \|\| '' \}\)/);
  assert.match(blocks.updateBranch, /applyKeywordCommentsScopeMigrationOnce\(\)/);
});

test('product runtime still lacks first-class quick-block default migration authority symbols', () => {
  const doc = read(docPath);
  const source = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.match(doc, new RegExp(symbol));
    assert.doesNotMatch(source, new RegExp(symbol));
  }
});
