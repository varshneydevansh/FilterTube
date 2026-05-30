import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const listModeFamilyDocs = [
  docPath,
  'docs/audit/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_UI_ROW_LIST_MODE_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_COMPILED_SETTINGS_PROFILE_LIST_MODE_ASSEMBLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md',
  'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md'
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

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    videoChannelMap: {},
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function videoRenderer(overrides = {}) {
  return {
    videoId: 'lmvideo0001',
    title: { runs: [{ text: 'List Mode Matrix Video' }] },
    shortBylineText: {
      runs: [{
        text: 'Matrix Creator',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UCmatrixcreator000000000',
            canonicalBaseUrl: '/@matrixcreator'
          }
        }
      }]
    },
    ...overrides
  };
}

function commentRenderer(overrides = {}) {
  return {
    authorText: { simpleText: 'Matrix Commenter' },
    authorEndpoint: {
      browseEndpoint: {
        browseId: 'UCmatrixcommenter0000000',
        canonicalBaseUrl: '/@matrixcommenter'
      }
    },
    contentText: { simpleText: 'ordinary comment text' },
    ...overrides
  };
}

function payload(rendererType, renderer) {
  return { contents: [{ [rendererType]: renderer }] };
}

function run(data, overrides = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const result = harness.engine.processData(data, settings(overrides), options.dataName || 'list-mode-matrix-fixture');
  return { ...harness, result };
}

