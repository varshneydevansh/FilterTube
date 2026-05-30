import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SOURCE_TIER_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function runtimeSource() {
  return [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ].map(read).join('\n');
}

test('source_tier_effect_authority_doc_is_audit_only_and_rejects_waterfall_as_effect_permission', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /where FilterTube prefers to learn information/);
  assert.match(source, /does not describe what that information is allowed to do/);
  assert.match(source, /source tier -> route\/surface -> settings mode -> confidence -> allowed effects/);
});

test('source_tier_effect_authority_doc_lists_all_current_source_tiers_and_effect_classes', () => {
  const source = doc();

  for (const tier of [
    'YouTubei fetch/XHR JSON',
    '`ytInitialData` / `ytInitialPlayerResponse`',
    'Learned maps',
    'DOM extraction',
    'Network fallback'
  ]) {
    assert.ok(source.includes(tier), `missing source tier ${tier}`);
  }

  for (const effect of [
    'harvest identity only',
    'mutate YouTube JSON',
    'hide a DOM card',
    'restore a stale DOM hide',
    'stamp learned identity onto DOM',
    'persist a map',
    'open/fetch a resolver',
    'optimistic-hide a user-clicked target',
    'count a stat or time-saved event'
  ]) {
    assert.ok(source.includes(effect), `missing effect class ${effect}`);
  }
});

test('source_tier_effect_authority_source_backs_endpoint_json_effects', () => {
  const source = doc();
  const seed = read('js/seed.js');
  const filter = read('js/filter_logic.js');

  assert.match(source, /endpoint clone\/parse, `harvestOnly`, full `processData`, JSON renderer removal/);
  assert.match(seed, /function shouldSkipEngineProcessing\(data, dataName\)/);
  assert.match(seed, /window\.FilterTubeEngine\.harvestOnly\(data, cachedSettings/);
  assert.match(seed, /window\.FilterTubeEngine\.processData\(data, cachedSettings, dataName\)/);
  assert.match(seed, /stashNetworkSnapshot\(result, dataName\)/);
  assert.match(filter, /_shouldBlock\(item, rendererType\)/);
  assert.match(filter, /return true;/);
});

test('source_tier_effect_authority_source_backs_learned_map_side_effects', () => {
  const source = doc();
  const bridge = read('js/content_bridge.js');
  const filter = read('js/filter_logic.js');
  const background = read('js/background.js');

  assert.match(source, /persist map, stamp DOM cards, rerun DOM fallback/);
  assert.match(filter, /FilterTube_UpdateVideoChannelMap/);
  assert.match(filter, /_registerVideoChannelMapping\(videoId, ownerId\)/);
  assert.match(bridge, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(bridge, /stampChannelIdentity\(card, \{ id: channelId \}, \{ scheduleFallback: false \}\)/);
  assert.match(bridge, /applyDOMFallback\(null\)/);
  assert.match(background, /videoChannelMapFlushTimer = setTimeout/);
});

test('source_tier_effect_authority_source_backs_dom_and_menu_side_effects', () => {
  const source = doc();
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');

  assert.match(source, /card\/menu target extraction, DOM scan, pending whitelist hide, direct hide/);
  assert.match(fallback, /function hasActiveDOMFallbackWork\(settings\)/);
  assert.match(fallback, /function applyDOMFallback/);
  assert.match(fallback, /shouldHideContent/);
  assert.match(bridge, /recordOptimisticHide/);
  assert.match(bridge, /restoreOptimisticHide/);
  assert.match(bridge, /addChannelDirectly/);
});

test('source_tier_effect_authority_source_backs_network_fallback_and_fanout_classes', () => {
  const source = doc();
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  for (const phrase of [
    'clicked-target `watch:VIDEO_ID` recovery',
    'clicked-target `shorts:VIDEO_ID` recovery',
    'Kids watch identity recovery',
    'channel-detail fetch for unresolved menu targets',
    'post-block Shorts and playlist-row enrichment'
  ]) {
    assert.ok(source.includes(phrase), `missing resolver class ${phrase}`);
  }

  assert.match(bridge, /useShortsResolver \? 'shorts' : 'watch'/);
  assert.match(bridge, /Retrying block with background watch resolver/);
  assert.match(bridge, /fetchChannelFromShortsUrl/);
  assert.match(bridge, /enrichVisibleShortsWithChannelInfo/);
  assert.match(bridge, /enrichVisiblePlaylistRowsWithChannelInfo/);
  assert.match(background, /performShortsIdentityFetch\(videoId, normalizedHandle\)/);
  assert.match(background, /performKidsWatchIdentityFetch\(videoId\)/);
  assert.match(background, /performWatchIdentityFetch\(videoId\)/);
  assert.match(background, /fetch\(`https:\/\/www\.youtube\.com\/shorts\/\$\{videoId\}`/);
  assert.match(background, /fetch\(`https:\/\/www\.youtubekids\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(background, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
});

test('source_tier_effect_authority_requires_future_decision_fields_before_behavior_changes', () => {
  const source = doc();

  for (const field of [
    'profileId',
    'routeSurface',
    'endpointFamily',
    'rendererFamily',
    'listMode',
    'sourceTier',
    'sourceConfidence',
    'sourceFreshness',
    'userActionClass',
    'allowedEffects',
    'deniedEffects',
    'noWorkReason',
    'fallbackReason',
    'mapWritePolicy',
    'domScanPolicy',
    'hidePolicy',
    'restorePolicy',
    'statsPolicy',
    'networkPolicy'
  ]) {
    assert.ok(source.includes(field), `missing future authority field ${field}`);
  }

  for (const fixture of [
    'Empty blocklist Main home/search',
    'Empty whitelist',
    'Shorts and watch video-id-only DOM',
    'Learned map hit',
    'DOM display-only name',
    'User-clicked menu resolver',
    'Post-block enrichment',
    'Restore proof'
  ]) {
    assert.ok(source.includes(fixture), `missing future fixture ${fixture}`);
  }
});

test('source_tier_effect_authority_has_no_runtime_authority_symbols_yet', () => {
  const source = doc();
  assert.match(source, /No runtime symbol exists yet/);

  const runtime = runtimeSource();
  for (const token of [
    'sourceTierEffectAuthority',
    'sourceTierEffectDecision',
    'sourceConfidenceDecision',
    'identityWorkBudgetDecision',
    'hideDecisionAuthority',
    'resolverEffectBudget'
  ]) {
    assert.ok(source.includes(token), `doc should name missing token ${token}`);
    assert.doesNotMatch(runtime, new RegExp(token), `runtime unexpectedly has ${token}`);
  }
});
