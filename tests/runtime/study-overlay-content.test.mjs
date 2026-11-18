// The Study content script: a calm rest overlay during a "rest" break (feed hidden, playback held),
// a break that waits for the playing video for 5 minutes at most, the 2-minute heads-up, and study
// time counted only while a video plays in a visible tab.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createStudyOverlay, OVERLAY_ID, NOTICE_ID } = require('../../js/content/study_overlay.js');

function fakeDom() {
    const nodes = new Map();
    const listeners = new Map();
    const make = tag => {
        const node = {
            tag, id: '', style: {}, dataset: {}, children: [], attributes: {}, textContent: '', type: '', handlers: {},
            setAttribute(key, value) { this.attributes[key] = value; },
            appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); return child; },
            addEventListener(type, fn) { this.handlers[type] = fn; },
            remove() { nodes.delete(this.id); }
        };
        return node;
    };
    const body = make('body');
    const video = { paused: true, ended: false, readyState: 4, pauseCount: 0, pause() { this.paused = true; this.pauseCount += 1; } };
    const doc = {
        body, visibilityState: 'visible', video,
        createElement: make,
        getElementById: id => nodes.get(id) || null,
        querySelectorAll: selector => (selector === 'video' ? [video] : []),
        addEventListener(type, fn) { listeners.set(type, fn); },
        listeners
    };
    return { doc, nodes, video };
}

function harness(start = 1_000_000) {
    const dom = fakeDom();
    const timers = [];
    const sent = [];
    const clock = { now: start };
    let response = { ok: true, state: 'NORMAL' };
    const overlay = createStudyOverlay({
        window: { addEventListener() {} },
        document: dom.doc,
        runtime: { sendMessage: async message => { sent.push(message); return message.action === 'FilterTube_StudyGetState' ? response : { ok: true }; }, onMessage: { addListener() {} } },
        now: () => clock.now,
        setTimeout: (fn, ms) => { timers.push({ fn, at: clock.now + ms }); return timers.length; },
        clearTimeout: () => {},
        setInterval: () => 0
    });
    const findText = (node, words) => JSON.stringify(node, (key, value) => (key === 'handlers' ? undefined : value)).includes(words);
    return { overlay, dom, timers, sent, clock, setResponse: next => { response = next; }, findText };
}

const rest = (extra = {}) => ({ ok: true, state: 'BREAK', breakMode: 'rest', until: 1_300_000, canSkipBreak: true, breakSkipped: false, ...extra });

test('a rest break shows the calm overlay and holds playback; Skip break only when self-started', async () => {
    const h = harness();
    h.overlay.setState(rest());
    const box = h.dom.nodes.get(OVERLAY_ID);
    assert.ok(box, 'overlay shown');
    assert.equal(box.dataset.kind, 'rest');
    assert.equal(box.style.background, '#FDF3E1');
    assert.ok(h.findText(box, 'Break time'));
    const skip = box.children.find(child => child.dataset.action === 'skip-break');
    assert.ok(skip);
    const played = { target: { paused: false, pause() { this.paused = true; } } };
    h.overlay.onPlay(played);
    assert.equal(played.target.paused, true, 'playback is blocked during the break');
    skip.handlers.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(h.sent.some(message => message.action === 'FilterTube_StudySkipBreak'));
    assert.equal(h.dom.nodes.get(OVERLAY_ID), undefined, 'skipped');

    const parent = harness();
    parent.overlay.setState(rest({ canSkipBreak: false }));
    assert.equal(parent.dom.nodes.get(OVERLAY_ID).children.some(child => child.dataset.action === 'skip-break'), false);
});

test('a normal break and STUDY show no overlay; LIMIT shows the done screen', () => {
    const h = harness();
    h.overlay.setState(rest({ breakMode: 'normal' }));
    assert.equal(h.dom.nodes.get(OVERLAY_ID), undefined);
    h.overlay.setState({ state: 'STUDY', until: 1_200_000 });
    assert.equal(h.dom.nodes.get(OVERLAY_ID), undefined);
    h.overlay.setState({ state: 'LIMIT', until: 2_000_000 });
    assert.equal(h.dom.nodes.get(OVERLAY_ID).dataset.kind, 'limit');
    const played = { target: { paused: false, pause() { this.paused = true; } } };
    h.overlay.onPlay(played);
    assert.equal(played.target.paused, true);
    h.overlay.setState({ state: 'NORMAL' });
    assert.equal(h.dom.nodes.get(OVERLAY_ID), undefined);
    const free = { target: { paused: false, pause() { this.paused = true; } } };
    h.overlay.onPlay(free);
    assert.equal(free.target.paused, false, 'playback is free again');
});

