import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const Suggest = require('../../js/shared/search_suggestions_filter.js');

// Compiled the way background.js compiles keywords: whole word ("exact") and substring.
const exact = word => ({ pattern: `(^|[^\\p{L}\\p{N}_])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}_])`, flags: 'iu' });
const sub = word => ({ pattern: word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags: 'i' });

const WRAP = 'window.google.ac.h(';
const jsonp = payload => `${WRAP}${JSON.stringify(payload)})`;
const texts = raw => Suggest.parse(raw).payload[1].map(entry => entry[0]);

const SAMPLE = ['sat m', [
    ['sat math', 0, [512]],
    ['sat mari sajna ne punjabi song', 0, [512]],
    ['sat maths full course', 0, [512]],
    ['sat movie trailer', 0, [512, 433]],
    ['khan academy', 0, [512, 433, 131], { zaf: '@khanacademy', zai: 'https://yt3.example/k.jpg', zao: 'Khan Academy', zav: 'UC4a-Gbdw7vOaccHmFo40b9g' }],
    ['prank show', 0, [512, 433, 131], { zaf: '@PrankKing', zai: 'https://yt3.example/p.jpg', zao: 'Prank King', zav: 'UCprankprankprank000000' }]
], { j: '5', k: 1 }];

const HISTORY = ['', [
    ['sat math practice test', 35, [512, 39], { zai: 'https://i.example/v1.jpg', zal: 'vid00000001' }],
    ['funny cat compilation', 35, [512, 39], { zai: 'https://i.example/v2.jpg', zal: 'vid00000002' }],
    ['prank compilation', 35, [512, 39]]
], { j: '0', k: 1 }];

test('parse keeps the JSONP wrapper exactly and reads the payload', () => {
    const raw = jsonp(SAMPLE);
    const parsed = Suggest.parse(raw);
    assert.equal(parsed.prefix, WRAP);
    assert.equal(parsed.suffix, ')');
    assert.equal(parsed.payload[0], 'sat m');
    assert.equal(Suggest.serialize(parsed), raw);
    const xssi = `)]}'\n${JSON.stringify(SAMPLE)}`;
    assert.equal(Suggest.parse(xssi).prefix, ")]}'\n");
    assert.equal(Suggest.parse(JSON.stringify(SAMPLE)).prefix, '');
});

test('malformed and foreign responses pass through untouched', () => {
    const settings = { listMode: 'blocklist', filterKeywords: [sub('prank')] };
    for (const raw of ['', 'not json', 'window.google.ac.h(', 'window.google.ac.h({"a":1})', '[1,2,3]', '<html></html>']) {
        assert.equal(Suggest.filterResponseText(raw, settings), raw);
    }
    assert.equal(Suggest.parse(null), null);
});

test('blocklist removes suggestions matching blocked words, wrapper preserved', () => {
    const settings = { listMode: 'blocklist', filterKeywords: [exact('punjabi'), sub('trailer')] };
    const raw = jsonp(SAMPLE);
    const out = Suggest.filterResponseText(raw, settings);
    assert.ok(out.startsWith(WRAP) && out.endsWith(')'));
    assert.deepEqual(texts(out), ['sat math', 'sat maths full course', 'khan academy', 'prank show']);
    assert.deepEqual(Suggest.parse(out).payload[2], { j: '5', k: 1 });
});

test('blocklist strips the picture of a blocked channel but keeps the words; unknown channels keep theirs', () => {
    const settings = { listMode: 'blocklist', filterKeywords: [], filterChannels: [{ id: 'UCprankprankprank000000', handle: '@prankking', name: 'Prank King' }] };
    const out = Suggest.parse(Suggest.filterResponseText(jsonp(SAMPLE), settings)).payload[1];
    const prank = out.find(entry => entry[0] === 'prank show');
    assert.equal(prank.length, 3, 'attachment removed');
    const khan = out.find(entry => entry[0] === 'khan academy');
    assert.equal(khan[3].zai, 'https://yt3.example/k.jpg');
    // A video whose channel is already known (videoChannelMap) is stripped too.
    const mapped = { ...settings, videoChannelMap: { vid00000002: 'UCprankprankprank000000' } };
    const history = Suggest.parse(Suggest.filterResponseText(jsonp(HISTORY), mapped)).payload[1];
    assert.equal(history.find(entry => entry[0] === 'funny cat compilation').length, 3);
    assert.equal(history.find(entry => entry[0] === 'sat math practice test')[3].zal, 'vid00000001');
});

test('blocklist with nothing to match leaves the text byte for byte', () => {
    const raw = jsonp(SAMPLE);
    assert.equal(Suggest.filterResponseText(raw, { listMode: 'blocklist', filterKeywords: [sub('zzz')] }), raw);
    assert.equal(Suggest.filterResponseText(raw, { listMode: 'blocklist' }), raw, 'no rules, no work');
    assert.equal(Suggest.filterResponseText(raw, { enabled: false, listMode: 'whitelist' }), raw, 'switched off');
});

