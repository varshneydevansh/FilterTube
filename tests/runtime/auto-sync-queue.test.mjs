import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const queue = require('../../js/auto_sync_queue.js');
const copy = value => structuredClone(value);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function fixture() {
    const data = {}, writes = [];
    let time = 1000, failure = false, tail = Promise.resolve();
    const dependencies = {
        get: async keys => Object.fromEntries(keys.filter(key => key in data).map(key => [key, copy(data[key])])),
        set: async values => { if (failure) throw Error('quota'); writes.push(copy(values)); Object.assign(data, copy(values)); },
        withLock: operation => { const result = tail.then(operation); tail = result.catch(() => {}); return result; },
        now: () => time
    };
    return { data, writes, instance: () => queue.create(dependencies), advance: delta => { time += delta; }, fail: value => { failure = value; } };
}
const enrollment = { enrollmentId: 'verified-child', binding: 'exact-parent-device-profile-key-scope-child-binding' };
async function ready(f, fingerprint = 'hash-1') {
    const engine = f.instance(); await engine.enroll(enrollment);
    const handle = await engine.enqueue(enrollment.enrollmentId, 'main', fingerprint, { rules: ['channel-a'] });
    return { engine, handle };
}
async function row(engine) { return (await engine.read()).enrollments[0].channels[0]; }

