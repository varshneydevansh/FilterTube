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
            managedTimeLimitLabel: typeof helpers.managedTimeLimitLabel === 'function' ? helpers.managedTimeLimitLabel : () => 'No limit'
        };
    }

    function buildManagedCommandCenterSummary(profilesV4, { revealDetails = false, helpers = {} } = {}) {
        if (!revealDetails) {
            return {
                rows: [],
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
        h.getAccountIds(root).forEach((accountId) => {
            h.getChildrenForAccount(root, accountId).forEach((profileId) => {
                if (!h.canActiveProfileManageProfile(root, profileId)) return;
                const profile = h.safeObject(profiles[profileId]);
                const summary = h.summarizeManagedPolicyStateForProfile(profile);
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
                    parentName: h.getProfileName(root, accountId),
                    locked: h.isProfileLocked(root, profileId),
                    viewingAccess: h.viewingAccessLabel(profile),
                    timeLimit: h.managedTimeLimitLabel(profile),
                    timeLimited: !!timePolicy?.enabled,
                    syncLabel,
                    remoteScopeCount: summary.remoteScopeCount,
                    historyRowCount: summary.historyRowCount,
                    protectedRowCount: summary.protectedRowCount,
                    latestActionLabel
                });
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
            profileCount: 0,
            limitedCount: 0,
            remoteScopeCount: 0,
            historyRowCount: 0,
            protectedRowCount: 0
        });
    }

    function renderManagedCommandCenter(profilesV4, { revealDetails = false, helpers = {} } = {}) {
        if (!revealDetails || !global.document) return null;
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
        body.textContent = 'Read-only overview of protected profiles, policy sync, time limits, and action history.';
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

        const list = document.createElement('div');
        list.className = 'ft-managed-command-center__list';
        summary.rows.forEach((item) => {
            const row = document.createElement('div');
            row.className = `ft-managed-command-center__row${item.locked ? ' is-locked' : ''}`;
            const name = document.createElement('strong');
            name.textContent = item.profileName;
            const owner = document.createElement('span');
            owner.textContent = `${item.parentName} parent | ${item.locked ? 'locked' : 'unlocked'}`;
            const profileCell = document.createElement('div');
            profileCell.append(name, owner);
            for (const text of [
                item.viewingAccess,
                item.timeLimit,
                `${item.syncLabel} | ${item.historyRowCount} history rows | latest ${item.latestActionLabel}`
            ]) {
                const cell = document.createElement('span');
                cell.textContent = text;
                row.appendChild(cell);
            }
            row.prepend(profileCell);
            list.appendChild(row);
        });
        panel.appendChild(list);
        return panel;
    }

    global.FilterTubeManagedParentCommandCenter = {
        buildSummary: buildManagedCommandCenterSummary,
        render: renderManagedCommandCenter
    };
})(typeof globalThis !== 'undefined' ? globalThis : window);
