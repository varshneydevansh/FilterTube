import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/state_manager.js': [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
  'js/render_engine.js': [1389, 59073, 'ceb77f3e50a17affb726f099b15b52fdce311cd027b8f0903174b8d1433cbfa0'],
  'js/background.js': [6343, 286370, 'ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5']
};

const blockSpecs = {
  stateManagerToggleChannelFilterAllCommentsByRef: {
    file: 'js/state_manager.js',
    start: 'async function toggleChannelFilterAllCommentsByRef(channelRef) {',
    end: '    /**\n     * Check if a channel already exists',
    startLine: 1925,
    lines: 45,
    bytes: 1434,
    hash: '13c85642e028eee9bb5dbd5b5f334c464539e8422a7d856632a58dfe98ebced3'
  },
  renderEngineKeywordCommentsToggle: {
    file: 'js/render_engine.js',
    start: 'const shouldShowToggles = includeToggles;',
    end: "        if (isChannelDerived && shouldShowToggles && profile === 'kids')",
    startLine: 370,
    lines: 64,
    bytes: 3192,
    hash: '6b0c019df85e4af542a4bbacedcc2c6d3a2a38a8ea00227fcd3e805351d0aa8b'
  },
  renderEngineFindChannelByRef: {
    file: 'js/render_engine.js',
    start: 'function findChannelByRef(channelRef) {',
    end: '    /**\n     * Derive channel mapping for visualization',
    startLine: 1222,
    lines: 16,
    bytes: 669,
    hash: '99f016287c15dc172db5d82e74739ee0059a7490e855ac302409fd733c851701'
  },
  settingsSharedSyncFilterAllKeywords: {
    file: 'js/settings_shared.js',
    start: 'function syncFilterAllKeywords',
    end: '    function buildCompiledSettings',
    startLine: 412,
    lines: 72,
    bytes: 2967,
    hash: 'ce4e49c6055252ab9a6db6a30be91ddfb50efead1c1ef76bf736c38717febd25'
  },
  backgroundSyncStoredMainKeywordsWithChannels: {
    file: 'js/background.js',
    start: 'function syncStoredMainKeywordsWithChannels(existingKeywords, channels) {',
    end: '// Deep link into the tab-view dashboard',
    startLine: 1196,
    lines: 82,
    bytes: 2534,
    hash: '11ab05bc86763b098b430c9545feefdcab8efa58b4fa59ff7770717bdf081a3d'
  },
  filterLogicCommentDecision: {
    file: 'js/filter_logic.js',
    start: "if (rendererType.includes('comment') || rendererType.includes('Comment'))",
    end: '            // Content filters (duration, upload date)',
    startLine: 2214,
    lines: 33,
    bytes: 1902,
    hash: '690889872bba60727d30a9544c2f3340e6df04631d970064869f641c4589a43d'
  }
};

const selectedCounts = {
  toggleChannelFilterAllCommentsByRef: 4,
  filterAllComments: 10,
  filterKeywordsComments: 2,
  syncFilterAllKeywords: 1,
  syncStoredMainKeywordsWithChannels: 1,
  'comments:': 4,
  'state.mode === \'whitelist\'': 1,
  isUiLocked: 1,
  recomputeKeywords: 1,
  saveSettings: 1,
  notifyListeners: 1,
  comment_filter_toggled: 1,
  scheduleAutoBackup: 1,
  'profile !== \'kids\'': 1,
  onToggleComments: 6,
  toggleKeywordComments: 3,
  findChannelByRef: 1,
  getChannelDerivedKey: 6,
  'source: \'channel\'': 5,
  channelRef: 35,
  filterAll: 13,
  hideAllComments: 2,
  commentText: 8,
  filterChannels: 2,
  filterKeywords: 3,
  addEventListener: 2,
  keydown: 1,
  click: 1
};

const missingRuntimeSymbols = [
  'mainFilterAllCommentsScopeContract',
  'mainFilterAllCommentsToggleReport',
  'mainFilterAllCommentsListModePolicy',
  'mainFilterAllCommentsChannelRefPolicy',
  'mainFilterAllCommentsCompilerParityReport',
  'mainFilterAllCommentsJsonProvenanceReport',
  'mainFilterAllCommentsInactiveFilterAllReport',
  'mainFilterAllCommentsFixtureProvenance',
  'mainFilterAllCommentsMetricArtifact',
  'mainFilterAllCommentsAuthorityGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return { start, block: text.slice(start, end) };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256Text(block),
    block
  };
}

