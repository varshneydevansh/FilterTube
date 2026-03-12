// js/content/menu.js - Isolated World
//
// Menu UI utilities used by `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.

// ============================================================================
// HTML HELPERS
// ============================================================================

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================================
// MENU STYLES
// ============================================================================

let filterTubeMenuStylesInjected = false;

function ensureFilterTubeMenuStyles() {
    if (filterTubeMenuStylesInjected) {
        return;
    }

    const styleContent = `
    ytd-menu-popup-renderer,
    tp-yt-iron-dropdown ytd-menu-popup-renderer {
        max-height: 80vh !important;
    }

    tp-yt-paper-listbox,
    #items.ytd-menu-popup-renderer {
        max-height: none !important;
        overflow-y: auto !important;
    }

    .filtertube-menu-item {
        display: flex !important;
        align-items: flex-start !important;
        gap: 10px !important;
        min-height: 36px !important;
        padding: 8px 12px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        background: transparent !important;
    }

    tp-yt-paper-item.filtertube-menu-item,
    tp-yt-paper-item.filtertube-menu-item[focused],
    tp-yt-paper-item.filtertube-menu-item[active],
    tp-yt-paper-item.filtertube-menu-item:focus,
    .filtertube-menu-item.yt-list-item-view-model__container--active,
    .filtertube-menu-item:focus-visible {
        background: transparent !important;
    }

    .filtertube-collab-placeholder .filtertube-channel-name {
        font-style: italic !important;
        color: rgba(226, 232, 240, 0.7) !important;
    }

    tp-yt-paper-item.filtertube-menu-item::before,
    tp-yt-paper-item.filtertube-menu-item::after,
    .filtertube-menu-item::before,
    .filtertube-menu-item::after {
        background: transparent !important;
    }

    .filtertube-menu-title-wrapper {
        display: flex !important;
        align-items: flex-start !important;
        justify-content: space-between !important;
        width: 100% !important;
    }

    .filtertube-menu-title {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        max-width: calc(100% - 85px) !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        padding-right: 12px !important;
    }

    .filtertube-menu-label {
        color: #f87171 !important;
        font-weight: 600 !important;
    }

    .filtertube-menu-separator {
        color: #f87171 !important;
        opacity: 0.6 !important;
        margin: 0 4px !important;
    }

    .filtertube-channel-name {
        font-weight: 500 !important;
        color: #fef3c7 !important;
    }

    .filtertube-filter-all-toggle {
        margin-left: auto !important;
        align-self: flex-start !important;
        margin-top: 2px !important;
        white-space: nowrap !important;
        user-select: none !important;
    }

    .filtertube-filter-all-toggle.exact-toggle {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
        padding: 4px 12px !important;
        border-radius: 999px !important;
        border: 1px solid rgba(148, 163, 184, 0.7) !important;
        background: rgba(15, 23, 42, 0.02) !important;
        color: rgba(226, 232, 240, 0.85) !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.08em !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: none !important;
    }

    .filtertube-filter-all-toggle.exact-toggle:hover {
        border-color: #dc2626 !important;
        color: #dc2626 !important;
        background: rgba(255, 255, 255, 0.04) !important;
    }

    .filtertube-filter-all-toggle.exact-toggle.active {
        background-color: rgba(180, 67, 57, 0.2) !important;
        color: #dc2626 !important;
        border-color: #dc2626 !important;
    }

    .filtertube-filter-all-toggle.exact-toggle.active:hover {
        background-color: rgba(180, 67, 57, 0.25) !important;
    }

    .filtertube-block-channel-item.filtertube-blocked {
        background: rgba(16, 185, 129, 0.12) !important;
    }

    .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-title {
        color: #10b981 !important;
    }

    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) {
        background: rgba(248, 113, 113, 0.18) !important;
        border-left: 3px solid #dc2626 !important;
    }

    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-title {
        color: #dc2626 !important;
    }

    .filtertube-block-channel-item.filtertube-multistep-ready {
        background: rgba(16, 185, 129, 0.12) !important;
    }

    .filtertube-block-channel-item.filtertube-multistep-ready .filtertube-menu-title {
        color: #10b981 !important;
        font-weight: 600 !important;
    }

    html[dark="false"] .filtertube-filter-all-toggle.exact-toggle {
        background: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid rgba(148, 163, 184, 0.8) !important;
        color: #1f2937 !important;
    }

    html[dark="false"] .filtertube-filter-all-toggle.exact-toggle:hover {
        border-color: #dc2626 !important;
        color: #dc2626 !important;
        background: rgba(252, 165, 165, 0.15) !important;
    }

    html[dark="false"] .filtertube-filter-all-toggle.exact-toggle.active {
        background-color: rgba(248, 113, 113, 0.25) !important;
        color: #b91c1c !important;
        border-color: #b91c1c !important;
    }

    html[dark="false"] .filtertube-collab-placeholder .filtertube-channel-name {
        color: rgba(30, 41, 59, 0.8) !important;
    }
    `;

    const styleTag = document.createElement('style');
    styleTag.id = 'filtertube-menu-styles';
    styleTag.textContent = styleContent;
    document.documentElement.appendChild(styleTag);
    filterTubeMenuStylesInjected = true;
}
