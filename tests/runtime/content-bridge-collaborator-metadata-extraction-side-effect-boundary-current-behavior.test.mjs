import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_METADATA_EXTRACTION_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const ytmShowSheetFixturePath = 'tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json';
const ytmShowSheetParityDocPath = 'docs/audit/FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d']
};

const blockSpecs = {
  contentBridgeCollaboratorRendererExtraction: {
    file: 'js/content_bridge.js',
    start: 'function extractCollaboratorMetadataFromRenderer(rendererCandidate) {',
    end: 'function hydrateCollaboratorsFromRendererData(card) {',
    startLine: 3997,
    lines: 242,
    bytes: 12604,
    hash: 'df004ea8458332cd2fff4ace0cbc1aca35482ea30a25e2c7bf99f5677f9e611c'
  },
  contentBridgeCollaboratorRendererCandidateInventory: {
    file: 'js/content_bridge.js',
    start: 'function hydrateCollaboratorsFromRendererData(card) {',
    end: 'function extractCollaboratorMetadataFromElement(element) {',
    startLine: 4239,
    lines: 45,
    bytes: 1996,
    hash: 'd67d5803951da2b28f7481ffc82bccfa67e9e08b6796139d142a399c411e4525'
  },
  contentBridgeCollaboratorElementExtraction: {
    file: 'js/content_bridge.js',
    start: 'function extractCollaboratorMetadataFromElement(element) {',
    end: 'function isYtmWatchLikeCollaboratorCard(videoCard) {',
    startLine: 4284,
    lines: 506,
    bytes: 26157,
    hash: 'ff81401178fa408d1cbaf8211908efb7d98c60e2a5553a3b9f5b4a248fc7d994'
  },
  contentBridgeCollaboratorElementCacheAndEnrichHelper: {
    file: 'js/content_bridge.js',
    start: '    function cacheResultAndMaybeEnrich({',
    end: '    // Method 1: Check for #attributed-channel-name',
    startLine: 4422,
    lines: 84,
    bytes: 3699,
    hash: '6dc65cd11eda7432f0c7808001e26b24df20a7fd3a0aa24894993f999087eeb6'
  },
  contentBridgeCollaboratorElementYtmBylineBranch: {
    file: 'js/content_bridge.js',
    start: '    // Method 3b: YTM watch queue / compact rows often only expose a collapsed byline like',
    end: '    // Method 4: Avatar stack detection / enrichment',
    startLine: 4659,
    lines: 90,
    bytes: 5530,
    hash: 'e082452a22613a8c8fa8d32ecfa3a364de8085839db0e300d6f20511d821ab08'
  }
};

const selectedCounts = {
  extractCollaboratorMetadataFromRenderer: 2,
  hydrateCollaboratorsFromRendererData: 2,
  extractCollaboratorMetadataFromElement: 1,
  hasMixRendererDataSignal: 4,
  showSheetCommand: 15,
  showDialogCommand: 12,
  panelLoadingStrategy: 24,
  listViewModel: 18,
  radioRenderer: 4,
  compactRadioRenderer: 4,
  WeakSet: 1,
  'depth > 10': 1,
  'slice(0, 25)': 1,
  'card.data': 13,
  'card.__data': 15,
  getRendererDataCandidatesForElement: 1,
  ensureVideoIdForCard: 10,
  'data-filtertube-video-id': 4,
  setAttribute: 8,
  getValidatedCachedCollaborators: 1,
  sanitizeCollaboratorList: 2,
  'data-filtertube-collaborators': 4,
  'data-filtertube-collaborators-source': 1,
  'data-filtertube-collaborators-ts': 1,
  'data-filtertube-expected-collaborators': 6,
  applyResolvedCollaborators: 2,
  requestCollaboratorEnrichment: 1,
  resolvedCollaboratorsByVideoId: 2,
  getCachedCollaboratorsFromCard: 1,
  getCollaboratorListQuality: 4,
  resolveExpectedCollaboratorCount: 4,
  parseCollaboratorNames: 6,
  countDistinctChannelLinks: 4,
  hasCollaboratorSeparatorEvidence: 2,
  querySelector: 10,
  querySelectorAll: 2,
  'yt-avatar-stack-view-model': 2,
  extractCollaboratorsFromAvatarStackElement: 1,
  requiresDialogExtraction: 11,
  partialCollaboratorsForEnrichment: 3,
  'currentSettings?.videoChannelMap': 2,
  'currentSettings?.channelMap': 2,
  isDesktopWatchPlaylistPanelCard: 1,
  isYtmWatchLikeCollaboratorCard: 1,
  isDesktopWatchLikeCollaboratorCard: 1,
  extractYtmBylineText: 1,
  extractDesktopWatchPlaylistBylineText: 1,
  getDesktopLockupMetadataRows: 1
};

