/**
 * Tab-View script for FilterTube extension (REFACTORED)
 * 
 * This script uses centralized StateManager and RenderEngine
 * Full UI with advanced features: search, sort, node mapping, filter-all toggles
 */

// ============================================================================
// FILTERS TAB INITIALIZATION
// ============================================================================

function initializeFiltersTabs() {
    const container = document.getElementById('filtersTabsContainer');
    if (!container) return;

    // Keywords tab content
    const keywordsContent = document.createElement('div');
    keywordsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="keywordInput" class="text-input" placeholder="Keywords (comma-separated)..." />
            <button id="addKeywordBtn" class="btn-primary">Add Keyword</button>
        </div>

        <div class="filter-controls">
            <input type="text" id="searchKeywords" class="search-input" placeholder="Search keywords..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="keywordSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
            </div>
        </div>

        <div class="date-filter-controls">
            <div class="date-range-controls">
                <span class="label">Date:</span>
                <select id="keywordDatePreset" class="select-input">
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div class="date-inputs">
                <input type="date" id="keywordDateFrom" class="select-input date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="keywordDateTo" class="select-input date-input" />
                <button id="keywordDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="keywordListEl" class="advanced-list"></div>
    `;

    // Channels tab content
    const channelsContent = document.createElement('div');
    channelsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="channelInput" class="text-input" placeholder="@handle or ID (comma-separated)..." />
            <button id="addChannelBtn" class="btn-primary">Add Channel</button>
        </div>

        <div class="filter-controls">
            <input type="text" id="searchChannels" class="search-input" placeholder="Search channels..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="channelSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
            </div>
        </div>

        <div class="date-filter-controls">
            <div class="date-range-controls">
                <span class="label">Date:</span>
                <select id="channelDatePreset" class="select-input">
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div class="date-inputs">
                <input type="date" id="channelDateFrom" class="select-input date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="channelDateTo" class="select-input date-input" />
                <button id="channelDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="channelListEl" class="advanced-list"></div>
    `;

    // Content tab with checkboxes
    const contentTab = document.createElement('div');

    const contentSearchRow = document.createElement('div');
    contentSearchRow.className = 'search-row';

    const contentControlsSearch = document.createElement('input');
    contentControlsSearch.type = 'text';
    contentControlsSearch.id = 'searchContentControls';
    contentControlsSearch.className = 'text-input search-input';
    contentControlsSearch.placeholder = 'Search content controls...';

    contentSearchRow.appendChild(contentControlsSearch);
    contentTab.appendChild(contentSearchRow);

    const catalog = window.FilterTubeContentControlsCatalog?.getCatalog?.() || [];

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
        groupEl.style.setProperty('--ft-control-accent-bg-dark', hexToRgba(accentColor, 0.10));
        groupEl.style.setProperty('--ft-control-accent-row-border', hexToRgba(accentColor, 0.28));
        groupEl.style.setProperty('--ft-control-accent-row-bg', hexToRgba(accentColor, 0.08));
        groupEl.style.setProperty('--ft-control-accent-row-hover-bg', hexToRgba(accentColor, 0.14));
        groupEl.style.setProperty('--ft-control-accent-row-hover-dark', hexToRgba(accentColor, 0.12));
    }

    catalog.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.setAttribute('data-ft-control-group', 'true');
        groupEl.setAttribute('data-ft-group-title', group?.title || '');
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

        (group.controls || []).forEach(control => {
            const row = document.createElement('div');
            row.className = 'toggle-row';
            row.setAttribute('data-ft-control-row', 'true');
            row.setAttribute('data-ft-search', `${control.title || ''} ${control.description || ''}`.toLowerCase());
            if (control.description) {
                row.setAttribute('title', control.description);
            }

            const info = document.createElement('div');
            info.className = 'toggle-info';

            const t = document.createElement('div');
            t.className = 'toggle-title';
            t.textContent = control.title || '';

            if (control.description) {
                const infoWrapper = document.createElement('div');
                infoWrapper.className = 'toggle-info-text';
                infoWrapper.appendChild(t);
                info.appendChild(infoWrapper);
            } else {
                info.appendChild(t);
            }

            const switchLabel = document.createElement('label');
            switchLabel.className = 'switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `setting_${control.key}`;
            input.setAttribute('data-ft-setting', control.key);

            const slider = document.createElement('span');
            slider.className = 'slider round';

            switchLabel.appendChild(input);
            switchLabel.appendChild(slider);

            row.appendChild(info);
            row.appendChild(switchLabel);
            rowsContainer.appendChild(row);
        });

        groupEl.appendChild(rowsContainer);
        contentTab.appendChild(groupEl);
    });

    // Create tabs
    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'keywords', label: 'Keyword Management', content: keywordsContent },
            { id: 'channels', label: 'Channel Management', content: channelsContent },
            { id: 'content', label: 'Content Controls', content: contentTab }
        ],
        defaultTab: 'keywords'
    });

    container.appendChild(tabs.container);

    // Responsive nav toggle for mobile
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.getElementById('sidebarNav');
    const overlay = document.getElementById('sidebarOverlay');

    function closeSidebar() {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('visible');
    }

    function closeOnWide() {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    }

    navToggle?.addEventListener('click', () => {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('visible');
    });

    overlay?.addEventListener('click', () => {
        closeSidebar();
    });

    window.addEventListener('resize', closeOnWide);
    closeOnWide();

    // Close sidebar on tab switch (for mobile)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            closeSidebar();
        });
    });
}

// Kids Mode tabs (mirrors Filters tabs but without content controls/comments)
function initializeKidsTabs() {
    const container = document.getElementById('kidsTabsContainer');
    if (!container) return;

    // Kids Keywords tab
    const kidsKeywordsContent = document.createElement('div');
    kidsKeywordsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="kidsKeywordInput" class="text-input" placeholder="Keywords (comma-separated)..." />
            <button id="kidsAddKeywordBtn" class="btn-primary">Add Keyword</button>
        </div>

        <div class="filter-controls">
            <input type="text" id="kidsSearchKeywords" class="search-input" placeholder="Search keywords..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="kidsKeywordSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
            </div>
        </div>

        <div class="date-filter-controls">
            <div class="date-range-controls">
                <span class="label">Date:</span>
                <select id="kidsKeywordDatePreset" class="select-input">
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div class="date-inputs">
                <input type="date" id="kidsKeywordDateFrom" class="select-input date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="kidsKeywordDateTo" class="select-input date-input" />
                <button id="kidsKeywordDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="kidsKeywordListEl" class="advanced-list"></div>
    `;

    // Kids Channels tab
    const kidsChannelsContent = document.createElement('div');
    kidsChannelsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="kidsChannelInput" class="text-input" placeholder="@handle or ID (comma-separated)..." />
            <button id="kidsAddChannelBtn" class="btn-primary">Add Channel</button>
        </div>

        <div class="filter-controls">
            <input type="text" id="kidsSearchChannels" class="search-input" placeholder="Search channels..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="kidsChannelSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
            </div>
        </div>

        <div class="date-filter-controls">
            <div class="date-range-controls">
                <span class="label">Date:</span>
                <select id="kidsChannelDatePreset" class="select-input">
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div class="date-inputs">
                <input type="date" id="kidsChannelDateFrom" class="select-input date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="kidsChannelDateTo" class="select-input date-input" />
                <button id="kidsChannelDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="kidsChannelListEl" class="advanced-list"></div>
    `;

    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'kidsKeywords', label: 'Keyword Management', content: kidsKeywordsContent },
            { id: 'kidsChannels', label: 'Channel Management', content: kidsChannelsContent }
        ],
        defaultTab: 'kidsKeywords'
    });

    container.appendChild(tabs.container);
}
// Expose for safety in case other modules call it
window.initializeKidsTabs = initializeKidsTabs;

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

const runtimeAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : (typeof chrome !== 'undefined' ? chrome : null);
const manifestVersion = runtimeAPI?.runtime?.getManifest()?.version || '';

/**
 * Parses either the hash (#whatsnew) or query parameter (?view=whatsnew) so the
 * dashboard can deep-link into specific tabs (used by banner CTA, docs, etc.).
 */
function resolveRequestedView() {
    const hash = (window.location.hash || '').replace('#', '').toLowerCase();
    const searchParams = new URLSearchParams(window.location.search || '');
    const queryView = (searchParams.get('view') || '').toLowerCase();
    const candidate = hash || queryView;
    if (!candidate) return null;
    const normalized = candidate.replace(/\s+/g, '');
    const viewMap = {
        'dashboard': 'dashboard',
        'filters': 'filters',
        'semantic': 'semantic',
        'kids': 'kids',
        'settings': 'settings',
        'whatsnew': 'whatsnew',
        'whats-new': 'whatsnew',
        'help': 'help',
        'support': 'support'
    };
    return viewMap[normalized] || null;
}

/**
 * Switches to the requested view (if any) and scrolls it into view. Separated
 * so we can reuse it for DOMContentLoaded, hashchange, and popstate events.
 */
