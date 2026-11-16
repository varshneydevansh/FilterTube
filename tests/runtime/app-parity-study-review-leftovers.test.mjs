// Android 9ed6a1e27 and ee59f65b4 (StudyWatchOverlay.kt skip chip, StudyDashboardActivity.kt End session
// and the empty week, StudyDayPlannerView.kt "Right now", strings_study.xml): "Skip this video" is the
// first chip in the Watch page's action row, during a round or a break that plays videos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Overlay = require('../../js/content/study_overlay.js');

function harness() {
    const nodes = new Map();
    const make = tag => ({
        tag, id: '', style: {}, dataset: {}, children: [], attributes: {}, textContent: '', type: '', handlers: {},
        setAttribute(key, value) { this.attributes[key] = String(value); },
        getAttribute(key) { return this.attributes[key] ?? null; },
        appendChild(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); return child; },
        insertBefore(child, ref) { const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(child); else this.children.splice(i, 0, child); if (child.id) nodes.set(child.id, child); return child; },
        get firstChild() { return this.children[0] || null; },
        addEventListener(type, fn) { this.handlers[type] = fn; },
        remove() { nodes.delete(this.id); for (const host of [doc.body, row]) { const i = host.children.indexOf(this); if (i >= 0) host.children.splice(i, 1); } }
    });
    const row = make('div');
    row.appendChild(make('like'));
    const env = { row: null };
    const doc = { body: make('body'), visibilityState: 'visible', createElement: make, getElementById: id => nodes.get(id) || null,
        querySelectorAll: () => [], querySelector: selector => (selector.includes('top-level-buttons-computed') ? env.row : null), addEventListener() {} };
    const overlay = Overlay.createStudyOverlay({
        window: { addEventListener() {}, location: { pathname: '/watch', href: 'https://www.youtube.com/watch?v=abcdEFGH123' } }, document: doc,
        runtime: { getURL: path => path, sendMessage: async () => ({ ok: true }), onMessage: { addListener() {} } },
        now: () => 1_000_000, setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {}
    });
    return { overlay, doc, row, env, nodes };
}

test('Skip this video joins the action row as its first chip, and waits at the corner until the row is there', () => {
    const h = harness();
    h.overlay.setState({ ok: true, state: 'STUDY', until: 2_000_000 });
    const early = h.nodes.get('filtertube-study-skip');
    assert.ok(early, 'shown before the row loads');
    assert.equal(early.style.position, 'fixed');
    h.env.row = h.row;
    h.overlay.setState({ ok: true, state: 'STUDY', until: 2_000_000 });
    const chip = h.nodes.get('filtertube-study-skip');
    assert.equal(h.row.children[0], chip, 'first in the row');
    assert.equal(chip.getAttribute('data-in-action-row'), 'true');
    assert.equal(chip.style.position, undefined);
    assert.equal(h.doc.body.children.includes(chip), false, 'no longer over the page');
    // A break that plays videos keeps it; a rest break (the overlay) and normal rules don't.
    h.overlay.setState({ ok: true, state: 'BREAK', breakMode: 'normal', until: 2_000_000 });
    assert.ok(h.nodes.get('filtertube-study-skip'));
    h.overlay.setState({ ok: true, state: 'NORMAL' });
    assert.equal(h.nodes.get('filtertube-study-skip'), undefined);
});