const missingRuntimeSymbols = [
  'contentBridgeCollaboratorMetadataExtractionContract',
  'contentBridgeCollaboratorMetadataExtractionDecision',
  'contentBridgeCollaboratorExtractionSideEffectReport',
  'contentBridgeCollaboratorPureReadMode',
  'contentBridgeCollaboratorRendererJsonPathPolicy',
  'contentBridgeCollaboratorDomSelectorPolicy',
  'contentBridgeCollaboratorEnrichmentOptInPolicy',
  'contentBridgeCollaboratorExtractionFixtureProvenance',
  'contentBridgeCollaboratorExtractionMetricArtifact',
  'contentBridgeCollaboratorExtractionAuthorityGate',
  'contentBridgeShowSheetCapturedFixtureParityReport',
  'contentBridgeShowSheetFilterAuthorityBoundary',
  'contentBridgeShowSheetSideEffectBudget'
];

const ytmShowSheetCollaborators = [
  {
    name: 'shakiraVEVO',
    handle: '@shakiraVEVO',
    id: 'UCGnjeahCJW1AF34HBmQTJ-Q',
    customUrl: ''
  },
  {
    name: 'Spotify',
    handle: '@spotify',
    id: 'UCYLNGLIzMhRTi6ZOLjAPSmw',
    customUrl: ''
  },
  {
    name: 'Beele',
    handle: '@beele',
    id: 'UCRMqQWxCWE0VMvtUElm-rEA',
    customUrl: ''
  }
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function loadYtmShowSheetFixture() {
  return JSON.parse(read(ytmShowSheetFixturePath));
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256Text(block),
    block
  };
}

