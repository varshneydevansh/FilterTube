// Layered rules (3.6.2): "whitelist" without `layered` keeps today's dual-rule precedence (an allow
// match beats an equal or weaker block); "whitelist" with `layered: true` means the block list always
// subtracts. Checked in the JSON engine, the DOM current-video admission, the external guard and the
// background compiler, on Main and Kids.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const APEX = 'UCa6vGFO9ty8v5KZJXQxdhaw';
const OTHER = 'UC0000000000000000000001';

function videoRenderer(videoId, title, channelId, name = 'Apex Creator') {
    const run = { text: name, navigationEndpoint: { browseEndpoint: { browseId: channelId, canonicalBaseUrl: `/@${name.replace(/\s+/g, '')}` } } };
    return { videoRenderer: { videoId, title: { runs: [{ text: title }] }, ownerText: { runs: [run] }, shortBylineText: { runs: [run] }, longBylineText: { runs: [run] } } };
}

function settings(extra = {}) {
    return {
        enabled: true, listMode: 'whitelist', channelMap: {}, videoChannelMap: {},
        whitelistChannels: [{ id: APEX, name: 'Apex Creator', handle: null }],
        whitelistKeywords: [],
        filterChannels: [], filterKeywords: [{ pattern: '\\bdrama\\b', flags: 'i' }],
        blockedVideoIds: [], allowedVideoIds: [],
        ...extra
    };
}

function kept(result) {
    return JSON.parse(JSON.stringify(result.contents.map(item => item.videoRenderer.videoId)));
}

const feed = () => ({ contents: [
    videoRenderer('AAAAAAAAAAA', 'Ranked tips for season 22', APEX),
    videoRenderer('BBBBBBBBBBB', 'The drama nobody talks about', APEX),
    videoRenderer('CCCCCCCCCCC', 'Ranked tips from someone else', OTHER, 'Someone Else')
] });

test('whitelist without layered keeps the allow-beats-equal-or-weaker-block precedence', () => {
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData(feed(), settings(), 'layered-off');
    assert.deepEqual(kept(result), ['AAAAAAAAAAA', 'BBBBBBBBBBB'], 'an allowed channel beats a keyword block');
});

test('layered whitelist: a drama video from an allowed Apex channel is hidden', () => {
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData(feed(), settings({ listLayered: true }), 'layered-on');
    assert.deepEqual(kept(result), ['AAAAAAAAAAA']);
});

test('layered whitelist: a blocked channel beats an exactly allowed video id', () => {
    const { engine } = loadFilterTubeEngine();
    const data = { contents: [videoRenderer('AAAAAAAAAAA', 'Ranked tips', APEX)] };
    const off = engine.processData(structuredClone(data), settings({ filterChannels: [{ id: APEX }], allowedVideoIds: ['AAAAAAAAAAA'] }), 'x');
    assert.equal(off.contents.length, 1, 'today an exact allowed id wins');
    const on = engine.processData(structuredClone(data), settings({ listLayered: true, filterChannels: [{ id: APEX }], allowedVideoIds: ['AAAAAAAAAAA'] }), 'y');
    assert.equal(on.contents.length, 0, 'layered: the block list always subtracts');
});

test('blocklist mode ignores listLayered and still blocks only matches', () => {
    const { engine } = loadFilterTubeEngine();
    const result = engine.processData(feed(), settings({ listMode: 'blocklist', listLayered: true, whitelistChannels: [] }), 'b');
    assert.deepEqual(kept(result), ['AAAAAAAAAAA', 'CCCCCCCCCCC']);
});

function sliceBetween(source, start, end) {
    const from = source.indexOf(start);
    assert.notEqual(from, -1, start);
    const to = source.indexOf(end, from + start.length);
    assert.notEqual(to, -1, end);
    return source.slice(from, to);
}

