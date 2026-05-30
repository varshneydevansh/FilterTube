import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_UI_COMPONENTS_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/ui_components.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function groupForMethod(name) {
  if (['UIComponents', 'isDarkTheme', 'hashHue', 'getProfileColors'].includes(name)) {
    return 'uiComponentsModuleThemeAndProfile';
  }
  if (['createButton', 'flashButtonSuccess', 'createToggleButton', 'createDeleteButton', 'createIconButton'].includes(name)) {
    return 'uiComponentsButtonAndIconFactory';
  }
  if (['createInput', 'createSearchInput', 'createCheckbox', 'createSelect'].includes(name)) {
    return 'uiComponentsInputAndSelectFactory';
  }
  if (['createTabs', 'switchTab', 'getCurrentTab'].includes(name)) {
    return 'uiComponentsTabFactory';
  }
  if (['createListItem', 'createEmptyState', 'createBadge', 'createChannelLogo', 'createInputRow'].includes(name)) {
    return 'uiComponentsListAndCardFactory';
  }
  if ([
    'createDropdownFromSelect',
    'updateTriggerLabel',
    'close',
    'syncDisabled',
    'position',
    'schedulePosition',
    'toggle',
    'resolveContextSubtitle',
    'getAccentVars',
    'applyAccentVars',
    'rebuildOptions'
  ].includes(name)) {
    return 'uiComponentsEnhancedSelectDropdown';
  }
  if (name === 'showToast') return 'uiComponentsToastLifecycle';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    let match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: match[1] ? 'async function' : 'function',
        name,
        group: groupForMethod(name)
      });
      return;
    }

    match = line.match(/^\s*(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    if (match) {
      const name = match[2];
      rows.push({
        line: index + 1,
        kind: /async/.test(line) ? `async ${match[1]} arrow` : `${match[1]} arrow`,
        name,
        group: groupForMethod(name)
      });
    }
  });
  return rows;
}

function publicApiRows() {
  const source = read(sourcePath).split(/\r?\n/);
  const returnStart = source.findIndex((line) => /^\s{4}return\s+\{/.test(line));
  const returnEnd = source.findIndex((line, index) => index > returnStart && /^\s{4}\};/.test(line));
  const rows = [];

  for (let index = returnStart + 1; index < returnEnd; index += 1) {
    const match = source[index].match(/^\s{8}([A-Za-z_$][\w$]*),?\s*$/);
    if (match) rows.push({ line: index + 1, name: match[1] });
  }

  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('UI components method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/ui_components\.js/);
  assert.match(text, /line count: 998/);
  assert.equal(sourceLineCount(), 998);
  assert.match(text, /named declarations: 33/);
  assert.match(text, /plain function declarations: 22/);
  assert.match(text, /const arrow helper declarations: 11/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /public UIComponents entries: 19/);
  assert.match(text, /semantic method groups: 7/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for every UI listener callback/);
});

test('UI components register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 33);
  assert.deepEqual(countBy(rows, 'kind'), {
    'const arrow': 11,
    function: 22
  });
  assert.deepEqual(countBy(rows, 'group'), {
    uiComponentsButtonAndIconFactory: 5,
    uiComponentsEnhancedSelectDropdown: 11,
    uiComponentsInputAndSelectFactory: 4,
    uiComponentsListAndCardFactory: 5,
    uiComponentsModuleThemeAndProfile: 4,
    uiComponentsTabFactory: 3,
    uiComponentsToastLifecycle: 1
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('UI components register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing UIComponents method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  assert.deepEqual(publicApiRows().map((row) => row.name), [
    'Colors',
    'getProfileColors',
    'createButton',
    'flashButtonSuccess',
    'createToggleButton',
    'createDeleteButton',
    'createInput',
    'createSearchInput',
    'createCheckbox',
    'createSelect',
    'createDropdownFromSelect',
    'createIconButton',
    'createBadge',
    'createChannelLogo',
    'createInputRow',
    'createTabs',
    'createListItem',
    'createEmptyState',
    'showToast'
  ]);
  for (const row of publicApiRows()) {
    assert.ok(text.includes(row.name), `missing public API entry ${row.name}`);
  }
});

