import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_MAIN_WORLD_MERGE_MUTATION_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13535, 600459, '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9']
};

const blockSpecs = {
  contentBridgeCollaboratorNameNormalization: {
    file: 'js/content_bridge.js',
    start: 'function normalizeCollaboratorName(name) {',
    end: 'function mergeCollaboratorsWithMainWorld',
    startLine: 5659,
    lines: 10,
    bytes: 293,
    hash: '8946489a721c7d6ec541749d4c3952ba72cb074f1635865b74d8e185eec7a855'
  },
  contentBridgeCollaboratorMainWorldMerge: {
    file: 'js/content_bridge.js',
    start: 'function mergeCollaboratorsWithMainWorld(initialChannelInfo, mainWorldCollaborators) {',
    end: 'async function enrichCollaboratorsWithMainWorld',
    startLine: 5669,
    lines: 142,
    bytes: 5989,
    hash: '2a7f2bf042da245bc39f7190c5518732ffe55935b1a35eb598a2e9f5971e8285'
  },
  contentBridgeCollaboratorMainWorldEnrich: {
    file: 'js/content_bridge.js',
    start: 'async function enrichCollaboratorsWithMainWorld(initialChannelInfo) {',
    end: 'function handleMainWorldMessages',
    startLine: 5811,
    lines: 26,
    bytes: 1235,
    hash: '76d244d6f57ac2b125fdadbbbc5ebddeb9cb7a068cc976dabcdddf41027f3d65'
  },
  contentBridgeMenuCollaboratorEnrichmentHandoff: {
    file: 'js/content_bridge.js',
    start: '    let normalizedMenuInfo = normalizeCollaboratorChannelInfoForCard(initialChannelInfo, videoCard, {',
    end: '    if (initialChannelInfo.isCollaboration && videoId) {',
    startLine: 11074,
    lines: 55,
    bytes: 2880,
    hash: 'e6de2963cd4bae8d1246bf4aa7274c78007df312da0d058287c264823cbba2df'
  }
};

const selectedCounts = {
  normalizeCollaboratorName: 5,
  mergeCollaboratorsWithMainWorld: 2,
  enrichCollaboratorsWithMainWorld: 3,
  allCollaborators: 7,
  mainWorldCollaborators: 12,
  usedIndices: 3,
  tryMatch: 4,
  normalizeUcIdForCollaborator: 5,
  isHandleLikeForCollaborator: 3,
  isUcIdLikeForCollaborator: 3,
  isProbablyNotChannelNameForCollaborator: 2,
  isWeakCollaboratorName: 3,
  normalizeHandleValue: 4,
  needsEnrichment: 2,
  'document.querySelector': 1,
  buildCollaboratorLookupRequestOptions: 1,
  requestCollaboratorInfoFromMainWorld: 1,
  partialCollaborators: 1,
  channelInfo: 3,
  collaboratorEnrichmentPromise: 3,
  normalizeCollaboratorChannelInfoForCard: 2,
  getWatchLikeCollaborationWarmup: 1,
  extractCollaboratorMetadataFromElement: 1,
  sanitizeCollaboratorList: 2,
  expectedCollaboratorCount: 2,
  videoId: 8,
  isCollaboration: 4,
  isYtmWatchLikeCollaboratorCard: 1,
  isDesktopWatchLikeCollaboratorCard: 1
};

