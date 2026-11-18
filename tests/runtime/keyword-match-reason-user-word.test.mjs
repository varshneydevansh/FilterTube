// A blocked keyword's reason names the word the user typed, never the compiled pattern.
// Owner report (3.6.2): with "AI" blocked as an exact word, the Watch page's blocked card read
//   Matched: (^|[^\p{L}\p{N}_])AI(?=$|[^\p{L}\p{N}_]) / Source: player description
// It now reads  Matched: "AI" (exact word) / Found in: the video description, translated.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const COMPILED_LEAK = /\\p\{|\(\^\||\(\?=/;

function sliceBetween(source, start, end) {
    const from = source.indexOf(start);
    assert.notEqual(from, -1, `missing ${start}`);
    const to = source.indexOf(end, from + start.length);
    assert.notEqual(to, -1, `missing ${end}`);
    return source.slice(from, to);
}

function loadIdentity() {
    const context = {};
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(read('js/shared/identity.js'), context);
    return context.FilterTubeIdentity;
}

function loadSettingsCompiler() {
    const context = { console: { log() {}, warn() {}, error() {} }, chrome: {} };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(read('js/settings_shared.js'), context);
    return context.FilterTubeSettings.compileKeywords;
}

// The DOM fallback's own RegExp builder and Watch-page decision + card text, with the shared identity.
function loadWatchAdmission() {
    const dom = read('js/content/dom_fallback.js');
    const context = {
        FilterTubeIdentity: loadIdentity(),
        WeakMap,
        compiledKeywordRegexCache: new WeakMap(),
        sanitizeKeywordDateFilter: value => ({ enabled: value?.enabled === true, ...(value || {}) }),
        keywordDateFilterAllows(regex, publishTimestamp) {
            const filter = regex.__filtertubeDateFilter;
            if (!filter?.enabled) return true;
            return Number.isFinite(publishTimestamp) && publishTimestamp >= new Date(filter.fromDate).getTime();
        },
        matchesKeyword(regex, value) { regex.lastIndex = 0; return regex.test(String(value || '')); },
        getCompiledChannelFilterIndex: () => null,
        channelMetaMatchesIndex: () => false,
        getStudyAdmissionLine: () => '',
        rememberAskParentTarget() {}
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext([
        sliceBetween(dom, 'function getCompiledKeywordRegexes(rawList) {', 'function getChannelMapLookup('),
        sliceBetween(dom, 'function getCurrentWatchAdmissionDecision(settings, context = {}) {', '// The Watch gate during Study'),
        sliceBetween(dom, 'function formatCurrentWatchAdmissionMessage(decision, ownerMeta = {}) {', 'const FILTERTUBE_BLOCKED_CHANNEL_PAGE_ID'),
        'this.compile = getCompiledKeywordRegexes;',
        'this.decide = getCurrentWatchAdmissionDecision;',
        'this.message = formatCurrentWatchAdmissionMessage;'
    ].join('\n'), context);
    return context;
}

function watchContext({ title = '', description = '', tags = '', ownerName = '', published = '2025-06-01' } = {}) {
    return {
        videoId: 'abcdefghijk',
        ownerMeta: { name: ownerName },
        searchText: [title, description, tags].filter(Boolean).join(' '),
        textFields: [
            { label: 'title', text: title },
            { label: 'player description', text: description },
            { label: 'YouTube metadata keywords', text: tags }
        ],
        publishTimestamp: new Date(published).getTime()
    };
}

test('the owner\'s case: an exact "AI" found in the description', () => {
    const compileKeywords = loadSettingsCompiler();
    const watch = loadWatchAdmission();
    const settings = { filterKeywords: compileKeywords([{ word: 'AI', exact: true }]) };
    const decision = watch.decide(settings, watchContext({ title: 'Weekly news', description: 'We test new AI tools.' }));
    assert.deepEqual(plain(decision), { blocked: true, kind: 'keyword', keyword: 'AI', keywordMode: 'exact', source: 'description' });
    const message = watch.message(decision);
    assert.equal(message, 'Blocked keyword\nMatched: "AI" (exact word)\nFound in: the video description');
    assert.doesNotMatch(message, COMPILED_LEAK);
});

test('partial, special-character and title matches name the typed word', () => {
    const compileKeywords = loadSettingsCompiler();
    const watch = loadWatchAdmission();
    const settings = { filterKeywords: compileKeywords([{ word: 'C++' }]) };
    const decision = watch.decide(settings, watchContext({ title: 'Learn C++ in a day' }));
    assert.equal(watch.message(decision), 'Blocked keyword\nMatched: "C++"\nFound in: the video title');
});

test('a date-conditioned keyword names its word, and still applies its date', () => {
    const compileKeywords = loadSettingsCompiler();
    const watch = loadWatchAdmission();
    const settings = {
        filterKeywords: compileKeywords([{ word: 'robot', exact: true, dateFilter: { enabled: true, condition: 'after', fromDate: '2025-01-01' } }])
    };
    const newer = watch.decide(settings, watchContext({ tags: 'robot toys', published: '2025-06-01' }));
    assert.equal(watch.message(newer), 'Blocked keyword\nMatched: "robot" (exact word)\nFound in: the video\'s tags');
    const older = watch.decide(settings, watchContext({ tags: 'robot toys', published: '2024-06-01' }));
    assert.equal(older.blocked, false);
});

test('a keyword found only in the channel name says so', () => {
    const compileKeywords = loadSettingsCompiler();
    const watch = loadWatchAdmission();
    const settings = { filterKeywords: compileKeywords([{ word: 'Prank', exact: true }]) };
    const decision = watch.decide(settings, watchContext({ title: 'Funny day', ownerName: 'Prank Kings' }));
    assert.equal(watch.message(decision), 'Blocked keyword\nMatched: "Prank" (exact word)\nFound in: the channel name');
});

test('a regular expression the user wrote is shown as that pattern', () => {
    const compileKeywords = loadSettingsCompiler();
    const watch = loadWatchAdmission();
    const settings = { filterKeywords: compileKeywords([{ word: 'unbox(ing)?', matchMode: 'regex', regexFlags: 'i' }]) };
    const decision = watch.decide(settings, watchContext({ title: 'Unboxing a phone' }));
    assert.equal(watch.message(decision), 'Blocked keyword\nMatched: "unbox(ing)?" (pattern)\nFound in: the video title');
});

test('describeKeywordRule reads every compiled shape back to the typed word', () => {
    const Identity = loadIdentity();
    const compileKeywords = loadSettingsCompiler();
    const describe = rule => plain(Identity.describeKeywordRule(rule));
    const compiled = compileKeywords([
        { word: 'AI', exact: true },
        { word: 'AI' },
        { word: '猫', exact: true },
        { word: 'a/b' },
        { word: 'robot', exact: true, dateFilter: { enabled: true, condition: 'after', fromDate: '2025-01-01' } }
    ]);
    assert.deepEqual(compiled.map(item => describe(item).word), ['AI', 'AI', '猫', 'a/b', 'robot']);
    assert.deepEqual(compiled.map(item => describe(item).mode), ['exact', 'partial', 'exact', 'partial', 'exact']);
    assert.equal(describe(compiled[4]).dateFilter.fromDate, '2025-01-01');
    // As RegExps (the page worlds compile them): flags, escapes and the 'u' boundary survive.
    assert.deepEqual(compiled.map(item => describe(new RegExp(item.pattern, item.flags)).word), ['AI', 'AI', '猫', 'a/b', 'robot']);
    // The apps' FilterPayloadCompiler rows ({ pattern, flags, exact, matchMode }) and legacy \b rows.
    assert.deepEqual(describe({ pattern: '(^|[^\\p{L}\\p{N}_])AI(?=$|[^\\p{L}\\p{N}_])', flags: 'iu', exact: true }),
        { word: 'AI', mode: 'exact', dateFilter: null });
    assert.deepEqual(describe({ pattern: 'cat\\+dog', flags: 'i', exact: false }), { word: 'cat+dog', mode: 'partial', dateFilter: null });
    assert.deepEqual(describe({ pattern: 'cat', flags: 'iu', exact: false, matchMode: 'regex' }), { word: 'cat', mode: 'pattern', dateFilter: null });
    assert.deepEqual(describe(/\bcat\b/i), { word: 'cat', mode: 'exact', dateFilter: null });
    assert.equal(Identity.describeKeywordRule(null), null);
    assert.equal(Identity.keywordRuleLabel(new RegExp('(^|[^\\p{L}\\p{N}_])AI(?=$|[^\\p{L}\\p{N}_])', 'iu')), '"AI" (exact word)');
});

test('comment-filter keywords describe the same way', () => {
    const Identity = loadIdentity();
    const compileKeywords = loadSettingsCompiler();
    const comments = compileKeywords(
        [{ word: 'spoiler', exact: true, comments: true }, { word: 'hidden', comments: false }, { word: 'lol', comments: true }],
        entry => entry.comments === true
    );
    assert.deepEqual(comments.map(item => Identity.keywordRuleLabel(new RegExp(item.pattern, item.flags))), ['"spoiler" (exact word)', '"lol"']);
});

test('the DOM fallback carries the rule mode onto its RegExps', () => {
    const watch = loadWatchAdmission();
    const [regexRow, exactCjk] = watch.compile([
        { pattern: 'cat', flags: 'iu', matchMode: 'regex' },
        { pattern: '猫', flags: 'iu', exact: true }
    ]);
    assert.deepEqual(plain(regexRow.__filtertubeKeyword), { matchMode: 'regex', exact: false });
    assert.equal(watch.FilterTubeIdentity.keywordRuleLabel(regexRow), '"cat" (pattern)');
    assert.equal(watch.FilterTubeIdentity.keywordRuleLabel(exactCjk), '"猫" (exact word)');
});

function loadOverlayLocalizer(catalog) {
    const overlay = read('js/content/admission_overlay.js');
    const context = { localeCatalog: catalog };
    vm.createContext(context);
    vm.runInContext(`${sliceBetween(overlay, '    function localizedAdmissionText(key, fallback) {', '    function loadAdmissionLocale(overlay) {')}
        this.localize = localizedAdmissionMessage;`, context);
    return context.localize;
}

test('the blocked card translates the reason lines and keeps the user\'s word', () => {
    const english = loadOverlayLocalizer(null);
    const message = 'Blocked keyword\nMatched: "AI" (exact word)\nFound in: the video description';
    assert.equal(english(message), message);
    const german = loadOverlayLocalizer(JSON.parse(read('data/ui_locales/de.json')));
    assert.equal(german(message), 'Gesperrtes Schlüsselwort\nTreffer: „AI“ (exaktes Wort)\nGefunden in: der Videobeschreibung');
    const hindi = loadOverlayLocalizer(JSON.parse(read('data/ui_locales/hi.json')));
    assert.match(hindi('Matched: "AI"'), /«AI»/);
});

test('every released locale has the reason strings with the {word} placeholder', () => {
    const targets = JSON.parse(read('data/ui_locales/targets.json')).locales.map(entry => entry.code);
    const withWord = ['admission.matchedExactWord', 'admission.matchedWord', 'admission.matchedPattern'];
    const plainKeys = ['admission.matchedBlockedWord', 'admission.foundInTitle', 'admission.foundInDescription',
        'admission.foundInTags', 'admission.foundInChannel', 'admission.foundInDetails'];
    for (const locale of targets) {
        const catalog = JSON.parse(read(`data/ui_locales/${locale}.json`));
        for (const key of withWord) assert.match(String(catalog[key] || ''), /\{word\}/, `${locale}:${key}`);
        for (const key of plainKeys) assert.ok(String(catalog[key] || '').trim(), `${locale}:${key}`);
    }
});

test('no surface prints a keyword RegExp source: Watch card, embeds, page logs', () => {
    const guard = read('js/content/external_youtube_guard.js');
    const filterLogic = read('js/filter_logic.js');
    const dom = read('js/content/dom_fallback.js');
    assert.doesNotMatch(guard, /pattern: regex\.source/);
    assert.match(guard, /keywordMatchReasonLines\?\.\(decision\)/);
    assert.doesNotMatch(filterLogic, /keywordRegex\.source/);
    assert.doesNotMatch(dom, /pattern: regex\.source/);
    assert.doesNotMatch(dom, /keyword: regex\.source/);
    assert.doesNotMatch(dom, /\\nSource: /);
});
