// Study pack topics and pack blocked words match the video title only (Android
// StudyEffectiveRules.matchesTitleOnly, audit M1): a channel name or description that contains a pack
// word neither allows nor hides a video, so feed cards and the Watch gate decide on the same text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const PACK = 'UCa6vGFO9ty8v5KZJXQxdhaw';
const OTHER = 'UC0000000000000000000001';

function card(videoId, title, channelId, name, description = '') {
    const run = { text: name, navigationEndpoint: { browseEndpoint: { browseId: channelId, canonicalBaseUrl: `/@${name.replace(/\s+/g, '')}` } } };
    return { videoRenderer: { videoId, title: { runs: [{ text: title }] }, ownerText: { runs: [run] }, shortBylineText: { runs: [run] },
        longBylineText: { runs: [run] }, descriptionSnippet: { runs: [{ text: description }] } } };
}

const study = (extra = {}) => ({
    enabled: true, listMode: 'whitelist', listLayered: true, channelMap: {}, videoChannelMap: {},
    whitelistChannels: [{ id: PACK, name: 'Pack Teacher', handle: null }],
    whitelistKeywords: [{ pattern: '\\bpolity\\b', flags: 'i', titleOnly: true }],
    filterChannels: [], filterKeywords: [{ pattern: '\\breaction\\b', flags: 'i', titleOnly: true }],
    blockedVideoIds: [], allowedVideoIds: [], ...extra
});

const ids = result => JSON.parse(JSON.stringify(result.contents.map(item => item.videoRenderer.videoId)));

test('a pack topic allows by title, not by channel name or description', () => {
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData({ contents: [
        card('AAAAAAAAAAA', 'Indian polity in one shot', OTHER, 'Someone'),
        card('BBBBBBBBBBB', 'Minecraft speedrun', OTHER, 'Polity Gaming'),
        card('CCCCCCCCCCC', 'Minecraft speedrun two', OTHER, 'Someone', 'polity notes in the description')
    ] }, study(), 'title-only-allow');
    assert.deepEqual(ids(result), ['AAAAAAAAAAA']);
});

test('a pack blocked word hides by title, not by channel name or description', () => {
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData({ contents: [
        card('AAAAAAAAAAA', 'Result reaction live', PACK, 'Pack Teacher'),
        card('BBBBBBBBBBB', 'Lecture 4', PACK, 'Reaction Academy'),
        card('CCCCCCCCCCC', 'Lecture 5', PACK, 'Pack Teacher', 'my reaction to the paper')
    ] }, study({ whitelistChannels: [{ id: PACK, name: 'Pack Teacher', handle: null }] }), 'title-only-block');
    assert.deepEqual(ids(result), ['BBBBBBBBBBB', 'CCCCCCCCCCC']);
});

test('ordinary keywords still match the description and channel text', () => {
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData({ contents: [
        card('AAAAAAAAAAA', 'Lecture 6', PACK, 'Pack Teacher', 'my reaction to the paper')
    ] }, study({ filterKeywords: [{ pattern: '\\breaction\\b', flags: 'i' }] }), 'plain-block');
    assert.deepEqual(ids(result), []);
});

test('Watch gate: a title-only pack word decides on the title field, not the description', async () => {
    const fs = await import('node:fs');
    const vm = await import('node:vm');
    const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
    const from = source.indexOf('function getCurrentWatchAdmissionDecision(settings, context = {}) {');
    const to = source.indexOf('function formatCurrentWatchAdmissionMessage(decision, ownerMeta = {}) {', from);
    const context = {
        getCompiledKeywordRegexes: list => list.map(entry => Object.assign(new RegExp(entry.pattern, entry.flags || 'i'),
            entry.titleOnly ? { __filtertubeTitleOnly: true } : {})),
        keywordDateFilterAllows: () => true,
        matchesKeyword: (regex, value) => { regex.lastIndex = 0; return regex.test(String(value || '')); },
        getCompiledChannelFilterIndex: (_settings, list) => ({ list }),
        channelMetaMatchesIndex: (meta, index) => index.list.some(entry => entry.id === meta.id)
    };
    vm.createContext(context);
    vm.runInContext(`${source.slice(from, to)}\nthis.decide = getCurrentWatchAdmissionDecision;`, context);
    const watch = (title, description) => ({ videoId: 'AAAAAAAAAAA', ownerMeta: { id: OTHER, name: 'Someone' },
        searchText: `${title} ${description}`, textFields: [{ label: 'title', text: title }, { label: 'player description', text: description }] });
    const settings = study({ whitelistChannels: [] });
    assert.equal(context.decide(settings, watch('Indian polity lecture', '')).blocked, false);
    assert.equal(context.decide(settings, watch('Minecraft', 'polity')).blocked, true, 'the description does not allow');
    const fromPack = { ...watch('Lecture 4', 'my reaction'), ownerMeta: { id: PACK, name: 'Pack Teacher' } };
    assert.equal(context.decide(study(), fromPack).blocked, false, 'the description does not block');
});
