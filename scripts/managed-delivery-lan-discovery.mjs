import crypto from 'node:crypto';
import dgram from 'node:dgram';

const DEFAULT_GROUP = '239.255.77.77';
const DEFAULT_PORT = 47777;
const MAX_PACKET_BYTES = 16 * 1024;
const HEARTBEAT_MS = 2500;
const REMOTE_TTL_MS = 10 * 1000;
const PRESENCE_TTL_MS = 75 * 1000;
const INVITATION_TTL_MS = 2 * 60 * 1000;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRole(value) {
  const role = normalizeString(value).toLowerCase();
  return ['parent', 'protected', 'personal'].includes(role) ? role : 'personal';
}

function normalizePublicCandidate(value, sourceProviderId, now = Date.now()) {
  const root = safeObject(value);
  const candidateId = normalizeString(root.candidateId).slice(0, 128);
  const label = normalizeString(root.label).slice(0, 64);
  const providerId = normalizeString(sourceProviderId).slice(0, 128);
  if (!candidateId || !label || !providerId) return null;
  const requestedExpiry = Number(root.expiresAtMs);
  const expiresAtMs = Number.isFinite(requestedExpiry)
    ? Math.min(requestedExpiry, now + PRESENCE_TTL_MS)
    : now + PRESENCE_TTL_MS;
  if (expiresAtMs <= now) return null;
  return {
    schema: 'filtertube_family_device_candidate',
    version: 1,
    candidateId,
    label,
    platform: normalizeString(root.platform).slice(0, 32) || 'filtertube',
    role: normalizeRole(root.role),
    route: 'home',
    state: 'nearby-unpaired',
    pairingMethod: 'code-or-qr',
    lastSeenAtMs: now,
    expiresAtMs,
    sourceProviderId: providerId,
    meshSeenAtMs: now
  };
}

function publicCandidate(value) {
  const root = safeObject(value);
  return {
    schema: 'filtertube_family_device_candidate',
    version: 1,
    candidateId: normalizeString(root.candidateId),
    label: normalizeString(root.label),
    platform: normalizeString(root.platform) || 'filtertube',
    role: normalizeRole(root.role),
    route: 'home',
    state: 'nearby-unpaired',
    pairingMethod: 'code-or-qr',
    lastSeenAtMs: Number(root.lastSeenAtMs) || Date.now(),
    expiresAtMs: Number(root.expiresAtMs) || null
  };
}

