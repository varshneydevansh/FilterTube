import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
const require = createRequire(import.meta.url);
const harness = require('./fixtures/auto-sync-two-endpoint-harness.js');
const modules = {
    queueAPI: require('../../js/auto_sync_queue.js'),
    controllerAPI: require('../../js/device_auto_sync.js'),
    protocol: require('../../js/personal_sync.js'),
    notesAPI: require('../../js/video_notes_store.js'),
    managedAPI: require('../../js/managed_auto_sync.js'),
    runtimeAPI: require('../../js/personal_auto_sync_runtime.js')
};
const clone = value => structuredClone(value);
async function network(t) {
    const value = await harness.create({ modules, crypto: webcrypto });
    t.after(() => value.dispose()); return value;
}
async function queued(endpoint) { return (await endpoint.queue.read()).enrollments.flatMap(row => row.channels); }
async function noteHeads(endpoint, videoId) { return (await endpoint.readNote(videoId))?.versions.map(version => version.text); }
const dataMessages = endpoint => endpoint.sent.filter(message => message.schema === modules.protocol.MESSAGE_SCHEMA);

test('two production controllers enroll reciprocal independent keys and produce real signed Applied receipts', async t => {
    const n = await network(t); const beforeA = await n.a.readRoot(), beforeB = await n.b.readRoot();
    await n.enroll();
    const [ga] = await n.a.grants(), [gb] = await n.b.grants();
    assert.equal(ga.grant.remoteGrantId, gb.grant.localGrantId);
    assert.equal(gb.grant.remoteGrantId, ga.grant.localGrantId);
    assert.notEqual(ga.privateKeyJwk.d, gb.privateKeyJwk.d);
    assert.equal(ga.confirmed, true); assert.equal(gb.confirmed, false);
    assert.equal(n.a.confirmations.length, 1); assert.equal(n.b.confirmations.length, 1);
    await n.a.saveNote('हिन्दी 🎵\n1:30 Parent’s note');
    await n.cycle({ rounds: 3 });
    assert.deepEqual(await noteHeads(n.b), ['हिन्दी 🎵\n1:30 Parent’s note']);
    assert.equal((await n.b.grants())[0].confirmed, true);
    assert.ok(n.b.sent.some(message => message.schema === modules.runtimeAPI.ACK && message.status === 'applied' && message.signature));
    assert.equal((await queued(n.a))[0].status, 'applied');
    assert.equal((await n.a.controller.view()).personal[0].status, 'Up to date');
    const wire = JSON.stringify([...n.a.sent, ...n.b.sent]);
    for (const secret of ['"d":', 'private-pin-A', 'private-pin-B', 'child-pin-A', 'child-pin-B', 'local-token-A', 'local-token-B']) assert.equal(wire.includes(secret), false, secret);
    assert.deepEqual((await n.a.readRoot()).profiles['child-A'], beforeA.profiles['child-A']);
    assert.deepEqual((await n.b.readRoot()).profiles['child-B'], beforeB.profiles['child-B']);
});

test('filter additions/removals and all selected toggle/filter groups round-trip without overwriting local account security', async t => {
    const n = await network(t); await n.enroll(); await n.cycle({ rounds: 2 });
    await n.a.editProfile(profile => {
        profile.main.channels = [{ id: 'UC-alpha', name: 'Alpha' }];
        profile.main.keywords = [{ word: 'spoiler', exact: true }];
        profile.main.videoIds = ['abcdefghijk'];
        profile.settings.hideShorts = true; profile.settings.disableAutoplay = true;
        profile.settings.contentFilters.views = { enabled: true, minViews: 1000 };
        profile.settings.categoryFilters = { enabled: true, mode: 'block', selected: ['music'] };
        profile.settings.languageFilters = { enabled: true, mode: 'allow', selected: ['hi', 'en'] };
        profile.kids.blockedChannels = [{ id: 'UC-kids' }];
    });
    await n.cycle({ rounds: 3 });
    assert.deepEqual(modules.protocol.snapshotSettings(await n.a.profile()), modules.protocol.snapshotSettings(await n.b.profile()));
    assert.equal((await n.b.profile()).security.pinVerifier, 'private-pin-B');
    assert.equal((await n.b.profile()).privateToken, 'local-token-B');
    await n.a.editProfile(profile => {
        profile.main.channels = []; profile.main.keywords = []; profile.main.videoIds = [];
        profile.kids.blockedChannels = [];
        profile.settings.hideShorts = false; profile.settings.disableAutoplay = false;
        delete profile.settings.categoryFilters;
        profile.settings.contentFilters.views = { enabled: false, minViews: 0 };
    });
    await n.cycle({ rounds: 3 });
    const remote = await n.b.profile();
    assert.deepEqual(remote.main.channels, []); assert.deepEqual(remote.main.keywords, []); assert.deepEqual(remote.main.videoIds, []);
    assert.deepEqual(remote.kids.blockedChannels, []);
    assert.equal(remote.settings.hideShorts, false); assert.equal(remote.settings.disableAutoplay, false);
    assert.equal(Object.hasOwn(remote.settings, 'categoryFilters'), false);
    assert.deepEqual(remote.settings.contentFilters.views, { enabled: false, minViews: 0 });
});

