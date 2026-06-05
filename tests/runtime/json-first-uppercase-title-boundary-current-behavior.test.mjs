import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_UPPERCASE_TITLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstUppercaseTitleContract',
  'jsonFirstUppercaseDecisionReport',
  'jsonFirstUppercaseBoundaryPolicy',
  'jsonFirstUppercaseDomParityReport',
  'jsonFirstUppercaseLocalePolicy',
  'jsonFirstUppercaseRendererScope',
  'jsonFirstUppercaseNoWorkBudget',
  'jsonFirstUppercaseFixtureProvenance',
  'jsonFirstUppercaseMetricArtifact',
  'jsonFirstUppercaseSettingsValidityReport'
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

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function sliceToEnd(text, startNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  return text.slice(start);
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
      uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function uppercaseSettings(uppercase, overrides = {}) {
  return settings({
    ...overrides,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase
    }
  });
}

function run(payload, config, options = {}) {
  const { engine } = loadFilterTubeEngine(options);
  return plain(engine.processData(payload, config, options.dataName || 'uppercase-title-boundary-fixture'));
}

function contents(...items) {
  return { contents: items };
}

function videoRenderer(titleText, videoId = 'UPPER000001', overrides = {}) {
  return {
    videoRenderer: {
      videoId,
      title: { simpleText: titleText },
      shortBylineText: {
        runs: [{
          text: 'Neutral Channel',
          navigationEndpoint: {
            browseEndpoint: {
              browseId: 'UCuppercase000000000000',
              canonicalBaseUrl: '/@uppercase-neutral'
            }
          }
        }]
      },
      ...overrides
    }
  };
}

function channelRenderer(titleText = 'LOUD CHANNEL') {
  return {
    channelRenderer: {
      channelId: 'UCuppercasechannel00000',
      title: { simpleText: titleText },
      navigationEndpoint: {
        browseEndpoint: {
          browseId: 'UCuppercasechannel00000',
          canonicalBaseUrl: '/@uppercase-channel'
        }
      }
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const seed = read('js/seed.js');
  const background = read('js/background.js');

  return {
    filterLogic,
    domFallback,
    seed,
    background,
    processContentDefaults: sliceBetween(
      filterLogic,
      '            const contentFilterDefaults = {',
      '            const categoryFilterDefaults = {'
    ),
    processContentMerge: sliceBetween(
      filterLogic,
      "            const incomingContentFilters = (settings && typeof settings === 'object' && settings.contentFilters",
      '            const incomingCategoryFilters ='
    ),
    checkContent: sliceBetween(
      filterLogic,
      '        _checkContentFilters(item, rules, rendererType) {',
      '\n\n        /**\n         * Check if title contains uppercase words'
    ),
    uppercaseMethod: sliceBetween(
      filterLogic,
      '        _checkUppercaseTitle(title, settings) {',
      '\n\n        /**\n         * Extract comprehensive channel information'
    ),
    seedActiveContent: sliceBetween(
      seed,
      '    function hasEnabledContentFilters(settings) {',
      '    function hasSelectedCategoryFilters(settings) {'
    ),
    domActiveContent: sliceBetween(
      domFallback,
      "        const contentFilters = settings.contentFilters && typeof settings.contentFilters === 'object'",
      '        const categoryFilters = settings.categoryFilters'
    ),
    domLoopContent: sliceBetween(
      domFallback,
      '            const hasEnabledContentFilters = (() => {',
      '            const matchesFilters = shouldHideContent'
    ),
    domShouldHide: sliceToEnd(
      domFallback,
      'function shouldHideContent(title, channel, settings, options = {}) {'
    ),
    bgContentDefault: sliceBetween(
      background,
      '            compiledSettings.contentFilters = profileContentFilters || legacyContentFilters || {',
      '            const profileCategoryFilters ='
    )
  };
}

test('JSON-first uppercase title boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, content-filter patch/);
  assert.match(doc, /uppercase title boundary source files: 4/);
  assert.match(doc, /runtime uppercase-title fixtures: 8/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6803 | 306710 | \`${sha256('js/background.js')}\` |`));
});

