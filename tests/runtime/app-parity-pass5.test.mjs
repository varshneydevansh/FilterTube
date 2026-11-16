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
