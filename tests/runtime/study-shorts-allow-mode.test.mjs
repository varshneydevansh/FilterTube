// "Can you whitelist channels and only see Shorts by those channels?" In allow mode the Shorts shelf
// and the Shorts player show only Shorts from allowed channels: each Short's channel is learned from
// data the page already sends (reelItemRenderer, the reel Player response, the reel overlay's channel
// bar), and a Short whose channel is still unknown is never shown. Fixtures follow YouTube's shapes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const ALLOWED = 'UCa6vGFO9ty8v5KZJXQxdhaw';
const OTHER = 'UCX6OQ3DkcsbYNE6H8uQQuVA';
const S1 = 'Zr1n0xQf9kA';
const S2 = 'pQ4bW2nV8tE';
const S3 = 'k9LmT3cX0yU';

// The real shared identity module, as in the content scripts.
function loadIdentity() {
    const context = { window: { FilterTubeIdentity: {} }, URL, JSON, decodeURIComponent, console };
    context.self = context.window;
    context.globalThis = context.window;
    vm.runInNewContext(fs.readFileSync('js/shared/identity.js', 'utf8'), context, { filename: 'js/shared/identity.js' });
    return context.window.FilterTubeIdentity;
}
const engineWithIdentity = () => loadFilterTubeEngine({ identity: loadIdentity() });

const settings = (extra = {}) => ({
    enabled: true, listMode: 'whitelist', channelMap: {}, videoChannelMap: {},
    whitelistChannels: [{ id: ALLOWED, handle: '@apexcoach', name: 'Apex Coach' }], whitelistKeywords: [],
    filterChannels: [], filterKeywords: [], blockedVideoIds: [], allowedVideoIds: [], ...extra
});

// Home: a Shorts shelf. shortsLockupViewModel names no channel; its reelWatchEndpoint overlay has no header.
function homeShortsShelf(ids) {
    return { contents: { twoColumnBrowseResultsRenderer: { tabs: [{ tabRenderer: { content: { richGridRenderer: { contents: [
        { richSectionRenderer: { content: { richShelfRenderer: {
            title: { runs: [{ text: 'Shorts' }] },
            contents: ids.map(videoId => ({ richItemRenderer: { content: { shortsLockupViewModel: {
                entityId: `shorts-shelf-item-${videoId}`,
                accessibilityText: 'Season 22 ranked tips, 1.2 million views - play Short',
                thumbnail: { sources: [{ url: `https://i.ytimg.com/vi/${videoId}/frame0.jpg`, width: 1080, height: 1920 }] },
                onTap: { innertubeCommand: {
                    commandMetadata: { webCommandMetadata: { url: `/shorts/${videoId}`, webPageType: 'WEB_PAGE_TYPE_SHORTS', rootVe: 37414 } },
                    reelWatchEndpoint: { videoId, playerParams: '8AEBoAMEyAMkuAQF', overlay: { reelPlayerOverlayRenderer: {
                        style: 'REEL_PLAYER_OVERLAY_STYLE_SHORTS', trackingParams: 'CAsQ', reelPlayerNavigationModel: 'REEL_PLAYER_NAVIGATION_MODEL_UNSPECIFIED'
                    } }, params: 'CAYwAg%3D%3D', sequenceProvider: 'REEL_WATCH_SEQUENCE_PROVIDER_RPC', sequenceParams: 'CgtacjFuMHhRZjlrQSoCGAZQGWgA' }
                } },
                overlayMetadata: { primaryText: { content: 'Season 22 ranked tips' }, secondaryText: { content: '1.2M views' } },
                loggingDirectives: { trackingParams: 'CAwQ', visibility: { types: '12' } }
            } } } }))
        } } } }
    ] } } } }] } } };
}

