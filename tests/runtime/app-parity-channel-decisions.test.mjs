// Cross-platform fixtures: the extension decides a card whose channel isn't known yet, a
// collaboration still loading, a channel name and a "Filter all" word the way the Android app does.
// The cases come from the app's own tests and code (tests/runtime/fixtures/app-parity/channel-decisions.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const fixture = JSON.parse(fs.readFileSync('tests/runtime/fixtures/app-parity/channel-decisions.json', 'utf8'));
const ID = fixture.ids;
const resolveId = value => (ID[value] || value);

function loadIdentity() {
    const context = { window: { FilterTubeIdentity: {} }, URL, JSON, decodeURIComponent, console };
    context.self = context.window;
    context.globalThis = context.window;
    vm.runInNewContext(fs.readFileSync('js/shared/identity.js', 'utf8'), context, { filename: 'js/shared/identity.js' });
    return context.window.FilterTubeIdentity;
}
const Identity = loadIdentity();
const meta = raw => Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, key === 'id' ? resolveId(value) : value]));

test('a card whose channel is unknown decides like NativeOwnedFilterDecider', () => {
    for (const row of fixture.pending) {
        assert.equal(Identity.decidePendingChannelIdentity(row.input), row.expect, row.app);
    }
});

test('channel identity strength follows resolvedChannelIdentityStrength', () => {
    for (const row of fixture.strength) {
        const channelMap = Object.fromEntries(Object.entries(row.channelMap || {}).map(([key, value]) => [key, resolveId(value)]));
        const index = Identity.buildChannelFilterIndex(row.rules.map(meta), channelMap);
        const strength = Identity.channelIdentityStrength(row.roster.map(meta), {
            indexes: [index], channelMap, expectedCollaboratorCount: row.expected
        });
        assert.equal(strength, row.expect, row.app);
    }
});

test('channel names match as one key set, like matchesAnyChannel', () => {
    for (const row of fixture.names) {
        const index = Identity.buildChannelFilterIndex([meta(row.rule)], {});
        assert.equal(Identity.channelMetaMatchesIndex(meta(row.card), index, {}), row.expect, row.app);
    }
});

test('"A and N more" counts the collaborators the card will have', () => {
    for (const row of fixture.collapsedCount) {
        assert.equal(Identity.collapsedCollaboratorExpectedCount(row.label), row.expect, row.label);
    }
});

test('"Filter all" derives the same word and key as FilterPayloadCompiler', () => {
    for (const row of fixture.filterAll) {
        assert.equal(Identity.channelFilterAllWord(row.channel), row.word, row.app);
        assert.equal(Identity.channelFilterAllKey(row.channel), row.key, row.app);
    }
});

test('the options page derives the same "Filter all" words (settings_shared.js)', () => {
    const source = fs.readFileSync('js/settings_shared.js', 'utf8');
    const block = source.slice(source.indexOf('    function channelText(channel, key) {'), source.indexOf('    function syncFilterAllKeywords('));
    const context = {};
    vm.createContext(context);
    vm.runInContext(`${block}\nthis.word = getChannelKeywordWord; this.key = getChannelDerivedKey;`, context);
    for (const row of fixture.filterAll) {
        assert.equal(context.word(row.channel), row.word, row.app);
        assert.equal(context.key(row.channel), row.key, row.app);
    }
});

// ---- The data-level filter, end to end ---------------------------------------------------------

function videoRenderer(videoId, title, channel = null, byline = null) {
    const run = channel
        ? [{ text: channel.name, navigationEndpoint: { browseEndpoint: { browseId: channel.id, canonicalBaseUrl: channel.handle ? `/${channel.handle}` : undefined } } }]
        : [];
    return { videoRenderer: {
        videoId,
        title: { runs: [{ text: title }] },
        ...(channel ? { ownerText: { runs: run }, shortBylineText: { runs: byline ? [...run, { text: byline }] : run } } : {}),
        lengthText: { simpleText: '10:00' },
        viewCountText: { simpleText: '12,000 views' }
    } };
}

function kept(engine, rules, items) {
    const result = engine.processData({ contents: items }, rules, 'browse');
    return JSON.parse(JSON.stringify(result.contents.map(item => item.videoRenderer?.videoId || item.reelItemRenderer?.videoId)));
}

const base = (extra = {}) => ({
    enabled: true, listMode: 'blocklist', channelMap: {}, videoChannelMap: {},
    whitelistChannels: [], whitelistKeywords: [], filterChannels: [], filterKeywords: [],
    blockedVideoIds: [], allowedVideoIds: [], ...extra
});
const keyword = word => ({ pattern: word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags: 'i' });

