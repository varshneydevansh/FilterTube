import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_UI_COMPONENTS_PORTAL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const sourcePath = 'js/ui_components.js';

const sourceFingerprint = {
  lines: 998,
  bytes: 37002,
  hash: '5913af4a42b2e93909867c1e9d588677ae71d7b2bd53d4c331e004a14eb3305a'
};

const blockSpecs = {
  flashButtonSuccess: {
    start: "    function flashButtonSuccess(button, successText = 'Saved!', duration = 1500) {",
    end: '\n\n    /**\n     * Create a toggle button',
    startLine: 97,
    lines: 26,
    bytes: 1132,
    hash: '72c69e2c9b35e7dc2311596c4fa91aa867f280afa0d4d66bd8acbaa616554f9d'
  },
  createDropdownFromSelect: {
    start: "    function createDropdownFromSelect(selectEl, { className = '', showAvatar = false, showSubtitle = false } = {}) {",
    end: '\n\n    // ============================================================================\n    // ICON BUTTONS',
    startLine: 468,
    lines: 378,
    bytes: 14973,
    hash: '14ad6c416f24a271430a7f53765a4540edd94164ee2c07f824e30f9e25a25465'
  },
  showToast: {
    start: "    function showToast(message, type = 'info', duration = 3000) {",
    end: '\n\n    // ============================================================================\n    // PUBLIC API',
    startLine: 940,
    lines: 20,
    bytes: 633,
    hash: '58749cb49277d5c82b9ab48fc467e364c9ffada37de32712a6f7960173ce7032'
  }
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(sourcePath);
  const { start, block } = sliceBetween(source, spec.start, spec.end);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256(block),
    block
  };
}

function selectedSource() {
  const source = read(sourcePath);
  return Object.values(blockSpecs)
    .map((spec) => sliceBetween(source, spec.start, spec.end).block)
    .join('\n');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('ui components portal lifecycle doc records audit-only boundary', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior boundary/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /shared UI component lifecycle/);
  assert.match(doc, /enhanced select body portals/);
  assert.match(doc, /dropdown\s+listeners/);
  assert.match(doc, /toast timers/);
  assert.match(doc, /UI components portal lifecycle source files pinned \| 1/);
  assert.match(doc, /UI components portal lifecycle source\/effect blocks pinned \| 3/);
  assert.match(doc, /selected disconnect tokens \| 0/);
  assert.match(doc, /selected removeEventListener tokens \| 0/);
});

test('ui components source fingerprint and blocks remain current', () => {
  const source = read(sourcePath);
  const doc = read(docPath);

  assert.equal(lineCount(source), sourceFingerprint.lines);
  assert.equal(Buffer.byteLength(source), sourceFingerprint.bytes);
  assert.equal(sha256(source), sourceFingerprint.hash);
  assert.match(
    doc,
    new RegExp(`\\| \`${sourcePath}\` \\| ${sourceFingerprint.lines} \\| ${sourceFingerprint.bytes.toLocaleString('en-US')} \\| \`${sourceFingerprint.hash}\` \\|`)
  );

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.equal(metric.hash, spec.hash, `${name} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${name}\` \\| \`${sourcePath}:${spec.startLine}\` \\| ${spec.startLine} \\| ${spec.lines} \\| ${spec.bytes.toLocaleString('en-US')} \\| \`${spec.hash}\` \\|`)
    );
  }
});

