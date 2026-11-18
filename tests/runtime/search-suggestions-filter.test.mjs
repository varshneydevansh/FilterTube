import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const require = createRequire(import.meta.url);
const Suggest = require('../../js/shared/search_suggestions_filter.js');
const Dom = require('../../js/content/search_suggestions_dom.js');
const StudyEngine = require('../../js/shared/study_engine.js');

// Compiled the way background.js compiles keywords: whole word ("exact") and substring.
const exact = word => ({ pattern: `(^|[^\\p{L}\\p{N}_])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}_])`, flags: 'iu' });
const sub = word => ({ pattern: word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags: 'i' });
const topic = word => ({ ...exact(word), titleOnly: true });

const WRAP = 'window.google.ac.h(';
const jsonp = payload => `${WRAP}${JSON.stringify(payload)})`;
const texts = raw => Suggest.parse(raw).payload[1].map(entry => entry[0]);
const entries = raw => Suggest.parse(raw).payload[1];
const thumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const KHAN = 'UC4a-Gbdw7vOaccHmFo40b9g';
const PRANK = 'UCprankprankprank000000';
const SAMPLE = ['sat m', [
    ['sat math', 0, [512]],
    ['sat mari sajna ne punjabi song', 0, [512]],
    ['sat maths full course', 0, [512]],
    ['sat movie trailer', 0, [512, 433]],
    ['khan academy', 0, [512, 433, 131], { zaf: '@khanacademy', zai: 'https://yt3.example/k.jpg', zao: 'Khan Academy', zav: KHAN }],
    ['prank show', 0, [512, 433, 131], { zaf: '@PrankKing', zai: 'https://yt3.example/p.jpg', zao: 'Prank King', zav: PRANK }]
], { j: '5', k: 1 }];

// The owner's capture (FILTER_MODES_EDGE_CASES section 6, P0 #2): past searches with pictures.
const OWNER = ['', [
    ['jailer 2', 35, [512, 39], { zai: thumb('jailer2ABCD'), zal: 'jailer2ABCD' }],
    ['jailer 2 trailer', 35, [512, 39]],
    ['sat math practice test', 35, [512, 39], { zai: thumb('satmath0001'), zal: 'satmath0001' }],
    ['funny cat compilation', 35, [512, 39], { zai: thumb('catvideo001'), zal: 'catvideo001' }],
    ['cement grade test', 35, [512, 39]],
    ['khan academy algebra', 35, [512, 39], { zai: thumb('khanalg0001'), zal: 'khanalg0001' }]
], { j: '0', k: 1 }];

test('parse keeps the JSONP wrapper exactly and reads the payload', () => {
    const raw = jsonp(SAMPLE);
    const parsed = Suggest.parse(raw);
    assert.equal(parsed.prefix, WRAP);
    assert.equal(parsed.suffix, ')');
    assert.equal(parsed.payload[0], 'sat m');
    assert.equal(Suggest.serialize(parsed), raw);
    assert.equal(Suggest.parse(`)]}'\n${JSON.stringify(SAMPLE)}`).prefix, ")]}'\n");
    assert.equal(Suggest.parse(JSON.stringify(SAMPLE)).prefix, '');
});

test('malformed and foreign responses pass through untouched', () => {
    const settings = { listMode: 'blocklist', filterKeywords: [sub('prank')] };
    for (const raw of ['', 'not json', 'window.google.ac.h(', 'window.google.ac.h({"a":1})', '[1,2,3]', '<html></html>']) {
        assert.equal(Suggest.filterResponseText(raw, settings), raw);
        assert.equal(Suggest.filterResponseText(raw, null, { failClosed: true }), raw);
    }
    assert.equal(Suggest.parse(null), null);
});