function topLevelExtractionSource() {
  return [
    blockSpecs.contentBridgeCollaboratorRendererExtraction,
    blockSpecs.contentBridgeCollaboratorRendererCandidateInventory,
    blockSpecs.contentBridgeCollaboratorElementExtraction
  ].map((spec) => blockMetric(spec).block).join('\n');
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

class FakeNode {
  constructor({ textContent = '', attrs = {}, children = {}, all = {}, data = null, tagName = 'YTD-RICH-ITEM-RENDERER', closestMap = {} } = {}) {
    this.textContent = textContent;
    this.attrs = new Map(Object.entries(attrs).map(([key, value]) => [key, String(value)]));
    this.children = children;
    this.all = all;
    this.data = data;
    this.__data = null;
    this.tagName = tagName;
    this.closestMap = closestMap;
    this.writes = [];
    this.queries = [];
    this.card = this;
    this.isConnected = true;
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
    this.writes.push([name, String(value)]);
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  querySelector(selector) {
    const key = String(selector || '');
    this.queries.push(key);
    return this.children[key] || null;
  }

  querySelectorAll(selector) {
    const key = String(selector || '');
    this.queries.push(key);
    return this.all[key] || [];
  }

  closest(selector) {
    return this.closestMap[String(selector || '')] || null;
  }

  matches(selector) {
    return String(selector || '').split(',').map((item) => item.trim().toLowerCase()).includes(String(this.tagName || '').toLowerCase());
  }
}

function ucId(label) {
  return `UC${label.padEnd(22, label).slice(0, 22)}`;
}

function collaboratorSheetCommand(items) {
  return {
    panelLoadingStrategy: {
      inlineContent: {
        sheetViewModel: {
          header: {
            title: {
              simpleText: 'Collaborators'
            }
          },
          content: {
            listViewModel: {
              listItems: items.map((item) => ({
                listItemViewModel: {
                  title: { content: item.name },
                  subtitle: { content: item.handle || '' },
                  rendererContext: {
                    commandContext: {
                      onTap: {
                        innertubeCommand: {
                          browseEndpoint: {
                            canonicalBaseUrl: item.canonicalBaseUrl || item.handle || '',
                            browseId: item.id || ''
                          }
                        }
                      }
                    }
                  }
                }
              }))
            }
          }
        }
      }
    }
  };
}

function loadExtractionRuntime() {
  const bridge = read('js/content_bridge.js');
  const source = topLevelExtractionSource();
  const applyCalls = [];
  const enrichmentCalls = [];
  const context = {
    __applyCalls: applyCalls,
    __enrichmentCalls: enrichmentCalls,
    console: { log() {}, warn() {}, error() {} },
    JSON,
    Map,
    Set,
    WeakSet,
    Array,
    Math,
    Number,
    String,
    Boolean,
    RegExp,
    parseInt,
    isNaN,
    decodeURIComponent,
    Date: {
      now() {
        return 1700000000000;
      }
    }
  };
  context.globalThis = context;

  const harness = `
    const resolvedCollaboratorsByVideoId = new Map();
    const currentSettings = { videoChannelMap: {}, channelMap: {} };

    function hasMixRendererDataSignal(candidate) {
      return Boolean(candidate?.isMix || candidate?.radioRenderer || candidate?.compactRadioRenderer);
    }

    function isMixCardElement(element) {
      return Boolean(element?.isMixCard);
    }

    function textFromRendererTextLike(value) {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value.content === 'string') return value.content;
      if (typeof value.simpleText === 'string') return value.simpleText;
      if (Array.isArray(value.runs)) return value.runs.map(run => run?.text || '').join('').trim();
      return '';
    }

    function normalizeHandleValue(value) {
      if (!value || typeof value !== 'string') return '';
      const extracted = value.trim().replace(/^\\/+/, '');
      if (!extracted) return '';
      return extracted.startsWith('@') ? extracted : '@' + extracted;
    }

    function extractRawHandle(value) {
      const match = String(value || '').match(/@([A-Za-z0-9._-]+)/);
      return match ? '@' + match[1] : '';
    }

    function extractHandleFromString(value) {
      return extractRawHandle(value);
    }

    function extractChannelIdFromString(value) {
      const match = String(value || '').match(/UC[\\w-]{22}/);
      return match ? match[0] : '';
    }

    function findVideoCardElement(element) {
      return element?.card || element || null;
    }

    function ensureVideoIdForCard(card) {
      return card?.videoId || card?.getAttribute?.('data-filtertube-video-id') || 'VIDEOID1234A';
    }

    function getRendererDataCandidatesForElement(element) {
      return Array.isArray(element?.rendererCandidates) ? element.rendererCandidates : [];
    }

    function sanitizeCollaboratorList(collaborators = []) {
      if (!Array.isArray(collaborators)) return [];
      const seen = new Set();
      const out = [];
      for (const collab of collaborators) {
        if (!collab || typeof collab !== 'object') continue;
        const normalized = {
          name: String(collab.name || '').trim(),
          handle: normalizeHandleValue(collab.handle || ''),
          id: String(collab.id || '').trim(),
          customUrl: String(collab.customUrl || '').trim()
        };
        if (!normalized.name && !normalized.handle && !normalized.id && !normalized.customUrl) continue;
        const key = (normalized.id || normalized.handle || normalized.customUrl || normalized.name).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(normalized);
      }
      return out;
    }

    function resolveExpectedCollaboratorCount(rawCollaborators, sanitizedCollaborators, ...hints) {
      const rawLength = Array.isArray(rawCollaborators) ? rawCollaborators.length : 0;
      const sanitizedLength = Array.isArray(sanitizedCollaborators) ? sanitizedCollaborators.length : 0;
      const numeric = hints.map(value => parseInt(value || '0', 10) || 0);
      return Math.max(rawLength, sanitizedLength, ...numeric);
    }

    function getValidatedCachedCollaborators() {
      return [];
    }

    function getCachedCollaboratorsFromCard(card) {
      const raw = card?.getAttribute?.('data-filtertube-collaborators') || '';
      if (!raw) return [];
      try {
        return sanitizeCollaboratorList(JSON.parse(raw));
      } catch (_) {
        return [];
      }
    }

    function getCollaboratorListQuality(list = []) {
      return sanitizeCollaboratorList(list).reduce((score, collab) => {
        return score + 1 + (collab.handle ? 3 : 0) + (collab.id ? 5 : 0) + (collab.customUrl ? 2 : 0);
      }, 0);
    }

    function applyResolvedCollaborators(videoId, collaborators, options = {}) {
      globalThis.__applyCalls.push({
        videoId,
        collaborators: JSON.parse(JSON.stringify(sanitizeCollaboratorList(collaborators))),
        options: {
          expectedCount: options.expectedCount || 0,
          sourceLabel: options.sourceLabel || '',
          hasSourceCard: Boolean(options.sourceCard)
        }
      });
      return true;
    }

    function requestCollaboratorEnrichment(element, videoId, partialCollaborators = []) {
      globalThis.__enrichmentCalls.push({
        videoId,
        partialCollaborators: JSON.parse(JSON.stringify(sanitizeCollaboratorList(partialCollaborators))),
        attrs: {
          expected: element?.getAttribute?.('data-filtertube-expected-collaborators') || ''
        }
      });
    }

    function parseCollaboratorNames(rawText = '', options = {}) {
      if (!rawText || typeof rawText !== 'string') {
        return { names: [], hasHiddenCollaborators: false, hiddenCount: 0 };
      }
      const normalized = rawText.replace(/\\s+/g, ' ').trim();
      const hiddenMatches = normalized.match(/\\b(\\d+)\\s+more\\b/gi) || [];
      let hiddenCount = 0;
      for (const item of hiddenMatches) {
        const count = item.match(/(\\d+)\\s+more/i);
        hiddenCount += count ? parseInt(count[1], 10) : 1;
      }
      const baseText = hiddenMatches.length > 0
        ? normalized.replace(/\\s*(?:,|&|\\band\\b)\\s+\\d+\\s+more\\b.*$/i, '').trim()
        : normalized;
      const names = options?.allowSeparatorSplit
        ? baseText.split(/\\s*(?:,|\\band\\b)\\s*/i).map(item => item.trim()).filter(Boolean)
        : (baseText ? [baseText] : []);
      return { names, hasHiddenCollaborators: hiddenMatches.length > 0, hiddenCount };
    }

    function hasAttributedCollaboratorSignal(node) {
      return Boolean(node?.collabSignal);
    }

    function countDistinctChannelLinks(node) {
      return node?.distinctLinks || 0;
    }

    function hasCollaboratorSeparatorEvidence(card, rawText = '') {
      const text = String(rawText || '').replace(/\\s+/g, ' ').trim();
      if (/\\band\\s+\\d+\\s+more\\b/i.test(text) || /\\b\\d+\\s+more\\b/i.test(text)) return true;
      if (card?.querySelector?.('yt-avatar-stack-view-model')) return true;
      if (hasAttributedCollaboratorSignal(card?.querySelector?.('#attributed-channel-name, [id="attributed-channel-name"]'))) return true;
      return countDistinctChannelLinks(card) >= 2;
    }

    function isDesktopWatchPlaylistPanelCard() {
      return false;
    }

    function extractDesktopWatchPlaylistBylineText() {
      return '';
    }

    function getDesktopLockupMetadataRows(card) {
      return Array.isArray(card?.lockupRows) ? card.lockupRows : [];
    }

    function normalizeMetadataRowText(value = '') {
      return String(value || '').replace(/\\s+/g, ' ').trim();
    }

    function isStatsMetadataRowText(value = '') {
      return /view|ago/i.test(String(value || ''));
    }

    function isDesktopWatchLikeCollaboratorCard(card) {
      return Boolean(card?.isDesktopWatchLike);
    }

    function isYtmWatchLikeCollaboratorCard(card) {
      return String(card?.tagName || '').toLowerCase().startsWith('ytm-');
    }

    function normalizeLooseChannelLabel(value = '') {
      return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    function extractYtmBylineText(card) {
      return card?.ytmBylineText || '';
    }

    function extractCollaboratorsFromAvatarStackElement() {
      return [];
    }

    function mergeCollaboratorLists(left = [], right = []) {
      return sanitizeCollaboratorList([...left, ...right]);
    }

    ${source}

    globalThis.__exports = {
      extractCollaboratorMetadataFromRenderer,
      hydrateCollaboratorsFromRendererData,
      extractCollaboratorMetadataFromElement,
      resolvedCollaboratorsByVideoId
    };
  `;

  vm.createContext(context);
  vm.runInContext(harness, context);
  return {
    exports: context.__exports,
    applyCalls,
    enrichmentCalls,
    bridge
  };
}

test('collaborator metadata extraction audit is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /not completion proof for collaborator extraction authority/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.ok(text.includes(`\`${file}\``), `doc should cite ${file}`);
  }
});

