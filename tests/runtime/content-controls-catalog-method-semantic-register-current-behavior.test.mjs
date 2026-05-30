import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_CONTROLS_CATALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content_controls_catalog.js';

const EXPECTED_GROUPS = [
  ['core', ['hideShorts', 'hideHomeFeed', 'hideComments']],
  ['feed', ['hideSponsoredCards', 'hidePlaylistCards', 'hideMembersOnly', 'hideMixPlaylists', 'showQuickBlockButton', 'showBlockMenuItem']],
  ['watch', ['hideVideoSidebar', 'hideRecommended', 'hideLiveChat', 'hideWatchPlaylistPanel']],
  ['video_info', ['hideVideoInfo', 'hideVideoButtonsBar', 'hideAskButton', 'hideVideoChannelRow', 'hideVideoDescription', 'hideMerchTicketsOffers']],
  ['player', ['hideEndscreenVideowall', 'hideEndscreenCards', 'disableAutoplay', 'disableAnnotations']],
  ['navigation', ['hideTopHeader', 'hideNotificationBell', 'hideExploreTrending', 'hideMoreFromYouTube', 'hideSubscriptions']],
  ['search', ['hideSearchShelves']]
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

function doc() {
  return read(docPath);
}

function groupForMethod(name) {
  if (['getCatalog', 'getAllControls'].includes(name)) {
    return 'contentControlsCatalogSnapshotAccessors';
  }
  if (name === 'getControlByKey') {
    return 'contentControlsCatalogLookupAccessor';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^\s*(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (!match) return;

    const name = match[2];
    rows.push({
      line: index + 1,
      kind: match[1] ? 'async function' : 'function',
      name,
      group: groupForMethod(name)
    });
  });
  return rows;
}

function publicApiRows() {
  const source = read(sourcePath).split(/\r?\n/);
  const returnStart = source.findIndex((line) => /^\s{4}global\.FilterTubeContentControlsCatalog\s+=\s+\{/.test(line));
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

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function createCatalogApi() {
  const sandbox = {};
  vm.runInNewContext(read(sourcePath), sandbox, { filename: sourcePath });
  assert.ok(sandbox.FilterTubeContentControlsCatalog, 'catalog export should exist');
  return sandbox.FilterTubeContentControlsCatalog;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('content controls catalog method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content_controls_catalog\.js/);
  assert.match(text, /line count: 222/);
  assert.equal(sourceLineCount(), 222);
  assert.match(text, /named declarations: 3/);
  assert.match(text, /plain function declarations: 3/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /const arrow helper declarations: 0/);
  assert.match(text, /public FilterTubeContentControlsCatalog entries: 3/);
  assert.match(text, /semantic method groups: 2/);
  assert.match(text, /catalog group count: 7/);
  assert.match(text, /catalog control count: 29/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for route scope/);
});

test('content controls catalog register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 3);
  assert.deepEqual(countBy(rows, 'kind'), {
    function: 3
  });
  assert.deepEqual(countBy(rows, 'group'), {
    contentControlsCatalogLookupAccessor: 1,
    contentControlsCatalogSnapshotAccessors: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('content controls catalog register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing content controls catalog method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  assert.deepEqual(publicApiRows().map((row) => row.name), [
    'getCatalog',
    'getAllControls',
    'getControlByKey'
  ]);
  for (const row of publicApiRows()) {
    assert.ok(text.includes(row.name), `missing public API entry ${row.name}`);
  }
});

test('content controls catalog register pins current catalog groups and keys', () => {
  const api = createCatalogApi();
  const catalog = api.getCatalog();
  const text = doc();

  assert.equal(catalog.length, 7);
  assert.equal(api.getAllControls().length, 29);
  assert.deepEqual(
    JSON.parse(JSON.stringify(catalog.map((group) => [group.id, group.controls.map((control) => control.key)]))),
    EXPECTED_GROUPS
  );

  for (const [groupId, keys] of EXPECTED_GROUPS) {
    assert.ok(text.includes(`${groupId}: ${keys.join(', ')}`), `missing catalog group ${groupId}`);
  }

  for (const token of [
    'core: 3',
    'feed: 6',
    'watch: 4',
    'video_info: 6',
    'player: 4',
    'navigation: 5',
    'search: 1'
  ]) {
    assert.ok(text.includes(token), `missing group-count token ${token}`);
  }
});

test('content controls catalog register pins no-DOM accessor and static data counts', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal((source.match(/^\s*id: '/gm) || []).length, 7);
  assert.equal((source.match(/^\s*key: '/gm) || []).length, 29);
  assert.equal((source.match(/^\s*accentColor: '/gm) || []).length, 7);
  assert.equal((source.match(/^\s*description: '/gm) || []).length, 29);
  assert.equal(countLiteral(source, "description: ''"), 1);
  assert.equal(countLiteral(source, "description: 'Hide video info sections \\n(buttons, channel, description)'"), 1);
  assert.equal(countLiteral(source, '.map('), 2);
  assert.equal(countLiteral(source, '.flatMap('), 1);
  assert.equal(countLiteral(source, '.find('), 1);
  assert.equal(countLiteral(source, 'Array.isArray('), 1);
  assert.equal(countLiteral(source, '...group,'), 1);
  assert.equal(countLiteral(source, '...control'), 1);
  assert.equal(countLiteral(source, '[...group.controls]'), 1);
  assert.equal(countLiteral(source, 'document.'), 0);
  assert.equal(countLiteral(source, 'window.'), 0);
  assert.equal(countLiteral(source, 'addEventListener('), 0);
  assert.equal(countLiteral(source, 'setTimeout('), 0);
  assert.equal(countLiteral(source, 'setInterval('), 0);
  assert.equal(countLiteral(source, 'requestAnimationFrame('), 0);
  assert.equal(countLiteral(source, 'MutationObserver'), 0);
  assert.equal(countLiteral(source, 'chrome.storage'), 0);
  assert.equal(countLiteral(source, 'browser.storage'), 0);
  assert.equal(countLiteral(source, 'global.FilterTubeContentControlsCatalog'), 1);
  assert.equal(countLiteral(source, 'module.exports'), 0);

  for (const token of [
    'catalog group ids: core, feed, watch, video_info, player, navigation, search',
    'accentColor entries: 7',
    'empty description entries: 1',
    'escaped-newline description entries: 1',
    'map calls: 2',
    'flatMap calls: 1',
    'find calls: 1',
    'Array.isArray calls: 1',
    'object spread copies: 2',
    'array spread copies: 1',
    'document references: 0',
    'window references: 0',
    'addEventListener calls: 0',
    'setTimeout calls: 0',
    'setInterval calls: 0',
    'requestAnimationFrame calls: 0',
    'MutationObserver references: 0',
    'storage references: 0',
    'global.FilterTubeContentControlsCatalog assignments: 1',
    'module.exports references: 0'
  ]) {
    assert.ok(text.includes(token), `missing content controls surface token ${token}`);
  }
});

test('content controls catalog source still proves current accessor behavior boundaries', () => {
  const source = read(sourcePath);
  const text = doc();
  const api = createCatalogApi();

  const firstCatalog = api.getCatalog();
  const secondCatalog = api.getCatalog();
  assert.notEqual(firstCatalog[0], secondCatalog[0]);
  assert.notEqual(firstCatalog[0].controls, secondCatalog[0].controls);
  assert.equal(firstCatalog[0].controls[0], secondCatalog[0].controls[0]);

  const firstControls = api.getAllControls();
  const secondControls = api.getAllControls();
  assert.notEqual(firstControls[0], secondControls[0]);
  assert.equal(firstControls[0].key, 'hideShorts');
  assert.equal(secondControls[0].key, 'hideShorts');
  firstControls[0].title = 'mutated title should not persist';
  assert.notEqual(api.getAllControls()[0].title, 'mutated title should not persist');

  assert.equal(api.getControlByKey(''), null);
  assert.equal(api.getControlByKey('missingKey'), null);
  assert.equal(api.getControlByKey('hideShorts').title, 'Hide Shorts');

  assert.match(source, /function getCatalog\(\) \{/);
  assert.match(source, /return groups\.map\(group => \(\{/);
  assert.match(source, /controls: Array\.isArray\(group\.controls\) \? \[\.\.\.group\.controls\] : \[\]/);
  assert.match(source, /return groups\.flatMap\(group => group\.controls \|\| \[\]\)\.map\(control => \(\{ \.\.\.control \}\)\)/);
  assert.match(source, /if \(!key\) return null/);
  assert.match(source, /return getAllControls\(\)\.find\(control => control\.key === key\) \|\| null/);
  assert.match(source, /global\.FilterTubeContentControlsCatalog = \{/);

  for (const token of [
    'getCatalog copy depth: group object and controls array copied, nested control objects shared',
    'getAllControls copy depth: individual control objects copied',
    'getControlByKey lookup policy: falsy key returns null, strict key equality otherwise',
    'known UI consumers: popup, tab-view',
    'runtime enforcement owners are outside this file: settings_shared, state_manager, background, seed, filter_logic, content/dom_fallback, content/bridge_settings',
    'no DOM selector ownership: true',
    'no listener ownership: true',
    'no timer ownership: true',
    'no storage mutation ownership inside this file: true'
  ]) {
    assert.ok(text.includes(token), `missing accessor boundary token ${token}`);
  }
});

test('content controls catalog register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'publicApiEntry',
    'catalogGroupId',
    'catalogControlKey',
    'controlTitle',
    'controlDescription',
    'accentColor',
    'callerSurface',
    'settingsKey',
    'compiledSettingsKey',
    'backgroundInvalidationKey',
    'contentBridgeRefreshKey',
    'jsonEndpointOwner',
    'domFallbackSelectorOwner',
    'routeScope',
    'surfaceScope',
    'enforcementEffect',
    'uiOnlyEffect',
    'defaultValuePolicy',
    'copyDepthPolicy',
    'duplicateKeyPolicy',
    'unknownKeyPolicy',
    'positiveUiFixture',
    'negativeUnknownKeyFixture',
    'negativeRouteScopeFixture',
    'settingsCompilerParityFixture',
    'runtimeEnforcementParityFixture',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks content controls catalog method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'contentControlsCatalogMethodAuthority',
    'contentControlsCatalogRuntimeSemanticsManifest',
    'contentControlsCatalogKeyParityReport',
    'contentControlsCatalogRouteScopeReport',
    'contentControlsCatalogControlEffectBudget',
    'contentControlsCatalogAccessorCopyContract',
    'contentControlsCatalogUiRuntimeAlignmentReport',
    'contentControlsCatalogFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
