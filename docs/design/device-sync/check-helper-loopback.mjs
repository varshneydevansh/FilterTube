// Optional acceptance probe: real HTTP + UDP on loopback, never a physical-LAN claim.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import dgram from 'node:dgram';
import fs from 'node:fs/promises';
import { createManagedDeliveryProviderServer } from '../../../scripts/managed-delivery-provider.mjs';

// This standalone probe must never inherit a real helper's store or TLS files.
// Deletion affects this Node process only, not the invoking shell or running helpers.
for (const key of ['FILTERTUBE_PROVIDER_STORE', 'FILTERTUBE_PROVIDER_TLS_KEY_PATH', 'FILTERTUBE_PROVIDER_TLS_CERT_PATH']) {
  delete process.env[key];
}

const packets = [];
const servers = [];
const report = {
  kind: 'two helpers on one computer; real HTTP and loopback UDP; synthetic data only',
  checkedAt: new Date().toISOString(),
  milestones: [],
  physicalLanVerified: false,
  browserPairingVerified: false,
  persistentStoreDisabled: true,
  inheritedTlsDisabled: true
};
const port = crypto.randomInt(49152, 65000);
function socketFactory() {
  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  const join = socket.addMembership.bind(socket);
  socket.addMembership = group => {
    join(group, '127.0.0.1');
    socket.setMulticastInterface('127.0.0.1');
  };
  const send = socket.send.bind(socket);
  socket.send = (bytes, ...args) => { packets.push(JSON.parse(bytes.toString())); send(bytes, ...args); };
  return socket;
}
async function helper() {
  const token = crypto.randomUUID();
  const server = createManagedDeliveryProviderServer({ authToken: token });
  servers.push(server);
  assert.equal(server.providerProtocol, 'http');
  assert.equal(server.getProviderState().persistentStore, false);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  assert.equal(await server.startLanDiscovery({
    multicastAddress: '239.255.77.78', multicastPort: port, socketFactory
  }), true, 'loopback multicast started');
  const base = `http://127.0.0.1:${server.address().port}/filtertube/managed-local-network/presence/`;
  return {
    server,
    async post(route, body, authenticated = true) {
      const response = await fetch(base + route, {
        method: 'POST', signal: AbortSignal.timeout(3000),
        headers: { 'content-type': 'application/json', ...(authenticated ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      });
      return { status: response.status, body: await response.json() };
    }
  };
}
async function eventually(probe, predicate, label) {
  const deadline = Date.now() + 5000;
  do {
    const value = await probe();
    if (predicate(value)) { report.milestones.push(label); return value; }
    await new Promise(resolve => setTimeout(resolve, 40));
  } while (Date.now() < deadline);
  throw new Error(`Timed out: ${label}`);
}
try {
  const parent = await helper();
  const receiver = await helper();
  const receiveToken = crypto.randomUUID();
  assert.equal((await receiver.post('discover', {}, false)).status, 401);
  report.milestones.push('HTTP helper requires configured bearer token');
  const announced = await receiver.post('announce', {
    candidateId: 'acceptance-receiver', label: 'Acceptance receiver', role: 'protected', receiveToken
  });
  assert.equal(announced.body.ok, true);
  const discovered = await eventually(() => parent.post('discover', {}), value =>
    value.body.candidates?.some(row => row.candidateId === 'acceptance-receiver'), 'opted-in receiver crosses helper boundaries');
  assert.equal(discovered.body.candidates[0].state, 'nearby-unpaired');
  assert.equal(JSON.stringify(discovered.body).includes(receiveToken), false);
  assert.equal((await receiver.post('invitations/pull', { candidateId: 'acceptance-receiver', receiveToken: 'wrong' })).status, 403);
  const invitation = await parent.post('invite', {
    candidateId: 'acceptance-receiver', pairingCode: 'ABCD', inviterLabel: 'Acceptance parent'
  });
  assert.equal(invitation.body.ok, true);
  const pulled = await eventually(() => receiver.post('invitations/pull', {
    candidateId: 'acceptance-receiver', receiveToken
  }), value => value.body.invitations?.length === 1, 'pairing invitation reaches receiver with its local token');
  assert.equal(pulled.body.invitations[0].pairingCode, 'ABCD');
  assert.equal((await receiver.post('withdraw', { candidateId: 'acceptance-receiver', receiveToken })).body.ok, true);
  await eventually(() => parent.post('discover', {}), value => value.body.candidates?.length === 0, 'withdrawal removes the discovered receiver');
  assert.equal(JSON.stringify(packets).includes(receiveToken), false);
  for (const server of servers) {
    const state = server.getProviderState();
    assert.equal(state.localCandidateCount, 0);
    assert.equal(state.mailboxItemCount, 0);
  }
  report.milestones.push('UDP packets exclude receive token; discovery creates no settings delivery');
  report.ok = true;
} catch (error) {
  report.ok = false;
  report.error = error.message;
  process.exitCode = 1;
} finally {
  for (const server of servers) {
    server.stopLanDiscovery();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
  if (process.argv[2]) await fs.writeFile(process.argv[2], JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
