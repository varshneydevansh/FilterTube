import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LEGACY_LAYOUT_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const layoutPath = 'js/layout.js';
const activeManifestPaths = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json'
];
const distManifestPaths = [
  'dist/chrome/manifest.json',
  'dist/firefox/manifest.json',
  'dist/opera/manifest.json'
];
const distLayoutPaths = [
  'dist/chrome/js/layout.js',
  'dist/firefox/js/layout.js',
  'dist/opera/js/layout.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function count(text, regex) {
  return [...text.matchAll(regex)].length;
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readStringLiteral(text, index) {
  const quote = text[index];
  if (!['"', "'", '`'].includes(quote)) return null;
  let value = '';
  let escaped = false;
  let hasTemplateExpression = false;
  for (let i = index + 1; i < text.length; i += 1) {
    const char = text[i];
    if (escaped) {
      value += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote === '`' && char === '$' && text[i + 1] === '{') {
      hasTemplateExpression = true;
    }
    if (char === quote) {
      return { value, end: i + 1, quote, hasTemplateExpression };
    }
    value += char;
  }
  return null;
}

function readArgExpression(text, index) {
  let expression = '';
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = index; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      expression += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (['"', "'", '`'].includes(char)) {
      quote = char;
      expression += char;
      continue;
    }
    if (char === '(') {
      depth += 1;
      expression += char;
      continue;
    }
    if (char === ')') {
      if (depth === 0) return expression.trim();
      depth -= 1;
      expression += char;
      continue;
    }
    if (char === ',' && depth === 0) return expression.trim();
    expression += char;
  }
  return expression.trim();
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineForIndex(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return high + 1;
}

function selectorRows() {
  const source = read(layoutPath);
  const starts = lineStarts(source);
  const selectorCall = /\b(querySelectorAll|querySelector|closest|matches)\s*\(/g;
  const rows = [];
  let match;
  while ((match = selectorCall.exec(source))) {
    let argIndex = selectorCall.lastIndex;
    while (/\s/.test(source[argIndex])) argIndex += 1;
    const literal = readStringLiteral(source, argIndex);
    const isStaticLiteral = Boolean(literal && !literal.hasTemplateExpression);
    rows.push({
      line: lineForIndex(starts, match.index),
      api: match[1],
      isStaticLiteral,
      selector: isStaticLiteral ? literal.value : null,
      expression: isStaticLiteral ? literal.value : readArgExpression(source, argIndex)
    });
  }
  return rows;
}

function groupForName(name) {
  if (name === 'fixSearchResultsLayout') return 'legacySearchWatchLayoutRepair';
  if (name === 'fixShortsLayout') return 'legacyShortsShelfLayoutRepair';
  if (name === 'fixHomepageShorts') return 'legacyHomepageShortsLayoutRewrite';
  if (name === 'ensureElementHidden') return 'legacyExtremeHideWriter';
  if (name === 'fixLayoutAfterFiltering') return 'legacyPostFilterHideSweep';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(layoutPath).split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^\s{4}([A-Za-z_$][\w$]*)\s*:\s*function\s*\(/);
    if (match) {
      rows.push({
        file: layoutPath,
        line: index + 1,
        kind: 'objectFunctionProperty',
        name: match[1],
        group: groupForName(match[1])
      });
    }
  });
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function manifestScriptRefs(file) {
  const manifest = JSON.parse(read(file));
  const refs = [];
  for (const entry of manifest.content_scripts || []) {
    for (const script of entry.js || []) refs.push(script);
  }
  return refs;
}

test('legacy layout register is audit-only and source scoped', () => {
  const text = doc();
  const source = read(layoutPath);

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime, build, and packaging\s+behavior are unchanged/);
  assert.match(text, /js\/layout\.js/);
  assert.match(text, /window\.filterTubeLayout/);
  assert.equal(sourceLineCount(source), 680);
  assert.equal(fs.statSync(path.join(repoRoot, layoutPath)).size, 30604);
  assert.match(text, /line count: 680/);
  assert.match(text, /source bytes: 30604/);
  assert.match(text, new RegExp(`source sha256: ${sha256(layoutPath)}`));
  assert.match(text, /runtime behavior changed: no/);
  assert.doesNotMatch(source, /legacyLayoutMethodAuthority/);
});