function selectedSource() {
  return Object.values(blockSpecs).map((spec) => blockMetric(spec).block).join('\n');
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function derivedKey(channel) {
  return String(channel?.id || channel?.handle || channel?.originalInput || channel?.name || '').toLowerCase();
}

function derivedWord(channel) {
  return channel?.name && channel.name !== channel.id
    ? channel.name
    : (channel?.handle || channel?.id || channel?.originalInput || '');
}

function syncFilterAllKeywords(userKeywords, channels) {
  const result = Array.isArray(userKeywords) ? userKeywords.map(plain) : [];
  for (const channel of Array.isArray(channels) ? channels : []) {
    if (!channel?.filterAll) continue;
    const channelRef = derivedKey(channel);
    if (!channelRef) continue;
    result.push({
      word: derivedWord(channel),
      exact: true,
      semantic: false,
      source: 'channel',
      channelRef,
      comments: typeof channel.filterAllComments === 'boolean' ? channel.filterAllComments : true,
      addedAt: channel.addedAt || Date.now()
    });
  }
  return result;
}

function profilesV4({ mode = 'blocklist', channels = [], keywords = [] } = {}) {
  return {
    schemaVersion: 4,
    activeProfileId: 'active',
    profiles: {
      active: {
        name: 'Active',
        settings: { enabled: true, syncKidsToMain: false },
        main: {
          mode,
          channels: plain(channels),
          blockedChannels: plain(channels),
          whitelistChannels: mode === 'whitelist' ? plain(channels) : [],
          keywords: plain(keywords),
          blockedKeywords: plain(keywords),
          whitelistKeywords: []
        },
        kids: {
          mode: 'blocklist',
          blockedChannels: [],
          whitelistChannels: [],
          blockedKeywords: [],
          whitelistKeywords: []
        }
      }
    }
  };
}

function loadStateManagerRuntime({ mode = 'blocklist', channels = [], userKeywords = [] } = {}) {
  const savedSettings = [];
  const messages = [];
  const listenerEvents = [];
  const context = {
    console,
    Date,
    JSON,
    Promise,
    setTimeout,
    clearTimeout,
    window: null,
    globalThis: null,
    chrome: {
      runtime: {
        sendMessage(payload, callback) {
          messages.push(plain(payload));
          callback?.({ ok: true });
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
    getChannelDerivedKey: derivedKey,
    getChannelKeywordWord: derivedWord,
    syncFilterAllKeywords,
    async loadSettings() {
      return {
        enabled: true,
        userKeywords: plain(userKeywords),
        keywords: plain(userKeywords),
        channels: plain(channels),
        showQuickBlockButton: true,
        showBlockMenuItem: true
      };
    },
    async saveSettings(next) {
      const copied = plain(next);
      savedSettings.push(copied);
      return {
        settings: copied,
        compiledSettings: { enabled: true, filterKeywordsComments: [] }
      };
    }
  };
  context.FilterTubeIO = {
    async loadProfilesV3() {
      return null;
    },
    async loadProfilesV4() {
      return profilesV4({ mode, channels, keywords: userKeywords });
    }
  };

  vm.runInContext(read('js/state_manager.js'), vm.createContext(context), {
    filename: path.join(repoRoot, 'js/state_manager.js')
  });
  context.StateManager.subscribe((eventType, data) => listenerEvents.push(plain({ eventType, data })));

  return {
    StateManager: context.StateManager,
    savedSettings,
    messages,
    listenerEvents
  };
}

function loadSettingsSharedRuntime() {
  const context = {
    console,
    Date,
    JSON,
    window: null,
    globalThis: null,
    chrome: {
      storage: {
        local: {
          get(_keys, callback) { callback({}); },
          set(_payload, callback) { callback?.(); }
        }
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInContext(read('js/settings_shared.js'), vm.createContext(context), {
    filename: path.join(repoRoot, 'js/settings_shared.js')
  });
  return context.FilterTubeSettings;
}

test('main Filter All comments scope audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: audit-only current-behavior proof slice/);
  assert.match(audit, /Runtime behavior is unchanged/);
  assert.match(audit, /not an implementation patch/);
  assert.match(audit, /Main Filter All comments scope source files: 5/);
  assert.match(audit, /Main Filter All comments scope source\/effect blocks: 6/);
  assert.match(audit, /runtime Main Filter All comments scope fixtures: 10/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('main Filter All comments scope source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line changed`);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
    assert.equal(metric.hash, spec.hash, `${name} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${name}\` \\| \`${escapeRegex(`${spec.file}:${spec.startLine}`)}\` \\| ${spec.lines} \\| ${spec.bytes} \\| \`${spec.hash}\` \\|`));
  }
});

test('main Filter All comments selected token counts remain pinned', () => {
  const source = selectedSource();
  const audit = doc();

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, token), expected, `${token} count changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(token)}\` \\| ${expected} \\|`));
  }
});

test('main Filter All comments missing future symbols remain absent from product runtime', () => {
  const source = productRuntimeSource();
  const audit = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in runtime`);
    assert.match(audit, new RegExp(`- \`${symbol}\``));
  }
});

