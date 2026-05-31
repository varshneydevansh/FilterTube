import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/content/dom_fallback.js': [4838, 228332, '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef']
};

const blockSpecs = {
  filterLogicCommentRules: {
    file: 'js/filter_logic.js',
    start: '        // Comment threads',
    end: '    };\n\n    // ============================================================================\n    // FILTERING ENGINE',
    lines: 9,
    bytes: 380
  },
  filterLogicNoRuleReturn: {
    file: 'js/filter_logic.js',
    start: '            const rules = FILTER_RULES[rendererType];',
    end: "            const listMode = (this.settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';",
    lines: 9,
    bytes: 411
  },
  filterLogicCommentDecision: {
    file: 'js/filter_logic.js',
    start: '            // Comment filtering',
    end: '            // Content filters',
    lines: 34,
    bytes: 1947
  },
  seedActiveJsonRules: {
    file: 'js/seed.js',
    start: '    function hasActiveJsonFilterRules(settings) {',
    end: '\n    function hasNetworkJsonWork(settings) {',
    lines: 13,
    bytes: 464
  },
  seedCommentContinuationShortcut: {
    file: 'js/seed.js',
    start: '                    // Special handling for comment requests when hideAllComments is enabled',
    end: '                    // Normal processing for non-comment or non-hideAllComments requests',
    lines: 37,
    bytes: 2269
  },
  domCssComments: {
    file: 'js/content/dom_fallback.js',
    start: '    if (settings.hideAllComments) {',
    end: '\n\n    const listMode',
    lines: 16,
    bytes: 671
  },
  domCommentFallbackSetup: {
    file: 'js/content/dom_fallback.js',
    start: 'function handleCommentsFallback(settings) {',
    end: '    try {',
    lines: 12,
    bytes: 877
  },
  domGlobalHide: {
    file: 'js/content/dom_fallback.js',
    start: '    // 1. Global Hide',
    end: '    // 2. Ensure containers are visible when not globally hidden',
    lines: 15,
    bytes: 535
  },
  domViewModelFiltering: {
    file: 'js/content/dom_fallback.js',
    start: '    // 5. Modern YouTube comments use ytd-comment-view-model',
    end: '}\n\nfunction handleGuideSubscriptionsFallback',
    lines: 99,
    bytes: 5312
  }
};

const authoritySymbols = [
  'jsonCommentViewModelParityContract',
  'jsonCommentViewModelRendererRuleReport',
  'jsonCommentViewModelJsonDecisionReport',
  'jsonCommentViewModelContinuationPolicy',
  'jsonCommentViewModelDomParityReport',
  'jsonCommentViewModelGlobalHidePolicy',
  'jsonCommentViewModelKeywordPolicy',
  'jsonCommentViewModelStructuralWrapperReport',
  'jsonCommentViewModelFalseHideLeakBudget',
  'jsonCommentViewModelAuthorityGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function blockMetric(spec) {
  const block = sliceBetween(read(spec.file), spec.start, spec.end);
  return {
    block,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block)
  };
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
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
    filterKeywordsComments: [],
    filterChannels: [],
    whitelistChannels: [],
    whitelistKeywords: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {},
    categoryFilters: {},
    ...overrides
  };
}

function run(payload, overrides = {}) {
  const { engine } = loadFilterTubeEngine();
  return plain(engine.processData(plain(payload), settings(overrides), 'json-comment-view-model-parity-fixture'));
}

function contents(...items) {
  return { contents: items };
}

function commentViewModel(text = 'modern blocked text') {
  return {
    commentViewModel: {
      authorText: { simpleText: 'Modern Author' },
      contentText: { simpleText: text },
      toolbar: {}
    }
  };
}

function commentRenderer(text = 'modern blocked text') {
  return {
    commentRenderer: {
      authorText: { simpleText: 'Classic Author' },
      authorEndpoint: {
        browseEndpoint: {
          browseId: 'UCclassiccomment0000000',
          canonicalBaseUrl: '/@classiccomment'
        }
      },
      contentText: { simpleText: text }
    }
  };
}

