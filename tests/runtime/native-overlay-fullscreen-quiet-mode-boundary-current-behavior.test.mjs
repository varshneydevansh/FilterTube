import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NATIVE_OVERLAY_FULLSCREEN_QUIET_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13535, 600459, '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9'],
  'js/content/block_channel.js': [3175, 127396, '1b6fffa249a746c01686df0d6a05dc4b770a6f0c5ded08b78a7043c11e9cdd83'],
  'js/content/dom_fallback.js': [4838, 228332, '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/content/bridge_settings.js': [651, 26462, 'c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b'],
  'js/content/first_run_prompt.js': [190, 7453, '5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409'],
  'js/content/release_notes_prompt.js': [250, 9866, '30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474']
};

const blockSpecs = {
  nativeQuietPredicate: {
    file: 'js/content_bridge.js',
    start: 'function isFilterTubeNativeOverlayQuietMode() {',
    end: 'if (isFilterTubeDebugEnabled())',
    label: 'content_bridge native quiet predicate block',
    startLine: 16,
    lines: 11,
    bytes: 468
  },
  initializeDomFallbackQuietCluster: {
    file: 'js/content_bridge.js',
    start: 'async function initializeDOMFallback(settings) {',
    end: 'let fallbackMenuButtonsInstalled = false;',
    label: 'content_bridge initializeDOMFallback quiet cluster block',
    startLine: 6088,
    lines: 382,
    bytes: 17601
  },
  fallbackMenuQuietCluster: {
    file: 'js/content_bridge.js',
    start: 'function ensureFallbackMenuButtons() {',
    end: 'let playlistFallbackPopoverState = null;',
    label: 'content_bridge fallback menu quiet cluster block',
    startLine: 6489,
    lines: 721,
    bytes: 29321
  },
  quickBlockEnabledPredicate: {
    file: 'js/content/block_channel.js',
    start: 'const isQuickBlockEnabled = () => {',
    end: 'function ensureQuickBlockStyles()',
    label: 'block_channel quick-block enabled predicate block',
    startLine: 1205,
    lines: 90,
    bytes: 2943
  },
  quickBlockLifecycleSetup: {
    file: 'js/content/block_channel.js',
    start: 'function setupQuickBlockObserver() {',
    end: '/**\n * Observe dropdowns and inject FilterTube menu items',
    label: 'block_channel quick-block lifecycle setup block',
    startLine: 1979,
    lines: 322,
    bytes: 13896
  }
};

const quietTokens = [
  'isFilterTubeNativeOverlayQuietMode',
  'data-filtertube-native-overlay-covered',
  'data-filtertube-native-fullscreen',
  '__filterTubeNativeOverlayCovered',
  '__filterTubeNativeFullscreenActive'
];