test('StateManager toggles active Main channel-derived comments and schedules backup', async () => {
  const channels = [{
    name: 'Main Channel',
    id: 'UCmaincomments000001',
    handle: '@maincomments',
    filterAll: true,
    addedAt: 2000
  }];
  const runtime = loadStateManagerRuntime({
    mode: 'blocklist',
    channels,
    userKeywords: [{ word: 'manual', source: 'user', comments: true, addedAt: 1000 }]
  });

  await runtime.StateManager.loadSettings({ notify: false, scheduleEnrichment: false });
  const result = await runtime.StateManager.toggleChannelFilterAllCommentsByRef('ucmaincomments000001');

  assert.equal(result, false);
  assert.equal(runtime.savedSettings.length, 1);
  assert.equal(runtime.savedSettings[0].channels[0].filterAllComments, false);
  assert.ok(runtime.savedSettings[0].keywords.some((entry) => entry.source === 'channel' && entry.channelRef === 'ucmaincomments000001' && entry.comments === false));
  assert.ok(runtime.listenerEvents.some((event) => event.eventType === 'channelUpdated' && event.data.filterAllComments === false));
  assert.ok(runtime.listenerEvents.some((event) => event.eventType === 'save'));
  assert.ok(runtime.messages.some((msg) => msg.action === 'FilterTube_ApplySettings' && msg.profile === 'main'));
  assert.ok(runtime.messages.some((msg) => msg.action === 'FilterTube_ScheduleAutoBackup' && msg.triggerType === 'comment_filter_toggled'));
});

test('StateManager Main channel-derived comments toggle is write-silent in whitelist mode', async () => {
  const runtime = loadStateManagerRuntime({
    mode: 'whitelist',
    channels: [{
      name: 'Whitelist Main',
      id: 'UCwhitelistcomments001',
      filterAll: true,
      filterAllComments: true
    }]
  });

  await runtime.StateManager.loadSettings({ notify: false, scheduleEnrichment: false });
  const result = await runtime.StateManager.toggleChannelFilterAllCommentsByRef('ucwhitelistcomments001');

  assert.equal(result, false);
  assert.deepEqual(runtime.savedSettings, []);
  assert.deepEqual(runtime.messages, []);
  assert.equal(runtime.listenerEvents.some((event) => event.eventType === 'channelUpdated'), false);
});

test('StateManager can toggle latent comments scope on inactive Main Filter All rows', async () => {
  const runtime = loadStateManagerRuntime({
    mode: 'blocklist',
    channels: [{
      name: 'Inactive Main',
      id: 'UCinactivecomments01',
      filterAll: false,
      filterAllComments: true,
      addedAt: 2000
    }]
  });

  await runtime.StateManager.loadSettings({ notify: false, scheduleEnrichment: false });
  const result = await runtime.StateManager.toggleChannelFilterAllCommentsByRef('ucinactivecomments01');

  assert.equal(result, false);
  assert.equal(runtime.savedSettings[0].channels[0].filterAll, false);
  assert.equal(runtime.savedSettings[0].channels[0].filterAllComments, false);
  assert.equal(runtime.savedSettings[0].keywords.some((entry) => entry.source === 'channel'), false);
  assert.ok(runtime.messages.some((msg) => msg.action === 'FilterTube_ScheduleAutoBackup' && msg.triggerType === 'comment_filter_toggled'));
});

