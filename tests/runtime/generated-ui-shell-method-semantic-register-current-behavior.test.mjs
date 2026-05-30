import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_GENERATED_UI_SHELL_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourceFiles = [
  'scripts/build-extension-ui.mjs',
  'src/extension-shell/popup.jsx',
  'src/extension-shell/tab-view-decor.jsx',
  'src/extension-shell/shared/runtime.js'
];
const generatedFiles = [
  'js/ui-shell/popup-shell.js',
  'js/ui-shell/tab-view-decor.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function doc() {
  return read(docPath);
}

function sourceText() {
  return sourceFiles.map(read).join('\n');
}

function generatedText() {
  return generatedFiles.map(read).join('\n');
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

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function lockPackageVersion(packageName) {
  const lock = readJson('package-lock.json');
  return lock.packages?.[`node_modules/${packageName}`]?.version;
}

function groupForName(name) {
  if (['ensureOutputDirectories', 'bundleAll'].includes(name)) return 'generatedUiBuildScript';
  if (['ShellGlow', 'PopupShell'].includes(name)) return 'generatedPopupShell';
  if (name === 'TabViewDecor') return 'generatedTabViewShell';
  if (['getSceneForHour', 'getSystemTheme', 'applyExtensionEnvironment'].includes(name)) return 'generatedShellRuntime';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  for (const file of sourceFiles) {
    read(file).split(/\r?\n/).forEach((line, index) => {
      const lineNumber = index + 1;
      let match = line.match(/^async function\s+([A-Za-z_$][\w$]*)\s*\(/);
      if (match) {
        rows.push({ file, line: lineNumber, kind: 'asyncFunction', name: match[1] });
        return;
      }
      match = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
      if (match) {
        rows.push({ file, line: lineNumber, kind: 'function', name: match[1] });
        return;
      }
      match = line.match(/^export function\s+([A-Za-z_$][\w$]*)\s*\(/);
      if (match) {
        rows.push({ file, line: lineNumber, kind: 'exportFunction', name: match[1] });
      }
    });
  }
  return rows.map((row) => ({ ...row, group: groupForName(row.name) }));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function scriptRefs(file) {
  return [...read(file).matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
}

test('generated UI shell method register is audit-only and source scoped', () => {
  const text = doc();
  const source = sourceText();
  const generated = generatedText();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime and build behavior are unchanged/);
  assert.match(text, /scripts\/build-extension-ui\.mjs/);
  assert.match(text, /src\/extension-shell\/popup\.jsx/);
  assert.match(text, /src\/extension-shell\/tab-view-decor\.jsx/);
  assert.match(text, /src\/extension-shell\/shared\/runtime\.js/);
  assert.match(text, /js\/ui-shell\/popup-shell\.js/);
  assert.match(text, /js\/ui-shell\/tab-view-decor\.js/);
  assert.equal(sourceFiles.reduce((sum, file) => sum + sourceLineCount(read(file)), 0), 249);
  assert.equal(generatedFiles.reduce((sum, file) => sum + sourceLineCount(read(file)), 0), 697);
  assert.match(text, /authoring\/build source line count: 249/);
  assert.match(text, /generated output line count: 697/);
  assert.match(text, /authoring\/build source bytes: 7615/);
  assert.match(text, /generated output bytes: 39369/);
  assert.match(text, /runtime behavior changed: no/);
  assert.doesNotMatch(source, /uiShellFreshnessManifest/);
  assert.doesNotMatch(generated, /uiShellFreshnessManifest/);
});

test('generated UI shell register accounts for every current source method row', () => {
  const text = doc();
  const rows = methodRows();

  assert.equal(rows.length, 8);
  assert.deepEqual(countBy(rows, 'kind'), {
    asyncFunction: 2,
    exportFunction: 3,
    function: 3
  });
  assert.deepEqual(countBy(rows, 'group'), {
    generatedPopupShell: 2,
    generatedShellRuntime: 3,
    generatedTabViewShell: 1,
    generatedUiBuildScript: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.file}:${row.name} should be classified`);
    assert.ok(
      text.includes(`| \`${row.file}\` | ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing generated UI shell method row ${row.file}:${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('generated UI shell register pins build source and generated output counts', () => {
  const text = doc();
  const source = sourceText();
  const generated = generatedText();
  const countPairs = [
    ['arrow token sites in authoring/build source', count(source, /=>/g)],
    ['document literal occurrences in authoring/build source', countLiteral(source, 'document')],
    ['window literal occurrences in authoring/build source', countLiteral(source, 'window')],
    ['style property writes in authoring/build source', countLiteral(source, '.style.')],
    ['dataset writes/reads in authoring/build source', countLiteral(source, '.dataset.')],
    ['render calls in authoring/build source', count(source, /\brender\s*\(/g)],
    ['video JSX elements in authoring/build source', count(source, /<video/g)],
    ['document literal occurrences in generated output', countLiteral(generated, 'document')],
    ['window literal occurrences in generated output', countLiteral(generated, 'window')],
    ['style property writes in generated output', countLiteral(generated, '.style.')],
    ['dataset writes/reads in generated output', countLiteral(generated, '.dataset.')],
    ['render calls in generated output', count(generated, /\brender\s*\(/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }

  for (const [file, expected] of Object.entries({
    'scripts/build-extension-ui.mjs': [50, 1188],
    'src/extension-shell/popup.jsx': [113, 3864],
    'src/extension-shell/tab-view-decor.jsx': [34, 1101],
    'src/extension-shell/shared/runtime.js': [52, 1462],
    'js/ui-shell/popup-shell.js': [374, 21080],
    'js/ui-shell/tab-view-decor.js': [323, 18289]
  })) {
    const [lines, bytes] = expected;
    assert.equal(sourceLineCount(read(file)), lines);
    assert.equal(fs.statSync(path.join(repoRoot, file)).size, bytes);
    assert.match(text, new RegExp(`${escapeRegExp(file)}: ${lines} lines, ${bytes} bytes`));
  }
});

function assertBuildFreshnessFlowAndHashes() {
  const text = doc();
  const packageJson = readJson('package.json');

  assert.match(text, /## Build Freshness Flow - 2026-05-27/);
  assert.match(text, /npm run build:ui/);
  assert.match(text, /node scripts\/build-extension-ui\.mjs/);
  assert.match(text, /Promise\.all two esbuild browser IIFE bundles/);
  assert.match(text, /src\/extension-shell\/popup\.jsx -> js\/ui-shell\/popup-shell\.js/);
  assert.match(text, /src\/extension-shell\/tab-view-decor\.jsx -> js\/ui-shell\/tab-view-decor\.js/);
  assert.match(text, /no source\/output freshness manifest is written/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /release package proof remains NO-GO/);
  assert.match(text, /runtime behavior changed: no/);

  for (const file of [
    'scripts/build-extension-ui.mjs',
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
    'src/extension-shell/shared/runtime.js',
    'js/ui-shell/popup-shell.js',
    'js/ui-shell/tab-view-decor.js'
  ]) {
    assert.ok(text.includes(`| \`${file}\` |`), `missing hash row for ${file}`);
    assert.ok(text.includes(`\`${sha256(file)}\``), `missing current sha256 for ${file}`);
  }

  assert.equal(packageJson.devDependencies.esbuild, '^0.27.4');
  assert.equal(lockPackageVersion('esbuild'), '0.27.4');
  assert.equal(packageJson.dependencies.preact, '^10.29.0');
  assert.equal(lockPackageVersion('preact'), '10.29.0');
  for (const token of [
    'package.json esbuild range: ^0.27.4',
    'package-lock esbuild version: 0.27.4',
    'package.json preact range: ^10.29.0',
    'package-lock preact version: 10.29.0',
    'source/output freshness manifest: absent',
    'generated output hash manifest: absent',
    'build failure rollback: absent',
    'stale generated bundle deletion on failure: absent',
    'tracked generated output owner: source review and package build both see js/ui-shell',
    'The release-relevant gap is that a failed build sets `process.exitCode = 1`',
    'does not delete old output files or write a failed-build report',
    'That is current behavior, not a recommendation.'
  ]) {
    assert.ok(text.includes(token), `missing build freshness token ${token}`);
  }
}

test('generated UI shell register preserves build config load order and artifact boundaries', () => {
  const text = doc();
  const buildScript = read('scripts/build-extension-ui.mjs');
  const packageJson = readJson('package.json');
  const popupScripts = scriptRefs('html/popup.html');
  const tabScripts = scriptRefs('html/tab-view.html');
  const popupOutput = read('js/ui-shell/popup-shell.js');
  const tabOutput = read('js/ui-shell/tab-view-decor.js');

  assertBuildFreshnessFlowAndHashes();

  assert.equal(packageJson.scripts['build:ui'], 'node scripts/build-extension-ui.mjs');
  assert.match(read('build.js'), /execSync\('node scripts\/build-extension-ui\.mjs', \{ stdio: 'inherit' \}\)/);

  for (const token of [
    'src/extension-shell/popup.jsx',
    'js/ui-shell/popup-shell.js',
    'src/extension-shell/tab-view-decor.jsx',
    'js/ui-shell/tab-view-decor.js',
    'await mkdir(path.join(root, "js/ui-shell"), { recursive: true })',
    'Promise.all',
    'entryPoints.map(({ input, output }) =>',
    'bundle: true',
    'format: "iife"',
    'platform: "browser"',
    'target: ["chrome111", "firefox109"]',
    'jsxFactory: "h"',
    'jsxFragment: "Fragment"',
    'legalComments: "none"',
    'sourcemap: false',
    'minify: false',
    'logLevel: "info"',
    'process.exitCode = 1'
  ]) {
    assert.ok(buildScript.includes(token), `build script missing ${token}`);
  }

  assert.ok(popupScripts.indexOf('../js/ui-shell/popup-shell.js') < popupScripts.indexOf('../js/popup.js'));
  assert.ok(tabScripts.indexOf('../js/ui-shell/tab-view-decor.js') < tabScripts.indexOf('../js/tab-view.js'));

  for (const marker of ['homepage_hero_day.mp4', 'popupRoot', 'ft-extension-surface', 'ft-popup-shell']) {
    assert.match(popupOutput, new RegExp(escapeRegExp(marker)));
  }
  for (const marker of ['homepage_hero_day.mp4', 'tabViewShellDecor', 'ft-extension-surface', 'ft-tab-view-ambient']) {
    assert.match(tabOutput, new RegExp(escapeRegExp(marker)));
  }
  assert.doesNotMatch(popupOutput, /sourceMappingURL/);
  assert.doesNotMatch(tabOutput, /sourceMappingURL/);

  for (const token of [
    'npm script entrypoint: npm run build:ui -> node scripts/build-extension-ui.mjs',
    'build.js calls node scripts/build-extension-ui.mjs before package copy',
    'build concurrency: Promise.all(entryPoints.map(...))',
    'source/output freshness manifest: absent',
    'generated output hash manifest: absent',
    'sourceMappingURL output: absent',
    'generated UI output is tracked source, not regenerated on import or extension startup',
    'build failure sets process.exitCode but does not delete stale output files',
    'popup shell render is skipped silently when popupRoot is missing',
    'tab-view shell render is skipped silently when tabViewShellDecor is missing',
    'popup environment writes fixed 392px width',
    'no committed source/output hash or freshness report proves generated output parity today'
  ]) {
    assert.ok(text.includes(token), `missing generated UI shell boundary token ${token}`);
  }
});

test('generated UI shell register preserves future proof fields and missing authority boundary', () => {
  const text = doc();
  const currentSurfaces = [
    ...sourceFiles,
    ...generatedFiles,
    'html/popup.html',
    'html/tab-view.html',
    'build.js'
  ].map(read).join('\n');

  for (const field of [
    'generatedUiMethodReference',
    'sourceInputPath',
    'generatedOutputPath',
    'sourceHash',
    'generatedOutputHash',
    'esbuildVersion',
    'preactVersion',
    'htmlMountSelector',
    'htmlScriptPath',
    'sourceOutputFreshness',
    'loadOrderProof',
    'renderFixture',
    'missingMountBehavior',
    'buildFailureBehavior',
    'staleOutputPolicy',
    'releasePackageProof'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingAuthority of [
    'generatedUiShellMethodAuthority',
    'uiShellFreshnessManifest',
    'uiShellSourceHashManifest',
    'uiShellGeneratedOutputHash',
    'uiShellGeneratedOutputOwner',
    'uiShellPackageParityReport',
    'uiShellBrowserRenderFixture',
    'uiShellBuildFailureContract',
    'uiShellSourceOutputDriftReport',
    'uiShellStaleOutputFailureReport',
    'uiShellReleaseFixtureProvenance'
  ]) {
    assert.match(text, new RegExp(missingAuthority));
    assert.doesNotMatch(currentSurfaces, new RegExp(missingAuthority));
  }
});
