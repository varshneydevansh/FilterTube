#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8787;
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_ROWS = 5000;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SERVICE_NAME = 'filtertube-managed-delivery-provider';

const FORBIDDEN_PLAINTEXT_KEYS = new Set([
  'payload',
  'policy',
  'keywords',
  'channels',
  'videos',
  'videoIds',
  'whitelistKeywords',
  'whitelistChannels',
  'blockedKeywords',
  'blockedChannels',
  'pin',
  'password',
  'privateKey',
  'privateKeyJwk',
  'authSecret',
  'secret'
]);

const FORBIDDEN_SECRET_KEYS = new Set([
  'pin',
  'password',
  'privateKey',
  'privateKeyJwk',
  'authSecret',
  'secret'
]);

const MAILBOX_ITEM_KEYS = [
  'schema',
  'version',
  'mailboxItemId',
  'linkId',
  'targetProfileId',
  'sourceDeviceId',
  'sourceProfileId',
  'scope',
  'revision',
  'policyHash',
  'sourcePublicKeyId',
  'keyVersion',
  'cipherSuite',
  'keyAgreementId',
  'encryptedDek',
  'nonce',
  'ciphertext',
  'ciphertextHash',
  'createdAtMs',
  'expiresAtMs',
  'ackState'
];

const LOCAL_CANDIDATE_KEYS = [
  'schema',
  'version',
  'transport',
  'candidateId',
  'localNetworkCandidateId',
  'linkId',
  'targetProfileId',
  'sourceDeviceId',
  'sourceProfileId',
  'scope',
  'revision',
  'policyHash',
  'sourcePublicKeyId',
  'keyVersion',
  'source',
  'networkReachable',
  'expiresAt',
  'expiresAtMs',
  'createdAtMs',
  'envelope',
  'peer'
];

const ACK_KEYS = [
  'schema',
  'version',
  'ackedAt',
  'linkId',
  'mailboxItemId',
  'candidateId',
  'localNetworkCandidateId',
  'targetProfileId',
  'sourceDeviceId',
  'sourceProfileId',
  'scope',
  'revision',
  'policyHash',
  'ackState',
  'accepted',
  'applied',
  'decision',
  'reason'
];

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function containsForbiddenKey(value, forbiddenKeys = FORBIDDEN_PLAINTEXT_KEYS, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some(item => containsForbiddenKey(item, forbiddenKeys, seen));
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) return true;
    if (containsForbiddenKey(child, forbiddenKeys, seen)) return true;
  }
  return false;
}

function pickAllowed(root, keys) {
  const clean = {};
  for (const key of keys) {
    if (root[key] !== undefined) clean[key] = root[key];
  }
  return clean;
}

