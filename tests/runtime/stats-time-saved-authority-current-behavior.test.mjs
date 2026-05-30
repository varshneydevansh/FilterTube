import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

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

test('stats time-saved authority audit documents split metric writers and future gates', () => {
  const doc = read('docs/audit/FILTERTUBE_STATS_TIME_SAVED_AUTHORITY_AUDIT_2026-05-18.md');

  for (const phrase of [
    'Stats / Time-Saved Authority',
    'Current Authority Shape',
    'Hide Path Stats Coupling',
    'Content Bridge Stats Behavior',
    'Background Record-Time Path',
    'Surface Storage Shape',
    'Dashboard Read Path',
    'Hide/Stats Side-Effect Snapshot - 2026-05-27',
    'hide/stats side-effect policy approval: NO-GO',
    'media side-effect budget approval: NO-GO',
    'background recordTimeSaved authority approval: NO-GO',
    'runtime behavior changed by this addendum: no',
    'statsSideEffectAuthority',
    'stats_rejects_untrusted_record_time_saved',
    'stats_rejects_negative_or_nonfinite_seconds',
    'stats_records_only_structured_hide_decisions'
  ]) {
    assert.ok(doc.includes(phrase), `missing audit phrase: ${phrase}`);
  }

  assert.match(doc, /hide request\s+\|\s+\+--> shared toggleVisibility\(\)/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /Shared hide helper/);
  assert.match(doc, /Whitelist pending hide/);
  assert.match(doc, /Content stats increment/);
  assert.match(doc, /Content stats restore/);
  assert.match(doc, /Surface stats storage/);
  assert.match(doc, /Media side effects/);
  assert.match(doc, /Current watch owner block/);
  assert.match(doc, /Background time writer/);
  assert.match(doc, /`js\/content_bridge\.js:3668-3697` initializes stats/);
  assert.match(doc, /`js\/content_bridge\.js:3782-3853` increments hidden count/);
  assert.match(doc, /`js\/content_bridge\.js:3878-3915` writes `statsBySurface`/);
});