test('allow mode: an allowed word shows a video whose channel is unknown (explicitAllowedKeywordCanDecideBeforeWeakChannelIdentityResolves)', () => {
    const { engine } = loadFilterTubeEngine({ identity: Identity });
    const rules = base({ listMode: 'whitelist', whitelistChannels: [{ id: ID.apex, name: 'Allowed Channel' }], whitelistKeywords: [keyword('allowed lesson')] });
    assert.deepEqual(kept(engine, rules, [videoRenderer('weakwhite01', 'Allowed lesson')]), ['weakwhite01']);
});

test('layered rules: an allowed word waits while a blocked channel could still match', () => {
    const { engine } = loadFilterTubeEngine({ identity: Identity });
    const rules = base({
        listMode: 'whitelist', listLayered: true,
        whitelistChannels: [{ id: ID.apex, name: 'Apex' }], whitelistKeywords: [keyword('apex legends')],
        filterChannels: [{ id: ID.blocked, name: 'Blocked Channel' }]
    });
    assert.deepEqual(kept(engine, rules, [
        videoRenderer('weaklayer01', 'apex legends clip'),
        videoRenderer('knownlayer1', 'apex legends clip', { id: ID.other, name: 'Other Creator' })
    ]), ['knownlayer1'], 'the unknown-channel card waits; once the channel is known the word decides');
    const fresh = loadFilterTubeEngine({ identity: Identity }).engine;
    assert.deepEqual(kept(fresh, { ...rules, filterChannels: [] }, [videoRenderer('weaklayer02', 'apex legends clip')]), ['weaklayer02'],
        'with no blocked channel the allowed word shows it');
});

test('a collaboration still loading waits for the full list (nativeDeciderKeepsSuspectedCollaboratorRosterPendingWithStableUploaderIdentity)', () => {
    const { engine } = loadFilterTubeEngine({ identity: Identity });
    const rules = base({ filterChannels: [{ id: ID.blocked, name: 'Blocked Channel' }] });
    assert.deepEqual(kept(engine, rules, [
        videoRenderer('collabpend1', 'Shared episode', { id: ID.uploader, name: 'Uploader' }, ' and 2 more'),
        videoRenderer('solo0000001', 'Solo episode', { id: ID.uploader, name: 'Uploader' })
    ]), ['solo0000001']);
    assert.deepEqual(kept(engine, base(), [
        videoRenderer('collabpend2', 'Shared episode', { id: ID.uploader, name: 'Uploader' }, ' and 2 more')
    ]), ['collabpend2'], 'with no channel rules nothing about the channel can change the decision');
});

test('a channel rule hides a card from another channel with the same name, as the app does', () => {
    const { engine } = loadFilterTubeEngine({ identity: Identity });
    const rules = base({ filterChannels: [{ id: ID.apex, name: 'Apex Coach' }] });
    assert.deepEqual(kept(engine, rules, [
        videoRenderer('samename001', 'Clip', { id: ID.other, name: 'Apex Coach' }),
        videoRenderer('othername01', 'Clip', { id: ID.other, name: 'Other Creator' })
    ]), ['othername01']);
});

test('allow mode: a Short whose channel is unknown never shows on a topic match, a video does (ShortsAllowRule)', () => {
    const { engine } = loadFilterTubeEngine({ identity: Identity });
    const rules = base({ listMode: 'whitelist', whitelistKeywords: [keyword('apex legends')] });
    const short = { reelItemRenderer: { videoId: 'shortunk001', headline: { simpleText: 'apex legends clip' },
        navigationEndpoint: { reelWatchEndpoint: { videoId: 'shortunk001' } } } };
    assert.deepEqual(kept(engine, rules, [short, videoRenderer('videounk001', 'apex legends clip')]), ['videounk001']);
});

test('a Kids-site direct watch link is checked during a Kids learning round (and only then)', () => {
    const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
    assert.match(source, /includes\('youtubekids\.com'\) && !isKidsLearningRound\(settings\)\) return;/);
    const block = source.slice(source.indexOf('function isKidsLearningRound('), source.indexOf('function getDirectAccessRuleRequirements('));
    const context = {};
    vm.createContext(context);
    vm.runInContext(`${block}\nthis.round = isKidsLearningRound;`, context);
    assert.equal(context.round({ study: { applied: true, kidsSpace: 'learning' } }), true);
    assert.equal(context.round({ study: { applied: true, kidsSpace: 'study_time' } }), false, 'Kids holds at rest with its own card');
    assert.equal(context.round({ study: { applied: false, kidsSpace: 'learning' } }), false);
    assert.equal(context.round({}), false);
});
