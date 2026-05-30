import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_VIDEO_INFO_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'videoInfoDomCleanupBoundaryContract',
  'videoInfoDomCleanupDecisionReport',
  'videoInfoDomCleanupMasterModePolicy',
  'videoInfoDomCleanupStyleSelectorPolicy',
  'videoInfoDomCleanupTargetShapeReport',
  'videoInfoDomCleanupWhitelistPolicy',
  'videoInfoDomCleanupRestoreProof',
  'videoInfoDomCleanupStaleCleanupBudget',
  'videoInfoDomCleanupDisabledRestoreProof',
  'videoInfoDomCleanupMetricArtifact',
  'videoInfoDomCleanupJsonParityGate'
];

const videoInfoKeys = [
  'hideVideoInfo',
  'hideVideoButtonsBar',
  'hideAskButton',
  'hideVideoChannelRow',
  'hideVideoDescription',
  'hideMerchTicketsOffers'
];

const videoInfoMarkers = [
  'data-filtertube-hidden-by-hide-video-info',
  'data-filtertube-hidden-by-hide-video-buttons-bar',
  'data-filtertube-hidden-by-hide-ask-button',
  'data-filtertube-hidden-by-hide-video-channel-row',
  'data-filtertube-hidden-by-hide-video-description',
  'data-filtertube-hidden-by-hide-merch-tickets-offers'
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

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function sourceBlocks() {
  const source = read('js/content/dom_fallback.js');
  const ensureBlock = sliceBetween(source, 'function ensureContentControlStyles(settings) {', 'function hideYouTubeOpenAppButtons()');
  return {
    source,
    ensureBlock,
    videoInfoModeBlock: sliceBetween(
      ensureBlock,
      "    const listMode = (settings && settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';",
      '\n\n    if (settings.hideEndscreenVideowall) {'
    ),
    buttonsBarCssBlock: sliceBetween(
      ensureBlock,
      "    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoButtonsBar)) {",
      '\n\n    if (hideInfoMaster || settings.hideAskButton) {'
    ),
    askButtonCssBlock: sliceBetween(
      ensureBlock,
      '    if (hideInfoMaster || settings.hideAskButton) {',
      "\n\n    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoChannelRow)) {"
    ),
    channelRowCssBlock: sliceBetween(
      ensureBlock,
      "    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoChannelRow)) {",
      "\n\n    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoDescription)) {"
    ),
    descriptionCssBlock: sliceBetween(
      ensureBlock,
      "    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoDescription)) {",
      '\n\n    if (hideInfoMaster || settings.hideMerchTicketsOffers) {'
    ),
    merchCssBlock: sliceBetween(
      ensureBlock,
      '    if (hideInfoMaster || settings.hideMerchTicketsOffers) {',
      '\n\n    if (settings.hideEndscreenVideowall) {'
    ),
    activeBlock: sliceBetween(source, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility()'),
    noActiveCleanupBlock: sliceBetween(
      source,
      '    const hasActiveFallbackWork = hasActiveDOMFallbackWork(effectiveSettings);',
      '    try {\n        const state = window.__filtertubeDomFallbackPerfState'
    ),
    clearBlock: sliceBetween(source, 'function clearStaleDOMFallbackVisibility() {', '// DOM fallback function that processes already-rendered content'),
    disabledCleanupBlock: sliceBetween(
      source,
      '    if (effectiveSettings.enabled === false) {',
      '    // 1. Video/Content Filtering'
    )
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function createFakeElement(tagName) {
  const attributes = new Map();
  return {
    tagName: tagName.toUpperCase(),
    id: '',
    textContent: '',
    attributes,
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    }
  };
}

function createDocument({ pathname = '/watch' } = {}) {
  const elements = new Map();
  const documentElement = createFakeElement('html');
  const fakeHead = {
    appended: [],
    appendChild(element) {
      this.appended.push(element);
      if (element.id) elements.set(element.id, element);
      element.parentNode = this;
      return element;
    }
  };

  return {
    head: fakeHead,
    documentElement,
    location: { pathname },
    createElement: createFakeElement,
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelectorAll() {
      return [];
    },
    __elements: elements
  };
}

function runEnsure(settings, { document = createDocument(), supportsHasSelector = true } = {}) {
  const { ensureBlock } = sourceBlocks();
  const sandbox = {
    document,
    CSS: {
      supports(query) {
        sandbox.__supportsQueries.push(query);
        return supportsHasSelector;
      }
    },
    __openAppCalls: 0,
    __supportsQueries: [],
    hideYouTubeOpenAppButtons() {
      sandbox.__openAppCalls += 1;
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(ensureBlock, sandbox);
  sandbox.ensureContentControlStyles(settings);
  return sandbox;
}

function styleText(document) {
  const style = document.__elements.get('filtertube-content-controls-style');
  assert.ok(style, 'expected shared content-control style element');
  return style.textContent;
}

function assertVideoInfoSelectors(css, { present }) {
  const matcher = present ? assert.match : assert.doesNotMatch;
  matcher(css, /#actions\.ytd-watch-metadata/);
  matcher(css, /#info > #menu-container/);
  matcher(css, /a\[aria-label="Ask"\]/);
  matcher(css, /button\[aria-label="Ask"\]/);
  matcher(css, /#owner\.ytd-watch-metadata/);
  matcher(css, /#top-row\.ytd-video-secondary-info-renderer/);
  matcher(css, /#description\.ytd-watch-metadata/);
  matcher(css, /ytd-expander\.ytd-video-secondary-info-renderer/);
  matcher(css, /#ticket-shelf/);
  matcher(css, /ytd-merch-shelf-renderer/);
  matcher(css, /#offer-module/);
  matcher(css, /#clarify-box/);
}

test('video-info DOM cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, selector patch, cleanup patch/);
  assert.match(doc, /video-info DOM cleanup boundary source files: 1/);
  assert.match(doc, /video-info DOM cleanup source\/effect blocks: 11/);
  assert.match(doc, /runtime video-info DOM cleanup fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('video-info DOM cleanup source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  for (const [label, block, expectedLines, expectedBytes] of [
    ['ensureContentControlStyles block', blocks.ensureBlock, 345, 12583],
    ['video-info mode group block', blocks.videoInfoModeBlock, 49, 1516],
    ['video-buttons-bar CSS block', blocks.buttonsBarCssBlock, 8, 263],
    ['ask-button CSS block', blocks.askButtonCssBlock, 8, 218],
    ['video-channel-row CSS block', blocks.channelRowCssBlock, 8, 280],
    ['video-description CSS block', blocks.descriptionCssBlock, 8, 291],
    ['merch-tickets-offers CSS block', blocks.merchCssBlock, 10, 274],
    ['active DOM fallback work block', blocks.activeBlock, 68, 2333],
    ['no-active cleanup branch', blocks.noActiveCleanupBlock, 14, 629],
    ['clearStaleDOMFallbackVisibility block', blocks.clearBlock, 33, 1412],
    ['disabled cleanup branch', blocks.disabledCleanupBlock, 21, 959]
  ]) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
  }

  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'rules.push'), 5);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'display: none !important'), 5);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'hideInfoMaster'), 6);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, "listMode !== 'whitelist'"), 4);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'hideVideoInfo'), 1);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'hideVideoButtonsBar'), 1);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'hideAskButton'), 1);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'hideVideoChannelRow'), 1);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'hideVideoDescription'), 1);
  assert.equal(countLiteral(blocks.videoInfoModeBlock, 'hideMerchTicketsOffers'), 1);
  assert.equal(countLiteral(blocks.ensureBlock, 'style.textContent'), 1);
  assert.equal(countLiteral(blocks.ensureBlock, 'hideYouTubeOpenAppButtons()'), 1);

  for (const key of videoInfoKeys) {
    assert.equal(countLiteral(blocks.activeBlock, `'${key}'`), 1);
    assert.equal(countLiteral(blocks.clearBlock, key), 0);
    assert.equal(countLiteral(blocks.disabledCleanupBlock, key), 0);
    assert.equal(countLiteral(blocks.source, key), 2);
  }
  for (const marker of videoInfoMarkers) {
    assert.equal(countLiteral(blocks.source, marker), 0);
    assert.equal(countLiteral(blocks.clearBlock, marker), 0);
    assert.equal(countLiteral(blocks.disabledCleanupBlock, marker), 0);
  }

  assert.match(doc, /video-info mode group block lines: 49/);
  assert.match(doc, /video-info mode group block bytes: 1516/);
  assert.match(doc, /video-info mode group selector rows: 12/);
  assert.match(doc, /active DOM fallback video-info flag references: 6/);
  assert.match(doc, /clear-stale cleanup video-info flag references: 0/);
  assert.match(doc, /disabled cleanup video-info flag references: 0/);
  assert.match(doc, /product runtime video-info feature marker references: 0/);
});

