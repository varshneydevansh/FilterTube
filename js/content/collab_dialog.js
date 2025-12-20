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
if (!window.pendingCollabCards) {
    window.pendingCollabCards = new Map();
}
if (window.pendingCollabDialogTrigger === undefined) {
    window.pendingCollabDialogTrigger = null;
}
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

function resolveCollabEntryForDialog(collaborators) {
    if (window.pendingCollabDialogTrigger) {
        const triggeredEntry = window.pendingCollabCards.get(window.pendingCollabDialogTrigger.key);
        if (triggeredEntry) {
            return triggeredEntry;
        }
    }

    if (!collaborators || collaborators.length === 0) return null;
    const primary = collaborators[0];
    const primaryHandle = primary.handle?.toLowerCase();
    const primaryName = primary.name?.toLowerCase();

    const matchingEntries = [];
    for (const entry of window.pendingCollabCards.values()) {
        if (!entry?.card?.isConnected) continue;
        const partialMatches = entry.partialCollaborators || [];
        const hasMatch = partialMatches.some(partial => {
            const partialHandle = partial.handle?.toLowerCase();
            const partialName = partial.name?.toLowerCase();
            return (primaryHandle && partialHandle && partialHandle === primaryHandle) ||
                (primaryName && partialName && partialName === primaryName);
        });
        if (hasMatch) {
            matchingEntries.push(entry);
        }
    }

    if (matchingEntries.length === 0) {
        return null;
    }

    if (matchingEntries.length === 1) {
        return matchingEntries[0];
    }

    return matchingEntries.reduce((best, entry) => {
        if (!best) return entry;
        const bestExpected = best.expectedCollaboratorCount || 0;
        const entryExpected = entry.expectedCollaboratorCount || 0;
        if (entryExpected !== bestExpected) {
            return entryExpected > bestExpected ? entry : best;
        }

        const bestScore = getCollaboratorListQuality(best.partialCollaborators);
        const entryScore = getCollaboratorListQuality(entry.partialCollaborators);
        if (entryScore !== bestScore) {
            return entryScore > bestScore ? entry : best;
        }

        // Prefer the most recent entry if all else ties
        return (entry.timestamp || 0) > (best.timestamp || 0) ? entry : best;
    }, null);
}

function propagateCollaboratorsToMatchingCards(videoId, serializedCollaborators, sourceCard) {
    if (!videoId || !serializedCollaborators) return;
    const cards = document.querySelectorAll(`[data-filtertube-video-id="${videoId}"]`);
    cards.forEach(card => {
        if (card === sourceCard) return;
        card.setAttribute('data-filtertube-collaborators', serializedCollaborators);
        card.setAttribute('data-filtertube-collab-state', 'resolved');
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-requested');
    });
}

