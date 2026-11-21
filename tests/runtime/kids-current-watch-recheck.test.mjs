import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// YouTube Kids: the playing video after a rules update (product rule: any filter entry hides that
// content everywhere). Only a definite "blocked" stops it; "unknown" keeps playing.
const require = createRequire(import.meta.url);
const Decision = require('../../js/shared/kids_current_watch_decision.js');
const VID = 'abcdefghijk';
const CH = 'UC' + 'k'.repeat(22);
// A stand-in for the Kids card matcher: blocks a listed channel or a keyword in the title,
// and in Allow only selected admits only allowed channels.
const matcherFor = settings => (title, channelId) => {
    if (settings.listMode === 'whitelist') return !(settings.allowChannels || []).includes(channelId);
    return (settings.blockChannels || []).includes(channelId)
        || (settings.blockWords || []).some(word => title.toLowerCase().includes(word));
};
const base = extra => ({ listMode: 'blocklist', videoChannelMap: { [VID]: CH }, videoMetaMap: { [VID]: { title: 'Motu Patlu episode' } }, ...extra });
const decide = settings => Decision.decide({ videoId: VID, settings, matches: matcherFor(settings) });

test('still allowed: an unrelated rule keeps the video playing', () => {
    assert.equal(decide(base({ blockWords: ['spider'] })).state, 'allowed');
});

test('newly blocked: its channel, a keyword, the video or its category stops it', () => {
    assert.equal(decide(base({ blockChannels: [CH] })).state, 'blocked');
    assert.equal(decide(base({ blockWords: ['motu'] })).state, 'blocked');
    assert.equal(decide(base({ blockedVideoIds: [VID] })).state, 'blocked');
    assert.equal(decide(base({ videoMetaMap: { [VID]: { title: 'x', category: 'Gaming' } },
        categoryFilters: { enabled: true, mode: 'block', selected: ['gaming'] } })).state, 'blocked');
});

test('allow only: a video in the list keeps playing', () => {
    assert.equal(decide(base({ listMode: 'whitelist', allowChannels: [CH] })).state, 'allowed');
    assert.equal(decide(base({ listMode: 'whitelist', allowedVideoIds: [VID], videoChannelMap: {}, videoMetaMap: {} })).state, 'allowed');
    assert.equal(decide(base({ listMode: 'whitelist', allowChannels: [] })).state, 'blocked', 'known and not in the list');
});

test('metadata pending keeps playing; it stops once the data shows it is blocked', () => {
    const pending = { listMode: 'blocklist', blockChannels: [CH], videoChannelMap: {}, videoMetaMap: {} };
    assert.equal(decide(pending).state, 'unknown');
    assert.equal(decide({ ...pending, listMode: 'whitelist', allowChannels: [] }).state, 'unknown', 'never pause on unknown');
    assert.equal(decide({ ...pending, videoMetaMap: { [VID]: { title: 'Motu' } } }).state, 'unknown', 'title alone does not clear the channel rule');
    assert.equal(decide({ ...pending, videoChannelMap: { [VID]: CH } }).state, 'blocked');
    assert.equal(decide(base({ categoryFilters: { enabled: true, mode: 'allow', selected: ['education'] } })).state, 'unknown', 'category still loading');
});

// The page glue in dom_fallback.js: armed on load and on a rules update, checked until definite.
function glue() {
    const source = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');
    const start = source.indexOf('const filterTubeKidsCurrentWatch = ');
    const end = source.indexOf('function getCurrentWatchVideoId() {\n    try {\n        const path = String(document.location?.pathname || \'\');\n        const shortMatch');
    const calls = [];
    const box = { calls, window: { FilterTubeKidsCurrentWatchDecision: Decision }, currentVideo: VID,
        getCurrentWatchVideoId: () => box.currentVideo,
        shouldHideContent: (title, _channel, settings, options) => matcherFor(settings)(title, options.channelMeta.id || ''),
        pauseCurrentWatchForDirectAccess: (id, decision) => calls.push(['pause', id, decision]),
        setDirectAccessOverlay: (state, message) => calls.push(['card', state, message]),
        releaseDirectAccessGuard: id => calls.push(['release', id]),
        clearDirectAccessOverlay: () => calls.push(['clear']) };
    vm.runInNewContext(`${source.slice(start, end)}; this.enforce = enforceKidsCurrentWatch; this.arm = filterTubeArmKidsCurrentWatchRecheck;`, box);
    return box;
}

test('page: still allowed keeps playing; a rules update that blocks it stops it with the blocked card', () => {
    const page = glue();
    page.enforce(base({ blockWords: ['spider'] }));
    assert.deepEqual(page.calls, [], 'no pause for an allowed video');
    page.enforce(base({ blockChannels: [CH] }));
    assert.deepEqual(page.calls, [], 'only a rules update (or a new page) re-checks');
    page.arm();
    page.enforce(base({ blockChannels: [CH] }));
    assert.deepEqual(JSON.parse(JSON.stringify(page.calls)), [['pause', VID, 'blocked'], ['card', 'blocked', 'Blocked by FilterTube']]);
    page.arm();
    page.enforce(base({ blockChannels: [] }));
    assert.deepEqual(JSON.parse(JSON.stringify(page.calls.slice(2))), [['release', VID], ['clear']], 'unblocked again: the card goes');
});

test('page: metadata pending keeps playing, then the video stops once its data arrives', () => {
    const page = glue();
    const pending = { listMode: 'blocklist', blockChannels: [CH], videoChannelMap: {}, videoMetaMap: {} };
    page.enforce(pending);
    page.enforce(pending);
    assert.deepEqual(page.calls, []);
    page.enforce({ ...pending, videoChannelMap: { [VID]: CH } });
    assert.deepEqual(JSON.parse(JSON.stringify(page.calls[0])), ['pause', VID, 'blocked']);
});
