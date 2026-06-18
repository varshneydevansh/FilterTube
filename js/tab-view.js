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
        <div id="managedChildFiltersBanner" class="ft-managed-child-editor" hidden></div>

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
        <div id="managedChildFiltersChannelBanner" class="ft-managed-child-editor" hidden></div>

        <div class="filter-controls">
            <input type="text" id="searchChannels" class="search-input" placeholder="Search channels..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="channelSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
                <select id="channelSourceFilter" class="select-input channel-source-filter" title="Show manual channels, imported-list channels, or one saved list">
                    <option value="all">All sources</option>
                    <option value="manual">Manual</option>
                    <option value="lists">Imported lists</option>
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

    const managedChildFiltersContentBanner = document.createElement('div');
    managedChildFiltersContentBanner.id = 'managedChildFiltersContentBanner';
    managedChildFiltersContentBanner.className = 'ft-managed-child-editor';
    managedChildFiltersContentBanner.hidden = true;
    contentTab.appendChild(managedChildFiltersContentBanner);

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
        const managedState = window.__filtertubeIsManagedChildEditFor?.('main') === true
            ? (window.__filtertubeBuildManagedChildState?.('main') || null)
            : null;

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
        const priorSignature = computeCategoryFiltersSignature(managedState?.categoryFilters || StateManager.getState()?.categoryFilters || {});
        const previousSignature = lastSavedCategoryFiltersSignatureMain;
        if (signature && (signature === priorSignature || (!managedState && signature === previousSignature))) {
            if (showToast && Date.now() - lastCategoryFiltersToastTs > 900) {
                UIComponents.showToast(managedState ? 'Child category filters saved' : 'Category filters saved', 'success');
                lastCategoryFiltersToastTs = Date.now();
            }
            return;
        }

        lastSavedCategoryFiltersSignatureMain = signature;
        if (managedState) {
            window.__filtertubeSaveManagedChildSurface?.('main', async (target, profile) => {
                const settings = profile.settings && typeof profile.settings === 'object' && !Array.isArray(profile.settings)
                    ? profile.settings
                    : {};
                profile.settings = {
                    ...settings,
                    categoryFilters: next
                };
                return true;
            });
        } else {
            StateManager.updateCategoryFilters(next);
        }

        if (showToast) {
            UIComponents.showToast(managedState ? 'Child category filters saved' : 'Category filters saved', 'success');
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
        const managedState = window.__filtertubeIsManagedChildEditFor?.('main') === true
            ? (window.__filtertubeBuildManagedChildState?.('main') || null)
            : null;
        const state = managedState || StateManager.getState();
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

        const mainChanged = !(mainNextSig === mainPriorSig || (!managedState && lastSavedVideoFiltersSignature && mainNextSig === lastSavedVideoFiltersSignature));
        if (!mainChanged) {
            return;
        }

        if (mainChanged) {
            lastSavedVideoFiltersSignature = mainNextSig;
        }

        const savePromise = managedState
            ? window.__filtertubeSaveManagedChildSurface?.('main', async (target, profile) => {
                const settings = profile.settings && typeof profile.settings === 'object' && !Array.isArray(profile.settings)
                    ? profile.settings
                    : {};
                profile.settings = {
                    ...settings,
                    contentFilters: next
                };
                return true;
            })
            : StateManager.updateContentFilters(next);

        Promise.resolve(savePromise)
            .then(() => {
                if (!showToast) return;
                const ts = Date.now();
                if (ts - lastVideoFiltersToastTs < 800) return;
                lastVideoFiltersToastTs = ts;
                UIComponents.showToast(managedState ? 'Child video filters saved' : 'Video filters saved', 'success');
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

        const managedState = window.__filtertubeIsManagedChildEditFor?.('main') === true
            ? (window.__filtertubeBuildManagedChildState?.('main') || null)
            : null;
        const state = managedState || StateManager.getState();
        applyContentFiltersToUI(state.contentFilters || {});
        applyCategoryFiltersToUI(state.categoryFilters || {});
    }, 100);

    StateManager.subscribe((eventType, data) => {
        if (eventType === 'contentFiltersUpdated') {
            if (window.__filtertubeIsManagedChildEditFor?.('main') === true) {
                const managedState = window.__filtertubeBuildManagedChildState?.('main');
                applyContentFiltersToUI(managedState?.contentFilters || {});
            } else {
                applyContentFiltersToUI(data?.contentFilters || {});
            }
            updateVideoFilterUI();
        }
        if (eventType === 'categoryFiltersUpdated') {
            if (window.__filtertubeIsManagedChildEditFor?.('main') === true) {
                const managedState = window.__filtertubeBuildManagedChildState?.('main');
                applyCategoryFiltersToUI(managedState?.categoryFilters || {});
            } else {
                applyCategoryFiltersToUI(data?.categoryFilters || {});
            }
        }
    });

    try {
        window.__filtertubeApplyMainContentControls = (contentFilters = {}, categoryFilters = {}) => {
            applyContentFiltersToUI(contentFilters || {});
            applyCategoryFiltersToUI(categoryFilters || {});
        };
    } catch (e) {
    }

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
        <div id="managedChildKidsBanner" class="ft-managed-child-editor" hidden></div>

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
        <div id="managedChildKidsChannelBanner" class="ft-managed-child-editor" hidden></div>

        <div class="filter-controls">
            <input type="text" id="kidsSearchChannels" class="search-input" placeholder="Search channels..." />
            <div class="sort-controls">
                <span class="label">Sort by:</span>
                <select id="kidsChannelSort" class="select-input">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="az">A-Z</option>
                </select>
                <select id="kidsChannelSourceFilter" class="select-input channel-source-filter" title="Show manual Kids channels, imported-list channels, or one saved list">
                    <option value="all">All sources</option>
                    <option value="manual">Manual</option>
                    <option value="lists">Imported lists</option>
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

    const managedChildKidsContentBanner = document.createElement('div');
    managedChildKidsContentBanner.id = 'managedChildKidsContentBanner';
    managedChildKidsContentBanner.className = 'ft-managed-child-editor';
    managedChildKidsContentBanner.hidden = true;
    kidsContentTab.appendChild(managedChildKidsContentBanner);

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

    const kidsMainSyncRow = document.createElement('div');
    kidsMainSyncRow.className = 'toggle-row';
    kidsMainSyncRow.setAttribute('data-ft-control-row', 'true');
    kidsMainSyncRow.setAttribute('data-ft-search', 'apply matching yt kids rules on youtube sync kids to main from kids badge');
    kidsMainSyncRow.title = 'When enabled, matching-mode YouTube Kids rules are also applied on main YouTube for this profile. Kids blocklist syncs only into Main blocklist; Kids whitelist syncs only into Main whitelist.';

    const kidsMainSyncInfo = document.createElement('div');
    kidsMainSyncInfo.className = 'toggle-info';

    const kidsMainSyncTitle = document.createElement('div');
    kidsMainSyncTitle.className = 'toggle-title';
    kidsMainSyncTitle.textContent = 'Apply matching YT Kids rules on YouTube';

    const kidsMainSyncHint = document.createElement('div');
    kidsMainSyncHint.className = 'import-export-hint';
    kidsMainSyncHint.textContent = 'Synced items show in your main list with a "From Kids" badge. Mismatched modes do not invert rules.';

    kidsMainSyncInfo.appendChild(kidsMainSyncTitle);
    kidsMainSyncInfo.appendChild(kidsMainSyncHint);

    const kidsMainSyncToggle = document.createElement('label');
    kidsMainSyncToggle.className = 'switch';

    const kidsMainSyncCheckbox = document.createElement('input');
    kidsMainSyncCheckbox.type = 'checkbox';
    kidsMainSyncCheckbox.id = 'setting_syncKidsToMain';
    kidsMainSyncCheckbox.setAttribute('data-ft-setting', 'syncKidsToMain');

    const kidsMainSyncSlider = document.createElement('span');
    kidsMainSyncSlider.className = 'slider round';

    kidsMainSyncToggle.appendChild(kidsMainSyncCheckbox);
    kidsMainSyncToggle.appendChild(kidsMainSyncSlider);

    kidsMainSyncRow.appendChild(kidsMainSyncInfo);
    kidsMainSyncRow.appendChild(kidsMainSyncToggle);
    kidsVideoFiltersRows.appendChild(kidsMainSyncRow);

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
        const managedState = window.__filtertubeIsManagedChildEditFor?.('kids') === true
            ? (window.__filtertubeBuildManagedChildState?.('kids') || null)
            : null;
        const next = {
            enabled: !!kidsCategoryEnabled?.checked,
            mode: kidsCategoryMode?.value === 'allow' ? 'allow' : 'block',
            selected: normalizeSelectedArray(kidsCategorySelected)
        };

        const savePromise = managedState
            ? window.__filtertubeSaveManagedChildSurface?.('kids', async (target) => {
                target.categoryFilters = next;
                return true;
            })
            : StateManager.updateKidsCategoryFilters(next);

        Promise.resolve(savePromise)
            .then(() => {
                if (showToast) UIComponents.showToast(managedState ? 'Child Kids category filters saved' : 'Kids category filters saved', 'success');
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
        const managedState = window.__filtertubeIsManagedChildEditFor?.('kids') === true
            ? (window.__filtertubeBuildManagedChildState?.('kids') || null)
            : null;
        const state = managedState || StateManager.getState();
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
        if (nextSig === priorSig || (!managedState && lastSavedKidsVideoFiltersSignature && nextSig === lastSavedKidsVideoFiltersSignature)) {
            return;
        }
        lastSavedKidsVideoFiltersSignature = nextSig;

        const savePromise = managedState
            ? window.__filtertubeSaveManagedChildSurface?.('kids', async (target) => {
                target.contentFilters = next;
                return true;
            })
            : StateManager.updateKidsContentFilters(next);

        Promise.resolve(savePromise)
            .then(() => {
                if (!showToast) return;
                const ts = Date.now();
                if (ts - lastKidsVideoFiltersToastTs < 800) return;
                lastKidsVideoFiltersToastTs = ts;
                UIComponents.showToast(managedState ? 'Child Kids video filters saved' : 'Kids video filters saved', 'success');
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
        const managedState = window.__filtertubeIsManagedChildEditFor?.('kids') === true
            ? (window.__filtertubeBuildManagedChildState?.('kids') || null)
            : null;
        const state = managedState || StateManager.getState();
        applyKidsVideoFiltersToUI(state?.kids?.contentFilters || {});
        applyKidsCategoryFiltersToUI(state?.kids?.categoryFilters || {});
    } catch (e) {
    }

    StateManager.subscribe((eventType, data) => {
        if (eventType === 'kidsContentFiltersUpdated') {
            if (window.__filtertubeIsManagedChildEditFor?.('kids') === true) {
                const managedState = window.__filtertubeBuildManagedChildState?.('kids');
                applyKidsVideoFiltersToUI(managedState?.kids?.contentFilters || {});
            } else {
                applyKidsVideoFiltersToUI(data?.contentFilters || {});
            }
        }
        if (eventType === 'kidsCategoryFiltersUpdated') {
            if (window.__filtertubeIsManagedChildEditFor?.('kids') === true) {
                const managedState = window.__filtertubeBuildManagedChildState?.('kids');
                applyKidsCategoryFiltersToUI(managedState?.kids?.categoryFilters || {});
            } else {
                applyKidsCategoryFiltersToUI(data?.categoryFilters || {});
            }
        }
    });

    try {
        window.__filtertubeApplyKidsContentControls = (contentFilters = {}, categoryFilters = {}) => {
            applyKidsVideoFiltersToUI(contentFilters || {});
            applyKidsCategoryFiltersToUI(categoryFilters || {});
        };
    } catch (e) {
    }
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
    const channelSourceFilter = document.getElementById('channelSourceFilter');

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
    const ftImportRuleListBtn = document.getElementById('ftImportRuleListBtn');
    const ftDownloadRuleListTemplateBtn = document.getElementById('ftDownloadRuleListTemplateBtn');
    const ftDownloadRuleListJsonTemplateBtn = document.getElementById('ftDownloadRuleListJsonTemplateBtn');
    const ftRuleListFormatsBtn = document.getElementById('ftRuleListFormatsBtn');

    const ftProfilesManager = document.getElementById('ftProfilesManager');
    const managedChildSyncBoundary = document.getElementById('managedChildSyncBoundary');
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
    const ftNanahGranularSurfaceField = document.getElementById('ftNanahGranularSurfaceField');
    const ftNanahGranularSurface = document.getElementById('ftNanahGranularSurface');
    const ftNanahManagedTargetsField = document.getElementById('ftNanahManagedTargetsField');
    const ftNanahManagedTargets = document.getElementById('ftNanahManagedTargets');
    const ftNanahManagedTargetsHint = document.getElementById('ftNanahManagedTargetsHint');
    const ftNanahStrategy = document.getElementById('ftNanahStrategy');
    const ftNanahRemoteTarget = document.getElementById('ftNanahRemoteTarget');
    const ftNanahStrategyLabel = document.getElementById('ftNanahStrategyLabel');
    const ftNanahStrategyHint = document.getElementById('ftNanahStrategyHint');
    const ftNanahGranularSurfaceHint = document.getElementById('ftNanahGranularSurfaceHint');
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
    let channelSourceFilterValue = 'all';

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
    let managedChildEdit = null;
    let nanahManagedPolicySourceOverride = null;
    let sessionMasterPin = '';
    const unlockedProfiles = new Set();
    const NANAH_TRUSTED_LINKS_KEY = 'ftNanahTrustedLinks';
    const NANAH_DEVICE_ID_KEY = 'ftNanahDeviceId';
    const NANAH_DEVICE_LABEL_KEY = 'ftNanahDeviceLabel';
    const NANAH_UI_MODE_KEY = 'ftNanahUiMode';
    const NANAH_MANAGED_SIGNING_KEYPAIR_KEY = 'ftNanahManagedSigningKeyPair';
    const NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY = 'ftNanahManagedSigningPublicKey';
    const NANAH_MANAGED_OPEN_SYNC_STATE_KEY = 'ftNanahManagedOpenSyncState';
    const NANAH_MANAGED_LOCAL_NETWORK_SYNC_STATE_KEY = 'ftNanahManagedLocalNetworkSyncState';
    const NANAH_MANAGED_SOURCE_ACK_SYNC_STATE_KEY = 'ftNanahManagedSourceAckSyncState';
    let nanahClient = null;
    let nanahTrustedLinks = [];
    let nanahStableDeviceId = '';
    let nanahManagedSigningKeyDescriptor = null;
    let nanahManagedOpenSyncState = null;
    let nanahManagedLocalNetworkSyncState = null;
    let nanahManagedSourceAckSyncState = null;
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
    const CHILD_ALLOWED_VIEWS = new Set([...LOCK_ALLOWED_VIEWS, 'sync']);
    const MANAGED_TIME_LIMIT_SCHEMA = 'filtertube_managed_time_limit';
    const MANAGED_LOCAL_EDIT_POLICY_SCHEMA = 'filtertube_managed_local_edit_policy';
    const MANAGED_ACTION_HISTORY_SCHEMA = 'filtertube_managed_action_history';
    const MANAGED_ACTION_HISTORY_LIMIT = 500;
    const MANAGED_ACTION_HISTORY_DAY_MS = 24 * 60 * 60 * 1000;
    const MANAGED_ACTION_HISTORY_ACCEPTED_RETENTION_MS = 30 * MANAGED_ACTION_HISTORY_DAY_MS;
    const MANAGED_ACTION_HISTORY_PROTECTED_RETENTION_MS = 90 * MANAGED_ACTION_HISTORY_DAY_MS;
    const MANAGED_ACTION_HISTORY_PROTECTED_RESULTS = new Set(['rejected', 'conflict', 'failed_auth', 'expired_session', 'cleared_by_admin']);
    const MANAGED_ACTION_HISTORY_PROTECTED_ACTIONS = new Set(['trust_link.revoke', 'trust_link.key_revoke', 'managed_signing_key.rotate', 'policy.time_limit.update', 'policy.time_limit.request_extra', 'policy.viewing_space.update', 'policy.channel_list.import', 'policy.channel_list.remove', 'policy.channel_list.check', 'policy.channel_list.refresh', 'policy.channel_list.pause', 'policy.channel_list.resume', 'remote_policy.source_push']);
    const MANAGED_ACTION_HISTORY_SUMMARY_PRIVACY_SCHEMA = 'filtertube_managed_action_history_summary_privacy';
    const MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_SCHEMA = 'filtertube_managed_action_history_encrypted_summary';
    const MANAGED_ACTION_HISTORY_SAFE_LABELS = Object.freeze({
        'rule.video.block': 'Video rule changed',
        'rule.keyword.add': 'Keyword rule changed',
        'rule.keyword.remove': 'Keyword rule changed',
        'rule.channel.block': 'Channel rule changed',
        'rule.channel.unblock': 'Channel rule changed',
        'policy.viewing_space.update': 'Viewing space policy changed',
        'policy.time_limit.update': 'Time limit policy changed',
        'policy.time_limit.request_extra': 'Extra time requested',
        'policy.channel_list.import': 'Rule list imported',
        'policy.channel_list.remove': 'Rule list removed',
        'policy.channel_list.check': 'Rule list checked',
        'policy.channel_list.refresh': 'Rule list refreshed',
        'policy.channel_list.pause': 'Rule list paused',
        'policy.channel_list.resume': 'Rule list resumed',
        'policy.sync_policy.update': 'Sync policy changed',
        'trust_link.create': 'Trusted link created',
        'trust_link.revoke': 'Trusted link removed',
        'trust_link.key_revoke': 'Trusted link key revoked',
        'managed_signing_key.rotate': 'Managed signing key rotated',
        'admin_session.unlock': 'Admin session unlocked',
        'admin_session.failed_unlock': 'Admin unlock failed',
        'local_policy.update': 'Local policy changed',
        'remote_policy.accept': 'Remote policy accepted',
        'remote_policy.reject': 'Remote policy rejected',
        'remote_policy.conflict': 'Remote policy conflict',
        'remote_policy.mailbox.accept': 'Mailbox policy accepted',
        'remote_policy.mailbox.reject': 'Mailbox policy rejected',
        'remote_policy.mailbox.conflict': 'Mailbox policy conflict',
        'remote_policy.mailbox.expire': 'Mailbox policy expired',
        'remote_policy.mailbox.revoke': 'Mailbox policy revoked',
        'remote_policy.mailbox.ack': 'Mailbox ack recorded',
        'remote_policy.local_network.ack': 'Local-network ack recorded',
        'delivery.mailbox.configure': 'Mailbox provider changed',
        'delivery.local_network.configure': 'Local-network provider changed',
        'remote_policy.source_push': 'Parent policy push',
        'history.clear': 'History cleared'
    });
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_NUMBER_KEYS = new Set([
        'clearedAcceptedRows',
        'consumedSeconds',
        'dailyBudgetSeconds',
        'deliveredCount',
        'failedCount',
        'changedCount',
        'addedCount',
        'duplicateCount',
        'kidsRuleCount',
        'listEntryCount',
        'linkCount',
        'liveSentCount',
        'localNetworkDeliveredCount',
        'mainRuleCount',
        'mailboxUploadedCount',
        'mailboxPurgedCount',
        'noLinkCount',
        'nextKeyVersion',
        'parentGrantSeconds',
        'providerMissingCount',
        'previousKeyVersion',
        'protectedRows',
        'removedCount',
        'remoteFailedAttemptLimit',
        'remoteFailedAttempts',
        'removedScopeCount',
        'revokedLinkCount',
        'retainedProtectedRows',
        'retryAt',
        'remainingSeconds',
        'ruleCount',
        'selectedProfileCount',
        'sentCount',
        'skippedCount',
        'targetCount',
        'totalCount'
    ]);
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_BOOLEAN_KEYS = new Set([
        'hasPolicy',
        'hasTimeLimit',
        'kidsEnabled',
        'localNetworkConfigured',
        'mainEnabled',
        'mailboxConfigured',
        'rateLimited',
        'redacted'
    ]);
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_KEYS = new Set([
        'endpointHost',
        'label',
        'scope',
        'deliveryStatus',
        'dateKey',
        'profileName',
        'surface',
        'timezone',
        'transport'
    ]);
    const MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_ARRAY_KEYS = new Set([
        'removedScopes',
        'transports'
    ]);
    const MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_FORBIDDEN_KEYS = new Set([
        'channels',
        'keywords',
        'label',
        'operations',
        'payload',
        'plaintext',
        'plaintextValue',
        'ruleValue',
        'summary',
        'videoIds'
    ]);
    const MANAGED_ADMIN_SESSION_TTL_MS = 15 * 60 * 1000;
    const MANAGED_ADMIN_REAUTH_TTL_MS = 5 * 60 * 1000;
    const MANAGED_ADMIN_FAILED_UNLOCK_LIMIT = 5;
    const MANAGED_ADMIN_FAILED_UNLOCK_WINDOW_MS = 10 * 60 * 1000;
    const MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA = 'filtertube_managed_admin_failed_unlock_rate_limit';
    const MANAGED_REMOTE_FAILED_ATTEMPT_SCHEMA = 'filtertube_managed_remote_failed_attempt_rate_limit';
    const MANAGED_REMOTE_FAILED_ATTEMPT_LIMIT = 20;
    const MANAGED_REMOTE_FAILED_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
    const MANAGED_REMOTE_POLICY_CONFLICT_SCHEMA = 'filtertube_managed_remote_policy_conflict';
    const MANAGED_REMOTE_POLICY_CONFLICT_LIMIT = 100;
    const MANAGED_REMOTE_POLICY_CONFLICT_REASONS = new Set([
        'equal_revision_hash_conflict',
        'stale_revision',
        'link_revoked',
        'key_revoked',
        'stale_pairing',
        'duplicate_source_device_id'
    ]);
    const ManagedAdminAuthority = window.FilterTubeManagedAdminAuthority || null;
    const profileUnlockSessions = new Map();
    const managedAdminFailedUnlocks = new Map();

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

    const clearProfileUnlockSession = {
        run: (profileId) => {
            const id = normalizeString(profileId); if (!id) return;
            unlockedProfiles.delete(id);
            profileUnlockSessions.delete(id);
            id === 'default' && (sessionMasterPin = '');
        }
    };

    function normalizeManagedAdminFailedUnlockState(value, now = Date.now()) {
        if (ManagedAdminAuthority && typeof ManagedAdminAuthority.normalizeFailedUnlockState === 'function') {
            return ManagedAdminAuthority.normalizeFailedUnlockState(value, now);
        }
        const raw = safeObject(value);
        const resetAt = Number(raw.resetAt);
        const failedAttempts = Number(raw.failedAttempts);
        if (
            raw.schema !== MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA
            || !Number.isFinite(resetAt)
            || now >= resetAt
        ) {
            return {
                schema: MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA,
                version: 1,
                failedAttempts: 0,
                resetAt: now + MANAGED_ADMIN_FAILED_UNLOCK_WINDOW_MS,
                updatedAt: now
            };
        }
        return {
            schema: MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA,
            version: 1,
            failedAttempts: Number.isFinite(failedAttempts) && failedAttempts > 0 ? Math.floor(failedAttempts) : 0,
            resetAt,
            updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : now
        };
    }

    function getPersistedManagedAdminFailedUnlockState(profilesV4, profileId, now = Date.now()) {
        const id = normalizeString(profileId);
        if (!id) return normalizeManagedAdminFailedUnlockState(null, now);
        const root = safeObject(profilesV4);
        const profile = safeObject(safeObject(root.profiles)[id]);
        return normalizeManagedAdminFailedUnlockState(
            safeObject(safeObject(profile.managedPolicyState).adminFailedUnlockRateLimit),
            now
        );
    }

    function getManagedAdminFailedUnlockState(profileId, now = Date.now(), profilesV4 = profilesV4Cache) {
        const id = normalizeString(profileId);
        if (!id) return { failedAttempts: 0, resetAt: now + MANAGED_ADMIN_FAILED_UNLOCK_WINDOW_MS };
        const existing = safeObject(managedAdminFailedUnlocks.get(id));
        const resetAt = Number(existing.resetAt);
        const persisted = getPersistedManagedAdminFailedUnlockState(profilesV4, id, now);
        const hasMemory = Number.isFinite(resetAt) && now < resetAt;
        if (!hasMemory && persisted.failedAttempts <= 0) {
            managedAdminFailedUnlocks.delete(id);
            return { failedAttempts: 0, resetAt: now + MANAGED_ADMIN_FAILED_UNLOCK_WINDOW_MS };
        }
        const next = {
            failedAttempts: Math.max(
                hasMemory && Number.isFinite(Number(existing.failedAttempts)) ? Number(existing.failedAttempts) : 0,
                persisted.failedAttempts
            ),
            resetAt: Math.max(
                hasMemory ? resetAt : 0,
                persisted.failedAttempts > 0 ? persisted.resetAt : 0
            ) || (now + MANAGED_ADMIN_FAILED_UNLOCK_WINDOW_MS)
        };
        if (next.failedAttempts > 0) managedAdminFailedUnlocks.set(id, next);
        return next;
    }

    function isManagedAdminUnlockRateLimited(profileId, profilesV4 = profilesV4Cache) {
        return getManagedAdminFailedUnlockState(profileId, Date.now(), profilesV4).failedAttempts >= MANAGED_ADMIN_FAILED_UNLOCK_LIMIT;
    }

    async function persistManagedAdminFailedUnlockState(profileId, state) {
        try {
            const id = normalizeString(profileId);
            const io = window.FilterTubeIO || {};
            if (!id || typeof io.saveProfilesV4 !== 'function') return false;
            const root = safeObject(
                typeof io.loadProfilesV4 === 'function'
                    ? await io.loadProfilesV4()
                    : profilesV4Cache
            );
            const profiles = { ...safeObject(root.profiles) };
            const profile = safeObject(profiles[id]);
            if (!profile || Object.keys(profile).length === 0) return false;

            const managedPolicyState = { ...safeObject(profile.managedPolicyState) };
            const nextState = normalizeManagedAdminFailedUnlockState(state);
            if (nextState.failedAttempts > 0) {
                managedPolicyState.adminFailedUnlockRateLimit = nextState;
            } else {
                delete managedPolicyState.adminFailedUnlockRateLimit;
            }
            profiles[id] = { ...profile, managedPolicyState };
            const nextRoot = {
                ...root,
                schemaVersion: 4,
                profiles
            };
            await io.saveProfilesV4(nextRoot);
            profilesV4Cache = nextRoot;
            return true;
        } catch (e) {
            return false;
        }
    }

    async function recordManagedAdminUnlockFailure(profileId, profilesV4 = profilesV4Cache) {
        const id = normalizeString(profileId);
        const now = Date.now();
        const state = getManagedAdminFailedUnlockState(id, now, profilesV4);
        const next = {
            schema: MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA,
            version: 1,
            failedAttempts: state.failedAttempts + 1,
            resetAt: state.resetAt || (now + MANAGED_ADMIN_FAILED_UNLOCK_WINDOW_MS),
            updatedAt: now
        };
        if (id) {
            managedAdminFailedUnlocks.set(id, next);
            await persistManagedAdminFailedUnlockState(id, next);
        }
        return {
            ...next,
            rateLimited: next.failedAttempts >= MANAGED_ADMIN_FAILED_UNLOCK_LIMIT
        };
    }

    async function clearManagedAdminUnlockFailures(profileId) {
        const id = normalizeString(profileId);
        if (!id) return;
        managedAdminFailedUnlocks.delete(id);
        await persistManagedAdminFailedUnlockState(id, {
            schema: MANAGED_ADMIN_FAILED_UNLOCK_SCHEMA,
            version: 1,
            failedAttempts: 0,
            resetAt: Date.now(),
            updatedAt: Date.now()
        });
    }

    const markProfileUnlockSession = {
        run: (profileId) => {
            const id = normalizeString(profileId); if (!id) return;
            const now = Date.now();
            unlockedProfiles.add(id);
            const session = ManagedAdminAuthority && typeof ManagedAdminAuthority.createAdminUnlockSession === 'function'
                ? ManagedAdminAuthority.createAdminUnlockSession(now)
                : {
                    unlockedAt: now,
                    expiresAt: now + MANAGED_ADMIN_SESSION_TTL_MS,
                    reauthAt: now + MANAGED_ADMIN_REAUTH_TTL_MS
                };
            profileUnlockSessions.set(id, session);
        }
    };

    const isProfileUnlockSessionValid = {
        check: (profileId, { sensitiveAction = false } = {}) => {
            const id = normalizeString(profileId);
            const session = safeObject(profileUnlockSessions.get(id));
            const now = Date.now();
            if (ManagedAdminAuthority && typeof ManagedAdminAuthority.checkAdminUnlockSession === 'function') {
                const decision = ManagedAdminAuthority.checkAdminUnlockSession(session, {
                    profileId: id,
                    hasUnlockedProfile: unlockedProfiles.has(id),
                    now,
                    sensitiveAction
                });
                if (!decision.valid) {
                    clearProfileUnlockSession.run(id);
                    return false;
                }
                return true;
            }
            const expired = !Number.isFinite(session.expiresAt) || now >= session.expiresAt;
            const requiresReauth = sensitiveAction && (!Number.isFinite(session.reauthAt) || now >= session.reauthAt);
            if (!id || !unlockedProfiles.has(id) || expired || requiresReauth) {
                clearProfileUnlockSession.run(id);
                return false;
            }
            return true;
        }
    };

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

    function getProfileAccessCopy(profilesV4, profileId) {
        const name = getProfileName(profilesV4, profileId);
        if (profileId === 'default') {
            return {
                eyebrow: 'Master access',
                title: 'Enter Master PIN',
                message: 'Default is protected. Enter the Master PIN to continue.',
                placeholder: 'Master PIN',
                gateTitle: 'Master Profile Locked',
                gateMessage: `Unlock ${name} with the Master PIN to view management controls.`
            };
        }
        const type = getProfileType(profilesV4, profileId);
        if (type === 'account') {
            return {
                eyebrow: 'Protected account',
                title: `Unlock ${name}`,
                message: `${name} is a locked independent account. Enter its profile PIN to continue.`,
                placeholder: 'Profile PIN',
                gateTitle: 'Protected Account',
                gateMessage: `Unlock ${name} to view management controls.`
            };
        }
        return {
            eyebrow: 'Protected child profile',
            title: `Unlock ${name}`,
            message: `${name} is a locked child profile. Enter its profile PIN to continue.`,
            placeholder: 'Profile PIN',
            gateTitle: 'Protected Child Profile',
            gateMessage: `Unlock ${name} to view management controls.`
        };
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

    function getProfileViewingAccess(profile) {
        const settings = safeObject(profile?.settings);
        return {
            main: settings.allowMainViewing !== false,
            kids: settings.allowKidsViewing !== false
        };
    }

    function viewingAccessLabel(profile) {
        const access = getProfileViewingAccess(profile);
        if (access.main && access.kids) return 'Main + Kids';
        if (access.main) return 'Main only';
        if (access.kids) return 'Kids only';
        return 'No viewing spaces';
    }

    function normalizeNonNegativeInteger(value) {
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isInteger(num)) return null;
        return num >= 0 ? num : null;
    }

    function getManagedTimeLimitTimezone() {
        try {
            const tz = normalizeString(Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone);
            return tz || 'Etc/UTC';
        } catch (e) {
            return 'Etc/UTC';
        }
    }

    function isValidManagedTimeLimitTimezone(timezone) {
        const value = normalizeString(timezone);
        if (!value) return false;
        try {
            if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
                return value === 'UTC' || value === 'Etc/UTC';
            }
            new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
            return true;
        } catch (e) {
            return false;
        }
    }

    function getManagedTimeLimitPolicy(profile) {
        const raw = safeObject(safeObject(profile?.settings).timeLimitPolicy);
        if (normalizeString(raw.schema) !== MANAGED_TIME_LIMIT_SCHEMA || raw.version !== 1) return null;
        const dailyBudgetSeconds = normalizeNonNegativeInteger(raw.dailyBudgetSeconds);
        const policyRevision = normalizeNonNegativeInteger(raw.policyRevision);
        const issuedAt = normalizeNonNegativeInteger(raw.issuedAt);
        const policyHash = normalizeString(raw.policyHash);
        const timezone = normalizeString(raw.timezone);
        if (dailyBudgetSeconds == null || !policyRevision || issuedAt == null || !policyHash || !isValidManagedTimeLimitTimezone(timezone)) return null;
        return {
            schema: MANAGED_TIME_LIMIT_SCHEMA,
            version: 1,
            enabled: raw.enabled === true,
            timezone,
            dailyBudgetSeconds,
            surfaceBudgets: safeObject(raw.surfaceBudgets),
            countingMode: normalizeString(raw.countingMode) || 'active_youtube_tab',
            activeDeviceBudgetPolicy: normalizeString(raw.activeDeviceBudgetPolicy) || 'single_active_tab_no_double_count',
            resetPolicy: normalizeString(raw.resetPolicy) || 'policy_timezone_midnight',
            graceSeconds: normalizeNonNegativeInteger(raw.graceSeconds) || 0,
            parentGrant: safeObject(raw.parentGrant),
            policyRevision,
            policyHash,
            issuedAt,
            validFrom: raw.validFrom == null ? issuedAt : normalizeNonNegativeInteger(raw.validFrom),
            validUntil: raw.validUntil == null ? null : normalizeNonNegativeInteger(raw.validUntil)
        };
    }

    function buildLocalPolicyHash(prefix, seed) {
        const source = JSON.stringify(seed);
        let hash = 0;
        for (let i = 0; i < source.length; i += 1) {
            hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
        }
        return `${prefix}-${Math.abs(hash).toString(16)}`;
    }

    function buildManagedTimeLimitPolicyHash(seed) {
        return buildLocalPolicyHash('local-time-limit', seed);
    }

    function buildManagedLocalEditPolicyHash(seed) {
        return buildLocalPolicyHash('local-managed-edit', seed);
    }

    function buildManagedTimeLimitPolicy(existingPolicy, { enabled, dailyBudgetSeconds, parentGrant = null }) {
        const now = Date.now();
        const budget = normalizeNonNegativeInteger(dailyBudgetSeconds);
        if (budget == null) return null;
        const prior = existingPolicy || null;
        const revision = Math.max(0, normalizeNonNegativeInteger(prior?.policyRevision) || 0) + 1;
        const timezone = normalizeString(prior?.timezone) || getManagedTimeLimitTimezone();
        const surfaceBudgets = {
            main: budget,
            kids: budget
        };
        const grantRoot = safeObject(parentGrant);
        const grantExpiresAt = grantRoot.expiresAt == null ? null : normalizeNonNegativeInteger(grantRoot.expiresAt);
        const nextParentGrant = grantRoot.enabled === true
            ? {
                enabled: true,
                extraSeconds: normalizeNonNegativeInteger(grantRoot.extraSeconds) || 0,
                expiresAt: grantExpiresAt,
                reason: normalizeString(grantRoot.reason) || 'parent_grant'
            }
            : {
                enabled: false,
                extraSeconds: 0,
                expiresAt: null,
                reason: ''
            };
        const seed = {
            enabled: enabled === true,
            timezone,
            dailyBudgetSeconds: budget,
            surfaceBudgets,
            parentGrant: nextParentGrant,
            policyRevision: revision
        };
        return {
            schema: MANAGED_TIME_LIMIT_SCHEMA,
            version: 1,
            enabled: enabled === true,
            timezone,
            dailyBudgetSeconds: budget,
            surfaceBudgets,
            countingMode: 'active_youtube_tab',
            activeDeviceBudgetPolicy: 'single_active_tab_no_double_count',
            resetPolicy: 'policy_timezone_midnight',
            graceSeconds: normalizeNonNegativeInteger(prior?.graceSeconds) || 0,
            parentGrant: nextParentGrant,
            policyRevision: revision,
            policyHash: buildManagedTimeLimitPolicyHash(seed),
            issuedAt: now,
            validFrom: now,
            validUntil: null
        };
    }

    function managedTimeLimitLabel(profile) {
        const policy = getManagedTimeLimitPolicy(profile);
        if (!policy || policy.enabled !== true) return 'Off';
        const totalMinutes = Math.floor(policy.dailyBudgetSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours && minutes) return `${hours}h ${minutes}m/day`;
        if (hours) return `${hours}h/day`;
        return `${minutes}m/day`;
    }

    function canActiveProfileManageProfile(profilesV4, targetProfileId) {
        const targetId = normalizeString(targetProfileId);
        const currentActive = normalizeString(profilesV4?.activeProfileId) || activeProfileId || 'default';
        if (ManagedAdminAuthority && typeof ManagedAdminAuthority.canActorManageProfile === 'function') {
            return ManagedAdminAuthority.canActorManageProfile(profilesV4, {
                actorProfileId: currentActive,
                targetProfileId: targetId
            }).allowed === true;
        }
        if (!targetId || getProfileType(profilesV4, currentActive) === 'child') return false;
        return currentActive === 'default' ||
            currentActive === targetId ||
            getParentAccountId(profilesV4, targetId) === currentActive;
    }

    function clonePlain(value, fallback) {
        if (Array.isArray(value)) return value.map(item => safeObject(item) === item ? { ...item } : item);
        if (value && typeof value === 'object') return { ...value };
        return fallback;
    }

    function normalizeProfileKeyword(word, options = {}) {
        const trimmed = normalizeString(word);
        if (!trimmed) return null;
        return {
            word: trimmed,
            exact: options.exact === true,
            semantic: options.semantic === true,
            source: options.source || 'user',
            channelRef: options.channelRef || null,
            comments: Object.prototype.hasOwnProperty.call(options, 'comments') ? options.comments === true : false,
            addedAt: Date.now()
        };
    }

    function normalizeProfileChannel(input) {
        const raw = normalizeString(input);
        if (!raw) return null;
        const lower = raw.toLowerCase();
        const isUrl = lower.includes('youtube.com') || lower.includes('youtu.be');
        const isHandle = raw.startsWith('@');
        const isUc = lower.startsWith('uc') || lower.startsWith('channel/uc');
        const customUrl = lower.startsWith('c/') || lower.startsWith('/c/')
            ? raw.replace(/^\/?c\//i, 'c/')
            : (lower.startsWith('user/') || lower.startsWith('/user/')
                ? raw.replace(/^\/?user\//i, 'user/')
                : null);
        if (!isHandle && !isUc && !isUrl && !customUrl) return null;

        return {
            name: raw,
            id: isUc ? raw.replace(/^channel\//i, '') : (customUrl || raw),
            handle: isHandle ? raw : null,
            customUrl,
            originalInput: raw,
            source: 'user',
            filterAll: false,
            addedAt: Date.now()
        };
    }

    function getProfileSurface(profile, surface) {
        const key = surface === 'kids' ? 'kids' : 'main';
        const source = safeObject(profile?.[key]);
        if (key === 'kids') {
            return {
                mode: source.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                blockedKeywords: Array.isArray(source.blockedKeywords) ? clonePlain(source.blockedKeywords, []) : [],
                blockedChannels: Array.isArray(source.blockedChannels) ? clonePlain(source.blockedChannels, []) : [],
                whitelistKeywords: Array.isArray(source.whitelistKeywords) ? clonePlain(source.whitelistKeywords, []) : [],
                whitelistChannels: Array.isArray(source.whitelistChannels) ? clonePlain(source.whitelistChannels, []) : [],
                strictMode: source.strictMode !== false,
                videoIds: Array.isArray(source.videoIds) ? clonePlain(source.videoIds, []) : [],
                subscriptions: Array.isArray(source.subscriptions) ? clonePlain(source.subscriptions, []) : [],
                contentFilters: clonePlain(source.contentFilters, {}),
                categoryFilters: clonePlain(source.categoryFilters, {})
            };
        }
        return {
            mode: source.mode === 'whitelist' ? 'whitelist' : 'blocklist',
            keywords: Array.isArray(source.keywords) ? clonePlain(source.keywords, []) : (Array.isArray(source.blockedKeywords) ? clonePlain(source.blockedKeywords, []) : []),
            channels: Array.isArray(source.channels) ? clonePlain(source.channels, []) : (Array.isArray(source.blockedChannels) ? clonePlain(source.blockedChannels, []) : []),
            whitelistKeywords: Array.isArray(source.whitelistKeywords) ? clonePlain(source.whitelistKeywords, []) : [],
            whitelistChannels: Array.isArray(source.whitelistChannels) ? clonePlain(source.whitelistChannels, []) : [],
            videoIds: Array.isArray(source.videoIds) ? clonePlain(source.videoIds, []) : []
        };
    }

    function setProfileSurface(profile, surface, nextSurface) {
        const key = surface === 'kids' ? 'kids' : 'main';
        const existing = safeObject(profile?.[key]);
        if (key === 'kids') {
            return {
                ...profile,
                kids: {
                    ...existing,
                    ...nextSurface,
                    mode: nextSurface.mode === 'whitelist' ? 'whitelist' : 'blocklist'
                }
            };
        }
        return {
            ...profile,
            main: {
                ...existing,
                ...nextSurface,
                blockedKeywords: Array.isArray(nextSurface.keywords) ? nextSurface.keywords : (Array.isArray(nextSurface.blockedKeywords) ? nextSurface.blockedKeywords : []),
                blockedChannels: Array.isArray(nextSurface.channels) ? nextSurface.channels : (Array.isArray(nextSurface.blockedChannels) ? nextSurface.blockedChannels : []),
                mode: nextSurface.mode === 'whitelist' ? 'whitelist' : 'blocklist'
            }
        };
    }

    function localManagedPolicyRevisionStore(profile, scope) {
        const policyState = safeObject(profile?.managedPolicyState);
        const localEdits = safeObject(policyState.localManagedEdits);
        return safeObject(localEdits[scope]);
    }

    function localManagedEditPolicyRevisionStore(profile, scope) {
        return localManagedPolicyRevisionStore(profile, scope === 'kids' ? 'kids' : 'main');
    }

    function countEnabledFlags(value) {
        return Object.values(safeObject(value)).filter(Boolean).length;
    }

    function summarizeManagedChildSurface(scope, surfaceState) {
        const surface = safeObject(surfaceState);
        if (scope === 'kids') {
            return {
                redacted: true,
                label: 'Updated Kids rules',
                mode: surface.mode === 'whitelist' ? 'whitelist' : 'blocklist',
                blockedKeywordCount: Array.isArray(surface.blockedKeywords) ? surface.blockedKeywords.length : 0,
                blockedChannelCount: Array.isArray(surface.blockedChannels) ? surface.blockedChannels.length : 0,
                whitelistKeywordCount: Array.isArray(surface.whitelistKeywords) ? surface.whitelistKeywords.length : 0,
                whitelistChannelCount: Array.isArray(surface.whitelistChannels) ? surface.whitelistChannels.length : 0,
                videoIdCount: Array.isArray(surface.videoIds) ? surface.videoIds.length : 0,
                subscriptionCount: Array.isArray(surface.subscriptions) ? surface.subscriptions.length : 0,
                contentFilterCount: countEnabledFlags(surface.contentFilters),
                categoryFilterCount: countEnabledFlags(surface.categoryFilters)
            };
        }
        return {
            redacted: true,
            label: 'Updated Main rules',
            mode: surface.mode === 'whitelist' ? 'whitelist' : 'blocklist',
            keywordCount: Array.isArray(surface.keywords) ? surface.keywords.length : 0,
            channelCount: Array.isArray(surface.channels) ? surface.channels.length : 0,
            whitelistKeywordCount: Array.isArray(surface.whitelistKeywords) ? surface.whitelistKeywords.length : 0,
            whitelistChannelCount: Array.isArray(surface.whitelistChannels) ? surface.whitelistChannels.length : 0
        };
    }

    function summarizeManagedTimeLimitPolicy(policy) {
        const item = safeObject(policy);
        const dailyBudgetSeconds = normalizeNonNegativeInteger(item.dailyBudgetSeconds) || 0;
        const surfaceBudgets = safeObject(item.surfaceBudgets);
        const parentGrant = safeObject(item.parentGrant);
        const parentGrantSeconds = parentGrant.enabled === true
            ? (normalizeNonNegativeInteger(parentGrant.extraSeconds) || 0)
            : 0;
        const surfaceBudgetCount = ['main', 'kids'].filter(surface => normalizeNonNegativeInteger(surfaceBudgets[surface]) != null).length;
        return {
            redacted: true,
            label: parentGrantSeconds > 0 ? 'Granted extra time' : (item.enabled === true ? 'Updated time limit' : 'Disabled time limit'),
            enabled: item.enabled === true,
            dailyBudgetSeconds,
            dailyBudgetMinutes: Math.floor(dailyBudgetSeconds / 60),
            timezone: normalizeString(item.timezone) || 'Etc/UTC',
            parentGrantSeconds,
            surfaceBudgetCount
        };
    }

    function summarizeManagedViewingSpacePolicy(policy) {
        const item = safeObject(policy);
        const allowMainViewing = item.allowMainViewing === true;
        const allowKidsViewing = item.allowKidsViewing === true;
        const defaultLaunchTarget = normalizeString(item.defaultLaunchTarget);
        return {
            redacted: true,
            label: 'Updated viewing access',
            allowMainViewing,
            allowKidsViewing,
            accessLabel: allowMainViewing && allowKidsViewing
                ? 'Main + Kids'
                : (allowMainViewing ? 'Main only' : 'Kids only'),
            ...(defaultLaunchTarget ? { defaultLaunchTarget } : {})
        };
    }

    function buildManagedChildLocalEditReport({ actorProfileId, targetProfileId, surface, priorProfile, nextSurface }) {
        const scope = surface === 'kids' ? 'kids' : 'main';
        const priorState = localManagedEditPolicyRevisionStore(priorProfile, scope);
        const revision = Math.max(0, normalizeNonNegativeInteger(priorState.policyRevision) || 0) + 1;
        const now = Date.now();
        const actorId = normalizeString(actorProfileId) || 'default';
        const targetId = normalizeString(targetProfileId);
        const actorDeviceId = normalizeString(nanahStableDeviceId) || 'local-extension-device';
        const summary = summarizeManagedChildSurface(scope, nextSurface);
        const policyHash = buildManagedLocalEditPolicyHash({
            scope,
            targetProfileId: targetId,
            policyRevision: revision,
            surface: nextSurface
        });
        const policyState = {
            schema: MANAGED_LOCAL_EDIT_POLICY_SCHEMA,
            version: 1,
            source: 'local_parent_managed_edit',
            scope,
            targetProfileId: targetId,
            actorProfileId: actorId,
            actorDeviceId,
            policyRevision: revision,
            policyHash,
            updatedAt: now
        };
        const historyRow = {
            rowId: `local-managed-${scope}-${revision}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: actorId,
            actorDeviceId,
            targetProfileId: targetId,
            trustedLinkId: null,
            actionType: 'local_policy.update',
            scope,
            revision,
            policyHash,
            result: 'accepted',
            reason: null,
            receivedAt: now,
            issuedAt: now,
            orderKey: `${String(revision).padStart(6, '0')}:${now}`,
            summary,
            sensitive: true
        };
        return { scope, policyState, historyRow };
    }

    function buildManagedViewingSpaceLocalEditReport({ actorProfileId, targetProfileId, priorProfile, nextAccess }) {
        const access = safeObject(nextAccess);
        const allowMainViewing = access.allowMainViewing === true;
        const allowKidsViewing = access.allowKidsViewing === true;
        const defaultLaunchTarget = normalizeString(access.defaultLaunchTarget);
        const priorState = localManagedPolicyRevisionStore(priorProfile, 'viewing_space');
        const revision = Math.max(0, normalizeNonNegativeInteger(priorState.policyRevision) || 0) + 1;
        const now = Date.now();
        const actorId = normalizeString(actorProfileId) || 'default';
        const targetId = normalizeString(targetProfileId);
        const actorDeviceId = normalizeString(nanahStableDeviceId) || 'local-extension-device';
        const policyHash = buildManagedLocalEditPolicyHash({
            scope: 'viewing_space',
            targetProfileId: targetId,
            policyRevision: revision,
            allowMainViewing,
            allowKidsViewing,
            defaultLaunchTarget
        });
        const policyState = {
            schema: MANAGED_LOCAL_EDIT_POLICY_SCHEMA,
            version: 1,
            source: 'local_parent_viewing_space_policy',
            scope: 'viewing_space',
            targetProfileId: targetId,
            actorProfileId: actorId,
            actorDeviceId,
            policyRevision: revision,
            policyHash,
            updatedAt: now
        };
        const historyRow = {
            rowId: `local-viewing-space-${revision}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: actorId,
            actorDeviceId,
            targetProfileId: targetId,
            trustedLinkId: null,
            actionType: 'policy.viewing_space.update',
            scope: 'viewing_space',
            revision,
            policyHash,
            result: 'accepted',
            reason: null,
            receivedAt: now,
            issuedAt: now,
            orderKey: `${String(revision).padStart(6, '0')}:${now}`,
            summary: summarizeManagedViewingSpacePolicy({
                allowMainViewing,
                allowKidsViewing,
                defaultLaunchTarget
            }),
            sensitive: true
        };
        return { scope: 'viewing_space', policyState, historyRow };
    }

    function buildManagedTimeLimitLocalEditReport({ actorProfileId, targetProfileId, nextPolicy }) {
        const policy = safeObject(nextPolicy);
        const revision = normalizeNonNegativeInteger(policy.policyRevision) || 1;
        const now = Date.now();
        const actorId = normalizeString(actorProfileId) || 'default';
        const targetId = normalizeString(targetProfileId);
        const actorDeviceId = normalizeString(nanahStableDeviceId) || 'local-extension-device';
        const policyHash = normalizeString(policy.policyHash) || buildManagedTimeLimitPolicyHash({
            enabled: policy.enabled === true,
            timezone: normalizeString(policy.timezone) || 'Etc/UTC',
            dailyBudgetSeconds: normalizeNonNegativeInteger(policy.dailyBudgetSeconds) || 0,
            surfaceBudgets: safeObject(policy.surfaceBudgets),
            policyRevision: revision
        });
        const policyState = {
            schema: MANAGED_LOCAL_EDIT_POLICY_SCHEMA,
            version: 1,
            source: 'local_parent_time_limit_policy',
            scope: 'time_limits',
            targetProfileId: targetId,
            actorProfileId: actorId,
            actorDeviceId,
            policyRevision: revision,
            policyHash,
            updatedAt: now
        };
        const historyRow = {
            rowId: `local-time-limit-${revision}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: actorId,
            actorDeviceId,
            targetProfileId: targetId,
            trustedLinkId: null,
            actionType: 'policy.time_limit.update',
            scope: 'time_limits',
            revision,
            policyHash,
            result: 'accepted',
            reason: null,
            receivedAt: now,
            issuedAt: normalizeNonNegativeInteger(policy.issuedAt) || now,
            orderKey: `${String(revision).padStart(6, '0')}:${now}`,
            summary: summarizeManagedTimeLimitPolicy(policy),
            sensitive: true
        };
        return { scope: 'time_limits', policyState, historyRow };
    }

    function recordManagedChildLocalEditHistory(profile, report) {
        const existingPolicyState = safeObject(profile?.managedPolicyState);
        const localEdits = safeObject(existingPolicyState.localManagedEdits);
        const nextRows = appendManagedActionHistoryRow(profile, report.historyRow);
        return {
            ...profile,
            managedPolicyState: {
                ...existingPolicyState,
                localManagedEdits: {
                    ...localEdits,
                    [report.scope]: report.policyState
                }
            },
            managedActionHistory: nextRows
        };
    }

    async function recordManagedAdminAuthFailureHistory(profilesV4, targetProfileId, reason = 'unlock_failed') {
        const io = window.FilterTubeIO || {};
        if (typeof io.saveProfilesV4 !== 'function') return false;

        const targetId = normalizeString(targetProfileId);
        const root = safeObject(
            typeof io.loadProfilesV4 === 'function'
                ? await io.loadProfilesV4()
                : profilesV4
        );
        if (!targetId || !canActiveProfileManageProfile(root, targetId)) return false;

        const profiles = { ...safeObject(root.profiles) };
        const profile = safeObject(profiles[targetId]);
        if (!profile || Object.keys(profile).length === 0) return false;

        const now = Date.now();
        const actorId = normalizeString(root.activeProfileId) || activeProfileId || 'default';
        const row = {
            rowId: `managed-auth-failed-${targetId}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: actorId,
            actorDeviceId: normalizeString(nanahStableDeviceId) || 'local-extension-device',
            targetProfileId: targetId,
            trustedLinkId: null,
            actionType: 'admin_session.failed_unlock',
            scope: 'admin_session',
            revision: null,
            policyHash: null,
            result: 'failed_auth',
            reason: normalizeString(reason) || 'unlock_failed',
            receivedAt: now,
            issuedAt: now,
            orderKey: `auth:${now}`,
            summary: {
                redacted: true,
                label: 'Parent unlock failed'
            },
            sensitive: true
        };
        profiles[targetId] = {
            ...profile,
            managedActionHistory: appendManagedActionHistoryRow(profile, row)
        };
        await io.saveProfilesV4({
            ...root,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...root, schemaVersion: 4, profiles };
        return true;
    }

    function getManagedActionHistoryRowTime(row) {
        const item = safeObject(row);
        for (const key of ['receivedAt', 'issuedAt', 'createdAt']) {
            const value = normalizeNonNegativeInteger(item[key]);
            if (value != null) return value;
        }
        const orderKey = normalizeString(item.orderKey);
        const match = orderKey.match(/(\d{12,})$/);
        if (match) {
            const value = normalizeNonNegativeInteger(match[1]);
            if (value != null) return value;
        }
        return null;
    }

    function getManagedActionHistoryRetentionMs(row) {
        const item = safeObject(row);
        const result = normalizeString(item.result);
        const actionType = normalizeString(item.actionType);
        if (MANAGED_ACTION_HISTORY_PROTECTED_RESULTS.has(result) ||
            MANAGED_ACTION_HISTORY_PROTECTED_ACTIONS.has(actionType)) {
            return MANAGED_ACTION_HISTORY_PROTECTED_RETENTION_MS;
        }
        return MANAGED_ACTION_HISTORY_ACCEPTED_RETENTION_MS;
    }

    function pruneManagedActionHistoryRows(rows, now = Date.now()) {
        return safeArray(rows)
            .filter(row => safeObject(row).schema === MANAGED_ACTION_HISTORY_SCHEMA)
            .map(sanitizeManagedActionHistoryRow)
            .filter((row) => {
                const timestamp = getManagedActionHistoryRowTime(row);
                if (timestamp == null) return true;
                return now - timestamp < getManagedActionHistoryRetentionMs(row);
            })
            .slice(-MANAGED_ACTION_HISTORY_LIMIT);
    }

    function sanitizeManagedActionHistorySummaryValue(key, value) {
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_NUMBER_KEYS.has(key)) {
            const numeric = Number(value);
            return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : null;
        }
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_BOOLEAN_KEYS.has(key)) {
            return value === true;
        }
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_KEYS.has(key)) {
            const normalized = normalizeString(value);
            return normalized ? normalized.slice(0, 160) : null;
        }
        if (MANAGED_ACTION_HISTORY_SUMMARY_SAFE_STRING_ARRAY_KEYS.has(key)) {
            const items = safeArray(value)
                .map(item => normalizeString(item))
                .filter(Boolean)
                .map(item => item.replace(/[^a-zA-Z0-9_.:-]+/g, '_').slice(0, 64))
                .filter(Boolean)
                .slice(0, 12);
            return items.length ? items : null;
        }
        return null;
    }

    function sanitizeManagedEncryptedSummaryToken(value, maxLength) {
        const normalized = normalizeString(value);
        if (!normalized || normalized.length > maxLength) return '';
        return /^[a-zA-Z0-9_.:+/=-]+$/.test(normalized) ? normalized : '';
    }

    function sanitizeManagedActionHistoryEncryptedSummary(value) {
        const root = safeObject(value);
        if (root.schema !== MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_SCHEMA) return null;
        for (const key of Object.keys(root)) {
            if (MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_FORBIDDEN_KEYS.has(key)) return null;
        }
        const cipherSuite = sanitizeManagedEncryptedSummaryToken(root.cipherSuite || root.algorithm, 80);
        const keyId = sanitizeManagedEncryptedSummaryToken(root.keyId || root.wrappingKeyId, 128);
        const nonce = sanitizeManagedEncryptedSummaryToken(root.nonce || root.iv, 256);
        const ciphertext = sanitizeManagedEncryptedSummaryToken(root.ciphertext, 4096);
        const ciphertextHash = sanitizeManagedEncryptedSummaryToken(root.ciphertextHash || root.hash, 160);
        if (!cipherSuite || !keyId || !nonce || !ciphertext || !ciphertextHash) return null;
        const createdAt = normalizeNonNegativeInteger(root.createdAt);
        return {
            schema: MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_SCHEMA,
            version: 1,
            cipherSuite,
            keyId,
            nonce,
            ciphertext,
            ciphertextHash,
            ...(createdAt ? { createdAt } : {})
        };
    }

    function sanitizeManagedActionHistorySummary(summary, actionType, sensitive) {
        const root = safeObject(summary);
        const safeLabel = MANAGED_ACTION_HISTORY_SAFE_LABELS[actionType] || actionType || 'Managed action';
        const next = {
            redacted: true,
            label: sensitive === true ? safeLabel : (normalizeString(root.label) || safeLabel).slice(0, 160)
        };
        Object.entries(root).forEach(([key, value]) => {
            if (key === 'label' || key === 'redacted' || key === 'summaryPrivacy' || key === 'encryptedSummary') return;
            const sanitized = sanitizeManagedActionHistorySummaryValue(key, value);
            if (sanitized == null) return;
            next[key] = sanitized;
        });
        const encryptedSummary = sanitizeManagedActionHistoryEncryptedSummary(root.encryptedSummary);
        if (encryptedSummary) {
            next.encryptedSummary = encryptedSummary;
        }
        next.summaryPrivacy = {
            schema: MANAGED_ACTION_HISTORY_SUMMARY_PRIVACY_SCHEMA,
            version: 1,
            redacted: true,
            encrypted: !!encryptedSummary,
            plaintextPolicy: encryptedSummary
                ? 'safe_counts_status_transport_and_ciphertext_only'
                : 'safe_counts_status_and_transport_only'
        };
        return next;
    }

    function sanitizeManagedActionHistoryRow(row) {
        const root = safeObject(row);
        const actionType = normalizeString(root.actionType);
        const sensitive = root.sensitive !== false;
        return {
            ...root,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actionType,
            scope: normalizeString(root.scope) || 'policy',
            result: normalizeString(root.result) || 'unknown',
            reason: normalizeString(root.reason) || null,
            sensitive,
            summary: sanitizeManagedActionHistorySummary(root.summary, actionType, sensitive)
        };
    }

    function appendManagedActionHistoryRow(profile, row) {
        const receivedAt = getManagedActionHistoryRowTime(row);
        const now = receivedAt == null ? Date.now() : receivedAt;
        return appendManagedActionHistoryRows(profile, [row], now);
    }

    function appendManagedActionHistoryRows(profile, rows, now = Date.now()) {
        return pruneManagedActionHistoryRows([
            ...safeArray(profile?.managedActionHistory),
            ...safeArray(rows)
        ], now);
    }

    function getManagedActionHistoryRows(profile) {
        return pruneManagedActionHistoryRows(profile?.managedActionHistory);
    }

    function managedActionHistoryRowIsProtected(row) {
        const item = safeObject(row);
        return MANAGED_ACTION_HISTORY_PROTECTED_RESULTS.has(normalizeString(item.result)) ||
            MANAGED_ACTION_HISTORY_PROTECTED_ACTIONS.has(normalizeString(item.actionType));
    }

    function canViewManagedActionHistory(profilesV4, targetProfileId) {
        const currentActive = normalizeString(profilesV4?.activeProfileId) || activeProfileId || 'default';
        if (getProfileType(profilesV4, currentActive) === 'child') return false;
        return canActiveProfileManageProfile(profilesV4, targetProfileId);
    }

    function formatManagedActionHistoryRow(row) {
        const item = safeObject(row);
        const summary = safeObject(item.summary);
        const date = Number.isFinite(Number(item.receivedAt))
            ? new Date(Number(item.receivedAt)).toLocaleString()
            : 'Unknown time';
        const scope = normalizeString(item.scope)
            .toLowerCase()
            .replace(/[^a-z0-9_.:-]+/g, '_')
            .slice(0, 96) || 'policy';
        const result = normalizeString(item.result)
            .toLowerCase()
            .replace(/[^a-z0-9_.:-]+/g, '_')
            .slice(0, 96) || 'unknown';
        const actionType = normalizeString(item.actionType);
        const safeLabel = MANAGED_ACTION_HISTORY_SAFE_LABELS[actionType] || actionType || 'Managed action';
        const label = item.sensitive === true ? safeLabel : (normalizeString(summary.label) || safeLabel);
        const reason = normalizeString(item.reason)
            .toLowerCase()
            .replace(/[^a-z0-9_.:-]+/g, '_')
            .slice(0, 96);
        const detailParts = buildManagedActionHistoryDisplayDetails(item, summary);
        const detailSuffix = detailParts.length ? ` | ${detailParts.join(' | ')}` : '';
        return reason
            ? `${date} - ${result} - ${scope} - ${label} (${reason})${detailSuffix}`
            : `${date} - ${result} - ${scope} - ${label}${detailSuffix}`;
    }

    function isManagedRemoteConflictHistoryRow(row) {
        const item = safeObject(row);
        const actionType = normalizeString(item.actionType);
        const result = normalizeString(item.result);
        if (result === 'conflict') return true;
        return actionType === 'remote_policy.conflict'
            || actionType === 'remote_policy.mailbox.conflict';
    }

    function isManagedRemoteRejectedHistoryRow(row) {
        const item = safeObject(row);
        const actionType = normalizeString(item.actionType);
        const result = normalizeString(item.result);
        if (result !== 'rejected') return false;
        return actionType === 'remote_policy.reject'
            || actionType === 'remote_policy.mailbox.reject'
            || actionType === 'remote_policy.mailbox.revoke'
            || actionType === 'remote_policy.mailbox.expire';
    }

    function formatManagedHistoryDuration(seconds) {
        const totalSeconds = normalizeNonNegativeInteger(seconds) || 0;
        if (totalSeconds <= 0) return '0m';
        const totalMinutes = Math.max(1, Math.ceil(totalSeconds / 60));
        if (totalMinutes < 60) return `${totalMinutes}m`;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    function buildManagedActionHistoryDisplayDetails(row, summary) {
        const item = safeObject(row);
        const root = safeObject(summary);
        const parts = [];
        const actionType = normalizeString(item.actionType);
        if (actionType === 'policy.time_limit.request_extra') {
            const surface = normalizeString(root.surface);
            const dateKey = normalizeString(root.dateKey);
            const consumedSeconds = normalizeNonNegativeInteger(root.consumedSeconds);
            const dailyBudgetSeconds = normalizeNonNegativeInteger(root.dailyBudgetSeconds);
            const remainingSeconds = normalizeNonNegativeInteger(root.remainingSeconds);
            if (surface) parts.push(`surface ${surface === 'kids' ? 'Kids' : 'Main'}`);
            if (dateKey) parts.push(`date ${dateKey}`);
            if (consumedSeconds != null && dailyBudgetSeconds != null) {
                parts.push(`used ${formatManagedHistoryDuration(consumedSeconds)} of ${formatManagedHistoryDuration(dailyBudgetSeconds)}`);
            }
            if (remainingSeconds != null) {
                parts.push(`remaining ${formatManagedHistoryDuration(remainingSeconds)}`);
            }
        } else if (actionType === 'policy.time_limit.update') {
            const enabled = root.enabled === true;
            const dailyBudgetSeconds = normalizeNonNegativeInteger(root.dailyBudgetSeconds);
            const parentGrantSeconds = normalizeNonNegativeInteger(root.parentGrantSeconds);
            const timezone = normalizeString(root.timezone);
            parts.push(enabled ? 'limit enabled' : 'limit disabled');
            if (dailyBudgetSeconds != null) {
                parts.push(`daily ${formatManagedHistoryDuration(dailyBudgetSeconds)}`);
            }
            if (parentGrantSeconds != null && parentGrantSeconds > 0) {
                parts.push(`extra ${formatManagedHistoryDuration(parentGrantSeconds)}`);
            }
            if (timezone) {
                parts.push(`timezone ${timezone}`);
            }
        } else if (actionType === 'policy.channel_list.import'
            || actionType === 'policy.channel_list.remove'
            || actionType === 'policy.channel_list.check'
            || actionType === 'policy.channel_list.refresh'
            || actionType === 'policy.channel_list.pause'
            || actionType === 'policy.channel_list.resume') {
            const surface = normalizeString(root.surface);
            const addedCount = normalizeNonNegativeInteger(root.addedCount);
            const changedCount = normalizeNonNegativeInteger(root.changedCount);
            const duplicateCount = normalizeNonNegativeInteger(root.duplicateCount);
            const removedCount = normalizeNonNegativeInteger(root.removedCount);
            const skippedCount = normalizeNonNegativeInteger(root.skippedCount);
            const listEntryCount = normalizeNonNegativeInteger(root.listEntryCount);
            if (surface) parts.push(`surface ${surface === 'kids' ? 'Kids' : (surface === 'both' ? 'Main + Kids' : 'Main')}`);
            if (listEntryCount != null) parts.push(`list ${listEntryCount}`);
            if (changedCount != null) parts.push(`changed ${changedCount}`);
            if (addedCount != null) parts.push(`added ${addedCount}`);
            if (removedCount != null) parts.push(`removed ${removedCount}`);
            if (duplicateCount != null) parts.push(`already present ${duplicateCount}`);
            if (skippedCount != null) parts.push(`skipped ${skippedCount}`);
        }
        if (actionType === 'remote_policy.source_push') {
            const deliveryStatus = normalizeString(root.deliveryStatus);
            const liveSent = normalizeNonNegativeInteger(root.liveSentCount) || 0;
            const lanSent = normalizeNonNegativeInteger(root.localNetworkDeliveredCount) || 0;
            const mailboxSent = normalizeNonNegativeInteger(root.mailboxUploadedCount) || 0;
            const failed = normalizeNonNegativeInteger(root.failedCount) || 0;
            const noLinks = normalizeNonNegativeInteger(root.noLinkCount) || 0;
            const missingProvider = normalizeNonNegativeInteger(root.providerMissingCount) || 0;
            const deliveryBits = [];
            if (liveSent) deliveryBits.push(`live ${liveSent}`);
            if (lanSent) deliveryBits.push(`LAN ${lanSent}`);
            if (mailboxSent) deliveryBits.push(`mailbox ${mailboxSent}`);
            if (failed) deliveryBits.push(`failed ${failed}`);
            if (noLinks) deliveryBits.push(`no-link ${noLinks}`);
            if (missingProvider) deliveryBits.push(`provider-missing ${missingProvider}`);
            if (deliveryStatus) parts.push(`status ${deliveryStatus}`);
            if (deliveryBits.length) parts.push(`delivery ${deliveryBits.join(', ')}`);
        }
        const transports = safeArray(root.transports)
            .map(item => normalizeString(item))
            .filter(Boolean);
        if (transports.length) {
            parts.push(`transports ${transports.join(', ')}`);
        }
        return parts;
    }

    function resolveManagedPolicyPushResult(deliveredCount, failedCount) {
        if (deliveredCount > 0 && failedCount > 0) return 'partial_sent';
        if (deliveredCount > 0) return 'sent';
        return 'rejected';
    }

    function resolveManagedPolicyPushDeliveryStatus(details) {
        const root = safeObject(details);
        const deliveredCount = normalizeNonNegativeInteger(root.deliveredCount) || 0;
        const failedCount = normalizeNonNegativeInteger(root.failedCount) || 0;
        const liveSent = normalizeNonNegativeInteger(root.liveSentCount) || 0;
        const mailboxUploaded = normalizeNonNegativeInteger(root.mailboxUploadedCount) || 0;
        const localNetworkDelivered = normalizeNonNegativeInteger(root.localNetworkDeliveredCount) || 0;
        const noLinkCount = normalizeNonNegativeInteger(root.noLinkCount) || 0;
        const providerMissingCount = normalizeNonNegativeInteger(root.providerMissingCount) || 0;
        if (deliveredCount > 0 && failedCount > 0) return 'partial_delivery';
        if (liveSent > 0 && mailboxUploaded === 0 && localNetworkDelivered === 0) return 'live_sent';
        if (localNetworkDelivered > 0 && liveSent === 0 && mailboxUploaded === 0) return 'local_network_sent';
        if (mailboxUploaded > 0 && liveSent === 0 && localNetworkDelivered === 0) return 'mailbox_queued';
        if (deliveredCount > 0) return 'multi_transport_sent';
        if (noLinkCount > 0) return 'no_verified_device';
        if (providerMissingCount > 0) return 'provider_unavailable';
        if (failedCount > 0) return 'delivery_failed';
        return 'no_delivery_attempt';
    }

    function normalizeManagedTransportLabels(values) {
        return Array.from(new Set(safeArray(values)
            .map(item => normalizeString(item))
            .filter(Boolean)
            .map(item => item.replace(/[^a-zA-Z0-9_.:-]+/g, '_').slice(0, 64))
            .filter(Boolean)))
            .slice(0, 12);
    }

    function summarizeManagedDeliveryHistory(details) {
        const root = safeObject(details);
        const deliveredCount = normalizeNonNegativeInteger(root.deliveredCount) || 0;
        const failedCount = normalizeNonNegativeInteger(root.failedCount) || 0;
        const transports = normalizeManagedTransportLabels(root.transports);
        return {
            linkCount: normalizeNonNegativeInteger(root.linkCount) || 0,
            deliveredCount,
            failedCount,
            mailboxUploadedCount: normalizeNonNegativeInteger(root.mailboxUploadedCount) || 0,
            localNetworkDeliveredCount: normalizeNonNegativeInteger(root.localNetworkDeliveredCount) || 0,
            liveSentCount: normalizeNonNegativeInteger(root.liveSentCount) || 0,
            noLinkCount: normalizeNonNegativeInteger(root.noLinkCount) || 0,
            providerMissingCount: normalizeNonNegativeInteger(root.providerMissingCount) || 0,
            transports,
            deliveryStatus: resolveManagedPolicyPushDeliveryStatus(root)
        };
    }

    function managedPolicyRevisionLabel(state, label) {
        const root = safeObject(state);
        const revision = normalizeNonNegativeInteger(root.policyRevision || root.revision);
        const updatedAt = normalizeNonNegativeInteger(root.updatedAt || root.receivedAt || root.issuedAt);
        if (!revision) return '';
        const suffix = updatedAt ? `, ${new Date(updatedAt).toLocaleDateString()}` : '';
        return `${label} r${revision}${suffix}`;
    }

    function summarizeManagedPolicyStateForProfile(profile) {
        const managedState = safeObject(profile?.managedPolicyState);
        const localEdits = safeObject(managedState.localManagedEdits);
        const remotePolicies = safeObject(managedState.remoteManagedPolicies);
        const remotePolicyConflicts = safeObject(managedState.remotePolicyConflicts);
        const localLabels = ['main', 'kids']
            .map(scope => managedPolicyRevisionLabel(localEdits[scope], scope === 'kids' ? 'Kids' : 'Main'))
            .filter(Boolean);
        let remoteLinkCount = 0;
        let remoteScopeCount = 0;
        let latestRemoteRevision = 0;
        Object.values(remotePolicies).forEach((linkPolicies) => {
            const scopes = Object.values(safeObject(linkPolicies)).filter((entry) => {
                const state = safeObject(entry);
                return !!(normalizeNonNegativeInteger(state.revision) && normalizeString(state.policyHash));
            });
            if (!scopes.length) return;
            remoteLinkCount += 1;
            remoteScopeCount += scopes.length;
            scopes.forEach((entry) => {
                latestRemoteRevision = Math.max(latestRemoteRevision, normalizeNonNegativeInteger(safeObject(entry).revision) || 0);
            });
        });
        const historyRows = getManagedActionHistoryRows(profile);
        const protectedRows = historyRows.filter(managedActionHistoryRowIsProtected);
        const latestRow = safeObject(historyRows[historyRows.length - 1]);
        const latestDeliverySummary = summarizeLatestManagedDeliveryHistory(historyRows);
        const latestActionType = normalizeString(latestRow.actionType);
        const latestSafeLabel = MANAGED_ACTION_HISTORY_SAFE_LABELS[latestActionType] || latestActionType || '';
        const latestResult = normalizeString(latestRow.result);
        const latestScope = normalizeString(latestRow.scope);
        const conflictRows = Object.values(remotePolicyConflicts)
            .map(safeObject)
            .filter(row => row.schema === MANAGED_REMOTE_POLICY_CONFLICT_SCHEMA);
        return {
            localLabels,
            remoteLinkCount,
            remoteScopeCount,
            latestRemoteRevision,
            historyRowCount: historyRows.length,
            protectedRowCount: protectedRows.length,
            remoteConflictCount: conflictRows.length,
            latestResult,
            latestScope,
            latestDeliveryLabel: latestDeliverySummary.label,
            latestDeliveryTone: latestDeliverySummary.tone,
            latestActionLabel: latestSafeLabel && latestResult
                ? `${latestResult} · ${latestSafeLabel}`
                : (latestSafeLabel || (latestResult && latestScope ? `${latestResult}/${latestScope}` : ''))
        };
    }

    function summarizeLatestManagedDeliveryHistory(historyRows) {
        const rows = safeArray(historyRows);
        for (let index = rows.length - 1; index >= 0; index -= 1) {
            const row = safeObject(rows[index]);
            if (normalizeString(row.actionType) !== 'remote_policy.source_push') continue;
            const summary = safeObject(row.summary);
            const status = normalizeString(summary.deliveryStatus || row.result).replace(/_/g, ' ');
            const liveSent = normalizeNonNegativeInteger(summary.liveSentCount) || 0;
            const lanSent = normalizeNonNegativeInteger(summary.localNetworkDeliveredCount) || 0;
            const mailboxSent = normalizeNonNegativeInteger(summary.mailboxUploadedCount) || 0;
            const failed = normalizeNonNegativeInteger(summary.failedCount) || 0;
            const noLinks = normalizeNonNegativeInteger(summary.noLinkCount) || 0;
            const providerMissing = normalizeNonNegativeInteger(summary.providerMissingCount) || 0;
            const bits = [];
            if (liveSent) bits.push(`live ${liveSent}`);
            if (lanSent) bits.push(`LAN ${lanSent}`);
            if (mailboxSent) bits.push(`mailbox ${mailboxSent}`);
            if (failed) bits.push(`failed ${failed}`);
            if (noLinks) bits.push(`no-link ${noLinks}`);
            if (providerMissing) bits.push(`provider-missing ${providerMissing}`);
            const label = bits.length
                ? `Last send: ${status || 'recorded'} (${bits.join(', ')})`
                : `Last send: ${status || normalizeString(row.result) || 'recorded'}`;
            const result = normalizeString(row.result);
            const tone = result === 'rejected' || failed > 0 || noLinks > 0 || providerMissing > 0
                ? (liveSent || lanSent || mailboxSent ? 'warning' : 'danger')
                : 'success';
            return { label, tone };
        }
        return { label: '', tone: '' };
    }

    function buildManagedProfileStatusText(profile, { revealDetails = false } = {}) {
        if (!revealDetails) return '';
        const summary = summarizeManagedPolicyStateForProfile(profile);
        const parts = [];
        if (summary.localLabels.length) {
            parts.push(`Local edits: ${summary.localLabels.join(', ')}`);
        }
        if (summary.remoteScopeCount) {
            const linkLabel = summary.remoteLinkCount === 1 ? 'link' : 'links';
            const scopeLabel = summary.remoteScopeCount === 1 ? 'scope' : 'scopes';
            parts.push(`Remote sync: ${summary.remoteScopeCount} ${scopeLabel} across ${summary.remoteLinkCount} ${linkLabel}, latest r${summary.latestRemoteRevision}`);
        }
        if (summary.historyRowCount) {
            const rowLabel = summary.historyRowCount === 1 ? 'row' : 'rows';
            const latest = summary.latestActionLabel
                ? `, latest ${summary.latestActionLabel}`
                : '';
            parts.push(`History: ${summary.historyRowCount} ${rowLabel}, ${summary.protectedRowCount} protected${latest}`);
        }
        if (summary.remoteConflictCount) {
            parts.push(`Remote conflicts: ${summary.remoteConflictCount}`);
        }
        return parts.length
            ? `Managed status: ${parts.join(' | ')}`
            : 'Managed status: no parent-managed policy revisions yet.';
    }

    async function showManagedActionHistory(profileId, options = {}) {
        const targetId = normalizeString(profileId);
        if (!targetId) return;
        const mode = normalizeString(options?.mode);
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        if (!canViewManagedActionHistory(fresh, targetId)) {
            UIComponents.showToast('Switch to the parent account to view protected history', 'error');
            return;
        }

        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            await recordManagedAdminAuthFailureHistory(fresh, targetId, 'history_view_unlock_failed');
            return;
        }

        const profiles = safeObject(fresh.profiles);
        const profile = safeObject(profiles[targetId]);
        const rows = getManagedActionHistoryRows(profile);
        const reviewConflicts = mode === 'conflicts';
        const conflictRows = reviewConflicts
            ? rows.filter(row => isManagedRemoteConflictHistoryRow(row) || isManagedRemoteRejectedHistoryRow(row))
            : [];
        const displayRows = reviewConflicts ? conflictRows : rows;
        const latestRows = displayRows.slice(-12).reverse();
        const profileName = getProfileName(fresh, targetId);
        const details = latestRows.length
            ? latestRows.map(formatManagedActionHistoryRow)
            : [
                reviewConflicts
                    ? 'No remote conflicts or rejected managed-policy rows are currently recorded for this profile.'
                    : 'No parent-managed actions have been recorded for this profile yet.'
            ];
        const protectedCount = rows.filter(managedActionHistoryRowIsProtected).length;
        const choice = await showChoiceModal({
            title: reviewConflicts ? `${profileName} Conflict Review` : `${profileName} History`,
            message: reviewConflicts
                ? `${conflictRows.length} conflict/rejected remote rows shown from ${rows.length} total history rows. Protected evidence remains read-only.`
                : protectedCount
                    ? `${rows.length} rows recorded. ${protectedCount} protected rows are retained until parent re-auth and retention rules allow clearing.`
                    : `${rows.length} parent-managed rows recorded.`,
            details,
            choices: (!reviewConflicts && rows.length) ? [
                {
                    value: 'clear',
                    label: protectedCount ? 'Clear Accepted Only' : 'Clear History',
                    className: 'btn-secondary'
                }
            ] : [],
            cancelText: 'Close'
        });
        if (choice !== 'clear') return;
        await clearManagedActionHistory(targetId);
    }

    async function clearManagedActionHistory(profileId) {
        const targetId = normalizeString(profileId);
        if (!targetId) return false;
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return false;
        }

        const fresh = await io.loadProfilesV4();
        if (!canViewManagedActionHistory(fresh, targetId)) {
            UIComponents.showToast('Switch to the parent account to clear protected history', 'error');
            return false;
        }

        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            await recordManagedAdminAuthFailureHistory(fresh, targetId, 'history_clear_unlock_failed');
            return false;
        }

        const profiles = safeObject(fresh.profiles);
        const profile = safeObject(profiles[targetId]);
        const rows = getManagedActionHistoryRows(profile);
        const protectedRows = rows.filter(managedActionHistoryRowIsProtected);
        const clearedRows = rows.length - protectedRows.length;
        const now = Date.now();
        const clearRow = {
            rowId: `managed-history-clear-${targetId}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: currentActive,
            actorDeviceId: normalizeString(nanahStableDeviceId) || 'local-extension-device',
            targetProfileId: targetId,
            trustedLinkId: null,
            actionType: 'history.clear',
            scope: 'admin_session',
            revision: null,
            policyHash: null,
            result: 'cleared_by_admin',
            reason: 'accepted_rows_cleared',
            receivedAt: now,
            issuedAt: now,
            orderKey: `clear:${now}`,
            summary: {
                redacted: true,
                label: 'Parent cleared accepted history',
                clearedAcceptedRows: clearedRows,
                retainedProtectedRows: protectedRows.length
            },
            sensitive: true
        };
        profiles[targetId] = {
            ...profile,
            managedActionHistory: pruneManagedActionHistoryRows([...protectedRows, clearRow], now)
        };
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await refreshProfilesUI();
        UIComponents.showToast(
            protectedRows.length
                ? `Cleared ${clearedRows} accepted rows; protected evidence retained`
                : 'History cleared',
            'success'
        );
        return true;
    }

    function getManagedNanahPolicyAcceptedState(profile, linkId, scope) {
        const managedState = safeObject(profile?.managedPolicyState);
        const remotePolicies = safeObject(managedState.remoteManagedPolicies);
        const linkPolicies = safeObject(remotePolicies[normalizeString(linkId)]);
        const accepted = safeObject(linkPolicies[normalizeString(scope).toLowerCase()]);
        const revision = normalizeNonNegativeInteger(accepted.revision);
        const policyHash = normalizeString(accepted.policyHash);
        return revision && policyHash ? { revision, policyHash } : null;
    }

    function findNanahTrustedLinkForManagedEnvelope(envelope) {
        const root = safeObject(envelope);
        const sourceDeviceId = normalizeString(root.sourceDeviceId);
        const linkId = normalizeString(root.linkId);
        const targetProfileId = normalizeString(root.targetProfileId);
        return nanahTrustedLinks.find((entry) => normalizeString(entry?.linkId) === linkId)
            || (sourceDeviceId ? findNanahTrustedLink(sourceDeviceId, {
                targetProfileId,
                linkId,
                linkType: 'managed_link',
                localRole: 'replica',
                remoteRole: 'source'
            }) : null)
            || null;
    }

    function buildNanahManagedValidationTrustedLink(envelope, link) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted) return {};
        const policy = safeObject(trusted.policy);
        const keyVersion = normalizeNonNegativeInteger(trusted.keyVersion || policy.keyVersion);
        return {
            ...trusted,
            id: normalizeString(trusted.id) || trusted.linkId,
            type: trusted.linkType,
            sourceDeviceId: normalizeString(trusted.sourceDeviceId || policy.sourceDeviceId)
                || (trusted.localRole === 'replica' && trusted.remoteRole === 'source' ? trusted.remoteDeviceId : ''),
            sourceProfileId: normalizeString(trusted.sourceProfileId || policy.sourceProfileId),
            targetProfileId: normalizeString(trusted.targetProfileId || policy.targetProfileId),
            allowedScopes: getNanahManagedPolicyScopeList(trusted.allowedScopes || policy.allowedScopes || policy.defaultScope),
            sourcePublicKeyId: normalizeString(trusted.sourcePublicKeyId || policy.sourcePublicKeyId),
            sourcePublicKeyJwk: safeObject(trusted.sourcePublicKeyJwk || policy.sourcePublicKeyJwk || policy.publicKeyJwk),
            keyVersion: keyVersion || 0,
            revoked: trusted.revoked === true || policy.revoked === true,
            keyRevoked: trusted.keyRevoked === true || policy.keyRevoked === true,
            stalePairing: trusted.stalePairing === true || policy.stalePairing === true,
            policy
        };
    }

    function getNanahManagedDuplicateDeviceIds(sourceDeviceId, trustedLinkId, targetProfileId = '') {
        const deviceId = normalizeString(sourceDeviceId);
        if (!deviceId) return [];
        const currentTargetProfileId = normalizeString(targetProfileId);
        const matching = nanahTrustedLinks.filter((entry) => {
            const trusted = normalizeNanahTrustedLink(entry);
            if (!trusted) return false;
            const policy = safeObject(trusted.policy);
            const candidate = normalizeString(trusted.sourceDeviceId || policy.sourceDeviceId) || trusted.remoteDeviceId;
            if (candidate !== deviceId || normalizeString(trusted.linkId) === normalizeString(trustedLinkId)) {
                return false;
            }
            const candidateTargetProfileId = getNanahTrustedLinkTargetProfileId(trusted);
            if (!currentTargetProfileId || !candidateTargetProfileId) return true;
            return candidateTargetProfileId === currentTargetProfileId;
        });
        return matching.length > 0 ? [deviceId] : [];
    }

    function buildManagedNanahPolicyValidationContext(envelope, profilesV4 = profilesV4Cache) {
        const root = safeObject(envelope);
        const link = findNanahTrustedLinkForManagedEnvelope(root);
        const trustedLink = buildNanahManagedValidationTrustedLink(root, link);
        const profilesRoot = safeObject(profilesV4);
        const profiles = safeObject(profilesRoot.profiles);
        const targetProfileId = normalizeString(root.targetProfileId || trustedLink.targetProfileId);
        const targetProfile = safeObject(profiles[targetProfileId]);
        const accepted = getManagedNanahPolicyAcceptedState(targetProfile, root.linkId || trustedLink.linkId, root.scope);
        return {
            profilesV4: profilesRoot,
            profiles,
            trustedLink,
            accepted,
            duplicateDeviceIds: getNanahManagedDuplicateDeviceIds(
                root.sourceDeviceId,
                root.linkId || trustedLink.linkId,
                targetProfileId
            ),
            signatureVerification: null,
            historyTargetProfileId: targetProfileId
        };
    }

    function summarizeManagedNanahPolicyEnvelope(envelope, decision) {
        const root = safeObject(envelope);
        const payload = safeObject(root.payload);
        const operations = safeArray(payload.operations);
        const scope = normalizeString(root.scope).toLowerCase() || 'policy';
        const reason = normalizeString(decision?.reason);
        const label = reason
            ? `Rejected remote ${scope} policy`
            : `Received remote ${scope} policy`;
        return {
            redacted: true,
            label,
            operationCount: operations.length,
            payloadScope: normalizeString(payload.scope) || scope,
            decision: normalizeString(decision?.decision),
            reason: reason || null
        };
    }

    function resolveManagedRemoteHistoryActionType({ accepted, conflict, reason, transport }) {
        const channel = normalizeString(transport).toLowerCase();
        if (channel === 'mailbox') {
            if (accepted) return 'remote_policy.mailbox.accept';
            if (conflict) return 'remote_policy.mailbox.conflict';
            if (reason === 'mailbox_item_expired') return 'remote_policy.mailbox.expire';
            if (reason === 'link_revoked' || reason === 'key_revoked') return 'remote_policy.mailbox.revoke';
            return 'remote_policy.mailbox.reject';
        }
        return accepted ? 'remote_policy.accept' : (conflict ? 'remote_policy.conflict' : 'remote_policy.reject');
    }

    function isManagedRemotePolicyConflictReason(reason) {
        return MANAGED_REMOTE_POLICY_CONFLICT_REASONS.has(normalizeString(reason));
    }

    function buildManagedRemotePolicyConflictRecord({ envelope, reason, transport, trustedLinkId, targetProfileId, scope, now }) {
        const root = safeObject(envelope);
        const normalizedReason = normalizeString(reason) || 'validation_failed';
        if (!isManagedRemotePolicyConflictReason(normalizedReason)) return null;
        const linkId = normalizeString(trustedLinkId || root.linkId) || 'unknown_link';
        const sourceDeviceId = normalizeString(root.sourceDeviceId) || 'unknown_device';
        const normalizedTargetId = normalizeString(targetProfileId || root.targetProfileId) || 'unknown_target';
        const normalizedScope = normalizeString(scope || root.scope).toLowerCase() || 'sync_policy';
        const normalizedTransport = normalizeString(transport) || 'nanah';
        const key = [
            normalizedTransport,
            linkId,
            sourceDeviceId,
            normalizedTargetId,
            normalizedScope,
            normalizedReason
        ].join(':');
        return {
            schema: MANAGED_REMOTE_POLICY_CONFLICT_SCHEMA,
            version: 1,
            key,
            transport: normalizedTransport,
            trustedLinkId: linkId === 'unknown_link' ? null : linkId,
            sourceDeviceId: sourceDeviceId === 'unknown_device' ? null : sourceDeviceId,
            sourceProfileId: normalizeString(root.sourceProfileId) || null,
            targetProfileId: normalizedTargetId === 'unknown_target' ? null : normalizedTargetId,
            scope: normalizedScope,
            revision: normalizeNonNegativeInteger(root.revision) || null,
            policyHash: normalizeString(root.policyHash) || null,
            reason: normalizedReason,
            lastSeenAt: now,
            count: 1,
            redacted: true
        };
    }

    function appendManagedRemotePolicyConflict(managedPolicyState, record) {
        if (!record) return managedPolicyState;
        const state = { ...safeObject(managedPolicyState) };
        const existing = safeObject(state.remotePolicyConflicts);
        const prior = safeObject(existing[record.key]);
        const nextRecord = prior.schema === MANAGED_REMOTE_POLICY_CONFLICT_SCHEMA
            ? {
                ...prior,
                ...record,
                firstSeenAt: normalizeNonNegativeInteger(prior.firstSeenAt) || record.lastSeenAt,
                count: Math.max(0, normalizeNonNegativeInteger(prior.count) || 0) + 1
            }
            : {
                ...record,
                firstSeenAt: record.lastSeenAt
            };
        const entries = Object.entries({
            ...existing,
            [record.key]: nextRecord
        }).sort((a, b) => {
            const at = normalizeNonNegativeInteger(safeObject(a[1]).lastSeenAt) || 0;
            const bt = normalizeNonNegativeInteger(safeObject(b[1]).lastSeenAt) || 0;
            return bt - at;
        }).slice(0, MANAGED_REMOTE_POLICY_CONFLICT_LIMIT);
        state.remotePolicyConflicts = Object.fromEntries(entries);
        return state;
    }

    async function recordManagedNanahPolicyValidationHistory(envelope, decision, context = {}) {
        const root = safeObject(envelope);
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            return false;
        }
        const targetProfileId = normalizeString(context.historyTargetProfileId || root.targetProfileId);
        if (!targetProfileId) return false;

        const fresh = await io.loadProfilesV4();
        const profiles = { ...safeObject(fresh.profiles) };
        const profile = safeObject(profiles[targetProfileId]);
        if (!profile || Object.keys(profile).length === 0) return false;

        const now = Date.now();
        const scope = normalizeString(root.scope).toLowerCase() || 'sync_policy';
        const revision = normalizeNonNegativeInteger(root.revision) || null;
        const policyHash = normalizeString(root.policyHash) || null;
        const reason = normalizeString(decision?.reason);
        const accepted = decision?.accepted === true && !reason;
        const conflict = reason === 'equal_revision_hash_conflict';
        const result = accepted ? 'accepted' : (conflict ? 'conflict' : 'rejected');
        const actionType = resolveManagedRemoteHistoryActionType({
            accepted,
            conflict,
            reason,
            transport: context.transport
        });
        const trustedLink = safeObject(context.trustedLink);
        const trustedLinkId = normalizeString(root.linkId || trustedLink.linkId || trustedLink.id);
        const transport = normalizeString(context.transport) || 'nanah';
        let remoteFailedAttempt = null;
        const managedPolicyState = { ...safeObject(profile.managedPolicyState) };
        if (!accepted) {
            const attemptKey = [
                transport,
                trustedLinkId || 'unknown_link',
                normalizeString(root.sourceDeviceId) || 'unknown_device',
                targetProfileId,
                scope
            ].join(':');
            const existingAttempts = safeObject(managedPolicyState.remoteFailedAttemptRateLimits);
            const existingAttempt = safeObject(existingAttempts[attemptKey]);
            const existingResetAt = Number(existingAttempt.resetAt);
            const activeWindow = existingAttempt.schema === MANAGED_REMOTE_FAILED_ATTEMPT_SCHEMA
                && Number.isFinite(existingResetAt)
                && now < existingResetAt;
            const priorCount = activeWindow
                ? Math.max(0, Math.floor(Number(existingAttempt.failedAttempts) || 0))
                : 0;
            const failedAttempts = priorCount + 1;
            remoteFailedAttempt = {
                schema: MANAGED_REMOTE_FAILED_ATTEMPT_SCHEMA,
                version: 1,
                key: attemptKey,
                transport,
                trustedLinkId,
                sourceDeviceId: normalizeString(root.sourceDeviceId) || null,
                targetProfileId,
                scope,
                failedAttempts,
                limit: MANAGED_REMOTE_FAILED_ATTEMPT_LIMIT,
                resetAt: activeWindow ? existingResetAt : now + MANAGED_REMOTE_FAILED_ATTEMPT_WINDOW_MS,
                updatedAt: now,
                rateLimited: failedAttempts >= MANAGED_REMOTE_FAILED_ATTEMPT_LIMIT,
                lastReason: reason || 'validation_failed'
            };
            managedPolicyState.remoteFailedAttemptRateLimits = {
                ...existingAttempts,
                [attemptKey]: remoteFailedAttempt
            };
        }
        const conflictRecord = buildManagedRemotePolicyConflictRecord({
            envelope: root,
            reason,
            transport,
            trustedLinkId,
            targetProfileId,
            scope,
            now
        });
        const nextManagedPolicyState = appendManagedRemotePolicyConflict(managedPolicyState, conflictRecord);
        const row = {
            rowId: `remote-managed-${normalizeString(context.transport) || 'nanah'}-${scope}-${revision || 'none'}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: normalizeString(root.sourceProfileId) || null,
            actorDeviceId: normalizeString(root.sourceDeviceId) || null,
            targetProfileId,
            trustedLinkId,
            actionType,
            scope,
            revision,
            policyHash,
            result,
            reason: accepted ? null : (reason || 'validation_failed'),
            receivedAt: now,
            issuedAt: normalizeNonNegativeInteger(root.issuedAt) || null,
            orderKey: `${String(revision || 0).padStart(6, '0')}:${now}`,
            summary: {
                ...summarizeManagedNanahPolicyEnvelope(root, decision),
                transport,
                mailboxItemId: normalizeString(context.mailboxItemId || decision?.mailboxItemId) || null,
                ...(remoteFailedAttempt ? {
                    remoteFailedAttempts: remoteFailedAttempt.failedAttempts,
                    remoteFailedAttemptLimit: remoteFailedAttempt.limit,
                    rateLimited: remoteFailedAttempt.rateLimited,
                    retryAt: remoteFailedAttempt.resetAt
                } : {})
            },
            sensitive: true
        };
        profiles[targetProfileId] = {
            ...profile,
            ...(remoteFailedAttempt || conflictRecord ? { managedPolicyState: nextManagedPolicyState } : {}),
            managedActionHistory: appendManagedActionHistoryRow(profile, row)
        };
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = {
            ...fresh,
            schemaVersion: 4,
            profiles
        };
        return true;
    }

    function isManagedChildEditFor(surface) {
        const targetSurface = surface === 'kids' ? 'kids' : 'main';
        return !!managedChildEdit && (managedChildEdit.surface ? managedChildEdit.surface === targetSurface : true);
    }

    function getManagedChildProfile() {
        const profiles = safeObject(profilesV4Cache?.profiles);
        const profileId = normalizeString(managedChildEdit?.profileId);
        return profileId ? profiles[profileId] : null;
    }

    function getManagedChildSettings(profile) {
        return clonePlain(safeObject(profile?.settings), {});
    }

    function buildManagedChildState(surface) {
        const profile = getManagedChildProfile();
        if (!profile) return null;
        const current = StateManager.getState() || {};
        const settings = getManagedChildSettings(profile);
        if (surface === 'kids') {
            return {
                ...current,
                ...settings,
                kids: getProfileSurface(profile, 'kids'),
                syncKidsToMain: settings.syncKidsToMain === true
            };
        }
        const main = getProfileSurface(profile, 'main');
        return {
            ...current,
            ...settings,
            mode: main.mode,
            keywords: main.keywords,
            userKeywords: main.keywords.filter(entry => entry?.source !== 'channel'),
            channels: main.channels,
            whitelistKeywords: main.whitelistKeywords,
            userWhitelistKeywords: main.whitelistKeywords.filter(entry => entry?.source !== 'channel'),
            whitelistChannels: main.whitelistChannels,
            contentFilters: clonePlain(settings.contentFilters, {}),
            categoryFilters: clonePlain(settings.categoryFilters, {}),
            syncKidsToMain: settings.syncKidsToMain === true
        };
    }

    async function saveManagedChildSurface(surface, mutator) {
        const profileId = normalizeString(managedChildEdit?.profileId);
        if (!profileId) return false;
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return false;
        }
        const fresh = await io.loadProfilesV4();
        const profiles = safeObject(fresh.profiles);
        const targetExists = Object.prototype.hasOwnProperty.call(profiles, profileId);
        const profile = safeObject(profiles[profileId]);
        if (!targetExists || profileId === 'default') {
            managedChildEdit = null;
            UIComponents.showToast('Managed protected profile target is no longer available', 'error');
            return false;
        }
        if (!canActiveProfileManageProfile(fresh, profileId)) {
            managedChildEdit = null;
            UIComponents.showToast('Switch to the master or parent account to edit this protected profile', 'error');
            return false;
        }
        const nextSurface = getProfileSurface(profile, surface);
        const result = await mutator(nextSurface, profile);
        if (result === false) return false;

        const nextProfile = setProfileSurface(profile, surface, nextSurface);
        const report = buildManagedChildLocalEditReport({
            actorProfileId: normalizeString(fresh.activeProfileId) || activeProfileId || 'default',
            targetProfileId: profileId,
            surface,
            priorProfile: profile,
            nextSurface
        });
        profiles[profileId] = recordManagedChildLocalEditHistory(nextProfile, report);
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        renderProfilesManager(profilesV4Cache);
        renderManagedChildEditorBanner();
        renderKeywords();
        renderChannels();
        renderKidsKeywords();
        renderKidsChannels();
        renderListModeControls();
        updateCheckboxes();
        try {
            const settings = safeObject(profile.settings);
            const applyMain = window.__filtertubeApplyMainContentControls;
            const applyKids = window.__filtertubeApplyKidsContentControls;
            if (surface === 'kids' && typeof applyKids === 'function') {
                applyKids(nextSurface.contentFilters || {}, nextSurface.categoryFilters || {});
            } else if (surface !== 'kids' && typeof applyMain === 'function') {
                applyMain(settings.contentFilters || {}, settings.categoryFilters || {});
            }
        } catch (e) {
        }
        updateStats();
        return true;
    }

    try {
        window.__filtertubeIsManagedChildEditFor = isManagedChildEditFor;
        window.__filtertubeBuildManagedChildState = buildManagedChildState;
        window.__filtertubeSaveManagedChildSurface = saveManagedChildSurface;
        window.__filtertubeRenderManagedChildEditorBanner = renderManagedChildEditorBanner;
    } catch (e) {
    }

    function isManagedChildEditorView(viewId) {
        return ['dashboard', 'filters', 'semantic', 'kids', 'settings', 'sync'].includes(normalizeString(viewId));
    }

    function isManagedChildEditActive() {
        return !!managedChildEdit && !!getManagedChildProfile();
    }

    function endManagedChildEdit() {
        managedChildEdit = null;
        renderManagedChildEditorBanner();
        renderKeywords();
        renderChannels();
        renderKidsKeywords();
        renderKidsChannels();
        renderListModeControls();
        updateCheckboxes();
        try {
            const state = StateManager.getState() || {};
            const applyMain = window.__filtertubeApplyMainContentControls;
            const applyKids = window.__filtertubeApplyKidsContentControls;
            if (typeof applyMain === 'function') applyMain(state.contentFilters || {}, state.categoryFilters || {});
            if (typeof applyKids === 'function') applyKids(state?.kids?.contentFilters || {}, state?.kids?.categoryFilters || {});
        } catch (e) {
        }
        if (typeof window.switchView === 'function') {
            window.switchView('sync');
        }
    }

    function renderManagedChildGlobalBanner() {
        const banner = document.getElementById('managedChildGlobalBanner');
        const currentNav = document.querySelector('.nav-item.active');
        const currentViewId = normalizeString(currentNav?.getAttribute('data-tab')) || 'dashboard';
        const active = !!managedChildEdit;
        const editorView = active && isManagedChildEditorView(currentViewId);
        const profile = active ? getManagedChildProfile() : null;
        document.body.classList.toggle('ft-managed-child-active', active && !!profile);
        document.body.classList.toggle('ft-managed-child-editor-view', editorView && !!profile);

        if (!banner) return;
        banner.innerHTML = '';
        banner.hidden = !editorView || !profile;
        if (!editorView || !profile) return;

        const colors = getProfileColors(normalizeString(managedChildEdit?.profileId));
        banner.style.setProperty('--ft-profile-accent', colors.accent || '');
        banner.style.setProperty('--ft-profile-accent-bg', colors.accentBg || '');
        banner.style.setProperty('--ft-profile-accent-border', colors.accentBorder || '');
        document.body.style.setProperty('--ft-profile-accent-border', colors.accentBorder || '');

        const copy = document.createElement('div');
        copy.className = 'ft-managed-child-global__copy';
        const title = document.createElement('strong');
        title.textContent = `Editing protected profile: ${normalizeString(profile.name) || 'Profile'}`;
        const body = document.createElement('span');
        body.textContent = currentViewId === 'sync'
            ? 'Accounts & Sync stays under the parent/account authority. Use this protected profile row or command center to pair devices, review history, and send parent-approved updates.'
            : 'Parent-managed profile edit mode. Dashboard, Filters, Kids Mode, Settings, and Semantic ML stay scoped to this protected profile where editing is supported.';
        copy.appendChild(title);
        copy.appendChild(body);

        const doneBtn = document.createElement('button');
        doneBtn.type = 'button';
        doneBtn.className = 'btn-primary';
        doneBtn.textContent = `Done editing ${normalizeString(profile.name) || 'profile'}`;
        doneBtn.addEventListener('click', endManagedChildEdit);

        banner.appendChild(copy);
        banner.appendChild(doneBtn);
    }

    function renderManagedChildSyncBoundary() {
        if (!managedChildSyncBoundary) return;
        managedChildSyncBoundary.innerHTML = '';
        const profile = getManagedChildProfile();
        const active = !!managedChildEdit && !!profile;
        managedChildSyncBoundary.hidden = !active;
        if (!active) return;

        const profileName = normalizeString(profile.name) || 'this profile';
        const copy = document.createElement('div');
        copy.className = 'ft-managed-child-sync-boundary__copy';
        const title = document.createElement('strong');
        title.textContent = `Protected edit session: ${profileName}`;
        const body = document.createElement('span');
        body.textContent = 'Family Controls targets this protected profile. Global account policy and Master PIN controls are paused until you finish editing, while device pairing and Send Update remain parent-owned.';
        copy.append(title, body);

        const chips = document.createElement('div');
        chips.className = 'ft-managed-child-sync-boundary__chips';
        [
            {
                label: 'Rules and time target protected profile',
                title: 'Edit Rules, Set Limit, History, Lists, and Send Update act through parent-managed controls.'
            },
            {
                label: 'Device trust stays parent-owned',
                title: 'Pairing or sending still requires the current parent/account authority.'
            },
            {
                label: 'Profile PIN is only a switch lock',
                title: 'A profile switching PIN does not grant parent/admin authority.'
            }
        ].forEach((item) => {
            const chip = document.createElement('span');
            chip.textContent = item.label;
            chip.title = item.title;
            chips.appendChild(chip);
        });

        managedChildSyncBoundary.append(copy, chips);
    }

    function renderManagedChildEditorBanner() {
        renderManagedChildGlobalBanner();
        renderManagedChildSyncBoundary();
        const ids = {
            main: ['managedChildFiltersBanner', 'managedChildFiltersChannelBanner', 'managedChildFiltersContentBanner'],
            kids: ['managedChildKidsBanner', 'managedChildKidsChannelBanner', 'managedChildKidsContentBanner']
        };
        const renderFor = (surface) => {
            ids[surface].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.innerHTML = '';
                el.hidden = true;
            });
        };
        renderFor('main');
        renderFor('kids');
        updateAdminPolicyControls();
        updateChildProfileCapabilityControls();
    }

    async function startManagedChildEdit(profileId, surface) {
        const targetId = normalizeString(profileId);
        const targetSurface = surface === 'kids' || surface === 'main' ? surface : '';
        const io = window.FilterTubeIO || {};
        if (!targetId || typeof io.loadProfilesV4 !== 'function') return;
        const fresh = await io.loadProfilesV4();
        if (targetId === 'default' || !Object.prototype.hasOwnProperty.call(safeObject(fresh.profiles), targetId)) {
            UIComponents.showToast('Managed editing is for protected profiles below the master account', 'error');
            return;
        }
        if (!canActiveProfileManageProfile(fresh, targetId)) {
            UIComponents.showToast('Switch to the master or parent account to edit this protected profile', 'error');
            return;
        }
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        const ok = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!ok) {
            await recordManagedAdminAuthFailureHistory(fresh, targetId, 'managed_child_edit_unlock_failed');
            return;
        }
        profilesV4Cache = fresh;
        managedChildEdit = targetSurface ? { profileId: targetId, surface: targetSurface } : { profileId: targetId };
        renderManagedChildEditorBanner();
        renderKeywords();
        renderChannels();
        renderKidsKeywords();
        renderKidsChannels();
        renderListModeControls();
        updateCheckboxes();
        try {
            const managedState = buildManagedChildState(targetSurface) || {};
            const applyMain = window.__filtertubeApplyMainContentControls;
            const applyKids = window.__filtertubeApplyKidsContentControls;
            if (targetSurface === 'kids' && typeof applyKids === 'function') {
                applyKids(managedState?.kids?.contentFilters || {}, managedState?.kids?.categoryFilters || {});
            } else if (typeof applyMain === 'function') {
                applyMain(managedState.contentFilters || {}, managedState.categoryFilters || {});
            }
        } catch (e) {
        }
        if (typeof window.switchView === 'function') {
            window.switchView(targetSurface === 'kids' ? 'kids' : 'dashboard');
        }
    }

    function updateAdminPolicyControls() {
        if (!ftAllowAccountCreation || !ftMaxAccounts) return;
        const profilesV4 = profilesV4Cache;
        const isAdmin = activeProfileId === 'default';
        const scopedProtectedEdit = isManagedChildEditActive();
        const scopedTitle = 'Finish protected-profile editing before changing global account policy.';
        ftAllowAccountCreation.disabled = !isAdmin || scopedProtectedEdit;
        ftMaxAccounts.disabled = !isAdmin || scopedProtectedEdit;
        ftAllowAccountCreation.title = scopedProtectedEdit ? scopedTitle : (!isAdmin ? 'Switch to Default to change account policy.' : '');
        ftMaxAccounts.title = scopedProtectedEdit ? scopedTitle : (!isAdmin ? 'Switch to Default to change account policy.' : '');

        if (!profilesV4) return;
        const policy = getAccountPolicy(profilesV4);
        ftAllowAccountCreation.checked = policy.allowAccountCreation === true;
        ftMaxAccounts.value = String(policy.maxAccounts || 0);
    }

    function updateChildProfileCapabilityControls() {
        const isChild = getActiveProfileType() === 'child';
        const scopedProtectedEdit = isManagedChildEditActive();
        const childTitle = 'Child profiles cannot manage backup, import/export, or account-admin actions here.';
        const scopedTitle = 'Finish protected-profile editing before changing global account, Master PIN, or create-profile controls.';
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
            const autoBackupEnabled = StateManager.getState()?.autoBackupEnabled === true;
            const locked = isUiLocked();
            ftAutoBackupMode.disabled = isChild || locked || !autoBackupEnabled;
            ftAutoBackupMode.title = isChild
                ? childTitle
                : (locked ? 'Unlock this profile to change auto-backup preferences.' : (autoBackupEnabled ? '' : 'Enable Auto Backup to change mode.'));
        }
        if (ftAutoBackupFormat) {
            const autoBackupEnabled = StateManager.getState()?.autoBackupEnabled === true;
            const locked = isUiLocked();
            ftAutoBackupFormat.disabled = isChild || locked || !autoBackupEnabled;
            ftAutoBackupFormat.title = isChild
                ? childTitle
                : (locked ? 'Unlock this profile to change auto-backup preferences.' : (autoBackupEnabled ? '' : 'Enable Auto Backup to change format.'));
        }
        if (ftCreateAccountBtn) {
            ftCreateAccountBtn.disabled = isChild || scopedProtectedEdit;
            ftCreateAccountBtn.title = isChild ? childTitle : (scopedProtectedEdit ? scopedTitle : '');
        }
        if (ftCreateChildBtn) {
            ftCreateChildBtn.disabled = isChild || scopedProtectedEdit;
            ftCreateChildBtn.title = isChild ? childTitle : (scopedProtectedEdit ? scopedTitle : '');
        }
        if (ftSetMasterPinBtn) {
            ftSetMasterPinBtn.disabled = isChild || scopedProtectedEdit;
            ftSetMasterPinBtn.title = isChild ? childTitle : (scopedProtectedEdit ? scopedTitle : '');
        }
        if (ftClearMasterPinBtn) {
            ftClearMasterPinBtn.disabled = isChild || scopedProtectedEdit;
            ftClearMasterPinBtn.title = isChild ? childTitle : (scopedProtectedEdit ? scopedTitle : '');
        }
        if (syncKidsToMainToggle) {
            syncKidsToMainToggle.disabled = isChild;
            syncKidsToMainToggle.title = isChild ? childTitle : '';
        }
    }

    function isChildProfileAdminSurface() {
        return getActiveProfileType() === 'child';
    }

    function isViewAllowedForCurrentAccess(viewId) {
        const normalized = normalizeString(viewId);
        if (getActiveProfileType() === 'child') {
            return CHILD_ALLOWED_VIEWS.has(normalized);
        }
        if (isUiLocked()) {
            return LOCK_ALLOWED_VIEWS.has(normalized);
        }
        return true;
    }

    function ensureNonChildAdminAction(message = 'Child profiles cannot manage this action here.') {
        if (!isChildProfileAdminSurface()) return true;
        UIComponents.showToast(message, 'error');
        return false;
    }

    async function updateProfileViewingAccess(profileId, patch) {
        const targetId = normalizeString(profileId);
        if (!targetId) return;
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }
        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot change viewing access', 'error');
            return;
        }
        const allowedManager = currentActive === targetId || canActiveProfileManageProfile(fresh, targetId);
        if (!allowedManager) {
            UIComponents.showToast('Switch to the parent account to change this profile', 'error');
            return;
        }
        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            await recordManagedAdminAuthFailureHistory(fresh, targetId, 'viewing_space_unlock_failed');
            return;
        }
        const profiles = safeObject(fresh.profiles);
        const profile = safeObject(profiles[targetId]);
        if (!profile || !profiles[targetId]) return;
        const settings = safeObject(profile.settings);
        const currentAccess = getProfileViewingAccess(profile);
        const nextMain = Object.prototype.hasOwnProperty.call(patch, 'main') ? patch.main === true : currentAccess.main;
        const nextKids = Object.prototype.hasOwnProperty.call(patch, 'kids') ? patch.kids === true : currentAccess.kids;
        if (!nextMain && !nextKids) {
            UIComponents.showToast('A profile needs at least one viewing space', 'error');
            return;
        }
        let nextProfile = {
            ...profile,
            settings: {
                ...settings,
                allowMainViewing: nextMain,
                allowKidsViewing: nextKids
            }
        };
        if (targetId !== 'default' && currentActive !== targetId && canActiveProfileManageProfile(fresh, targetId)) {
            const report = buildManagedViewingSpaceLocalEditReport({
                actorProfileId: currentActive,
                targetProfileId: targetId,
                priorProfile: profile,
                nextAccess: {
                    allowMainViewing: nextMain,
                    allowKidsViewing: nextKids,
                    defaultLaunchTarget: settings.defaultLaunchTarget
                }
            });
            nextProfile = recordManagedChildLocalEditHistory(nextProfile, report);
        }
        profiles[targetId] = nextProfile;
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await refreshProfilesUI();
        UIComponents.showToast('Viewing access updated', 'success');
        if (targetId !== 'default' && currentActive !== targetId && canActiveProfileManageProfile(fresh, targetId)) {
            await offerManagedPolicyPushForChangedProfiles([targetId], {
                scope: 'viewing_space',
                title: 'Send viewing access update now?',
                label: 'viewing access'
            });
        }
    }

    function managedViewingAccessPatchForMode(accessMode) {
        const mode = normalizeString(accessMode).toLowerCase();
        if (mode === 'main_kids' || mode === 'allow_main_kids' || mode === 'both') {
            return { allowMainViewing: true, allowKidsViewing: true, label: 'Main + Kids' };
        }
        if (mode === 'kids_only') {
            return { allowMainViewing: false, allowKidsViewing: true, label: 'Kids only' };
        }
        if (mode === 'main_only') {
            return { allowMainViewing: true, allowKidsViewing: false, label: 'Main only' };
        }
        return null;
    }

    async function updateMultipleProfileViewingAccess(profileIds, accessMode) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        const patch = managedViewingAccessPatchForMode(accessMode);
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        if (!patch) {
            UIComponents.showToast('Choose a valid viewing-space policy', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot change viewing access', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'bulk_viewing_space_unlock_failed');
            }
            return;
        }

        let changedCount = 0;
        const changedProfileIds = [];
        for (const targetId of eligibleIds) {
            const profile = safeObject(profiles[targetId]);
            const settings = safeObject(profile.settings);
            if (
                settings.allowMainViewing === patch.allowMainViewing
                && settings.allowKidsViewing === patch.allowKidsViewing
            ) {
                continue;
            }
            const nextProfile = {
                ...profile,
                settings: {
                    ...settings,
                    allowMainViewing: patch.allowMainViewing,
                    allowKidsViewing: patch.allowKidsViewing
                }
            };
            const report = buildManagedViewingSpaceLocalEditReport({
                actorProfileId: currentActive,
                targetProfileId: targetId,
                priorProfile: profile,
                nextAccess: {
                    allowMainViewing: patch.allowMainViewing,
                    allowKidsViewing: patch.allowKidsViewing,
                    defaultLaunchTarget: settings.defaultLaunchTarget
                }
            });
            profiles[targetId] = recordManagedChildLocalEditHistory(nextProfile, report);
            changedCount += 1;
            changedProfileIds.push(targetId);
        }

        if (!changedCount) {
            UIComponents.showToast('Selected profiles already use that viewing access', 'info');
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await refreshProfilesUI();
        UIComponents.showToast(`${changedCount} profiles set to ${patch.label}`, 'success');
        await offerManagedPolicyPushForChangedProfiles(changedProfileIds, {
            scope: 'viewing_space',
            title: 'Send viewing access update now?',
            label: 'viewing access'
        });
    }

    async function promptManagedTimeLimitMinutes({
        title,
        message,
        presets = [],
        customTitle = 'Custom YouTube Time Limit',
        customMessage = 'Enter whole minutes for this daily YouTube budget.',
        customPlaceholder = 'Minutes per day',
        customConfirmText = 'Use Custom Limit',
        initialMinutes = 120,
        allowZero = true,
        errorMessage = 'Enter whole minutes, 0 or higher'
    } = {}) {
        const presetChoices = safeArray(presets)
            .map((preset) => ({
                value: normalizeString(preset.value),
                label: normalizeString(preset.label),
                className: preset.className
            }))
            .filter((preset) => preset.value && preset.label);
        const choice = await showChoiceModal({
            title: title || 'Set YouTube Time Limit',
            message: message || 'Choose a daily YouTube budget for this protected profile.',
            choices: [
                ...presetChoices,
                {
                    value: 'custom',
                    label: 'Custom minutes',
                    className: 'btn-secondary'
                }
            ],
            cancelText: 'Cancel'
        });
        if (choice === null) return null;
        if (choice !== 'custom') {
            const presetMinutes = normalizeNonNegativeInteger(choice);
            if (presetMinutes == null || (!allowZero && presetMinutes <= 0)) {
                UIComponents.showToast(errorMessage, 'error');
                return null;
            }
            return presetMinutes;
        }

        const rawMinutes = await showPromptModal({
            title: customTitle,
            message: customMessage,
            placeholder: customPlaceholder,
            inputType: 'number',
            confirmText: customConfirmText,
            initialValue: String(Math.max(0, normalizeNonNegativeInteger(initialMinutes) || 0))
        });
        if (rawMinutes === null) return null;
        const minutes = normalizeNonNegativeInteger(rawMinutes);
        if (minutes == null || (!allowZero && minutes <= 0)) {
            UIComponents.showToast(errorMessage, 'error');
            return null;
        }
        return minutes;
    }

    async function promptManagedDailyTimeLimitMinutes({ selectedCount = 1, initialMinutes = 120 } = {}) {
        return promptManagedTimeLimitMinutes({
            title: 'Set YouTube Time Limit',
            message: selectedCount > 1
                ? 'Choose the same daily YouTube budget for selected protected profiles. Use 0 minutes to require parent approval before viewing.'
                : 'Choose the daily YouTube budget for this protected profile. Use 0 minutes to require parent approval before viewing.',
            presets: [
                { value: '30', label: '30 min', className: 'btn-secondary' },
                { value: '60', label: '1 hour', className: 'btn-secondary' },
                { value: '120', label: '2 hours', className: 'btn-primary' },
                { value: '0', label: 'Require approval', className: 'btn-secondary' }
            ],
            customTitle: selectedCount > 1 ? 'Custom Selected Time Limit' : 'Custom YouTube Time Limit',
            customMessage: selectedCount > 1
                ? 'Daily YouTube minutes for selected protected profiles. Use 0 to require parent approval before viewing.'
                : 'Daily YouTube minutes for this profile. Use 0 to require parent approval before viewing.',
            customPlaceholder: 'Minutes per day',
            customConfirmText: selectedCount > 1 ? 'Save Limits' : 'Save Limit',
            initialMinutes,
            allowZero: true,
            errorMessage: 'Enter whole minutes, 0 or higher'
        });
    }

    async function updateProfileTimeLimitPolicy(profileId, action) {
        const targetId = normalizeString(profileId);
        if (!targetId) return;
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }
        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot change time limits', 'error');
            return;
        }
        if (!canActiveProfileManageProfile(fresh, targetId)) {
            UIComponents.showToast('Switch to the parent account to change this profile', 'error');
            return;
        }
        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            await recordManagedAdminAuthFailureHistory(fresh, targetId, 'time_limit_unlock_failed');
            return;
        }

        const profiles = safeObject(fresh.profiles);
        const profile = safeObject(profiles[targetId]);
        if (!profile || !profiles[targetId]) return;
        const settings = safeObject(profile.settings);
        const existingPolicy = getManagedTimeLimitPolicy(profile);

        let enabled = true;
        let budgetSeconds = existingPolicy?.dailyBudgetSeconds || 7200;
        if (action === 'disable') {
            enabled = false;
        } else {
            const currentMinutes = Math.max(0, Math.floor((existingPolicy?.dailyBudgetSeconds || 7200) / 60));
            const minutes = await promptManagedDailyTimeLimitMinutes({
                selectedCount: 1,
                initialMinutes: currentMinutes
            });
            if (minutes === null) return;
            budgetSeconds = minutes * 60;
        }

        const nextPolicy = buildManagedTimeLimitPolicy(existingPolicy, {
            enabled,
            dailyBudgetSeconds: budgetSeconds
        });
        if (!nextPolicy) {
            UIComponents.showToast('Time limit policy could not be saved', 'error');
            return;
        }

        const nextProfile = {
            ...profile,
            settings: {
                ...settings,
                timeLimitPolicy: nextPolicy
            }
        };
        const report = buildManagedTimeLimitLocalEditReport({
            actorProfileId: currentActive,
            targetProfileId: targetId,
            nextPolicy
        });
        profiles[targetId] = recordManagedChildLocalEditHistory(nextProfile, report);
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await refreshProfilesUI();
        UIComponents.showToast(enabled ? 'Time limit updated' : 'Time limit disabled', 'success');
        await offerManagedTimeLimitPushForChangedProfiles([targetId]);
    }

    async function updateMultipleProfileTimeLimitPolicies(profileIds, action) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot change time limits', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'bulk_time_limit_unlock_failed');
            }
            return;
        }

        const enabled = action !== 'disable';
        let budgetSeconds = 7200;
        if (enabled) {
            const firstPolicy = getManagedTimeLimitPolicy(profiles[eligibleIds[0]]);
            const currentMinutes = Math.max(0, Math.floor((firstPolicy?.dailyBudgetSeconds || 7200) / 60));
            const minutes = await promptManagedDailyTimeLimitMinutes({
                selectedCount: eligibleIds.length,
                initialMinutes: currentMinutes
            });
            if (minutes === null) return;
            budgetSeconds = minutes * 60;
        }

        let changedCount = 0;
        const changedProfileIds = [];
        for (const targetId of eligibleIds) {
            const profile = safeObject(profiles[targetId]);
            const existingPolicy = getManagedTimeLimitPolicy(profile);
            if (!enabled && !existingPolicy) continue;
            const nextPolicy = buildManagedTimeLimitPolicy(existingPolicy, {
                enabled,
                dailyBudgetSeconds: enabled ? budgetSeconds : (existingPolicy?.dailyBudgetSeconds || 0)
            });
            if (!nextPolicy) continue;
            const nextProfile = {
                ...profile,
                settings: {
                    ...safeObject(profile.settings),
                    timeLimitPolicy: nextPolicy
                }
            };
            const report = buildManagedTimeLimitLocalEditReport({
                actorProfileId: currentActive,
                targetProfileId: targetId,
                nextPolicy
            });
            profiles[targetId] = recordManagedChildLocalEditHistory(nextProfile, report);
            changedCount += 1;
            changedProfileIds.push(targetId);
        }

        if (!changedCount) {
            UIComponents.showToast(enabled ? 'No selected profiles changed' : 'No selected profiles had active limits', 'info');
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await refreshProfilesUI();
        UIComponents.showToast(
            enabled
                ? `${changedCount} time limits updated`
                : `${changedCount} time limits disabled`,
            'success'
        );
        await offerManagedTimeLimitPushForChangedProfiles(changedProfileIds);
    }

    async function promptManagedExtraTimeMinutes({ selectedCount = 1 } = {}) {
        return promptManagedTimeLimitMinutes({
            title: selectedCount > 1 ? 'Add Time To Selected Profiles' : 'Add Extra YouTube Time',
            message: 'Choose temporary parent-approved YouTube time. The grant expires automatically in 2 hours.',
            presets: [
                { value: '15', label: '15 min', className: 'btn-primary' },
                { value: '30', label: '30 min', className: 'btn-secondary' },
                { value: '60', label: '1 hour', className: 'btn-secondary' }
            ],
            customTitle: selectedCount > 1 ? 'Custom Extra Time For Selected Profiles' : 'Custom Extra YouTube Time',
            customMessage: 'Extra parent-approved YouTube minutes. The grant expires automatically in 2 hours.',
            customPlaceholder: 'Extra minutes',
            customConfirmText: 'Add Time',
            initialMinutes: 15,
            allowZero: false,
            errorMessage: 'Enter whole extra minutes greater than 0'
        });
    }

    async function offerManagedTimeLimitPushForChangedProfiles(profileIds) {
        return offerManagedPolicyPushForChangedProfiles(profileIds, {
            scope: 'time_limits',
            title: 'Send time-limit update now?',
            label: 'time-limit policy'
        });
    }

    async function offerManagedPolicyPushForChangedProfiles(profileIds, { scope, title, label }) {
        const changedProfileIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!changedProfileIds.length) return;
        const normalizedScope = normalizeString(scope).toLowerCase();
        if (!normalizedScope) return;
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyProfileCount = changedProfileIds.filter((targetId) => {
            const profile = safeObject(safeObject(profilesV4Cache).profiles)[targetId];
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, normalizedScope, profile);
            if (!links.length) return false;
            return links.some(isNanahManagedLinkLiveConnected) || mailboxReady || localReady;
        }).length;
        if (readyProfileCount <= 0) return;

        const sendNow = await showConfirmModal({
            title: title || 'Send managed update now?',
            message: `${readyProfileCount} changed ${readyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path. Send this ${normalizeString(label) || normalizedScope} update to those devices now.`,
            confirmText: 'Send update',
            cancelText: 'Not now'
        });
        if (sendNow) {
            await sendManagedParentPolicyToVerifiedDevices(changedProfileIds, { scope: normalizedScope });
        }
    }

    async function grantExtraTimeToProfiles(profileIds) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot grant extra time', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId)
                && getManagedTimeLimitPolicy(profile)?.enabled === true;
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('Select protected profiles with active time limits first', 'error');
            return;
        }

        const minutes = await promptManagedExtraTimeMinutes({ selectedCount: eligibleIds.length });
        if (minutes == null) return;

        const confirmGrant = await showConfirmModal({
            title: `Grant ${minutes} extra minute${minutes === 1 ? '' : 's'}?`,
            message: `This will add temporary parent-approved YouTube time to ${eligibleIds.length} protected ${eligibleIds.length === 1 ? 'profile' : 'profiles'} after parent/account re-auth. The grant expires in 2 hours.`,
            confirmText: 'Grant time',
            cancelText: 'Cancel'
        });
        if (!confirmGrant) return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'extra_time_unlock_failed');
            }
            return;
        }

        const now = Date.now();
        const grant = {
            enabled: true,
            extraSeconds: minutes * 60,
            expiresAt: now + (2 * 60 * 60 * 1000),
            reason: 'parent_grant'
        };
        const changedProfileIds = [];
        for (const targetId of eligibleIds) {
            const profile = safeObject(profiles[targetId]);
            const existingPolicy = getManagedTimeLimitPolicy(profile);
            if (!existingPolicy?.enabled) continue;
            const nextPolicy = buildManagedTimeLimitPolicy(existingPolicy, {
                enabled: true,
                dailyBudgetSeconds: existingPolicy.dailyBudgetSeconds,
                parentGrant: grant
            });
            if (!nextPolicy) continue;
            const nextProfile = {
                ...profile,
                settings: {
                    ...safeObject(profile.settings),
                    timeLimitPolicy: nextPolicy
                }
            };
            const report = buildManagedTimeLimitLocalEditReport({
                actorProfileId: currentActive,
                targetProfileId: targetId,
                nextPolicy
            });
            profiles[targetId] = recordManagedChildLocalEditHistory(nextProfile, report);
            changedProfileIds.push(targetId);
        }

        if (!changedProfileIds.length) {
            UIComponents.showToast('No selected profiles changed', 'info');
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await refreshProfilesUI();
        UIComponents.showToast(`${changedProfileIds.length} extra-time ${changedProfileIds.length === 1 ? 'grant' : 'grants'} added`, 'success');
        await offerManagedTimeLimitPushForChangedProfiles(changedProfileIds);
    }

    function managedRuleListKeyFor(surface, ruleType, target) {
        const mode = safeObject(target).mode === 'whitelist' ? 'whitelist' : 'blocklist';
        if (ruleType === 'video') return 'videoIds';
        if (ruleType === 'channel') {
            if (surface === 'kids') return mode === 'whitelist' ? 'whitelistChannels' : 'blockedChannels';
            return mode === 'whitelist' ? 'whitelistChannels' : 'channels';
        }
        if (surface === 'kids') return mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords';
        return mode === 'whitelist' ? 'whitelistKeywords' : 'keywords';
    }

    function normalizeManagedVideoIdInput(input) {
        const raw = normalizeString(input);
        if (!raw) return '';
        const bare = raw.match(/^[a-zA-Z0-9_-]{11}$/);
        if (bare) return raw;
        try {
            const withProtocol = raw.startsWith('http://') || raw.startsWith('https://')
                ? raw
                : (raw.startsWith('youtu.be/') || raw.startsWith('youtube.com/') || raw.startsWith('www.youtube.com/')
                    ? `https://${raw}`
                    : raw);
            const url = new URL(withProtocol);
            const host = url.hostname.replace(/^www\./i, '').toLowerCase();
            const watchId = url.searchParams.get('v');
            if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) return watchId;
            if (host === 'youtu.be') {
                const id = url.pathname.split('/').filter(Boolean)[0] || '';
                if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
            }
            const parts = url.pathname.split('/').filter(Boolean);
            const markerIndex = parts.findIndex(part => part === 'shorts' || part === 'embed' || part === 'watch');
            if (markerIndex >= 0) {
                const id = parts[markerIndex + 1] || '';
                if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
            }
        } catch (e) {
        }
        const fallback = raw.match(/(?:v=|shorts\/|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
        return fallback ? fallback[1] : '';
    }

    function addManagedRuleToSurface(target, surface, ruleType, value) {
        const item = safeObject(target);
        const type = ruleType === 'video' ? 'video' : (ruleType === 'channel' ? 'channel' : 'keyword');
        const listKey = managedRuleListKeyFor(surface, type, item);
        const list = Array.isArray(item[listKey]) ? item[listKey] : [];

        if (type === 'video') {
            const videoId = normalizeManagedVideoIdInput(value);
            if (!videoId) return { changed: false, error: 'invalid_video' };
            const exists = list.some(row => normalizeString(row) === videoId);
            if (exists) return { changed: false, duplicate: true };
            item[listKey] = [videoId, ...list];
            return { changed: true };
        }

        if (type === 'channel') {
            const channel = normalizeProfileChannel(value);
            if (!channel) return { changed: false, error: 'invalid_channel' };
            const key = normalizeString(channel.id || channel.handle || channel.customUrl || channel.name).toLowerCase();
            const exists = list.some(row => normalizeString(row?.id || row?.handle || row?.customUrl || row?.name).toLowerCase() === key);
            if (exists) return { changed: false, duplicate: true };
            item[listKey] = [channel, ...list];
            return { changed: true };
        }

        const entry = normalizeProfileKeyword(value, { comments: surface !== 'kids' });
        if (!entry) return { changed: false, error: 'invalid_keyword' };
        const lower = entry.word.toLowerCase();
        const exists = list.some(row => normalizeString(row?.word).toLowerCase() === lower);
        if (exists) return { changed: false, duplicate: true };
        item[listKey] = [entry, ...list];
        return { changed: true };
    }

    async function promptManagedBulkRuleSurface(ruleType) {
        const type = ruleType === 'video' ? 'video' : (ruleType === 'channel' ? 'channel' : 'keyword');
        const surface = await showChoiceModal({
            title: type === 'video'
                ? 'Add Video ID To Selected Profiles'
                : (type === 'channel' ? 'Add Channel To Selected Profiles' : 'Add Keyword To Selected Profiles'),
            message: 'Choose where this rule should be applied. FilterTube will use each protected profile surface current Blocklist/Whitelist mode.',
            choices: [
                {
                    value: 'main',
                    label: 'YouTube Main',
                    className: 'btn-primary'
                },
                {
                    value: 'kids',
                    label: 'YouTube Kids',
                    className: 'btn-secondary'
                }
            ],
            cancelText: 'Cancel'
        });
        return surface === 'kids' ? 'kids' : (surface === 'main' ? 'main' : null);
    }

    async function promptManagedBulkRuleValue(ruleType) {
        const type = ruleType === 'video' ? 'video' : (ruleType === 'channel' ? 'channel' : 'keyword');
        const rawValue = await showPromptModal({
            title: type === 'video' ? 'Video ID To Add' : (type === 'channel' ? 'Channel To Add' : 'Keyword To Add'),
            message: type === 'video'
                ? 'Paste a YouTube watch/Shorts URL or an 11-character video ID.'
                : (type === 'channel'
                    ? 'Use @handle, Channel ID, c/ChannelName, user/ChannelName, or a YouTube URL.'
                    : 'Enter the keyword to add to selected protected profiles.'),
            placeholder: type === 'video' ? 'watch URL or video ID' : (type === 'channel' ? '@channel or UC...' : 'keyword'),
            confirmText: type === 'video' ? 'Add Video' : (type === 'channel' ? 'Add Channel' : 'Add Keyword')
        });
        if (rawValue === null) return null;
        return normalizeString(rawValue);
    }

    function managedBulkRuleTypeLabel(ruleType) {
        const type = ruleType === 'video' ? 'video' : (ruleType === 'channel' ? 'channel' : 'keyword');
        if (type === 'video') return 'video ID';
        if (type === 'channel') return 'channel';
        return 'keyword';
    }

    function managedBulkRuleRemoteScope(ruleType) {
        const type = ruleType === 'video' ? 'video' : (ruleType === 'channel' ? 'channel' : 'keyword');
        if (type === 'video') return 'videos';
        if (type === 'channel') return 'channels';
        return 'keywords';
    }

    function buildManagedChannelListId(name, text) {
        const source = `${normalizeString(name)}\n${normalizeString(text)}`;
        return `managed-list-${hashManagedChannelListSource(source)}`;
    }

    function hashManagedChannelListSource(source) {
        const input = normalizeString(source);
        let hash = 2166136261;
        for (let i = 0; i < input.length; i += 1) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36);
    }

    function buildManagedChannelListContentHash(text) {
        return `fnv1a:${hashManagedChannelListSource(text)}`;
    }

    function normalizeManagedChannelListSourceUrl(rawValue) {
        const raw = normalizeString(rawValue);
        if (!raw) return '';
        const candidate = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
        try {
            const url = new URL(candidate);
            if (url.protocol !== 'https:') return '';
            url.username = '';
            url.password = '';
            if (url.hostname.replace(/^www\./i, '').toLowerCase() === 'github.com') {
                const parts = url.pathname.split('/').filter(Boolean);
                if (parts.length >= 5 && parts[2] === 'blob') {
                    const rawUrl = new URL(`https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts[3]}/${parts.slice(4).join('/')}`);
                    return rawUrl.toString();
                }
            }
            return url.toString();
        } catch (e) {
            return '';
        }
    }

    function managedChannelListSourceLabelFromUrl(sourceUrl) {
        const normalized = normalizeManagedChannelListSourceUrl(sourceUrl);
        if (!normalized) return 'List URL';
        try {
            const url = new URL(normalized);
            const parts = url.pathname.split('/').filter(Boolean);
            const tail = parts.slice(-2).join('/');
            return tail ? `${url.hostname}/${tail}` : url.hostname;
        } catch (e) {
            return 'List URL';
        }
    }

    async function fetchManagedChannelListSourceUrl(rawUrl) {
        const url = normalizeManagedChannelListSourceUrl(rawUrl);
        if (!url) {
            throw new Error('Enter a public HTTPS text URL.');
        }
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeout = controller ? setTimeout(() => controller.abort(), 15000) : null;
        try {
            const response = await fetch(url, {
                cache: 'no-store',
                credentials: 'omit',
                signal: controller?.signal
            });
            if (!response.ok) {
                throw new Error(`Unable to load list (${response.status})`);
            }
            const length = Number(response.headers.get('content-length')) || 0;
            if (length > 1024 * 1024) {
                throw new Error('List is too large. Use a smaller text file.');
            }
            const text = await response.text();
            if (text.length > 1024 * 1024) {
                throw new Error('List is too large. Use a smaller text file.');
            }
            return {
                url,
                text,
                sourceLabel: managedChannelListSourceLabelFromUrl(url)
            };
        } catch (error) {
            if (error?.name === 'AbortError') {
                throw new Error('List URL took too long to respond.');
            }
            throw error;
        } finally {
            if (timeout) clearTimeout(timeout);
        }
    }

    function extractManagedChannelListUrlToken(rawValue) {
        const raw = normalizeString(rawValue);
        if (!raw) return '';
        const candidate = raw.startsWith('http://') || raw.startsWith('https://')
            ? raw
            : (/^(www\.)?youtube\.com\//i.test(raw) || /^m\.youtube\.com\//i.test(raw)
                ? `https://${raw}`
                : raw);
        try {
            const url = new URL(candidate);
            const host = url.hostname.replace(/^www\./i, '').toLowerCase();
            if (!['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) return '';
            const parts = url.pathname.split('/').filter(Boolean);
            if (!parts.length) return '';
            const first = decodeURIComponent(parts[0] || '');
            const second = decodeURIComponent(parts[1] || '');
            if (first === 'channel' && /^UC[a-zA-Z0-9_-]+$/.test(second)) return second;
            if (/^@[A-Za-z0-9._-]+$/.test(first)) return first;
            if ((first === 'c' || first === 'user') && second) return `${first}/${second}`;
        } catch (e) {
        }
        return '';
    }

    function extractManagedChannelListToken(line) {
        const raw = normalizeString(line);
        if (!raw) return '';
        if (/^(#|!|\/\/|\[)/.test(raw)) return '';

        const urlMatch = raw.match(/https?:\/\/[^\s,;'"<>]+|(?:www\.)?youtube\.com\/[^\s,;'"<>]+|m\.youtube\.com\/[^\s,;'"<>]+/i);
        if (urlMatch) {
            const urlToken = extractManagedChannelListUrlToken(urlMatch[0]);
            if (urlToken) return urlToken;
        }

        const ucMatch = raw.match(/(?:^|[\s,;'"(])(?:channel\/)?(UC[a-zA-Z0-9_-]{12,})(?=$|[\s,;)'"])/);
        if (ucMatch) return ucMatch[1];

        const handleMatch = raw.match(/(?:^|[\s,;'"(])(@[A-Za-z0-9._-]{2,})(?=$|[\s,;)'"])/);
        if (handleMatch) return handleMatch[1];

        const customMatch = raw.match(/(?:^|[\s,;'"(\/])((?:c|user)\/[A-Za-z0-9._%-]+)(?=$|[\s,;)'"])/i);
        if (customMatch) return customMatch[1].replace(/^\/+/, '');

        return normalizeProfileChannel(raw) ? raw : '';
    }

    function managedChannelEntryKey(channel) {
        return normalizeString(channel?.id || channel?.handle || channel?.customUrl || channel?.originalInput || channel?.name)
            .toLowerCase();
    }

    function isManagedChannelListRowPaused(row) {
        return !!(row && typeof row === 'object' && row.managedListPaused === true);
    }

    function normalizeManagedChannelListMetadataValue(value, maxLength = 160) {
        const normalized = normalizeString(value).replace(/\s+/g, ' ');
        return normalized ? normalized.slice(0, maxLength) : '';
    }

    function normalizeManagedChannelListSourceFormat(value) {
        const normalized = normalizeString(value).toLowerCase();
        const allowed = new Set([
            'plain_text_rows',
            'typed_text_rows',
            'csv_like_text_rows',
            'csv_channel_keyword_rows',
            'simple_json_array',
            'simple_json_object_channels',
            'blocktube_json_rules',
            'public_https_text_or_json_url'
        ]);
        return allowed.has(normalized) ? normalized : '';
    }

    function formatManagedChannelListSourceFormat(value) {
        const normalized = normalizeManagedChannelListSourceFormat(value);
        if (normalized === 'simple_json_array' || normalized === 'simple_json_object_channels') return 'JSON';
        if (normalized === 'blocktube_json_rules') return 'BlockTube JSON';
        if (normalized === 'public_https_text_or_json_url') return 'URL source';
        if (normalized === 'csv_channel_keyword_rows') return 'CSV rules';
        if (normalized === 'typed_text_rows') return 'TXT rules';
        if (normalized === 'csv_like_text_rows') return 'CSV-like text';
        if (normalized === 'plain_text_rows') return 'text list';
        return '';
    }

    function splitManagedChannelListCsvRow(line) {
        const cells = [];
        let current = '';
        let quoted = false;
        const raw = String(line || '');
        for (let i = 0; i < raw.length; i += 1) {
            const ch = raw[i];
            if (ch === '"') {
                if (quoted && raw[i + 1] === '"') {
                    current += '"';
                    i += 1;
                } else {
                    quoted = !quoted;
                }
                continue;
            }
            if (ch === ',' && !quoted) {
                cells.push(current.trim());
                current = '';
                continue;
            }
            current += ch;
        }
        cells.push(current.trim());
        return cells;
    }

    function normalizeManagedChannelListCsvHeader(value) {
        return normalizeString(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
    }

    function parseManagedChannelKeywordCsv(text, { listName = '' } = {}) {
        const lines = normalizeString(text).split(/\r?\n/);
        const dataLines = lines.filter((line) => {
            const trimmed = normalizeString(line);
            return trimmed && !/^(#|!|\/\/|\[)/.test(trimmed);
        });
        if (!dataLines.length || !dataLines[0].includes(',')) return null;

        const headers = splitManagedChannelListCsvRow(dataLines[0]).map(normalizeManagedChannelListCsvHeader);
        const channelIndexes = [];
        const keywordIndexes = [];
        const typeIndexes = [];
        const valueIndexes = [];
        headers.forEach((header, index) => {
            if (['channel', 'channelid', 'channelurl', 'youtubeurl', 'url', 'handle', 'ucid'].includes(header)) {
                channelIndexes.push(index);
            }
            if (['keyword', 'keywords', 'term', 'terms', 'phrase', 'phrases'].includes(header)) {
                keywordIndexes.push(index);
            }
            if (['type', 'kind', 'ruletype'].includes(header)) {
                typeIndexes.push(index);
            }
            if (['value', 'rule', 'entry'].includes(header)) {
                valueIndexes.push(index);
            }
        });
        const hasTypedValueRows = typeIndexes.length > 0 && valueIndexes.length > 0;
        if (!channelIndexes.length && !keywordIndexes.length && !hasTypedValueRows) return null;

        const listId = buildManagedChannelListId(listName || 'Imported list', text);
        const seenChannels = new Set();
        const seenKeywords = new Set();
        const channels = [];
        const keywords = [];
        let skippedCount = 0;
        const addChannelToken = (token) => {
            const extracted = extractManagedChannelListToken(token);
            if (!extracted) return false;
            const channel = normalizeProfileChannel(extracted);
            if (!channel) return false;
            const key = managedChannelEntryKey(channel);
            if (!key || seenChannels.has(key)) return false;
            seenChannels.add(key);
            channels.push({
                ...channel,
                source: 'managed_channel_list',
                managedListId: listId,
                managedListName: normalizeString(listName) || 'Imported rule list'
            });
            return true;
        };
        const addKeywordToken = (token) => {
            const keyword = normalizeProfileKeyword(token, { comments: true });
            if (!keyword) return false;
            const key = normalizeString(keyword.word).toLowerCase();
            if (!key || seenKeywords.has(key)) return false;
            seenKeywords.add(key);
            keywords.push({
                ...keyword,
                source: 'managed_channel_list',
                managedListId: listId,
                managedListName: normalizeString(listName) || 'Imported rule list'
            });
            return true;
        };

        dataLines.slice(1).forEach((line) => {
            const cells = splitManagedChannelListCsvRow(line);
            let rowAccepted = false;
            channelIndexes.forEach((index) => {
                if (addChannelToken(cells[index])) rowAccepted = true;
            });
            keywordIndexes.forEach((index) => {
                if (addKeywordToken(cells[index])) rowAccepted = true;
            });
            if (hasTypedValueRows) {
                typeIndexes.forEach((typeIndex) => {
                    const type = normalizeManagedChannelListCsvHeader(cells[typeIndex]);
                    valueIndexes.forEach((valueIndex) => {
                        const value = cells[valueIndex];
                        if (['channel', 'channels', 'channelid', 'handle', 'url'].includes(type)) {
                            if (addChannelToken(value)) rowAccepted = true;
                            return;
                        }
                        if (['keyword', 'keywords', 'term', 'terms', 'phrase', 'phrases'].includes(type)) {
                            if (addKeywordToken(value)) rowAccepted = true;
                        }
                    });
                });
            }
            if (!rowAccepted) skippedCount += 1;
        });

        return {
            listId,
            contentHash: buildManagedChannelListContentHash(text),
            sourceFormat: 'csv_channel_keyword_rows',
            sourceMetadata: parseManagedChannelListSourceMetadata(text),
            channels,
            keywords,
            skippedCount,
            totalLineCount: dataLines.length > 0 ? dataLines.length - 1 : 0
        };
    }

    function parseManagedChannelListSourceMetadata(rawText) {
        const result = {};
        normalizeString(rawText).split(/\r?\n/).slice(0, 120).forEach((line) => {
            const trimmed = normalizeString(line);
            if (!trimmed || !/^(#|!|\/\/)/.test(trimmed)) return;
            const body = normalizeString(trimmed.replace(/^(#|!|\/\/)+\s*/, ''));
            const match = body.match(/^([A-Za-z][A-Za-z -]{1,32})\s*:\s*(.+)$/);
            if (!match) return;
            const key = match[1].toLowerCase().replace(/[^a-z]/g, '');
            const value = normalizeManagedChannelListMetadataValue(match[2]);
            if (!value) return;
            if (key === 'title' && !result.title) result.title = value;
            if (key === 'description' && !result.description) result.description = value;
            if ((key === 'homepage' || key === 'home') && !result.homepage) result.homepage = value;
            if (key === 'license' && !result.license) result.license = value;
            if ((key === 'version' || key === 'revision') && !result.sourceVersion) result.sourceVersion = value;
            if ((key === 'lastmodified' || key === 'updated' || key === 'lastupdated') && !result.sourceUpdatedLabel) {
                result.sourceUpdatedLabel = value;
            }
        });
        return result;
    }

    function normalizeManagedChannelListJsonMetadata(root) {
        const item = safeObject(root);
        return {
            title: normalizeManagedChannelListMetadataValue(item.title || item.name || item.listName),
            description: normalizeManagedChannelListMetadataValue(item.description),
            homepage: normalizeManagedChannelListMetadataValue(item.homepage || item.home || item.sourceHomepage, 240),
            license: normalizeManagedChannelListMetadataValue(item.license),
            sourceVersion: normalizeManagedChannelListMetadataValue(item.version || item.revision || item.sourceVersion),
            sourceUpdatedLabel: normalizeManagedChannelListMetadataValue(item.lastModified || item.lastUpdated || item.updated || item.sourceUpdatedLabel)
        };
    }

    function getManagedChannelListJsonItems(root) {
        if (Array.isArray(root)) return root;
        const item = safeObject(root);
        const filterData = safeObject(item.filterData);
        if (Array.isArray(filterData.channelId) || Array.isArray(filterData.channelName)) {
            return [
                ...safeArray(filterData.channelId),
                ...safeArray(filterData.channelName)
            ];
        }
        const candidateKeys = [
            'channels',
            'items',
            'entries',
            'blockedChannels',
            'channelIds',
            'handles'
        ];
        for (const key of candidateKeys) {
            if (Array.isArray(item[key])) return item[key];
        }
        return [];
    }

    function getManagedChannelListJsonKeywordItems(root) {
        if (Array.isArray(root)) return [];
        const item = safeObject(root);
        const filterData = safeObject(item.filterData);
        if (Array.isArray(filterData.title)) return filterData.title;
        const candidateKeys = [
            'keywords',
            'blockedKeywords',
            'whitelistKeywords',
            'terms',
            'phrases'
        ];
        for (const key of candidateKeys) {
            if (Array.isArray(item[key])) return item[key];
        }
        return [];
    }

    function getManagedChannelListJsonEntryType(entry) {
        const item = safeObject(entry);
        return normalizeString(item.type || item.kind || item.ruleType || item.rule_type).toLowerCase();
    }

    function normalizeManagedChannelListJsonChannel(entry) {
        const token = extractManagedChannelListJsonToken(entry);
        if (token) return normalizeProfileChannel(token);
        const item = safeObject(entry);
        const candidateName = typeof entry === 'string' || typeof entry === 'number'
            ? normalizeString(entry)
            : normalizeString(item.name || item.channelName || item.title || item.label);
        if (!candidateName || /^(#|!|\/\/|\[)/.test(candidateName)) return null;
        return {
            name: candidateName,
            id: '',
            handle: null,
            customUrl: null,
            originalInput: candidateName,
            source: 'managed_channel_list',
            filterAll: false,
            addedAt: Date.now()
        };
    }

    function extractManagedChannelListJsonToken(entry) {
        if (typeof entry === 'string' || typeof entry === 'number') {
            return extractManagedChannelListToken(String(entry));
        }
        const item = safeObject(entry);
        const candidateKeys = [
            'id',
            'channelId',
            'channel_id',
            'ucId',
            'handle',
            'customUrl',
            'custom_url',
            'url',
            'channelUrl',
            'channel_url',
            'youtubeUrl',
            'value',
            'text'
        ];
        for (const key of candidateKeys) {
            const token = extractManagedChannelListToken(item[key]);
            if (token) return token;
        }
        return '';
    }

    function extractManagedChannelListJsonKeyword(entry) {
        if (typeof entry === 'string' || typeof entry === 'number') {
            return normalizeString(entry);
        }
        const item = safeObject(entry);
        const candidateKeys = [
            'keyword',
            'word',
            'term',
            'phrase',
            'value',
            'text'
        ];
        for (const key of candidateKeys) {
            const token = normalizeString(item[key]);
            if (token) return token;
        }
        return '';
    }

    function parseManagedChannelListJson(text, { listName = '' } = {}) {
        const parsedRoot = JSON.parse(text);
        const listId = buildManagedChannelListId(listName || 'Imported list', text);
        const items = getManagedChannelListJsonItems(parsedRoot);
        const keywordItems = getManagedChannelListJsonKeywordItems(parsedRoot);
        const sourceFormat = safeObject(parsedRoot).filterData
            ? 'blocktube_json_rules'
            : (Array.isArray(parsedRoot) ? 'simple_json_array' : 'simple_json_object_channels');
        const seen = new Set();
        const seenKeywords = new Set();
        const channels = [];
        const keywords = [];
        let skippedCount = 0;
        const addKeyword = (entry) => {
            const token = extractManagedChannelListJsonKeyword(entry);
            const keyword = normalizeProfileKeyword(token, { comments: true });
            if (!keyword) return false;
            const key = normalizeString(keyword.word).toLowerCase();
            if (!key || seenKeywords.has(key)) return true;
            seenKeywords.add(key);
            keywords.push({
                ...keyword,
                source: 'managed_channel_list',
                managedListId: listId,
                managedListName: normalizeString(listName) || 'Imported rule list'
            });
            return true;
        };

        items.forEach((entry) => {
            const entryType = getManagedChannelListJsonEntryType(entry);
            if (['keyword', 'keywords', 'term', 'phrase'].includes(entryType)) {
                if (!addKeyword(entry)) skippedCount += 1;
                return;
            }
            const channel = normalizeManagedChannelListJsonChannel(entry);
            if (!channel) {
                skippedCount += 1;
                return;
            }
            const key = managedChannelEntryKey(channel);
            if (!key || seen.has(key)) return;
            seen.add(key);
            channels.push({
                ...channel,
                source: 'managed_channel_list',
                managedListId: listId,
                managedListName: normalizeString(listName) || 'Imported rule list'
            });
        });
        keywordItems.forEach((entry) => {
            if (!addKeyword(entry)) skippedCount += 1;
        });

        return {
            listId,
            contentHash: buildManagedChannelListContentHash(text),
            sourceFormat,
            sourceMetadata: normalizeManagedChannelListJsonMetadata(parsedRoot),
            channels,
            keywords,
            skippedCount,
            totalLineCount: items.length + keywordItems.length
        };
    }

    function parseManagedChannelListText(rawText, { listName = '' } = {}) {
        const text = normalizeString(rawText);
        if (/^\s*[\[{]/.test(text)) {
            try {
                const parsedJson = parseManagedChannelListJson(text, { listName });
                if (parsedJson.channels.length || parsedJson.keywords.length || parsedJson.totalLineCount > 0) {
                    return parsedJson;
                }
            } catch (e) {
                // Fall through to line parsing so pasted mixed text still works.
            }
        }
        const parsedCsv = parseManagedChannelKeywordCsv(text, { listName });
        if (parsedCsv && (parsedCsv.channels.length || parsedCsv.keywords.length || parsedCsv.totalLineCount > 0)) {
            return parsedCsv;
        }
        const listId = buildManagedChannelListId(listName || 'Imported list', text);
        const lines = text.split(/\r?\n/);
        const seen = new Set();
        const seenKeywords = new Set();
        const channels = [];
        const keywords = [];
        let skippedCount = 0;
        let typedRowCount = 0;

        const addTextKeyword = (token) => {
            const keyword = normalizeProfileKeyword(token, { comments: true });
            if (!keyword) return false;
            const key = normalizeString(keyword.word).toLowerCase();
            if (!key || seenKeywords.has(key)) return true;
            seenKeywords.add(key);
            keywords.push({
                ...keyword,
                source: 'managed_channel_list',
                managedListId: listId,
                managedListName: normalizeString(listName) || 'Imported rule list'
            });
            return true;
        };

        const addTextChannel = (token) => {
            const extracted = extractManagedChannelListToken(token);
            if (!extracted) return false;
            const channel = normalizeProfileChannel(extracted);
            if (!channel) return false;
            const key = managedChannelEntryKey(channel);
            if (!key || seen.has(key)) return true;
            seen.add(key);
            channels.push({
                ...channel,
                source: 'managed_channel_list',
                managedListId: listId,
                managedListName: normalizeString(listName) || 'Imported rule list'
            });
            return true;
        };

        lines.forEach((line) => {
            const trimmed = normalizeString(line);
            if (!trimmed || /^(#|!|\/\/|\[)/.test(trimmed)) return;
            const typedMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9 _-]{1,24})\s*[:=]\s*(.+)$/);
            if (typedMatch) {
                const type = normalizeManagedChannelListCsvHeader(typedMatch[1]);
                const value = normalizeString(typedMatch[2]);
                if (['keyword', 'keywords', 'term', 'terms', 'phrase', 'phrases'].includes(type)) {
                    typedRowCount += 1;
                    if (!addTextKeyword(value)) skippedCount += 1;
                    return;
                }
                if (['channel', 'channels', 'channelid', 'handle', 'url', 'ucid', 'customurl'].includes(type)) {
                    typedRowCount += 1;
                    if (!addTextChannel(value)) skippedCount += 1;
                    return;
                }
            }
            if (!addTextChannel(trimmed)) {
                skippedCount += 1;
                return;
            }
        });

        return {
            listId,
            contentHash: buildManagedChannelListContentHash(text),
            sourceFormat: typedRowCount > 0 ? 'typed_text_rows' : 'plain_text_rows',
            sourceMetadata: parseManagedChannelListSourceMetadata(text),
            channels,
            keywords,
            skippedCount,
            totalLineCount: lines.filter(line => normalizeString(line)).length
        };
    }

    function readManagedChannelListFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
            reader.readAsText(file);
        });
    }

    const MANAGED_RULE_LIST_CSV_TEMPLATE = [
        'channel_id,keyword,notes',
        '# @SomeChannel,,channel handle example; remove # and replace before import',
        '# UCxxxxxxxxxxxxxxxxxxxxxx,,channel id example; remove # and replace before import',
        '# https://www.youtube.com/@AnotherChannel,,channel URL example; remove # and replace before import',
        '# ,spider,keyword or phrase example; remove # and replace before import',
        '# ,brainrot,keyword or phrase example; remove # and replace before import'
    ].join('\n');

    const MANAGED_RULE_LIST_JSON_TEMPLATE = JSON.stringify({
        title: 'Family rule list',
        description: 'Channels and keywords only. This is not a full FilterTube backup.',
        channels: [
            '@SomeChannel',
            'UCxxxxxxxxxxxxxxxxxxxxxx',
            'c/ChannelURL',
            'https://www.youtube.com/@AnotherChannel'
        ],
        keywords: [
            'brainrot',
            'scary thumbnail'
        ]
    }, null, 2);

    function countManagedRuleListRows(parsed = {}) {
        return {
            channels: safeArray(parsed.channels).length,
            keywords: safeArray(parsed.keywords).length,
            total: safeArray(parsed.channels).length + safeArray(parsed.keywords).length
        };
    }

    function escapeManagedRuleListPreviewCell(value) {
        return normalizeString(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatManagedRuleListChannelValue(channel = {}) {
        return normalizeString(channel.handle || channel.id || channel.customUrl || channel.name || channel.originalInput);
    }

    function buildManagedRuleListPreviewRows(parsed = {}) {
        const source = formatManagedChannelListSourceFormat(parsed.sourceFormat) || 'Imported list';
        const channels = safeArray(parsed.channels).slice(0, 5).map((channel) => ({
            type: 'Channel',
            value: formatManagedRuleListChannelValue(channel),
            source
        }));
        const keywords = safeArray(parsed.keywords).slice(0, 5).map((keyword) => ({
            type: 'Keyword',
            value: normalizeString(keyword?.word || keyword),
            source
        }));
        return [...channels, ...keywords].filter(row => row.value).slice(0, 8);
    }

    function renderManagedRuleListPreviewSheet(parsed = {}) {
        const rows = buildManagedRuleListPreviewRows(parsed);
        if (!rows.length) {
            return '<div class="managed-channel-list-modal__preview-empty">No readable rows yet. Use channel_id for channels and keyword for words or phrases.</div>';
        }
        return `
            <div class="managed-channel-list-modal__sheet" role="table" aria-label="Rule list preview rows">
                <div class="managed-channel-list-modal__sheet-row managed-channel-list-modal__sheet-head" role="row">
                    <span role="columnheader">Type</span>
                    <span role="columnheader">Value</span>
                    <span role="columnheader">Source</span>
                </div>
                ${rows.map(row => `
                    <div class="managed-channel-list-modal__sheet-row" role="row">
                        <span role="cell">${escapeManagedRuleListPreviewCell(row.type)}</span>
                        <span role="cell">${escapeManagedRuleListPreviewCell(row.value)}</span>
                        <span role="cell">${escapeManagedRuleListPreviewCell(row.source)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function buildManagedRuleListEmptyPreviewNote(text, parsed = {}) {
        const trimmed = normalizeString(text);
        const skipped = Number(parsed.skippedCount) || 0;
        if (/^[\[{]/.test(trimmed)) {
            return skipped
                ? 'JSON was readable, but no supported channel or keyword rows were found. Use channels and keywords arrays, or BlockTube filterData arrays.'
                : 'JSON was readable, but it did not contain supported channels or keywords arrays.';
        }
        if (trimmed.includes(',')) {
            return skipped
                ? `${skipped} ${pluralize(skipped, 'row')} skipped. CSV should include channel_id and/or keyword columns, or type,value rows.`
                : 'CSV needs channel_id and/or keyword headers, or type,value rows.';
        }
        return skipped
            ? `${skipped} ${pluralize(skipped, 'row')} skipped. TXT accepts channel: rows for YouTube channel IDs, handles, custom URLs, or URLs, and keyword: rows for keywords.`
            : 'TXT accepts channel: rows for channel IDs, handles, custom URLs, or URLs, and keyword: rows for keywords.';
    }

    function buildManagedRuleListParseErrorMessage(text) {
        const trimmed = normalizeString(text);
        if (/^[\[{]/.test(trimmed)) {
            return 'JSON could not be parsed. Check braces, brackets, commas, and quoted keys, then preview again.';
        }
        if (trimmed.includes(',')) {
            return 'CSV could not be read as rules. Use channel_id, keyword, notes headers, or type, value, notes rows.';
        }
        return 'FilterTube could not read supported rules from this text. TXT can use channel: @SomeChannel and keyword: brainrot rows; bare rows are treated as channels.';
    }

    function formatManagedRuleListCount(counts = {}) {
        const channelCount = Number(counts.channels) || 0;
        const keywordCount = Number(counts.keywords) || 0;
        const parts = [];
        if (channelCount) parts.push(`${channelCount} ${pluralize(channelCount, 'channel')}`);
        if (keywordCount) parts.push(`${keywordCount} ${pluralize(keywordCount, 'keyword')}`);
        return parts.length ? parts.join(' + ') : '0 rules';
    }

    function downloadManagedRuleListCsvTemplate() {
        try {
            const blob = new Blob([MANAGED_RULE_LIST_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'filtertube-rule-list-template.csv';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            UIComponents.showToast('Unable to download CSV template', 'error');
        }
    }

    function downloadManagedRuleListJsonTemplate() {
        try {
            const blob = new Blob([MANAGED_RULE_LIST_JSON_TEMPLATE], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'filtertube-rule-list-template.json';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            UIComponents.showToast('Unable to download JSON template', 'error');
        }
    }

    async function showManagedChannelListImportModal({ selectedCount = 1, targetLabel = '' } = {}) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ft-modal-overlay';

            const card = document.createElement('div');
            card.className = 'card ft-modal managed-channel-list-modal';

            const header = document.createElement('div');
            header.className = 'card-header';
            const titleEl = document.createElement('h3');
            titleEl.className = 'ft-modal-title';
            titleEl.textContent = 'Import List';
            header.appendChild(titleEl);

            const body = document.createElement('div');
            body.className = 'card-body ft-modal-body managed-channel-list-modal__body';

            const intro = document.createElement('div');
            intro.className = 'import-export-hint';
            const targetCopy = normalizeString(targetLabel) || (selectedCount > 1
                ? `${selectedCount} selected protected profiles`
                : 'this profile');
            intro.textContent = `Import a channel/keyword list, review the parsed rows, then apply it to ${targetCopy}. Rule lists never change profiles, PINs, trusted devices, or viewing access.`;
            body.appendChild(intro);

            const formatGuide = document.createElement('div');
            formatGuide.className = 'managed-channel-list-modal__formats';
            formatGuide.innerHTML = `
                <span><b>CSV</b><code>channel_id,keyword,notes</code></span>
                <span><b>TXT</b><code>channel: @SomeChannel</code><code>keyword: brainrot</code></span>
                <span><b>JSON</b><code>{"channels":["@SomeChannel","c/ChannelURL"],"keywords":["brainrot"]}</code></span>
                <span><b>BlockTube</b><code>filterData.channelId + filterData.title</code></span>
                <span><b>Public list</b>raw HTTPS CSV, TXT, or JSON</span>
            `;
            body.appendChild(formatGuide);

            const nameGroup = document.createElement('label');
            nameGroup.className = 'managed-channel-list-modal__field';
            const nameLabel = document.createElement('span');
            nameLabel.textContent = 'List name';
            const nameInput = document.createElement('input');
            nameInput.className = 'text-input';
            nameInput.type = 'text';
            nameInput.placeholder = 'Family block list';
            nameInput.value = 'Imported rule list';
            nameGroup.append(nameLabel, nameInput);
            body.appendChild(nameGroup);

            const urlGroup = document.createElement('label');
            urlGroup.className = 'managed-channel-list-modal__field';
            const urlLabel = document.createElement('span');
            urlLabel.textContent = 'Optional list URL';
            const urlRow = document.createElement('div');
            urlRow.className = 'managed-channel-list-modal__url-row';
            const urlInput = document.createElement('input');
            urlInput.className = 'text-input';
            urlInput.type = 'url';
            urlInput.placeholder = 'https://raw.githubusercontent.com/user/list/main/filtertube-rules.csv';
            const loadUrlBtn = document.createElement('button');
            loadUrlBtn.className = 'btn-secondary';
            loadUrlBtn.type = 'button';
            loadUrlBtn.textContent = 'Load URL';
            loadUrlBtn.title = 'Loads a public HTTPS text list into the preview box. If the host blocks browser fetches, download the file and choose it below.';
            urlRow.append(urlInput, loadUrlBtn);
            urlGroup.append(urlLabel, urlRow);
            body.appendChild(urlGroup);

            const fileGroup = document.createElement('label');
            fileGroup.className = 'managed-channel-list-modal__field';
            const fileLabel = document.createElement('span');
            fileLabel.textContent = 'Optional list file';
            const fileInput = document.createElement('input');
            fileInput.className = 'managed-channel-list-modal__file';
            fileInput.type = 'file';
            fileInput.accept = '.txt,.csv,.list,.md,.json,text/plain,text/csv,application/json';
            fileGroup.append(fileLabel, fileInput);
            body.appendChild(fileGroup);

            const listGroup = document.createElement('label');
            listGroup.className = 'managed-channel-list-modal__field';
            const listLabel = document.createElement('span');
            listLabel.textContent = 'Channels and keywords';
            const textArea = document.createElement('textarea');
            textArea.className = 'text-input managed-channel-list-modal__textarea';
            textArea.placeholder = MANAGED_RULE_LIST_CSV_TEMPLATE;
            listGroup.append(listLabel, textArea);
            body.appendChild(listGroup);

            const templateBox = document.createElement('div');
            templateBox.className = 'managed-channel-list-modal__template';
            const templateTitle = document.createElement('div');
            templateTitle.className = 'managed-channel-list-modal__template-title';
            templateTitle.textContent = 'CSV template';
            const templateText = document.createElement('pre');
            templateText.textContent = MANAGED_RULE_LIST_CSV_TEMPLATE;
            const templateActions = document.createElement('div');
            templateActions.className = 'managed-channel-list-modal__template-actions';
            const useTemplateBtn = document.createElement('button');
            useTemplateBtn.className = 'btn-secondary';
            useTemplateBtn.type = 'button';
            useTemplateBtn.textContent = 'Use CSV';
            useTemplateBtn.title = 'Puts the CSV template into the preview box so you can edit it.';
            const useJsonTemplateBtn = document.createElement('button');
            useJsonTemplateBtn.className = 'btn-secondary';
            useJsonTemplateBtn.type = 'button';
            useJsonTemplateBtn.textContent = 'Use JSON';
            useJsonTemplateBtn.title = 'Puts the JSON rule-list template into the preview box so you can edit it.';
            const downloadTemplateBtn = document.createElement('button');
            downloadTemplateBtn.className = 'btn-secondary';
            downloadTemplateBtn.type = 'button';
            downloadTemplateBtn.textContent = 'Download CSV';
            downloadTemplateBtn.title = 'Downloads a CSV template for spreadsheet editing.';
            const downloadJsonTemplateBtn = document.createElement('button');
            downloadJsonTemplateBtn.className = 'btn-secondary';
            downloadJsonTemplateBtn.type = 'button';
            downloadJsonTemplateBtn.textContent = 'Download JSON';
            downloadJsonTemplateBtn.title = 'Downloads a JSON rule-list template.';
            templateActions.append(useTemplateBtn, useJsonTemplateBtn, downloadTemplateBtn, downloadJsonTemplateBtn);
            templateBox.append(templateTitle, templateText, templateActions);
            body.appendChild(templateBox);

            const help = document.createElement('div');
            help.className = 'managed-channel-list-modal__help';
            help.textContent = 'TXT bare rows stay channel-only; use keyword: for TXT keywords. CSV and supported JSON can add channels and keywords. FilterTube shows parsed rows before any profile is changed.';
            body.appendChild(help);

            const previewEl = document.createElement('div');
            previewEl.className = 'managed-channel-list-modal__preview';
            previewEl.setAttribute('aria-live', 'polite');
            body.appendChild(previewEl);

            const errorEl = document.createElement('div');
            errorEl.className = 'managed-channel-list-modal__error';
            errorEl.hidden = true;
            body.appendChild(errorEl);

            const actions = document.createElement('div');
            actions.className = 'ft-modal-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-secondary';
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'Cancel';

            const okBtn = document.createElement('button');
            okBtn.className = 'btn-primary';
            okBtn.type = 'button';
            okBtn.textContent = 'Preview List';

            const cleanup = () => {
                try {
                    overlay.remove();
                } catch (e) {
                }
            };

            const setError = (message) => {
                errorEl.textContent = message;
                errorEl.hidden = !message;
            };

            const renderPreview = () => {
                const text = normalizeString(textArea.value);
                if (!text) {
                    previewEl.innerHTML = `
                        <div class="managed-channel-list-modal__preview-title">Preview</div>
                        <div class="managed-channel-list-modal__preview-empty">Paste CSV, load a URL, choose a file, or use the template. The preview will show Type, Value, and Source before anything is applied.</div>
                    `;
                    return;
                }
                const name = normalizeString(nameInput.value) || 'Imported rule list';
                try {
                    const parsed = parseManagedChannelListText(text, { listName: name });
                    const counts = countManagedRuleListRows(parsed);
                    previewEl.innerHTML = `
                        <div class="managed-channel-list-modal__preview-title">Preview</div>
                        <div class="managed-channel-list-modal__preview-grid">
                            <div class="managed-channel-list-modal__preview-stat"><strong>${counts.channels}</strong><span>Channels</span></div>
                            <div class="managed-channel-list-modal__preview-stat"><strong>${counts.keywords}</strong><span>Keywords</span></div>
                            <div class="managed-channel-list-modal__preview-stat"><strong>${parsed.skippedCount || 0}</strong><span>Skipped</span></div>
                        </div>
                        ${renderManagedRuleListPreviewSheet(parsed)}
                        <div class="managed-channel-list-modal__preview-note">${counts.total ? 'Ready to review. Confirming will apply only these rule values.' : buildManagedRuleListEmptyPreviewNote(text, parsed)}</div>
                    `;
                } catch (error) {
                    previewEl.innerHTML = `
                        <div class="managed-channel-list-modal__preview-title">Preview</div>
                        <div class="managed-channel-list-modal__preview-empty">${escapeManagedRuleListPreviewCell(buildManagedRuleListParseErrorMessage(text))}</div>
                    `;
                }
            };

            let loadedSourceUrl = '';
            let loadedSourceLabel = '';
            let loadedSourceText = '';

            const setLoadedSource = ({ url = '', label = '', text = '' } = {}) => {
                loadedSourceUrl = normalizeManagedChannelListSourceUrl(url);
                loadedSourceLabel = normalizeString(label);
                loadedSourceText = normalizeString(text);
            };

            const closeWith = (value) => {
                cleanup();
                resolve(value);
            };

            cancelBtn.addEventListener('click', () => closeWith(null));
            okBtn.addEventListener('click', () => {
                const name = normalizeString(nameInput.value) || 'Imported rule list';
                const text = normalizeString(textArea.value);
                if (!text) {
                    setError('Paste rules or choose a list file first.');
                    return;
                }
                const loadedSourceMatches = loadedSourceUrl && text === loadedSourceText;
                closeWith({
                    name,
                    text,
                    sourceLabel: fileInput.files?.[0]?.name || (loadedSourceMatches ? loadedSourceLabel : 'Pasted list'),
                    sourceUrl: loadedSourceMatches ? loadedSourceUrl : ''
                });
            });
            useTemplateBtn.addEventListener('click', () => {
                textArea.value = MANAGED_RULE_LIST_CSV_TEMPLATE;
                setLoadedSource();
                setError('');
                renderPreview();
                textArea.focus();
            });
            useJsonTemplateBtn.addEventListener('click', () => {
                textArea.value = MANAGED_RULE_LIST_JSON_TEMPLATE;
                setLoadedSource();
                setError('');
                renderPreview();
                textArea.focus();
            });
            downloadTemplateBtn.addEventListener('click', () => {
                downloadManagedRuleListCsvTemplate();
            });
            downloadJsonTemplateBtn.addEventListener('click', () => {
                downloadManagedRuleListJsonTemplate();
            });
            loadUrlBtn.addEventListener('click', async (event) => {
                event.preventDefault();
                const rawUrl = normalizeString(urlInput.value);
                if (!rawUrl) {
                    setError('Enter a public HTTPS list URL first.');
                    return;
                }
                const previousLabel = loadUrlBtn.textContent;
                loadUrlBtn.disabled = true;
                loadUrlBtn.textContent = 'Loading...';
                setError('');
                try {
                    const loaded = await fetchManagedChannelListSourceUrl(rawUrl);
                    textArea.value = loaded.text;
                    fileInput.value = '';
                    setLoadedSource({
                        url: loaded.url,
                        label: loaded.sourceLabel,
                        text: loaded.text
                    });
                    urlInput.value = loaded.url;
                    if (!normalizeString(nameInput.value) || nameInput.value === 'Imported rule list') {
                        nameInput.value = loaded.sourceLabel || 'Imported rule list';
                    }
                    help.textContent = 'URL loaded into the preview box. Parent/account unlock is still required before any protected profile changes.';
                    renderPreview();
                    textArea.focus();
                } catch (error) {
                    setLoadedSource();
                    setError(error?.message || 'Unable to load this URL. Download it and choose the file instead.');
                } finally {
                    loadUrlBtn.disabled = false;
                    loadUrlBtn.textContent = previousLabel;
                }
            });
            fileInput.addEventListener('change', async () => {
                const file = fileInput.files?.[0];
                if (!file) return;
                try {
                    const text = await readManagedChannelListFile(file);
                    textArea.value = text;
                    setLoadedSource();
                    if (!normalizeString(nameInput.value) || nameInput.value === 'Imported rule list') {
                        nameInput.value = file.name.replace(/\.[^.]+$/, '') || 'Imported rule list';
                    }
                    help.textContent = 'File loaded into the preview box. Parent/account unlock is still required before any protected profile changes.';
                    setError('');
                    renderPreview();
                    textArea.focus();
                } catch (error) {
                    setError(error?.message || 'Unable to read this file.');
                }
            });
            textArea.addEventListener('input', () => {
                if (loadedSourceUrl && normalizeString(textArea.value) !== loadedSourceText) {
                    setLoadedSource();
                }
                renderPreview();
            });
            textArea.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelBtn.click();
                }
            });
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) cancelBtn.click();
            });

            actions.append(cancelBtn, okBtn);
            body.appendChild(actions);
            card.append(header, body);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
            renderPreview();
            setTimeout(() => {
                try {
                    nameInput.focus();
                    nameInput.select();
                } catch (e) {
                }
            }, 0);
        });
    }

    async function promptManagedChannelListSurface() {
        const surface = await showChoiceModal({
            title: 'Where Should This List Apply?',
            message: 'Choose the YouTube space for these rules. FilterTube will respect each protected profile current Blocklist/Whitelist mode.',
            choices: [
                { value: 'main', label: 'Main YouTube', className: 'btn-primary' },
                { value: 'kids', label: 'YouTube Kids', className: 'btn-secondary' },
                { value: 'both', label: 'Main + Kids', className: 'btn-secondary' }
            ],
            cancelText: 'Cancel'
        });
        if (surface === 'both') return ['main', 'kids'];
        if (surface === 'kids') return ['kids'];
        if (surface === 'main') return ['main'];
        return [];
    }

    function applyManagedChannelListToSurface(target, surface, parsed, metadata = {}) {
        const item = safeObject(target);
        const channelListKey = managedRuleListKeyFor(surface, 'channel', item);
        const keywordListKey = managedRuleListKeyFor(surface, 'keyword', item);
        const existingChannels = Array.isArray(item[channelListKey]) ? item[channelListKey] : [];
        const existingKeywords = Array.isArray(item[keywordListKey]) ? item[keywordListKey] : [];
        const seenChannels = new Set(existingChannels.map(managedChannelEntryKey).filter(Boolean));
        const seenKeywords = new Set(existingKeywords.map(row => normalizeString(row?.word).toLowerCase()).filter(Boolean));
        const channelsToAdd = [];
        const keywordsToAdd = [];
        let duplicateCount = 0;
        const sourceMetadata = {
            ...safeObject(parsed?.sourceMetadata),
            ...safeObject(metadata.sourceMetadata)
        };
        const decorateManagedListRow = (row) => ({
            ...row,
            source: 'managed_channel_list',
            managedListId: normalizeString(parsed?.listId),
            managedListName: normalizeString(metadata.listName) || normalizeString(row.managedListName) || 'Imported rule list',
            managedListSourceLabel: normalizeString(metadata.sourceLabel) || 'Imported list',
            managedListSourceUrl: normalizeManagedChannelListSourceUrl(metadata.sourceUrl),
            managedListSourceFormat: normalizeManagedChannelListSourceFormat(metadata.sourceFormat || parsed?.sourceFormat),
            managedListImportedAt: metadata.importedAt || Date.now(),
            managedListLastCheckedAt: metadata.lastCheckedAt || metadata.importedAt || Date.now(),
            managedListContentHash: normalizeString(metadata.contentHash || parsed?.contentHash),
            ...(normalizeString(sourceMetadata.title) ? { managedListSourceTitle: normalizeManagedChannelListMetadataValue(sourceMetadata.title) } : {}),
            ...(normalizeString(sourceMetadata.sourceVersion) ? { managedListSourceVersion: normalizeManagedChannelListMetadataValue(sourceMetadata.sourceVersion) } : {}),
            ...(normalizeString(sourceMetadata.sourceUpdatedLabel) ? { managedListSourceUpdatedLabel: normalizeManagedChannelListMetadataValue(sourceMetadata.sourceUpdatedLabel) } : {}),
            ...(normalizeString(sourceMetadata.homepage) ? { managedListSourceHomepage: normalizeManagedChannelListMetadataValue(sourceMetadata.homepage, 240) } : {}),
            ...(metadata.paused === true ? { managedListPaused: true } : {}),
            addedAt: metadata.importedAt || Date.now()
        });
        safeArray(parsed?.channels).forEach((channel) => {
            const key = managedChannelEntryKey(channel);
            if (!key || seenChannels.has(key)) {
                duplicateCount += 1;
                return;
            }
            seenChannels.add(key);
            channelsToAdd.push(decorateManagedListRow(channel));
        });
        safeArray(parsed?.keywords).forEach((keyword) => {
            const entry = normalizeProfileKeyword(keyword?.word || keyword, { comments: surface !== 'kids' });
            const key = normalizeString(entry?.word).toLowerCase();
            if (!key || seenKeywords.has(key)) {
                duplicateCount += 1;
                return;
            }
            seenKeywords.add(key);
            keywordsToAdd.push(decorateManagedListRow(entry));
        });
        if (channelsToAdd.length) {
            item[channelListKey] = [...channelsToAdd, ...existingChannels];
        }
        if (keywordsToAdd.length) {
            item[keywordListKey] = [...keywordsToAdd, ...existingKeywords];
        }
        return {
            changed: channelsToAdd.length > 0 || keywordsToAdd.length > 0,
            addedCount: channelsToAdd.length + keywordsToAdd.length,
            channelAddedCount: channelsToAdd.length,
            keywordAddedCount: keywordsToAdd.length,
            duplicateCount
        };
    }

    function getManagedChannelListSurfaceKeys(surface) {
        if (surface === 'kids') return ['blockedChannels', 'whitelistChannels', 'blockedKeywords', 'whitelistKeywords'];
        return ['channels', 'whitelistChannels', 'keywords', 'whitelistKeywords'];
    }

    function collectManagedChannelListSummariesForProfile(profile, profileId) {
        const summaries = new Map();
        ['main', 'kids'].forEach((surface) => {
            const source = safeObject(profile?.[surface]);
            getManagedChannelListSurfaceKeys(surface).forEach((listKey) => {
                safeArray(source[listKey]).forEach((row) => {
                    const listId = normalizeString(row?.managedListId);
                    if (!listId) return;
                    const current = summaries.get(listId) || {
                        listId,
                        listName: normalizeString(row?.managedListName) || 'Imported rule list',
                        sourceLabel: normalizeString(row?.managedListSourceLabel) || 'Imported list',
                        sourceUrl: normalizeManagedChannelListSourceUrl(row?.managedListSourceUrl),
                        sourceFormat: normalizeManagedChannelListSourceFormat(row?.managedListSourceFormat),
                        contentHash: normalizeString(row?.managedListContentHash),
                        sourceTitle: normalizeString(row?.managedListSourceTitle),
                        sourceVersion: normalizeString(row?.managedListSourceVersion),
                        sourceUpdatedLabel: normalizeString(row?.managedListSourceUpdatedLabel),
                        sourceHomepage: normalizeString(row?.managedListSourceHomepage),
                        lastCheckedAt: 0,
                        profileIds: new Set(),
                        surfaces: new Set(),
                        ruleCount: 0,
                        activeRuleCount: 0,
                        pausedRuleCount: 0
                    };
                    current.profileIds.add(normalizeString(profileId));
                    current.surfaces.add(surface);
                    current.ruleCount += 1;
                    const checkedAt = Number(row?.managedListLastCheckedAt || row?.managedListImportedAt) || 0;
                    if (checkedAt > current.lastCheckedAt) current.lastCheckedAt = checkedAt;
                    if (!current.contentHash && normalizeString(row?.managedListContentHash)) {
                        current.contentHash = normalizeString(row.managedListContentHash);
                    }
                    if (!current.sourceFormat && normalizeManagedChannelListSourceFormat(row?.managedListSourceFormat)) {
                        current.sourceFormat = normalizeManagedChannelListSourceFormat(row.managedListSourceFormat);
                    }
                    if (!current.sourceTitle && normalizeString(row?.managedListSourceTitle)) current.sourceTitle = normalizeString(row.managedListSourceTitle);
                    if (!current.sourceVersion && normalizeString(row?.managedListSourceVersion)) current.sourceVersion = normalizeString(row.managedListSourceVersion);
                    if (!current.sourceUpdatedLabel && normalizeString(row?.managedListSourceUpdatedLabel)) current.sourceUpdatedLabel = normalizeString(row.managedListSourceUpdatedLabel);
                    if (!current.sourceHomepage && normalizeString(row?.managedListSourceHomepage)) current.sourceHomepage = normalizeString(row.managedListSourceHomepage);
                    if (isManagedChannelListRowPaused(row)) {
                        current.pausedRuleCount += 1;
                    } else {
                        current.activeRuleCount += 1;
                    }
                    summaries.set(listId, current);
                });
            });
        });
        return Array.from(summaries.values()).map((item) => ({
            listId: item.listId,
            listName: item.listName,
            sourceLabel: item.sourceLabel,
            sourceUrl: item.sourceUrl,
            sourceFormat: item.sourceFormat,
            contentHash: item.contentHash,
            sourceTitle: item.sourceTitle,
            sourceVersion: item.sourceVersion,
            sourceUpdatedLabel: item.sourceUpdatedLabel,
            sourceHomepage: item.sourceHomepage,
            lastCheckedAt: item.lastCheckedAt,
            profileIds: Array.from(item.profileIds).filter(Boolean),
            surfaces: Array.from(item.surfaces).filter(Boolean),
            ruleCount: item.ruleCount,
            activeRuleCount: item.activeRuleCount,
            pausedRuleCount: item.pausedRuleCount,
            channelCount: item.ruleCount,
            activeChannelCount: item.activeRuleCount,
            pausedChannelCount: item.pausedRuleCount
        }));
    }

    function collectManagedChannelListSummaries(profiles, profileIds) {
        const merged = new Map();
        safeArray(profileIds).forEach((profileId) => {
            const targetId = normalizeString(profileId);
            const profile = safeObject(profiles[targetId]);
            collectManagedChannelListSummariesForProfile(profile, targetId).forEach((summary) => {
                const key = summary.listId;
                const current = merged.get(key) || {
                    listId: key,
                    listName: summary.listName,
                    sourceLabel: summary.sourceLabel,
                    sourceUrl: summary.sourceUrl,
                    sourceFormat: summary.sourceFormat,
                    contentHash: summary.contentHash,
                    sourceTitle: summary.sourceTitle,
                    sourceVersion: summary.sourceVersion,
                    sourceUpdatedLabel: summary.sourceUpdatedLabel,
                    sourceHomepage: summary.sourceHomepage,
                    lastCheckedAt: Number(summary.lastCheckedAt) || 0,
                    profileIds: new Set(),
                    surfaces: new Set(),
                    ruleCount: 0,
                    activeRuleCount: 0,
                    pausedRuleCount: 0
                };
                safeArray(summary.profileIds).forEach(id => current.profileIds.add(id));
                safeArray(summary.surfaces).forEach(surface => current.surfaces.add(surface));
                current.ruleCount += Number(summary.ruleCount) || 0;
                current.activeRuleCount += Number(summary.activeRuleCount) || 0;
                current.pausedRuleCount += Number(summary.pausedRuleCount) || 0;
                current.lastCheckedAt = Math.max(current.lastCheckedAt || 0, Number(summary.lastCheckedAt) || 0);
                if (!current.contentHash && normalizeString(summary.contentHash)) current.contentHash = normalizeString(summary.contentHash);
                if (!current.sourceFormat && normalizeManagedChannelListSourceFormat(summary.sourceFormat)) current.sourceFormat = normalizeManagedChannelListSourceFormat(summary.sourceFormat);
                if (!current.sourceTitle && normalizeString(summary.sourceTitle)) current.sourceTitle = normalizeString(summary.sourceTitle);
                if (!current.sourceVersion && normalizeString(summary.sourceVersion)) current.sourceVersion = normalizeString(summary.sourceVersion);
                if (!current.sourceUpdatedLabel && normalizeString(summary.sourceUpdatedLabel)) current.sourceUpdatedLabel = normalizeString(summary.sourceUpdatedLabel);
                if (!current.sourceHomepage && normalizeString(summary.sourceHomepage)) current.sourceHomepage = normalizeString(summary.sourceHomepage);
                merged.set(key, current);
            });
        });
        return Array.from(merged.values())
            .map((item) => ({
                listId: item.listId,
                listName: item.listName,
                sourceLabel: item.sourceLabel,
                sourceUrl: item.sourceUrl,
                sourceFormat: item.sourceFormat,
                contentHash: item.contentHash,
                sourceTitle: item.sourceTitle,
                sourceVersion: item.sourceVersion,
                sourceUpdatedLabel: item.sourceUpdatedLabel,
                sourceHomepage: item.sourceHomepage,
                lastCheckedAt: item.lastCheckedAt,
                profileIds: Array.from(item.profileIds).filter(Boolean),
                surfaces: Array.from(item.surfaces).filter(Boolean),
                ruleCount: item.ruleCount,
                activeRuleCount: item.activeRuleCount,
                pausedRuleCount: item.pausedRuleCount,
                channelCount: item.ruleCount,
                activeChannelCount: item.activeRuleCount,
                pausedChannelCount: item.pausedRuleCount
            }))
            .sort((a, b) => (a.listName || '').localeCompare(b.listName || ''));
    }

    function formatManagedChannelListCheckedAt(timestamp) {
        const value = Number(timestamp) || 0;
        if (!value) return 'not checked yet';
        try {
            return `checked ${new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } catch (e) {
            return 'checked';
        }
    }

    function isManagedChannelListSummaryUrlBacked(summary) {
        return !!normalizeManagedChannelListSourceUrl(summary?.sourceUrl);
    }

    function isManagedChannelListSummaryStale(summary, now = Date.now()) {
        if (!isManagedChannelListSummaryUrlBacked(summary)) return false;
        const checkedAt = Number(summary?.lastCheckedAt) || 0;
        const staleAfterMs = 7 * 24 * 60 * 60 * 1000;
        return !checkedAt || (Number(now) - checkedAt) >= staleAfterMs;
    }

    function formatManagedChannelListShortHash(contentHash) {
        const normalized = normalizeString(contentHash);
        if (!normalized) return '';
        const token = normalized.includes(':') ? normalized.split(':').pop() : normalized;
        return token ? `hash ${token.slice(0, 8)}` : '';
    }

    function formatManagedChannelListSourceVersion(summary) {
        const version = normalizeString(summary?.sourceVersion);
        if (version) return `version ${version}`;
        const updated = normalizeString(summary?.sourceUpdatedLabel);
        return updated ? `updated ${updated}` : '';
    }

    async function showManagedChannelListLibraryModal(summaries) {
        const rows = safeArray(summaries);
        if (!rows.length) {
            UIComponents.showToast('No imported rule lists found for the selected protected profiles', 'info');
            return;
        }
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ft-modal-overlay';

            const card = document.createElement('div');
            card.className = 'card ft-modal managed-channel-list-modal';

            const header = document.createElement('div');
            header.className = 'card-header';
            const titleEl = document.createElement('h3');
            titleEl.className = 'ft-modal-title';
            titleEl.textContent = 'Imported Rule Lists';
            header.appendChild(titleEl);

            const body = document.createElement('div');
            body.className = 'card-body ft-modal-body managed-channel-list-modal__body';

            const intro = document.createElement('div');
            intro.className = 'import-export-hint';
            intro.textContent = 'These are list-derived channel and keyword rules on the selected protected profiles. This view is read-only.';
            body.appendChild(intro);

            const list = document.createElement('div');
            list.className = 'managed-channel-list-modal__library';
            rows.forEach((summary) => {
                const item = document.createElement('div');
                item.className = 'managed-channel-list-modal__library-item';

                const title = document.createElement('strong');
                title.textContent = summary.listName || 'Imported rule list';

                const meta = document.createElement('div');
                meta.className = 'managed-channel-list-modal__library-meta';
                const surfaces = summary.surfaces.includes('main') && summary.surfaces.includes('kids')
                    ? 'Main + Kids'
                    : (summary.surfaces.includes('kids') ? 'Kids' : 'Main');
                const activeCount = Number(summary.activeRuleCount ?? summary.activeChannelCount) || 0;
                const pausedCount = Number(summary.pausedRuleCount ?? summary.pausedChannelCount) || 0;
                const stateBits = pausedCount
                    ? `${activeCount} active, ${pausedCount} paused`
                    : `${activeCount || summary.ruleCount || summary.channelCount || 0} active`;
                const ruleCount = Number(summary.ruleCount ?? summary.channelCount) || 0;
                meta.textContent = `${ruleCount} ${pluralize(ruleCount, 'rule')} | ${stateBits} | ${summary.profileIds.length} ${pluralize(summary.profileIds.length, 'profile')} | ${surfaces}`;

                const source = document.createElement('small');
                source.className = 'managed-channel-list-modal__library-source';
                const sourceBits = [
                    normalizeString(summary.sourceLabel) || 'Imported list',
                    normalizeString(summary.sourceTitle),
                    formatManagedChannelListSourceFormat(summary.sourceFormat),
                    isManagedChannelListSummaryUrlBacked(summary) ? 'URL-backed' : 'Local/pasted',
                    formatManagedChannelListCheckedAt(summary.lastCheckedAt),
                    formatManagedChannelListSourceVersion(summary),
                    isManagedChannelListSummaryStale(summary) ? 'needs refresh' : '',
                    formatManagedChannelListShortHash(summary.contentHash)
                ];
                source.textContent = sourceBits.filter(Boolean).join(' | ');

                item.append(title, meta, source);
                list.appendChild(item);
            });
            body.appendChild(list);

            const actions = document.createElement('div');
            actions.className = 'ft-modal-actions';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'btn-secondary';
            closeBtn.type = 'button';
            closeBtn.textContent = 'Close';
            const cleanup = () => {
                try {
                    overlay.remove();
                } catch (e) {
                }
            };
            closeBtn.addEventListener('click', () => {
                cleanup();
                resolve();
            });
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) closeBtn.click();
            });
            actions.appendChild(closeBtn);
            body.appendChild(actions);
            card.append(header, body);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
            requestAnimationFrame(() => {
                try {
                    closeBtn.focus();
                } catch (e) {
                }
            });
        });
    }

    async function promptManagedChannelListToRemove(summaries) {
        const choices = safeArray(summaries).slice(0, 10).map((summary) => ({
            value: summary.listId,
            label: `${summary.listName} (${summary.ruleCount ?? summary.channelCount})`,
            className: 'btn-secondary'
        }));
        if (!choices.length) return null;
        const selected = await showChoiceModal({
            title: 'Remove Imported List',
            message: 'Choose the imported rule list to remove from selected protected profiles. Manual rules are kept.',
            details: safeArray(summaries).slice(0, 5).map((summary) => {
                const surfaces = summary.surfaces.includes('main') && summary.surfaces.includes('kids')
                    ? 'Main + Kids'
                    : (summary.surfaces.includes('kids') ? 'Kids' : 'Main');
                const ruleCount = Number(summary.ruleCount ?? summary.channelCount) || 0;
                return `${summary.listName}: ${ruleCount} list-derived ${pluralize(ruleCount, 'rule')} across ${summary.profileIds.length} ${pluralize(summary.profileIds.length, 'profile')} (${surfaces})`;
            }),
            choices,
            cancelText: 'Cancel'
        });
        return safeArray(summaries).find(summary => summary.listId === selected) || null;
    }

    async function promptManagedChannelListToRefresh(summaries) {
        const urlBacked = safeArray(summaries).filter(summary => normalizeManagedChannelListSourceUrl(summary?.sourceUrl));
        const choices = urlBacked.slice(0, 10).map((summary) => ({
            value: summary.listId,
            label: `${summary.listName} (${summary.ruleCount ?? summary.channelCount})`,
            className: 'btn-secondary'
        }));
        if (!choices.length) return null;
        const selected = await showChoiceModal({
            title: 'Check Imported List URL',
            message: 'Choose the URL-backed list to check. FilterTube loads the saved public HTTPS source first; changed content can refresh rules after parent/account unlock.',
            details: urlBacked.slice(0, 5).map((summary) => {
                const surfaces = summary.surfaces.includes('main') && summary.surfaces.includes('kids')
                    ? 'Main + Kids'
                    : (summary.surfaces.includes('kids') ? 'Kids' : 'Main');
                const ruleCount = Number(summary.ruleCount ?? summary.channelCount) || 0;
                return `${summary.listName}: ${ruleCount} current ${pluralize(ruleCount, 'rule')} across ${summary.profileIds.length} ${pluralize(summary.profileIds.length, 'profile')} (${surfaces})`;
            }),
            choices,
            cancelText: 'Cancel'
        });
        return urlBacked.find(summary => summary.listId === selected) || null;
    }

    async function loadManagedChannelListRefreshCandidate(summary) {
        const selectedList = safeObject(summary);
        const loaded = await fetchManagedChannelListSourceUrl(selectedList.sourceUrl);
        const parsedRaw = parseManagedChannelListText(loaded.text, { listName: selectedList.listName });
        const counts = countManagedRuleListRows(parsedRaw);
        if (!counts.total) {
            throw new Error('No valid channels or keywords found');
        }
        return {
            selectedList,
            loaded,
            parsed: {
                ...parsedRaw,
                listId: selectedList.listId
            }
        };
    }

    async function promptManagedChannelListToPauseState(summaries, paused) {
        const candidates = safeArray(summaries).filter((summary) => {
            const activeCount = Number(summary?.activeRuleCount ?? summary?.activeChannelCount) || 0;
            const pausedCount = Number(summary?.pausedRuleCount ?? summary?.pausedChannelCount) || 0;
            return paused ? activeCount > 0 : pausedCount > 0;
        });
        const choices = candidates.slice(0, 10).map((summary) => ({
            value: summary.listId,
            label: `${summary.listName} (${paused ? (Number(summary.activeRuleCount ?? summary.activeChannelCount) || 0) : (Number(summary.pausedRuleCount ?? summary.pausedChannelCount) || 0)})`,
            className: paused ? 'btn-secondary' : 'btn-primary'
        }));
        if (!choices.length) return null;
        const selected = await showChoiceModal({
            title: paused ? 'Pause Imported List' : 'Resume Imported List',
            message: paused
                ? 'Choose the imported list to pause. The list remains saved and visible, but its channels stop affecting protected profiles until resumed.'
                : 'Choose the imported list to resume. Its saved channels will become active again after parent/account unlock.',
            details: candidates.slice(0, 5).map((summary) => {
                const activeCount = Number(summary.activeRuleCount ?? summary.activeChannelCount) || 0;
                const pausedCount = Number(summary.pausedRuleCount ?? summary.pausedChannelCount) || 0;
                const surfaces = summary.surfaces.includes('main') && summary.surfaces.includes('kids')
                    ? 'Main + Kids'
                    : (summary.surfaces.includes('kids') ? 'Kids' : 'Main');
                return `${summary.listName}: ${activeCount} active, ${pausedCount} paused across ${summary.profileIds.length} ${pluralize(summary.profileIds.length, 'profile')} (${surfaces})`;
            }),
            choices,
            cancelText: 'Cancel'
        });
        return candidates.find(summary => summary.listId === selected) || null;
    }

    function hasManagedChannelListOnSurface(target, surface, listId) {
        const item = safeObject(target);
        const normalizedListId = normalizeString(listId);
        if (!normalizedListId) return false;
        return getManagedChannelListSurfaceKeys(surface).some((listKey) => {
            const list = Array.isArray(item[listKey]) ? item[listKey] : [];
            return list.some(row => normalizeString(row?.managedListId) === normalizedListId);
        });
    }

    function removeManagedChannelListFromSurface(target, surface, listId) {
        const item = safeObject(target);
        let removedCount = 0;
        getManagedChannelListSurfaceKeys(surface).forEach((listKey) => {
            const list = Array.isArray(item[listKey]) ? item[listKey] : [];
            if (!list.length) return;
            const next = list.filter((row) => {
                const match = normalizeString(row?.managedListId) === listId;
                if (match) removedCount += 1;
                return !match;
            });
            if (next.length !== list.length) {
                item[listKey] = next;
            }
        });
        return {
            changed: removedCount > 0,
            removedCount
        };
    }

    function setManagedChannelListPausedOnSurface(target, surface, listId, paused) {
        const item = safeObject(target);
        let changedCount = 0;
        getManagedChannelListSurfaceKeys(surface).forEach((listKey) => {
            const list = Array.isArray(item[listKey]) ? item[listKey] : [];
            if (!list.length) return;
            let listChanged = false;
            const next = list.map((row) => {
                if (normalizeString(row?.managedListId) !== listId || !row || typeof row !== 'object') return row;
                const currentlyPaused = isManagedChannelListRowPaused(row);
                if (currentlyPaused === paused) return row;
                changedCount += 1;
                listChanged = true;
                const nextRow = { ...row };
                if (paused) {
                    nextRow.managedListPaused = true;
                } else {
                    delete nextRow.managedListPaused;
                }
                return nextRow;
            });
            if (listChanged) item[listKey] = next;
        });
        return {
            changed: changedCount > 0,
            changedCount
        };
    }

    function buildManagedChannelListCheckedMetadataPatch(selectedList, loaded, parsed, checkedAt) {
        const sourceMetadata = safeObject(parsed?.sourceMetadata);
        return {
            managedListSourceLabel: normalizeString(loaded?.sourceLabel) || normalizeString(selectedList?.sourceLabel) || 'Imported list',
            managedListSourceUrl: normalizeManagedChannelListSourceUrl(loaded?.url || selectedList?.sourceUrl),
            managedListSourceFormat: normalizeManagedChannelListSourceFormat(parsed?.sourceFormat || selectedList?.sourceFormat),
            managedListLastCheckedAt: checkedAt,
            managedListContentHash: normalizeString(parsed?.contentHash || selectedList?.contentHash),
            managedListSourceTitle: normalizeManagedChannelListMetadataValue(sourceMetadata.title),
            managedListSourceVersion: normalizeManagedChannelListMetadataValue(sourceMetadata.sourceVersion),
            managedListSourceUpdatedLabel: normalizeManagedChannelListMetadataValue(sourceMetadata.sourceUpdatedLabel),
            managedListSourceHomepage: normalizeManagedChannelListMetadataValue(sourceMetadata.homepage, 240)
        };
    }

    function applyManagedChannelListCheckedMetadataToSurface(target, surface, selectedList, loaded, parsed, checkedAt) {
        const item = safeObject(target);
        const listId = normalizeString(selectedList?.listId);
        if (!listId) return { changed: false, changedCount: 0 };
        const metadata = buildManagedChannelListCheckedMetadataPatch(selectedList, loaded, parsed, checkedAt);
        let changedCount = 0;
        getManagedChannelListSurfaceKeys(surface).forEach((listKey) => {
            const list = Array.isArray(item[listKey]) ? item[listKey] : [];
            if (!list.length) return;
            let listChanged = false;
            const next = list.map((row) => {
                if (normalizeString(row?.managedListId) !== listId || !row || typeof row !== 'object') return row;
                changedCount += 1;
                listChanged = true;
                const nextRow = {
                    ...row,
                    managedListSourceLabel: metadata.managedListSourceLabel,
                    managedListSourceUrl: metadata.managedListSourceUrl,
                    managedListSourceFormat: metadata.managedListSourceFormat,
                    managedListLastCheckedAt: metadata.managedListLastCheckedAt,
                    managedListContentHash: metadata.managedListContentHash
                };
                ['managedListSourceTitle', 'managedListSourceVersion', 'managedListSourceUpdatedLabel', 'managedListSourceHomepage'].forEach((field) => {
                    if (normalizeString(metadata[field])) {
                        nextRow[field] = metadata[field];
                    } else {
                        delete nextRow[field];
                    }
                });
                return nextRow;
            });
            if (listChanged) item[listKey] = next;
        });
        return {
            changed: changedCount > 0,
            changedCount
        };
    }

    function applyLoadedManagedChannelListCheckToProfiles({
        profiles,
        eligibleIds,
        currentActive,
        selectedList,
        loaded,
        parsed,
        checkedAt
    }) {
        const checkedProfileIds = [];
        const checkedSurfaces = new Set();
        let checkedCount = 0;

        for (const targetId of safeArray(eligibleIds)) {
            const profile = safeObject(profiles[targetId]);
            let nextProfile = profile;
            let profileChanged = false;
            let profileCheckedCount = 0;

            for (const surface of ['main', 'kids']) {
                const priorForReport = nextProfile;
                const nextSurface = getProfileSurface(nextProfile, surface);
                const result = applyManagedChannelListCheckedMetadataToSurface(nextSurface, surface, selectedList, loaded, parsed, checkedAt);
                if (!result.changed) continue;
                nextProfile = setProfileSurface(nextProfile, surface, nextSurface);
                const report = buildManagedChildLocalEditReport({
                    actorProfileId: currentActive,
                    targetProfileId: targetId,
                    surface,
                    priorProfile: priorForReport,
                    nextSurface
                });
                report.historyRow = {
                    ...report.historyRow,
                    actionType: 'policy.channel_list.check',
                    summary: {
                        ...safeObject(report.historyRow.summary),
                        label: 'Rule list checked',
                        surface,
                        checkedCount: result.changedCount || 0,
                        listEntryCount: countManagedRuleListRows(parsed).total,
                        contentChanged: false
                    }
                };
                nextProfile = recordManagedChildLocalEditHistory(nextProfile, report);
                profileChanged = true;
                profileCheckedCount += result.changedCount || 0;
                checkedSurfaces.add(surface);
            }

            if (!profileChanged) continue;
            profiles[targetId] = nextProfile;
            checkedCount += profileCheckedCount;
            checkedProfileIds.push(targetId);
        }

        return {
            checkedCount,
            checkedProfileIds,
            checkedSurfaces
        };
    }

    function applyLoadedManagedChannelListRefreshToProfiles({
        profiles,
        eligibleIds,
        currentActive,
        selectedList,
        loaded,
        parsed,
        refreshedAt
    }) {
        const changedProfileIds = [];
        const changedSurfaces = new Set();
        let changedCount = 0;
        let addedCount = 0;
        let removedCount = 0;
        let duplicateCount = 0;

        for (const targetId of safeArray(eligibleIds)) {
            const profile = safeObject(profiles[targetId]);
            let nextProfile = profile;
            let profileChanged = false;
            let profileAddedCount = 0;
            let profileRemovedCount = 0;
            let profileDuplicateCount = 0;

            for (const surface of ['main', 'kids']) {
                const currentSurface = getProfileSurface(nextProfile, surface);
                if (!hasManagedChannelListOnSurface(currentSurface, surface, selectedList.listId)) continue;
                const priorForReport = nextProfile;
                const nextSurface = getProfileSurface(nextProfile, surface);
                const removeResult = removeManagedChannelListFromSurface(nextSurface, surface, selectedList.listId);
                const applyResult = applyManagedChannelListToSurface(nextSurface, surface, parsed, {
                    listName: selectedList.listName,
                    sourceLabel: loaded.sourceLabel || selectedList.sourceLabel,
                    sourceUrl: loaded.url,
                    importedAt: refreshedAt,
                    lastCheckedAt: refreshedAt,
                    contentHash: parsed.contentHash,
                    paused: (Number(selectedList.pausedRuleCount ?? selectedList.pausedChannelCount) || 0) > 0
                        && (Number(selectedList.activeRuleCount ?? selectedList.activeChannelCount) || 0) <= 0
                });
                if (!removeResult.changed && !applyResult.changed) continue;
                nextProfile = setProfileSurface(nextProfile, surface, nextSurface);
                const report = buildManagedChildLocalEditReport({
                    actorProfileId: currentActive,
                    targetProfileId: targetId,
                    surface,
                    priorProfile: priorForReport,
                    nextSurface
                });
                report.historyRow = {
                    ...report.historyRow,
                    actionType: 'policy.channel_list.refresh',
                    summary: {
                        ...safeObject(report.historyRow.summary),
                        label: 'Rule list refreshed',
                        surface,
                        addedCount: applyResult.addedCount || 0,
                        removedCount: removeResult.removedCount || 0,
                        duplicateCount: applyResult.duplicateCount || 0,
                        skippedCount: parsed.skippedCount || 0,
                        listEntryCount: countManagedRuleListRows(parsed).total
                    }
                };
                nextProfile = recordManagedChildLocalEditHistory(nextProfile, report);
                profileChanged = true;
                profileAddedCount += applyResult.addedCount || 0;
                profileRemovedCount += removeResult.removedCount || 0;
                profileDuplicateCount += applyResult.duplicateCount || 0;
                changedSurfaces.add(surface);
            }

            duplicateCount += profileDuplicateCount;
            if (!profileChanged) continue;
            profiles[targetId] = nextProfile;
            changedCount += 1;
            addedCount += profileAddedCount;
            removedCount += profileRemovedCount;
            changedProfileIds.push(targetId);
        }

        return {
            changedCount,
            addedCount,
            removedCount,
            duplicateCount,
            changedProfileIds,
            changedSurfaces
        };
    }

    async function addManagedBulkRuleToProfiles(profileIds, ruleType) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        const type = ruleType === 'video' ? 'video' : (ruleType === 'channel' ? 'channel' : 'keyword');
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot change managed rules', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const surface = await promptManagedBulkRuleSurface(type);
        if (!surface) return;
        const value = await promptManagedBulkRuleValue(type);
        if (!value) {
            UIComponents.showToast(
                type === 'video' ? 'Enter a video ID to add' : (type === 'channel' ? 'Enter a channel to add' : 'Enter a keyword to add'),
                'error'
            );
            return;
        }
        if (type === 'channel' && !normalizeProfileChannel(value)) {
            UIComponents.showToast('Invalid format. Use @handle, Channel ID, c/ChannelName, or YouTube URL', 'error');
            return;
        }
        if (type === 'video' && !normalizeManagedVideoIdInput(value)) {
            UIComponents.showToast('Enter a valid YouTube watch/Shorts URL or 11-character video ID', 'error');
            return;
        }
        if (type === 'keyword' && !normalizeProfileKeyword(value, { comments: surface !== 'kids' })) {
            UIComponents.showToast('Enter a valid keyword', 'error');
            return;
        }

        const confirmBulk = await showConfirmModal({
            title: `Add ${managedBulkRuleTypeLabel(type)} to selected profiles?`,
            message: `This will add one ${managedBulkRuleTypeLabel(type)} to ${eligibleIds.length} protected ${eligibleIds.length === 1 ? 'profile' : 'profiles'} on ${surface === 'kids' ? 'YouTube Kids' : 'Main YouTube'} after parent/account re-auth.`,
            confirmText: `Add to ${eligibleIds.length} ${eligibleIds.length === 1 ? 'profile' : 'profiles'}`,
            cancelText: 'Cancel'
        });
        if (!confirmBulk) return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, `bulk_${type}_rule_unlock_failed`);
            }
            return;
        }

        let changedCount = 0;
        let duplicateCount = 0;
        const changedProfileIds = [];
        for (const targetId of eligibleIds) {
            const profile = safeObject(profiles[targetId]);
            const nextSurface = getProfileSurface(profile, surface);
            const result = addManagedRuleToSurface(nextSurface, surface, type, value);
            if (!result.changed) {
                if (result.duplicate) duplicateCount += 1;
                continue;
            }
            const nextProfile = setProfileSurface(profile, surface, nextSurface);
            const report = buildManagedChildLocalEditReport({
                actorProfileId: currentActive,
                targetProfileId: targetId,
                surface,
                priorProfile: profile,
                nextSurface
            });
            profiles[targetId] = recordManagedChildLocalEditHistory(nextProfile, report);
            changedCount += 1;
            changedProfileIds.push(targetId);
        }

        if (!changedCount) {
            UIComponents.showToast(
                duplicateCount ? 'Selected profiles already have that managed rule' : 'No selected profiles were changed',
                'info'
            );
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        await refreshProfilesUI();
        UIComponents.showToast(`${changedCount} ${changedCount === 1 ? 'profile' : 'profiles'} updated with managed ${managedBulkRuleTypeLabel(type)}`, 'success');

        const remoteScope = managedBulkRuleRemoteScope(type);
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyProfileCount = changedProfileIds.filter((targetId) => {
            const profile = safeObject(safeObject(profilesV4Cache).profiles)[targetId];
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, remoteScope, profile);
            if (!links.length) return false;
            return links.some(isNanahManagedLinkLiveConnected) || mailboxReady || localReady;
        }).length;
        if (readyProfileCount > 0) {
            const sendNow = await showConfirmModal({
                title: `Send ${managedBulkRuleTypeLabel(type)} update now?`,
                message: `${readyProfileCount} changed ${readyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path. Send the ${surface === 'kids' ? 'YouTube Kids' : 'Main YouTube'} ${managedBulkRuleTypeLabel(type)} rule update to those devices now.`,
                confirmText: 'Send update',
                cancelText: 'Not now'
            });
            if (sendNow) {
                await sendManagedParentPolicyToVerifiedDevices(changedProfileIds, {
                    scope: remoteScope,
                    surface
                });
            }
        }
    }

    async function importManagedChannelListToProfiles(profileIds, options = {}) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot import managed lists', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const importPayload = await showManagedChannelListImportModal({
            selectedCount: eligibleIds.length,
            targetLabel: normalizeString(options.targetLabel)
        });
        if (!importPayload) return;

        const parsed = parseManagedChannelListText(importPayload.text, { listName: importPayload.name });
        const parsedCounts = countManagedRuleListRows(parsed);
        if (!parsedCounts.total) {
            UIComponents.showToast('No valid channels or keywords found. CSV can use channel_id and keyword columns.', 'error');
            return;
        }

        const fixedSurfaces = [...new Set(safeArray(options.surfaces)
            .map(surface => surface === 'kids' ? 'kids' : (surface === 'main' ? 'main' : ''))
            .filter(Boolean))];
        const surfaces = fixedSurfaces.length ? fixedSurfaces : await promptManagedChannelListSurface();
        if (!surfaces.length) return;
        const surfaceLabel = surfaces.length > 1 ? 'Main + Kids' : (surfaces[0] === 'kids' ? 'YouTube Kids' : 'Main YouTube');
        const confirmImport = await showChoiceModal({
            title: 'Apply Rule List?',
            message: `${formatManagedRuleListCount(parsedCounts)} found. Apply this list to ${eligibleIds.length} protected ${eligibleIds.length === 1 ? 'profile' : 'profiles'} on ${surfaceLabel}.`,
            details: [
                `${formatManagedRuleListCount(parsedCounts)} ready`,
                parsed.skippedCount ? `${parsed.skippedCount} ${parsed.skippedCount === 1 ? 'row was' : 'rows were'} skipped` : 'No rows skipped',
                'Parent/account re-auth is required before anything changes.'
            ],
            choices: [
                { value: 'apply', label: 'Apply List', className: 'btn-primary' }
            ],
            cancelText: 'Cancel'
        });
        if (confirmImport !== 'apply') return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'channel_list_import_unlock_failed');
            }
            return;
        }

        const importedAt = Date.now();
        let changedCount = 0;
        let addedCount = 0;
        let duplicateCount = 0;
        const changedProfileIds = [];

        for (const targetId of eligibleIds) {
            const profile = safeObject(profiles[targetId]);
            let nextProfile = profile;
            let profileChanged = false;
            let profileAddedCount = 0;
            let profileDuplicateCount = 0;

            for (const surface of surfaces) {
                const priorForReport = nextProfile;
                const nextSurface = getProfileSurface(nextProfile, surface);
                const result = applyManagedChannelListToSurface(nextSurface, surface, parsed, {
                    listName: importPayload.name,
                    sourceLabel: importPayload.sourceLabel,
                    sourceUrl: importPayload.sourceUrl,
                    importedAt,
                    lastCheckedAt: importedAt,
                    contentHash: parsed.contentHash
                });
                profileDuplicateCount += result.duplicateCount || 0;
                if (!result.changed) continue;
                nextProfile = setProfileSurface(nextProfile, surface, nextSurface);
                const report = buildManagedChildLocalEditReport({
                    actorProfileId: currentActive,
                    targetProfileId: targetId,
                    surface,
                    priorProfile: priorForReport,
                    nextSurface
                });
                report.historyRow = {
                    ...report.historyRow,
                    actionType: 'policy.channel_list.import',
                    summary: {
                        ...safeObject(report.historyRow.summary),
                        label: 'Rule list imported',
                        surface: surfaces.length > 1 ? 'both' : surface,
                        addedCount: result.addedCount || 0,
                        channelAddedCount: result.channelAddedCount || 0,
                        keywordAddedCount: result.keywordAddedCount || 0,
                        duplicateCount: result.duplicateCount || 0,
                        skippedCount: parsed.skippedCount || 0,
                        listEntryCount: parsedCounts.total,
                        channelCount: parsedCounts.channels,
                        keywordCount: parsedCounts.keywords
                    }
                };
                nextProfile = recordManagedChildLocalEditHistory(nextProfile, report);
                profileChanged = true;
                profileAddedCount += result.addedCount || 0;
            }

            duplicateCount += profileDuplicateCount;
            if (!profileChanged) continue;
            profiles[targetId] = nextProfile;
            changedCount += 1;
            addedCount += profileAddedCount;
            changedProfileIds.push(targetId);
        }

        if (!changedCount) {
            UIComponents.showToast(
                duplicateCount ? 'Selected profiles already have this list' : 'No selected profiles were changed',
                'info'
            );
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        await refreshProfilesUI();
        renderChannels();
        renderKidsChannels();
        renderKeywords();
        renderKidsKeywords();
        UIComponents.showToast(
            `Imported ${addedCount} list-derived ${pluralize(addedCount, 'rule')} into ${changedCount} protected ${changedCount === 1 ? 'profile' : 'profiles'}`,
            'success'
        );

        const remoteScope = surfaces.length > 1 || (parsedCounts.channels && parsedCounts.keywords)
            ? 'rules_bundle'
            : (parsedCounts.keywords ? 'keywords' : 'channels');
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyProfileCount = changedProfileIds.filter((targetId) => {
            const profile = safeObject(safeObject(profilesV4Cache).profiles)[targetId];
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, remoteScope, profile);
            if (!links.length) return false;
            return links.some(isNanahManagedLinkLiveConnected) || mailboxReady || localReady;
        }).length;
        if (readyProfileCount > 0) {
            const sendNow = await showConfirmModal({
                title: 'Send list update now?',
                message: `${readyProfileCount} changed ${readyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path. Send this rule-list update to those devices now.`,
                confirmText: 'Send update',
                cancelText: 'Not now'
            });
            if (sendNow) {
                await sendManagedParentPolicyToVerifiedDevices(changedProfileIds, {
                    scope: remoteScope,
                    ...(surfaces.length === 1 ? { surface: surfaces[0] } : {})
                });
            }
        }
    }

    function formatRuleListSurfaceLabel(surfaces) {
        const items = [...new Set(safeArray(surfaces).map(surface => surface === 'kids' ? 'kids' : (surface === 'main' ? 'main' : '')).filter(Boolean))];
        if (items.length > 1) return 'Main YouTube + YouTube Kids';
        return items[0] === 'kids' ? 'YouTube Kids' : 'Main YouTube';
    }

    function getSettingsRuleListImportSurfaces() {
        const selected = document.querySelector('input[name="ftRuleListImportTarget"]:checked');
        const value = normalizeString(selected?.value).toLowerCase();
        if (value === 'kids') return ['kids'];
        if (value === 'both') return ['main', 'kids'];
        return ['main'];
    }

    async function importManagedRuleListToActiveProfileSurfaces(surfaces) {
        const targetSurfaces = [...new Set(safeArray(surfaces)
            .map(surface => surface === 'kids' ? 'kids' : (surface === 'main' ? 'main' : ''))
            .filter(Boolean))];
        if (!targetSurfaces.length) targetSurfaces.push('main');
        const surfaceLabel = formatRuleListSurfaceLabel(targetSurfaces);
        const managedProfileId = normalizeString(managedChildEdit?.profileId);
        if (managedProfileId && targetSurfaces.every(surface => isManagedChildEditFor(surface))) {
            await importManagedChannelListToProfiles([managedProfileId], {
                surfaces: targetSurfaces,
                targetLabel: `${getProfileName(profilesV4Cache, managedProfileId)} ${surfaceLabel} rules`
            });
            return;
        }

        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || activeProfileId || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Open the parent/account profile to import rules for a child profile', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const profile = safeObject(profiles[currentActive]);
        if (!profile || Object.keys(profile).length === 0) {
            UIComponents.showToast('Active profile is unavailable', 'error');
            return;
        }

        const importPayload = await showManagedChannelListImportModal({
            selectedCount: 1,
            targetLabel: `${getProfileName(fresh, currentActive)} ${surfaceLabel} rules`
        });
        if (!importPayload) return;

        const parsed = parseManagedChannelListText(importPayload.text, { listName: importPayload.name });
        const parsedCounts = countManagedRuleListRows(parsed);
        if (!parsedCounts.total) {
            UIComponents.showToast('No valid channels or keywords found. CSV can use channel_id and keyword columns.', 'error');
            return;
        }

        const confirmImport = await showChoiceModal({
            title: `Apply CSV to ${surfaceLabel}?`,
            message: `${formatManagedRuleListCount(parsedCounts)} found. Apply this list to ${getProfileName(fresh, currentActive)} on ${surfaceLabel}.`,
            details: [
                `${formatManagedRuleListCount(parsedCounts)} ready`,
                parsed.skippedCount ? `${parsed.skippedCount} ${parsed.skippedCount === 1 ? 'row was' : 'rows were'} skipped` : 'No rows skipped',
                'Nothing changes until you confirm.'
            ],
            choices: [
                { value: 'apply', label: 'Apply List', className: 'btn-primary' }
            ],
            cancelText: 'Cancel'
        });
        if (confirmImport !== 'apply') return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) return;

        const importedAt = Date.now();
        let nextProfile = profile;
        let changed = false;
        let addedCount = 0;
        let duplicateCount = 0;
        for (const targetSurface of targetSurfaces) {
            const nextSurface = getProfileSurface(nextProfile, targetSurface);
            const result = applyManagedChannelListToSurface(nextSurface, targetSurface, parsed, {
                listName: importPayload.name,
                sourceLabel: importPayload.sourceLabel,
                sourceUrl: importPayload.sourceUrl,
                importedAt,
                lastCheckedAt: importedAt,
                contentHash: parsed.contentHash
            });
            duplicateCount += result.duplicateCount || 0;
            if (!result.changed) continue;
            nextProfile = setProfileSurface(nextProfile, targetSurface, nextSurface);
            changed = true;
            addedCount += result.addedCount || 0;
        }

        if (!changed) {
            UIComponents.showToast(
                duplicateCount ? 'This profile already has that list' : 'No profile rules were changed',
                'info'
            );
            return;
        }

        profiles[currentActive] = nextProfile;
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            activeProfileId: currentActive,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, activeProfileId: currentActive, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        await refreshProfilesUI();
        renderChannels();
        renderKidsChannels();
        renderKeywords();
        renderKidsKeywords();
        UIComponents.showToast(`Imported ${addedCount} ${pluralize(addedCount, 'rule')} into ${surfaceLabel}`, 'success');
    }

    async function removeManagedChannelListFromProfiles(profileIds) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot remove managed lists', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const summaries = collectManagedChannelListSummaries(profiles, eligibleIds);
        if (!summaries.length) {
            UIComponents.showToast('No imported rule lists found for the selected protected profiles', 'info');
            return;
        }

        const selectedList = await promptManagedChannelListToRemove(summaries);
        if (!selectedList) return;

        const confirmRemove = await showConfirmModal({
            title: `Remove ${selectedList.listName}?`,
            message: `This removes ${selectedList.ruleCount || selectedList.channelCount} list-derived ${pluralize(selectedList.ruleCount || selectedList.channelCount, 'rule')} from ${selectedList.profileIds.length} selected ${pluralize(selectedList.profileIds.length, 'profile')}. Manual rules stay untouched.`,
            confirmText: 'Remove List',
            cancelText: 'Cancel'
        });
        if (!confirmRemove) return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'channel_list_remove_unlock_failed');
            }
            return;
        }

        let changedCount = 0;
        let removedCount = 0;
        const changedProfileIds = [];
        const changedSurfaces = new Set();

        for (const targetId of eligibleIds) {
            const profile = safeObject(profiles[targetId]);
            let nextProfile = profile;
            let profileChanged = false;
            let profileRemovedCount = 0;

            for (const surface of ['main', 'kids']) {
                const priorForReport = nextProfile;
                const nextSurface = getProfileSurface(nextProfile, surface);
                const result = removeManagedChannelListFromSurface(nextSurface, surface, selectedList.listId);
                if (!result.changed) continue;
                nextProfile = setProfileSurface(nextProfile, surface, nextSurface);
                const report = buildManagedChildLocalEditReport({
                    actorProfileId: currentActive,
                    targetProfileId: targetId,
                    surface,
                    priorProfile: priorForReport,
                    nextSurface
                });
                report.historyRow = {
                    ...report.historyRow,
                    actionType: 'policy.channel_list.remove',
                    summary: {
                        ...safeObject(report.historyRow.summary),
                        label: 'Rule list removed',
                        surface,
                        removedCount: result.removedCount || 0,
                        listEntryCount: selectedList.ruleCount || selectedList.channelCount || 0
                    }
                };
                nextProfile = recordManagedChildLocalEditHistory(nextProfile, report);
                profileChanged = true;
                profileRemovedCount += result.removedCount || 0;
                changedSurfaces.add(surface);
            }

            if (!profileChanged) continue;
            profiles[targetId] = nextProfile;
            changedCount += 1;
            removedCount += profileRemovedCount;
            changedProfileIds.push(targetId);
        }

        if (!changedCount) {
            UIComponents.showToast('No selected profiles had that imported list', 'info');
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        await refreshProfilesUI();
        renderChannels();
        renderKidsChannels();
        renderKeywords();
        renderKidsKeywords();
        UIComponents.showToast(
            `Removed ${removedCount} list-derived ${pluralize(removedCount, 'rule')} from ${changedCount} protected ${pluralize(changedCount, 'profile')}`,
            'success'
        );

        const remoteScope = 'rules_bundle';
        const surface = changedSurfaces.size === 1 ? Array.from(changedSurfaces)[0] : '';
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyProfileCount = changedProfileIds.filter((targetId) => {
            const profile = safeObject(safeObject(profilesV4Cache).profiles)[targetId];
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, remoteScope, profile);
            if (!links.length) return false;
            return links.some(isNanahManagedLinkLiveConnected) || mailboxReady || localReady;
        }).length;
        if (readyProfileCount > 0) {
            const sendNow = await showConfirmModal({
                title: 'Send removal update now?',
                message: `${readyProfileCount} changed ${readyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path. Send this list-removal update to those devices now.`,
                confirmText: 'Send update',
                cancelText: 'Not now'
            });
            if (sendNow) {
                await sendManagedParentPolicyToVerifiedDevices(changedProfileIds, {
                    scope: remoteScope,
                    ...(surface ? { surface } : {})
                });
            }
        }
    }

    async function setManagedChannelListPausedForProfiles(profileIds, paused) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot change managed lists', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const summaries = collectManagedChannelListSummaries(profiles, eligibleIds);
        const selectedList = await promptManagedChannelListToPauseState(summaries, paused);
        if (!selectedList) {
            UIComponents.showToast(
                paused
                    ? 'No active imported lists found for the selected protected profiles'
                    : 'No paused imported lists found for the selected protected profiles',
                'info'
            );
            return;
        }

        const confirmChange = await showConfirmModal({
            title: `${paused ? 'Pause' : 'Resume'} ${selectedList.listName}?`,
            message: paused
                ? `This keeps ${selectedList.listName} saved, but stops its list-derived rules from affecting ${selectedList.profileIds.length} selected ${pluralize(selectedList.profileIds.length, 'profile')}. Manual rules stay active.`
                : `This turns ${selectedList.listName} back on for ${selectedList.profileIds.length} selected ${pluralize(selectedList.profileIds.length, 'profile')}.`,
            confirmText: paused ? 'Pause List' : 'Resume List',
            cancelText: 'Cancel'
        });
        if (!confirmChange) return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, paused ? 'channel_list_pause_unlock_failed' : 'channel_list_resume_unlock_failed');
            }
            return;
        }

        let changedProfileCount = 0;
        let changedRowCount = 0;
        const changedProfileIds = [];
        const changedSurfaces = new Set();

        for (const targetId of eligibleIds) {
            const profile = safeObject(profiles[targetId]);
            let nextProfile = profile;
            let profileChanged = false;
            let profileRowCount = 0;

            for (const surface of ['main', 'kids']) {
                const priorForReport = nextProfile;
                const nextSurface = getProfileSurface(nextProfile, surface);
                const result = setManagedChannelListPausedOnSurface(nextSurface, surface, selectedList.listId, paused);
                if (!result.changed) continue;
                nextProfile = setProfileSurface(nextProfile, surface, nextSurface);
                const report = buildManagedChildLocalEditReport({
                    actorProfileId: currentActive,
                    targetProfileId: targetId,
                    surface,
                    priorProfile: priorForReport,
                    nextSurface
                });
                report.historyRow = {
                    ...report.historyRow,
                    actionType: paused ? 'policy.channel_list.pause' : 'policy.channel_list.resume',
                    summary: {
                        ...safeObject(report.historyRow.summary),
                        label: paused ? 'Rule list paused' : 'Rule list resumed',
                        surface,
                        changedCount: result.changedCount || 0,
                        listEntryCount: selectedList.ruleCount || selectedList.channelCount || 0
                    }
                };
                nextProfile = recordManagedChildLocalEditHistory(nextProfile, report);
                profileChanged = true;
                profileRowCount += result.changedCount || 0;
                changedSurfaces.add(surface);
            }

            if (!profileChanged) continue;
            profiles[targetId] = nextProfile;
            changedProfileCount += 1;
            changedRowCount += profileRowCount;
            changedProfileIds.push(targetId);
        }

        if (!changedProfileCount) {
            UIComponents.showToast(`No selected profiles needed that list ${paused ? 'paused' : 'resumed'}`, 'info');
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        await refreshProfilesUI();
        renderChannels();
        renderKidsChannels();
        renderKeywords();
        renderKidsKeywords();
        UIComponents.showToast(
            `${paused ? 'Paused' : 'Resumed'} ${changedRowCount} list-derived ${pluralize(changedRowCount, 'rule')} across ${changedProfileCount} protected ${pluralize(changedProfileCount, 'profile')}`,
            'success'
        );

        const remoteScope = 'rules_bundle';
        const surface = changedSurfaces.size === 1 ? Array.from(changedSurfaces)[0] : '';
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyProfileCount = changedProfileIds.filter((targetId) => {
            const profile = safeObject(safeObject(profilesV4Cache).profiles)[targetId];
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, remoteScope, profile);
            if (!links.length) return false;
            return links.some(isNanahManagedLinkLiveConnected) || mailboxReady || localReady;
        }).length;
        if (readyProfileCount > 0) {
            const sendNow = await showConfirmModal({
                title: `Send ${paused ? 'pause' : 'resume'} update now?`,
                message: `${readyProfileCount} changed ${readyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path. Send this list ${paused ? 'pause' : 'resume'} update to those devices now.`,
                confirmText: 'Send update',
                cancelText: 'Not now'
            });
            if (sendNow) {
                await sendManagedParentPolicyToVerifiedDevices(changedProfileIds, {
                    scope: remoteScope,
                    ...(surface ? { surface } : {})
                });
            }
        }
    }

    async function refreshManagedChannelListForProfiles(profileIds) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot refresh managed lists', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const summaries = collectManagedChannelListSummaries(profiles, eligibleIds);
        const selectedList = await promptManagedChannelListToRefresh(summaries);
        if (!selectedList) {
            if (!summaries.some(summary => normalizeManagedChannelListSourceUrl(summary?.sourceUrl))) {
                UIComponents.showToast('No URL-backed imported lists found for the selected protected profiles', 'info');
            }
            return;
        }

        let refreshCandidate;
        try {
            refreshCandidate = await loadManagedChannelListRefreshCandidate(selectedList);
        } catch (error) {
            UIComponents.showToast(error?.message || 'Unable to load this list URL', 'error');
            return;
        }

        const parsed = refreshCandidate.parsed;
        const parsedCounts = countManagedRuleListRows(parsed);
        const unchangedContentHash = normalizeString(selectedList.contentHash)
            && normalizeString(selectedList.contentHash) === normalizeString(parsed.contentHash);

        const confirmRefresh = await showChoiceModal({
            title: unchangedContentHash ? `Check ${selectedList.listName}?` : `Refresh ${selectedList.listName}?`,
            message: unchangedContentHash
                ? `The saved URL content matches the current source hash. FilterTube will update checked/source metadata only after parent/account unlock.`
                : `This will replace the current list-derived rows for ${selectedList.profileIds.length} selected ${pluralize(selectedList.profileIds.length, 'profile')} with the latest rules from the saved URL.`,
            details: [
                unchangedContentHash
                    ? `${selectedList.ruleCount || selectedList.channelCount} current ${pluralize(selectedList.ruleCount || selectedList.channelCount, 'rule')} stay unchanged`
                    : `${selectedList.ruleCount || selectedList.channelCount} current ${pluralize(selectedList.ruleCount || selectedList.channelCount, 'rule')} will be replaced where this list is present`,
                `${formatManagedRuleListCount(parsedCounts)} found in the latest URL content`,
                unchangedContentHash ? 'No rule rows will be replaced because the source hash is unchanged' : 'Changed source content will replace matching list-derived rows',
                parsed.skippedCount ? `${parsed.skippedCount} ${pluralize(parsed.skippedCount, 'row')} skipped for safety` : 'No rows skipped',
                'Parent/account re-auth is required before anything changes.'
            ],
            choices: [
                { value: 'refresh', label: unchangedContentHash ? 'Update Checked Time' : 'Refresh List', className: 'btn-primary' }
            ],
            cancelText: 'Cancel'
        });
        if (confirmRefresh !== 'refresh') return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'channel_list_refresh_unlock_failed');
            }
            return;
        }

        const refreshedAt = Date.now();
        const refreshResult = unchangedContentHash
            ? {
                ...applyLoadedManagedChannelListCheckToProfiles({
                    profiles,
                    eligibleIds,
                    currentActive,
                    selectedList,
                    loaded: refreshCandidate.loaded,
                    parsed,
                    checkedAt: refreshedAt
                }),
                changedCount: 0,
                addedCount: 0,
                removedCount: 0,
                duplicateCount: 0,
                changedProfileIds: [],
                changedSurfaces: new Set()
            }
            : applyLoadedManagedChannelListRefreshToProfiles({
                profiles,
                eligibleIds,
                currentActive,
                selectedList,
                loaded: refreshCandidate.loaded,
                parsed,
                refreshedAt
            });
        const {
            changedCount,
            addedCount,
            removedCount,
            duplicateCount,
            changedProfileIds,
            changedSurfaces
        } = refreshResult;

        if (!changedCount && !refreshResult.checkedProfileIds?.length) {
            UIComponents.showToast('No selected profiles had that URL-backed list', 'info');
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        await refreshProfilesUI();
        renderChannels();
        renderKidsChannels();
        renderKeywords();
        renderKidsKeywords();
        if (unchangedContentHash) {
            UIComponents.showToast(
                `Checked ${selectedList.listName}: no rule changes`,
                'success'
            );
            return;
        }
        UIComponents.showToast(
            `Refreshed ${selectedList.listName}: ${addedCount} added, ${removedCount} replaced${duplicateCount ? `, ${duplicateCount} already present` : ''}`,
            'success'
        );

        const remoteScope = 'rules_bundle';
        const surface = changedSurfaces.size === 1 ? Array.from(changedSurfaces)[0] : '';
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyProfileCount = changedProfileIds.filter((targetId) => {
            const profile = safeObject(safeObject(profilesV4Cache).profiles)[targetId];
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, remoteScope, profile);
            if (!links.length) return false;
            return links.some(isNanahManagedLinkLiveConnected) || mailboxReady || localReady;
        }).length;
        if (readyProfileCount > 0) {
            const sendNow = await showConfirmModal({
                title: 'Send refreshed list now?',
                message: `${readyProfileCount} changed ${readyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path. Send this refreshed list update to those devices now.`,
                confirmText: 'Send update',
                cancelText: 'Not now'
            });
            if (sendNow) {
                await sendManagedParentPolicyToVerifiedDevices(changedProfileIds, {
                    scope: remoteScope,
                    ...(surface ? { surface } : {})
                });
            }
        }
    }

    async function refreshAllManagedChannelListsForProfiles(profileIds, options = {}) {
        const staleOnly = safeObject(options).staleOnly === true;
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot refresh managed lists', 'error');
            return;
        }

        const profiles = { ...safeObject(fresh.profiles) };
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const summaries = collectManagedChannelListSummaries(profiles, eligibleIds);
        const urlBacked = summaries.filter(summary => isManagedChannelListSummaryUrlBacked(summary));
        const refreshTargets = staleOnly
            ? urlBacked.filter(summary => isManagedChannelListSummaryStale(summary))
            : urlBacked;
        if (!urlBacked.length) {
            UIComponents.showToast('No URL-backed imported lists found for the selected protected profiles', 'info');
            return;
        }
        if (!refreshTargets.length) {
            UIComponents.showToast('No stale URL-backed lists found for the selected protected profiles', 'info');
            return;
        }

        const loadedCandidates = [];
        const failedCandidates = [];
        for (const summary of refreshTargets) {
            try {
                loadedCandidates.push(await loadManagedChannelListRefreshCandidate(summary));
            } catch (error) {
                failedCandidates.push({
                    listName: normalizeString(summary?.listName) || 'Imported rule list',
                    error: error?.message || 'Unable to load'
                });
            }
        }
        if (!loadedCandidates.length) {
            UIComponents.showToast('No URL-backed lists could be loaded for refresh', 'error');
            return;
        }

        const contentChangedCandidates = loadedCandidates.filter((item) => {
            const priorHash = normalizeString(item?.selectedList?.contentHash);
            const nextHash = normalizeString(item?.parsed?.contentHash);
            return !priorHash || priorHash !== nextHash;
        });
        const unchangedCandidates = loadedCandidates.filter(item => !contentChangedCandidates.includes(item));
        const totalValidRules = loadedCandidates.reduce((total, item) => total + countManagedRuleListRows(item?.parsed).total, 0);
        const totalSkippedRows = loadedCandidates.reduce((total, item) => total + (Number(item?.parsed?.skippedCount) || 0), 0);
        const confirmRefresh = await showChoiceModal({
            title: staleOnly
                ? `Check ${loadedCandidates.length} stale URL ${pluralize(loadedCandidates.length, 'list')}?`
                : `Check ${loadedCandidates.length} URL-backed ${pluralize(loadedCandidates.length, 'list')}?`,
            message: `FilterTube loaded ${loadedCandidates.length} ${staleOnly ? 'stale ' : ''}URL-backed ${pluralize(loadedCandidates.length, 'list')} for ${eligibleIds.length} selected protected ${pluralize(eligibleIds.length, 'profile')}. Changed sources will refresh rule rows; unchanged sources only update checked metadata.`,
            details: [
                `${totalValidRules} valid ${pluralize(totalValidRules, 'rule')} found across loaded lists`,
                `${contentChangedCandidates.length} ${pluralize(contentChangedCandidates.length, 'list')} changed | ${unchangedCandidates.length} unchanged`,
                totalSkippedRows ? `${totalSkippedRows} ${pluralize(totalSkippedRows, 'row')} skipped for safety` : 'No rows skipped',
                failedCandidates.length ? `${failedCandidates.length} ${pluralize(failedCandidates.length, 'list')} could not be loaded and will be left unchanged` : 'All URL-backed lists loaded',
                'Parent/account re-auth is required before anything changes.'
            ],
            choices: [
                { value: 'refresh_all', label: contentChangedCandidates.length ? 'Refresh Changed Lists' : 'Update Checked Time', className: 'btn-primary' }
            ],
            cancelText: 'Cancel'
        });
        if (confirmRefresh !== 'refresh_all') return;

        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of eligibleIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'channel_list_refresh_all_unlock_failed');
            }
            return;
        }

        const refreshedAt = Date.now();
        const changedProfileIdsSet = new Set();
        const checkedProfileIdsSet = new Set();
        const changedSurfaces = new Set();
        let changedListCount = 0;
        let checkedListCount = 0;
        let checkedRowCount = 0;
        let addedCount = 0;
        let removedCount = 0;
        let duplicateCount = 0;

        for (const candidate of contentChangedCandidates) {
            const result = applyLoadedManagedChannelListRefreshToProfiles({
                profiles,
                eligibleIds,
                currentActive,
                selectedList: candidate.selectedList,
                loaded: candidate.loaded,
                parsed: candidate.parsed,
                refreshedAt
            });
            if (!result.changedCount) continue;
            changedListCount += 1;
            addedCount += result.addedCount;
            removedCount += result.removedCount;
            duplicateCount += result.duplicateCount;
            safeArray(result.changedProfileIds).forEach(id => changedProfileIdsSet.add(id));
            result.changedSurfaces.forEach(surface => changedSurfaces.add(surface));
        }

        for (const candidate of unchangedCandidates) {
            const result = applyLoadedManagedChannelListCheckToProfiles({
                profiles,
                eligibleIds,
                currentActive,
                selectedList: candidate.selectedList,
                loaded: candidate.loaded,
                parsed: candidate.parsed,
                checkedAt: refreshedAt
            });
            if (!result.checkedProfileIds.length) continue;
            checkedListCount += 1;
            checkedRowCount += result.checkedCount;
            safeArray(result.checkedProfileIds).forEach(id => checkedProfileIdsSet.add(id));
        }

        if (!changedProfileIdsSet.size && !checkedProfileIdsSet.size) {
            UIComponents.showToast('Loaded URL-backed lists were not present on selected protected profiles', 'info');
            return;
        }

        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });
        await refreshProfilesUI();
        renderChannels();
        renderKidsChannels();
        renderKeywords();
        renderKidsKeywords();
        if (changedListCount) {
            UIComponents.showToast(
                `Refreshed ${changedListCount} ${pluralize(changedListCount, 'list')}: ${addedCount} added, ${removedCount} replaced${duplicateCount ? `, ${duplicateCount} already present` : ''}${checkedListCount ? `; checked ${checkedListCount} unchanged` : ''}`,
                'success'
            );
        } else {
            UIComponents.showToast(
                `Checked ${checkedListCount} ${pluralize(checkedListCount, 'list')}: no rule changes${checkedRowCount ? ` across ${checkedRowCount} rows` : ''}`,
                'success'
            );
            return;
        }

        const changedProfileIds = Array.from(changedProfileIdsSet);
        const remoteScope = 'rules_bundle';
        const surface = changedSurfaces.size === 1 ? Array.from(changedSurfaces)[0] : '';
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyProfileCount = changedProfileIds.filter((targetId) => {
            const profile = safeObject(safeObject(profilesV4Cache).profiles)[targetId];
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, remoteScope, profile);
            if (!links.length) return false;
            return links.some(isNanahManagedLinkLiveConnected) || mailboxReady || localReady;
        }).length;
        if (readyProfileCount > 0) {
            const sendNow = await showConfirmModal({
                title: staleOnly ? 'Send refreshed stale lists now?' : 'Send refreshed lists now?',
                message: `${readyProfileCount} changed ${readyProfileCount === 1 ? 'profile has' : 'profiles have'} a verified delivery path. Send these refreshed list updates to those devices now.`,
                confirmText: 'Send update',
                cancelText: 'Not now'
            });
            if (sendNow) {
                await sendManagedParentPolicyToVerifiedDevices(changedProfileIds, {
                    scope: remoteScope,
                    ...(surface ? { surface } : {})
                });
            }
        }
    }

    async function manageManagedChannelListsForProfiles(profileIds) {
        const targetIds = [...new Set(safeArray(profileIds).map(normalizeString).filter(Boolean))];
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile', 'error');
            return;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Child profiles cannot manage lists', 'error');
            return;
        }

        const profiles = safeObject(fresh.profiles);
        const eligibleIds = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return !!profile && Object.keys(profile).length > 0
                && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!eligibleIds.length) {
            UIComponents.showToast('No selected protected profiles can be managed by this account', 'error');
            return;
        }

        const summaries = collectManagedChannelListSummaries(profiles, eligibleIds);
        const urlBackedCount = summaries.filter(summary => isManagedChannelListSummaryUrlBacked(summary)).length;
        const staleUrlBackedCount = summaries.filter(summary => isManagedChannelListSummaryStale(summary)).length;
        const activeListCount = summaries.filter(summary => (Number(summary.activeRuleCount ?? summary.activeChannelCount) || 0) > 0).length;
        const pausedListCount = summaries.filter(summary => (Number(summary.pausedRuleCount ?? summary.pausedChannelCount) || 0) > 0).length;
        const details = summaries.length
            ? [
                `${summaries.length} imported ${pluralize(summaries.length, 'list')} across ${eligibleIds.length} selected ${pluralize(eligibleIds.length, 'profile')}`,
                `${activeListCount} active | ${pausedListCount} paused`,
                staleUrlBackedCount ? `${staleUrlBackedCount} URL-backed ${pluralize(staleUrlBackedCount, 'list')} need refresh` : 'No stale URL-backed lists',
                urlBackedCount ? `${urlBackedCount} URL-backed ${pluralize(urlBackedCount, 'list')} can be refreshed` : 'No URL-backed lists to refresh yet'
            ]
            : [
                `No imported lists yet for ${eligibleIds.length} selected ${pluralize(eligibleIds.length, 'profile')}`,
                'Start by importing a pasted, file, or public HTTPS rule list.'
            ];
        const choices = [
            ...(summaries.length ? [{ value: 'view', label: 'View Lists', className: 'btn-secondary' }] : []),
            { value: 'import', label: 'Import List', className: 'btn-primary' },
            ...(activeListCount ? [{ value: 'pause', label: 'Pause List', className: 'btn-secondary' }] : []),
            ...(pausedListCount ? [{ value: 'resume', label: 'Resume List', className: 'btn-secondary' }] : []),
            ...(urlBackedCount ? [{ value: 'refresh', label: 'Check URL', className: 'btn-secondary' }] : []),
            ...(staleUrlBackedCount ? [{ value: 'refresh_stale', label: 'Check Stale URLs', className: 'btn-secondary' }] : []),
            ...(urlBackedCount > 1 ? [{ value: 'refresh_all', label: 'Check All URLs', className: 'btn-secondary' }] : []),
            ...(summaries.length ? [{ value: 'remove', label: 'Remove List', className: 'btn-secondary' }] : [])
        ];
        const selected = await showChoiceModal({
            title: 'Rule Lists',
            message: 'Choose what to do with imported rule lists for the selected protected profiles.',
            details,
            choices,
            cancelText: 'Cancel'
        });
        if (selected === 'view') {
            await showManagedChannelListLibraryModal(summaries);
        } else if (selected === 'import') {
            await importManagedChannelListToProfiles(eligibleIds);
        } else if (selected === 'pause') {
            await setManagedChannelListPausedForProfiles(eligibleIds, true);
        } else if (selected === 'resume') {
            await setManagedChannelListPausedForProfiles(eligibleIds, false);
        } else if (selected === 'refresh') {
            await refreshManagedChannelListForProfiles(eligibleIds);
        } else if (selected === 'refresh_stale') {
            await refreshAllManagedChannelListsForProfiles(eligibleIds, { staleOnly: true });
        } else if (selected === 'refresh_all') {
            await refreshAllManagedChannelListsForProfiles(eligibleIds);
        } else if (selected === 'remove') {
            await removeManagedChannelListFromProfiles(eligibleIds);
        }
    }

    function isUiLocked() {
        const profilesV4 = profilesV4Cache;
        if (!profilesV4) {
            return document.body.classList.contains('ft-app-locked');
        }
        return getProfileType(profilesV4, activeProfileId) === 'child' ||
            !!(profilesV4 && isProfileLocked(profilesV4, activeProfileId) && !isProfileUnlockSessionValid.check(activeProfileId));
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
            locked: isProfileLocked(profilesV4, profileId) && !isProfileUnlockSessionValid.check(profileId)
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
                    locked: isProfileLocked(root, profileId) && !isProfileUnlockSessionValid.check(profileId)
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

        if (getActiveProfileType() === 'child' && !CHILD_ALLOWED_VIEWS.has(viewId)) {
            return { viewId: 'help', reason: 'child_profile' };
        }

        if (getActiveProfileType() !== 'child' && isUiLocked() && !LOCK_ALLOWED_VIEWS.has(viewId)) {
            return { viewId: 'help', reason: 'locked' };
        }

        return { viewId, reason: null };
    }

    function updateNavigationAccessUI() {
        const locked = isUiLocked();
        const childProfile = getActiveProfileType() === 'child';
        document.body.classList.toggle('ft-child-profile', childProfile);

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
            const tab = normalizeString(item.getAttribute('data-tab'));
            let disabled = false;
            if (locked || childProfile) {
                disabled = tab && !isViewAllowedForCurrentAccess(tab);
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
        const isLocked = profilesV4 && isProfileLocked(profilesV4, activeProfileId) && !isProfileUnlockSessionValid.check(activeProfileId);
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
        const copy = getProfileAccessCopy(profilesV4, activeProfileId);
        const h3 = document.createElement('h3');
        h3.textContent = copy.gateTitle;
        header.appendChild(h3);

        const body = document.createElement('div');
        body.className = 'card-body';
        const hint = document.createElement('div');
        hint.className = 'import-export-hint';
        hint.textContent = copy.gateMessage;

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

    async function showPromptModal({ eyebrow = '', title, message, placeholder = '', inputType = 'text', confirmText = 'Confirm', cancelText = 'Cancel', initialValue = '' }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ft-modal-overlay';

            const card = document.createElement('div');
            card.className = 'card ft-modal';

            const header = document.createElement('div');
            header.className = 'card-header';
            if (eyebrow) {
                const eyebrowEl = document.createElement('div');
                eyebrowEl.className = 'ft-modal-eyebrow';
                eyebrowEl.textContent = eyebrow;
                header.appendChild(eyebrowEl);
            }
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

    async function showConfirmModal({ eyebrow = '', title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ft-modal-overlay';

            const card = document.createElement('div');
            card.className = 'card ft-modal';

            const header = document.createElement('div');
            header.className = 'card-header';
            if (eyebrow) {
                const eyebrowEl = document.createElement('div');
                eyebrowEl.className = 'ft-modal-eyebrow';
                eyebrowEl.textContent = eyebrow;
                header.appendChild(eyebrowEl);
            }
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

            const onKeydown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelBtn.click();
                }
            };
            const cleanup = () => {
                document.removeEventListener('keydown', onKeydown);
                try {
                    overlay.remove();
                } catch (e) {
                }
            };
            const closeWith = (value) => {
                cleanup();
                resolve(value);
            };
            cancelBtn.addEventListener('click', () => closeWith(false));
            okBtn.addEventListener('click', () => closeWith(true));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cancelBtn.click();
            });
            document.addEventListener('keydown', onKeydown);

            actions.append(cancelBtn, okBtn);
            body.appendChild(actions);
            card.append(header, body);
            overlay.appendChild(card);
            document.body.appendChild(overlay);
            okBtn.focus();
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
            .replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g, '')
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
        if (normalized === 'source') return 'This device controls another profile';
        if (normalized === 'replica') return 'This device receives protected updates';
        return 'My other device';
    }

    function getNanahScope() {
        const raw = normalizeString(ftNanahScope?.value).toLowerCase();
        if (getActiveProfileType() === 'child' && raw === 'full') return 'active';
        if ([
            'main',
            'kids',
            'full',
            'active',
            'videos',
            'keywords',
            'channels',
            'rules_bundle',
            'viewing_space',
            'time_limits'
        ].includes(raw)) return raw;
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

    function getNanahManagedPolicyScopeList(value) {
        const list = Array.isArray(value) ? value : [value];
        const normalized = list
            .map((item) => normalizeString(item).toLowerCase())
            .flatMap((item) => {
                if (item === 'rules_bundle') return ['keywords', 'channels', 'videos'];
                if (item === 'active' || item === 'full') return ['main', 'kids', 'viewing_space', 'time_limits'];
                return [item];
            })
            .filter((item) => [
                'main',
                'kids',
                'videos',
                'keywords',
                'channels',
                'rules_bundle',
                'viewing_space',
                'time_limits'
            ].includes(item));
        return Array.from(new Set(normalized));
    }

    function getNanahManagedSendScopeList(value) {
        const list = Array.isArray(value) ? value : [value];
        const normalized = list
            .map((item) => normalizeString(item).toLowerCase())
            .flatMap((item) => item === 'rules_bundle' ? ['keywords', 'channels', 'videos'] : [item])
            .filter((item) => [
                'active',
                'main',
                'kids',
                'full',
                'videos',
                'keywords',
                'channels',
                'rules_bundle',
                'viewing_space',
                'time_limits'
            ].includes(item));
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
        if (normalized === 'videos') return 'Videos';
        if (normalized === 'keywords') return 'Keywords';
        if (normalized === 'channels') return 'Channels';
        if (normalized === 'rules_bundle') return 'Rule bundle';
        if (normalized === 'viewing_space') return 'Viewing space';
        if (normalized === 'time_limits') return 'Time limits';
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
            ? 'Parent updates can apply'
            : 'Ask on this device first';
    }

    function getNanahChildProtectionLevel(value, fallback = 'standard') {
        const normalized = normalizeString(value).toLowerCase();
        if (normalized === 'strict') return 'strict';
        if (normalized === 'standard') return 'standard';
        return fallback;
    }

    function getNanahChildProtectionLevelLabel(value) {
        return getNanahChildProtectionLevel(value, 'standard') === 'strict'
            ? 'Ask first'
            : 'Parent managed';
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
        return normalizeString(linkType) === 'managed_link' ? 'parent trust link' : 'device trust link';
    }

    function getNanahRoleLabel(role) {
        const normalized = normalizeString(role).toLowerCase();
        if (normalized === 'source') return 'This device controls another profile';
        if (normalized === 'replica') return 'This device receives protected updates';
        return 'My other device';
    }

    function isActiveChildNanahProfile() {
        return getActiveProfileType() === 'child';
    }

    function isNanahChildReceiveOnly() {
        return isActiveChildNanahProfile();
    }

    async function ensureChildNanahParentAuthorityUnlocked() {
        if (!isNanahChildReceiveOnly()) return true;
        const io = window.FilterTubeIO || {};
        const profilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        if (!profilesV4) return true;
        const childId = normalizeString(profilesV4.activeProfileId) || activeProfileId || 'default';
        const parentId = getParentAccountId(profilesV4, childId) || 'default';
        const ok = await ensureProfileUnlocked(profilesV4, parentId);
        if (!ok) {
            UIComponents.showToast('Parent approval is required before this child profile can trust or apply a new sync source.', 'error');
            return false;
        }
        return true;
    }

    function getNanahScopeDescription(scope) {
        const normalized = normalizeString(scope).toLowerCase();
        if (normalized === 'main') return 'Only the main YouTube rules and lists.';
        if (normalized === 'kids') return 'Only the Kids profile rules and lists.';
        if (normalized === 'keywords') return 'Only keyword rules from the selected Main or Kids surface.';
        if (normalized === 'channels') return 'Only channel rules from the selected Main or Kids surface.';
        if (normalized === 'videos') return 'Only blocked video IDs from the selected Main or Kids surface.';
        if (normalized === 'rules_bundle') return 'Keyword, channel, and blocked-video rules from the selected Main or Kids surface.';
        if (normalized === 'viewing_space') return 'Only Main/Kids access policy for the protected profile.';
        if (normalized === 'time_limits') return 'Only the protected profile daily YouTube time limit.';
        if (normalized === 'full') return 'The wider account snapshot, best for full migration.';
        return 'The currently active FilterTube profile snapshot.';
    }

    function expandNanahManagedSendScope(scope) {
        const normalized = normalizeString(scope).toLowerCase();
        if (normalized === 'rules_bundle') return ['keywords', 'channels', 'videos'];
        if (normalized === 'active' || normalized === 'full') return ['main', 'kids', 'viewing_space', 'time_limits'];
        return normalized ? [normalized] : [];
    }

    function describeNanahScopeList(scopes) {
        return getNanahManagedSendScopeList(scopes).map(getNanahScopeLabel).join(', ');
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
            ? ['active', 'main', 'kids', 'keywords', 'channels', 'videos', 'viewing_space', 'time_limits']
            : ['active', 'main', 'kids', 'keywords', 'channels', 'videos', 'viewing_space', 'time_limits', 'full'];
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

            const initialScopes = getNanahManagedSendScopeList(initialPolicy.allowedScopes || initialPolicy.defaultScope || 'active');
            const lockedScopes = getNanahManagedSendScopeList(requiredScopes);
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
            scopeTitle.textContent = 'What this parent can update';
            const scopeCopy = document.createElement('div');
            scopeCopy.className = 'nanah-managed-modal__section-copy';
            scopeCopy.textContent = lockedScopes.length > 0
                ? `Choose what this saved parent link can update later. ${describeNanahScopeList(lockedScopes)} must stay enabled for this approval.`
                : 'Choose what this saved parent link can update later.';
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
            defaultTitle.textContent = 'Default update area';
            const defaultCopy = document.createElement('div');
            defaultCopy.className = 'nanah-managed-modal__section-copy';
            defaultCopy.textContent = 'Choose the area FilterTube should treat as the main update target for this saved link.';
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
                desc.textContent = 'Used as the main update area.';
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
            modeTitle.textContent = 'How updates apply';
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
            mergeCard.innerHTML = '<strong>Add to current rules</strong><span>Keep what is already here and add the parent update.</span>';
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
            replaceCard.innerHTML = '<strong>Match parent rules</strong><span>Replace this area with the parent-approved update.</span>';
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
                toggleTitle.textContent = 'Apply matching parent updates automatically';
                const toggleBody = document.createElement('span');
                toggleBody.textContent = 'Only signed updates from this saved parent link and allowed area can skip the approval step.';
                toggleCopy.appendChild(toggleTitle);
                toggleCopy.appendChild(toggleBody);
                toggle.appendChild(autoApplyInput);
                toggle.appendChild(toggleCopy);
                autoSection.appendChild(toggle);
                body.appendChild(autoSection);
            }

            let reconnectFastInput = null;
            let reconnectApprovalInput = null;
            let syncOnOpenInput = null;
            if (showReconnectMode) {
                const reconnectSection = document.createElement('section');
                reconnectSection.className = 'nanah-managed-modal__section';
                const reconnectTitle = document.createElement('div');
                reconnectTitle.className = 'nanah-managed-modal__section-title';
                reconnectTitle.textContent = 'Next live session';
                const reconnectCopy = document.createElement('div');
                reconnectCopy.className = 'nanah-managed-modal__section-copy';
                reconnectCopy.textContent = 'Choose whether this saved parent link can reconnect quickly or should ask again on this device.';
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
                fastCard.innerHTML = '<strong>Reconnect quickly</strong><span>The parent link is saved. Future live sessions reopen faster and still follow this policy.</span>';
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
                approvalCard.innerHTML = '<strong>Ask before reconnect</strong><span>Future live sessions stop for approval on this device before continuing.</span>';
                approvalLabel.appendChild(reconnectApprovalInput);
                approvalLabel.appendChild(approvalCard);

                reconnectGrid.appendChild(fastLabel);
                reconnectGrid.appendChild(approvalLabel);
                reconnectSection.appendChild(reconnectTitle);
                reconnectSection.appendChild(reconnectCopy);
                reconnectSection.appendChild(reconnectGrid);
                body.appendChild(reconnectSection);

                const openSyncSection = document.createElement('section');
                openSyncSection.className = 'nanah-managed-modal__section';
                const openSyncToggle = document.createElement('label');
                openSyncToggle.className = 'nanah-managed-modal__toggle';
                syncOnOpenInput = document.createElement('input');
                syncOnOpenInput.type = 'checkbox';
                syncOnOpenInput.checked = safeObject(initialPolicy).syncOnProfileOpen === true;
                const openSyncCopy = document.createElement('div');
                const openSyncTitle = document.createElement('strong');
                openSyncTitle.textContent = 'Check for parent updates when this profile opens';
                const openSyncBody = document.createElement('span');
                openSyncBody.textContent = 'When a later-update service is available, this profile checks for signed parent updates and keeps the last valid policy when offline.';
                openSyncCopy.appendChild(openSyncTitle);
                openSyncCopy.appendChild(openSyncBody);
                openSyncToggle.appendChild(syncOnOpenInput);
                openSyncToggle.appendChild(openSyncCopy);
                openSyncSection.appendChild(openSyncToggle);
                body.appendChild(openSyncSection);
            }

            let targetCurrentInput = null;
            let targetFixedInput = null;
            if (showTargetProfileMapping) {
                const targetSection = document.createElement('section');
                targetSection.className = 'nanah-managed-modal__section';
                const targetTitle = document.createElement('div');
                targetTitle.className = 'nanah-managed-modal__section-title';
                targetTitle.textContent = 'Profile to protect on this device';
                const targetCopy = document.createElement('div');
                targetCopy.className = 'nanah-managed-modal__section-copy';
                targetCopy.textContent = forceFixedTargetProfile
                    ? `This parent link will always update ${localProfileContext.profileName} on this device. This keeps protected-profile sync predictable even if someone switches profiles later.`
                    : 'Choose whether future parent updates follow the currently active profile or always land in this profile.';
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
                currentCard.innerHTML = '<strong>Current active profile</strong><span>Future updates follow whichever profile is active on this device at receive time.</span>';
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
                fixedCard.innerHTML = `<strong>Always ${localProfileContext.profileName}</strong><span>Parent updates always land in this profile, even if another profile is active later.</span>`;
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
                childProtectionTitle.textContent = 'Protected-profile control';
                const childProtectionCopy = document.createElement('div');
                childProtectionCopy.className = 'nanah-managed-modal__section-copy';
                childProtectionCopy.textContent = 'Choose the everyday behavior for this saved parent link. Parent managed is the normal setup for a caregiver-controlled protected profile.';
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
                standardCard.innerHTML = '<strong>Parent managed</strong><span>Let this trusted parent link update this protected profile later, while still validating device, profile, scope, revision, and signature.</span>';
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
                strictCard.innerHTML = '<strong>Ask on this device first</strong><span>Require local approval/unlock before later updates can apply. Use this when the protected device should decide every time.</span>';
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
                childLockTitle.textContent = 'When this profile is locked';
                const childLockCopy = document.createElement('div');
                childLockCopy.className = 'nanah-managed-modal__section-copy';
                childLockCopy.textContent = 'Choose whether signed parent updates can apply while the profile stays locked. This permission is saved only on this device.';
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
                requireCard.innerHTML = '<strong>Ask on this device first</strong><span>This profile must be locally unlocked before parent updates can apply.</span>';
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
                allowCard.innerHTML = '<strong>Let parent updates apply</strong><span>Matching signed updates from this saved parent link may apply without unlocking this profile each time.</span>';
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
                const wantsOpenSync = syncOnOpenInput?.checked === true;
                const lockedChildMode = childProtectionLevel === 'strict'
                    ? 'require_unlock'
                    : (childLockAllowInput
                        ? (childLockAllowInput.checked === true ? 'allow_trusted_updates' : 'require_unlock')
                        : (wantsOpenSync ? 'allow_trusted_updates' : 'require_unlock'));
                const targetProfileBehavior = showTargetProfileMapping
                    ? ((forceFixedTargetProfile || childProtectionLevel === 'strict' || targetFixedInput?.checked === true) ? 'fixed_profile' : 'current_active')
                    : 'current_active';
                return {
                    allowedScopes,
                    defaultScope,
                    applyMode: replaceInput.checked ? 'replace' : 'merge',
                    autoApplyControlProposals: childProtectionLevel === 'strict' ? false : (autoApplyInput?.checked === true),
                    reconnectMode: childProtectionLevel === 'strict' ? 'approval_needed' : (reconnectApprovalInput?.checked === true ? 'approval_needed' : 'fast'),
                    lockedChildMode,
                    syncOnProfileOpen: childProtectionLevel === 'strict'
                        ? false
                        : (wantsOpenSync && lockedChildMode === 'allow_trusted_updates'),
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

    function buildNanahProfileScopedLinkId(remoteDeviceId, targetProfileId) {
        const devicePart = normalizeString(remoteDeviceId).replace(/[^A-Za-z0-9_.-]/g, '-');
        const targetPart = normalizeString(targetProfileId).replace(/[^A-Za-z0-9_.-]/g, '-');
        if (!devicePart || !targetPart) return '';
        return `nanah-${devicePart}-target-${targetPart}`;
    }

    function getNanahTrustedLinkTargetProfileId(entry) {
        const raw = safeObject(entry);
        const policy = safeObject(raw.policy);
        const targetProfileBehavior = getNanahTargetProfileBehavior(
            policy.targetProfileBehavior || raw.targetProfileBehavior,
            'current_active'
        );
        return targetProfileBehavior === 'fixed_profile'
            ? normalizeString(policy.targetProfileId || raw.targetProfileId)
            : '';
    }

    function getNanahTrustedLinkIdentityKey(entry) {
        const raw = safeObject(entry);
        const policy = safeObject(raw.policy);
        const remoteDeviceId = normalizeString(raw.remoteDeviceId);
        if (!remoteDeviceId) return '';
        const localRole = (() => {
            const value = normalizeString(raw.localRole).toLowerCase();
            return value === 'source' || value === 'replica' || value === 'peer' ? value : 'peer';
        })();
        const remoteRole = (() => {
            const value = normalizeString(raw.remoteRole || raw.role).toLowerCase();
            return value === 'source' || value === 'replica' || value === 'peer' ? value : 'peer';
        })();
        const derivedLinkType = classifyNanahTrustedLink(localRole, remoteRole);
        const requestedLinkType = normalizeString(raw.linkType || policy.linkType);
        const linkType = requestedLinkType === 'managed_link' || requestedLinkType === 'peer_link'
            ? requestedLinkType
            : (derivedLinkType || 'peer_link');
        const targetProfileId = getNanahTrustedLinkTargetProfileId(raw);
        if (linkType === 'managed_link' && targetProfileId) {
            return `managed:${remoteDeviceId}:${localRole}:${remoteRole}:${targetProfileId}`;
        }
        return `device:${remoteDeviceId}:${localRole}:${remoteRole}:${linkType}`;
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
        const rawScopes = safeObject(raw.policy).allowedScopes || raw.allowedScopes || safeObject(raw.policy).defaultScope || raw.defaultScope;
        const managedScopes = linkType === 'managed_link' ? getNanahManagedPolicyScopeList(rawScopes) : [];
        const normalizedScopes = linkType === 'managed_link'
            ? (managedScopes.length ? managedScopes : getNanahScopeList(rawScopes))
            : getNanahScopeList(rawScopes);
        const applyMode = normalizeString(safeObject(raw.policy).applyMode || raw.applyMode).toLowerCase() === 'replace' ? 'replace' : 'merge';
        const autoApply = safeObject(raw.policy).autoApplyControlProposals === true;
        const reconnectMode = getNanahReconnectMode(safeObject(raw.policy).reconnectMode || raw.reconnectMode, linkType === 'managed_link' ? 'approval_needed' : 'fast');
        const lockedChildMode = getNanahLockedChildMode(safeObject(raw.policy).lockedChildMode || raw.lockedChildMode, 'require_unlock');
        const syncOnProfileOpen = safeObject(raw.policy).syncOnProfileOpen === true || raw.syncOnProfileOpen === true;
        const childProtectionLevel = getNanahChildProtectionLevel(safeObject(raw.policy).childProtectionLevel || raw.childProtectionLevel, 'standard');
        const targetProfileBehavior = getNanahTargetProfileBehavior(
            safeObject(raw.policy).targetProfileBehavior || raw.targetProfileBehavior,
            'current_active'
        );
        const targetProfileId = normalizeString(safeObject(raw.policy).targetProfileId || raw.targetProfileId);
        const targetProfileName = normalizeString(safeObject(raw.policy).targetProfileName || raw.targetProfileName);
        const legacyDefaultLinkId = `nanah-${remoteDeviceId}`;
        const profileScopedLinkId = linkType === 'managed_link'
            && targetProfileBehavior === 'fixed_profile'
            && targetProfileId
            ? buildNanahProfileScopedLinkId(remoteDeviceId, targetProfileId)
            : legacyDefaultLinkId;
        const rawLinkId = normalizeString(raw.linkId);
        const linkId = rawLinkId && rawLinkId !== legacyDefaultLinkId ? rawLinkId : profileScopedLinkId;

        const trustedLinkIdentityKey = getNanahTrustedLinkIdentityKey({
            ...raw,
            remoteDeviceId,
            localRole,
            remoteRole,
            linkType,
            policy: {
                ...safeObject(raw.policy),
                targetProfileBehavior,
                targetProfileId: targetProfileBehavior === 'fixed_profile' ? targetProfileId : ''
            }
        });

        return {
            ...raw,
            linkId,
            trustedLinkIdentityKey,
            identityKey: trustedLinkIdentityKey,
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
                syncOnProfileOpen: linkType === 'managed_link' && syncOnProfileOpen,
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
        if (!remoteId) return null;
        const selectedTargetId = getNanahSelectedRemoteTargetProfileId();
        const remoteTargetProfile = normalizeNanahTargetProfileContext(nanahSessionState.remoteTargetProfile);
        const targetProfileId = selectedTargetId
            || (remoteTargetProfile.behavior === 'fixed_profile' ? normalizeString(remoteTargetProfile.profileId) : '');
        return findNanahTrustedLink(remoteId, {
            targetProfileId,
            localRole: getNanahRole(),
            remoteRole: normalizeString(nanahSessionState.remoteRole)
        }) || findNanahTrustedLink(remoteId);
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
                locked: isProfileLocked(localProfiles, currentActiveId) && !isProfileUnlockSessionValid.check(currentActiveId)
            };
        }

        const behavior = getNanahTargetProfileBehavior(safeObject(trusted.policy).targetProfileBehavior, 'current_active');
        if (behavior !== 'fixed_profile') {
            return {
                behavior: 'current_active',
                profileId: currentActiveId,
                profileName: getProfileName(localProfiles, currentActiveId),
                profileType: getProfileType(localProfiles, currentActiveId),
                locked: isProfileLocked(localProfiles, currentActiveId) && !isProfileUnlockSessionValid.check(currentActiveId)
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
            locked: isProfileLocked(localProfiles, targetProfileId) && !isProfileUnlockSessionValid.check(targetProfileId)
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
                locked: isProfileLocked(localProfiles, currentActiveId) && !isProfileUnlockSessionValid.check(currentActiveId)
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
            locked: isProfileLocked(localProfiles, targetProfileId) && !isProfileUnlockSessionValid.check(targetProfileId)
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

    function getNanahSelectedManagedTargetLinkIds() {
        if (!ftNanahManagedTargets) return [];
        return Array.from(ftNanahManagedTargets.querySelectorAll('input[type="checkbox"][data-link-id]:checked'))
            .map((input) => normalizeString(input.dataset.linkId))
            .filter(Boolean);
    }

    function getNanahEligibleManagedTargetLinks(scope = getNanahScope()) {
        const remoteDeviceId = normalizeString(safeObject(nanahSessionState.remoteDevice).deviceId);
        const requiredScopes = expandNanahManagedSendScope(scope);
        if (!remoteDeviceId || requiredScopes.length === 0) return [];
        if (!nanahClient || !nanahSessionState.connected || getNanahRole() !== 'source') return [];
        if (normalizeString(nanahSessionState.remoteRole) !== 'replica') return [];

        return nanahTrustedLinks
            .map((entry) => normalizeNanahTrustedLink(entry))
            .filter((entry) => entry
                && entry.linkType === 'managed_link'
                && entry.localRole === 'source'
                && entry.remoteRole === 'replica'
                && normalizeString(entry.remoteDeviceId) === remoteDeviceId
                && !!getNanahTrustedLinkTargetProfileId(entry))
            .filter((entry) => {
                const allowedScopes = getNanahManagedPolicyScopeList(safeObject(entry.policy).allowedScopes);
                return requiredScopes.every((requiredScope) => allowedScopes.includes(requiredScope));
            });
    }

    function getNanahManagedTargetLabel(link) {
        const trusted = normalizeNanahTrustedLink(link);
        const policy = safeObject(trusted?.policy);
        return normalizeString(policy.targetProfileName)
            || normalizeString(policy.targetProfileId)
            || 'Protected profile';
    }

    function syncNanahManagedTargetOptions(scope = getNanahScope()) {
        if (!ftNanahManagedTargetsField || !ftNanahManagedTargets) return [];
        const selectedBefore = new Set(getNanahSelectedManagedTargetLinkIds());
        const eligibleLinks = getNanahEligibleManagedTargetLinks(scope);
        const currentLinkId = normalizeString(getNanahCurrentTrustedLink()?.linkId);
        const showChooser = eligibleLinks.length > 1;

        ftNanahManagedTargets.innerHTML = '';
        ftNanahManagedTargetsField.hidden = !showChooser;

        if (!showChooser) {
            if (ftNanahManagedTargetsHint) {
                ftNanahManagedTargetsHint.textContent = eligibleLinks.length === 1
                    ? `This live send will target ${getNanahManagedTargetLabel(eligibleLinks[0])} on ${getNanahRemoteLabel()}.`
                    : 'Save fixed managed protected-profile targets on the connected replica before using multi-target sends.';
            }
            return eligibleLinks;
        }

        let checkedCount = 0;
        eligibleLinks.forEach((link, index) => {
            const linkId = normalizeString(link.linkId);
            const policy = safeObject(link.policy);
            const label = document.createElement('label');
            label.className = 'nanah-managed-target';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.linkId = linkId;
            input.checked = selectedBefore.size > 0
                ? selectedBefore.has(linkId)
                : (currentLinkId ? linkId === currentLinkId : index === 0);
            if (input.checked) checkedCount += 1;

            const body = document.createElement('span');
            const name = document.createElement('span');
            name.className = 'nanah-managed-target__name';
            name.textContent = getNanahManagedTargetLabel(link);
            const meta = document.createElement('span');
            meta.className = 'nanah-managed-target__meta';
            meta.textContent = `${getNanahRemoteLabel()} · ${describeNanahScopeList(policy.allowedScopes)}`;

            body.appendChild(name);
            body.appendChild(meta);
            label.appendChild(input);
            label.appendChild(body);
            ftNanahManagedTargets.appendChild(label);
        });

        if (checkedCount === 0) {
            const fallback = ftNanahManagedTargets.querySelector('input[type="checkbox"][data-link-id]');
            if (fallback) {
                fallback.checked = true;
                checkedCount = 1;
            }
        }

        if (ftNanahManagedTargetsHint) {
            ftNanahManagedTargetsHint.textContent = `Choose which saved protected profiles on ${getNanahRemoteLabel()} receive this live update. Offline devices still need optional later pickup or same-network delivery.`;
        }
        return eligibleLinks;
    }

    function getNanahSelectedManagedTargetLinks(scope = getNanahScope()) {
        if (!ftNanahManagedTargetsField || ftNanahManagedTargetsField.hidden) return [];
        const selectedIds = new Set(getNanahSelectedManagedTargetLinkIds());
        if (selectedIds.size === 0) return [];
        return getNanahEligibleManagedTargetLinks(scope)
            .filter((entry) => selectedIds.has(normalizeString(entry.linkId)));
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
        params.set('path', getNanahUiMode());
        params.set('role', getNanahRole());
        params.set('scope', getNanahScope());
        params.set('apply', getNanahStrategy());
        return `nanah://pair?${params.toString()}`;
    }

    function getNanahRemoteLabel() {
        const remote = safeObject(nanahSessionState.remoteDevice);
        return normalizeString(remote.deviceLabel) || normalizeString(remote.deviceId) || 'Unknown device';
    }

    function getNanahLocalDeviceLabel() {
        return normalizeString(ftNanahDeviceLabel?.value) || normalizeString(nanahStableDeviceId) || 'This device';
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

    function formatNanahEndpointContext(profileContext, deviceLabel) {
        const profileLabel = formatNanahProfileContext(profileContext);
        const normalizedDeviceLabel = normalizeString(deviceLabel);
        return normalizedDeviceLabel ? `${profileLabel} • ${normalizedDeviceLabel}` : profileLabel;
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
            return `${getNanahRemoteLabel()} saved parent trust to write into ${remoteTargetProfile.profileName}, even if another profile is active there later.`;
        }
        const remoteProfile = normalizeNanahProfileContext(nanahSessionState.remoteProfile);
        const localProfile = getNanahLocalProfileContext();
        const trusted = normalizeNanahTrustedLink(getNanahCurrentTrustedLink());
        if (trusted && trusted.localRole === 'replica' && trusted.remoteRole === 'source' && trusted.linkType === 'managed_link') {
            try {
                const targetProfile = resolveNanahLocalTargetProfile(trusted);
                if (targetProfile.behavior === 'fixed_profile') {
                    return `Parent updates from ${getNanahRemoteLabel()} will write into ${targetProfile.profileName} on this device, even if another local profile is active later.`;
                }
            } catch (error) {
                return error?.message || 'This parent trust link points to a profile that is no longer available on this device.';
            }
        }
        if (localProfile.profileType === 'child' && normalizeString(remoteProfile.profileName)) {
            return `This child profile will not safely target ${remoteProfile.profileName} on ${getNanahRemoteLabel()} unless that device saves a fixed protected-profile target for this child first.`;
        }
        if (normalizeString(remoteProfile.profileName)) {
            return `${getNanahScopeLabel(normalizedScope)} will write into ${remoteProfile.profileName} on ${getNanahRemoteLabel()}. Inactive remote profiles are only targeted when you choose an explicit remote target or save a fixed protected-profile target there.`;
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
        const scope = getNanahScope();
        const roleLabel = getNanahSelectedText(ftNanahRole, getNanahRoleLabel());
        const scopeLabel = getNanahSelectedText(ftNanahScope, getNanahScopeLabel(scope));
        const strategyLabel = getNanahSelectedText(ftNanahStrategy, getNanahStrategyLabel(getNanahStrategy()));
        const parts = [roleLabel, scopeLabel];
        if (['keywords', 'channels', 'videos', 'rules_bundle'].includes(scope) && ftNanahGranularSurface) {
            const surfaceLabel = getNanahSelectedText(
                ftNanahGranularSurface,
                ftNanahGranularSurface.value === 'kids' ? 'YouTube Kids rules' : 'YouTube Main rules'
            );
            parts.push(surfaceLabel);
        }
        if (ftNanahManagedTargetsField && !ftNanahManagedTargetsField.hidden) {
            const selectedTargets = getNanahSelectedManagedTargetLinks(scope);
            parts.push(`${selectedTargets.length || 0} target${selectedTargets.length === 1 ? '' : 's'}`);
        }
        parts.push(strategyLabel);
        ftNanahAdvancedSummary.textContent = parts.join(' · ');
    }

    function enforceChildSyncSurfaceRestrictions() {
        if (!ftNanahChildBanner || !ftNanahChildBannerTitle || !ftNanahChildBannerBody) return;
        const isChild = isActiveChildNanahProfile();
        
        if (isChild) {
            if (ftNanahRole) ftNanahRole.value = 'replica';
            if (ftNanahScope && ftNanahScope.value === 'full') ftNanahScope.value = 'active';
            if (ftNanahStrategy) ftNanahStrategy.value = 'merge';
            if (ftNanahModeParent) ftNanahModeParent.hidden = true;
            if (ftNanahModeFull) ftNanahModeFull.hidden = true;
            ftNanahChildBanner.hidden = false;

            if (ftNanahModeSendOnce) {
                ftNanahModeSendOnce.hidden = false;
                ftNanahModeSendOnce.disabled = true;
            }
            ftNanahChildBannerTitle.textContent = "Protected profile receive-only";
            ftNanahChildBannerBody.textContent = "This child profile can join a parent pairing code and receive updates for its own rules. Sending, backups, trusted-link policy, and profile management stay parent-controlled.";
            if (ftNanahHostBtn) ftNanahHostBtn.disabled = true;
            if (ftNanahSendBtn) ftNanahSendBtn.disabled = true;
            if (ftNanahTrustBtn) ftNanahTrustBtn.disabled = true;
            
            if (nanahUiMode === 'parent_control' || nanahUiMode === 'full_account') {
                setNanahMode('send_once', { persist: false, applyPreset: true });
            }
        } else {
            if (ftNanahModeParent) ftNanahModeParent.hidden = false;
            if (ftNanahModeFull) ftNanahModeFull.hidden = false;
            if (ftNanahModeSendOnce) ftNanahModeSendOnce.hidden = false;
            ftNanahChildBanner.hidden = true;
            if (ftNanahModeSendOnce) ftNanahModeSendOnce.disabled = !!nanahClient;
            if (ftNanahHostBtn) ftNanahHostBtn.disabled = !!nanahClient;
        }
        refreshNanahAdvancedSummary();
    }

    function setNanahModeButtons(mode = getNanahUiMode()) {
        const normalized = normalizeNanahUiMode(mode);
        const childSurface = isChildProfileAdminSurface();
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
            if (childSurface) {
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

        const childReceiveOnly = isNanahChildReceiveOnly();
        const childReplicaOnly = childReceiveOnly || isNanahChildReplicaOnly();
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
            if (childReceiveOnly) {
                if (ftNanahRole) ftNanahRole.value = 'replica';
                if (ftNanahScope && ftNanahScope.value === 'full') ftNanahScope.value = 'active';
                if (ftNanahStrategy) ftNanahStrategy.value = 'merge';
                if (ftNanahRemoteTarget) ftNanahRemoteTarget.value = '';
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
                    'To manage that child profile reliably, save parent trust on the other device while its child profile is active once.',
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

    function findNanahTrustedLink(remoteDeviceId, options = {}) {
        const deviceId = normalizeString(remoteDeviceId);
        if (!deviceId) return null;
        const filters = safeObject(options);
        const requestedLinkId = normalizeString(filters.linkId);
        const requestedTargetProfileId = normalizeString(filters.targetProfileId);
        const requestedLinkType = normalizeString(filters.linkType);
        const requestedLocalRole = normalizeString(filters.localRole).toLowerCase();
        const requestedRemoteRole = normalizeString(filters.remoteRole).toLowerCase();
        const candidates = nanahTrustedLinks
            .map((entry) => normalizeNanahTrustedLink(entry))
            .filter((entry) => entry && normalizeString(entry.remoteDeviceId) === deviceId)
            .filter((entry) => !requestedLinkType || entry.linkType === requestedLinkType)
            .filter((entry) => !requestedLocalRole || entry.localRole === requestedLocalRole)
            .filter((entry) => !requestedRemoteRole || entry.remoteRole === requestedRemoteRole);
        if (requestedLinkId) {
            const exact = candidates.find((entry) => normalizeString(entry.linkId) === requestedLinkId);
            if (exact) return exact;
        }
        if (requestedTargetProfileId) {
            const targetExact = candidates.find((entry) => getNanahTrustedLinkTargetProfileId(entry) === requestedTargetProfileId);
            if (targetExact) return targetExact;
        }
        return candidates[0] || null;
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

    function normalizeNanahManagedSigningPublicDescriptor(value) {
        const root = safeObject(value);
        const managedPublicKeyId = normalizeString(root.managedPublicKeyId || root.sourcePublicKeyId || root.publicKeyId);
        const managedPublicKeyJwk = safeObject(root.managedPublicKeyJwk || root.sourcePublicKeyJwk || root.publicKeyJwk);
        const managedKeyVersion = normalizeNonNegativeInteger(root.managedKeyVersion || root.keyVersion || root.sourceKeyVersion) || 0;
        if (!managedPublicKeyId || Object.keys(managedPublicKeyJwk).length === 0 || managedKeyVersion <= 0) {
            return null;
        }
        return {
            managedPublicKeyId,
            managedPublicKeyJwk,
            managedKeyVersion,
            sourcePublicKeyId: managedPublicKeyId,
            sourcePublicKeyJwk: managedPublicKeyJwk,
            keyVersion: managedKeyVersion,
            algorithm: normalizeString(root.algorithm).toLowerCase() || 'ed25519',
            createdAt: normalizeNonNegativeInteger(root.createdAt) || Date.now()
        };
    }

    function normalizeNanahManagedSigningKeyPair(value) {
        const root = safeObject(value);
        const publicDescriptor = normalizeNanahManagedSigningPublicDescriptor(root);
        const privateKeyJwk = safeObject(root.privateKeyJwk);
        if (!publicDescriptor || Object.keys(privateKeyJwk).length === 0) {
            return null;
        }
        return {
            ...publicDescriptor,
            privateKeyJwk
        };
    }

    async function persistNanahManagedSigningKeyPair(keyPair) {
        const normalized = normalizeNanahManagedSigningKeyPair(keyPair);
        if (!normalized) return null;
        const publicDescriptor = normalizeNanahManagedSigningPublicDescriptor(normalized);
        const privateStored = {
            ...publicDescriptor,
            privateKeyJwk: normalized.privateKeyJwk
        };
        const wrotePrivate = await writeNanahStorage(NANAH_MANAGED_SIGNING_KEYPAIR_KEY, privateStored);
        const wrotePublic = await writeNanahStorage(NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY, publicDescriptor);
        if (!wrotePrivate || !wrotePublic) return null;
        nanahManagedSigningKeyDescriptor = publicDescriptor;
        return privateStored;
    }

    async function loadNanahManagedSigningKeyDescriptor() {
        const publicDescriptor = normalizeNanahManagedSigningPublicDescriptor(
            await readNanahStorage(NANAH_MANAGED_SIGNING_PUBLIC_KEY_KEY)
        );
        if (publicDescriptor) {
            nanahManagedSigningKeyDescriptor = publicDescriptor;
            return publicDescriptor;
        }
        const keyPair = normalizeNanahManagedSigningKeyPair(
            await readNanahStorage(NANAH_MANAGED_SIGNING_KEYPAIR_KEY)
        );
        if (!keyPair) {
            nanahManagedSigningKeyDescriptor = null;
            return null;
        }
        return normalizeNanahManagedSigningPublicDescriptor(await persistNanahManagedSigningKeyPair(keyPair));
    }

    async function ensureNanahManagedSigningKeyPair({ required = false, rotate = false } = {}) {
        const existing = normalizeNanahManagedSigningKeyPair(
            await readNanahStorage(NANAH_MANAGED_SIGNING_KEYPAIR_KEY)
        );
        if (existing && rotate !== true) {
            await persistNanahManagedSigningKeyPair(existing);
            return existing;
        }
        const adapter = window.FilterTubeNanahAdapter || {};
        if (typeof adapter.createManagedNanahSigningKeyPair !== 'function') {
            if (required) throw new Error('Managed signing key generation is unavailable');
            return null;
        }
        const existingKeyVersion = normalizeNonNegativeInteger(existing?.managedKeyVersion || existing?.keyVersion || existing?.sourceKeyVersion) || 0;
        const generated = await adapter.createManagedNanahSigningKeyPair({
            managedKeyVersion: rotate === true ? Math.max(1, existingKeyVersion + 1) : 1
        });
        return persistNanahManagedSigningKeyPair(generated);
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

    function buildManagedTrustRevocationHistoryRow({ profileId, linkId, removedScopes, reason, now, actionType = 'trust_link.revoke', label = 'Trusted parent link removed' }) {
        return {
            rowId: `managed-trust-revoke-${profileId}-${linkId}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: activeProfileId || null,
            actorDeviceId: nanahStableDeviceId || null,
            targetProfileId: profileId,
            trustedLinkId: linkId,
            actionType,
            scope: 'trust_link',
            revision: null,
            policyHash: null,
            result: 'accepted',
            reason: null,
            receivedAt: now,
            issuedAt: now,
            orderKey: `revoke:${now}:${linkId}`,
            summary: {
                redacted: true,
                label,
                reason,
                removedScopeCount: removedScopes.length,
                removedScopes
            },
            sensitive: true
        };
    }

    async function purgeNanahManagedPolicyStateForTrustedLink(linkId, { reason = 'trusted_link_removed', actionType = 'trust_link.revoke', label = 'Trusted parent link removed' } = {}) {
        const normalized = normalizeString(linkId);
        if (!normalized) return { profilesTouched: 0, scopesRemoved: 0 };
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            return { profilesTouched: 0, scopesRemoved: 0 };
        }

        const fresh = await io.loadProfilesV4();
        const profiles = { ...safeObject(fresh.profiles) };
        let changed = false;
        let profilesTouched = 0;
        let scopesRemoved = 0;
        const touchedProfileIds = [];
        const now = Date.now();

        Object.entries(profiles).forEach(([profileId, profile]) => {
            const managedState = safeObject(profile?.managedPolicyState);
            const remotePolicies = safeObject(managedState.remoteManagedPolicies);
            if (!Object.prototype.hasOwnProperty.call(remotePolicies, normalized)) return;

            const removedScopes = Object.keys(safeObject(remotePolicies[normalized]))
                .filter(scope => Object.keys(safeObject(remotePolicies[normalized]?.[scope])).length > 0);
            const nextRemotePolicies = { ...remotePolicies };
            delete nextRemotePolicies[normalized];
            const nextManagedState = { ...managedState };
            if (Object.keys(nextRemotePolicies).length > 0) {
                nextManagedState.remoteManagedPolicies = nextRemotePolicies;
            } else {
                delete nextManagedState.remoteManagedPolicies;
            }

            const revokeRow = buildManagedTrustRevocationHistoryRow({
                profileId,
                linkId: normalized,
                removedScopes,
                reason,
                now,
                actionType,
                label
            });
            profiles[profileId] = {
                ...profile,
                managedPolicyState: nextManagedState,
                managedActionHistory: appendManagedActionHistoryRow(profile, revokeRow)
            };
            changed = true;
            profilesTouched += 1;
            touchedProfileIds.push(profileId);
            scopesRemoved += removedScopes.length;
        });

        if (!changed) return { profilesTouched: 0, scopesRemoved: 0, touchedProfileIds: [] };
        const nextProfilesV4 = {
            ...fresh,
            schemaVersion: 4,
            profiles
        };
        await io.saveProfilesV4(nextProfilesV4);
        profilesV4Cache = nextProfilesV4;
        return { profilesTouched, scopesRemoved, touchedProfileIds };
    }

    async function purgeNanahManagedOpenSyncStateForTrustedLink(linkId) {
        const normalized = normalizeString(linkId);
        if (!normalized) return false;
        const state = safeObject(nanahManagedOpenSyncState);
        const linkResults = safeArray(state.linkResults);
        if (!linkResults.some(row => normalizeString(row?.linkId) === normalized)) return false;
        await persistNanahManagedOpenSyncState({
            ...state,
            checkedAt: Date.now(),
            reasonCode: 'trusted_link_removed',
            purgedLinkId: normalized,
            linkResults: linkResults.filter(row => normalizeString(row?.linkId) !== normalized)
        });
        return true;
    }

    async function purgeNanahManagedLocalNetworkSyncStateForTrustedLink(linkId) {
        const normalized = normalizeString(linkId);
        if (!normalized) return false;
        const state = safeObject(nanahManagedLocalNetworkSyncState);
        const linkResults = safeArray(state.linkResults);
        if (!linkResults.some(row => normalizeString(row?.linkId) === normalized)) return false;
        await persistNanahManagedLocalNetworkSyncState({
            ...state,
            checkedAt: Date.now(),
            reasonCode: 'trusted_link_removed',
            purgedLinkId: normalized,
            linkResults: linkResults.filter(row => normalizeString(row?.linkId) !== normalized)
        });
        return true;
    }

    async function purgeNanahManagedSourceAckSyncStateForTrustedLink(linkId) {
        const normalized = normalizeString(linkId);
        if (!normalized) return false;
        const state = safeObject(nanahManagedSourceAckSyncState);
        const linkResults = safeArray(state.linkResults);
        if (!linkResults.some(row => normalizeString(row?.linkId) === normalized)) return false;
        await persistNanahManagedSourceAckSyncState({
            ...state,
            checkedAt: Date.now(),
            reasonCode: 'trusted_link_key_revoked',
            purgedLinkId: normalized,
            linkResults: linkResults.filter(row => normalizeString(row?.linkId) !== normalized)
        });
        return true;
    }

    function getNanahManagedMailboxProvider() {
        return safeObject(window.FilterTubeManagedPolicyMailbox);
    }

    const NANAH_MANAGED_MAILBOX_CONFIG_KEY = 'ftManagedMailboxServerConfig';

    function readNanahManagedMailboxServerConfig() {
        try {
            return safeObject(JSON.parse(localStorage.getItem(NANAH_MANAGED_MAILBOX_CONFIG_KEY) || '{}'));
        } catch (_) {
            return {};
        }
    }

    function writeNanahManagedMailboxServerConfig(config) {
        try {
            const root = safeObject(config);
            if (!normalizeString(root.endpointUrl || root.url || root.baseUrl)) {
                localStorage.removeItem(NANAH_MANAGED_MAILBOX_CONFIG_KEY);
                delete window.FilterTubeManagedPolicyMailbox;
                return null;
            }
            localStorage.setItem(NANAH_MANAGED_MAILBOX_CONFIG_KEY, JSON.stringify(root));
            if (window.FilterTubeManagedMailboxClient?.createProvider) {
                window.FilterTubeManagedPolicyMailbox = window.FilterTubeManagedMailboxClient.createProvider(root);
            } else {
                delete window.FilterTubeManagedPolicyMailbox;
            }
            return window.FilterTubeManagedPolicyMailbox || null;
        } catch (_) {
            return null;
        }
    }

    function summarizeManagedMailboxServerConfig() {
        const config = readNanahManagedMailboxServerConfig();
        const endpoint = normalizeString(config.endpointUrl || config.url || config.baseUrl);
        const provider = getNanahManagedMailboxProvider();
        const configured = provider.configured === true && hasNanahManagedMailboxUploadWriter(provider);
        if (!endpoint) {
            return {
                configured: false,
                label: 'Later updates off',
                detail: 'Live P2P can send now. Set up later updates only when protected devices need offline pickup.',
                tone: 'warning'
            };
        }
        let host = normalizeString(provider.endpointHost);
        if (!host) {
            try {
                host = new URL(endpoint).host;
            } catch (_) {
                host = endpoint;
            }
        }
        if (!configured) {
            return {
                configured: false,
                label: 'Later updates need review',
                detail: `${host} is saved but is not ready for offline pickup.`,
                tone: 'warning'
            };
        }
        return {
            configured: true,
            label: `Later updates ready: ${host}`,
            detail: 'Offline pickup is available. The protected device still accepts only trusted parent updates.',
            tone: 'success'
        };
    }

    async function promptManagedProviderSetupAction({
        title,
        message,
        details,
        configured = false,
        configureLabel,
        disableLabel
    } = {}) {
        const choices = [
            {
                value: 'configure',
                label: configureLabel || (configured ? 'Edit Provider' : 'Configure Provider'),
                className: configured ? 'btn-secondary' : 'btn-primary'
            }
        ];
        if (configured) {
            choices.push({
                value: 'disable',
                label: disableLabel || 'Disable Provider',
                className: 'btn-secondary'
            });
        }
        return showChoiceModal({
            title: title || 'Configure Managed Delivery',
            message: message || 'Choose how this managed delivery provider should be used.',
            details: Array.isArray(details) ? details : [
                'Use live P2P first when both devices are open.',
                'Only add another delivery method when live P2P is not enough.',
                'Child/protected profiles still cannot change parent rules from their own surface.'
            ],
            choices,
            cancelText: 'Cancel'
        });
    }

    async function configureNanahManagedMailboxServer() {
        const root = safeObject(profilesV4Cache);
        const activeProfileId = normalizeString(root.activeProfileId) || 'default';
        if (getProfileType(root, activeProfileId) === 'child') {
            UIComponents.showToast('Child profiles cannot configure managed delivery providers', 'error');
            return;
        }
        const okAdmin = await ensureProfileUnlocked(root, activeProfileId, { sensitiveAction: true });
        if (!okAdmin) return;
        const current = readNanahManagedMailboxServerConfig();
        const currentEndpoint = normalizeString(current.endpointUrl || current.url || current.baseUrl);
        const action = await promptManagedProviderSetupAction({
            title: 'Save Updates For Later',
            message: 'Use this only when a parent may change rules while the protected device is offline. The child device can pick up the update next time it opens.',
            details: [
                'This is advanced and separate from normal Nanah live P2P.',
                'Skip this if parent and protected devices can be opened together.',
                'A compatible service is only a waiting room for unreadable updates.',
                'Parent approval and the saved trusted device still decide what applies.'
            ],
            configured: !!currentEndpoint,
            configureLabel: currentEndpoint ? 'Edit Later Updates' : 'Set Up Later Updates',
            disableLabel: 'Turn Off Later Updates'
        });
        if (action === null) return;
        if (action === 'disable') {
            writeNanahManagedMailboxServerConfig({});
            await recordManagedMailboxProviderConfigHistory({
                configured: false,
                endpointHost: ''
            });
            await refreshProfilesUI();
            UIComponents.showToast('Offline pickup disabled', 'success');
            return;
        }
        const endpoint = await showPromptModal({
            title: 'Offline Pickup Service',
            message: 'Advanced only. This is not the Nanah signal server. Enter a compatible HTTPS pickup service only if you run one; leave blank to keep live P2P only.',
            placeholder: 'https://your-filtertube-pickup-service',
            inputType: 'url',
            confirmText: currentEndpoint ? 'Save Service' : 'Enable Offline Pickup',
            initialValue: currentEndpoint
        });
        if (endpoint === null) return;
        const endpointUrl = normalizeString(endpoint);
        if (!endpointUrl) {
            writeNanahManagedMailboxServerConfig({});
            await recordManagedMailboxProviderConfigHistory({
                configured: false,
                endpointHost: ''
            });
            await refreshProfilesUI();
            UIComponents.showToast('Offline pickup disabled', 'success');
            return;
        }
        const token = await showPromptModal({
            title: 'Service Password',
            message: 'Optional. Leave blank to keep the saved password. Enter a single dash to clear it.',
            placeholder: 'Optional token',
            inputType: 'password',
            confirmText: 'Save',
            initialValue: ''
        });
        if (token === null) return;
        const rawToken = normalizeString(token);
        const nextConfig = {
            ...safeObject(current),
            endpointUrl
        };
        if (rawToken === '-') {
            delete nextConfig.authToken;
        } else if (rawToken) {
            nextConfig.authToken = rawToken;
        }
        const client = window.FilterTubeManagedMailboxClient;
        const provider = client && typeof client.createProvider === 'function'
            ? client.createProvider(nextConfig)
            : null;
        if (!provider || provider.configured !== true || !hasNanahManagedMailboxUploadWriter(provider)) {
            UIComponents.showToast('Offline pickup endpoint must be public HTTPS and supported by FilterTube', 'error');
            return;
        }
        writeNanahManagedMailboxServerConfig(nextConfig);
        await recordManagedMailboxProviderConfigHistory({
            configured: true,
            endpointHost: getManagedMailboxEndpointHostFromConfig(nextConfig)
        });
        await refreshProfilesUI();
        UIComponents.showToast('Offline pickup saved', 'success');
    }

    async function configureNanahManagedLocalNetworkProvider() {
        const root = safeObject(profilesV4Cache);
        const currentActiveProfileId = normalizeString(root.activeProfileId) || 'default';
        if (getProfileType(root, currentActiveProfileId) === 'child') {
            UIComponents.showToast('Child profiles cannot configure managed delivery providers', 'error');
            return;
        }
        const okAdmin = await ensureProfileUnlocked(root, currentActiveProfileId, { sensitiveAction: true });
        if (!okAdmin) return;
        const current = readNanahManagedLocalNetworkProviderConfig();
        const currentEndpoint = normalizeString(current.endpointUrl || current.url || current.baseUrl);
        const action = await promptManagedProviderSetupAction({
            title: 'Same-Network Updates',
            message: 'Use this only when you have a trusted home/local gateway that can pass parent updates to protected devices on the same network.',
            details: [
                'This is advanced and separate from normal Nanah live P2P.',
                'Skip this for normal live P2P control.',
                'Being on the same network is not enough to change rules.',
                'The protected device still accepts only trusted parent updates.'
            ],
            configured: !!currentEndpoint,
            configureLabel: currentEndpoint ? 'Edit Same-Network Updates' : 'Set Up Same-Network Updates',
            disableLabel: 'Turn Off Same-Network Updates'
        });
        if (action === null) return;
        if (action === 'disable') {
            writeNanahManagedLocalNetworkProviderConfig({});
            await recordManagedLocalNetworkProviderConfigHistory({
                configured: false,
                endpointHost: ''
            });
            await refreshProfilesUI();
            UIComponents.showToast('Same-network updates disabled', 'success');
            return;
        }
        const endpoint = await showPromptModal({
            title: 'Same-Network Gateway',
            message: 'Advanced only. Enter a trusted local gateway endpoint only if you run a FilterTube-compatible gateway. Normal parent control uses live P2P.',
            placeholder: 'http://192.168.1.10:4177/filtertube',
            inputType: 'url',
            confirmText: currentEndpoint ? 'Save Gateway' : 'Enable Same-Network Updates',
            initialValue: currentEndpoint
        });
        if (endpoint === null) return;
        const endpointUrl = normalizeString(endpoint);
        if (!endpointUrl) {
            UIComponents.showToast('Enter a LAN endpoint or use Disable LAN', 'error');
            return;
        }
        const token = await showPromptModal({
            title: 'Gateway Password',
            message: 'Optional. Leave blank to keep the saved password. Enter a single dash to clear it.',
            placeholder: 'Optional token',
            inputType: 'password',
            confirmText: 'Save',
            initialValue: ''
        });
        if (token === null) return;
        const rawToken = normalizeString(token);
        const nextConfig = {
            ...safeObject(current),
            endpointUrl
        };
        if (rawToken === '-') {
            delete nextConfig.authToken;
        } else if (rawToken) {
            nextConfig.authToken = rawToken;
        }
        const client = window.FilterTubeManagedLocalNetworkClient;
        const provider = client && typeof client.createProvider === 'function'
            ? client.createProvider(nextConfig)
            : null;
        if (!provider || provider.configured !== true || !hasNanahManagedLocalNetworkDeliveryWriter(provider)) {
            UIComponents.showToast('Same-network endpoint must be HTTPS or private/local HTTP and supported by FilterTube', 'error');
            return;
        }
        writeNanahManagedLocalNetworkProviderConfig(nextConfig);
        await recordManagedLocalNetworkProviderConfigHistory({
            configured: true,
            endpointHost: getManagedLocalNetworkEndpointHostFromConfig(nextConfig)
        });
        await refreshProfilesUI();
        UIComponents.showToast('Same-network updates saved', 'success');
    }

    function hasNanahManagedMailboxUploadWriter(provider = getNanahManagedMailboxProvider()) {
        const root = safeObject(provider);
        return typeof root.uploadManagedMailboxItems === 'function'
            || typeof root.publishManagedMailboxItems === 'function'
            || typeof root.putManagedMailboxItems === 'function'
            || typeof root.enqueueManagedMailboxItems === 'function';
    }

    function hasNanahManagedLocalNetworkDeliveryWriter(provider = getNanahManagedLocalNetworkProvider()) {
        const root = safeObject(provider);
        return typeof root.publishManagedPolicyCandidates === 'function'
            || typeof root.deliverManagedPolicyCandidates === 'function'
            || typeof root.publishLocalNetworkCandidates === 'function'
            || typeof root.putManagedPolicyCandidates === 'function';
    }

    function getConcreteManagedPolicyScopesForProfile(scope, profile) {
        const requiredScopes = expandNanahManagedSendScope(scope);
        if (!requiredScopes.includes('time_limits')) return requiredScopes;
        const timePolicy = getManagedTimeLimitPolicy(profile);
        return requiredScopes.filter((requiredScope) => requiredScope !== 'time_limits' || !!timePolicy);
    }

    function isNanahManagedLinkLiveConnected(link) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted || trusted.linkType !== 'managed_link') return false;
        if (!nanahClient || !nanahSessionState.connected || !nanahSessionState.sasConfirmed) return false;
        if (getNanahRole() !== 'source' || normalizeString(nanahSessionState.remoteRole) !== 'replica') return false;
        return normalizeString(trusted.remoteDeviceId) === normalizeString(safeObject(nanahSessionState.remoteDevice).deviceId);
    }

    function getNanahSourceManagedLinksForTargetProfile(profileId, scope = 'active', profile = null) {
        const targetId = normalizeString(profileId);
        if (!targetId) return [];
        const requiredScopes = getConcreteManagedPolicyScopesForProfile(scope, profile);
        return safeArray(nanahTrustedLinks)
            .map((link) => normalizeNanahTrustedLink(link))
            .filter((trusted) => {
                if (!trusted) return false;
                const policy = safeObject(trusted.policy);
                if (trusted.linkType !== 'managed_link') return false;
                if (trusted.localRole !== 'source' || trusted.remoteRole !== 'replica') return false;
                if (trusted.revoked === true || policy.revoked === true || trusted.keyRevoked === true || policy.keyRevoked === true) return false;
                if (trusted.stalePairing === true || policy.stalePairing === true) return false;
                if (!normalizeString(trusted.linkId || trusted.id)) return false;
                if (getNanahTrustedLinkTargetProfileId(trusted) !== targetId) return false;
                const allowedScopes = getNanahManagedPolicyScopeList(policy.allowedScopes || policy.defaultScope);
                return requiredScopes.length === 0 || requiredScopes.every((requiredScope) => allowedScopes.includes(requiredScope));
            });
    }

    function getNanahSourceManagedLinkInventoryForTargetProfile(profileId) {
        const targetId = normalizeString(profileId);
        if (!targetId) {
            return { activeLinks: [], revokedLinks: [], staleLinks: [], totalLinks: [] };
        }
        const totalLinks = safeArray(nanahTrustedLinks)
            .map((link) => normalizeNanahTrustedLink(link))
            .filter((trusted) => {
                if (!trusted) return false;
                if (trusted.linkType !== 'managed_link') return false;
                if (trusted.localRole !== 'source' || trusted.remoteRole !== 'replica') return false;
                return getNanahTrustedLinkTargetProfileId(trusted) === targetId;
            });
        const revokedLinks = [];
        const staleLinks = [];
        const activeLinks = [];
        totalLinks.forEach((trusted) => {
            const policy = safeObject(trusted.policy);
            if (trusted.revoked === true || policy.revoked === true || trusted.keyRevoked === true || policy.keyRevoked === true) {
                revokedLinks.push(trusted);
                return;
            }
            if (trusted.stalePairing === true || policy.stalePairing === true) {
                staleLinks.push(trusted);
                return;
            }
            activeLinks.push(trusted);
        });
        return { activeLinks, revokedLinks, staleLinks, totalLinks };
    }

    function getManagedSyncTargetSummary(profileId) {
        const profile = safeObject(safeObject(profilesV4Cache).profiles)[normalizeString(profileId)];
        const inventory = getNanahSourceManagedLinkInventoryForTargetProfile(profileId);
        const links = getNanahSourceManagedLinksForTargetProfile(profileId, 'active', profile);
        const targetCount = links.length;
        const revokedCount = safeArray(inventory.revokedLinks).length;
        const staleCount = safeArray(inventory.staleLinks).length;
        const totalCount = safeArray(inventory.totalLinks).length;
        const liveReady = links.some(isNanahManagedLinkLiveConnected);
        const mailboxReady = hasNanahManagedMailboxUploadWriter();
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter();
        const readyCount = (liveReady || mailboxReady || localReady) ? targetCount : 0;
        const sourceAckLabels = links
            .map(formatNanahManagedSourceAckSyncStatus)
            .map(label => normalizeString(label))
            .filter(Boolean);
        const sourceAckLabel = sourceAckLabels.length
            ? Array.from(new Set(sourceAckLabels)).slice(0, 2).join(' | ')
            : '';
        if (!targetCount) {
            if (revokedCount > 0) {
                return {
                    label: `${revokedCount} device${revokedCount === 1 ? '' : 's'} need re-pairing`,
                    targetCount: 0,
                    readyCount: 0,
                    revokedCount,
                    staleCount,
                    totalCount,
                    sourceAckLabel: '',
                    liveReady: false,
                    mailboxReady: false,
                    localNetworkReady: false
                };
            }
            if (staleCount > 0) {
                return {
                    label: `${staleCount} stale device link${staleCount === 1 ? '' : 's'}`,
                    targetCount: 0,
                    readyCount: 0,
                    revokedCount,
                    staleCount,
                    totalCount,
                    sourceAckLabel: '',
                    liveReady: false,
                    mailboxReady: false,
                    localNetworkReady: false
                };
            }
            return {
                label: 'No verified device',
                targetCount: 0,
                readyCount: 0,
                revokedCount,
                staleCount,
                totalCount,
                sourceAckLabel: '',
                liveReady: false,
                mailboxReady: false,
                localNetworkReady: false
            };
        }
        const transports = [
            liveReady ? 'live' : '',
            localReady ? 'LAN' : '',
            mailboxReady ? 'mailbox' : ''
        ].filter(Boolean).join(' + ');
        return {
            label: transports
                ? `${targetCount} verified device${targetCount === 1 ? '' : 's'} | ${transports} ready`
                : `${targetCount} verified device${targetCount === 1 ? '' : 's'} | open both devices`,
            targetCount,
            readyCount,
            revokedCount,
            staleCount,
            totalCount,
            sourceAckLabel,
            liveReady,
            mailboxReady,
            localNetworkReady: localReady
        };
    }

    async function purgeNanahManagedMailboxQueueForTrustedLink(link, { reason = 'trusted_link_removed' } = {}) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted || trusted.linkType !== 'managed_link' || trusted.localRole !== 'source' || trusted.remoteRole !== 'replica') {
            return { ok: false, reason: 'not_source_managed_link', purgedMailboxItemCount: 0 };
        }
        if (!nanahManagedLivePolicy || typeof nanahManagedLivePolicy.purgeMailboxItemsForTrustedLink !== 'function') {
            return { ok: false, reason: 'managed_mailbox_purge_unavailable', purgedMailboxItemCount: 0 };
        }
        const now = Date.now();
        try {
            return await nanahManagedLivePolicy.purgeMailboxItemsForTrustedLink(
                trusted,
                getNanahManagedMailboxProvider(),
                {
                    reason,
                    requestedAt: now,
                    revokedAt: now
                }
            );
        } catch (error) {
            return {
                ok: false,
                reason: normalizeString(error?.message) || 'mailbox_purge_provider_failed',
                purgedMailboxItemCount: 0
            };
        }
    }

    async function recordManagedParentPolicyPushHistory(profileId, details = {}) {
        const targetId = normalizeString(profileId);
        const rootDetails = safeObject(details);
        if (!targetId) return false;
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return false;
        const fresh = await io.loadProfilesV4();
        const profiles = { ...safeObject(fresh.profiles) };
        const profile = safeObject(profiles[targetId]);
        if (!profile || Object.keys(profile).length === 0) return false;
        if (!canActiveProfileManageProfile(fresh, targetId)) return false;

        const now = Date.now();
        const linkCount = normalizeNonNegativeInteger(rootDetails.linkCount) || 0;
        const deliveredCount = normalizeNonNegativeInteger(rootDetails.deliveredCount) || 0;
        const failedCount = normalizeNonNegativeInteger(rootDetails.failedCount) || 0;
        const deliverySummary = summarizeManagedDeliveryHistory(rootDetails);
        const result = resolveManagedPolicyPushResult(deliveredCount, failedCount);
        const row = {
            rowId: `managed-parent-push-${targetId}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: normalizeString(fresh.activeProfileId) || activeProfileId || 'default',
            actorDeviceId: normalizeString(nanahStableDeviceId) || 'local-extension-device',
            targetProfileId: targetId,
            trustedLinkId: linkCount === 1 ? normalizeString(rootDetails.firstLinkId) : null,
            actionType: 'remote_policy.source_push',
            scope: normalizeString(rootDetails.scope) || 'active',
            revision: null,
            policyHash: null,
            result,
            reason: result === 'sent' ? null : (normalizeString(rootDetails.reason) || 'managed_policy_delivery_failed'),
            receivedAt: now,
            issuedAt: now,
            orderKey: `push:${now}`,
            summary: {
                redacted: true,
                label: deliveredCount > 0 ? 'Sent parent policy update' : 'Parent policy update failed',
                ...deliverySummary
            },
            sensitive: true
        };
        profiles[targetId] = {
            ...profile,
            managedActionHistory: appendManagedActionHistoryRow(profile, row)
        };
        const nextRoot = {
            ...fresh,
            schemaVersion: 4,
            profiles
        };
        await io.saveProfilesV4(nextRoot);
        profilesV4Cache = nextRoot;
        return true;
    }

    function getManagedMailboxEndpointHostFromConfig(config) {
        const endpoint = normalizeString(safeObject(config).endpointUrl || safeObject(config).url || safeObject(config).baseUrl);
        if (!endpoint) return '';
        try {
            return normalizeString(new URL(endpoint).host);
        } catch (_) {
            return '';
        }
    }

    function getManageableProtectedProfileIds(profilesV4) {
        const root = safeObject(profilesV4);
        const profiles = safeObject(root.profiles);
        const activeId = normalizeString(root.activeProfileId) || activeProfileId || 'default';
        return Object.keys(profiles)
            .map(id => normalizeString(id))
            .filter(Boolean)
            .filter(id => id !== 'default' && id !== activeId)
            .filter(id => canActiveProfileManageProfile(root, id));
    }

    async function recordManagedMailboxProviderConfigHistory(details = {}) {
        const rootDetails = safeObject(details);
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return 0;
        const fresh = await io.loadProfilesV4();
        const actorId = normalizeString(fresh.activeProfileId) || activeProfileId || 'default';
        if (getProfileType(fresh, actorId) === 'child') return 0;
        const profiles = { ...safeObject(fresh.profiles) };
        const targetIds = getManageableProtectedProfileIds(fresh);
        if (!targetIds.length) return 0;

        const now = Date.now();
        const mailboxConfigured = rootDetails.configured === true;
        const endpointHost = normalizeString(rootDetails.endpointHost).slice(0, 160);
        targetIds.forEach((targetId) => {
            const profile = safeObject(profiles[targetId]);
            if (!profile || Object.keys(profile).length === 0) return;
            const row = {
                rowId: `managed-mailbox-config-${targetId}-${now}`,
                schema: MANAGED_ACTION_HISTORY_SCHEMA,
                version: 1,
                actorProfileId: actorId,
                actorDeviceId: normalizeString(nanahStableDeviceId) || 'local-extension-device',
                targetProfileId: targetId,
                trustedLinkId: null,
                actionType: 'delivery.mailbox.configure',
                scope: 'mailbox_provider',
                revision: null,
                policyHash: null,
                result: 'accepted',
                reason: mailboxConfigured ? 'mailbox_provider_configured' : 'mailbox_provider_disabled',
                receivedAt: now,
                issuedAt: now,
                orderKey: `mailbox-config:${now}`,
                summary: {
                    redacted: true,
                    label: mailboxConfigured ? 'Mailbox provider configured' : 'Mailbox provider disabled',
                    mailboxConfigured,
                    endpointHost: mailboxConfigured ? endpointHost : '',
                    targetCount: targetIds.length
                },
                sensitive: true
            };
            profiles[targetId] = {
                ...profile,
                managedActionHistory: appendManagedActionHistoryRow(profile, row)
            };
        });

        const nextRoot = {
            ...fresh,
            schemaVersion: 4,
            profiles
        };
        await io.saveProfilesV4(nextRoot);
        profilesV4Cache = nextRoot;
        return targetIds.length;
    }

    async function recordManagedLocalNetworkProviderConfigHistory(details = {}) {
        const rootDetails = safeObject(details);
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return 0;
        const fresh = await io.loadProfilesV4();
        const actorId = normalizeString(fresh.activeProfileId) || activeProfileId || 'default';
        if (getProfileType(fresh, actorId) === 'child') return 0;
        const profiles = { ...safeObject(fresh.profiles) };
        const targetIds = getManageableProtectedProfileIds(fresh);
        if (!targetIds.length) return 0;

        const now = Date.now();
        const localNetworkConfigured = rootDetails.configured === true;
        const endpointHost = normalizeString(rootDetails.endpointHost).slice(0, 160);
        targetIds.forEach((targetId) => {
            const profile = safeObject(profiles[targetId]);
            if (!profile || Object.keys(profile).length === 0) return;
            const row = {
                rowId: `managed-local-network-config-${targetId}-${now}`,
                schema: MANAGED_ACTION_HISTORY_SCHEMA,
                version: 1,
                actorProfileId: actorId,
                actorDeviceId: normalizeString(nanahStableDeviceId) || 'local-extension-device',
                targetProfileId: targetId,
                trustedLinkId: null,
                actionType: 'delivery.local_network.configure',
                scope: 'local_network_provider',
                revision: null,
                policyHash: null,
                result: 'accepted',
                reason: localNetworkConfigured ? 'local_network_provider_configured' : 'local_network_provider_disabled',
                receivedAt: now,
                issuedAt: now,
                orderKey: `local-network-config:${now}`,
                summary: {
                    redacted: true,
                    label: localNetworkConfigured ? 'Local-network provider configured' : 'Local-network provider disabled',
                    localNetworkConfigured,
                    endpointHost: localNetworkConfigured ? endpointHost : '',
                    targetCount: targetIds.length
                },
                sensitive: true
            };
            profiles[targetId] = {
                ...profile,
                managedActionHistory: appendManagedActionHistoryRow(profile, row)
            };
        });

        const nextRoot = {
            ...fresh,
            schemaVersion: 4,
            profiles
        };
        await io.saveProfilesV4(nextRoot);
        profilesV4Cache = nextRoot;
        return targetIds.length;
    }

    async function recordManagedSigningKeyRotationHistoryForLink(link, details = {}) {
        const trusted = normalizeNanahTrustedLink(link);
        const rootDetails = safeObject(details);
        const targetId = getNanahTrustedLinkTargetProfileId(trusted);
        const linkId = normalizeString(trusted?.linkId);
        if (!targetId || !linkId) return false;
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return false;
        const fresh = await io.loadProfilesV4();
        if (!canActiveProfileManageProfile(fresh, targetId)) return false;
        const profiles = { ...safeObject(fresh.profiles) };
        const profile = safeObject(profiles[targetId]);
        if (!profile || Object.keys(profile).length === 0) return false;
        const now = Date.now();
        const row = {
            rowId: `managed-signing-key-rotate-${targetId}-${linkId}-${now}`,
            schema: MANAGED_ACTION_HISTORY_SCHEMA,
            version: 1,
            actorProfileId: normalizeString(fresh.activeProfileId) || activeProfileId || 'default',
            actorDeviceId: normalizeString(nanahStableDeviceId) || 'local-extension-device',
            targetProfileId: targetId,
            trustedLinkId: linkId,
            actionType: 'trust_link.key_revoke',
            scope: 'trust_link',
            revision: null,
            policyHash: null,
            result: 'accepted',
            reason: 'source_signing_key_rotated',
            receivedAt: now,
            issuedAt: now,
            orderKey: `key-rotate:${now}:${linkId}`,
            summary: {
                redacted: true,
                label: 'Managed signing key rotated',
                revokedLinkCount: 1,
                mailboxPurgedCount: normalizeNonNegativeInteger(rootDetails.mailboxPurgedCount) || 0,
                previousKeyVersion: normalizeNonNegativeInteger(rootDetails.previousKeyVersion) || 0,
                nextKeyVersion: normalizeNonNegativeInteger(rootDetails.nextKeyVersion) || 0
            },
            sensitive: true
        };
        profiles[targetId] = {
            ...profile,
            managedActionHistory: appendManagedActionHistoryRow(profile, row)
        };
        const nextRoot = {
            ...fresh,
            schemaVersion: 4,
            profiles
        };
        await io.saveProfilesV4(nextRoot);
        profilesV4Cache = nextRoot;
        return true;
    }

    async function sendManagedParentPolicyToVerifiedDevices(profileIds, { scope = 'active', surface = '' } = {}) {
        const targetIds = Array.from(new Set(safeArray(profileIds).map(id => normalizeString(id)).filter(Boolean)));
        if (!targetIds.length) {
            UIComponents.showToast('Select at least one protected profile first', 'info');
            return null;
        }
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return null;
        }
        if (!nanahManagedLivePolicy) {
            UIComponents.showToast('Managed policy delivery helpers are unavailable', 'error');
            return null;
        }

        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh.activeProfileId) || activeProfileId || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Switch to the master or parent account before sending managed updates', 'error');
            return null;
        }
        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const targetId of targetIds) {
                await recordManagedAdminAuthFailureHistory(fresh, targetId, 'managed_policy_push_unlock_failed');
            }
            return null;
        }

        await ensureNanahManagedSigningKeyPair({ required: true });
        const normalizedScope = normalizeString(scope) || 'active';
        const normalizedSurface = (() => {
            const value = normalizeString(surface).toLowerCase();
            return value === 'kids' || value === 'main' ? value : '';
        })();
        const mailboxProvider = getNanahManagedMailboxProvider();
        const localNetworkProvider = getNanahManagedLocalNetworkProvider();
        const mailboxReady = hasNanahManagedMailboxUploadWriter(mailboxProvider);
        const localReady = hasNanahManagedLocalNetworkDeliveryWriter(localNetworkProvider);
        const profiles = safeObject(fresh.profiles);
        const allowedTargets = targetIds.filter((targetId) => {
            const profile = safeObject(profiles[targetId]);
            return Object.keys(profile).length > 0 && canActiveProfileManageProfile(fresh, targetId);
        });
        if (!allowedTargets.length) {
            UIComponents.showToast('No selected protected profile is manageable from this account', 'error');
            return null;
        }

        const summary = {
            targetCount: allowedTargets.length,
            linkCount: 0,
            deliveredCount: 0,
            failedCount: 0,
            liveSentCount: 0,
            mailboxUploadedCount: 0,
            localNetworkDeliveredCount: 0,
            providerMissingCount: 0,
            noLinkCount: 0
        };

        for (const targetId of allowedTargets) {
            const targetProfile = safeObject(profiles[targetId]);
            const links = getNanahSourceManagedLinksForTargetProfile(targetId, normalizedScope, targetProfile);
            summary.linkCount += links.length;
            if (!links.length) {
                summary.noLinkCount += 1;
                await recordManagedParentPolicyPushHistory(targetId, {
                    scope: normalizedScope,
                    linkCount: 0,
                    deliveredCount: 0,
                    failedCount: 1,
                    noLinkCount: 1,
                    reason: 'no_verified_device'
                });
                continue;
            }
            const liveLinks = links.filter(isNanahManagedLinkLiveConnected);
            const liveReady = liveLinks.length > 0;
            if (!liveReady && !mailboxReady && !localReady) {
                summary.providerMissingCount += 1;
                await recordManagedParentPolicyPushHistory(targetId, {
                    scope: normalizedScope,
                    linkCount: links.length,
                    firstLinkId: links[0]?.linkId,
                    deliveredCount: 0,
                    failedCount: links.length,
                    providerMissingCount: 1,
                    reason: 'managed_delivery_provider_unavailable'
                });
                continue;
            }

            const policy = {
                linkType: 'managed_link',
                authorityMode: 'managed',
                scope: normalizedScope,
                strategy: 'merge',
                allowedScopes: [normalizedScope]
            };
            const transports = [];
            let targetDelivered = 0;
            let targetFailed = 0;
            let liveSent = 0;
            let mailboxUploaded = 0;
            let localNetworkDelivered = 0;
            let failureReason = '';
            nanahManagedPolicySourceOverride = {
                profileId: targetId,
                profile: targetProfile,
                sourceKind: 'command_center_protected_profile',
                surface: normalizedSurface
            };
            try {
                if (liveReady && typeof nanahManagedLivePolicy.buildEnvelopeBatchForTrustedLinks === 'function') {
                    const liveEnvelopes = await nanahManagedLivePolicy.buildEnvelopeBatchForTrustedLinks(policy, liveLinks);
                    for (const signedEnvelope of liveEnvelopes) {
                        await nanahClient.send(signedEnvelope);
                        await nanahManagedLivePolicy.markSent(
                            signedEnvelope.linkId,
                            signedEnvelope.scope,
                            signedEnvelope.revision,
                            signedEnvelope.policyHash,
                            {
                                targetProfileId: signedEnvelope.targetProfileId,
                                targetProfileName: signedEnvelope.targetProfileName,
                                sourceProfileId: signedEnvelope.sourceProfileId,
                                sourceDeviceId: signedEnvelope.sourceDeviceId,
                                issuedAt: signedEnvelope.issuedAt,
                                delivery: 'command_center_live_session'
                            }
                        );
                    }
                    liveSent = liveEnvelopes.length;
                    if (liveSent > 0) transports.push('live_nanah_session');
                    targetDelivered += liveSent;
                }
                if (localReady && typeof nanahManagedLivePolicy.deliverLocalNetworkPolicyBatch === 'function') {
                    const localResult = await nanahManagedLivePolicy.deliverLocalNetworkPolicyBatch(
                        policy,
                        links,
                        localNetworkProvider,
                        {
                            reason: 'command_center_parent_push',
                            requestedAt: Date.now()
                        }
                    );
                    localNetworkDelivered = normalizeNonNegativeInteger(localResult?.deliveredCandidateCount) || 0;
                    if (localNetworkDelivered > 0) transports.push('local_network');
                    targetDelivered += localNetworkDelivered;
                    targetFailed += normalizeNonNegativeInteger(localResult?.failedCandidateCount) || 0;
                    failureReason = failureReason || normalizeString(localResult?.reason);
                }
                if (mailboxReady && typeof nanahManagedLivePolicy.uploadMailboxPolicyBatch === 'function') {
                    const mailboxResult = await nanahManagedLivePolicy.uploadMailboxPolicyBatch(
                        policy,
                        links,
                        mailboxProvider,
                        {
                            reason: 'command_center_parent_push',
                            requestedAt: Date.now()
                        }
                    );
                    mailboxUploaded = normalizeNonNegativeInteger(mailboxResult?.uploadedMailboxItemCount) || 0;
                    if (mailboxUploaded > 0) transports.push('encrypted_mailbox');
                    targetDelivered += mailboxUploaded;
                    targetFailed += normalizeNonNegativeInteger(mailboxResult?.failedMailboxItemCount) || 0;
                    failureReason = failureReason || normalizeString(mailboxResult?.reason);
                }
            } catch (error) {
                targetFailed += links.length;
                failureReason = normalizeString(error?.message) || 'managed_policy_delivery_failed';
            } finally {
                nanahManagedPolicySourceOverride = null;
            }
            summary.deliveredCount += targetDelivered;
            summary.failedCount += targetFailed;
            summary.liveSentCount += liveSent;
            summary.mailboxUploadedCount += mailboxUploaded;
            summary.localNetworkDeliveredCount += localNetworkDelivered;
            await recordManagedParentPolicyPushHistory(targetId, {
                scope: normalizedScope,
                linkCount: links.length,
                firstLinkId: links[0]?.linkId,
                deliveredCount: targetDelivered,
                failedCount: targetFailed,
                liveSentCount: liveSent,
                mailboxUploadedCount: mailboxUploaded,
                localNetworkDeliveredCount: localNetworkDelivered,
                transports,
                reason: targetDelivered > 0 ? '' : (failureReason || 'managed_policy_delivery_failed')
            });
        }

        await loadNanahTrustedLinks();
        await refreshProfilesUI();
        if (summary.deliveredCount > 0) {
            UIComponents.showToast(`Sent managed updates to ${summary.deliveredCount} verified policy queue${summary.deliveredCount === 1 ? '' : 's'}`, 'success');
        } else if (summary.noLinkCount > 0) {
            UIComponents.showToast('No selected protected profile has a verified device link yet', 'error');
        } else {
            UIComponents.showToast('No delivery provider is available for verified-device updates yet', 'error');
        }
        return summary;
    }

    async function saveNanahTrustedLink(entry) {
        const deviceId = normalizeString(entry?.remoteDeviceId);
        if (!deviceId) return;
        const nextEntry = normalizeNanahTrustedLink({
            ...safeObject(entry),
            linkId: normalizeString(entry?.linkId) || `nanah-${deviceId}`,
            remoteDeviceId: deviceId,
            deviceLabel: normalizeString(entry?.deviceLabel) || deviceId,
            app: 'filtertube',
            createdAt: normalizeString(entry?.createdAt) || new Date().toISOString(),
            lastUsedAt: new Date().toISOString()
        });
        if (!nextEntry) return;
        const nextIdentityKey = normalizeString(nextEntry.trustedLinkIdentityKey || nextEntry.identityKey);
        const nextLinkId = normalizeString(nextEntry.linkId);
        const existingIndex = nanahTrustedLinks.findIndex((item) => {
            const current = normalizeNanahTrustedLink(item);
            if (!current) return false;
            if (normalizeString(current.linkId) === nextLinkId) return true;
            const currentIdentityKey = normalizeString(current.trustedLinkIdentityKey || current.identityKey);
            return !!nextIdentityKey && currentIdentityKey === nextIdentityKey;
        });
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
        if (!normalized) return { mailboxPurgeResult: null };
        const removedLink = normalizeNanahTrustedLink(
            nanahTrustedLinks.find((entry) => normalizeString(entry?.linkId) === normalized)
        );
        const mailboxPurgeResult = await purgeNanahManagedMailboxQueueForTrustedLink(removedLink);
        nanahTrustedLinks = nanahTrustedLinks.filter((entry) => normalizeString(entry?.linkId) !== normalized);
        await purgeNanahManagedPolicyStateForTrustedLink(normalized);
        await purgeNanahManagedOpenSyncStateForTrustedLink(normalized);
        await purgeNanahManagedLocalNetworkSyncStateForTrustedLink(normalized);
        await persistNanahTrustedLinks();
        renderNanahTrustedLinks();
        return { mailboxPurgeResult };
    }

    function isActiveNanahSourceManagedLink(link) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted || trusted.linkType !== 'managed_link') return false;
        const policy = safeObject(trusted.policy);
        if (trusted.localRole !== 'source' || trusted.remoteRole !== 'replica') return false;
        if (trusted.revoked === true || policy.revoked === true) return false;
        if (trusted.keyRevoked === true || policy.keyRevoked === true) return false;
        return true;
    }

    async function rotateNanahManagedSourceSigningKey() {
        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function') {
            UIComponents.showToast('Profiles unavailable', 'error');
            return null;
        }
        const fresh = await io.loadProfilesV4();
        const currentActive = normalizeString(fresh.activeProfileId) || activeProfileId || 'default';
        if (getProfileType(fresh, currentActive) === 'child') {
            UIComponents.showToast('Switch to the master or parent account before rotating managed trust keys', 'error');
            return null;
        }
        const sourceLinks = safeArray(nanahTrustedLinks)
            .map((entry) => normalizeNanahTrustedLink(entry))
            .filter(isActiveNanahSourceManagedLink);
        if (!sourceLinks.length) {
            UIComponents.showToast('No active managed child-device links need key rotation', 'info');
            return null;
        }
        const confirmed = window.confirm(
            'Rotate the managed signing key for this parent device? This revokes existing managed child-device links and those devices must be paired again before they can receive new managed updates.'
        );
        if (!confirmed) return null;
        const okAdmin = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
        if (!okAdmin) {
            for (const link of sourceLinks) {
                const targetId = getNanahTrustedLinkTargetProfileId(link);
                if (targetId) await recordManagedAdminAuthFailureHistory(fresh, targetId, 'managed_signing_key_rotate_unlock_failed');
            }
            return null;
        }

        const previousKey = normalizeNanahManagedSigningKeyPair(
            await readNanahStorage(NANAH_MANAGED_SIGNING_KEYPAIR_KEY)
        );
        const previousKeyVersion = normalizeNonNegativeInteger(previousKey?.managedKeyVersion || previousKey?.keyVersion || previousKey?.sourceKeyVersion) || 0;
        const nextKey = await ensureNanahManagedSigningKeyPair({ required: true, rotate: true });
        if (!nextKey) {
            UIComponents.showToast('Managed signing key rotation failed', 'error');
            return null;
        }
        const nextKeyVersion = normalizeNonNegativeInteger(nextKey.managedKeyVersion || nextKey.keyVersion || nextKey.sourceKeyVersion) || 0;

        const now = Date.now();
        const affectedIds = new Set(sourceLinks.map(link => normalizeString(link.linkId)).filter(Boolean));
        nanahTrustedLinks = safeArray(nanahTrustedLinks).map((entry) => {
            const trusted = normalizeNanahTrustedLink(entry);
            const linkId = normalizeString(trusted?.linkId);
            if (!trusted || !affectedIds.has(linkId)) return entry;
            const currentPolicy = safeObject(trusted.policy);
            return {
                ...trusted,
                keyRevoked: true,
                revokedAt: now,
                keyRevokedAt: now,
                revocationReason: 'source_signing_key_rotated',
                policy: {
                    ...currentPolicy,
                    keyRevoked: true,
                    revokedAt: now,
                    keyRevokedAt: now,
                    revocationReason: 'source_signing_key_rotated'
                }
            };
        });

        let mailboxPurgedCount = 0;
        for (const link of sourceLinks) {
            const purge = await purgeNanahManagedMailboxQueueForTrustedLink(link, { reason: 'source_signing_key_rotated' });
            const linkMailboxPurgedCount = normalizeNonNegativeInteger(purge?.purgedMailboxItemCount) || 0;
            mailboxPurgedCount += linkMailboxPurgedCount;
            const linkId = normalizeString(link.linkId);
            const policyPurge = await purgeNanahManagedPolicyStateForTrustedLink(linkId, {
                reason: 'source_signing_key_rotated',
                actionType: 'trust_link.key_revoke',
                label: 'Managed signing key rotated'
            });
            const targetId = getNanahTrustedLinkTargetProfileId(link);
            if (!safeArray(policyPurge?.touchedProfileIds).includes(targetId)) {
                await recordManagedSigningKeyRotationHistoryForLink(link, {
                    previousKeyVersion,
                    nextKeyVersion,
                    mailboxPurgedCount: linkMailboxPurgedCount
                });
            }
            await purgeNanahManagedOpenSyncStateForTrustedLink(linkId);
            await purgeNanahManagedLocalNetworkSyncStateForTrustedLink(linkId);
            await purgeNanahManagedSourceAckSyncStateForTrustedLink(linkId);
        }

        await persistNanahTrustedLinks();
        renderNanahTrustedLinks();
        await loadNanahManagedSigningKeyDescriptor();
        await refreshProfilesUI();
        UIComponents.showToast(
            `Managed signing key rotated. ${sourceLinks.length} child-device link${sourceLinks.length === 1 ? '' : 's'} must be paired again.`,
            'success'
        );
        return {
            rotated: true,
            previousKeyVersion,
            nextKeyVersion,
            revokedLinkCount: sourceLinks.length,
            mailboxPurgedCount
        };
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

    async function markNanahTrustedLinkUsed(remoteDeviceId, options = {}) {
        const link = findNanahTrustedLink(remoteDeviceId, options);
        if (!link) return;
        const linkId = normalizeString(link.linkId);
        const linkIndex = nanahTrustedLinks.findIndex((entry) => normalizeString(entry?.linkId) === linkId);
        if (linkIndex >= 0) {
            nanahTrustedLinks.splice(linkIndex, 1, {
                ...nanahTrustedLinks[linkIndex],
                lastUsedAt: new Date().toISOString()
            });
        } else {
            link.lastUsedAt = new Date().toISOString();
        }
        await persistNanahTrustedLinks();
        renderNanahTrustedLinks();
    }

    async function loadNanahManagedOpenSyncState() {
        nanahManagedOpenSyncState = safeObject(await readNanahStorage(NANAH_MANAGED_OPEN_SYNC_STATE_KEY));
    }

    async function persistNanahManagedOpenSyncState(state) {
        nanahManagedOpenSyncState = safeObject(state);
        await writeNanahStorage(NANAH_MANAGED_OPEN_SYNC_STATE_KEY, nanahManagedOpenSyncState);
    }

    async function recordManagedOpenSyncAckHistory(details = {}) {
        const root = safeObject(details);
        const request = safeObject(root.request);
        const candidate = safeObject(root.candidate);
        const ackResult = safeObject(root.ackResult);
        const records = safeArray(root.records);
        const targetProfileId = normalizeString(request.targetProfileId || candidate.targetProfileId);
        const transport = normalizeString(root.transport || ackResult.transport || request.transport).toLowerCase() === 'local_network'
            ? 'local_network'
            : 'mailbox';
        if (!targetProfileId || records.length === 0) {
            return { ok: false, reason: 'missing_ack_history_target', recordedCount: 0, failedCount: records.length };
        }

        const io = window.FilterTubeIO || {};
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            return { ok: false, reason: 'profiles_unavailable', recordedCount: 0, failedCount: records.length };
        }

        const fresh = await io.loadProfilesV4();
        const profiles = { ...safeObject(fresh.profiles) };
        const profile = safeObject(profiles[targetProfileId]);
        if (!profile || Object.keys(profile).length === 0) {
            return { ok: false, reason: 'target_profile_missing', recordedCount: 0, failedCount: records.length };
        }

        const now = Date.now();
        const ackedCount = Math.max(0, Math.floor(Number(ackResult.ackedItemCount ?? ackResult.ackedCandidateCount) || 0));
        const failedCount = Math.max(0, Math.floor(Number(ackResult.failedAckCount ?? ackResult.failedCandidateCount) || 0));
        const providerAcceptedAll = ackResult.ok !== false && failedCount === 0 && ackedCount >= records.length;
        const historyRows = [];
        records.forEach((record, index) => {
            const ackRecord = safeObject(record);
            const scope = normalizeString(ackRecord.scope).toLowerCase() || 'sync_policy';
            const revision = normalizeNonNegativeInteger(ackRecord.revision) || null;
            const policyHash = normalizeString(ackRecord.policyHash) || null;
            if (!scope || !revision || !policyHash) return;
            const mailboxItemId = normalizeString(ackRecord.mailboxItemId);
            const localNetworkCandidateId = normalizeString(ackRecord.localNetworkCandidateId || ackRecord.candidateId);
            const itemId = transport === 'local_network' ? localNetworkCandidateId : mailboxItemId;
            const transportLabel = transport === 'local_network' ? 'Local-network' : 'Mailbox';
            const result = providerAcceptedAll ? 'accepted' : 'rejected';
            const reason = providerAcceptedAll
                ? null
                : (normalizeString(ackResult.reason) || 'ack_handoff_failed');
            historyRows.push({
                rowId: `remote-${transport.replace('_', '-')}-ack-${scope}-${revision}-${itemId || 'item'}-${now}-${index}`,
                schema: MANAGED_ACTION_HISTORY_SCHEMA,
                version: 1,
                actorProfileId: normalizeString(ackRecord.sourceProfileId || request.sourceProfileId || candidate.sourceProfileId) || null,
                actorDeviceId: normalizeString(ackRecord.sourceDeviceId || request.sourceDeviceId || candidate.sourceDeviceId) || 'unknown-source-device',
                targetProfileId,
                trustedLinkId: normalizeString(ackRecord.linkId || request.linkId || candidate.linkId),
                actionType: transport === 'local_network' ? 'remote_policy.local_network.ack' : 'remote_policy.mailbox.ack',
                scope,
                revision,
                policyHash,
                result,
                reason,
                receivedAt: now,
                issuedAt: normalizeNonNegativeInteger(ackRecord.ackedAt || request.ackedAt) || now,
                orderKey: `ack:${String(revision).padStart(6, '0')}:${now}:${index}`,
                summary: {
                    redacted: true,
                    label: providerAcceptedAll ? `${transportLabel} ack delivered` : `${transportLabel} ack handoff failed`,
                    transport,
                    mailboxItemId: mailboxItemId || null,
                    localNetworkCandidateId: localNetworkCandidateId || null,
                    ackState: normalizeString(ackRecord.ackState) || null,
                    providerAckedItemCount: ackedCount,
                    providerFailedAckCount: failedCount,
                    providerAckedCandidateCount: transport === 'local_network' ? ackedCount : null,
                    providerFailedCandidateCount: transport === 'local_network' ? failedCount : null
                },
                sensitive: true
            });
        });

        if (historyRows.length === 0) {
            return { ok: false, reason: 'no_recordable_ack_history_rows', recordedCount: 0, failedCount: records.length };
        }

        profiles[targetProfileId] = {
            ...profile,
            managedActionHistory: appendManagedActionHistoryRows(profile, historyRows)
        };
        await io.saveProfilesV4({
            ...fresh,
            schemaVersion: 4,
            profiles
        });
        profilesV4Cache = { ...fresh, schemaVersion: 4, profiles };
        return { ok: true, reason: '', recordedCount: historyRows.length, failedCount: 0 };
    }

    function createNanahManagedOpenSyncHelper() {
        const factory = window.FilterTubeNanahManagedOpenSync?.create;
        return typeof factory === 'function' ? factory({ normalizeString, safeObject, safeArray }) : null;
    }

    function formatNanahManagedOpenSyncStatus(link) {
        return createNanahManagedOpenSyncHelper()?.formatStatus(link, nanahManagedOpenSyncState, activeProfileId) || '';
    }

    async function runNanahManagedOpenSync({ reason = 'dashboard_open' } = {}) {
        const helper = createNanahManagedOpenSyncHelper();
        if (!helper) return null;
        const io = window.FilterTubeIO || {};
        const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const activeId = normalizeString(localProfilesV4?.activeProfileId) || activeProfileId || 'default';
        const state = await helper.runOpenSync({
            links: nanahTrustedLinks,
            activeProfileId: activeId,
            profilesV4: localProfilesV4,
            reason,
            applyMailboxItem: (item) => handleNanahIncomingManagedMailboxItem(item),
            recordAckHistory: (details) => recordManagedOpenSyncAckHistory(details),
            writeState: persistNanahManagedOpenSyncState
        });
        renderNanahTrustedLinks();
        return state;
    }

    async function loadNanahManagedLocalNetworkSyncState() {
        nanahManagedLocalNetworkSyncState = safeObject(await readNanahStorage(NANAH_MANAGED_LOCAL_NETWORK_SYNC_STATE_KEY));
    }

    async function persistNanahManagedLocalNetworkSyncState(state) {
        nanahManagedLocalNetworkSyncState = safeObject(state);
        await writeNanahStorage(NANAH_MANAGED_LOCAL_NETWORK_SYNC_STATE_KEY, nanahManagedLocalNetworkSyncState);
    }

    function getNanahManagedLocalNetworkProvider() {
        return safeObject(window.FilterTubeManagedPolicyLocalNetwork);
    }

    const NANAH_MANAGED_LOCAL_NETWORK_CONFIG_KEY = 'ftManagedLocalNetworkProviderConfig';

    function readNanahManagedLocalNetworkProviderConfig() {
        try {
            return safeObject(JSON.parse(localStorage.getItem(NANAH_MANAGED_LOCAL_NETWORK_CONFIG_KEY) || '{}'));
        } catch (_) {
            return {};
        }
    }

    function getManagedLocalNetworkEndpointHostFromConfig(config) {
        const endpoint = normalizeString(safeObject(config).endpointUrl || safeObject(config).url || safeObject(config).baseUrl);
        if (!endpoint) return '';
        try {
            return normalizeString(new URL(endpoint).host);
        } catch (_) {
            return '';
        }
    }

    function writeNanahManagedLocalNetworkProviderConfig(config) {
        try {
            const root = safeObject(config);
            if (!normalizeString(root.endpointUrl || root.url || root.baseUrl)) {
                localStorage.removeItem(NANAH_MANAGED_LOCAL_NETWORK_CONFIG_KEY);
                delete window.FilterTubeManagedPolicyLocalNetwork;
                return null;
            }
            localStorage.setItem(NANAH_MANAGED_LOCAL_NETWORK_CONFIG_KEY, JSON.stringify(root));
            if (window.FilterTubeManagedLocalNetworkClient?.createProvider) {
                window.FilterTubeManagedPolicyLocalNetwork = window.FilterTubeManagedLocalNetworkClient.createProvider(root);
            } else {
                delete window.FilterTubeManagedPolicyLocalNetwork;
            }
            return window.FilterTubeManagedPolicyLocalNetwork || null;
        } catch (_) {
            return null;
        }
    }

    function summarizeManagedLocalNetworkProviderConfig() {
        const config = readNanahManagedLocalNetworkProviderConfig();
        const endpoint = normalizeString(config.endpointUrl || config.url || config.baseUrl);
        const provider = getNanahManagedLocalNetworkProvider();
        const configured = provider.configured === true && hasNanahManagedLocalNetworkDeliveryWriter(provider);
        if (!endpoint) {
            return {
                configured: false,
                label: 'Same-network updates off',
                detail: 'Live P2P and later updates can still work. Set this up only if you run a trusted local gateway.',
                tone: 'warning'
            };
        }
        const host = normalizeString(provider.endpointHost) || getManagedLocalNetworkEndpointHostFromConfig(config) || endpoint;
        if (!configured) {
            return {
                configured: false,
                label: 'Same-network updates need review',
                detail: `${host} is saved but is not ready for local delivery.`,
                tone: 'warning'
            };
        }
        return {
            configured: true,
            label: `Same-network ready: ${host}`,
            detail: 'Local delivery is available. The protected device still accepts only trusted parent updates.',
            tone: 'success'
        };
    }

    function resolveNanahManagedLocalNetworkTargetProfileId(link, activeId) {
        const policy = safeObject(link?.policy);
        const behavior = getNanahTargetProfileBehavior(policy.targetProfileBehavior, 'current_active');
        return behavior === 'fixed_profile'
            ? normalizeString(policy.targetProfileId)
            : normalizeString(activeId);
    }

    function buildNanahManagedLocalNetworkDiscoveryRequest(link, activeId, reason) {
        const trusted = safeObject(link);
        const policy = safeObject(trusted.policy);
        const targetProfileId = resolveNanahManagedLocalNetworkTargetProfileId(trusted, activeId);
        return {
            schema: 'filtertube_managed_local_network_discovery_request',
            version: 1,
            reason: normalizeString(reason) || 'dashboard_open',
            requestedAt: Date.now(),
            linkId: normalizeString(trusted.linkId || trusted.id),
            remoteDeviceId: normalizeString(trusted.remoteDeviceId),
            sourceDeviceId: normalizeString(trusted.sourceDeviceId || policy.sourceDeviceId) || normalizeString(trusted.remoteDeviceId),
            sourceProfileId: normalizeString(trusted.sourceProfileId || policy.sourceProfileId),
            targetProfileId,
            allowedScopes: getNanahScopeList(policy.allowedScopes || policy.defaultScope),
            sourcePublicKeyId: normalizeString(trusted.sourcePublicKeyId || policy.sourcePublicKeyId),
            keyVersion: Number(trusted.keyVersion || policy.keyVersion) || 0
        };
    }

    function getNanahManagedLocalNetworkEligibleLinks(activeId, localProfilesV4) {
        const profiles = safeObject(safeObject(localProfilesV4).profiles);
        return safeArray(nanahTrustedLinks)
            .map((link) => {
                const trusted = normalizeNanahTrustedLink(link);
                if (!trusted) return null;
                const policy = safeObject(trusted.policy);
                if (trusted.linkType !== 'managed_link') return null;
                if (trusted.localRole !== 'replica' || trusted.remoteRole !== 'source') return null;
                if (trusted.revoked === true || policy.revoked === true || trusted.keyRevoked === true || policy.keyRevoked === true) return null;
                if (trusted.stalePairing === true || policy.stalePairing === true) return null;
                if (policy.syncOnProfileOpen !== true) return null;
                if (normalizeString(policy.lockedChildMode).toLowerCase() !== 'allow_trusted_updates') return null;
                const targetProfileId = resolveNanahManagedLocalNetworkTargetProfileId(trusted, activeId);
                if (!targetProfileId || targetProfileId !== normalizeString(activeId)) return null;
                if (!safeObject(profiles[targetProfileId]) || Object.keys(safeObject(profiles[targetProfileId])).length === 0) return null;
                const request = buildNanahManagedLocalNetworkDiscoveryRequest(trusted, activeId, 'candidate_probe');
                if (!request.sourceDeviceId || !request.sourceProfileId || !request.sourcePublicKeyId) return null;
                return trusted;
            })
            .filter(Boolean);
    }

    async function pullNanahManagedLocalNetworkCandidates(provider, request) {
        const discovery = provider && (
            typeof provider.discoverManagedPolicyCandidates === 'function'
                ? provider.discoverManagedPolicyCandidates
                : (typeof provider.discoverLocalNetworkCandidates === 'function' ? provider.discoverLocalNetworkCandidates : null)
        );
        if (!discovery) return { ok: false, reason: 'local_network_provider_unavailable', candidates: [] };
        try {
            const result = await discovery.call(provider, request);
            if (Array.isArray(result)) return { ok: true, reason: '', candidates: result };
            const ok = result?.ok !== false;
            return {
                ok,
                reason: normalizeString(result?.reason),
                candidates: ok ? safeArray(result?.candidates || result?.items) : []
            };
        } catch (error) {
            return {
                ok: false,
                reason: normalizeString(error?.message) || 'local_network_provider_failed',
                candidates: []
            };
        }
    }

    function formatNanahManagedLocalNetworkSyncStatus(link) {
        const trusted = safeObject(link);
        const policy = safeObject(trusted.policy);
        if (trusted.linkType !== 'managed_link' || trusted.localRole !== 'replica' || trusted.remoteRole !== 'source') return '';
        if (policy.syncOnProfileOpen !== true) return 'Off';
        const state = safeObject(nanahManagedLocalNetworkSyncState);
        if (normalizeString(state.profileId) && normalizeString(state.profileId) !== activeProfileId) return 'Ready';
        if (normalizeString(state.reasonCode) === 'local_network_provider_unavailable') return 'Waiting for provider';
        const row = safeArray(state.linkResults).find(result => normalizeString(result?.linkId) === normalizeString(trusted.linkId || trusted.id));
        if (!row) return state.checkedAt ? 'Checked' : 'Ready';
        const accepted = Number(row.acceptedCandidateCount) || 0;
        const rejected = Number(row.rejectedCandidateCount) || 0;
        const candidates = Number(row.candidateCount) || 0;
        if (accepted || rejected) return `${accepted} accepted, ${rejected} rejected`;
        if (row.ok === false) return 'Rejected by provider';
        if (candidates === 0) return 'Checked, no candidates';
        return 'Checked';
    }

    async function runNanahManagedLocalNetworkSync({ reason = 'dashboard_open' } = {}) {
        const io = window.FilterTubeIO || {};
        const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const activeId = normalizeString(localProfilesV4?.activeProfileId) || activeProfileId || 'default';
        const provider = getNanahManagedLocalNetworkProvider();
        const discovery = provider && (provider.discoverManagedPolicyCandidates || provider.discoverLocalNetworkCandidates);
        const eligibleLinks = getNanahManagedLocalNetworkEligibleLinks(activeId, localProfilesV4);
        const state = {
            schema: 'filtertube_managed_local_network_sync_state',
            version: 1,
            reason: normalizeString(reason) || 'dashboard_open',
            profileId: activeId,
            checkedAt: Date.now(),
            eligibleLinkCount: eligibleLinks.length,
            providerAvailable: typeof discovery === 'function',
            candidateCount: 0,
            acceptedCandidateCount: 0,
            rejectedCandidateCount: 0,
            ackAttemptedCount: 0,
            ackedCandidateCount: 0,
            ackFailedCount: 0,
            ackProviderAvailable: false,
            ackHistoryRecordedCount: 0,
            ackHistoryFailedCount: 0,
            linkResults: []
        };
        if (!state.providerAvailable || eligibleLinks.length === 0) {
            state.reasonCode = eligibleLinks.length === 0 ? 'no_eligible_links' : 'local_network_provider_unavailable';
            await persistNanahManagedLocalNetworkSyncState(state);
            renderNanahTrustedLinks();
            return state;
        }
        for (const link of eligibleLinks) {
            const request = buildNanahManagedLocalNetworkDiscoveryRequest(link, activeId, reason);
            const result = await pullNanahManagedLocalNetworkCandidates(provider, request);
            const linkRow = {
                linkId: request.linkId,
                targetProfileId: request.targetProfileId,
                ok: result.ok === true,
                reason: result.reason || null,
                candidateCount: result.candidates.length,
                acceptedCandidateCount: 0,
                rejectedCandidateCount: 0,
                ackAttemptedCount: 0,
                ackedCandidateCount: 0,
                ackFailedCount: 0,
                ackReason: null,
                ackHistoryRecordedCount: 0,
                ackHistoryFailedCount: 0,
                ackHistoryReason: null
            };
            state.candidateCount += result.candidates.length;
            const ackRecords = [];
            if (result.ok === true) {
                for (const candidate of result.candidates) {
                    const decision = await handleNanahIncomingManagedLocalNetworkCandidate(candidate);
                    const envelope = safeObject(candidate?.envelope || candidate?.managedPolicyEnvelope || candidate?.policy);
                    const accepted = decision?.accepted === true || decision?.applied === true;
                    if (decision?.accepted === true || decision?.applied === true) {
                        linkRow.acceptedCandidateCount += 1;
                        state.acceptedCandidateCount += 1;
                    } else {
                        linkRow.rejectedCandidateCount += 1;
                        state.rejectedCandidateCount += 1;
                    }
                    const scope = normalizeString(decision?.scope || envelope.scope).toLowerCase();
                    const revision = normalizeNonNegativeInteger(decision?.revision || envelope.revision) || null;
                    const policyHash = normalizeString(decision?.policyHash || envelope.policyHash);
                    if (scope && revision && policyHash) {
                        ackRecords.push({
                            linkId: request.linkId,
                            localNetworkCandidateId: normalizeString(candidate?.candidateId || candidate?.localNetworkCandidateId || envelope.candidateId) || `${scope}-${revision}`,
                            sourceDeviceId: normalizeString(decision?.sourceDeviceId || envelope.sourceDeviceId || request.sourceDeviceId),
                            sourceProfileId: normalizeString(decision?.sourceProfileId || envelope.sourceProfileId || request.sourceProfileId),
                            targetProfileId: normalizeString(decision?.targetProfileId || envelope.targetProfileId || request.targetProfileId),
                            scope,
                            revision,
                            policyHash,
                            ackState: accepted ? (normalizeString(decision?.decision) || 'accepted') : 'rejected',
                            accepted,
                            applied: accepted && decision?.applied !== false,
                            reason: accepted ? null : (normalizeString(decision?.reason) || 'local_network_candidate_rejected'),
                            ackedAt: Date.now()
                        });
                    }
                }
            }
            if (ackRecords.length > 0) {
                const ackWriter = provider && (
                    typeof provider.ackManagedPolicyCandidates === 'function'
                        ? provider.ackManagedPolicyCandidates
                        : (typeof provider.ackLocalNetworkCandidates === 'function' ? provider.ackLocalNetworkCandidates : null)
                );
                const ackPayload = {
                    schema: 'filtertube_managed_local_network_candidate_ack',
                    version: 1,
                    ackedAt: Date.now(),
                    linkId: request.linkId,
                    remoteDeviceId: request.remoteDeviceId,
                    sourceDeviceId: request.sourceDeviceId,
                    sourceProfileId: request.sourceProfileId,
                    targetProfileId: request.targetProfileId,
                    records: ackRecords
                };
                let ackResult = {
                    ok: false,
                    reason: 'ack_provider_unavailable',
                    ackedCandidateCount: 0,
                    failedAckCount: ackRecords.length,
                    providerAvailable: false,
                    transport: 'local_network'
                };
                if (ackWriter) {
                    try {
                        const rawAck = safeObject(await ackWriter.call(provider, ackPayload));
                        const ok = rawAck.ok !== false;
                        const acked = Number(rawAck.ackedCandidateCount ?? rawAck.acknowledgedCandidateCount ?? rawAck.ackedItemCount ?? rawAck.ackedCount);
                        const failed = Number(rawAck.failedAckCount ?? rawAck.failedCandidateCount ?? rawAck.failedItemCount);
                        ackResult = {
                            ok,
                            reason: normalizeString(rawAck.reason),
                            ackedCandidateCount: Number.isFinite(acked) ? Math.max(0, acked) : (ok ? ackRecords.length : 0),
                            failedAckCount: Number.isFinite(failed) ? Math.max(0, failed) : (ok ? 0 : ackRecords.length),
                            providerAvailable: true,
                            transport: 'local_network'
                        };
                    } catch (error) {
                        ackResult = {
                            ok: false,
                            reason: normalizeString(error?.message) || 'ack_failed',
                            ackedCandidateCount: 0,
                            failedAckCount: ackRecords.length,
                            providerAvailable: true,
                            transport: 'local_network'
                        };
                    }
                }
                linkRow.ackAttemptedCount = ackRecords.length;
                linkRow.ackedCandidateCount = ackResult.ackedCandidateCount;
                linkRow.ackFailedCount = ackResult.failedAckCount;
                linkRow.ackReason = ackResult.reason || null;
                state.ackProviderAvailable = state.ackProviderAvailable || ackResult.providerAvailable === true;
                state.ackAttemptedCount += ackRecords.length;
                state.ackedCandidateCount += ackResult.ackedCandidateCount;
                state.ackFailedCount += ackResult.failedAckCount;
                const historyResult = await recordManagedOpenSyncAckHistory({
                    request,
                    records: ackRecords,
                    ackResult,
                    transport: 'local_network',
                    reason
                });
                const historyRoot = safeObject(historyResult);
                linkRow.ackHistoryRecordedCount = Number(historyRoot.recordedCount ?? historyRoot.writtenCount) || 0;
                linkRow.ackHistoryFailedCount = Number(historyRoot.failedCount) || 0;
                linkRow.ackHistoryReason = normalizeString(historyRoot.reason) || null;
                state.ackHistoryRecordedCount += linkRow.ackHistoryRecordedCount;
                state.ackHistoryFailedCount += linkRow.ackHistoryFailedCount;
            }
            state.linkResults.push(linkRow);
        }
        await persistNanahManagedLocalNetworkSyncState(state);
        renderNanahTrustedLinks();
        return state;
    }

    async function loadNanahManagedSourceAckSyncState() {
        nanahManagedSourceAckSyncState = safeObject(await readNanahStorage(NANAH_MANAGED_SOURCE_ACK_SYNC_STATE_KEY));
    }

    async function persistNanahManagedSourceAckSyncState(state) {
        nanahManagedSourceAckSyncState = safeObject(state);
        await writeNanahStorage(NANAH_MANAGED_SOURCE_ACK_SYNC_STATE_KEY, nanahManagedSourceAckSyncState);
    }

    function getNanahManagedSourceAckProvider() {
        return safeObject(window.FilterTubeManagedPolicyDeliveryAcks);
    }

    function getNanahOutgoingManagedPolicyStateByScope(policy) {
        const outgoing = safeObject(safeObject(policy).outgoingManagedPolicies);
        return Object.entries(outgoing)
            .map(([scope, value]) => {
                const state = safeObject(value);
                const revision = normalizeNonNegativeInteger(state.revision);
                const policyHash = normalizeString(state.policyHash);
                const normalizedScope = normalizeString(scope).toLowerCase();
                if (!normalizedScope || !revision || !policyHash) return null;
                return {
                    scope: normalizedScope,
                    revision,
                    policyHash,
                    sentAt: normalizeNonNegativeInteger(state.sentAt) || null,
                    lastAckAt: normalizeNonNegativeInteger(state.lastAckAt) || null,
                    lastAckState: normalizeString(state.lastAckState) || null,
                    lastAckResult: normalizeString(state.lastAckResult) || null
                };
            })
            .filter(Boolean);
    }

    function getNanahManagedSourceAckEligibleLinks() {
        return safeArray(nanahTrustedLinks)
            .map((link) => normalizeNanahTrustedLink(link))
            .filter((trusted) => {
                if (!trusted) return false;
                const policy = safeObject(trusted.policy);
                if (trusted.linkType !== 'managed_link') return false;
                if (trusted.localRole !== 'source' || trusted.remoteRole !== 'replica') return false;
                if (trusted.revoked === true || policy.revoked === true || trusted.keyRevoked === true || policy.keyRevoked === true) return false;
                if (trusted.stalePairing === true || policy.stalePairing === true) return false;
                if (!normalizeString(trusted.linkId || trusted.id)) return false;
                if (!getNanahTrustedLinkTargetProfileId(trusted)) return false;
                if (getNanahOutgoingManagedPolicyStateByScope(policy).length === 0) return false;
                return true;
            });
    }

    function buildNanahManagedSourceAckRequest(link, reason) {
        const trusted = normalizeNanahTrustedLink(link);
        const policy = safeObject(trusted?.policy);
        const localContext = getNanahLocalProfileContext();
        return {
            schema: 'filtertube_managed_source_delivery_ack_request',
            version: 1,
            reason: normalizeString(reason) || 'dashboard_open',
            requestedAt: Date.now(),
            linkId: normalizeString(trusted?.linkId || trusted?.id),
            remoteDeviceId: normalizeString(trusted?.remoteDeviceId),
            sourceDeviceId: normalizeString(trusted?.sourceDeviceId || policy.sourceDeviceId) || normalizeString(nanahStableDeviceId),
            sourceProfileId: normalizeString(trusted?.sourceProfileId || policy.sourceProfileId) || normalizeString(localContext.profileId),
            targetProfileId: getNanahTrustedLinkTargetProfileId(trusted),
            allowedScopes: getNanahScopeList(policy.allowedScopes || policy.defaultScope),
            sentPolicies: getNanahOutgoingManagedPolicyStateByScope(policy)
        };
    }

    async function pullNanahManagedSourceDeliveryAcks(provider, request) {
        const pull = provider && (
            typeof provider.pullManagedDeliveryAcks === 'function'
                ? provider.pullManagedDeliveryAcks
                : (typeof provider.pullRemoteDeliveryAcks === 'function'
                    ? provider.pullRemoteDeliveryAcks
                    : (typeof provider.getManagedDeliveryAcks === 'function' ? provider.getManagedDeliveryAcks : null))
        );
        if (!pull) return { ok: false, reason: 'delivery_ack_provider_unavailable', acks: [] };
        try {
            const result = await pull.call(provider, request);
            if (Array.isArray(result)) return { ok: true, reason: '', acks: result };
            const ok = result?.ok !== false;
            return {
                ok,
                reason: normalizeString(result?.reason),
                acks: ok ? safeArray(result?.acks || result?.items || result?.payloads) : []
            };
        } catch (error) {
            return {
                ok: false,
                reason: normalizeString(error?.message) || 'delivery_ack_provider_failed',
                acks: []
            };
        }
    }

    function normalizeNanahManagedDeliveryAckSchema(payload) {
        const schema = normalizeString(safeObject(payload).schema);
        if (schema === 'filtertube_nanah_managed_open_sync_ack') return 'mailbox';
        if (schema === 'filtertube_managed_local_network_candidate_ack') return 'local_network';
        return '';
    }

    function formatNanahManagedSourceAckSyncStatus(link) {
        const trusted = safeObject(link);
        if (trusted.linkType !== 'managed_link' || trusted.localRole !== 'source' || trusted.remoteRole !== 'replica') return '';
        const policy = safeObject(trusted.policy);
        if (getNanahOutgoingManagedPolicyStateByScope(policy).length === 0) return 'No sent policy';
        const state = safeObject(nanahManagedSourceAckSyncState);
        if (normalizeString(state.reasonCode) === 'delivery_ack_provider_unavailable') return 'Waiting for provider';
        const row = safeArray(state.linkResults).find(result => normalizeString(result?.linkId) === normalizeString(trusted.linkId || trusted.id));
        if (!row) return state.checkedAt ? 'Checked' : 'Ready';
        const recorded = Number(row.recordedAckCount) || 0;
        const rejected = Number(row.rejectedAckCount) || 0;
        const payloads = Number(row.ackPayloadCount) || 0;
        if (recorded || rejected) return `${recorded} recorded, ${rejected} ignored`;
        if (row.ok === false) return 'Rejected by provider';
        if (payloads === 0) return 'Checked, no acks';
        return 'Checked';
    }

    async function handleNanahIncomingManagedRemoteDeliveryAck(ackPayload, options = {}) {
        if (!nanahManagedLivePolicy || typeof nanahManagedLivePolicy.recordRemoteDeliveryAckPayload !== 'function') {
            return { ok: false, reason: 'managed_delivery_ack_recorder_unavailable', recordedCount: 0 };
        }
        const result = await nanahManagedLivePolicy.recordRemoteDeliveryAckPayload(ackPayload);
        if (safeObject(options).silent !== true && safeObject(result).ok === true) {
            const latest = safeObject(result.latest);
            UIComponents.showToast(
                normalizeString(latest.result) === 'accepted'
                    ? 'Managed remote delivery ack recorded'
                    : 'Managed remote delivery ack recorded with rejection status',
                'info'
            );
        }
        return result;
    }

    async function runNanahManagedSourceAckSync({ reason = 'dashboard_open' } = {}) {
        const provider = getNanahManagedSourceAckProvider();
        const pull = provider && (provider.pullManagedDeliveryAcks || provider.pullRemoteDeliveryAcks || provider.getManagedDeliveryAcks);
        const eligibleLinks = getNanahManagedSourceAckEligibleLinks();
        const state = {
            schema: 'filtertube_managed_source_delivery_ack_sync_state',
            version: 1,
            reason: normalizeString(reason) || 'dashboard_open',
            checkedAt: Date.now(),
            eligibleLinkCount: eligibleLinks.length,
            providerAvailable: typeof pull === 'function',
            ackPayloadCount: 0,
            recordedAckCount: 0,
            rejectedAckCount: 0,
            linkResults: []
        };
        if (!state.providerAvailable || eligibleLinks.length === 0) {
            state.reasonCode = eligibleLinks.length === 0 ? 'no_eligible_source_links' : 'delivery_ack_provider_unavailable';
            await persistNanahManagedSourceAckSyncState(state);
            renderNanahTrustedLinks();
            return state;
        }

        for (const link of eligibleLinks) {
            const request = buildNanahManagedSourceAckRequest(link, reason);
            const result = await pullNanahManagedSourceDeliveryAcks(provider, request);
            const linkRow = {
                linkId: request.linkId,
                targetProfileId: request.targetProfileId,
                ok: result.ok === true,
                reason: result.reason || null,
                ackPayloadCount: result.acks.length,
                recordedAckCount: 0,
                rejectedAckCount: 0
            };
            state.ackPayloadCount += result.acks.length;
            if (result.ok === true) {
                for (const ackPayload of result.acks) {
                    const transport = normalizeNanahManagedDeliveryAckSchema(ackPayload);
                    if (!transport) {
                        linkRow.rejectedAckCount += 1;
                        state.rejectedAckCount += 1;
                        continue;
                    }
                    const ackResult = await handleNanahIncomingManagedRemoteDeliveryAck(ackPayload, { silent: true });
                    const recorded = Number(safeObject(ackResult).recordedCount) || 0;
                    if (safeObject(ackResult).ok === true && recorded > 0) {
                        linkRow.recordedAckCount += recorded;
                        state.recordedAckCount += recorded;
                    } else {
                        linkRow.rejectedAckCount += 1;
                        state.rejectedAckCount += 1;
                    }
                }
            }
            state.linkResults.push(linkRow);
        }
        await persistNanahManagedSourceAckSyncState(state);
        renderNanahTrustedLinks();
        return state;
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
            title: 'Edit Parent Trust',
            message: `Adjust what ${normalizeString(trusted.deviceLabel) || 'this device'} may receive through this parent trust link.`,
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
                syncOnProfileOpen: nextPolicyDecision.policy.syncOnProfileOpen,
                childProtectionLevel: nextPolicyDecision.policy.childProtectionLevel,
                targetProfileBehavior: nextPolicyDecision.policy.targetProfileBehavior,
                targetProfileId: nextPolicyDecision.policy.targetProfileId,
                targetProfileName: nextPolicyDecision.policy.targetProfileName
            }
        });
        UIComponents.showToast('Parent trust updated', 'success');
    }

    async function startNanahTrustedReconnect(link) {
        const trusted = normalizeNanahTrustedLink(link);
        if (!trusted) return;

        if (isNanahChildReplicaOnly() && trusted.localRole !== 'replica') {
            UIComponents.showToast('Locked child profiles can only reconnect as protected receivers. Unlock the child profile first to reconnect as a sender.', 'error');
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
            syncNanahManagedTargetOptions();
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

            if (entry?.keyRevoked === true || safeObject(entry?.policy).keyRevoked === true) {
                const revokedPill = document.createElement('span');
                revokedPill.className = 'nanah-trusted-link__pill';
                revokedPill.textContent = 'key revoked';
                meta.appendChild(revokedPill);
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
                    ? 'Child profiles cannot edit trusted parent policy from this surface.'
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

            if (
                safeObject(entry?.policy).linkType === 'managed_link'
                && normalizeString(entry?.localRole) === 'source'
                && normalizeString(entry?.remoteRole) === 'replica'
                && isActiveNanahSourceManagedLink(entry)
            ) {
                const rotateKeyBtn = document.createElement('button');
                rotateKeyBtn.type = 'button';
                rotateKeyBtn.className = 'btn-secondary';
                rotateKeyBtn.textContent = 'Rotate Key';
                rotateKeyBtn.title = 'Regenerate this parent device signing key and require managed child devices to pair again.';
                rotateKeyBtn.disabled = childAdminRestricted;
                rotateKeyBtn.addEventListener('click', async () => {
                    if (childAdminRestricted) {
                        UIComponents.showToast('Child profiles cannot rotate managed trust keys', 'error');
                        return;
                    }
                    try {
                        await rotateNanahManagedSourceSigningKey();
                    } catch (error) {
                        console.error('FilterTube: managed signing key rotation failed', error);
                        UIComponents.showToast(error?.message || 'Managed signing key rotation failed', 'error');
                    }
                });
                actions.appendChild(rotateKeyBtn);
            }

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-secondary';
            removeBtn.textContent = 'Remove';
            removeBtn.disabled = childManagedReplicaLink;
            removeBtn.title = childManagedReplicaLink
                ? 'Child profiles cannot remove a trusted parent link from this surface.'
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

                    const openSyncRow = document.createElement('div');
                    openSyncRow.className = 'nanah-trusted-link__policy-row';
                    const openSyncLabel = document.createElement('span');
                    openSyncLabel.textContent = 'Open sync';
                    const openSyncValue = document.createElement('strong');
                    openSyncValue.textContent = formatNanahManagedOpenSyncStatus(entry);
                    openSyncRow.appendChild(openSyncLabel);
                    openSyncRow.appendChild(openSyncValue);
                    policyRows.appendChild(openSyncRow);

                    const localNetworkRow = document.createElement('div');
                    localNetworkRow.className = 'nanah-trusted-link__policy-row';
                    const localNetworkLabel = document.createElement('span');
                    localNetworkLabel.textContent = 'Local network';
                    const localNetworkValue = document.createElement('strong');
                    localNetworkValue.textContent = formatNanahManagedLocalNetworkSyncStatus(entry);
                    localNetworkRow.appendChild(localNetworkLabel);
                    localNetworkRow.appendChild(localNetworkValue);
                    policyRows.appendChild(localNetworkRow);
                }

                if (entry?.localRole === 'source' && entry?.remoteRole === 'replica') {
                    const deliveryAckRow = document.createElement('div');
                    deliveryAckRow.className = 'nanah-trusted-link__policy-row';
                    const deliveryAckLabel = document.createElement('span');
                    deliveryAckLabel.textContent = 'Remote delivery';
                    const deliveryAckValue = document.createElement('strong');
                    deliveryAckValue.textContent = formatNanahManagedSourceAckSyncStatus(entry);
                    deliveryAckRow.appendChild(deliveryAckLabel);
                    deliveryAckRow.appendChild(deliveryAckValue);
                    policyRows.appendChild(deliveryAckRow);
                }

                card.appendChild(policyRows);

                const note = document.createElement('div');
                note.className = 'nanah-trusted-link__note';
                note.textContent = `This parent trust link defaults to ${getNanahScopeLabel(safeObject(entry?.policy).defaultScope)} and uses ${getNanahStrategyLabel(safeObject(entry?.policy).applyMode).toLowerCase()} for allowed scopes. ${entry?.localRole === 'replica' && entry?.remoteRole === 'source'
                    ? `Targeting is ${getNanahTargetProfileBehaviorLabel(safeObject(entry?.policy).targetProfileBehavior).toLowerCase()}, new sessions are ${getNanahReconnectModeLabel(safeObject(entry?.policy).reconnectMode).toLowerCase()}, and locked child handling is ${getNanahLockedChildModeLabel(safeObject(entry?.policy).lockedChildMode).toLowerCase()}.`
                    : `New sessions are ${getNanahReconnectModeLabel(safeObject(entry?.policy).reconnectMode).toLowerCase()}.`}`;
                card.appendChild(note);
            }

            card.appendChild(actions);
            ftNanahTrustedLinks.appendChild(card);
        });
        syncNanahManagedTargetOptions();
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
        const childReceiveOnly = isNanahChildReceiveOnly();
        const childReplicaOnly = isNanahChildReplicaOnly();
        const isManagedPair = getNanahRole() === 'source' && normalizeString(nanahSessionState.remoteRole) === 'replica';
        const canShowRemoteTarget = mode !== 'full_account'
            && !childReceiveOnly
            && !childReplicaOnly
            && (
                mode === 'parent_control'
                || isManagedPair
                || !!getNanahSelectedRemoteTargetProfile()
            );

        const configs = {
            send_once: {
                eyebrow: 'Copy once',
                title: 'Send this profile',
                body: 'Use this for your own second device or a one-time setup. Pair, verify the phrase, send, and let the other device review the update.',
                steps: [
                    'Leave the simple device-copy flow in place.',
                    'Start pairing here or join a code from the other device.',
                    'Confirm the same phrase and send once.'
                ],
                hostLabel: 'Start Pairing',
                sendLabel: getNanahScope() === 'full' ? 'Send Full Backup' : 'Send Once',
                trustLabel: 'Trust Device'
            },
            parent_control: {
                eyebrow: 'Family control',
                title: childReplicaOnly ? 'Protected profile is locked here' : 'Update protected device',
                body: childReplicaOnly
                    ? 'This protected profile is still locked on this device, so it can only receive approved parent updates here. Unlock it locally if you need to send from it.'
                    : 'Use this when a parent or caregiver should keep a child, family, or protected profile aligned on another device.',
                steps: childReplicaOnly
                    ? [
                        'Unlock this protected profile locally first if you need to send from it.',
                        'Use the parent profile as the sender when you want to control this device.',
                        'Save parent trust on the receiving device once.'
                    ]
                    : [
                        'Connect to the child or protected device and confirm the safety phrase.',
                        'Choose the remote protected profile in the target dropdown.',
                        'Send once, then save parent trust so later live sessions reuse the target and policy.'
                    ],
                hostLabel: 'Pair Protected Device',
                sendLabel: 'Send Protected Update',
                trustLabel: 'Save Parent Trust'
            },
            full_account: {
                eyebrow: 'Move account',
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

        const config = childReceiveOnly
            ? {
                eyebrow: 'Receive-only',
                title: 'Join parent update',
                body: 'Use the code from the parent device to receive updates for this protected profile. This profile cannot send settings, save trust policy, or move backups from here.',
                steps: [
                    'Ask the parent device to start pairing.',
                    'Join the 4-character code here and confirm the same safety phrase.',
                    'Trusted parent links can then send allowed updates into this protected profile.'
                ],
                hostLabel: 'Parent Starts Pairing',
                sendLabel: 'Receive Only',
                trustLabel: 'Parent Managed'
            }
            : (configs[mode] || configs.send_once);

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
        const childReceiveOnly = isNanahChildReceiveOnly();
        const childReplicaOnly = isNanahChildReplicaOnly();
        if ((childReceiveOnly || childReplicaOnly) && ftNanahRole && ftNanahRole.value !== 'replica') {
            ftNanahRole.value = 'replica';
        }
        if (getActiveProfileType() === 'child' && ftNanahScope && ftNanahScope.value === 'full') {
            ftNanahScope.value = 'active';
        }
        const localRole = getNanahRole();
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || 'peer';
        const linkType = classifyNanahTrustedLink(localRole, remoteRole);
        const trustedManaged = isCurrentNanahManagedLink();
        const scope = getNanahScope();
        const granularScope = ['keywords', 'channels', 'videos', 'rules_bundle'].includes(scope);

        if (ftNanahGranularSurface) {
            if (!granularScope) {
                delete ftNanahGranularSurface.dataset.userSelected;
            } else if (ftNanahGranularSurface.dataset.userSelected !== 'true') {
                const activeView = normalizeString(document.body?.dataset?.activeView)
                    || normalizeString(document.documentElement?.dataset?.activeView)
                    || normalizeString(document.querySelector('.nav-item.active')?.getAttribute('data-tab'));
                ftNanahGranularSurface.value = activeView === 'kids' ? 'kids' : 'main';
            }
        }
        if (ftNanahGranularSurfaceField) {
            ftNanahGranularSurfaceField.hidden = !granularScope || childReceiveOnly || childReplicaOnly;
        }
        if (ftNanahGranularSurface) {
            ftNanahGranularSurface.disabled = !granularScope || childReceiveOnly || childReplicaOnly || !!nanahClient;
            ftNanahGranularSurface.title = granularScope
                ? (nanahClient ? 'Rule source is locked for the current Nanah session.' : '')
                : 'Rule source applies only to keyword, channel, blocked-video, and rule-bundle sends.';
        }
        if (ftNanahGranularSurfaceHint) {
            const surfaceLabel = ftNanahGranularSurface?.value === 'kids' ? 'YouTube Kids' : 'YouTube Main';
            ftNanahGranularSurfaceHint.textContent = `${getNanahScopeLabel(scope)} sends will use ${surfaceLabel} rules from this local profile.`;
        }

        if (ftNanahStrategyLabel) {
            ftNanahStrategyLabel.textContent = (trustedManaged && linkType === 'managed_link' && localRole === 'source' && !childReplicaOnly)
                ? 'Saved parent policy'
                : (childReceiveOnly ? 'Receive policy' : 'Suggested action');
        }
        if (ftNanahStrategyHint) {
            if (childReceiveOnly) {
                ftNanahStrategyHint.textContent = 'Protected profiles stay receive-only here. Parent devices choose what to send, and this profile reviews or receives the allowed update.';
            } else if (childReplicaOnly) {
                ftNanahStrategyHint.textContent = 'This protected profile is still locked, so it can only receive updates here. Unlock it locally if you need to send from it.';
            } else if (trustedManaged && linkType === 'managed_link' && localRole === 'source') {
                ftNanahStrategyHint.textContent = 'Trusted protected devices follow this saved merge or replace policy for allowed scopes.';
            } else if (linkType === 'managed_link') {
                ftNanahStrategyHint.textContent = 'Until parent trust is saved, the receiving device still chooses merge or replace.';
            } else {
                ftNanahStrategyHint.textContent = 'One-time device copies let the receiver choose merge or replace.';
            }
        }
        if (ftNanahTrustBtn) {
            ftNanahTrustBtn.textContent = childReceiveOnly
                ? 'Parent Managed'
                : ((childReplicaOnly || linkType === 'managed_link') ? 'Save Parent Trust' : 'Trust Connected Device');
        }
        if (ftNanahScope) {
            ftNanahScope.disabled = childReceiveOnly || childReplicaOnly || !!nanahClient;
            ftNanahScope.title = childReceiveOnly
                ? 'Protected profiles receive updates here; they do not choose an outgoing send scope.'
                : (childReplicaOnly
                    ? 'This protected profile is locked, so scope sending is unavailable until you unlock it locally.'
                    : (nanahClient ? 'Scope is locked for the current Nanah session.' : ''));
        }
        if (ftNanahStrategy) {
            ftNanahStrategy.disabled = childReceiveOnly || childReplicaOnly || !!nanahClient;
            ftNanahStrategy.title = childReceiveOnly
                ? 'Protected profiles receive parent updates here; trust policy stays parent-managed.'
                : (childReplicaOnly
                    ? 'This protected profile is locked, so outgoing merge/replace behavior stays unavailable until you unlock it locally.'
                    : (nanahClient ? 'Suggested action is locked for the current Nanah session.' : ''));
        }
        if (ftNanahRemoteTarget) {
            const canTargetRemoteProfiles = !childReceiveOnly
                && !childReplicaOnly
                && !!nanahClient
                && nanahSessionState.connected
                && getNanahRole() === 'source'
                && normalizeString(nanahSessionState.remoteRole) === 'replica'
                && normalizeNanahProfileInventory(nanahSessionState.remoteProfileInventory).length > 0;
            ftNanahRemoteTarget.disabled = !canTargetRemoteProfiles;
            ftNanahRemoteTarget.title = canTargetRemoteProfiles
                ? ''
                : 'Connect to the protected device first to choose a specific remote profile.';
        }
        if (ftNanahRemoteTargetHint) {
            const selectedTarget = getNanahSelectedRemoteTargetProfile();
            if (selectedTarget) {
                ftNanahRemoteTargetHint.textContent = `This session will target ${selectedTarget.profileName} on ${getNanahRemoteLabel()} instead of following the remote active profile.`;
            } else if (getNanahRole() === 'source' && normalizeString(nanahSessionState.remoteRole) === 'replica') {
                ftNanahRemoteTargetHint.textContent = 'No protected profile is selected yet, so updates will follow the receiver’s current active profile unless you choose one here.';
            } else {
                ftNanahRemoteTargetHint.textContent = 'After pairing, choose the child or protected profile on the other device that should receive this update.';
            }
        }
        syncNanahManagedTargetOptions(scope);
    }

    function updateNanahUi() {
        enforceChildSyncSurfaceRestrictions();
        let nanahTone = 'idle';
        if (!nanahClient) {
            nanahTone = 'idle';
        } else if (!nanahSessionState.sasConfirmed && normalizeString(nanahSessionState.sasPhrase)) {
            nanahTone = 'verify';
        } else if (nanahSessionState.connected) {
            const trusted = getNanahCurrentTrustedLink();
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
            ftNanahLocalProfile.textContent = formatNanahEndpointContext(
                getNanahLocalProfileContext(),
                getNanahLocalDeviceLabel()
            );
        }
        if (ftNanahRemoteLabel) {
            ftNanahRemoteLabel.textContent = nanahSessionState.connected
                ? formatNanahEndpointContext(nanahSessionState.remoteProfile, getNanahRemoteLabel())
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
            const childReceiveOnly = isNanahChildReceiveOnly();
            const childReplicaOnly = isNanahChildReplicaOnly();
            if ((childReceiveOnly || childReplicaOnly) && ftNanahRole.value !== 'replica') {
                ftNanahRole.value = 'replica';
            }
            ftNanahRole.disabled = !!nanahClient || childReceiveOnly || childReplicaOnly;
            ftNanahRole.title = childReceiveOnly
                ? 'Protected profiles stay receive-only in Nanah.'
                : (childReplicaOnly
                    ? 'This protected profile is locked, so it is receive-only in Nanah until you unlock it locally.'
                    : (nanahClient
                        ? 'Relationship is locked for the current Nanah session. End the session to change it.'
                        : ''));
        }
        if (ftNanahSendBtn) {
            ftNanahSendBtn.disabled = isNanahChildReceiveOnly() || !(nanahSessionState.connected && nanahSessionState.sasConfirmed && nanahClient);
        }
        if (ftNanahTrustBtn) {
            ftNanahTrustBtn.disabled = isNanahChildReceiveOnly() || !(nanahSessionState.connected && safeObject(nanahSessionState.remoteDevice).deviceId);
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
                const trusted = getNanahCurrentTrustedLink();
                const trustedPolicy = safeObject(trusted?.policy);
                ftNanahStatusHint.textContent = isNanahChildReplicaOnly()
                    ? (trusted
                        ? 'Protected profile connected as a receiver. Saved parent links can keep this device aligned without turning the child into a sender.'
                        : 'Locked protected profile connected. This device stays receive-only until the local child profile is unlocked.')
                    : trusted
                    ? (trustedPolicy.linkType === 'managed_link'
                        ? 'Parent trust connected. Protected-device updates now follow the saved trusted policy for allowed scopes.'
                        : 'Trusted peer connected. New proposals still stay reviewable on the receiving device.')
                    : (classifyNanahTrustedLink(getNanahRole(), normalizeString(nanahSessionState.remoteRole) || 'peer') === 'managed_link'
                        ? 'Connected as a parent-to-protected-device pair. Until you save parent trust, the receiving device still reviews and chooses merge or replace.'
                        : 'Connected. You can now send settings or save this device as trusted.');
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
        const managedKey = safeObject(nanahManagedSigningKeyDescriptor);
        return adapter.getDeviceDescriptor({
            deviceId: normalizeString(nanahStableDeviceId) || undefined,
            deviceLabel: deviceLabel || undefined,
            appVersion: manifestVersion,
            capabilities: getNanahCapabilitiesForRole(role),
            managedPublicKeyId: normalizeString(managedKey.managedPublicKeyId || managedKey.sourcePublicKeyId || managedKey.publicKeyId),
            managedPublicKeyJwk: safeObject(managedKey.managedPublicKeyJwk || managedKey.sourcePublicKeyJwk || managedKey.publicKeyJwk),
            managedKeyVersion: normalizeNonNegativeInteger(managedKey.managedKeyVersion || managedKey.keyVersion || managedKey.sourceKeyVersion) || 0
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

    async function ensureNanahOutgoingAuth(scope, options = {}) {
        const normalizedScope = normalizeString(scope).toLowerCase();
        const sensitiveAction = safeObject(options).sensitiveAction === true;
        const io = window.FilterTubeIO || {};
        const profilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const activeId = normalizeString(profilesV4?.activeProfileId) || 'default';
        const masterVerifier = extractMasterPinVerifier(profilesV4);
        const requiresWholeAccount = normalizedScope === 'full';

        if (requiresWholeAccount && activeId !== 'default') {
            throw new Error('Switch to Default (Master) to send a full backup');
        }

        if (profilesV4) {
            const okUnlocked = await ensureProfileUnlocked(profilesV4, activeId, { sensitiveAction });
            if (!okUnlocked) {
                throw new Error(requiresWholeAccount ? 'Master unlock cancelled' : 'Profile unlock cancelled');
            }
        }

        if (activeId === 'default' && masterVerifier) {
            if (!sessionMasterPin) {
                const okAdmin = await ensureAdminUnlocked(profilesV4, { sensitiveAction });
                if (!okAdmin) {
                    throw new Error('Master unlock cancelled');
                }
            }
            return { localMasterPin: sessionMasterPin };
        }
        return null;
    }

    function hasRevisionBoundManagedPolicyDetails(details) {
        const root = safeObject(details);
        const envelope = safeObject(root.managedEnvelope);
        const signedFields = safeObject(safeObject(envelope.integrity).signedFields);
        return root.type === 'managed_policy'
            && envelope.type === 'filtertube_managed_policy'
            && Number.isInteger(envelope.revision)
            && envelope.revision > 0
            && normalizeString(envelope.policyHash)
            && normalizeString(envelope.integrity?.signature)
            && signedFields.revision === envelope.revision
            && signedFields.policyHash === envelope.policyHash;
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
            && normalizeString(trusted.remoteRole) === 'source'
            && (normalizeString(nanahSessionState.remoteRole) || normalizeString(trusted.remoteRole)) === 'source'
            && normalizeString(safeObject(details).authorityMode) !== 'peer'
            && normalizeString(safeObject(trusted.policy).decisionMode) !== 'peer'
            && getNanahLockedChildMode(safeObject(trusted.policy).lockedChildMode, 'require_unlock') === 'allow_trusted_updates'
            && hasRevisionBoundManagedPolicyDetails(details)
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
        if (root.type === 'filtertube_managed_policy') {
            const scope = normalizeString(root.scope).toLowerCase() || 'sync_policy';
            return {
                type: 'managed_policy',
                scope,
                strategy: 'merge',
                portable: null,
                summary: `FilterTube managed ${scope} policy`,
                targetProfile: normalizeNanahProfileContext({
                    profileId: root.targetProfileId,
                    profileName: normalizeString(root.targetProfileName),
                    profileType: 'child'
                }),
                authorityMode: 'managed',
                linkType: 'managed_link',
                allowedScopes: [scope],
                senderStrategySuggested: false,
                managedEnvelope: root
            };
        }
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

    function shouldAutoApplyNanahProposal(remoteDeviceId, options = {}) {
        const localRole = getNanahRole();
        if (localRole !== 'replica') return false;
        if (normalizeString(nanahSessionState.remoteRole) !== 'source') return false;
        const trusted = findNanahTrustedLink(remoteDeviceId, {
            ...safeObject(options),
            localRole,
            remoteRole: 'source',
            linkType: 'managed_link'
        });
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

    async function handleNanahIncomingManagedPolicyEnvelope(envelope) {
        const adapter = window.FilterTubeNanahAdapter || {};
        if (typeof adapter.validateManagedPolicyEnvelope !== 'function') {
            throw new Error('Managed policy validation is unavailable');
        }
        const io = window.FilterTubeIO || {};
        const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const context = buildManagedNanahPolicyValidationContext(envelope, localProfilesV4);
        const verifyManagedSignature = typeof adapter.verifyManagedNanahPolicyIntegritySignature === 'function'
            ? adapter.verifyManagedNanahPolicyIntegritySignature
            : null;
        const signatureVerification = verifyManagedSignature
            ? await verifyManagedSignature(envelope, context.trustedLink)
            : { verified: false, reason: 'missing_signature_verifier' };
        context.signatureVerification = signatureVerification;
        context.verifyIntegritySignature = () => signatureVerification;
        if (signatureVerification?.verified === true) {
            context.signatureVerified = true;
            context.integrityVerified = true;
        }
        const validation = adapter.validateManagedPolicyEnvelope(envelope, context);
        if (validation.accepted === true && validation.decision === 'idempotent_same_hash') {
            await recordManagedNanahPolicyValidationHistory(envelope, validation, context);
            await sendNanahManagedLivePolicyAck(envelope, validation);
            UIComponents.showToast('Managed policy already matches the last accepted revision', 'info');
            return;
        }
        if (validation.accepted === true) {
            if (typeof adapter.applyManagedPolicyEnvelope !== 'function') {
                const decision = {
                    accepted: false,
                    reason: 'managed_apply_unavailable',
                    validationDecision: validation.decision
                };
                await recordManagedNanahPolicyValidationHistory(envelope, decision, context);
                await sendNanahManagedLivePolicyAck(envelope, decision);
                UIComponents.showToast('Managed policy apply is unavailable', 'error');
                return;
            }
            const result = await adapter.applyManagedPolicyEnvelope(envelope, context);
            await recordManagedNanahPolicyValidationHistory(envelope, result.accepted === true ? validation : result, context);
            await sendNanahManagedLivePolicyAck(envelope, result.accepted === true ? validation : result);
            if (result.accepted === true && result.applied !== false) {
                await refreshFilterTubeUiAfterNanahImport();
                UIComponents.showToast(`Applied managed ${normalizeString(validation.scope) || 'policy'} update`, 'success');
                return;
            }
            if (result.accepted === true && result.decision === 'idempotent_same_hash') {
                UIComponents.showToast('Managed policy already matches the last accepted revision', 'info');
                return;
            }
            UIComponents.showToast(`Managed policy rejected: ${normalizeString(result.reason) || 'apply failed'}`, 'error');
            return;
        }
        await recordManagedNanahPolicyValidationHistory(envelope, validation, context);
        await sendNanahManagedLivePolicyAck(envelope, validation);
        UIComponents.showToast(`Managed policy rejected: ${normalizeString(validation.reason) || 'validation failed'}`, 'error');
    }

    async function handleNanahIncomingManagedMailboxItem(item) {
        const adapter = window.FilterTubeNanahAdapter || {};
        if (typeof adapter.validateManagedMailboxItem !== 'function') {
            throw new Error('Managed mailbox validation is unavailable');
        }
        const envelope = safeObject(item?.decryptedEnvelope || item?.envelope || item?.managedPolicyEnvelope);
        const io = window.FilterTubeIO || {};
        const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const context = {
            ...buildManagedNanahPolicyValidationContext(envelope, localProfilesV4),
            transport: 'mailbox',
            mailboxItemId: normalizeString(item?.mailboxItemId),
            nowMs: Date.now()
        };
        const verifyManagedSignature = typeof adapter.verifyManagedNanahPolicyIntegritySignature === 'function'
            ? adapter.verifyManagedNanahPolicyIntegritySignature
            : null;
        const signatureVerification = envelope && Object.keys(envelope).length > 0 && verifyManagedSignature
            ? await verifyManagedSignature(envelope, context.trustedLink)
            : { verified: false, reason: 'missing_signature_verifier' };
        context.signatureVerification = signatureVerification;
        context.verifyIntegritySignature = () => signatureVerification;
        if (signatureVerification?.verified === true) {
            context.signatureVerified = true;
            context.integrityVerified = true;
        }
        const validation = adapter.validateManagedMailboxItem(item, context);
        if (validation.accepted === true && validation.decision === 'idempotent_same_hash') {
            await recordManagedNanahPolicyValidationHistory(envelope, validation, context);
            UIComponents.showToast('Managed mailbox policy already matches the last accepted revision', 'info');
            return validation;
        }
        if (validation.accepted === true) {
            if (typeof adapter.applyManagedMailboxItem !== 'function') {
                const decision = {
                    accepted: false,
                    reason: 'managed_mailbox_apply_unavailable',
                    mailboxItemId: validation.mailboxItemId
                };
                await recordManagedNanahPolicyValidationHistory(envelope, decision, context);
                UIComponents.showToast('Managed mailbox apply is unavailable', 'error');
                return decision;
            }
            const result = await adapter.applyManagedMailboxItem(item, context);
            await recordManagedNanahPolicyValidationHistory(envelope, result.accepted === true ? validation : result, context);
            if (result.accepted === true && result.applied !== false) {
                await refreshFilterTubeUiAfterNanahImport();
                UIComponents.showToast(`Applied managed mailbox ${normalizeString(validation.scope) || 'policy'} update`, 'success');
                return result;
            }
            if (result.accepted === true && result.decision === 'idempotent_same_hash') {
                UIComponents.showToast('Managed mailbox policy already matches the last accepted revision', 'info');
                return result;
            }
            UIComponents.showToast(`Managed mailbox policy rejected: ${normalizeString(result.reason) || 'apply failed'}`, 'error');
            return result;
        }
        await recordManagedNanahPolicyValidationHistory(envelope, validation, context);
        UIComponents.showToast(`Managed mailbox policy rejected: ${normalizeString(validation.reason) || 'validation failed'}`, 'error');
        return validation;
    }

    async function handleNanahIncomingManagedLocalNetworkCandidate(candidate) {
        const adapter = window.FilterTubeNanahAdapter || {};
        if (typeof adapter.validateManagedLocalNetworkCandidate !== 'function') {
            throw new Error('Managed local-network validation is unavailable');
        }
        const root = safeObject(candidate);
        const envelope = safeObject(root.envelope || root.managedPolicyEnvelope || root.policy);
        const peer = safeObject(root.peer || root.discoveredPeer || root.discovery);
        const sanitizedCandidate = {
            peer,
            envelope,
            source: normalizeString(root.source),
            networkReachable: root.networkReachable
        };
        const io = window.FilterTubeIO || {};
        const localProfilesV4 = profilesV4Cache || (typeof io.loadProfilesV4 === 'function' ? await io.loadProfilesV4() : null);
        const context = {
            ...buildManagedNanahPolicyValidationContext(envelope, localProfilesV4),
            transport: 'local_network',
            nowMs: Date.now()
        };
        const verifyManagedSignature = typeof adapter.verifyManagedNanahPolicyIntegritySignature === 'function'
            ? adapter.verifyManagedNanahPolicyIntegritySignature
            : null;
        const signatureVerification = envelope && Object.keys(envelope).length > 0 && verifyManagedSignature
            ? await verifyManagedSignature(envelope, context.trustedLink)
            : { verified: false, reason: 'missing_signature_verifier' };
        context.signatureVerification = signatureVerification;
        context.verifyIntegritySignature = () => signatureVerification;
        if (signatureVerification?.verified === true) {
            context.signatureVerified = true;
            context.integrityVerified = true;
        }
        const validation = adapter.validateManagedLocalNetworkCandidate(sanitizedCandidate, context);
        if (validation.accepted === true && validation.decision === 'idempotent_same_hash') {
            await recordManagedNanahPolicyValidationHistory(envelope, validation, context);
            UIComponents.showToast('Managed local-network policy already matches the last accepted revision', 'info');
            return validation;
        }
        if (validation.accepted === true) {
            if (typeof adapter.applyManagedPolicyEnvelope !== 'function') {
                const decision = {
                    accepted: false,
                    reason: 'managed_local_network_apply_unavailable',
                    validationDecision: validation.decision
                };
                await recordManagedNanahPolicyValidationHistory(envelope, decision, context);
                UIComponents.showToast('Managed local-network apply is unavailable', 'error');
                return decision;
            }
            const result = await adapter.applyManagedPolicyEnvelope(envelope, context);
            await recordManagedNanahPolicyValidationHistory(envelope, result.accepted === true ? validation : result, context);
            if (result.accepted === true && result.applied !== false) {
                await refreshFilterTubeUiAfterNanahImport();
                UIComponents.showToast(`Applied managed local-network ${normalizeString(validation.scope) || 'policy'} update`, 'success');
                return result;
            }
            if (result.accepted === true && result.decision === 'idempotent_same_hash') {
                UIComponents.showToast('Managed local-network policy already matches the last accepted revision', 'info');
                return result;
            }
            UIComponents.showToast(`Managed local-network policy rejected: ${normalizeString(result.reason) || 'apply failed'}`, 'error');
            return result;
        }
        await recordManagedNanahPolicyValidationHistory(envelope, validation, context);
        UIComponents.showToast(`Managed local-network policy rejected: ${normalizeString(validation.reason) || 'validation failed'}`, 'error');
        return validation;
    }

    function buildNanahOutgoingProposalPolicy(scope, strategy) {
        if (isNanahChildReceiveOnly()) {
            throw new Error('Child profiles are receive-only in Accounts & Sync. Use a parent profile to send updates.');
        }
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
            const allowedScopes = getNanahManagedSendScopeList(managedPolicy.allowedScopes);
            const allowedConcreteScopes = getNanahManagedPolicyScopeList(managedPolicy.allowedScopes);
            const requiredScopes = expandNanahManagedSendScope(selectedScope);
            const missingScopes = requiredScopes.filter((item) => !allowedConcreteScopes.includes(item));
            if (missingScopes.length > 0) {
                throw new Error(`This managed link only allows ${allowedScopes.map(getNanahScopeLabel).join(', ')} syncs`);
            }
            return {
                linkType: 'managed_link',
                authorityMode: 'managed',
                scope: selectedScope,
                strategy: normalizeString(managedPolicy.applyMode).toLowerCase() === 'replace' ? 'replace' : 'merge',
                allowedScopes,
                requiredScopes
            };
        }

        if (['videos', 'keywords', 'channels', 'rules_bundle', 'viewing_space', 'time_limits'].includes(selectedScope)) {
            throw new Error('Keyword, channel, video, viewing-space, and time-limit sends require saved parent trust with the protected device.');
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
        parsed.allowedScopes = getNanahManagedSendScopeList(policy.allowedScopes);
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

    function getNanahActiveManagedSurface() {
        const overrideSurface = normalizeString(safeObject(nanahManagedPolicySourceOverride).surface).toLowerCase();
        if (overrideSurface === 'main' || overrideSurface === 'kids') {
            return overrideSurface;
        }
        const scope = getNanahScope();
        const selectedSurface = normalizeString(ftNanahGranularSurface?.value).toLowerCase();
        if (['keywords', 'channels', 'videos', 'rules_bundle'].includes(scope) && (selectedSurface === 'main' || selectedSurface === 'kids')) {
            return selectedSurface;
        }
        const activeView = normalizeString(document.body?.dataset?.activeView)
            || normalizeString(document.documentElement?.dataset?.activeView)
            || normalizeString(document.querySelector('.nav-item.active')?.getAttribute('data-tab'));
        return activeView === 'kids' ? 'kids' : 'main';
    }

    function getNanahManagedPolicySourceProfile() {
        const override = safeObject(nanahManagedPolicySourceOverride);
        if (normalizeString(override.profileId) && Object.keys(safeObject(override.profile)).length > 0) {
            return {
                profileId: normalizeString(override.profileId),
                profile: safeObject(override.profile),
                sourceKind: normalizeString(override.sourceKind) || 'command_center_protected_profile'
            };
        }
        const managedProfile = getManagedChildProfile();
        const managedProfileId = normalizeString(managedChildEdit?.profileId);
        if (managedProfileId && managedProfile && Object.keys(safeObject(managedProfile)).length > 0) {
            return {
                profileId: managedProfileId,
                profile: managedProfile,
                sourceKind: 'managed_child_edit'
            };
        }
        const profilesRoot = safeObject(profilesV4Cache);
        const profileId = normalizeString(profilesRoot.activeProfileId) || activeProfileId || 'default';
        return {
            profileId,
            profile: safeObject(safeObject(profilesRoot.profiles)[profileId]),
            sourceKind: 'active_profile'
        };
    }

    const nanahManagedLivePolicy = window.FilterTubeNanahManagedLivePolicy?.create({
        normalizeString,
        safeObject,
        normalizeNonNegativeInteger,
        getProfilesRoot: () => profilesV4Cache,
        getLocalProfileContext: getNanahLocalProfileContext,
        getPolicySourceProfile: getNanahManagedPolicySourceProfile,
        getActiveManagedSurface: getNanahActiveManagedSurface,
        getProfileSurface,
        getManagedTimeLimitPolicy,
        normalizeTrustedLink: normalizeNanahTrustedLink,
        getTargetProfileBehavior: getNanahTargetProfileBehavior,
        normalizeTargetProfileContext: normalizeNanahTargetProfileContext,
        getRemoteTargetProfile: () => nanahSessionState.remoteTargetProfile,
        buildLocalPolicyHash,
        getCurrentTrustedLink: getNanahCurrentTrustedLink,
        getAllowedScopeList: getNanahManagedPolicyScopeList,
        getScopeLabel: getNanahScopeLabel,
        ensureSigningKeyPair: ensureNanahManagedSigningKeyPair,
        getStableDeviceId: () => nanahStableDeviceId,
        findTrustedLinkById: (linkId) => nanahTrustedLinks.find((entry) => normalizeString(entry?.linkId) === linkId),
        updateTrustedLinkPolicy: updateNanahTrustedLinkPolicy,
        ensureManagedProviderDeliveryAuthorized: async (context = {}) => {
            const root = safeObject(context);
            const scopes = Array.isArray(root.scopes) ? root.scopes : [];
            const scope = normalizeString(root.scope) || normalizeString(scopes[0]) || 'active';
            await ensureNanahOutgoingAuth(scope, { sensitiveAction: true });
            return { ok: true };
        },
        getAdapter: () => window.FilterTubeNanahAdapter || {},
        now: () => Date.now()
    }) || null;

    function resolveTrustedNanahManagedApply(details, trustedLink) {
        const policy = getManagedNanahLinkPolicy(trustedLink);
        if (!policy) return null;
        const allowedScopes = getNanahManagedSendScopeList(policy.allowedScopes);
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

    async function sendNanahManagedLivePolicyAck(envelope, decision, context = {}) {
        if (!nanahClient || !nanahManagedLivePolicy || typeof nanahManagedLivePolicy.buildLiveAckPayload !== 'function') return false;
        try {
            const ackPayload = nanahManagedLivePolicy.buildLiveAckPayload(envelope, decision, {
                transport: 'live_nanah_session',
                ...safeObject(context)
            });
            await nanahClient.send(ackPayload);
            return true;
        } catch (error) {
            return false;
        }
    }

    async function handleNanahIncomingManagedLiveAck(ackPayload) {
        if (!nanahManagedLivePolicy || typeof nanahManagedLivePolicy.recordLiveAckPayload !== 'function') return;
        const result = await nanahManagedLivePolicy.recordLiveAckPayload(ackPayload);
        if (safeObject(result).ok !== true) return;
        updateNanahUi();
        const latest = safeObject(result.latest);
        const state = normalizeString(latest.ackState);
        UIComponents.showToast(
            state === 'delivered'
                ? `${getNanahRemoteLabel()} applied the managed policy`
                : `${getNanahRemoteLabel()} reported managed policy ${state || 'status'}`,
            state === 'delivered' ? 'success' : 'info'
        );
    }

    async function handleNanahIncomingProposal(envelope) {
        const details = parseNanahEnvelopeDetails(envelope);
        const remoteId = normalizeString(safeObject(nanahSessionState.remoteDevice).deviceId);
        const localRole = getNanahRole();
        const remoteRole = normalizeString(nanahSessionState.remoteRole) || 'peer';
        const targetProfileId = normalizeString(safeObject(details.targetProfile).profileId);
        const trustedLink = remoteId ? findNanahTrustedLink(remoteId, {
            targetProfileId,
            localRole,
            remoteRole,
            linkType: localRole === 'replica' && remoteRole === 'source' ? 'managed_link' : ''
        }) : null;
        const isManagedReceiver = localRole === 'replica'
            && remoteRole === 'source'
            && safeObject(trustedLink).linkType === 'managed_link';
        const isFirstManagedReplicaSession = localRole === 'replica'
            && remoteRole === 'source'
            && !isManagedReceiver;

        if (isNanahChildReceiveOnly() && !isManagedReceiver) {
            const okParent = await ensureChildNanahParentAuthorityUnlocked();
            if (!okParent) {
                await sendNanahDecision(envelope.id, false, 'parent authorization required');
                return;
            }
        }

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

        if (remoteId && shouldAutoApplyNanahProposal(remoteId, { targetProfileId }) && isManagedReceiver) {
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
                title: 'Save Parent Control Link',
                message: `${getNanahRemoteLabel()} wants to update ${formatNanahProfileContext(resolveNanahDisplayTargetProfile(details, null))}.`,
                intro: 'Apply this update once, or save this parent/caregiver link so future approved updates can keep this protected profile in sync.',
                initialPolicy: {
                    allowedScopes: details.allowedScopes || [details.scope],
                    defaultScope: details.scope,
                    applyMode: details.strategy,
                    autoApplyControlProposals: true,
                    reconnectMode: 'fast',
                    lockedChildMode: 'allow_trusted_updates',
                    syncOnProfileOpen: true,
                    childProtectionLevel: 'standard',
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
                saveLabel: 'Apply + Save Parent Link',
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
                const remoteDevice = safeObject(nanahSessionState.remoteDevice);
                const remoteProfileContext = normalizeNanahProfileContext(nanahSessionState.remoteProfile);
                const remoteManagedPublicKeyId = normalizeString(remoteDevice.managedPublicKeyId || remoteDevice.sourcePublicKeyId || remoteDevice.publicKeyId);
                const remoteManagedPublicKeyJwk = safeObject(remoteDevice.managedPublicKeyJwk || remoteDevice.sourcePublicKeyJwk || remoteDevice.publicKeyJwk);
                const remoteManagedKeyVersion = normalizeNonNegativeInteger(remoteDevice.managedKeyVersion || remoteDevice.keyVersion || remoteDevice.sourceKeyVersion) || 0;
                await saveNanahTrustedLink({
                    linkId: `nanah-${remoteId}`,
                    remoteDeviceId: remoteId,
                    deviceLabel: getNanahRemoteLabel(),
                    capabilities: safeArray(remoteDevice.capabilities),
                    localRole,
                    remoteRole,
                    linkType: 'managed_link',
                    sourceDeviceId: remoteRole === 'source' ? remoteId : '',
                    sourceProfileId: remoteRole === 'source' ? normalizeString(remoteProfileContext.profileId) : '',
                    sourcePublicKeyId: remoteRole === 'source' ? remoteManagedPublicKeyId : '',
                    sourcePublicKeyJwk: remoteRole === 'source' && Object.keys(remoteManagedPublicKeyJwk).length > 0 ? remoteManagedPublicKeyJwk : {},
                    keyVersion: remoteRole === 'source' ? (remoteManagedKeyVersion || 0) : 0,
                    policy: {
                        linkType: 'managed_link',
                        capabilities: safeArray(remoteDevice.capabilities),
                        allowedScopes: managedApproval.policy.allowedScopes,
                        defaultScope: managedApproval.policy.defaultScope,
                        applyMode: managedApproval.policy.applyMode,
                        autoApplyControlProposals: managedApproval.policy.autoApplyControlProposals,
                        reconnectMode: managedApproval.policy.reconnectMode,
                        lockedChildMode: managedApproval.policy.lockedChildMode,
                        syncOnProfileOpen: managedApproval.policy.syncOnProfileOpen,
                        childProtectionLevel: managedApproval.policy.childProtectionLevel,
                        targetProfileBehavior: managedApproval.policy.targetProfileBehavior,
                        targetProfileId: managedApproval.policy.targetProfileId,
                        targetProfileName: managedApproval.policy.targetProfileName,
                        sourceDeviceId: remoteRole === 'source' ? remoteId : '',
                        sourceProfileId: remoteRole === 'source' ? normalizeString(remoteProfileContext.profileId) : '',
                        sourcePublicKeyId: remoteRole === 'source' ? remoteManagedPublicKeyId : '',
                        sourcePublicKeyJwk: remoteRole === 'source' && Object.keys(remoteManagedPublicKeyJwk).length > 0 ? remoteManagedPublicKeyJwk : {},
                        keyVersion: remoteRole === 'source' ? (remoteManagedKeyVersion || 0) : 0
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
                            syncOnProfileOpen: managedApproval.policy.syncOnProfileOpen,
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
                    ? `Applied ${details.scope} settings and saved parent trust`
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
                    ? ['This parent-to-protected-device pairing is not trusted yet, so this device still decides how to apply the update.']
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
            const trustedLink = getNanahCurrentTrustedLink();
            const approved = await ensureNanahTrustedReconnectApproved(trustedLink, { closeOnDecline: true });
            if (approved) {
                const targetProfile = normalizeNanahTargetProfileContext(nanahSessionState.remoteTargetProfile);
                await markNanahTrustedLinkUsed(safeObject(root.device).deviceId, {
                    targetProfileId: targetProfile.behavior === 'fixed_profile' ? targetProfile.profileId : '',
                    localRole: getNanahRole(),
                    remoteRole: normalizeString(nanahSessionState.remoteRole)
                });
            }
            return;
        }
        if (root.t === 'control_decision') {
            const accepted = root.accepted === true;
            if (accepted && safeObject(root.savedManagedLink).linkType === 'managed_link') {
                const remote = safeObject(nanahSessionState.remoteDevice);
                const remoteDeviceId = normalizeString(remote.deviceId);
                if (remoteDeviceId) {
                    const localProfileContext = getNanahLocalProfileContext();
                    const localManagedKey = safeObject(nanahManagedSigningKeyDescriptor);
                    const localManagedPublicKeyId = normalizeString(localManagedKey.managedPublicKeyId || localManagedKey.sourcePublicKeyId || localManagedKey.publicKeyId);
                    const localManagedPublicKeyJwk = safeObject(localManagedKey.managedPublicKeyJwk || localManagedKey.sourcePublicKeyJwk || localManagedKey.publicKeyJwk);
                    const localManagedKeyVersion = normalizeNonNegativeInteger(localManagedKey.managedKeyVersion || localManagedKey.keyVersion || localManagedKey.sourceKeyVersion) || 0;
                    await saveNanahTrustedLink({
                        linkId: `nanah-${remoteDeviceId}`,
                        remoteDeviceId,
                        deviceLabel: getNanahRemoteLabel(),
                        capabilities: safeArray(remote.capabilities),
                        localRole: getNanahRole(),
                        remoteRole: normalizeString(nanahSessionState.remoteRole) || 'peer',
                        linkType: 'managed_link',
                        sourceDeviceId: normalizeString(nanahStableDeviceId),
                        sourceProfileId: normalizeString(localProfileContext.profileId),
                        sourcePublicKeyId: localManagedPublicKeyId,
                        sourcePublicKeyJwk: Object.keys(localManagedPublicKeyJwk).length > 0 ? localManagedPublicKeyJwk : {},
                        keyVersion: localManagedKeyVersion || 0,
                        policy: {
                            ...safeObject(root.savedManagedLink),
                            sourceDeviceId: normalizeString(nanahStableDeviceId),
                            sourceProfileId: normalizeString(localProfileContext.profileId),
                            sourcePublicKeyId: localManagedPublicKeyId,
                            sourcePublicKeyJwk: Object.keys(localManagedPublicKeyJwk).length > 0 ? localManagedPublicKeyJwk : {},
                            keyVersion: localManagedKeyVersion || 0
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
        if (root.type === 'filtertube_managed_policy') {
            await handleNanahIncomingManagedPolicyEnvelope(root);
            return;
        }
        if (root.schema === 'filtertube_nanah_managed_live_ack') {
            await handleNanahIncomingManagedLiveAck(root);
            return;
        }
        if (root.schema === 'filtertube_nanah_managed_open_sync_ack'
            || root.schema === 'filtertube_managed_local_network_candidate_ack') {
            await handleNanahIncomingManagedRemoteDeliveryAck(root);
            return;
        }
        if (root.schema === 'filtertube_managed_mailbox_item') {
            await handleNanahIncomingManagedMailboxItem(root);
            return;
        }
        if (root.schema === 'filtertube_managed_local_network_candidate') {
            await handleNanahIncomingManagedLocalNetworkCandidate(root);
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
        await loadNanahManagedSigningKeyDescriptor();
        if (getNanahRole() === 'source') {
            try {
                await ensureNanahManagedSigningKeyPair();
            } catch (error) {
                // Optional provisioning can fail closed later when managed source authority is required.
            }
        }

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
        if (isNanahChildReceiveOnly()) {
            UIComponents.showToast('Child profiles can receive parent updates, but trusted-link policy is parent-controlled.', 'error');
            return;
        }
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
                `${getNanahRoleLabel(localRole)} + ${getNanahRoleLabel(remoteRole)} can pair temporarily, but only matching device-copy or parent/protected roles can be saved as a trusted link.`,
                'error'
            );
            return;
        }
        if (isNanahChildReplicaOnly() && (localRole !== 'replica' || remoteRole !== 'source' || linkType !== 'managed_link')) {
            UIComponents.showToast('Locked child profiles can only save parent trust links. Unlock the child profile first to send from it.', 'error');
            return;
        }
        if (linkType === 'managed_link' && localRole === 'source') {
            try {
                const keyPair = await ensureNanahManagedSigningKeyPair({ required: true });
                if (!keyPair) {
                    UIComponents.showToast('Managed source links require a local signing key before they can be saved.', 'error');
                    return;
                }
            } catch (error) {
                // The toast below is the user-facing required-key failure report.
                UIComponents.showToast(error?.message || 'Managed signing key is unavailable', 'error');
                return;
            }
        }

        const scope = getNanahScope();
        const strategy = getNanahStrategy();
        const localProfileContext = getNanahLocalProfileContext();
        const remoteProfileContext = normalizeNanahProfileContext(nanahSessionState.remoteProfile);
        const localManagedKey = safeObject(nanahManagedSigningKeyDescriptor);
        const remoteManagedPublicKeyId = normalizeString(remote.managedPublicKeyId || remote.sourcePublicKeyId || remote.publicKeyId);
        const remoteManagedPublicKeyJwk = safeObject(remote.managedPublicKeyJwk || remote.sourcePublicKeyJwk || remote.publicKeyJwk);
        const remoteManagedKeyVersion = normalizeNonNegativeInteger(remote.managedKeyVersion || remote.keyVersion || remote.sourceKeyVersion) || 0;
        const localManagedPublicKeyId = normalizeString(localManagedKey.managedPublicKeyId || localManagedKey.sourcePublicKeyId || localManagedKey.publicKeyId);
        const localManagedPublicKeyJwk = safeObject(localManagedKey.managedPublicKeyJwk || localManagedKey.sourcePublicKeyJwk || localManagedKey.publicKeyJwk);
        const localManagedKeyVersion = normalizeNonNegativeInteger(localManagedKey.managedKeyVersion || localManagedKey.keyVersion || localManagedKey.sourceKeyVersion) || 0;
        const managedSourceDeviceId = localRole === 'source' ? normalizeString(nanahStableDeviceId) : remoteDeviceId;
        const managedSourceProfileId = localRole === 'source' ? normalizeString(localProfileContext.profileId) : normalizeString(remoteProfileContext.profileId);
        const managedSourcePublicKeyId = localRole === 'source' ? localManagedPublicKeyId : remoteManagedPublicKeyId;
        const managedSourcePublicKeyJwk = localRole === 'source' ? localManagedPublicKeyJwk : remoteManagedPublicKeyJwk;
        const managedSourceKeyVersion = localRole === 'source' ? localManagedKeyVersion : remoteManagedKeyVersion;
        const isManagedReplicaReceiving = linkType === 'managed_link' && localRole === 'replica' && remoteRole === 'source';
        let policy = {
            linkType,
            capabilities: safeArray(remote.capabilities),
            allowedScopes: [scope],
            defaultScope: scope,
            applyMode: strategy,
            autoApplyControlProposals: isManagedReplicaReceiving,
            reconnectMode: isManagedReplicaReceiving ? 'fast' : (linkType === 'managed_link' ? 'approval_needed' : 'fast'),
            lockedChildMode: isManagedReplicaReceiving ? 'allow_trusted_updates' : 'require_unlock',
            syncOnProfileOpen: isManagedReplicaReceiving,
            childProtectionLevel: 'standard',
            targetProfileBehavior: isActiveChildNanahProfile() ? 'fixed_profile' : 'current_active',
            targetProfileId: localProfileContext.profileId,
            targetProfileName: localProfileContext.profileName,
            sourceDeviceId: managedSourceDeviceId,
            sourceProfileId: managedSourceProfileId,
            sourcePublicKeyId: managedSourcePublicKeyId,
            sourcePublicKeyJwk: Object.keys(managedSourcePublicKeyJwk).length > 0 ? managedSourcePublicKeyJwk : {},
            keyVersion: managedSourceKeyVersion || 0
        };

        if (linkType === 'managed_link') {
            const trustPolicy = await showNanahManagedLinkModal({
                title: localRole === 'replica' ? 'Save Parent Trust' : 'Save Protected-Device Policy',
                message: localRole === 'replica'
                    ? `${getNanahRemoteLabel()} is connected as a parent/caregiver device.`
                    : `${getNanahRemoteLabel()} is connected as a protected receiving device.`,
                intro: localRole === 'replica'
                    ? 'Save what this parent/caregiver can update later. Matching signed updates still have to pass the saved profile, scope, revision, and device checks.'
                    : 'Save the parent-side policy now. The protected device still chooses locally whether to trust and auto-apply on its own side.',
                initialPolicy: policy,
                allowApplyOnce: false,
                allowSave: true,
                saveLabel: localRole === 'replica' ? 'Save Parent Trust' : 'Save Protected-Device Policy',
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
            sourceDeviceId: managedSourceDeviceId,
            sourceProfileId: managedSourceProfileId,
            sourcePublicKeyId: managedSourcePublicKeyId,
            sourcePublicKeyJwk: Object.keys(managedSourcePublicKeyJwk).length > 0 ? managedSourcePublicKeyJwk : {},
            keyVersion: managedSourceKeyVersion || 0,
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

    async function ensureProfileUnlocked(profilesV4, profileId, options = {}) {
        await syncSessionUnlockStateFromBackground();
        if (!isProfileLocked(profilesV4, profileId)) return true;
        if (isProfileUnlockSessionValid.check(profileId, options)) return true;

        const verifier = profileId === 'default'
            ? extractMasterPinVerifier(profilesV4)
            : extractProfilePinVerifier(profilesV4, profileId);
        if (!verifier) return true;
        if (isManagedAdminUnlockRateLimited(profileId, profilesV4)) {
            UIComponents.showToast('Too many incorrect PIN attempts. Try again later.', 'error');
            return false;
        }

        const copy = getProfileAccessCopy(profilesV4, profileId);
        const pin = await showPromptModal({
            eyebrow: copy.eyebrow,
            title: copy.title,
            message: copy.message,
            placeholder: copy.placeholder,
            inputType: 'password',
            confirmText: 'Unlock'
        });
        const normalized = normalizeString(pin);
        if (!normalized) return false;
        const ok = await verifyPin(normalized, verifier);
        if (!ok) {
            const failedAttempt = await recordManagedAdminUnlockFailure(profileId, profilesV4);
            UIComponents.showToast(
                failedAttempt.rateLimited
                    ? 'Too many incorrect PIN attempts. Try again later.'
                    : 'Incorrect PIN',
                'error'
            );
            return false;
        }

        await clearManagedAdminUnlockFailures(profileId);
        markProfileUnlockSession.run(profileId);
        if (profileId === 'default') {
            sessionMasterPin = normalized;
        }
        await notifyBackgroundUnlocked(profileId, profileId === 'default' ? sessionMasterPin : normalized);
        return true;
    }

    async function ensureAdminUnlocked(profilesV4, options = {}) {
        const masterVerifier = extractMasterPinVerifier(profilesV4);
        if (!masterVerifier) return true;
        if (isProfileUnlockSessionValid.check('default', options) && sessionMasterPin) return true;
        return ensureProfileUnlocked(profilesV4, 'default', options);
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
        const childAdminTitle = 'Child profiles cannot manage profile names, deletion, PIN rules, viewing spaces, time limits, or profile switching PINs from this surface.';

        ftProfilesManager.innerHTML = '';

        const ids = [];
        getAccountIds(profilesV4).forEach(accountId => ids.push(accountId, ...getChildrenForAccount(profilesV4, accountId)));

        const commandCenter = window.FilterTubeManagedParentCommandCenter?.render?.(profilesV4, {
            revealDetails: !childAdminRestricted,
            helpers: {
                safeObject,
                getAccountIds,
                getChildrenForAccount,
                canActiveProfileManageProfile,
                summarizeManagedPolicyStateForProfile,
                getManagedTimeLimitPolicy,
                getProfileName,
                getProfileType,
                isProfileLocked,
                viewingAccessLabel,
                managedTimeLimitLabel,
                getManagedSyncTargetSummary,
                getManagedMailboxConfigSummary: summarizeManagedMailboxServerConfig,
                getManagedLocalNetworkConfigSummary: summarizeManagedLocalNetworkProviderConfig,
                onAction: async (intent) => {
                    const targetId = normalizeString(intent?.profileId);
                    const action = normalizeString(intent?.action);
                    if (action === 'configure_mailbox') {
                        await configureNanahManagedMailboxServer();
                    } else if (action === 'configure_local_network') {
                        await configureNanahManagedLocalNetworkProvider();
                    } else if (action === 'create_child_profile') {
                        if (ftCreateChildBtn && !ftCreateChildBtn.disabled) {
                            ftCreateChildBtn.click();
                        } else {
                            UIComponents.showToast('Switch to a parent/account profile to create a child profile', 'error');
                        }
                    } else if (action === 'create_account') {
                        if (ftCreateAccountBtn && !ftCreateAccountBtn.disabled) {
                            ftCreateAccountBtn.click();
                        } else {
                            UIComponents.showToast('Switch to Default to create an account profile', 'error');
                        }
                    } else if (!targetId && !action.startsWith('bulk_')) {
                        return;
                    } else if (action === 'edit_rules') {
                        await startManagedChildEdit(targetId);
                    } else if (action === 'view_history') {
                        await showManagedActionHistory(targetId);
                    } else if (action === 'review_conflicts') {
                        await showManagedActionHistory(targetId, { mode: 'conflicts' });
                    } else if (action === 'set_time_limit' || action === 'change_time_limit') {
                        await updateProfileTimeLimitPolicy(targetId, 'set');
                    } else if (action === 'grant_extra_time') {
                        await grantExtraTimeToProfiles([targetId]);
                    } else if (action === 'send_managed_policy') {
                        await sendManagedParentPolicyToVerifiedDevices(
                            [targetId],
                            { scope: normalizeString(intent?.scope) || 'active' }
                        );
                    } else if (action === 'bulk_edit_rules') {
                        const profileIds = safeArray(intent?.profileIds)
                            .map(id => normalizeString(id))
                            .filter(Boolean);
                        if (profileIds.length !== 1) {
                            UIComponents.showToast('Select one protected profile to edit rules from the command center.', 'info');
                            return;
                        }
                        await startManagedChildEdit(profileIds[0]);
                    } else if (action === 'manage_channel_lists') {
                        await manageManagedChannelListsForProfiles([targetId]);
                    } else if (action === 'import_channel_list') {
                        await importManagedChannelListToProfiles([targetId]);
                    } else if (action === 'remove_channel_list') {
                        await removeManagedChannelListFromProfiles([targetId]);
                    } else if (action === 'refresh_channel_list') {
                        await refreshManagedChannelListForProfiles([targetId]);
                    } else if (action === 'bulk_add_keyword' || action === 'bulk_add_channel' || action === 'bulk_add_video') {
                        await addManagedBulkRuleToProfiles(
                            safeArray(intent?.profileIds),
                            action === 'bulk_add_video' ? 'video' : (action === 'bulk_add_channel' ? 'channel' : 'keyword')
                        );
                    } else if (action === 'bulk_import_channel_list') {
                        await importManagedChannelListToProfiles(safeArray(intent?.profileIds));
                    } else if (action === 'bulk_remove_channel_list') {
                        await removeManagedChannelListFromProfiles(safeArray(intent?.profileIds));
                    } else if (action === 'bulk_refresh_channel_list') {
                        await refreshManagedChannelListForProfiles(safeArray(intent?.profileIds));
                    } else if (action === 'bulk_manage_channel_lists') {
                        await manageManagedChannelListsForProfiles(safeArray(intent?.profileIds));
                    } else if (action === 'bulk_set_time_limit' || action === 'bulk_disable_time_limit') {
                        await updateMultipleProfileTimeLimitPolicies(
                            safeArray(intent?.profileIds),
                            action === 'bulk_disable_time_limit' ? 'disable' : 'set'
                        );
                    } else if (action === 'bulk_grant_extra_time') {
                        await grantExtraTimeToProfiles(safeArray(intent?.profileIds));
                    } else if (action === 'bulk_send_managed_policy') {
                        await sendManagedParentPolicyToVerifiedDevices(
                            safeArray(intent?.profileIds),
                            { scope: normalizeString(intent?.scope) || 'active' }
                        );
                    } else if (action === 'bulk_allow_main_kids' || action === 'bulk_kids_only' || action === 'bulk_main_only') {
                        await updateMultipleProfileViewingAccess(
                            safeArray(intent?.profileIds),
                            normalizeString(intent?.viewingAccess) || action.replace(/^bulk_/, '')
                        );
                    }
                }
            }
        });
        if (commandCenter) ftProfilesManager.appendChild(commandCenter);

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
            body.textContent = `Viewing access: ${viewingAccessLabel(profiles[profileId])} | Time limit: ${managedTimeLimitLabel(profiles[profileId])}`;
            const canManageTarget = canActiveProfileManageProfile(profilesV4, profileId);
            const managedStatusText = profileId !== 'default'
                ? buildManagedProfileStatusText(profiles[profileId], { revealDetails: canManageTarget && !childAdminRestricted })
                : '';
            if (managedStatusText) {
                const managedStatus = document.createElement('div');
                managedStatus.className = 'help-item-body ft-managed-profile-status';
                managedStatus.style.marginTop = '6px';
                managedStatus.textContent = managedStatusText;
                body.appendChild(managedStatus);
            }

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
                clearProfileUnlockSession.run(profileId);
                await StateManager.loadSettings();
                await refreshProfilesUI();
                await applyLockGateIfNeeded();
                UIComponents.showToast('Profile deleted', 'success');
            });

            actions.appendChild(switchBtn);
            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);

            const access = getProfileViewingAccess(profiles[profileId]);
            const mainAccessBtn = document.createElement('button');
            mainAccessBtn.className = access.main ? 'btn-primary' : 'btn-secondary';
            mainAccessBtn.type = 'button';
            mainAccessBtn.textContent = access.main ? 'Main allowed' : 'Main blocked';
            mainAccessBtn.disabled = childAdminRestricted;
            mainAccessBtn.title = childAdminRestricted ? childAdminTitle : 'Toggle whether this profile can open Main YouTube.';
            mainAccessBtn.addEventListener('click', async () => {
                if (childAdminRestricted) {
                    UIComponents.showToast('Child profiles cannot change viewing access here', 'error');
                    return;
                }
                await updateProfileViewingAccess(profileId, { main: !access.main });
            });

            const kidsAccessBtn = document.createElement('button');
            kidsAccessBtn.className = access.kids ? 'btn-primary' : 'btn-secondary';
            kidsAccessBtn.type = 'button';
            kidsAccessBtn.textContent = access.kids ? 'Kids allowed' : 'Kids blocked';
            kidsAccessBtn.disabled = childAdminRestricted;
            kidsAccessBtn.title = childAdminRestricted ? childAdminTitle : 'Toggle whether this profile can open YouTube Kids.';
            kidsAccessBtn.addEventListener('click', async () => {
                if (childAdminRestricted) {
                    UIComponents.showToast('Child profiles cannot change viewing access here', 'error');
                    return;
                }
                await updateProfileViewingAccess(profileId, { kids: !access.kids });
            });

            actions.appendChild(mainAccessBtn);
            actions.appendChild(kidsAccessBtn);

            const timeLimitPolicy = getManagedTimeLimitPolicy(profiles[profileId]);
            const timeLimitBtn = document.createElement('button');
            timeLimitBtn.className = timeLimitPolicy?.enabled ? 'btn-primary' : 'btn-secondary';
            timeLimitBtn.type = 'button';
            timeLimitBtn.textContent = timeLimitPolicy?.enabled ? 'Change limit' : 'Set limit';
            timeLimitBtn.disabled = childAdminRestricted;
            timeLimitBtn.title = childAdminRestricted ? childAdminTitle : 'Set the daily YouTube time limit for this profile.';
            timeLimitBtn.addEventListener('click', async () => {
                if (childAdminRestricted) {
                    UIComponents.showToast('Child profiles cannot change time limits here', 'error');
                    return;
                }
                await updateProfileTimeLimitPolicy(profileId, 'set');
            });
            actions.appendChild(timeLimitBtn);

            if (timeLimitPolicy?.enabled) {
                const disableTimeLimitBtn = document.createElement('button');
                disableTimeLimitBtn.className = 'btn-secondary';
                disableTimeLimitBtn.type = 'button';
                disableTimeLimitBtn.textContent = 'Disable limit';
                disableTimeLimitBtn.disabled = childAdminRestricted;
                disableTimeLimitBtn.title = childAdminRestricted ? childAdminTitle : 'Disable the daily YouTube time limit for this profile.';
                disableTimeLimitBtn.addEventListener('click', async () => {
                    if (childAdminRestricted) {
                        UIComponents.showToast('Child profiles cannot change time limits here', 'error');
                        return;
                    }
                    await updateProfileTimeLimitPolicy(profileId, 'disable');
                });
                actions.appendChild(disableTimeLimitBtn);
            }

            if (profileId !== 'default' && canManageTarget && !childAdminRestricted) {
                const editRulesBtn = document.createElement('button');
                editRulesBtn.className = 'btn-secondary btn-profile-main';
                editRulesBtn.type = 'button';
                editRulesBtn.textContent = 'Edit Rules';
                editRulesBtn.title = 'Enter parent-managed edit mode without switching into this protected profile.';
                editRulesBtn.addEventListener('click', async () => {
                    await startManagedChildEdit(profileId);
                });

                actions.appendChild(editRulesBtn);

                const historyBtn = document.createElement('button');
                historyBtn.className = 'btn-secondary';
                historyBtn.type = 'button';
                historyBtn.textContent = 'History';
                historyBtn.title = 'View protected parent-managed action history for this profile.';
                historyBtn.addEventListener('click', async () => {
                    await showManagedActionHistory(profileId);
                });

                actions.appendChild(historyBtn);
            }

            if (profileId !== 'default') {
                const pinBtn = document.createElement('button');
                pinBtn.className = 'btn-secondary';
                pinBtn.type = 'button';
                pinBtn.textContent = isProfileLocked(profilesV4, profileId) ? 'Change PIN' : 'Set PIN';
                pinBtn.disabled = childAdminRestricted;
                pinBtn.title = childAdminRestricted
                    ? childAdminTitle
                    : 'Set the profile switching PIN. This protects entry into this profile; it does not grant parent/admin authority.';
                pinBtn.addEventListener('click', async () => {
                    if (childAdminRestricted) {
                        UIComponents.showToast('Child profiles cannot manage profile switching PINs here', 'error');
                        return;
                    }
                    const io = window.FilterTubeIO || {};
                    if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                    const fresh = await io.loadProfilesV4();

                    const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
                    const canManagePin = currentActive === 'default'
                        || currentActive === profileId
                        || canActiveProfileManageProfile(fresh, profileId);
                    if (!canManagePin) {
                        UIComponents.showToast('Switch to the parent/account profile to manage this profile PIN', 'error');
                        return;
                    }

                    if (currentActive === 'default') {
                        const okAdmin = await ensureAdminUnlocked(fresh);
                        if (!okAdmin) return;
                    } else if (currentActive === profileId) {
                        const okSelf = await ensureProfileUnlocked(fresh, profileId);
                        if (!okSelf) return;
                    } else {
                        const okParent = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
                        if (!okParent) return;
                    }

                    const pin1 = await showPromptModal({
                        title: 'Set Profile Switching PIN',
                        message: 'Enter the PIN used only for switching into this profile. Parent/admin authority stays separate.',
                        placeholder: 'Profile switching PIN',
                        inputType: 'password',
                        confirmText: 'Continue'
                    });
                    if (pin1 === null) return;
                    const pin2 = await showPromptModal({
                        title: 'Confirm Profile Switching PIN',
                        message: 'Re-enter the profile switching PIN to confirm.',
                        placeholder: 'Profile switching PIN',
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
                    clearProfileUnlockSession.run(profileId);
                    await refreshProfilesUI();
                    UIComponents.showToast('Profile switching PIN updated', 'success');
                });

                const clearPinBtn = document.createElement('button');
                clearPinBtn.className = 'btn-secondary';
                clearPinBtn.type = 'button';
                clearPinBtn.textContent = 'Remove PIN';
                clearPinBtn.disabled = !isProfileLocked(profilesV4, profileId) || childAdminRestricted;
                clearPinBtn.title = childAdminRestricted
                    ? childAdminTitle
                    : 'Remove the profile switching PIN. Parent/admin authority is not changed.';
                clearPinBtn.addEventListener('click', async () => {
                    if (childAdminRestricted) {
                        UIComponents.showToast('Child profiles cannot manage profile switching PINs here', 'error');
                        return;
                    }
                    const io = window.FilterTubeIO || {};
                    if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') return;
                    const fresh = await io.loadProfilesV4();

                    const currentActive = normalizeString(fresh?.activeProfileId) || 'default';
                    const canManagePin = currentActive === 'default'
                        || currentActive === profileId
                        || canActiveProfileManageProfile(fresh, profileId);
                    if (!canManagePin) {
                        UIComponents.showToast('Switch to the parent/account profile to manage this profile PIN', 'error');
                        return;
                    }

                    if (currentActive === 'default') {
                        const okAdmin = await ensureAdminUnlocked(fresh);
                        if (!okAdmin) return;
                    } else if (currentActive === profileId) {
                        const okSelf = await ensureProfileUnlocked(fresh, profileId);
                        if (!okSelf) return;
                    } else {
                        const okParent = await ensureProfileUnlocked(fresh, currentActive, { sensitiveAction: true });
                        if (!okParent) return;
                    }
                    const confirmed = window.confirm('Remove the profile switching PIN?');
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
                    clearProfileUnlockSession.run(profileId);
                    await notifyBackgroundLocked(profileId);
                    await refreshProfilesUI();
                    UIComponents.showToast('Profile switching PIN removed', 'success');
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
            managedChildEdit = null;
            await StateManager.loadSettings();
            await refreshProfilesUI();
            await runNanahManagedOpenSync({ reason: 'profile_switch' });
            await runNanahManagedLocalNetworkSync({ reason: 'profile_switch' });
            await runNanahManagedSourceAckSync({ reason: 'profile_switch' });
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

    function revokeBlobUrlLater(blobUrl, delayMs = 60000) {
        if (!blobUrl || typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return;
        setTimeout(() => {
            try {
                URL.revokeObjectURL(blobUrl);
            } catch (e) {
                // ignore cleanup errors
            }
        }, delayMs);
    }

    /**
     * Fallback download via anchor click - works in Firefox when downloads API fails.
     * Keep the blob URL alive long enough for Firefox/Waterfox on Windows to read it.
     */
    function downloadViaAnchor(blob, filename) {
        return new Promise((resolve, reject) => {
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
                    } catch (e) {
                        // ignore cleanup errors
                    }
                }, 2000);
                revokeBlobUrlLater(blobUrl);
                setTimeout(() => {
                    resolve({ filename, method: 'anchor' });
                }, 250);
            } catch (e) {
                reject(new Error(e?.message || 'Download failed'));
            }
        });
    }

    function downloadJsonToDownloadsFolder(folder, filename, obj, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const json = JSON.stringify(obj, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const preferAnchor = (options && options.preferAnchor === true) || IS_FIREFOX_TAB_VIEW;

                // Firefox/Waterfox on Windows can fail extension-initiated blob downloads,
                // especially with subfolder filenames. Use a direct attachment path there.
                if (preferAnchor || !runtimeAPI?.downloads?.download) {
                    downloadViaAnchor(blob, filename).then(resolve).catch(reject);
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
                    revokeBlobUrlLater(blobUrl);
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
            const downloadResult = await downloadJsonToDownloadsFolder('FilterTube Export', filename, payload, {
                preferAnchor: IS_FIREFOX_TAB_VIEW
            });
            UIComponents.showToast(
                downloadResult?.method === 'anchor'
                    ? 'Exported JSON to Downloads'
                    : 'Exported JSON to Downloads/FilterTube Export/',
                'success'
            );
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

            const downloadResult = await downloadJsonToDownloadsFolder('FilterTube Export', filename, payload, {
                preferAnchor: IS_FIREFOX_TAB_VIEW
            });
            UIComponents.showToast(
                payload?.meta?.containsNanahTrustedState === true
                    ? 'Exported encrypted backup with trusted-device recovery data'
                    : (downloadResult?.method === 'anchor' ? 'Exported encrypted JSON to Downloads' : 'Exported encrypted JSON to Downloads/FilterTube Export/'),
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
    await loadNanahManagedOpenSyncState();
    await loadNanahManagedLocalNetworkSyncState();
    await loadNanahManagedSourceAckSyncState();
    await runNanahManagedOpenSync({ reason: 'dashboard_open' });
    await runNanahManagedLocalNetworkSync({ reason: 'dashboard_open' });
    await runNanahManagedSourceAckSync({ reason: 'dashboard_open' });
    renderNanahTrustedLinks();
    setNanahMode(nanahUiMode, { persist: false, applyPreset: true });
    updateNanahUi();

    [ftNanahRole, ftNanahScope, ftNanahGranularSurface, ftNanahStrategy, ftNanahRemoteTarget].forEach((element) => {
        if (!element) return;
        element.addEventListener('change', () => {
            if (element === ftNanahGranularSurface) {
                element.dataset.userSelected = 'true';
            }
            if (!isApplyingNanahModePreset && element !== ftNanahRemoteTarget && element !== ftNanahGranularSurface) {
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

    if (ftNanahManagedTargets) {
        ftNanahManagedTargets.addEventListener('change', () => {
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
                if (isNanahChildReceiveOnly()) {
                    UIComponents.showToast('Start pairing from a parent profile, then join the code here.', 'info');
                    return;
                }
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
                if (isNanahChildReceiveOnly()) {
                    UIComponents.showToast('Child profiles are receive-only in Accounts & Sync.', 'error');
                    return;
                }
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
                    const requiresManagedAdminReauth = policy.linkType === 'managed_link' && policy.authorityMode === 'managed';
                    const auth = await ensureNanahOutgoingAuth(policy.scope, { sensitiveAction: requiresManagedAdminReauth });
                    if (policy.linkType === 'managed_link' && getNanahRole() === 'source') {
                        await ensureNanahManagedSigningKeyPair({ required: true });
                    }
                    if (policy.linkType === 'managed_link' && policy.authorityMode === 'managed' && getNanahRole() === 'source') {
                        if (!nanahManagedLivePolicy) {
                            throw new Error('Managed policy live-send helpers are unavailable');
                        }
                        const selectedTargetLinks = getNanahSelectedManagedTargetLinks(policy.scope);
                        if (ftNanahManagedTargetsField && !ftNanahManagedTargetsField.hidden && selectedTargetLinks.length === 0) {
                            throw new Error('Choose at least one managed child target for this send.');
                        }
                        const signedEnvelopes = selectedTargetLinks.length > 0
                            && typeof nanahManagedLivePolicy.buildEnvelopeBatchForTrustedLinks === 'function'
                            ? await nanahManagedLivePolicy.buildEnvelopeBatchForTrustedLinks(policy, selectedTargetLinks)
                            : (typeof nanahManagedLivePolicy.buildEnvelopeBatchForLiveSend === 'function'
                                ? await nanahManagedLivePolicy.buildEnvelopeBatchForLiveSend(policy)
                                : [await nanahManagedLivePolicy.buildEnvelopeForLiveSend(policy)]);
                        for (const signedEnvelope of signedEnvelopes) {
                            await nanahClient.send(signedEnvelope);
                            await nanahManagedLivePolicy.markSent(
                                signedEnvelope.linkId,
                                signedEnvelope.scope,
                                signedEnvelope.revision,
                                signedEnvelope.policyHash,
                                {
                                    targetProfileId: signedEnvelope.targetProfileId,
                                    targetProfileName: signedEnvelope.targetProfileName,
                                    sourceProfileId: signedEnvelope.sourceProfileId,
                                    sourceDeviceId: signedEnvelope.sourceDeviceId,
                                    issuedAt: signedEnvelope.issuedAt
                                }
                            );
                        }
                        const sentScopes = Array.from(new Set(signedEnvelopes.map((envelope) => getNanahScopeLabel(envelope.scope)))).join(', ');
                        const targetCount = new Set(signedEnvelopes.map((envelope) => normalizeString(envelope.linkId))).size || 1;
                        const targetLabel = targetCount > 1
                            ? `${targetCount} target profiles on ${getNanahRemoteLabel()}`
                            : getNanahRemoteLabel();
                        UIComponents.showToast(`Sent signed managed ${sentScopes} policy to ${targetLabel}`, 'success');
                        return;
                    }
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
                if (isNanahChildReceiveOnly()) {
                    UIComponents.showToast('Trusted-link policy is parent-controlled for child profiles.', 'error');
                    return;
                }
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
                    allowMainViewing: true,
                    allowKidsViewing: true,
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
            UIComponents.showToast('Account created. Current profile remains active.', 'success');
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
                    allowMainViewing: false,
                    allowKidsViewing: true,
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
            UIComponents.showToast('Child profile created. Parent profile remains active so you can finish setup.', 'success');
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
            markProfileUnlockSession.run('default');
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

            clearProfileUnlockSession.run('default');
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
    const kidsChannelSourceFilter = document.getElementById('kidsChannelSourceFilter');
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
    let kidsChannelSourceFilterValue = 'all';
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

    async function addManagedKeyword(surface, word) {
        return saveManagedChildSurface(surface, async (target) => {
            const listKey = surface === 'kids'
                ? (target.mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords')
                : (target.mode === 'whitelist' ? 'whitelistKeywords' : 'keywords');
            const list = Array.isArray(target[listKey]) ? target[listKey] : [];
            const entry = normalizeProfileKeyword(word, { comments: surface !== 'kids' });
            if (!entry) return false;
            const lower = entry.word.toLowerCase();
            if (list.some(item => normalizeString(item?.word).toLowerCase() === lower)) return false;
            target[listKey] = [entry, ...list];
            return true;
        });
    }

    async function removeManagedKeyword(surface, entry) {
        return saveManagedChildSurface(surface, async (target) => {
            const listKey = surface === 'kids'
                ? (target.mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords')
                : (target.mode === 'whitelist' ? 'whitelistKeywords' : 'keywords');
            const list = Array.isArray(target[listKey]) ? target[listKey] : [];
            const word = normalizeString(entry?.word);
            const before = list.length;
            target[listKey] = list.filter(item => normalizeString(item?.word) !== word || item?.source === 'channel');
            return target[listKey].length !== before;
        });
    }

    async function toggleManagedKeywordExact(surface, entry) {
        return saveManagedChildSurface(surface, async (target) => {
            const listKey = surface === 'kids'
                ? (target.mode === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords')
                : (target.mode === 'whitelist' ? 'whitelistKeywords' : 'keywords');
            const list = Array.isArray(target[listKey]) ? target[listKey] : [];
            const word = normalizeString(entry?.word);
            const index = list.findIndex(item => normalizeString(item?.word) === word && item?.source !== 'channel');
            if (index < 0) return false;
            list[index] = { ...safeObject(list[index]), word, exact: !list[index]?.exact };
            target[listKey] = list;
            return true;
        });
    }

    async function toggleManagedKeywordComments(surface, entry) {
        if (surface === 'kids') return false;
        return saveManagedChildSurface(surface, async (target) => {
            const listKey = target.mode === 'whitelist' ? 'whitelistKeywords' : 'keywords';
            const list = Array.isArray(target[listKey]) ? target[listKey] : [];
            const word = normalizeString(entry?.word);
            const index = list.findIndex(item => normalizeString(item?.word) === word);
            if (index < 0) return false;
            const current = safeObject(list[index]);
            list[index] = { ...current, word, comments: current.comments !== true };
            target[listKey] = list;
            return true;
        });
    }

    async function addManagedChannel(surface, input) {
        const ok = await saveManagedChildSurface(surface, async (target) => {
            const listKey = surface === 'kids'
                ? (target.mode === 'whitelist' ? 'whitelistChannels' : 'blockedChannels')
                : (target.mode === 'whitelist' ? 'whitelistChannels' : 'channels');
            const list = Array.isArray(target[listKey]) ? target[listKey] : [];
            const channel = normalizeProfileChannel(input);
            if (!channel) {
                UIComponents.showToast('Invalid format. Use @handle, Channel ID, c/ChannelName, or YouTube URL', 'error');
                return false;
            }
            const key = normalizeString(channel.id || channel.handle || channel.customUrl || channel.name).toLowerCase();
            const exists = list.some(item => normalizeString(item?.id || item?.handle || item?.customUrl || item?.name).toLowerCase() === key);
            if (exists) return false;
            target[listKey] = [channel, ...list];
            return true;
        });
        return ok ? { success: true } : { success: false, error: 'Channel already exists or could not be added' };
    }

    async function removeManagedChannel(surface, channel, index) {
        return saveManagedChildSurface(surface, async (target) => {
            const listKey = surface === 'kids'
                ? (target.mode === 'whitelist' ? 'whitelistChannels' : 'blockedChannels')
                : (target.mode === 'whitelist' ? 'whitelistChannels' : 'channels');
            const list = Array.isArray(target[listKey]) ? target[listKey] : [];
            if (index < 0 || index >= list.length) return false;
            list.splice(index, 1);
            target[listKey] = list;
            return true;
        });
    }

    async function toggleManagedChannelFilterAll(surface, channel, index) {
        const state = buildManagedChildState(surface);
        const mode = surface === 'kids'
            ? (state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist')
            : (state?.mode === 'whitelist' ? 'whitelist' : 'blocklist');
        if (mode === 'whitelist') return false;

        return saveManagedChildSurface(surface, async (target) => {
            const listKey = surface === 'kids' ? 'blockedChannels' : 'channels';
            const list = Array.isArray(target[listKey]) ? target[listKey] : [];
            if (index < 0 || index >= list.length) return false;
            list[index] = { ...safeObject(list[index]), filterAll: !list[index]?.filterAll };
            target[listKey] = list;
            return true;
        });
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
            dateTo: keywordDateToTs,
            stateOverride: isManagedChildEditFor('main') ? buildManagedChildState('main') : null,
            onDelete: isManagedChildEditFor('main') ? (entry) => removeManagedKeyword('main', entry) : null,
            onToggleExact: isManagedChildEditFor('main') ? (entry) => toggleManagedKeywordExact('main', entry) : null,
            onToggleComments: isManagedChildEditFor('main') ? (entry) => toggleManagedKeywordComments('main', entry) : null
        });
        renderManagedChildEditorBanner();
    }

    function getChannelSourceFilterRows(surface = 'main') {
        const state = isManagedChildEditFor(surface) ? buildManagedChildState(surface) : StateManager.getState();
        const mode = surface === 'kids'
            ? (state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist')
            : (state?.mode === 'whitelist' ? 'whitelist' : 'blocklist');
        if (surface === 'kids') {
            if (mode === 'whitelist') return Array.isArray(state?.kids?.whitelistChannels) ? state.kids.whitelistChannels : [];
            return Array.isArray(state?.kids?.blockedChannels) ? state.kids.blockedChannels : [];
        }
        if (mode === 'whitelist') return Array.isArray(state?.whitelistChannels) ? state.whitelistChannels : [];
        return Array.isArray(state?.channels) ? state.channels : [];
    }

    function collectChannelSourceFilterOptions(surface = 'main') {
        const summaries = new Map();
        getChannelSourceFilterRows(surface).forEach((row) => {
            const listId = normalizeString(row?.managedListId);
            if (!listId) return;
            const listName = normalizeString(row?.managedListName)
                || normalizeString(row?.managedListSourceLabel)
                || 'Imported list';
            if (!summaries.has(listId)) {
                summaries.set(listId, {
                    id: listId,
                    name: listName,
                    count: 0
                });
            }
            const summary = summaries.get(listId);
            summary.count += 1;
            if (summary.name === 'Imported list' && listName !== 'Imported list') {
                summary.name = listName;
            }
        });
        return Array.from(summaries.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    function truncateChannelSourceFilterLabel(value, maxLength = 44) {
        const normalized = normalizeString(value);
        if (normalized.length <= maxLength) return normalized;
        return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`;
    }

    function updateChannelSourceFilterOptions(selectEl, surface, currentValue) {
        if (!selectEl) return currentValue || 'all';
        const summaries = collectChannelSourceFilterOptions(surface);
        const allowed = new Set(['all', 'manual', 'lists']);
        summaries.forEach(summary => allowed.add(`list:${summary.id}`));
        const nextValue = allowed.has(currentValue) ? currentValue : 'all';
        selectEl.innerHTML = '';
        [
            { value: 'all', label: 'All sources' },
            { value: 'manual', label: 'Manual' },
            { value: 'lists', label: summaries.length ? `Imported lists (${summaries.reduce((sum, item) => sum + item.count, 0)})` : 'Imported lists' }
        ].forEach((item) => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.label;
            selectEl.appendChild(option);
        });
        summaries.forEach((summary) => {
            const option = document.createElement('option');
            option.value = `list:${summary.id}`;
            option.textContent = `List: ${truncateChannelSourceFilterLabel(summary.name)} (${summary.count})`;
            option.title = summary.name;
            selectEl.appendChild(option);
        });
        selectEl.value = nextValue;
        return nextValue;
    }

    function renderChannels() {
        if (!channelListEl) return;
        channelSourceFilterValue = updateChannelSourceFilterOptions(channelSourceFilter, 'main', channelSourceFilterValue);
        RenderEngine.renderChannelList(channelListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            showNodeMapping: true,
            searchValue: channelSearchValue,
            sortValue: channelSortValue,
            sourceFilter: channelSourceFilterValue,
            dateFrom: channelDateFromTs,
            dateTo: channelDateToTs,
            stateOverride: isManagedChildEditFor('main') ? buildManagedChildState('main') : null,
            onDelete: isManagedChildEditFor('main') ? (channel, index) => removeManagedChannel('main', channel, index) : null,
            onToggleFilterAll: isManagedChildEditFor('main') ? (channel, index) => toggleManagedChannelFilterAll('main', channel, index) : null
        });
        renderManagedChildEditorBanner();
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
            includeToggles: true,
            stateOverride: isManagedChildEditFor('kids') ? buildManagedChildState('kids') : null,
            onDelete: isManagedChildEditFor('kids') ? (entry) => removeManagedKeyword('kids', entry) : null,
            onToggleExact: isManagedChildEditFor('kids') ? (entry) => toggleManagedKeywordExact('kids', entry) : null
        });
        renderManagedChildEditorBanner();
    }

    function renderKidsChannels() {
        if (!kidsChannelListEl) return;
        kidsChannelSourceFilterValue = updateChannelSourceFilterOptions(kidsChannelSourceFilter, 'kids', kidsChannelSourceFilterValue);
        RenderEngine.renderChannelList(kidsChannelListEl, {
            minimal: false,
            showSearch: true,
            showSort: true,
            showNodeMapping: true,
            searchValue: kidsChannelSearchValue,
            sortValue: kidsChannelSortValue,
            sourceFilter: kidsChannelSourceFilterValue,
            dateFrom: kidsChannelDateFromTs,
            dateTo: kidsChannelDateToTs,
            profile: 'kids',
            stateOverride: isManagedChildEditFor('kids') ? buildManagedChildState('kids') : null,
            onDelete: isManagedChildEditFor('kids') ? (channel, index) => removeManagedChannel('kids', channel, index) : null,
            onToggleFilterAll: isManagedChildEditFor('kids') ? (channel, index) => toggleManagedChannelFilterAll('kids', channel, index) : null
        });
        renderManagedChildEditorBanner();
    }

    function renderListModeControls() {
        const state = StateManager.getState();
        if (!ftTopBarListModeControlsTab) return;

        const currentNav = document.querySelector('.nav-item.active');
        const currentViewId = normalizeString(currentNav?.getAttribute('data-tab')) || 'dashboard';
        const profileType = currentViewId === 'kids' ? 'kids' : 'main';
        const managedState = isManagedChildEditFor(profileType) ? buildManagedChildState(profileType) : null;
        const modeState = managedState || state;

        const currentMode = (() => {
            if (profileType === 'kids') {
                return modeState?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
            }
            return modeState?.mode === 'whitelist' ? 'whitelist' : 'blocklist';
        })();

        ftTopBarListModeControlsTab.innerHTML = '';

        const toggle = document.createElement('div');
        toggle.className = [
            'exact-toggle',
            'active',
            'ft-list-mode-pill',
            currentMode === 'blocklist' ? 'toggle-variant-red' : ''
        ].filter(Boolean).join(' ');
        toggle.textContent = currentMode === 'whitelist'
            ? (profileType === 'kids' ? 'Whitelist Kids' : 'Whitelist')
            : 'Blocklist';
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('tabindex', isUiLocked() ? '-1' : '0');
        if (isUiLocked()) {
            toggle.classList.add('is-disabled');
            toggle.setAttribute('aria-disabled', 'true');
        }
        const handleModeToggle = async () => {
                if (isUiLocked()) {
                    renderListModeControls();
                    return;
                }

                const nextState = currentMode !== 'whitelist';
                const enablingWhitelist = nextState === true;
                const disablingWhitelist = nextState !== true && currentMode === 'whitelist';
                const whitelistEmpty = (() => {
                    if (profileType === 'kids') {
                        return (modeState?.kids?.whitelistChannels?.length || 0) === 0 && (modeState?.kids?.whitelistKeywords?.length || 0) === 0;
                    }
                    return (modeState?.whitelistChannels?.length || 0) === 0 && (modeState?.whitelistKeywords?.length || 0) === 0;
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
                if (managedState) {
                    if (disablingWhitelist && !whitelistEmpty) {
                        const confirmMsg = profileType === 'kids'
                            ? 'Move your YT Kids whitelist back into blocklist? This will clear the YT Kids whitelist.'
                            : 'Move your whitelist back into blocklist? This will clear whitelist.';
                        const shouldTransfer = window.confirm(confirmMsg);
                        if (!shouldTransfer) {
                            renderListModeControls();
                            return;
                        }
                    }
                    const saved = await saveManagedChildSurface(profileType, async (target) => {
                        if (enablingWhitelist && copyBlocklist) {
                            if (profileType === 'kids') {
                                target.whitelistChannels = [...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : []), ...(Array.isArray(target.blockedChannels) ? target.blockedChannels : [])];
                                target.whitelistKeywords = [...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : []), ...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : [])];
                            } else {
                                target.whitelistChannels = [...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : []), ...(Array.isArray(target.channels) ? target.channels : [])];
                                target.whitelistKeywords = [...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : []), ...(Array.isArray(target.keywords) ? target.keywords : [])];
                            }
                        }
                        if (disablingWhitelist) {
                            if (profileType === 'kids') {
                                target.blockedChannels = [...(Array.isArray(target.blockedChannels) ? target.blockedChannels : []), ...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : [])];
                                target.blockedKeywords = [...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : []), ...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : [])];
                                target.whitelistChannels = [];
                                target.whitelistKeywords = [];
                            } else {
                                target.channels = [...(Array.isArray(target.channels) ? target.channels : []), ...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : [])];
                                target.keywords = [...(Array.isArray(target.keywords) ? target.keywords : []), ...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : [])];
                                target.whitelistChannels = [];
                                target.whitelistKeywords = [];
                            }
                        }
                        target.mode = nextState ? 'whitelist' : 'blocklist';
                        return true;
                    });
                    if (!saved) {
                        UIComponents.showToast('Failed to update list mode', 'error');
                    }
                    renderListModeControls();
                    return;
                }
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
        };
        toggle.addEventListener('click', handleModeToggle);
        toggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleModeToggle();
            }
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
        const baseState = StateManager.getState();
        const mainManagedState = window.__filtertubeIsManagedChildEditFor?.('main') === true
            ? (window.__filtertubeBuildManagedChildState?.('main') || null)
            : null;
        const kidsManagedState = window.__filtertubeIsManagedChildEditFor?.('kids') === true
            ? (window.__filtertubeBuildManagedChildState?.('kids') || null)
            : null;
        const locked = isUiLocked();

        allSettingCheckboxes.forEach(el => {
            const key = el.getAttribute('data-ft-setting');
            if (!key) return;
            const surfaceState = el.closest('#kidsView') ? (kidsManagedState || baseState) : (mainManagedState || baseState);
            el.checked = !!surfaceState[key];
            el.disabled = locked;
        });

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
        const mainState = window.__filtertubeIsManagedChildEditFor?.('main') === true
            ? (window.__filtertubeBuildManagedChildState?.('main') || state)
            : state;
        const kidsState = window.__filtertubeIsManagedChildEditFor?.('kids') === true
            ? (window.__filtertubeBuildManagedChildState?.('kids') || state)
            : state;
        const mainCounts = getDashboardCounts('main', mainState);
        const kidsCounts = getDashboardCounts('kids', kidsState);
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
        const baseState = StateManager.getState();

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
        const state = window.__filtertubeIsManagedChildEditFor?.(surface) === true
            ? (window.__filtertubeBuildManagedChildState?.(surface) || baseState)
            : baseState;
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

    if (ftDownloadRuleListTemplateBtn) {
        ftDownloadRuleListTemplateBtn.addEventListener('click', () => {
            downloadManagedRuleListCsvTemplate();
        });
    }

    if (ftDownloadRuleListJsonTemplateBtn) {
        ftDownloadRuleListJsonTemplateBtn.addEventListener('click', () => {
            downloadManagedRuleListJsonTemplate();
        });
    }

    if (ftImportRuleListBtn) {
        ftImportRuleListBtn.addEventListener('click', async () => {
            if (isUiLocked()) return;
            await importManagedRuleListToActiveProfileSurfaces(getSettingsRuleListImportSurfaces());
        });
    }

    if (ftRuleListFormatsBtn) {
        ftRuleListFormatsBtn.addEventListener('click', async () => {
            const action = await showChoiceModal({
                title: 'Supported Rule List Formats',
                message: 'Rule lists add channels and keywords only. Full FilterTube backups and legacy BlockTube export migration still belong under Choose JSON.',
                details: [
                    'CSV: channel_id,keyword,notes or type,value,notes.',
                    'Text: bare rows are channels; typed rows can use channel: @SomeChannel or keyword: brainrot.',
                    'Rule-list JSON: channels and keywords arrays.',
                    'BlockTube JSON: filterData channel/title arrays are supported here for previewed rule-list import too.',
                    'Public URLs: raw HTTPS CSV, text, or JSON files can be loaded into the preview.'
                ],
                choices: [
                    { value: 'csv-template', label: 'Download CSV Template', className: 'btn-primary' },
                    { value: 'json-template', label: 'Download JSON Template', className: 'btn-secondary' }
                ],
                cancelText: 'Close'
            });
            if (action === 'csv-template') downloadManagedRuleListCsvTemplate();
            if (action === 'json-template') downloadManagedRuleListJsonTemplate();
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

            const success = isManagedChildEditFor('main')
                ? await addManagedKeyword('main', word)
                : await StateManager.addKeyword(word);
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
                const result = isManagedChildEditFor('main')
                    ? await addManagedChannel('main', input)
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

    if (channelSourceFilter) {
        channelSourceFilter.addEventListener('change', (e) => {
            channelSourceFilterValue = normalizeString(e.target.value) || 'all';
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
            const success = isManagedChildEditFor('kids')
                ? await addManagedKeyword('kids', word)
                : await StateManager.addKidsKeyword(word);
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
            const result = isManagedChildEditFor('kids')
                ? await addManagedChannel('kids', input)
                : await StateManager.addKidsChannel(input);
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

    if (kidsChannelSourceFilter) {
        kidsChannelSourceFilter.addEventListener('change', (e) => {
            kidsChannelSourceFilterValue = normalizeString(e.target.value) || 'all';
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
            const surface = el.closest('#kidsView') ? 'kids' : 'main';
            if (window.__filtertubeIsManagedChildEditFor?.(surface) === true) {
                const saved = await window.__filtertubeSaveManagedChildSurface?.(surface, async (target, profile) => {
                    const settings = profile.settings && typeof profile.settings === 'object' && !Array.isArray(profile.settings)
                        ? profile.settings
                        : {};
                    profile.settings = {
                        ...settings,
                        [key]: !!el.checked
                    };
                    return true;
                });
                if (saved) {
                    UIComponents.showToast(surface === 'kids' ? 'Child Kids setting saved' : 'Child Main setting saved', 'success');
                }
                updateCheckboxes();
                return;
            }
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
            if (typeof window.__filtertubeRenderManagedChildEditorBanner === 'function') {
                window.__filtertubeRenderManagedChildEditorBanner();
            }
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
