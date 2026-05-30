import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STALE_ALIAS_FALSE_HIDE_CHAIN_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function renderer(overrides = {}) {
  return {
    videoRenderer: {
      videoId: 'stalealias01',
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
    }
  };
}

function runEngine(contents, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData({ contents }, settings, 'stale-alias-false-hide-chain');
}

test('stale alias false-hide chain doc is audit-only and names the exact authority split', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Status: current-behavior proof',
    'Updated by the 2026-05-26 release regression fixes',
    'visible Main blocklist rows are empty',
    'UI row renderer reads canonical main.keywords / main.channels',
    'legacy blockedKeywords / blockedChannels aliases can remain present',
    'background compiler now prefers main.keywords before blockedKeywords',
    'background compiler now prefers main.channels before blockedChannels',
    'normal Main blocklist compilation ignores stale aliases when canonical rows exist',
    'JSON engine and DOM fallback can hide matching content'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase: ${phrase}`);
  }
});

test('stale alias false-hide chain doc lists source-backed hops and future invariants', () => {
  const doc = read(docPath);

  for (const phrase of [
    'js/render_engine.js:169-225',
    'js/render_engine.js:548-605',
    'js/settings_shared.js:918-940',
    'js/background.js:2055-2064',
    'js/background.js:2217-2225',
    'visibleRuntimeRuleAuthority',
    'empty visible Main channel rows compile zero Main channel blocklist rules',
    'Import, Nanah apply, profile switching, legacy migration, list-mode transfer',
    'Fixing keyword alias precedence does not fix channel'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase: ${phrase}`);
  }
});

test('visible Main row renderers currently ignore blocked alias fields', () => {
  const render = read('js/render_engine.js');
  const keywordBlock = sliceBetween(
    render,
    'function renderKeywordList(container, options = {})',
    'function createKeywordListItem(entry, config = {})'
  );
  const channelBlock = sliceBetween(
    render,
    'function renderChannelList(container, options = {})',
    'function createMinimalChannelItem'
  );

  assert.match(keywordBlock, /mainMode === 'whitelist'\s*\?\s*\(Array\.isArray\(state\.whitelistKeywords\) \? state\.whitelistKeywords : \[\]\)\s*:\s*state\.keywords/);
  assert.doesNotMatch(keywordBlock, /state\.blockedKeywords/);

  assert.match(channelBlock, /mainMode === 'whitelist'\s*\?\s*\(Array\.isArray\(state\.whitelistChannels\) \? state\.whitelistChannels : \[\]\)\s*:\s*state\.channels/);
  assert.doesNotMatch(channelBlock, /state\.blockedChannels/);
});

test('shared save path syncs Main blocklist aliases without conflict reporting', () => {
  const shared = read('js/settings_shared.js');
  const saveBlock = sliceBetween(
    shared,
    'const existingMain = safeObject(activeProfile.main);',
    'profiles[activeId] = {'
  );

  assert.match(saveBlock, /channels: sanitizedChannels/);
  assert.match(saveBlock, /keywords: sanitizedKeywords/);
  assert.match(saveBlock, /nextMainProfile\.blockedChannels = sanitizedChannels;/);
  assert.match(saveBlock, /nextMainProfile\.blockedKeywords = sanitizedKeywords;/);
  assert.doesNotMatch(saveBlock, /aliasConflict|visibleRuntimeRuleAuthority|compiledRuleState/);
});

test('background compile prefers canonical Main keywords and channels before aliases', () => {
  const background = read('js/background.js');
  const keywordCompile = sliceBetween(
    background,
    'const v4KeywordEntries = shouldUseKidsProfile',
    'if (v4KeywordEntries) {'
  );
  const channelCompile = sliceBetween(
    background,
    'const storedChannels = shouldUseKidsProfile',
    'let compiledChannels = [];'
  );

  assert.match(keywordCompile, /Array\.isArray\(activeMain\.keywords\)\s*\?\s*activeMain\.keywords\s*:\s*\(Array\.isArray\(activeMain\.blockedKeywords\) \? activeMain\.blockedKeywords : null\)/);
  assert.ok(keywordCompile.indexOf('activeMain.keywords') < keywordCompile.indexOf('activeMain.blockedKeywords'));
  assert.match(channelCompile, /Array\.isArray\(activeMain\.channels\)\s*\?\s*activeMain\.channels\s*:\s*\(Array\.isArray\(activeMain\.blockedChannels\) \? activeMain\.blockedChannels : items\.filterChannels\)/);
  assert.ok(channelCompile.indexOf('activeMain.channels') < channelCompile.indexOf('activeMain.blockedChannels'));
  assert.doesNotMatch(keywordCompile + channelCompile, /aliasConflict|visibleRuntimeRuleAuthority|compiledRuleState/);
});

test('compiled channel payload still hides if runtime receives an active channel rule', () => {
  const visibleProfileState = {
    mode: 'blocklist',
    keywords: [],
    channels: [],
    blockedKeywords: [],
    blockedChannels: [{ id: 'UC1111111111111111111111', name: 'Hidden Alias Channel' }]
  };

  assert.deepEqual(visibleProfileState.keywords, []);
  assert.deepEqual(visibleProfileState.channels, []);
  assert.ok(visibleProfileState.blockedChannels.length > 0);

  const channelOutput = runEngine([renderer({ title: { runs: [{ text: 'unrelated title' }] } })], {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [{ id: 'UC1111111111111111111111', name: 'Hidden Alias Channel' }],
    whitelistKeywords: [],
    whitelistChannels: []
  });

  assert.deepEqual(plain(channelOutput), { contents: [] });
});

test('runtime source still lacks the future visible-runtime authority contract', () => {
  const combined = [
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/render_engine.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js'
  ].map(read).join('\n');

  for (const token of [
    'visibleRuntimeRuleAuthority',
    'aliasConflict',
    'canonicalKeywordCount',
    'aliasKeywordCount',
    'canonicalChannelCount',
    'aliasChannelCount',
    'migrationAction'
  ]) {
    assert.doesNotMatch(combined, new RegExp(`\\b${token}\\b`));
  }
});