test('durable offline queues coalesce only the latest snapshot and survive full queue/store/controller reconstruction', async t => {
    const n = await network(t); await n.enroll(); await n.cycle({ rounds: 2 }); n.disconnect();
    await n.a.editProfile(profile => { profile.settings.hideShorts = true; profile.main.channels = [{ id: 'UC-first' }]; });
    await n.a.saveNote('First offline draft'); await n.cycle();
    const first = (await queued(n.a))[0];
    await n.a.editProfile(profile => { profile.settings.hideShorts = false; profile.settings.hideComments = true; profile.main.channels = [{ id: 'UC-latest' }]; });
    await n.a.saveNote('Latest offline draft'); await n.cycle();
    const latest = (await queued(n.a))[0];
    assert.equal(latest.status, 'waiting'); assert.ok(latest.payload.envelope.sequence > first.payload.envelope.sequence);
    assert.notEqual(latest.payload.envelope.messageId, first.payload.envelope.messageId);
    assert.equal((await n.b.profile()).settings.hideComments, false); assert.equal(await n.b.readNote(), null);
    const oldQueue = n.a.queue, oldStore = n.a.notes, oldController = n.a.controller;
    await n.a.restart(); await n.b.restart();
    assert.notEqual(n.a.queue, oldQueue); assert.notEqual(n.a.notes, oldStore); assert.notEqual(n.a.controller, oldController);
    assert.deepEqual((await queued(n.a))[0], latest);
    const beforeReconnect = dataMessages(n.a).length;
    n.advance(); n.reconnect(); await n.cycle({ rounds: 3 });
    assert.deepEqual((await n.b.profile()).main.channels, [{ id: 'UC-latest' }]);
    assert.equal((await n.b.profile()).settings.hideShorts, false); assert.equal((await n.b.profile()).settings.hideComments, true);
    assert.deepEqual(await noteHeads(n.b), ['Latest offline draft']);
    const delivered = dataMessages(n.a).slice(beforeReconnect);
    assert.ok(delivered.length > 0);
    assert.equal(JSON.stringify(delivered).includes('First offline draft'), false);
    assert.equal((await queued(n.a))[0].status, 'applied');
});

test('a lost real receipt leaves Waiting, then authenticated duplicate delivery after restart confirms without applying twice', async t => {
    const n = await network(t); await n.enroll(); await n.cycle({ rounds: 2 });
    n.setTransport(item => item.from === 'B' && item.message.schema === modules.runtimeAPI.ACK ? undefined : item.deliver());
    await n.a.saveNote('Apply exactly once');
    await n.a.controller.run({ wake: true }); n.a.controller.dispose();
    assert.deepEqual(await noteHeads(n.b), ['Apply exactly once']);
    assert.equal((await queued(n.a))[0].status, 'waiting');
    assert.equal((await n.a.controller.view()).personal[0].status, 'Waiting for confirmation');
    const appliedNote = clone(await n.b.readNote()), applications = n.b.applies.length;
    const envelope = clone((await queued(n.a))[0].payload.envelope);
    await n.a.restart(); await n.b.restart(); n.setTransport(null); n.advance();
    await n.a.controller.run({ wake: true }); n.a.controller.dispose();
    assert.deepEqual(await n.b.readNote(), appliedNote); assert.equal(n.b.applies.length, applications);
    assert.deepEqual(dataMessages(n.a).at(-1), envelope);
    assert.equal((await queued(n.a))[0].status, 'applied');
});