test('collaborator metadata extraction source and effect blocks remain pinned', () => {
  const text = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line changed`);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
    assert.equal(metric.hash, spec.hash, `${name} hash changed`);
    assert.ok(text.includes(String(spec.lines)), `doc should include line count for ${name}`);
    assert.ok(text.includes(String(spec.bytes)), `doc should include byte count for ${name}`);
    assert.ok(text.includes(spec.hash), `doc should include hash for ${name}`);
  }
});

test('collaborator metadata extraction token counts remain pinned', () => {
  const text = doc();
  const selectedSource = topLevelExtractionSource();

  for (const [literal, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(selectedSource, literal), expected, `${literal} count changed`);
    assert.match(text, new RegExp(`\\\`${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\` \\\\| ${expected}`));
  }
});

test('collaborator metadata extraction missing future symbols remain absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
    assert.ok(text.includes(`\`${symbol}\``), `doc should list missing future symbol ${symbol}`);
  }
});

test('renderer collaborator extraction rejects mix renderer data before parsing collaborator commands', () => {
  const runtime = loadExtractionRuntime();
  const result = runtime.exports.extractCollaboratorMetadataFromRenderer({
    isMix: true,
    shortBylineText: {
      runs: [{
        navigationEndpoint: {
          showSheetCommand: collaboratorSheetCommand([{ name: 'Alice', handle: '/@alice', id: ucId('A') }])
        }
      }]
    }
  });

  assert.deepEqual(plain(result), []);
});

