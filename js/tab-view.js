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
        'donate': 'donate',
        'support': 'donate'
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
    try {
        const searchParams = new URLSearchParams(window.location.search || '');
        const section = (searchParams.get('section') || '').toLowerCase();
        if (viewId === 'filters' && section) {
            try {
                const tabs = document.querySelector('#filtersView .tab-buttons') || document.querySelector('.tab-buttons');
                const contentTabBtn = tabs?.querySelector('[data-tab-id="content"]');
                if (contentTabBtn) {
                    contentTabBtn.click();
                }
            } catch (e) {
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

    function downloadJsonToDownloadsFolder(folder, filename, obj) {
        return new Promise((resolve, reject) => {
            try {
                const json = JSON.stringify(obj, null, 2);
                const blob = new Blob([json], { type: 'application/json' });

                // If downloads API unavailable, use anchor fallback immediately
                if (!runtimeAPI?.downloads?.download) {
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
            await scheduleAutoBackup('setting_updated');
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

        // If syncing Kids → Main, include ALL kids channels (both blocked and whitelist)
        if (state?.syncKidsToMain) {
            const kidsBlocked = Array.isArray(state?.kids?.blockedChannels) ? state.kids.blockedChannels : [];
            const kidsWhitelist = Array.isArray(state?.kids?.whitelistChannels) ? state.kids.whitelistChannels : [];
            const allKidsChannels = [...kidsBlocked, ...kidsWhitelist];
            const keyFor = (ch) => {
                const id = typeof ch?.id === 'string' ? ch.id.trim().toLowerCase() : '';
                const handle = typeof ch?.handle === 'string' ? ch.handle.trim().toLowerCase() : '';
                return id || handle;
            };
            const seen = new Set(channels.map(keyFor).filter(Boolean));
            allKidsChannels.forEach(ch => {
                const k = keyFor(ch);
                if (!k || seen.has(k)) return;
                seen.add(k);
                channels.push(ch);
            });

            // Also include ALL kids keywords (both blocked and whitelist)
            const kidsBlockedKeywords = Array.isArray(state?.kids?.blockedKeywords) ? state.kids.blockedKeywords : [];
            const kidsWhitelistKeywords = Array.isArray(state?.kids?.whitelistKeywords) ? state.kids.whitelistKeywords : [];
            const allKidsKeywords = [...kidsBlockedKeywords, ...kidsWhitelistKeywords];
            const keywordSeen = new Set(keywords.map(k => {
                const word = typeof k === 'object' ? k.word : String(k);
                return word.toLowerCase();
            }));
            allKidsKeywords.forEach(k => {
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
            'donate': 'Donate',
            'support': 'Donate'
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
