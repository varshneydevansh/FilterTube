// #79: pending card placeholders must never eat taps or read as a flat white
// block, and resolved category/language answers must survive settings snapshots
// so a hidden card does not flash back (hide/unhide loop).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const helpers = fs.readFileSync(new URL('../../js/content/dom_helpers.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../../js/content/bridge_settings.js', import.meta.url), 'utf8');
const id = 'abcdefghijk';

function styleText() {
  const appended = [];
  const context = vm.createContext({
    document: {
      getElementById: () => null,
      createElement: () => ({}),
      head: { appendChild: node => appended.push(node) }
    }
  });
  const start = helpers.indexOf('function ensureStyles()');
  const end = helpers.indexOf('\n/**', start);
  vm.runInContext(helpers.slice(start, end), context);
  context.ensureStyles();
  assert.equal(appended.length, 1);
  return appended[0].textContent;
}

function rulesFor(css, selectorNeedle) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => selector.includes(selectorNeedle))
    .map(([, selector, body]) => ({ selector: selector.trim(), body }));
}

test('pending card and watch-rail placeholders never use pointer-events:none', () => {
  const css = styleText();
  for (const needle of ['[data-filtertube-pending-category]', '[data-filtertube-pending-language]',
    '[data-filtertube-pending-upload-date]', '[data-filtertube-watch-category-state="pending"]']) {
    const rules = rulesFor(css, needle);
    assert.ok(rules.length > 0, needle);
    for (const rule of rules) assert.doesNotMatch(rule.body, /pointer-events\s*:\s*none/, rule.selector);
  }
});

test('pending placeholders use YouTube theme variables and keep the card layout box', () => {
  const css = styleText();
  const after = rulesFor(css, '[data-filtertube-pending-category]::after');
  assert.ok(after.length > 0);
  assert.match(after[0].body, /var\(--yt-spec-badge-chip-background/);
  assert.match(after[0].body, /var\(--yt-spec-10-percent-layer/);
  assert.doesNotMatch(css, /rgba\(148, 163, 184/);
  assert.doesNotMatch(css, /--yt-spec-general-background-a, #f2f2f2/);
  const children = rulesFor(css, '[data-filtertube-pending-category] > *');
  assert.match(children[0].body, /visibility:\s*hidden/);
  assert.doesNotMatch(children[0].body, /display\s*:\s*none/);
});

function retention(current) {
  const start = bridge.indexOf('function retainVerifiedVideoMetadata(');
  const end = bridge.indexOf('function sendSettingsToMainWorld(', start);
  const context = vm.createContext({ window: {}, currentSettings: current });
  vm.runInContext(bridge.slice(start, end), context);
  return context;
}

test('resolved category and language survive a snapshot that omits them', () => {
  const context = retention({ videoMetaMap: { [id]: { category: 'Music', languageCode: 'de', languageSource: 'captions' } } });
  const snapshot = { videoMetaMap: { [id]: { category: '', languageCode: '' } } };
  context.retainVerifiedVideoMetadata(snapshot);
  assert.equal(snapshot.videoMetaMap[id].category, 'Music');
  assert.equal(snapshot.videoMetaMap[id].languageCode, 'de');
  const missing = { videoMetaMap: {} };
  context.retainVerifiedVideoMetadata(missing);
  assert.equal(missing.videoMetaMap[id].category, 'Music');
  assert.equal(missing.videoMetaMap[id].channelName, undefined);
});

test('incoming category/language win and unverified identity is never promoted', () => {
  const context = retention({ videoMetaMap: { [id]: { category: 'Music', channelName: 'Hint', title: 'Hint' } } });
  const snapshot = { videoMetaMap: { [id]: { category: 'News', languageCode: 'en' } } };
  context.retainVerifiedVideoMetadata(snapshot);
  assert.equal(snapshot.videoMetaMap[id].category, 'News');
  assert.equal(snapshot.videoMetaMap[id].languageCode, 'en');
  const empty = { videoMetaMap: {} };
  context.retainVerifiedVideoMetadata(empty);
  assert.equal(empty.videoMetaMap[id].channelName, undefined);
  assert.equal(empty.videoMetaMap[id].title, undefined);
});

test('a stale player-unavailable language is not retained as an answer', () => {
  const context = retention({ videoMetaMap: { [id]: { languageCode: 'und', languageSource: 'player-unavailable' } } });
  const snapshot = { videoMetaMap: {} };
  context.retainVerifiedVideoMetadata(snapshot);
  assert.equal(snapshot.videoMetaMap[id], undefined);
});
