// js/content/collab_dialog.js - Isolated World
//
// Collaboration dialog trigger + observer wiring extracted from
// `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.
//
// Handles:
// - Detecting when a collaboration dialog is opened
// - Tracking pending collaboration cards
// - Managing the dialog observer and trigger listeners
//
// Depends on globals provided by earlier content scripts:
// - `applyDOMFallback` (dom_fallback.js)
// - `pendingCollabCards`, `pendingCollabDialogTrigger` (shared with content_bridge.js)

const COLLAB_DIALOG_TITLE_PATTERN = /collaborator/i;
const pendingCollabDialogTrigger = null;
let pendingCollabDialogTriggerTimeoutId = null;
let collabDialogObserver = null;
let collabDialogObserverInitialized = false;
let pendingCollaboratorRefresh = false;
let collabTriggerListenersAttached = false;

function scheduleCollaboratorRefresh() {
    if (pendingCollaboratorRefresh) return;
    pendingCollaboratorRefresh = true;
    requestAnimationFrame(() => {
        pendingCollaboratorRefresh = false;
        applyDOMFallback(null, { preserveScroll: true, forceReprocess: true });
    });
}

function isCollabDialogTriggerTarget(target) {
    if (!(target instanceof Element)) return null;
    const clickable = target.closest('yt-avatar-stack-view-model, .yt-avatar-stack-view-model, #attributed-channel-name, [aria-label*="Collaboration"]');
    if (!clickable) return null;
    const card = clickable.closest('[data-filtertube-collab-awaiting-dialog="true"]');
    return card || null;
}

function queuePendingDialogTrigger(card) {
    if (!card) return;
    const key = card.getAttribute('data-filtertube-collab-key');
    if (!key || !window.pendingCollabCards?.has(key)) return;

    window.pendingCollabDialogTrigger = { key, timestamp: Date.now() };
    if (pendingCollabDialogTriggerTimeoutId) {
        clearTimeout(pendingCollabDialogTriggerTimeoutId);
    }
    pendingCollabDialogTriggerTimeoutId = setTimeout(() => {
        window.pendingCollabDialogTrigger = null;
    }, 5000);
}

function handlePotentialCollabTrigger(event) {
    const card = isCollabDialogTriggerTarget(event.target);
    if (card) {
        queuePendingDialogTrigger(card);
    }
}

function handlePotentialCollabTriggerKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = isCollabDialogTriggerTarget(event.target);
    if (card) {
        queuePendingDialogTrigger(card);
    }
}

function ensureCollabTriggerListeners() {
    if (collabTriggerListenersAttached) return;
    collabTriggerListenersAttached = true;
    document.addEventListener('click', handlePotentialCollabTrigger, true);
    document.addEventListener('keydown', handlePotentialCollabTriggerKeydown, true);
}

function handleCollaborationDialog(dialogNode) {
    if (!dialogNode || !(dialogNode instanceof HTMLElement)) return;

    const titleText = dialogNode.querySelector('yt-dialog-header-view-model, h2, [role="heading"]')?.textContent || '';
    if (titleText && !COLLAB_DIALOG_TITLE_PATTERN.test(titleText)) return;

    const collaborators = extractCollaboratorsFromDialog(dialogNode);
    if (!collaborators || collaborators.length < 2) return;

    const entry = resolveCollabEntryForDialog(collaborators);
    if (!entry) return;

    applyCollaboratorsToCard(entry, collaborators);
}

function ensureCollabDialogObserver() {
    if (collabDialogObserverInitialized) return;
    collabDialogObserverInitialized = true;
    
    collabDialogObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            mutation.addedNodes?.forEach(node => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches('tp-yt-paper-dialog')) {
                    handleCollaborationDialog(node);
                } else {
                    const dialog = node.querySelector?.('tp-yt-paper-dialog');
                    if (dialog) {
                        handleCollaborationDialog(dialog);
                    }
                }
            });
        }
    });

    collabDialogObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    ensureCollabTriggerListeners();
    ensureCollabDialogObserver();
});

// Export for content_bridge.js
window.collabDialogModule = {
    ensureCollabDialogObserver,
    ensureCollabTriggerListeners,
    scheduleCollaboratorRefresh
};
