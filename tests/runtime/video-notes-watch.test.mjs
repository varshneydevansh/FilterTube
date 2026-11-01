import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const source = fs.readFileSync('js/content/video_notes.js', 'utf8');
const flush = async () => { for (let i = 0; i < 25; i++) await Promise.resolve(); };
class Node {
    constructor(tag) { this.tag = tag; this.style = {}; this.children = []; this.events = new Map(); this.attributes = new Map(); this.isConnected = true; }
    append(...children) { this.children.push(...children); for (const child of children) { child.parentNode = this; child.isConnected = true; } }
    appendChild(child) { this.append(child); }
    attachShadow(options) { assert.equal(options.mode, 'closed'); return new Node('shadow'); }
    setAttribute(key, value) { this.attributes.set(key, value); }
    addEventListener(name, fn) { this.events.set(name, fn); }
    remove() { this.isConnected = false; }
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
    hasAttribute(name) { return this.attributes.has(name); }
}
function fixture() {
    const settings = { enabled: true, hideSponsoredCards: false, activeProfileId: 'Parent', activeProfileKind: 'account', profileType: 'main' };
    const id = 'aBcDEf012_-', location = { hostname: 'www.youtube.com', pathname: '/watch', search: '?v=' + id,
        origin: 'https://www.youtube.com', href: 'https://www.youtube.com/watch?v=' + id };
    const rootEvents = new Map(), docEvents = new Map(), created = [], runtime = [], main = [];
    let listener, pendingMetadata = null, lateState = false, ad = false, pin = true, deferredPermission = false, permissionReply = null;
    let category = 'allowed', language = 'allowed', permit = null, seekWrites = 0, position = 12;
    const video = { duration: 180, readyState: 4, paused: true, ended: false, currentSrc: 'blob:original',
        get currentTime() { return position; }, set currentTime(value) { seekWrites++; position = value; } };
    const pane = new Node('metadata'), actions = new Node('actions');
    pane.querySelector = () => actions;
    const document = { visibilityState: 'visible', documentElement: new Node('html'),
        querySelector: selector => selector.includes('ad-showing') ? (ad ? new Node('ad') : null)
            : selector.includes('video.html5-main-video') ? video : selector.includes('watch-metadata') ? pane : null,
        createElement: tag => { const node = new Node(tag); created.push(node); return node; },
        addEventListener(name, fn) { docEvents.set(name, fn); } };
    const root = { currentSettings: settings, crypto: webcrypto,
        __filtertubeDirectAccessState: { latestSettings: settings, videoId: id, decision: 'allowed', pausedByGuard: false, routeTransitionPending: false },
        FilterTubeManagedPlaybackPermit: { read: () => permit },
        addEventListener(name, fn) { if (!rootEvents.has(name)) rootEvents.set(name, new Set()); rootEvents.get(name).add(fn); },
        removeEventListener(name, fn) { rootEvents.get(name)?.delete(fn); },
        postMessage(message, origin) {
            main.push(structuredClone(message));
            assert.equal(origin, location.origin);
            const respond = (preferences = {}) => { for (const fn of [...rootEvents.get('message') || []]) fn({ source: root, origin,
                data: { type: 'FilterTube_NativeContentState', source: 'injector', payload: {
                    requestId: message.payload.requestId, videoId: id, videoIdMatched: true,
                    preferences: { nativeVideoId: id, nativeAdInactive: true, ...preferences } } } }); };
            if (lateState) pendingMetadata = respond; else respond();
        } };
    const api = { runtime: { id: 'test', getURL: path => 'chrome-extension://test/' + path,
        onMessage: { addListener: fn => { listener = fn; } },
        sendMessage(request, cb) {
            runtime.push(structuredClone(request));
            const respond = () => cb({ ok: pin, token: 'opaque-notes-capability' });
            if (request.token && deferredPermission) permissionReply = respond; else respond();
        } } };
    const context = vm.createContext({ window: root, document, chrome: api, location, crypto: webcrypto, Uint8Array, URLSearchParams,
        setTimeout, clearTimeout, setInterval() {}, getCategoryPolicyDecision: () => category, getLanguagePolicyDecision: () => language });
    const instrumented = source.replace('Object.freeze({ refresh })', 'Object.freeze({ refresh, admitted, seek })');
    assert.notEqual(instrumented, source); vm.runInContext(instrumented, context);
    return { root, settings, document, location, video, created, runtime, main, pane, actions,
        admitted: () => root.FilterTubeVideoNotes.admitted(),
        start: async () => { await root.FilterTubeVideoNotes.refresh(); created.find(node => node.tag === 'button').events.get('click')(); await flush(); },
        seek: seconds => root.FilterTubeVideoNotes.seek(seconds), writes: () => seekWrites,
        deferMetadata() { lateState = true; }, metadata: prefs => pendingMetadata(prefs),
        deferPermission() { deferredPermission = true; }, permission: () => permissionReply(),
        lock() { pin = false; }, ad: value => { ad = value; }, category: value => { category = value; },
        language: value => { language = value; }, permit: value => { permit = value; },
        refresh: () => root.FilterTubeVideoNotes.refresh(), event: name => docEvents.get(name)?.(),
        receive: (request, cb) => listener(request, {}, cb) };
}
test('Notes remains independent of advert settings and targets an exact allowed profile/video', () => {
    const f = fixture(); assert.deepEqual(structuredClone(f.admitted()), { profileId: 'Parent', videoId: 'aBcDEf012_-' });
    f.settings.contentOnlyPlayback = false; assert.ok(f.admitted());
});
for (const deny of ['blocked', 'pending', 'stale-settings', 'transition', 'child-route', 'time', 'hidden-info', 'hidden-buttons', 'native', 'hidden-tab']) {
    test(`${deny} prevents opening the personal editor`, () => {
        const f = fixture(); const direct = f.root.__filtertubeDirectAccessState;
        if (['blocked', 'pending'].includes(deny)) direct.decision = deny;
        if (deny === 'stale-settings') direct.latestSettings = { ...f.settings };
        if (deny === 'transition') direct.routeTransitionPending = true;
        if (deny === 'child-route') f.settings.managedViewingRouteGate = { allowMainViewing: false };
        if (deny === 'time') f.root.__filtertubeManagedTimeLimitTimedOut = true;
        if (deny === 'hidden-info') f.settings.hideVideoInfo = true;
        if (deny === 'hidden-buttons') f.settings.hideVideoButtonsBar = true;
        if (deny === 'native') f.root.__filterTubeNativeOverlayCovered = true;
        if (deny === 'hidden-tab') f.document.visibilityState = 'hidden';
        assert.equal(f.admitted(), null); assert.equal(f.runtime.length, 0);
    });
}
test('unknown category/language or expired managed permit cannot grant notes access', () => {
    const f = fixture(); f.settings.categoryFilters = { enabled: true }; f.category('unknown'); assert.equal(f.admitted(), null);
    f.category('allowed'); f.settings.languageFilters = { enabled: true }; f.language('blocked'); assert.equal(f.admitted(), null);
    f.language('allowed'); f.settings.managedTimeLimitPolicy = { enabled: true }; f.permit({ decision: 'allowed', profileId: 'Parent' });
    assert.equal(f.admitted(), null); f.permit({ decision: 'allowed', profileId: 'Parent', expiresAt: Date.now() + 10000 }); assert.ok(f.admitted());
});
test('timestamp seek preserves paused intent and sends no note text to MAIN', async () => {
    const f = fixture(); await f.start(); assert.equal(await f.seek(90), true);
    assert.equal(f.video.currentTime, 90); assert.equal(f.video.paused, true); assert.equal(f.writes(), 1);
    assert.deepEqual(Object.keys(f.main[0].payload).sort(), ['requestId', 'videoId']);
    assert.equal(f.created.filter(node => node.tag === 'iframe').length, 1);
});
for (const invalidation of ['ad', 'profile', 'route', 'source', 'pin']) {
    test(`late timestamp reply after ${invalidation} change cannot seek the media`, async () => {
        const f = fixture(); await f.start(); f.deferMetadata(); const pending = f.seek(90);
        if (invalidation === 'ad') f.ad(true);
        if (invalidation === 'profile') { f.settings.activeProfileId = 'Child'; await f.refresh(); }
        if (invalidation === 'route') f.location.search = '?v=12345678901';
        if (invalidation === 'source') f.video.currentSrc = 'blob:new-source';
        if (invalidation === 'pin') f.lock();
        f.metadata(); assert.equal(await pending, false); assert.equal(f.writes(), 0);
    });
}
test('source/ad/time changes during the final fresh permission check are also refused', async () => {
    for (const change of ['source', 'ad', 'time']) {
        const f = fixture(); await f.start(); f.deferPermission(); const pending = f.seek(90); await flush();
        if (change === 'source') f.video.currentSrc = 'blob:replacement';
        if (change === 'ad') f.ad(true);
        if (change === 'time') f.root.__filtertubeManagedTimeLimitTimedOut = true;
        f.permission(); assert.equal(await pending, false); assert.equal(f.writes(), 0);
    }
});
test('malformed notes-bearing imports reject before storage/profile mutation and rollback preserves live notes, playlists and writer', async () => {
    let writes = [];
    const state = { ftSavedVideoNotesV1: 'new committed tombstone', ftSavedVideoNotesWriterV1: 'writer-new', ftLocalPlaylistsV1: 'synced-playlists', enabled: true, extraImportKey: 1, ftDeviceAutoSyncV1: 'revoked-current', ftAutoSyncQueueV1: 'current-queue' };
    const root = {};
    const code = fs.readFileSync('js/io_manager.js', 'utf8').replace('global.FilterTubeIO = {', 'global.FilterTubeIO = { restoreStorageSnapshot,');
    vm.runInNewContext(code, { window: root, chrome: { storage: { local: {
        get: (_keys, cb) => cb({ ...state }), set: (update, cb) => { writes.push(update); Object.assign(state, update); cb(); },
        remove: (keys, cb) => { keys.forEach(key => delete state[key]); cb(); }
    } }, runtime: {} } });
    // Valid app notes and playlists now import; tests/runtime/local-playlists.test.mjs covers that path.
    await assert.rejects(root.FilterTubeIO.importV3({ savedVideoNotes: {} })); assert.equal(writes.length, 0);
    await root.FilterTubeIO.restoreStorageSnapshot({ enabled: false, ftSavedVideoNotesV1: 'old edit', ftSavedVideoNotesWriterV1: 'old-writer', ftLocalPlaylistsV1: 'old-playlists', ftDeviceAutoSyncV1: 'old-grant', ftAutoSyncQueueV1: 'old-delivery' });
    assert.equal(state.ftSavedVideoNotesV1, 'new committed tombstone'); assert.equal(state.ftSavedVideoNotesWriterV1, 'writer-new');
    assert.equal(state.ftLocalPlaylistsV1, 'synced-playlists');
    assert.equal(state.ftDeviceAutoSyncV1, 'revoked-current'); assert.equal(state.ftAutoSyncQueueV1, 'current-queue');
    assert.equal(state.enabled, false); assert.equal(state.extraImportKey, undefined);
});