test('settings_shared syncFilterAllKeywords carries comments scope and drops stale channel rows', () => {
  const Settings = loadSettingsSharedRuntime();
  const synced = Settings.syncFilterAllKeywords(
    [
      { word: 'manual', source: 'user', comments: true, addedAt: 1000 },
      { word: 'stale', source: 'channel', channelRef: 'ucstale', comments: true, addedAt: 900 }
    ],
    [
      { name: 'Muted Comments', id: 'UCmutedcomments01', filterAll: true, filterAllComments: false, addedAt: 2000 },
      { name: 'Default Comments', id: 'UCdefaultcomments1', filterAll: true, addedAt: 1500 },
      { name: 'Inactive', id: 'UCinactivecomments', filterAll: false, filterAllComments: false, addedAt: 3000 }
    ]
  );

  assert.ok(synced.some((entry) => entry.source === 'user' && entry.word === 'manual'));
  assert.ok(synced.some((entry) => entry.source === 'channel' && entry.channelRef === 'ucmutedcomments01' && entry.comments === false));
  assert.ok(synced.some((entry) => entry.source === 'channel' && entry.channelRef === 'ucdefaultcomments1' && entry.comments === true));
  assert.equal(synced.some((entry) => entry.channelRef === 'ucstale'), false);
  assert.equal(synced.some((entry) => entry.channelRef === 'ucinactivecomments'), false);
});

test('RenderEngine routes Main comment toggles through channelRef and suppresses Kids controls', () => {
  const toggleBlock = blockMetric(blockSpecs.renderEngineKeywordCommentsToggle).block;
  const findBlock = blockMetric(blockSpecs.renderEngineFindChannelByRef).block;

  assert.match(toggleBlock, /const shouldShowCommentsToggle = shouldShowToggles && profile !== 'kids'/);
  assert.match(toggleBlock, /if \(typeof onToggleComments === 'function'\)/);
  assert.equal(countLiteral(toggleBlock, 'StateManager?.toggleChannelFilterAllCommentsByRef?.(entry.channelRef)'), 3);
  assert.equal(countLiteral(toggleBlock, 'StateManager?.toggleKeywordComments(entry.word)'), 3);
  assert.match(toggleBlock, /toggle\.addEventListener\('click'/);
  assert.match(toggleBlock, /toggle\.addEventListener\('keydown'/);
  assert.doesNotMatch(toggleBlock, /toggleKidsKeywordComments/);
  assert.match(findBlock, /const allChannels = \[\.\.\.mainChannels, \.\.\.kidsChannels\]/);
  assert.match(findBlock, /Settings\.getChannelDerivedKey\(ch\)/);
});

test('background and JSON comment consumers lack first-class comments provenance', () => {
  const backgroundBlock = blockMetric(blockSpecs.backgroundSyncStoredMainKeywordsWithChannels).block;
  const filterLogicBlock = blockMetric(blockSpecs.filterLogicCommentDecision).block;
  const audit = doc();

  assert.match(backgroundBlock, /comments: \(typeof channel\.filterAllComments === 'boolean'\) \? channel\.filterAllComments : true/);
  assert.match(backgroundBlock, /if \(!channelRef \|\| !activeChannelKeys\.has\(channelRef\)\) \{\s*return;/);
  assert.match(backgroundBlock, /comments: nextKeyword\.comments/);
  assert.doesNotMatch(backgroundBlock, /profileType/);
  assert.doesNotMatch(backgroundBlock, /listMode/);
  assert.match(filterLogicBlock, /if \(this\.settings\.hideAllComments\)/);
  assert.match(filterLogicBlock, /const commentKeywords = Array\.isArray\(this\.settings\.filterKeywordsComments\)/);
  assert.match(filterLogicBlock, /this\.settings\.filterKeywords/);
  assert.match(filterLogicBlock, /this\.settings\.filterChannels\.length > 0/);
  assert.doesNotMatch(filterLogicBlock, /channelRef/);
  assert.match(audit, /JSON comment engine consumes compiled `filterKeywordsComments`/);
  assert.match(audit, /does not carry row id, channelRef, profile, list mode, or comments-scope provenance/);
});
