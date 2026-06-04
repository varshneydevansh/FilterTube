import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstDisableAutoplayAnnotationsContract',
  'jsonFirstDisableAutoplayAnnotationsDecisionReport',
  'jsonFirstPlayerControlRendererInventoryPolicy',
  'jsonFirstPlayerControlJsonDomParityReport',
  'jsonFirstPlayerControlDomOnlyPolicy',
  'jsonFirstCompactAutoplayGapReport',
  'jsonFirstPlayerControlNoWorkBudget',
  'jsonFirstPlayerControlCacheInvalidationReport',
  'jsonFirstPlayerControlRoutePolicy',
  'jsonFirstPlayerControlSettingsParityReport',
  'jsonFirstPlayerControlFixtureProvenance',
  'jsonFirstPlayerControlMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    disableAutoplay: false,
    disableAnnotations: false,
    videoChannelMap: {},
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function run(payload, overrides = {}, options = {}) {
  const { engine } = loadFilterTubeEngine(options);
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'disable-autoplay-annotations-boundary-fixture'));
}

function video(title = 'Calm watch suggestion', videoId = 'WATCHCTRL1') {
  return {
    videoId,
    title: { simpleText: title },
    shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
  };
}

function compactAutoplay(title = 'Calm autoplay suggestion', videoId = 'AUTOPLAY1') {
  return { compactAutoplayRenderer: video(title, videoId) };
}

function endScreenVideo(title = 'Calm end screen suggestion', videoId = 'ENDSCREEN1') {
  return { endScreenVideoRenderer: video(title, videoId) };
}

function watchPayload(rows = [compactAutoplay(), endScreenVideo()]) {
  return { elements: rows };
}

function autoplayEndpointSet() {
  return {
    sets: [{
      autoplayVideo: { watchEndpoint: { videoId: 'autoend0001' } },
      nextButtonVideo: { watchEndpoint: { videoId: 'autoend0002' } },
      previousButtonVideo: { watchEndpoint: { videoId: 'autoend0003' } }
    }]
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const settingsShared = read('js/settings_shared.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');
  const bgGetStart = background.indexOf('function getCompiledSettings');
  const domStyleStart = domFallback.indexOf('    const rules = [];');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    settingsShared,
    bridgeSettings,
    filterSharedVideoRendererRules: sliceBetween(
      filterLogic,
      '        // Shared video card renderers (used across multiple surfaces)',
      '        videoWithContextRenderer: {'
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domAutoplayCssRules: sliceBetween(
      domFallback,
      '    if (settings.disableAutoplay) {',
      '\n\n    if (settings.disableAnnotations) {',
      domStyleStart
    ),
    domAnnotationsCssRules: sliceBetween(
      domFallback,
      '    if (settings.disableAnnotations) {',
      '\n\n    if (settings.hideTopHeader) {',
      domStyleStart
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      "            'hideAllComments',",
      '        ];\n        if (booleanFilterKeys.some'
    ),
    bgStorageReadKeys: sliceBetween(
      background,
      '        browserAPI.storage.local.get([',
      '        ], (items) => {',
      bgGetStart
    ),
    bgBooleanPassThrough: sliceBetween(
      background,
      '            // Pass through boolean flags',
      '            const profileContentFilters ='
    ),
    bgRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    ),
    sharedSettingsKeys: sliceBetween(
      settingsShared,
      '    const SETTINGS_KEYS = [',
      '\n\n    const SETTINGS_CHANGE_KEYS'
    ),
    sharedDisableCompile: sliceBetween(
      settingsShared,
      '            disableAutoplay: !!disableAutoplay,',
      '            hideTopHeader: !!hideTopHeader,'
    ),
    bridgeRefreshKeys: sliceBetween(
      bridgeSettings,
      '    const relevantKeys = [',
      '    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
    )
  };
}

test('JSON-first disableAutoplay/disableAnnotations boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, autoplay patch/);
  assert.match(doc, /disableAutoplay\/disableAnnotations boundary source files: 6/);
  assert.match(doc, /runtime disableAutoplay\/disableAnnotations fixtures: 7/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6711 | 301840 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/bridge_settings.js\` | 1113 | 44087 | \`${sha256('js/content/bridge_settings.js')}\` |`));
});

