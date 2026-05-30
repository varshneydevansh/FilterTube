import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_POST_COMMUNITY_DOM_INSERTION_FIXTURE_GAP_CURRENT_BEHAVIOR_2026-05-24.md';
const fixtureDir = 'tests/runtime/fixtures/captures';

const futureAuthorityTokens = [
  'mainPostCommunityDomInsertionFixtureContract',
  'mainPostCommunityMenuInsertionDecisionReport',
  'mainPostCommunityNativeFallbackParityReport',
  'mainPostCommunityFallbackScanPolicy',
  'mainPostCommunityAuthorIdentityPolicy',
  'mainPostCommunityWhitelistNoWorkBudget',
  'mainPostCommunitySiblingVisibilityFixture',
  'mainPostCommunityDomInsertionJsonFirstGate'
];

const indexPaths = [
  'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function fixtureFiles() {
  return fs.readdirSync(path.join(repoRoot, fixtureDir)).sort();
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return [
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');
}

test('Main post community DOM insertion fixture-gap doc is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior fixture-gap slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /clean Main post\/community action-menu fixture/);
  assert.match(doc, /post_opt1_logs\.txt/);
});

test('native dropdown targeting includes post renderers while fallback scan omits them', () => {
  const blockChannel = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');
  const nativeBlock = sliceBetween(
    blockChannel,
    '// Prefer comment context first',
    'if (!videoCard && !clickInComments)'
  );
  const fallbackScan = sliceBetween(
    bridge,
    'const scan = (root = document) => {',
    'let scanQueued = false;'
  );
  const fallbackSelectorBlock = sliceBetween(
    bridge,
    'const fallbackMenuCardSelector = [',
    'const collectFallbackMenuCards = (root = document) => {'
  );
  const normalDropdownGate = sliceBetween(
    bridge,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );

  for (const token of [
    "'ytd-post-renderer, '",
    "'ytm-post-renderer, '",
    "'ytm-backstage-post-renderer, '",
    "'ytm-backstage-post-thread-renderer, '"
  ]) {
    assert.match(nativeBlock, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(fallbackScan, /collectFallbackMenuCards\(root\)/);
  assert.match(fallbackSelectorBlock, /'ytd-playlist-panel-video-renderer'/);
  assert.match(fallbackSelectorBlock, /'ytd-comment-thread-renderer'/);
  assert.doesNotMatch(fallbackSelectorBlock, /ytd-post-renderer/);
  assert.doesNotMatch(fallbackSelectorBlock, /ytm-post-renderer/);
  assert.doesNotMatch(fallbackSelectorBlock, /ytm-backstage-post-renderer/);
  assert.match(normalDropdownGate, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(normalDropdownGate, /currentSettings\?\.showBlockMenuItem === false/);
});

test('post author extraction source exists but current Main DOM fixture proof remains absent', () => {
  const bridge = read('js/content_bridge.js');
  const postExtraction = sliceBetween(
    bridge,
    '// SPECIAL CASE: Detect if this is a Post card',
    '// PRIORITY: Check for collaboration videos'
  );

  assert.match(postExtraction, /card\.tagName\.toLowerCase\(\) === 'ytd-post-renderer'/);
  assert.match(postExtraction, /card\.tagName\.toLowerCase\(\) === 'ytm-backstage-post-thread-renderer'/);
  assert.match(postExtraction, /yt-post-header a\[href\^="\/@"\]/);
  assert.match(postExtraction, /yt-post-header a\[href\*="\/channel\/UC"\]/);
  assert.match(postExtraction, /authorThumbnail/);
});

test('committed fixtures split YTM post DOM from already-mutated Main DOM and JSON post proof', () => {
  const files = fixtureFiles();
  const ytmPost = read('tests/runtime/fixtures/captures/ytm-dom-post-card-with-menu.html');
  const mainDoms = read('tests/runtime/fixtures/captures/main-doms-mutated-main-dom.html');
  const mainPostJson = JSON.parse(read('tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json'));

  assert.ok(files.includes('ytm-dom-post-card-with-menu.html'));
  assert.ok(files.includes('main-doms-mutated-main-dom.html'));
  assert.ok(files.includes('main-watchpage-embedded-post-renderer.json'));

  assert.match(ytmPost, /Source: YTM-DOM\.html/);
  assert.match(ytmPost, /<ytm-backstage-post-thread-renderer\b/);
  assert.match(ytmPost, /<yt-post-header\b/);
  assert.match(ytmPost, /href="\/@MajorAlex"/);
  assert.match(ytmPost, /href="\/post\/UgkxP4-pkY-qukYP5m8oOWMIRwgfR5AwGCEM"/);
  assert.match(ytmPost, /ytPostHeaderHostActionMenu/);
  assert.doesNotMatch(ytmPost, /filtertube-menu-item|filtertube-block-channel-item/);

  assert.match(mainDoms, /Reduced from ignored raw capture: DOMs\.html/);
  assert.match(mainDoms, /data-current-filtertube-mutated="true"/);
  assert.match(mainDoms, /filtertube-quick-block-host/);
  assert.doesNotMatch(mainDoms, /<yt-post-header\b|ytPostHeaderHostActionMenu|href="\/post\//);

  assert.equal(mainPostJson.provenance.rendererType, 'postRenderer');
  assert.equal(mainPostJson.provenance.surface, 'Main embedded FEwhat_to_watch rich-grid community posts');
  assert.equal(mainPostJson.provenance.route, 'browse/feed, not watch-next');
});

test('raw capture indexes keep Main post DOM insertion proof incomplete', () => {
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const p0Traceability = read('docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md');
  const domsDoc = read('docs/audit/FILTERTUBE_DOMS_HTML_MUTATED_MAIN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md');

  assert.match(rawIndex, /\| `post_opt1_logs\.txt` \| `posts-dom` \| no \| none \|/);
  assert.match(rawIndex, /post\/community DOM fixture with native action menu/);
  assert.match(traceability, /1 missing historical path: post_opt1_logs\.txt/);
  assert.match(traceability, /`YTM-DOM\.html` is partially extracted for one post\/backstage action-menu fixture/);
  assert.match(traceability, /absent clean Main post fixture still leave post behavior incomplete/);
  assert.match(p0Traceability, /Main post\/community insertion proof remains blocked/);
  assert.match(domsDoc, /not the clean post\/community DOM source/);
});

test('Main post community DOM insertion boundary indexes and future symbols stay audit-only', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const indexPath of indexPaths) {
    assert.match(read(indexPath), /Main post community DOM insertion fixture-gap addendum/);
    assert.match(read(indexPath), /main-post-community-dom-insertion-fixture-gap-current-behavior\.test\.mjs/);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
