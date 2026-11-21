import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// SEAMLESS_SYNC_SPEC.md §11 (Android 997ac7c74, d231a33c7): trust-save results, re-pair after removal,
// the engine (worker) watchdog and pairing order.
const require = createRequire(import.meta.url);
const R = require('../../js/managed_link_reservations.js');
const Gate = require('../../js/nanah_inbound_gate.js');
const tabView = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const fn = name => {
    const start = tabView.search(new RegExp(`\\n    (?:async )?function ${name}\\(`));
    assert.ok(start >= 0, name);
    return tabView.slice(start, tabView.indexOf('\n    }\n', start) + 7);
};
const unconfigured = { mailbox: 'unconfigured', local_network: 'unconfigured', courier: 'configured:outbox' };
const removedUnconfigured = () => R.removalRecord({ linkId: 'nm1-x', removedAt: 1, transports: {
    mailbox: { configured: false }, local_network: { configured: false }, courier: { configured: true, ok: true } } });

test('a tracked, never-exposed link removed with no pickup set up can be paired again', () => {
    const ledger = R.markTracked(null, 'nm1-x');
    const decision = R.evaluateRepair({ record: removedUnconfigured(), ledger, currentDigests: unconfigured });
    assert.deepEqual(decision, { allowed: true, released: ['mailbox', 'local_network'] });
    const released = R.releaseRecord(removedUnconfigured(), decision.released);
    assert.equal(released.transports.mailbox.reason, 'released_unexposed_repair');
    assert.deepEqual(R.evaluateRepair({ record: released, ledger, currentDigests: unconfigured }), { allowed: true, released: [] });
});

test('the reservation holds for an exposed, untracked, still-pending or newly configured transport', () => {
    const tracked = R.markTracked(null, 'nm1-x');
    assert.equal(R.evaluateRepair({ record: removedUnconfigured(), ledger: R.markExposed(tracked, 'nm1-x', 'mailbox'), currentDigests: unconfigured }).reason,
        'source_link_reserved_mailbox', 'a send was prepared once: an old envelope could revive the link');
    assert.equal(R.evaluateRepair({ record: removedUnconfigured(), ledger: null, currentDigests: unconfigured }).reason,
        'source_link_reserved_mailbox', 'a link from before tracking keeps its reservation');
    assert.equal(R.evaluateRepair({ record: removedUnconfigured(), ledger: tracked,
        currentDigests: { ...unconfigured, local_network: 'configured:192.168.1.5' } }).reason, 'source_link_reserved_local_network');
    const pending = R.removalRecord({ linkId: 'nm1-x', transports: { mailbox: { configured: true, ok: false, reason: 'mailbox_http_500' },
        local_network: { configured: false }, courier: { configured: true, ok: true } } });
    assert.equal(R.evaluateRepair({ record: pending, ledger: tracked, currentDigests: unconfigured }).reason, 'source_link_reserved_mailbox');
    const droppedFailed = R.removalRecord({ linkId: 'nm1-x', transports: { mailbox: { configured: true, ok: true }, local_network: { configured: true, ok: true },
        courier: { configured: true, ok: false } } });
    assert.equal(R.evaluateRepair({ record: droppedFailed, ledger: tracked, currentDigests: unconfigured }).reason, 'source_link_reserved_courier');
    const allPurged = R.removalRecord({ linkId: 'nm1-x', transports: { mailbox: { configured: true, ok: true }, local_network: { configured: true, ok: true },
        courier: { configured: true, ok: true } } });
    assert.deepEqual(R.evaluateRepair({ record: allPurged, ledger: null, currentDigests: unconfigured }), { allowed: true, released: [] });
});

