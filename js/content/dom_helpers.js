// js/content/dom_helpers.js - Isolated World
//
// DOM hide/unhide helpers used by `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.

// ============================================================================
// DOM MANIPULATION HELPERS (SOFT HIDE)
// ============================================================================

// Ensure CSS style for hiding exists
function ensureStyles() {
    if (!document.getElementById('filtertube-style')) {
        const style = document.createElement('style');
        style.id = 'filtertube-style';
        style.textContent = `
            .filtertube-hidden { display: none !important; }
            .filtertube-hidden-shelf { display: none !important; }
            .filtertube-pending-meta,
            [data-filtertube-pending-category],
            [data-filtertube-pending-upload-date] {
                position: relative !important;
                pointer-events: none !important;
                overflow: hidden !important;
            }

            .filtertube-pending-meta > *,
            [data-filtertube-pending-category] > *,
            [data-filtertube-pending-upload-date] > * {
                visibility: hidden !important;
            }

            .filtertube-pending-meta::after,
            [data-filtertube-pending-category]::after,
            [data-filtertube-pending-upload-date]::after {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: 12px;
                background: linear-gradient(90deg,
                    rgba(148, 163, 184, 0.18) 0%,
                    rgba(148, 163, 184, 0.28) 40%,
                    rgba(148, 163, 184, 0.18) 80%
                );
                background-size: 220% 100%;
                animation: filtertube-pending-shimmer 1.1s ease-in-out infinite;
            }

            @keyframes filtertube-pending-shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            /* Debugging aid (optional, can be toggled) */
            /* .filtertube-hidden { display: block !important; opacity: 0.1 !important; border: 2px solid red !important; } */
        `;
        document.head.appendChild(style);
    }
}

/**
 * Toggles visibility of an element using CSS classes.
 * This allows for immediate restoration without page reload.
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} shouldHide - Whether to hide the element
 * @param {string} reason - Debug reason for the toggle
 * @param {boolean} skipStats - If true, do not affect statistics (used for cleanup/containers)
 */
function toggleVisibility(element, shouldHide, reason = '', skipStats = false) {
    if (!element) return;

    if (shouldHide) {
        const wasAlreadyHidden = element.classList.contains('filtertube-hidden');
        const wasWhitelistPending = element.getAttribute('data-filtertube-whitelist-pending') === 'true';

        if (wasAlreadyHidden && wasWhitelistPending && !skipStats) {
            element.removeAttribute('data-filtertube-whitelist-pending');
            filteringTracker.recordHide(element, reason);
            incrementHiddenStats(element);
        }

        if (!wasAlreadyHidden) {
            // IMPORTANT: Extract duration BEFORE hiding the element
            // This ensures we can access all DOM elements before any visual changes
            if (!skipStats) {
                const duration = extractVideoDuration(element);
            }

            // Now hide the element
            element.classList.add('filtertube-hidden');
            element.setAttribute('data-filtertube-hidden', 'true');
            try {
                element.style.setProperty('display', 'none', 'important');
            } catch (e) {
            }
            // debugLog(`🚫 Hiding: ${reason}`);

            // Record for tracking (only for non-container items)
            if (!skipStats) {
                filteringTracker.recordHide(element, reason);
            }

            // Increment stats only for newly hidden items (not already hidden)
            // AND only if skipStats is false (meaning this is a direct filter hit, not a container cleanup)
            if (!skipStats) {
                incrementHiddenStats(element);
            }
        }
        handleMediaPlayback(element, true);
    } else {
        const wasHidden = element.classList.contains('filtertube-hidden');
        const wasShelfHidden = element.classList.contains('filtertube-hidden-shelf');
        const hadHiddenAttr = element.hasAttribute('data-filtertube-hidden');
        const hadWhitelistPending = element.getAttribute('data-filtertube-whitelist-pending') === 'true';

        if (wasShelfHidden) {
            element.classList.remove('filtertube-hidden-shelf');
        }

        if (hadWhitelistPending) {
            element.removeAttribute('data-filtertube-whitelist-pending');
        }

        if (wasHidden || hadHiddenAttr) {
            if (wasHidden) {
                element.classList.remove('filtertube-hidden');
            }
            element.removeAttribute('data-filtertube-hidden');
            // CRITICAL: Reset inline style.display that was set during hiding
            try {
                element.style.removeProperty('display');
            } catch (e) {
                element.style.display = '';
            }
            // debugLog(`✅ Restoring element`);

            if (wasHidden) {
                // Record for tracking (only for non-container items)
                if (!skipStats) {
                    filteringTracker.recordRestore(element);
                }

                // Decrement stats when unhiding content (only if we had counted it)
                if (!skipStats) {
                    decrementHiddenStats(element);
                }
            }
        }
        handleMediaPlayback(element, false);
    }
}

/**
 * Recursively checks if a container should be hidden because all its relevant children are hidden.
 */
function updateContainerVisibility(container, childSelector) {
    if (!container) return;
    if (container.hasAttribute('data-filtertube-hidden-by-shelf-title')) return;
    if (container.hasAttribute('data-filtertube-hidden-by-hide-all-shorts')) return;
    const ignoreEmptyHide = container.getAttribute('data-filtertube-ignore-empty-hide') === 'true';

    const children = container.querySelectorAll(childSelector);
    const hadChildren = container.getAttribute('data-filtertube-container-had-children') === 'true';
    if (children.length === 0) {
        if (ignoreEmptyHide) {
            container.classList.remove('filtertube-hidden-shelf');
            if (container.classList.contains('filtertube-hidden')) {
                container.classList.remove('filtertube-hidden');
                container.removeAttribute('data-filtertube-hidden');
            }
            return;
        }
        if (hadChildren) {
            container.classList.add('filtertube-hidden-shelf');
        }
        return;
    }

    if (!hadChildren) {
        container.setAttribute('data-filtertube-container-had-children', 'true');
    }

    // Check if all children are hidden
    const allHidden = Array.from(children).every(child => {
        if (!child) return true;
        if (child.classList.contains('filtertube-hidden')) return true;
        if (child.classList.contains('filtertube-hidden-shelf')) return true;
        if (child.hasAttribute('data-filtertube-hidden')) return true;

        const hiddenAncestor = child.closest('.filtertube-hidden');
        if (hiddenAncestor && hiddenAncestor !== container) return true;

        const shelfAncestor = child.closest('.filtertube-hidden-shelf');
        if (shelfAncestor && shelfAncestor !== container) return true;

        return false;
    });

    if (allHidden) {
        container.classList.add('filtertube-hidden-shelf');
    } else {
        container.classList.remove('filtertube-hidden-shelf');
        if (container.classList.contains('filtertube-hidden')) {
            container.classList.remove('filtertube-hidden');
            container.removeAttribute('data-filtertube-hidden');
        }
    }
}
