/* Study mode data model (profile.study, version 1): the same JSON the Android app writes
 * (StudyModels.kt / StudyMerge.kt in FilterTubeApp). Data and merge rules only; no running timer is
 * stored, every surface works the state out from the plan, the lock and the clock.
 *
 * "study": {
 *   "version": 1,
 *   "activePackIds": ["in_upsc_cse"],
 *   "packEdits": {"in_upsc_cse": {"channelsAdded": [{"channelId", "handle", "name"}], "channelsRemoved": ["@handle-or-UC-id"],
 *                                 "topicsAdded": ["polity"], "topicsRemoved": ["vlog"]}},
 *   "focus": {"roundMinutes": 25, "breakMinutes": 5, "dailyGoalMinutes": 120},
 *   "plan": {"days": ["mon", "tue"], "start": "16:00", "end": "18:00", "setByParentId": null} | null,
 *   "lock": {"sessionId", "sessionKind": "hard_whitelist" | "self_control", "mode": "gentle" | "locked", "setByParentId": null} | null,
 *   "savedListMode": "blocklist" | "whitelist" | "layered" | null,
 *   "breakMode": "rest" | "normal",
 *   "progress": {"<deviceId>": {"2026-11-15": 45}},
 *   "weekView": true | false | null
 * }
 * Every key is always written; null means unset. Fields a newer app wrote are kept on each object. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = 1;
    const PROFILE_KEY = 'study';
    // Advertised in the Nanah hello by an app that applies the study, focus_lock and schedule scopes.
    const CAPABILITY = 'filtertube.study.v1';
    const MANAGED_SCOPES = Object.freeze(['study', 'focus_lock', 'schedule']);
    // Allow-list rows a pack added carry managedListId "study:<packId>".
    const TAG_PREFIX = 'study:';
    const BREAK_REST = 'rest';
    const BREAK_NORMAL = 'normal';
    const DEFAULT_FOCUS = Object.freeze({ roundMinutes: 25, breakMinutes: 5, dailyGoalMinutes: 120 });
    const FOCUS_LIMITS = Object.freeze({ roundMinutes: [5, 240], breakMinutes: [0, 120], dailyGoalMinutes: [0, 1440] });
    const DAYS = Object.freeze(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    const SESSION_KINDS = Object.freeze(['self_control', 'hard_whitelist']);
    const LOCK_MODES = Object.freeze(['gentle', 'locked']);
    // "layered": allow list on and the block list still applies (see ruleLayers).
    const SAVED_LIST_MODES = Object.freeze(['blocklist', 'whitelist', 'layered']);
    const MAX_PACKS = 64;
    const MAX_EDIT_ROWS = 500;
    const MAX_PROGRESS_DEVICES = 32;
    const MAX_PROGRESS_DAYS = 400;
    const MAX_DAY_MINUTES = 1440;
    const KNOWN = Object.freeze({
        study: ['version', 'activePackIds', 'packEdits', 'focus', 'plan', 'lock', 'savedListMode', 'breakMode', 'progress', 'weekView'],
        edits: ['channelsAdded', 'channelsRemoved', 'topicsAdded', 'topicsRemoved'],
        channel: ['channelId', 'handle', 'name'],
        focus: ['roundMinutes', 'breakMinutes', 'dailyGoalMinutes'],
        plan: ['days', 'start', 'end', 'setByParentId'],
        lock: ['sessionId', 'sessionKind', 'mode', 'setByParentId']
    });
    const PACK_ID = /^[A-Za-z0-9_.-]{1,64}$/;
    const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
    const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
    const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
    const forbidden = new Set(['__proto__', 'prototype', 'constructor']);

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
    function strings(value) { return array(value).map(text).filter(Boolean); }
    function nullableText(value) { return text(value) || null; }

    function extras(value, known) {
        const out = {};
        for (const [key, item] of Object.entries(object(value))) {
            if (!known.includes(key) && !forbidden.has(key) && item !== undefined) out[key] = clone(item);
        }
        return out;
    }

    function distinctBy(list, keyFn) {
        const seen = new Set();
        const out = [];
        for (const item of list) {
            const key = keyFn(item);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            out.push(item);
        }
        return out;
    }

    function isPackId(value) { return typeof value === 'string' && PACK_ID.test(value); }

    /** Same identity as a keyword word: trimmed, whitespace collapsed, lower-cased. */
    function topicKey(value) { return text(value).replace(/\s+/g, ' ').toLowerCase(); }

    /** "UC…" ids keep their case; handles compare without "@" and case. */
    function channelKey(value) {
        if (typeof value === 'string') {
            const item = text(value);
            if (!item) return '';
            return CHANNEL_ID.test(item) ? `id:${item}` : `h:${item.replace(/^@/, '').toLowerCase()}`;
        }
        const ref = object(value);
        const id = text(ref.channelId);
        if (id) return `id:${id}`;
        const handle = text(ref.handle);
        return handle ? `h:${handle.replace(/^@/, '').toLowerCase()}` : '';
    }

    function normalizeChannelRef(value) {
        if (!isObject(value)) return null;
        const channelId = text(value.channelId);
        const handle = text(value.handle);
        if (!channelId && !handle) return null;
        const name = text(value.name);
        return { ...extras(value, KNOWN.channel), ...(channelId ? { channelId } : {}), ...(handle ? { handle } : {}), ...(name ? { name } : {}) };
    }

    function normalizeEdits(value) {
        const edits = object(value);
        return {
            ...extras(edits, KNOWN.edits),
            channelsAdded: distinctBy(array(edits.channelsAdded).map(normalizeChannelRef).filter(Boolean), channelKey).slice(0, MAX_EDIT_ROWS),
            channelsRemoved: distinctBy(strings(edits.channelsRemoved), channelKey).slice(0, MAX_EDIT_ROWS),
            topicsAdded: distinctBy(strings(edits.topicsAdded), topicKey).slice(0, MAX_EDIT_ROWS),
            topicsRemoved: distinctBy(strings(edits.topicsRemoved), topicKey).slice(0, MAX_EDIT_ROWS)
        };
    }

    function normalizePackEdits(value) {
        const out = {};
        for (const [id, edits] of Object.entries(object(value))) {
            if (Object.keys(out).length >= MAX_PACKS) break;
            if (isPackId(id) && isObject(edits)) out[id] = normalizeEdits(edits);
        }
        return out;
    }

    function wholeMinutes(value) {
        return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : null;
    }

    function clamp(value, [min, max]) { return Math.min(max, Math.max(min, value)); }

    function normalizeFocus(value) {
        const focus = object(value);
        const out = extras(focus, KNOWN.focus);
        for (const key of KNOWN.focus) {
            const minutes = wholeMinutes(focus[key]);
            out[key] = clamp(minutes === null ? DEFAULT_FOCUS[key] : minutes, FOCUS_LIMITS[key]);
        }
        return out;
    }

    function normalizePlan(value) {
        if (!isObject(value)) return null;
        const start = text(value.start);
        const end = text(value.end);
        if (!TIME.test(start) || !TIME.test(end)) return null;
        const days = new Set(strings(value.days).map(day => day.toLowerCase()));
        return { ...extras(value, KNOWN.plan), days: DAYS.filter(day => days.has(day)), start, end, setByParentId: nullableText(value.setByParentId) };
    }

    function normalizeLock(value) {
        if (!isObject(value)) return null;
        const sessionId = text(value.sessionId);
        if (!sessionId) return null;
        const sessionKind = SESSION_KINDS.includes(text(value.sessionKind)) ? text(value.sessionKind) : 'hard_whitelist';
        const mode = LOCK_MODES.includes(text(value.mode)) ? text(value.mode) : 'locked';
        return { ...extras(value, KNOWN.lock), sessionId, sessionKind, mode, setByParentId: nullableText(value.setByParentId) };
    }

    /** Keeps the newest days, sorted, minutes within one day. */
    function clampDays(days) {
        const out = {};
        for (const day of Object.keys(days).sort().slice(-MAX_PROGRESS_DAYS)) out[day] = clamp(days[day], [0, MAX_DAY_MINUTES]);
        return out;
    }

    function normalizeProgress(value) {
        const out = {};
        for (const [rawDevice, days] of Object.entries(object(value))) {
            const device = text(rawDevice);
            if (!device || device.length > 128 || forbidden.has(device) || !isObject(days)) continue;
            if (Object.keys(out).length >= MAX_PROGRESS_DEVICES) break;
            const row = {};
            for (const [day, minutes] of Object.entries(days)) {
                const count = wholeMinutes(minutes);
                if (DAY_KEY.test(day) && count !== null) row[day] = count;
            }
            out[device] = clampDays(row);
        }
        return out;
    }

    function choice(value, allowed) {
        const item = text(value).toLowerCase();
        return allowed.includes(item) ? item : null;
    }

    /** The canonical version-1 study object with every key written, or null when the value isn't one. */
    function normalizeStudy(value) {
        if (!isObject(value)) return null;
        const version = Number.isInteger(value.version) && value.version >= VERSION ? value.version : VERSION;
        return {
            ...extras(value, KNOWN.study),
            version,
            activePackIds: distinctBy(strings(value.activePackIds).filter(isPackId), id => id).slice(0, MAX_PACKS),
            packEdits: normalizePackEdits(value.packEdits),
            focus: normalizeFocus(value.focus),
            plan: normalizePlan(value.plan),
            lock: normalizeLock(value.lock),
            savedListMode: choice(value.savedListMode, SAVED_LIST_MODES),
            breakMode: choice(value.breakMode, [BREAK_REST, BREAK_NORMAL]) || BREAK_REST,
            progress: normalizeProgress(value.progress),
            weekView: typeof value.weekView === 'boolean' ? value.weekView : null
        };
    }

    function createStudy(overrides = {}) {
        return normalizeStudy({ version: VERSION, ...object(overrides) });
    }

    /** weekView null means the profile-type default: on for accounts, off for child profiles. */
    function weekViewEnabled(study, profileType) {
        const value = object(study).weekView;
        return typeof value === 'boolean' ? value : text(profileType).toLowerCase() !== 'child';
    }

    function unionBy(base, next, keyFn) {
        // Keyword-style union: one row per identity, the incoming row replaces the local one in place.
        const seen = new Map();
        for (const item of [...base, ...next]) {
            const key = keyFn(item);
            if (key) seen.set(key, item);
        }
        return Array.from(seen.values()).slice(0, MAX_EDIT_ROWS);
    }

    function mergePackEdits(local, incoming) {
        const out = normalizePackEdits(local);
        for (const [id, next] of Object.entries(normalizePackEdits(incoming))) {
            const current = out[id];
            out[id] = !current ? next : {
                ...extras(current, KNOWN.edits),
                ...extras(next, KNOWN.edits),
                channelsAdded: unionBy(current.channelsAdded, next.channelsAdded, channelKey),
                channelsRemoved: unionBy(current.channelsRemoved, next.channelsRemoved, channelKey),
                topicsAdded: unionBy(current.topicsAdded, next.topicsAdded, topicKey),
                topicsRemoved: unionBy(current.topicsRemoved, next.topicsRemoved, topicKey)
            };
        }
        return Object.fromEntries(Object.entries(out).slice(0, MAX_PACKS));
    }

    /** Per device, per day: the larger number of minutes, never the sum. */
    function mergeProgress(local, incoming) {
        const mine = normalizeProgress(local);
        const theirs = normalizeProgress(incoming);
        const out = {};
        const devices = Array.from(new Set([...Object.keys(mine), ...Object.keys(theirs)])).slice(0, MAX_PROGRESS_DEVICES);
        for (const device of devices) {
            const days = { ...object(mine[device]) };
            for (const [day, minutes] of Object.entries(object(theirs[device]))) days[day] = Math.max(days[day] ?? 0, minutes);
            out[device] = clampDays(days);
        }
        return out;
    }

    /**
     * Merges an incoming study object into this profile's (Copy once, Merge, Move account, backup import,
     * personal sync). The same rules as Android's StudyMerge.merge:
     * - pack ids and pack edits merge like keywords; "replace" takes the incoming ones;
     * - progress takes the larger value per device and per day, whatever the strategy;
     * - the running lock is never copied: this device keeps its own (or none). Only Move account
     *   (carryLock) brings the other device's lock and saved list mode;
     * - a plan a parent set here, and its break mode, stay unless carryLock.
     */
    function mergeStudy(local, incoming, { strategy = 'merge', carryLock = false, now = Date.now() } = {}) {
        const mine = normalizeStudy(local);
        const theirs = normalizeStudy(incoming);
        if (!theirs) return mine;
        if (!mine) return carryLock ? theirs : { ...theirs, lock: null };
        const merged = mergeStudyValues(mine, theirs, { strategy, carryLock });
        // A parent's lock or plan holds this profile (audit M4): an ordinary sync or Merge may only
        // tighten study. A loosening change waits; this device keeps its study, plus the peer's progress.
        if (!carryLock && !tightenAllowed(mine, merged, { now })) return { ...mine, progress: mergeProgress(mine.progress, theirs.progress) };
        return merged;
    }

    function mergeStudyValues(mine, theirs, { strategy, carryLock }) {
        const replace = strategy === 'replace';
        const parentPlan = !!(mine.plan && mine.plan.setByParentId) && !carryLock;
        return {
            ...extras(mine, KNOWN.study),
            ...extras(theirs, KNOWN.study),
            version: Math.max(mine.version, theirs.version),
            activePackIds: replace ? theirs.activePackIds
                : Array.from(new Set([...mine.activePackIds, ...theirs.activePackIds])).slice(0, MAX_PACKS),
            packEdits: replace ? theirs.packEdits : mergePackEdits(mine.packEdits, theirs.packEdits),
            focus: theirs.focus,
            plan: parentPlan ? mine.plan : (replace ? theirs.plan : (theirs.plan || mine.plan)),
            lock: carryLock ? theirs.lock : mine.lock,
            savedListMode: carryLock ? (theirs.savedListMode || mine.savedListMode) : (mine.savedListMode || theirs.savedListMode),
            breakMode: parentPlan ? mine.breakMode : theirs.breakMode,
            progress: mergeProgress(mine.progress, theirs.progress),
            weekView: theirs.weekView ?? mine.weekView
        };
    }

    /** A parent's lock: set by a parent with a window ({startsAt, endsAt}). */
    function isParentLock(lock) {
        const value = object(lock);
        return !!text(value.setByParentId) && Number.isFinite(Number(value.startsAt)) && Number.isFinite(Number(value.endsAt));
    }

    function minuteOf(value) {
        const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text(value));
        return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    }

    /** Music while studying: unset is on for a person's own plan and off for a parent's. */
    function musicAllowed(plan) {
        const value = object(plan);
        return typeof value.music === 'boolean' ? value.music : !text(value.setByParentId);
    }

    function planTighter(before, after) {
        if (!isObject(after)) return false;
        if (text(after.setByParentId) !== text(before.setByParentId)) return false;
        // Moving the plan to another zone moves its window.
        if (text(before.zone) && text(after.zone) !== text(before.zone)) return false;
        const days = new Set(array(after.days));
        if (!array(before.days).every(day => days.has(day))) return false;
        const bs = minuteOf(before.start); const be = minuteOf(before.end);
        const s = minuteOf(after.start); const e = minuteOf(after.end);
        if ([bs, be, s, e].some(value => value === null)) return false;
        // Overnight plans: compare only the same shape.
        if ((be <= bs) !== (e <= s)) return after.start === before.start && after.end === before.end;
        if (s > bs || e < be) return false;
        const beforeLimit = minuteOf(before.limit);
        const afterLimit = minuteOf(after.limit);
        if (beforeLimit !== null && (afterLimit === null || afterLimit > beforeLimit)) return false;
        if (!musicAllowed(before) && musicAllowed(after)) return false;
        return true;
    }

    function editsTighter(before, after) {
        const prevAll = object(before);
        const nextAll = object(after);
        const keys = list => new Set(array(list).map(channelKey));
        const words = list => new Set(array(list).map(topicKey));
        for (const [packId, nextValue] of Object.entries(nextAll)) {
            const prev = object(prevAll[packId]);
            const next = object(nextValue);
            const addedBefore = keys(prev.channelsAdded);
            const topicsBefore = words(prev.topicsAdded);
            if (!array(next.channelsAdded).every(row => addedBefore.has(channelKey(row)))) return false;
            if (!array(next.topicsAdded).every(word => topicsBefore.has(topicKey(word)))) return false;
            const removedNow = keys(next.channelsRemoved);
            if (!array(prev.channelsRemoved).every(row => removedNow.has(channelKey(row)))) return false;
            const removedTopicsNow = words(next.topicsRemoved);
            if (!array(prev.topicsRemoved).every(word => removedTopicsNow.has(topicKey(word)))) return false;
        }
        // Dropping a pack's edits would bring back channels it removed.
        return Object.keys(prevAll).every(packId => Object.prototype.hasOwnProperty.call(nextAll, packId)
            || (!array(object(prevAll[packId]).channelsRemoved).length && !array(object(prevAll[packId]).topicsRemoved).length));
    }

    /**
     * Android StudyTighten.allowed: while a parent's plan or lock holds `before`, a write by anyone other
     * than that parent may only tighten study. `lockActive(lock)` defaults to "a parent's lock that
     * hasn't reached its end".
     */
    function tightenAllowed(beforeValue, afterValue, { now = Date.now(), lockActive = null } = {}) {
        const before = normalizeStudy(beforeValue);
        if (!before) return true;
        const parentPlan = !!text(object(before.plan).setByParentId);
        const parentLock = typeof lockActive === 'function'
            ? lockActive(before.lock) === true
            : isParentLock(before.lock) && now < Number(before.lock.endsAt);
        if (!parentPlan && !parentLock) return true;
        const after = normalizeStudy(afterValue);
        if (!after) return false;
        if (parentLock) {
            const a = after.lock;
            const b = before.lock;
            if (!a || a.sessionId !== b.sessionId || a.setByParentId !== b.setByParentId || text(a.scope) !== text(b.scope)) return false;
            if (!(Number(a.startsAt) <= Number(b.startsAt)) || !(Number(a.endsAt) >= Number(b.endsAt))) return false;
        }
        if (parentPlan && !planTighter(before.plan, after.plan)) return false;
        const packs = new Set(before.activePackIds);
        if (!after.activePackIds.every(id => packs.has(id))) return false;
        if (!editsTighter(before.packEdits, after.packEdits)) return false;
        if (before.breakMode === BREAK_REST && after.breakMode !== BREAK_REST) return false;
        if (before.packChannelsOnly !== false && after.packChannelsOnly === false) return false;
        if (after.focus.roundMinutes < before.focus.roundMinutes || after.focus.breakMinutes > before.focus.breakMinutes) return false;
        return true;
    }

    /** The study object as Copy once / Merge send it: never with the running lock. */
    function withoutLock(value) {
        const study = normalizeStudy(value);
        return study ? { ...study, lock: null } : null;
    }

    function packIdOfTag(value) {
        const tag = text(value);
        if (!tag.startsWith(TAG_PREFIX)) return '';
        const id = tag.slice(TAG_PREFIX.length);
        return isPackId(id) ? id : '';
    }

    /** Pack ids in first-seen order across Main then Kids allow-list rows tagged "study:<packId>". */
    function packIdsFromTags(profile) {
        const main = object(object(profile).main);
        const kids = object(object(profile).kids);
        const rows = [...array(main.whitelistChannels), ...array(main.whitelistKeywords),
            ...array(kids.whitelistChannels), ...array(kids.whitelistKeywords)];
        return distinctBy(rows.map(row => packIdOfTag(object(row).managedListId)), id => id).slice(0, MAX_PACKS);
    }

    /**
     * The profile's study state, rebuilt from study:<packId> tags when an older app dropped it. Like
     * Android's effectiveStudy(), the rebuilt value isn't written back until something saves study, so
     * the stored bytes of an untouched profile don't change. Null when there is neither.
     */
    function profileStudy(profile) {
        const stored = normalizeStudy(object(profile)[PROFILE_KEY]);
        if (stored) return stored;
        const activePackIds = packIdsFromTags(profile);
        return activePackIds.length ? createStudy({ activePackIds }) : null;
    }

    /**
     * Layered rules. A surface (profile.main or profile.kids) has a block list that always applies and an
     * optional allow list on top: "Only these" limits what can show and the block list still subtracts.
     * Stored as the existing `mode` plus `layered: true`, written only when on, so every app still reads
     * the mode it knows:
     * - mode "blocklist" -> block only;
     * - mode "whitelist" without `layered` (all data before 3.6.2) -> allow only: allow list on and the
     *   block list ignored, exactly as before (its rows are kept, not deleted);
     * - mode "whitelist" with `layered: true` -> allow and block. An older app reads it as plain whitelist.
     * `layering` is the value study.savedListMode stores.
     */
    function ruleLayers(surfaceValue, { surface = 'main' } = {}) {
        const data = object(surfaceValue);
        const kids = surface === 'kids';
        const allowListOn = text(data.mode).toLowerCase() === 'whitelist';
        const layering = !allowListOn ? 'blocklist' : (data.layered === true ? 'layered' : 'whitelist');
        const blockListApplies = layering !== 'whitelist';
        const pick = (...keys) => { for (const key of keys) if (Array.isArray(data[key])) return data[key]; return []; };
        const block = {
            channels: kids ? pick('blockedChannels') : pick('channels', 'blockedChannels'),
            keywords: kids ? pick('blockedKeywords') : pick('keywords', 'blockedKeywords'),
            videoIds: kids ? pick('videoIds') : pick('videoIds', 'blockedVideoIds')
        };
        const allow = { channels: pick('whitelistChannels'), keywords: pick('whitelistKeywords'), videoIds: pick('allowedVideoIds') };
        const none = { channels: [], keywords: [], videoIds: [] };
        return {
            layering, allowListOn, blockListApplies,
            stored: { block, allow },
            effective: { block: blockListApplies ? block : none, allow: allowListOn ? allow : none }
        };
    }

    /** Sets a surface's layering ("blocklist" | "whitelist" | "layered"); the stored lists are unchanged. */
    function withRuleLayering(surfaceValue, layering) {
        if (!isObject(surfaceValue)) return surfaceValue;
        const value = choice(layering, SAVED_LIST_MODES);
        if (!value) throw new Error('Unknown rule layering');
        const { layered: _layered, ...rest } = surfaceValue;
        return { ...rest, mode: value === 'blocklist' ? 'blocklist' : 'whitelist', ...(value === 'layered' ? { layered: true } : {}) };
    }

    /** Validates a study value received over personal sync; the lock never travels. Throws when invalid. */
    function validateForSync(value) {
        if (value === null) return null;
        if (!isObject(value) || !Array.isArray(value.activePackIds)) throw Error('invalid_personal_sync');
        for (const key of Object.keys(value)) if (forbidden.has(key)) throw Error('invalid_personal_sync');
        return { ...normalizeStudy(value), lock: null };
    }

    return Object.freeze({
        VERSION, PROFILE_KEY, CAPABILITY, MANAGED_SCOPES, TAG_PREFIX, DEFAULT_FOCUS, FOCUS_LIMITS, DAYS,
        BREAK_REST, BREAK_NORMAL, SAVED_LIST_MODES,
        normalizeStudy, createStudy, weekViewEnabled, mergeStudy, mergeProgress, mergePackEdits, withoutLock,
        tightenAllowed, isParentLock, musicAllowed,
        channelKey, topicKey, isPackId, packIdOfTag, packIdsFromTags, profileStudy,
        ruleLayers, withRuleLayering, validateForSync
    });
}));
