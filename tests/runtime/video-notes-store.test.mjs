import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const notes = require('../../js/shared/saved_video_notes.js');
const repository = require('../../js/video_notes_store.js');
const key = { profileId: 'Parent-A', videoId: 'aBcDEf012_-'};
const copy = value => structuredClone(value);
function fixture() {
    const data = {}, writes = [];
    let allow = true, setFailure = false, beforeAuthorize = null, checks = 0;
    const store = repository.create({
        get: async keys => Object.fromEntries(keys.filter(key => key in data).map(key => [key, copy(data[key])])),
        set: async update => { if (setFailure) throw Error('quota'); writes.push(copy(update)); Object.assign(data, copy(update)); },
        randomId: () => 'writer-local',
        authorize: async (requested, scope) => { checks++; await beforeAuthorize?.(checks); return allow && scope === 'current' && requested.profileId === key.profileId; }
    });
    return { store, data, writes, deny() { allow = false; }, fail() { setFailure = true; }, intercept(fn) { beforeAuthorize = fn; } };
}
test('save survives a new reader while writer identity remains outside the envelope', async () => {
    const f = fixture(); const result = await f.store.save(key, null, 'हिन्दी 🎵\n1:30 Detail  ', 'current');
    assert.equal(result.saved, true); assert.equal(result.record.versions[0].text, 'हिन्दी 🎵\n1:30 Detail');
    assert.deepEqual(await f.store.read(key, 'current'), result.record);
    assert.equal(f.data[repository.WRITER_KEY], 'writer-local');
    const payload = JSON.parse(f.data[repository.DATA_KEY]);
    assert.deepEqual(Object.keys(payload).sort(), ['entries', 'format', 'version']);
    assert.equal(payload.entries[0].profileId, 'Parent-A');
});
test('serialized concurrent saves refuse stale bases and retain the successful version', async () => {
    const f = fixture(); const [a, b] = await Promise.all([
        f.store.save(key, null, 'First', 'current'), f.store.save(key, null, 'Second', 'current')
    ]);
    assert.equal(a.saved, true); assert.equal(b.saved, false); assert.equal(b.conflict, true);
    assert.deepEqual(b.record, a.record); assert.deepEqual(await f.store.read(key, 'current'), a.record);
});
test('explicit deletion retains a causal tombstone and repeating it is a no-op', async () => {
    const f = fixture(); const original = (await f.store.save(key, null, 'A', 'current')).record;
    const deleted = (await f.store.save(key, original, ' \t\n', 'current')).record;
    assert.equal(deleted.versions[0].text, null); const count = f.writes.length;
    assert.deepEqual((await f.store.save(key, deleted, null, 'current')).record, deleted);
    assert.equal(f.writes.length, count); assert.deepEqual(notes.merge(original, deleted), deleted);
    assert.equal((await f.store.save(key, original, 'Stale resurrection', 'current')).conflict, true);
});
test('concurrent edit/delete heads remain recoverable until deliberately resolved', async () => {
    const f = fixture(); const a = notes.edit(key, null, 'a', 'Original');
    const conflict = notes.merge(notes.edit(key, a, 'b', null), notes.edit(key, a, 'c', 'Edited'));
    f.data[repository.DATA_KEY] = notes.encode([conflict], [key.profileId]);
    assert.deepEqual(await f.store.read(key, 'current'), conflict);
    assert.equal((await f.store.save(key, a, 'Must not overwrite', 'current')).conflict, true);
    const resolved = (await f.store.save(key, conflict, 'Chosen after review', 'current')).record;
    assert.equal(resolved.versions.length, 1); assert.deepEqual(notes.merge(conflict, resolved), resolved);
});
test('foreign and case-folded profile keys never gain authority', async () => {
    const f = fixture();
    for (const profileId of ['parent-a', 'Parent-A ', 'Child']) {
        await assert.rejects(f.store.save({ ...key, profileId }, null, 'Secret', 'current'));
        await assert.rejects(f.store.read({ ...key, profileId }, 'current'));
    }
    await assert.rejects(f.store.save(key, null, 'Secret', 'forged')); assert.deepEqual(f.writes, []);
});
test('base ownership and text bounds reject without writes or truncation', async () => {
    const f = fixture();
    await assert.rejects(f.store.save(key, notes.edit({ ...key, videoId: '12345678901' }, null, 'a', 'Other'), 'X', 'current'));
    for (const text of ['x'.repeat(16001), '\uD800', 7]) await assert.rejects(f.store.save(key, null, text, 'current'));
    assert.deepEqual(f.writes, []);
});
test('quota or malformed storage failures preserve the recoverable original', async () => {
    const f = fixture(); const first = (await f.store.save(key, null, 'Keep', 'current')).record;
    const raw = f.data[repository.DATA_KEY]; f.fail();
    await assert.rejects(f.store.save(key, first, 'Discarded write', 'current')); assert.equal(f.data[repository.DATA_KEY], raw);
    f.data[repository.DATA_KEY] = 'malformed'; await assert.rejects(f.store.read(key, 'current'));
    assert.equal(f.data[repository.DATA_KEY], 'malformed');
});
test('permission revocation between read and commit prevents the saved text write', async () => {
    const f = fixture(); f.intercept(count => { if (count === 3) f.deny(); });
    await assert.rejects(f.store.save(key, null, 'Must not save', 'current'));
    assert.equal(f.data[repository.DATA_KEY], undefined);
});