function loadDomAdmission() {
    const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
    const block = sliceBetween(source, 'function getCurrentWatchAdmissionDecision(settings, context = {}) {',
        'function formatCurrentWatchAdmissionMessage(decision, ownerMeta = {}) {');
    const context = {
        getCompiledKeywordRegexes: list => list.map(entry => new RegExp(entry.pattern, entry.flags || 'i')),
        keywordDateFilterAllows: () => true,
        matchesKeyword: (regex, value) => { regex.lastIndex = 0; return regex.test(String(value || '')); },
        getCompiledChannelFilterIndex: (_settings, list) => ({ list }),
        channelMetaMatchesIndex: (meta, index) => index.list.some(entry => entry.id === meta.id)
    };
    vm.createContext(context);
    vm.runInContext(`${block}\nthis.decide = getCurrentWatchAdmissionDecision;`, context);
    return context.decide;
}

test('DOM current-video admission: layered blocks a drama video from an allowed channel (Main and Kids settings)', () => {
    const decide = loadDomAdmission();
    const watch = { videoId: 'BBBBBBBBBBB', ownerMeta: { id: APEX, name: 'Apex Creator' }, searchText: 'The drama nobody talks about',
        textFields: [{ label: 'title', text: 'The drama nobody talks about' }] };
    for (const profileType of ['main', 'kids']) {
        assert.equal(decide(settings({ profileType }), watch).blocked, false, `${profileType}: plain whitelist keeps today's precedence`);
        const layered = decide(settings({ profileType, listLayered: true }), watch);
        assert.equal(layered.blocked, true, `${profileType}: layered subtracts`);
        assert.equal(layered.kind, 'keyword');
        assert.equal(decide(settings({ profileType, listLayered: true }), { ...watch, searchText: 'Ranked tips', textFields: [] }).blocked, false);
    }
});

test('external guard: layered lets a block match subtract from an allowed channel', () => {
    const source = fs.readFileSync('js/content/external_youtube_guard.js', 'utf8');
    const context = {
        URL, URLSearchParams, Promise, Date, Map, Set, WeakSet, RegExp, setTimeout, clearTimeout,
        document: { addEventListener() {}, querySelectorAll() { return []; }, getElementById() { return null; },
            body: { appendChild() {} }, documentElement: { appendChild() {} }, createElement: () => ({ dataset: {}, style: {}, setAttribute() {}, remove() {} }) },
        location: { href: 'https://www.google.com/search?q=apex' },
        addEventListener() {},
        chrome: { runtime: { sendMessage(_m, cb) { cb?.({}); }, onMessage: { addListener() {} } }, storage: { onChanged: { addListener() {} } } },
        FilterTubeIdentity: { isChannelBlocked: (entries, meta) => entries.some(entry => entry.id === meta.channelId || entry.id === meta.id) }
    };
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(source, context);
    const guard = context.FilterTubeExternalYouTubeGuard;
    const metadata = { videoId: 'BBBBBBBBBBB', title: 'The drama nobody talks about', shortDescription: '', keywords: [], lengthSeconds: '600',
        channelId: APEX, channelName: 'Apex Creator', channelHandle: '', identityVerified: true, textVerified: true };
    const base = settings();
    assert.equal(guard.evaluateAdmission(base, metadata, 'BBBBBBBBBBB').state, 'allowed');
    assert.equal(guard.evaluateAdmission({ ...base, listLayered: true }, metadata, 'BBBBBBBBBBB').state, 'blocked');
    const id = 'AAAAAAAAAAA';
    const ids = { ...base, filterKeywords: [], whitelistChannels: [], blockedVideoIds: [id], allowedVideoIds: [id] };
    assert.equal(guard.evaluateAdmission({ ...ids, listLayered: true }, null, id).state, 'blocked', 'an exact block subtracts an exact allow');
});

test('background compiles listLayered from the active surface (Main and Kids)', () => {
    const source = fs.readFileSync('js/background.js', 'utf8');
    assert.match(source, /compiledSettings\.listLayered = compiledSettings\.listMode === 'whitelist' && activeRuleSurface\.layered === true;/);
    const surface = sliceBetween(source, 'const activeRuleSurface = shouldUseKidsProfile ? activeKids : activeMain;', 'compiledSettings.blockedVideoIds');
    assert.match(surface, /listLayered/);
});
