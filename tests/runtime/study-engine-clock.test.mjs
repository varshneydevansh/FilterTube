// The pure study clock: plan + focus + break mode + now -> NORMAL / STUDY(round i of n, until) /
// BREAK(until) / LIMIT and the next transition. Times are local wall-clock times.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Engine = require('../../js/shared/study_engine.js');

// 2026-11-16 is a Monday.
const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();
const plan = (extra = {}) => ({ days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '16:00', end: '18:00', ...extra });
const clock = (now, extra = {}) => Engine.studyClock({ plan: plan(extra.plan), focus: { roundMinutes: 50, breakMinutes: 10 }, breakMode: 'rest', now, ...extra.input });

test('outside the plan the state is NORMAL and the next transition is the next study start', () => {
    const result = clock(at(16, 15, 0));
    assert.equal(result.state, Engine.NORMAL);
    assert.deepEqual({ ...result.next }, { state: Engine.STUDY, at: at(16, 16, 0), round: 1 });
});

test('50/10 rounds: round 1 of 2, a break, then the last round clamped to the end', () => {
    const first = clock(at(16, 16, 10));
    assert.equal(first.state, Engine.STUDY);
    assert.equal(first.round, 1);
    assert.equal(first.rounds, 2);
    assert.equal(first.until, at(16, 16, 50));
    assert.equal(first.next.state, Engine.BREAK);
    assert.equal(first.next.at, at(16, 16, 50));
    assert.equal(first.breakNoticeAt, at(16, 16, 48), 'the break is announced 2 minutes ahead');
    const rest = clock(at(16, 16, 55));
    assert.equal(rest.state, Engine.BREAK);
    assert.equal(rest.until, at(16, 17, 0));
    assert.equal(rest.breakMode, 'rest');
    const last = clock(at(16, 17, 30));
    assert.equal(last.state, Engine.STUDY);
    assert.equal(last.round, 2);
    assert.equal(last.until, at(16, 18, 0), 'no trailing break: the last round runs to the end');
    assert.equal(last.next.state, Engine.NORMAL);
    assert.equal(last.breakNoticeAt, null);
    assert.equal(clock(at(16, 18, 0)).state, Engine.NORMAL, 'the end is exclusive');
});

test('25/5 rounds over 2 hours give 4 rounds and the round boundaries', () => {
    const segments = Engine.splitRounds(at(16, 16), at(16, 18), { roundMinutes: 25, breakMinutes: 5 });
    assert.deepEqual(segments.map(s => [s.kind, new Date(s.start).getMinutes(), new Date(s.end).getHours() * 60 + new Date(s.end).getMinutes()]), [
        ['STUDY', 0, 985], ['BREAK', 25, 990], ['STUDY', 30, 1015], ['BREAK', 55, 1020],
        ['STUDY', 0, 1045], ['BREAK', 25, 1050], ['STUDY', 30, 1080]
    ]);
    assert.ok(segments.every(s => s.rounds === 4));
});

test('a session shorter than one round is one round cut at the end', () => {
    const segments = Engine.splitRounds(at(16, 16), at(16, 16, 30), { roundMinutes: 50, breakMinutes: 10 });
    assert.equal(segments.length, 1);
    assert.equal(segments[0].end, at(16, 16, 30));
});

test('a leftover too short for another round goes to the last round; a longer one becomes a short round', () => {
    const exact = Engine.splitRounds(at(16, 16), at(16, 18, 50), { roundMinutes: 50, breakMinutes: 10 });
    assert.equal(exact.filter(s => s.kind === 'STUDY').length, 3, '3 x 50 + 2 x 10 = 170 minutes');
    const longer = Engine.splitRounds(at(16, 16), at(16, 17, 45), { roundMinutes: 50, breakMinutes: 10 });
    assert.deepEqual(longer.map(s => s.kind), ['STUDY', 'BREAK', 'STUDY']);
    assert.equal(longer[2].end - longer[2].start, 45 * 60 * 1000);
});

test('days of the week: Saturday has no plan, Monday does', () => {
    assert.equal(clock(at(21, 16, 30)).state, Engine.NORMAL, 'Saturday');
    const friday = clock(at(20, 18, 30));
    assert.equal(friday.next.at, at(23, 16, 0), 'Friday evening: next study is Monday');
    assert.equal(clock(at(16, 16, 30), { plan: { days: [] } }).state, Engine.NORMAL, 'no days chosen means no plan');
});

test('a session crossing midnight belongs to the day it starts', () => {
    const late = { plan: { days: ['fri'], start: '23:00', end: '01:00' } };
    assert.equal(clock(at(20, 23, 30), late).state, Engine.STUDY, 'Friday 23:30');
    const afterMidnight = clock(at(21, 0, 30), late);
    assert.equal(afterMidnight.state, Engine.STUDY, 'Saturday 00:30 still in Friday\'s session');
    assert.equal(afterMidnight.until, at(21, 1, 0));
    assert.equal(afterMidnight.round, 2);
    assert.equal(clock(at(22, 0, 30), late).state, Engine.NORMAL, 'Sunday 00:30: Saturday has no session');
});

