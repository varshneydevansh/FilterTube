import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function manifestScripts(file) {
  const json = JSON.parse(read(file));
  return [
    ...(json.content_scripts || []).flatMap((entry) => entry.js || []),
    ...Object.values(json.web_accessible_resources || {}).flatMap((entry) => entry.resources || [])
  ];
}

test('JSON DOM inventory truth audit defines docs as discovery maps not runtime proof', () => {
  const doc = read('docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md');
  assert.match(doc, /discovery maps/);
  assert.match(doc, /not proof that the\s+current runtime filters every documented renderer/);
  assert.match(doc, /ignored root captures[\s\S]*raw evidence only/);
  assert.match(doc, /tests\/runtime\/\*[\s\S]*executable current-behavior proof/);
  assert.match(doc, /json-first-supported/);
  assert.match(doc, /unsupported-gap/);
  assert.match(doc, /quarantined-legacy/);
});

test('inventory docs contain optimistic coverage wording for surfaces that require fixture proof', () => {
  const inventory = read('docs/youtube_renderer_inventory.md');
  const paths = read('docs/json_paths_encyclopedia.md');

  assert.match(inventory, /watchCardRichHeaderRenderer[\s\S]*IMPLEMENTED/);
  assert.match(inventory, /Targeted \(Layout Fix\)[\s\S]*js\/layout\.js/);
  assert.match(inventory, /showSheetCommand\.panelLoadingStrategy\.inlineContent\.sheetViewModel[\s\S]*PRIMARY/);
  assert.match(paths, /### `compactPlaylistRenderer`/);
  assert.match(paths, /### `searchRefinementCardRenderer`/);
  assert.match(paths, /### `compactChannelRenderer`/);
  assert.match(paths, /### `sharedPostRenderer`/);
});

test('documented high-risk renderer keys are not direct FILTER_RULES entries today', () => {
  const filterLogic = read('js/filter_logic.js');
  const directMissing = [
    'compactPlaylistRenderer',
    'searchRefinementCardRenderer',
    'compactChannelRenderer',
    'postRenderer',
    'sharedPostRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer',
    'watchCardRichHeaderRenderer'
  ];

  for (const key of directMissing) {
    assert.doesNotMatch(
      filterLogic,
      new RegExp(`\\n\\s{8}${key}:\\s*\\{`),
      `${key} unexpectedly has a direct FILTER_RULES entry`
    );
  }

  assert.match(filterLogic, /universalWatchCardRenderer:\s*\{/);
  assert.match(filterLogic, /'header\.watchCardRichHeaderRenderer\.title\.runs'/);
  assert.match(filterLogic, /'compactPlaylistRenderer'/);
});

test('showSheet collaborator paths are documented while current filter logic primary scan is showDialog based', () => {
  const paths = read('docs/json_paths_encyclopedia.md');
  const filterLogic = read('js/filter_logic.js');

  assert.match(paths, /showSheetCommand\.panelLoadingStrategy\.inlineContent\.sheetViewModel\.header\.panelHeaderViewModel\.title\.content/);
  assert.match(paths, /listViewModel\.listItems\[0\]\.listItemViewModel\.rendererContext\.commandContext\.onTap\.innertubeCommand\.browseEndpoint\.browseId/);
  assert.match(filterLogic, /const showDialogCommand = run\.navigationEndpoint\?\.showDialogCommand/);
  assert.match(filterLogic, /showDialogCommand\?\.panelLoadingStrategy\?\.inlineContent\?\.dialogViewModel/);
});

test('layout-only inventory coverage is not active manifest-loaded runtime coverage', () => {
  const inventory = read('docs/youtube_renderer_inventory.md');
  assert.match(inventory, /js\/layout\.js/);

  const manifests = [
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json'
  ];
  for (const manifest of manifests) {
    assert.doesNotMatch(manifestScripts(manifest).join('\n'), /(^|\/)layout\.js$/);
  }
});

test('global DOM card selector mixes surfaces before a central selector registry exists', () => {
  const extractors = read('js/content/dom_extractors.js');
  const combined = [
    read('js/content/dom_extractors.js'),
    read('js/content/dom_fallback.js'),
    read('js/content/block_channel.js'),
    read('js/content_bridge.js')
  ].join('\n');

  assert.match(extractors, /const VIDEO_CARD_SELECTORS = \[/);
  assert.match(extractors, /'ytd-rich-item-renderer'/);
  assert.match(extractors, /'ytm-video-with-context-renderer'/);
  assert.match(extractors, /'ytk-compact-video-renderer'/);
  assert.doesNotMatch(combined, /\bselectorFamilyRegistry\b|\brouteScopedSelectorRegistry\b/);
});
