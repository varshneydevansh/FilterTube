import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DESIGN_TOKEN_JSON_CSS_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function count(source, regex) {
  return (source.match(regex) || []).length;
}

function sliceBetween(source, start, end, fromIndex = 0) {
  const startIndex = source.indexOf(start, fromIndex);
  assert.notEqual(startIndex, -1, `missing start marker ${start}`);
  const endIndex = end ? source.indexOf(end, startIndex) : source.length;
  assert.notEqual(endIndex, -1, `missing end marker ${end}`);
  return source.slice(startIndex, endIndex).trimEnd();
}

function blockMetrics(text) {
  return {
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text),
    sha256: sha256(text),
  };
}

function walkLeaves(obj, prefix = []) {
  return Object.entries(obj).flatMap(([key, value]) => {
    const next = [...prefix, key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return walkLeaves(value, next);
    }
    return [[next.join('.'), value]];
  });
}

function cssVarDefinitions(source) {
  return [...source.matchAll(/--(ft-[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g)]
    .map((match) => [match[1], match[2].trim()]);
}

function cssVarReferences(source) {
  return [...source.matchAll(/var\(--(ft-[A-Za-z0-9_-]+)/g)]
    .map((match) => match[1]);
}

function doc() {
  return read(docPath);
}

const selectedUsageFiles = [
  'css/design_tokens.css',
  'css/components.css',
  'css/popup.css',
  'css/tab-view.css',
  'html/popup.html',
  'html/tab-view.html',
  'html/troubleshoot.html',
  'src/extension-shell/popup.jsx',
  'src/extension-shell/tab-view-decor.jsx',
  'js/ui-shell/popup-shell.js',
  'js/ui-shell/tab-view-decor.js',
];

const jsonPathToCssVar = {
  'colors.brand.primaryRed': 'ft-color-brand-primary',
  'colors.brand.primaryRedHover': 'ft-color-brand-primary-hover',
  'colors.background.base': 'ft-color-bg-base',
  'colors.background.surface': 'ft-color-bg-surface',
  'colors.background.panel': 'ft-color-bg-panel',
  'colors.background.kids': 'ft-color-bg-kids',
  'colors.background.overlay': 'ft-color-bg-overlay',
  'colors.text.primary': 'ft-color-text-primary',
  'colors.text.secondary': 'ft-color-text-secondary',
  'colors.text.muted': 'ft-color-text-muted',
  'colors.text.inverse': 'ft-color-text-inverse',
  'colors.interactive.primary': 'ft-color-interactive-primary',
  'colors.interactive.primaryHover': 'ft-color-interactive-primary-hover',
  'colors.interactive.secondary': 'ft-color-interactive-secondary',
  'colors.interactive.focusOutline': 'ft-color-focus-outline',
  'colors.status.success': 'ft-color-status-success',
  'colors.status.warning': 'ft-color-status-warning',
  'colors.status.danger': 'ft-color-status-danger',
  'colors.status.info': 'ft-color-status-info',
  'colors.semantic.neutralBorder': 'ft-color-sem-neutral-border',
  'colors.semantic.neutralBackground': 'ft-color-sem-neutral-bg',
  'typography.fontFamily': 'ft-font-family-base',
  'typography.baseFontSize': 'ft-font-size-base',
  'typography.headingScale.h1': 'ft-font-size-h1',
  'typography.headingScale.h2': 'ft-font-size-h2',
  'typography.headingScale.h3': 'ft-font-size-h3',
  'typography.headingScale.subtitle': 'ft-font-size-subtitle',
  'typography.headingScale.body': 'ft-font-size-body',
  'typography.headingScale.caption': 'ft-font-size-caption',
  'typography.lineHeight': 'ft-line-height-base',
  'spacing.xs': 'ft-space-xs',
  'spacing.sm': 'ft-space-sm',
  'spacing.md': 'ft-space-md',
  'spacing.lg': 'ft-space-lg',
  'spacing.xl': 'ft-space-xl',
  'spacing.xxl': 'ft-space-xxl',
  'radiuses.sm': 'ft-radius-sm',
  'radiuses.md': 'ft-radius-md',
  'radiuses.lg': 'ft-radius-lg',
  'radiuses.pill': 'ft-radius-pill',
  'shadows.elevated': 'ft-shadow-elevated',
  'shadows.floating': 'ft-shadow-floating',
  'shadows.focusRing': 'ft-shadow-focus-ring',
};

const futureSymbols = [
  'designTokenJsonCssParityContract',
  'designTokenJsonSchemaReport',
  'designTokenCssGenerationReport',
  'designTokenCssReferenceReport',
  'designTokenUndefinedVarReport',
  'designTokenUnusedVarBudget',
  'designTokenPackageInclusionReport',
  'designTokenHtmlLoadReport',
  'designTokenThemeSceneParityReport',
  'designTokenFirstClassJsonClaimGate',
  'designTokenVisualFixtureProvenance',
  'designTokenDeletionReadinessGate',
];

test('design token JSON CSS parity doc is audit-only and scoped to current behavior', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not filter-engine JSON/);
  assert.match(source, /tracked JSON input/);
  assert.match(source, /schema, consumer\s+freshness, generated-output parity, package inclusion/);
  assert.match(source, /Implementation\s+changes remain blocked/);
});

test('design token JSON and active CSS fingerprints remain pinned', () => {
  const jsonBytes = fs.readFileSync(path.join(repoRoot, 'design/design_tokens.json'));
  const cssBytes = fs.readFileSync(path.join(repoRoot, 'css/design_tokens.css'));
  const json = JSON.parse(jsonBytes.toString('utf8'));
  const leaves = walkLeaves(json);

  assert.equal(jsonBytes.toString('utf8').split('\n').length, 82);
  assert.equal(jsonBytes.length, 1902);
  assert.equal(sha256(jsonBytes), '57bada64f3690a22fedea5f07aadc029e129f971465f8c66baab4a005984b3f0');
  assert.deepEqual(Object.keys(json), ['metadata', 'colors', 'typography', 'spacing', 'radiuses', 'shadows']);
  assert.deepEqual(json.metadata, {
    version: '0.1.0',
    updated: '2025-11-18',
    source: 'FilterTube neuroinclusive palette',
  });
  assert.equal(leaves.length, 53);

  assert.equal(cssBytes.toString('utf8').split('\n').length, 302);
  assert.equal(cssBytes.length, 10361);
  assert.equal(sha256(cssBytes), '7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc');

  const audit = doc();
  assert.match(audit, /82 lines, 1,902 bytes/);
  assert.match(audit, /6 top-level keys, and 53 leaf values/);
  assert.match(audit, /version `0\.1\.0`, updated `2025-11-18`/);
  assert.match(audit, /302 lines, 10,361 bytes/);
});

test('CSS token definitions theme scene blocks and references remain source-derived', () => {
  const css = read('css/design_tokens.css');
  const baseRoot = sliceBetween(css, ':root {', '/* Dark Mode Overrides (Manual override) */');
  const manualDark = sliceBetween(css, ':root[data-theme="dark"] {', '/* Dark Mode Overrides (Auto-detect');
  const autoDark = sliceBetween(css, '@media (prefers-color-scheme: dark) {', ':root[data-scene="dawn"]');
  const sceneBlocks = sliceBetween(css, ':root[data-scene="dawn"] {', null);
  const baseDefs = cssVarDefinitions(baseRoot);
  const allDefs = cssVarDefinitions(css);
  const selectedSources = selectedUsageFiles.map(read).join('\n');
  const refs = cssVarReferences(selectedSources);
  const defSet = new Set(allDefs.map(([name]) => name));
  const refSet = new Set(refs);
  const undefinedRefs = [...refSet].filter((name) => !defSet.has(name)).sort();
  const unusedDefs = [...defSet].filter((name) => !refSet.has(name)).sort();

  assert.deepEqual(blockMetrics(baseRoot), {
    lines: 136,
    bytes: 4713,
    sha256: '8f1c05a04a517bb09e89d573f66efc64917edaeab25f0b25c9c2157f81154edf',
  });
  assert.deepEqual(blockMetrics(manualDark), {
    lines: 43,
    bytes: 1637,
    sha256: '1752667e764be5fcb7aa1435605d891e6fca37a11e90e9ec1c585b2e0219101b',
  });
  assert.deepEqual(blockMetrics(autoDark), {
    lines: 45,
    bytes: 1752,
    sha256: '49158b7800b6c1c90464e4ccf265104909b83cacbfa6b3dc135f380063845f5f',
  });
  assert.deepEqual(blockMetrics(sceneBlocks), {
    lines: 62,
    bytes: 1857,
    sha256: '60124ee3a17036ba4ceec771529a846e154cbdf7e57bfc63fbad42c491e2d78d',
  });

  assert.equal(baseDefs.length, 80);
  assert.equal(new Set(baseDefs.map(([name]) => name)).size, 80);
  assert.equal(allDefs.length, 192);
  assert.equal(defSet.size, 80);
  assert.equal(count(manualDark, /--ft-/g), 35);
  assert.equal(count(autoDark, /--ft-/g), 35);
  for (const scene of ['dawn', 'day', 'sunset', 'night']) {
    assert.match(sceneBlocks, new RegExp(`:root\\[data-scene="${scene}"\\]`));
  }
  for (const darkScene of ['dawn', 'sunset', 'night']) {
    assert.match(sceneBlocks, new RegExp(`:root\\[data-theme="dark"\\]\\[data-scene="${darkScene}"\\]`));
  }

  assert.equal(selectedUsageFiles.length, 11);
  assert.equal(refs.length, 715);
  assert.equal(refSet.size, 82);
  assert.equal(undefinedRefs.length, 29);
  assert.equal(unusedDefs.length, 27);
  assert.deepEqual(undefinedRefs, [
    'ft-category-color',
    'ft-category-color-bg',
    'ft-category-color-bg-active',
    'ft-category-color-border',
    'ft-color-bg-disabled',
    'ft-color-bg-elevated',
    'ft-color-bg-input',
    'ft-color-bg-input-dark',
    'ft-color-bg-panel-dark',
    'ft-color-primary',
    'ft-color-primary-alpha',
    'ft-color-primary-light',
    'ft-color-sem-neutral-border-dark',
    'ft-color-text-primary-dark',
    'ft-color-text-secondary-dark',
    'ft-control-accent-border',
    'ft-control-row-divider',
    'ft-control-row-hover',
    'ft-font-family-body',
    'ft-font-size-xs',
    'ft-kids-pink',
    'ft-kids-pink-light',
    'ft-kids-purple',
    'ft-kids-purple-light',
    'ft-popup-action-btn-width',
    'ft-profile-accent',
    'ft-profile-accent-bg',
    'ft-profile-accent-border',
    'ft-space-xxs',
  ]);

  const perFileRefCounts = Object.fromEntries(
    selectedUsageFiles.map((file) => [file, cssVarReferences(read(file)).length])
  );
  assert.equal(perFileRefCounts['css/components.css'], 176);
  assert.equal(perFileRefCounts['css/popup.css'], 199);
  assert.equal(perFileRefCounts['css/tab-view.css'], 336);
  assert.equal(perFileRefCounts['html/tab-view.html'], 4);

  const audit = doc();
  assert.match(audit, /715 `var\(--ft-\.\.\.\)` references/);
  assert.match(audit, /29 unique referenced variables are not defined/);
  assert.match(audit, /27 unique CSS token definitions are not referenced/);
});

test('mapped JSON token values diverge from the active CSS token file', () => {
  const jsonLeaves = new Map(walkLeaves(readJson('design/design_tokens.json')).map(([key, value]) => [key, String(value)]));
  const css = read('css/design_tokens.css');
  const baseRoot = sliceBetween(css, ':root {', '/* Dark Mode Overrides (Manual override) */');
  const baseDefMap = new Map(cssVarDefinitions(baseRoot));
  const mapped = Object.entries(jsonPathToCssVar).map(([jsonPath, cssVar]) => {
    const jsonValue = jsonLeaves.get(jsonPath);
    const cssValue = baseDefMap.get(cssVar);
    return {
      jsonPath,
      cssVar,
      jsonValue,
      cssValue,
      exact: String(jsonValue).toLowerCase() === String(cssValue).toLowerCase(),
    };
  });

  assert.equal(mapped.length, 43);
  assert.equal(mapped.filter((row) => row.cssValue === undefined).length, 0);
  assert.equal(mapped.filter((row) => row.exact).length, 3);
  assert.equal(mapped.filter((row) => !row.exact).length, 40);

  const examples = new Map(mapped.map((row) => [row.jsonPath, row]));
  assert.deepEqual(examples.get('colors.brand.primaryRed'), {
    jsonPath: 'colors.brand.primaryRed',
    cssVar: 'ft-color-brand-primary',
    jsonValue: '#FF2F2F',
    cssValue: '#ab4438',
    exact: false,
  });
  assert.deepEqual(examples.get('spacing.md'), {
    jsonPath: 'spacing.md',
    cssVar: 'ft-space-md',
    jsonValue: '12px',
    cssValue: '16px',
    exact: false,
  });
  assert.deepEqual(examples.get('radiuses.pill'), {
    jsonPath: 'radiuses.pill',
    cssVar: 'ft-radius-pill',
    jsonValue: '999px',
    cssValue: '9999px',
    exact: false,
  });
  assert.equal(examples.get('spacing.xs').exact, true);
  assert.equal(examples.get('spacing.sm').exact, true);
  assert.equal(examples.get('typography.lineHeight').exact, true);

  const audit = doc();
  assert.match(audit, /A direct path-to-variable mapping covers 43 JSON leaves/);
  assert.match(audit, /only 3 values match exactly; 40 mapped values diverge/);
  assert.match(audit, /JSON `#FF2F2F`, CSS `#ab4438`/);
  assert.match(audit, /JSON `12px`, CSS `16px`/);
  assert.match(audit, /JSON `999px`, CSS `9999px`/);
});

test('design token HTML load and package boundaries remain explicit', () => {
  const popupHead = sliceBetween(read('html/popup.html'), '<head>', '</head>');
  const tabHead = sliceBetween(read('html/tab-view.html'), '<head>', '</head>');
  const buildConfig = sliceBetween(read('build.js'), 'const ALL_BROWSER_TARGETS', 'const cliArgs');
  const packageScripts = readJson('package.json').scripts;

  assert.deepEqual(blockMetrics(popupHead), {
    lines: 11,
    bytes: 642,
    sha256: 'b8d772cf1aea8dbda410ef3ce67ee3d3908abb7d7ae7e4834095bfb044e22a4b',
  });
  assert.deepEqual(blockMetrics(tabHead), {
    lines: 11,
    bytes: 655,
    sha256: '62587265ac61f04f7837aa92553e91c0d10351363e23d32dd1cd1ca5c7b6e197',
  });
  for (const head of [popupHead, tabHead]) {
    assert.match(head, /<link rel="stylesheet" href="\.\.\/css\/design_tokens\.css">/);
    assert.ok(head.indexOf('../css/design_tokens.css') < head.indexOf('../css/components.css'));
  }
  assert.equal(read('html/troubleshoot.html'), '');

  assert.deepEqual(blockMetrics(buildConfig), {
    lines: 24,
    bytes: 692,
    sha256: '05511234c87ef92f45a9cab210b2353018c662c1924bf02ce89a20522b391135',
  });
  assert.match(buildConfig, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.doesNotMatch(buildConfig, /design/);
  assert.equal(/design\/design_tokens\.json/.test(read('build.js')), false);
  assert.deepEqual(Object.entries(packageScripts).filter(([key, value]) => /design|token/i.test(`${key} ${value}`)), []);

  const audit = doc();
  assert.match(audit, /`html\/popup\.html` and `html\/tab-view\.html` both load `\.\.\/css\/design_tokens\.css`/);
  assert.match(audit, /`build\.js` copies the `css` directory, but not the `design` directory/);
  assert.match(audit, /has no script whose name or command mentions design tokens/);
});

test('design token parity future authority symbols are absent from selected product source', () => {
  const selectedProductSource = [
    'design/design_tokens.json',
    'css/design_tokens.css',
    'css/components.css',
    'css/popup.css',
    'css/tab-view.css',
    'html/popup.html',
    'html/tab-view.html',
    'html/troubleshoot.html',
    'build.js',
    'package.json',
  ].map(read).join('\n');
  const audit = doc();

  for (const symbol of futureSymbols) {
    assert.equal(selectedProductSource.includes(symbol), false, `${symbol} unexpectedly exists in selected product source`);
    assert.ok(audit.includes(symbol), `audit doc missing future symbol ${symbol}`);
  }

  assert.match(audit, /not the active CSS generator/);
  assert.match(audit, /undefined variables/);
  assert.match(audit, /unused active-scope variables/);
  assert.match(audit, /does\s+not close first-class JSON filter readiness/);
});