test('legacy layout register accounts for every exported layout method row', () => {
  const text = doc();
  const rows = methodRows();

  assert.equal(rows.length, 5);
  assert.deepEqual(countBy(rows, 'kind'), {
    objectFunctionProperty: 5
  });
  assert.deepEqual(countBy(rows, 'group'), {
    legacyExtremeHideWriter: 1,
    legacyHomepageShortsLayoutRewrite: 1,
    legacyPostFilterHideSweep: 1,
    legacySearchWatchLayoutRepair: 1,
    legacyShortsShelfLayoutRepair: 1
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.file}:${row.name} should be classified`);
    assert.ok(
      text.includes(`| \`${row.file}\` | ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing legacy layout method row ${row.file}:${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('legacy layout register pins selector and visual side-effect counts', () => {
  const text = doc();
  const source = read(layoutPath);
  const rows = selectorRows();
  const staticRows = rows.filter(row => row.isStaticLiteral);
  const dynamicRows = rows.filter(row => !row.isStaticLiteral);
  const uniqueStatic = new Set(staticRows.map(row => row.selector));

  assert.equal(rows.length, 63);
  assert.equal(staticRows.length, 63);
  assert.equal(dynamicRows.length, 0);
  assert.equal(uniqueStatic.size, 52);
  assert.deepEqual(countBy(rows, 'api'), {
    closest: 3,
    querySelector: 42,
    querySelectorAll: 18
  });

  const countPairs = [
    ['exported method declarations', methodRows().length],
    ['plain function declarations', count(source, /(^|\n)function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['function expression properties', count(source, /^\s{4}[A-Za-z_$][\w$]*\s*:\s*function\s*\(/gm)],
    ['async function declarations', count(source, /(^|\n)async function\s+[A-Za-z_$][\w$]*\s*\(/g)],
    ['arrow token sites', count(source, /=>/g)],
    ['selector API sites', rows.length],
    ['static selector sites', staticRows.length],
    ['dynamic selector sites', dynamicRows.length],
    ['unique static selector literals', uniqueStatic.size],
    ['querySelector calls', count(source, /\.querySelector\s*\(/g)],
    ['querySelectorAll calls', count(source, /\.querySelectorAll\s*\(/g)],
    ['closest calls', count(source, /\.closest\s*\(/g)],
    ['matches calls', count(source, /\.matches\s*\(/g)],
    ['setAttribute calls', count(source, /\.setAttribute\s*\(/g)],
    ['direct style property writes', count(source, /\.style\.[A-Za-z_$][\w$]*\s*=/g)],
    ['style.display writes', count(source, /\.style\.display\s*=/g)],
    ['classList.add calls', count(source, /\.classList\.add\s*\(/g)],
    ['classList.contains calls', count(source, /\.classList\.contains\s*\(/g)],
    ['filter-tube-visible token occurrences', count(source, /filter-tube-visible/g)],
    [':not(.filter-tube-visible) selector clauses', countLiteral(source, ':not(.filter-tube-visible)')],
    ['document literal occurrences', count(source, /\bdocument\b/g)],
    ['window literal occurrences', count(source, /\bwindow\b/g)],
    ['location literal occurrences', count(source, /\blocation\b/g)],
    ['console.log occurrences', count(source, /console\.log/g)],
    ['addEventListener calls', count(source, /\.addEventListener\s*\(/g)],
    ['removeEventListener calls', count(source, /\.removeEventListener\s*\(/g)],
    ['setTimeout calls', count(source, /\bsetTimeout\s*\(/g)],
    ['setInterval calls', count(source, /\bsetInterval\s*\(/g)],
    ['requestAnimationFrame calls', count(source, /\brequestAnimationFrame\s*\(/g)],
    ['MutationObserver references', count(source, /\bMutationObserver\b/g)],
    ['fetch calls', count(source, /\bfetch\s*\(/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`), `missing count ${label}: ${value}`);
  }

  for (const selector of [
    '.yt-lockup-view-model-wiz--horizontal',
    'ytd-watch-card-compact-video-renderer.filter-tube-visible',
    'ytd-universal-watch-card-renderer.filter-tube-visible',
    'ytd-reel-shelf-renderer.filter-tube-visible',
    'ytd-rich-shelf-renderer[is-shorts]:not([hidden])',
    'ytd-video-renderer:not(.filter-tube-visible)',
    'ytd-universal-watch-card-renderer:not(.filter-tube-visible)'
  ]) {
    assert.ok(source.includes(selector), `layout source missing selector ${selector}`);
    assert.ok(text.includes(selector), `layout register missing selector ${selector}`);
  }
});

