import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const matrixPath = 'docs/audit/FILTERTUBE_CROSS_FEATURE_AUTHORITY_MATRIX_2026-05-18.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const CROSS_FEATURE_READINESS_DOCS = [
  'docs/audit/FILTERTUBE_CODE_BURDEN_DECLUTTER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_CROSS_FEATURE_AUTHORITY_MATRIX_2026-05-18.md',
  'docs/audit/FILTERTUBE_FEATURE_RISK_MATRIX_2026-05-17.md',
  'docs/audit/FILTERTUBE_FEATURE_SOURCE_DEPENDENCY_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md',
  'docs/audit/FILTERTUBE_SUBAGENT_REVIEW_CONVERGENCE_2026-05-19.md',
  'docs/audit/FILTERTUBE_SYNTHETIC_EVENT_ACTION_REGISTER_2026-05-20.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function assertIncludesAll(text, values) {
  for (const value of values) {
    assert.ok(text.includes(value), `missing ${value}`);
  }
}

function lineOf(file, needle) {
  const lines = read(file).split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle}`);
  return index + 1;
}

function lineOfAfter(file, afterNeedle, needle) {
  const lines = read(file).split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes(afterNeedle));
  assert.ok(start >= 0, `${file} missing anchor ${afterNeedle}`);
  const index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle} after ${afterNeedle}`);
  return index + 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

const REQUIRED_AUTHORITY_FAMILIES = [
  'Endpoint authority',
  'JSON renderer authority',
  'DOM enforcement authority',
  'Affordance authority',
  'Identity authority',
  'Settings/mutation authority',
  'Static/release authority'
];

const REQUIRED_FEATURE_ROWS = [
  'Empty install and disabled mode',
  'Blocklist keyword filtering',
  'Blocklist channel filtering',
  'Whitelist mode',
  'Simultaneous allow/block future work',
  'Content filters',
  'Comments filtering',
  'End-screen and watch recommendations',
  'Player payloads',
  'Quick-cross button',
  'Native and fallback 3-dot menus',
  'Playlists/radio/mixes',
  'Shorts/reels',
  'Posts/community',
  'YouTube Kids surface',
  'Nanah/import/export/sync',
  'Release website and download claims'
];

const REQUIRED_SOURCE_FILES = [
  'js/seed.js',
  'js/filter_logic.js',
  'js/content/dom_fallback.js',
  'js/content/dom_extractors.js',
  'js/content/dom_helpers.js',
  'js/content_bridge.js',
  'js/content/block_channel.js',
  'js/content/menu.js',
  'js/shared/identity.js',
  'js/content/handle_resolver.js',
  'js/background.js',
  'js/settings_shared.js',
  'js/state_manager.js',
  'js/tab-view.js',
  'js/popup.js',
  'js/io_manager.js',
  'js/nanah_sync_adapter.js',
  'build.js',
  'data/release_notes.json'
];

test('cross-feature authority matrix covers every current high-level authority family and feature row', () => {
  const doc = read(matrixPath);

  assertIncludesAll(doc, REQUIRED_AUTHORITY_FAMILIES);
  assertIncludesAll(doc, REQUIRED_FEATURE_ROWS);
  assertIncludesAll(doc, [
    'source-backed owner file(s)',
    'current behavior fixture(s)',
    'false-hide/leak fixture(s)',
    'no-work/performance fixture(s)',
    'settings/import/sync fixture(s)',
    'release/public-claim fixture(s)'
  ]);
  assertReleaseHotPathCrossFeatureAddendum(doc);
  assertAmpersandTopicSingleChannelBoundary(doc);
  assertCrossFeatureConvergenceBoundary(doc);
});

