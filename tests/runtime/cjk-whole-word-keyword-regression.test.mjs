// Regression for #79: whole-word (exact) keywords in Han/Hangul/Kana scripts
// must match inside sentences, because those scripts have no word spacing and
// Korean attaches particles (가, 은, 들...) directly to nouns. Latin/Cyrillic
// exact keywords keep the Unicode whole-word boundary.
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

const plain = value => JSON.parse(JSON.stringify(value));

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function loadSharedCompileKeywords() {
  const source = fs.readFileSync('js/settings_shared.js', 'utf8');
  const context = { console, chrome: { storage: { local: {} }, runtime: {} } };
  context.window = context;
  vm.runInNewContext(source, context, { filename: 'js/settings_shared.js' });
  return context.FilterTubeSettings.compileKeywords;
}

function loadBackgroundCompileKeywordPattern() {
  const source = fs.readFileSync('js/background.js', 'utf8');
  const block = sliceBetween(source, 'const escapeRegex = (value) =>', 'const sanitizeKeywordDateFilter =');
  return vm.runInNewContext(`(() => { ${block}; return compileKeywordPattern; })()`, {}, { filename: 'js/background.js' });
}

const compileKeywords = loadSharedCompileKeywords();
const compileKeywordPattern = loadBackgroundCompileKeywordPattern();

const compilers = {
  shared: (word, extra = {}) => compileKeywords([{ word, exact: true, ...extra }])[0],
  background: word => compileKeywordPattern(word, true)
};

const matches = (compiled, text) => new RegExp(compiled.pattern, compiled.flags).test(text);

const cjkCases = [
  ['좌파', ['좌파가 문제', '좌파들은…', '진짜 좌파 맞네', '좌파']],
  ['日本', ['日本語が好きです', 'これは日本の話']],
  ['カタカナ', ['これはカタカナです']],
  ['ひらがな', ['ひらがなを書く']],
  ['中国', ['我在中国工作', '中国人']]
];

for (const [name, compile] of Object.entries(compilers)) {
  test(`${name} compiler: exact CJK keywords match inside sentences (#79)`, () => {
    for (const [word, texts] of cjkCases) {
      const compiled = compile(word);
      for (const text of texts) {
        assert.ok(matches(compiled, text), `${word} should match ${text}`);
      }
      assert.ok(!matches(compiled, 'unrelated english text'), `${word} must not match unrelated text`);
    }
  });

  test(`${name} compiler: Latin and Cyrillic exact keywords stay whole-word`, () => {
    const example = compile('example');
    assert.ok(matches(example, 'This is an example sentence.'));
    assert.ok(matches(example, 'EXAMPLE'));
    assert.ok(!matches(example, 'counterexample'));
    assert.ok(!matches(example, 'examples'));
    assert.equal(example.pattern, '(^|[^\\p{L}\\p{N}_])example(?=$|[^\\p{L}\\p{N}_])');
    assert.equal(example.flags, 'iu');

    const cyrillic = compile('кот');
    assert.ok(matches(cyrillic, 'мой кот спит'));
    assert.ok(!matches(cyrillic, 'котлета'));
  });

  test(`${name} compiler: CJK keywords are escaped as literal substrings`, () => {
    const compiled = compile('좌파(진짜)?');
    assert.ok(matches(compiled, '이건 좌파(진짜)?라고'));
    assert.ok(!matches(compiled, '좌파진짜'));
  });
}

test('shared compiler: comment-scoped exact CJK rules use the same behavior', () => {
  const keywords = [
    { word: '좌파', exact: true, comments: true, scope: 'comment' },
    { word: 'example', exact: true, comments: true, scope: 'comment' }
  ];
  const commentRules = compileKeywords(keywords, entry => entry.comments === true);
  const titleRules = compileKeywords(keywords, entry => entry.scope !== 'comment');
  assert.equal(titleRules.length, 0);
  assert.equal(commentRules.length, 2);
  const [korean, english] = commentRules;
  assert.ok(matches(korean, '좌파가 문제'));
  assert.ok(matches(korean, '좌파들은…'));
  assert.ok(matches(english, 'an example here'));
  assert.ok(!matches(english, 'counterexample'));
});

function videoRenderer(title) {
  return {
    contents: [{
      videoRenderer: {
        videoId: 'cjkfixture01',
        title: { runs: [{ text: title }] },
        shortBylineText: { runs: [{ text: 'Calm Channel' }] }
      }
    }]
  };
}

function commentRenderer(text) {
  return {
    contents: [{
      commentRenderer: {
        commentId: 'Ugw-cjk-fixture',
        authorText: { simpleText: 'Calm Commenter' },
        contentText: { runs: [{ text }] }
      }
    }]
  };
}

function runEngine(payload, overrides) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  }, 'cjk-keyword-fixture');
}