test('hideVideoInfo master emits all video-info child selectors in blocklist mode', () => {
  const document = createDocument({ pathname: '/watch' });
  const sandbox = runEnsure({ hideVideoInfo: true, listMode: 'blocklist' }, { document });
  const css = styleText(document);

  assert.equal(document.documentElement.getAttribute('data-filtertube-route-home'), 'false');
  assert.equal(document.documentElement.getAttribute('data-filtertube-route-watch'), 'true');
  assert.deepEqual(sandbox.__supportsQueries, ['selector(:has(*))']);
  assert.equal(sandbox.__openAppCalls, 1);
  assert.match(css, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assertVideoInfoSelectors(css, { present: true });
  assert.equal(countLiteral(css, 'display: none !important'), 6);
});

test('hideVideoInfo master emits no video-info child selectors in whitelist mode and restores by style rewrite', () => {
  const document = createDocument({ pathname: '/watch' });
  runEnsure({ hideVideoInfo: true, listMode: 'blocklist' }, { document });
  const initialStyle = document.__elements.get('filtertube-content-controls-style');
  assertVideoInfoSelectors(initialStyle.textContent, { present: true });

  const sandbox = runEnsure({ hideVideoInfo: true, listMode: 'whitelist' }, { document });
  const rewrittenStyle = document.__elements.get('filtertube-content-controls-style');

  assert.equal(rewrittenStyle, initialStyle);
  assert.equal(document.head.appended.length, 1);
  assertVideoInfoSelectors(rewrittenStyle.textContent, { present: false });
  assert.match(rewrittenStyle.textContent, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.equal(countLiteral(rewrittenStyle.textContent, 'display: none !important'), 1);
  assert.equal(sandbox.__openAppCalls, 1);
});

test('explicit whitelist child flags preserve current mixed gating behavior', () => {
  const document = createDocument({ pathname: '/watch' });
  runEnsure({
    listMode: 'whitelist',
    hideVideoButtonsBar: true,
    hideAskButton: true,
    hideVideoChannelRow: true,
    hideVideoDescription: true,
    hideMerchTicketsOffers: true
  }, { document });
  const css = styleText(document);

  assert.doesNotMatch(css, /#actions\.ytd-watch-metadata/);
  assert.doesNotMatch(css, /#info > #menu-container/);
  assert.match(css, /a\[aria-label="Ask"\]/);
  assert.match(css, /button\[aria-label="Ask"\]/);
  assert.doesNotMatch(css, /#owner\.ytd-watch-metadata/);
  assert.doesNotMatch(css, /#top-row\.ytd-video-secondary-info-renderer/);
  assert.doesNotMatch(css, /#description\.ytd-watch-metadata/);
  assert.doesNotMatch(css, /ytd-expander\.ytd-video-secondary-info-renderer/);
  assert.match(css, /#ticket-shelf/);
  assert.match(css, /ytd-merch-shelf-renderer/);
  assert.match(css, /#offer-module/);
  assert.match(css, /#clarify-box/);
  assert.equal(countLiteral(css, 'display: none !important'), 3);
});

test('video-info DOM cleanup boundary records marker omissions and missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const { clearBlock, disabledCleanupBlock } = sourceBlocks();
  const runtime = productRuntimeSource();

  for (const marker of videoInfoMarkers) {
    assert.equal(runtime.includes(marker), false);
    assert.equal(clearBlock.includes(marker), false);
    assert.equal(disabledCleanupBlock.includes(marker), false);
  }

  assert.match(doc, /`hideVideoInfo` semantics are cross-branch mode behavior/);
  assert.match(doc, /Explicit `hideAskButton` still hides in whitelist mode/);
  assert.match(doc, /Explicit `hideMerchTicketsOffers` still hides in whitelist mode/);
  assert.match(doc, /Restore is full shared style regeneration/);
  assert.match(doc, /There is no feature-local stale cleanup budget/);
  assert.match(doc, /Turning the extension off relies on shared style blanking/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