const missingRuntimeSymbols = [
  'contentBridgeCollaboratorMainWorldMergeContract',
  'contentBridgeCollaboratorMainWorldMergeDecision',
  'contentBridgeCollaboratorMainWorldMutationReport',
  'contentBridgeCollaboratorMainWorldLookupPolicy',
  'contentBridgeCollaboratorMergePrimaryIdentityPolicy',
  'contentBridgeCollaboratorMergeConflictPolicy',
  'contentBridgeCollaboratorMergeCallerBudget',
  'contentBridgeCollaboratorMergeFixtureProvenance',
  'contentBridgeCollaboratorMergeMetricArtifact',
  'contentBridgeCollaboratorMergeAuthorityGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
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

function selectedSource() {
  return Object.values(blockSpecs).map((spec) => blockMetric(spec).block).join('\n');
}

function executableSource() {
  return [
    blockSpecs.contentBridgeCollaboratorNameNormalization,
    blockSpecs.contentBridgeCollaboratorMainWorldMerge,
    blockSpecs.contentBridgeCollaboratorMainWorldEnrich
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

function ucId(label) {
  return `UC${label.padEnd(22, label).slice(0, 22)}`;
}

function collaborator(name, extras = {}) {
  return {
    name,
    handle: extras.handle || '',
    id: extras.id || '',
    customUrl: extras.customUrl || ''
  };
}

function loadMergeRuntime({ response = [] } = {}) {
  const requests = [];
  const lookupOptions = [];
  const documentQueries = [];
  const sourceCard = { label: 'source-card' };
  const context = {
    __requests: requests,
    __lookupOptions: lookupOptions,
    __documentQueries: documentQueries,
    __sourceCard: sourceCard,
    console: { log() {}, warn() {}, error() {} },
    document: {
      querySelector(selector) {
        documentQueries.push(String(selector));
        return sourceCard;
      }
    },
    JSON,
    Map,
    Set,
    Array,
    Math,
    Number,
    String,
    Boolean,
    RegExp,
    parseInt,
    isNaN
  };
  context.globalThis = context;

  const harness = `
    function normalizeHandleValue(value = '') {
      const cleaned = String(value || '').trim().replace(/^\\/+/, '');
      if (!cleaned) return '';
      return cleaned.startsWith('@') ? cleaned : '@' + cleaned;
    }

    function buildCollaboratorLookupRequestOptions(options = {}) {
      globalThis.__lookupOptions.push({
        hasCard: Boolean(options.card),
        partialCollaborators: JSON.parse(JSON.stringify(options.partialCollaborators || [])),
        channelInfo: JSON.parse(JSON.stringify(options.channelInfo || {}))
      });
      return { expectedNames: ['Alice'], expectedCollaboratorCount: (options.partialCollaborators || []).length };
    }

    async function requestCollaboratorInfoFromMainWorld(videoId, options = {}) {
      globalThis.__requests.push({ videoId, options: JSON.parse(JSON.stringify(options)) });
      return JSON.parse(JSON.stringify(${JSON.stringify(response)}));
    }

    ${executableSource()}

    globalThis.__exports = {
      normalizeCollaboratorName,
      mergeCollaboratorsWithMainWorld,
      enrichCollaboratorsWithMainWorld
    };
  `;

  vm.createContext(context);
  vm.runInContext(harness, context);
  return {
    exports: context.__exports,
    requests,
    lookupOptions,
    documentQueries
  };
}

test('collaborator main-world merge audit is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /not completion proof for collaborator main-world merge authority/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.ok(text.includes(`\`${file}\``), `doc should cite ${file}`);
  }
});

test('collaborator main-world merge source and effect blocks remain pinned', () => {
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

test('collaborator main-world merge token counts remain pinned', () => {
  const text = doc();
  const source = selectedSource();

  for (const [literal, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, literal), expected, `${literal} count changed`);
    assert.match(text, new RegExp(`\\\`${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\` \\\\| ${expected}`));
  }
});

test('collaborator main-world merge missing future symbols remain absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
    assert.ok(text.includes(`\`${symbol}\``), `doc should list missing future symbol ${symbol}`);
  }
});

test('normalizeCollaboratorName lowercases and collapses whitespace', () => {
  const runtime = loadMergeRuntime();

  assert.equal(runtime.exports.normalizeCollaboratorName('  Alice   Bob  '), 'alice bob');
  assert.equal(runtime.exports.normalizeCollaboratorName(''), '');
  assert.equal(runtime.exports.normalizeCollaboratorName(null), '');
});

test('mergeCollaboratorsWithMainWorld mutates collaborators and primary fields on matching names', () => {
  const runtime = loadMergeRuntime();
  const channelInfo = {
    isCollaboration: true,
    allCollaborators: [
      collaborator('Alice'),
      collaborator('Bob')
    ],
    needsEnrichment: true
  };

  runtime.exports.mergeCollaboratorsWithMainWorld(channelInfo, [
    collaborator('Alice', { handle: '@alice', id: ucId('A'), customUrl: 'c/alice' }),
    collaborator('Bob', { handle: '@bob', id: ucId('B') })
  ]);

  assert.deepEqual(plain(channelInfo.allCollaborators), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: 'c/alice' },
    { name: 'Bob', handle: '@bob', id: ucId('B'), customUrl: '' }
  ]);
  assert.equal(channelInfo.handle, '@alice');
  assert.equal(channelInfo.id, ucId('A'));
  assert.equal(channelInfo.name, 'Alice');
  assert.equal(channelInfo.customUrl, 'c/alice');
  assert.equal(channelInfo.needsEnrichment, false);
});

