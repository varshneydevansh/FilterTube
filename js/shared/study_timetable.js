/* The study timetable (Android StudyTimetable, a614cc44e; docs/study/TIMETABLE_SPEC.md): the week in
 * periods, each pointing to a lane (one or more packs). "Mon 06:00-07:00 Maths, 07:00-08:00 GMAT".
 * Outside the periods the profile's default applies: its plan's packs (between "default") or the
 * normal rules (between "none"). Stored as `study.timetable`:
 *   {version, zone?, lanes: [{id, packIds, label?}], periods: {mon: [{start: "06:00", end: "07:00", lane}]},
 *    between, hideShortsAndComments, examDates?, setByParentId?}
 * Unknown keys at every level are kept. Pure, so the engine, the Study page and the tests share one
 * set of rules. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyTimetable = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = 1;
    const BETWEEN_DEFAULT = 'default';
    const BETWEEN_NONE = 'none';
    const SNAP_MINUTES = 15;
    const DAY_MINUTES = 24 * 60;
    const DAYS = Object.freeze(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    const MAX_LANES = 32;
    const MAX_PERIODS_PER_DAY = 48;
    const MAX_LANE_PACKS = 64;
    const ID = /^[A-Za-z0-9_.-]{1,32}$/;
    const PACK_ID = /^[A-Za-z0-9_.-]{1,64}$/;
    const TIME = /^(\d{2}):(\d{2})$/;
    const DATE = /^\d{4}-\d{2}-\d{2}$/;
    const KNOWN = Object.freeze({
        timetable: ['version', 'zone', 'lanes', 'periods', 'between', 'hideShortsAndComments', 'examDates', 'setByParentId'],
        lane: ['id', 'packIds', 'label'],
        period: ['start', 'end', 'lane']
    });
    const forbidden = new Set(['__proto__', 'prototype', 'constructor']);

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

    function extras(value, known) {
        const out = {};
        for (const [key, item] of Object.entries(object(value))) {
            if (!known.includes(key) && !forbidden.has(key) && item !== undefined) out[key] = clone(item);
        }
        return out;
    }

    // ---- Times -----------------------------------------------------------------------------------

    /** "06:30" -> 390; "24:00" is the end of the day; anything else null. */
    function minuteOf(value) {
        const match = TIME.exec(text(value));
        if (!match) return null;
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if ((hour <= 23 && minute <= 59) || (hour === 24 && minute === 0)) return hour * 60 + minute;
        return null;
    }
    function timeOf(minute) { return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`; }
    function snap(minute) {
        const value = Math.floor((Math.trunc(Number(minute) || 0) + SNAP_MINUTES / 2) / SNAP_MINUTES) * SNAP_MINUTES;
        return Math.min(DAY_MINUTES, Math.max(0, value));
    }

    // ---- Zones (the periods' times read in the timetable's zone) --------------------------------

    const formatters = new Map();
    function validZone(zone) {
        const id = text(zone);
        if (!id) return null;
        try { new Intl.DateTimeFormat('en-US', { timeZone: id }); return id; } catch (e) { return null; }
    }
    function formatter(zone) {
        const key = zone || '';
        if (!formatters.has(key)) {
            formatters.set(key, new Intl.DateTimeFormat('en-US', {
                ...(zone ? { timeZone: zone } : {}), hourCycle: 'h23',
                year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short'
            }));
        }
        return formatters.get(key);
    }
    /** The wall clock at ms in zone: {year, month, day, minute, second, dayKey}. */
    function partsAt(ms, zone) {
        const parts = {};
        for (const part of formatter(zone).formatToParts(new Date(ms))) parts[part.type] = part.value;
        const hour = Number(parts.hour) % 24;
        return {
            year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
            minute: hour * 60 + Number(parts.minute), second: Number(parts.second),
            dayKey: text(parts.weekday).toLowerCase().slice(0, 3)
        };
    }
    /** The instant the wall clock in zone reads year-month-day plus minute (minute may reach 24:00). */
    function msAt(year, month, day, minute, zone) {
        const wall = Date.UTC(year, month - 1, day, 0, minute);
        const offsetAt = guess => {
            const p = partsAt(guess, zone);
            return Date.UTC(p.year, p.month - 1, p.day, 0, p.minute, p.second) - Math.floor(guess / 1000) * 1000;
        };
        let at = wall - offsetAt(wall);
        at = wall - offsetAt(at);
        return at;
    }
    function plusDays(year, month, day, count) {
        const date = new Date(Date.UTC(year, month - 1, day + count));
        return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), dayKey: DAYS[(date.getUTCDay() + 6) % 7] };
    }
    function zoneFor(timetable, deviceZone) { return validZone(object(timetable).zone) || validZone(deviceZone) || null; }
    /** "mon".."sun" for ms in zone (the device's when none). */
    function dayKeyAt(ms, zone) { return partsAt(ms, validZone(zone)).dayKey; }

    // ---- The model --------------------------------------------------------------------------------

    function normalizeLane(value) {
        const lane = object(value);
        const id = text(lane.id);
        if (!ID.test(id)) return null;
        const packIds = [...new Set(array(lane.packIds).map(text).filter(item => PACK_ID.test(item)))].slice(0, MAX_LANE_PACKS);
        if (!packIds.length) return null;
        const label = text(lane.label).slice(0, 40);
        return { ...extras(lane, KNOWN.lane), id, packIds, ...(label ? { label } : {}) };
    }

    function normalizePeriod(value) {
        const period = object(value);
        const start = minuteOf(period.start);
        const end = minuteOf(period.end);
        const lane = text(period.lane);
        if (start === null || end === null || end <= start || !ID.test(lane)) return null;
        return { ...extras(period, KNOWN.period), start: timeOf(start), end: timeOf(end), lane };
    }

    /** The canonical timetable, or null when the value isn't one. Bad rows drop; overlaps keep the earlier period. */
    function normalize(value) {
        if (!isObject(value)) return null;
        const seen = new Set();
        const lanes = array(value.lanes).map(normalizeLane).filter(lane => lane && !seen.has(lane.id) && seen.add(lane.id)).slice(0, MAX_LANES);
        const periods = {};
        for (const day of DAYS) {
            const list = array(object(value.periods)[day]).map(normalizePeriod).filter(Boolean)
                .sort((a, b) => minuteOf(a.start) - minuteOf(b.start));
            const clean = [];
            for (const period of list) {
                const last = clean[clean.length - 1];
                if (!last || minuteOf(last.end) <= minuteOf(period.start)) clean.push(period);
            }
            if (clean.length) periods[day] = clean.slice(0, MAX_PERIODS_PER_DAY);
        }
        const examDates = {};
        for (const [id, date] of Object.entries(object(value.examDates))) {
            if (PACK_ID.test(id) && !forbidden.has(id) && DATE.test(text(date))) examDates[id] = text(date);
        }
        const zone = text(value.zone);
        const setBy = text(value.setByParentId);
        return {
            ...extras(value, KNOWN.timetable),
            version: Number.isInteger(value.version) && value.version >= VERSION ? value.version : VERSION,
            ...(zone && zone.length <= 64 ? { zone } : {}),
            lanes,
            periods,
            between: value.between === BETWEEN_NONE ? BETWEEN_NONE : BETWEEN_DEFAULT,
            hideShortsAndComments: typeof value.hideShortsAndComments === 'boolean' ? value.hideShortsAndComments : true,
            ...(Object.keys(examDates).length ? { examDates } : {}),
            ...(setBy ? { setByParentId: setBy } : {})
        };
    }

    function create(overrides = {}) { return normalize({ version: VERSION, ...object(overrides) }); }

    function lane(timetable, id) { return array(object(timetable).lanes).find(item => item.id === id) || null; }

    /** One day's periods as {startMinute, endMinute, laneId, raw}. */
    function periodsOf(timetable, day) {
        return array(object(object(timetable).periods)[day]).map(raw => ({
            startMinute: minuteOf(raw.start), endMinute: minuteOf(raw.end), laneId: raw.lane, raw
        })).filter(item => item.startMinute !== null && item.endMinute !== null);
    }

    function hasPeriods(timetable) { return DAYS.some(day => periodsOf(timetable, day).length > 0); }

    /** Every pack a period of this timetable can apply (for pack copies and Family control). */
    function packIds(timetable) { return [...new Set(array(object(timetable).lanes).flatMap(item => array(item.packIds)))]; }

    function withPeriods(timetable, day, list) {
        const periods = { ...object(object(timetable).periods) };
        if (list.length) periods[day] = list; else delete periods[day];
        return { ...object(timetable), periods };
    }

    /** Adds or replaces a period on day; overlapping periods are trimmed away, times snap to 15 minutes. */
    function withPeriod(timetable, day, startMinute, endMinute, laneId) {
        if (!DAYS.includes(day) || !ID.test(text(laneId))) return timetable;
        const start = snap(startMinute);
        const end = Math.min(DAY_MINUTES, snap(endMinute));
        if (end - start < SNAP_MINUTES) return timetable;
        const kept = periodsOf(timetable, day).filter(item => item.endMinute <= start || item.startMinute >= end).map(item => item.raw);
        const added = { start: timeOf(start), end: timeOf(end), lane: text(laneId) };
        return withPeriods(timetable, day, [...kept, added].sort((a, b) => minuteOf(a.start) - minuteOf(b.start)));
    }

    function withoutPeriod(timetable, day, startMinute) {
        if (!DAYS.includes(day)) return timetable;
        return withPeriods(timetable, day, periodsOf(timetable, day).filter(item => item.startMinute !== startMinute).map(item => item.raw));
    }

    /** "Copy to other days": from's periods replace those of each day in to. */
    function copyDay(timetable, from, to) {
        const source = array(object(object(timetable).periods)[from]);
        let out = timetable;
        for (const day of array(to)) if (DAYS.includes(day) && day !== from) out = withPeriods(out, day, clone(source));
        return out;
    }

    /** Adds a lane for packIds (or reuses the lane with the same packs): {timetable, laneId}. */
    function withLane(timetable, ids, label = null) {
        const value = object(timetable);
        const lanes = array(value.lanes);
        const wanted = array(ids).map(text).filter(Boolean);
        const same = lanes.find(item => JSON.stringify(array(item.packIds)) === JSON.stringify(wanted));
        if (same) return { timetable, laneId: same.id };
        let n = lanes.length + 1;
        while (lanes.some(item => item.id === `l${n}`)) n += 1;
        const added = { id: `l${n}`, packIds: wanted, ...(text(label) ? { label: text(label) } : {}) };
        return { timetable: { ...value, lanes: [...lanes, added] }, laneId: added.id };
    }

    /**
     * What the timetable says at now: {lane, period, startsAt, endsAt, next, nextAt}: the period (with
     * its lane) running now and the next one to start within the coming week.
     */
    function at(timetable, now, deviceZone = null) {
        const none = { lane: null, period: null, startsAt: null, endsAt: null, next: null, nextAt: null };
        if (!isObject(timetable)) return none;
        const zone = zoneFor(timetable, deviceZone);
        const ms = Number(now);
        const today = partsAt(ms, zone);
        const live = list => list.filter(item => lane(timetable, item.laneId));
        const current = live(periodsOf(timetable, today.dayKey)).find(item => item.startMinute <= today.minute && today.minute < item.endMinute) || null;
        let next = null;
        let nextAt = null;
        for (let offset = 0; offset <= 7 && !next; offset += 1) {
            const date = plusDays(today.year, today.month, today.day, offset);
            const candidates = live(periodsOf(timetable, date.dayKey)).filter(item => offset > 0 || item.startMinute > today.minute);
            const first = candidates.sort((a, b) => a.startMinute - b.startMinute)[0];
            if (first) { next = first; nextAt = msAt(date.year, date.month, date.day, first.startMinute, zone); }
        }
        return {
            lane: current ? lane(timetable, current.laneId) : null,
            period: current,
            startsAt: current ? msAt(today.year, today.month, today.day, current.startMinute, zone) : null,
            endsAt: current ? msAt(today.year, today.month, today.day, current.endMinute, zone) : null,
            next: next ? lane(timetable, next.laneId) : null,
            nextAt
        };
    }

    /** The next moment the timetable changes (a period starts or ends), or null. */
    function nextBoundary(timetable, now, deviceZone = null) {
        const reading = at(timetable, now, deviceZone);
        const times = [reading.endsAt, reading.nextAt].filter(value => Number.isFinite(value) && value > Number(now));
        return times.length ? Math.min(...times) : null;
    }

    return Object.freeze({
        VERSION, BETWEEN_DEFAULT, BETWEEN_NONE, SNAP_MINUTES, DAY_MINUTES, DAYS, KNOWN,
        normalize, create, lane, periodsOf, hasPeriods, packIds, withPeriod, withoutPeriod, copyDay, withLane,
        at, nextBoundary, dayKeyAt, minuteOf, timeOf, snap, validZone
    });
}));
