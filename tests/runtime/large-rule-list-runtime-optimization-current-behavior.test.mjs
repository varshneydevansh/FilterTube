import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function loadIdentity() {
  const context = {
    window: { FilterTubeIdentity: {} },
    URL,
    JSON,
    decodeURIComponent,
    console
  };
  context.self = context.window;
  context.globalThis = context.window;
  vm.runInNewContext(read('js/shared/identity.js'), context, { filename: 'js/shared/identity.js' });
  return context.window.FilterTubeIdentity;
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    blockedVideoIds: [],
    allowedVideoIds: [],
    channelMap: {},
    ...overrides
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function videoRenderer({ videoId = 'video000001', title = 'Ordinary video', channelId = 'UC0000000000000000000000', channelName = 'Ordinary channel' } = {}) {
  return {
    videoRenderer: {
      videoId,
      title: { simpleText: title },
      ownerText: {
        runs: [{
          text: channelName,
          navigationEndpoint: { browseEndpoint: { browseId: channelId } }
        }]
      },
      shortBylineText: {
        runs: [{
          text: channelName,
          navigationEndpoint: { browseEndpoint: { browseId: channelId } }
        }]
      }
    }
  };
}

test('unchanged settings reuse compiled channel indexes', () => {
  const sharedIdentity = loadIdentity();
  const builds = [];
  const identity = {
    ...sharedIdentity,
    buildChannelFilterIndex(channels, channelMap) {
      builds.push({ channels: channels.length, map: { ...channelMap } });
      return sharedIdentity.buildChannelFilterIndex(channels, channelMap);
    }
  };
  const runtime = loadFilterTubeEngine({ identity });
  const activeSettings = settings({ filterChannels: ['UC1234567890123456789012'] });

  runtime.engine.processData({ contents: [] }, activeSettings, 'first');
  runtime.engine.processData({ contents: [] }, activeSettings, 'second');
  assert.equal(builds.length, 2, 'block and allow indexes should be built once for one settings snapshot');

  runtime.engine.processData({ contents: [] }, { ...activeSettings }, 'replacement-settings');
  assert.equal(builds.length, 4, 'a replacement settings snapshot must rebuild both indexes');
});

test('learned UC ID mappings refresh cached block and allow indexes before filtering', () => {
  const sharedIdentity = loadIdentity();
  const builds = [];
  const identity = {
    ...sharedIdentity,
    buildChannelFilterIndex(channels, channelMap) {
      builds.push({ channels: channels.length, map: { ...channelMap } });
      return sharedIdentity.buildChannelFilterIndex(channels, channelMap);
    }
  };
  const runtime = loadFilterTubeEngine({ identity });
  const channelId = 'UC1234567890123456789012';
  const activeSettings = settings({ filterChannels: [channelId] });

  runtime.engine.processData({
    metadata: {
      channelMetadataRenderer: {
        externalId: channelId,
        title: 'Mapped channel',
        vanityChannelUrl: 'https://www.youtube.com/@MappedHandle'
      }
    }
  }, activeSettings, 'mapping-harvest');

  assert.equal(activeSettings.channelMap[channelId.toLowerCase()], '@MappedHandle');
  assert.equal(activeSettings.channelMap['@mappedhandle'], channelId);
  assert.equal(builds.length, 4, 'harvesting should rebuild block and allow indexes after initial construction');
  assert.equal(builds.at(-1).map['@mappedhandle'], channelId);

  runtime.engine.processData({ contents: [] }, activeSettings, 'mapping-stable');
  assert.equal(builds.length, 4, 'refreshed indexes should remain reusable while settings and mappings are unchanged');
});

test('custom URL mappings also invalidate a reusable channel index', () => {
  const sharedIdentity = loadIdentity();
  let builds = 0;
  const identity = {
    ...sharedIdentity,
    buildChannelFilterIndex(channels, channelMap) {
      builds++;
      return sharedIdentity.buildChannelFilterIndex(channels, channelMap);
    }
  };
  const runtime = loadFilterTubeEngine({ identity });
  const channelId = 'UC1234567890123456789012';
  const filter = new runtime.engine.YouTubeDataFilter(settings({ filterChannels: [channelId] }));

  filter._registerCustomUrlMapping(channelId, 'c/LegacyChannel');
  assert.equal(filter.channelMap['c/legacychannel'], channelId);
  filter.processData({ contents: [] }, 'custom-url-refresh');
  assert.equal(builds, 4, 'custom URL learning should rebuild both indexes exactly once');
});

test('reused engines preserve fresh-engine decisions across channel keyword video-ID and allowlist rules', () => {
  const identity = loadIdentity();
  const runtime = loadFilterTubeEngine({ identity });
  const blockedChannelId = 'UC1234567890123456789012';
  const scenarios = [
    {
      name: 'channel-id',
      activeSettings: settings({ filterChannels: [blockedChannelId] }),
      payload: { contents: [videoRenderer({ channelId: blockedChannelId })] }
    },
    {
      name: 'keyword',
      activeSettings: settings({ filterKeywords: [{ pattern: 'blocked phrase', flags: 'i' }] }),
      payload: { contents: [videoRenderer({ title: 'A blocked phrase appears' })] }
    },
    {
      name: 'video-id-block',
      activeSettings: settings({ blockedVideoIds: ['video000001'] }),
      payload: { contents: [videoRenderer()] }
    },
    {
      name: 'video-id-allow-tie',
      activeSettings: settings({ blockedVideoIds: ['video000001'], allowedVideoIds: ['video000001'] }),
      payload: { contents: [videoRenderer()] }
    },
    {
      name: 'allowlist-fail-closed',
      activeSettings: settings({ listMode: 'whitelist', whitelistChannels: [blockedChannelId] }),
      payload: { contents: [videoRenderer()] }
    }
  ];

  for (const scenario of scenarios) {
    const expected = new runtime.engine.YouTubeDataFilter(scenario.activeSettings)
      .processData(plain(scenario.payload), `${scenario.name}-fresh`);
    const first = runtime.engine.processData(plain(scenario.payload), scenario.activeSettings, `${scenario.name}-cached-first`);
    const second = runtime.engine.processData(plain(scenario.payload), scenario.activeSettings, `${scenario.name}-cached-second`);
    assert.deepEqual(plain(first), plain(expected), `${scenario.name} first cached decision drifted`);
    assert.deepEqual(plain(second), plain(expected), `${scenario.name} second cached decision drifted`);
  }
});

test('reused engine resets creator-page metadata between payloads', () => {
  const identity = loadIdentity();
  const runtime = loadFilterTubeEngine({ identity });
  const allowedChannelId = 'UC1234567890123456789012';
  const activeSettings = settings({
    listMode: 'whitelist',
    whitelistChannels: [allowedChannelId]
  });
  const reusable = new runtime.engine.YouTubeDataFilter(activeSettings);

  reusable.processData({
    metadata: {
      channelMetadataRenderer: {
        externalId: allowedChannelId,
        title: 'Allowed creator',
        vanityChannelUrl: 'https://www.youtube.com/@AllowedCreator'
      }
    }
  }, 'creator-page');

  const nextPayload = { contents: [videoRenderer()] };
  const reusedResult = reusable.processData(plain(nextPayload), 'next-route');
  const freshResult = new runtime.engine.YouTubeDataFilter(activeSettings).processData(plain(nextPayload), 'next-route-fresh');
  assert.deepEqual(plain(reusedResult), plain(freshResult));
  assert.equal(reusable.pageChannelMeta, null);
});

test('hidden-card statistics persist once per synchronous mutation burst', () => {
  const bridge = read('js/content_bridge.js');
  const saveStart = bridge.indexOf('function saveStats() {');
  const saveEnd = bridge.indexOf('function handleMediaPlayback(element, shouldHide) {', saveStart);
  const saveBlock = bridge.slice(saveStart, saveEnd);
  const incrementStart = bridge.indexOf('function incrementHiddenStats(element) {');
  const incrementEnd = bridge.indexOf('function decrementHiddenStats(element) {', incrementStart);
  const incrementBlock = bridge.slice(incrementStart, incrementEnd);

  assert.match(saveBlock, /statsSavePending = true/);
  assert.match(saveBlock, /statsSaveScheduled \|\| statsSaveInFlight/);
  assert.match(saveBlock, /queueMicrotask/);
  assert.match(saveBlock, /chrome\.storage\.local\.set\(payload, finishWrite\)/);
  assert.match(incrementBlock, /if \(window\.__filtertubeDebug === true\)/);
  assert.equal((incrementBlock.match(/console\.log\(`FilterTube: Saved/g) || []).length, 1);
});

test('DOM fallback caches compiled rule lists by immutable snapshot identity', () => {
  const fallback = read('js/content/dom_fallback.js');
  const resolver = read('js/content/handle_resolver.js');

  assert.doesNotMatch(fallback, /function getListSignatureForRun\(/);
  assert.doesNotMatch(fallback, /sourceSignature/);
  assert.match(fallback, /compiledKeywordRegexCache\.get\(rawList\)/);
  assert.match(fallback, /existing\.sourceChannelMapRevision === channelMapRevision/);
  assert.match(resolver, /currentSettings\.__filtertubeChannelMapRevision/);
  assert.match(resolver, /const map = currentSettings\.channelMap/);
  assert.doesNotMatch(resolver, /const map = \{\s*\.\.\./);
});

test('channel-only JSON filtering skips unused search metadata extraction', () => {
  const identity = loadIdentity();
  const runtime = loadFilterTubeEngine({ identity });
  const channelId = 'UC1234567890123456789012';
  const filter = new runtime.engine.YouTubeDataFilter(settings({ filterChannels: [channelId] }));
  let collections = 0;
  const originalCollect = filter._collectTextFromPaths.bind(filter);
  filter._collectTextFromPaths = (...args) => {
    collections++;
    return originalCollect(...args);
  };

  const blocked = filter._shouldBlock(videoRenderer({ channelId }).videoRenderer, 'videoRenderer');
  assert.equal(blocked, true);
  assert.equal(collections, 0, 'channel-only policy should not collect keyword-search metadata');

  const keywordFilter = new runtime.engine.YouTubeDataFilter(settings({
    filterChannels: [channelId],
    filterKeywords: [{ pattern: 'ordinary', flags: 'i' }]
  }));
  let keywordCollections = 0;
  const keywordOriginalCollect = keywordFilter._collectTextFromPaths.bind(keywordFilter);
  keywordFilter._collectTextFromPaths = (...args) => {
    keywordCollections++;
    return keywordOriginalCollect(...args);
  };
  keywordFilter._shouldBlock(videoRenderer({ channelId: 'UC0000000000000000000000' }).videoRenderer, 'videoRenderer');
  assert.ok(keywordCollections > 0, 'keyword policy must preserve full searchable metadata extraction');
});

test('Home mutation fallback queues affected cards while structural mutations retain the full pass', () => {
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');

  assert.match(bridge, /const pendingFallbackCandidates = new Set\(\)/);
  assert.match(bridge, /function scheduleImmediateFallback\(candidateElements = null, forceFullPass = candidateElements == null\)/);
  assert.match(bridge, /incrementalHomeCards: true/);
  assert.match(bridge, /candidateElements: candidates/);
  assert.match(bridge, /const fallbackFullPassSelector = \[/);
  assert.match(bridge, /mutationSummary\.requiresFullFallback/);
  assert.match(bridge, /mutationSummary\.candidateElements/);

  assert.match(fallback, /function collectFilterTubeVisualCardOwnersFromCandidates\(candidates, selector\)/);
  assert.match(fallback, /const useIncrementalHomeCards = Boolean\(/);
  assert.match(fallback, /collectFilterTubeVisualCardOwnersFromCandidates\(candidateElements, videoSelector\)/);
  assert.match(fallback, /if \(useIncrementalHomeCards\) \{\s*return;\s*\}/);
});

test('temporary performance diagnostics are opt-in and aggregate expensive stages', () => {
  const filterLogic = read('js/filter_logic.js');
  const fallback = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');

  for (const source of [filterLogic, fallback]) {
    assert.match(source, /data-filtertube-perf-debug/);
    assert.match(source, /localStorage\.getItem\('filtertubePerfDebug'\) === '1'/);
    assert.match(source, /\[FilterTube Perf\]/);
  }
  assert.match(filterLogic, /perf\.log\('json-engine-build'/);
  assert.match(filterLogic, /perf\.log\('json-filter'/);
  assert.match(filterLogic, /harvestMs/);
  assert.match(filterLogic, /indexRefreshMs/);
  assert.match(fallback, /perf\.log\('dom-channel-index-build'/);
  assert.match(fallback, /perf\.log\('dom-fallback'/);
  assert.match(bridge, /perf\?\.log\?\.\('observer-fallback-request'/);
});

test('learned Home card identities batch into an incremental fallback pass', () => {
  const bridge = read('js/content_bridge.js');
  const start = bridge.indexOf('function stampChannelIdentity(card, info, options = {}) {');
  const end = bridge.indexOf('function resetCardIdentityIfStale(card, videoId) {', start);
  const stamp = bridge.slice(start, end);

  assert.match(stamp, /candidates: new Set\(\)/);
  assert.match(stamp, /state\.candidates\.add\(card\)/);
  assert.match(stamp, /const isHome = \(document\.location\?\.pathname \|\| ''\) === '\/'/);
  assert.match(stamp, /incrementalHomeCards: true/);
  assert.match(stamp, /candidateElements: candidates/);
  assert.match(stamp, /applyDOMFallback\(null\)/, 'non-Home identity stamps must retain the full fallback path');
});