test('mergeCollaboratorsWithMainWorld preserves conflicting existing handle and id values', () => {
  const runtime = loadMergeRuntime();
  const channelInfo = {
    isCollaboration: true,
    allCollaborators: [
      collaborator('Alice', { handle: '@oldalice', id: ucId('OLD') })
    ],
    needsEnrichment: true
  };

  runtime.exports.mergeCollaboratorsWithMainWorld(channelInfo, [
    collaborator('Alice', { handle: '@alice', id: ucId('A'), customUrl: 'c/alice' })
  ]);

  assert.deepEqual(plain(channelInfo.allCollaborators), [
    { name: 'Alice', handle: '@oldalice', id: ucId('OLD'), customUrl: 'c/alice' }
  ]);
  assert.equal(channelInfo.handle, '@oldalice');
  assert.equal(channelInfo.id, ucId('OLD'));
  assert.equal(channelInfo.customUrl, 'c/alice');
  assert.equal(channelInfo.needsEnrichment, false);
});

test('mergeCollaboratorsWithMainWorld replaces weak names when handle match supplies a real name', () => {
  const runtime = loadMergeRuntime();
  const channelInfo = {
    isCollaboration: true,
    allCollaborators: [
      collaborator('@alice', { handle: '@alice' })
    ],
    needsEnrichment: true
  };

  runtime.exports.mergeCollaboratorsWithMainWorld(channelInfo, [
    collaborator('Alice Channel', { handle: '@alice', id: ucId('A') })
  ]);

  assert.deepEqual(plain(channelInfo.allCollaborators), [
    { name: 'Alice Channel', handle: '@alice', id: ucId('A'), customUrl: '' }
  ]);
  assert.equal(channelInfo.name, 'Alice Channel');
  assert.equal(channelInfo.needsEnrichment, false);
});

test('enrichCollaboratorsWithMainWorld is inactive without collaboration identity or video id', async () => {
  const runtime = loadMergeRuntime({ response: [collaborator('Alice', { handle: '@alice' })] });

  assert.equal(await runtime.exports.enrichCollaboratorsWithMainWorld({ isCollaboration: false, videoId: 'VIDEOABC123' }), null);
  assert.equal(await runtime.exports.enrichCollaboratorsWithMainWorld({ isCollaboration: true, videoId: '' }), null);
  assert.deepEqual(runtime.requests, []);
  assert.deepEqual(runtime.lookupOptions, []);
  assert.deepEqual(runtime.documentQueries, []);
});

test('enrichCollaboratorsWithMainWorld queries source card requests main-world data and mutates roster', async () => {
  const runtime = loadMergeRuntime({
    response: [
      collaborator('Alice', { handle: '@alice', id: ucId('A') })
    ]
  });
  const channelInfo = {
    isCollaboration: true,
    videoId: 'VIDEOABC123',
    allCollaborators: [collaborator('Alice')],
    needsEnrichment: true
  };

  const result = await runtime.exports.enrichCollaboratorsWithMainWorld(channelInfo);

  assert.deepEqual(runtime.documentQueries, ['[data-filtertube-video-id="VIDEOABC123"]']);
  assert.deepEqual(plain(runtime.lookupOptions), [{
    hasCard: true,
    partialCollaborators: [{ name: 'Alice', handle: '', id: '', customUrl: '' }],
    channelInfo: {
      isCollaboration: true,
      videoId: 'VIDEOABC123',
      allCollaborators: [{ name: 'Alice', handle: '', id: '', customUrl: '' }],
      needsEnrichment: true
    }
  }]);
  assert.deepEqual(plain(runtime.requests), [{
    videoId: 'VIDEOABC123',
    options: {
      expectedNames: ['Alice'],
      expectedCollaboratorCount: 1
    }
  }]);
  assert.deepEqual(plain(result), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' }
  ]);
  assert.deepEqual(plain(channelInfo.allCollaborators), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' }
  ]);
  assert.equal(channelInfo.needsEnrichment, false);
});

test('collaborator main-world merge audit doc records runtime fixture behavior and open gates', () => {
  const text = doc();

  assert.match(text, /Name normalization lowercases and collapses whitespace/);
  assert.match(text, /Main-world merge mutates DOM-derived collaborator objects in place/);
  assert.match(text, /repairs weak collaborator names/);
  assert.match(text, /preserving conflicting existing handle\/id values/);
  assert.match(text, /copies the first collaborator into the primary `handle`, `id`, `name`, and `customUrl` fields/);
  assert.match(text, /recomputes `needsEnrichment`/);
  assert.match(text, /Main-world enrichment is inactive without collaboration identity or video id/);
  assert.ok(text.includes('queries `[data-filtertube-video-id="..."]`'));
  assert.match(text, /This slice does not close the audit rows/);
  assert.match(text, /collaborator main-world merge contracts/);
  assert.match(text, /mutation reports/);
  assert.match(text, /lookup policies/);
  assert.match(text, /primary identity policies/);
  assert.match(text, /conflict policies/);
  assert.match(text, /first-class collaborator merge gates/);
});
