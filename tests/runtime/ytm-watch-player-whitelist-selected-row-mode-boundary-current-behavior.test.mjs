import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_WHITELIST_SELECTED_ROW_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-watch-player-dom.html';

const futureAuthorityTokens = [
  'ytmWatchPlayerWhitelistSelectedRowPolicy',
  'ytmWatchPlayerSelectedRowJsonDomParityReport',
  'ytmWatchPlayerWhitelistCurrentVideoDecisionReport',
  'ytmWatchPlayerWhitelistPlaybackSideEffectReport',
  'ytmWatchPlayerWhitelistSelectedRowFixture',
  'ytmWatchPlayerWhitelistSelectedRowMetricArtifact',
  'ytmWatchPlayerWhitelistSelectedRowLeakReport',
  'ytmWatchPlayerWhitelistSelectedRowOptimizationGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return source.slice(start, end);
}

function elementBlocks(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[\\s\\S]*?<\\/${tagName}>`, 'g'))].map((match) => match[0]);
}

function attr(tagOrBlock, name) {
  return tagOrBlock.match(new RegExp(`${name}="([^"]*)"`))?.[1] || '';
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
    hideAllShorts: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function playlistPanelVideoRenderer({ videoId, title, channelName, channelId, handle, selected = false }) {
  return {
    playlistPanelVideoRenderer: {
      videoId,
      selected,
      title: { runs: [{ text: title }] },
      shortBylineText: {
        runs: [{
          text: channelName,
          navigationEndpoint: {
            browseEndpoint: {
              browseId: channelId,
              canonicalBaseUrl: handle
            }
          }
        }]
      }
    }
  };
}

function runEngine(payload, overrides = {}) {
  const { engine } = loadFilterTubeEngine({ pathname: '/watch' });
  return plain(engine.processData(plain(payload), settings(overrides), 'ytm-watch-player-whitelist-selected-row-mode'));
}

function makeMockElement(initial = {}) {
  const attrs = new Map(Object.entries(initial));
  const removed = [];
  return {
    getAttribute(name) {
      return attrs.get(name) || '';
    },
    removeAttribute(name) {
      removed.push(name);
      attrs.delete(name);
    },
    setAttribute(name, value) {
      attrs.set(name, String(value));
    },
    snapshot() {
      return Object.fromEntries(attrs.entries());
    },
    removed
  };
}

function runSelectedRowBranch({ listMode }) {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    '// Never hide the currently-selected playlist row.',
    'if (isShortVideoRenderer) {'
  );
  const element = makeMockElement({
    'data-filtertube-hidden-by-channel': 'true',
    'data-filtertube-hidden-by-keyword': 'true',
    'data-filtertube-hidden-by-duration': 'true',
    'data-filtertube-pending-category': 'true'
  });
  const nextButton = { clicks: 0, click() { this.clicks += 1; } };
  const timers = [];
  const context = {
    element,
    targetToHide: element,
    isPlaylistPanelRow: true,
    listMode,
    shouldHide: true,
    hasActiveBlockRules: true,
    matchesFilters: true,
    hasChannelIdentity: true,
    mappedChannelId: '',
    effectiveSettings: settings({
      filterChannels: [{ id: 'UCfg5XmOVjJ4yoeE0XkqmGAQ' }]
    }),
    hideReason: 'Content: selected row',
    isSelectedPlaylistPanelRow() {
      return true;
    },
    window: {},
    document: {
      querySelector(selector) {
        return selector === '.ytp-next-button:not([disabled])' ? nextButton : null;
      }
    },
    __timers: timers,
    setTimeout(callback) {
      timers.push(callback);
      return timers.length;
    },
    Date: { now: () => 2000 },
    Boolean,
    Array,
    Number
  };

  vm.createContext(context);
  vm.runInContext(`
    function runSelectedRowBlock() {
      ${block}
      return {
        shouldHide,
        attrs: targetToHide.snapshot(),
        removed: targetToHide.removed.slice(),
        timerCount: __timers.length
      };
    }
  `, context);
  const result = context.runSelectedRowBlock();
  for (const callback of context.__timers) {
    callback();
  }
  result.nextClicks = nextButton.clicks;
  return result;
}

