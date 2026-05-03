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
        color: #475569 !important;
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
        color: #111827 !important;
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
        color: #b45309 !important;
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
        border: 1px solid #dc2626 !important;
        background: #ffffff !important;
        color: #dc2626 !important;
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
        background: rgba(252, 165, 165, 0.16) !important;
    }

    .filtertube-filter-all-toggle.exact-toggle.active {
        background-color: #b44339 !important;
        color: #ffffff !important;
        border-color: #b44339 !important;
    }

    .filtertube-filter-all-toggle.exact-toggle.active:hover {
        background-color: #9f362d !important;
    }

    .filtertube-block-channel-item.filtertube-blocked,
    .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-item {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.045), rgba(255, 255, 255, 0.92)) !important;
        border-left: 4px solid #10b981 !important;
        box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.08) !important;
    }

    .filtertube-block-channel-item.filtertube-pending,
    .filtertube-block-channel-item.filtertube-pending .filtertube-menu-item {
        background: linear-gradient(90deg, rgba(148, 163, 184, 0.12), rgba(255, 255, 255, 0.9)) !important;
        border-left: 4px solid #94a3b8 !important;
        box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12) !important;
        opacity: 0.88 !important;
    }

    .filtertube-modern-bottom-sheet-item.filtertube-blocked .menu-item-button {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.045), rgba(255, 255, 255, 0.92)) !important;
        border-left: 4px solid #10b981 !important;
        border-radius: 8px !important;
        box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.08) !important;
    }

    .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-title,
    .filtertube-block-channel-item.filtertube-blocked .yt-core-attributed-string {
        color: #10b981 !important;
        font-weight: 700 !important;
    }

    .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-label,
    .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-separator,
    .filtertube-block-channel-item.filtertube-blocked .filtertube-channel-name {
        color: #059669 !important;
    }

    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked),
    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-item {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.035), rgba(255, 255, 255, 0.94)) !important;
        border-left: 4px solid #10b981 !important;
        box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.08) !important;
    }

    .filtertube-modern-bottom-sheet-item.filtertube-collab-selected:not(.filtertube-blocked) .menu-item-button {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.035), rgba(255, 255, 255, 0.94)) !important;
        border-left: 4px solid #10b981 !important;
        border-radius: 8px !important;
        box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.08) !important;
    }

    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-title,
    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .yt-core-attributed-string {
        color: #047857 !important;
        font-weight: 700 !important;
    }

    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-label,
    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-separator,
    .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-channel-name {
        color: #047857 !important;
    }

    .filtertube-block-channel-item.filtertube-multistep-ready,
    .filtertube-block-channel-item.filtertube-multistep-ready .filtertube-menu-item {
        background: rgba(16, 185, 129, 0.035) !important;
    }

    .filtertube-modern-bottom-sheet-item.filtertube-multistep-ready .menu-item-button {
        background: rgba(16, 185, 129, 0.035) !important;
        border-radius: 8px !important;
    }

    .filtertube-block-channel-item.filtertube-multistep-ready .filtertube-menu-title {
        color: #10b981 !important;
        font-weight: 600 !important;
    }

    html[dark="true"] .filtertube-menu-title,
    html[dark]:not([dark="false"]) .filtertube-menu-title,
    html[data-theme="dark"] .filtertube-menu-title {
        color: #f8fafc !important;
    }

    html[dark="true"] .filtertube-channel-name,
    html[dark]:not([dark="false"]) .filtertube-channel-name,
    html[data-theme="dark"] .filtertube-channel-name {
        color: #fef3c7 !important;
    }

    html[dark="true"] .filtertube-filter-all-toggle.exact-toggle,
    html[dark]:not([dark="false"]) .filtertube-filter-all-toggle.exact-toggle,
    html[data-theme="dark"] .filtertube-filter-all-toggle.exact-toggle {
        background: rgba(15, 23, 42, 0.55) !important;
        color: #fca5a5 !important;
        border-color: rgba(248, 113, 113, 0.85) !important;
    }

    html[dark="true"] .filtertube-filter-all-toggle.exact-toggle.active,
    html[dark]:not([dark="false"]) .filtertube-filter-all-toggle.exact-toggle.active,
    html[data-theme="dark"] .filtertube-filter-all-toggle.exact-toggle.active {
        background-color: #b44339 !important;
        color: #ffffff !important;
        border-color: #b44339 !important;
    }

    html[dark="true"] .filtertube-block-channel-item.filtertube-blocked,
    html[dark="true"] .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-item,
    html[dark="true"] .filtertube-modern-bottom-sheet-item.filtertube-blocked .menu-item-button,
    html[dark]:not([dark="false"]) .filtertube-block-channel-item.filtertube-blocked,
    html[dark]:not([dark="false"]) .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-item,
    html[dark]:not([dark="false"]) .filtertube-modern-bottom-sheet-item.filtertube-blocked .menu-item-button,
    html[data-theme="dark"] .filtertube-block-channel-item.filtertube-blocked,
    html[data-theme="dark"] .filtertube-block-channel-item.filtertube-blocked .filtertube-menu-item,
    html[data-theme="dark"] .filtertube-modern-bottom-sheet-item.filtertube-blocked .menu-item-button {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.055), rgba(17, 24, 39, 0.88)) !important;
        border-left-color: #34d399 !important;
        box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.1) !important;
    }

    html[dark="true"] .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked),
    html[dark="true"] .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-item,
    html[dark="true"] .filtertube-modern-bottom-sheet-item.filtertube-collab-selected:not(.filtertube-blocked) .menu-item-button,
    html[dark]:not([dark="false"]) .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked),
    html[dark]:not([dark="false"]) .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-item,
    html[dark]:not([dark="false"]) .filtertube-modern-bottom-sheet-item.filtertube-collab-selected:not(.filtertube-blocked) .menu-item-button,
    html[data-theme="dark"] .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked),
    html[data-theme="dark"] .filtertube-block-channel-item.filtertube-collab-selected:not(.filtertube-blocked) .filtertube-menu-item,
    html[data-theme="dark"] .filtertube-modern-bottom-sheet-item.filtertube-collab-selected:not(.filtertube-blocked) .menu-item-button {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.05), rgba(17, 24, 39, 0.9)) !important;
        border-left-color: #34d399 !important;
        box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.1) !important;
    }

    html[dark="false"] .filtertube-filter-all-toggle.exact-toggle {
        background: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid #dc2626 !important;
        color: #dc2626 !important;
    }

    html[dark="false"] .filtertube-filter-all-toggle.exact-toggle:hover {
        border-color: #dc2626 !important;
        color: #dc2626 !important;
        background: rgba(252, 165, 165, 0.15) !important;
    }

    html[dark="false"] .filtertube-filter-all-toggle.exact-toggle.active {
        background-color: #b44339 !important;
        color: #ffffff !important;
        border-color: #b44339 !important;
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