test('the break waits for the playing video, 5 minutes at most', () => {
    const h = harness();
    h.dom.video.paused = false;
    h.overlay.setState(rest());
    assert.equal(h.dom.nodes.get(OVERLAY_ID), undefined, 'the video keeps playing for now');
    assert.equal(h.dom.video.pauseCount, 0);
    h.clock.now += 60 * 1000;
    h.dom.video.paused = true;
    h.dom.video.ended = true;
    h.overlay.render();
    assert.ok(h.dom.nodes.get(OVERLAY_ID), 'the video ended: the break starts');

    const long = harness();
    long.dom.video.paused = false;
    long.overlay.setState(rest());
    long.clock.now += 5 * 60 * 1000;
    long.overlay.render();
    assert.ok(long.dom.nodes.get(OVERLAY_ID), 'after 5 minutes the break starts anyway');
    assert.equal(long.dom.video.paused, true);
});

test('the break is announced 2 minutes ahead, and the state is fetched again at the transition', () => {
    const h = harness();
    h.overlay.setState({ state: 'STUDY', until: 1_000_000 + 10 * 60 * 1000, breakNoticeAt: 1_000_000 + 8 * 60 * 1000 });
    const notice = h.timers.find(timer => timer.at === 1_000_000 + 8 * 60 * 1000);
    assert.ok(notice);
    notice.fn();
    assert.ok(h.findText(h.dom.nodes.get(NOTICE_ID), 'Break in 2 minutes'));
    assert.ok(h.timers.some(timer => timer.at === 1_000_000 + 10 * 60 * 1000 + 500), 'refresh just after the transition');
});

test('study time counts only while a video plays in a visible tab during STUDY', async () => {
    const h = harness();
    h.overlay.setState({ state: 'STUDY', until: 9_000_000 });
    h.overlay.checkTime();
    const step = () => { h.clock.now += 15000; h.overlay.checkTime(); };
    step();
    assert.equal(h.overlay.pendingSeconds, 0, 'paused video: nothing counts');
    h.dom.video.paused = false;
    step(); step();
    assert.equal(h.overlay.pendingSeconds, 30);
    h.dom.doc.visibilityState = 'hidden';
    step();
    assert.equal(h.overlay.pendingSeconds, 30, 'hidden tab: nothing counts');
    h.dom.doc.visibilityState = 'visible';
    step(); step();
    assert.equal(h.overlay.pendingSeconds, 0, 'a full minute is sent');
    const tick = h.sent.find(message => message.action === 'FilterTube_StudyProgressTick');
    assert.equal(tick.seconds, 60);
    h.overlay.setState(rest());
    h.dom.video.paused = false;
    step();
    assert.equal(h.overlay.pendingSeconds, 0, 'breaks do not count');
});

test('every manifest loads the Study content script before content_bridge.js on YouTube pages', () => {
    for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
        const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        const main = manifest.content_scripts.find(entry => entry.js.includes('js/content/video_notes.js'));
        assert.ok(main, file);
        assert.ok(main.js.indexOf('js/content/study_overlay.js') > main.js.indexOf('js/content/video_notes.js'), file);
        assert.ok(main.js.indexOf('js/content/study_overlay.js') < main.js.indexOf('js/content_bridge.js'), file);
    }
});

function gateHarness({ path = '/', admitted = false, localizer = null } = {}) {
    const dom = fakeDom();
    const mini = { paused: false, pauseCount: 0, pause() { this.paused = true; this.pauseCount += 1; }, closest: () => null };
    dom.doc.querySelector = selector => (selector.includes('ytd-miniplayer') ? mini : null);
    const rechecks = [];
    const overlay = createStudyOverlay({
        window: { addEventListener() {}, location: { pathname: path } },
        document: dom.doc,
        runtime: { sendMessage: async () => ({ ok: true }), onMessage: { addListener() {} } },
        now: () => 1_000_000, setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0,
        recheckWatch: () => rechecks.push(true),
        currentAdmitted: () => admitted,
        localizer
    });
    return { overlay, dom, mini, rechecks };
}

