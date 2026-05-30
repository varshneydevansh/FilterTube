import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_KIDS_COMMENTS_FILTER_ALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFiles = [
  'js/state_manager.js',
  'js/render_engine.js',
  'js/background.js',
  'js/settings_shared.js',
  'js/filter_logic.js'
];

const authoritySymbols = [
  'kidsCommentsFilterAllContract',
  'kidsCommentsRowActionParityReport',
  'kidsChannelCommentsScopePolicy',
  'kidsCommentsCompilerParityReport',
  'kidsCommentsListModeEffectReport',
  'kidsCommentsManagedChildSurfaceReport',
  'kidsCommentsKeywordProvenanceReport',
  'kidsCommentsFixtureProvenance',
  'kidsCommentsMetricArtifact',
  'kidsCommentsMutationRefreshReport',
  'kidsCommentsFilterAllAuthorityGate'
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
  const stateManager = read('js/state_manager.js');
  const renderEngine = read('js/render_engine.js');
  const background = read('js/background.js');
  const settingsShared = read('js/settings_shared.js');
  const filterLogic = read('js/filter_logic.js');

  return {
    stateKidsKeywordComments: sliceBetween(
      stateManager,
      'async function toggleKidsKeywordComments',
      '    /**\n     * Toggle "exact"'
    ),
    stateKidsChannelFilterAll: sliceBetween(
      stateManager,
      'async function toggleKidsChannelFilterAll',
      '    /**\n     * Save current state'
    ),
    renderKeywordCommentsGate: sliceBetween(
      renderEngine,
      'const shouldShowToggles = includeToggles;',
      "        if (isChannelDerived && shouldShowToggles && profile === 'kids')"
    ),
    renderChannelFilterAllToggle: sliceBetween(
      renderEngine,
      "function createFilterAllToggle(channel, index, profile = 'main', handlers = {})",
      '    /**\n     * Fallback Filter All toggle'
    ),
    backgroundKidsCompile: sliceBetween(
      background,
      '// Kids profile keyword compilation (YouTube Kids domain only)',
      '            // Pass through boolean flags'
    ),
    backgroundCompiledChannelObject: sliceBetween(
      background,
      "const filterAllComments = (typeof ch.filterAllComments === 'boolean') ? ch.filterAllComments : true;",
      '                        return channelObj;'
    ),
    settingsSharedSyncFilterAll: sliceBetween(
      settingsShared,
      'function syncFilterAllKeywords',
      '    function buildCompiledSettings'
    ),
    filterLogicCommentDecision: sliceBetween(
      filterLogic,
      "if (rendererType.includes('comment') || rendererType.includes('Comment'))",
      '            if (!isCommentRenderer)'
    )
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

function baseProfilesV4(kidsOverrides = {}) {
  return {
    schemaVersion: 4,
    activeProfileId: 'default',
    profiles: {
      default: {
        name: 'Default',
        settings: { enabled: true, syncKidsToMain: false },
        main: {
          mode: 'blocklist',
          blockedKeywords: [],
          blockedChannels: [],
          whitelistKeywords: [],
          whitelistChannels: []
        },
        kids: {
          mode: 'blocklist',
          blockedKeywords: [],
          blockedChannels: [],
          whitelistKeywords: [],
          whitelistChannels: [],
          strictMode: true,
          ...kidsOverrides
        }
      }
    }
  };
}

function loadStateManagerRuntime({ profilesV4 }) {
  const savedProfilesV4 = [];
  const savedProfilesV3 = [];
  const messages = [];
  const profilesV4State = clone(profilesV4);
  const profilesV3State = {
    main: { mode: 'blocklist', blockedKeywords: [], blockedChannels: [] },
    kids: clone(profilesV4.profiles.default.kids)
  };

  const context = {
    console,
    setTimeout: () => 0,
    clearTimeout: () => {},
    Date,
    JSON,
    Promise,
    window: null,
    globalThis: null,
    chrome: {
      runtime: {
        sendMessage(payload, callback) {
          const copied = clone(payload);
          messages.push(copied);
          if (copied.action === 'getCompiledSettings') {
            callback?.({ enabled: true, profileType: copied.profileType, filterKeywordsComments: [] });
          } else {
            callback?.({ ok: true });
          }
        },
        onMessage: { addListener() {} }
      },
      storage: {
        onChanged: { addListener() {} }
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  context.FilterTubeSettings = {
    async loadSettings() {
      return {
        enabled: true,
        keywords: [],
        userKeywords: [],
        channels: [],
        showQuickBlockButton: true,
        showBlockMenuItem: true
      };
    }
  };
  context.FilterTubeIO = {
    async loadProfilesV3() {
      return clone(profilesV3State);
    },
    async saveProfilesV3(next) {
      savedProfilesV3.push(clone(next));
      Object.assign(profilesV3State, clone(next));
    },
    async loadProfilesV4() {
      return clone(profilesV4State);
    },
    async saveProfilesV4(next) {
      savedProfilesV4.push(clone(next));
      Object.assign(profilesV4State, clone(next));
    }
  };

  vm.runInContext(read('js/state_manager.js'), vm.createContext(context), {
    filename: path.join(repoRoot, 'js/state_manager.js')
  });

  return {
    StateManager: context.StateManager,
    messages,
    savedProfilesV4,
    savedProfilesV3
  };
}

test('Kids comments Filter All audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, settings patch, Kids patch/);
  assert.match(doc, /Kids comments Filter All boundary source files: 5/);
  assert.match(doc, /Kids comments Filter All source\/effect blocks: 8/);
  assert.match(doc, /runtime Kids comments Filter All fixtures: 7/);

  for (const file of sourceFiles) {
    const stat = fs.statSync(path.join(repoRoot, file));
    const lines = lineCount(read(file));
    assert.ok(doc.includes(`| \`${file}\` | ${lines} | ${stat.size} | \`${sha256(file)}\` |`), file);
  }
});

test('Kids comments Filter All source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const rows = [
    ['StateManager toggleKidsKeywordComments block', blocks.stateKidsKeywordComments, 33, 1187],
    ['StateManager toggleKidsChannelFilterAll block', blocks.stateKidsChannelFilterAll, 35, 1184],
    ['RenderEngine keyword comments gate block', blocks.renderKeywordCommentsGate, 64, 3192],
    ['RenderEngine channel Filter All toggle block', blocks.renderChannelFilterAllToggle, 44, 2100],
    ['background Kids compile block', blocks.backgroundKidsCompile, 47, 2401],
    ['background compiled channel object block', blocks.backgroundCompiledChannelObject, 27, 1850],
    ['settings_shared syncFilterAllKeywords block', blocks.settingsSharedSyncFilterAll, 72, 2967],
    ['filter_logic comment decision block', blocks.filterLogicCommentDecision, 34, 1999]
  ];

  for (const [label, block, expectedLines, expectedBytes] of rows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  const combined = Object.values(blocks).join('\n');
  assert.equal(countLiteral(combined, 'toggleKidsKeywordComments'), 1);
  assert.equal(countLiteral(combined, 'toggleKidsChannelFilterAll'), 2);
  assert.equal(countLiteral(combined, 'filterAllComments'), 6);
  assert.equal(countLiteral(combined, 'filterKeywordsComments'), 3);
  assert.equal(countLiteral(combined, 'additionalKeywordsFromChannels'), 2);
  assert.equal(countLiteral(combined, "profile !== 'kids'"), 1);
  assert.equal(countLiteral(combined, "profile === 'kids'"), 2);
  assert.equal(countLiteral(combined, 'mergeWithChannels'), 3);
  assert.equal(countLiteral(combined, 'comments === true'), 4);
  assert.equal(countLiteral(combined, 'StateManager?.toggleChannelFilterAllCommentsByRef'), 3);
  assert.equal(countLiteral(combined, 'StateManager?.toggleKidsChannelFilterAll'), 1);

  assert.match(doc, /combined toggleKidsKeywordComments tokens: 1/);
  assert.match(doc, /combined toggleKidsChannelFilterAll tokens: 2/);
  assert.match(doc, /combined filterAllComments tokens: 6/);
  assert.match(doc, /combined filterKeywordsComments tokens: 3/);
  assert.match(doc, /combined additionalKeywordsFromChannels tokens: 2/);
  assert.match(doc, /combined mergeWithChannels tokens: 3/);
});

test('StateManager toggles Kids blocklist keyword comments and emits refresh and backup side effects', async () => {
  const runtime = loadStateManagerRuntime({
    profilesV4: baseProfilesV4({
      mode: 'blocklist',
      blockedKeywords: [{ word: 'alpha', comments: false, exact: true }],
      whitelistKeywords: [{ word: 'allow', comments: false }]
    })
  });

  await runtime.StateManager.loadSettings({ notify: false, scheduleEnrichment: false });
  assert.equal(await runtime.StateManager.toggleKidsKeywordComments('alpha'), true);

  const savedKids = runtime.savedProfilesV4.at(-1).profiles.default.kids;
  assert.equal(savedKids.blockedKeywords[0].comments, true);
  assert.equal(savedKids.blockedKeywords[0].exact, true);
  assert.equal(savedKids.whitelistKeywords[0].comments, false);
  assert.ok(runtime.savedProfilesV3.length >= 1);
  assert.ok(runtime.messages.some((msg) => msg.action === 'getCompiledSettings' && msg.profileType === 'kids' && msg.forceRefresh === true));
  assert.ok(runtime.messages.some((msg) => msg.action === 'FilterTube_ApplySettings' && msg.profile === 'kids'));
  assert.ok(runtime.messages.some((msg) => msg.action === 'FilterTube_ScheduleAutoBackup' && msg.triggerType === 'kids_keyword_comments_toggled'));
});

test('StateManager toggles Kids whitelist keyword comments through the hidden API path', async () => {
  const runtime = loadStateManagerRuntime({
    profilesV4: baseProfilesV4({
      mode: 'whitelist',
      blockedKeywords: [{ word: 'blocked', comments: false }],
      whitelistKeywords: [{ word: 'allow', comments: false }]
    })
  });

  await runtime.StateManager.loadSettings({ notify: false, scheduleEnrichment: false });
  assert.equal(await runtime.StateManager.toggleKidsKeywordComments('allow'), true);

  const savedKids = runtime.savedProfilesV4.at(-1).profiles.default.kids;
  assert.equal(savedKids.mode, 'whitelist');
  assert.equal(savedKids.whitelistKeywords[0].comments, true);
  assert.equal(savedKids.blockedKeywords[0].comments, false);
  assert.ok(runtime.messages.some((msg) => msg.action === 'getCompiledSettings' && msg.profileType === 'kids'));
});

test('StateManager Kids channel Filter All toggles filterAll while preserving filterAllComments', async () => {
  const runtime = loadStateManagerRuntime({
    profilesV4: baseProfilesV4({
      mode: 'blocklist',
      blockedChannels: [{
        name: 'Kids Channel',
        id: 'UCkids123',
        filterAll: false,
        filterAllComments: false
      }]
    })
  });

  await runtime.StateManager.loadSettings({ notify: false, scheduleEnrichment: false });
  assert.equal(await runtime.StateManager.toggleKidsChannelFilterAll(0), true);

  const savedChannel = runtime.savedProfilesV4.at(-1).profiles.default.kids.blockedChannels[0];
  assert.equal(savedChannel.filterAll, true);
  assert.equal(savedChannel.filterAllComments, false);
  assert.ok(runtime.messages.some((msg) => msg.action === 'getCompiledSettings' && msg.profileType === 'kids'));
  assert.ok(runtime.messages.some((msg) => msg.action === 'FilterTube_ScheduleAutoBackup' && msg.triggerType === 'kids_filter_all_toggled'));
});

test('StateManager Kids channel Filter All is write-silent in whitelist mode', async () => {
  const runtime = loadStateManagerRuntime({
    profilesV4: baseProfilesV4({
      mode: 'whitelist',
      blockedChannels: [{
        name: 'Kids Channel',
        id: 'UCkids123',
        filterAll: false,
        filterAllComments: false
      }],
      whitelistChannels: [{
        name: 'Allowed Kids',
        id: 'UCallowed123',
        filterAll: false,
        filterAllComments: false
      }]
    })
  });

  await runtime.StateManager.loadSettings({ notify: false, scheduleEnrichment: false });
  assert.equal(await runtime.StateManager.toggleKidsChannelFilterAll(0), false);

  assert.equal(runtime.savedProfilesV4.length, 0);
  assert.equal(runtime.savedProfilesV3.length, 0);
  assert.deepEqual(runtime.messages, []);
});

test('RenderEngine hides Kids keyword comments toggles and routes Kids channel Filter All to StateManager', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.renderKeywordCommentsGate, /const shouldShowCommentsToggle = shouldShowToggles && profile !== 'kids'/);
  assert.match(blocks.renderKeywordCommentsGate, /StateManager\?\.toggleChannelFilterAllCommentsByRef\?\.\(entry\.channelRef\)/);
  assert.match(blocks.renderKeywordCommentsGate, /StateManager\?\.toggleKeywordComments\(entry\.word\)/);
  assert.doesNotMatch(blocks.renderKeywordCommentsGate, /toggleKidsKeywordComments/);
  assert.match(blocks.renderChannelFilterAllToggle, /if \(profile === 'kids'\) \{\s*await StateManager\?\.toggleKidsChannelFilterAll\?\.\(index\)/);
  assert.match(blocks.renderChannelFilterAllToggle, /if \(effectiveMode === 'whitelist'\) \{/);
  assert.match(blocks.renderChannelFilterAllToggle, /spacer\.style\.visibility = 'hidden'/);
});

test('background Kids comment compile merges channel-derived Filter All patterns without filterAllComments policy', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.backgroundCompiledChannelObject, /const filterAllComments = \(typeof ch\.filterAllComments === 'boolean'\) \? ch\.filterAllComments : true/);
  assert.match(blocks.backgroundCompiledChannelObject, /filterAllComments,/);
  assert.match(blocks.backgroundCompiledChannelObject, /if \(channelObj\.filterAll && channelObj\.name && channelObj\.name !== channelObj\.id\) \{/);
  assert.doesNotMatch(
    sliceBetween(blocks.backgroundCompiledChannelObject, 'if (channelObj.filterAll', '                        }\n'),
    /filterAllComments/
  );

  assert.match(blocks.backgroundKidsCompile, /const compiledKidsKeywordsComments = rawKidsKeywords\.map/);
  assert.match(blocks.backgroundKidsCompile, /entry\.comments !== true/);
  assert.match(blocks.backgroundKidsCompile, /\(additionalKeywordsFromChannels \|\| \[\]\)\.forEach\(pushUnique\)/);
  assert.match(blocks.backgroundKidsCompile, /compiledSettings\.filterKeywordsComments = mergeWithChannels\(compiledKidsKeywordsComments\)/);

  assert.match(blocks.settingsSharedSyncFilterAll, /comments: \(typeof channel\.filterAllComments === 'boolean'\) \? channel\.filterAllComments : true/);
  assert.match(blocks.settingsSharedSyncFilterAll, /comments: \(typeof nextKeyword\?\.comments === 'boolean'\) \? nextKeyword\.comments : entry\.comments/);
  assert.match(blocks.filterLogicCommentDecision, /const commentKeywords = Array\.isArray\(this\.settings\.filterKeywordsComments\)/);
});

test('product runtime lacks Kids comments Filter All authority symbols', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const symbol of authoritySymbols) {
    assert.doesNotMatch(runtime, new RegExp(`\\b${symbol}\\b`));
    assert.ok(doc.includes(symbol), `doc should name missing authority symbol ${symbol}`);
  }
});