test('uppercase title source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic content filter defaults block', blocks.processContentDefaults, 6, 395],
    ['filter_logic content filter merge block', blocks.processContentMerge, 19, 1098],
    ['filter_logic check content filters block', blocks.checkContent, 155, 7747],
    ['filter_logic uppercase-title method block', blocks.uppercaseMethod, 31, 1342],
    ['seed active content-filter predicate block', blocks.seedActiveContent, 12, 393],
    ['DOM fallback active content-filter predicate block', blocks.domActiveContent, 11, 395],
    ['DOM fallback loop content-filter predicate block', blocks.domLoopContent, 18, 906],
    ['DOM fallback shouldHideContent tail block', blocks.domShouldHide, 303, 15752],
    ['background content filter default block', blocks.bgContentDefault, 6, 390]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'uppercase'), 11);
  assert.equal(countLiteral(blocks.filterLogic, '_checkUppercaseTitle'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'contentFilters'), 7);
  assert.equal(countLiteral(blocks.domFallback, 'uppercase'), 2);
  assert.equal(countLiteral(blocks.domFallback, '_checkUppercaseTitle'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'contentFilters'), 18);
  assert.equal(countLiteral(blocks.seed, 'uppercase'), 1);
  assert.equal(countLiteral(blocks.seed, 'contentFilters'), 4);
  assert.equal(countLiteral(blocks.background, 'uppercase'), 1);
  assert.equal(countLiteral(blocks.background, 'contentFilters'), 9);

  assert.match(doc, /filter_logic total uppercase tokens: 11/);
  assert.match(doc, /filter_logic total _checkUppercaseTitle tokens: 2/);
  assert.match(doc, /filter_logic total contentFilters tokens: 7/);
  assert.match(doc, /DOM fallback total uppercase tokens: 2/);
  assert.match(doc, /DOM fallback total _checkUppercaseTitle tokens: 0/);
  assert.match(doc, /DOM fallback total contentFilters tokens: 18/);
  assert.match(doc, /seed total uppercase tokens: 1/);
  assert.match(doc, /seed total contentFilters tokens: 4/);
  assert.match(doc, /background total uppercase tokens: 1/);
  assert.match(doc, /background total contentFilters tokens: 9/);
});

test('single_word mode blocks standalone uppercase ASCII words only', () => {
  const config = uppercaseSettings({ enabled: true, mode: 'single_word', minWordLength: 2 });
  const blocked = contents(videoRenderer('Calm NASA update'));
  const allowed = contents(videoRenderer('Calm nasa update', 'UPPER000002'));

  assert.deepEqual(run(blocked, config), { contents: [] });
  assert.deepEqual(run(allowed, config), plain(allowed));
});

test('single_word mode exposes the ASCII-only uppercase boundary', () => {
  const config = uppercaseSettings({ enabled: true, mode: 'single_word', minWordLength: 2 });
  const nonAscii = contents(videoRenderer('ETE voyage'.replace('ETE', '\u00c9T\u00c9'), 'UPPER000003'));
  const ascii = contents(videoRenderer('AI voyage', 'UPPER000004'));

  assert.deepEqual(run(nonAscii, config), plain(nonAscii));
  assert.deepEqual(run(ascii, config), { contents: [] });
});

test('all_caps mode blocks all-ASCII uppercase titles and allows mixed case', () => {
  const config = uppercaseSettings({ enabled: true, mode: 'all_caps', minWordLength: 2 });
  const blocked = contents(videoRenderer('BREAKING NEWS', 'UPPER000005'));
  const allowed = contents(videoRenderer('Breaking NEWS', 'UPPER000006'));

  assert.deepEqual(run(blocked, config), { contents: [] });
  assert.deepEqual(run(allowed, config), plain(allowed));
});

test('both mode admits either all-caps titles or single uppercase words', () => {
  const config = uppercaseSettings({ enabled: true, mode: 'both', minWordLength: 2 });
  const allCaps = contents(videoRenderer('LOUD TITLE', 'UPPER000007'));
  const singleWord = contents(videoRenderer('Calm LOUD title', 'UPPER000008'));

  assert.deepEqual(run(allCaps, config), { contents: [] });
  assert.deepEqual(run(singleWord, config), { contents: [] });
});

test('minWordLength threshold and zero fallback remain current behavior', () => {
  const minFour = uppercaseSettings({ enabled: true, mode: 'single_word', minWordLength: 4 });
  const zeroFallback = uppercaseSettings({ enabled: true, mode: 'single_word', minWordLength: 0 });
  const shortAllowed = contents(videoRenderer('USA trip', 'UPPER000009'));
  const longBlocked = contents(videoRenderer('NASA trip', 'UPPER000010'));
  const oneLetterAllowed = contents(videoRenderer('A calm guide', 'UPPER000011'));
  const twoLetterBlocked = contents(videoRenderer('AI calm guide', 'UPPER000012'));

  assert.deepEqual(run(shortAllowed, minFour), plain(shortAllowed));
  assert.deepEqual(run(longBlocked, minFour), { contents: [] });
  assert.deepEqual(run(oneLetterAllowed, zeroFallback), plain(oneLetterAllowed));
  assert.deepEqual(run(twoLetterBlocked, zeroFallback), { contents: [] });
});

test('channel-only renderers skip uppercase content filtering', () => {
  const config = uppercaseSettings({ enabled: true, mode: 'single_word', minWordLength: 2 });
  const channelOnly = contents(channelRenderer('LOUD CHANNEL'));

  assert.deepEqual(run(channelOnly, config), plain(channelOnly));
});

test('DOM fallback has uppercase active predicates but no uppercase shouldHideContent branch', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.match(blocks.domActiveContent, /contentFilters\?\.uppercase\?\.enabled === true/);
  assert.match(blocks.domLoopContent, /cf\.uppercase\?\.enabled/);
  assert.equal(countLiteral(blocks.domShouldHide, 'uppercase'), 0);
  assert.match(doc, /DOM fallback has uppercase active predicates but no uppercase enforcement\s+branch/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