// Mobile / older desktop shelves: reelItemRenderer carries the reel player header with the channel.
function reelItem(videoId, channelId, handle) {
    return { reelItemRenderer: {
        videoId,
        headline: { simpleText: 'Ranked tips' },
        thumbnail: { thumbnails: [{ url: `https://i.ytimg.com/vi/${videoId}/frame0.jpg`, width: 405, height: 720 }] },
        viewCountText: { simpleText: '1.2M views' },
        navigationEndpoint: { commandMetadata: { webCommandMetadata: { url: `/shorts/${videoId}`, webPageType: 'WEB_PAGE_TYPE_SHORTS' } },
            reelWatchEndpoint: { videoId, overlay: { reelPlayerOverlayRenderer: {
                reelPlayerHeaderSupportedRenderers: { reelPlayerHeaderRenderer: {
                    channelTitleText: { runs: [{ text: 'Creator', navigationEndpoint: { browseEndpoint: { browseId: channelId, canonicalBaseUrl: `/@${handle}` } } }] },
                    channelNavigationEndpoint: { browseEndpoint: { browseId: channelId, canonicalBaseUrl: `/@${handle}` } }
                } }
            } } } },
        style: 'REEL_ITEM_STYLE_AVATAR_CIRCLE'
    } };
}

// /youtubei/v1/reel/reel_watch_sequence: the next Shorts, each overlay with the modern channel bar.
function reelWatchSequence(entries) {
    return { entries: entries.map(([videoId, channelId, handle]) => ({ command: {
        clickTrackingParams: 'CAAQ',
        commandMetadata: { webCommandMetadata: { url: `/shorts/${videoId}`, webPageType: 'WEB_PAGE_TYPE_SHORTS' } },
        reelWatchEndpoint: { videoId, overlay: { reelPlayerOverlayRenderer: {
            pivotButton: { pivotButtonRenderer: { onClickCommand: { browseEndpoint: { browseId: 'FEsfv_audio_pivot', params: 'x' } } } },
            metapanel: { reelMetapanelViewModel: { metadataItems: [
                { reelChannelBarViewModel: {
                    channelName: { content: `@${handle}`, commandRuns: [{ startIndex: 0, length: handle.length + 1,
                        onTap: { innertubeCommand: { browseEndpoint: { browseId: channelId, canonicalBaseUrl: `/@${handle}` } } } }] },
                    channelAvatar: { avatarViewModel: { image: { sources: [] } } }
                } },
                { shortsVideoTitleViewModel: { text: { content: 'Ranked tips' } } }
            ] } }
        } } }
    } })) };
}

// /youtubei/v1/reel/reel_item_watch: the Short's Player response.
function reelItemWatch(videoId, channelId, author, handle) {
    return { playerResponse: { videoDetails: { videoId, channelId, author, title: 'Ranked tips', lengthSeconds: '31', isLiveContent: false },
        microformat: { playerMicroformatRenderer: { ownerProfileUrl: `http://www.youtube.com/@${handle}`, externalChannelId: channelId } } },
    replacementEndpoint: { reelWatchEndpoint: { videoId } } };
}

function shelfIds(result) {
    const shelf = result.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents[0];
    const items = shelf?.richSectionRenderer?.content?.richShelfRenderer?.contents || [];
    return JSON.parse(JSON.stringify(items.map(item => item.richItemRenderer.content.shortsLockupViewModel.onTap.innertubeCommand.reelWatchEndpoint.videoId)));
}

test('allow mode never shows a shelf Short whose channel is unknown', () => {
    const { engine } = engineWithIdentity();
    assert.deepEqual(shelfIds(engine.processData(homeShortsShelf([S1, S2]), settings(), 'browse')), []);
});

test('the reel Player response teaches the Short\'s channel: the allowed channel\'s Short shows on the shelf', () => {
    const { engine, messages, flushTimers } = engineWithIdentity();
    const rules = settings();
    engine.processData(reelItemWatch(S1, ALLOWED, 'Apex Coach', 'apexcoach'), rules, 'fetch:/youtubei/v1/reel/reel_item_watch');
    engine.processData(reelItemWatch(S2, OTHER, 'Other', 'othercreator'), rules, 'fetch:/youtubei/v1/reel/reel_item_watch');
    assert.deepEqual(shelfIds(engine.processData(homeShortsShelf([S1, S2, S3]), rules, 'browse')), [S1],
        'allowed shows; another channel and an unknown channel stay hidden');
    flushTimers();
    assert.ok(messages.some(message => JSON.stringify(message).includes(S1) && JSON.stringify(message).includes(ALLOWED)), 'the mapping is sent on for later pages');
});