test('toggleVisibility currently couples display, tracking, stats, pending whitelist, and media side effects', () => {
  const text = read('js/content/dom_helpers.js');
  const toggle = sliceBetween(
    text,
    'function toggleVisibility(element, shouldHide, reason = \'\', skipStats = false) {',
    'function updateContainerVisibility(container, childSelector) {'
  );

  assert.match(toggle, /data-filtertube-whitelist-pending/);
  assert.match(toggle, /filteringTracker\.recordHide\(element, reason\)/);
  assert.match(toggle, /incrementHiddenStats\(element\)/);
  assert.match(toggle, /filteringTracker\.recordRestore\(element\)/);
  assert.match(toggle, /decrementHiddenStats\(element\)/);
  assert.match(toggle, /element\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(toggle, /element\.style\.removeProperty\('display'\)/);
  assert.match(toggle, /handleMediaPlayback\(element, true\)/);
  assert.match(toggle, /handleMediaPlayback\(element, false\)/);
});

test('skipStats currently suppresses stats and tracker calls but not media playback side effects', () => {
  const text = read('js/content/dom_helpers.js');
  const toggle = sliceBetween(
    text,
    'function toggleVisibility(element, shouldHide, reason = \'\', skipStats = false) {',
    'function updateContainerVisibility(container, childSelector) {'
  );

  assert.match(toggle, /if \(!skipStats\) \{\s*filteringTracker\.recordHide\(element, reason\);/);
  assert.match(toggle, /if \(!skipStats\) \{\s*incrementHiddenStats\(element\);/);
  assert.match(toggle, /if \(!skipStats\) \{\s*filteringTracker\.recordRestore\(element\);/);
  assert.match(toggle, /if \(!skipStats\) \{\s*decrementHiddenStats\(element\);/);
  assert.ok(
    toggle.indexOf('handleMediaPlayback(element, true)') > toggle.indexOf('incrementHiddenStats(element);'),
    'media hide side effect should currently run after stats logic'
  );
  assert.ok(toggle.includes('        handleMediaPlayback(element, true);'));
  assert.ok(toggle.includes('        handleMediaPlayback(element, false);'));
});

test('content bridge stats currently use surface-aware storage plus legacy main stats fallback', () => {
  const text = read('js/content_bridge.js');
  const init = sliceBetween(
    text,
    'function initializeStats() {',
    'function getContentType(element) {'
  );
  const save = sliceBetween(
    text,
    'function saveStats() {',
    'function handleMediaPlayback(element, shouldHide) {'
  );

  assert.match(init, /chrome\.storage\.local\.get\(\['stats', 'statsBySurface'\]/);
  assert.match(init, /const surface = getStatsSurfaceKey\(\)/);
  assert.match(init, /const picked = \(bySurface\[surface\]/);
  assert.match(init, /const effective = picked \|\| \(surface === 'main' \? legacy : \{\}\)/);
  assert.match(save, /const surface = getStatsSurfaceKey\(\)/);
  assert.match(save, /const statsBySurface = \{/);
  assert.match(save, /\[surface\]: nextStats/);
  assert.match(save, /payload\.stats = nextStats/);
});

test('content bridge increment stats currently trusts hide caller after local container checks', () => {
  const text = read('js/content_bridge.js');
  const increment = sliceBetween(
    text,
    'function incrementHiddenStats(element) {',
    'function decrementHiddenStats(element) {'
  );

  assert.match(increment, /const contentType = getContentType\(element\)/);
  assert.match(increment, /if \(title === 'Unknown' \|\| title === 'Albums'/);
  assert.match(increment, /const hasVideoLink = element\.querySelector\('a\[href\*="\/watch\?"\]'\)/);
  assert.match(increment, /if \(contentType !== 'short' && !hasVideoLink && !hasShortsLink\)/);
  assert.match(increment, /if \(contentType === 'shelf' \|\| contentType === 'playlist' \|\| contentType === 'mix'\)/);
  assert.match(increment, /statsCountToday\+\+/);
  assert.match(increment, /statsTotalSeconds \+= secondsSaved/);
  assert.match(increment, /element\.setAttribute\('data-filtertube-time-saved', secondsSaved\.toString\(\)\)/);
  assert.match(increment, /saveStats\(\)/);
  assert.doesNotMatch(increment, /hideDecisionId|statsSideEffectAuthority|trustedSender|routeScoped/);
});

test('content bridge restore currently decrements only from element time-saved attribute', () => {
  const text = read('js/content_bridge.js');
  const decrement = sliceBetween(
    text,
    'function decrementHiddenStats(element) {',
    'function saveStats() {'
  );

  assert.match(decrement, /if \(statsCountToday <= 0\) return/);
  assert.match(decrement, /parseFloat\(element\?\.getAttribute\('data-filtertube-time-saved'\) \|\| '0'\)/);
  assert.match(decrement, /statsCountToday = Math\.max\(0, statsCountToday - 1\)/);
  assert.match(decrement, /statsTotalSeconds = Math\.max\(0, statsTotalSeconds - savedTime\)/);
  assert.match(decrement, /element\.removeAttribute\('data-filtertube-time-saved'\)/);
  assert.doesNotMatch(decrement, /hideDecisionId|priorCountedElement|surface/);
});

test('background recordTimeSaved currently accepts raw caller seconds into legacy stats', () => {
  const text = read('js/background.js');
  const block = sliceBetween(
    text,
    '} else if (request.action === "recordTimeSaved")',
    'else if (request.action === "fetchChannelDetails")'
  );

  assert.match(block, /browserAPI\.storage\.local\.get\(\['stats'\]/);
  assert.match(block, /const stats = result\.stats \|\| \{ savedSeconds: 0, hiddenCount: 0 \}/);
  assert.match(block, /const oldSeconds = stats\.savedSeconds \|\| 0/);
  assert.match(block, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\)/);
  assert.match(block, /browserAPI\.storage\.local\.set\(\{ stats \}\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|Number\.isFinite|Math\.max|statsBySurface|senderClass/);
});

test('StateManager currently loads statsBySurface but external reload watches only legacy stats', () => {
  const text = read('js/state_manager.js');
  const load = sliceBetween(
    text,
    'state.stats = data.stats ||',
    'state.contentFilters = data.contentFilters ?'
  );
  const save = sliceBetween(
    text,
    'async function saveSettings({ broadcast = true, profile = \'main\' } = {}) {',
    'async function addKeyword(word, options = {}) {'
  );
  const reloadKeys = sliceBetween(
    text,
    'const storageKeys = [',
    'const hasSettingsChange = storageKeys.some'
  );

  assert.match(load, /state\.stats = data\.stats \|\| \{ hiddenCount: 0, savedMinutes: 0 \}/);
  assert.match(load, /state\.statsBySurface = \(data\.statsBySurface/);
  assert.doesNotMatch(save, /statsBySurface|stats:/);
  assert.match(reloadKeys, /'stats'/);
  assert.doesNotMatch(reloadKeys, /'statsBySurface'/);
});

test('dashboard currently reads statsBySurface first and clamps only at display formatting', () => {
  const text = read('js/tab-view.js');
  const statsBlock = sliceBetween(
    text,
    'function getDashboardSurfaceStats(surface, state) {',
    '// Initial render'
  );

  assert.match(statsBlock, /state\.statsBySurface/);
  assert.match(statsBlock, /const picked = bySurface\[surface\]/);
  assert.match(statsBlock, /if \(picked\) return picked/);
  assert.match(statsBlock, /if \(surface === 'main'\) return state\?\.stats \|\| \{\}/);
  assert.match(statsBlock, /function formatSavedTime\(totalSeconds\) \{/);
  assert.match(statsBlock, /Number\.isFinite\(totalSeconds\)/);
  assert.match(statsBlock, /Math\.max\(0, totalSeconds\)/);
  assert.match(statsBlock, /statSavedTime\.textContent = formatSavedTime\(surfaceStats\?\.savedSeconds \|\| 0\)/);
});
