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
