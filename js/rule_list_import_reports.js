/*
 * Persistent, source-agnostic rule-list import reports.
 *
 * Reports keep the original imported channel row once and a compact list of
 * targets. Runtime status is derived from the saved profile rules and the
 * background enrichment job, so reports do not drift when metadata completes
 * while the dashboard is closed.
 */
(function installFilterTubeRuleListImportReports(global) {
    'use strict';

    if (global.FilterTubeRuleListImportReports) return;

    const STORAGE_KEY = 'ftRuleListImportReportsV1';
    const ENRICHMENT_JOB_KEY = 'ftBlockTubeEnrichmentJobV1';
    const MAX_REPORTS = 12;
    const MAX_RETAINED_ROWS = 50000;

    function text(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function decode(value) {
        try {
            return decodeURIComponent(value);
        } catch (error) {
            return value;
        }
    }

    function normalizeIdentityValue(value) {
        const raw = text(value);
        if (!raw) return '';
        if (/^(?:id|handle|custom):/i.test(raw)) return raw.toLowerCase();
        const normalized = raw.replace(/^\/+/, '');
        const idMatch = normalized.match(/^(?:channel\/)?(UC[a-zA-Z0-9_-]{22})$/i);
        if (idMatch) return `id:${idMatch[1].toLowerCase()}`;
        if (/^@[A-Za-z0-9._-]{2,}$/.test(normalized)) {
            return `handle:${normalized.toLowerCase()}`;
        }
        const customMatch = normalized.match(/^(c|user)\/([^\s/?#]+)$/i);
        if (customMatch) {
            return `custom:${customMatch[1].toLowerCase()}/${decode(customMatch[2]).toLowerCase()}`;
        }
        try {
            const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
            const host = text(url.hostname).replace(/^www\./i, '').toLowerCase();
            if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return '';
            const parts = url.pathname.split('/').filter(Boolean).map(decode);
            if (parts[0]?.toLowerCase() === 'channel' && /^UC[a-zA-Z0-9_-]{22}$/.test(parts[1] || '')) {
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

    function identityKeys(value) {
        const item = safeObject(value);
        const values = typeof value === 'string'
            ? [value]
            : [
            item.id,
            ...safeArray(item.identityKeys),
            ...safeArray(item.alternateIds),
                item.handle,
                item.handleDisplay,
                item.canonicalHandle,
                item.customUrl,
                item.originalInput,
                item.value
            ];
        return [...new Set(values.map(normalizeIdentityValue).filter(Boolean))];
    }

    function isPlaceholderName(channel, value) {
        const name = text(value).toLowerCase();
        if (!name) return true;
        const aliases = [
            channel?.id,
            channel?.handle,
            channel?.handleDisplay,
            channel?.canonicalHandle,
            channel?.customUrl,
            channel?.originalInput
        ].map(item => text(item).toLowerCase()).filter(Boolean);
        return aliases.includes(name)
            || name.startsWith('@')
            || name.startsWith('c/')
            || name.startsWith('user/')
            || name.includes('youtube.com/');
    }

    function isCompleteChannel(channel) {
        const item = safeObject(channel);
        if (item.topicChannel === true) return true;
        const id = text(item.id);
        return /^UC[a-zA-Z0-9_-]{22}$/.test(id)
            && !isPlaceholderName(item, item.name)
            && Boolean(text(item.handle) || text(item.handleDisplay) || text(item.canonicalHandle) || text(item.customUrl))
            && Boolean(text(item.logo));
    }

    function normalizeTarget(value) {
        const item = safeObject(value);
        return {
            profileId: text(item.profileId) || 'default',
            profileName: text(item.profileName) || (text(item.profileId) === 'default' ? 'Default' : text(item.profileId)),
            surface: item.surface === 'kids' ? 'kids' : 'main',
            listType: item.listType === 'whitelist' ? 'whitelist' : 'blocklist'
        };
    }

    function targetKey(target) {
        const item = normalizeTarget(target);
        return `${item.profileId}:${item.surface}:${item.listType}`;
    }

    function normalizeIssue(value, index = 0) {
        const item = safeObject(value);
        return {
            id: text(item.id) || `issue-${index + 1}`,
            row: Math.max(0, Math.floor(Number(item.row) || 0)),
            value: text(item.value).slice(0, 500),
            reason: text(item.reason) || 'Row could not be imported',
            status: 'needs_attention'
        };
    }

    function normalizeEntry(value, index = 0) {
        const item = safeObject(value);
        const keys = identityKeys(item);
        const originalValue = text(item.originalValue || item.originalInput || item.value || item.id || item.name);
        const nameOnly = item.nameOnly === true || (!keys.length && Boolean(text(item.name || originalValue)));
        return {
            id: text(item.entryId || item.idForReport) || `channel-${index + 1}`,
            row: Math.max(0, Math.floor(Number(item.sourceRow || item.row) || 0)),
            originalValue: originalValue.slice(0, 500),
            name: text(item.name).slice(0, 300),
            identityKeys: keys,
            nameOnly
        };
    }

    function normalizeReport(value) {
        const item = safeObject(value);
        const createdAt = Math.max(0, Math.floor(Number(item.createdAt) || Date.now()));
        const targets = [];
        const seenTargets = new Set();
        safeArray(item.targets).forEach((target) => {
            const normalized = normalizeTarget(target);
            const key = targetKey(normalized);
            if (seenTargets.has(key)) return;
            seenTargets.add(key);
            targets.push(normalized);
        });
        return {
            version: 1,
            id: text(item.id) || `import-${createdAt.toString(36)}`,
            createdAt,
            updatedAt: Math.max(createdAt, Math.floor(Number(item.updatedAt) || createdAt)),
            label: text(item.label) || 'Rule list import',
            sourceFormat: text(item.sourceFormat) || 'unknown',
            sourceLabel: text(item.sourceLabel) || 'Imported list',
            sourceUrl: text(item.sourceUrl),
            targets,
            channels: safeArray(item.channels).map(normalizeEntry),
            issues: safeArray(item.issues).map(normalizeIssue),
            counts: {
                channels: Math.max(0, Math.floor(Number(item.counts?.channels) || 0)),
                keywords: Math.max(0, Math.floor(Number(item.counts?.keywords) || 0)),
                videoIds: Math.max(0, Math.floor(Number(item.counts?.videoIds) || 0)),
                added: Math.max(0, Math.floor(Number(item.counts?.added) || 0)),
                duplicates: Math.max(0, Math.floor(Number(item.counts?.duplicates) || 0)),
                skipped: Math.max(0, Math.floor(Number(item.counts?.skipped) || 0))
            }
        };
    }

    function getTargetChannels(profiles, target) {
        const normalized = normalizeTarget(target);
        const profile = safeObject(safeObject(profiles).profiles?.[normalized.profileId]);
        const surface = safeObject(profile[normalized.surface]);
        if (normalized.surface === 'kids') {
            return normalized.listType === 'whitelist'
                ? safeArray(surface.whitelistChannels)
                : safeArray(surface.blockedChannels);
        }
        return normalized.listType === 'whitelist'
            ? safeArray(surface.whitelistChannels)
            : safeArray(surface.channels || surface.blockedChannels);
    }

    function taskBelongsToTarget(task, target) {
        const normalizedTarget = normalizeTarget(target);
        if ((text(task?.targetProfileId) || 'default') !== normalizedTarget.profileId) return false;
        if ((task?.profile === 'kids' ? 'kids' : 'main') !== normalizedTarget.surface) return false;
        if ((task?.listType === 'whitelist' ? 'whitelist' : 'blocklist') !== normalizedTarget.listType) return false;
        return true;
    }

    function taskKeys(task) {
        return [...new Set([
            ...safeArray(task?.identityKeys).map(key => text(key).toLowerCase()),
            ...identityKeys({
            id: task?.id,
            originalInput: task?.input
            })
        ].filter(Boolean))];
    }

    function buildTargetContext(profiles, job, target) {
        const channelsByIdentity = new Map();
        const channelsByName = new Map();
        getTargetChannels(profiles, target).forEach((channel) => {
            identityKeys(channel).forEach(key => channelsByIdentity.set(key, channel));
            const name = text(channel?.name).toLowerCase();
            if (name && !channelsByName.has(name)) channelsByName.set(name, channel);
        });
        const pendingByIdentity = new Map();
        safeArray(safeObject(job).pending).forEach((task) => {
            if (!taskBelongsToTarget(task, target)) return;
            taskKeys(task).forEach(key => pendingByIdentity.set(key, task));
        });
        const inFlight = safeObject(job).inFlight;
        const inFlightKeys = taskBelongsToTarget(inFlight, target) ? new Set(taskKeys(inFlight)) : new Set();
        return { channelsByIdentity, channelsByName, pendingByIdentity, inFlightKeys };
    }

    function deriveTargetStatus(report, entry, target, context) {
        const keys = safeArray(entry.identityKeys);
        const channel = keys.map(key => context.channelsByIdentity.get(key)).find(Boolean)
            || (entry.nameOnly ? context.channelsByName.get(text(entry.name || entry.originalValue).toLowerCase()) : null);
        if (!channel) {
            return { status: 'needs_attention', reason: 'The saved rule is no longer present in this target.' };
        }
        if (entry.nameOnly) {
            return {
                status: 'needs_attention',
                reason: 'This is a name-only rule. Add a channel link or UC ID if you want exact channel identity and metadata.'
            };
        }
        if (isCompleteChannel(channel)) return { status: 'complete', reason: '' };

        if (keys.some(key => context.inFlightKeys.has(key))) {
            return { status: 'fetching', reason: 'Channel details are being fetched now.' };
        }
        const task = keys.map(key => context.pendingByIdentity.get(key)).find(Boolean);
        if (!task) {
            return {
                status: 'needs_attention',
                reason: 'The rule is active, but its incomplete metadata is not currently queued.'
            };
        }
        const attempts = Math.max(0, Math.floor(Number(task.attempts) || 0));
        if (attempts > 0) {
            return {
                status: 'retrying',
                attempts,
                nextAttemptAt: Math.max(0, Math.floor(Number(task.nextAttemptAt) || 0)),
                lastError: text(task.lastError) || 'YouTube returned incomplete channel details.',
                lastErrorAt: Math.max(0, Math.floor(Number(task.lastErrorAt) || 0))
            };
        }
        return { status: 'pending', reason: 'The rule is active; channel details are waiting in the paced queue.' };
    }

    const STATUS_PRIORITY = ['needs_attention', 'retrying', 'fetching', 'pending', 'complete'];

    function summarize(reportValue, { profiles = {}, job = {} } = {}) {
        const report = normalizeReport(reportValue);
        const contexts = new Map(report.targets.map(target => [targetKey(target), buildTargetContext(profiles, job, target)]));
        const rows = report.channels.map((entry) => {
            const targetStatuses = report.targets.map((target) => ({
                target,
                ...deriveTargetStatus(report, entry, target, contexts.get(targetKey(target)))
            }));
            const status = STATUS_PRIORITY.find(candidate => targetStatuses.some(row => row.status === candidate)) || 'complete';
            const firstRelevant = targetStatuses.find(row => row.status === status) || {};
            return {
                type: 'channel',
                ...entry,
                status,
                reason: text(firstRelevant.reason || firstRelevant.lastError),
                attempts: Math.max(0, Math.floor(Number(firstRelevant.attempts) || 0)),
                nextAttemptAt: Math.max(0, Math.floor(Number(firstRelevant.nextAttemptAt) || 0)),
                completedTargets: targetStatuses.filter(row => row.status === 'complete').length,
                targetCount: targetStatuses.length,
                targetStatuses
            };
        });
        report.issues.forEach((issue) => rows.push({ type: 'issue', ...issue }));
        const statuses = {
            complete: 0,
            pending: 0,
            fetching: 0,
            retrying: 0,
            needs_attention: 0
        };
        rows.forEach((row) => {
            if (Object.prototype.hasOwnProperty.call(statuses, row.status)) statuses[row.status] += 1;
        });
        return { report, rows, statuses };
    }

    function createStore({ storageGet, storageSet, maxReports = MAX_REPORTS, maxRetainedRows = MAX_RETAINED_ROWS } = {}) {
        const read = async () => {
            if (typeof storageGet !== 'function') return [];
            const result = await storageGet([STORAGE_KEY]);
            return safeArray(result?.[STORAGE_KEY] ?? result)
                .map(normalizeReport)
                .sort((a, b) => b.createdAt - a.createdAt);
        };
        const write = async (reports) => {
            if (typeof storageSet !== 'function') return false;
            const sorted = safeArray(reports)
                .map(normalizeReport)
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, Math.max(1, Math.floor(Number(maxReports) || MAX_REPORTS)));
            const normalized = [];
            let retainedRows = 0;
            const rowLimit = Math.max(1, Math.floor(Number(maxRetainedRows) || MAX_RETAINED_ROWS));
            sorted.forEach((report) => {
                const reportRows = report.channels.length + report.issues.length;
                if (normalized.length > 0 && retainedRows + reportRows > rowLimit) return;
                normalized.push(report);
                retainedRows += reportRows;
            });
            await storageSet({ [STORAGE_KEY]: normalized });
            return true;
        };
        return {
            read,
            async save(report) {
                const normalized = normalizeReport(report);
                const reports = (await read()).filter(item => item.id !== normalized.id);
                await write([normalized, ...reports]);
                return normalized;
            },
            async remove(reportId) {
                const id = text(reportId);
                const reports = (await read()).filter(item => item.id !== id);
                await write(reports);
                return true;
            }
        };
    }

    global.FilterTubeRuleListImportReports = {
        STORAGE_KEY,
        ENRICHMENT_JOB_KEY,
        normalizeIdentityValue,
        identityKeys,
        isCompleteChannel,
        normalizeReport,
        summarize,
        createStore
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