test('reelItemRenderer headers teach the channel too, and the allowed reel item itself shows', () => {
    const { engine } = engineWithIdentity();
    const rules = settings();
    const items = engine.processData({ contents: [reelItem(S1, ALLOWED, 'apexcoach'), reelItem(S2, OTHER, 'other')] }, rules, 'mobile-shelf');
    assert.deepEqual(JSON.parse(JSON.stringify(items.contents.map(item => item.reelItemRenderer.videoId))), [S1]);
    assert.equal(rules.videoChannelMap[S1], ALLOWED);
    assert.equal(rules.videoChannelMap[S2], OTHER);
    assert.deepEqual(shelfIds(engine.processData(homeShortsShelf([S1, S2]), rules, 'browse')), [S1]);
});

test('the reel overlay\'s channel bar teaches the channel; a sound pivot is never taken for the owner', () => {
    const { engine } = engineWithIdentity();
    const rules = settings();
    engine.processData(reelWatchSequence([[S1, ALLOWED, 'apexcoach'], [S2, OTHER, 'other']]), rules, 'fetch:/youtubei/v1/reel/reel_watch_sequence');
    assert.equal(rules.videoChannelMap[S1], ALLOWED);
    assert.equal(rules.videoChannelMap[S2], OTHER);
    assert.equal(rules.channelMap[ALLOWED.toLowerCase()] || rules.channelMap[ALLOWED], '@apexcoach');
    assert.deepEqual(shelfIds(engine.processData(homeShortsShelf([S1, S2]), rules, 'browse')), [S1]);
    const pivotOnly = { entries: [{ command: { reelWatchEndpoint: { videoId: S3, overlay: { reelPlayerOverlayRenderer: {
        pivotButton: { pivotButtonRenderer: { onClickCommand: { browseEndpoint: { browseId: OTHER } } } } } } } } }] };
    engine.processData(pivotOnly, rules, 'pivot');
    assert.equal(rules.videoChannelMap[S3], undefined);
});

test('an allowed channel matched by handle only still shows its Shorts once the channel is learned', () => {
    const { engine } = engineWithIdentity();
    const rules = settings({ whitelistChannels: [{ id: '@apexcoach', handle: '@apexcoach', name: 'Apex Coach' }] });
    engine.processData(reelWatchSequence([[S1, ALLOWED, 'apexcoach']]), rules, 'sequence');
    assert.deepEqual(shelfIds(engine.processData(homeShortsShelf([S1]), rules, 'browse')), [S1]);
});

function sliceBetween(source, start, end) {
    const from = source.indexOf(start);
    assert.notEqual(from, -1, start);
    return source.slice(from, source.indexOf(end, from + start.length));
}

