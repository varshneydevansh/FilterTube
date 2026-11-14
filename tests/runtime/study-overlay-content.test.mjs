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
