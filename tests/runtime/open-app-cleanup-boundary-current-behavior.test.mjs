import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_OPEN_APP_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'openAppCleanupBoundaryContract',
  'openAppCleanupDecisionReport',
  'openAppCleanupRestoreProof',
  'openAppCleanupSelectorPolicy',
  'openAppCleanupSettingsGate',
  'openAppCleanupRoutePolicy',
  'openAppCleanupMetricArtifact',
  'openAppCleanupShellVsContentPolicy',
  'openAppCleanupNoWorkBudget',
  'openAppCleanupJsonParityGate'
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function sourceBlocks() {
  const source = read('js/content/dom_fallback.js');
  return {
    source,
    ensureBlock: sliceBetween(source, 'function ensureContentControlStyles(settings) {', 'function hideYouTubeOpenAppButtons()'),
    openBlock: sliceBetween(source, 'function hideYouTubeOpenAppButtons() {', 'function normalizeTextForMatching(value) {'),
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

function createTarget(name) {
  const attributes = new Map();
  const styleCalls = [];

  return {
    name,
    attributes,
    styleCalls,
    textContent: '',
    style: {
      setProperty(property, value, priority) {
        styleCalls.push({ property, value, priority });
      }
    },
    setAttribute(attribute, value) {
      attributes.set(attribute, String(value));
    },
    getAttribute(attribute) {
      return attributes.has(attribute) ? attributes.get(attribute) : null;
    },
    closest() {
      return null;
    }
  };
}

function createAnchor({ label = '', href = '', text = '', wrapper = null } = {}) {
  const anchor = createTarget('anchor');
  if (label) anchor.setAttribute('aria-label', label);
  if (href) anchor.setAttribute('href', href);
  anchor.textContent = text;
  anchor.closest = (selector) => (selector === 'ytm-button-renderer' ? wrapper : null);
  return anchor;
}

function runOpenAppCleanup(anchors, { throwQuery = false } = {}) {
  const { openBlock } = sourceBlocks();
  const sandbox = {
    __selector: '',
    document: {
      querySelectorAll(selector) {
        sandbox.__selector = selector;
        if (throwQuery) throw new Error('query failed');
        return anchors;
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(openBlock, sandbox);
  sandbox.hideYouTubeOpenAppButtons();
  return sandbox;
}

function isHidden(target) {
  return target.styleCalls.some((call) => (
    call.property === 'display' &&
    call.value === 'none' &&
    call.priority === 'important'
  ));
}

test('open-app cleanup boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+selector\s+patch, cleanup patch/);
  assert.match(doc, /open-app cleanup boundary source files: 1/);
  assert.match(doc, /open-app cleanup boundary source\/effect blocks: 4/);
  assert.match(doc, /runtime open-app cleanup fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('open-app cleanup source counts and CSS coupling remain pinned', () => {
  const doc = read(docPath);
  const { source, ensureBlock, openBlock, clearBlock, disabledCleanupBlock } = sourceBlocks();

  assert.equal(lineCount(ensureBlock), 345);
  assert.equal(Buffer.byteLength(ensureBlock), 12583);
  assert.equal(lineCount(openBlock), 22);
  assert.equal(Buffer.byteLength(openBlock), 961);
  assert.equal(lineCount(clearBlock), 33);
  assert.equal(Buffer.byteLength(clearBlock), 1412);
  assert.equal(lineCount(disabledCleanupBlock), 21);
  assert.equal(Buffer.byteLength(disabledCleanupBlock), 959);

  assert.equal(countLiteral(openBlock, 'querySelectorAll'), 1);
  assert.equal(countLiteral(openBlock, "'ytm-button-renderer a, a[href^=\"intent://\"]'"), 1);
  assert.equal(countLiteral(openBlock, '.forEach'), 1);
  assert.equal(countLiteral(openBlock, 'getAttribute'), 2);
  assert.equal(countLiteral(openBlock, 'textContent'), 1);
  assert.equal(countLiteral(openBlock, 'toLowerCase()'), 2);
  assert.equal(countLiteral(openBlock, "label.includes('open app')"), 1);
  assert.equal(countLiteral(openBlock, "href.startsWith('intent://')"), 1);
  assert.equal(countLiteral(openBlock, "href.includes('youtube://')"), 1);
  assert.equal(countLiteral(openBlock, "href.includes('open_app')"), 1);
  assert.equal(countLiteral(openBlock, "href.includes('play.google.com/store/apps/details')"), 1);
  assert.equal(countLiteral(openBlock, "closest('ytm-button-renderer')"), 1);
  assert.equal(countLiteral(openBlock, "style.setProperty('display', 'none', 'important')"), 1);
  assert.equal(countLiteral(openBlock, "setAttribute('data-filtertube-hidden-open-app', 'true')"), 1);
  assert.equal(countLiteral(openBlock, 'removeAttribute'), 0);
  assert.equal(countLiteral(openBlock, 'toggleVisibility'), 0);
  assert.equal(countLiteral(openBlock, 'catch (e)'), 1);

  assert.equal(countLiteral(ensureBlock, 'hideYouTubeOpenAppButtons()'), 1);
  assert.equal(countLiteral(ensureBlock, '        ytm-button-renderer a[href^="intent://"],'), 1);
  assert.equal(countLiteral(ensureBlock, '        ytm-button-renderer a[href*="youtube://"],'), 1);
  assert.equal(countLiteral(ensureBlock, '        ytm-button-renderer a[href*="open_app"],'), 1);
  assert.equal(countLiteral(ensureBlock, '        ytm-button-renderer a[href*="play.google.com/store/apps/details"],'), 1);
  assert.equal(countLiteral(ensureBlock, '        a[href^="intent://"] {'), 1);
  assert.equal(countLiteral(source, 'data-filtertube-hidden-open-app'), 1);

  assert.match(doc, /hideYouTubeOpenAppButtons block lines: 22/);
  assert.match(doc, /hideYouTubeOpenAppButtons block bytes: 961/);
  assert.match(doc, /open-app direct querySelectorAll callsites: 1/);
  assert.match(doc, /open-app CSS selector rows emitted by the style writer: 5/);
  assert.match(doc, /product runtime open-app marker references: 1/);
});

test('direct open-app cleanup hides classified candidates and leaves safe candidates untouched', () => {
  const labelWrapper = createTarget('label-wrapper');
  const youtubeWrapper = createTarget('youtube-wrapper');
  const openAppWrapper = createTarget('open-app-wrapper');
  const storeWrapper = createTarget('store-wrapper');
  const safeWrapper = createTarget('safe-wrapper');
  const labelAnchor = createAnchor({ label: 'OPEN APP', href: '/watch?v=1', wrapper: labelWrapper });
  const intentAnchor = createAnchor({ href: 'intent://watch?v=2' });
  const youtubeAnchor = createAnchor({ href: 'youtube://watch?v=3', wrapper: youtubeWrapper });
  const openAppAnchor = createAnchor({ href: 'https://m.youtube.com/watch?open_app=1', wrapper: openAppWrapper });
  const storeAnchor = createAnchor({
    href: 'https://play.google.com/store/apps/details?id=com.google.android.youtube',
    wrapper: storeWrapper
  });
  const safeAnchor = createAnchor({ label: 'Play video', href: '/watch?v=safe', wrapper: safeWrapper });

  const sandbox = runOpenAppCleanup([
    labelAnchor,
    intentAnchor,
    youtubeAnchor,
    openAppAnchor,
    storeAnchor,
    safeAnchor
  ]);

  assert.equal(sandbox.__selector, 'ytm-button-renderer a, a[href^="intent://"]');
  assert.equal(isHidden(labelWrapper), true);
  assert.equal(isHidden(labelAnchor), false, 'wrapper should be hidden instead of the matched anchor');
  assert.equal(labelWrapper.getAttribute('data-filtertube-hidden-open-app'), 'true');
  assert.equal(isHidden(intentAnchor), true);
  assert.equal(intentAnchor.getAttribute('data-filtertube-hidden-open-app'), 'true');
  assert.equal(isHidden(youtubeWrapper), true);
  assert.equal(isHidden(openAppWrapper), true);
  assert.equal(isHidden(storeWrapper), true);
  assert.equal(isHidden(safeWrapper), false);
  assert.equal(isHidden(safeAnchor), false);
  assert.equal(safeWrapper.getAttribute('data-filtertube-hidden-open-app'), null);
});

test('direct open-app cleanup swallows current query failures', () => {
  assert.doesNotThrow(() => runOpenAppCleanup([], { throwQuery: true }));

  const { openBlock } = sourceBlocks();
  assert.equal(countLiteral(openBlock, 'catch (e)'), 1);
  assert.equal(countLiteral(openBlock, 'console.'), 0);
});

test('open-app marker currently has no stale or disabled restore owner', () => {
  const doc = read(docPath);
  const { source, openBlock, clearBlock, disabledCleanupBlock } = sourceBlocks();

  assert.equal(countLiteral(source, 'data-filtertube-hidden-open-app'), 1);
  assert.equal(countLiteral(openBlock, 'data-filtertube-hidden-open-app'), 1);
  assert.equal(countLiteral(clearBlock, 'data-filtertube-hidden-open-app'), 0);
  assert.equal(countLiteral(disabledCleanupBlock, 'data-filtertube-hidden-open-app'), 0);
  assert.equal(countLiteral(source, "removeAttribute('data-filtertube-hidden-open-app'"), 0);
  assert.equal(countLiteral(source, 'removeAttribute("data-filtertube-hidden-open-app"'), 0);
  assert.equal(countLiteral(source, '[data-filtertube-hidden-open-app]'), 0);
  assert.equal(countLiteral(openBlock, 'toggleVisibility'), 0);

  assert.match(doc, /clear-stale cleanup open-app marker references: 0/);
  assert.match(doc, /disabled cleanup open-app marker references: 0/);
  assert.match(doc, /product runtime open-app marker removeAttribute callsites: 0/);
  assert.match(doc, /This bypasses shared `toggleVisibility\(\)`/);
});

test('open-app cleanup boundary records missing future authorities outside runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.match(doc, new RegExp(`\\b${symbol}\\b`), `doc missing ${symbol}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${symbol}\\b`), `runtime should not define ${symbol}`);
  }
}
);