test('ui components portal lifecycle token counts remain current', () => {
  const selected = selectedSource();
  const doc = read(docPath);

  const counts = {
    'selected document.createElement tokens': countLiteral(selected, 'document.createElement'),
    'selected document.body.appendChild tokens': countLiteral(selected, 'document.body.appendChild'),
    'selected addEventListener tokens': countLiteral(selected, 'addEventListener'),
    'selected window.addEventListener tokens': countLiteral(selected, 'window.addEventListener'),
    'selected document.addEventListener tokens': countLiteral(selected, 'document.addEventListener'),
    'selected setTimeout tokens': countLiteral(selected, 'setTimeout('),
    'selected clearTimeout tokens': countLiteral(selected, 'clearTimeout('),
    'selected requestAnimationFrame tokens': countLiteral(selected, 'requestAnimationFrame'),
    'selected cancelAnimationFrame tokens': countLiteral(selected, 'cancelAnimationFrame'),
    'selected MutationObserver tokens': countLiteral(selected, 'MutationObserver'),
    'selected observe tokens': countLiteral(selected, '.observe('),
    'selected disconnect tokens': countLiteral(selected, '.disconnect('),
    'selected querySelector tokens': countLiteral(selected, 'querySelector('),
    'selected querySelectorAll tokens': countLiteral(selected, 'querySelectorAll('),
    'selected closest tokens': countLiteral(selected, '.closest('),
    'selected innerHTML writes': (selected.match(/\.innerHTML\s*=/g) || []).length,
    'selected textContent writes': (selected.match(/\.textContent\s*=/g) || []).length,
    'selected dispatchEvent tokens': countLiteral(selected, '.dispatchEvent('),
    'selected remove tokens': countLiteral(selected, '.remove('),
    'selected hidden writes': (selected.match(/\.hidden\s*=/g) || []).length,
    'selected style.display writes': (selected.match(/\.style\.display\s*=/g) || []).length,
    'selected dataset ftSelectEnhanced tokens': countLiteral(selected, 'ftSelectEnhanced'),
    'selected btn-success-flash tokens': countLiteral(selected, 'btn-success-flash'),
    'selected ft-toast literal tokens': countLiteral(selected, 'ft-toast'),
    'selected .ft-toast selector tokens': countLiteral(selected, '.ft-toast'),
    'selected ft-select-menu tokens': countLiteral(selected, 'ft-select-menu'),
    'selected aria-expanded tokens': countLiteral(selected, 'aria-expanded'),
    'selected aria-disabled tokens': countLiteral(selected, 'aria-disabled'),
    'selected aria-selected tokens': countLiteral(selected, 'aria-selected'),
    'selected role listbox tokens': countLiteral(selected, "role', 'listbox"),
    'selected role option tokens': countLiteral(selected, "role', 'option"),
    'selected teardownRegistry tokens': countLiteral(selected, 'teardownRegistry'),
    'selected removeEventListener tokens': countLiteral(selected, 'removeEventListener')
  };

  assert.deepEqual(counts, {
    'selected document.createElement tokens': 10,
    'selected document.body.appendChild tokens': 2,
    'selected addEventListener tokens': 7,
    'selected window.addEventListener tokens': 2,
    'selected document.addEventListener tokens': 1,
    'selected setTimeout tokens': 3,
    'selected clearTimeout tokens': 0,
    'selected requestAnimationFrame tokens': 4,
    'selected cancelAnimationFrame tokens': 1,
    'selected MutationObserver tokens': 1,
    'selected observe tokens': 1,
    'selected disconnect tokens': 0,
    'selected querySelector tokens': 1,
    'selected querySelectorAll tokens': 1,
    'selected closest tokens': 2,
    'selected innerHTML writes': 1,
    'selected textContent writes': 8,
    'selected dispatchEvent tokens': 2,
    'selected remove tokens': 4,
    'selected hidden writes': 4,
    'selected style.display writes': 3,
    'selected dataset ftSelectEnhanced tokens': 2,
    'selected btn-success-flash tokens': 2,
    'selected ft-toast literal tokens': 3,
    'selected .ft-toast selector tokens': 1,
    'selected ft-select-menu tokens': 2,
    'selected aria-expanded tokens': 4,
    'selected aria-disabled tokens': 1,
    'selected aria-selected tokens': 1,
    'selected role listbox tokens': 1,
    'selected role option tokens': 1,
    'selected teardownRegistry tokens': 0,
    'selected removeEventListener tokens': 0
  });

  for (const [label, value] of Object.entries(counts)) {
    assert.ok(doc.includes(`${label} | ${value}`), `missing doc token count ${label}`);
  }
});