function normalizeScope(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeExpiryMs(value, baseMs, now = Date.now()) {
  const base = Number(baseMs) || now;
  const max = base + DEFAULT_TTL_MS;
  const requested = Number(value);
  if (!Number.isFinite(requested) || requested <= 0) return max;
  return Math.min(requested, max);
}

function normalizeMailboxItem(item, now = Date.now()) {
  const root = safeObject(item);
  if (containsForbiddenKey(root, FORBIDDEN_PLAINTEXT_KEYS)) return null;
  const clean = pickAllowed(root, MAILBOX_ITEM_KEYS);
  clean.schema = normalizeString(clean.schema) || 'filtertube_managed_mailbox_item';
  clean.version = Number(clean.version) || 1;
  clean.mailboxItemId = normalizeString(clean.mailboxItemId);
  clean.linkId = normalizeString(clean.linkId);
  clean.targetProfileId = normalizeString(clean.targetProfileId);
  clean.sourceDeviceId = normalizeString(clean.sourceDeviceId);
  clean.sourceProfileId = normalizeString(clean.sourceProfileId);
  clean.scope = normalizeScope(clean.scope);
  clean.revision = Number(clean.revision) || null;
  clean.policyHash = normalizeString(clean.policyHash);
  clean.createdAtMs = Number(clean.createdAtMs) || now;
  clean.expiresAtMs = normalizeExpiryMs(clean.expiresAtMs, clean.createdAtMs, now);
  if (!clean.mailboxItemId || !clean.linkId || !clean.targetProfileId || !clean.scope || !clean.revision || !clean.policyHash) return null;
  if (!normalizeString(clean.ciphertext) || !normalizeString(clean.ciphertextHash)) return null;
  return clean;
}

function normalizeCandidate(candidate, now = Date.now()) {
  const root = safeObject(candidate);
  if (containsForbiddenKey(root, FORBIDDEN_SECRET_KEYS)) return null;
  const clean = pickAllowed(root, LOCAL_CANDIDATE_KEYS);
  clean.schema = normalizeString(clean.schema) || 'filtertube_managed_local_network_candidate';
  clean.version = Number(clean.version) || 1;
  clean.transport = 'local_network';
  clean.candidateId = normalizeString(clean.candidateId || clean.localNetworkCandidateId);
  clean.localNetworkCandidateId = normalizeString(clean.localNetworkCandidateId || clean.candidateId);
  clean.linkId = normalizeString(clean.linkId);
  clean.targetProfileId = normalizeString(clean.targetProfileId);
  clean.sourceDeviceId = normalizeString(clean.sourceDeviceId);
  clean.sourceProfileId = normalizeString(clean.sourceProfileId);
  clean.scope = normalizeScope(clean.scope);
  clean.revision = Number(clean.revision) || null;
  clean.policyHash = normalizeString(clean.policyHash);
  clean.sourcePublicKeyId = normalizeString(clean.sourcePublicKeyId);
  clean.keyVersion = Number(clean.keyVersion) || 0;
  clean.createdAtMs = Number(clean.createdAtMs) || now;
  clean.expiresAtMs = normalizeExpiryMs(clean.expiresAtMs || clean.expiresAt, clean.createdAtMs, now);
  if (!clean.candidateId || !clean.linkId || !clean.targetProfileId || !clean.scope || !clean.revision || !clean.policyHash) return null;
  if (!safeObject(clean.envelope).type && !safeObject(clean.envelope).schema) return null;
  return clean;
}

function normalizeAck(record, kind, now = Date.now()) {
  const root = safeObject(record);
  if (containsForbiddenKey(root, FORBIDDEN_PLAINTEXT_KEYS)) return null;
  const clean = pickAllowed(root, ACK_KEYS);
  clean.schema = normalizeString(clean.schema) || (kind === 'local'
    ? 'filtertube_managed_local_network_candidate_ack'
    : 'filtertube_nanah_managed_open_sync_ack');
  clean.version = Number(clean.version) || 1;
  clean.ackedAt = Number(clean.ackedAt) || now;
  clean.expiresAtMs = normalizeExpiryMs(root.expiresAtMs || root.expiresAt, clean.ackedAt, now);
  clean.linkId = normalizeString(clean.linkId);
  clean.mailboxItemId = normalizeString(clean.mailboxItemId);
  clean.candidateId = normalizeString(clean.candidateId || clean.localNetworkCandidateId);
  clean.localNetworkCandidateId = normalizeString(clean.localNetworkCandidateId || clean.candidateId);
  clean.targetProfileId = normalizeString(clean.targetProfileId);
  clean.sourceDeviceId = normalizeString(clean.sourceDeviceId);
  clean.sourceProfileId = normalizeString(clean.sourceProfileId);
  clean.scope = normalizeScope(clean.scope);
  clean.revision = Number(clean.revision) || null;
  clean.policyHash = normalizeString(clean.policyHash);
  clean.ackState = normalizeString(clean.ackState) || 'rejected';
  clean.accepted = clean.accepted === true;
  clean.applied = clean.applied === true;
  clean.decision = normalizeString(clean.decision);
  clean.reason = normalizeString(clean.reason) || null;
  if (!clean.linkId || !clean.scope || !clean.revision || !clean.policyHash) return null;
  if (kind === 'mailbox' && !clean.mailboxItemId) return null;
  if (kind === 'local' && !clean.candidateId) return null;
  return clean;
}

function matchesRequest(row, request) {
  const root = safeObject(request);
  const allowedScopes = new Set(safeArray(root.allowedScopes || root.scopes).map(normalizeScope).filter(Boolean));
  if (normalizeString(root.linkId) && normalizeString(row.linkId) !== normalizeString(root.linkId)) return false;
  if (normalizeString(root.targetProfileId) && normalizeString(row.targetProfileId) !== normalizeString(root.targetProfileId)) return false;
  if (normalizeString(root.sourceProfileId) && normalizeString(row.sourceProfileId) !== normalizeString(root.sourceProfileId)) return false;
  if (normalizeString(root.sourceDeviceId) && normalizeString(row.sourceDeviceId) !== normalizeString(root.sourceDeviceId)) return false;
  if (allowedScopes.size > 0 && !allowedScopes.has(normalizeScope(row.scope))) return false;
  return true;
}

function matchesSentPolicy(row, request) {
  const policies = safeArray(safeObject(request).sentPolicies);
  if (policies.length === 0) return true;
  return policies.some((policy) => {
    const root = safeObject(policy);
    return normalizeScope(root.scope) === normalizeScope(row.scope)
      && Number(root.revision) === Number(row.revision)
      && normalizeString(root.policyHash) === normalizeString(row.policyHash);
  });
}

function pruneExpired(map, now = Date.now()) {
  let removed = 0;
  for (const [key, row] of map) {
    const expiresAtMs = Number(row.expiresAtMs || row.expiresAt) || 0;
    if (expiresAtMs && expiresAtMs <= now) {
      map.delete(key);
      removed += 1;
    }
  }
  while (map.size > MAX_ROWS) {
    const firstKey = map.keys().next().value;
    if (!firstKey) break;
    map.delete(firstKey);
    removed += 1;
  }
  return removed;
}

function purgeRowsByRequest(map, request, idName, explicitIds = []) {
  const ids = new Set(safeArray(explicitIds).map(normalizeString).filter(Boolean));
  let purged = 0;
  for (const [key, row] of map) {
    const rowId = normalizeString(row?.[idName]);
    const shouldDelete = ids.size > 0
      ? ids.has(rowId)
      : matchesRequest(row, request);
    if (!shouldDelete) continue;
    map.delete(key);
    purged += 1;
  }
  return purged;
}

function purgeRowsByAckRecords(map, records, idName) {
  const ids = new Set(safeArray(records).map(row => normalizeString(row?.[idName])).filter(Boolean));
  if (ids.size === 0) return 0;
  let purged = 0;
  for (const [key, row] of map) {
    if (!ids.has(normalizeString(row?.[idName]))) continue;
    map.delete(key);
    purged += 1;
  }
  return purged;
}

function getPurgeStateSet(request) {
  const states = safeArray(safeObject(request).purgeStates)
    .map(state => normalizeString(state).toLowerCase())
    .filter(Boolean);
  if (states.length === 0) return new Set(['pending', 'ack']);
  return new Set(states);
}

function mapFromRows(rows, keyName, normalizer) {
  const map = new Map();
  for (const row of safeArray(rows)) {
    const normalized = normalizer(row);
    const key = normalizeString(normalized?.[keyName]);
    if (key) map.set(key, normalized);
  }
  return map;
}

function ackMapFromRows(rows, kind, normalizer) {
  const map = new Map();
  for (const row of safeArray(rows)) {
    const normalized = normalizer(row, kind);
    if (!normalized) continue;
    const rowId = kind === 'local'
      ? normalizeString(normalized.candidateId)
      : normalizeString(normalized.mailboxItemId);
    if (!rowId) continue;
    map.set(`${rowId}:${normalized.scope}:${normalized.revision}`, normalized);
  }
  return map;
}

function loadPersistedState(storePath, now = Date.now()) {
  if (!storePath) return {};
  try {
    if (!fs.existsSync(storePath)) return {};
    const raw = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const root = safeObject(raw);
    return {
      mailboxItems: mapFromRows(root.mailboxItems, 'mailboxItemId', row => normalizeMailboxItem(row, now)),
      mailboxAcks: ackMapFromRows(root.mailboxAcks, 'mailbox', row => normalizeAck(row, 'mailbox', now)),
      localCandidates: mapFromRows(root.localCandidates, 'candidateId', row => normalizeCandidate(row, now)),
      localAcks: ackMapFromRows(root.localAcks, 'local', row => normalizeAck(row, 'local', now))
    };
  } catch (error) {
    console.warn(`FilterTube managed delivery provider: could not read store ${storePath}: ${error.message}`);
    return {};
  }
}

function writePersistedState(storePath, state) {
  if (!storePath) return;
  try {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    const tmpPath = `${storePath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify({
      schema: 'filtertube_managed_delivery_provider_store',
      version: 1,
      savedAt: Date.now(),
      mailboxItems: Array.from(state.mailboxItems.values()),
      mailboxAcks: Array.from(state.mailboxAcks.values()),
      localCandidates: Array.from(state.localCandidates.values()),
      localAcks: Array.from(state.localAcks.values())
    }, null, 2));
    fs.renameSync(tmpPath, storePath);
  } catch (error) {
    console.warn(`FilterTube managed delivery provider: could not write store ${storePath}: ${error.message}`);
  }
}

function readOptionalFile(value) {
  const filePath = normalizeString(value);
  if (!filePath) return '';
  return fs.readFileSync(filePath);
}

function getTlsServerOptions(options = {}) {
  const key = options.tlsKey || readOptionalFile(options.tlsKeyPath || process.env.FILTERTUBE_PROVIDER_TLS_KEY_PATH);
  const cert = options.tlsCert || readOptionalFile(options.tlsCertPath || process.env.FILTERTUBE_PROVIDER_TLS_CERT_PATH);
  if (!key && !cert) return null;
  if (!key || !cert) {
    throw new Error('FILTERTUBE_PROVIDER_TLS_KEY_PATH and FILTERTUBE_PROVIDER_TLS_CERT_PATH must be provided together');
  }
  return { key, cert };
}

function formatHostForUrl(host) {
  const normalized = normalizeString(host);
  if (!normalized) return '';
  return normalized.includes(':') && !normalized.startsWith('[') ? `[${normalized}]` : normalized;
}

export function getManagedDeliveryProviderHomePickupUrls(options = {}) {
  const host = normalizeString(options.host) || DEFAULT_HOST;
  const port = Number(options.port) || DEFAULT_PORT;
  const protocol = normalizeString(options.protocol) === 'https' ? 'https' : 'http';
  const wildcard = host === '0.0.0.0' || host === '::' || host === '[::]';
  const hosts = [];
  if (wildcard) {
    for (const entries of Object.values(os.networkInterfaces())) {
      for (const entry of safeArray(entries)) {
        if (!entry || entry.internal || entry.family !== 'IPv4') continue;
        const address = normalizeString(entry.address);
        if (address) hosts.push(address);
      }
    }
  } else {
    hosts.push(host);
  }
  const uniqueHosts = Array.from(new Set(hosts.length ? hosts : ['127.0.0.1']));
  return uniqueHosts.map(address => `${protocol}://${formatHostForUrl(address)}:${port}/filtertube`);
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      const error = new Error('request_body_too_large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return safeObject(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch (_) {
    const error = new Error('invalid_json');
    error.statusCode = 400;
    throw error;
  }
}

function writeJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization'
  });
  res.end(body);
}