test('trust saves: every refusal has a code, is logged, and no caller shows Paired or Trusted after one', () => {
    const save = fn('saveNanahTrustedLink');
    assert.match(save, /nanah_trust_write_refused reason=\$\{code\}/);
    assert.match(save, /readback_missing/);
    const checked = fn('saveNanahTrustedLinkChecked');
    for (const code of ['missing_remote_device', 'link_id_collision', 'entry_invalid', 'existing_link_id_changed', 'link_blocked_in_page',
        'before_save_refused', 'repair_requires_confirmed_phrase']) assert.ok(checked.includes(`'${code}'`), code);
    assert.doesNotMatch(checked, /throw new Error\(/, 'no uncoded refusal is left');
    // A refusal throws out of every pairing-time save, so no success toast runs after it; the trust
    // button and the incoming-data handler turn it into the specific message.
    assert.equal((tabView.match(/if \(error\?\.nanahTrustRefusal === true\) (?:\{ )?showNanahTrustWriteRefusal\(error\)/g) || []).length, 2);
    assert.match(tabView, /refused save throws above, so "Paired" or "Managed link saved" never shows/);
    const box = { normalizeString: v => (typeof v === 'string' ? v.trim() : ''), toasts: [], getNanahRemoteLabel: () => 'Kid tablet',
        tabViewUiText: (_key, fallback, vars = {}) => fallback.replace(/\{(\w+)\}/g, (_, k) => vars[k]) };
    box.UIComponents = { showToast: (message, tone) => box.toasts.push([message, tone]) };
    vm.runInNewContext(`${fn('showNanahTrustWriteRefusal')}; this.show = showNanahTrustWriteRefusal;`, box);
    box.show({ code: 'source_link_reserved_mailbox' }, 'Kid tablet');
    box.show({ code: 'link_id_collision' });
    assert.match(box.toasts[0][0], /set up that Internet or Home Pickup again/i);
    assert.equal(box.toasts[1][0], "Couldn't save the link to Kid tablet (link_id_collision)");
});

test('a removal records what each transport still holds, and sends are recorded before dispatch', () => {
    assert.match(fn('removeNanahTrustedLink'), /recordNanahRemovedSourceLink\(removedLink/);
    assert.match(fn('recordNanahRemovedSourceLink'), /FilterTube_ManagedOutboxDropLink/);
    for (const transport of ['local_network', 'mailbox', 'courier']) {
        assert.match(tabView, new RegExp(`await markNanahProviderExposure\\(savedUpdateLinks, '${transport}'\\);\\n\\s+const`), transport);
    }
});

test('the worker watchdog: an unanswered ask times out, is tried once more, then recovers with null', async () => {
    let calls = 0;
    const box = { setTimeout, clearTimeout, console: { warn: () => {} }, normalizeString: v => (typeof v === 'string' ? v : ''),
        chrome: { runtime: { lastError: null, sendMessage: (_message, callback) => { calls += 1; if (calls === 3) callback({ ok: true }); } } } };
    vm.runInNewContext(`const NANAH_WORKER_ASK_TIMEOUT_MS = 30; ${fn('askNanahBackgroundWorkerOnce')} ${fn('askNanahBackgroundWorker')}
        this.ask = askNanahBackgroundWorker;`, box);
    assert.equal(await box.ask({ action: 'x' }), null);
    assert.equal(calls, 2);
    assert.deepEqual(await box.ask({ action: 'y' }), { ok: true }, 'answers again once the worker is back');
});

test('pairing order: peer data waits for the local confirmation, then runs in order; a reset drops it', async () => {
    let open = false;
    const handled = [];
    const gate = Gate.create({ isOpen: () => open, handle: async envelope => { await new Promise(r => setTimeout(r, envelope.delay || 0)); handled.push(envelope.n); } });
    gate.push({ n: 1, delay: 20 });
    gate.push({ n: 2 });
    assert.deepEqual(handled, []);
    assert.equal(gate.heldCount, 2);
    open = true;
    gate.push({ n: 3 });
    await gate.drain();
    await new Promise(r => setTimeout(r, 40));
    assert.deepEqual(handled, [1, 2, 3], 'held envelopes first, one at a time');
    open = false;
    gate.push({ n: 4 });
    gate.reset();
    open = true;
    await gate.drain();
    assert.deepEqual(handled, [1, 2, 3]);
    assert.match(tabView, /nanahSessionState\.sasConfirmed = true;\n\s+nanahInboundGate\?\.drain\(\);/);
    assert.match(tabView, /if \(inbound\) \{ inbound\.push\(envelope\); return; \}/);
});