test('legacy layout register preserves manifest-inactive but packaged boundary', () => {
  const text = doc();
  const build = read('build.js');
  const layoutHash = sha256(layoutPath);

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);

  for (const manifestPath of activeManifestPaths) {
    const refs = manifestScriptRefs(manifestPath);
    assert.equal(refs.includes(layoutPath), false, `${manifestPath} should not load js/layout.js`);
  }

  for (const manifestPath of distManifestPaths) {
    const refs = manifestScriptRefs(manifestPath);
    assert.equal(refs.includes(layoutPath), false, `${manifestPath} should not load js/layout.js`);
  }

  for (const distPath of distLayoutPaths) {
    assert.equal(fs.existsSync(path.join(repoRoot, distPath)), true, `${distPath} should exist in current dist`);
    assert.equal(sha256(distPath), layoutHash, `${distPath} should match current js/layout.js`);
  }

  for (const token of [
    'active manifest load: absent from manifest.json, manifest.chrome.json, manifest.firefox.json, manifest.opera.json',
    'dist manifest load: absent from dist/chrome/manifest.json, dist/firefox/manifest.json, dist/opera/manifest.json',
    'package copy source: build.js COMMON_DIRS includes js',
    'dist copies currently present: dist/chrome/js/layout.js, dist/firefox/js/layout.js, dist/opera/js/layout.js',
    'runtime callers in current repo: no non-doc source reference to filterTubeLayout',
    'renderer inventory dependency: docs/youtube_renderer_inventory.md cites js/layout.js layout-fix coverage for watch-card targets',
    'active coverage status: layout-only coverage is not active filtering proof',
    'quarantine status: packaged legacy file, manifest-inactive'
  ]) {
    assert.ok(text.includes(token), `missing manifest/package boundary token ${token}`);
  }
});

test('legacy layout register preserves current risk boundary and missing authority fields', () => {
  const text = doc();
  const currentSurfaces = [
    layoutPath,
    'build.js',
    ...activeManifestPaths,
    ...distManifestPaths
  ].map(read).join('\n');

  for (const field of [
    'legacyLayoutMethodReference',
    'globalExportName',
    'manifestLoadState',
    'packageTarget',
    'distCopyHash',
    'selectorApi',
    'selectorLiteral',
    'routeSurface',
    'visibleMarkerPolicy',
    'hideDecisionAuthority',
    'visualWriteReason',
    'restoreProof',
    'nativeSyncGate',
    'inventoryCoveragePolicy',
    'positiveFixture',
    'negativeFixture',
    'siblingVisibleFixture',
    'reactivationFixture',
    'deletionReadinessProof'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const token of [
    'js/layout.js is tracked product source and packaged into dist through broad directory copying',
    'js/layout.js is not loaded by the active extension manifests today',
    'the file defines a global window.filterTubeLayout object but no current non-doc source calls it',
    'layout repair methods promote .filter-tube-visible from a visual marker into a layout decision input',
    'fixLayoutAfterFiltering() can hide broad renderer families solely because .filter-tube-visible is absent',
    'ensureElementHidden() is not symmetric with current DOM fallback restore semantics',
    'the file has no listener, observer, timer, interval, requestAnimationFrame, or fetch primitives',
    'the main risk is accidental reactivation, stale package inclusion, or using layout-only inventory rows as runtime coverage'
  ]) {
    assert.ok(text.includes(token), `missing current behavior boundary token ${token}`);
  }

  for (const missingAuthority of [
    'legacyLayoutMethodAuthority',
    'legacyLayoutManifestLoadContract',
    'legacyLayoutPackageQuarantineManifest',
    'legacyLayoutSelectorEffectReport',
    'legacyLayoutVisibleMarkerDecisionContract',
    'legacyLayoutExtremeHideRestoreProof',
    'legacyLayoutInventoryCoveragePolicy',
    'legacyLayoutNativeSyncGate',
    'legacyLayoutFixtureProvenance',
    'legacyLayoutDeletionReadinessReport'
  ]) {
    assert.ok(text.includes(missingAuthority), `doc should name missing authority ${missingAuthority}`);
    assert.doesNotMatch(currentSurfaces, new RegExp(missingAuthority));
  }
});
