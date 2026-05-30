import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13571, 601694, '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3']
};

const blockSpecs = {
  contentBridgeFallbackPerformBlock: {
    file: 'js/content_bridge.js',
    start: 'const performBlock = async (channelInfo, filterAll) => {',
    end: "const list = document.createElement('div');",
    startLine: 7429,
    lines: 213,
    bytes: 9930,
    hash: '5340e2307068efb0b3b60b32222a83780905964a8d41a81457a7e5ceaa8e00f1'
  },
  contentBridgeInjectFilterTubeMenuItem: {
    file: 'js/content_bridge.js',
    start: 'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    end: 'function attachFilterTubeMenuHandlers',
    startLine: 10673,
    lines: 738,
    bytes: 34747,
    hash: 'bd888fd13303b3b65439b38886c671fa46d87330730efab17e0f11c5eefe6831'
  },
  contentBridgeAttachFilterTubeMenuHandlers: {
    file: 'js/content_bridge.js',
    start: 'function attachFilterTubeMenuHandlers({ menuItem, toggle, channelInfo, videoCard, injectionOptions = {} }) {',
    end: 'function createFilterTubeIconElement',
    startLine: 11411,
    lines: 71,
    bytes: 2490,
    hash: '07e0e72b5c4c4a7f95615c0e752bd1ea987fd4851f31e23e3569e8d3bcadd540'
  },
  contentBridgeHandleBlockChannelClick: {
    file: 'js/content_bridge.js',
    start: 'async function handleBlockChannelClick(channelInfo, menuItem, filterAll = false, videoCard = null) {',
    end: '/**\n * Add channel directly using chrome.storage',
    startLine: 12141,
    lines: 1226,
    bytes: 60722,
    hash: '459943dd5f26638ac63bc413a7cee220e862225929aaf2a4a0b6e068cd32ef9f'
  },
  contentBridgeAddChannelDirectly: {
    file: 'js/content_bridge.js',
    start: 'async function addChannelDirectly(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}) {',
    end: '/**\n * Add "Filter All Content" checkbox',
    startLine: 13375,
    lines: 54,
    bytes: 2662,
    hash: '4eb280573a5611b695c8284a8e6b85d17b2a97c459143a3054d02374cdf7c2ca'
  }
};

const renderMenuEntriesSpec = {
  file: 'js/content_bridge.js',
  start: 'function renderFilterTubeMenuEntries',
  end: 'function updateInjectedMenuChannelName',
  startLine: 689,
  lines: 130,
  bytes: 6824,
  hash: '852fa9120a3dc7cc232e8f048b6833141fc4e34cd50bc48e3de696faf6100e9d'
};

const ampersandTopicMenuGuardSpec = {
  file: 'js/content_bridge.js',
  start: 'function contentBridgeAmpersandTopicSingleChannelMenuGuard',
  end: 'const filterTubeRawConsole',
  startLine: 13500,
  lines: 31,
  bytes: 1223,
  hash: '735cefcc42c64e33cd8ff6842c64f0348b70893bbc4a526e3008a37d782753b6'
};

const selectedCounts = {
  listMode: 1,
  showBlockMenuItem: 1,
  addChannelDirectly: 11,
  requestSettingsFromBackground: 3,
  applyDOMFallback: 5,
  upsertFilterChannel: 1,
  FilterTube_ScheduleAutoBackup: 1,
  addFilteredChannel: 1,
  whitelistChannels: 0,
  filterChannels: 0,
  'browserAPI_BRIDGE.runtime.sendMessage': 3,
  profile: 2,
  metadata: 13,
  filterAll: 32,
  currentSettings: 9,
  handleBlockChannelClick: 9,
  performBlock: 1,
  attachFilterTubeMenuHandlers: 1,
  click: 50,
  keydown: 1,
  preventNativeClick: 1,
  isPlaceholder: 1,
  toggleMultiStepSelection: 2,
  isFilterAllToggleActive: 3,
  optimisticHide: 8,
  restoreOptimisticHide: 3,
  confirmOptimisticHide: 2,
  syncBlockedElementsWithFilters: 0
};