test('UI components register pins DOM listener timer observer and dependency surface counts', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal((source.match(/document\.createElement\(/g) || []).length, 36);
  assert.equal((source.match(/document\.querySelector\(/g) || []).length, 0);
  assert.equal((source.match(/document\.querySelectorAll\(/g) || []).length, 1);
  assert.equal((source.match(/\.querySelector\(/g) || []).length, 1);
  assert.equal((source.match(/\.querySelectorAll\(/g) || []).length, 3);
  assert.equal((source.match(/\.addEventListener\(/g) || []).length, 17);
  assert.equal((source.match(/document\.addEventListener\(/g) || []).length, 1);
  assert.equal((source.match(/window\.addEventListener\(/g) || []).length, 2);
  assert.equal((source.match(/\bsetTimeout\(/g) || []).length, 3);
  assert.equal((source.match(/\bclearTimeout\(/g) || []).length, 0);
  assert.equal((source.match(/\bsetInterval\(/g) || []).length, 0);
  assert.equal((source.match(/\bclearInterval\(/g) || []).length, 0);
  assert.equal((source.match(/\brequestAnimationFrame\(/g) || []).length, 4);
  assert.equal((source.match(/\bcancelAnimationFrame\(/g) || []).length, 1);
  assert.equal((source.match(/\bnew\s+MutationObserver\(/g) || []).length, 1);
  assert.equal((source.match(/\.observe\(/g) || []).length, 1);
  assert.equal((source.match(/\.disconnect\(/g) || []).length, 0);
  assert.equal((source.match(/\.innerHTML\s*=/g) || []).length, 5);
  assert.equal((source.match(/\.textContent\s*=/g) || []).length, 16);
  assert.equal((source.match(/\.setAttribute\(/g) || []).length, 21);
  assert.equal((source.match(/\.style\.setProperty\(/g) || []).length, 6);
  assert.equal((source.match(/\.style\.display\s*=/g) || []).length, 3);
  assert.equal((source.match(/\.hidden\s*=/g) || []).length, 4);
  assert.equal((source.match(/\.appendChild\(/g) || []).length, 28);
  assert.equal((source.match(/\.remove\(/g) || []).length, 4);
  assert.equal((source.match(/\.dispatchEvent\(/g) || []).length, 2);
  assert.equal((source.match(/\bgetComputedStyle\(/g) || []).length, 1);
  assert.equal((source.match(/\.getBoundingClientRect\(/g) || []).length, 2);
  assert.equal((source.match(/document\.body\.appendChild\(/g) || []).length, 2);
  assert.equal((source.match(/window\.UIComponents/g) || []).length, 1);
  assert.equal((source.match(/module\.exports/g) || []).length, 2);

  for (const token of [
    'document.createElement calls: 36',
    'document.querySelector calls: 0',
    'document.querySelectorAll calls: 1',
    'querySelector calls: 1',
    'querySelectorAll calls: 3',
    'addEventListener calls: 17',
    'document.addEventListener calls: 1',
    'window.addEventListener calls: 2',
    'setTimeout calls: 3',
    'clearTimeout calls: 0',
    'setInterval calls: 0',
    'clearInterval calls: 0',
    'requestAnimationFrame calls: 4',
    'cancelAnimationFrame calls: 1',
    'MutationObserver constructors: 1',
    'observe calls: 1',
    'disconnect calls: 0',
    'innerHTML writes: 5',
    'textContent writes: 16',
    'setAttribute calls: 21',
    'style.setProperty calls: 6',
    'style.display writes: 3',
    'hidden writes: 4',
    'appendChild calls: 28',
    'remove calls: 4',
    'dispatchEvent calls: 2',
    'getComputedStyle calls: 1',
    'getBoundingClientRect calls: 2',
    'document.body.appendChild calls: 2',
    'window.UIComponents assignments: 1',
    'module.exports references: 2'
  ]) {
    assert.ok(text.includes(token), `missing UIComponents surface token ${token}`);
  }
});

test('UI components source still proves current behavior boundaries', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.match(source, /const UIComponents = \(\(\) => \{/);
  assert.match(source, /return document\.documentElement\.getAttribute\('data-theme'\) === 'dark'/);
  assert.match(source, /function getProfileColors\(seed\)/);
  assert.match(source, /if \(onClick\) btn\.addEventListener\('click', onClick\)/);
  assert.match(source, /toggle\.addEventListener\('keydown', \(e\) => \{/);
  assert.match(source, /btn\.innerHTML = `[\s\S]*<svg width="14" height="14"/);
  assert.match(source, /btn\.innerHTML = tab\.label/);
  assert.match(source, /contentWrapper\.innerHTML = tab\.content/);
  assert.ok(source.includes("tabButtons.querySelectorAll('.tab-button')"));
  assert.match(source, /document\.body\.appendChild\(dropdown\)/);
  assert.match(source, /positionRaf = requestAnimationFrame\(\(\) => \{/);
  assert.match(source, /cancelAnimationFrame\(positionRaf\)/);
  assert.match(source, /window\.addEventListener\('resize'/);
  assert.match(source, /document\.addEventListener\('click'/);
  assert.match(source, /const obs = new MutationObserver\(\(\) => \{/);
  assert.match(source, /obs\.observe\(select, \{ attributes: true, attributeFilter: \['disabled'\] \}\)/);
  assert.match(source, /select\.style\.display = 'none'/);
  assert.match(source, /select\.dispatchEvent\(changeEvent\)/);
  assert.ok(source.includes("document.querySelectorAll('.ft-toast').forEach(t => t.remove())"));
  assert.match(source, /setTimeout\(\(\) => toast\.remove\(\), 300\)/);
  assert.match(source, /window\.UIComponents = UIComponents/);
  assert.match(source, /module\.exports = UIComponents/);

  for (const selector of [
    "tabButtons.querySelectorAll('.tab-button')",
    "tabContent.querySelectorAll('.tab-pane')",
    "container.querySelector('.label, .toggle-title')",
    "document.querySelectorAll('.ft-toast')"
  ]) {
    assert.ok(text.includes(selector), `missing selector surface ${selector}`);
  }
});

test('UI components register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'publicApiEntry',
    'callerSurface',
    'domElementsCreated',
    'selectorsRead',
    'innerHtmlInput',
    'listenersRegistered',
    'listenerTeardown',
    'timerEffect',
    'frameEffect',
    'observerEffect',
    'bodyPortalEffect',
    'dispatchEventEffect',
    'ariaRoleEffect',
    'classStateEffect',
    'styleWriteEffect',
    'profileColorSeed',
    'toastReplacementEffect',
    'positiveFixture',
    'negativeDisabledFixture',
    'negativeKeyboardFixture',
    'negativeTeardownFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks UI components method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'uiComponentsMethodAuthority',
    'uiComponentsDomEffectReport',
    'uiComponentsListenerLifecycleContract',
    'uiComponentsDropdownTeardownRegistry',
    'uiComponentsToastLifecycleBudget',
    'uiComponentsAccessibilityContract',
    'uiComponentsSelectorScopeReport',
    'uiComponentsPublicApiManifest',
    'uiComponentsRawHtmlPolicy',
    'uiComponentsProfileColorContract',
    'uiComponentsFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
