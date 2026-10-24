import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const wakeup = require('../../js/auto_sync_wakeup.js');
function event() {
    const listeners = new Set();
    return { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn),
        emit: async (...args) => Promise.all([...listeners].map(fn => fn(...args))), count: () => listeners.size };
}
function state({ enabled = true, fingerprint = 'hash', status = 'pending' } = {}) {
    return JSON.stringify({ version: 1, nextEpoch: 2, nextTicket: 2, enrollments: [{ enrollmentId: 'parent-child', binding: 'binding',
        epoch: 1, enabled, channels: enabled ? [{ channel: 'main', fingerprint, sequence: 1, status }] : [] }] });
}
function fixture(raw, { promiseApi = false, noDashboard = false } = {}) {
    const messages = [], created = [], cleared = [], data = { [wakeup.KEY]: raw };
    let alarm = null, readFailure = false;
    const api = {
        runtime: { onStartup: event(), onInstalled: event(), onMessage: event() },
        alarms: { onAlarm: event() }, storage: { local: {}, onChanged: event() },
        tabs: { create: () => assert.fail('must not create tabs'), query: () => assert.fail('must not inspect tabs') }
    };
    function respond(args, value, error = false) {
        if (promiseApi) { if (error) return Promise.reject(Error('unavailable')); return Promise.resolve(value); }
        const callback = args.at(-1);
        if (error) api.runtime.lastError = { message: 'unavailable' };
        callback(value); delete api.runtime.lastError;
    }
    api.storage.local.get = (...args) => respond(args, { ...data }, readFailure);
    api.alarms.get = (...args) => respond(args, alarm);
    api.alarms.clear = (...args) => { cleared.push(args[0]); alarm = null; return respond(args, true); };
    api.alarms.create = (name, options) => { created.push({ name, ...options }); alarm = { name, ...options }; };
    api.runtime.sendMessage = (...args) => { messages.push(args[0]); return respond(args, undefined, noDashboard); };
    const installation = wakeup.install({ api, promiseApi });
    return { api, messages, created, cleared, data, installation, setAlarm: value => { alarm = value; }, failRead: () => { readFailure = true; } };
}
test('no enrollment means no alarm or dashboard wake', async () => {
    const f = fixture(undefined);
    assert.deepEqual(await f.installation.ready, { ok: true, enabled: false });
    assert.deepEqual(f.created, []); assert.deepEqual(f.messages, []);
    assert.equal(f.api.runtime.onMessage.count(), 0);
});
test('enrollment installs a one-minute wake and sends no profile data', async () => {
    const f = fixture(state()); await f.installation.ready;
    assert.deepEqual(f.created, [{ name: wakeup.ALARM, delayInMinutes: 1, periodInMinutes: 1 }]);
    assert.deepEqual(f.messages, [{ action: wakeup.ACTION, reason: 'worker_start' }]);
    await f.api.runtime.onStartup.emit();
    assert.equal(f.created.length, 1); assert.equal(f.messages[1].reason, 'browser_start');
});
test('existing healthy alarm is retained rather than postponed by each wake', async () => {
    const f = fixture(undefined); await f.installation.ready;
    f.data[wakeup.KEY] = state(); f.setAlarm({ name: wakeup.ALARM, periodInMinutes: 1 });
    await f.api.runtime.onStartup.emit();
    assert.deepEqual(f.created, []); assert.equal(f.messages.length, 1);
    await f.api.alarms.onAlarm.emit({ name: 'other-alarm' }); assert.equal(f.messages.length, 1);
    await f.api.alarms.onAlarm.emit({ name: wakeup.ALARM }); assert.equal(f.messages.length, 2);
});
test('closing the dashboard leaves a durable alarm without opening a tab', async () => {
    const f = fixture(state(), { noDashboard: true });
    assert.deepEqual(await f.installation.ready, { ok: true, enabled: true });
    await f.api.alarms.onAlarm.emit({ name: wakeup.ALARM });
    assert.equal(f.created.length, 1); assert.equal(f.messages.length, 2);
});
test('enrollment and new content changes wake; status bookkeeping does not loop', async () => {
    const f = fixture(state()); await f.installation.ready;
    const oldValue = f.data[wakeup.KEY], claimed = state({ status: 'inflight' });
    f.data[wakeup.KEY] = claimed;
    await f.api.storage.onChanged.emit({ [wakeup.KEY]: { oldValue, newValue: claimed } }, 'local');
    assert.equal(f.messages.length, 1);
    const next = state({ fingerprint: 'new-content' }); f.data[wakeup.KEY] = next;
    await f.api.storage.onChanged.emit({ [wakeup.KEY]: { oldValue: claimed, newValue: next } }, 'local');
    assert.equal(f.messages.length, 2); assert.equal(f.messages[1].reason, 'queue_changed');
    await f.api.storage.onChanged.emit({ [wakeup.KEY]: { oldValue, newValue: next } }, 'sync');
    assert.equal(f.messages.length, 2);
});
test('disable or remove enrollment clears the alarm without dispatch', async () => {
    const f = fixture(state()); await f.installation.ready;
    const oldValue = f.data[wakeup.KEY]; f.data[wakeup.KEY] = state({ enabled: false });
    await f.api.storage.onChanged.emit({ [wakeup.KEY]: { oldValue, newValue: f.data[wakeup.KEY] } }, 'local');
    assert.deepEqual(f.cleared, [wakeup.ALARM]); assert.equal(f.messages.length, 1);
});
test('storage failure is caught and does not manufacture consent or erase an existing alarm', async () => {
    const f = fixture(state()); await f.installation.ready; f.failRead();
    await f.api.runtime.onStartup.emit();
    assert.equal(f.messages.length, 1); assert.deepEqual(f.cleared, []);
    assert.deepEqual(await f.installation.reconcile(), { ok: false, reason: 'wakeup_unavailable' });
});
test('malformed persisted state cannot enable wakes', async () => {
    const f = fixture('broken'); await f.installation.ready;
    assert.deepEqual(f.created, []); assert.deepEqual(f.messages, []);
    f.setAlarm({ name: wakeup.ALARM, periodInMinutes: 1 });
    await f.installation.reconcile(); assert.deepEqual(f.cleared, [wakeup.ALARM]);
});
test('Firefox-style promise APIs work without passing callbacks', async () => {
    const f = fixture(state(), { promiseApi: true });
    assert.deepEqual(await f.installation.ready, { ok: true, enabled: true });
    assert.equal(f.messages.length, 1); assert.equal(f.created.length, 1);
    await f.api.runtime.onInstalled.emit(); assert.equal(f.messages[1].reason, 'extension_installed');
});
test('dispose removes owned event listeners and prevents subsequent dispatch', async () => {
    const f = fixture(state()); await f.installation.ready; f.installation.dispose();
    await f.api.runtime.onStartup.emit(); await f.api.alarms.onAlarm.emit({ name: wakeup.ALARM });
    assert.equal(f.messages.length, 1);
    assert.equal(f.api.runtime.onStartup.count(), 0); assert.equal(f.api.storage.onChanged.count(), 0);
    assert.deepEqual(await f.installation.reconcile(), { ok: true, enabled: false });
});
