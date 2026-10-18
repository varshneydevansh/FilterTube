import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
const start = source.indexOf('function getCategoryMetadataWaitState(');
const end = source.indexOf('\nfunction getLanguagePolicySignature(', start);
assert.ok(start >= 0 && end > start);

function runtime() {
  const context = vm.createContext({});
  vm.runInContext(`const categoryMetadataWaitByCard = new WeakMap();\n${source.slice(start, end)}`, context);
  return (card, { video = 'abcdefghijk', policy = '1:block:music', unknown = true,
    allow = false, queued = true, now = 100000 } = {}) => JSON.parse(JSON.stringify(
    context.getCategoryMetadataWaitState(card, video, policy, unknown, allow, queued, now)
  ));
}

test('queued category lookup cannot keep a block-mode card blank beyond eight seconds', () => {
  const wait = runtime();
  const card = {};
  assert.deepEqual(wait(card), { pending: true, unavailable: false, remainingMs: 8000 });
  assert.equal(wait(card, { now: 107999 }).pending, true);
  for (const now of [108000, 109000, 161000]) {
    assert.deepEqual(wait(card, { now }), { pending: false, unavailable: false, remainingMs: 0 });
  }
});

test('rescans and queue suppression do not restart the original visual deadline', () => {
  const wait = runtime();
  const card = {};
  wait(card);
  assert.equal(wait(card, { now: 104000, queued: false }).pending, false);
  assert.equal(wait(card, { now: 107000 }).remainingMs, 1000);
  assert.equal(wait(card, { now: 110000 }).pending, false);
});

test('allow-only remains unavailable after its deadline even while lookup is queued', () => {
  const wait = runtime();
  const card = {};
  assert.equal(wait(card, { allow: true, queued: false }).pending, true);
  assert.deepEqual(wait(card, { allow: true, now: 108000 }), {
    pending: false, unavailable: true, remainingMs: 0
  });
  assert.equal(wait(card, { allow: true, queued: false, now: 161000 }).unavailable, true);
});

test('recycled cards, policy changes and resolved metadata reset the appropriate lifetime', () => {
  const wait = runtime();
  const card = {};
  wait(card);
  assert.equal(wait(card, { now: 109000 }).pending, false);
  assert.equal(wait(card, { video: 'lmnopqrstuv', now: 109000 }).remainingMs, 8000);
  assert.equal(wait(card, { policy: '1:allow:music', allow: true, now: 110000 }).remainingMs, 8000);
  assert.equal(wait(card, { unknown: false, now: 111000 }).pending, false);
  assert.equal(wait(card, { now: 112000 }).remainingMs, 8000);
});

test('independent cards retain independent deadlines and no queue creates no block-mode veil', () => {
  const wait = runtime();
  const first = {};
  const second = {};
  assert.equal(wait(first, { queued: false }).pending, false);
  wait(first, { now: 101000 });
  wait(second, { now: 105000 });
  assert.equal(wait(first, { now: 109000 }).pending, false);
  assert.equal(wait(second, { now: 109000 }).remainingMs, 4000);
});
