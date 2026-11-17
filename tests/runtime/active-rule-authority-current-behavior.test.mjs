import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function assertPostReleaseListModeAliasSnapshot(doc) {
  const background = source('js/background.js');
  const settingsShared = source('js/settings_shared.js');
  const setMode = sliceBetween(
    background,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );
  const keywordAlias = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'compiledSettings.filterKeywords = compileKeywordEntries'
  );
  const channelAlias = sliceBetween(
    background,
    'const storedChannels = shouldUseKidsProfile',
    'compiledSettings.filterChannels = compiledChannels;'
  );
  const sharedSave = sliceBetween(
    settingsShared,
    'profiles[activeId] = {',
    'kids: {'
  );

  assert.match(doc, /List-Mode Revalidation - 2026-10-18/);
  assert.match(doc, /copyBlocklist:false preserves both saved lists/);
  assert.match(doc, /copyBlocklist:true merges deduplicated copies into the allowlist/);
  assert.match(doc, /This revalidation does not establish a shared mutation authority/);
  assert.equal(countLiteral(setMode, 'shouldCopyBlocklist'), 3);
  assert.match(setMode, /if \(requestedMode === 'whitelist' && shouldCopyBlocklist\)/);
  assert.doesNotMatch(setMode, /mergeAndClearBlocklistIntoWhitelist/);
  assert.ok(keywordAlias.indexOf('activeMain.keywords') < keywordAlias.indexOf('activeMain.blockedKeywords'));
  assert.ok(channelAlias.indexOf('activeMain.channels') < channelAlias.indexOf('activeMain.blockedChannels'));
  assert.match(sharedSave, /channels: sanitizedChannels/);
  assert.match(sharedSave, /keywords: sanitizedKeywords/);
  assert.match(sharedSave, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
  assert.match(sharedSave, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
}

function assertActiveBlocklistObserverBudgetAddendum(doc) {
  const seed = source('js/seed.js');
  const injector = source('js/injector.js');
  const domFallback = source('js/content/dom_fallback.js');
  const blockChannel = source('js/content/block_channel.js');
  const contentBridge = source('js/content_bridge.js');
  const bridgeSettings = source('js/content/bridge_settings.js');
  const background = source('js/background.js');
  const settingsShared = source('js/settings_shared.js');

  const seedJsonGate = sliceBetween(
    seed,
    'function hasNetworkJsonWork(settings) {',
    'function shouldCaptureRawSnapshot() {'
  );
  const injectorJsonGate = sliceBetween(
    injector,
    'function hasNetworkJsonWork(settings) {',
    'const HANDLE_TERMINATOR_REGEX'
  );
  const domPredicate = sliceBetween(
    domFallback,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );
  const quickGate = sliceBetween(
    blockChannel,
    'const isQuickBlockEnabled = () => {',
    'function ensureQuickBlockStyles()'
  );
  const quickRuleContext = sliceBetween(
    blockChannel,
    'function hasActiveQuickBlockRuleContext(settings) {',
    'function shouldEagerQuickBlockSweep() {'
  );
  const quickSetup = sliceBetween(
    blockChannel,
    'function setupQuickBlockObserver() {',
    '// Initialize menu observer after a delay'
  );
  const nativeMenuGate = sliceBetween(
    contentBridge,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );
  const dropdownGate = sliceBetween(
    blockChannel,
    'async function handleDropdownAppearedInternal(dropdown) {',
    'blockChannelDebugLog(\'FilterTube: Dropdown appeared, finding video card...\');'
  );
  const storageRefresh = sliceBetween(
    bridgeSettings,
    'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {',
    'function handleStorageChanges(changes, area) {'
  );
  const keywordAlias = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'compiledSettings.filterKeywords = compileKeywordEntries'
  );
  const channelAlias = sliceBetween(
    background,
    'const storedChannels = shouldUseKidsProfile',
    'compiledSettings.filterChannels = compiledChannels;'
  );
  const sharedSave = sliceBetween(
    settingsShared,
    'profiles[activeId] = {',
    'kids: {'
  );

  assert.match(doc, /Active Blocklist Observer Budget Addendum - 2026-05-27/);
  assert.match(doc, /active blocklist observer budget proof slices: 7/);
  assert.match(doc, /active desktop blocklist source proof: PARTIAL/);
  assert.match(doc, /active blocklist observer budget authority: NO-GO/);
  assert.match(doc, /quick\/menu shared active-state authority: NO-GO/);
  assert.match(doc, /active blocklist live trace authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /\| JSON transport admission \| `js\/seed\.js:234-238`, `js\/injector\.js:185-188` \|/);
  assert.match(doc, /\| DOM fallback active predicate \| `js\/content\/dom_fallback\.js:1933-1995`, `js\/content\/dom_fallback\.js:2075-2082` \|/);
  assert.match(doc, /\| Quick-block lifecycle gate \| `js\/content\/block_channel\.js:353-365`, `js\/content\/block_channel\.js:1205-1222`, `js\/content\/block_channel\.js:1291-1293`, `js\/content\/block_channel\.js:1979-2028` \|/);
  assert.match(doc, /\| Quick-block rule-context helper \| `js\/content\/block_channel\.js:1224-1285` \|/);
  assert.match(doc, /\| Native menu action gate \| `js\/content_bridge\.js:10517-10498`, `js\/content\/block_channel\.js:2913-2921` \|/);
  assert.match(doc, /\| Storage force-reprocess coalescing \| `js\/content\/bridge_settings\.js:1019-1049`, `js\/content\/bridge_settings\.js:1051-1109` \|/);
  assert.match(doc, /\| Main blocklist canonical compile \| `js\/background\.js:2057-2066`, `js\/background\.js:2214-2224`, `js\/settings_shared\.js:922-927` \|/);

  assert.match(seedJsonGate, /if \(!settings \|\| settings\.enabled === false\) return false;/);
  assert.match(seedJsonGate, /if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(seedJsonGate, /return hasEnabledContentFilters\(settings\) \|\| hasActiveJsonFilterRules\(settings\);/);
  assert.match(injectorJsonGate, /return hasEnabledContentFilters\(settings\) \|\| hasActiveJsonFilterRules\(settings\);/);
  assert.match(domPredicate, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\);/);
  assert.match(quickGate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(quickGate, /currentSettings\.listMode === 'whitelist'/);
  assert.match(quickRuleContext, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\);/);
  assert.match(quickSetup, /if \(!isQuickBlockEnabled\(\)\) return false;/);
  assert.ok(
    quickSetup.indexOf('if (!isQuickBlockEnabled()) return false;') < quickSetup.indexOf('ensureQuickBlockStyles()'),
    'quick-block setup must gate before installing styles/listeners'
  );
  assert.match(nativeMenuGate, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(nativeMenuGate, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(dropdownGate, /if \(isWhitelistModeActive\(\)\) \{/);
  assert.match(storageRefresh, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;/);
  assert.match(storageRefresh, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);
  assert.ok(keywordAlias.indexOf('activeMain.keywords') < keywordAlias.indexOf('activeMain.blockedKeywords'));
  assert.ok(channelAlias.indexOf('activeMain.channels') < channelAlias.indexOf('activeMain.blockedChannels'));
  assert.match(sharedSave, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
  assert.match(sharedSave, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
}

test('active-rule authority audit documents every split active predicate family', () => {
  const doc = source('docs/audit/FILTERTUBE_ACTIVE_RULE_AUTHORITY_AUDIT_2026-05-18.md');

  for (const phrase of [
    'Seed JSON processing',
    'DOM fallback',
    'DOM fallback lifecycle',
    'Quick block',
    'Normal 3-dot menu',
    'Fallback 3-dot menu',
    'Settings compile',
    'Settings invalidation',
    'List-mode transition',
    'V4 list aliases',
    'compiledRuleState',
    'Empty blocklist install with quick-block/menu disabled'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assertPostReleaseListModeAliasSnapshot(doc);
  assertActiveBlocklistObserverBudgetAddendum(doc);
});

test('seed active predicate now centralizes JSON-active helper checks', () => {
  const text = source('js/seed.js');
  const helpers = sliceBetween(
    text,
    'function hasEnabledContentFilters(settings) {',
    'function shouldCaptureRawSnapshot() {'
  );
  const block = sliceBetween(
    text,
    'function shouldSkipEngineProcessing(data, dataName) {',
    'function processWithEngine(data, dataName) {'
  );

  assert.match(helpers, /function hasEnabledContentFilters\(settings\) \{/);
  assert.match(helpers, /settings\.contentFilters\.duration\?\.enabled/);
  assert.match(helpers, /settings\.contentFilters\.uploadDate\?\.enabled/);
  assert.match(helpers, /settings\.contentFilters\.uppercase\?\.enabled/);
  assert.match(helpers, /function hasSelectedCategoryFilters\(settings\) \{/);
  assert.match(helpers, /hasSelectedCategoryFilters\(settings\)/);
  assert.match(block, /const activeContentFilters = hasEnabledContentFilters\(cachedSettings\);/);
  assert.match(block, /const activeJsonFilterRules = hasActiveJsonFilterRules\(cachedSettings\);/);
  assert.match(block, /const isOnHomeFeed = path === '\/' && !isMobileInterface/);
  assert.doesNotMatch(block, /cachedSettings\.contentFilters\.duration\?\.enabled/);
  assert.doesNotMatch(block, /minMinutes/);
  assert.doesNotMatch(block, /fromDate/);
});

test('DOM fallback active predicate validates selected categories but still lacks one compiled active-state report', () => {
  const text = source('js/content/dom_fallback.js');
  const predicate = sliceBetween(
    text,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );
  const categoryCardLogic = sliceBetween(
    text,
    'let hideByCategory = false;',
    'const alreadyProcessed = element.hasAttribute'
  );

  assert.match(predicate, /if \(settings\.enabled === false\) return false/);
  assert.match(predicate, /if \(listMode === 'whitelist'\) return true/);
  assert.match(predicate, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(predicate, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(predicate, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\);/);
  assert.match(categoryCardLogic, /if \(enabled && selected\.length > 0\) \{/);
});

test('quick block lifecycle is now gated before listeners are installed', () => {
  const text = source('js/content/block_channel.js');
  const enabledBlock = sliceBetween(
    text,
    'const isQuickBlockEnabled = () => {',
    'function ensureQuickBlockStyles()'
  );
  const setupBlock = sliceBetween(
    text,
    'function setupQuickBlockObserver() {',
    '// Initialize menu observer after a delay'
  );

  assert.match(enabledBlock, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(enabledBlock, /currentSettings\.enabled === false/);
  assert.match(enabledBlock, /currentSettings\.listMode === 'whitelist'/);
  assert.match(enabledBlock, /Quick-block is the entry point for creating the first channel rule/);
  assert.match(setupBlock, /if \(!isQuickBlockEnabled\(\)\) return false;/);
  assert.match(setupBlock, /ensureQuickBlockStyles\(\)/);
  assert.match(setupBlock, /document\.addEventListener\('focusin'/);
  assert.match(setupBlock, /window\.addEventListener\('resize'/);
  assert.ok(
    setupBlock.indexOf('if (!isQuickBlockEnabled()) return false;') < setupBlock.indexOf('ensureQuickBlockStyles()'),
    'quick-block setup must check enabled state before installing styles/listeners'
  );
});

test('normal and fallback menu surfaces have explicit action and lifecycle gates', () => {
  const text = source('js/content_bridge.js');
  const normalMenu = sliceBetween(
    text,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );
  const fallbackScan = sliceBetween(
    text,
    'const scan = (root = document) => {',
    'let scanQueued = false;'
  );
  const fallbackButton = sliceBetween(
    text,
    'const createFallbackButton = (card, surface) => {',
    'const ensureFallbackButtonForCard = (card, debug = null) => {'
  );

  assert.match(normalMenu, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(normalMenu, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(text, /function shouldInstallFallbackMenuButtons\(\) \{/);
  assert.match(fallbackScan, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.doesNotMatch(fallbackScan, /showBlockMenuItem/);
  assert.doesNotMatch(fallbackScan, /listMode/);
  assert.match(fallbackButton, /openFilterTubePlaylistFallbackPopover\(btn, card\)/);
  assert.doesNotMatch(fallbackButton, /showBlockMenuItem/);
  assert.doesNotMatch(fallbackButton, /listMode/);
});

test('settings compile currently passes raw content and category objects without a compiled active-state report', () => {
  const text = source('js/background.js');
  const compiler = sliceBetween(
    text,
    'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false)',
    'function shouldShowUpdateRefreshPrompt'
  );
  const contentCategoryBlock = sliceBetween(
    compiler,
    'const profileContentFilters = (() => {',
    'console.log(`FilterTube Background: Compiled'
  );

  assert.match(contentCategoryBlock, /compiledSettings\.contentFilters = profileContentFilters \|\| legacyContentFilters \|\| \{/);
  assert.match(contentCategoryBlock, /compiledSettings\.categoryFilters = profileCategoryFilters \|\| legacyCategoryFilters \|\| \{/);
  assert.doesNotMatch(contentCategoryBlock, /compiledRuleState/);
  assert.doesNotMatch(contentCategoryBlock, /hasValidDurationRule/);
  assert.doesNotMatch(contentCategoryBlock, /hasValidCategoryRule/);
  assert.match(compiler, /compiledSettingsCache\[targetProfile\] = compiledSettings/);
});

test('list-mode and alias behavior prefers canonical Main keyword and channel rows', () => {
  const background = source('js/background.js');
  const settingsShared = source('js/settings_shared.js');
  const setMode = sliceBetween(
    background,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );
  const keywordAlias = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'compiledSettings.filterKeywords = compileKeywordEntries'
  );
  const channelAlias = sliceBetween(
    background,
    'const storedChannels = shouldUseKidsProfile',
    'compiledSettings.filterChannels = compiledChannels;'
  );
  const sharedSave = sliceBetween(
    settingsShared,
    'profiles[activeId] = {',
    'kids: {'
  );

  assert.match(setMode, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(setMode, /if \(requestedMode === 'whitelist' && shouldCopyBlocklist\) \{/);
  assert.doesNotMatch(setMode, /mergeAndClearBlocklistIntoWhitelist/);
  assert.match(keywordAlias, /Array\.isArray\(activeMain\.keywords\)/);
  assert.match(keywordAlias, /Array\.isArray\(activeMain\.blockedKeywords\)/);
  assert.ok(keywordAlias.indexOf('activeMain.keywords') < keywordAlias.indexOf('activeMain.blockedKeywords'));
  assert.match(channelAlias, /Array\.isArray\(activeMain\.blockedChannels\)/);
  assert.match(channelAlias, /Array\.isArray\(activeMain\.channels\)/);
  assert.ok(channelAlias.indexOf('activeMain.channels') < channelAlias.indexOf('activeMain.blockedChannels'));
  assert.match(sharedSave, /channels: sanitizedChannels/);
  assert.match(sharedSave, /keywords: sanitizedKeywords/);
  assert.match(settingsShared, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
  assert.match(settingsShared, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
});

// Execute the actual message-action branch and actual PIN authorization helpers.
async function setListModeFixture(profileType, copyBlocklist, { locked = false } = {}) {
  const background = source('js/background.js');
  const branch = sliceBetween(background,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')");
  const blocked = { channels: [{ id: 'UCblocked', name: 'Blocked' }], keywords: [{ word: 'blocked' }] };
  const allowed = { whitelistChannels: [{ id: 'UCallowed', name: 'Allowed' }], whitelistKeywords: [{ word: 'allowed' }] };
  const profile = {
    name: 'Parent', type: 'parent', settings: {},
    main: { mode: 'blocklist', ...blocked, ...allowed },
    kids: { mode: 'blocklist', blockedChannels: blocked.channels, blockedKeywords: blocked.keywords, ...allowed },
    ...(locked ? { security: { masterPinVerifier: { salt: 'salt', hash: 'hash' } } } : {})
  };
  const root = { schemaVersion: 4, activeProfileId: 'parent', profiles: { parent: profile } };
  const writes = [];
  let resolveResponse;
  const response = new Promise(resolve => { resolveResponse = resolve; });
  const context = vm.createContext({
    console, Date, Map, Set, action: 'FilterTube_SetListMode', DEFAULT_PROFILE_ID: 'parent', FT_PROFILES_V4_KEY: 'ftProfilesV4',
    sessionPinCache: new Map(), request: { mode: 'whitelist', profileType, copyBlocklist }, sender: {},
    sendResponse: resolveResponse, isTrustedUiSender: () => true,
    getActiveSelfControlSession: async () => null,
    // No study holds the profile here (study-rule-loosening.test.mjs covers the refusal).
    studyLooseningRefusal: async () => null,
    storageGet: async () => ({ ftProfilesV4: structuredClone(root) }),
    isValidProfilesV4: value => value?.schemaVersion === 4,
    compiledSettingsCache: { main: {}, kids: {} }, scheduleAutoBackupInBackground() {},
    browserAPI: { storage: { local: { async set(value) { writes.push(structuredClone(value)); } } }, tabs: { query(_, callback) { callback([]); } } }
  });
  for (const name of ['safeObject', 'safeArray', 'normalizeString', 'extractPinVerifierFromProfilesV4', 'isSessionPinCacheEntryFresh', 'isProfileSessionAuthorized']) {
    const start = background.indexOf(`function ${name}(`);
    const end = background.indexOf('\n}', start) + 2;
    assert.ok(start >= 0 && end > start, `actual helper ${name}`);
    vm.runInContext(background.slice(start, end), context);
  }
  vm.runInContext(`(function(){ if(false){ ${branch} } })()`, context);
  return { result: await response, writes, root };
}

for (const profileType of ['main', 'kids']) {
  for (const copy of [false, true]) {
    test(`actual ${profileType} mode transition copies only on opt-in (${copy}) and retains block rules`, async () => {
      const { result, writes, root } = await setListModeFixture(profileType, copy);
      assert.equal(result.ok, true);
      assert.equal(result.copiedBlocklist, copy);
      assert.equal(writes.length, 1);
      const saved = writes[0].ftProfilesV4.profiles.parent;
      const scope = saved[profileType];
      assert.equal(scope.mode, 'whitelist');
      assert.deepEqual(scope[profileType === 'main' ? 'channels' : 'blockedChannels'], root.profiles.parent[profileType][profileType === 'main' ? 'channels' : 'blockedChannels']);
      assert.deepEqual(scope[profileType === 'main' ? 'keywords' : 'blockedKeywords'], root.profiles.parent[profileType][profileType === 'main' ? 'keywords' : 'blockedKeywords']);
      assert.equal(scope.whitelistChannels.length, copy ? 2 : 1);
      assert.equal(scope.whitelistKeywords.length, copy ? 2 : 1);
      assert.equal(scope.whitelistChannels[0].id, 'UCallowed');
      if (copy) assert.equal(scope.whitelistChannels[1].modeBootstrapCopy, true);
      assert.deepEqual(saved[profileType === 'main' ? 'kids' : 'main'], root.profiles.parent[profileType === 'main' ? 'kids' : 'main']);
      if (profileType === 'main') assert.deepEqual(writes[0].filterChannels, root.profiles.parent.main.channels);
    });
  }
}
test('actual mode transition still rejects a locked profile without writing', async () => {
  const { result, writes } = await setListModeFixture('main', true, { locked: true });
  assert.equal(result.errorCode, 'profile_locked');
  assert.equal(writes.length, 0);
});
