import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_STATS_TIME_SAVED_CURRENT_BEHAVIOR_2026-05-19.md';

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

function backgroundRecordTimeSavedBlock() {
  return sliceBetween(
    read('js/background.js'),
    '} else if (request.action === "recordTimeSaved")',
    'else if (request.action === "fetchChannelDetails")'
  );
}

function toggleVisibilityBlock() {
  return sliceBetween(
    read('js/content/dom_helpers.js'),
    'function toggleVisibility(element, shouldHide, reason = \'\', skipStats = false) {',
    'function updateContainerVisibility(container, childSelector) {'
  );
}

function incrementStatsBlock() {
  return sliceBetween(
    read('js/content_bridge.js'),
    'function incrementHiddenStats(element) {',
    'function decrementHiddenStats(element) {'
  );
}

function decrementStatsBlock() {
  return sliceBetween(
    read('js/content_bridge.js'),
    'function decrementHiddenStats(element) {',
    'function saveStats() {'
  );
}

function saveStatsBlock() {
  return sliceBetween(
    read('js/content_bridge.js'),
    'function saveStats() {',
    'function handleMediaPlayback(element, shouldHide) {'
  );
}

test('P0 stats current-behavior doc lists all ten readiness fixtures', () => {
  const doc = read(docPath);

  for (const fixture of [
    'stats_rejects_untrusted_record_time_saved',
    'stats_rejects_negative_or_nonfinite_seconds',
    'stats_records_only_structured_hide_decisions',
    'stats_restore_decrements_only_prior_counted_hide',
    'stats_skipstats_does_not_pause_media_without_side_effect_reason',
    'stats_surface_scope_main_and_kids_are_separate',
    'stats_dashboard_refreshes_on_stats_by_surface_change',
    'stats_storage_write_is_batched_or_debounced',
    'stats_legacy_background_path_cannot_override_surface_stats',
    'stats_no_rule_hide_path_does_not_increment_dashboard'
  ]) {
    assert.ok(doc.includes(fixture), `missing fixture ${fixture}`);
  }

  assert.match(doc, /Status: current-behavior proof/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /statsSideEffectAuthority/);
});

