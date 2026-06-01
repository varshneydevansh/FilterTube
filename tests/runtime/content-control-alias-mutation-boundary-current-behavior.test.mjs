import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_CONTROL_ALIAS_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'contentControlAliasMutationContract',
  'contentControlStorageAliasPolicy',
  'contentControlAliasReadWriteReport',
  'contentControlStateManagerAliasMutationReport',
  'contentControlBackgroundInvalidationParityReport',
  'contentControlJsonSettingFieldManifest',
  'contentControlDomAliasParityReport',
  'contentControlAliasNoWorkBudget',
  'contentControlAliasFixtureProvenance',
  'contentControlAliasFirstClassJsonGate'
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

function sourceFileRow(file) {
  const text = read(file);
  return `| \`${file}\` | ${lineCount(text)} | ${Buffer.byteLength(text)} | \`${sha256(file)}\` |`;
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
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
  const settingsShared = read('js/settings_shared.js');
  const stateManager = read('js/state_manager.js');
  const background = read('js/background.js');
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const firstPayloadStart = settingsShared.indexOf('                        const payload = {');
  const secondPayloadStart = settingsShared.indexOf('                    const payload = {', firstPayloadStart + 1);
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    settingsShared,
    stateManager,
    background,
    seed,
    filterLogic,
    domFallback,
    settingsBuildCompiled: sliceBetween(
      settingsShared,
      '    function buildCompiledSettings({',
      '\n    function loadSettings() {'
    ),
    settingsSaveV4Payload: sliceBetween(
      settingsShared,
      '                        const payload = {',
      '\n\n                        const nextSettings = {'
    ),
    settingsSaveV4ProfileSettings: sliceBetween(
      settingsShared,
      '                        const nextSettings = {',
      '\n\n                        profiles[activeId] = {'
    ),
    settingsSaveLegacyPayload: sliceBetween(
      settingsShared,
      '                    const payload = {',
      '\n\n                    try {',
      secondPayloadStart - 20
    ),
    settingsLoadAlias: sliceBetween(
      settingsShared,
      "                const hideComments = readBool('hideComments', !!result.hideAllComments);",
      '\n                if (!hasProfilesV4) {'
    ),
    stateSaveSettingsPayload: sliceBetween(
      stateManager,
      '            const result = await SettingsAPI.saveSettings({',
      '\n\n            if (broadcast && result.compiledSettings)'
    ),
    stateUpdateValidKeys: sliceBetween(
      stateManager,
      '        const validKeys = [',
      '        ];\n\n        if (!validKeys.includes(key))'
    ),
    stateReloadKeys: sliceBetween(
      stateManager,
      '                const storageKeys = [',
      '                const hasSettingsChange = storageKeys.some'
    ),
    bgMainCompileAliases: sliceBetween(
      background,
      "            const hideCommentsFromV4 = boolFromV4('hideComments', items.hideAllComments || false);",
      '            const profileSettings = activeProfile?.settings || {};'
    ),
    bgRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    ),
    seedJsonPredicateHelpers: sliceBetween(
      seed,
      '    function hasEnabledContentFilters(settings) {',
      '\n\n    function shouldCaptureRawSnapshot'
    ),
    filterDefaults: sliceBetween(
      filterLogic,
      '            const processed = {',
      '\n\n            const incomingContentFilters'
    ),
    domActiveKeys: sliceBetween(
      domFallback,
      "            'hideAllComments',",
      '        ];\n        if (booleanFilterKeys.some'
    )
  };
}

function createMockStorage(initial = {}) {
  const state = JSON.parse(JSON.stringify(initial));
  const writes = [];
  const local = {
    get(keys, callback) {
      const result = {};
      const keyList = Array.isArray(keys) ? keys : Object.keys(keys || {});
      for (const key of keyList) {
        if (Object.prototype.hasOwnProperty.call(state, key)) {
          result[key] = state[key];
        }
      }
      callback(result);
    },
    set(payload, callback) {
      const clean = JSON.parse(JSON.stringify(payload));
      writes.push(clean);
      Object.assign(state, clean);
      callback?.();
    }
  };
  return { state, writes, local };
}

