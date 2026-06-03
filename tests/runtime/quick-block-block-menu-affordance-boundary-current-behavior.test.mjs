import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'contentAffordanceControlsContract',
  'quickBlockMenuAffordanceDecisionReport',
  'quickBlockLifecycleBudget',
  'blockMenuActionGateReport',
  'fallbackMenuActionGateParityReport',
  'affordanceSettingsCacheInvalidationReport',
  'quickBlockDomSelectorInventoryPolicy',
  'fallbackMenuFalseHideRestoreReport',
  'affordanceRoutePausePolicy',
  'affordanceFixtureProvenance',
  'affordanceMetricArtifact',
  'quickBlockCollaboratorGrammarHandoffReport',
  'quickBlockCollaboratorActionParityReport',
  'quickBlockTopicNegativeActionFixture',
  'primaryMenuCollaboratorGrammarParityTrace'
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
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
  const catalog = read('js/content_controls_catalog.js');
  const settingsShared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const stateManager = read('js/state_manager.js');
  const blockChannel = read('js/content/block_channel.js');
  const contentBridge = read('js/content_bridge.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    catalog,
    settingsShared,
    background,
    bridgeSettings,
    stateManager,
    blockChannel,
    contentBridge,
    catalogFeedAffordanceControls: sliceBetween(
      catalog,
      "                {\n                    key: 'showQuickBlockButton',",
      "            ]\n        },\n        {\n            id: 'watch'"
    ),
    sharedSettingsKeys: sliceBetween(
      settingsShared,
      '    const SETTINGS_KEYS = [',
      '\n\n    const SETTINGS_CHANGE_KEYS'
    ),
    sharedAffordanceCompile: sliceBetween(
      settingsShared,
      '            showQuickBlockButton: showQuickBlockButton !== false,',
      '            hideSearchShelves: !!hideSearchShelves,'
    ),
    bgBooleanPassThrough: sliceBetween(
      background,
      '            // Pass through boolean flags',
      '            const profileContentFilters ='
    ),
    bgRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    ),
    stateValidKeys: sliceBetween(
      stateManager,
      '        const validKeys = [',
      '        ];\n\n        if (!validKeys.includes(key))'
    ),
    stateExternalReloadKeys: sliceBetween(
      stateManager,
      '                const storageKeys = [',
      '                const hasSettingsChange = storageKeys.some'
    ),
    quickBlockSelectors: sliceBetween(
      blockChannel,
      'const QUICK_BLOCK_CARD_SELECTORS = [',
      "].join(', ');"
    ),
    quickBlockEnabledGate: sliceBetween(
      blockChannel,
      'const isQuickBlockEnabled = () => {',
      '\n\nfunction ensureQuickBlockStyles()'
    ),
    quickBlockActionInfo: sliceBetween(
      blockChannel,
      'function getQuickBlockActionInfo(context) {',
      '\n\nfunction buildQuickBlockFallbackMetadata'
    ),
    quickBlockSetupLifecycle: sliceBetween(
      blockChannel,
      'function setupQuickBlockObserver() {',
      '\n}\n\n/**\n * Observe dropdowns and inject FilterTube menu items'
    ),
    normalMenuGate: sliceBetween(
      contentBridge,
      'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
      '    const videoCardTagName ='
    ),
    fallbackButtonCreate: sliceBetween(
      contentBridge,
      '    const createFallbackButton = (card, surface) => {',
      '\n\n    const ensureFallbackButtonForCard ='
    ),
    fallbackScanLifecycle: sliceBetween(
      contentBridge,
      '    const fallbackMenuCardSelector = [',
      '\n}\n\nlet playlistFallbackPopoverState'
    ),
    fallbackPopoverOpenStart: sliceBetween(
      contentBridge,
      'function openFilterTubePlaylistFallbackPopover(button, row) {',
      '    const createFallbackMenuRow ='
    ),
    fallbackPerformBlock: sliceBetween(
      contentBridge,
      '    const performBlock = async (channelInfo, filterAll) => {',
      '    const list = document.createElement'
    )
  };
}