test('renderer collaborator extraction can recover collaborators from bounded deep sheet JSON', () => {
  const runtime = loadExtractionRuntime();
  const result = runtime.exports.extractCollaboratorMetadataFromRenderer({
    content: {
      videoRenderer: {
        metadata: {
          nested: {
            showSheetCommand: collaboratorSheetCommand([
              { name: 'Alice', handle: '/@alice', id: ucId('A') },
              { name: 'Bob', handle: '/@bob', id: ucId('B') }
            ])
          }
        }
      }
    }
  });

  assert.deepEqual(plain(result), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' },
    { name: 'Bob', handle: '@bob', id: ucId('B'), customUrl: '' }
  ]);
});

test('element extraction stamps ids caches renderer collaborators and applies resolved collaborators twice', () => {
  const runtime = loadExtractionRuntime();
  const wrapper = new FakeNode({ tagName: 'YTD-RICH-ITEM-RENDERER' });
  const card = new FakeNode({
    tagName: 'YTD-VIDEO-RENDERER',
    closestMap: {
      'ytd-rich-item-renderer': wrapper
    },
    data: {
      content: {
        videoRenderer: {
          shortBylineText: {
            runs: [{
              navigationEndpoint: {
                showSheetCommand: collaboratorSheetCommand([
                  { name: 'Alice', handle: '/@alice', id: ucId('A') },
                  { name: 'Bob', handle: '/@bob', id: ucId('B') }
                ])
              }
            }]
          }
        }
      }
    }
  });
  card.videoId = 'VIDEOID1234A';

  const result = runtime.exports.extractCollaboratorMetadataFromElement(card);

  assert.equal(card.getAttribute('data-filtertube-video-id'), 'VIDEOID1234A');
  assert.equal(wrapper.getAttribute('data-filtertube-video-id'), 'VIDEOID1234A');
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), 'lockup');
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), '1700000000000');
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), '2');
  assert.deepEqual(JSON.parse(card.getAttribute('data-filtertube-collaborators')), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' },
    { name: 'Bob', handle: '@bob', id: ucId('B'), customUrl: '' }
  ]);
  assert.deepEqual(plain(result), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' },
    { name: 'Bob', handle: '@bob', id: ucId('B'), customUrl: '' }
  ]);
  assert.equal(runtime.applyCalls.length, 2);
  assert.equal(runtime.applyCalls[0].options.sourceLabel, 'lockup');
  assert.equal(runtime.applyCalls[0].options.hasSourceCard, true);
  assert.equal(runtime.applyCalls[1].options.hasSourceCard, true);
  assert.deepEqual(runtime.enrichmentCalls, []);
});