function assertCrossFeatureConvergenceBoundary(doc) {
  assert.match(doc, /Cross-Feature Current-Source Convergence Boundary - 2026-05-31/);
  assert.match(doc, /cross-feature convergence rows: 10/);
  assert.match(doc, /authority families covered: 7/);
  assert.match(doc, /feature rows covered: 17/);
  assert.match(doc, /primary source files covered by this matrix: 19/);
  assert.match(doc, /implementation-ready cross-feature convergence rows: 0/);
  assert.match(doc, /first-class cross-feature runtime authority in product source: absent/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /cross-feature implementation approval: NO-GO/);
  assert.match(doc, /JSON-first first-class promotion: NO-GO/);
  assert.match(doc, /whitelist\/cache optimization approval: NO-GO/);
  assert.match(doc, /release\/public-claim use: NO-GO/);
  assert.match(doc, /ASCII flow:/);
  assert.match(doc, /Mermaid flow:/);

  for (const rowId of [
    'cross_feature_authority_family_inventory',
    'cross_feature_release_hot_path_boundary',
    'cross_feature_settings_json_dom_chain',
    'cross_feature_identity_collaborator_chain',
    'cross_feature_affordance_action_chain',
    'cross_feature_storage_cache_refresh_chain',
    'cross_feature_comments_watch_player_chain',
    'cross_feature_stats_engagement_claim_chain',
    'cross_feature_static_release_native_chain',
    'cross_feature_authority_absence_boundary'
  ]) {
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing cross-feature convergence row ${rowId}`);
  }

  assertIncludesAll(doc, [
    'js/shared/identity.js',
    'js/content/dom_extractors.js',
    'js/content/handle_resolver.js',
    'js/content/bridge_settings.js',
    'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_CONSUMER_JOIN_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
    'docs/audit/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]);

  const productSource = [
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/seed.js',
    'js/filter_logic.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/content/menu.js',
    'js/content_bridge.js',
    'js/content/bridge_settings.js',
    'js/shared/identity.js',
    'js/content/dom_extractors.js',
    'js/content/handle_resolver.js',
    'js/nanah_sync_adapter.js',
    'js/io_manager.js',
    'build.js'
  ].map(read).join('\n');

  for (const missingAuthority of [
    'crossFeatureRuntimeAuthority',
    'crossFeatureEffectBudget',
    'unifiedFeatureAuthority',
    'featureInteractionDecision',
    'releaseClaimAuthority'
  ]) {
    assert.ok(doc.includes(missingAuthority), `matrix missing absent authority ${missingAuthority}`);
    assert.doesNotMatch(productSource, new RegExp(`\\b${missingAuthority}\\b`));
  }
}

function assertReleaseHotPathCrossFeatureAddendum(doc) {
  assert.match(doc, /Release Hot-Path Cross-Feature Addendum - 2026-05-27/);
  assert.match(doc, /release cross-feature interaction rows: 5/);
  assert.match(doc, /release cross-feature source files covered: 6/);
  assert.match(doc, /central crossFeatureRuntimeAuthority in product source: absent/);
  assert.match(doc, /cross-feature behavior change approval from this addendum: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  for (const rowId of [
    'release_cross_visible_blocklist_to_runtime_filter',
    'release_cross_empty_blocklist_no_json_work',
    'release_cross_whitelist_pending_hide_budget',
    'release_cross_quick_block_menu_mode_boundary',
    'release_cross_topic_byline_identity_boundary'
  ]) {
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing cross-feature row ${rowId}`);
  }

  const pins = [
    ['js/background.js', 'const v4KeywordEntries = shouldUseKidsProfile', 'compiledSettings.filterKeywordsComments = compileKeywordEntries(v4KeywordEntries, entry => {'],
    ['js/content/bridge_settings.js', 'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {', 'refreshRuntimeObserversAfterSettingsUpdate();', 'applyDOMFallback(result.settings, { forceReprocess: forcePendingReprocess });'],
    ['js/seed.js', 'function shouldBypassYouTubeiNetworkResponse(dataName) {', 'return true;', 'seedDebugLog(`⏭️ Passing through ${dataName} before JSON parse (no active JSON work)`);'],
    ['js/injector.js', 'if (!hasNetworkJsonWork(currentSettings)) {', 'return;', "postLog('log', 'No active JSON work; cleared queued injector data');", 'function processDataWithFilterLogic(data, dataName) {'],
    ['js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {', '}, delayMs);', 'whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {'],
    ['js/content/block_channel.js', 'const isQuickBlockEnabled = () => {', 'return true;'],
    ['js/content/block_channel.js', 'const closeFilterTubeInjectedDropdownsOnOutsidePointer = (event) => {', 'keyCode: 27,'],
    ['js/content_bridge.js', "function parseCollaboratorNames(rawText = '', options = {}) {", 'if (!allowSeparatorSplit) {'],
    ['js/content_bridge.js', 'const parsedByline = parseCollaboratorNames(bylineText, {', 'const hasSignal = Boolean(']
  ];

  for (const [file, startNeedle, endNeedle, endAnchor = startNeedle, startAnchor = null] of pins) {
    const startLine = startAnchor ? lineOfAfter(file, startAnchor, startNeedle) : lineOf(file, startNeedle);
    const endLine = lineOfAfter(file, endAnchor, endNeedle);
    assert.ok(doc.includes(`\`${file}:${startLine}-${endLine}\``), `missing source pin ${file}:${startLine}-${endLine}`);
  }

  const background = read('js/background.js');
  const keywordCompile = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'if (v4KeywordEntries) {'
  );
  assert.ok(keywordCompile.indexOf('activeMain.keywords') < keywordCompile.indexOf('activeMain.blockedKeywords'));

  const bridgeSettings = read('js/content/bridge_settings.js');
  const storageRefresh = sliceBetween(
    bridgeSettings,
    'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {',
    'function handleStorageChanges(changes, area) {'
  );
  assert.ok(storageRefresh.indexOf('pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess || shouldForceReprocess;') < storageRefresh.indexOf('applyDOMFallback(result.settings, { forceReprocess: forcePendingReprocess });'));

  const seed = read('js/seed.js');
  const fetchBypass = sliceBetween(
    seed,
    'function shouldBypassYouTubeiNetworkResponse(dataName) {',
    'function shouldSkipEngineProcessing(data, dataName) {'
  );
  assert.match(fetchBypass, /if \(hasNetworkJsonWork\(cachedSettings\)\) return false;/);
  assert.match(fetchBypass, /return true;/);

  const contentBridge = read('js/content_bridge.js');
  const whitelistPending = sliceBetween(
    contentBridge,
    'function queueWhitelistPendingHide(mutations, delayMs = 40) {',
    'function applyWhitelistPendingHide(candidates) {'
  );
  assert.ok(whitelistPending.indexOf("if (currentSettings?.listMode !== 'whitelist') return;") < whitelistPending.indexOf('if (node.matches?.(VIDEO_CARD_SELECTORS)) return queueCandidate(node);'));

  const bylineWarmup = sliceBetween(
    contentBridge,
    'const parsedByline = parseCollaboratorNames(bylineText, {',
    'const hasSignal = Boolean('
  );
  assert.match(bylineWarmup, /allowSeparatorSplit: hasCollaboratorSeparatorEvidence\(videoCard, bylineText\)/);

  const productSource = [
    'js/background.js',
    'js/content/bridge_settings.js',
    'js/seed.js',
    'js/injector.js',
    'js/content_bridge.js',
    'js/content/block_channel.js'
  ].map(read).join('\n');
  assert.doesNotMatch(productSource, /\bcrossFeatureRuntimeAuthority\b/);
}

