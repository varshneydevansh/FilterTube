/**
 * Tab-View script for FilterTube extension (REFACTORED)
 * 
 * This script uses centralized StateManager and RenderEngine
 * Full UI with advanced features: search, sort, node mapping, filter-all toggles
 */

const FILTERTUBE_SEMANTIC_ML_ENABLED = false;

// ============================================================================
// FILTERS TAB INITIALIZATION
// ============================================================================

function initializeResponsiveNav() {
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.getElementById('sidebarNav');
    const overlay = document.getElementById('sidebarOverlay');

    if (!navToggle || !sidebar || !overlay || navToggle.dataset.ftNavBound === 'true') return;

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
    }

    function closeOnWide() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    }

    navToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    });

    overlay.addEventListener('click', () => {
        closeSidebar();
    });

    window.addEventListener('resize', closeOnWide);
    closeOnWide();
    navToggle.dataset.ftNavBound = 'true';
}

function initializeFiltersTabs() {
    // Helper function to create compact inline condition rows
    function createCompactCondition({ name, value, labelText, fields }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-filter-compact-option';

        const mainRow = document.createElement('div');
        mainRow.className = 'video-filter-compact-main';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = name;
        radio.value = value;
        radio.id = `${name}_${value}`;
        radio.className = 'video-filter-compact-radio';

        const label = document.createElement('label');
        label.htmlFor = `${name}_${value}`;
        label.textContent = labelText;
        label.className = 'video-filter-compact-label';

        mainRow.appendChild(radio);
        mainRow.appendChild(label);

        const fieldsWrap = document.createElement('div');
        fieldsWrap.className = 'video-filter-compact-fields';

        fields.forEach((field) => {
            if (field.type === 'text') {
                const span = document.createElement('span');
                span.textContent = field.text;
                span.className = 'video-filter-compact-text';
                fieldsWrap.appendChild(span);
                return;
            }

            if (field.type === 'select') {
                const select = document.createElement('select');
                select.className = 'video-filter-compact-select';
                select.id = field.id;
                if (field.width) select.style.width = field.width;
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    select.appendChild(option);
                });
                fieldsWrap.appendChild(select);
                return;
            }

            const input = document.createElement('input');
            input.type = field.type || 'number';
            input.className = 'video-filter-compact-input';
            input.id = field.id;
            input.placeholder = field.placeholder || '';
            if (field.width) input.style.width = field.width;
            if (field.min !== undefined) input.min = field.min;
            fieldsWrap.appendChild(input);
        });

        wrapper.appendChild(mainRow);
        wrapper.appendChild(fieldsWrap);

        return wrapper;
    }

    const container = document.getElementById('filtersTabsContainer');
    if (!container) return;

    // Keywords tab content
    const keywordsContent = document.createElement('div');
    keywordsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="keywordInput" class="text-input" placeholder="Enter keyword to filter..." />
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
                <input type="date" id="keywordDateFrom" class="select-input date-input custom-date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="keywordDateTo" class="select-input date-input custom-date-input" />
                <button id="keywordDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="keywordListEl" class="advanced-list"></div>
    `;

    // Channels tab content
    const channelsContent = document.createElement('div');
    channelsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="channelInput" class="text-input" placeholder="@handle, Channel ID.. or c/ChannelName" />
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
                <input type="date" id="channelDateFrom" class="select-input date-input custom-date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="channelDateTo" class="select-input date-input custom-date-input" />
                <button id="channelDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
                <button id="importSubscriptionsBtn" class="btn-secondary date-clear-btn subscriptions-import-trigger" type="button">Import Subscribed Channels</button>
            </div>
        </div>

        <div id="importSubscriptionsNotice" class="subscriptions-import-inline subscriptions-import-inline--idle" hidden>
            <div id="importSubscriptionsStatus" class="subscriptions-import-status" aria-live="polite"></div>
            <div id="importSubscriptionsActions" class="subscriptions-import-actions" hidden></div>
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

        if (group?.id === 'feed') {
            groupEl.id = 'feedControlsSection';
        }

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

    const videoFiltersRows = feedRowsContainer || (() => {
        const wrapper = document.createElement('div');
        wrapper.className = 'content-control-group video-filters-section';
        wrapper.style.marginTop = '20px';
        wrapper.style.borderTop = '1px solid var(--ft-color-sem-neutral-border)';

        const header = document.createElement('div');
        header.className = 'content-control-group__header';

        const title = document.createElement('div');
        title.className = 'content-control-group__title';
        title.textContent = 'Feeds';

        header.appendChild(title);
        wrapper.appendChild(header);

        const rows = document.createElement('div');
        rows.className = 'content-control-group__rows';
        wrapper.appendChild(rows);
        contentTab.appendChild(wrapper);
        return rows;
    })();

    // Duration filter - single row with toggle, conditions show inline when enabled
    const durationRow = document.createElement('div');
    durationRow.className = 'toggle-row';
    durationRow.setAttribute('data-ft-control-row', 'true');
    durationRow.setAttribute('data-ft-search', 'duration filter');

    const durationInfo = document.createElement('div');
    durationInfo.className = 'toggle-info';

    const durationTitle = document.createElement('div');
    durationTitle.className = 'toggle-title';
    durationTitle.textContent = 'Duration Filter';

    const durationDesc = document.createElement('div');
    durationDesc.className = 'toggle-description';
    durationDesc.textContent = '';
    durationTitle.title = 'Filter videos by length (minutes)';

    durationInfo.appendChild(durationTitle);
    durationInfo.appendChild(durationDesc);

    const durationToggle = document.createElement('label');
    durationToggle.className = 'switch';

    const durationCheckbox = document.createElement('input');
    durationCheckbox.type = 'checkbox';
    durationCheckbox.id = 'videoFilter_duration_enabled';

    const durationSlider = document.createElement('span');
    durationSlider.className = 'slider round';

    durationToggle.appendChild(durationCheckbox);
    durationToggle.appendChild(durationSlider);

    durationRow.appendChild(durationInfo);
    durationRow.appendChild(durationToggle);
    videoFiltersRows.appendChild(durationRow);

    // Duration conditions (inline, shown when enabled)
    const durationConditionsRow = document.createElement('div');
    durationConditionsRow.className = 'video-filter-conditions-row';
    durationConditionsRow.id = 'durationConditionsRow';
    durationConditionsRow.setAttribute('data-ft-control-row', 'true');
    durationConditionsRow.setAttribute('data-ft-search', 'duration filter conditions');

    const durationConditionsWrap = document.createElement('div');
    durationConditionsWrap.className = 'video-filter-conditions';

    const longerRadio = createCompactCondition({
        name: 'videoFilter_duration_condition',
        value: 'longer',
        labelText: 'Block longer than',
        fields: [
            { id: 'videoFilter_duration_longer_value', type: 'number', placeholder: '60', min: 1, width: '50px' },
            { type: 'text', text: 'min' }
        ]
    });
    const shorterRadio = createCompactCondition({
        name: 'videoFilter_duration_condition',
        value: 'shorter',
        labelText: 'Block shorter than',
        fields: [
            { id: 'videoFilter_duration_shorter_value', type: 'number', placeholder: '5', min: 1, width: '50px' },
            { type: 'text', text: 'min' }
        ]
    });
    const betweenRadio = createCompactCondition({
        name: 'videoFilter_duration_condition',
        value: 'between',
        labelText: 'Only between',
        fields: [
            { id: 'videoFilter_duration_between_min', type: 'number', placeholder: '10', min: 1, width: '50px' },
            { type: 'text', text: '-' },
            { id: 'videoFilter_duration_between_max', type: 'number', placeholder: '120', min: 1, width: '50px' },
            { type: 'text', text: 'min' }
        ]
    });

    durationConditionsWrap.appendChild(longerRadio);
    durationConditionsWrap.appendChild(shorterRadio);
    durationConditionsWrap.appendChild(betweenRadio);
    durationConditionsRow.appendChild(durationConditionsWrap);
    videoFiltersRows.appendChild(durationConditionsRow);

    // Upload Date filter - single row with toggle, conditions show inline when enabled
    const uploadDateRow = document.createElement('div');
    uploadDateRow.className = 'toggle-row';
    uploadDateRow.setAttribute('data-ft-control-row', 'true');
    uploadDateRow.setAttribute('data-ft-search', 'upload date filter');

    const uploadDateInfo = document.createElement('div');
    uploadDateInfo.className = 'toggle-info';

    const uploadDateTitle = document.createElement('div');
    uploadDateTitle.className = 'toggle-title';
    uploadDateTitle.textContent = 'Upload Date Filter';

    const uploadDateDesc = document.createElement('div');
    uploadDateDesc.className = 'toggle-description';
    uploadDateDesc.textContent = '';
    uploadDateTitle.title = 'Filter by absolute date range';

    uploadDateInfo.appendChild(uploadDateTitle);
    uploadDateInfo.appendChild(uploadDateDesc);

    const uploadDateToggle = document.createElement('label');
    uploadDateToggle.className = 'switch';

    const uploadDateCheckbox = document.createElement('input');
    uploadDateCheckbox.type = 'checkbox';
    uploadDateCheckbox.id = 'videoFilter_uploadDate_enabled';

    const uploadDateSlider = document.createElement('span');
    uploadDateSlider.className = 'slider round';

    uploadDateToggle.appendChild(uploadDateCheckbox);
    uploadDateToggle.appendChild(uploadDateSlider);

    uploadDateRow.appendChild(uploadDateInfo);
    uploadDateRow.appendChild(uploadDateToggle);
    videoFiltersRows.appendChild(uploadDateRow);

    // Upload date conditions (inline, shown when enabled)
    const uploadDateConditionsRow = document.createElement('div');
    uploadDateConditionsRow.className = 'video-filter-conditions-row';
    uploadDateConditionsRow.id = 'uploadDateConditionsRow';
    uploadDateConditionsRow.setAttribute('data-ft-control-row', 'true');
    uploadDateConditionsRow.setAttribute('data-ft-search', 'upload date filter conditions');

    const uploadDateConditionsWrap = document.createElement('div');
    uploadDateConditionsWrap.className = 'video-filter-conditions';

    const unitOptions = [
        { value: 'days', label: 'days' },
        { value: 'weeks', label: 'weeks' },
        { value: 'months', label: 'months' },
        { value: 'years', label: 'years' }
    ];

    const newerRadio = createCompactCondition({
        name: 'videoFilter_uploadDate_condition',
        value: 'newer',
        labelText: 'Only past',
        fields: [
            { id: 'videoFilter_age_newer_value', type: 'number', placeholder: '30', min: 1, width: '45px' },
            { type: 'select', id: 'videoFilter_age_newer_unit', options: unitOptions, width: '72px' }
        ]
    });
    const olderRadio = createCompactCondition({
        name: 'videoFilter_uploadDate_condition',
        value: 'older',
        labelText: 'Block older than',
        fields: [
            { id: 'videoFilter_age_older_value', type: 'number', placeholder: '5', min: 1, width: '45px' },
            { type: 'select', id: 'videoFilter_age_older_unit', options: unitOptions, width: '72px' }
        ]
    });
    const betweenDateRadio = createCompactCondition({
        name: 'videoFilter_uploadDate_condition',
        value: 'between',
        labelText: 'Between',
        fields: [
            { id: 'videoFilter_age_between_min', type: 'number', placeholder: '1', min: 1, width: '45px' },
            { type: 'select', id: 'videoFilter_age_between_min_unit', options: unitOptions, width: '72px' },
            { type: 'text', text: '-' },
            { id: 'videoFilter_age_between_max', type: 'number', placeholder: '6', min: 1, width: '45px' },
            { type: 'select', id: 'videoFilter_age_between_max_unit', options: unitOptions, width: '72px' }
        ]
    });

    uploadDateConditionsWrap.appendChild(newerRadio);
    uploadDateConditionsWrap.appendChild(olderRadio);
    uploadDateConditionsWrap.appendChild(betweenDateRadio);
    uploadDateConditionsRow.appendChild(uploadDateConditionsWrap);
    videoFiltersRows.appendChild(uploadDateConditionsRow);

    // Uppercase title filter - toggle AND mode dropdown in same row
    const uppercaseRow = document.createElement('div');
    uppercaseRow.className = 'toggle-row';
    uppercaseRow.setAttribute('data-ft-control-row', 'true');
    uppercaseRow.setAttribute('data-ft-search', 'uppercase title filter');

    const uppercaseInfo = document.createElement('div');
    uppercaseInfo.className = 'toggle-info';

    const uppercaseTitle = document.createElement('div');
    uppercaseTitle.className = 'toggle-title';
    uppercaseTitle.textContent = 'UPPERCASE Title Filter';

    const uppercaseDesc = document.createElement('div');
    uppercaseDesc.className = 'toggle-description';
    uppercaseDesc.textContent = '';
    uppercaseTitle.title = 'Block AI slop with ALL CAPS titles';

    uppercaseInfo.appendChild(uppercaseTitle);
    uppercaseInfo.appendChild(uppercaseDesc);

    const uppercaseControls = document.createElement('div');
    uppercaseControls.className = 'video-filter-inline-controls';

    const uppercaseModeSelect = document.createElement('select');
    uppercaseModeSelect.id = 'videoFilter_uppercase_mode';
    uppercaseModeSelect.className = 'select-input video-filter-mode-select';
    uppercaseModeSelect.innerHTML = `
        <option value="single_word">Single uppercase word</option>
        <option value="all_caps">All caps title</option>
        <option value="both">Both</option>
    `;

    const uppercaseToggle = document.createElement('label');
    uppercaseToggle.className = 'switch';

    const uppercaseCheckbox = document.createElement('input');
    uppercaseCheckbox.type = 'checkbox';
    uppercaseCheckbox.id = 'videoFilter_uppercase_enabled';

    const uppercaseSlider = document.createElement('span');
    uppercaseSlider.className = 'slider round';

    uppercaseToggle.appendChild(uppercaseCheckbox);
    uppercaseToggle.appendChild(uppercaseSlider);

    uppercaseControls.appendChild(uppercaseModeSelect);
    uppercaseControls.appendChild(uppercaseToggle);

    uppercaseRow.appendChild(uppercaseInfo);
    uppercaseRow.appendChild(uppercaseControls);
    videoFiltersRows.appendChild(uppercaseRow);

    const categoryOptions = [
        { label: 'Film & Animation', color: '#ef4444' },
        { label: 'Autos & Vehicles', color: '#f97316' },
        { label: 'Music', color: '#f59e0b' },
        { label: 'Pets & Animals', color: '#84cc16' },
        { label: 'Sports', color: '#22c55e' },
        { label: 'Travel & Events', color: '#14b8a6' },
        { label: 'Gaming', color: '#0ea5e9' },
        { label: 'People & Blogs', color: '#3b82f6' },
        { label: 'Comedy', color: '#6366f1' },
        { label: 'Entertainment', color: '#8b5cf6' },
        { label: 'News & Politics', color: '#a855f7' },
        { label: 'Howto & Style', color: '#ec4899' },
        { label: 'Education', color: '#f43f5e' },
        { label: 'Science & Technology', color: '#64748b' },
        { label: 'Nonprofits & Activism', color: '#10b981' }
    ];

    const categoryFiltersSection = document.createElement('div');
    categoryFiltersSection.className = 'content-control-group category-filters-section';
    categoryFiltersSection.id = 'categoryFiltersSection';
    categoryFiltersSection.setAttribute('data-ft-control-group', 'true');
    categoryFiltersSection.setAttribute('data-ft-group-title', 'Category Filters');
    categoryFiltersSection.style.marginTop = '20px';
    categoryFiltersSection.style.borderTop = '1px solid var(--ft-color-sem-neutral-border)';

    const categoryFiltersHeader = document.createElement('div');
    categoryFiltersHeader.className = 'content-control-group__header';

    const categoryFiltersTitle = document.createElement('div');
    categoryFiltersTitle.className = 'content-control-group__title';
    categoryFiltersTitle.textContent = 'Category Filters';
    categoryFiltersHeader.appendChild(categoryFiltersTitle);
    categoryFiltersSection.appendChild(categoryFiltersHeader);

    const categoryFiltersRows = document.createElement('div');
    categoryFiltersRows.className = 'content-control-group__rows';

    const categoryModeOptions = [
        { value: 'block', label: 'Block selected' },
        { value: 'allow', label: 'Allow only selected' }
    ];

    const categoryMainRow = document.createElement('div');
    categoryMainRow.className = 'toggle-row';
    categoryMainRow.setAttribute('data-ft-control-row', 'true');
    categoryMainRow.setAttribute('data-ft-search', 'category filter');

    const categoryMainInfo = document.createElement('div');
    categoryMainInfo.className = 'toggle-info';

    const categoryMainTitle = document.createElement('div');
    categoryMainTitle.className = 'toggle-title';
    categoryMainTitle.textContent = 'Category Filter';
    categoryMainTitle.title = 'Filter videos by their YouTube category';

    const categoryMainDesc = document.createElement('div');
    categoryMainDesc.className = 'toggle-description';
    categoryMainDesc.textContent = '';

    categoryMainInfo.appendChild(categoryMainTitle);
    categoryMainInfo.appendChild(categoryMainDesc);

    const categoryMainControls = document.createElement('div');
    categoryMainControls.className = 'ft-category-controls';

    const categoryMainMode = UIComponents.createSelect({
        id: 'categoryFilter_mode',
        options: categoryModeOptions,
        value: 'block',
        onChange: () => scheduleSaveCategoryFilters('main', { showToast: true })
    });

    const categoryMainToggle = document.createElement('label');
    categoryMainToggle.className = 'switch';

    const categoryMainEnabled = document.createElement('input');
    categoryMainEnabled.type = 'checkbox';
    categoryMainEnabled.id = 'categoryFilter_enabled';

    const categoryMainSlider = document.createElement('span');
    categoryMainSlider.className = 'slider round';

    categoryMainToggle.appendChild(categoryMainEnabled);
    categoryMainToggle.appendChild(categoryMainSlider);

    categoryMainControls.appendChild(categoryMainMode);
    categoryMainControls.appendChild(categoryMainToggle);

    categoryMainRow.appendChild(categoryMainInfo);
    categoryMainRow.appendChild(categoryMainControls);
    categoryFiltersRows.appendChild(categoryMainRow);

    const categoryMainPanel = document.createElement('div');
    categoryMainPanel.className = 'ft-category-panel';
    categoryMainPanel.id = 'categoryFilter_panel';

    const categoryMainSearch = document.createElement('input');
    categoryMainSearch.type = 'text';
    categoryMainSearch.className = 'search-input ft-category-search';
    categoryMainSearch.id = 'categoryFilter_search';
    categoryMainSearch.placeholder = 'Search categories...';
    categoryMainPanel.appendChild(categoryMainSearch);

    const categoryMainList = document.createElement('div');
    categoryMainList.className = 'ft-category-options';
    categoryMainList.id = 'categoryFilter_list';
    categoryMainPanel.appendChild(categoryMainList);
    categoryFiltersRows.appendChild(categoryMainPanel);

    categoryFiltersSection.appendChild(categoryFiltersRows);
    contentTab.appendChild(categoryFiltersSection);

    let isApplyingCategoryFiltersUI = false;
    let pendingCategoryFiltersSaveTimerMain = 0;
    let lastSavedCategoryFiltersSignatureMain = '';
    let lastCategoryFiltersToastTs = 0;
    let categorySelectedMain = [];

    function computeCategoryFiltersSignature(next) {
        try {
            return JSON.stringify(next || {});
        } catch (e) {
            return '';
        }
    }

    function normalizeSelectedArray(arr) {
        const list = Array.isArray(arr) ? arr : [];
        const out = [];
        const seen = new Set();
        list.forEach((v) => {
            const label = String(v || '').trim();
            if (!label) return;
            const key = label.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(label);
        });
        return out;
    }

    function updateCategorySelection(profileType, label, isChecked) {
        const normalized = String(label || '').trim();
        if (!normalized) return;
        const type = profileType === 'kids' ? 'kids' : 'main';
        const arr = categorySelectedMain;
        const existingKey = normalized.toLowerCase();
        const next = [];
        let found = false;
        arr.forEach((v) => {
            const vv = String(v || '').trim();
            if (!vv) return;
            if (vv.toLowerCase() === existingKey) {
                found = true;
                if (isChecked) next.push(vv);
                return;
            }
            next.push(vv);
        });
        if (isChecked && !found) {
            next.push(normalized);
        }
        const deduped = normalizeSelectedArray(next);
        categorySelectedMain = deduped;
    }

    function renderCategoryList(listEl, selected = [], searchValue = '', profileType = 'main') {
        if (!listEl) return;
        const needle = typeof searchValue === 'string' ? searchValue.trim().toLowerCase() : '';
        const selectedSet = new Set((Array.isArray(selected) ? selected : []).map(v => String(v || '').trim().toLowerCase()).filter(Boolean));

        listEl.innerHTML = '';

        const filtered = categoryOptions.filter(opt => {
            if (!needle) return true;
            const label = String(opt?.label || '').toLowerCase();
            return label.includes(needle);
        });

        filtered.forEach(opt => {
            const label = String(opt?.label || '').trim();
            if (!label) return;

            const key = label.toLowerCase();
            const isActive = selectedSet.has(key);

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'ft-category-pill';
            if (isActive) pill.classList.add('active');
            pill.style.setProperty('--ft-category-color', opt?.color || '');
            pill.setAttribute('data-ft-category', 'true');
            pill.setAttribute('data-ft-category-label', label);
            pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            pill.addEventListener('click', () => {
                const nextActive = pill.getAttribute('aria-pressed') !== 'true';
                pill.setAttribute('aria-pressed', nextActive ? 'true' : 'false');
                pill.classList.toggle('active', nextActive);
                updateCategorySelection(profileType, label, nextActive);
                scheduleSaveCategoryFilters(profileType, { showToast: false });
            });

            const swatch = document.createElement('span');
            swatch.className = 'ft-category-swatch';

            const text = document.createElement('span');
            text.className = 'ft-category-label';
            text.textContent = label;

            pill.appendChild(swatch);
            pill.appendChild(text);
            listEl.appendChild(pill);
        });
    }

    function updateCategoryFilterUI() {
        const mainEnabled = document.getElementById('categoryFilter_enabled');
        const mainPanel = document.getElementById('categoryFilter_panel');
        const mainMode = document.getElementById('categoryFilter_mode');

        if (mainPanel) mainPanel.style.display = mainEnabled?.checked ? 'block' : 'none';

        if (mainMode) mainMode.disabled = !mainEnabled?.checked;
    }

    function applyCategoryFiltersToUI(categoryFilters = {}) {
        isApplyingCategoryFiltersUI = true;
        const enabled = document.getElementById('categoryFilter_enabled');
        const mode = document.getElementById('categoryFilter_mode');
        const list = document.getElementById('categoryFilter_list');
        const search = document.getElementById('categoryFilter_search');

        if (enabled) enabled.checked = !!categoryFilters.enabled;
        if (mode) {
            mode.value = categoryFilters.mode === 'allow' ? 'allow' : 'block';
            mode.dispatchEvent(new Event('input', { bubbles: true }));
        }
        categorySelectedMain = normalizeSelectedArray(categoryFilters.selected || []);
        renderCategoryList(list, categorySelectedMain, search?.value || '', 'main');
        updateCategoryFilterUI();
        isApplyingCategoryFiltersUI = false;
    }

    function saveCategoryFilters(profileType, options = {}) {
        if (isApplyingCategoryFiltersUI) return;
        const showToast = options?.showToast === true;

        const type = 'main';
        const enabledEl = document.getElementById('categoryFilter_enabled');
        const modeEl = document.getElementById('categoryFilter_mode');
        const listEl = document.getElementById('categoryFilter_list');

        const next = {
            enabled: !!enabledEl?.checked,
            mode: modeEl?.value === 'allow' ? 'allow' : 'block',
            selected: normalizeSelectedArray(categorySelectedMain)
        };

        const signature = computeCategoryFiltersSignature(next);
        const previousSignature = lastSavedCategoryFiltersSignatureMain;
        if (signature && signature === previousSignature) {
            if (showToast && Date.now() - lastCategoryFiltersToastTs > 900) {
                UIComponents.showToast('Category filters saved', 'success');
                lastCategoryFiltersToastTs = Date.now();
            }
            return;
        }

        lastSavedCategoryFiltersSignatureMain = signature;
        StateManager.updateCategoryFilters(next);

        if (showToast) {
            UIComponents.showToast('Category filters saved', 'success');
            lastCategoryFiltersToastTs = Date.now();
        }
    }

    function scheduleSaveCategoryFilters(profileType, options = {}) {
        if (isApplyingCategoryFiltersUI) return;
        const type = 'main';
        const timerRef = pendingCategoryFiltersSaveTimerMain;
        if (timerRef) {
            clearTimeout(timerRef);
        }
        const timer = setTimeout(() => {
            pendingCategoryFiltersSaveTimerMain = 0;
            saveCategoryFilters(type, options);
        }, 250);
        pendingCategoryFiltersSaveTimerMain = timer;
    }

    function updateVideoFilterUI() {
        const durationEnabled = document.getElementById('videoFilter_duration_enabled');
        const durationConditions = document.getElementById('durationConditionsRow');
        const uploadEnabled = document.getElementById('videoFilter_uploadDate_enabled');
        const uploadConditions = document.getElementById('uploadDateConditionsRow');
        const uppercaseEnabled = document.getElementById('videoFilter_uppercase_enabled');
        const uppercaseModeSelect = document.getElementById('videoFilter_uppercase_mode');
        const uppercaseModeMenu = uppercaseModeSelect?.closest('.ft-select-menu') || null;

        const showDurationControls = !!durationEnabled?.checked;
        const showUploadControls = !!uploadEnabled?.checked;
        const showUppercaseControls = !!uppercaseEnabled?.checked;

        if (durationConditions) durationConditions.style.display = showDurationControls ? 'block' : 'none';
        if (uploadConditions) uploadConditions.style.display = showUploadControls ? 'block' : 'none';
        const showUppercaseMode = showUppercaseControls;
        if (uppercaseModeMenu) {
            uppercaseModeMenu.style.display = showUppercaseMode ? 'inline-flex' : 'none';
        } else if (uppercaseModeSelect) {
            uppercaseModeSelect.style.display = showUppercaseMode ? 'inline-block' : 'none';
        }
        if (uppercaseModeSelect) {
            uppercaseModeSelect.disabled = !showUppercaseMode;
        }

        // Disable inputs for non-selected radio options
        const durationRadios = document.querySelectorAll('input[name="videoFilter_duration_condition"]');
        durationRadios.forEach(radio => {
            const option = radio.closest('.video-filter-compact-option');
            const inputs = option?.querySelectorAll('input[type="number"], select') || [];
            inputs.forEach(input => input.disabled = !radio.checked);
        });

        const uploadRadios = document.querySelectorAll('input[name="videoFilter_uploadDate_condition"]');
        uploadRadios.forEach(radio => {
            const option = radio.closest('.video-filter-compact-option');
            const inputs = option?.querySelectorAll('input[type="number"], select') || [];
            inputs.forEach(input => input.disabled = !radio.checked);
        });
    }

    function applyContentFiltersToUI(contentFilters = {}) {
        isApplyingContentFiltersUI = true;
        const durationEnabled = document.getElementById('videoFilter_duration_enabled');
        const uploadEnabled = document.getElementById('videoFilter_uploadDate_enabled');
        const uppercaseEnabled = document.getElementById('videoFilter_uppercase_enabled');
        const uppercaseMode = document.getElementById('videoFilter_uppercase_mode');

        if (durationEnabled) durationEnabled.checked = !!contentFilters.duration?.enabled;
        if (uploadEnabled) uploadEnabled.checked = !!contentFilters.uploadDate?.enabled;
        if (uppercaseEnabled) uppercaseEnabled.checked = !!contentFilters.uppercase?.enabled;

        const durationCondition = contentFilters.duration?.condition || 'between';
        const durationRadio = document.getElementById(`videoFilter_duration_condition_${durationCondition}`);
        if (durationRadio) durationRadio.checked = true;
        const longerValue = contentFilters.duration?.condition === 'longer' ? contentFilters.duration?.minMinutes : '';
        const shorterValue = contentFilters.duration?.condition === 'shorter' ? contentFilters.duration?.minMinutes : '';
        const betweenMin = durationCondition === 'between' ? (contentFilters.duration?.minMinutes ?? '') : '';
        const betweenMax = durationCondition === 'between' ? (contentFilters.duration?.maxMinutes ?? '') : '';
        const longerInput = document.getElementById('videoFilter_duration_longer_value');
        const shorterInput = document.getElementById('videoFilter_duration_shorter_value');
        const durationBetweenMinInput = document.getElementById('videoFilter_duration_between_min');
        const durationBetweenMaxInput = document.getElementById('videoFilter_duration_between_max');
        if (longerInput) longerInput.value = longerValue || '';
        if (shorterInput) shorterInput.value = shorterValue || '';
        if (durationBetweenMinInput) durationBetweenMinInput.value = betweenMin || '';
        if (durationBetweenMaxInput) durationBetweenMaxInput.value = betweenMax || '';

        const uploadCondition = contentFilters.uploadDate?.condition || 'newer';
        const uploadRadio = document.getElementById(`videoFilter_uploadDate_condition_${uploadCondition}`);
        if (uploadRadio) uploadRadio.checked = true;
        const newerValue = uploadCondition === 'newer' ? contentFilters.uploadDate?.value : '';
        const olderValue = uploadCondition === 'older' ? contentFilters.uploadDate?.value : '';
        const newerInput = document.getElementById('videoFilter_age_newer_value');
        const olderInput = document.getElementById('videoFilter_age_older_value');
        const uploadBetweenMinInput = document.getElementById('videoFilter_age_between_min');
        const uploadBetweenMaxInput = document.getElementById('videoFilter_age_between_max');
        if (newerInput) newerInput.value = newerValue || '';
        if (olderInput) olderInput.value = olderValue || '';
        if (uploadBetweenMinInput) uploadBetweenMinInput.value = uploadCondition === 'between' ? (contentFilters.uploadDate?.value || '') : '';
        if (uploadBetweenMaxInput) uploadBetweenMaxInput.value = uploadCondition === 'between' ? (contentFilters.uploadDate?.valueMax || '') : '';

        const newerUnit = document.getElementById('videoFilter_age_newer_unit');
        const olderUnit = document.getElementById('videoFilter_age_older_unit');
        const betweenMinUnit = document.getElementById('videoFilter_age_between_min_unit');
        const betweenMaxUnit = document.getElementById('videoFilter_age_between_max_unit');
        if (newerUnit) {
            newerUnit.value = contentFilters.uploadDate?.unit || 'days';
            newerUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (olderUnit) {
            olderUnit.value = contentFilters.uploadDate?.unit || 'years';
            olderUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (betweenMinUnit) {
            betweenMinUnit.value = contentFilters.uploadDate?.unit || 'months';
            betweenMinUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (betweenMaxUnit) {
            betweenMaxUnit.value = contentFilters.uploadDate?.unitMax || 'months';
            betweenMaxUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (uppercaseMode) {
            uppercaseMode.value = contentFilters.uppercase?.mode || 'single_word';
            uppercaseMode.dispatchEvent(new Event('input', { bubbles: true }));
        }

        updateVideoFilterUI();
        isApplyingContentFiltersUI = false;
    }

    let isApplyingContentFiltersUI = false;
    let pendingVideoFiltersSaveTimer = 0;
    let lastSavedVideoFiltersSignature = '';
    let lastVideoFiltersToastTs = 0;

    function scheduleSaveVideoFilters(options = {}) {
        if (isApplyingContentFiltersUI) return;
        if (pendingVideoFiltersSaveTimer) {
            clearTimeout(pendingVideoFiltersSaveTimer);
        }
        pendingVideoFiltersSaveTimer = setTimeout(() => {
            pendingVideoFiltersSaveTimer = 0;
            saveVideoFilters(options);
        }, 300);
    }

    function maybeSelectOptionRadioFromElement(element) {
        if (isApplyingContentFiltersUI) return false;
        const option = element?.closest?.('.video-filter-compact-option') || null;
        if (!option) return false;
        const radio = option.querySelector('.video-filter-compact-radio');
        if (!radio || radio.disabled) return false;
        if (!radio.checked) {
            radio.checked = true;
            updateVideoFilterUI();
            return true;
        }
        return false;
    }

    function computeVideoFiltersSignature(next) {
        try {
            return JSON.stringify(next || {});
        } catch (e) {
            return '';
        }
    }

    function saveVideoFilters(options = {}) {
        if (isApplyingContentFiltersUI) return;

        const showToast = options?.showToast === true;
        const state = StateManager.getState();
        const prior = state?.contentFilters || {};

        const durationCondition = document.querySelector('input[name="videoFilter_duration_condition"]:checked')?.value || (prior.duration?.condition || 'between');
        const uploadCondition = document.querySelector('input[name="videoFilter_uploadDate_condition"]:checked')?.value || (prior.uploadDate?.condition || 'newer');

        const durationEnabled = document.getElementById('videoFilter_duration_enabled')?.checked || false;
        const uploadEnabled = document.getElementById('videoFilter_uploadDate_enabled')?.checked || false;
        const uppercaseEnabled = document.getElementById('videoFilter_uppercase_enabled')?.checked || false;
        const uppercaseMode = document.getElementById('videoFilter_uppercase_mode')?.value || (prior.uppercase?.mode || 'single_word');

        const durationLongerValueRaw = document.getElementById('videoFilter_duration_longer_value')?.value;
        const durationShorterValueRaw = document.getElementById('videoFilter_duration_shorter_value')?.value;
        const durationBetweenMinRaw = document.getElementById('videoFilter_duration_between_min')?.value;
        const durationBetweenMaxRaw = document.getElementById('videoFilter_duration_between_max')?.value;

        const parsePositiveFloat = (value) => {
            if (value === null || value === undefined) return null;
            const num = parseFloat(String(value));
            return Number.isFinite(num) && num > 0 ? num : null;
        };

        const nextDuration = {
            ...(prior.duration || {}),
            enabled: durationEnabled,
            condition: durationCondition
        };

        if (durationCondition === 'longer') {
            const val = parsePositiveFloat(durationLongerValueRaw);
            if (val !== null) {
                nextDuration.minMinutes = val;
                nextDuration.maxMinutes = 0;
                nextDuration.value = String(val);
            }
        } else if (durationCondition === 'shorter') {
            const val = parsePositiveFloat(durationShorterValueRaw);
            if (val !== null) {
                nextDuration.minMinutes = val;
                nextDuration.maxMinutes = 0;
                nextDuration.value = String(val);
            }
        } else {
            const min = parsePositiveFloat(durationBetweenMinRaw);
            const max = parsePositiveFloat(durationBetweenMaxRaw);
            if (min !== null && max !== null) {
                const a = Math.min(min, max);
                const b = Math.max(min, max);
                nextDuration.minMinutes = a;
                nextDuration.maxMinutes = b;
                nextDuration.value = `${a}-${b}`;
            }
        }

        const unitMs = { days: 86400000, weeks: 604800000, months: 2592000000, years: 31536000000 };
        const now = Date.now();
        const uploadNewerRaw = document.getElementById('videoFilter_age_newer_value')?.value;
        const uploadNewerUnit = document.getElementById('videoFilter_age_newer_unit')?.value || (prior.uploadDate?.unit || 'days');
        const uploadOlderRaw = document.getElementById('videoFilter_age_older_value')?.value;
        const uploadOlderUnit = document.getElementById('videoFilter_age_older_unit')?.value || (prior.uploadDate?.unit || 'years');
        const uploadBetweenMinRaw = document.getElementById('videoFilter_age_between_min')?.value;
        const uploadBetweenMinUnit = document.getElementById('videoFilter_age_between_min_unit')?.value || (prior.uploadDate?.unit || 'months');
        const uploadBetweenMaxRaw = document.getElementById('videoFilter_age_between_max')?.value;
        const uploadBetweenMaxUnit = document.getElementById('videoFilter_age_between_max_unit')?.value || (prior.uploadDate?.unitMax || 'months');

        const nextUpload = {
            ...(prior.uploadDate || {}),
            enabled: uploadEnabled,
            condition: uploadCondition
        };

        if (uploadCondition === 'newer') {
            const val = parsePositiveFloat(uploadNewerRaw);
            if (val !== null) {
                nextUpload.value = String(val);
                nextUpload.unit = uploadNewerUnit;
                nextUpload.valueMax = 0;
                nextUpload.unitMax = '';
                const cutoff = now - val * (unitMs[uploadNewerUnit] || 0);
                nextUpload.fromDate = new Date(cutoff).toISOString();
                nextUpload.toDate = '';
            }
        } else if (uploadCondition === 'older') {
            const val = parsePositiveFloat(uploadOlderRaw);
            if (val !== null) {
                nextUpload.value = String(val);
                nextUpload.unit = uploadOlderUnit;
                nextUpload.valueMax = 0;
                nextUpload.unitMax = '';
                const cutoff = now - val * (unitMs[uploadOlderUnit] || 0);
                nextUpload.toDate = new Date(cutoff).toISOString();
                nextUpload.fromDate = '';
            }
        } else {
            const min = parsePositiveFloat(uploadBetweenMinRaw);
            const max = parsePositiveFloat(uploadBetweenMaxRaw);
            if (min !== null && max !== null) {
                nextUpload.value = String(min);
                nextUpload.unit = uploadBetweenMinUnit;
                nextUpload.valueMax = max;
                nextUpload.unitMax = uploadBetweenMaxUnit;
                const fromCutoff = now - min * (unitMs[uploadBetweenMinUnit] || 0);
                const toCutoff = now - max * (unitMs[uploadBetweenMaxUnit] || 0);
                nextUpload.fromDate = new Date(fromCutoff).toISOString();
                nextUpload.toDate = new Date(toCutoff).toISOString();
            }
        }

        const next = {
            duration: nextDuration,
            uploadDate: nextUpload,
            uppercase: { ...(prior.uppercase || {}), enabled: uppercaseEnabled, mode: uppercaseMode, minWordLength: 2 }
        };

        const mainNextSig = computeVideoFiltersSignature(next);
        const mainPriorSig = computeVideoFiltersSignature(prior);

        const mainChanged = !(mainNextSig === mainPriorSig || (lastSavedVideoFiltersSignature && mainNextSig === lastSavedVideoFiltersSignature));
        if (!mainChanged) {
            return;
        }

        if (mainChanged) {
            lastSavedVideoFiltersSignature = mainNextSig;
        }

        StateManager.updateContentFilters(next)
            .then(() => {
                if (!showToast) return;
                const ts = Date.now();
                if (ts - lastVideoFiltersToastTs < 800) return;
                lastVideoFiltersToastTs = ts;
                UIComponents.showToast('Video filters saved', 'success');
            })
            .catch((err) => {
                console.error('Failed to save video filters:', err);
                UIComponents.showToast('Failed to save video filters', 'error');
            });
    }

    // Attach listeners after a short delay to ensure elements are in DOM
    setTimeout(() => {
        const durationEnabled = document.getElementById('videoFilter_duration_enabled');
        const uploadEnabled = document.getElementById('videoFilter_uploadDate_enabled');
        const uppercaseEnabled = document.getElementById('videoFilter_uppercase_enabled');
        const uppercaseMode = document.getElementById('videoFilter_uppercase_mode');

        durationEnabled?.addEventListener('change', () => {
            updateVideoFilterUI();
            scheduleSaveVideoFilters({ showToast: true });
        });
        uploadEnabled?.addEventListener('change', () => {
            updateVideoFilterUI();
            scheduleSaveVideoFilters({ showToast: true });
        });
        uppercaseEnabled?.addEventListener('change', () => {
            updateVideoFilterUI();
            scheduleSaveVideoFilters({ showToast: true });
        });
        uppercaseMode?.addEventListener('change', () => scheduleSaveVideoFilters({ showToast: true }));

        const categoryMainEnabled = document.getElementById('categoryFilter_enabled');
        const categoryMainSearch = document.getElementById('categoryFilter_search');
        const categoryMainMode = document.getElementById('categoryFilter_mode');

        categoryMainEnabled?.addEventListener('change', () => {
            updateCategoryFilterUI();
            scheduleSaveCategoryFilters('main', { showToast: true });
        });
        categoryMainMode?.addEventListener('change', () => {
            updateCategoryFilterUI();
            scheduleSaveCategoryFilters('main', { showToast: true });
        });
        categoryMainSearch?.addEventListener('input', () => {
            try {
                renderCategoryList(document.getElementById('categoryFilter_list'), categorySelectedMain, categoryMainSearch.value || '', 'main');
            } catch (e) {
            }
        });

        // Radio button change listeners for duration and upload date
        document.querySelectorAll('input[name="videoFilter_duration_condition"]').forEach(radio => {
            radio?.addEventListener('change', () => {
                updateVideoFilterUI();
                scheduleSaveVideoFilters({ showToast: false });
            });
        });
        document.querySelectorAll('input[name="videoFilter_uploadDate_condition"]').forEach(radio => {
            radio?.addEventListener('change', () => {
                updateVideoFilterUI();
                scheduleSaveVideoFilters({ showToast: false });
            });
        });

        // Click on option card to select radio button
        document.querySelectorAll('.video-filter-compact-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // Don't trigger if clicking on input/label directly
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
                    return;
                }
                const radio = option.querySelector('.video-filter-compact-radio');
                if (radio && !radio.disabled) {
                    radio.checked = true;
                    updateVideoFilterUI();
                    scheduleSaveVideoFilters({ showToast: false });
                }
            });
        });

        document.querySelectorAll('.video-filter-compact-option input[type="number"], .video-filter-compact-option select').forEach(el => {
            el.addEventListener('focus', (e) => {
                if (maybeSelectOptionRadioFromElement(e.target)) {
                    scheduleSaveVideoFilters({ showToast: false });
                }
            });
            el.addEventListener('click', (e) => {
                if (maybeSelectOptionRadioFromElement(e.target)) {
                    scheduleSaveVideoFilters({ showToast: false });
                }
            });
        });
        [
            'videoFilter_duration_longer_value',
            'videoFilter_duration_shorter_value',
            'videoFilter_duration_between_min',
            'videoFilter_duration_between_max',
            'videoFilter_age_newer_value',
            'videoFilter_age_newer_unit',
            'videoFilter_age_older_value',
            'videoFilter_age_older_unit',
            'videoFilter_age_between_min',
            'videoFilter_age_between_min_unit',
            'videoFilter_age_between_max',
            'videoFilter_age_between_max_unit'
        ].forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('input', (e) => {
                maybeSelectOptionRadioFromElement(e.target);
                scheduleSaveVideoFilters({ showToast: false });
            });
            el?.addEventListener('change', (e) => {
                maybeSelectOptionRadioFromElement(e.target);
                scheduleSaveVideoFilters({ showToast: false });
            });
        });

        const state = StateManager.getState();
        applyContentFiltersToUI(state.contentFilters || {});
        applyCategoryFiltersToUI(state.categoryFilters || {});
    }, 100);

    StateManager.subscribe((eventType, data) => {
        if (eventType === 'contentFiltersUpdated') {
            applyContentFiltersToUI(data?.contentFilters || {});
            updateVideoFilterUI();
        }
        if (eventType === 'categoryFiltersUpdated') {
            applyCategoryFiltersToUI(data?.categoryFilters || {});
        }
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

    const sidebar = document.getElementById('sidebarNav');
    const overlay = document.getElementById('sidebarOverlay');

    function closeSidebar() {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('visible');
    }

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

    function createCompactCondition({ name, value, labelText, fields }) {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-filter-compact-option';

        const mainRow = document.createElement('div');
        mainRow.className = 'video-filter-compact-main';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = name;
        radio.value = value;
        radio.id = `${name}_${value}`;
        radio.className = 'video-filter-compact-radio';

        const label = document.createElement('label');
        label.htmlFor = `${name}_${value}`;
        label.textContent = labelText;
        label.className = 'video-filter-compact-label';

        mainRow.appendChild(radio);
        mainRow.appendChild(label);

        const fieldsWrap = document.createElement('div');
        fieldsWrap.className = 'video-filter-compact-fields';

        fields.forEach((field) => {
            if (field.type === 'text') {
                const span = document.createElement('span');
                span.textContent = field.text;
                span.className = 'video-filter-compact-text';
                fieldsWrap.appendChild(span);
                return;
            }

            if (field.type === 'select') {
                const select = document.createElement('select');
                select.className = 'video-filter-compact-select';
                select.id = field.id;
                if (field.width) select.style.width = field.width;
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    select.appendChild(option);
                });
                fieldsWrap.appendChild(select);
                return;
            }

            const input = document.createElement('input');
            input.type = field.type || 'number';
            input.className = 'video-filter-compact-input';
            input.id = field.id;
            input.placeholder = field.placeholder || '';
            if (field.width) input.style.width = field.width;
            if (field.min !== undefined) input.min = field.min;
            fieldsWrap.appendChild(input);
        });

        wrapper.appendChild(mainRow);
        wrapper.appendChild(fieldsWrap);

        return wrapper;
    }

    // Kids Keywords tab
    const kidsKeywordsContent = document.createElement('div');
    kidsKeywordsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="kidsKeywordInput" class="text-input" placeholder="Enter keyword to block on Kids..." />
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
                <input type="date" id="kidsKeywordDateFrom" class="select-input date-input custom-date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="kidsKeywordDateTo" class="select-input date-input custom-date-input" />
                <button id="kidsKeywordDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="kidsKeywordListEl" class="advanced-list"></div>
    `;

    // Kids Channels tab
    const kidsChannelsContent = document.createElement('div');
    kidsChannelsContent.innerHTML = `
        <div class="input-row">
            <input type="text" id="kidsChannelInput" class="text-input" placeholder="@handle, Channel ID, or c/ChannelName" />
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
                <input type="date" id="kidsChannelDateFrom" class="select-input date-input custom-date-input" />
                <span class="date-sep">to</span>
                <input type="date" id="kidsChannelDateTo" class="select-input date-input custom-date-input" />
                <button id="kidsChannelDateClear" class="btn-secondary date-clear-btn" type="button">Clear</button>
            </div>
        </div>

        <div id="kidsChannelListEl" class="advanced-list"></div>
    `;

    const kidsContentTab = document.createElement('div');
    kidsContentTab.id = 'kidsContentControlsSection';

    const kidsContentSearchRow = document.createElement('div');
    kidsContentSearchRow.className = 'search-row';

    const kidsContentControlsSearch = document.createElement('input');
    kidsContentControlsSearch.type = 'text';
    kidsContentControlsSearch.id = 'searchKidsContentControls';
    kidsContentControlsSearch.className = 'text-input search-input';
    kidsContentControlsSearch.placeholder = 'Search kids content controls...';

    kidsContentSearchRow.appendChild(kidsContentControlsSearch);
    kidsContentTab.appendChild(kidsContentSearchRow);

    const kidsVideoFiltersSection = document.createElement('div');
    kidsVideoFiltersSection.className = 'content-control-group video-filters-section';
    kidsVideoFiltersSection.style.marginTop = '10px';

    const kidsVideoFiltersHeader = document.createElement('div');
    kidsVideoFiltersHeader.className = 'content-control-group__header';

    const kidsVideoFiltersTitle = document.createElement('div');
    kidsVideoFiltersTitle.className = 'content-control-group__title';
    kidsVideoFiltersTitle.textContent = 'Content Controls';

    kidsVideoFiltersHeader.appendChild(kidsVideoFiltersTitle);
    kidsVideoFiltersSection.appendChild(kidsVideoFiltersHeader);

    const kidsVideoFiltersRows = document.createElement('div');
    kidsVideoFiltersRows.className = 'content-control-group__rows';

    const kidsDurationRow = document.createElement('div');
    kidsDurationRow.className = 'toggle-row';
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
    kidsDurationCheckbox.id = 'kidsVideoFilter_duration_enabled';

    const kidsDurationSlider = document.createElement('span');
    kidsDurationSlider.className = 'slider round';

    kidsDurationToggle.appendChild(kidsDurationCheckbox);
    kidsDurationToggle.appendChild(kidsDurationSlider);

    kidsDurationRow.appendChild(kidsDurationInfo);
    kidsDurationRow.appendChild(kidsDurationToggle);
    kidsVideoFiltersRows.appendChild(kidsDurationRow);

    const kidsDurationConditionsRow = document.createElement('div');
    kidsDurationConditionsRow.className = 'video-filter-conditions-row';
    kidsDurationConditionsRow.id = 'kidsDurationConditionsRow';
    kidsDurationConditionsRow.setAttribute('data-ft-control-row', 'true');
    kidsDurationConditionsRow.setAttribute('data-ft-search', 'duration filter conditions');

    const kidsDurationConditionsWrap = document.createElement('div');
    kidsDurationConditionsWrap.className = 'video-filter-conditions';

    const kidsLongerRadio = createCompactCondition({
        name: 'kidsVideoFilter_duration_condition',
        value: 'longer',
        labelText: 'Block longer than',
        fields: [
            { id: 'kidsVideoFilter_duration_longer_value', type: 'number', placeholder: '60', min: 1, width: '50px' },
            { type: 'text', text: 'min' }
        ]
    });
    const kidsShorterRadio = createCompactCondition({
        name: 'kidsVideoFilter_duration_condition',
        value: 'shorter',
        labelText: 'Block shorter than',
        fields: [
            { id: 'kidsVideoFilter_duration_shorter_value', type: 'number', placeholder: '5', min: 1, width: '50px' },
            { type: 'text', text: 'min' }
        ]
    });
    const kidsBetweenRadio = createCompactCondition({
        name: 'kidsVideoFilter_duration_condition',
        value: 'between',
        labelText: 'Only between',
        fields: [
            { id: 'kidsVideoFilter_duration_between_min', type: 'number', placeholder: '10', min: 1, width: '50px' },
            { type: 'text', text: '-' },
            { id: 'kidsVideoFilter_duration_between_max', type: 'number', placeholder: '120', min: 1, width: '50px' },
            { type: 'text', text: 'min' }
        ]
    });

    kidsDurationConditionsWrap.appendChild(kidsLongerRadio);
    kidsDurationConditionsWrap.appendChild(kidsShorterRadio);
    kidsDurationConditionsWrap.appendChild(kidsBetweenRadio);
    kidsDurationConditionsRow.appendChild(kidsDurationConditionsWrap);
    kidsVideoFiltersRows.appendChild(kidsDurationConditionsRow);

    const kidsUploadDateRow = document.createElement('div');
    kidsUploadDateRow.className = 'toggle-row';
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
    kidsUploadDateCheckbox.id = 'kidsVideoFilter_uploadDate_enabled';

    const kidsUploadDateSlider = document.createElement('span');
    kidsUploadDateSlider.className = 'slider round';

    kidsUploadDateToggle.appendChild(kidsUploadDateCheckbox);
    kidsUploadDateToggle.appendChild(kidsUploadDateSlider);

    kidsUploadDateRow.appendChild(kidsUploadDateInfo);
    kidsUploadDateRow.appendChild(kidsUploadDateToggle);
    kidsVideoFiltersRows.appendChild(kidsUploadDateRow);

    const kidsUploadDateConditionsRow = document.createElement('div');
    kidsUploadDateConditionsRow.className = 'video-filter-conditions-row';
    kidsUploadDateConditionsRow.id = 'kidsUploadDateConditionsRow';
    kidsUploadDateConditionsRow.setAttribute('data-ft-control-row', 'true');
    kidsUploadDateConditionsRow.setAttribute('data-ft-search', 'upload date filter conditions');

    const kidsUploadDateConditionsWrap = document.createElement('div');
    kidsUploadDateConditionsWrap.className = 'video-filter-conditions';

    const unitOptions = [
        { value: 'days', label: 'days' },
        { value: 'weeks', label: 'weeks' },
        { value: 'months', label: 'months' },
        { value: 'years', label: 'years' }
    ];

    const kidsNewerRadio = createCompactCondition({
        name: 'kidsVideoFilter_uploadDate_condition',
        value: 'newer',
        labelText: 'Only past',
        fields: [
            { id: 'kidsVideoFilter_age_newer_value', type: 'number', placeholder: '30', min: 1, width: '45px' },
            { type: 'select', id: 'kidsVideoFilter_age_newer_unit', options: unitOptions, width: '72px' }
        ]
    });
    const kidsOlderRadio = createCompactCondition({
        name: 'kidsVideoFilter_uploadDate_condition',
        value: 'older',
        labelText: 'Block older than',
        fields: [
            { id: 'kidsVideoFilter_age_older_value', type: 'number', placeholder: '5', min: 1, width: '45px' },
            { type: 'select', id: 'kidsVideoFilter_age_older_unit', options: unitOptions, width: '72px' }
        ]
    });
    const kidsBetweenDateRadio = createCompactCondition({
        name: 'kidsVideoFilter_uploadDate_condition',
        value: 'between',
        labelText: 'Between',
        fields: [
            { id: 'kidsVideoFilter_age_between_min', type: 'number', placeholder: '1', min: 1, width: '45px' },
            { type: 'select', id: 'kidsVideoFilter_age_between_min_unit', options: unitOptions, width: '72px' },
            { type: 'text', text: '-' },
            { id: 'kidsVideoFilter_age_between_max', type: 'number', placeholder: '6', min: 1, width: '45px' },
            { type: 'select', id: 'kidsVideoFilter_age_between_max_unit', options: unitOptions, width: '72px' }
        ]
    });

    kidsUploadDateConditionsWrap.appendChild(kidsNewerRadio);
    kidsUploadDateConditionsWrap.appendChild(kidsOlderRadio);
    kidsUploadDateConditionsWrap.appendChild(kidsBetweenDateRadio);
    kidsUploadDateConditionsRow.appendChild(kidsUploadDateConditionsWrap);
    kidsVideoFiltersRows.appendChild(kidsUploadDateConditionsRow);

    const kidsUppercaseRow = document.createElement('div');
    kidsUppercaseRow.className = 'toggle-row';
    kidsUppercaseRow.setAttribute('data-ft-control-row', 'true');
    kidsUppercaseRow.setAttribute('data-ft-search', 'uppercase title filter');

    const kidsUppercaseInfo = document.createElement('div');
    kidsUppercaseInfo.className = 'toggle-info';

    const kidsUppercaseTitle = document.createElement('div');
    kidsUppercaseTitle.className = 'toggle-title';
    kidsUppercaseTitle.textContent = 'UPPERCASE Title Filter';

    kidsUppercaseInfo.appendChild(kidsUppercaseTitle);

    const kidsUppercaseControls = document.createElement('div');
    kidsUppercaseControls.className = 'video-filter-inline-controls';

    const kidsUppercaseModeSelect = document.createElement('select');
    kidsUppercaseModeSelect.id = 'kidsVideoFilter_uppercase_mode';
    kidsUppercaseModeSelect.className = 'select-input video-filter-mode-select';
    kidsUppercaseModeSelect.innerHTML = `
        <option value="single_word">Single uppercase word</option>
        <option value="all_caps">All caps title</option>
        <option value="both">Both</option>
    `;

    const kidsUppercaseToggle = document.createElement('label');
    kidsUppercaseToggle.className = 'switch';

    const kidsUppercaseCheckbox = document.createElement('input');
    kidsUppercaseCheckbox.type = 'checkbox';
    kidsUppercaseCheckbox.id = 'kidsVideoFilter_uppercase_enabled';

    const kidsUppercaseSlider = document.createElement('span');
    kidsUppercaseSlider.className = 'slider round';

    kidsUppercaseToggle.appendChild(kidsUppercaseCheckbox);
    kidsUppercaseToggle.appendChild(kidsUppercaseSlider);

    kidsUppercaseControls.appendChild(kidsUppercaseModeSelect);
    kidsUppercaseControls.appendChild(kidsUppercaseToggle);

    kidsUppercaseRow.appendChild(kidsUppercaseInfo);
    kidsUppercaseRow.appendChild(kidsUppercaseControls);
    kidsVideoFiltersRows.appendChild(kidsUppercaseRow);

    kidsVideoFiltersSection.appendChild(kidsVideoFiltersRows);
    kidsContentTab.appendChild(kidsVideoFiltersSection);

    const categoryOptions = [
        { label: 'Film & Animation', color: '#ef4444' },
        { label: 'Autos & Vehicles', color: '#f97316' },
        { label: 'Music', color: '#f59e0b' },
        { label: 'Pets & Animals', color: '#84cc16' },
        { label: 'Sports', color: '#22c55e' },
        { label: 'Travel & Events', color: '#14b8a6' },
        { label: 'Gaming', color: '#0ea5e9' },
        { label: 'People & Blogs', color: '#3b82f6' },
        { label: 'Comedy', color: '#6366f1' },
        { label: 'Entertainment', color: '#8b5cf6' },
        { label: 'News & Politics', color: '#a855f7' },
        { label: 'Howto & Style', color: '#ec4899' },
        { label: 'Education', color: '#f43f5e' },
        { label: 'Science & Technology', color: '#64748b' },
        { label: 'Nonprofits & Activism', color: '#10b981' }
    ];

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

    const kidsCategorySection = document.createElement('div');
    kidsCategorySection.className = 'content-control-group category-filters-section';
    kidsCategorySection.style.marginTop = '20px';
    kidsCategorySection.style.borderTop = '1px solid var(--ft-color-sem-neutral-border)';
    kidsCategorySection.setAttribute('data-ft-control-group', 'true');
    kidsCategorySection.setAttribute('data-ft-group-title', 'Kids Category Filters');

    const kidsCategoryHeader = document.createElement('div');
    kidsCategoryHeader.className = 'content-control-group__header';

    const kidsCategoryTitle = document.createElement('div');
    kidsCategoryTitle.className = 'content-control-group__title';
    kidsCategoryTitle.textContent = 'Category Filters';

    kidsCategoryHeader.appendChild(kidsCategoryTitle);
    kidsCategorySection.appendChild(kidsCategoryHeader);

    const kidsCategoryRows = document.createElement('div');
    kidsCategoryRows.className = 'content-control-group__rows';

    const kidsCategoryMainRow = document.createElement('div');
    kidsCategoryMainRow.className = 'toggle-row';
    kidsCategoryMainRow.setAttribute('data-ft-control-row', 'true');
    kidsCategoryMainRow.setAttribute('data-ft-search', 'category filter');

    const kidsCategoryInfo = document.createElement('div');
    kidsCategoryInfo.className = 'toggle-info';

    const kidsCategoryInfoTitle = document.createElement('div');
    kidsCategoryInfoTitle.className = 'toggle-title';
    kidsCategoryInfoTitle.textContent = 'Category Filter';

    kidsCategoryInfo.appendChild(kidsCategoryInfoTitle);

    const kidsCategoryControls = document.createElement('div');
    kidsCategoryControls.className = 'ft-category-controls';

    const kidsCategoryModeOptions = [
        { value: 'block', label: 'Block selected' },
        { value: 'allow', label: 'Allow only selected' }
    ];

    const kidsCategoryMode = UIComponents.createSelect({
        id: 'kidsCategoryFilter_mode',
        options: kidsCategoryModeOptions,
        value: 'block'
    });

    const kidsCategoryToggle = document.createElement('label');
    kidsCategoryToggle.className = 'switch';

    const kidsCategoryEnabled = document.createElement('input');
    kidsCategoryEnabled.type = 'checkbox';
    kidsCategoryEnabled.id = 'kidsCategoryFilter_enabled';

    const kidsCategorySlider = document.createElement('span');
    kidsCategorySlider.className = 'slider round';

    kidsCategoryToggle.appendChild(kidsCategoryEnabled);
    kidsCategoryToggle.appendChild(kidsCategorySlider);

    kidsCategoryControls.appendChild(kidsCategoryMode);
    kidsCategoryControls.appendChild(kidsCategoryToggle);

    kidsCategoryMainRow.appendChild(kidsCategoryInfo);
    kidsCategoryMainRow.appendChild(kidsCategoryControls);
    kidsCategoryRows.appendChild(kidsCategoryMainRow);

    const kidsCategoryPanel = document.createElement('div');
    kidsCategoryPanel.className = 'ft-category-panel';
    kidsCategoryPanel.id = 'kidsCategoryFilter_panel';

    const kidsCategorySearch = document.createElement('input');
    kidsCategorySearch.type = 'text';
    kidsCategorySearch.className = 'search-input ft-category-search';
    kidsCategorySearch.id = 'kidsCategoryFilter_search';
    kidsCategorySearch.placeholder = 'Search categories...';
    kidsCategoryPanel.appendChild(kidsCategorySearch);

    const kidsCategoryList = document.createElement('div');
    kidsCategoryList.className = 'ft-category-options';
    kidsCategoryList.id = 'kidsCategoryFilter_list';
    kidsCategoryPanel.appendChild(kidsCategoryList);
    kidsCategoryRows.appendChild(kidsCategoryPanel);

    kidsCategorySection.appendChild(kidsCategoryRows);
    kidsContentTab.appendChild(kidsCategorySection);

    let kidsCategorySelected = [];
    let isApplyingKidsUi = false;
    let pendingKidsSaveTimer = 0;
    let pendingKidsCategorySaveTimer = 0;

    function normalizeSelectedArray(arr) {
        const list = Array.isArray(arr) ? arr : [];
        const out = [];
        const seen = new Set();
        list.forEach((v) => {
            const label = String(v || '').trim();
            if (!label) return;
            const key = label.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(label);
        });
        return out;
    }

    function updateKidsCategorySelection(label, isChecked) {
        const normalized = String(label || '').trim();
        if (!normalized) return;
        const existingKey = normalized.toLowerCase();
        const next = [];
        let found = false;
        kidsCategorySelected.forEach((v) => {
            const vv = String(v || '').trim();
            if (!vv) return;
            if (vv.toLowerCase() === existingKey) {
                found = true;
                if (isChecked) next.push(vv);
                return;
            }
            next.push(vv);
        });
        if (isChecked && !found) {
            next.push(normalized);
        }
        kidsCategorySelected = normalizeSelectedArray(next);
    }

    function renderKidsCategoryList(listEl, selected = [], searchValue = '') {
        if (!listEl) return;
        const needle = typeof searchValue === 'string' ? searchValue.trim().toLowerCase() : '';
        const selectedSet = new Set((Array.isArray(selected) ? selected : []).map(v => String(v || '').trim().toLowerCase()).filter(Boolean));
        listEl.innerHTML = '';

        const filtered = categoryOptions.filter(opt => {
            if (!needle) return true;
            const label = String(opt?.label || '').toLowerCase();
            return label.includes(needle);
        });

        filtered.forEach(opt => {
            const label = String(opt?.label || '').trim();
            if (!label) return;

            const key = label.toLowerCase();
            const isActive = selectedSet.has(key);

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'ft-category-pill';
            pill.style.setProperty('--ft-category-color', opt?.color || '');
            pill.style.setProperty('--ft-category-color-bg', hexToRgba(opt?.color || '', 0.12));
            pill.style.setProperty('--ft-category-color-border', hexToRgba(opt?.color || '', 0.55));
            pill.style.setProperty('--ft-category-color-bg-active', hexToRgba(opt?.color || '', 0.16));
            pill.setAttribute('data-ft-category', 'true');
            pill.setAttribute('data-ft-category-label', label);
            pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            pill.classList.toggle('active', isActive);

            pill.addEventListener('click', () => {
                const nextActive = pill.getAttribute('aria-pressed') !== 'true';
                pill.setAttribute('aria-pressed', nextActive ? 'true' : 'false');
                pill.classList.toggle('active', nextActive);
                updateKidsCategorySelection(label, nextActive);
                scheduleSaveKidsCategoryFilters({ showToast: false });
            });

            const swatch = document.createElement('span');
            swatch.className = 'ft-category-swatch';

            const text = document.createElement('span');
            text.className = 'ft-category-label';
            text.textContent = label;

            pill.appendChild(swatch);
            pill.appendChild(text);
            listEl.appendChild(pill);
        });
    }

    function updateKidsCategoryUi() {
        if (kidsCategoryPanel) kidsCategoryPanel.style.display = kidsCategoryEnabled?.checked ? 'block' : 'none';
        if (kidsCategoryMode) kidsCategoryMode.disabled = !kidsCategoryEnabled?.checked;
    }

    function applyKidsCategoryFiltersToUI(categoryFilters = {}) {
        isApplyingKidsUi = true;
        if (kidsCategoryEnabled) kidsCategoryEnabled.checked = !!categoryFilters.enabled;
        if (kidsCategoryMode) {
            kidsCategoryMode.value = categoryFilters.mode === 'allow' ? 'allow' : 'block';
            kidsCategoryMode.dispatchEvent(new Event('input', { bubbles: true }));
        }
        kidsCategorySelected = normalizeSelectedArray(categoryFilters.selected || []);
        renderKidsCategoryList(kidsCategoryList, kidsCategorySelected, kidsCategorySearch?.value || '');
        updateKidsCategoryUi();
        isApplyingKidsUi = false;
    }

    function scheduleSaveKidsCategoryFilters(options = {}) {
        if (isApplyingKidsUi) return;
        if (pendingKidsCategorySaveTimer) {
            clearTimeout(pendingKidsCategorySaveTimer);
        }
        pendingKidsCategorySaveTimer = setTimeout(() => {
            pendingKidsCategorySaveTimer = 0;
            saveKidsCategoryFilters(options);
        }, 250);
    }

    function saveKidsCategoryFilters(options = {}) {
        if (isApplyingKidsUi) return;
        const showToast = options?.showToast === true;
        const next = {
            enabled: !!kidsCategoryEnabled?.checked,
            mode: kidsCategoryMode?.value === 'allow' ? 'allow' : 'block',
            selected: normalizeSelectedArray(kidsCategorySelected)
        };

        StateManager.updateKidsCategoryFilters(next)
            .then(() => {
                if (showToast) UIComponents.showToast('Kids category filters saved', 'success');
            })
            .catch(() => {
                if (showToast) UIComponents.showToast('Failed to save kids category filters', 'error');
            });
    }

    function updateKidsVideoFilterUI() {
        const showDurationControls = !!kidsDurationCheckbox?.checked;
        const showUploadControls = !!kidsUploadDateCheckbox?.checked;
        const showUppercaseControls = !!kidsUppercaseCheckbox?.checked;

        if (kidsDurationConditionsRow) kidsDurationConditionsRow.style.display = showDurationControls ? 'block' : 'none';
        if (kidsUploadDateConditionsRow) kidsUploadDateConditionsRow.style.display = showUploadControls ? 'block' : 'none';

        const uppercaseModeMenu = kidsUppercaseModeSelect?.closest('.ft-select-menu') || null;
        if (uppercaseModeMenu) {
            uppercaseModeMenu.style.display = showUppercaseControls ? 'inline-flex' : 'none';
        } else if (kidsUppercaseModeSelect) {
            kidsUppercaseModeSelect.style.display = showUppercaseControls ? 'inline-block' : 'none';
        }
        if (kidsUppercaseModeSelect) {
            kidsUppercaseModeSelect.disabled = !showUppercaseControls;
        }

        const durationRadios = document.querySelectorAll('input[name="kidsVideoFilter_duration_condition"]');
        durationRadios.forEach(radio => {
            const option = radio.closest('.video-filter-compact-option');
            const inputs = option?.querySelectorAll('input[type="number"], select') || [];
            inputs.forEach(input => input.disabled = !radio.checked);
        });

        const uploadRadios = document.querySelectorAll('input[name="kidsVideoFilter_uploadDate_condition"]');
        uploadRadios.forEach(radio => {
            const option = radio.closest('.video-filter-compact-option');
            const inputs = option?.querySelectorAll('input[type="number"], select') || [];
            inputs.forEach(input => input.disabled = !radio.checked);
        });
    }

    function maybeSelectKidsOptionRadioFromElement(element) {
        if (isApplyingKidsUi) return false;
        const option = element?.closest?.('.video-filter-compact-option') || null;
        if (!option) return false;
        const radio = option.querySelector('.video-filter-compact-radio');
        if (!radio || radio.checked) return false;
        radio.checked = true;
        updateKidsVideoFilterUI();
        return true;
    }

    function computeSignature(next) {
        try {
            return JSON.stringify(next || {});
        } catch (e) {
            return '';
        }
    }

    let lastSavedKidsVideoFiltersSignature = '';
    let lastKidsVideoFiltersToastTs = 0;

    function scheduleSaveKidsVideoFilters(options = {}) {
        if (isApplyingKidsUi) return;
        if (pendingKidsSaveTimer) {
            clearTimeout(pendingKidsSaveTimer);
        }
        pendingKidsSaveTimer = setTimeout(() => {
            pendingKidsSaveTimer = 0;
            saveKidsVideoFilters(options);
        }, 300);
    }

    function saveKidsVideoFilters(options = {}) {
        if (isApplyingKidsUi) return;
        const showToast = options?.showToast === true;
        const state = StateManager.getState();
        const prior = state?.kids?.contentFilters || {};

        const durationCondition = document.querySelector('input[name="kidsVideoFilter_duration_condition"]:checked')?.value || (prior.duration?.condition || 'between');
        const uploadCondition = document.querySelector('input[name="kidsVideoFilter_uploadDate_condition"]:checked')?.value || (prior.uploadDate?.condition || 'newer');

        const durationEnabled = document.getElementById('kidsVideoFilter_duration_enabled')?.checked || false;
        const uploadEnabled = document.getElementById('kidsVideoFilter_uploadDate_enabled')?.checked || false;
        const uppercaseEnabled = document.getElementById('kidsVideoFilter_uppercase_enabled')?.checked || false;
        const uppercaseMode = document.getElementById('kidsVideoFilter_uppercase_mode')?.value || (prior.uppercase?.mode || 'single_word');

        const durationLongerValueRaw = document.getElementById('kidsVideoFilter_duration_longer_value')?.value;
        const durationShorterValueRaw = document.getElementById('kidsVideoFilter_duration_shorter_value')?.value;
        const durationBetweenMinRaw = document.getElementById('kidsVideoFilter_duration_between_min')?.value;
        const durationBetweenMaxRaw = document.getElementById('kidsVideoFilter_duration_between_max')?.value;

        const parsePositiveFloat = (value) => {
            if (value === null || value === undefined) return null;
            const num = parseFloat(String(value));
            return Number.isFinite(num) && num > 0 ? num : null;
        };

        const nextDuration = {
            ...(prior.duration || {}),
            enabled: durationEnabled,
            condition: durationCondition
        };

        if (durationCondition === 'longer') {
            const val = parsePositiveFloat(durationLongerValueRaw);
            if (val !== null) {
                nextDuration.minMinutes = val;
                nextDuration.maxMinutes = 0;
                nextDuration.value = String(val);
            }
        } else if (durationCondition === 'shorter') {
            const val = parsePositiveFloat(durationShorterValueRaw);
            if (val !== null) {
                nextDuration.minMinutes = val;
                nextDuration.maxMinutes = 0;
                nextDuration.value = String(val);
            }
        } else {
            const min = parsePositiveFloat(durationBetweenMinRaw);
            const max = parsePositiveFloat(durationBetweenMaxRaw);
            if (min !== null && max !== null) {
                const a = Math.min(min, max);
                const b = Math.max(min, max);
                nextDuration.minMinutes = a;
                nextDuration.maxMinutes = b;
                nextDuration.value = `${a}-${b}`;
            }
        }

        const unitMs = { days: 86400000, weeks: 604800000, months: 2592000000, years: 31536000000 };
        const now = Date.now();
        const uploadNewerRaw = document.getElementById('kidsVideoFilter_age_newer_value')?.value;
        const uploadNewerUnit = document.getElementById('kidsVideoFilter_age_newer_unit')?.value || (prior.uploadDate?.unit || 'days');
        const uploadOlderRaw = document.getElementById('kidsVideoFilter_age_older_value')?.value;
        const uploadOlderUnit = document.getElementById('kidsVideoFilter_age_older_unit')?.value || (prior.uploadDate?.unit || 'years');
        const uploadBetweenMinRaw = document.getElementById('kidsVideoFilter_age_between_min')?.value;
        const uploadBetweenMinUnit = document.getElementById('kidsVideoFilter_age_between_min_unit')?.value || (prior.uploadDate?.unit || 'months');
        const uploadBetweenMaxRaw = document.getElementById('kidsVideoFilter_age_between_max')?.value;
        const uploadBetweenMaxUnit = document.getElementById('kidsVideoFilter_age_between_max_unit')?.value || (prior.uploadDate?.unitMax || 'months');

        const nextUpload = {
            ...(prior.uploadDate || {}),
            enabled: uploadEnabled,
            condition: uploadCondition
        };

        if (uploadCondition === 'newer') {
            const val = parsePositiveFloat(uploadNewerRaw);
            if (val !== null) {
                nextUpload.value = String(val);
                nextUpload.unit = uploadNewerUnit;
                nextUpload.valueMax = 0;
                nextUpload.unitMax = '';
                const cutoff = now - val * (unitMs[uploadNewerUnit] || 0);
                nextUpload.fromDate = new Date(cutoff).toISOString();
                nextUpload.toDate = '';
            }
        } else if (uploadCondition === 'older') {
            const val = parsePositiveFloat(uploadOlderRaw);
            if (val !== null) {
                nextUpload.value = String(val);
                nextUpload.unit = uploadOlderUnit;
                nextUpload.valueMax = 0;
                nextUpload.unitMax = '';
                const cutoff = now - val * (unitMs[uploadOlderUnit] || 0);
                nextUpload.toDate = new Date(cutoff).toISOString();
                nextUpload.fromDate = '';
            }
        } else {
            const min = parsePositiveFloat(uploadBetweenMinRaw);
            const max = parsePositiveFloat(uploadBetweenMaxRaw);
            if (min !== null && max !== null) {
                nextUpload.value = String(min);
                nextUpload.unit = uploadBetweenMinUnit;
                nextUpload.valueMax = max;
                nextUpload.unitMax = uploadBetweenMaxUnit;
                const fromCutoff = now - min * (unitMs[uploadBetweenMinUnit] || 0);
                const toCutoff = now - max * (unitMs[uploadBetweenMaxUnit] || 0);
                nextUpload.fromDate = new Date(fromCutoff).toISOString();
                nextUpload.toDate = new Date(toCutoff).toISOString();
            }
        }

        const next = {
            duration: nextDuration,
            uploadDate: nextUpload,
            uppercase: { ...(prior.uppercase || {}), enabled: uppercaseEnabled, mode: uppercaseMode, minWordLength: 2 }
        };

        const nextSig = computeSignature(next);
        const priorSig = computeSignature(prior);
        if (nextSig === priorSig || (lastSavedKidsVideoFiltersSignature && nextSig === lastSavedKidsVideoFiltersSignature)) {
            return;
        }
        lastSavedKidsVideoFiltersSignature = nextSig;

        StateManager.updateKidsContentFilters(next)
            .then(() => {
                if (!showToast) return;
                const ts = Date.now();
                if (ts - lastKidsVideoFiltersToastTs < 800) return;
                lastKidsVideoFiltersToastTs = ts;
                UIComponents.showToast('Kids video filters saved', 'success');
            })
            .catch(() => {
                if (showToast) UIComponents.showToast('Failed to save kids video filters', 'error');
            });
    }

    function applyKidsVideoFiltersToUI(contentFilters = {}) {
        isApplyingKidsUi = true;
        const durationEnabled = document.getElementById('kidsVideoFilter_duration_enabled');
        const uploadEnabled = document.getElementById('kidsVideoFilter_uploadDate_enabled');
        const uppercaseEnabled = document.getElementById('kidsVideoFilter_uppercase_enabled');
        const uppercaseMode = document.getElementById('kidsVideoFilter_uppercase_mode');

        if (durationEnabled) durationEnabled.checked = !!contentFilters.duration?.enabled;
        if (uploadEnabled) uploadEnabled.checked = !!contentFilters.uploadDate?.enabled;
        if (uppercaseEnabled) uppercaseEnabled.checked = !!contentFilters.uppercase?.enabled;

        const durationCondition = contentFilters.duration?.condition || 'between';
        const durationRadio = document.getElementById(`kidsVideoFilter_duration_condition_${durationCondition}`);
        if (durationRadio) durationRadio.checked = true;
        const longerInput = document.getElementById('kidsVideoFilter_duration_longer_value');
        const shorterInput = document.getElementById('kidsVideoFilter_duration_shorter_value');
        const betweenMinInput = document.getElementById('kidsVideoFilter_duration_between_min');
        const betweenMaxInput = document.getElementById('kidsVideoFilter_duration_between_max');
        if (longerInput) longerInput.value = durationCondition === 'longer' ? (contentFilters.duration?.minMinutes ?? '') : '';
        if (shorterInput) shorterInput.value = durationCondition === 'shorter' ? (contentFilters.duration?.minMinutes ?? '') : '';
        if (betweenMinInput) betweenMinInput.value = durationCondition === 'between' ? (contentFilters.duration?.minMinutes ?? '') : '';
        if (betweenMaxInput) betweenMaxInput.value = durationCondition === 'between' ? (contentFilters.duration?.maxMinutes ?? '') : '';

        const uploadCondition = contentFilters.uploadDate?.condition || 'newer';
        const uploadRadio = document.getElementById(`kidsVideoFilter_uploadDate_condition_${uploadCondition}`);
        if (uploadRadio) uploadRadio.checked = true;
        const newerInput = document.getElementById('kidsVideoFilter_age_newer_value');
        const olderInput = document.getElementById('kidsVideoFilter_age_older_value');
        const betweenMin = document.getElementById('kidsVideoFilter_age_between_min');
        const betweenMax = document.getElementById('kidsVideoFilter_age_between_max');
        if (newerInput) newerInput.value = uploadCondition === 'newer' ? (contentFilters.uploadDate?.value || '') : '';
        if (olderInput) olderInput.value = uploadCondition === 'older' ? (contentFilters.uploadDate?.value || '') : '';
        if (betweenMin) betweenMin.value = uploadCondition === 'between' ? (contentFilters.uploadDate?.value || '') : '';
        if (betweenMax) betweenMax.value = uploadCondition === 'between' ? (contentFilters.uploadDate?.valueMax || '') : '';

        const newerUnit = document.getElementById('kidsVideoFilter_age_newer_unit');
        const olderUnit = document.getElementById('kidsVideoFilter_age_older_unit');
        const betweenMinUnit = document.getElementById('kidsVideoFilter_age_between_min_unit');
        const betweenMaxUnit = document.getElementById('kidsVideoFilter_age_between_max_unit');
        if (newerUnit) {
            newerUnit.value = contentFilters.uploadDate?.unit || 'days';
            newerUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (olderUnit) {
            olderUnit.value = contentFilters.uploadDate?.unit || 'years';
            olderUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (betweenMinUnit) {
            betweenMinUnit.value = contentFilters.uploadDate?.unit || 'months';
            betweenMinUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (betweenMaxUnit) {
            betweenMaxUnit.value = contentFilters.uploadDate?.unitMax || 'months';
            betweenMaxUnit.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (uppercaseMode) {
            uppercaseMode.value = contentFilters.uppercase?.mode || 'single_word';
            uppercaseMode.dispatchEvent(new Event('input', { bubbles: true }));
        }

        updateKidsVideoFilterUI();
        isApplyingKidsUi = false;
    }

    function filterKidsContentControls() {
        const q = (kidsContentControlsSearch?.value || '').trim().toLowerCase();
        const groups = kidsContentTab.querySelectorAll('[data-ft-control-group]');
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

    kidsContentControlsSearch.addEventListener('input', () => {
        filterKidsContentControls();
    });

    kidsDurationCheckbox.addEventListener('change', () => {
        updateKidsVideoFilterUI();
        scheduleSaveKidsVideoFilters({ showToast: true });
    });
    kidsUploadDateCheckbox.addEventListener('change', () => {
        updateKidsVideoFilterUI();
        scheduleSaveKidsVideoFilters({ showToast: true });
    });
    kidsUppercaseCheckbox.addEventListener('change', () => {
        updateKidsVideoFilterUI();
        scheduleSaveKidsVideoFilters({ showToast: true });
    });
    kidsUppercaseModeSelect.addEventListener('change', () => scheduleSaveKidsVideoFilters({ showToast: true }));

    kidsCategoryEnabled.addEventListener('change', () => {
        updateKidsCategoryUi();
        scheduleSaveKidsCategoryFilters({ showToast: true });
    });
    kidsCategoryMode.addEventListener('change', () => {
        updateKidsCategoryUi();
        scheduleSaveKidsCategoryFilters({ showToast: true });
    });
    kidsCategorySearch.addEventListener('input', () => {
        renderKidsCategoryList(kidsCategoryList, kidsCategorySelected, kidsCategorySearch.value || '');
    });

    document.querySelectorAll('input[name="kidsVideoFilter_duration_condition"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateKidsVideoFilterUI();
            scheduleSaveKidsVideoFilters({ showToast: true });
        });
    });
    document.querySelectorAll('input[name="kidsVideoFilter_uploadDate_condition"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateKidsVideoFilterUI();
            scheduleSaveKidsVideoFilters({ showToast: true });
        });
    });

    kidsContentTab.querySelectorAll('.video-filter-compact-option').forEach(option => {
        option.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
                return;
            }
            const radio = option.querySelector('.video-filter-compact-radio');
            if (radio && !radio.disabled) {
                radio.checked = true;
                updateKidsVideoFilterUI();
                scheduleSaveKidsVideoFilters({ showToast: false });
            }
        });
    });

    kidsContentTab.querySelectorAll('.video-filter-compact-option input[type="number"], .video-filter-compact-option select').forEach(el => {
        el.addEventListener('focus', (e) => {
            if (maybeSelectKidsOptionRadioFromElement(e.target)) {
                scheduleSaveKidsVideoFilters({ showToast: false });
            }
        });
        el.addEventListener('click', (e) => {
            if (maybeSelectKidsOptionRadioFromElement(e.target)) {
                scheduleSaveKidsVideoFilters({ showToast: false });
            }
        });
        el.addEventListener('input', (e) => {
            maybeSelectKidsOptionRadioFromElement(e.target);
            scheduleSaveKidsVideoFilters({ showToast: false });
        });
        el.addEventListener('change', (e) => {
            maybeSelectKidsOptionRadioFromElement(e.target);
            scheduleSaveKidsVideoFilters({ showToast: true });
        });
    });

    const tabs = UIComponents.createTabs({
        tabs: [
            { id: 'kidsKeywords', label: 'Keyword Management', content: kidsKeywordsContent },
            { id: 'kidsChannels', label: 'Channel Management', content: kidsChannelsContent },
            { id: 'kidsContent', label: 'Content Controls', content: kidsContentTab }
        ],
        defaultTab: 'kidsKeywords'
    });

    container.appendChild(tabs.container);

    try {
        const createDropdownFromSelect = window.UIComponents?.createDropdownFromSelect;
        if (typeof createDropdownFromSelect === 'function') {
            [
                'kidsVideoFilter_age_newer_unit',
                'kidsVideoFilter_age_older_unit',
                'kidsVideoFilter_age_between_min_unit',
                'kidsVideoFilter_age_between_max_unit',
                'kidsVideoFilter_uppercase_mode',
                'kidsCategoryFilter_mode'
            ].forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.tagName === 'SELECT') {
                    createDropdownFromSelect(el);
                }
            });
        }
    } catch (e) {
    }

    try {
        const state = StateManager.getState();
        applyKidsVideoFiltersToUI(state?.kids?.contentFilters || {});
        applyKidsCategoryFiltersToUI(state?.kids?.categoryFilters || {});
    } catch (e) {
    }

    StateManager.subscribe((eventType, data) => {
        if (eventType === 'kidsContentFiltersUpdated') {
            applyKidsVideoFiltersToUI(data?.contentFilters || {});
        }
        if (eventType === 'kidsCategoryFiltersUpdated') {
            applyKidsCategoryFiltersToUI(data?.categoryFilters || {});
        }
    });
}
// Expose for safety in case other modules call it
window.initializeKidsTabs = initializeKidsTabs;

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

const runtimeAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : (typeof chrome !== 'undefined' ? chrome : null);
const IS_FIREFOX_TAB_VIEW = typeof browser !== 'undefined' && !!browser.runtime;
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
        'sync': 'sync',
        'nanah': 'sync',
        'nanahsync': 'sync',
        'whatsnew': 'whatsnew',
        'whats-new': 'whatsnew',
        'help': 'help',
        'donate': 'donate',
        'support': 'donate'
    };
    const resolved = viewMap[normalized] || null;
    if (resolved === 'semantic' && !FILTERTUBE_SEMANTIC_ML_ENABLED) {
        return 'filters';
    }
    return resolved;
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
    try {
        const searchParams = new URLSearchParams(window.location.search || '');
        const section = (searchParams.get('section') || '').toLowerCase();
        const flow = (searchParams.get('flow') || '').toLowerCase();
        if (viewId === 'filters' && section) {
            try {
                const tabs = document.querySelector('#filtersView .tab-buttons') || document.querySelector('.tab-buttons');
                const keywordsTabBtn = tabs?.querySelector('[data-tab-id="keywords"]');
                const channelsTabBtn = tabs?.querySelector('[data-tab-id="channels"]');
                const contentTabBtn = tabs?.querySelector('[data-tab-id="content"]');
                if (section === 'channels' || section === 'channel' || section === 'channelmanagement') {
                    channelsTabBtn?.click();
                } else if (section === 'keywords' || section === 'keyword' || section === 'keywordmanagement') {
                    keywordsTabBtn?.click();
                } else if (contentTabBtn) {
                    contentTabBtn.click();
                }
            } catch (e) {
            }
            if ((section === 'channels' || section === 'channel' || section === 'channelmanagement') && flow === 'import-subscriptions') {
                const target = document.getElementById('importSubscriptionsBtn')
                    || document.getElementById('importSubscriptionsNotice')
                    || document.getElementById('channelInput');
                if (target) {
                    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }
            }
            if (section === 'categories' || section === 'category' || section === 'categoryfilters') {
                const target = document.getElementById('categoryFiltersSection');
                if (target) {
                    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }
            }
            if (section === 'feeds' || section === 'feed') {
                const target = document.getElementById('feedControlsSection');
                if (target) {
                    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }
            }
        }
        if (viewId === 'kids' && section) {
            if (section === 'content' || section === 'contentcontrols' || section === 'content-controls') {
                try {
                    const tabs = document.querySelector('#kidsView .tab-buttons') || document.querySelector('.tab-buttons');
                    const kidsContentTabBtn = tabs?.querySelector('[data-tab-id="kidsContent"]');
                    if (kidsContentTabBtn) {
                        kidsContentTabBtn.click();
                    }
                } catch (e) {
                }
                const target = document.getElementById('kidsContentControlsSection');
                if (target) {
                    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                }
            }
        }
    } catch (e) {
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
    initializeResponsiveNav();
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
    const importSubscriptionsNotice = document.getElementById('importSubscriptionsNotice');
    const importSubscriptionsBtn = document.getElementById('importSubscriptionsBtn');
    const importSubscriptionsStatus = document.getElementById('importSubscriptionsStatus');
    const importSubscriptionsActions = document.getElementById('importSubscriptionsActions');
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
    const settingAutoBackupEnabled = document.getElementById('setting_autoBackupEnabled');
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
    const ftImportSyncDeviceBtn = document.getElementById('ftImportSyncDeviceBtn');

    const ftProfilesManager = document.getElementById('ftProfilesManager');
    const ftCreateAccountBtn = document.getElementById('ftCreateAccountBtn');
    const ftCreateChildBtn = document.getElementById('ftCreateChildBtn');
    const ftSetMasterPinBtn = document.getElementById('ftSetMasterPinBtn');
    const ftClearMasterPinBtn = document.getElementById('ftClearMasterPinBtn');

    const ftAllowAccountCreation = document.getElementById('ftAllowAccountCreation');
    const ftMaxAccounts = document.getElementById('ftMaxAccounts');

    const ftNanahDeviceLabel = document.getElementById('ftNanahDeviceLabel');
    const ftNanahModeSendOnce = document.getElementById('ftNanahModeSendOnce');
    const ftNanahModeParent = document.getElementById('ftNanahModeParent');
    const ftNanahModeFull = document.getElementById('ftNanahModeFull');
    const ftNanahChildBanner = document.getElementById('ftNanahChildBanner');
    const ftNanahChildBannerTitle = document.getElementById('ftNanahChildBannerTitle');
    const ftNanahChildBannerBody = document.getElementById('ftNanahChildBannerBody');
    const ftNanahModeSpotlight = document.getElementById('ftNanahModeSpotlight');
    const ftNanahModeEyebrow = document.getElementById('ftNanahModeEyebrow');
    const ftNanahModeTitle = document.getElementById('ftNanahModeTitle');
    const ftNanahModeBody = document.getElementById('ftNanahModeBody');
    const ftNanahModeSteps = document.getElementById('ftNanahModeSteps');
    const ftNanahAdvancedDetails = document.getElementById('ftNanahAdvancedDetails');
    const ftNanahAdvancedSummary = document.getElementById('ftNanahAdvancedSummary');
    const ftNanahRemoteTargetField = document.getElementById('ftNanahRemoteTargetField');
    const ftNanahRole = document.getElementById('ftNanahRole');
    const ftNanahScope = document.getElementById('ftNanahScope');
    const ftNanahStrategy = document.getElementById('ftNanahStrategy');
    const ftNanahRemoteTarget = document.getElementById('ftNanahRemoteTarget');
    const ftNanahStrategyLabel = document.getElementById('ftNanahStrategyLabel');
    const ftNanahStrategyHint = document.getElementById('ftNanahStrategyHint');
    const ftNanahRemoteTargetHint = document.getElementById('ftNanahRemoteTargetHint');
    const ftNanahActions = document.querySelector('.nanah-sync-actions');
    const ftNanahHostBtn = document.getElementById('ftNanahHostBtn');
    const ftNanahSendBtn = document.getElementById('ftNanahSendBtn');
    const ftNanahTrustBtn = document.getElementById('ftNanahTrustBtn');
    const ftNanahEndSessionBtn = document.getElementById('ftNanahEndSessionBtn');
    const ftNanahStatusCard = document.getElementById('ftNanahStatusCard');
    const ftNanahStage = document.getElementById('ftNanahStage');
    const ftNanahLocalProfile = document.getElementById('ftNanahLocalProfile');
    const ftNanahRemoteLabel = document.getElementById('ftNanahRemoteLabel');
    const ftNanahRemoteProfile = document.getElementById('ftNanahRemoteProfile');
    const ftNanahPairCodeRow = document.getElementById('ftNanahPairCodeRow');
    const ftNanahPairCode = document.getElementById('ftNanahPairCode');
    const ftNanahSasPhrase = document.getElementById('ftNanahSasPhrase');
    const ftNanahStatusHint = document.getElementById('ftNanahStatusHint');
    const ftNanahTargetHint = document.getElementById('ftNanahTargetHint');
    const ftNanahConfirmSasBtn = document.getElementById('ftNanahConfirmSasBtn');
    const ftNanahJoinCode = document.getElementById('ftNanahJoinCode');
    const ftNanahJoinBtn = document.getElementById('ftNanahJoinBtn');
    const ftNanahPairUri = document.getElementById('ftNanahPairUri');
    const ftNanahCopyPairUriBtn = document.getElementById('ftNanahCopyPairUriBtn');
    const ftNanahQrCanvas = document.getElementById('ftNanahQrCanvas');
    const ftNanahQrCaption = document.getElementById('ftNanahQrCaption');
    const ftNanahTrustedLinks = document.getElementById('ftNanahTrustedLinks');

    const openKofiBtn = document.getElementById('openKofiBtn');
    const dashboardDonateBtn = document.getElementById('dashboardDonateBtn');

    // State for search/sort
    let keywordSearchValue = '';
    let keywordSortValue = 'newest';
    let channelSearchValue = '';
    let channelSortValue = 'newest';

    let keywordDateFromTs = null;
    let keywordDateToTs = null;
    let channelDateFromTs = null;
    let channelDateToTs = null;
    let preferredSubscriptionsImportTabId = Number.parseInt(new URLSearchParams(window.location.search || '').get('sourceTabId') || '', 10);
    let subscriptionsImportFlowConsumed = false;
    let subscriptionsImportState = {
        phase: 'idle',
        tone: 'idle',
        title: '',
        message: '',
        meta: '',
        requestId: '',
        sourceTabId: null,
        inProgress: false,
        canEnableWhitelist: false
    };

    if (ftProfileDropdownTab && ftProfileDropdownTab.parentNode !== document.body) {
        document.body.appendChild(ftProfileDropdownTab);
        ftProfileDropdownTab.style.position = 'fixed';
        ftProfileDropdownTab.style.top = '0';
        ftProfileDropdownTab.style.left = '0';
        ftProfileDropdownTab.style.right = 'auto';
        ftProfileDropdownTab.style.zIndex = '2200';
    }

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

    if (dashboardDonateBtn) {
        dashboardDonateBtn.addEventListener('click', () => {
            try {
                if (typeof window.switchView === 'function') {
                    window.switchView('donate');
                }
            } catch (error) {
                console.warn('Tab-View: failed to switch to donate view', error);
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
                'videoFilter_age_newer_unit',
                'videoFilter_age_older_unit',
                'videoFilter_age_between_min_unit',
                'videoFilter_age_between_max_unit',
                'videoFilter_uppercase_mode',
                'categoryFilter_mode',
                'ftAutoBackupMode',
                'ftAutoBackupFormat',
                'ftNanahRole',
                'ftNanahScope',
                'ftNanahStrategy',
                'ftNanahRemoteTarget'
            ].forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.tagName === 'SELECT') {
                    createDropdownFromSelect(el, {
                        className: id.startsWith('ftNanah') ? 'nanah-select-menu' : ''
                    });
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
    const NANAH_TRUSTED_LINKS_KEY = 'ftNanahTrustedLinks';
    const NANAH_DEVICE_ID_KEY = 'ftNanahDeviceId';
    const NANAH_DEVICE_LABEL_KEY = 'ftNanahDeviceLabel';
    const NANAH_UI_MODE_KEY = 'ftNanahUiMode';
    let nanahClient = null;
    let nanahTrustedLinks = [];
    let nanahStableDeviceId = '';
    let nanahUiMode = 'send_once';
    let isApplyingNanahModePreset = false;
    let nanahTrustedReconnectApprovalPromise = null;
    let nanahSessionState = {
        stage: 'idle',
        code: '',
        pairUri: '',
        sasPhrase: '',
        sasConfirmed: false,
        connected: false,
        remoteDevice: null,
        remoteProfile: null,
        remoteProfileInventory: [],
        remoteTargetProfile: null,
        remoteRole: 'peer',
        helloSent: false,
        trustedReconnectApproved: false,
        trustedReconnectDeviceId: ''
    };

    let lockGateEl = null;

    const LOCK_ALLOWED_VIEWS = new Set(['help', 'whatsnew', 'donate']);

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

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function pluralize(count, singular, plural = `${singular}s`) {
        return count === 1 ? singular : plural;
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function queryBrowserTabs(queryInfo = {}) {
        return new Promise((resolve) => {
            try {
                if (!runtimeAPI?.tabs?.query) {
                    resolve([]);
                    return;
                }

                const maybePromise = runtimeAPI.tabs.query(queryInfo, (tabs) => {
                    const err = runtimeAPI.runtime?.lastError;
                    if (err) {
                        resolve([]);
                        return;
                    }
                    resolve(Array.isArray(tabs) ? tabs : []);
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then((tabs) => resolve(Array.isArray(tabs) ? tabs : [])).catch(() => resolve([]));
                }
            } catch (e) {
                resolve([]);
            }
        });
    }

    async function createBrowserTab(createProperties) {
        return new Promise((resolve) => {
            try {
                if (!runtimeAPI?.tabs?.create) {
                    resolve(null);
                    return;
                }

                const maybePromise = runtimeAPI.tabs.create(createProperties, (tab) => {
                    const err = runtimeAPI.runtime?.lastError;
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(tab || null);
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then((tab) => resolve(tab || null)).catch(() => resolve(null));
                }
            } catch (e) {
                resolve(null);
            }
        });
    }

    async function updateBrowserTab(tabId, updateProperties) {
        return new Promise((resolve) => {
            try {
                if (!runtimeAPI?.tabs?.update || !Number.isFinite(tabId)) {
                    resolve(null);
                    return;
                }

                const maybePromise = runtimeAPI.tabs.update(tabId, updateProperties, (tab) => {
                    const err = runtimeAPI.runtime?.lastError;
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(tab || null);
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then((tab) => resolve(tab || null)).catch(() => resolve(null));
                }
            } catch (e) {
                resolve(null);
            }
        });
    }

    async function getActiveBrowserTab() {
        const activeTabs = await queryBrowserTabs({
            active: true,
            lastFocusedWindow: true
        });
        return Array.isArray(activeTabs) && activeTabs.length > 0
            ? activeTabs[0]
            : null;
    }

    async function sendMessageToBrowserTab(tabId, payload) {
        return new Promise((resolve) => {
            try {
                if (!runtimeAPI?.tabs?.sendMessage || !Number.isFinite(tabId)) {
                    resolve({
                        response: null,
                        errorCode: 'tab_api_unavailable',
                        errorMessage: 'Tab messaging unavailable'
                    });
                    return;
                }

                let settled = false;
                const finish = (value) => {
                    if (settled) return;
                    settled = true;
                    resolve(value);
                };
                const handleRuntimeError = (error) => {
                    const message = typeof error?.message === 'string' ? error.message.trim() : '';
                    let errorCode = 'tab_send_failed';
                    if (/Receiving end does not exist/i.test(message)) {
                        errorCode = 'receiver_unavailable';
                    } else if (/No tab with id/i.test(message)) {
                        errorCode = 'tab_missing';
                    }
                    finish({
                        response: null,
                        errorCode,
                        errorMessage: message || 'Failed to reach YouTube tab'
                    });
                };

                const maybePromise = runtimeAPI.tabs.sendMessage(tabId, payload, (response) => {
                    const err = runtimeAPI.runtime?.lastError;
                    if (err) {
                        handleRuntimeError(err);
                        return;
                    }
                    finish({ response: response || null, errorCode: '', errorMessage: '' });
                });

                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise
                        .then((response) => finish({ response: response || null, errorCode: '', errorMessage: '' }))
                        .catch((error) => handleRuntimeError(error));
                }
            } catch (e) {
                resolve({
                    response: null,
                    errorCode: 'tab_send_failed',
                    errorMessage: e?.message || 'Failed to reach YouTube tab'
                });
            }
        });
    }

    async function ensureSubscriptionsImportBridge(tabId) {
        if (!Number.isFinite(tabId)) return false;
        const response = await sendRuntimeMessage({
            action: 'FilterTube_EnsureSubscriptionsImportBridge',
            tabId
        });
        return response?.success === true;
    }

    function isMainYoutubeUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            const host = (parsed.hostname || '').toLowerCase();
            if (host === 'youtubekids.com' || host.endsWith('.youtubekids.com')) {
                return false;
            }
            return host === 'www.youtube.com'
                || host === 'youtube.com'
                || host === 'm.youtube.com';
        } catch (e) {
            return false;
        }
    }

    function isYoutubeChannelsFeedUrl(url) {
        if (!isMainYoutubeUrl(url)) return false;
        try {
            const parsed = new URL(url);
            return parsed.pathname === '/feed/channels';
        } catch (e) {
            return false;
        }
    }

    function isYoutubeSignInUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            const host = (parsed.hostname || '').toLowerCase();
            const path = parsed.pathname || '';
            if (host === 'accounts.google.com' || host.endsWith('.accounts.google.com')) {
                return true;
            }
            if ((host === 'www.youtube.com' || host === 'youtube.com') && path === '/signin') {
                return true;
            }
        } catch (e) {
        }
        return false;
    }

    function buildYoutubeChannelsFeedUrl(url) {
        return 'https://m.youtube.com/feed/channels';
    }

    function renderSubscriptionsImportState() {
        if (!importSubscriptionsNotice || !importSubscriptionsStatus || !importSubscriptionsActions) return;

        const nextTone = normalizeString(subscriptionsImportState.tone) || 'idle';
        importSubscriptionsNotice.classList.remove(
            'subscriptions-import-inline--idle',
            'subscriptions-import-inline--info',
            'subscriptions-import-inline--success',
            'subscriptions-import-inline--warning',
            'subscriptions-import-inline--error'
        );
        importSubscriptionsNotice.classList.add(`subscriptions-import-inline--${nextTone}`);
        importSubscriptionsNotice.classList.toggle('is-loading', subscriptionsImportState.inProgress === true);
        importSubscriptionsNotice.setAttribute('aria-busy', subscriptionsImportState.inProgress === true ? 'true' : 'false');

        const message = normalizeString(subscriptionsImportState.message);
        const meta = normalizeString(subscriptionsImportState.meta);
        const statusText = meta ? `${message} ${meta}`.trim() : message;
        importSubscriptionsStatus.textContent = statusText;

        importSubscriptionsActions.innerHTML = '';
        importSubscriptionsActions.hidden = true;

        if (!subscriptionsImportState.inProgress && subscriptionsImportState.canEnableWhitelist) {
            const enableBtn = document.createElement('button');
            enableBtn.type = 'button';
            enableBtn.className = 'btn-primary';
            enableBtn.dataset.importAction = 'enable-whitelist';
            enableBtn.textContent = 'Turn On Whitelist';
            importSubscriptionsActions.appendChild(enableBtn);
            importSubscriptionsActions.hidden = false;
        }

        if (!subscriptionsImportState.inProgress && (nextTone === 'error' || subscriptionsImportState.phase === 'error' || subscriptionsImportState.phase === 'empty')) {
            const retryBtn = document.createElement('button');
            retryBtn.type = 'button';
            retryBtn.className = 'btn-secondary';
            retryBtn.dataset.importAction = 'retry-import';
            retryBtn.textContent = 'Retry Import';
            importSubscriptionsActions.appendChild(retryBtn);
            importSubscriptionsActions.hidden = false;
        }

        const showNotice = nextTone !== 'idle'
            || subscriptionsImportState.inProgress
            || !!statusText
            || !importSubscriptionsActions.hidden;
        importSubscriptionsNotice.hidden = !showNotice;
        importSubscriptionsStatus.hidden = !statusText;
    }

    function syncSubscriptionsImportControls() {
        if (!importSubscriptionsBtn) return;
        const locked = isUiLocked();
        const busy = subscriptionsImportState.inProgress === true;
        importSubscriptionsBtn.disabled = locked || busy;
        importSubscriptionsBtn.setAttribute('aria-disabled', (locked || busy) ? 'true' : 'false');
        importSubscriptionsBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
        importSubscriptionsBtn.classList.toggle('is-loading', busy);
        importSubscriptionsBtn.textContent = busy ? 'Importing…' : 'Import Subscribed Channels';
        importSubscriptionsBtn.title = locked
            ? 'Unlock this profile to import subscribed channels.'
            : 'Import subscribed channels into whitelist only. You will choose separately whether to turn whitelist mode on.';
    }

    function setSubscriptionsImportState(patch = {}) {
        subscriptionsImportState = {
            ...subscriptionsImportState,
            ...patch
        };
        renderSubscriptionsImportState();
        syncSubscriptionsImportControls();
    }

    function getOrderedYoutubeTabs(tabs, preferredTabId = null) {
        const candidates = Array.isArray(tabs) ? tabs.filter((tab) => isMainYoutubeUrl(tab?.url)) : [];
        if (!candidates.length) return [];

        const ordered = [];
        const seen = new Set();
        const pushTab = (tab) => {
            const tabId = Number(tab?.id);
            if (!Number.isFinite(tabId) || seen.has(tabId)) return;
            seen.add(tabId);
            ordered.push(tab);
        };

        const preferred = Number.isFinite(preferredTabId)
            ? candidates.find((tab) => tab?.id === preferredTabId)
            : null;
        const isMobileYoutubeTab = (tab) => {
            try {
                return String(new URL(tab?.url || '').hostname || '').toLowerCase() === 'm.youtube.com';
            } catch (e) {
                return false;
            }
        };

        pushTab(candidates.find((tab) => isMobileYoutubeTab(tab) && tab?.active === true && tab?.status === 'complete'));
        pushTab(preferred?.status === 'complete' && isMobileYoutubeTab(preferred) ? preferred : null);
        candidates.filter((tab) => isMobileYoutubeTab(tab) && tab?.status === 'complete').forEach(pushTab);
        pushTab(candidates.find((tab) => tab?.active === true && tab?.status === 'complete'));
        pushTab(preferred?.status === 'complete' ? preferred : null);
        candidates.filter((tab) => tab?.status === 'complete').forEach(pushTab);
        pushTab(candidates.find((tab) => isMobileYoutubeTab(tab) && tab?.active === true));
        pushTab(isMobileYoutubeTab(preferred) ? preferred : null);
        candidates.filter(isMobileYoutubeTab).forEach(pushTab);
        pushTab(candidates.find((tab) => tab?.active === true));
        pushTab(preferred);
        candidates.forEach(pushTab);

        return ordered;
    }

    function pickBestYoutubeTab(tabs, preferredTabId = null) {
        return getOrderedYoutubeTabs(tabs, preferredTabId)[0] || null;
    }

    async function pingSubscriptionsImportReceiver(tabId) {
        const pingResult = await sendMessageToBrowserTab(tabId, {
            action: 'FilterTube_Ping',
            feature: 'subscriptions_import'
        });
        return {
            ok: pingResult?.response?.ok === true,
            errorCode: pingResult?.errorCode || '',
            errorMessage: pingResult?.errorMessage || ''
        };
    }

    function updateSubscriptionsImportWaitState(phase, options = {}) {
        const tabTitle = normalizeString(options.tabTitle);
        const tabLabel = tabTitle || 'the selected YouTube tab';
        let title = '';
        let message = '';
        let meta = normalizeString(options.meta);

        if (phase === 'searching') {
            title = 'Looking For YouTube';
            message = 'Checking open YouTube tabs for the active account.';
        } else if (phase === 'waiting_page') {
            title = 'Waiting For YouTube';
            message = `Waiting for ${tabLabel} to finish loading.`;
            meta = meta || 'Keep the tab open for a moment.';
        } else if (phase === 'waiting_bridge') {
            title = 'Starting FilterTube';
            message = `Waiting for FilterTube to finish starting in ${tabLabel}.`;
            meta = meta || 'The import will begin automatically once the bridge is ready.';
        } else if (phase === 'bootstrapping_bridge') {
            title = 'Connecting To YouTube';
            message = `Connecting FilterTube to ${tabLabel}.`;
            meta = meta || 'This can happen when the YouTube tab was already open before FilterTube reloaded.';
        } else if (phase === 'opening_fallback') {
            title = 'Opening YouTube';
            message = 'Opening a background YouTube tab for the active account.';
            meta = meta || 'Waiting for YouTube and FilterTube to finish loading…';
        } else {
            return;
        }

        setSubscriptionsImportState({
            phase,
            tone: 'info',
            title,
            message,
            meta,
            inProgress: true,
            canEnableWhitelist: false
        });
    }

    async function waitForYoutubeTabReady(tabId, timeoutMs = 20000, onStatus = null) {
        const deadline = Date.now() + timeoutMs;
        let lastYoutubeTab = null;
        let lastTab = null;
        let lastReceiverStatus = { ok: false, errorCode: '', errorMessage: '' };
        let lastPingAt = 0;
        let signInSeenAt = 0;
        let bridgeBootstrapAttempted = false;
        let lastStatusKey = '';
        const reportStatus = (phase, tab = null, meta = '') => {
            if (typeof onStatus !== 'function') return;
            const currentTab = tab || lastYoutubeTab || lastTab || null;
            const tabTitle = normalizeString(currentTab?.title || '');
            const nextKey = `${phase}|${currentTab?.id || ''}|${currentTab?.status || ''}|${tabTitle}|${meta}`;
            if (nextKey === lastStatusKey) return;
            lastStatusKey = nextKey;
            try {
                onStatus({ phase, tab: currentTab, tabTitle, meta });
            } catch (e) {
            }
        };
        while (Date.now() < deadline) {
            const tabs = await queryBrowserTabs({});
            const match = tabs.find((tab) => tab?.id === tabId);
            if (match) {
                lastTab = match;
            }
            if (match && isYoutubeSignInUrl(match?.url)) {
                if (!signInSeenAt) {
                    signInSeenAt = Date.now();
                }
                reportStatus('waiting_page', match);
                if (match.status === 'complete' && (Date.now() - signInSeenAt) >= 1500) {
                    return {
                        state: 'signed_out',
                        tab: match
                    };
                }
            } else {
                signInSeenAt = 0;
            }
            if (match && isMainYoutubeUrl(match?.url)) {
                lastYoutubeTab = match;
                if (match.status === 'complete') {
                    reportStatus('waiting_bridge', match);
                    const now = Date.now();
                    if ((now - lastPingAt) >= 700) {
                        await sleep(250);
                        lastReceiverStatus = await pingSubscriptionsImportReceiver(tabId);
                        lastPingAt = Date.now();
                        if (!lastReceiverStatus.ok && lastReceiverStatus.errorCode === 'receiver_unavailable' && !bridgeBootstrapAttempted) {
                            bridgeBootstrapAttempted = true;
                            reportStatus('bootstrapping_bridge', match);
                            const injected = await ensureSubscriptionsImportBridge(tabId);
                            if (injected) {
                                await sleep(350);
                                lastReceiverStatus = await pingSubscriptionsImportReceiver(tabId);
                                lastPingAt = Date.now();
                            }
                        }
                        if (lastReceiverStatus.ok) {
                            return {
                                state: 'ready',
                                tab: match
                            };
                        }
                    }
                } else {
                    reportStatus('waiting_page', match);
                }
            }
            await sleep(350);
        }
        if (lastYoutubeTab) {
            if (lastYoutubeTab.status === 'complete') {
                lastReceiverStatus = await pingSubscriptionsImportReceiver(tabId);
                if (lastReceiverStatus.ok) {
                    return {
                        state: 'ready',
                        tab: lastYoutubeTab
                    };
                }
            }
            return {
                state: lastYoutubeTab.status === 'complete' ? 'receiver_unavailable' : 'loading',
                tab: lastYoutubeTab,
                receiver: lastReceiverStatus
            };
        }
        if (lastTab && isYoutubeSignInUrl(lastTab?.url) && signInSeenAt) {
            return {
                state: 'signed_out',
                tab: lastTab
            };
        }
        return {
            state: 'unready',
            tab: lastTab
        };
    }

    function describeSubscriptionsImportError(result = {}) {
        const code = normalizeString(result?.errorCode);
        if (code === 'signed_out') {
            return 'Sign in to YouTube in the selected tab, then retry the import.';
        }
        if (code === 'receiver_unavailable' || code === 'subscriptions_import_unavailable') {
            return 'The YouTube tab is still starting FilterTube. Keep it open for a moment, then retry.';
        }
        if (code === 'profile_locked') {
            return 'Unlock this profile before importing subscribed channels.';
        }
        if (code === 'profile_changed') {
            return 'The active profile changed during import. Retry once the intended profile is active again.';
        }
        if (code === 'tab_import_failed') {
            return 'The selected YouTube tab was not ready for import. Retry after the page finishes loading.';
        }
        return normalizeString(result?.error) || 'Unable to import subscribed channels right now.';
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
        if (profileDropdownPositionRaf) {
            cancelAnimationFrame(profileDropdownPositionRaf);
            profileDropdownPositionRaf = 0;
        }
        ftProfileDropdownTab.hidden = true;
        ftProfileDropdownTab.setAttribute('hidden', '');
        ftProfileDropdownTab.style.display = 'none';
        ftProfileDropdownTab.style.left = '';
        ftProfileDropdownTab.style.top = '';
        ftProfileDropdownTab.style.minWidth = '';
        ftProfileDropdownTab.style.transform = '';
        ftProfileBadgeBtnTab.setAttribute('aria-expanded', 'false');
    }
    window.closeProfileDropdownTab = closeProfileDropdownTab;

    function positionProfileDropdownTab() {
        if (!ftProfileDropdownTab || !ftProfileBadgeBtnTab || ftProfileDropdownTab.hidden) return;
        try {
            const triggerRect = ftProfileBadgeBtnTab.getBoundingClientRect();
            const pad = 8;
            const maxRight = window.innerWidth - pad;
            const maxBottom = window.innerHeight - pad;

            ftProfileDropdownTab.style.position = 'fixed';
            const dropdownHeight = ftProfileDropdownTab.offsetHeight || 280;
            const dropdownWidth = ftProfileDropdownTab.offsetWidth || Math.max(triggerRect.width, 220);

            const spaceBelow = maxBottom - triggerRect.bottom;
            const spaceAbove = triggerRect.top - pad;

            let top;
            if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
                top = triggerRect.bottom + pad;
            } else {
                top = triggerRect.top - dropdownHeight - pad;
            }

            if (top + dropdownHeight > maxBottom) {
                top = maxBottom - dropdownHeight;
            }
            if (top < pad) {
                top = pad;
            }

            let left = triggerRect.right - dropdownWidth;
            if (left + dropdownWidth > maxRight) {
                left = maxRight - dropdownWidth;
            }
            if (left < pad) {
                left = pad;
            }

            ftProfileDropdownTab.style.top = `${Math.round(top)}px`;
            ftProfileDropdownTab.style.left = `${Math.round(left)}px`;
            ftProfileDropdownTab.style.minWidth = `${Math.max(triggerRect.width, 220)}px`;
            ftProfileDropdownTab.style.transform = 'none';
        } catch (e) {
        }
    }

    let profileDropdownPositionRaf = 0;

    function scheduleProfileDropdownPositionTab() {
        if (!ftProfileDropdownTab || ftProfileDropdownTab.hidden) return;
        if (profileDropdownPositionRaf) return;
        profileDropdownPositionRaf = requestAnimationFrame(() => {
            profileDropdownPositionRaf = 0;
            positionProfileDropdownTab();
        });
    }

    function resetTabViewScroll(activeSection = null) {
        const mainContent = document.querySelector('.main-content');
        const reset = () => {
            const pad = 8;
            try {
                activeSection?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
            } catch (e) {
                if (activeSection) activeSection.scrollTop = 0;
            }
            if (activeSection) {
                activeSection.scrollTop = 0;
                activeSection.scrollLeft = 0;
            }
            if (viewContainer) {
                try {
                    viewContainer.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                } catch (e) {
                    viewContainer.scrollTop = 0;
                    viewContainer.scrollLeft = 0;
                }
            }
            if (mainContent) {
                mainContent.scrollTop = 0;
                mainContent.scrollLeft = 0;
            }
            document.documentElement.scrollTop = 0;
            document.documentElement.scrollLeft = 0;
            document.body.scrollTop = 0;
            document.body.scrollLeft = 0;
            try {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            } catch (e) {
                window.scrollTo(0, 0);
            }
        };

        reset();
        requestAnimationFrame(reset);
    }
    window.resetTabViewScroll = resetTabViewScroll;

    function toggleProfileDropdownTab() {
        if (!ftProfileDropdownTab || !ftProfileBadgeBtnTab) return;
        const next = !ftProfileDropdownTab.hidden;
        if (next) {
            if (profileDropdownPositionRaf) {
                cancelAnimationFrame(profileDropdownPositionRaf);
                profileDropdownPositionRaf = 0;
            }
            closeProfileDropdownTab();
            return;
        }
        ftProfileDropdownTab.hidden = false;
        ftProfileDropdownTab.removeAttribute('hidden');
        ftProfileDropdownTab.style.display = 'block';
        ftProfileBadgeBtnTab.setAttribute('aria-expanded', 'true');
        positionProfileDropdownTab();
        scheduleProfileDropdownPositionTab();
        requestAnimationFrame(() => {
            scheduleProfileDropdownPositionTab();
        });
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
            const modeValue = (mode === 'history' || mode === 'latest') ? mode : 'latest';
            if (ftAutoBackupMode.value !== modeValue) {
                ftAutoBackupMode.value = modeValue;
                ftAutoBackupMode.dispatchEvent(new Event('input', { bubbles: true }));
            }

            const format = normalizeString(settings.autoBackupFormat).toLowerCase();
            const formatValue = (format === 'plain' || format === 'encrypted' || format === 'auto') ? format : 'auto';
            if (ftAutoBackupFormat.value !== formatValue) {
                ftAutoBackupFormat.value = formatValue;
                ftAutoBackupFormat.dispatchEvent(new Event('input', { bubbles: true }));
            }

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

    function updateChildProfileCapabilityControls() {
        const isChild = getActiveProfileType() === 'child';
        const childTitle = 'Child profiles cannot manage backup, import/export, or account-admin actions here.';
        const syncKidsToMainToggle = document.getElementById('setting_syncKidsToMain');

        if (ftExportV3Btn) {
            ftExportV3Btn.disabled = isChild;
            ftExportV3Btn.title = isChild ? childTitle : '';
        }
        if (ftExportV3EncryptedBtn) {
            ftExportV3EncryptedBtn.disabled = isChild;
            ftExportV3EncryptedBtn.title = isChild ? childTitle : 'Download an encrypted backup JSON (requires a password/PIN)';
        }
        if (ftImportV3Btn) {
            ftImportV3Btn.disabled = isChild;
            ftImportV3Btn.title = isChild ? childTitle : 'Import a FilterTube export or any compatible JSON (BlockTube, other tools, etc.)';
        }
        if (ftImportV3File) {
            ftImportV3File.disabled = isChild;
        }
        if (settingAutoBackupEnabled) {
            settingAutoBackupEnabled.disabled = isChild || isUiLocked();
            settingAutoBackupEnabled.title = isChild ? childTitle : '';
        }
        if (ftAutoBackupMode) {
            ftAutoBackupMode.disabled = isChild || ftAutoBackupMode.disabled;
            if (isChild) ftAutoBackupMode.title = childTitle;
        }
        if (ftAutoBackupFormat) {
            ftAutoBackupFormat.disabled = isChild || ftAutoBackupFormat.disabled;
            if (isChild) ftAutoBackupFormat.title = childTitle;
        }
        if (ftCreateAccountBtn) {
            ftCreateAccountBtn.disabled = isChild;
            ftCreateAccountBtn.title = isChild ? childTitle : '';
        }
        if (ftCreateChildBtn) {
            ftCreateChildBtn.disabled = isChild;
            ftCreateChildBtn.title = isChild ? childTitle : '';
        }
        if (ftSetMasterPinBtn) {
            ftSetMasterPinBtn.disabled = isChild;
            ftSetMasterPinBtn.title = isChild ? childTitle : '';
        }
        if (ftClearMasterPinBtn) {
            ftClearMasterPinBtn.disabled = isChild;
            ftClearMasterPinBtn.title = isChild ? childTitle : '';
        }
        if (syncKidsToMainToggle) {
            syncKidsToMainToggle.disabled = isChild;
            syncKidsToMainToggle.title = isChild ? childTitle : '';
        }
    }

    function isChildProfileAdminSurface() {
        return getActiveProfileType() === 'child';
    }

    function ensureNonChildAdminAction(message = 'Child profiles cannot manage this action here.') {
        if (!isChildProfileAdminSurface()) return true;
        UIComponents.showToast(message, 'error');
        return false;
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

    function getNanahProfileTypeLabel(profileType, profileId = '') {
        if (normalizeString(profileId) === 'default') return 'master account';
        return normalizeString(profileType).toLowerCase() === 'child' ? 'child profile' : 'account profile';
    }

    function getNanahLocalProfileContext() {
        const profilesV4 = profilesV4Cache;
        const profileId = normalizeString(activeProfileId) || 'default';
        const profileType = getActiveProfileType();
        return {
            profileId,
            profileName: getProfileName(profilesV4, profileId),
            profileType,
            locked: isProfileLocked(profilesV4, profileId) && !unlockedProfiles.has(profileId)
        };
    }

    function getNanahProfileInventory(profilesV4 = profilesV4Cache) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        return Object.keys(profiles)
            .map((profileId) => {
                const profile = safeObject(profiles[profileId]);
                return {
                    profileId,
                    profileName: normalizeString(profile.name) || (profileId === 'default' ? 'Default' : profileId),
                    profileType: getProfileType(root, profileId),
                    locked: isProfileLocked(root, profileId) && !unlockedProfiles.has(profileId)
                };
            })
            .sort((a, b) => {
                if (a.profileId === 'default') return -1;
                if (b.profileId === 'default') return 1;
                return a.profileName.localeCompare(b.profileName);
            });
    }

    function normalizeNanahProfileInventory(value) {
        return safeArray(value)
            .map((entry) => normalizeNanahProfileContext(entry))
            .filter((entry) => normalizeString(entry.profileId));
    }

    function isNanahChildReplicaOnly() {
        const context = getNanahLocalProfileContext();
        return context.profileType === 'child' && context.locked === true;
    }

    async function enableWhitelistModeAfterImport(context = {}) {
        if (isUiLocked()) {
            updateCheckboxes();
            renderListModeControls();
            return;
        }

        const resp = await sendRuntimeMessage({
            action: 'FilterTube_SetListMode',
            profileType: 'main',
            mode: 'whitelist',
            copyBlocklist: false
        });

        if (!resp || resp.ok !== true) {
            UIComponents.showToast('Failed to enable whitelist mode', 'error');
            return;
        }

        await StateManager.loadSettings();
        renderKeywords();
        renderChannels();
        updateCheckboxes();
        updateStats();
        renderListModeControls();

        const totalApplied = Number(context.totalApplied) || 0;
        const meta = normalizeString(context.meta);
        const message = totalApplied > 0
            ? `Imported ${totalApplied} subscribed ${pluralize(totalApplied, 'channel')}, turned on whitelist mode, and merged your current blocklist into whitelist.`
            : 'Whitelist mode is now active, and your current blocklist has been merged into whitelist.';

        setSubscriptionsImportState({
            phase: 'success',
            tone: 'success',
            title: 'Whitelist Enabled',
            message,
            meta,
            requestId: '',
            sourceTabId: null,
            inProgress: false,
            canEnableWhitelist: false
        });
        UIComponents.showToast('Whitelist mode enabled', 'success');
    }

    function handleSubscriptionsImportProgress(progress = {}) {
        if (!subscriptionsImportState.inProgress) return;

        const pagesFetched = Number(progress?.pagesFetched) || 0;
        const foundCount = Number(progress?.foundCount) || 0;
        const expectedTotal = Number(progress?.expectedTotal) || 0;
        const hasContinuation = progress?.hasContinuation === true;
        const phase = normalizeString(progress?.phase) || 'page';
        const metaParts = [];

        if (pagesFetched > 0) {
            metaParts.push(`${pagesFetched} ${pluralize(pagesFetched, 'page')} checked`);
        }
        if (expectedTotal > 0) {
            metaParts.push(`${Math.min(foundCount, expectedTotal)} / ${expectedTotal} found`);
        } else if (foundCount > 0) {
            metaParts.push(`${foundCount} ${pluralize(foundCount, 'channel')} found`);
        }
        if (hasContinuation) {
            metaParts.push('Loading more…');
        }

        setSubscriptionsImportState({
            phase: 'fetching',
            tone: 'info',
            title: phase === 'starting' ? 'Connecting To YouTube' : 'Importing Subscribed Channels',
            message: phase === 'starting'
                ? 'Reading the subscribed channel list for the active YouTube account.'
                : `Collected ${foundCount} subscribed ${pluralize(foundCount, 'channel')} so far.`,
            meta: metaParts.join(' • '),
            inProgress: true,
            canEnableWhitelist: false
        });
    }

    async function resolveSubscriptionsImportTab() {
        updateSubscriptionsImportWaitState('searching');
        const existingTabs = await queryBrowserTabs({});
        const candidates = getOrderedYoutubeTabs(existingTabs, preferredSubscriptionsImportTabId);
        let bestExistingResult = null;

        for (let i = 0; i < candidates.length; i += 1) {
            let candidate = candidates[i];
            if (!candidate?.id) continue;

            if (!isYoutubeChannelsFeedUrl(candidate.url) && isMainYoutubeUrl(candidate.url)) {
                const targetUrl = buildYoutubeChannelsFeedUrl(candidate.url);
                const updatedTab = await updateBrowserTab(candidate.id, { url: targetUrl, active: false });
                if (updatedTab?.id) {
                    candidate = updatedTab;
                }
            }

            const readyCandidate = await waitForYoutubeTabReady(candidate.id, 30000, (status) => {
                updateSubscriptionsImportWaitState(status?.phase, {
                    tabTitle: status?.tabTitle || status?.tab?.title || '',
                    meta: status?.meta || ''
                });
            });

            if (readyCandidate?.state === 'ready' || readyCandidate?.state === 'signed_out') {
                return {
                    ...readyCandidate,
                    opened: false
                };
            }

            if (!bestExistingResult && readyCandidate) {
                bestExistingResult = {
                    ...readyCandidate,
                    opened: false
                };
            }
        }

        if (bestExistingResult) {
            return bestExistingResult;
        }

        updateSubscriptionsImportWaitState('opening_fallback');

        const createdTab = await createBrowserTab({
            url: 'https://m.youtube.com/feed/channels',
            active: false
        });

        if (!createdTab?.id) {
            return {
                state: 'unready',
                opened: false,
                tab: null
            };
        }

        preferredSubscriptionsImportTabId = createdTab.id;
        const readyCandidate = await waitForYoutubeTabReady(createdTab.id, 30000, (status) => {
            updateSubscriptionsImportWaitState(status?.phase, {
                tabTitle: status?.tabTitle || status?.tab?.title || '',
                meta: status?.meta || ''
            });
        });
        if (readyCandidate?.state === 'signed_out' && readyCandidate?.tab?.id) {
            await updateBrowserTab(readyCandidate.tab.id, { active: true });
        }
        return readyCandidate
            ? { ...readyCandidate, opened: true }
            : {
                state: 'unready',
                opened: true,
                tab: createdTab
            };
    }

    async function startSubscribedChannelsImport(trigger = 'manual') {
        if (isUiLocked()) {
            updateCheckboxes();
            UIComponents.showToast('Unlock this profile to import subscribed channels', 'error');
            return;
        }

        if (subscriptionsImportState.inProgress) {
            return;
        }

        const importChoice = trigger === 'manual'
            ? await confirmSubscriptionsImportModeChoice()
            : 'import-only';
        if (!importChoice) {
            setSubscriptionsImportState({
                phase: 'idle',
                tone: 'idle',
                title: '',
                message: '',
                meta: '',
                requestId: '',
                sourceTabId: null,
                inProgress: false,
                canEnableWhitelist: false
            });
            return;
        }
        const enableWhitelistAfterImport = importChoice === 'import-and-enable';

        setSubscriptionsImportState({
            phase: 'preparing',
            tone: 'info',
            title: 'Preparing Import',
            message: 'Preparing the subscribed channels import for this whitelist.',
            meta: '',
            requestId: '',
            sourceTabId: null,
            inProgress: true,
            canEnableWhitelist: false
        });

        const sourceOutcome = await resolveSubscriptionsImportTab();
        const sourceTab = sourceOutcome?.tab || null;
        if (sourceOutcome?.state === 'signed_out') {
            setSubscriptionsImportState({
                phase: 'error',
                tone: 'warning',
                title: 'Sign In Required',
                message: 'Sign in to YouTube in the selected tab, then retry the subscriptions import.',
                meta: sourceOutcome?.opened
                    ? 'FilterTube opened a YouTube tab because no usable signed-in session was ready.'
                    : 'The selected YouTube tab is still on a sign-in or account-routing page.',
                requestId: '',
                sourceTabId: sourceTab?.id || null,
                inProgress: false,
                canEnableWhitelist: false
            });
            UIComponents.showToast('Sign in to YouTube, then retry the import', 'info');
            return;
        }

        if (!sourceTab?.id || sourceOutcome?.state !== 'ready' || !isMainYoutubeUrl(sourceTab?.url)) {
            setSubscriptionsImportState({
                phase: 'error',
                tone: 'error',
                title: 'YouTube Tab Not Ready',
                message: 'The selected YouTube tab is still loading or has not finished starting FilterTube.',
                meta: 'Keep a signed-in YouTube tab open for a moment, then retry.',
                requestId: '',
                sourceTabId: null,
                inProgress: false,
                canEnableWhitelist: false
            });
            UIComponents.showToast('YouTube tab is still loading', 'error');
            return;
        }

        preferredSubscriptionsImportTabId = sourceTab.id;
        const requestId = `subs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSubscriptionsImportState({
            phase: 'fetching',
            tone: 'info',
            title: 'Importing Subscribed Channels',
            message: `Reading subscribed channels from ${sourceTab.title || 'YouTube'}…`,
            meta: '',
            requestId,
            sourceTabId: sourceTab.id,
            inProgress: true,
            canEnableWhitelist: false
        });

        const previouslyActiveTab = await getActiveBrowserTab();
        const shouldRestorePreviousTab = Number(previouslyActiveTab?.id) !== Number(sourceTab.id);
        if (shouldRestorePreviousTab) {
            await updateBrowserTab(sourceTab.id, { active: true });
        }
        await sleep(1200);

        let result = null;
        try {
            result = await StateManager.importSubscribedChannelsToWhitelist({
                requestId,
                tabId: sourceTab.id,
                targetProfileId: activeProfileId,
                timeoutMs: 150000,
                maxChannels: 5000,
                pageDelayMs: 140
            });
        } finally {
            if (shouldRestorePreviousTab && Number.isFinite(Number(previouslyActiveTab?.id))) {
                await updateBrowserTab(Number(previouslyActiveTab.id), { active: true });
            }
        }

        if (!result?.success) {
            setSubscriptionsImportState({
                phase: 'error',
                tone: 'error',
                title: 'Import Failed',
                message: describeSubscriptionsImportError(result || {}),
                meta: '',
                requestId: '',
                sourceTabId: null,
                inProgress: false,
                canEnableWhitelist: false
            });
            if (trigger !== 'auto') {
                UIComponents.showToast('Subscribed channel import failed', 'error');
            }
            return;
        }

        const counts = result.counts || {};
        const importedCount = Number(counts.imported) || 0;
        const updatedCount = Number(counts.updated) || 0;
        const duplicateCount = Number(counts.duplicates) || 0;
        const skippedCount = Number(counts.skipped) || 0;
        const totalApplied = importedCount + updatedCount;
        const pagesFetched = Number(result?.stats?.pagesFetched) || 0;
        const expectedTotal = Number(result?.stats?.expectedTotal) || 0;
        const metaParts = [];

        if (importedCount > 0) metaParts.push(`${importedCount} new`);
        if (updatedCount > 0) metaParts.push(`${updatedCount} repaired`);
        if (duplicateCount > 0) metaParts.push(`${duplicateCount} already present`);
        if (skippedCount > 0) metaParts.push(`${skippedCount} skipped`);
        if (expectedTotal > 0) metaParts.push(`${Math.min(totalApplied, expectedTotal)} / ${expectedTotal} found`);
        if (pagesFetched > 0) metaParts.push(`${pagesFetched} ${pluralize(pagesFetched, 'page')} read`);
        if (result?.stats?.partial) metaParts.push('import stopped early');

        if (result.empty) {
            setSubscriptionsImportState({
                phase: 'empty',
                tone: 'warning',
                title: 'No Subscriptions Imported',
                message: 'No subscribed channels were found for the selected YouTube account.',
                meta: metaParts.join(' • '),
                requestId: '',
                sourceTabId: null,
                inProgress: false,
                canEnableWhitelist: false
            });
            UIComponents.showToast('No subscribed channels found', 'info');
            return;
        }

        const whitelistOff = (result.currentMode || 'blocklist') !== 'whitelist';
        if (enableWhitelistAfterImport && whitelistOff) {
            await enableWhitelistModeAfterImport({
                totalApplied,
                meta: metaParts.join(' • ')
            });
            UIComponents.showToast('Subscribed channels imported and whitelist mode enabled', 'success');
            return;
        }

        const successMessage = totalApplied > 0
            ? (
                whitelistOff
                    ? `Added ${totalApplied} subscribed ${pluralize(totalApplied, 'channel')} to whitelist. Your blocklist channels and keywords were left unchanged.`
                    : `Added ${totalApplied} subscribed ${pluralize(totalApplied, 'channel')} to the active whitelist.`
            )
            : (
                whitelistOff
                    ? 'All subscribed channels were already present in whitelist. Your blocklist channels and keywords were left unchanged.'
                    : 'All subscribed channels were already present in whitelist.'
            );
        setSubscriptionsImportState({
            phase: 'success',
            tone: (whitelistOff || result?.stats?.partial) ? 'warning' : 'success',
            title: whitelistOff ? 'Imported To Whitelist' : 'Whitelist Updated',
            message: successMessage,
            meta: metaParts.join(' • '),
            requestId: '',
            sourceTabId: null,
            inProgress: false,
            canEnableWhitelist: whitelistOff
        });
        UIComponents.showToast('Subscribed channels imported', 'success');
    }

    function resolveViewAccess(requestedViewId) {
        let viewId = normalizeString(requestedViewId);
        if (!viewId) return { viewId: 'help', reason: 'unknown' };
        if (viewId === 'semantic' && !FILTERTUBE_SEMANTIC_ML_ENABLED) {
            viewId = 'filters';
        }

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

    async function showChoiceModal({ title, message = '', details = [], choices = [], cancelText = 'Cancel' }) {
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

            if (Array.isArray(details) && details.length) {
                const notes = document.createElement('div');
                notes.className = 'subscriptions-import-modal__notes';
                details.forEach((detail) => {
                    const row = document.createElement('div');
                    row.className = 'subscriptions-import-modal__note';
                    row.textContent = detail;
                    notes.appendChild(row);
                });
                body.appendChild(notes);
            }

            const actions = document.createElement('div');
            actions.className = 'ft-modal-actions subscriptions-import-modal__actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.type = 'button';
            cancelBtn.textContent = cancelText;

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

            actions.appendChild(cancelBtn);

            choices.forEach((choice, index) => {
                if (!choice || !choice.value || !choice.label) return;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = choice.className || (choice.recommended ? 'btn-primary' : 'btn-secondary');
                btn.textContent = choice.label;
                btn.addEventListener('click', () => closeWith(choice.value));
                actions.appendChild(btn);

                if (index === 0) {
                    requestAnimationFrame(() => {
                        try {
                            btn.focus();
                        } catch (e) {
                        }
                    });
                }
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cancelBtn.click();
                }
            });

            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelBtn.click();
                }
            };
            overlay.addEventListener('keydown', handleEscape);

            body.appendChild(actions);
            card.appendChild(header);
            card.appendChild(body);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
        });
    }

    function isNanahAvailable() {
        return !!(window.FilterTubeNanah && window.FilterTubeNanahAdapter);
    }

    function normalizeNanahCode(input) {
        return normalizeString(input)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8);
    }

    function extractNanahCodeFromInput(input) {
        const raw = normalizeString(input);
        if (/^nanah:\/\//i.test(raw)) {
            try {
                const parsed = new URL(raw);
                const uriCode = parsed.searchParams.get('code');
                const normalizedFromUri = normalizeNanahCode(uriCode);
                if (normalizedFromUri) return normalizedFromUri;
            } catch (error) {
            }
        }
        return normalizeNanahCode(raw);
    }

    function formatNanahStage(stage) {
        const raw = normalizeString(stage).toLowerCase();
        if (!raw) return 'Idle';
        return raw
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    function getNanahRole() {
        const raw = normalizeString(ftNanahRole?.value).toLowerCase();
        if (raw === 'source' || raw === 'replica' || raw === 'peer') return raw;
        return 'peer';
    }

    function getNanahRoleLabel(role = getNanahRole()) {
        const normalized = normalizeString(role).toLowerCase();
        if (normalized === 'source') return 'Source / Parent';
        if (normalized === 'replica') return 'Replica / Kids device';
        return 'Peer';
    }

    function getNanahScope() {
        const raw = normalizeString(ftNanahScope?.value).toLowerCase();
        if (getActiveProfileType() === 'child' && raw === 'full') return 'active';
        if (raw === 'main' || raw === 'kids' || raw === 'full' || raw === 'active') return raw;
        return 'active';
    }

    function getNanahStrategy() {
        const raw = normalizeString(ftNanahStrategy?.value).toLowerCase();
        return raw === 'replace' ? 'replace' : 'merge';
    }

    function normalizeNanahUiMode(mode) {
        const normalized = normalizeString(mode).toLowerCase();
        if (normalized === 'parent' || normalized === 'parent_control') return 'parent_control';
        if (normalized === 'full' || normalized === 'full_account') return 'full_account';
        return 'send_once';
    }

    function inferNanahUiModeFromControls() {
        if (getNanahScope() === 'full') return 'full_account';
        const role = getNanahRole();
        if (role === 'source' || role === 'replica') return 'parent_control';
        return 'send_once';
    }

    function getNanahUiMode() {
        return normalizeNanahUiMode(nanahUiMode || inferNanahUiModeFromControls());
    }

    function getNanahScopeList(value) {
        const list = Array.isArray(value) ? value : [value];
        const normalized = list
            .map((item) => normalizeString(item).toLowerCase())
            .filter((item) => item === 'main' || item === 'kids' || item === 'active' || item === 'full');
        return normalized.length > 0 ? Array.from(new Set(normalized)) : ['active'];
    }

    function classifyNanahTrustedLink(localRole, remoteRole) {
        if (localRole === 'peer' && remoteRole === 'peer') return 'peer_link';
        if ((localRole === 'source' && remoteRole === 'replica') || (localRole === 'replica' && remoteRole === 'source')) {
            return 'managed_link';
        }
        return '';
    }

    function getNanahScopeLabel(scope) {
        const normalized = normalizeString(scope).toLowerCase();
        if (normalized === 'main') return 'Main';
        if (normalized === 'kids') return 'Kids';
        if (normalized === 'full') return 'Full backup';
        return 'Active profile';
    }

    function getNanahStrategyLabel(strategy) {
        return normalizeString(strategy).toLowerCase() === 'replace' ? 'Replace' : 'Merge';
    }

    function getNanahReconnectMode(mode, fallback = 'fast') {
        const normalized = normalizeString(mode).toLowerCase();
        if (normalized === 'approval_needed' || normalized === 'approval') return 'approval_needed';
        if (normalized === 'fast') return 'fast';
        return fallback;
    }

    function getNanahReconnectModeLabel(mode) {
        return getNanahReconnectMode(mode) === 'approval_needed' ? 'Approval needed' : 'Fast reconnect';
    }

    function getNanahLockedChildMode(mode, fallback = 'require_unlock') {
        const normalized = normalizeString(mode).toLowerCase();
        if (normalized === 'allow_trusted_updates' || normalized === 'allow_locked_updates') return 'allow_trusted_updates';
        if (normalized === 'require_unlock') return 'require_unlock';
        return fallback;
    }

    function getNanahLockedChildModeLabel(mode) {
        return getNanahLockedChildMode(mode) === 'allow_trusted_updates'
            ? 'Allow trusted updates while locked'
            : 'Require local unlock';
    }

    function getNanahChildProtectionLevel(value, fallback = 'standard') {
        const normalized = normalizeString(value).toLowerCase();
        if (normalized === 'strict') return 'strict';
        if (normalized === 'standard') return 'standard';
        return fallback;
    }

    function getNanahChildProtectionLevelLabel(value) {
        return getNanahChildProtectionLevel(value, 'standard') === 'strict'
            ? 'Strict child protection'
            : 'Standard child protection';
    }

    function getNanahTargetProfileBehavior(value, fallback = 'current_active') {
        const normalized = normalizeString(value).toLowerCase();
        if (normalized === 'fixed_profile' || normalized === 'fixed') return 'fixed_profile';
        if (normalized === 'current_active' || normalized === 'current') return 'current_active';
        return fallback;
    }

    function getNanahTargetProfileBehaviorLabel(value) {
        return getNanahTargetProfileBehavior(value) === 'fixed_profile'
            ? 'Always this local profile'
            : 'Current active profile';
    }

    function getNanahLinkTypeLabel(linkType) {
        return normalizeString(linkType) === 'managed_link' ? 'managed link' : 'peer link';
    }

    function getNanahRoleLabel(role) {
        const normalized = normalizeString(role).toLowerCase();
        if (normalized === 'source') return 'Source / Parent';
        if (normalized === 'replica') return 'Replica / Kids device';
        return 'Peer';
    }

    function isActiveChildNanahProfile() {
        return getActiveProfileType() === 'child';
    }

    function getNanahScopeDescription(scope) {
        const normalized = normalizeString(scope).toLowerCase();
        if (normalized === 'main') return 'Only the main YouTube rules and lists.';
        if (normalized === 'kids') return 'Only the Kids profile rules and lists.';
        if (normalized === 'full') return 'The wider account snapshot, best for full migration.';
        return 'The currently active FilterTube profile snapshot.';
    }

    function describeNanahScopeList(scopes) {
        return getNanahScopeList(scopes).map(getNanahScopeLabel).join(', ');
    }

    async function showNanahManagedLinkModal({
        title,
        message = '',
        intro = '',
        initialPolicy = {},
        requiredScopes = [],
        allowApplyOnce = false,
        allowSave = true,
        applyOnceLabel = 'Apply once',
        saveLabel = 'Save managed link',
        cancelLabel = 'Cancel',
        showAutoApply = false,
        showReconnectMode = false,
        showLockedChildMode = false,
        showTargetProfileMapping = false,
        forceFixedTargetProfile = false
    }) {
        const scopeOptions = showLockedChildMode
            ? ['active', 'main', 'kids']
            : ['active', 'main', 'kids', 'full'];
        const localProfileContext = getNanahLocalProfileContext();

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ft-modal-overlay';

            const card = document.createElement('div');
            card.className = 'card ft-modal nanah-managed-modal';

            const header = document.createElement('div');
            header.className = 'card-header';
            const titleEl = document.createElement('h3');
            titleEl.className = 'ft-modal-title';
            titleEl.textContent = title;
            header.appendChild(titleEl);

            const body = document.createElement('div');
            body.className = 'card-body ft-modal-body';

            if (message) {
                const messageEl = document.createElement('div');
                messageEl.className = 'import-export-hint nanah-managed-modal__intro';
                messageEl.textContent = message;
                body.appendChild(messageEl);
            }

            if (intro) {
                const introEl = document.createElement('div');
                introEl.className = 'nanah-managed-modal__section-copy';
                introEl.textContent = intro;
                body.appendChild(introEl);
            }

            const initialScopes = getNanahScopeList(initialPolicy.allowedScopes || initialPolicy.defaultScope || 'active');
            const lockedScopes = getNanahScopeList(requiredScopes);
            let initialDefaultScope = normalizeString(initialPolicy.defaultScope).toLowerCase();
            if (!initialScopes.includes(initialDefaultScope)) {
                initialDefaultScope = initialScopes[0];
            }
            const initialApplyMode = normalizeString(initialPolicy.applyMode).toLowerCase() === 'replace' ? 'replace' : 'merge';
            const initialTargetProfileBehavior = forceFixedTargetProfile
                ? 'fixed_profile'
                : getNanahTargetProfileBehavior(initialPolicy.targetProfileBehavior, 'current_active');

            const scopeSection = document.createElement('section');
            scopeSection.className = 'nanah-managed-modal__section';
            const scopeTitle = document.createElement('div');
            scopeTitle.className = 'nanah-managed-modal__section-title';
            scopeTitle.textContent = 'Allowed scopes';
            const scopeCopy = document.createElement('div');
            scopeCopy.className = 'nanah-managed-modal__section-copy';
            scopeCopy.textContent = lockedScopes.length > 0
                ? `Choose which scopes this trusted link is allowed to sync in future sessions. ${describeNanahScopeList(lockedScopes)} must stay enabled for the current approval.`
                : 'Choose which scopes this trusted link is allowed to sync in future sessions.';
            const scopeGrid = document.createElement('div');
            scopeGrid.className = 'nanah-managed-modal__scope-grid';
            const scopeInputs = new Map();
            scopeOptions.forEach((scope) => {
                const label = document.createElement('label');
                label.className = 'nanah-managed-modal__scope';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.value = scope;
                input.checked = initialScopes.includes(scope) || lockedScopes.includes(scope);
                if (lockedScopes.includes(scope)) {
                    input.disabled = true;
                }
                const cardEl = document.createElement('span');
                cardEl.className = 'nanah-managed-modal__scope-card';
                const strong = document.createElement('strong');
                strong.textContent = getNanahScopeLabel(scope);
                const desc = document.createElement('span');
                desc.textContent = getNanahScopeDescription(scope);
                cardEl.appendChild(strong);
                cardEl.appendChild(desc);
                label.appendChild(input);
                label.appendChild(cardEl);
                scopeGrid.appendChild(label);
                scopeInputs.set(scope, input);
            });
            scopeSection.appendChild(scopeTitle);
            scopeSection.appendChild(scopeCopy);
            scopeSection.appendChild(scopeGrid);
            body.appendChild(scopeSection);

            const defaultSection = document.createElement('section');
            defaultSection.className = 'nanah-managed-modal__section';
            const defaultTitle = document.createElement('div');
            defaultTitle.className = 'nanah-managed-modal__section-title';
            defaultTitle.textContent = 'Default scope';
            const defaultCopy = document.createElement('div');
            defaultCopy.className = 'nanah-managed-modal__section-copy';
            defaultCopy.textContent = 'Choose which scope this link should treat as the main managed target.';
            const defaultGrid = document.createElement('div');
            defaultGrid.className = 'nanah-managed-modal__scope-grid';
            const defaultInputs = new Map();
            scopeOptions.forEach((scope) => {
                const label = document.createElement('label');
                label.className = 'nanah-managed-modal__scope';
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = `nanah-managed-default-${Date.now()}`;
                input.value = scope;
                input.checked = scope === initialDefaultScope;
                const cardEl = document.createElement('span');
                cardEl.className = 'nanah-managed-modal__scope-card';
                const strong = document.createElement('strong');
                strong.textContent = getNanahScopeLabel(scope);
                const desc = document.createElement('span');
                desc.textContent = 'Used as the primary managed scope.';
                cardEl.appendChild(strong);
                cardEl.appendChild(desc);
                label.appendChild(input);
                label.appendChild(cardEl);
                defaultGrid.appendChild(label);
                defaultInputs.set(scope, input);
            });
            defaultSection.appendChild(defaultTitle);
            defaultSection.appendChild(defaultCopy);
            defaultSection.appendChild(defaultGrid);
            body.appendChild(defaultSection);

            const modeSection = document.createElement('section');
            modeSection.className = 'nanah-managed-modal__section';
            const modeTitle = document.createElement('div');
            modeTitle.className = 'nanah-managed-modal__section-title';
            modeTitle.textContent = 'Apply mode';
            const modeGrid = document.createElement('div');
            modeGrid.className = 'nanah-managed-modal__mode-grid';
            const mergeLabel = document.createElement('label');
            mergeLabel.className = 'nanah-managed-modal__mode';
            const mergeInput = document.createElement('input');
            mergeInput.type = 'radio';
            mergeInput.name = `nanah-managed-mode-${Date.now()}`;
            mergeInput.value = 'merge';
            mergeInput.checked = initialApplyMode !== 'replace';
            const mergeCard = document.createElement('span');
            mergeCard.className = 'nanah-managed-modal__mode-card';
            mergeCard.innerHTML = '<strong>Merge</strong><span>Keep existing items and add the incoming snapshot into the same scope.</span>';
            mergeLabel.appendChild(mergeInput);
            mergeLabel.appendChild(mergeCard);
            const replaceLabel = document.createElement('label');
            replaceLabel.className = 'nanah-managed-modal__mode';
            const replaceInput = document.createElement('input');
            replaceInput.type = 'radio';
            replaceInput.name = mergeInput.name;
            replaceInput.value = 'replace';
            replaceInput.checked = initialApplyMode === 'replace';
            const replaceCard = document.createElement('span');
            replaceCard.className = 'nanah-managed-modal__mode-card';
            replaceCard.innerHTML = '<strong>Replace</strong><span>Overwrite the target scope with the incoming snapshot for stricter managed control.</span>';
            replaceLabel.appendChild(replaceInput);
            replaceLabel.appendChild(replaceCard);
            modeGrid.appendChild(mergeLabel);
            modeGrid.appendChild(replaceLabel);
            modeSection.appendChild(modeTitle);
            modeSection.appendChild(modeGrid);
            body.appendChild(modeSection);

            let autoApplyInput = null;
            if (showAutoApply) {
                const autoSection = document.createElement('section');
                autoSection.className = 'nanah-managed-modal__section';
                const toggle = document.createElement('label');
                toggle.className = 'nanah-managed-modal__toggle';
                autoApplyInput = document.createElement('input');
                autoApplyInput.type = 'checkbox';
                autoApplyInput.checked = safeObject(initialPolicy).autoApplyControlProposals === true;
                const toggleCopy = document.createElement('div');
                const toggleTitle = document.createElement('strong');
                toggleTitle.textContent = 'Auto-apply future matching updates';
                const toggleBody = document.createElement('span');
                toggleBody.textContent = 'Only future proposals that match this saved scope and policy will skip the approval step.';
                toggleCopy.appendChild(toggleTitle);
                toggleCopy.appendChild(toggleBody);
                toggle.appendChild(autoApplyInput);
                toggle.appendChild(toggleCopy);
                autoSection.appendChild(toggle);
                body.appendChild(autoSection);
            }

            let reconnectFastInput = null;
            let reconnectApprovalInput = null;
            if (showReconnectMode) {
                const reconnectSection = document.createElement('section');
                reconnectSection.className = 'nanah-managed-modal__section';
                const reconnectTitle = document.createElement('div');
                reconnectTitle.className = 'nanah-managed-modal__section-title';
                reconnectTitle.textContent = 'Reconnect behavior';
                const reconnectCopy = document.createElement('div');
                reconnectCopy.className = 'nanah-managed-modal__section-copy';
                reconnectCopy.textContent = 'Choose whether future trusted reconnects should be as direct as possible or still require a fresh approval on this device.';
                const reconnectGrid = document.createElement('div');
                reconnectGrid.className = 'nanah-managed-modal__mode-grid';

                const fastLabel = document.createElement('label');
                fastLabel.className = 'nanah-managed-modal__mode';
                reconnectFastInput = document.createElement('input');
                reconnectFastInput.type = 'radio';
                reconnectFastInput.name = `nanah-managed-reconnect-${Date.now()}`;
                reconnectFastInput.value = 'fast';
                reconnectFastInput.checked = getNanahReconnectMode(initialPolicy.reconnectMode, 'fast') === 'fast';
                const fastCard = document.createElement('span');
                fastCard.className = 'nanah-managed-modal__mode-card';
                fastCard.innerHTML = '<strong>Fast reconnect</strong><span>Trust is already saved. Future sessions should reopen quickly, then follow the saved policy.</span>';
                fastLabel.appendChild(reconnectFastInput);
                fastLabel.appendChild(fastCard);

                const approvalLabel = document.createElement('label');
                approvalLabel.className = 'nanah-managed-modal__mode';
                reconnectApprovalInput = document.createElement('input');
                reconnectApprovalInput.type = 'radio';
                reconnectApprovalInput.name = reconnectFastInput.name;
                reconnectApprovalInput.value = 'approval_needed';
                reconnectApprovalInput.checked = getNanahReconnectMode(initialPolicy.reconnectMode, 'fast') === 'approval_needed';
                const approvalCard = document.createElement('span');
                approvalCard.className = 'nanah-managed-modal__mode-card';
                approvalCard.innerHTML = '<strong>Approval needed</strong><span>Future reconnects should still stop for a fresh approval on this device before the session continues.</span>';
                approvalLabel.appendChild(reconnectApprovalInput);
                approvalLabel.appendChild(approvalCard);

                reconnectGrid.appendChild(fastLabel);
                reconnectGrid.appendChild(approvalLabel);
                reconnectSection.appendChild(reconnectTitle);
                reconnectSection.appendChild(reconnectCopy);
                reconnectSection.appendChild(reconnectGrid);
                body.appendChild(reconnectSection);
            }

            let targetCurrentInput = null;
            let targetFixedInput = null;
            if (showTargetProfileMapping) {
                const targetSection = document.createElement('section');
                targetSection.className = 'nanah-managed-modal__section';
                const targetTitle = document.createElement('div');
                targetTitle.className = 'nanah-managed-modal__section-title';
                targetTitle.textContent = 'Target profile on this device';
                const targetCopy = document.createElement('div');
                targetCopy.className = 'nanah-managed-modal__section-copy';
                targetCopy.textContent = forceFixedTargetProfile
                    ? `This managed link will always write into ${localProfileContext.profileName} on this device. This keeps parent -> child sync predictable even if a different profile is active later.`
                    : 'Choose whether future managed updates should follow whatever profile is active here at receive time, or always land in this current local profile.';
                const targetGrid = document.createElement('div');
                targetGrid.className = 'nanah-managed-modal__mode-grid';

                const currentLabel = document.createElement('label');
                currentLabel.className = 'nanah-managed-modal__mode';
                targetCurrentInput = document.createElement('input');
                targetCurrentInput.type = 'radio';
                targetCurrentInput.name = `nanah-managed-target-${Date.now()}`;
                targetCurrentInput.value = 'current_active';
                targetCurrentInput.checked = !forceFixedTargetProfile && initialTargetProfileBehavior === 'current_active';
                targetCurrentInput.disabled = forceFixedTargetProfile;
                const currentCard = document.createElement('span');
                currentCard.className = 'nanah-managed-modal__mode-card';
                currentCard.innerHTML = '<strong>Current active profile</strong><span>Future managed updates follow whichever profile is active on this device at receive time.</span>';
                currentLabel.appendChild(targetCurrentInput);
                currentLabel.appendChild(currentCard);

                const fixedLabel = document.createElement('label');
                fixedLabel.className = 'nanah-managed-modal__mode';
                targetFixedInput = document.createElement('input');
                targetFixedInput.type = 'radio';
                targetFixedInput.name = targetCurrentInput.name;
                targetFixedInput.value = 'fixed_profile';
                targetFixedInput.checked = forceFixedTargetProfile || initialTargetProfileBehavior === 'fixed_profile';
                const fixedCard = document.createElement('span');
                fixedCard.className = 'nanah-managed-modal__mode-card';
                fixedCard.innerHTML = `<strong>Always this local profile</strong><span>Managed updates always land in ${localProfileContext.profileName} on this device, even if another profile is active later.</span>`;
                fixedLabel.appendChild(targetFixedInput);
                fixedLabel.appendChild(fixedCard);

                targetGrid.appendChild(currentLabel);
                targetGrid.appendChild(fixedLabel);
                targetSection.appendChild(targetTitle);
                targetSection.appendChild(targetCopy);
                targetSection.appendChild(targetGrid);
                body.appendChild(targetSection);
            }

            let childLockRequireInput = null;
            let childLockAllowInput = null;
            let childProtectionStandardInput = null;
            let childProtectionStrictInput = null;
            if (showLockedChildMode) {
                const childProtectionSection = document.createElement('section');
                childProtectionSection.className = 'nanah-managed-modal__section';
                const childProtectionTitle = document.createElement('div');
                childProtectionTitle.className = 'nanah-managed-modal__section-title';
                childProtectionTitle.textContent = 'Child protection level';
                const childProtectionCopy = document.createElement('div');
                childProtectionCopy.className = 'nanah-managed-modal__section-copy';
                childProtectionCopy.textContent = 'Choose whether this child link should follow the custom managed settings below, or force the safest managed behavior automatically.';
                const childProtectionGrid = document.createElement('div');
                childProtectionGrid.className = 'nanah-managed-modal__mode-grid';

                const childProtectionName = `nanah-managed-child-protection-${Date.now()}`;
                const standardLabel = document.createElement('label');
                standardLabel.className = 'nanah-managed-modal__mode';
                childProtectionStandardInput = document.createElement('input');
                childProtectionStandardInput.type = 'radio';
                childProtectionStandardInput.name = childProtectionName;
                childProtectionStandardInput.value = 'standard';
                childProtectionStandardInput.checked = getNanahChildProtectionLevel(initialPolicy.childProtectionLevel, 'standard') !== 'strict';
                const standardCard = document.createElement('span');
                standardCard.className = 'nanah-managed-modal__mode-card';
                standardCard.innerHTML = '<strong>Standard</strong><span>Use the managed settings below for reconnect, lock handling, and future matching updates.</span>';
                standardLabel.appendChild(childProtectionStandardInput);
                standardLabel.appendChild(standardCard);

                const strictLabel = document.createElement('label');
                strictLabel.className = 'nanah-managed-modal__mode';
                childProtectionStrictInput = document.createElement('input');
                childProtectionStrictInput.type = 'radio';
                childProtectionStrictInput.name = childProtectionName;
                childProtectionStrictInput.value = 'strict';
                childProtectionStrictInput.checked = getNanahChildProtectionLevel(initialPolicy.childProtectionLevel, 'standard') === 'strict';
                const strictCard = document.createElement('span');
                strictCard.className = 'nanah-managed-modal__mode-card';
                strictCard.innerHTML = '<strong>Strict</strong><span>Force approval-needed reconnect, local unlock required, and no auto-apply for this child link.</span>';
                strictLabel.appendChild(childProtectionStrictInput);
                strictLabel.appendChild(strictCard);

                childProtectionGrid.appendChild(standardLabel);
                childProtectionGrid.appendChild(strictLabel);
                childProtectionSection.appendChild(childProtectionTitle);
                childProtectionSection.appendChild(childProtectionCopy);
                childProtectionSection.appendChild(childProtectionGrid);
                body.appendChild(childProtectionSection);

                const childLockSection = document.createElement('section');
                childLockSection.className = 'nanah-managed-modal__section';
                const childLockTitle = document.createElement('div');
                childLockTitle.className = 'nanah-managed-modal__section-title';
                childLockTitle.textContent = 'Locked child profile behavior';
                const childLockCopy = document.createElement('div');
                childLockCopy.className = 'nanah-managed-modal__section-copy';
                childLockCopy.textContent = 'Choose whether this trusted parent/source must wait for a local unlock on the child profile, or may apply matching managed updates while the child profile stays locked. This permission is saved only on this device.';
                const childLockGrid = document.createElement('div');
                childLockGrid.className = 'nanah-managed-modal__mode-grid';

                const requireLabel = document.createElement('label');
                requireLabel.className = 'nanah-managed-modal__mode';
                childLockRequireInput = document.createElement('input');
                childLockRequireInput.type = 'radio';
                childLockRequireInput.name = `nanah-managed-child-lock-${Date.now()}`;
                childLockRequireInput.value = 'require_unlock';
                childLockRequireInput.checked = getNanahLockedChildMode(initialPolicy.lockedChildMode, 'require_unlock') === 'require_unlock';
                const requireCard = document.createElement('span');
                requireCard.className = 'nanah-managed-modal__mode-card';
                requireCard.innerHTML = '<strong>Require local unlock</strong><span>The child profile must be locally unlocked before managed updates can apply.</span>';
                requireLabel.appendChild(childLockRequireInput);
                requireLabel.appendChild(requireCard);

                const allowLabel = document.createElement('label');
                allowLabel.className = 'nanah-managed-modal__mode';
                childLockAllowInput = document.createElement('input');
                childLockAllowInput.type = 'radio';
                childLockAllowInput.name = childLockRequireInput.name;
                childLockAllowInput.value = 'allow_trusted_updates';
                childLockAllowInput.checked = getNanahLockedChildMode(initialPolicy.lockedChildMode, 'require_unlock') === 'allow_trusted_updates';
                const allowCard = document.createElement('span');
                allowCard.className = 'nanah-managed-modal__mode-card';
                allowCard.innerHTML = '<strong>Allow trusted updates while locked</strong><span>Matching managed updates from this trusted parent/source may apply without unlocking the child profile each time.</span>';
                allowLabel.appendChild(childLockAllowInput);
                allowLabel.appendChild(allowCard);

                childLockGrid.appendChild(requireLabel);
                childLockGrid.appendChild(allowLabel);
                childLockSection.appendChild(childLockTitle);
                childLockSection.appendChild(childLockCopy);
                childLockSection.appendChild(childLockGrid);
                body.appendChild(childLockSection);
            }

            const errorEl = document.createElement('div');
            errorEl.className = 'nanah-managed-modal__error';
            errorEl.dataset.visible = 'false';
            body.appendChild(errorEl);

            const actions = document.createElement('div');
            actions.className = 'ft-modal-actions nanah-managed-modal__actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn-secondary';
            cancelBtn.textContent = cancelLabel;
            actions.appendChild(cancelBtn);

            const readPolicy = () => {
                const allowedScopes = scopeOptions.filter((scope) => scopeInputs.get(scope)?.checked || lockedScopes.includes(scope));
                if (allowedScopes.length === 0) {
                    errorEl.textContent = 'Pick at least one allowed scope before saving this managed link.';
                    errorEl.dataset.visible = 'true';
                    return null;
                }
                if (lockedScopes.some((scope) => !allowedScopes.includes(scope))) {
                    errorEl.textContent = `${describeNanahScopeList(lockedScopes)} must stay enabled for this approval.`;
                    errorEl.dataset.visible = 'true';
                    return null;
                }
                let defaultScope = scopeOptions.find((scope) => defaultInputs.get(scope)?.checked);
                if (!allowedScopes.includes(defaultScope)) {
                    defaultScope = allowedScopes[0];
                }
                errorEl.dataset.visible = 'false';
                const childProtectionLevel = childProtectionStrictInput?.checked === true ? 'strict' : 'standard';
                const targetProfileBehavior = showTargetProfileMapping
                    ? ((forceFixedTargetProfile || childProtectionLevel === 'strict' || targetFixedInput?.checked === true) ? 'fixed_profile' : 'current_active')
                    : 'current_active';
                return {
                    allowedScopes,
                    defaultScope,
                    applyMode: replaceInput.checked ? 'replace' : 'merge',
                    autoApplyControlProposals: childProtectionLevel === 'strict' ? false : (autoApplyInput?.checked === true),
                    reconnectMode: childProtectionLevel === 'strict' ? 'approval_needed' : (reconnectApprovalInput?.checked === true ? 'approval_needed' : 'fast'),
                    lockedChildMode: childProtectionLevel === 'strict' ? 'require_unlock' : (childLockAllowInput?.checked === true ? 'allow_trusted_updates' : 'require_unlock'),
                    childProtectionLevel,
                    targetProfileBehavior,
                    targetProfileId: targetProfileBehavior === 'fixed_profile' ? localProfileContext.profileId : '',
                    targetProfileName: targetProfileBehavior === 'fixed_profile' ? localProfileContext.profileName : ''
                };
            };

            const syncDefaultScopeState = () => {
                const allowedScopes = scopeOptions.filter((scope) => scopeInputs.get(scope)?.checked || lockedScopes.includes(scope));
                let activeDefault = scopeOptions.find((scope) => defaultInputs.get(scope)?.checked);
                scopeOptions.forEach((scope) => {
                    const enabled = allowedScopes.includes(scope);
                    const radio = defaultInputs.get(scope);
                    if (!radio) return;
                    radio.disabled = !enabled;
                    if (!enabled) {
                        radio.checked = false;
                    }
                });
                if (!allowedScopes.includes(activeDefault)) {
                    const fallback = allowedScopes[0];
                    if (fallback && defaultInputs.get(fallback)) {
                        defaultInputs.get(fallback).checked = true;
                    }
                }
            };

            scopeInputs.forEach((input) => {
                input.addEventListener('change', syncDefaultScopeState);
            });
            syncDefaultScopeState();

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
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    closeWith(null);
                }
            });

            if (allowApplyOnce) {
                const applyBtn = document.createElement('button');
                applyBtn.type = 'button';
                applyBtn.className = 'btn-secondary';
                applyBtn.textContent = applyOnceLabel;
                applyBtn.addEventListener('click', () => {
                    const policy = readPolicy();
                    if (!policy) return;
                    closeWith({ action: 'apply_once', policy });
                });
                actions.appendChild(applyBtn);
            }

            if (allowSave) {
                const saveBtn = document.createElement('button');
                saveBtn.type = 'button';
                saveBtn.className = 'btn-primary';
                saveBtn.textContent = saveLabel;
                saveBtn.addEventListener('click', () => {
                    const policy = readPolicy();
                    if (!policy) return;
                    closeWith({ action: 'save', policy });
                });
                actions.appendChild(saveBtn);
                requestAnimationFrame(() => {
                    try {
                        saveBtn.focus();
                    } catch (e) {
                    }
                });
            }

            card.appendChild(header);
            card.appendChild(body);
            card.appendChild(actions);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
        });
    }

    function normalizeNanahTrustedLink(entry) {
        const raw = safeObject(entry);
        const remoteDeviceId = normalizeString(raw.remoteDeviceId);
        if (!remoteDeviceId) return null;

        const localRole = (() => {
            const value = normalizeString(raw.localRole).toLowerCase();
            return value === 'source' || value === 'replica' || value === 'peer' ? value : 'peer';
        })();
        const remoteRole = (() => {
            const value = normalizeString(raw.remoteRole || raw.role).toLowerCase();
            return value === 'source' || value === 'replica' || value === 'peer' ? value : 'peer';
        })();
        const derivedLinkType = classifyNanahTrustedLink(localRole, remoteRole);
        const requestedLinkType = normalizeString(raw.linkType || safeObject(raw.policy).linkType);
        const linkType = requestedLinkType === 'managed_link' || requestedLinkType === 'peer_link'
            ? requestedLinkType
            : (derivedLinkType || 'peer_link');
        const normalizedScopes = getNanahScopeList(safeObject(raw.policy).allowedScopes || raw.allowedScopes || safeObject(raw.policy).defaultScope || raw.defaultScope);
        const applyMode = normalizeString(safeObject(raw.policy).applyMode || raw.applyMode).toLowerCase() === 'replace' ? 'replace' : 'merge';
        const autoApply = safeObject(raw.policy).autoApplyControlProposals === true;
        const reconnectMode = getNanahReconnectMode(safeObject(raw.policy).reconnectMode || raw.reconnectMode, linkType === 'managed_link' ? 'approval_needed' : 'fast');
        const lockedChildMode = getNanahLockedChildMode(safeObject(raw.policy).lockedChildMode || raw.lockedChildMode, 'require_unlock');
        const childProtectionLevel = getNanahChildProtectionLevel(safeObject(raw.policy).childProtectionLevel || raw.childProtectionLevel, 'standard');
        const targetProfileBehavior = getNanahTargetProfileBehavior(
            safeObject(raw.policy).targetProfileBehavior || raw.targetProfileBehavior,
            'current_active'
        );
        const targetProfileId = normalizeString(safeObject(raw.policy).targetProfileId || raw.targetProfileId);
        const targetProfileName = normalizeString(safeObject(raw.policy).targetProfileName || raw.targetProfileName);

        return {
            ...raw,
            linkId: normalizeString(raw.linkId) || `nanah-${remoteDeviceId}`,
            remoteDeviceId,
            deviceLabel: normalizeString(raw.deviceLabel) || remoteDeviceId,
            app: 'filtertube',
            localRole,
            remoteRole,
            linkType,
            createdAt: normalizeString(raw.createdAt) || new Date().toISOString(),
            lastUsedAt: normalizeString(raw.lastUsedAt) || new Date().toISOString(),
            policy: {
                ...safeObject(raw.policy),
                linkType,
                decisionMode: linkType === 'managed_link' ? 'source' : 'receiver',
                allowedScopes: normalizedScopes,
                defaultScope: normalizeString(safeObject(raw.policy).defaultScope) || normalizedScopes[0],
                applyMode,
                autoApplyControlProposals: linkType === 'managed_link' && autoApply,
                reconnectMode,
                lockedChildMode,
                childProtectionLevel,
                targetProfileBehavior,
                targetProfileId: targetProfileBehavior === 'fixed_profile' ? targetProfileId : '',
                targetProfileName: targetProfileBehavior === 'fixed_profile' ? targetProfileName : ''
            }
        };
    }

    function getManagedNanahLinkPolicy(link) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted || trusted.linkType !== 'managed_link') return null;
        return safeObject(trusted.policy);
    }

    function getNanahCurrentTrustedLink() {
        const remoteId = normalizeString(safeObject(nanahSessionState.remoteDevice).deviceId);
        return remoteId ? findNanahTrustedLink(remoteId) : null;
    }

    function resolveNanahLocalTargetProfile(trustedLink, profilesV4 = profilesV4Cache) {
        const localProfiles = safeObject(profilesV4);
        const profiles = safeObject(localProfiles.profiles);
        const currentActiveId = normalizeString(localProfiles.activeProfileId) || normalizeString(activeProfileId) || 'default';
        const trusted = normalizeNanahTrustedLink(trustedLink);

        if (!trusted || trusted.linkType !== 'managed_link' || trusted.localRole !== 'replica' || trusted.remoteRole !== 'source') {
            return {
                behavior: 'current_active',
                profileId: currentActiveId,
                profileName: getProfileName(localProfiles, currentActiveId),
                profileType: getProfileType(localProfiles, currentActiveId),
                locked: isProfileLocked(localProfiles, currentActiveId) && !unlockedProfiles.has(currentActiveId)
            };
        }

        const behavior = getNanahTargetProfileBehavior(safeObject(trusted.policy).targetProfileBehavior, 'current_active');
        if (behavior !== 'fixed_profile') {
            return {
                behavior: 'current_active',
                profileId: currentActiveId,
                profileName: getProfileName(localProfiles, currentActiveId),
                profileType: getProfileType(localProfiles, currentActiveId),
                locked: isProfileLocked(localProfiles, currentActiveId) && !unlockedProfiles.has(currentActiveId)
            };
        }

        const targetProfileId = normalizeString(safeObject(trusted.policy).targetProfileId);
        if (!targetProfileId || !profiles[targetProfileId]) {
            throw new Error('This managed link targets a profile that no longer exists on this device. Edit the link before receiving more updates.');
        }

        return {
            behavior: 'fixed_profile',
            profileId: targetProfileId,
            profileName: normalizeString(safeObject(trusted.policy).targetProfileName) || getProfileName(localProfiles, targetProfileId),
            profileType: getProfileType(localProfiles, targetProfileId),
            locked: isProfileLocked(localProfiles, targetProfileId) && !unlockedProfiles.has(targetProfileId)
        };
    }

    function resolveNanahTargetProfileFromPolicy(policy, profilesV4 = profilesV4Cache) {
        const localProfiles = safeObject(profilesV4);
        const profiles = safeObject(localProfiles.profiles);
        const currentActiveId = normalizeString(localProfiles.activeProfileId) || normalizeString(activeProfileId) || 'default';
        const behavior = getNanahTargetProfileBehavior(safeObject(policy).targetProfileBehavior, 'current_active');

        if (behavior !== 'fixed_profile') {
            return {
                behavior: 'current_active',
                profileId: currentActiveId,
                profileName: getProfileName(localProfiles, currentActiveId),
                profileType: getProfileType(localProfiles, currentActiveId),
                locked: isProfileLocked(localProfiles, currentActiveId) && !unlockedProfiles.has(currentActiveId)
            };
        }

        const targetProfileId = normalizeString(safeObject(policy).targetProfileId) || currentActiveId;
        if (!profiles[targetProfileId]) {
            throw new Error('The selected target profile is no longer available on this device.');
        }

        return {
            behavior: 'fixed_profile',
            profileId: targetProfileId,
            profileName: normalizeString(safeObject(policy).targetProfileName) || getProfileName(localProfiles, targetProfileId),
            profileType: getProfileType(localProfiles, targetProfileId),
            locked: isProfileLocked(localProfiles, targetProfileId) && !unlockedProfiles.has(targetProfileId)
        };
    }

    function resolveNanahExplicitTargetProfile(profileContext, profilesV4 = profilesV4Cache) {
        const profile = normalizeNanahProfileContext(profileContext);
        if (!normalizeString(profile.profileId)) return null;
        return resolveNanahTargetProfileFromPolicy({
            targetProfileBehavior: 'fixed_profile',
            targetProfileId: profile.profileId,
            targetProfileName: profile.profileName
        }, profilesV4);
    }

    function buildNanahHelloTargetProfileContext() {
        const localRole = getNanahRole();
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || 'peer';
        if (localRole !== 'replica' || remoteRole !== 'source') return null;
        const trustedLink = getNanahCurrentTrustedLink();
        if (!trustedLink || normalizeString(safeObject(trustedLink).linkType) !== 'managed_link') return null;
        const targetProfile = resolveNanahLocalTargetProfile(trustedLink);
        return {
            behavior: targetProfile.behavior,
            profileId: targetProfile.behavior === 'fixed_profile' ? targetProfile.profileId : '',
            profileName: targetProfile.behavior === 'fixed_profile' ? targetProfile.profileName : '',
            profileType: targetProfile.behavior === 'fixed_profile' ? targetProfile.profileType : '',
            locked: targetProfile.behavior === 'fixed_profile' ? targetProfile.locked === true : false
        };
    }

    function getNanahSelectedRemoteTargetProfileId() {
        return normalizeString(ftNanahRemoteTarget?.value);
    }

    function getNanahSelectedRemoteTargetProfile() {
        const selectedId = getNanahSelectedRemoteTargetProfileId();
        if (!selectedId) return null;
        const inventory = normalizeNanahProfileInventory(nanahSessionState.remoteProfileInventory);
        return inventory.find((entry) => normalizeString(entry.profileId) === selectedId) || null;
    }

    function syncNanahRemoteTargetOptions() {
        if (!ftNanahRemoteTarget) return;
        const inventory = normalizeNanahProfileInventory(nanahSessionState.remoteProfileInventory);
        const previous = normalizeString(ftNanahRemoteTarget.value);
        ftNanahRemoteTarget.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Use remote active profile';
        ftNanahRemoteTarget.appendChild(defaultOption);

        inventory.forEach((entry) => {
            const option = document.createElement('option');
            option.value = entry.profileId;
            option.textContent = `${entry.profileName} (${getNanahProfileTypeLabel(entry.profileType, entry.profileId)})${entry.locked ? ' · locked' : ''}`;
            ftNanahRemoteTarget.appendChild(option);
        });

        const activeRemoteId = normalizeString(safeObject(nanahSessionState.remoteProfile).profileId);
        if (previous && inventory.some((entry) => normalizeString(entry.profileId) === previous)) {
            ftNanahRemoteTarget.value = previous;
        } else if (activeRemoteId && inventory.some((entry) => normalizeString(entry.profileId) === activeRemoteId)) {
            ftNanahRemoteTarget.value = activeRemoteId;
        } else {
            ftNanahRemoteTarget.value = '';
        }
    }

    async function ensureNanahManagedChildLinkPermission(policy) {
        if (!isActiveChildNanahProfile()) return true;
        if (getNanahLockedChildMode(safeObject(policy).lockedChildMode, 'require_unlock') !== 'allow_trusted_updates') {
            return true;
        }
        const io = window.FilterTubeIO || {};
        const profilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const activeId = normalizeString(profilesV4?.activeProfileId) || activeProfileId || 'default';
        const unlocked = await ensureProfileUnlocked(profilesV4, activeId);
        if (!unlocked) {
            UIComponents.showToast('Unlock this child profile to allow trusted parent updates while it is locked later.', 'error');
            return false;
        }
        return true;
    }

    function isCurrentNanahManagedLink() {
        const trusted = getNanahCurrentTrustedLink();
        return safeObject(trusted).linkType === 'managed_link';
    }

    function getNanahCapabilitiesForRole(role) {
        if (role === 'source') {
            return ['sync.send', 'control.propose', 'device.link'];
        }
        if (role === 'replica') {
            return ['sync.receive', 'control.apply', 'device.link'];
        }
        return ['sync.send', 'sync.receive', 'control.propose', 'control.apply', 'device.link'];
    }

    function buildNanahPairUri(code) {
        const normalizedCode = normalizeNanahCode(code);
        if (!normalizedCode) return '';
        const relay = normalizeString(window.FilterTubeNanah?.DEFAULT_NANAH_SIGNALING_URL);
        const params = new URLSearchParams();
        params.set('app', 'filtertube');
        params.set('code', normalizedCode);
        if (relay) params.set('relay', relay);
        return `nanah://pair?${params.toString()}`;
    }

    function getNanahRemoteLabel() {
        const remote = safeObject(nanahSessionState.remoteDevice);
        return normalizeString(remote.deviceLabel) || normalizeString(remote.deviceId) || 'Unknown device';
    }

    function normalizeNanahProfileContext(value) {
        const raw = safeObject(value);
        const profileId = normalizeString(raw.profileId);
        const profileType = normalizeString(raw.profileType).toLowerCase() === 'child' ? 'child' : 'account';
        return {
            profileId,
            profileName: normalizeString(raw.profileName) || (profileId === 'default' ? 'Default' : (profileId || 'Unknown profile')),
            profileType,
            locked: raw.locked === true
        };
    }

    function normalizeNanahTargetProfileContext(value) {
        const raw = safeObject(value);
        const behavior = getNanahTargetProfileBehavior(raw.behavior || raw.targetProfileBehavior, 'current_active');
        return {
            behavior,
            profileId: behavior === 'fixed_profile' ? normalizeString(raw.profileId) : '',
            profileName: behavior === 'fixed_profile' ? normalizeString(raw.profileName) : '',
            profileType: behavior === 'fixed_profile' ? normalizeString(raw.profileType).toLowerCase() : '',
            locked: raw.locked === true
        };
    }

    function resolveNanahDisplayTargetProfile(details, trustedLink) {
        const envelopeTarget = normalizeNanahProfileContext(details?.targetProfile);
        if (normalizeString(envelopeTarget.profileId)) {
            return envelopeTarget;
        }
        const policy = safeObject(safeObject(trustedLink)?.policy);
        if (getNanahTargetProfileBehavior(policy.targetProfileBehavior, 'current_active') === 'fixed_profile'
            && normalizeString(policy.targetProfileId)) {
            return {
                profileId: policy.targetProfileId,
                profileName: normalizeString(policy.targetProfileName) || policy.targetProfileId,
                profileType: normalizeString(policy.targetProfileType) || 'account',
                locked: false
            };
        }
        return getNanahLocalProfileContext();
    }

    function formatNanahProfileContext(value) {
        const profile = normalizeNanahProfileContext(value);
        const parts = [`${profile.profileName} (${getNanahProfileTypeLabel(profile.profileType, profile.profileId)})`];
        if (profile.locked) {
            parts.push('locked');
        }
        return parts.join(', ');
    }

    function buildNanahTargetHint(scope = getNanahScope()) {
        const normalizedScope = normalizeString(scope).toLowerCase() || 'active';
        if (normalizedScope === 'full') {
            return 'Full backup is the only scope that targets the wider account tree. Saved links still remember trust and policy only, not a live background connection.';
        }
        const remoteTargetProfile = normalizeNanahTargetProfileContext(nanahSessionState.remoteTargetProfile);
        const explicitRemoteTarget = getNanahSelectedRemoteTargetProfile();
        if (explicitRemoteTarget && normalizeString(explicitRemoteTarget.profileName)) {
            return `This live session is set to write into ${explicitRemoteTarget.profileName} on ${getNanahRemoteLabel()}, even if another remote profile is active right now.`;
        }
        if (remoteTargetProfile.behavior === 'fixed_profile' && normalizeString(remoteTargetProfile.profileName)) {
            return `${getNanahRemoteLabel()} saved this managed link to write into ${remoteTargetProfile.profileName}, even if another profile is active there later.`;
        }
        const remoteProfile = normalizeNanahProfileContext(nanahSessionState.remoteProfile);
        const localProfile = getNanahLocalProfileContext();
        const trusted = normalizeNanahTrustedLink(getNanahCurrentTrustedLink());
        if (trusted && trusted.localRole === 'replica' && trusted.remoteRole === 'source' && trusted.linkType === 'managed_link') {
            try {
                const targetProfile = resolveNanahLocalTargetProfile(trusted);
                if (targetProfile.behavior === 'fixed_profile') {
                    return `Managed updates from ${getNanahRemoteLabel()} will write into ${targetProfile.profileName} on this device, even if another local profile is active later.`;
                }
            } catch (error) {
                return error?.message || 'This managed link points to a profile that is no longer available on this device.';
            }
        }
        if (localProfile.profileType === 'child' && normalizeString(remoteProfile.profileName)) {
            return `This child profile will not safely target ${remoteProfile.profileName} on ${getNanahRemoteLabel()} unless that device saves a fixed managed target for this child first.`;
        }
        if (normalizeString(remoteProfile.profileName)) {
            return `${getNanahScopeLabel(normalizedScope)} will write into ${remoteProfile.profileName} on ${getNanahRemoteLabel()}. Inactive remote profiles are only targeted when you choose an explicit remote target or save a fixed managed target there.`;
        }
        return 'Updates write into the receiver\'s active profile by default, or a fixed profile if one was chosen. Saved links remember trust and policy, not a live background connection.';
    }

    async function ensureNanahStableDeviceId() {
        if (normalizeString(nanahStableDeviceId)) return nanahStableDeviceId;
        const stored = normalizeString(await readNanahStorage(NANAH_DEVICE_ID_KEY));
        if (stored) {
            nanahStableDeviceId = stored;
            return nanahStableDeviceId;
        }
        const generated = (() => {
            try {
                if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
                    return `ftnanah-${globalThis.crypto.randomUUID()}`;
                }
            } catch (error) {
            }
            return `ftnanah-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        })();
        nanahStableDeviceId = generated;
        await writeNanahStorage(NANAH_DEVICE_ID_KEY, generated);
        return nanahStableDeviceId;
    }

    async function loadNanahPreferredDeviceLabel() {
        const stored = normalizeString(await readNanahStorage(NANAH_DEVICE_LABEL_KEY));
        if (stored) return stored;
        try {
            const adapter = window.FilterTubeNanahAdapter || {};
            const descriptor = typeof adapter.getDeviceDescriptor === 'function'
                ? adapter.getDeviceDescriptor({ appVersion: manifestVersion })
                : null;
            return normalizeString(descriptor?.deviceLabel)
                || normalizeString(navigator?.platform)
                || 'Browser device';
        } catch (error) {
            return normalizeString(navigator?.platform) || 'Browser device';
        }
    }

    async function persistNanahPreferredDeviceLabel() {
        const nextLabel = normalizeString(ftNanahDeviceLabel?.value);
        if (!nextLabel) return false;
        return writeNanahStorage(NANAH_DEVICE_LABEL_KEY, nextLabel);
    }

    async function loadNanahUiModePreference() {
        return normalizeNanahUiMode(await readNanahStorage(NANAH_UI_MODE_KEY));
    }

    async function persistNanahUiModePreference(mode = getNanahUiMode()) {
        return writeNanahStorage(NANAH_UI_MODE_KEY, normalizeNanahUiMode(mode));
    }

    function getNanahSelectedText(selectEl, fallback) {
        try {
            const selected = selectEl?.selectedOptions?.[0];
            const label = normalizeString(selected?.textContent);
            if (label) return label;
        } catch (e) {
        }
        return fallback;
    }

    function refreshNanahAdvancedSummary() {
        if (!ftNanahAdvancedSummary) return;
        const roleLabel = getNanahSelectedText(ftNanahRole, getNanahRoleLabel());
        const scopeLabel = getNanahSelectedText(ftNanahScope, getNanahScopeLabel(getNanahScope()));
        const strategyLabel = getNanahSelectedText(ftNanahStrategy, getNanahStrategyLabel(getNanahStrategy()));
        ftNanahAdvancedSummary.textContent = `${roleLabel} · ${scopeLabel} · ${strategyLabel}`;
    }

    function enforceChildSyncSurfaceRestrictions() {
        if (!ftNanahChildBanner || !ftNanahChildBannerTitle || !ftNanahChildBannerBody) return;
        const isChild = isActiveChildNanahProfile();
        
        if (isChild) {
            if (ftNanahModeParent) ftNanahModeParent.hidden = true;
            if (ftNanahModeFull) ftNanahModeFull.hidden = true;
            ftNanahChildBanner.hidden = false;

            if (isNanahChildReplicaOnly()) {
                if (ftNanahModeSendOnce) {
                    ftNanahModeSendOnce.hidden = false;
                    ftNanahModeSendOnce.disabled = true;
                }
                ftNanahChildBannerTitle.textContent = "This child profile is restricted";
                ftNanahChildBannerBody.textContent = "Saved parent links can keep this profile aligned. To start new pairings or send settings, unlock the profile first.";
                if (ftNanahHostBtn) ftNanahHostBtn.disabled = true;
            } else {
                if (ftNanahModeSendOnce) {
                    ftNanahModeSendOnce.hidden = false;
                    ftNanahModeSendOnce.disabled = !!nanahClient;
                }
                ftNanahChildBannerTitle.textContent = "This is a child profile";
                ftNanahChildBannerBody.textContent = "You can send a one-time copy of your settings. Parent controls and full migration are available from a parent or account profile.";
                if (ftNanahHostBtn) ftNanahHostBtn.disabled = !!nanahClient || !!normalizeString(nanahSessionState.code);
            }
            
            if (nanahUiMode === 'parent_control' || nanahUiMode === 'full_account') {
                setNanahMode('send_once', { persist: false, applyPreset: true });
            }
        } else {
            if (ftNanahModeParent) ftNanahModeParent.hidden = false;
            if (ftNanahModeFull) ftNanahModeFull.hidden = false;
            if (ftNanahModeSendOnce) ftNanahModeSendOnce.hidden = false;
            ftNanahChildBanner.hidden = true;
            if (ftNanahModeSendOnce) ftNanahModeSendOnce.disabled = !!nanahClient;
        }
        refreshNanahAdvancedSummary();
    }

    function setNanahModeButtons(mode = getNanahUiMode()) {
        const normalized = normalizeNanahUiMode(mode);
        const childSurface = isChildProfileAdminSurface();
        const childReplicaOnly = childSurface && isNanahChildReplicaOnly();
        [
            ftNanahModeSendOnce,
            ftNanahModeParent,
            ftNanahModeFull
        ].forEach((button) => {
            if (!button) return;
            const buttonMode = normalizeNanahUiMode(button.dataset.mode);
            const active = buttonMode === normalized;
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            if (childSurface && (buttonMode === 'parent_control' || buttonMode === 'full_account')) {
                button.hidden = true;
            } else {
                button.hidden = false;
            }
            if (button === ftNanahModeSendOnce && childReplicaOnly) {
                button.disabled = true;
            } else {
                button.disabled = !!nanahClient;
            }
        });
    }

    function setNanahMode(mode, { persist = true, applyPreset = true } = {}) {
        const normalized = normalizeNanahUiMode(mode);
        nanahUiMode = normalized;
        setNanahModeButtons(normalized);
        if (persist) {
            void persistNanahUiModePreference(normalized);
        }

        if (!applyPreset || nanahClient) {
            updateNanahUi();
            return;
        }

        const childReplicaOnly = isNanahChildReplicaOnly();
        isApplyingNanahModePreset = true;
        try {
            if (normalized === 'parent_control') {
                if (ftNanahRole && !childReplicaOnly) ftNanahRole.value = 'source';
                if (ftNanahScope) ftNanahScope.value = 'active';
                if (ftNanahStrategy) ftNanahStrategy.value = 'merge';
            } else if (normalized === 'full_account') {
                if (ftNanahRole && !childReplicaOnly) ftNanahRole.value = 'peer';
                if (ftNanahScope) ftNanahScope.value = getActiveProfileType() === 'child' ? 'active' : 'full';
                if (ftNanahStrategy) ftNanahStrategy.value = 'merge';
                if (ftNanahRemoteTarget) ftNanahRemoteTarget.value = '';
            } else {
                if (ftNanahRole && !childReplicaOnly) ftNanahRole.value = 'peer';
                if (ftNanahScope) ftNanahScope.value = 'active';
                if (ftNanahStrategy) ftNanahStrategy.value = 'merge';
            }

            [ftNanahRole, ftNanahScope, ftNanahStrategy, ftNanahRemoteTarget].forEach((element) => {
                if (!element) return;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            });
        } finally {
            isApplyingNanahModePreset = false;
        }
        updateNanahUi();
    }

    async function confirmNanahRemoteTarget(scope) {
        const normalizedScope = normalizeString(scope).toLowerCase() || 'active';
        if (normalizedScope === 'full') return true;
        const localProfile = getNanahLocalProfileContext();
        const explicitRemoteTarget = getNanahSelectedRemoteTargetProfile();
        if (explicitRemoteTarget && normalizeString(explicitRemoteTarget.profileId)) {
            return true;
        }
        const remoteTargetProfile = normalizeNanahTargetProfileContext(nanahSessionState.remoteTargetProfile);
        if (localProfile.profileType === 'child' && remoteTargetProfile.behavior === 'fixed_profile') {
            return true;
        }
        const remoteProfile = normalizeNanahProfileContext(nanahSessionState.remoteProfile);
        if (!normalizeString(remoteProfile.profileId)) return true;
        if (normalizeString(localProfile.profileId) === normalizeString(remoteProfile.profileId)) return true;

        if (localProfile.profileType === 'child') {
            await showChoiceModal({
                title: 'Managed child target required',
                message: `You are sending ${getNanahScopeLabel(normalizedScope).toLowerCase()} from ${formatNanahProfileContext(localProfile)}, but ${getNanahRemoteLabel()} currently has ${formatNanahProfileContext(remoteProfile)} active.`,
                details: [
                    'For child profiles, FilterTube now blocks "send anyway" in this situation so the update does not land in the wrong remote profile.',
                    'To manage that child profile reliably, save a Source -> Replica managed link on the other device while its child profile is active once.',
                    'After that, choose "Always this local profile" on the receiving device so future parent updates can land there without switching profiles each time.'
                ],
                choices: [
                    {
                        value: 'ok',
                        label: 'Got It',
                        recommended: true
                    }
                ],
                cancelText: 'Cancel'
            });
            return false;
        }

        const response = await showChoiceModal({
            title: 'Remote active profile differs',
            message: `You are sending ${getNanahScopeLabel(normalizedScope).toLowerCase()} from ${formatNanahProfileContext(localProfile)}, but ${getNanahRemoteLabel()} currently has ${formatNanahProfileContext(remoteProfile)} active.`,
            details: [
                'This update will only follow the remote active profile unless you choose an explicit remote target or the receiving device already saved a fixed managed target.',
                `${getNanahScopeLabel(normalizedScope)} will apply to the remote device\'s current active profile, not to an inactive matching profile.`,
                'Switch the other device to the intended profile first, or use Full backup only if you really want the wider account tree.'
            ],
            choices: [
                {
                    value: 'continue',
                    label: 'Send Anyway'
                },
                {
                    value: 'cancel',
                    label: 'Cancel',
                    className: 'btn-secondary',
                    recommended: true
                }
            ],
            cancelText: 'Cancel'
        });

        return response === 'continue';
    }

    function findNanahTrustedLink(remoteDeviceId) {
        const deviceId = normalizeString(remoteDeviceId);
        if (!deviceId) return null;
        return nanahTrustedLinks.find((entry) => normalizeString(entry?.remoteDeviceId) === deviceId) || null;
    }

    async function readNanahStorage(key) {
        return new Promise((resolve) => {
            try {
                if (!runtimeAPI?.storage?.local?.get) {
                    resolve(null);
                    return;
                }
                const maybePromise = runtimeAPI.storage.local.get([key], (result) => {
                    const err = runtimeAPI.runtime?.lastError;
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(result ? result[key] : null);
                });
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then((result) => resolve(result ? result[key] : null)).catch(() => resolve(null));
                }
            } catch (error) {
                resolve(null);
            }
        });
    }

    async function writeNanahStorage(key, value) {
        return new Promise((resolve) => {
            try {
                if (!runtimeAPI?.storage?.local?.set) {
                    resolve(false);
                    return;
                }
                const maybePromise = runtimeAPI.storage.local.set({ [key]: value }, () => {
                    const err = runtimeAPI.runtime?.lastError;
                    resolve(!err);
                });
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then(() => resolve(true)).catch(() => resolve(false));
                }
            } catch (error) {
                resolve(false);
            }
        });
    }

    async function loadNanahTrustedLinks() {
        const stored = await readNanahStorage(NANAH_TRUSTED_LINKS_KEY);
        nanahTrustedLinks = Array.isArray(stored)
            ? stored
                .map((entry) => normalizeNanahTrustedLink(entry))
                .filter(Boolean)
            : [];
    }

    async function persistNanahTrustedLinks() {
        await writeNanahStorage(NANAH_TRUSTED_LINKS_KEY, nanahTrustedLinks);
    }

    async function saveNanahTrustedLink(entry) {
        const deviceId = normalizeString(entry?.remoteDeviceId);
        if (!deviceId) return;
        const nextEntry = {
            ...normalizeNanahTrustedLink({
                ...safeObject(entry),
                linkId: normalizeString(entry?.linkId) || `nanah-${deviceId}`,
                remoteDeviceId: deviceId,
                deviceLabel: normalizeString(entry?.deviceLabel) || deviceId,
                app: 'filtertube',
                createdAt: normalizeString(entry?.createdAt) || new Date().toISOString(),
                lastUsedAt: new Date().toISOString()
            })
        };
        const existingIndex = nanahTrustedLinks.findIndex((item) => normalizeString(item?.remoteDeviceId) === deviceId);
        if (existingIndex >= 0) {
            nanahTrustedLinks.splice(existingIndex, 1, {
                ...nanahTrustedLinks[existingIndex],
                ...nextEntry
            });
        } else {
            nanahTrustedLinks.unshift(nextEntry);
        }
        await persistNanahTrustedLinks();
        renderNanahTrustedLinks();
    }

    async function removeNanahTrustedLink(linkId) {
        const normalized = normalizeString(linkId);
        if (!normalized) return;
        nanahTrustedLinks = nanahTrustedLinks.filter((entry) => normalizeString(entry?.linkId) !== normalized);
        await persistNanahTrustedLinks();
        renderNanahTrustedLinks();
    }

    async function updateNanahTrustedLinkPolicy(linkId, updates = {}) {
        const normalized = normalizeString(linkId);
        if (!normalized) return false;
        const index = nanahTrustedLinks.findIndex((entry) => normalizeString(entry?.linkId) === normalized);
        if (index < 0) return false;
        const current = normalizeNanahTrustedLink(nanahTrustedLinks[index]);
        if (!current) return false;
        const next = normalizeNanahTrustedLink({
            ...current,
            ...safeObject(updates),
            policy: {
                ...safeObject(current.policy),
                ...safeObject(updates.policy)
            },
            lastUsedAt: current.lastUsedAt
        });
        if (!next) return false;
        nanahTrustedLinks.splice(index, 1, next);
        await persistNanahTrustedLinks();
        renderNanahTrustedLinks();
        return true;
    }

    async function markNanahTrustedLinkUsed(remoteDeviceId) {
        const link = findNanahTrustedLink(remoteDeviceId);
        if (!link) return;
        link.lastUsedAt = new Date().toISOString();
        await persistNanahTrustedLinks();
        renderNanahTrustedLinks();
    }

    async function configureNanahTrustedLink(link) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted) return;

        if (trusted.linkType !== 'managed_link') {
            UIComponents.showToast('Peer links do not have managed policy settings yet', 'info');
            return;
        }

        const currentPolicy = safeObject(trusted.policy);
        const nextPolicyDecision = await showNanahManagedLinkModal({
            title: 'Edit Managed Link',
            message: `Adjust what ${normalizeString(trusted.deviceLabel) || 'this device'} may receive through this managed link.`,
            intro: `Current link: ${getNanahStrategyLabel(currentPolicy.applyMode || 'merge')} on ${describeNanahScopeList(currentPolicy.allowedScopes || currentPolicy.defaultScope || 'active')}.`,
            initialPolicy: currentPolicy,
            allowApplyOnce: false,
            allowSave: true,
            saveLabel: 'Save Policy',
            cancelLabel: 'Cancel',
            showAutoApply: trusted.localRole === 'replica' && trusted.remoteRole === 'source',
            showReconnectMode: trusted.localRole === 'replica' && trusted.remoteRole === 'source',
            showLockedChildMode: trusted.localRole === 'replica' && trusted.remoteRole === 'source' && isActiveChildNanahProfile(),
            showTargetProfileMapping: trusted.localRole === 'replica' && trusted.remoteRole === 'source',
            forceFixedTargetProfile: trusted.localRole === 'replica' && trusted.remoteRole === 'source' && isActiveChildNanahProfile()
        });
        if (!nextPolicyDecision?.policy) return;
        if (!(await ensureNanahManagedChildLinkPermission(nextPolicyDecision.policy))) return;

        await updateNanahTrustedLinkPolicy(trusted.linkId, {
            policy: {
                allowedScopes: nextPolicyDecision.policy.allowedScopes,
                defaultScope: nextPolicyDecision.policy.defaultScope,
                applyMode: nextPolicyDecision.policy.applyMode,
                autoApplyControlProposals: nextPolicyDecision.policy.autoApplyControlProposals,
                reconnectMode: nextPolicyDecision.policy.reconnectMode,
                lockedChildMode: nextPolicyDecision.policy.lockedChildMode,
                childProtectionLevel: nextPolicyDecision.policy.childProtectionLevel,
                targetProfileBehavior: nextPolicyDecision.policy.targetProfileBehavior,
                targetProfileId: nextPolicyDecision.policy.targetProfileId,
                targetProfileName: nextPolicyDecision.policy.targetProfileName
            }
        });
        UIComponents.showToast('Managed link updated', 'success');
    }

    async function startNanahTrustedReconnect(link) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted) return;

        if (isNanahChildReplicaOnly() && trusted.localRole !== 'replica') {
            UIComponents.showToast('Locked child profiles can only reconnect as managed replicas. Unlock the child profile first to reconnect as a sender.', 'error');
            return;
        }

        if (ftNanahRole && !ftNanahRole.disabled) {
            ftNanahRole.value = trusted.localRole || 'peer';
            ftNanahRole.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (ftNanahScope && safeObject(trusted.policy).defaultScope) {
            ftNanahScope.value = safeObject(trusted.policy).defaultScope;
            ftNanahScope.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (ftNanahStrategy && safeObject(trusted.policy).applyMode) {
            ftNanahStrategy.value = safeObject(trusted.policy).applyMode === 'replace' ? 'replace' : 'merge';
            ftNanahStrategy.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const client = await createNanahClient();
        nanahSessionState.stage = 'hosting';
        nanahSessionState.code = '';
        nanahSessionState.pairUri = '';
        nanahSessionState.sasPhrase = '';
        nanahSessionState.sasConfirmed = false;
        nanahSessionState.remoteDevice = null;
        nanahSessionState.remoteProfile = null;
        nanahSessionState.remoteTargetProfile = null;
        nanahSessionState.remoteRole = normalizeString(trusted.remoteRole) || 'peer';
        nanahSessionState.helloSent = false;
        nanahSessionState.trustedReconnectApproved = false;
        nanahSessionState.trustedReconnectDeviceId = '';
        updateNanahUi();

        const result = await client.host();
        nanahSessionState.code = normalizeNanahCode(result?.code);
        nanahSessionState.pairUri = buildNanahPairUri(nanahSessionState.code);
        updateNanahUi();

        const reconnectMode = getNanahReconnectMode(safeObject(trusted.policy).reconnectMode, trusted.linkType === 'managed_link' ? 'approval_needed' : 'fast');
        UIComponents.showToast(
            reconnectMode === 'approval_needed'
                ? `Session code ${nanahSessionState.code} is ready. Open Accounts & Sync on the other device and approve the reconnect there.`
                : `Session code ${nanahSessionState.code} is ready. Open Accounts & Sync on ${normalizeString(trusted.deviceLabel) || 'the trusted device'} and join this fresh session.`,
            'success'
        );
    }

    function renderNanahTrustedLinks() {
        if (!ftNanahTrustedLinks) return;
        ftNanahTrustedLinks.innerHTML = '';

        if (!Array.isArray(nanahTrustedLinks) || nanahTrustedLinks.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'nanah-trusted-links__empty';
            empty.textContent = 'No trusted devices yet.';
            ftNanahTrustedLinks.appendChild(empty);
            return;
        }

        nanahTrustedLinks.forEach((entry) => {
            const childAdminRestricted = isChildProfileAdminSurface();
            const childManagedReplicaLink = childAdminRestricted
                && normalizeString(entry?.localRole) === 'replica'
                && normalizeString(entry?.remoteRole) === 'source'
                && normalizeString(entry?.linkType) === 'managed_link';
            const card = document.createElement('div');
            card.className = 'nanah-trusted-link';

            const header = document.createElement('div');
            header.className = 'nanah-trusted-link__header';

            const titleWrap = document.createElement('div');
            const title = document.createElement('h4');
            title.className = 'nanah-trusted-link__title';
            title.textContent = normalizeString(entry?.deviceLabel) || 'Trusted device';
            titleWrap.appendChild(title);

            const meta = document.createElement('div');
            meta.className = 'nanah-trusted-link__meta';

            const rolePill = document.createElement('span');
            rolePill.className = 'nanah-trusted-link__pill';
            rolePill.textContent = getNanahLinkTypeLabel(entry?.linkType);
            meta.appendChild(rolePill);

            const remoteRolePill = document.createElement('span');
            remoteRolePill.className = 'nanah-trusted-link__pill';
            remoteRolePill.textContent = normalizeString(entry?.remoteRole) || 'peer';
            meta.appendChild(remoteRolePill);

            if (safeObject(entry?.policy).linkType === 'managed_link') {
                const policyPill = document.createElement('span');
                policyPill.className = 'nanah-trusted-link__pill';
                policyPill.textContent = `${getNanahStrategyLabel(safeObject(entry?.policy).applyMode)} policy`;
                meta.appendChild(policyPill);
            }

            if (safeObject(entry?.policy).autoApplyControlProposals === true) {
                const autoPill = document.createElement('span');
                autoPill.className = 'nanah-trusted-link__pill';
                autoPill.textContent = 'auto-apply';
                meta.appendChild(autoPill);
            }

            const lastUsed = normalizeString(entry?.lastUsedAt);
            if (lastUsed) {
                const usedPill = document.createElement('span');
                usedPill.className = 'nanah-trusted-link__pill';
                usedPill.textContent = `used ${new Date(lastUsed).toLocaleDateString()}`;
                meta.appendChild(usedPill);
            }

            titleWrap.appendChild(meta);
            header.appendChild(titleWrap);

            const actions = document.createElement('div');
            actions.className = 'nanah-trusted-link__actions';

            const reconnectBtn = document.createElement('button');
            reconnectBtn.type = 'button';
            reconnectBtn.className = 'btn-secondary';
            reconnectBtn.textContent = 'Start New Session';
            reconnectBtn.addEventListener('click', async () => {
                try {
                    await startNanahTrustedReconnect(entry);
                } catch (error) {
                    console.error('FilterTube: failed to start trusted reconnect', error);
                    UIComponents.showToast(error?.message || 'Failed to start a new session', 'error');
                }
            });
            actions.appendChild(reconnectBtn);

            const reconnectHint = document.createElement('small');
            reconnectHint.className = 'nanah-trusted-link__reconnect-hint';
            reconnectHint.textContent = 'Uses saved trust and policy';
            actions.appendChild(reconnectHint);

            if (safeObject(entry?.policy).linkType === 'managed_link') {
                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'btn-secondary';
                editBtn.textContent = 'Edit Policy';
                editBtn.disabled = childManagedReplicaLink;
                editBtn.title = childManagedReplicaLink
                    ? 'Child profiles cannot edit a trusted parent/source policy from this surface.'
                    : '';
                editBtn.addEventListener('click', async () => {
                    if (childManagedReplicaLink) {
                        UIComponents.showToast('Child profiles cannot edit trusted parent link policy here', 'error');
                        return;
                    }
                    await configureNanahTrustedLink(entry);
                });
                actions.appendChild(editBtn);
            }

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-secondary';
            removeBtn.textContent = 'Remove';
            removeBtn.disabled = childManagedReplicaLink;
            removeBtn.title = childManagedReplicaLink
                ? 'Child profiles cannot remove a trusted parent/source link from this surface.'
                : '';
            removeBtn.addEventListener('click', async () => {
                if (childManagedReplicaLink) {
                    UIComponents.showToast('Child profiles cannot remove trusted parent links here', 'error');
                    return;
                }
                await removeNanahTrustedLink(entry?.linkId);
                UIComponents.showToast('Trusted device removed', 'success');
            });
            actions.appendChild(removeBtn);

            card.appendChild(header);

            if (safeObject(entry?.policy).linkType === 'managed_link') {
                const scopes = document.createElement('div');
                scopes.className = 'nanah-trusted-link__scopes';
                getNanahScopeList(safeObject(entry?.policy).allowedScopes).forEach((scope) => {
                    const scopePill = document.createElement('span');
                    scopePill.className = 'nanah-trusted-link__pill';
                    scopePill.textContent = getNanahScopeLabel(scope);
                    scopes.appendChild(scopePill);
                });
                card.appendChild(scopes);

                const policyRows = document.createElement('div');
                policyRows.className = 'nanah-trusted-link__policy';

                const roleRow = document.createElement('div');
                roleRow.className = 'nanah-trusted-link__policy-row';
                roleRow.innerHTML = `<span>Direction</span><strong>${getNanahRoleLabel(entry?.localRole)} -> ${getNanahRoleLabel(entry?.remoteRole)}</strong>`;
                policyRows.appendChild(roleRow);

                const allowedRow = document.createElement('div');
                allowedRow.className = 'nanah-trusted-link__policy-row';
                allowedRow.innerHTML = `<span>Allowed scopes</span><strong>${describeNanahScopeList(safeObject(entry?.policy).allowedScopes)}</strong>`;
                policyRows.appendChild(allowedRow);

                const defaultRow = document.createElement('div');
                defaultRow.className = 'nanah-trusted-link__policy-row';
                defaultRow.innerHTML = `<span>Default scope</span><strong>${getNanahScopeLabel(safeObject(entry?.policy).defaultScope)}</strong>`;
                policyRows.appendChild(defaultRow);

                const applyRow = document.createElement('div');
                applyRow.className = 'nanah-trusted-link__policy-row';
                applyRow.innerHTML = `<span>Apply mode</span><strong>${getNanahStrategyLabel(safeObject(entry?.policy).applyMode)}</strong>`;
                policyRows.appendChild(applyRow);

                const autoRow = document.createElement('div');
                autoRow.className = 'nanah-trusted-link__policy-row';
                autoRow.innerHTML = `<span>Auto-apply</span><strong>${safeObject(entry?.policy).autoApplyControlProposals === true ? 'On' : 'Off'}</strong>`;
                policyRows.appendChild(autoRow);

                const reconnectRow = document.createElement('div');
                reconnectRow.className = 'nanah-trusted-link__policy-row';
                reconnectRow.innerHTML = `<span>New session</span><strong>${getNanahReconnectModeLabel(safeObject(entry?.policy).reconnectMode)}</strong>`;
                policyRows.appendChild(reconnectRow);

                if (entry?.localRole === 'replica' && entry?.remoteRole === 'source') {
                    const childProtectionRow = document.createElement('div');
                    childProtectionRow.className = 'nanah-trusted-link__policy-row';
                    childProtectionRow.innerHTML = `<span>Child protection</span><strong>${getNanahChildProtectionLevelLabel(safeObject(entry?.policy).childProtectionLevel)}</strong>`;
                    policyRows.appendChild(childProtectionRow);

                    const targetProfileBehavior = getNanahTargetProfileBehavior(safeObject(entry?.policy).targetProfileBehavior, 'current_active');
                    const targetProfileLabel = targetProfileBehavior === 'fixed_profile'
                        ? `Fixed: ${normalizeString(safeObject(entry?.policy).targetProfileName) || normalizeString(safeObject(entry?.policy).targetProfileId) || 'Saved profile'}`
                        : 'Current active profile';
                    const targetRow = document.createElement('div');
                    targetRow.className = 'nanah-trusted-link__policy-row';
                    targetRow.innerHTML = `<span>Target profile</span><strong>${targetProfileLabel}</strong>`;
                    policyRows.appendChild(targetRow);

                    const lockedChildRow = document.createElement('div');
                    lockedChildRow.className = 'nanah-trusted-link__policy-row';
                    lockedChildRow.innerHTML = `<span>Locked child profile</span><strong>${getNanahLockedChildModeLabel(safeObject(entry?.policy).lockedChildMode)}</strong>`;
                    policyRows.appendChild(lockedChildRow);
                }

                card.appendChild(policyRows);

                const note = document.createElement('div');
                note.className = 'nanah-trusted-link__note';
                note.textContent = `This managed link defaults to ${getNanahScopeLabel(safeObject(entry?.policy).defaultScope)} and uses ${getNanahStrategyLabel(safeObject(entry?.policy).applyMode).toLowerCase()} for allowed scopes. ${entry?.localRole === 'replica' && entry?.remoteRole === 'source'
                    ? `Targeting is ${getNanahTargetProfileBehaviorLabel(safeObject(entry?.policy).targetProfileBehavior).toLowerCase()}, new sessions are ${getNanahReconnectModeLabel(safeObject(entry?.policy).reconnectMode).toLowerCase()}, and locked child handling is ${getNanahLockedChildModeLabel(safeObject(entry?.policy).lockedChildMode).toLowerCase()}.`
                    : `New sessions are ${getNanahReconnectModeLabel(safeObject(entry?.policy).reconnectMode).toLowerCase()}.`}`;
                card.appendChild(note);
            }

            card.appendChild(actions);
            ftNanahTrustedLinks.appendChild(card);
        });
    }

    async function renderNanahQr() {
        if (!ftNanahQrCanvas) return;
        const canvas = ftNanahQrCanvas;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const pairUri = normalizeString(nanahSessionState.pairUri);
        if (!pairUri || !window.FilterTubeQrCode?.toCanvas) {
            if (ftNanahQrCaption) {
                ftNanahQrCaption.textContent = pairUri
                    ? 'QR renderer unavailable in this build'
                    : 'No active pairing session';
            }
            return;
        }

        await new Promise((resolve) => {
            window.FilterTubeQrCode.toCanvas(canvas, pairUri, {
                width: 180,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#111111',
                    light: '#ffffff'
                }
            }, () => resolve());
        });

        if (ftNanahQrCaption) {
            ftNanahQrCaption.textContent = 'Scan in a Nanah-enabled app, or type the same code on the other device.';
        }
    }

    function updateNanahModeUi() {
        const mode = getNanahUiMode();
        const childReplicaOnly = isNanahChildReplicaOnly();
        const isManagedPair = getNanahRole() === 'source' && normalizeString(nanahSessionState.remoteRole) === 'replica';
        const canShowRemoteTarget = mode !== 'full_account'
            && !childReplicaOnly
            && (
                mode === 'parent_control'
                || isManagedPair
                || !!getNanahSelectedRemoteTargetProfile()
            );

        const configs = {
            send_once: {
                eyebrow: 'Simplest path',
                title: 'Send this profile once',
                body: 'Use this for one-off copies between your own devices. Pair, verify the phrase, send, and let the other device review the update.',
                steps: [
                    'Leave the default peer flow in place.',
                    'Start pairing here or join a code from the other device.',
                    'Confirm the same phrase and send once.'
                ],
                hostLabel: 'Start Pairing',
                sendLabel: getNanahScope() === 'full' ? 'Send Full Backup' : 'Send Once',
                trustLabel: 'Trust Device'
            },
            parent_control: {
                eyebrow: 'Parent path',
                title: childReplicaOnly ? 'Child profile is locked here' : 'Parent controls child',
                body: childReplicaOnly
                    ? 'This child profile is still locked on this device, so it stays replica-only here. Unlock it locally if you need to send this child profile somewhere else.'
                    : 'Use this when a parent or source device should keep a child or replica profile aligned. The receiving device saves that authority once, then later live sessions become much simpler.',
                steps: childReplicaOnly
                    ? [
                        'Unlock this child profile locally first if you need to send from it.',
                        'Use a parent profile as the sender if you only want to control the child device.',
                        'Save a managed link on the receiving device once.'
                    ]
                    : [
                        'Connect to the child or replica device and confirm the safety phrase.',
                        'Choose the remote child profile in the target dropdown.',
                        'Send once, then save parent control so later sessions reuse the target and policy.'
                    ],
                hostLabel: 'Start Parent Pairing',
                sendLabel: 'Send Parent Update',
                trustLabel: 'Save Parent Control'
            },
            full_account: {
                eyebrow: 'Migration path',
                title: 'Move full account',
                body: getActiveProfileType() === 'child'
                    ? 'Full account migration is not available from a child profile. FilterTube will keep this scoped to the active child profile instead.'
                    : 'Use this only when you want the wider account tree, encrypted recovery, or a bigger migration. It is intentionally broader than normal profile sync.',
                steps: [
                    'Use this for reinstall, migration, or full account recovery.',
                    'Pair and verify the phrase like any other Nanah session.',
                    'Send the wider snapshot only when you really mean to move the account tree.'
                ],
                hostLabel: 'Start Migration Pairing',
                sendLabel: getActiveProfileType() === 'child' ? 'Send This Child Profile' : 'Send Full Backup',
                trustLabel: 'Save Device Trust'
            }
        };

        const config = configs[mode] || configs.send_once;

        if (ftNanahModeEyebrow) ftNanahModeEyebrow.textContent = config.eyebrow;
        if (ftNanahModeTitle) ftNanahModeTitle.textContent = config.title;
        if (ftNanahModeBody) ftNanahModeBody.textContent = config.body;
        if (ftNanahModeSteps) {
            ftNanahModeSteps.innerHTML = '';
            config.steps.forEach((step) => {
                const li = document.createElement('li');
                li.textContent = step;
                ftNanahModeSteps.appendChild(li);
            });
        }
        if (ftNanahModeSpotlight) {
            ftNanahModeSpotlight.dataset.mode = mode;
        }
        if (ftNanahRemoteTargetField) {
            ftNanahRemoteTargetField.hidden = !canShowRemoteTarget;
        }
        refreshNanahAdvancedSummary();
        if (ftNanahHostBtn) {
            ftNanahHostBtn.textContent = config.hostLabel;
        }
        if (ftNanahSendBtn) {
            ftNanahSendBtn.textContent = config.sendLabel;
        }
        if (ftNanahTrustBtn) {
            ftNanahTrustBtn.textContent = config.trustLabel;
        }
        if (ftNanahActions) {
            ftNanahActions.dataset.mode = mode;
        }
        setNanahModeButtons(mode);
    }

    function updateNanahPolicyControls() {
        const childReplicaOnly = isNanahChildReplicaOnly();
        if (childReplicaOnly && ftNanahRole && ftNanahRole.value !== 'replica') {
            ftNanahRole.value = 'replica';
        }
        if (getActiveProfileType() === 'child' && ftNanahScope && ftNanahScope.value === 'full') {
            ftNanahScope.value = 'active';
        }
        const localRole = getNanahRole();
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || 'peer';
        const linkType = classifyNanahTrustedLink(localRole, remoteRole);
        const trustedManaged = isCurrentNanahManagedLink();

        if (ftNanahStrategyLabel) {
            ftNanahStrategyLabel.textContent = (trustedManaged && linkType === 'managed_link' && localRole === 'source' && !childReplicaOnly)
                ? 'Managed sync policy'
                : 'Suggested action';
        }
        if (ftNanahStrategyHint) {
            if (childReplicaOnly) {
                ftNanahStrategyHint.textContent = 'This child profile is still locked, so it stays replica-only here. Unlock it locally if you need to send this child profile to another device.';
            } else if (trustedManaged && linkType === 'managed_link' && localRole === 'source') {
                ftNanahStrategyHint.textContent = 'Trusted replicas follow this saved merge or replace policy for allowed scopes.';
            } else if (linkType === 'managed_link') {
                ftNanahStrategyHint.textContent = 'Until this managed link is trusted, the receiving device still chooses merge or replace.';
            } else {
                ftNanahStrategyHint.textContent = 'Peer and first-time sessions let the receiver choose merge or replace.';
            }
        }
        if (ftNanahTrustBtn) {
            ftNanahTrustBtn.textContent = (childReplicaOnly || linkType === 'managed_link') ? 'Save Managed Link' : 'Trust Connected Device';
        }
        if (ftNanahScope) {
            ftNanahScope.disabled = childReplicaOnly || !!nanahClient;
            ftNanahScope.title = childReplicaOnly
                ? 'This child profile is locked, so scope sending is unavailable until you unlock it locally.'
                : (nanahClient ? 'Scope is locked for the current Nanah session.' : '');
        }
        if (ftNanahStrategy) {
            ftNanahStrategy.disabled = childReplicaOnly || !!nanahClient;
            ftNanahStrategy.title = childReplicaOnly
                ? 'This child profile is locked, so outgoing merge/replace behavior stays unavailable until you unlock it locally.'
                : (nanahClient ? 'Suggested action is locked for the current Nanah session.' : '');
        }
        if (ftNanahRemoteTarget) {
            const canTargetRemoteProfiles = !childReplicaOnly
                && !!nanahClient
                && nanahSessionState.connected
                && getNanahRole() === 'source'
                && normalizeString(nanahSessionState.remoteRole) === 'replica'
                && normalizeNanahProfileInventory(nanahSessionState.remoteProfileInventory).length > 0;
            ftNanahRemoteTarget.disabled = !canTargetRemoteProfiles;
            ftNanahRemoteTarget.title = canTargetRemoteProfiles
                ? ''
                : 'Connect to a replica device first to choose a specific remote profile.';
        }
        if (ftNanahRemoteTargetHint) {
            const selectedTarget = getNanahSelectedRemoteTargetProfile();
            if (selectedTarget) {
                ftNanahRemoteTargetHint.textContent = `This session will target ${selectedTarget.profileName} on ${getNanahRemoteLabel()} instead of following the remote active profile.`;
            } else if (getNanahRole() === 'source' && normalizeString(nanahSessionState.remoteRole) === 'replica') {
                ftNanahRemoteTargetHint.textContent = 'No fixed remote target is selected for this live session yet, so updates will follow the receiver’s current active profile unless you choose one here.';
            } else {
                ftNanahRemoteTargetHint.textContent = 'After the secure handshake, choose a specific remote profile here if you want this update to land somewhere other than the receiver’s currently active profile.';
            }
        }
    }

    function updateNanahUi() {
        enforceChildSyncSurfaceRestrictions();
        let nanahTone = 'idle';
        if (!nanahClient) {
            nanahTone = 'idle';
        } else if (!nanahSessionState.sasConfirmed && normalizeString(nanahSessionState.sasPhrase)) {
            nanahTone = 'verify';
        } else if (nanahSessionState.connected) {
            const trusted = findNanahTrustedLink(safeObject(nanahSessionState.remoteDevice).deviceId);
            nanahTone = trusted ? 'trusted' : 'connected';
        } else if (normalizeString(nanahSessionState.code)) {
            nanahTone = 'pairing';
        }

        if (ftNanahStatusCard) {
            ftNanahStatusCard.dataset.tone = nanahTone;
        }
        if (ftNanahStage) {
            ftNanahStage.textContent = formatNanahStage(nanahSessionState.stage || 'idle');
        }
        if (ftNanahLocalProfile) {
            ftNanahLocalProfile.textContent = formatNanahProfileContext(getNanahLocalProfileContext());
        }
        if (ftNanahRemoteLabel) {
            ftNanahRemoteLabel.textContent = nanahSessionState.connected
                ? getNanahRemoteLabel()
                : 'Not connected';
        }
        if (ftNanahRemoteProfile) {
            ftNanahRemoteProfile.textContent = nanahSessionState.connected && nanahSessionState.remoteProfile
                ? formatNanahProfileContext(nanahSessionState.remoteProfile)
                : 'Unknown';
        }
        if (ftNanahPairCodeRow) {
            ftNanahPairCodeRow.hidden = !normalizeString(nanahSessionState.code);
        }
        if (ftNanahPairCode) {
            ftNanahPairCode.textContent = normalizeNanahCode(nanahSessionState.code) || '----';
        }
        if (ftNanahSasPhrase) {
            ftNanahSasPhrase.textContent = normalizeString(nanahSessionState.sasPhrase) || 'Waiting';
        }
        if (ftNanahPairUri) {
            ftNanahPairUri.value = normalizeString(nanahSessionState.pairUri);
        }
        if (ftNanahCopyPairUriBtn) {
            ftNanahCopyPairUriBtn.disabled = !normalizeString(nanahSessionState.pairUri);
        }
        if (ftNanahConfirmSasBtn) {
            ftNanahConfirmSasBtn.disabled = !normalizeString(nanahSessionState.sasPhrase) || nanahSessionState.sasConfirmed === true;
        }
        if (ftNanahDeviceLabel) {
            ftNanahDeviceLabel.disabled = !!nanahClient;
            ftNanahDeviceLabel.title = nanahClient
                ? 'Device label is locked for the current Nanah session. End the session to change it.'
                : '';
        }
        if (ftNanahRole) {
            const childReplicaOnly = isNanahChildReplicaOnly();
            if (childReplicaOnly && ftNanahRole.value !== 'replica') {
                ftNanahRole.value = 'replica';
            }
            ftNanahRole.disabled = !!nanahClient || childReplicaOnly;
            ftNanahRole.title = childReplicaOnly
                ? 'This child profile is locked, so it is replica-only in Nanah until you unlock it locally.'
                : (nanahClient
                    ? 'Relationship is locked for the current Nanah session. End the session to change it.'
                    : '');
        }
        if (ftNanahSendBtn) {
            ftNanahSendBtn.disabled = !(nanahSessionState.connected && nanahSessionState.sasConfirmed && nanahClient);
        }
        if (ftNanahTrustBtn) {
            ftNanahTrustBtn.disabled = !(nanahSessionState.connected && safeObject(nanahSessionState.remoteDevice).deviceId);
        }
        if (ftNanahEndSessionBtn) {
            ftNanahEndSessionBtn.disabled = !nanahClient;
        }
        if (ftNanahStatusHint) {
            if (!nanahClient) {
                ftNanahStatusHint.textContent = 'Create a pairing code on one device, then join from the other device using the same 4-character code.';
            } else if (!nanahSessionState.sasConfirmed && normalizeString(nanahSessionState.sasPhrase)) {
                ftNanahStatusHint.textContent = 'Compare the safety phrase on both devices and confirm only if they match exactly.';
            } else if (nanahSessionState.connected) {
                const trusted = findNanahTrustedLink(safeObject(nanahSessionState.remoteDevice).deviceId);
                const trustedPolicy = safeObject(trusted?.policy);
                ftNanahStatusHint.textContent = isNanahChildReplicaOnly()
                    ? (trusted
                        ? 'Child profile connected as a managed replica. Saved parent/source links can keep this device aligned without turning the child into a sender.'
                        : 'Locked child profile connected. This device stays replica-only until the local child profile is unlocked.')
                    : trusted
                    ? (trustedPolicy.linkType === 'managed_link'
                        ? 'Managed link connected. Replica updates now follow the saved trusted policy for allowed scopes.'
                        : 'Trusted peer connected. New proposals still stay reviewable on the receiving device.')
                    : (classifyNanahTrustedLink(getNanahRole(), normalizeString(nanahSessionState.remoteRole) || 'peer') === 'managed_link'
                        ? 'Connected as a source/replica pair. Until you save a managed link, the receiving device still reviews and chooses merge or replace.'
                        : 'Connected. You can now send settings or save this device as a trusted peer or managed link.');
            } else {
                ftNanahStatusHint.textContent = 'Waiting for the second device to join and complete the secure handshake.';
            }
        }
        if (ftNanahTargetHint) {
            ftNanahTargetHint.textContent = buildNanahTargetHint(getNanahScope());
        }
        updateNanahPolicyControls();
        refreshNanahAdvancedSummary();
        updateNanahModeUi();
        renderNanahQr().catch(() => { });
    }

    function buildNanahDeviceDescriptor() {
        const adapter = window.FilterTubeNanahAdapter || {};
        const role = getNanahRole();
        const deviceLabel = normalizeString(ftNanahDeviceLabel?.value);
        return adapter.getDeviceDescriptor({
            deviceId: normalizeString(nanahStableDeviceId) || undefined,
            deviceLabel: deviceLabel || undefined,
            appVersion: manifestVersion,
            capabilities: getNanahCapabilitiesForRole(role)
        });
    }

    async function resetNanahSession(closeClient = false) {
        if (closeClient && nanahClient) {
            try {
                await nanahClient.close();
            } catch (error) {
            }
        }
        nanahClient = null;
        nanahTrustedReconnectApprovalPromise = null;
        nanahSessionState = {
            stage: 'idle',
            code: '',
            pairUri: '',
            sasPhrase: '',
            sasConfirmed: false,
            connected: false,
            remoteDevice: null,
            remoteProfile: null,
            remoteProfileInventory: [],
            remoteTargetProfile: null,
            remoteRole: 'peer',
            helloSent: false,
            trustedReconnectApproved: false,
            trustedReconnectDeviceId: ''
        };
        updateNanahUi();
        syncNanahRemoteTargetOptions();
    }

    async function sendNanahHelloEnvelope(force = false) {
        if (!nanahClient || !nanahSessionState.connected || (nanahSessionState.helloSent && !force)) return;
        const device = buildNanahDeviceDescriptor();
        const role = getNanahRole();
        await nanahClient.send({
            t: 'hello',
            id: `hello-${Date.now()}`,
            app: 'filtertube',
            role,
            device,
            profileContext: getNanahLocalProfileContext(),
            profileInventory: getNanahProfileInventory(),
            targetProfileContext: buildNanahHelloTargetProfileContext(),
            capabilities: safeArray(device.capabilities)
        });
        nanahSessionState.helloSent = true;
    }

    async function ensureNanahOutgoingAuth(scope) {
        const normalizedScope = normalizeString(scope).toLowerCase();
        const io = window.FilterTubeIO || {};
        const profilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const activeId = normalizeString(profilesV4?.activeProfileId) || 'default';
        const masterVerifier = extractMasterPinVerifier(profilesV4);
        const requiresWholeAccount = normalizedScope === 'full';

        if (requiresWholeAccount && activeId !== 'default') {
            throw new Error('Switch to Default (Master) to send a full backup');
        }

        if (profilesV4) {
            const okUnlocked = await ensureProfileUnlocked(profilesV4, activeId);
            if (!okUnlocked) {
                throw new Error(requiresWholeAccount ? 'Master unlock cancelled' : 'Profile unlock cancelled');
            }
        }

        if (activeId === 'default' && masterVerifier) {
            if (!sessionMasterPin) {
                const okAdmin = await ensureAdminUnlocked(profilesV4);
                if (!okAdmin) {
                    throw new Error('Master unlock cancelled');
                }
            }
            return { localMasterPin: sessionMasterPin };
        }
        return null;
    }

    async function ensureNanahIncomingAuth(portable, scope, { trustedLink = null, details = null, targetProfile = null } = {}) {
        const normalizedScope = normalizeString(scope).toLowerCase();
        const io = window.FilterTubeIO || {};
        const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const localActiveId = normalizeString(localProfilesV4?.activeProfileId) || 'default';
        const resolvedTarget = safeObject(targetProfile);
        const localTargetId = normalizeString(resolvedTarget.profileId) || localActiveId;
        const localTargetType = normalizeString(resolvedTarget.profileType) || getProfileType(localProfilesV4, localTargetId);
        const localVerifier = extractMasterPinVerifier(localProfilesV4);
        const incomingVerifier = extractMasterPinVerifier(portable?.profilesV4);
        let auth = null;
        const requiresWholeAccount = normalizedScope === 'full';
        const trusted = normalizeNanahTrustedLink(trustedLink);
        const bypassLockedChildUnlock = Boolean(
            !requiresWholeAccount
            && localTargetType === 'child'
            && isProfileLocked(localProfilesV4, localTargetId)
            && trusted
            && trusted.linkType === 'managed_link'
            && normalizeString(trusted.localRole) === 'replica'
            && (normalizeString(nanahSessionState.remoteRole) || normalizeString(trusted.remoteRole)) === 'source'
            && normalizeString(safeObject(details).authorityMode || safeObject(trusted.policy).decisionMode) !== 'peer'
            && getNanahLockedChildMode(safeObject(trusted.policy).lockedChildMode, 'require_unlock') === 'allow_trusted_updates'
        );

        if (requiresWholeAccount && localActiveId !== 'default') {
            throw new Error('Switch to Default (Master) to apply a full backup');
        }

        if (localProfilesV4 && !bypassLockedChildUnlock) {
            const okUnlocked = await ensureProfileUnlocked(localProfilesV4, localTargetId);
            if (!okUnlocked) {
                throw new Error(requiresWholeAccount ? 'Master unlock cancelled' : 'Profile unlock cancelled');
            }
        }

        if (localTargetId === 'default' && localVerifier) {
            if (!sessionMasterPin) {
                const okAdmin = await ensureAdminUnlocked(localProfilesV4);
                if (!okAdmin) {
                    throw new Error('Master unlock cancelled');
                }
            }
            auth = { ...(auth || {}), localMasterPin: sessionMasterPin };
        }

        if (localTargetId === 'default' && incomingVerifier) {
            const incomingPin = await showPromptModal({
                title: 'Incoming Backup PIN',
                message: 'This incoming FilterTube payload comes from a Master-protected profile. Enter that PIN to continue.',
                placeholder: 'Master PIN',
                inputType: 'password',
                confirmText: 'Authorize'
            });
            const normalizedPin = normalizeString(incomingPin);
            if (!normalizedPin) {
                throw new Error('Incoming backup PIN is required');
            }
            auth = { ...(auth || {}), incomingMasterPin: normalizedPin };
        }

        return auth;
    }

    function parseNanahEnvelopeDetails(envelope) {
        const root = safeObject(envelope);
        if (root.t === 'control_proposal') {
            const parsed = safeObject(JSON.parse(root.payload));
            return {
                type: 'control_proposal',
                scope: normalizeString(parsed.targetScope || root.scope || 'active').toLowerCase() || 'active',
                strategy: normalizeString(parsed.strategy).toLowerCase() === 'replace' ? 'replace' : 'merge',
                portable: parsed.portable,
                summary: normalizeString(root.summary) || normalizeString(parsed.summary) || 'FilterTube settings',
                targetProfile: normalizeNanahProfileContext(parsed.targetProfile || root.targetProfile),
                authorityMode: normalizeString(parsed.authorityMode || root.authorityMode) === 'managed' ? 'managed' : 'peer',
                linkType: normalizeString(parsed.linkType || root.linkType) === 'managed_link' ? 'managed_link' : 'peer_link',
                allowedScopes: getNanahScopeList(parsed.allowedScopes || root.allowedScopes || parsed.targetScope || root.scope || 'active'),
                senderStrategySuggested: normalizeString(parsed.authorityMode || root.authorityMode) === 'managed' ? false : true
            };
        }
        if (root.t === 'app_sync') {
            const adapter = window.FilterTubeNanahAdapter || {};
            const extracted = typeof adapter.extractPortableFromEnvelope === 'function'
                ? adapter.extractPortableFromEnvelope(root)
                : { scope: root.scope || 'active', portable: JSON.parse(root.payload) };
            return {
                type: 'app_sync',
                scope: normalizeString(extracted.scope || 'active').toLowerCase() || 'active',
                strategy: 'merge',
                portable: extracted.portable,
                summary: 'FilterTube settings',
                targetProfile: normalizeNanahProfileContext(root.targetProfile),
                authorityMode: 'peer',
                linkType: 'peer_link',
                allowedScopes: [normalizeString(extracted.scope || 'active').toLowerCase() || 'active'],
                senderStrategySuggested: true
            };
        }
        return {
            type: normalizeString(root.t),
            scope: 'active',
            strategy: 'merge',
            portable: null,
            summary: '',
            targetProfile: null,
            authorityMode: 'peer',
            linkType: 'peer_link',
            allowedScopes: ['active'],
            senderStrategySuggested: true
        };
    }

    function shouldAutoApplyNanahProposal(remoteDeviceId) {
        const localRole = getNanahRole();
        if (localRole !== 'replica') return false;
        if (normalizeString(nanahSessionState.remoteRole) !== 'source') return false;
        const trusted = findNanahTrustedLink(remoteDeviceId);
        const policy = getManagedNanahLinkPolicy(trusted);
        return policy?.autoApplyControlProposals === true;
    }

    async function refreshFilterTubeUiAfterNanahImport() {
        await StateManager.loadSettings();
        const state = StateManager.getState();
        const SettingsAPI = window.FilterTubeSettings || {};
        if (SettingsAPI.applyThemePreference) {
            SettingsAPI.applyThemePreference(state.theme);
        }
        if (typeof refreshProfilesUI === 'function') {
            await refreshProfilesUI();
        }
        if (typeof renderKeywords === 'function') renderKeywords();
        if (typeof renderChannels === 'function') renderChannels();
        if (typeof renderKidsKeywords === 'function') renderKidsKeywords();
        if (typeof renderKidsChannels === 'function') renderKidsChannels();
        if (typeof updateCheckboxes === 'function') updateCheckboxes();
        if (typeof updateStats === 'function') updateStats();
        if (typeof renderListModeControls === 'function') renderListModeControls();
    }

    async function applyNanahEnvelope(envelope, strategyOverride = null, targetPolicyOverride = null) {
        const adapter = window.FilterTubeNanahAdapter || {};
        if (typeof adapter.applyIncomingEnvelope !== 'function' || typeof adapter.extractPortableFromEnvelope !== 'function') {
            throw new Error('FilterTube Nanah adapter is unavailable');
        }
        const details = parseNanahEnvelopeDetails(envelope);
        const io = window.FilterTubeIO || {};
        const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const trustedLink = getNanahCurrentTrustedLink();
        const explicitTargetProfile = details.scope === 'full' ? null : resolveNanahExplicitTargetProfile(details.targetProfile, localProfilesV4);
        const targetProfile = explicitTargetProfile
            || (targetPolicyOverride
                ? resolveNanahTargetProfileFromPolicy(targetPolicyOverride, localProfilesV4)
                : resolveNanahLocalTargetProfile(trustedLink, localProfilesV4));
        const auth = await ensureNanahIncomingAuth(details.portable, details.scope, {
            trustedLink,
            details,
            targetProfile
        });
        const result = await adapter.applyIncomingEnvelope(envelope, {
            strategy: strategyOverride || details.strategy,
            scope: details.scope,
            auth,
            targetProfileId: details.scope === 'full' ? null : normalizeString(targetProfile.profileId) || null
        });
        await refreshFilterTubeUiAfterNanahImport();
        return result;
    }

    function buildNanahOutgoingProposalPolicy(scope, strategy) {
        if (isNanahChildReplicaOnly()) {
            throw new Error('Unlock this child profile first if you want to send its settings to another device.');
        }
        const localRole = getNanahRole();
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || 'peer';
        const trustedLink = getNanahCurrentTrustedLink();
        const managedPolicy = getManagedNanahLinkPolicy(trustedLink);
        const selectedScope = normalizeString(scope).toLowerCase() || 'active';
        const selectedStrategy = normalizeString(strategy).toLowerCase() === 'replace' ? 'replace' : 'merge';
        const isTrustedManagedSender = localRole === 'source'
            && remoteRole === 'replica'
            && safeObject(trustedLink).linkType === 'managed_link'
            && managedPolicy;

        if (isTrustedManagedSender) {
            const allowedScopes = getNanahScopeList(managedPolicy.allowedScopes);
            if (!allowedScopes.includes(selectedScope)) {
                throw new Error(`This managed link only allows ${allowedScopes.map(getNanahScopeLabel).join(', ')} syncs`);
            }
            return {
                linkType: 'managed_link',
                authorityMode: 'managed',
                scope: selectedScope,
                strategy: normalizeString(managedPolicy.applyMode).toLowerCase() === 'replace' ? 'replace' : 'merge',
                allowedScopes
            };
        }

        return {
            linkType: classifyNanahTrustedLink(localRole, remoteRole) || 'peer_link',
            authorityMode: 'peer',
            scope: selectedScope,
            strategy: selectedStrategy,
            allowedScopes: [selectedScope]
        };
    }

    function attachNanahProposalPolicy(envelope, policy) {
        const root = safeObject(envelope);
        const parsed = safeObject(JSON.parse(root.payload));
        parsed.authorityMode = policy.authorityMode;
        parsed.linkType = policy.linkType;
        parsed.allowedScopes = getNanahScopeList(policy.allowedScopes);
        parsed.strategy = policy.strategy;
        const explicitRemoteTarget = getNanahSelectedRemoteTargetProfile();
        if (explicitRemoteTarget) {
            parsed.targetProfile = explicitRemoteTarget;
            root.targetProfile = explicitRemoteTarget;
        }
        root.authorityMode = policy.authorityMode;
        root.linkType = policy.linkType;
        root.allowedScopes = getNanahScopeList(policy.allowedScopes);
        root.payload = JSON.stringify(parsed);
        if (policy.authorityMode === 'managed') {
            root.summary = `${root.summary || 'FilterTube settings'} · managed ${getNanahStrategyLabel(policy.strategy).toLowerCase()} policy`;
        }
        return root;
    }

    function resolveTrustedNanahManagedApply(details, trustedLink) {
        const policy = getManagedNanahLinkPolicy(trustedLink);
        if (!policy) return null;
        const allowedScopes = getNanahScopeList(policy.allowedScopes);
        if (!allowedScopes.includes(details.scope)) {
            return {
                ok: false,
                reason: `This trusted link allows only ${allowedScopes.map(getNanahScopeLabel).join(', ')} syncs`
            };
        }
        return {
            ok: true,
            strategy: normalizeString(policy.applyMode).toLowerCase() === 'replace' ? 'replace' : 'merge',
            autoApply: policy.autoApplyControlProposals === true
        };
    }

    function requiresNanahTrustedReconnectApproval(trustedLink) {
        const trusted = normalizeNanahTrustedLink(trustedLink);
        if (!trusted || trusted.linkType !== 'managed_link') return false;
        if (getNanahRole() !== 'replica') return false;
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || normalizeString(trusted.remoteRole) || 'peer';
        if (remoteRole !== 'source') return false;
        return getNanahReconnectMode(safeObject(trusted.policy).reconnectMode, 'approval_needed') === 'approval_needed';
    }

    async function ensureNanahTrustedReconnectApproved(trustedLink, { closeOnDecline = false } = {}) {
        const trusted = normalizeNanahTrustedLink(trustedLink);
        if (!requiresNanahTrustedReconnectApproval(trusted)) {
            return true;
        }

        const remoteDeviceId = normalizeString(trusted?.remoteDeviceId) || normalizeString(safeObject(nanahSessionState.remoteDevice).deviceId);
        if (
            nanahSessionState.trustedReconnectApproved
            && normalizeString(nanahSessionState.trustedReconnectDeviceId) === remoteDeviceId
        ) {
            return true;
        }

        if (nanahTrustedReconnectApprovalPromise) {
            return nanahTrustedReconnectApprovalPromise;
        }

        nanahTrustedReconnectApprovalPromise = (async () => {
            const policy = safeObject(trusted.policy);
            const response = await showChoiceModal({
                title: 'Approve Managed Reconnect',
                message: `${getNanahRemoteLabel()} is reconnecting as a saved managed source for ${formatNanahProfileContext(getNanahLocalProfileContext())}.`,
                details: [
                    `Allowed scopes: ${describeNanahScopeList(policy.allowedScopes || policy.defaultScope || 'active')}`,
                    `Saved apply policy: ${getNanahStrategyLabel(policy.applyMode || 'merge')}`,
                    'No updates from this source will be accepted in this session until you approve this reconnect.'
                ],
                choices: [
                    {
                        value: 'approve',
                        label: 'Approve Reconnect',
                        recommended: true
                    },
                    {
                        value: 'decline',
                        label: 'Decline',
                        className: 'btn-secondary'
                    }
                ],
                cancelText: 'Decline'
            });

            if (response === 'approve') {
                nanahSessionState.trustedReconnectApproved = true;
                nanahSessionState.trustedReconnectDeviceId = remoteDeviceId;
                updateNanahUi();
                UIComponents.showToast('Trusted reconnect approved for this session', 'success');
                return true;
            }

            nanahSessionState.trustedReconnectApproved = false;
            nanahSessionState.trustedReconnectDeviceId = '';
            updateNanahUi();
            UIComponents.showToast('Trusted reconnect declined', 'info');
            if (closeOnDecline && nanahClient) {
                try {
                    await nanahClient.close();
                } catch (error) {
                }
            }
            return false;
        })();

        try {
            return await nanahTrustedReconnectApprovalPromise;
        } finally {
            nanahTrustedReconnectApprovalPromise = null;
        }
    }

    async function sendNanahDecision(proposalId, accepted, reason = '', extra = {}) {
        if (!nanahClient || !proposalId) return;
        try {
            await nanahClient.send({
                t: 'control_decision',
                id: `decision-${Date.now()}`,
                proposalId,
                accepted: accepted === true,
                ...(reason ? { reason } : {}),
                ...safeObject(extra)
            });
        } catch (error) {
        }
    }

    async function handleNanahIncomingProposal(envelope) {
        const details = parseNanahEnvelopeDetails(envelope);
        const remoteId = normalizeString(safeObject(nanahSessionState.remoteDevice).deviceId);
        const trustedLink = remoteId ? findNanahTrustedLink(remoteId) : null;
        const localRole = getNanahRole();
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || 'peer';
        const isManagedReceiver = localRole === 'replica'
            && remoteRole === 'source'
            && safeObject(trustedLink).linkType === 'managed_link';
        const isFirstManagedReplicaSession = localRole === 'replica'
            && remoteRole === 'source'
            && !isManagedReceiver;

        if (isManagedReceiver) {
            const reconnectApproved = await ensureNanahTrustedReconnectApproved(trustedLink);
            if (!reconnectApproved) {
                await sendNanahDecision(envelope.id, false, 'trusted reconnect not approved');
                if (nanahClient) {
                    try {
                        await nanahClient.close();
                    } catch (error) {
                    }
                }
                return;
            }
        }

        if (remoteId && shouldAutoApplyNanahProposal(remoteId) && isManagedReceiver) {
            const trustedDecision = resolveTrustedNanahManagedApply(details, trustedLink);
            if (trustedDecision?.ok) {
                await applyNanahEnvelope(envelope, trustedDecision.strategy);
                await sendNanahDecision(envelope.id, true, 'auto-applied');
                UIComponents.showToast(`Applied ${details.scope} settings from trusted source`, 'success');
                return;
            }
        }

        if (isManagedReceiver) {
            const trustedDecision = resolveTrustedNanahManagedApply(details, trustedLink);
            if (!trustedDecision?.ok) {
                await sendNanahDecision(envelope.id, false, trustedDecision?.reason || 'blocked by trusted link policy');
                UIComponents.showToast(trustedDecision?.reason || 'Managed update does not match this trusted link policy', 'error');
                return;
            }

            const response = await showChoiceModal({
                title: 'Managed FilterTube Update',
                message: `${getNanahRemoteLabel()} wants to apply ${details.scope} settings into ${formatNanahProfileContext(resolveNanahDisplayTargetProfile(details, trustedLink))} using the saved managed policy for this device.`,
                details: [
                    `Saved policy: ${getNanahStrategyLabel(trustedDecision.strategy)} ${getNanahScopeLabel(details.scope)}`,
                    `Remote role: ${remoteRole}`,
                    details.summary || 'FilterTube settings'
                ],
                choices: [
                    {
                        value: 'approve',
                        label: `Approve ${getNanahStrategyLabel(trustedDecision.strategy)}`,
                        recommended: true
                    },
                    {
                        value: 'decline',
                        label: 'Decline',
                        className: 'btn-secondary'
                    }
                ],
                cancelText: 'Cancel'
            });

            if (response !== 'approve') {
                await sendNanahDecision(envelope.id, false, 'declined');
                UIComponents.showToast('Incoming managed sync declined', 'info');
                return;
            }

            await applyNanahEnvelope(envelope, trustedDecision.strategy);
            await sendNanahDecision(envelope.id, true, trustedDecision.strategy);
            UIComponents.showToast(`Applied ${details.scope} settings`, 'success');
            return;
        }

        if (isFirstManagedReplicaSession) {
            const managedApproval = await showNanahManagedLinkModal({
                title: 'First Managed Source Connection',
                message: `${getNanahRemoteLabel()} wants to send ${getNanahScopeLabel(details.scope).toLowerCase()} settings into ${formatNanahProfileContext(resolveNanahDisplayTargetProfile(details, null))}.`,
                intro: 'Review this update once, or save a parent control link so future updates follow the policy below.',
                initialPolicy: {
                    allowedScopes: details.allowedScopes || [details.scope],
                    defaultScope: details.scope,
                    applyMode: details.strategy,
                    autoApplyControlProposals: false,
                    reconnectMode: 'approval_needed',
                    lockedChildMode: 'require_unlock',
                    childProtectionLevel: isActiveChildNanahProfile() ? 'strict' : 'standard',
                    targetProfileBehavior: (normalizeString(safeObject(details.targetProfile).profileId) || isActiveChildNanahProfile())
                        ? 'fixed_profile'
                        : 'current_active',
                    targetProfileId: normalizeString(safeObject(details.targetProfile).profileId) || getNanahLocalProfileContext().profileId,
                    targetProfileName: normalizeString(safeObject(details.targetProfile).profileName) || getNanahLocalProfileContext().profileName
                },
                requiredScopes: [details.scope],
                allowApplyOnce: true,
                allowSave: true,
                applyOnceLabel: 'Apply Once',
                saveLabel: 'Apply + Save Parent Control',
                cancelLabel: 'Decline',
                showAutoApply: true,
                showReconnectMode: true,
                showLockedChildMode: isActiveChildNanahProfile(),
                showTargetProfileMapping: true,
                forceFixedTargetProfile: isActiveChildNanahProfile()
            });

            if (!managedApproval?.policy) {
                await sendNanahDecision(envelope.id, false, 'declined');
                UIComponents.showToast('Incoming managed sync declined', 'info');
                return;
            }

            if (managedApproval.action === 'save' && remoteId) {
                if (!(await ensureNanahManagedChildLinkPermission(managedApproval.policy))) {
                    await sendNanahDecision(envelope.id, false, 'local child authorization required');
                    return;
                }
                await saveNanahTrustedLink({
                    linkId: `nanah-${remoteId}`,
                    remoteDeviceId: remoteId,
                    deviceLabel: getNanahRemoteLabel(),
                    capabilities: safeArray(safeObject(nanahSessionState.remoteDevice).capabilities),
                    localRole,
                    remoteRole,
                    linkType: 'managed_link',
                    policy: {
                        linkType: 'managed_link',
                        capabilities: safeArray(safeObject(nanahSessionState.remoteDevice).capabilities),
                        allowedScopes: managedApproval.policy.allowedScopes,
                        defaultScope: managedApproval.policy.defaultScope,
                        applyMode: managedApproval.policy.applyMode,
                        autoApplyControlProposals: managedApproval.policy.autoApplyControlProposals,
                        reconnectMode: managedApproval.policy.reconnectMode,
                        lockedChildMode: managedApproval.policy.lockedChildMode,
                        childProtectionLevel: managedApproval.policy.childProtectionLevel,
                        targetProfileBehavior: managedApproval.policy.targetProfileBehavior,
                        targetProfileId: managedApproval.policy.targetProfileId,
                        targetProfileName: managedApproval.policy.targetProfileName
                    }
                });
            }

            await applyNanahEnvelope(envelope, managedApproval.policy.applyMode, managedApproval.policy);
            await sendNanahDecision(
                envelope.id,
                true,
                managedApproval.policy.applyMode,
                managedApproval.action === 'save'
                    ? {
                        savedManagedLink: {
                            linkType: 'managed_link',
                            allowedScopes: managedApproval.policy.allowedScopes,
                            defaultScope: managedApproval.policy.defaultScope,
                            applyMode: managedApproval.policy.applyMode,
                            autoApplyControlProposals: managedApproval.policy.autoApplyControlProposals,
                            reconnectMode: managedApproval.policy.reconnectMode,
                            lockedChildMode: managedApproval.policy.lockedChildMode,
                            childProtectionLevel: managedApproval.policy.childProtectionLevel,
                            targetProfileBehavior: managedApproval.policy.targetProfileBehavior,
                            targetProfileId: managedApproval.policy.targetProfileId,
                            targetProfileName: managedApproval.policy.targetProfileName
                        }
                    }
                    : {}
            );
            UIComponents.showToast(
                managedApproval.action === 'save'
                    ? `Applied ${details.scope} settings and saved a managed link`
                    : `Applied ${details.scope} settings once`,
                'success'
            );
            updateNanahUi();
            return;
        }

        const response = await showChoiceModal({
            title: 'Incoming FilterTube Sync',
            message: `${getNanahRemoteLabel()} wants to apply ${details.scope} settings into ${formatNanahProfileContext(resolveNanahDisplayTargetProfile(details, trustedLink))}.`,
            details: [
                `${details.senderStrategySuggested ? 'Suggested action' : 'Managed policy'}: ${details.strategy === 'replace' ? 'Replace this scope' : 'Merge into this scope'}`,
                `Remote role: ${normalizeString(nanahSessionState.remoteRole) || 'peer'}`,
                ...(classifyNanahTrustedLink(getNanahRole(), normalizeString(nanahSessionState.remoteRole) || 'peer') === 'managed_link'
                    ? ['This source/replica pairing is not trusted yet, so this device still decides how to apply the update.']
                    : []),
                details.summary || 'FilterTube settings'
            ],
            choices: [
                {
                    value: 'merge',
                    label: 'Apply as Merge',
                    recommended: details.strategy !== 'replace'
                },
                {
                    value: 'replace',
                    label: 'Apply as Replace',
                    recommended: details.strategy === 'replace'
                },
                {
                    value: 'decline',
                    label: 'Decline',
                    className: 'btn-secondary'
                }
            ],
            cancelText: 'Cancel'
        });

        if (!response || response === 'decline') {
            await sendNanahDecision(envelope.id, false, 'declined');
            UIComponents.showToast('Incoming sync declined', 'info');
            return;
        }

        await applyNanahEnvelope(envelope, response);
        await sendNanahDecision(envelope.id, true, response);
        UIComponents.showToast(`Applied ${details.scope} settings`, 'success');
    }

    async function handleNanahIncomingEnvelope(envelope) {
        const root = safeObject(envelope);
        if (root.t === 'hello') {
            nanahSessionState.remoteDevice = safeObject(root.device);
            nanahSessionState.remoteProfile = normalizeNanahProfileContext(root.profileContext || root.profile);
            nanahSessionState.remoteProfileInventory = normalizeNanahProfileInventory(root.profileInventory || root.profiles);
            nanahSessionState.remoteTargetProfile = normalizeNanahTargetProfileContext(root.targetProfileContext || root.targetProfile);
            nanahSessionState.remoteRole = normalizeString(root.role) || 'peer';
            if (normalizeString(nanahSessionState.trustedReconnectDeviceId) !== normalizeString(safeObject(root.device).deviceId)) {
                nanahSessionState.trustedReconnectApproved = false;
                nanahSessionState.trustedReconnectDeviceId = '';
            }
            syncNanahRemoteTargetOptions();
            updateNanahUi();
            const trustedLink = findNanahTrustedLink(safeObject(root.device).deviceId);
            const approved = await ensureNanahTrustedReconnectApproved(trustedLink, { closeOnDecline: true });
            if (approved) {
                await markNanahTrustedLinkUsed(safeObject(root.device).deviceId);
            }
            return;
        }
        if (root.t === 'control_decision') {
            const accepted = root.accepted === true;
            if (accepted && safeObject(root.savedManagedLink).linkType === 'managed_link') {
                const remote = safeObject(nanahSessionState.remoteDevice);
                const remoteDeviceId = normalizeString(remote.deviceId);
                if (remoteDeviceId) {
                    await saveNanahTrustedLink({
                        linkId: `nanah-${remoteDeviceId}`,
                        remoteDeviceId,
                        deviceLabel: getNanahRemoteLabel(),
                        capabilities: safeArray(remote.capabilities),
                        localRole: getNanahRole(),
                        remoteRole: normalizeString(nanahSessionState.remoteRole) || 'peer',
                        linkType: 'managed_link',
                        policy: {
                            ...safeObject(root.savedManagedLink)
                        }
                    });
                }
            }
            UIComponents.showToast(
                accepted
                    ? `${getNanahRemoteLabel()} accepted the sync`
                    : `${getNanahRemoteLabel()} declined the sync`,
                accepted ? 'success' : 'info'
            );
            return;
        }
        if (root.t === 'control_proposal' || root.t === 'app_sync') {
            await handleNanahIncomingProposal(root);
        }
    }

    async function createNanahClient() {
        if (!isNanahAvailable()) {
            throw new Error('Nanah runtime is not available');
        }
        if (nanahClient) {
            await resetNanahSession(true);
        }
        await ensureNanahStableDeviceId();

        const device = buildNanahDeviceDescriptor();
        const NanahApi = window.FilterTubeNanah;
        const client = new NanahApi.NanahClient({
            app: 'filtertube',
            device,
            transport: new NanahApi.WebRtcDataChannelTransport({
                signalingUrl: NanahApi.DEFAULT_NANAH_SIGNALING_URL
            })
        });
        const currentClient = client;

        client.on('code', (payload) => {
            if (nanahClient !== currentClient) return;
            nanahSessionState.code = normalizeNanahCode(payload?.code);
            nanahSessionState.pairUri = buildNanahPairUri(nanahSessionState.code);
            updateNanahUi();
        });
        client.on('stage', (stage) => {
            if (nanahClient !== currentClient) return;
            nanahSessionState.stage = stage;
            if (stage === 'closed') {
                Promise.resolve(resetNanahSession(false)).catch(() => { });
                return;
            }
            updateNanahUi();
        });
        client.on('sas', (payload) => {
            if (nanahClient !== currentClient) return;
            nanahSessionState.sasPhrase = normalizeString(payload?.phrase);
            updateNanahUi();
            UIComponents.showToast('Compare the safety phrase on both devices', 'info');
        });
        client.on('connected', async () => {
            if (nanahClient !== currentClient) return;
            nanahSessionState.connected = true;
            updateNanahUi();
            try {
                await sendNanahHelloEnvelope();
            } catch (error) {
                console.warn('FilterTube: failed to send Nanah hello', error);
            }
        });
        client.on('data', (envelope) => {
            if (nanahClient !== currentClient) return;
            Promise.resolve(handleNanahIncomingEnvelope(envelope)).catch((error) => {
                console.error('FilterTube: failed to handle Nanah envelope', error);
                UIComponents.showToast('Failed to process incoming Nanah sync', 'error');
            });
        });
        client.on('error', (error) => {
            if (nanahClient !== currentClient) return;
            console.error('FilterTube: Nanah session error', error);
            UIComponents.showToast(error?.message || 'Nanah session failed', 'error');
            Promise.resolve(resetNanahSession(false)).catch(() => { });
        });
        client.on('closed', () => {
            if (nanahClient !== currentClient) return;
            Promise.resolve(resetNanahSession(false)).catch(() => { });
        });

        nanahClient = client;
        updateNanahUi();
        return client;
    }

    async function trustConnectedNanahDevice() {
        const remote = safeObject(nanahSessionState.remoteDevice);
        const remoteDeviceId = normalizeString(remote.deviceId);
        if (!remoteDeviceId) {
            UIComponents.showToast('No connected device to trust yet', 'error');
            return;
        }

        const localRole = getNanahRole();
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || 'peer';
        const linkType = classifyNanahTrustedLink(localRole, remoteRole);
        if (!linkType) {
            UIComponents.showToast(
                `${getNanahRoleLabel(localRole)} + ${getNanahRoleLabel(remoteRole)} can pair temporarily, but only Peer + Peer or Source + Replica can be saved as a trusted link.`,
                'error'
            );
            return;
        }
        if (isNanahChildReplicaOnly() && (localRole !== 'replica' || remoteRole !== 'source' || linkType !== 'managed_link')) {
            UIComponents.showToast('Locked child profiles can only save managed Source -> Replica links. Unlock the child profile first to send from it.', 'error');
            return;
        }

        const scope = getNanahScope();
        const strategy = getNanahStrategy();
        let policy = {
            linkType,
            capabilities: safeArray(remote.capabilities),
            allowedScopes: [scope],
            defaultScope: scope,
            applyMode: strategy,
            autoApplyControlProposals: false,
            reconnectMode: linkType === 'managed_link' ? 'approval_needed' : 'fast',
            lockedChildMode: 'require_unlock',
            childProtectionLevel: isActiveChildNanahProfile() ? 'strict' : 'standard',
            targetProfileBehavior: isActiveChildNanahProfile() ? 'fixed_profile' : 'current_active',
            targetProfileId: getNanahLocalProfileContext().profileId,
            targetProfileName: getNanahLocalProfileContext().profileName
        };

        if (linkType === 'managed_link') {
            const trustPolicy = await showNanahManagedLinkModal({
                title: localRole === 'replica' ? 'Trust Managed Source' : 'Save Managed Link',
                message: localRole === 'replica'
                    ? `${getNanahRemoteLabel()} is connected as a source device.`
                    : `${getNanahRemoteLabel()} is connected as a replica device.`,
                intro: localRole === 'replica'
                    ? 'Save the scopes and policy this source may use later. Auto-apply is optional and only affects future matching updates.'
                    : 'Save the source-side managed policy now. The replica still chooses locally whether to trust and auto-apply on its own side.',
                initialPolicy: policy,
                allowApplyOnce: false,
                allowSave: true,
                saveLabel: 'Save Managed Link',
                cancelLabel: 'Cancel',
                showAutoApply: localRole === 'replica' && remoteRole === 'source',
                showReconnectMode: localRole === 'replica' && remoteRole === 'source',
                showLockedChildMode: localRole === 'replica' && remoteRole === 'source' && isActiveChildNanahProfile(),
                showTargetProfileMapping: localRole === 'replica' && remoteRole === 'source',
                forceFixedTargetProfile: localRole === 'replica' && remoteRole === 'source' && isActiveChildNanahProfile()
            });
            if (!trustPolicy?.policy) return;
            if (!(await ensureNanahManagedChildLinkPermission(trustPolicy.policy))) return;
            policy = {
                ...policy,
                ...trustPolicy.policy
            };
        }

        await saveNanahTrustedLink({
            linkId: `nanah-${remoteDeviceId}`,
            remoteDeviceId,
            deviceLabel: normalizeString(remote.deviceLabel) || remoteDeviceId,
            capabilities: safeArray(remote.capabilities),
            localRole,
            remoteRole,
            linkType,
            policy
        });
        UIComponents.showToast(linkType === 'managed_link' ? 'Managed link saved' : 'Trusted peer saved', 'success');
        updateNanahUi();
    }

    async function confirmSubscriptionsImportModeChoice() {
        const currentMode = StateManager.getState()?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        if (currentMode === 'whitelist') {
            return 'import-only';
        }

        return showChoiceModal({
            title: 'Import Subscribed Channels',
            message: 'This feature appends channels from your active YouTube account into this profile\'s whitelist.',
            details: [
                'Import Only keeps the imported subscriptions stored in whitelist and leaves your current blocklist exactly as it is.',
                'Import + Turn On Whitelist will also flip your current blocklist channels and keywords into whitelist and merge them with the imported subscribed channels.',
                'Choose whether to store the whitelist only, or store it and turn on whitelist mode when the import finishes.'
            ],
            choices: [
                {
                    value: 'import-only',
                    label: 'Import Only',
                    recommended: true
                },
                {
                    value: 'import-and-enable',
                    label: 'Import + Turn On Whitelist',
                    className: 'btn-secondary btn-import'
                }
            ],
            cancelText: 'Cancel'
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
        const childAdminRestricted = isChildProfileAdminSurface();
        const childAdminTitle = 'Child profiles cannot manage profile names, deletion, or PIN rules from this surface.';

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
            renameBtn.disabled = childAdminRestricted;
            renameBtn.title = childAdminRestricted ? childAdminTitle : '';
            renameBtn.addEventListener('click', async () => {
                if (childAdminRestricted) {
                    UIComponents.showToast('Child profiles cannot rename profiles here', 'error');
                    return;
                }
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
            deleteBtn.disabled = profileId === 'default' || childAdminRestricted;
            deleteBtn.title = childAdminRestricted ? childAdminTitle : '';
            deleteBtn.addEventListener('click', async () => {
                if (childAdminRestricted) {
                    UIComponents.showToast('Child profiles cannot delete profiles here', 'error');
                    return;
                }
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
                pinBtn.disabled = childAdminRestricted;
                pinBtn.title = childAdminRestricted ? childAdminTitle : '';
                pinBtn.addEventListener('click', async () => {
                    if (childAdminRestricted) {
                        UIComponents.showToast('Child profiles cannot manage profile PIN rules here', 'error');
                        return;
                    }
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
                clearPinBtn.disabled = !isProfileLocked(profilesV4, profileId) || childAdminRestricted;
                clearPinBtn.title = childAdminRestricted ? childAdminTitle : '';
                clearPinBtn.addEventListener('click', async () => {
                    if (childAdminRestricted) {
                        UIComponents.showToast('Child profiles cannot manage profile PIN rules here', 'error');
                        return;
                    }
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
            updateChildProfileCapabilityControls();
            renderProfileSelector(profilesV4);
            renderProfilesManager(profilesV4);
            applyLockGateIfNeeded();
            updateNanahUi();
            if (nanahClient && nanahSessionState.connected && nanahSessionState.sasConfirmed) {
                sendNanahHelloEnvelope(true).catch(() => { });
            }
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
    updateChildProfileCapabilityControls();
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
            scheduleProfileDropdownPositionTab();
        });

        window.addEventListener('scroll', () => {
            scheduleProfileDropdownPositionTab();
        }, true);

        document.addEventListener('click', (e) => {
            try {
                if (!ftProfileMenuTab) {
                    closeProfileDropdownTab();
                    return;
                }
                if (ftProfileMenuTab.contains(e.target) || ftProfileDropdownTab.contains(e.target)) return;
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

        if (['channelAdded', 'channelRemoved', 'load'].includes(eventType)) {
            renderChannels();
            renderKeywords(); // Re-render keywords in case channel-derived keywords changed
            updateStats();
            renderListModeControls();
            syncSubscriptionsImportControls();
        }

        if (eventType === 'channelUpdated') {
            const channelOnlyToggleUpdate = !!(data && (
                Object.prototype.hasOwnProperty.call(data, 'filterAll') ||
                Object.prototype.hasOwnProperty.call(data, 'filterAllComments')
            ));
            if (!channelOnlyToggleUpdate) {
                renderChannels();
            }
            renderKeywords(); // Re-render keywords in case channel-derived keywords changed
            updateStats();
            renderListModeControls();
            syncSubscriptionsImportControls();
        }

        if (['kidsKeywordAdded', 'kidsKeywordRemoved', 'kidsKeywordUpdated', 'load', 'save'].includes(eventType)) {
            renderKidsKeywords();
            updateStats();
            renderListModeControls();
        }

        if (['kidsChannelAdded', 'kidsChannelRemoved', 'load'].includes(eventType)) {
            renderKidsChannels();
            renderKidsKeywords();
            updateStats();
            renderListModeControls();
        }

        if (eventType === 'kidsChannelUpdated') {
            const kidsChannelOnlyToggleUpdate = !!(data && (
                Object.prototype.hasOwnProperty.call(data, 'filterAll') ||
                Object.prototype.hasOwnProperty.call(data, 'filterAllComments')
            ));
            if (!kidsChannelOnlyToggleUpdate) {
                renderKidsChannels();
            }
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
            renderSubscriptionsImportState();
        }

        if (eventType === 'themeChanged') {
            // Theme already applied by StateManager
        }
    });

    // ============================================================================
    // IMPORT / EXPORT (V3)
    // ============================================================================

    /**
     * Fallback download via anchor click - works in Firefox when downloads API fails
     */
    function downloadViaAnchor(blob, filename) {
        return new Promise((resolve) => {
            try {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    try {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                    } catch (e) {
                        // ignore cleanup errors
                    }
                    resolve({ filename, method: 'anchor' });
                }, 150);
            } catch (e) {
                // Even if anchor fails, resolve with error info
                resolve({ filename, method: 'anchor', error: e.message });
            }
        });
    }

    function downloadJsonToDownloadsFolder(folder, filename, obj, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const json = JSON.stringify(obj, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const preferAnchor = options && options.preferAnchor === true;

                // Firefox has been flaky here for encrypted exports; bypass the downloads API
                // when explicitly requested and let the browser handle a direct attachment save.
                if (preferAnchor || !runtimeAPI?.downloads?.download) {
                    downloadViaAnchor(blob, filename).then(resolve);
                    return;
                }

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
                        // Firefox 147+ may fail with subfolder paths - fallback to anchor
                        console.warn('FilterTube: Downloads API failed, using anchor fallback:', err.message);
                        downloadViaAnchor(blob, filename)
                            .then(resolve)
                            .catch(() => reject(new Error(err.message || 'Download failed')));
                        return;
                    }
                    resolve({ downloadId, filename: fullPath, method: 'downloads_api' });
                });
            } catch (e) {
                reject(e);
            }
        });
    }


    async function runExportV3() {
        if (!ensureNonChildAdminAction('Child profiles cannot export backups from this surface.')) {
            return;
        }
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
        if (!ensureNonChildAdminAction('Child profiles cannot export encrypted backups from this surface.')) {
            return;
        }
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

            const includeTrustedNanahState = !ftExportActiveOnly?.checked;
            const payload = await io.exportV3Encrypted({
                scope: ftExportActiveOnly?.checked ? 'active' : 'auto',
                password,
                auth,
                includeTrustedNanahState
            });

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

            await downloadJsonToDownloadsFolder('FilterTube Export', filename, payload, {
                preferAnchor: IS_FIREFOX_TAB_VIEW
            });
            UIComponents.showToast(
                payload?.meta?.containsNanahTrustedState === true
                    ? 'Exported encrypted backup with trusted-device recovery data'
                    : 'Exported encrypted JSON to Downloads/FilterTube Export/',
                'success'
            );
        } catch (e) {
            UIComponents.showToast('Encrypted export failed', 'error');
            console.error('Export encrypted failed', e);
        }
    }

    async function runImportV3FromFile(file) {
        if (!file) return;
        if (!ensureNonChildAdminAction('Child profiles cannot import backups from this surface.')) {
            return;
        }
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
            let restoreTrustedNanahState = false;
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

                const nanahBackupState = safeObject(payload.nanahState);
                const hasNanahRecoveryData = normalizeString(nanahBackupState.deviceId)
                    || safeArray(nanahBackupState.trustedLinks).length > 0;
                if (
                    safeObject(parsed?.meta).encrypted === true
                    && hasNanahRecoveryData
                    && localActive === 'default'
                    && effectiveScope === 'full'
                ) {
                    const restoreChoice = await showChoiceModal({
                        title: 'Restore Trusted Devices Too?',
                        message: 'This encrypted full backup also contains Nanah trusted-device recovery data.',
                        details: [
                            'Use this only when restoring the same device after reinstall or local data loss.',
                            'Restoring it on a different device can clone the saved Nanah device identity.',
                            'Choose Settings Only to restore profiles, filters, and rules without restoring trusted-device identity.'
                        ],
                        choices: [
                            {
                                value: 'settings_only',
                                label: 'Settings Only',
                                recommended: true
                            },
                            {
                                value: 'restore_trust',
                                label: 'Restore Trusted Devices',
                                className: 'btn-secondary'
                            }
                        ],
                        cancelText: 'Cancel'
                    });
                    if (!restoreChoice) return;
                    restoreTrustedNanahState = restoreChoice === 'restore_trust';
                }
            } catch (e) {
            }

            const importResult = await io.importV3(payload, {
                strategy: 'merge',
                scope: 'auto',
                auth: {
                    ...(auth || {}),
                    restoreTrustedNanahState
                }
            });

            await StateManager.loadSettings();
            const state = StateManager.getState();
            const SettingsAPI = window.FilterTubeSettings || {};
            if (SettingsAPI.applyThemePreference) {
                SettingsAPI.applyThemePreference(state.theme);
            }
            if (importResult?.restoredNanahState) {
                nanahStableDeviceId = '';
                await ensureNanahStableDeviceId();
                await loadNanahTrustedLinks();
                updateNanahUi();
            }

            UIComponents.showToast(
                importResult?.restoredNanahState
                    ? 'Import complete and trusted-device recovery data restored'
                    : 'Import complete',
                'success'
            );
        } catch (e) {
            UIComponents.showToast('Import failed (invalid file?)', 'error');
            console.error('Import V3 failed', e);
        }
    }

    if (ftExportV3Btn) {
        ftExportV3Btn.addEventListener('click', () => {
            if (getActiveProfileType() === 'child') {
                UIComponents.showToast('Child profiles cannot export backups here', 'error');
                return;
            }
            runExportV3();
        });
    }

    if (ftExportV3EncryptedBtn) {
        ftExportV3EncryptedBtn.addEventListener('click', () => {
            if (getActiveProfileType() === 'child') {
                UIComponents.showToast('Child profiles cannot export encrypted backups here', 'error');
                return;
            }
            runExportV3Encrypted();
        });
    }

    if (ftImportV3Btn && ftImportV3File) {
        ftImportV3Btn.addEventListener('click', () => {
            if (getActiveProfileType() === 'child') {
                UIComponents.showToast('Child profiles cannot import backups here', 'error');
                return;
            }
            ftImportV3File.click();
        });

        ftImportV3File.addEventListener('change', async (e) => {
            const file = e.target?.files?.[0] || null;
            await runImportV3FromFile(file);
            e.target.value = '';
        });
    }

    if (ftImportSyncDeviceBtn) {
        ftImportSyncDeviceBtn.addEventListener('click', () => {
            if (typeof window.switchView === 'function') {
                window.switchView('sync');
            } else {
                document.querySelector('.nav-item[data-tab="sync"]')?.click();
            }
        });
    }

    if (ftNanahJoinCode) {
        ftNanahJoinCode.addEventListener('input', () => {
            const normalized = extractNanahCodeFromInput(ftNanahJoinCode.value);
            if (ftNanahJoinCode.value !== normalized) {
                ftNanahJoinCode.value = normalized;
            }
        });
    }

    if (ftNanahDeviceLabel && !normalizeString(ftNanahDeviceLabel.value)) {
        ftNanahDeviceLabel.value = await loadNanahPreferredDeviceLabel();
    }
    nanahUiMode = await loadNanahUiModePreference();
    setNanahModeButtons(nanahUiMode);

    await ensureNanahStableDeviceId();
    await loadNanahTrustedLinks();
    renderNanahTrustedLinks();
    setNanahMode(nanahUiMode, { persist: false, applyPreset: true });
    updateNanahUi();

    [ftNanahRole, ftNanahScope, ftNanahStrategy, ftNanahRemoteTarget].forEach((element) => {
        if (!element) return;
        element.addEventListener('change', () => {
            if (!isApplyingNanahModePreset && element !== ftNanahRemoteTarget) {
                nanahUiMode = inferNanahUiModeFromControls();
                setNanahModeButtons(nanahUiMode);
                void persistNanahUiModePreference(nanahUiMode);
            }
            updateNanahUi();
        });
        element.addEventListener('input', () => {
            refreshNanahAdvancedSummary();
        });
    });

    if (ftNanahAdvancedDetails) {
        ftNanahAdvancedDetails.addEventListener('toggle', () => {
            refreshNanahAdvancedSummary();
        });
    }

    [
        ftNanahModeSendOnce,
        ftNanahModeParent,
        ftNanahModeFull
    ].forEach((button) => {
        if (!button) return;
        button.addEventListener('click', () => {
            if (button.disabled) return;
            setNanahMode(button.dataset.mode, { persist: true, applyPreset: true });
        });
    });

    if (ftNanahDeviceLabel) {
        ftNanahDeviceLabel.addEventListener('input', () => {
            if (!nanahClient) {
                void persistNanahPreferredDeviceLabel();
            }
        });
        ftNanahDeviceLabel.addEventListener('blur', () => {
            void persistNanahPreferredDeviceLabel();
        });
        ftNanahDeviceLabel.addEventListener('change', () => {
            void persistNanahPreferredDeviceLabel();
            updateNanahUi();
        });
    }

    if (!isNanahAvailable()) {
        [
            ftNanahHostBtn,
            ftNanahJoinBtn,
            ftNanahSendBtn,
            ftNanahTrustBtn,
            ftNanahEndSessionBtn,
            ftNanahConfirmSasBtn,
            ftNanahCopyPairUriBtn
        ].forEach((button) => {
            if (button) button.disabled = true;
        });
        if (ftNanahStatusHint) {
            ftNanahStatusHint.textContent = 'Nanah runtime is not available in this build yet.';
        }
    } else {
        if (ftNanahHostBtn) {
            ftNanahHostBtn.addEventListener('click', async () => {
                try {
                    const client = await createNanahClient();
                    nanahSessionState.stage = 'hosting';
                    nanahSessionState.code = '';
                    nanahSessionState.pairUri = '';
                    nanahSessionState.sasPhrase = '';
                    nanahSessionState.sasConfirmed = false;
                    nanahSessionState.remoteDevice = null;
                    nanahSessionState.remoteProfile = null;
                    nanahSessionState.remoteProfileInventory = [];
                    nanahSessionState.remoteTargetProfile = null;
                    nanahSessionState.remoteRole = 'peer';
                    nanahSessionState.helloSent = false;
                    updateNanahUi();
                    const result = await client.host();
                    nanahSessionState.code = normalizeNanahCode(result?.code);
                    nanahSessionState.pairUri = buildNanahPairUri(nanahSessionState.code);
                    updateNanahUi();
                    UIComponents.showToast(`Pairing code ${nanahSessionState.code} is ready`, 'success');
                } catch (error) {
                    console.error('FilterTube: failed to host Nanah session', error);
                    UIComponents.showToast(error?.message || 'Failed to create pairing code', 'error');
                }
            });
        }

        if (ftNanahJoinBtn && ftNanahJoinCode) {
            ftNanahJoinBtn.addEventListener('click', async () => {
                const code = extractNanahCodeFromInput(ftNanahJoinCode.value);
                if (code.length < 4) {
                    UIComponents.showToast('Enter the 4-character pairing code first', 'error');
                    return;
                }
                const existingCode = normalizeNanahCode(nanahSessionState.code);
                if (nanahClient && existingCode && existingCode === code) {
                    UIComponents.showToast('This device is already using that pairing code. End the current session or join from another browser/device.', 'error');
                    return;
                }
                try {
                    const client = await createNanahClient();
                    nanahSessionState.code = code;
                    nanahSessionState.pairUri = buildNanahPairUri(code);
                    nanahSessionState.stage = 'joining';
                    nanahSessionState.sasPhrase = '';
                    nanahSessionState.sasConfirmed = false;
                    nanahSessionState.remoteDevice = null;
                    nanahSessionState.remoteProfile = null;
                    nanahSessionState.remoteProfileInventory = [];
                    nanahSessionState.remoteTargetProfile = null;
                    nanahSessionState.remoteRole = 'peer';
                    nanahSessionState.helloSent = false;
                    updateNanahUi();
                    await client.join(code);
                    UIComponents.showToast(`Joining code ${code}`, 'info');
                } catch (error) {
                    console.error('FilterTube: failed to join Nanah session', error);
                    UIComponents.showToast(error?.message || 'Failed to join pairing code', 'error');
                }
            });
        }

        if (ftNanahConfirmSasBtn) {
            ftNanahConfirmSasBtn.addEventListener('click', async () => {
                if (!nanahClient || !normalizeString(nanahSessionState.sasPhrase)) return;
                try {
                    const confirmed = await showChoiceModal({
                        title: 'Confirm Safety Phrase',
                        message: 'Only continue if both devices show the exact same phrase.',
                        details: [
                            `Phrase: ${nanahSessionState.sasPhrase}`,
                            'This prevents the signaling relay from silently impersonating one side of the session.'
                        ],
                        choices: [
                            {
                                value: 'confirm',
                                label: 'Phrase Matches',
                                recommended: true
                            }
                        ],
                        cancelText: 'Not Yet'
                    });
                    if (confirmed !== 'confirm') return;
                    await nanahClient.confirmSas();
                    nanahSessionState.sasConfirmed = true;
                    updateNanahUi();
                    await sendNanahHelloEnvelope();
                    UIComponents.showToast('Secure session confirmed', 'success');
                } catch (error) {
                    console.error('FilterTube: failed to confirm SAS', error);
                    UIComponents.showToast('Failed to confirm safety phrase', 'error');
                }
            });
        }

        if (ftNanahCopyPairUriBtn) {
            ftNanahCopyPairUriBtn.addEventListener('click', async () => {
                const pairUri = normalizeString(nanahSessionState.pairUri);
                if (!pairUri) return;
                try {
                    await navigator.clipboard.writeText(pairUri);
                    UIComponents.showToast('Pairing link copied', 'success');
                } catch (error) {
                    console.error('FilterTube: failed to copy Nanah pair URI', error);
                    UIComponents.showToast('Could not copy pairing link', 'error');
                }
            });
        }

        if (ftNanahSendBtn) {
            ftNanahSendBtn.addEventListener('click', async () => {
                if (!nanahClient || !nanahSessionState.connected || !nanahSessionState.sasConfirmed) {
                    UIComponents.showToast('Finish pairing and confirm the safety phrase first', 'error');
                    return;
                }
                try {
                    const adapter = window.FilterTubeNanahAdapter || {};
                    if (typeof adapter.buildControlProposal !== 'function') {
                        throw new Error('FilterTube Nanah adapter is unavailable');
                    }
                    const selectionScope = getNanahScope();
                    const okTarget = await confirmNanahRemoteTarget(selectionScope);
                    if (!okTarget) {
                        return;
                    }
                    const selectionStrategy = getNanahStrategy();
                    const policy = buildNanahOutgoingProposalPolicy(selectionScope, selectionStrategy);
                    const auth = await ensureNanahOutgoingAuth(policy.scope);
                    let envelope = await adapter.buildControlProposal({ scope: policy.scope, strategy: policy.strategy, auth });
                    envelope = attachNanahProposalPolicy(envelope, policy);
                    await nanahClient.send(envelope);
                    UIComponents.showToast(`Sent ${policy.scope} settings to ${getNanahRemoteLabel()}`, 'success');
                } catch (error) {
                    console.error('FilterTube: failed to send Nanah settings', error);
                    UIComponents.showToast(error?.message || 'Failed to send settings', 'error');
                }
            });
        }

        if (ftNanahTrustBtn) {
            ftNanahTrustBtn.addEventListener('click', async () => {
                try {
                    await trustConnectedNanahDevice();
                } catch (error) {
                    console.error('FilterTube: failed to trust Nanah device', error);
                    UIComponents.showToast(error?.message || 'Failed to trust device', 'error');
                }
            });
        }

        if (ftNanahEndSessionBtn) {
            ftNanahEndSessionBtn.addEventListener('click', async () => {
                await resetNanahSession(true);
                UIComponents.showToast('Nanah session ended', 'success');
            });
        }
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
            await scheduleAutoBackup('setting_updated');
        };

        ftAllowAccountCreation.addEventListener('change', async () => {
            if (!ensureNonChildAdminAction('Child profiles cannot change account policy here.')) {
                updateAdminPolicyControls();
                return;
            }
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
            if (!ensureNonChildAdminAction('Child profiles cannot change account policy here.')) {
                updateAdminPolicyControls();
                return;
            }
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
            if (!ensureNonChildAdminAction('Child profiles cannot manage accounts here.')) {
                return;
            }
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
            if (!ensureNonChildAdminAction('Child profiles cannot create child profiles here.')) {
                return;
            }
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
            if (!ensureNonChildAdminAction('Child profiles cannot manage the Master PIN here.')) {
                return;
            }
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
            if (!ensureNonChildAdminAction('Child profiles cannot manage the Master PIN here.')) {
                return;
            }
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
                profilesV4Cache = {
                    ...fresh,
                    profiles,
                    activeProfileId: activeId
                };
                await refreshProfilesUI();
                UIComponents.showToast('Backup settings updated', 'success');
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
                profilesV4Cache = {
                    ...fresh,
                    profiles,
                    activeProfileId: activeId
                };
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
            text: profileType === 'kids' ? 'Whitelist Kids' : 'Whitelist',
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
                    const confirmMsg = profileType === 'kids'
                        ? 'Copy your current YT Kids blocklist into whitelist to get started?'
                        : 'Copy your current blocklist into whitelist to get started?';
                    copyBlocklist = window.confirm(confirmMsg);
                    if (!copyBlocklist) {
                        const infoMsg = profileType === 'kids'
                            ? 'YT Kids whitelist is empty — videos will stay hidden until you add allow rules.'
                            : 'Whitelist is empty — videos will stay hidden until you add allow rules.';
                        UIComponents.showToast(infoMsg, 'info');
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
                renderKidsKeywords();
                renderKidsChannels();
                updateCheckboxes();
                updateStats();
                renderListModeControls();
            },
            className: ''
        });

        ftTopBarListModeControlsTab.appendChild(toggle);

        if (profileType === 'main' && currentMode === 'whitelist' && subscriptionsImportState.canEnableWhitelist) {
            setSubscriptionsImportState({
                tone: 'success',
                message: 'Imported subscribed channels are now active in whitelist mode.',
                canEnableWhitelist: false
            });
        } else {
            syncSubscriptionsImportControls();
        }
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

        syncSubscriptionsImportControls();
        updateChildProfileCapabilityControls();
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

    let dashboardStatsSurface = 'main';
    let dashboardStatsRotationTimer = 0;
    let dashboardStatsUserOverride = false;

    function getDashboardSurfaceStats(surface, state) {
        const bySurface = (state && state.statsBySurface && typeof state.statsBySurface === 'object' && !Array.isArray(state.statsBySurface))
            ? state.statsBySurface
            : {};

        const picked = bySurface[surface] && typeof bySurface[surface] === 'object' ? bySurface[surface] : null;
        if (picked) return picked;
        if (surface === 'main') return state?.stats || {};
        return {};
    }

    function getDashboardCounts(surface, state) {
        const mainMode = state?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        const kidsMode = state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        const Settings = window.FilterTubeSettings || {};

        if (surface === 'kids') {
            const channels = (kidsMode === 'whitelist')
                ? (Array.isArray(state?.kids?.whitelistChannels) ? state.kids.whitelistChannels : [])
                : (Array.isArray(state?.kids?.blockedChannels) ? state.kids.blockedChannels : []);

            const keywordBase = (kidsMode === 'whitelist')
                ? (Array.isArray(state?.kids?.whitelistKeywords) ? state.kids.whitelistKeywords : [])
                : (Array.isArray(state?.kids?.blockedKeywords) ? state.kids.blockedKeywords : []);

            const keywords = (kidsMode === 'whitelist')
                ? keywordBase
                : (typeof Settings.syncFilterAllKeywords === 'function'
                    ? Settings.syncFilterAllKeywords(keywordBase, channels)
                    : keywordBase);

            return {
                keywordCount: keywords.length,
                channelCount: channels.length
            };
        }

        const channels = (mainMode === 'whitelist')
            ? (Array.isArray(state?.whitelistChannels) ? [...state.whitelistChannels] : [])
            : (Array.isArray(state?.channels) ? [...state.channels] : []);

        const keywords = (mainMode === 'whitelist')
            ? (Array.isArray(state?.whitelistKeywords) ? [...state.whitelistKeywords] : [])
            : (Array.isArray(state?.keywords) ? [...state.keywords] : []);

        if (state?.syncKidsToMain && kidsMode === mainMode) {
            const kidsChannels = mainMode === 'whitelist'
                ? (Array.isArray(state?.kids?.whitelistChannels) ? state.kids.whitelistChannels : [])
                : (Array.isArray(state?.kids?.blockedChannels) ? state.kids.blockedChannels : []);
            const keyFor = (ch) => {
                const id = typeof ch?.id === 'string' ? ch.id.trim().toLowerCase() : '';
                const handle = typeof ch?.handle === 'string' ? ch.handle.trim().toLowerCase() : '';
                return id || handle;
            };
            const seen = new Set(channels.map(keyFor).filter(Boolean));
            kidsChannels.forEach(ch => {
                const k = keyFor(ch);
                if (!k || seen.has(k)) return;
                seen.add(k);
                channels.push(ch);
            });

            const kidsKeywords = mainMode === 'whitelist'
                ? (Array.isArray(state?.kids?.whitelistKeywords) ? state.kids.whitelistKeywords : [])
                : (Array.isArray(state?.kids?.blockedKeywords) ? state.kids.blockedKeywords : []);
            const keywordSeen = new Set(keywords.map(k => {
                const word = typeof k === 'object' ? k.word : String(k);
                return word.toLowerCase();
            }));
            kidsKeywords.forEach(k => {
                const word = typeof k === 'object' ? k.word : String(k);
                if (!keywordSeen.has(word.toLowerCase())) {
                    keywordSeen.add(word.toLowerCase());
                    keywords.push(k);
                }
            });
        }

        return {
            keywordCount: keywords.length,
            channelCount: channels.length
        };
    }

    function formatSavedTime(totalSeconds) {
        const safeSeconds = (typeof totalSeconds === 'number' && Number.isFinite(totalSeconds)) ? Math.max(0, totalSeconds) : 0;

        if (safeSeconds < 60) {
            return `${safeSeconds}s`;
        }
        if (safeSeconds < 3600) {
            const mins = Math.floor(safeSeconds / 60);
            const secs = safeSeconds % 60;
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        }

        const hours = Math.floor(safeSeconds / 3600);
        const mins = Math.floor((safeSeconds % 3600) / 60);
        const secs = safeSeconds % 60;
        if (secs > 0) return `${hours}h ${mins}m ${secs}s`;
        if (mins > 0) return `${hours}h ${mins}m`;
        return `${hours}h`;
    }

    function setDashboardStatsSurface(nextSurface, options = {}) {
        const next = nextSurface === 'kids' ? 'kids' : 'main';
        dashboardStatsSurface = next;
        if (options.user) {
            dashboardStatsUserOverride = true;
        }
        updateStats();
    }

    function scheduleDashboardStatsRotation() {
        if (dashboardStatsRotationTimer) {
            clearInterval(dashboardStatsRotationTimer);
            dashboardStatsRotationTimer = 0;
        }

        const state = StateManager.getState();
        const mainCounts = getDashboardCounts('main', state);
        const kidsCounts = getDashboardCounts('kids', state);
        const hasMain = (mainCounts.keywordCount + mainCounts.channelCount) > 0;
        const hasKids = (kidsCounts.keywordCount + kidsCounts.channelCount) > 0;

        if (!hasMain && hasKids) {
            dashboardStatsSurface = 'kids';
            return;
        }
        if (hasMain && !hasKids) {
            dashboardStatsSurface = 'main';
            return;
        }
        if (!hasMain && !hasKids) {
            dashboardStatsSurface = 'main';
            return;
        }

        if (dashboardStatsUserOverride) {
            return;
        }

        dashboardStatsRotationTimer = setInterval(() => {
            dashboardStatsSurface = dashboardStatsSurface === 'main' ? 'kids' : 'main';
            updateStats();
        }, 2500);
    }

    function updateStats() {
        const state = StateManager.getState();

        // Update stat cards
        const statActiveKeywords = document.getElementById('statActiveKeywords');
        const statFilteredChannels = document.getElementById('statFilteredChannels');
        const statHiddenToday = document.getElementById('statHiddenToday');
        const statSavedTime = document.getElementById('statSavedTime');

        const dashboardStatsSourceLabel = document.getElementById('dashboardStatsSourceLabel');
        const dashboardStatsMainBtn = document.getElementById('dashboardStatsMainBtn');
        const dashboardStatsKidsBtn = document.getElementById('dashboardStatsKidsBtn');

        if (dashboardStatsMainBtn && !dashboardStatsMainBtn.__filtertubeBound) {
            dashboardStatsMainBtn.__filtertubeBound = true;
            dashboardStatsMainBtn.addEventListener('click', () => setDashboardStatsSurface('main', { user: true }));
        }
        if (dashboardStatsKidsBtn && !dashboardStatsKidsBtn.__filtertubeBound) {
            dashboardStatsKidsBtn.__filtertubeBound = true;
            dashboardStatsKidsBtn.addEventListener('click', () => setDashboardStatsSurface('kids', { user: true }));
        }

        const surface = dashboardStatsSurface === 'kids' ? 'kids' : 'main';
        const counts = getDashboardCounts(surface, state);
        const surfaceStats = getDashboardSurfaceStats(surface, state);

        if (dashboardStatsSourceLabel) {
            dashboardStatsSourceLabel.textContent = surface === 'kids'
                ? 'Dashboard stats: YouTube Kids'
                : 'Dashboard stats: YouTube Main';
        }
        if (dashboardStatsMainBtn) {
            dashboardStatsMainBtn.classList.toggle('active', surface === 'main');
        }
        if (dashboardStatsKidsBtn) {
            dashboardStatsKidsBtn.classList.toggle('active', surface === 'kids');
        }

        if (statActiveKeywords) {
            statActiveKeywords.textContent = counts.keywordCount || 0;
        }

        if (statFilteredChannels) {
            statFilteredChannels.textContent = counts.channelCount || 0;
        }

        if (statHiddenToday) {
            statHiddenToday.textContent = surfaceStats?.hiddenCount || 0;
        }

        if (statSavedTime) {
            statSavedTime.textContent = formatSavedTime(surfaceStats?.savedSeconds || 0);
        }

        scheduleDashboardStatsRotation();
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
    renderSubscriptionsImportState();
    syncSubscriptionsImportControls();

    if (runtimeAPI?.runtime?.onMessage?.addListener) {
        runtimeAPI.runtime.onMessage.addListener((message) => {
            if (message?.action !== 'FilterTube_SubscriptionsImportProgress') {
                return false;
            }

            if (!subscriptionsImportState.inProgress) {
                return false;
            }

            if (normalizeString(message?.requestId) !== normalizeString(subscriptionsImportState.requestId)) {
                return false;
            }

            const sourceTabId = Number(message?.sourceTabId);
            if (Number.isFinite(subscriptionsImportState.sourceTabId) && Number.isFinite(sourceTabId) && subscriptionsImportState.sourceTabId !== sourceTabId) {
                return false;
            }

            handleSubscriptionsImportProgress(message?.progress || {});
            return false;
        });
    }

    if (importSubscriptionsActions) {
        importSubscriptionsActions.addEventListener('click', async (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const action = normalizeString(target.getAttribute('data-import-action'));
            if (!action) return;

            if (action === 'enable-whitelist') {
                await enableWhitelistModeAfterImport();
                return;
            }
            if (action === 'retry-import') {
                await startSubscribedChannelsImport('manual');
            }
        });
    }

    if (importSubscriptionsBtn) {
        importSubscriptionsBtn.addEventListener('click', async () => {
            await startSubscribedChannelsImport('manual');
        });
    }

    if (!subscriptionsImportFlowConsumed) {
        const flow = normalizeString(new URLSearchParams(window.location.search || '').get('flow')).toLowerCase();
        const section = normalizeString(new URLSearchParams(window.location.search || '').get('section')).toLowerCase();
        if (flow === 'import-subscriptions' && (section === 'channels' || section === 'channel' || section === 'channelmanagement')) {
            subscriptionsImportFlowConsumed = true;
            requestAnimationFrame(() => {
                importSubscriptionsBtn?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                importSubscriptionsBtn?.focus?.();
            });
        }
    }

    // ============================================================================
    // EVENT HANDLERS - Keywords
    // ============================================================================

    if (addKeywordBtn) {
        addKeywordBtn.addEventListener('click', async () => {
            if (isUiLocked()) return;
            const word = (keywordInput?.value || '').trim();
            if (!word) return;

            const success = await StateManager.addKeyword(word);
            if (success) {
                if (keywordInput) keywordInput.value = '';
                UIComponents.flashButtonSuccess(addKeywordBtn, 'Added!', 1200);
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
            const input = (channelInput?.value || '').trim();
            if (!input) return;

            const originalText = addChannelBtn.textContent;
            addChannelBtn.textContent = 'Fetching...';
            addChannelBtn.disabled = true;

            try {
                const result = await StateManager.addChannel(input);

                if (result.success) {
                    if (channelInput) channelInput.value = '';
                    // Reset button text BEFORE flashing success message
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    UIComponents.flashButtonSuccess(addChannelBtn, 'Added!', 1200);
                } else {
                    addChannelBtn.textContent = originalText;
                    addChannelBtn.disabled = false;
                    UIComponents.showToast(result.error || 'Failed to add channel', 'error');
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
            const word = (kidsKeywordInput?.value || '').trim();
            if (!word) return;
            const success = await StateManager.addKidsKeyword(word);
            if (success) {
                if (kidsKeywordInput) kidsKeywordInput.value = '';
                UIComponents.flashButtonSuccess(kidsAddKeywordBtn, 'Added!', 1200);
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
            const input = (kidsChannelInput?.value || '').trim();
            if (!input) return;
            const result = await StateManager.addKidsChannel(input);
            if (result.success) {
                if (kidsChannelInput) kidsChannelInput.value = '';
                UIComponents.flashButtonSuccess(kidsAddChannelBtn, 'Added!', 1200);
            } else {
                UIComponents.showToast(result.error || 'Failed to add channel', 'error');
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
    const quickKidsModeBtn = document.getElementById('quickKidsModeBtn');

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

    if (quickKidsModeBtn) {
        quickKidsModeBtn.addEventListener('click', () => {
            switchView('kids');
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
            try {
                document.getElementById('sidebarNav')?.classList.remove('open');
                document.getElementById('sidebarOverlay')?.classList.remove('visible');
            } catch (e) {
            }
        });
    });

    function switchView(viewId) {
        let effectiveViewId = viewId;
        try {
            if (effectiveViewId === 'semantic' && !FILTERTUBE_SEMANTIC_ML_ENABLED) {
                effectiveViewId = 'filters';
            }
            if (typeof window.FilterTubeResolveViewAccess === 'function') {
                effectiveViewId = window.FilterTubeResolveViewAccess(effectiveViewId)?.viewId || effectiveViewId;
            }
        } catch (e) {
            effectiveViewId = (viewId === 'semantic' && !FILTERTUBE_SEMANTIC_ML_ENABLED) ? 'filters' : viewId;
        }

        // Update nav items
        navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-tab') === effectiveViewId);
        });

        // Update view sections
        let activeSection = null;
        viewSections.forEach(section => {
            section.classList.toggle('active', section.id === `${effectiveViewId}View`);
            if (section.id === `${effectiveViewId}View`) {
                activeSection = section;
            }
        });

        if (typeof closeProfileDropdownTab === 'function') {
            closeProfileDropdownTab();
        } else if (typeof window.closeProfileDropdownTab === 'function') {
            window.closeProfileDropdownTab();
        }
        if (typeof resetTabViewScroll === 'function') {
            resetTabViewScroll(activeSection);
        } else if (typeof window.resetTabViewScroll === 'function') {
            window.resetTabViewScroll(activeSection);
        }

        try {
            document.body.dataset.activeView = effectiveViewId;
            document.documentElement.dataset.activeView = effectiveViewId;
        } catch (e) {
        }

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'filters': 'Filters',
            'semantic': 'Semantic ML',
            'kids': 'Kids Mode',
            'settings': 'Settings',
            'sync': 'Accounts & Sync',
            'whatsnew': 'What’s New',
            'help': 'Help',
            'donate': 'Donate',
            'support': 'Donate'
        };
        if (pageTitle && titles[effectiveViewId]) {
            pageTitle.textContent = titles[effectiveViewId];
        }

        try {
            const nextHash = `#${effectiveViewId}`;
            if (window.location.hash !== nextHash) {
                window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
            }
        } catch (e) {
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

// ============================================================================
// UI UTILITY FUNCTIONS
// ============================================================================

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'ft-success-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after animation completes
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
