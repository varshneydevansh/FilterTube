import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_PREFETCH_IDENTITY_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const contentBridgePath = 'js/content_bridge.js';

const authoritySymbols = [
  'contentBridgePrefetchIdentityLifecycleContract',
  'contentBridgePrefetchActiveWorkDecision',
  'contentBridgePrefetchObserverBudget',
  'contentBridgePrefetchQueueBudget',
  'contentBridgePrefetchSnapshotEffectReport',
  'contentBridgePrefetchDomStampReport',
  'contentBridgePrefetchMapWriteReport',
  'contentBridgePrefetchWhitelistPendingPolicy',
  'contentBridgePrefetchRoutePausePolicy',
  'contentBridgePrefetchFixtureProvenance',
  'contentBridgePrefetchMetricArtifact'
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

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
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

function sourceBlocks() {
  const source = read(contentBridgePath);
  return {
    source,
    prefetchCluster: sliceBetween(source, '// PREFETCH / HYDRATION QUEUE', 'function stampChannelIdentity(card, info, options = {}) {'),
    schedulePrefetchScan: sliceBetween(source, 'function schedulePrefetchScan() {', '\n}\n\nfunction attachPrefetchObservers'),
    attachPrefetchObservers: sliceBetween(source, 'function attachPrefetchObservers() {', '\n}\n\nfunction startCardPrefetchObserver'),
    startCardPrefetchObserver: sliceBetween(source, 'function startCardPrefetchObserver() {', '\n}\n\nlet playlistPanelPrefetchHookInstalled'),
    installPlaylistPanelPrefetchHook: sliceBetween(source, 'function installPlaylistPanelPrefetchHook() {', '\n}\n\nfunction installRightRailWhitelistObserver'),
    installRightRailWhitelistObserver: sliceBetween(source, 'function installRightRailWhitelistObserver() {', '\n}\n\nfunction queuePrefetchForCard'),
    queuePrefetchForCard: sliceBetween(source, 'function queuePrefetchForCard(card) {', '\n}\n\nfunction drainPrefetchQueue'),
    drainPrefetchQueue: sliceBetween(source, 'function drainPrefetchQueue() {', '\n}\n\nfunction withTimeout'),
    withTimeout: sliceBetween(source, 'function withTimeout(promise, ms) {', '\n}\n\nasync function prefetchIdentityForCard'),
    prefetchIdentityForCard: sliceBetween(source, 'async function prefetchIdentityForCard({ videoId, card }) {', '\n}\n\nfunction stampChannelIdentity'),
    stampAndStaleReset: sliceBetween(source, 'function stampChannelIdentity(card, info, options = {}) {', '\n}\n\nfunction persistVideoChannelMapping')
  };
}

test('content bridge prefetch identity lifecycle audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const source = read(contentBridgePath);

  assert.match(doc, /Status: current-behavior proof with narrow SPA hot-path fixes/);
  assert.match(doc, /Runtime behavior\s+changed only for duplicate right-rail whitelist refresh timer fanout and\s+duplicate\/no-op DOM fallback scheduling after learned identity stamps/);
  assert.match(doc, /not a broad implementation patch, prefetch patch/);
  assert.match(doc, /content bridge prefetch identity lifecycle boundary source files: 1/);
  assert.match(doc, /runtime content bridge prefetch lifecycle fixtures: 6/);
  assert.match(doc, /not completion proof for content bridge prefetch lifecycle authority/);
  assert.match(doc, /Scoped Collaborator Warmup Note - 2026-06-03/);
  assert.match(doc, /single-card collaborator warmup added: yes/);
  assert.match(doc, /no-rule full-card observer wakeup restored: no/);
  assert.match(doc, /quick-block collaborator lookup reliability: IMPROVED_BY_SCOPED_WARMUP/);

  assert.ok(doc.includes(`| \`${contentBridgePath}\` | ${lineCount(source)} | ${Buffer.byteLength(source)} | \`${sha256(contentBridgePath)}\` |`));
});