function applyCollaboratorsToCard(entry, collaborators) {
    if (!entry || !entry.card || !collaborators || collaborators.length === 0) return;

    const sanitizedCollaborators = sanitizeCollaboratorList(collaborators);
    if (sanitizedCollaborators.length === 0) {
        console.warn('FilterTube: No valid collaborators after sanitization.');
        return;
    }

    const existing = getCachedCollaboratorsFromCard(entry.card);
    const existingScore = getCollaboratorListQuality(existing);
    const incomingScore = getCollaboratorListQuality(sanitizedCollaborators);
    if (existingScore > incomingScore) {
        console.log('FilterTube: Skipping collaborator overwrite because existing data is richer.');
        return;
    }

    let serializedCollaborators = '';
    try {
        serializedCollaborators = JSON.stringify(sanitizedCollaborators);
        entry.card.setAttribute('data-filtertube-collaborators', serializedCollaborators);
        entry.card.setAttribute('data-filtertube-collaborators-source', 'dialog');
    } catch (error) {
        console.warn('FilterTube: Failed to cache dialog collaborator metadata:', error);
    }

    const expectedCount = Math.max(
        entry.expectedCollaboratorCount || 0,
        sanitizedCollaborators.length,
        parseInt(entry.card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0
    );
    if (expectedCount > 0) {
        entry.card.setAttribute('data-filtertube-expected-collaborators', String(expectedCount));
    }

    entry.card.removeAttribute('data-filtertube-collab-awaiting-dialog');
    entry.card.setAttribute('data-filtertube-collab-state', 'resolved');
    if (entry.videoId) {
        entry.card.setAttribute('data-filtertube-video-id', entry.videoId);
        propagateCollaboratorsToMatchingCards(entry.videoId, serializedCollaborators, entry.card);
        const resolvedScore = getCollaboratorListQuality(resolvedCollaboratorsByVideoId.get(entry.videoId));
        if (incomingScore >= resolvedScore) {
            resolvedCollaboratorsByVideoId.set(entry.videoId, sanitizedCollaborators);
        }
        refreshActiveCollaborationMenu(entry.videoId, sanitizedCollaborators, {
            expectedCount
        });
    }
    entry.card.removeAttribute('data-filtertube-collab-requested');

    if (entry.expiryTimeout) {
        clearTimeout(entry.expiryTimeout);
        entry.expiryTimeout = null;
    }

    window.pendingCollabCards.delete(entry.key);
    broadcastCollabDialogData({
        entry,
        collaborators: sanitizedCollaborators,
        expectedCount
    });
    // scheduleCollaboratorRefresh() and pendingCollabDialogTrigger are now handled in collab_dialog.js
}

function broadcastCollabDialogData({ entry, collaborators, expectedCount }) {
    if (!Array.isArray(collaborators) || collaborators.length === 0) return;
    const payload = {
        videoId: entry?.videoId || entry?.card?.getAttribute('data-filtertube-video-id') || '',
        collabKey: entry?.key || null,
        collaborators,
        expectedCount: expectedCount || collaborators.length,
        timestamp: Date.now()
    };

    try {
        window.postMessage({
            type: 'FilterTube_CollabDialogData',
            payload,
            source: 'collab_dialog'
        }, '*');
    } catch (error) {
        console.warn('FilterTube: Failed to broadcast collab dialog data:', error);
    }
}

function extractCollaboratorsFromDialog(dialogNode) {
    if (!dialogNode) return [];
    const items = dialogNode.querySelectorAll('yt-list-item-view-model');
    const collaborators = [];

    items.forEach(item => {
        const collaborator = { name: '', handle: '', id: '' };
        const titleNode = item.querySelector('.yt-list-item-view-model__title') ||
            item.querySelector('a[href*="/@"]') ||
            item.querySelector('a');
        collaborator.name = titleNode?.textContent?.trim() ||
            item.getAttribute('aria-label')?.split('-')?.[0]?.trim() ||
            '';

        const link = item.querySelector('a[href]');
        const href = link?.getAttribute('href') || '';
        if (href) {
            const handleFromHref = extractHandleFromString(href);
            if (handleFromHref) collaborator.handle = handleFromHref;
            const idFromHref = extractChannelIdFromString(href);
            if (idFromHref) collaborator.id = idFromHref;
        }

        const subtitleText = item.querySelector('.yt-list-item-view-model__subtitle')?.textContent ||
            item.getAttribute('aria-label') ||
            '';
        if (!collaborator.handle) {
            const handleFromSubtitle = extractHandleFromString(subtitleText);
            if (handleFromSubtitle) collaborator.handle = handleFromSubtitle;
        }

        const dataSources = [
            item.listItemViewModel,
            item.data,
            item.__data,
            item.__data?.data
        ];
        for (const source of dataSources) {
            if (!source) continue;
            const identifiers = scanDataForChannelIdentifiers(source);
            if (!collaborator.handle && identifiers.handle) collaborator.handle = identifiers.handle;
            if (!collaborator.id && identifiers.id) collaborator.id = identifiers.id;
            if (!collaborator.customUrl && identifiers.customUrl) collaborator.customUrl = identifiers.customUrl;
            if (!collaborator.name && identifiers.name) collaborator.name = identifiers.name;
            const titleContent = source?.title?.content;
            if (!collaborator.name && titleContent) collaborator.name = titleContent;
        }

        if (collaborator.handle) collaborator.handle = normalizeHandleValue(collaborator.handle);
        if (collaborator.name || collaborator.handle || collaborator.id) {
            collaborators.push(collaborator);
        }
    });

    return collaborators;
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
    scheduleCollaboratorRefresh,
    applyCollaboratorsToCard
};