test('allow list keeps only allowed words, topics and channels, plus prefixes of topics', () => {
    const settings = {
        listMode: 'whitelist',
        whitelistKeywords: [exact('sat math'), exact('algebra'), { ...exact('geometry'), titleOnly: true }],
        whitelistChannels: [{ id: 'UC4a-Gbdw7vOaccHmFo40b9g', handle: '@khanacademy', name: 'Khan Academy' }],
        filterKeywords: [sub('punjabi')]
    };
    const out = texts(Suggest.filterResponseText(jsonp(SAMPLE), settings));
    // "sat maths full course" doesn't name the whole word "sat math"; Khan Academy is an allowed channel.
    assert.deepEqual(out, ['sat math', 'khan academy']);
    // A typed prefix of a topic stays, and allowed topics starting with it are added.
    const typed = ['alg', [['alg', 0, [512]], ['algorithm', 0, [512]], ['algae bloom', 0, [512]]], { j: '1' }];
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(typed), settings)), ['alg', 'algebra']);
    const geo = ['g', [['gaming', 0, [512]]], {}];
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(geo), settings)), ['geometry']);
    const kh = ['kh', [], {}];
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(kh), settings)), ['khan academy']);
});

test('allow list: blocked words still go first (layered rules), and added topics never name one', () => {
    const settings = {
        listMode: 'whitelist',
        whitelistKeywords: [exact('sat math'), exact('sat math hacks')],
        filterKeywords: [sub('hacks')]
    };
    const payload = ['sat math', [['sat math', 0, [512]], ['sat math hacks', 0, [512]]], {}];
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(payload), settings)), ['sat math']);
});

test('Study (allow list with pack topics) filters the empty-q history to matching entries', () => {
    const settings = {
        listMode: 'whitelist',
        study: { phase: 'study', packIds: ['us_sat'] },
        whitelistKeywords: [{ ...exact('sat math'), titleOnly: true }, { ...exact('practice test'), titleOnly: true }],
        whitelistChannels: [{ id: 'UCwSrz4e55Y6fnHiPUmXXIzg', handle: '@collegeboard', name: 'College Board' }]
    };
    const out = Suggest.parse(Suggest.filterResponseText(jsonp(HISTORY), settings)).payload[1];
    assert.deepEqual(out.map(entry => entry[0]), ['sat math practice test']);
    assert.equal(out[0][3].zal, 'vid00000001', 'an allowed entry keeps its picture');
    // No additions on an empty query.
    assert.equal(out.length, 1);
});

test('Kids takes the stricter path: history keeps only allowed entries and pictures need an allowed channel', () => {
    const kidsBlock = { listMode: 'blocklist', profileType: 'kids', filterKeywords: [sub('prank')] };
    // Blocklist Kids, no allowed rules: the history is hidden completely.
    assert.deepEqual(texts(Suggest.filterResponseText(jsonp(HISTORY), kidsBlock)), []);
    // Typed suggestions: blocked words go, unknown channels lose their picture.
    const typed = Suggest.parse(Suggest.filterResponseText(jsonp(SAMPLE), kidsBlock)).payload[1];
    assert.deepEqual(typed.map(entry => entry[0]), ['sat math', 'sat mari sajna ne punjabi song', 'sat maths full course', 'sat movie trailer', 'khan academy']);
    assert.equal(typed.find(entry => entry[0] === 'khan academy').length, 3);
    const kidsAllow = { listMode: 'whitelist', filterKeywords: [], whitelistKeywords: [exact('sat math')],
        whitelistChannels: [{ id: 'UC4a-Gbdw7vOaccHmFo40b9g', handle: '@khanacademy', name: 'Khan Academy' }] };
    const allowed = Suggest.parse(Suggest.filterResponseText(jsonp(SAMPLE), kidsAllow, { kids: true })).payload[1];
    assert.deepEqual(allowed.map(entry => entry[0]), ['sat math', 'khan academy']);
    assert.equal(allowed[1][3].zav, 'UC4a-Gbdw7vOaccHmFo40b9g', 'an allowed channel keeps its picture on Kids');
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
    assert.equal(Suggest.isSuggestionUrl('/youtubei/v1/search?prettyPrint=false'), false);
    assert.equal(Suggest.isSuggestionUrl('https://www.google.com/complete/search?client=gws-wiz&q=x'), false);
});

test('seed.js routes suggestion fetches through the filter and the manifests load it before seed', () => {
    const seed = fs.readFileSync(new URL('../../js/seed.js', import.meta.url), 'utf8');
    assert.match(seed, /suggestions\.isSuggestionUrl\(urlStr\)/);
    assert.match(seed, /function filterSuggestionResponse\(response, suggestions\)/);
    for (const name of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json']) {
        const manifest = JSON.parse(fs.readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8'));
        assert.deepEqual(manifest.content_scripts[0].js, ['js/shared/view_count.js', 'js/shared/search_suggestions_filter.js', 'js/seed.js'], name);
    }
    // Firefox: seed arrives by script tag and brings the filter in from the same folder (a web resource).
    assert.match(seed, /tag\.src = seedSrc\.replace\(.*'\/js\/shared\/search_suggestions_filter\.js'\)/);
    const firefox = JSON.parse(fs.readFileSync(new URL('../../manifest.firefox.json', import.meta.url), 'utf8'));
    assert.ok(firefox.web_accessible_resources[0].resources.includes('js/shared/search_suggestions_filter.js'));
});
