/* Study mode engine (3.6.2, Phase 2). Pure functions shared by the background worker, the content
 * scripts and the tests; the same rules as the Android engine:
 *
 * 1. studyClock(): the plan, the focus settings, the break mode and the clock give the state now
 *    (NORMAL, STUDY round i of n until, BREAK until, LIMIT) and the next transition. Nothing running is
 *    stored, so a device that was asleep or offline is still right.
 *    - A plan occurrence starts on each listed day at plan.start and ends at plan.end, the next day
 *      when end <= start (a session crossing midnight belongs to the day it started).
 *    - Rounds repeat roundMinutes of study then breakMinutes of break. The last round is clamped to the
 *      end: when no further round and break fits, that round runs to the end (cut short, or taking a
 *      leftover too short for another round), so a session never ends on a break.
 *    - plan.limit ("HH:MM", optional; the day planner's third handle, never before the end of study)
 *      starts LIMIT, which lasts until local midnight. `limitReached` (the daily minutes are used up)
 *      gives LIMIT outside study too.
 *    - A self-started session ({startedAt, endsAt}) is one more occurrence. `endedUntil` hides
 *      occurrences that end at or before it (a Gentle session ended early).
 * 2. studyEffectiveProfile(): during STUDY (and a "rest" BREAK) the active packs, with packEdits
 *    applied, are the allow layer of Main and Kids; the block list plus each pack's blocked words still
 *    subtract (mode "whitelist", layered: true). The user's own allowed channels stay; their allow
 *    keywords and allowed video ids are left out for the session, as in a Hard Whitelist session.
 * 3. Progress helpers: minutes per device id and local date.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const NORMAL = 'NORMAL';
    const STUDY = 'STUDY';
    const BREAK = 'BREAK';
    const LIMIT = 'LIMIT';
    const MINUTE = 60 * 1000;
    const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const BREAK_NOTICE_MS = 2 * MINUTE;
    // A break waits for the video that is playing, for 5 minutes at most.
    const BREAK_WAIT_MAX_MS = 5 * MINUTE;
    const GENTLE_END_PAUSE_MS = 30 * 1000;
    const SELF_LOCK_MAX_MINUTES = 240;
    const PARENT_LOCK_MAX_MINUTES = 7 * 24 * 60;
    const STUDY_SOURCE = 'study_pack';
    const TAG_PREFIX = 'study:';

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
    function toMs(now) {
        const value = now instanceof Date ? now.getTime() : Number(now);
        return Number.isFinite(value) ? value : Date.now();
    }

    function parseTime(value) {
        const match = TIME.exec(text(value));
        return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    }

    function localMidnight(ms) {
        const date = new Date(ms);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    /** Local midnight `days` calendar days after the one holding `ms` (DST-safe). */
    function addDays(ms, days) {
        const date = new Date(ms);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
    }

    /** Local wall-clock minutes after a day's midnight; DST-safe because Date normalizes. */
    function atMinutes(dayStart, minutes) {
        const date = new Date(dayStart);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, minutes).getTime();
    }

    function localDateKey(now) {
        const date = new Date(toMs(now));
        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function dayKey(ms) { return DAY_KEYS[new Date(ms).getDay()]; }

    function focusMinutes(focus) {
        const value = object(focus);
        const round = Number.isFinite(value.roundMinutes) ? Math.max(1, Math.trunc(value.roundMinutes)) : 25;
        const rest = Number.isFinite(value.breakMinutes) ? Math.max(0, Math.trunc(value.breakMinutes)) : 5;
        return { round, rest };
    }

    /** The study and break segments of one occurrence; the last round is clamped to the end. */
    function splitRounds(start, end, focus) {
        const { round, rest } = focusMinutes(focus);
        const segments = [];
        let at = start;
        let index = 0;
        while (at < end) {
            index += 1;
            let studyEnd = at + round * MINUTE;
            if (studyEnd + rest * MINUTE >= end) studyEnd = end;
            segments.push({ kind: STUDY, round: index, start: at, end: studyEnd });
            if (studyEnd >= end) break;
            if (rest > 0) segments.push({ kind: BREAK, round: index, start: studyEnd, end: studyEnd + rest * MINUTE });
            at = studyEnd + rest * MINUTE;
        }
        const rounds = segments.filter(segment => segment.kind === STUDY).length;
        return segments.map(segment => ({ ...segment, rounds }));
    }

    /** Plan occurrences that overlap [from, to): {start, end, limitAt, day}. */
    function planOccurrences(plan, from, to) {
        const value = object(plan);
        const startMin = parseTime(value.start);
        const endMin = parseTime(value.end);
        if (startMin === null || endMin === null) return [];
        const days = new Set(array(value.days).map(day => text(day).toLowerCase()));
        const limitMin = parseTime(value.limit);
        const out = [];
        for (let day = addDays(from, -1); day < to; day = addDays(day, 1)) {
            if (!days.has(dayKey(day))) continue;
            const start = atMinutes(day, startMin);
            const end = endMin > startMin ? atMinutes(day, endMin) : atMinutes(addDays(day, 1), endMin);
            let limitAt = null;
            if (limitMin !== null) {
                limitAt = limitMin >= startMin ? atMinutes(day, limitMin) : atMinutes(addDays(day, 1), limitMin);
                limitAt = Math.max(limitAt, end);
            }
            if (end > from - 2 * 24 * 60 * MINUTE) out.push({ start, end, limitAt, day, source: 'plan' });
        }
        return out;
    }

    function occurrencesAround(input, now) {
        const from = localMidnight(now);
        const to = addDays(from, 8);
        const list = planOccurrences(input.plan, from, to);
        const session = object(input.session);
        const startedAt = Number(session.startedAt);
        const endsAt = Number(session.endsAt);
        if (Number.isFinite(startedAt) && Number.isFinite(endsAt) && endsAt > startedAt) {
            list.push({ start: startedAt, end: endsAt, limitAt: null, day: localMidnight(startedAt), source: 'session' });
        }
        const endedUntil = Number(input.endedUntil);
        return list
            .filter(occurrence => !(Number.isFinite(endedUntil) && occurrence.end <= endedUntil))
            .sort((a, b) => a.start - b.start);
    }

    function stateAt(input, now, occurrences) {
        const current = occurrences.find(occurrence => occurrence.start <= now && now < occurrence.end);
        if (current) {
            const segments = splitRounds(current.start, current.end, input.focus);
            const segment = segments.find(item => item.start <= now && now < item.end) || segments[segments.length - 1];
            return {
                state: segment.kind, round: segment.round, rounds: segment.rounds, until: segment.end,
                sessionStart: current.start, sessionEnd: current.end, source: current.source, segments
            };
        }
        const limited = occurrences.find(occurrence => occurrence.limitAt !== null
            && occurrence.limitAt <= now && now < addDays(occurrence.limitAt, 1) && localMidnight(now) === localMidnight(occurrence.limitAt));
        if (limited) return { state: LIMIT, until: addDays(limited.limitAt, 1), reason: 'plan_limit' };
        if (input.limitReached === true) return { state: LIMIT, until: addDays(now, 1), reason: 'daily_limit' };
        return { state: NORMAL, until: null };
    }

    /**
     * The study state at `now`:
     *   {state, round, rounds, until, sessionStart, sessionEnd, source, breakMode, segments,
     *    next: {state, at} | null, breakNoticeAt}
     * Input: {plan, focus, breakMode, now, session?, endedUntil?, limitReached?}.
     */
    function studyClock(input = {}) {
        const now = toMs(input.now);
        const occurrences = occurrencesAround(input, now);
        const current = stateAt(input, now, occurrences);
        const boundaries = [];
        if (current.until) boundaries.push(current.until);
        for (const occurrence of occurrences) {
            if (occurrence.start > now) boundaries.push(occurrence.start);
            if (occurrence.limitAt !== null && occurrence.limitAt > now) boundaries.push(occurrence.limitAt);
        }
        const nextAt = boundaries.filter(at => at > now).sort((a, b) => a - b)[0];
        let next = null;
        if (Number.isFinite(nextAt)) {
            const after = stateAt(input, nextAt, occurrences);
            next = { state: after.state, at: nextAt, round: after.round || null };
        }
        const breakMode = text(input.breakMode) === 'normal' ? 'normal' : 'rest';
        const result = { round: null, rounds: null, sessionStart: null, sessionEnd: null, source: null, segments: [], ...current, breakMode, next };
        result.breakNoticeAt = result.state === STUDY && next && next.state === BREAK ? Math.max(now, next.at - BREAK_NOTICE_MS) : null;
        result.studying = result.state === STUDY || result.state === BREAK;
        return result;
    }

    /** Whether the study allow layer applies: during STUDY, and during a "rest" BREAK (the feed is hidden). */
    function studyRulesApply(clock) {
        const value = object(clock);
        return value.state === STUDY || (value.state === BREAK && value.breakMode !== 'normal');
    }

    function channelIdentity(value) {
        if (typeof value === 'string') {
            const item = text(value);
            if (/^UC[A-Za-z0-9_-]{22}$/.test(item)) return { id: item, handle: '' };
            return { id: '', handle: item.replace(/^@/, '').toLowerCase() };
        }
        const ref = object(value);
        const id = text(ref.channelId) || (/^UC[A-Za-z0-9_-]{22}$/.test(text(ref.id)) ? text(ref.id) : '');
        const handle = text(ref.handle || ref.canonicalHandle).replace(/^@/, '').toLowerCase();
        return { id, handle };
    }

    function sameChannel(a, b) {
        const left = channelIdentity(a);
        const right = channelIdentity(b);
        if (left.id && right.id) return left.id === right.id;
        return !!left.handle && left.handle === right.handle;
    }

    function wordKey(value) { return text(typeof value === 'string' ? value : value?.word).replace(/\s+/g, ' ').toLowerCase(); }

    /**
     * One pack with its edits: {id, channels, keywords, blockedWords}. channelsRemoved and topicsRemoved
     * take rows out; channelsAdded and topicsAdded put rows in. Class packs add every grade's words.
     */
    function packLayer(pack, edits) {
        const change = object(edits);
        const removedChannels = array(change.channelsRemoved);
        const removedTopics = new Set(array(change.topicsRemoved).map(wordKey));
        const channels = [];
        for (const channel of [...array(pack.channels), ...array(change.channelsAdded)]) {
            if (removedChannels.some(removed => sameChannel(channel, removed))) continue;
            if (channels.some(existing => sameChannel(existing, channel))) continue;
            channels.push({ channelId: text(channel.channelId) || null, handle: text(channel.handle) || null, name: text(channel.name) });
        }
        const keywords = [];
        const seen = new Set();
        const grades = Object.values(object(pack.gradeKeywords)).flat();
        for (const word of [...array(pack.keywords), ...grades, ...array(change.topicsAdded)]) {
            const key = wordKey(word);
            if (!key || removedTopics.has(key) || seen.has(key)) continue;
            seen.add(key);
            keywords.push(text(word));
        }
        return { id: pack.id, channels, keywords, blockedWords: array(pack.blockedWords).map(text).filter(Boolean) };
    }

    /** The active packs found in the catalog, with packEdits applied, in activePackIds order. */
    function activePackLayers(study, catalog) {
        const value = object(study);
        const packs = array(object(catalog).packs);
        return array(value.activePackIds)
            .map(id => packs.find(pack => pack.id === id))
            .filter(Boolean)
            .map(pack => packLayer(pack, object(value.packEdits)[pack.id]));
    }

    function packChannelRow(channel, packId) {
        const handle = channel.handle ? (channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`) : null;
        return {
            ...(channel.channelId ? { id: channel.channelId } : {}),
            ...(handle ? { handle, canonicalHandle: handle } : {}),
            name: channel.name || handle || channel.channelId,
            source: STUDY_SOURCE,
            managedListId: `${TAG_PREFIX}${packId}`
        };
    }

    function packWordRow(word, packId) {
        return { word, exact: true, comments: false, source: STUDY_SOURCE, managedListId: `${TAG_PREFIX}${packId}` };
    }

    function appendWords(list, rows) {
        const out = [...array(list)];
        const seen = new Set(out.map(wordKey));
        for (const row of rows) {
            const key = wordKey(row);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            out.push(row);
        }
        return out;
    }

    function studySurface(surface, layers, { kids }) {
        const data = object(surface);
        const savedLayering = text(data.mode) === 'whitelist' ? (data.layered === true ? 'layered' : 'whitelist') : 'blocklist';
        // The user's own allowed channels stay; rows a mode switch only copied over (blocklist users)
        // and paused managed rows do not.
        const ownChannels = array(data.whitelistChannels).filter(row => {
            if (!row) return false;
            if (typeof row === 'object' && row.managedListPaused === true) return false;
            if (typeof row === 'object' && row.modeBootstrapCopy === true && savedLayering === 'blocklist') return false;
            if (typeof row === 'object' && text(row.managedListId).startsWith(TAG_PREFIX)) return false;
            return true;
        });
        const channels = [...ownChannels];
        for (const layer of layers) {
            for (const channel of layer.channels) {
                if (channels.some(existing => sameChannel(existing, channel))) continue;
                channels.push(packChannelRow(channel, layer.id));
            }
        }
        const allowWords = layers.flatMap(layer => layer.keywords.map(word => packWordRow(word, layer.id)));
        const blockWords = layers.flatMap(layer => layer.blockedWords.map(word => packWordRow(word, layer.id)));
        const blockKey = kids ? 'blockedKeywords' : (Array.isArray(data.keywords) || !Array.isArray(data.blockedKeywords) ? 'keywords' : 'blockedKeywords');
        const next = {
            ...clone(data),
            mode: 'whitelist',
            layered: true,
            whitelistChannels: clone(channels),
            whitelistKeywords: appendWords([], allowWords),
            allowedVideoIds: [],
            [blockKey]: appendWords(clone(array(data[blockKey])), blockWords)
        };
        return next;
    }

    /**
     * The profile the filters use right now. Outside study (and in a "normal" break or LIMIT) it is the
     * profile unchanged; during study, Main and Kids get the pack allow layer with layered blocking.
     * Returns {profile, applied, packIds}.
     */
    function studyEffectiveProfile(profile, { catalog, clock, study } = {}) {
        const source = object(profile);
        const value = study || source.study;
        if (!isObject(value) || !studyRulesApply(clock)) return { profile, applied: false, packIds: [] };
        const layers = activePackLayers(value, catalog);
        if (!layers.length) return { profile, applied: false, packIds: [] };
        return {
            profile: {
                ...source,
                main: studySurface(source.main, layers, { kids: false }),
                kids: studySurface(source.kids, layers, { kids: true })
            },
            applied: true,
            packIds: layers.map(layer => layer.id)
        };
    }

    /** Adds whole minutes for a device and local date; returns a new progress object. */
    function addProgressMinutes(progress, deviceId, dateKey, minutes) {
        const out = clone(object(progress));
        const device = text(deviceId);
        const count = Math.trunc(Number(minutes));
        if (!device || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isFinite(count) || count <= 0) return out;
        const days = object(out[device]);
        days[dateKey] = Math.min(1440, (Number(days[dateKey]) || 0) + count);
        out[device] = days;
        return out;
    }

    /** Minutes studied on a local date across every device. */
    function minutesOn(progress, dateKey) {
        return Object.values(object(progress)).reduce((sum, days) => sum + (Number(object(days)[dateKey]) || 0), 0);
    }

    /** The 7 days Monday to Sunday holding `now`: {date, minutes, fill: "full"|"half"|"empty"}. */
    function weekProgress(progress, now, goalMinutes = 0) {
        const today = localMidnight(toMs(now));
        const monday = addDays(today, -((new Date(today).getDay() + 6) % 7));
        const days = [];
        for (let index = 0; index < 7; index += 1) {
            const date = localDateKey(addDays(monday, index));
            const minutes = minutesOn(progress, date);
            const fill = minutes <= 0 ? 'empty' : (goalMinutes > 0 && minutes < goalMinutes ? 'half' : 'full');
            days.push({ date, minutes, fill });
        }
        return { days, daysStudied: days.filter(day => day.minutes > 0).length };
    }

    /** Who may skip a break or end a session: only sessions the person started themselves. */
    function selfStarted(study) {
        const value = object(study);
        return !text(object(value.plan).setByParentId) && !text(object(value.lock).setByParentId);
    }

    /** End rules: Gentle ends after a 30-second pause; Locked (or parent-set) cannot be ended here. */
    function endPolicy(study) {
        const lock = object(object(study).lock);
        if (!selfStarted(study)) return { canEnd: false, reason: 'set_by_parent' };
        if (text(lock.mode) === 'locked') return { canEnd: false, reason: 'locked' };
        return { canEnd: true, pauseMs: GENTLE_END_PAUSE_MS };
    }

    return Object.freeze({
        NORMAL, STUDY, BREAK, LIMIT, BREAK_NOTICE_MS, BREAK_WAIT_MAX_MS, GENTLE_END_PAUSE_MS,
        SELF_LOCK_MAX_MINUTES, PARENT_LOCK_MAX_MINUTES, STUDY_SOURCE,
        parseTime, localDateKey, splitRounds, planOccurrences, studyClock, studyRulesApply,
        packLayer, activePackLayers, studyEffectiveProfile,
        addProgressMinutes, minutesOn, weekProgress, selfStarted, endPolicy
    });
}));
