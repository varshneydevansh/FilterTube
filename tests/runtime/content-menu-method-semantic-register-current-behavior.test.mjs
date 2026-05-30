import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content/menu.js';
const manifestPath = 'manifest.json';
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
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
  if (name === 'escapeHtml') return 'contentMenuHtmlEscaping';
  if (name === 'ensureFilterTubeMenuStyles') return 'contentMenuStyleInjection';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const fn = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (fn) {
      rows.push({
        line: index + 1,
        kind: 'function',
        name: fn[1],
        group: groupForMethod(fn[1])
      });
    }
  });
  return rows;
}

function broadCallableRows() {
  const source = read(sourcePath);
  const rows = [];
  let match;
  while ((match = broadCallableRe.exec(source))) {
    rows.push(match.slice(1).find(Boolean));
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function countRegex(source, regex) {
  return (source.match(regex) || []).length;
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

function loadContentMenuRuntime() {
  const appended = [];
  const children = [];
  const document = {
    createElement(tagName) {
      return { tagName, id: '', textContent: '' };
    },
    documentElement: {
      children,
      appendChild(node) {
        node.parentNode = this;
        children.push(node);
        appended.push(node);
        return node;
      }
    }
  };
  const context = { document };
  vm.createContext(context);
  vm.runInContext(read(sourcePath), context);
  return { context, appended, children, document };
}

test('content menu method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content\/menu\.js/);
  assert.match(text, /line count: 309/);
  assert.equal(sourceLineCount(), 309);
  assert.match(text, /source bytes: 12913/);
  assert.equal(readBuffer(sourcePath).byteLength, 12913);
  assert.match(text, /source sha256: cd7cbfb240ea39174cb395a67e42ddb117feaf05e896773164a2c409ab21e1bc/);
  assert.equal(sha256(sourcePath), 'cd7cbfb240ea39174cb395a67e42ddb117feaf05e896773164a2c409ab21e1bc');
  assert.match(text, /repo-wide broad parser lexical callable matches: 3/);
  assert.match(text, /runtime function declarations: 2/);
  assert.match(text, /control-flow lexical artifacts: 1/);
  assert.match(text, /file-local executable behavior rows: 2/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /named function declarations in scope: 2/);
  assert.match(text, /plain function declarations: 2/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /const helper\/callback declarations: 0/);
  assert.match(text, /module-scoped state declarations: 1/);
  assert.match(text, /arrow callback sites in scope: 0/);
  assert.match(text, /semantic method groups: 2/);
  assert.match(text, /browser\/global export: implicit isolated-world load-order helpers/);
  assert.match(text, /CommonJS export: none/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for menu affordance authority/);
});

test('content menu method register accounts for every current function row', () => {
  const rows = methodRows();
  const broadRows = broadCallableRows();

  assert.equal(rows.length, 2);
  assert.deepEqual(broadRows, ['escapeHtml', 'ensureFilterTubeMenuStyles', 'if']);
  assert.deepEqual(countBy(rows, 'kind'), { function: 2 });
  assert.deepEqual(countBy(rows, 'group'), {
    contentMenuHtmlEscaping: 1,
    contentMenuStyleInjection: 1
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }

  const text = doc();
  assert.match(text, /## Lexical Callable Reconciliation/);
  assert.match(text, /\| `if` \| no \| `if \(filterTubeMenuStylesInjected\) \{` inside `ensureFilterTubeMenuStyles\(\)`/);
  assert.match(text, /Control-flow artifact from the broad method-shorthand branch/);
  assert.match(text, /the repo-wide proof layer has a callable-kind classifier/);
  assert.match(text, /it does not promote the global method proof count/);
  assert.match(text, /0 complete per-callable semantic files/);
});

test('content menu method register preserves every source row', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing content menu method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('content menu register pins DOM style and selector-token counts', () => {
  const text = doc();
  const source = read(sourcePath);

  assert.equal(countRegex(source, /=>/g), 0);
  assert.equal(countLiteral(source, 'document'), 3);
  assert.equal(countLiteral(source, 'window'), 0);
  assert.equal(countLiteral(source, 'location'), 0);
  assert.equal(countLiteral(source, 'document.querySelector('), 0);
  assert.equal(countLiteral(source, 'document.querySelectorAll('), 0);
  assert.equal(countLiteral(source, 'querySelector('), 0);
  assert.equal(countLiteral(source, 'querySelectorAll('), 0);
  assert.equal(countLiteral(source, 'closest('), 0);
  assert.equal(countLiteral(source, 'matches('), 0);
  assert.equal(countLiteral(source, 'document.createElement'), 1);
  assert.equal(countLiteral(source, 'document.documentElement'), 1);
  assert.equal(countLiteral(source, 'addEventListener'), 0);
  assert.equal(countLiteral(source, 'removeEventListener'), 0);
  assert.equal(countLiteral(source, 'MutationObserver'), 0);
  assert.equal(countLiteral(source, 'observe('), 0);
  assert.equal(countLiteral(source, 'disconnect('), 0);
  assert.equal(countLiteral(source, 'setTimeout'), 0);
  assert.equal(countLiteral(source, 'clearTimeout'), 0);
  assert.equal(countLiteral(source, 'setInterval'), 0);
  assert.equal(countLiteral(source, 'clearInterval'), 0);
  assert.equal(countLiteral(source, 'requestAnimationFrame'), 0);
  assert.equal(countLiteral(source, 'cancelAnimationFrame'), 0);
  assert.equal(countLiteral(source, 'innerHTML'), 0);
  assert.equal(countLiteral(source, 'textContent'), 1);
  assert.equal(countLiteral(source, 'setAttribute'), 0);
  assert.equal(countLiteral(source, 'removeAttribute'), 0);
  assert.equal(countLiteral(source, 'appendChild'), 1);
  assert.equal(countLiteral(source, '.remove('), 0);
  assert.equal(countLiteral(source, 'postMessage'), 0);
  assert.equal(countLiteral(source, 'chrome.runtime'), 0);
  assert.equal(countLiteral(source, 'fetch('), 0);
  assert.equal(countLiteral(source, 'JSON.parse'), 0);
  assert.equal(countLiteral(source, 'JSON.stringify'), 0);
  assert.equal(countLiteral(source, '.replace('), 5);
  assert.equal(countLiteral(source, 'String('), 1);
  assert.equal(countLiteral(source, 'styleTag.id'), 1);
  assert.equal(countLiteral(source, 'filterTubeMenuStylesInjected'), 3);
  assert.equal(countLiteral(source, 'styleContent'), 2);
  assert.equal(countLiteral(source, 'filtertube-menu-item'), 21);
  assert.equal(countLiteral(source, 'filtertube-block-channel-item'), 31);
  assert.equal(countLiteral(source, 'filtertube-modern-bottom-sheet-item'), 9);
  assert.equal(countLiteral(source, 'filtertube-filter-all-toggle'), 14);
  assert.equal(countLiteral(source, 'filtertube-collab-selected'), 17);
  assert.equal(countLiteral(source, 'filtertube-pending'), 2);
  assert.equal(countLiteral(source, 'filtertube-multistep-ready'), 4);
  assert.equal(countLiteral(source, 'html[dark="true"]'), 10);
  assert.equal(countLiteral(source, 'html[dark]:not([dark="false"])'), 10);
  assert.equal(countLiteral(source, 'html[data-theme="dark"]'), 10);
  assert.equal(countLiteral(source, 'html[dark="false"]'), 4);
  assert.equal(countLiteral(source, '!important'), 114);

  for (const token of [
    'document literal occurrences: 3',
    'window literal occurrences: 0',
    'location literal occurrences: 0',
    'document.querySelector calls: 0',
    'document.querySelectorAll calls: 0',
    'element querySelector calls: 0',
    'element querySelectorAll calls: 0',
    'closest calls: 0',
    'matches calls: 0',
    'document.createElement calls: 1',
    'document.documentElement references: 1',
    'addEventListener calls: 0',
    'removeEventListener calls: 0',
    'MutationObserver references: 0',
    'observe calls: 0',
    'disconnect calls: 0',
    'setTimeout calls: 0',
    'clearTimeout calls: 0',
    'setInterval calls: 0',
    'clearInterval calls: 0',
    'requestAnimationFrame calls: 0',
    'cancelAnimationFrame calls: 0',
    'innerHTML references: 0',
    'textContent references: 1',
    'setAttribute calls: 0',
    'removeAttribute calls: 0',
    'appendChild calls: 1',
    'remove calls: 0',
    'postMessage calls: 0',
    'chrome.runtime references: 0',
    'fetch calls: 0',
    'JSON.parse calls: 0',
    'JSON.stringify calls: 0',
    '.replace calls: 5',
    'String calls: 1',
    'styleTag.id assignments: 1',
    'filterTubeMenuStylesInjected references: 3',
    'styleContent references: 2',
    'filtertube-menu-item selector token occurrences: 21',
    'filtertube-block-channel-item selector token occurrences: 31',
    'filtertube-modern-bottom-sheet-item selector token occurrences: 9',
    'filtertube-filter-all-toggle selector token occurrences: 14',
    'filtertube-collab-selected selector token occurrences: 17',
    'filtertube-pending selector token occurrences: 2',
    'filtertube-multistep-ready selector token occurrences: 4',
    'html[dark="true"] selector token occurrences: 10',
    'html[dark]:not([dark="false"]) selector token occurrences: 10',
    'html[data-theme="dark"] selector token occurrences: 10',
    'html[dark="false"] selector token occurrences: 4',
    '!important declarations: 114'
  ]) {
    assert.ok(text.includes(token), `missing content menu count token ${token}`);
  }
});

test('content menu source still proves current load-order style and escaping boundaries', () => {
  const text = doc();
  const source = read(sourcePath);
  const manifest = JSON.parse(read(manifestPath));
  const isolatedScripts = manifest.content_scripts.find((entry) => entry.world === 'ISOLATED').js;
  const runtime = loadContentMenuRuntime();

  assert.ok(isolatedScripts.indexOf('js/content/menu.js') > -1);
  assert.ok(isolatedScripts.indexOf('js/content/menu.js') < isolatedScripts.indexOf('js/content_bridge.js'));
  assert.equal(runtime.context.escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  assert.equal(runtime.context.escapeHtml(), '');
  assert.equal(runtime.context.escapeHtml('&lt;script&gt;'), '&amp;lt;script&amp;gt;');
  runtime.context.ensureFilterTubeMenuStyles();
  runtime.context.ensureFilterTubeMenuStyles();
  assert.equal(runtime.appended.length, 1);
  assert.equal(runtime.children.length, 1);
  assert.equal(runtime.appended[0].id, 'filtertube-menu-styles');
  assert.ok(runtime.appended[0].textContent.includes('ytd-menu-popup-renderer'));
  assert.ok(runtime.appended[0].textContent.includes('.filtertube-menu-item'));
  assert.ok(runtime.appended[0].textContent.includes('.filtertube-modern-bottom-sheet-item.filtertube-blocked .menu-item-button'));
  assert.ok(runtime.appended[0].textContent.includes('.filtertube-block-channel-item.filtertube-pending'));
  assert.ok(runtime.appended[0].textContent.includes('.filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked)'));
  assert.ok(runtime.appended[0].textContent.includes('html[data-theme="dark"]'));
  assert.equal(runtime.document.documentElement.children.length, 1);
  runtime.children.splice(0, runtime.children.length);
  runtime.appended.splice(0, runtime.appended.length);
  runtime.context.ensureFilterTubeMenuStyles();
  assert.equal(runtime.appended.length, 0);
  assert.equal(runtime.children.length, 0);

  for (const token of [
    "function escapeHtml(str = '')",
    'return String(str)',
    ".replace(/&/g, '&amp;')",
    ".replace(/</g, '&lt;')",
    ".replace(/>/g, '&gt;')",
    `.replace(/"/g, '&quot;')`,
    ".replace(/'/g, '&#39;')",
    'let filterTubeMenuStylesInjected = false;',
    'if (filterTubeMenuStylesInjected) {',
    'const styleContent = `',
    'ytd-menu-popup-renderer',
    'tp-yt-paper-listbox',
    '.filtertube-block-channel-item.filtertube-blocked',
    '.filtertube-block-channel-item.filtertube-pending',
    '.filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked)',
    '.filtertube-modern-bottom-sheet-item.filtertube-blocked .menu-item-button',
    'html[dark="true"] .filtertube-menu-title',
    'html[data-theme="dark"] .filtertube-filter-all-toggle.exact-toggle',
    'const styleTag = document.createElement',
    "styleTag.id = 'filtertube-menu-styles'",
    'styleTag.textContent = styleContent;',
    'document.documentElement.appendChild(styleTag);',
    'filterTubeMenuStylesInjected = true;'
  ]) {
    assert.ok(source.includes(token), `missing current source token ${token}`);
  }

  for (const token of [
    'module entrypoint: manifest-loaded isolated-world content script before content_bridge.js',
    'explicit export path: none',
    'implicit helper consumers: js/content_bridge.js calls escapeHtml(...) and ensureFilterTubeMenuStyles()',
    'style injection guard: filterTubeMenuStylesInjected boolean only',
    'style tag id: filtertube-menu-styles',
    'style host: document.documentElement',
    'style write path: styleTag.textContent = styleContent',
    'style append path: document.documentElement.appendChild(styleTag)',
    'style teardown path: none',
    'duplicate DOM check: none beyond filterTubeMenuStylesInjected',
    'listener ownership: none',
    'observer ownership: none',
    'timer ownership: none',
    'network ownership: none',
    'runtime message ownership: none',
    'HTML helper behavior: String(str).replace(&).replace(<).replace(>).replace(").replace(\')'
  ]) {
    assert.ok(text.includes(token), `missing current behavior boundary token ${token}`);
  }

  assert.doesNotMatch(source, /module\.exports/);
  assert.doesNotMatch(source, /window\./);
  assert.doesNotMatch(source, /addEventListener/);
  assert.doesNotMatch(source, /MutationObserver/);
  assert.doesNotMatch(source, /setTimeout/);

  assert.match(text, /## File-Local Executable Behavior Rows/);
  assert.match(text, /## File-Local Executable Behavior Proof/);
  assert.match(text, /Runtime fixture evaluates the function and proves `&<>"'` becomes `&amp;&lt;&gt;&quot;&#39;`/);
  assert.match(text, /Runtime fixture calls the function twice with a stub document and proves one append/);
  assert.match(text, /already-escaped value is escaped again as `&amp;lt;`/);
  assert.match(text, /If the appended node is removed outside the helper, a later call still appends no replacement/);
  assert.match(text, /Idempotence is boolean-only and runtime-local/);
  assert.match(text, /Attribute-context escaping, full template insertion inventory, and spoof\/hostile-label fixtures remain missing/);
  assert.match(text, /CSS scope, native menu side effects, dark\/light theme parity, block\/allow vocabulary/);
});

test('content menu register preserves future proof fields', () => {
  const text = doc();

  for (const token of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerSurface',
    'routeSurface',
    'settingsMode',
    'listMode',
    'profileTarget',
    'contentScriptWorld',
    'loadOrderOwner',
    'styleScope',
    'styleSelector',
    'htmlInput',
    'htmlOutput',
    'escapingPolicy',
    'domMutationEffect',
    'styleTagId',
    'styleInjectionState',
    'themeMode',
    'visualVocabulary',
    'menuStructure',
    'nativeMenuScope',
    'lifecyclePrimitive',
    'teardownPolicy',
    'duplicateInjectionPolicy',
    'noRuleBudget',
    'negativeFixture',
    'positiveFixture',
    'sourceFamilyProvenance'
  ]) {
    assert.ok(text.includes(token), `missing future proof field ${token}`);
  }
});

test('runtime source lacks content menu method authority symbols', () => {
  const runtime = productRuntimeSource();

  for (const missingAuthority of [
    'contentMenuMethodAuthority',
    'contentMenuStyleInjectionContract',
    'contentMenuHtmlEscapingContract',
    'contentMenuStyleScopeReport',
    'contentMenuLoadOrderContract',
    'contentMenuThemeParityReport',
    'contentMenuTeardownRegistry',
    'contentMenuFixtureProvenance'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});
