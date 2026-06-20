(function (global) {
    'use strict';

    const MANAGED_CHANNEL_LIST_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

    function fallbackSafeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function fallbackGetProfileName(root, profileId) {
        const profile = fallbackSafeObject(fallbackSafeObject(root).profiles)[profileId];
        return typeof profile?.name === 'string' && profile.name.trim()
            ? profile.name.trim()
            : (profileId === 'default' ? 'Default' : 'Profile');
    }

    function makeHelpers(helpers = {}) {
        const safeObject = typeof helpers.safeObject === 'function' ? helpers.safeObject : fallbackSafeObject;
        return {
            safeObject,
            getAccountIds: typeof helpers.getAccountIds === 'function' ? helpers.getAccountIds : () => [],
            getChildrenForAccount: typeof helpers.getChildrenForAccount === 'function' ? helpers.getChildrenForAccount : () => [],
            canActiveProfileManageProfile: typeof helpers.canActiveProfileManageProfile === 'function' ? helpers.canActiveProfileManageProfile : () => false,
            summarizeManagedPolicyStateForProfile: typeof helpers.summarizeManagedPolicyStateForProfile === 'function'
                ? helpers.summarizeManagedPolicyStateForProfile
                : () => ({ localLabels: [], remoteScopeCount: 0, historyRowCount: 0, protectedRowCount: 0 }),
            getManagedTimeLimitPolicy: typeof helpers.getManagedTimeLimitPolicy === 'function' ? helpers.getManagedTimeLimitPolicy : () => null,
            getProfileName: typeof helpers.getProfileName === 'function' ? helpers.getProfileName : fallbackGetProfileName,
            getProfileType: typeof helpers.getProfileType === 'function' ? helpers.getProfileType : () => 'account',
            isProfileLocked: typeof helpers.isProfileLocked === 'function' ? helpers.isProfileLocked : () => false,
            viewingAccessLabel: typeof helpers.viewingAccessLabel === 'function' ? helpers.viewingAccessLabel : () => 'Main + Kids',
            managedTimeLimitLabel: typeof helpers.managedTimeLimitLabel === 'function' ? helpers.managedTimeLimitLabel : () => 'No limit',
            getManagedSyncTargetSummary: typeof helpers.getManagedSyncTargetSummary === 'function'
                ? helpers.getManagedSyncTargetSummary
                : () => ({
                    label: 'Pair device',
                    targetCount: 0,
                    readyCount: 0,
                    openCheckCount: 0,
                    revokedCount: 0,
                    staleCount: 0,
                    totalCount: 0,
                    sourceAckLabel: '',
                    liveReady: false,
                    localNetworkReady: false,
                    mailboxReady: false
                }),
            getManagedMailboxConfigSummary: typeof helpers.getManagedMailboxConfigSummary === 'function'
                ? helpers.getManagedMailboxConfigSummary
                : () => ({
                    configured: false,
                    label: 'Saved updates off',
                    detail: 'Send Update works when both devices are open. Saved updates are only for updates a protected device should collect after it opens.',
                    tone: 'warning'
                }),
            getManagedLocalNetworkConfigSummary: typeof helpers.getManagedLocalNetworkConfigSummary === 'function'
                ? helpers.getManagedLocalNetworkConfigSummary
                : () => ({
                    configured: false,
                    label: 'Bridge off',
                    detail: 'Home Bridge needs a FilterTube-compatible bridge you choose; Wi-Fi discovery is never authority.',
                    tone: 'warning'
                }),
            onAction: typeof helpers.onAction === 'function' ? helpers.onAction : null
        };
    }

    function buildManagedCommandCenterActionIntents(profileId, timePolicy, policySummary = {}) {
        const targetId = typeof profileId === 'string' ? profileId.trim() : '';
        if (!targetId) return [];
        const timeLimitActive = timePolicy?.enabled === true;
        const hasPendingExtraTimeRequest = policySummary.pendingExtraTimeRequest === true;
        const hasStaleManagedChannelList = policySummary.hasStaleManagedChannelList === true;
        const deviceAction = getManagedCommandCenterDeviceAction(targetId, policySummary);
        const hasReadyDeliveryPath = hasManagedCommandCenterReadyDeliveryPath(policySummary);
        const intents = [
            {
                action: 'edit_rules',
                label: 'Edit Rules',
                profileId: targetId,
                scope: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: false
            },
            {
                action: 'manage_channel_lists',
                label: 'Rule Lists',
                profileId: targetId,
                scope: 'channels',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            ...(hasStaleManagedChannelList ? [{
                action: 'check_stale_lists',
                label: 'Check Lists',
                profileId: targetId,
                scope: 'channels',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            }] : []),
            {
                action: 'view_history',
                label: 'History',
                profileId: targetId,
                scope: 'admin_history',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            ...(deviceAction ? [deviceAction] : []),
            ...(hasReadyDeliveryPath ? [{
                action: 'send_managed_policy',
                label: 'Send Update',
                profileId: targetId,
                scope: 'active',
                authority: 'managed_policy_provider_delivery',
                sensitiveAction: true
            }] : []),
            {
                action: timeLimitActive ? 'change_time_limit' : 'set_time_limit',
                label: timeLimitActive ? 'Change Time' : 'Set Time',
                profileId: targetId,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            }
        ];
        if (timeLimitActive) {
            intents.push({
                action: 'grant_extra_time',
                label: hasPendingExtraTimeRequest ? 'Grant Time' : 'Add Time',
                profileId: targetId,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            });
        }
        if ((Number(policySummary.remoteConflictCount) || 0) > 0) {
            intents.splice(2, 0, {
                action: 'review_conflicts',
                label: 'Review Conflict',
                profileId: targetId,
                scope: 'admin_history',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            });
        }
        return intents;
    }

    function hasManagedCommandCenterReadyDeliveryPath(policySummary = {}) {
        return (Number(policySummary.syncReadyCount ?? policySummary.readyCount) || 0) > 0
            || policySummary.syncLiveReady === true
            || policySummary.liveReady === true
            || policySummary.syncMailboxReady === true
            || policySummary.mailboxReady === true
            || policySummary.syncLocalNetworkReady === true
            || policySummary.localNetworkReady === true;
    }

    function getManagedCommandCenterDeviceAction(profileId, policySummary = {}) {
        const targetId = typeof profileId === 'string' ? profileId.trim() : '';
        if (!targetId || hasManagedCommandCenterReadyDeliveryPath(policySummary)) return null;
        const targetCount = Number(policySummary.syncTargetCount ?? policySummary.targetCount) || 0;
        const totalCount = Number(policySummary.syncTotalCount ?? policySummary.totalCount) || 0;
        const revokedCount = Number(policySummary.syncRevokedCount ?? policySummary.revokedCount) || 0;
        const staleCount = Number(policySummary.syncStaleCount ?? policySummary.staleCount) || 0;
        const hasBrokenSavedLink = revokedCount > 0 || staleCount > 0;
        const hasKnownDevice = targetCount > 0 || totalCount > 0 || hasBrokenSavedLink;
        const label = hasBrokenSavedLink
            ? 'Repair Pairing'
            : (hasKnownDevice ? 'Open Devices' : 'Pair Device');
        const title = hasBrokenSavedLink
            ? 'Open Family Device Updates to refresh the trusted link before sending protected-profile updates.'
            : (hasKnownDevice
                ? 'Open Family Device Updates with both devices available, then send after the verified link is ready.'
                : 'Open Family Device Updates to pair and verify another device before sending protected-profile updates.');
        return {
            action: 'pair_device',
            label,
            profileId: targetId,
            scope: 'device_pairing',
            authority: 'managed_pairing_navigation',
            sensitiveAction: false,
            title
        };
    }

    function normalizeCommandCenterNumber(value) {
        const num = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
    }

    function formatCommandCenterMinutes(seconds) {
        const total = normalizeCommandCenterNumber(seconds);
        if (total <= 0) return '0m';
        const minutes = Math.max(1, Math.ceil(total / 60));
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
    }

    function getLatestPendingExtraTimeRequest(profile) {
        const rows = Array.isArray(profile?.managedActionHistory) ? profile.managedActionHistory : [];
        for (let index = rows.length - 1; index >= 0; index -= 1) {
            const row = fallbackSafeObject(rows[index]);
            const actionType = typeof row.actionType === 'string' ? row.actionType.trim() : '';
            const scope = typeof row.scope === 'string' ? row.scope.trim() : '';
            if (scope !== 'time_limits') continue;
            if (actionType === 'policy.time_limit.update') return null;
            if (actionType !== 'policy.time_limit.request_extra') continue;
            if ((typeof row.result === 'string' ? row.result.trim() : '') !== 'requested') continue;
            const summary = fallbackSafeObject(row.summary);
            const surface = typeof summary.surface === 'string' && summary.surface.trim() === 'kids' ? 'Kids' : 'Main';
            const consumedSeconds = normalizeCommandCenterNumber(summary.consumedSeconds);
            const dailyBudgetSeconds = normalizeCommandCenterNumber(summary.dailyBudgetSeconds);
            return {
                row,
                label: `Time request: ${surface}`,
                detail: `${formatCommandCenterMinutes(consumedSeconds)} used of ${formatCommandCenterMinutes(dailyBudgetSeconds)}`
            };
        }
        return null;
    }

    function getManagedChannelListSummary(profile, safeObject = fallbackSafeObject) {
        const lists = new Map();
        const addRows = (rows, surfaceLabel) => {
            if (!Array.isArray(rows)) return;
            rows.forEach((row) => {
                const item = safeObject(row);
                const listId = typeof item.managedListId === 'string' ? item.managedListId.trim() : '';
                if (!listId) return;
                const existing = lists.get(listId) || {
                    id: listId,
                    name: typeof item.managedListName === 'string' && item.managedListName.trim()
                        ? item.managedListName.trim()
                        : 'Imported rule list',
                    rowCount: 0,
                    activeRowCount: 0,
                    pausedRowCount: 0,
                    sourceUrlCount: 0,
                    lastCheckedAt: 0,
                    contentHash: '',
                    sourceVersion: '',
                    sourceUpdatedLabel: '',
                    sourceTitle: '',
                    surfaces: new Set()
                };
                existing.rowCount += 1;
                if (item.managedListPaused === true) {
                    existing.pausedRowCount += 1;
                } else {
                    existing.activeRowCount += 1;
                }
                if (typeof item.managedListSourceUrl === 'string' && item.managedListSourceUrl.trim()) {
                    existing.sourceUrlCount += 1;
                }
                const checkedAt = Number(item.managedListLastCheckedAt || item.managedListImportedAt) || 0;
                if (checkedAt > existing.lastCheckedAt) existing.lastCheckedAt = checkedAt;
                if (!existing.contentHash && typeof item.managedListContentHash === 'string' && item.managedListContentHash.trim()) {
                    existing.contentHash = item.managedListContentHash.trim();
                }
                if (!existing.sourceVersion && typeof item.managedListSourceVersion === 'string' && item.managedListSourceVersion.trim()) {
                    existing.sourceVersion = item.managedListSourceVersion.trim();
                }
                if (!existing.sourceUpdatedLabel && typeof item.managedListSourceUpdatedLabel === 'string' && item.managedListSourceUpdatedLabel.trim()) {
                    existing.sourceUpdatedLabel = item.managedListSourceUpdatedLabel.trim();
                }
                if (!existing.sourceTitle && typeof item.managedListSourceTitle === 'string' && item.managedListSourceTitle.trim()) {
                    existing.sourceTitle = item.managedListSourceTitle.trim();
                }
                if (surfaceLabel) existing.surfaces.add(surfaceLabel);
                lists.set(listId, existing);
            });
        };
        const main = safeObject(profile?.main);
        const kids = safeObject(profile?.kids);
        addRows(main.channels, 'Main');
        addRows(main.whitelistChannels, 'Main');
        addRows(main.keywords, 'Main');
        addRows(main.whitelistKeywords, 'Main');
        addRows(kids.blockedChannels, 'Kids');
        addRows(kids.whitelistChannels, 'Kids');
        addRows(kids.blockedKeywords, 'Kids');
        addRows(kids.whitelistKeywords, 'Kids');
        const now = Date.now();
        const items = Array.from(lists.values()).map((item) => ({
            id: item.id,
            name: item.name,
            rowCount: item.rowCount,
            activeRowCount: item.activeRowCount,
            pausedRowCount: item.pausedRowCount,
            sourceUrlCount: item.sourceUrlCount,
            lastCheckedAt: item.lastCheckedAt,
            contentHash: item.contentHash,
            sourceVersion: item.sourceVersion,
            sourceUpdatedLabel: item.sourceUpdatedLabel,
            sourceTitle: item.sourceTitle,
            surfaces: Array.from(item.surfaces),
            urlBacked: item.sourceUrlCount > 0,
            stale: item.sourceUrlCount > 0
                && (!item.lastCheckedAt || (now - item.lastCheckedAt) >= MANAGED_CHANNEL_LIST_STALE_AFTER_MS)
        }));
        const rowCount = items.reduce((total, item) => total + item.rowCount, 0);
        const activeRowCount = items.reduce((total, item) => total + item.activeRowCount, 0);
        const pausedRowCount = items.reduce((total, item) => total + item.pausedRowCount, 0);
        const sourceUrlCount = items.reduce((total, item) => total + item.sourceUrlCount, 0);
        const staleListCount = items.filter(item => item.stale).length;
        const urlBackedListCount = items.filter(item => item.urlBacked).length;
        return {
            listCount: items.length,
            rowCount,
            activeRowCount,
            pausedRowCount,
            sourceUrlCount,
            urlBackedListCount,
            staleListCount,
            items
        };
    }

    function formatManagedChannelListChip(summary = {}) {
        const listCount = normalizeCommandCenterNumber(summary.listCount);
        if (!listCount) return '';
        const rowCount = normalizeCommandCenterNumber(summary.rowCount);
        const activeRowCount = normalizeCommandCenterNumber(summary.activeRowCount);
        const pausedRowCount = normalizeCommandCenterNumber(summary.pausedRowCount);
        const staleListCount = normalizeCommandCenterNumber(summary.staleListCount);
        const listLabel = listCount === 1 ? 'list' : 'lists';
        if (staleListCount > 0) return `${staleListCount} ${staleListCount === 1 ? 'list' : 'lists'} need refresh`;
        if (pausedRowCount > 0 && activeRowCount <= 0) return `${listCount} ${listLabel} paused`;
        if (pausedRowCount > 0) return `${listCount} ${listLabel} (${activeRowCount} on)`;
        return rowCount > 0 ? `${listCount} ${listLabel} (${rowCount})` : `${listCount} ${listLabel}`;
    }

    function formatManagedChannelListDetail(summary = {}) {
        const listCount = normalizeCommandCenterNumber(summary.listCount);
        if (!listCount || !Array.isArray(summary.items)) return '';
        const names = summary.items
            .map(item => typeof item?.name === 'string' ? item.name.trim() : '')
            .filter(Boolean)
            .slice(0, 2);
        const more = listCount > names.length ? ` +${listCount - names.length} more` : '';
        const latestChecked = summary.items.reduce((latest, item) => Math.max(latest, Number(item?.lastCheckedAt) || 0), 0);
        const checked = latestChecked ? `, checked ${new Date(latestChecked).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '';
        const sourceVersion = summary.items
            .map((item) => {
                const version = typeof item?.sourceVersion === 'string' ? item.sourceVersion.trim() : '';
                if (version) return `version ${version}`;
                const updated = typeof item?.sourceUpdatedLabel === 'string' ? item.sourceUpdatedLabel.trim() : '';
                return updated ? `updated ${updated}` : '';
            })
            .find(Boolean);
        const version = sourceVersion ? `, ${sourceVersion}` : '';
        const staleListCount = normalizeCommandCenterNumber(summary.staleListCount);
        const stale = staleListCount ? `, ${staleListCount} need refresh` : '';
        return names.length ? `${names.join(', ')}${more}${checked}${version}${stale}` : `${listCount} parent-approved ${listCount === 1 ? 'list' : 'lists'}${checked}${version}${stale}`;
    }

    function resolveManagedCommandCenterSyncState(item = {}) {
        const conflictCount = Number(item.remoteConflictCount) || 0;
        if (conflictCount > 0) {
            return {
                key: 'conflict',
                label: `${conflictCount} conflict${conflictCount === 1 ? '' : 's'}`,
                tone: 'danger'
            };
        }
        const targetCount = Number(item.syncTargetCount) || 0;
        const readyCount = Number(item.syncReadyCount) || 0;
        const revokedCount = Number(item.syncRevokedCount) || 0;
        const staleCount = Number(item.syncStaleCount) || 0;
        if (targetCount <= 0 && revokedCount > 0) {
            return {
                key: 'repair',
                label: `${revokedCount} need re-pairing`,
                tone: 'warning'
            };
        }
        if (targetCount <= 0 && staleCount > 0) {
            return {
                key: 'stale',
                label: `${staleCount} stale link${staleCount === 1 ? '' : 's'}`,
                tone: 'warning'
            };
        }
        if (targetCount <= 0) {
            return {
                key: 'no_device',
                label: 'Pair to sync',
                tone: 'muted'
            };
        }
        if (readyCount <= 0) {
            return {
                key: 'provider_pending',
                label: 'Open both devices',
                tone: 'warning'
            };
        }
        return {
            key: 'ready',
            label: 'Ready',
            tone: 'success'
        };
    }

    function resolveManagedCommandCenterDeliveryPreview(item = {}) {
        const conflictCount = Number(item.remoteConflictCount) || 0;
        if (conflictCount > 0) {
            return {
                key: 'conflict',
                label: 'Review conflict first',
                tone: 'danger'
            };
        }
        const targetCount = Number(item.syncTargetCount) || 0;
        const readyCount = Number(item.syncReadyCount) || 0;
        const revokedCount = Number(item.syncRevokedCount) || 0;
        const staleCount = Number(item.syncStaleCount) || 0;
        const totalCount = Number(item.syncTotalCount) || 0;
        if (targetCount <= 0 && revokedCount > 0) {
            return {
                key: 'repair',
                label: 'Re-pair trusted device',
                tone: 'warning'
            };
        }
        if (targetCount <= 0 && staleCount > 0) {
            return {
                key: 'stale',
                label: 'Refresh trusted device',
                tone: 'warning'
            };
        }
        if (targetCount <= 0 || totalCount <= 0) {
            return {
                key: 'pair_device',
                label: 'Pair only for another device',
                tone: 'muted'
            };
        }
        if (readyCount <= 0) {
            return {
                key: 'provider_needed',
                label: 'Open both devices',
                tone: 'warning'
            };
        }
        if (item.syncLiveReady === true) {
            return {
                key: 'live',
                label: readyCount > 1 ? `Send Update ready (${readyCount})` : 'Send Update ready',
                tone: 'success'
            };
        }
        if (item.syncLocalNetworkReady === true) {
            return {
                key: 'local_network',
                label: 'Home Bridge set up',
                tone: 'success'
            };
        }
        if (item.syncMailboxReady === true) {
            return {
                key: 'mailbox',
                label: 'Internet Pickup set up',
                tone: 'success'
            };
        }
        return {
            key: 'ready',
            label: 'Ready',
            tone: 'success'
        };
    }

    function describeManagedCommandCenterDeliveryPath(item = {}) {
        const targetCount = Number(item.syncTargetCount) || 0;
        const readyCount = Number(item.syncReadyCount) || 0;
        const revokedCount = Number(item.syncRevokedCount) || 0;
        const staleCount = Number(item.syncStaleCount) || 0;
        const totalCount = Number(item.syncTotalCount) || 0;
        if ((Number(item.remoteConflictCount) || 0) > 0) {
            return 'Resolve protected history conflict before pushing new policy.';
        }
        if (targetCount <= 0 && revokedCount > 0) {
            return 'This trusted link was revoked. Pair again before sending protected-profile updates.';
        }
        if (targetCount <= 0 && staleCount > 0) {
            return 'This trusted link is stale. Refresh pairing before sending protected-profile updates.';
        }
        if (targetCount <= 0 || totalCount <= 0) {
            return 'Local rules and time limits work here. Pair only when this profile also needs to update another device.';
        }
        if (readyCount <= 0) {
            return `${targetCount} verified ${targetCount === 1 ? 'device is' : 'devices are'} paired. Open parent and protected devices together, then Send Update.`;
        }
        const paths = [];
        if (item.syncLiveReady === true) paths.push('live Send Update');
        if (item.syncLocalNetworkReady === true) paths.push('Home Bridge');
        if (item.syncMailboxReady === true) paths.push('Internet Pickup');
        return paths.length
            ? `${targetCount} verified ${targetCount === 1 ? 'device can' : 'devices can'} receive by ${paths.join(' + ')}.`
            : `${readyCount} verified ${readyCount === 1 ? 'queue is' : 'queues are'} ready.`;
    }

    function buildManagedCommandCenterBulkActionIntents(rows = []) {
        const profileIds = (Array.isArray(rows) ? rows : [])
            .map(row => typeof row?.profileId === 'string' ? row.profileId.trim() : '')
            .filter(Boolean);
        if (!profileIds.length) return [];
        return [
            {
                action: 'bulk_edit_rules',
                label: 'Edit rules',
                group: 'rules',
                profileIds,
                scope: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: false
            },
            {
                action: 'bulk_add_keyword',
                label: 'Add keyword',
                group: 'rules',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_add_channel',
                label: 'Add channel',
                group: 'rules',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_manage_channel_lists',
                label: 'Rule lists',
                group: 'rules',
                profileIds,
                scope: 'channels',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_add_video',
                label: 'Add video ID',
                group: 'rules',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_send_managed_policy',
                label: 'Send Update',
                group: 'send',
                profileIds,
                scope: 'active',
                authority: 'managed_policy_provider_delivery',
                sensitiveAction: true
            },
            {
                action: 'bulk_set_time_limit',
                label: 'Set selected limit',
                group: 'time',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_disable_time_limit',
                label: 'Disable selected limits',
                group: 'time',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_grant_extra_time',
                label: 'Add selected time',
                group: 'time',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_allow_main_kids',
                label: 'Allow Main + Kids',
                group: 'access',
                profileIds,
                scope: 'viewing_space',
                viewingAccess: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_kids_only',
                label: 'Kids only',
                group: 'access',
                profileIds,
                scope: 'viewing_space',
                viewingAccess: 'kids_only',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_main_only',
                label: 'Main only',
                group: 'access',
                profileIds,
                scope: 'viewing_space',
                viewingAccess: 'main_only',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            }
        ];
    }

    function buildManagedCommandCenterSummary(profilesV4, { revealDetails = false, helpers = {} } = {}) {
        if (!revealDetails) {
            return {
                rows: [],
                bulkActionIntents: [],
                profileCount: 0,
                limitedCount: 0,
                remoteScopeCount: 0,
                historyRowCount: 0,
                protectedRowCount: 0,
                managedChannelListProfileCount: 0,
                managedChannelListCount: 0,
                managedChannelListRowCount: 0,
                managedChannelListStaleCount: 0,
                pendingExtraTimeRequestCount: 0,
                remoteConflictCount: 0
            };
        }
        const h = makeHelpers(helpers);
        const root = h.safeObject(profilesV4);
        const profiles = h.safeObject(root.profiles);
        const rows = [];
        const seen = new Set();
        const activeProfileId = typeof root.activeProfileId === 'string' ? root.activeProfileId.trim() : 'default';
        const addRow = (profileId, parentId) => {
            if (!profileId || profileId === 'default' || profileId === activeProfileId || seen.has(profileId)) return;
            if (!h.canActiveProfileManageProfile(root, profileId)) return;
            seen.add(profileId);
            const profile = h.safeObject(profiles[profileId]);
            const summary = h.summarizeManagedPolicyStateForProfile(profile);
            const syncTarget = h.getManagedSyncTargetSummary(profileId);
            const timePolicy = h.getManagedTimeLimitPolicy(profile);
            const pendingExtraTimeRequest = getLatestPendingExtraTimeRequest(profile);
            const managedChannelLists = getManagedChannelListSummary(profile, h.safeObject);
            const latestActionLabel = typeof summary.latestActionLabel === 'string' && summary.latestActionLabel.trim()
                ? summary.latestActionLabel.trim()
                : (summary.latestResult && summary.latestScope ? `${summary.latestResult}/${summary.latestScope}` : 'none');
            const syncLabel = summary.remoteScopeCount
                ? `Policy r${summary.latestRemoteRevision}`
                : (summary.localLabels.length ? 'Local managed' : 'No policy yet');
            const remoteConflictCount = summary.remoteConflictCount || 0;
            const row = {
                profileId,
                profileName: h.getProfileName(root, profileId),
                parentName: h.getProfileName(root, parentId || 'default'),
                locked: h.isProfileLocked(root, profileId),
                viewingAccess: h.viewingAccessLabel(profile),
                timeLimit: h.managedTimeLimitLabel(profile),
                timeLimited: !!timePolicy?.enabled,
                syncLabel,
                syncTargetLabel: syncTarget.label,
                syncTargetCount: syncTarget.targetCount,
                syncReadyCount: syncTarget.readyCount,
                syncOpenCheckCount: syncTarget.openCheckCount || 0,
                syncRevokedCount: syncTarget.revokedCount || 0,
                syncStaleCount: syncTarget.staleCount || 0,
                syncTotalCount: syncTarget.totalCount || syncTarget.targetCount || 0,
                syncSourceAckLabel: typeof syncTarget.sourceAckLabel === 'string' ? syncTarget.sourceAckLabel.trim() : '',
                syncLiveReady: syncTarget.liveReady === true,
                syncMailboxReady: syncTarget.mailboxReady === true,
                syncLocalNetworkReady: syncTarget.localNetworkReady === true,
                remoteScopeCount: summary.remoteScopeCount,
                historyRowCount: summary.historyRowCount,
                protectedRowCount: summary.protectedRowCount,
                remoteConflictCount,
                latestActionLabel,
                latestDeliveryLabel: typeof summary.latestDeliveryLabel === 'string' ? summary.latestDeliveryLabel.trim() : '',
                latestDeliveryTone: typeof summary.latestDeliveryTone === 'string' ? summary.latestDeliveryTone.trim() : '',
                managedChannelListCount: managedChannelLists.listCount,
                managedChannelListRowCount: managedChannelLists.rowCount,
                managedChannelListUrlCount: managedChannelLists.sourceUrlCount,
                managedChannelListStaleCount: managedChannelLists.staleListCount,
                managedChannelListLabel: formatManagedChannelListChip(managedChannelLists),
                managedChannelListDetail: formatManagedChannelListDetail(managedChannelLists),
                pendingExtraTimeRequestLabel: pendingExtraTimeRequest?.label || '',
                pendingExtraTimeRequestDetail: pendingExtraTimeRequest?.detail || '',
                pendingExtraTimeRequest: !!pendingExtraTimeRequest,
                actionIntents: buildManagedCommandCenterActionIntents(profileId, timePolicy, {
                    remoteConflictCount,
                    pendingExtraTimeRequest: !!pendingExtraTimeRequest,
                    hasUrlManagedChannelList: managedChannelLists.sourceUrlCount > 0,
                    hasStaleManagedChannelList: managedChannelLists.staleListCount > 0,
                    syncTargetCount: syncTarget.targetCount,
                    syncReadyCount: syncTarget.readyCount,
                    syncOpenCheckCount: syncTarget.openCheckCount,
                    syncRevokedCount: syncTarget.revokedCount,
                    syncStaleCount: syncTarget.staleCount,
                    syncTotalCount: syncTarget.totalCount,
                    syncLiveReady: syncTarget.liveReady,
                    syncMailboxReady: syncTarget.mailboxReady,
                    syncLocalNetworkReady: syncTarget.localNetworkReady
                })
            };
            row.deliveryPreview = resolveManagedCommandCenterDeliveryPreview(row);
            row.deliveryPathDetail = [
                describeManagedCommandCenterDeliveryPath(row),
                row.latestDeliveryLabel
            ].filter(Boolean).join(' ');
            rows.push(row);
        };
        h.getAccountIds(root).forEach((accountId) => {
            addRow(accountId, 'default');
            h.getChildrenForAccount(root, accountId).forEach((profileId) => {
                addRow(profileId, accountId);
            });
        });
        return rows.reduce((acc, row) => ({
            ...acc,
            profileCount: acc.profileCount + 1,
            limitedCount: acc.limitedCount + (row.timeLimited ? 1 : 0),
            syncReadyProfileCount: acc.syncReadyProfileCount + (row.syncReadyCount > 0 ? 1 : 0),
            syncRepairProfileCount: acc.syncRepairProfileCount + (row.syncTargetCount <= 0 && row.syncRevokedCount > 0 ? 1 : 0),
            syncStaleProfileCount: acc.syncStaleProfileCount + (row.syncTargetCount <= 0 && row.syncStaleCount > 0 ? 1 : 0),
            syncPendingProfileCount: acc.syncPendingProfileCount + (row.syncTargetCount > 0 && row.syncReadyCount <= 0 ? 1 : 0),
            noDeviceProfileCount: acc.noDeviceProfileCount + (row.syncTotalCount <= 0 ? 1 : 0),
            managedChannelListProfileCount: acc.managedChannelListProfileCount + (row.managedChannelListCount > 0 ? 1 : 0),
            managedChannelListCount: acc.managedChannelListCount + row.managedChannelListCount,
            managedChannelListRowCount: acc.managedChannelListRowCount + row.managedChannelListRowCount,
            managedChannelListStaleCount: acc.managedChannelListStaleCount + row.managedChannelListStaleCount,
            remoteScopeCount: acc.remoteScopeCount + row.remoteScopeCount,
            historyRowCount: acc.historyRowCount + row.historyRowCount,
            protectedRowCount: acc.protectedRowCount + row.protectedRowCount,
            pendingExtraTimeRequestCount: acc.pendingExtraTimeRequestCount + (row.pendingExtraTimeRequest ? 1 : 0),
            remoteConflictCount: acc.remoteConflictCount + row.remoteConflictCount
        }), {
            rows,
            bulkActionIntents: buildManagedCommandCenterBulkActionIntents(rows),
            mailboxConfig: h.getManagedMailboxConfigSummary(),
            localNetworkConfig: h.getManagedLocalNetworkConfigSummary(),
            profileCount: 0,
            limitedCount: 0,
            syncReadyProfileCount: 0,
            syncRepairProfileCount: 0,
            syncStaleProfileCount: 0,
            syncPendingProfileCount: 0,
            noDeviceProfileCount: 0,
            managedChannelListProfileCount: 0,
            managedChannelListCount: 0,
            managedChannelListRowCount: 0,
            managedChannelListStaleCount: 0,
            remoteScopeCount: 0,
            historyRowCount: 0,
            protectedRowCount: 0,
            pendingExtraTimeRequestCount: 0,
            remoteConflictCount: 0
        });
    }

    function renderManagedCommandCenter(profilesV4, { revealDetails = false, helpers = {} } = {}) {
        if (!revealDetails || !global.document) return null;
        const h = makeHelpers(helpers);
        const summary = buildManagedCommandCenterSummary(profilesV4, { revealDetails, helpers });
        const panel = document.createElement('section');
        panel.className = 'help-item ft-managed-command-center';
        panel.setAttribute('aria-label', 'Managed parent command center');

        const heading = document.createElement('div');
        heading.className = 'ft-managed-command-center__heading';
        const titleWrap = document.createElement('div');
        titleWrap.className = 'ft-managed-command-center__title-wrap';
        const title = document.createElement('div');
        title.className = 'help-item-title';
        title.textContent = 'Family Controls';
        const body = document.createElement('div');
        body.className = 'help-item-body';
        body.textContent = summary.profileCount > 0
            ? 'Pick a profile, set what it can watch, set daily time, and send the update only when another verified device needs it.'
            : 'Create one protected profile first. Then set rules, daily time, Main/Kids access, and optional device updates.';
        const meta = document.createElement('div');
        meta.className = 'ft-managed-command-center__meta';
        const setupNeeds = summary.noDeviceProfileCount
            + summary.syncRepairProfileCount
            + summary.syncStaleProfileCount
            + summary.syncPendingProfileCount;
        meta.textContent = summary.profileCount > 0
            ? `${summary.profileCount} ${summary.profileCount === 1 ? 'profile' : 'profiles'} | ${summary.syncReadyProfileCount} ready${setupNeeds ? ` | ${setupNeeds} need setup` : ''}${summary.pendingExtraTimeRequestCount ? ` | ${summary.pendingExtraTimeRequestCount} requests` : ''}`
            : 'Setup needed';
        meta.title = summary.profileCount > 0
            ? 'Protected profiles shown here can be managed only by the current parent/account authority.'
            : 'Create a protected profile first; verified-device update options appear after there is a profile to protect.';
        titleWrap.append(title, body);
        heading.append(titleWrap, meta);
        panel.appendChild(heading);

        if (!summary.rows.length) {
            const setup = document.createElement('div');
            setup.className = 'ft-managed-command-center__setup is-empty';

            const setupTitle = document.createElement('strong');
            setupTitle.className = 'ft-managed-command-center__setup-title';
            setupTitle.textContent = 'First setup';
            setupTitle.title = 'Use this from the parent/master profile. Child profiles do not receive admin controls.';

            const setupCopy = document.createElement('div');
            setupCopy.className = 'help-item-body';
            setupCopy.textContent = 'Create a protected profile, set what it can watch, then pair a verified device if updates need to reach another device.';

            const steps = document.createElement('ol');
            steps.className = 'ft-managed-command-center__setup-steps';
            [
                {
                    text: 'Create a protected profile',
                    title: 'The profile gets its own Main and Kids rules. The parent/account keeps policy authority.'
                },
                {
                    text: 'Set Main/Kids access and daily YouTube time',
                    title: 'The runtime gate enforces access and time limits on YouTube surfaces for that profile.'
                },
                {
                    text: 'Add keywords, channels, whitelist, or blocklist rules',
                    title: 'Rules are edited from the parent/account surface, not from the child surface.'
                },
                {
                    text: 'Pair another device only when it also needs these rules',
                    title: 'Send Update appears after a protected profile exists. Internet Pickup and Home Bridge stay optional.'
                }
            ].forEach((item) => {
                const step = document.createElement('li');
                step.textContent = item.text;
                step.title = item.title;
                steps.appendChild(step);
            });

            setup.append(setupTitle, setupCopy, steps);

            if (h.onAction) {
                const setupActions = document.createElement('div');
                setupActions.className = 'ft-managed-command-center__setup-actions';
                const activeProfileId = typeof summary.activeProfileId === 'string' && summary.activeProfileId.trim()
                    ? summary.activeProfileId.trim()
                    : (typeof profilesV4?.activeProfileId === 'string' && profilesV4.activeProfileId.trim() ? profilesV4.activeProfileId.trim() : 'default');
                const activeType = h.getProfileType(profilesV4, activeProfileId);
                if (activeType === 'account') {
                    const createChildBtn = document.createElement('button');
                    createChildBtn.className = 'btn-primary';
                    createChildBtn.type = 'button';
                    createChildBtn.textContent = 'Create Protected Profile';
                    createChildBtn.title = 'Creates a protected profile owned by the active parent/account profile.';
                    createChildBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        Promise.resolve(h.onAction({
                            action: 'create_child_profile',
                            scope: 'managed_profile_setup',
                            authority: 'delegated_runtime_gate',
                            sensitiveAction: true
                        })).catch(() => {});
                    });
                    setupActions.appendChild(createChildBtn);
                }
                if (activeProfileId === 'default') {
                    const createAccountBtn = document.createElement('button');
                    createAccountBtn.className = 'btn-secondary';
                    createAccountBtn.type = 'button';
                    createAccountBtn.textContent = 'Create Account';
                    createAccountBtn.title = 'Creates an independent account profile that Master can later manage.';
                    createAccountBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        Promise.resolve(h.onAction({
                            action: 'create_account',
                            scope: 'managed_profile_setup',
                            authority: 'delegated_runtime_gate',
                            sensitiveAction: true
                        })).catch(() => {});
                    });
                    setupActions.appendChild(createAccountBtn);
                }
                if (setupActions.children.length) setup.appendChild(setupActions);
            }

            const setupNote = document.createElement('div');
            setupNote.className = 'ft-managed-command-center__setup-note';
            setupNote.textContent = 'If the protected profile stays on this device, no device pairing is needed. Pair only when another verified device should receive the same parent-approved rules.';
            setupNote.title = 'Those options do not grant authority; a trusted profile link and local validation still decide whether an update applies.';
            setup.appendChild(setupNote);
            panel.appendChild(setup);
            return panel;
        }

        const strip = document.createElement('div');
        strip.className = 'ft-managed-command-center__strip';
        [
            { label: 'Profiles', value: summary.profileCount, tone: 'neutral', title: 'Profiles this parent/account can manage.', always: true },
            { label: 'Ready devices', value: summary.syncReadyProfileCount, tone: summary.syncReadyProfileCount ? 'success' : 'neutral', title: 'Profiles with a verified device path available now.', always: true },
            { label: 'Rule lists', value: summary.managedChannelListProfileCount, tone: 'success', title: 'Protected profiles with parent-approved channel or keyword lists.' },
            { label: 'Needs pairing', value: summary.noDeviceProfileCount + summary.syncRepairProfileCount + summary.syncStaleProfileCount, tone: 'warning', title: 'Profiles that need a verified device, refreshed trust, or re-pairing before remote updates.' },
            { label: 'Time requests', value: summary.pendingExtraTimeRequestCount, tone: 'warning', title: 'Protected profiles asking for more YouTube time.' },
            { label: 'Conflicts', value: summary.remoteConflictCount, tone: 'danger', title: 'Rejected or conflicting remote-policy history rows that need parent review.' }
        ].filter(item => item.always || (Number(item.value) || 0) > 0).forEach((item) => {
            const card = document.createElement('div');
            card.className = `ft-managed-command-center__strip-item is-${item.tone}`;
            card.title = item.title;
            const value = document.createElement('strong');
            value.textContent = String(Number(item.value) || 0);
            const label = document.createElement('span');
            label.textContent = item.label;
            card.append(value, label);
            strip.appendChild(card);
        });
        panel.appendChild(strip);

        const workflow = document.createElement('div');
        workflow.className = 'ft-managed-command-center__workflow';
        workflow.setAttribute('aria-label', 'Family Controls workflow');
        [
            {
                step: '1',
                label: 'Choose profile',
                detail: `${summary.profileCount} protected ${summary.profileCount === 1 ? 'profile' : 'profiles'} available`,
                tone: 'neutral',
                title: 'Choose the child, family member, or other protected profile you want to manage.'
            },
            {
                step: '2',
                label: 'Set rules & time',
                detail: summary.managedChannelListProfileCount > 0
                    ? 'Rules, lists, access, and time are ready to review'
                    : 'Use Rules, Lists, Set Time, and Main/Kids controls',
                tone: summary.managedChannelListProfileCount > 0 || summary.limitedCount > 0 ? 'success' : 'neutral',
                title: 'These actions change the selected protected profile after parent/account approval.'
            },
            {
                step: '3',
                label: 'Send to device',
                detail: summary.syncReadyProfileCount > 0
                    ? `${summary.syncReadyProfileCount} ${summary.syncReadyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path`
                    : 'Pair only when this profile also lives on another device',
                tone: summary.syncReadyProfileCount > 0 ? 'success' : 'warning',
                title: 'Local control works without remote delivery. Pairing is only needed for another device.'
            }
        ].forEach((item) => {
            const workflowItem = document.createElement('div');
            workflowItem.className = `ft-managed-command-center__workflow-item is-${item.tone}`;
            workflowItem.title = item.title;
            const step = document.createElement('strong');
            step.textContent = item.step;
            const copy = document.createElement('div');
            const label = document.createElement('span');
            label.textContent = item.label;
            const detail = document.createElement('small');
            detail.textContent = item.detail;
            copy.append(label, detail);
            workflowItem.append(step, copy);
            workflow.appendChild(workflowItem);
        });
        panel.appendChild(workflow);

        const mailbox = h.safeObject(summary.mailboxConfig);
        const localNetwork = h.safeObject(summary.localNetworkConfig);
        const hasProviderAction = typeof h.onAction === 'function';
        const shouldShowConfiguredProviderSetup = mailbox.configured === true || localNetwork.configured === true;
        const shouldShowProviderPrompt = summary.profileCount > 0
            && hasProviderAction
            && mailbox.configured !== true
            && localNetwork.configured !== true;
        if (shouldShowConfiguredProviderSetup || shouldShowProviderPrompt) {
            const providerIntro = document.createElement('div');
            providerIntro.className = 'ft-managed-command-center__provider-intro';
            providerIntro.textContent = 'Optional saved updates';
            providerIntro.title = 'Send Update is the normal path. Add this only when the other device cannot be open at the same time.';
            panel.appendChild(providerIntro);
        }

        if (shouldShowProviderPrompt) {
            const providerPrompt = document.createElement('details');
            providerPrompt.className = 'ft-managed-command-center__provider-prompt';
            providerPrompt.title = 'Most parents can skip this. Use only when live Send Update is not enough.';
            const providerSummary = document.createElement('summary');
            providerSummary.className = 'ft-managed-command-center__provider-summary';
            const promptCopy = document.createElement('div');
            promptCopy.className = 'ft-managed-command-center__provider-copy';
            const promptTitle = document.createElement('strong');
            promptTitle.textContent = 'Need updates to arrive later?';
            const promptDetail = document.createElement('span');
            promptDetail.textContent = 'Optional. Use Send Update when both devices can be open together.';
            promptCopy.append(promptTitle, promptDetail);
            providerSummary.appendChild(promptCopy);
            const promptActions = document.createElement('div');
            promptActions.className = 'ft-managed-command-center__provider-prompt-actions';
            const promptBody = document.createElement('div');
            promptBody.className = 'ft-managed-command-center__provider-prompt-body';
            const promptBodyText = document.createElement('span');
            promptBodyText.textContent = 'Normal control is live: open both devices, pair, verify, send. Add one of these only if your family or school runs a compatible pickup service.';
            [
                {
                    label: 'Set Up Internet Pickup',
                    title: 'For protected devices that should collect waiting approved updates next time they open.',
                    action: 'configure_mailbox',
                    scope: 'mailbox_provider'
                },
                {
                    label: 'Set Up Home Bridge',
                    title: 'For an explicit FilterTube bridge you run on your home or school network. Wi-Fi alone never grants control.',
                    action: 'configure_local_network',
                    scope: 'local_network_provider'
                }
            ].forEach((item) => {
                const button = document.createElement('button');
                button.className = 'btn-secondary';
                button.type = 'button';
                button.textContent = item.label;
                button.title = item.title;
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    Promise.resolve(h.onAction({
                        action: item.action,
                        scope: item.scope,
                        authority: 'managed_policy_provider_delivery',
                        sensitiveAction: true
                    })).catch(() => {});
                });
                promptActions.appendChild(button);
            });
            promptBody.append(promptBodyText, promptActions);
            providerPrompt.append(providerSummary, promptBody);
            panel.appendChild(providerPrompt);
        }

        if (shouldShowConfiguredProviderSetup && mailbox.configured === true) {
            const mailboxPanel = document.createElement('div');
            mailboxPanel.className = `ft-managed-command-center__provider is-${mailbox.tone || (mailbox.configured ? 'success' : 'warning')}`;
            mailboxPanel.title = 'Optional: use this only when parent updates must wait for an offline protected device to open later.';
            const mailboxCopy = document.createElement('div');
            mailboxCopy.className = 'ft-managed-command-center__provider-copy';
            const mailboxTitle = document.createElement('strong');
            mailboxTitle.textContent = mailbox.configured
                ? (mailbox.label || 'Internet Pickup is set up')
                : 'Internet Pickup is off';
            const mailboxDetail = document.createElement('span');
            mailboxDetail.textContent = summary.profileCount > 0
                ? (mailbox.detail || 'Use this when a parent update should wait until the protected device opens.')
                : 'Create a protected profile first. Internet Pickup is optional and only useful after a protected device is paired.';
            const mailboxRoute = document.createElement('span');
            mailboxRoute.textContent = mailbox.configured
                ? 'The protected device still accepts only trusted parent updates.'
                : 'Leave this off when live Send Update is enough.';
            mailboxCopy.append(mailboxTitle, mailboxDetail, mailboxRoute);
            mailboxPanel.appendChild(mailboxCopy);
            if (h.onAction) {
                const mailboxButton = document.createElement('button');
                mailboxButton.className = 'btn-secondary';
                mailboxButton.type = 'button';
                mailboxButton.textContent = mailbox.configured ? 'Edit Internet Pickup' : 'Set Up Internet Pickup';
                mailboxButton.title = 'Requires parent/account re-auth. Use only when updates must wait for the protected device to open later.';
                mailboxButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    Promise.resolve(h.onAction({
                        action: 'configure_mailbox',
                        scope: 'mailbox_provider',
                        authority: 'managed_policy_provider_delivery',
                        sensitiveAction: true
                    })).catch(() => {});
                });
                mailboxPanel.appendChild(mailboxButton);
            }
            panel.appendChild(mailboxPanel);
        }

        if (shouldShowConfiguredProviderSetup && localNetwork.configured === true) {
            const localPanel = document.createElement('div');
            localPanel.className = `ft-managed-command-center__provider is-${localNetwork.tone || (localNetwork.configured ? 'success' : 'warning')}`;
            localPanel.title = 'Optional: use this only for an explicitly configured Home Bridge. Being on the same network is not authority.';
            const localCopy = document.createElement('div');
            localCopy.className = 'ft-managed-command-center__provider-copy';
            const localTitle = document.createElement('strong');
            localTitle.textContent = localNetwork.configured
                ? (localNetwork.label || 'Bridge is set up')
                : 'Bridge is off';
            const localDetail = document.createElement('span');
            localDetail.textContent = summary.profileCount > 0
                ? (localNetwork.detail || 'Use this only with a trusted FilterTube-compatible bridge on your home or school network.')
                : 'Create a protected profile first. Home Bridge is optional and never replaces parent trust.';
            const localRoute = document.createElement('span');
            localRoute.textContent = localNetwork.configured
                ? 'The protected device still accepts only trusted parent updates.'
                : 'Leave this off unless you run a trusted FilterTube bridge; Wi-Fi alone never grants control.';
            localCopy.append(localTitle, localDetail, localRoute);
            localPanel.appendChild(localCopy);
            if (h.onAction) {
                const localButton = document.createElement('button');
                localButton.className = 'btn-secondary';
                localButton.type = 'button';
                localButton.textContent = localNetwork.configured ? 'Edit Home Bridge' : 'Set Up Home Bridge';
                localButton.title = 'Requires parent/account re-auth. Being on the same network alone cannot change protected rules.';
                localButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    Promise.resolve(h.onAction({
                        action: 'configure_local_network',
                        scope: 'local_network_provider',
                        authority: 'managed_policy_provider_delivery',
                        sensitiveAction: true
                    })).catch(() => {});
                });
                localPanel.appendChild(localButton);
            }
            panel.appendChild(localPanel);
        }

        const selectedProfiles = new Set();
        const selectedProfileInputs = [];
        const bulkIntents = buildManagedCommandCenterBulkActionIntents(summary.rows);
        const showBulkControls = h.onAction && bulkIntents.length && summary.rows.length > 1;
        let bulkDetailsEl = null;
        if (showBulkControls) {
            const bulkBar = document.createElement('details');
            bulkBar.className = 'ft-managed-command-center__bulk';
            bulkDetailsEl = bulkBar;
            const bulkSummary = document.createElement('summary');
            bulkSummary.className = 'ft-managed-command-center__bulk-summary';
            const bulkSummaryCopy = document.createElement('span');
            bulkSummaryCopy.className = 'ft-managed-command-center__bulk-summary-copy';
            bulkSummaryCopy.textContent = 'Manage several profiles at once';
            const bulkStatus = document.createElement('span');
            bulkStatus.className = 'ft-managed-command-center__bulk-status';
            bulkSummary.append(bulkSummaryCopy, bulkStatus);
            const bulkContent = document.createElement('div');
            bulkContent.className = 'ft-managed-command-center__bulk-content';
            const bulkSelectControls = document.createElement('div');
            bulkSelectControls.className = 'ft-managed-command-center__bulk-select';
            const selectAllButton = document.createElement('button');
            selectAllButton.className = 'btn-secondary';
            selectAllButton.type = 'button';
            selectAllButton.textContent = 'Select all';
            selectAllButton.title = 'Select every protected profile shown in this command center.';
            const selectReadyButton = document.createElement('button');
            selectReadyButton.className = 'btn-secondary';
            selectReadyButton.type = 'button';
            selectReadyButton.textContent = 'Select ready devices';
            selectReadyButton.title = 'Select protected profiles that already have a verified delivery path.';
            const selectRequestsButton = document.createElement('button');
            selectRequestsButton.className = 'btn-secondary';
            selectRequestsButton.type = 'button';
            selectRequestsButton.textContent = 'Select time requests';
            selectRequestsButton.title = 'Select protected profiles with pending extra-time requests.';
            const clearSelectionButton = document.createElement('button');
            clearSelectionButton.className = 'btn-secondary';
            clearSelectionButton.type = 'button';
            clearSelectionButton.textContent = 'Clear';
            clearSelectionButton.title = 'Clear selected protected profiles.';
            const bulkActionGroups = [
                { key: 'rules', label: 'Rules' },
                { key: 'send', label: 'Send' },
                { key: 'time', label: 'Time' },
                { key: 'access', label: 'Access' }
            ];
            const bulkButtons = [];
            const createBulkButton = (intent) => {
                const button = document.createElement('button');
                button.className = 'btn-secondary';
                button.type = 'button';
                button.textContent = intent.label;
                button.dataset.filtertubeBulkAction = intent.action || '';
                button.dataset.filtertubeDefaultLabel = intent.label || '';
                button.disabled = true;
                button.title = 'Select one or more protected profiles first. Requires parent/account re-auth.';
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    const profileIds = Array.from(selectedProfiles);
                    if (!profileIds.length) return;
                    Promise.resolve(h.onAction({ ...intent, profileIds })).catch(() => {});
                });
                bulkButtons.push(button);
                return button;
            };
            const bulkActionWrap = document.createElement('div');
            bulkActionWrap.className = 'ft-managed-command-center__bulk-actions';
            bulkActionGroups.forEach((group) => {
                const groupIntents = bulkIntents.filter(intent => intent.group === group.key);
                if (!groupIntents.length) return;
                const groupEl = document.createElement('div');
                groupEl.className = `ft-managed-command-center__bulk-group is-${group.key}`;
                const label = document.createElement('span');
                label.className = 'ft-managed-command-center__bulk-group-label';
                label.textContent = group.label;
                groupEl.appendChild(label);
                groupIntents.forEach(intent => {
                    groupEl.appendChild(createBulkButton(intent));
                });
                bulkActionWrap.appendChild(groupEl);
            });
            const updateBulkState = () => {
                const count = selectedProfiles.size;
                const requestInputs = selectedProfileInputs.filter(input => input.dataset.filtertubePendingTimeRequest === 'true');
                const selectedRequestCount = requestInputs.filter(input => input.checked).length;
                bulkStatus.textContent = count
                    ? `${count} selected${selectedRequestCount ? ` | ${selectedRequestCount} time ${selectedRequestCount === 1 ? 'request' : 'requests'}` : ''}`
                    : 'Optional: select profiles below to edit or send together';
                bulkBar.classList.toggle('has-selection', count > 0);
                bulkButtons.forEach(button => {
                    button.disabled = count === 0;
                    if (button.dataset.filtertubeBulkAction === 'bulk_grant_extra_time') {
                        const label = selectedRequestCount
                            ? 'Grant time requests'
                            : 'Add extra time';
                        button.textContent = label;
                        button.title = count === 0
                            ? 'Select one or more protected profiles first. Requires parent/account re-auth.'
                            : selectedRequestCount
                                ? `Grant temporary parent-approved YouTube time to selected profiles. ${selectedRequestCount} selected ${selectedRequestCount === 1 ? 'profile has' : 'profiles have'} asked for more time. Requires parent/account re-auth.`
                                : 'Add temporary parent-approved YouTube time to selected profiles with active limits. Requires parent/account re-auth.';
                    }
                });
                clearSelectionButton.disabled = count === 0;
                selectAllButton.disabled = selectedProfileInputs.length > 0 && count === selectedProfileInputs.length;
                const readyInputs = selectedProfileInputs.filter(input => input.dataset.filtertubeSyncReady === 'true');
                const selectedReadyCount = readyInputs.filter(input => input.checked).length;
                selectReadyButton.disabled = readyInputs.length === 0 || selectedReadyCount === readyInputs.length;
                selectRequestsButton.disabled = requestInputs.length === 0 || selectedRequestCount === requestInputs.length;
            };
            selectAllButton.addEventListener('click', (event) => {
                event.preventDefault();
                selectedProfileInputs.forEach((input) => {
                    input.checked = true;
                    const profileId = typeof input.dataset.filtertubeProfileId === 'string' ? input.dataset.filtertubeProfileId.trim() : '';
                    if (profileId) selectedProfiles.add(profileId);
                });
                updateBulkState();
            });
            selectRequestsButton.addEventListener('click', (event) => {
                event.preventDefault();
                selectedProfileInputs.forEach((input) => {
                    const requested = input.dataset.filtertubePendingTimeRequest === 'true';
                    input.checked = requested;
                    const profileId = typeof input.dataset.filtertubeProfileId === 'string' ? input.dataset.filtertubeProfileId.trim() : '';
                    if (!profileId) return;
                    if (requested) {
                        selectedProfiles.add(profileId);
                    } else {
                        selectedProfiles.delete(profileId);
                    }
                });
                updateBulkState();
            });
            selectReadyButton.addEventListener('click', (event) => {
                event.preventDefault();
                selectedProfileInputs.forEach((input) => {
                    const ready = input.dataset.filtertubeSyncReady === 'true';
                    input.checked = ready;
                    const profileId = typeof input.dataset.filtertubeProfileId === 'string' ? input.dataset.filtertubeProfileId.trim() : '';
                    if (!profileId) return;
                    if (ready) {
                        selectedProfiles.add(profileId);
                    } else {
                        selectedProfiles.delete(profileId);
                    }
                });
                updateBulkState();
            });
            clearSelectionButton.addEventListener('click', (event) => {
                event.preventDefault();
                selectedProfileInputs.forEach((input) => {
                    input.checked = false;
                });
                selectedProfiles.clear();
                updateBulkState();
            });
            bulkSelectControls.append(selectAllButton, selectReadyButton, selectRequestsButton, clearSelectionButton);
            bulkContent.append(bulkSelectControls, bulkActionWrap);
            bulkBar.append(bulkSummary, bulkContent);
            panel.appendChild(bulkBar);
            panel.__filtertubeUpdateManagedBulkState = updateBulkState;
        }

        const list = document.createElement('div');
        list.className = 'ft-managed-command-center__list';
        summary.rows.forEach((item) => {
            const syncState = resolveManagedCommandCenterSyncState(item);
            const row = document.createElement('div');
            row.className = [
                'ft-managed-command-center__row',
                item.locked ? 'is-locked' : '',
                syncState.key ? `is-sync-${syncState.key}` : ''
            ].filter(Boolean).join(' ');
            const selector = document.createElement('input');
            selector.className = 'ft-managed-command-center__select';
            selector.type = 'checkbox';
            selector.setAttribute('aria-label', `Select ${item.profileName} for bulk managed update`);
            selector.dataset.filtertubeProfileId = item.profileId;
            selector.dataset.filtertubeSyncReady = item.syncReadyCount > 0 ? 'true' : 'false';
            selector.dataset.filtertubePendingTimeRequest = item.pendingExtraTimeRequest ? 'true' : 'false';
            selectedProfileInputs.push(selector);
            selector.addEventListener('change', () => {
                if (selector.checked) {
                    selectedProfiles.add(item.profileId);
                    if (bulkDetailsEl) bulkDetailsEl.open = true;
                } else {
                    selectedProfiles.delete(item.profileId);
                }
                if (typeof panel.__filtertubeUpdateManagedBulkState === 'function') {
                    panel.__filtertubeUpdateManagedBulkState();
                }
            });
            const name = document.createElement('strong');
            name.textContent = item.profileName;
            const owner = document.createElement('span');
            owner.textContent = `Parent: ${item.parentName}${item.locked ? ' | profile PIN on' : ''}`;
            const profileCell = document.createElement('div');
            profileCell.className = showBulkControls
                ? 'ft-managed-command-center__profile'
                : 'ft-managed-command-center__profile has-no-selection';
            const labelWrap = document.createElement('div');
            labelWrap.append(name, owner);
            if (showBulkControls) {
                profileCell.append(selector, labelWrap);
            } else {
                profileCell.appendChild(labelWrap);
            }
            const statusCell = document.createElement('div');
            statusCell.className = 'ft-managed-command-center__status';
            [
                { label: item.viewingAccess, tone: 'neutral', title: 'Allowed YouTube space for this protected profile.' },
                { label: item.timeLimit, tone: item.timeLimited ? 'warning' : 'neutral', title: 'Daily YouTube time for this protected profile.' },
                item.managedChannelListLabel ? { label: item.managedChannelListLabel, tone: 'success', title: item.managedChannelListDetail || 'Parent-approved lists attached to this profile.' } : null,
                { label: syncState.label, tone: syncState.tone, title: item.deliveryPathDetail || 'Device delivery status.' },
                item.syncTargetCount > 0 && item.syncOpenCheckCount > 0 ? { label: 'Automatic saved updates', tone: 'success', title: 'This verified device can check for newer signed parent updates when the protected profile opens.' } : null,
                item.remoteScopeCount ? { label: item.syncLabel, tone: 'success', title: 'Latest accepted protected-profile policy revision.' } : null,
                item.pendingExtraTimeRequestLabel ? { label: item.pendingExtraTimeRequestLabel, tone: 'warning', title: item.pendingExtraTimeRequestDetail || 'This profile asked for more time.' } : null,
                item.syncTargetCount > 0 && item.latestDeliveryLabel ? { label: item.latestDeliveryLabel, tone: item.latestDeliveryTone || 'neutral', title: 'Latest protected delivery attempt.' } : null,
                item.syncSourceAckLabel ? { label: `Ack: ${item.syncSourceAckLabel}`, tone: 'neutral', title: 'Latest redacted acknowledgement from a protected device.' } : null
            ].filter(Boolean).forEach((chip) => {
                const status = document.createElement('span');
                status.className = `ft-managed-command-center__chip is-${chip.tone}`;
                status.textContent = chip.label;
                if (chip.title) status.title = chip.title;
                statusCell.appendChild(status);
            });
            row.appendChild(statusCell);
            const hasVerifiedDevice = item.syncTargetCount > 0;
            const hasReadyDeliveryPath = hasManagedCommandCenterReadyDeliveryPath(item);
            const detailsWrap = document.createElement('div');
            detailsWrap.className = 'ft-managed-command-center__details';
            [
                hasVerifiedDevice
                    ? { label: 'Device sync', value: item.deliveryPreview?.label || 'Send when ready', note: item.deliveryPathDetail }
                    : { label: 'Device sync', value: 'Not paired', note: 'Local rules and time limits work here. Pair only when this profile must also update another device.' },
                hasVerifiedDevice ? {
                    label: 'Automatic saved updates',
                    value: item.syncOpenCheckCount > 0
                        ? (item.syncOpenCheckCount >= item.syncTargetCount ? 'On when opened' : `On for ${item.syncOpenCheckCount}/${item.syncTargetCount}`)
                        : 'Off',
                    note: item.syncOpenCheckCount > 0
                        ? 'When optional later delivery is configured, this protected profile checks for newer signed parent updates as it opens.'
                        : 'Live Send Update still works. Automatic saved updates only matter when optional later delivery is configured.'
                } : null,
                item.managedChannelListDetail ? { label: 'Lists', value: item.managedChannelListDetail } : null,
                hasVerifiedDevice ? { label: 'Verified device', value: item.syncTargetLabel } : null,
                item.pendingExtraTimeRequestDetail ? { label: 'Request', value: item.pendingExtraTimeRequestDetail } : null,
                item.remoteConflictCount > 0 ? { label: 'Conflict', value: `${item.remoteConflictCount} needs review` } : null
            ].filter(Boolean).forEach((detail) => {
                const cell = document.createElement('div');
                cell.className = 'ft-managed-command-center__detail';
                const detailLabel = document.createElement('span');
                detailLabel.textContent = detail.label;
                const detailValue = document.createElement('strong');
                detailValue.textContent = detail.value;
                cell.append(detailLabel, detailValue);
                if (detail.note) {
                    const note = document.createElement('small');
                    note.className = 'ft-managed-command-center__detail-note';
                    note.textContent = detail.note;
                    cell.appendChild(note);
                }
                detailsWrap.appendChild(cell);
            });
            row.appendChild(detailsWrap);
            if (h.onAction && Array.isArray(item.actionIntents) && item.actionIntents.length) {
                const actionWrap = document.createElement('div');
                actionWrap.className = 'ft-managed-command-center__actions';
                item.actionIntents
                    .filter(intent => !(intent.action === 'send_managed_policy' && !hasReadyDeliveryPath))
                    .forEach((intent) => {
                    const button = document.createElement('button');
                    button.className = 'btn-secondary';
                    button.type = 'button';
                    button.textContent = intent.label;
                    button.dataset.filtertubeManagedAction = intent.action;
                    button.dataset.filtertubeProfileId = intent.profileId;
                    button.title = intent.title || (intent.sensitiveAction
                        ? 'Requires parent/account re-auth before protected details or policy changes.'
                        : 'Uses the existing parent-managed runtime gate.');
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        Promise.resolve(h.onAction({ ...intent })).catch(() => {});
                    });
                    actionWrap.appendChild(button);
                });
                row.appendChild(actionWrap);
            }
            row.prepend(profileCell);
            list.appendChild(row);
        });
        panel.appendChild(list);
        if (typeof panel.__filtertubeUpdateManagedBulkState === 'function') {
            panel.__filtertubeUpdateManagedBulkState();
        }
        return panel;
    }

    global.FilterTubeManagedParentCommandCenter = {
        buildSummary: buildManagedCommandCenterSummary,
        buildActionIntents: buildManagedCommandCenterActionIntents,
        buildBulkActionIntents: buildManagedCommandCenterBulkActionIntents,
        resolveDeliveryPreview: resolveManagedCommandCenterDeliveryPreview,
        describeDeliveryPath: describeManagedCommandCenterDeliveryPath,
        render: renderManagedCommandCenter
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