function loadQuickBlockActionRuntime() {
  const block = sourceBlocks().quickBlockActionInfo;
  const context = {
    Array,
    Date: { now: () => 12345 },
    globalThis: null
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`
    function generateCollaborationGroupId() {
      return 'group-fixed';
    }

    ${block}

    globalThis.__getQuickBlockActionInfo = getQuickBlockActionInfo;
  `, context);
  return context.__getQuickBlockActionInfo;
}

test('quick-block/block-menu affordance audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof slice with 2026-05-25 SPA drag optimization addendum/);
  assert.match(doc, /Runtime behavior changed only for lifecycle scheduling/);
  assert.match(doc, /quick-block\s+periodic full-document sweep was removed/);
  assert.match(doc, /quick-block\/block-menu affordance boundary source files: 7/);
  assert.match(doc, /runtime quick-block\/block-menu affordance fixtures: 7/);

  assert.ok(doc.includes(`| \`js/content_controls_catalog.js\` | 222 | 7822 | \`${sha256('js/content_controls_catalog.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6641 | 298986 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 1113 | 44087 | \`${sha256('js/content/bridge_settings.js')}\` |`));
  assert.ok(doc.includes(`| \`js/state_manager.js\` | 2491 | 99780 | \`${sha256('js/state_manager.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/block_channel.js\` | 3189 | 127857 | \`${sha256('js/content/block_channel.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content_bridge.js\` | 13636 | 604184 | \`${sha256('js/content_bridge.js')}\` |`));

  for (const token of [
    'Collaborator Grammar Action Handoff Addendum - 2026-05-27',
    'quick-block collaborator action rows: 5',
    'ASCII collaborator action diagram: present',
    'Mermaid collaborator action diagram: present',
    'watch-like "and" false-positive reaches action layer from current upstream bare byline path: NO',
    'synthetic collaborator-shaped input can still reach action layer: YES',
    'Quick-Block Action Consequence Fixture Packet - 2026-05-27',
    'quick-block action consequence fixture rows: 4',
    'misclassified single-channel and-name action risk: GATED_UPSTREAM_FOR_KNOWN_BARE_BYLINE_PATH',
    'synthetic collaborator-shaped action consequence risk: PRESENT',
    'runtime behavior changed by upstream 2026-05-28 separator gate: yes',
    'Quick-Block Topic Negative Crosscheck - 2026-05-29',
    'topic quick-block clean-state fixture rows: 3',
    'known ampersand Topic quick-block action: SINGLE_CHANNEL_AFTER_TOPIC_GUARD',
    'quick-block full Topic parity authority: PARTIAL_GO',
    'runtime behavior changed by 2026-05-29 collaborator handoff continuation: yes'
  ]) {
    assert.match(doc, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const row of [
    'quick_block_context_promotion_handoff',
    'quick_block_block_all_threshold',
    'quick_block_fallback_target_list',
    'primary_menu_collaboration_render',
    'primary_menu_collaboration_fetch_guard'
  ]) {
    assert.ok(doc.includes(`| \`${row}\` |`), `missing collaborator action row ${row}`);
  }

  for (const row of [
    'quick_action_and_name_risk_block_all',
    'quick_action_single_channel_control',
    'quick_action_six_target_cap',
    'quick_action_null_context_control'
  ]) {
    assert.ok(doc.includes(`| \`${row}\` |`), `missing quick-block action consequence row ${row}`);
  }

  for (const sourcePin of [
    'js/content/block_channel.js:1543-1603',
    'js/content/block_channel.js:1607-1639',
    'js/content/block_channel.js:1671-1689',
    'js/content_bridge.js:731-795',
    'js/content_bridge.js:11139-11208',
    'js/content_bridge.js:11220-11248'
  ]) {
    assert.ok(doc.includes(`\`${sourcePin}\``), `missing collaborator action source pin ${sourcePin}`);
  }

  for (const ledgerPath of [
    'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
    'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'
  ]) {
    const ledger = read(ledgerPath);
    assert.ok(ledger.includes('2026-05-28 quick-block action consequence fixture refresh'), `${ledgerPath} should cite the action consequence refresh`);
    assert.ok(ledger.includes('2026-05-29 Topic quick-block clean-state parity fixture'), `${ledgerPath} should cite the Topic quick-block clean-state fixture`);
    assert.match(ledger.replace(/\s+/g, ' '), /Law and Crime Network/, `${ledgerPath} should keep the concrete action-risk example`);
    assert.match(ledger.replace(/\s+/g, ' '), /Kully B & Gussy G - Topic/, `${ledgerPath} should keep the concrete Topic quick-block example`);
  }
});