test('disableAutoplay/disableAnnotations source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic shared video renderer rules block', blocks.filterSharedVideoRendererRules, 8, 415],
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback autoplay CSS rules block', blocks.domAutoplayCssRules, 8, 235],
    ['DOM fallback annotations CSS rules block', blocks.domAnnotationsCssRules, 8, 185],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared disable controls compile block', blocks.sharedDisableCompile, 2, 102],
    ['content bridge storage refresh keys block', blocks.bridgeRefreshKeys, 44, 1263]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'disableAutoplay'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'disableAnnotations'), 0);
  assert.equal(countLiteral(blocks.seed, 'disableAutoplay'), 0);
  assert.equal(countLiteral(blocks.seed, 'disableAnnotations'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'disableAutoplay'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'disableAnnotations'), 1);
  assert.equal(countLiteral(blocks.background, 'disableAutoplay'), 12);
  assert.equal(countLiteral(blocks.background, 'disableAnnotations'), 12);
  assert.equal(countLiteral(blocks.settingsShared, 'disableAutoplay'), 23);
  assert.equal(countLiteral(blocks.settingsShared, 'disableAnnotations'), 23);
  assert.equal(countLiteral(blocks.bridgeSettings, 'disableAutoplay'), 1);
  assert.equal(countLiteral(blocks.bridgeSettings, 'disableAnnotations'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'compactAutoplayRenderer'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'endScreenVideoRenderer'), 4);
  assert.equal(countLiteral(blocks.domAutoplayCssRules, 'button[data-tooltip-target-id="ytp-autonav-toggle-button"]'), 1);
  assert.equal(countLiteral(blocks.domAutoplayCssRules, '.autonav-endscreen'), 1);
  assert.equal(countLiteral(blocks.domAnnotationsCssRules, '.annotation'), 1);
  assert.equal(countLiteral(blocks.domAnnotationsCssRules, '.iv-branding'), 1);

  assert.match(doc, /filter_logic total disableAutoplay tokens: 1/);
  assert.match(doc, /filter_logic total disableAnnotations tokens: 0/);
  assert.match(doc, /seed total disableAutoplay tokens: 0/);
  assert.match(doc, /seed total disableAnnotations tokens: 0/);
  assert.match(doc, /DOM fallback total disableAutoplay token: 1/);
  assert.match(doc, /DOM fallback total disableAnnotations token: 1/);
  assert.match(doc, /background total disableAutoplay tokens: 12/);
  assert.match(doc, /background total disableAnnotations tokens: 12/);
  assert.match(doc, /settings_shared total disableAutoplay tokens: 23/);
  assert.match(doc, /settings_shared total disableAnnotations tokens: 23/);
  assert.match(doc, /bridge_settings total disableAutoplay token: 1/);
  assert.match(doc, /bridge_settings total disableAnnotations token: 1/);
  assert.match(doc, /filter_logic total compactAutoplayRenderer tokens: 0/);
  assert.match(doc, /filter_logic total endScreenVideoRenderer tokens: 4/);
  assert.match(doc, /DOM fallback autoplay CSS block button\[data-tooltip-target-id="ytp-autonav-toggle-button"\] token: 1/);
  assert.match(doc, /DOM fallback autoplay CSS block \.autonav-endscreen token: 1/);
  assert.match(doc, /DOM fallback annotations CSS block \.annotation token: 1/);
  assert.match(doc, /DOM fallback annotations CSS block \.iv-branding token: 1/);
});

test('disableAutoplay and disableAnnotations do not remove JSON player rows in filter_logic', () => {
  const payload = watchPayload();

  assert.deepEqual(run(payload, {
    disableAutoplay: true,
    disableAnnotations: true
  }), plain(payload));
});

