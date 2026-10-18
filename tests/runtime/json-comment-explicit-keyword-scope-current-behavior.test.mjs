import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const BLOCKED_ID = `UC${'a'.repeat(22)}`;
const OTHER_ID = `UC${'b'.repeat(22)}`;
const plain = value => JSON.parse(JSON.stringify(value));

function compile(overrides = {}) {
  const context = {
    console, Date, JSON, Promise,
    chrome: { storage: { local: {
      get(_keys, callback) { callback({}); },
      set(_payload, callback) { callback?.(); }
    } } }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInContext(fs.readFileSync('js/settings_shared.js', 'utf8'), vm.createContext(context), {
    filename: 'js/settings_shared.js'
  });
  return plain(context.FilterTubeSettings.buildCompiledSettings({
    keywords: [], channels: [], enabled: true, hideShorts: false,
    hideComments: false, contentFilters: {}, categoryFilters: {}, ...overrides
  }));
}

function channel(filterAllComments) {
  return { id: BLOCKED_ID, name: 'Muted Channel', handle: '@muted',
    filterAll: true, filterAllComments, addedAt: 1 };
}

function comment(text, authorId = OTHER_ID, authorName = 'Other Author') {
  return { commentRenderer: {
    commentId: 'scope-comment', authorText: { simpleText: authorName },
    authorEndpoint: { browseEndpoint: { browseId: authorId, canonicalBaseUrl: '/@fixture' } },
    contentText: { runs: [{ text }] }
  } };
}

function video(text) {
  return { videoRenderer: {
    videoId: 'scopevideo1', title: { simpleText: text },
    shortBylineText: { runs: [{ text: 'Other Author', navigationEndpoint: {
      browseEndpoint: { browseId: OTHER_ID }
    } }] }
  } };
}

function process(items, settings) {
  const { engine, logs } = loadFilterTubeEngine();
  const result = plain(engine.processData({ contents: plain(items) }, {
    enabled: true, listMode: 'blocklist', filterKeywords: [], filterChannels: [],
    whitelistChannels: [], whitelistKeywords: [], ...settings
  }, 'comment-scope-fixture'));
  assert.equal(logs.filter(entry => entry.level === 'error').length, 0);
  return result.contents;
}

test('real compiler channel title-only rule preserves an unrelated-author mention but blocks the video', () => {
  const settings = compile({ channels: [channel(false)] });
  assert.equal(settings.filterKeywords.length, 1);
  assert.equal(settings.filterKeywordsComments.length, 0);
  const kept = comment('I mention Muted Channel here');
  assert.deepEqual(process([kept, video('Muted Channel news')], settings), [kept]);
});

test('real compiler channel comment opt-in blocks mentions by unrelated authors', () => {
  const settings = compile({ channels: [channel(true)] });
  assert.equal(settings.filterKeywordsComments.length, 1);
  assert.deepEqual(process([comment('I mention Muted Channel here')], settings), []);
});

for (const filterAllComments of [false, true]) {
  test(`blocked author remains blocked with filterAllComments=${filterAllComments}`, () => {
    assert.deepEqual(process([comment('A completely ordinary reply', BLOCKED_ID, 'Muted Channel')],
      compile({ channels: [channel(filterAllComments)] })), []);
  });
}

test('real compiler video-only user keyword does not become a comment keyword', () => {
  const settings = compile({ keywords: [{ word: 'spider', comments: false, source: 'user' }] });
  assert.equal(settings.filterKeywords.length, 1);
  assert.equal(settings.filterKeywordsComments.length, 0);
  const kept = comment('A spider appears inside this sentence');
  assert.deepEqual(process([kept, video('A spider appears')], settings), [kept]);
});

test('real compiler comment-enabled user keyword matches inside a sentence', () => {
  const settings = compile({ keywords: [{ word: 'spider', comments: true, source: 'user' }] });
  assert.equal(settings.filterKeywordsComments.length, 1);
  assert.deepEqual(process([comment('A spider appears inside this sentence')], settings), []);
});

test('explicit separate comment matchers own comment text instead of video matchers', () => {
  const kept = comment('The spider stays here');
  assert.deepEqual(process([kept, comment('The butterfly is removed')], {
    filterKeywords: [{ pattern: 'spider', flags: 'i' }],
    filterKeywordsComments: [{ pattern: 'butterfly', flags: 'i' }]
  }), [kept]);
});

test('video keyword in unrelated author metadata does not hide an ordinary comment', () => {
  const kept = comment('An ordinary reply', OTHER_ID, 'spider enthusiast');
  assert.deepEqual(process([kept], {
    filterKeywords: [{ pattern: 'spider', flags: 'i' }], filterKeywordsComments: []
  }), [kept]);
});

test('absent separate comment list preserves legacy comment-body keyword fallback', () => {
  assert.deepEqual(process([comment('A spider appears inside this sentence')], {
    filterKeywords: [{ pattern: 'spider', flags: 'i' }]
  }), []);
});

test('explicit empty comment list does not disable Hide All Comments', () => {
  assert.deepEqual(process([comment('An ordinary reply')], {
    filterKeywordsComments: [], hideAllComments: true
  }), []);
});

test('disabled filtering preserves comment and video matches', () => {
  const items = [comment('Muted Channel'), video('Muted Channel')];
  assert.deepEqual(process(items, compile({ channels: [channel(true)], enabled: false })), items);
});

test('serialized Unicode exact and regular-expression comment matchers retain their scope', () => {
  const kept = comment('примеры слова');
  const title = video('пример or butterfly');
  assert.deepEqual(process([comment('Вот пример слова'), kept, comment('A butterfly flutters'), title], {
    filterKeywordsComments: [
      { pattern: '(^|[^\\p{L}\\p{N}_])пример(?=$|[^\\p{L}\\p{N}_])', flags: 'iu' },
      { pattern: 'butterfl(?:y|ies)', flags: 'i' }
    ]
  }), [kept, title]);
});
