import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/shared/identity.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function source() {
  return read(sourcePath);
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function sourceLineCount(text = source()) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function methodGroup(name) {
  if ([
    'normalizeHandleGlyphs',
    'extractRawHandle',
    'normalizeHandleValue',
    'normalizeHandleForComparison'
  ].includes(name)) return 'sharedIdentityHandleNormalization';
  if ([
    'normalizeUcIdForComparison',
    'isUcId',
    'canonicalizeChannelInput',
    'normalizeCustomUrlForComparison',
    'extractCustomUrlFromPath',
    'extractChannelIdFromPath'
  ].includes(name)) return 'sharedIdentityCanonicalInput';
  if ([
    'collectHandleVariants',
    'normalizeChannelNameForComparison',
    'getChannelMapLookup',
    'buildChannelFilterIndex'
  ].includes(name)) return 'sharedIdentityIndexConstruction';
  if ([
    'channelMetaMatchesIndex',
    'isChannelBlocked'
  ].includes(name)) return 'sharedIdentityIndexMatching';
  if (name === 'channelMatchesFilter') return 'sharedIdentityDirectFilterMatching';
  if ([
    'decodeJsonStringFragment',
    'readJsonStringField',
    'assignOwnerBlockIdentity',
    'fastExtractIdentityFromHtmlChunk',
    'assignCanonicalPathIdentity'
  ].includes(name)) return 'sharedIdentityHtmlFragmentExtraction';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  source().split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({
        line: index + 1,
        kind: 'function',
        name: match[1],
        group: methodGroup(match[1])
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

function loadIdentity(existing = {}) {
  const context = {
    window: { FilterTubeIdentity: existing },
    URL,
    JSON,
    decodeURIComponent,
    console
  };
  context.self = context.window;
  context.globalThis = context.window;
  vm.runInNewContext(source(), context, { filename: sourcePath });
  return context.window.FilterTubeIdentity;
}

function sameRealm(value) {
  return JSON.parse(JSON.stringify(value));
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8'
  })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('shared identity method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/shared\/identity\.js/);
  assert.match(text, /line count: 808/);
  assert.equal(sourceLineCount(), 808);
  assert.match(text, /IIFE-scoped named function declarations: 22/);
  assert.match(text, /plain function declarations: 22/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /const arrow helper declarations: 5/);
  assert.match(text, /returned arrow helper declarations: 1/);
  assert.match(text, /arrow token sites: 8/);
  assert.match(text, /public FilterTubeIdentity API entries: 14/);
  assert.match(text, /semantic method groups: 6/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for shared identity authority/);
});

test('shared identity register accounts for every current function declaration row', () => {
  const text = doc();
  const rows = methodRows();

  assert.equal(rows.length, 22);
  assert.deepEqual(countBy(rows, 'kind'), { function: 22 });
  assert.deepEqual(countBy(rows, 'group'), {
    sharedIdentityCanonicalInput: 6,
    sharedIdentityDirectFilterMatching: 1,
    sharedIdentityHandleNormalization: 4,
    sharedIdentityHtmlFragmentExtraction: 5,
    sharedIdentityIndexConstruction: 4,
    sharedIdentityIndexMatching: 2
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.name}:${row.line} should be classified`);
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing shared identity method row ${row.name}:${row.line}`
    );
  }
});

test('shared identity register pins local helper callback and primitive counts', () => {
  const text = doc();
  const src = source();
  const expectedLocalRows = [
    [194, 'addHandle', 'local const arrow helper', 'collectHandleVariants'],
    [242, '(key) =>', 'returned arrow helper', 'getChannelMapLookup'],
    [267, 'addId', 'local const arrow helper', 'buildChannelFilterIndex'],
    [275, 'addHandle', 'local const arrow helper', 'buildChannelFilterIndex'],
    [296, 'addCustomUrl', 'local const arrow helper', 'buildChannelFilterIndex'],
    [304, 'addName', 'local const arrow helper', 'buildChannelFilterIndex'],
    [657, 'path =>', 'inline `forEach` callback', 'assignOwnerBlockIdentity'],
    [779, 'filterChannel =>', 'inline `some` callback', 'isChannelBlocked']
  ];

  for (const [line, name, kind, owner] of expectedLocalRows) {
    assert.ok(text.includes(`| ${line} | \`${name}\` | ${kind} | \`${owner}\` |`));
  }

  assert.equal(count(src, /=>/g), 8);
  assert.equal(count(src, /^\s*const\s+[A-Za-z_$][\w$]*\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/gm), 5);
  assert.equal(count(src, /return \(key\) =>/g), 1);

  const countPairs = [
    ['document literal occurrences', count(src, /\bdocument\b/g)],
    ['window literal occurrences', count(src, /\bwindow\b/g)],
    ['self literal occurrences', count(src, /\bself\b/g)],
    ['globalThis literal occurrences', count(src, /\bglobalThis\b/g)],
    ['new URL calls', count(src, /new URL\s*\(/g)],
    ['JSON.parse calls', count(src, /JSON\.parse\s*\(/g)],
    ['JSON.stringify calls', count(src, /JSON\.stringify\s*\(/g)],
    ['decodeURIComponent calls', count(src, /decodeURIComponent\s*\(/g)],
    ['new RegExp calls', count(src, /new RegExp\s*\(/g)],
    ['new Set calls', count(src, /new Set\s*\(/g)],
    ['new Map calls', count(src, /new Map\s*\(/g)],
    ['Array.isArray calls', count(src, /Array\.isArray\s*\(/g)],
    ['try blocks', count(src, /\btry\s*\{/g)],
    ['catch blocks', count(src, /\bcatch\s*\(/g)],
    ['addEventListener calls', count(src, /addEventListener\s*\(/g)],
    ['removeEventListener calls', count(src, /removeEventListener\s*\(/g)],
    ['MutationObserver references', count(src, /MutationObserver/g)],
    ['setTimeout calls', count(src, /setTimeout\s*\(/g)],
    ['setInterval calls', count(src, /setInterval\s*\(/g)],
    ['fetch calls', count(src, /\bfetch\s*\(/g)],
    ['runtime sendMessage calls', count(src, /sendMessage\s*\(/g)],
    ['postMessage calls', count(src, /postMessage\s*\(/g)],
    ['Object.assign calls', count(src, /Object\.assign\s*\(/g)],
    ['match calls', count(src, /\.match\s*\(/g)],
    ['replace calls', count(src, /\.replace\s*\(/g)],
    ['split calls', count(src, /\.split\s*\(/g)],
    ['trim calls', count(src, /\.trim\s*\(/g)],
    ['toLowerCase calls', count(src, /\.toLowerCase\s*\(/g)],
    ['startsWith calls', count(src, /\.startsWith\s*\(/g)],
    ['includes calls', count(src, /\.includes\s*\(/g)],
    ['forEach calls', count(src, /\.forEach\s*\(/g)],
    ['some calls', count(src, /\.some\s*\(/g)],
    ['test calls', count(src, /\.test\s*\(/g)],
    ['FilterTubeIdentity token occurrences', count(src, /FilterTubeIdentity/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: ${value}`));
  }
});

test('shared identity register preserves public API export shape and load order facts', () => {
  const text = doc();
  const identity = loadIdentity({ preservedCustomKey: 'kept', extractRawHandle: 'old' });
  const apiKeys = Object.keys(identity).filter((key) => key !== 'preservedCustomKey').sort();
  const expectedApiKeys = [
    'buildChannelFilterIndex',
    'canonicalizeChannelInput',
    'channelMatchesFilter',
    'channelMetaMatchesIndex',
    'extractChannelIdFromPath',
    'extractCustomUrlFromPath',
    'extractRawHandle',
    'fastExtractIdentityFromHtmlChunk',
    'isChannelBlocked',
    'isUcId',
    'normalizeChannelNameForComparison',
    'normalizeCustomUrlForComparison',
    'normalizeHandleForComparison',
    'normalizeHandleValue'
  ].sort();

  assert.deepEqual(apiKeys, expectedApiKeys);
  assert.equal(identity.preservedCustomKey, 'kept');
  assert.equal(typeof identity.extractRawHandle, 'function');
  assert.equal(identity.normalizeUcIdForComparison, undefined);

  const manifest = read('manifest.json');
  const firefoxManifest = read('manifest.firefox.json');
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');
  assert.ok(manifest.indexOf('js/shared/identity.js') < manifest.indexOf('js/content/menu.js'));
  assert.ok(manifest.indexOf('js/shared/identity.js') < manifest.indexOf('js/content_bridge.js'));
  assert.ok(firefoxManifest.indexOf('"scripts": ["js/shared/identity.js", "js/background.js"]') !== -1);
  assert.ok(firefoxManifest.indexOf('js/shared/identity.js') < firefoxManifest.indexOf('js/content/menu.js'));
  assert.match(background, /importScripts\('shared\/identity\.js'\)/);
  assert.match(stateManager, /window\.FilterTubeIdentity\?\.normalizeUcIdForComparison/);
  assert.match(stateManager, /window\.FilterTubeIdentity\?\.isUcId/);

  for (const token of [
    'internal normalizeUcIdForComparison export: absent',
    'Object.assign(existing, api) preserves extra existing keys and overwrites API keys',
    'Chrome MV3 background path',
    'Firefox background path',
    'isolated content path',
    'main-world availability path',
    'js/state_manager.js: optional normalizeUcIdForComparison probe plus isUcId'
  ]) {
    assert.ok(text.includes(token), `missing public/load token ${token}`);
  }
});

test('shared identity current behavior preserves normalization and canonicalization boundaries', () => {
  const text = doc();
  const identity = loadIdentity();

  assert.equal(
    identity.extractRawHandle(' https://youtube.com/@Some%E2%80%8BHandle/videos '),
    '@SomeHandle'
  );
  assert.equal(identity.extractRawHandle('not a handle'), '');
  assert.equal(identity.extractRawHandle('/@Foo-Bar?x=1'), '@Foo-Bar');
  assert.equal(identity.normalizeHandleValue('@Some Handle'), '@some');
  assert.equal(identity.normalizeHandleValue('UC1234567890123456789012'), '');
  assert.equal(identity.normalizeHandleValue('plain'), '');
  assert.deepEqual(
    sameRealm(identity.canonicalizeChannelInput('https://www.youtube.com/channel/UC1234567890123456789012')),
    { type: 'ucid', value: 'UC1234567890123456789012' }
  );
  assert.deepEqual(
    sameRealm(identity.canonicalizeChannelInput('youtube.com/@SomeHandle/videos')),
    { type: 'handle', value: '@somehandle' }
  );
  assert.deepEqual(
    sameRealm(identity.canonicalizeChannelInput('custom text')),
    { type: 'unknown', value: 'custom text' }
  );
  assert.equal(identity.normalizeCustomUrlForComparison('https://www.youtube.com/c/SomeName?x=1'), 'c/somename');
  assert.equal(identity.extractCustomUrlFromPath('/user/Foo/'), 'user/Foo');
  assert.equal(identity.extractChannelIdFromPath('/channel/UC1234567890123456789012'), 'UC1234567890123456789012');

  for (const token of [
    "encoded zero-width handles: extractRawHandle('https://youtube.com/@Some%E2%80%8BHandle/videos') returns @SomeHandle",
    "whitespace handles: normalizeHandleValue('@Some Handle') returns @some",
    "canonical UC URL: canonicalizeChannelInput('https://www.youtube.com/channel/UC1234567890123456789012') returns",
    "custom URL normalization: normalizeCustomUrlForComparison('https://www.youtube.com/c/SomeName?x=1') returns c/somename",
    "path extraction case: extractCustomUrlFromPath('/user/Foo/') returns user/Foo"
  ]) {
    assert.ok(text.includes(token), `missing normalization token ${token}`);
  }
});

test('shared identity current behavior preserves direct versus indexed match divergence', () => {
  const text = doc();
  const identity = loadIdentity();
  const filterId = 'UCAAAAAAAAAAAAAAAAAAAAAA';
  const metaId = 'UCBBBBBBBBBBBBBBBBBBBBBB';
  const objectFilter = { id: filterId, name: 'Same Channel' };
  const metaWithDifferentId = { id: metaId, name: 'Same Channel' };

  assert.equal(identity.isUcId(filterId), true);
  assert.equal(identity.isUcId(metaId), true);
  assert.equal(identity.channelMatchesFilter(metaWithDifferentId, objectFilter, {}), true);
  const objectIndex = identity.buildChannelFilterIndex([objectFilter], {});
  assert.equal(identity.channelMetaMatchesIndex(metaWithDifferentId, objectIndex, {}), false);

  const nameOnlyIndex = identity.buildChannelFilterIndex(['Display'], {});
  assert.equal(identity.channelMetaMatchesIndex({ id: metaId, name: 'Display' }, nameOnlyIndex, {}), true);
  assert.equal(identity.channelMatchesFilter({ id: metaId, name: 'Display' }, 'Display', {}), false);

  const mappedIndex = identity.buildChannelFilterIndex([
    'UC1234567890123456789012',
    '@SomeHandle',
    { id: 'UCABCDEFGHIJKLMN12345678', handle: '@OtherHandle', customUrl: 'c/OtherName', name: 'Other Name' },
    'Display Only'
  ], {
    uc1234567890123456789012: '@SomeHandle',
    '@otherhandle': 'UCABCDEFGHIJKLMN12345678',
    'c/othername': 'UCABCDEFGHIJKLMN12345678'
  });
  assert.deepEqual([...mappedIndex.ids], ['uc1234567890123456789012', 'ucabcdefghijklmn12345678']);
  assert.deepEqual([...mappedIndex.handles], ['@somehandle', '@otherhandle']);
  assert.deepEqual([...mappedIndex.customUrls], ['c/othername']);
  assert.deepEqual(sameRealm(mappedIndex.unresolvedHandleKeys), ['somehandle']);

  for (const token of [
    'indexed stable-name guard: channelMetaMatchesIndex does not match a stable filter name when metadata already has a different UC id',
    'direct object-name behavior: channelMatchesFilter can match an object filter by equal name even when filter id and metadata id differ',
    'name-only index behavior: buildChannelFilterIndex plus channelMetaMatchesIndex can match a string name-only entry by metadata name',
    'direct string-name behavior: channelMatchesFilter does not match a plain string name-only entry by metadata name'
  ]) {
    assert.ok(text.includes(token), `missing match divergence token ${token}`);
  }
});

test('shared identity current behavior preserves fast HTML extraction and missing authority boundary', () => {
  const text = doc();
  const identity = loadIdentity();
  const html = '"ownerText":{"runs":[{"text":"Owner Name","navigationEndpoint":{"browseEndpoint":{"browseId":"UC1234567890123456789012","canonicalBaseUrl":"/@OwnerHandle"}}}]} <link rel="canonical" href="https://www.youtube.com/@OwnerHandle">';

  assert.deepEqual(sameRealm(identity.fastExtractIdentityFromHtmlChunk(html)), {
    id: 'UC1234567890123456789012',
    handle: '@OwnerHandle',
    name: 'Owner Name'
  });
  assert.equal(identity.fastExtractIdentityFromHtmlChunk('"ownerChannelName":"Name Only"'), null);
  assert.match(text, /HTML extraction: fastExtractIdentityFromHtmlChunk returns null unless it finds id, handle, or customUrl/);

  const runtime = productRuntimeSource();
  for (const missingAuthority of [
    'sharedIdentityMethodAuthority',
    'sharedIdentityApiManifest',
    'sharedIdentityNormalizationContract',
    'sharedIdentityMatchDecisionReport',
    'sharedIdentityIndexParityReport',
    'sharedIdentityCallerParityReport',
    'sharedIdentityHtmlExtractionProvenance',
    'sharedIdentityNameFallbackPolicy',
    'sharedIdentityUnicodeFixtureProvenance',
    'sharedIdentityLoadOrderContract'
  ]) {
    assert.match(text, new RegExp(missingAuthority));
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});