test('content bridge prefetch identity lifecycle source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['prefetch lifecycle cluster block', blocks.prefetchCluster, 488, 16731],
    ['schedulePrefetchScan block', blocks.schedulePrefetchScan, 19, 518],
    ['attachPrefetchObservers block', blocks.attachPrefetchObservers, 28, 1189],
    ['startCardPrefetchObserver block', blocks.startCardPrefetchObserver, 22, 747],
    ['installPlaylistPanelPrefetchHook block', blocks.installPlaylistPanelPrefetchHook, 43, 1181],
    ['installRightRailWhitelistObserver block', blocks.installRightRailWhitelistObserver, 96, 3087],
    ['queuePrefetchForCard block', blocks.queuePrefetchForCard, 53, 2211],
    ['drainPrefetchQueue block', blocks.drainPrefetchQueue, 10, 368],
    ['withTimeout block', blocks.withTimeout, 5, 156],
    ['prefetchIdentityForCard block', blocks.prefetchIdentityForCard, 91, 4064],
    ['stamp/reset identity block', blocks.stampAndStaleReset, 152, 6771]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.prefetchCluster, 'document.addEventListener('), 5);
  assert.equal(countLiteral(blocks.prefetchCluster, 'new MutationObserver'), 2);
  assert.equal(countLiteral(blocks.prefetchCluster, 'new IntersectionObserver'), 1);
  assert.equal(countLiteral(blocks.prefetchCluster, 'setTimeout('), 3);
  assert.equal(countLiteral(blocks.prefetchCluster, 'requestAnimationFrame('), 1);
  assert.equal(countLiteral(blocks.prefetchCluster, '.disconnect('), 2);
  assert.equal(countLiteral(blocks.prefetchCluster, '.querySelectorAll('), 2);
  assert.equal(countLiteral(blocks.prefetchCluster, '.querySelector('), 3);
  assert.equal(countLiteral(blocks.prefetchCluster, 'persistVideoChannelMapping('), 5);
  assert.equal(countLiteral(blocks.prefetchCluster, 'stampChannelIdentity('), 7);
  assert.equal(countLiteral(blocks.prefetchCluster, 'applyDOMFallback'), 3);

  for (const label of [
    'prefetch lifecycle cluster document.addEventListener callsites: 5',
    'prefetch lifecycle cluster MutationObserver callsites: 2',
    'prefetch lifecycle cluster IntersectionObserver callsites: 1',
    'prefetch lifecycle cluster setTimeout callsites: 3',
    'prefetch lifecycle cluster requestAnimationFrame callsites: 1',
    'prefetch lifecycle cluster disconnect callsites: 2',
    'prefetch lifecycle cluster querySelectorAll callsites: 2',
    'prefetch lifecycle cluster querySelector callsites: 3',
    'prefetch lifecycle cluster persistVideoChannelMapping callsites: 5',
    'prefetch lifecycle cluster stampChannelIdentity callsites: 7',
    'prefetch lifecycle cluster applyDOMFallback mentions: 3'
  ]) {
    assert.ok(doc.includes(label), `missing count label ${label}`);
  }
});

test('card observer boot and attach scanning remain source-pinned', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.schedulePrefetchScan, /if \(prefetchScanScheduled\) return/);
  assert.match(blocks.schedulePrefetchScan, /requestAnimationFrame\(\(\) =>/);
  assert.match(blocks.schedulePrefetchScan, /attachPrefetchObservers\(\)/);

  assert.match(blocks.startCardPrefetchObserver, /if \(prefetchObserver \|\| typeof IntersectionObserver !== 'function'\) return/);
  assert.match(blocks.startCardPrefetchObserver, /prefetchObserver = new IntersectionObserver/);
  assert.match(blocks.startCardPrefetchObserver, /queuePrefetchForCard\(entry\.target\)/);
  assert.match(blocks.startCardPrefetchObserver, /rootMargin: '400px 0px 800px 0px'/);
  assert.match(blocks.startCardPrefetchObserver, /document\.addEventListener\('visibilitychange'/);
  assert.match(blocks.startCardPrefetchObserver, /prefetchPaused = document\.hidden/);
  assert.match(blocks.startCardPrefetchObserver, /if \(!prefetchPaused\) drainPrefetchQueue\(\)/);
  assert.match(blocks.startCardPrefetchObserver, /attachPrefetchObservers\(\)/);
  assert.doesNotMatch(blocks.startCardPrefetchObserver, /\.disconnect\(/);
  assert.doesNotMatch(blocks.startCardPrefetchObserver, /removeEventListener/);

  assert.match(blocks.attachPrefetchObservers, /ytd-playlist-panel-renderer/);
  assert.match(blocks.attachPrefetchObservers, /VIDEO_CARD_SELECTORS/);
  assert.match(blocks.attachPrefetchObservers, /const maxAttach = 120/);
  assert.match(blocks.attachPrefetchObservers, /observedPrefetchCards\.has\(card\)/);
  assert.match(blocks.attachPrefetchObservers, /prefetchObserver\.observe\(card\)/);
});

test('playlist and right-rail hooks install separate lifecycle work before a shared prefetch authority exists', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.installPlaylistPanelPrefetchHook, /playlistPanelPrefetchHookInstalled/);
  assert.match(blocks.installPlaylistPanelPrefetchHook, /document\.addEventListener\('scroll'/);
  assert.match(blocks.installPlaylistPanelPrefetchHook, /target\.closest\('ytd-playlist-panel-renderer'\)/);
  assert.match(blocks.installPlaylistPanelPrefetchHook, /new MutationObserver/);
  assert.match(blocks.installPlaylistPanelPrefetchHook, /observer\.observe\(panel, \{ childList: true, subtree: true \}\)/);
  assert.match(blocks.installPlaylistPanelPrefetchHook, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(blocks.installPlaylistPanelPrefetchHook, /observer\.disconnect\(\)/);

  assert.match(blocks.installRightRailWhitelistObserver, /rightRailWhitelistObserverInstalled/);
  assert.match(blocks.installRightRailWhitelistObserver, /currentSettings\?\.listMode !== 'whitelist'/);
  assert.doesNotMatch(blocks.installRightRailWhitelistObserver, /startsWith\('\/watch'\)/);
  assert.match(blocks.installRightRailWhitelistObserver, /applyDOMFallback\(null, \{ preserveScroll: true, forceReprocess: true \}\)/);
  assert.match(blocks.installRightRailWhitelistObserver, /}, 0\)/);
  assert.match(blocks.installRightRailWhitelistObserver, /}, 120\)/);
  assert.match(blocks.installRightRailWhitelistObserver, /new MutationObserver/);
  assert.match(blocks.installRightRailWhitelistObserver, /observer\.observe\(rail, \{ childList: true, subtree: true \}\)/);
  assert.match(blocks.installRightRailWhitelistObserver, /document\.addEventListener\('yt-navigate-finish'/);
});

