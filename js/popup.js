/**
 * Popup script for FilterTube extension (REFACTORED)
 * 
 * This script uses centralized StateManager and RenderEngine
 * to eliminate code duplication and improve maintainability.
 */

// Initialize tabs for the popup
function initializePopupFiltersTabs() {
    const container = document.getElementById('popupFiltersTabsContainer');
    if (!container) return;

    // Create Keywords tab content
    const keywordsContent = document.createElement('div');
    keywordsContent.innerHTML = `
        <div class="input-group">
            <div class="search-row">
                <input type="text" id="searchKeywordsPopup" class="text-input search-input" placeholder="Search keywords..." />
            </div>

            <div class="add-keyword-row">
                <input type="text" id="newKeywordInput" class="text-input" placeholder="Add keyword..." />
                <button id="addKeywordBtn" class="btn btn-small btn-primary">Add</button>
            </div>

            <div id="keywordList" class="keyword-list">
                <div class="empty-state">No keywords added</div>
            </div>
        </div>
    `;

    // Create Channels tab content
    const channelsContent = document.createElement('div');
    channelsContent.innerHTML = `
        <div class="input-group">
            <div class="search-row">
                <input type="text" id="searchChannelsPopup" class="text-input search-input" placeholder="Search channels..." />
            </div>

            <div class="add-keyword-row">
                <input type="text" id="channelInput" class="text-input" placeholder="Add @handle, Channel ID.. or c/ChannelName" />
                <button id="addChannelBtn" class="btn btn-small btn-primary">Add</button>
            </div>

            <div id="channelList" class="keyword-list">
                <div class="empty-state">No channels added</div>
            </div>
        </div>
    `;

    // Create Content tab content
    const contentTab = document.createElement('div');

    const contentSearchRow = document.createElement('div');
    contentSearchRow.className = 'search-row';

    const contentControlsSearch = document.createElement('input');
    contentControlsSearch.type = 'text';
    contentControlsSearch.id = 'searchContentControlsPopup';
    contentControlsSearch.className = 'text-input search-input';
    contentControlsSearch.placeholder = 'Search content controls...';

    contentSearchRow.appendChild(contentControlsSearch);
    contentTab.appendChild(contentSearchRow);

    const catalog = window.FilterTubeContentControlsCatalog?.getCatalog?.() || [];
    let feedRowsContainer = null;

    function hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string') return '';
        const sanitized = hex.replace('#', '');
        const bigint = parseInt(sanitized.length === 3
            ? sanitized.split('').map(ch => ch + ch).join('')
            : sanitized, 16);
        if (Number.isNaN(bigint)) return '';
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function applyControlGroupTheme(groupEl, accentColor) {
        if (!groupEl || !accentColor) return;
        groupEl.style.setProperty('--ft-control-accent', accentColor);
        groupEl.style.setProperty('--ft-control-accent-border', hexToRgba(accentColor, 0.35));
        groupEl.style.setProperty('--ft-control-accent-bg', hexToRgba(accentColor, 0.08));
        groupEl.style.setProperty('--ft-control-accent-row-border', hexToRgba(accentColor, 0.28));
        groupEl.style.setProperty('--ft-control-accent-row-bg', hexToRgba(accentColor, 0.08));
        groupEl.style.setProperty('--ft-control-accent-row-hover-bg', hexToRgba(accentColor, 0.14));
    }

    catalog.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.setAttribute('data-ft-control-group', 'true');
        groupEl.setAttribute('data-ft-group-title', group?.title || '');
        groupEl.setAttribute('data-ft-group-id', group?.id || '');
        groupEl.className = 'content-control-group';
        applyControlGroupTheme(groupEl, group?.accentColor);

        const headerEl = document.createElement('div');
        headerEl.className = 'content-control-group__header';

        const titleEl = document.createElement('div');
        titleEl.className = 'content-control-group__title';
        titleEl.textContent = group?.title || '';

        headerEl.appendChild(titleEl);
        groupEl.appendChild(headerEl);

        const rowsContainer = document.createElement('div');
        rowsContainer.className = 'content-control-group__rows';

        if (group?.id === 'feed') {
            feedRowsContainer = rowsContainer;
        }

        (group.controls || []).forEach(control => {
            const row = document.createElement('div');
            row.className = 'toggle-row';
            row.setAttribute('data-ft-control-row', 'true');
            row.setAttribute('data-ft-search', `${control.title || ''} ${control.description || ''}`.toLowerCase());

            const label = document.createElement('label');
            const checkboxId = `popupSetting_${control.key}`;
            label.setAttribute('for', checkboxId);
            label.className = 'toggle-label';
            label.innerHTML = `
                <span class="toggle-title">${control.title || ''}</span>
            `;

            const switchLabel = document.createElement('label');
            switchLabel.className = 'switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = checkboxId;
            input.setAttribute('data-ft-setting', control.key);

            const slider = document.createElement('span');
            slider.className = 'slider round';

            switchLabel.appendChild(input);
            switchLabel.appendChild(slider);

            row.appendChild(label);
            row.appendChild(switchLabel);
            rowsContainer.appendChild(row);
        });

        groupEl.appendChild(rowsContainer);
        contentTab.appendChild(groupEl);
    });

    const videoFiltersRows = feedRowsContainer || (() => {
        const videoFiltersSection = document.createElement('div');
        videoFiltersSection.className = 'content-control-group video-filters-section';
        videoFiltersSection.style.marginTop = '16px';
        videoFiltersSection.style.borderTop = '1px solid var(--ft-color-sem-neutral-border)';
        videoFiltersSection.setAttribute('data-ft-control-group', 'true');
        videoFiltersSection.setAttribute('data-ft-group-title', 'Feeds');

        const videoFiltersHeader = document.createElement('div');
        videoFiltersHeader.className = 'content-control-group__header';

        const videoFiltersTitle = document.createElement('div');
        videoFiltersTitle.className = 'content-control-group__title';
        videoFiltersTitle.textContent = 'Feeds';

        videoFiltersHeader.appendChild(videoFiltersTitle);
        videoFiltersSection.appendChild(videoFiltersHeader);

        const rows = document.createElement('div');
        rows.className = 'content-control-group__rows';
        videoFiltersSection.appendChild(rows);
        contentTab.appendChild(videoFiltersSection);
        return rows;
    })();

    // Duration filter row (compact)
    const durationRow = document.createElement('div');
    durationRow.className = 'toggle-row';
    durationRow.setAttribute('data-ft-control-row', 'true');
    durationRow.setAttribute('data-ft-search', 'duration filter');

    const durationInfo = document.createElement('div');
    durationInfo.className = 'toggle-info';

    const durationTitle = document.createElement('div');
    durationTitle.className = 'toggle-title';
    durationTitle.textContent = 'Duration Filter';
    durationTitle.title = 'Hide long videos (>60m)';

    durationInfo.appendChild(durationTitle);

    const durationToggle = document.createElement('label');
    durationToggle.className = 'switch';

    const durationCheckbox = document.createElement('input');
    durationCheckbox.type = 'checkbox';
    durationCheckbox.id = 'popupVideoFilter_duration_enabled';

    const durationSlider = document.createElement('span');
    durationSlider.className = 'slider round';

    durationToggle.appendChild(durationCheckbox);
    durationToggle.appendChild(durationSlider);

    durationRow.appendChild(durationInfo);
    durationRow.appendChild(durationToggle);
    videoFiltersRows.appendChild(durationRow);

    const kidsDurationRow = document.createElement('div');
    kidsDurationRow.className = 'toggle-row ft-kids-sub-toggle-row';
    kidsDurationRow.setAttribute('data-ft-control-row', 'true');
    kidsDurationRow.setAttribute('data-ft-search', 'duration filter');

    const kidsDurationInfo = document.createElement('div');
    kidsDurationInfo.className = 'toggle-info';

    const kidsDurationTitle = document.createElement('div');
    kidsDurationTitle.className = 'toggle-title';
    kidsDurationTitle.textContent = 'Duration Filter';

    kidsDurationInfo.appendChild(kidsDurationTitle);

    const kidsDurationToggle = document.createElement('label');
    kidsDurationToggle.className = 'switch';

    const kidsDurationCheckbox = document.createElement('input');
    kidsDurationCheckbox.type = 'checkbox';
    kidsDurationCheckbox.id = 'popupVideoFilter_duration_enabled_kids';

    const kidsDurationSlider = document.createElement('span');
    kidsDurationSlider.className = 'slider round';

    kidsDurationToggle.appendChild(kidsDurationCheckbox);
    kidsDurationToggle.appendChild(kidsDurationSlider);

    kidsDurationRow.appendChild(kidsDurationInfo);
    kidsDurationRow.appendChild(kidsDurationToggle);

    // Upload date filter row (compact)
    const uploadDateRow = document.createElement('div');
    uploadDateRow.className = 'toggle-row';
    uploadDateRow.setAttribute('data-ft-control-row', 'true');
    uploadDateRow.setAttribute('data-ft-search', 'upload date filter');

    const uploadDateInfo = document.createElement('div');
    uploadDateInfo.className = 'toggle-info';

    const uploadDateTitle = document.createElement('div');
    uploadDateTitle.className = 'toggle-title';
    uploadDateTitle.textContent = 'Upload Date Filter';
    uploadDateTitle.title = 'Shows videos from the past 30 days';

    uploadDateInfo.appendChild(uploadDateTitle);

    const uploadDateToggle = document.createElement('label');
    uploadDateToggle.className = 'switch';

    const uploadDateCheckbox = document.createElement('input');
    uploadDateCheckbox.type = 'checkbox';
    uploadDateCheckbox.id = 'popupVideoFilter_uploadDate_enabled';

    const uploadDateSlider = document.createElement('span');
    uploadDateSlider.className = 'slider round';

    uploadDateToggle.appendChild(uploadDateCheckbox);
    uploadDateToggle.appendChild(uploadDateSlider);

    uploadDateRow.appendChild(uploadDateInfo);
    uploadDateRow.appendChild(uploadDateToggle);
    videoFiltersRows.appendChild(uploadDateRow);

    const kidsUploadDateRow = document.createElement('div');
    kidsUploadDateRow.className = 'toggle-row ft-kids-sub-toggle-row';
    kidsUploadDateRow.setAttribute('data-ft-control-row', 'true');
    kidsUploadDateRow.setAttribute('data-ft-search', 'upload date filter');

    const kidsUploadDateInfo = document.createElement('div');
    kidsUploadDateInfo.className = 'toggle-info';

    const kidsUploadDateTitle = document.createElement('div');
    kidsUploadDateTitle.className = 'toggle-title';
    kidsUploadDateTitle.textContent = 'Upload Date Filter';

    kidsUploadDateInfo.appendChild(kidsUploadDateTitle);

    const kidsUploadDateToggle = document.createElement('label');
    kidsUploadDateToggle.className = 'switch';

    const kidsUploadDateCheckbox = document.createElement('input');
    kidsUploadDateCheckbox.type = 'checkbox';
    kidsUploadDateCheckbox.id = 'popupVideoFilter_uploadDate_enabled_kids';

    const kidsUploadDateSlider = document.createElement('span');
    kidsUploadDateSlider.className = 'slider round';

    kidsUploadDateToggle.appendChild(kidsUploadDateCheckbox);
    kidsUploadDateToggle.appendChild(kidsUploadDateSlider);

    kidsUploadDateRow.appendChild(kidsUploadDateInfo);
    kidsUploadDateRow.appendChild(kidsUploadDateToggle);

    // Uppercase title filter row (compact)
    const uppercaseRow = document.createElement('div');
    uppercaseRow.className = 'toggle-row';
    uppercaseRow.setAttribute('data-ft-control-row', 'true');
    uppercaseRow.setAttribute('data-ft-search', 'uppercase title filter');

    const uppercaseInfo = document.createElement('div');
    uppercaseInfo.className = 'toggle-info';

    const uppercaseTitle = document.createElement('div');
    uppercaseTitle.className = 'toggle-title';
    uppercaseTitle.textContent = 'Uppercase Title Filter';
    uppercaseTitle.title = 'Block AI slop with ALL CAPS titles';

    uppercaseInfo.appendChild(uppercaseTitle);

    const uppercaseToggle = document.createElement('label');
    uppercaseToggle.className = 'switch';

    const uppercaseCheckbox = document.createElement('input');
    uppercaseCheckbox.type = 'checkbox';
    uppercaseCheckbox.id = 'popupVideoFilter_uppercase_enabled';

    const uppercaseSlider = document.createElement('span');
    uppercaseSlider.className = 'slider round';

    uppercaseToggle.appendChild(uppercaseCheckbox);
    uppercaseToggle.appendChild(uppercaseSlider);

    uppercaseRow.appendChild(uppercaseInfo);
    uppercaseRow.appendChild(uppercaseToggle);
    videoFiltersRows.appendChild(uppercaseRow);

    const kidsUppercaseRow = document.createElement('div');
    kidsUppercaseRow.className = 'toggle-row ft-kids-sub-toggle-row';
    kidsUppercaseRow.setAttribute('data-ft-control-row', 'true');
    kidsUppercaseRow.setAttribute('data-ft-search', 'uppercase title filter');

    const kidsUppercaseInfo = document.createElement('div');
    kidsUppercaseInfo.className = 'toggle-info';

    const kidsUppercaseTitle = document.createElement('div');
    kidsUppercaseTitle.className = 'toggle-title';
    kidsUppercaseTitle.textContent = 'Uppercase Title Filter';

    kidsUppercaseInfo.appendChild(kidsUppercaseTitle);

    const kidsUppercaseToggle = document.createElement('label');
    kidsUppercaseToggle.className = 'switch';

    const kidsUppercaseCheckbox = document.createElement('input');
    kidsUppercaseCheckbox.type = 'checkbox';
    kidsUppercaseCheckbox.id = 'popupVideoFilter_uppercase_enabled_kids';

    const kidsUppercaseSlider = document.createElement('span');
    kidsUppercaseSlider.className = 'slider round';

    kidsUppercaseToggle.appendChild(kidsUppercaseCheckbox);
    kidsUppercaseToggle.appendChild(kidsUppercaseSlider);

    kidsUppercaseRow.appendChild(kidsUppercaseInfo);
    kidsUppercaseRow.appendChild(kidsUppercaseToggle);

    const manageInTab = document.createElement('button');
    manageInTab.className = 'video-filters-manage';
    manageInTab.type = 'button';
    manageInTab.textContent = 'Manage in Tab View';

    videoFiltersRows.appendChild(manageInTab);

    // Wire up popup video filter event listeners
    function updatePopupVideoFilterUI() {
        if (!videoFiltersRows) return;
    }

    function applyPopupContentFilters(contentFilters = {}) {
        const durationEnabled = document.getElementById('popupVideoFilter_duration_enabled');
        const uploadEnabled = document.getElementById('popupVideoFilter_uploadDate_enabled');
        const uppercaseEnabled = document.getElementById('popupVideoFilter_uppercase_enabled');

        const kidsDurationEnabled = document.getElementById('popupVideoFilter_duration_enabled_kids');
        const kidsUploadEnabled = document.getElementById('popupVideoFilter_uploadDate_enabled_kids');
        const kidsUppercaseEnabled = document.getElementById('popupVideoFilter_uppercase_enabled_kids');

        if (durationEnabled) durationEnabled.checked = !!contentFilters.duration?.enabled;
        if (uploadEnabled) uploadEnabled.checked = !!contentFilters.uploadDate?.enabled;
        if (uppercaseEnabled) uppercaseEnabled.checked = !!contentFilters.uppercase?.enabled;

    }

    function applyPopupKidsContentFilters(contentFilters = {}) {
        const kidsDurationEnabled = document.getElementById('popupVideoFilter_duration_enabled_kids')
            || document.getElementById('popupVideoFilter_duration_enabled');
        const kidsUploadEnabled = document.getElementById('popupVideoFilter_uploadDate_enabled_kids')
            || document.getElementById('popupVideoFilter_uploadDate_enabled');
        const kidsUppercaseEnabled = document.getElementById('popupVideoFilter_uppercase_enabled_kids')
            || document.getElementById('popupVideoFilter_uppercase_enabled');

        if (kidsDurationEnabled) kidsDurationEnabled.checked = !!contentFilters.duration?.enabled;
        if (kidsUploadEnabled) kidsUploadEnabled.checked = !!contentFilters.uploadDate?.enabled;
        if (kidsUppercaseEnabled) kidsUppercaseEnabled.checked = !!contentFilters.uppercase?.enabled;
    }

    async function resolveProfileTypeFromTabs() {
        try {
            const tabsApi = (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function')
                ? chrome.tabs
                : ((typeof browser !== 'undefined' && browser.tabs && typeof browser.tabs.query === 'function') ? browser.tabs : null);
            if (!tabsApi) return 'main';

            const tabs = await new Promise(resolve => {
                try {
                    const maybePromise = tabsApi.query({ active: true, currentWindow: true }, (result) => resolve(result));
                    if (maybePromise && typeof maybePromise.then === 'function') {
                        maybePromise.then(resolve).catch(() => resolve([]));
                    }
                } catch (e) {
                    resolve([]);
                }
            });

            const url = String(tabs && tabs[0] && tabs[0].url ? tabs[0].url : '');
            if (url && /^(https?:\/\/)?([^\/]+\.)?youtubekids\.com\b/i.test(url)) {
                return 'kids';
            }
        } catch (e) {
        }
        return 'main';
    }

    async function updatePopupVideoFiltersVisibility() {
        const profileType = await resolveProfileTypeFromTabs();
        const showKids = profileType === 'kids';

        const mainRows = [
            document.getElementById('popupVideoFilter_duration_enabled')?.closest('.toggle-row'),
            document.getElementById('popupVideoFilter_uploadDate_enabled')?.closest('.toggle-row'),
            document.getElementById('popupVideoFilter_uppercase_enabled')?.closest('.toggle-row')
        ].filter(Boolean);

        const kidsRows = [
            document.getElementById('popupVideoFilter_duration_enabled_kids')?.closest('.toggle-row'),
            document.getElementById('popupVideoFilter_uploadDate_enabled_kids')?.closest('.toggle-row'),
            document.getElementById('popupVideoFilter_uppercase_enabled_kids')?.closest('.toggle-row')
        ].filter(Boolean);

        if (kidsRows.length === 0) {
            mainRows.forEach(row => row.style.display = 'flex');
        } else {
            mainRows.forEach(row => row.style.display = showKids ? 'none' : 'flex');
            kidsRows.forEach(row => row.style.display = showKids ? 'flex' : 'none');
        }

        manageInTab.textContent = showKids ? 'Manage Kids Content Controls in Tab View' : 'Manage Categories in Tab View';
    }

    async function applyPopupVideoFiltersForActiveProfile() {
        try {
            const profileType = await resolveProfileTypeFromTabs();
            const state = StateManager.getState();
            if (profileType === 'kids') {
                applyPopupKidsContentFilters(state?.kids?.contentFilters || {});
            } else {
                applyPopupContentFilters(state?.contentFilters || {});
            }
        } catch (e) {
        }
    }

    function savePopupVideoFilters(profileType) {
        const state = StateManager.getState();
        const type = profileType === 'kids' ? 'kids' : 'main';

        if (type === 'kids') {
            const durationEnabled = (document.getElementById('popupVideoFilter_duration_enabled_kids')
                || document.getElementById('popupVideoFilter_duration_enabled'))?.checked || false;
            const uploadEnabled = (document.getElementById('popupVideoFilter_uploadDate_enabled_kids')
                || document.getElementById('popupVideoFilter_uploadDate_enabled'))?.checked || false;
            const uppercaseEnabled = (document.getElementById('popupVideoFilter_uppercase_enabled_kids')
                || document.getElementById('popupVideoFilter_uppercase_enabled'))?.checked || false;
            const prior = state?.kids?.contentFilters || {};
            return StateManager.updateKidsContentFilters({
                duration: { ...(prior.duration || {}), enabled: durationEnabled },
                uploadDate: { ...(prior.uploadDate || {}), enabled: uploadEnabled },
                uppercase: { ...(prior.uppercase || {}), enabled: uppercaseEnabled }
            });
        }

        const durationEnabled = document.getElementById('popupVideoFilter_duration_enabled')?.checked || false;
        const uploadEnabled = document.getElementById('popupVideoFilter_uploadDate_enabled')?.checked || false;
        const uppercaseEnabled = document.getElementById('popupVideoFilter_uppercase_enabled')?.checked || false;
        const prior = state?.contentFilters || {};
        return StateManager.updateContentFilters({
            duration: { ...(prior.duration || {}), enabled: durationEnabled },
            uploadDate: { ...(prior.uploadDate || {}), enabled: uploadEnabled },
            uppercase: { ...(prior.uppercase || {}), enabled: uppercaseEnabled }
        });
    }

    // Attach listeners after delay
    setTimeout(() => {
        const durationEnabled = document.getElementById('popupVideoFilter_duration_enabled');
        const uploadEnabled = document.getElementById('popupVideoFilter_uploadDate_enabled');
        const uppercaseEnabled = document.getElementById('popupVideoFilter_uppercase_enabled');

        const kidsDurationEnabled = document.getElementById('popupVideoFilter_duration_enabled_kids');
        const kidsUploadEnabled = document.getElementById('popupVideoFilter_uploadDate_enabled_kids');
        const kidsUppercaseEnabled = document.getElementById('popupVideoFilter_uppercase_enabled_kids');

        durationEnabled?.addEventListener('change', async () => {
            const profileType = await resolveProfileTypeFromTabs();
            savePopupVideoFilters(profileType);
        });
        uploadEnabled?.addEventListener('change', async () => {
            const profileType = await resolveProfileTypeFromTabs();
            savePopupVideoFilters(profileType);
        });
        uppercaseEnabled?.addEventListener('change', async () => {
            const profileType = await resolveProfileTypeFromTabs();
            savePopupVideoFilters(profileType);
        });
        kidsDurationEnabled?.addEventListener('change', async () => {
            const profileType = await resolveProfileTypeFromTabs();
            if (profileType === 'kids') {
                savePopupVideoFilters('kids');
            }
        });
        kidsUploadEnabled?.addEventListener('change', async () => {
            const profileType = await resolveProfileTypeFromTabs();
            if (profileType === 'kids') {
                savePopupVideoFilters('kids');
            }
        });
        kidsUppercaseEnabled?.addEventListener('change', async () => {
            const profileType = await resolveProfileTypeFromTabs();
            if (profileType === 'kids') {
                savePopupVideoFilters('kids');
            }
        });

        manageInTab.addEventListener('click', () => {
            try {
                resolveProfileTypeFromTabs().then((profileType) => {
                    const isKids = profileType === 'kids';
                    const url = isKids
                        ? chrome.runtime.getURL('html/tab-view.html?view=kids&section=content')
                        : chrome.runtime.getURL('html/tab-view.html?view=filters&section=categories');
                    if (chrome?.tabs?.create) {
                        chrome.tabs.create({ url });
                    }
                });
            } catch (e) {
            }
        });

        applyPopupVideoFiltersForActiveProfile();
        updatePopupVideoFilterUI();
        updatePopupVideoFiltersVisibility();
    }, 100);

    StateManager.subscribe((eventType, data) => {
        if (eventType === 'contentFiltersUpdated') {
            applyPopupVideoFiltersForActiveProfile();
        }
        if (eventType === 'kidsContentFiltersUpdated') {
            applyPopupVideoFiltersForActiveProfile();
        }
    });

    // Create tabs using UIComponents
    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'keywords', label: 'Keywords', content: keywordsContent },
            { id: 'channels', label: 'Channels', content: channelsContent },
            {
                id: 'content',
                label: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
                content: contentTab
            }
        ],
        defaultTab: 'keywords'
    });

    container.appendChild(tabs.container);
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize tabs first
    initializePopupFiltersTabs();

    // Get DOM elements
    const newKeywordInput = document.getElementById('newKeywordInput');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordList = document.getElementById('keywordList');
    const searchKeywordsPopup = document.getElementById('searchKeywordsPopup');

    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListEl = document.getElementById('channelList');
    const searchChannelsPopup = document.getElementById('searchChannelsPopup');

    const ftTopBarListModeControlsPopup = document.getElementById('ftTopBarListModeControlsPopup');

    const contentControlsContainer = document.getElementById('popupFiltersTabsContainer');
    const contentControlCheckboxes = contentControlsContainer
        ? contentControlsContainer.querySelectorAll('input[type="checkbox"][data-ft-setting]')
        : [];

    function applyPopupContentControlsVisibility(profileType) {
        if (!contentControlsContainer) return;
        const type = profileType === 'kids' ? 'kids' : 'main';
        const groups = contentControlsContainer.querySelectorAll('[data-ft-control-group]');
        const allowedKidsGroups = new Set(['feed']);
        groups.forEach(groupEl => {
            const id = (groupEl.getAttribute('data-ft-group-id') || '').trim();
            if (type === 'kids') {
                groupEl.hidden = !allowedKidsGroups.has(id);
            } else {
                groupEl.hidden = false;
            }

            if (type === 'kids' && id === 'feed') {
                try {
                    const rows = groupEl.querySelectorAll('.toggle-row');
                    rows.forEach(row => {
                        const hasCatalogToggle = !!row.querySelector('input[type="checkbox"][data-ft-setting]');
                        if (hasCatalogToggle) {
                            row.hidden = true;
                        } else {
                            row.hidden = false;
                        }
                    });
                } catch (e) {
                }
            } else {
                try {
                    const rows = groupEl.querySelectorAll('.toggle-row');
                    rows.forEach(row => row.hidden = false);
                } catch (e) {
                }
            }
        });
        try {
            filterContentControlsPopup();
        } catch (e) {
        }
    }

    const openInTabBtn = document.getElementById('openInTabBtn');
    const toggleEnabledBrandBtn = document.getElementById('toggleEnabledBrandBtn');

    const ftProfileMenuPopup = document.getElementById('ftProfileMenuPopup');
    const ftProfileBadgeBtnPopup = document.getElementById('ftProfileBadgeBtnPopup');
    const ftProfileDropdownPopup = document.getElementById('ftProfileDropdownPopup');

    let profilesV4Cache = null;
    let isHandlingProfileSwitch = false;
    let popupActiveProfileType = 'main';
    const unlockedProfiles = new Set();

    async function sendRuntimeMessage(payload) {
        return new Promise((resolve) => {
            try {
                if (!chrome?.runtime?.sendMessage) {
                    resolve(null);
                    return;
                }

                const maybePromise = chrome.runtime.sendMessage(payload, (resp) => {
                    const err = chrome.runtime?.lastError;
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(resp);
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then(resolve).catch(() => resolve(null));
                }
            } catch (e) {
                resolve(null);
            }
        });
    }

    async function syncSessionUnlockStateFromBackground() {
        return;
    }

    async function notifyBackgroundUnlocked(profileId, pin = '') {
        try {
            const id = normalizeString(profileId);
            const normalizedPin = normalizeString(pin);
            if (!id || !normalizedPin) return;
            await sendRuntimeMessage({
                action: 'FilterTube_SessionPinAuth',
                profileId: id,
                pin: normalizedPin
            });
        } catch (e) {
        }
    }

    function renderListModeControls() {
        const state = StateManager.getState();
        const locked = isUiLocked();
        const resolveProfileTypeFromTabs = async () => {
            try {
                const tabsApi = (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function')
                    ? chrome.tabs
                    : ((typeof browser !== 'undefined' && browser.tabs && typeof browser.tabs.query === 'function') ? browser.tabs : null);
                if (!tabsApi) return 'main';

                const tabs = await new Promise(resolve => {
                    try {
                        const maybePromise = tabsApi.query({ active: true, currentWindow: true }, (result) => {
                            resolve(result);
                        });
                        if (maybePromise && typeof maybePromise.then === 'function') {
                            maybePromise.then(resolve).catch(() => resolve([]));
                        }
                    } catch (e) {
                        try {
                            const maybePromise = tabsApi.query({ active: true, currentWindow: true });
                            if (maybePromise && typeof maybePromise.then === 'function') {
                                maybePromise.then(resolve).catch(() => resolve([]));
                            } else {
                                resolve(Array.isArray(maybePromise) ? maybePromise : []);
                            }
                        } catch (e2) {
                            resolve([]);
                        }
                    }
                });

                const url = String(tabs && tabs[0] && tabs[0].url ? tabs[0].url : '');
                if (url && /^(https?:\/\/)?([^\/]+\.)?youtubekids\.com\b/i.test(url)) {
                    return 'kids';
                }
            } catch (e) {
            }
            return 'main';
        };

        const uiProfileType = popupActiveProfileType === 'kids' ? 'kids' : 'main';
        const effectiveMode = uiProfileType === 'kids'
            ? (state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist')
            : (state?.mode === 'whitelist' ? 'whitelist' : 'blocklist');

        if (!ftTopBarListModeControlsPopup) return;
        ftTopBarListModeControlsPopup.innerHTML = '';

        const toggle = UIComponents.createToggleButton({
            text: uiProfileType === 'kids' ? 'Whitelist Kids' : 'Whitelist',
            active: effectiveMode === 'whitelist',
            onToggle: async (nextState) => {
                if (isUiLocked()) {
                    renderListModeControls();
                    return;
                }

                const profileType = await resolveProfileTypeFromTabs();
                const currentMode = profileType === 'kids'
                    ? (state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist')
                    : (state?.mode === 'whitelist' ? 'whitelist' : 'blocklist');

                const enablingWhitelist = nextState === true;
                const disablingWhitelist = nextState !== true && currentMode === 'whitelist';
                const whitelistEmpty = profileType === 'kids'
                    ? ((state?.kids?.whitelistChannels?.length || 0) === 0 && (state?.kids?.whitelistKeywords?.length || 0) === 0)
                    : ((state?.whitelistChannels?.length || 0) === 0 && (state?.whitelistKeywords?.length || 0) === 0);
                let copyBlocklist = false;
                if (enablingWhitelist && whitelistEmpty) {
                    const msg = profileType === 'kids'
                        ? 'Copy your current YT Kids blocklist into whitelist to get started?'
                        : 'Copy your current blocklist into whitelist to get started?';
                    copyBlocklist = window.confirm(msg);
                    if (!copyBlocklist) {
                        const toastMsg = profileType === 'kids'
                            ? 'YT Kids whitelist is empty — videos will stay hidden until you add allow rules.'
                            : 'Whitelist is empty — videos will stay hidden until you add allow rules.';
                        UIComponents.showToast(toastMsg, 'info');
                    }
                }

                let resp = null;
                if (disablingWhitelist && !whitelistEmpty) {
                    const confirmMsg = profileType === 'kids'
                        ? 'Move your YT Kids whitelist back into blocklist? This will clear the YT Kids whitelist.'
                        : 'Move your whitelist back into blocklist? This will clear whitelist.';
                    const shouldTransfer = window.confirm(confirmMsg);
                    if (shouldTransfer) {
                        resp = await sendRuntimeMessage({
                            action: 'FilterTube_TransferWhitelistToBlocklist',
                            profileType
                        });
                    }
                    // If user clicked Cancel and we're disabling whitelist, don't proceed with mode change
                    if (!shouldTransfer) {
                        renderListModeControls();
                        return;
                    }
                }

                if (!resp) {
                    resp = await sendRuntimeMessage({
                        action: 'FilterTube_SetListMode',
                        profileType,
                        mode: nextState ? 'whitelist' : 'blocklist',
                        copyBlocklist
                    });
                }

                if (!resp || resp.ok !== true) {
                    UIComponents.showToast('Failed to update list mode', 'error');
                    renderListModeControls();
                    return;
                }

                await StateManager.loadSettings();
                renderKeywords();
                renderChannels();
                updateCheckboxes();
                renderListModeControls();
            },
            className: ''
        });

        ftTopBarListModeControlsPopup.appendChild(toggle);

        resolveProfileTypeFromTabs().then(profileType => {
            try {
                const resolved = profileType === 'kids' ? 'kids' : 'main';
                if (popupActiveProfileType !== resolved) {
                    popupActiveProfileType = resolved;
                    try {
                        renderKeywords();
                        renderChannels();
                    } catch (e) {
                    }
                    try {
                        applyPopupContentControlsVisibility(resolved);
                    } catch (e) {
                    }
                    renderListModeControls();
                }
            } catch (e) {
            }
        });
    }

    let lockGateEl = null;

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function extractMasterPinVerifier(profilesV4) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const master = safeObject(profiles.default);
        const security = safeObject(master.security);
        const verifier = security.masterPinVerifier || security.masterPin || null;
        return verifier && typeof verifier === 'object' ? verifier : null;
    }

    function extractProfilePinVerifier(profilesV4, profileId) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const profile = safeObject(profiles[profileId]);
        const security = safeObject(profile.security);
        const verifier = security.profilePinVerifier || security.pinVerifier || null;
        return verifier && typeof verifier === 'object' ? verifier : null;
    }

    function isProfileLocked(profilesV4, profileId) {
        if (profileId === 'default') {
            return !!extractMasterPinVerifier(profilesV4);
        }
        return !!extractProfilePinVerifier(profilesV4, profileId);
    }

    function getProfileName(profilesV4, profileId) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const profile = safeObject(profiles[profileId]);
        const raw = normalizeString(profile.name);
        if (raw) return raw;
        return profileId === 'default' ? 'Default' : 'Profile';
    }

    function buildProfileLabel(profilesV4, profileId) {
        const name = getProfileName(profilesV4, profileId);
        const locked = isProfileLocked(profilesV4, profileId);
        if (profileId === 'default') {
            return locked ? `${name} (Master, locked)` : `${name} (Master)`;
        }
        const type = getProfileType(profilesV4, profileId);
        if (type === 'account') {
            return locked ? `${name} (Account, locked)` : `${name} (Account)`;
        }
        return locked ? `${name} (Child, locked)` : `${name} (Child)`;
    }

    function buildProfileSubtitle(profilesV4, profileId) {
        const locked = isProfileLocked(profilesV4, profileId);
        if (profileId === 'default') {
            return locked ? 'Master • Locked' : 'Master';
        }
        const type = getProfileType(profilesV4, profileId);
        if (type === 'account') {
            return locked ? 'Account • Locked' : 'Account';
        }
        return locked ? 'Child • Locked' : 'Child';
    }

    function getProfileType(profilesV4, profileId) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const profile = safeObject(profiles[profileId]);
        if (profileId === 'default') return 'account';
        const rawType = normalizeString(profile.type).toLowerCase();
        return rawType === 'account' ? 'account' : 'child';
    }

    function getParentAccountId(profilesV4, profileId) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        if (profileId === 'default') return 'default';
        const type = getProfileType(profilesV4, profileId);
        if (type === 'account') return profileId;
        const profile = safeObject(profiles[profileId]);
        const parent = normalizeString(profile.parentProfileId);
        if (parent && profiles[parent] && getProfileType(profilesV4, parent) === 'account') {
            return parent;
        }
        return 'default';
    }

    function getSortedIdsByName(profilesV4, ids) {
        const out = Array.isArray(ids) ? [...ids] : [];
        out.sort((a, b) => {
            if (a === 'default') return -1;
            if (b === 'default') return 1;
            const an = getProfileName(profilesV4, a).toLowerCase();
            const bn = getProfileName(profilesV4, b).toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return a.localeCompare(b);
        });
        return out;
    }

    function getAccountIds(profilesV4) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const ids = Object.keys(profiles).filter(id => getProfileType(profilesV4, id) === 'account');
        return getSortedIdsByName(profilesV4, ids);
    }

    function getChildrenForAccount(profilesV4, accountId) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const ids = Object.keys(profiles).filter((id) => {
            if (id === 'default') return false;
            if (getProfileType(profilesV4, id) !== 'child') return false;
            return getParentAccountId(profilesV4, id) === accountId;
        });
        return getSortedIdsByName(profilesV4, ids);
    }

    function getProfileColors(seed) {
        try {
            const colorsApi = window.UIComponents?.getProfileColors;
            if (typeof colorsApi === 'function') {
                return colorsApi(seed);
            }
        } catch (e) {
        }
        return {
            bg: 'hsl(0 0% 90%)',
            fg: 'hsl(0 0% 18%)',
            accent: 'hsl(160 40% 40%)',
            accentBg: 'hsla(160, 40%, 40%, 0.14)',
            accentBorder: 'hsla(160, 40%, 40%, 0.55)'
        };
    }

    function getProfileInitial(profilesV4, profileId) {
        const name = normalizeString(getProfileName(profilesV4, profileId)) || normalizeString(profileId);
        const char = name ? name.slice(0, 1).toUpperCase() : '?';
        return char;
    }

    function closeProfileDropdown() {
        if (!ftProfileDropdownPopup || !ftProfileBadgeBtnPopup) return;
        ftProfileDropdownPopup.hidden = true;
        ftProfileDropdownPopup.style.transform = '';
        ftProfileBadgeBtnPopup.setAttribute('aria-expanded', 'false');
    }

    function positionProfileDropdown() {
        if (!ftProfileDropdownPopup || ftProfileDropdownPopup.hidden) return;
        try {
            const rect = ftProfileDropdownPopup.getBoundingClientRect();
            const pad = 8;
            const maxRight = window.innerWidth - pad;
            let shift = 0;
            if (rect.left < pad) {
                shift = pad - rect.left;
            } else if (rect.right > maxRight) {
                shift = maxRight - rect.right;
            }
            ftProfileDropdownPopup.style.transform = shift ? `translateX(${shift}px)` : '';
        } catch (e) {
        }
    }

    function toggleProfileDropdown() {
        if (!ftProfileDropdownPopup || !ftProfileBadgeBtnPopup) return;
        const next = !ftProfileDropdownPopup.hidden;
        ftProfileDropdownPopup.hidden = next;
        ftProfileBadgeBtnPopup.setAttribute('aria-expanded', next ? 'false' : 'true');
        if (!next) {
            requestAnimationFrame(() => positionProfileDropdown());
        }
    }

    async function showPromptModal({ title, message, placeholder = '', inputType = 'text', confirmText = 'Confirm', cancelText = 'Cancel', initialValue = '' }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ft-modal-overlay';

            const card = document.createElement('div');
            card.className = 'card ft-modal';

            const header = document.createElement('div');
            header.className = 'card-header';
            const titleEl = document.createElement('h3');
            titleEl.className = 'ft-modal-title';
            titleEl.textContent = title;
            header.appendChild(titleEl);

            const body = document.createElement('div');
            body.className = 'card-body ft-modal-body';

            if (message) {
                const msg = document.createElement('div');
                msg.className = 'import-export-hint';
                msg.textContent = message;
                body.appendChild(msg);
            }

            const input = document.createElement('input');
            input.className = 'text-input';
            input.type = inputType;
            input.placeholder = placeholder;
            input.value = initialValue;
            body.appendChild(input);

            const actions = document.createElement('div');
            actions.className = 'ft-modal-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.type = 'button';
            cancelBtn.textContent = cancelText;

            const okBtn = document.createElement('button');
            okBtn.className = 'btn-primary';
            okBtn.type = 'button';
            okBtn.textContent = confirmText;

            const cleanup = () => {
                try {
                    overlay.remove();
                } catch (e) {
                }
            };

            const closeWith = (value) => {
                cleanup();
                resolve(value);
            };

            cancelBtn.addEventListener('click', () => closeWith(null));
            okBtn.addEventListener('click', () => closeWith(input.value));

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    okBtn.click();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelBtn.click();
                }
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cancelBtn.click();
                }
            });

            actions.appendChild(cancelBtn);
            actions.appendChild(okBtn);
            body.appendChild(actions);

            card.appendChild(header);
            card.appendChild(body);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            setTimeout(() => {
                try {
                    input.focus();
                    input.select();
                } catch (e) {
                }
            }, 0);
        });
    }

    async function verifyPin(pin, verifier) {
        const Security = window.FilterTubeSecurity || {};
        if (typeof Security.verifyPin !== 'function') {
            throw new Error('Security manager unavailable');
        }
        return Security.verifyPin(pin, verifier);
    }

    async function ensureProfileUnlocked(profilesV4, profileId) {
        if (!isProfileLocked(profilesV4, profileId)) return true;
        if (unlockedProfiles.has(profileId)) return true;

        const verifier = profileId === 'default'
            ? extractMasterPinVerifier(profilesV4)
            : extractProfilePinVerifier(profilesV4, profileId);
        if (!verifier) return true;

        const title = profileId === 'default' ? 'Enter Master PIN' : 'Enter Profile PIN';
        const name = getProfileName(profilesV4, profileId);
        const pin = await showPromptModal({
            title,
            message: `Unlock ${name} to continue.`,
            placeholder: 'PIN',
            inputType: 'password',
            confirmText: 'Unlock'
        });

        const normalized = normalizeString(pin);
        if (!normalized) return false;
        const ok = await verifyPin(normalized, verifier);
        if (!ok) {
            UIComponents.showToast('Incorrect PIN', 'error');
            return false;
        }
        unlockedProfiles.add(profileId);
        await notifyBackgroundUnlocked(profileId, normalized);
        return true;
    }

    function isUiLocked() {
        try {
            const profilesV4 = profilesV4Cache;
            const activeProfileId = normalizeString(profilesV4?.activeProfileId) || 'default';
            return !!(profilesV4 && isProfileLocked(profilesV4, activeProfileId) && !unlockedProfiles.has(activeProfileId));
        } catch (e) {
        }
        return false;
    }

    function applyLockGateIfNeeded() {
        const profilesV4 = profilesV4Cache;
        const activeProfileId = normalizeString(profilesV4?.activeProfileId) || 'default';
        const isLocked = profilesV4 && isProfileLocked(profilesV4, activeProfileId) && !unlockedProfiles.has(activeProfileId);

        document.body.classList.toggle('ft-popup-locked', !!isLocked);

        try {
            updateCheckboxes();
        } catch (e) {
        }

        const appContainer = document.querySelector('.app-container');
        const headerEl = document.querySelector('.app-header');
        const appContent = document.querySelector('.app-content');
        if (!appContainer || !headerEl || !appContent) return;

        if (!isLocked) {
            appContent.hidden = false;
            if (lockGateEl) {
                try {
                    lockGateEl.remove();
                } catch (e) {
                }
                lockGateEl = null;
            }
            return;
        }

        appContent.hidden = true;
        if (lockGateEl && lockGateEl.isConnected) return;

        const gate = document.createElement('div');
        gate.className = 'ft-popup-lock-gate';

        const card = document.createElement('div');
        card.className = 'card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        const h3 = document.createElement('h3');
        h3.textContent = 'Profile Locked';
        cardHeader.appendChild(h3);

        const body = document.createElement('div');
        body.className = 'card-body';
        const hint = document.createElement('div');
        hint.className = 'import-export-hint';
        hint.textContent = `Unlock ${getProfileName(profilesV4, activeProfileId)} to view settings.`;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.flexWrap = 'wrap';
        actions.style.marginTop = '12px';

        const unlockBtn = document.createElement('button');
        unlockBtn.className = 'btn-primary';
        unlockBtn.type = 'button';
        unlockBtn.textContent = 'Unlock';
        unlockBtn.addEventListener('click', async () => {
            try {
                const ok = await ensureProfileUnlocked(profilesV4Cache, activeProfileId);
                if (!ok) return;
                await refreshProfilesUI();
                UIComponents.showToast('Unlocked', 'success');
            } catch (e) {
                UIComponents.showToast('Failed to unlock', 'error');
            }
        });

        body.appendChild(hint);
        actions.appendChild(unlockBtn);
        body.appendChild(actions);
        card.appendChild(cardHeader);
        card.appendChild(body);
        gate.appendChild(card);

        appContainer.insertBefore(gate, appContent);
        lockGateEl = gate;
    }

    function renderProfileSelector(profilesV4) {
        if (!ftProfileDropdownPopup || !ftProfileBadgeBtnPopup) return;

        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const current = normalizeString(root.activeProfileId) || 'default';

        const badgeColors = getProfileColors(current);
        ftProfileBadgeBtnPopup.textContent = getProfileInitial(profilesV4, current);
        ftProfileBadgeBtnPopup.style.backgroundColor = badgeColors.bg;
        ftProfileBadgeBtnPopup.style.color = badgeColors.fg;
        ftProfileBadgeBtnPopup.style.borderColor = badgeColors.accentBorder || '';
        ftProfileBadgeBtnPopup.title = buildProfileLabel(profilesV4, current);

        ftProfileDropdownPopup.innerHTML = '';

        const appendProfileBtn = (id) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const locked = isProfileLocked(profilesV4, id);
            const type = getProfileType(profilesV4, id);
            const isChild = type === 'child';
            btn.className = `ft-profile-dropdown-item${id === current ? ' is-active' : ''}${locked ? ' is-locked' : ''}${isChild ? ' is-child' : ''}`;
            btn.setAttribute('role', 'option');
            btn.setAttribute('aria-selected', id === current ? 'true' : 'false');

            const colors = getProfileColors(id);
            btn.style.setProperty('--ft-profile-accent', colors.accent || '');
            btn.style.setProperty('--ft-profile-accent-bg', colors.accentBg || '');
            btn.style.setProperty('--ft-profile-accent-border', colors.accentBorder || '');

            const avatar = document.createElement('div');
            avatar.className = 'ft-profile-dropdown-avatar';
            avatar.style.backgroundColor = colors.bg;
            avatar.style.color = colors.fg;
            avatar.textContent = getProfileInitial(profilesV4, id);

            const meta = document.createElement('div');
            meta.className = 'ft-profile-dropdown-meta';

            const nameEl = document.createElement('div');
            nameEl.className = 'ft-profile-dropdown-name';
            nameEl.textContent = getProfileName(profilesV4, id);

            const subtitleEl = document.createElement('div');
            subtitleEl.className = 'ft-profile-dropdown-subtitle';
            subtitleEl.textContent = buildProfileSubtitle(profilesV4, id);

            meta.appendChild(nameEl);
            meta.appendChild(subtitleEl);

            btn.appendChild(avatar);
            btn.appendChild(meta);

            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeProfileDropdown();
                await switchToProfile(id);
            });

            ftProfileDropdownPopup.appendChild(btn);
        };

        const accountIds = getAccountIds(profilesV4);
        accountIds.forEach((accountId, idx) => {
            const header = document.createElement('div');
            header.className = 'ft-profile-dropdown-group';
            header.setAttribute('role', 'presentation');
            header.textContent = accountId === 'default'
                ? `${getProfileName(profilesV4, accountId)} (Master)`
                : `${getProfileName(profilesV4, accountId)} (Account)`;
            ftProfileDropdownPopup.appendChild(header);

            appendProfileBtn(accountId);
            const children = getChildrenForAccount(profilesV4, accountId);
            children.forEach(childId => appendProfileBtn(childId));

            if (idx < accountIds.length - 1) {
                const sep = document.createElement('div');
                sep.className = 'ft-profile-dropdown-separator';
                sep.setAttribute('role', 'presentation');
                ftProfileDropdownPopup.appendChild(sep);
            }
        });

        positionProfileDropdown();
    }

    async function refreshProfilesUI() {
        try {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function') return;
            const profilesV4 = await io.loadProfilesV4();
            profilesV4Cache = profilesV4;
            renderProfileSelector(profilesV4);
            applyLockGateIfNeeded();
        } catch (e) {
        }
    }

    async function switchToProfile(nextProfileId) {
        if (isHandlingProfileSwitch) return;
        const targetId = normalizeString(nextProfileId);
        if (!targetId) return;

        isHandlingProfileSwitch = true;
        try {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
                UIComponents.showToast('Profiles unavailable', 'error');
                return;
            }
            const profilesV4 = await io.loadProfilesV4();
            const profiles = safeObject(profilesV4?.profiles);
            if (!profiles[targetId]) {
                UIComponents.showToast('Profile not found', 'error');
                return;
            }

            const ok = await ensureProfileUnlocked(profilesV4, targetId);
            if (!ok) {
                await refreshProfilesUI();
                return;
            }

            await io.saveProfilesV4({
                ...profilesV4,
                schemaVersion: 4,
                activeProfileId: targetId,
                profiles
            });

            await StateManager.loadSettings();
            await refreshProfilesUI();
            renderKeywords();
            renderChannels();
            updateCheckboxes();
            applyLockGateIfNeeded();
            UIComponents.showToast('Profile switched', 'success');
        } catch (e) {
            console.warn('Popup: profile switch failed', e);
            UIComponents.showToast('Failed to switch profile', 'error');
        } finally {
            isHandlingProfileSwitch = false;
        }
    }

    let keywordSearchValue = '';
    let channelSearchValue = '';

    // ============================================================================
    // STATE MANAGEMENT (using StateManager)
    // ============================================================================

    // Load initial settings
    await StateManager.loadSettings();

    // Apply theme immediately after loading
    const state = StateManager.getState();
    if (state.theme) {
        const SettingsAPI = window.FilterTubeSettings || {};
        if (SettingsAPI.applyThemePreference) {
            SettingsAPI.applyThemePreference(state.theme);
        }
    }

    // Subscribe to state changes for automatic UI updates
    StateManager.subscribe((eventType, data) => {
        console.log('Popup: State changed', eventType, data);

        // Re-render when state changes
        if (['keywordAdded', 'keywordRemoved', 'keywordUpdated', 'load', 'save'].includes(eventType)) {
            renderKeywords();
        }

        if (['channelAdded', 'channelRemoved', 'channelUpdated', 'load', 'save'].includes(eventType)) {
            renderChannels();
        }

        if (eventType === 'settingUpdated') {
            updateCheckboxes();
        }

        if (eventType === 'themeChanged') {
            // Theme is already applied by StateManager
        }

        if (eventType === 'load' || eventType === 'externalUpdate') {
            refreshProfilesUI();
            renderListModeControls();
        }
    });

    // ============================================================================
    // RENDERING (using RenderEngine)
    // ============================================================================

    function renderKeywords() {
        if (!keywordList) return;
        RenderEngine.renderKeywordList(keywordList, {
            minimal: true,
            showSearch: true,
            showSort: false,
            searchValue: keywordSearchValue,
            sortValue: 'newest',
            profile: popupActiveProfileType === 'kids' ? 'kids' : 'main'
        });
    }

    function renderChannels() {
        if (!channelListEl) return;
        RenderEngine.renderChannelList(channelListEl, {
            minimal: true,
            showSearch: true,
            showSort: false,
            showNodeMapping: false,
            searchValue: channelSearchValue,
            sortValue: 'newest',
            profile: popupActiveProfileType === 'kids' ? 'kids' : 'main'
        });
    }

    function filterContentControlsPopup() {
        const input = document.getElementById('searchContentControlsPopup');
        const q = (input?.value || '').trim().toLowerCase();
        const groups = contentControlsContainer?.querySelectorAll('[data-ft-control-group]') || [];

        groups.forEach(groupEl => {
            const groupTitle = (groupEl.getAttribute('data-ft-group-title') || '').toLowerCase();
            const groupMatches = q ? groupTitle.includes(q) : false;
            const rows = groupEl.querySelectorAll('[data-ft-control-row]');

            let anyVisible = false;
            rows.forEach(row => {
                const text = row.getAttribute('data-ft-search') || '';
                const show = !q || groupMatches || text.includes(q);
                row.style.display = show ? '' : 'none';
                if (show) anyVisible = true;
            });

            groupEl.style.display = (!q || anyVisible) ? '' : 'none';
        });
    }

    function updateCheckboxes() {
        const state = StateManager.getState();
        const locked = isUiLocked();

        contentControlCheckboxes.forEach(el => {
            const key = el.getAttribute('data-ft-setting');
            if (!key) return;
            el.checked = !!state[key];
            el.disabled = locked;
        });

        const filterCommentsEl = contentControlsContainer?.querySelector('input[data-ft-setting="filterComments"]') || null;
        if (filterCommentsEl) {
            filterCommentsEl.checked = state.hideComments ? false : !!state.filterComments;
            filterCommentsEl.disabled = locked || !!state.hideComments;
        }

        if (toggleEnabledBrandBtn) {
            const enabled = state.enabled !== false;
            toggleEnabledBrandBtn.classList.toggle('ft-enabled', enabled);
            toggleEnabledBrandBtn.classList.toggle('ft-disabled', !enabled);
            toggleEnabledBrandBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
            toggleEnabledBrandBtn.title = enabled ? 'Filtering Active (click to pause)' : 'Filtering Paused (click to enable)';

            const statusText = document.getElementById('extensionStatusText');
            if (statusText) {
                statusText.textContent = enabled ? 'Enabled' : 'Disabled';
                statusText.classList.toggle('disabled', !enabled);
            }
        }
    }

    // Initial render
    renderKeywords();
    renderChannels();
    updateCheckboxes();
    renderListModeControls();
    filterContentControlsPopup();
    await refreshProfilesUI();

    if (ftProfileBadgeBtnPopup && ftProfileDropdownPopup) {
        closeProfileDropdown();
        ftProfileBadgeBtnPopup.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleProfileDropdown();
        });

        document.addEventListener('click', (e) => {
            if (!ftProfileMenuPopup) {
                closeProfileDropdown();
                return;
            }
            if (ftProfileMenuPopup.contains(e.target)) return;
            closeProfileDropdown();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeProfileDropdown();
            }
        });
    }

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    if (searchKeywordsPopup) {
        searchKeywordsPopup.addEventListener('input', () => {
            keywordSearchValue = searchKeywordsPopup.value || '';
            renderKeywords();
        });
    }

    if (searchChannelsPopup) {
        searchChannelsPopup.addEventListener('input', () => {
            channelSearchValue = searchChannelsPopup.value || '';
            renderChannels();
        });
    }

    const searchContentControlsPopup = document.getElementById('searchContentControlsPopup');
    if (searchContentControlsPopup) {
        searchContentControlsPopup.addEventListener('input', () => {
            filterContentControlsPopup();
        });
    }

    // Add keyword
    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', async () => {
            const word = (newKeywordInput?.value || '').trim();
            if (!word) return;

            const success = popupActiveProfileType === 'kids'
                ? await StateManager.addKidsKeyword(word)
                : await StateManager.addKeyword(word);
            if (success) {
                if (newKeywordInput) newKeywordInput.value = '';
                UIComponents.flashButtonSuccess(addKeywordBtn, 'Added!', 1200);
            }
        });
    }

    if (newKeywordInput) {
        newKeywordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && addKeywordBtn) {
                addKeywordBtn.click();
            }
        });
    }

    // Add channel
    if (addChannelBtn) {
        addChannelBtn.addEventListener('click', async () => {
            const input = (channelInput?.value || '').trim();
            if (!input) return;

            const originalText = addChannelBtn.textContent;
            addChannelBtn.textContent = 'Fetching...';
            addChannelBtn.disabled = true;

            try {
                const result = popupActiveProfileType === 'kids'
                    ? await StateManager.addKidsChannel(input)
                    : await StateManager.addChannel(input);

                if (result.success) {
                    if (channelInput) channelInput.value = '';
                    // Reset button text BEFORE flashing success message
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
                } else {
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    alert(result.error || 'Failed to add channel');
                }
            } catch (error) {
                addChannelBtn.textContent = originalText;
                addChannelBtn.disabled = false;
                alert('Failed to add channel: ' + error.message);
            }
        });
    }

    if (channelInput) {
        channelInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && addChannelBtn) {
                addChannelBtn.click();
            }
        });
    }

    // Checkbox handlers
    contentControlCheckboxes.forEach(el => {
        el.addEventListener('change', async () => {
            if (isUiLocked()) {
                updateCheckboxes();
                return;
            }
            const key = el.getAttribute('data-ft-setting');
            if (!key) return;
            await StateManager.updateSetting(key, el.checked);
        });
    });

    // Open in tab
    if (openInTabBtn) {
        openInTabBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('html/tab-view.html') });
        });
    }

    if (toggleEnabledBrandBtn) {
        const handleToggle = async () => {
            const state = StateManager.getState();
            const enabled = state.enabled !== false;
            await StateManager.updateSetting('enabled', !enabled);
            updateCheckboxes();
        };

        toggleEnabledBrandBtn.addEventListener('click', async () => {
            await handleToggle();
        });
        toggleEnabledBrandBtn.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                await handleToggle();
            }
        });
    }
});
