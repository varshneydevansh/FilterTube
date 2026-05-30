import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const matrixPath = 'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function matrix() {
  return read(matrixPath);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('settings mode matrix explicitly refuses completion or behavior readiness', () => {
  const doc = matrix();

  assert.match(doc, /Completion is not proven/);
  assert.match(doc, /not-ready-for-behavior-change/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /root HTML\/JSON\/TXT captures listed in `.gitignore` are still evidence\s+inputs only/i);
});

test('settings mode matrix covers the required mode dimensions', () => {
  const doc = matrix();

  for (const dimension of [
    'Extension enabled vs disabled',
    'Main mode: blocklist vs whitelist',
    'Kids mode: blocklist vs whitelist',
    'Empty blocklist',
    'Explicit empty whitelist',
    'Non-empty blocklist',
    'Non-empty whitelist',
    'Main viewing allowed/denied',
    'Kids viewing allowed/denied',
    'Profile type: master/account/child/managed-child',
    'Locked vs unlocked profile/session PIN',
    '`syncKidsToMain` enabled/disabled',
    '`showBlockMenuItem` enabled/disabled',
    'Quick block enabled/disabled',
    'Fallback menu enabled/disabled',
    'Content category filters enabled with selected/empty categories',
    'Upload date enabled with valid/blank dates',
    'Duration filter enabled with meaningful/zero thresholds',
    'Exact keyword vs substring keyword',
    'Comments keyword scope vs global keyword scope',
    'Filter All channel-derived keywords',
    'Shorts controls',
    'Comments controls',
    'Watch recommendations/sidebar/player controls',
    'YTM/Kids/Main surface modes',
    'Route modes: home/search/watch/shorts/comments/playlist/channel/posts',
    'Backup/import/Nanah apply modes',
    'Future simultaneous allow/block mode'
  ]) {
    assert.ok(doc.includes(dimension), `missing mode dimension ${dimension}`);
  }
});

test('settings mode matrix keeps proof status and missing-proof columns on the table', () => {
  const doc = matrix();

  assert.match(doc, /\| Mode dimension \| Current proof artifacts \| Current status \| Missing proof before completion \|/);

  for (const status of [
    'proof-started',
    'partial',
    'current-gap-pinned',
    'not-ready-for-behavior-change'
  ]) {
    assert.ok(doc.includes(status), `missing status ${status}`);
  }

  for (const requiredPhrase of [
    'zero parse, zero DOM scan, zero observer affordance work',
    'route-scoped blocklist and whitelist fixtures',
    'zero-work counters per route/surface',
    'explicit and confirmed in UI',
    'shared action authority',
    'canonical per-entry action schema'
  ]) {
    assert.ok(doc.includes(requiredPhrase), `missing missing-proof phrase ${requiredPhrase}`);
  }
});

test('settings mode matrix separates mode rows from semantic settings-mode proof', () => {
  const doc = matrix();

  assert.match(doc, /Settings Mode Semantic Boundary/);
  assert.match(doc, /coverage map, not semantic completion proof/);
  assert.match(doc, /mode dimension and exact value/);
  assert.match(doc, /profile id, profile type, lock\/session state, and viewing space/);
  assert.match(doc, /surface and route family/);
  assert.match(doc, /UI row source and displayed canonical lists/);
  assert.match(doc, /legacy alias fields and migration\/conflict policy/);
  assert.match(doc, /storage keys read and written/);
  assert.match(doc, /background compiler source fields/);
  assert.match(doc, /compiled settings payload and cache source\/revision/);
  assert.match(doc, /content bridge refresh\/invalidation behavior/);
  assert.match(doc, /JSON endpoint policy and DOM fallback active predicate/);
  assert.match(doc, /menu\/quick-block\/native-app action gate/);
  assert.match(doc, /mutation actor, target profile, backup\/revision side effect/);
  assert.match(doc, /positive fixture and negative no-rule\/non-matching sibling-visible fixture/);
  assert.match(doc, /dashboard rows alone/);
  assert.match(doc, /stale aliases, background compilation, pushed compiled\s+settings, cached settings, Kids-to-Main sync, import\/Nanah writes/);
});

