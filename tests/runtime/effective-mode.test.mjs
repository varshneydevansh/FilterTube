// The mode the filters really use (owner, 2026-11-17): during study the pill says "Study" in sage and opens
// the Study page, in the popup and the dashboard header alike, and goes back to the profile's own mode when
// the session ends.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Effective = require('../../js/shared/effective_mode.js');

const now = 1_800_000_000_000;
const minute = 60_000;

test('outside study, and in a "normal videos" break, the profile\'s own mode', () => {
    assert.deepEqual(Effective.effectiveModeFor('whitelist', null, now), { mode: 'whitelist', study: false, phase: null, until: null, own: 'whitelist' });
    assert.equal(Effective.effectiveModeFor('anything', { state: 'NORMAL', phase: 'normal' }, now).mode, 'blocklist');
    assert.equal(Effective.effectiveModeFor('blocklist', { state: 'BREAK', phase: 'normal', breakMode: 'normal', until: now + minute }, now).mode, 'blocklist');
});

test('a round is Study until the session ends; a rest break and the limit until they are over', () => {
    const round = Effective.effectiveModeFor('blocklist', { state: 'STUDY', phase: 'study', until: now + 10 * minute, sessionEnd: now + 40 * minute }, now);
    assert.deepEqual(round, { mode: 'study', study: true, phase: 'round', until: now + 40 * minute, own: 'blocklist' });
    const rest = Effective.effectiveModeFor('whitelist', { state: 'BREAK', phase: 'rest', until: now + 5 * minute, sessionEnd: now + 40 * minute }, now);
    assert.equal(rest.phase, 'rest');
    assert.equal(rest.until, now + 5 * minute);
    const limit = Effective.effectiveModeFor('blocklist', { state: 'LIMIT', phase: 'rest', until: now + 60 * minute }, now);
    assert.equal(limit.phase, 'limit');
    assert.equal(Effective.effectiveModeFor('blocklist', { clockHold: true }, now).phase, 'limit');
    // A skipped break comes back as STUDY (the clock folds it), so it stays Study.
    assert.equal(Effective.effectiveModeFor('blocklist', { state: 'STUDY', phase: 'study', breakSkipped: true, sessionEnd: now + minute }, now).mode, 'study');
    // A round with no known pack fails closed to rest: still Study, nothing shows.
    assert.equal(Effective.effectiveModeFor('blocklist', { state: 'STUDY', phase: 'rest' }, now).phase, 'rest');
});

test('the words: "Study" and when it lets go; nothing outside study', () => {
    const t = (key, fallback, values) => String(fallback).replace(/\{(\w+)\}/g, (m, name) => values?.[name] ?? m);
    const time = () => '6:40 PM';
    const round = Effective.effectiveModeFor('blocklist', { state: 'STUDY', phase: 'study', sessionEnd: now + minute }, now);
    assert.deepEqual(Effective.effectiveModeText(round, t, time), { label: 'Study', title: 'Study · only your plan\'s channels and topics until 6:40 PM' });
    assert.equal(Effective.effectiveModeText({ ...round, until: null }, t, time).title, 'Study · only your plan\'s channels and topics until study ends');
    const rest = Effective.effectiveModeFor('blocklist', { state: 'BREAK', phase: 'rest', until: now + minute }, now);
    assert.equal(Effective.effectiveModeText(rest, t, time).title, 'Study · on a break, nothing shows until 6:40 PM');
    assert.equal(Effective.effectiveModeText(Effective.effectiveModeFor('blocklist', null, now), t, time), null);
});

test('every catalog has the pill and the private-window words, and none names the video site', () => {
    const dir = 'data/ui_locales';
    const files = fs.readdirSync(dir).filter(name => /^[a-zA-Z-]+\.json$/.test(name) && name !== 'targets.json');
    assert.equal(files.length, 38);
    const keys = ['study.pill.label', 'study.pill.roundTitle', 'study.pill.roundTitleNoTime', 'study.pill.restTitle', 'study.pill.restTitleNoTime',
        'study.pill.limitTitle', 'study.pill.limitTitleNoTime', 'study.coverage.privateTitle', 'study.coverage.privateBody', 'study.coverage.familyPolicy'];
    for (const file of files) {
        const catalog = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8'));
        for (const key of keys) {
            assert.equal(typeof catalog[key], 'string', `${file} ${key}`);
            assert.ok(!/youtube/i.test(catalog[key]), `${file} ${key}`);
        }
        for (const key of ['study.pill.roundTitle', 'study.pill.restTitle', 'study.pill.limitTitle']) assert.match(catalog[key], /\{time\}/, `${file} ${key}`);
    }
});

test('the popup and the dashboard header render the Study pill from the shared helper and open the Study page', () => {
    for (const file of ['js/popup.js', 'js/tab-view.js']) {
        const source = fs.readFileSync(file, 'utf8');
        assert.match(source, /FilterTubeEffectiveMode\?\.effectiveModeFor\?\./, file);
        assert.match(source, /ft-list-mode-pill--study/, file);
    }
    assert.match(fs.readFileSync('js/popup.js', 'utf8'), /tab-view\.html\?view=study/);
    for (const file of ['html/popup.html', 'html/tab-view.html']) {
        const html = fs.readFileSync(file, 'utf8');
        const helper = html.indexOf('js/shared/effective_mode.js');
        assert.ok(helper > 0, file);
        assert.ok(helper < html.indexOf(file.includes('popup') ? 'js/popup.js' : 'js/tab-view.js'), `${file}: loaded before the page script`);
    }
});

test('the pill\'s state is declared so an early draw can\'t hit the temporal dead zone', () => {
    // renderListModeControls can run before its state lines (owner's options page: "Cannot access
    // 'tabStudyAsked' before initialization"); they are vars without a value, so a later pass can't reset a load.
    for (const [file, prefix] of [['js/tab-view.js', 'tabStudy'], ['js/popup.js', 'popupStudy']]) {
        const source = fs.readFileSync(file, 'utf8');
        for (const name of ['State', 'Load', 'Timer', 'Asked']) {
            assert.doesNotMatch(source, new RegExp(`(?:let|const) ${prefix}${name}\\b`), `${file} ${prefix}${name}`);
            assert.match(source, new RegExp(`var ${prefix}${name};`), `${file} ${prefix}${name}`);
        }
    }
});

test('the dashboard Study home offers Undo right after Skip break', () => {
    const source = fs.readFileSync('js/study_ui.js', 'utf8');
    assert.match(source, /action: 'FilterTube_StudyUndoSkipBreak', until: result\.until/);
});