test('ui components dropdown portal current behavior is pinned', () => {
  const block = blockMetric(blockSpecs.createDropdownFromSelect).block;

  assert.match(block, /if \(!select \|\| !\(select instanceof HTMLSelectElement\)\) return null/);
  assert.match(block, /select\.dataset\.ftSelectEnhanced === 'true'/);
  assert.match(block, /select\.closest\('\.ft-select-menu'\)/);
  assert.match(block, /document\.body\.appendChild\(dropdown\)/);
  assert.match(block, /originalParent\.insertBefore\(wrapper, select\)/);
  assert.match(block, /positionRaf = requestAnimationFrame\(\(\) => \{/);
  assert.match(block, /cancelAnimationFrame\(positionRaf\)/);
  assert.match(block, /requestAnimationFrame\(\(\) => \{\n\s+position\(\);\n\s+requestAnimationFrame/);
  assert.match(block, /window\.addEventListener\('resize'/);
  assert.match(block, /window\.addEventListener\('scroll'/);
  assert.match(block, /document\.addEventListener\('click'/);
  assert.match(block, /select\.addEventListener\('change'/);
  assert.match(block, /select\.addEventListener\('input'/);
  assert.match(block, /btn\.addEventListener\('click'/);
  assert.match(block, /select\.dispatchEvent\(changeEvent\)/);
  assert.match(block, /select\.dispatchEvent\(new Event\('input'/);
  assert.match(block, /const obs = new MutationObserver/);
  assert.match(block, /obs\.observe\(select, \{ attributes: true, attributeFilter: \['disabled'\] \}\)/);
  assert.match(block, /select\.style\.display = 'none'/);
  assert.match(block, /select\.dataset\.ftSelectEnhanced = 'true'/);
  assert.doesNotMatch(block, /\.disconnect\(/);
  assert.doesNotMatch(block, /removeEventListener/);
});

test('ui components transient timer current behavior is pinned', () => {
  const flashBlock = blockMetric(blockSpecs.flashButtonSuccess).block;
  const toastBlock = blockMetric(blockSpecs.showToast).block;

  assert.match(flashBlock, /button\.dataset\.originalText = button\.textContent/);
  assert.match(flashBlock, /button\.classList\.add\('btn-success-flash'\)/);
  assert.match(flashBlock, /setTimeout\(\(\) => \{/);
  assert.match(flashBlock, /delete button\.dataset\.originalText/);
  assert.match(flashBlock, /button\.classList\.remove\('btn-success-flash'\)/);

  assert.match(toastBlock, /document\.querySelectorAll\('\.ft-toast'\)\.forEach\(t => t\.remove\(\)\)/);
  assert.match(toastBlock, /document\.body\.appendChild\(toast\)/);
  assert.match(toastBlock, /requestAnimationFrame\(\(\) => \{/);
  assert.match(toastBlock, /toast\.classList\.add\('show'\)/);
  assert.match(toastBlock, /setTimeout\(\(\) => \{/);
  assert.match(toastBlock, /setTimeout\(\(\) => toast\.remove\(\), 300\)/);
  assert.doesNotMatch(`${flashBlock}\n${toastBlock}`, /clearTimeout\(/);
});

test('ui components portal lifecycle authority symbols are absent from runtime source', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const authorities = [
    'uiComponentsPortalLifecycleContract',
    'uiComponentsDropdownPortalRegistry',
    'uiComponentsDropdownListenerOwnerReport',
    'uiComponentsDropdownObserverTeardownReport',
    'uiComponentsFrameBudgetReport',
    'uiComponentsToastTimerBudget',
    'uiComponentsTransientButtonTimerReport',
    'uiComponentsDuplicateEnhancementPolicy',
    'uiComponentsBodyPortalCleanupProof',
    'uiComponentsAccessibilityStateReport',
    'uiComponentsFixtureProvenance',
    'uiComponentsLifecycleMetricArtifact'
  ];

  for (const authority of authorities) {
    assert.ok(doc.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
