/* The study plan's drag rules (Android StudyDayPlannerView / StudyPlannerModel), pure and testable.
 * A draft is {start, end, limit} in minutes of the day; limit null means no daily limit.
 * - Times snap to 15 minutes; a plan studies at least 30 minutes.
 * - START: 0 .. end - 30. END: start + 30 .. 1425 (23:45); the limit is pushed along to stay >= end.
 * - LIMIT: end .. 1440, where 1440 means "No limit".
 * - The nearest handle within reach takes a press; LIMIT loses ties (it sits on END by default).
 * Used by the plan page's day bar and the Study length slider (js/study_ui.js). */
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

    /**
     * Today's study made `minutes` long: the start stays, the end moves (and pushes the limit), as the
     * Study length slider and the End stepper do.
     */
    function withLength(draft, minutes) {
        return move(draft, 'end', draft.start + clamp(snap(minutes), MIN_STUDY_MINUTES, maxLength(draft)));
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
        snap, draftOf, hhmm, move, step, nearestHandle, minuteAt, lengthOf, maxLength, withLength, applyToPlan
    });
}));
