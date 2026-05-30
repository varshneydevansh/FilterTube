import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
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

function lineOfAfterSequence(file, needles) {
  const lines = read(file).split(/\r?\n/);
  let start = 0;
  let foundIndex = -1;
  for (const needle of needles) {
    foundIndex = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
    assert.ok(foundIndex >= 0, `${file} missing sequence needle ${needle}`);
    start = foundIndex + 1;
  }
  return foundIndex + 1;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function videoRenderer(overrides = {}) {
  return {
    videoRenderer: {
      videoId: 'modeeffect01',
      title: { runs: [{ text: 'minecraft building tutorial' }] },
      shortBylineText: {
        runs: [{
          text: 'Trusted Blocks',
          navigationEndpoint: {
            browseEndpoint: {
              browseId: 'UC2222222222222222222222',
              canonicalBaseUrl: '/@trustedblocks'
            }
          }
        }]
      },
      ...overrides
    }
  };
}

function commentRenderer() {
  return {
    commentThreadRenderer: {
      comment: {
        commentRenderer: {
          commentId: 'comment-mode-effect',
          contentText: { runs: [{ text: 'spider comment text' }] },
          authorText: { simpleText: 'Comment Author' },
          authorEndpoint: {
            browseEndpoint: {
              browseId: 'UC3333333333333333333333',
              canonicalBaseUrl: '/@commentauthor'
            }
          }
        }
      }
    }
  };
}

function runEngine(contents, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData({ contents }, settings, 'settings-mode-source-effect');
}

test('settings mode source/effect doc is audit-only and connects source to allowed effect', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Status: audit-only proof',
    'Runtime behavior is unchanged',
    'where information can come from',
    'allowed to do',
    'source selection: canonical rows, legacy aliases, whitelist rows',
    'effect semantics: block matching content, allow matching content',
    'Empty blocklist and empty whitelist have opposite meanings',
    'Release Hot-Path Settings-Mode Addendum - 2026-05-27',
    'release settings-mode semantic rows: 9',
    'unified settingsModeSourceEffectAuthority in product source: absent',
    'settings-mode rewrite approval from this addendum: NO-GO',
    'List-Mode Owner Flow Addendum - 2026-05-27',
    'list-mode owner flow rows: 8',
    'ASCII list-mode owner flow diagram: present',
    'Mermaid list-mode owner flow diagram: present',
    'settings-mode owner-flow source proof: PARTIAL',
    'settings-mode optimization approval from owner flow: NO-GO',
    'Settings/Profile/List-Mode Convergence Boundary - 2026-05-30',
    'settings/profile/list-mode convergence rows: 10',
    'implementation-ready settings/profile/list-mode convergence rows: 0',
    'settingsModeSourceEffectAuthority product source symbol: absent',
    'settingsSourceEffectDecision product source symbol: absent',
    'modeSurfaceEffectAuthority product source symbol: absent',
    'settings-mode implementation approval: NO-GO',
    'settings-mode simultaneous allow/block approval: NO-GO',
    'settings-mode refresh pruning approval: NO-GO',
    'settingsModeSourceEffectAuthority'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase: ${phrase}`);
  }

  assertReleaseHotPathSettingsModeAddendum(doc);
  assertListModeOwnerFlowAddendum(doc);
  assertSettingsProfileListModeConvergenceBoundary(doc);
});

function assertReleaseHotPathSettingsModeAddendum(doc) {
  const sourceRows = [
    [
      'release_settings_main_keyword_alias_precedence',
      'js/background.js',
      'const v4KeywordEntries = shouldUseKidsProfile',
      ': (Array.isArray(activeMain.blockedKeywords) ? activeMain.blockedKeywords : null);'
    ],
    [
      'release_settings_main_save_alias_mirror',
      'js/settings_shared.js',
      'const existingMain = safeObject(activeProfile.main);',
      'nextMainProfile.blockedKeywords = sanitizedKeywords;'
    ],
    [
      'release_settings_seed_json_no_work_gate',
      'js/seed.js',
      'function hasNetworkJsonWork(settings) {',
      'return true;',
      'seedDebugLog(`⏭️ Passing through ${dataName} before JSON parse (no active JSON work)`);'
    ],
    [
      'release_settings_injector_json_no_work_gate',
      'js/injector.js',
      'function hasNetworkJsonWork(settings) {',
      'return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);'
    ],
    [
      'release_settings_main_world_runtime_gate',
      'js/content_bridge.js',
      'function needsMainWorldRuntimeWork(settings) {',
      'return hasBridgeEnabledContentFilters(settings) || hasBridgeActiveJsonFilterRules(settings);'
    ],
    [
      'release_settings_storage_force_reprocess_upgrade',
      'js/content/bridge_settings.js',
      'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {',
      'applyDOMFallback(result.settings, { forceReprocess: forcePendingReprocess });',
      'const forcePendingReprocess = pendingStorageRefreshForceReprocess === true;'
    ],
    [
      'release_settings_whitelist_pending_admission_gate',
      'js/content_bridge.js',
      'function queueWhitelistPendingHide(mutations, delayMs = 40) {',
      '}, delayMs);',
      'whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {'
    ],
    [
      'release_settings_quick_block_blocklist_only',
      'js/content/block_channel.js',
      'const isQuickBlockEnabled = () => {',
      'return true;',
      '// Quick-block is the entry point for creating the first channel rule.'
    ],
    [
      'release_settings_dom_fallback_whitelist_active',
      'js/content/dom_fallback.js',
      'function hasActiveDOMFallbackWork(settings) {',
      "if (listMode === 'whitelist') return true;"
    ]
  ];

  for (const [rowId, file, startNeedle, endNeedle, endAnchor = startNeedle] of sourceRows) {
    const startLine = lineOf(file, startNeedle);
    const endLine = lineOfAfter(file, endAnchor, endNeedle);
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing settings-mode row ${rowId}`);
    assert.ok(doc.includes(`\`${file}:${startLine}-${endLine}\``), `missing source pin for ${rowId}`);
  }

  const seedGate = sliceBetween(
    read('js/seed.js'),
    'function hasNetworkJsonWork(settings) {',
    'function shouldCaptureRawSnapshot()'
  );
  assert.match(seedGate, /if \(!settings \|\| settings\.enabled === false\) return false;/);
  assert.match(seedGate, /if \(settings\.listMode === 'whitelist'\) return true;/);

  const pendingHideGate = sliceBetween(
    read('js/content_bridge.js'),
    'function queueWhitelistPendingHide(mutations, delayMs = 40) {',
    'function applyWhitelistPendingHide(candidates) {'
  );
  assert.ok(
    pendingHideGate.indexOf("if (currentSettings?.listMode !== 'whitelist') return;") <
    pendingHideGate.indexOf('if (node.matches?.(VIDEO_CARD_SELECTORS)) return queueCandidate(node);')
  );
  assert.ok(
    pendingHideGate.indexOf("if (path === '/' || path === '/results' || path === '/feed/channels' || path.startsWith('/watch')) return;") <
    pendingHideGate.indexOf('if (node.matches?.(VIDEO_CARD_SELECTORS)) return queueCandidate(node);')
  );

  const storageGate = sliceBetween(
    read('js/content/bridge_settings.js'),
    'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {}) {',
    'function handleStorageChanges(changes, area) {'
  );
  assert.match(storageGate, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;/);
  assert.match(storageGate, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);
}

