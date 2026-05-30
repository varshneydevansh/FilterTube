import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('identity_resolver_fanout_doc_is_audit_only_and_scopes_the_resolver_layer', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /resolver layer/);
  assert.match(source, /passive menu enrichment, clicked-target recovery,\s+DOM fallback repair, background resolver fetches, or post-action fanout/i);
  assert.match(source, /no single\s+`identityResolverAuthority`/);
});

test('identity_resolver_fanout_doc_lists_every_current_resolver_class', () => {
  const source = doc();

  for (const resolverClass of [
    '`menu-open-mainworld-lookup`',
    '`clicked-target-videoid-recovery`',
    '`clicked-target-retry-fallback`',
    '`dom-fallback-handle-repair`',
    '`background-shorts-identity`',
    '`background-watch-identity`',
    '`background-kids-watch-identity`',
    '`post-block-shorts-fanout`',
    '`post-block-playlist-fanout`'
  ]) {
    assert.ok(source.includes(resolverClass), `missing resolver class ${resolverClass}`);
  }
});

test('identity_resolver_fanout_is_source_backed_for_menu_click_and_retry_paths', () => {
  const source = doc();
  const bridge = read('js/content_bridge.js');

  for (const token of [
    'injectFilterTubeMenuItem(dropdown, videoCard)',
    'initialChannelInfo.needsFetch = true',
    'searchYtInitialDataForVideoChannel(initialChannelInfo.videoId',
    'fetchIdForHandle(finalChannelInfo.handle, { skipNetwork: true })',
    "input = `${useShortsResolver ? 'shorts' : 'watch'}:${String(channelInfo.videoId).trim()}`",
    'input = clickSnapshot?.videoId ? `watch:${clickSnapshot.videoId}` : mappedWatchChannelId',
    'Retrying block with background watch resolver:',
    'fetchChannelFromShortsUrl(channelInfo.videoId, expectedHandle, { allowDirectFetch: true })'
  ]) {
    assert.ok(bridge.includes(token), `missing bridge token ${token}`);
  }

  assert.match(source, /clicked exact-target recovery/);
  assert.match(source, /legacy direct watch page fetch/);
});

test('identity_resolver_fanout_is_source_backed_for_background_resolvers_and_kids_boundary', () => {
  const source = doc();
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  for (const token of [
    "action: 'fetchWatchIdentity'",
    "type: 'fetchWatchIdentity'",
    "action: 'fetchShortsIdentity'",
    "type: 'fetchShortsIdentity'"
  ]) {
    assert.ok(bridge.includes(token), `missing bridge resolver token ${token}`);
  }

  for (const token of [
    "} else if (action === 'fetchShortsIdentity') {",
    "} else if (action === 'fetchWatchIdentity') {",
    "const profileType = request?.profileType === 'kids' ? 'kids' : 'main';",
    "performKidsWatchIdentityFetch(videoId) || await performWatchIdentityFetch(videoId)",
    'fetch(`https://www.youtube.com/shorts/${videoId}`',
    'fetch(`https://www.youtubekids.com/watch?v=${videoId}`',
    'fetch(`https://www.youtube.com/watch?v=${videoId}`'
  ]) {
    assert.ok(background.includes(token), `missing background resolver token ${token}`);
  }

  assert.match(source, /Kids is not zero-network in all cases/);
  assert.match(source, /guarded last-resort resolver/);
});

test('identity_resolver_fanout_is_source_backed_for_dom_fallback_repair_and_post_block_fanout', () => {
  const source = doc();
  const bridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const background = read('js/background.js');

  assert.ok(domFallback.includes('fetchIdForHandle(`@${safeKey}`, { skipNetwork: true, backgroundOnly: true });'));
  assert.ok(handleResolver.includes("action: 'fetchChannelDetails'"));
  assert.ok(handleResolver.includes("type: 'FilterTube_UpdateChannelMap'"));
  assert.ok(background.includes('fetchChannelInfo(request.channelIdOrHandle)'));

  for (const token of [
    'enrichVisibleShortsWithChannelInfo(channelInfo.id, refreshedSettings || currentSettings)',
    'enrichVisiblePlaylistRowsWithChannelInfo(channelInfo.id, refreshedSettings || currentSettings)',
    'fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false })',
    'fetchWatchIdentityFromBackground(videoId)',
    'const MAX_CONCURRENT = 3'
  ]) {
    assert.ok(bridge.includes(token), `missing fanout token ${token}`);
  }

  assert.match(source, /post-action visible-sibling fanout/);
  assert.match(source, /DOM fallback unresolved-rule repair/);
});

test('identity_resolver_fanout_doc_preserves_local_guardrails_before_future_changes', () => {
  const source = doc();

  for (const guardrail of [
    'Menu injection exits in whitelist mode',
    'showBlockMenuItem === false',
    'fetchIdForHandle(..., { skipNetwork: true })',
    'allowDirectFetch: false',
    'Playlist fanout uses `videoChannelMap` before background watch fetch',
    'partial stream limits',
    'Immediate optimistic hide is scoped to the clicked target'
  ]) {
    assert.ok(source.includes(guardrail), `missing guardrail ${guardrail}`);
  }
});

test('identity_resolver_fanout_has_no_runtime_authority_yet', () => {
  const source = doc();
  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/handle_resolver.js',
    'js/background.js'
  ].map(read).join('\n');

  for (const token of [
    'identityResolverAuthority',
    'identityResolverDecision',
    'identityResolverReason',
    'identityResolverTargetScope',
    'identityResolverNetworkPolicy',
    'postActionIdentityFanoutBudget'
  ]) {
    assert.ok(source.includes(token), `doc missing future token ${token}`);
    assert.doesNotMatch(runtime, new RegExp(token), `runtime unexpectedly defines ${token}`);
  }
});
