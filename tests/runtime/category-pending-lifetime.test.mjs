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

const NOT_PENDING = { pending: false, unavailable: false, remainingMs: 0 };

// #79: block-selected policies never veil a card while its category is loading.
// The card stays visible and interactive and is hidden only on a confirmed match.
test('block-selected never veils an unresolved card, queued or not', () => {
  const wait = runtime();
  const card = {};
  for (const now of [100000, 104000, 107999, 108000, 161000]) {
    assert.deepEqual(wait(card, { now }), NOT_PENDING);
    assert.deepEqual(wait(card, { now, queued: false }), NOT_PENDING);
  }
});

test('allow-only keeps one bounded deadline that rescans and queue suppression do not restart', () => {
  const wait = runtime();
  const card = {};
  const allow = { allow: true, policy: '1:allow:music' };
  assert.deepEqual(wait(card, allow), { pending: true, unavailable: false, remainingMs: 8000 });
  assert.equal(wait(card, { ...allow, now: 104000, queued: false }).remainingMs, 4000);
  assert.equal(wait(card, { ...allow, now: 107000 }).remainingMs, 1000);
  assert.equal(wait(card, { ...allow, now: 107999 }).pending, true);
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

test('recycled cards, policy changes and resolved metadata reset the allow-only lifetime', () => {
  const wait = runtime();
  const card = {};
  const allow = { allow: true, policy: '1:allow:music' };
  wait(card, allow);
  assert.equal(wait(card, { ...allow, now: 109000 }).unavailable, true);
  assert.equal(wait(card, { ...allow, video: 'lmnopqrstuv', now: 109000 }).remainingMs, 8000);
  assert.equal(wait(card, { allow: true, policy: '1:allow:music,news', now: 110000 }).remainingMs, 8000);
  assert.deepEqual(wait(card, { ...allow, unknown: false, now: 111000 }), NOT_PENDING);
  assert.equal(wait(card, { ...allow, now: 112000 }).remainingMs, 8000);
  // Switching the same card to block-selected drops the veil immediately.
  assert.deepEqual(wait(card, { policy: '1:block:music', now: 113000 }), NOT_PENDING);
});

test('independent allow-only cards retain independent deadlines', () => {
  const wait = runtime();
  const first = {};
  const second = {};
  const allow = { allow: true, policy: '1:allow:music' };
  wait(first, { ...allow, now: 101000 });
  wait(second, { ...allow, now: 105000 });
  assert.equal(wait(first, { ...allow, now: 109000 }).unavailable, true);
  assert.equal(wait(second, { ...allow, now: 109000 }).remainingMs, 4000);
});
