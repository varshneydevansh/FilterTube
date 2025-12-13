// js/content_bridge.js - Isolated world script

console.log("FilterTube: content_bridge.js loaded (Isolated World)");

const IS_FIREFOX_BRIDGE = typeof browser !== 'undefined' && !!browser.runtime;
const browserAPI_BRIDGE = IS_FIREFOX_BRIDGE ? browser : chrome;

// Debug counter for tracking
let debugSequence = 0;
let currentSettings = null;
function debugLog(message, ...args) {
    debugSequence++;
    // console.log(`[${debugSequence}] FilterTube (Bridge ${IS_FIREFOX_BRIDGE ? 'Fx' : 'Cr'}):`, message, ...args);
}

function buildChannelMetadataPayload(channelInfo = {}) {
    const canonical = channelInfo.canonicalHandle || channelInfo.handleDisplay || channelInfo.handle || '';
    const display = channelInfo.handleDisplay || canonical || channelInfo.name || '';
    return {
        canonicalHandle: canonical || null,
        handleDisplay: display || null,
        channelName: channelInfo.name || null
    };
}

function upsertFilterChannel(channelData) {
    if (!channelData) return;
    if (!currentSettings || typeof currentSettings !== 'object') {
        currentSettings = { filterChannels: [channelData] };
        return;
    }
    const existing = Array.isArray(currentSettings.filterChannels) ? [...currentSettings.filterChannels] : [];
    const incomingId = (channelData.id || '').toLowerCase();
    const incomingHandle = (channelData.handle || '').toLowerCase();
    const idx = existing.findIndex(ch => {
        const chId = (ch.id || '').toLowerCase();
        const chHandle = (ch.handle || '').toLowerCase();
        return (incomingId && chId === incomingId) || (incomingHandle && chHandle === incomingHandle);
    });
    if (idx !== -1) {
        existing[idx] = { ...existing[idx], ...channelData };
    } else {
        existing.unshift(channelData);
    }
    currentSettings.filterChannels = existing;
}

function registerActiveCollaborationMenu(videoId, dropdown, videoCard, state = {}) {
    if (!videoId || !dropdown) return;
    const context = {
        dropdown,
        videoCard,
        awaitingFullRender: Boolean(state.awaitingFullRender),
        expectedCount: state.expectedCount || 0,
        lastSignature: state.lastSignature || '',
        channelInfo: state.channelInfo || null,
        groupId: state.groupId || null
    };
    activeCollaborationDropdowns.set(videoId, context);
    dropdown.setAttribute('data-filtertube-collab-video-id', videoId);
    if (context.groupId) {
        dropdown.setAttribute('data-filtertube-collab-group-id', context.groupId);
    } else {
        dropdown.removeAttribute('data-filtertube-collab-group-id');
    }
    if (videoCard) {
        if (context.expectedCount) {
            videoCard.setAttribute('data-filtertube-expected-collaborators', String(context.expectedCount));
        } else {
            videoCard.removeAttribute('data-filtertube-expected-collaborators');
        }
    }
}

function unregisterActiveCollaborationMenu(videoId, dropdown) {
    if (!videoId) return;
    const existing = activeCollaborationDropdowns.get(videoId);
    if (existing && (!dropdown || existing.dropdown === dropdown)) {
        activeCollaborationDropdowns.delete(videoId);
    }
    if (dropdown?.getAttribute('data-filtertube-collab-video-id') === videoId) {
        dropdown.removeAttribute('data-filtertube-collab-video-id');
    }
    clearFilterTubeMenuItems(dropdown);
}

function cleanupDropdownState(dropdown) {
    if (!dropdown) return;
    if (injectedDropdowns.has(dropdown)) {
        injectedDropdowns.delete(dropdown);
    }
    const fetchData = pendingDropdownFetches.get(dropdown);
    if (fetchData) {
        fetchData.cancelled = true;
        pendingDropdownFetches.delete(dropdown);
    }
    const trackedVideoId = dropdown.getAttribute('data-filtertube-collab-video-id');
    if (trackedVideoId) {
        unregisterActiveCollaborationMenu(trackedVideoId, dropdown);
    }
    clearMultiStepStateForDropdown(dropdown);
}

function forceCloseDropdown(dropdown) {
    if (!dropdown) return;
    cleanupDropdownState(dropdown);

    const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true
    });
    dropdown.dispatchEvent(escapeEvent);
    document.dispatchEvent(escapeEvent);

    const activeElement = document.activeElement;
    if (activeElement && dropdown.contains(activeElement)) {
        activeElement.blur();
    }

    if (typeof dropdown.close === 'function') {
        try {
            dropdown.close();
        } catch (error) {
            console.warn('FilterTube: Failed to call dropdown.close()', error);
        }
    }

    dropdown.style.display = 'none';
    dropdown.setAttribute('aria-hidden', 'true');

    // Click elsewhere to release focus trap
    setTimeout(() => {
        const ytdApp = document.querySelector('ytd-app');
        if (ytdApp) {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            ytdApp.dispatchEvent(clickEvent);
        }
    }, 50);
}

function clearFilterTubeMenuItems(dropdown) {
    if (!dropdown) return;
    dropdown.querySelectorAll('.filtertube-block-channel-item').forEach(item => item.remove());
}

function injectCollaboratorPlaceholderMenu(newMenuList, oldMenuList, message = 'Fetching collaborators…') {
    const blockAllMessage = 'Block All (pending…)';
    const newStructure = Boolean(newMenuList);

    const buildPlaceholderContent = (primaryText, secondaryText) => `
        <div class="filtertube-menu-title-wrapper filtertube-menu-title-wrapper--placeholder">
            <span class="filtertube-menu-title" role="text" style="color: rgba(226, 232, 240, 0.7);">
                <span class="filtertube-menu-label">Block</span>
                <span class="filtertube-menu-separator">•</span>
                <span class="filtertube-channel-name">${escapeHtml(primaryText)}</span>
                ${secondaryText ? `<div style="font-size:12px;color:rgba(148,163,184,0.9);margin-top:4px;">${escapeHtml(secondaryText)}</div>` : ''}
            </span>
        </div>
    `;

    if (newStructure) {
        const makeItem = (primary, secondary) => {
            const item = document.createElement('yt-list-item-view-model');
            item.className = 'yt-list-item-view-model filtertube-block-channel-item filtertube-collab-placeholder';
            item.setAttribute('role', 'menuitem');
            item.setAttribute('tabindex', '-1');
            item.style.opacity = '0.6';
            item.style.pointerEvents = 'none';
            item.innerHTML = `
                <div class="yt-list-item-view-model__label filtertube-menu-item" style="padding:8px 12px;">
                    ${buildPlaceholderContent(primary, secondary)}
                </div>
            `;
            return item;
        };

        newMenuList.insertBefore(makeItem(message, 'Please wait…'), newMenuList.firstChild);
        newMenuList.insertBefore(makeItem(blockAllMessage, 'Awaiting collaborator list'), newMenuList.firstChild.nextSibling);
    } else if (oldMenuList) {
        const menuList = oldMenuList.querySelector('tp-yt-paper-listbox') || oldMenuList;
        const makeItem = (primary, secondary) => {
            const item = document.createElement('ytd-menu-service-item-renderer');
            item.className = 'style-scope ytd-menu-popup-renderer filtertube-block-channel-item filtertube-collab-placeholder';
            item.setAttribute('role', 'menuitem');
            item.setAttribute('tabindex', '-1');
            item.style.opacity = '0.6';
            item.style.pointerEvents = 'none';
            item.innerHTML = `
                <tp-yt-paper-item class="style-scope ytd-menu-service-item-renderer filtertube-menu-item" role="option" tabindex="-1">
                    ${buildPlaceholderContent(primary, secondary)}
                </tp-yt-paper-item>
            `;
            return item;
        };

        menuList.insertBefore(makeItem(message, 'Please wait…'), menuList.firstChild);
        menuList.insertBefore(makeItem(blockAllMessage, 'Awaiting collaborator list'), menuList.firstChild.nextSibling);
    }
}

function getMenuContainers(dropdown, existingNew, existingOld) {
    if (existingNew || existingOld) {
        return { newMenuList: existingNew, oldMenuList: existingOld };
    }
    const newMenuList = dropdown.querySelector('yt-list-view-model');
    const oldMenuList = dropdown.querySelector(
        'tp-yt-paper-listbox, ' +
        'ytd-menu-popup-renderer, ' +
        'ytd-menu-service-item-renderer, ' +
        '#items.ytd-menu-popup-renderer, ' +
        '#items.style-scope.ytd-menu-popup-renderer'
    );
    return { newMenuList, oldMenuList };
}

function renderFilterTubeMenuEntries({ dropdown, newMenuList, oldMenuList, channelInfo, videoCard, placeholder = false }) {
    if (!dropdown) return;
    const containers = getMenuContainers(dropdown, newMenuList, oldMenuList);
    const targetMenu = containers.newMenuList || containers.oldMenuList;
    if (!targetMenu) return;

    clearFilterTubeMenuItems(dropdown);
    clearMultiStepStateForDropdown(dropdown);

    if (placeholder) {
        injectCollaboratorPlaceholderMenu(containers.newMenuList, containers.oldMenuList);
        forceDropdownResize(dropdown);
        return;
    }

    if (channelInfo.isCollaboration && channelInfo.allCollaborators && channelInfo.allCollaborators.length >= 2) {
        const collaborators = channelInfo.allCollaborators;
        const collaboratorCount = Math.min(collaborators.length, 6);
        const isMultiStep = collaboratorCount >= 3;
        const groupId = generateCollaborationGroupId();

        if (containers.newMenuList) {
            for (let i = 0; i < collaboratorCount; i++) {
                const collaborator = collaborators[i];
                const otherChannels = collaborators
                    .filter((_, idx) => idx !== i)
                    .map(c => c.handle || c.name);

                injectIntoNewMenu(containers.newMenuList, collaborator, videoCard, {
                    collaborationWith: otherChannels,
                    collaborationGroupId: groupId,
                    isMultiStep
                });
            }

            const blockAllMenuItem = injectIntoNewMenu(containers.newMenuList, {
                name: collaboratorCount === 2 ? 'Both Channels' : `All ${collaboratorCount} Collaborators`,
                isBlockAllOption: true,
                allCollaborators: collaborators.slice(0, collaboratorCount),
                collaborationGroupId: groupId,
                isMultiStep
            }, videoCard);
            setupMultiStepMenu(dropdown, groupId, collaborators.slice(0, collaboratorCount), blockAllMenuItem);
        } else if (containers.oldMenuList) {
            for (let i = 0; i < collaboratorCount; i++) {
                const collaborator = collaborators[i];
                const otherChannels = collaborators
                    .filter((_, idx) => idx !== i)
                    .map(c => c.handle || c.name);

                injectIntoOldMenu(containers.oldMenuList, collaborator, videoCard, {
                    collaborationWith: otherChannels,
                    collaborationGroupId: groupId,
                    isMultiStep
                });
            }

            const blockAllMenuItem = injectIntoOldMenu(containers.oldMenuList, {
                name: collaboratorCount === 2 ? 'Both Channels' : `All ${collaboratorCount} Collaborators`,
                isBlockAllOption: true,
                allCollaborators: collaborators.slice(0, collaboratorCount),
                collaborationGroupId: groupId,
                isMultiStep
            }, videoCard);
            setupMultiStepMenu(dropdown, groupId, collaborators.slice(0, collaboratorCount), blockAllMenuItem);
        }
        forceDropdownResize(dropdown);
        return;
    }

    if (containers.newMenuList) {
        injectIntoNewMenu(containers.newMenuList, channelInfo, videoCard);
    } else if (containers.oldMenuList) {
        injectIntoOldMenu(containers.oldMenuList, channelInfo, videoCard);
    }
    forceDropdownResize(dropdown);
}

function refreshActiveCollaborationMenu(videoId, collaborators, options = {}) {
    if (!videoId) return;
    const context = activeCollaborationDropdowns.get(videoId);
    if (!context) return;
    if (!context.dropdown?.isConnected) {
        activeCollaborationDropdowns.delete(videoId);
        return;
    }

    const paramList = Array.isArray(collaborators) ? collaborators : [];
    // Use validated cache to detect stale DOM elements
    const cardList = context.videoCard ? getValidatedCachedCollaborators(context.videoCard) : [];
    const resolvedList = resolvedCollaboratorsByVideoId.get(videoId) || [];

    const candidates = [
        sanitizeCollaboratorList(paramList),
        sanitizeCollaboratorList(cardList),
        sanitizeCollaboratorList(resolvedList)
    ].filter(list => list.length > 0);

    if (candidates.length === 0) return;

    let sanitized = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (candidate.length > sanitized.length ||
            (candidate.length === sanitized.length &&
                getCollaboratorListQuality(candidate) > getCollaboratorListQuality(sanitized))) {
            sanitized = candidate;
        }
    }

    let avatarStackCollaborators = [];
    const avatarStackElement = context.videoCard?.querySelector('yt-avatar-stack-view-model');
    if (avatarStackElement) {
        avatarStackCollaborators = extractCollaboratorsFromAvatarStackElement(avatarStackElement);
        if (avatarStackCollaborators.length > 0) {
            const merged = mergeCollaboratorLists(sanitized, avatarStackCollaborators);
            if (getCollaboratorListQuality(merged) > getCollaboratorListQuality(sanitized)) {
                sanitized = merged;
            }
        }
    }

    if (sanitized.length === 0) return;

    if (context.videoCard) {
        const cachedOnCard = getValidatedCachedCollaborators(context.videoCard);
        if (getCollaboratorListQuality(sanitized) > getCollaboratorListQuality(cachedOnCard)) {
            try {
                context.videoCard.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitized));
            } catch (error) {
                console.warn('FilterTube: Failed to update card collaborator cache during refresh:', error);
            }
        }
    }

    const expectedFromCard = context.videoCard
        ? parseInt(context.videoCard.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0
        : 0;

    const expectedCount = Math.max(
        options.expectedCount || 0,
        context.expectedCount || 0,
        expectedFromCard,
        sanitized.length,
        avatarStackCollaborators.length,
        context.channelInfo?.expectedCollaboratorCount || 0
    );

    const signature = buildCollaboratorSignature(sanitized);
    const rosterComplete = hasCompleteCollaboratorRoster(sanitized, expectedCount);

    if (signature && signature === context.lastSignature && rosterComplete && !context.awaitingFullRender) {
        return;
    }

    const channelInfo = {
        ...(context.channelInfo || {}),
        isCollaboration: true,
        allCollaborators: sanitized,
        needsEnrichment: false,
        expectedCollaboratorCount: expectedCount
    };

    renderFilterTubeMenuEntries({
        dropdown: context.dropdown,
        channelInfo,
        videoCard: context.videoCard,
        placeholder: false
    });

    context.lastSignature = signature;
    context.awaitingFullRender = !rosterComplete;
    context.expectedCount = expectedCount;
    context.channelInfo = channelInfo;
}

// ==========================================
// ACTIVE RESOLVER - Fetches UC ID for @handles
// ==========================================
const resolvedHandleCache = new Map();