test('captured YTM showSheet renderer falls back to partial bridge enrichment and remains outside filter authority', () => {
  const fixture = loadYtmShowSheetFixture();
  const runtime = loadExtractionRuntime();
  const direct = runtime.exports.extractCollaboratorMetadataFromRenderer(plain(fixture.renderer));

  assert.deepEqual(plain(direct), []);

  const wrapper = new FakeNode({ tagName: 'YTD-RICH-ITEM-RENDERER' });
  const card = new FakeNode({
    tagName: 'YTM-MUSIC-RESPONSIVE-LIST-ITEM-RENDERER',
    closestMap: {
      'ytd-rich-item-renderer': wrapper
    },
    data: {
      content: {
        videoWithContextRenderer: plain(fixture.renderer)
      }
    }
  });
  card.videoId = fixture.renderer.videoId;
  card.ytmBylineText = fixture.renderer.shortBylineText.runs[0].text;

  const result = runtime.exports.extractCollaboratorMetadataFromElement(card);
  const partialCollaborators = [{ name: 'Shakira', handle: '', id: '', customUrl: '' }];

  assert.equal(fixture.renderer.videoId, 'capture-show-sheet-collab');
  assert.deepEqual(plain(result), partialCollaborators);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'capture-show-sheet-collab');
  assert.equal(wrapper.getAttribute('data-filtertube-video-id'), 'capture-show-sheet-collab');
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), null);
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), '3');
  assert.deepEqual(JSON.parse(card.getAttribute('data-filtertube-collaborators')), partialCollaborators);
  assert.equal(runtime.exports.resolvedCollaboratorsByVideoId.has('capture-show-sheet-collab'), false);
  assert.equal(runtime.applyCalls.length, 0);
  assert.deepEqual(plain(runtime.enrichmentCalls), [{
    videoId: 'capture-show-sheet-collab',
    partialCollaborators,
    attrs: {
      expected: '3'
    }
  }]);

  const filterLogic = read('js/filter_logic.js');
  const parityDoc = read(ytmShowSheetParityDocPath);
  assert.equal(countLiteral(filterLogic, 'showSheetCommand'), 0);
  assert.match(parityDoc, /Blocklist leak/);
  assert.match(parityDoc, /Whitelist false-hide/);
  assert.deepEqual(ytmShowSheetCollaborators.map((collaborator) => collaborator.name), ['shakiraVEVO', 'Spotify', 'Beele']);
  assert.match(doc(), /captured `YTM-XHR\.json` showSheet roster does not hydrate/);
});

