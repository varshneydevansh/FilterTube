import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const captureCorpusFamilyDocs = [
  'docs/audit/FILTERTUBE_CAPTURE_CORPUS_INVENTORY_2026-05-17.md',
  'docs/audit/FILTERTUBE_FIXTURE_CANDIDATE_MATRIX_2026-05-17.md',
  'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
  'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_IGNORED_ROOT_EVIDENCE_CORPUS_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
  'docs/audit/FILTERTUBE_ROOT_EVIDENCE_SOURCE_TAXONOMY_2026-05-20.md',
  'docs/audit/FILTERTUBE_IGNORED_LOCAL_PLANNING_TEXT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

const requiredCaptureFamilies = {
  mainWatchNext: [
    'YT_MAIN_WATCH.html',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_next?prettyPrint.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json',
    'get_watch?prettyPrint=false.json',
    'watchpage.json'
  ],
  mainBrowseSearchGuide: [
    'YT_MAIN.json',
    'guide?prettyPrint=false.json',
    'strange_ytInitialData.json',
    'tmp.json',
    'logs.json',
    'text.txt'
  ],
  comments: [
    'comments.json',
    'YT_MAIN_NEXT_RESPONSE_COMMENT.json'
  ],
  shortsReels: [
    'reel_item_watch?prettyPrint=False.JSON'
  ],
  kids: [
    'YT_KIDS.json',
    'yt_kids_latest.json',
    'ytkids_browse?alt=json.json'
  ],
  music: [
    'YTM.json',
    'YTM-XHR.json',
    'YTM-DOM.html',
    'ytm_browse?prettyPrint=false.json',
    'YTM-WATCH PLAYER.html'
  ],
  collaborationPlaylistPost: [
    'collab.html',
    'collab.json',
    'collab_on_homepage.html',
    'collab_in_playlist_mix.html',
    'playlist.html',
    'playlist.json',
    'playlist.js',
    'DOMs.html'
  ],
  historicalScratchAndPlans: [
    'WHITELIST_background.js',
    'WHITELIST_content.js',
    'reset37.txt',
    'stash.txt',
    'cher.md',
    'import_channels.txt',
    'extracted_watch_paths.txt',
    'Docs/MOBILE_APP_UI_SPEC.md',
    'docs/spa-collab-watchlist-handoff.md',
    'watcher-collab-watchlist-spa-fix-plan.md',
    'docs/subscribed-channels-whitelist-import-plan.md'
  ]
};

test('ignored raw capture corpus is explicitly excluded from release source', () => {
  const gitignore = read('.gitignore');

  for (const files of Object.values(requiredCaptureFamilies)) {
    for (const file of files) {
      assert.match(gitignore, new RegExp(`(^|\\n)${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\n|$)`), `${file} should stay ignored`);
    }
  }
});

test('fixture candidate matrix maps ignored capture families to proof obligations', () => {
  const doc = read('docs/audit/FILTERTUBE_FIXTURE_CANDIDATE_MATRIX_2026-05-17.md');

  assert.match(doc, /## Ignored Raw Capture Corpus/);
  assert.match(doc, /These files are not release source and should not be committed wholesale/);
  assert.match(doc, /Raw captures stay ignored/);

  const representativeDocNamesByFamily = {
    ...requiredCaptureFamilies,
    collaborationPlaylistPost: ['collab*.html', 'collab.json', 'playlist.html', 'playlist.json', 'DOMs.html']
  };

  for (const [family, files] of Object.entries(representativeDocNamesByFamily)) {
    for (const file of files.slice(0, 2)) {
      assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${family} should cite ${file}`);
    }
  }
});

test('capture corpus inventory cites each concrete ignored evidence file', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_CORPUS_INVENTORY_2026-05-17.md');

  for (const files of Object.values(requiredCaptureFamilies)) {
    for (const file of files) {
      assert.match(doc, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `inventory should cite ${file}`);
    }
  }

  assert.match(doc, /post_opt1_logs\.txt/);
  assert.match(doc, /Historical plans \/ handoffs/);
});

test('capture corpus family docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  assert.match(methodGap, /tracked JS\/JSX\/MJS files: 69/);
  assert.match(methodGap, /repo-wide lexical callables: 5827/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5827/);

  for (const familyDocPath of captureCorpusFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5827/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('runtime audit treats renderer inventories as proof source rather than coverage claims', () => {
  const doc = read('docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md');

  assert.match(doc, /Renderer inventory docs/);
  assert.match(doc, /Treat these as fixture source material, not a claim that every renderer is already enforced JSON-first/);
  assert.match(doc, /Convert json_paths_encyclopedia\.md and youtube_renderer_inventory\.md entries into fixtures/);
});

test('local ignored captures currently contain source material for high-risk renderer fixtures when present', () => {
  const expectedTokensByFile = {
    'YT_MAIN_WATCH.html': ['endScreenVideoRenderer', 'shortsLockupViewModel'],
    'YT_MAIN_NEXT.json': ['commentThreadRenderer'],
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json': ['videoRenderer', 'shortsLockupViewModel'],
    'comments.json': ['commentThreadRenderer'],
    'playlist.html': ['ytd-playlist-panel-video-renderer'],
    'collab.json': ['showSheetCommand', 'showDialogCommand'],
    'reel_item_watch?prettyPrint=False.JSON': ['showSheetCommand'],
    'YTM.json': ['compactPlaylistRenderer'],
    'YTM-XHR.json': ['endScreenVideoRenderer', 'commentRenderer'],
    'YT_KIDS.json': ['kidsHomeScreenRenderer', 'compactVideoRenderer', 'kidsVideoOwnerExtension']
  };

  for (const [file, tokens] of Object.entries(expectedTokensByFile)) {
    if (!exists(file)) continue;
    const text = read(file);
    for (const token of tokens) {
      assert.match(text, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${file} should contain ${token}`);
    }
  }
});
