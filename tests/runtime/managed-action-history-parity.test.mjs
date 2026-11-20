import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { familyFixture } from './helpers/managed-sync-fixtures.mjs';

// The worker writes the same managed-history rows as the dashboard: managed_action_history.js is a
// copy of tab-view.js's functions. Any edit to one side fails here until the other matches.
const read = file => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const dashboard = read('js/tab-view.js');
const worker = read('js/managed_action_history.js');

function block(source, name) {
    const start = source.search(new RegExp(`\\n    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, `${name} missing`);
    const end = source.indexOf('\n    }\n', start);
    return source.slice(start, end + 7)
        .replace('const io = window.FilterTubeIO || {};', 'const io = getIO();')
        .replace(/\n        profilesV4Cache = \{[\s\S]*?\};/, '');
}

test('every history function in the worker copy matches tab-view.js', () => {
    const names = [...worker.matchAll(/\n    (?:async )?function ([A-Za-z0-9_]+)\(/g)].map(match => match[1]);
    assert.ok(names.includes('recordManagedNanahPolicyValidationHistory') && names.includes('recordManagedOpenSyncAckHistory'));
    for (const name of names) assert.equal(block(worker, name), block(dashboard, name), name);
    for (const constant of [...worker.matchAll(/\n    const (MANAGED_[A-Z_]+) = /g)].map(match => match[1])) {
        const line = source => source.slice(source.indexOf(`const ${constant} = `)).split(/;\n/)[0];
        assert.equal(line(worker), line(dashboard), constant);
    }
});

test('a worker pickup leaves a managed-history row on the child profile', async () => {
    const f = await familyFixture();
    const vm = await import('node:vm');
    vm.runInContext(read('js/managed_action_history.js'), f.box, { filename: 'managed_action_history.js' });
    const { create } = (await import('node:module')).createRequire(import.meta.url)('../../js/managed_update_receiver.js');
    const receiver = create({ get: f.get, set: f.set, adapter: f.adapter, openSync: f.box.FilterTubeNanahManagedOpenSync,
        history: f.box.FilterTubeManagedActionHistory });
    await receiver.runPickup({ courierItems: [await f.sealedItem()], selfControlActive: async () => false });
    const rows = f.store.ftProfilesV4.profiles.Child.managedActionHistory || [];
    assert.ok(rows.some(row => row.schema === 'filtertube_managed_action_history' && row.result === 'accepted'
        && row.trustedLinkId === f.link.linkId), JSON.stringify(rows.map(row => row.actionType)));
    const bad = await familyFixture();
    vm.runInContext(read('js/managed_action_history.js'), bad.box);
    const rejecting = create({ get: bad.get, set: bad.set, adapter: bad.adapter, openSync: bad.box.FilterTubeNanahManagedOpenSync,
        history: bad.box.FilterTubeManagedActionHistory });
    bad.store.ftNanahTrustedLinks[0].sourcePublicKeyId = 'other-key';
    await rejecting.runPickup({ courierItems: [await bad.sealedItem()], selfControlActive: async () => false });
    // A link that no longer matches is refused before any history is possible; a signature failure is recorded.
    const forged = await familyFixture();
    vm.runInContext(read('js/managed_action_history.js'), forged.box);
    const other = await forged.adapter.createManagedNanahSigningKeyPair({});
    forged.store.ftNanahTrustedLinks[0].sourcePublicKeyJwk = other.sourcePublicKeyJwk;
    const r = create({ get: forged.get, set: forged.set, adapter: forged.adapter, openSync: forged.box.FilterTubeNanahManagedOpenSync,
        history: forged.box.FilterTubeManagedActionHistory });
    await r.runPickup({ courierItems: [await forged.sealedItem()], selfControlActive: async () => false });
    const forgedRows = forged.store.ftProfilesV4.profiles.Child.managedActionHistory || [];
    assert.ok(forgedRows.some(row => row.result === 'rejected' && row.reason === 'signature_invalid'), JSON.stringify(forgedRows));
    assert.ok(forgedRows.some(row => row.summary?.remoteFailedAttempts === 1), 'the failed-attempt counter is the dashboard\'s');
});
