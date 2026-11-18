import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const Search = require('../../js/shared/channel_search.js');
const Shelf = require('../../js/content/channel_search_shelf.js');
const Engine = require('../../js/shared/study_engine.js');

const catalog = JSON.parse(fs.readFileSync(new URL('../../data/study/packs-v1.json', import.meta.url), 'utf8'));
const madeEasy = 'UCSrLdrCGaVWDSUyrTgqgmOw';
const aceId = 'UCukI6GR31qv8UkgBsZDrRSw';
const exact = word => ({ pattern: `(^|[^\\p{L}\\p{N}_])${word}(?=$|[^\\p{L}\\p{N}_])`, flags: 'iu' });

/** The compiled settings of Android StudySearchTest's student: GATE Civil + JEE in a round. */
function studentSettings() {
    const study = { activePackIds: ['in_gate', 'in_jee'], packEdits: { in_gate: { variant: 'civil' } } };
    const effective = Engine.studyEffectiveProfile({ main: { mode: 'blocklist' }, kids: {}, settings: {} }, { catalog, clock: { state: Engine.STUDY }, study });
    return { enabled: true, listMode: 'whitelist', listLayered: true, study: { phase: 'study' }, channelSearchGroups: Engine.channelSearchGroups(effective.profile.main) };
}

function packHas(packId, channelId) {
    const pack = catalog.packs.find(item => item.id === packId);
    const all = [...(pack.channels || []), ...(pack.variants || []).flatMap(variant => variant.channels || [])];
    return all.some(channel => channel && channel.channelId === channelId);
}

test('cement routes to GATE Civil channels first, capped (StudySearchTest)', () => {
    const scope = Search.scope(studentSettings());
    assert.equal(scope.kind, 'study');
    assert.deepEqual(scope.groups.map(group => group.packId), ['in_gate', 'in_jee']);
    assert.ok(Search.relevance('cement', scope.groups[0].terms) > 0, 'cement is a GATE Civil term');
    assert.equal(Search.relevance('cement', scope.groups[1].terms), 0, 'and not a JEE one');
    const first = Search.plan('cement', scope.groups, Search.MAX_FIRST);
    assert.equal(first.length, Search.MAX_FIRST);
    assert.ok(first.every(id => packHas('in_gate', id)), 'every first channel is a GATE channel');
    assert.ok(first.includes(madeEasy));
    // A JEE subject routes to JEE first.
    assert.ok(Search.plan('projectile motion', scope.groups, 3).every(id => packHas('in_jee', id)));
    // "Search all" reaches every channel once.
    const all = Search.plan('cement', scope.groups, Search.MAX_ALL);
    assert.equal(all.length, new Set(all.map(id => id.toLowerCase())).size);
    assert.ok(all.length > first.length);
    assert.equal(Search.channelCount(scope), all.length);
});

test('allowed-only mode asks the allowed channels; paused rows sit out; block list, empty lists, Kids and study do not', () => {
    const settings = { listMode: 'whitelist', whitelistChannels: [{ name: 'MADE EASY', id: madeEasy }, { name: 'ACE', id: aceId },
        { name: 'Paused', id: 'UCpausedpausedpausedpaus', managedListPaused: true }, { name: 'Handle only', id: '@someone', handle: '@someone' }],
        whitelistKeywords: [exact('cement')] };
    const scope = Search.scope(settings);
    assert.equal(scope.kind, 'allowed');
    assert.deepEqual(scope.groups[0].channels, [madeEasy, aceId]);
    assert.deepEqual(scope.groups[0].terms, ['cement']);
    assert.equal(Search.scope({ listMode: 'blocklist', whitelistChannels: settings.whitelistChannels }), null);
    assert.equal(Search.scope({ listMode: 'whitelist', whitelistChannels: [] }), null);
    assert.equal(Search.scope({ ...settings, profileType: 'kids' }), null);
    assert.equal(Search.scope({ ...settings, enabled: false }), null);
    assert.equal(Search.scope({ ...settings, study: { phase: 'rest' } }), null, 'a rest break asks nobody');
    // In a study round the plan decides, not the allowed list.
    assert.equal(Search.scope({ ...settings, study: { phase: 'study' }, channelSearchGroups: [] }), null);
    assert.equal(Search.scope({ ...studentSettings(), whitelistChannels: settings.whitelistChannels }).kind, 'study');
});

