/*
 * Background-owned imported channel metadata queue.
 *
 * The dashboard supplies a persisted job and observes its status; this module
 * owns wakeups, recovery, pacing, and one-at-a-time enrichment. Dependencies
 * are injected so the queue can be exercised without evaluating the complete
 * background script.
 */
(function installFilterTubeImportedChannelEnrichment(global) {
    'use strict';

    if (global.FilterTubeImportedChannelEnrichment) return;

    const DEFAULT_JOB_KEY = 'ftBlockTubeEnrichmentJobV1';
    const DEFAULT_ALARM_NAME = 'filtertube-imported-channel-enrichment';
    const DEFAULT_MIN_DELAY_MS = 7000;
    const DEFAULT_MAX_DELAY_MS = 15000;
    const DEFAULT_ALARM_FLOOR_MS = 30000;
    // A failed lookup should get a prompt, isolated retry. The retry belongs
    // to that row; it must never become the wake time for fresh rows in the
    // same import. Repeated failures back off to a conservative 30-minute
    // ceiling so a temporary YouTube/CORS response is not retried in a loop.
    const DEFAULT_RETRY_DELAY_MS = 2 * 60 * 1000;
    const DEFAULT_MAX_RETRY_DELAY_MS = 30 * 60 * 1000;
    const DEFAULT_MAX_ATTEMPTS = 4;
    const IMPORTED_SOURCES = new Set([
        'import',
        'managed_channel_list',
        'blocktube',
        'blocktube-channel-name'
    ]);

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function text(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function isValidChannelId(value) {
        return /^UC[a-zA-Z0-9_-]{22}$/.test(text(value));
    }

    function isImportedSource(channel) {
        return IMPORTED_SOURCES.has(text(channel?.source).toLowerCase());
    }

    function isValidLookup(value) {
        const normalized = text(value);
        if (!normalized) return false;
        if (isValidChannelId(normalized)) return true;
        if (/^@[A-Za-z0-9._-]{2,}$/.test(normalized)) return true;
        if (/^(?:c|user)\/[^\s/?#]+$/i.test(normalized)) return true;
        try {
            const url = new URL(normalized.startsWith('http') ? normalized : 'https://' + normalized);
            const host = text(url.hostname).replace(/^www\./i, '').toLowerCase();
            if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return false;
            const parts = url.pathname.split('/').filter(Boolean);
            return isValidChannelId(parts[1] || '')
                || /^@[A-Za-z0-9._-]{2,}$/.test(parts[0] || '')
                || (/^(?:c|user)$/i.test(parts[0] || '') && Boolean(parts[1]));
        } catch (error) {
            return false;
        }
    }

    function getLookup(channel) {
        if (!isImportedSource(channel)) return '';
        // BlockTube channelName entries are name-boundary rules, not channel
        // identities. Even when the text happens to look like @handle, there
        // is no safe UC ID to enrich without changing the rule's meaning.
        if (text(channel?.source).toLowerCase() === 'blocktube-channel-name') return '';
        return [
            channel.id,
            channel.handle,
            channel.handleDisplay,
            channel.canonicalHandle,
            channel.customUrl,
            channel.originalInput,
            channel.name
        ]
            .map(text)
            .find(isValidLookup) || '';
    }

    function normalizeIdentityValue(value) {
        const raw = text(value);
        if (!raw) return '';
        const normalized = raw.replace(/^\/+/, '');
        const idMatch = normalized.match(/^(?:channel\/)?(UC[a-zA-Z0-9_-]{22})$/i);
        if (idMatch) return `id:${idMatch[1].toLowerCase()}`;
        const handleMatch = normalized.match(/^@[A-Za-z0-9._-]{2,}$/);
        if (handleMatch) return `handle:${handleMatch[0].toLowerCase()}`;
        const customMatch = normalized.match(/^(c|user)\/([^\s/?#]+)$/i);
        if (customMatch) return `custom:${customMatch[1].toLowerCase()}/${customMatch[2].toLowerCase()}`;
        try {
            const candidate = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
            const host = text(candidate.hostname).replace(/^www\./i, '').toLowerCase();
            if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return '';
            const parts = candidate.pathname.split('/').filter(Boolean).map(part => {
                try {
                    return decodeURIComponent(part);
                } catch (error) {
                    return part;
                }
            });
            if (parts[0]?.toLowerCase() === 'channel' && isValidChannelId(parts[1])) {
                return `id:${parts[1].toLowerCase()}`;
            }
            if (parts[0] && /^@[A-Za-z0-9._-]{2,}$/.test(parts[0])) {
                return `handle:${parts[0].toLowerCase()}`;
            }
            if (parts[0] && /^(c|user)$/i.test(parts[0]) && parts[1]) {
                return `custom:${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
            }
        } catch (error) {
        }
        return '';
    }

    function getChannelIdentityKeys(channel) {
        const values = [
            channel?.id,
            ...(Array.isArray(channel?.alternateIds) ? channel.alternateIds : []),
            channel?.handle,
            channel?.handleDisplay,
            channel?.canonicalHandle,
            channel?.customUrl,
            channel?.originalInput
        ];
        const keys = [...new Set(values.map(normalizeIdentityValue).filter(Boolean))];
        if (keys.length) return keys;
        const lookup = getLookup(channel);
        return lookup ? [`lookup:${lookup.toLowerCase()}`] : [];
    }

    function normalizeTaskIdentityKey(value) {
        const candidate = text(value);
        if (!candidate) return '';
        if (/^(?:id|handle|custom|lookup):/i.test(candidate)) return candidate.toLowerCase();
        return normalizeIdentityValue(candidate);
    }

    function taskScopeKey(task) {
        const target = text(task?.targetProfileId) || 'default';
        const profile = task?.profile === 'kids' ? 'kids' : 'main';
        const listType = task?.listType === 'whitelist' ? 'whitelist' : 'blocklist';
        return `${target}:${profile}:${listType}:`;
    }

    function taskIdentityKeys(task) {
        const values = [
            ...(Array.isArray(task?.identityKeys) ? task.identityKeys : []),
            task?.input,
            task?.id
        ];
        const keys = [...new Set(values.map(normalizeTaskIdentityKey).filter(Boolean))];
        if (keys.length) return keys;
        const lookup = text(task?.input || task?.id);
        return lookup ? [`lookup:${lookup.toLowerCase()}`] : [];
    }

    function scopedTaskIdentityKeys(task) {
        const scope = taskScopeKey(task);
        return taskIdentityKeys(task).map(key => scope + key);
    }

    function isPlaceholderName(channel, value) {
        const name = text(value).toLowerCase();
        if (!name) return true;
        const candidates = [
            channel?.id,
            channel?.handle,
            channel?.handleDisplay,
            channel?.canonicalHandle,
            channel?.customUrl,
            channel?.originalInput
        ].map(item => text(item).toLowerCase()).filter(Boolean);
        if (candidates.includes(name)) return true;
        return name.startsWith('@')
            || name.startsWith('c/')
            || name.startsWith('user/')
            || name.includes('youtube.com/')
            || name.includes('youtu.be/');
    }

    function needsEnrichment(channel) {
        if (!isImportedSource(channel) || channel.topicChannel === true) return false;
        const lookup = getLookup(channel);
        if (!lookup) return false;
        const hasAlternateIdentity = Boolean(
            text(channel.handle)
            || text(channel.handleDisplay)
            || text(channel.canonicalHandle)
            || text(channel.customUrl)
        );
        const hasDisplayName = Boolean(
            text(channel.name) && !isPlaceholderName(channel, channel.name)
        );
        return !hasAlternateIdentity || !hasDisplayName || !text(channel.logo);
    }

    function taskKey(task) {
        const lookup = text(task?.input || task?.id);
        if (!isValidLookup(lookup)) return '';
        return scopedTaskIdentityKeys(task)[0] || '';
    }

    function normalizeTask(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const input = text(raw.input || raw.id);
        if (!isValidLookup(input)) return null;
        const attempts = Number(raw.attempts);
        const nextAttemptAt = Number(raw.nextAttemptAt);
        const lastErrorAt = Number(raw.lastErrorAt);
        return {
            id: isValidChannelId(input) ? input : '',
            input,
            identityKeys: Array.isArray(raw.identityKeys)
                ? [...new Set(raw.identityKeys.map(normalizeTaskIdentityKey).filter(Boolean))]
                : [],
            profile: raw.profile === 'kids' ? 'kids' : 'main',
            listType: raw.listType === 'whitelist' ? 'whitelist' : 'blocklist',
            source: text(raw.source) || 'import',
            targetProfileId: text(raw.targetProfileId),
            actorProfileId: text(raw.actorProfileId),
            attempts: Number.isFinite(attempts) && attempts >= 0 ? Math.floor(attempts) : 0,
            nextAttemptAt: Number.isFinite(nextAttemptAt) && nextAttemptAt > 0
                ? Math.floor(nextAttemptAt)
                : 0,
            lastError: text(raw.lastError),
            lastErrorAt: Number.isFinite(lastErrorAt) && lastErrorAt > 0
                ? Math.floor(lastErrorAt)
                : 0
        };
    }

    function normalizeJob(value) {
        const raw = safeObject(value);
        const pending = [];
        const seen = new Set();
        const addTask = (candidate) => {
            const task = normalizeTask(candidate);
            const keys = scopedTaskIdentityKeys(task);
            if (!task || !keys.length || keys.some(key => seen.has(key))) return;
            keys.forEach(key => seen.add(key));
            pending.push(task);
        };
        safeArray(raw.pending).forEach(addTask);
        return {
            version: 2,
            pending,
            inFlight: normalizeTask(raw.inFlight),
            nextRunAt: Number.isFinite(Number(raw.nextRunAt)) && Number(raw.nextRunAt) > 0
                ? Math.floor(Number(raw.nextRunAt))
                : 0,
            paused: raw.paused === true,
            pausedReason: text(raw.pausedReason),
            blockedReason: text(raw.blockedReason),
            lastError: text(raw.lastError),
            lastErrorAt: Number.isFinite(Number(raw.lastErrorAt)) ? Math.floor(Number(raw.lastErrorAt)) : 0,
            lastCompletedAt: Number.isFinite(Number(raw.lastCompletedAt))
                ? Math.floor(Number(raw.lastCompletedAt))
                : 0,
            updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Math.floor(Number(raw.updatedAt)) : 0
        };
    }

    function isCompleteChannel(channel) {
        if (!channel || typeof channel !== 'object') return false;
        if (channel.topicChannel === true) return true;
        const id = text(channel.id);
        const name = text(channel.name);
        const hasAlternateIdentity = Boolean(
            text(channel.handle)
            || text(channel.handleDisplay)
            || text(channel.canonicalHandle)
            || text(channel.customUrl)
        );
        const hasDisplayName = Boolean(name && name.toLowerCase() !== id.toLowerCase() && !name.startsWith('@'));
        return isValidChannelId(id) && hasAlternateIdentity && hasDisplayName && Boolean(text(channel.logo));
    }

    function create(options = {}) {
        const now = typeof options.now === 'function' ? options.now : () => Date.now();
        const random = typeof options.random === 'function' ? options.random : Math.random;
        const setTimer = typeof options.setTimeout === 'function'
            ? options.setTimeout
            : global.setTimeout?.bind(global);
        const clearTimer = typeof options.clearTimeout === 'function'
            ? options.clearTimeout
            : global.clearTimeout?.bind(global);
        const storageGet = options.storageGet;
        const storageSet = options.storageSet;
        const storageRemove = options.storageRemove;
        const loadProfiles = options.loadProfiles;
        const enrich = options.enrich;
        const isAuthorized = typeof options.isAuthorized === 'function'
            ? options.isAuthorized
            : () => true;
        const canManageTarget = typeof options.canManageTarget === 'function'
            ? options.canManageTarget
            : (profiles, actorProfileId, targetProfileId) => actorProfileId === targetProfileId;
        const isComplete = typeof options.isComplete === 'function'
            ? options.isComplete
            : isCompleteChannel;
        const jobKey = text(options.jobKey) || DEFAULT_JOB_KEY;
        const alarmName = text(options.alarmName) || DEFAULT_ALARM_NAME;
        const minDelayMs = Math.max(0, Number(options.minDelayMs) || DEFAULT_MIN_DELAY_MS);
        const maxDelayMs = Math.max(minDelayMs, Number(options.maxDelayMs) || DEFAULT_MAX_DELAY_MS);
        const alarmFloorMs = Math.max(1000, Number(options.alarmFloorMs) || DEFAULT_ALARM_FLOOR_MS);
        const retryDelayMs = Math.max(1000, Number(options.retryDelayMs) || DEFAULT_RETRY_DELAY_MS);
        const maxRetryDelayMs = Math.max(retryDelayMs, Number(options.maxRetryDelayMs) || DEFAULT_MAX_RETRY_DELAY_MS);
        const maxAttempts = Math.max(1, Math.floor(Number(options.maxAttempts) || DEFAULT_MAX_ATTEMPTS));

        let timerId = 0;
        let operationChain = Promise.resolve();
        let processRequested = false;
        let processing = false;
        let alarmGeneration = 0;

        const status = (job) => {
            const normalized = normalizeJob(job);
            const pending = normalized.pending.length;
            const inFlight = Boolean(normalized.inFlight);
            return {
                ok: true,
                scheduler: 'background',
                pending,
                inFlight,
                total: pending + (inFlight ? 1 : 0),
                paused: normalized.paused,
                pausedReason: normalized.pausedReason,
                blockedReason: normalized.blockedReason,
                lastError: normalized.lastError,
                lastErrorAt: normalized.lastErrorAt,
                lastCompletedAt: normalized.lastCompletedAt,
                nextRunAt: normalized.nextRunAt,
                updatedAt: normalized.updatedAt,
                minDelayMs,
                maxDelayMs,
                alarmFloorMs
            };
        };

        const readJob = async () => {
            if (typeof storageGet !== 'function') return normalizeJob(null);
            try {
                const result = await storageGet(jobKey);
                return normalizeJob(result?.[jobKey] || result);
            } catch (error) {
                return normalizeJob(null);
            }
        };

        const writeJob = async (job) => {
            if (typeof storageSet !== 'function') return false;
            try {
                await storageSet({
                    [jobKey]: {
                        ...normalizeJob(job),
                        updatedAt: now()
                    }
                });
                return true;
            } catch (error) {
                return false;
            }
        };

        const removeJob = async () => {
            if (typeof storageRemove !== 'function') return false;
            try {
                await storageRemove(jobKey);
                return true;
            } catch (error) {
                return false;
            }
        };

        const clearTimerOnly = () => {
            if (timerId && typeof clearTimer === 'function') {
                try {
                    clearTimer(timerId);
                } catch (error) {
                }
            }
            timerId = 0;
        };

        const clearAlarm = async () => {
            alarmGeneration += 1;
            if (typeof options.clearAlarm !== 'function') return;
            try {
                await options.clearAlarm(alarmName);
            } catch (error) {
            }
        };

        const scheduleAlarm = async (nextRunAt) => {
            if (typeof options.createAlarm !== 'function') return;
            const generation = ++alarmGeneration;
            const scheduledTime = Math.max(
                Number(nextRunAt) || now() + alarmFloorMs,
                now() + alarmFloorMs
            );
            try {
                await options.createAlarm(alarmName, scheduledTime);
                if (generation !== alarmGeneration) {
                    try {
                        await options.clearAlarm?.(alarmName);
                    } catch (error) {
                    }
                }
            } catch (error) {
            }
        };

        const scheduleWake = async (nextRunAt) => {
            clearTimerOnly();
            const target = Number(nextRunAt) > 0 ? Number(nextRunAt) : now();
            const delay = Math.max(0, target - now());
            if (typeof setTimer === 'function') {
                timerId = setTimer(() => {
                    timerId = 0;
                    return requestProcess();
                }, delay);
            }
            await scheduleAlarm(target);
        };

        const stopWake = async () => {
            clearTimerOnly();
            await clearAlarm();
        };

        const sampleDelay = () => {
            const span = Math.max(0, maxDelayMs - minDelayMs);
            const randomValue = Math.min(0.999999, Math.max(0, Number(random()) || 0));
            return minDelayMs + Math.floor(randomValue * (span + 1));
        };

        const getProfileContext = (profiles) => {
            const profileMap = profiles?.profiles
                && typeof profiles.profiles === 'object'
                && !Array.isArray(profiles.profiles)
                ? profiles.profiles
                : {};
            const activeProfileId = text(profiles?.activeProfileId) || 'default';
            return { profileMap, activeProfileId };
        };

        const collectCandidates = (profiles, requestedProfileIds = [], allProfiles = false) => {
            const { profileMap, activeProfileId } = getProfileContext(profiles);
            const requested = safeArray(requestedProfileIds)
                .map(text)
                .filter(Boolean);
            const targetProfileIds = requested.length
                ? [...new Set(requested)]
                : (allProfiles ? Object.keys(profileMap) : [activeProfileId]);
            const candidates = [];
            const seen = new Set();
            const addCandidate = (channel, profile, listType, targetProfileId) => {
                if (!needsEnrichment(channel) || channel.managedListPaused === true) return;
                if (!profileMap[targetProfileId]) return;
                if (!canManageTarget(profiles, activeProfileId, targetProfileId)) return;
                const input = getLookup(channel);
                const identityKeys = getChannelIdentityKeys(channel);
                const scopeKey = targetProfileId + ':' + profile + ':' + listType + ':';
                const candidateKeys = identityKeys.map(key => scopeKey + key);
                if (!input || !candidateKeys.length || candidateKeys.some(key => seen.has(key))) return;
                candidateKeys.forEach(key => seen.add(key));
                candidates.push({
                    id: isValidChannelId(input) ? input : '',
                    input,
                    identityKeys,
                    profile: profile === 'kids' ? 'kids' : 'main',
                    listType: listType === 'whitelist' ? 'whitelist' : 'blocklist',
                    source: text(channel.source) || 'import',
                    targetProfileId,
                    actorProfileId: activeProfileId,
                    attempts: 0,
                    nextAttemptAt: 0
                });
            };

            targetProfileIds.forEach((targetProfileId) => {
                const profile = safeObject(profileMap[targetProfileId]);
                const main = safeObject(profile.main);
                const kids = safeObject(profile.kids);
                safeArray(main.channels).forEach(channel => addCandidate(channel, 'main', 'blocklist', targetProfileId));
                safeArray(main.whitelistChannels).forEach(channel => addCandidate(channel, 'main', 'whitelist', targetProfileId));
                safeArray(kids.blockedChannels).forEach(channel => addCandidate(channel, 'kids', 'blocklist', targetProfileId));
                safeArray(kids.whitelistChannels).forEach(channel => addCandidate(channel, 'kids', 'whitelist', targetProfileId));
            });
            return candidates;
        };

        const recoveredJob = (job) => {
            const normalized = normalizeJob(job);
            if (!normalized.inFlight) return normalized;
            const inFlightKeys = new Set(scopedTaskIdentityKeys(normalized.inFlight));
            const overlaps = normalized.pending.some(task =>
                scopedTaskIdentityKeys(task).some(key => inFlightKeys.has(key))
            );
            if (inFlightKeys.size && !overlaps) {
                normalized.pending.unshift(normalized.inFlight);
            }
            normalized.inFlight = null;
            return normalized;
        };

        const mergeJob = (storedJob, candidates, scopeProfileIds, profiles) => {
            const stored = recoveredJob(storedJob);
            const { activeProfileId } = getProfileContext(profiles);
            const scope = new Set(safeArray(scopeProfileIds).map(text).filter(Boolean));
            const candidateTasks = safeArray(candidates).map(normalizeTask).filter(Boolean);
            // Build alias clusters from the current profile snapshot. This lets
            // an old persisted task for `@handle` collapse into the same task
            // as a UC-ID candidate, even when the old task did not carry
            // identityKeys yet.
            const candidateAliasCanonical = new Map();
            candidateTasks.forEach((task) => {
                const keys = scopedTaskIdentityKeys(task);
                const canonical = keys[0];
                if (!canonical) return;
                keys.forEach(key => candidateAliasCanonical.set(key, canonical));
            });
            const canonicalTaskKeys = (task) => [...new Set(
                scopedTaskIdentityKeys(task).map(key => candidateAliasCanonical.get(key) || key)
            )];
            const merged = [];
            const seen = new Set();
            const addStored = (rawTask) => {
                const task = normalizeTask(rawTask);
                const keys = canonicalTaskKeys(task);
                if (!task || !keys.length || keys.some(key => seen.has(key))) return;
                const targetProfileId = text(task.targetProfileId) || activeProfileId;
                if (scope.has(targetProfileId) && !keys.some(key => candidateAliasCanonical.has(key))) return;
                const actorProfileId = canManageTarget(profiles, activeProfileId, targetProfileId)
                    ? activeProfileId
                    : (text(task.actorProfileId) || activeProfileId);
                keys.forEach(key => seen.add(key));
                merged.push({ ...task, targetProfileId, actorProfileId });
            };
            stored.pending.forEach(addStored);
            candidateTasks.forEach((task) => {
                const keys = canonicalTaskKeys(task);
                if (!keys.length || keys.some(key => seen.has(key))) return;
                keys.forEach(key => seen.add(key));
                merged.push(task);
            });
            return {
                ...stored,
                version: 2,
                pending: merged,
                inFlight: null
            };
        };

        const loadSnapshot = async () => {
            if (typeof loadProfiles !== 'function') return null;
            try {
                return await loadProfiles();
            } catch (error) {
                return null;
            }
        };

        const enqueueOperation = (operation) => {
            const next = operationChain
                .catch(() => {})
                .then(operation);
            operationChain = next.catch(() => {});
            return next;
        };

        const finishOrSchedule = async (job) => {
            const normalized = normalizeJob(job);
            if (!normalized.pending.length && !normalized.inFlight) {
                await stopWake();
                await removeJob();
                return status(normalized);
            }
            if (normalized.paused || normalized.blockedReason) {
                await writeJob({ ...normalized, nextRunAt: 0 });
                await stopWake();
                return status({ ...normalized, nextRunAt: 0 });
            }
            await writeJob(normalized);
            await scheduleWake(normalized.nextRunAt || now());
            return status(normalized);
        };

        const processQueue = async () => {
            let job = recoveredJob(await readJob());
            if (!job.pending.length && !job.inFlight) {
                await stopWake();
                await removeJob();
                return status(job);
            }
            if (job.paused) {
                await stopWake();
                return status(job);
            }

            const profiles = await loadSnapshot();
            const { activeProfileId, profileMap } = getProfileContext(profiles);
            if (!profiles || !Object.keys(profileMap).length) {
                job.blockedReason = 'profiles_unavailable';
                job.nextRunAt = 0;
                await writeJob(job);
                await stopWake();
                return status(job);
            }
            if (!isAuthorized(profiles, activeProfileId)) {
                job.blockedReason = 'profile_locked';
                job.nextRunAt = 0;
                await writeJob(job);
                await stopWake();
                return status(job);
            }

            job.blockedReason = '';
            const currentTime = now();
            const currentTasks = job.pending.map(task => {
                const targetProfileId = text(task.targetProfileId) || activeProfileId;
                const actorProfileId = canManageTarget(profiles, activeProfileId, targetProfileId)
                    ? activeProfileId
                    : (text(task.actorProfileId) || activeProfileId);
                const nextAttemptAt = Number(task.nextAttemptAt) || 0;
                // Migrate retry timestamps written by the old queue-wide
                // scheduler. A row that has already been parked beyond the
                // new ceiling is eligible on the next normal paced wake.
                return nextAttemptAt > currentTime + maxRetryDelayMs
                    ? { ...task, targetProfileId, actorProfileId, nextAttemptAt: currentTime }
                    : { ...task, targetProfileId, actorProfileId };
            });
            job.pending = currentTasks;

            const globalDelay = Math.max(0, Number(job.nextRunAt) - currentTime);
            let taskIndex = -1;
            let earliestEligibleAt = Infinity;
            let hasManageableTask = false;
            let hasReadyTask = false;
            for (let index = 0; index < job.pending.length; index += 1) {
                const task = job.pending[index];
                const targetProfileId = text(task.targetProfileId) || activeProfileId;
                if (!canManageTarget(profiles, activeProfileId, targetProfileId)) continue;
                hasManageableTask = true;
                const nextAttemptAt = Number(task.nextAttemptAt) || 0;
                earliestEligibleAt = Math.min(earliestEligibleAt, nextAttemptAt || currentTime);
                if (nextAttemptAt <= currentTime) {
                    hasReadyTask = true;
                    if (taskIndex === -1 && globalDelay <= 0) {
                        taskIndex = index;
                    }
                }
            }

            if (taskIndex === -1) {
                if (!hasManageableTask) {
                    job.blockedReason = 'profile_context_changed';
                    job.nextRunAt = 0;
                    await writeJob(job);
                    await stopWake();
                    return status(job);
                }
                // Older versions accidentally persisted a failed row's
                // multi-hour retry as the queue-wide nextRunAt. If fresh work
                // is ready, discard that stale long wake and preserve only the
                // normal pacing window. A short existing global delay is still
                // respected so successful lookups cannot become a burst.
                const persistedNextRunAt = Number(job.nextRunAt) || 0;
                const staleGlobalDelay = persistedNextRunAt - currentTime > maxDelayMs;
                const nextRunAt = hasReadyTask && staleGlobalDelay
                    ? currentTime + sampleDelay()
                    : Math.max(
                        persistedNextRunAt,
                        Number.isFinite(earliestEligibleAt) ? earliestEligibleAt : currentTime + sampleDelay()
                    );
                job.nextRunAt = nextRunAt > currentTime ? nextRunAt : currentTime + sampleDelay();
                return finishOrSchedule(job);
            }

            const task = job.pending.splice(taskIndex, 1)[0];
            job.inFlight = task;
            job.nextRunAt = currentTime + sampleDelay();
            job.lastError = '';
            job.lastErrorAt = 0;
            await writeJob(job);
            await scheduleAlarm(job.nextRunAt);

            let result = null;
            try {
                result = typeof enrich === 'function' ? await enrich(task) : null;
            } catch (error) {
                result = {
                    success: false,
                    error: error?.message || 'imported_channel_enrichment_failed',
                    errorCode: 'imported_channel_enrichment_failed'
                };
            }

            const enrichedChannel = result?.channelData || result?.channel || null;
            const complete = result?.success === true && Boolean(isComplete(enrichedChannel));
            const errorCode = text(result?.errorCode);
            const profileContextError = errorCode === 'profile_locked'
                || errorCode === 'target_profile_changed'
                || errorCode === 'target_profile_not_managed'
                || errorCode === 'profiles_unavailable';

            job.inFlight = null;
            if (!complete) {
                job.lastError = text(result?.error) || errorCode || 'incomplete_channel_metadata';
                job.lastErrorAt = now();
                if (profileContextError) {
                    job.pending.unshift({
                        ...task,
                        nextAttemptAt: 0
                    });
                    job.blockedReason = errorCode || 'profile_context_changed';
                    job.nextRunAt = 0;
                    await writeJob(job);
                    await stopWake();
                    return status(job);
                }

                const attempts = Math.min(
                    maxAttempts,
                    Math.max(0, Number(task.attempts) || 0) + 1
                );
                const retryDelay = attempts >= maxAttempts
                    ? maxRetryDelayMs
                    : Math.min(
                        maxRetryDelayMs,
                        retryDelayMs * (2 ** Math.min(attempts - 1, 2))
                    );
                // Keep incomplete rows queued even after the attempt counter
                // reaches its cap. A transient YouTube/CORS response must not
                // disappear from the job and be misreported as complete.
                job.pending.push({
                    ...task,
                    attempts,
                    nextAttemptAt: now() + retryDelay,
                    lastError: job.lastError,
                    lastErrorAt: job.lastErrorAt
                });
            } else {
                job.lastCompletedAt = now();
            }

            if (!job.pending.length) {
                await stopWake();
                await removeJob();
                return status(job);
            }

            const completionTime = now();
            const hasReadyPendingTask = job.pending.some(taskItem => {
                const targetProfileId = text(taskItem.targetProfileId) || activeProfileId;
                return canManageTarget(profiles, activeProfileId, targetProfileId)
                    && (Number(taskItem.nextAttemptAt) || 0) <= completionTime;
            });
            const earliestRetryAt = job.pending
                .map(taskItem => Number(taskItem.nextAttemptAt) || 0)
                .filter(value => value > completionTime)
                .reduce((earliest, value) => Math.min(earliest, value), Infinity);
            // Keep fresh rows moving at the normal 7–15 second cadence. A
            // future retry timestamp is only used when no other eligible row
            // is ready, so one failed channel cannot stall the whole import.
            job.nextRunAt = hasReadyPendingTask
                ? completionTime + sampleDelay()
                : (Number.isFinite(earliestRetryAt)
                    ? earliestRetryAt
                    : completionTime + sampleDelay());
            await writeJob(job);
            await scheduleWake(job.nextRunAt);
            return status(job);
        };

        const requestProcess = () => {
            if (processRequested || processing) return operationChain;
            processRequested = true;
            return enqueueOperation(async () => {
                processRequested = false;
                processing = true;
                try {
                    return await processQueue();
                } finally {
                    processing = false;
                }
            });
        };

        const sync = async ({ profileIds = [], allProfiles = false, unpause = false } = {}) => {
            const stored = await readJob();
            const profiles = await loadSnapshot();
            if (!profiles || !Object.keys(getProfileContext(profiles).profileMap).length) {
                const recovered = recoveredJob(stored);
                recovered.blockedReason = 'profiles_unavailable';
                recovered.nextRunAt = 0;
                if (recovered.pending.length || recovered.inFlight) {
                    await writeJob(recovered);
                }
                await stopWake();
                return status(recovered);
            }
            const { activeProfileId, profileMap } = getProfileContext(profiles);
            const requested = safeArray(profileIds).map(text).filter(Boolean);
            const scope = requested.length
                ? requested
                : (allProfiles ? Object.keys(profileMap) : [activeProfileId]);
            const candidates = collectCandidates(profiles, scope, false);
            let merged = mergeJob(stored, candidates, scope, profiles);
            if (unpause) {
                merged.paused = false;
                merged.pausedReason = '';
            }
            if (!merged.pending.length && !merged.inFlight) {
                await stopWake();
                await removeJob();
                return status(merged);
            }
            if (!merged.paused) merged.blockedReason = '';
            const syncTime = now();
            merged.pending = merged.pending.map(task => {
                const nextAttemptAt = Number(task.nextAttemptAt) || 0;
                return nextAttemptAt > syncTime + maxRetryDelayMs
                    ? { ...task, nextAttemptAt: syncTime }
                    : task;
            });
            const hasReadyTask = merged.pending.some(task => {
                const targetProfileId = text(task.targetProfileId) || activeProfileId;
                return canManageTarget(profiles, activeProfileId, targetProfileId)
                    && (Number(task.nextAttemptAt) || 0) <= syncTime;
            });
            const persistedDelay = (Number(merged.nextRunAt) || 0) - syncTime;
            // Recover jobs written by the previous implementation, where a
            // failed row could leave the entire import parked for six hours.
            // A short pacing delay remains valid; a long delay is only valid
            // when every manageable task is genuinely waiting for retry.
            merged.nextRunAt = hasReadyTask && persistedDelay > maxDelayMs
                ? syncTime
                : (merged.nextRunAt > syncTime ? merged.nextRunAt : syncTime);
            return finishOrSchedule(merged);
        };

        const start = (options = {}) => enqueueOperation(() => sync({
            profileIds: options.profileIds,
            allProfiles: false,
            unpause: true
        }));

        const resume = (options = {}) => enqueueOperation(() => sync({
            profileIds: options.profileIds,
            allProfiles: true,
            unpause: options.unpause === true
        }));

        const initialize = () => enqueueOperation(async () => {
            return sync({ allProfiles: true, unpause: false });
        });

        const pause = () => enqueueOperation(async () => {
            const stored = recoveredJob(await readJob());
            if (!stored.pending.length && !stored.inFlight) {
                await stopWake();
                await removeJob();
                return status(stored);
            }
            stored.paused = true;
            stored.pausedReason = 'user';
            stored.nextRunAt = 0;
            await writeJob(stored);
            await stopWake();
            return status(stored);
        });

        const explicitResume = () => resume({ unpause: true });

        const wake = () => enqueueOperation(async () => {
            const stored = recoveredJob(await readJob());
            if (!stored.pending.length && !stored.inFlight) {
                await stopWake();
                return status(stored);
            }
            if (stored.paused) {
                await stopWake();
                return status(stored);
            }
            return processQueue();
        });

        const profilesChanged = () => enqueueOperation(async () => {
            const stored = await readJob();
            if (!stored.pending.length && !stored.inFlight) return status(stored);
            return sync({ allProfiles: true, unpause: false });
        });

        const getStatus = async () => status(await readJob());

        const handleAlarm = (name) => {
            if (name !== alarmName) return false;
            requestProcess();
            return true;
        };

        return {
            start,
            resume,
            explicitResume,
            pause,
            wake,
            initialize,
            profilesChanged,
            getStatus,
            handleAlarm,
            constants: {
                jobKey,
                alarmName,
                minDelayMs,
                maxDelayMs,
                alarmFloorMs,
                retryDelayMs,
                maxRetryDelayMs,
                maxAttempts
            }
        };
    }

    global.FilterTubeImportedChannelEnrichment = { create };
})(globalThis);
