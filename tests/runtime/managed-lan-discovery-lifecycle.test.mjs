import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createManagedDeliveryLanDiscoveryMesh } from '../../scripts/managed-delivery-lan-discovery.mjs';

class TestSocket extends EventEmitter {
  closed = false;
  bind(_port, _host, ready) { this.ready = ready; }
  addMembership() {}
  setMulticastTTL() {}
  setMulticastLoopback() {}
  send(_bytes, _port, _address, callback) { callback?.(); }
  close() { this.closed = true; }
}

test('a socket bind failure completes Nearby startup and permits a clean retry', async () => {
  const sockets = [];
  const mesh = createManagedDeliveryLanDiscoveryMesh({
    socketFactory: () => {
      const socket = new TestSocket();
      sockets.push(socket);
      return socket;
    }
  });
  try {
    const first = mesh.start();
    assert.equal(mesh.start(), first, 'concurrent starts share one socket');
    assert.equal(sockets.length, 1);
    sockets[0].emit('error', new Error('EADDRINUSE'));
    assert.equal(await first, false);
    assert.equal(sockets[0].closed, true);
    assert.equal(mesh.getState().lastError, 'EADDRINUSE');
    assert.equal(mesh.getState().started, false);
    const retry = mesh.start();
    assert.equal(sockets.length, 2);
    sockets[1].ready();
    assert.equal(await retry, true);
    assert.equal(mesh.getState().lastError, '');
    assert.equal(mesh.getState().started, true);
  } finally { mesh.stop(); }
});

test('stopping while the socket binds cancels startup and ignores its late callback', async () => {
  const socket = new TestSocket();
  const mesh = createManagedDeliveryLanDiscoveryMesh({ socketFactory: () => socket });
  const start = mesh.start();
  mesh.stop();
  assert.equal(await start, false);
  socket.ready();
  assert.equal(socket.closed, true);
  assert.equal(mesh.getState().started, false);
});

test('synchronous socket setup failures complete without leaving a pending startup', async () => {
  const mesh = createManagedDeliveryLanDiscoveryMesh({ socketFactory: () => { throw new Error('udp_unavailable'); } });
  assert.equal(await mesh.start(), false);
  assert.equal(await mesh.start(), false);
  assert.equal(mesh.getState().lastError, 'udp_unavailable');
});

test('Nearby discovery crosses helpers, forwards only pairing metadata, and withdraws immediately', async () => {
  const sockets = [];
  const packets = [];
  const socketFactory = () => {
    const socket = new TestSocket();
    socket.send = (bytes, _port, _address, callback) => {
      packets.push(JSON.parse(bytes.toString()));
      for (const peer of sockets) if (!peer.closed) peer.emit('message', bytes);
      callback?.();
    };
    sockets.push(socket);
    return socket;
  };
  const invitations = [];
  const parent = createManagedDeliveryLanDiscoveryMesh({ providerId: 'parent-helper', socketFactory });
  const child = createManagedDeliveryLanDiscoveryMesh({
    providerId: 'child-helper',
    socketFactory,
    getLocalCandidates: () => [{
      candidateId: 'child-candidate', label: 'Study tablet', role: 'protected',
      expiresAtMs: Date.now() + 60000, receiveToken: 'must-stay-local',
      privateKey: 'must-stay-local', channels: ['must-stay-local']
    }],
    queueInvitation: invitation => { invitations.push(invitation); return true; }
  });
  try {
    const parentStarted = parent.start();
    sockets[0].ready();
    assert.equal(await parentStarted, true);
    const childStarted = child.start();
    sockets[1].ready();
    assert.equal(await childStarted, true);
    assert.equal(parent.discoverCandidates()[0].label, 'Study tablet');
    assert.equal(parent.discoverCandidates()[0].state, 'nearby-unpaired');
    assert.deepEqual(parent.discoverCandidates({ excludeCandidateId: 'child-candidate' }), []);
    const result = parent.inviteCandidate({
      candidateId: 'child-candidate', pairingCode: 'ABCD', inviterLabel: 'Parent laptop',
      privateKey: 'must-stay-local', channels: ['must-stay-local']
    });
    assert.equal(result.ok, true);
    assert.equal(invitations.length, 1);
    assert.equal(invitations[0].pairingCode, 'ABCD');
    assert.equal(JSON.stringify(packets).includes('must-stay-local'), false);
    child.broadcastWithdraw('child-candidate');
    assert.deepEqual(parent.discoverCandidates(), []);
    assert.equal(parent.inviteCandidate({ candidateId: 'child-candidate', pairingCode: 'ABCD' }).ok, false);
  } finally {
    parent.stop();
    child.stop();
  }
});