function assertAmpersandTopicSingleChannelBoundary(doc) {
  assert.match(doc, /Ampersand Topic Single-Channel Collaborator Boundary - 2026-05-30/);
  assert.match(doc, /ampersand Topic boundary rows: 6/);
  assert.match(doc, /literal `Kully B & Gussy G - Topic` without avatar stack\/two links\/N-more: single-channel/);
  assert.match(doc, /stale name-only ampersand Topic roster behavior: clear-or-reject-before-writer-menu-quick-block/);
  assert.match(doc, /true collaborator behavior changed by this addendum: no/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /collaborator JSON-first authority promotion: NO-GO/);
  assert.match(doc, /installed open-tab parity proof: still required/);
  assert.match(doc, /release\/public-claim use: NO-GO/);
  assert.match(doc, /ASCII flow:/);
  assert.match(doc, /Mermaid flow:/);

  for (const rowId of [
    'ampersand_topic_separator_evidence_gate',
    'ampersand_topic_name_only_writer_reject',
    'ampersand_topic_menu_single_channel_guard',
    'ampersand_topic_identity_normalize_guard',
    'ampersand_topic_quick_block_guard',
    'collaborator_signal_preservation'
  ]) {
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing ampersand Topic boundary row ${rowId}`);
  }

  const rangePin = (file, startNeedle, endNeedle, afterNeedle = startNeedle) => {
    const lines = read(file).split(/\r?\n/);
    const startIndex = lines.findIndex((line) => line.includes(startNeedle));
    assert.ok(startIndex >= 0, `${file} missing ${startNeedle}`);
    const afterIndex = lines.findIndex((line, index) => index >= startIndex && line.includes(afterNeedle));
    assert.ok(afterIndex >= 0, `${file} missing ${afterNeedle} after ${startNeedle}`);
    const endIndex = lines.findIndex((line, index) => index >= afterIndex && line.includes(endNeedle));
    assert.ok(endIndex >= 0, `${file} missing ${endNeedle} after ${afterNeedle}`);
    const startLine = startIndex + 1;
    const endLine = endIndex + 1;
    return `${file}:${startLine}-${endLine}`;
  };

  const expectedPins = [
    rangePin('js/content_bridge.js', "function parseCollaboratorNames(rawText = '', options = {}) {", 'if (!allowSeparatorSplit) {'),
    rangePin('js/content_bridge.js', 'function hasAttributedCollaboratorSignal(attributedContainer) {', 'return false;', 'return countDistinctChannelLinks(attributedContainer) >= 2;'),
    rangePin('js/content_bridge.js', 'function hasCollaboratorSeparatorEvidence(root, rawText = \'\') {', 'return false;'),
    rangePin('js/content_bridge.js', 'function getLiteralAmpersandTopicByline(videoCard) {', "return '';", 'for (const rawText of candidateTexts) {'),
    rangePin('js/content_bridge.js', 'function isAmpersandTopicNameOnlyCollaboratorState(videoCard, collaborators = []) {', 'normalizeCollaboratorLabelForComparison(topicByline);'),
    rangePin('js/content_bridge.js', "function rejectAmpersandTopicCollaboratorWrite(videoId = '', collaborators = [], candidateCards = []) {", 'return rejected;'),
    rangePin('js/content_bridge.js', 'function getResolvedCollaboratorsForCard(videoId, videoCard) {', 'return collaborators;'),
    rangePin('js/content_bridge.js', 'function renderFilterTubeMenuEntries({ dropdown, newMenuList, oldMenuList, channelInfo, videoCard, placeholder = false }) {', 'const ampersandTopicSingleChannelInfo = contentBridgeAmpersandTopicSingleChannelMenuGuard(channelInfo, videoCard);'),
    rangePin('js/content_bridge.js', 'function contentBridgeAmpersandTopicSingleChannelMenuGuard(channelInfo, videoCard) {', "videoId: videoId || channelInfo.videoId || ''"),
    rangePin('js/content_bridge.js', 'if (channelInfo.isCollaboration && isAmpersandTopicNameOnlyCollaboratorState(videoCard, channelInfo.allCollaborators || [])) {', 'collaborators: [],'),
    rangePin('js/content/block_channel.js', 'function collectQuickBlockCollaborators(base = {}, videoCard = null) {', 'if (skipAmpersandTopicNameOnlyRoster(collaborators)) return;'),
    rangePin('js/content_bridge.js', 'function getWatchLikeCollaborationWarmup(videoCard) {', 'return { collaborators: [], expectedCount: 0 };', 'for (const rawText of candidateTexts) {'),
    rangePin('js/content_bridge.js', 'function promoteYtmWatchRowIdentityFromCollaboratorMetadata(channelInfo, videoCard) {', 'clearAmpersandTopicCollaboratorState(videoCard, videoId);'),
    rangePin('js/content_bridge.js', 'const parsedByline = parseCollaboratorNames(bylineText, {', 'isYtmWatchLikeCard', 'parsedByline.names.length > 0 ||')
  ];

  for (const sourcePin of expectedPins) {
    assert.ok(doc.includes(`\`${sourcePin}\``), `missing ampersand Topic source pin ${sourcePin}`);
  }

  const contentBridge = read('js/content_bridge.js');
  const parserBlock = sliceBetween(
    contentBridge,
    "function parseCollaboratorNames(rawText = '', options = {}) {",
    'function hasAttributedCollaboratorSignal(attributedContainer) {'
  );
  assert.match(parserBlock, /const tokens = normalizedText\.split\(\/\\s\*\(\?:,\|\\band\\b\)\\s\*\/i\);/);
  assert.doesNotMatch(parserBlock, /split\(\/\\s\*\(\?:,\|&\|\\band\\b\)\\s\*\/i\)/);

  const topicBylineBlock = sliceBetween(
    contentBridge,
    'function getLiteralAmpersandTopicByline(videoCard) {',
    'function isAmpersandTopicNameOnlyCollaboratorState(videoCard, collaborators = []) {'
  );
  assert.match(topicBylineBlock, /\/\\s&\\s\//);
  assert.match(topicBylineBlock, /\/\\s-\\sTopic\$\/i/);
  assert.ok(topicBylineBlock.indexOf('hasCollaboratorSeparatorEvidence(videoCard, normalized)') < topicBylineBlock.indexOf('return normalized;'));

  const writerRejectBlock = sliceBetween(
    contentBridge,
    "function rejectAmpersandTopicCollaboratorWrite(videoId = '', collaborators = [], candidateCards = []) {",
    'function getResolvedCollaboratorsForCard(videoId, videoCard) {'
  );
  assert.ok(writerRejectBlock.indexOf('isAmpersandTopicNameOnlyCollaboratorState(card, sanitized)') < writerRejectBlock.indexOf('clearAmpersandTopicCollaboratorState(card, cardVideoId);'));

  const menuGuardBlock = sliceBetween(
    contentBridge,
    'function contentBridgeAmpersandTopicSingleChannelMenuGuard(channelInfo, videoCard) {',
    "window.addEventListener('message', handleMainWorldMessages, false);"
  );
  assert.match(menuGuardBlock, /isCollaboration: false/);
  assert.match(menuGuardBlock, /allCollaborators: \[\]/);
  assert.match(menuGuardBlock, /clearAmpersandTopicCollaboratorState\(videoCard, videoId\)/);

  const quickBlock = read('js/content/block_channel.js');
  const quickBlockGuard = sliceBetween(
    quickBlock,
    'function collectQuickBlockCollaborators(base = {}, videoCard = null) {',
    'function buildQuickBlockFallbackMetadata'
  );
  assert.ok(quickBlockGuard.indexOf('skipAmpersandTopicNameOnlyRoster') < quickBlockGuard.indexOf('pushCollaboratorList(base.allCollaborators);'));
  assert.ok(quickBlockGuard.indexOf('if (skipAmpersandTopicNameOnlyRoster(collaborators)) return;') < quickBlockGuard.indexOf('candidates.push(...collaborators.filter(Boolean));'));
}