test('asynchronous delivery cannot let an old real receipt acknowledge a newer queued snapshot', async t => {
    const n = await network(t); await n.enroll(); await n.cycle({ rounds: 2 });
    const mailbox = []; n.setTransport(item => { mailbox.push({ from: item.from, message: clone(item.message) }); });
    const take = schema => {
        const index = mailbox.findIndex(item => item.message.schema === schema);
        assert.ok(index >= 0, `Expected actual ${schema} from the opposite controller`);
        return mailbox.splice(index, 1)[0];
    };
    await n.a.saveNote('First delivered draft');
    await n.a.controller.run({ wake: true }); n.a.controller.dispose();
    const first = take(modules.protocol.MESSAGE_SCHEMA); await n.deliver(first.from, first.message);
    const oldReceipt = take(modules.runtimeAPI.ACK);
    assert.deepEqual(await noteHeads(n.b), ['First delivered draft']);
    await n.a.saveNote('Newer queued draft');
    await n.a.controller.run({ wake: true }); n.a.controller.dispose();
    const latest = take(modules.protocol.MESSAGE_SCHEMA);
    assert.ok(latest.message.sequence > oldReceipt.message.sequence);
    await n.deliver(oldReceipt.from, oldReceipt.message);
    assert.equal((await queued(n.a))[0].status, 'waiting');
    assert.equal((await queued(n.a))[0].payload.envelope.messageId, latest.message.messageId);
    await n.deliver(latest.from, latest.message);
    const currentReceipt = take(modules.runtimeAPI.ACK); await n.deliver(currentReceipt.from, currentReceipt.message);
    assert.deepEqual(await noteHeads(n.b), ['Newer queued draft']);
    assert.equal((await queued(n.a))[0].status, 'applied');
    assert.equal(currentReceipt.message.messageId, latest.message.messageId);
});

test('a receiver with saved local consent cannot publish until signed proof confirms the source adopted its grant', async t => {
    const n = await network(t); await n.enroll();
    assert.equal((await n.b.grants())[0].confirmed, false);
    await n.b.saveNote('Private receiver draft');
    await n.b.editProfile(profile => { profile.settings.hideComments = true; });
    await n.b.controller.run({ wake: true }); n.b.controller.dispose();
    assert.equal(dataMessages(n.b).length, 0);
    assert.equal((await n.a.profile()).settings.hideComments, false);
    assert.equal(await n.a.readNote(), null);
    await n.cycle({ rounds: 3 });
    assert.equal((await n.b.grants())[0].confirmed, true);
    assert.equal((await n.a.profile()).settings.hideComments, true);
    assert.deepEqual(await noteHeads(n.a), ['Private receiver draft']);
});

test('simultaneous disjoint settings and content-filter edits converge without losing either device change', async t => {
    const n = await network(t); await n.enroll(); await n.cycle({ rounds: 2 }); n.disconnect();
    await n.a.editProfile(profile => {
        profile.settings.hideShorts = true;
        profile.settings.contentFilters.duration = { enabled: true, minMinutes: 12 };
        profile.main.channels = [{ id: 'UC-preserve-A' }];
    });
    await n.b.editProfile(profile => {
        profile.settings.hideComments = true;
        profile.settings.contentFilters.views = { enabled: true, minViews: 5000 };
        profile.main.keywords = [{ word: 'preserve-B', exact: false }];
    });
    await n.cycle(); await n.a.restart(); await n.b.restart(); n.reconnect(); n.advance();
    await n.cycle({ rounds: 4, parallel: true });
    const a = modules.protocol.snapshotSettings(await n.a.profile()), b = modules.protocol.snapshotSettings(await n.b.profile());
    assert.deepEqual(a, b);
    assert.equal(a.settings.hideShorts, true); assert.equal(a.settings.hideComments, true);
    assert.deepEqual(a.settings.contentFilters.duration, { enabled: true, minMinutes: 12 });
    assert.deepEqual(a.settings.contentFilters.views, { enabled: true, minViews: 5000 });
    assert.deepEqual(a.main.channels, [{ id: 'UC-preserve-A' }]);
    assert.deepEqual(a.main.keywords, [{ word: 'preserve-B', exact: false }]);
    assert.equal((await n.a.controller.view()).personal[0].needsReview, false);
    assert.equal((await n.b.controller.view()).personal[0].needsReview, false);
});

