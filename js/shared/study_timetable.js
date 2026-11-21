/* The study timetable (Android StudyTimetable, a614cc44e; docs/study/TIMETABLE_SPEC.md): the week in
 * periods, each pointing to a lane (one or more packs). "Mon 06:00-07:00 Maths, 07:00-08:00 GMAT".
 * Outside the periods the profile's default applies: its plan's packs (between "default") or the
 * normal rules (between "none"). Stored as `study.timetable`:
 *   {version, zone?, lanes: [{id, packIds, label?}], periods: {mon: [{start: "06:00", end: "07:00", lane}]},
 *    between, hideShortsAndComments, examDates?, setByParentId?}
 * Unknown keys at every level are kept. Pure, so the engine, the Study page and the tests share one
 * set of rules. Also "Add to my calendar": the timetable as an .ics of weekly repeating events
 * (Android StudyTimetableCalendar, b74369747). */
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

    // ---- The day bar and the week grid (Android StudyTimetableBarModel / StudyTimetableWeekModel) ----

    const WIDE_START = 6 * 60;
    const WIDE_END = 23 * 60;
    const MIN_RANGE_MINUTES = 6 * 60;
    function floorHour(minute) { return Math.min(DAY_MINUTES, Math.max(0, Math.floor(minute / 60) * 60)); }
    function ceilHour(minute) { return Math.min(DAY_MINUTES, Math.max(0, Math.floor((minute + 59) / 60) * 60)); }

    /**
     * The hours the day bar shows for periods ({startMinute, endMinute}) and the one being edited: an
     * hour before the first to an hour after the last, at least six hours, inside the day; empty, 3 pm
     * to 9 pm. wide: 6 am to 11 pm, grown to take in every period. {start, end} in minutes.
     */
    function barRange(periods, editing = null, wide = false) {
        const all = [...array(periods), ...(editing ? [editing] : [])];
        if (wide) {
            let start = WIDE_START;
            let end = WIDE_END;
            for (const item of all) { start = Math.min(start, floorHour(item.startMinute)); end = Math.max(end, ceilHour(item.endMinute)); }
            return { start, end };
        }
        if (!all.length) return { start: 15 * 60, end: 21 * 60 };
        let start = floorHour(Math.min(...all.map(item => item.startMinute)) - 60);
        let end = ceilHour(Math.max(...all.map(item => item.endMinute)) + 60);
        while (end - start < MIN_RANGE_MINUTES && (start > 0 || end < DAY_MINUTES)) {
            if (start > 0) start -= 60;
            if (end - start < MIN_RANGE_MINUTES && end < DAY_MINUTES) end += 60;
        }
        return { start, end };
    }

    /**
     * One edge of the period being edited dragged to minute (snapped to 15): it stays at least 15
     * minutes long and inside the day. Neighbours aren't pushed; Save trims any overlap (withPeriod).
     */
    function moveEdge(period, start, minute) {
        const target = Math.round(Number(minute) / SNAP_MINUTES) * SNAP_MINUTES;
        if (start) return { ...period, startMinute: Math.min(period.endMinute - SNAP_MINUTES, Math.max(0, target)) };
        return { ...period, endMinute: Math.min(DAY_MINUTES, Math.max(period.startMinute + SNAP_MINUTES, target)) };
    }

    /** The hours the week grid shows: 6 am to 11 pm, grown to take in every period of the week. */
    function weekRange(timetable) {
        return barRange(DAYS.flatMap(day => periodsOf(timetable, day)), null, true);
    }

    /**
     * A new period where an empty hour was clicked: from that hour, an hour long, trimmed to end where
     * the next period that day starts ({startMinute, endMinute}); null when the hour is taken.
     */
    function slot(timetable, day, minute) {
        const periods = periodsOf(timetable, day);
        const start = Math.floor(Number(minute) / 60) * 60;
        if (periods.some(item => start >= item.startMinute && start < item.endMinute)) return null;
        const later = periods.filter(item => item.startMinute > start).map(item => item.startMinute);
        const end = Math.min(start + 60, later.length ? Math.min(...later) : DAY_MINUTES, DAY_MINUTES);
        return end - start >= SNAP_MINUTES ? { startMinute: start, endMinute: end } : null;
    }

    /**
     * What fits inside a period's block: the lane's full name, else its initials ("Khan Academy" -> "KA",
     * up to three letters, a bracketed note left out; one word keeps its first three), else nothing;
     * never a cut-off "Khan…".
     * fits(text) says whether a text fits. The full name stays the spoken label.
     */
    function blockLabel(name, fits) {
        const value = String(name || '');
        if (fits(value)) return value;
        // A bracketed note ("Khan Academy (any curriculum)") is left out; each word gives its first letter or digit.
        const base = value.replace(/\s*\([^)]*\)/g, '').trim() || value;
        const words = base.split(/[\s+/,&-]+/).map(word => (word.match(/[\p{L}\p{N}]/u) || [''])[0]).filter(Boolean);
        const initials = words.length > 1 ? words.slice(0, 3).join('').toUpperCase() : Array.from(base).slice(0, 3).join('');
        return initials.trim() && fits(initials) ? initials : null;
    }

    // ---- Add to my calendar (Android StudyTimetableCalendar) ---------------------------------------

    const ICS_DAY = Object.freeze({ mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU' });

    /** RFC 5545 text escaping. */
    function escape(value) {
        return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    const encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;
    function octets(value) { return encoder ? encoder.encode(value).length : unescape(encodeURIComponent(value)).length; }

    /** Lines longer than 75 octets fold onto continuation lines that start with a space. */
    function fold(line) {
        if (octets(line) <= 75) return line;
        let out = '';
        let count = 0;
        let first = true;
        for (const ch of line) {
            const size = octets(ch);
            if (count + size > (first ? 75 : 74)) { out += '\r\n '; count = 0; first = false; }
            out += ch;
            count += size;
        }
        return out;
    }

    function stamp(year, month, day, minute) {
        const pad = (value, size = 2) => String(value).padStart(size, '0');
        return `${pad(year, 4)}${pad(month)}${pad(day)}T${pad(Math.floor(minute / 60))}${pad(minute % 60)}00`;
    }

    /**
     * The calendar text. Each period is a VEVENT starting on its next weekday from today ({year,
     * month, day}), repeating weekly, in the timetable's zone (TZID). laneName names a lane.
     */
    function ics(timetable, today, stampUtc, laneName, deviceZone = null) {
        const zone = zoneFor(timetable, deviceZone) || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FilterTube//Study timetable//EN', 'CALSCALE:GREGORIAN'];
        const base = plusDays(today.year, today.month, today.day, 0);
        DAYS.forEach((day, index) => {
            for (const period of periodsOf(timetable, day)) {
                const item = lane(timetable, period.laneId);
                if (!item) continue;
                const ahead = (index - DAYS.indexOf(base.dayKey) + 7) % 7;
                const date = plusDays(base.year, base.month, base.day, ahead);
                const end = period.endMinute >= DAY_MINUTES ? plusDays(date.year, date.month, date.day, 1) : date;
                lines.push('BEGIN:VEVENT',
                    `UID:filtertube-study-${day}-${period.startMinute}-${period.laneId}@filtertube.in`,
                    `DTSTAMP:${stampUtc}`,
                    `DTSTART;TZID=${zone}:${stamp(date.year, date.month, date.day, period.startMinute)}`,
                    `DTEND;TZID=${zone}:${stamp(end.year, end.month, end.day, period.endMinute % DAY_MINUTES)}`,
                    `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY[day]}`,
                    `SUMMARY:${escape(laneName(item))}`,
                    'END:VEVENT');
            }
        });
        lines.push('END:VCALENDAR');
        return lines.map(line => `${fold(line)}\r\n`).join('');
    }

    /** "20261118T000000Z" for ms. */
    function utcStamp(ms) {
        const date = new Date(ms);
        return `${stamp(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours() * 60 + date.getUTCMinutes())
            .slice(0, -2)}${String(date.getUTCSeconds()).padStart(2, '0')}Z`;
    }

    /** Today's date in the timetable's zone, for ics(). */
    function todayIn(timetable, now, deviceZone = null) {
        const parts = partsAt(Number(now), zoneFor(timetable, deviceZone));
        return { year: parts.year, month: parts.month, day: parts.day };
    }

    return Object.freeze({
        VERSION, BETWEEN_DEFAULT, BETWEEN_NONE, SNAP_MINUTES, DAY_MINUTES, DAYS, KNOWN,
        normalize, create, lane, periodsOf, hasPeriods, packIds, withPeriod, withoutPeriod, copyDay, withLane,
        at, nextBoundary, dayKeyAt, minuteOf, timeOf, snap, validZone,
        ics, escape, fold, utcStamp, todayIn,
        barRange, moveEdge, weekRange, slot, blockLabel
    });
}));
