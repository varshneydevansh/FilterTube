/* The study plan's drag rules (Android StudyDayPlannerView / StudyPlannerModel), pure and testable.
 * A draft is {start, end, limit} in minutes of the day; limit null means no daily limit.
 * - Times snap to 15 minutes; a plan studies at least 30 minutes.
 * - START: 0 .. end - 30. END: start + 30 .. 1425 (23:45); the limit is pushed along to stay >= end.
 * - LIMIT: end .. 1440, where 1440 means "No limit".
 * - The nearest handle within reach takes a press; LIMIT loses ties (it sits on END by default).
 * - The bar never scrolls sideways (Android StudyPlannerModel.range, 3d92defa7; DESIGN_PASS_2026-11-21
 *   §4.0): a wide bar shows 6 am to 11 pm grown to take in the plan; a narrow one fits the plan (2 h
 *   before study to 1 h after the limit, at least 6 h). Handles moved outside pull it out (including);
 *   a handle held against an edge widens that edge an hour at a time (widen).
 * Used by the plan page's day bar (js/study_ui.js planBar). */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.FilterTubeStudyPlanDrag = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const SNAP_MINUTES = 15;
    const MIN_STUDY_MINUTES = 30;
    const DAY_MINUTES = 1440;
    const LAST_END = DAY_MINUTES - SNAP_MINUTES;
    const NO_LIMIT = DAY_MINUTES;
    const HANDLES = Object.freeze(['start', 'end', 'limit']);
    const WIDE_START = 6 * 60;
    const WIDE_END = 23 * 60;
    /** A narrow bar shows at least this much of the day. */
    const MIN_RANGE_MINUTES = 6 * 60;
    /** How much an edge gives each time a handle is held against it. */
    const EDGE_STEP_MINUTES = 60;
    /** Bars at least this wide (CSS px) show the wide day; narrower ones fit the plan. */
    const WIDE_MIN_PX = 600;
    /** Round and break lengths (Android StudyPlannerModel.stepRound / stepBreak). */
    const LENGTH_STEP_MINUTES = 5;
    const MIN_ROUND_MINUTES = 15;
    const MAX_ROUND_MINUTES = 120;
    const MAX_BREAK_MINUTES = 60;

    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

    /** The nearest 15-minute mark. */
    function snap(minute) {
        const value = Number(minute);
        if (!Number.isFinite(value)) return 0;
        return Math.round(value / SNAP_MINUTES) * SNAP_MINUTES;
    }

    /** A draft from a plan's "HH:MM" strings; end before start reads as the next morning, clamped to 23:45. */
    function draftOf(plan) {
        const minuteOf = value => {
            const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
            if (!match) return null;
            const minutes = Number(match[1]) * 60 + Number(match[2]);
            return minutes >= 0 && minutes <= DAY_MINUTES ? minutes : null;
        };
        const source = plan && typeof plan === 'object' ? plan : {};
        let start = minuteOf(source.start);
        let end = minuteOf(source.end);
        if (start === null) start = 16 * 60;
        if (end === null || end <= start) end = Math.min(LAST_END, start + 120);
        start = clamp(snap(start), 0, LAST_END - MIN_STUDY_MINUTES);
        end = clamp(snap(end), start + MIN_STUDY_MINUTES, LAST_END);
        const rawLimit = minuteOf(source.limit);
        const limit = rawLimit === null ? null : clamp(snap(rawLimit), end, NO_LIMIT);
        return { start, end, limit: limit === NO_LIMIT ? null : limit };
    }

    /** "HH:MM" for a minute of the day. */
    function hhmm(minute) {
        const value = clamp(Math.round(Number(minute) || 0), 0, DAY_MINUTES - 1);
        return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    }

    /**
     * The draft after dragging `handle` to `minute` (StudyPlannerModel.move). Never mutates `draft`.
     * Dragging the limit to the day's end (1440) clears it.
     */
    function move(draft, handle, minute) {
        const current = { start: draft.start, end: draft.end, limit: draft.limit ?? null };
        const at = snap(minute);
        if (handle === 'start') {
            return { ...current, start: clamp(at, 0, current.end - MIN_STUDY_MINUTES) };
        }
        if (handle === 'end') {
            const end = clamp(at, current.start + MIN_STUDY_MINUTES, LAST_END);
            const limit = current.limit === null ? null : Math.max(current.limit, end);
            return { ...current, end, limit };
        }
        if (handle === 'limit') {
            const limit = clamp(at, current.end, NO_LIMIT);
            return { ...current, limit: limit >= NO_LIMIT ? null : limit };
        }
        return current;
    }

    /** One keyboard step (arrows: ±15; PageUp/PageDown: ±60) on a handle. */
    function step(draft, handle, delta) {
        const from = handle === 'limit' ? (draft.limit ?? NO_LIMIT) : draft[handle];
        return move(draft, handle, from + delta);
    }

    /**
     * Which handle a press at `minute` takes: the nearest within `reach` minutes, LIMIT losing ties;
     * null when none is close enough.
     */
    function nearestHandle(draft, minute, reach) {
        const spots = [['start', draft.start], ['end', draft.end], ['limit', draft.limit ?? NO_LIMIT]];
        let best = null;
        let bestDistance = Infinity;
        for (const [handle, at] of spots) {
            const distance = Math.abs(at - minute);
            if (distance > reach) continue;
            if (distance < bestDistance || (distance === bestDistance && best === 'limit')) {
                best = handle;
                bestDistance = distance;
            }
        }
        return best;
    }

    /** The minute under a pointer at clientX on a bar showing [from, to] over `left` .. `left + width`. */
    function minuteAt(clientX, left, width, from, to) {
        if (!(width > 0)) return from;
        return clamp(from + ((clientX - left) / width) * (to - from), 0, DAY_MINUTES);
    }

    function lengthOf(draft) { return draft.end - draft.start; }

    /** The longest study that fits after `start`. */
    function maxLength(draft) { return LAST_END - draft.start; }

    /** Today's study made `minutes` long: the start stays, the end moves (and pushes the limit). */
    function withLength(draft, minutes) {
        return move(draft, 'end', draft.start + clamp(snap(minutes), MIN_STUDY_MINUTES, maxLength(draft)));
    }

    // ---- The bar's hours (Android StudyPlannerModel.Range) -----------------------------------------

    function floorHour(minute) { return clamp(Math.floor(minute / 60) * 60, 0, DAY_MINUTES); }
    function ceilHour(minute) { return clamp(Math.floor((minute + 59) / 60) * 60, 0, DAY_MINUTES); }

    /** range ({start, end}, minutes on whole hours) grown to show every handle of draft with half an hour to spare. */
    function including(range, draft) {
        const last = draft.limit ?? draft.end;
        return { start: Math.min(range.start, floorHour(draft.start - 30)), end: Math.max(range.end, ceilHour(last + 30)) };
    }

    /**
     * The bar's first range. wide: 6 am to 11 pm, grown to show the plan. Narrow: two hours before
     * study to an hour after the limit (or the end), at least MIN_RANGE_MINUTES wide, inside the day.
     */
    function range(draft, wide) {
        if (wide) return including({ start: WIDE_START, end: WIDE_END }, draft);
        let start = floorHour(draft.start - 120);
        let end = ceilHour((draft.limit ?? draft.end) + 60);
        while (end - start < MIN_RANGE_MINUTES && (start > 0 || end < DAY_MINUTES)) {
            if (start > 0) start -= 60;
            if (end - start < MIN_RANGE_MINUTES && end < DAY_MINUTES) end += 60;
        }
        return { start, end };
    }

    /** range with its earlier (or later) edge pushed out by EDGE_STEP_MINUTES, inside the day. */
    function widen(value, earlier) {
        return earlier ? { ...value, start: Math.max(0, value.start - EDGE_STEP_MINUTES) }
            : { ...value, end: Math.min(DAY_MINUTES, value.end + EDGE_STEP_MINUTES) };
    }

    function sameRange(a, b) { return !!a && !!b && a.start === b.start && a.end === b.end; }

    /** Home and End on a handle: as early or as late as its rules allow. */
    function extreme(draft, handle, latest) { return move(draft, handle, latest ? DAY_MINUTES : 0); }

    /**
     * The Daily limit stepper: from "No limit", + starts at the end of study and − at 23:45; then
     * 15-minute steps, never before the end of study; past 23:45 is "No limit" again.
     */
    function stepLimit(draft, steps) {
        if ((draft.limit ?? null) === null && steps > 0) return { ...draft, limit: draft.end };
        return step(draft, 'limit', steps * SNAP_MINUTES);
    }

    /** Round length in 5-minute steps, 15 to 120 minutes. */
    function stepRound(minutes, steps) {
        return clamp((Number(minutes) || 25) + steps * LENGTH_STEP_MINUTES, MIN_ROUND_MINUTES, MAX_ROUND_MINUTES);
    }

    /** Break length in 5-minute steps, 0 (no breaks) to 60 minutes. */
    function stepBreak(minutes, steps) {
        return clamp((Number.isFinite(Number(minutes)) ? Number(minutes) : 5) + steps * LENGTH_STEP_MINUTES, 0, MAX_BREAK_MINUTES);
    }

    /** The plan with a draft's times written back ("HH:MM"); no limit removes the field. */
    function applyToPlan(plan, draft) {
        const next = { ...(plan && typeof plan === 'object' ? plan : {}), start: hhmm(draft.start), end: hhmm(draft.end) };
        if (draft.limit === null || draft.limit === undefined || draft.limit >= NO_LIMIT) delete next.limit;
        else next.limit = hhmm(draft.limit);
        return next;
    }

    return Object.freeze({
        SNAP_MINUTES, MIN_STUDY_MINUTES, DAY_MINUTES, LAST_END, NO_LIMIT, HANDLES,
        WIDE_START, WIDE_END, MIN_RANGE_MINUTES, EDGE_STEP_MINUTES, WIDE_MIN_PX,
        LENGTH_STEP_MINUTES, MIN_ROUND_MINUTES, MAX_ROUND_MINUTES, MAX_BREAK_MINUTES,
        snap, draftOf, hhmm, move, step, nearestHandle, minuteAt, lengthOf, maxLength, withLength, applyToPlan,
        including, range, widen, sameRange, extreme, stepLimit, stepRound, stepBreak
    });
}));
