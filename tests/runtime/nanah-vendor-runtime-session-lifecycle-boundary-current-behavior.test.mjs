import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NANAH_VENDOR_RUNTIME_SESSION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const nanahPath = 'js/vendor/nanah.bundle.js';
const tabViewPath = 'js/tab-view.js';
const adapterPath = 'js/nanah_sync_adapter.js';
const tabHtmlPath = 'html/tab-view.html';

const sourceRows = [
  [nanahPath, 876, 27692, '11c43c120c58ed4de81d2b1d341efd488d1bd6792d49ce5fdc9220aacf6e07ca'],
  [tabViewPath, 11617, 526763, '1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7'],
  [adapterPath, 433, 17072, '8094261e6fb9fa72a86e6e79e8614bf18b93134f54dcca7327114b5410447824'],
  [tabHtmlPath, 1577, 133585, 'e33ef1e0d1f2c3d607cb58c3275137df54c1c82ed06cf5cd03c053690fedb0b6'],
];

const blockRows = [
  ['transport class', nanahPath, 'var WebRtcDataChannelTransport = class', 1, 489, 381, 12964],
  ['transport host', nanahPath, '    async host(session, hooks)', 1, 511, 18, 665],
  ['transport join', nanahPath, '    async join(session, hooks)', 1, 529, 21, 714],
  ['transport send', nanahPath, '    async send(envelope)', 1, 550, 11, 480],
  ['transport close', nanahPath, '    async close()', 2, 561, 17, 351],
  ['connectSocket', nanahPath, '    async connectSocket()', 1, 584, 18, 820],
  ['createPeerConnection', nanahPath, '    createPeerConnection()', 1, 602, 30, 919],
  ['attachDataChannel', nanahPath, '    attachDataChannel(channel)', 1, 632, 16, 524],
  ['sendSerializedPayload', nanahPath, '    sendSerializedPayload(serialized)', 1, 648, 23, 883],
  ['handleSocketMessage', nanahPath, '    async handleSocketMessage(raw)', 1, 671, 45, 1521],
  ['applySignalPayload', nanahPath, '    async applySignalPayload(payload)', 1, 729, 71, 2505],
  ['tryHandleChunkFrame', nanahPath, '    tryHandleChunkFrame(serialized)', 1, 825, 25, 1033],
  ['handleEncryptedEnvelope', nanahPath, '    async handleEncryptedEnvelope(serialized)', 1, 850, 13, 446],
  ['maybeEmitReadyState', nanahPath, '    maybeEmitReadyState()', 1, 863, 6, 176],
  ['createNanahClient', tabViewPath, '    async function createNanahClient()', 1, 8159, 73, 2958],
  ['buildNanahPairUri', tabViewPath, '    function buildNanahPairUri(code)', 1, 6302, 14, 648],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath(file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function extractBlock(file, marker, occurrence = 1) {
  const text = read(file);
  let from = 0;
  let start = -1;
  for (let index = 0; index < occurrence; index += 1) {
    start = text.indexOf(marker, from);
    assert.notEqual(start, -1, `${file} missing ${marker}`);
    from = start + marker.length;
  }
  const brace = text.indexOf('{', start);
  assert.notEqual(brace, -1, `${file} missing block brace for ${marker}`);
  let depth = 0;
  let end = -1;
  for (let index = brace; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }
  assert.notEqual(end, -1, `${file} missing block end for ${marker}`);
  const block = text.slice(start, end);
  return {
    line: lineOf(text, start),
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    text: block
  };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Nanah vendor runtime session lifecycle doc is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime, build, package, sync,\s+dashboard, and native behavior are unchanged/);
  assert.match(text, /codebase inspection for reliability, leak,\s+performance, cross-feature, and first-class JSON filter blockers/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /Nanah is not a YouTube JSON filtering engine today/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceRows) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(fs.statSync(filePath(file)).size, expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('Nanah vendor runtime session lifecycle pins transport and dashboard blocks', () => {
  const text = doc();

  for (const [label, file, marker, occurrence, line, lines, bytes] of blockRows) {
    const block = extractBlock(file, marker, occurrence);
    assert.equal(block.line, line, `${label} line drifted`);
    assert.equal(block.lines, lines, `${label} line count drifted`);
    assert.equal(block.bytes, bytes, `${label} byte count drifted`);
    assert.match(text, new RegExp(`${escapeRegExp(label)}(?: block)? line[s]?: ${line}|${escapeRegExp(label)} line: ${line}`));
    assert.match(text, new RegExp(`${escapeRegExp(label)}(?: block)? lines: ${lines}`));
    assert.match(text, new RegExp(`${escapeRegExp(label)}(?: block)? bytes: ${bytes}`));
  }

  const createClient = extractBlock(tabViewPath, '    async function createNanahClient()').text;
  const buildPairUri = extractBlock(tabViewPath, '    function buildNanahPairUri(code)').text;
  assert.equal(countLiteral(createClient, 'client.on('), 7);
  assert.equal(countLiteral(createClient, 'new NanahApi.WebRtcDataChannelTransport'), 1);
  assert.equal(countLiteral(buildPairUri, 'NanahApi.DEFAULT_NANAH_SIGNALING_URL'), 0);
});

test('Nanah vendor runtime session lifecycle records listener crypto and chunking primitives', () => {
  const text = doc();
  const nanah = read(nanahPath);

  for (const [label, token, expected] of [
    ['WebSocket tokens', 'WebSocket', 2],
    ['RTCPeerConnection tokens', 'RTCPeerConnection', 1],
    ['createDataChannel tokens', 'createDataChannel', 1],
    ['ondatachannel tokens', 'ondatachannel', 1],
    ['onicecandidate tokens', 'onicecandidate', 1],
    ['onconnectionstatechange tokens', 'onconnectionstatechange', 1],
    ['addEventListener tokens', 'addEventListener', 8],
    ['removeEventListener tokens', 'removeEventListener', 0],
    ['setTimeout tokens', 'setTimeout', 0],
    ['setInterval tokens', 'setInterval', 0],
    ['clearTimeout tokens', 'clearTimeout', 0],
    ['dataChannel?.close tokens', 'dataChannel?.close', 1],
    ['peerConnection?.close tokens', 'peerConnection?.close', 1],
    ['socket?.close tokens', 'socket?.close', 1],
    ['crypto.subtle tokens', 'crypto.subtle', 18],
    ['getRandomValues tokens', 'getRandomValues', 6],
    ['randomUUID tokens', 'randomUUID', 6],
    ['AES-GCM tokens', 'AES-GCM', 6],
    ['HKDF tokens', 'HKDF', 6],
    ['ECDH tokens', 'ECDH', 7],
    ['JSON.parse tokens', 'JSON.parse', 4],
    ['JSON.stringify tokens', 'JSON.stringify', 4],
    ['Date.now tokens', 'Date.now', 1],
    ['Math.random tokens', 'Math.random', 1],
    ['MAX_DATA_CHANNEL_MESSAGE_CHARS tokens', 'MAX_DATA_CHANNEL_MESSAGE_CHARS', 5],
    ['__nanahChunk tokens', '__nanahChunk', 2],
    ['incomingChunks tokens', 'incomingChunks', 4],
    ['resolveNanahSignalingUrl tokens', 'resolveNanahSignalingUrl', 6],
    ['DEFAULT_NANAH_SIGNALING_URL tokens', 'DEFAULT_NANAH_SIGNALING_URL', 4],
  ]) {
    assert.equal(countLiteral(nanah, token), expected, `${token} count drifted`);
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${expected}`));
  }

  assert.match(nanah, /socket\.addEventListener\("open", \(\) => resolve\(socket\), \{ once: true \}\)/);
  assert.match(nanah, /channel\.addEventListener\("message", \(event\) =>/);
  assert.match(nanah, /this\.incomingChunks\.set\(parsed\.id, bucket\)/);
  assert.match(nanah, /this\.incomingChunks\.delete\(parsed\.id\)/);
  assert.match(nanah, /chunk-\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\.toString\(16\)\.slice\(2\)\}/);
});

test('Nanah dashboard consumer keeps SAS and send gates split from JSON filtering', () => {
  const text = doc();
  const tabView = read(tabViewPath);
  const adapter = read(adapterPath);
  const tabHtml = read(tabHtmlPath);

  for (const [label, token, expected] of [
    ['new NanahApi.WebRtcDataChannelTransport tokens', 'new NanahApi.WebRtcDataChannelTransport', 1],
    ['NanahApi.DEFAULT_NANAH_SIGNALING_URL tokens', 'NanahApi.DEFAULT_NANAH_SIGNALING_URL', 1],
    ['client.on tokens', 'client.on(', 7],
    ['nanahClient.send tokens', 'nanahClient.send(', 3],
    ['nanahClient.confirmSas tokens', 'nanahClient.confirmSas()', 1],
    ['resetNanahSession(true) tokens', 'resetNanahSession(true)', 2],
    ['resetNanahSession(false) tokens', 'resetNanahSession(false)', 3],
    ['showChoiceModal tokens', 'showChoiceModal', 9],
    ['SAS relay impersonation warning tokens', 'This prevents the signaling relay from silently impersonating one side of the session.', 1],
  ]) {
    assert.equal(countLiteral(tabView, token), expected, `${token} count drifted`);
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${expected}`));
  }

  assert.match(tabHtml, /\.\.\/js\/vendor\/qrcode\.bundle\.js/);
  assert.match(tabHtml, /\.\.\/js\/vendor\/nanah\.bundle\.js/);
  assert.match(tabHtml, /\.\.\/js\/nanah_sync_adapter\.js/);
  assert.match(tabView, /transport: new NanahApi\.WebRtcDataChannelTransport/);
  assert.match(tabView, /await nanahClient\.confirmSas\(\)/);
  assert.match(tabView, /await nanahClient\.send\(envelope\)/);
  assert.match(adapter, /payloadVersion: PAYLOAD_VERSION/);
  assert.match(adapter, /payload: JSON\.stringify\(built\.portable\)/);
  assert.match(text, /Nanah carries settings payloads, not YouTube\s+response JSON/);
});

test('Nanah vendor runtime session lifecycle keeps future authority gates absent', () => {
  const text = doc();
  const source = [
    read(nanahPath),
    read(tabViewPath),
    read(adapterPath),
    read(tabHtmlPath)
  ].join('\n');

  for (const token of [
    'nanahVendorRuntimeSessionLifecycleContract',
    'nanahVendorWebSocketLifecycleReport',
    'nanahVendorDataChannelListenerReport',
    'nanahVendorPeerConnectionStateReport',
    'nanahVendorCryptoHandshakeReport',
    'nanahVendorSasConfirmationGate',
    'nanahVendorChunkReassemblyBudget',
    'nanahVendorRelayTimeoutPolicy',
    'nanahVendorCloseTeardownReport',
    'nanahVendorFirstClassJsonFilterBoundary'
  ]) {
    assert.match(text, new RegExp(token));
    assert.doesNotMatch(source, new RegExp(token));
  }

  assert.match(text, /no explicit connect\s+timeout, reconnect policy, stale chunk eviction, or executable session-state\s+fixture/);
  assert.match(text, /eight listener registrations and zero\s+`removeEventListener` calls/);
  assert.match(text, /no current size budget or\s+metric artifact/);
  assert.match(text, /vendor generation path, sibling Nanah\s+input revision, generated output hash, dashboard consumer contract, native sync\s+parity, and release package proof/);
});
