import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('surface_information_availability_doc_is_audit_only_and_lists_all_high_risk_surfaces', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);

  for (const surface of [
    'Main home/search',
    'Main watch current video',
    'Shorts',
    'Watch rail, watch cards, and end screen',
    'Watch playlist / Mix',
    'YouTube Kids',
    'YouTube Music',
    'Collaborator / showDialog / showSheet / avatar-stack',
    'Posts/community/comments'
  ]) {
    assert.ok(source.includes(surface), `missing surface row ${surface}`);
  }
});

test('surface_information_availability_doc_defines_confidence_tiers', () => {
  const source = doc();

  for (const tier of [
    '`canonical`',
    '`joinedByVideoId`',
    '`displayOnly`',
    '`fallback`',
    '`unknown`'
  ]) {
    assert.ok(source.includes(tier), `missing confidence tier ${tier}`);
  }

  assert.match(source, /video id is a join key, not channel identity/);
  assert.match(source, /display\s+name is a UI clue, not canonical identity/);
  assert.match(source, /learned map is useful cross-surface\s+memory, but it is `joinedByVideoId`/);
});

test('surface_information_availability_watch_and_shorts_dom_are_video_id_only_boundaries', () => {
  const source = doc();

  assert.match(source, /URL `v=VIDEO_ID` plus map is `joinedByVideoId`/);
  assert.match(source, /owner row text is `displayOnly`/);
  assert.match(source, /\/shorts\/VIDEO_ID` is `joinedByVideoId`, not channel\/title proof/);
  assert.match(source, /Shorts DOM link and `data-filtertube-video-id` are safe video id join keys only/);

  const bridge = read('js/content_bridge.js');
  assert.ok(bridge.includes('href.match(/\\/shorts\\/([a-zA-Z0-9_-]{11})/)'));
  assert.match(bridge, /useShortsResolver \? 'shorts' : 'watch'/);

  const fallback = read('js/content/dom_fallback.js');
  assert.match(fallback, /settings\?\.videoChannelMap\?\.\[videoId\]/);
  assert.match(fallback, /mappedIdAuthoritative: true/);
});

test('surface_information_availability_learned_maps_are_joined_identity_not_canonical_source', () => {
  const source = doc();

  assert.match(source, /`videoChannelMap` joins are `joinedByVideoId`/);
  assert.match(source, /learned map is useful cross-surface\s+memory, but it is `joinedByVideoId`/);
  assert.match(source, /current surface exposes a video id, and FilterTube joins that id to learned or fetched identity/);

  const filter = read('js/filter_logic.js');
  assert.match(filter, /FilterTube_UpdateVideoChannelMap/);
  assert.match(filter, /_registerVideoChannelMapping\(videoId, ownerId\)/);
  assert.match(filter, /kidsVideoOwnerExtension\?\.externalChannelId/);
});

test('surface_information_availability_background_fetch_is_fallback_not_passive_authority', () => {
  const source = doc();

  assert.match(source, /Background fallback fields/);
  assert.match(source, /explicit resolver after current JSON\/maps\/DOM were insufficient/);
  assert.match(source, /`watch:VIDEO_ID`/);
  assert.match(source, /`shorts:VIDEO_ID`/);
  assert.match(source, /Kids watch fetch is `fallback`/);
  assert.match(source, /fetch is allowed by active rule state and user\/action class/);

  const background = read('js/background.js');
  assert.match(background, /performShortsIdentityFetch\(videoId, normalizedHandle\)/);
  assert.match(background, /performKidsWatchIdentityFetch\(videoId\)/);
  assert.match(background, /performWatchIdentityFetch\(videoId\)/);
  assert.match(background, /fetch\(`https:\/\/www\.youtube\.com\/shorts\/\$\{videoId\}`/);
  assert.match(background, /fetch\(`https:\/\/www\.youtubekids\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(background, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
});

test('surface_information_availability_renderer_gap_terms_are_pinned', () => {
  const source = doc();

  for (const term of [
    'showDialogCommand',
    'showSheetCommand',
    'compactPlaylistRenderer',
    'compactAutoplayRenderer',
    'watchCardRichHeaderRenderer',
    'watchCardHeroVideoRenderer',
    'endScreenVideoRenderer',
    'kidsVideoOwnerExtension',
    'videoOwnerChannelId',
    'ownerProfileUrl',
    'videoChannelMap'
  ]) {
    assert.ok(source.includes(term), `missing renderer/source term ${term}`);
  }
});

test('surface_information_availability_no_runtime_authority_exists_yet', () => {
  const source = doc();
  assert.match(source, /No runtime symbol named `surfaceInformationAvailability`/);
  assert.match(source, /This document is the current\s+audit record, not an implemented authority/);

  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ].map(read).join('\n');

  assert.doesNotMatch(runtime, /surfaceInformationAvailability/);
  assert.doesNotMatch(runtime, /surfaceInformationAvailabilityAuthority/);
  assert.doesNotMatch(runtime, /surfaceIdentityAvailabilityAuthority/);
});
