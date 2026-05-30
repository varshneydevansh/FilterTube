import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('identity_work_budget_is_audit_only_and_separates_source_confidence_from_work_permission', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Source Confidence Is Not Work Permission/);
  assert.match(source, /source confidence\s+answers: how trustworthy is this identity/i);
  assert.match(source, /work budget\s+answers: should this route\/settings\/action state spend CPU, DOM, storage,\s+or network work/i);
  assert.match(source, /A future optimization must not delete needed identity\s+fallbacks/);
  assert.match(source, /must not keep broad identity\s+work alive/);
});

test('identity_work_budget_lists_current_identity_work_classes', () => {
  const source = doc();

  for (const workClass of [
    '`endpoint-body-work`',
    '`harvest-only-work`',
    '`page-global-hook-work`',
    '`learned-map-write-work`',
    '`dom-stamp-rerun-work`',
    '`metadata-map-work`',
    '`target-resolver-fetch`',
    '`post-action-fanout`',
    '`stale-restore-scan`'
  ]) {
    assert.ok(source.includes(workClass), `missing work class ${workClass}`);
  }
});

test('identity_work_budget_is_source_backed_for_endpoint_map_dom_and_resolver_work', () => {
  const source = doc();
  const seed = read('js/seed.js');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const domFallback = read('js/content/dom_fallback.js');

  for (const token of [
    'response.clone().json()',
    'FilterTubeEngine.harvestOnly',
    'window.__filtertubeXhrInterceptionInstalled'
  ]) {
    assert.ok(seed.includes(token), `missing seed token ${token}`);
  }

  for (const token of [
    'persistVideoChannelMapping(videoId, channelId)',
    'applyDOMFallback(null)',
    'scheduleVideoMetaDomRerun',
    'fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false })',
    'fetchWatchIdentityFromBackground(videoId)',
    'enrichVisibleShortsWithChannelInfo(channelInfo.id',
    'enrichVisiblePlaylistRowsWithChannelInfo(channelInfo.id'
  ]) {
    assert.ok(bridge.includes(token), `missing bridge token ${token}`);
  }

  for (const token of [
    'performShortsIdentityFetch(videoId',
    'performKidsWatchIdentityFetch(videoId',
    'performWatchIdentityFetch(videoId',
    'enqueueVideoChannelMapUpdate(request.videoId, request.channelId)',
    'enqueueVideoMetaMapUpdate(videoId, entry)'
  ]) {
    assert.ok(background.includes(token), `missing background token ${token}`);
  }

  assert.ok(domFallback.includes('clearStaleDOMFallbackVisibility()'));
  assert.match(source, /Current Work Classes/);
});

test('identity_work_budget_pins_no_rule_and_empty_state_boundaries', () => {
  const source = doc();

  for (const phrase of [
    'No-Rule And Empty-State Boundary',
    'The pure engine can leave simple videos intact in empty blocklist mode',
    'page runtime still has independent work surfaces',
    'no endpoint body work',
    'no harvest work',
    'no map writes',
    'no DOM stamp/rerun',
    'no stale cleanup scan',
    'no resolver fetch',
    'no post-action fanout',
    'disabled, empty, no-actionable-rule, route, mode, and profile'
  ]) {
    assert.ok(source.includes(phrase), `missing no-rule boundary phrase ${phrase}`);
  }
});

test('identity_work_budget_pins_post_action_fanout_beyond_the_clicked_target', () => {
  const source = doc();

  for (const phrase of [
    'Post-Action Fanout Boundary',
    'not limited to one clicked card after',
    'enrich visible Shorts for the blocked UC id',
    'enrich visible playlist rows for the blocked UC id',
    'visible siblings',
    'same-channel cleanup',
    'fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false })',
    'fetchWatchIdentityFromBackground(videoId)',
    'network and DOM fanout need explicit reporting and limits'
  ]) {
    assert.ok(source.includes(phrase), `missing fanout phrase ${phrase}`);
  }
});

test('identity_work_budget_has_no_runtime_authority_yet', () => {
  const source = doc();
  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ].map(read).join('\n');

  for (const token of [
    'identityWorkBudget',
    'identityWorkBudgetReport',
    'identityWorkBudgetDecision',
    'postActionIdentityFanoutBudget',
    'noRuleIdentityWorkCounter'
  ]) {
    assert.ok(source.includes(token), `doc missing future token ${token}`);
    assert.doesNotMatch(runtime, new RegExp(token), `runtime unexpectedly defines ${token}`);
  }
});
