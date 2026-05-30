import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_VISIBLE_EMPTY_RUNTIME_ACTIVE_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function videoRenderer(overrides = {}) {
  return {
    videoId: 'visibleempty01',
    title: { runs: [{ text: 'spider search result' }] },
    shortBylineText: {
      runs: [{
        text: 'Hidden Alias Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC1111111111111111111111',
            canonicalBaseUrl: '/@hiddenalias'
          }
        }
      }]
    },
    ...overrides
  };
}

function runEngine(payload, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, settings, 'visible-empty-runtime-active');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('visible-empty runtime-active audit documents split visible and compiled rule authority', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'current-behavior proof only',
    'implementation gate remains closed',
    'render_engine.js reads state.keywords / state.channels',
    'background.js now prefers activeMain.keywords before activeMain.blockedKeywords',
    'background.js now prefers activeMain.channels before activeMain.blockedChannels',
    '`settings_shared.js` writes canonical Main `channels` and `keywords`',
    'in blocklist mode it mirrors `blockedChannels` and `blockedKeywords` from canonical rows',
    'visibleRuntimeRuleAuthority',
    'Empty visible Main keyword rows compile zero Main keyword rules'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }
});

test('main keyword UI rows use canonical state.keywords instead of blockedKeywords alias', () => {
  const source = read('js/render_engine.js');
  const block = sliceBetween(
    source,
    'function renderKeywordList(container, options = {})',
    'function createKeywordListItem(entry, config = {})'
  );

  assert.match(block, /const mainMode = state\?\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(block, /mainMode === 'whitelist'\s*\?\s*\(Array\.isArray\(state\.whitelistKeywords\) \? state\.whitelistKeywords : \[\]\)\s*:\s*state\.keywords/);
  assert.doesNotMatch(block, /state\.blockedKeywords/);
});

test('main channel UI rows use canonical state.channels instead of blockedChannels alias', () => {
  const source = read('js/render_engine.js');
  const block = sliceBetween(
    source,
    'function renderChannelList(container, options = {})',
    'function createMinimalChannelItem'
  );

  assert.match(block, /const mainMode = state\?\.mode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(block, /mainMode === 'whitelist'\s*\?\s*\(Array\.isArray\(state\.whitelistChannels\) \? state\.whitelistChannels : \[\]\)\s*:\s*state\.channels/);
  assert.doesNotMatch(block, /state\.blockedChannels/);
});

test('background keyword compile prefers canonical keywords before blockedKeywords alias', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'if (v4KeywordEntries) {'
  );

  assert.match(block, /const mainKeywords = Array\.isArray\(activeMain\.keywords\)\s*\?\s*activeMain\.keywords\s*:\s*\(Array\.isArray\(activeMain\.blockedKeywords\) \? activeMain\.blockedKeywords : null\);/);
  assert.ok(block.indexOf('activeMain.keywords') < block.indexOf('activeMain.blockedKeywords'));
});

test('background channel compile prefers canonical channels before blockedChannels alias', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    'const storedChannels = shouldUseKidsProfile',
    'let compiledChannels = [];'
  );

  assert.match(block, /const mainChannels = Array\.isArray\(activeMain\.channels\)\s*\?\s*activeMain\.channels\s*:\s*\(Array\.isArray\(activeMain\.blockedChannels\) \? activeMain\.blockedChannels : items\.filterChannels\);/);
  assert.ok(block.indexOf('activeMain.channels') < block.indexOf('activeMain.blockedChannels'));
});

test('shared settings save writes canonical main lists and mirrors blocklist aliases', () => {
  const source = read('js/settings_shared.js');
  const block = sliceBetween(
    source,
    'const existingMain = safeObject(activeProfile.main);',
    'profiles[activeId] = {'
  );

  assert.match(block, /channels: sanitizedChannels/);
  assert.match(block, /keywords: sanitizedKeywords/);
  assert.match(block, /if \(mainMode === 'blocklist'\) \{/);
  assert.match(block, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
  assert.match(block, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
});

test('compiled keyword payload still hides content, but background no longer prefers hidden keyword aliases', () => {
  const visibleState = {
    mode: 'blocklist',
    keywords: [],
    channels: [],
    blockedKeywords: [{ word: 'spider' }],
    blockedChannels: []
  };
  const input = { contents: [{ videoRenderer: videoRenderer() }] };

  assert.deepEqual(visibleState.keywords, [], 'visible Main keyword rows are empty');
  assert.ok(visibleState.blockedKeywords.length > 0, 'simulated stale alias exists');
  const background = read('js/background.js');
  const keywordCompile = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'if (v4KeywordEntries) {'
  );
  assert.ok(keywordCompile.indexOf('activeMain.keywords') < keywordCompile.indexOf('activeMain.blockedKeywords'));

  const output = runEngine(input, {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [keyword('spider')],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: []
  });

  assert.deepEqual(plain(output), { contents: [] });
});

test('compiled channel payload still hides while normal compiler no longer prefers hidden channel aliases', () => {
  const visibleState = {
    mode: 'blocklist',
    keywords: [],
    channels: [],
    blockedKeywords: [],
    blockedChannels: [{ id: 'UC1111111111111111111111', name: 'Hidden Alias Channel' }]
  };
  const input = { contents: [{ videoRenderer: videoRenderer() }] };

  assert.deepEqual(visibleState.channels, [], 'visible Main channel rows are empty');

  const output = runEngine(input, {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [{
      id: 'UC1111111111111111111111',
      name: 'Hidden Alias Channel',
      filterAll: false
    }],
    whitelistKeywords: [],
    whitelistChannels: []
  });

  assert.deepEqual(plain(output), { contents: [] });
});

test('product source has no visible runtime rule authority implementation yet', () => {
  const combined = [
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/render_engine.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js'
  ].map(read).join('\n');

  assert.doesNotMatch(combined, /\bvisibleRuntimeRuleAuthority\b/);
  assert.doesNotMatch(combined, /\bcompiledRuleState\b/);
});
