import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/content/dom_fallback.js': [4838, 228332, '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef']
};

const blockSpecs = {
  filterLogicWhitelistContainers: {
    file: 'js/filter_logic.js',
    start: '    const WHITELIST_CONTAINER_RENDERERS = new Set([',
    end: '    // Comprehensive filter rules',
    lines: 10,
    bytes: 267
  },
  filterLogicCommentRules: {
    file: 'js/filter_logic.js',
    start: '        // Comment threads',
    end: '    };\n\n    // ============================================================================\n    // FILTERING ENGINE',
    lines: 9,
    bytes: 380
  },
  filterLogicCommentDecision: {
    file: 'js/filter_logic.js',
    start: '            // Comment filtering',
    end: '            // Content filters',
    lines: 34,
    bytes: 1947
  },
  filterLogicArrayRecursion: {
    file: 'js/filter_logic.js',
    start: '            // Handle arrays',
    end: '            // Handle objects - check if this object should be filtered',
    lines: 12,
    bytes: 404
  },
  filterLogicObjectRendererRemoval: {
    file: 'js/filter_logic.js',
    start: '            // Handle objects - check if this object should be filtered',
    end: '            // Recursively process all properties',
    lines: 11,
    bytes: 536
  },
  filterLogicRecursivePropertyCopy: {
    file: 'js/filter_logic.js',
    start: '            // Recursively process all properties',
    end: '            return result;',
    lines: 9,
    bytes: 347
  },
  seedEngineCatch: {
    file: 'js/seed.js',
    start: '                // Fall back to basic processing',
    end: '        } else {',
    lines: 5,
    bytes: 220
  },
  seedBasicCommentHide: {
    file: 'js/seed.js',
    start: '            // Basic comment hiding',
    end: '            \n            if (modified)',
    lines: 28,
    bytes: 1574
  },
  domCssComments: {
    file: 'js/content/dom_fallback.js',
    start: '    if (settings.hideAllComments) {',
    end: '\n\n    const listMode',
    lines: 16,
    bytes: 671
  },
  domGlobalHide: {
    file: 'js/content/dom_fallback.js',
    start: '    // 1. Global Hide',
    end: '    // 2. Ensure containers are visible when not globally hidden',
    lines: 15,
    bytes: 535
  }
};

