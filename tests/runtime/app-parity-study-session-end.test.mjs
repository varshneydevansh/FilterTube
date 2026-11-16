// Android StudyHomeModelsTest "Session ends" (Ports Android 88d53bc09: StudySessionEnds.kt,
// StudyRingModel.seal, StudyClock.withSkips): a session leaves one end card, a Gentle end clips at the
// real end, time a parent gave doesn't end it early, and old cards are dropped unseen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');

const min = 60 * 1000;
const t0 = 1_800_000_000_000;
// 4 rounds of 40 with 5-minute breaks: 175 minutes, like the GATE mockup.
const focus = { roundMinutes: 40, breakMinutes: 5 };
const windowEnd = t0 + 175 * min;
const study = (at, end = windowEnd) => Engine.studyClock({ plan: null, focus, now: at, session: { startedAt: t0, endsAt: end } });
const normal = at => Engine.studyClock({ plan: null, now: at });

test('a session that runs to its end leaves one end card', () => {
    let [open, ended] = Engine.sessionEndStep(null, study(t0 + 10 * min), focus, [], t0 + 10 * min);
    assert.equal(ended, null);
    assert.equal(open.start, t0);
    const after = windowEnd + 5000;
    [open, ended] = Engine.sessionEndStep(open, normal(after), focus, [], after);
    assert.equal(open, null);
    assert.equal(ended.studiedMinutes, 160);
    assert.equal(ended.rounds, 4);
    assert.deepEqual(ended.perRound.map(item => item.minutes), [40, 40, 40, 40]);
    // It survives a round trip through storage, and nothing more comes without a new session.
    assert.deepEqual(Engine.pendingSessionEnd(JSON.parse(JSON.stringify(ended)), after), ended);
    assert.deepEqual(Engine.sessionEndStep(null, normal(after + min), focus, [], after + min), [null, null]);
});

test('a gentle end early keeps the planned rounds and clips at the real end', () => {
    const [open] = Engine.sessionEndStep(null, study(t0 + min), focus, [], t0 + min);
    // End requested: the window now ends at 70 minutes.
    const [updated] = Engine.sessionEndStep(open, study(t0 + 69 * min, t0 + 70 * min), focus, [], t0 + 69 * min);
    assert.equal(updated.end, t0 + 70 * min);
    assert.equal(updated.planEnd, windowEnd);
    const [next, ended] = Engine.sessionEndStep(updated, normal(t0 + 70 * min), focus, [], t0 + 70 * min);
    assert.equal(next, null);
    assert.equal(ended.studiedMinutes, 65);
});

test('normal rules mid-session (time a parent gave) don\'t end it early', () => {
    const [open] = Engine.sessionEndStep(null, study(t0 + min), focus, [], t0 + min);
    const [next, ended] = Engine.sessionEndStep(open, normal(t0 + 20 * min), focus, [], t0 + 20 * min);
    assert.deepEqual(next, open);
    assert.equal(ended, null);
});

test('old end cards are dropped unseen', () => {
    const [open] = Engine.sessionEndStep(null, study(t0 + min), focus, [], t0 + min);
    const [, ended] = Engine.sessionEndStep(open, normal(windowEnd), focus, [], windowEnd);
    assert.ok(ended);
    assert.equal(Engine.pendingSessionEnd(ended, windowEnd + Engine.SESSION_END_STALE_MS + 1), null);
});

test('a skipped break folds into the round before, and a new session closes the old one', () => {
    const segments = Engine.splitRounds(t0, windowEnd, focus);
    const skipped = Engine.withSkips(segments, [t0 + 40 * min]);
    assert.equal(skipped.filter(item => item.kind === 'BREAK').length, 2);
    assert.equal(skipped[0].end, t0 + 85 * min);
    assert.equal(Engine.sessionSeal(skipped, windowEnd).studiedMinutes, 165);
    const [open] = Engine.sessionEndStep(null, study(t0 + min), focus, [], t0 + min);
    const later = t0 + 300 * min;
    const other = Engine.studyClock({ plan: null, focus, now: later + min, session: { startedAt: later, endsAt: later + 60 * min } });
    const [next, ended] = Engine.sessionEndStep(open, other, focus, [], later + min);
    assert.equal(next.start, later);
    assert.equal(ended.studiedMinutes, 160);
});