test('allowsSearchText follows Android RuleLayerDecision.allowsText per layering', () => {
    const block = { listMode: 'blocklist', filterKeywords: [sub('jailer')], whitelistKeywords: [exact('jailer review')] };
    assert.equal(Suggest.allowsSearchText(block, 'jailer 2'), false);
    assert.equal(Suggest.allowsSearchText(block, 'jailer review'), true, 'block list: an allowed word wins');
    assert.equal(Suggest.allowsSearchText(block, 'cooking'), true);
    const allow = { listMode: 'whitelist', filterKeywords: [sub('hacks')], whitelistKeywords: [exact('sat math')] };
    assert.equal(Suggest.allowsSearchText(allow, 'cooking'), false);
    assert.equal(Suggest.allowsSearchText(allow, 'sat math hacks'), true, 'allow only: allowed and blocked equal, allowed wins');
    const layered = { ...allow, listLayered: true };
    assert.equal(Suggest.allowsSearchText(layered, 'sat math hacks'), false, 'layered: any blocked word hides');
    assert.equal(Suggest.allowsSearchText(layered, 'sat math'), true);
    assert.equal(Suggest.allowsSearchText({ ...allow, enabled: false }, 'cooking'), true);
    assert.equal(Suggest.allowsSearchText({ listMode: 'blocklist', study: { phase: 'rest' } }, 'anything'), false);
    // Allow lists made of channels only show those channels' names (review F-21).
    const channels = { listMode: 'whitelist', whitelistChannels: [{ id: KHAN, handle: '@khanacademy', name: 'Khan Academy' }] };
    assert.equal(Suggest.allowsSearchText(channels, 'khan academy calculus'), true);
    assert.equal(Suggest.allowsSearchText(channels, 'khanacademy'), true);
    assert.equal(Suggest.allowsSearchText(channels, 'khan'), false);
});

test('owner payload, block list: "jailer 2" goes when "jailer" is blocked; unknown pictures are stripped', () => {
    const settings = { listMode: 'blocklist', filterKeywords: [exact('jailer')], videoChannelMap: { satmath0001: KHAN } };
    const out = entries(Suggest.filterResponseText(jsonp(OWNER), settings));
    assert.deepEqual(out.map(entry => entry[0]), ['sat math practice test', 'funny cat compilation', 'cement grade test', 'khan academy algebra']);
    assert.equal(out[0][3].zal, 'satmath0001', 'a known, unblocked channel keeps its picture');
    assert.equal(out[1].length, 3, 'an unknown video loses its picture, keeps its words');
    // A blocked channel's video loses it too, and a non-canonical picture never stays.
    const blocked = { ...settings, filterChannels: [{ id: KHAN, handle: '@khanacademy', name: 'Khan Academy' }] };
    assert.equal(entries(Suggest.filterResponseText(jsonp(OWNER), blocked))[0].length, 3);
    const odd = ['', [['sat math', 35, [512], { zai: 'https://evil.example/vi/satmath0001/hqdefault.jpg', zal: 'satmath0001' }]], {}];
    assert.equal(entries(Suggest.filterResponseText(jsonp(odd), settings))[0].length, 3);
});

test('block list: a channel suggestion keeps its picture unless that channel is blocked', () => {
    const settings = { listMode: 'blocklist', filterKeywords: [exact('punjabi'), sub('trailer')], filterChannels: [{ id: PRANK, handle: '@prankking', name: 'Prank King' }] };
    const out = entries(Suggest.filterResponseText(jsonp(SAMPLE), settings));
    assert.deepEqual(out.map(entry => entry[0]), ['sat math', 'sat maths full course', 'khan academy', 'prank show']);
    assert.equal(out.find(entry => entry[0] === 'khan academy')[3].zav, KHAN);
    assert.equal(out.find(entry => entry[0] === 'prank show').length, 3);
});

test('block list with nothing to change leaves the text byte for byte', () => {
    const raw = jsonp(['sat m', [['sat math', 0, [512]]], { j: '5' }]);
    assert.equal(Suggest.filterResponseText(raw, { listMode: 'blocklist', filterKeywords: [sub('zzz')] }), raw);
    assert.equal(Suggest.filterResponseText(raw, { listMode: 'blocklist' }), raw, 'no rules, no work');
    assert.equal(Suggest.filterResponseText(raw, { enabled: false, listMode: 'whitelist' }), raw, 'switched off');
});