test('opt-in is required and enrollment identity is exact', async () => {
    const f = fixture(), engine = f.instance();
    await assert.rejects(engine.enqueue(enrollment.enrollmentId, 'main', 'hash', {}), /not_enrolled/);
    await engine.enroll(enrollment);
    await assert.rejects(engine.enqueue('VERIFIED-CHILD', 'main', 'hash', {}), /not_enrolled/);
    await engine.disable(enrollment.enrollmentId);
    await assert.rejects(engine.enqueue(enrollment.enrollmentId, 'main', 'hash', {}), /not_enrolled/);
});
test('offline failure persists across restart and retries only when due', async () => {
    const f = fixture(), { engine } = await ready(f); let attempts = 0;
    const result = await engine.run({ authorize: async () => true, send: async () => { attempts++; throw Error('offline'); } });
    assert.equal(result[0].status, 'waiting'); assert.equal((await row(engine)).dueAt, 2000);
    const restarted = f.instance();
    assert.deepEqual(await restarted.run({ authorize: async () => true, send: async () => { attempts++; } }), []);
    assert.equal(attempts, 1); f.advance(1000);
    await restarted.run({ authorize: async () => true, send: async () => { attempts++; return { status: 'applied' }; } });
    assert.equal(attempts, 2); assert.equal((await row(restarted)).status, 'applied');
    assert.equal(Object.hasOwn(await row(restarted), 'payload'), false);
});
test('dispatch is waiting until a separately authenticated apply receipt is recorded', async () => {
    const f = fixture(), { engine } = await ready(f); let sent;
    await engine.run({ authorize: async () => true, send: async item => { sent = item; return { status: 'waiting', reason: 'awaiting_receipt' }; } });
    assert.equal((await row(engine)).status, 'waiting');
    assert.equal(await engine.acknowledge(sent, { status: 'applied' }), true);
    assert.equal((await row(engine)).status, 'applied');
    assert.equal(await engine.acknowledge(sent, { status: 'applied' }), false);
});
test('unchanged content never republishes after apply and idle runs never write', async () => {
    const f = fixture(), { engine } = await ready(f);
    await engine.run({ authorize: async () => true, send: async () => ({ status: 'applied' }) });
    const writes = f.writes.length;
    assert.equal((await engine.enqueue(enrollment.enrollmentId, 'main', 'hash-1', { rules: ['channel-a'] })).changed, false);
    assert.deepEqual(await engine.run({ authorize: async () => true, send: async () => assert.fail('duplicate') }), []);
    assert.equal(f.writes.length, writes);
});
test('latest change coalesces while an older send is in flight without losing it', async () => {
    const f = fixture(), { engine } = await ready(f), sent = deferred(), response = deferred();
    const run = engine.run({ limit: 1, authorize: async () => true, send: async item => { sent.resolve(item); return response.promise; } });
    const previous = await sent.promise;
    await f.instance().enqueue(enrollment.enrollmentId, 'main', 'hash-2', { rules: ['channel-b'] });
    response.resolve({ status: 'applied' });
    assert.equal((await run)[0].current, false);
    assert.equal((await row(engine)).fingerprint, 'hash-2'); assert.equal((await row(engine)).status, 'pending');
    assert.equal(await engine.acknowledge(previous, { status: 'applied' }), false);
    let next;
    await engine.run({ authorize: async () => true, send: async item => { next = item; return { status: 'applied' }; } });
    assert.deepEqual(next.payload, { rules: ['channel-b'] });
});
test('revocation in flight drops payload and stale completion cannot re-enable the grant', async () => {
    const f = fixture(), { engine } = await ready(f), sent = deferred(), response = deferred();
    const run = engine.run({ authorize: async () => true, send: async item => { sent.resolve(item); return response.promise; } });
    const old = await sent.promise;
    await f.instance().disable(enrollment.enrollmentId);
    response.resolve({ status: 'applied' }); assert.equal((await run)[0].current, false);
    const disabled = (await engine.read()).enrollments[0];
    assert.equal(disabled.enabled, false); assert.deepEqual(disabled.channels, []);
    await engine.enroll(enrollment);
    await engine.enqueue(enrollment.enrollmentId, 'main', 'hash-1', { rules: ['new-grant'] });
    assert.equal(await engine.acknowledge(old, { status: 'applied' }), false);
});
test('remove/re-enroll and changed bindings create new epochs without resurrecting data', async () => {
    const f = fixture(), { engine, handle } = await ready(f);
    await engine.remove(enrollment.enrollmentId); await engine.enroll(enrollment);
    const next = await engine.enqueue(enrollment.enrollmentId, 'main', 'hash-1', {});
    assert.notEqual(handle.epoch, next.epoch);
    assert.equal(await engine.acknowledge(handle, { status: 'applied' }), false);
    await engine.enroll({ ...enrollment, binding: 'different-child' });
    assert.deepEqual((await engine.read()).enrollments[0].channels, []);
});
test('denied authorization prevents dispatch and post-send revocation cannot claim applied', async () => {
    const f = fixture(), { engine } = await ready(f); let checks = 0;
    await engine.run({ authorize: async () => false, send: async () => assert.fail('unauthorized') });
    assert.equal((await row(engine)).reason, 'authorization_required'); f.advance(1000);
    await engine.run({ authorize: async () => ++checks === 1, send: async () => ({ status: 'applied' }) });
    assert.equal((await row(engine)).status, 'waiting'); assert.equal((await row(engine)).reason, 'authorization_changed');
});
test('revocation during asynchronous authorization prevents dispatch', async () => {
    const f = fixture(), { engine } = await ready(f), checked = deferred(), authorization = deferred();
    const run = engine.run({ authorize: async () => { checked.resolve(); return authorization.promise; }, send: async () => assert.fail('revoked') });
    await checked.promise; await f.instance().remove(enrollment.enrollmentId); authorization.resolve(true);
    assert.equal((await run)[0].current, false);
    assert.deepEqual((await engine.read()).enrollments, []);
});
test('two runners serialize claims but do not hold the origin lock across the network', async () => {
    const f = fixture(), { engine } = await ready(f), sent = deferred(), response = deferred();
    const run = engine.run({ authorize: async () => true, send: async item => { sent.resolve(item); return response.promise; } });
    await sent.promise;
    assert.deepEqual(await f.instance().run({ authorize: async () => true, send: async () => assert.fail('duplicate claim') }), []);
    await f.instance().enroll({ enrollmentId: 'other', binding: 'other-profile' });
    response.resolve({ status: 'applied' }); await run;
    assert.equal((await engine.read()).enrollments.length, 2);
});
test('interrupted lease retries after restart; the older late completion cannot win', async () => {
    const f = fixture(), { engine } = await ready(f), sent = deferred(), response = deferred();
    const first = engine.run({ limit: 1, authorize: async () => true, send: async item => { sent.resolve(item); return response.promise; } });
    await sent.promise; f.advance(30000);
    const second = await f.instance().run({ authorize: async () => true, send: async () => ({ status: 'waiting', reason: 'new-attempt' }) });
    assert.equal(second[0].current, true); response.resolve({ status: 'applied' });
    assert.equal((await first)[0].current, false);
    assert.equal((await row(engine)).reason, 'new-attempt'); assert.equal((await row(engine)).status, 'waiting');
});
test('retry delay grows but is bounded, and rejection is terminal for unchanged content', async () => {
    const f = fixture(), { engine } = await ready(f);
    for (let attempt = 0; attempt < 12; attempt++) {
        await engine.run({ authorize: async () => true, send: async () => ({ status: 'waiting' }) });
        const pending = await row(engine), delay = Math.min(300000, 1000 * 2 ** attempt);
        const previous = pending.dueAt - delay; assert.ok(previous >= 1000); f.advance(delay);
    }
    await engine.run({ authorize: async () => true, send: async () => ({ status: 'rejected', reason: 'scope_denied' }) });
    assert.equal((await row(engine)).status, 'rejected'); assert.equal(Object.hasOwn(await row(engine), 'payload'), false);
    assert.equal((await engine.enqueue(enrollment.enrollmentId, 'main', 'hash-1', {})).changed, false);
});
test('failure to persist a claim causes no network effect and preserves the pending update', async () => {
    const f = fixture(), { engine } = await ready(f), original = f.data[queue.KEY];
    f.fail(true);
    await assert.rejects(engine.run({ authorize: async () => true, send: async () => assert.fail('not durable') }), /quota/);
    assert.equal(f.data[queue.KEY], original); f.fail(false);
    assert.equal((await row(engine)).status, 'pending');
});
test('malformed storage is never reset or overwritten', async () => {
    const f = fixture(), engine = f.instance();
    for (const raw of ['not json', '{}', JSON.stringify({ version: 1, nextEpoch: 1, nextTicket: 1, enrollments: [{ enrollmentId: 'x' }] })]) {
        f.data[queue.KEY] = raw;
        await assert.rejects(engine.enroll(enrollment)); assert.equal(f.data[queue.KEY], raw);
    }
    assert.deepEqual(f.writes, []);
});
test('malformed inputs and overlarge payloads reject before storage writes', async () => {
    const f = fixture(), { engine } = await ready(f), writes = f.writes.length;
    for (const enrollmentId of ['', 'x'.repeat(129), 7, 'x\0']) await assert.rejects(engine.enroll({ ...enrollment, enrollmentId }));
    const cycle = {}; cycle.loop = cycle;
    const extra = [1]; extra.discarded = 'must not silently drop this';
    for (const value of [undefined, () => {}, NaN, { invalid: undefined }, new Date(), cycle, [1, , 3], extra, { get secret() { assert.fail('getter called'); } }]) {
        assert.throws(() => engine.enqueue(enrollment.enrollmentId, 'main', 'new', value), /payload_invalid/);
    }
    assert.throws(() => engine.enqueue(enrollment.enrollmentId, 'main', 'new', 'x'.repeat(queue.MAX_PAYLOAD_BYTES)), /too_large/);
    assert.equal(f.writes.length, writes);
});
test('enrollment and channel capacities reject rather than evicting unseen pending data', async () => {
    const f = fixture(), engine = f.instance();
    for (let index = 0; index < queue.MAX_ENROLLMENTS; index++) await engine.enroll({ enrollmentId: 'device-' + index, binding: 'b' });
    const original = f.data[queue.KEY];
    await assert.rejects(engine.enroll({ enrollmentId: 'overflow', binding: 'b' }));
    assert.equal(f.data[queue.KEY], original);
    for (let index = 0; index < queue.MAX_CHANNELS; index++) await engine.enqueue('device-0', 'area-' + index, 'h', {});
    const full = f.data[queue.KEY];
    await assert.rejects(engine.enqueue('device-0', 'overflow', 'h', {}), /capacity/);
    assert.equal(f.data[queue.KEY], full);
});
test('invalid send results remain pending instead of inventing application success', async () => {
    const f = fixture(), { engine } = await ready(f);
    await engine.run({ authorize: async () => true, send: async () => ({ delivered: true }) });
    assert.equal((await row(engine)).status, 'waiting'); assert.equal((await row(engine)).reason, 'delivery_result_invalid');
});
test('connectivity wake makes waiting work due without stealing a live lease', async () => {
    const f = fixture(), { engine } = await ready(f);
    await engine.run({ authorize: async () => true, send: async () => ({ status: 'waiting' }) });
    assert.equal(await engine.wake('unrelated-device'), false);
    assert.equal(await engine.wake(enrollment.enrollmentId), true);
    assert.equal((await row(engine)).dueAt, 1000);
    const sent = deferred(), response = deferred();
    const run = engine.run({ authorize: async () => true, send: async () => { sent.resolve(); return response.promise; } });
    await sent.promise;
    const writes = f.writes.length; assert.equal(await engine.wake(), false);
    assert.equal(f.writes.length, writes); assert.equal((await row(engine)).status, 'inflight');
    response.resolve({ status: 'applied' }); await run;
});
test('runner filters separate personal and managed work without claiming or mutating excluded areas', async () => {
    const f = fixture(), { engine } = await ready(f);
    await engine.enroll({ enrollmentId: 'personal:device', binding: 'personal-profile' });
    await engine.enqueue('personal:device', 'settings', 'settings-hash', { setting: true });
    const seen = [];
    await engine.run({
        filter: item => { assert.equal(Object.isFrozen(item), true); assert.equal(Object.hasOwn(item, 'payload'), false); return item.enrollmentId.startsWith('personal:'); },
        authorize: async item => { seen.push(item.enrollmentId); return true; },
        send: async () => ({ status: 'applied' })
    });
    assert.deepEqual(seen, ['personal:device', 'personal:device']);
    assert.equal((await row(engine)).status, 'pending');
    const writes = f.writes.length;
    await engine.run({ filter: () => false, authorize: async () => assert.fail('excluded'), send: async () => assert.fail('excluded') });
    assert.equal(f.writes.length, writes);
    await assert.rejects(engine.run({ filter: true, authorize: async () => true, send: async () => ({ status: 'applied' }) }), /runner_invalid/);
});
test('an authenticated apply receipt arriving before send resolves cannot be overwritten by waiting completion', async () => {
    const f = fixture(), { engine } = await ready(f), sent = deferred(), response = deferred();
    const run = engine.run({ authorize: async () => true, send: async item => { sent.resolve(item); return response.promise; } });
    const handle = await sent.promise;
    assert.equal(await f.instance().acknowledge(handle, { status: 'applied' }), true);
    const writes = f.writes.length;
    response.resolve({ status: 'waiting', reason: 'waiting_for_receipt' });
    assert.equal((await run)[0].current, false);
    assert.equal(f.writes.length, writes);
    const final = await row(engine); assert.equal(final.status, 'applied'); assert.equal(Object.hasOwn(final, 'payload'), false);
});
test('conditional removal cannot erase a newly consented enrollment with another binding', async () => {
    const f = fixture(), { engine } = await ready(f);
    await engine.enroll({ ...enrollment, binding: 'new-consent-generation' });
    await engine.enqueue(enrollment.enrollmentId, 'main', 'new-hash', { rules: ['newly-approved'] });
    const writes = f.writes.length;
    assert.equal(await f.instance().remove(enrollment.enrollmentId, enrollment.binding), false);
    assert.equal(f.writes.length, writes);
    assert.equal((await row(engine)).fingerprint, 'new-hash');
    assert.equal(await engine.remove(enrollment.enrollmentId, 'new-consent-generation'), true);
    assert.deepEqual((await engine.read()).enrollments, []);
    await engine.enroll(enrollment);
    assert.equal(await engine.remove(enrollment.enrollmentId), true);
});
