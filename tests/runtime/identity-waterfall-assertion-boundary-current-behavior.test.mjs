import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_WATERFALL_ASSERTION_BOUNDARY_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('identity_waterfall_assertion_boundary_is_audit_only_and_corrects_the_shorthand', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /XHR JSON -> ytInitial\* -> DOM -> network fetch/);
  assert.match(source, /source-confidence waterfall/);
  assert.match(source, /`JSON-first` is only a priority order/);
  assert.match(source, /not an implementation-ready guarantee/);
});

test('identity_waterfall_assertion_boundary_rejects_overbroad_json_dom_and_zero_network_claims', () => {
  const source = doc();

  for (const phrase of [
    'XHR JSON always has enough identity before DOM render',
    'Incorrect. Some watch, Shorts, playlist, Kids, YTM, post, and collaborator surfaces can be sparse or delayed.',
    'DOM can be a canonical fallback for channel identity.',
    'Only sometimes.',
    '`videoId` means channel identity is known.',
    'Incorrect. `videoId` is a join key.',
    'Network fetch is gone because proactive identity exists.',
    'Incorrect. Watch, Shorts, Kids watch, channel-detail, some action fallback paths, and current post-block Shorts/playlist enrichment can still use background fetch',
    'This is a resolver/enrichment layer, not proof that every fetch is exact-target only.',
    'Each feature still needs route, mode, source-confidence, side-effect, no-work, and restore proof.'
  ]) {
    assert.ok(source.includes(phrase), `missing boundary phrase: ${phrase}`);
  }
});

test('channel_blocking_reference_doc_pins_json_preferred_waterfall_without_effect_permission', () => {
  const source = read('docs/CHANNEL_BLOCKING_SYSTEM.md');

  assert.match(source, /FilterTube uses a \*\*JSON-first identity strategy\*\*/);
  assert.match(source, /not a guarantee\s+that identity exists before DOM render/);
  assert.match(source, /The practical waterfall priority is:/);
  assert.match(source, /1\. \*\*XHR JSON interception\*\*/);
  assert.match(source, /2\. \*\*`ytInitial\*` snapshots\*\*/);
  assert.match(source, /3\. \*\*Harvested learned maps\*\*/);
  assert.match(source, /4\. \*\*DOM extraction\*\*/);
  assert.match(source, /5\. \*\*Network fetch \/ resolver enrichment\*\* \(Background, last-resort resolver\s+and post-action enrichment layer\)/);
  assert.match(source, /not automatic permission to hide, fetch, mutate, stamp,\s+or persist/);
  assert.match(source, /`videoId` as a join key/);
  assert.match(source, /background resolver\/enrichment layer when the\s+current target still lacks usable identity/);
  assert.match(source, /not proof of exact\s+clicked-target scope by itself/);
  assert.match(source, /current successful channel blocks can also\s+trigger visible Shorts and playlist-row enrichment/);
  assert.match(source, /Any\s+documentation or implementation change that claims "instant," "before render," or "zero network" must first prove that claim/);

  assert.doesNotMatch(source, /proactive, XHR-first strategy/i);
  assert.doesNotMatch(source, /ensuring instant blocking/i);
  assert.doesNotMatch(source, /network fetch.*rare fallback/i);
  assert.doesNotMatch(source, /All network fetches are skipped on Kids surfaces/i);

  const networkDoc = read('docs/NETWORK_REQUEST_PIPELINE.md');
  assert.match(networkDoc, /JSON-aware identity pipeline/);
  assert.match(networkDoc, /source-confidence layer rather than a guarantee/);
  assert.doesNotMatch(networkDoc, /proactive, XHR-first/i);
});