function threadWithViewModel(text = 'modern blocked text') {
  return {
    commentThreadRenderer: {
      comment: commentViewModel(text).commentViewModel
    }
  };
}

function continuationResponse(item) {
  return {
    onResponseReceivedEndpoints: [{
      appendContinuationItemsAction: {
        continuationItems: [item]
      }
    }]
  };
}

test('JSON comment ViewModel parity audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: audit-only current-behavior proof slice/);
  assert.match(audit, /Runtime behavior is unchanged/);
  assert.match(audit, /not an implementation patch/);
  assert.match(audit, /JSON comment ViewModel parity boundary source files: 3/);
  assert.match(audit, /JSON comment ViewModel parity source\/effect blocks: 9/);
  assert.match(audit, /runtime JSON comment ViewModel parity fixtures: 10/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('JSON comment ViewModel parity source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count`);
  }

  assert.match(audit, /filter_logic comment rules block lines: 9/);
  assert.match(audit, /filter_logic comment rules block bytes: 380/);
  assert.match(audit, /filter_logic no-rule return block lines: 9/);
  assert.match(audit, /filter_logic no-rule return block bytes: 411/);
  assert.match(audit, /filter_logic comment decision block lines: 34/);
  assert.match(audit, /filter_logic comment decision block bytes: 1947/);
  assert.match(audit, /seed active JSON rules block lines: 13/);
  assert.match(audit, /seed active JSON rules block bytes: 464/);
  assert.match(audit, /seed comment continuation shortcut block lines: 37/);
  assert.match(audit, /seed comment continuation shortcut block bytes: 2269/);
  assert.match(audit, /DOM fallback comments CSS block lines: 16/);
  assert.match(audit, /DOM fallback comments CSS block bytes: 671/);
  assert.match(audit, /DOM fallback comment setup block lines: 12/);
  assert.match(audit, /DOM fallback comment setup block bytes: 877/);
  assert.match(audit, /DOM fallback global hide block lines: 15/);
  assert.match(audit, /DOM fallback global hide block bytes: 535/);
  assert.match(audit, /DOM fallback ViewModel filtering block lines: 99/);
  assert.match(audit, /DOM fallback ViewModel filtering block bytes: 5312/);
});

test('JSON comment ViewModel parity selected token counts remain pinned', () => {
  const audit = doc();
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));

  assert.equal(countLiteral(filterLogic, 'commentViewModel'), 0);
  assert.equal(countLiteral(filterLogic, 'commentRenderer'), 2);
  assert.equal(countLiteral(filterLogic, 'commentThreadRenderer'), 1);
  assert.equal(countLiteral(blocks.seedCommentContinuationShortcut, 'commentViewModel'), 0);
  assert.equal(countLiteral(blocks.seedCommentContinuationShortcut, 'commentRenderer'), 1);
  assert.equal(countLiteral(blocks.seedCommentContinuationShortcut, 'commentThreadRenderer'), 1);
  assert.equal(countLiteral(blocks.seedCommentContinuationShortcut, 'appendContinuationItemsAction'), 2);
  assert.equal(countLiteral(domFallback, 'commentViewModel'), 2);
  assert.equal(countLiteral(blocks.domCssComments, 'ytd-comment-view-model'), 0);
  assert.equal(countLiteral(blocks.domGlobalHide, 'commentViewModels'), 0);
  assert.equal(countLiteral(blocks.domViewModelFiltering, 'ytd-comment-view-model'), 1);
  assert.equal(countLiteral(seed, 'hideAllComments'), 9);
  assert.equal(countLiteral(blocks.seedActiveJsonRules, 'filterKeywordsComments'), 1);

  assert.match(audit, /filter_logic total commentViewModel tokens: 0/);
  assert.match(audit, /filter_logic total commentRenderer tokens: 2/);
  assert.match(audit, /filter_logic total commentThreadRenderer tokens: 1/);
  assert.match(audit, /seed continuation commentViewModel tokens: 0/);
  assert.match(audit, /seed continuation commentRenderer tokens: 1/);
  assert.match(audit, /seed continuation commentThreadRenderer tokens: 1/);
  assert.match(audit, /seed continuation appendContinuationItemsAction tokens: 2/);
  assert.match(audit, /DOM fallback total commentViewModel tokens: 2/);
  assert.match(audit, /DOM fallback comments CSS ytd-comment-view-model tokens: 0/);
  assert.match(audit, /DOM fallback global hide commentViewModels tokens: 0/);
  assert.match(audit, /DOM fallback ViewModel filtering ytd-comment-view-model tokens: 1/);
});