test('allow list keeps only allowed words, topics and channels, plus prefixes of topics', () => {
    const settings = {
        listMode: 'whitelist',
        whitelistKeywords: [exact('sat math'), exact('algebra'), topic('geometry')],
        whitelistChannels: [{ id: KHAN, handle: '@khanacademy', name: 'Khan Academy' }],
        filterKeywords: [sub('punjabi')]
    };
    const out = entries(Suggest.filterResponseText(jsonp(SAMPLE), settings));
    assert.deepEqual(out.map(entry => entry[0]), ['sat math', 'khan academy']);
    assert.equal(out[1][3].zav, KHAN, 'an allowed channel keeps its picture');
    const typed = ['alg', [['alg', 0, [512]], ['algorithm', 0, [512]], ['algae bloom', 0, [512]]], { j: '1' }];
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(typed), settings)), ['alg', 'algebra']);
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(['g', [['gaming', 0, [512]]], {}]), settings)), ['geometry']);
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(['kh', [], {}]), settings)), ['khan academy', 'khanacademy']);
});

test('owner payload, allow list: past searches keep allowed entries; pictures need an allowed channel', () => {
    const settings = { listMode: 'whitelist', listLayered: true, filterKeywords: [exact('jailer')],
        whitelistKeywords: [exact('sat math'), exact('algebra')],
        whitelistChannels: [{ id: KHAN, handle: '@khanacademy', name: 'Khan Academy' }],
        videoChannelMap: { satmath0001: 'UCsomeoneelse0000000000', khanalg0001: KHAN } };
    const out = entries(Suggest.filterResponseText(jsonp(OWNER), settings));
    assert.deepEqual(out.map(entry => entry[0]), ['sat math practice test', 'khan academy algebra']);
    assert.equal(out[0].length, 3, 'a video from a channel outside the allow list loses its picture');
    assert.equal(out[1][3].zal, 'khanalg0001');
});

test('Study keeps only plan terms, synonyms included ("cement" for GATE Civil); rest shows nothing', () => {
    const terms = StudyEngine.planSearchTerms(['building materials', 'surveying']);
    assert.ok(terms.includes('cement'));
    assert.deepEqual(StudyEngine.topicsForQuery('cement', ['building materials', 'surveying']), ['building materials']);
    const settings = { listMode: 'whitelist', listLayered: true, study: { phase: 'study', packIds: ['in_gate'] },
        filterKeywords: [exact('jailer')], whitelistKeywords: [topic('building materials'), topic('surveying')],
        whitelistChannels: [], studySearchTerms: terms };
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(OWNER), settings)), ['cement grade test']);
    assert.equal(Suggest.allowsSearchText(settings, 'cement'), true);
    assert.equal(Suggest.allowsSearchText(settings, 'beam'), false);
    // The whole query named in a term: "fly" is part of "fly ash".
    assert.equal(Suggest.allowsSearchText(settings, 'fly'), true);
    // Without the plan terms (outside a round) "cement" is just a word.
    assert.equal(Suggest.allowsSearchText({ ...settings, study: { phase: 'normal' } }, 'cement'), false);
    // Rest break, limit or hold: no suggestions at all, typed or past.
    const rest = { ...settings, study: { phase: 'rest' } };
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(OWNER), rest)), []);
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(['bui', [['building materials', 0, [512]]], {}]), rest)), []);
});

test('Kids: Kids matchers, past searches only when allowed, never a picture', () => {
    const kidsBlock = { listMode: 'blocklist', profileType: 'kids', filterKeywords: [sub('prank')] };
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(OWNER), kidsBlock)), []);
    const typed = entries(Suggest.filterResponseText(jsonp(SAMPLE), kidsBlock));
    assert.deepEqual(typed.map(entry => entry[0]), ['sat math', 'sat mari sajna ne punjabi song', 'sat maths full course', 'sat movie trailer', 'khan academy']);
    assert.ok(typed.every(entry => entry.length === 3), 'no pictures on Kids');
    const kidsAllow = { listMode: 'whitelist', profileType: 'kids', whitelistKeywords: [exact('sat math')],
        whitelistChannels: [{ id: KHAN, handle: '@khanacademy', name: 'Khan Academy' }], videoChannelMap: { khanalg0001: KHAN } };
    const allowed = entries(Suggest.filterResponseText(jsonp(SAMPLE), kidsAllow));
    assert.deepEqual(allowed.map(entry => entry[0]), ['sat math', 'khan academy']);
    assert.ok(allowed.every(entry => entry.length === 3), 'not even an allowed channel picture');
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(OWNER), kidsAllow)), ['sat math practice test', 'khan academy algebra']);
    // Kids via the host flag works the same.
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(OWNER), { listMode: 'blocklist' }, { kids: true })), []);
});

