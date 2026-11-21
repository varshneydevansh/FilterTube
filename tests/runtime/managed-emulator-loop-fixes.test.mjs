import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { familyFixture } from './helpers/managed-sync-fixtures.mjs';

// SEAMLESS_SYNC_SPEC.md §9 and §13 (Android 7c8961aef, 764da5c65, c31561933, 7e212cf3e, 3ebf75900).
const require = createRequire(import.meta.url);
const Courier = require('../../js/managed_courier.js');
const Doorbell = require('../../js/managed_doorbell.js');
const tabView = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const fn = name => {
    const start = tabView.search(new RegExp(`\\n    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, name);
    return tabView.slice(start, tabView.indexOf('\n    }\n', start) + 7);
};
const studyLink = { allowedScopes: ['keywords', 'time_limits'] };
const study = extra => ({ version: 1, activePackIds: [], packEdits: {}, focus: { roundMinutes: 25, breakMinutes: 5, dailyGoalMinutes: 120 },
    plan: null, lock: null, savedListMode: null, breakMode: 'rest', progress: {}, weekView: null, ...extra });

test('status per Send: the newest Send summarises its items and the worst state wins', () => {
    const box = { safeArray: v => (Array.isArray(v) ? v : []), normalizeString: v => (typeof v === 'string' ? v.trim() : '') };
    const rank = tabView.slice(tabView.indexOf('    const NANAH_OUTBOX_STATE_RANK'), tabView.indexOf('    function pickNanahOutboxStatusEntry'));
    vm.runInNewContext(`${rank}${fn('pickNanahOutboxStatusEntry')}; this.pick = pickNanahOutboxStatusEntry;`, box);
    const rows = [
        { linkId: 'L', createdAt: 1, state: 'rejected', entryId: 'old' },
        { linkId: 'L', createdAt: 5, state: 'up_to_date', entryId: 'a' },
        { linkId: 'L', createdAt: 5, state: 'rejected', entryId: 'b' },
        { linkId: 'L', createdAt: 5, state: 'up_to_date', entryId: 'c' },
        { linkId: 'other', createdAt: 9, state: 'queued', entryId: 'x' }
    ];
    assert.equal(box.pick(rows, 'L').entryId, 'b', 'a rejected item is never hidden behind up-to-date duplicates');
    assert.equal(box.pick(rows.filter(row => row.entryId !== 'b'), 'L').state, 'up_to_date', 'up to date only when every item is');
    assert.equal(box.pick(rows, 'none'), null);
});

test('re-pair: any save of the link id meets the reservation, and the new link continues the old revisions', () => {
    const save = fn('saveNanahTrustedLinkChecked');
    assert.match(save, /any write of this link id meets the removed link's reservation/);
    assert.match(save, /if \(record && stillReserved\)/, 'not limited to a brand-new row');
    assert.match(save, /'outgoingManagedPolicies', 'outboundManagedPolicyHistory', 'inboundManagedAckHistory'/);
    assert.match(fn('recordNanahRemovedSourceLink'), /record\.revisionState = /);
    assert.match(fn('recordNanahRemovedSourceLink'), /FilterTube_ManagedOutboxDropLink/, 'removing a link drops its queued updates');
});

test('a re-announce replaces a running courier', async () => {
    let abort = null;
    class Waiting {
        async host(_session, hooks) { this.hooks = hooks; }
        async join() {}
        async confirmSas() {}
        async send() {}
        async close() {}
    }
    const pending = Courier.host({ code: Doorbell.courierCode(), items: [{ schema: 'filtertube_managed_mailbox_item', mailboxItemId: 'm', ciphertext: 'c' }],
        nanah: { WebRtcDataChannelTransport: Waiting }, registerAbort: fn => { abort = fn; }, log: () => {} });
    await new Promise(resolve => setTimeout(resolve, 10));
    abort();
    assert.equal((await pending).reason, 'courier_replaced');
    const background = fs.readFileSync(new URL('../../js/managed_sync_background.js', import.meta.url), 'utf8');
    assert.match(background, /const previous = hostingFor\.get\(announce\.fromDeviceId\);\n\s+if \(previous\) \{\n\s+log\('courier_replaced', \{\}\);\n\s+previous\.abort\?\.\(\);/);
});

test('timetable rides on schedule as a known key, names its parent, and another parent\'s stays', async () => {
    const f = await familyFixture({ policyOverrides: studyLink, childStudy: study() });
    const payload = { scope: 'schedule', plan: null, breakMode: 'rest', timetable: { periods: [{ lane: 'maths', at: '18:00', note: { future: 1 } }] } };
    const result = await f.receiver.runPickup({ courierItems: [await f.sealedItem({ scope: 'schedule', payload })], selfControlActive: async () => false });
    assert.equal(result.acks[0].ackState, 'delivered', result.acks[0].reason);
    const timetable = f.store.ftProfilesV4.profiles.Child.study.timetable;
    assert.equal(timetable.setByParentId, 'Parent');
    assert.deepEqual(timetable.periods[0].note, { future: 1 }, 'unknown keys kept at every level');

    const other = await familyFixture({ policyOverrides: studyLink, childStudy: study({ timetable: { periods: [], setByParentId: 'Other parent' } }) });
    const refused = await other.receiver.runPickup({ courierItems: [await other.sealedItem({ scope: 'schedule', payload })], selfControlActive: async () => false });
    assert.equal(refused.acks[0].reason, 'timetable_owned_by_other_parent');
    assert.equal(other.store.ftProfilesV4.profiles.Child.study.timetable.setByParentId, 'Other parent');
});
