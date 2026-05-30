import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_DIRECT_WATCH_CARD_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md';

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

function channelRun(text = 'Blocked Channel') {
  return {
    text,
    navigationEndpoint: {
      browseEndpoint: {
        browseId: 'UC1234567890123456789012',
        canonicalBaseUrl: '/@blockedchannel'
      }
    }
  };
}

function runEngine(payload, settings, dataName = 'direct-watch-card-fixture') {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, settings, dataName);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('direct watch-card audit documents split wrapper and direct renderer authority', () => {
  const doc = read(auditDocPath);
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const phrase of [
    '`watchCardCompactVideoRenderer` has a direct `BASE_VIDEO_RULES` entry',
    '`universalWatchCardRenderer` has nested paths',
    'Direct `watchCardRichHeaderRenderer` has no direct `FILTER_RULES` entry',
    'Direct `watchCardHeroVideoRenderer` has no direct `FILTER_RULES` entry',
    'Direct `watchCardRHPanelVideoRenderer` has no direct `FILTER_RULES` entry',
    '2026-05-30 Watch Recommendation Topology Linkage',
    '`compactVideoRenderer`, `watchCardCompactVideoRenderer`,',
    '`compactAutoplayRenderer` are not',
    'watchRecommendationRendererAuthority',
    'broad DOM fallback scan cost if JSON confidence is guessed',
    'flowchart TD'
  ]) {
    assert.ok(doc.includes(phrase), `missing direct watch-card audit phrase: ${phrase}`);
  }

  assert.ok(runtimeResults.includes('direct-watch-card-authority-current-behavior.test.mjs'));
  assert.ok(convergence.includes('Direct watch-card authority'));
  assert.ok(ledger.includes('Direct watch-card authority addendum'));
});

test('universalWatchCardRenderer wrapper filters nested rich header but direct rich header passes through', () => {
  const universalInput = {
    contents: [{
      universalWatchCardRenderer: {
        header: {
          watchCardRichHeaderRenderer: {
            title: { simpleText: 'spider watch-card entity' },
            subtitle: { runs: [channelRun()] }
          }
        }
      }
    }]
  };
  const directInput = {
    contents: [{
      watchCardRichHeaderRenderer: {
        title: { simpleText: 'spider watch-card entity' },
        subtitle: { runs: [channelRun()] }
      }
    }]
  };
  const settings = baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC1234567890123456789012', name: 'Blocked Channel', handle: '@blockedchannel' }]
  });

  assert.deepEqual(plain(runEngine(universalInput, settings)), { contents: [] });
  assert.deepEqual(plain(runEngine(directInput, settings)), plain(directInput));
});

test('direct watchCardHeroVideoRenderer and RHS panel video renderer currently pass through matching rules', () => {
  const input = {
    contents: [
      {
        watchCardHeroVideoRenderer: {
          watchEndpoint: { videoId: 'abcdefghijk' },
          callToActionButton: {
            callToActionButtonRenderer: {
              label: { simpleText: 'spider hero watch card' }
            }
          }
        }
      },
      {
        watchCardRHPanelVideoRenderer: {
          videoId: 'lmnopqrstuv',
          title: { simpleText: 'spider rhs panel card' },
          shortBylineText: { runs: [channelRun()] }
        }
      }
    ]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{ id: 'UC1234567890123456789012', name: 'Blocked Channel', handle: '@blockedchannel' }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('direct watch-card subrenderers are documented but not direct FILTER_RULES entries', () => {
  const logic = read('js/filter_logic.js');
  const rulesBlock = sliceBetween(logic, 'const FILTER_RULES = {', 'relatedChipCloudRenderer: {');
  const inventory = read('docs/youtube_renderer_inventory.md');
  const encyclopedia = read('docs/json_paths_encyclopedia.md');

  assert.match(rulesBlock, /watchCardCompactVideoRenderer: BASE_VIDEO_RULES/);
  assert.match(rulesBlock, /universalWatchCardRenderer: \{/);

  for (const renderer of [
    'watchCardRichHeaderRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer'
  ]) {
    assert.doesNotMatch(rulesBlock, new RegExp(`\\n\\s*${renderer}\\s*:`));
  }

  assert.match(inventory, /watchCardHeroVideoRenderer[\s\S]*STILL MISSING/);
  assert.match(inventory, /watchCardRHPanelVideoRenderer[\s\S]*not parsed/);
  assert.match(encyclopedia, /header\.watchCardRichHeaderRenderer\.title/);
});

test('direct watch-card authority contract is absent today', () => {
  const productSource = [
    'js/filter_logic.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js',
    'js/content_bridge.js'
  ].map(read).join('\n');

  assert.doesNotMatch(productSource, /directWatchCardAuthority|watchCardSubrendererAuthority|watchCardRendererAuthority/);
});