const futureAuthoritySymbols = [
  'nativeOverlayQuietModeContract',
  'nativeOverlayQuietModeConsumerReport',
  'fullscreenNonPlayerPauseContract',
  'fullscreenNativeOverlayPauseAuthority',
  'nonPlayerRuntimePauseReport',
  'quickBlockNativeOverlayPauseReport',
  'domFallbackFullscreenPauseReport',
  'seedFullscreenNoWorkBudget',
  'promptOverlayFullscreenPolicy',
  'nativeOverlayMetricArtifact'
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

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function sliceWithStart(file, startNeedle, endNeedle) {
  const text = read(file);
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return {
    startLine: text.slice(0, start).split(/\r?\n/).length,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const { startLine, block } = sliceWithStart(spec.file, spec.start, spec.end);
  return {
    startLine,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    block
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function evaluateNativeQuietPredicate(overrides = {}) {
  const predicate = blockMetric(blockSpecs.nativeQuietPredicate).block;
  const attributes = new Set(overrides.attributes || []);
  const context = {
    window: {
      __filterTubeNativeOverlayCovered: overrides.overlayFlag === true,
      __filterTubeNativeFullscreenActive: overrides.fullscreenFlag === true
    },
    document: {
      documentElement: {
        hasAttribute(name) {
          return attributes.has(name);
        }
      }
    }
  };

  vm.runInNewContext(`${predicate}\nglobalThis.__result = isFilterTubeNativeOverlayQuietMode();`, context);
  return context.__result;
}

test('native overlay/fullscreen quiet mode audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof only/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not approval\s+to change runtime filtering, JSON mutation, DOM mutation, storage, message,\s+lifecycle, network, prompt, or settings semantics/);
  assert.match(doc, /native overlay\/fullscreen quiet mode boundary source files: 7/);
  assert.match(doc, /native overlay\/fullscreen quiet mode source\/effect blocks: 5/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drift`);
    assert.equal(sha256(source), expectedHash, `${file} hash drift`);
    assert.match(doc, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`));
  }
});

test('native overlay/fullscreen source/effect blocks stay pinned', () => {
  const doc = read(docPath);

  for (const spec of Object.values(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${spec.label} start line drift`);
    assert.equal(metric.lines, spec.lines, `${spec.label} line count drift`);
    assert.equal(metric.bytes, spec.bytes, `${spec.label} byte count drift`);
    assert.match(
      doc,
      new RegExp(`${escapeRegex(spec.label)}: line ${spec.startLine}, ${spec.lines} lines, ${spec.bytes} bytes`)
    );
  }
});

test('content bridge local quiet predicate and guarded clusters keep selected counts explicit', () => {
  const doc = read(docPath);
  const bridge = read('js/content_bridge.js');
  const nativeBlock = blockMetric(blockSpecs.nativeQuietPredicate).block;
  const initBlock = blockMetric(blockSpecs.initializeDomFallbackQuietCluster).block;
  const fallbackBlock = blockMetric(blockSpecs.fallbackMenuQuietCluster).block;

  const fullFileCounts = [
    ['isFilterTubeNativeOverlayQuietMode', 22],
    ['data-filtertube-native-overlay-covered', 1],
    ['data-filtertube-native-fullscreen', 1],
    ['__filterTubeNativeOverlayCovered', 1],
    ['__filterTubeNativeFullscreenActive', 1],
    ['MutationObserver', 17],
    ['IntersectionObserver', 2],
    ['addEventListener', 25],
    ['setTimeout', 36],
    ['setInterval', 1],
    ['requestAnimationFrame', 10],
    ['applyDOMFallback', 31],
    ['schedulePrefetchScan', 5]
  ];

  for (const [token, expected] of fullFileCounts) {
    assert.equal(countLiteral(bridge, token), expected, `content_bridge ${token} count drift`);
    assert.match(doc, new RegExp(`\\\`${escapeRegex(token)}\\\`: ${expected}`));
  }

  assert.equal(countLiteral(nativeBlock, 'isFilterTubeNativeOverlayQuietMode'), 1);
  assert.equal(countLiteral(nativeBlock, 'data-filtertube-native-overlay-covered'), 1);
  assert.equal(countLiteral(nativeBlock, 'data-filtertube-native-fullscreen'), 1);
  assert.equal(countLiteral(nativeBlock, '__filterTubeNativeOverlayCovered'), 1);
  assert.equal(countLiteral(nativeBlock, '__filterTubeNativeFullscreenActive'), 1);

  assert.equal(countLiteral(initBlock, 'isFilterTubeNativeOverlayQuietMode'), 8);
  assert.equal(countLiteral(initBlock, 'MutationObserver'), 11);
  assert.equal(countLiteral(initBlock, 'setTimeout'), 4);
  assert.equal(countLiteral(initBlock, 'requestAnimationFrame'), 1);
  assert.equal(countLiteral(initBlock, 'applyDOMFallback'), 6);
  assert.equal(countLiteral(initBlock, 'schedulePrefetchScan'), 2);

  assert.equal(countLiteral(fallbackBlock, 'isFilterTubeNativeOverlayQuietMode'), 13);
  assert.equal(countLiteral(fallbackBlock, 'MutationObserver'), 1);
  assert.equal(countLiteral(fallbackBlock, 'addEventListener'), 7);
  assert.equal(countLiteral(fallbackBlock, 'setTimeout'), 4);
  assert.equal(countLiteral(fallbackBlock, 'setInterval'), 1);
});

test('native quiet predicate currently recognizes four native/fullscreen signals', () => {
  assert.equal(evaluateNativeQuietPredicate(), false);
  assert.equal(evaluateNativeQuietPredicate({ overlayFlag: true }), true);
  assert.equal(evaluateNativeQuietPredicate({ fullscreenFlag: true }), true);
  assert.equal(
    evaluateNativeQuietPredicate({ attributes: ['data-filtertube-native-overlay-covered'] }),
    true
  );
  assert.equal(
    evaluateNativeQuietPredicate({ attributes: ['data-filtertube-native-fullscreen'] }),
    true
  );
});