test('simultaneous rule-list changes retain each local choice and the signed remote proposal for explicit review', async t => {
    const n = await network(t); await n.enroll(); await n.cycle({ rounds: 2 }); n.disconnect();
    await n.a.editProfile(profile => { profile.main.channels = [{ id: 'UC-choice-A' }]; });
    await n.b.editProfile(profile => { profile.main.channels = [{ id: 'UC-choice-B' }]; });
    await n.a.saveNote('Wait until settings review'); await n.cycle(); n.reconnect(); n.advance();
    await n.a.controller.run({ wake: true }); n.a.controller.dispose();
    assert.deepEqual((await n.a.profile()).main.channels, [{ id: 'UC-choice-A' }]);
    assert.deepEqual((await n.b.profile()).main.channels, [{ id: 'UC-choice-B' }]);
    assert.equal(await n.b.readNote(), null);
    const pending = (await n.b.grants())[0].conflict;
    assert.deepEqual(pending.message.payload.settings.main.channels, [{ id: 'UC-choice-A' }]);
    assert.deepEqual(pending.fields, ['main.channels']);
    assert.equal((await queued(n.a))[0].reason, 'needs_review');
    await n.b.restart();
    assert.deepEqual((await n.b.grants())[0].conflict, pending);
    await n.b.controller.resolvePersonal((await n.b.grants())[0].grant.localGrantId, 'remote');
    n.b.controller.dispose(); n.a.controller.dispose();
    assert.deepEqual((await n.b.profile()).main.channels, [{ id: 'UC-choice-A' }]);
    assert.deepEqual(await noteHeads(n.b), ['Wait until settings review']);
    assert.equal((await queued(n.a))[0].status, 'applied');
});

test('Notes save/edit/delete conflicts preserve causal heads across offline restart and converge after explicit editing', async t => {
    const n = await network(t); await n.enroll({ notes: true });
    await n.a.saveNote('Original note'); await n.cycle({ rounds: 2 });
    const original = clone(dataMessages(n.a)[0]);
    n.disconnect(); await n.a.saveNote('Offline A edit'); await n.b.saveNote(null); await n.cycle();
    await n.a.restart(); await n.b.restart(); n.reconnect(); n.advance(); await n.cycle({ rounds: 4, parallel: true });
    assert.deepEqual(new Set(await noteHeads(n.a)), new Set(['Offline A edit', null]));
    assert.deepEqual(new Set(await noteHeads(n.b)), new Set(['Offline A edit', null]));
    assert.deepEqual((await n.a.readNote()).versions, (await n.b.readNote()).versions);
    await n.a.saveNote('Resolved from both versions'); await n.cycle({ rounds: 3 });
    assert.deepEqual(await noteHeads(n.a), ['Resolved from both versions']);
    assert.deepEqual(await noteHeads(n.b), ['Resolved from both versions']);
    await n.deliver('A', original);
    assert.deepEqual(await noteHeads(n.b), ['Resolved from both versions']);
    await n.a.saveNote(null); await n.cycle({ rounds: 3 });
    assert.deepEqual(await noteHeads(n.b), [null]);
});

test('no profile payload is exchanged without both consents, and verified trust alone is insufficient', async t => {
    for (const rejector of ['a', 'b']) {
        const n = await network(t); n[rejector].confirm = false;
        await n.a.saveNote('Private until both approve'); await n.a.editProfile(profile => { profile.settings.hideShorts = true; });
        await n.enroll(); await n.cycle({ rounds: 2 });
        assert.deepEqual(await n.a.grants(), []); assert.deepEqual(await n.b.grants(), []);
        assert.equal(dataMessages(n.a).length, 0); assert.equal(dataMessages(n.b).length, 0);
        assert.equal(await n.b.readNote(), null); assert.equal((await n.b.profile()).settings.hideShorts, false);
    }
});

test('selected settings and Notes areas remain separate across durable restart', async t => {
    for (const area of ['settings', 'notes']) {
        const n = await network(t); await n.enroll({ [area]: true }); await n.cycle({ rounds: 2 });
        await n.a.saveNote('A private note'); await n.a.editProfile(profile => { profile.settings.hideShorts = true; });
        await n.a.restart(); await n.b.restart(); await n.cycle({ rounds: 3 });
        assert.equal((await n.b.profile()).settings.hideShorts, area === 'settings');
        assert.deepEqual(await noteHeads(n.b), area === 'notes' ? ['A private note'] : undefined);
        const message = dataMessages(n.a).at(-1);
        assert.deepEqual(Object.keys(message.payload), [area]);
    }
});

test('an idle converged pair does not republish snapshots or advance signed revisions indefinitely', async t => {
    const n = await network(t); await n.enroll(); await n.a.saveNote('Stable'); await n.cycle({ rounds: 4 });
    const before = [dataMessages(n.a).length, dataMessages(n.b).length];
    const revisions = [(await n.a.grants())[0].sequence, (await n.b.grants())[0].sequence];
    await n.cycle({ rounds: 5, parallel: true });
    assert.deepEqual([dataMessages(n.a).length, dataMessages(n.b).length], before);
    assert.deepEqual([(await n.a.grants())[0].sequence, (await n.b.grants())[0].sequence], revisions);
});
