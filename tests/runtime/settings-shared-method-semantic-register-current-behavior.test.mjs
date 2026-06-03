import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_SHARED_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const remainingRuntimeMethodRegisterDocs = [
  'docs/audit/FILTERTUBE_CONTENT_CONTROLS_CATALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_IO_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_LEGACY_LAYOUT_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_RENDER_ENGINE_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  docPath,
  'docs/audit/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_UI_COMPONENTS_METHOD_SEMANTIC_REGISTER_2026-05-21.md'
];
const sourcePath = 'js/settings_shared.js';

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
  if (['safeObject', 'safeArray'].includes(name)) return 'defensiveObjectHelpers';
  if ([
    'parsePackedChannelKeywordSource',
    'sanitizeKeywordEntry',
    'normalizeKeywords',
    'parseCompiledKeyword',
    'extractUserKeywords',
    'compileKeywords',
    'getChannelDerivedKey',
    'getChannelKeywordWord',
    'syncFilterAllKeywords'
  ].includes(name)) return 'keywordNormalizationAndCompilation';
  if (['sanitizeChannelEntry', 'normalizeChannels', 'sanitizeChannelsList'].includes(name)) return 'channelNormalization';
  if (['isValidProfilesV4', 'buildProfilesV4FromLegacyState'].includes(name)) return 'profileMigrationHelpers';
  if (['buildCompiledSettings'].includes(name)) return 'compiledSettingsBuilder';
  if (['loadSettings', 'readBool'].includes(name)) return 'settingsLoadAndReadPathMigration';
  if (['saveSettings'].includes(name)) return 'settingsSaveAndStoragePersistence';
  if ([
    'getSystemThemePreference',
    'isStoredThemePreference',
    'resolveThemePreference',
    'applyThemePreference',
    'getThemePreference',
    'setThemePreference',
    'isThemeChange',
    'getThemeFromChange'
  ].includes(name)) return 'themePreferenceAndChangeHelpers';
  if (['isSettingsChange'].includes(name)) return 'storageChangeDetection';
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

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function settingsKeys() {
  const match = read(sourcePath).match(/const SETTINGS_KEYS = \[([\s\S]*?)\];/);
  assert.ok(match, 'SETTINGS_KEYS declaration should exist');
  return [...match[1].matchAll(/'([^']+)'/g)].map((row) => row[1]);
}

function publicApiRows() {
  const source = read(sourcePath).split(/\r?\n/);
  const returnStart = source.findIndex((line) => /^\s{4}global\.FilterTubeSettings = \{/.test(line));
  const returnEnd = source.findIndex((line, index) => index > returnStart && /^\s{4}\};/.test(line));
  const rows = [];

  for (let index = returnStart + 1; index < returnEnd; index += 1) {
    const match = source[index].match(/^\s{8}([A-Za-z_$][\w$]*)(?::\s*[A-Za-z_$][\w$]*)?,?\s*$/);
    if (match) rows.push({ line: index + 1, name: match[1] });
  }

  return rows;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('settings shared method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/settings_shared\.js/);
  assert.match(text, /named declarations: 29/);
  assert.match(text, /IIFE-scoped function declarations: 27/);
  assert.match(text, /local const arrow helper declarations: 2/);
  assert.match(text, /async function declarations: 0/);
  assert.match(text, /public FilterTubeSettings entries: 21/);
  assert.match(text, /semantic method groups: 9/);
  assert.match(text, /SETTINGS_KEYS entries: 36/);
  assert.match(text, /SETTINGS_CHANGE_KEYS effective entries: 38/);
  assert.match(text, /STORAGE_NAMESPACE\.get calls: 3/);
  assert.match(text, /STORAGE_NAMESPACE\.set calls: 5/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for every settings key/);
});