test('merge: the channels\' answers first, one from each in turn, then the site, no video twice', () => {
    assert.deepEqual(Search.merge([[1, 2], [3, 4, 1]], [4, 5], item => String(item)).slice(0, 4), [1, 3, 2, 4]);
    assert.deepEqual(Search.merge([[1, 2], [3, 4, 1]], [4, 5], item => String(item)), [1, 3, 2, 4, 5]);
    const many = Array.from({ length: 10 }, (_, index) => index);
    assert.equal(Search.merge([many], [], item => String(item)).length, Search.PER_CHANNEL);
});

test('a channel search answer becomes videos; playlists and shelves are left out', () => {
    const video = (id, title) => ({ videoRenderer: { videoId: id, title: { runs: [{ text: title }] },
        longBylineText: { runs: [{ text: 'ACE Engineering Academy', navigationEndpoint: { browseEndpoint: { browseId: aceId, canonicalBaseUrl: '/@aceengacademy' } } }] },
        publishedTimeText: { simpleText: '2 years ago' }, lengthText: { simpleText: '41:07' }, viewCountText: { simpleText: '12,345 views' } } });
    const answer = { contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: {} }, { expandableTabRenderer: { selected: true, content: { sectionListRenderer: { contents: [
        { itemSectionRenderer: { contents: [video('ace00000001', 'Why is Concrete Tested for 28 Days'), { playlistRenderer: { playlistId: 'PL1' } }] } },
        { itemSectionRenderer: { contents: [video('ace00000002', 'Cement drama exposed'), video('ace00000001', 'dupe')] } }
    ] } } } }] } } };
    const items = Search.parseChannelSearch(answer);
    assert.deepEqual(items.map(item => item.videoId), ['ace00000001', 'ace00000002']);
    assert.deepEqual({ ...items[0], thumbnail: undefined }, { videoId: 'ace00000001', title: 'Why is Concrete Tested for 28 Days', channelId: aceId,
        channelHandle: '@aceengacademy', channelName: 'ACE Engineering Academy', published: '2 years ago', length: '41:07', views: '12,345 views', thumbnail: undefined, live: false });
    assert.equal(items[0].thumbnail, 'https://i.ytimg.com/vi/ace00000001/mqdefault.jpg');
    assert.deepEqual(Search.parseChannelSearch({}), []);
    const body = Search.channelSearchBody(aceId, ' cement ', '2.2026', { hl: 'hi', gl: 'IN' });
    assert.deepEqual(body, { context: { client: { clientName: 'WEB', clientVersion: '2.2026', hl: 'hi', gl: 'IN' } }, browseId: aceId,
        params: Search.CHANNEL_SEARCH_PARAMS, query: 'cement' });
});

test('the cache keeps a search 10 minutes, then asks again', () => {
    let clock = 0;
    const cache = Search.createCache({ now: () => clock, capacity: 2 });
    cache.set('a', 1);
    clock = Search.CACHE_TTL_MS;
    assert.equal(cache.get('a'), 1);
    clock += 1;
    assert.equal(cache.get('a'), null);
    cache.set('a', 1); cache.set('b', 2); cache.set('c', 3);
    assert.equal(cache.size(), 2);
    assert.equal(cache.get('a'), null, 'the oldest goes first');
    const scope = Search.scope(studentSettings());
    assert.notEqual(Search.searchKey(scope, 'Cement', false), Search.searchKey(scope, 'cement', true));
    assert.equal(Search.searchKey(scope, ' Cement ', false), Search.searchKey(scope, 'cement', false));
});