const authoritySymbols = [
  'jsonCommentStructuralCleanupContract',
  'jsonCommentStructuralWrapperDecisionReport',
  'jsonCommentEmptyWrapperPruningPolicy',
  'jsonCommentSectionSiblingPolicy',
  'jsonCommentContinuationWrapperCleanupReport',
  'jsonCommentSeedFallbackParityReport',
  'jsonCommentDomStructuralParityReport',
  'jsonCommentStructuralFalseHideLeakBudget',
  'jsonCommentStructuralFixtureProvenance',
  'jsonCommentStructuralAuthorityGate'
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

function runEngine(payload, overrides = {}) {
  const { engine } = loadFilterTubeEngine();
  return plain(engine.processData(plain(payload), settings(overrides), 'json-comment-structural-wrapper-cleanup-fixture'));
}

function commentRenderer(id = 'Ugw-structural-comment', text = 'blocked comment text') {
  return {
    commentRenderer: {
      commentId: id,
      authorText: { simpleText: 'Structural Author' },
      authorEndpoint: {
        browseEndpoint: {
          browseId: 'UCstructuralcomment000',
          canonicalBaseUrl: '/@structuralcomment'
        }
      },
      contentText: { simpleText: text }
    }
  };
}

function commentThreadRenderer(id = 'Ugw-structural-thread', text = 'blocked comment text') {
  return {
    commentThreadRenderer: {
      comment: commentRenderer(id, text).commentRenderer
    }
  };
}

function videoRenderer() {
  return {
    videoRenderer: {
      videoId: 'abcdefghijk',
      title: { simpleText: 'Sibling video' },
      shortBylineText: { runs: [{ text: 'Sibling Channel' }] }
    }
  };
}

function itemSection(contents, sectionIdentifier = 'comment-item-section') {
  return {
    itemSectionRenderer: {
      sectionIdentifier,
      contents
    }
  };
}

function continuationPayload(items) {
  return {
    onResponseReceivedEndpoints: [{
      appendContinuationItemsAction: {
        continuationItems: items
      }
    }]
  };
}

function watchPayload() {
  return {
    contents: {
      twoColumnWatchNextResults: {
        results: {
          results: {
            contents: [
              videoRenderer(),
              itemSection([commentThreadRenderer('Ugw-seed-fallback')])
            ]
          }
        }
      }
    }
  };
}

test('JSON comment structural wrapper cleanup audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: audit-only current-behavior proof slice/);
  assert.match(audit, /Runtime behavior is unchanged/);
  assert.match(audit, /not an implementation patch/);
  assert.match(audit, /JSON comment structural wrapper cleanup boundary source files: 3/);
  assert.match(audit, /JSON comment structural wrapper cleanup source\/effect blocks: 10/);
  assert.match(audit, /runtime JSON comment structural wrapper cleanup fixtures: 11/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('JSON comment structural wrapper cleanup source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count`);
  }

  assert.match(audit, /filter_logic whitelist containers block lines: 10/);
  assert.match(audit, /filter_logic whitelist containers block bytes: 267/);
  assert.match(audit, /filter_logic comment rules block lines: 9/);
  assert.match(audit, /filter_logic comment rules block bytes: 380/);
  assert.match(audit, /filter_logic comment decision block lines: 34/);
  assert.match(audit, /filter_logic comment decision block bytes: 1947/);
  assert.match(audit, /filter_logic array recursion block lines: 12/);
  assert.match(audit, /filter_logic array recursion block bytes: 404/);
  assert.match(audit, /filter_logic object renderer removal block lines: 11/);
  assert.match(audit, /filter_logic object renderer removal block bytes: 536/);
  assert.match(audit, /filter_logic recursive property copy block lines: 9/);
  assert.match(audit, /filter_logic recursive property copy block bytes: 347/);
  assert.match(audit, /seed engine catch block lines: 5/);
  assert.match(audit, /seed engine catch block bytes: 220/);
  assert.match(audit, /seed basic comment hide block lines: 28/);
  assert.match(audit, /seed basic comment hide block bytes: 1574/);
  assert.match(audit, /DOM fallback comments CSS block lines: 16/);
  assert.match(audit, /DOM fallback comments CSS block bytes: 671/);
  assert.match(audit, /DOM fallback global hide block lines: 15/);
  assert.match(audit, /DOM fallback global hide block bytes: 535/);
});

test('JSON comment structural wrapper cleanup selected token counts remain pinned', () => {
  const audit = doc();
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));

  assert.equal(countLiteral(blocks.filterLogicWhitelistContainers, 'itemSectionRenderer'), 1);
  assert.equal(countLiteral(blocks.filterLogicCommentRules, 'commentRenderer'), 2);
  assert.equal(countLiteral(blocks.filterLogicCommentRules, 'commentThreadRenderer'), 1);
  assert.equal(countLiteral(blocks.filterLogicCommentDecision, 'hideAllComments'), 2);
  assert.equal(countLiteral(blocks.filterLogicArrayRecursion, 'item !== null'), 1);
  assert.equal(countLiteral(blocks.filterLogicArrayRecursion, 'return filtered'), 1);
  assert.equal(countLiteral(blocks.filterLogicObjectRendererRemoval, 'return null'), 1);
  assert.equal(countLiteral(blocks.filterLogicRecursivePropertyCopy, 'filteredValue !== null'), 1);
  assert.equal(countLiteral(blocks.filterLogicRecursivePropertyCopy, 'result[key]'), 1);
  assert.equal(countLiteral(blocks.seedBasicCommentHide, 'itemSectionRenderer'), 1);
  assert.equal(countLiteral(blocks.seedBasicCommentHide, 'comment-item-section'), 1);
  assert.equal(countLiteral(blocks.seedBasicCommentHide, 'splice'), 2);
  assert.equal(countLiteral(blocks.domCssComments, 'comment-item-section'), 1);
  assert.equal(countLiteral(blocks.domGlobalHide, 'commentContainers'), 1);

  assert.match(audit, /filter_logic whitelist containers itemSectionRenderer tokens: 1/);
  assert.match(audit, /filter_logic comment rules commentRenderer tokens: 2/);
  assert.match(audit, /filter_logic comment rules commentThreadRenderer tokens: 1/);
  assert.match(audit, /filter_logic comment decision hideAllComments tokens: 2/);
  assert.match(audit, /filter_logic array recursion item-not-null tokens: 1/);
  assert.match(audit, /filter_logic array recursion return-filtered tokens: 1/);
  assert.match(audit, /filter_logic object renderer removal return-null tokens: 1/);
  assert.match(audit, /filter_logic recursive property copy filteredValue-not-null tokens: 1/);
  assert.match(audit, /filter_logic recursive property copy result-key tokens: 1/);
  assert.match(audit, /seed basic comment hide itemSectionRenderer tokens: 1/);
  assert.match(audit, /seed basic comment hide comment-item-section tokens: 1/);
  assert.match(audit, /seed basic comment hide splice tokens: 2/);
  assert.match(audit, /DOM fallback comments CSS comment-item-section tokens: 1/);
  assert.match(audit, /DOM fallback global hide commentContainers tokens: 1/);
});