test('the review copy is in every catalog', () => {
    const catalogs = fs.readdirSync('data/ui_locales').filter(name => /^[a-zA-Z-]+\.json$/.test(name) && !name.startsWith('release') && name !== 'targets.json');
    for (const name of catalogs) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${name}`, 'utf8'));
        for (const key of ['study.endSession', 'study.endHint', 'study.week.empty']) assert.ok((catalog[key] || '').trim(), `${name} ${key}`);
    }
});

// Ports Android fcd8018b8 (StudyLooseningSheet.kt, StudyPageRules.kt StudyLoosening, C41-C43): a change
// that would loosen study while it runs says why instead of failing quietly.
test('the loosening sheets: Gentle, self-Locked and a parent\'s plan', async () => {
    globalThis.window = globalThis;
    await import('../../js/study_ui.js');
    const page = fs.readFileSync('js/study_ui.js', 'utf8');
    const body = page.slice(page.indexOf('function looseningSheet('), page.indexOf('function showLoosening('));
    const looseningSheet = new Function('object', 'text', 't', 'formatDayTime', `${body}; return looseningSheet;`)(
        value => (value && typeof value === 'object' ? value : {}), value => (typeof value === 'string' ? value.trim() : ''),
        (key, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m), () => '6:00 PM');
    const gentle = looseningSheet('study_running', { state: 'STUDY', sessionEnd: 1, endPolicy: { canEnd: true } });
    assert.equal(gentle.title, 'This would loosen your study rules');
    assert.equal(gentle.body, 'End your session to change it, or change it after 6:00 PM.');
    assert.equal(gentle.endSession, true);
    const locked = looseningSheet('locked', { state: 'BREAK', lockMode: 'locked', lockedUntil: 1 });
    assert.equal(locked.title, 'Locked until 6:00 PM');
    const parent = looseningSheet('set_by_parent', { state: 'STUDY', setByParentId: 'mum', lockedUntil: 1 }, 'Mum');
    assert.equal(parent.title, 'Set by Mum until 6:00 PM');
    assert.equal(parent.body, 'You can make your rules stricter, but not looser.');
    assert.equal(looseningSheet('set_by_parent', { state: 'STUDY', setByParentId: 'x', lockedUntil: 1 }, 'Default').title, 'Set by a parent until 6:00 PM');
    assert.equal(looseningSheet('study_running', { state: 'NORMAL' }), null, 'outside study it is a plain message');
});

test('a running self session refuses a loosening save with the reason the sheet names', async () => {
    const require = createRequire(import.meta.url);
    const Engine = require('../../js/shared/study_engine.js');
    const Model = require('../../js/shared/study_model.js');
    const Packs = require('../../js/shared/study_packs.js');
    const { createStudyBackground } = require('../../js/study_background.js');
    const catalog = Packs.parseCatalog(JSON.parse(fs.readFileSync('data/study/packs-v1.json', 'utf8')));
    const at = new Date(2026, 10, 16, 16, 10).getTime();
    const store = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'p1', profiles: { p1: { name: 'Me', type: 'account',
        main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [] }, kids: { mode: 'blocklist', blockedKeywords: [] },
        study: Model.createStudy({ activePackIds: ['in_gate'] }) } } } };
    const browserAPI = { storage: { local: {
        get(keys, cb) { const out = {}; for (const key of [].concat(keys)) if (key in store) out[key] = structuredClone(store[key]); cb(out); },
        set(items, cb) { Object.assign(store, structuredClone(items)); cb?.(); }
    } }, alarms: { create() {}, clear() {} } };
    const controller = createStudyBackground({ browserAPI, Engine, Model, Packs, now: () => at, loadCatalog: async () => catalog,
        getSelfControlSession: async () => null, startLockedSession: async () => ({ ok: true }),
        writeProfile: async (id, profile) => { store.ftProfilesV4.profiles[id] = structuredClone(profile); return { ok: true }; } });
    assert.equal((await controller.startSession({ minutes: 50, lock: 'gentle' })).ok, true);
    // Another pack lets more in, and normal videos in breaks loosen the rest screen.
    assert.deepEqual(await controller.update({ activePackIds: ['in_gate', 'in_clat'] }), { ok: false, error: 'study_running' });
    assert.deepEqual(await controller.update({ breakMode: 'normal' }), { ok: false, error: 'study_running' });
    const tighten = await controller.update({ activePackIds: [], focus: { roundMinutes: 50, breakMinutes: 5 } });
    assert.equal(tighten.ok, true, 'a stricter save still goes through');
});
