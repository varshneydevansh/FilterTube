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

        if (wasHidden) {
            element.classList.remove('filtertube-hidden');
            element.removeAttribute('data-filtertube-hidden');
            // CRITICAL: Reset inline style.display that was set during hiding
            try {
                element.style.removeProperty('display');
            } catch (e) {
                element.style.display = '';
            }
            // debugLog(`✅ Restoring element`);

            // Record for tracking (only for non-container items)
            if (!skipStats) {
                filteringTracker.recordRestore(element);
            }

            // Decrement stats when unhiding content (only if we had counted it)
            if (!skipStats) {
                decrementHiddenStats(element);
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

    const children = container.querySelectorAll(childSelector);
    if (children.length === 0) return; // Don't hide empty containers that might be loading

    // Check if all children are hidden
    const allHidden = Array.from(children).every(child =>
        child.classList.contains('filtertube-hidden') ||
        child.hasAttribute('data-filtertube-hidden') ||
        child.closest('.filtertube-hidden') !== null
    );

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