test('Watch gate: each phase change re-decides the current video, including one already playing', () => {
    const h = gateHarness({ path: '/watch' });
    h.overlay.setState({ state: 'NORMAL', phase: 'normal' });
    assert.equal(h.rechecks.length, 0, 'the first state is the starting point');
    h.overlay.setState({ state: 'STUDY', phase: 'study', sessionStart: 1, packIds: ['in_gate'] });
    assert.equal(h.rechecks.length, 1, 'study started');
    h.overlay.setState({ state: 'STUDY', phase: 'study', sessionStart: 1, packIds: ['in_gate'], round: 1 });
    assert.equal(h.rechecks.length, 1, 'the same phase does not re-check');
    h.overlay.setState({ state: 'BREAK', phase: 'rest', breakMode: 'rest', sessionStart: 1, packIds: [] });
    assert.equal(h.rechecks.length, 2, 'a break');
});

test('Watch gate: a miniplayer video not admitted under the study rules is paused with the study card', () => {
    const h = gateHarness({ path: '/feed/subscriptions' });
    h.overlay.setState({ state: 'STUDY', phase: 'study', sessionStart: 1, packIds: ['in_gate'] });
    assert.equal(h.mini.paused, true);
    const note = h.dom.nodes.get('filtertube-study-mini-gate');
    assert.ok(note && note.textContent.includes("Not part of today's study"));
    const ok = gateHarness({ path: '/', admitted: true });
    ok.overlay.setState({ state: 'STUDY', phase: 'study', sessionStart: 1, packIds: ['in_gate'] });
    assert.equal(ok.mini.paused, false, 'a video admitted under the study rules keeps playing');
    const normal = gateHarness({ path: '/' });
    normal.overlay.setState({ state: 'NORMAL', phase: 'normal' });
    assert.equal(normal.mini.paused, false, 'outside study nothing changes');
    const watch = gateHarness({ path: '/watch' });
    watch.overlay.setState({ state: 'STUDY', phase: 'study', sessionStart: 1, packIds: ['x'] });
    assert.equal(watch.mini.paused, false, 'the watch page is decided by the admission gate itself');
});

test('fail closed and a clock hold get their own calm cards, in the interface language', () => {
    const catalog = { 'study.overlay.holdTitle': 'Estudio en pausa', 'study.overlay.unavailableTitle': 'Paquete de estudio no disponible' };
    const localizer = { text: (key, fallback) => catalog[key] || fallback, loadLocale: async () => catalog };
    const held = gateHarness({ path: '/watch', localizer });
    held.overlay.setState({ state: 'LIMIT', phase: 'rest', clockHold: true });
    const box = held.dom.nodes.get(OVERLAY_ID);
    assert.equal(box.dataset.kind, 'hold');
    assert.ok(JSON.stringify(box.children).includes('Estudio en pausa'));
    const closed = gateHarness({ path: '/watch', localizer });
    closed.overlay.setState({ state: 'STUDY', phase: 'rest', failClosed: true });
    assert.equal(closed.dom.nodes.get(OVERLAY_ID).dataset.kind, 'unavailable');
    assert.ok(JSON.stringify(closed.dom.nodes.get(OVERLAY_ID).children).includes('Paquete de estudio no disponible'));
});

test('the Watch gate card: dom_fallback writes the study line and the overlay renders Back to study', () => {
    const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
    assert.match(source, /const studyLine = getStudyAdmissionLine\(typeof currentSettings !== 'undefined' \? currentSettings : null\);/);
    const from = source.indexOf('function getStudyAdmissionLine(settings) {');
    const block = source.slice(source.indexOf("const FILTERTUBE_STUDY_OFF_LIST"), source.indexOf('function formatCurrentWatchAdmissionMessage'));
    assert.ok(from > 0);
    const line = new Function(`${block}; return getStudyAdmissionLine;`)();
    assert.equal(line({ study: { applied: true, phase: 'study' } }), "Not part of today's study");
    assert.equal(line({ study: { applied: true, phase: 'rest' } }), 'Not during study');
    assert.equal(line({ study: { applied: false, phase: 'normal' } }), '');
    assert.equal(line({ study: { phase: 'study', rest: false } }), "Not part of today's study", 'the Android payload shape');
    assert.equal(line({ study: { phase: 'limit', rest: true } }), 'Not during study');
    assert.equal(line({}), '');
    const overlaySource = fs.readFileSync('js/content/admission_overlay.js', 'utf8');
    assert.match(overlaySource, /"Not part of today's study": 'admission\.studyOffList'/);
    assert.match(overlaySource, /localizedAdmissionText\('admission\.studyBack', 'Back to study'\)/);
    assert.equal(/YouTube/.test(overlaySource.slice(overlaySource.indexOf('function renderStudyCard'), overlaySource.indexOf('function resolveAdmissionMessage'))), false);
});

