import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dom = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
const injector = fs.readFileSync('js/injector.js', 'utf8');
const slice = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const videoId = 'Ptng0VmOt-c';

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
