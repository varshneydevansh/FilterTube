import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { familyFixture } from './helpers/managed-sync-fixtures.mjs';

// SEAMLESS_SYNC_SPEC.md §9 (FilterTubeApp a0045def1; Android 7c3af4ec6, ac09f3778): the child side of
// pack copies, "Pack channels only", unknown study keys and the timetable, and unresolved packs.
// The sender side is in study-family-scopes.test.mjs.
const require = createRequire(import.meta.url);
const Sync = require('../../js/managed_sync_background.js');
const UC = c => `UC${c.repeat(22)}`;
const studyLink = { allowedScopes: ['keywords', 'time_limits'] };
const STUDY_SELF = { version: 1, activePackIds: ['in_gate', 'kept_pack'], packEdits: {}, focus: { roundMinutes: 25, breakMinutes: 5, dailyGoalMinutes: 120 },
    plan: null, lock: null, savedListMode: 'blocklist', breakMode: 'rest', progress: { phone: { '2026-11-20': 30 } }, weekView: null,
    packCopies: { kept_pack: { channels: [{ channelId: UC('k'), name: 'Kept' }], topics: [], blockedWords: [] }, dropped_pack: { channels: [] } },
    packChannelsOnly: true, childOnlyKey: 'stays', timetable: { lanes: ['old'] } };

test('study: extra keys, pack copies (keeping the child\'s for active packs) and packChannelsOnly apply as §9.2 says', async () => {
    const f = await familyFixture({ policyOverrides: studyLink, childStudy: STUDY_SELF,
        studyPacks: { load: async () => ({ packs: [{ id: 'in_gate' }] }) } });
    const payload = { scope: 'study', replace: true, activePackIds: ['in_gate', 'kept_pack', 'interview_finance'], packEdits: {},
        focus: { roundMinutes: 50, breakMinutes: 10, dailyGoalMinutes: 180 }, weekView: false,
        packCopies: { in_gate: { channels: [{ channelId: UC('g'), name: 'GATE' }], topics: ['dbms'], blockedWords: [] } },
        packChannelsOnly: false, extra: { futureStudyKey: { nested: [1, 2] } } };
    const result = await f.receiver.runPickup({ courierItems: [await f.sealedItem({ scope: 'study', payload })], selfControlActive: async () => false });
    assert.equal(result.acks[0].ackState, 'delivered', result.acks[0].reason);
    const study = f.store.ftProfilesV4.profiles.Child.study;
    assert.deepEqual(Object.keys(study.packCopies).sort(), ['in_gate', 'kept_pack'], 'parent copies + the child\'s copy of a still-active pack');
    assert.equal(study.packChannelsOnly, false, 'an explicit false is written');
    assert.deepEqual(study.futureStudyKey, { nested: [1, 2] });
    assert.equal(study.childOnlyKey, 'stays');
    assert.deepEqual(study.progress, STUDY_SELF.progress, 'progress stays the child\'s');
    assert.deepEqual(study.timetable, { lanes: ['old'] }, 'study never changes the schedule\'s timetable');
    assert.deepEqual(study.activePackIds, ['in_gate', 'kept_pack', 'interview_finance'], 'an unknown pack is kept, not dropped');
    assert.deepEqual(result.acks[0].unresolvedPackIds, ['interview_finance'], '§9.3');
});

test('packChannelsOnly null restores the default; an older sender changes nothing it did not send', async () => {
    const f = await familyFixture({ policyOverrides: studyLink, childStudy: STUDY_SELF });
    const base = { scope: 'study', replace: true, activePackIds: ['in_gate'] };
    await f.receiver.runPickup({ courierItems: [await f.sealedItem({ scope: 'study', payload: { ...base, packChannelsOnly: null } })], selfControlActive: async () => false });
    assert.equal('packChannelsOnly' in f.store.ftProfilesV4.profiles.Child.study, false);
    const g = await familyFixture({ policyOverrides: studyLink, childStudy: STUDY_SELF });
    await g.receiver.runPickup({ courierItems: [await g.sealedItem({ scope: 'study', payload: base })], selfControlActive: async () => false });
    const study = g.store.ftProfilesV4.profiles.Child.study;
    assert.equal(study.packChannelsOnly, true);
    assert.deepEqual(Object.keys(study.packCopies).sort(), ['dropped_pack', 'kept_pack']);
});

test('schedule: timetable replaces, null removes, absent leaves it', async () => {
    const run = async payload => {
        const f = await familyFixture({ policyOverrides: studyLink, childStudy: STUDY_SELF });
        const result = await f.receiver.runPickup({ courierItems: [await f.sealedItem({ scope: 'schedule', payload: { scope: 'schedule', plan: null, breakMode: 'rest', ...payload } })],
            selfControlActive: async () => false });
        assert.equal(result.acks[0].ackState, 'delivered', result.acks[0].reason);
        return f.store.ftProfilesV4.profiles.Child.study;
    };
    // §9.2 (7e212cf3e): the timetable names its signing parent, like the plan.
    assert.deepEqual((await run({ timetable: { lanes: ['maths 6pm'] } })).timetable, { lanes: ['maths 6pm'], setByParentId: 'Parent' });
    assert.equal('timetable' in (await run({ timetable: null })), false);
    assert.deepEqual((await run({})).timetable, { lanes: ['old'] });
});

test('malformed §9 fields are refused', async () => {
    for (const payload of [
        { scope: 'study', activePackIds: [], packCopies: [] },
        { scope: 'study', activePackIds: [], packCopies: { 'bad id': {} } },
        { scope: 'study', activePackIds: [], packChannelsOnly: 'yes' },
        { scope: 'study', activePackIds: [], extra: { lock: {} } },
        { scope: 'study', activePackIds: [], extra: { timetable: {} } },
        { scope: 'schedule', plan: null, timetable: [] }
    ]) {
        const f = await familyFixture({ policyOverrides: studyLink, childStudy: STUDY_SELF });
        const result = await f.receiver.runPickup({ courierItems: [await f.sealedItem({ scope: payload.scope, payload })], selfControlActive: async () => false });
        assert.equal(result.acks[0].ackState, 'rejected', JSON.stringify(payload));
        assert.deepEqual(f.store.ftProfilesV4.profiles.Child.study.activePackIds, STUDY_SELF.activePackIds);
    }
});

test('the parent keeps unresolved packs on the outbox entry', () => {
    const now = 1000;
    const item = { schema: 'filtertube_managed_mailbox_item', version: 1, mailboxItemId: 'm', linkId: 'L', targetDeviceId: 'c', scope: 'study', ciphertext: 'x' };
    const box = Sync.enqueueOutbox(Sync.emptyOutbox(), [Sync.outboxRow(item, { linkId: 'L', remoteDeviceId: 'c' }, {}, now)], now);
    const { outbox } = Sync.applyAcks(box, [{ mailboxItemId: 'm', linkId: 'L', ackState: 'delivered', accepted: true, applied: true,
        unresolvedPackIds: ['interview_finance', 'bad id'] }], 'c', () => 'c', now);
    assert.deepEqual(outbox.entries[0].unresolvedPackIds, ['interview_finance']);
});