test('the admission overlay renders the study card with Back to study in the top frame only', async () => {
    const vm = await import('node:vm');
    const make = tag => ({
        tag, style: {}, children: [], attributes: {}, textContent: '', handlers: {}, isConnected: true,
        get firstChild() { return this.children[0] || null; },
        setAttribute(key, value) { this.attributes[key] = value; },
        appendChild(child) { this.children.push(child); return child; },
        append(...nodes) { nodes.forEach(node => this.children.push(node)); },
        removeChild(child) { this.children = this.children.filter(node => node !== child); },
        insertBefore(child) { this.children.unshift(child); },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        remove() {}
    });
    const run = top => {
        const assigned = [];
        const context = { document: { createElement: make, documentElement: { getAttribute: () => '' } }, fetch: async () => ({ ok: false }) };
        context.window = context;
        context.location = { hostname: 'www.youtube.com', assign: url => assigned.push(url) };
        context.top = top ? context : {};
        vm.createContext(context);
        vm.runInContext(fs.readFileSync('js/content/admission_overlay.js', 'utf8'), context);
        const overlay = make('div');
        context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', "Not part of today's study\nSome Channel");
        return { overlay, assigned };
    };
    const { overlay, assigned } = run(true);
    const card = overlay.children.find(child => child.attributes['data-filtertube-study-card']);
    assert.ok(card, 'the study card');
    const text = JSON.stringify(card, (key, value) => (key === 'handlers' ? undefined : value));
    assert.ok(text.includes("Not part of today's study") && text.includes('Some Channel'));
    const back = card.children[4].children[0];
    assert.equal(back.textContent, 'Back to study');
    back.handlers.click({ preventDefault() {}, stopPropagation() {} });
    assert.deepEqual(assigned, ['/']);
    const embedded = run(false);
    const embeddedCard = embedded.overlay.children.find(child => child.attributes['data-filtertube-study-card']);
    assert.equal(embeddedCard.children[4].children.length, 0, 'an embedded player gets no navigation button');
});

test('"Skip this video" shows on a watch page during STUDY and asks the background to hide it for good', async () => {
    const dom = fakeDom();
    const sent = [];
    const overlay = createStudyOverlay({
        window: { addEventListener() {}, location: { href: 'https://www.youtube.com/watch?v=abcdEFGH123', pathname: '/watch' } },
        document: dom.doc,
        runtime: { sendMessage: async message => { sent.push(message); return { ok: true }; }, onMessage: { addListener() {} } },
        now: () => 1_000_000, setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0
    });
    overlay.setState({ state: 'NORMAL' });
    assert.equal(dom.nodes.get('filtertube-study-skip'), undefined, 'outside study there is nothing to skip');
    overlay.setState({ state: 'STUDY', until: 1_200_000 });
    const skip = dom.nodes.get('filtertube-study-skip');
    assert.ok(skip);
    assert.equal(skip.textContent, 'Skip this video');
    skip.handlers.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(sent.find(message => message.action === 'FilterTube_StudySkipVideo'), { action: 'FilterTube_StudySkipVideo', videoId: 'abcdEFGH123' });
    assert.equal(dom.nodes.get('filtertube-study-skip'), undefined);
    assert.match(dom.nodes.get(NOTICE_ID).textContent, /Skipped/);
    overlay.setState({ state: 'BREAK', breakMode: 'rest', until: 1_300_000 });
    assert.equal(dom.nodes.get('filtertube-study-skip'), undefined, 'a rest break shows its own card instead');
    overlay.setState({ state: 'STUDY', until: 1_200_000 });
    assert.ok(dom.nodes.get('filtertube-study-skip'));
    dom.doc.querySelector = selector => (selector.includes('direct-access-overlay-host') ? {} : null);
    overlay.renderSkip();
    assert.equal(dom.nodes.get('filtertube-study-skip'), undefined, 'a video the watch gate holds back has nothing to skip');
});