test('the shelf asks the planned channels through the paced fetcher, caches, and counts failures', async () => {
    const asked = [];
    const answer = id => ({ contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: { content: { sectionListRenderer: { contents: [
        { itemSectionRenderer: { contents: [{ videoRenderer: { videoId: `${id.slice(2, 13)}`, title: { runs: [{ text: `Cement lesson ${id}` }] },
            longBylineText: { runs: [{ text: id, navigationEndpoint: { browseEndpoint: { browseId: id } } }] } } }] } }] } } } }] } } });
    const fetcher = { get: async (url, init) => {
        const body = JSON.parse(init.body);
        asked.push(body.browseId);
        assert.equal(url, '/youtubei/v1/browse?prettyPrint=false');
        assert.equal(init.credentials, 'omit');
        if (body.browseId === madeEasy) return { ok: false, status: 503 };
        return { ok: true, json: async () => answer(body.browseId) };
    } };
    const doc = { querySelectorAll: () => [], documentElement: { lang: 'en' } };
    const shelf = Shelf.createShelf({ window: { location: { href: 'https://www.youtube.com/results?search_query=cement' } }, document: doc, rules: Search, fetcher });
    const scope = Search.scope(studentSettings());
    const outcome = await shelf.search(scope, 'cement', false);
    assert.equal(outcome.asked, Search.MAX_FIRST);
    assert.equal(outcome.failed, 1, 'MADE EASY was unreachable');
    assert.equal(asked.length, Search.MAX_FIRST);
    await shelf.search(scope, 'cement', false);
    assert.equal(asked.length, Search.MAX_FIRST, 'the same search within 10 minutes asks nobody');
    const merged = Search.merge(outcome.perChannel, [], item => item.videoId);
    assert.equal(merged.length, Search.MAX_FIRST - 1);
});

test('the shelf shows only what the page matcher admits (blocked words in a layered allow profile)', () => {
    const items = [{ videoId: 'a', title: 'Why is Concrete Tested for 28 Days', channelName: 'ACE', channelId: aceId },
        { videoId: 'b', title: 'Cement drama exposed', channelName: 'ACE', channelId: aceId }];
    const hides = (title, channel, settings, options) => {
        assert.equal(options.channelMeta.id, aceId);
        return settings.blocked.some(word => title.toLowerCase().includes(word));
    };
    assert.deepEqual(Shelf.admitted(items, { blocked: ['drama'] }, hides).map(item => item.videoId), ['a']);
    assert.deepEqual(Shelf.admitted(items, { blocked: [] }, null), [], 'no matcher, nothing shows');
    assert.equal(Shelf.queryOf({ href: 'https://www.youtube.com/results?search_query=cement+test' }), 'cement test');
    assert.equal(Shelf.queryOf({ href: 'https://www.youtube.com/watch?v=x' }), '');
});

test('the manifests load the shelf after its rules and the paced fetcher', () => {
    for (const name of ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json', 'manifest.firefox.json']) {
        const manifest = JSON.parse(fs.readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8'));
        const isolated = manifest.content_scripts.find(entry => entry.js.includes('js/content_bridge.js') && !entry.all_frames);
        const at = file => isolated.js.indexOf(file);
        assert.ok(at('js/shared/paced_fetch.js') >= 0 && at('js/shared/channel_search.js') > at('js/shared/paced_fetch.js'), name);
        assert.ok(at('js/content/channel_search_shelf.js') > at('js/shared/channel_search.js'), name);
        assert.ok(at('js/content/channel_search_shelf.js') > at('js/content/dom_fallback.js'), `${name}: shouldHideContent is defined first`);
    }
    const en = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/en.json', import.meta.url), 'utf8'));
    for (const key of ['studyTitle', 'allowedTitle', 'studyAll', 'allowedAll', 'studyOffline', 'allowedOffline']) {
        assert.ok(en[`search.channels.${key}`], key);
        assert.doesNotMatch(en[`search.channels.${key}`], /YouTube/);
    }
});