function escapeHtml(value) {
  return normalizeString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wantsHtml(req) {
  const accept = normalizeString(req.headers.accept).toLowerCase();
  return accept.includes('text/html') && !accept.includes('application/json');
}

function writeHtml(res, status, html) {
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
  });
  res.end(html);
}

function writeOptions(res) {
  res.writeHead(204, {
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '600'
  });
  res.end();
}

function isAuthorized(req, token) {
  if (!token) return true;
  return normalizeString(req.headers.authorization) === `Bearer ${token}`;
}

export function createManagedDeliveryProviderServer(options = {}) {
  const token = normalizeString(options.authToken || process.env.FILTERTUBE_PROVIDER_TOKEN);
  const storePath = normalizeString(options.storePath || process.env.FILTERTUBE_PROVIDER_STORE);
  const tlsOptions = getTlsServerOptions(options);
  const persisted = loadPersistedState(storePath);
  const mailboxItems = persisted.mailboxItems || new Map();
  const mailboxAcks = persisted.mailboxAcks || new Map();
  const localCandidates = persisted.localCandidates || new Map();
  const localAcks = persisted.localAcks || new Map();

  function persist() {
    writePersistedState(storePath, { mailboxItems, mailboxAcks, localCandidates, localAcks });
  }

  function publicStatusPayload() {
    return {
      ok: true,
      schema: 'filtertube_managed_delivery_provider_status',
      version: 1,
      service: SERVICE_NAME,
      protocol: tlsOptions ? 'https' : 'http',
      persistentStore: !!storePath,
      authRequired: !!token,
      supportedPaths: [
        'managed-mailbox/upload',
        'managed-mailbox/pull',
        'managed-mailbox/ack',
        'managed-mailbox/ack/pull',
        'managed-mailbox/purge',
        'managed-mailbox/health',
        'managed-local-network/publish',
        'managed-local-network/discover',
        'managed-local-network/ack',
        'managed-local-network/ack/pull',
        'managed-local-network/purge',
        'managed-local-network/health'
      ],
      authority: 'transport_only_signed_parent_policy_validation_required'
    };
  }

  function providerStatusHtml(status) {
    const protocol = escapeHtml(status.protocol);
    const auth = status.authRequired ? 'Provider key required' : 'No provider key set';
    const store = status.persistentStore ? 'Persistent local store enabled' : 'Memory-only store';
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FilterTube Pickup Provider</title>
<style>
body{margin:0;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#eef6f8;color:#17212b}
main{max-width:760px;margin:40px auto;padding:0 18px}
.card{background:rgba(255,255,255,.86);border:1px solid rgba(70,83,95,.16);border-radius:18px;box-shadow:0 18px 55px rgba(26,42,58,.12);overflow:hidden}
header{padding:28px 30px;border-bottom:1px solid rgba(70,83,95,.13)}
h1{font-size:24px;margin:0 0 8px}
p{margin:0;color:#51606f}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:22px 30px}
.tile{border:1px solid rgba(70,83,95,.13);border-radius:14px;padding:14px;background:#fff}
.label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9b4b43;font-weight:700}
.value{margin-top:4px;font-weight:700}
.notice{margin:0 30px 24px;padding:16px;border-radius:14px;background:#f5fbf7;border:1px solid #bedcc9;color:#244537}
ul{margin:10px 0 0 18px;padding:0}
li{margin:6px 0}
code{background:#f3efe9;border:1px solid rgba(70,83,95,.12);border-radius:8px;padding:2px 6px}
@media (max-width:680px){main{margin:18px auto}.grid{grid-template-columns:1fr;padding:18px}header{padding:22px}.notice{margin:0 18px 18px}}
</style>
</head>
<body>
<main>
<section class="card">
<header>
<h1>FilterTube Pickup Provider</h1>
<p>This service can hold unreadable Internet Pickup updates and signed Home Pickup candidates for verified FilterTube devices.</p>
</header>
<div class="grid" aria-label="Provider status">
<div class="tile"><div class="label">Protocol</div><div class="value">${protocol.toUpperCase()}</div></div>
<div class="tile"><div class="label">Access key</div><div class="value">${escapeHtml(auth)}</div></div>
<div class="tile"><div class="label">Storage</div><div class="value">${escapeHtml(store)}</div></div>
</div>
<div class="notice">
<strong>Transport only.</strong>
<ul>
<li>For Home Pickup, enter this provider address only on devices that already have a verified parent/protected-device link.</li>
<li>For Internet Pickup, expose this service through a trusted HTTPS address before using it away from home.</li>
<li>The provider cannot choose profiles, read rules, approve PINs, or bypass signature/revision validation.</li>
</ul>
</div>
</section>
</main>
</body>
</html>`;
  }

  async function route(req, res) {
    if (req.method === 'OPTIONS') {
      writeOptions(res);
      return;
    }
    const pathName = new URL(req.url || '/', 'http://127.0.0.1').pathname.replace(/\/+$/, '');
    if (req.method === 'GET') {
      if (!pathName || pathName === '/filtertube' || pathName.endsWith('/filtertube') || pathName.endsWith('/status')) {
        const status = publicStatusPayload();
        if (wantsHtml(req)) writeHtml(res, 200, providerStatusHtml(status));
        else writeJson(res, 200, status);
        return;
      }
      writeJson(res, 404, { ok: false, reason: 'not_found' });
      return;
    }
    if (req.method !== 'POST') {
      writeJson(res, 405, { ok: false, reason: 'method_not_allowed' });
      return;
    }
    if (!isAuthorized(req, token)) {
      writeJson(res, 401, { ok: false, reason: 'unauthorized' });
      return;
    }

    const now = Date.now();
    const pruned = pruneExpired(mailboxItems, now)
      + pruneExpired(mailboxAcks, now)
      + pruneExpired(localCandidates, now)
      + pruneExpired(localAcks, now);
    if (pruned > 0) persist();
    const body = await readBody(req);
    if (pathName.endsWith('/managed-mailbox/upload')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const rows = safeArray(body.items).map(item => normalizeMailboxItem(item, now)).filter(Boolean);
      for (const row of rows) mailboxItems.set(row.mailboxItemId, row);
      persist();
      writeJson(res, 200, {
        ok: true,
        schema: 'filtertube_managed_mailbox_server_provider',
        version: 1,
        uploadedMailboxItemIds: rows.map(row => row.mailboxItemId),
        mailboxItemCount: rows.length
      });
      return;
    }

    if (pathName.endsWith('/managed-mailbox/pull')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const rows = Array.from(mailboxItems.values()).filter(row => matchesRequest(row, body));
      writeJson(res, 200, { ok: true, items: rows, mailboxItemCount: rows.length });
      return;
    }

    if (pathName.endsWith('/managed-mailbox/ack')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const rows = safeArray(body.records).map(row => normalizeAck(row, 'mailbox', now)).filter(Boolean);
      for (const row of rows) mailboxAcks.set(`${row.mailboxItemId}:${row.scope}:${row.revision}`, row);
      const cleared = purgeRowsByAckRecords(mailboxItems, rows, 'mailboxItemId');
      persist();
      writeJson(res, 200, {
        ok: true,
        ackedMailboxItemIds: rows.map(row => row.mailboxItemId),
        ackCount: rows.length,
        clearedMailboxItemCount: cleared,
        purgedMailboxItemCount: cleared
      });
      return;
    }

    if (pathName.endsWith('/managed-mailbox/ack/pull')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const rows = Array.from(mailboxAcks.values()).filter(row => matchesRequest(row, body) && matchesSentPolicy(row, body));
      writeJson(res, 200, { ok: true, acks: rows, ackCount: rows.length });
      return;
    }

    if (pathName.endsWith('/managed-mailbox/purge')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const explicitIds = safeArray(body.mailboxItemIds || body.mailboxIds || body.ids).map(normalizeString).filter(Boolean);
      const purgeStates = getPurgeStateSet(body);
      const purged = purgeStates.has('pending')
        ? purgeRowsByRequest(mailboxItems, body, 'mailboxItemId', explicitIds)
        : 0;
      const purgedAcks = purgeStates.has('ack') || purgeStates.has('receipt')
        ? purgeRowsByRequest(mailboxAcks, body, 'mailboxItemId', explicitIds)
        : 0;
      if (purged > 0 || purgedAcks > 0) persist();
      writeJson(res, 200, {
        ok: true,
        purgedMailboxItemCount: purged,
        purgedMailboxAckCount: purgedAcks
      });
      return;
    }

    if (pathName.endsWith('/managed-mailbox/health')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      writeJson(res, 200, {
        ok: true,
        schema: 'filtertube_managed_mailbox_server_provider',
        version: 1,
        mailboxReachable: true,
        service: SERVICE_NAME,
        persistentStore: !!storePath,
        pendingMailboxItemCount: mailboxItems.size,
        mailboxAckCount: mailboxAcks.size,
        pendingLocalCandidateCount: localCandidates.size,
        localAckCount: localAcks.size
      });
      return;
    }

    if (pathName.endsWith('/managed-local-network/health')) {
      if (containsForbiddenKey(body, FORBIDDEN_SECRET_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'secret_refused' });
        return;
      }
      writeJson(res, 200, {
        ok: true,
        schema: 'filtertube_managed_local_network_provider',
        version: 1,
        bridgeReachable: true,
        service: SERVICE_NAME,
        persistentStore: !!storePath,
        pendingLocalCandidateCount: localCandidates.size,
        localAckCount: localAcks.size,
        pendingMailboxItemCount: mailboxItems.size,
        mailboxAckCount: mailboxAcks.size
      });
      return;
    }

    if (pathName.endsWith('/managed-local-network/publish')) {
      if (containsForbiddenKey(body, FORBIDDEN_SECRET_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'secret_refused' });
        return;
      }
      const rows = safeArray(body.candidates).map(row => normalizeCandidate(row, now)).filter(Boolean);
      for (const row of rows) localCandidates.set(row.candidateId, row);
      persist();
      writeJson(res, 200, {
        ok: true,
        schema: 'filtertube_managed_local_network_provider',
        version: 1,
        candidateIds: rows.map(row => row.candidateId),
        candidateCount: rows.length
      });
      return;
    }

    if (pathName.endsWith('/managed-local-network/discover')) {
      if (containsForbiddenKey(body, FORBIDDEN_SECRET_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'secret_refused' });
        return;
      }
      const rows = Array.from(localCandidates.values()).filter(row => matchesRequest(row, body));
      writeJson(res, 200, { ok: true, candidates: rows, candidateCount: rows.length });
      return;
    }

    if (pathName.endsWith('/managed-local-network/ack')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const rows = safeArray(body.records).map(row => normalizeAck(row, 'local', now)).filter(Boolean);
      for (const row of rows) localAcks.set(`${row.candidateId}:${row.scope}:${row.revision}`, row);
      const cleared = purgeRowsByAckRecords(localCandidates, rows, 'candidateId');
      persist();
      writeJson(res, 200, {
        ok: true,
        ackedCandidateIds: rows.map(row => row.candidateId),
        ackCount: rows.length,
        clearedCandidateCount: cleared,
        purgedCandidateCount: cleared
      });
      return;
    }

    if (pathName.endsWith('/managed-local-network/ack/pull')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const rows = Array.from(localAcks.values()).filter(row => matchesRequest(row, body) && matchesSentPolicy(row, body));
      writeJson(res, 200, { ok: true, acks: rows, ackCount: rows.length });
      return;
    }

    if (pathName.endsWith('/managed-local-network/purge')) {
      if (containsForbiddenKey(body, FORBIDDEN_PLAINTEXT_KEYS)) {
        writeJson(res, 400, { ok: false, reason: 'plaintext_or_secret_refused' });
        return;
      }
      const explicitIds = safeArray(body.candidateIds || body.localNetworkCandidateIds || body.ids).map(normalizeString).filter(Boolean);
      const purgeStates = getPurgeStateSet(body);
      const purged = purgeStates.has('pending')
        ? purgeRowsByRequest(localCandidates, body, 'candidateId', explicitIds)
        : 0;
      const purgedAcks = purgeStates.has('ack') || purgeStates.has('receipt')
        ? purgeRowsByRequest(localAcks, body, 'candidateId', explicitIds)
        : 0;
      if (purged > 0 || purgedAcks > 0) persist();
      writeJson(res, 200, {
        ok: true,
        purgedCandidateCount: purged,
        purgedCandidateAckCount: purgedAcks
      });
      return;
    }

    writeJson(res, 404, { ok: false, reason: 'not_found' });
  }

  const requestHandler = (req, res) => {
    route(req, res).catch((error) => {
      writeJson(res, Number(error.statusCode) || 500, {
        ok: false,
        reason: normalizeString(error.message) || 'provider_error'
      });
    });
  };

  const server = tlsOptions
    ? https.createServer(tlsOptions, requestHandler)
    : http.createServer(requestHandler);

  server.getProviderState = () => ({
    mailboxItemCount: mailboxItems.size,
    mailboxAckCount: mailboxAcks.size,
    localCandidateCount: localCandidates.size,
    localAckCount: localAcks.size,
    persistentStore: !!storePath
  });
  server.resetProviderState = () => {
    mailboxItems.clear();
    mailboxAcks.clear();
    localCandidates.clear();
    localAcks.clear();
    persist();
  };
  server.providerId = crypto.randomUUID();
  server.providerProtocol = tlsOptions ? 'https' : 'http';
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log([
      'FilterTube managed delivery provider',
      '',
      'Usage:',
      '  FILTERTUBE_PROVIDER_HOST=0.0.0.0 FILTERTUBE_PROVIDER_STORE=.filtertube/managed-delivery-store.json npm run managed:provider',
      '',
      'Optional environment:',
      '  FILTERTUBE_PROVIDER_HOST    Host to bind. Use 0.0.0.0 for Home Pickup on your network.',
      '  FILTERTUBE_PROVIDER_PORT    Port to bind. Default: 8787.',
      '  FILTERTUBE_PROVIDER_TOKEN   Optional bearer key entered in FilterTube pickup setup.',
      '  FILTERTUBE_PROVIDER_STORE   Optional JSON store for waiting updates and redacted receipts.',
      '  FILTERTUBE_PROVIDER_TLS_KEY_PATH   Optional HTTPS private-key path.',
      '  FILTERTUBE_PROVIDER_TLS_CERT_PATH  Optional HTTPS certificate path. Use with the key path.',
      '',
      'Addresses:',
      '  Home Pickup:     http://<this-computer-lan-ip>:8787/filtertube',
      '  Internet Pickup: expose the same service through your trusted HTTPS address,',
      '                   or run this provider with trusted TLS key/cert paths.',
      '',
      'This provider is transport only. It stores unreadable waiting updates and redacted receipts;',
      'protected devices still validate saved parent link, target profile, scope, revision, hash, and signature.',
      ''
    ].join('\n'));
    process.exit(0);
  }
  const host = normalizeString(process.env.FILTERTUBE_PROVIDER_HOST) || DEFAULT_HOST;
  const port = Number(process.env.FILTERTUBE_PROVIDER_PORT) || DEFAULT_PORT;
  const server = createManagedDeliveryProviderServer();
  server.listen(port, host, () => {
    const protocol = server.providerProtocol || 'http';
    const homeUrls = getManagedDeliveryProviderHomePickupUrls({ host, port, protocol });
    const tokenNote = process.env.FILTERTUBE_PROVIDER_TOKEN ? 'Bearer token required' : 'no bearer token set';
    const storeNote = process.env.FILTERTUBE_PROVIDER_STORE
      ? `persistent store ${process.env.FILTERTUBE_PROVIDER_STORE}`
      : 'memory store only';
    const tlsNote = protocol === 'https' ? 'HTTPS enabled' : 'HTTP only';
    console.log(`FilterTube managed delivery provider listening on ${protocol}://${host}:${port}/filtertube (${tokenNote}, ${storeNote}, ${tlsNote})`);
    console.log('Home Pickup: enter one of these addresses on both verified devices:');
    for (const url of homeUrls) console.log(`  ${url}`);
    console.log(protocol === 'https'
      ? 'Internet Pickup: enter the trusted HTTPS address for this provider in FilterTube.'
      : 'Internet Pickup: put this provider behind your trusted HTTPS reverse proxy/tunnel, then enter that HTTPS address in FilterTube.');
  });
}