function loadShortOwner(reel) {
    const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
    const block = sliceBetween(source, 'function getCurrentShortOwnerMeta(', 'function getCurrentShortPlayerHost(');
    const sent = [];
    const context = {
        window: {},
        document: { querySelector: selector => (selector.includes('[is-active]') ? reel : null) },
        normalizeHandleForComparison: value => String(value || '').toLowerCase(),
        chrome: { runtime: { sendMessage: message => sent.push(message) } },
        decodeURIComponent
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(`${block}\nthis.owner = getCurrentShortOwnerMeta;`, context);
    return { owner: context.owner, sent, context };
}

function activeReel(href, name = 'Apex Coach') {
    const anchor = { getAttribute: key => (key === 'href' ? href : null), textContent: ` ${name} ` };
    return { querySelector: selector => (selector.includes('yt-reel-channel-bar-view-model a[href]') ? anchor : null) };
}

test('the Shorts player reads its own channel: learned map first, then the active overlay link', () => {
    const mapped = loadShortOwner(null);
    const fromMap = mapped.owner({ videoChannelMap: { [S1]: ALLOWED } }, S1, 1000);
    assert.equal(fromMap.id, ALLOWED);
    assert.equal(fromMap.mappedIdAuthoritative, true);

    const overlay = loadShortOwner(activeReel('/@ApexCoach'));
    const rules = { videoChannelMap: {} };
    assert.equal(overlay.owner(rules, S2, 1000), null, 'a just-changed route waits so a recycled overlay can\'t lend its channel');
    const owner = overlay.owner(rules, S2, 1500);
    assert.equal(owner.handle, '@apexcoach');
    assert.equal(owner.name, 'Apex Coach');
    assert.equal(owner.videoId, S2);

    const byId = loadShortOwner(activeReel(`/channel/${ALLOWED}`));
    const idRules = { videoChannelMap: {} };
    byId.owner(idRules, S3, 0);
    assert.equal(byId.owner(idRules, S3, 1000).id, ALLOWED);
    assert.equal(idRules.videoChannelMap[S3], ALLOWED, 'the overlay channel is learned');
    assert.deepEqual(JSON.parse(JSON.stringify(byId.sent)), [{ action: 'updateVideoChannelMap', videoId: S3, channelId: ALLOWED }]);

    const none = loadShortOwner(activeReel('/shorts/abc'));
    none.owner({}, S1, 0);
    assert.equal(none.owner({}, S1, 1000), null, 'no channel named: unknown, so the admission keeps the Short held');
});

test('the Shorts admission decides on the reel owner: allowed plays, another channel is blocked', () => {
    const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
    const block = sliceBetween(source, 'function getCurrentWatchAdmissionDecision(settings, context = {}) {', 'function formatCurrentWatchAdmissionMessage(');
    const context = {
        getCompiledKeywordRegexes: () => [], keywordDateFilterAllows: () => true, matchesKeyword: () => false,
        getCompiledChannelFilterIndex: (_s, list) => ({ list }),
        channelMetaMatchesIndex: (meta, index) => index.list.some(entry => (entry.id && entry.id === meta.id) || (entry.handle && entry.handle === meta.handle))
    };
    vm.createContext(context);
    vm.runInContext(`${block}\nthis.decide = getCurrentWatchAdmissionDecision;`, context);
    const rules = settings({ whitelistChannels: [{ id: ALLOWED, handle: '@apexcoach' }] });
    assert.equal(context.decide(rules, { videoId: S1, ownerMeta: { handle: '@apexcoach', videoId: S1 } }).blocked, false);
    assert.equal(context.decide(rules, { videoId: S2, ownerMeta: { id: OTHER, videoId: S2 } }).blocked, true);
    assert.match(source, /getCurrentWatchExactOwnerMeta\(settings\)\s*\|\| \(isShortRoute \? getCurrentShortOwnerMeta\(settings, routeVideoId\) : null\)/);
});

test('a captured reel overlay (main-reel-player-overlay-renderer.json) teaches its owner to the Home shelf', () => {
    const capture = JSON.parse(fs.readFileSync('tests/runtime/fixtures/captures/main-reel-player-overlay-renderer.json', 'utf8'));
    const ownerId = 'UC-6YsZ1GcOMIehkb8eHioUQ';
    const { engine } = engineWithIdentity();
    const rules = settings({ whitelistChannels: [{ id: '@ElectricRevolution', handle: '@electricrevolution', name: 'Electric Revolution' }] });
    engine.processData({ entries: [{ command: { reelWatchEndpoint: { videoId: S1, overlay: { reelPlayerOverlayRenderer: capture.renderer } } } }] },
        rules, 'fetch:/youtubei/v1/reel/reel_watch_sequence');
    assert.equal(rules.videoChannelMap[S1], ownerId);
    assert.deepEqual(shelfIds(engine.processData(homeShortsShelf([S1, S2]), rules, 'browse')), [S1]);
});