async function fetchIdForHandle(handle, options = {}) {
    const { skipNetwork = false } = options;
    const normalizedHandle = normalizeHandleValue(handle);
    const cleanHandle = normalizedHandle ? normalizedHandle.replace(/^@/, '') : '';
    if (!cleanHandle) return null;

    // If we already have a result, return it.
    // Never leak the internal 'PENDING' sentinel to callers – treat it as
    // "not yet resolved" so callers see a simple "no ID yet" (null).
    if (resolvedHandleCache.has(cleanHandle)) {
        const cached = resolvedHandleCache.get(cleanHandle);
        if (cached !== 'PENDING') {
            return cached;
        }
    }

    // Try resolving from persisted channelMap first to avoid hitting broken /about pages
    try {
        const storage = await browserAPI_BRIDGE.storage.local.get(['channelMap']);
        const channelMap = storage.channelMap || {};
        const keyHandle = (`@${cleanHandle}`).toLowerCase();
        const mappedId = channelMap[keyHandle];

        if (mappedId && mappedId.toUpperCase().startsWith('UC')) {
            resolvedHandleCache.set(cleanHandle, mappedId);
            console.log(`FilterTube: Resolved @${cleanHandle} from channelMap -> ${mappedId}`);
            return mappedId;
        }
    } catch (e) {
        console.warn('FilterTube: Failed to read channelMap while resolving handle', e);
    }

    if (resolvedHandleCache.has(cleanHandle) && resolvedHandleCache.get(cleanHandle) === 'PENDING') {
        return null;
    }

    if (skipNetwork) {
        // Remove the pending marker so future non-skip calls can attempt network fetch
        resolvedHandleCache.delete(cleanHandle);
        return null;
    }

    // Mark as pending to prevent Loop
    resolvedHandleCache.set(cleanHandle, 'PENDING');

    try {
        const rawCandidate = extractRawHandle(handle);
        const networkHandleCore = rawCandidate
            ? rawCandidate.replace(/^@+/, '').split(/[/?#]/)[0].trim()
            : cleanHandle;
        const encodedHandle = encodeURIComponent(networkHandleCore);
        let response = await fetch(`https://www.youtube.com/@${encodedHandle}/about`);

        if (!response.ok) {
            response = await fetch(`https://www.youtube.com/@${encodedHandle}`);
        }

        if (!response.ok) {
            resolvedHandleCache.delete(cleanHandle);
            return null;
        }

        const text = await response.text();

        const match = text.match(/channel\/(UC[\w-]{22})/);
        if (match && match[1]) {
            const id = match[1];

            resolvedHandleCache.set(cleanHandle, id);

            window.postMessage({
                type: 'FilterTube_UpdateChannelMap',
                payload: [{ id: id, handle: `@${cleanHandle}` }],
                source: 'content_bridge'
            }, '*');

            console.log(`FilterTube: ✅ Resolved @${cleanHandle} -> ${id}`);

            setTimeout(() => {
                if (typeof applyDOMFallback === 'function') {
                    applyDOMFallback(currentSettings, { forceReprocess: true });
                }
            }, 50);
            return id;
        }
        resolvedHandleCache.delete(cleanHandle);
    } catch (e) {
        console.warn(`FilterTube: Failed to resolve @${cleanHandle}`, e);
        resolvedHandleCache.delete(cleanHandle);
    }
    return null;
}

// Statistics tracking
let statsCountToday = 0;
let statsTotalSeconds = 0; // Track total seconds saved instead of using multiplier
let statsLastDate = new Date().toDateString();
let statsInitialized = false;

const VIDEO_CARD_SELECTORS = [
    'ytd-rich-item-renderer',
    'ytd-rich-grid-media',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-reel-item-renderer',
    'ytd-playlist-renderer',
    'ytd-radio-renderer',
    'yt-lockup-view-model',
    'yt-lockup-metadata-view-model',
    'ytd-channel-renderer',
    'ytd-grid-channel-renderer',
    'ytd-universal-watch-card-renderer',
    'ytd-channel-video-player-renderer',
    'ytd-channel-featured-content-renderer'
].join(', ');
let collabTriggerListenersAttached = false;

function ensureCollabTriggerListeners() {
    if (collabTriggerListenersAttached) return;
    collabTriggerListenersAttached = true;
    document.addEventListener('click', handlePotentialCollabTrigger, true);
    document.addEventListener('keydown', handlePotentialCollabTriggerKeydown, true);
}

// ==========================================
// HIDE/RESTORE TRACKING FOR DEBUGGING
// ==========================================
let filteringTracker = {
    hiddenItems: [],
    restoredItems: [],
    isActive: false,

    reset() {
        this.hiddenItems = [];
        this.restoredItems = [];
        this.isActive = true;
    },

    recordHide(element, reason) {
        if (!this.isActive) return;
        const title = element.querySelector('#video-title, h3 a, .yt-lockup-metadata-view-model__title')?.textContent?.trim() ||
            element.getAttribute('aria-label')?.substring(0, 50) ||
            'Unknown';
        const channel = element.getAttribute('data-filtertube-channel-handle') ||
            element.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle') ||
            element.getAttribute('data-filtertube-channel-id') ||
            '';
        this.hiddenItems.push({ title: title.substring(0, 60), channel, reason });
    },

    recordRestore(element) {
        if (!this.isActive) return;
        const title = element.querySelector('#video-title, h3 a, .yt-lockup-metadata-view-model__title')?.textContent?.trim() ||
            element.getAttribute('aria-label')?.substring(0, 50) ||
            'Unknown';
        const channel = element.getAttribute('data-filtertube-channel-handle') ||
            element.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle') ||
            element.getAttribute('data-filtertube-channel-id') ||
            '';
        this.restoredItems.push({ title: title.substring(0, 60), channel });
    },

    logSummary() {
        if (!this.isActive) return;
        this.isActive = false;

        if (this.hiddenItems.length > 0 || this.restoredItems.length > 0) {
            console.log('%c📊 FilterTube Hide/Restore Summary', 'font-weight: bold; font-size: 14px; color: #FF6B6B;');

            if (this.hiddenItems.length > 0) {
                console.log(`%c🚫 HIDDEN: ${this.hiddenItems.length} items`, 'color: #FF4444; font-weight: bold;');
                this.hiddenItems.forEach((item, i) => {
                    console.log(`  ${i + 1}. "${item.title}" ${item.channel ? `[${item.channel}]` : ''} - ${item.reason}`);
                });
            }

            if (this.restoredItems.length > 0) {
                console.log(`%c✅ RESTORED: ${this.restoredItems.length} items`, 'color: #44FF44; font-weight: bold;');
            }

            console.log(`%c📈 Net change: ${this.hiddenItems.length - this.restoredItems.length > 0 ? '+' : ''}${this.hiddenItems.length - this.restoredItems.length} hidden`,
                'color: #6B8AFF; font-weight: bold;');
        }
    }
};

/**
 * Generate a unique collaboration group ID (UUID v4 style)
 * Used to link channels blocked together via "Block All Collaborators"
 * @returns {string} - UUID string
 */
function generateCollaborationGroupId() {
    return 'collab-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==========================
// COLLABORATION DIALOG STATE
// ==========================

const COLLAB_MULTI_MORE_PATTERN = /\band\s+\d+\s+more\b/i;
const COLLAB_DIALOG_TITLE_PATTERN = /collaborator/i;
const COLLAB_MORE_TOKEN_PATTERN = /^\d+\s+more$/i;
const COLLAB_PLACEHOLDER_NAME_PATTERN = /^(?:and\s+|block\s+)?\d+\s+more(?:\s+(?:collaborators?|channels?))?$/i;
const pendingCollabCards = new Map(); // key -> entry
let pendingCollabDialogTrigger = null;
let pendingCollabDialogTriggerTimeoutId = null;
let collabDialogObserver = null;
let collabDialogObserverInitialized = false;
let pendingCollaboratorRefresh = false;
const activeCollaborationDropdowns = new Map();
const resolvedCollaboratorsByVideoId = new Map();
const multiStepSelectionState = new Map();
const dropdownCleanupTimers = new WeakMap();

function findStoredChannelEntry(channelInfo) {
    if (!channelInfo || !currentSettings?.filterChannels) return null;
    const channels = currentSettings.filterChannels;
    const handle = channelInfo.handle?.toLowerCase();
    const id = channelInfo.id?.toLowerCase();
    for (const entry of channels) {
        if (!entry) continue;
        const entryHandle = entry.handle?.toLowerCase();
        const entryId = entry.id?.toLowerCase();
        if ((handle && entryHandle === handle) || (id && entryId === id)) {
            return entry;
        }
    }
    return null;
}

function scheduleDropdownCleanup(dropdown, delay = 250) {
    if (!dropdown) return;
    if (dropdownCleanupTimers.has(dropdown)) return;
    const timerId = setTimeout(() => {
        dropdownCleanupTimers.delete(dropdown);
        const isHidden = dropdown.getAttribute('aria-hidden') === 'true' ||
            dropdown.style.display === 'none' ||
            !dropdown.isConnected;
        if (isHidden) {
            cleanupDropdownState(dropdown);
        }
    }, delay);
    dropdownCleanupTimers.set(dropdown, timerId);
}

function cancelDropdownCleanup(dropdown) {
    if (!dropdown) return;
    const timerId = dropdownCleanupTimers.get(dropdown);
    if (timerId) {
        clearTimeout(timerId);
        dropdownCleanupTimers.delete(dropdown);
    }
}

function getCollaboratorKey(channelInfo) {
    if (!channelInfo) return '';
    const value = channelInfo.id || channelInfo.handle || channelInfo.name || '';
    return value.trim().toLowerCase();
}

function clearMultiStepStateForDropdown(dropdown) {
    if (!dropdown) return;
    for (const [groupId, state] of multiStepSelectionState.entries()) {
        if (state.dropdown === dropdown) {
            multiStepSelectionState.delete(groupId);
        }
    }
}

function updateMultiStepActionLabel(state) {
    if (!state) return;
    if (!state.blockAllItem || !state.blockAllItem.isConnected) {
        state.blockAllItem = state.dropdown?.querySelector(`.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${state.groupId}"]`) || null;
        if (state.blockAllItem && (!state.defaultLabel || !state.defaultChannelName)) {
            state.defaultLabel = state.defaultLabel || state.blockAllItem.querySelector('.filtertube-menu-label')?.textContent || 'Block';
            state.defaultChannelName = state.defaultChannelName || state.blockAllItem.querySelector('.filtertube-channel-name')?.textContent ||
                `All ${state.total || 0} Collaborators`;
        }
    }
    if (!state.blockAllItem) return;

    const label = state.blockAllItem.querySelector('.filtertube-menu-label');
    const channelName = state.blockAllItem.querySelector('.filtertube-channel-name');
    const titleSpan = state.blockAllItem.querySelector('.filtertube-menu-title');
    const selectedCount = state.selected?.size || 0;

    const setTitleParts = (primary, secondary) => {
        if (label) label.textContent = primary;
        if (channelName) channelName.textContent = secondary;
        if (!label || !channelName) {
            const composite = secondary ? `${primary} • ${secondary}` : primary;
            if (titleSpan) {
                titleSpan.textContent = composite;
            } else {
                state.blockAllItem.textContent = composite;
            }
        }
    };

    if (selectedCount > 0) {
        setTitleParts('Done', `Block ${selectedCount} Selected`);
        state.blockAllItem.setAttribute('data-is-done-button', 'true');
        state.blockAllItem.classList.add('filtertube-multistep-ready');
    } else {
        setTitleParts(state.defaultLabel || 'Block',
            state.defaultChannelName || `All ${state.total || 0} Collaborators`);
        state.blockAllItem.removeAttribute('data-is-done-button');
        state.blockAllItem.classList.remove('filtertube-multistep-ready');
    }
}

function isFilterAllToggleActive(toggleEl) {
    if (!toggleEl) return false;
    if (toggleEl instanceof HTMLInputElement) {
        return Boolean(toggleEl.checked);
    }
    return toggleEl.classList.contains('active');
}

function applyFilterAllStateToToggle(toggleEl, isActive = false) {
    if (!toggleEl) return;
    const shouldActivate = Boolean(isActive);
    if (toggleEl instanceof HTMLInputElement) {
        toggleEl.checked = shouldActivate;
    }
    toggleEl.classList.toggle('active', shouldActivate);
}

function persistFilterAllStateForMenuItem(menuItem, isActive = false) {
    if (!menuItem) return;
    const groupId = menuItem.getAttribute('data-collaboration-group-id');
    if (!groupId) return;
    const state = multiStepSelectionState.get(groupId);
    if (!state) return;
    if (!state.filterAllMap) {
        state.filterAllMap = new Map();
    }
    const isBlockAll = menuItem.getAttribute('data-is-block-all') === 'true';
    if (isBlockAll) {
        state.masterFilterAll = Boolean(isActive);
        return;
    }
    const key = menuItem.getAttribute('data-collab-key');
    if (!key) return;
    state.filterAllMap.set(key, Boolean(isActive));
}

function hydrateFilterAllToggle(menuItem, channelInfo) {
    if (!menuItem || !channelInfo) return;
    const toggleEl = menuItem.querySelector('.filtertube-filter-all-toggle');
    if (!toggleEl) return;
    const storedEntry = findStoredChannelEntry(channelInfo);
    if (!storedEntry) return;
    applyFilterAllStateToToggle(toggleEl, storedEntry.filterAll);
    persistFilterAllStateForMenuItem(menuItem, storedEntry.filterAll);
}

function getFilterAllPreference(groupId, collaboratorKey, fallback = false) {
    if (!groupId) return fallback;
    const state = multiStepSelectionState.get(groupId);
    if (!state) return fallback;
    const map = state.filterAllMap;
    if (collaboratorKey && map?.has(collaboratorKey)) {
        return Boolean(map.get(collaboratorKey));
    }
    if (typeof state.masterFilterAll === 'boolean') {
        return Boolean(state.masterFilterAll);
    }
    return fallback;
}

function getFilterAllPreferenceForCollaborator(collaborator, groupId, fallback = false) {
    if (!collaborator) return fallback;
    const key = getCollaboratorKey(collaborator);
    return getFilterAllPreference(groupId, key, fallback);
}

function refreshMultiStepSelections(groupId) {
    const state = multiStepSelectionState.get(groupId);
    if (!state || !state.dropdown) return;
    if (!state.selected) state.selected = new Set();
    state.selected.clear();
    const collaboratorItems = state.dropdown.querySelectorAll(`.filtertube-block-channel-item[data-collaboration-group-id="${groupId}"]:not([data-is-block-all="true"])`);
    collaboratorItems.forEach(item => {
        const key = item.getAttribute('data-collab-key');
        if (!key) return;
        if (item.classList.contains('filtertube-blocked') || item.classList.contains('filtertube-collab-selected')) {
            state.selected.add(key);
            item.classList.add('filtertube-collab-selected');
        } else {
            item.classList.remove('filtertube-collab-selected');
        }
    });
    updateMultiStepActionLabel(state);
}

function setupMultiStepMenu(dropdown, groupId, collaborators = [], blockAllItemRef = null) {
    if (!dropdown || !groupId) return;
    clearMultiStepStateForDropdown(dropdown);

    let blockAllItem = blockAllItemRef;
    if (!blockAllItem || !blockAllItem.isConnected) {
        blockAllItem = dropdown.querySelector(`.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${groupId}"]`);
    }

    const state = {
        groupId,
        dropdown,
        total: collaborators.length,
        selected: new Set(),
        // --- FIX: Initialize state properties ---
        filterAllMap: new Map(),
        // ---------------------------------------
        blockAllItem,
        collaborators,
        defaultLabel: blockAllItem?.querySelector('.filtertube-menu-label')?.textContent || 'Block',
        defaultChannelName: blockAllItem?.querySelector('.filtertube-channel-name')?.textContent ||
            `All ${collaborators.length} Collaborators`
    };

    multiStepSelectionState.set(groupId, state);
    updateMultiStepActionLabel(state);

    if (!state.blockAllItem) {
        requestAnimationFrame(() => {
            const storedState = multiStepSelectionState.get(groupId);
            if (!storedState) return;
            if (!storedState.blockAllItem || !storedState.blockAllItem.isConnected) {
                storedState.blockAllItem = storedState.dropdown?.querySelector(`.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${groupId}"]`) || null;
                if (storedState.blockAllItem) {
                    storedState.defaultLabel = storedState.blockAllItem.querySelector('.filtertube-menu-label')?.textContent || storedState.defaultLabel || 'Block';
                    storedState.defaultChannelName = storedState.blockAllItem.querySelector('.filtertube-channel-name')?.textContent ||
                        storedState.defaultChannelName || `All ${storedState.total || 0} Collaborators`;
                    updateMultiStepActionLabel(storedState);
                }
            }
        });
    }

    requestAnimationFrame(() => refreshMultiStepSelections(groupId));
}

function toggleMultiStepSelection(menuItem, channelInfo) {
    if (!menuItem || menuItem.classList.contains('filtertube-blocked')) return;
    const groupId = menuItem.getAttribute('data-collaboration-group-id');
    if (!groupId) return;
    const state = multiStepSelectionState.get(groupId);
    if (!state) return;
    const key = menuItem.getAttribute('data-collab-key') || getCollaboratorKey(channelInfo);
    if (!key) return;
    if (!state.selected) state.selected = new Set();

    const isSelected = menuItem.classList.toggle('filtertube-collab-selected');
    if (isSelected) {
        state.selected.add(key);
    } else {
        state.selected.delete(key);
    }
    updateMultiStepActionLabel(state);
}

function applyBlockedVisualState(menuItem, channelInfo) {
    if (!menuItem) return;
    const titleSpan = menuItem.querySelector('.filtertube-menu-title') ||
        menuItem.querySelector('.yt-core-attributed-string');
    if (titleSpan) {
        if (channelInfo?.name) {
            titleSpan.textContent = `✓ ${channelInfo.name}`;
        } else {
            titleSpan.textContent = '✓ Channel Blocked';
        }
        titleSpan.style.color = '#10b981';
    }
    menuItem.classList.add('filtertube-blocked');
    menuItem.classList.remove('filtertube-collab-selected');
    menuItem.style.pointerEvents = 'none';
}

function forceDropdownResize(dropdown) {
    if (!dropdown) return;
    if (typeof dropdown.refit === 'function') {
        dropdown.refit();
    } else if (typeof dropdown.notifyResize === 'function') {
        dropdown.notifyResize();
    }
    const popup = dropdown.querySelector('ytd-menu-popup-renderer');
    if (popup && typeof popup.triggeredResize === 'function') {
        popup.triggeredResize();
    }
    const resizeEvent = new CustomEvent('iron-resize', { bubbles: true, composed: true });
    dropdown.dispatchEvent(resizeEvent);
    if (popup) {
        popup.dispatchEvent(new CustomEvent('iron-resize', { bubbles: true, composed: true }));
    }
}

function markMultiStepSelection(groupId, channelInfo, menuItem) {
    if (!groupId) return;
    const state = multiStepSelectionState.get(groupId);
    if (!state) return;
    const key = getCollaboratorKey(channelInfo);
    if (!key) return;

    if (!menuItem && state.dropdown) {
        const items = state.dropdown.querySelectorAll(`.filtertube-block-channel-item[data-collaboration-group-id="${groupId}"]`);
        menuItem = Array.from(items).find(item => item.getAttribute('data-collab-key') === key);
    }

    if (menuItem) {
        menuItem.classList.add('filtertube-collab-selected');
    }

    if (!state.selected) {
        state.selected = new Set();
    }
    state.selected.add(key);
    updateMultiStepActionLabel(state);
}

function scheduleCollaboratorRefresh() {
    if (pendingCollaboratorRefresh) return;
    pendingCollaboratorRefresh = true;
    requestAnimationFrame(() => {
        pendingCollaboratorRefresh = false;
        applyDOMFallback(null, { preserveScroll: true, forceReprocess: true });
    });
}

const HANDLE_TERMINATOR_REGEX = /[\/\s?#"'<>\&]/;
const HANDLE_GLYPH_NORMALIZERS = [
    { pattern: /[\u2018\u2019\u201A\u201B\u2032\uFF07]/g, replacement: '\'' },
    { pattern: /[\u201C\u201D\u2033\uFF02]/g, replacement: '"' },
    { pattern: /[\u2013\u2014]/g, replacement: '-' },
    { pattern: /\uFF0E/g, replacement: '.' },
    { pattern: /\uFF3F/g, replacement: '_' }
];

function persistChannelMappings(mappings = []) {
    if (!Array.isArray(mappings) || mappings.length === 0) return;
    try {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: "updateChannelMap",
            mappings
        });
    } catch (error) {
        console.warn('FilterTube: Failed to persist channel mapping', error);
    }

    if (!currentSettings || typeof currentSettings !== 'object') return;
    if (!currentSettings.channelMap || typeof currentSettings.channelMap !== 'object') {
        currentSettings.channelMap = {};
    }
    const map = currentSettings.channelMap;
    mappings.forEach(mapping => {
        if (!mapping || !mapping.id || !mapping.handle) return;
        const idKey = mapping.id.toLowerCase();
        const handleKey = mapping.handle.toLowerCase();
        map[idKey] = mapping.handle;
        map[handleKey] = mapping.id;
    });
}

function normalizeHandleGlyphs(value) {
    let normalized = value;
    HANDLE_GLYPH_NORMALIZERS.forEach(({ pattern, replacement }) => {
        normalized = normalized.replace(pattern, replacement);
    });
    return normalized;
}

function extractRawHandle(value) {
    if (!value || typeof value !== 'string') return '';
    let working = value.trim();
    if (!working) return '';

    const atIndex = working.indexOf('@');
    if (atIndex === -1) return '';

    working = working.substring(atIndex + 1);
    if (!working) return '';

    let buffer = '';
    for (let i = 0; i < working.length; i++) {
        const char = working[i];
        if (char === '%' && i + 2 < working.length && /[0-9A-Fa-f]{2}/.test(working.substring(i + 1, i + 3))) {
            buffer += working.substring(i, i + 3);
            i += 2;
            continue;
        }
        if (HANDLE_TERMINATOR_REGEX.test(char)) {
            break;
        }
        buffer += char;
    }

    if (!buffer) return '';

    try {
        buffer = decodeURIComponent(buffer);
    } catch (err) {
        // Ignore decode failures; fall back to raw string
    }

    buffer = normalizeHandleGlyphs(buffer);
    if (!buffer) return '';
    return `@${buffer}`;
}

function normalizeHandleValue(handle) {
    if (!handle) return '';
    let normalized = handle.trim();
    if (!normalized) return '';

    // Always operate on the raw decoded handle to avoid mismatched cases/encodings
    const rawHandle = extractRawHandle(normalized);
    if (rawHandle) {
        normalized = rawHandle;
    }

    normalized = normalized.replace(/^@+/, '');
    normalized = normalized.split('/')[0];
    normalized = normalized.replace(/\s+/g, '');
    if (!normalized) return '';
    return `@${normalized.toLowerCase()}`;
}

function extractHandleFromString(value) {
    const raw = extractRawHandle(value);
    return raw ? normalizeHandleValue(raw) : '';
}

function applyHandleMetadata(target, candidateHandle, options = {}) {
    if (!target || !candidateHandle) return '';
    const { force = false } = options;
    const rawHandle = extractRawHandle(candidateHandle) || (candidateHandle.startsWith('@') ? candidateHandle : '');
    if (rawHandle && (force || !target.handleDisplay)) {
        target.handleDisplay = rawHandle;
    }
    if (rawHandle && (force || !target.canonicalHandle)) {
        target.canonicalHandle = rawHandle;
    }
    const normalized = normalizeHandleValue(rawHandle || candidateHandle);
    if (normalized && (force || !target.handle)) {
        target.handle = normalized;
    }
    return normalized || '';
}

function isPlaceholderCollaboratorEntry(collaborator) {
    if (!collaborator || typeof collaborator !== 'object') return true;
    if (collaborator.id && collaborator.id.startsWith('UC')) return false;
    const label = (collaborator.handle || collaborator.name || '').trim();
    if (!label) return false;
    const normalized = label.replace(/^@+/, '').toLowerCase();
    return COLLAB_PLACEHOLDER_NAME_PATTERN.test(normalized);
}

function sanitizeCollaboratorList(collaborators = []) {
    if (!Array.isArray(collaborators)) return [];
    const sanitized = [];
    const seenKeys = new Set();

    collaborators.forEach(collab => {
        if (!collab || typeof collab !== 'object') return;
        const normalized = {
            name: (collab.name || '').trim(),
            handle: normalizeHandleValue(collab.handle),
            id: typeof collab.id === 'string' ? collab.id.trim() : ''
        };

        if (!normalized.name && !normalized.handle && !normalized.id) return;
        if (isPlaceholderCollaboratorEntry(normalized)) return;

        const key = (normalized.id || normalized.handle || normalized.name.toLowerCase());
        if (!key || seenKeys.has(key)) return;
        seenKeys.add(key);
        sanitized.push(normalized);
    });

    return sanitized;
}

function getCollaboratorListQuality(list = []) {
    if (!Array.isArray(list) || list.length === 0) return 0;
    return list.reduce((score, collaborator) => {
        if (!collaborator) return score;
        let entryScore = 10; // prioritize length first
        if (collaborator.name) entryScore += 1;
        if (collaborator.handle) entryScore += 3;
        if (collaborator.id) entryScore += 5;
        return score + entryScore;
    }, 0);
}

function extractCollaboratorsFromAvatarStackElement(stackElement) {
    if (!stackElement) return [];
    const avatars = stackElement.querySelectorAll('img');
    const collaborators = [];
    const seen = new Set();

    avatars.forEach(img => {
        if (!img) return;
        let altText = (img.getAttribute('alt') || '').trim();
        if (!altText && img.getAttribute('aria-label')) {
            altText = img.getAttribute('aria-label').trim();
        }
        if (!altText) return;

        // Remove trailing sentences like ". Go to channel."
        altText = altText.replace(/\.\s*Go to channel\.?$/i, '').trim();

        if (!altText) return;

        const anchor = img.closest('a[href]');
        const href = anchor?.getAttribute('href') || '';
        const handle = normalizeHandleValue(extractHandleFromString(href));
        const id = extractChannelIdFromString(href);

        const key = (id || handle || altText.toLowerCase());
        if (seen.has(key)) return;
        seen.add(key);

        collaborators.push({
            name: altText,
            handle,
            id
        });
    });

    return collaborators;
}

function mergeCollaboratorLists(primary = [], supplemental = []) {
    const baseList = Array.isArray(primary) ? primary.map(collab => ({ ...collab })) : [];
    const extras = Array.isArray(supplemental) ? supplemental : [];
    if (baseList.length === 0) {
        return sanitizeCollaboratorList(extras.map(collab => ({ ...collab })));
    }

    extras.forEach(extra => {
        if (!extra) return;
        const normalizedHandle = extra.handle?.toLowerCase();
        const normalizedId = extra.id?.toLowerCase();
        const normalizedName = normalizeCollaboratorName?.(extra.name) || extra.name?.trim().toLowerCase();

        let match = baseList.find(existing => {
            if (!existing) return false;
            const existingHandle = existing.handle?.toLowerCase();
            const existingId = existing.id?.toLowerCase();
            const existingName = normalizeCollaboratorName?.(existing.name) || existing.name?.trim().toLowerCase();

            return (normalizedHandle && existingHandle && normalizedHandle === existingHandle) ||
                (normalizedId && existingId && normalizedId === existingId) ||
                (normalizedName && existingName && normalizedName === existingName);
        });

        if (!match) {
            baseList.push({ ...extra });
            return;
        }

        if (!match.handle && extra.handle) match.handle = extra.handle;
        if (!match.id && extra.id) match.id = extra.id;
        if (!match.name && extra.name) match.name = extra.name;
    });

    return sanitizeCollaboratorList(baseList);
}

function getCachedCollaboratorsFromCard(card) {
    if (!card || typeof card.getAttribute !== 'function') return [];
    const cached = card.getAttribute('data-filtertube-collaborators');
    if (!cached) return [];
    try {
        const parsed = JSON.parse(cached);
        return sanitizeCollaboratorList(parsed);
    } catch (error) {
        console.warn('FilterTube: Failed to parse cached collaborators from card:', error);
        return [];
    }
}

/**
 * Get cached collaborators ONLY if the cached video ID matches the current video displayed in the card.
 * YouTube recycles DOM elements, so a card may have stale data-filtertube-* attributes from a previous video.
 * This function extracts the current video ID from hrefs and validates it against the cached video ID.
 * If there's a mismatch, it clears stale attributes and returns an empty array.
 * @param {Element} card - The video card element
 * @returns {Array} - Valid cached collaborators or empty array if stale
 */
function getValidatedCachedCollaborators(card) {
    if (!card || typeof card.getAttribute !== 'function') return [];

    // Extract the CURRENT video ID from the card's href links (source of truth)
    const currentVideoId = extractVideoIdFromCard(card);
    if (!currentVideoId) {
        // Can't validate without a video ID - return cached data as-is (legacy behavior)
        return getCachedCollaboratorsFromCard(card);
    }

    // Get the cached video ID
    const cachedVideoId = card.getAttribute('data-filtertube-video-id');

    // If no cached video ID, the data might be fresh from initial extraction
    if (!cachedVideoId) {
        return getCachedCollaboratorsFromCard(card);
    }

    // VALIDATION: Check if cached video ID matches current video ID
    if (cachedVideoId !== currentVideoId) {
        console.log(`FilterTube: Detected stale DOM element - cached videoId: ${cachedVideoId}, current videoId: ${currentVideoId}. Clearing stale attributes.`);

        // Clear ALL stale FilterTube attributes - YouTube has recycled this DOM element
        card.removeAttribute('data-filtertube-collaborators');
        card.removeAttribute('data-filtertube-video-id');
        card.removeAttribute('data-filtertube-expected-collaborators');
        card.removeAttribute('data-filtertube-collab-state');
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-requested');
        card.removeAttribute('data-filtertube-processed');
        card.removeAttribute('data-filtertube-unique-id');
        card.removeAttribute('data-filtertube-blocked-channel-id');
        card.removeAttribute('data-filtertube-blocked-channel-handle');
        card.removeAttribute('data-filtertube-blocked-channel-name');
        card.removeAttribute('data-filtertube-blocked-state');
        card.removeAttribute('data-filtertube-blocked-ts');
        card.removeAttribute('data-filtertube-duration');
        // Also clear any cached channel identifiers attached to the card
        card.removeAttribute('data-filtertube-channel-id');
        card.removeAttribute('data-filtertube-channel-handle');
        card.removeAttribute('data-filtertube-channel-name');

        // Also clear from the global resolved map if it had stale data
        if (resolvedCollaboratorsByVideoId.has(cachedVideoId)) {
            // Only delete if the current video is different
            // The stale video's data might still be valid for other cards
        }

        return [];
    }

    // Video IDs match - cached data is valid
    return getCachedCollaboratorsFromCard(card);
}

function buildCollaboratorSignature(collaborators = []) {
    if (!Array.isArray(collaborators) || collaborators.length === 0) return '';
    return collaborators
        .map(collab => (collab.id || collab.handle || collab.name || '').toLowerCase())
        .filter(Boolean)
        .join('|');
}

function hasCompleteCollaboratorRoster(collaborators = [], expectedCount = 0) {
    if (!Array.isArray(collaborators) || collaborators.length === 0) return false;
    const identifiersReady = collaborators.every(collab => Boolean(collab?.id || collab?.handle));
    const meetsExpected = !expectedCount || collaborators.length >= expectedCount;
    return identifiersReady && meetsExpected;
}

function parseCollaboratorNames(rawText = '') {
    if (!rawText || typeof rawText !== 'string') {
        return { names: [], hasHiddenCollaborators: false, hiddenCount: 0 };
    }

    const tokens = rawText.split(/\s+(?:and|&)\s+/i);
    const names = [];
    let hasHidden = COLLAB_MULTI_MORE_PATTERN.test(rawText);
    let hiddenCount = 0;

    tokens.forEach(token => {
        if (!token) return;
        const subTokens = token.split(',');
        subTokens.forEach(part => {
            if (!part) return;
            const cleaned = part.replace(/^[\s,]+|[\s,]+$/g, '').trim();
            if (!cleaned) return;
            const lower = cleaned.toLowerCase();
            if (lower === 'and') return;
            if (COLLAB_MORE_TOKEN_PATTERN.test(lower) || lower.endsWith(' more') || lower.startsWith('more ')) {
                hasHidden = true;
                const countMatch = lower.match(/(\d+)\s+more/);
                if (countMatch) {
                    const parsedCount = parseInt(countMatch[1], 10);
                    if (!isNaN(parsedCount)) {
                        hiddenCount += parsedCount;
                    }
                } else {
                    hiddenCount += 1;
                }
                return;
            }
            names.push(cleaned);
        });
    });

    return { names, hasHiddenCollaborators: hasHidden, hiddenCount };
}

function ensureVideoIdForCard(card) {
    if (!card || typeof card.getAttribute !== 'function') return '';
    let videoId = card.getAttribute('data-filtertube-video-id');
    if (videoId) return videoId;
    videoId = extractVideoIdFromCard(card);
    if (videoId) {
        card.setAttribute('data-filtertube-video-id', videoId);
    }
    return videoId;
}

function getCardTitle(card) {
    if (!card || typeof card.querySelector !== 'function') return '';
    const titleElement = card.querySelector('#video-title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset, h3 a, yt-formatted-string#title, span#title');
    if (titleElement?.textContent?.trim()) {
        return titleElement.textContent.trim();
    }
    const ariaLabel = card.getAttribute?.('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    const labelledById = card.getAttribute?.('aria-labelledby');
    if (labelledById) {
        const labelSource = document.getElementById(labelledById.trim());
        if (labelSource?.textContent) {
            return labelSource.textContent.trim();
        }
    }
    return '';
}

function findVideoCardElement(element) {
    if (!element || !(element instanceof Element)) return null;
    if (element.matches(VIDEO_CARD_SELECTORS)) return element;
    return element.closest(VIDEO_CARD_SELECTORS) || element;
}

function generateCollabEntryKey(card, videoId) {
    if (videoId) return `vid:${videoId}`;
    const existing = card.getAttribute('data-filtertube-collab-key');
    if (existing) return existing;
    const derived = card.getAttribute('data-filtertube-unique-id') ||
        card.dataset?.filtertubeUniqueId ||
        `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    card.setAttribute('data-filtertube-collab-key', derived);
    return derived;
}

function markCardForDialogEnrichment(element, videoId, partialCollaborators = []) {
    const card = findVideoCardElement(element);
    if (!card) return;
    if (card.getAttribute('data-filtertube-collab-state') === 'resolved') {
        return;
    }

    const key = generateCollabEntryKey(card, videoId);
    if (pendingCollabCards.has(key)) {
        const existing = pendingCollabCards.get(key);
        if (partialCollaborators?.length) {
            existing.partialCollaborators = partialCollaborators;
        }
        if (!existing.expectedCollaboratorCount) {
            existing.expectedCollaboratorCount = parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0;
        }
        return;
    }

    card.setAttribute('data-filtertube-collab-awaiting-dialog', 'true');
    card.setAttribute('data-filtertube-collab-state', 'pending');
    if (videoId) {
        card.setAttribute('data-filtertube-video-id', videoId);
    }
    ensureCollabTriggerListeners();

    const entry = {
        key,
        card,
        videoId,
        partialCollaborators: partialCollaborators || [],
        timestamp: Date.now(),
        expiryTimeout: null,
        expectedCollaboratorCount: parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0
    };

    entry.expiryTimeout = setTimeout(() => {
        if (!pendingCollabCards.has(key)) return;
        const tracked = pendingCollabCards.get(key);
        if (tracked !== entry) return;
        pendingCollabCards.delete(key);
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-state');
    }, 20000);

    pendingCollabCards.set(key, entry);
    ensureCollabDialogObserver();
}

function requestCollaboratorEnrichment(element, videoId, partialCollaborators = []) {
    if (!element) return;
    markCardForDialogEnrichment(element, videoId, partialCollaborators);

    if (!videoId) return;
    const existingState = element.getAttribute('data-filtertube-collab-requested');
    if (existingState && existingState.includes('mainworld')) return;

    element.setAttribute('data-filtertube-collab-requested', 'mainworld');

    requestCollaboratorInfoFromMainWorld(videoId)
        .then(collaborators => {
            if (Array.isArray(collaborators) && collaborators.length > 0) {
                const videoCard = findVideoCardElement(element);
                const expectedCount = parseInt(videoCard?.getAttribute('data-filtertube-expected-collaborators') || '0', 10) ||
                    parseInt(element.getAttribute?.('data-filtertube-expected-collaborators') || '0', 10) ||
                    collaborators.length;
                applyResolvedCollaborators(videoId, collaborators, {
                    expectedCount,
                    sourceCard: videoCard
                });
            }
        })
        .catch(error => {
            console.warn('FilterTube: Collaborator enrichment request failed:', error);
        });
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

function resolveCollabEntryForDialog(collaborators) {
    if (pendingCollabDialogTrigger) {
        const triggeredEntry = pendingCollabCards.get(pendingCollabDialogTrigger.key);
        if (triggeredEntry) {
            return triggeredEntry;
        }
    }

    if (!collaborators || collaborators.length === 0) return null;
    const primary = collaborators[0];
    const primaryHandle = primary.handle?.toLowerCase();
    const primaryName = primary.name?.toLowerCase();

    const matchingEntries = [];
    for (const entry of pendingCollabCards.values()) {
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

    pendingCollabCards.delete(entry.key);
    pendingCollabDialogTrigger = null;
    scheduleCollaboratorRefresh();
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

function applyResolvedCollaborators(videoId, collaborators, options = {}) {
    if (!videoId || !Array.isArray(collaborators) || collaborators.length === 0) return false;
    const sanitized = sanitizeCollaboratorList(collaborators);
    if (sanitized.length === 0) return false;

    const incomingScore = getCollaboratorListQuality(sanitized);
    const cachedScore = getCollaboratorListQuality(resolvedCollaboratorsByVideoId.get(videoId));
    if (cachedScore > incomingScore && !options.force) {
        console.log('FilterTube: Skipping resolved collaborator update; existing roster is richer.');
        return false;
    }

    let serialized = '[]';
    try {
        serialized = JSON.stringify(sanitized);
    } catch (error) {
        console.warn('FilterTube: Failed to serialize collaborators:', error);
    }

    let updated = false;
    const cards = document.querySelectorAll(`[data-filtertube-video-id="${videoId}"]`);
    const applyToCard = (card) => {
        const currentScore = getCollaboratorListQuality(getCachedCollaboratorsFromCard(card));
        if (currentScore > incomingScore) return;
        card.setAttribute('data-filtertube-collaborators', serialized);
        card.setAttribute('data-filtertube-collab-state', 'resolved');
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-requested');
        if (options.expectedCount || sanitized.length) {
            const expected = Math.max(
                options.expectedCount || 0,
                sanitized.length,
                parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0
            );
            if (expected > 0) {
                card.setAttribute('data-filtertube-expected-collaborators', String(expected));
            }
        }
    };

    if (cards.length > 0) {
        cards.forEach(card => {
            applyToCard(card);
        });
        updated = true;
    } else if (options.sourceCard) {
        applyToCard(options.sourceCard);
        updated = true;
    }

    resolvedCollaboratorsByVideoId.set(videoId, sanitized);

    const expectedAttr = cards[0]?.getAttribute('data-filtertube-expected-collaborators') ||
        options.sourceCard?.getAttribute?.('data-filtertube-expected-collaborators') ||
        '';
    const expectedCount = Math.max(
        options.expectedCount || 0,
        parseInt(expectedAttr || '0', 10) || 0,
        sanitized.length
    );

    refreshActiveCollaborationMenu(videoId, sanitized, {
        expectedCount
    });

    return updated;
}

function applyCollaboratorsByVideoId(videoId, collaborators, options = {}) {
    if (!videoId || !Array.isArray(collaborators) || collaborators.length === 0) return false;
    const sanitized = sanitizeCollaboratorList(collaborators);
    if (sanitized.length === 0) return false;
    const incomingScore = getCollaboratorListQuality(sanitized);

    const key = `vid:${videoId}`;
    let entry = pendingCollabCards.get(key);
    if (!entry) {
        const card = document.querySelector(`[data-filtertube-video-id="${videoId}"]`);
        if (card) {
            entry = {
                key,
                card,
                videoId,
                partialCollaborators: [],
                timestamp: Date.now(),
                expiryTimeout: null,
                expectedCollaboratorCount: parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0
            };
            pendingCollabCards.set(key, entry);
        }
    }

    const existingResolved = resolvedCollaboratorsByVideoId.get(videoId);
    if (!options.force && getCollaboratorListQuality(existingResolved) > incomingScore) {
        console.log('FilterTube: applyCollaboratorsByVideoId skipped; richer roster already stored.');
        return false;
    }

    resolvedCollaboratorsByVideoId.set(videoId, sanitized);

    let updatedAnyCard = false;
    const serialized = JSON.stringify(sanitized);
    const cards = document.querySelectorAll(`[data-filtertube-video-id="${videoId}"]`);

    const updateCard = (card) => {
        if (!card?.isConnected) return;
        const currentScore = getCollaboratorListQuality(getCachedCollaboratorsFromCard(card));
        if (currentScore > incomingScore && !options.force) return;
        card.setAttribute('data-filtertube-collaborators', serialized);
        card.setAttribute('data-filtertube-collab-state', 'resolved');
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-requested');
        const expected = Math.max(
            options.expectedCount || sanitized.length,
            parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0
        );
        if (expected > 0) {
            card.setAttribute('data-filtertube-expected-collaborators', String(expected));
        }
        updatedAnyCard = true;
    };

    if (cards.length > 0) {
        cards.forEach(updateCard);
    } else if (options.sourceCard) {
        updateCard(options.sourceCard);
    } else if (entry?.card) {
        updateCard(entry.card);
    }

    if (entry) {
        applyCollaboratorsToCard(entry, sanitized);
    }

    refreshActiveCollaborationMenu(videoId, sanitized, {
        expectedCount: options.expectedCount || sanitized.length,
        force: options.force
    });

    return updatedAnyCard;
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

function queuePendingDialogTrigger(card) {
    if (!card) return;
    const key = card.getAttribute('data-filtertube-collab-key');
    if (!key || !pendingCollabCards.has(key)) return;

    pendingCollabDialogTrigger = { key, timestamp: Date.now() };
    if (pendingCollabDialogTriggerTimeoutId) {
        clearTimeout(pendingCollabDialogTriggerTimeoutId);
    }
    pendingCollabDialogTriggerTimeoutId = setTimeout(() => {
        pendingCollabDialogTrigger = null;
    }, 5000);
}

function isCollabDialogTriggerTarget(target) {
    if (!(target instanceof Element)) return null;
    const clickable = target.closest('yt-avatar-stack-view-model, .yt-avatar-stack-view-model, #attributed-channel-name, [aria-label*="Collaboration"]');
    if (!clickable) return null;
    const card = clickable.closest('[data-filtertube-collab-awaiting-dialog="true"]');
    return card || null;
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

// Initialize stats from storage
function initializeStats() {
    if (statsInitialized || !chrome || !chrome.storage) return;
    statsInitialized = true;

    chrome.storage.local.get(['stats'], (result) => {
        const today = new Date().toDateString();
        if (result.stats && result.stats.lastDate === today) {
            // Same day, restore count and seconds
            statsCountToday = result.stats.hiddenCount || 0;
            statsTotalSeconds = result.stats.savedSeconds || 0;
            statsLastDate = result.stats.lastDate;
        } else {
            // New day or no stats, reset
            statsCountToday = 0;
            statsTotalSeconds = 0;
            statsLastDate = today;
        }
    });
}

/**
 * Extract video duration from element - UPDATED for YouTube 2025
 * @param {HTMLElement} element - The video element
 * @returns {number|null} Duration in seconds, or null if not found
 */
function extractVideoDuration(element) {
    if (!element) return null;

    // Check cache first
    const cached = element.getAttribute('data-filtertube-duration');
    if (cached !== null && cached !== '') {
        return parseInt(cached, 10);
    }

    // 1. NEW: Check for badge-shape text (e.g., "3:54")
    // Path: badge-shape -> div.yt-badge-shape__text
    const badgeText = element.querySelector('.yt-badge-shape__text');
    if (badgeText) {
        const seconds = parseDuration(badgeText.textContent.trim());
        if (seconds > 0) {
            element.setAttribute('data-filtertube-duration', seconds.toString());
            return seconds;
        }
    }

    // 2. NEW: Check for badge-shape aria-label (e.g., "3 minutes, 54 seconds")
    const badgeAria = element.querySelector('badge-shape[aria-label]');
    if (badgeAria) {
        const seconds = parseAriaLabelDuration(badgeAria.getAttribute('aria-label'));
        if (seconds > 0) {
            element.setAttribute('data-filtertube-duration', seconds.toString());
            return seconds;
        }
    }

    // 3. LEGACY: Old span selectors
    const legacySelectors = [
        'ytd-thumbnail-overlay-time-status-renderer span#text',
        'span.ytd-thumbnail-overlay-time-status-renderer',
        '#time-status span'
    ];

    for (const selector of legacySelectors) {
        const el = element.querySelector(selector);
        if (el && el.textContent) {
            const seconds = parseDuration(el.textContent.trim());
            if (seconds > 0) {
                element.setAttribute('data-filtertube-duration', seconds.toString());
                return seconds;
            }
        }
    }

    // Cache failure to prevent re-querying
    element.setAttribute('data-filtertube-duration', '');
    return null;
}

/**
 * Parse duration from aria-label format (e.g., "7 minutes, 51 seconds")
 * @param {string} ariaLabel - Aria label text
 * @returns {number} Duration in seconds
 */
function parseAriaLabelDuration(ariaLabel) {
    if (!ariaLabel) return 0;

    let totalSeconds = 0;

    // Extract hours
    const hoursMatch = ariaLabel.match(/(\d+)\s*hour/i);
    if (hoursMatch) {
        totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    }

    // Extract minutes
    const minutesMatch = ariaLabel.match(/(\d+)\s*minute/i);
    if (minutesMatch) {
        totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    }

    // Extract seconds
    const secondsMatch = ariaLabel.match(/(\d+)\s*second/i);
    if (secondsMatch) {
        totalSeconds += parseInt(secondsMatch[1], 10);
    }

    return totalSeconds;
}

/**
 * Parse duration string (e.g., "1:38:14" or "2:47") to seconds
 * @param {string} durationText - Duration string
 * @returns {number} Duration in seconds
 */
function parseDuration(durationText) {
    if (!durationText) return 0;

    const parts = durationText.split(':').map(Number);

    if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // SS
        return parts[0];
    }

    return 0;
}

/**
 * Determine content type from element
 * @param {HTMLElement} element - The content element
 * @returns {string} Content type: 'video', 'short', 'comment', 'chip', 'shelf', 'playlist', 'mix'
 */
function getContentType(element) {
    if (!element) return 'video';

    const tagName = element.tagName?.toLowerCase();

    // Shorts
    if (tagName === 'ytd-reel-item-renderer' ||
        tagName === 'ytd-shorts-lockup-view-model' ||
        element.closest('ytd-reel-shelf-renderer')) {
        return 'short';
    }

    // Comments
    if (tagName === 'ytd-comment-view-model' ||
        tagName === 'ytd-comment-renderer' ||
        tagName === 'ytd-comment-thread-renderer') {
        return 'comment';
    }

    // Chips (topic filters)
    if (tagName === 'yt-chip-cloud-chip-renderer' ||
        element.classList?.contains('chip')) {
        return 'chip';
    }

    // Playlists and Mixes (these are containers, not individual videos)
    if (tagName === 'ytd-playlist-renderer' ||
        tagName === 'ytd-radio-renderer' ||
        element.querySelector('[aria-label*="Mix"]') ||
        element.querySelector('[title*="Mix"]')) {
        return 'playlist';
    }

    // Shelves (containers)
    if (tagName === 'ytd-rich-section-renderer' ||
        tagName === 'ytd-shelf-renderer' ||
        tagName === 'ytd-rich-shelf-renderer' ||
        tagName === 'grid-shelf-view-model' ||
        element.classList?.contains('filtertube-hidden-shelf')) {
        return 'shelf';
    }

    // Default to video
    return 'video';
}

/**
 * Estimate time saved based on content type and duration
 * @param {string} contentType - Type of content
 * @param {number|null} duration - Video duration in seconds (if available)
 * @returns {number} Estimated seconds saved
 */
function estimateTimeSaved(contentType, duration = null) {
    // Don't count containers (they're just wrappers, not actual content)
    if (contentType === 'shelf' || contentType === 'playlist') return 0;

    // Comments and chips take minimal time to evaluate
    if (contentType === 'comment') return 1;
    if (contentType === 'chip') return 0.5;

    // Shorts: use actual duration if available, otherwise estimate
    if (contentType === 'short') {
        return duration && duration > 0 ? duration : 30; // Default 30 sec for shorts
    }

    // Videos: use actual duration when available
    if (contentType === 'video') {
        if (duration && duration > 0) {
            return duration; // Return the actual video duration
        }
        // Fallback estimate if no duration available
        return 180; // Default 3 minutes estimate
    }

    // Default fallback
    return 4;
}

/**
 * Increment hidden stats when content is hidden
 * @param {HTMLElement} element - The hidden element
 */
function incrementHiddenStats(element) {
    const today = new Date().toDateString();

    if (today !== statsLastDate) {
        statsCountToday = 0;
        statsTotalSeconds = 0;
        statsLastDate = today;
    }

    // Determine content type
    const contentType = getContentType(element);

    // 1. Extract Title
    const titleEl = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, yt-formatted-string#title, span#title');
    const title = titleEl?.textContent?.trim() || element.getAttribute('aria-label') || 'Unknown';

    // 2. IMMEDIATE REJECTIONS (Layout Cleanup)
    // If it's "Unknown", "Albums", or "Results with...", it is NOT a video.
    if (title === 'Unknown' || title === 'Albums' || title.startsWith('Results with') || title.startsWith('Results for')) {
        return;
    }

    // 3. CRITICAL: LINK CHECK
    // Real videos MUST have a link to watch them. Headers do not.
    // If it's not a short, and it doesn't have a watch link, ignore it.
    const hasVideoLink = element.querySelector('a[href*="/watch?"]');
    const hasShortsLink = element.querySelector('a[href*="/shorts/"]');

    if (contentType !== 'short' && !hasVideoLink && !hasShortsLink) {
        return; // It's a container/header, not a video
    }

    // 4. Ignore Container Types
    if (contentType === 'shelf' || contentType === 'playlist' || contentType === 'mix') {
        return;
    }

    // 5. Get Duration
    const duration = extractVideoDuration(element);
    let secondsSaved = 0;

    // Calculate time
    if (duration && duration > 0) {
        secondsSaved = duration;
    } else if (contentType === 'short' || hasShortsLink) {
        secondsSaved = 45; // Average short
    } else if (contentType === 'video') {
        secondsSaved = 180; // Fallback for videos
    }

    // Only increment if valid
    if (secondsSaved > 0) {
        statsCountToday++;
        statsTotalSeconds += secondsSaved;

        if (element) {
            element.setAttribute('data-filtertube-time-saved', secondsSaved.toString());
        }

        // Formatting for log
        const channelEl = element.querySelector('#channel-name a, .ytd-channel-name a, ytd-channel-name a');
        const channelInfo = element.getAttribute('data-filtertube-channel-handle') || channelEl?.textContent?.trim() || '';

        console.log(`FilterTube: Saved ${secondsSaved}s from "${title}"${channelInfo ? ' - ' + channelInfo : ''}`);

        saveStats();
    }
}

/**
 * Decrement hidden stats when content is unhidden
 * @param {HTMLElement} element - The unhidden element
 */
function decrementHiddenStats(element) {
    if (statsCountToday <= 0) return;

    // Get the time that was saved when this element was hidden
    const savedTime = parseFloat(element?.getAttribute('data-filtertube-time-saved') || '0');

    if (savedTime > 0) {
        statsCountToday = Math.max(0, statsCountToday - 1);
        statsTotalSeconds = Math.max(0, statsTotalSeconds - savedTime);

        // Remove the attribute
        if (element) {
            element.removeAttribute('data-filtertube-time-saved');
        }

        saveStats();
    }
}

/**
 * Save stats to storage
 */
function saveStats() {
    const minutesSaved = Math.floor(statsTotalSeconds / 60);

    if (chrome && chrome.storage) {
        chrome.storage.local.set({
            stats: {
                hiddenCount: statsCountToday,
                savedMinutes: minutesSaved,
                savedSeconds: statsTotalSeconds,
                lastDate: statsLastDate
            }
        });
    }
}


function extractShelfTitle(shelf) {
    if (!shelf || typeof shelf.querySelector !== 'function') return '';

    // Standard headers
    const header = shelf.querySelector(':scope #title-container, :scope #header, :scope ytd-shelf-header-renderer, :scope .grid-subheader, :scope .shelf-title-row, :scope h2, :scope yt-section-header-view-model');
    const headerTextCandidates = [];

    if (header) {
        headerTextCandidates.push(
            header.querySelector('#title'),
            header.querySelector('#title-text'),
            header.querySelector('yt-formatted-string#title'),
            header.querySelector('span#title'),
            header.querySelector('h2'),
            header.querySelector('.yt-shelf-header-layout__title')
        );
    }

    // Direct children checks (fallback)
    headerTextCandidates.push(
        shelf.querySelector(':scope > #dismissible #title'),
        shelf.querySelector(':scope > #dismissible #title-text'),
        shelf.querySelector(':scope > h2'),
        shelf.querySelector('.yt-shelf-header-layout__title')
    );

    for (const candidate of headerTextCandidates) {
        const text = candidate?.textContent?.trim();
        if (text) return text;
    }

    const headerAria = header?.getAttribute?.('aria-label');
    if (headerAria?.trim()) return headerAria.trim();

    const shelfAria = shelf.getAttribute('aria-label');
    if (shelfAria?.trim()) return shelfAria.trim();

    return '';
}

function handleMediaPlayback(element, shouldHide) {
    if (!element || typeof element.querySelectorAll !== 'function') return;

    const mediaElements = element.querySelectorAll('video, audio');
    mediaElements.forEach(media => {
        try {
            if (shouldHide) {
                if (!media.dataset.filtertubeStoredAutoplay && (media.autoplay || media.hasAttribute('autoplay'))) {
                    media.dataset.filtertubeStoredAutoplay = 'true';
                }
                if (typeof media.pause === 'function') {
                    media.pause();
                }
                media.autoplay = false;
            } else {
                if (media.dataset.filtertubeStoredAutoplay === 'true') {
                    media.autoplay = true;
                }
            }
        } catch (error) {
            debugLog('⚠️ Failed to adjust media playback', error);
        }
    });

    if (shouldHide) {
        const moviePlayer = element.querySelector('#movie_player');
        if (moviePlayer) {
            try {
                if (typeof moviePlayer.pauseVideo === 'function') {
                    moviePlayer.pauseVideo();
                } else if (typeof moviePlayer.stopVideo === 'function') {
                    moviePlayer.stopVideo();
                }
            } catch (error) {
                debugLog('⚠️ Failed to pause movie player', error);
            }
        }
    }
}

const CHANNEL_ONLY_TAGS = new Set([
    'ytd-universal-watch-card-renderer',
    'ytm-universal-watch-card-renderer'
]);

function extractChannelIdFromString(value) {
    if (!value || typeof value !== 'string') return '';
    const match = value.match(/UC[0-9A-Za-z_-]{22}/);
    return match ? match[0] : '';
}

function normalizeHrefForParsing(href) {
    if (!href || typeof href !== 'string') return '';
    try {
        const url = new URL(href, document.location?.origin || 'https://www.youtube.com');
        return url.pathname || '';
    } catch (e) {
        return href;
    }
}

function buildChannelMetadata(channelText = '', channelHref = '') {
    const normalizedHref = normalizeHrefForParsing(channelHref);
    const handle = extractHandleFromString(channelText) || extractHandleFromString(normalizedHref);
    const id = extractChannelIdFromString(normalizedHref) || extractChannelIdFromString(channelText);
    return { handle, id };
}

function collectDatasetValues(element) {
    if (!element || !element.dataset) return '';
    return Object.values(element.dataset).join(' ');
}

function collectAttributeValues(element) {
    if (!element || typeof element.getAttributeNames !== 'function') return '';
    return element.getAttributeNames()
        .map(name => element.getAttribute(name))
        .filter(Boolean)
        .join(' ');
}

function scanDataForChannelIdentifiers(root) {
    const result = { handle: '', id: '' };
    if (!root || typeof root !== 'object') return result;

    // Direct check on the object first (most common case)
    // Check for channelId, browseId (often channel ID), canonicalBaseUrl (often /channel/...)
    if (root.channelId) result.id = root.channelId;
    else if (root.browseId && root.browseId.startsWith('UC')) result.id = root.browseId;

    if (root.canonicalBaseUrl && root.canonicalBaseUrl.includes('/@')) {
        const handle = extractHandleFromString(root.canonicalBaseUrl);
        if (handle) result.handle = handle;
    }

    if (result.id && result.handle) return result;

    // Shallow scan of specific known properties to avoid deep recursion into related items
    // We explicitly avoid 'items', 'contents', 'results' which usually contain OTHER videos/channels
    const safeProperties = ['navigationEndpoint', 'command', 'browseEndpoint', 'urlEndpoint', 'owner', 'channelName', 'shortBylineText', 'longBylineText', 'runs', 'text'];

    for (const prop of safeProperties) {
        if (root[prop]) {
            const val = root[prop];
            if (typeof val === 'object') {
                // Check nested navigation endpoint
                if (val.browseId && val.browseId.startsWith('UC')) {
                    if (!result.id) result.id = val.browseId;
                }
                if (val.url && val.url.includes('/@')) {
                    const handle = extractHandleFromString(val.url);
                    if (handle && !result.handle) result.handle = handle;
                }
                // Check text runs for handles
                if (Array.isArray(val)) {
                    for (const run of val) {
                        if (run.text && run.text.startsWith('@') && !result.handle) {
                            const normalized = normalizeHandleValue(run.text);
                            if (normalized) result.handle = normalized;
                        }
                        if (run.navigationEndpoint) {
                            const nav = run.navigationEndpoint;
                            if (nav.browseEndpoint && nav.browseEndpoint.browseId && nav.browseEndpoint.browseId.startsWith('UC') && !result.id) {
                                result.id = nav.browseEndpoint.browseId;
                            }
                        }
                    }
                }
            }
        }
    }

    return result;
}

function extractChannelMetadataFromElement(element, channelText = '', channelHref = '', options = {}) {
    const cacheTarget = options.cacheTarget || element || null;
    const relatedElements = Array.isArray(options.relatedElements) ? options.relatedElements.filter(Boolean) : [];

    if (!element && !cacheTarget && relatedElements.length === 0) {
        return buildChannelMetadata(channelText, channelHref);
    }

    const cacheSource = cacheTarget || element || relatedElements[0] || null;

    const cachedHandle = cacheSource?.getAttribute?.('data-filtertube-channel-handle');
    const cachedId = cacheSource?.getAttribute?.('data-filtertube-channel-id');

    const normalizedHref = normalizeHrefForParsing(channelHref);
    const hrefHandle = extractHandleFromString(normalizedHref) || extractHandleFromString(channelHref);
    const hrefId = extractChannelIdFromString(normalizedHref) || extractChannelIdFromString(channelHref);

    const normalizedCachedHandle = cachedHandle ? normalizeHandleValue(cachedHandle) : '';
    const shouldTrustCachedHandle = Boolean(
        normalizedCachedHandle &&
        (!hrefHandle || normalizedCachedHandle === normalizeHandleValue(hrefHandle))
    );
    const shouldTrustCachedId = Boolean(
        cachedId &&
        (!hrefId || cachedId === hrefId)
    );

    if (cachedHandle && !shouldTrustCachedHandle) {
        cacheSource?.removeAttribute?.('data-filtertube-channel-handle');
    }
    if (cachedId && !shouldTrustCachedId) {
        cacheSource?.removeAttribute?.('data-filtertube-channel-id');
    }

    if (shouldTrustCachedHandle || shouldTrustCachedId) {
        return {
            handle: shouldTrustCachedHandle ? normalizedCachedHandle : '',
            id: shouldTrustCachedId ? (cachedId || '') : ''
        };
    }

    const meta = buildChannelMetadata(channelText, channelHref);

    if (!meta.handle || !meta.id) {
        const datasetValues = [...new Set([element, cacheTarget, ...relatedElements])]
            .filter(src => src && src.dataset)
            .map(src => collectDatasetValues(src))
            .filter(Boolean)
            .join(' ');

        const attributeValues = [...new Set([element, cacheTarget, ...relatedElements])]
            .filter(src => src)
            .map(src => collectAttributeValues(src))
            .filter(Boolean)
            .join(' ');

        if (datasetValues) {
            if (!meta.handle) {
                const dsHandle = extractHandleFromString(datasetValues);
                if (dsHandle) meta.handle = dsHandle;
            }
            if (!meta.id) {
                const dsId = extractChannelIdFromString(datasetValues);
                if (dsId) meta.id = dsId;
            }
        }

        if (attributeValues) {
            if (!meta.handle) {
                const attrHandle = extractHandleFromString(attributeValues);
                if (attrHandle) meta.handle = attrHandle;
            }
            if (!meta.id) {
                const attrId = extractChannelIdFromString(attributeValues);
                if (attrId) meta.id = attrId;
            }
        }
    }

    if (!meta.handle || !meta.id) {
        const possibleSources = new Set();
        const addSource = source => {
            if (!source || typeof source !== 'object') return;
            if (source instanceof Element || source instanceof Node || source === window) return;
            possibleSources.add(source);
        };

        const potentialElements = [...new Set([element, cacheTarget, ...relatedElements].filter(Boolean))];

        potentialElements.forEach(el => {
            addSource(el?.data);
            addSource(el?.data?.data);
            addSource(el?.data?.content);
            addSource(el?.data?.metadata);
            addSource(el?.data?.renderer);
            addSource(el?.__data);
            addSource(el?.__data?.data);
            addSource(el?.__data?.content);
            addSource(el?.__data?.metadata);
            addSource(el?.__dataHost);
            addSource(el?.__dataHost?.data);
        });

        const parentCandidates = [
            cacheTarget?.closest?.('ytd-rich-item-renderer'),
            cacheTarget?.closest?.('ytd-video-renderer'),
            cacheTarget?.closest?.('ytd-playlist-renderer'),
            cacheTarget?.closest?.('ytd-radio-renderer'),
            cacheTarget?.closest?.('ytd-grid-video-renderer'),
            cacheTarget?.closest?.('yt-lockup-view-model'),
            cacheTarget?.closest?.('yt-lockup-metadata-view-model'),
            // Add specific check for channel page header
            cacheTarget?.closest?.('ytd-channel-name')
        ];

        parentCandidates.forEach(parent => {
            if (!parent) return;
            // Prioritize direct data properties
            if (parent.data) addSource(parent.data);
            if (parent.__data) addSource(parent.__data);

            // Only go deeper if it's a channel name renderer
            if (parent.tagName === 'YTD-CHANNEL-NAME') {
                addSource(parent.data?.channelName);
            }
        });

        for (const source of possibleSources) {
            const identifiers = scanDataForChannelIdentifiers(source);
            if (!meta.handle && identifiers.handle) meta.handle = identifiers.handle;
            if (!meta.id && identifiers.id) meta.id = identifiers.id;
            if (meta.handle && meta.id) break;
        }
    }

    if (!meta.handle || !meta.id) {
        const anchorCandidates = new Set();
        const elementForAnchors = [...new Set([element, cacheTarget, ...relatedElements].filter(el => el && typeof el.querySelectorAll === 'function'))];

        elementForAnchors.forEach(el => {
            el.querySelectorAll('a[href]').forEach(anchor => anchorCandidates.add(anchor));
        });

        for (const anchor of anchorCandidates) {
            const href = anchor.getAttribute('href') || anchor.href || '';
            const normalizedHref = href ? normalizeHrefForParsing(href) : '';
            const isChannelLink = Boolean(normalizedHref && (
                normalizedHref.startsWith('/@') ||
                normalizedHref.startsWith('/channel/') ||
                normalizedHref.startsWith('/c/') ||
                normalizedHref.startsWith('/user/')
            ));

            if (href) {
                const idFromHref = extractChannelIdFromString(href) || extractChannelIdFromString(normalizedHref);
                if (!meta.id && idFromHref) {
                    meta.id = idFromHref;
                }

                const handleFromHref = isChannelLink
                    ? (extractHandleFromString(href) || extractHandleFromString(normalizedHref))
                    : '';

                if (handleFromHref) {
                    meta.handle = handleFromHref;
                }
            }

            if (isChannelLink) {
                if (!meta.handle) {
                    const anchorDatasetValues = collectDatasetValues(anchor);
                    if (anchorDatasetValues) {
                        const dsHandle = extractHandleFromString(anchorDatasetValues);
                        if (dsHandle) meta.handle = dsHandle;
                    }
                }

                if (!meta.id) {
                    const anchorDatasetValues = collectDatasetValues(anchor);
                    if (anchorDatasetValues) {
                        const dsId = extractChannelIdFromString(anchorDatasetValues);
                        if (dsId) meta.id = dsId;
                    }
                }

                if (!meta.handle) {
                    const anchorAttributeValues = collectAttributeValues(anchor);
                    if (anchorAttributeValues) {
                        const attrHandle = extractHandleFromString(anchorAttributeValues);
                        if (attrHandle) meta.handle = attrHandle;
                    }
                }

                if (!meta.id) {
                    const anchorAttributeValues = collectAttributeValues(anchor);
                    if (anchorAttributeValues) {
                        const attrId = extractChannelIdFromString(anchorAttributeValues);
                        if (attrId) meta.id = attrId;
                    }
                }

                if (!meta.handle) {
                    const anchorText = anchor.textContent || '';
                    if (anchorText) {
                        const textHandle = extractHandleFromString(anchorText);
                        if (textHandle) meta.handle = textHandle;
                    }
                }
            }

            if (meta.handle && meta.id) break;
        }
    }

    if (!meta.handle) {
        const fallbackSources = [...new Set([channelText, cacheTarget?.innerText, element?.innerText, ...relatedElements.map(el => el?.innerText)].filter(Boolean))];
        for (const sourceText of fallbackSources) {
            const fallbackHandle = extractHandleFromString(sourceText);
            if (fallbackHandle) {
                meta.handle = fallbackHandle;
                break;
            }
        }
    }

    if (meta.handle) {
        meta.handle = normalizeHandleValue(meta.handle);
    }

    // Note: Channel IDs are case-sensitive and must NOT be lowercased
    // They typically start with "UC" in uppercase

    if (cacheSource) {
        if (meta.handle) {
            cacheSource.setAttribute('data-filtertube-channel-handle', meta.handle);
        } else {
            cacheSource.removeAttribute?.('data-filtertube-channel-handle');
        }

        if (meta.id) {
            cacheSource.setAttribute('data-filtertube-channel-id', meta.id);
        } else {
            cacheSource.removeAttribute?.('data-filtertube-channel-id');
        }
    }

    return meta;
}

function clearCachedChannelMetadata(root) {
    if (!root || typeof root.querySelectorAll !== 'function') {
        if (root?.removeAttribute) {
            root.removeAttribute('data-filtertube-channel-handle');
            root.removeAttribute('data-filtertube-channel-id');
        }
        return;
    }

    const targets = new Set([root]);
    root.querySelectorAll('[data-filtertube-channel-handle],[data-filtertube-channel-id]').forEach(el => targets.add(el));

    targets.forEach(el => {
        try {
            el.removeAttribute('data-filtertube-channel-handle');
            el.removeAttribute('data-filtertube-channel-id');
        } catch (e) {
            // ignore
        }
    });
}

function extractCollaboratorMetadataFromElement(element) {
    if (!element || typeof element.getAttribute !== 'function') return [];

    const card = findVideoCardElement(element);
    // Use validated cache to detect stale DOM elements
    if (card) {
        const cachedCollaborators = getValidatedCachedCollaborators(card);
        if (cachedCollaborators.length > 0) {
            return cachedCollaborators;
        }
    }

    const collaborators = [];
    let requiresDialogExtraction = false;
    let partialCollaboratorsForEnrichment = [];
    const linkScope = card || element;
    const cacheTarget = card || element;
    let expectedCollaboratorCount = 0;
    if (card?.getAttribute) {
        expectedCollaboratorCount = parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0;
    }

    /**
     * Assign handles/IDs from anchor elements to collaborators sequentially.
     * This matches YouTube's DOM ordering where the first name corresponds to the first anchor, etc.
     */
    function hydrateCollaboratorsFromLinks(targetCollaborators) {
        if (!targetCollaborators || targetCollaborators.length === 0) return;
        const linkSelectors = 'a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), a[href*="/channel/UC"], a[href*="/c/"], a[href*="/user/"]';
        const links = linkScope?.querySelectorAll(linkSelectors) || [];
        if (links.length === 0) return;

        let linkIndex = 0;
        targetCollaborators.forEach(collaborator => {
            while (linkIndex < links.length) {
                const link = links[linkIndex++];
                if (!link) continue;
                const href = link.getAttribute('href') || link.href || '';
                if (!href) continue;

                if (!collaborator.handle) {
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        collaborator.handle = normalizeHandleValue(extracted);
                    }
                }

                if (!collaborator.id) {
                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch) {
                        collaborator.id = ucMatch[1]; // Preserve original case
                    }
                }

                break;
            }
        });
    }

    function cacheResultAndMaybeEnrich({
        triggerEnrichment = false,
        expectedCountHint = 0,
        partialCollaborators = [],
        videoIdHint = '',
        videoCardRef = null
    } = {}) {
        const cacheTarget = card || element;
        const targetCard = videoCardRef || card || (cacheTarget ? findVideoCardElement(cacheTarget) : null);
        const sanitized = sanitizeCollaboratorList(collaborators);
        let bestList = sanitized;

        if (cacheTarget) {
            const existing = getCachedCollaboratorsFromCard(cacheTarget);
            if (existing.length > 0) {
                const newScore = getCollaboratorListQuality(sanitized);
                const existingScore = getCollaboratorListQuality(existing);
                if (existingScore > newScore) {
                    bestList = existing;
                }
            }

            if (bestList.length > 0) {
                try {
                    cacheTarget.setAttribute('data-filtertube-collaborators', JSON.stringify(bestList));
                } catch (err) {
                    console.warn('FilterTube: Failed to cache collaborator metadata:', err);
                }
            }

            const resolvedExpected = Math.max(
                expectedCountHint || 0,
                parseInt(cacheTarget.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0,
                bestList.length
            );

            if (resolvedExpected > 0) {
                cacheTarget.setAttribute('data-filtertube-expected-collaborators', String(resolvedExpected));
            }
        }

        collaborators.length = 0;
        Array.prototype.push.apply(collaborators, bestList);

        const resolvedExpected = Math.max(
            expectedCountHint || 0,
            parseInt(cacheTarget?.getAttribute?.('data-filtertube-expected-collaborators') || '0', 10) || 0,
            bestList.length
        );

        if (!triggerEnrichment && targetCard && bestList.length > 0) {
            const resolvedVideoId = videoIdHint || ensureVideoIdForCard(targetCard);
            if (resolvedVideoId) {
                const existingResolved = resolvedCollaboratorsByVideoId.get(resolvedVideoId);
                if (getCollaboratorListQuality(bestList) >= getCollaboratorListQuality(existingResolved)) {
                    resolvedCollaboratorsByVideoId.set(resolvedVideoId, bestList);
                }
                applyResolvedCollaborators(resolvedVideoId, bestList, {
                    expectedCount: resolvedExpected,
                    sourceCard: targetCard
                });
            }
        }

        if (triggerEnrichment && cacheTarget) {
            const enrichmentTarget = cacheTarget;
            const videoId = videoIdHint || (targetCard ? ensureVideoIdForCard(targetCard) : ensureVideoIdForCard(cacheTarget));
            const enrichmentSeed = partialCollaborators.length > 0
                ? partialCollaborators
                : (bestList.length > 0 ? bestList.slice(0, Math.min(bestList.length, 2)) : []);
            requestCollaboratorEnrichment(cacheTarget, videoId, enrichmentSeed);
        }
    }

    // Method 1: Check for #attributed-channel-name (collaboration indicator)
    const attributedContainer = element.querySelector('#attributed-channel-name, [id="attributed-channel-name"]');

    if (attributedContainer) {
        const ytTextViewModel = attributedContainer.querySelector('yt-text-view-model');
        if (ytTextViewModel) {
            const attributedString = ytTextViewModel.querySelector('.yt-core-attributed-string');
            if (attributedString) {
                const parsed = parseCollaboratorNames(attributedString.textContent || '');
                if (parsed.names.length > 0) {
                    parsed.names.forEach(name => collaborators.push({ name, handle: '', id: '' }));
                    hydrateCollaboratorsFromLinks(collaborators);
                    requiresDialogExtraction = requiresDialogExtraction || parsed.hasHiddenCollaborators;
                    expectedCollaboratorCount = Math.max(expectedCollaboratorCount, parsed.names.length + parsed.hiddenCount);
                }
            }
        }

        if (collaborators.length === 0) {
            const linkSelectors = 'a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), a[href*="/channel/UC"], a[href*="/user/"], a[href*="/c/"]';
            const links = attributedContainer.querySelectorAll(linkSelectors);
            const seenKeys = new Set();

            links.forEach(link => {
                const href = link.getAttribute('href') || link.href || '';
                const name = link.textContent?.trim() || '';
                const handleValue = normalizeHandleValue(extractHandleFromString(href) || extractHandleFromString(name));
                const id = extractChannelIdFromString(href) || '';
                const key = (handleValue || '').toLowerCase() || id || name.toLowerCase();
                if (!key || seenKeys.has(key)) return;

                collaborators.push({
                    name,
                    handle: handleValue || '',
                    id
                });
                seenKeys.add(key);
            });
            if (collaborators.length > 0) {
                expectedCollaboratorCount = Math.max(expectedCollaboratorCount, collaborators.length);
            }
        }
    }

    // Method 2: Fallback via #channel-name
    if (collaborators.length === 0) {
        const channelNameEl = element.querySelector('#channel-name, ytd-channel-name, .ytd-channel-name');
        if (channelNameEl) {
            const parsed = parseCollaboratorNames(channelNameEl.textContent?.trim() || '');
            if (parsed.names.length > 1) {
                parsed.names.forEach(name => collaborators.push({ name, handle: '', id: '' }));
                hydrateCollaboratorsFromLinks(collaborators);
                requiresDialogExtraction = requiresDialogExtraction || parsed.hasHiddenCollaborators;
                expectedCollaboratorCount = Math.max(expectedCollaboratorCount, parsed.names.length + parsed.hiddenCount);
            }
        }
    }

    // Method 3: Avatar stack detection / enrichment
    const avatarStack = card?.querySelector?.('yt-avatar-stack-view-model');
    if (avatarStack) {
        const stackCollaborators = extractCollaboratorsFromAvatarStackElement(avatarStack);
        if (stackCollaborators.length > 0) {
            if (collaborators.length === 0) {
                Array.prototype.push.apply(collaborators, stackCollaborators);
            } else {
                const merged = mergeCollaboratorLists(collaborators, stackCollaborators);
                collaborators.length = 0;
                Array.prototype.push.apply(collaborators, merged);
            }
            expectedCollaboratorCount = Math.max(expectedCollaboratorCount, stackCollaborators.length, expectedCollaboratorCount);
        }
    }

    if (collaborators.length > 0) {
        const missingIdentifiers = collaborators.some(c => !c.handle && !c.id);
        const needsMoreCollaborators = expectedCollaboratorCount > 0 && collaborators.length < expectedCollaboratorCount;
        if (missingIdentifiers || needsMoreCollaborators) {
            requiresDialogExtraction = true;
        }
    } else if (expectedCollaboratorCount > 0) {
        requiresDialogExtraction = true;
    }

    const enrichmentSeed = collaborators.length > 0
        ? collaborators.slice(0, Math.min(collaborators.length, 2))
        : partialCollaboratorsForEnrichment;

    cacheResultAndMaybeEnrich({
        triggerEnrichment: requiresDialogExtraction && Boolean(card || element),
        expectedCountHint: expectedCollaboratorCount,
        partialCollaborators: enrichmentSeed,
        videoIdHint: card ? ensureVideoIdForCard(card) : '',
        videoCardRef: card
    });

    return collaborators;
}

function normalizeHandleForComparison(handle) {
    if (!handle || typeof handle !== 'string') return '';
    const normalized = normalizeHandleValue(handle);
    return normalized ? normalized.toLowerCase() : '';
}

function channelMatchesFilter(meta, filterChannel, channelMap = {}) {
    // Safety: Don't match against empty or invalid filters
    if (!filterChannel) return false;

    const metaHandles = new Set();
    const addMetaHandle = (value) => {
        const normalized = normalizeHandleForComparison(value);
        if (normalized) metaHandles.add(normalized);
    };
    addMetaHandle(meta.handle);
    addMetaHandle(meta.canonicalHandle);
    addMetaHandle(meta.handleDisplay);

    const filterHandles = new Set();
    const addFilterHandle = (value) => {
        const normalized = normalizeHandleForComparison(value);
        if (normalized) filterHandles.add(normalized);
    };

    // Handle new object format: { name, id, handle }
    if (typeof filterChannel === 'object' && filterChannel !== null) {
        const filterId = (filterChannel.id || '').toLowerCase();
        const filterHandle = (filterChannel.handle || '').toLowerCase();
        const filterName = (filterChannel.name || '').toLowerCase().trim();

        addFilterHandle(filterChannel.handle);
        addFilterHandle(filterChannel.canonicalHandle);
        addFilterHandle(filterChannel.handleDisplay);

        // Safety: If ID, handle, and name are all empty, don't match anything
        if (!filterId && filterHandles.size === 0 && !filterName) return false;

        const metaId = (meta.id || '').toLowerCase();
        const metaHandle = (meta.handle || '').toLowerCase();
        const metaName = (meta.name || '').toLowerCase().trim();

        // Direct match by UC ID
        if (filterId && metaId && metaId === filterId) {
            return true;
        }

        // Direct match by any handle variant
        if (filterHandles.size > 0 && metaHandles.size > 0) {
            for (const handle of filterHandles) {
                if (metaHandles.has(handle)) {
                    return true;
                }
            }
        }

        if (!filterId && filterHandles.size === 0 && !filterName) return false;

        // Backwards compatibility: filterHandle stored separately
        if (filterHandle && metaHandle && metaHandle === filterHandle) {
            return true;
        }

        // Name-based matching (for collaborators where we only have names)
        // Match if filter name matches meta name, or if filter name matches meta handle without @
        if (filterName && metaName && filterName === metaName) {
            return true;
        }

        // Match filter name against meta handle (e.g., filter "Veritasium" matches @veritasium)
        if (filterName && metaHandles.size > 0) {
            for (const handle of metaHandles) {
                const handleWithoutAt = handle.replace(/^@/, '');
                if (filterName === handleWithoutAt) {
                    return true;
                }
            }
        }

        if (filterHandles.size > 0 && metaName) {
            const normalizedMetaName = metaName.toLowerCase();
            for (const handle of filterHandles) {
                const handleWithoutAt = handle.replace(/^@/, '');
                if (handleWithoutAt === normalizedMetaName) {
                    return true;
                }
            }
        }

        // Cross-match using channelMap: blocking UC ID should also block its handles
        if (filterId && metaHandles.size > 0) {
            const mappedHandle = channelMap[filterId];
            if (mappedHandle) {
                const normalizedMappedHandle = normalizeHandleForComparison(mappedHandle);
                if (normalizedMappedHandle && metaHandles.has(normalizedMappedHandle)) {
                    return true;
                }
            }
        }

        // Cross-match using channelMap: blocking handle should also block its UC ID
        if (filterHandles.size > 0 && metaId) {
            for (const handle of filterHandles) {
                const mappedId = channelMap[handle];
                if (mappedId && mappedId.toLowerCase() === metaId) {
                    return true;
                }
            }
        }

        return false;
    }

    // Legacy string format
    if (!filterChannel || typeof filterChannel !== 'string') return false;
    const normalized = filterChannel.trim().toLowerCase();
    if (!normalized) return false;

    // Direct handle match
    if (normalized.startsWith('@')) {
        const normalizedHandle = normalizeHandleForComparison(normalized);
        if (normalizedHandle && metaHandles.has(normalizedHandle)) {
            return true;
        }

        // Check channelMap: if filter is a handle, get its UC ID and match
        // Keep the @ in the key to match filter_logic.js convention
        const mappedId = channelMap[normalized];
        if (mappedId && meta.id && meta.id.toLowerCase() === mappedId.toLowerCase()) {
            return true;
        }
    }

    // Direct UC ID match
    if (normalized.startsWith('uc')) {
        if (meta.id && meta.id === normalized) {
            return true;
        }

        // Check channelMap: if filter is UC ID, also match its handle
        const mappedHandle = channelMap[normalized];
        if (mappedHandle && meta.handle && meta.handle.toLowerCase() === mappedHandle) {
            return true;
        }
    }

    // Reverse check: if meta has handle, check if mapped ID matches filter
    if (meta.handle && normalized.startsWith('uc')) {
        const handleLower = meta.handle.toLowerCase();
        const mappedId = channelMap[handleLower];
        if (mappedId && mappedId === normalized) {
            return true;
        }
    }

    return false;
}

function normalizeTextForMatching(value) {
    if (!value || typeof value !== 'string') return '';

    let normalized = value;
    try {
        normalized = value.normalize('NFKD');
    } catch (error) {
        // Some environments may not support String.prototype.normalize
        normalized = value;
    }

    // Strip combining marks and zero-width joiners/variation selectors that can interfere with matching
    normalized = normalized.replace(/[\u0300-\u036f]/g, '');
    normalized = normalized.replace(/[\u200D\uFE0E\uFE0F]/g, '');
    return normalized;
}

function extractPlainKeyword(keywordData) {
    if (!keywordData) return '';

    if (keywordData instanceof RegExp) {
        return keywordData.source.replace(/\\b/g, '').replace(/\\/g, '');
    }

    if (keywordData.pattern) {
        return keywordData.pattern.replace(/\\b/g, '').replace(/\\/g, '');
    }

    if (typeof keywordData === 'string') {
        return keywordData;
    }

    return '';
}

function isAlphanumeric(char) {
    if (!char) return false;

    if (char.length !== 1) return false;

    const code = char.charCodeAt(0);
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        return true;
    }

    // Basic heuristic for extended Unicode letters
    return char.toUpperCase() !== char.toLowerCase();
}

function matchesKeyword(regex, rawText, keywordData) {
    if (!rawText) return false;

    regex.lastIndex = 0;
    if (regex.test(rawText)) {
        return true;
    }

    const normalized = normalizeTextForMatching(rawText);
    if (normalized && normalized !== rawText) {
        regex.lastIndex = 0;
        return regex.test(normalized);
    }

    const plainKeyword = extractPlainKeyword(keywordData);
    if (plainKeyword) {
        const normalizedKeyword = normalizeTextForMatching(plainKeyword).toLowerCase();
        const normalizedText = normalized.toLowerCase();

        if (normalizedKeyword && normalizedText.includes(normalizedKeyword)) {
            const index = normalizedText.indexOf(normalizedKeyword);
            const beforeChar = index > 0 ? normalizedText[index - 1] : '';
            const afterCharIndex = index + normalizedKeyword.length;
            const afterChar = afterCharIndex < normalizedText.length ? normalizedText[afterCharIndex] : '';

            const hasLeftBoundary = !beforeChar || !isAlphanumeric(beforeChar);
            const hasRightBoundary = !afterChar || !isAlphanumeric(afterChar);

            if (hasLeftBoundary || hasRightBoundary) {
                return true;
            }
        }
    }

    return false;
}

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
            element.style.display = '';
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

// ============================================================================
// FALLBACK FILTERING LOGIC
// ============================================================================

function handleCommentsFallback(settings) {
    const commentSections = document.querySelectorAll('#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"], ytd-comment-thread-renderer');

    commentSections.forEach(section => {
        // 1. Global Hide
        if (settings.hideAllComments) {
            toggleVisibility(section, true, 'Hide All Comments');
            return;
        }

        // 2. Restore if global hide disabled
        if (!settings.filterComments && !settings.hideAllComments) {
            toggleVisibility(section, false);

            // Also restore all individual comments that were hidden by keyword filtering
            const comments = section.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, ytd-comment-thread-renderer');
            comments.forEach(comment => {
                toggleVisibility(comment, false);
            });
        }

        // 3. Content Filtering
        if (settings.filterComments && settings.filterKeywords?.length > 0) {
            const comments = section.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, ytd-comment-thread-renderer');
            let visibleCount = 0;

            comments.forEach(comment => {
                const commentText = comment.textContent || '';
                const channelName = comment.querySelector('#author-text, #channel-name, yt-formatted-string')?.textContent || '';

                const shouldHide = shouldHideContent(commentText, channelName, settings);
                toggleVisibility(comment, shouldHide, 'Comment Filter');

                if (!shouldHide) visibleCount++;
            });
        }
    });
}

// DOM fallback function that processes already-rendered content
function applyDOMFallback(settings, options = {}) {
    const effectiveSettings = settings || currentSettings;
    if (!effectiveSettings || typeof effectiveSettings !== 'object') return;

    currentSettings = effectiveSettings;

    const { forceReprocess = false, preserveScroll = true } = options;

    // Start tracking hide/restore operations
    filteringTracker.reset();

    // Removed diagnostic logging - issue identified and fixed
    const scrollingElement = document.scrollingElement || document.documentElement || document.body;
    const previousScrollTop = scrollingElement ? scrollingElement.scrollTop : window.pageYOffset;
    const previousScrollLeft = scrollingElement ? scrollingElement.scrollLeft : window.pageXOffset;
    ensureStyles();

    // 1. Video/Content Filtering
    const videoElements = document.querySelectorAll(VIDEO_CARD_SELECTORS);

    videoElements.forEach(element => {
        const alreadyProcessed = element.hasAttribute('data-filtertube-processed');
        const uniqueId = element.getAttribute('data-filtertube-unique-id') || extractVideoIdFromCard(element) || '';
        const lastProcessedId = element.getAttribute('data-filtertube-last-processed-id') || '';
        const contentChanged = alreadyProcessed && uniqueId && lastProcessedId && uniqueId !== lastProcessedId;

        if ((forceReprocess || contentChanged) && alreadyProcessed) {
            element.removeAttribute('data-filtertube-processed');
            element.removeAttribute('data-filtertube-last-processed-id');
            clearCachedChannelMetadata(element);
        } else if (contentChanged) {
            clearCachedChannelMetadata(element);
        }

        if (alreadyProcessed && !forceReprocess && !contentChanged) {
            // Skip already processed elements to avoid duplicate counting
            return;
        }

        // Extract Metadata
        const titleElement = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, .metadata-snippet-container #video-title, #video-title-link, .yt-lockup-metadata-view-model-wiz__title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset, yt-formatted-string#title, span#title');
        const channelElement = element.querySelector('#channel-name a, .ytd-channel-name a, ytd-channel-name a, #text, .ytd-video-owner-renderer a, .yt-lockup-metadata-view-model-wiz__metadata, .yt-content-metadata-view-model__metadata-text, yt-formatted-string[slot="subtitle"], .watch-card-tertiary-text a');
        const channelSubtitleElement = element.querySelector('#watch-card-subtitle, #watch-card-subtitle yt-formatted-string');
        const channelAnchor = (channelElement || channelSubtitleElement)?.closest('a') || element.querySelector('a[href*="/channel"], a[href^="/@"], a[href*="/user/"], a[href*="/c/"]');

        let title = titleElement?.textContent?.trim() || '';
        if (!title) {
            const ownAriaLabel = element.getAttribute('aria-label');
            if (ownAriaLabel) {
                title = ownAriaLabel.trim();
            }
        }
        if (!title) {
            const labelledById = element.getAttribute('aria-labelledby');
            if (labelledById) {
                const labelSource = document.getElementById(labelledById.trim());
                if (labelSource?.textContent) {
                    title = labelSource.textContent.trim();
                }
            }
        }
        if (!title) {
            const titledAnchor = element.querySelector('a[title]');
            if (titledAnchor?.getAttribute) {
                const anchorTitle = titledAnchor.getAttribute('title');
                if (anchorTitle) {
                    title = anchorTitle.trim();
                }
            }
        }
        const channelPrimaryText = channelElement?.textContent?.trim() || '';
        const channelSubtitleText = channelSubtitleElement?.textContent?.trim() || '';
        const channel = [channelPrimaryText, channelSubtitleText].filter(Boolean).join(' | ');
        const channelHref = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
        const relatedElements = [channelAnchor, channelElement, channelSubtitleElement];
        const channelMeta = extractChannelMetadataFromElement(element, channel, channelHref, {
            cacheTarget: channelAnchor || element,
            relatedElements
        });
        const collaboratorMetas = extractCollaboratorMetadataFromElement(element);

        // Determine Visibility
        const elementTag = element.tagName.toLowerCase();
        const shortThumbnailAnchor = element.querySelector('#thumbnail[href^="/shorts"], #video-title[href^="/shorts"], a[href^="/shorts/"]');
        const shortOverlay = element.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"], badge-shape[aria-label="Shorts"]');
        const shortBadgeText = element.querySelector('.yt-badge-shape__text')?.textContent?.trim()?.toLowerCase() || '';
        const shortBadgeDetected = shortBadgeText.includes('short');

        const isShortVideoRenderer = elementTag === 'ytd-video-renderer' && (
            element.hasAttribute('is-shorts-video') ||
            Boolean(shortThumbnailAnchor) ||
            Boolean(shortOverlay) ||
            shortBadgeDetected
        );

        if (isShortVideoRenderer) {
            element.setAttribute('data-filtertube-short', 'true');
        } else {
            element.removeAttribute('data-filtertube-short');
        }

        const skipKeywordFiltering = CHANNEL_ONLY_TAGS.has(elementTag);
        const matchesFilters = shouldHideContent(title, channel, effectiveSettings, {
            skipKeywords: skipKeywordFiltering,
            channelHref,
            channelMeta,
            collaborators: collaboratorMetas
        });

        // Handle Container Logic (e.g., rich-grid-media inside rich-item)
        let targetToHide = element;
        if (elementTag === 'ytd-rich-grid-media') {
            const parent = element.closest('ytd-rich-item-renderer');
            if (parent) targetToHide = parent;
        } else if (elementTag === 'yt-lockup-view-model' || elementTag === 'yt-lockup-metadata-view-model') {
            const parent = element.closest('ytd-rich-item-renderer');
            if (parent) targetToHide = parent;
        }

        let hideReason = `Content: ${title}`;
        let shouldHide = matchesFilters;

        if (isShortVideoRenderer) {
            const hideByGlobalShorts = Boolean(effectiveSettings.hideAllShorts);

            if (hideByGlobalShorts) {
                shouldHide = true;
                hideReason = 'Shorts hidden globally';
                targetToHide.setAttribute('data-filtertube-hidden-by-hide-all-shorts', 'true');
                targetToHide.removeAttribute('data-filtertube-hidden-by-keyword');
            } else {
                targetToHide.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');

                if (matchesFilters) {
                    targetToHide.setAttribute('data-filtertube-hidden-by-keyword', 'true');
                } else {
                    targetToHide.removeAttribute('data-filtertube-hidden-by-keyword');
                }
            }
        }

        toggleVisibility(targetToHide, shouldHide, hideReason);
        element.setAttribute('data-filtertube-processed', 'true');
        if (uniqueId) {
            element.setAttribute('data-filtertube-last-processed-id', uniqueId);
        } else {
            element.removeAttribute('data-filtertube-last-processed-id');
        }
    });

    // Inline survey containers embed filtered videos; hide shell when everything inside is hidden
    document.querySelectorAll('ytd-inline-survey-renderer').forEach(survey => {
        const embeddedItems = survey.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer');
        if (embeddedItems.length === 0) return;

        const hasVisibleItem = Array.from(embeddedItems).some(item =>
            !(item.classList.contains('filtertube-hidden') || item.hasAttribute('data-filtertube-hidden'))
        );

        const shouldHideSurvey = !hasVisibleItem;
        // SKIP STATS: This is just a wrapper/container cleanup
        toggleVisibility(survey, shouldHideSurvey, 'Inline Survey Shell', true);

        const sectionContainer = survey.closest('ytd-rich-section-renderer');
        if (sectionContainer) {
            // SKIP STATS: Wrapper cleanup
            toggleVisibility(sectionContainer, shouldHideSurvey, 'Inline Survey Section', true);
        }
    });

    // 2. Chip Filtering (Home/Search chip bars)
    document.querySelectorAll('yt-chip-cloud-chip-renderer').forEach(chip => {
        const label = chip.textContent?.trim() || '';
        const hideChip = shouldHideContent(label, '', effectiveSettings);
        toggleVisibility(chip, hideChip, `Chip: ${label}`);
    });

    // Hide any rich items that ended up empty after filtering to avoid blank cards
    document.querySelectorAll('ytd-rich-item-renderer').forEach(item => {
        const contentEl = item.querySelector('#content');
        if (!contentEl) return;
        const hasVisibleChild = Array.from(contentEl.children).some(child => child.offsetParent !== null);
        if (!hasVisibleChild && !item.hasAttribute('data-filtertube-hidden')) {
            // SKIP STATS: This is container cleanup, not actual content filtering
            // The actual video inside was already counted when it was hidden
            toggleVisibility(item, true, 'Empty Rich Item', true);
        }
    });

    // 3. Shorts Filtering
    const shortsContainerSelectors = 'grid-shelf-view-model, ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer';
    const shortContainers = document.querySelectorAll(shortsContainerSelectors);

    // Also target the Shorts guide entry in the sidebar
    const shortsGuideEntries = document.querySelectorAll('ytd-guide-entry-renderer a[title="Shorts"]');
    const shortsGuideRenderers = Array.from(shortsGuideEntries).map(a => a.closest('ytd-guide-entry-renderer')).filter(Boolean);

    const allShortsElements = [...shortContainers, ...shortsGuideRenderers];

    if (effectiveSettings.hideAllShorts) {
        allShortsElements.forEach(container => {
            container.setAttribute('data-filtertube-hidden-by-hide-all-shorts', 'true');
            // SKIP STATS: Container hiding - individual shorts inside are counted separately
            toggleVisibility(container, true, 'Hide Shorts container', true);
        });
    } else {
        allShortsElements.forEach(container => {
            if (container.hasAttribute('data-filtertube-hidden-by-hide-all-shorts')) {
                container.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
                // Only unhide if it's not also hidden by a shelf title
                if (!container.hasAttribute('data-filtertube-hidden-by-shelf-title')) {
                    // SKIP STATS: Container unhiding
                    toggleVisibility(container, false, '', true);
                }
            }
        });
    }

    const shortsSelectors = 'ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2';
    document.querySelectorAll(shortsSelectors).forEach(element => {
        let target = element;
        // 1. Check for Desktop container (ytd-rich-item-renderer)
        const richItemParent = element.closest('ytd-rich-item-renderer');
        if (richItemParent) {
            target = richItemParent;
        }
        // 2. Check for Grid Shelf container (The specific issue you found)
        // This div holds the width/margin styles, so we MUST hide this to collapse the gap
        else {
            const gridShelfItem = element.closest('.ytGridShelfViewModelGridShelfItem');
            if (gridShelfItem) {
                target = gridShelfItem;
            }
        }

        let title = '';
        const titleSelectors = [
            '#video-title',
            '.shortsLockupViewModelHostMetadataTitle',
            '.shortsLockupViewModelHostOutsideMetadataTitle',
            'a[title]',
            'h3',
            'yt-formatted-string[role="text"]',
            'span[role="text"]'
        ];

        for (const selector of titleSelectors) {
            const node = element.querySelector(selector);
            const text = node?.textContent?.trim();
            if (text) {
                title = text;
                break;
            }
        }

        if (!title) {
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel) title = ariaLabel.trim();
        }

        // Check if this element was blocked via 3-dot menu (has blocked channel attributes)
        const blockedChannelId = target.getAttribute('data-filtertube-blocked-channel-id');
        const blockedChannelHandle = target.getAttribute('data-filtertube-blocked-channel-handle');
        const blockedChannelState = target.getAttribute('data-filtertube-blocked-state');
        const blockedTimestamp = parseInt(target.getAttribute('data-filtertube-blocked-ts') || '0', 10);
        const blockAgeMs = blockedTimestamp ? Date.now() - blockedTimestamp : Number.POSITIVE_INFINITY;

        // If this card was blocked via 3-dot UI, honour pending/confirmed states
        if (blockedChannelId || blockedChannelHandle) {
            const isStillBlocked = effectiveSettings.filterChannels?.some(fc => {
                if (typeof fc === 'object') {
                    return (blockedChannelId && fc.id?.toLowerCase() === blockedChannelId.toLowerCase()) ||
                        (blockedChannelHandle && fc.handle?.toLowerCase() === blockedChannelHandle.toLowerCase());
                }
                const normalized = (fc || '').toLowerCase();
                return normalized === blockedChannelId?.toLowerCase() || normalized === blockedChannelHandle?.toLowerCase();
            });

            if (isStillBlocked) {
                // Keep it hidden - mark as confirmed so future passes don't treat it as pending
                markElementAsBlocked(target, {
                    id: blockedChannelId,
                    handle: blockedChannelHandle
                }, 'confirmed');
                toggleVisibility(target, true, `Blocked channel: ${blockedChannelHandle || blockedChannelId}`);
                return; // Skip further processing for this element
            } else {
                // If blocklist no longer contains this channel but the state is still pending,
                // keep it hidden for a short grace period to avoid flicker while background saves
                const waitForConfirmation = blockedChannelState === 'pending' && blockAgeMs < 2000;
                if (waitForConfirmation) {
                    toggleVisibility(target, true, `Pending channel block: ${blockedChannelHandle || blockedChannelId}`);
                    return;
                }

                // Channel was unblocked, remove the attributes and let normal filtering proceed
                target.removeAttribute('data-filtertube-blocked-channel-id');
                target.removeAttribute('data-filtertube-blocked-channel-handle');
                target.removeAttribute('data-filtertube-blocked-state');
                target.removeAttribute('data-filtertube-blocked-ts');

                // Immediately restore visibility so layout snaps back before keyword logic reruns
                toggleVisibility(target, false, '', true);
            }
        }

        const channelAnchor = element.querySelector('a[href*="/channel"], a[href^="/@"], a[href*="/user/"], a[href*="/c/"]');
        const channelText = channelAnchor?.textContent?.trim() || '';
        const channelHref = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
        const channelMeta = extractChannelMetadataFromElement(element, channelText, channelHref, {
            cacheTarget: channelAnchor || element
        });

        const hideByKeywords = shouldHideContent(title, channelText, effectiveSettings, {
            channelHref,
            channelMeta
        });

        if (hideByKeywords) {
            target.setAttribute('data-filtertube-hidden-by-keyword', 'true');
        } else if (!effectiveSettings.hideAllShorts) {
            target.removeAttribute('data-filtertube-hidden-by-keyword');
        }

        const shouldHideShort = effectiveSettings.hideAllShorts || hideByKeywords;
        const reason = effectiveSettings.hideAllShorts ? 'Hide All Shorts' : `Short: ${title || channelText}`;
        toggleVisibility(target, shouldHideShort, reason);
    });

    // 4. Comments Filtering
    handleCommentsFallback(effectiveSettings);

    // 5. Container Cleanup (Shelves, Grids)
    // Hide shelves if all their items are hidden
    const shelves = document.querySelectorAll('ytd-shelf-renderer, ytd-rich-shelf-renderer, ytd-item-section-renderer, grid-shelf-view-model, yt-section-header-view-model');
    shelves.forEach(shelf => {
        const shelfTitle = extractShelfTitle(shelf);
        const shelfTitleMatches = shelfTitle && shouldHideContent(shelfTitle, '', effectiveSettings);

        if (shelfTitleMatches) {
            shelf.setAttribute('data-filtertube-hidden-by-shelf-title', 'true');
            toggleVisibility(shelf, true, `Shelf title: ${shelfTitle}`);
            return;
        }

        if (shelf.hasAttribute('data-filtertube-hidden-by-shelf-title')) {
            shelf.removeAttribute('data-filtertube-hidden-by-shelf-title');
            toggleVisibility(shelf, false);
        }

        updateContainerVisibility(shelf, 'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, .ytGridShelfViewModelGridShelfItem');
    });

    if (preserveScroll && scrollingElement) {
        if (typeof scrollingElement.scrollTo === 'function') {
            scrollingElement.scrollTo({ top: previousScrollTop, left: previousScrollLeft, behavior: 'instant' });
        } else {
            window.scrollTo(previousScrollLeft, previousScrollTop);
        }
    }

    // Log hide/restore summary
    filteringTracker.logSummary();
}

// Helper function to check if content should be hidden
function shouldHideContent(title, channel, settings, options = {}) {
    if (!title && !channel) return false;

    const {
        skipKeywords = false,
        channelHref = '',
        channelMeta: providedChannelMeta = null,
        collaborators = []
    } = options;
    const channelMeta = providedChannelMeta || buildChannelMetadata(channel, channelHref);
    const hasChannelIdentity = Boolean(channelMeta.handle || channelMeta.id);

    // Debug logging (disabled by default - set to true for troubleshooting)
    const debugFiltering = false;
    if (debugFiltering && (channelMeta.handle || channelMeta.id)) {
        console.log(`FilterTube DEBUG: Checking "${title.substring(0, 50)}..."`, {
            channelHandle: channelMeta.handle,
            channelId: channelMeta.id,
            hasFilters: settings.filterChannels?.length || 0,
            filterChannelsArray: settings.filterChannels,
            keywords: settings.filterKeywords?.length || 0
        });
    }

    // Keyword filtering
    if (!skipKeywords && settings.filterKeywords && settings.filterKeywords.length > 0) {
        for (const keywordData of settings.filterKeywords) {
            let regex;
            try {
                if (keywordData instanceof RegExp) {
                    regex = keywordData;
                } else if (keywordData.pattern) {
                    regex = new RegExp(keywordData.pattern, keywordData.flags);
                } else {
                    regex = new RegExp(keywordData.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                }
            } catch (error) {
                // debugLog('⚠️ Invalid keyword regex:', error);
                continue;
            }

            if (matchesKeyword(regex, title) || matchesKeyword(regex, channel)) {
                return true;
            }
        }
    }

    // Channel filtering
    if (settings.filterChannels && settings.filterChannels.length > 0 && (hasChannelIdentity || collaborators.length > 0)) {
        const channelMap = settings.channelMap || {};

        const collaboratorMetas = Array.isArray(collaborators) ? collaborators : [];

        // 1. Normal Check (Fast path - direct match or existing channelMap lookup)
        for (const filterChannel of settings.filterChannels) {
            if (hasChannelIdentity && channelMatchesFilter(channelMeta, filterChannel, channelMap)) {
                if (debugFiltering) {
                    console.log(`FilterTube DEBUG: MATCH FOUND! Video will be hidden.`, {
                        title: title.substring(0, 50),
                        videoChannel: channelMeta,
                        matchedFilter: filterChannel
                    });
                }
                return true;
            }

            if (collaboratorMetas.length > 0) {
                const collaboratorMatched = collaboratorMetas.some(collaborator => channelMatchesFilter(collaborator, filterChannel, channelMap));
                if (collaboratorMatched) {
                    if (debugFiltering) {
                        console.log(`FilterTube DEBUG: Collaborator match found. Video will be hidden.`, {
                            title: title.substring(0, 50),
                            collaborators: collaboratorMetas,
                            matchedFilter: filterChannel
                        });
                    }
                    return true;
                }
            }
        }

        // 2. Active Resolution (Safety net for missing mappings)
        // This runs when the blocklist has a Handle (e.g. @shakira) 
        // but the content on screen only shows a UC ID (UC...)
        if (channelMeta.id && !channelMeta.handle) {
            const contentId = channelMeta.id.toLowerCase();

            // Iterate through our blocked channels to see if we need to fetch any IDs
            for (const filterChannel of settings.filterChannels) {
                let filterHandle = null;

                // Extract handle from filter object/string
                if (typeof filterChannel === 'string' && filterChannel.startsWith('@')) {
                    filterHandle = filterChannel.toLowerCase();
                } else if (filterChannel && filterChannel.handle) {
                    filterHandle = filterChannel.handle.toLowerCase();
                }

                if (filterHandle) {
                    const handleKey = filterHandle.replace('@', ''); // "shakira"

                    // Check if we ALREADY know the ID for this blocked handle
                    // Try both format keys for safety
                    const knownId = channelMap[`@${handleKey}`] || channelMap[handleKey];

                    if (knownId) {
                        // If we have a map, 'channelMatchesFilter' (Step 1) would have caught it 
                        // if it matched. Since it didn't, this filter doesn't match this content.
                        continue;
                    }

                    // We DON'T know the ID for this blocked handle. 
                    // We must fetch it to see if it matches the current content ID.
                    const cachedState = resolvedHandleCache.get(handleKey);

                    if (!cachedState) {
                        // Not known, not fetching. Start async fetch now.
                        fetchIdForHandle(filterHandle);
                    } else if (cachedState !== 'PENDING') {
                        // We just resolved it in memory! Check if it matches.
                        if (cachedState.toLowerCase() === contentId) {
                            return true; // Match found via active resolution
                        }
                    }
                }
            }
        }
    }

    return false;
}

// ============================================================================
// COMMUNICATION & INIT
// ============================================================================

browserAPI_BRIDGE.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request) return;

    if (request.action === 'FilterTube_RefreshNow') {
        debugLog('🔄 Refresh requested via runtime messaging');
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: true });
            }
        });
        sendResponse?.({ acknowledged: true });
    } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
        debugLog('⚡ Applying settings pushed from UI');
        sendSettingsToMainWorld(request.settings);
        applyDOMFallback(request.settings, { forceReprocess: true });
        sendResponse?.({ acknowledged: true });
    }
});

let scriptsInjected = false;
let injectionInProgress = false;
let pendingSeedSettings = null;
let seedListenerAttached = false;

async function injectMainWorldScripts() {
    if (scriptsInjected || injectionInProgress) return;
    injectionInProgress = true;

    const scriptsToInject = ['filter_logic'];
    if (IS_FIREFOX_BRIDGE) scriptsToInject.push('seed');
    scriptsToInject.push('injector');

    try {
        if (!IS_FIREFOX_BRIDGE && browserAPI_BRIDGE.scripting?.executeScript) {
            await injectViaScriptingAPI(scriptsToInject);
        } else {
            await injectViaFallback(scriptsToInject);
        }
        scriptsInjected = true;
        setTimeout(() => requestSettingsFromBackground(), 100);
    } catch (error) {
        debugLog("❌ Script injection failed:", error);
        injectionInProgress = false;
    }
    injectionInProgress = false;
}

async function injectViaScriptingAPI(scripts) {
    return new Promise((resolve, reject) => {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: "injectScripts",
            scripts: scripts
        }, (response) => {
            if (browserAPI_BRIDGE.runtime.lastError || !response?.success) {
                reject(new Error(browserAPI_BRIDGE.runtime.lastError?.message || response?.error));
            } else {
                resolve();
            }
        });
    });
}

async function injectViaFallback(scripts) {
    return new Promise((resolve) => {
        let currentIndex = 0;
        function injectNext() {
            if (currentIndex >= scripts.length) {
                resolve();
                return;
            }
            const scriptName = scripts[currentIndex];
            const script = document.createElement('script');
            script.src = browserAPI_BRIDGE.runtime.getURL(`js/${scriptName}.js`);
            script.onload = () => {
                currentIndex++;
                setTimeout(injectNext, 50);
            };
            (document.head || document.documentElement).appendChild(script);
        }
        injectNext();
    });
}

function requestSettingsFromBackground() {
    return new Promise((resolve) => {
        browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings" }, (response) => {
            if (response && !response.error) {
                sendSettingsToMainWorld(response);
                resolve({ success: true, settings: response });
            } else {
                resolve({ success: false });
            }
        });
    });
}

function tryApplySettingsToSeed(settings) {
    if (window.filterTube?.updateSettings) {
        try {
            window.filterTube.updateSettings(settings);
            pendingSeedSettings = null;
            return true;
        } catch (error) {
            debugLog('❌ Failed to forward settings to seed.js:', error);
        }
    }
    return false;
}

function ensureSeedReadyListener() {
    if (seedListenerAttached) return;
    seedListenerAttached = true;
    window.addEventListener('filterTubeSeedReady', () => {
        if (pendingSeedSettings) {
            tryApplySettingsToSeed(pendingSeedSettings);
        }
    });
}

function scheduleSeedRetry() {
    setTimeout(() => {
        if (pendingSeedSettings) {
            if (!tryApplySettingsToSeed(pendingSeedSettings)) {
                scheduleSeedRetry();
            }
        }
    }, 250);
}

function sendSettingsToMainWorld(settings) {
    latestSettings = settings;
    currentSettings = settings;
    window.postMessage({
        type: 'FilterTube_SettingsToInjector',
        payload: settings,
        source: 'content_bridge'
    }, '*');

    if (!tryApplySettingsToSeed(settings)) {
        pendingSeedSettings = settings;
        ensureSeedReadyListener();
        scheduleSeedRetry();
    }
}

// Pending collaborator info requests (for async message-based lookup)
const pendingCollaboratorRequests = new Map();
let collaboratorRequestId = 0;

// Pending single-channel info requests (for ytInitialData lookup in MAIN world)
const pendingChannelInfoRequests = new Map();
let channelInfoRequestId = 0;

/**
 * Request collaborator info from Main World (injector.js) via message passing
 * This is needed because content_bridge.js runs in Isolated World and cannot access window.ytInitialData
 * @param {string} videoId - The YouTube video ID to look up
 * @returns {Promise<Array|null>} - Array of collaborator objects or null
 */
function requestCollaboratorInfoFromMainWorld(videoId) {
    return new Promise((resolve) => {
        const requestId = ++collaboratorRequestId;
        const timeoutMs = 2000; // 2 second timeout

        // Set up timeout
        const timeoutId = setTimeout(() => {
            if (pendingCollaboratorRequests.has(requestId)) {
                pendingCollaboratorRequests.delete(requestId);
                console.log('FilterTube: Collaborator info request timed out for video:', videoId);
                resolve(null);
            }
        }, timeoutMs);

        // Store the pending request
        pendingCollaboratorRequests.set(requestId, { resolve, timeoutId, videoId });

        const sendRequest = () => {
            window.postMessage({
                type: 'FilterTube_RequestCollaboratorInfo',
                payload: { videoId, requestId },
                source: 'content_bridge'
            }, '*');
        };

        sendRequest();
        setTimeout(() => {
            if (pendingCollaboratorRequests.has(requestId)) {
                sendRequest();
            }
        }, 250);
        setTimeout(() => {
            if (pendingCollaboratorRequests.has(requestId)) {
                sendRequest();
            }
        }, 1000);

        console.log('FilterTube: Sent collaborator info request to Main World for video:', videoId);
    });
}

function requestChannelInfoFromMainWorld(videoId, options = {}) {
    return new Promise((resolve) => {
        const requestId = ++channelInfoRequestId;
        const timeoutMs = 2000; // 2 second timeout

        const timeoutId = setTimeout(() => {
            const pending = pendingChannelInfoRequests.get(requestId);
            if (pending) {
                pendingChannelInfoRequests.delete(requestId);
                console.log('FilterTube: Channel info request timed out for video:', videoId);
                resolve(null);
            }
        }, timeoutMs);

        pendingChannelInfoRequests.set(requestId, { resolve, timeoutId, videoId });

        const sendRequest = () => {
            window.postMessage({
                type: 'FilterTube_RequestChannelInfo',
                payload: {
                    videoId,
                    requestId,
                    expectedHandle: options.expectedHandle || null,
                    expectedName: options.expectedName || null
                },
                source: 'content_bridge'
            }, '*');
        };

        sendRequest();
        setTimeout(() => {
            if (pendingChannelInfoRequests.has(requestId)) {
                sendRequest();
            }
        }, 250);
        setTimeout(() => {
            if (pendingChannelInfoRequests.has(requestId)) {
                sendRequest();
            }
        }, 1000);

        console.log('FilterTube: Sent channel info request to Main World for video:', videoId, 'expectedName:', options.expectedName || 'n/a');
    });
}

/**
 * Normalize collaborator names for comparison
 * @param {string} name
 * @returns {string}
 */
function normalizeCollaboratorName(name) {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Merge collaborator data from Main World into the DOM-derived structures
 * @param {Object} initialChannelInfo
 * @param {Array} mainWorldCollaborators
 */
function mergeCollaboratorsWithMainWorld(initialChannelInfo, mainWorldCollaborators) {
    if (!initialChannelInfo?.allCollaborators || initialChannelInfo.allCollaborators.length === 0) {
        return;
    }

    if (!Array.isArray(mainWorldCollaborators) || mainWorldCollaborators.length === 0) {
        return;
    }

    const usedIndices = new Set();
    const tryMatch = (predicate) => {
        for (let i = 0; i < mainWorldCollaborators.length; i++) {
            if (usedIndices.has(i)) continue;
            const candidate = mainWorldCollaborators[i];
            if (predicate(candidate)) {
                usedIndices.add(i);
                return candidate;
            }
        }
        return null;
    };

    initialChannelInfo.allCollaborators.forEach(collaborator => {
        if (!collaborator) return;

        const normalizedHandle = collaborator.handle?.toLowerCase();
        const normalizedId = collaborator.id?.toLowerCase();
        const normalizedName = normalizeCollaboratorName(collaborator.name);

        let match = null;
        if (normalizedHandle) {
            match = tryMatch(candidate => candidate.handle && candidate.handle.toLowerCase() === normalizedHandle);
        }
        if (!match && normalizedId) {
            match = tryMatch(candidate => candidate.id && candidate.id.toLowerCase() === normalizedId);
        }
        if (!match && normalizedName) {
            match = tryMatch(candidate => normalizeCollaboratorName(candidate.name) === normalizedName);
        }
        if (!match) {
            match = tryMatch(() => true);
        }

        if (match) {
            if (match.handle) collaborator.handle = match.handle;
            if (match.id) collaborator.id = match.id;
            if (match.name) collaborator.name = match.name;
        }
    });

    const primary = initialChannelInfo.allCollaborators[0];
    if (primary) {
        initialChannelInfo.handle = primary.handle || initialChannelInfo.handle;
        initialChannelInfo.id = primary.id || initialChannelInfo.id;
        initialChannelInfo.name = primary.name || initialChannelInfo.name;
    }

    initialChannelInfo.needsEnrichment = false;
}

/**
 * Ensure collaborator data is enriched from ytInitialData (Main World)
 * @param {Object} initialChannelInfo
 * @returns {Promise<Array|null>}
 */
async function enrichCollaboratorsWithMainWorld(initialChannelInfo) {
    if (!initialChannelInfo?.isCollaboration || !initialChannelInfo.videoId) {
        return null;
    }

    try {
        const mainWorldCollaborators = await requestCollaboratorInfoFromMainWorld(initialChannelInfo.videoId);
        if (mainWorldCollaborators && mainWorldCollaborators.length > 0) {
            console.log('FilterTube: Received collaborator info from Main World:', mainWorldCollaborators);
            mergeCollaboratorsWithMainWorld(initialChannelInfo, mainWorldCollaborators);
        } else {
            console.log('FilterTube: No collaborator info received from Main World');
        }
        return mainWorldCollaborators;
    } catch (error) {
        console.error('FilterTube: Error enriching collaborator info from Main World:', error);
        return null;
    }
}

function handleMainWorldMessages(event) {
    if (event.source !== window || !event.data?.type?.startsWith('FilterTube_')) return;
    if (event.data.source === 'content_bridge') return;

    const { type, payload } = event.data;
    if (type === 'FilterTube_InjectorToBridge_Ready') {
        requestSettingsFromBackground();
    } else if (type === 'FilterTube_Refresh') {
        requestSettingsFromBackground().then(result => {
            if (result?.success) applyDOMFallback(result.settings, { forceReprocess: true });
        });
    } else if (type === 'FilterTube_UpdateChannelMap') {
        // Forward learned channel mappings to background for persistence
        persistChannelMappings(payload);
    } else if (type === 'FilterTube_CollaboratorInfoResponse') {
        // Handle response from Main World with collaborator info
        const { requestId, collaborators, videoId } = payload;
        const pending = pendingCollaboratorRequests.get(requestId);

        if (pending) {
            clearTimeout(pending.timeoutId);
            pendingCollaboratorRequests.delete(requestId);
            console.log('FilterTube: Received collaborator info response for video:', videoId, 'collaborators:', collaborators);
            pending.resolve(collaborators);
        }

        if (videoId && Array.isArray(collaborators) && collaborators.length > 0) {
            const expectedAttr = document.querySelector(`[data-filtertube-video-id="${videoId}"]`)?.getAttribute('data-filtertube-expected-collaborators') || '';
            const expectedCount = Math.max(
                parseInt(expectedAttr || '0', 10) || 0,
                collaborators.length
            );
            applyResolvedCollaborators(videoId, collaborators, {
                expectedCount,
                force: true
            });
        }
    } else if (type === 'FilterTube_ChannelInfoResponse') {
        // Handle response from Main World with single-channel info
        const { requestId, channel, videoId } = payload || {};
        const pending = pendingChannelInfoRequests.get(requestId);

        if (pending) {
            clearTimeout(pending.timeoutId);
            pendingChannelInfoRequests.delete(requestId);
            console.log('FilterTube: Received channel info response for video:', videoId, 'channel:', channel);
            pending.resolve(channel || null);
        }
    }
}

function handleStorageChanges(changes, area) {
    if (area !== 'local') return;
    const relevantKeys = ['filterKeywords', 'filterChannels', 'uiChannels', 'channelMap', 'hideAllComments', 'filterComments', 'hideAllShorts'];
    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {
        // FIX: Apply changes IMMEDIATELY without debounce
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                // Force immediate reprocess with no scroll preservation for instant feedback
                applyDOMFallback(result.settings, { forceReprocess: true });
            }
        });
    }
}

async function initialize() {
    try {
        initializeStats(); // Initialize statistics tracking
        await injectMainWorldScripts();
        const response = await requestSettingsFromBackground();
        if (response?.success) {
            initializeDOMFallback(response.settings);
        }
    } catch (error) {
        debugLog('❌ Error during initialization:', error);
    }
}

async function initializeDOMFallback(settings) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!settings) {
        const response = await requestSettingsFromBackground();
        settings = response?.settings;
    }
    if (settings) {
        applyDOMFallback(settings);

        // Set up a mutation observer to handle dynamic loading
        // We use a debounced version of the fallback to prevent performance issues
        const debouncedFallback = debounce(() => {
            applyDOMFallback(null);
        }, 200);

        let immediateFallbackScheduled = false;
        function scheduleImmediateFallback() {
            if (immediateFallbackScheduled) return;
            immediateFallbackScheduled = true;
            requestAnimationFrame(() => {
                immediateFallbackScheduled = false;
                applyDOMFallback(null);
            });
        }

        const observer = new MutationObserver(mutations => {
            let hasNewContent = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    hasNewContent = true;
                    break;
                }
            }

            if (hasNewContent) {
                scheduleImmediateFallback();
            } else {
                debouncedFallback();
            }
        });
        const observeTarget = () => {
            const target = document.body || document.documentElement;
            if (!target) return false;
            observer.observe(target, { childList: true, subtree: true });
            return true;
        };

        if (!observeTarget()) {
            document.addEventListener('DOMContentLoaded', () => {
                if (!observeTarget()) return;
                scheduleImmediateFallback();
            }, { once: true });
        }
    }
}

function injectCollaboratorPlaceholderMenu(newMenuList, oldMenuList) {
    const placeholderText = 'Fetching collaborators...';
    const placeholderChannel = {
        name: placeholderText,
        handle: '',
        id: '',
        isCollaboration: true,
        isPlaceholder: true,
        allCollaborators: [{
            name: placeholderText,
            handle: '',
            id: ''
        }]
    };

    const options = { preventNativeClick: true };

    if (newMenuList) {
        injectIntoNewMenu(newMenuList, placeholderChannel, null, null, options);
    } else if (oldMenuList) {
        injectIntoOldMenu(oldMenuList, placeholderChannel, null, null, options);
    }
}

// Debounce helper
function debounce(func, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, delay);
    };
}

// ==========================================
// 3-DOT MENU - BLOCK CHANNEL FEATURE
// ==========================================

/**
 * Recursively search ytInitialData for channel info associated with a video ID
 * NOTE: The actual search runs in MAIN world (injector.js); this function simply
 * proxies the request via postMessage and returns the result.
 * @param {string} videoId - The YouTube video ID to search for
 * @returns {Promise<Object|null>} - {handle, name} or {id, name} or null
 */
async function searchYtInitialDataForVideoChannel(videoId, options = null) {
    if (!videoId) {
        console.log('FilterTube: ytInitialData search skipped - no videoId');
        return null;
    }
    const resolvedOptions = typeof options === 'object' && options !== null
        ? options
        : { expectedHandle: options };
    const result = await requestChannelInfoFromMainWorld(videoId, resolvedOptions);
    if (!result) return null;

    if (resolvedOptions.expectedHandle) {
        const normalizedExpected = normalizeHandleValue(resolvedOptions.expectedHandle);
        const normalizedFound = normalizeHandleValue(result.handle);
        if (normalizedExpected && normalizedFound && normalizedExpected !== normalizedFound) {
            console.warn('FilterTube: ytInitialData handle mismatch, rejecting result', {
                expected: normalizedExpected,
                found: normalizedFound,
                videoId
            });
            return null;
        }
    }
    return result;
}

/**
 * Deeply inspect a ytInitialData-like object to find a channel browseId + @handle
 * using renderer-style traversal (videoRenderer, reelItemRenderer, lockupViewModel, etc.).
 *
 * This is intentionally generic and can be used for any page HTML that exposes
 * var ytInitialData = {...} (Shorts, watch, search, etc.). It returns the first
 * strong match it finds.
 *
 * @param {Object} initialData
 * @returns {{id?: string, handle?: string, name?: string} | null}
 */
function extractChannelFromInitialData(initialData) {
    if (!initialData || typeof initialData !== 'object') return null;

    const visited = new WeakSet();

    function searchNode(node) {
        if (!node || typeof node !== 'object' || visited.has(node)) return null;
        visited.add(node);

        // Normalize common shorts/home/watch renderer wrappers
        let candidate = node;
        if (candidate.videoRenderer) {
            candidate = candidate.videoRenderer;
        } else if (candidate.gridVideoRenderer) {
            candidate = candidate.gridVideoRenderer;
        } else if (candidate.compactVideoRenderer) {
            candidate = candidate.compactVideoRenderer;
        } else if (candidate.playlistVideoRenderer) {
            candidate = candidate.playlistVideoRenderer;
        } else if (candidate.reelItemRenderer) {
            candidate = candidate.reelItemRenderer;
        } else if (candidate.shortsLockupViewModel) {
            candidate = candidate.shortsLockupViewModel;
        } else if (candidate.shortsLockupViewModelV2) {
            candidate = candidate.shortsLockupViewModelV2;
        } else if (candidate.lockupViewModel) {
            candidate = candidate.lockupViewModel;
        } else if (candidate.richItemRenderer?.content?.videoRenderer) {
            candidate = candidate.richItemRenderer.content.videoRenderer;
        } else if (candidate.content?.videoRenderer) {
            candidate = candidate.content.videoRenderer;
        }

        // Try byline/owner-style fields similar to filter_logic.js
        const byline = candidate.shortBylineText || candidate.longBylineText || candidate.ownerText;
        if (byline?.runs && Array.isArray(byline.runs)) {
            for (const run of byline.runs) {
                const browse = run?.navigationEndpoint?.browseEndpoint;
                if (!browse) continue;

                const browseId = browse.browseId;
                if (!browseId || typeof browseId !== 'string' || !browseId.startsWith('UC')) continue;

                let handle = null;
                const canonical = browse.canonicalBaseUrl || browse.canonicalUrl || browse.url;
                if (typeof canonical === 'string') {
                    const extracted = extractRawHandle(canonical);
                    if (extracted) handle = extracted;
                }

                if (!handle && typeof run.text === 'string') {
                    const extracted = extractRawHandle(run.text);
                    if (extracted) handle = extracted;
                }

                if (handle) {
                    const name = run.text || '';
                    console.log('FilterTube: Found channel in ytInitialData (deep search):', { handle, id: browseId });
                    return { handle, id: browseId, name };
                }
            }
        }

        // Recurse through children
        if (Array.isArray(node)) {
            for (const child of node) {
                const found = searchNode(child);
                if (found) return found;
            }
        } else {
            for (const key in node) {
                if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                const value = node[key];
                if (value && typeof value === 'object') {
                    const found = searchNode(value);
                    if (found) return found;
                }
            }
        }

        return null;
    }

    return searchNode(initialData);
}

/**
 * Fetch channel information from a shorts URL
 * @param {string} videoId - The shorts video ID
 * @returns {Promise<Object|null>} - {handle, name} or null
 */
async function fetchChannelFromShortsUrl(videoId, requestedHandle = null) {
    // Check if there's already a pending fetch for this video
    if (pendingShortsFetches.has(videoId)) {
        console.log('FilterTube: Reusing existing fetch for shorts video:', videoId);
        return await pendingShortsFetches.get(videoId);
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
        try {
            console.log('FilterTube: Fetching shorts page for video:', videoId);
            const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'text/html'
                }
            });

            if (!response.ok) {
                console.error('FilterTube: Failed to fetch shorts page:', response.status);
                return null;
            }

            const html = await response.text();

            const normalizedExpected = normalizeHandleValue(requestedHandle);

            // Method 1: Extract from ytInitialData JSON in the HTML
            const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
            if (ytInitialDataMatch) {
                try {
                    const ytInitialData = JSON.parse(ytInitialDataMatch[1]);

                    // Look for channel info in various locations (engagement panels, overlay, etc.)
                    const engagementPanels = ytInitialData?.engagementPanels;
                    const overlay = ytInitialData?.overlay?.reelPlayerOverlayRenderer;

                    // Try to find channel info in engagement panels (common location)
                    if (engagementPanels && Array.isArray(engagementPanels)) {
                        for (const panel of engagementPanels) {
                            const header = panel?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer;
                            if (header?.menu?.menuRenderer?.items) {
                                for (const item of header.menu.menuRenderer.items) {
                                    const endpoint = item?.menuNavigationItemRenderer?.navigationEndpoint?.browseEndpoint;
                                    if (endpoint?.browseId && endpoint?.canonicalBaseUrl) {
                                        const handle = endpoint.canonicalBaseUrl.replace('/user/', '@').replace(/^\//, '');
                                        const id = endpoint.browseId && endpoint.browseId.startsWith('UC') ? endpoint.browseId : null;
                                        console.log('FilterTube: Found channel in ytInitialData (engagement panel):', { handle, id });
                                        if (normalizedExpected) {
                                            const normalizedFound = normalizeHandleValue(handle);
                                            if (!normalizedFound || normalizedFound !== normalizedExpected) {
                                                console.warn('FilterTube: Shorts engagement panel handle mismatch, rejecting', { expected: normalizedExpected, found: normalizedFound });
                                                continue;
                                            }
                                        }
                                        return { handle, id, name: '' };
                                    }
                                }
                            }
                        }
                    }

                    // Try overlay data
                    if (overlay?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer) {
                        const headerRenderer = overlay.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer;
                        const channelNavEndpoint = headerRenderer?.channelNavigationEndpoint?.browseEndpoint;
                        if (channelNavEndpoint?.browseId && channelNavEndpoint?.canonicalBaseUrl) {
                            const handle = channelNavEndpoint.canonicalBaseUrl.replace('/user/', '@').replace(/^\//, '');
                            const id = channelNavEndpoint.browseId && channelNavEndpoint.browseId.startsWith('UC')
                                ? channelNavEndpoint.browseId
                                : null;
                            console.log('FilterTube: Found channel in ytInitialData (overlay):', { handle, id });
                            if (normalizedExpected) {
                                const normalizedFound = normalizeHandleValue(handle);
                                if (!normalizedFound || normalizedFound !== normalizedExpected) {
                                    console.warn('FilterTube: Shorts overlay handle mismatch, rejecting', { expected: normalizedExpected, found: normalizedFound });
                                } else {
                                    return {
                                        handle,
                                        id,
                                        name: headerRenderer.channelTitleText?.runs?.[0]?.text || ''
                                    };
                                }
                            } else {
                                return {
                                    handle,
                                    id,
                                    name: headerRenderer.channelTitleText?.runs?.[0]?.text || ''
                                };
                            }
                        }
                    }

                    // Generic deep search over ytInitialData using renderer-style traversal
                    // Skip this when we have an expected handle because it often returns unrelated channels.
                    if (!normalizedExpected) {
                        const deepResult = extractChannelFromInitialData(ytInitialData);
                        if (deepResult) {
                            return deepResult;
                        }
                    }
                } catch (e) {
                    console.warn('FilterTube: Failed to parse ytInitialData from shorts page:', e);
                }
            }

            // Method 2: Extract from meta tags
            const channelUrlMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/(@[^"]+)"/);
            if (channelUrlMatch) {
                const handle = extractRawHandle(channelUrlMatch[1]);
                const normalizedFound = normalizeHandleValue(handle);
                if (!normalizedExpected || normalizedFound === normalizedExpected) {
                    console.log('FilterTube: Found channel in canonical link:', handle);
                    return { handle, name: '' };
                } else {
                    console.warn('FilterTube: Shorts canonical handle mismatch, rejecting', { expected: normalizedExpected, found: normalizedFound });
                }
            }

            // Method 3: Extract from page owner link
            const ownerLinkMatch = html.match(/<link itemprop="url" href="https?:\/\/www\.youtube\.com\/(@[^">]+)">/);
            if (ownerLinkMatch) {
                const handle = extractRawHandle(ownerLinkMatch[1]);
                const normalizedFound = normalizeHandleValue(handle);
                if (!normalizedExpected || normalizedFound === normalizedExpected) {
                    console.log('FilterTube: Found channel in owner link:', handle);
                    return { handle, name: '' };
                } else {
                    console.warn('FilterTube: Shorts owner link handle mismatch, rejecting', { expected: normalizedExpected, found: normalizedFound });
                }
            }

            // Method 4: Extract from channel bar link (more flexible)
            const channelBarMatch = html.match(/href="\/(@[^"\/]+)\/shorts"/);
            if (channelBarMatch) {
                const handle = extractRawHandle(channelBarMatch[1]);
                const normalizedFound = normalizeHandleValue(handle);
                if (!normalizedExpected || normalizedFound === normalizedExpected) {
                    console.log('FilterTube: Found channel in channel bar link:', handle);
                    return { handle, name: '' };
                } else {
                    console.warn('FilterTube: Shorts channel bar handle mismatch, rejecting', { expected: normalizedExpected, found: normalizedFound });
                }
            }

            // Method 5: Extract from any @handle link (handling both /shorts and direct links)
            const anyHandleMatch = html.match(/href="\/(@[^"\/]+)(?:\/shorts|")/);
            if (anyHandleMatch) {
                const handle = extractRawHandle(anyHandleMatch[1]);
                const normalizedFound = normalizeHandleValue(handle);
                if (!normalizedExpected || normalizedFound === normalizedExpected) {
                    console.log('FilterTube: Found channel in href attribute:', handle);
                    return { handle, name: '' };
                } else {
                    console.warn('FilterTube: Shorts href handle mismatch, rejecting', { expected: normalizedExpected, found: normalizedFound });
                }
            }

            console.warn('FilterTube: Could not extract channel info from shorts page');
            return null;
        } catch (error) {
            console.error('FilterTube: Error fetching shorts page:', error);
            return null;
        } finally {
            // Clean up pending fetch
            pendingShortsFetches.delete(videoId);
        }
    })();

    // Store the promise
    pendingShortsFetches.set(videoId, fetchPromise);

    return await fetchPromise;
}

/**
 * Extract video ID from a video card element
 * @param {Element} card - The video card element
 * @returns {string|null} - Video ID or null
 */
function extractVideoIdFromCard(card) {
    if (!card) return null;

    try {
        const extractFromHref = (href) => {
            if (!href || typeof href !== 'string') return null;
            const watchMatch = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
            if (watchMatch) return watchMatch[1];
            const shortsMatch = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (shortsMatch) return shortsMatch[1];
            const liveMatch = href.match(/\/live\/([a-zA-Z0-9_-]{11})/);
            if (liveMatch) return liveMatch[1];
            const embedMatch = href.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
            if (embedMatch) return embedMatch[1];
            return null;
        };

        // Method 1: From thumbnail link href
        const thumbnailLink = card.querySelector('a#thumbnail, a[href*="/watch"]');
        if (thumbnailLink) {
            const href = thumbnailLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        // Method 2: From video-title link
        const titleLink = card.querySelector('a#video-title, a[href*="/watch"]');
        if (titleLink) {
            const href = titleLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        // Method 3: From any watch link in the card
        const anyWatchLink = card.querySelector('a[href*="/watch?v="]');
        if (anyWatchLink) {
            const href = anyWatchLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        // Method 4: Shorts-style links
        const anyShortsLink = card.querySelector('a[href*="/shorts/"]');
        if (anyShortsLink) {
            const href = anyShortsLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        return null;
    } catch (error) {
        console.error('FilterTube: Error extracting video ID from card:', error);
        return null;
    }
}

/**
 * Extract channel information from a video/short card
 * @param {Element} card - The video or short card element
 * @returns {Object|null|Promise<Object|null>} - {id, handle, name}, {videoId, needsFetch: true}, or null
 */
function extractChannelFromCard(card) {
    if (!card) return null;

    try {
        let expectedCollaboratorCount = 0;
        card.removeAttribute('data-filtertube-expected-collaborators');
        // SPECIAL CASE: Detect if this is a Shorts card (compact format only)
        const isShortsCard = card.querySelector('ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, .reel-item-endpoint');

        // Only detect as "Shorts in full card" if explicitly marked by FilterTube
        // Do NOT use href detection as regular videos may have /shorts/ links in related content
        const isShortsInFullCard = card.getAttribute('data-filtertube-short') === 'true';

        // Handle Shorts displayed as full video cards (only when explicitly marked)
        if (isShortsInFullCard && !isShortsCard) {
            console.log('FilterTube: Detected SHORTS in full video card format');

            // For Shorts in full card, extract channel from #channel-name or channel link
            // IMPORTANT: Avoid picking up text from thumbnail overlays (SHORTS badge, Now playing)
            const channelNameEl = card.querySelector('#channel-info #channel-name a, #channel-name #text a, ytd-channel-name #text a');
            if (channelNameEl) {
                const href = channelNameEl.getAttribute('href');
                const name = channelNameEl.textContent?.trim();

                if (href) {
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        console.log('FilterTube: Extracted from SHORTS full card:', { handle: extracted, name });
                        return { handle: extracted, name };
                    }
                }
            }

            // Fallback: Try data attributes
            const dataHandle = card.getAttribute('data-filtertube-channel-handle') ||
                card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
            if (dataHandle) {
                // Get channel name from #channel-name, avoiding overlay text
                const channelName = card.querySelector('#channel-info #channel-name a, #channel-name #text a, ytd-channel-name #text a')?.textContent?.trim();
                console.log('FilterTube: Extracted from SHORTS full card data attr:', { handle: dataHandle, name: channelName });
                return { handle: dataHandle, name: channelName };
            }
        }

        if (isShortsCard) {
            console.log('FilterTube: Detected SHORTS card, using special extraction');

            // Method 1: Try data-filtertube attributes added by filter_logic.js
            const dataHandle = card.getAttribute('data-filtertube-channel-handle') ||
                card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
            const dataId = card.getAttribute('data-filtertube-channel-id') ||
                card.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id');

            if (dataHandle || dataId) {
                // Try to extract channel name from the link with the data attribute
                const channelLinkWithAttr = card.querySelector('[data-filtertube-channel-handle], [data-filtertube-channel-id]');
                let name = channelLinkWithAttr?.textContent?.trim();
                // Clean up name if it contains extra elements (like verified badges)
                if (name && channelLinkWithAttr?.childNodes) {
                    // Get only direct text content, not nested spans
                    name = Array.from(channelLinkWithAttr.childNodes)
                        .filter(n => n.nodeType === Node.TEXT_NODE)
                        .map(n => n.textContent.trim())
                        .join('') || name;
                }
                console.log('FilterTube: Found SHORTS channel from data attributes:', { handle: dataHandle, id: dataId, name });
                return { handle: dataHandle, id: dataId, name };
            }

            // Method 2: Try to find channel link in DOM
            const shortsChannelLink = card.querySelector(
                'a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), ' +
                'ytm-shorts-lockup-view-model a[href*="/@"], ' +
                '.shortsLockupViewModelHostOutsideMetadata a[href*="/@"], ' +
                'a.yt-simple-endpoint[href*="/@"]'
            );

            if (shortsChannelLink) {
                const href = shortsChannelLink.getAttribute('href');
                const extracted = extractRawHandle(href);
                if (extracted) {
                    const name = shortsChannelLink.textContent?.trim();
                    console.log('FilterTube: Extracted from SHORTS DOM link:', { handle: extracted, name });
                    return { handle: extracted, name };
                }
            }

            // Method 3: Extract from shorts URL (fetch the page)
            console.log('FilterTube: Attempting to extract channel from shorts URL');
            const shortsLink = card.querySelector('a[href*="/shorts/"]');
            if (shortsLink) {
                const href = shortsLink.getAttribute('href');
                const videoIdMatch = href?.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                if (videoIdMatch) {
                    const videoId = videoIdMatch[1];
                    console.log('FilterTube: Extracted shorts video ID:', videoId);
                    // Return a promise marker - we'll need to handle this async
                    return { videoId, needsFetch: true };
                }
            }

            console.warn('FilterTube: SHORTS card detected but no channel info found in card - skipping menu injection');
            // Return null - we can't block without channel info
            return null;
        }

        // SPECIAL CASE: Detect if this is a Post card
        const isPostCard = card.tagName.toLowerCase() === 'ytd-post-renderer';

        if (isPostCard) {
            console.log('FilterTube: Detected POST card, using special extraction');

            // Method 1: Try author link in header
            const authorLink = card.querySelector('#author-text.yt-simple-endpoint, a#author-text');
            if (authorLink) {
                const href = authorLink.getAttribute('href');
                const name = authorLink.textContent?.trim();

                if (href) {
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        console.log('FilterTube: Extracted from POST author link:', { handle: extracted, name });
                        return { handle: extracted, name };
                    }

                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch) {
                        const id = ucMatch[1];
                        console.log('FilterTube: Extracted from POST author link (UC):', { id, name });
                        return { id, name };
                    }
                }
            }

            // Method 2: Try author thumbnail link
            const authorThumbnail = card.querySelector('#author-thumbnail a');
            if (authorThumbnail) {
                const href = authorThumbnail.getAttribute('href');
                const name = card.querySelector('#author span')?.textContent?.trim();

                if (href) {
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        console.log('FilterTube: Extracted from POST thumbnail:', { handle: extracted, name });
                        return { handle: extracted, name };
                    }
                }
            }

            console.warn('FilterTube: POST card detected but no channel info found');
            return null;
        }

        // Method 1: PRIORITY - Check for collaboration videos FIRST (attributed-channel-name)
        const attributedChannelName = card.querySelector('#attributed-channel-name, [id="attributed-channel-name"]');

        if (attributedChannelName) {
            console.log('FilterTube: Detected COLLABORATION video');

            // Use validated cache to detect stale DOM elements (YouTube recycles DOM)
            const cachedCollaborators = getValidatedCachedCollaborators(card);
            if (cachedCollaborators.length > 0) {
                expectedCollaboratorCount = Number(card.getAttribute('data-filtertube-expected-collaborators')) || cachedCollaborators.length;
                const videoId = extractVideoIdFromCard(card);
                const needsMoreCollaborators = expectedCollaboratorCount > 0 && cachedCollaborators.length < expectedCollaboratorCount;
                const rosterIncomplete = cachedCollaborators.some(c => !c.handle && !c.id) || needsMoreCollaborators;

                console.log('FilterTube: Using validated cached collaborators for immediate render:', cachedCollaborators);
                return {
                    ...cachedCollaborators[0],
                    isCollaboration: true,
                    allCollaborators: cachedCollaborators,
                    needsEnrichment: rosterIncomplete,
                    expectedCollaboratorCount,
                    videoId
                };
            }

            // Extract all channel names and badges
            const ytTextViewModel = attributedChannelName.querySelector('yt-text-view-model');

            if (ytTextViewModel) {
                // Parse the attributed string which contains multiple channels
                const attributedString = ytTextViewModel.querySelector('.yt-core-attributed-string');

                if (attributedString) {
                    const collaborators = [];
                    const parsedNames = parseCollaboratorNames(attributedString.textContent || '');
                    const channelNames = parsedNames.names;
                    const hiddenCount = parsedNames.hiddenCount;

                    console.log('FilterTube: Parsed channel names from attributed string:', channelNames);

                    // Create collaborator objects from channel names
                    for (const name of channelNames) {
                        collaborators.push({ name });
                    }

                    // Try to find links for handles/IDs
                    const links = card.querySelectorAll('a[href*="/@"], a[href*="/channel/"]');
                    let linkIndex = 0;

                    for (const link of links) {
                        if (linkIndex >= collaborators.length) break;

                        const href = link.getAttribute('href');
                        if (href && !href.includes('/shorts/') && !href.includes('/watch')) {
                            const extracted = extractRawHandle(href);
                            if (extracted) {
                                collaborators[linkIndex].handle = extracted;
                            }

                            const ucMatch = href.match(/\/(UC[\w-]{22})/);
                            if (ucMatch) {
                                collaborators[linkIndex].id = ucMatch[1];
                            }

                            linkIndex++;
                        }
                    }

                    if (collaborators.length > 0) {
                        console.log('FilterTube: Extracted collaboration channels:', collaborators);

                        expectedCollaboratorCount = Math.max(expectedCollaboratorCount, channelNames.length + hiddenCount, collaborators.length);
                        if (expectedCollaboratorCount > 0) {
                            card.setAttribute('data-filtertube-expected-collaborators', String(expectedCollaboratorCount));
                        }

                        // Check if any collaborator is missing handle/id - will need async enrichment
                        const hasMissingData = collaborators.some(c => !c.handle && !c.id);
                        const videoId = extractVideoIdFromCard(card);
                        const needsMoreCollaborators = expectedCollaboratorCount > 0 && collaborators.length < expectedCollaboratorCount;

                        // Return first collaborator as primary channel with enrichment flag
                        // Store all collaborators in a special property
                        return {
                            ...collaborators[0],
                            isCollaboration: true,
                            allCollaborators: collaborators,
                            needsEnrichment: hasMissingData || needsMoreCollaborators,
                            expectedCollaboratorCount,
                            videoId: videoId
                        };
                    }
                }
            }
        }

        // Method 2: Check for data attributes (added by FilterTube's own processing)
        const dataHandle = card.getAttribute('data-filtertube-channel-handle') ||
            card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
        const dataId = card.getAttribute('data-filtertube-channel-id') ||
            card.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id');

        if (dataHandle || dataId) {
            let name = null;
            let handle = dataHandle;
            let id = dataId;

            // IMPORTANT: On search pages, data-filtertube-channel-handle is on the THUMBNAIL link,
            // which contains overlay text (duration, "Now playing"). We must get the name from
            // the actual channel name element, NOT from the element with the data attribute.

            // First try: Get name from proper channel name elements (ALWAYS do this first)
            const channelNameEl = card.querySelector(
                '#channel-info ytd-channel-name a, ' +
                '#channel-info #channel-name a, ' +
                'ytd-video-meta-block ytd-channel-name a, ' +
                '#byline-container ytd-channel-name a, ' +
                'ytd-channel-name #text a, ' +
                '.yt-lockup-metadata-view-model__metadata a[href*="/@"]'
            );
            if (channelNameEl) {
                name = channelNameEl.textContent?.trim();

                const href = channelNameEl.getAttribute('href') || channelNameEl.href || '';
                if (href) {
                    const domHandle = extractRawHandle(href);
                    if (domHandle) {
                        if (handle && handle.toLowerCase() !== domHandle.toLowerCase()) {
                            handle = domHandle;
                            id = undefined;
                        } else if (!handle) {
                            handle = domHandle;
                        }
                    }
                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch && !id) {
                        id = ucMatch[1];
                    }
                }
            }

            // Second try: Only if no name found, try the data-attribute element itself
            // BUT validate it doesn't contain overlay garbage
            if (!name) {
                const channelLinkWithAttr = card.querySelector('[data-filtertube-channel-handle], [data-filtertube-channel-id]');
                if (channelLinkWithAttr) {
                    const candidateName = channelLinkWithAttr.textContent?.trim();
                    // Reject if it looks like overlay text (duration or "Now playing")
                    if (candidateName &&
                        !candidateName.includes('Now playing') &&
                        !/^\d+:\d+/.test(candidateName) &&
                        !/\d+:\d+\s*Now playing/i.test(candidateName)) {
                        name = candidateName;
                    }
                }
            }

            console.log('FilterTube: Extracted from data attribute:', { handle, id, name });
            return { handle, id, name };
        }

        // Method 3: Find channel link - PRIORITIZE specific metadata areas over generic selectors
        // This prevents picking up links from thumbnail overlays (duration, "Now playing", etc.)

        // Priority 1: Channel name elements (most reliable for search results)
        const channelNameLink = card.querySelector(
            '#channel-info ytd-channel-name a[href*="/@"], ' +
            '#channel-info ytd-channel-name a[href*="/channel/"], ' +
            'ytd-video-meta-block ytd-channel-name a[href*="/@"], ' +
            '#byline-container ytd-channel-name a[href*="/@"], ' +
            'ytd-channel-name #text a[href*="/@"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href*="/@"], ' +
            '.yt-lockup-metadata-view-model .yt-core-attributed-string__link[href*="/@"]'
        );

        if (channelNameLink) {
            const href = channelNameLink.getAttribute('href');
            const name = channelNameLink.textContent?.trim();
            if (href) {
                const extracted = extractRawHandle(href);
                if (extracted) {
                    console.log('FilterTube: Extracted from channel name link:', { handle: extracted, name });
                    return { handle: extracted, name };
                }
                const ucMatch = href.match(/\/(UC[\w-]{22})/);
                if (ucMatch) {
                    console.log('FilterTube: Extracted from channel name link (UC):', { id: ucMatch[1], name });
                    return { id: ucMatch[1], name };
                }
            }
        }

        // Priority 2: Avatar/thumbnail links (have href but no text - get name separately)
        const avatarLink = card.querySelector(
            '#channel-thumbnail[href*="/@"], ' +
            '#avatar-link[href*="/@"], ' +
            '#owner a[href*="/@"]'
        );

        if (avatarLink) {
            const href = avatarLink.getAttribute('href');
            if (href) {
                const extracted = extractRawHandle(href);
                if (extracted) {
                    // Get name from channel name element
                    const nameEl = card.querySelector(
                        '#channel-info ytd-channel-name a, ' +
                        'ytd-channel-name #text a, ' +
                        'ytd-video-meta-block ytd-channel-name a'
                    );
                    const name = nameEl?.textContent?.trim();
                    console.log('FilterTube: Extracted from avatar link:', { handle: extracted, name });
                    return { handle: extracted, name };
                }
            }
        }

        // Priority 3: Generic channel links (last resort, but exclude thumbnail/overlay areas)
        const genericChannelLink = card.querySelector(
            '#metadata a[href*="/@"]:not([id="video-title"]), ' +
            '.reel-item-endpoint a[href*="/@"]'
        );

        if (genericChannelLink) {
            const href = genericChannelLink.getAttribute('href');
            if (href) {
                const extracted = extractRawHandle(href);
                if (extracted) {
                    let channelName = genericChannelLink.textContent?.trim();
                    // Validate name doesn't contain overlay text
                    if (!channelName || channelName.includes('Now playing') || /^\d+:\d+/.test(channelName)) {
                        const nameEl = card.querySelector('#channel-info ytd-channel-name a, ytd-channel-name #text a');
                        channelName = nameEl?.textContent?.trim() || channelName;
                    }
                    console.log('FilterTube: Extracted from generic link:', { handle: extracted, name: channelName });
                    return { handle: extracted, name: channelName };
                }
            }
        }

        // Method 4: Fallback - search deeper in metadata (use specific selectors to avoid overlays)
        const channelNameEl = card.querySelector(
            '#channel-info ytd-channel-name a, ' +
            'ytd-video-meta-block ytd-channel-name a, ' +
            '#byline-container ytd-channel-name a, ' +
            '#metadata ytd-channel-name a, ' +
            '#owner-name a'
        );

        if (channelNameEl) {
            const href = channelNameEl.getAttribute('href');
            let name = channelNameEl.textContent?.trim();

            // Validate name doesn't contain overlay text
            if (name && (name.includes('Now playing') || /^\d+:\d+/.test(name))) {
                name = null; // Invalid, will use handle as fallback
            }

            if (href) {
                const extracted = extractRawHandle(href);
                if (extracted) {
                    console.log('FilterTube: Extracted from metadata:', { handle: extracted, name });
                    return { handle: extracted, name };
                }

                const ucMatch = href.match(/\/(UC[\w-]{22})/);
                if (ucMatch) {
                    console.log('FilterTube: Extracted from metadata (UC):', { id: ucMatch[1], name });
                    return { id: ucMatch[1], name };
                }
            }
        }

        // Method 5: Homepage Lockup / Modern Metadata fallback
        if (!isShortsCard) {
            const lockupMetadata = card.querySelector('yt-lockup-metadata-view-model, .yt-lockup-metadata-view-model') ||
                card.querySelector('yt-content-metadata-view-model, .yt-content-metadata-view-model');

            if (lockupMetadata) {
                const avatarImg = lockupMetadata.querySelector('yt-avatar-shape img, img.yt-avatar-shape__image');
                const avatarAlt = avatarImg?.getAttribute('alt')?.trim();
                if (avatarAlt && !/go to channel/i.test(avatarAlt)) {
                    const nearbyHandle = lockupMetadata.querySelector('.yt-core-attributed-string__link[href*="/@"]');
                    if (nearbyHandle) {
                        const href = nearbyHandle.getAttribute('href');
                        const extracted = extractRawHandle(href);
                        if (extracted) {
                            console.log('FilterTube: Extracted from lockup avatar/link:', { handle: extracted, name: avatarAlt });
                            return { handle: extracted, name: avatarAlt };
                        }
                    }
                    console.log('FilterTube: Extracted channel name from lockup avatar alt:', { name: avatarAlt });
                }

                const metadataLinks = lockupMetadata.querySelectorAll(
                    '.yt-core-attributed-string__link[href*="/@"], ' +
                    '.yt-content-metadata-view-model__metadata-text a[href*="/@"], ' +
                    '.yt-content-metadata-view-model__metadata-text a[href*="/channel/"]'
                );

                for (const link of metadataLinks) {
                    const href = link.getAttribute('href');
                    const text = link.textContent?.trim();
                    if (!href) continue;
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        console.log('FilterTube: Extracted from lockup metadata link:', { handle: extracted, name: text });
                        return { handle: extracted, name: text };
                    }
                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch) {
                        console.log('FilterTube: Extracted from lockup metadata link (UC):', { id: ucMatch[1], name: text });
                        return { id: ucMatch[1], name: text };
                    }
                }
            }
        }

        // Debug: Log card structure to help identify missing selectors
        console.warn('FilterTube: Failed to extract channel. Card type:', card.tagName,
            'Is Shorts?:', !!isShortsCard,
            'Card HTML:', card.outerHTML.substring(0, 2000));

        const fallbackVideoId = ensureVideoIdForCard(card);
        if (fallbackVideoId) {
            const fallbackName = card.querySelector(
                '#channel-info ytd-channel-name a, ' +
                '#channel-info #channel-name a, ' +
                '.yt-lockup-metadata-view-model__metadata a[href*="/@"]'
            )?.textContent?.trim() || '';
            const fallbackHandleHref = card.querySelector('.yt-core-attributed-string__link[href*="/@"]')?.getAttribute('href') || '';
            const fallbackHandle = extractRawHandle(fallbackHandleHref);
            console.log('FilterTube: Falling back to main-world lookup for video:', fallbackVideoId, 'expectedName:', fallbackName || 'n/a');
            return {
                videoId: fallbackVideoId,
                needsFetch: true,
                fetchStrategy: 'mainworld',
                expectedChannelName: fallbackName || null,
                expectedHandle: fallbackHandle || null
            };
        }

    } catch (error) {
        console.error('FilterTube: Error extracting channel from card:', error);
    }

    return null;
}

/**
 * Inject "Block Channel" menu item into 3-dot dropdown
 * @param {Element} dropdown - The dropdown menu element
 * @param {Element} videoCard - The video/short card that was clicked
 */
async function injectFilterTubeMenuItem(dropdown, videoCard) {
    if (!dropdown || !videoCard) return;

    // Extract initial channel info (synchronous from DOM)
    let initialChannelInfo = extractChannelFromCard(videoCard);
    if (!initialChannelInfo) {
        initialChannelInfo = {};
    } else if (initialChannelInfo.handle) {
        applyHandleMetadata(initialChannelInfo, initialChannelInfo.handle, { force: true });
    } else if (initialChannelInfo.handleDisplay) {
        applyHandleMetadata(initialChannelInfo, initialChannelInfo.handleDisplay, { force: true });
    }
    // If YouTube recycled this card, ensure stale channel attrs are cleared
    if (initialChannelInfo && videoCard) {
        const currentVideoId = ensureVideoIdForCard(videoCard);
        const cachedVideoId = videoCard.getAttribute('data-filtertube-video-id');
        if (currentVideoId && cachedVideoId && currentVideoId !== cachedVideoId) {
            clearBlockedElementAttributes(videoCard);
            videoCard.removeAttribute('data-filtertube-channel-id');
            videoCard.removeAttribute('data-filtertube-channel-handle');
            videoCard.removeAttribute('data-filtertube-channel-name');
        }
    }
    // Prefer fresh DOM identifiers over any cached collaborator-derived data
    const domHandleAttr = videoCard.getAttribute('data-filtertube-channel-handle');
    const domIdAttr = videoCard.getAttribute('data-filtertube-channel-id');
    const domHandleCandidate =
        extractRawHandle(domHandleAttr) ||
        extractRawHandle(
            videoCard
                .querySelector('#channel-info ytd-channel-name a[href*="/@"], ytd-channel-name #text a[href*="/@"]')
                ?.getAttribute('href') || ''
        ) ||
        extractRawHandle(
            videoCard.querySelector('a#thumbnail[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle') || ''
        );

    if (domHandleCandidate) {
        applyHandleMetadata(initialChannelInfo, domHandleCandidate, { force: true });
    }

    const domId = domIdAttr ||
        extractChannelIdFromString(
            videoCard.querySelector('#channel-info ytd-channel-name a[href*="/channel/UC"], a#thumbnail[href*="/channel/UC"]')?.getAttribute('href') || ''
        );

    if (domId) {
        initialChannelInfo.id = domId;
    }

    if (!initialChannelInfo || (!initialChannelInfo.handle && !initialChannelInfo.id && !initialChannelInfo.isCollaboration && !initialChannelInfo.needsFetch)) {
        console.log('FilterTube: Could not extract channel info from card');
        clearFilterTubeMenuItems(dropdown);
        return;
    }

    console.log('FilterTube: Initial channel info:', initialChannelInfo);

    if (initialChannelInfo.isCollaboration) {
        // Use validated cache to prevent stale data from DOM element recycling
        const cachedCollaborators = getValidatedCachedCollaborators(videoCard);
        if (cachedCollaborators.length >= 2) {
            console.log('FilterTube: Using validated cached collaborators from card for immediate render');
            initialChannelInfo = {
                ...initialChannelInfo,
                allCollaborators: cachedCollaborators,
                needsEnrichment: false,
                expectedCollaboratorCount: parseInt(videoCard.getAttribute('data-filtertube-expected-collaborators') || cachedCollaborators.length, 10) || cachedCollaborators.length
            };
        }
    }

    // Ensure the card is stamped with a videoId before requesting enrichment so
    // the main world can reliably hydrate collaborators via DOM.
    if (initialChannelInfo.videoId) {
        if (!videoCard.getAttribute('data-filtertube-video-id')) {
            videoCard.setAttribute('data-filtertube-video-id', initialChannelInfo.videoId);
        }
    } else {
        const ensuredVideoId = ensureVideoIdForCard(videoCard);
        if (ensuredVideoId) {
            initialChannelInfo.videoId = ensuredVideoId;
        }
    }

    // Kick off collaborator enrichment (non-blocking) so handles/IDs stay accurate regardless of DOM ordering
    let collaboratorEnrichmentPromise = null;
    if (initialChannelInfo.isCollaboration && initialChannelInfo.videoId) {
        collaboratorEnrichmentPromise = enrichCollaboratorsWithMainWorld(initialChannelInfo);
    }

    // Wait for menu to be populated by YouTube (with timeout)
    const waitForMenu = () => {
        return new Promise((resolve) => {
            const checkMenu = () => {
                // Detect menu structure type (new vs old) - COMPREHENSIVE DETECTION
                const newMenuList = dropdown.querySelector('yt-list-view-model');
                const oldMenuList = dropdown.querySelector(
                    'tp-yt-paper-listbox, ' +
                    'ytd-menu-popup-renderer, ' +
                    'ytd-menu-service-item-renderer, ' +
                    '#items.ytd-menu-popup-renderer, ' +
                    '#items.style-scope.ytd-menu-popup-renderer'
                );

                if (newMenuList || oldMenuList) {
                    console.log('FilterTube: Menu detected - newMenuList:', !!newMenuList, 'oldMenuList:', !!oldMenuList);
                    resolve({ newMenuList, oldMenuList });
                    return true;
                }
                return false;
            };

            // Try immediately first
            if (checkMenu()) return;

            // If not found, observe for menu to be added
            console.log('FilterTube: Menu not ready, waiting for YouTube to populate...');
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds max wait

            const observer = new MutationObserver(() => {
                attempts++;
                if (checkMenu()) {
                    observer.disconnect();
                } else if (attempts >= maxAttempts) {
                    console.warn('FilterTube: Menu not populated after waiting, giving up');
                    console.log('FilterTube: Dropdown HTML:', dropdown.innerHTML.substring(0, 500));
                    observer.disconnect();
                    resolve({ newMenuList: null, oldMenuList: null });
                }
            });

            observer.observe(dropdown, { childList: true, subtree: true });

            // Also set a timeout as backup
            setTimeout(() => {
                observer.disconnect();
                const result = checkMenu();
                if (!result) {
                    console.warn('FilterTube: Timeout waiting for menu');
                    resolve({ newMenuList: null, oldMenuList: null });
                }
            }, 2000);
        });
    };

    // Wait for menu to be ready
    const { newMenuList, oldMenuList } = await waitForMenu();
    if (!newMenuList && !oldMenuList) {
        console.warn('FilterTube: Could not detect menu structure after waiting');
        return;
    }

    const videoId = initialChannelInfo.videoId || ensureVideoIdForCard(videoCard);
    if (videoId && !initialChannelInfo.videoId) {
        initialChannelInfo.videoId = videoId;
    }

    const expectedFromCard = parseInt(videoCard.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0;
    const menuRenderOptions = {
        dropdown,
        newMenuList,
        oldMenuList,
        videoCard
    };

    if (initialChannelInfo.isCollaboration && videoId) {
        // Prefer the freshest collaborator list from the DOM (card cache/stack),
        // only using the in-memory resolved cache when it clearly improves quality
        // without losing collaborators.
        const cardCollaborators = Array.isArray(initialChannelInfo.allCollaborators)
            ? initialChannelInfo.allCollaborators
            : [];

        const cachedResolved = resolvedCollaboratorsByVideoId.get(videoId);
        let sanitizedCollaborators;

        if (cachedResolved && cachedResolved.length > 0) {
            const sanitizedResolved = sanitizeCollaboratorList(cachedResolved);
            const sanitizedCard = sanitizeCollaboratorList(cardCollaborators);

            // Choose the list with MORE collaborators; if equal length, fall back
            // to the one with higher quality score.
            if (sanitizedResolved.length > sanitizedCard.length ||
                (sanitizedResolved.length === sanitizedCard.length &&
                    getCollaboratorListQuality(sanitizedResolved) > getCollaboratorListQuality(sanitizedCard))) {
                sanitizedCollaborators = sanitizedResolved;
            } else {
                sanitizedCollaborators = sanitizedCard;
            }
        } else {
            sanitizedCollaborators = sanitizeCollaboratorList(cardCollaborators);
        }

        const avatarStackElement = videoCard.querySelector('yt-avatar-stack-view-model');
        let avatarStackCollaborators = [];
        if (avatarStackElement) {
            avatarStackCollaborators = extractCollaboratorsFromAvatarStackElement(avatarStackElement);
            if (avatarStackCollaborators.length > 0) {
                const mergedList = mergeCollaboratorLists(sanitizedCollaborators, avatarStackCollaborators);
                if (getCollaboratorListQuality(mergedList) > getCollaboratorListQuality(sanitizedCollaborators)) {
                    sanitizedCollaborators = mergedList;
                }
            }
        }

        if (sanitizedCollaborators.length > 0) {
            // Use validated cache to detect stale DOM elements
            const cachedOnCard = getValidatedCachedCollaborators(videoCard);
            if (getCollaboratorListQuality(sanitizedCollaborators) > getCollaboratorListQuality(cachedOnCard)) {
                try {
                    videoCard.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitizedCollaborators));
                } catch (error) {
                    console.warn('FilterTube: Failed to prime card collaborator cache:', error);
                }
            }
        }

        const expectedCollaboratorCount = Math.max(
            initialChannelInfo.expectedCollaboratorCount || 0,
            expectedFromCard,
            sanitizedCollaborators.length,
            avatarStackCollaborators.length
        );
        if (expectedCollaboratorCount > 0 &&
            parseInt(videoCard.getAttribute('data-filtertube-expected-collaborators') || '0', 10) !== expectedCollaboratorCount) {
            videoCard.setAttribute('data-filtertube-expected-collaborators', String(expectedCollaboratorCount));
        }

        const rosterComplete = hasCompleteCollaboratorRoster(sanitizedCollaborators, expectedCollaboratorCount);
        const channelInfoForMenu = {
            ...initialChannelInfo,
            allCollaborators: sanitizedCollaborators,
            needsEnrichment: !rosterComplete
        };

        registerActiveCollaborationMenu(videoId, dropdown, videoCard, {
            awaitingFullRender: !rosterComplete,
            expectedCount: expectedCollaboratorCount,
            lastSignature: rosterComplete ? buildCollaboratorSignature(sanitizedCollaborators) : '',
            channelInfo: channelInfoForMenu
        });

        renderFilterTubeMenuEntries({
            ...menuRenderOptions,
            channelInfo: channelInfoForMenu,
            placeholder: !rosterComplete
        });
    } else {
        if (videoId) {
            unregisterActiveCollaborationMenu(videoId, dropdown);
        }
        renderFilterTubeMenuEntries({
            ...menuRenderOptions,
            channelInfo: initialChannelInfo,
            placeholder: false
        });
    }

    // Start background fetch for complete channel info (non-blocking)
    const fetchPromise = (async () => {
        let finalChannelInfo = initialChannelInfo;

        // For shorts, fetch channel info from shorts URL
        if (initialChannelInfo.needsFetch && initialChannelInfo.videoId) {
            console.log('FilterTube: Background fetch - shorts channel info for:', initialChannelInfo.videoId);
            const fetchedInfo = await fetchChannelFromShortsUrl(initialChannelInfo.videoId);
            if (fetchedInfo) {
                finalChannelInfo = fetchedInfo;
                console.log('FilterTube: Background fetch complete - shorts channel:', fetchedInfo);
            } else {
                console.warn('FilterTube: Background fetch failed for shorts');
            }
        }

        // For all videos (including shorts after fetch), resolve @handle to UC ID
        if (finalChannelInfo.handle && finalChannelInfo.handle.startsWith('@')) {
            console.log('FilterTube: Background fetch - resolving @handle to UC ID:', finalChannelInfo.handle);
            // Avoid network fetches during menu hover/open; we only need best-effort
            // enrichment here and network calls can be noisy for broken handles.
            const ucId = await fetchIdForHandle(finalChannelInfo.handle, { skipNetwork: true });
            if (ucId) {
                finalChannelInfo.id = ucId;
                console.log('FilterTube: Background fetch complete - resolved to UC ID:', ucId);
            }
        }

        return finalChannelInfo;
    })();

    // Store the fetch promise for later use (when user clicks "Block Channel")
    pendingDropdownFetches.set(dropdown, {
        channelInfoPromise: fetchPromise,
        collaboratorPromise: collaboratorEnrichmentPromise,
        cancelled: false,
        initialChannelInfo: initialChannelInfo
    });

    if (collaboratorEnrichmentPromise && videoId) {
        collaboratorEnrichmentPromise
            .then(collaborators => {
                if (!Array.isArray(collaborators) || collaborators.length === 0) return;
                const sanitized = sanitizeCollaboratorList(collaborators);
                if (sanitized.length === 0) return;
                resolvedCollaboratorsByVideoId.set(videoId, sanitized);
                refreshActiveCollaborationMenu(videoId, sanitized, {
                    expectedCount: initialChannelInfo.expectedCollaboratorCount || expectedFromCard || sanitized.length
                });
            })
            .catch(error => {
                console.warn('FilterTube: Collaborator enrichment promise failed:', error);
            });
    }

    console.log('FilterTube: Menu injected immediately, fetch running in background');
}

/**
 * Inject into NEW menu structure (yt-list-view-model)
 */
function attachFilterTubeMenuHandlers({ menuItem, toggle, channelInfo, videoCard, injectionOptions = {} }) {
    if (!menuItem) return;

    const handleInteraction = async (event) => {
        const isToggleTarget = toggle && (toggle === event.target || toggle.contains(event.target));
        if (isToggleTarget) {
            // Let the toggle's own handler run
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (injectionOptions.preventNativeClick || channelInfo?.isPlaceholder) {
            return;
        }

        const isMultiStepMember = menuItem.getAttribute('data-multi-step') === 'true' &&
            menuItem.getAttribute('data-is-block-all') !== 'true';

        if (isMultiStepMember) {
            toggleMultiStepSelection(menuItem, channelInfo);
            return;
        }

        const filterAll = isFilterAllToggleActive(toggle);
        await handleBlockChannelClick(channelInfo, menuItem, filterAll, videoCard);
    };

    menuItem.addEventListener('click', handleInteraction, { capture: true });
    menuItem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            handleInteraction(event);
        }
    });
}

function injectIntoNewMenu(menuList, channelInfo, videoCard, collaborationMetadata = null, injectionOptions = {}) {
    // Create FilterTube menu item (NEW structure)
    const filterTubeItem = document.createElement('yt-list-item-view-model');
    filterTubeItem.className = 'yt-list-item-view-model filtertube-block-channel-item';
    filterTubeItem.setAttribute('role', 'menuitem');
    filterTubeItem.setAttribute('tabindex', '0');

    // Inline SVG for FilterTube logo (user-provided SVG)
    const filterTubeSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128" style="display: block;">
        <path fill="#FF3333" d="M53.004837,77.261787 C55.004650,68.586563 48.961483,63.525127 45.151901,57.831970 C36.636456,45.106262 27.572891,32.747910 18.776752,20.208942 C17.048302,17.745022 18.246574,14.746576 21.199722,14.076863 C22.310389,13.824986 23.520674,14.001245 24.685543,14.001154 C51.482349,13.999036 78.279152,13.997606 105.075958,14.002748 C107.511017,14.003215 110.410080,13.422483 111.785439,15.933891 C113.178085,18.476864 111.026321,20.660681 109.690315,22.593620 C99.594292,37.200588 89.433075,51.763405 79.158081,66.244827 C77.520378,68.552994 76.925735,70.848900 76.965294,73.583061 C77.066391,80.572067 76.851021,87.568138 77.069214,94.551788 C77.160759,97.481934 76.221825,99.467453 74.122963,101.447235 C69.040611,106.241264 64.241066,111.333801 59.229191,116.204849 C58.138329,117.265060 57.330574,119.514366 55.379189,118.670372 C53.447678,117.834984 52.933788,115.906029 52.954082,113.675346 C53.063110,101.692680 53.005142,89.708488 53.004837,77.261787 z"/>
        <path fill="#FF0000" d="M63.316730,58.295921 C61.783310,59.317360 60.616657,60.253048 59.307014,60.898705 C55.871113,62.592613 54.045387,61.557888 54.023708,57.807045 C53.960236,46.824589 53.943741,35.841064 54.033154,24.858967 C54.064426,21.018126 56.738575,19.503649 60.024136,21.659582 C67.653084,26.665573 75.198029,31.814018 82.579330,37.176819 C86.212624,39.816536 85.950592,42.679234 82.150856,45.360466 C76.029831,49.679680 69.801399,53.846684 63.316730,58.295921 z"/>
    </svg>`;


    // Ensure styles are injected
    ensureFilterTubeMenuStyles();

    // Build channel display name
    const channelName = escapeHtml(channelInfo.name || 'Channel');

    filterTubeItem.innerHTML = `
        <div class="yt-list-item-view-model__label yt-list-item-view-model__container yt-list-item-view-model__container--compact yt-list-item-view-model__container--tappable yt-list-item-view-model__container--in-popup filtertube-menu-item">
            <div aria-hidden="true" class="yt-list-item-view-model__image-container yt-list-item-view-model__leading" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0;">
                ${filterTubeSvg}
            </div>
            <div class="yt-list-item-view-model__text-wrapper" style="flex: 1; min-width: 0;">
                <div class="yt-list-item-view-model__title-wrapper filtertube-menu-title-wrapper">
                    <span class="filtertube-menu-title" role="text">
                        <span class="filtertube-menu-label">Block</span>
                        <span class="filtertube-menu-separator">•</span>
                        <span class="filtertube-channel-name">${channelName}</span>
                    </span>
                    <div class="filtertube-filter-all-toggle exact-toggle toggle-variant-red">
                        Filter All
                    </div>
                </div>
            </div>
        </div>
    `;

    // Get title span reference for later updates
    const titleSpan = filterTubeItem.querySelector('.filtertube-menu-title');

    // Store collaboration metadata
    if (collaborationMetadata) {
        if (collaborationMetadata.collaborationWith) {
            filterTubeItem.setAttribute('data-collaboration-with', JSON.stringify(collaborationMetadata.collaborationWith));
        }
        if (collaborationMetadata.isMultiStep) {
            filterTubeItem.setAttribute('data-multi-step', 'true');
        }
    }

    const collaborationGroupIdFromMeta = collaborationMetadata && collaborationMetadata.collaborationGroupId;
    const collaborationGroupIdFromChannel = channelInfo && channelInfo.collaborationGroupId;
    const effectiveGroupIdNew = collaborationGroupIdFromMeta || collaborationGroupIdFromChannel;
    if (effectiveGroupIdNew) {
        filterTubeItem.setAttribute('data-collaboration-group-id', effectiveGroupIdNew);
    }

    // Store isBlockAllOption flag for click handler
    if (channelInfo.isBlockAllOption) {
        filterTubeItem.setAttribute('data-is-block-all', 'true');
    }
    if (channelInfo.isMultiStep) {
        filterTubeItem.setAttribute('data-multi-step', 'true');
    }
    const collaboratorKeyNew = getCollaboratorKey(channelInfo);
    if (collaboratorKeyNew && !channelInfo.isBlockAllOption) {
        filterTubeItem.setAttribute('data-collab-key', collaboratorKeyNew);
    }

    // Get toggle button
    const toggle = filterTubeItem.querySelector('.filtertube-filter-all-toggle');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();

            // Update visual state and get new active state
            const isActive = !isFilterAllToggleActive(toggle);
            applyFilterAllStateToToggle(toggle, isActive);

            // --- FIX: Persist the new state to the in-memory map ---
            persistFilterAllStateForMenuItem(filterTubeItem, isActive);

            console.log('FilterTube: Filter All toggled:', isActive);
        });
    }

    // Menu item click handler (block channel)
    attachFilterTubeMenuHandlers({
        menuItem: filterTubeItem,
        toggle,
        channelInfo,
        videoCard,
        injectionOptions
    });

    // Insert at the TOP of the menu (as first child)
    menuList.insertBefore(filterTubeItem, menuList.firstChild);

    // Check if channel is already blocked and update UI accordingly
    checkIfChannelBlocked(channelInfo, filterTubeItem);
    hydrateFilterAllToggle(filterTubeItem, channelInfo);
    console.log('FilterTube: Injected NEW menu item at TOP');

    return filterTubeItem;
}