test('plan.limit starts LIMIT after study until midnight; never earlier than the end', () => {
    const limited = { plan: { limit: '20:00' } };
    assert.equal(clock(at(16, 19, 59), limited).state, Engine.NORMAL);
    const limit = clock(at(16, 20, 30), limited);
    assert.equal(limit.state, Engine.LIMIT);
    assert.equal(limit.until, at(17, 0, 0));
    assert.equal(limit.next.state, Engine.NORMAL);
    assert.equal(clock(at(16, 17, 59), limited).next.state, Engine.NORMAL);
    assert.equal(clock(at(16, 18, 10), limited).next.state, Engine.LIMIT);
    const early = clock(at(16, 17, 30), { plan: { limit: '17:00' } });
    assert.equal(early.state, Engine.STUDY, 'a limit before the end waits for the end');
    assert.equal(clock(at(16, 18, 30), { plan: { limit: '17:00' } }).state, Engine.LIMIT);
});

test('limitReached gives LIMIT outside study only', () => {
    assert.equal(clock(at(16, 12, 0), { input: { limitReached: true } }).state, Engine.LIMIT);
    assert.equal(clock(at(16, 16, 30), { input: { limitReached: true } }).state, Engine.STUDY);
});

test('a self-started session is an occurrence; endedUntil ends one early', () => {
    const session = { startedAt: at(21, 10, 0), endsAt: at(21, 11, 0) };
    const now = clock(at(21, 10, 20), { input: { session } });
    assert.equal(now.state, Engine.STUDY);
    assert.equal(now.source, 'session');
    assert.equal(now.sessionEnd, at(21, 11, 0));
    assert.equal(clock(at(21, 10, 20), { input: { session, endedUntil: at(21, 11, 0) } }).state, Engine.NORMAL);
    assert.equal(clock(at(16, 16, 20), { input: { endedUntil: at(16, 18, 0) } }).state, Engine.NORMAL, 'today\'s plan occurrence ended early');
    assert.equal(clock(at(17, 16, 20), { input: { endedUntil: at(16, 18, 0) } }).state, Engine.STUDY, 'tomorrow is unaffected');
});

test('break mode normal is reported and the study rules only apply in STUDY or a rest break', () => {
    const normalBreak = Engine.studyClock({ plan: plan(), focus: { roundMinutes: 50, breakMinutes: 10 }, breakMode: 'normal', now: at(16, 16, 55) });
    assert.equal(normalBreak.breakMode, 'normal');
    assert.equal(Engine.studyRulesApply(normalBreak), false);
    assert.equal(Engine.studyRulesApply(clock(at(16, 16, 55))), true);
    assert.equal(Engine.studyRulesApply(clock(at(16, 16, 10))), true);
    assert.equal(Engine.studyRulesApply(clock(at(16, 12, 0))), false);
});

test('no plan and no session is always NORMAL with no next transition', () => {
    const result = Engine.studyClock({ plan: null, focus: null, now: at(16, 16, 0) });
    assert.equal(result.state, Engine.NORMAL);
    assert.equal(result.next, null);
});

test('local dates and progress per device and day', () => {
    assert.equal(Engine.localDateKey(at(16, 23, 59)), '2026-11-16');
    let progress = Engine.addProgressMinutes({}, 'laptop', '2026-11-16', 3);
    progress = Engine.addProgressMinutes(progress, 'laptop', '2026-11-16', 2);
    progress = Engine.addProgressMinutes(progress, 'phone', '2026-11-16', 10);
    progress = Engine.addProgressMinutes(progress, 'phone', 'bad', 10);
    assert.deepEqual(progress, { laptop: { '2026-11-16': 5 }, phone: { '2026-11-16': 10 } });
    assert.equal(Engine.minutesOn(progress, '2026-11-16'), 15);
    const week = Engine.weekProgress(progress, at(18, 12), 10);
    assert.equal(week.days[0].date, '2026-11-16');
    assert.equal(week.days[0].fill, 'full');
    assert.equal(week.daysStudied, 1);
    assert.equal(Engine.weekProgress({ a: { '2026-11-17': 5 } }, at(18, 12), 10).days[1].fill, 'half');
});

test('end policy: Gentle ends after a 30-second pause; Locked and parent-set sessions cannot be ended', () => {
    assert.deepEqual({ ...Engine.endPolicy({ lock: { mode: 'gentle' } }) }, { canEnd: true, pauseMs: 30000 });
    assert.equal(Engine.endPolicy({ lock: { mode: 'locked' } }).canEnd, false);
    assert.equal(Engine.endPolicy({ plan: { setByParentId: 'parent-1' } }).reason, 'set_by_parent');
    assert.equal(Engine.selfStarted({ plan: { setByParentId: null }, lock: null }), true);
});
