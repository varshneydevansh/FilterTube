/*
 * Runs courier jobs for the background worker inside an extension document: the hidden frame
 * html/managed_courier.html (job id in the URL hash) or an open dashboard (job offered by message).
 * Every item the child receives is handed back to the worker, which verifies and applies it.
 */
(function (root) {
    'use strict';
    const api = typeof browser !== 'undefined' && browser.runtime ? browser : (typeof chrome !== 'undefined' ? chrome : null);
    const Courier = root.FilterTubeManagedCourier;
    if (!api?.runtime || !Courier || typeof root.RTCPeerConnection !== 'function') return;

    function ask(message) {
        return new Promise(resolve => {
            try {
                if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
                    browser.runtime.sendMessage(message).then(response => resolve(response || null), () => resolve(null));
                    return;
                }
                chrome.runtime.sendMessage(message, response => resolve(chrome.runtime.lastError ? null : (response || null)));
            } catch (_) { resolve(null); }
        });
    }

    const running = new Set();
    async function run(jobId) {
        if (typeof jobId !== 'string' || !/^[a-z2-7]{26}$/.test(jobId) || running.has(jobId)) return;
        running.add(jobId);
        try {
            const claim = await ask({ action: 'FilterTube_CourierClaim', jobId });
            const job = claim?.ok ? claim.job : null;
            if (!job) return;
            const result = job.role === 'host'
                ? await Courier.host({ code: job.code, items: job.items, deviceId: job.deviceHash,
                    onHosting: () => { void ask({ action: 'FilterTube_CourierHosting', jobId }); } })
                : await Courier.join({ code: job.code, deviceId: job.deviceHash,
                    onItems: async items => (await ask({ action: 'FilterTube_CourierItems', jobId, items }))?.records || [] });
            // Only identifiers and states go back; acks never carry filter data.
            await ask({ action: 'FilterTube_CourierDone', jobId, result: { ok: !!result?.ok, reason: result?.reason || null,
                acks: Array.isArray(result?.acks) ? result.acks : [] } });
        } finally {
            running.delete(jobId);
        }
    }

    const hashJob = String(root.location?.hash || '').slice(1);
    const isCourierFrame = /\/html\/managed_courier\.html$/.test(String(root.location?.pathname || ''));
    if (isCourierFrame) void run(hashJob);
    else {
        api.runtime.onMessage.addListener((message, sender) => {
            if (message?.action === 'FilterTube_CourierOffer' && sender?.id === api.runtime.id && !sender.tab) void run(message.jobId);
            return false;
        });
    }
})(typeof window !== 'undefined' ? window : globalThis);