test('quick-block/block-menu source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['catalog feed affordance controls block', blocks.catalogFeedAffordanceControls, 10, 488],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared affordance compile block', blocks.sharedAffordanceCompile, 2, 126],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263],
    ['state manager valid setting keys block', blocks.stateValidKeys, 33, 1063],
    ['state manager external reload keys block', blocks.stateExternalReloadKeys, 41, 1604],
    ['quick block card selectors block', blocks.quickBlockSelectors, 44, 1519],
    ['quick block enabled gate block', blocks.quickBlockEnabledGate, 89, 2941],
    ['quick block setup lifecycle block', blocks.quickBlockSetupLifecycle, 320, 13892],
    ['normal menu injection gate block', blocks.normalMenuGate, 14, 411],
    ['fallback menu button creation block', blocks.fallbackButtonCreate, 31, 1533],
    ['fallback menu scan lifecycle block', blocks.fallbackScanLifecycle, 279, 9837],
    ['fallback popover open block', blocks.fallbackPopoverOpenStart, 104, 3500],
    ['fallback perform block action block', blocks.fallbackPerformBlock, 212, 9930]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.catalog, 'showQuickBlockButton'), 1);
  assert.equal(countLiteral(blocks.catalog, 'showBlockMenuItem'), 1);
  assert.equal(countLiteral(blocks.settingsShared, 'showQuickBlockButton'), 23);
  assert.equal(countLiteral(blocks.settingsShared, 'showBlockMenuItem'), 23);
  assert.equal(countLiteral(blocks.background, 'showQuickBlockButton'), 7);
  assert.equal(countLiteral(blocks.background, 'showBlockMenuItem'), 4);
  assert.equal(countLiteral(blocks.bridgeSettings, 'showQuickBlockButton'), 1);
  assert.equal(countLiteral(blocks.bridgeSettings, 'showBlockMenuItem'), 1);
  assert.equal(countLiteral(blocks.stateManager, 'showQuickBlockButton'), 7);
  assert.equal(countLiteral(blocks.stateManager, 'showBlockMenuItem'), 7);
  assert.equal(countLiteral(blocks.blockChannel, 'showQuickBlockButton'), 1);
  assert.equal(countLiteral(blocks.blockChannel, 'showBlockMenuItem'), 0);
  assert.equal(countLiteral(blocks.contentBridge, 'showQuickBlockButton'), 0);
  assert.equal(countLiteral(blocks.contentBridge, 'showBlockMenuItem'), 1);

  assert.match(doc, /content_controls_catalog total showQuickBlockButton tokens: 1/);
  assert.match(doc, /content_controls_catalog total showBlockMenuItem tokens: 1/);
  assert.match(doc, /settings_shared total showQuickBlockButton tokens: 23/);
  assert.match(doc, /settings_shared total showBlockMenuItem tokens: 23/);
  assert.match(doc, /background total showQuickBlockButton tokens: 7/);
  assert.match(doc, /background total showBlockMenuItem tokens: 4/);
  assert.match(doc, /block_channel total showBlockMenuItem tokens: 0/);
  assert.match(doc, /content_bridge total showQuickBlockButton tokens: 0/);
});

