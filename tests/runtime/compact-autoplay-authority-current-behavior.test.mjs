import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md';

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

function compactAutoplayRenderer(overrides = {}) {
  return {
    videoId: 'abcdefghijk',
    title: { simpleText: 'spider autoplay suggestion' },
    lengthText: { simpleText: '45:00' },
    shortBylineText: {
      runs: [{
        text: 'Blocked Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UC1234567890123456789012',
            canonicalBaseUrl: '/@blockedchannel'
          }
        }
      }]
    },
    ...overrides
  };
}

function runEngine(payload, settings, dataName = 'compact-autoplay-fixture') {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, settings, dataName);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('compact autoplay audit documents current unsupported renderer verdict', () => {
  const doc = read(auditDocPath);
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const phrase of [
    '`compactAutoplayRenderer` is not covered by direct JSON filtering today',
    'it is not in `FILTER_RULES`',
    'it is not in the nested known-key unwrap list',
    'it is not in the category-filter video renderer allowlist',
    'it has no committed extracted capture fixture',
    '2026-05-30 Watch Recommendation Topology Linkage',
    'watch recommendation',
    'Direct `watchCardRichHeaderRenderer`, `watchCardHeroVideoRenderer`, and',
    'watchRecommendationRendererAuthority',
    'No JSON-first optimization or DOM fallback pruning from page-level confidence',
    'flowchart TD'
  ]) {
    assert.ok(doc.includes(phrase), `missing compact autoplay audit phrase: ${phrase}`);
  }

  assert.ok(runtimeResults.includes('compact-autoplay-authority-current-behavior.test.mjs'));
  assert.ok(convergence.includes('Compact autoplay authority'));
  assert.ok(ledger.includes('Compact autoplay authority addendum'));
});

test('compactAutoplayRenderer keyword and channel rules currently pass through', () => {
  const input = {
    contents: [{
      compactAutoplayRenderer: compactAutoplayRenderer()
    }]
  };
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterChannels: [{
      id: 'UC1234567890123456789012',
      name: 'Blocked Channel',
      handle: '@blockedchannel'
    }]
  }));

  assert.deepEqual(plain(output), plain(input));
});

test('compactAutoplayRenderer content and category rules currently skip because renderer type is not allowlisted', () => {
  const logic = read('js/filter_logic.js');
  const categoryAllowlist = sliceBetween(logic, 'const isVideoRenderer = [', '].includes(rendererType);');
  const contentAllowlist = sliceBetween(
    logic,
    "this._log('[FilterTube] contentFilters is null/undefined, skipping');",
    'if (!isVideoRenderer) return false;'
  );
  const input = {
    contents: [{
      compactAutoplayRenderer: compactAutoplayRenderer({
        title: { simpleText: 'LOUD AUTOPLAY SUGGESTION' }
      })
    }]
  };
  const output = runEngine(input, baseSettings({
    categoryFilters: { enabled: true, mode: 'block', selected: ['gaming'] },
    contentFilters: {
      duration: { enabled: true, condition: 'longer', minMinutes: 10, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: true }
    }
  }));

  assert.doesNotMatch(categoryAllowlist, /compactAutoplayRenderer/);
  assert.doesNotMatch(contentAllowlist, /compactAutoplayRenderer/);
  assert.deepEqual(plain(output), plain(input));
});

test('compactAutoplayRenderer is documented as an inventory gap but has no committed capture fixture', () => {
  const inventory = read('docs/youtube_renderer_inventory.md');
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const fixtureNames = fs.readdirSync(path.join(repoRoot, 'tests/runtime/fixtures/captures'));

  assert.match(inventory, /\| `compactAutoplayRenderer` \| .*Missing/);
  assert.match(inventory, /\| `compactAutoplayRenderer` \| .*STILL MISSING/);
  assert.match(traceability, /capture_traceability_main_next_compact_autoplay_renderer/);
  assert.equal(fixtureNames.some(name => /compact-autoplay/i.test(name)), false);
});

test('compactAutoplayRenderer lacks the future authority contract today', () => {
  const productSource = [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js'
  ].map(read).join('\n');

  assert.doesNotMatch(productSource, /compactAutoplayAuthority|watchEndscreenAuthority|compactAutoplayRenderer: BASE_VIDEO_RULES/);
});