test('stats_rejects_untrusted_record_time_saved is not satisfied today', () => {
  const block = backgroundRecordTimeSavedBlock();

  assert.match(block, /request\.action === "recordTimeSaved"/);
  assert.match(block, /browserAPI\.storage\.local\.get\(\['stats'\]/);
  assert.match(block, /browserAPI\.storage\.local\.set\(\{ stats \}\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|trustedSender|senderClass|sender\.url|chrome-extension/);
});

test('stats_rejects_negative_or_nonfinite_seconds is not satisfied today', () => {
  const block = backgroundRecordTimeSavedBlock();

  assert.match(block, /const oldSeconds = stats\.savedSeconds \|\| 0/);
  assert.match(block, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\)/);
  assert.doesNotMatch(block, /Number\.isFinite|Number\.isSafeInteger|parseFloat|Math\.max|Math\.min|clamp|seconds > 0/);
});

test('stats_records_only_structured_hide_decisions is not satisfied today', () => {
  const toggle = toggleVisibilityBlock();
  const increment = incrementStatsBlock();

  assert.match(toggle, /incrementHiddenStats\(element\)/);
  assert.match(increment, /function incrementHiddenStats\(element\)/);
  assert.match(increment, /statsCountToday\+\+/);
  assert.match(increment, /element\.setAttribute\('data-filtertube-time-saved', secondsSaved\.toString\(\)\)/);
  assert.doesNotMatch(`${toggle}\n${increment}`, /hideDecisionId|statsSideEffectAuthority|compiledRuleState|compiledRuleActive|routeScoped|actorClass/);
});

test('stats_restore_decrements_only_prior_counted_hide is only DOM-attribute based today', () => {
  const decrement = decrementStatsBlock();

  assert.match(decrement, /if \(statsCountToday <= 0\) return/);
  assert.match(decrement, /parseFloat\(element\?\.getAttribute\('data-filtertube-time-saved'\) \|\| '0'\)/);
  assert.match(decrement, /statsCountToday = Math\.max\(0, statsCountToday - 1\)/);
  assert.match(decrement, /element\.removeAttribute\('data-filtertube-time-saved'\)/);
  assert.doesNotMatch(decrement, /priorCountedElement|hideDecisionId|statsSideEffectAuthority|countedHideId/);
});

test('stats_skipstats_does_not_pause_media_without_side_effect_reason is not satisfied today', () => {
  const toggle = toggleVisibilityBlock();

  assert.match(toggle, /if \(!skipStats\) \{\s*filteringTracker\.recordHide\(element, reason\);/);
  assert.match(toggle, /if \(!skipStats\) \{\s*incrementHiddenStats\(element\);/);
  assert.match(toggle, /if \(!skipStats\) \{\s*decrementHiddenStats\(element\);/);
  assert.match(toggle, /handleMediaPlayback\(element, true\)/);
  assert.match(toggle, /handleMediaPlayback\(element, false\)/);

  const hideMediaIndex = toggle.indexOf('handleMediaPlayback(element, true)');
  const statsGuardIndex = toggle.indexOf('if (!skipStats)');
  assert.ok(hideMediaIndex > statsGuardIndex, 'media side effect is after stats guard but not inside that guard');
});

test('stats_surface_scope_main_and_kids_are_separate is only partially satisfied today', () => {
  const save = saveStatsBlock();
  const background = backgroundRecordTimeSavedBlock();

  assert.match(save, /const surface = getStatsSurfaceKey\(\)/);
  assert.match(save, /const statsBySurface = \{/);
  assert.match(save, /\[surface\]: nextStats/);
  assert.match(save, /if \(surface === 'main'\) \{\s*payload\.stats = nextStats;/);

  assert.match(background, /browserAPI\.storage\.local\.get\(\['stats'\]/);
  assert.match(background, /browserAPI\.storage\.local\.set\(\{ stats \}\)/);
  assert.doesNotMatch(background, /statsBySurface|getStatsSurfaceKey|surface/);
});

test('stats_dashboard_refreshes_on_stats_by_surface_change is not satisfied today', () => {
  const stateManager = read('js/state_manager.js');
  const reloadKeys = sliceBetween(
    stateManager,
    'const storageKeys = [',
    'const hasSettingsChange = storageKeys.some'
  );
  const tabView = read('js/tab-view.js');
  const dashboard = sliceBetween(
    tabView,
    'function getDashboardSurfaceStats(surface, state) {',
    '// Initial render'
  );

  assert.match(dashboard, /state\.statsBySurface/);
  assert.match(dashboard, /const picked = bySurface\[surface\]/);
  assert.match(reloadKeys, /'stats'/);
  assert.doesNotMatch(reloadKeys, /'statsBySurface'/);
});

test('stats_storage_write_is_batched_or_debounced is not satisfied today', () => {
  const save = saveStatsBlock();

  assert.match(save, /chrome\.storage\.local\.get\(\['stats', 'statsBySurface'\]/);
  assert.match(save, /chrome\.storage\.local\.set\(payload\)/);
  assert.doesNotMatch(save, /setTimeout|clearTimeout|requestIdleCallback|debounce|queueMicrotask|pendingStatsWrite|batched/);
});

test('stats_legacy_background_path_cannot_override_surface_stats is not satisfied today', () => {
  const background = backgroundRecordTimeSavedBlock();
  const dashboard = sliceBetween(
    read('js/tab-view.js'),
    'function getDashboardSurfaceStats(surface, state) {',
    '// Initial render'
  );

  assert.match(background, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\)/);
  assert.match(background, /browserAPI\.storage\.local\.set\(\{ stats \}\)/);
  assert.match(dashboard, /if \(surface === 'main'\) return state\?\.stats \|\| \{\}/);
  assert.doesNotMatch(background, /statsBySurface|surface|source|hideDecisionId/);
});

test('stats_no_rule_hide_path_does_not_increment_dashboard is not satisfied today', () => {
  const toggle = toggleVisibilityBlock();
  const increment = incrementStatsBlock();

  assert.match(toggle, /function toggleVisibility\(element, shouldHide, reason = '', skipStats = false\)/);
  assert.match(toggle, /if \(!skipStats\) \{\s*incrementHiddenStats\(element\);/);
  assert.match(increment, /statsCountToday\+\+/);
  assert.match(increment, /saveStats\(\)/);
  assert.doesNotMatch(`${toggle}\n${increment}`, /noWork|compiledRuleState|compiledRuleActive|ruleDecisionId|filterDecisionId|statsSideEffectAuthority/);
});