test('filter engine hides titles and comments for exact CJK keywords', () => {
  const rule = compilers.shared('좌파');
  for (const text of ['좌파가 문제', '좌파들은…', '진짜 좌파 맞네']) {
    assert.deepEqual(plain(runEngine(commentRenderer(text), { filterKeywordsComments: [rule] })), { contents: [] }, text);
    assert.deepEqual(plain(runEngine(videoRenderer(text), { filterKeywords: [rule] })), { contents: [] }, text);
  }
  const kept = commentRenderer('완전히 다른 댓글');
  assert.deepEqual(plain(runEngine(kept, { filterKeywordsComments: [rule] })), plain(kept));

  const example = compilers.shared('example');
  const counter = commentRenderer('a counterexample');
  assert.deepEqual(plain(runEngine(counter, { filterKeywordsComments: [example] })), plain(counter));
  assert.deepEqual(plain(runEngine(commentRenderer('This is an example sentence.'), { filterKeywordsComments: [example] })), { contents: [] });
});

function createImportContext() {
  const storage = {
    ftProfilesV4: {
      schemaVersion: 4,
      activeProfileId: 'default',
      profiles: {
        default: {
          type: 'account', parentProfileId: null, name: 'Default', settings: {},
          main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [], videoIds: [], blockedVideoIds: [] },
          kids: { mode: 'blocklist', strictMode: true, blockedChannels: [], blockedKeywords: [], whitelistChannels: [], whitelistKeywords: [] }
        }
      }
    }
  };
  const runtime = { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) };
  const local = {
    QUOTA_BYTES: 10 * 1024 * 1024,
    get(keys, callback) {
      let result = {};
      if (keys == null) result = { ...storage };
      else if (Array.isArray(keys)) keys.forEach(key => { result[key] = storage[key]; });
      else if (typeof keys === 'string') result[keys] = storage[keys];
      else if (keys && typeof keys === 'object') {
        result = { ...keys };
        Object.keys(keys).forEach(key => {
          if (Object.prototype.hasOwnProperty.call(storage, key)) result[key] = storage[key];
        });
      }
      callback(result);
    },
    set(payload, callback) { Object.assign(storage, structuredClone(payload)); callback?.(); },
    remove(keys, callback) { keys.forEach(key => delete storage[key]); callback?.(); },
    getBytesInUse(_keys, callback) { callback(Buffer.byteLength(JSON.stringify(storage))); }
  };
  const context = {
    console, Date, JSON, Math, TextEncoder, setTimeout, clearTimeout, structuredClone,
    __storage: storage,
    chrome: { runtime, storage: { local } }
  };
  context.window = context;
  context.FilterTubeSettings = {
    loadSettings: async () => ({
      enabled: true,
      channels: plain(storage.ftProfilesV4.profiles.default.main.channels),
      keywords: plain(storage.ftProfilesV4.profiles.default.main.keywords),
      channelMap: {},
      contentFilters: {}
    }),
    saveSettings: async () => ({ compiledSettings: {}, error: null }),
    setThemePreference: async () => {}
  };
  installNanahStorageLock(context);
  vm.runInNewContext(fs.readFileSync('js/io_manager.js', 'utf8'), context, { filename: 'js/io_manager.js' });
  return context;
}

test('BlockTube import keeps whole-word rules, and CJK comment keywords match after compile', async () => {
  const context = createImportContext();
  const result = await context.FilterTubeIO.importV3({
    filterData: {
      title: ['example'],
      channelName: [], channelId: [], videoId: [],
      comment: ['좌파'],
      vidLength: [], javascript: []
    },
    options: {}
  }, { strategy: 'merge', scope: 'auto' });
  assert.equal(result.ok, true);

  const keywords = plain(context.__storage.ftProfilesV4.profiles.default.main.keywords);
  const korean = keywords.find(entry => entry.word === '좌파');
  const english = keywords.find(entry => entry.word === 'example');
  assert.equal(korean.exact, true);
  assert.equal(korean.scope, 'comment');
  assert.equal(english.exact, true);

  const commentRules = compileKeywords(keywords, entry => entry.comments === true);
  const koreanRule = commentRules.find(rule => rule.pattern === '좌파');
  assert.ok(koreanRule, 'imported Korean comment rule compiles to a substring');
  for (const text of ['좌파가 문제', '좌파들은…', '진짜 좌파 맞네']) {
    assert.deepEqual(plain(runEngine(commentRenderer(text), { filterKeywordsComments: commentRules })), { contents: [] }, text);
  }

  const titleRules = compileKeywords(keywords, entry => entry.scope !== 'comment');
  const englishRule = titleRules.find(rule => rule.pattern.includes('example'));
  assert.ok(matches(englishRule, 'This is an example sentence.'));
  assert.ok(!matches(englishRule, 'counterexample'));
});