test('remaining runtime method semantic registers carry the method proof gap blocker', () => {
  const gapText = read(methodGapPath);
  const indexTokens = [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5736',
    'files with lexical accounting: 69',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5736',
    'runtime behavior changed: no'
  ];
  const registerTokens = [
    'method semantic proof gap files covered: 69',
    'method semantic proof gap lexical callables covered: 5736',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5736',
    'affected callable semantic proof: NO-GO',
    'runtime behavior changed: no'
  ];

  for (const token of indexTokens) {
    assert.ok(gapText.includes(token), `method proof gap index missing ${token}`);
  }

  for (const file of remainingRuntimeMethodRegisterDocs) {
    const text = read(file);
    assert.ok(text.includes('## Method Semantic Proof Gap Boundary'), `${file} should name the method proof gap boundary`);
    assert.ok(text.includes(methodGapPath), `${file} should cite the method proof gap index`);
    for (const token of registerTokens) {
      assert.ok(text.includes(token), `${file} missing method proof gap token ${token}`);
    }
    assert.match(text, /They do not approve runtime\s+optimization, JSON-first behavior, method deletion, method merging, lifecycle\s+cleanup, no-work changes, or whitelist behavior changes\./);
  }
});

test('settings shared register accounts for every current named declaration', () => {
  const rows = methodRows();

  assert.equal(rows.length, 29);
  assert.deepEqual(countBy(rows, 'kind'), {
    'const arrow': 2,
    function: 27
  });
  assert.deepEqual(countBy(rows, 'group'), {
    channelNormalization: 3,
    compiledSettingsBuilder: 1,
    defensiveObjectHelpers: 2,
    keywordNormalizationAndCompilation: 9,
    profileMigrationHelpers: 2,
    settingsLoadAndReadPathMigration: 2,
    settingsSaveAndStoragePersistence: 1,
    storageChangeDetection: 1,
    themePreferenceAndChangeHelpers: 8
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }
});

test('settings shared register preserves every source row and public API entry', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing settings_shared method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  assert.deepEqual(publicApiRows().map((row) => row.name), [
    'STORAGE_KEYS',
    'THEME_KEY',
    'AUTO_BACKUP_KEY',
    'normalizeKeywords',
    'normalizeChannels',
    'compileKeywords',
    'extractUserKeywords',
    'syncFilterAllKeywords',
    'getChannelDerivedKey',
    'getChannelKeywordWord',
    'buildCompiledSettings',
    'loadSettings',
    'saveSettings',
    'applyThemePreference',
    'getSystemThemePreference',
    'resolveThemePreference',
    'getThemePreference',
    'setThemePreference',
    'isSettingsChange',
    'isThemeChange',
    'getThemeFromChange'
  ]);

  for (const row of publicApiRows()) {
    assert.ok(text.includes(row.name), `missing public API entry ${row.name}`);
  }
});

