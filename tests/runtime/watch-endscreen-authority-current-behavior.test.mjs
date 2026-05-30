import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_WATCH_ENDSCREEN_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `Missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function videoRenderer(title, overrides = {}) {
  return {
    videoId: 'abcdefghijk',
    title: { simpleText: title },
    shortBylineText: {
      runs: [{
        text: 'Calm Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC1234567890123456789012',
            canonicalBaseUrl: '/@calmchannel'
          }
        }
      }]
    },
    ...overrides
  };
}

function runEngine(payload, settings, dataName = 'watch-endscreen-fixture') {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, settings, dataName);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('watch end-screen audit documents supported JSON path and remaining DOM gaps', () => {
  const doc = read(auditDocPath);
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const phrase of [
    'direct JSON',
    '`compactAutoplayRenderer` positive and negative cases',
    'real Main watch DOM video-wall cards such as `.ytp-videowall-still`',
    'negative sibling-visible proof',
    'Do not patch this by broadening player DOM hides',
    '2026-05-30 Store-Feedback Linkage',
    'FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md',
    'blocked videos can reappear in the end-screen video',
    'Direct and nested `endScreenVideoRenderer` JSON rows are supported',
    '`compactAutoplayRenderer` still has no direct JSON rule',
    'broad CSS toggle',
    'per-card decision + sibling-visible + no-engagement proof',
    'runtime behavior changed by this continuation: no',
    'flowchart TD'
  ]) {
    assert.ok(doc.includes(phrase), `missing end-screen audit phrase: ${phrase}`);
  }

  assert.ok(runtimeResults.includes('watch-endscreen-authority-current-behavior.test.mjs'));
  assert.ok(convergence.includes('Watch end-screen authority'));
  assert.ok(ledger.includes('Watch end-screen authority addendum'));
});

test('direct nested endScreenVideoRenderer is removed by keyword while nonmatching sibling remains', () => {
  const input = {
    playerOverlays: {
      playerOverlayRenderer: {
        endScreen: {
          watchNextEndScreenRenderer: {
            results: [
              { endScreenVideoRenderer: videoRenderer('spider end screen suggestion') },
              { endScreenVideoRenderer: videoRenderer('calm end screen suggestion') }
            ]
          }
        }
      }
    }
  };

  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.deepEqual(plain(output), {
    playerOverlays: {
      playerOverlayRenderer: {
        endScreen: {
          watchNextEndScreenRenderer: {
            results: [
              { endScreenVideoRenderer: videoRenderer('calm end screen suggestion') }
            ]
          }
        }
      }
    }
  });
});

test('compactAutoplayRenderer still has no direct JSON end-screen rule', () => {
  const logic = read('js/filter_logic.js');
  const directRuleBlock = sliceBetween(logic, 'const FILTER_RULES = {', 'videoWithContextRenderer: {');
  const nestedKnownKeys = sliceBetween(logic, 'const knownKeys = [', '];');
  const input = {
    contents: [{
      compactAutoplayRenderer: videoRenderer('spider autoplay suggestion')
    }]
  };

  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));

  assert.match(directRuleBlock, /endScreenVideoRenderer: BASE_VIDEO_RULES/);
  assert.doesNotMatch(directRuleBlock, /compactAutoplayRenderer/);
  assert.match(nestedKnownKeys, /endScreenVideoRenderer/);
  assert.doesNotMatch(nestedKnownKeys, /compactAutoplayRenderer/);
  assert.deepEqual(plain(output), plain(input));
});

test('player end-screen DOM overlays are not ordinary card selector targets today', () => {
  const extractors = read('js/content/dom_extractors.js');
  const quickBlock = read('js/content/block_channel.js');
  const videoCardSelectors = sliceBetween(extractors, 'const VIDEO_CARD_SELECTORS = [', '].join');
  const quickBlockSelectors = sliceBetween(quickBlock, 'const QUICK_BLOCK_CARD_SELECTORS = [', '].join');

  for (const ordinarySelector of [
    'ytd-compact-video-renderer',
    'ytd-watch-card-compact-video-renderer',
    'ytm-compact-video-renderer',
    'ytk-compact-video-renderer'
  ]) {
    assert.ok(videoCardSelectors.includes(ordinarySelector), `expected VIDEO_CARD selector ${ordinarySelector}`);
    assert.ok(quickBlockSelectors.includes(ordinarySelector), `expected QUICK_BLOCK selector ${ordinarySelector}`);
  }

  for (const playerOverlaySelector of [
    'ytp-videowall-still',
    'ytp-ce-element',
    'ytp-endscreen-content',
    'ytp-fullscreen-grid-stills-container'
  ]) {
    assert.doesNotMatch(videoCardSelectors, new RegExp(escapeRegExp(playerOverlaySelector)));
    assert.doesNotMatch(quickBlockSelectors, new RegExp(escapeRegExp(playerOverlaySelector)));
  }
});

test('end-screen DOM controls are broad feature CSS not per-card filtering authority', () => {
  const dom = read('js/content/dom_fallback.js');
  const styleBlock = sliceBetween(dom, 'if (settings.hideEndscreenVideowall) {', 'if (settings.hideTopHeader) {');
  const productSource = `${dom}\n${read('js/content_bridge.js')}\n${read('js/filter_logic.js')}`;

  assert.match(styleBlock, /#movie_player \.ytp-endscreen-content/);
  assert.match(styleBlock, /#movie_player \.ytp-fullscreen-grid-stills-container/);
  assert.match(styleBlock, /#movie_player \.ytp-ce-element/);
  assert.match(styleBlock, /\.autonav-endscreen/);
  assert.doesNotMatch(styleBlock, /filterKeywords|filterChannels|whitelistKeywords|whitelistChannels|listMode/);
  assert.doesNotMatch(productSource, /watchEndscreenAuthority|playerVideowallCardAuthority|endScreenCardDecision/);
});
