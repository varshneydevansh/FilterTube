import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// The Nanah Main/Kids merge keeps one rule per word and match type, as Android (76736db8c) and iOS do.
// Comments is a setting of the rule: an explicit incoming value wins, a missing one keeps this device's.
const source = fs.readFileSync(new URL('../../js/nanah_sync_adapter.js', import.meta.url), 'utf8');

function fixture(keywords) {
  let root = { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
    type: 'account', name: 'Default', settings: {}, kids: { mode: 'blocklist' },
    main: { mode: 'blocklist', channels: [], keywords }
  } } };
  const io = {
    exportV3: async () => ({}), importV3: async () => ({ ok: true }),
    loadProfilesV4: async () => JSON.parse(JSON.stringify(root)),
    saveProfilesV4: async next => { root = JSON.parse(JSON.stringify(next)); return { ok: true }; }
  };
  const box = { console, FilterTubeIO: io, crypto: globalThis.crypto, TextEncoder, TextDecoder };
  box.window = box;
  vm.createContext(box);
  vm.runInContext(source, box);
  return { adapter: box.FilterTubeNanahAdapter, words: () => root.profiles.default.main.keywords };
}

function envelope(keywords) {
  return { t: 'app_sync', scope: 'main', payload: JSON.stringify({ section: 'main', data: { mode: 'blocklist', keywords } }) };
}

test('a keyword merges once whatever the other device writes for comments', async () => {
  const f = fixture([
    { word: 'clickbait', source: 'user' },
    { word: 'gambling', exact: true, source: 'user' },
    { word: 'prank', comments: true, source: 'user' }
  ]);
  await f.adapter.applyIncomingEnvelope(envelope([
    { word: 'Clickbait', comments: false },
    { word: 'gambling', exact: true },
    { word: 'prank ', comments: false },
    { word: 'spoiler', comments: true }
  ]), { strategy: 'merge' });
  const rows = f.words();
  assert.deepEqual(rows.map(row => `${row.word.trim().toLowerCase()}|${row.exact === true}`).sort(),
    ['clickbait|false', 'gambling|true', 'prank|false', 'spoiler|false']);
  const gambling = rows.find(row => row.word === 'gambling');
  assert.equal(Object.hasOwn(gambling, 'comments'), false, 'missing comments keeps the local (absent) choice');
  assert.equal(rows.find(row => row.word.trim() === 'prank').comments, false, 'explicit incoming comments wins');
});

test('missing incoming comments keeps an explicit local value', async () => {
  const f = fixture([{ word: 'prank', comments: true, source: 'user' }]);
  await f.adapter.applyIncomingEnvelope(envelope([{ word: 'PRANK' }]), { strategy: 'merge' });
  assert.equal(f.words().length, 1);
  assert.equal(f.words()[0].comments, true);
});

test('whitespace is collapsed and the packed |label= source is not identity', async () => {
  const f = fixture([{ word: 'result  live', source: 'channel:uc_abc|label=@one' }]);
  await f.adapter.applyIncomingEnvelope(envelope([{ word: ' Result live ', source: 'channel:uc_abc|label=@two' }]), { strategy: 'merge' });
  assert.equal(f.words().length, 1);
});

test('exact, semantic, regex and regex flags still make separate rules', async () => {
  const f = fixture([{ word: 'clickbait', source: 'user' }]);
  await f.adapter.applyIncomingEnvelope(envelope([
    { word: 'clickbait', exact: true },
    { word: 'clickbait', semantic: true },
    { word: 'click.*bait', matchMode: 'regex', regexFlags: 'i' },
    { word: 'click.*bait', matchMode: 'regex', regexFlags: '' },
    { word: 'click.*bait' }
  ]), { strategy: 'merge' });
  assert.equal(f.words().length, 6);
});
