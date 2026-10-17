import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const start = source.indexOf('    async function sendManagedParentPolicyToVerifiedDevices(');
const end = source.indexOf('    async function ', start + 15);
assert.ok(start > 0 && end > start);
const runtime = source.slice(start, end);

function fixture({ nextActor = 'child', reparent = false } = {}) {
  const root = (actor, latest) => ({ activeProfileId: actor, profiles: {
    parent: { type: 'account' }, other: { type: 'account' },
    child: { type: 'child', parentProfileId: reparent && latest ? 'other' : 'parent' }
  } });
  let loads = 0;
  const calls = { signs: 0, operations: 0, toasts: [], unlocks: [] };
  const context = {
    window: { FilterTubeIO: { loadProfilesV4: async () => { loads += 1; return root(loads === 1 ? 'parent' : nextActor, loads > 1); } } },
    activeProfileId: 'parent',
    safeArray: value => Array.isArray(value) ? value : [],
    safeObject: value => value && typeof value === 'object' ? value : {},
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    getProfileType: (value, id) => value.profiles[id]?.type,
    ensureProfileUnlocked: async (_, actor) => { calls.unlocks.push(actor); return true; },
    ensureNanahManagedSigningKeyPair: async () => { calls.signs += 1; },
    UIComponents: { showToast: text => calls.toasts.push(text) },
    tabViewUiText: (_, fallback) => fallback,
    nanahManagedLivePolicy: { createSendOperation() { calls.operations += 1; throw new Error('must not start'); } },
    getNanahManagedMailboxProvider: () => null,
    getNanahManagedLocalNetworkProvider: () => null,
    hasNanahManagedMailboxUploadWriter: () => false,
    hasNanahManagedLocalNetworkDeliveryWriter: () => false,
    canActiveProfileManageProfile: (value, id) => value.profiles[id]?.parentProfileId === value.activeProfileId
  };
  vm.runInNewContext(runtime, context);
  return { calls, send: context.sendManagedParentPolicyToVerifiedDevices };
}

test('switching to a child or another parent during approval/key preparation cancels before creating a send', async () => {
  for (const nextActor of ['child', 'other']) {
    const f = fixture({ nextActor });
    assert.equal(await f.send(['child']), null);
    assert.deepEqual(f.calls.unlocks, ['parent']);
    assert.equal(f.calls.signs, 1);
    assert.equal(f.calls.operations, 0);
    assert.match(f.calls.toasts[0], /active parent changed/);
  }
});

test('the original parent cannot send to a child whose ownership changed before the fresh send check', async () => {
  const f = fixture({ nextActor: 'parent', reparent: true });
  assert.equal(await f.send(['child']), null);
  assert.equal(f.calls.operations, 0);
  assert.match(f.calls.toasts[0], /No selected protected profile is manageable/);
});
