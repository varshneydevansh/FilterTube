import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createPacedFetcher } = require('../../js/shared/paced_fetch.js');

function harness(options = {}) {
    let clock = 0;
    const timers = [];
    const started = [];
    const pending = new Map();
    const fetcher = createPacedFetcher({
        ...options,
        now: () => clock,
        setTimeout: (fn, ms) => { timers.push({ at: clock + ms, fn }); return timers.length; },
        fetch: url => new Promise((resolve, reject) => { started.push({ url, at: clock }); pending.set(url, { resolve, reject }); })
    });
    async function advance(ms) {
        clock += ms;
        for (;;) {
            const due = timers.filter(timer => timer.at <= clock);
            if (!due.length) break;
            for (const timer of due) { timers.splice(timers.indexOf(timer), 1); timer.fn(); }
        }
        await new Promise(resolve => setImmediate(resolve));
    }
    return { fetcher, started, pending, advance };
}

test('at most maxConcurrent requests run at once; the rest wait in order', async () => {
    const h = harness({ maxConcurrent: 3, minGapMs: 0 });
    const results = ['a', 'b', 'c', 'd', 'e'].map(url => h.fetcher.get(url));
    await h.advance(0);
    assert.deepEqual(h.started.map(item => item.url), ['a', 'b', 'c']);
    assert.equal(h.fetcher.pending(), 2);
    h.pending.get('b').resolve('B');
    await h.advance(0);
    assert.deepEqual(h.started.map(item => item.url), ['a', 'b', 'c', 'd']);
    assert.equal(await results[1], 'B');
    for (const url of ['a', 'c', 'd']) h.pending.get(url).resolve(url.toUpperCase());
    await h.advance(0);
    h.pending.get('e').resolve('E');
    assert.deepEqual(await Promise.all(results), ['A', 'B', 'C', 'D', 'E']);
    assert.equal(h.fetcher.active(), 0);
});

test('starts are paced at least minGapMs apart', async () => {
    const h = harness({ maxConcurrent: 3, minGapMs: 250 });
    ['a', 'b', 'c'].forEach(url => h.fetcher.get(url));
    await h.advance(0);
    assert.equal(h.started.length, 1);
    await h.advance(249);
    assert.equal(h.started.length, 1);
    await h.advance(1);
    assert.equal(h.started.length, 2);
    await h.advance(250);
    assert.deepEqual(h.started.map(item => item.at), [0, 250, 500]);
});

test('a failed request frees its slot and rejects only its own promise', async () => {
    const h = harness({ maxConcurrent: 1, minGapMs: 0 });
    const first = h.fetcher.get('a');
    const second = h.fetcher.get('b');
    await h.advance(0);
    h.pending.get('a').reject(new Error('offline'));
    await assert.rejects(first, /offline/);
    await h.advance(0);
    h.pending.get('b').resolve('ok');
    assert.equal(await second, 'ok');
});

test('an aborted request is never sent', async () => {
    const h = harness({ maxConcurrent: 1, minGapMs: 0 });
    const controller = new AbortController();
    h.fetcher.get('a');
    const waiting = h.fetcher.get('b', { signal: controller.signal });
    controller.abort();
    await h.advance(0);
    h.pending.get('a').resolve('A');
    await assert.rejects(waiting, error => error.name === 'AbortError');
    await h.advance(0);
    assert.deepEqual(h.started.map(item => item.url), ['a']);
    const already = new AbortController();
    already.abort();
    await assert.rejects(h.fetcher.get('c', { signal: already.signal }), error => error.name === 'AbortError');
});
