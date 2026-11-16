// Android StudyV3Test page colours (Ports Android 79a3d892c: StudyStateTheme.kt): the page state follows
// the clock, light pages take the state's wash with paper cards, the evening steps down to panel, night
// is navy with a thin state band, and palettes mix channel by channel.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');
const min = 60 * 1000;
const t0 = 1_800_000_000_000;

test('the state follows the clock', () => {
    assert.equal(Engine.pageState(null, false, false, t0), 'IDLE');
    assert.equal(Engine.pageState(t0 + 20 * min, false, false, t0), 'ROUND');
    assert.equal(Engine.pageState(t0 + 5 * min, false, false, t0), 'LAST_FIVE');
    assert.equal(Engine.pageState(t0 + 1000, false, false, t0), 'LAST_FIVE');
    assert.equal(Engine.pageState(t0 + 5 * min + 1, false, false, t0), 'ROUND');
    assert.equal(Engine.pageState(null, true, false, t0), 'BREAK');
    // The end card wins over whatever the clock says.
    assert.equal(Engine.pageState(t0 + 20 * min, false, true, t0), 'END');
});

test('light pages take the state\'s wash and cards stay paper', () => {
    const idle = Engine.pagePalette('IDLE', false, false);
    assert.equal(idle.top, 0xEDF4E7);
    assert.equal(idle.bottom, 0xF6F2EB);
    assert.equal(idle.fadePx, Engine.PAGE_BAND_PX);
    assert.equal(idle.card, 0xFFFCF6);
    const round = Engine.pagePalette('ROUND', false, false);
    assert.equal(round.top, 0xEDF4E7);
    assert.equal(round.fadePx, 0);
    assert.equal(round.card, 0xFFFCF6);
    // The last five minutes deepen the sage; never rose (rose is the Filters colour).
    const last = Engine.pagePalette('LAST_FIVE', false, false);
    assert.notEqual(last.top, round.top);
    assert.notEqual(last.top, 0xFAE8E6);
    assert.equal(Engine.pagePalette('BREAK', false, false).top, 0xFBEDC8);
    const end = Engine.pagePalette('END', false, false);
    assert.equal(end.top, end.bottom);
    assert.equal(end.top, 0xEDF4E7);
});

test('the evening steps the light page down to panel and softens the sun', () => {
    const idle = Engine.pagePalette('IDLE', false, true);
    assert.equal(idle.top, 0xECE4D9);
    assert.notEqual(idle.card, 0xFFFCF6);
    assert.notEqual(Engine.pagePalette('ROUND', false, true).sun, 0xEDB12E);
    assert.equal(Engine.pageEvening(19), true);
    assert.equal(Engine.pageEvening(2), true);
    assert.equal(Engine.pageEvening(18), false);
    assert.equal(Engine.pageEvening(5), false);
});

test('night is true navy with a thin state band, whatever the state', () => {
    for (const state of Engine.PAGE_STATES) {
        const palette = Engine.pagePalette(state, true, false);
        assert.equal(palette.bottom, 0x0F141B);
        assert.equal(palette.card, 0x151C24);
        assert.equal(palette.fadePx, Engine.PAGE_BAND_PX);
        assert.equal(palette.cardEdge, 0x2A3440);
    }
    assert.equal(Engine.pagePalette('ROUND', true, false).top, 0x1E2E26);
    assert.equal(Engine.pagePalette('BREAK', true, false).top, 0x3D3220);
});

test('colours mix channel by channel for the cross-fade', () => {
    assert.equal(Engine.mixColor(0x000000, 0xFFFFFF, 0.5), 0x7F7F7F);
    assert.equal(Engine.mixColor(0xEDF4E7, 0xFBEDC8, 0), 0xEDF4E7);
    assert.equal(Engine.mixColor(0xEDF4E7, 0xFBEDC8, 1), 0xFBEDC8);
});