test('Notes mounts only its action in YouTube buttons and reattaches without replacing the private editor', async () => {
    const f = fixture(); await f.start();
    const host = f.created.find(node => node.className === 'filtertube-notes-affordance');
    const panel = f.created.find(node => node.className === 'filtertube-notes-panel');
    assert.equal(host.parentNode, f.actions); assert.equal(panel.parentNode, f.document.documentElement);
    assert.equal(host.children.some(node => node.tag === 'iframe'), false);
    host.parentNode = null; host.isConnected = false;
    await f.refresh();
    assert.equal(host.parentNode, f.actions); assert.equal(f.created.filter(node => node.tag === 'iframe').length, 1);
});
test('current timestamp uses the same fresh admission as seeks without moving or playing media', async () => {
    const f = fixture(); await f.start();
    let result;
    const grant = f.runtime.find(request => request.action === 'FilterTube_NotesGrant');
    f.receive({ action: 'FilterTube_NotesPosition', instance: grant.instance, token: 'opaque-notes-capability' }, value => { result = value; });
    await flush();
    assert.deepEqual(structuredClone(result), { ok: true, seconds: 12, duration: 180 });
    assert.equal(f.writes(), 0); assert.equal(f.video.paused, true);
});

test('Notes immediately opens a top-layer dialog and Escape requests draft review before closing', async () => {
    const f = fixture(); await f.start();
    const dialog = f.created.find(node => node.tag === 'dialog');
    assert.equal(dialog.open, true);
    let prevented = false;
    dialog.events.get('cancel')({ preventDefault() { prevented = true; } }); await flush();
    assert.equal(prevented, true); assert.equal(dialog.open, true);
    assert.equal(f.runtime.at(-1).action, 'FilterTube_NotesRequestClose');
    const grant = f.runtime.find(request => request.action === 'FilterTube_NotesGrant');
    f.receive({ action: 'FilterTube_NotesClose', instance: grant.instance, token: 'opaque-notes-capability' }, () => {});
    assert.equal(dialog.open, false);
});
test('a second isolated controller cannot reject a different Notes instance receipt', async () => {
    const f = fixture(); await f.start(); let responded = false;
    const result = f.receive({ action: 'FilterTube_NotesCheck', instance: 'other-instance' }, () => { responded = true; });
    assert.equal(result, false); assert.equal(responded, false);
});
test('an opening error remains visible in the modal with a working Close control', async () => {
    const f = fixture(); f.lock(); await f.start();
    const dialog = f.created.find(node => node.tag === 'dialog');
    assert.equal(dialog.open, true); assert.equal(f.created.some(node => node.tag === 'iframe'), false);
    const close = f.created.find(node => node.tag === 'button' && node.textContent === 'Close notes');
    close.events.get('click')(); await flush(); assert.equal(dialog.open, false);
});