const missingRuntimeSymbols = [
  'contentBridgeMenuActionListTargetContract',
  'contentBridgeMenuActionListTargetDecision',
  'contentBridgeMenuActionProfileTargetReport',
  'contentBridgeFallbackMenuMutationGate',
  'contentBridgeFallbackMenuListModePolicy',
  'contentBridgeMenuDirectAddListTargetReport',
  'contentBridgeMenuActionWhitelistBypassReport',
  'contentBridgeMenuActionOptimisticHideBudget',
  'contentBridgeMenuActionMutationFanoutMetric',
  'contentBridgeMenuActionListTargetFixtureProvenance',
  'contentBridgeMenuCollaboratorGrammarActionGate',
  'contentBridgePrimaryMenuCollaboratorActionConsequenceFixture',
  'contentBridgeMenuBylineGrammarEvidenceGate',
  'contentBridgeTopicMenuRendererParityReportContract',
  'contentBridgeTopicMenuRendererParityDecision',
  'contentBridgeTopicMenuRendererInstalledTabTrace',
  'contentBridgeTopicMenuRendererMetricArtifact',
  'contentBridgeTopicMenuRendererReleaseGate'
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

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return {
    start,
    block: text.slice(start, end)
  };
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
    .map(read)
    .join('\n');
}

function loadAddChannelDirectlyRuntime({ hostname = 'www.youtube.com', response = null } = {}) {
  const messages = [];
  const context = {
    browserAPI_BRIDGE: {
      runtime: {
        sendMessage(message, callback = () => {}) {
          messages.push(JSON.parse(JSON.stringify(message)));
          if (message.type === 'addFilteredChannel') {
            callback(response || {
              success: true,
              channelData: {
                id: 'UCmenuactionlisttarget00001',
                handle: '@menuaction',
                filterAll: message.filterAll
              }
            });
          } else {
            callback({ success: true });
          }
        }
      }
    },
    location: { hostname },
    window: {},
    console: { log() {}, warn() {}, error() {} },
    Promise,
    JSON,
    String,
    Boolean
  };
  vm.createContext(context);
  vm.runInContext(`${blockMetric(blockSpecs.contentBridgeAddChannelDirectly).block}\nthis.addChannelDirectly = addChannelDirectly;`, context);
  return { context, messages };
}