test('fail closed: without settings the list is empty', () => {
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(SAMPLE), null, { failClosed: true })), []);
    assert.deepEqual(Suggest.emptyPayload(SAMPLE)[1], []);
});

test('dated words are not judged on suggestions; real regex words still match', () => {
    const settings = { listMode: 'blocklist', filterKeywords: [{ ...sub('sat'), dateFilter: { enabled: true, condition: 'after', fromDate: '2026-01-01' } }, { pattern: 'mar[iy]', flags: 'i' }] };
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(SAMPLE), settings)), ['sat math', 'sat maths full course', 'sat movie trailer', 'khan academy', 'prank show']);
    assert.equal(Suggest.literalOf({ pattern: 'mar[iy]', flags: 'i' }), null);
    assert.equal(Suggest.literalOf(exact('sat math')), 'sat math');
    assert.equal(Suggest.literalOf({ pattern: 'civil\\s+procedure', flags: 'iu' }), 'civil procedure');
});

test('only the search box suggestion request is recognised', () => {
    assert.equal(Suggest.isSuggestionUrl('https://www.youtube.com/complete/search?ds=yt&hl=en&client=youtube&q=sat'), true);
    assert.equal(Suggest.isSuggestionUrl('/complete/search?client=youtube&q='), true);
    assert.equal(Suggest.isSuggestionUrl('https://suggestqueries-clients6.youtube.com/complete/search?ds=yt&q=x'), true);
    assert.equal(Suggest.isSuggestionUrl('/youtubei/v1/search?prettyPrint=false'), false);
    assert.equal(Suggest.isSuggestionUrl('https://www.google.com/complete/search?client=gws-wiz&q=x'), false);
});

test('dropdown safety net: rows that fail the rule hide; pictures hide on Kids, allow, Study and rest', () => {
    const block = { listMode: 'blocklist', filterKeywords: [exact('jailer')] };
    assert.deepEqual(Dom.rowDecision('jailer 2', block, { filter: Suggest }), { hide: true, hidePicture: false });
    assert.deepEqual(Dom.rowDecision('cooking', block, { filter: Suggest }), { hide: false, hidePicture: false });
    const allow = { listMode: 'whitelist', whitelistKeywords: [exact('sat math')] };
    assert.deepEqual(Dom.rowDecision('cooking', allow, { filter: Suggest }), { hide: true, hidePicture: true });
    assert.deepEqual(Dom.rowDecision('sat math', allow, { filter: Suggest }), { hide: false, hidePicture: true });
    assert.deepEqual(Dom.rowDecision('cooking', block, { filter: Suggest, kidsHost: true }), { hide: false, hidePicture: true });
    assert.deepEqual(Dom.rowDecision('anything', null, { filter: Suggest }), { hide: true, hidePicture: true }, 'no settings yet: held back');
    assert.deepEqual(Dom.rowDecision('anything', { listMode: 'blocklist', study: { phase: 'rest' } }, { filter: Suggest }).hide, true);
    assert.deepEqual(Dom.rowDecision('anything', block, {}), { hide: false, hidePicture: false }, 'no filter module: untouched');
});

