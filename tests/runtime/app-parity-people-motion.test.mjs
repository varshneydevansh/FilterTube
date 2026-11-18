// Android PeopleMotionTest (Ports Android 4ff67ce1b: PinGateActivity.kt PinGateMotion, ProfileDropdownPopup.kt
// ProfileSwitchMoment, FilterTubeMessageDialog.kt, MascotStates.kt, strings_motion_people.xml): no mascot
// or sound on the PIN gate, the shake, the switch rules and the strings.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = file => fs.readFileSync(file, 'utf8');
const slice = (text, from, to) => text.slice(text.indexOf(from), text.indexOf(to, text.indexOf(from)));

test('a wrong PIN shakes the field and asks again in place, with no mascot or sound', () => {
    for (const file of ['js/tab-view.js', 'js/popup.js']) {
        const page = source(file);
        const reject = slice(page, 'function rejectPinInput(', '\n    }\n');
        assert.match(reject, /\[0, -10, 10, -7, 7, -3, 0\]/, `${file}: the app's keyframes`);
        assert.match(reject, /duration: 320/, `${file}: PIN_SHAKE`);
        assert.match(reject, /prefers-reduced-motion/);
        for (const banned of ['playSound', 'showToast', 'Mascot', 'kriti', 'uljhan']) assert.ok(!reject.includes(banned), `${file} rejectPinInput uses ${banned}`);
        const modal = slice(page, 'async function showPromptModal(', 'async function verifyPin(');
        assert.match(modal, /aria-live', 'polite'/, `${file}: the error is a polite live region`);
        const unlock = slice(page, 'async function ensureProfileUnlocked(', '\n    }\n');
        assert.match(unlock, /check: async value =>/, `${file}: the gate checks in place`);
        assert.match(unlock, /close: true/, `${file}: only the attempt limit closes it`);
    }
});

test('the switch moment: Kriti waves at most three times a day, and only across a landed switch', async () => {
    globalThis.window = globalThis;
    const store = new Map();
    globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
    await import('../../js/mascots.js');
    const Mascots = globalThis.FilterTubeMascots;
    assert.equal(Mascots.switchKritiAllowed(null, 0, '2026-11-15'), true);
    assert.equal(Mascots.switchKritiAllowed('2026-11-15', 2, '2026-11-15'), true);
    assert.equal(Mascots.switchKritiAllowed('2026-11-15', 3, '2026-11-15'), false);
    assert.equal(Mascots.switchKritiAllowed('2026-11-14', 3, '2026-11-15'), true);
    assert.equal(Mascots.switchCrossesKids(false, true), true);
    assert.equal(Mascots.switchCrossesKids(true, false), true);
    assert.equal(Mascots.switchCrossesKids(false, false), false);
    const shown = [];
    const results = [1, 2, 3, 4].map(() => Mascots.profileSwitched('Aarav', (words, kind) => shown.push([words, kind])));
    assert.deepEqual(results, [true, true, true, false]);
    assert.deepEqual(shown[0], ['Switched to Aarav’s space.', 'success']);
    // Both pages call it only after the new profile is saved active.
    for (const file of ['js/tab-view.js', 'js/popup.js']) {
        const sw = slice(source(file), 'async function switchToProfile(', '} finally {');
        assert.ok(sw.indexOf('profileSwitched(') > sw.indexOf('activeProfileId: targetId'), file);
        assert.ok(sw.indexOf('profileSwitched(') > sw.indexOf('ensureProfileUnlocked('), `${file}: never over a PIN gate`);
    }
});

test('dialogs enter at 0.96 with alpha', () => {
    const css = source('css/paperkit.css');
    assert.match(css, /@keyframes pk-dialog-in \{ from \{ opacity: 0; transform: scale\(0\.96\); \}/);
});

test('the people moments\' copy is in every catalog, without the site\'s name', () => {
    const catalogs = fs.readdirSync('data/ui_locales').filter(name => /^[a-zA-Z-]+\.json$/.test(name) && !name.startsWith('release') && name !== 'targets.json');
    assert.equal(catalogs.length, 38);
    for (const name of catalogs) {
        const catalog = JSON.parse(fs.readFileSync(`data/ui_locales/${name}`, 'utf8'));
        for (const key of ['people.pinTryAgain', 'people.profileSwitched', 'people.restoreDone', 'people.paired']) {
            assert.ok(catalog[key], `${name} lacks ${key}`);
            assert.doesNotMatch(catalog[key], /YouTube/i);
        }
        assert.match(catalog['people.profileSwitched'], /\{name\}/, `${name} drops the name`);
    }
});
