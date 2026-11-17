/* A small fetch scheduler for the extension's own same-origin reads (channel uploads, channel search).
 *
 * createPacedFetcher({maxConcurrent = 3, minGapMs = 250, fetch}) -> {get(url, init) -> Promise<Response>,
 * pending(), active()}.
 * - At most `maxConcurrent` requests are in flight; the rest wait in order (first asked, first sent).
 * - Two requests never start closer than `minGapMs` apart, so a burst of channels doesn't trip rate limits.
 * - A request whose `init.signal` is aborted while it waits is dropped with an AbortError, never sent.
 * - `fetch` defaults to the global one; `now`/`setTimeout` can be injected for tests.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && !root.FilterTubePacedFetch) root.FilterTubePacedFetch = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function abortError() {
        try { return new DOMException('Aborted', 'AbortError'); } catch (e) {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            return error;
        }
    }

    function createPacedFetcher(options = {}) {
        const maxConcurrent = Math.max(1, Math.floor(Number(options.maxConcurrent) || 3));
        const minGapMs = Math.max(0, Number(options.minGapMs ?? 250) || 0);
        const doFetch = options.fetch || ((url, init) => globalThis.fetch(url, init));
        const now = options.now || (() => Date.now());
        const later = options.setTimeout || ((fn, ms) => setTimeout(fn, ms));
        const queue = [];
        let active = 0;
        let lastStart = -Infinity;
        let timer = null;

        function pump() {
            timer = null;
            while (queue.length && queue[0].init?.signal?.aborted) queue.shift().reject(abortError());
            if (!queue.length || active >= maxConcurrent) return;
            const wait = lastStart + minGapMs - now();
            if (wait > 0) {
                if (!timer) timer = later(pump, wait);
                return;
            }
            const job = queue.shift();
            active++;
            lastStart = now();
            let result;
            try {
                result = Promise.resolve(doFetch(job.url, job.init));
            } catch (error) {
                result = Promise.reject(error);
            }
            result.then(job.resolve, job.reject).finally(() => {
                active--;
                pump();
            });
            if (queue.length) pump();
        }

        function get(url, init) {
            return new Promise((resolve, reject) => {
                if (init?.signal?.aborted) {
                    reject(abortError());
                    return;
                }
                queue.push({ url, init, resolve, reject });
                pump();
            });
        }

        return Object.freeze({ get, pending: () => queue.length, active: () => active });
    }

    return Object.freeze({ createPacedFetcher });
}));