function assertDocIncludesRange(doc, file, startLine, endLine) {
  assert.ok(
    doc.includes(`\`${file}:${startLine}-${endLine}\``),
    `missing source pin ${file}:${startLine}-${endLine}`
  );
}

function assertListModeOwnerFlowAddendum(doc) {
  const ownerRows = [
    'list_mode_ui_intent',
    'list_mode_transition_writer',
    'list_mode_visible_row_owner',
    'list_mode_import_alias_owner',
    'list_mode_compile_owner',
    'list_mode_transport_gate_owner',
    'list_mode_json_decision_owner',
    'list_mode_dom_action_owner'
  ];

  for (const rowId of ownerRows) {
    assert.ok(doc.includes(`| \`${rowId}\` |`), `missing list-mode owner row ${rowId}`);
  }

  assert.match(doc, /flowchart TD/);
  assert.match(doc, /Popup, dashboard, and import list-mode intent/);
  assert.match(doc, /Background SetListMode writer/);
  assert.match(doc, /Seed and injector JSON admission/);
  assert.match(doc, /DOM fallback and whitelist pending-hide/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  assertDocIncludesRange(
    doc,
    'js/popup.js',
    lineOf('js/popup.js', 'const enablingWhitelist = nextState === true;'),
    lineOfAfterSequence('js/popup.js', ['const enablingWhitelist = nextState === true;', "action: 'FilterTube_SetListMode',", '});'])
  );
  assertDocIncludesRange(
    doc,
    'js/tab-view.js',
    lineOf('js/tab-view.js', 'async function enableWhitelistModeAfterImport(context = {}) {'),
    lineOfAfter('js/tab-view.js', 'async function enableWhitelistModeAfterImport(context = {}) {', 'copyBlocklist: false') + 1
  );
  assertDocIncludesRange(
    doc,
    'js/tab-view.js',
    lineOfAfterSequence('js/tab-view.js', ['function renderListModeControls()', 'const disablingWhitelist']),
    lineOfAfterSequence('js/tab-view.js', ['function renderListModeControls()', "action: 'FilterTube_SetListMode',", 'copyBlocklist']) + 1
  );
  assertDocIncludesRange(
    doc,
    'js/background.js',
    lineOf('js/background.js', "} else if (action === 'FilterTube_SetListMode') {"),
    lineOfAfter('js/background.js', "} else if (action === 'FilterTube_SetListMode') {", 'sendResponse?.({ ok: true, profileType: requestedProfile, mode: requestedMode });')
  );
  assertDocIncludesRange(
    doc,
    'js/state_manager.js',
    lineOf('js/state_manager.js', 'state.syncKidsToMain = !!activeProfileFromV4.settings.syncKidsToMain;'),
    lineOfAfter('js/state_manager.js', 'state.syncKidsToMain = !!activeProfileFromV4.settings.syncKidsToMain;', 'state.userWhitelistKeywords = Array.isArray(state.whitelistKeywords)')
  );
  assertDocIncludesRange(
    doc,
    'js/render_engine.js',
    lineOf('js/render_engine.js', 'const state = stateOverride || StateManager?.getState() || { keywords: [], kids: { blockedKeywords: [], blockedChannels: [] } };'),
    lineOfAfterSequence('js/render_engine.js', [
      'const state = stateOverride || StateManager?.getState() || { keywords: [], kids: { blockedKeywords: [], blockedChannels: [] } };',
      'const mainKeywords = mainMode === \'whitelist\'',
      '? (Array.isArray(state.whitelistKeywords) ? state.whitelistKeywords : [])'
    ])
  );
  assertDocIncludesRange(
    doc,
    'js/render_engine.js',
    lineOf('js/render_engine.js', 'const state = stateOverride || StateManager?.getState() || { channels: [], kids: { blockedChannels: [] } };'),
    lineOfAfterSequence('js/render_engine.js', [
      'const state = stateOverride || StateManager?.getState() || { channels: [], kids: { blockedChannels: [] } };',
      'const mainChannels = mainMode === \'whitelist\'',
      '? (Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [])'
    ])
  );
  assertDocIncludesRange(
    doc,
    'js/io_manager.js',
    lineOf('js/io_manager.js', 'function normalizeMainProfileAliasFields(main) {'),
    lineOfAfter('js/io_manager.js', 'function normalizeMainProfileAliasFields(main) {', 'return out;')
  );
  assertDocIncludesRange(
    doc,
    'js/background.js',
    lineOf('js/background.js', "const mainModeFromV4 = (typeof activeMain.mode === 'string' && activeMain.mode === 'whitelist')"),
    lineOfAfter('js/background.js', "const mainModeFromV4 = (typeof activeMain.mode === 'string' && activeMain.mode === 'whitelist')", "const handle = typeof ch?.handle === 'string' ? ch.handle.trim().toLowerCase() : '';")
  );
  assertDocIncludesRange(
    doc,
    'js/background.js',
    lineOfAfterSequence('js/background.js', [
      "const mainModeFromV4 = (typeof activeMain.mode === 'string' && activeMain.mode === 'whitelist')",
      'const hideCommentsFromV4 = boolFromV4'
    ]),
    lineOfAfterSequence('js/background.js', [
      'const hideCommentsFromV4 = boolFromV4',
      'return (typeof entry === \'object\' && entry) ? entry.comments === true : false;',
      '});'
    ])
  );
  assertDocIncludesRange(
    doc,
    'js/background.js',
    lineOf('js/background.js', 'compiledSettings.whitelistChannels = compileWhitelistChannels(rawWhitelistChannels);'),
    lineOfAfter('js/background.js', 'compiledSettings.whitelistChannels = compileWhitelistChannels(rawWhitelistChannels);', "if (kidsModeFromV4 !== 'blocklist') return mainChannels;")
  );
  assertDocIncludesRange(
    doc,
    'js/seed.js',
    lineOf('js/seed.js', 'function hasActiveJsonFilterRules(settings) {'),
    lineOfAfterSequence('js/seed.js', [
      'function hasActiveJsonFilterRules(settings) {',
      'function shouldBypassYouTubeiNetworkResponse(dataName) {',
      'no active JSON work',
      'return true;'
    ])
  );
  assertDocIncludesRange(
    doc,
    'js/injector.js',
    lineOf('js/injector.js', 'function hasActiveJsonFilterRules(settings) {'),
    lineOfAfter('js/injector.js', 'function hasActiveJsonFilterRules(settings) {', 'return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);')
  );
  assertDocIncludesRange(
    doc,
    'js/filter_logic.js',
    lineOf('js/filter_logic.js', "const listMode = (this.settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';"),
    lineOfAfter('js/filter_logic.js', "const listMode = (this.settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';", 'const shouldBlockByContent = this._checkContentFilters(item, rules, rendererType);')
  );
  assertDocIncludesRange(
    doc,
    'js/content/dom_fallback.js',
    lineOf('js/content/dom_fallback.js', 'function hasActiveDOMFallbackWork(settings) {'),
    lineOfAfterSequence('js/content/dom_fallback.js', [
      'function hasActiveDOMFallbackWork(settings) {',
      'catch (e)',
      'return true;'
    ]) + 2
  );
  assertDocIncludesRange(
    doc,
    'js/content/dom_fallback.js',
    lineOf('js/content/dom_fallback.js', 'async function applyDOMFallback(settings, options = {}) {'),
    lineOfAfterSequence('js/content/dom_fallback.js', [
      'async function applyDOMFallback(settings, options = {}) {',
      'const hasActiveFallbackWork = hasActiveDOMFallbackWork(effectiveSettings);',
      'return;'
    ]) + 1
  );
  assertDocIncludesRange(
    doc,
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'function queueWhitelistPendingHide(mutations, delayMs = 40) {'),
    lineOfAfterSequence('js/content_bridge.js', [
      'function queueWhitelistPendingHide(mutations, delayMs = 40) {',
      'function applyWhitelistPendingHide(candidates) {',
      'if (listMode !== \'whitelist\') return;'
    ]) + 1
  );
  assertDocIncludesRange(
    doc,
    'js/content/block_channel.js',
    lineOf('js/content/block_channel.js', 'const isQuickBlockEnabled = () => {'),
    lineOfAfter('js/content/block_channel.js', 'const isQuickBlockEnabled = () => {', '};')
  );
  assertDocIncludesRange(
    doc,
    'js/content_bridge.js',
    lineOf('js/content_bridge.js', 'async function injectFilterTubeMenuItem(dropdown, videoCard) {'),
    lineOfAfterSequence('js/content_bridge.js', [
      'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
      'catch (e)',
      'return;'
    ]) + 1
  );

  const backgroundTransition = sliceBetween(
    read('js/background.js'),
    "} else if (action === 'FilterTube_SetListMode') {",
    "} else if (action === 'addWhitelistChannelPersistent') {"
  );
  assert.match(backgroundTransition, /const shouldCopyBlocklist = request\?\.copyBlocklist === true;/);
  assert.match(backgroundTransition, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);/);
  assert.doesNotMatch(backgroundTransition, /if \(requestedMode === 'whitelist' && shouldCopyBlocklist\)/);

  const ioAlias = sliceBetween(
    read('js/io_manager.js'),
    'function normalizeMainProfileAliasFields(main) {',
    '/** Simple case-insensitive merge helper for plain string lists. */'
  );
  assert.match(ioAlias, /if \(mode === 'blocklist'\) \{\s*out\.blockedChannels = out\.channels;/);
  assert.match(ioAlias, /else \{\s*out\.blockedChannels = \[\];\s*out\.blockedKeywords = \[\];/);
}

function assertSettingsProfileListModeConvergenceBoundary(doc) {
  const boundary = sliceBetween(
    doc,
    '## Settings/Profile/List-Mode Convergence Boundary - 2026-05-30',
    '## Executable Proof'
  );

  for (const sourceInput of [
    'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md',
    'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_COMPILED_SETTINGS_PROFILE_LIST_MODE_ASSEMBLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_CONTENT_CONTROL_ACTIVE_WORK_MATRIX_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md',
    'docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md'
  ]) {
    assert.ok(boundary.includes(sourceInput), `missing convergence source input ${sourceInput}`);
  }

  for (const rowId of [
    'settings_convergence_visible_rows_vs_compile_sources',
    'settings_convergence_empty_policy_split',
    'settings_convergence_profile_surface_selection',
    'settings_convergence_sync_kids_to_main_merge',
    'settings_convergence_list_mode_transition_storage',
    'settings_convergence_transport_json_admission',
    'settings_convergence_json_decision_comment_exception',
    'settings_convergence_dom_pending_action_admission',
    'settings_convergence_content_control_active_work',
    'settings_convergence_refresh_revision_fanout'
  ]) {
    assert.ok(boundary.includes(`| \`${rowId}\` |`), `missing convergence row ${rowId}`);
  }

  assert.match(boundary, /UI rows \/ imports \/ Nanah \/ managed child writes/);
  assert.match(boundary, /background compiled settings/);
  assert.match(boundary, /filter_logic JSON decisions and comment exception/);
  assert.match(boundary, /DOM fallback \/ whitelist pending-hide \/ quick-menu gates/);
  assert.match(boundary, /NO-GO until one settingsModeSourceEffectAuthority report exists/);
  assert.match(boundary, /flowchart TD/);
  assert.match(boundary, /Settings\/profile\/list-mode authority remains NO-GO/);

  for (const token of [
    'settings/profile/list-mode convergence rows: 10',
    'implementation-ready settings/profile/list-mode convergence rows: 0',
    'settingsModeSourceEffectAuthority product source symbol: absent',
    'settingsSourceEffectDecision product source symbol: absent',
    'modeSurfaceEffectAuthority product source symbol: absent',
    'runtime behavior changed by this addendum: no',
    'settings-mode implementation approval: NO-GO',
    'settings-mode alias cleanup approval: NO-GO',
    'settings-mode simultaneous allow/block approval: NO-GO',
    'settings-mode whitelist/cache optimization approval: NO-GO',
    'settings-mode JSON-first promotion approval: NO-GO',
    'settings-mode refresh pruning approval: NO-GO',
    'release/public-claim use: NO-GO'
  ]) {
    assert.ok(boundary.includes(token), `missing convergence token ${token}`);
  }
}

test('background compiler chooses profile and list mode before compiling block and allow sources', () => {
  const background = read('js/background.js');
  const profileBlock = sliceBetween(
    background,
    'const requestedProfile = request.profileType;',
    'console.log(`FilterTube Background: Received getCompiledSettings message'
  );
  const compileBlock = sliceBetween(
    background,
    'const mainModeFromV4 = (typeof activeMain.mode ===',
    'const boolFromV4 = (key, legacyValue) => {'
  );

  assert.match(profileBlock, /const profileType = requestedProfile === 'kids' \? 'kids' : \(requestedProfile === 'main' \? 'main' : \(isKidsUrl\(senderUrl\) \? 'kids' : 'main'\)\)/);
  assert.match(compileBlock, /compiledSettings\.listMode = shouldUseKidsProfile \? kidsModeFromV4 : mainModeFromV4/);
  assert.match(compileBlock, /compiledSettings\.whitelistKeywords = compileKeywordEntries\(rawWhitelistKeywords\)/);
  assert.match(compileBlock, /const rawWhitelistChannels = shouldUseKidsProfile/);
});

test('main blocklist source now prefers canonical keyword and channel rows before aliases', () => {
  const render = read('js/render_engine.js');
  const background = read('js/background.js');
  const shared = read('js/settings_shared.js');

  const keywordRows = sliceBetween(
    render,
    'function renderKeywordList(container, options = {})',
    'function createKeywordListItem(entry, config = {})'
  );
  const channelRows = sliceBetween(
    render,
    'function renderChannelList(container, options = {})',
    'function createMinimalChannelItem'
  );
  const keywordCompile = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'if (v4KeywordEntries) {'
  );
  const channelCompile = sliceBetween(
    background,
    'const storedChannels = shouldUseKidsProfile',
    'let compiledChannels = [];'
  );
  const sharedSave = sliceBetween(
    shared,
    'const existingMain = safeObject(activeProfile.main);',
    'profiles[activeId] = {'
  );

  assert.match(keywordRows, /mainMode === 'whitelist'\s*\?\s*\(Array\.isArray\(state\.whitelistKeywords\) \? state\.whitelistKeywords : \[\]\)\s*:\s*state\.keywords/);
  assert.doesNotMatch(keywordRows, /state\.blockedKeywords/);
  assert.match(channelRows, /mainMode === 'whitelist'\s*\?\s*\(Array\.isArray\(state\.whitelistChannels\) \? state\.whitelistChannels : \[\]\)\s*:\s*state\.channels/);
  assert.doesNotMatch(channelRows, /state\.blockedChannels/);
  assert.match(keywordCompile, /Array\.isArray\(activeMain\.keywords\)\s*\?\s*activeMain\.keywords\s*:\s*\(Array\.isArray\(activeMain\.blockedKeywords\) \? activeMain\.blockedKeywords : null\)/);
  assert.ok(keywordCompile.indexOf('activeMain.keywords') < keywordCompile.indexOf('activeMain.blockedKeywords'));
  assert.match(channelCompile, /Array\.isArray\(activeMain\.channels\)\s*\?\s*activeMain\.channels\s*:\s*\(Array\.isArray\(activeMain\.blockedChannels\) \? activeMain\.blockedChannels : items\.filterChannels\)/);
  assert.ok(channelCompile.indexOf('activeMain.channels') < channelCompile.indexOf('activeMain.blockedChannels'));
  assert.match(sharedSave, /channels: sanitizedChannels/);
  assert.match(sharedSave, /keywords: sanitizedKeywords/);
  assert.match(sharedSave, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
  assert.match(sharedSave, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
  assert.doesNotMatch(sharedSave, /aliasConflict/);
});

test('seed endpoint no-work currently treats empty blocklist and whitelist differently', () => {
  const seed = read('js/seed.js');
  const block = sliceBetween(
    seed,
    'function shouldSkipEngineProcessing(data, dataName) {',
    'function processWithEngine(data, dataName)'
  );

  assert.match(block, /const mode = \(cachedSettings && cachedSettings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(block, /if \(mode !== 'whitelist'\) \{\s*\/\/ Keep the old fast path only when there are no active rules/);
  assert.match(block, /const activeContentFilters = hasEnabledContentFilters\(cachedSettings\);/);
  assert.match(block, /const activeJsonFilterRules = hasActiveJsonFilterRules\(cachedSettings\);/);
  assert.match(block, /if \(mode !== 'whitelist' && !activeContentFilters && !activeJsonFilterRules\)/);
  assert.doesNotMatch(block, /mode === 'whitelist' && !activeContentFilters && !activeJsonFilterRules/);
});

test('JSON engine whitelist branch is fail-closed while blocklist rules run after that branch', () => {
  const logic = read('js/filter_logic.js');
  const block = sliceBetween(
    logic,
    'if (listMode === \'whitelist\' && !isCommentRenderer) {',
    '// Channel filtering with comprehensive matching'
  );
  const afterWhitelist = sliceBetween(
    logic,
    '// Channel filtering with comprehensive matching',
    '// Comment filtering'
  );

  assert.match(block, /if \(!hasChannelRules && !hasKeywordRules\) \{[\s\S]*return true;/);
  assert.match(block, /this\._logWhitelistDecision\('block:unresolved_identity'/);
  assert.match(block, /this\._logWhitelistDecision\('block:no_whitelist_match'/);
  assert.match(block, /return true;/);
  assert.match(afterWhitelist, /if \(this\.settings\.filterChannels\.length > 0\)/);
  assert.match(afterWhitelist, /if \(!skipKeywordFiltering && this\.settings\.filterKeywords\.length > 0\)/);
});

test('DOM fallback whitelist path also fail-closes on no rules and unresolved identity', () => {
  const dom = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    dom,
    'if (listMode === \'whitelist\' && !isCommentContext) {',
    'if (settings.filterChannels && settings.filterChannels.length > 0 && !hasChannelIdentity'
  );

  assert.match(block, /if \(!hasChannelRules && !hasKeywordRules\) return true;/);
  assert.match(block, /if \(isKidsVideoCard \|\| isLikelyShorts\) \{\s*return true;\s*\}/);
  assert.match(block, /return true;/);
  assert.match(block, /allow:matched_channel/);
  assert.match(block, /allow:matched_keyword/);
});

test('engine behavior proves empty blocklist allows while empty whitelist hides normal video cards', () => {
  const input = [videoRenderer()];

  const emptyBlocklist = runEngine(input, {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: []
  });

  const emptyWhitelist = runEngine(input, {
    enabled: true,
    listMode: 'whitelist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: []
  });

  const allowedWhitelist = runEngine(input, {
    enabled: true,
    listMode: 'whitelist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [keyword('minecraft')],
    whitelistChannels: []
  });

  assert.deepEqual(plain(emptyBlocklist), { contents: input });
  assert.deepEqual(plain(emptyWhitelist), { contents: [] });
  assert.deepEqual(plain(allowedWhitelist), { contents: input });
});

test('comment renderers remain a separate settings-mode proof surface', () => {
  const logic = read('js/filter_logic.js');
  const block = sliceBetween(
    logic,
    '// Comment filtering',
    '// Content filters (duration, upload date) - applied after channel/keyword filtering'
  );

  assert.match(block, /if \(rendererType\.includes\('comment'\) \|\| rendererType\.includes\('Comment'\)\)/);
  assert.match(block, /if \(this\.settings\.hideAllComments\)/);
  assert.match(block, /const commentKeywords = Array\.isArray\(this\.settings\.filterKeywordsComments\)/);
  assert.match(block, /if \(commentText && commentKeywords\.length > 0\)/);
  assert.match(block, /this\._matchesAnyChannel\(commentChannelInfo, this\.settings\.filterChannels, this\.filterChannelIndex\)/);
});

test('runtime source still lacks a unified settings mode source/effect authority', () => {
  const combined = [
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/render_engine.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');

  for (const token of [
    'settingsModeSourceEffectAuthority',
    'settingsSourceEffectDecision',
    'modeSurfaceEffectAuthority',
    'sourceEffectDecision',
    'emptyPolicy',
    'commentPolicy',
    'legacyAliasConflict',
    'allowedEffects'
  ]) {
    assert.doesNotMatch(combined, new RegExp(`\\b${token}\\b`));
  }
});