function productRuntimeSource() {
  return [
    'js/content/dom_fallback.js',
    'js/content_bridge.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');
}

test('YTM whitelist selected-row mode audit doc is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch/);
  assert.match(doc, /Selected YTM playlist row \| `NLDFEkIvcbc` \/ `UCfg5XmOVjJ4yoeE0XkqmGAQ`/);
  assert.match(doc, /Visible playlist sibling \| `75NRE2KB8jc` \/ `UCm9VWKAFz0aXpuEHPHMae7w`/);
  assert.match(doc, /DOM selected-row branch \| 98 lines, 6145 bytes/);
  assert.match(doc, /JSON whitelist branch \| 106 lines, 5392 bytes/);
  assert.match(doc, /JSON\/DOM parity/);
});

test('reduced YTM fixture preserves selected row and visible sibling needed for whitelist mode proof', () => {
  const fixture = read(fixturePath);
  const rows = elementBlocks(fixture, 'ytm-playlist-panel-video-renderer');

  assert.equal(rows.length, 3);
  assert.equal(attr(rows[0], 'aria-selected'), 'true');
  assert.equal(attr(rows[0], 'data-filtertube-video-id'), 'NLDFEkIvcbc');
  assert.equal(attr(rows[0], 'data-filtertube-channel-id'), 'UCfg5XmOVjJ4yoeE0XkqmGAQ');
  assert.equal(attr(rows[0], 'data-filtertube-hidden'), 'true');
  assert.equal(attr(rows[1], 'aria-selected'), 'false');
  assert.equal(attr(rows[1], 'data-filtertube-video-id'), '75NRE2KB8jc');
  assert.equal(attr(rows[1], 'data-filtertube-channel-id'), 'UCm9VWKAFz0aXpuEHPHMae7w');
  assert.equal(attr(rows[1], 'data-filtertube-hidden'), '');
});

test('DOM source keeps YTM selected-row whitelist behavior generic rather than first-class', () => {
  const source = read('js/content/dom_fallback.js');
  const selectedRowBlock = sliceBetween(
    source,
    '// Never hide the currently-selected playlist row.',
    'if (isShortVideoRenderer) {'
  );
  const currentWatchBlock = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );
  const whitelistRestoreBlock = sliceBetween(
    source,
    "if (listMode === 'whitelist') {\n        try {\n            const watchTargets",
    '    // Robust DOM-based passes'
  );

  assert.match(selectedRowBlock, /shouldHideSelectedRow && listMode !== 'whitelist'/);
  assert.match(selectedRowBlock, /shouldHide = false/);
  assert.match(selectedRowBlock, /targetToHide\.removeAttribute\('data-filtertube-hidden-by-keyword'\)/);
  assert.doesNotMatch(selectedRowBlock, /removeAttribute\('data-filtertube-hidden-by-channel'\)/);
  assert.match(currentWatchBlock, /if \(listMode === 'whitelist'\) return/);
  assert.match(whitelistRestoreBlock, /ytd-watch-metadata/);
  assert.doesNotMatch(whitelistRestoreBlock, /ytm-watch|ytm-watch-player-controls/);
});

