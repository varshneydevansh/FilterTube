/* Study mode in the background worker (3.6.2, Phase 2).
 *
 * The background compiler asks this controller for the profile the filters use right now
 * (study_engine.studyEffectiveProfile), so Study is applied at compile time and nothing in the
 * stored profile flips. An alarm fires at every transition the clock reports (round end, break end,
 * session end, limit) and the worker recompiles and pushes the new settings to YouTube tabs, so
 * switching never needs a reload.
 *
 * Device-local runtime (ftStudyRuntimeV1, never synced or backed up, like a running lock):
 *   { version: 1,
 *     profiles: { <profileId>: { session: {sessionId, startedAt, endsAt, lockMode} | null,
 *                                endRequestedAt, endedUntil, breakSkippedUntil } },
 *     seconds: { <profileId>: { <yyyy-mm-dd>: seconds } },   // live study time on this device
 *     lastCreditAt }
 * Live seconds fold into profile.study.progress[deviceId][date] (whole minutes, larger value wins)
 * when a session ends and no Self-Control lock holds the profile.
 *
 * The clock guard (ftStudyClockV1, device-local; study_clock_guard.js, Android StudyClockGuard):
 *   { anchor, meter, lockSeen: {<lockSessionId>: {meterAt, credit}}, notes: {<profileId>: [...]},
 *     holdSince: {<profileId>: ms}, network: {at, time} }
 * A parent's lock {startsAt, endsAt, scope, setByParentId} runs study rounds (scope "session", the
 * default) until both clocks and its running time say it ended. A time or zone change during a lock
 * or a parent's plan holds the session at rest (LIMIT, clockHold) instead of ending it.
 *
 * The UI (popup and options, Phase 5) talks to it through runtime messages; see handleMessage().
 */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyBackground = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const RUNTIME_KEY = 'ftStudyRuntimeV1';
    const DEVICE_KEY = 'ftStudyDeviceIdV1';
    const NANAH_DEVICE_KEY = 'ftNanahDeviceId';
    const PROFILES_KEY = 'ftProfilesV4';
    const ALARM = 'ftStudyTransition';
    const CLOCK_KEY = 'ftStudyClockV1';
    const MAX_TICK_SECONDS = 60;
    const MAX_SESSION_MINUTES = 24 * 60;

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function array(value) { return Array.isArray(value) ? value : []; }
    function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

    function emptyRuntime() { return { version: 1, profiles: {}, seconds: {}, lastCreditAt: 0 }; }

    function normalizeRuntime(value) {
        const raw = object(value);
        return {
            version: 1,
            profiles: object(clone(raw.profiles)),
            seconds: object(clone(raw.seconds)),
            lastCreditAt: Number.isFinite(raw.lastCreditAt) ? raw.lastCreditAt : 0
        };
    }

    function profileRuntime(runtime, profileId) {
        const value = object(runtime.profiles[profileId]);
        return {
            session: isObject(value.session) ? value.session : null,
            endRequestedAt: Number.isFinite(value.endRequestedAt) ? value.endRequestedAt : null,
            endedUntil: Number.isFinite(value.endedUntil) ? value.endedUntil : null,
            breakSkippedUntil: Number.isFinite(value.breakSkippedUntil) ? value.breakSkippedUntil : null
        };
    }

    /**
     * deps: { browserAPI, Engine, Model, Packs, now?, getSelfControlSession(), startLockedSession(args),
     *         writeProfile(profileId, profile) (refused while a lock holds), onTransition(reason) }
     */
    function createStudyBackground(deps) {
        const api = deps.browserAPI;
        const Engine = deps.Engine || root.FilterTubeStudyEngine;
        const Model = deps.Model || root.FilterTubeStudyModel;
        const Packs = deps.Packs || root.FilterTubeStudyPacks;
        const Guard = deps.Guard || root.FilterTubeStudyClockGuard
            || (typeof module === 'object' && module.exports && typeof require === 'function' ? require('./shared/study_clock_guard.js') : null);
        const now = () => (typeof deps.now === 'function' ? deps.now() : Date.now());
        // A monotonic clock and the worker instance it belongs to. With an injected `now` and no
        // monotonic clock (tests), the guard sees no jumps.
        const monotonic = typeof deps.monotonic === 'function' ? deps.monotonic
            : (typeof deps.now === 'function' ? () => ({ mono: now(), bootId: 'injected' })
                : () => ({ mono: root.performance?.now?.() ?? Date.now(), bootId: String(Math.round(root.performance?.timeOrigin || 0)) }));
        const zoneId = typeof deps.zoneId === 'function' ? deps.zoneId : () => (Guard ? Guard.deviceZoneId() : 'UTC');
        let catalogPromise = null;

        function storageGet(keys) {
            return new Promise(resolve => api.storage.local.get(keys, items => resolve(items || {})));
        }

        function storageSet(items) {
            return new Promise(resolve => api.storage.local.set(items, () => resolve()));
        }

        function loadCatalog() {
            if (!catalogPromise) {
                catalogPromise = Promise.resolve(deps.loadCatalog ? deps.loadCatalog() : Packs.load())
                    .catch(error => { catalogPromise = null; console.warn('FilterTube Study: pack catalog unavailable', error); return { packs: [] }; });
            }
            return catalogPromise;
        }

        async function deviceId() {
            const stored = await storageGet([DEVICE_KEY, NANAH_DEVICE_KEY]);
            const existing = text(stored[NANAH_DEVICE_KEY]) || text(stored[DEVICE_KEY]);
            if (existing) return existing;
            const id = `ext-${now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
            await storageSet({ [DEVICE_KEY]: id });
            return id;
        }

        async function readAll() {
            const items = await storageGet([PROFILES_KEY, RUNTIME_KEY]);
            const profiles = object(items[PROFILES_KEY]);
            const profileId = text(profiles.activeProfileId) || 'default';
            const profile = object(object(profiles.profiles)[profileId]);
            return { profiles, profileId, profile, runtime: normalizeRuntime(items[RUNTIME_KEY]) };
        }

        function emptyClockStore() { return { anchor: null, meter: null, lockSeen: {}, notes: {}, holdSince: {}, network: null }; }

        function normalizeClockStore(value) {
            const raw = object(value);
            return { ...emptyClockStore(), ...clone(raw), lockSeen: object(clone(raw.lockSeen)), notes: object(clone(raw.notes)), holdSince: object(clone(raw.holdSince)) };
        }

        /** A lock or a parent's plan exists: a clock change is held, not accepted. */
        function clockSensitive(study, local) {
            if (!study) return false;
            if (text(object(study.plan).setByParentId) || (Guard && Guard.isParentLock(study.lock))) return true;
            return local?.session?.lockMode === 'locked' || text(object(study.lock).mode) === 'locked';
        }

        function guardFor(study, reading, clockStore) {
            const lock = study?.lock;
            if (!Guard || !Guard.isParentLock(lock)) return { lock: { active: false, ended: false, remainingMs: 0 }, window: null };
            const state = Guard.parentLockState(lock, reading, {
                seen: object(clockStore?.lockSeen)[text(lock.sessionId)] || null,
                meter: clockStore?.meter || null,
                networkTime: Number.isFinite(clockStore?.networkNow) ? clockStore.networkNow : null
            });
            if (!state.active || text(lock.scope) === 'plan') return { lock: state, window: null };
            const startsAt = Number(lock.startsAt);
            const endsAt = Number(lock.endsAt);
            // Past its end on the wall clock, a lock runs on until its running time is used up.
            const at = reading.wall;
            const end = at >= endsAt ? at + Math.min(Math.max(state.remainingMs, 60 * 1000), Engine.PARENT_LOCK_MAX_MINUTES * 60 * 1000) : endsAt;
            return { lock: state, window: { startsAt, endsAt: end, setByParentId: lock.setByParentId } };
        }

        /** True while a lock or a parent's plan holds now, by either clock. */
        function clockInForce(study, local, reading, guarded) {
            if (guarded.lock.active) return true;
            const plan = object(study?.plan);
            if (text(plan.setByParentId)) {
                for (const time of [reading.wall, reading.trusted]) {
                    const clock = Engine.studyClock({ plan: study.plan, focus: study.focus, breakMode: study.breakMode, now: time });
                    if (clock.studying || clock.state === Engine.LIMIT) return true;
                }
            }
            const session = local?.session;
            if (session?.lockMode === 'locked') {
                for (const time of [reading.wall, reading.trusted]) if (time >= session.startedAt && time < session.endsAt) return true;
            }
            return false;
        }

        /** The clock for one profile, from its study plan, this device's runtime and the clock guard. */
        function clockFor(profile, runtime, profileId, at = now(), options = {}) {
            const study = Model.profileStudy(profile);
            const local = profileRuntime(runtime, profileId);
            if (!study) return { study: null, local, clock: Engine.studyClock({ plan: null, now: at }), reading: null };
            const reading = options.reading || (Guard ? Guard.wallOnly(at, zoneId()) : null);
            const guarded = reading ? guardFor(study, reading, options.clockStore) : { lock: { active: false }, window: null };
            const clockHold = !!reading && reading.changed && clockInForce(study, local, reading, guarded);
            const clock = Engine.studyClock({
                plan: study.plan, focus: study.focus, breakMode: study.breakMode, now: at,
                session: local.session, endedUntil: local.endedUntil, limitReached: options.limitReached === true,
                parentLock: guarded.window, clockHold
            });
            if (clock.state === Engine.BREAK && Number.isFinite(local.breakSkippedUntil) && at < local.breakSkippedUntil) clock.breakSkipped = true;
            return { study, local, clock, reading, parentLock: guarded.lock };
        }

        /**
         * Reads both clocks for the active profile, advances the lock meter, notes a hold for the parent
         * and stores the guard state. A network time is read when a jump is suspected (or a new worker
         * started) while a lock or a parent's plan exists, at most every 10 minutes.
         */
        async function readClock() {
            if (!Guard) return { reading: null, clockStore: emptyClockStore() };
            const [items, { profileId, profile, runtime }] = await Promise.all([storageGet([CLOCK_KEY]), readAll()]);
            const clockStore = normalizeClockStore(items[CLOCK_KEY]);
            const study = Model.profileStudy(profile);
            const local = profileRuntime(runtime, profileId);
            const sensitive = clockSensitive(study, local);
            const wall = now();
            const { mono, bootId } = monotonic();
            let result = Guard.read(clockStore.anchor, { wall, mono, bootId, zoneId: zoneId(), sensitive });
            const network = object(clockStore.network);
            const networkStale = !Number.isFinite(network.at) || Math.abs(wall - network.at) > Guard.NETWORK_RECHECK_MS;
            if (sensitive && (result.reading.changed || result.newBoot) && networkStale && typeof deps.networkTime === 'function') {
                const time = await Promise.resolve(deps.networkTime()).catch(() => null);
                clockStore.network = { at: wall, time: Number.isFinite(time) ? time : null };
                if (Number.isFinite(time)) {
                    clockStore.networkNow = time;
                    result = Guard.read(clockStore.anchor, { wall, mono, bootId, zoneId: zoneId(), sensitive, networkTime: time });
                }
            } else if (Number.isFinite(network.time) && Number.isFinite(network.at)) {
                // The last network time, carried forward by the wall clock only while the wall clock agrees.
                const carried = network.time + (wall - network.at);
                if (!result.reading.changed && Math.abs(carried - wall) <= Guard.TOLERANCE_MS) clockStore.networkNow = carried;
                else delete clockStore.networkNow;
            }
            clockStore.anchor = result.anchor;
            clockStore.meter = Guard.advanceMeter(clockStore.meter, { mono, bootId, wall });
            const lock = study?.lock;
            if (Guard.isParentLock(lock) && !clockStore.lockSeen[text(lock.sessionId)]) {
                clockStore.lockSeen[text(lock.sessionId)] = Guard.firstSight(lock, clockStore.meter, result.reading.lockNow);
            }
            const guarded = study ? guardFor(study, result.reading, clockStore) : { lock: { active: false }, window: null };
            const held = !!study && result.reading.changed && clockInForce(study, local, result.reading, guarded);
            if (held && !Number.isFinite(clockStore.holdSince[profileId])) {
                clockStore.holdSince[profileId] = wall;
                clockStore.notes[profileId] = Guard.addNote(clockStore.notes[profileId], result.reading, wall);
            } else if (!held) {
                delete clockStore.holdSince[profileId];
            }
            await storageSet({ [CLOCK_KEY]: clockStore });
            return { reading: result.reading, clockStore };
        }

        /** When a lock ends, for "Locked until ...": a parent's lock or plan, or a self Locked session. */
        function lockedUntil(study, local, clock) {
            if (clock.setByParentId) return clock.source === 'parent_lock' ? Number(object(study?.lock).endsAt) || clock.sessionEnd : clock.sessionEnd;
            if (local.session?.lockMode === 'locked' && clock.source === 'session') return local.session.endsAt;
            return null;
        }

        function publicState(study, local, clock, packIds, at, applied = {}) {
            const breakSkipped = clock.state === Engine.BREAK && Number.isFinite(local.breakSkippedUntil) && at < local.breakSkippedUntil;
            let policy = study ? Engine.endPolicy(study) : { canEnd: false, reason: 'no_study' };
            if (clock.setByParentId) policy = { canEnd: false, reason: 'set_by_parent' };
            else if (local.session?.lockMode === 'locked') policy = { canEnd: false, reason: 'locked' };
            const transitions = [clock.next?.at, local.endRequestedAt ? local.endRequestedAt + Engine.GENTLE_END_PAUSE_MS : null,
                clock.clockHold || clock.source === 'parent_lock' ? at + 60 * 1000 : null]
                .filter(value => Number.isFinite(value) && value > at);
            // Kids during a study round: "learning" (a Kids pack is active) or "study_time" (it holds).
            const kidsSpace = applied.kidsSpace || 'untouched';
            const kidsOpens = kidsSpace === 'study_time' && Engine.kidsOpensAt ? Engine.kidsOpensAt(clock) : null;
            return {
                state: clock.state,
                kidsSpace,
                kidsOpensAt: kidsOpens ? kidsOpens.at : null,
                kidsOpensAtBreak: kidsOpens ? kidsOpens.atBreak : false,
                round: clock.round,
                rounds: clock.rounds,
                until: clock.until,
                sessionStart: clock.sessionStart,
                sessionEnd: clock.sessionEnd,
                source: clock.source,
                breakMode: clock.breakMode,
                breakNoticeAt: clock.breakNoticeAt,
                breakSkipped,
                canSkipBreak: !!study && Engine.selfStarted(study) && !clock.setByParentId && clock.state === Engine.BREAK,
                next: clock.next,
                packIds,
                phase: applied.phase || 'normal',
                failClosed: applied.failClosed === true,
                setByParentId: clock.setByParentId || null,
                clockHold: clock.clockHold === true,
                lockedUntil: lockedUntil(study, local, clock),
                lockMode: clock.setByParentId ? 'locked' : (local.session?.lockMode || null),
                endPolicy: policy,
                endRequestedAt: local.endRequestedAt,
                validUntil: transitions.length ? Math.min(...transitions) : null
            };
        }

        /** Loaded once per compile: the catalog and this device's runtime. */
        async function prepare() {
            const [catalog, guard] = await Promise.all([loadCatalog(), readClock()]);
            const items = await storageGet([RUNTIME_KEY]);
            return { catalog, runtime: normalizeRuntime(items[RUNTIME_KEY]), now: now(), reading: guard.reading, clockStore: guard.clockStore };
        }

        /**
         * Synchronous, for the compiler: the profile the filters use and the public study state.
         * Returns {profile, applied, state}.
         */
        function apply(profileId, profile, prepared, options = {}) {
            const at = prepared?.now ?? now();
            const { study, local, clock } = clockFor(profile, prepared?.runtime || emptyRuntime(), profileId, at,
                { ...options, reading: prepared?.reading, clockStore: prepared?.clockStore });
            if (!study) return { profile, applied: false, state: null };
            const result = Engine.studyEffectiveProfile(profile, { catalog: prepared?.catalog, clock, study });
            return { profile: result.profile, applied: result.applied, state: publicState(study, local, clock, result.packIds, at, result) };
        }

        async function writeRuntime(runtime) {
            await storageSet({ [RUNTIME_KEY]: runtime });
        }

        async function updateProfileStudy(profileId, mutate) {
            const { profiles } = await readAll();
            const profile = object(object(profiles.profiles)[profileId]);
            if (!Object.keys(profile).length) return { ok: false, error: 'profile_unavailable' };
            const current = Model.profileStudy(profile) || Model.createStudy();
            // Keep a copy of each active pack inside study, so a catalog change can't drop it (audit H3).
            const catalog = await loadCatalog();
            const next = Model.normalizeStudy(Engine.stampPackCopies(mutate(clone(current)), catalog));
            return deps.writeProfile(profileId, { ...profile, study: next });
        }

        /** Live seconds -> whole minutes in profile.study.progress for this device (larger value wins). */
        async function foldProgress() {
            const session = await deps.getSelfControlSession?.();
            if (session) return { ok: false, error: 'locked' };
            const [{ profiles, runtime }, device] = await Promise.all([readAll(), deviceId()]);
            let wrote = false;
            for (const [profileId, days] of Object.entries(runtime.seconds)) {
                const profile = object(object(profiles.profiles)[profileId]);
                const study = Model.profileStudy(profile);
                if (!study) continue;
                const incoming = { [device]: {} };
                for (const [date, seconds] of Object.entries(object(days))) incoming[device][date] = Math.floor(seconds / 60);
                const merged = Model.mergeProgress(study.progress, incoming);
                if (JSON.stringify(merged) === JSON.stringify(study.progress)) continue;
                const result = await deps.writeProfile(profileId, { ...profile, study: { ...study, progress: merged } });
                wrote = wrote || result?.ok !== false;
            }
            return { ok: true, wrote };
        }

        /** Names for the UI (it doesn't load the catalog): {id, names, shortName, variant: {id, names}}. */
        function packLabels(study, catalog) {
            return array(study?.activePackIds).map(id => {
                const pack = array(catalog?.packs).find(item => item.id === id);
                const variant = pack && Engine.packVariant ? Engine.packVariant(pack, object(object(study.packEdits)[id]).variant) : null;
                return {
                    id,
                    names: object(pack?.names),
                    shortName: pack?.shortName || null,
                    kind: pack?.kind || null,
                    variant: variant ? { id: variant.id, names: object(variant.names) } : null
                };
            });
        }

        /** The UI state for the active profile. */
        async function getState() {
            const guard = await readClock();
            const [{ profileId, profile, runtime }, catalog, device] = await Promise.all([readAll(), loadCatalog(), deviceId()]);
            const at = now();
            const { study, local, clock } = clockFor(profile, runtime, profileId, at, guard);
            const applied = study ? Engine.studyEffectiveProfile(profile, { catalog, clock, study }) : { packIds: [] };
            const date = Engine.localDateKey(at);
            const progress = study ? Model.mergeProgress(study.progress, { [device]: Object.fromEntries(
                Object.entries(object(runtime.seconds[profileId])).map(([day, seconds]) => [day, Math.floor(seconds / 60)])) }) : {};
            const lock = await deps.getSelfControlSession?.();
            return {
                ok: true,
                profileId,
                deviceId: device,
                study,
                ...publicState(study, local, clock, applied.packIds || [], at, applied),
                session: local.session,
                clockNotes: array(object(guard.clockStore?.notes)[profileId]),
                lock: lock ? { sessionId: lock.sessionId, sessionKind: lock.sessionKind, lockedUntil: lock.lockedUntil } : null,
                packs: packLabels(study, catalog),
                todayMinutes: Engine.minutesOn(progress, date),
                week: Engine.weekProgress(progress, at, study?.focus?.dailyGoalMinutes || 0),
                weekView: study ? Model.weekViewEnabled(study, profile.type) : false
            };
        }

        async function schedule() {
            if (!api.alarms?.create) return null;
            const guard = await readClock();
            const { profileId, profile, runtime } = await readAll();
            const at = now();
            const { study, local, clock, parentLock } = clockFor(profile, runtime, profileId, at, guard);
            // A hold re-checks every minute; a parent's lock advances its running-time meter every minute.
            const minute = clock.clockHold || parentLock?.active || clockSensitive(study, local) && clock.studying ? at + 60 * 1000 : null;
            const candidates = [clock.next?.at, local.endRequestedAt ? local.endRequestedAt + Engine.GENTLE_END_PAUSE_MS : null, minute]
                .filter(value => Number.isFinite(value) && value > at);
            if (!study || !candidates.length) {
                await Promise.resolve(api.alarms.clear?.(ALARM));
                return null;
            }
            const when = Math.min(...candidates);
            await Promise.resolve(api.alarms.create(ALARM, { when }));
            return when;
        }

        async function finishEndRequest() {
            const { profileId, runtime } = await readAll();
            const local = profileRuntime(runtime, profileId);
            if (!local.endRequestedAt || now() < local.endRequestedAt + Engine.GENTLE_END_PAUSE_MS) return false;
            const { profile } = await readAll();
            const { clock } = clockFor(profile, runtime, profileId);
            runtime.profiles[profileId] = {
                ...local,
                session: null,
                endRequestedAt: null,
                endedUntil: clock.sessionEnd || now()
            };
            await writeRuntime(runtime);
            await updateProfileStudy(profileId, study => ({ ...study, lock: null }));
            return true;
        }

        /** Called on every study alarm (and at worker start): end a paused Gentle session, fold, reschedule, push. */
        async function onAlarm(name) {
            if (name && name !== ALARM) return false;
            await finishEndRequest();
            const guard = await readClock();
            const { profileId, profile, runtime } = await readAll();
            const { study, local, clock, parentLock } = clockFor(profile, runtime, profileId, now(), guard);
            // A held clock never ends a session: the session waits until the clock is put back.
            if (local.session && !clock.clockHold && (guard.reading ? guard.reading.lockNow : now()) >= Number(local.session.endsAt)) {
                runtime.profiles[profileId] = { ...local, session: null };
                await writeRuntime(runtime);
            }
            // A parent's lock is never cleared here: only that parent ends it (signed unlock or Family).
            if (study?.lock && !text(study.lock.setByParentId) && !clock.studying && !clock.clockHold) {
                // A Locked session's Self-Control record expires by itself; clear the reference it left.
                const active = await deps.getSelfControlSession?.();
                if (!active || active.sessionId !== study.lock.sessionId) await updateProfileStudy(profileId, value => ({ ...value, lock: null }));
            }
            if (!clock.studying && !clock.clockHold && !parentLock?.active) await foldProgress();
            await schedule();
            await deps.onTransition?.('alarm');
            return true;
        }

        async function startSession({ minutes, lock = 'gentle' } = {}) {
            const length = Math.trunc(Number(minutes));
            const mode = lock === 'locked' ? 'locked' : 'gentle';
            const cap = mode === 'locked' ? Engine.SELF_LOCK_MAX_MINUTES : MAX_SESSION_MINUTES;
            if (!Number.isFinite(length) || length < 1 || length > cap) return { ok: false, error: 'invalid_duration', maxMinutes: cap };
            const { profileId, profile, runtime } = await readAll();
            const study = Model.profileStudy(profile);
            if (!study || !study.activePackIds.length) return { ok: false, error: 'no_active_pack' };
            const { clock } = clockFor(profile, runtime, profileId);
            if (clock.studying) return { ok: false, error: 'already_studying' };
            if (await deps.getSelfControlSession?.()) return { ok: false, error: 'session_already_active' };
            const startedAt = now();
            const endsAt = startedAt + length * 60 * 1000;
            const sessionId = `study-${startedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            if (mode === 'locked') {
                // Locked is today's Self-Control Session: the hard_whitelist kind while a pack is active.
                const result = await deps.startLockedSession({ profileId, sessionId, startedAt, lockedUntil: endsAt });
                if (!result?.ok) return result || { ok: false, error: 'lock_failed' };
            }
            const local = profileRuntime(runtime, profileId);
            runtime.profiles[profileId] = { ...local, session: { sessionId, startedAt, endsAt, lockMode: mode }, endRequestedAt: null, breakSkippedUntil: null };
            await writeRuntime(runtime);
            if (mode === 'gentle') {
                await updateProfileStudy(profileId, value => ({ ...value, lock: { sessionId, sessionKind: 'self_control', mode: 'gentle', setByParentId: null } }));
            }
            await schedule();
            await deps.onTransition?.('start');
            return { ok: true, sessionId, startedAt, endsAt, lock: mode };
        }

        /** Gentle: the session ends after a 30-second pause, unless cancelled. Locked: refused. */
        async function requestEnd() {
            const { profileId, profile, runtime } = await readAll();
            const { study, local, clock } = clockFor(profile, runtime, profileId);
            if (!study || !clock.studying) return { ok: false, error: 'not_studying' };
            const policy = Engine.endPolicy(study);
            const selfControl = await deps.getSelfControlSession?.();
            if (!policy.canEnd || (selfControl && local.session?.lockMode === 'locked')) return { ok: false, error: policy.reason || 'locked' };
            const endRequestedAt = local.endRequestedAt || now();
            runtime.profiles[profileId] = { ...local, endRequestedAt };
            await writeRuntime(runtime);
            await schedule();
            return { ok: true, endsAt: endRequestedAt + Engine.GENTLE_END_PAUSE_MS };
        }

        async function cancelEnd() {
            const { profileId, runtime } = await readAll();
            const local = profileRuntime(runtime, profileId);
            runtime.profiles[profileId] = { ...local, endRequestedAt: null };
            await writeRuntime(runtime);
            await schedule();
            return { ok: true };
        }

        async function skipBreak() {
            const { profileId, profile, runtime } = await readAll();
            const { study, local, clock } = clockFor(profile, runtime, profileId);
            if (!study || clock.state !== Engine.BREAK) return { ok: false, error: 'not_on_break' };
            if (!Engine.selfStarted(study)) return { ok: false, error: 'set_by_parent' };
            runtime.profiles[profileId] = { ...local, breakSkippedUntil: clock.until };
            await writeRuntime(runtime);
            await deps.onTransition?.('skip_break');
            return { ok: true, until: clock.until };
        }

        /**
         * Study time from a content script: credited only while the active profile is in STUDY, at most
         * the wall time since the last credit, so two playing tabs never count twice.
         */
        async function tick({ seconds } = {}) {
            const value = Math.trunc(Number(seconds));
            if (!Number.isFinite(value) || value <= 0) return { ok: false, error: 'invalid_seconds' };
            const { profileId, profile, runtime } = await readAll();
            const at = now();
            const { clock } = clockFor(profile, runtime, profileId, at);
            if (clock.state !== Engine.STUDY) return { ok: false, error: 'not_studying' };
            const since = runtime.lastCreditAt > 0 ? Math.floor((at - runtime.lastCreditAt) / 1000) : MAX_TICK_SECONDS;
            const credited = Math.max(0, Math.min(value, MAX_TICK_SECONDS, since));
            if (!credited) return { ok: true, credited: 0 };
            const date = Engine.localDateKey(at);
            const days = object(runtime.seconds[profileId]);
            days[date] = Math.min(86400, (Number(days[date]) || 0) + credited);
            runtime.seconds[profileId] = Object.fromEntries(Object.entries(days).sort().slice(-400));
            runtime.lastCreditAt = at;
            await writeRuntime(runtime);
            return { ok: true, credited, date, seconds: days[date] };
        }

        /** Phase 5 edits: packs, packEdits, focus, plan, breakMode, weekView. Never the lock or progress. */
        async function update(patch = {}) {
            if (await deps.getSelfControlSession?.()) return { ok: false, error: 'locked' };
            const allowed = ['activePackIds', 'packEdits', 'focus', 'plan', 'breakMode', 'weekView', 'packChannelsOnly'];
            const { profileId, profile, runtime } = await readAll();
            const current = Model.profileStudy(profile);
            const apply = study => {
                const next = { ...study };
                for (const key of allowed) if (Object.prototype.hasOwnProperty.call(object(patch), key)) next[key] = clone(patch[key]);
                return next;
            };
            // A child never sets study up for itself (Android StudySetupActivity); a parent does that from
            // Family control. It may only make what it has stricter.
            const isChild = text(profile.type) === 'child';
            if (isChild && !current) return { ok: false, error: 'child_profile' };
            // Under a parent's plan or lock the person may tighten study, never loosen it (StudyTighten),
            // and nobody loosens it during a clock hold (Android StudyRuntime.holdsLoosening).
            const running = !!current && clockFor(profile, runtime, profileId, now()).clock.clockHold === true;
            if (current && (isChild || running || current.plan?.setByParentId || current.lock?.setByParentId)
                && !Model.tightenAllowed(current, apply(clone(current)), { now: now(), held: isChild || running })) {
                return { ok: false, error: isChild || current.plan?.setByParentId || current.lock?.setByParentId ? 'set_by_parent' : 'study_running' };
            }
            const result = await updateProfileStudy(profileId, apply);
            if (result?.ok === false) return result;
            await schedule();
            await deps.onTransition?.('update');
            return { ok: true };
        }

        /**
         * A parent editing a protected (child) profile on this device: the active profile must be that
         * child's parent account. The plan the parent saves carries setByParentId, so Family control
         * sends it as the schedule scope and the child can only tighten it. A plan or lock another
         * parent set stays theirs.
         */
        async function parentContext(childId) {
            if (await deps.getSelfControlSession?.()) return { ok: false, error: 'locked' };
            const { profiles } = await readAll();
            const parentId = text(profiles.activeProfileId) || 'default';
            const all = object(profiles.profiles);
            const parent = object(all[parentId]);
            const child = object(all[text(childId)]);
            const parentIsAccount = parentId === 'default' || text(parent.type || 'account') === 'account';
            if (!Object.keys(child).length || text(child.type) !== 'child' || text(child.parentProfileId) !== parentId || !parentIsAccount) {
                return { ok: false, error: 'not_parent' };
            }
            return { ok: true, parentId, child, childId: text(childId) };
        }

        async function getChildState(childId) {
            const context = await parentContext(childId);
            if (!context.ok) return context;
            const catalog = await loadCatalog();
            const study = Model.profileStudy(context.child);
            const clock = study ? clockFor(context.child, emptyRuntime(), context.childId, now()).clock : null;
            return { ok: true, profileId: context.childId, parentId: context.parentId, study, state: clock?.state || 'NORMAL',
                packs: packLabels(study, catalog), lockedUntil: Model.isParentLock(study?.lock) ? Number(study.lock.endsAt) : null };
        }

        async function updateChild(childId, patch = {}) {
            const context = await parentContext(childId);
            if (!context.ok) return context;
            const current = Model.profileStudy(context.child) || Model.createStudy();
            const owner = value => text(object(value).setByParentId);
            if ((owner(current.plan) && owner(current.plan) !== context.parentId) || (owner(current.lock) && owner(current.lock) !== context.parentId)) {
                return { ok: false, error: 'set_by_other_parent' };
            }
            const allowed = ['activePackIds', 'packEdits', 'focus', 'plan', 'breakMode', 'weekView', 'packChannelsOnly'];
            const value = object(patch);
            const result = await updateProfileStudy(context.childId, study => {
                const next = { ...study };
                for (const key of allowed) if (Object.prototype.hasOwnProperty.call(value, key)) next[key] = clone(value[key]);
                if (next.plan) next.plan = { ...next.plan, setByParentId: context.parentId };
                return next;
            });
            if (result?.ok === false) return result;
            await deps.onTransition?.('parent_update');
            return { ok: true };
        }

        /** A parent's session lock on a child: study rounds for `minutes` (7 days at most), from now. */
        async function startParentLock(childId, { minutes } = {}) {
            const context = await parentContext(childId);
            if (!context.ok) return context;
            const length = Math.trunc(Number(minutes));
            if (!Number.isFinite(length) || length < 15 || length > Engine.PARENT_LOCK_MAX_MINUTES) {
                return { ok: false, error: 'invalid_duration', maxMinutes: Engine.PARENT_LOCK_MAX_MINUTES };
            }
            const current = Model.profileStudy(context.child);
            if (!current || !current.activePackIds.length) return { ok: false, error: 'no_active_pack' };
            if (text(object(current.lock).setByParentId) && text(current.lock.setByParentId) !== context.parentId) return { ok: false, error: 'set_by_other_parent' };
            const startsAt = now();
            const lock = {
                sessionId: `parent-${startsAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: context.parentId,
                startsAt, endsAt: startsAt + length * 60 * 1000, scope: 'session'
            };
            const result = await updateProfileStudy(context.childId, study => ({ ...study, lock }));
            if (result?.ok === false) return result;
            await schedule();
            await deps.onTransition?.('parent_lock');
            return { ok: true, lock };
        }

        /** Only the parent who set a lock ends it early. */
        async function endParentLock(childId) {
            const context = await parentContext(childId);
            if (!context.ok) return context;
            const current = Model.profileStudy(context.child);
            if (!current?.lock) return { ok: true };
            if (text(current.lock.setByParentId) !== context.parentId) return { ok: false, error: 'set_by_other_parent' };
            const result = await updateProfileStudy(context.childId, study => ({ ...study, lock: null }));
            if (result?.ok === false) return result;
            await schedule();
            await deps.onTransition?.('parent_unlock');
            return { ok: true };
        }

        /**
         * Switching profile during study (Android StudyProfileSwitch). Study is per profile, so a switch
         * away from [fromProfileId] is a way out unless it's checked:
         * - a parent's lock, a parent's plan window or a parent's plan limit: the PIN of the parent who
         *   set it, typed now ({kind: 'needs_parent_pin', parentProfileId, endsAt});
         * - a clock hold or a self-started Locked session: no switching ({kind: 'locked', endsAt});
         * - a Gentle session: it ends first ({kind: 'end_gentle_first'});
         * - otherwise {kind: 'allowed'} and the usual PIN gates apply.
         */
        async function switchDecision(fromProfileId, fromProfile, targetId) {
            const from = text(fromProfileId);
            if (!from || text(targetId) === from) return { kind: 'allowed' };
            const items = await storageGet([RUNTIME_KEY, CLOCK_KEY]);
            const runtime = normalizeRuntime(items[RUNTIME_KEY]);
            const clockStore = normalizeClockStore(items[CLOCK_KEY]);
            const { study, local, clock, parentLock } = clockFor(object(fromProfile), runtime, from, now(), { clockStore });
            if (!study) return { kind: 'allowed' };
            const lock = object(study.lock);
            if (parentLock?.active && text(lock.setByParentId)) {
                return { kind: 'needs_parent_pin', parentProfileId: text(lock.setByParentId), endsAt: Number(lock.endsAt) || null };
            }
            if (clock.setByParentId && clock.studying) {
                return { kind: 'needs_parent_pin', parentProfileId: text(clock.setByParentId), endsAt: clock.sessionEnd || null };
            }
            if (clock.state === Engine.LIMIT) {
                const planParent = text(object(study.plan).setByParentId);
                if (planParent) return { kind: 'needs_parent_pin', parentProfileId: planParent, endsAt: clock.clockHold ? null : clock.until || null };
                if (clock.clockHold) return { kind: 'locked', endsAt: clock.until || null };
            }
            if (local.session?.lockMode === 'locked' && clock.studying) return { kind: 'locked', endsAt: Number(local.session.endsAt) || null };
            if (local.session && clock.studying) return { kind: 'end_gentle_first' };
            return { kind: 'allowed' };
        }

        /** Runtime messages. Returns a promise of the response, or null when the action isn't ours. */
        function handleMessage(request, { extensionPage = false, youtubeContent = false } = {}) {
            const action = text(request?.action);
            if (!action.startsWith('FilterTube_Study')) return null;
            if (action === 'FilterTube_StudyGetState') {
                if (!extensionPage && !youtubeContent) return Promise.resolve({ ok: false, error: 'untrusted_sender' });
                return getState();
            }
            if (action === 'FilterTube_StudyProgressTick') {
                if (!youtubeContent) return Promise.resolve({ ok: false, error: 'untrusted_sender' });
                return tick(request);
            }
            if (action === 'FilterTube_StudySkipBreak') {
                if (!extensionPage && !youtubeContent) return Promise.resolve({ ok: false, error: 'untrusted_sender' });
                return skipBreak();
            }
            if (!extensionPage) return Promise.resolve({ ok: false, error: 'untrusted_sender' });
            if (action === 'FilterTube_StudyStartSession') return startSession(request);
            if (action === 'FilterTube_StudyEndSession') return requestEnd();
            if (action === 'FilterTube_StudyCancelEnd') return cancelEnd();
            if (action === 'FilterTube_StudyUpdate') return update(request.patch);
            if (action === 'FilterTube_StudyGetChild') return getChildState(request.profileId);
            if (action === 'FilterTube_StudyUpdateChild') return updateChild(request.profileId, request.patch);
            if (action === 'FilterTube_StudyStartParentLock') return startParentLock(request.profileId, request);
            if (action === 'FilterTube_StudyEndParentLock') return endParentLock(request.profileId);
            return Promise.resolve({ ok: false, error: 'unknown_action' });
        }

        return Object.freeze({
            ALARM, RUNTIME_KEY, prepare, apply, getState, schedule, onAlarm, startSession, requestEnd, cancelEnd,
            skipBreak, tick, update, foldProgress, handleMessage, deviceId, getChildState, updateChild, startParentLock, endParentLock,
            switchDecision
        });
    }

    return Object.freeze({ RUNTIME_KEY, DEVICE_KEY, ALARM, createStudyBackground });
}));
