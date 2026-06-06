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
            getProfileType: typeof helpers.getProfileType === 'function' ? helpers.getProfileType : () => 'account',
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
            getManagedMailboxConfigSummary: typeof helpers.getManagedMailboxConfigSummary === 'function'
                ? helpers.getManagedMailboxConfigSummary
                : () => ({
                    configured: false,
                    label: 'Mailbox not configured',
                    detail: 'Live P2P still works; later delivery needs a configured provider.',
                    tone: 'warning'
                }),
            getManagedLocalNetworkConfigSummary: typeof helpers.getManagedLocalNetworkConfigSummary === 'function'
                ? helpers.getManagedLocalNetworkConfigSummary
                : () => ({
                    configured: false,
                    label: 'LAN provider not configured',
                    detail: 'Same-network delivery needs a configured local provider.',
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
                label: 'Send selected updates',
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
                latestDeliveryLabel: typeof summary.latestDeliveryLabel === 'string' ? summary.latestDeliveryLabel.trim() : '',
                latestDeliveryTone: typeof summary.latestDeliveryTone === 'string' ? summary.latestDeliveryTone.trim() : '',
                pendingExtraTimeRequestLabel: pendingExtraTimeRequest?.label || '',
                pendingExtraTimeRequestDetail: pendingExtraTimeRequest?.detail || '',
                pendingExtraTimeRequest: !!pendingExtraTimeRequest,
                actionIntents: buildManagedCommandCenterActionIntents(profileId, timePolicy, {
                    remoteConflictCount,
                    pendingExtraTimeRequest: !!pendingExtraTimeRequest
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
        title.textContent = 'Managed Parent Controls';
        const body = document.createElement('div');
        body.className = 'help-item-body';
        body.textContent = 'Overview of protected profiles, policy sync, time limits, action history, and delegated actions.';
        const meta = document.createElement('div');
        meta.className = 'ft-managed-command-center__meta';
        meta.textContent = `${summary.profileCount} protected profiles | ${summary.limitedCount} time limits | ${summary.pendingExtraTimeRequestCount} requests | ${summary.remoteScopeCount} remote scopes | ${summary.protectedRowCount} protected history`;
        titleWrap.append(title, body);
        heading.append(titleWrap, meta);
        panel.appendChild(heading);

        const strip = document.createElement('div');
        strip.className = 'ft-managed-command-center__strip';
        [
            { label: 'Protected', value: summary.profileCount, tone: 'neutral' },
            { label: 'Ready', value: summary.syncReadyProfileCount, tone: summary.syncReadyProfileCount ? 'success' : 'neutral' },
            { label: 'Requests', value: summary.pendingExtraTimeRequestCount, tone: summary.pendingExtraTimeRequestCount ? 'warning' : 'neutral' },
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

        const mailbox = h.safeObject(summary.mailboxConfig);
        const mailboxPanel = document.createElement('div');
        mailboxPanel.className = `ft-managed-command-center__provider is-${mailbox.tone || (mailbox.configured ? 'success' : 'warning')}`;
        const mailboxCopy = document.createElement('div');
        mailboxCopy.className = 'ft-managed-command-center__provider-copy';
        const mailboxTitle = document.createElement('strong');
        mailboxTitle.textContent = mailbox.label || (mailbox.configured ? 'Mailbox configured' : 'Mailbox not configured');
        const mailboxDetail = document.createElement('span');
        mailboxDetail.textContent = summary.profileCount > 0
            ? (mailbox.detail || 'Later delivery needs a configured encrypted mailbox provider.')
            : 'Create a protected profile first. Mailbox delivery is optional and only useful after a protected device is paired.';
        mailboxCopy.append(mailboxTitle, mailboxDetail);
        mailboxPanel.appendChild(mailboxCopy);
        if (h.onAction) {
            const mailboxButton = document.createElement('button');
            mailboxButton.className = 'btn-secondary';
            mailboxButton.type = 'button';
            mailboxButton.textContent = mailbox.configured ? 'Edit Mailbox' : 'Configure Mailbox';
            mailboxButton.title = 'Requires parent/account re-auth. The provider stores only encrypted mailbox items.';
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

        const localNetwork = h.safeObject(summary.localNetworkConfig);
        const localPanel = document.createElement('div');
        localPanel.className = `ft-managed-command-center__provider is-${localNetwork.tone || (localNetwork.configured ? 'success' : 'warning')}`;
        const localCopy = document.createElement('div');
        localCopy.className = 'ft-managed-command-center__provider-copy';
        const localTitle = document.createElement('strong');
        localTitle.textContent = localNetwork.label || (localNetwork.configured ? 'LAN provider configured' : 'LAN provider not configured');
        const localDetail = document.createElement('span');
        localDetail.textContent = summary.profileCount > 0
            ? (localNetwork.detail || 'Same-network delivery needs a configured local provider.')
            : 'Create a protected profile first. Local-network delivery is optional and does not replace signed trusted-link validation.';
        localCopy.append(localTitle, localDetail);
        localPanel.appendChild(localCopy);
        if (h.onAction) {
            const localButton = document.createElement('button');
            localButton.className = 'btn-secondary';
            localButton.type = 'button';
            localButton.textContent = localNetwork.configured ? 'Edit LAN' : 'Configure LAN';
            localButton.title = 'Requires parent/account re-auth. Discovery is not authority; signed policy validation still happens locally.';
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

        if (!summary.rows.length) {
            const empty = document.createElement('div');
            empty.className = 'ft-managed-command-center__empty';
            empty.textContent = 'No protected profiles are available for this parent/account profile yet.';
            panel.appendChild(empty);
            if (h.onAction) {
                const setup = document.createElement('div');
                setup.className = 'ft-managed-command-center__setup';
                const setupCopy = document.createElement('div');
                setupCopy.className = 'help-item-body';
                setupCopy.textContent = 'Start by creating a protected child/user profile. After that, set Main/Kids access, daily YouTube time, rules, and verified-device delivery from this panel.';
                setup.appendChild(setupCopy);

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
                    createChildBtn.textContent = 'Create Child Profile';
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
                panel.appendChild(setup);
            }
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
            const selectRequestsButton = document.createElement('button');
            selectRequestsButton.className = 'btn-secondary';
            selectRequestsButton.type = 'button';
            selectRequestsButton.textContent = 'Select requests';
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
                const requestInputs = selectedProfileInputs.filter(input => input.dataset.filtertubePendingTimeRequest === 'true');
                const selectedRequestCount = requestInputs.filter(input => input.checked).length;
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
            bulkBar.append(bulkStatus, bulkSelectControls, bulkActionWrap);
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
                item.pendingExtraTimeRequestLabel ? { label: item.pendingExtraTimeRequestLabel, tone: 'warning' } : null,
                item.latestDeliveryLabel ? { label: item.latestDeliveryLabel, tone: item.latestDeliveryTone || 'neutral' } : null,
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
                item.pendingExtraTimeRequestDetail ? { label: 'Request', value: item.pendingExtraTimeRequestDetail } : null,
                { label: 'History', value: `${item.historyRowCount} rows | latest ${item.latestActionLabel}` }
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