function seedRuntime({ response, hostname = 'www.youtube.com' } = {}) {
    const base = loadSeedRuntime();
    const document = base.context.document;
    Object.assign(document.location, { hostname, origin: `https://${hostname}`, pathname: '/' });
    Object.assign(document, { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        createElement: () => ({ style: {}, setAttribute() {}, removeAttribute() {}, remove() {} }), head: { appendChild() {} } });
    // Real timers: the settings wait polls every 50 ms for at most 1.5 s.
    const context = { ...base.context, document, location: document.location, Response, Request, Headers, URL, URLSearchParams,
        setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: id => clearTimeout(id) };
    context.window = {
        __filtertubeDebug: false,
        FilterTubeSearchSuggestions: Suggest,
        fetch: () => Promise.resolve(new Response(response, { status: 200, headers: { 'content-type': 'text/javascript' } })),
        XMLHttpRequest: base.context.XMLHttpRequest,
        postMessage() {}, addEventListener() {}, dispatchEvent() {}, setInterval: () => 1, clearInterval() {}
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/seed.js', 'utf8'), context, { filename: 'js/seed.js' });
    return context.window;
}

test('seed fetch layer rewrites the suggestion response under the settings', async () => {
    const win = seedRuntime({ response: jsonp(OWNER) });
    win.filterTube.updateSettings({ enabled: true, listMode: 'blocklist', filterKeywords: [exact('jailer')], filterChannels: [], whitelistKeywords: [], whitelistChannels: [] });
    const reply = await win.fetch('https://www.youtube.com/complete/search?ds=yt&client=youtube&q=');
    const body = await reply.text();
    assert.ok(body.startsWith(WRAP));
    assert.deepEqual(texts(body), ['sat math practice test', 'funny cat compilation', 'cement grade test', 'khan academy algebra']);
});

test('seed fetch layer fails closed when settings never arrive', async () => {
    const win = seedRuntime({ response: jsonp(SAMPLE) });
    const reply = await win.fetch('/complete/search?ds=yt&client=youtube&q=sat%20m');
    assert.deepEqual(texts(await reply.text()), []);
});

test('seed JSONP layer: google.ac.h is wrapped before the site defines it', async () => {
    const win = seedRuntime({ response: '' });
    win.filterTube.updateSettings({ enabled: true, listMode: 'whitelist', filterKeywords: [], filterChannels: [],
        whitelistKeywords: [exact('sat math')], whitelistChannels: [] });
    const seen = [];
    win.google = { ac: {} };
    win.google.ac.h = payload => seen.push(payload);
    win.google.ac.h(JSON.parse(JSON.stringify(SAMPLE)));
    assert.deepEqual(seen[0][1].map(entry => entry[0]), ['sat math']);
    // A whole new ac object is trapped too.
    win.google.ac = { h: payload => seen.push(payload) };
    win.google.ac.h(JSON.parse(JSON.stringify(SAMPLE)));
    assert.deepEqual(seen[1][1].map(entry => entry[0]), ['sat math']);
});

test('seed routes suggestions through all layers and starts the dropdown net in its own world', () => {
    const seed = fs.readFileSync(new URL('../../js/seed.js', import.meta.url), 'utf8');
    assert.match(seed, /suggestions\.isSuggestionUrl\(urlStr\)/);
    assert.match(seed, /function setupSuggestionCallbackTrap\(\)/);
    assert.match(seed, /const processSuggestionXhr = \(xhr\) =>/);
    assert.match(seed, /tag\.src = seedSrc\.replace\(.*'\/js\/shared\/search_suggestions_filter\.js'\)/);
    for (const name of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json']) {
        const manifest = JSON.parse(fs.readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8'));
        const main = manifest.content_scripts[0].js;
        assert.ok(main.indexOf('js/shared/search_suggestions_filter.js') > main.indexOf('js/shared/view_count.js'), name);
        assert.ok(main.indexOf('js/shared/search_suggestions_filter.js') < main.indexOf('js/seed.js'), name);
    }
    // Chrome injects a file once per frame across worlds: both files live in the main world only.
    for (const name of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json', 'manifest.firefox.json']) {
        const manifest = JSON.parse(fs.readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8'));
        const isolated = manifest.content_scripts.find(entry => entry.js.includes('js/content_bridge.js') && !entry.all_frames);
        assert.equal(isolated.js.includes('js/shared/search_suggestions_filter.js'), false, name);
        assert.equal(isolated.js.includes('js/content/search_suggestions_dom.js'), false, name);
        if (!name.includes('firefox')) {
            const main = manifest.content_scripts[0].js;
            assert.ok(main.indexOf('js/content/search_suggestions_dom.js') > main.indexOf('js/shared/search_suggestions_filter.js'), name);
            assert.ok(main.indexOf('js/content/search_suggestions_dom.js') < main.indexOf('js/seed.js'), name);
        }
        for (const file of ['js/shared/search_suggestions_filter.js', 'js/content/search_suggestions_dom.js']) {
            assert.ok(manifest.web_accessible_resources[0].resources.includes(file), `${name}: ${file}`);
        }
    }
    assert.match(seed, /dom\.watch\(\{ window, document, settings: \(\) => cachedSettings \}\)/);
    assert.match(seed, /'\/js\/content\/search_suggestions_dom\.js'/);
});
