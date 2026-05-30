import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_DIRECT_IDENTITY_FALLBACK_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13571, 601694, '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content/dom_fallback.js': [4838, 228332, '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef']
};

const missingAuthoritySymbols = [
  'contentDirectIdentityFallbackContract',
  'contentDirectIdentityFetchPolicy',
  'contentDirectIdentityUserActionReport',
  'contentDirectIdentityCredentialPolicy',
  'contentDirectIdentityDomRepairBudget',
  'contentDirectIdentityDirectFetchGate',
  'contentDirectIdentityMapWriteReport',
  'contentDirectIdentityRerunBudget',
  'contentDirectIdentityFallbackFixtureProvenance',
  'contentDirectIdentityMetricArtifact'
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

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, startNeedle, endNeedle = null) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = endNeedle == null ? text.length : text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function blockStartLine(source, block) {
  return source.slice(0, source.indexOf(block)).split(/\r?\n/).length;
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

function blocks() {
  const bridge = read('js/content_bridge.js');
  const resolver = read('js/content/handle_resolver.js');
  const dom = read('js/content/dom_fallback.js');

  return {
    bridge,
    resolver,
    dom,
    handleResolverRerunTimer: sliceBetween(
      resolver,
      'let pendingDomFallbackRerunTimer = 0;',
      'async function fetchIdForHandle(handle, options = {}) {'
    ),
    handleResolverFetchIdForHandle: sliceBetween(
      resolver,
      'async function fetchIdForHandle(handle, options = {}) {'
    ),
    handleResolverDirectHandleBranch: sliceBetween(
      resolver,
      '        const encodedHandle = encodeURIComponent(networkHandleCore);',
      '        resolvedHandleCache.delete(cleanHandle);\n    } catch (e) {'
    ),
    contentBridgeShortsWrapper: sliceBetween(
      bridge,
      'async function fetchChannelFromShortsUrl(videoId, requestedHandle = null) {',
      'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {'
    ),
    contentBridgeShortsDirect: sliceBetween(
      bridge,
      'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {',
      '/**\n * Fetch channel information from the /watch?v=ID page'
    ),
    contentBridgeWatchFetchHead: sliceBetween(
      bridge,
      'async function fetchChannelFromWatchUrl(videoId, requestedHandle = null) {',
      '            const decodeEmbeddedUrlValue = (value) => {'
    ),
    clickedTargetDirectFallbackCluster: sliceBetween(
      bridge,
      '            // 2) Background watch resolver fallback. This runs in the extension/background context,',
      '                    // If Shorts only gave us a handle, attempt to resolve UC ID via channelMap.'
    ),
    domFallbackBackgroundOnlyEscalation: sliceBetween(
      dom,
      '            // 2. Active Resolution (Safety net for missing mappings)',
      '                            }\n                        }\n                    }\n                } catch (e) {'
    )
  };
}

test('content direct identity fallback audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, network patch/);
  assert.match(doc, /content direct identity fallback source files: 3/);
  assert.match(doc, /content direct identity fallback source\/effect blocks: 8/);
  assert.match(doc, /runtime direct identity fallback fixtures: 8/);
  assert.match(doc, /not completion proof for content direct identity fallback authority/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      doc,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }

  for (const artifact of [
    'docs/audit/FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('content direct identity fallback source blocks stay pinned', () => {
  const doc = read(docPath);
  const current = blocks();
  const blockSpecs = [
    ['handle resolver rerun timer block', current.handleResolverRerunTimer, current.resolver, 135, 14, 429],
    ['handle resolver fetchIdForHandle block', current.handleResolverFetchIdForHandle, current.resolver, 149, 134, 4787],
    ['handle resolver direct handle branch', current.handleResolverDirectHandleBranch, current.resolver, 231, 45, 1310],
    ['content bridge Shorts wrapper block', current.contentBridgeShortsWrapper, current.bridge, 8634, 69, 2661],
    ['content bridge Shorts direct fetch block', current.contentBridgeShortsDirect, current.bridge, 8703, 124, 6367],
    ['content bridge watch fetch head block', current.contentBridgeWatchFetchHead, current.bridge, 8834, 44, 1789],
    ['clicked-target direct fallback cluster', current.clickedTargetDirectFallbackCluster, current.bridge, 12966, 136, 7498],
    ['DOM fallback background-only escalation block', current.domFallbackBackgroundOnlyEscalation, current.dom, 4755, 50, 3656]
  ];

  for (const [label, block, source, startLine, expectedLines, expectedBytes] of blockSpecs) {
    assert.equal(blockStartLine(source, block), startLine, `${label} start line drifted`);
    assert.equal(lineCount(block), expectedLines, `${label} line count drifted`);
    assert.equal(Buffer.byteLength(block), expectedBytes, `${label} byte count drifted`);
    assert.match(doc, new RegExp(`${escapeRegExp(label)} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${escapeRegExp(label)} bytes: ${expectedBytes}`));
  }
});

test('selected direct identity fallback token counts remain current', () => {
  const doc = read(docPath);
  const current = blocks();
  const selected = [
    current.handleResolverFetchIdForHandle,
    current.contentBridgeShortsWrapper,
    current.contentBridgeShortsDirect,
    current.contentBridgeWatchFetchHead,
    current.clickedTargetDirectFallbackCluster,
    current.domFallbackBackgroundOnlyEscalation
  ].join('\n');

  for (const [label, literal, expected] of [
    ['selected fetch( tokens: 4', 'fetch(', 4],
    ['selected same-origin credential tokens: 3', "credentials: 'same-origin'", 3],
    ['selected allowDirectFetch tokens: 4', 'allowDirectFetch', 4],
    ['selected fetchChannelFromShortsUrlDirect tokens: 2', 'fetchChannelFromShortsUrlDirect', 2],
    ['selected fetchChannelFromWatchUrl tokens: 2', 'fetchChannelFromWatchUrl', 2],
    ['selected fetchIdForHandle tokens: 3', 'fetchIdForHandle', 3],
    ['selected skipNetwork tokens: 3', 'skipNetwork', 3],
    ['selected backgroundOnly tokens: 4', 'backgroundOnly', 4],
    ['selected FilterTube_UpdateChannelMap tokens: 2', 'FilterTube_UpdateChannelMap', 2],
    ['selected pendingShortsFetches tokens: 4', 'pendingShortsFetches', 4],
    ['selected pendingWatchFetches tokens: 2', 'pendingWatchFetches', 2],
    ['selected runtime sendMessage tokens: 2', 'browserAPI_BRIDGE.runtime.sendMessage', 2]
  ]) {
    assert.equal(countLiteral(selected, literal), expected, label);
    assert.ok(doc.includes(label), label);
  }
});

test('handle resolver separates no-network cache lookup, background repair, and direct handle fetch', () => {
  const current = blocks();
  const fetchBlock = current.handleResolverFetchIdForHandle;
  const directBranch = current.handleResolverDirectHandleBranch;
  const rerunTimer = current.handleResolverRerunTimer;

  assert.match(fetchBlock, /const \{ skipNetwork = false, backgroundOnly = false \} = options/);
  assert.match(fetchBlock, /browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\]\)/);
  assert.match(fetchBlock, /if \(skipNetwork && !backgroundOnly\)/);
  assert.match(fetchBlock, /resolvedHandleCache\.delete\(cleanHandle\);\s*return null;/);
  assert.match(fetchBlock, /if \(backgroundOnly\)/);
  assert.match(fetchBlock, /action: 'fetchChannelDetails'/);
  assert.match(fetchBlock, /type: 'FilterTube_UpdateChannelMap'/);
  assert.match(fetchBlock, /scheduleDomFallbackRerun\(\)/);

  assert.match(directBranch, /`\/@\$\{encodedHandle\}\/about`/);
  assert.match(directBranch, /`\/@\$\{encodedHandle\}`/);
  assert.match(directBranch, /fetch\(path, \{/);
  assert.match(directBranch, /credentials: 'same-origin'/);
  assert.match(directBranch, /const text = await response\.text\(\)/);
  assert.match(directBranch, /text\.match\(\/channel\\\/\(UC\[\\w-\]\{22\}\)\/\)/);
  assert.match(directBranch, /type: 'FilterTube_UpdateChannelMap'/);

  assert.match(rerunTimer, /setTimeout\(\(\) => \{/);
  assert.match(rerunTimer, /applyDOMFallback\(currentSettings, \{ forceReprocess: true \}\)/);
  assert.match(rerunTimer, /\}, 250\)/);
});

test('Shorts wrapper uses background first and direct fetch only behind allowDirectFetch', () => {
  const current = blocks();
  const wrapper = current.contentBridgeShortsWrapper;
  const direct = current.contentBridgeShortsDirect;

  assert.match(wrapper, /currentSettings\?\.videoChannelMap\?\.\[videoId\]/);
  assert.match(wrapper, /pendingShortsFetches\.has\(videoId\)/);
  assert.match(wrapper, /action: 'fetchShortsIdentity'/);
  assert.match(wrapper, /expectedHandle: normalizedExpected \|\| ''/);
  assert.match(wrapper, /if \(!allowDirectFetch\) \{\s*return null;\s*\}/);
  assert.match(wrapper, /return await fetchChannelFromShortsUrlDirect\(videoId, requestedHandle, normalizedExpected\)/);

  assert.match(direct, /fetch\(`\/shorts\/\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(direct, /credentials: 'same-origin'/);
  assert.match(direct, /const html = await response\.text\(\)/);
  assert.match(direct, /JSON\.parse\(ytInitialDataMatch\[1\]\)/);
  assert.match(direct, /extractChannelFromInitialData\(ytInitialData/);
  assert.match(direct, /Could not extract channel info from shorts page directly/);
});

test('watch fallback fetch head is same-origin, pending-deduped, and skipped on Kids hosts', () => {
  const { contentBridgeWatchFetchHead: block } = blocks();

  assert.match(block, /hostname \|\| ''\)\.includes\('youtubekids\.com'\)/);
  assert.match(block, /return null/);
  assert.match(block, /pendingWatchFetches\.has\(videoId\)/);
  assert.match(block, /return await pendingWatchFetches\.get\(videoId\)/);
  assert.match(block, /fetch\(`\/watch\?v=\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(block, /credentials: 'same-origin'/);
  assert.match(block, /const html = await response\.text\(\)/);
});

test('clicked-target fallback tries background watch before direct watch and allows direct Shorts only for selected retry', () => {
  const { clickedTargetDirectFallbackCluster: block, bridge } = blocks();

  assert.match(block, /Background watch resolver fallback/);
  assert.match(block, /const retryInput = `watch:\$\{String\(channelInfo\.videoId\)\.trim\(\)\}`/);
  assert.match(block, /result = await addChannelDirectly\(/);
  assert.match(block, /usedBackgroundWatchResolver = true/);
  assert.match(block, /Legacy content-script network fallback/);
  assert.match(block, /if \(!result\.success && channelInfo\.videoId && !usedBackgroundWatchResolver\)/);
  assert.match(block, /const watchInfo = await fetchChannelFromWatchUrl\(channelInfo\.videoId, expectedHandle\)/);
  assert.match(block, /const fallbackInfo = await fetchChannelFromShortsUrl\(channelInfo\.videoId, expectedHandle, \{ allowDirectFetch: true \}\)/);

  assert.ok(
    bridge.indexOf('Background watch resolver fallback') < bridge.indexOf('Legacy content-script network fallback'),
    'background watch resolver should precede legacy direct watch fallback'
  );
  assert.ok(
    bridge.indexOf('Legacy content-script network fallback') < bridge.indexOf('Final fallback: Shorts-specific helper'),
    'legacy direct watch fallback should precede final Shorts helper'
  );
});

test('post-action fanout and DOM unresolved repair preserve their current fetch-class guardrails', () => {
  const current = blocks();

  assert.match(
    current.bridge,
    /fetchChannelFromShortsUrl\(videoId, null, \{ allowDirectFetch: false \}\)/
  );
  assert.match(current.domFallbackBackgroundOnlyEscalation, /now - lastAttemptTs < 10 \* 60 \* 1000/);
  assert.match(current.domFallbackBackgroundOnlyEscalation, /if \(attempts\.size > 500\)/);
  assert.match(
    current.domFallbackBackgroundOnlyEscalation,
    /fetchIdForHandle\(`@\$\{safeKey\}`, \{ skipNetwork: true, backgroundOnly: true \}\)/
  );
  assert.doesNotMatch(current.domFallbackBackgroundOnlyEscalation, /allowDirectFetch: true/);
});

test('content direct identity fallback future authority symbols are absent from product runtime source', () => {
  const source = productRuntimeSource();
  const doc = read(docPath);

  for (const symbol of missingAuthoritySymbols) {
    assert.doesNotMatch(source, new RegExp(symbol), `${symbol} should not exist in product runtime source yet`);
    assert.ok(doc.includes(symbol), `doc should list missing symbol ${symbol}`);
  }
});
