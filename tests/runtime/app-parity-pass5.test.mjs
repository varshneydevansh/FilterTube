// Parity pass 5 with the Android app (docs/design/EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md): the
// Study search explainer, the channel row's mapping line, a parent's update during a Self-Control
// session, "Skip this video" in a card's menu, an ask from a blocked channel page and Study's
// "Ask for time".
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const catalog = JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8'));

test('study search explainer: plan channels, two subjects and the first pack\'s example searches (StudySearchExplainer)', () => {
    const civil = Engine.searchExplainer({ activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'civil' } } }, catalog);
    assert.equal(civil.channels, 9);
    assert.deepEqual(civil.topics, ['fluid mechanics', 'structural analysis']);
    assert.deepEqual(civil.examples, ['cement', 'beam deflection']);
    const removed = Engine.searchExplainer({ activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'civil', channelsRemoved: [{ handle: catalog.packs.find(p => p.id === 'in_gate').channels[0].handle }] } } }, catalog);
    assert.ok(removed.channels <= civil.channels);
    assert.deepEqual(Engine.searchExplainer({ activePackIds: [] }, catalog), { channels: 0, topics: [], examples: [] });
});

function loadStudyUi() {
    const make = tag => ({
        tag, className: '', style: {}, children: [], attributes: {}, textContent: '', hidden: false, dataset: {}, handlers: {},
        classList: { toggle() {}, add() {}, remove() {} },
        setAttribute(key, value) { this.attributes[key] = value; },
        appendChild(child) { this.children.push(child); return child; },
        append(...nodes) { nodes.forEach(node => this.children.push(node)); },
        replaceChildren(...nodes) { this.children = nodes; },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        querySelectorAll() { return []; }, querySelector() { return null; }, closest() { return null; }, remove() {}
    });
    const context = {
        document: { createElement: make, createElementNS: (_ns, tag) => make(tag), readyState: 'complete', getElementById: () => null },
        navigator: { language: 'en' }, setTimeout: () => 0, clearTimeout: () => {}, Date, Math, JSON, Promise, Intl, Number, String, Array, Object,
        chrome: { runtime: { lastError: null, getURL: path => path, sendMessage(message, cb) { cb?.({ ok: true }); } }, storage: { local: { get: (keys, cb) => cb({}) } } }
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/shared/study_engine.js', 'utf8'), context);
    vm.runInContext(fs.readFileSync('js/study_ui.js', 'utf8'), context);
    return context.FilterTubeStudyUi;
}

test('study search explainer card: the app\'s words, and "Ask a parent for more." only for a child', () => {
    const Ui = loadStudyUi();
    const study = { activePackIds: ['in_gate'], packEdits: { in_gate: { variant: 'civil' } } };
    const words = card => card.children.map(child => child.textContent).join(' | ');
    const self = Ui.searchExplainerCard(study, catalog, false);
    assert.equal(words(self), 'How search works while studying | While you study, search shows lessons from your 9 channels and your topics (fluid mechanics, structural analysis…). Anything else waits until study ends. Try “cement” or “beam deflection”.');
    assert.match(words(Ui.searchExplainerCard(study, catalog, true)), /Ask a parent for more\.$/);
    assert.equal(Ui.searchExplainerCard({ activePackIds: [] }, catalog, false), null);
    assert.doesNotMatch(words(self), /YouTube/);
});

function fakeNode(tag, className = '') {
    const node = {
        tagName: tag.toUpperCase(), className, children: [], attributes: {}, style: {}, handlers: {}, parentNode: null, textContent: '',
        classList: { contains: name => node.className.split(/\s+/).includes(name) },
        get firstElementChild() { return node.children[0] || null; },
        get nextSibling() { const list = node.parentNode?.children || []; return list[list.indexOf(node) + 1] || null; },
        setAttribute(key, value) { node.attributes[key] = String(value); },
        getAttribute(key) { return key in node.attributes ? node.attributes[key] : null; },
        appendChild(child) { child.parentNode = node; node.children.push(child); return child; },
        append(...nodes) { nodes.forEach(child => node.appendChild(child)); },
        insertBefore(child, before) {
            child.parentNode = node;
            const index = before ? node.children.indexOf(before) : -1;
            if (index < 0) node.children.push(child); else node.children.splice(index, 0, child);
            return child;
        },
        remove() { if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1); },
        addEventListener(type, fn) { node.handlers[type] = fn; },
        querySelectorAll(selector) {
            const name = selector.replace(/^\./, '');
            const out = [];
            const walk = current => current.children.forEach(child => { if (child.classList?.contains(name)) out.push(child); walk(child); });
            walk(node);
            return out;
        }
    };
    return node;
}

function loadSkipMenu(settings, response = { ok: true }) {
    const source = fs.readFileSync('js/content_bridge.js', 'utf8');
    const start = source.indexOf('function injectStudySkipMenuItem');
    const body = source.slice(start, source.indexOf('\n}\n', start) + 3);
    const sent = [];
    const closed = [];
    const context = {
        currentSettings: settings, sent, closed,
        document: { createElement: tag => fakeNode(tag) },
        createFilterTubeIconElement: () => fakeNode('svg'),
        filterTubeContentMenuText: (key, fallback) => fallback,
        extractVideoIdFromCard: card => card?.videoId || '',
        forceCloseDropdown: dropdown => closed.push(dropdown),
        browserAPI_BRIDGE: { runtime: { sendMessage: async message => { sent.push(message); return response; } } }
    };
    vm.createContext(context);
    vm.runInContext(`${body}\nthis.injectStudySkipMenuItem = injectStudySkipMenuItem;`, context);
    return context;
}

function menuWithFilterTubeEntry() {
    const dropdown = fakeNode('tp-yt-iron-dropdown');
    const list = dropdown.appendChild(fakeNode('yt-list-view-model'));
    const entry = list.appendChild(fakeNode('yt-list-item-view-model', 'yt-list-item-view-model filtertube-block-channel-item'));
    entry.appendChild(fakeNode('div', 'yt-list-item-view-model__container filtertube-menu-item'));
    list.appendChild(fakeNode('yt-list-item-view-model', 'site-item'));
    return { dropdown, list };
}

test('card menu: "Skip this video" sits under the FilterTube entry only while a study round runs', async () => {
    const card = { videoId: 'abcdEFGH123', style: {}, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }, getAttribute() { return null; } };
    const off = loadSkipMenu({ study: { state: 'BREAK' } });
    const quiet = menuWithFilterTubeEntry();
    off.injectStudySkipMenuItem(quiet.dropdown, card, {});
    assert.equal(quiet.list.children.length, 2);

    const on = loadSkipMenu({ study: { state: 'STUDY' } });
    const { dropdown, list } = menuWithFilterTubeEntry();
    on.injectStudySkipMenuItem(dropdown, card, {});
    on.injectStudySkipMenuItem(dropdown, card, {});
    assert.equal(list.children.length, 3, 'one skip entry, however often the menu redraws');
    const skip = list.children[1];
    assert.ok(skip.classList.contains('filtertube-study-skip-item'));
    assert.ok(skip.classList.contains('filtertube-block-channel-item'), 'cleared with the other FilterTube entries');
    assert.equal(skip.children[0].children[1].textContent, 'Skip this video');
    await skip.handlers.click({ preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
    assert.deepEqual(JSON.parse(JSON.stringify(on.sent)), [{ action: 'FilterTube_StudySkipVideo', videoId: 'abcdEFGH123' }]);
    assert.equal(card.style.display, 'none');
    assert.equal(on.closed.length, 1);
});
