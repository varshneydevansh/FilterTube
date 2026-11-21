// Copied from FilterTubeApp tools/native-nanah-persisted-verify.test.mjs (c31561933), pointed at the extension adapter.
// Run 4 (2026-11-21): every Kids rule item was acked "rejected" with "Synced profile could not be
// verified after saving" although the write took effect: the adapter compared the re-read profile with
// its own pre-save JSON byte for byte, and the native store normalises what it saves (nulls dropped,
// exported fields). The check now compares content, against what the store says it committed.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const adapter = fs.readFileSync(new URL('../../js/nanah_sync_adapter.js', import.meta.url), 'utf8');
function fn(name) {
    const start = adapter.search(new RegExp(`\\n    (async )?function ${name}\\(`));
    assert.ok(start >= 0, name);
    return adapter.slice(start, adapter.indexOf('\n    }\n', start) + 7);
}
const context = vm.createContext({});
vm.runInContext(`const global = { console: { warn: message => { globalThis.lastWarn = message; } } };
function safeObject(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
${fn('semanticProfileJson')}
${fn('firstProfileDiffPath')}
${fn('requirePersistedProfile')}
globalThis.verify = requirePersistedProfile;`, context);
const io = stored => ({ loadProfilesV4: async () => JSON.parse(JSON.stringify(stored)) });
const expected = { type: 'child', kids: { keywords: [{ word: 'motu', comments: null }], mode: 'blocklist' }, avatar: null };

test('a store that drops nulls still verifies', async () => {
    const stored = { profiles: { kid: { type: 'child', kids: { keywords: [{ word: 'motu' }], mode: 'blocklist' } } } };
    await context.verify(io(stored), { ok: true }, 'kid', expected);
});

test('the committed tree the native lease returns is the receipt, even if the re-read export adds fields', async () => {
    const committed = { profiles: { kid: { type: 'child', kids: { keywords: [{ word: 'motu' }], mode: 'blocklist' } } } };
    const exported = { profiles: { kid: { ...committed.profiles.kid, policyRevision: 7, main: { mode: 'blocklist' } } } };
    await context.verify(io(exported), { ok: true, profilesV4: committed }, 'kid', expected);
});

test('a write that did not land, a failed save or a missing profile is still refused', async () => {
    const old = { profiles: { kid: { type: 'child', kids: { keywords: [], mode: 'blocklist' } } } };
    await assert.rejects(context.verify(io(old), { ok: true }, 'kid', expected), /could not be verified/);
    // The log names where it differs, never the values.
    assert.match(context.lastWarn, /^requirePersistedProfile mismatch at kid\.kids\.keywords\.0 \(missing vs object\)$/);
    await assert.rejects(context.verify(io(old), { ok: false }, 'kid', expected), /could not be saved/);
    await assert.rejects(context.verify(io({ profiles: {} }), { ok: true }, 'kid', expected), /could not be verified/);
    // A store "receipt" that disagrees with both the re-read and the intent doesn't pass.
    const other = { profiles: { kid: { type: 'child', kids: { keywords: [{ word: 'else' }] } } } };
    await assert.rejects(context.verify(io(old), { ok: true, profilesV4: other }, 'kid', expected), /could not be verified/);
});

test('the extension adapter is byte-identical to the pinned upstream mirror', async () => {
    const { createHash } = await import('node:crypto');
    assert.equal(createHash('sha256').update(adapter).digest('hex'), 'ad2e0a7c40d1660f61c579a393af62c02d30ebf1a624054f27a6e1d02867da39');
});
