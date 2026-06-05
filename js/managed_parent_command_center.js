(function (global) {
    'use strict';

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
            isProfileLocked: typeof helpers.isProfileLocked === 'function' ? helpers.isProfileLocked : () => false,
            viewingAccessLabel: typeof helpers.viewingAccessLabel === 'function' ? helpers.viewingAccessLabel : () => 'Main + Kids',
            managedTimeLimitLabel: typeof helpers.managedTimeLimitLabel === 'function' ? helpers.managedTimeLimitLabel : () => 'No limit',
            getManagedSyncTargetSummary: typeof helpers.getManagedSyncTargetSummary === 'function'
                ? helpers.getManagedSyncTargetSummary
                : () => ({
                    label: 'No verified device',
                    targetCount: 0,
                    readyCount: 0,
                    revokedCount: 0,
                    staleCount: 0,
                    totalCount: 0,
                    sourceAckLabel: '',
                    liveReady: false,
                    localNetworkReady: false,
                    mailboxReady: false
                }),
            onAction: typeof helpers.onAction === 'function' ? helpers.onAction : null
        };
    }

    function buildManagedCommandCenterActionIntents(profileId, timePolicy, policySummary = {}) {
        const targetId = typeof profileId === 'string' ? profileId.trim() : '';
        if (!targetId) return [];
        const timeLimitActive = timePolicy?.enabled === true;
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
                action: 'view_history',
                label: 'History',
                profileId: targetId,
                scope: 'admin_history',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'send_managed_policy',
                label: 'Send Update',
                profileId: targetId,
                scope: 'active',
                authority: 'managed_policy_provider_delivery',
                sensitiveAction: true
            },
            {
                action: timeLimitActive ? 'change_time_limit' : 'set_time_limit',
                label: timeLimitActive ? 'Change Limit' : 'Set Limit',
                profileId: targetId,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            }
        ];
        if (timeLimitActive) {
            intents.push({
                action: 'grant_extra_time',
                label: 'Add Time',
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
                label: 'No verified device',
                tone: 'muted'
            };
        }
        if (readyCount <= 0) {
            return {
                key: 'provider_pending',
                label: 'Provider pending',
                tone: 'warning'
            };
        }
        return {
            key: 'ready',
            label: 'Sync ready',
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
                label: 'Re-pair before sending',
                tone: 'warning'
            };
        }
        if (targetCount <= 0 && staleCount > 0) {
            return {
                key: 'stale',
                label: 'Refresh stale link',
                tone: 'warning'
            };
        }
        if (targetCount <= 0 || totalCount <= 0) {
            return {
                key: 'pair_device',
                label: 'Pair verified device',
                tone: 'muted'
            };
        }
        if (readyCount <= 0) {
            return {
                key: 'provider_needed',
                label: 'Provider setup needed',
                tone: 'warning'
            };
        }
        if (item.syncLiveReady === true) {
            return {
                key: 'live',
                label: readyCount > 1 ? `Live now (${readyCount})` : 'Live now',
                tone: 'success'
            };
        }
        if (item.syncLocalNetworkReady === true) {
            return {
                key: 'local_network',
                label: 'LAN provider ready',
                tone: 'success'
            };
        }
        if (item.syncMailboxReady === true) {
            return {
                key: 'mailbox',
                label: 'Mailbox later',
                tone: 'success'
            };
        }
        return {
            key: 'ready',
            label: 'Delivery ready',
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
            return 'Old trusted link was revoked; pair this device again.';
        }
        if (targetCount <= 0 && staleCount > 0) {
            return 'Saved link is stale; refresh trust before sending.';
        }
        if (targetCount <= 0 || totalCount <= 0) {
            return 'No child/protected device is paired for this profile.';
        }
        if (readyCount <= 0) {
            return `${targetCount} verified ${targetCount === 1 ? 'device is' : 'devices are'} paired; install or connect live/LAN/mailbox delivery.`;
        }
        const paths = [];
        if (item.syncLiveReady === true) paths.push('live P2P');
        if (item.syncLocalNetworkReady === true) paths.push('LAN');
        if (item.syncMailboxReady === true) paths.push('mailbox later');
        return paths.length
            ? `${targetCount} verified ${targetCount === 1 ? 'device' : 'devices'} via ${paths.join(' + ')}.`
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
                label: 'Edit selected rules',
                profileIds,
                scope: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: false
            },
            {
                action: 'bulk_add_keyword',
                label: 'Add keyword',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_add_channel',
                label: 'Add channel',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_add_video',
                label: 'Add video ID',
                profileIds,
                scope: 'main_kids_rules',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_send_managed_policy',
                label: 'Send selected updates',
                profileIds,
                scope: 'active',
                authority: 'managed_policy_provider_delivery',
                sensitiveAction: true
            },
            {
                action: 'bulk_set_time_limit',
                label: 'Set selected limit',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_disable_time_limit',
                label: 'Disable selected limits',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_grant_extra_time',
                label: 'Add selected time',
                profileIds,
                scope: 'time_limits',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_allow_main_kids',
                label: 'Allow Main + Kids',
                profileIds,
                scope: 'viewing_space',
                viewingAccess: 'main_kids',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_kids_only',
                label: 'Kids only',
                profileIds,
                scope: 'viewing_space',
                viewingAccess: 'kids_only',
                authority: 'delegated_runtime_gate',
                sensitiveAction: true
            },
            {
                action: 'bulk_main_only',
                label: 'Main only',
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
            const latestActionLabel = typeof summary.latestActionLabel === 'string' && summary.latestActionLabel.trim()
                ? summary.latestActionLabel.trim()
                : (summary.latestResult && summary.latestScope ? `${summary.latestResult}/${summary.latestScope}` : 'none');
            const syncLabel = summary.remoteScopeCount
                ? `Remote r${summary.latestRemoteRevision}`
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
                actionIntents: buildManagedCommandCenterActionIntents(profileId, timePolicy, {
                    remoteConflictCount
                })
            };
            row.deliveryPreview = resolveManagedCommandCenterDeliveryPreview(row);
            row.deliveryPathDetail = describeManagedCommandCenterDeliveryPath(row);
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
            remoteScopeCount: acc.remoteScopeCount + row.remoteScopeCount,
            historyRowCount: acc.historyRowCount + row.historyRowCount,
            protectedRowCount: acc.protectedRowCount + row.protectedRowCount,
            remoteConflictCount: acc.remoteConflictCount + row.remoteConflictCount
        }), {
            rows,
            bulkActionIntents: buildManagedCommandCenterBulkActionIntents(rows),
            profileCount: 0,
            limitedCount: 0,
            syncReadyProfileCount: 0,
            syncRepairProfileCount: 0,
            syncStaleProfileCount: 0,
            syncPendingProfileCount: 0,
            noDeviceProfileCount: 0,
            remoteScopeCount: 0,
            historyRowCount: 0,
            protectedRowCount: 0,
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
        title.textContent = 'Managed Parent Controls';
        const body = document.createElement('div');
        body.className = 'help-item-body';
        body.textContent = 'Overview of protected profiles, policy sync, time limits, action history, and delegated actions.';
        const meta = document.createElement('div');
        meta.className = 'ft-managed-command-center__meta';
        meta.textContent = `${summary.profileCount} protected profiles | ${summary.limitedCount} time limits | ${summary.remoteScopeCount} remote scopes | ${summary.protectedRowCount} protected history`;
        titleWrap.append(title, body);
        heading.append(titleWrap, meta);
        panel.appendChild(heading);

        const strip = document.createElement('div');
        strip.className = 'ft-managed-command-center__strip';
        [
            { label: 'Protected', value: summary.profileCount, tone: 'neutral' },
            { label: 'Ready', value: summary.syncReadyProfileCount, tone: summary.syncReadyProfileCount ? 'success' : 'neutral' },
            { label: 'Needs re-pair', value: summary.syncRepairProfileCount, tone: summary.syncRepairProfileCount ? 'warning' : 'neutral' },
            { label: 'Conflicts', value: summary.remoteConflictCount, tone: summary.remoteConflictCount ? 'danger' : 'neutral' }
        ].forEach((item) => {
            const card = document.createElement('div');
            card.className = `ft-managed-command-center__strip-item is-${item.tone}`;
            const value = document.createElement('strong');
            value.textContent = String(Number(item.value) || 0);
            const label = document.createElement('span');
            label.textContent = item.label;
            card.append(value, label);
            strip.appendChild(card);
        });
        panel.appendChild(strip);

        if (!summary.rows.length) {
            const empty = document.createElement('div');
            empty.className = 'ft-managed-command-center__empty';
            empty.textContent = 'No protected profiles are available for this parent/account profile yet.';
            panel.appendChild(empty);
            return panel;
        }

        const selectedProfiles = new Set();
        const selectedProfileInputs = [];
        const bulkIntents = buildManagedCommandCenterBulkActionIntents(summary.rows);
        if (h.onAction && bulkIntents.length) {
            const bulkBar = document.createElement('div');
            bulkBar.className = 'ft-managed-command-center__bulk';
            const bulkStatus = document.createElement('span');
            bulkStatus.className = 'ft-managed-command-center__bulk-status';
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
            selectReadyButton.textContent = 'Select ready';
            selectReadyButton.title = 'Select protected profiles that already have a verified delivery path.';
            const clearSelectionButton = document.createElement('button');
            clearSelectionButton.className = 'btn-secondary';
            clearSelectionButton.type = 'button';
            clearSelectionButton.textContent = 'Clear';
            clearSelectionButton.title = 'Clear selected protected profiles.';
            const bulkButtons = bulkIntents.map((intent) => {
                const button = document.createElement('button');
                button.className = 'btn-secondary';
                button.type = 'button';
                button.textContent = intent.label;
                button.disabled = true;
                button.title = 'Select one or more protected profiles first. Requires parent/account re-auth.';
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    const profileIds = Array.from(selectedProfiles);
                    if (!profileIds.length) return;
                    Promise.resolve(h.onAction({ ...intent, profileIds })).catch(() => {});
                });
                return button;
            });
            const updateBulkState = () => {
                const count = selectedProfiles.size;
                bulkStatus.textContent = count
                    ? `${count} selected for managed updates`
                    : 'Select protected profiles for bulk updates';
                bulkButtons.forEach(button => {
                    button.disabled = count === 0;
                });
                clearSelectionButton.disabled = count === 0;
                selectAllButton.disabled = selectedProfileInputs.length > 0 && count === selectedProfileInputs.length;
                const readyInputs = selectedProfileInputs.filter(input => input.dataset.filtertubeSyncReady === 'true');
                const selectedReadyCount = readyInputs.filter(input => input.checked).length;
                selectReadyButton.disabled = readyInputs.length === 0 || selectedReadyCount === readyInputs.length;
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
            bulkSelectControls.append(selectAllButton, selectReadyButton, clearSelectionButton);
            bulkBar.append(bulkStatus, bulkSelectControls, ...bulkButtons);
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
            selectedProfileInputs.push(selector);
            selector.addEventListener('change', () => {
                if (selector.checked) {
                    selectedProfiles.add(item.profileId);
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
            owner.textContent = `${item.parentName} parent | ${item.locked ? 'locked' : 'unlocked'}`;
            const profileCell = document.createElement('div');
            profileCell.className = 'ft-managed-command-center__profile';
            const labelWrap = document.createElement('div');
            labelWrap.append(name, owner);
            profileCell.append(selector, labelWrap);
            const statusCell = document.createElement('div');
            statusCell.className = 'ft-managed-command-center__status';
            [
                { label: item.viewingAccess, tone: 'neutral' },
                { label: item.timeLimit, tone: item.timeLimited ? 'warning' : 'neutral' },
                { label: syncState.label, tone: syncState.tone },
                { label: item.syncLabel, tone: item.remoteScopeCount ? 'success' : 'neutral' },
                item.syncSourceAckLabel ? { label: `Ack: ${item.syncSourceAckLabel}`, tone: 'neutral' } : null
            ].filter(Boolean).forEach((chip) => {
                const status = document.createElement('span');
                status.className = `ft-managed-command-center__chip is-${chip.tone}`;
                status.textContent = chip.label;
                statusCell.appendChild(status);
            });
            row.appendChild(statusCell);
            [
                { label: 'Delivery', value: item.deliveryPreview?.label || 'Pair verified device', note: item.deliveryPathDetail },
                { label: 'Device', value: item.syncTargetLabel },
                { label: 'History', value: `${item.historyRowCount} rows | latest ${item.latestActionLabel}` }
            ].forEach((detail) => {
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
                row.appendChild(cell);
            });
            if (h.onAction && Array.isArray(item.actionIntents) && item.actionIntents.length) {
                const actionWrap = document.createElement('div');
                actionWrap.className = 'ft-managed-command-center__actions';
                item.actionIntents.forEach((intent) => {
                    const button = document.createElement('button');
                    button.className = 'btn-secondary';
                    button.type = 'button';
                    button.textContent = intent.label;
                    button.dataset.filtertubeManagedAction = intent.action;
                    button.dataset.filtertubeProfileId = intent.profileId;
                    button.title = intent.sensitiveAction
                        ? 'Requires parent/account re-auth before protected details or policy changes.'
                        : 'Uses the existing parent-managed runtime gate.';
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