export function createManagedDeliveryLanDiscoveryMesh(options = {}) {
  const providerId = normalizeString(options.providerId) || crypto.randomUUID();
  const multicastAddress = normalizeString(options.multicastAddress) || DEFAULT_GROUP;
  const multicastPort = Number(options.multicastPort) || DEFAULT_PORT;
  const getLocalCandidates = typeof options.getLocalCandidates === 'function'
    ? options.getLocalCandidates
    : () => [];
  const queueInvitation = typeof options.queueInvitation === 'function'
    ? options.queueInvitation
    : () => false;
  const socketFactory = typeof options.socketFactory === 'function'
    ? options.socketFactory
    : () => dgram.createSocket({ type: 'udp4', reuseAddr: true });
  const remoteCandidates = new Map();
  let socket = null;
  let heartbeatTimer = null;
  let started = false;
  let lastError = '';
  let lastBroadcastAtMs = 0;
  let lastReceivedAtMs = 0;

  function prune(now = Date.now()) {
    for (const [key, row] of remoteCandidates) {
      const seenAt = Number(row.meshSeenAtMs) || 0;
      const expiresAt = Number(row.expiresAtMs) || 0;
      if (!seenAt || now - seenAt > REMOTE_TTL_MS || (expiresAt > 0 && expiresAt <= now)) {
        remoteCandidates.delete(key);
      }
    }
  }

  function send(packet) {
    if (!socket || !started) return false;
    const bytes = Buffer.from(JSON.stringify(packet));
    if (bytes.length > MAX_PACKET_BYTES) return false;
    socket.send(bytes, multicastPort, multicastAddress, (error) => {
      if (error) lastError = normalizeString(error.message) || 'lan_discovery_send_failed';
    });
    lastBroadcastAtMs = Date.now();
    return true;
  }

  function broadcastPresence() {
    const candidates = safeArray(getLocalCandidates())
      .map(publicCandidate)
      .filter(row => row.candidateId && row.label && Number(row.expiresAtMs) > Date.now())
      .slice(0, 24);
    return send({
      schema: 'filtertube_lan_discovery_packet',
      version: 1,
      type: 'presence',
      providerId,
      sentAtMs: Date.now(),
      candidates
    });
  }

  function broadcastWithdraw(candidateId) {
    const id = normalizeString(candidateId).slice(0, 128);
    return id ? send({
      schema: 'filtertube_lan_discovery_packet',
      version: 1,
      type: 'withdraw',
      providerId,
      sentAtMs: Date.now(),
      candidateId: id
    }) : false;
  }

  function receivePresence(packet, now) {
    const sourceProviderId = normalizeString(packet.providerId).slice(0, 128);
    if (!sourceProviderId || sourceProviderId === providerId) return;
    const seen = new Set();
    safeArray(packet.candidates).slice(0, 24).forEach((candidate) => {
      const normalized = normalizePublicCandidate(candidate, sourceProviderId, now);
      if (!normalized) return;
      const key = `${sourceProviderId}:${normalized.candidateId}`;
      seen.add(key);
      remoteCandidates.set(key, normalized);
    });
    for (const [key, row] of remoteCandidates) {
      if (row.sourceProviderId === sourceProviderId && !seen.has(key)) remoteCandidates.delete(key);
    }
  }

  function receiveWithdraw(packet) {
    const sourceProviderId = normalizeString(packet.providerId).slice(0, 128);
    const candidateId = normalizeString(packet.candidateId).slice(0, 128);
    if (sourceProviderId && candidateId && sourceProviderId !== providerId) {
      remoteCandidates.delete(`${sourceProviderId}:${candidateId}`);
    }
  }

  function receiveInvitation(packet, now) {
    if (normalizeString(packet.targetProviderId) !== providerId) return;
    const pairingCode = normalizeString(packet.pairingCode).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const invitation = {
      invitationId: normalizeString(packet.invitationId).slice(0, 128),
      candidateId: normalizeString(packet.candidateId).slice(0, 128),
      pairingCode,
      inviterLabel: normalizeString(packet.inviterLabel).slice(0, 64) || 'FilterTube device',
      createdAtMs: now,
      expiresAtMs: Math.min(Number(packet.expiresAtMs) || now + INVITATION_TTL_MS, now + INVITATION_TTL_MS)
    };
    if (invitation.invitationId && invitation.candidateId && pairingCode.length === 4) {
      queueInvitation(invitation);
    }
  }

  function receive(buffer) {
    if (!buffer || buffer.length > MAX_PACKET_BYTES) return;
    let packet;
    try {
      packet = safeObject(JSON.parse(buffer.toString('utf8')));
    } catch (_) {
      return;
    }
    if (packet.schema !== 'filtertube_lan_discovery_packet' || Number(packet.version) !== 1) return;
    lastReceivedAtMs = Date.now();
    if (packet.type === 'presence') receivePresence(packet, lastReceivedAtMs);
    else if (packet.type === 'withdraw') receiveWithdraw(packet);
    else if (packet.type === 'invitation') receiveInvitation(packet, lastReceivedAtMs);
    prune(lastReceivedAtMs);
  }

  function discoverCandidates({ excludeCandidateId = '' } = {}) {
    prune();
    const excluded = normalizeString(excludeCandidateId);
    return Array.from(remoteCandidates.values())
      .filter(row => row.candidateId !== excluded)
      .sort((a, b) => Number(b.lastSeenAtMs) - Number(a.lastSeenAtMs))
      .slice(0, 24)
      .map(publicCandidate);
  }

  function inviteCandidate(request = {}) {
    prune();
    const candidateId = normalizeString(request.candidateId).slice(0, 128);
    const target = Array.from(remoteCandidates.values()).find(row => row.candidateId === candidateId);
    if (!target) return { ok: false, reason: 'nearby_device_expired' };
    const pairingCode = normalizeString(request.pairingCode).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (pairingCode.length !== 4) return { ok: false, reason: 'invalid_pairing_invitation' };
    const invitationId = normalizeString(request.invitationId).slice(0, 128) || crypto.randomUUID();
    const expiresAtMs = Math.min(Number(request.expiresAtMs) || Date.now() + INVITATION_TTL_MS, Date.now() + INVITATION_TTL_MS);
    const ok = send({
      schema: 'filtertube_lan_discovery_packet',
      version: 1,
      type: 'invitation',
      providerId,
      targetProviderId: target.sourceProviderId,
      candidateId,
      invitationId,
      pairingCode,
      inviterLabel: normalizeString(request.inviterLabel).slice(0, 64) || 'FilterTube device',
      createdAtMs: Date.now(),
      expiresAtMs
    });
    return ok ? { ok: true, invitationId, expiresAtMs } : { ok: false, reason: 'lan_discovery_unavailable' };
  }

  function start() {
    if (started) return Promise.resolve(true);
    return new Promise((resolve) => {
      const nextSocket = socketFactory();
      socket = nextSocket;
      nextSocket.on('message', receive);
      nextSocket.on('error', (error) => {
        lastError = normalizeString(error.message) || 'lan_discovery_socket_error';
      });
      nextSocket.bind(multicastPort, '0.0.0.0', () => {
        try {
          nextSocket.addMembership(multicastAddress);
          nextSocket.setMulticastTTL(1);
          nextSocket.setMulticastLoopback(true);
          started = true;
          broadcastPresence();
          heartbeatTimer = setInterval(broadcastPresence, HEARTBEAT_MS);
          heartbeatTimer.unref?.();
          resolve(true);
        } catch (error) {
          lastError = normalizeString(error.message) || 'lan_discovery_start_failed';
          try { nextSocket.close(); } catch (_) {}
          socket = null;
          resolve(false);
        }
      });
    });
  }

  function stop() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    started = false;
    try { socket?.close(); } catch (_) {}
    socket = null;
    remoteCandidates.clear();
  }

  function getState() {
    prune();
    return {
      enabled: true,
      started,
      providerId,
      multicastAddress,
      multicastPort,
      remoteCandidateCount: remoteCandidates.size,
      lastBroadcastAtMs,
      lastReceivedAtMs,
      lastError
    };
  }

  return {
    providerId,
    start,
    stop,
    getState,
    broadcastPresence,
    broadcastWithdraw,
    discoverCandidates,
    inviteCandidate
  };
}