test('settings shared register pins storage key and side-effect surface counts', () => {
  const source = read(sourcePath);
  const text = doc();

  assert.equal(settingsKeys().length, 36);
  assert.equal((source.match(/STORAGE_NAMESPACE\?\.get\(/g) || []).length, 3);
  assert.equal((source.match(/STORAGE_NAMESPACE\?\.set\(/g) || []).length, 5);
  assert.equal((source.match(/chrome\.runtime\?\.lastError/g) || []).length, 2);
  assert.equal((source.match(/buildCompiledSettings\(/g) || []).length, 4);
  assert.equal((source.match(/buildProfilesV4FromLegacyState\(/g) || []).length, 3);
  assert.equal((source.match(/compileKeywords\(/g) || []).length, 3);
  assert.equal((source.match(/syncFilterAllKeywords\(/g) || []).length, 4);
  assert.equal((source.match(/Date\.now\(/g) || []).length, 7);
  assert.equal((source.match(/document\.documentElement\.setAttribute\(/g) || []).length, 1);
  assert.equal((source.match(/\.addEventListener\(/g) || []).length, 0);
  assert.equal((source.match(/\bsetTimeout\(/g) || []).length, 0);
  assert.equal((source.match(/\bsetInterval\(/g) || []).length, 0);
  assert.equal((source.match(/querySelector/g) || []).length, 0);
  assert.equal((source.match(/document\.createElement\(/g) || []).length, 0);

  for (const token of [
    'SETTINGS_KEYS entries: 36',
    'SETTINGS_CHANGE_KEYS effective entries: 38',
    'STORAGE_NAMESPACE.get calls: 3',
    'STORAGE_NAMESPACE.set calls: 5',
    'chrome.runtime.lastError reads: 2',
    'buildCompiledSettings calls: 4',
    'document.documentElement.setAttribute calls: 1',
    'addEventListener calls: 0',
    'setTimeout calls: 0',
    'querySelector calls: 0'
  ]) {
    assert.ok(text.includes(token), `missing settings shared surface token ${token}`);
  }
});

test('settings shared source still proves current behavior boundaries', () => {
  const source = read(sourcePath);

  assert.match(source, /const SETTINGS_KEYS = \[/);
  assert.match(source, /const SETTINGS_CHANGE_KEYS = new Set\(\[\.\.\.SETTINGS_KEYS, THEME_KEY, AUTO_BACKUP_KEY\]\)/);
  assert.match(source, /mode: 'blocklist'[\s\S]*whitelistChannels: \[\],[\s\S]*whitelistKeywords: \[\]/);
  assert.match(source, /kids: \{[\s\S]*mode: 'blocklist'[\s\S]*whitelistChannels: \[\],[\s\S]*whitelistKeywords: \[\]/);
  assert.match(source, /const unicodeExactPrefix = '\(\^\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)'/);
  assert.match(source, /const exactPattern = `\(\^\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)\$\{escaped\}\(\?=\$\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)`/);
  assert.match(source, /filterKeywordsComments: compileKeywords\(sanitizedKeywords, entry => entry\.comments === true\)/);
  assert.match(source, /const sanitizedContentFilters = safeObject\(contentFilters\)/);
  assert.match(source, /const sanitizedCategoryFilters = safeObject\(categoryFilters\)/);
  assert.match(source, /STORAGE_NAMESPACE\?\.get\(\[\.\.\.SETTINGS_KEYS, THEME_KEY, AUTO_BACKUP_KEY, FT_PROFILES_V3_KEY, FT_PROFILES_V4_KEY\]/);
  assert.match(source, /STORAGE_NAMESPACE\?\.set\(\{ \[FT_PROFILES_V4_KEY\]: nextProfilesV4 \}/);
  assert.match(source, /STORAGE_NAMESPACE\?\.get\(\[FT_PROFILES_V4_KEY, FT_PROFILES_V3_KEY\]/);
  assert.match(source, /payload\[FT_PROFILES_V4_KEY\] = nextProfilesV4/);
  assert.match(source, /payload\[FT_PROFILES_V4_KEY\] = buildProfilesV4FromLegacyState\(legacyStorage, sanitizedChannels, sanitizedKeywords\)/);
  assert.match(source, /resolve\(\{ compiledSettings, error \}\)/);
  assert.match(source, /document\.documentElement\.setAttribute\('data-theme', normalized\)/);
  assert.match(source, /return Object\.keys\(changes\)\.some\(key => SETTINGS_CHANGE_KEYS\.has\(key\)\)/);
});

test('settings shared register preserves future proof fields', () => {
  const text = doc();

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerUi',
    'profileType',
    'profileId',
    'listModeInput',
    'storageKeysRead',
    'storageKeysWritten',
    'settingsChangeKeys',
    'legacyInputShape',
    'v4InputShape',
    'readPathWriteEffect',
    'savePathWriteEffect',
    'compiledSettingsEffect',
    'keywordRegexEffect',
    'channelDerivedKeywordEffect',
    'contentFilterEffect',
    'categoryFilterEffect',
    'themeDomEffect',
    'storageErrorPolicy',
    'revisionPolicy',
    'backgroundCacheEffect',
    'bridgeRefreshEffect',
    'stateManagerReloadEffect',
    'migrationModePolicy',
    'whitelistPreservationPolicy',
    'positiveFixture',
    'negativeModeFixture',
    'negativeStorageFixture',
    'negativeProfileFixture',
    'negativeAliasFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('runtime source lacks settings shared method authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'settingsSharedMethodAuthority',
    'settingsSharedStorageDependencyManifest',
    'settingsSharedProfileMigrationReport',
    'settingsSharedReadPathWriteBudget',
    'settingsSharedSaveResultContract',
    'settingsSharedCompiledSettingsReport',
    'settingsSharedThemePreferenceContract',
    'settingsSharedChangeDetectionContract'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