function loadRenderMenuEntriesRuntime() {
  const calls = {
    clearedMenu: [],
    clearedMultiStep: [],
    injectedNew: [],
    injectedOld: [],
    multiStep: [],
    resized: [],
    placeholders: [],
    topicGuards: []
  };
  const plain = (value) => JSON.parse(JSON.stringify(value));
  const context = {
    console: { log() {}, warn() {}, error() {} },
    getMenuContainers(dropdown, newMenuList, oldMenuList) {
      return { newMenuList, oldMenuList };
    },
    contentBridgeAmpersandTopicSingleChannelMenuGuard(channelInfo, videoCard) {
      calls.topicGuards.push({ channelInfo: plain(channelInfo), videoCard });
      return videoCard?.topicMenuGuardResult || null;
    },
    clearFilterTubeMenuItems(dropdown) {
      calls.clearedMenu.push(dropdown);
    },
    clearMultiStepStateForDropdown(dropdown) {
      calls.clearedMultiStep.push(dropdown);
    },
    injectCollaboratorPlaceholderMenu(newMenuList, oldMenuList, message) {
      calls.placeholders.push({ newMenuList, oldMenuList, message });
    },
    forceDropdownResize(dropdown) {
      calls.resized.push(dropdown);
    },
    generateCollaborationGroupId() {
      return 'collab-primary-menu-fixture';
    },
    injectIntoNewMenu(menuList, channelInfo, videoCard, collaborationMetadata = null, injectionOptions = {}) {
      const item = {
        isConnected: true,
        querySelector(selector) {
          if (selector === '.filtertube-menu-label') return { textContent: 'Block' };
          if (selector === '.filtertube-channel-name') {
            return { textContent: injectionOptions.displayName || channelInfo?.name || '' };
          }
          return null;
        }
      };
      calls.injectedNew.push({
        menuList,
        channelInfo: plain(channelInfo),
        videoCard,
        collaborationMetadata: plain(collaborationMetadata),
        injectionOptions: plain(injectionOptions),
        item
      });
      return item;
    },
    injectIntoOldMenu(menuList, channelInfo, videoCard, collaborationMetadata = null, injectionOptions = {}) {
      calls.injectedOld.push({
        menuList,
        channelInfo: plain(channelInfo),
        videoCard,
        collaborationMetadata: plain(collaborationMetadata),
        injectionOptions: plain(injectionOptions)
      });
      return { isConnected: true, querySelector: () => null };
    },
    setupMultiStepMenu(dropdown, groupId, collaborators = [], blockAllItem = null) {
      calls.multiStep.push({
        dropdown,
        groupId,
        collaborators: plain(collaborators),
        blockAllItem
      });
    },
    findStoredChannelEntry() {
      return null;
    },
    parseInt
  };
  vm.createContext(context);
  vm.runInContext(`${blockMetric(renderMenuEntriesSpec).block}\nthis.renderFilterTubeMenuEntries = renderFilterTubeMenuEntries;`, context);
  return { context, calls };
}

function loadAmpersandTopicMenuGuardRuntime() {
  const clearCalls = [];
  const context = {
    clearCalls,
    console: { log() {}, warn() {}, error() {} },
    Array,
    String
  };
  context.globalThis = context;
  const harness = `
    function isAmpersandTopicNameOnlyCollaboratorState(card, collaborators) {
      return Boolean(card?.isAmpersandTopic && Array.isArray(collaborators) && collaborators.length >= 2);
    }
    function getLiteralAmpersandTopicByline(card) {
      return card?.topicByline || '';
    }
    function extractVideoIdFromCard(card) {
      return card?.videoIdFromCard || '';
    }
    function ensureVideoIdForCard(card) {
      return card?.ensuredVideoId || '';
    }
    function clearAmpersandTopicCollaboratorState(card, videoId) {
      globalThis.clearCalls.push({ label: card?.label || 'card', videoId });
    }
    ${blockMetric(ampersandTopicMenuGuardSpec).block}
    globalThis.guard = contentBridgeAmpersandTopicSingleChannelMenuGuard;
  `;
  vm.createContext(context);
  vm.runInContext(harness, context);
  return context;
}

