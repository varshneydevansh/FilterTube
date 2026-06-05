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
                : () => ({ label: 'No verified device', targetCount: 0, readyCount: 0 }),
            onAction: typeof helpers.onAction === 'function' ? helpers.onAction : null
        };
    }

    function buildManagedCommandCenterActionIntents(profileId, timePolicy) {
        const targetId = typeof profileId === 'string' ? profileId.trim() : '';
        if (!targetId) return [];
        const timeLimitActive = timePolicy?.enabled === true;
        return [
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
                protectedRowCount: 0
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
            const latestActionLabel = summary.latestResult && summary.latestScope
                ? `${summary.latestResult}/${summary.latestScope}`
                : 'none';
            const syncLabel = summary.remoteScopeCount
                ? `Remote r${summary.latestRemoteRevision}`
                : (summary.localLabels.length ? 'Local managed' : 'No policy yet');
            rows.push({
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
                remoteScopeCount: summary.remoteScopeCount,
                historyRowCount: summary.historyRowCount,
                protectedRowCount: summary.protectedRowCount,
                latestActionLabel,
                actionIntents: buildManagedCommandCenterActionIntents(profileId, timePolicy)
            });
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
            remoteScopeCount: acc.remoteScopeCount + row.remoteScopeCount,
            historyRowCount: acc.historyRowCount + row.historyRowCount,
            protectedRowCount: acc.protectedRowCount + row.protectedRowCount
        }), {
            rows,
            bulkActionIntents: buildManagedCommandCenterBulkActionIntents(rows),
            profileCount: 0,
            limitedCount: 0,
            remoteScopeCount: 0,
            historyRowCount: 0,
            protectedRowCount: 0
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

        if (!summary.rows.length) {
            const empty = document.createElement('div');
            empty.className = 'ft-managed-command-center__empty';
            empty.textContent = 'No protected profiles are available for this parent/account profile yet.';
            panel.appendChild(empty);
            return panel;
        }

        const selectedProfiles = new Set();
        const bulkIntents = buildManagedCommandCenterBulkActionIntents(summary.rows);
        if (h.onAction && bulkIntents.length) {
            const bulkBar = document.createElement('div');
            bulkBar.className = 'ft-managed-command-center__bulk';
            const bulkStatus = document.createElement('span');
            bulkStatus.className = 'ft-managed-command-center__bulk-status';
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
            };
            bulkBar.append(bulkStatus, ...bulkButtons);
            panel.appendChild(bulkBar);
            panel.__filtertubeUpdateManagedBulkState = updateBulkState;
            updateBulkState();
        }

        const list = document.createElement('div');
        list.className = 'ft-managed-command-center__list';
        summary.rows.forEach((item) => {
            const row = document.createElement('div');
            row.className = `ft-managed-command-center__row${item.locked ? ' is-locked' : ''}`;
            const selector = document.createElement('input');
            selector.className = 'ft-managed-command-center__select';
            selector.type = 'checkbox';
            selector.setAttribute('aria-label', `Select ${item.profileName} for bulk managed update`);
            selector.dataset.filtertubeProfileId = item.profileId;
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
            for (const text of [
                item.viewingAccess,
                item.timeLimit,
                item.syncTargetLabel,
                `${item.syncLabel} | ${item.historyRowCount} history rows | latest ${item.latestActionLabel}`
            ]) {
                const cell = document.createElement('span');
                cell.textContent = text;
                row.appendChild(cell);
            }
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
        return panel;
    }

    global.FilterTubeManagedParentCommandCenter = {
        buildSummary: buildManagedCommandCenterSummary,
        buildActionIntents: buildManagedCommandCenterActionIntents,
        buildBulkActionIntents: buildManagedCommandCenterBulkActionIntents,
        render: renderManagedCommandCenter
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
