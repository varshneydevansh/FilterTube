import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { familyFixture } from './helpers/managed-sync-fixtures.mjs';

// Second two-device test (2026-11-21), Android 79108f833 / e741ca0b1; spec §3, §4, §4.1, §8.
const require = createRequire(import.meta.url);
const Courier = require('../../js/managed_courier.js');
const Doorbell = require('../../js/managed_doorbell.js');
const read = file => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const functionSource = (source, name) => {
    const start = source.search(new RegExp(`\\n    function ${name}\\(|\\nfunction ${name}\\(`));
    assert.ok(start >= 0, name);
    const indent = source[start + 1] === ' ' ? '\n    }\n' : '\n}\n';
    return source.slice(start, source.indexOf(indent, start) + indent.length);
};

test('the same rules under a new revision are "up to date", with no banner; a real change is "applied"', async () => {
    const f = await familyFixture({ activeProfileId: 'Child' });
    const first = await f.receiver.runPickup({ courierItems: [await f.sealedItem({ revision: 1, word: 'spiders' })], selfControlActive: async () => false });
    assert.equal(first.acks[0].applied, true);
    const notice = f.store.ftManagedUpdateNotice.id;
    const again = await f.receiver.runPickup({ courierItems: [await f.sealedItem({ revision: 2, word: 'spiders' })], selfControlActive: async () => false });
    assert.equal(again.acks[0].accepted, true);
    assert.equal(again.acks[0].applied, false);
    // The decision text stays the adapter's (as on Android); applied=false is what the parent reads.
    assert.deepEqual(again.appliedProfileIds, []);
    assert.equal(f.store.ftManagedUpdateNotice.id, notice, 'no banner without a real change');
});

test('a Send uses only the link\'s bound source profile and refuses clearly otherwise', () => {
    const source = read('js/tab-view.js');
    const box = { normalizeString: v => (typeof v === 'string' ? v.trim() : ''), safeObject: v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) };
    vm.runInNewContext(`${functionSource(source, 'resolveNanahSavedUpdateSource')}; this.resolve = resolveNanahSavedUpdateSource;`, box);
    const root = { activeProfileId: 'default', profiles: { default: { name: 'Mum' }, kid: { name: 'Kid' } } };
    assert.deepEqual(box.resolve({ localPolicyProfileId: 'kid' }, root, 'kid').profileId, 'kid');
    assert.equal(box.resolve({}, root, 'default').reason, 'saved_update_source_unbound', 'never the active profile');
    assert.equal(box.resolve({ localPolicyProfileId: 'kid' }, root, 'default').reason, 'saved_update_source_mismatch');
    assert.equal(box.resolve({ localPolicyProfileId: 'gone' }, root, 'gone').reason, 'saved_update_source_missing');
    assert.match(source, /resolveNanahSavedUpdateSource\(link, authorizedRoot, targetId\)/, 'the send loop checks every link');
});

test('host() has a 6 s limit and one retry on a fresh socket', async () => {
    let made = 0;
    const logs = [];
    class Stalling {
        constructor() { made += 1; this.first = made === 1; }
        async host(_session, hooks) { this.hooks = hooks; if (this.first) return new Promise(() => {}); }
        async join() {}
        async confirmSas() {}
        async send() {}
        async close() {}
    }
    const result = await Courier.host({ code: Doorbell.courierCode(), items: [{ schema: 'filtertube_managed_mailbox_item', mailboxItemId: 'm', ciphertext: 'c' }],
        nanah: { WebRtcDataChannelTransport: Stalling }, hostTimeoutMs: 80, timeoutMs: 300, log: (event, details) => logs.push([event, details?.reason]) });
    assert.equal(made, 2, 'a fresh transport (and socket) for the retry');
    assert.deepEqual(logs.find(([event]) => event === 'courier_host_retry'), ['courier_host_retry', 'courier_host_timeout']);
    assert.ok(logs.some(([event]) => event === 'courier_host_started'));
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'courier_timeout', 'the second attempt hosted, then the 30 s limit (shortened here) ran out');
});

test('a profiles write that changes no rules leaves the page alone; list-only changes keep the player', () => {
    const source = read('js/content/bridge_settings.js');
    const box = {};
    const pieces = ['filterTubeProfilesRuleProjection', 'filterTubeStableJson', 'filterTubeProfilesChangeKind'].map(name => functionSource(source, name));
    const consts = source.slice(source.indexOf('const FILTERTUBE_PROFILE_RULE_KEYS'), source.indexOf('function filterTubeProfilesRuleProjection'));
    vm.runInNewContext(`${consts}${pieces.join('\n')}; this.kind = filterTubeProfilesChangeKind;`, box);
    const tree = extra => ({ activeProfileId: 'kid', profiles: { kid: { name: 'Kid', settings: { hideAllShorts: true }, main: { mode: 'blocklist', keywords: [] }, kids: {}, ...extra } } });
    assert.equal(box.kind({ oldValue: tree(), newValue: tree({ managedActionHistory: [{ rowId: 'r' }], managedPolicyState: { x: 1 } }) }), 'none');
    assert.equal(box.kind({ oldValue: tree(), newValue: tree({ main: { mode: 'blocklist', keywords: [{ word: 'clown' }] } }) }), 'lists');
    // Run 4 (d760d6c2a): a rules change keeps the player unless it touches whether a video may play.
    assert.equal(box.kind({ oldValue: tree(), newValue: tree({ settings: { hideAllShorts: false } }) }), 'lists');
    assert.equal(box.kind({ oldValue: tree(), newValue: tree({ main: { mode: 'whitelist', keywords: [] } }) }), 'lists');
    assert.equal(box.kind({ oldValue: tree(), newValue: tree({ settings: { hideAllShorts: true, timeLimitPolicy: { dailyBudgetMinutes: 30 } } }) }), 'other');
    assert.equal(box.kind({ oldValue: tree(), newValue: tree({ settings: { hideAllShorts: true, categoryFilters: { blocked: ['music'] } } }) }), 'other');
    assert.equal(box.kind({ oldValue: tree(), newValue: { ...tree(), activeProfileId: 'other' } }), 'other');
    assert.equal(box.kind({ newValue: tree() }), 'other');
    assert.match(source, /if \(profilesChange === 'none'\) return;/);
    assert.match(source, /profilesChange !== 'lists'\) \{\n\s+managedContentPlaybackPermit\.clear/);
});