test('menu action list-target audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: current-behavior proof with a 2026-05-29 Topic menu guard implementation addendum/);
  assert.match(audit, /Runtime behavior now changes narrowly/);
  assert.match(audit, /literal ampersand Topic name-only collaborator rosters/);
  assert.match(audit, /menu action list-target authority/);
  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('menu action list-target source and effect blocks remain pinned', () => {
  const audit = doc();

  const renderMetric = blockMetric(renderMenuEntriesSpec);
  assert.equal(renderMetric.startLine, renderMenuEntriesSpec.startLine, 'contentBridgeRenderFilterTubeMenuEntries start line changed');
  assert.equal(renderMetric.lines, renderMenuEntriesSpec.lines, 'contentBridgeRenderFilterTubeMenuEntries line count changed');
  assert.equal(renderMetric.bytes, renderMenuEntriesSpec.bytes, 'contentBridgeRenderFilterTubeMenuEntries byte count changed');
  assert.equal(renderMetric.hash, renderMenuEntriesSpec.hash, 'contentBridgeRenderFilterTubeMenuEntries hash changed');
  assert.match(audit, new RegExp(`\\| \`contentBridgeRenderFilterTubeMenuEntries\` \\| \`${renderMenuEntriesSpec.file.replace('.', '\\.')}:${renderMenuEntriesSpec.startLine}\` \\| ${renderMenuEntriesSpec.lines} \\| ${renderMenuEntriesSpec.bytes} \\| \`${renderMenuEntriesSpec.hash}\` \\|`));

  const guardMetric = blockMetric(ampersandTopicMenuGuardSpec);
  assert.equal(guardMetric.startLine, ampersandTopicMenuGuardSpec.startLine, 'contentBridgeAmpersandTopicSingleChannelMenuGuard start line changed');
  assert.equal(guardMetric.lines, ampersandTopicMenuGuardSpec.lines, 'contentBridgeAmpersandTopicSingleChannelMenuGuard line count changed');
  assert.equal(guardMetric.bytes, ampersandTopicMenuGuardSpec.bytes, 'contentBridgeAmpersandTopicSingleChannelMenuGuard byte count changed');
  assert.equal(guardMetric.hash, ampersandTopicMenuGuardSpec.hash, 'contentBridgeAmpersandTopicSingleChannelMenuGuard hash changed');
  assert.match(audit, new RegExp(`\\| \`contentBridgeAmpersandTopicSingleChannelMenuGuard\` \\| \`${ampersandTopicMenuGuardSpec.file.replace('.', '\\.')}:${ampersandTopicMenuGuardSpec.startLine}\` \\| ${ampersandTopicMenuGuardSpec.lines} \\| ${ampersandTopicMenuGuardSpec.bytes} \\| \`${ampersandTopicMenuGuardSpec.hash}\` \\|`));

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line changed`);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
    assert.equal(metric.hash, spec.hash, `${name} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${name}\` \\| \`${spec.file.replace('.', '\\.')}:${spec.startLine}\` \\| ${spec.lines} \\| ${spec.bytes} \\| \`${spec.hash}\` \\|`));
  }
});

test('menu action list-target selected token counts remain pinned', () => {
  const source = selectedSource();
  const audit = doc();

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, token), expected, `${token} count changed`);
    assert.match(audit, new RegExp(`\\| \`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| ${expected} \\|`));
  }
});

test('menu action list-target missing future symbols remain absent from product runtime', () => {
  const source = productRuntimeSource();
  const audit = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in runtime`);
    assert.match(audit, new RegExp(`- \`${symbol}\``));
  }
});

