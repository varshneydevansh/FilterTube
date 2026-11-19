import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const require = createRequire(import.meta.url);
const Feed = require('../../js/shared/allowlist_feed.js');
const Guard = require('../../js/shared/feed_guard.js');

const exact = word => ({ pattern: `(^|[^\\p{L}\\p{N}_])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}_])`, flags: 'iu' });
const card = id => ({ richItemRenderer: { content: { lockupViewModel: { contentId: id } } } });
const continuation = () => ({ continuationItemRenderer: { trigger: 'CONTINUATION_TRIGGER_ON_ITEM_SHOWN', continuationEndpoint: { continuationCommand: { token: 'next' } } } });
const browseContinuation = ids => ({ onResponseReceivedActions: [{ appendContinuationItemsAction: { continuationItems: [...ids.map(card), continuation()] } }] });

// The owner's case (UBE + SAT): allow list of pack channels and topics, nothing on Home matches.
const STUDY_SETTINGS = {
    enabled: true,
    listMode: 'whitelist',
    listLayered: true,
    filterKeywords: [],
    filterChannels: [],
    whitelistChannels: [
        { id: 'UCwSrz4e55Y6fnHiPUmXXIzg', handle: '@collegeboard', name: 'College Board' },
        { id: 'UC4a-Gbdw7vOaccHmFo40b9g', handle: '@khanacademy', name: 'Khan Academy' },
        { id: 'UC_1cWNNmLeGcTfpWY_9643A', handle: '@themisbarreview', name: 'Themis Bar Review' },
        { name: 'Name only' }
    ],
    whitelistKeywords: [{ ...exact('bar exam'), titleOnly: true }, { ...exact('sat math'), titleOnly: true }, { pattern: 'tor(t|ts)', flags: 'i' }],
    study: { phase: 'study', state: 'study', packIds: ['us_bar', 'us_sat'] }
};

test('countFeedItems counts outermost cards and continuations', () => {
    const data = browseContinuation(['a', 'b', 'c']);
    assert.deepEqual(Guard.countFeedItems(data), { cards: 3, continuations: 1 });
    const initial = { contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: { content: { richGridRenderer: { contents: [card('x'), { richSectionRenderer: { content: { richShelfRenderer: { contents: [card('y')] } } } }, continuation()] } } } }] } } };
    assert.deepEqual(Guard.countFeedItems(initial), { cards: 2, continuations: 1 });
});

test('stripContinuations removes only continuation entries', () => {
    const data = browseContinuation(['a']);
    assert.equal(Guard.stripContinuations(data), 1);
    assert.deepEqual(Guard.countFeedItems(data), { cards: 1, continuations: 0 });
});

test('continuation guard: three fully hidden loads in a row on one route exhaust it (Android MAX_EMPTY_AUTO_LOADS)', () => {
    assert.equal(Guard.MAX_EMPTY_AUTO_LOADS, 3);
    const guard = Guard.createContinuationGuard();
    assert.deepEqual(guard.observe({ routeKey: '/', before: 28, after: 0 }), { empty: true, streak: 1, exhausted: false });
    assert.deepEqual(guard.observe({ routeKey: '/', before: 32, after: 0 }), { empty: true, streak: 2, exhausted: false });
    assert.deepEqual(guard.observe({ routeKey: '/', before: 32, after: 0 }), { empty: true, streak: 3, exhausted: true });
    // A payload with nothing to hide doesn't move the count; one with a kept card resets it.
    const second = Guard.createContinuationGuard();
    second.observe({ routeKey: '/', before: 10, after: 0 });
    assert.equal(second.observe({ routeKey: '/', before: 0, after: 0 }).streak, 1);
    assert.equal(second.observe({ routeKey: '/', before: 10, after: 2 }).streak, 0);
    // A new route starts again.
    second.observe({ routeKey: '/', before: 10, after: 0 });
    second.observe({ routeKey: '/', before: 10, after: 0 });
    assert.equal(second.observe({ routeKey: '/results?search_query=x', before: 10, after: 0 }).streak, 1);
});

