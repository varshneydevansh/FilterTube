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
    const categoryOptions = window.FilterTubeContentControlsCatalog?.getCategoryOptions?.() || [];
    const languageOptions = window.FilterTubeContentControlsCatalog?.getLanguageOptions?.() || [];
    let feedRowsContainer = null;
    let feedGroupElement = null;

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
            feedGroupElement = groupEl;
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

    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'content-control-group category-filters-section popup-category-filters-section';
    categoryGroup.setAttribute('data-ft-control-group', 'true');
    categoryGroup.setAttribute('data-ft-group-title', 'Category Filters');
    categoryGroup.setAttribute('data-ft-group-id', 'category');
    applyControlGroupTheme(categoryGroup, '#E879F9');

    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'content-control-group__header';

    const categoryHeaderTitle = document.createElement('div');
    categoryHeaderTitle.className = 'content-control-group__title';
    categoryHeaderTitle.textContent = 'Category Filters';
    categoryHeader.appendChild(categoryHeaderTitle);
    categoryGroup.appendChild(categoryHeader);

    const categoryRows = document.createElement('div');
    categoryRows.className = 'content-control-group__rows';

    const categoryRow = document.createElement('div');
    categoryRow.className = 'toggle-row popup-category-row';
    categoryRow.setAttribute('data-ft-control-row', 'true');
    categoryRow.setAttribute('data-ft-search', 'category filter official youtube categories');

    const categoryInfo = document.createElement('div');
    categoryInfo.className = 'toggle-info';

    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'toggle-title';
    categoryTitle.textContent = 'Category Filter';

    const categoryDescription = document.createElement('div');
    categoryDescription.className = 'toggle-desc';
    categoryDescription.textContent = 'Uses official categories independently of Blocklist or Whitelist mode.';

    categoryInfo.appendChild(categoryTitle);
    categoryInfo.appendChild(categoryDescription);

    const categoryControls = document.createElement('div');
    categoryControls.className = 'ft-category-controls popup-category-controls';

    const categoryMode = document.createElement('select');
    categoryMode.id = 'popupCategoryFilter_mode';
    categoryMode.className = 'select-input';
    categoryMode.innerHTML = `
        <option value="block">Block selected</option>
        <option value="allow">Allow only selected</option>
    `;

    const categoryToggle = document.createElement('label');
    categoryToggle.className = 'switch';

    const categoryEnabled = document.createElement('input');
    categoryEnabled.type = 'checkbox';
    categoryEnabled.id = 'popupCategoryFilter_enabled';

    const categorySlider = document.createElement('span');
    categorySlider.className = 'slider round';

    categoryToggle.appendChild(categoryEnabled);
    categoryToggle.appendChild(categorySlider);
    categoryControls.appendChild(categoryMode);
    categoryControls.appendChild(categoryToggle);
    categoryRow.appendChild(categoryInfo);
    categoryRow.appendChild(categoryControls);
    categoryRows.appendChild(categoryRow);

    const categoryPanel = document.createElement('div');
    categoryPanel.className = 'ft-category-panel popup-category-panel';

    const categorySearch = document.createElement('input');
    categorySearch.type = 'text';
    categorySearch.id = 'popupCategoryFilter_search';
    categorySearch.className = 'text-input search-input ft-category-search';
    categorySearch.placeholder = 'Search categories...';
    categoryPanel.appendChild(categorySearch);

    const categorySelectionBar = document.createElement('div');
    categorySelectionBar.className = 'ft-category-selection-bar';

    const categorySelectionCount = document.createElement('span');
    categorySelectionCount.className = 'ft-category-selection-count';
    categorySelectionCount.setAttribute('aria-live', 'polite');

    const categoryClear = document.createElement('button');
    categoryClear.type = 'button';
    categoryClear.className = 'ft-category-clear';
    categoryClear.textContent = 'Clear';

    categorySelectionBar.appendChild(categorySelectionCount);
    categorySelectionBar.appendChild(categoryClear);
    categoryPanel.appendChild(categorySelectionBar);

    const categoryList = document.createElement('div');
    categoryList.id = 'popupCategoryFilter_list';
    categoryList.className = 'ft-category-options';
    categoryPanel.appendChild(categoryList);

    const categoryManage = document.createElement('button');
    categoryManage.type = 'button';
    categoryManage.className = 'video-filters-manage';
    categoryManage.textContent = 'Open full Category Filters';
    categoryPanel.appendChild(categoryManage);

    categoryRows.appendChild(categoryPanel);
    categoryGroup.appendChild(categoryRows);
    if (feedGroupElement) {
        contentTab.insertBefore(categoryGroup, feedGroupElement);
    } else {
        contentTab.appendChild(categoryGroup);
    }

    let popupCategorySelected = [];
    let popupCategoryProfileType = 'main';
    let isApplyingPopupCategory = false;
    let popupCategorySaveTimer = 0;

    function normalizePopupCategorySelection(values) {
        const seen = new Set();
        return (Array.isArray(values) ? values : []).map(value => String(value || '').trim()).filter(value => {
            const key = value.toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function updatePopupCategorySummary() {
        const count = popupCategorySelected.length;
        const mode = categoryMode.value === 'allow' ? 'Allowed' : 'Blocked';
        categorySelectionCount.textContent = count === 0
            ? 'No categories selected — filter is inactive'
            : `${mode}: ${popupCategorySelected.join(', ')}`;
        categoryClear.disabled = count === 0;
        categoryMode.disabled = !categoryEnabled.checked;
        categoryPanel.style.display = categoryEnabled.checked ? 'block' : 'none';
    }

    function renderPopupCategoryList() {
        const needle = categorySearch.value.trim().toLowerCase();
        const selectedKeys = new Set(popupCategorySelected.map(value => value.toLowerCase()));
        categoryList.innerHTML = '';

        categoryOptions.filter(option => !needle || option.label.toLowerCase().includes(needle)).forEach(option => {
            const active = selectedKeys.has(option.label.toLowerCase());
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'ft-category-pill';
            pill.classList.toggle('active', active);
            pill.setAttribute('aria-pressed', active ? 'true' : 'false');
            pill.setAttribute('aria-label', `${option.label}, ${active ? 'selected' : 'not selected'}`);
            pill.style.setProperty('--ft-category-color', option.color);
            pill.style.setProperty('--ft-category-color-bg', hexToRgba(option.color, 0.10));
            pill.style.setProperty('--ft-category-color-border', hexToRgba(option.color, 0.45));
            pill.style.setProperty('--ft-category-color-bg-active', hexToRgba(option.color, 0.18));

            const swatch = document.createElement('span');
            swatch.className = 'ft-category-swatch';
            const label = document.createElement('span');
            label.className = 'ft-category-label';
            label.textContent = option.label;
            const selectionMark = document.createElement('span');
            selectionMark.className = 'ft-category-selection-mark';
            selectionMark.setAttribute('aria-hidden', 'true');
            selectionMark.textContent = '✓';
            pill.appendChild(swatch);
            pill.appendChild(label);
            pill.appendChild(selectionMark);

            pill.addEventListener('click', () => {
                const key = option.label.toLowerCase();
                const nextKeys = new Set(popupCategorySelected.map(value => value.toLowerCase()));
                if (nextKeys.has(key)) {
                    popupCategorySelected = popupCategorySelected.filter(value => value.toLowerCase() !== key);
                } else {
                    popupCategorySelected = [...popupCategorySelected, option.label];
                }
                renderPopupCategoryList();
                updatePopupCategorySummary();
                schedulePopupCategorySave();
            });
            categoryList.appendChild(pill);
        });
    }

    function applyPopupCategoryFilters(categoryFilters = {}, profileType = 'main') {
        isApplyingPopupCategory = true;
        popupCategoryProfileType = profileType === 'kids' ? 'kids' : 'main';
        categoryEnabled.checked = !!categoryFilters.enabled;
        categoryMode.value = categoryFilters.mode === 'allow' ? 'allow' : 'block';
        popupCategorySelected = normalizePopupCategorySelection(categoryFilters.selected || []);
        renderPopupCategoryList();
        updatePopupCategorySummary();
        isApplyingPopupCategory = false;
    }

    function savePopupCategoryFilters() {
        if (isApplyingPopupCategory) return;
        const next = {
            enabled: categoryEnabled.checked,
            mode: categoryMode.value === 'allow' ? 'allow' : 'block',
            selected: normalizePopupCategorySelection(popupCategorySelected)
        };
        return popupCategoryProfileType === 'kids'
            ? StateManager.updateKidsCategoryFilters(next)
            : StateManager.updateCategoryFilters(next);
    }

    function schedulePopupCategorySave() {
        if (isApplyingPopupCategory) return;
        if (popupCategorySaveTimer) clearTimeout(popupCategorySaveTimer);
        popupCategorySaveTimer = setTimeout(() => {
            popupCategorySaveTimer = 0;
            savePopupCategoryFilters();
        }, 180);
    }

    const languageGroup = document.createElement('div');
    languageGroup.className = 'content-control-group category-filters-section popup-category-filters-section popup-language-filters-section';
    languageGroup.setAttribute('data-ft-control-group', 'true');
    languageGroup.setAttribute('data-ft-group-title', 'Language Filters');
    languageGroup.innerHTML = `
        <div class="content-control-group__header"><div class="content-control-group__title">Language Filters <span class="ft-experimental-badge">Experimental</span></div></div>
        <div class="content-control-group__rows">
            <div class="toggle-row popup-category-row">
                <div class="toggle-info"><div class="toggle-title">Spoken Language</div><div class="toggle-desc">Uses original/default audio evidence; auto-dubbed alternatives do not change the source language.</div></div>
                <div class="ft-category-controls popup-category-controls"><select id="popupLanguageFilter_mode" class="select-input"><option value="block">Block selected</option><option value="allow">Allow only selected</option></select><label class="switch"><input id="popupLanguageFilter_enabled" type="checkbox"><span class="slider round"></span></label></div>
            </div>
            <div id="popupLanguageFilter_panel" class="language-filter-picker popup-language-filter-picker" style="display: none;">
                <input id="popupLanguageFilter_search" type="text" class="text-input search-input ft-category-search" placeholder="Search languages...">
                <div class="ft-category-selection-bar"><span id="popupLanguageFilter_count" class="ft-category-selection-count" aria-live="polite"></span><button id="popupLanguageFilter_clear" type="button" class="ft-category-clear">Clear</button></div>
                <div id="popupLanguageFilter_list" class="ft-category-options"></div>
                <button id="popupLanguageFilter_manage" type="button" class="video-filters-manage">Open full Language Filters</button>
            </div>
        </div>`;
    // Keep the experimental language picker at the end of Content Controls.
    contentTab.appendChild(languageGroup);

    const languageEnabled = languageGroup.querySelector('#popupLanguageFilter_enabled');
    const languageMode = languageGroup.querySelector('#popupLanguageFilter_mode');
    const languagePanel = languageGroup.querySelector('#popupLanguageFilter_panel');
    const languageSearch = languageGroup.querySelector('#popupLanguageFilter_search');
    const languageList = languageGroup.querySelector('#popupLanguageFilter_list');
    const languageCount = languageGroup.querySelector('#popupLanguageFilter_count');
    const languageClear = languageGroup.querySelector('#popupLanguageFilter_clear');
    let popupLanguageSelected = [];
    let isApplyingPopupLanguage = false;
    let popupLanguageSaveTimer = 0;
    const normalizePopupLanguageSelection = values => normalizePopupCategorySelection(values)
        .map(value => value.toLowerCase().replace(/_/g, '-').split('-')[0]);

    function updatePopupLanguageSummary() {
        const modeLabel = languageMode.value === 'allow' ? 'Allowed' : 'Blocked';
        languageCount.textContent = popupLanguageSelected.length
            ? `${modeLabel}: ${popupLanguageSelected.map(code => languageOptions.find(option => option.code === code)?.label || code.toUpperCase()).join(', ')}`
            : 'No languages selected — filter is inactive';
        languageClear.disabled = popupLanguageSelected.length === 0;
        languageMode.disabled = !languageEnabled.checked;
        languagePanel.style.display = languageEnabled.checked ? 'block' : 'none';
        languageGroup.setAttribute('data-filtertube-filter-enabled', languageEnabled.checked ? 'true' : 'false');
    }

    function renderPopupLanguageList() {
        const needle = languageSearch.value.trim().toLowerCase();
        const selected = new Set(popupLanguageSelected);
        languageList.innerHTML = '';
        languageOptions.filter(option => !needle || option.label.toLowerCase().includes(needle) || option.code.includes(needle)).forEach(option => {
            const active = selected.has(option.code);
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `ft-category-pill${active ? ' active' : ''}`;
            pill.setAttribute('aria-pressed', active ? 'true' : 'false');
            pill.style.setProperty('--ft-category-color', option.color || '#3b82f6');
            const swatch = document.createElement('span');
            swatch.className = 'ft-category-swatch';
            const label = document.createElement('span');
            label.className = 'ft-category-label';
            label.textContent = `${option.label} · ${option.code.toUpperCase()}`;
            const mark = document.createElement('span');
            mark.className = 'ft-category-selection-mark';
            mark.textContent = '✓';
            pill.append(swatch, label, mark);
            pill.addEventListener('click', () => {
                popupLanguageSelected = active ? popupLanguageSelected.filter(code => code !== option.code) : [...popupLanguageSelected, option.code];
                renderPopupLanguageList();
                updatePopupLanguageSummary();
                schedulePopupLanguageSave();
            });
            languageList.appendChild(pill);
        });
    }

    function applyPopupLanguageFilters(filters = {}, profileType = 'main') {
        languageGroup.style.display = profileType === 'kids' ? 'none' : '';
        if (profileType === 'kids') return;
        isApplyingPopupLanguage = true;
        languageEnabled.checked = filters.enabled === true;
        languageMode.value = filters.mode === 'allow' ? 'allow' : 'block';
        popupLanguageSelected = normalizePopupLanguageSelection(filters.selected || []);
        renderPopupLanguageList();
        updatePopupLanguageSummary();
        isApplyingPopupLanguage = false;
    }

    function schedulePopupLanguageSave() {
        if (isApplyingPopupLanguage) return;
        if (popupLanguageSaveTimer) clearTimeout(popupLanguageSaveTimer);
        popupLanguageSaveTimer = setTimeout(() => {
            popupLanguageSaveTimer = 0;
            StateManager.updateLanguageFilters({
                enabled: languageEnabled.checked,
                mode: languageMode.value === 'allow' ? 'allow' : 'block',
                selected: normalizePopupLanguageSelection(popupLanguageSelected)
            });
        }, 180);
    }

    languageEnabled.addEventListener('change', () => { updatePopupLanguageSummary(); schedulePopupLanguageSave(); });
    languageMode.addEventListener('change', () => { updatePopupLanguageSummary(); schedulePopupLanguageSave(); });
    languageSearch.addEventListener('input', renderPopupLanguageList);
    languageClear.addEventListener('click', () => { popupLanguageSelected = []; renderPopupLanguageList(); updatePopupLanguageSummary(); schedulePopupLanguageSave(); });
    languageGroup.querySelector('#popupLanguageFilter_manage')?.addEventListener('click', () => {
        const api = typeof chrome !== 'undefined' ? chrome : browser;
        const url = api.runtime.getURL('html/tab-view.html?view=filters&section=languages');
        if (api.tabs?.create) api.tabs.create({ url });
        else window.open(url, '_blank', 'noopener,noreferrer');
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
                applyPopupCategoryFilters(state?.kids?.categoryFilters || {}, 'kids');
                applyPopupLanguageFilters({}, 'kids');
            } else {
                applyPopupContentFilters(state?.contentFilters || {});
                applyPopupCategoryFilters(state?.categoryFilters || {}, 'main');
                applyPopupLanguageFilters(state?.languageFilters || {}, 'main');
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

        categoryEnabled.addEventListener('change', () => {
            updatePopupCategorySummary();
            schedulePopupCategorySave();
        });
        categoryMode.addEventListener('change', () => {
            updatePopupCategorySummary();
            schedulePopupCategorySave();
        });
        categorySearch.addEventListener('input', renderPopupCategoryList);
        categoryClear.addEventListener('click', () => {
            popupCategorySelected = [];
            renderPopupCategoryList();
            updatePopupCategorySummary();
            schedulePopupCategorySave();
        });

        categoryManage.addEventListener('click', () => {
            const runtimeApi = (typeof chrome !== 'undefined' && chrome.runtime)
                ? chrome
                : ((typeof browser !== 'undefined' && browser.runtime) ? browser : null);
            const tabsApi = (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function')
                ? chrome.tabs
                : ((typeof browser !== 'undefined' && browser.tabs && typeof browser.tabs.create === 'function') ? browser.tabs : null);
            const relativeUrl = popupCategoryProfileType === 'kids'
                ? 'html/tab-view.html?view=kids&section=content'
                : 'html/tab-view.html?view=filters&section=categories';
            const url = runtimeApi?.runtime?.getURL ? runtimeApi.runtime.getURL(relativeUrl) : relativeUrl;
            if (tabsApi?.create) {
                tabsApi.create({ url });
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });

        manageInTab.addEventListener('click', () => {
            try {
                resolveProfileTypeFromTabs().then((profileType) => {
                    const isKids = profileType === 'kids';
                    const runtimeApi = (typeof chrome !== 'undefined' && chrome.runtime)
                        ? chrome
                        : ((typeof browser !== 'undefined' && browser.runtime) ? browser : null);
                    const tabsApi = (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function')
                        ? chrome.tabs
                        : ((typeof browser !== 'undefined' && browser.tabs && typeof browser.tabs.create === 'function') ? browser.tabs : null);
                    const url = runtimeApi?.runtime?.getURL
                        ? (isKids
                            ? runtimeApi.runtime.getURL('html/tab-view.html?view=kids&section=content')
                            : runtimeApi.runtime.getURL('html/tab-view.html?view=filters&section=categories'))
                        : (isKids
                            ? 'html/tab-view.html?view=kids&section=content'
                            : 'html/tab-view.html?view=filters&section=categories');
                    if (tabsApi?.create) {
                        const maybePromise = tabsApi.create({ url });
                        if (maybePromise && typeof maybePromise.catch === 'function') {
                            maybePromise.catch(() => {
                                window.open(url, '_blank', 'noopener,noreferrer');
                            });
                        }
                    } else {
                        window.open(url, '_blank', 'noopener,noreferrer');
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
        if (eventType === 'categoryFiltersUpdated' || eventType === 'kidsCategoryFiltersUpdated') {
            applyPopupVideoFiltersForActiveProfile();
        }
        if (eventType === 'languageFiltersUpdated') {
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
    try {
        window.FilterTubeIsUiLocked = () => true;
    } catch (e) {
    }

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
        const allowedKidsGroups = new Set(['category', 'feed']);
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
    const ftManagedTimeStatusPopup = document.getElementById('ftManagedTimeStatusPopup');
    const ftManagedTimeStatusValuePopup = document.getElementById('ftManagedTimeStatusValuePopup');

    let profilesV4Cache = null;
    let isHandlingProfileSwitch = false;
    let popupSelfControlSessionState = null;
    let popupActiveProfileType = 'main';
    const unlockedProfiles = new Set();

    async function sendRuntimeMessage(payload) {
        return new Promise((resolve) => {
            try {
                const runtimeApi = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function')
                    ? chrome
                    : ((typeof browser !== 'undefined' && browser.runtime && typeof browser.runtime.sendMessage === 'function') ? browser : null);
                if (!runtimeApi?.runtime?.sendMessage) {
                    resolve(null);
                    return;
                }

                const maybePromise = runtimeApi.runtime.sendMessage(payload, (resp) => {
                    const err = runtimeApi.runtime?.lastError;
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

    function formatPopupManagedTimeRemaining(seconds) {
        const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
        if (safeSeconds <= 0) return 'Limit reached';
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const remainder = safeSeconds % 60;
        if (hours > 0) return `${hours}h ${minutes}m left`;
        if (minutes > 0) return `${minutes}m ${remainder}s left`;
        return `${remainder}s left`;
    }

    async function refreshPopupManagedTimeStatus() {
        if (!ftManagedTimeStatusPopup || !ftManagedTimeStatusValuePopup) return;
        const selfControlWasActive = popupSelfControlSessionState?.active === true;
        const selfControl = await sendRuntimeMessage({ action: 'FilterTube_GetSelfControlSession' });
        popupSelfControlSessionState = selfControl?.ok && selfControl?.active ? selfControl : null;
        if ((popupSelfControlSessionState?.active === true) !== selfControlWasActive && profilesV4Cache) {
            renderProfileSelector(profilesV4Cache);
        }
        const statusLabel = ftManagedTimeStatusPopup.querySelector('.ft-popup-time-status__label');
        if (popupSelfControlSessionState) {
            const remaining = formatPopupManagedTimeRemaining(popupSelfControlSessionState.remainingSeconds)
                .replace(' left', '');
            const hardWhitelist = popupSelfControlSessionState.sessionKind === 'hard_whitelist';
            ftManagedTimeStatusPopup.hidden = false;
            ftManagedTimeStatusPopup.classList.remove('is-exhausted');
            ftManagedTimeStatusPopup.classList.add('is-self-control');
            if (statusLabel) statusLabel.textContent = hardWhitelist ? 'Hard whitelist' : 'Strict session';
            ftManagedTimeStatusValuePopup.textContent = remaining;
            ftManagedTimeStatusPopup.title = hardWhitelist
                ? `${popupSelfControlSessionState.profileName || 'Active profile'} allows ${Number(popupSelfControlSessionState.allowedChannelCount) || 0} Main channel${Number(popupSelfControlSessionState.allowedChannelCount) === 1 ? '' : 's'} until the session ends`
                : `${popupSelfControlSessionState.profileName || 'Active profile'} is pinned until the session ends`;
            applyLockGateIfNeeded();
            return;
        }
        if (selfControlWasActive && lockGateEl) {
            try { lockGateEl.remove(); } catch (e) { }
            lockGateEl = null;
            applyLockGateIfNeeded();
        }
        ftManagedTimeStatusPopup.classList.remove('is-self-control');
        if (statusLabel) statusLabel.textContent = 'YouTube time';
        const response = await sendRuntimeMessage({
            action: 'FilterTube_GetManagedTimeLimitState',
            profileType: popupActiveProfileType === 'kids' ? 'kids' : 'main'
        });
        if (!response?.ok || response?.enforced !== true) {
            ftManagedTimeStatusPopup.hidden = true;
            ftManagedTimeStatusPopup.classList.remove('is-exhausted');
            ftManagedTimeStatusValuePopup.textContent = '';
            return;
        }
        const timedOut = response.timedOut === true || Number(response.remainingSeconds) <= 0;
        ftManagedTimeStatusPopup.hidden = false;
        ftManagedTimeStatusPopup.classList.toggle('is-exhausted', timedOut);
        ftManagedTimeStatusValuePopup.textContent = formatPopupManagedTimeRemaining(response.remainingSeconds);
        ftManagedTimeStatusPopup.title = `${response.profileName || 'Active profile'} · ${ftManagedTimeStatusValuePopup.textContent}`;
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

        const toggle = document.createElement('div');
        toggle.className = [
            'exact-toggle',
            'active',
            'ft-list-mode-pill',
            effectiveMode === 'blocklist' ? 'toggle-variant-red' : ''
        ].filter(Boolean).join(' ');
        toggle.textContent = effectiveMode === 'whitelist' ? 'Whitelist' : 'Blocklist';
        toggle.title = effectiveMode === 'whitelist'
            ? 'Whitelist mode: show content matching Allowed rules'
            : 'Blocklist mode: hide content matching Blocked rules';
        toggle.setAttribute('aria-label', toggle.title);
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('tabindex', isUiLocked() ? '-1' : '0');
        if (isUiLocked()) {
            toggle.classList.add('is-disabled');
            toggle.setAttribute('aria-disabled', 'true');
        } else {
            toggle.classList.remove('is-disabled');
            toggle.setAttribute('aria-disabled', 'false');
        }
        const handleModeToggle = async () => {
                if (isUiLocked()) {
                    renderListModeControls();
                    return;
                }

                const profileType = await resolveProfileTypeFromTabs();
                const currentMode = profileType === 'kids'
                    ? (state?.kids?.mode === 'whitelist' ? 'whitelist' : 'blocklist')
                    : (state?.mode === 'whitelist' ? 'whitelist' : 'blocklist');
                const nextState = currentMode !== 'whitelist';

                const whitelistEmpty = profileType === 'kids'
                    ? ((state?.kids?.whitelistChannels?.length || 0) === 0 && (state?.kids?.whitelistKeywords?.length || 0) === 0)
                    : ((state?.whitelistChannels?.length || 0) === 0 && (state?.whitelistKeywords?.length || 0) === 0);
                const blocklistHasRules = profileType === 'kids'
                    ? ((state?.kids?.blockedChannels?.length || 0) > 0 || (state?.kids?.blockedKeywords?.length || 0) > 0)
                    : ((state?.channels?.length || 0) > 0 || (state?.keywords?.length || 0) > 0);
                let copyBlocklist = false;
                if (nextState && whitelistEmpty && blocklistHasRules) {
                    copyBlocklist = window.confirm(profileType === 'kids'
                        ? 'Copy your current YT Kids blocked rules into Allowed rules? Your blocked rules will be kept.'
                        : 'Copy your current blocked rules into Allowed rules? Your blocked rules will be kept.');
                    if (!copyBlocklist) {
                        UIComponents.showToast(profileType === 'kids'
                            ? 'YT Kids Allowed rules are empty — videos will stay hidden until you add allow rules.'
                            : 'Allowed rules are empty — videos will stay hidden until you add allow rules.', 'info');
                    }
                } else if (nextState && whitelistEmpty) {
                    UIComponents.showToast(profileType === 'kids'
                        ? 'YT Kids Allowed rules are empty — videos will stay hidden until you add allow rules.'
                        : 'Allowed rules are empty — videos will stay hidden until you add allow rules.', 'info');
                }

                const resp = await sendRuntimeMessage({
                    action: 'FilterTube_SetListMode',
                    profileType,
                    mode: nextState ? 'whitelist' : 'blocklist',
                    copyBlocklist
                });

                if (!resp || resp.ok !== true) {
                    UIComponents.showToast('Failed to update list mode', 'error');
                    renderListModeControls();
                    return;
                }

                if (resp.copiedBlocklist) {
                    const copiedCount = (Number(resp.copiedChannels) || 0) + (Number(resp.copiedKeywords) || 0);
                    UIComponents.showToast(`Copied ${copiedCount} blocked ${copiedCount === 1 ? 'rule' : 'rules'} into Allowed rules. Blocked rules were kept.`, 'success');
                }

                await StateManager.loadSettings();
                renderKeywords();
                renderChannels();
                updateCheckboxes();
                renderListModeControls();
        };
        toggle.addEventListener('click', handleModeToggle);
        toggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleModeToggle();
            }
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
                updateSubscriptionsShortcut();
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

    function updateSubscriptionsShortcut() {
        return;
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
            eyebrow: 'Protected profile',
            title: `Unlock ${name}`,
            message: `${name} is a locked protected profile. Enter its profile PIN to continue.`,
            placeholder: 'Profile PIN',
            gateTitle: 'Protected Profile',
            gateMessage: `Unlock ${name} to view management controls.`
        };
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
            return popupSelfControlSessionState?.active === true || getProfileType(profilesV4, activeProfileId) === 'child' ||
                !!(profilesV4 && isProfileLocked(profilesV4, activeProfileId) && !unlockedProfiles.has(activeProfileId));
        } catch (e) {
        }
        return false;
    }

    function applyLockGateIfNeeded() {
        const profilesV4 = profilesV4Cache;
        const activeProfileId = normalizeString(profilesV4?.activeProfileId) || 'default';
        const selfControlLocked = popupSelfControlSessionState?.active === true;
        const isLocked = selfControlLocked || (profilesV4 && (
            getProfileType(profilesV4, activeProfileId) === 'child' ||
            (isProfileLocked(profilesV4, activeProfileId) && !unlockedProfiles.has(activeProfileId))
        ));

        document.body.classList.toggle('ft-popup-locked', !!isLocked);
        try {
            window.FilterTubeIsUiLocked = () => isUiLocked();
        } catch (e) {
        }

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
        const copy = getProfileAccessCopy(profilesV4, activeProfileId);
        const activeIsChild = getProfileType(profilesV4, activeProfileId) === 'child';
        const h3 = document.createElement('h3');
        h3.textContent = selfControlLocked ? 'Self-Control Session Active' : (activeIsChild ? 'Managed Protected Profile' : copy.gateTitle);
        cardHeader.appendChild(h3);

        const body = document.createElement('div');
        body.className = 'card-body';
        const hint = document.createElement('div');
        hint.className = 'import-export-hint';
        hint.textContent = selfControlLocked
            ? `This profile and its filters are pinned. ${formatPopupManagedTimeRemaining(popupSelfControlSessionState.remainingSeconds)}.`
            : activeIsChild
            ? 'This protected profile can use its own viewing rules, but FilterTube settings and rule editing stay parent-managed. Switch to the parent profile to make changes.'
            : copy.gateMessage;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        actions.style.flexWrap = 'wrap';
        actions.style.marginTop = '12px';

        body.appendChild(hint);
        if (!selfControlLocked) {
            const unlockBtn = document.createElement('button');
            unlockBtn.className = 'btn-primary';
            unlockBtn.type = 'button';
            unlockBtn.textContent = activeIsChild ? 'Switch Profile' : 'Unlock';
            unlockBtn.addEventListener('click', async () => {
                if (activeIsChild) {
                    toggleProfileDropdown();
                    return;
                }
                try {
                    const ok = await ensureProfileUnlocked(profilesV4Cache, activeProfileId);
                    if (!ok) return;
                    await refreshProfilesUI();
                    UIComponents.showToast('Unlocked', 'success');
                } catch (e) {
                    UIComponents.showToast('Failed to unlock', 'error');
                }
            });
            actions.appendChild(unlockBtn);
        }
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
            btn.disabled = popupSelfControlSessionState?.active === true;
            btn.title = btn.disabled ? 'Profile switching is locked until the Self-Control Session ends' : '';
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
            renderListModeControls();
            updateSubscriptionsShortcut();
        } catch (e) {
        }
    }

    async function switchToProfile(nextProfileId) {
        if (isHandlingProfileSwitch) return;
        if (popupSelfControlSessionState?.active === true) {
            UIComponents.showToast('Profile switching is locked until the Self-Control Session ends', 'error');
            return;
        }
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
    await refreshPopupManagedTimeStatus();
    setInterval(() => {
        refreshPopupManagedTimeStatus().catch(() => {});
    }, 1000);

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

        if (['channelAdded', 'channelRemoved', 'load', 'save'].includes(eventType)) {
            renderChannels();
        }

        if (eventType === 'channelUpdated') {
            const patchedVisibleChannel = popupActiveProfileType !== 'kids'
                && RenderEngine?.patchChannelListItem?.(channelListEl, data) === true;
            if (!patchedVisibleChannel && popupActiveProfileType !== 'kids') {
                renderChannels();
            }
        }

        if (eventType === 'kidsChannelUpdated' && popupActiveProfileType === 'kids') {
            const patchedVisibleKidsChannel = RenderEngine?.patchChannelListItem?.(channelListEl, data) === true;
            if (!patchedVisibleKidsChannel) renderChannels();
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

    function getPopupRuleTarget() {
        return StateManager.getState()?.mode === 'whitelist' ? 'allow' : 'block';
    }

    function buildPopupMainRuleTargetState(target) {
        return {
            ...StateManager.getState(),
            mode: target === 'allow' ? 'whitelist' : 'blocklist'
        };
    }

    function renderKeywords() {
        if (!keywordList) return;
        const targetList = getPopupRuleTarget();
        RenderEngine.renderKeywordList(keywordList, {
            minimal: true,
            showSearch: true,
            showSort: false,
            searchValue: keywordSearchValue,
            sortValue: 'newest',
            profile: popupActiveProfileType === 'kids' ? 'kids' : 'main',
            stateOverride: popupActiveProfileType === 'kids'
                ? null
                : buildPopupMainRuleTargetState(targetList),
            onDelete: popupActiveProfileType === 'kids'
                ? null
                : (entry) => StateManager.removeKeyword(entry.word, { targetList }),
            onToggleExact: popupActiveProfileType === 'kids'
                ? null
                : (entry) => StateManager.toggleKeywordExact(entry.word, { targetList }),
            onToggleComments: popupActiveProfileType === 'kids'
                ? null
                : (entry) => StateManager.toggleKeywordComments(entry.word, { targetList })
        });
    }

    function renderChannels() {
        if (!channelListEl) return;
        const targetList = getPopupRuleTarget();
        RenderEngine.renderChannelList(channelListEl, {
            minimal: true,
            showSearch: true,
            showSort: false,
            showNodeMapping: false,
            searchValue: channelSearchValue,
            sortValue: 'newest',
            profile: popupActiveProfileType === 'kids' ? 'kids' : 'main',
            stateOverride: popupActiveProfileType === 'kids'
                ? null
                : buildPopupMainRuleTargetState(targetList),
            onDelete: popupActiveProfileType === 'kids'
                ? null
                : (channel, index) => StateManager.removeChannel(index, { targetList })
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

        if (toggleEnabledBrandBtn) {
            const enabled = state.enabled !== false;
            const activeProfileName = getProfileName(profilesV4Cache, normalizeString(profilesV4Cache?.activeProfileId) || 'default');
            toggleEnabledBrandBtn.classList.toggle('ft-enabled', enabled);
            toggleEnabledBrandBtn.classList.toggle('ft-disabled', !enabled);
            toggleEnabledBrandBtn.classList.toggle('is-locked', locked);
            toggleEnabledBrandBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
            toggleEnabledBrandBtn.setAttribute('aria-disabled', locked ? 'true' : 'false');
            toggleEnabledBrandBtn.tabIndex = locked ? -1 : 0;
            toggleEnabledBrandBtn.title = locked
                ? `Unlock ${activeProfileName} to change filtering state.`
                : (enabled ? 'Filtering Active (click to pause)' : 'Filtering Paused (click to enable)');

            const statusText = document.getElementById('extensionStatusText');
            if (statusText) {
                statusText.textContent = enabled ? 'Enabled' : 'Disabled';
                statusText.classList.toggle('disabled', !enabled);
            }
        }

        updateSubscriptionsShortcut();
    }

    // Initial render
    renderKeywords();
    renderChannels();
    updateCheckboxes();
    renderListModeControls();
    filterContentControlsPopup();
    await refreshProfilesUI();
    updateSubscriptionsShortcut();

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
                : await StateManager.addKeyword(word, {
                    targetList: getPopupRuleTarget()
                });
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
                    : await StateManager.addChannel(input, {
                        targetList: getPopupRuleTarget()
                    });

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
            const runtimeApi = (typeof chrome !== 'undefined' && chrome.runtime)
                ? chrome
                : ((typeof browser !== 'undefined' && browser.runtime) ? browser : null);
            const tabsApi = (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function')
                ? chrome.tabs
                : ((typeof browser !== 'undefined' && browser.tabs && typeof browser.tabs.create === 'function') ? browser.tabs : null);
            const url = runtimeApi?.runtime?.getURL ? runtimeApi.runtime.getURL('html/tab-view.html') : 'html/tab-view.html';
            if (tabsApi && typeof tabsApi.create === 'function') {
                try {
                    const maybePromise = tabsApi.create({ url });
                    if (maybePromise && typeof maybePromise.catch === 'function') {
                        maybePromise.catch(() => {
                            window.open(url, '_blank', 'noopener,noreferrer');
                        });
                    }
                } catch (e) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    }

    if (toggleEnabledBrandBtn) {
        const handleToggle = async () => {
            if (isUiLocked()) {
                updateCheckboxes();
                UIComponents.showToast('Unlock profile to change filtering state', 'error');
                return;
            }
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