test('primary menu injection has whitelist and menu-visibility gate before action rows', () => {
  const block = blockMetric(blockSpecs.contentBridgeInjectFilterTubeMenuItem).block;

  assert.match(block, /if \(currentSettings\?\.listMode === 'whitelist'\) return;/);
  assert.match(block, /if \(currentSettings\?\.showBlockMenuItem === false\) \{/);
  assert.match(block, /clearFilterTubeMenuItems\(dropdown\);/);
  assert.match(block, /clearMultiStepStateForDropdown\(dropdown\);/);
  assert.equal(countLiteral(block, 'addChannelDirectly'), 0);
  assert.equal(countLiteral(block, 'whitelistChannels'), 0);
});

test('attached menu interaction delegates block clicks without repeating list-mode gates', () => {
  const block = blockMetric(blockSpecs.contentBridgeAttachFilterTubeMenuHandlers).block;

  assert.match(block, /if \(injectionOptions\.preventNativeClick \|\| channelInfo\?\.isPlaceholder\) \{/);
  assert.match(block, /toggleMultiStepSelection\(menuItem, channelInfo\);/);
  assert.match(block, /const filterAll = isFilterAllToggleActive\(toggle\);/);
  assert.match(block, /await handleBlockChannelClick\(channelInfo, menuItem, filterAll, videoCard\);/);
  assert.equal(countLiteral(block, 'listMode'), 0);
  assert.equal(countLiteral(block, 'showBlockMenuItem'), 0);
  assert.equal(countLiteral(block, 'whitelistChannels'), 0);
});

test('block click handler has mutation fanout but no explicit list-target fields', () => {
  const block = blockMetric(blockSpecs.contentBridgeHandleBlockChannelClick).block;

  assert.equal(countLiteral(block, 'listMode'), 0);
  assert.equal(countLiteral(block, 'showBlockMenuItem'), 0);
  assert.equal(countLiteral(block, 'whitelistChannels'), 0);
  assert.equal(countLiteral(block, 'addChannelDirectly'), 8);
  assert.equal(countLiteral(block, 'upsertFilterChannel'), 1);
  assert.equal(countLiteral(block, 'requestSettingsFromBackground'), 1);
  assert.equal(countLiteral(block, 'applyDOMFallback'), 1);
  assert.match(block, /restoreOptimisticHide\(\);/);
  assert.match(block, /confirmOptimisticHide\(channelInfo\);/);
  assert.match(block, /enrichVisibleShortsWithChannelInfo\(channelInfo\.id, refreshedSettings \|\| currentSettings\);/);
  assert.match(block, /enrichVisiblePlaylistRowsWithChannelInfo\(channelInfo\.id, refreshedSettings \|\| currentSettings\);/);
});

test('fallback popover performBlock can mutate without local list-mode gate', () => {
  const block = blockMetric(blockSpecs.contentBridgeFallbackPerformBlock).block;

  assert.equal(countLiteral(block, 'listMode'), 0);
  assert.equal(countLiteral(block, 'showBlockMenuItem'), 0);
  assert.equal(countLiteral(block, 'whitelistChannels'), 0);
  assert.equal(countLiteral(block, 'addChannelDirectly'), 2);
  assert.equal(countLiteral(block, 'requestSettingsFromBackground'), 2);
  assert.equal(countLiteral(block, 'applyDOMFallback'), 4);
  assert.match(block, /handleBlockChannelClick\(info, synthetic, !!filterAll, row\);/);
  assert.equal(block.includes('handleBlockChannelClick({ ...(info || {}), videoId }, synthetic, !!filterAll, row);'), true);
});

test('addChannelDirectly sends blocklist-shaped add message and schedules backup on success', async () => {
  const { context, messages } = loadAddChannelDirectlyRuntime();

  const result = await context.addChannelDirectly('@menuaction', true, ['@other'], 'group-1', {
    handleDisplay: '@MenuAction',
    canonicalHandle: '@menuaction',
    channelName: 'Menu Action',
    channelLogo: 'https://example.test/logo.png',
    videoId: 'abcdefghijk',
    videoTitleHint: 'Fixture video',
    expectedChannelName: 'Menu Action',
    lowConfidenceExpectedName: true,
    customUrl: 'c/MenuAction',
    source: 'playlist_fallback_menu'
  });

  assert.equal(result.success, true);
  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0], {
    type: 'addFilteredChannel',
    input: '@menuaction',
    filterAll: true,
    collaborationWith: ['@other'],
    collaborationGroupId: 'group-1',
    displayHandle: '@MenuAction',
    canonicalHandle: '@menuaction',
    channelName: 'Menu Action',
    channelLogo: 'https://example.test/logo.png',
    videoId: 'abcdefghijk',
    videoTitleHint: 'Fixture video',
    expectedChannelName: 'Menu Action',
    lowConfidenceExpectedName: true,
    profile: 'main',
    customUrl: 'c/MenuAction',
    source: 'playlist_fallback_menu'
  });
  assert.equal(Object.hasOwn(messages[0], 'listMode'), false);
  assert.equal(Object.hasOwn(messages[0], 'whitelistChannels'), false);
  assert.equal(Object.hasOwn(messages[0], 'filterChannels'), false);
  assert.equal(Object.hasOwn(messages[0], 'listTarget'), false);
  assert.deepEqual(messages[1], {
    action: 'FilterTube_ScheduleAutoBackup',
    triggerType: 'channel_added',
    delay: 1000
  });
});