test('element extraction can request enrichment from hidden collaborator DOM text', () => {
  const runtime = loadExtractionRuntime();
  const attributed = new FakeNode({ textContent: 'Alice and 2 more' });
  attributed.collabSignal = true;
  const card = new FakeNode({
    tagName: 'YTD-VIDEO-RENDERER',
    children: {
      '#attributed-channel-name, [id="attributed-channel-name"]': attributed
    }
  });
  card.videoId = 'VIDEOID1234A';

  const result = runtime.exports.extractCollaboratorMetadataFromElement(card);

  assert.deepEqual(plain(result), [
    { name: 'Alice', handle: '', id: '', customUrl: '' }
  ]);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'VIDEOID1234A');
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), '3');
  assert.deepEqual(JSON.parse(card.getAttribute('data-filtertube-collaborators')), [
    { name: 'Alice', handle: '', id: '', customUrl: '' }
  ]);
  assert.equal(runtime.applyCalls.length, 0);
  assert.deepEqual(plain(runtime.enrichmentCalls), [{
    videoId: 'VIDEOID1234A',
    partialCollaborators: [{ name: 'Alice', handle: '', id: '', customUrl: '' }],
    attrs: { expected: '3' }
  }]);
});

test('element extraction avoids splitting a plain single-channel name that contains and without avatar stack', () => {
  const runtime = loadExtractionRuntime();
  const channelName = new FakeNode({ textContent: 'The Institute of Art and Ideas' });
  const card = new FakeNode({
    tagName: 'YTD-VIDEO-RENDERER',
    children: {
      '#channel-name, ytd-channel-name, .ytd-channel-name': channelName
    }
  });
  card.videoId = 'VIDEOID1234A';

  const result = runtime.exports.extractCollaboratorMetadataFromElement(card);

  assert.deepEqual(plain(result), []);
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(runtime.applyCalls.length, 0);
  assert.equal(runtime.enrichmentCalls.length, 0);

  const topicRow = new FakeNode({ textContent: 'Kully B & Gussy G - Topic' });
  const topicCard = new FakeNode({
    tagName: 'YT-LOCKUP-VIEW-MODEL'
  });
  topicCard.videoId = 'TOPICVID001';
  topicCard.isDesktopWatchLike = true;
  topicCard.lockupRows = [topicRow];

  const topicResult = runtime.exports.extractCollaboratorMetadataFromElement(topicCard);

  assert.deepEqual(plain(topicResult), []);
  assert.equal(topicCard.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(topicCard.getAttribute('data-filtertube-expected-collaborators'), null);
  assert.equal(runtime.applyCalls.length, 0);
  assert.equal(runtime.enrichmentCalls.length, 0);
});

test('collaborator metadata extraction audit doc records runtime fixture behavior and open gates', () => {
  const text = doc();

  assert.match(text, /Renderer JSON extraction rejects Mix renderer signals before collaborator parsing/);
  assert.match(text, /Renderer JSON extraction can recover collaborators from a bounded deep scan/);
  assert.match(text, /Element extraction can stamp `data-filtertube-video-id` on the card and rich-item wrapper/);
  assert.match(text, /Renderer-derived collaborators are cached to `data-filtertube-collaborators`/);
  assert.match(text, /Renderer-derived collaborators can call `applyResolvedCollaborators\(\)` in the direct renderer branch and again through the cache\/enrich helper/);
  assert.match(text, /DOM byline extraction with hidden collaborator text can cache partial collaborators, set an expected count, and call `requestCollaboratorEnrichment\(\)`/);
  assert.match(text, /A generic single-channel name that contains `and` still returns early without collaborator mode/);
  assert.match(text, /Ampersand-only music Topic lockup text such as `Kully B & Gussy G - Topic` does not write `data-filtertube-collaborators`/);
  assert.match(text, /This slice does not close the audit rows/);
  assert.match(text, /pure-read extraction/);
  assert.match(text, /side-effect budgets/);
  assert.match(text, /renderer JSON path policy/);
  assert.match(text, /DOM selector policy/);
  assert.match(text, /enrichment opt-in policy/);
  assert.match(text, /first-class collaborator extraction gates/);
});