test('ordinary keyword rules can remove supported end-screen JSON while compact autoplay remains', () => {
  const payload = watchPayload([
    compactAutoplay('Block me autoplay', 'AUTO2'),
    endScreenVideo('Block me end screen', 'END2'),
    endScreenVideo('Keep end screen', 'END3')
  ]);
  const result = run(payload, {
    disableAutoplay: true,
    disableAnnotations: true,
    filterKeywords: [{ pattern: 'block me end screen', flags: 'i' }]
  });

  assert.equal(result.elements.length, 2);
  assert.equal(result.elements[0].compactAutoplayRenderer.videoId, 'AUTO2');
  assert.equal(result.elements[1].endScreenVideoRenderer.videoId, 'END3');
});

test('disableAutoplay removes watch autoplay endpoint sets during active JSON processing', () => {
  assert.deepEqual(run(autoplayEndpointSet(), {
    disableAutoplay: true
  }), {
    sets: []
  });
});

test('watch next disableAutoplay and disableAnnotations bypass JSON engine work without a disable decision', async () => {
  const payload = watchPayload();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload
  });
  runtime.window.filterTube.updateSettings(settings({
    disableAutoplay: true,
    disableAnnotations: true
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
});

test('source proof pins DOM-owned player controls refresh omission and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.match(blocks.filterLogic, /disableAutoplay/);
  assert.match(blocks.filterLogic, /AUTOPLAY_ENDPOINT_KEYS/);
  assert.match(blocks.filterLogic, /_shouldDropAutoplayEndpointSet/);
  assert.doesNotMatch(blocks.filterLogic, /disableAnnotations/);
  assert.doesNotMatch(blocks.filterLogic, /compactAutoplayRenderer/);
  assert.match(blocks.filterSharedVideoRendererRules, /endScreenVideoRenderer/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /disableAutoplay/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /disableAnnotations/);
  assert.match(blocks.domAutoplayCssRules, /button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]/);
  assert.match(blocks.domAutoplayCssRules, /\.autonav-endscreen/);
  assert.match(blocks.domAnnotationsCssRules, /\.annotation/);
  assert.match(blocks.domAnnotationsCssRules, /\.iv-branding/);
  assert.doesNotMatch(blocks.domActiveBooleanKeys, /'disableAutoplay'/);
  assert.doesNotMatch(blocks.domActiveBooleanKeys, /'disableAnnotations'/);
  assert.match(blocks.bgStorageReadKeys, /'disableAutoplay'/);
  assert.match(blocks.bgStorageReadKeys, /'disableAnnotations'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.disableAutoplay = boolFromV4\('disableAutoplay', items\.disableAutoplay \|\| false\)/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.disableAnnotations = boolFromV4\('disableAnnotations', items\.disableAnnotations \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'disableAutoplay'/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'disableAnnotations'/);
  assert.match(blocks.sharedSettingsKeys, /'disableAutoplay'/);
  assert.match(blocks.sharedSettingsKeys, /'disableAnnotations'/);
  assert.match(blocks.sharedDisableCompile, /disableAutoplay: !!disableAutoplay/);
  assert.match(blocks.sharedDisableCompile, /disableAnnotations: !!disableAnnotations/);
  assert.match(blocks.bridgeRefreshKeys, /'disableAutoplay'/);
  assert.match(blocks.bridgeRefreshKeys, /'disableAnnotations'/);
  assert.match(doc, /Background storage-change invalidation does not include either setting today/);
  assert.match(doc, /Seed JSON active-work detection does not include `disableAutoplay` or `disableAnnotations`/);
  assert.match(doc, /Watch autoplay endpoint sets are removed during active JSON processing when\s+`disableAutoplay` is enabled/);
  assert.match(doc, /Compact autoplay and supported end-screen JSON renderer rows pass through unchanged\s+when only `disableAutoplay` and `disableAnnotations` are enabled/);
  assert.match(doc, /Ordinary keyword rules can remove a matching supported `endScreenVideoRenderer`/);
  assert.match(doc, /`\/youtubei\/v1\/next` now bypasses `processData` with only both disable\s+controls enabled/);
  assert.match(doc, /DOM fallback owns `button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]`/);
  assert.match(doc, /`\.autonav-endscreen`, `\.annotation`, and `\.iv-branding`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
