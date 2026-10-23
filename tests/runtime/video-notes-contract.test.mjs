import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const assert = require('node:assert/strict');
const notes = require('../../js/shared/saved_video_notes.js');
const vectors = require('./fixtures/video-notes/v1-vectors.json');

for (const vector of vectors.validMerges) {
    test(vector.name, () => {
        const expected = notes.record(vector.expected);
        assert.deepEqual(notes.merge(vector.left, vector.right), expected);
        assert.deepEqual(notes.merge(vector.right, vector.left), expected);
        assert.deepEqual(notes.merge(expected, expected), expected);
        assert.deepEqual(notes.decode(notes.encode([expected], [expected.profileId]), [expected.profileId]), [expected]);
    });
}
for (const vector of vectors.invalidEnvelopes) {
    test('reject ' + vector.name, () => assert.throws(() => notes.decode(vector.json, vector.allowedProfiles)));
}
const key = { profileId: 'default', videoId: 'abcdefghijk' };
test('grouping does not change bounded concurrent merges; resolving joins all observed heads', () => {
    const base = notes.edit(key, null, 'a', 'Original');
    const branches = Array.from({ length: 8 }, (_, i) => notes.edit(key, base, 'writer' + i, i ? 'Edit ' + i : null));
    const merged = branches.reduce(notes.merge);
    for (let split = 1; split < branches.length; split++) {
        assert.deepEqual(notes.merge(branches.slice(0, split).reduce(notes.merge), branches.slice(split).reduce(notes.merge)), merged);
    }
    const resolved = notes.edit(key, merged, 'resolver', 'Resolved');
    assert.equal(resolved.versions.length, 1);
    assert.equal(resolved.versions[0].revision.length, 10);
    assert.deepEqual(notes.merge(resolved, merged), resolved);
});
test('same revision cannot represent different content or owners', () => {
    const base = notes.edit(key, null, 'a', 'Original');
    assert.throws(() => notes.merge(base, notes.edit(key, null, 'a', 'Different')));
    assert.throws(() => notes.merge(base, { ...base, profileId: 'other' }));
    assert.throws(() => notes.merge(base, { ...base, videoId: '12345678901' }));
});
test('bounds reject instead of truncating history', () => {
    const full = notes.record({ ...key, versions: Array.from({ length: 16 }, (_, i) => ({ revision: [{ actor: 'a' + i, counter: 1 }], text: 'A' })) });
    assert.throws(() => notes.merge(full, notes.edit(key, null, 'seventeenth', 'B')));
    const exhausted = notes.record({ ...key, versions: [{ revision: [{ actor: 'a', counter: notes.MAX_COUNTER }], text: 'A' }] });
    assert.throws(() => notes.edit(key, exhausted, 'a', 'B'));
    const clock = Array.from({ length: 64 }, (_, i) => ({ actor: 'a' + i, counter: 1 }));
    assert.throws(() => notes.edit(key, { ...key, versions: [{ revision: clock, text: 'A' }] }, 'new', 'B'));
    assert.throws(() => notes.edit(key, null, 'a', 'x'.repeat(16001)));
});
test('only explicit null is deletion; Unicode stays exact', () => {
    for (const text of ['', ' \t\n', 'हिन्दी 🎵\n1:30 Detail  ', '\uFEFF']) {
        const value = notes.edit(key, null, 'a', text);
        assert.equal(notes.decode(notes.encode([value], ['default']), ['default'])[0].versions[0].text, text);
    }
    assert.throws(() => notes.edit(key, null, 'a', '\uD800'));
    assert.throws(() => notes.edit({ ...key, profileId: '\u001c' }, null, 'a', 'A'));
    assert.doesNotThrow(() => notes.edit({ ...key, profileId: '\uFEFF' }, null, 'a', 'A'));
});
test('malformed, deeply nested and oversized envelopes are rejected', () => {
    for (const raw of ['[]', '{} trailing', '{unquoted:1}', "{'single':1}", '['.repeat(10) + ']'.repeat(10), ' '.repeat(16777217)]) {
        assert.throws(() => notes.decode(raw, ['default']));
    }
});