test('queue admission, identity hydration, and stamp follow-up keep current JSON/DOM effect split', () => {
  const blocks = sourceBlocks();

  assert.match(blocks.queuePrefetchForCard, /resetCardIdentityIfStale\(card, videoId\)/);
  assert.match(blocks.queuePrefetchForCard, /getValidatedCachedCollaborators\(card\)/);
  assert.match(blocks.queuePrefetchForCard, /card\.removeAttribute\('data-filtertube-channel-id'\)/);
  assert.match(blocks.queuePrefetchForCard, /persistVideoChannelMapping\(videoId, existingId\)/);
  assert.match(blocks.queuePrefetchForCard, /resolveIdFromHandle\(existingHandle\)/);
  assert.match(blocks.queuePrefetchForCard, /prefetchSeen\.has\(key\) && \(Date\.now\(\) - lastSeen\) < 30 \* 1000/);
  assert.match(blocks.queuePrefetchForCard, /if \(prefetchQueue\.length > PREFETCH_MAX_QUEUE\)/);
  assert.match(blocks.queuePrefetchForCard, /drainPrefetchQueue\(\)/);

  assert.match(blocks.drainPrefetchQueue, /if \(prefetchPaused \|\| document\.hidden\) return/);
  assert.match(blocks.drainPrefetchQueue, /while \(prefetchActive < PREFETCH_CONCURRENCY && prefetchQueue\.length > 0\)/);
  assert.match(blocks.withTimeout, /setTimeout\(\(\) => resolve\(null\), ms\)/);

  assert.match(blocks.prefetchIdentityForCard, /youtubekids\.com/);
  assert.match(blocks.prefetchIdentityForCard, /Kids: do NOT prefetch via network/);
  assert.match(blocks.prefetchIdentityForCard, /extractChannelFromCard\(card\)/);
  assert.match(blocks.prefetchIdentityForCard, /searchYtInitialDataForVideoChannel\(videoId, null\)/);
  assert.match(blocks.prefetchIdentityForCard, /browserAPI_BRIDGE\.runtime\.sendMessage/);
  assert.match(blocks.prefetchIdentityForCard, /action: 'updateVideoChannelMap'/);
  assert.match(blocks.prefetchIdentityForCard, /persistVideoChannelMapping\(videoId, ytInfo\.id\)/);
  assert.doesNotMatch(blocks.prefetchIdentityForCard, /\bfetch\(/);

  assert.match(blocks.stampAndStaleReset, /data-filtertube-channel-id/);
  assert.match(blocks.stampAndStaleReset, /function stampChannelIdentity\(card, info, options = \{\}\)/);
  assert.match(blocks.stampAndStaleReset, /let changed = false/);
  assert.match(blocks.stampAndStaleReset, /if \(!changed \|\| options\?\.scheduleFallback === false\) return changed/);
  assert.match(blocks.stampAndStaleReset, /window\.__filtertubeStampFallbackState/);
  assert.match(blocks.stampAndStaleReset, /setTimeout\(\(\) =>/);
  assert.match(blocks.stampAndStaleReset, /applyDOMFallback\(null\)/);
  assert.match(blocks.stampAndStaleReset, /resetCardIdentityIfStale\(card, videoId\)/);
  assert.match(blocks.stampAndStaleReset, /data-filtertube-collaborators/);
  assert.match(blocks.stampAndStaleReset, /data-filtertube-hidden-by-category/);
});

test('content bridge prefetch identity lifecycle authority symbols are not implemented in runtime source yet', () => {
  const doc = read(docPath);
  const product = productRuntimeSource();

  for (const authority of authoritySymbols) {
    assert.ok(doc.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(product, new RegExp(authority), `${authority} should not exist in product runtime source`);
  }
});
