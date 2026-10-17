import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createManagedDeliveryProviderServer } from '../../scripts/managed-delivery-provider.mjs';

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = x => JSON.parse(JSON.stringify(x));
const identities = family => ({ sourceDeviceId: 'parent-device', sourceProfileId: 'parent-account', targetDeviceId: 'receiving-family-device', targetProfileId: `child-${family}` });
function assertIdentity(actual, expected) {
  for (const key of ['sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId']) assert.equal(actual[key], expected[key], key);
}
function link(family) {
  return { linkId: `link-${family}`, remoteDeviceId: 'parent-device', localRole: 'replica', remoteRole: 'source', linkType: 'managed_link',
    sourceDeviceId: 'parent-device', sourceProfileId: 'parent-account', sourcePublicKeyId: 'parent-key', keyVersion: 1,
    policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: `child-${family}`, allowedScopes: ['keywords'], syncOnProfileOpen: true, lockedChildMode: 'allow_trusted_updates' } };
}
function item(family, transport) {
  const common = { ...identities(family), linkId: `link-${family}`, scope: 'keywords', revision: 2, policyHash: `sha256:${family}`, sourcePublicKeyId: 'parent-key', keyVersion: 1 };
  return transport === 'mailbox'
    ? { ...common, schema: 'filtertube_managed_mailbox_item', version: 1, mailboxItemId: `mailbox-${family}`, encryptedDek: 'synthetic-sealed-key', nonce: 'synthetic-nonce', ciphertext: 'synthetic-sealed-data', ciphertextHash: 'sha256:ciphertext' }
    : { ...common, candidateId: `candidate-${family}`, schema: 'filtertube_managed_local_network_candidate', version: 1, envelope: { ...common, type: 'filtertube_managed_policy', integrity: { signature: 'synthetic-signature-preserved' }, payload: { scope: 'keywords', surface: 'main', operations: [] } } };
}
async function fixture(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-receipt-identity-'));
  const storePath = path.join(dir, 'provider.json'), authToken = randomUUID();
  let server;
  async function start() {
    // Explicit temp store/token isolate this synthetic fixture. Exclude inherited
    // TLS paths only while constructing its loopback HTTP server, then restore.
    const tlsKeys = ['FILTERTUBE_PROVIDER_TLS_KEY_PATH', 'FILTERTUBE_PROVIDER_TLS_CERT_PATH'];
    const prior = Object.fromEntries(tlsKeys.map(key => [key, process.env[key]]));
    try {
      for (const key of tlsKeys) delete process.env[key];
      server = createManagedDeliveryProviderServer({ storePath, authToken });
    } finally {
      for (const key of tlsKeys) { if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key]; }
    }
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${server.address().port}/filtertube`;
  }
  async function stop() { if (server?.listening) await new Promise(resolve => server.close(resolve)); }
  function clients(baseUrl) {
    const box = { URL, AbortController, setTimeout, clearTimeout };
    box.window = box;
    vm.createContext(box);
    vm.runInContext(read('nanah_managed_mailbox_client'), box);
    vm.runInContext(read('nanah_managed_local_network_client'), box);
    vm.runInContext(read('nanah_managed_open_sync'), box);
    return { box,
      mailbox: box.FilterTubeManagedMailboxClient.createProvider({ endpointUrl: 'https://mailbox.filtertube.example/filtertube', authToken }, { fetch: (url, options) => fetch(`${baseUrl}${new URL(url).pathname.slice('/filtertube'.length)}`, options), adapter: { openManagedMailboxStorageItem: async row => row } }),
      local: box.FilterTubeManagedLocalNetworkClient.createProvider({ endpointUrl: baseUrl, authToken }, { fetch, AbortController, setTimeout, clearTimeout }) };
  }
  try { await run({ start, stop, clients, readStore: () => JSON.parse(fs.readFileSync(storePath, 'utf8')) }); }
  finally { await stop(); fs.rmSync(dir, { recursive: true, force: true }); }
}
async function produceMailbox(client, box, family) {
  const upload = await client.uploadManagedMailboxItems({ items: [item(family, 'mailbox')] });
  assert.equal(upload.ok, true);
  const helper = box.FilterTubeNanahManagedOpenSync.create({ getProvider: () => client });
  const result = await helper.runOpenSync({ links: [link(family)], activeProfileId: `child-${family}`, profilesV4: { profiles: { [`child-${family}`]: { type: 'child', parentProfileId: 'local-parent' } } }, targetDeviceId: identities(family).targetDeviceId,
    applyMailboxItem: async () => ({ accepted: true, applied: true, decision: 'accept_newer_revision' }) });
  assert.equal(result.appliedItemCount, 1);
  assert.equal(result.ackedItemCount, 1);
}
async function produceLocal(client, box, family) {
  const upload = await client.publishManagedPolicyCandidates({ candidates: [item(family, 'local')] });
  assert.equal(upload.ok, true);
  const request = { ...identities(family), linkId: `link-${family}`, allowedScopes: ['keywords'] };
  const wrongDevice = await client.discoverManagedPolicyCandidates({ ...request, targetDeviceId: 'unrelated-receiver-device' });
  assert.equal(wrongDevice.candidates.length, 0, 'the provider must not offer this candidate to another device');
  const discovered = await client.discoverManagedPolicyCandidates(request);
  assert.equal(discovered.candidates.length, 1);
  assert.equal(discovered.candidates[0].targetDeviceId, request.targetDeviceId);
  assert.deepEqual(clone(discovered.candidates[0].envelope), item(family, 'local').envelope, 'nested signed envelope is preserved without rewriting');
  Object.assign(box, {
    FilterTubeIO: {}, profilesV4Cache: { activeProfileId: `child-${family}` }, nanahStableDeviceId: identities(family).targetDeviceId,
    safeObject: x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, normalizeString: x => typeof x === 'string' ? x.trim() : '', normalizeNonNegativeInteger: x => Number.isInteger(Number(x)) && Number(x) >= 0 ? Number(x) : 0,
    getNanahManagedLocalNetworkProvider: () => client, getNanahManagedLocalNetworkEligibleLinks: () => [link(family)],
    buildNanahManagedLocalNetworkDiscoveryRequest: () => request,
    pullNanahManagedLocalNetworkCandidates: (_, query) => client.discoverManagedPolicyCandidates(query),
    handleNanahIncomingManagedLocalNetworkCandidate: async candidate => ({ accepted: true, applied: true, decision: 'accept_newer_revision', scope: candidate.scope, revision: candidate.revision, policyHash: candidate.policyHash }),
    recordManagedOpenSyncAckHistory: async () => ({}), persistNanahManagedLocalNetworkSyncState: async () => {}, checkNanahManagedLocalNetworkProviderHealth: async () => {}, renderNanahTrustedLinks() {}
  });
  const tab = read('tab-view'), start = tab.indexOf('    async function runNanahManagedLocalNetworkSync('), end = tab.indexOf('    async function loadNanahManagedSourceAckSyncState(', start);
  assert.ok(start > 0 && end > start);
  vm.runInContext(tab.slice(start, end), box);
  const state = await box.runNanahManagedLocalNetworkSync();
  assert.equal(state.acceptedCandidateCount, 1);
  assert.equal(state.ackedCandidateCount, 1);
}
for (const transport of ['mailbox', 'local']) {
  test(`${transport} actual receipt producer/client/provider persistence and readback retain four identities and separate sibling targets`, async () => {
    await fixture(async ({ start, stop, clients, readStore }) => {
      let c = clients(await start());
      for (const family of ['a', 'b']) {
        if (transport === 'mailbox') await produceMailbox(c.mailbox, c.box, family);
        else await produceLocal(c.local, c.box, family);
      }
      const stored = readStore()[transport === 'mailbox' ? 'mailboxAcks' : 'localAcks'];
      assert.equal(stored.length, 2);
      for (const family of ['a', 'b']) assertIdentity(stored.find(row => row.linkId === `link-${family}`), identities(family));
      await stop();
      c = clients(await start());
      for (const family of ['a', 'b']) {
        const result = await c[transport].pullManagedDeliveryAcks({ linkId: `link-${family}`, ...identities(family) });
        assert.equal(result.ok, true);
        assert.equal(result.acks.length, 1);
        assertIdentity(result.acks[0], identities(family));
        if (transport === 'local') assert.equal(result.acks[0].candidateId, result.acks[0].localNetworkCandidateId, 'candidate aliases remain intact');
      }
    });
  });
  test(`${transport} receipt missing receiver ID remains missing despite outer request identity`, async () => {
    await fixture(async ({ start, stop, clients, readStore }) => {
      let c = clients(await start());
      const record = { ...identities('a'), linkId: 'link-a', mailboxItemId: 'missing-mailbox', candidateId: 'missing-candidate', scope: 'keywords', revision: 3, policyHash: 'sha256:missing', accepted: true, applied: true, ackState: 'delivered' };
      delete record.targetDeviceId;
      const outer = { ...identities('a'), records: [record] };
      const result = transport === 'mailbox' ? await c.mailbox.ackMailboxItems(outer) : await c.local.ackLocalNetworkCandidates(outer);
      assert.equal(result.ok, true);
      const stored = readStore()[transport === 'mailbox' ? 'mailboxAcks' : 'localAcks'][0];
      assert.equal(stored.targetDeviceId, '', 'provider must not infer per-record ID from outer metadata');
      await stop();
      c = clients(await start());
      const pulled = await c[transport].pullManagedDeliveryAcks({ linkId: 'link-a' });
      assert.equal(pulled.acks.length, 1);
      assert.equal(pulled.acks[0].targetDeviceId, '', 'source helper receives missing identity for rejection');
      assert.equal(pulled.acks[0].targetProfileId, 'child-a');
    });
  });
}

test('Home Pickup does not infer a missing candidate receiver ID from its nested signed envelope', async () => {
  await fixture(async ({ start, clients, readStore }) => {
    const c = clients(await start()), candidate = item('a', 'local');
    delete candidate.targetDeviceId;
    assert.equal((await c.local.publishManagedPolicyCandidates({ candidates: [candidate] })).ok, true);
    const stored = readStore().localCandidates[0];
    assert.equal(stored.targetDeviceId, '');
    assert.equal(stored.envelope.targetDeviceId, identities('a').targetDeviceId);
    const actualDeviceQuery = await c.local.discoverManagedPolicyCandidates({ ...identities('a'), linkId: 'link-a' });
    assert.equal(actualDeviceQuery.candidates.length, 0);
    const unscopedReadback = await c.local.discoverManagedPolicyCandidates({ linkId: 'link-a' });
    assert.equal(unscopedReadback.candidates.length, 1);
    assert.equal(unscopedReadback.candidates[0].targetDeviceId, '');
    assert.deepEqual(clone(unscopedReadback.candidates[0].envelope), candidate.envelope);
  });
});