test('public_readme_shorts_identity_wording_keeps_video_id_join_and_resolver_boundary', () => {
  const source = read('README.md');

  assert.match(source, /Shorts blocking is fastest when FilterTube already has a\s+stable `videoId -> UC\.\.\.` mapping/);
  assert.match(source, /Some Shorts surfaces still expose only `\/shorts\/VIDEO_ID` at\s+first/);
  assert.match(source, /video id is treated as a join key until a stronger owner source\s+is available/);
  assert.match(source, /may use a bounded watch\/Shorts resolver/);
  assert.match(source, /slower, route-specific, and still needs the same source-confidence/);
  assert.match(source, /side-effect proof as the rest of the identity waterfall/);

  assert.doesNotMatch(source, /In rare cases where the card does not expose a `UC\.\.\.` link/);
  assert.doesNotMatch(source, /fallbacks? to a slower network-based resolution.*guarantee correctness/i);
  assert.doesNotMatch(source, /Shorts blocking is often \*\*near-instant\*\*/);
});

test('identity_waterfall_assertion_boundary_is_source_backed_for_all_current_layers', () => {
  const source = doc();
  const seed = read('js/seed.js');
  const filter = read('js/filter_logic.js');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  for (const layer of [
    'Fetch interception',
    'XHR interception',
    'Page globals',
    'Player/watch owner harvest',
    'Renderer harvest',
    'Learned maps',
    'DOM target extraction',
    'Background resolver and post-action enrichment'
  ]) {
    assert.ok(source.includes(layer), `missing source layer ${layer}`);
  }

  assert.match(seed, /\/youtubei\/v1\/search/);
  assert.match(seed, /\/youtubei\/v1\/player/);
  assert.match(seed, /Object\.defineProperty\(window, 'ytInitialData'/);
  assert.match(seed, /Object\.defineProperty\(window, 'ytInitialPlayerResponse'/);
  assert.match(filter, /videoOwnerChannelId/);
  assert.match(filter, /kidsVideoOwnerExtension/);
  assert.match(filter, /_registerVideoChannelMapping\(videoId, ownerId\)/);
  assert.match(bridge, /data-filtertube-video-id/);
  assert.match(bridge, /useShortsResolver \? 'shorts' : 'watch'/);
  assert.match(bridge, /enrichVisibleShortsWithChannelInfo\(channelInfo\.id/);
  assert.match(bridge, /enrichVisiblePlaylistRowsWithChannelInfo\(channelInfo\.id/);
  assert.match(background, /performShortsIdentityFetch\(videoId, normalizedHandle\)/);
  assert.match(background, /performKidsWatchIdentityFetch\(videoId\)/);
  assert.match(background, /performWatchIdentityFetch\(videoId\)/);
});

test('identity_waterfall_assertion_boundary_lists_surface_exceptions_before_behavior_changes', () => {
  const source = doc();

  for (const surface of [
    'Shorts',
    'Main watch current video',
    'Watch rail / end screen',
    'Playlist / Mix',
    'YouTube Kids',
    'YouTube Music',
    'Collaborator menus',
    'Posts/comments'
  ]) {
    assert.ok(source.includes(surface), `missing surface exception ${surface}`);
  }

  for (const required of [
    '`canonical`',
    '`joinedByVideoId`',
    '`displayOnly`',
    '`fallback`',
    '`unknown`',
    'positive matching fixtures',
    'negative nonmatching/sibling-visible fixtures',
    'restore or teardown proof'
  ]) {
    assert.ok(source.includes(required), `missing required proof term ${required}`);
  }
});

test('identity_waterfall_assertion_boundary_has_no_runtime_authority_yet', () => {
  const source = doc();
  assert.match(source, /No runtime symbol exists yet/);
  assert.match(source, /identityWorkBudget/);

  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ].map(read).join('\n');

  assert.doesNotMatch(runtime, /identityWaterfallAssertionAuthority/);
  assert.doesNotMatch(runtime, /sourceConfidenceDecision/);
  assert.doesNotMatch(runtime, /identitySourceTier/);
  assert.doesNotMatch(runtime, /identityFetchReasonBudget/);
  assert.doesNotMatch(runtime, /identityWorkBudget/);
});
