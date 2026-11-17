// Study mode in the popup and options page: the strip, the dashboard and the planner. A small fake DOM;
// every string goes through the interface catalog and none names the video site.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load(messages = {}) {
    const sent = [];
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
        navigator: { language: 'en-IN' }, setTimeout: () => 0, clearTimeout: () => {}, Date, Math, JSON, Promise, Intl, Number, String, Array, Object,
        chrome: { runtime: { lastError: null, getURL: path => path, sendMessage(message, cb) { sent.push(message); cb?.(messages[message.action] || { ok: true }); } },
            storage: { local: { get: (keys, cb) => cb({}) } } }
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/shared/study_engine.js', 'utf8'), context);
    vm.runInContext(fs.readFileSync('js/study_ui.js', 'utf8'), context);
    return { Ui: context.FilterTubeStudyUi, make, sent };
}

const flat = node => JSON.stringify(node, (key, value) => (key === 'handlers' ? undefined : value));

test('the strip shows phase, pack and time; no End (the Study page ends a session), Locked until for parent sessions, Skip break on a break', () => {
    const { Ui, make } = load();
    const host = make('div');
    const until = Date.now() + 23 * 60000;
    Ui.renderStrip(host, { state: 'STUDY', phase: 'study', round: 1, rounds: 2, until, sessionEnd: until,
        packs: [{ id: 'in_gate', shortName: 'GATE', names: { en: 'GATE' }, variant: { id: 'cse', names: { en: 'CSE' } } }], endPolicy: { canEnd: true } });
    assert.equal(host.hidden, false);
    const text = flat(host);
    assert.ok(text.includes('Studying GATE · CSE until'));
    assert.ok(text.includes('Round 1 of 2'));
    // Android's session strip has no End: ending lives on the Study page.
    assert.equal(text.includes('"End"'), false);
    const onBreak = make('div');
    Ui.renderStrip(onBreak, { state: 'BREAK', until, canSkipBreak: true, skipPreview: { addedMinutes: 5, round: 2 }, endPolicy: { canEnd: true } });
    assert.ok(flat(onBreak).includes('Skip break'));
    const parent = make('div');
    Ui.renderStrip(parent, { state: 'STUDY', phase: 'study', until, setByParentId: 'mum', lockedUntil: until, lockMode: 'locked', endPolicy: { canEnd: false } }, { parentName: 'Default' });
    assert.ok(flat(parent).includes('Locked until'));
    assert.ok(flat(parent).includes('Set by a parent'), 'the default parent name reads "Set by a parent"');
    assert.equal(flat(parent).includes('"End"'), false);
    const off = make('div');
    Ui.renderStrip(off, { state: 'NORMAL' });
    assert.equal(off.hidden, true, 'hidden when no session runs');
});

test('a Gentle end shows the 30-second countdown with Cancel', async () => {
    const { Ui, make, sent } = load();
    const host = make('div');
    Ui.renderStrip(host, { state: 'STUDY', phase: 'study', until: Date.now() + 60000, endPolicy: { canEnd: true }, endRequestedAt: Date.now() - 5000 });
    assert.match(flat(host), /Ending in 2[56] s/);
    const find = (node, label) => node.textContent === label ? node : node.children?.map(child => find(child, label)).find(Boolean);
    find(host, 'Cancel').handlers.click();
    assert.equal(sent.at(-1).action, 'FilterTube_StudyCancelEnd');
});

test('the planner draws study, break, normal and limit segments and keeps study at least 30 minutes', () => {
    const { Ui } = load();
    const segments = Ui.planSegments({ start: '16:00', end: '18:00', limit: '20:00' }, { roundMinutes: 50, breakMinutes: 10 });
    assert.deepEqual(JSON.parse(JSON.stringify(segments.map(segment => [segment.kind, segment.start, segment.end]))), [
        ['normal', 420, 960], ['study', 960, 1010], ['break', 1010, 1020], ['study', 1020, 1080], ['normal', 1080, 1200], ['limit', 1200, 1320]
    ]);
    assert.equal(Ui.segmentWords({ kind: 'break' }, 'rest'), 'A rest screen. Nothing plays.');
    assert.equal(Ui.segmentWords({ kind: 'break' }, 'normal'), 'Normal rules until the break ends.');
});

test('every study string is in the English catalog, translated in every catalog, and never names the video site', () => {
    const source = fs.readFileSync('js/study_ui.js', 'utf8') + fs.readFileSync('js/content/study_overlay.js', 'utf8') + fs.readFileSync('js/content/admission_overlay.js', 'utf8');
    const keys = [...source.matchAll(/\bt\('((?:study|admission\.study)[a-zA-Z0-9_.]*)'/g)].map(match => match[1]);
    const english = JSON.parse(fs.readFileSync('data/ui_locales/en.json', 'utf8'));
    for (const key of new Set(keys)) assert.ok(english[key], key);
    const studyKeys = Object.keys(english).filter(key => key.startsWith('study.') || key.startsWith('admission.study'));
    for (const key of studyKeys) assert.equal(/YouTube/.test(english[key]), false, key);
    const targets = JSON.parse(fs.readFileSync('data/ui_locales/targets.json', 'utf8')).locales.map(entry => entry.code).filter(code => code !== 'en');
    for (const code of targets) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${code}.json`, 'utf8'));
        for (const key of studyKeys) {
            assert.ok(typeof catalog[key] === 'string' && catalog[key].trim(), `${code}: ${key}`);
            assert.equal(/YouTube/.test(catalog[key]), false, `${code}: ${key}`);
        }
    }
});

test('pages load the study UI: popup strip, options card, and the Family command centre plans', () => {
    const popup = fs.readFileSync('html/popup.html', 'utf8');
    assert.match(popup, /css\/study\.css/);
    assert.match(popup, /js\/study_ui\.js/);
    const tab = fs.readFileSync('html/tab-view.html', 'utf8');
    assert.match(tab, /id="ftStudyCard"/);
    assert.match(tab, /id="ftStudyDashboard"/);
    assert.ok(tab.indexOf('js/shared/study_engine.js') < tab.indexOf('js/study_ui.js'));
    assert.match(fs.readFileSync('js/tab-view.js', 'utf8'), /FilterTubeStudyUi\?\.renderParentPlans\?\.\(commandCenter/);
});
