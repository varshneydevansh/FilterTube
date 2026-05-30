import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOMS_HTML_MUTATED_MAIN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-doms-mutated-main-dom.html';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLines(text) {
  return (text.match(/\n/g) || []).length;
}

test('doms_html_raw_shape_is_mixed_main_dom_already_mutated_by_filtertube', () => {
  const raw = read('DOMs.html');

  assert.equal(sha256('DOMs.html'), '1e36cfc6bdf9272f1febe54445646ea26c482d4346114727a363cee8cf042c5e');
  assert.equal(countLines(raw), 6759);

  for (const heading of [
    'MIX CARD DOM HOME PAGE',
    'NORMAL VIDEO DOM HOME PAGE -',
    'COLLAB VIDEO DOM HOME PAGE',
    'PLAYLIST DOM SEARCH PAGE',
    'NORMAL VIDEO DOM SERACH PAGE',
    'SEARCH PAGE COLLAB VIDEO DOM',
    'VIDEO IN MIX PLAYER WATCH PAGE',
    'LIVE VIDEO IN RIGHT RAIL WATCH PAGE',
    'PLAYLIST DOM ON WATHC PAGE RIGHT RAIL',
    'MIX CARD ON WATCH PAGE RIGHT RAIL',
    'SHORT VIDEO RIGHT RAIL WATCH PAGE'
  ]) {
    assert.ok(raw.includes(heading), `missing raw DOM heading ${heading}`);
  }

  for (const marker of [
    'filtertube-quick-block-host',
    'filtertube-quick-block-anchor',
    'filtertube-quick-block-wrap',
    'filtertube-quick-block-btn',
    'filtertube-playlist-menu-fallback-btn',
    'data-filtertube-processed',
    'data-filtertube-last-processed-mode',
    'data-filtertube-video-id',
    'data-filtertube-channel-id',
    'data-filtertube-collaborators'
  ]) {
    assert.ok(raw.includes(marker), `missing FilterTube mutation marker ${marker}`);
  }
});

test('doms_html_raw_shape_is_not_clean_post_or_community_capture', () => {
  const raw = read('DOMs.html');

  for (const pattern of [
    /<ytd-post-renderer\b/,
    /<ytm-backstage-post-thread-renderer\b/,
    /<ytm-backstage-post-renderer\b/,
    /<yt-post-header\b/,
    /ytPostHeaderHostActionMenu/,
    /href="\/post\//,
    /\bpostRenderer\b/,
    /\bsharedPostRenderer\b/
  ]) {
    assert.doesNotMatch(raw, pattern);
  }

  assert.match(raw, /amsterdam-post-mvp=""/);
});

test('doms_html_reduced_fixture_pins_mutated_main_surfaces', () => {
  const html = read(fixturePath);

  assert.match(html, /Reduced from ignored raw capture: DOMs\.html/);
  assert.match(html, /data-source-capture="DOMs\.html"/);
  assert.match(html, /data-current-filtertube-mutated="true"/);
  assert.match(html, /data-raw-heading="MIX CARD DOM HOME PAGE"/);
  assert.match(html, /data-filtertube-video-id="6cfCgLgiFDM"/);
  assert.match(html, /class="filtertube-playlist-menu-fallback-btn"/);
  assert.match(html, /data-filtertube-fallback-surface="ytd-lockup"/);
  assert.match(html, /data-raw-heading="NORMAL VIDEO DOM HOME PAGE -"/);
  assert.match(html, /data-filtertube-video-id="om2lIWXLLN4"/);
  assert.match(html, /href="\/@anthropic-ai"/);
  assert.match(html, /data-filtertube-channel-handle="@anthropic-ai"/);
  assert.match(html, /aria-label="More actions"/);
  assert.match(html, /data-raw-heading="SEARCH PAGE COLLAB VIDEO DOM"/);
  assert.match(html, /data-filtertube-video-id="41ZY18JqI2A"/);
  assert.match(html, /yt-avatar-stack-view-model/);
  assert.match(html, /aria-label="Collaboration channels"/);
  assert.match(html, /data-raw-heading="PLAYLIST DOM ON WATHC PAGE RIGHT RAIL"/);
  assert.match(html, /ytd-watch-next-secondary-results-renderer/);
  assert.match(html, /data-filtertube-channel-handle="@OnurMutluLectures"/);
  assert.match(html, /filtertube-quick-block-wrap/);
  assert.doesNotMatch(html, /<yt-post-header\b|ytPostHeaderHostActionMenu|href="\/post\//);
});

test('doms_html_updates_raw_capture_obligation_without_closing_post_gap', () => {
  const doc = read(docPath);
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const p0 = read('docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md');

  assert.match(doc, /not the clean post\/community DOM source/);
  assert.match(doc, /not a clean post\/community DOM\s+fixture/);
  assert.match(doc, /post insertion boundary remains incomplete/);
  assert.match(doc, /runtime DOMs\.html classification fixtures: 5/);

  assert.match(rawIndex, /\| `DOMs\.html` \| `mixed-main-dom` \| yes \| partial: `main-doms-mutated-main-dom\.html` \|/);
  assert.match(rawIndex, /does not satisfy clean Main post\/community insertion proof/);
  assert.match(rawIndex, /\| `post_opt1_logs\.txt` \| `posts-dom` \| no \| none \|/);

  assert.match(traceability, /`main-doms-mutated-main-dom\.html`/);
  assert.match(traceability, /`DOMs\.html` is partially extracted as a mixed already-mutated Main DOM fixture/);
  assert.match(p0, /DOMs\.html is now partially extracted for mixed already-mutated Main DOM classification/);
  assert.match(p0, /Main post\/community insertion proof remains blocked/);
});

test('doms_html_product_runtime_has_no_capture_classification_authority', () => {
  const doc = read(docPath);
  const runtime = [
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');

  for (const token of [
    'domsHtmlCaptureClassification',
    'rawDomMutationStateReport',
    'postCommunityFixtureReadinessReport',
    'mainPostMenuInsertionFixture',
    'mainPostSiblingVisibilityFixture',
    'mainDomMutatedCapturePolicy'
  ]) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