function handleNavigationIntent() {
    const viewId = resolveRequestedView();
    if (!viewId) return;
    if (typeof window.switchView === 'function') {
        window.switchView(viewId);
    }
    if (viewId === 'whatsnew') {
        const view = document.getElementById('whatsnewView');
        if (view) {
            requestAnimationFrame(() => view.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
    }
}

/**
 * Hydrates the “What’s New” tab with curated release note cards pulled from
 * data/release_notes.json. Shared content with the release banner.
 */
async function loadReleaseNotesIntoDashboard() {
    const listEl = document.getElementById('releaseNotesList');
    if (!listEl) return;

    function showEmptyState(message) {
        listEl.innerHTML = `<div class="release-notes-empty">${message}</div>`;
    }

    try {
        const url = runtimeAPI?.runtime?.getURL
            ? runtimeAPI.runtime.getURL('data/release_notes.json')
            : 'data/release_notes.json';
        const response = await fetch(url);
        if (!response.ok) {
            showEmptyState('Unable to load release notes right now.');
            return;
        }
        const notes = await response.json();
        if (!Array.isArray(notes) || notes.length === 0) {
            showEmptyState('No release notes available yet.');
            return;
        }

        listEl.innerHTML = '';

        const validNotes = notes.filter(note => note && typeof note.version === 'string' && note.version.trim());
        if (validNotes.length === 0) {
            showEmptyState('Release notes will appear here once available.');
            return;
        }

        validNotes.forEach(note => {
            const card = document.createElement('article');
            card.className = 'release-note-card';
            const isCurrent = note.version === manifestVersion;
            if (isCurrent) {
                card.classList.add('release-note-card--current');
            }

            const header = document.createElement('div');
            header.className = 'release-note-card__header';

            const versionTag = document.createElement('span');
            versionTag.className = 'release-note-card__version';
            versionTag.textContent = `v${note.version || '—'}`;
            header.appendChild(versionTag);

            if (isCurrent) {
                const status = document.createElement('span');
                status.className = 'release-note-card__status';
                status.textContent = 'Current';
                header.appendChild(status);
            }

            const title = document.createElement('h4');
            title.className = 'release-note-card__title';
            title.textContent = note.headline || 'New update';

            const summary = document.createElement('p');
            summary.className = 'release-note-card__summary';
            summary.textContent = note.summary || note.body || 'Details coming soon.';

            const highlights = Array.isArray(note.highlights) ? note.highlights.filter(Boolean) : [];
            let highlightsList = null;
            if (highlights.length) {
                highlightsList = document.createElement('ul');
                highlightsList.className = 'release-note-card__highlights';
                highlights.slice(0, 4).forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    highlightsList.appendChild(li);
                });
            }

            const actions = document.createElement('div');
            actions.className = 'release-note-card__actions';

            if (note.detailsUrl) {
                const link = document.createElement('a');
                link.className = 'release-note-card__link';
                link.href = note.detailsUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'View changelog';
                actions.appendChild(link);
            }

            card.appendChild(header);
            card.appendChild(title);
            card.appendChild(summary);
            if (highlightsList) {
                card.appendChild(highlightsList);
            }
            if (actions.childElementCount > 0) {
                card.appendChild(actions);
            }

            listEl.appendChild(card);
        });
    } catch (error) {
        console.error('Tab-View: Failed to load release notes', error);
        showEmptyState('Unable to load release notes right now.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        document.body.classList.add('ft-app-locked');
    } catch (e) {
    }
    try {
        window.FilterTubeIsUiLocked = () => true;
        window.FilterTubeResolveViewAccess = () => ({ viewId: 'help', reason: 'boot' });
    } catch (e) {
    }
    // Initialize UI
    initializeFiltersTabs();
    initializeKidsTabs();
    setupNavigation();

    // Get DOM elements
    const keywordInput = document.getElementById('keywordInput');
    const addKeywordBtn = document.getElementById('addKeywordBtn');
    const keywordListEl = document.getElementById('keywordListEl');
    const searchKeywords = document.getElementById('searchKeywords');
    const keywordSort = document.getElementById('keywordSort');
    const keywordDatePreset = document.getElementById('keywordDatePreset');
    const keywordDateFrom = document.getElementById('keywordDateFrom');
    const keywordDateTo = document.getElementById('keywordDateTo');
    const keywordDateClear = document.getElementById('keywordDateClear');

    const channelInput = document.getElementById('channelInput');
    const addChannelBtn = document.getElementById('addChannelBtn');
    const channelListEl = document.getElementById('channelListEl');
    const searchChannels = document.getElementById('searchChannels');
    const channelSort = document.getElementById('channelSort');

    const channelDatePreset = document.getElementById('channelDatePreset');
    const channelDateFrom = document.getElementById('channelDateFrom');
    const channelDateTo = document.getElementById('channelDateTo');
    const channelDateClear = document.getElementById('channelDateClear');

    const contentControlsContainer = document.getElementById('filtersTabsContainer');
    const contentControlCheckboxes = contentControlsContainer
        ? contentControlsContainer.querySelectorAll('input[type="checkbox"][data-ft-setting]')
        : [];

    const allSettingCheckboxes = document.querySelectorAll('input[type="checkbox"][data-ft-setting]');

    const themeToggle = document.getElementById('themeToggle');

    const ftAutoBackupMode = document.getElementById('ftAutoBackupMode');
    const ftAutoBackupFormat = document.getElementById('ftAutoBackupFormat');
    const ftProfileSelector = document.getElementById('ftProfileSelector');
    const ftProfileMenuTab = document.getElementById('ftProfileMenuTab');
    const ftProfileBadgeBtnTab = document.getElementById('ftProfileBadgeBtnTab');
    const ftProfileDropdownTab = document.getElementById('ftProfileDropdownTab');

    const ftTopBarListModeControlsTab = document.getElementById('ftTopBarListModeControlsTab');

    const ftExportV3Btn = document.getElementById('ftExportV3Btn');
    const ftExportV3EncryptedBtn = document.getElementById('ftExportV3EncryptedBtn');
    const ftExportActiveOnly = document.getElementById('ftExportActiveOnly');
    const ftImportV3Btn = document.getElementById('ftImportV3Btn');
    const ftImportV3File = document.getElementById('ftImportV3File');

    const ftProfilesManager = document.getElementById('ftProfilesManager');
    const ftCreateAccountBtn = document.getElementById('ftCreateAccountBtn');
    const ftCreateChildBtn = document.getElementById('ftCreateChildBtn');
    const ftSetMasterPinBtn = document.getElementById('ftSetMasterPinBtn');
    const ftClearMasterPinBtn = document.getElementById('ftClearMasterPinBtn');

    const ftAllowAccountCreation = document.getElementById('ftAllowAccountCreation');
    const ftMaxAccounts = document.getElementById('ftMaxAccounts');

    const openKofiBtn = document.getElementById('openKofiBtn');

    // State for search/sort
    let keywordSearchValue = '';
    let keywordSortValue = 'newest';
    let channelSearchValue = '';
    let channelSortValue = 'newest';

    let keywordDateFromTs = null;
    let keywordDateToTs = null;
    let channelDateFromTs = null;
    let channelDateToTs = null;

    const searchContentControls = document.getElementById('searchContentControls');
    const helpSearchInput = document.getElementById('helpSearchInput');
    const helpSearchEmpty = document.getElementById('helpSearchEmpty');
    const helpSearchCard = helpSearchInput ? helpSearchInput.closest('.card') : null;

    if (openKofiBtn) {
        openKofiBtn.addEventListener('click', () => {
            try {
                const url = 'https://ko-fi.com/filtertube';
                if (runtimeAPI?.tabs?.create) {
                    runtimeAPI.tabs.create({ url });
                } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            } catch (error) {
                console.warn('Tab-View: failed to open Ko-fi link', error);
            }
        });
    }

    try {
        const createDropdownFromSelect = window.UIComponents?.createDropdownFromSelect;
        if (typeof createDropdownFromSelect === 'function') {
            [
                'keywordSort',
                'keywordDatePreset',
                'channelSort',
                'channelDatePreset',
                'kidsKeywordSort',
                'kidsKeywordDatePreset',
                'kidsChannelSort',
                'kidsChannelDatePreset',
                'ftAutoBackupMode',
                'ftAutoBackupFormat'
            ].forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.tagName === 'SELECT') {
                    createDropdownFromSelect(el);
                }
            });
        }
    } catch (e) {
    }

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    // Load initial settings
    await StateManager.loadSettings();

    // Apply theme immediately
    const state = StateManager.getState();
    if (state.theme) {
        const SettingsAPI = window.FilterTubeSettings || {};
        if (SettingsAPI.applyThemePreference) {
            SettingsAPI.applyThemePreference(state.theme);
        }
    }

    let activeProfileId = 'default';
    let profilesV4Cache = null;
    let isHandlingProfileSwitch = false;
    let sessionMasterPin = '';
    const unlockedProfiles = new Set();

    let lockGateEl = null;

    const LOCK_ALLOWED_VIEWS = new Set(['help', 'whatsnew', 'support']);

    async function sendRuntimeMessage(payload) {
        return new Promise((resolve) => {
            try {
                if (!runtimeAPI?.runtime?.sendMessage) {
                    resolve(null);
                    return;
                }

                const maybePromise = runtimeAPI.runtime.sendMessage(payload, (resp) => {
                    const err = runtimeAPI.runtime?.lastError;
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

    async function scheduleAutoBackup(triggerType, delay = 1000, options = null) {
        try {
            const trigger = typeof triggerType === 'string' ? triggerType : 'unknown';
            const payload = {
                action: 'FilterTube_ScheduleAutoBackup',
                triggerType: trigger,
                delay: (typeof delay === 'number' && Number.isFinite(delay)) ? delay : 1000
            };
            if (options && typeof options === 'object') {
                payload.options = options;
            }
            await sendRuntimeMessage(payload);
        } catch (e) {
        }
    }

    async function syncSessionUnlockStateFromBackground() { }

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

    async function notifyBackgroundLocked(profileId) {
        try {
            const id = normalizeString(profileId);
            if (!id) return;
            await sendRuntimeMessage({
                action: 'FilterTube_ClearSessionPin',
                profileId: id
            });
        } catch (e) {
        }
    }

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
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

    function closeProfileDropdownTab() {
        if (!ftProfileDropdownTab || !ftProfileBadgeBtnTab) return;
        ftProfileDropdownTab.hidden = true;
        ftProfileDropdownTab.style.transform = '';
        ftProfileBadgeBtnTab.setAttribute('aria-expanded', 'false');
    }

    function positionProfileDropdownTab() {
        if (!ftProfileDropdownTab || ftProfileDropdownTab.hidden) return;
        try {
            const rect = ftProfileDropdownTab.getBoundingClientRect();
            const pad = 8;
            const maxRight = window.innerWidth - pad;
            let shift = 0;
            if (rect.left < pad) {
                shift = pad - rect.left;
            } else if (rect.right > maxRight) {
                shift = maxRight - rect.right;
            }
            ftProfileDropdownTab.style.transform = shift ? `translateX(${shift}px)` : '';
        } catch (e) {
        }
    }

    function toggleProfileDropdownTab() {
        if (!ftProfileDropdownTab || !ftProfileBadgeBtnTab) return;
        const next = !ftProfileDropdownTab.hidden;
        ftProfileDropdownTab.hidden = next;
        ftProfileBadgeBtnTab.setAttribute('aria-expanded', next ? 'false' : 'true');
        if (!next) {
            positionProfileDropdownTab();
        }
    }

    function renderProfileSelectorTab(profilesV4) {
        if (!ftProfileDropdownTab || !ftProfileBadgeBtnTab) return;
        const root = safeObject(profilesV4);
        const current = normalizeString(root.activeProfileId) || 'default';

        const badgeColors = getProfileColors(current);
        ftProfileBadgeBtnTab.textContent = getProfileInitial(profilesV4, current);
        ftProfileBadgeBtnTab.style.backgroundColor = badgeColors.bg;
        ftProfileBadgeBtnTab.style.color = badgeColors.fg;
        ftProfileBadgeBtnTab.style.borderColor = badgeColors.accentBorder || '';
        ftProfileBadgeBtnTab.title = buildProfileLabel(profilesV4, current);

        try {
            document.documentElement.style.setProperty('--ft-select-border', badgeColors.accentBorder || '');
            document.documentElement.style.setProperty('--ft-select-accent', badgeColors.accent || '');
            document.documentElement.style.setProperty('--ft-select-accent-bg', badgeColors.accentBg || '');
        } catch (e) {
        }

        ftProfileDropdownTab.innerHTML = '';

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
                closeProfileDropdownTab();
                await switchToProfile(id);
            });

            ftProfileDropdownTab.appendChild(btn);
        };

        const accountIds = getAccountIds(profilesV4);
        accountIds.forEach((accountId, idx) => {
            const header = document.createElement('div');
            header.className = 'ft-profile-dropdown-group';
            header.setAttribute('role', 'presentation');
            header.textContent = accountId === 'default'
                ? `${getProfileName(profilesV4, accountId)} (Master)`
                : `${getProfileName(profilesV4, accountId)} (Account)`;
            ftProfileDropdownTab.appendChild(header);

            appendProfileBtn(accountId);
            const children = getChildrenForAccount(profilesV4, accountId);
            children.forEach(childId => appendProfileBtn(childId));

            if (idx < accountIds.length - 1) {
                const sep = document.createElement('div');
                sep.className = 'ft-profile-dropdown-separator';
                sep.setAttribute('role', 'presentation');
                ftProfileDropdownTab.appendChild(sep);
            }
        });

        positionProfileDropdownTab();
    }

    function updateAutoBackupPolicyControls() {
        try {
            if (!ftAutoBackupMode || !ftAutoBackupFormat) return;
            const profilesV4 = profilesV4Cache;
            const root = safeObject(profilesV4);
            const profiles = safeObject(root.profiles);
            const activeProfile = safeObject(profiles[activeProfileId]);
            const settings = safeObject(activeProfile.settings);

            const mode = normalizeString(settings.autoBackupMode).toLowerCase();
            ftAutoBackupMode.value = (mode === 'history' || mode === 'latest') ? mode : 'latest';

            const format = normalizeString(settings.autoBackupFormat).toLowerCase();
            ftAutoBackupFormat.value = (format === 'plain' || format === 'encrypted' || format === 'auto') ? format : 'auto';

            const locked = isUiLocked();
            const enabled = StateManager.getState()?.autoBackupEnabled === true;
            const canEdit = !locked && enabled;

            ftAutoBackupMode.disabled = !canEdit;
            ftAutoBackupFormat.disabled = !canEdit;
            ftAutoBackupMode.title = canEdit ? '' : (locked ? 'Unlock this profile to change auto-backup preferences.' : 'Enable Auto Backup to change mode.');
            ftAutoBackupFormat.title = canEdit ? '' : (locked ? 'Unlock this profile to change auto-backup preferences.' : 'Enable Auto Backup to change format.');
        } catch (e) {
        }
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

    function getProfileType(profilesV4, profileId) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const profile = safeObject(profiles[profileId]);
        if (profileId === 'default') return 'account';
        const rawType = normalizeString(profile.type).toLowerCase();
        if (rawType === 'account' || rawType === 'child') return rawType;
        const parent = normalizeString(profile.parentProfileId);
        if (parent) return 'child';
        return 'account';
    }

    function getParentAccountId(profilesV4, profileId) {
        const type = getProfileType(profilesV4, profileId);
        if (type === 'account') return profileId;
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const profile = safeObject(profiles[profileId]);
        const parent = normalizeString(profile.parentProfileId);
        return (parent && profiles[parent]) ? parent : 'default';
    }

    function getAccountPolicy(profilesV4) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const master = safeObject(profiles.default);
        const settings = safeObject(master.settings);
        const policy = safeObject(settings.accountPolicy);
        const allowAccountCreation = policy.allowAccountCreation === true;
        const maxAccounts = typeof policy.maxAccounts === 'number' && Number.isFinite(policy.maxAccounts)
            ? Math.max(0, Math.floor(policy.maxAccounts))
            : 0;
        return { allowAccountCreation, maxAccounts };
    }

    function countNonDefaultAccounts(profilesV4) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        let count = 0;
        for (const id of Object.keys(profiles)) {
            if (id === 'default') continue;
            if (getProfileType(profilesV4, id) === 'account') count += 1;
        }
        return count;
    }

    function getSortedIdsByName(profilesV4, ids) {
        const out = [...ids];
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
        const ids = [];
        for (const id of Object.keys(profiles)) {
            if (getProfileType(profilesV4, id) === 'account') ids.push(id);
        }
        if (!ids.includes('default')) ids.unshift('default');
        return getSortedIdsByName(profilesV4, ids);
    }

    function getChildrenForAccount(profilesV4, accountId) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const ids = [];
        for (const id of Object.keys(profiles)) {
            if (id === accountId) continue;
            if (getProfileType(profilesV4, id) !== 'child') continue;
            if (getParentAccountId(profilesV4, id) !== accountId) continue;
            ids.push(id);
        }
        return getSortedIdsByName(profilesV4, ids);
    }

    function buildProfileLabel(profilesV4, profileId) {
        const name = getProfileName(profilesV4, profileId);
        const locked = isProfileLocked(profilesV4, profileId);
        const type = getProfileType(profilesV4, profileId);
        if (profileId === 'default') {
            return locked ? `${name} (Master, locked)` : `${name} (Master)`;
        }
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

    function updateAdminPolicyControls() {
        if (!ftAllowAccountCreation || !ftMaxAccounts) return;
        const profilesV4 = profilesV4Cache;
        const isAdmin = activeProfileId === 'default';
        ftAllowAccountCreation.disabled = !isAdmin;
        ftMaxAccounts.disabled = !isAdmin;

        if (!profilesV4) return;
        const policy = getAccountPolicy(profilesV4);
        ftAllowAccountCreation.checked = policy.allowAccountCreation === true;
        ftMaxAccounts.value = String(policy.maxAccounts || 0);
    }

    function isUiLocked() {
        const profilesV4 = profilesV4Cache;
        if (!profilesV4) {
            return document.body.classList.contains('ft-app-locked');
        }
        return !!(profilesV4 && isProfileLocked(profilesV4, activeProfileId) && !unlockedProfiles.has(activeProfileId));
    }

    function getActiveProfileType() {
        const profilesV4 = profilesV4Cache;
        if (!profilesV4) return 'account';
        return getProfileType(profilesV4, activeProfileId);
    }

    function resolveViewAccess(requestedViewId) {
        const viewId = normalizeString(requestedViewId);
        if (!viewId) return { viewId: 'help', reason: 'unknown' };

        if (isUiLocked() && !LOCK_ALLOWED_VIEWS.has(viewId)) {
            return { viewId: 'help', reason: 'locked' };
        }

        return { viewId, reason: null };
    }

    function updateNavigationAccessUI() {
        const locked = isUiLocked();
        document.body.classList.remove('ft-child-profile');

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
            const tab = normalizeString(item.getAttribute('data-tab'));
            let disabled = false;
            if (locked) {
                disabled = tab && !LOCK_ALLOWED_VIEWS.has(tab);
            }
            item.classList.toggle('ft-nav-disabled', disabled);
            if (disabled) {
                item.setAttribute('aria-disabled', 'true');
            } else {
                item.removeAttribute('aria-disabled');
            }
        });

        const currentNav = document.querySelector('.nav-item.active');
        const currentViewId = normalizeString(currentNav?.getAttribute('data-tab')) || 'dashboard';
        const resolved = resolveViewAccess(currentViewId);
        if (resolved.viewId !== currentViewId && typeof window.switchView === 'function') {
            window.switchView(resolved.viewId);
        }
    }

    function applyLockGateIfNeeded() {
        const profilesV4 = profilesV4Cache;
        const isLocked = profilesV4 && isProfileLocked(profilesV4, activeProfileId) && !unlockedProfiles.has(activeProfileId);
        document.body.classList.toggle('ft-app-locked', !!isLocked);

        window.FilterTubeIsUiLocked = () => isUiLocked();
        window.FilterTubeResolveViewAccess = (viewId) => resolveViewAccess(viewId);

        updateNavigationAccessUI();
        updateAutoBackupPolicyControls();
        updateCheckboxes();

        const viewContainer = document.querySelector('.view-container');
        if (!viewContainer) return;

        if (!isLocked) {
            if (lockGateEl) {
                try {
                    lockGateEl.remove();
                } catch (e) {
                }
                lockGateEl = null;
            }
            return;
        }

        if (lockGateEl && lockGateEl.isConnected) return;
        const gate = document.createElement('div');
        gate.className = 'ft-lock-gate';

        const card = document.createElement('div');
        card.className = 'card';

        const header = document.createElement('div');
        header.className = 'card-header';
        const h3 = document.createElement('h3');
        h3.textContent = 'Profile Locked';
        header.appendChild(h3);

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
        card.appendChild(header);
        card.appendChild(body);
        gate.appendChild(card);
        viewContainer.insertBefore(gate, viewContainer.firstChild);
        lockGateEl = gate;
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
        await syncSessionUnlockStateFromBackground();
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
        if (profileId === 'default') {
            sessionMasterPin = normalized;
        }
        await notifyBackgroundUnlocked(profileId, profileId === 'default' ? sessionMasterPin : normalized);
        return true;
    }

    async function ensureAdminUnlocked(profilesV4) {
        const masterVerifier = extractMasterPinVerifier(profilesV4);
        if (!masterVerifier) return true;
        if (unlockedProfiles.has('default') && sessionMasterPin) return true;
        return ensureProfileUnlocked(profilesV4, 'default');
    }

    function updateExportScopeControls() {
        if (!ftExportActiveOnly) return;
        if (activeProfileId !== 'default') {
            ftExportActiveOnly.checked = true;
            ftExportActiveOnly.disabled = true;
            ftExportActiveOnly.title = 'Only the Default (Master) profile can export all profiles.';
        } else {
            ftExportActiveOnly.disabled = false;
            ftExportActiveOnly.title = '';
        }
    }

    function renderProfileSelector(profilesV4) {
        if (!ftProfileSelector) {
            renderProfileSelectorTab(profilesV4);
            return;
        }
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);

        ftProfileSelector.innerHTML = '';

        const accountIds = getAccountIds(profilesV4);
        accountIds.forEach((accountId, idx) => {
            const accountName = getProfileName(profilesV4, accountId);

            const headerOpt = document.createElement('option');
            headerOpt.disabled = true;
            headerOpt.value = '';
            headerOpt.textContent = `${idx === 0 ? '' : ''}${accountName}`;
            ftProfileSelector.appendChild(headerOpt);

            const accountOpt = document.createElement('option');
            accountOpt.value = accountId;
            accountOpt.textContent = buildProfileLabel(profilesV4, accountId);
            ftProfileSelector.appendChild(accountOpt);

            const children = getChildrenForAccount(profilesV4, accountId);
            children.forEach(childId => {
                const opt = document.createElement('option');
                opt.value = childId;
                opt.textContent = `  - ${buildProfileLabel(profilesV4, childId)}`;
                ftProfileSelector.appendChild(opt);
            });

            if (idx < accountIds.length - 1) {
                const spacer = document.createElement('option');
                spacer.disabled = true;
                spacer.value = '';
                spacer.textContent = '──────────';
                ftProfileSelector.appendChild(spacer);
            }
        });

        const current = normalizeString(root.activeProfileId) || 'default';
        ftProfileSelector.value = current;

        try {
            const colors = getProfileColors(current);
            ftProfileSelector.style.setProperty('--ft-profile-accent', colors.accent || '');
            ftProfileSelector.style.setProperty('--ft-profile-accent-bg', colors.accentBg || '');
            ftProfileSelector.style.setProperty('--ft-profile-accent-border', colors.accentBorder || '');
            ftProfileSelector.style.borderColor = colors.accentBorder || '';
            ftProfileSelector.style.backgroundColor = colors.accentBg || '';
            ftProfileSelector.style.color = colors.fg || '';
            // propagate accent to other selects for consistent look
            document.documentElement.style.setProperty('--ft-select-border', colors.accentBorder || '');
            document.documentElement.style.setProperty('--ft-select-accent', colors.accent || '');
        } catch (e) {
        }
    }

    function renderProfilesManager(profilesV4) {
        if (!ftProfilesManager) return;
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);

        ftProfilesManager.innerHTML = '';

        const accountIds = getAccountIds(profilesV4);
        const ids = [];
        accountIds.forEach(accountId => {
            ids.push(accountId, ...getChildrenForAccount(profilesV4, accountId));
        });

        let lastAccount = null;
        ids.forEach((profileId) => {
            const accountId = getParentAccountId(profilesV4, profileId);
            const type = getProfileType(profilesV4, profileId);
            if (accountId !== lastAccount) {
                lastAccount = accountId;
                const headerRow = document.createElement('div');
                headerRow.className = 'help-item ft-profile-group-header';
                const title = document.createElement('div');
                title.className = 'help-item-title';
                title.textContent = `Account: ${getProfileName(profilesV4, accountId)}`;
                headerRow.appendChild(title);
                ftProfilesManager.appendChild(headerRow);
            }

            const row = document.createElement('div');
            const locked = isProfileLocked(profilesV4, profileId);
            row.className = `help-item ft-profile-row${type === 'child' ? ' ft-profile-child' : ''}${profileId === activeProfileId ? ' is-active' : ''}${locked ? ' is-locked' : ''}`;

            const colors = getProfileColors(profileId);
            row.style.setProperty('--ft-profile-accent', colors.accent || '');
            row.style.setProperty('--ft-profile-accent-bg', colors.accentBg || '');
            row.style.setProperty('--ft-profile-accent-border', colors.accentBorder || '');

            const title = document.createElement('div');
            title.className = 'help-item-title';
            title.textContent = buildProfileLabel(profilesV4, profileId);

            const body = document.createElement('div');
            body.className = 'help-item-body';

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';
            actions.style.flexWrap = 'wrap';
            actions.style.marginTop = '8px';

            const switchBtn = document.createElement('button');
            switchBtn.className = 'btn-secondary';
            switchBtn.type = 'button';
            switchBtn.textContent = profileId === activeProfileId ? 'Active' : 'Switch';
            switchBtn.disabled = profileId === activeProfileId;
            switchBtn.addEventListener('click', async () => {
                if (ftProfileSelector) {
                    ftProfileSelector.value = profileId;
                }
                await switchToProfile(profileId);
            });

            const renameBtn = document.createElement('button');
            renameBtn.className = 'btn-secondary';
            renameBtn.type = 'button';
            renameBtn.textContent = 'Rename';
            renameBtn.addEventListener('click', async () => {
                const io = window.FilterTubeIO || {};
                if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                const fresh = await io.loadProfilesV4();
                const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
                if (currentActive !== 'default' && currentActive !== profileId) {
                    UIComponents.showToast('Switch to this profile (or Default) to rename it', 'error');
                    return;
                }
                if (currentActive === 'default') {
                    const okAdmin = await ensureAdminUnlocked(fresh);
                    if (!okAdmin) return;
                } else {
                    const okSelf = await ensureProfileUnlocked(fresh, profileId);
                    if (!okSelf) return;
                }

                const currentName = getProfileName(fresh, profileId);
                const nextNameRaw = await showPromptModal({
                    title: 'Rename Profile',
                    message: 'Enter a new profile name.',
                    placeholder: 'Profile name',
                    inputType: 'text',
                    confirmText: 'Save',
                    initialValue: currentName
                });
                const nextName = normalizeString(nextNameRaw);
                if (!nextName) return;

                const profiles = safeObject(fresh.profiles);
                const profile = safeObject(profiles[profileId]);
                profiles[profileId] = { ...profile, name: nextName };
                await io.saveProfilesV4({
                    ...fresh,
                    schemaVersion: 4,
                    profiles
                });
                await refreshProfilesUI();
                UIComponents.showToast('Profile updated', 'success');
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-secondary btn-danger';
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.disabled = profileId === 'default';
            deleteBtn.addEventListener('click', async () => {
                if (profileId === 'default') return;
                const io = window.FilterTubeIO || {};
                if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                const fresh = await io.loadProfilesV4();
                const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
                if (currentActive !== 'default' && currentActive !== profileId) {
                    UIComponents.showToast('Switch to this profile (or Default) to delete it', 'error');
                    return;
                }
                if (currentActive === 'default') {
                    const okAdmin = await ensureAdminUnlocked(fresh);
                    if (!okAdmin) return;
                } else {
                    const okSelf = await ensureProfileUnlocked(fresh, profileId);
                    if (!okSelf) return;
                }
                const confirmed = window.confirm('Delete this profile? This cannot be undone.');
                if (!confirmed) return;

                const profiles = safeObject(fresh.profiles);
                delete profiles[profileId];

                const nextActive = normalizeString(fresh.activeProfileId) || 'default';
                const resolvedActive = profiles[nextActive] ? nextActive : 'default';
                await io.saveProfilesV4({
                    ...fresh,
                    schemaVersion: 4,
                    activeProfileId: resolvedActive,
                    profiles
                });
                unlockedProfiles.delete(profileId);
                await StateManager.loadSettings();
                await refreshProfilesUI();
                await applyLockGateIfNeeded();
                UIComponents.showToast('Profile deleted', 'success');
            });

            actions.appendChild(switchBtn);
            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);

            if (profileId !== 'default') {
                const pinBtn = document.createElement('button');
                pinBtn.className = 'btn-secondary';
                pinBtn.type = 'button';
                pinBtn.textContent = isProfileLocked(profilesV4, profileId) ? 'Change PIN' : 'Set PIN';
                pinBtn.addEventListener('click', async () => {
                    const io = window.FilterTubeIO || {};
                    if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                    const fresh = await io.loadProfilesV4();

                    const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
                    if (currentActive !== 'default' && currentActive !== profileId) {
                        UIComponents.showToast('Switch to this profile (or Default) to manage its PIN', 'error');
                        return;
                    }

                    if (currentActive === 'default') {
                        const okAdmin = await ensureAdminUnlocked(fresh);
                        if (!okAdmin) return;
                    } else {
                        const okSelf = await ensureProfileUnlocked(fresh, profileId);
                        if (!okSelf) return;
                    }

                    const pin1 = await showPromptModal({
                        title: 'Set Profile PIN',
                        message: 'Enter a PIN for this profile.',
                        placeholder: 'PIN',
                        inputType: 'password',
                        confirmText: 'Continue'
                    });
                    if (pin1 === null) return;
                    const pin2 = await showPromptModal({
                        title: 'Confirm Profile PIN',
                        message: 'Re-enter the PIN to confirm.',
                        placeholder: 'PIN',
                        inputType: 'password',
                        confirmText: 'Save'
                    });
                    if (pin2 === null) return;
                    if (normalizeString(pin1) !== normalizeString(pin2) || !normalizeString(pin1)) {
                        UIComponents.showToast('PINs do not match', 'error');
                        return;
                    }

                    const Security = window.FilterTubeSecurity || {};
                    if (typeof Security.createPinVerifier !== 'function') {
                        UIComponents.showToast('Security manager unavailable', 'error');
                        return;
                    }

                    const verifier = await Security.createPinVerifier(normalizeString(pin1));
                    const profiles = safeObject(fresh.profiles);
                    const profile = safeObject(profiles[profileId]);
                    const security = safeObject(profile.security);
                    profiles[profileId] = {
                        ...profile,
                        security: {
                            ...security,
                            profilePinVerifier: verifier
                        }
                    };
                    await io.saveProfilesV4({
                        ...fresh,
                        schemaVersion: 4,
                        profiles
                    });
                    unlockedProfiles.delete(profileId);
                    await refreshProfilesUI();
                    UIComponents.showToast('Profile PIN updated', 'success');
                });

                const clearPinBtn = document.createElement('button');
                clearPinBtn.className = 'btn-secondary';
                clearPinBtn.type = 'button';
                clearPinBtn.textContent = 'Remove PIN';
                clearPinBtn.disabled = !isProfileLocked(profilesV4, profileId);
                clearPinBtn.addEventListener('click', async () => {
                    const io = window.FilterTubeIO || {};
                    if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                    const fresh = await io.loadProfilesV4();

                    const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
                    if (currentActive !== 'default' && currentActive !== profileId) {
                        UIComponents.showToast('Switch to this profile (or Default) to manage its PIN', 'error');
                        return;
                    }

                    if (currentActive === 'default') {
                        const okAdmin = await ensureAdminUnlocked(fresh);
                        if (!okAdmin) return;
                    } else {
                        const okSelf = await ensureProfileUnlocked(fresh, profileId);
                        if (!okSelf) return;
                    }
                    const confirmed = window.confirm('Remove the profile PIN?');
                    if (!confirmed) return;

                    const profiles = safeObject(fresh.profiles);
                    const profile = safeObject(profiles[profileId]);
                    const security = safeObject(profile.security);
                    const nextSecurity = { ...security };
                    delete nextSecurity.profilePinVerifier;
                    delete nextSecurity.pinVerifier;
                    profiles[profileId] = {
                        ...profile,
                        security: nextSecurity
                    };
                    await io.saveProfilesV4({
                        ...fresh,
                        schemaVersion: 4,
                        profiles
                    });
                    unlockedProfiles.delete(profileId);
                    await notifyBackgroundLocked(profileId);
                    await refreshProfilesUI();
                    UIComponents.showToast('Profile PIN removed', 'success');
                });

                actions.appendChild(pinBtn);
                actions.appendChild(clearPinBtn);
            }

            body.appendChild(actions);

            row.appendChild(title);
            row.appendChild(body);
            ftProfilesManager.appendChild(row);
        });
    }

    async function refreshProfilesUI() {
        try {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function') return;
            const profilesV4 = await io.loadProfilesV4();
            profilesV4Cache = profilesV4;
            const nextActive = normalizeString(profilesV4?.activeProfileId) || 'default';
            activeProfileId = nextActive;
            updateExportScopeControls();
            updateAdminPolicyControls();
            updateAutoBackupPolicyControls();
            renderProfileSelector(profilesV4);
            renderProfilesManager(profilesV4);
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
                if (ftProfileSelector) {
                    ftProfileSelector.value = normalizeString(profilesV4?.activeProfileId) || 'default';
                }
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
            updateStats();
            UIComponents.showToast('Profile switched', 'success');
        } catch (e) {
            console.warn('Tab-View: profile switch failed', e);
            UIComponents.showToast('Failed to switch profile', 'error');
        } finally {
            isHandlingProfileSwitch = false;
        }
    }
    try {
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 === 'function') {
            const profilesV4 = await io.loadProfilesV4();
            profilesV4Cache = profilesV4;
            if (typeof profilesV4?.activeProfileId === 'string' && profilesV4.activeProfileId.trim()) {
                activeProfileId = profilesV4.activeProfileId.trim();
            }
        }
    } catch (e) {
    }

    updateExportScopeControls();
    updateAdminPolicyControls();
    updateAutoBackupPolicyControls();
    if (profilesV4Cache) {
        renderProfileSelector(profilesV4Cache);
        renderProfilesManager(profilesV4Cache);
    }

    applyLockGateIfNeeded();

    if (ftProfileSelector) {
        ftProfileSelector.addEventListener('change', async (e) => {
            try {
                const target = normalizeString(e?.target?.value);
                if (!target) return;
                await switchToProfile(target);
            } catch (err) {
            }
        });
    }

    if (ftProfileBadgeBtnTab && ftProfileDropdownTab) {
        ftProfileBadgeBtnTab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleProfileDropdownTab();
        });

        window.addEventListener('resize', () => {
            positionProfileDropdownTab();
        });

        document.addEventListener('click', (e) => {
            try {
                if (!ftProfileMenuTab) {
                    closeProfileDropdownTab();
                    return;
                }
                if (ftProfileMenuTab.contains(e.target)) return;
                closeProfileDropdownTab();
            } catch (err) {
                closeProfileDropdownTab();
            }
        });
    }

    // Subscribe to state changes
    StateManager.subscribe((eventType, data) => {
        if (window.__filtertubeDebug) {
            console.log('Tab-View: State changed', eventType, data);
        }

        if (['keywordAdded', 'keywordRemoved', 'keywordUpdated', 'load', 'save'].includes(eventType)) {
            renderKeywords();
            updateStats();
            renderListModeControls();
        }

        if (['channelAdded', 'channelRemoved', 'channelUpdated', 'load', 'save'].includes(eventType)) {
            renderChannels();
            renderKeywords(); // Re-render keywords in case channel-derived keywords changed
            updateStats();
            renderListModeControls();
        }

        if (['kidsKeywordAdded', 'kidsKeywordRemoved', 'kidsKeywordUpdated', 'load', 'save'].includes(eventType)) {
            renderKidsKeywords();
            updateStats();
            renderListModeControls();
        }

        if (['kidsChannelAdded', 'kidsChannelRemoved', 'kidsChannelUpdated', 'load', 'save'].includes(eventType)) {
            renderKidsChannels();
            renderKidsKeywords();
            updateStats();
            renderListModeControls();
        }

        if (eventType === 'settingUpdated' || eventType === 'externalUpdate') {
            updateCheckboxes();
            updateAutoBackupPolicyControls();
        }

        if (eventType === 'load' || eventType === 'externalUpdate') {
            refreshProfilesUI();
            updateCheckboxes();
            updateStats();
            renderListModeControls();
        }

        if (eventType === 'themeChanged') {
            // Theme already applied by StateManager
        }
    });

    // ============================================================================
    // IMPORT / EXPORT (V3)
    // ============================================================================

    function downloadJsonToDownloadsFolder(folder, filename, obj) {
        return new Promise((resolve, reject) => {
            try {
                if (!runtimeAPI?.downloads?.download) {
                    reject(new Error('Downloads API unavailable'));
                    return;
                }

                const json = JSON.stringify(obj, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const blobUrl = URL.createObjectURL(blob);
                const safeFolder = (typeof folder === 'string' && folder.trim()) ? folder.trim().replace(/\/+$/, '') : '';
                const fullPath = safeFolder ? `${safeFolder}/${filename}` : filename;

                runtimeAPI.downloads.download({
                    url: blobUrl,
                    filename: fullPath,
                    saveAs: false
                }, (downloadId) => {
                    const err = runtimeAPI.runtime?.lastError;
                    try {
                        URL.revokeObjectURL(blobUrl);
                    } catch (e) {
                        // ignore
                    }
                    if (err) {
                        reject(new Error(err.message || 'Download failed'));
                        return;
                    }
                    resolve({ downloadId, filename: fullPath });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    async function runExportV3() {
        const io = window.FilterTubeIO;
        if (!io || typeof io.exportV3 !== 'function') {
            UIComponents.showToast('Export unavailable (FilterTubeIO not loaded)', 'error');
            return;
        }
        try {
            let auth = null;
            try {
                const profilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
                const activeId = normalizeString(profilesV4?.activeProfileId) || 'default';
                const requestedScope = ftExportActiveOnly?.checked ? 'active' : 'auto';
                const effectiveScope = (requestedScope === 'active') ? 'active' : (activeId === 'default' ? 'full' : 'active');
                const masterVerifier = extractMasterPinVerifier(profilesV4);
                if (activeId === 'default' && masterVerifier) {
                    if (!sessionMasterPin) {
                        const okAdmin = await ensureAdminUnlocked(profilesV4);
                        if (!okAdmin) return;
                    }
                    auth = { localMasterPin: sessionMasterPin };
                }
            } catch (e) {
            }

            const payload = await io.exportV3({ scope: ftExportActiveOnly?.checked ? 'active' : 'auto', auth });
            const date = new Date();
            const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const safePart = (value) => {
                if (typeof value !== 'string') return '';
                return value
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-zA-Z0-9._-]/g, '')
                    .replace(/-+/g, '-')
                    .replace(/^[-_.]+|[-_.]+$/g, '')
                    .slice(0, 48);
            };

            const exportType = payload?.meta?.exportType;
            const exportProfileName = typeof payload?.meta?.profileName === 'string' ? payload.meta.profileName : '';
            const exportProfileId = typeof payload?.meta?.profileId === 'string' ? payload.meta.profileId : '';
            const label = safePart(exportProfileName) || safePart(exportProfileId);

            const filename = (exportType === 'profile' && label)
                ? `filtertube_export_${label}_${stamp}.json`
                : `filtertube_export_v3_${stamp}.json`;
            await downloadJsonToDownloadsFolder('FilterTube Export', filename, payload);
            UIComponents.showToast('Exported JSON to Downloads/FilterTube Export/', 'success');
        } catch (e) {
            UIComponents.showToast('Export failed', 'error');
            console.error('Export V3 failed', e);
        }
    }

    async function runExportV3Encrypted() {
        const io = window.FilterTubeIO;
        if (!io || typeof io.exportV3Encrypted !== 'function') {
            UIComponents.showToast('Encrypted export unavailable', 'error');
            return;
        }

        try {
            const passwordRaw = await showPromptModal({
                title: 'Encrypted Export Password',
                message: 'Enter a password/PIN to encrypt this export.',
                placeholder: 'Password / PIN',
                inputType: 'password',
                confirmText: 'Encrypt'
            });
            const password = normalizeString(passwordRaw);
            if (!password) return;

            let auth = null;
            try {
                const profilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
                const activeId = normalizeString(profilesV4?.activeProfileId) || 'default';
                const requestedScope = ftExportActiveOnly?.checked ? 'active' : 'auto';
                const effectiveScope = (requestedScope === 'active') ? 'active' : (activeId === 'default' ? 'full' : 'active');
                const masterVerifier = extractMasterPinVerifier(profilesV4);
                if (activeId === 'default' && masterVerifier) {
                    if (!sessionMasterPin) {
                        const okAdmin = await ensureAdminUnlocked(profilesV4);
                        if (!okAdmin) return;
                    }
                    auth = { localMasterPin: sessionMasterPin };
                }
            } catch (e) {
            }

            const payload = await io.exportV3Encrypted({ scope: ftExportActiveOnly?.checked ? 'active' : 'auto', password, auth });

            const date = new Date();
            const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const safePart = (value) => {
                if (typeof value !== 'string') return '';
                return value
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-zA-Z0-9._-]/g, '')
                    .replace(/-+/g, '-')
                    .replace(/^[-_.]+|[-_.]+$/g, '')
                    .slice(0, 48);
            };
            const exportType = payload?.meta?.exportType;
            const exportProfileName = typeof payload?.meta?.profileName === 'string' ? payload.meta.profileName : '';
            const exportProfileId = typeof payload?.meta?.profileId === 'string' ? payload.meta.profileId : '';
            const label = safePart(exportProfileName) || safePart(exportProfileId);
            const filename = (exportType === 'profile' && label)
                ? `filtertube_export_${label}_${stamp}_encrypted.json`
                : `filtertube_export_v3_${stamp}_encrypted.json`;

            await downloadJsonToDownloadsFolder('FilterTube Export', filename, payload);
            UIComponents.showToast('Exported encrypted JSON to Downloads/FilterTube Export/', 'success');
        } catch (e) {
            UIComponents.showToast('Encrypted export failed', 'error');
            console.error('Export encrypted failed', e);
        }
    }

    async function runImportV3FromFile(file) {
        if (!file) return;
        const io = window.FilterTubeIO;
        if (!io || typeof io.importV3 !== 'function') {
            UIComponents.showToast('Import unavailable (FilterTubeIO not loaded)', 'error');
            return;
        }

        try {
            const profilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
            const activeId = normalizeString(profilesV4?.activeProfileId) || 'default';
            if (activeId !== 'default') {
                UIComponents.showToast('Switch to Default (Master) to import backups', 'error');
                return;
            }

            const masterVerifier = extractMasterPinVerifier(profilesV4);
            if (masterVerifier && !sessionMasterPin) {
                const okAdmin = await ensureAdminUnlocked(profilesV4);
                if (!okAdmin) return;
            }
        } catch (e) {
        }

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            let payload = parsed;
            if (safeObject(parsed?.meta).encrypted === true && parsed?.encrypted) {
                const passwordRaw = await showPromptModal({
                    title: 'Decrypt Backup',
                    message: 'Enter the password/PIN used to encrypt this backup.',
                    placeholder: 'Password / PIN',
                    inputType: 'password',
                    confirmText: 'Decrypt'
                });
                const password = normalizeString(passwordRaw);
                if (!password) return;
                const Security = window.FilterTubeSecurity || {};
                if (typeof Security.decryptJson !== 'function') {
                    UIComponents.showToast('Security manager unavailable', 'error');
                    return;
                }
                payload = await Security.decryptJson(parsed.encrypted, password);
            }

            let auth = null;
            try {
                const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
                const localActive = normalizeString(localProfilesV4?.activeProfileId) || 'default';
                const effectiveScope = localActive === 'default' ? 'full' : 'active';
                const localVerifier = extractMasterPinVerifier(localProfilesV4);
                const incomingVerifier = extractMasterPinVerifier(payload?.profilesV4);

                if (localActive === 'default' && effectiveScope === 'full' && localVerifier) {
                    if (!sessionMasterPin) {
                        const okAdmin = await ensureAdminUnlocked(localProfilesV4);
                        if (!okAdmin) return;
                    }
                    auth = { ...(auth || {}), localMasterPin: sessionMasterPin };
                }

                if (localActive === 'default' && effectiveScope === 'full' && incomingVerifier) {
                    const backupPinRaw = await showPromptModal({
                        title: 'Backup Master PIN',
                        message: 'This backup is protected by a Master PIN. Enter it to import.',
                        placeholder: 'Master PIN',
                        inputType: 'password',
                        confirmText: 'Authorize'
                    });
                    const backupPin = normalizeString(backupPinRaw);
                    if (!backupPin) return;
                    auth = { ...(auth || {}), incomingMasterPin: backupPin };
                }
            } catch (e) {
            }

            await io.importV3(payload, { strategy: 'merge', scope: 'auto', auth });

            await StateManager.loadSettings();
            const state = StateManager.getState();
            const SettingsAPI = window.FilterTubeSettings || {};
            if (SettingsAPI.applyThemePreference) {
                SettingsAPI.applyThemePreference(state.theme);
            }

            UIComponents.showToast('Import complete', 'success');
        } catch (e) {
            UIComponents.showToast('Import failed (invalid file?)', 'error');
            console.error('Import V3 failed', e);
        }
    }

    if (ftExportV3Btn) {
        ftExportV3Btn.addEventListener('click', () => {
            runExportV3();
        });
    }

    if (ftExportV3EncryptedBtn) {
        ftExportV3EncryptedBtn.addEventListener('click', () => {
            runExportV3Encrypted();
        });
    }

    if (ftImportV3Btn && ftImportV3File) {
        ftImportV3Btn.addEventListener('click', () => {
            ftImportV3File.click();
        });

        ftImportV3File.addEventListener('change', async (e) => {
            const file = e.target?.files?.[0] || null;
            await runImportV3FromFile(file);
            e.target.value = '';
        });
    }

    if (ftAllowAccountCreation && ftMaxAccounts) {
        const persistPolicy = async (nextPolicy) => {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
            const fresh = await io.loadProfilesV4();
            if (normalizeString(fresh?.activeProfileId) !== 'default') {
                UIComponents.showToast('Switch to Default to change account policy', 'error');
                updateAdminPolicyControls();
                return;
            }
            const okAdmin = await ensureAdminUnlocked(fresh);
            if (!okAdmin) return;
            const profiles = safeObject(fresh.profiles);
            const master = safeObject(profiles.default);
            const settings = safeObject(master.settings);
            profiles.default = {
                ...master,
                settings: {
                    ...settings,
                    accountPolicy: {
                        allowAccountCreation: nextPolicy.allowAccountCreation === true,
                        maxAccounts: Math.max(0, Math.floor(nextPolicy.maxAccounts || 0))
                    }
                }
            };
            await io.saveProfilesV4({
                ...fresh,
                schemaVersion: 4,
                profiles
            });
            await refreshProfilesUI();
            UIComponents.showToast('Account policy updated', 'success');
        };

        ftAllowAccountCreation.addEventListener('change', async () => {
            if (activeProfileId !== 'default') {
                UIComponents.showToast('Switch to Default to change account policy', 'error');
                updateAdminPolicyControls();
                return;
            }
            if (!profilesV4Cache) return;
            const policy = getAccountPolicy(profilesV4Cache);
            await persistPolicy({ ...policy, allowAccountCreation: !!ftAllowAccountCreation.checked });
        });

        ftMaxAccounts.addEventListener('change', async () => {
            if (activeProfileId !== 'default') {
                UIComponents.showToast('Switch to Default to change account policy', 'error');
                updateAdminPolicyControls();
                return;
            }
            if (!profilesV4Cache) return;
            const policy = getAccountPolicy(profilesV4Cache);
            const nextMax = parseInt(ftMaxAccounts.value || '0', 10);
            await persistPolicy({ ...policy, maxAccounts: Number.isFinite(nextMax) ? nextMax : 0 });
        });
    }

    if (ftCreateAccountBtn) {
        ftCreateAccountBtn.addEventListener('click', async () => {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
                UIComponents.showToast('Profiles unavailable', 'error');
                return;
            }

            const profilesV4 = await io.loadProfilesV4();
            if (normalizeString(profilesV4?.activeProfileId) !== 'default') {
                UIComponents.showToast('Switch to Default to create an account', 'error');
                return;
            }

            const okAdmin = await ensureAdminUnlocked(profilesV4);
            if (!okAdmin) return;

            const policy = getAccountPolicy(profilesV4);
            if (!policy.allowAccountCreation) {
                UIComponents.showToast('Account creation is disabled in Master policy', 'error');
                return;
            }

            if (policy.maxAccounts > 0) {
                const existingCount = countNonDefaultAccounts(profilesV4);
                if (existingCount >= policy.maxAccounts) {
                    UIComponents.showToast('Account limit reached', 'error');
                    return;
                }
            }

            const nameRaw = await showPromptModal({
                title: 'Create Account',
                message: 'Enter a name for the new account.',
                placeholder: 'Profile name',
                inputType: 'text',
                confirmText: 'Create'
            });
            const name = normalizeString(nameRaw);
            if (!name) return;

            const makeIdPart = (value) => normalizeString(value)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9_-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^[-_]+|[-_]+$/g, '')
                .slice(0, 28);

            const baseId = makeIdPart(name) || `profile-${Math.random().toString(36).slice(2, 8)}`;
            const profiles = safeObject(profilesV4.profiles);
            let candidate = baseId;
            let counter = 2;
            while (profiles[candidate] || candidate === 'default') {
                candidate = `${baseId}-${counter}`;
                counter += 1;
            }

            const sourceId = normalizeString(profilesV4?.activeProfileId) || 'default';
            const sourceProfile = safeObject(profiles[sourceId]);
            const sourceSettings = safeObject(sourceProfile.settings);
            const autoBackupEnabled = sourceSettings.autoBackupEnabled === true;
            const modeRaw = normalizeString(sourceSettings.autoBackupMode).toLowerCase();
            const autoBackupMode = (modeRaw === 'history' || modeRaw === 'latest') ? modeRaw : 'latest';
            const formatRaw = normalizeString(sourceSettings.autoBackupFormat).toLowerCase();
            const autoBackupFormat = (formatRaw === 'plain' || formatRaw === 'encrypted' || formatRaw === 'auto') ? formatRaw : 'auto';

            profiles[candidate] = {
                type: 'account',
                parentProfileId: null,
                name,
                settings: {
                    syncKidsToMain: false,
                    autoBackupEnabled,
                    autoBackupMode,
                    autoBackupFormat
                },
                main: {
                    mode: 'blocklist',
                    channels: [],
                    keywords: [],
                    whitelistChannels: [],
                    whitelistKeywords: []
                },
                kids: {
                    mode: 'blocklist',
                    strictMode: true,
                    blockedChannels: [],
                    blockedKeywords: [],
                    whitelistChannels: [],
                    whitelistKeywords: []
                }
            };

            await io.saveProfilesV4({
                ...profilesV4,
                schemaVersion: 4,
                profiles
            });

            await refreshProfilesUI();
            await switchToProfile(candidate);
            try {
                const fresh = profilesV4Cache;
                const root = safeObject(fresh);
                const profiles = safeObject(root.profiles);
                const activeProfile = safeObject(profiles[normalizeString(root.activeProfileId) || 'default']);
                const settings = safeObject(activeProfile.settings);
                if (settings.autoBackupEnabled === true) {
                    await scheduleAutoBackup('profile_created', 1500);
                }
            } catch (e) {
            }
        });
    }

    if (ftCreateChildBtn) {
        ftCreateChildBtn.addEventListener('click', async () => {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
                UIComponents.showToast('Profiles unavailable', 'error');
                return;
            }

            const profilesV4 = await io.loadProfilesV4();
            const currentActive = normalizeString(profilesV4?.activeProfileId) || 'default';
            const currentType = getProfileType(profilesV4, currentActive);
            if (currentType !== 'account') {
                UIComponents.showToast('Switch to the parent account to create a child profile', 'error');
                return;
            }

            const okUnlocked = await ensureProfileUnlocked(profilesV4, currentActive);
            if (!okUnlocked) return;

            const nameRaw = await showPromptModal({
                title: 'Create Child Profile',
                message: 'Enter a name for the new child profile.',
                placeholder: 'Profile name',
                inputType: 'text',
                confirmText: 'Create'
            });
            const name = normalizeString(nameRaw);
            if (!name) return;

            const makeIdPart = (value) => normalizeString(value)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9_-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^[-_]+|[-_]+$/g, '')
                .slice(0, 28);

            const baseId = makeIdPart(name) || `profile-${Math.random().toString(36).slice(2, 8)}`;
            const profiles = safeObject(profilesV4.profiles);
            let candidate = baseId;
            let counter = 2;
            while (profiles[candidate] || candidate === 'default') {
                candidate = `${baseId}-${counter}`;
                counter += 1;
            }

            const sourceProfile = safeObject(profiles[currentActive]);
            const sourceSettings = safeObject(sourceProfile.settings);
            const autoBackupEnabled = sourceSettings.autoBackupEnabled === true;
            const modeRaw = normalizeString(sourceSettings.autoBackupMode).toLowerCase();
            const autoBackupMode = (modeRaw === 'history' || modeRaw === 'latest') ? modeRaw : 'latest';
            const formatRaw = normalizeString(sourceSettings.autoBackupFormat).toLowerCase();
            const autoBackupFormat = (formatRaw === 'plain' || formatRaw === 'encrypted' || formatRaw === 'auto') ? formatRaw : 'auto';

            profiles[candidate] = {
                type: 'child',
                parentProfileId: currentActive,
                name,
                settings: {
                    syncKidsToMain: false,
                    autoBackupEnabled,
                    autoBackupMode,
                    autoBackupFormat
                },
                main: {
                    mode: 'blocklist',
                    channels: [],
                    keywords: [],
                    whitelistChannels: [],
                    whitelistKeywords: []
                },
                kids: {
                    mode: 'blocklist',
                    strictMode: true,
                    blockedChannels: [],
                    blockedKeywords: [],
                    whitelistChannels: [],
                    whitelistKeywords: []
                }
            };

            await io.saveProfilesV4({
                ...profilesV4,
                schemaVersion: 4,
                profiles
            });

            await refreshProfilesUI();
            await switchToProfile(candidate);
            try {
                const fresh = profilesV4Cache;
                const root = safeObject(fresh);
                const profiles = safeObject(root.profiles);
                const activeProfile = safeObject(profiles[normalizeString(root.activeProfileId) || 'default']);
                const settings = safeObject(activeProfile.settings);
                if (settings.autoBackupEnabled === true) {
                    await scheduleAutoBackup('profile_created', 1500);
                }
            } catch (e) {
            }
        });
    }

    if (ftSetMasterPinBtn) {
        ftSetMasterPinBtn.addEventListener('click', async () => {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
                UIComponents.showToast('Profiles unavailable', 'error');
                return;
            }
            const profilesV4 = await io.loadProfilesV4();
            if (normalizeString(profilesV4?.activeProfileId) !== 'default') {
                UIComponents.showToast('Switch to Default (Master) to manage Master PIN', 'error');
                return;
            }

            const hasExisting = !!extractMasterPinVerifier(profilesV4);
            if (hasExisting) {
                const okAdmin = await ensureAdminUnlocked(profilesV4);
                if (!okAdmin) return;
            }

            const pin1 = await showPromptModal({
                title: hasExisting ? 'Change Master PIN' : 'Set Master PIN',
                message: 'Enter a new Master PIN.',
                placeholder: 'Master PIN',
                inputType: 'password',
                confirmText: 'Continue'
            });
            if (pin1 === null) return;
            const pin2 = await showPromptModal({
                title: 'Confirm Master PIN',
                message: 'Re-enter the Master PIN to confirm.',
                placeholder: 'Master PIN',
                inputType: 'password',
                confirmText: 'Save'
            });
            if (pin2 === null) return;
            if (normalizeString(pin1) !== normalizeString(pin2) || !normalizeString(pin1)) {
                UIComponents.showToast('PINs do not match', 'error');
                return;
            }

            const Security = window.FilterTubeSecurity || {};
            if (typeof Security.createPinVerifier !== 'function') {
                UIComponents.showToast('Security manager unavailable', 'error');
                return;
            }

            const verifier = await Security.createPinVerifier(normalizeString(pin1));
            const profiles = safeObject(profilesV4.profiles);
            const master = safeObject(profiles.default);
            const security = safeObject(master.security);

            profiles.default = {
                ...master,
                security: {
                    ...security,
                    masterPinVerifier: verifier
                }
            };

            await io.saveProfilesV4({
                ...profilesV4,
                schemaVersion: 4,
                profiles
            });

            sessionMasterPin = normalizeString(pin1);
            unlockedProfiles.add('default');
            await refreshProfilesUI();
            UIComponents.showToast('Master PIN updated', 'success');
        });
    }

    if (ftClearMasterPinBtn) {
        ftClearMasterPinBtn.addEventListener('click', async () => {
            const io = window.FilterTubeIO || {};
            if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
                UIComponents.showToast('Profiles unavailable', 'error');
                return;
            }
            const profilesV4 = await io.loadProfilesV4();
            if (normalizeString(profilesV4?.activeProfileId) !== 'default') {
                UIComponents.showToast('Switch to Default (Master) to manage Master PIN', 'error');
                return;
            }

            const hasExisting = !!extractMasterPinVerifier(profilesV4);
            if (!hasExisting) {
                UIComponents.showToast('No Master PIN is set', 'info');
                return;
            }

            const okAdmin = await ensureAdminUnlocked(profilesV4);
            if (!okAdmin) return;
            const confirmed = window.confirm('Remove the Master PIN?');
            if (!confirmed) return;

            const profiles = safeObject(profilesV4.profiles);
            const master = safeObject(profiles.default);
            const security = safeObject(master.security);
            const nextSecurity = { ...security };
            delete nextSecurity.masterPinVerifier;
            delete nextSecurity.masterPin;
            profiles.default = {
                ...master,
                security: nextSecurity
            };

            await io.saveProfilesV4({
                ...profilesV4,
                schemaVersion: 4,
                profiles
            });

            sessionMasterPin = '';
            unlockedProfiles.delete('default');
            await notifyBackgroundLocked('default');
            await refreshProfilesUI();
            UIComponents.showToast('Master PIN removed', 'success');
        });
    }

    if (ftAutoBackupMode) {
        ftAutoBackupMode.addEventListener('change', async () => {
            if (isUiLocked()) {
                updateAutoBackupPolicyControls();
                return;
            }
            if (StateManager.getState()?.autoBackupEnabled !== true) {
                updateAutoBackupPolicyControls();
                return;
            }
            try {
                const io = window.FilterTubeIO || {};
                if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                const fresh = await io.loadProfilesV4();
                const activeId = normalizeString(fresh?.activeProfileId) || 'default';
                const profiles = safeObject(fresh?.profiles);
                const profile = safeObject(profiles[activeId]);
                const settings = safeObject(profile.settings);
                const next = ftAutoBackupMode.value === 'history' ? 'history' : 'latest';
                profiles[activeId] = {
                    ...profile,
                    settings: {
                        ...settings,
                        autoBackupMode: next
                    }
                };
                await io.saveProfilesV4({
                    ...fresh,
                    schemaVersion: 4,
                    activeProfileId: activeId,
                    profiles
                });
                await refreshProfilesUI();
                await scheduleAutoBackup('setting_updated');
            } catch (e) {
            }
        });
    }

    if (ftAutoBackupFormat) {
        ftAutoBackupFormat.addEventListener('change', async () => {
            if (isUiLocked()) {
                updateAutoBackupPolicyControls();
                return;
            }
            if (StateManager.getState()?.autoBackupEnabled !== true) {
                updateAutoBackupPolicyControls();
                return;
            }
            try {
                const io = window.FilterTubeIO || {};
                if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                const fresh = await io.loadProfilesV4();
                const activeId = normalizeString(fresh?.activeProfileId) || 'default';
                const profiles = safeObject(fresh?.profiles);
                const profile = safeObject(profiles[activeId]);
                const settings = safeObject(profile.settings);
                const raw = normalizeString(ftAutoBackupFormat.value).toLowerCase();
                const next = (raw === 'plain' || raw === 'encrypted' || raw === 'auto') ? raw : 'auto';
                profiles[activeId] = {
                    ...profile,
                    settings: {
                        ...settings,
                        autoBackupFormat: next
                    }
                };
                await io.saveProfilesV4({
                    ...fresh,
                    schemaVersion: 4,
                    activeProfileId: activeId,
                    profiles
                });
                await refreshProfilesUI();
                await scheduleAutoBackup('setting_updated');
            } catch (e) {
            }
        });
    }

    // Kids UI refs & state
    const kidsKeywordInput = document.getElementById('kidsKeywordInput');
    const kidsAddKeywordBtn = document.getElementById('kidsAddKeywordBtn');
    const kidsKeywordListEl = document.getElementById('kidsKeywordListEl');
    const kidsSearchKeywords = document.getElementById('kidsSearchKeywords');
    const kidsKeywordSort = document.getElementById('kidsKeywordSort');
    const kidsKeywordDatePreset = document.getElementById('kidsKeywordDatePreset');
    const kidsKeywordDateFrom = document.getElementById('kidsKeywordDateFrom');
    const kidsKeywordDateTo = document.getElementById('kidsKeywordDateTo');
    const kidsKeywordDateClear = document.getElementById('kidsKeywordDateClear');

    const kidsChannelInput = document.getElementById('kidsChannelInput');
    const kidsAddChannelBtn = document.getElementById('kidsAddChannelBtn');
    const kidsChannelListEl = document.getElementById('kidsChannelListEl');
    const kidsSearchChannels = document.getElementById('kidsSearchChannels');
    const kidsChannelSort = document.getElementById('kidsChannelSort');
    const kidsChannelDatePreset = document.getElementById('kidsChannelDatePreset');
    const kidsChannelDateFrom = document.getElementById('kidsChannelDateFrom');
    const kidsChannelDateTo = document.getElementById('kidsChannelDateTo');
    const kidsChannelDateClear = document.getElementById('kidsChannelDateClear');

    let kidsKeywordSearchValue = '';
    let kidsKeywordSortValue = 'newest';
    let kidsKeywordDateFromTs = null;
    let kidsKeywordDateToTs = null;
    let kidsChannelSearchValue = '';
    let kidsChannelSortValue = 'newest';
    let kidsChannelDateFromTs = null;
    let kidsChannelDateToTs = null;

    // ============================================================================
    // RENDERING
    // ============================================================================

    function toDateInputValue(dateObj) {
        if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
        const y = String(dateObj.getFullYear());
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function parseDateInput(dateStr, endOfDay = false) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const parts = dateStr.split('-').map(n => Number(n));
        if (parts.length !== 3) return null;
        const [year, month, day] = parts;
        if (!year || !month || !day) return null;
        const date = endOfDay
            ? new Date(year, month - 1, day, 23, 59, 59, 999)
            : new Date(year, month - 1, day, 0, 0, 0, 0);
        const ts = date.getTime();
        return Number.isFinite(ts) ? ts : null;
    }

    function applyPresetToDateControls(preset, fromEl, toEl) {
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (preset === 'today') {
            fromEl.value = toDateInputValue(startToday);
            toEl.value = toDateInputValue(endToday);
            return;
        }

        if (preset === '7d' || preset === '30d') {
            const days = preset === '7d' ? 7 : 30;
            const from = new Date(startToday);
            from.setDate(from.getDate() - (days - 1));
            fromEl.value = toDateInputValue(from);
            toEl.value = toDateInputValue(endToday);
            return;
        }

        if (preset === 'all') {
            fromEl.value = '';
            toEl.value = '';
        }
    }

    function renderKeywords() {
        if (!keywordListEl) return;
        RenderEngine.renderKeywordList(keywordListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            searchValue: keywordSearchValue,
            sortValue: keywordSortValue,
            dateFrom: keywordDateFromTs,
            dateTo: keywordDateToTs
        });
    }

    function renderChannels() {
        if (!channelListEl) return;
        RenderEngine.renderChannelList(channelListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            showNodeMapping: true,
            searchValue: channelSearchValue,
            sortValue: channelSortValue,
            dateFrom: channelDateFromTs,
            dateTo: channelDateToTs
        });
    }

    function renderKidsKeywords() {
        if (!kidsKeywordListEl) return;
        RenderEngine.renderKeywordList(kidsKeywordListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            searchValue: kidsKeywordSearchValue,
            sortValue: kidsKeywordSortValue,
            dateFrom: kidsKeywordDateFromTs,
            dateTo: kidsKeywordDateToTs,
            profile: 'kids',
            includeToggles: true
        });
    }

    function renderKidsChannels() {
        if (!kidsChannelListEl) return;
        RenderEngine.renderChannelList(kidsChannelListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            showNodeMapping: true,
            searchValue: kidsChannelSearchValue,
            sortValue: kidsChannelSortValue,
            dateFrom: kidsChannelDateFromTs,
            dateTo: kidsChannelDateToTs,
            profile: 'kids'
        });
    }

    function renderListModeControls() {
        const state = StateManager.getState();
        if (!ftTopBarListModeControlsTab) return;

        const currentNav = document.querySelector('.nav-item.active');
        const currentViewId = normalizeString(currentNav?.getAttribute('data-tab')) || 'dashboard';
        const profileType = currentViewId === 'kids' ? 'kids' : 'main';

        const currentMode = (() => {
            if (profileType === 'kids') {
                return state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
            }
            return state?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        })();

        ftTopBarListModeControlsTab.innerHTML = '';

        const toggle = UIComponents.createToggleButton({
            text: 'Whitelist',
            active: currentMode === 'whitelist',
            onToggle: async (nextState) => {
                if (isUiLocked()) {
                    renderListModeControls();
                    return;
                }

                const enablingWhitelist = nextState === true;
                const disablingWhitelist = nextState !== true && currentMode === 'whitelist';
                const whitelistEmpty = (() => {
                    if (profileType === 'kids') {
                        return (state?.kids?.whitelistChannels?.length || 0) === 0 && (state?.kids?.whitelistKeywords?.length || 0) === 0;
                    }
                    return (state?.whitelistChannels?.length || 0) === 0 && (state?.whitelistKeywords?.length || 0) === 0;
                })();

                let copyBlocklist = false;
                if (enablingWhitelist && whitelistEmpty) {
                    copyBlocklist = window.confirm('Copy your current blocklist into whitelist to get started?');
                    if (!copyBlocklist) {
                        UIComponents.showToast('Whitelist is empty — videos will stay hidden until you add allow rules.', 'info');
                    }
                }

                let resp = null;
                if (disablingWhitelist && !whitelistEmpty) {
                    const shouldTransfer = window.confirm('Move your whitelist back into blocklist? This will clear whitelist.');
                    if (shouldTransfer) {
                        resp = await sendRuntimeMessage({
                            action: 'FilterTube_TransferWhitelistToBlocklist',
                            profileType
                        });
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
                renderKidsKeywords();
                renderKidsChannels();
                updateCheckboxes();
                updateStats();
                renderListModeControls();
            },
            className: ''
        });

        ftTopBarListModeControlsTab.appendChild(toggle);
    }

    try {
        window.__filtertubeRenderTopBarListModeControls = renderListModeControls;
    } catch (e) {
    }

    function updateCheckboxes() {
        const state = StateManager.getState();
        const locked = isUiLocked();

        allSettingCheckboxes.forEach(el => {
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
    }

    function filterContentControls() {
        const q = (searchContentControls?.value || '').trim().toLowerCase();
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

    function filterHelpCards() {
        const helpView = document.getElementById('helpView');
        if (!helpView) return;
        if (helpSearchCard) helpSearchCard.style.display = '';

        const q = (helpSearchInput?.value || '').trim().toLowerCase();
        const cards = helpView.querySelectorAll('.card');

        let visibleCount = 0;
        cards.forEach(card => {
            if (helpSearchCard && card === helpSearchCard) return;
            const text = (card.textContent || '').toLowerCase();
            const show = !q || text.includes(q);
            card.style.display = show ? '' : 'none';
            if (show) visibleCount += 1;
        });

        if (helpSearchEmpty) {
            const showEmpty = !!q && visibleCount === 0;
            helpSearchEmpty.style.display = showEmpty ? '' : 'none';
        }
    }

    function updateStats() {
        const state = StateManager.getState();

        // Update stat cards
        const statActiveKeywords = document.getElementById('statActiveKeywords');
        const statFilteredChannels = document.getElementById('statFilteredChannels');
        const statHiddenToday = document.getElementById('statHiddenToday');
        const statSavedTime = document.getElementById('statSavedTime');

        if (statActiveKeywords) {
            statActiveKeywords.textContent = state.userKeywords?.length || 0;
        }

        if (statFilteredChannels) {
            statFilteredChannels.textContent = state.channels?.length || 0;
        }

        if (statHiddenToday) {
            statHiddenToday.textContent = state.stats?.hiddenCount || 0;
        }

        if (statSavedTime) {
            const totalSeconds = state.stats?.savedSeconds || 0;

            if (totalSeconds < 60) {
                // Less than 1 minute: show seconds
                statSavedTime.textContent = `${totalSeconds}s`;
            } else if (totalSeconds < 3600) {
                // Less than 1 hour: show minutes and seconds
                const mins = Math.floor(totalSeconds / 60);
                const secs = totalSeconds % 60;
                statSavedTime.textContent = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
            } else {
                // 1 hour or more: show hours, minutes, and optionally seconds
                const hours = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;

                if (secs > 0) {
                    statSavedTime.textContent = `${hours}h ${mins}m ${secs}s`;
                } else if (mins > 0) {
                    statSavedTime.textContent = `${hours}h ${mins}m`;
                } else {
                    statSavedTime.textContent = `${hours}h`;
                }
            }
        }
    }

    // Initial render
    renderKeywords();
    renderChannels();
    renderKidsKeywords();
    renderKidsChannels();
    updateCheckboxes();
    renderListModeControls();
    filterContentControls();
    filterHelpCards();
    updateStats();

    // ============================================================================
    // EVENT HANDLERS - Keywords
    // ============================================================================

    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', async () => {
            if (isUiLocked()) return;
            const rawInput = (keywordInput?.value || '').trim();
            if (!rawInput) return;

            // Support comma-separated keywords
            const keywords = rawInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
            if (keywords.length === 0) return;

            let addedCount = 0;
            for (const word of keywords) {
                const success = await StateManager.addKeyword(word);
                if (success) addedCount++;
            }

            if (addedCount > 0) {
                if (keywordInput) keywordInput.value = '';
                const msg = addedCount === 1 ? 'Added!' : `Added ${addedCount}!`;
                UIComponents.flashButtonSuccess(addKeywordBtn, msg, 1200);
            }
        });
    }

    if (keywordInput) {
        keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && addKeywordBtn) {
                addKeywordBtn.click();
            }
        });
    }

    if (searchKeywords) {
        searchKeywords.addEventListener('input', (e) => {
            keywordSearchValue = e.target.value;
            renderKeywords();
        });
    }

    if (keywordSort) {
        keywordSort.addEventListener('change', (e) => {
            keywordSortValue = e.target.value;
            renderKeywords();
        });
    }

    function updateKeywordDateFilterFromInputs() {
        keywordDateFromTs = parseDateInput(keywordDateFrom?.value || '', false);
        keywordDateToTs = parseDateInput(keywordDateTo?.value || '', true);
        renderKeywords();
    }

    if (keywordDatePreset) {
        keywordDatePreset.addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset !== 'custom') {
                applyPresetToDateControls(preset, keywordDateFrom, keywordDateTo);
                keywordDateFromTs = parseDateInput(keywordDateFrom?.value || '', false);
                keywordDateToTs = parseDateInput(keywordDateTo?.value || '', true);
                renderKeywords();
            }
        });
    }

    if (keywordDateFrom) {
        keywordDateFrom.addEventListener('change', () => {
            if (keywordDatePreset) keywordDatePreset.value = 'custom';
            updateKeywordDateFilterFromInputs();
        });
    }

    if (keywordDateTo) {
        keywordDateTo.addEventListener('change', () => {
            if (keywordDatePreset) keywordDatePreset.value = 'custom';
            updateKeywordDateFilterFromInputs();
        });
    }

    if (keywordDateClear) {
        keywordDateClear.addEventListener('click', () => {
            if (keywordDatePreset) keywordDatePreset.value = 'all';
            if (keywordDateFrom) keywordDateFrom.value = '';
            if (keywordDateTo) keywordDateTo.value = '';
            keywordDateFromTs = null;
            keywordDateToTs = null;
            renderKeywords();
        });
    }

    if (searchContentControls) {
        searchContentControls.addEventListener('input', () => {
            filterContentControls();
        });
    }

    if (helpSearchInput) {
        helpSearchInput.addEventListener('input', () => {
            filterHelpCards();
        });
    }

    // ============================================================================
    // EVENT HANDLERS - Channels
    // ============================================================================

    if (addChannelBtn) {
        addChannelBtn.addEventListener('click', async () => {
            if (isUiLocked()) return;
            const rawInput = (channelInput?.value || '').trim();
            if (!rawInput) return;

            // Support comma-separated channels
            const channels = rawInput.split(',').map(c => c.trim()).filter(c => c.length > 0);
            if (channels.length === 0) return;

            const originalText = addChannelBtn.textContent;
            addChannelBtn.textContent = 'Fetching...';
            addChannelBtn.disabled = true;

            try {
                let addedCount = 0;
                let lastError = null;

                for (const input of channels) {
                    const result = await StateManager.addChannel(input);
                    if (result.success) {
                        addedCount++;
                    } else {
                        lastError = result.error;
                    }
                }

                addChannelBtn.textContent = originalText;
                addChannelBtn.disabled = false;

                if (addedCount > 0) {
                    if (channelInput) channelInput.value = '';
                    const msg = addedCount === 1 ? 'Added!' : `Added ${addedCount}!`;
                    UIComponents.flashButtonSuccess(addChannelBtn, msg, 1200);
                } else if (lastError) {
                    UIComponents.showToast(lastError || 'Failed to add channel', 'error');
                }
            } catch (error) {
                addChannelBtn.textContent = originalText;
                addChannelBtn.disabled = false;
                UIComponents.showToast('Failed to add channel: ' + error.message, 'error');
            }
        });
    }

    if (channelInput) {
        channelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && addChannelBtn) {
                addChannelBtn.click();
            }
        });
    }

    if (searchChannels) {
        searchChannels.addEventListener('input', (e) => {
            channelSearchValue = e.target.value;
            renderChannels();
        });
    }

    if (channelSort) {
        channelSort.addEventListener('change', (e) => {
            channelSortValue = e.target.value;
            renderChannels();
        });
    }

    function updateChannelDateFilterFromInputs() {
        channelDateFromTs = parseDateInput(channelDateFrom?.value || '', false);
        channelDateToTs = parseDateInput(channelDateTo?.value || '', true);
        renderChannels();
    }

    if (channelDatePreset) {
        channelDatePreset.addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset !== 'custom') {
                applyPresetToDateControls(preset, channelDateFrom, channelDateTo);
                channelDateFromTs = parseDateInput(channelDateFrom?.value || '', false);
                channelDateToTs = parseDateInput(channelDateTo?.value || '', true);
                renderChannels();
            }
        });
    }

    if (channelDateFrom) {
        channelDateFrom.addEventListener('change', () => {
            if (channelDatePreset) channelDatePreset.value = 'custom';
            updateChannelDateFilterFromInputs();
        });
    }

    if (channelDateTo) {
        channelDateTo.addEventListener('change', () => {
            if (channelDatePreset) channelDatePreset.value = 'custom';
            updateChannelDateFilterFromInputs();
        });
    }

    if (channelDateClear) {
        channelDateClear.addEventListener('click', () => {
            if (channelDatePreset) channelDatePreset.value = 'all';
            if (channelDateFrom) channelDateFrom.value = '';
            if (channelDateTo) channelDateTo.value = '';
            channelDateFromTs = null;
            channelDateToTs = null;
            renderChannels();
        });
    }

    // Kids event handlers
    if (kidsAddKeywordBtn) {
        kidsAddKeywordBtn.addEventListener('click', async () => {
            if (isUiLocked()) return;
            const rawInput = (kidsKeywordInput?.value || '').trim();
            if (!rawInput) return;

            // Support comma-separated keywords
            const keywords = rawInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
            if (keywords.length === 0) return;

            let addedCount = 0;
            for (const word of keywords) {
                const success = await StateManager.addKidsKeyword(word);
                if (success) addedCount++;
            }

            if (addedCount > 0) {
                if (kidsKeywordInput) kidsKeywordInput.value = '';
                const msg = addedCount === 1 ? 'Added!' : `Added ${addedCount}!`;
                UIComponents.flashButtonSuccess(kidsAddKeywordBtn, msg, 1200);
            }
        });
    }

    if (kidsKeywordInput) {
        kidsKeywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && kidsAddKeywordBtn) {
                kidsAddKeywordBtn.click();
            }
        });
    }

    if (kidsSearchKeywords) {
        kidsSearchKeywords.addEventListener('input', (e) => {
            kidsKeywordSearchValue = e.target.value;
            renderKidsKeywords();
        });
    }

    if (kidsKeywordSort) {
        kidsKeywordSort.addEventListener('change', (e) => {
            kidsKeywordSortValue = e.target.value;
            renderKidsKeywords();
        });
    }

    function updateKidsKeywordDateFilterFromInputs() {
        kidsKeywordDateFromTs = parseDateInput(kidsKeywordDateFrom?.value || '', false);
        kidsKeywordDateToTs = parseDateInput(kidsKeywordDateTo?.value || '', true);
        renderKidsKeywords();
    }

    if (kidsKeywordDatePreset) {
        kidsKeywordDatePreset.addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset !== 'custom') {
                applyPresetToDateControls(preset, kidsKeywordDateFrom, kidsKeywordDateTo);
                kidsKeywordDateFromTs = parseDateInput(kidsKeywordDateFrom?.value || '', false);
                kidsKeywordDateToTs = parseDateInput(kidsKeywordDateTo?.value || '', true);
                renderKidsKeywords();
            }
        });
    }

    if (kidsKeywordDateFrom) {
        kidsKeywordDateFrom.addEventListener('change', () => {
            if (kidsKeywordDatePreset) kidsKeywordDatePreset.value = 'custom';
            updateKidsKeywordDateFilterFromInputs();
        });
    }

    if (kidsKeywordDateTo) {
        kidsKeywordDateTo.addEventListener('change', () => {
            if (kidsKeywordDatePreset) kidsKeywordDatePreset.value = 'custom';
            updateKidsKeywordDateFilterFromInputs();
        });
    }

    if (kidsKeywordDateClear) {
        kidsKeywordDateClear.addEventListener('click', () => {
            if (kidsKeywordDatePreset) kidsKeywordDatePreset.value = 'all';
            if (kidsKeywordDateFrom) kidsKeywordDateFrom.value = '';
            if (kidsKeywordDateTo) kidsKeywordDateTo.value = '';
            kidsKeywordDateFromTs = null;
            kidsKeywordDateToTs = null;
            renderKidsKeywords();
        });
    }

    if (kidsAddChannelBtn) {
        kidsAddChannelBtn.addEventListener('click', async () => {
            if (isUiLocked()) return;
            const rawInput = (kidsChannelInput?.value || '').trim();
            if (!rawInput) return;

            // Support comma-separated channels
            const channels = rawInput.split(',').map(c => c.trim()).filter(c => c.length > 0);
            if (channels.length === 0) return;

            let addedCount = 0;
            let lastError = null;

            for (const input of channels) {
                const result = await StateManager.addKidsChannel(input);
                if (result.success) {
                    addedCount++;
                } else {
                    lastError = result.error;
                }
            }

            if (addedCount > 0) {
                if (kidsChannelInput) kidsChannelInput.value = '';
                const msg = addedCount === 1 ? 'Added!' : `Added ${addedCount}!`;
                UIComponents.flashButtonSuccess(kidsAddChannelBtn, msg, 1200);
            } else if (lastError) {
                UIComponents.showToast(lastError || 'Failed to add channel', 'error');
            }
        });
    }

    if (kidsChannelInput) {
        kidsChannelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && kidsAddChannelBtn) {
                kidsAddChannelBtn.click();
            }
        });
    }

    if (kidsSearchChannels) {
        kidsSearchChannels.addEventListener('input', (e) => {
            kidsChannelSearchValue = e.target.value;
            renderKidsChannels();
        });
    }

    if (kidsChannelSort) {
        kidsChannelSort.addEventListener('change', (e) => {
            kidsChannelSortValue = e.target.value;
            renderKidsChannels();
        });
    }

    function updateKidsChannelDateFilterFromInputs() {
        kidsChannelDateFromTs = parseDateInput(kidsChannelDateFrom?.value || '', false);
        kidsChannelDateToTs = parseDateInput(kidsChannelDateTo?.value || '', true);
        renderKidsChannels();
    }

    if (kidsChannelDatePreset) {
        kidsChannelDatePreset.addEventListener('change', (e) => {
            const preset = e.target.value;
            if (preset !== 'custom') {
                applyPresetToDateControls(preset, kidsChannelDateFrom, kidsChannelDateTo);
                kidsChannelDateFromTs = parseDateInput(kidsChannelDateFrom?.value || '', false);
                kidsChannelDateToTs = parseDateInput(kidsChannelDateTo?.value || '', true);
                renderKidsChannels();
            }
        });
    }

    if (kidsChannelDateFrom) {
        kidsChannelDateFrom.addEventListener('change', () => {
            if (kidsChannelDatePreset) kidsChannelDatePreset.value = 'custom';
            updateKidsChannelDateFilterFromInputs();
        });
    }

    if (kidsChannelDateTo) {
        kidsChannelDateTo.addEventListener('change', () => {
            if (kidsChannelDatePreset) kidsChannelDatePreset.value = 'custom';
            updateKidsChannelDateFilterFromInputs();
        });
    }

    if (kidsChannelDateClear) {
        kidsChannelDateClear.addEventListener('click', () => {
            if (kidsChannelDatePreset) kidsChannelDatePreset.value = 'all';
            if (kidsChannelDateFrom) kidsChannelDateFrom.value = '';
            if (kidsChannelDateTo) kidsChannelDateTo.value = '';
            kidsChannelDateFromTs = null;
            kidsChannelDateToTs = null;
            renderKidsChannels();
        });
    }

    // ============================================================================
    // EVENT HANDLERS - Settings
    // ============================================================================

    allSettingCheckboxes.forEach(el => {
        el.addEventListener('change', async () => {
            if (isUiLocked()) {
                updateCheckboxes();
                return;
            }
            if (el.disabled) {
                updateCheckboxes();
                return;
            }
            const key = el.getAttribute('data-ft-setting');
            if (!key) return;
            await StateManager.updateSetting(key, el.checked);
        });
    });

    // ============================================================================
    // EVENT HANDLERS - Theme
    // ============================================================================

    if (themeToggle) {
        themeToggle.addEventListener('click', async () => {
            await StateManager.toggleTheme();
        });
    }

    // ============================================================================
    // QUICK ACTIONS (Dashboard)
    // ============================================================================

    const quickAddKeywordBtn = document.getElementById('quickAddKeywordBtn');
    const quickAddChannelBtn = document.getElementById('quickAddChannelBtn');
    const quickContentControlsBtn = document.getElementById('quickContentControlsBtn');

    if (quickAddKeywordBtn) {
        quickAddKeywordBtn.addEventListener('click', () => {
            switchView('filters');
            const tabs = document.querySelector('.tab-buttons');
            const keywordTab = tabs?.querySelector('[data-tab-id="keywords"]');
            if (keywordTab) keywordTab.click();
            setTimeout(() => keywordInput?.focus(), 100);
        });
    }

    if (quickAddChannelBtn) {
        quickAddChannelBtn.addEventListener('click', () => {
            switchView('filters');
            const tabs = document.querySelector('.tab-buttons');
            const channelsTab = tabs?.querySelector('[data-tab-id="channels"]');
            channelsTab?.click();
            setTimeout(() => document.getElementById('channelInput')?.focus(), 50);
        });
    }

    if (quickContentControlsBtn) {
        quickContentControlsBtn.addEventListener('click', () => {
            switchView('filters');
            const tabs = document.querySelector('.tab-buttons');
            const contentTabBtn = tabs?.querySelector('[data-tab-id="content"]');
            contentTabBtn?.click();
            // slight delay to ensure tab render, then focus search
            setTimeout(() => document.getElementById('searchContentControls')?.focus(), 50);
        });
    }

    await loadReleaseNotesIntoDashboard();
    handleNavigationIntent();
    window.addEventListener('hashchange', handleNavigationIntent);
    window.addEventListener('popstate', handleNavigationIntent);
});