test('affordance settings are compiled and refreshed through split owners', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.catalogFeedAffordanceControls, /key: 'showQuickBlockButton'/);
  assert.match(blocks.catalogFeedAffordanceControls, /key: 'showBlockMenuItem'/);
  assert.match(blocks.sharedAffordanceCompile, /showQuickBlockButton: showQuickBlockButton !== false/);
  assert.match(blocks.sharedAffordanceCompile, /showBlockMenuItem: showBlockMenuItem !== false/);
  assert.match(blocks.bgBooleanPassThrough, /showQuickBlockButton = boolFromV4\('showQuickBlockButton', items\.showQuickBlockButton !== false\)/);
  assert.match(blocks.bgBooleanPassThrough, /showBlockMenuItem = boolFromV4\('showBlockMenuItem', items\.showBlockMenuItem !== false\)/);

  assert.doesNotMatch(blocks.bgRefreshKeys, /showQuickBlockButton/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /showBlockMenuItem/);
  assert.match(blocks.bridgeRefreshKeys, /showQuickBlockButton/);
  assert.match(blocks.bridgeRefreshKeys, /showBlockMenuItem/);
  assert.match(blocks.stateValidKeys, /showQuickBlockButton/);
  assert.match(blocks.stateValidKeys, /showBlockMenuItem/);
  assert.match(blocks.stateExternalReloadKeys, /showQuickBlockButton/);
  assert.match(blocks.stateExternalReloadKeys, /showBlockMenuItem/);
});

test('quick-block action gate exists but setup lifecycle work is broader than the gate', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.quickBlockEnabledGate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(blocks.quickBlockEnabledGate, /currentSettings\.enabled === false/);
  assert.match(blocks.quickBlockEnabledGate, /currentSettings\.listMode === 'whitelist'/);
  assert.match(blocks.quickBlockEnabledGate, /Quick-block is the entry point for creating the first channel rule/);
  assert.match(blocks.quickBlockEnabledGate, /Keep desktop work hover-lazy instead of disabling the affordance when lists are empty/);
  assert.equal(countLiteral(blocks.quickBlockEnabledGate, 'showBlockMenuItem'), 0);

  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'showQuickBlockButton'), 0);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'showBlockMenuItem'), 0);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'listMode'), 0);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'isQuickBlockEnabled'), 7);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'addEventListener'), 12);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'MutationObserver'), 1);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'setTimeout'), 3);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'setInterval'), 0);
  assert.equal(countLiteral(blocks.quickBlockSetupLifecycle, 'requestAnimationFrame'), 1);
  assert.equal((blocks.quickBlockSelectors.match(/'[^']+'/g) || []).length, 43);

  assert.match(blocks.blockChannel, /function buildQuickBlockContext\(videoCard\)/);
  assert.match(blocks.blockChannel, /FilterTube_prefetchCollaboratorsForCard\?\.\(videoCard, \{\s+timeoutMs: 1200,\s+reason: 'quick-block-action'\s+\}\)/);
  assert.match(blocks.blockChannel, /promoteChannelInfoFromCollaboratorSignals\(extractedBase, videoCard\)/);
  assert.match(blocks.blockChannel, /const collaborators = collectQuickBlockCollaborators\(\{ \.\.\.base, videoId \}, videoCard\)/);
  assert.match(blocks.blockChannel, /if \(collaborators\.length >= 2\)/);
  assert.match(blocks.blockChannel, /name: targets\.length === 2 \? 'Both Channels' : `All \$\{targets\.length\} Collaborators`/);
  assert.match(blocks.blockChannel, /const primary = collaborators\[0\] \|\| context\.base/);

  const getQuickBlockActionInfo = loadQuickBlockActionRuntime();
  const misclassifiedAndName = getQuickBlockActionInfo({
    videoId: 'VIDEORISK01',
    base: { name: 'Law and Crime Network', videoId: 'VIDEORISK01' },
    collaborators: [
      { name: 'Law', handle: '', id: '', customUrl: '' },
      { name: 'Crime Network', handle: '', id: '', customUrl: '' }
    ]
  });
  assert.deepEqual(plain(misclassifiedAndName), {
    channelInfo: {
      name: 'Both Channels',
      isBlockAllOption: true,
      allCollaborators: [
        { name: 'Law', handle: '', id: '', customUrl: '' },
        { name: 'Crime Network', handle: '', id: '', customUrl: '' }
      ],
      collaborationGroupId: 'group-fixed',
      videoId: 'VIDEORISK01'
    },
    attrs: {
      'data-collaboration-group-id': 'group-fixed',
      'data-is-block-all': 'true'
    }
  });

  assert.deepEqual(plain(getQuickBlockActionInfo({
    videoId: 'VIDEOSINGLE1',
    base: { name: 'Single Channel', videoId: 'VIDEOSINGLE1' },
    collaborators: []
  })), {
    channelInfo: { name: 'Single Channel', videoId: 'VIDEOSINGLE1' },
    attrs: {}
  });

  const sevenCollaborators = Array.from({ length: 7 }, (_, index) => ({ name: `Channel ${index + 1}` }));
  const cappedAction = plain(getQuickBlockActionInfo({
    videoId: 'VIDEOCAP001',
    collaborators: sevenCollaborators
  }));
  assert.equal(cappedAction.channelInfo.name, 'All 6 Collaborators');
  assert.equal(cappedAction.channelInfo.allCollaborators.length, 6);
  assert.deepEqual(cappedAction.channelInfo.allCollaborators.map((item) => item.name), [
    'Channel 1',
    'Channel 2',
    'Channel 3',
    'Channel 4',
    'Channel 5',
    'Channel 6'
  ]);
  assert.equal(getQuickBlockActionInfo(null), null);
});

