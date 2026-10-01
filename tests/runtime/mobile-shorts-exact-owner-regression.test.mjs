import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const dom = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
const injector = fs.readFileSync('js/injector.js', 'utf8');
const seed = fs.readFileSync('js/seed.js', 'utf8');
const slice = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const videoId = 'Ptng0VmOt-c';

test('wrapped reel Player metadata reaches exact-video verified owner cache', () => {
    const runtime = loadFilterTubeEngine();
    const channelId = 'UC1234567890123456789012';
    const input = { playerResponse: {
        videoDetails: { videoId, channelId, title: 'Ordinary short', author: 'Duck Shorts', lengthSeconds: '30' },
        microformat: { playerMicroformatRenderer: { ownerProfileUrl: 'https://www.youtube.com/@duckshort2' } }
    } };
    runtime.engine.processData(input, { enabled: true, listMode: 'blocklist', filterChannels: [],
        filterKeywords: [], whitelistKeywords: [], whitelistChannels: [], blockedVideoIds: [],
        allowedVideoIds: [], channelMap: {} }, 'reel/reel_item_watch');
    runtime.flushTimers();
    const meta = runtime.messages.filter(message => message.type === 'FilterTube_UpdateVideoMetaMap')
        .flatMap(message => message.payload).find(meta => meta.videoId === videoId);
    assert.ok(meta);
    assert.equal(meta.channelId, channelId);
    assert.equal(meta.channelHandle, '@duckshort2');
    assert.equal(meta.identityVerified, true);
    assert.equal(meta.title, 'Ordinary short');
});

test('nested mobile reel channel identity blocks only the actual owner', () => {
    const channelId = 'UC1234567890123456789012';
    const card = (id, handle) => ({ reelItemRenderer: { videoId,
        headline: { runs: [{ text: 'A video mentioning Duck Shorts' }] },
        navigationEndpoint: { reelWatchEndpoint: { overlay: { reelPlayerOverlayRenderer: {
            reelPlayerHeaderSupportedRenderers: { reelPlayerHeaderRenderer: {
                channelTitleText: { runs: [{ text: 'Creator' }] },
                channelNavigationEndpoint: { browseEndpoint: { browseId: id, canonicalBaseUrl: `/@${handle}` } }
            } }
        } } } }
    } });
    const settings = (rule, enabled = true) => ({ enabled, listMode: 'blocklist',
        filterChannels: [rule], filterKeywords: [], whitelistKeywords: [], whitelistChannels: [],
        blockedVideoIds: [], allowedVideoIds: [], channelMap: {} });
    for (const rule of [{ id: channelId }, { handle: '@duckshort2' }]) {
        const { engine } = loadFilterTubeEngine({ pathname: '/shorts/' + videoId });
        const blocked = engine.processData({ contents: [card(channelId, 'duckshort2')] }, settings(rule), 'mobile-reel');
        assert.equal(blocked.contents.length, 0, `actual owner must match ${JSON.stringify(rule)}`);
        const allowed = engine.processData({ contents: [card('UC9999999999999999999999', 'othercreator')] }, settings(rule), 'unrelated-reel');
        assert.equal(allowed.contents.length, 1, 'title mentions must not become channel matches');
        const disabled = engine.processData({ contents: [card(channelId, 'duckshort2')] }, settings(rule, false), 'disabled-reel');
        assert.equal(disabled.contents.length, 1);
    }
});

test('mobile reel Player responses enter the existing metadata pipeline without changing the response', async () => {
    const payload = { playerResponse: { videoDetails: { videoId, author: 'Duck Shorts' } } };
    const original = new Response(JSON.stringify(payload), { status: 200 });
    const received = [];
    const context = vm.createContext({ window: { fetch: async () => original }, Request, Response, URL,
        document: { location: { origin: 'https://m.youtube.com' } }, cachedSettings: { enabled: true },
        shouldBypassYouTubeiNetworkResponse: () => false,
        processWithEngine(data, name) { received.push({ data, name }); return data; },
        hasNetworkJsonWork: () => false, seedDebugLog() {} });
    vm.runInContext(slice(seed, '    function setupFetchInterception() {', '    function setupXhrInterception() {'), context);
    context.setupFetchInterception();
    const response = await context.window.fetch('https://m.youtube.com/youtubei/v1/reel/reel_item_watch?prettyPrint=false');
    assert.equal(response, original);
    assert.equal(received.length, 1);
    assert.equal(received[0].data.playerResponse.videoDetails.videoId, videoId);
    assert.equal(received[0].name, 'fetch:/youtubei/v1/reel/reel_item_watch');
    assert.match(slice(seed, '    function setupXhrInterception() {', '    // ============================================================================'), /reel\/reel_item_watch/);
    assert.match(seed, /name\.includes\('\/youtubei\/v1\/player'\) \|\| name\.includes\('\/youtubei\/v1\/reel\/reel_item_watch'\)/);
});

test('mobile Shorts route and exact player owner use the same admission identity as Watch', () => {
    const context = vm.createContext({
        document: { location: { hostname: 'm.youtube.com', pathname: `/shorts/${videoId}`, search: '' } },
        URLSearchParams,
        normalizeHandleForComparison: value => String(value || '').toLowerCase(),
        extractVideoLanguageFromPlayerResponse: () => ({})
    });
    vm.runInContext(slice(dom, 'function getCurrentWatchVideoId() {', 'function getCurrentWatchOwnerMeta(')
        + slice(dom, 'function getCurrentWatchExactOwnerMeta(', 'function getCurrentShortPlayerHost(')
        + slice(injector, '    function extractVideoMetaFromPlayerResponse(', '    function loadedVideoMetaSatisfies('), context);
    assert.equal(context.getCurrentWatchVideoId(), videoId);
    const metadata = context.extractVideoMetaFromPlayerResponse({ videoDetails: {
        videoId, channelId: `UC${'a'.repeat(22)}`, author: 'Duck Shorts', title: 'A Short'
    }, microformat: { playerMicroformatRenderer: { ownerProfileUrl: 'https://www.youtube.com/@duckshort2' } } }, videoId);
    const owner = context.getCurrentWatchExactOwnerMeta({ videoMetaMap: { [videoId]: metadata } });
    assert.equal(owner.handle, '@duckshort2');
    assert.equal(owner.id, `UC${'a'.repeat(22)}`);
    assert.equal(owner.videoId, videoId);
    assert.equal(context.extractVideoMetaFromPlayerResponse({ videoDetails: { videoId: '0CCwuWQiLTA', author: 'Other' } }, videoId), null);
    assert.equal(context.getCurrentWatchExactOwnerMeta({ videoMetaMap: { [videoId]: { channelName: 'Duck Shorts' } } }), null);
});

test('mobile Shorts overlay targets the active mobile player rather than the entire document', () => {
    const host = {};
    let selector = '';
    const context = vm.createContext({ document: { querySelector(value) { selector = value; return host; } } });
    vm.runInContext(slice(dom, 'function getCurrentShortPlayerHost(', 'function setLocalizedAdmissionOverlayMessage('), context);
    assert.equal(context.getCurrentShortPlayerHost(), host);
    assert.match(selector, /ytm-reel-video-renderer\[is-active\]/);
    assert.doesNotMatch(selector, /body|html/);
});