test('cross-feature authority matrix only cites existing source files for primary authority rows', () => {
  const doc = read(matrixPath);

  for (const file of REQUIRED_SOURCE_FILES) {
    assert.ok(doc.includes(file), `matrix does not cite ${file}`);
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `cited file missing on disk: ${file}`);
  }
});

test('cross-feature authority matrix is backed by current source tokens for risky feature paths', () => {
  const sources = {
    seed: read('js/seed.js'),
    filter: read('js/filter_logic.js'),
    bridge: read('js/content_bridge.js'),
    block: read('js/content/block_channel.js'),
    domFallback: read('js/content/dom_fallback.js'),
    background: read('js/background.js'),
    state: read('js/state_manager.js'),
    settingsShared: read('js/settings_shared.js'),
    nanah: read('js/nanah_sync_adapter.js'),
    build: read('build.js'),
    jsonPaths: read('docs/json_paths_encyclopedia.md')
  };

  assert.match(sources.seed, /setupFetchInterception/);
  assert.match(sources.seed, /setupXhrInterception/);
  assert.match(sources.seed, /hideAllComments/);
  assert.match(sources.filter, /endScreenVideoRenderer/);
  assert.match(sources.filter, /compactPlaylistRenderer/);
  assert.match(sources.filter, /radioRenderer/);
  assert.match(sources.filter, /shortsLockupViewModel/);
  assert.match(sources.filter, /reelItemRenderer/);
  assert.match(sources.filter, /backstagePostRenderer/);
  assert.doesNotMatch(sources.filter, /\bpostRenderer\s*:/);
  assert.doesNotMatch(sources.filter, /\bsharedPostRenderer\s*:/);
  assert.match(sources.jsonPaths, /### `sharedPostRenderer`/);
  assert.match(sources.jsonPaths, /continuationItems\[i\]\.postRenderer/);
  assert.match(sources.bridge, /whitelistPendingRefreshState/);
  assert.match(sources.bridge, /FilterTube_UpdateVideoChannelMap/);
  assert.match(sources.bridge, /injectFilterTubeMenuItem/);
  assert.match(sources.block, /setupQuickBlockObserver/);
  assert.match(sources.block, /setupMenuObserver/);
  assert.match(sources.domFallback, /function applyDOMFallback/);
  assert.match(sources.domFallback, /hasActiveDOMFallbackWork/);
  assert.match(sources.background, /function getCompiledSettings/);
  assert.match(sources.background, /FilterTube_SetListMode/);
  assert.match(sources.state, /saveSettings/);
  assert.match(sources.settingsShared, /ftProfilesV4/);
  assert.match(sources.nanah, /FilterTubeNanahAdapter/);
  assert.match(sources.build, /createGitHubRelease/);
});

test('cross-feature readiness docs carry the method proof gap blocker', () => {
  for (const docPath of CROSS_FEATURE_READINESS_DOCS) {
    const doc = read(docPath);

    assert.ok(doc.includes('## Method Semantic Proof Gap Boundary'), `${docPath} missing method proof gap section`);
    assert.ok(doc.includes(methodGapPath), `${docPath} missing method proof gap source path`);
    assert.match(doc, /method semantic proof gap files covered: 69/, `${docPath} missing file count`);
    assert.match(doc, /method semantic proof gap lexical callables covered: 5789/, `${docPath} missing callable count`);
    assert.match(doc, /files with complete per-callable semantic proof: 0/, `${docPath} missing complete proof count`);
    assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5789/, `${docPath} missing required proof count`);
    assert.match(doc, /affected callable semantic proof: NO-GO/, `${docPath} missing callable NO-GO`);
    assert.match(doc, /runtime behavior changed: no/, `${docPath} missing runtime unchanged boundary`);
    assert.match(doc, /do not approve runtime optimization/, `${docPath} missing audit-only approval warning`);
    assert.match(doc, /JSON-first behavior/, `${docPath} missing JSON-first blocker`);
    assert.match(doc, /whitelist behavior changes/, `${docPath} missing whitelist blocker`);
  }
});
