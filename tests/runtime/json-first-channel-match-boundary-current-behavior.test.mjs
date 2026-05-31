import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function loadIdentity(existing = {}) {
  const source = read('js/shared/identity.js');
  const context = {
    window: { FilterTubeIdentity: existing },
    URL,
    JSON,
    decodeURIComponent,
    console
  };
  context.self = context.window;
  context.globalThis = context.window;
  vm.runInNewContext(source, context, { filename: 'js/shared/identity.js' });
  return context.window.FilterTubeIdentity;
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
    videoId: 'chanmatch01',
    title: { runs: [{ text: 'Channel Match Fixture' }] },
    shortBylineText: {
      runs: [{
        text: 'Same Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UCBBBBBBBBBBBBBBBBBBBBBB',
            canonicalBaseUrl: '/@samechannel'
          }
        }
      }]
    },
    ...overrides
  };
}

test('JSON-first channel match boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for JSON-first channel match authority/);

  for (const [file, lines, bytes, hash] of [
    ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
    ['js/shared/identity.js', 808, 30599, '41f26baf0eef27994666430e2b8b490c893eed90abd67f47d562926d94155958']
  ]) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.ok(doc.includes(`\`${file}\``), `doc should list ${file}`);
  }

  for (const artifact of [
    'docs/audit/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_LEARNED_IDENTITY_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_VISIBLE_EMPTY_RUNTIME_ACTIVE_CURRENT_BEHAVIOR_2026-05-19.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('channel match source counts remain pinned', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const identity = read('js/shared/identity.js');

  const filterBuildBlock = sliceBetween(filterLogic, '_buildChannelFilterIndex(filterChannels) {', '        _matchesAnyChannel(channelInfo, filterChannels, index = null) {');
  const filterAnyBlock = sliceBetween(filterLogic, '_matchesAnyChannel(channelInfo, filterChannels, index = null) {', '        _harvestBrowseEndpoint(node) {');
  const filterMatchBlock = sliceBetween(filterLogic, '_matchesChannel(filterChannel, channelInfo) {', '        /**\n         * Recursively filter');
  const sharedBuildBlock = sliceBetween(identity, 'function buildChannelFilterIndex(filterChannels = [], channelMap = {}) {', '    function channelMetaMatchesIndex(meta, index, channelMap = {}) {');
  const sharedIndexBlock = sliceBetween(identity, 'function channelMetaMatchesIndex(meta, index, channelMap = {}) {', '    /**\n     * Core matching primitive');
  const sharedDirectBlock = sliceBetween(identity, 'function channelMatchesFilter(meta, filterChannel, channelMap = {}) {', '    function extractCustomUrlFromPath');
  const sharedBlockedBlock = sliceBetween(identity, 'function isChannelBlocked(filterChannels, channelInfo, channelMap = {}) {', '    const api = {');

  assert.equal(lineCount(filterBuildBlock), 11);
  assert.equal(Buffer.byteLength(filterBuildBlock), 370);
  assert.equal(lineCount(filterAnyBlock), 19);
  assert.equal(Buffer.byteLength(filterAnyBlock), 719);
  assert.equal(lineCount(filterMatchBlock), 170);
  assert.equal(Buffer.byteLength(filterMatchBlock), 7880);
  assert.equal(lineCount(sharedBuildBlock), 118);
  assert.equal(Buffer.byteLength(sharedBuildBlock), 4624);
  assert.equal(lineCount(sharedIndexBlock), 48);
  assert.equal(Buffer.byteLength(sharedIndexBlock), 1937);
  assert.equal(lineCount(sharedDirectBlock), 164);
  assert.equal(Buffer.byteLength(sharedDirectBlock), 6948);
  assert.equal(lineCount(sharedBlockedBlock), 9);
  assert.equal(Buffer.byteLength(sharedBlockedBlock), 467);

  assert.equal(countLiteral(filterMatchBlock, 'return true'), 17);
  assert.equal(countLiteral(filterMatchBlock, 'return false'), 2);
  assert.equal(countLiteral(filterMatchBlock, 'channelMap'), 17);
  assert.equal(countLiteral(sharedIndexBlock, 'return true'), 11);
  assert.equal(countLiteral(sharedIndexBlock, 'return false'), 2);
  assert.equal(countLiteral(sharedDirectBlock, 'return true'), 18);
  assert.equal(countLiteral(sharedDirectBlock, 'return false'), 7);
  assert.equal(countLiteral(sharedBuildBlock, 'nameOnlyNames'), 3);
  assert.equal(countLiteral(sharedBuildBlock, 'stableNames'), 3);
  assert.equal(countLiteral(sharedIndexBlock, 'nameOnlyNames'), 3);
  assert.equal(countLiteral(sharedIndexBlock, 'stableNames'), 3);

  for (const phrase of [
    'channel match source/effect blocks: 7',
    'filter_logic build channel index block lines: 11',
    'filter_logic _matchesAnyChannel block lines: 19',
    'filter_logic _matchesChannel fallback block lines: 170',
    'shared buildChannelFilterIndex block lines: 118',
    'shared channelMetaMatchesIndex block lines: 48',
    'shared channelMatchesFilter block lines: 164',
    'shared isChannelBlocked block lines: 9',
    'runtime channel match fixtures: 6'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('shared indexed channel matching admits stable ids and channelMap cross-links as booleans', () => {
  const identity = loadIdentity();
  const channelMap = {
    uc1234567890123456789012: '@mappedhandle',
    '@mappedhandle': 'UC1234567890123456789012',
    'c/mappedcustom': 'UC1234567890123456789012'
  };

  const index = identity.buildChannelFilterIndex([
    'UC1234567890123456789012',
    '@otherhandle',
    'c/MappedCustom'
  ], channelMap);

  assert.equal(identity.channelMetaMatchesIndex({ id: 'UC1234567890123456789012' }, index, channelMap), true);
  assert.equal(identity.channelMetaMatchesIndex({ handle: '@mappedhandle' }, index, channelMap), true);
  assert.equal(identity.channelMetaMatchesIndex({ customUrl: 'c/mappedcustom' }, index, channelMap), true);
  assert.equal(identity.channelMetaMatchesIndex({ id: 'UC0000000000000000000000' }, index, channelMap), false);
  assert.equal(typeof identity.channelMetaMatchesIndex({ handle: '@mappedhandle' }, index, channelMap), 'boolean');
});

test('shared direct and indexed match paths diverge for object names and name-only strings', () => {
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
});

test('shared direct handle matching has weak name fallback that indexed handle matching does not share', () => {
  const identity = loadIdentity();
  const metaId = 'UCBBBBBBBBBBBBBBBBBBBBBB';
  const handleIndex = identity.buildChannelFilterIndex(['@somehandle'], {});

  assert.equal(identity.channelMatchesFilter({ id: metaId, name: 'somehandle' }, '@somehandle', {}), true);
  assert.equal(identity.channelMetaMatchesIndex({ id: metaId, name: 'somehandle' }, handleIndex, {}), false);
  assert.equal(identity.channelMatchesFilter({ name: 'somehandle' }, '@somehandle', {}), true);
  assert.equal(identity.channelMetaMatchesIndex({ name: 'somehandle' }, handleIndex, {}), false);
});

test('filter_logic _matchesAnyChannel uses the shared index path when an index exists', () => {
  const calls = [];
  const identity = {
    buildChannelFilterIndex(filterChannels, channelMap) {
      calls.push(['build', plain(filterChannels), plain(channelMap)]);
      return { fromStub: true };
    },
    channelMetaMatchesIndex(meta, index, channelMap) {
      calls.push(['index', plain(meta), plain(index), plain(channelMap)]);
      return meta.id === 'match';
    },
    channelMatchesFilter(meta, filterChannel, channelMap) {
      calls.push(['direct', plain(meta), plain(filterChannel), plain(channelMap)]);
      return true;
    }
  };
  const harness = loadFilterTubeEngine({ identity });
  const filter = new harness.engine.YouTubeDataFilter({
    filterChannels: [{ id: 'x' }],
    filterKeywords: [],
    channelMap: {}
  });

  assert.equal(filter._matchesAnyChannel({ id: 'match' }, [{ id: 'x' }], filter.filterChannelIndex), true);
  assert.equal(calls.filter(([kind]) => kind === 'index').length, 1);
  assert.equal(calls.filter(([kind]) => kind === 'direct').length, 0);
});

test('filter_logic legacy fallback differs from shared direct matching but keeps handle and map fallbacks', () => {
  const identity = loadIdentity();
  const filterId = 'UCAAAAAAAAAAAAAAAAAAAAAA';
  const metaId = 'UCBBBBBBBBBBBBBBBBBBBBBB';
  const objectFilter = { id: filterId, name: 'Same Channel' };
  const metaWithDifferentId = { id: metaId, name: 'Same Channel' };

  const harness = loadFilterTubeEngine();
  const filter = new harness.engine.YouTubeDataFilter({
    filterChannels: [],
    filterKeywords: [],
    channelMap: {
      [filterId.toLowerCase()]: '@mappedhandle',
      '@mappedhandle': filterId.toLowerCase()
    }
  });

  assert.equal(identity.channelMatchesFilter(metaWithDifferentId, objectFilter, {}), true);
  assert.equal(filter._matchesChannel(objectFilter, metaWithDifferentId), false);
  assert.equal(filter._matchesChannel('@somehandle', { id: metaId, name: 'somehandle' }), true);
  assert.equal(filter._matchesChannel(filterId, { id: '', handle: '@mappedhandle' }), true);
});

test('full shared-index JSON path guards stable-name mismatch but blocks exact UC id matches', () => {
  const identity = loadIdentity();
  const filterId = 'UCAAAAAAAAAAAAAAAAAAAAAA';
  const metaId = 'UCBBBBBBBBBBBBBBBBBBBBBB';
  const payload = { items: [{ videoRenderer: videoRenderer() }] };

  const mismatchHarness = loadFilterTubeEngine({ identity });
  const mismatchResult = mismatchHarness.engine.processData(
    payload,
    settings({
      filterChannels: [{ id: filterId, name: 'Same Channel' }],
      filterKeywords: [keyword('WillNotMatch')]
    }),
    'channel-match-stable-name-guard-fixture'
  );
  assert.equal(mismatchResult.items.length, 1);
  assert.equal(mismatchResult.items[0].videoRenderer.videoId, 'chanmatch01');

  const exactHarness = loadFilterTubeEngine({ identity });
  const exactResult = exactHarness.engine.processData(
    payload,
    settings({
      filterChannels: [{ id: metaId, name: 'Same Channel' }]
    }),
    'channel-match-exact-id-fixture'
  );
  assert.deepEqual(plain(exactResult), { items: [] });
});

test('runtime source lacks JSON-first channel match authority symbols', () => {
  const source = productRuntimeSource();

  for (const missing of [
    'jsonFirstChannelMatchContract',
    'jsonFirstChannelMatchDecisionReport',
    'jsonFirstChannelMatchConfidencePolicy',
    'jsonFirstChannelMatchIndexDirectParity',
    'jsonFirstChannelMatchFallbackScope',
    'jsonFirstChannelMatchNameOnlyPolicy',
    'jsonFirstChannelMatchStableNameGuard',
    'jsonFirstChannelMapProvenanceReport',
    'jsonFirstChannelMatchCallerMatrix',
    'jsonFirstChannelMatchFixtureProvenance'
  ]) {
    assert.doesNotMatch(source, new RegExp(missing));
  }
});
