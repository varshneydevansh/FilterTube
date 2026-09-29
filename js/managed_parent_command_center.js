(function (global) {
    'use strict';

    const MANAGED_CHANNEL_LIST_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

    function familyUiText(key, fallback, values = {}) {
        const interpolate = text => String(text ?? '').replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
        try {
            const localized = global.FilterTubeUiLocalization?.text?.(key, values);
            if (typeof localized === 'string' && localized.trim()) return localized;
        } catch (_) {
        }
        return interpolate(fallback);
    }

    function fallbackSafeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function fallbackGetProfileName(root, profileId) {
        const profile = fallbackSafeObject(fallbackSafeObject(root).profiles)[profileId];
        return typeof profile?.name === 'string' && profile.name.trim()
            ? profile.name.trim()
            : (profileId === 'default'
                ? familyUiText('family.commandCenter.profile.defaultName', 'Default')
                : familyUiText('family.commandCenter.profile.genericName', 'Profile'));
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
            viewingAccessLabel: typeof helpers.viewingAccessLabel === 'function' ? helpers.viewingAccessLabel : () => familyUiText('family.commandCenter.access.mainKids', 'Main + Kids'),
            managedTimeLimitLabel: typeof helpers.managedTimeLimitLabel === 'function' ? helpers.managedTimeLimitLabel : () => familyUiText('family.commandCenter.time.noLimit', 'No limit'),
            getManagedSyncTargetSummary: typeof helpers.getManagedSyncTargetSummary === 'function'
                ? helpers.getManagedSyncTargetSummary
                : () => ({
                    label: familyUiText('family.commandCenter.action.pairDevice', 'Pair device'),
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
                    label: familyUiText('family.commandCenter.savedUpdates.off', 'Saved updates off'),
                    detail: familyUiText('family.commandCenter.savedUpdates.offDetail', 'Send Update works when both devices are open. Saved updates are only for updates a protected device should collect after it opens.'),
                    tone: 'warning'
                }),
            getManagedLocalNetworkConfigSummary: typeof helpers.getManagedLocalNetworkConfigSummary === 'function'
                ? helpers.getManagedLocalNetworkConfigSummary
                : () => ({
                    configured: false,
                    label: familyUiText('family.commandCenter.homePickup.off', 'Home Pickup off'),
                    detail: familyUiText('family.commandCenter.homePickup.offDetail', 'Home Pickup needs a FilterTube-compatible pickup service you choose; Wi-Fi discovery is never authority.'),
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
        const syncTargetCount = Number(policySummary.syncTargetCount) || 0;
        const syncOpenCheckCount = Number(policySummary.syncOpenCheckCount) || 0;
        const hasSavedUpdateAction = syncTargetCount > 0;
        const intents = [
            {
                action: 'edit_rules',
                label: familyUiText('family.commandCenter.action.editRules', 'Edit Rules'),
                profileId: targetId,
                scope: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: false
            },
            {
                action: 'manage_channel_lists',
                label: familyUiText('family.commandCenter.action.ruleLists', 'Rule Lists'),
                profileId: targetId,
                scope: 'channels',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            ...(hasStaleManagedChannelList ? [{
                action: 'check_stale_lists',
                label: familyUiText('family.commandCenter.action.checkLists', 'Check Lists'),
                profileId: targetId,
                scope: 'channels',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            }] : []),
            {
                action: 'view_history',
                label: familyUiText('family.commandCenter.action.history', 'History'),
                profileId: targetId,
                scope: 'admin_history',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            ...(deviceAction ? [deviceAction] : []),
            ...(hasReadyDeliveryPath ? [{
                action: 'send_managed_policy',
                label: familyUiText('family.commandCenter.action.sendUpdate', 'Send Update'),
                profileId: targetId,
                scope: 'active',
                authority: 'managed_policy_provider_delivery',
                sensitiveAction: true
            }] : []),
            ...(hasSavedUpdateAction ? [{
                action: syncOpenCheckCount > 0 ? 'disable_saved_updates' : 'enable_saved_updates',
                label: syncOpenCheckCount > 0
                    ? familyUiText('family.commandCenter.action.savedUpdatesOff', 'Saved Updates Off')
                    : familyUiText('family.commandCenter.action.savedUpdatesOn', 'Saved Updates On'),
                profileId: targetId,
                scope: 'trusted_link',
                authority: 'managed_policy_provider_delivery',
                sensitiveAction: true,
                title: syncOpenCheckCount > 0
                    ? familyUiText('family.commandCenter.action.savedUpdatesOffTitle', 'Stop this verified device from checking Internet Pickup or Home Pickup when the protected profile opens.')
                    : familyUiText('family.commandCenter.action.savedUpdatesOnTitle', 'Allow this verified device to check Internet Pickup or Home Pickup when the protected profile opens.')
            }] : []),
            {
                action: timeLimitActive ? 'change_time_limit' : 'set_time_limit',
                label: timeLimitActive
                    ? familyUiText('family.commandCenter.action.changeTime', 'Change Time')
                    : familyUiText('family.commandCenter.action.setTime', 'Set Time'),
                profileId: targetId,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            }
        ];
        if (timeLimitActive) {
            intents.push({
                action: 'grant_extra_time',
                label: hasPendingExtraTimeRequest
                    ? familyUiText('family.commandCenter.action.grantTime', 'Grant Time')
                    : familyUiText('family.commandCenter.action.addTime', 'Add Time'),
                profileId: targetId,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            });
        }
        if ((Number(policySummary.remoteConflictCount) || 0) > 0) {
            intents.splice(2, 0, {
                action: 'review_conflicts',
                label: familyUiText('family.commandCenter.action.reviewConflict', 'Review Conflict'),
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
            ? familyUiText('family.commandCenter.action.repairPairing', 'Repair Pairing')
            : (hasKnownDevice
                ? familyUiText('family.commandCenter.action.openDevices', 'Open Devices')
                : familyUiText('family.commandCenter.action.pairDeviceTitleCase', 'Pair Device'));
        const title = hasBrokenSavedLink
            ? familyUiText('family.commandCenter.action.repairPairingTitle', 'Open Family Device Updates to refresh the trusted link before sending protected-profile updates.')
            : (hasKnownDevice
                ? familyUiText('family.commandCenter.action.openDevicesTitle', 'Open Family Device Updates with both devices available, then send after the verified link is ready.')
                : familyUiText('family.commandCenter.action.pairDeviceTitle', 'Open Family Device Updates to pair and verify another device before sending protected-profile updates.'));
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
        if (total <= 0) return familyUiText('family.commandCenter.duration.zero', '0m');
        const minutes = Math.max(1, Math.ceil(total / 60));
        if (minutes < 60) return familyUiText('family.commandCenter.duration.minutes', '{minutes}m', { minutes });
        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        return remainder
            ? familyUiText('family.commandCenter.duration.hoursMinutes', '{hours}h {minutes}m', { hours, minutes: remainder })
            : familyUiText('family.commandCenter.duration.hours', '{hours}h', { hours });
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
            const surface = typeof summary.surface === 'string' && summary.surface.trim() === 'kids'
                ? familyUiText('family.commandCenter.surface.kids', 'Kids')
                : familyUiText('family.commandCenter.surface.main', 'Main');
            const consumedSeconds = normalizeCommandCenterNumber(summary.consumedSeconds);
            const dailyBudgetSeconds = normalizeCommandCenterNumber(summary.dailyBudgetSeconds);
            return {
                row,
                label: familyUiText('family.commandCenter.timeRequest.label', 'Time request: {surface}', { surface }),
                detail: familyUiText('family.commandCenter.timeRequest.detail', '{used} used of {budget}', {
                    used: formatCommandCenterMinutes(consumedSeconds),
                    budget: formatCommandCenterMinutes(dailyBudgetSeconds)
                })
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
                        : familyUiText('family.commandCenter.channelLists.importedRuleList', 'Imported rule list'),
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
        addRows(main.channels, familyUiText('family.commandCenter.surface.main', 'Main'));
        addRows(main.whitelistChannels, familyUiText('family.commandCenter.surface.main', 'Main'));
        addRows(main.keywords, familyUiText('family.commandCenter.surface.main', 'Main'));
        addRows(main.whitelistKeywords, familyUiText('family.commandCenter.surface.main', 'Main'));
        addRows(kids.blockedChannels, familyUiText('family.commandCenter.surface.kids', 'Kids'));
        addRows(kids.whitelistChannels, familyUiText('family.commandCenter.surface.kids', 'Kids'));
        addRows(kids.blockedKeywords, familyUiText('family.commandCenter.surface.kids', 'Kids'));
        addRows(kids.whitelistKeywords, familyUiText('family.commandCenter.surface.kids', 'Kids'));
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
        const listLabel = listCount === 1
            ? familyUiText('family.commandCenter.channelLists.list', 'list')
            : familyUiText('family.commandCenter.channelLists.lists', 'lists');
        if (staleListCount > 0) {
            return staleListCount === 1
                ? familyUiText('family.commandCenter.channelLists.oneNeedsRefresh', '{count} list needs refresh', { count: staleListCount })
                : familyUiText('family.commandCenter.channelLists.manyNeedRefresh', '{count} lists need refresh', { count: staleListCount });
        }
        if (pausedRowCount > 0 && activeRowCount <= 0) {
            return familyUiText('family.commandCenter.channelLists.paused', '{count} {lists} paused', { count: listCount, lists: listLabel });
        }
        if (pausedRowCount > 0) {
            return familyUiText('family.commandCenter.channelLists.someOn', '{count} {lists} ({activeCount} on)', {
                count: listCount, lists: listLabel, activeCount: activeRowCount
            });
        }
        return rowCount > 0
            ? familyUiText('family.commandCenter.channelLists.withRows', '{count} {lists} ({rowCount})', { count: listCount, lists: listLabel, rowCount })
            : familyUiText('family.commandCenter.channelLists.count', '{count} {lists}', { count: listCount, lists: listLabel });
    }

    function formatManagedChannelListDetail(summary = {}) {
        const listCount = normalizeCommandCenterNumber(summary.listCount);
        if (!listCount || !Array.isArray(summary.items)) return '';
        const names = summary.items
            .map(item => typeof item?.name === 'string' ? item.name.trim() : '')
            .filter(Boolean)
            .slice(0, 2);
        const more = listCount > names.length
            ? familyUiText('family.commandCenter.channelLists.more', ' +{count} more', { count: listCount - names.length })
            : '';
        const latestChecked = summary.items.reduce((latest, item) => Math.max(latest, Number(item?.lastCheckedAt) || 0), 0);
        const checked = latestChecked
            ? familyUiText('family.commandCenter.channelLists.checked', ', checked {date}', {
                date: new Date(latestChecked).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            })
            : '';
        const sourceVersion = summary.items
            .map((item) => {
                const version = typeof item?.sourceVersion === 'string' ? item.sourceVersion.trim() : '';
                if (version) return familyUiText('family.commandCenter.channelLists.version', 'version {version}', { version });
                const updated = typeof item?.sourceUpdatedLabel === 'string' ? item.sourceUpdatedLabel.trim() : '';
                return updated ? familyUiText('family.commandCenter.channelLists.updated', 'updated {date}', { date: updated }) : '';
            })
            .find(Boolean);
        const version = sourceVersion ? familyUiText('family.commandCenter.channelLists.versionSuffix', ', {version}', { version: sourceVersion }) : '';
        const staleListCount = normalizeCommandCenterNumber(summary.staleListCount);
        const stale = staleListCount
            ? familyUiText('family.commandCenter.channelLists.staleSuffix', ', {count} need refresh', { count: staleListCount })
            : '';
        if (names.length) {
            return familyUiText('family.commandCenter.channelLists.namedDetail', '{names}{more}{checked}{version}{stale}', {
                names: names.join(', '), more, checked, version, stale
            });
        }
        const listLabel = listCount === 1
            ? familyUiText('family.commandCenter.channelLists.parentApprovedOne', '{count} parent-approved list', { count: listCount })
            : familyUiText('family.commandCenter.channelLists.parentApprovedMany', '{count} parent-approved lists', { count: listCount });
        return familyUiText('family.commandCenter.channelLists.unnamedDetail', '{lists}{checked}{version}{stale}', {
            lists: listLabel, checked, version, stale
        });
    }

    function resolveManagedCommandCenterSyncState(item = {}) {
        const conflictCount = Number(item.remoteConflictCount) || 0;
        if (conflictCount > 0) {
            return {
                key: 'conflict',
                label: conflictCount === 1
                    ? familyUiText('family.commandCenter.sync.oneConflict', '{count} conflict', { count: conflictCount })
                    : familyUiText('family.commandCenter.sync.manyConflicts', '{count} conflicts', { count: conflictCount }),
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
                label: familyUiText('family.commandCenter.sync.needRepair', '{count} need re-pairing', { count: revokedCount }),
                tone: 'warning'
            };
        }
        if (targetCount <= 0 && staleCount > 0) {
            return {
                key: 'stale',
                label: staleCount === 1
                    ? familyUiText('family.commandCenter.sync.oneStaleLink', '{count} stale link', { count: staleCount })
                    : familyUiText('family.commandCenter.sync.manyStaleLinks', '{count} stale links', { count: staleCount }),
                tone: 'warning'
            };
        }
        if (targetCount <= 0) {
            return {
                key: 'no_device',
                label: familyUiText('family.commandCenter.sync.pairToSync', 'Pair to sync'),
                tone: 'muted'
            };
        }
        if (readyCount <= 0) {
            return {
                key: 'provider_pending',
                label: familyUiText('family.commandCenter.sync.openBothDevices', 'Open both devices'),
                tone: 'warning'
            };
        }
        if (item.syncLiveReady === true && (item.syncLocalNetworkReady === true || item.syncMailboxReady === true)) {
            return {
                key: 'multi_path',
                label: familyUiText('family.commandCenter.sync.livePickupReady', 'Live + pickup ready'),
                tone: 'success'
            };
        }
        if (item.syncLocalNetworkReady === true && item.syncMailboxReady === true) {
            return {
                key: 'home_and_internet',
                label: familyUiText('family.commandCenter.sync.sameNetworkInternet', 'Same-network + internet'),
                tone: 'success'
            };
        }
        if (item.syncLiveReady === true) {
            return {
                key: 'live',
                label: readyCount > 1
                    ? familyUiText('family.commandCenter.sync.sendUpdateReadyCount', 'Send Update ready ({count})', { count: readyCount })
                    : familyUiText('family.commandCenter.sync.sendUpdateReady', 'Send Update ready'),
                tone: 'success'
            };
        }
        if (item.syncLocalNetworkReady === true) {
            return {
                key: 'local_network',
                label: familyUiText('family.commandCenter.sync.homePickup', 'Home Pickup'),
                tone: 'success'
            };
        }
        if (item.syncMailboxReady === true) {
            return {
                key: 'mailbox',
                label: familyUiText('family.commandCenter.sync.internetPickup', 'Internet Pickup'),
                tone: 'success'
            };
        }
        return {
            key: 'ready',
            label: familyUiText('family.commandCenter.sync.ready', 'Ready'),
            tone: 'success'
        };
    }

    function resolveManagedCommandCenterDeliveryPreview(item = {}) {
        const conflictCount = Number(item.remoteConflictCount) || 0;
        if (conflictCount > 0) {
            return {
                key: 'conflict',
                label: familyUiText('family.commandCenter.delivery.reviewConflictFirst', 'Review conflict first'),
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
                label: familyUiText('family.commandCenter.delivery.repairTrustedDevice', 'Re-pair trusted device'),
                tone: 'warning'
            };
        }
        if (targetCount <= 0 && staleCount > 0) {
            return {
                key: 'stale',
                label: familyUiText('family.commandCenter.delivery.refreshTrustedDevice', 'Refresh trusted device'),
                tone: 'warning'
            };
        }
        if (targetCount <= 0 || totalCount <= 0) {
            return {
                key: 'pair_device',
                label: familyUiText('family.commandCenter.delivery.pairForAnotherDevice', 'Pair only for another device'),
                tone: 'muted'
            };
        }
        if (readyCount <= 0) {
            return {
                key: 'provider_needed',
                label: familyUiText('family.commandCenter.sync.openBothDevices', 'Open both devices'),
                tone: 'warning'
            };
        }
        if (item.syncLiveReady === true && (item.syncLocalNetworkReady === true || item.syncMailboxReady === true)) {
            return {
                key: 'multi_path',
                label: familyUiText('family.commandCenter.sync.livePickupReady', 'Live + pickup ready'),
                tone: 'success'
            };
        }
        if (item.syncLocalNetworkReady === true && item.syncMailboxReady === true) {
            return {
                key: 'home_and_internet',
                label: familyUiText('family.commandCenter.delivery.sameNetworkInternetSetUp', 'Same-network + internet set up'),
                tone: 'success'
            };
        }
        if (item.syncLiveReady === true) {
            return {
                key: 'live',
                label: readyCount > 1
                    ? familyUiText('family.commandCenter.sync.sendUpdateReadyCount', 'Send Update ready ({count})', { count: readyCount })
                    : familyUiText('family.commandCenter.sync.sendUpdateReady', 'Send Update ready'),
                tone: 'success'
            };
        }
        if (item.syncLocalNetworkReady === true) {
            return {
                key: 'local_network',
                label: familyUiText('family.commandCenter.delivery.homePickupSetUp', 'Home Pickup set up'),
                tone: 'success'
            };
        }
        if (item.syncMailboxReady === true) {
            return {
                key: 'mailbox',
                label: familyUiText('family.commandCenter.delivery.internetPickupSetUp', 'Internet Pickup set up'),
                tone: 'success'
            };
        }
        return {
            key: 'ready',
            label: familyUiText('family.commandCenter.sync.ready', 'Ready'),
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
            return familyUiText('family.commandCenter.delivery.conflictDetail', 'Resolve protected history conflict before pushing new policy.');
        }
        if (targetCount <= 0 && revokedCount > 0) {
            return familyUiText('family.commandCenter.delivery.revokedDetail', 'This trusted link was revoked. Pair again before sending protected-profile updates.');
        }
        if (targetCount <= 0 && staleCount > 0) {
            return familyUiText('family.commandCenter.delivery.staleDetail', 'This trusted link is stale. Refresh pairing before sending protected-profile updates.');
        }
        if (targetCount <= 0 || totalCount <= 0) {
            return familyUiText('family.commandCenter.delivery.localOnlyDetail', 'Local rules and time limits work here. Pair only when this profile also needs to update another device.');
        }
        if (readyCount <= 0) {
            return targetCount === 1
                ? familyUiText('family.commandCenter.delivery.pairedOneNotReady', '{count} verified device is paired. Open parent and protected devices together, then Send Update.', { count: targetCount })
                : familyUiText('family.commandCenter.delivery.pairedManyNotReady', '{count} verified devices are paired. Open parent and protected devices together, then Send Update.', { count: targetCount });
        }
        const paths = [];
        if (item.syncLiveReady === true) paths.push(familyUiText('family.commandCenter.delivery.path.liveSendUpdate', 'live Send Update'));
        if (item.syncLocalNetworkReady === true) paths.push(familyUiText('family.commandCenter.sync.homePickup', 'Home Pickup'));
        if (item.syncMailboxReady === true) paths.push(familyUiText('family.commandCenter.sync.internetPickup', 'Internet Pickup'));
        if (paths.length) {
            const values = { count: targetCount, paths: paths.join(' + ') };
            return targetCount === 1
                ? familyUiText('family.commandCenter.delivery.oneDeviceReady', '{count} verified device can receive by {paths}.', values)
                : familyUiText('family.commandCenter.delivery.manyDevicesReady', '{count} verified devices can receive by {paths}.', values);
        }
        return readyCount === 1
            ? familyUiText('family.commandCenter.delivery.oneQueueReady', '{count} verified queue is ready.', { count: readyCount })
            : familyUiText('family.commandCenter.delivery.manyQueuesReady', '{count} verified queues are ready.', { count: readyCount });
    }

    function buildManagedCommandCenterBulkActionIntents(rows = []) {
        const profileIds = (Array.isArray(rows) ? rows : [])
            .map(row => typeof row?.profileId === 'string' ? row.profileId.trim() : '')
            .filter(Boolean);
        if (!profileIds.length) return [];
        return [
            {
                action: 'bulk_edit_rules',
                label: familyUiText('family.commandCenter.bulkAction.editRules', 'Edit rules'),
                group: 'rules',
                profileIds,
                scope: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: false
            },
            {
                action: 'bulk_add_keyword',
                label: familyUiText('family.commandCenter.bulkAction.addKeyword', 'Add keyword'),
                group: 'rules',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_add_channel',
                label: familyUiText('family.commandCenter.bulkAction.addChannel', 'Add channel'),
                group: 'rules',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_manage_channel_lists',
                label: familyUiText('family.commandCenter.bulkAction.ruleLists', 'Rule lists'),
                group: 'rules',
                profileIds,
                scope: 'channels',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_add_video',
                label: familyUiText('family.commandCenter.bulkAction.addVideoId', 'Add video ID'),
                group: 'rules',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_send_managed_policy',
                label: familyUiText('family.commandCenter.action.sendUpdate', 'Send Update'),
                group: 'send',
                profileIds,
                scope: 'active',
                authority: 'managed_policy_provider_delivery',
                sensitiveAction: true
            },
            {
                action: 'bulk_set_time_limit',
                label: familyUiText('family.commandCenter.bulkAction.setSelectedLimit', 'Set selected limit'),
                group: 'time',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_disable_time_limit',
                label: familyUiText('family.commandCenter.bulkAction.disableSelectedLimits', 'Disable selected limits'),
                group: 'time',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_grant_extra_time',
                label: familyUiText('family.commandCenter.bulkAction.addSelectedTime', 'Add selected time'),
                group: 'time',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_allow_main_kids',
                label: familyUiText('family.commandCenter.bulkAction.allowMainKids', 'Allow Main + Kids'),
                group: 'access',
                profileIds,
                scope: 'viewing_space',
                viewingAccess: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_kids_only',
                label: familyUiText('family.commandCenter.bulkAction.kidsOnly', 'Kids only'),
                group: 'access',
                profileIds,
                scope: 'viewing_space',
                viewingAccess: 'kids_only',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_main_only',
                label: familyUiText('family.commandCenter.bulkAction.mainOnly', 'Main only'),
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
                : (summary.latestResult && summary.latestScope
                    ? familyUiText('family.commandCenter.history.actionScope', '{action}/{scope}', { action: summary.latestResult, scope: summary.latestScope })
                    : familyUiText('family.commandCenter.history.none', 'none'));
            const syncLabel = summary.remoteScopeCount
                ? familyUiText('family.commandCenter.policy.revision', 'Policy r{revision}', { revision: summary.latestRemoteRevision })
                : (summary.localLabels.length
                    ? familyUiText('family.commandCenter.policy.localManaged', 'Local managed')
                    : familyUiText('family.commandCenter.policy.noneYet', 'No policy yet'));
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

    function renderManagedCommandCenterTrustMap(summary = {}) {
        const rows = Array.isArray(summary.rows) ? summary.rows : [];
        if (!rows.length || !global.document) return null;
        const map = document.createElement('div');
        map.className = 'ft-managed-command-center__trust-map';
        map.setAttribute('aria-label', familyUiText('family.commandCenter.trustMap.ariaLabel', 'Trusted device overview'));

        const copy = document.createElement('div');
        copy.className = 'ft-managed-command-center__trust-map-copy';
        const title = document.createElement('strong');
        title.textContent = familyUiText('family.commandCenter.trustMap.title', 'Devices you control');
        const detail = document.createElement('span');
        detail.textContent = familyUiText('family.commandCenter.trustMap.detail', 'After pairing, every trusted protected device stays on one family map. Send now when both devices are open; use pickup only when an approved update needs to wait.');
        copy.append(title, detail);

        const ring = document.createElement('div');
        ring.className = 'ft-managed-command-center__trust-ring';

        const parentNode = document.createElement('div');
        parentNode.className = 'ft-managed-command-center__trust-parent';
        const parentLabel = document.createElement('strong');
        parentLabel.textContent = familyUiText('family.commandCenter.trustMap.parentDevice', 'This parent device');
        const parentDetail = document.createElement('span');
        parentDetail.textContent = familyUiText('family.commandCenter.trustMap.parentDeviceDetail', 'Rules, time, and access are chosen here');
        parentNode.append(parentLabel, parentDetail);
        ring.appendChild(parentNode);

        const devices = document.createElement('div');
        devices.className = 'ft-managed-command-center__trust-devices';
        rows.slice(0, 6).forEach((item) => {
            const syncState = resolveManagedCommandCenterSyncState(item);
            const device = document.createElement('div');
            device.className = `ft-managed-command-center__trust-device is-${syncState.tone || 'neutral'}`;
            device.title = item.deliveryPathDetail || familyUiText('family.commandCenter.trustMap.deviceStatus', 'Protected profile device status.');

            const name = document.createElement('strong');
            name.textContent = item.profileName || familyUiText('family.commandCenter.protectedProfile', 'Protected profile');
            const route = document.createElement('span');
            let routeLabel = syncState.label;
            if (item.syncLocalNetworkReady === true && item.syncMailboxReady === true) {
                routeLabel = familyUiText('family.commandCenter.route.homeInternetPickup', 'Home + Internet pickup');
            } else if (item.syncLocalNetworkReady === true) {
                routeLabel = familyUiText('family.commandCenter.route.homePickup', 'Home pickup');
            } else if (item.syncMailboxReady === true) {
                routeLabel = familyUiText('family.commandCenter.route.internetPickup', 'Internet pickup');
            } else if (item.syncLiveReady === true) {
                routeLabel = familyUiText('family.commandCenter.route.openNow', 'Open now');
            }
            route.textContent = routeLabel;
            const target = document.createElement('small');
            target.textContent = item.syncTargetCount > 0
                ? (item.syncTargetLabel || (item.syncTargetCount === 1
                    ? familyUiText('family.commandCenter.trustMap.oneVerifiedDevice', '{count} verified device', { count: item.syncTargetCount })
                    : familyUiText('family.commandCenter.trustMap.manyVerifiedDevices', '{count} verified devices', { count: item.syncTargetCount })))
                : familyUiText('family.commandCenter.trustMap.pairOnlyForAnotherDevice', 'Pair only if this profile also lives on another device');

            device.append(name, route, target);
            devices.appendChild(device);
        });
        if (rows.length > 6) {
            const more = document.createElement('div');
            more.className = 'ft-managed-command-center__trust-device is-neutral';
            const moreTitle = document.createElement('strong');
            moreTitle.textContent = familyUiText('family.commandCenter.trustMap.moreDevices', '+{count} more', { count: rows.length - 6 });
            const moreRoute = document.createElement('span');
            moreRoute.textContent = familyUiText('family.commandCenter.trustMap.shownBelow', 'Shown below');
            more.append(moreTitle, moreRoute);
            devices.appendChild(more);
        }
        ring.appendChild(devices);

        const note = document.createElement('div');
        note.className = 'ft-managed-command-center__trust-note';
        note.textContent = familyUiText('family.commandCenter.trustMap.securityNote', 'Pickup does not grant control. A protected device accepts only a signed newer update from its saved parent link.');

        map.append(copy, ring, note);
        return map;
    }

    function renderManagedCommandCenter(profilesV4, { revealDetails = false, helpers = {} } = {}) {
        if (!revealDetails || !global.document) return null;
        const h = makeHelpers(helpers);
        const summary = buildManagedCommandCenterSummary(profilesV4, { revealDetails, helpers });
        const panel = document.createElement('section');
        panel.className = 'help-item ft-managed-command-center';
        panel.setAttribute('aria-label', 'Managed parent command center');
        const localizedPanelLabel = familyUiText('family.commandCenter.ariaLabel', 'Managed parent command center');
        if (localizedPanelLabel !== 'Managed parent command center') {
            panel.setAttribute('aria-label', localizedPanelLabel);
        }

        const heading = document.createElement('div');
        heading.className = 'ft-managed-command-center__heading';
        const titleWrap = document.createElement('div');
        titleWrap.className = 'ft-managed-command-center__title-wrap';
        const title = document.createElement('div');
        title.className = 'help-item-title';
        title.textContent = familyUiText('family.commandCenter.title', 'Family Controls');
        const body = document.createElement('div');
        body.className = 'help-item-body';
        body.textContent = summary.profileCount > 0
            ? familyUiText('family.commandCenter.descriptionExistingProfiles', 'Pick a profile, set what it can watch, set daily time, and send the update only when another verified device needs it.')
            : familyUiText('family.commandCenter.descriptionNoProfiles', 'Create one protected profile first. Then set rules, daily time, Main/Kids access, and pair another device only if needed.');
        const meta = document.createElement('div');
        meta.className = 'ft-managed-command-center__meta';
        const setupNeeds = summary.noDeviceProfileCount
            + summary.syncRepairProfileCount
            + summary.syncStaleProfileCount
            + summary.syncPendingProfileCount;
        meta.textContent = summary.profileCount > 0
            ? familyUiText('family.commandCenter.metaSummary', '{profileCount} {profiles} | {readyCount} ready{setupPart}{requestPart}', {
                profileCount: summary.profileCount,
                profiles: summary.profileCount === 1
                    ? familyUiText('family.commandCenter.profile.one', 'profile')
                    : familyUiText('family.commandCenter.profile.many', 'profiles'),
                readyCount: summary.syncReadyProfileCount,
                setupPart: setupNeeds ? familyUiText('family.commandCenter.metaSetupNeeded', ' | {count} need setup', { count: setupNeeds }) : '',
                requestPart: summary.pendingExtraTimeRequestCount
                    ? familyUiText('family.commandCenter.metaRequests', ' | {count} requests', { count: summary.pendingExtraTimeRequestCount })
                    : ''
            })
            : familyUiText('family.commandCenter.setupNeeded', 'Setup needed');
        meta.title = summary.profileCount > 0
            ? familyUiText('family.commandCenter.metaAuthorityTitle', 'Protected profiles shown here can be managed only by the current parent/account authority.')
            : familyUiText('family.commandCenter.metaCreateProfileTitle', 'Create a protected profile first; verified-device update options appear after there is a profile to protect.');
        titleWrap.append(title, body);
        heading.append(titleWrap, meta);
        panel.appendChild(heading);

        if (!summary.rows.length) {
            const setup = document.createElement('div');
            setup.className = 'ft-managed-command-center__setup is-empty';

            const setupTitle = document.createElement('strong');
            setupTitle.className = 'ft-managed-command-center__setup-title';
            setupTitle.textContent = familyUiText('family.commandCenter.firstSetup.title', 'First setup');
            setupTitle.title = familyUiText('family.commandCenter.firstSetup.titleHelp', 'Use this from the parent/master profile. Protected profiles do not receive admin controls.');

            const setupCopy = document.createElement('div');
            setupCopy.className = 'help-item-body';
            setupCopy.textContent = familyUiText('family.commandCenter.firstSetup.detail', 'Create a protected profile, set what it can watch, then pair a verified device if updates need to reach another device.');

            const steps = document.createElement('ol');
            steps.className = 'ft-managed-command-center__setup-steps';
            [
                {
                    text: familyUiText('family.commandCenter.firstSetup.step.createProfile', 'Create a protected profile'),
                    title: familyUiText('family.commandCenter.firstSetup.step.createProfileHelp', 'The profile gets its own Main and Kids rules. The parent/account keeps policy authority.')
                },
                {
                    text: familyUiText('family.commandCenter.firstSetup.step.setAccessTime', 'Set Main/Kids access and daily YouTube time'),
                    title: familyUiText('family.commandCenter.firstSetup.step.setAccessTimeHelp', 'The runtime gate enforces access and time limits on YouTube surfaces for that profile.')
                },
                {
                    text: familyUiText('family.commandCenter.firstSetup.step.addRules', 'Add keywords, channels, whitelist, or blocklist rules'),
                    title: familyUiText('family.commandCenter.firstSetup.step.addRulesHelp', 'Rules are edited from the parent/account surface, not from the protected surface.')
                },
                {
                    text: familyUiText('family.commandCenter.firstSetup.step.pairDevice', 'Pair another device only when it also needs these rules'),
                    title: familyUiText('family.commandCenter.firstSetup.step.pairDeviceHelp', 'Send Update appears after a protected profile exists. Internet Pickup and Home Pickup stay optional.')
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
                    createChildBtn.textContent = familyUiText('family.commandCenter.firstSetup.createProtectedProfile', 'Create Protected Profile');
                    createChildBtn.title = familyUiText('family.commandCenter.firstSetup.createProtectedProfileHelp', 'Creates a protected profile owned by the active parent/account profile.');
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
                    createAccountBtn.textContent = familyUiText('family.commandCenter.firstSetup.createAccount', 'Create Account');
                    createAccountBtn.title = familyUiText('family.commandCenter.firstSetup.createAccountHelp', 'Creates an independent account profile that Master can later manage.');
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
            setupNote.textContent = familyUiText('family.commandCenter.firstSetup.note', 'If the protected profile stays on this device, no device pairing is needed. Pair only when another verified device should receive the same parent-approved rules.');
            setupNote.title = familyUiText('family.commandCenter.firstSetup.noteHelp', 'Those options do not grant authority; a trusted profile link and local validation still decide whether an update applies.');
            setup.appendChild(setupNote);
            panel.appendChild(setup);
            return panel;
        }

        const strip = document.createElement('div');
        strip.className = 'ft-managed-command-center__strip';
        [
            { label: familyUiText('family.commandCenter.stat.profiles', 'Profiles'), value: summary.profileCount, tone: 'neutral', title: familyUiText('family.commandCenter.stat.profilesHelp', 'Profiles this parent/account can manage.'), always: true },
            { label: familyUiText('family.commandCenter.stat.readyDevices', 'Ready devices'), value: summary.syncReadyProfileCount, tone: summary.syncReadyProfileCount ? 'success' : 'neutral', title: familyUiText('family.commandCenter.stat.readyDevicesHelp', 'Profiles with a verified device path available now.'), always: true },
            { label: familyUiText('family.commandCenter.stat.ruleLists', 'Rule lists'), value: summary.managedChannelListProfileCount, tone: 'success', title: familyUiText('family.commandCenter.stat.ruleListsHelp', 'Protected profiles with parent-approved channel or keyword lists.') },
            { label: familyUiText('family.commandCenter.stat.needsPairing', 'Needs pairing'), value: summary.noDeviceProfileCount + summary.syncRepairProfileCount + summary.syncStaleProfileCount, tone: 'warning', title: familyUiText('family.commandCenter.stat.needsPairingHelp', 'Profiles that need a verified device, refreshed trust, or re-pairing before remote updates.') },
            { label: familyUiText('family.commandCenter.stat.timeRequests', 'Time requests'), value: summary.pendingExtraTimeRequestCount, tone: 'warning', title: familyUiText('family.commandCenter.stat.timeRequestsHelp', 'Protected profiles asking for more YouTube time.') },
            { label: familyUiText('family.commandCenter.stat.conflicts', 'Conflicts'), value: summary.remoteConflictCount, tone: 'danger', title: familyUiText('family.commandCenter.stat.conflictsHelp', 'Rejected or conflicting remote-policy history rows that need parent review.') }
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
        workflow.setAttribute('aria-label', familyUiText('family.commandCenter.workflow.ariaLabel', 'Family Controls workflow'));
        [
            {
                step: '1',
                label: familyUiText('family.commandCenter.workflow.chooseProfile', 'Choose profile'),
                detail: summary.profileCount === 1
                    ? familyUiText('family.commandCenter.workflow.oneProfileAvailable', '{count} protected profile available', { count: summary.profileCount })
                    : familyUiText('family.commandCenter.workflow.manyProfilesAvailable', '{count} protected profiles available', { count: summary.profileCount }),
                tone: 'neutral',
                title: familyUiText('family.commandCenter.workflow.chooseProfileHelp', 'Choose the family member or other protected profile you want to manage.')
            },
            {
                step: '2',
                label: familyUiText('family.commandCenter.workflow.setGuardrails', 'Set guardrails'),
                detail: summary.managedChannelListProfileCount > 0
                    ? familyUiText('family.commandCenter.workflow.guardrailsReady', 'Rules, lists, access, and time are ready to review')
                    : familyUiText('family.commandCenter.workflow.guardrailsHelp', 'Use Rules, Lists, Set Time, and Main/Kids controls'),
                tone: summary.managedChannelListProfileCount > 0 || summary.limitedCount > 0 ? 'success' : 'neutral',
                title: familyUiText('family.commandCenter.workflow.guardrailsTitle', 'These actions change the selected protected profile after parent/account approval.')
            },
            {
                step: '3',
                label: familyUiText('family.commandCenter.workflow.syncIfNeeded', 'Sync if needed'),
                detail: summary.syncReadyProfileCount > 0
                    ? (summary.syncReadyProfileCount === 1
                        ? familyUiText('family.commandCenter.workflow.oneProfileDelivery', '{count} profile has a verified delivery path', { count: summary.syncReadyProfileCount })
                        : familyUiText('family.commandCenter.workflow.manyProfilesDelivery', '{count} profiles have a verified delivery path', { count: summary.syncReadyProfileCount }))
                    : familyUiText('family.commandCenter.workflow.syncHelp', 'Pair only when this profile also lives on another device'),
                tone: summary.syncReadyProfileCount > 0 ? 'success' : 'warning',
                title: familyUiText('family.commandCenter.workflow.syncTitle', 'Local control works without remote delivery. Pairing is only needed for another device.')
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

        const trustMap = renderManagedCommandCenterTrustMap(summary);
        if (trustMap) panel.appendChild(trustMap);

        const mailbox = h.safeObject(summary.mailboxConfig);
        const localNetwork = h.safeObject(summary.localNetworkConfig);
        const hasProviderAction = typeof h.onAction === 'function';
        const hasVerifiedTarget = rows.some((row) => (Number(row.syncTargetCount) || 0) > 0);
        const shouldShowConfiguredProviderSetup = mailbox.configured === true || localNetwork.configured === true;
        const shouldShowProviderPrompt = summary.profileCount > 0
            && hasVerifiedTarget
            && hasProviderAction
            && mailbox.configured !== true
            && localNetwork.configured !== true;
        if (shouldShowConfiguredProviderSetup || shouldShowProviderPrompt) {
            const providerIntro = document.createElement('div');
            providerIntro.className = 'ft-managed-command-center__provider-intro';
            providerIntro.textContent = familyUiText('family.commandCenter.providers.savedUpdatesTitle', 'Automatic saved updates');
            providerIntro.title = familyUiText('family.commandCenter.providers.savedUpdatesHelp', 'Send Update is the normal path. Add this only when the other device cannot be open at the same time.');
            panel.appendChild(providerIntro);
        }

        if (shouldShowProviderPrompt) {
            const providerPrompt = document.createElement('details');
            providerPrompt.className = 'ft-managed-command-center__provider-prompt';
            providerPrompt.title = familyUiText('family.commandCenter.providers.promptHelp', 'Most parents can skip this. Use only when live Send Update is not enough.');
            const providerSummary = document.createElement('summary');
            providerSummary.className = 'ft-managed-command-center__provider-summary';
            const promptCopy = document.createElement('div');
            promptCopy.className = 'ft-managed-command-center__provider-copy';
            const promptTitle = document.createElement('strong');
            promptTitle.textContent = familyUiText('family.commandCenter.providers.promptTitle', 'Need a device to pick up changes later?');
            const promptDetail = document.createElement('span');
            promptDetail.textContent = familyUiText('family.commandCenter.providers.promptDetail', 'Optional. Use Send Update when both devices can be open together.');
            promptCopy.append(promptTitle, promptDetail);
            providerSummary.appendChild(promptCopy);
            const promptActions = document.createElement('div');
            promptActions.className = 'ft-managed-command-center__provider-prompt-actions';
            const promptBody = document.createElement('div');
            promptBody.className = 'ft-managed-command-center__provider-prompt-body';
            const promptBodyText = document.createElement('span');
            promptBodyText.textContent = familyUiText('family.commandCenter.providers.promptBody', 'Normal control is live: open both devices, pair, verify, send. Add pickup only if approved updates must wait for a protected device at home, school, or away.');
            [
                {
                    label: familyUiText('family.commandCenter.providers.internetPickup', 'Internet Pickup'),
                    title: familyUiText('family.commandCenter.providers.internetPickupHelp', 'For protected devices that should collect waiting approved updates next time they open.'),
                    action: 'configure_mailbox',
                    scope: 'mailbox_provider'
                },
                {
                    label: familyUiText('family.commandCenter.providers.homePickup', 'Home Pickup'),
                    title: familyUiText('family.commandCenter.providers.homePickupHelp', 'For a same-network home, clinic, or school pickup path you explicitly set up. Wi-Fi alone never grants control.'),
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
            mailboxPanel.title = familyUiText('family.commandCenter.providers.internetPickupPanelHelp', 'Optional: use this only when parent updates must wait for an offline or away protected device to open later.');
            const mailboxCopy = document.createElement('div');
            mailboxCopy.className = 'ft-managed-command-center__provider-copy';
            const mailboxTitle = document.createElement('strong');
            mailboxTitle.textContent = mailbox.configured
                ? (mailbox.label || familyUiText('family.commandCenter.providers.internetPickupIsSetUp', 'Internet Pickup is set up'))
                : familyUiText('family.commandCenter.providers.internetPickupIsOff', 'Internet Pickup is off');
            const mailboxDetail = document.createElement('span');
            mailboxDetail.textContent = summary.profileCount > 0
                ? (mailbox.detail || familyUiText('family.commandCenter.providers.internetPickupDetail', 'Use this when a parent update should wait until the protected device opens later or away.'))
                : familyUiText('family.commandCenter.providers.internetPickupNoProfileDetail', 'Create a protected profile first. Internet Pickup is optional and only useful after a protected device is paired.');
            const mailboxRoute = document.createElement('span');
            mailboxRoute.textContent = mailbox.configured
                ? familyUiText('family.commandCenter.providers.trustedUpdatesOnly', 'The protected device still accepts only trusted parent updates.')
                : familyUiText('family.commandCenter.providers.internetPickupOffDetail', 'Leave this off when live Send Update is enough.');
            mailboxCopy.append(mailboxTitle, mailboxDetail, mailboxRoute);
            mailboxPanel.appendChild(mailboxCopy);
            if (h.onAction) {
                const mailboxButton = document.createElement('button');
                mailboxButton.className = 'btn-secondary';
                mailboxButton.type = 'button';
                mailboxButton.textContent = mailbox.configured
                    ? familyUiText('family.commandCenter.providers.editInternetPickup', 'Edit Internet Pickup')
                    : familyUiText('family.commandCenter.providers.setUpInternetPickup', 'Set Up Internet Pickup');
                mailboxButton.title = familyUiText('family.commandCenter.providers.internetPickupReauthHelp', 'Requires parent/account re-auth. Use only when updates must wait for the protected device to open later or away.');
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
            localPanel.title = familyUiText('family.commandCenter.providers.homePickupPanelHelp', 'Optional: use this only for explicitly configured Home Pickup. Being on the same network is not authority.');
            const localCopy = document.createElement('div');
            localCopy.className = 'ft-managed-command-center__provider-copy';
            const localTitle = document.createElement('strong');
            localTitle.textContent = localNetwork.configured
                ? (localNetwork.label || familyUiText('family.commandCenter.providers.homePickupIsSetUp', 'Home Pickup is set up'))
                : familyUiText('family.commandCenter.providers.homePickupIsOff', 'Home Pickup is off');
            const localDetail = document.createElement('span');
            localDetail.textContent = summary.profileCount > 0
                ? (localNetwork.detail || familyUiText('family.commandCenter.providers.homePickupDetail', 'Use this only with a trusted FilterTube-compatible pickup service on your home or school network.'))
                : familyUiText('family.commandCenter.providers.homePickupNoProfileDetail', 'Create a protected profile first. Home Pickup is optional and never replaces parent trust.');
            const localRoute = document.createElement('span');
            localRoute.textContent = localNetwork.configured
                ? familyUiText('family.commandCenter.providers.trustedUpdatesOnly', 'The protected device still accepts only trusted parent updates.')
                : familyUiText('family.commandCenter.providers.homePickupOffDetail', 'Leave this off unless you run a trusted Home Pickup service; Wi-Fi alone never grants control.');
            localCopy.append(localTitle, localDetail, localRoute);
            localPanel.appendChild(localCopy);
            if (h.onAction) {
                const localButton = document.createElement('button');
                localButton.className = 'btn-secondary';
                localButton.type = 'button';
                localButton.textContent = localNetwork.configured
                    ? familyUiText('family.commandCenter.providers.editHomePickup', 'Edit Home Pickup')
                    : familyUiText('family.commandCenter.providers.setUpHomePickup', 'Set Up Home Pickup');
                localButton.title = familyUiText('family.commandCenter.providers.homePickupReauthHelp', 'Requires parent/account re-auth. Being on the same network alone cannot change protected rules.');
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
            bulkSummaryCopy.textContent = familyUiText('family.commandCenter.bulk.title', 'Manage several profiles at once');
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
            selectAllButton.textContent = familyUiText('family.commandCenter.bulk.selectAll', 'Select all');
            selectAllButton.title = familyUiText('family.commandCenter.bulk.selectAllHelp', 'Select every protected profile shown in this command center.');
            const selectReadyButton = document.createElement('button');
            selectReadyButton.className = 'btn-secondary';
            selectReadyButton.type = 'button';
            selectReadyButton.textContent = familyUiText('family.commandCenter.bulk.selectReady', 'Select ready devices');
            selectReadyButton.title = familyUiText('family.commandCenter.bulk.selectReadyHelp', 'Select protected profiles that already have a verified delivery path.');
            const selectRequestsButton = document.createElement('button');
            selectRequestsButton.className = 'btn-secondary';
            selectRequestsButton.type = 'button';
            selectRequestsButton.textContent = familyUiText('family.commandCenter.bulk.selectTimeRequests', 'Select time requests');
            selectRequestsButton.title = familyUiText('family.commandCenter.bulk.selectTimeRequestsHelp', 'Select protected profiles with pending extra-time requests.');
            const clearSelectionButton = document.createElement('button');
            clearSelectionButton.className = 'btn-secondary';
            clearSelectionButton.type = 'button';
            clearSelectionButton.textContent = familyUiText('family.commandCenter.bulk.clear', 'Clear');
            clearSelectionButton.title = familyUiText('family.commandCenter.bulk.clearHelp', 'Clear selected protected profiles.');
            const bulkActionGroups = [
                { key: 'rules', label: familyUiText('family.commandCenter.bulk.group.rules', 'Rules') },
                { key: 'send', label: familyUiText('family.commandCenter.bulk.group.send', 'Send') },
                { key: 'time', label: familyUiText('family.commandCenter.bulk.group.time', 'Time') },
                { key: 'access', label: familyUiText('family.commandCenter.bulk.group.access', 'Access') }
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
                button.title = familyUiText('family.commandCenter.bulk.selectFirstHelp', 'Select one or more protected profiles first. Requires parent/account re-auth.');
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
                    ? familyUiText('family.commandCenter.bulk.selectedStatus', '{count} selected{requests}', {
                        count,
                        requests: selectedRequestCount
                            ? familyUiText('family.commandCenter.bulk.selectedTimeRequests', ' | {count} time {requests}', {
                                count: selectedRequestCount,
                                requests: selectedRequestCount === 1
                                    ? familyUiText('family.commandCenter.bulk.requestOne', 'request')
                                    : familyUiText('family.commandCenter.bulk.requestMany', 'requests')
                            })
                            : ''
                    })
                    : familyUiText('family.commandCenter.bulk.optionalHelp', 'Optional: select profiles below to edit or send together');
                bulkBar.classList.toggle('has-selection', count > 0);
                bulkButtons.forEach(button => {
                    button.disabled = count === 0;
                    if (button.dataset.filtertubeBulkAction === 'bulk_grant_extra_time') {
                        const label = selectedRequestCount
                            ? familyUiText('family.commandCenter.bulk.grantTimeRequests', 'Grant time requests')
                            : familyUiText('family.commandCenter.bulk.addExtraTime', 'Add extra time');
                        button.textContent = label;
                        button.title = count === 0
                            ? familyUiText('family.commandCenter.bulk.selectFirstHelp', 'Select one or more protected profiles first. Requires parent/account re-auth.')
                            : selectedRequestCount
                                ? (selectedRequestCount === 1
                                    ? familyUiText('family.commandCenter.bulk.grantOneRequestHelp', 'Grant temporary parent-approved YouTube time to selected profiles. {count} selected profile has asked for more time. Requires parent/account re-auth.', { count: selectedRequestCount })
                                    : familyUiText('family.commandCenter.bulk.grantManyRequestsHelp', 'Grant temporary parent-approved YouTube time to selected profiles. {count} selected profiles have asked for more time. Requires parent/account re-auth.', { count: selectedRequestCount }))
                                : familyUiText('family.commandCenter.bulk.addExtraTimeHelp', 'Add temporary parent-approved YouTube time to selected profiles with active limits. Requires parent/account re-auth.');
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
            selector.setAttribute('aria-label', familyUiText('family.commandCenter.bulk.selectProfile', 'Select {profile} for bulk managed update', { profile: item.profileName }));
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
            owner.textContent = familyUiText('family.commandCenter.profile.owner', 'Parent: {name}{pinStatus}', {
                name: item.parentName,
                pinStatus: item.locked ? familyUiText('family.commandCenter.profile.pinOn', ' | profile PIN on') : ''
            });
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
                { label: item.viewingAccess, tone: 'neutral', title: familyUiText('family.commandCenter.status.viewingAccessHelp', 'Allowed YouTube space for this protected profile.') },
                { label: item.timeLimit, tone: item.timeLimited ? 'warning' : 'neutral', title: familyUiText('family.commandCenter.status.dailyTimeHelp', 'Daily YouTube time for this protected profile.') },
                item.managedChannelListLabel ? { label: item.managedChannelListLabel, tone: 'success', title: item.managedChannelListDetail || familyUiText('family.commandCenter.status.parentApprovedListsHelp', 'Parent-approved lists attached to this profile.') } : null,
                { label: syncState.label, tone: syncState.tone, title: item.deliveryPathDetail || familyUiText('family.commandCenter.status.deviceDeliveryHelp', 'Device delivery status.') },
                item.syncTargetCount > 0 && item.syncOpenCheckCount > 0 ? { label: familyUiText('family.commandCenter.providers.savedUpdatesTitle', 'Automatic saved updates'), tone: 'success', title: familyUiText('family.commandCenter.status.automaticSavedUpdatesHelp', 'This verified device can check for newer signed parent updates when the protected profile opens.') } : null,
                item.remoteScopeCount ? { label: item.syncLabel, tone: 'success', title: familyUiText('family.commandCenter.status.latestPolicyRevisionHelp', 'Latest accepted protected-profile policy revision.') } : null,
                item.pendingExtraTimeRequestLabel ? { label: item.pendingExtraTimeRequestLabel, tone: 'warning', title: item.pendingExtraTimeRequestDetail || familyUiText('family.commandCenter.status.timeRequestHelp', 'This profile asked for more time.') } : null,
                item.syncTargetCount > 0 && item.latestDeliveryLabel ? { label: item.latestDeliveryLabel, tone: item.latestDeliveryTone || 'neutral', title: familyUiText('family.commandCenter.status.latestDeliveryHelp', 'Latest protected delivery attempt.') } : null,
                item.syncSourceAckLabel ? { label: familyUiText('family.commandCenter.status.acknowledgementLabel', `Ack: ${item.syncSourceAckLabel}`, { ack: item.syncSourceAckLabel }), tone: 'neutral', title: familyUiText('family.commandCenter.status.acknowledgementHelp', 'Latest redacted acknowledgement from a protected device.') } : null
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
                    ? { label: familyUiText('family.commandCenter.detail.deviceSync', 'Device sync'), value: item.deliveryPreview?.label || familyUiText('family.commandCenter.detail.sendWhenReady', 'Send when ready'), note: item.deliveryPathDetail }
                    : { label: familyUiText('family.commandCenter.detail.deviceSync', 'Device sync'), value: familyUiText('family.commandCenter.detail.notPaired', 'Not paired'), note: familyUiText('family.commandCenter.detail.notPairedHelp', 'Local rules and time limits work here. Pair only when this profile must also update another device.') },
                hasVerifiedDevice ? {
                    label: familyUiText('family.commandCenter.providers.savedUpdatesTitle', 'Automatic saved updates'),
                    value: item.syncOpenCheckCount > 0
                        ? (item.syncOpenCheckCount >= item.syncTargetCount
                            ? familyUiText('family.commandCenter.detail.on', 'On')
                            : familyUiText('family.commandCenter.detail.onForDevices', 'On for {enabled}/{total}', { enabled: item.syncOpenCheckCount, total: item.syncTargetCount }))
                        : familyUiText('family.commandCenter.detail.off', 'Off'),
                    note: item.syncOpenCheckCount > 0
                        ? familyUiText('family.commandCenter.detail.savedUpdatesOnHelp', 'When Internet Pickup or Home Pickup is set up, this protected profile checks for newer signed parent updates as it opens.')
                        : familyUiText('family.commandCenter.detail.savedUpdatesOffHelp', 'Live Send Update still works. Turn this on only when this profile should collect Internet Pickup or Home Pickup updates later.')
                } : null,
                item.managedChannelListDetail ? { label: familyUiText('family.commandCenter.detail.lists', 'Lists'), value: item.managedChannelListDetail } : null,
                hasVerifiedDevice ? { label: familyUiText('family.commandCenter.detail.verifiedDevice', 'Verified device'), value: item.syncTargetLabel } : null,
                item.pendingExtraTimeRequestDetail ? { label: familyUiText('family.commandCenter.detail.request', 'Request'), value: item.pendingExtraTimeRequestDetail } : null,
                item.remoteConflictCount > 0 ? { label: familyUiText('family.commandCenter.detail.conflict', 'Conflict'), value: familyUiText('family.commandCenter.detail.conflictNeedsReview', '{count} needs review', { count: item.remoteConflictCount }) } : null
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
                        ? familyUiText('family.commandCenter.action.parentReauthHelp', 'Requires parent/account re-auth before protected details or policy changes.')
                        : familyUiText('family.commandCenter.action.runtimeGateHelp', 'Uses the existing parent-managed runtime gate.'));
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