test('addChannelDirectly derives kids profile from YouTube Kids hostname', async () => {
  const { context, messages } = loadAddChannelDirectlyRuntime({ hostname: 'www.youtubekids.com' });

  const result = await context.addChannelDirectly('UCmenuactionlisttarget00002', false, null, null, {});

  assert.equal(result.success, true);
  assert.equal(messages[0].type, 'addFilteredChannel');
  assert.equal(messages[0].input, 'UCmenuactionlisttarget00002');
  assert.equal(messages[0].filterAll, false);
  assert.equal(messages[0].profile, 'kids');
  assert.equal(Object.hasOwn(messages[0], 'listMode'), false);
  assert.equal(Object.hasOwn(messages[0], 'whitelistChannels'), false);
  assert.equal(Object.hasOwn(messages[0], 'listTarget'), false);
});

test('menu action list-target audit doc records split gates and open rows', () => {
  const audit = doc();

  assert.match(audit, /primary dropdown injection path has the strongest front-door gate/);
  assert.match(audit, /returns immediately when `currentSettings\?\.listMode === 'whitelist'`/);
  assert.match(audit, /clears injected FilterTube rows and multi-step state/);
  assert.match(audit, /front-door gate is not repeated inside the later mutation functions/);
  assert.match(audit, /handler block contains no `listMode`, no `showBlockMenuItem`, and no `whitelistChannels` token/);
  assert.match(audit, /contains 8 `addChannelDirectly` callsites/);
  assert.match(audit, /fallback playlist popover path is a separate mutation route/);
  assert.match(audit, /`performBlock` block contains no `listMode`, no `showBlockMenuItem`, and no `whitelistChannels` token/);
  assert.match(audit, /does not include `listMode`, `whitelistChannels`, `filterChannels`, or a list-target field in the payload/);
  assert.match(audit, /first-class menu action decision artifact/);
  assert.match(audit, /menu action list-target contracts/);
  assert.match(audit, /fallback mutation gates/);
  assert.match(audit, /direct-add list-target reports/);
  assert.match(audit, /whitelist bypass reports/);
  assert.match(audit, /mutation fanout metrics/);

  assert.match(audit, /Primary Menu Collaborator Action Consequence Addendum - 2026-05-27/);
  assert.match(audit, /Primary menu collaborator consequence fixture rows: 3/);
  assert.match(audit, /primary_menu_ampersand_topic_name_only_risk/);
  assert.match(audit, /Kully B & Gussy G - Topic/);
  assert.match(audit, /All Collaborators \(resolving\.\.\.\)/);
  assert.match(audit, /primary_menu_and_name_resolved_risk/);
  assert.match(audit, /Both Channels/);
  assert.match(audit, /primary_menu_single_channel_control/);
  assert.match(audit, /the primary menu renderer is not the grammar\s+authority/);
  assert.match(audit, /flowchart TD/);

  assert.match(audit, /Topic Menu Renderer Parity Report Contract - 2026-05-29/);
  assert.match(audit, /Status: implementation-backed report contract/);
  assert.match(audit, /Runtime behavior changed narrowly/);
  assert.match(audit, /required before the audit can move\s+`menu renderer Topic parity proof` from `NO-GO` to `GO`/);
  assert.match(audit, /clean Topic menu handoff/);
  assert.match(audit, /stale Topic menu handoff/);
  assert.match(audit, /Required report fields:/);
  assert.match(audit, /Topic menu renderer parity contract rows: 10/);
  assert.match(audit, /required Topic menu renderer parity fields: 20/);
  assert.match(audit, /implementation-ready Topic menu renderer rows: 7/);
  assert.match(audit, /runtime Topic menu renderer approvals: 1/);
  assert.match(audit, /menu renderer Topic parity proof from contract: PARTIAL_GO_SOURCE/);
  assert.match(audit, /installed-tab byte parity trace: MISSING/);
  assert.match(audit, /runtime behavior changed by this contract: yes/);
  assert.match(audit, /Topic Menu Renderer Source Guard Implementation - 2026-05-29/);
  assert.match(audit, /contentBridgeAmpersandTopicSingleChannelMenuGuard/);
  assert.match(audit, /returns one single-channel `channelInfo`\s+row/);

  for (const row of [
    'topic_menu_report_clean_primary',
    'topic_menu_report_clean_old_menu',
    'topic_menu_report_stale_attr_cleanup',
    'topic_menu_report_stale_resolved_cache_cleanup',
    'topic_menu_report_placeholder_path',
    'topic_menu_report_true_collab_positive',
    'topic_menu_report_single_and_negative',
    'topic_menu_report_quick_block_crosscheck',
    'topic_menu_report_installed_tab_trace',
    'topic_menu_report_release_gate'
  ]) {
    assert.ok(audit.includes(`| \`${row}\` |`), `missing Topic menu renderer contract row ${row}`);
  }

  for (const field of [
    'route',
    'surface',
    'profile',
    'listMode',
    'menuSurface',
    'visibleByline',
    'inputChannelInfo',
    'writerSource',
    'cacheSource',
    'expectedCollaboratorCount',
    'outputRows',
    'blockAllState',
    'mutationPayload',
    'upstreamGuardProof',
    'negativeTopicFixture',
    'positiveCollabControl',
    'singleChannelAndControl',
    'quickBlockParityState',
    'installedTabByteTrace',
    'metricArtifact'
  ]) {
    assert.match(audit, new RegExp(`^${field}$`, 'm'), `missing Topic menu renderer required field ${field}`);
  }

  const guardRuntime = loadAmpersandTopicMenuGuardRuntime();
  const guardedInfo = guardRuntime.guard({
    name: 'Kully B',
    videoId: 'o4LJY7Zhxjk',
    isCollaboration: true,
    allCollaborators: [
      { name: 'Kully B', handle: '', id: '', customUrl: '' },
      { name: 'Gussy G - Topic', handle: '', id: '', customUrl: '' }
    ],
    needsEnrichment: true,
    expectedCollaboratorCount: 2
  }, {
    label: 'topic-menu-card',
    isAmpersandTopic: true,
    topicByline: 'Kully B & Gussy G - Topic'
  });
  assert.equal(guardedInfo.name, 'Kully B & Gussy G - Topic');
  assert.equal(guardedInfo.isCollaboration, false);
  assert.deepEqual(JSON.parse(JSON.stringify(guardedInfo.allCollaborators)), []);
  assert.equal(guardedInfo.needsEnrichment, false);
  assert.equal(guardedInfo.expectedCollaboratorCount, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(guardRuntime.clearCalls)), [{ label: 'topic-menu-card', videoId: 'o4LJY7Zhxjk' }]);

  const topicRuntime = loadRenderMenuEntriesRuntime();
  const topicDropdown = { name: 'topic-dropdown' };
  const topicMenu = { name: 'topic-menu' };
  topicRuntime.context.renderFilterTubeMenuEntries({
    dropdown: topicDropdown,
    newMenuList: topicMenu,
    oldMenuList: null,
    channelInfo: {
      isCollaboration: true,
      allCollaborators: [
        { name: 'Kully B', handle: '', id: '', customUrl: '' },
        { name: 'Gussy G - Topic', handle: '', id: '', customUrl: '' }
      ]
    },
    videoCard: {
      name: 'topic-card',
      topicMenuGuardResult: {
        name: 'Kully B & Gussy G - Topic',
        isCollaboration: false,
        allCollaborators: [],
        needsEnrichment: false,
        expectedCollaboratorCount: 0,
        videoId: 'o4LJY7Zhxjk'
      }
    }
  });
  assert.equal(topicRuntime.calls.injectedNew.length, 1);
  assert.equal(topicRuntime.calls.injectedNew[0].channelInfo.name, 'Kully B & Gussy G - Topic');
  assert.equal(topicRuntime.calls.injectedNew[0].channelInfo.isBlockAllOption, undefined);
  assert.equal(topicRuntime.calls.multiStep.length, 0);

  const oldTopicRuntime = loadRenderMenuEntriesRuntime();
  oldTopicRuntime.context.renderFilterTubeMenuEntries({
    dropdown: { name: 'old-topic-dropdown' },
    newMenuList: null,
    oldMenuList: { name: 'old-topic-menu' },
    placeholder: true,
    channelInfo: {
      isCollaboration: true,
      allCollaborators: [
        { name: 'Kully B', handle: '', id: '', customUrl: '' },
        { name: 'Gussy G - Topic', handle: '', id: '', customUrl: '' }
      ]
    },
    videoCard: {
      name: 'old-topic-card',
      topicMenuGuardResult: {
        name: 'Kully B & Gussy G - Topic',
        isCollaboration: false,
        allCollaborators: [],
        needsEnrichment: false,
        expectedCollaboratorCount: 0
      }
    }
  });
  assert.equal(oldTopicRuntime.calls.injectedOld.length, 1);
  assert.equal(oldTopicRuntime.calls.injectedOld[0].channelInfo.name, 'Kully B & Gussy G - Topic');
  assert.equal(oldTopicRuntime.calls.placeholders.length, 0);
  assert.equal(oldTopicRuntime.calls.multiStep.length, 0);

  const resolvedRuntime = loadRenderMenuEntriesRuntime();
  resolvedRuntime.context.renderFilterTubeMenuEntries({
    dropdown: { name: 'resolved-dropdown' },
    newMenuList: { name: 'resolved-menu' },
    oldMenuList: null,
    channelInfo: {
      isCollaboration: true,
      allCollaborators: [
        { name: 'Law', handle: '@law', id: '', customUrl: '' },
        { name: 'Crime Network', handle: '@crimenetwork', id: '', customUrl: '' }
      ]
    },
    videoCard: { name: 'resolved-card' }
  });
  assert.equal(resolvedRuntime.calls.injectedNew.length, 3);
  assert.equal(resolvedRuntime.calls.injectedNew[0].collaborationMetadata.collaborationWith[0], '@crimenetwork');
  assert.equal(resolvedRuntime.calls.injectedNew[1].collaborationMetadata.collaborationWith[0], '@law');
  assert.equal(resolvedRuntime.calls.injectedNew[2].channelInfo.name, 'Both Channels');
  assert.equal(resolvedRuntime.calls.injectedNew[2].channelInfo.isBlockAllOption, true);
  assert.equal(resolvedRuntime.calls.injectedNew[2].channelInfo.allCollaborators.length, 2);
  assert.equal(resolvedRuntime.calls.injectedNew[2].injectionOptions.displayName, 'Both Channels');
  assert.equal(resolvedRuntime.calls.injectedNew[2].injectionOptions.disabled, false);

  const singleRuntime = loadRenderMenuEntriesRuntime();
  singleRuntime.context.renderFilterTubeMenuEntries({
    dropdown: { name: 'single-dropdown' },
    newMenuList: { name: 'single-menu' },
    oldMenuList: null,
    channelInfo: { name: 'Law and Crime Network', handle: '@lawandcrime' },
    videoCard: { name: 'single-card' }
  });
  assert.equal(singleRuntime.calls.injectedNew.length, 1);
  assert.equal(singleRuntime.calls.injectedNew[0].channelInfo.name, 'Law and Crime Network');
  assert.equal(singleRuntime.calls.injectedNew[0].channelInfo.isBlockAllOption, undefined);
  assert.equal(singleRuntime.calls.multiStep.length, 0);
});