test('isGuardedPayload: feeds and search, never watch, player or a replay', () => {
    assert.equal(Guard.isGuardedPayload('fetch:/youtubei/v1/browse'), true);
    assert.equal(Guard.isGuardedPayload('xhr:/youtubei/v1/search'), true);
    assert.equal(Guard.isGuardedPayload('ytInitialData'), true);
    assert.equal(Guard.isGuardedPayload('fetch:/youtubei/v1/next'), false);
    assert.equal(Guard.isGuardedPayload('ytInitialPlayerResponse'), false);
    assert.equal(Guard.isGuardedPayload('ytInitialData-reprocess'), false);
    assert.equal(Guard.isGuardedPayload('fetch:/youtubei/v1/browse-replay'), false);
});

test('feedSources: allowed channels with ids and plain allowed words; nothing in block-list mode', () => {
    const sources = Feed.feedSources(STUDY_SETTINGS);
    assert.equal(sources.allow, true);
    assert.equal(sources.study, true);
    assert.deepEqual(sources.channels.map(ch => ch.id), ['UCwSrz4e55Y6fnHiPUmXXIzg', 'UC4a-Gbdw7vOaccHmFo40b9g', 'UC_1cWNNmLeGcTfpWY_9643A']);
    assert.deepEqual(sources.topics, ['bar exam', 'sat math'], 'a real regular expression is not a topic');
    const block = Feed.feedSources({ ...STUDY_SETTINGS, listMode: 'blocklist', study: null });
    assert.deepEqual([block.allow, block.channels.length, block.topics.length, block.study], [false, 0, 0, false]);
});

test('keywordText reads the plain word back from compiled patterns', () => {
    assert.equal(Feed.keywordText(exact('c++ basics')), 'c++ basics');
    assert.equal(Feed.keywordText({ pattern: 'algebra', flags: 'i' }), 'algebra');
    assert.equal(Feed.keywordText({ pattern: '\\bmath\\b', flags: 'i' }), 'math');
    assert.equal(Feed.keywordText({ pattern: 'a.*b', flags: 'i' }), '');
});

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>Khan Academy</title>
 <author><name>Khan Academy</name></author>
 <entry>
  <id>yt:video:AAAAAAAAAAA</id><yt:videoId>AAAAAAAAAAA</yt:videoId><yt:channelId>UC4a-Gbdw7vOaccHmFo40b9g</yt:channelId>
  <title>SAT Math: linear equations &amp; graphs</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=AAAAAAAAAAA"/>
  <author><name>Khan Academy</name></author>
  <published>2026-11-10T10:00:00+00:00</published>
  <media:group><media:community><media:statistics views="1234"/></media:community></media:group>
 </entry>
 <entry>
  <id>yt:video:BBBBBBBBBBB</id><yt:videoId>BBBBBBBBBBB</yt:videoId><yt:channelId>UC4a-Gbdw7vOaccHmFo40b9g</yt:channelId>
  <title>A short</title>
  <link rel="alternate" href="https://www.youtube.com/shorts/BBBBBBBBBBB"/>
  <published>2026-11-11T10:00:00+00:00</published>
 </entry>
 <entry>
  <id>yt:video:CCCCCCCCCCC</id><yt:videoId>CCCCCCCCCCC</yt:videoId><yt:channelId>UC4a-Gbdw7vOaccHmFo40b9g</yt:channelId>
  <title>Photosynthesis</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=CCCCCCCCCCC"/>
  <published>2026-11-12T10:00:00+00:00</published>
 </entry>