function loadSettingsApi(storage) {
  const sandbox = {
    window: {},
    console,
    chrome: {
      runtime: { lastError: null },
      storage: { local: storage.local }
    }
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(read('js/settings_shared.js'), sandbox);
  return sandbox.window.FilterTubeSettings;
}

function defaultProfilesV4() {
  return {
    schemaVersion: 4,
    activeProfileId: 'default',
    profiles: {
      default: {
        type: 'account',
        name: 'Default',
        settings: {
          enabled: true,
          hideShorts: false,
          hideComments: false
        },
        main: {
          channels: [],
          keywords: []
        },
        kids: {}
      }
    }
  };
}

test('content-control alias mutation boundary is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, settings patch/);
  assert.match(doc, /content control alias mutation boundary source files: 7/);
  assert.match(doc, /content control alias mutation source\/effect blocks: 13/);
  assert.match(doc, /runtime content-control alias mutation fixtures: 5/);

  for (const file of [
    'js/content_controls_catalog.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/background.js',
    'js/seed.js',
    'js/filter_logic.js',
    'js/content/dom_fallback.js'
  ]) {
    assert.ok(doc.includes(sourceFileRow(file)), `missing current source row for ${file}`);
  }
});

test('alias mutation source block counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['settings_shared buildCompiledSettings block', blocks.settingsBuildCompiled],
    ['settings_shared V4 save root payload block', blocks.settingsSaveV4Payload],
    ['settings_shared V4 profile settings block', blocks.settingsSaveV4ProfileSettings],
    ['settings_shared legacy save payload block', blocks.settingsSaveLegacyPayload],
    ['settings_shared load alias block', blocks.settingsLoadAlias],
    ['state_manager saveSettings payload block', blocks.stateSaveSettingsPayload],
    ['state_manager updateSetting valid keys block', blocks.stateUpdateValidKeys],
    ['state_manager external reload keys block', blocks.stateReloadKeys],
    ['background main compile alias block', blocks.bgMainCompileAliases],
    ['background storage refresh keys block', blocks.bgRefreshKeys],
    ['seed JSON predicate helpers block', blocks.seedJsonPredicateHelpers],
    ['filter_logic processed defaults block', blocks.filterDefaults],
    ['DOM fallback active boolean keys block', blocks.domActiveKeys]
  ];

  for (const [label, block] of countRows) {
    const expectedLines = lineCount(block);
    const expectedBytes = Buffer.byteLength(block);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }
});