test('JSON comment structural wrapper cleanup missing future symbols remain absent from product runtime', () => {
  const productSource = productRuntimeSource();
  for (const symbol of authoritySymbols) {
    assert.equal(productSource.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.match(doc(), new RegExp(escapeRegex(symbol)));
  }
});

test('hideAllComments leaves an empty itemSectionRenderer comment wrapper after removing nested comments', () => {
  const result = runEngine({ contents: [itemSection([commentThreadRenderer()])] }, { hideAllComments: true });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].itemSectionRenderer.sectionIdentifier, 'comment-item-section');
  assert.deepEqual(result.contents[0].itemSectionRenderer.contents, []);
});

test('hideAllComments preserves structural wrappers when non-comment siblings remain', () => {
  const result = runEngine({ contents: [itemSection([commentThreadRenderer(), videoRenderer()])] }, { hideAllComments: true });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].itemSectionRenderer.sectionIdentifier, 'comment-item-section');
  assert.equal(result.contents[0].itemSectionRenderer.contents.length, 1);
  assert.equal(result.contents[0].itemSectionRenderer.contents[0].videoRenderer.videoId, 'abcdefghijk');

  const generic = runEngine({ contents: [itemSection([commentThreadRenderer()], 'not-comments')] }, { hideAllComments: true });
  assert.equal(generic.contents[0].itemSectionRenderer.sectionIdentifier, 'not-comments');
  assert.deepEqual(generic.contents[0].itemSectionRenderer.contents, []);
});

test('comment keyword removal can leave parent itemSectionRenderer wrapper empty', () => {
  const result = runEngine({ contents: [itemSection([commentRenderer()])] }, { filterKeywordsComments: [/blocked/i] });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].itemSectionRenderer.sectionIdentifier, 'comment-item-section');
  assert.deepEqual(result.contents[0].itemSectionRenderer.contents, []);
});

test('commentThreadRenderer with raw comment fields survives comments-only keyword filtering', () => {
  const result = runEngine({ contents: [itemSection([commentThreadRenderer('Ugw-raw-thread', 'blocked keyword survives')])] }, {
    filterKeywordsComments: [/blocked keyword/i]
  });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].itemSectionRenderer.contents.length, 1);
  assert.equal(
    result.contents[0].itemSectionRenderer.contents[0].commentThreadRenderer.comment.contentText.simpleText,
    'blocked keyword survives'
  );
});

test('engine continuation filtering can leave append action wrappers with empty continuationItems', () => {
  const result = runEngine(continuationPayload([commentRenderer()]), { hideAllComments: true });

  assert.equal(result.onResponseReceivedEndpoints.length, 1);
  assert.deepEqual(result.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems, []);
  assert.equal(
    result.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[0]?.continuationItemRenderer,
    undefined
  );
});

test('seed engine-error fallback splices whole watch comment section while preserving video sibling', async () => {
  const instance = loadSeedRuntime({
    pathname: '/watch',
    payload: watchPayload(),
    processData() {
      throw new Error('forced engine failure');
    }
  });
  instance.window.filterTube.updateSettings(settings({ hideAllComments: true }));

  const response = await instance.window.fetch('https://www.youtube.com/youtubei/v1/player');
  const body = await response.json();
  const contents = body.contents.twoColumnWatchNextResults.results.results.contents;

  assert.equal(instance.calls.processData.length, 1);
  assert.equal(contents.length, 1);
  assert.equal(contents[0].videoRenderer.videoId, 'abcdefghijk');
  assert.equal(JSON.stringify(body).includes('comment-item-section'), false);
});

test('source order exposes renderer removal before property copy and DOM selector-only structural parity', () => {
  const filterLogic = read('js/filter_logic.js');
  const objectRemoval = blockMetric(blockSpecs.filterLogicObjectRendererRemoval).block;
  const propertyCopy = blockMetric(blockSpecs.filterLogicRecursivePropertyCopy).block;
  const seedBasic = blockMetric(blockSpecs.seedBasicCommentHide).block;
  const domCss = blockMetric(blockSpecs.domCssComments).block;
  const domGlobal = blockMetric(blockSpecs.domGlobalHide).block;

  assert.ok(filterLogic.indexOf('// Handle objects - check if this object should be filtered') < filterLogic.indexOf('// Recursively process all properties'));
  assert.match(objectRemoval, /return null; \/\/ Remove this entire object/);
  assert.match(propertyCopy, /if \(filteredValue !== null\)/);
  assert.match(propertyCopy, /result\[key\] = filteredValue/);
  assert.match(seedBasic, /sectionIdentifier === 'comment-item-section'/);
  assert.match(seedBasic, /contents\.splice\(i, 1\)/);
  assert.match(domCss, /ytd-item-section-renderer\[section-identifier="comment-item-section"\]/);
  assert.match(domGlobal, /commentContainers\.forEach/);
  assert.match(doc(), /comment section\s+wrappers and continuation action wrappers can remain after nested comments are\s+removed/);
  assert.match(doc(), /DOM\s+fallback hides comment containers through selectors instead of sharing the JSON\s+cleanup decision/);
});
