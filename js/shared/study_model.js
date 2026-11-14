/* Study mode data model (version 1). One `study` object per profile, the same JSON the apps store.
 * Data and merge rules only: no timers are stored, every surface works the state out from the plan and the clock. */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = 1;
    // Advertised by a child device that understands the study, focus_lock and schedule scopes.
    const CAPABILITY = 'study.v1';
    const MANAGED_SCOPES = Object.freeze(['study', 'focus_lock', 'schedule']);
    // Allow-list rows a pack added carry managedListId "study:<packId>".
    const TAG_PREFIX = 'study:';
    const DEFAULT_FOCUS = Object.freeze({ roundMinutes: 25, breakMinutes: 5, dailyGoalMinutes: 60 });
    const FOCUS_LIMITS = Object.freeze({
        roundMinutes: [5, 180],
        breakMinutes: [0, 60],
        dailyGoalMinutes: [0, 1440]
    });
    const EDIT_LISTS = Object.freeze(['addChannels', 'removeChannels', 'addTopics', 'removeTopics']);
    const LOCK_MODES = Object.freeze(['gentle', 'locked']);
    const LIST_MODES = Object.freeze(['blocklist', 'whitelist']);
    // Breaks show the rest screen (no feed) by default, or normal videos with the break timer as a hard stop.
    const BREAK_MODES = Object.freeze(['rest', 'normal']);
    // Plan days are ISO weekdays, Monday = 1 ... Sunday = 7.
    const DAY_ALIASES = Object.freeze({ mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 });
    const KNOWN_FIELDS = Object.freeze(['version', 'packIds', 'edits', 'focus', 'plan', 'lock', 'savedListMode', 'progress', 'weekView', 'breakMode']);
    const MAX_PACKS = 64;
    const MAX_EDIT_ROWS = 2000;
    const MAX_DEVICES = 64;
    const MAX_DAYS_PER_DEVICE = 400;
    const forbidden = new Set(['__proto__', 'prototype', 'constructor']);

    function own(value, key) { return Object.prototype.hasOwnProperty.call(value, key); }
    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
    function safeKey(key) { return typeof key === 'string' && key.length > 0 && key.length <= 256 && !forbidden.has(key); }

    function packId(value) {
        const id = text(value);
        return id && id.length <= 128 && /^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(id) ? id : '';
    }

    function uniquePackIds(list) {
        const out = [];
        for (const value of array(list)) {
            const id = packId(value);
            if (id && !out.includes(id) && out.length < MAX_PACKS) out.push(id);
        }
        return out;
    }

    // Channels match on channelId first, then the handle (the pack catalog rule).
    function channelIdentity(entry) {
        if (typeof entry === 'string') {
            const value = text(entry);
            if (!value) return '';
            return /^UC[A-Za-z0-9_-]{22}$/.test(value) ? `id:${value}` : `handle:${value.replace(/^@/, '').toLowerCase()}`;
        }
        const item = object(entry);
        const id = text(item.channelId || item.id);
        if (id) return `id:${id}`;
        const handle = text(item.handle).replace(/^@/, '').toLowerCase();
        if (handle) return `handle:${handle}`;
        const name = text(item.name).toLowerCase();
        return name ? `name:${name}` : '';
    }

    function topicIdentity(entry) {
        const word = typeof entry === 'string' ? entry : object(entry).word;
        return text(word).replace(/\s+/g, ' ').toLowerCase();
    }

    function cleanChannel(entry) {
        if (typeof entry === 'string') return text(entry) || null;
        const item = object(entry);
        const out = {};
        for (const key of ['channelId', 'id', 'handle', 'name']) {
            const value = text(item[key]);
            if (value) out[key] = value;
        }
        return channelIdentity(out) ? out : null;
    }

    function cleanTopic(entry) {
        const word = topicIdentity(entry);
        return word ? word : null;
    }

    function mergeRows(base, incoming, identity, clean) {
        // Keyword-style union: one row per identity, the incoming row replaces the local one.
        const rows = new Map();
        for (const entry of [...array(base), ...array(incoming)]) {
            const row = clean(entry);
            const key = row === null ? '' : identity(row);
            if (!key) continue;
            if (rows.has(key)) rows.delete(key);
            if (rows.size < MAX_EDIT_ROWS) rows.set(key, row);
        }
        return Array.from(rows.values());
    }

    function normalizeEdit(value) {
        const edit = object(value);
        return {
            addChannels: mergeRows([], edit.addChannels, channelIdentity, cleanChannel),
            removeChannels: mergeRows([], edit.removeChannels, channelIdentity, cleanChannel),
            addTopics: mergeRows([], edit.addTopics, topicIdentity, cleanTopic),
            removeTopics: mergeRows([], edit.removeTopics, topicIdentity, cleanTopic)
        };
    }

    function normalizeEdits(value) {
        const out = {};
        for (const [key, edit] of Object.entries(object(value))) {
            const id = packId(key);
            if (!id || !isObject(edit)) continue;
            out[id] = normalizeEdit(edit);
        }
        return out;
    }

    function focusValue(key, value) {
        const [min, max] = FOCUS_LIMITS[key];
        return Number.isInteger(value) && value >= min && value <= max ? value : null;
    }

    function normalizeFocus(value, fallback = DEFAULT_FOCUS) {
        const focus = object(value);
        const base = object(fallback);
        const out = {};
        for (const key of Object.keys(FOCUS_LIMITS)) {
            out[key] = focusValue(key, focus[key]) ?? focusValue(key, base[key]) ?? DEFAULT_FOCUS[key];
        }
        return out;
    }

    function clockTime(value) {
        const match = /^(\d{2}):(\d{2})$/.exec(text(value));
        return match && Number(match[1]) <= 23 && Number(match[2]) <= 59 ? `${match[1]}:${match[2]}` : '';
    }

    function planDay(value) {
        if (Number.isInteger(value) && value >= 1 && value <= 7) return value;
        return DAY_ALIASES[text(value).slice(0, 3).toLowerCase()] || 0;
    }

    // "Set by" stays in the form the writer used: a string, or a small object of plain values.
    function normalizeSetBy(value) {
        if (typeof value === 'string') return text(value) || null;
        if (!isObject(value)) return null;
        const out = {};
        for (const key of ['kind', 'profileId', 'deviceId', 'name']) {
            const item = text(value[key]);
            if (item) out[key] = item.slice(0, 256);
        }
        return Object.keys(out).length ? out : null;
    }

    function setByProfileId(value) {
        if (typeof value === 'string') return text(value);
        return text(object(value).profileId);
    }

    // The parent profile that set a lock, when a parent did; a self-started lock has none.
    function parentOwnerId(value) {
        const setBy = object(value);
        return text(setBy.kind).toLowerCase() === 'parent' ? text(setBy.profileId) : '';
    }

    function normalizePlan(value) {
        if (!isObject(value)) return null;
        const days = Array.from(new Set(array(value.days).map(planDay).filter(Boolean))).sort((a, b) => a - b);
        const start = clockTime(value.start);
        const end = clockTime(value.end);
        if (!days.length || !start || !end || start === end) return null;
        return { days, start, end, setBy: normalizeSetBy(value.setBy) };
    }

    function normalizeLock(value) {
        if (!isObject(value)) return null;
        const ref = text(value.ref);
        if (!ref || ref.length > 256) return null;
        const mode = LOCK_MODES.includes(text(value.mode).toLowerCase()) ? text(value.mode).toLowerCase() : 'gentle';
        return { ref, mode, setBy: normalizeSetBy(value.setBy) };
    }

    function isDay(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    function minutes(value) {
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1440 ? value : null;
    }

    function normalizeProgress(value) {
        const out = {};
        let devices = 0;
        for (const [deviceId, days] of Object.entries(object(value))) {
            if (!safeKey(deviceId) || !isObject(days) || devices >= MAX_DEVICES) continue;
            const row = {};
            const keys = Object.keys(days).filter(isDay).sort().slice(-MAX_DAYS_PER_DEVICE);
            for (const day of keys) {
                const count = minutes(days[day]);
                if (count !== null) row[day] = count;
            }
            out[deviceId] = row;
            devices += 1;
        }
        return out;
    }

    /** Progress merges per device and per day by taking the larger value, never by adding. */
    function mergeProgress(local, incoming) {
        const out = normalizeProgress(local);
        for (const [deviceId, days] of Object.entries(normalizeProgress(incoming))) {
            if (!out[deviceId] && Object.keys(out).length >= MAX_DEVICES) continue;
            const row = { ...object(out[deviceId]) };
            for (const [day, count] of Object.entries(days)) row[day] = Math.max(row[day] ?? 0, count);
            out[deviceId] = normalizeProgress({ [deviceId]: row })[deviceId];
        }
        return out;
    }

    function breakMode(value) {
        const mode = text(value).toLowerCase();
        return BREAK_MODES.includes(mode) ? mode : null;
    }

    function listMode(value) {
        const mode = text(value).toLowerCase();
        return LIST_MODES.includes(mode) ? mode : null;
    }

    function extraFields(value) {
        // Fields a newer app wrote are kept so an older save doesn't drop them.
        const out = {};
        for (const [key, item] of Object.entries(object(value))) {
            if (!KNOWN_FIELDS.includes(key) && safeKey(key) && item !== undefined) out[key] = clone(item);
        }
        return out;
    }

    function createStudy(overrides = {}) {
        return normalizeStudy({ version: VERSION, ...object(overrides) });
    }

    /** Returns the canonical version-1 study object, or null when the value isn't one. */
    function normalizeStudy(value) {
        if (!isObject(value)) return null;
        const version = Number.isInteger(value.version) && value.version >= VERSION ? value.version : VERSION;
        return {
            ...extraFields(value),
            version,
            packIds: uniquePackIds(value.packIds),
            edits: normalizeEdits(value.edits),
            focus: normalizeFocus(value.focus),
            plan: normalizePlan(value.plan),
            lock: normalizeLock(value.lock),
            savedListMode: listMode(value.savedListMode),
            progress: normalizeProgress(value.progress),
            weekView: value.weekView === true,
            breakMode: breakMode(value.breakMode) || 'rest'
        };
    }

    function mergeEdit(local, incoming) {
        const base = normalizeEdit(local);
        const next = normalizeEdit(incoming);
        const channels = (adds, removes, nextAdds, nextRemoves) => {
            const addKeys = new Set(nextAdds.map(channelIdentity));
            const removeKeys = new Set(nextRemoves.map(channelIdentity));
            // An incoming add or remove of the same channel wins over the local opposite.
            return [
                mergeRows(adds.filter(row => !removeKeys.has(channelIdentity(row))), nextAdds, channelIdentity, cleanChannel),
                mergeRows(removes.filter(row => !addKeys.has(channelIdentity(row))), nextRemoves, channelIdentity, cleanChannel)
            ];
        };
        const topics = (adds, removes, nextAdds, nextRemoves) => {
            const addKeys = new Set(nextAdds.map(topicIdentity));
            const removeKeys = new Set(nextRemoves.map(topicIdentity));
            return [
                mergeRows(adds.filter(row => !removeKeys.has(topicIdentity(row))), nextAdds, topicIdentity, cleanTopic),
                mergeRows(removes.filter(row => !addKeys.has(topicIdentity(row))), nextRemoves, topicIdentity, cleanTopic)
            ];
        };
        const [addChannels, removeChannels] = channels(base.addChannels, base.removeChannels, next.addChannels, next.removeChannels);
        const [addTopics, removeTopics] = topics(base.addTopics, base.removeTopics, next.addTopics, next.removeTopics);
        return { addChannels, removeChannels, addTopics, removeTopics };
    }

    function mergeEdits(local, incoming) {
        const out = normalizeEdits(local);
        for (const [id, edit] of Object.entries(normalizeEdits(incoming))) {
            out[id] = out[id] ? mergeEdit(out[id], edit) : edit;
        }
        return out;
    }

    function isEmpty(value) {
        return !value.packIds.length && !Object.keys(value.edits).length && !value.plan && !value.lock
            && !Object.keys(value.progress).length;
    }

    /**
     * Merges an incoming study object (backup restore, Copy once, Merge, personal sync) into this profile's.
     * - packs and edits merge like keywords (union; the incoming row wins for the same identity);
     * - progress takes the larger value per device and per day;
     * - the lock is never copied: this device keeps its own, whatever the strategy (the same rule as the PIN);
     * - the saved list mode belongs to this device's running session, so a local value is kept.
     * With strategy "replace" the incoming packs, edits, focus, plan and week view replace the local ones.
     */
    function mergeStudy(local, incoming, { strategy = 'merge' } = {}) {
        const mine = normalizeStudy(local);
        const theirs = normalizeStudy(incoming);
        if (!theirs) {
            if (!mine || strategy !== 'replace') return mine;
            // A replace from data without a study object keeps only what is this device's own.
            const kept = createStudy({ progress: mine.progress, lock: mine.lock, savedListMode: mine.savedListMode });
            return kept.lock || kept.savedListMode || Object.keys(kept.progress).length ? kept : null;
        }
        if (!mine) return isEmpty(theirs) ? null : { ...theirs, lock: null };
        const replace = strategy === 'replace';
        const incomingFocus = object(object(incoming).focus);
        return {
            ...(replace ? {} : extraFields(mine)),
            ...extraFields(theirs),
            version: Math.max(mine.version, theirs.version),
            packIds: replace ? theirs.packIds : uniquePackIds([...mine.packIds, ...theirs.packIds]),
            edits: replace ? theirs.edits : mergeEdits(mine.edits, theirs.edits),
            focus: replace ? theirs.focus : normalizeFocus(incomingFocus, mine.focus),
            plan: replace ? theirs.plan : (theirs.plan || mine.plan),
            lock: mine.lock,
            savedListMode: mine.savedListMode || theirs.savedListMode,
            progress: mergeProgress(mine.progress, theirs.progress),
            weekView: own(object(incoming), 'weekView') && typeof incoming.weekView === 'boolean' ? incoming.weekView : mine.weekView,
            breakMode: replace ? theirs.breakMode : (breakMode(object(incoming).breakMode) || mine.breakMode)
        };
    }

    /** The study object as it may leave this device in a copy: never with the running lock. */
    function withoutLock(value) {
        const study = normalizeStudy(value);
        return study ? { ...study, lock: null } : null;
    }

    function studyTagPackId(value) {
        const tag = text(value);
        return tag.toLowerCase().startsWith(TAG_PREFIX) ? packId(tag.slice(TAG_PREFIX.length)) : '';
    }

    function profileTaggedRows(profile) {
        const main = object(object(profile).main);
        const kids = object(object(profile).kids);
        return [
            ...array(main.whitelistChannels), ...array(main.whitelistKeywords),
            ...array(kids.whitelistChannels), ...array(kids.whitelistKeywords)
        ];
    }

    /** Pack ids named by allow-list rows tagged managedListId "study:<packId>", in list order. */
    function packIdsFromTags(profile) {
        return uniquePackIds(profileTaggedRows(profile).map(row => studyTagPackId(object(row).managedListId)));
    }

    /**
     * The profile's study object. An older app that saved the profile dropped it; the pack ids then
     * come back from the study:<packId> tags on the allow-list rows. Null when there is neither.
     */
    function profileStudy(profile) {
        const stored = normalizeStudy(object(profile).study);
        if (stored) return stored;
        const packIds = packIdsFromTags(profile);
        return packIds.length ? createStudy({ packIds }) : null;
    }

    /** Returns the profile with `study` normalized or rebuilt; a profile with neither is returned as is. */
    function withProfileStudy(profile) {
        if (!isObject(profile)) return profile;
        const study = profileStudy(profile);
        if (!study) {
            if (!own(profile, 'study')) return profile;
            const { study: _dropped, ...rest } = profile;
            return rest;
        }
        return { ...profile, study };
    }

    function hasCapability(capabilities) {
        return array(capabilities).some(value => text(value) === CAPABILITY);
    }

    /** A child device receives study scopes only when its saved link says it advertised support. */
    function linkSupportsStudy(trustedLink) {
        const link = object(trustedLink);
        return hasCapability(link.capabilities) || hasCapability(object(link.policy).capabilities);
    }

    function isManagedScope(scope) {
        return MANAGED_SCOPES.includes(text(scope).toLowerCase());
    }

    /**
     * Study scopes ride on the parent's existing time grant, so no new entry joins the 3.6.1 permission
     * list (3.6.1 rejects unknown areas). An explicit grant of the scope itself also counts.
     */
    function managedScopeAllowed(scope, allowedScopes) {
        const name = text(scope).toLowerCase();
        if (!isManagedScope(name)) return false;
        const allowed = array(allowedScopes).map(value => text(value).toLowerCase());
        return allowed.includes(name) || allowed.includes('time_limits');
    }

    /** Payload a parent signs for one study scope. */
    function buildManagedPayload(scope, studyValue) {
        const name = text(scope).toLowerCase();
        const study = normalizeStudy(studyValue) || createStudy();
        if (name === 'study') {
            return { scope: 'study', replace: true, packIds: study.packIds, edits: study.edits, focus: study.focus,
                weekView: study.weekView, breakMode: study.breakMode };
        }
        if (name === 'schedule') return { scope: 'schedule', plan: study.plan };
        if (name === 'focus_lock') return { scope: 'focus_lock', lock: study.lock ? { ...study.lock, mode: 'locked' } : null };
        throw new Error('Unsupported study scope');
    }

    function validateManagedPayload(scope, payload) {
        const name = text(scope).toLowerCase();
        const root = object(payload);
        if (!isManagedScope(name) || text(root.scope).toLowerCase() !== name) return 'payload_scope_mismatch';
        if (name === 'study') {
            if (!Array.isArray(root.packIds) || uniquePackIds(root.packIds).length !== root.packIds.length) return 'invalid_study_payload';
            if (own(root, 'edits') && !isObject(root.edits)) return 'invalid_study_payload';
            if (own(root, 'focus') && !isObject(root.focus)) return 'invalid_study_payload';
            if (own(root, 'breakMode') && !breakMode(root.breakMode)) return 'invalid_study_payload';
            return '';
        }
        if (name === 'schedule') {
            if (!own(root, 'plan')) return 'invalid_schedule_payload';
            return root.plan === null || normalizePlan(root.plan) ? '' : 'invalid_schedule_payload';
        }
        if (!own(root, 'lock')) return 'invalid_focus_lock_payload';
        return root.lock === null || normalizeLock(root.lock) ? '' : 'invalid_focus_lock_payload';
    }

    /**
     * Applies one signed parent payload to the child's study object. The parent is the authority for
     * what it sent; progress and the saved list mode stay the child's. A lock set by one parent can only
     * be ended by that parent.
     */
    function applyManagedPayload(studyValue, scope, payload, source = {}) {
        const name = text(scope).toLowerCase();
        const reason = validateManagedPayload(name, payload);
        if (reason) throw new Error(reason);
        const study = normalizeStudy(studyValue) || createStudy();
        const root = object(payload);
        const parent = normalizeSetBy({
            kind: 'parent',
            profileId: text(object(source).sourceProfileId),
            deviceId: text(object(source).sourceDeviceId),
            name: text(object(source).sourceProfileName)
        });
        if (name === 'study') {
            return normalizeStudy({
                ...study,
                packIds: root.packIds,
                edits: own(root, 'edits') ? root.edits : study.edits,
                focus: own(root, 'focus') ? normalizeFocus(root.focus, study.focus) : study.focus,
                weekView: typeof root.weekView === 'boolean' ? root.weekView : study.weekView,
                breakMode: breakMode(root.breakMode) || study.breakMode
            });
        }
        if (name === 'schedule') {
            return normalizeStudy({ ...study, plan: root.plan === null ? null : { ...root.plan, setBy: parent || normalizeSetBy(root.plan.setBy) } });
        }
        const current = study.lock;
        const currentOwner = current ? parentOwnerId(current.setBy) : '';
        if (current && current.mode === 'locked' && currentOwner && currentOwner !== text(object(source).sourceProfileId)) {
            throw new Error('focus_lock_owned_by_another_parent');
        }
        return normalizeStudy({ ...study, lock: root.lock === null ? null : { ...root.lock, mode: 'locked', setBy: parent || normalizeSetBy(root.lock.setBy) } });
    }

    /**
     * Layered rules. A surface (profile.main or profile.kids) has a block list that always applies and an
     * optional allow list on top: "Only these" limits what can show and the block list still subtracts.
     * Stored data keeps its existing fields so every app can still read it:
     * - `mode: "whitelist"` now means "allow list on"; `mode: "blocklist"` means "allow list off";
     * - `layered: true` marks a surface saved with layered rules, where the block list also applies while
     *   the allow list is on. A whitelist surface without it is the old either/or mode, which maps to
     *   "allow list on, block list empty": its stored block rows stay kept, but dormant.
     * A study pack is one allow layer (rows tagged study:<packId>); its blocked words join the block list.
     */
    function ruleLayers(surfaceValue, { surface = 'main' } = {}) {
        const data = object(surfaceValue);
        const kids = surface === 'kids';
        const allowListOn = text(data.mode).toLowerCase() === 'whitelist';
        const layered = data.layered === true;
        const blockListApplies = !allowListOn || layered;
        const pick = (...keys) => { for (const key of keys) if (Array.isArray(data[key])) return data[key]; return []; };
        const block = {
            channels: kids ? pick('blockedChannels') : pick('channels', 'blockedChannels'),
            keywords: kids ? pick('blockedKeywords') : pick('keywords', 'blockedKeywords'),
            videoIds: kids ? pick('videoIds') : pick('videoIds', 'blockedVideoIds')
        };
        const allow = { channels: pick('whitelistChannels'), keywords: pick('whitelistKeywords'), videoIds: pick('allowedVideoIds') };
        return {
            allowListOn,
            layered,
            blockListApplies,
            stored: { block, allow },
            effective: {
                block: blockListApplies ? block : { channels: [], keywords: [], videoIds: [] },
                allow: allowListOn ? allow : { channels: [], keywords: [], videoIds: [] }
            }
        };
    }

    /** Marks a surface as saved with layered rules; the stored lists and mode are unchanged. */
    function withLayeredRules(surfaceValue) {
        return isObject(surfaceValue) ? { ...surfaceValue, layered: true } : surfaceValue;
    }

    /** Validates a study area value for personal sync; the lock never travels. Throws when invalid. */
    function validateForSync(value) {
        if (!isObject(value)) throw Error('invalid_personal_sync');
        for (const key of Object.keys(value)) if (forbidden.has(key)) throw Error('invalid_personal_sync');
        const study = normalizeStudy(value);
        if (!study || !Array.isArray(value.packIds)) throw Error('invalid_personal_sync');
        return { ...study, lock: null };
    }

    return Object.freeze({
        VERSION, CAPABILITY, MANAGED_SCOPES, TAG_PREFIX, DEFAULT_FOCUS, BREAK_MODES,
        ruleLayers, withLayeredRules,
        normalizeStudy, createStudy, mergeStudy, mergeProgress, mergeEdits, withoutLock,
        packIdsFromTags, profileStudy, withProfileStudy, studyTagPackId,
        channelIdentity, topicIdentity, setByProfileId,
        hasCapability, linkSupportsStudy, isManagedScope, managedScopeAllowed,
        buildManagedPayload, validateManagedPayload, applyManagedPayload, validateForSync
    });
}));
