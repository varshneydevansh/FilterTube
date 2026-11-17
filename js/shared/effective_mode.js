/* The mode the filters really use right now (owner, 2026-11-17): during a study round, a rest break or the
 * plan's limit the rules are the plan's allow list, whatever the profile's own Blocklist/Whitelist says.
 * One pure helper so the popup pill, the dashboard header pill, the left-pane rows and the Home greeting
 * all say the same thing:
 *
 *   effectiveModeFor(profileListMode, studyState, now) ->
 *     { mode: 'study' | 'whitelist' | 'blocklist', study: boolean, phase: 'round' | 'rest' | 'limit' | null,
 *       until: ms | null, own: 'whitelist' | 'blocklist' }
 *
 *   studyState is the background's public study state (FilterTube_StudyGetState, or compiled settings
 *   `study`): {state: 'STUDY'|'BREAK'|'LIMIT'|'NORMAL', phase: 'study'|'rest'|'normal', until, sessionEnd,
 *   clockHold}. A "normal videos" break keeps the profile's own rules, so it keeps the own mode.
 *
 *   effectiveModeText(effective, t, formatTime) -> {label, title} with the catalog keys study.pill.*.
 * Nothing names the video site.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && !root.FilterTubeEffectiveMode) root.FilterTubeEffectiveMode = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    function finite(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }

    function ownMode(value) { return value === 'whitelist' ? 'whitelist' : 'blocklist'; }

    function effectiveModeFor(profileListMode, studyState, now = Date.now()) {
        const own = ownMode(profileListMode);
        const state = object(studyState);
        const phase = String(state.phase || '');
        const kind = String(state.state || '');
        const held = state.clockHold === true || ((kind === 'STUDY' || kind === 'BREAK' || kind === 'LIMIT') && (phase === 'study' || phase === 'rest'));
        if (!held) return { mode: own, study: false, phase: null, until: null, own };
        const which = kind === 'STUDY' && phase === 'study' ? 'round'
            : (kind === 'LIMIT' || state.clockHold === true ? 'limit' : 'rest');
        const rest = which !== 'round';
        // A round runs until the session ends; a rest break or the limit until it is over.
        const candidates = rest ? [state.until, state.sessionEnd] : [state.sessionEnd, state.until];
        let until = null;
        for (const value of candidates) {
            const at = finite(value);
            if (at && at > now) { until = at; break; }
        }
        return { mode: 'study', study: true, phase: which, until, own };
    }

    function effectiveModeText(effective, t, formatTime) {
        const value = object(effective);
        const say = typeof t === 'function' ? t : (key, fallback, values) => String(fallback).replace(/\{(\w+)\}/g, (m, name) => (values && name in values ? values[name] : m));
        if (value.mode !== 'study') return null;
        const label = say('study.pill.label', 'Study');
        let time = '';
        try { time = value.until && typeof formatTime === 'function' ? formatTime(value.until) : ''; } catch (e) { time = ''; }
        let title;
        if (value.phase === 'limit') {
            title = time
                ? say('study.pill.limitTitle', 'Study · today\'s study limit, nothing shows until {time}', { time })
                : say('study.pill.limitTitleNoTime', 'Study · today\'s study limit, nothing shows for now');
        } else if (value.phase === 'rest') {
            title = time
                ? say('study.pill.restTitle', 'Study · on a break, nothing shows until {time}', { time })
                : say('study.pill.restTitleNoTime', 'Study · on a break, nothing shows for now');
        } else {
            title = time
                ? say('study.pill.roundTitle', 'Study · only your plan\'s channels and topics until {time}', { time })
                : say('study.pill.roundTitleNoTime', 'Study · only your plan\'s channels and topics until study ends');
        }
        return { label, title };
    }

    return Object.freeze({ effectiveModeFor, effectiveModeText });
}));