</feed>`;

test('parseUploadsFeed reads videos, decodes text and leaves Shorts out', () => {
    const items = Feed.parseUploadsFeed(RSS);
    assert.deepEqual(items.map(item => item.videoId), ['AAAAAAAAAAA', 'CCCCCCCCCCC']);
    assert.equal(items[0].title, 'SAT Math: linear equations & graphs');
    assert.equal(items[0].channelName, 'Khan Academy');
    assert.equal(items[0].views, 1234);
    assert.equal(items[0].publishedAt, Date.parse('2026-11-10T10:00:00+00:00'));
});

test('parseSearchResults reads videoRenderer results with their channel', () => {
    const json = { contents: { twoColumnSearchResultsRenderer: { primaryContents: { sectionListRenderer: { contents: [{ itemSectionRenderer: { contents: [
        { videoRenderer: { videoId: 'DDDDDDDDDDD', title: { runs: [{ text: 'Bar exam essay tips' }] }, ownerText: { runs: [{ text: 'JD Advising', navigationEndpoint: { browseEndpoint: { browseId: 'UCrklp2vfcxhVVTsqUmErglw', canonicalBaseUrl: '/@JDAdvising' } } }] }, publishedTimeText: { simpleText: '2 days ago' } } },
        { shelfRenderer: {} }
    ] } }] } } } } };
    const items = Feed.parseSearchResults(json);
    assert.equal(items.length, 1);
    assert.deepEqual([items[0].videoId, items[0].channelId, items[0].channelHandle, items[0].channelName, items[0].publishedText],
        ['DDDDDDDDDDD', 'UCrklp2vfcxhVVTsqUmErglw', '@JDAdvising', 'JD Advising', '2 days ago']);
});

test('rank puts titles naming a topic first, newest first in each (StudyHomeFeed.rank)', () => {
    const items = [
        { videoId: '1', title: 'Old SAT math drill', publishedAt: 1 },
        { videoId: '2', title: 'Campus tour', publishedAt: 5 },
        { videoId: '3', title: 'New SAT  Math review', publishedAt: 4 },
        { videoId: '4', title: 'Mathematics', publishedAt: 9 }
    ];
    assert.deepEqual(Feed.rank(items, ['sat math']).map(item => item.videoId), ['3', '1', '4', '2']);
});

test('spaced keeps one channel from filling the screen and drops nothing (StudyFeedMix.spaced)', () => {
    const items = ['a', 'a', 'a', 'a', 'b', 'c'].map((ch, index) => ({ videoId: String(index), channelId: ch }));
    const out = Feed.spaced(items, 3);
    assert.equal(out.length, items.length);
    // As the app: the busiest channel leads, another fills each next slot while one is left.
    assert.deepEqual(out.map(item => item.channelId).join(''), 'abacaa');
    assert.deepEqual(out.filter(item => item.channelId === 'a').map(item => item.videoId), ['0', '1', '2', '3'], 'a channel keeps its own order');
});

test('dailyOrder is stable within a day and rotates across days', () => {
    const list = ['a', 'b', 'c', 'd', 'e'];
    const day = 86400000;
    assert.deepEqual(Feed.dailyOrder(list, 'k', 10 * day + 5), Feed.dailyOrder(list, 'k', 10 * day + 80000));
    assert.notDeepEqual(Feed.dailyOrder(list, 'k', 10 * day), Feed.dailyOrder(list, 'k', 11 * day));
    assert.deepEqual([...Feed.dailyOrder(list, 'k', 3 * day)].sort(), list);
});

test('limiter: at most 3 at once', async () => {
    const limiter = Feed.createLimiter({ maxConcurrent: 3, minGapMs: 0, wait: () => Promise.resolve() });
    let live = 0;
    let peak = 0;
    const job = () => limiter.run(async () => { live += 1; peak = Math.max(peak, live); await new Promise(r => setTimeout(r, 5)); live -= 1; return 1; });
    await Promise.all(Array.from({ length: 10 }, job));
    assert.equal(peak, 3);
});

function memoryStorage() {
    const data = {};
    return { data, get: async key => ({ [key]: data[key] }), set: async items => { Object.assign(data, items); } };
}

test('feed builder: channel uploads, searched words when channels give little, cache for 60 minutes', async () => {
    let clock = Date.parse('2026-11-17T12:00:00Z');
    const fetched = [];
    const searched = [];
    const storage = memoryStorage();
    const builder = Feed.createFeedBuilder({
        now: () => clock,
        storage,
        limiter: Feed.createLimiter({ minGapMs: 0, now: () => clock, wait: () => Promise.resolve() }),
        fetchText: async url => { fetched.push(url); if (url.includes('UC_1cWNNmLeGcTfpWY_9643A')) throw new Error('HTTP 500'); return RSS; },
        searchJson: async query => { searched.push(query); return { contents: [{ videoRenderer: { videoId: 'EEEEEEEEEEE', title: { runs: [{ text: `${query} lesson` }] }, ownerText: { runs: [{ text: 'Somebody', navigationEndpoint: { browseEndpoint: { browseId: 'UCxxxxxxxxxxxxxxxxxxxxxx' } } }] } } }] }; }
    });
    const sources = Feed.feedSources(STUDY_SETTINGS);
    const first = await builder.build(sources);
    assert.equal(fetched.length, 3);
    assert.ok(fetched.every(url => url.startsWith('/feeds/videos.xml?channel_id=')));
    assert.deepEqual(searched.sort(), ['bar exam', 'sat math'], 'few channel items: the allowed words are searched too');
    assert.equal(first.failed, 1);
    assert.equal(first.unreachable, false);
    assert.equal(first.items[0].title.toLowerCase().includes('sat math') || first.items[0].title.toLowerCase().includes('bar exam'), true, 'topic matches lead');
    assert.equal(new Set(first.items.map(item => item.videoId)).size, first.items.length, 'no duplicates');
    // Within the hour: only the failed channel is asked again.
    clock += 30 * 60 * 1000;
    fetched.length = 0;
    await builder.build(sources);
    assert.deepEqual(fetched, ['/feeds/videos.xml?channel_id=UC_1cWNNmLeGcTfpWY_9643A']);
    // After the hour: everything is fresh again.
    clock += 31 * 60 * 1000;
    fetched.length = 0;
    await builder.build(sources);
    assert.equal(fetched.length, 3);
    assert.ok(storage.data[Feed.CACHE_KEY], 'the cache is kept in local storage');
});

test('feed builder: every request failing and nothing to show is "unreachable"', async () => {
    const builder = Feed.createFeedBuilder({
        storage: memoryStorage(),
        limiter: Feed.createLimiter({ minGapMs: 0, wait: () => Promise.resolve() }),
        fetchText: async () => { throw new Error('offline'); },
        searchJson: async () => { throw new Error('offline'); }
    });
    const result = await builder.build(Feed.feedSources(STUDY_SETTINGS));
    assert.equal(result.items.length, 0);
    assert.equal(result.unreachable, true);
});

test('classifyRuleChange: tighten, loosen and same', () => {
    const block = { enabled: true, listMode: 'blocklist', filterKeywords: [exact('a')], filterChannels: [], hideAllShorts: false };
    assert.equal(Guard.classifyRuleChange(block, { ...block }), 'same');
    assert.equal(Guard.classifyRuleChange(block, { ...block, filterKeywords: [exact('a'), exact('b')] }), 'tighten');
    assert.equal(Guard.classifyRuleChange(block, { ...block, filterKeywords: [] }), 'loosen');
    assert.equal(Guard.classifyRuleChange(block, { ...block, hideAllShorts: true }), 'tighten');
    assert.equal(Guard.classifyRuleChange({ ...block, hideAllShorts: true }, block), 'loosen');
    assert.equal(Guard.classifyRuleChange(block, { ...block, enabled: false }), 'loosen');
    assert.equal(Guard.classifyRuleChange(STUDY_SETTINGS, { ...block, study: { phase: 'normal' } }), 'loosen', 'study ended');
    assert.equal(Guard.classifyRuleChange(block, { ...STUDY_SETTINGS, filterKeywords: block.filterKeywords, hideAllShorts: false }), 'tighten', 'study started (the block list stays, layered)');
    const allowMore = { ...STUDY_SETTINGS, whitelistChannels: [...STUDY_SETTINGS.whitelistChannels, { id: 'UCzzzzzzzzzzzzzzzzzzzzzz' }] };
    assert.equal(Guard.classifyRuleChange(STUDY_SETTINGS, allowMore), 'loosen', 'one more allowed channel');
    assert.equal(Guard.classifyRuleChange(allowMore, STUDY_SETTINGS), 'tighten');
});

function seedRuntime({ responses, pathname = '/' } = {}) {
    const base = loadSeedRuntime();
    const attributes = new Map();
    const reloads = [];
    const location = { hostname: 'www.youtube.com', origin: 'https://www.youtube.com', pathname, search: '', reload: () => reloads.push(Date.now()) };
    const document = {
        ...base.context.document,
        location,
        documentElement: {
            toggleAttribute() {},
            getAttribute: name => (attributes.has(name) ? attributes.get(name) : null),
            setAttribute: (name, value) => attributes.set(name, String(value)),
            removeAttribute: name => attributes.delete(name),
            hasAttribute: name => attributes.has(name)
        },
        getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
        createElement: () => ({ style: {}, setAttribute() {}, removeAttribute() {}, remove() {} }), head: { appendChild() {} }
    };
    const queue = [...responses];
    const timers = [];
    const context = { ...base.context, document, location, Response, Request, Headers, URL, URLSearchParams,
        setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout() {} };
    context.window = {
        __filtertubeDebug: false,
        FilterTubeFeedGuard: Guard,
        FilterTubeEngine: {
            // The owner's console: every card on Home is hidden by the allow list.
            processData(data) {
                const copy = JSON.parse(JSON.stringify(data));
                const drop = node => {
                    if (Array.isArray(node)) {
                        for (let i = node.length - 1; i >= 0; i -= 1) {
                            if (node[i] && node[i].richItemRenderer) node.splice(i, 1); else drop(node[i]);
                        }
                    } else if (node && typeof node === 'object') Object.values(node).forEach(drop);
                };
                drop(copy);
                return copy;
            },
            harvestOnly() {}
        },
        fetch: () => Promise.resolve(new Response(JSON.stringify(queue.shift()), { status: 200, headers: { 'content-type': 'application/json' } })),
        XMLHttpRequest: base.context.XMLHttpRequest,
        postMessage() {}, addEventListener() {}, dispatchEvent() {}, setInterval: () => 1, clearInterval() {},
        setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout() {}
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/seed.js', 'utf8'), context, { filename: 'js/seed.js' });
    return { win: context.window, attributes, reloads, timers };
}

async function browse(win) {
    const reply = await win.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false', { method: 'POST' });
    return reply.json();
}

test('seed: allow-list Home that keeps coming back fully hidden stops asking after 3 loads', async () => {
    const runtime = seedRuntime({ responses: [browseContinuation(['a', 'b']), browseContinuation(['c']), browseContinuation(['d']), browseContinuation(['e'])] });
    runtime.win.filterTube.updateSettings(STUDY_SETTINGS);
    const first = await browse(runtime.win);
    assert.equal(Guard.countFeedItems(first).continuations, 1, 'first hidden load keeps its continuation');
    assert.equal(runtime.attributes.get('data-filtertube-feed-empty'), '1:/');
    await browse(runtime.win);
    const third = await browse(runtime.win);
    assert.deepEqual(Guard.countFeedItems(third), { cards: 0, continuations: 0 }, 'third hidden load loses its continuation');
    assert.equal(runtime.attributes.get('data-filtertube-feed-exhausted'), 'allow:/');
    assert.equal(runtime.attributes.get('data-filtertube-json-hidden'), '4');
});

test('seed: block-list feeds hidden at the data level are guarded the same way', async () => {
    const runtime = seedRuntime({ pathname: '/results', responses: [browseContinuation(['a']), browseContinuation(['b']), browseContinuation(['c'])] });
    runtime.win.filterTube.updateSettings({ enabled: true, listMode: 'blocklist', filterKeywords: [exact('everything')], filterChannels: [], whitelistKeywords: [], whitelistChannels: [] });
    await browse(runtime.win); await browse(runtime.win);
    const third = await browse(runtime.win);
    assert.equal(Guard.countFeedItems(third).continuations, 0);
    assert.equal(runtime.attributes.get('data-filtertube-feed-exhausted'), 'block:/results');
});

test('seed: when a study session ends the page loads its data again on its own (no manual reload)', async () => {
    const runtime = seedRuntime({ responses: [browseContinuation(['a', 'b'])] });
    runtime.win.filterTube.updateSettings(STUDY_SETTINGS);
    await browse(runtime.win);
    assert.equal(runtime.reloads.length, 0);
    // Tighter rules never reload.
    runtime.win.filterTube.updateSettings({ ...STUDY_SETTINGS, filterKeywords: [exact('extra')] });
    runtime.timers.splice(0).forEach(fn => fn());
    assert.equal(runtime.reloads.length, 0);
    // The session ends: the normal block list comes back, so Home's hidden cards must come back too.
    runtime.win.filterTube.updateSettings({ enabled: true, listMode: 'blocklist', filterKeywords: [], filterChannels: [], whitelistKeywords: [], whitelistChannels: [], study: { phase: 'normal' } });
    assert.ok(runtime.attributes.has('data-filtertube-rules-loosened'));
    runtime.timers.splice(0).forEach(fn => fn());
    assert.equal(runtime.reloads.length, 1);
});

test('seed: looser rules on a watch page never reload the player', async () => {
    const runtime = seedRuntime({ pathname: '/watch', responses: [browseContinuation(['a'])] });
    runtime.win.filterTube.updateSettings(STUDY_SETTINGS);
    await browse(runtime.win);
    runtime.win.filterTube.updateSettings({ enabled: true, listMode: 'blocklist', filterKeywords: [], filterChannels: [], whitelistKeywords: [], whitelistChannels: [] });
    runtime.timers.splice(0).forEach(fn => fn());
    assert.equal(runtime.reloads.length, 0);
});

test('the guard loads before seed in the main world and the builder in the isolated world, never both in one', () => {
    // Chrome injects a file once per frame, whichever entry lists it first: a file in both worlds is missing from one.
    for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json']) {
        const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        const main = manifest.content_scripts.find(entry => entry.js.includes('js/seed.js'));
        assert.ok(main.js.indexOf('js/shared/feed_guard.js') > -1 && main.js.indexOf('js/shared/feed_guard.js') < main.js.indexOf('js/seed.js'), file);
        assert.ok(!main.js.includes('js/shared/allowlist_feed.js'), file);
        const isolated = manifest.content_scripts.find(entry => entry.js.includes('js/content/dom_fallback.js'));
        assert.ok(isolated.js.indexOf('js/content/allowlist_feed_view.js') > isolated.js.indexOf('js/content/dom_fallback.js'), file);
        assert.ok(isolated.js.indexOf('js/shared/allowlist_feed.js') < isolated.js.indexOf('js/content/allowlist_feed_view.js'), file);
        assert.ok(!isolated.js.includes('js/shared/feed_guard.js'), file);
    }
    const firefox = JSON.parse(fs.readFileSync('manifest.firefox.json', 'utf8'));
    const isolated = firefox.content_scripts.find(entry => entry.js.includes('js/content/dom_fallback.js'));
    assert.ok(isolated.js.includes('js/content/allowlist_feed_view.js'));
    assert.match(fs.readFileSync('js/seed.js', 'utf8'), /\/js\/shared\/feed_guard\.js/, 'Firefox: seed loads the guard itself');
});

test('the in-page feed and calm state never name the video site', () => {
    const source = fs.readFileSync('js/content/allowlist_feed_view.js', 'utf8');
    const strings = [...source.matchAll(/t\('feed\.[^']+',\s*'([^']+)'/g)].map(match => match[1]);
    assert.ok(strings.length >= 15);
    for (const value of strings) assert.doesNotMatch(value, /youtube/i);
});

// The owner's SAT + GMAT feed (2026-11-19): greetings, a stream placeholder, campus tours and GRE drills
// from plan channels that also teach other exams.
const SAT_GMAT_TOPICS = ['sat', 'digital sat', 'psat', 'sat math', 'practice test', 'reading comprehension', 'gmat', 'gmat focus', 'critical reasoning', 'mba admissions'];

test('study rank: plan topics first, neutral next, likely non-lessons last; greetings and other exams left out', () => {
    const at = n => ({ publishedAt: n });
    const items = [
        { videoId: 'gre', title: 'Test Prep Expert Tackles FREE GRE Practice Test', ...at(9) },
        { videoId: 'june', title: 'The History of Juneteenth', ...at(8) },
        { videoId: 'teach', title: 'Happy Teacher Appreciation Week!', ...at(7) },
        { videoId: 'live', title: 'Our live stream will begin shortly', ...at(6) },
        { videoId: 'tour', title: 'Inside Look at Bard College | The Princeton Review', ...at(5) },
        { videoId: 'web', title: 'Fostering a Sense of Community - Webinar', ...at(4) },
        { videoId: 'cr', title: 'GMAT Critical Reasoning: Assumption questions', ...at(3) },
        { videoId: 'both', title: 'Mastering the GMAT and GRE', ...at(2) },
        { videoId: 'tips', title: 'Last Call Before the Test Date', ...at(1) },
        { videoId: 'fair', title: 'MBA Spotlight Fair: Meet Admissions Teams', ...at(10) },
        { videoId: 'mba', title: 'MBA admissions essays that work', ...at(0) }
    ];
    assert.deepEqual(Feed.rank(items, SAT_GMAT_TOPICS).map(item => item.videoId), ['cr', 'both', 'mba', 'tips', 'fair', 'tour', 'web']);
    assert.equal(Feed.lessonTier('Happy Diwali from our team', Feed.topicPatterns(SAT_GMAT_TOPICS), Feed.planExams(SAT_GMAT_TOPICS)).drop, true);
    assert.deepEqual([...Feed.planExams(SAT_GMAT_TOPICS)].sort(), ['gmat', 'psat', 'sat']);
    assert.equal(Feed.lessonTier('How to act on the ACT', [], Feed.planExams(SAT_GMAT_TOPICS)).drop, true, 'ACT in capitals is an exam');
    assert.equal(Feed.lessonTier('How to act fast', [], Feed.planExams(SAT_GMAT_TOPICS)).drop, false, '"act" is a word');
});

test('study rank never empties the feed, and allowed-only mode keeps everything the person chose', () => {
    const only = [{ videoId: 'a', title: 'Happy Holidays!', publishedAt: 2 }, { videoId: 'b', title: 'GRE Verbal', publishedAt: 1 }];
    assert.deepEqual(Feed.rank(only, SAT_GMAT_TOPICS).map(item => item.videoId), ['b', 'a'], 'all left out would be nothing: all stay, still ranked');
    const own = [{ videoId: 'x', title: 'Happy Holidays!', publishedAt: 3 }, { videoId: 'y', title: 'calculus limits', publishedAt: 1 }, { videoId: 'z', title: 'AP Statistics', publishedAt: 2 }];
    assert.deepEqual(Feed.rank(own, ['calculus'], { lessons: false }).map(item => item.videoId), ['y', 'x', 'z']);
});

test('the study Home label and subject chips come from the plan (StudyHomeFeed.chips, StudyPackLabels.short)', () => {
    const sat = { id: 'us_sat', shortName: 'SAT', names: { en: 'SAT' }, chips: ['Math', 'Reading and writing', 'Practice test'], keywords: ['sat'] };
    const gmat = { id: 'global_gmat', shortName: null, names: { en: 'GMAT (Focus Edition)' }, chips: [],
        keywords: ['gmat', 'gmat focus', 'data insights', 'critical reasoning', 'reading comprehension', 'practice test', 'mock test', 'gmat official guide'] };
    const upsc = { id: 'in_upsc', names: { en: 'UPSC Civil Services Examination' } };
    assert.equal(Feed.shortExamName(gmat), 'GMAT');
    assert.equal(Feed.shortExamName(upsc), 'UPSC');
    assert.equal(Feed.studyLabel([sat]), 'SAT');
    assert.equal(Feed.studyLabel([sat, gmat]), 'SAT + GMAT');
    assert.equal(Feed.studyLabel([sat, gmat, upsc]), 'SAT + 2');
    assert.equal(Feed.studyLabel([]), '');
    const chips = Feed.homeChips([sat, gmat]);
    assert.deepEqual(chips.map(chip => chip.label), ['Math', 'Reading and writing', 'Practice test', 'Data insights', 'Critical reasoning', 'Reading comprehension'],
        'GMAT has no chips: its keywords without its own name, meta words or a repeat');
    assert.deepEqual(chips.map(chip => chip.query).slice(0, 4), ['math sat', 'reading and writing sat', 'practice test sat', 'data insights gmat']);
    assert.equal(Feed.chipQuery('SAT math', 'SAT'), 'sat math', 'no second exam word');
    assert.ok(Feed.homeChips(Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, chips: Array.from({ length: 6 }, (_, j) => `c${i}${j}`) }))).length <= 14);
});