// ============================================================================
// NAVIGATION
// ============================================================================

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');
    const viewContainer = document.querySelector('.view-container');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            try {
                if (item.getAttribute('aria-disabled') === 'true') return;
            } catch (e) {
            }
            const targetView = item.getAttribute('data-tab');
            switchView(targetView);
        });
    });

    function switchView(viewId) {
        let effectiveViewId = viewId;
        try {
            if (typeof window.FilterTubeResolveViewAccess === 'function') {
                effectiveViewId = window.FilterTubeResolveViewAccess(viewId)?.viewId || viewId;
            }
        } catch (e) {
            effectiveViewId = viewId;
        }

        // Update nav items
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-tab') === effectiveViewId);
        });

        // Update view sections
        viewSections.forEach(section => {
            section.classList.toggle('active', section.id === `${effectiveViewId}View`);
            if (section.id === `${effectiveViewId}View`) {
                section.scrollTop = 0;
            }
        });

        if (viewContainer) {
            viewContainer.scrollTop = 0;
        }

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'filters': 'Filters',
            'semantic': 'Semantic ML',
            'kids': 'Kids Mode',
            'settings': 'Settings',
            'whatsnew': 'What’s New',
            'help': 'Help',
            'support': 'Support'
        };
        if (pageTitle && titles[effectiveViewId]) {
            pageTitle.textContent = titles[effectiveViewId];
        }

        try {
            if (typeof window.__filtertubeRenderTopBarListModeControls === 'function') {
                window.__filtertubeRenderTopBarListModeControls();
            }
        } catch (e) {
        }
    }

    // Make switchView globally accessible for quick actions
    window.switchView = switchView;
}