test('JSON comment ViewModel parity missing future symbols remain absent from product runtime', () => {
  const productSource = productRuntimeSource();
  for (const symbol of authoritySymbols) {
    assert.equal(productSource.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.match(doc(), new RegExp(escapeRegex(symbol)));
  }
});

test('direct commentViewModel survives hideAllComments while commentRenderer is removed', () => {
  const modern = run(contents(commentViewModel()), { hideAllComments: true });
  const classic = run(contents(commentRenderer()), { hideAllComments: true });

  assert.equal(modern.contents.length, 1);
  assert.equal(modern.contents[0].commentViewModel.contentText.simpleText, 'modern blocked text');
  assert.equal(classic.contents.length, 0);
});

test('direct commentViewModel survives comments-only keyword while commentRenderer is removed', () => {
  const keyword = /blocked/i;
  const modern = run(contents(commentViewModel()), { filterKeywordsComments: [keyword] });
  const classic = run(contents(commentRenderer()), { filterKeywordsComments: [keyword] });

  assert.equal(modern.contents.length, 1);
  assert.equal(modern.contents[0].commentViewModel.authorText.simpleText, 'Modern Author');
  assert.equal(classic.contents.length, 0);
});

test('direct commentViewModel survives matching global keyword because no renderer rule exists', () => {
  const result = run(contents(commentViewModel()), { filterKeywords: [/blocked/i] });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].commentViewModel.contentText.simpleText, 'modern blocked text');
});

test('commentThreadRenderer wrapping a modern ViewModel survives comment keyword filtering', () => {
  const result = run(contents(threadWithViewModel()), { filterKeywordsComments: [/blocked/i] });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].commentThreadRenderer.comment.contentText.simpleText, 'modern blocked text');
});

test('commentViewModel continuation payload survives hideAllComments while commentRenderer continuation item is removed', () => {
  const modern = run(continuationResponse(commentViewModel()), { hideAllComments: true });
  const classic = run(continuationResponse(commentRenderer()), { hideAllComments: true });

  assert.equal(modern.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems.length, 1);
  assert.equal(
    modern.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[0].commentViewModel.contentText.simpleText,
    'modern blocked text'
  );
  assert.equal(classic.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems.length, 0);
});

test('source order exposes JSON no-rule return before comment decisions and DOM-only ViewModel parity path', () => {
  const filterLogic = read('js/filter_logic.js');
  const seedShortcut = blockMetric(blockSpecs.seedCommentContinuationShortcut).block;
  const commentRules = blockMetric(blockSpecs.filterLogicCommentRules).block;
  const noRule = blockMetric(blockSpecs.filterLogicNoRuleReturn).block;
  const domSetup = blockMetric(blockSpecs.domCommentFallbackSetup).block;
  const domGlobalHide = blockMetric(blockSpecs.domGlobalHide).block;
  const domViewModel = blockMetric(blockSpecs.domViewModelFiltering).block;

  assert.doesNotMatch(commentRules, /commentViewModel/);
  assert.match(noRule, /return false/);
  assert.ok(filterLogic.indexOf('            const rules = FILTER_RULES[rendererType];') < filterLogic.indexOf('            // Comment filtering'));
  assert.doesNotMatch(seedShortcut, /commentViewModel/);
  assert.match(seedShortcut, /commentThreadRenderer \|\| item\?\.commentRenderer/);
  assert.match(domSetup, /ytd-comment-view-model, ytm-comment-view-model/);
  assert.doesNotMatch(domGlobalHide, /commentViewModels/);
  assert.match(domViewModel, /Modern YouTube comments use ytd-comment-view-model/);
  assert.match(doc(), /direct commentViewModel rows survive JSON filtering/);
  assert.match(doc(), /global hideAllComments DOM branch returns before that ViewModel branch/);
});
