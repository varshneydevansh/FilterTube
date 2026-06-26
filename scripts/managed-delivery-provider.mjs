#!/usr/bin/env node
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8787;
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_ROWS = 5000;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function writeOptions(res) {
  res.writeHead(204, {
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
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
  const persisted = loadPersistedState(storePath);
  const mailboxItems = persisted.mailboxItems || new Map();
  const mailboxAcks = persisted.mailboxAcks || new Map();
  const localCandidates = persisted.localCandidates || new Map();
  const localAcks = persisted.localAcks || new Map();

  function persist() {
    writePersistedState(storePath, { mailboxItems, mailboxAcks, localCandidates, localAcks });
  }

  async function route(req, res) {
    if (req.method === 'OPTIONS') {
      writeOptions(res);
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
    const pathName = new URL(req.url || '/', 'http://127.0.0.1').pathname.replace(/\/+$/, '');
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
        service: 'filtertube-managed-delivery-provider',
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
        service: 'filtertube-managed-delivery-provider',
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

  const server = http.createServer((req, res) => {
    route(req, res).catch((error) => {
      writeJson(res, Number(error.statusCode) || 500, {
        ok: false,
        reason: normalizeString(error.message) || 'provider_error'
      });
    });
  });

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
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = normalizeString(process.env.FILTERTUBE_PROVIDER_HOST) || DEFAULT_HOST;
  const port = Number(process.env.FILTERTUBE_PROVIDER_PORT) || DEFAULT_PORT;
  const server = createManagedDeliveryProviderServer();
  server.listen(port, host, () => {
    const tokenNote = process.env.FILTERTUBE_PROVIDER_TOKEN ? 'Bearer token required' : 'no bearer token set';
    const storeNote = process.env.FILTERTUBE_PROVIDER_STORE
      ? `persistent store ${process.env.FILTERTUBE_PROVIDER_STORE}`
      : 'memory store only';
    console.log(`FilterTube managed delivery provider listening on http://${host}:${port}/filtertube (${tokenNote}, ${storeNote})`);
  });
}