test('primary menu and fallback menu action gates diverge today', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.normalMenuGate, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(blocks.normalMenuGate, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(blocks.normalMenuGate, /clearFilterTubeMenuItems\(dropdown\)/);
  assert.match(blocks.normalMenuGate, /clearMultiStepStateForDropdown\(dropdown\)/);

  for (const [label, block] of [
    ['fallback button create', blocks.fallbackButtonCreate],
    ['fallback scan lifecycle', blocks.fallbackScanLifecycle],
    ['fallback popover open', blocks.fallbackPopoverOpenStart],
    ['fallback perform block', blocks.fallbackPerformBlock]
  ]) {
    assert.equal(countLiteral(block, 'showBlockMenuItem'), 0, label);
    assert.equal(countLiteral(block, 'showQuickBlockButton'), 0, label);
    assert.equal(countLiteral(block, 'listMode'), 0, label);
  }

  assert.equal(countLiteral(blocks.fallbackButtonCreate, 'addEventListener'), 1);
  assert.equal(countLiteral(blocks.fallbackScanLifecycle, 'addEventListener'), 6);
  assert.equal(countLiteral(blocks.fallbackScanLifecycle, 'MutationObserver'), 1);
  assert.equal(countLiteral(blocks.fallbackScanLifecycle, 'setTimeout'), 4);
  assert.equal(countLiteral(blocks.fallbackScanLifecycle, 'setInterval'), 1);
  assert.equal(countLiteral(blocks.fallbackScanLifecycle, 'requestAnimationFrame'), 2);
  assert.equal((blocks.fallbackScanLifecycle.match(/'[^']+'/g) || []).length, 25);
});

test('fallback block action can hide rows refresh settings and rerun DOM fallback without a local menu gate', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.fallbackPerformBlock, /row\.style\.display = 'none'/);
  assert.match(blocks.fallbackPerformBlock, /row\.classList\.add\('filtertube-hidden'\)/);
  assert.match(blocks.fallbackPerformBlock, /row\.setAttribute\('data-filtertube-hidden', 'true'\)/);
  assert.match(blocks.fallbackPerformBlock, /addChannelDirectly\(/);
  assert.match(blocks.fallbackPerformBlock, /handleBlockChannelClick\(/);
  assert.match(blocks.fallbackPerformBlock, /requestSettingsFromBackground\(\)/);
  assert.match(blocks.fallbackPerformBlock, /applyDOMFallback\(null, \{ forceReprocess: true, preserveScroll: true \}\)/);
  assert.match(blocks.fallbackPerformBlock, /source: 'playlist_fallback_menu'/);
  assert.doesNotMatch(blocks.fallbackPerformBlock, /currentSettings\?\.showBlockMenuItem/);
  assert.doesNotMatch(blocks.fallbackPerformBlock, /currentSettings\?\.listMode/);
});

test('product runtime still lacks first-class quick-block/block-menu affordance authority symbols', () => {
  const doc = read(docPath);
  const source = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.match(doc, new RegExp(symbol));
    assert.doesNotMatch(source, new RegExp(symbol));
  }
});
