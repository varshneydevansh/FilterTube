/* The clock can't be used to cheat (STUDY_ENFORCEMENT_SPEC P0.2, loophole audit C1 and L4): the
 * browser version of Android's StudyClockGuard.kt. Pure; the clocks come in as numbers.
 *
 * The wall clock (Date.now) can be moved by the person a lock is for, so locks and plans are also
 * measured on a clock they can't move:
 * - a monotonic clock (performance.now) while one background worker instance lives; its
 *   performance.timeOrigin is the "boot" id, so a new worker is a new boot;
 * - across worker restarts, the last trusted time (time never runs backwards), corrected by a
 *   network time (the Date header of a request to the video site) when one was read.
 * The stricter of the two clocks wins:
 * - a lock has started when either clock says so, and ended only when both say so;
 * - a parent's lock also needs its running time on this device (the meter below), unless a fresh
 *   network time confirms the end (closest browser version: the meter can't see time while the
 *   browser was closed, so a network time is the only proof the time really passed);
 * - when the time or the time zone changes while a lock or a parent's plan is in force, the rules
 *   hold at rest until the clock is put back or the lock ends on the trusted clock, and the change
 *   is noted for the parent's report. The session is held, never ended.
 * Browser limits: a forward jump made while no worker runs is only caught by a network time, and
 * a worker sleeping with the computer can look like a forward jump until a network time clears it.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyClockGuard = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    /** Drift and small corrections below this are accepted silently. */
    const TOLERANCE_MS = 2 * 60 * 1000;
    /** The hold re-checks this often. */
    const HOLD_RECHECK_MS = 60 * 1000;
    /** Across a worker restart the meter credits at most this much wall time (a missed alarm or two). */
    const MAX_GAP_MS = 2 * 60 * 1000;
    /** A network time is read again after this, while a lock or parent's plan exists. */
    const NETWORK_RECHECK_MS = 10 * 60 * 1000;
    const NOTES_KEPT = 20;

    function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }

    function normalizeAnchor(value) {
        if (!value || typeof value !== 'object') return null;
        if (!text(value.bootId) || !finite(value.monoAt) || !finite(value.trustedAt)) return null;
        return { bootId: text(value.bootId), monoAt: value.monoAt, trustedAt: value.trustedAt, zoneId: text(value.zoneId) || 'UTC' };
    }

    function reading(wall, trusted, anchorZoneId, deviceZoneId) {
        const jumped = Math.abs(wall - trusted) > TOLERANCE_MS;
        const zoneChanged = anchorZoneId !== deviceZoneId;
        return {
            wall, trusted, anchorZoneId, deviceZoneId,
            // For "has it ended?": the earlier clock. For "has it started?": the later clock.
            lockNow: Math.min(wall, trusted),
            startNow: Math.max(wall, trusted),
            jumped, zoneChanged, changed: jumped || zoneChanged,
            forward: jumped && wall > trusted,
            backward: jumped && wall < trusted
        };
    }

    function wallOnly(wall, zoneId) { return reading(wall, wall, zoneId, zoneId); }

    /**
     * Reads both clocks against the stored anchor. `sensitive` is true while a lock or a parent's plan
     * exists on the active profile: then a jump is kept (not re-anchored) so it can be held and noted.
     * Returns {reading, anchor, newBoot}.
     */
    function read(anchorValue, { wall, mono, bootId, zoneId, sensitive = false, networkTime = null }) {
        const anchor = normalizeAnchor(anchorValue);
        const boot = text(bootId) || 'boot';
        const zone = text(zoneId) || 'UTC';
        const sameBoot = !!anchor && anchor.bootId === boot && mono >= anchor.monoAt;
        let trusted;
        if (finite(networkTime)) trusted = networkTime;
        else if (!anchor) trusted = wall;
        else if (sameBoot) trusted = anchor.trustedAt + (mono - anchor.monoAt);
        // A new worker: the time between can't be measured, but time never runs backwards.
        else trusted = Math.max(anchor.trustedAt, wall);
        const anchorZone = anchor ? anchor.zoneId : zone;
        const look = reading(wall, trusted, anchorZone, zone);
        const accept = !sensitive || !look.changed;
        const next = accept
            ? { bootId: boot, monoAt: mono, trustedAt: wall, zoneId: zone }
            : { bootId: boot, monoAt: mono, trustedAt: trusted, zoneId: anchorZone };
        return { reading: accept ? wallOnly(wall, zone) : look, anchor: next, newBoot: !sameBoot };
    }

    /** Running time on this device, which only moves forward. */
    function advanceMeter(meterValue, { mono, bootId, wall }) {
        const meter = meterValue && typeof meterValue === 'object' && finite(meterValue.total) ? meterValue : null;
        const boot = text(bootId) || 'boot';
        if (!meter) return { bootId: boot, monoAt: mono, wallAt: wall, total: 0 };
        let delta;
        if (meter.bootId === boot && finite(meter.monoAt) && mono >= meter.monoAt) delta = mono - meter.monoAt;
        else delta = Math.min(MAX_GAP_MS, Math.max(0, wall - (finite(meter.wallAt) ? meter.wallAt : wall)));
        return { bootId: boot, monoAt: mono, wallAt: wall, total: meter.total + Math.max(0, delta) };
    }

    /** Where a lock's count started: the meter then, plus the time before this device saw it. */
    function firstSight(lock, meter, wallAtSight) {
        const start = Number(lock?.startsAt);
        const duration = Math.max(0, Number(lock?.endsAt) - start);
        const credit = finite(start) ? Math.min(duration, Math.max(0, wallAtSight - start)) : 0;
        return { meterAt: meter.total, credit };
    }

    function ranMs(seen, meter) {
        if (!seen || !meter) return 0;
        return (Number(seen.credit) || 0) + Math.max(0, meter.total - (Number(seen.meterAt) || 0));
    }

    function isParentLock(lock) {
        return !!lock && !!text(lock.setByParentId) && finite(Number(lock.startsAt)) && finite(Number(lock.endsAt))
            && Number(lock.endsAt) > Number(lock.startsAt);
    }

    /**
     * A parent's lock right now: {active, ended, remainingMs}. Started by either clock; ended only when
     * both clocks say so and it ran its whole time here, or a fresh network time confirms the end.
     */
    function parentLockState(lock, look, { seen = null, meter = null, networkTime = null } = {}) {
        if (!isParentLock(lock)) return { active: false, ended: false, remainingMs: 0 };
        const startsAt = Number(lock.startsAt);
        const endsAt = Number(lock.endsAt);
        if (look.startNow < startsAt) return { active: false, ended: false, remainingMs: endsAt - startsAt };
        const duration = endsAt - startsAt;
        const remainingMs = seen && meter ? Math.max(0, duration - ranMs(seen, meter) - TOLERANCE_MS) : duration;
        const networkEnded = finite(networkTime) && networkTime >= endsAt;
        const ended = networkEnded || (look.lockNow >= endsAt && remainingMs <= 0);
        return { active: !ended, ended, remainingMs };
    }

    /** A time or zone change seen during a lock, for the parent's report (newest last, 20 kept). */
    function addNote(notes, look, at) {
        const list = Array.isArray(notes) ? notes.slice() : [];
        const kind = look.zoneChanged && !look.jumped ? 'zone' : 'time';
        list.push({ at, kind, minutes: Math.round((look.wall - look.trusted) / 60000) });
        return list.slice(-NOTES_KEPT);
    }

    /** The device's time zone id, or "UTC". */
    function deviceZoneId() {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
    }

    return Object.freeze({
        TOLERANCE_MS, HOLD_RECHECK_MS, MAX_GAP_MS, NETWORK_RECHECK_MS,
        read, wallOnly, advanceMeter, firstSight, ranMs, isParentLock, parentLockState, addNote, deviceZoneId
    });
}));