function assertListModeRuntimeInvariantSnapshot(doc) {
  assert.match(doc, /List-Mode Runtime Invariant Snapshot - 2026-05-27/);
  assert.match(doc, /blocklist hides\s+matching content, whitelist allows only matching content, and empty\/no-useful\s+blocklist installs must remain low-work/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /list-mode runtime invariant authority: NO-GO/);
  assert.match(doc, /blocklist\/whitelist parity authority: NO-GO/);
  assert.match(doc, /empty-list no-work\/fail-close authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /one\s+shared decision report that carries profile, mode, source row family, active\s+rule status, route, renderer, JSON\/DOM consumer, and negative no-op proof/);

  for (const row of [
    /\| Shared save and blocklist alias mirror \| `js\/settings_shared\.js:742-954` \|/,
    /\| Background profile list-mode compiler \| `js\/background\.js:1984-2022`, `js\/background\.js:2056-2076`, `js\/background\.js:2212-2224` \|/,
    /\| Seed JSON no-work predicate \| `js\/seed\.js:220-260` \|/,
    /\| Injector JSON no-work predicate \| `js\/injector\.js:171-188` \|/,
    /\| JSON decision engine \| `js\/filter_logic\.js:1846-2036`, `js\/filter_logic\.js:2038-2108` \|/,
    /\| DOM fallback list-mode gate \| `js\/content\/dom_fallback\.js:1933-2088`, `js\/content\/dom_fallback\.js:4547-4746` \|/,
    /\| Bridge refresh and delivery \| `js\/content\/bridge_settings\.js:353-517`, `js\/content\/bridge_settings\.js:557-646` \|/,
    /\| Whitelist pending and quick-block gates \| `js\/content_bridge\.js:6014-6037`, `js\/content\/block_channel\.js:1205-1222` \|/
  ]) {
    assert.match(doc, row);
  }

  const settingsShared = read('js/settings_shared.js');
  assert.match(settingsShared, /const mainMode = existingMain\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(settingsShared, /const nextMainProfile = \{\s*\.\.\.existingMain,\s*channels: sanitizedChannels,\s*keywords: sanitizedKeywords\s*\}/);
  assert.match(settingsShared, /if \(mainMode === 'blocklist'\) \{\s*nextMainProfile\.blockedChannels = sanitizedChannels;\s*nextMainProfile\.blockedKeywords = sanitizedKeywords;/);

  const background = read('js/background.js');
  assert.match(background, /compiledSettings\.listMode = shouldUseKidsProfile \? kidsModeFromV4 : mainModeFromV4/);
  assert.match(background, /compiledSettings\.whitelistKeywords = compileKeywordEntries\(rawWhitelistKeywords\)/);
  assert.match(background, /compiledSettings\.whitelistChannels = compileWhitelistChannels\(rawWhitelistChannels\)/);
  assert.match(background, /const mainKeywords = Array\.isArray\(activeMain\.keywords\)\s*\?\s*activeMain\.keywords\s*:\s*\(Array\.isArray\(activeMain\.blockedKeywords\) \? activeMain\.blockedKeywords : null\)/);
  assert.match(background, /const mainChannels = Array\.isArray\(activeMain\.channels\)\s*\?\s*activeMain\.channels\s*:\s*\(Array\.isArray\(activeMain\.blockedChannels\) \? activeMain\.blockedChannels : items\.filterChannels\)/);

  const seed = read('js/seed.js');
  assert.match(seed, /function hasNetworkJsonWork\(settings\) \{\s*if \(!settings \|\| settings\.enabled === false\) return false;\s*if \(settings\.listMode === 'whitelist'\) return true;\s*return hasEnabledContentFilters\(settings\) \|\| hasActiveJsonFilterRules\(settings\);/);
  assert.match(seed, /if \(hasNetworkJsonWork\(cachedSettings\)\) return false;\s*seedDebugLog\(`.*before JSON parse \(no active JSON work\)`\);\s*return true;/);

  const injector = read('js/injector.js');
  assert.match(injector, /function hasNetworkJsonWork\(settings\) \{\s*if \(!settings \|\| settings\.enabled === false\) return false;\s*if \(settings\.listMode === 'whitelist'\) return true;\s*return hasEnabledContentFilters\(settings\) \|\| hasActiveJsonFilterRules\(settings\);/);

  const filterLogic = read('js/filter_logic.js');
  assert.match(filterLogic, /const listMode = \(this\.settings\.listMode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.match(filterLogic, /if \(listMode === 'whitelist' && !isCommentRenderer\) \{/);
  assert.match(filterLogic, /this\._logWhitelistDecision\('block:no_whitelist_rules'/);
  assert.match(filterLogic, /this\._logWhitelistDecision\('block:no_whitelist_match'/);
  assert.match(filterLogic, /if \(this\.settings\.filterChannels\.length > 0\) \{/);
  assert.match(filterLogic, /if \(!skipKeywordFiltering && this\.settings\.filterKeywords\.length > 0\) \{/);

  const domFallback = read('js/content/dom_fallback.js');
  assert.match(domFallback, /if \(listMode === 'whitelist'\) return true;/);
  assert.match(domFallback, /if \(!hasActiveFallbackWork && !onlyWhitelistPending\) \{/);
  assert.match(domFallback, /if \(listMode === 'whitelist' && !isCommentContext\) \{/);
  assert.match(domFallback, /if \(!hasChannelRules && !hasKeywordRules\) return true;/);
  assert.match(domFallback, /if \(!skipKeywords && settings\.filterKeywords && settings\.filterKeywords\.length > 0\) \{/);

  const bridgeSettings = read('js/content/bridge_settings.js');
  assert.match(bridgeSettings, /sendRuntimeMessage\(\{ action: "getCompiledSettings", profileType, forceRefresh \}/);
  assert.match(bridgeSettings, /sendSettingsToMainWorld\(normalized\)/);
  assert.match(bridgeSettings, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess/);
  assert.match(bridgeSettings, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\)/);

  const contentBridge = read('js/content_bridge.js');
  assert.match(contentBridge, /if \(currentSettings\?\.listMode !== 'whitelist'\) return;/);
  assert.match(contentBridge, /node\.matches\?\.\(VIDEO_CARD_SELECTORS\)/);

  const blockChannel = read('js/content/block_channel.js');
  assert.match(blockChannel, /currentSettings\.listMode === 'whitelist'/);
  assert.match(blockChannel, /return true;\s*\} catch \(e\) \{\s*return false;/);
}

test('JSON-first list-mode matrix audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for JSON-first list-mode matrix authority/);
  assertListModeRuntimeInvariantSnapshot(doc);

  const source = read('js/filter_logic.js');
  assert.equal(lineCount(source), 3498);
  assert.equal(Buffer.byteLength(source), 165151);
  assert.equal(sha256('js/filter_logic.js'), '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641');
  assert.ok(doc.includes('`js/filter_logic.js`'));

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_HIDE_DECISION_PIPELINE_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }

  assert.match(methodGap, /files with lexical accounting: 63/);
  assert.match(methodGap, /repo-wide lexical callables: 5473/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5473/);

  for (const listModeDocPath of listModeFamilyDocs) {
    const listModeDoc = read(listModeDocPath);
    assert.ok(listModeDoc.includes(methodGapPath), `${listModeDocPath} missing method gap source path`);
    assert.match(listModeDoc, /## Method Semantic Proof Gap Boundary/, `${listModeDocPath} missing method gap section`);
    assert.match(listModeDoc, /method semantic proof gap files covered: 63/, `${listModeDocPath} missing file count`);
    assert.match(listModeDoc, /method semantic proof gap lexical callables covered: 5473/, `${listModeDocPath} missing callable count`);
    assert.match(listModeDoc, /files with complete per-callable semantic proof: 0/, `${listModeDocPath} missing complete proof count`);
    assert.match(listModeDoc, /lexical callables requiring semantic proof before behavior changes: 5473/, `${listModeDocPath} missing required proof count`);
    assert.match(listModeDoc, /affected callable semantic proof: NO-GO/, `${listModeDocPath} missing affected callable NO-GO`);
    assert.match(listModeDoc, /runtime behavior changed: no/, `${listModeDocPath} missing runtime unchanged boundary`);
    assert.match(listModeDoc, /do not\s+approve runtime\s+optimization/, `${listModeDocPath} missing approval warning`);
  }
});

test('list-mode matrix source counts remain pinned', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');

  const shouldBlockBlock = sliceBetween(filterLogic, '_shouldBlock(item, rendererType) {', '        _checkCategoryFilters(item, rules, rendererType) {');
  const listModeSetup = sliceBetween(
    filterLogic,
    "            const listMode = (this.settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';",
    '            const title = candidate.title;'
  );
  const whitelistBlock = sliceBetween(filterLogic, "            if (listMode === 'whitelist' && !isCommentRenderer) {", '            // Channel filtering with comprehensive matching');
  const blocklistTail = sliceBetween(filterLogic, '            // Channel filtering with comprehensive matching', '            return false;\n        }\n\n        _checkCategoryFilters');
  const processDataBlock = sliceBetween(
    filterLogic,
    "        processData(data, dataName = 'unknown') {",
    '    }\n\n    // ============================================================================\n    // GLOBAL INTERFACE'
  );
  const enabledSkipBlock = sliceBetween(
    filterLogic,
    '            // Global kill-switch: allow the extension to stay installed but stop mutating YouTube data.',
    '            // 2. THEN FILTER'
  );

  assert.equal(lineCount(shouldBlockBlock), 301);
  assert.equal(Buffer.byteLength(shouldBlockBlock), 15380);
  assert.equal(lineCount(listModeSetup), 5);
  assert.equal(Buffer.byteLength(listModeSetup), 368);
  assert.equal(lineCount(whitelistBlock), 105);
  assert.equal(Buffer.byteLength(whitelistBlock), 5392);
  assert.equal(lineCount(blocklistTail), 85);
  assert.equal(Buffer.byteLength(blocklistTail), 4702);
  assert.equal(lineCount(processDataBlock), 32);
  assert.equal(Buffer.byteLength(processDataBlock), 1240);
  assert.equal(lineCount(enabledSkipBlock), 7);
  assert.equal(Buffer.byteLength(enabledSkipBlock), 387);

  for (const [literal, expected] of [
    ["listMode === 'whitelist'", 2],
    ['this.settings.listMode', 1],
    ['_hasChannelPolicyRules', 1],
    ['extractChannelIdentity', 1],
    ['filterChannels', 4],
    ['filterKeywords', 5],
    ['whitelistChannels', 6],
    ['whitelistKeywords', 5],
    ['hideAllComments', 2],
    ['hideAllShorts', 1],
    ['return true', 11],
    ['return false', 11],
    ['_checkContentFilters', 1],
    ['_checkCategoryFilters', 1],
    ['filterKeywordsComments', 2],
    ['pageChannelMeta', 3]
  ]) {
    assert.equal(countLiteral(shouldBlockBlock, literal), expected, `${literal} count changed`);
  }

  for (const [literal, expected] of [
    ['_harvestChannelData', 1],
    ['settings.enabled === false', 1],
    ['return data', 2],
    ['this.filter(data)', 1],
    ['blockedCount', 2]
  ]) {
    assert.equal(countLiteral(processDataBlock, literal), expected, `processData ${literal} count changed`);
  }

  for (const phrase of [
    'list-mode matrix boundary source files: 1',
    'filter_logic _shouldBlock block lines: 301',
    'list-mode setup block lines: 5',
    'whitelist decision branch lines: 105',
    'blocklist decision tail lines: 85',
    'processData block lines: 32',
    'enabled skip block lines: 7',
    'runtime list-mode matrix fixtures: 6'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('disabled settings return the original payload even when whitelist would fail-close', () => {
  const data = payload('videoRenderer', videoRenderer());
  const disabled = run(data, {
    enabled: false,
    listMode: 'whitelist'
  });

  assert.equal(disabled.result, data);
  assert.equal(disabled.result.contents.length, 1);
  assert.equal(disabled.result.contents[0].videoRenderer.videoId, 'lmvideo0001');
});

test('empty blocklist preserves a video while empty whitelist removes the same video', () => {
  const data = payload('videoRenderer', videoRenderer());

  const emptyBlocklist = run(data, { listMode: 'blocklist' });
  const emptyWhitelist = run(data, { listMode: 'whitelist' });

  assert.equal(emptyBlocklist.result.contents.length, 1);
  assert.equal(emptyBlocklist.result.contents[0].videoRenderer.videoId, 'lmvideo0001');
  assert.deepEqual(plain(emptyWhitelist.result), { contents: [] });
});

test('unknown listMode falls back to blocklist and leaves whitelist rows dormant', () => {
  const data = payload('videoRenderer', videoRenderer());

  const unknownWithBlockRow = run(data, {
    listMode: 'unexpected-mode',
    filterChannels: [{ id: 'UCmatrixcreator000000000' }]
  });
  const unknownWithWhitelistOnly = run(data, {
    listMode: 'unexpected-mode',
    whitelistChannels: [{ id: 'UCmatrixcreator000000000' }]
  });

  assert.deepEqual(plain(unknownWithBlockRow.result), { contents: [] });
  assert.equal(unknownWithWhitelistOnly.result.contents.length, 1);
  assert.equal(unknownWithWhitelistOnly.result.contents[0].videoRenderer.videoId, 'lmvideo0001');
});

test('blocklist mode does not let matching whitelist rows override a blocklist channel row', () => {
  const data = payload('videoRenderer', videoRenderer());

  const conflict = run(data, {
    listMode: 'blocklist',
    filterChannels: [{ id: 'UCmatrixcreator000000000' }],
    whitelistChannels: [{ id: 'UCmatrixcreator000000000' }]
  });

  assert.deepEqual(plain(conflict.result), { contents: [] });
});

test('whitelist mode does not let matching blocklist rows override a whitelist channel allow', () => {
  const data = payload('videoRenderer', videoRenderer());

  const conflict = run(data, {
    listMode: 'whitelist',
    filterChannels: [{ id: 'UCmatrixcreator000000000' }],
    whitelistChannels: [{ id: 'UCmatrixcreator000000000' }]
  });

  assert.equal(conflict.result.contents.length, 1);
  assert.equal(conflict.result.contents[0].videoRenderer.videoId, 'lmvideo0001');
});

test('comments bypass empty whitelist fail-close but blocklist author rows still remove comments', () => {
  const data = payload('commentRenderer', commentRenderer());

  const emptyWhitelist = run(data, { listMode: 'whitelist' });
  const authorBlocked = run(data, {
    listMode: 'blocklist',
    filterChannels: [{ id: 'UCmatrixcommenter0000000' }],
    filterKeywords: [keyword('unmatched-video-keyword')]
  });

  assert.equal(emptyWhitelist.result.contents.length, 1);
  assert.equal(emptyWhitelist.result.contents[0].commentRenderer.authorText.simpleText, 'Matrix Commenter');
  assert.deepEqual(plain(authorBlocked.result), { contents: [] });
});

test('product runtime still lacks first-class list-mode matrix authority symbols', () => {
  const source = productRuntimeSource();

  for (const symbol of [
    'jsonFirstListModeMatrixContract',
    'jsonFirstListModeDecisionReport',
    'jsonFirstDisabledModeHarvestPolicy',
    'jsonFirstEmptyBlocklistPolicy',
    'jsonFirstEmptyWhitelistPolicy',
    'jsonFirstUnknownListModeFallbackPolicy',
    'jsonFirstSimultaneousAllowBlockPolicy',
    'jsonFirstBlocklistWhitelistConflictReport',
    'jsonFirstCommentListModePolicy',
    'jsonFirstListModeFixtureProvenance'
  ]) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.ok(read(docPath).includes(symbol), `${symbol} missing from audit doc`);
  }
});