test('quick-block lifecycle setup remains separate from native overlay quiet predicate', () => {
  const doc = read(docPath);
  const source = read('js/content/block_channel.js');
  const gateBlock = blockMetric(blockSpecs.quickBlockEnabledPredicate).block;
  const setupBlock = blockMetric(blockSpecs.quickBlockLifecycleSetup).block;

  assert.equal(countLiteral(source, 'isFilterTubeNativeOverlayQuietMode'), 0);
  assert.equal(countLiteral(source, 'data-filtertube-native-overlay-covered'), 0);
  assert.equal(countLiteral(source, 'data-filtertube-native-fullscreen'), 0);
  assert.equal(countLiteral(source, '__filterTubeNativeOverlayCovered'), 0);
  assert.equal(countLiteral(source, '__filterTubeNativeFullscreenActive'), 0);
  assert.equal(countLiteral(source, 'showQuickBlockButton'), 1);
  assert.equal(countLiteral(source, "listMode === 'whitelist'"), 3);
  assert.equal(countLiteral(source, 'MutationObserver'), 6);
  assert.equal(countLiteral(source, 'addEventListener'), 37);
  assert.equal(countLiteral(source, 'setTimeout'), 17);
  assert.equal(countLiteral(source, 'setInterval'), 0);
  assert.equal(countLiteral(source, 'requestAnimationFrame'), 5);

  assert.match(doc, /block_channel full-file selected quiet\/lifecycle counts/);
  assert.match(doc, /`isFilterTubeNativeOverlayQuietMode`: 0/);
  assert.match(doc, /`showQuickBlockButton`: 1/);
  assert.match(doc, /`listMode === 'whitelist'`: 3/);

  assert.equal(countLiteral(gateBlock, 'showQuickBlockButton'), 1);
  assert.equal(countLiteral(gateBlock, "listMode === 'whitelist'"), 2);
  assert.equal(countLiteral(setupBlock, 'MutationObserver'), 1);
  assert.equal(countLiteral(setupBlock, 'addEventListener'), 12);
  assert.equal(countLiteral(setupBlock, 'setTimeout'), 3);
  assert.equal(countLiteral(setupBlock, 'setInterval'), 0);
  assert.equal(countLiteral(setupBlock, 'requestAnimationFrame'), 1);
  assert.equal(countLiteral(setupBlock, 'isYouTubeOverlaySurfaceOpen'), 0);
  assert.equal(countLiteral(setupBlock, 'isMobileSearchSurfaceOpen'), 0);
  assert.equal(countLiteral(setupBlock, 'isFilterTubeNativeOverlayQuietMode'), 0);
  assert.equal(countLiteral(setupBlock, 'data-filtertube-native-fullscreen'), 0);

  assert.ok(
    setupBlock.indexOf('ensureQuickBlockStyles();') < setupBlock.indexOf('if (!isQuickBlockEnabled()) return;'),
    'quick-block styles should still be installed before the first action gate in current behavior'
  );
});

test('selected non-content-bridge owners lack native quiet predicate consumption', () => {
  const doc = read(docPath);
  const files = [
    'js/content/dom_fallback.js',
    'js/seed.js',
    'js/content/bridge_settings.js',
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js'
  ];

  for (const file of files) {
    const source = read(file);
    for (const token of quietTokens) {
      assert.equal(countLiteral(source, token), 0, `${file} should not contain ${token} in current selected scan`);
    }
  }

  assert.equal(countLiteral(read('js/content/dom_fallback.js'), 'ytp-fullscreen'), 1);
  assert.match(doc, /selected non-content-bridge owner quiet-token counts/);
  assert.match(doc, /`js\/content\/dom_fallback\.js`: 0 native quiet predicate\/attribute tokens, 1 player `ytp-fullscreen` selector token/);
  assert.match(doc, /`js\/seed\.js`: 0 native quiet predicate\/attribute tokens/);
  assert.match(doc, /`js\/content\/bridge_settings\.js`: 0 native quiet predicate\/attribute tokens/);
  assert.match(doc, /The prompt scripts can render fixed overlays after runtime\/background checks\s+without a local fullscreen\/native-overlay suppression predicate/);
});

test('native overlay/fullscreen quiet mode authority remains absent from product runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /Product runtime source still lacks/);
  for (const symbol of futureAuthoritySymbols) {
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly present in runtime source`);
    assert.match(doc, new RegExp(`\\\`${escapeRegex(symbol)}\\\``));
  }

  assert.match(doc, /a shared decision contract for native overlay and fullscreen quiet state/);
  assert.match(doc, /per-owner consumer reports for seed, DOM fallback, content bridge, quick block,\s+fallback menu, bridge settings, and prompts/);
  assert.match(doc, /timer\/listener\/observer teardown or pause budgets/);
  assert.match(doc, /metrics proving no false-hide\/leak and no avoidable runtime work during\s+fullscreen\/native overlays/);
});
