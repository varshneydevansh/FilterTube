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
    const MAX_TICK_SECONDS = 60;
    const MAX_SESSION_MINUTES = 24 * 60;

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
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
        const now = () => (typeof deps.now === 'function' ? deps.now() : Date.now());
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

        /** The clock for one profile, from its study plan and this device's runtime. */
        function clockFor(profile, runtime, profileId, at = now(), options = {}) {
            const study = Model.profileStudy(profile);
            const local = profileRuntime(runtime, profileId);
            if (!study) return { study: null, local, clock: Engine.studyClock({ plan: null, now: at }) };
            const clock = Engine.studyClock({
                plan: study.plan, focus: study.focus, breakMode: study.breakMode, now: at,
                session: local.session, endedUntil: local.endedUntil, limitReached: options.limitReached === true
            });
            return { study, local, clock };
        }

        function publicState(study, local, clock, packIds, at) {
            const breakSkipped = clock.state === Engine.BREAK && Number.isFinite(local.breakSkippedUntil) && at < local.breakSkippedUntil;
            const policy = study ? Engine.endPolicy(study) : { canEnd: false, reason: 'no_study' };
            const transitions = [clock.next?.at, local.endRequestedAt ? local.endRequestedAt + Engine.GENTLE_END_PAUSE_MS : null]
                .filter(value => Number.isFinite(value) && value > at);
            return {
                state: clock.state,
                round: clock.round,
                rounds: clock.rounds,
                until: clock.until,
                sessionStart: clock.sessionStart,
                sessionEnd: clock.sessionEnd,
                source: clock.source,
                breakMode: clock.breakMode,
                breakNoticeAt: clock.breakNoticeAt,
                breakSkipped,
                canSkipBreak: !!study && Engine.selfStarted(study) && clock.state === Engine.BREAK,
                next: clock.next,
                packIds,
                endPolicy: policy,
                endRequestedAt: local.endRequestedAt,
                validUntil: transitions.length ? Math.min(...transitions) : null
            };
        }

        /** Loaded once per compile: the catalog and this device's runtime. */
        async function prepare() {
            const [catalog, items] = await Promise.all([loadCatalog(), storageGet([RUNTIME_KEY])]);
            return { catalog, runtime: normalizeRuntime(items[RUNTIME_KEY]), now: now() };
        }

        /**
         * Synchronous, for the compiler: the profile the filters use and the public study state.
         * Returns {profile, applied, state}.
         */
        function apply(profileId, profile, prepared, options = {}) {
            const at = prepared?.now ?? now();
            const { study, local, clock } = clockFor(profile, prepared?.runtime || emptyRuntime(), profileId, at, options);
            if (!study) return { profile, applied: false, state: null };
            const result = Engine.studyEffectiveProfile(profile, { catalog: prepared?.catalog, clock, study });
            return { profile: result.profile, applied: result.applied, state: publicState(study, local, clock, result.packIds, at) };
        }

        async function writeRuntime(runtime) {
            await storageSet({ [RUNTIME_KEY]: runtime });
        }

        async function updateProfileStudy(profileId, mutate) {
            const { profiles } = await readAll();
            const profile = object(object(profiles.profiles)[profileId]);
            if (!Object.keys(profile).length) return { ok: false, error: 'profile_unavailable' };
            const current = Model.profileStudy(profile) || Model.createStudy();
            const next = Model.normalizeStudy(mutate(clone(current)));
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

        /** The UI state for the active profile. */
        async function getState() {
            const [{ profileId, profile, runtime }, catalog, device] = await Promise.all([readAll(), loadCatalog(), deviceId()]);
            const at = now();
            const { study, local, clock } = clockFor(profile, runtime, profileId, at);
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
                ...publicState(study, local, clock, applied.packIds || [], at),
                session: local.session,
                lock: lock ? { sessionId: lock.sessionId, sessionKind: lock.sessionKind, lockedUntil: lock.lockedUntil } : null,
                todayMinutes: Engine.minutesOn(progress, date),
                week: Engine.weekProgress(progress, at, study?.focus?.dailyGoalMinutes || 0),
                weekView: study ? Model.weekViewEnabled(study, profile.type) : false
            };
        }

        async function schedule() {
            if (!api.alarms?.create) return null;
            const { profileId, profile, runtime } = await readAll();
            const at = now();
            const { study, local, clock } = clockFor(profile, runtime, profileId, at);
            const candidates = [clock.next?.at, local.endRequestedAt ? local.endRequestedAt + Engine.GENTLE_END_PAUSE_MS : null]
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
            const { profileId, profile, runtime } = await readAll();
            const { study, local, clock } = clockFor(profile, runtime, profileId);
            if (local.session && now() >= Number(local.session.endsAt)) {
                runtime.profiles[profileId] = { ...local, session: null };
                await writeRuntime(runtime);
            }
            if (study?.lock && !clock.studying) {
                // A Locked session's Self-Control record expires by itself; clear the reference it left.
                const active = await deps.getSelfControlSession?.();
                if (!active || active.sessionId !== study.lock.sessionId) await updateProfileStudy(profileId, value => ({ ...value, lock: null }));
            }
            if (!clock.studying) await foldProgress();
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
            const allowed = ['activePackIds', 'packEdits', 'focus', 'plan', 'breakMode', 'weekView'];
            const { profileId, profile } = await readAll();
            const current = Model.profileStudy(profile);
            if (current && (current.plan?.setByParentId || current.lock?.setByParentId)) return { ok: false, error: 'set_by_parent' };
            const result = await updateProfileStudy(profileId, study => {
                const next = { ...study };
                for (const key of allowed) if (Object.prototype.hasOwnProperty.call(object(patch), key)) next[key] = clone(patch[key]);
                return next;
            });
            if (result?.ok === false) return result;
            await schedule();
            await deps.onTransition?.('update');
            return { ok: true };
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
            return Promise.resolve({ ok: false, error: 'unknown_action' });
        }

        return Object.freeze({
            ALARM, RUNTIME_KEY, prepare, apply, getState, schedule, onAlarm, startSession, requestEnd, cancelEnd,
            skipBreak, tick, update, foldProgress, handleMessage, deviceId
        });
    }

    return Object.freeze({ RUNTIME_KEY, DEVICE_KEY, ALARM, createStudyBackground });
}));