test('shared settings save maps UI aliases to root runtime keys and V4 profile aliases', async () => {
  const storage = createMockStorage({
    ftProfilesV4: defaultProfilesV4()
  });
  const api = loadSettingsApi(storage);
  const result = await api.saveSettings({
    keywords: [],
    channels: [],
    enabled: true,
    hideShorts: true,
    hideComments: true,
    contentFilters: {},
    categoryFilters: {}
  });
  const lastWrite = storage.writes.at(-1);
  const activeSettings = lastWrite.ftProfilesV4.profiles.default.settings;

  assert.equal(result.compiledSettings.hideAllShorts, true);
  assert.equal(result.compiledSettings.hideAllComments, true);
  assert.equal(lastWrite.hideAllShorts, true);
  assert.equal(lastWrite.hideAllComments, true);
  assert.equal(activeSettings.hideShorts, true);
  assert.equal(activeSettings.hideComments, true);
  assert.equal(Object.prototype.hasOwnProperty.call(lastWrite, 'hideShorts'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(lastWrite, 'hideComments'), false);
});

test('legacy load maps root runtime keys back to UI aliases', async () => {
  const storage = createMockStorage({
    enabled: true,
    hideAllShorts: true,
    hideAllComments: true,
    uiKeywords: [],
    filterChannels: []
  });
  const api = loadSettingsApi(storage);
  const loaded = await api.loadSettings();

  assert.equal(loaded.hideShorts, true);
  assert.equal(loaded.hideComments, true);
  assert.equal(storage.writes.length, 1);
  assert.equal(storage.writes[0].ftProfilesV4.profiles.default.settings.hideShorts, true);
  assert.equal(storage.writes[0].ftProfilesV4.profiles.default.settings.hideComments, true);
});

test('alias mutation boundary records split runtime consumers and missing authorities', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const blocks = sourceBlocks();

  assert.match(blocks.stateUpdateValidKeys, /'hideShorts'/);
  assert.match(blocks.stateUpdateValidKeys, /'hideComments'/);
  assert.doesNotMatch(blocks.stateUpdateValidKeys, /'hideAllShorts'/);
  assert.doesNotMatch(blocks.stateUpdateValidKeys, /'hideAllComments'/);
  assert.match(blocks.stateSaveSettingsPayload, /hideShorts: state\.hideShorts/);
  assert.match(blocks.stateSaveSettingsPayload, /hideComments: state\.hideComments/);
  assert.match(blocks.settingsBuildCompiled, /hideAllShorts: !!hideShorts/);
  assert.match(blocks.settingsBuildCompiled, /hideAllComments: !!hideComments/);
  assert.match(blocks.settingsSaveV4Payload, /hideAllShorts: compiledSettings\.hideAllShorts/);
  assert.match(blocks.settingsSaveV4Payload, /hideAllComments: compiledSettings\.hideAllComments/);
  assert.doesNotMatch(blocks.settingsSaveV4Payload, /hideShorts:/);
  assert.doesNotMatch(blocks.settingsSaveV4Payload, /hideComments:/);
  assert.match(blocks.settingsSaveV4ProfileSettings, /hideShorts: compiledSettings\.hideAllShorts/);
  assert.match(blocks.settingsSaveV4ProfileSettings, /hideComments: compiledSettings\.hideAllComments/);
  assert.match(blocks.bgMainCompileAliases, /hideCommentsFromV4 = boolFromV4\('hideComments', items\.hideAllComments \|\| false\)/);
  assert.match(blocks.bgMainCompileAliases, /compiledSettings\.hideAllComments = hideCommentsFromV4/);
  assert.match(blocks.bgMainCompileAliases, /compiledSettings\.hideAllShorts = boolFromV4\('hideShorts', items\.hideAllShorts \|\| false\)/);
  assert.match(blocks.bgRefreshKeys, /'hideAllShorts'/);
  assert.match(blocks.bgRefreshKeys, /'hideComments'/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideAllComments'/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideShorts'/);
  assert.match(blocks.seedJsonPredicateHelpers, /settings\.hideAllComments === true/);
  assert.match(blocks.seedJsonPredicateHelpers, /settings\.hideAllShorts === true/);
  assert.match(blocks.filterDefaults, /hideAllComments: false/);
  assert.match(blocks.filterDefaults, /hideAllShorts: false/);
  assert.match(blocks.domActiveKeys, /'hideAllComments'/);
  assert.match(blocks.domActiveKeys, /'hideAllShorts'/);
  assert.match(blocks.domActiveKeys, /'hideShorts'/);
  assert.match(blocks.domActiveKeys, /'hideComments'/);

  assert.match(doc, /Content control alias mutation still needs/);
  assert.match(doc, /background invalidation parity report/);
  assert.match(doc, /JSON setting-field manifest/);
  assert.match(doc, /DOM alias\s+parity report/);
  assert.match(doc, /per-alias no-work budgets/);
  assert.match(doc, /first-class JSON gate proof/);
  assert.match(doc, /Promoted focused lane: `test:settings`/);

  for (const symbol of authoritySymbols) {
    assert.doesNotMatch(runtime, new RegExp(symbol));
    assert.ok(doc.includes(symbol), `doc missing missing-authority symbol ${symbol}`);
  }
});