test('executable selected-row branch restores whitelist selected rows but schedules blocklist next clicks', () => {
  const whitelist = runSelectedRowBranch({ listMode: 'whitelist' });
  const blocklist = runSelectedRowBranch({ listMode: 'blocklist' });

  assert.equal(whitelist.shouldHide, false);
  assert.equal(whitelist.timerCount, 0);
  assert.equal(whitelist.nextClicks, 0);
  assert.equal(whitelist.attrs['data-filtertube-hidden-by-channel'], 'true');
  assert.equal(whitelist.attrs['data-filtertube-hidden-by-keyword'], undefined);
  assert.ok(whitelist.removed.includes('data-filtertube-hidden-by-keyword'));

  assert.equal(blocklist.shouldHide, true);
  assert.equal(blocklist.timerCount, 1);
  assert.equal(blocklist.nextClicks, 1);
  assert.equal(blocklist.attrs['data-filtertube-hidden-by-channel'], 'true');
  assert.equal(blocklist.attrs['data-filtertube-hidden-by-keyword'], 'true');
});

test('JSON playlist-panel whitelist filtering has no selected-row exemption today', () => {
  const input = {
    contents: [{
      playlistPanelRenderer: {
        title: { simpleText: 'YTM watch playlist' },
        contents: [
          playlistPanelVideoRenderer({
            videoId: 'NLDFEkIvcbc',
            title: 'Selected nonmatching YTM row',
            channelName: 'Selected Channel',
            channelId: 'UCfg5XmOVjJ4yoeE0XkqmGAQ',
            handle: '/@selectedchannel',
            selected: true
          }),
          playlistPanelVideoRenderer({
            videoId: '75NRE2KB8jc',
            title: 'Visible allowed YTM sibling',
            channelName: 'Allowed Channel',
            channelId: 'UCm9VWKAFz0aXpuEHPHMae7w',
            handle: '/@allowedchannel'
          })
        ]
      }
    }]
  };

  const output = runEngine(input, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCm9VWKAFz0aXpuEHPHMae7w', handle: '@allowedchannel' }]
  });
  const remaining = output.contents[0].playlistPanelRenderer.contents;

  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].playlistPanelVideoRenderer.videoId, '75NRE2KB8jc');
  assert.equal(remaining[0].playlistPanelVideoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId, 'UCm9VWKAFz0aXpuEHPHMae7w');
});

test('empty whitelist removes JSON playlist rows while DOM selected-row branch would restore selected row', () => {
  const input = {
    contents: [{
      playlistPanelRenderer: {
        title: { simpleText: 'YTM watch playlist' },
        contents: [
          playlistPanelVideoRenderer({
            videoId: 'NLDFEkIvcbc',
            title: 'Selected YTM row',
            channelName: 'Selected Channel',
            channelId: 'UCfg5XmOVjJ4yoeE0XkqmGAQ',
            handle: '/@selectedchannel',
            selected: true
          })
        ]
      }
    }]
  };

  const output = runEngine(input, {
    listMode: 'whitelist',
    whitelistChannels: [],
    whitelistKeywords: []
  });
  const domWhitelist = runSelectedRowBranch({ listMode: 'whitelist' });

  assert.deepEqual(output, {
    contents: [{
      playlistPanelRenderer: {
        title: { simpleText: 'YTM watch playlist' },
        contents: []
      }
    }]
  });
  assert.equal(domWhitelist.shouldHide, false);
});

test('YTM whitelist selected-row future authority symbols are absent and ledgers cite the open gate', () => {
  const runtime = productRuntimeSource();
  const runtimeResults = read(runtimeResultsPath);
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoalAudit = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const obligationIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');

  assert.ok(runtimeResults.includes('tests/runtime/ytm-watch-player-whitelist-selected-row-mode-boundary-current-behavior.test.mjs'));
  assert.match(runtimeResults, /YTM Watch Player Whitelist Selected Row Mode Addendum/);
  assert.match(objectiveLedger, /YTM whitelist selected-row mode boundary addendum/);
  assert.match(activeGoalAudit, /YTM whitelist selected-row mode boundary addendum/);
  assert.match(obligationIndex, /YTM whitelist selected-row mode boundary addendum/);

  for (const token of futureAuthorityTokens) {
    assert.doesNotMatch(runtime, new RegExp(`\\b${token}\\b`), `${token} should not exist in product source yet`);
  }
});