test('settings mode matrix cites the focused authority audits it consolidates', () => {
  const doc = matrix();

  for (const artifact of [
    'docs/audit/FILTERTUBE_ACTIVE_RULE_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_UI_ROW_LIST_MODE_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md',
    'docs/audit/FILTERTUBE_PROFILE_VIEWING_SPACE_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_CONTENT_CATEGORY_PREDICATE_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_KEYWORD_MATCH_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_SECURITY_PIN_LOCK_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing artifact citation ${artifact}`);
  }
});

test('current source still proves key settings-mode split-authority risks', () => {
  const background = read('js/background.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const quickBlock = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');

  const setListMode = sliceBetween(
    background,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );
  const skipEngine = sliceBetween(seed, 'function shouldSkipEngineProcessing(data, dataName)', 'const searchActionCollections');
  const domActive = sliceBetween(domFallback, 'function hasActiveDOMFallbackWork(settings)', 'function clearStaleDOMFallbackVisibility()');
  const quickSetup = sliceBetween(quickBlock, 'function setupQuickBlockObserver()', '/**\n * Observe dropdowns and inject FilterTube menu items');
  const fallbackMenu = sliceBetween(bridge, 'function ensureFallbackMenuButtons()', 'let playlistFallbackPopoverState = null;');

  assert.match(setListMode, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(setListMode, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);/);
  assert.doesNotMatch(setListMode, /if \(requestedMode === 'whitelist' && shouldCopyBlocklist\)/);

  assert.match(skipEngine, /const mode = \(cachedSettings && cachedSettings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(skipEngine, /const activeContentFilters = hasEnabledContentFilters\(cachedSettings\)/);
  assert.match(skipEngine, /const activeJsonFilterRules = hasActiveJsonFilterRules\(cachedSettings\)/);

  assert.match(domActive, /if \(listMode === 'whitelist'\) return true/);
  assert.match(domActive, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(domActive, /return categoryFilters\?\.enabled === true/);

  assert.match(quickSetup, /quickBlockObserverStarted = true/);
  assert.match(quickSetup, /document\.addEventListener\('scroll'/);
  assert.match(quickSetup, /window\.addEventListener\('resize'/);
  assert.match(quickSetup, /observer\.observe\(document\.body/);
  assert.doesNotMatch(quickSetup, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(quickSetup, /document\.addEventListener\('yt-navigate-finish'/);

  assert.match(fallbackMenu, /new MutationObserver/);
  assert.match(fallbackMenu, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallbackMenu, /window\.addEventListener\('scroll'/);
  assert.match(fallbackMenu, /const warmupTimer = setInterval/);
  assert.doesNotMatch(fallbackMenu, /showBlockMenuItem/);
});

test('settings mode matrix names future fixture gates before behavior changes', () => {
  const doc = matrix();

  for (const fixtureName of [
    'settings_mode_disabled_extension_zero_work_all_surfaces',
    'settings_mode_empty_blocklist_zero_work_main_home_mobile_watch',
    'settings_mode_explicit_empty_whitelist_fail_closed_ui_confirmed',
    'settings_mode_main_blocklist_and_kids_whitelist_independent',
    'settings_mode_sync_kids_to_main_requires_mode_compatibility',
    'settings_mode_locked_profile_rejects_all_rule_mutations',
    'settings_mode_child_profile_cannot_mutate_parent_policy',
    'settings_mode_content_enabled_empty_values_inactive',
    'settings_mode_keyword_exactness_json_dom_parity',
    'settings_mode_comment_keywords_do_not_leak_global_policy',
    'settings_mode_show_block_menu_and_quick_block_zero_lifecycle_when_off',
    'settings_mode_watch_controls_route_scoped',
    'settings_mode_import_nanah_preserves_target_profile_and_mode',
    'settings_mode_simultaneous_allow_block_schema_migration_gate'
  ]) {
    assert.ok(doc.includes(fixtureName), `missing future fixture gate ${fixtureName}`);
  }
});