/**
 * Inject into OLD menu structure (tp-yt-paper-listbox)
 */
function injectIntoOldMenu(menuContainer, channelInfo, videoCard, collaborationMetadata = null, injectionOptions = {}) {
    const menuList = menuContainer.querySelector('tp-yt-paper-listbox') || menuContainer;

    // Inline SVG for FilterTube logo (user-provided SVG)
    const filterTubeSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128" style="display: block;">
        <path fill="#FF3333" d="M53.004837,77.261787 C55.004650,68.586563 48.961483,63.525127 45.151901,57.831970 C36.636456,45.106262 27.572891,32.747910 18.776752,20.208942 C17.048302,17.745022 18.246574,14.746576 21.199722,14.076863 C22.310389,13.824986 23.520674,14.001245 24.685543,14.001154 C51.482349,13.999036 78.279152,13.997606 105.075958,14.002748 C107.511017,14.003215 110.410080,13.422483 111.785439,15.933891 C113.178085,18.476864 111.026321,20.660681 109.690315,22.593620 C99.594292,37.200588 89.433075,51.763405 79.158081,66.244827 C77.520378,68.552994 76.925735,70.848900 76.965294,73.583061 C77.066391,80.572067 76.851021,87.568138 77.069214,94.551788 C77.160759,97.481934 76.221825,99.467453 74.122963,101.447235 C69.040611,106.241264 64.241066,111.333801 59.229191,116.204849 C58.138329,117.265060 57.330574,119.514366 55.379189,118.670372 C53.447678,117.834984 52.933788,115.906029 52.954082,113.675346 C53.063110,101.692680 53.005142,89.708488 53.004837,77.261787 z"/>
        <path fill="#FF0000" d="M63.316730,58.295921 C61.783310,59.317360 60.616657,60.253048 59.307014,60.898705 C55.871113,62.592613 54.045387,61.557888 54.023708,57.807045 C53.960236,46.824589 53.943741,35.841064 54.033154,24.858967 C54.064426,21.018126 56.738575,19.503649 60.024136,21.659582 C67.653084,26.665573 75.198029,31.814018 82.579330,37.176819 C86.212624,39.816536 85.950592,42.679234 82.150856,45.360466 C76.029831,49.679680 69.801399,53.846684 63.316730,58.295921 z"/>
    </svg>`;


    // Ensure styles are injected
    ensureFilterTubeMenuStyles();

    // Build channel display name
    const channelName = escapeHtml(channelInfo.name || 'Channel');

    // Create FilterTube menu item (OLD structure)
    const filterTubeItem = document.createElement('ytd-menu-service-item-renderer');
    filterTubeItem.className = 'style-scope ytd-menu-popup-renderer filtertube-block-channel-item';
    filterTubeItem.setAttribute('system-icons', '');
    filterTubeItem.setAttribute('role', 'menuitem');
    filterTubeItem.setAttribute('use-icons', '');
    filterTubeItem.setAttribute('tabindex', '-1');

    filterTubeItem.innerHTML = `
        <tp-yt-paper-item class="style-scope ytd-menu-service-item-renderer filtertube-menu-item" style-target="host" role="option" tabindex="0" aria-disabled="false">
            <div style="width: 24px; height: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
                ${filterTubeSvg}
            </div>
            <span class="filtertube-menu-title" role="text">
                <span class="filtertube-menu-label">Block</span>
                <span class="filtertube-menu-separator">•</span>
                <span class="filtertube-channel-name">${channelName}</span>
            </span>
            <div class="filtertube-filter-all-toggle exact-toggle toggle-variant-red">
                Filter All
            </div>
        </tp-yt-paper-item>
    `;

    // Get title span reference for later updates
    const titleSpan = filterTubeItem.querySelector('.filtertube-menu-title');

    // Store collaboration metadata
    if (collaborationMetadata) {
        if (collaborationMetadata.collaborationWith) {
            filterTubeItem.setAttribute('data-collaboration-with', JSON.stringify(collaborationMetadata.collaborationWith));
        }
        if (collaborationMetadata.collaborationGroupId) {
            filterTubeItem.setAttribute('data-collaboration-group-id', collaborationMetadata.collaborationGroupId);
        }
        if (collaborationMetadata.isMultiStep) {
            filterTubeItem.setAttribute('data-multi-step', 'true');
        }
    }

    // Store isBlockAllOption flag for click handler
    if (channelInfo.isBlockAllOption) {
        filterTubeItem.setAttribute('data-is-block-all', 'true');
    }
    if (channelInfo.isMultiStep) {
        filterTubeItem.setAttribute('data-multi-step', 'true');
    }

    // Store collaborator key for multi-step state tracking (non-block-all items)
    const collaboratorKeyOld = getCollaboratorKey(channelInfo);
    if (collaboratorKeyOld && !channelInfo.isBlockAllOption) {
        filterTubeItem.setAttribute('data-collab-key', collaboratorKeyOld);
    }

    // Get toggle button
    const toggle = filterTubeItem.querySelector('.filtertube-filter-all-toggle');
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();

        // Update visual state and get new active state
        const isActive = !isFilterAllToggleActive(toggle);
        applyFilterAllStateToToggle(toggle, isActive);

        // --- FIX: Persist the new state to the in-memory map ---
        persistFilterAllStateForMenuItem(filterTubeItem, isActive);

        console.log('FilterTube: Filter All toggled:', isActive);
    });

    attachFilterTubeMenuHandlers({
        menuItem: filterTubeItem,
        toggle,
        channelInfo,
        videoCard,
        injectionOptions
    });

    // Insert at the TOP of the menu (as first child)
    menuList.insertBefore(filterTubeItem, menuList.firstChild);

    // Check if channel is already blocked and update UI accordingly
    checkIfChannelBlocked(channelInfo, filterTubeItem);
    hydrateFilterAllToggle(filterTubeItem, channelInfo);
    console.log('FilterTube: Injected OLD menu item at TOP');

    return filterTubeItem;
}

/**
 * Check if a channel is already blocked and update the menu item UI
 * @param {Object} channelInfo - {id, handle, name}
 * @param {Element} menuItem - The menu item element
 */
async function checkIfChannelBlocked(channelInfo, menuItem) {
    try {
        // Get current filtered channels from storage
        const result = await browserAPI_BRIDGE.storage.local.get(['filterChannels']);
        const channels = result.filterChannels || [];
        const storedEntry = findStoredChannelEntry(channelInfo) ||
            channels.find(ch => {
                if (!ch) return false;
                const chHandle = ch.handle?.toLowerCase();
                const chId = ch.id?.toLowerCase();
                const inputHandle = normalizeHandleValue(channelInfo.handle || '').toLowerCase();
                const inputId = (channelInfo.id || '').toLowerCase();
                return (inputHandle && chHandle === inputHandle) || (inputId && chId === inputId);
            });

        // Check if this channel is already in the list (by handle or ID)
        const normalizedHandle = normalizeHandleValue(channelInfo.handle || '');
        const input = normalizedHandle || channelInfo.id || '';
        const isBlocked = input
            ? channels.some(channel => {
                // Match by handle (case-insensitive) or by ID
                if (input.startsWith('@')) {
                    return channel.handle && channel.handle.toLowerCase() === input.toLowerCase();
                } else {
                    return channel.id === input;
                }
            })
            : false;

        if (isBlocked) {
            // Channel is already blocked - show success state
            const titleSpan = menuItem.querySelector('.filtertube-menu-title');
            if (titleSpan) {
                titleSpan.textContent = '✓ Channel Blocked';
                titleSpan.style.color = '#10b981'; // green
                menuItem.style.pointerEvents = 'none'; // Disable clicks
            }
            if (storedEntry) {
                applyFilterAllStateToToggle(menuItem.querySelector('.filtertube-filter-all-toggle'), storedEntry.filterAll);
                addFilterAllContentCheckbox(menuItem, storedEntry);
            }
            console.log('FilterTube: Channel already blocked:', channelInfo);
        }
    } catch (error) {
        console.error('FilterTube: Error checking if channel is blocked:', error);
    }
}

function markElementAsBlocked(element, channelInfo, state = 'pending') {
    if (!element || !channelInfo) return;

    if (channelInfo.id) {
        element.setAttribute('data-filtertube-blocked-channel-id', channelInfo.id);
    }
    if (channelInfo.handle) {
        element.setAttribute('data-filtertube-blocked-channel-handle', channelInfo.handle);
    }
    if (channelInfo.name) {
        element.setAttribute('data-filtertube-blocked-channel-name', channelInfo.name);
    }
    element.setAttribute('data-filtertube-blocked-state', state);
    element.setAttribute('data-filtertube-blocked-ts', Date.now().toString());
}

function clearBlockedElementAttributes(element) {
    if (!element) return;
    element.removeAttribute('data-filtertube-blocked-channel-id');
    element.removeAttribute('data-filtertube-blocked-channel-handle');
    element.removeAttribute('data-filtertube-blocked-channel-name');
    element.removeAttribute('data-filtertube-blocked-state');
    element.removeAttribute('data-filtertube-blocked-ts');
}

function syncBlockedElementsWithFilters(effectiveSettings) {
    const filterChannels = effectiveSettings?.filterChannels || [];
    const channelMap = effectiveSettings?.channelMap || {};
    const blockedElements = document.querySelectorAll('[data-filtertube-blocked-channel-id], [data-filtertube-blocked-channel-handle]');
    if (blockedElements.length === 0) return;

    const isStillBlocked = (meta) => {
        if (!meta.handle && !meta.id) return false;
        return filterChannels.some(filterChannel => channelMatchesFilter(meta, filterChannel, channelMap));
    };

    blockedElements.forEach(element => {
        const meta = {
            id: element.getAttribute('data-filtertube-blocked-channel-id') || '',
            handle: element.getAttribute('data-filtertube-blocked-channel-handle') || '',
            name: element.getAttribute('data-filtertube-blocked-channel-name') || ''
        };

        if (filterChannels.length > 0 && isStillBlocked(meta)) {
            markElementAsBlocked(element, meta, 'confirmed');
            toggleVisibility(element, true, `Blocked channel: ${meta.handle || meta.id}`);
        } else {
            clearBlockedElementAttributes(element);
            toggleVisibility(element, false, '', true);
        }
    });
}

/**
 * Handle click on "Block Channel" menu item
 * @param {Object} channelInfo - {id, handle, name}
 * @param {Element} menuItem - The menu item element
 * @param {boolean} filterAll - Hint for Filter All state (will be recomputed from DOM)
 * @param {Element} videoCard - The video card element to hide after blocking
 */
async function handleBlockChannelClick(channelInfo, menuItem, filterAll = false, videoCard = null) {
    // Always derive effective Filter All state from the DOM toggle to avoid
    // any mismatch between passed arguments and actual UI state.
    const domToggle = menuItem?.querySelector?.('.filtertube-filter-all-toggle');
    if (domToggle) {
        filterAll = isFilterAllToggleActive(domToggle);
    }
    console.log('FilterTube: Block Channel clicked', { channelInfo, filterAll });

    let requestedHandle = '';
    let requestedHandleForNetwork = '';
    if (channelInfo?.handle || channelInfo?.canonicalHandle || channelInfo?.handleDisplay) {
        const rawCandidate = extractRawHandle(channelInfo.canonicalHandle || channelInfo.handleDisplay || channelInfo.handle);
        if (rawCandidate) {
            requestedHandleForNetwork = rawCandidate;
        }

        const normalizedClickedHandle = normalizeHandleValue(channelInfo.handle || rawCandidate);
        if (normalizedClickedHandle) {
            channelInfo.handle = normalizedClickedHandle;
            requestedHandle = normalizedClickedHandle;
        }
    }

    const titleSpan = menuItem.querySelector('.filtertube-menu-title') ||
        menuItem.querySelector('.yt-core-attributed-string');

    const originalText = titleSpan ? titleSpan.textContent : '';
    const collaborationGroupId = menuItem.getAttribute('data-collaboration-group-id') || '';

    // Show "Fetching..." state IMMEDIATELY for instant user feedback
    if (titleSpan) {
        titleSpan.textContent = 'Fetching...';
        titleSpan.style.color = '#9ca3af'; // gray
    }
    menuItem.style.pointerEvents = 'none';

    if (menuItem.getAttribute('data-multi-step') === 'true' &&
        menuItem.getAttribute('data-is-block-all') !== 'true') {
        if (titleSpan) {
            titleSpan.textContent = originalText;
            titleSpan.style.color = '';
        }
        menuItem.style.pointerEvents = 'auto';
        toggleMultiStepSelection(menuItem, channelInfo);
        return;
    }

    // Handle "Block All Collaborators" option (was "Block Both") OR "Done (Hide Video)" button
    const isDoneButton = menuItem.getAttribute('data-is-done-button') === 'true';
    if (channelInfo.isBlockAllOption && channelInfo.allCollaborators) {
        const collaboratorCount = channelInfo.allCollaborators.length;
        const groupId = channelInfo.collaborationGroupId || collaborationGroupId || generateCollaborationGroupId();
        const state = multiStepSelectionState.get(groupId);
        const resolveFilterAllPreference = (collaborator) => {
            // Prefer explicit per-collaborator or master state when available,
            // otherwise fall back to the Filter All flag from the clicked menu item.
            const fallback = typeof state?.masterFilterAll === 'boolean'
                ? state.masterFilterAll
                : filterAll;
            return getFilterAllPreferenceForCollaborator(collaborator, groupId, fallback);
        };

        if (isDoneButton) {
            const selectedKeys = Array.from(state?.selected || []);
            if (selectedKeys.length === 0) {
                menuItem.setAttribute('data-is-done-button', 'false');
            } else {
                if (titleSpan) titleSpan.textContent = `Blocking ${selectedKeys.length} channel${selectedKeys.length > 1 ? 's' : ''}...`;
                let successCount = 0;
                const collaboratorSource = state?.collaborators?.length ? state.collaborators : channelInfo.allCollaborators;
                const selectedCollaborators = collaboratorSource.filter(collaborator =>
                    selectedKeys.includes(getCollaboratorKey(collaborator))
                );

                for (const collaborator of selectedCollaborators) {
                    const identifier = collaborator.handle || collaborator.id || collaborator.name;
                    if (!identifier) {
                        console.error('FilterTube: Cannot block collaborator - no identifier', collaborator);
                        continue;
                    }

                    // --- FIX: Read the 'filterAll' state from the in-memory map ---
                    const key = getCollaboratorKey(collaborator);
                    const useFilterAll = getFilterAllPreference(groupId, key, filterAll);
                    console.log(`FilterTube: Executing block for ${key} with filterAll: ${useFilterAll}`);
                    // -----------------------------------------------------------------

                    const otherChannels = collaboratorSource
                        .filter(other => other !== collaborator)
                        .map(c => c.handle || c.name);

                    // Execute block
                    const collaboratorMetadata = buildChannelMetadataPayload(collaborator);
                    let result = await addChannelDirectly(identifier, useFilterAll, otherChannels, groupId, collaboratorMetadata);

                    // --- FIX: Add retry logic for robustness ---
                    if (!result.success && collaborator.id && collaborator.id !== identifier) {
                        console.log(`FilterTube: Retrying block for ${collaborator.name} using ID ${collaborator.id}`);
                        result = await addChannelDirectly(collaborator.id, useFilterAll, otherChannels, groupId, collaboratorMetadata);
                    }
                    // -------------------------------------------

                    if (result.success) {
                        successCount++;
                        const selector = `.filtertube-block-channel-item[data-collab-key="${getCollaboratorKey(collaborator)}"][data-collaboration-group-id="${groupId}"]`;
                        const collaboratorItem = state?.dropdown?.querySelector(selector);
                        applyBlockedVisualState(collaboratorItem, collaborator);
                        if (state?.selected) state.selected.delete(getCollaboratorKey(collaborator));
                    } else {
                        console.error('FilterTube: Failed to block collaborator:', identifier, result.error);
                    }
                }

                if (state) {
                    updateMultiStepActionLabel(state);
                }

                if (titleSpan) {
                    if (successCount > 0) {
                        titleSpan.textContent = `✓ Blocked ${successCount}`;
                        titleSpan.style.color = '#10b981';
                    } else {
                        titleSpan.textContent = originalText;
                        titleSpan.style.color = '#ef4444';
                    }
                }

                if (successCount === 0) {
                    menuItem.style.pointerEvents = 'auto';
                    return;
                }
            }
        } else {
            if (titleSpan) titleSpan.textContent = `Blocking ${collaboratorCount} channels...`;

            let successCount = 0;
            for (let i = 0; i < collaboratorCount; i++) {
                const collaborator = channelInfo.allCollaborators[i];
                let input = collaborator.handle || collaborator.id;

                if (!input && collaborator.name) {
                    const guessedHandle = `@${collaborator.name.toLowerCase().replace(/\s+/g, '')}`;
                    console.log(`FilterTube: No handle/id for "${collaborator.name}", trying guessed handle: ${guessedHandle}`);
                    input = guessedHandle;
                }

                if (input) {
                    const otherChannels = channelInfo.allCollaborators
                        .filter((_, idx) => idx !== i)
                        .map(c => c.handle || c.name);
                    const collaboratorFilterAll = resolveFilterAllPreference(collaborator);

                    console.log(`FilterTube: Blocking collaborator ${i + 1}/${collaboratorCount}: ${input}`, 'filterAll:', collaboratorFilterAll);
                    const collaboratorMetadata = buildChannelMetadataPayload(collaborator);
                    const result = await addChannelDirectly(input, collaboratorFilterAll, otherChannels, groupId, collaboratorMetadata);
                    if (result.success) {
                        successCount++;
                        console.log(`FilterTube: Successfully blocked ${input}`);
                    } else {
                        console.error(`FilterTube: Failed to block ${input}:`, result.error);
                    }
                } else {
                    console.error(`FilterTube: Cannot block collaborator - no identifier available:`, collaborator);
                }
            }

            if (titleSpan) {
                titleSpan.textContent = `✓ Blocked ${successCount} channels`;
                titleSpan.style.color = '#10b981'; // green
            }
        }

        // Hide ALL instances of this video card immediately
        if (videoCard) {
            console.log('FilterTube: Hiding video card immediately (Block All Collaborators)');

            // Extract videoId to find all instances of this video
            const videoId = extractVideoIdFromCard(videoCard);
            console.log('FilterTube: Video ID for hiding:', videoId);

            // Find all cards with this videoId
            let cardsToHide = [];

            if (videoId) {
                // Find all video cards on the page
                const allVideoCards = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer');

                allVideoCards.forEach(card => {
                    const cardVideoId = extractVideoIdFromCard(card);
                    if (cardVideoId === videoId) {
                        cardsToHide.push(card);
                    }
                });

                console.log(`FilterTube: Found ${cardsToHide.length} instance(s) of video ${videoId} to hide`);
            } else {
                // Fallback: just hide the current card if we can't extract videoId
                cardsToHide = [videoCard];
                console.log('FilterTube: Could not extract videoId, hiding only current card');
            }

            const blockedMetadata = channelInfo.allCollaborators?.[0] || channelInfo;

            // Hide all instances
            cardsToHide.forEach((card, index) => {
                let containerToHide = card;
                if (card.tagName.toLowerCase().includes('shorts-lockup-view-model')) {
                    let parentContainer = card.closest('ytd-rich-item-renderer');
                    if (!parentContainer) {
                        parentContainer = card.closest('.ytGridShelfViewModelGridShelfItem');
                    }
                    if (parentContainer) {
                        containerToHide = parentContainer;
                    }
                }
                markElementAsBlocked(containerToHide, blockedMetadata, 'pending');
                containerToHide.style.display = 'none';
                containerToHide.classList.add('filtertube-hidden');
                containerToHide.setAttribute('data-filtertube-hidden', 'true');
                console.log(`FilterTube: Applied immediate hiding to instance ${index + 1}:`, containerToHide.tagName || containerToHide.className);
            });

            // After a Block All/Done operation, clear any stale collaborator cache for this video
            const cacheVideoId = ensureVideoIdForCard(videoCard);
            if (cacheVideoId && !resolvedCollaboratorsByVideoId.has(cacheVideoId)) {
                resolvedCollaboratorsByVideoId.delete(cacheVideoId);
            }
        }

        // Close dropdown
        const dropdown = menuItem.closest('ytd-menu-popup-renderer, tp-yt-iron-dropdown, .ytd-menu-popup-renderer');
        if (dropdown) {
            setTimeout(() => {
                // Simulate Escape key to close dropdown naturally
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true
                });
                dropdown.dispatchEvent(escapeEvent);
                document.dispatchEvent(escapeEvent);
            }, 50);
        }

        return;
    }

    // Get the dropdown to check for pending fetches
    const dropdown = menuItem.closest('tp-yt-iron-dropdown, ytd-menu-popup-renderer');

    // Check if there's a background fetch in progress with complete channel info
    const fetchData = dropdown ? pendingDropdownFetches.get(dropdown) : null;
    if (fetchData?.collaboratorPromise) {
        try {
            await fetchData.collaboratorPromise;
        } catch (error) {
            console.warn('FilterTube: Collaborator enrichment failed, continuing with DOM data:', error);
        }
    }
    if (fetchData && !fetchData.cancelled && fetchData.channelInfoPromise) {
        console.log('FilterTube: Waiting for background fetch to complete...');
        try {
            // Wait for the background fetch to complete (likely already done by now)
            const fetchedChannelInfo = await fetchData.channelInfoPromise;
            if (fetchedChannelInfo && (fetchedChannelInfo.id || fetchedChannelInfo.handle)) {
                console.log('FilterTube: Using pre-fetched channel info:', fetchedChannelInfo);
                channelInfo = fetchedChannelInfo;
            }
        } catch (error) {
            console.warn('FilterTube: Background fetch failed, using initial channel info:', error);
            // Fall back to initial channelInfo passed to this function
        }
        if (channelInfo.isBlockAllOption && channelInfo.allCollaborators) {
            const updated = fetchData.initialChannelInfo?.allCollaborators;
            if (updated && updated.length > channelInfo.allCollaborators.length) {
                channelInfo.allCollaborators = updated;
            }
        }
    }

    if (!channelInfo.id && requestedHandle) {
        try {
            const cacheResolvedId = await fetchIdForHandle(requestedHandle);
            if (cacheResolvedId) {
                channelInfo.id = cacheResolvedId;
                console.log('FilterTube: Pre-resolved UC ID via cache', cacheResolvedId, 'for handle', requestedHandle);
            }
        } catch (error) {
            console.warn('FilterTube: Error while resolving handle via cache', error);
        }
    }

    const broadcastChannelMapping = (id, handle) => {
        if (!id || !handle) return;
        try {
            const mapping = { id, handle };
            window.postMessage({
                type: 'FilterTube_UpdateChannelMap',
                payload: [mapping],
                source: 'content_bridge'
            }, '*');
            persistChannelMappings([mapping]);
        } catch (err) {
            console.warn('FilterTube: Failed to broadcast resolved channel mapping', err);
        }
    };

    try {
        // Single channel blocking (normal case)
        // Prefer canonical UC ID when available, fall back to handle
        const input = channelInfo.id || requestedHandleForNetwork || channelInfo.handle;

        // Get collaboration metadata from menu item attribute
        const collaborationWithAttr = menuItem.getAttribute('data-collaboration-with');
        const collaborationWith = collaborationWithAttr ? JSON.parse(collaborationWithAttr) : null;

        // Add channel via background script with filterAll preference and collaboration metadata
        const filterAllSelections = new Map();
        const captureFilterAllSelection = () => {
            const groupId = menuItem.getAttribute('data-collaboration-group-id');
            if (!groupId) return;
            const state = multiStepSelectionState.get(groupId);
            if (!state?.selected) return;
            state.selected.forEach(key => {
                const collaboratorItem = state.dropdown?.querySelector(`.filtertube-block-channel-item[data-collab-key="${key}"][data-collaboration-group-id="${groupId}"]`);
                const toggleEl = collaboratorItem?.querySelector('.filtertube-filter-all-toggle');
                filterAllSelections.set(key, isFilterAllToggleActive(toggleEl));
            });
        };

        let result = await addChannelDirectly(
            input,
            filterAll,
            collaborationWith,
            menuItem.getAttribute('data-collaboration-group-id'),
            buildChannelMetadataPayload(channelInfo)
        );
        let handleResolutionFailed404 = false;

        // If the background could not fetch the channel page (e.g., /@handle/about returns 404),
        // try to recover using ytInitialData for this video, then fall back to the Shorts URL helper.
        if (!result.success && /Failed to fetch channel page: 404/i.test(result.error || '') && channelInfo.videoId) {
            console.warn('FilterTube: Initial block failed with 404. Attempting ytInitialData + shorts fallback for', channelInfo.videoId);

            // 1) Try resolving the channel directly from ytInitialData (search/watch responses)
            try {
                const ytChannel = await searchYtInitialDataForVideoChannel(channelInfo.videoId, requestedHandle || null);
                if (ytChannel && (ytChannel.id || ytChannel.handle)) {
                    let retryInput = '';

                    // Prefer UC ID when available
                    if (ytChannel.id && ytChannel.id.startsWith('UC')) {
                        retryInput = ytChannel.id;
                        channelInfo.id = ytChannel.id;
                    }

                    // Fallback to a normalized handle from ytInitialData if no UC ID
                    if (!retryInput && ytChannel.handle) {
                        const normalizedFromYt = normalizeHandleValue(ytChannel.handle);
                        if (normalizedFromYt) {
                            retryInput = normalizedFromYt;
                            channelInfo.handle = requestedHandle || normalizedFromYt;
                        }
                    }

                    // If we only have a handle, attempt channelMap resolution before retrying.
                    if (!retryInput && channelInfo.handle) {
                        const mappedId = await fetchIdForHandle(channelInfo.handle, { skipNetwork: true });
                        if (mappedId) {
                            channelInfo.id = mappedId;
                            retryInput = mappedId;
                        }
                    }

                    if (retryInput) {
                        console.log('FilterTube: Retrying block with ytInitialData identifier:', retryInput);

                        // Cache the resolved handle/ID on a nearby card element to help future passes
                        const cacheTarget = videoCard || document.querySelector(`ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]`)?.closest('[data-filtertube-channel-handle],[data-filtertube-channel-id]');
                        if (cacheTarget) {
                            if (channelInfo.handle) {
                                cacheTarget.setAttribute('data-filtertube-channel-handle', channelInfo.handle);
                            }
                            if (channelInfo.id) {
                                cacheTarget.setAttribute('data-filtertube-channel-id', channelInfo.id);
                            }
                        }
                        if (channelInfo.id && (channelInfo.handle || requestedHandle)) {
                            broadcastChannelMapping(channelInfo.id, channelInfo.handle || requestedHandle);
                        }

                        result = await addChannelDirectly(
                            retryInput,
                            filterAll,
                            collaborationWith,
                            menuItem.getAttribute('data-collaboration-group-id'),
                            buildChannelMetadataPayload(channelInfo)
                        );
                    }
                }
            } catch (e) {
                console.warn('FilterTube: ytInitialData channel lookup failed, continuing to Shorts fallback:', e);
            }

            // 2) If ytInitialData path did not succeed, fall back to Shorts-specific helper
            if (!result.success) {
                const fallbackInfo = await fetchChannelFromShortsUrl(channelInfo.videoId, requestedHandle || null);
                if (fallbackInfo && (fallbackInfo.id || fallbackInfo.handle)) {
                    let retryInput = null;

                    // Prefer UC ID from Shorts page when available
                    if (fallbackInfo.id && typeof fallbackInfo.id === 'string' && fallbackInfo.id.startsWith('UC')) {
                        channelInfo.id = fallbackInfo.id;
                        retryInput = fallbackInfo.id;
                    }

                    // Normalize handle from Shorts page if present
                    let normalizedHandle = null;
                    if (fallbackInfo.handle) {
                        normalizedHandle = normalizeHandleValue(fallbackInfo.handle);
                        if (normalizedHandle) {
                            channelInfo.handle = normalizedHandle;
                        }
                    }

                    // If Shorts only gave us a handle, attempt to resolve UC ID via channelMap.
                    if (!retryInput && channelInfo.handle) {
                        const mappedId = await fetchIdForHandle(channelInfo.handle, { skipNetwork: true });
                        if (mappedId) {
                            channelInfo.id = mappedId;
                            retryInput = mappedId;
                        }
                    }

                    // If we have both UC ID and handle, broadcast mapping to Background for persistence
                    if (channelInfo.id && channelInfo.handle) {
                        broadcastChannelMapping(channelInfo.id, channelInfo.handle);
                    }

                    // If no UC ID, fall back to handle as last resort
                    if (!retryInput) {
                        retryInput = normalizedHandle;
                    }

                    if (retryInput) {
                        console.log('FilterTube: Retrying block with Shorts identifier:', retryInput);

                        // Cache the resolved handle/ID on a nearby card element to help future passes
                        const cacheTarget = videoCard || document
                            .querySelector(`ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]`)?.closest('[data-filtertube-channel-handle],[data-filtertube-channel-id]');
                        if (cacheTarget) {
                            if (channelInfo.handle) {
                                cacheTarget.setAttribute('data-filtertube-channel-handle', channelInfo.handle);
                            }
                            if (channelInfo.id) {
                                cacheTarget.setAttribute('data-filtertube-channel-id', channelInfo.id);
                            }
                        }

                        result = await addChannelDirectly(
                            retryInput,
                            filterAll,
                            collaborationWith,
                            menuItem.getAttribute('data-collaboration-group-id'),
                            buildChannelMetadataPayload(channelInfo)
                        );
                    }
                }
            }

            if (!result.success) {
                handleResolutionFailed404 = true;
            }
        }

        if (!result.success) {
            // Error state
            if (titleSpan) {
                if (handleResolutionFailed404 && requestedHandle) {
                    titleSpan.textContent = '✗ Channel handle broken (404)';
                } else {
                    titleSpan.textContent = '✗ Failed to block';
                }
                titleSpan.style.color = '#ef4444'; // red
            }
            if (handleResolutionFailed404 && requestedHandle) {
                console.error('FilterTube: YouTube returned 404 for handle. Unable to resolve UC ID.', {
                    handle: requestedHandle,
                    videoId: channelInfo.videoId,
                    error: result.error
                });
            } else {
                console.error('FilterTube: Failed to block channel:', result.error);
            }
            setTimeout(() => {
                if (titleSpan) {
                    titleSpan.textContent = originalText;
                    titleSpan.style.color = '#ef4444';
                }
                menuItem.style.pointerEvents = 'auto';
            }, 2000);
            return;
        }

        // At this point we succeeded. If we still don't have a UC ID, warn reach may be limited.
        if (!channelInfo.id && channelInfo.handle) {
            console.warn('FilterTube: Blocked using handle only; no UC ID was resolved. Other videos may remain until a UC ID is learned.', {
                handle: channelInfo.handle,
                videoId: channelInfo.videoId || null
            });
        }

        // Success state - show checkmark with channel name for multi-step, or generic for single
        const isMultiStep = menuItem.getAttribute('data-multi-step') === 'true';

        if (titleSpan) {
            if (isMultiStep && channelInfo.name) {
                // Multi-step: Show "✓ ChannelName" to indicate selection
                titleSpan.textContent = `✓ ${channelInfo.name}`;
            } else {
                titleSpan.textContent = '✓ Channel Blocked';
            }
            titleSpan.style.color = '#10b981'; // green
        }

        // Add blocked styling class to the menu item
        menuItem.classList.add('filtertube-blocked');

        console.log('FilterTube: Successfully blocked channel:', channelInfo, 'filterAll:', filterAll);

        if (isMultiStep) {
            if (collaborationGroupId) {
                captureFilterAllSelection();
                markMultiStepSelection(collaborationGroupId, channelInfo, menuItem);
                const state = multiStepSelectionState.get(collaborationGroupId);
                if (state && filterAllSelections.size > 0) {
                    state.selected.forEach(key => {
                        if (filterAllSelections.has(key)) {
                            const targetItem = state.dropdown?.querySelector(`.filtertube-block-channel-item[data-collab-key="${key}"][data-collaboration-group-id="${collaborationGroupId}"]`);
                            const toggleEl = targetItem?.querySelector('.filtertube-filter-all-toggle');
                            if (toggleEl) {
                                if (filterAllSelections.get(key)) {
                                    toggleEl.classList.add('active');
                                } else {
                                    toggleEl.classList.remove('active');
                                }
                            }
                        }
                    });
                }
            } else {
                menuItem.classList.add('filtertube-collab-selected');
            }
            // Don't hide video or close dropdown - let user select more channels
            return;
        }

        // IMMEDIATELY hide ALL instances of this video card for instant feedback
        // (YouTube sometimes shows the same collaboration video multiple times in search results)
        if (videoCard) {
            console.log('FilterTube: Hiding video card immediately');

            // Check if this is a shorts card
            const isShorts = videoCard.tagName.toLowerCase().includes('shorts-lockup-view-model') ||
                videoCard.tagName.toLowerCase().includes('reel');

            // For shorts, find the correct parent container to hide
            let containerToHide = videoCard;
            if (isShorts) {
                // Try homepage container (ytd-rich-item-renderer)
                let parentContainer = videoCard.closest('ytd-rich-item-renderer');
                // If not found, try search page container (div.ytGridShelfViewModelGridShelfItem)
                if (!parentContainer) {
                    parentContainer = videoCard.closest('.ytGridShelfViewModelGridShelfItem');
                }
                if (parentContainer) {
                    containerToHide = parentContainer;
                }
                console.log('FilterTube: Shorts detected, hiding container:', containerToHide.tagName || containerToHide.className);
            }

            // Immediate hiding: Apply direct styles + class to ensure it's hidden right away
            markElementAsBlocked(containerToHide, channelInfo, 'pending');
            containerToHide.style.display = 'none';
            containerToHide.classList.add('filtertube-hidden');
            containerToHide.setAttribute('data-filtertube-hidden', 'true');
            console.log('FilterTube: Applied immediate hiding to:', containerToHide.tagName || containerToHide.className);

            // For non-shorts, also try to find other instances of the same video
            if (!isShorts) {
                const videoId = extractVideoIdFromCard(videoCard);
                if (videoId) {
                    const allVideoCards = document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer');
                    allVideoCards.forEach(card => {
                        if (card === containerToHide) return; // Already hidden
                        const cardVideoId = extractVideoIdFromCard(card);
                        if (cardVideoId === videoId) {
                            markElementAsBlocked(card, channelInfo, 'pending');
                            card.style.display = 'none';
                            card.classList.add('filtertube-hidden');
                            card.setAttribute('data-filtertube-hidden', 'true');
                            console.log('FilterTube: Also hiding duplicate video card');
                        }
                    });
                }
            }


            // Close the dropdown since the video is now hidden
            const dropdown = menuItem.closest('tp-yt-iron-dropdown');
            if (dropdown) {
                // Strategy 1: Simulate Escape key to close dropdown naturally
                const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true
                });
                dropdown.dispatchEvent(escapeEvent);
                document.dispatchEvent(escapeEvent);

                // Strategy 2: Remove focus trap
                const activeElement = document.activeElement;
                if (activeElement && dropdown.contains(activeElement)) {
                    activeElement.blur();
                }

                // Strategy 3: Try YouTube's close method
                if (typeof dropdown.close === 'function') {
                    dropdown.close();
                }

                // Strategy 4: Force hide
                dropdown.style.display = 'none';
                dropdown.setAttribute('aria-hidden', 'true');

                // Strategy 5: Click elsewhere to steal focus (simulate user clicking on page)
                setTimeout(() => {
                    const ytdApp = document.querySelector('ytd-app');
                    if (ytdApp) {
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        ytdApp.dispatchEvent(clickEvent);
                    }
                }, 50);
            }
        }

        // After storage is updated, pull fresh settings (to include the new channel) and re-run DOM pass
        let refreshedSettings = null;
        try {
            const refreshed = await requestSettingsFromBackground();
            if (refreshed?.success && refreshed.settings) {
                refreshedSettings = refreshed.settings;
                currentSettings = refreshed.settings;
            }
        } catch (settingsError) {
            console.warn('FilterTube: Failed to refresh settings after blocking channel', settingsError);
        }
        try {
            applyDOMFallback(refreshedSettings || currentSettings, { forceReprocess: true, preserveScroll: true });
        } catch (domError) {
            console.warn('FilterTube: DOM fallback re-run failed after blocking channel', domError);
        }

    } catch (error) {
        console.error('FilterTube: Error blocking channel:', error);
        if (titleSpan) {
            titleSpan.textContent = '✗ Error';
            titleSpan.style.color = '#ef4444';
        }
        setTimeout(() => {
            if (titleSpan) {
                titleSpan.textContent = originalText;
                titleSpan.style.color = '#ef4444';
            }
            menuItem.style.pointerEvents = 'auto';
        }, 2000);
    }
}

/**
 * Add channel directly using chrome.storage (bypassing StateManager for content script)
 * @param {string} input - Channel identifier (@handle or UC ID)
 * @param {boolean} filterAll - Whether to enable Filter All for this channel
 * @param {Array<string>} collaborationWith - Optional list of handles/names this channel is collaborating with
 * @param {string} collaborationGroupId - Optional UUID linking channels blocked together via "Block All"
 * @returns {Promise<Object>} Result with success status
 */
async function addChannelDirectly(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}) {
    try {
        const rawValue = input.trim();
        if (!rawValue) {
            return { success: false, error: 'Empty input' };
        }

        // Send message to background script to add channel with filterAll preference
        return new Promise((resolve) => {
            browserAPI_BRIDGE.runtime.sendMessage({
                type: 'addFilteredChannel',
                input: rawValue,
                filterAll: filterAll,
                collaborationWith: collaborationWith,
                collaborationGroupId: collaborationGroupId,
                displayHandle: metadata.handleDisplay || null,
                canonicalHandle: metadata.canonicalHandle || null,
                channelName: metadata.channelName || null
            }, (response) => {
                resolve(response || { success: false, error: 'No response from background' });
            });
        });

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Add "Filter All Content" checkbox below the blocked channel
 * @param {Element} menuItem - The menu item element
 * @param {Object} channelData - Channel data from add result
 */
function addFilterAllContentCheckbox(menuItem, channelData) {
    // Try NEW menu structure first
    let container = menuItem.querySelector('.yt-list-item-view-model__text-wrapper');

    // Fallback to OLD menu structure
    if (!container) {
        container = menuItem.querySelector('tp-yt-paper-item');
    }

    if (!container) {
        console.error('FilterTube: Could not find container for checkbox');
        return;
    }

    // Don't add if already exists
    if (container.querySelector('.filtertube-filter-all-checkbox')) {
        return;
    }

    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'filtertube-filter-all-checkbox';
    checkboxWrapper.style.cssText = 'margin-top: 8px; padding-left: 4px; font-size: 12px; color: #aaa; cursor: pointer; user-select: none;';

    checkboxWrapper.innerHTML = `
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" class="filtertube-filter-all-toggle" style="cursor: pointer;" />
            <span>Filter All Content</span>
        </label>
    `;

    const checkbox = checkboxWrapper.querySelector('input[type="checkbox"]');

    // Add click event on checkbox itself
    checkbox.addEventListener('click', (e) => {
        // Allow the click to toggle the checkbox
        e.stopPropagation();
    });

    // Add change event to handle the toggle
    checkbox.dataset.userOverride = 'true';
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const checked = checkbox.checked;

        // Send message to background to toggle filterAll
        browserAPI_BRIDGE.runtime.sendMessage({
            type: 'toggleChannelFilterAll',
            channelId: channelData?.id || channelData?.handle,
            value: checked
        }, (response) => {
            if (response && response.success) {
                console.log('FilterTube: Successfully toggled Filter All Content:', checked);
            } else {
                console.error('FilterTube: Failed to toggle Filter All Content');
            }
        });

        console.log('FilterTube: Toggled Filter All Content:', checked);
    });

    container.appendChild(checkboxWrapper);
    console.log('FilterTube: Added Filter All Content checkbox');

    applyFilterAllStateToToggle(checkbox, channelData?.filterAll);
}

/**
 * Track the last clicked 3-dot button to find associated video card
 */
let lastClickedMenuButton = null;

/**
 * Track which dropdowns we've already injected into (prevent flashing)
 * Map: dropdown -> {videoCardId, isProcessing}
 */
const injectedDropdowns = new WeakMap();
let filterTubeMenuStylesInjected = false;

function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

/**
 * Synchronous lock to prevent race conditions when multiple mutation events fire
 * Set: dropdown elements currently being processed
 */
const processingDropdowns = new WeakSet();

/**
 * Track pending async channel fetches for shorts (prevents duplicates)
 * Map: videoId -> Promise
 */
const pendingShortsFetches = new Map();

/**
 * Track pending channel info fetches per dropdown (for instant UI + background fetch)
 * WeakMap: dropdown -> {channelInfoPromise, cancelled, initialChannelInfo}
 */
const pendingDropdownFetches = new WeakMap();

/**
 * Observe dropdowns and inject FilterTube menu items
 */
function setupMenuObserver() {
    // Track clicks on 3-dot buttons (comprehensive selectors for all YouTube contexts)
    document.addEventListener('click', (e) => {
        const menuButton = e.target.closest(
            'button[aria-label*="More"], ' +
            'button[aria-label*="Action"], ' +
            'button[aria-label*="menu"], ' +
            'yt-icon-button.dropdown-trigger, ' +
            'yt-icon-button#button.dropdown-trigger, ' +
            '.shortsLockupViewModelHostOutsideMetadataMenu button, ' +
            'ytd-menu-renderer button, ' +
            '#menu button[aria-label], ' +
            'ytd-reel-item-renderer button[aria-label*="More"], ' +
            'ytd-reel-video-renderer button[aria-label*="More"], ' +
            'ytm-menu-renderer button'
        );
        if (menuButton) {
            lastClickedMenuButton = menuButton;
            console.log('FilterTube: 3-dot button clicked, button:', menuButton.getAttribute('aria-label'));

            // Also try to find and inject immediately into existing dropdown
            setTimeout(() => {
                tryInjectIntoVisibleDropdown();
            }, 150);
        }
    }, true);

    // Wait for document.body to be ready
    const startObserver = () => {
        if (!document.body) {
            setTimeout(startObserver, 100);
            return;
        }

        // Observe dropdown menus appearing (childList for new nodes)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Check for new nodes
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    const dropdown = node.matches?.('tp-yt-iron-dropdown') ? node : node.querySelector?.('tp-yt-iron-dropdown');

                    if (dropdown) {
                        console.log('FilterTube: Dropdown added to DOM');
                        // Call async function without awaiting (fire and forget)
                        handleDropdownAppeared(dropdown).catch(err => {
                            console.error('FilterTube: Error in handleDropdownAppeared:', err);
                        });
                    }
                }

                // Check for attribute changes (dropdown becoming visible)
                if (mutation.type === 'attributes' && mutation.target.matches?.('tp-yt-iron-dropdown')) {
                    const dropdown = mutation.target;
                    const isVisible = dropdown.style.display !== 'none' && dropdown.getAttribute('aria-hidden') !== 'true';

                    if (isVisible) {
                        console.log('FilterTube: Dropdown became visible (attribute change)');
                        // Call async function without awaiting (fire and forget)
                        handleDropdownAppeared(dropdown).catch(err => {
                            console.error('FilterTube: Error in handleDropdownAppeared:', err);
                        });
                    } else {
                        // Dropdown hidden - clear cached state so next open re-injects fresh
                        if (injectedDropdowns.has(dropdown)) {
                            console.log('FilterTube: Dropdown hidden, clearing cached state');
                            injectedDropdowns.delete(dropdown);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'aria-hidden']
        });

        console.log('FilterTube: Menu observer started');
    };

    startObserver();
}

/**
 * Try to inject into currently visible dropdown
 */
function tryInjectIntoVisibleDropdown() {
    const visibleDropdowns = document.querySelectorAll('tp-yt-iron-dropdown');

    for (const dropdown of visibleDropdowns) {
        const isVisible = dropdown.style.display !== 'none' && dropdown.getAttribute('aria-hidden') !== 'true';

        if (isVisible) {
            console.log('FilterTube: Found visible dropdown');
            // Call async function without awaiting (fire and forget)
            handleDropdownAppeared(dropdown).catch(err => {
                console.error('FilterTube: Error in handleDropdownAppeared:', err);
            });
            break; // Only inject into first visible one
        }
    }
}

/**
 * Handle when a dropdown appears (either added or made visible)
 */
async function handleDropdownAppeared(dropdown) {
    // Synchronous lock to prevent race conditions from multiple mutation events
    if (processingDropdowns.has(dropdown)) {
        console.log('FilterTube: Dropdown already being processed (sync lock), skipping');
        return;
    }
    processingDropdowns.add(dropdown);

    try {
        await handleDropdownAppearedInternal(dropdown);
    } finally {
        // Release lock after processing completes
        processingDropdowns.delete(dropdown);
    }
}

/**
 * Internal handler for dropdown appearance (called after sync lock acquired)
 */
async function handleDropdownAppearedInternal(dropdown) {
    if (!lastClickedMenuButton) {
        console.log('FilterTube: No button reference, skipping injection');
        return;
    }

    console.log('FilterTube: Dropdown appeared, finding video card...');

    // Find the associated video/short card from the button (comprehensive selectors)
    const videoCard = lastClickedMenuButton.closest(
        'ytd-rich-item-renderer, ' +
        'ytd-video-renderer, ' +
        'ytd-grid-video-renderer, ' +
        'ytd-compact-video-renderer, ' +
        'ytd-reel-item-renderer, ' +
        'ytd-reel-video-renderer, ' +
        'reel-item-endpoint, ' +
        'ytd-compact-promoted-video-renderer, ' +
        'ytm-compact-video-renderer, ' +
        'ytm-video-with-context-renderer, ' +
        'ytd-post-renderer, ' +                          // ← YouTube Posts
        'ytd-playlist-panel-video-renderer, ' +         // ← Playlist videos
        'ytd-playlist-video-renderer, ' +               // ← Playlist videos (alternate)
        'ytm-shorts-lockup-view-model, ' +              // ← Shorts in mobile/search
        'ytm-shorts-lockup-view-model-v2, ' +           // ← Shorts variant
        'ytm-item-section-renderer, ' +                 // ← Container for shorts
        'ytd-rich-shelf-renderer'                       // ← Shelf containing shorts
    );

    if (videoCard) {
        console.log('FilterTube: Found video card:', videoCard.tagName);

        // Get unique ID for this video card
        let videoCardId = videoCard.getAttribute('data-filtertube-unique-id');
        if (!videoCardId) {
            // Try to extract video ID from links
            const videoLink = videoCard.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
            const videoIdMatch = videoLink?.href.match(/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);

            if (videoIdMatch) {
                videoCardId = videoIdMatch[1];
            } else {
                // Fallback: generate random ID
                videoCardId = `card-${Math.random().toString(36).substr(2, 9)}`;
            }
            videoCard.setAttribute('data-filtertube-unique-id', videoCardId);
        }

        // CRITICAL: Check if this dropdown is already being processed for this video
        const dropdownState = injectedDropdowns.get(dropdown);

        if (dropdownState?.videoCardId === videoCardId) {
            if (dropdownState.isProcessing) {
                console.log('FilterTube: Dropdown already processing for this video, skipping');
                return;
            }
            if (dropdownState.isComplete) {
                // Verify menu item still exists in DOM before skipping
                const existingMenuItem = dropdown.querySelector('.filtertube-block-channel-item');
                if (existingMenuItem) {
                    // Check if the menu item has stale state (e.g., "✓ Channel Blocked" or "✓ Blocked")
                    const titleSpan = existingMenuItem.querySelector('.filtertube-menu-title');
                    const titleText = titleSpan?.textContent || '';
                    const isStaleState = titleText.includes('✓') || titleText.includes('Fetching') || titleText.includes('Blocking');

                    if (isStaleState) {
                        console.log('FilterTube: Menu item has stale state, re-injecting fresh');
                        injectedDropdowns.delete(dropdown);
                        // Continue to re-inject
                    } else {
                        console.log('FilterTube: Dropdown already injected for this video, skipping');
                        return;
                    }
                } else {
                    console.log('FilterTube: State says complete but menu item missing, re-injecting');
                    // Reset state and continue to re-inject
                    injectedDropdowns.delete(dropdown);
                }
            }
        }

        if (dropdownState && dropdownState.videoCardId !== videoCardId) {
            console.log('FilterTube: Dropdown reused for different video - will clean and reinject');
            // Old items will be removed by injectFilterTubeMenuItem automatically
        }

        // Mark as being processed IMMEDIATELY (prevents duplicate calls)
        injectedDropdowns.set(dropdown, { videoCardId, isProcessing: true, isComplete: false });

        // Watch for card removal (video hidden) and close dropdown
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.removedNodes) {
                    if (node === videoCard || node.contains(videoCard)) {
                        console.log('FilterTube: Video card removed, closing dropdown');
                        dropdown.style.display = 'none';
                        dropdown.setAttribute('aria-hidden', 'true');
                        observer.disconnect();
                    }
                }
            }
        });

        if (videoCard.parentElement) {
            observer.observe(videoCard.parentElement, { childList: true });
        }

        // Watch for dropdown closing (to cancel pending fetches if user doesn't block)
        const dropdownObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'aria-hidden') {
                    const isHidden = dropdown.getAttribute('aria-hidden') === 'true';
                    if (isHidden) {
                        // Dropdown closed - mark any pending fetch as cancelled
                        const fetchData = pendingDropdownFetches.get(dropdown);
                        if (fetchData) {
                            fetchData.cancelled = true;
                            console.log('FilterTube: Dropdown closed, marked fetch as cancelled');
                        }
                        dropdownObserver.disconnect();
                    }
                }
            }
        });
        dropdownObserver.observe(dropdown, { attributes: true, attributeFilter: ['aria-hidden'] });

        // Determine if this is a shorts card
        const isShorts = videoCard.tagName.toLowerCase().includes('shorts') ||
            videoCard.tagName.toLowerCase().includes('reel');

        try {
            // For shorts, we might need to wait for async channel fetch
            // Do the injection WITHOUT setTimeout to avoid race conditions
            await injectFilterTubeMenuItem(dropdown, videoCard);

            // Mark as complete
            injectedDropdowns.set(dropdown, { videoCardId, isProcessing: false, isComplete: true });
        } catch (error) {
            console.error('FilterTube: Error injecting menu item:', error);
            // Reset state on error so it can be retried
            injectedDropdowns.set(dropdown, { videoCardId, isProcessing: false, isComplete: false });
        }
    } else {
        console.log('FilterTube: Could not find video card from button');

        // CRITICAL: Clean up any stale FilterTube items from dropdown
        // (prevents old "✓ Channel Blocked" showing when we can't identify the video)
        const oldItems = dropdown.querySelectorAll('.filtertube-block-channel-item');
        if (oldItems.length > 0) {
            console.log('FilterTube: Removing stale FilterTube items from dropdown');
            oldItems.forEach(item => item.remove());
        }
    }
}

// Initialize menu observer after a delay
setTimeout(() => {
    setupMenuObserver();
}, 1000);

window.addEventListener('message', handleMainWorldMessages, false);
try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }

setTimeout(() => initialize(), 50);

// Duplicate function removed - using the version at line 105
