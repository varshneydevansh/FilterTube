// js/content_bridge.js - Isolated world script

console.log("FilterTube: content_bridge.js loaded (Isolated World)");

function buildChannelMetadataPayload(channelInfo = {}) {
    const canonicalRaw = channelInfo.canonicalHandle || channelInfo.handleDisplay || channelInfo.handle || '';
    const canonicalExtracted = extractRawHandle(canonicalRaw);
    const canonical = canonicalExtracted || (typeof canonicalRaw === 'string' && canonicalRaw.trim().startsWith('@') ? canonicalRaw.trim() : '');

    const isHandleLike = (value) => {
        if (!value || typeof value !== 'string') return false;
        return value.trim().startsWith('@');
    };

    const isUcIdLike = (value) => {
        if (!value || typeof value !== 'string') return false;
        return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
    };

    const isProbablyNotChannelName = (value) => {
        if (!value || typeof value !== 'string') return true;
        const trimmed = value.trim();
        if (!trimmed) return true;
        if (isHandleLike(trimmed)) return true;
        if (isUcIdLike(trimmed)) return true;
        if (trimmed.includes('•')) return true;
        if (/\bviews?\b/i.test(trimmed)) return true;
        if (/\bago\b/i.test(trimmed)) return true;
        if (/\bwatching\b/i.test(trimmed)) return true;
        const lower = trimmed.toLowerCase();
        if (lower.startsWith('mix')) return true;
        if (lower.includes('mix') && trimmed.includes('–')) return true;
        return false;
    };

    const primaryNameCandidate = typeof channelInfo?.name === 'string' ? channelInfo.name : '';
    const expectedNameCandidate = typeof channelInfo?.expectedChannelName === 'string' ? channelInfo.expectedChannelName : '';
    const safeName = !isProbablyNotChannelName(primaryNameCandidate)
        ? String(primaryNameCandidate).trim()
        : (!isProbablyNotChannelName(expectedNameCandidate) ? String(expectedNameCandidate).trim() : '');

    const isProbablyNotDisplayHandle = (value) => {
        if (!value || typeof value !== 'string') return true;
        const trimmed = value.trim();
        if (!trimmed) return true;
        if (isUcIdLike(trimmed)) return true;
        if (trimmed.toLowerCase() === 'channel') return true;
        if (trimmed.includes('•')) return true;
        if (/\bviews?\b/i.test(trimmed)) return true;
        if (/\bago\b/i.test(trimmed)) return true;
        if (/\bwatching\b/i.test(trimmed)) return true;
        return false;
    };

    const handleDisplayCandidate = typeof channelInfo.handleDisplay === 'string' ? channelInfo.handleDisplay.trim() : '';

    // Strict rule: handleDisplay must only ever be an actual @handle.
    // Never fall back to channel name here; name is stored separately as channelName.
    const display = (isHandleLike(handleDisplayCandidate) && !isProbablyNotDisplayHandle(handleDisplayCandidate))
        ? handleDisplayCandidate
        : (isHandleLike(canonical) ? canonical : '');
    return {
        canonicalHandle: canonical || null,
        handleDisplay: display || null,
        channelName: safeName || null,
        channelLogo: channelInfo.logo || null,
        videoId: channelInfo.videoId || null,
        customUrl: channelInfo.customUrl || null,  // c/Name or user/Name for legacy channels
        source: channelInfo.source || null
    };
}

function pickMenuChannelDisplayName(channelInfo, injectionOptions = {}) {
    const displayCandidate = typeof injectionOptions.displayName === 'string'
        ? injectionOptions.displayName.trim()
        : '';
    const nameCandidate = typeof channelInfo?.name === 'string'
        ? channelInfo.name.trim()
        : '';
    const expectedNameCandidate = typeof channelInfo?.expectedChannelName === 'string'
        ? channelInfo.expectedChannelName.trim()
        : '';

    const isHandleLike = (value) => {
        if (!value || typeof value !== 'string') return false;
        return value.trim().startsWith('@');
    };

    const isUcIdLike = (value) => {
        if (!value || typeof value !== 'string') return false;
        return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
    };

    const isProbablyNotChannelName = (value) => {
        if (!value || typeof value !== 'string') return true;
        const trimmed = value.trim();
        if (!trimmed) return true;
        if (isUcIdLike(trimmed)) return true;
        if (trimmed.includes('•')) return true;
        if (/\bviews?\b/i.test(trimmed)) return true;
        if (/\bago\b/i.test(trimmed)) return true;
        if (/\bwatching\b/i.test(trimmed)) return true;
        const lower = trimmed.toLowerCase();
        if (lower === 'channel') return true;
        if (lower.startsWith('mix')) return true;
        if (lower.startsWith('my mix')) return true;
        if (/^my\s*mix/i.test(trimmed)) return true;
        if (/\band more\b/i.test(trimmed) && /mix/i.test(trimmed)) return true;
        if (lower.includes('mix') && trimmed.includes('–')) return true;
        return false;
    };

    const safeDisplay = (!isHandleLike(displayCandidate) && displayCandidate && !isProbablyNotChannelName(displayCandidate))
        ? displayCandidate
        : '';
    const safeName = (!isHandleLike(nameCandidate) && nameCandidate && !isProbablyNotChannelName(nameCandidate))
        ? nameCandidate
        : '';
    const safeExpectedName = (!isHandleLike(expectedNameCandidate) && expectedNameCandidate && !isProbablyNotChannelName(expectedNameCandidate))
        ? expectedNameCandidate
        : '';

    const preferred = safeDisplay || safeName || safeExpectedName || '';

    const mappedHandle = (() => {
        try {
            const id = typeof channelInfo?.id === 'string' ? channelInfo.id.trim().toLowerCase() : '';
            if (!id || !id.startsWith('uc')) return '';
            const map = currentSettings?.channelMap || {};
            const candidate = typeof map[id] === 'string' ? map[id].trim() : '';
            if (!candidate || !candidate.startsWith('@')) return '';
            return candidate;
        } catch (e) {
            return '';
        }
    })();

    return (
        preferred ||
        mappedHandle ||
        channelInfo?.handleDisplay ||
        channelInfo?.handle ||
        channelInfo?.customUrl ||
        channelInfo?.id ||
        'Channel'
    );
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

    const hasVisibleMiniplayer = () => {
        try {
            const miniplayer = document.querySelector('ytd-miniplayer');
            if (!miniplayer) return false;
            if (miniplayer.getAttribute('hidden') !== null) return false;
            if (miniplayer.getAttribute('aria-hidden') === 'true') return false;
            const className = (miniplayer.getAttribute('class') || '').toLowerCase();
            if (className.includes('visible')) return true;
            return miniplayer.style.display !== 'none';
        } catch (e) {
            return false;
        }
    };

    const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true
    });
    dropdown.dispatchEvent(escapeEvent);

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
    try {
        if (dropdown.matches?.('ytm-menu-popup-renderer, div.menu-content[role="dialog"]')) {
            dropdown.setAttribute('hidden', '');
        } else {
            dropdown.removeAttribute('hidden');
        }
    } catch (e) {
    }

    // Click elsewhere to release focus trap
    setTimeout(() => {
        if (hasVisibleMiniplayer()) return;
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

function waitForNextFrameDelay(delayMs = 0) {
    return new Promise((resolve) => {
        const schedule = () => setTimeout(resolve, Math.max(0, delayMs));
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(schedule);
        } else {
            schedule();
        }
    });
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
            item.setAttribute('tabindex', '0');
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
        const menuList = oldMenuList.querySelector('tp-yt-paper-listbox#items') || oldMenuList.querySelector('tp-yt-paper-listbox') || oldMenuList;
        const isMobileMenu = Boolean(
            menuList.closest?.('ytm-menu-popup-renderer') ||
            menuList.closest?.('ytm-app') ||
            oldMenuList.matches?.('div.menu-content[role="dialog"]') ||
            oldMenuList.querySelector?.('ytm-menu-service-item-renderer')
        );
        const rendererTag = isMobileMenu ? 'ytm-menu-service-item-renderer' : 'ytd-menu-service-item-renderer';
        const rendererScope = isMobileMenu ? 'ytm-menu-popup-renderer' : 'ytd-menu-popup-renderer';
        const itemScope = isMobileMenu ? 'ytm-menu-service-item-renderer' : 'ytd-menu-service-item-renderer';
        const makeItem = (primary, secondary) => {
            const item = document.createElement(rendererTag);
            item.className = `style-scope ${rendererScope} filtertube-block-channel-item filtertube-collab-placeholder`;
            item.setAttribute('role', 'menuitem');
            item.setAttribute('tabindex', '-1');
            item.style.opacity = '0.6';
            item.style.pointerEvents = 'none';
            item.innerHTML = `
                <tp-yt-paper-item class="style-scope ${itemScope} filtertube-menu-item" role="option" tabindex="-1">
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
        'tp-yt-paper-listbox#items, ' +
        'tp-yt-paper-listbox, ' +
        'div.menu-content[role="dialog"], ' +
        'ytm-menu-popup-renderer, ' +
        'ytm-menu-service-item-renderer, ' +
        '#items.ytm-menu-popup-renderer, ' +
        '#items.style-scope.ytm-menu-popup-renderer, ' +
        'bottom-sheet-container, ' +
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
        // If we already have some collaborator names from DOM, render them immediately
        // instead of showing a generic "Fetching" placeholder.
        if (channelInfo.allCollaborators && Array.isArray(channelInfo.allCollaborators) && channelInfo.allCollaborators.length >= 2) {
            console.log('FilterTube: Rendering available collaborator names immediately (enrichment pending)');
            // Continue below to render the collaboration entries
        } else {
            injectCollaboratorPlaceholderMenu(containers.newMenuList, containers.oldMenuList);
            forceDropdownResize(dropdown);
            return;
        }
    }

    if (channelInfo.isCollaboration && channelInfo.allCollaborators && channelInfo.allCollaborators.length >= 2) {
        const collaborators = channelInfo.allCollaborators;
        const collaboratorCount = Math.min(collaborators.length, 6);
        const isMultiStep = collaboratorCount >= 3;
        const groupId = generateCollaborationGroupId();
        const hasIdentifier = (c) => Boolean(c?.handle || c?.id || c?.customUrl);
        const anyMissingIdentifiers = collaborators.some(c => !hasIdentifier(c));

        if (containers.newMenuList) {
            for (let i = 0; i < collaboratorCount; i++) {
                const collaborator = collaborators[i];
                const otherChannels = collaborators
                    .filter((_, idx) => idx !== i)
                    .map(c => c.handle || c.id || c.customUrl || c.name);

                injectIntoNewMenu(containers.newMenuList, collaborator, videoCard, {
                    collaborationWith: otherChannels,
                    collaborationGroupId: groupId,
                    isMultiStep
                }, {
                    disabled: !hasIdentifier(collaborator),
                    displayName: hasIdentifier(collaborator) ? collaborator.name : `${collaborator.name || 'Channel'} (resolving…)`
                });
            }

            const blockAllMenuItem = injectIntoNewMenu(containers.newMenuList, {
                name: collaboratorCount === 2 ? 'Both Channels' : `All ${collaboratorCount} Collaborators`,
                isBlockAllOption: true,
                allCollaborators: collaborators.slice(0, collaboratorCount),
                collaborationGroupId: groupId,
                isMultiStep
            }, videoCard, null, {
                disabled: anyMissingIdentifiers,
                displayName: anyMissingIdentifiers ? 'All Collaborators (resolving…)'
                    : (collaboratorCount === 2 ? 'Both Channels' : `All ${collaboratorCount} Collaborators`)
            });
            setupMultiStepMenu(dropdown, groupId, collaborators.slice(0, collaboratorCount), blockAllMenuItem);
        } else if (containers.oldMenuList) {
            for (let i = 0; i < collaboratorCount; i++) {
                const collaborator = collaborators[i];
                const otherChannels = collaborators
                    .filter((_, idx) => idx !== i)
                    .map(c => c.handle || c.id || c.customUrl || c.name);

                injectIntoOldMenu(containers.oldMenuList, collaborator, videoCard, {
                    collaborationWith: otherChannels,
                    collaborationGroupId: groupId,
                    isMultiStep
                }, {
                    disabled: !hasIdentifier(collaborator),
                    displayName: hasIdentifier(collaborator) ? collaborator.name : `${collaborator.name || 'Channel'} (resolving…)`
                });
            }

            const blockAllMenuItem = injectIntoOldMenu(containers.oldMenuList, {
                name: collaboratorCount === 2 ? 'Both Channels' : `All ${collaboratorCount} Collaborators`,
                isBlockAllOption: true,
                allCollaborators: collaborators.slice(0, collaboratorCount),
                collaborationGroupId: groupId,
                isMultiStep
            }, videoCard, null, {
                disabled: anyMissingIdentifiers,
                displayName: anyMissingIdentifiers ? 'All Collaborators (resolving…)'
                    : (collaboratorCount === 2 ? 'Both Channels' : `All ${collaboratorCount} Collaborators`)
            });
            setupMultiStepMenu(dropdown, groupId, collaborators.slice(0, collaboratorCount), blockAllMenuItem);
        }
        forceDropdownResize(dropdown);
        return;
    }

    const singleChannelInjectionOptions = (() => {
        try {
            const stored = findStoredChannelEntry(channelInfo);
            const storedName = typeof stored?.name === 'string' ? stored.name.trim() : '';
            if (storedName) return { displayName: storedName };
        } catch (e) {
        }
        return {};
    })();

    if (containers.newMenuList) {
        injectIntoNewMenu(containers.newMenuList, channelInfo, videoCard, null, singleChannelInjectionOptions);
    } else if (containers.oldMenuList) {
        injectIntoOldMenu(containers.oldMenuList, channelInfo, videoCard, null, singleChannelInjectionOptions);
    }
    forceDropdownResize(dropdown);
}

function updateInjectedMenuChannelName(dropdown, channelInfo) {
    if (!dropdown || !channelInfo) return;
    const menuItem = dropdown.querySelector('.filtertube-block-channel-item');
    if (!menuItem) return;

    const nameEl = menuItem.querySelector('.filtertube-channel-name');
    if (!nameEl) return;

    const current = (nameEl.textContent || '').trim();
    const next = pickMenuChannelDisplayName(channelInfo, {}) || '';
    if (!next) return;
    if (next === 'Channel') return;

    // Avoid thrashing if already up to date
    if (current === next) return;

    const isHandleLike = (value) => (typeof value === 'string' && value.trim().startsWith('@'));
    const isUcIdLike = (value) => {
        if (!value || typeof value !== 'string') return false;
        return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
    };
    const isProbablyNotChannelName = (value) => {
        if (!value || typeof value !== 'string') return true;
        const trimmed = value.trim();
        if (!trimmed) return true;
        if (trimmed.includes('•')) return true;
        if (/\bviews?\b/i.test(trimmed)) return true;
        if (/\bago\b/i.test(trimmed)) return true;
        if (/\bwatching\b/i.test(trimmed)) return true;
        if (isUcIdLike(trimmed)) return true;
        const lower = trimmed.toLowerCase();
        if (lower === 'channel') return true;
        if (lower.startsWith('mix')) return true;
        if (lower.startsWith('my mix')) return true;
        if (/^my\s*mix/i.test(trimmed)) return true;
        if (/\band more\b/i.test(trimmed) && /mix/i.test(trimmed)) return true;
        if (lower.includes('mix') && trimmed.includes('–')) return true;
        return false;
    };

    const nextIsSafe = next && !isUcIdLike(next) && next.toLowerCase() !== 'channel';
    if (!nextIsSafe) return;

    // Replace placeholder-ish values (handles, UC IDs, mix titles, or metadata strings) once enrichment delivers a real name.
    if (isHandleLike(current) && !isHandleLike(next)) {
        nameEl.textContent = next;
        return;
    }

    if (isUcIdLike(current) || isProbablyNotChannelName(current)) {
        nameEl.textContent = next;
        return;
    }
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

// Statistics tracking
let statsCountToday = 0;
let statsTotalSeconds = 0; // Track total seconds saved instead of using multiplier
let statsLastDate = new Date().toDateString();
let statsInitialized = false;

function getStatsSurfaceKey() {
    try {
        const host = String(location?.hostname || '').toLowerCase();
        if (host.includes('youtubekids.com')) return 'kids';
    } catch (e) {
    }
    return 'main';
}

// ==========================
// PREFETCH / HYDRATION QUEUE
// ==========================
const PREFETCH_MAX_QUEUE = 10;
const PREFETCH_CONCURRENCY = 2;
const PREFETCH_TIMEOUT_MS = 5000;
let prefetchQueue = [];
let prefetchActive = 0;
const prefetchSeen = new Set();
const prefetchSeenAt = new Map();
let prefetchObserver = null;
let prefetchPaused = false;
const observedPrefetchCards = new WeakSet();
let prefetchScanScheduled = false;

function schedulePrefetchScan() {
    if (prefetchScanScheduled) return;
    prefetchScanScheduled = true;
    requestAnimationFrame(() => {
        prefetchScanScheduled = false;
        attachPrefetchObservers();
    });
}

function attachPrefetchObservers() {
    if (!prefetchObserver || typeof document.querySelectorAll !== 'function') return;
    const list = [];

    try {
        const isWatch = (document.location?.pathname || '').startsWith('/watch');
        const params = new URLSearchParams(document.location?.search || '');
        const isPlaylistWatch = params.has('list');
        const playlistPanel = isWatch && isPlaylistWatch ? document.querySelector('ytd-playlist-panel-renderer') : null;
        if (playlistPanel) {
            list.push(...playlistPanel.querySelectorAll('ytd-playlist-panel-video-wrapper-renderer, ytd-playlist-panel-video-renderer'));
        }
    } catch (e) {
        // ignore
    }

    list.push(...document.querySelectorAll(typeof VIDEO_CARD_SELECTORS === 'string' ? VIDEO_CARD_SELECTORS : 'ytd-rich-item-renderer'));

    let attached = 0;
    const maxAttach = 120;
    for (const card of list) {
        if (observedPrefetchCards.has(card)) continue;
        observedPrefetchCards.add(card);
        prefetchObserver.observe(card);
        attached++;
        if (attached >= maxAttach) break;
    }
}

function startCardPrefetchObserver() {
    if (prefetchObserver || typeof IntersectionObserver !== 'function') return;

    prefetchObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            queuePrefetchForCard(entry.target);
        }
    }, {
        root: null,
        rootMargin: '400px 0px 800px 0px',
        threshold: 0
    });

    document.addEventListener('visibilitychange', () => {
        prefetchPaused = document.hidden;
        if (!prefetchPaused) drainPrefetchQueue();
    });

    attachPrefetchObservers();
}

let playlistPanelPrefetchHookInstalled = false;

let rightRailWhitelistObserverInstalled = false;

function installPlaylistPanelPrefetchHook() {
    if (playlistPanelPrefetchHookInstalled) return;
    playlistPanelPrefetchHookInstalled = true;

    const schedule = () => {
        try {
            schedulePrefetchScan();
        } catch (e) {
            // ignore
        }
    };

    document.addEventListener('scroll', (event) => {
        const target = event?.target;
        if (!(target instanceof Element)) return;
        if (target.closest('ytd-playlist-panel-renderer')) {
            schedule();
        }
    }, true);

    const observer = new MutationObserver(() => {
        schedule();
    });

    const attach = () => {
        const panel = document.querySelector('ytd-playlist-panel-renderer');
        if (!panel) return false;
        observer.observe(panel, { childList: true, subtree: true });
        schedule();
        return true;
    };

    if (!attach()) {
        document.addEventListener('yt-navigate-finish', () => {
            try {
                observer.disconnect();
            } catch (e) {
                // ignore
            }
            attach();
        });
    }
}

function installRightRailWhitelistObserver() {
    if (rightRailWhitelistObserverInstalled) return;
    rightRailWhitelistObserverInstalled = true;

    const scheduleWhitelistRefresh = () => {
        try {
            if (currentSettings?.listMode !== 'whitelist') return;
        } catch (e) {
            return;
        }

        if (typeof applyDOMFallback !== 'function') return;
        // Force reprocess so previously-hidden / previously-pending nodes re-evaluate on SPA swaps.
        setTimeout(() => {
            try {
                applyDOMFallback(null, { preserveScroll: true, forceReprocess: true });
            } catch (e) {
                // ignore
            }
        }, 0);
        setTimeout(() => {
            try {
                applyDOMFallback(null, { preserveScroll: true, forceReprocess: true });
            } catch (e) {
                // ignore
            }
        }, 120);
    };

    const observer = new MutationObserver(() => {
        scheduleWhitelistRefresh();
    });

    const attach = () => {
        const rail = document.querySelector(
            '#related, #secondary, ytd-watch-next-secondary-results-renderer, ytd-watch-flexy #secondary'
        );
        if (!rail) return false;
        try {
            observer.observe(rail, { childList: true, subtree: true });
        } catch (e) {
            return false;
        }
        return true;
    };

    if (!attach()) {
        document.addEventListener('yt-navigate-finish', () => {
            try {
                observer.disconnect();
            } catch (e) {
            }
            attach();
            scheduleWhitelistRefresh();
        });
    }

    document.addEventListener('yt-navigate-finish', () => {
        scheduleWhitelistRefresh();
    });
}

function queuePrefetchForCard(card) {
    const priorCachedVideoId = card?.getAttribute?.('data-filtertube-video-id') || '';
    const videoId = extractVideoIdFromCard(card) || '';
    if (!videoId) return;

    resetCardIdentityIfStale(card, videoId);
    // Also clear stale collaborator metadata if this DOM node was recycled
    getValidatedCachedCollaborators(card);

    // If YouTube recycled a DOM node without our video-id attribute, any existing channel
    // attrs on it are untrusted. Clear them to avoid persisting a wrong mapping.
    if (!priorCachedVideoId) {
        try {
            card.removeAttribute('data-filtertube-channel-id');
            card.removeAttribute('data-filtertube-channel-handle');
            card.removeAttribute('data-filtertube-channel-name');
            card.removeAttribute('data-filtertube-channel-custom');
        } catch (e) {
        }
    }

    const existingId = card.getAttribute('data-filtertube-channel-id');
    const existingHandle = card.getAttribute('data-filtertube-channel-handle');

    // If we already have an ID that was associated with this element's cached video id,
    // persist and skip. Otherwise, let the normal resolver path restamp.
    if (existingId && priorCachedVideoId && priorCachedVideoId === videoId) {
        persistVideoChannelMapping(videoId, existingId);
        return;
    }

    // If we only have a handle, try to resolve to UC ID immediately using channelMap
    if (!existingId && existingHandle) {
        const resolvedId = resolveIdFromHandle(existingHandle);
        if (resolvedId) {
            stampChannelIdentity(card, { id: resolvedId, handle: existingHandle });
            persistVideoChannelMapping(videoId, resolvedId);
            return;
        }
    }

    const key = videoId;
    const lastSeen = prefetchSeenAt.get(key) || 0;
    if (prefetchSeen.has(key) && (Date.now() - lastSeen) < 30 * 1000) return;
    prefetchSeen.add(key);
    prefetchSeenAt.set(key, Date.now());

    prefetchQueue.push({ videoId, card });
    if (prefetchQueue.length > PREFETCH_MAX_QUEUE) {
        prefetchQueue.shift();
    }
    drainPrefetchQueue();
}

function drainPrefetchQueue() {
    if (prefetchPaused || document.hidden) return;
    while (prefetchActive < PREFETCH_CONCURRENCY && prefetchQueue.length > 0) {
        const item = prefetchQueue.shift();
        prefetchActive++;
        prefetchIdentityForCard(item).finally(() => {
            prefetchActive--;
            drainPrefetchQueue();
        });
    }
}

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(null), ms))
    ]);
}

async function prefetchIdentityForCard({ videoId, card }) {
    try {
        if (!card || !card.isConnected) return;

        if (typeof location !== 'undefined' && String(location.hostname || '').includes('youtubekids.com')) {
            if (currentSettings?.videoChannelMap && currentSettings.videoChannelMap[videoId]) {
                stampChannelIdentity(card, { id: currentSettings.videoChannelMap[videoId] });
                return;
            }

            // Kids: do NOT prefetch via network. Rely on Network JSON interception (FilterTube_UpdateVideoChannelMap)
            // plus best-effort DOM extraction.
            try {
                const info = extractChannelFromCard(card);
                if (info?.id || info?.handle || info?.customUrl) {
                    stampChannelIdentity(card, info);
                    if (info.id) {
                        persistVideoChannelMapping(videoId, info.id);
                    }
                }
            } catch (e) {
            }

            // Kids: if we still don't have a UC ID mapping, try main-world snapshot search (still zero-network).
            // This is critical for cases where FilterTubeEngine skips harvesting a particular response,
            // or the DOM does not expose channel anchors.
            if (!currentSettings?.videoChannelMap?.[videoId]) {
                try {
                    const ytInfo = await withTimeout(searchYtInitialDataForVideoChannel(videoId, null), PREFETCH_TIMEOUT_MS);
                    if (ytInfo && (ytInfo.id || ytInfo.handle || ytInfo.customUrl)) {
                        if (!ytInfo.id && ytInfo.handle) {
                            const resolvedId = resolveIdFromHandle(ytInfo.handle);
                            if (resolvedId) {
                                ytInfo.id = resolvedId;
                            }
                        }
                        stampChannelIdentity(card, ytInfo);
                        if (ytInfo.id) {
                            persistVideoChannelMapping(videoId, ytInfo.id);
                        }
                    }
                } catch (e) {
                }
            }
            return;
        }

        // If settings already know this mapping, bail early
        if (currentSettings?.videoChannelMap && currentSettings.videoChannelMap[videoId]) {
            stampChannelIdentity(card, { id: currentSettings.videoChannelMap[videoId] });
            return;
        }

        // Light DOM extraction first (no logging on failure)
        try {
            const info = extractChannelFromCard(card);
            if (info?.id || info?.handle || info?.customUrl) {
                stampChannelIdentity(card, info);
                if (info.id) {
                    currentSettings = currentSettings || {};
                    currentSettings.videoChannelMap = currentSettings.videoChannelMap || {};
                    currentSettings.videoChannelMap[videoId] = info.id;
                    browserAPI_BRIDGE.runtime.sendMessage({
                        action: 'updateVideoChannelMap',
                        videoId,
                        channelId: info.id
                    });
                }
                return;
            }
        } catch (e) {
            // swallow; prefetch should stay silent
        }

        // No-network fallback: ask Main World to search ytInitialData for this videoId.
        const ytInfo = await withTimeout(searchYtInitialDataForVideoChannel(videoId, null), PREFETCH_TIMEOUT_MS);
        if (ytInfo && (ytInfo.id || ytInfo.handle || ytInfo.customUrl)) {
            if (!ytInfo.id && ytInfo.handle) {
                const resolvedId = resolveIdFromHandle(ytInfo.handle);
                if (resolvedId) {
                    ytInfo.id = resolvedId;
                }
            }
            stampChannelIdentity(card, ytInfo);
            if (ytInfo.id) {
                persistVideoChannelMapping(videoId, ytInfo.id);
            }
        }
    } catch (e) {
        // keep silent in prefetch
    }
}

function stampChannelIdentity(card, info) {
    if (!card || !info) return;
    if (info.id) card.setAttribute('data-filtertube-channel-id', info.id);
    if (info.handle) card.setAttribute('data-filtertube-channel-handle', info.handle);
    if (info.customUrl) card.setAttribute('data-filtertube-channel-custom', info.customUrl);

    if (info.name) card.setAttribute('data-filtertube-channel-name', info.name);

    // Trigger a light refilter so already-rendered cards hide without waiting for next DOM mutation
    if (typeof applyDOMFallback === 'function') {
        const state = window.__filtertubeStampFallbackState || (window.__filtertubeStampFallbackState = { timer: 0 });
        if (state.timer) return;
        state.timer = setTimeout(() => {
            state.timer = 0;
            try {
                applyDOMFallback(null);
            } catch (e) {
                // ignore
            }
        }, 120);
    }
}

function resetCardIdentityIfStale(card, videoId) {
    if (!card) return;
    const cachedId = card.getAttribute('data-filtertube-video-id');
    if (cachedId && videoId && cachedId !== videoId) {
        clearBlockedElementAttributes(card);
        card.removeAttribute('data-filtertube-video-id');
        try {
            if (typeof clearCachedChannelMetadata === 'function') {
                clearCachedChannelMetadata(card);
            } else {
                card.removeAttribute('data-filtertube-channel-id');
                card.removeAttribute('data-filtertube-channel-handle');
                card.removeAttribute('data-filtertube-channel-name');
                card.removeAttribute('data-filtertube-channel-custom');
            }
        } catch (e) {
            card.removeAttribute('data-filtertube-channel-id');
            card.removeAttribute('data-filtertube-channel-handle');
            card.removeAttribute('data-filtertube-channel-name');
            card.removeAttribute('data-filtertube-channel-custom');
        }

        // Clear collaborator/cache state to prevent recycled nodes from leaking
        // previous-video collaboration identities into next cards.
        card.removeAttribute('data-filtertube-collaborators');
        card.removeAttribute('data-filtertube-collaborators-source');
        card.removeAttribute('data-filtertube-collaborators-ts');
        card.removeAttribute('data-filtertube-expected-collaborators');
        card.removeAttribute('data-filtertube-collab-state');
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-requested');
        card.removeAttribute('data-filtertube-processed');
        card.removeAttribute('data-filtertube-last-processed-id');
        card.removeAttribute('data-filtertube-unique-id');
        card.removeAttribute('data-filtertube-duration');

        // Clear stale visibility flags that can otherwise hide the next recycled row.
        card.classList.remove('filtertube-hidden');
        card.removeAttribute('data-filtertube-hidden');
        card.removeAttribute('data-filtertube-hidden-by-channel');
        card.removeAttribute('data-filtertube-hidden-by-keyword');
        card.removeAttribute('data-filtertube-hidden-by-duration');
        card.removeAttribute('data-filtertube-hidden-by-upload-date');
        card.removeAttribute('data-filtertube-hidden-by-category');
        card.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
        try {
            card.style.removeProperty('display');
        } catch (e) {
        }

        try {
            const wrapper = card.closest('ytd-playlist-panel-video-wrapper-renderer, ytd-rich-item-renderer');
            if (wrapper) {
                clearBlockedElementAttributes(wrapper);
                wrapper.classList.remove('filtertube-hidden');
                wrapper.removeAttribute('data-filtertube-hidden');
                wrapper.removeAttribute('data-filtertube-hidden-by-channel');
                wrapper.removeAttribute('data-filtertube-hidden-by-keyword');
                wrapper.removeAttribute('data-filtertube-hidden-by-duration');
                wrapper.removeAttribute('data-filtertube-hidden-by-upload-date');
                wrapper.removeAttribute('data-filtertube-hidden-by-category');
                wrapper.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
                wrapper.style.removeProperty('display');
            }
        } catch (e) {
        }
    }
    if ((!cachedId || cachedId !== videoId) && videoId) {
        card.setAttribute('data-filtertube-video-id', videoId);
    }
}

function cardContainsVideoIdLink(card, videoId) {
    if (!card || !videoId) return false;
    try {
        const selectors = [
            `a[href*="watch?v=${videoId}"]`,
            `a[href*="/watch?v=${videoId}"]`,
            `a[href*="/shorts/${videoId}"]`,
            `a[href*="/watch/${videoId}"]`
        ];
        return Boolean(card.querySelector(selectors.join(',')));
    } catch (e) {
        return false;
    }
}

function shouldStampCardForVideoId(card, videoId) {
    if (!card || !videoId) return false;

    let liveVideoId = '';
    try {
        liveVideoId = extractVideoIdFromCard(card) || '';
    } catch (e) {
        liveVideoId = '';
    }

    if (liveVideoId) {
        if (liveVideoId !== videoId) {
            resetCardIdentityIfStale(card, liveVideoId);
            return false;
        }
        resetCardIdentityIfStale(card, liveVideoId);
        return true;
    }

    const stampedVideoId = (card.getAttribute?.('data-filtertube-video-id') || '').trim();
    if (stampedVideoId && stampedVideoId !== videoId) {
        resetCardIdentityIfStale(card, stampedVideoId);
        return false;
    }

    if (cardContainsVideoIdLink(card, videoId)) {
        resetCardIdentityIfStale(card, videoId);
        return true;
    }

    // No live/anchor proof this card belongs to `videoId` yet.
    return false;
}

function resolveIdFromHandle(handle) {
    if (!handle) return '';
    const normalized = normalizeHandleValue(handle);
    if (!normalized) return '';
    const map = currentSettings?.channelMap || {};
    const direct = map[normalized] || map[normalized.toLowerCase()];
    if (direct && direct.startsWith('UC')) return direct;
    return '';
}

function persistVideoChannelMapping(videoId, channelId) {
    if (!videoId || !channelId) return;
    currentSettings = currentSettings || {};
    currentSettings.videoChannelMap = currentSettings.videoChannelMap || {};
    currentSettings.videoChannelMap[videoId] = channelId;
    browserAPI_BRIDGE.runtime.sendMessage({
        action: 'updateVideoChannelMap',
        videoId,
        channelId
    });
}

function persistVideoMetaMapping(entries = []) {
    const list = Array.isArray(entries) ? entries : [];
    if (list.length === 0) return;

    currentSettings = currentSettings || {};
    currentSettings.videoMetaMap = (currentSettings.videoMetaMap && typeof currentSettings.videoMetaMap === 'object')
        ? currentSettings.videoMetaMap
        : {};

    const cleaned = [];
    for (const entry of list) {
        const videoId = typeof entry?.videoId === 'string' ? entry.videoId.trim() : '';
        if (!videoId) continue;

        const lengthSecondsRaw = entry?.lengthSeconds;
        const publishDateRaw = entry?.publishDate;
        const uploadDateRaw = entry?.uploadDate;
        const categoryRaw = entry?.category;

        const meta = {
            lengthSeconds: (typeof lengthSecondsRaw === 'number' && Number.isFinite(lengthSecondsRaw))
                ? lengthSecondsRaw
                : (typeof lengthSecondsRaw === 'string' ? lengthSecondsRaw.trim() : null),
            publishDate: (typeof publishDateRaw === 'string' ? publishDateRaw.trim() : ''),
            uploadDate: (typeof uploadDateRaw === 'string' ? uploadDateRaw.trim() : ''),
            category: (typeof categoryRaw === 'string' ? categoryRaw.trim() : '')
        };

        if (!meta.lengthSeconds && !meta.publishDate && !meta.uploadDate && !meta.category) continue;
        try {
            if (Object.prototype.hasOwnProperty.call(currentSettings.videoMetaMap, videoId)) {
                delete currentSettings.videoMetaMap[videoId];
            }
        } catch (e) {
        }
        currentSettings.videoMetaMap[videoId] = meta;
        cleaned.push({ videoId, ...meta });
    }

    try {
        const MAX_VIDEO_META_ENTRIES = 2000;
        const EVICT_COUNT = 500;
        const keys = Object.keys(currentSettings.videoMetaMap || {});
        if (keys.length > MAX_VIDEO_META_ENTRIES) {
            keys.slice(0, EVICT_COUNT).forEach(k => {
                try {
                    delete currentSettings.videoMetaMap[k];
                } catch (e) {
                }
            });
        }
    } catch (e) {
    }

    if (cleaned.length === 0) return;

    browserAPI_BRIDGE.runtime.sendMessage({
        action: 'updateVideoMetaMap',
        entries: cleaned
    });
}

let pendingVideoMetaDomRerunTimer = 0;
const VIDEO_META_DOM_RERUN_DEBOUNCE_MS = 550;
function scheduleVideoMetaDomRerun() {
    if (pendingVideoMetaDomRerunTimer) {
        clearTimeout(pendingVideoMetaDomRerunTimer);
    }
    pendingVideoMetaDomRerunTimer = setTimeout(() => {
        pendingVideoMetaDomRerunTimer = 0;
        try {
            if (typeof applyDOMFallback === 'function') {
                applyDOMFallback(null);
            }
        } catch (e) {
        }
    }, VIDEO_META_DOM_RERUN_DEBOUNCE_MS);
}

function touchDomForVideoMetaUpdate(videoId) {
    const id = typeof videoId === 'string' ? videoId.trim() : '';
    if (!id) return false;

    const touched = new Set();
    const register = (node) => {
        if (!node || !node.getAttribute) return;
        if (touched.has(node)) return;
        touched.add(node);
        try {
            node.removeAttribute('data-filtertube-duration');
            node.removeAttribute('data-filtertube-processed');
            node.removeAttribute('data-filtertube-last-processed-id');
        } catch (e) {
        }
        try {
            if (typeof clearCachedChannelMetadata === 'function') {
                clearCachedChannelMetadata(node);
            }
        } catch (e) {
        }
    };

    try {
        const cards = document.querySelectorAll(`[data-filtertube-video-id="${id}"]`);
        for (const card of cards) {
            register(card);
        }
    } catch (e) {
    }

    try {
        const selectors = [
            `a[href*="watch?v=${id}"]`,
            `a[href*="/watch?v=${id}"]`,
            `a[href*="/shorts/${id}"]`,
            `a[href*="/watch/${id}"]`
        ];
        const anchors = document.querySelectorAll(selectors.join(','));
        anchors.forEach(anchor => {
            try {
                const card = typeof findVideoCardElement === 'function' ? findVideoCardElement(anchor) : null;
                if (card) {
                    try {
                        card.setAttribute('data-filtertube-video-id', id);
                    } catch (e) {
                    }
                    register(card);
                }
            } catch (e) {
            }
        });
    } catch (e) {
    }

    return touched.size > 0;
}

const pendingWatchMetaFetches = new Map();
const queuedWatchMetaFetches = new Set();
const watchMetaFetchQueue = [];
const lastWatchMetaFetchAttempt = new Map();
let activeWatchMetaFetches = 0;
const WATCH_META_FETCH_CONCURRENCY = 3;

function scheduleVideoMetaFetch(videoId, options = null) {
    const v = typeof videoId === 'string' ? videoId.trim() : '';
    if (!v || !/^[a-zA-Z0-9_-]{11}$/.test(v)) return;

    const wants = (() => {
        const needDurationDefault = true;
        const needDatesDefault = false;
        const needCategoryDefault = false;
        if (!options || typeof options !== 'object') {
            return { needDuration: needDurationDefault, needDates: needDatesDefault, needCategory: needCategoryDefault };
        }
        return {
            needDuration: ('needDuration' in options) ? Boolean(options.needDuration) : needDurationDefault,
            needDates: ('needDates' in options) ? Boolean(options.needDates) : needDatesDefault,
            needCategory: ('needCategory' in options) ? Boolean(options.needCategory) : needCategoryDefault
        };
    })();

    try {
        const existing = currentSettings?.videoMetaMap?.[v] || null;

        let hasDuration = false;
        const raw = existing?.lengthSeconds;
        if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
            hasDuration = true;
        } else if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
            const parsed = parseInt(raw.trim(), 10);
            if (Number.isFinite(parsed) && parsed > 0) {
                hasDuration = true;
            }
        }

        let hasDates = false;
        const candidates = [existing?.uploadDate, existing?.publishDate];
        for (const candidate of candidates) {
            if (!candidate || typeof candidate !== 'string') continue;
            const ms = new Date(candidate).getTime();
            if (Number.isFinite(ms)) {
                hasDates = true;
                break;
            }
        }

        let hasCategory = false;
        const categoryRaw = existing?.category;
        if (typeof categoryRaw === 'string' && categoryRaw.trim()) {
            hasCategory = true;
        }

        const satisfiedDuration = wants.needDuration ? hasDuration : true;
        const satisfiedDates = wants.needDates ? hasDates : true;
        const satisfiedCategory = wants.needCategory ? hasCategory : true;
        if (satisfiedDuration && satisfiedDates && satisfiedCategory) return;
    } catch (e) {
    }

    const now = Date.now();
    const last = lastWatchMetaFetchAttempt.get(v) || 0;
    if (now - last < 60 * 1000) return;
    lastWatchMetaFetchAttempt.set(v, now);
    if (lastWatchMetaFetchAttempt.size > 3000) {
        const keysToDelete = Array.from(lastWatchMetaFetchAttempt.keys()).slice(0, 800);
        keysToDelete.forEach(key => {
            try {
                lastWatchMetaFetchAttempt.delete(key);
            } catch (e) {
            }
        });
    }

    if (pendingWatchMetaFetches.has(v)) return;
    if (queuedWatchMetaFetches.has(v)) return;
    queuedWatchMetaFetches.add(v);
    watchMetaFetchQueue.push(v);
    processWatchMetaFetchQueue();
}

function processWatchMetaFetchQueue() {
    while (activeWatchMetaFetches < WATCH_META_FETCH_CONCURRENCY && watchMetaFetchQueue.length > 0) {
        const nextVideoId = watchMetaFetchQueue.shift();
        queuedWatchMetaFetches.delete(nextVideoId);
        if (!nextVideoId) continue;

        activeWatchMetaFetches++;
        const fetchPromise = fetchVideoMetaFromWatchUrl(nextVideoId)
            .catch(() => null)
            .finally(() => {
                pendingWatchMetaFetches.delete(nextVideoId);
                activeWatchMetaFetches = Math.max(0, activeWatchMetaFetches - 1);
                processWatchMetaFetchQueue();
            });
        pendingWatchMetaFetches.set(nextVideoId, fetchPromise);
    }
}

async function fetchVideoMetaFromWatchUrl(videoId) {
    if (!videoId || typeof videoId !== 'string') return null;
    if (typeof location !== 'undefined' && String(location.hostname || '').includes('youtubekids.com')) {
        return null;
    }

    const extractJsonObjectFromHtml = (html, marker) => {
        try {
            if (!html || !marker) return '';
            const start = html.indexOf(marker);
            if (start === -1) return '';
            const braceStart = html.indexOf('{', start + marker.length);
            if (braceStart === -1) return '';

            let depth = 0;
            let inString = false;
            let stringChar = '';
            let escaped = false;
            for (let i = braceStart; i < html.length; i++) {
                const ch = html[i];
                if (inString) {
                    if (escaped) {
                        escaped = false;
                    } else if (ch === '\\') {
                        escaped = true;
                    } else if (ch === stringChar) {
                        inString = false;
                        stringChar = '';
                    }
                    continue;
                }

                if (ch === '"' || ch === '\'') {
                    inString = true;
                    stringChar = ch;
                    continue;
                }

                if (ch === '{') {
                    depth++;
                } else if (ch === '}') {
                    depth--;
                    if (depth === 0) {
                        return html.slice(braceStart, i + 1);
                    }
                }
            }
            return '';
        } catch (e) {
            return '';
        }
    };

    try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            credentials: 'same-origin',
            headers: {
                'Accept': 'text/html'
            }
        });

        if (!response.ok) return null;
        const html = await response.text();

        const rawJson =
            extractJsonObjectFromHtml(html, 'var ytInitialPlayerResponse =') ||
            extractJsonObjectFromHtml(html, 'ytInitialPlayerResponse =') ||
            '';
        if (!rawJson) return null;

        const playerResponse = JSON.parse(rawJson);
        const videoDetails = playerResponse?.videoDetails || null;
        const micro = playerResponse?.microformat?.playerMicroformatRenderer || null;

        const lengthSeconds = (micro && micro.lengthSeconds) || (videoDetails && videoDetails.lengthSeconds) || null;
        const publishDate = (micro && micro.publishDate) ? String(micro.publishDate) : '';
        const uploadDate = (micro && micro.uploadDate) ? String(micro.uploadDate) : '';
        const category = (micro && (micro.category || micro.genre)) ? String(micro.category || micro.genre) : '';

        if (!lengthSeconds && !publishDate && !uploadDate && !category) return null;

        persistVideoMetaMapping([{
            videoId,
            lengthSeconds,
            publishDate,
            uploadDate,
            category
        }]);

        if (touchDomForVideoMetaUpdate(videoId)) {
            scheduleVideoMetaDomRerun();
        }

        return { videoId, lengthSeconds, publishDate, uploadDate, category };
    } catch (e) {
        return null;
    }
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
        if (!this.isActive || !window.__filtertubeDebug) return;
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
        if (!this.isActive || !window.__filtertubeDebug) return;
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

        if (!window.__filtertubeDebug) {
            this.hiddenItems = [];
            this.restoredItems = [];
            return;
        }

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

        this.hiddenItems = [];
        this.restoredItems = [];
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
const COLLAB_MORE_TOKEN_PATTERN = /^\d+\s+more$/i;
const COLLAB_PLACEHOLDER_NAME_PATTERN = /^(?:and\s+|block\s+)?\d+\s+more(?:\s+(?:collaborators?|channels?))?$/i;
if (!window.pendingCollabCards) {
    window.pendingCollabCards = new Map(); // key -> entry
}
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
    const value = channelInfo.id || channelInfo.handle || channelInfo.customUrl || channelInfo.name || '';
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
    if (collaborator.customUrl) return false;
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
            id: typeof collab.id === 'string' ? collab.id.trim() : '',
            customUrl: typeof collab.customUrl === 'string' ? collab.customUrl.trim() : ''
        };

        if (!normalized.name && !normalized.handle && !normalized.id && !normalized.customUrl) return;
        if (isPlaceholderCollaboratorEntry(normalized)) return;

        const key = (normalized.id || normalized.handle || normalized.customUrl || normalized.name.toLowerCase());
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

        let customUrl = '';
        const match = href.match(/\/(c|user)\/([^/?#]+)/);
        if (match && match[1] && match[2]) {
            try {
                customUrl = `${match[1]}/${decodeURIComponent(match[2])}`;
            } catch (_) {
                customUrl = `${match[1]}/${match[2]}`;
            }
        }

        const key = (id || handle || customUrl || altText.toLowerCase());
        if (seen.has(key)) return;
        seen.add(key);

        collaborators.push({
            name: altText,
            handle,
            id,
            customUrl
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
    const cachedVideoId = card.getAttribute('data-filtertube-video-id');
    if (!currentVideoId) {
        // During hydration races, missing live videoId means cached collaborators are unsafe.
        // Never reuse them for menu rendering.
        if (cachedVideoId) {
            card.removeAttribute('data-filtertube-collaborators');
            card.removeAttribute('data-filtertube-collaborators-source');
            card.removeAttribute('data-filtertube-collaborators-ts');
            card.removeAttribute('data-filtertube-expected-collaborators');
            card.removeAttribute('data-filtertube-collab-state');
            card.removeAttribute('data-filtertube-collab-awaiting-dialog');
            card.removeAttribute('data-filtertube-collab-requested');
        }
        return [];
    }

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
        .map(collab => (collab.id || collab.handle || collab.customUrl || collab.name || '').toLowerCase())
        .filter(Boolean)
        .join('|');
}

function hasCompleteCollaboratorRoster(collaborators = [], expectedCount = 0) {
    if (!Array.isArray(collaborators) || collaborators.length === 0) return false;
    const identifiersReady = collaborators.every(collab => Boolean(collab?.id || collab?.handle || collab?.customUrl));
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
            if (lower === 'more' || COLLAB_MORE_TOKEN_PATTERN.test(lower) || lower.endsWith(' more') || lower.startsWith('more ')) {
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

function countDistinctChannelLinks(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return 0;
    const linkSelectors = 'a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), a[href*="/channel/UC"], a[href*="/c/"], a[href*="/user/"]';
    const links = root.querySelectorAll(linkSelectors);
    const seen = new Set();
    for (const link of links) {
        const href = link?.getAttribute?.('href') || '';
        if (!href) continue;
        const handle = normalizeHandleValue(extractHandleFromString(href));
        const id = extractChannelIdFromString(href);
        let customUrl = '';
        const match = href.match(/\/(c|user)\/([^/?#]+)/);
        if (match && match[1] && match[2]) {
            try {
                customUrl = `${match[1]}/${decodeURIComponent(match[2])}`;
            } catch (_) {
                customUrl = `${match[1]}/${match[2]}`;
            }
        }
        const key = (id || handle || customUrl || href).toLowerCase();
        if (!key) continue;
        seen.add(key);
    }
    return seen.size;
}

function isMixCardElement(element) {
    if (!element || typeof element.querySelector !== 'function') return false;
    const root = findVideoCardElement(element) || element;
    const href = root.querySelector('a[href*="list=RDMM"], a[href*="start_radio=1"]')?.getAttribute('href') || '';
    if (href && (href.includes('list=RDMM') || href.includes('start_radio=1'))) {
        return true;
    }
    const badgeText = root.querySelector('yt-thumbnail-overlay-badge-view-model badge-shape .yt-badge-shape__text')?.textContent?.trim() || '';
    if (badgeText.toLowerCase() === 'mix') {
        return true;
    }
    return false;
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
    if (window.pendingCollabCards.has(key)) {
        const existing = window.pendingCollabCards.get(key);
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
        if (!window.pendingCollabCards.has(key)) return;
        const tracked = window.pendingCollabCards.get(key);
        if (tracked !== entry) return;
        window.pendingCollabCards.delete(key);
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-state');
    }, 20000);

    window.pendingCollabCards.set(key, entry);
}

function scheduleCollaboratorRetry(element, videoId, options = {}) {
    if (!element || !videoId) return;
    const maxRetries = 3;
    const currentRetries = parseInt(element.getAttribute('data-filtertube-collab-retries') || '0', 10) || 0;
    if (currentRetries >= maxRetries) {
        console.warn('FilterTube: Collaborator enrichment retries exhausted for video:', videoId);
        return;
    }
    element.setAttribute('data-filtertube-collab-retries', String(currentRetries + 1));
    element.removeAttribute('data-filtertube-collab-requested');
    const delayMs = options.delayMs || 700;
    setTimeout(() => {
        if (!element.isConnected) return;
        requestCollaboratorEnrichment(element, videoId, options.partialCollaborators || []);
    }, delayMs);
}

function requestCollaboratorEnrichment(element, videoId, partialCollaborators = []) {
    if (!element) return;
    const card = findVideoCardElement(element);
    const cachedCollabs = getCachedCollaboratorsFromCard(card);
    const enrichmentSeed = (partialCollaborators && partialCollaborators.length > 0)
        ? partialCollaborators
        : (cachedCollabs && cachedCollabs.length > 0
            ? cachedCollabs.slice(0, Math.min(cachedCollabs.length, 2))
            : []);
    markCardForDialogEnrichment(element, videoId, enrichmentSeed);

    if (!videoId) return;
    const existingState = element.getAttribute('data-filtertube-collab-requested');
    if (existingState && existingState.includes('mainworld')) return;

    element.setAttribute('data-filtertube-collab-requested', 'mainworld');
    if (!element.hasAttribute('data-filtertube-collab-retries')) {
        element.setAttribute('data-filtertube-collab-retries', '0');
    }

    const expectedNames = [];
    const expectedHandles = [];
    (enrichmentSeed || []).forEach(collab => {
        if (collab?.name) expectedNames.push(collab.name);
        if (collab?.handle) expectedHandles.push(collab.handle);
    });

    (cachedCollabs || []).forEach(collab => {
        if (collab?.name) expectedNames.push(collab.name);
        if (collab?.handle) expectedHandles.push(collab.handle);
    });

    requestCollaboratorInfoFromMainWorld(videoId, {
        expectedNames,
        expectedHandles
    })
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
            } else {
                console.log('FilterTube: Main-world collaborator lookup returned empty; scheduling retry for video:', videoId);
                scheduleCollaboratorRetry(element, videoId, {
                    partialCollaborators: enrichmentSeed
                });
            }
        })
        .catch(error => {
            console.warn('FilterTube: Collaborator enrichment request failed:', error);
            scheduleCollaboratorRetry(element, videoId, {
                partialCollaborators: enrichmentSeed,
                delayMs: 1000
            });
        });
}
function applyResolvedCollaborators(videoId, collaborators, options = {}) {
    if (!videoId || !Array.isArray(collaborators) || collaborators.length === 0) return false;
    const sanitized = sanitizeCollaboratorList(collaborators);
    if (sanitized.length === 0) return false;

    const incomingScore = getCollaboratorListQuality(sanitized);
    const cachedScore = getCollaboratorListQuality(resolvedCollaboratorsByVideoId.get(videoId));
    const expectedCountHint = options.expectedCount || 0;
    const forceUpdate = Boolean(options.force);
    const sourceCard = options.sourceCard || null;
    const sourceLabel = options.sourceLabel || '';
    const timestamp = Date.now();
    if (cachedScore > incomingScore && !forceUpdate) {
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
        if (!shouldStampCardForVideoId(card, videoId)) return;
        const currentScore = getCollaboratorListQuality(getCachedCollaboratorsFromCard(card));
        if (currentScore > incomingScore) return;
        card.setAttribute('data-filtertube-collaborators', serialized);
        if (sourceLabel) {
            card.setAttribute('data-filtertube-collaborators-source', sourceLabel);
        }
        card.setAttribute('data-filtertube-collaborators-ts', String(timestamp));
        card.setAttribute('data-filtertube-collab-state', 'resolved');
        card.removeAttribute('data-filtertube-collab-awaiting-dialog');
        card.removeAttribute('data-filtertube-collab-requested');
        if (expectedCountHint || sanitized.length) {
            const expected = Math.max(
                expectedCountHint,
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
    } else if (sourceCard) {
        applyToCard(sourceCard);
        updated = true;
    }

    resolvedCollaboratorsByVideoId.set(videoId, sanitized);

    const expectedAttr = cards[0]?.getAttribute('data-filtertube-expected-collaborators') ||
        sourceCard?.getAttribute?.('data-filtertube-expected-collaborators') ||
        '';
    const expectedCount = Math.max(
        expectedCountHint,
        parseInt(expectedAttr || '0', 10) || 0,
        sanitized.length
    );

    refreshActiveCollaborationMenu(videoId, sanitized, {
        expectedCount
    });

    if (typeof applyDOMFallback === 'function') {
        setTimeout(() => {
            try {
                applyDOMFallback(null, { preserveScroll: true, forceReprocess: true });
            } catch (e) {
                // ignore
            }
        }, 0);
    }

    return updated;
}

function applyCollaboratorsByVideoId(videoId, collaborators, options = {}) {
    if (!videoId || !Array.isArray(collaborators) || collaborators.length === 0) return false;
    const sanitized = sanitizeCollaboratorList(collaborators);
    if (sanitized.length === 0) return false;
    const incomingScore = getCollaboratorListQuality(sanitized);

    const key = `vid:${videoId}`;
    let entry = window.pendingCollabCards.get(key);
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
            window.pendingCollabCards.set(key, entry);
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
        if (!shouldStampCardForVideoId(card, videoId)) return;
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
        window.collabDialogModule?.applyCollaboratorsToCard?.(entry, sanitized);
    }

    refreshActiveCollaborationMenu(videoId, sanitized, {
        expectedCount: options.expectedCount || sanitized.length,
        force: options.force
    });

    if (typeof applyDOMFallback === 'function') {
        setTimeout(() => {
            try {
                applyDOMFallback(null, { preserveScroll: true, forceReprocess: true });
            } catch (e) {
                // ignore
            }
        }, 0);
    }

    return updatedAnyCard;
}

// Initialize stats from storage
function initializeStats() {
    if (statsInitialized || !chrome || !chrome.storage) return;
    statsInitialized = true;

    chrome.storage.local.get(['stats', 'statsBySurface'], (result) => {
        const today = new Date().toDateString();

        const surface = getStatsSurfaceKey();
        const bySurface = (result.statsBySurface && typeof result.statsBySurface === 'object' && !Array.isArray(result.statsBySurface))
            ? result.statsBySurface
            : {};

        const legacy = (result.stats && typeof result.stats === 'object') ? result.stats : {};
        const picked = (bySurface[surface] && typeof bySurface[surface] === 'object') ? bySurface[surface] : null;
        const effective = picked || (surface === 'main' ? legacy : {});

        if (effective && effective.lastDate === today) {
            // Same day, restore count and seconds
            statsCountToday = effective.hiddenCount || 0;
            statsTotalSeconds = effective.savedSeconds || 0;
            statsLastDate = effective.lastDate;
        } else {
            // New day or no stats, reset
            statsCountToday = 0;
            statsTotalSeconds = 0;
            statsLastDate = today;
        }
    });
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
        const surface = getStatsSurfaceKey();
        chrome.storage.local.get(['stats', 'statsBySurface'], (result) => {
            const nextStats = {
                hiddenCount: statsCountToday,
                savedMinutes: minutesSaved,
                savedSeconds: statsTotalSeconds,
                lastDate: statsLastDate
            };

            const existingBySurface = (result.statsBySurface && typeof result.statsBySurface === 'object' && !Array.isArray(result.statsBySurface))
                ? result.statsBySurface
                : {};

            const statsBySurface = {
                ...existingBySurface,
                [surface]: nextStats
            };

            const payload = {
                statsBySurface
            };

            // Back-compat: keep `stats` in sync for main.
            if (surface === 'main') {
                payload.stats = nextStats;
            }

            chrome.storage.local.set(payload);
        });
    }
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

function extractCollaboratorMetadataFromRenderer(rendererCandidate) {
    if (!rendererCandidate || typeof rendererCandidate !== 'object') return [];

    const extractFromShowDialogCommand = (showDialogCommand) => {
        const listItems = showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems;
        if (!Array.isArray(listItems) || listItems.length === 0) return [];

        const collaborators = [];
        for (const item of listItems) {
            const viewModel = item?.listItemViewModel;
            if (!viewModel) continue;

            const browseEndpoint = viewModel.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint;
            const collab = {
                name: viewModel.title?.content || '',
                handle: '',
                id: '',
                customUrl: ''
            };

            if (browseEndpoint?.canonicalBaseUrl) {
                const baseUrl = browseEndpoint.canonicalBaseUrl;
                if (typeof baseUrl === 'string') {
                    if (baseUrl.startsWith('/@')) {
                        const extracted = extractRawHandle(baseUrl);
                        if (extracted) {
                            collab.handle = normalizeHandleValue(extracted);
                        }
                    } else if (baseUrl.startsWith('/c/')) {
                        const slug = baseUrl.split('/')[2];
                        if (slug) collab.customUrl = `c/${slug}`;
                    } else if (baseUrl.startsWith('/user/')) {
                        const slug = baseUrl.split('/')[2];
                        if (slug) collab.customUrl = `user/${slug}`;
                    }
                }
            }

            if (!collab.handle && viewModel.subtitle?.content) {
                const extracted = extractRawHandle(viewModel.subtitle.content);
                if (extracted) {
                    collab.handle = normalizeHandleValue(extracted);
                }
            }

            if (browseEndpoint?.browseId?.startsWith?.('UC')) {
                collab.id = browseEndpoint.browseId;
            }

            if (collab.name || collab.handle || collab.id) {
                collaborators.push(collab);
            }
        }

        return collaborators;
    };

    let renderer = rendererCandidate;
    if (renderer.content?.videoRenderer) {
        renderer = renderer.content.videoRenderer;
    } else if (renderer.content?.lockupViewModel) {
        renderer = renderer.content.lockupViewModel;
    } else if (renderer.richItemRenderer?.content?.videoRenderer) {
        renderer = renderer.richItemRenderer.content.videoRenderer;
    } else if (renderer.richItemRenderer?.content?.lockupViewModel) {
        renderer = renderer.richItemRenderer.content.lockupViewModel;
    } else if (renderer.videoRenderer) {
        renderer = renderer.videoRenderer;
    } else if (renderer.lockupViewModel) {
        renderer = renderer.lockupViewModel;
    } else if (renderer.data?.content) {
        renderer = renderer.data.content.videoRenderer || renderer.data.content.lockupViewModel || renderer;
    }

    if (!renderer || typeof renderer !== 'object') return [];

    const collaborators = [];
    const byline = renderer.shortBylineText || renderer.longBylineText;
    const runs = Array.isArray(byline?.runs) ? byline.runs : [];

    for (const run of runs) {
        const showDialogCommand = run.navigationEndpoint?.showDialogCommand;
        if (!showDialogCommand) continue;

        const listItems = showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems;
        if (!Array.isArray(listItems) || listItems.length === 0) continue;

        const extracted = extractFromShowDialogCommand(showDialogCommand);
        if (extracted.length > 0) {
            Array.prototype.push.apply(collaborators, extracted);
        }

        if (collaborators.length > 0) {
            break;
        }
    }

    if (collaborators.length === 0) {
        // Home lockupViewModel often omits byline.runs; attempt bounded deep scan for showDialogCommand.
        const visited = new WeakSet();
        const scan = (node, depth = 0) => {
            if (!node || typeof node !== 'object' || visited.has(node) || depth > 10) return [];
            visited.add(node);

            if (node.showDialogCommand) {
                const extracted = extractFromShowDialogCommand(node.showDialogCommand);
                if (extracted.length > 0) return extracted;
            }

            if (Array.isArray(node)) {
                for (const child of node.slice(0, 25)) {
                    const found = scan(child, depth + 1);
                    if (found.length > 0) return found;
                }
                return [];
            }

            for (const key in node) {
                if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                const value = node[key];
                if (!value || typeof value !== 'object') continue;
                const found = scan(value, depth + 1);
                if (found.length > 0) return found;
            }
            return [];
        };

        const deepExtracted = scan(renderer);
        if (deepExtracted.length > 0) {
            Array.prototype.push.apply(collaborators, deepExtracted);
        }
    }

    return collaborators;
}

function hydrateCollaboratorsFromRendererData(card) {
    if (!card) return [];
    const candidates = [
        card.data,
        card.data?.content,
        card.data?.content?.videoRenderer,
        card.data?.content?.lockupViewModel,
        card.__data,
        card.__data?.data,
        card.__data?.item,
        card.__data?.data?.content,
        card.__data?.data?.content?.videoRenderer,
        card.__data?.data?.content?.lockupViewModel
    ];

    for (const candidate of candidates) {
        const extracted = extractCollaboratorMetadataFromRenderer(candidate);
        if (Array.isArray(extracted) && extracted.length > 0) {
            return extracted;
        }
    }

    return [];
}

function extractCollaboratorMetadataFromElement(element) {
    if (!element || typeof element.getAttribute !== 'function') return [];

    // Mix cards (collection stacks / "My Mix") are not true collaborations.
    // They list seed artists like "Nine Inch Nails and more", which must NOT be treated as channels.
    if (isMixCardElement(element)) {
        return [];
    }

    const card = findVideoCardElement(element);
    if (card) {
        const ensuredVideoId = ensureVideoIdForCard(card);
        if (ensuredVideoId && !card.getAttribute('data-filtertube-video-id')) {
            card.setAttribute('data-filtertube-video-id', ensuredVideoId);
        }

        const wrapper = card.closest?.('ytd-rich-item-renderer');
        if (ensuredVideoId && wrapper && !wrapper.getAttribute('data-filtertube-video-id')) {
            wrapper.setAttribute('data-filtertube-video-id', ensuredVideoId);
        }
    }
    const rendererCollaborators = card ? hydrateCollaboratorsFromRendererData(card) : [];
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
    const avatarStackSignal = Boolean(card?.querySelector?.('yt-avatar-stack-view-model'));
    let expectedCollaboratorCount = 0;
    if (card?.getAttribute) {
        expectedCollaboratorCount = parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0;
    }

    if (rendererCollaborators.length > 0) {
        const sanitizedRenderer = sanitizeCollaboratorList(rendererCollaborators);
        if (sanitizedRenderer.length > 0) {
            Array.prototype.push.apply(collaborators, sanitizedRenderer);
            partialCollaboratorsForEnrichment = sanitizedRenderer.slice(0, Math.min(sanitizedRenderer.length, 2));
            expectedCollaboratorCount = Math.max(expectedCollaboratorCount, sanitizedRenderer.length);
            if (card) {
                const timestamp = Date.now();
                try {
                    card.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitizedRenderer));
                } catch (err) {
                    console.warn('FilterTube: Failed to cache renderer collaborators:', err);
                }
                card.setAttribute('data-filtertube-collaborators-source', 'lockup');
                card.setAttribute('data-filtertube-collaborators-ts', String(timestamp));
                const existingExpected = parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0;
                if (existingExpected < sanitizedRenderer.length) {
                    card.setAttribute('data-filtertube-expected-collaborators', String(sanitizedRenderer.length));
                }
                const resolvedVideoId = ensureVideoIdForCard(card);
                if (resolvedVideoId) {
                    applyResolvedCollaborators(resolvedVideoId, sanitizedRenderer, {
                        expectedCount: Math.max(existingExpected, sanitizedRenderer.length),
                        sourceCard: card,
                        sourceLabel: 'lockup'
                    });
                }
            }
            if (sanitizedRenderer.some(c => !c.handle && !c.id)) {
                requiresDialogExtraction = true;
            }
        }
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

                if (!collaborator.customUrl) {
                    const match = href.match(/\/(c|user)\/([^/?#]+)/);
                    if (match && match[1] && match[2]) {
                        try {
                            collaborator.customUrl = `${match[1]}/${decodeURIComponent(match[2])}`;
                        } catch (_) {
                            collaborator.customUrl = `${match[1]}/${match[2]}`;
                        }
                    }
                }

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
        // First try to extract from the attributed string (contains multiple channels)
        const ytTextViewModel = attributedContainer.querySelector('yt-text-view-model');
        const attributedString = ytTextViewModel?.querySelector('.yt-core-attributed-string');
        const rawText = attributedString ? (attributedString.textContent || '') : (attributedContainer.textContent || '');

        if (rawText) {
            const parsed = parseCollaboratorNames(rawText);
            if (parsed.names.length > 0) {
                parsed.names.forEach(name => collaborators.push({ name, handle: '', id: '' }));
                hydrateCollaboratorsFromLinks(collaborators);
                requiresDialogExtraction = requiresDialogExtraction || parsed.hasHiddenCollaborators;
                expectedCollaboratorCount = Math.max(expectedCollaboratorCount, parsed.names.length + parsed.hiddenCount);
            }
        }

        // Fallback for attributed container: directly extract from links if names not found or incomplete
        if (collaborators.length === 0) {
            const linkSelectors = 'a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), a[href*="/channel/UC"], a[href*="/c/"], a[href*="/user/"]';
            const links = attributedContainer.querySelectorAll(linkSelectors);
            const seenKeys = new Set();

            links.forEach(link => {
                const href = link.getAttribute('href') || link.href || '';
                const name = link.textContent?.trim() || '';
                const handleValue = normalizeHandleValue(extractHandleFromString(href) || extractHandleFromString(name));
                const id = extractChannelIdFromString(href) || '';
                let customUrl = '';
                const match = href.match(/\/(c|user)\/([^/?#]+)/);
                if (match && match[1] && match[2]) {
                    try {
                        customUrl = `${match[1]}/${decodeURIComponent(match[2])}`;
                    } catch (_) {
                        customUrl = `${match[1]}/${match[2]}`;
                    }
                }
                const key = (handleValue || '').toLowerCase() || id || name.toLowerCase();
                if (!key || seenKeys.has(key)) return;

                collaborators.push({ name, handle: handleValue || '', id, customUrl });
                seenKeys.add(key);
            });
            if (collaborators.length > 0) {
                expectedCollaboratorCount = Math.max(expectedCollaboratorCount, collaborators.length);
            }
        }
    }

    // Method 2: Home lockup metadata rows (yt-lockup-metadata-view-model)
    if (collaborators.length === 0) {
        const lockupMetadataRows = (card || element).querySelectorAll(
            '.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row, ' +
            'yt-lockup-metadata-view-model .yt-content-metadata-view-model__metadata-row'
        );
        let channelRowText = '';
        for (const row of lockupMetadataRows) {
            const text = row.textContent?.trim();
            if (!text) continue;
            const normalized = text.toLowerCase();
            // Skip view-count/age rows
            if (normalized.includes('view') || normalized.includes('watching') || normalized.includes('ago')) {
                continue;
            }
            // Check if it contains collaboration keywords
            if (normalized.includes(' and ') || normalized.includes(' & ') || /\d+\s+more/i.test(normalized)) {
                // Golden rule: only treat "and" as collaborator separator if YouTube is rendering the avatar stack.
                // Otherwise a single channel like "The Institute of Art and Ideas" would be misdetected.
                if (!avatarStackSignal && !/\d+\s+more/i.test(normalized)) {
                    continue;
                }
                // If avatar stack is present, trust collaboration text even if links are missing (watch/home lockups).
                // Otherwise, require 2+ distinct channel identities linked to avoid false positives.
                if (!avatarStackSignal) {
                    const distinctLinks = countDistinctChannelLinks(row);
                    if (distinctLinks < 2 && !/\d+\s+more/i.test(normalized)) {
                        continue;
                    }
                }
                channelRowText = text.replace(/\s+/g, ' ').trim();
                break;
            }
        }

        if (channelRowText) {
            const parsed = parseCollaboratorNames(channelRowText);
            if (parsed.names.length > 1 || parsed.hasHiddenCollaborators) {
                parsed.names.forEach(name => collaborators.push({ name, handle: '', id: '' }));
                hydrateCollaboratorsFromLinks(collaborators);
                requiresDialogExtraction = true;
                expectedCollaboratorCount = Math.max(expectedCollaboratorCount, parsed.names.length + parsed.hiddenCount);
            }
        }
    }

    // Method 3: Fallback via generic channel name elements (e.g., search results legacy)
    if (collaborators.length === 0) {
        const channelNameEl = (card || element).querySelector('#channel-name, ytd-channel-name, .ytd-channel-name');
        if (channelNameEl) {
            const rawText = channelNameEl.textContent?.trim() || '';
            if (!avatarStackSignal && !/\d+\s+more/i.test(rawText)) {
                // Without avatar stack, do not split on "and" to avoid breaking channels that contain it.
                // Collab videos will have avatar stack and will pass this gate.
                return collaborators;
            }
            // If avatar stack is present, trust the text even if links are missing.
            const distinctLinks = avatarStackSignal ? 2 : countDistinctChannelLinks(channelNameEl);
            if (distinctLinks >= 2 || /\d+\s+more/i.test(rawText)) {
                const parsed = parseCollaboratorNames(rawText);
                if (parsed.names.length > 1 || parsed.hasHiddenCollaborators) {
                    parsed.names.forEach(name => collaborators.push({ name, handle: '', id: '' }));
                    hydrateCollaboratorsFromLinks(collaborators);
                    requiresDialogExtraction = true;
                    expectedCollaboratorCount = Math.max(expectedCollaboratorCount, parsed.names.length + parsed.hiddenCount);
                }
            }
        }
    }

    // Method 4: Avatar stack detection / enrichment
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
        const missingIdentifiers = collaborators.some(c => !c.handle && !c.id && !c.customUrl);
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
    const sharedChannelMatchesFilter = window.FilterTubeIdentity?.channelMatchesFilter;
    if (typeof sharedChannelMatchesFilter === 'function') {
        return sharedChannelMatchesFilter(meta, filterChannel, channelMap);
    }
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

// DOM manipulation helpers (soft hide) are defined in `js/content/dom_helpers.js`
// (loaded before this file via manifest ordering).

// ============================================================================
// FALLBACK FILTERING LOGIC
// ============================================================================

// Moved to `js/content/dom_fallback.js` (loaded before this file via manifest ordering).

// ==========================================================================
// COMMUNICATION & INIT
// ==========================================================================

// Pending collaborator info requests (for async message-based lookup)
if (!(window.pendingCollaboratorRequests instanceof Map)) {
    window.pendingCollaboratorRequests = new Map();
}
if (typeof window.collaboratorRequestId !== 'number' || !isFinite(window.collaboratorRequestId)) {
    window.collaboratorRequestId = 0;
}

// Pending single-channel info requests (for ytInitialData lookup in MAIN world)
if (!(window.pendingChannelInfoRequests instanceof Map)) {
    window.pendingChannelInfoRequests = new Map();
}
if (typeof window.channelInfoRequestId !== 'number' || !isFinite(window.channelInfoRequestId)) {
    window.channelInfoRequestId = 0;
}

/**
 * Request collaborator info from Main World (injector.js) via message passing
 * This is needed because content_bridge.js runs in Isolated World and cannot access window.ytInitialData
 * @param {string} videoId - The YouTube video ID to look up
 * @returns {Promise<Array|null>} - Array of collaborator objects or null
 */
function requestCollaboratorInfoFromMainWorld(videoId, options = {}) {
    return new Promise((resolve) => {
        const expectedNames = Array.isArray(options.expectedNames) ? options.expectedNames : [];
        const expectedHandles = Array.isArray(options.expectedHandles) ? options.expectedHandles : [];
        const requestId = ++window.collaboratorRequestId;
        const timeoutMs = 2000; // 2 second timeout

        // Set up timeout
        const timeoutId = setTimeout(() => {
            if (window.pendingCollaboratorRequests.has(requestId)) {
                window.pendingCollaboratorRequests.delete(requestId);
                console.log('FilterTube: Collaborator info request timed out for video:', videoId);
                resolve(null);
            }
        }, timeoutMs);

        // Store the pending request
        window.pendingCollaboratorRequests.set(requestId, { resolve, timeoutId, videoId });

        const sendRequest = () => {
            window.postMessage({
                type: 'FilterTube_RequestCollaboratorInfo',
                payload: {
                    videoId,
                    requestId,
                    expectedNames,
                    expectedHandles
                },
                source: 'content_bridge'
            }, '*');
        };

        sendRequest();
        setTimeout(() => {
            if (window.pendingCollaboratorRequests.has(requestId)) {
                sendRequest();
            }
        }, 250);
        setTimeout(() => {
            if (window.pendingCollaboratorRequests.has(requestId)) {
                sendRequest();
            }
        }, 1000);

        console.log('FilterTube: Sent collaborator info request to Main World for video:', videoId);
    });
}

function requestChannelInfoFromMainWorld(videoId, options = {}) {
    return new Promise((resolve) => {
        const requestId = ++window.channelInfoRequestId;
        const timeoutMs = 2000; // 2 second timeout

        const timeoutId = setTimeout(() => {
            const pending = window.pendingChannelInfoRequests.get(requestId);
            if (pending) {
                window.pendingChannelInfoRequests.delete(requestId);
                console.log('FilterTube: Channel info request timed out for video:', videoId);
                resolve(null);
            }
        }, timeoutMs);

        window.pendingChannelInfoRequests.set(requestId, { resolve, timeoutId, videoId });

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
            if (window.pendingChannelInfoRequests.has(requestId)) {
                sendRequest();
            }
        }, 250);
        setTimeout(() => {
            if (window.pendingChannelInfoRequests.has(requestId)) {
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
    } else if (type === 'FilterTube_UpdateVideoChannelMap') {
        // Persist learned videoId → channelId mappings (Kids browse/search + player payloads)
        const updates = Array.isArray(payload) ? payload : (payload ? [payload] : []);
        let didPersist = false;
        for (const entry of updates) {
            const videoId = entry?.videoId;
            const channelId = entry?.channelId;
            if (!videoId || !channelId) continue;
            persistVideoChannelMapping(videoId, channelId);

            try {
                const cards = document.querySelectorAll(`[data-filtertube-video-id="${videoId}"]`);
                if (cards && cards.length > 0) {
                    for (const card of cards) {
                        if (!shouldStampCardForVideoId(card, videoId)) continue;
                        stampChannelIdentity(card, { id: channelId });
                    }
                } else {
                    // If we haven't stamped `data-filtertube-video-id` yet (common on Kids due to DOM timing),
                    // best-effort find matching anchors and stamp the surrounding card.
                    const selectors = [
                        `a[href*="watch?v=${videoId}"]`,
                        `a[href*="/watch?v=${videoId}"]`,
                        `a[href*="/shorts/${videoId}"]`,
                        `a[href*="/watch/${videoId}"]`
                    ];
                    const anchors = document.querySelectorAll(selectors.join(','));
                    anchors.forEach(anchor => {
                        const card = findVideoCardElement(anchor);
                        if (!card || !card.getAttribute) return;
                        if (!shouldStampCardForVideoId(card, videoId)) return;
                        stampChannelIdentity(card, { id: channelId });
                    });
                }
            } catch (e) {
                // ignore
            }
            didPersist = true;
        }

        if (didPersist && typeof applyDOMFallback === 'function') {
            requestAnimationFrame(() => {
                try {
                    applyDOMFallback(null);
                } catch (e) {
                    // ignore
                }
            });
        }
    } else if (type === 'FilterTube_UpdateVideoMetaMap') {
        const updates = Array.isArray(payload) ? payload : (payload ? [payload] : []);
        if (updates.length === 0) return;

        persistVideoMetaMapping(updates);

        // Targeted refresh: clear cached duration + processed flags so duration filters can re-evaluate.
        let didTouchDom = false;
        for (const entry of updates) {
            const videoId = typeof entry?.videoId === 'string' ? entry.videoId.trim() : '';
            if (!videoId) continue;

            try {
                if (typeof touchDomForVideoMetaUpdate === 'function') {
                    didTouchDom = touchDomForVideoMetaUpdate(videoId) || didTouchDom;
                }
            } catch (e) {
            }
        }

        if (didTouchDom) {
            try {
                scheduleVideoMetaDomRerun();
            } catch (e) {
            }
        }
    } else if (type === 'FilterTube_UpdateCustomUrlMap') {
        // Forward learned customUrl → UC ID mappings to background for persistence
        if (payload && payload.customUrl && payload.id) {
            browserAPI_BRIDGE.storage.local.get(['channelMap'], (result) => {
                const channelMap = result.channelMap || {};
                if (!channelMap[payload.customUrl] || channelMap[payload.customUrl] !== payload.id) {
                    channelMap[payload.customUrl] = payload.id;
                    browserAPI_BRIDGE.storage.local.set({ channelMap }, () => {
                        console.log('FilterTube: Persisted customUrl mapping:', payload.customUrl, '->', payload.id);
                    });
                }
            });
        }
    } else if (type === 'FilterTube_CollaboratorInfoResponse') {
        // Handle response from Main World with collaborator info
        const { requestId, collaborators, videoId } = payload;
        const pending = window.pendingCollaboratorRequests.get(requestId);

        if (pending) {
            clearTimeout(pending.timeoutId);
            window.pendingCollaboratorRequests.delete(requestId);
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
    } else if (type === 'FilterTube_CacheCollaboratorInfo') {
        const videoId = payload?.videoId;
        const collaborators = payload?.collaborators;
        if (!videoId || !Array.isArray(collaborators) || collaborators.length === 0) return;

        // Ensure matching cards are stamped with data-filtertube-video-id so applyResolvedCollaborators
        // can locate/refresh their menus.
        const foundCards = new Set();
        try {
            const selectors = [
                `a[href*="watch?v=${videoId}"]`,
                `a[href*="/watch?v=${videoId}"]`,
                `a[href*="/shorts/${videoId}"]`,
                `a[href*="/watch/${videoId}"]`
            ];
            const anchors = document.querySelectorAll(selectors.join(','));
            anchors.forEach(anchor => {
                const card = findVideoCardElement(anchor);
                if (!card || !card.getAttribute) return;
                if (!card.getAttribute('data-filtertube-video-id')) {
                    card.setAttribute('data-filtertube-video-id', videoId);
                }
                foundCards.add(card);
            });
        } catch (e) {
        }

        const expectedFromCard = Array.from(foundCards)[0]?.getAttribute?.('data-filtertube-expected-collaborators') || '';
        const expectedCount = Math.max(
            parseInt(expectedFromCard || '0', 10) || 0,
            collaborators.length
        );

        applyResolvedCollaborators(videoId, collaborators, {
            expectedCount,
            force: true,
            sourceLabel: 'xhr',
            sourceCard: Array.from(foundCards)[0] || null
        });
    } else if (type === 'FilterTube_ChannelInfoResponse') {
        // Handle response from Main World with single-channel info
        const { requestId, channel, videoId } = payload || {};
        const pending = window.pendingChannelInfoRequests.get(requestId);

        if (pending) {
            clearTimeout(pending.timeoutId);
            window.pendingChannelInfoRequests.delete(requestId);
            console.log('FilterTube: Received channel info response for video:', videoId, 'channel:', channel);
            pending.resolve(channel || null);
        }
    } else if (type === 'FilterTube_CollabDialogData') {
        const { videoId, collabKey, collaborators, expectedCount } = payload || {};
        if (!Array.isArray(collaborators) || collaborators.length === 0) {
            return;
        }

        const sanitized = sanitizeCollaboratorList(collaborators);
        if (sanitized.length === 0) return;

        if (collabKey && window.pendingCollabCards.has(collabKey)) {
            const entry = window.pendingCollabCards.get(collabKey);
            if (entry) {
                entry.partialCollaborators = sanitized;
                entry.expectedCollaboratorCount = Math.max(
                    entry.expectedCollaboratorCount || 0,
                    expectedCount || sanitized.length
                );
                window.collabDialogModule?.applyCollaboratorsToCard?.(entry, sanitized);
            }
        }

        if (videoId) {
            applyResolvedCollaborators(videoId, sanitized, {
                expectedCount: expectedCount || sanitized.length,
                sourceLabel: 'dialog',
                force: true
            });
        }
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
        try {
            ensureWatchPlaylistFallbackMenu();
        } catch (e) {
        }

        // Set up a mutation observer to handle dynamic loading
        // We use a debounced version of the fallback to prevent performance issues
        let lastFallbackRunTs = 0;
        let pendingImmediateFallbackTimer = 0;
        const MIN_FALLBACK_INTERVAL_MS = 250;

        const debouncedFallback = debounce(() => {
            applyDOMFallback(null);
            lastFallbackRunTs = Date.now();
        }, 200);

        let immediateFallbackScheduled = false;
        function scheduleImmediateFallback() {
            if (immediateFallbackScheduled) return;
            immediateFallbackScheduled = true;
            requestAnimationFrame(() => {
                immediateFallbackScheduled = false;

                const now = Date.now();
                const elapsed = now - (lastFallbackRunTs || 0);
                if (elapsed < MIN_FALLBACK_INTERVAL_MS) {
                    if (pendingImmediateFallbackTimer) return;
                    pendingImmediateFallbackTimer = setTimeout(() => {
                        pendingImmediateFallbackTimer = 0;
                        lastFallbackRunTs = Date.now();
                        applyDOMFallback(null);
                        try {
                            schedulePrefetchScan();
                        } catch (e) {
                        }
                    }, MIN_FALLBACK_INTERVAL_MS - elapsed);
                    return;
                }

                lastFallbackRunTs = now;
                applyDOMFallback(null);
                try {
                    schedulePrefetchScan();
                } catch (e) {
                }
            });
        }

        function applyWhitelistPendingHide(mutations) {
            try {
                const listMode = currentSettings?.listMode === 'whitelist' ? 'whitelist' : 'blocklist';
                if (listMode !== 'whitelist') return;

                try {
                    const path = document.location?.pathname || '';
                    if (path === '/results') return;
                } catch (e) {
                }

                const shouldSkipPendingHide = (element) => {
                    if (!element || typeof element.closest !== 'function') return false;
                    try {
                        if (element.closest('ytd-watch-flexy, ytd-watch-metadata, ytd-video-primary-info-renderer, ytd-video-secondary-info-renderer, ytd-comments, ytd-comment-simplebox-renderer, #comments, #secondary, #related')) {
                            const tag = (element.tagName || '').toLowerCase();
                            const isContentCard = (
                                tag === 'ytd-video-renderer' ||
                                tag === 'ytd-compact-video-renderer' ||
                                tag === 'ytd-watch-card-compact-video-renderer' ||
                                tag === 'ytd-watch-card-hero-video-renderer' ||
                                tag === 'ytd-watch-card-rhs-panel-video-renderer' ||
                                tag === 'ytd-universal-watch-card-renderer' ||
                                tag === 'ytd-playlist-panel-video-renderer' ||
                                tag === 'ytd-playlist-panel-video-wrapper-renderer' ||
                                tag === 'yt-lockup-view-model' ||
                                tag === 'yt-lockup-metadata-view-model' ||
                                tag === 'ytd-reel-item-renderer'
                            );
                            return !isContentCard;
                        }
                    } catch (e) {
                    }
                    return false;
                };

                const resolveTargetToHide = (element) => {
                    try {
                        const tag = (element?.tagName || '').toLowerCase();
                        if (tag === 'ytd-rich-grid-media') {
                            return element.closest('ytd-rich-item-renderer, ytd-item-section-renderer') || element;
                        }
                        if (tag === 'yt-lockup-view-model' || tag === 'yt-lockup-metadata-view-model') {
                            return element.closest('ytd-rich-item-renderer') || element;
                        }
                        if (tag === 'ytd-playlist-panel-video-renderer') {
                            return element.closest('ytd-playlist-panel-video-wrapper-renderer') || element;
                        }
                    } catch (e) {
                    }
                    return element;
                };

                const hidePending = (element) => {
                    if (!element) return;
                    try {
                        try {
                            const tag = (element.tagName || '').toLowerCase();
                            if (tag === 'ytd-playlist-panel-video-renderer' || tag === 'ytd-playlist-panel-video-wrapper-renderer') {
                                const rowEl = tag === 'ytd-playlist-panel-video-renderer'
                                    ? element
                                    : element.querySelector?.('ytd-playlist-panel-video-renderer');
                                const isSelected = Boolean(
                                    rowEl && (rowEl.hasAttribute('selected') || rowEl.getAttribute('aria-selected') === 'true')
                                );
                                if (isSelected) return;
                            }
                        } catch (e) {
                        }
                        if (shouldSkipPendingHide(element)) return;
                        if (element.hasAttribute('data-filtertube-processed')) return;
                        if (element.getAttribute('data-filtertube-whitelist-pending') === 'true') return;
                        if (element.classList.contains('filtertube-hidden') || element.hasAttribute('data-filtertube-hidden')) return;

                        try {
                            queuePrefetchForCard(element);
                        } catch (e) {
                        }

                        element.classList.add('filtertube-hidden');
                        element.setAttribute('data-filtertube-hidden', 'true');
                        element.setAttribute('data-filtertube-whitelist-pending', 'true');
                        try {
                            element.style.setProperty('display', 'none', 'important');
                        } catch (e) {
                        }
                    } catch (e) {
                    }
                };

                try {
                    for (const mutation of mutations || []) {
                        const added = mutation?.addedNodes;
                        if (!added || !added.length) continue;
                        for (const node of added) {
                            if (!(node instanceof Element)) continue;

                            const candidates = [];
                            try {
                                if (node.matches && node.matches(VIDEO_CARD_SELECTORS)) {
                                    candidates.push(node);
                                }
                            } catch (e) {
                            }

                            try {
                                const nested = node.querySelectorAll ? node.querySelectorAll(VIDEO_CARD_SELECTORS) : [];
                                nested?.forEach?.(el => candidates.push(el));
                            } catch (e) {
                            }

                            for (const cand of candidates) {
                                const target = resolveTargetToHide(cand);
                                hidePending(target);
                            }
                        }
                    }
                } catch (e) {
                }

                try {
                    if (typeof applyDOMFallback === 'function') {
                        setTimeout(() => {
                            try {
                                applyDOMFallback(null, { preserveScroll: true, onlyWhitelistPending: true });
                            } catch (e) {
                            }
                        }, 0);
                        setTimeout(() => {
                            try {
                                applyDOMFallback(null, { preserveScroll: true, onlyWhitelistPending: true });
                            } catch (e) {
                            }
                        }, 90);
                    }
                } catch (e) {
                }
            } catch (e) {
            }
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
                applyWhitelistPendingHide(mutations);
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

        // Start prefetch observer once DOM fallback is initialized
        startCardPrefetchObserver();
        installPlaylistPanelPrefetchHook();
        installRightRailWhitelistObserver();
        // Schedule a scan to attach observer to existing cards
        schedulePrefetchScan();
    }
}

let watchPlaylistFallbackMenuInstalled = false;
function ensureWatchPlaylistFallbackMenu() {
    if (watchPlaylistFallbackMenuInstalled) return;
    watchPlaylistFallbackMenuInstalled = true;

    const isWatchPlaylist = () => {
        try {
            const path = document.location?.pathname || '';
            if (!path.startsWith('/watch')) return false;
            const params = new URLSearchParams(document.location?.search || '');
            return params.has('list');
        } catch (e) {
            return false;
        }
    };

    if (!isWatchPlaylist()) {
        document.addEventListener('yt-navigate-finish', () => {
            try {
                if (isWatchPlaylist()) {
                    ensureWatchPlaylistFallbackMenu();
                }
            } catch (e) {
            }
        }, { once: true });
        return;
    }

    try {
        const styleId = 'filtertube-watch-playlist-fallback-menu-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .filtertube-playlist-menu-fallback-btn {
                    appearance: none;
                    -webkit-appearance: none;
                    border: none;
                    background: transparent;
                    color: inherit;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    margin: 0;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                }
                .filtertube-playlist-menu-fallback-btn:hover {
                    background: rgba(255, 255, 255, 0.10);
                }
                html[data-theme="dark"] .filtertube-playlist-menu-fallback-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                }
                .filtertube-playlist-menu-fallback-popover {
                    position: fixed;
                    z-index: 2147483647;
                    min-width: 220px;
                    max-width: 280px;
                    background: rgba(17, 24, 39, 0.98);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.10);
                    border-radius: 12px;
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
                    padding: 8px;
                    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
                }
                .filtertube-playlist-menu-fallback-popover .ft-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.88);
                    padding: 6px 8px 8px 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    margin-bottom: 6px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .filtertube-playlist-menu-fallback-popover button.ft-action {
                    width: 100%;
                    text-align: left;
                    border: none;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.92);
                    padding: 10px 10px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 13px;
                }
                .filtertube-playlist-menu-fallback-popover button.ft-action:hover {
                    background: rgba(255, 255, 255, 0.08);
                }
                .filtertube-playlist-menu-fallback-popover .ft-hint {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.66);
                    padding: 6px 10px 2px 10px;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }
    } catch (e) {
    }

    const getMenuHost = (row) => {
        if (!row) return null;
        try {
            const children = row.children ? Array.from(row.children) : [];
            const direct = children.find(ch => ch && ch.id === 'menu') || null;
            if (direct) return direct;
        } catch (e) {
        }
        try {
            return row.querySelector('#menu');
        } catch (e) {
            return null;
        }
    };

    const rowHasNativeMenuButton = (row, menuHost) => {
        const root = menuHost || row;
        if (!root) return false;
        try {
            if (root.querySelector('ytd-menu-renderer, yt-icon-button.dropdown-trigger, button[aria-label*="Action menu"], button[aria-label*="More"]')) {
                return true;
            }
        } catch (e) {
        }
        return false;
    };

    const ensureFallbackButtonForRow = (row) => {
        if (!row || !(row instanceof Element)) return;
        const menuHost = getMenuHost(row);
        if (!menuHost) return;

        // If YouTube menu exists, remove our fallback if present.
        if (rowHasNativeMenuButton(row, menuHost)) {
            const existing = menuHost.querySelector('.filtertube-playlist-menu-fallback-btn');
            if (existing) {
                try { existing.remove(); } catch (e) { }
            }
            return;
        }

        // Already injected.
        if (menuHost.querySelector('.filtertube-playlist-menu-fallback-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filtertube-playlist-menu-fallback-btn';
        btn.setAttribute('aria-label', 'FilterTube menu');
        btn.setAttribute('data-filtertube-fallback-menu', 'true');
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 4a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Z"/>
            </svg>
        `;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                openFilterTubePlaylistFallbackPopover(btn, row);
            } catch (err) {
                console.warn('FilterTube: Failed to open playlist fallback menu', err);
            }
        }, true);

        try {
            menuHost.appendChild(btn);
        } catch (e) {
        }
    };

    const scan = () => {
        if (!isWatchPlaylist()) return;
        const panel = document.querySelector('ytd-playlist-panel-renderer');
        if (!panel) return;
        const rows = panel.querySelectorAll('ytd-playlist-panel-video-renderer');
        if (!rows || rows.length === 0) return;
        rows.forEach(row => ensureFallbackButtonForRow(row));
    };

    const observer = new MutationObserver(() => {
        try { scan(); } catch (e) { }
    });

    const attach = () => {
        const panel = document.querySelector('ytd-playlist-panel-renderer');
        if (!panel) return false;
        try {
            observer.observe(panel, { childList: true, subtree: true });
        } catch (e) {
            return false;
        }
        return true;
    };

    if (!attach()) {
        const t = setInterval(() => {
            if (attach()) {
                clearInterval(t);
                try { scan(); } catch (e) { }
            }
        }, 700);
        setTimeout(() => clearInterval(t), 12000);
    } else {
        scan();
    }

    document.addEventListener('yt-navigate-finish', () => {
        try { scan(); } catch (e) { }
    });
}

let playlistFallbackPopoverState = null;
function openFilterTubePlaylistFallbackPopover(button, row) {
    if (!button || !row) return;
    if (!playlistFallbackPopoverState) {
        playlistFallbackPopoverState = { popover: null, onDocClick: null };
    }

    const close = () => {
        const pop = playlistFallbackPopoverState?.popover;
        if (pop) {
            try { pop.remove(); } catch (e) { }
        }
        playlistFallbackPopoverState.popover = null;
        if (playlistFallbackPopoverState?.onDocClick) {
            document.removeEventListener('click', playlistFallbackPopoverState.onDocClick, true);
            playlistFallbackPopoverState.onDocClick = null;
        }
    };

    close();

    const rect = button.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'filtertube-playlist-menu-fallback-popover';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'FilterTube menu');

    const ensuredVideoId = (() => {
        try { return ensureVideoIdForCard(row) || ''; } catch (e) { return ''; }
    })();

    let extracted = null;
    try {
        extracted = extractChannelFromCard(row);
    } catch (e) {
        extracted = null;
    }

    const title = (() => {
        const name = extracted?.name || row.querySelector('#byline')?.textContent?.trim() || '';
        const vid = ensuredVideoId || extracted?.videoId || '';
        const label = name ? `FilterTube: ${name}` : 'FilterTube';
        return vid ? `${label}` : label;
    })();

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'ft-action';
    action.textContent = 'Block channel';

    const actionAll = document.createElement('button');
    actionAll.type = 'button';
    actionAll.className = 'ft-action';
    actionAll.textContent = 'Block channel (Filter All)';

    const hint = document.createElement('div');
    hint.className = 'ft-hint';
    hint.textContent = 'Fallback menu (YouTube 3-dot unavailable for this item).';

    const performBlock = async (filterAll) => {
        try {
            let info = extracted || (extractChannelFromCard(row) || null);
            let handle = typeof info?.handle === 'string' ? info.handle.trim() : '';
            let id = typeof info?.id === 'string' ? info.id.trim() : '';
            let customUrl = typeof info?.customUrl === 'string' ? info.customUrl.trim() : '';
            let input = handle || customUrl || id;

            if (!input) {
                // Playlist rows sometimes render without any channel link; try main-world lookup via videoId.
                const expectedName = row.querySelector('#byline')?.textContent?.trim() || '';
                const videoId = ensuredVideoId || (typeof info?.videoId === 'string' ? info.videoId.trim() : '');
                if (videoId) {
                    try {
                        const resolved = await requestChannelInfoFromMainWorld(videoId, { expectedName });
                        if (resolved) {
                            info = { ...(info || {}), ...resolved, videoId };
                            handle = typeof info.handle === 'string' ? info.handle.trim() : '';
                            id = typeof info.id === 'string' ? info.id.trim() : '';
                            customUrl = typeof info.customUrl === 'string' ? info.customUrl.trim() : '';
                            input = handle || customUrl || id;
                        }
                    } catch (e) {
                    }
                }
            }

            if (!input) {
                console.warn('FilterTube: Fallback menu could not extract channel identity');
                close();
                return;
            }

            const metaPayload = buildChannelMetadataPayload({
                ...(info || {}),
                videoId: ensuredVideoId || info?.videoId || null,
                source: 'playlist_fallback_menu'
            });

            action.disabled = true;
            actionAll.disabled = true;
            const res = await addChannelDirectly(input, !!filterAll, null, null, metaPayload);
            close();

            if (res && res.success) {
                try {
                    const refreshed = await requestSettingsFromBackground();
                    if (refreshed?.success && refreshed.settings) {
                        currentSettings = refreshed.settings;
                    }
                } catch (e) {
                }
                try {
                    if (typeof applyDOMFallback === 'function') {
                        applyDOMFallback(null, { forceReprocess: true, preserveScroll: true });
                    }
                } catch (e) {
                }
            } else {
                console.warn('FilterTube: Failed to block channel from fallback menu:', res?.error || 'unknown');
            }
        } catch (e) {
            console.warn('FilterTube: Fallback block failed', e);
            close();
        }
    };

    action.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        performBlock(false);
    }, true);
    actionAll.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        performBlock(true);
    }, true);

    const titleEl = document.createElement('div');
    titleEl.className = 'ft-title';
    titleEl.textContent = title;
    pop.appendChild(titleEl);
    pop.appendChild(action);
    pop.appendChild(actionAll);
    pop.appendChild(hint);

    // Position: align right edge with the button, prefer below.
    const padding = 8;
    const x = Math.max(padding, Math.min(window.innerWidth - padding - 280, rect.right - 280));
    const yPreferred = rect.bottom + 8;
    const y = (yPreferred + 180 < window.innerHeight) ? yPreferred : Math.max(padding, rect.top - 180);
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;

    (document.body || document.documentElement).appendChild(pop);
    playlistFallbackPopoverState.popover = pop;

    playlistFallbackPopoverState.onDocClick = (evt) => {
        try {
            const t = evt?.target;
            if (!(t instanceof Element)) return close();
            if (t.closest('.filtertube-playlist-menu-fallback-popover')) return;
            if (t.closest('.filtertube-playlist-menu-fallback-btn')) return;
        } catch (e) {
        }
        close();
    };
    document.addEventListener('click', playlistFallbackPopoverState.onDocClick, true);
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
        newMenuList.insertBefore(makeItem(blockAllMessage, 'Awaiting collaborator list'), newMenuList.firstChild?.nextSibling || null);
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
        menuList.insertBefore(makeItem(blockAllMessage, 'Awaiting collaborator list'), menuList.firstChild?.nextSibling || null);
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

const ytInitialDataChannelCache = new Map();
const ytInitialDataChannelCacheExpiry = new Map();
const ytInitialDataChannelNegativeExpiry = new Map();
const ytInitialDataChannelInFlight = new Map();

const YT_INITIALDATA_CACHE_TTL_MS = 5 * 60 * 1000;
const YT_INITIALDATA_NEGATIVE_TTL_MS = 20 * 1000;

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

    const expectedHandleKey = resolvedOptions.expectedHandle ? normalizeHandleValue(resolvedOptions.expectedHandle).toLowerCase() : '';
    const expectedNameKey = (typeof resolvedOptions.expectedName === 'string' ? resolvedOptions.expectedName.trim().toLowerCase().replace(/\s+/g, ' ') : '');
    const cacheKey = `${videoId}|h:${expectedHandleKey}|n:${expectedNameKey}`;

    const now = Date.now();
    const negExpiry = ytInitialDataChannelNegativeExpiry.get(cacheKey) || 0;
    if (negExpiry) {
        if (now < negExpiry) {
            return null;
        }
        ytInitialDataChannelNegativeExpiry.delete(cacheKey);
    }

    const expiry = ytInitialDataChannelCacheExpiry.get(cacheKey) || 0;
    if (expiry) {
        if (now < expiry) {
            return ytInitialDataChannelCache.get(cacheKey) || null;
        }
        ytInitialDataChannelCacheExpiry.delete(cacheKey);
        ytInitialDataChannelCache.delete(cacheKey);
    }

    if (ytInitialDataChannelInFlight.has(cacheKey)) {
        try {
            return await ytInitialDataChannelInFlight.get(cacheKey);
        } catch (e) {
            return null;
        }
    }

    const inFlight = (async () => {
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

        if (typeof resolvedOptions.expectedName === 'string' && resolvedOptions.expectedName.trim()) {
            const normalizeName = (value) => {
                if (!value || typeof value !== 'string') return '';
                return value.trim().toLowerCase().replace(/\s+/g, ' ');
            };
            const normalizedExpectedName = normalizeName(resolvedOptions.expectedName);
            const normalizedFoundName = normalizeName(result.name);
            if (normalizedExpectedName && normalizedFoundName && normalizedExpectedName !== normalizedFoundName) {
                console.warn('FilterTube: ytInitialData name mismatch, rejecting result', {
                    expected: normalizedExpectedName,
                    found: normalizedFoundName,
                    videoId
                });
                return null;
            }
        }
        return result;
    })();

    ytInitialDataChannelInFlight.set(cacheKey, inFlight);

    try {
        const result = await inFlight;
        const nextNow = Date.now();
        if (result) {
            ytInitialDataChannelCache.set(cacheKey, result);
            ytInitialDataChannelCacheExpiry.set(cacheKey, nextNow + YT_INITIALDATA_CACHE_TTL_MS);
            ytInitialDataChannelNegativeExpiry.delete(cacheKey);
        } else {
            ytInitialDataChannelNegativeExpiry.set(cacheKey, nextNow + YT_INITIALDATA_NEGATIVE_TTL_MS);
            ytInitialDataChannelCache.delete(cacheKey);
            ytInitialDataChannelCacheExpiry.delete(cacheKey);
        }
        return result;
    } catch (e) {
        try {
            ytInitialDataChannelNegativeExpiry.set(cacheKey, Date.now() + YT_INITIALDATA_NEGATIVE_TTL_MS);
        } catch (err) {
        }
        return null;
    } finally {
        ytInitialDataChannelInFlight.delete(cacheKey);
    }
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
function extractChannelFromInitialData(initialData, options = {}) {
    if (!initialData || typeof initialData !== 'object') return null;

    const targetVideoId = typeof options.videoId === 'string' ? options.videoId : '';

    function normalizeChannelName(value) {
        if (!value || typeof value !== 'string') return '';
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    const normalizedExpectedHandle = typeof options.expectedHandle === 'string'
        ? normalizeHandleValue(options.expectedHandle).toLowerCase()
        : '';
    const normalizedExpectedName = normalizeChannelName(options.expectedName);
    const hasExpectations = Boolean(normalizedExpectedHandle || normalizedExpectedName);

    function matchesExpectations(candidate) {
        if (!candidate) return false;
        if (!hasExpectations) return true;

        if (normalizedExpectedHandle) {
            const candidateHandle = typeof candidate.handle === 'string'
                ? normalizeHandleValue(candidate.handle).toLowerCase()
                : '';
            if (candidateHandle && candidateHandle !== normalizedExpectedHandle) {
                return false;
            }
        }

        if (normalizedExpectedName) {
            const candidateName = normalizeChannelName(candidate.name);
            if (candidateName && candidateName !== normalizedExpectedName) {
                return false;
            }
        }

        return true;
    }

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

        const nodeVideoId = typeof node.videoId === 'string' ? node.videoId : '';
        const candidateVideoId = typeof candidate.videoId === 'string' ? candidate.videoId : '';
        const effectiveVideoId = candidateVideoId || nodeVideoId;

        if (!targetVideoId || (effectiveVideoId && effectiveVideoId === targetVideoId)) {
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

                    const name = typeof run.text === 'string' ? run.text : '';
                    const candidateResult = { id: browseId, name };
                    if (handle) {
                        candidateResult.handle = handle;
                    }

                    if (matchesExpectations(candidateResult)) {
                        if (handle) {
                            console.log('FilterTube: Found channel in ytInitialData (deep search):', { handle, id: browseId });
                        }
                        return candidateResult;
                    }
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
 * Enrich all visible Shorts on the page with channel info.
 * After blocking a channel, Shorts from that channel may still be visible because
 * they don't have channel identity in DOM. This function fetches channel info for
 * those Shorts and stores videoId → channelId mappings so DOM fallback can hide them.
 * 
 * @param {string} blockedChannelId - The UC ID of the channel that was just blocked
 * @param {Object} settings - Current settings including videoChannelMap
 */
async function enrichVisibleShortsWithChannelInfo(blockedChannelId, settings) {
    if (!blockedChannelId) return;

    const shortsSelectors = [
        'ytm-shorts-lockup-view-model',
        'ytm-shorts-lockup-view-model-v2',
        'ytd-reel-item-renderer',
        '[data-filtertube-short="true"]'
    ].join(', ');

    const shortsElements = document.querySelectorAll(shortsSelectors);
    if (shortsElements.length === 0) {
        if (window.__filtertubeDebug) {
            console.log('FilterTube: No Shorts found to enrich');
        }
        return;
    }

    if (window.__filtertubeDebug) {
        console.log(`FilterTube: Enriching ${shortsElements.length} Shorts with channel info`);
    }

    const videoChannelMap = settings?.videoChannelMap || {};
    const videoIdsToFetch = [];
    const elementsByVideoId = new Map();

    // Collect videoIds that need fetching
    for (const el of shortsElements) {
        // Skip already hidden elements
        if (el.classList.contains('filtertube-hidden') || el.hasAttribute('data-filtertube-hidden')) {
            continue;
        }

        // Extract videoId from Shorts card
        let videoId = null;

        // Try data attributes first
        for (const attr of ['data-video-id', 'video-id', 'data-videoid']) {
            const val = el.getAttribute(attr);
            if (val && /^[a-zA-Z0-9_-]{11}$/.test(val)) {
                videoId = val;
                break;
            }
        }

        // Try anchor hrefs
        if (!videoId) {
            const link = el.querySelector('a[href*="/shorts/"]');
            const href = link?.getAttribute('href') || link?.href || '';
            const m = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (m && m[1]) videoId = m[1];
        }

        // Try any attribute with shorts URL
        if (!videoId) {
            for (const attr of el.getAttributeNames ? el.getAttributeNames() : []) {
                const val = el.getAttribute(attr) || '';
                if (typeof val === 'string') {
                    const m = val.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                    if (m && m[1]) {
                        videoId = m[1];
                        break;
                    }
                }
            }
        }

        if (!videoId) continue;

        // Skip if already in videoChannelMap
        if (videoChannelMap[videoId]) continue;

        videoIdsToFetch.push(videoId);
        if (!elementsByVideoId.has(videoId)) {
            elementsByVideoId.set(videoId, []);
        }
        elementsByVideoId.get(videoId).push(el);
    }

    if (videoIdsToFetch.length === 0) {
        if (window.__filtertubeDebug) {
            console.log('FilterTube: All visible Shorts already have channel mappings');
        }
        return;
    }

    if (window.__filtertubeDebug) {
        console.log(`FilterTube: Fetching channel info for ${videoIdsToFetch.length} Shorts`);
    }

    // Limit concurrent fetches to avoid overwhelming the network
    const MAX_CONCURRENT = 3;
    let anyMatchesFound = false;

    for (let i = 0; i < videoIdsToFetch.length; i += MAX_CONCURRENT) {
        const batch = videoIdsToFetch.slice(i, i + MAX_CONCURRENT);
        const fetchPromises = batch.map(async (videoId) => {
            try {
                const info = await fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false });
                if (info && info.id) {
                    // Store in videoChannelMap via background
                    browserAPI_BRIDGE.runtime.sendMessage({
                        action: 'updateVideoChannelMap',
                        videoId: videoId,
                        channelId: info.id
                    });

                    // Check if this Short belongs to the blocked channel
                    if (info.id.toLowerCase() === blockedChannelId.toLowerCase()) {
                        anyMatchesFound = true;
                        // Immediately hide these elements
                        const elements = elementsByVideoId.get(videoId) || [];
                        for (const el of elements) {
                            let container = el.closest('ytd-rich-item-renderer') ||
                                el.closest('.ytGridShelfViewModelGridShelfItem') ||
                                el;
                            container.style.display = 'none';
                            container.classList.add('filtertube-hidden');
                            container.setAttribute('data-filtertube-hidden', 'true');
                            console.log(`FilterTube: Hiding Short ${videoId} from blocked channel`);
                        }
                    }
                }
            } catch (e) {
                console.warn(`FilterTube: Failed to fetch channel for Short ${videoId}:`, e);
            }
        });

        await Promise.all(fetchPromises);
    }

    // Re-run DOM fallback with fresh settings if we found matches
    if (anyMatchesFound) {
        console.log('FilterTube: Found Shorts from blocked channel, refreshing settings and re-running DOM fallback');
        try {
            const refreshed = await requestSettingsFromBackground();
            if (refreshed?.success && refreshed.settings) {
                currentSettings = refreshed.settings;
                applyDOMFallback(refreshed.settings, { forceReprocess: true, preserveScroll: true });
            }
        } catch (e) {
            console.warn('FilterTube: Failed to refresh after Shorts enrichment:', e);
        }
    }
}

/**
 * Fetch channel information from a shorts URL
 * @param {string} videoId - The shorts video ID
 * @returns {Promise<Object|null>} - {handle, name} or null
 */
async function fetchChannelFromShortsUrl(videoId, requestedHandle = null) {
    if (!videoId || typeof videoId !== 'string') return null;

    const options = arguments.length >= 3 && arguments[2] && typeof arguments[2] === 'object' ? arguments[2] : {};
    const allowDirectFetch = options.allowDirectFetch === true;

    try {
        const mappedId = currentSettings?.videoChannelMap?.[videoId] || '';
        if (mappedId && typeof mappedId === 'string' && mappedId.toUpperCase().startsWith('UC')) {
            const mappedKey = mappedId.toLowerCase();
            const mappedHandle = currentSettings?.channelMap?.[mappedKey] || null;
            return {
                id: mappedId,
                handle: mappedHandle || null,
                name: '',
                customUrl: null,
                videoId
            };
        }
    } catch (e) {
    }

    if (pendingShortsFetches.has(videoId)) {
        console.log('FilterTube: Reusing existing fetch for shorts video:', videoId);
        return pendingShortsFetches.get(videoId);
    }

    const fetchPromise = (async () => {
        const normalizedExpected = normalizeHandleValue(requestedHandle);
        try {
            const response = await browserAPI_BRIDGE.runtime.sendMessage({
                action: 'fetchShortsIdentity',
                type: 'fetchShortsIdentity',
                videoId,
                expectedHandle: normalizedExpected || ''
            });

            if (response?.success && response.identity) {
                const identity = response.identity;
                const candidateHandle = identity.handle || identity.canonicalHandle || '';
                const normalizedFound = normalizeHandleValue(candidateHandle);

                if (!normalizedExpected || !normalizedFound || normalizedFound === normalizedExpected) {
                    return {
                        id: identity.id || null,
                        handle: candidateHandle || null,
                        name: identity.name || '',
                        customUrl: identity.customUrl || null,
                        videoId
                    };
                }
            }
        } catch (error) {
            console.debug('FilterTube: Background shorts identity fetch failed, falling back to direct fetch', error);
        }

        if (!allowDirectFetch) {
            return null;
        }

        return await fetchChannelFromShortsUrlDirect(videoId, requestedHandle, normalizedExpected);
    })().finally(() => {
        pendingShortsFetches.delete(videoId);
    });

    pendingShortsFetches.set(videoId, fetchPromise);
    return fetchPromise;
}

async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {
    try {
        console.log('FilterTube: Fetching shorts page directly for video:', videoId);
        const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
            credentials: 'same-origin',
            headers: {
                'Accept': 'text/html'
            }
        });

        if (!response.ok) {
            console.debug('FilterTube: Direct shorts fetch failed:', response.status);
            return null;
        }

        const html = await response.text();
        const normalizedHandleExpectation = normalizedExpected || normalizeHandleValue(requestedHandle);

        const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
        if (ytInitialDataMatch) {
            try {
                const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
                const engagementPanels = ytInitialData?.engagementPanels;
                const overlay = ytInitialData?.overlay?.reelPlayerOverlayRenderer;

                if (engagementPanels && Array.isArray(engagementPanels)) {
                    for (const panel of engagementPanels) {
                        const header = panel?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer;
                        if (header?.menu?.menuRenderer?.items) {
                            for (const item of header.menu.menuRenderer.items) {
                                const endpoint = item?.menuNavigationItemRenderer?.navigationEndpoint?.browseEndpoint;
                                if (endpoint?.browseId && endpoint?.canonicalBaseUrl) {
                                    const handle = endpoint.canonicalBaseUrl.replace('/user/', '@').replace(/^\//, '');
                                    const id = endpoint.browseId && endpoint.browseId.startsWith('UC') ? endpoint.browseId : null;
                                    const normalizedFound = normalizeHandleValue(handle);
                                    if (!normalizedHandleExpectation || normalizedFound === normalizedHandleExpectation) {
                                        return { handle, id, name: '' };
                                    }
                                }
                            }
                        }
                    }
                }

                if (overlay?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer) {
                    const headerRenderer = overlay.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer;
                    const channelNavEndpoint = headerRenderer?.channelNavigationEndpoint?.browseEndpoint;
                    if (channelNavEndpoint?.browseId && channelNavEndpoint?.canonicalBaseUrl) {
                        const handle = channelNavEndpoint.canonicalBaseUrl.replace('/user/', '@').replace(/^\//, '');
                        const id = channelNavEndpoint.browseId && channelNavEndpoint.browseId.startsWith('UC')
                            ? channelNavEndpoint.browseId
                            : null;
                        const normalizedFound = normalizeHandleValue(handle);
                        if (!normalizedHandleExpectation || normalizedFound === normalizedHandleExpectation) {
                            return {
                                handle,
                                id,
                                name: headerRenderer.channelTitleText?.runs?.[0]?.text || ''
                            };
                        }
                    }
                }

                if (!normalizedHandleExpectation) {
                    const deepResult = extractChannelFromInitialData(ytInitialData, {
                        videoId,
                        expectedHandle: requestedHandle
                    });
                    if (deepResult) {
                        return deepResult;
                    }
                }
            } catch (e) {
                console.debug('FilterTube: Failed to parse ytInitialData from shorts page:', e);
            }
        }

        const channelUrlMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/(@[^"]+)"/);
        if (channelUrlMatch) {
            const handle = extractRawHandle(channelUrlMatch[1]);
            const normalizedFound = normalizeHandleValue(handle);
            if (!normalizedHandleExpectation || normalizedFound === normalizedHandleExpectation) {
                return { handle, name: '' };
            }
        }

        const ownerLinkMatch = html.match(/<link itemprop="url" href="https?:\/\/www\.youtube\.com\/(@[^">]+)">/);
        if (ownerLinkMatch) {
            const handle = extractRawHandle(ownerLinkMatch[1]);
            const normalizedFound = normalizeHandleValue(handle);
            if (!normalizedHandleExpectation || normalizedFound === normalizedHandleExpectation) {
                return { handle, name: '' };
            }
        }

        const channelBarMatch = html.match(/href="\/(@[^"\/]+)\/shorts"/);
        if (channelBarMatch) {
            const handle = extractRawHandle(channelBarMatch[1]);
            const normalizedFound = normalizeHandleValue(handle);
            if (!normalizedHandleExpectation || normalizedFound === normalizedHandleExpectation) {
                return { handle, name: '' };
            }
        }

        const anyHandleMatch = html.match(/href="\/(@[^"\/]+)(?:\/shorts|")/);
        if (anyHandleMatch) {
            const handle = extractRawHandle(anyHandleMatch[1]);
            const normalizedFound = normalizeHandleValue(handle);
            if (!normalizedHandleExpectation || normalizedFound === normalizedHandleExpectation) {
                return { handle, name: '' };
            }
        }

        console.debug('FilterTube: Could not extract channel info from shorts page directly');
        return null;
    } catch (error) {
        console.debug('FilterTube: Error fetching shorts page directly:', error);
        return null;
    }
}

/**
 * Fetch channel information from the /watch?v=ID page (robust fallback for any video type)
 * This is the most reliable method as it works for all video types including those from /c/ channels
 * @param {string} videoId - The video ID
 * @param {string|null} requestedHandle - Optional expected handle for validation
 * @returns {Promise<Object|null>} - {id, handle, name, customUrl} or null
 */
async function fetchChannelFromWatchUrl(videoId, requestedHandle = null) {
    // Never attempt cross-origin watch fetch on YouTube Kids.
    if (typeof location !== 'undefined' && String(location.hostname || '').includes('youtubekids.com')) {
        return null;
    }

    if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
        console.warn('FilterTube: Invalid videoId for watch fetch:', videoId);
        return null;
    }

    // Check if there's already a pending fetch for this video
    if (pendingWatchFetches.has(videoId)) {
        console.log('FilterTube: Reusing existing watch fetch for video:', videoId);
        return await pendingWatchFetches.get(videoId);
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
        try {
            console.log('FilterTube: Fetching watch page for video:', videoId);
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'text/html'
                }
            });

            if (!response.ok) {
                console.error('FilterTube: Failed to fetch watch page:', response.status);
                return null;
            }

            const html = await response.text();
            const normalizedExpected = normalizeHandleValue(requestedHandle);

            // Extract ytInitialData from the page
            const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
            if (ytInitialDataMatch) {
                try {
                    const ytInitialData = JSON.parse(ytInitialDataMatch[1]);

                    // Primary path: videoOwnerRenderer in two-column watch next results
                    const contents = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
                    if (Array.isArray(contents)) {
                        for (const content of contents) {
                            const videoSecondary = content?.videoSecondaryInfoRenderer;
                            if (videoSecondary?.owner?.videoOwnerRenderer) {
                                const owner = videoSecondary.owner.videoOwnerRenderer;
                                const browseEndpoint = owner?.navigationEndpoint?.browseEndpoint ||
                                    owner?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint;

                                if (browseEndpoint?.browseId) {
                                    const id = browseEndpoint.browseId.startsWith('UC') ? browseEndpoint.browseId : null;
                                    let handle = '';
                                    let customUrl = null;

                                    // Extract handle from canonicalBaseUrl
                                    if (browseEndpoint.canonicalBaseUrl) {
                                        const baseUrl = browseEndpoint.canonicalBaseUrl;
                                        if (baseUrl.startsWith('/@')) {
                                            handle = extractRawHandle(baseUrl);
                                        } else if (baseUrl.startsWith('/c/')) {
                                            customUrl = 'c/' + baseUrl.split('/')[2];
                                        } else if (baseUrl.startsWith('/user/')) {
                                            customUrl = 'user/' + baseUrl.split('/')[2];
                                        }
                                    }

                                    const name = owner.title?.runs?.[0]?.text || '';

                                    // Validate against expected handle if provided
                                    if (normalizedExpected && handle) {
                                        const normalizedFound = normalizeHandleValue(handle);
                                        if (normalizedFound !== normalizedExpected) {
                                            console.warn('FilterTube: Watch page handle mismatch, rejecting', {
                                                expected: normalizedExpected,
                                                found: normalizedFound
                                            });
                                            continue;
                                        }
                                    }

                                    console.log('FilterTube: Found channel from watch page videoOwnerRenderer:', { id, handle, name, customUrl });
                                    return { id, handle, name, customUrl };
                                }
                            }
                        }
                    }

                    // Fallback: Try playerMicroformatRenderer (contains channel info)
                    const microformat = ytInitialData?.playerOverlays?.playerOverlayRenderer?.endScreen?.watchNextEndScreenRenderer?.results?.[0]?.endScreenVideoRenderer?.shortBylineText?.runs?.[0] ||
                        ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer?.owner?.videoOwnerRenderer?.title?.runs?.[0];

                    if (microformat?.navigationEndpoint?.browseEndpoint) {
                        const browseEndpoint = microformat.navigationEndpoint.browseEndpoint;
                        const id = browseEndpoint.browseId?.startsWith('UC') ? browseEndpoint.browseId : null;
                        let handle = '';
                        let customUrl = null;

                        if (browseEndpoint.canonicalBaseUrl) {
                            const baseUrl = browseEndpoint.canonicalBaseUrl;
                            if (baseUrl.startsWith('/@')) {
                                handle = extractRawHandle(baseUrl);
                            } else if (baseUrl.startsWith('/c/')) {
                                customUrl = 'c/' + baseUrl.split('/')[2];
                            } else if (baseUrl.startsWith('/user/')) {
                                customUrl = 'user/' + baseUrl.split('/')[2];
                            }
                        }

                        const name = microformat.text || '';

                        if (id || handle || customUrl) {
                            console.log('FilterTube: Found channel from watch page microformat:', { id, handle, name, customUrl });
                            return { id, handle, name, customUrl };
                        }
                    }
                } catch (e) {
                    console.warn('FilterTube: Failed to parse ytInitialData from watch page:', e);
                }
            }

            // Fallback: Extract from ytInitialPlayerResponse
            const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
            if (playerResponseMatch) {
                try {
                    const playerResponse = JSON.parse(playerResponseMatch[1]);
                    const videoDetails = playerResponse?.videoDetails;

                    if (videoDetails?.channelId) {
                        const id = videoDetails.channelId.startsWith('UC') ? videoDetails.channelId : null;
                        const name = videoDetails.author || '';

                        console.log('FilterTube: Found channel from watch page playerResponse:', { id, name });
                        return { id, handle: '', name };
                    }
                } catch (e) {
                    console.warn('FilterTube: Failed to parse ytInitialPlayerResponse:', e);
                }
            }

            // Fallback: Extract from meta tags
            const channelIdMatch = html.match(/<meta itemprop="channelId" content="(UC[\w-]{22})">/);
            if (channelIdMatch) {
                const id = channelIdMatch[1];
                const nameMatch = html.match(/<link itemprop="name" content="([^"]+)">/);
                const name = nameMatch ? nameMatch[1] : '';

                console.log('FilterTube: Found channel from watch page meta tags:', { id, name });
                return { id, handle: '', name };
            }

            console.warn('FilterTube: Could not extract channel info from watch page for video:', videoId);
            return null;
        } catch (error) {
            console.error('FilterTube: Error fetching watch page:', error);
            return null;
        } finally {
            // Clean up pending fetch
            pendingWatchFetches.delete(videoId);
        }
    })();

    // Store the promise
    pendingWatchFetches.set(videoId, fetchPromise);

    return await fetchPromise;
}

// Video ID extraction helper (`extractVideoIdFromCard`) is defined in
// `js/content/dom_extractors.js` (loaded before this file via manifest ordering).

/**
 * Extract channel information from a video/short card
 * @param {Element} card - The video or short card element
 * @returns {Object|null|Promise<Object|null>} - {id, handle, name}, {videoId, needsFetch: true}, or null
 */
function extractChannelFromCard(card) {
    if (!card) return null;

    try {
        const cardTag = (card.tagName || '').toLowerCase();

        const extractAvatarUrl = () => {
            const img = card.querySelector(
                '#avatar img, ' +
                'ytd-channel-name img, ' +
                'ytd-video-owner-renderer img, ' +
                'yt-avatar-shape img, ' +
                'yt-img-shadow img'
            );
            if (!img) return '';
            return (img.getAttribute('src') || img.src || '').trim();
        };

        // SPECIAL CASE: Comment context (thread + modern comment view/renderer nodes)
        // Used to support "Block channel" injection inside the comment 3-dot menu.
        if (isCommentContextTag(cardTag)) {
            const authorAnchor = card.querySelector(
                '#author-text.yt-simple-endpoint, ' +
                'a#author-text, ' +
                '#author-text a, ' +
                'a[href*="/@"]#author-text, ' +
                'a[href*="/channel/UC"]#author-text, ' +
                'a[href*="/c/"]#author-text, ' +
                'a[href*="/user/"]#author-text'
            );

            const href = authorAnchor?.getAttribute?.('href') || authorAnchor?.href || '';
            const rawTextFromAnchor = authorAnchor?.textContent?.trim() || '';
            const rawTextFromAnchorSpan = authorAnchor?.querySelector?.('span')?.textContent?.trim() || '';
            const rawTextFromContainerSpan = card.querySelector('#author-text span')?.textContent?.trim() || '';
            const rawTextFromContainer = card.querySelector('#author-text')?.textContent?.trim() || '';
            const rawTextFromAria = authorAnchor?.getAttribute?.('aria-label')?.trim?.() || '';

            const rawHandle = extractRawHandle(href) || extractRawHandle(rawTextFromAnchor) || extractRawHandle(rawTextFromContainer);
            const handle = rawHandle ? normalizeHandleValue(rawHandle) : '';

            const normalizeNameCandidate = (value) => {
                if (!value || typeof value !== 'string') return '';
                // Comments markup sometimes includes extra lines (e.g. display name + handle).
                let singleLine = value
                    .replace(/\s+/g, ' ')
                    .replace(/\s*\n\s*/g, ' ')
                    .replace(/\.\s*Go to channel\.?$/i, '')
                    .trim();

                // Strip relative timestamps often found in ARIA labels (e.g. "User Name 2 hours ago").
                if (/\s+\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i.test(singleLine)) {
                    singleLine = singleLine.replace(/\s+\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i, '').trim();
                }

                // If the candidate includes both a display name and a handle, strip the handle.
                const handleSuffixMatch = singleLine.match(/^(.*?)(\s+@[^\s]+.*)$/);
                if (handleSuffixMatch && handleSuffixMatch[1]) {
                    const prefix = handleSuffixMatch[1].trim();
                    if (prefix && !prefix.startsWith('@')) return prefix;
                }

                const embeddedHandleIdx = singleLine.search(/\s@[^\s]+/);
                if (embeddedHandleIdx > 0) {
                    const prefix = singleLine.slice(0, embeddedHandleIdx).trim();
                    if (prefix && !prefix.startsWith('@')) return prefix;
                }

                return singleLine;
            };

            const nameCandidates = [
                rawTextFromAnchorSpan,
                rawTextFromContainerSpan,
                rawTextFromAria,
                rawTextFromAnchor,
                rawTextFromContainer
            ].map(normalizeNameCandidate).filter(Boolean);

            const pickBestName = () => {
                if (nameCandidates.length === 0) return '';
                // Prefer a candidate that is not the handle.
                const preferred = nameCandidates.find(n => !n.startsWith('@') && (!handle || n.toLowerCase() !== handle.toLowerCase()));
                return preferred || nameCandidates[0];
            };

            const name = pickBestName();
            const id = extractChannelIdFromString(href) || '';

            let customUrl = '';
            const match = href.match(/\/(c|user)\/([^/?#]+)/);
            if (match && match[1] && match[2]) {
                try {
                    customUrl = `${match[1]}/${decodeURIComponent(match[2])}`;
                } catch (_) {
                    customUrl = `${match[1]}/${match[2]}`;
                }
            }

            if (handle || id || customUrl) {
                return {
                    handle: handle || '',
                    id: id || '',
                    customUrl: customUrl || '',
                    source: 'comments',
                    name: name || '',
                    logo: extractAvatarUrl() || ''
                };
            }
        }

        let expectedCollaboratorCount = 0;
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
                        return { handle: extracted, name, logo: extractAvatarUrl() || '' };
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
                return { handle: dataHandle, name: channelName, logo: extractAvatarUrl() || '' };
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
                if (!name) {
                    name = card.getAttribute('data-filtertube-channel-name') ||
                        card.querySelector('[data-filtertube-channel-name]')?.getAttribute('data-filtertube-channel-name') ||
                        '';
                }
                console.log('FilterTube: Found SHORTS channel from data attributes:', { handle: dataHandle, id: dataId, name });
                return { handle: dataHandle, id: dataId, name, logo: extractAvatarUrl() || '' };
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
                    return { handle: extracted, name, logo: extractAvatarUrl() || '' };
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

        // SPECIAL CASE: Mix cards (collection stacks / "My Mix")
        const isMixCard = isMixCardElement(card);
        if (isMixCard) {
            const deriveMixName = () => {
                const nameEl = card.querySelector(
                    '#channel-info ytd-channel-name a, ' +
                    '#channel-name #text a, ' +
                    'ytd-channel-name #text a'
                );
                const candidate = nameEl?.textContent?.trim() || '';
                if (!candidate) return '';
                const lower = candidate.toLowerCase();
                if (lower.startsWith('mix') || lower.startsWith('my mix')) return '';
                if (lower.includes('mix') && candidate.includes('–')) return '';
                return candidate;
            };

            let id = card.getAttribute('data-filtertube-channel-id') ||
                card.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id') || '';
            let handle = card.getAttribute('data-filtertube-channel-handle') ||
                card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle') || '';
            let customUrl = card.getAttribute('data-filtertube-channel-custom') ||
                card.querySelector('[data-filtertube-channel-custom]')?.getAttribute('data-filtertube-channel-custom') || '';

            if ((!id || !handle || !customUrl) && typeof scanDataForChannelIdentifiers === 'function') {
                const candidates = [
                    card.data,
                    card.data?.content,
                    card.data?.content?.lockupViewModel,
                    card.__data,
                    card.__data?.data,
                    card.__data?.data?.content,
                    card.__data?.data?.content?.lockupViewModel
                ];
                for (const candidate of candidates) {
                    if (!candidate) continue;
                    const parsed = scanDataForChannelIdentifiers(candidate);
                    if (parsed?.id && !id) id = parsed.id;
                    if (parsed?.handle && !handle) handle = normalizeHandleValue(parsed.handle);
                    if (parsed?.customUrl && !customUrl) customUrl = parsed.customUrl;
                    if (id || handle || customUrl) break;
                }
            }

            if (!id || !handle || !customUrl) {
                const link = card.querySelector('a[href*="/channel/UC"], a[href*="/\@"], a[href*="/c/"], a[href*="/user/"]');
                const href = link?.getAttribute('href') || '';
                if (href) {
                    if (!handle) {
                        const extracted = extractRawHandle(href);
                        if (extracted) handle = normalizeHandleValue(extracted);
                    }
                    if (!id) {
                        const ucMatch = href.match(/\/(UC[\w-]{22})/);
                        if (ucMatch) id = ucMatch[1];
                    }
                    if (!customUrl) {
                        const match = href.match(/\/(c|user)\/([^/?#]+)/);
                        if (match && match[1] && match[2]) {
                            try {
                                customUrl = `${match[1]}/${decodeURIComponent(match[2])}`;
                            } catch (_) {
                                customUrl = `${match[1]}/${match[2]}`;
                            }
                        }
                    }
                }
            }

            if (id || handle || customUrl) {
                let name = deriveMixName();
                if (!name) {
                    const stamped = card.getAttribute('data-filtertube-channel-name') ||
                        card.querySelector('[data-filtertube-channel-name]')?.getAttribute('data-filtertube-channel-name') ||
                        '';
                    if (stamped && !stamped.includes('•')) {
                        name = stamped;
                    }
                }
                console.log('FilterTube: Extracted from Mix card:', { id, handle, customUrl, name });
                return { id: id || '', handle: handle || '', customUrl: customUrl || '', name: name || '', logo: extractAvatarUrl() || '' };
            }
        }

        // SPECIAL CASE: Detect if this is a Post card (desktop + mobile YTM variants)
        const isPostCard = (
            card.tagName.toLowerCase() === 'ytd-post-renderer' ||
            card.tagName.toLowerCase() === 'ytm-post-renderer' ||
            card.tagName.toLowerCase() === 'ytm-backstage-post-renderer' ||
            card.tagName.toLowerCase() === 'ytm-backstage-post-thread-renderer'
        );

        if (isPostCard) {
            console.log('FilterTube: Detected POST card, using special extraction');

            // Method 1: Try author link in header (desktop + mobile)
            const authorLink = card.querySelector(
                '#author-text.yt-simple-endpoint, ' +
                'a#author-text, ' +
                'yt-post-header a[href^="/@"], ' +
                'yt-post-header a[href*="/channel/UC"], ' +
                'yt-post-header a[href*="/c/"], ' +
                'yt-post-header a[href*="/user/"], ' +
                '.ytPostHeaderHostHeaderAuthor[href^="/@"], ' +
                '.ytPostHeaderHostHeaderAuthor[href*="/channel/UC"], ' +
                '.ytPostHeaderHostHeaderAuthor[href*="/c/"], ' +
                '.ytPostHeaderHostHeaderAuthor[href*="/user/"], ' +
                '.ytPostHeaderHostHeaderAuthor .yt-core-attributed-string__link[href^="/@"], ' +
                '.ytPostHeaderHostHeaderAuthor .yt-core-attributed-string__link[href*="/channel/UC"], ' +
                '.ytPostHeaderHostHeaderAuthor .yt-core-attributed-string__link[href*="/c/"], ' +
                '.ytPostHeaderHostHeaderAuthor .yt-core-attributed-string__link[href*="/user/"]'
            );
            if (authorLink) {
                const href = authorLink.getAttribute('href');
                const name = authorLink.textContent?.trim();

                if (href) {
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        console.log('FilterTube: Extracted from POST author link:', { handle: extracted, name });
                        return { handle: extracted, name, logo: extractAvatarUrl() || '' };
                    }

                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch) {
                        const id = ucMatch[1];
                        console.log('FilterTube: Extracted from POST author link (UC):', { id, name });
                        return { id, name, logo: extractAvatarUrl() || '' };
                    }
                }
            }

            // Method 2: Try author thumbnail link
            const authorThumbnail = card.querySelector(
                '#author-thumbnail a, ' +
                'yt-post-header a[href^="/@"], ' +
                'yt-post-header a[href*="/channel/UC"], ' +
                'yt-post-header a[href*="/c/"], ' +
                'yt-post-header a[href*="/user/"]'
            );
            if (authorThumbnail) {
                const href = authorThumbnail.getAttribute('href');
                const name = card.querySelector('#author span')?.textContent?.trim();

                if (href) {
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        console.log('FilterTube: Extracted from POST thumbnail:', { handle: extracted, name });
                        return { handle: extracted, name, logo: extractAvatarUrl() || '' };
                    }
                }
            }

            console.warn('FilterTube: POST card detected but no channel info found');
            return null;
        }

        // PRIORITY: Check for collaboration videos (Search attributed-channel-name, Home metadata rows, Avatar stack)
        const collaborators = extractCollaboratorMetadataFromElement(card) || [];
        const videoId = extractVideoIdFromCard(card);
        const expectedCount = Number(card.getAttribute('data-filtertube-expected-collaborators')) || collaborators.length;
        const avatarStackSignal = Boolean(card?.querySelector?.('yt-avatar-stack-view-model'));

        const hasCollaborationSignal = Boolean(
            collaborators && collaborators.length > 1 ||
            (avatarStackSignal && expectedCount > 1 && collaborators && collaborators.length > 0)
        );

        if (hasCollaborationSignal) {
            const hasMissingData = collaborators.some(c => !c.handle && !c.id && !c.customUrl);
            const needsMoreCollaborators = expectedCount > 0 && collaborators.length < expectedCount;

            console.log('FilterTube: Collaboration detected through unified extraction:', {
                count: collaborators.length,
                expected: expectedCount,
                needsEnrichment: hasMissingData || needsMoreCollaborators
            });

            return {
                ...(collaborators[0] || {}),
                isCollaboration: true,
                allCollaborators: collaborators,
                needsEnrichment: hasMissingData || needsMoreCollaborators,
                expectedCollaboratorCount: expectedCount,
                videoId: videoId
            };
        }

        // Method 2: Check for data attributes (added by FilterTube's own processing)
        const dataHandle = card.getAttribute('data-filtertube-channel-handle') ||
            card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
        const dataId = card.getAttribute('data-filtertube-channel-id') ||
            card.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id');
        const isPlaylistPanelCard = (cardTag === 'ytd-playlist-panel-video-renderer' || cardTag === 'ytd-playlist-panel-video-wrapper-renderer');

        if (dataHandle || dataId) {
            let name = null;
            let handle = dataHandle;
            let id = dataId;
            const videoIdHint = extractVideoIdFromCard(card) || '';

            if (isPlaylistPanelCard) {
                const mappedId = (() => {
                    const raw = videoIdHint ? (currentSettings?.videoChannelMap?.[videoIdHint] || '') : '';
                    return (typeof raw === 'string' && /^UC[\w-]{22}$/i.test(raw.trim())) ? raw.trim() : '';
                })();
                const bylineAnchor = card.querySelector(
                    '#byline-container ytd-channel-name a[href*="/@"], ' +
                    '#byline-container ytd-channel-name a[href*="/channel/"], ' +
                    '#byline-container ytd-channel-name a[href*="/c/"], ' +
                    '#byline-container ytd-channel-name a[href*="/user/"], ' +
                    '#byline a[href*="/@"], #byline a[href*="/channel/"], #byline a[href*="/c/"], #byline a[href*="/user/"]'
                );
                const bylineHref = bylineAnchor?.getAttribute('href') || bylineAnchor?.href || '';
                const bylineId = extractChannelIdFromString(bylineHref) || '';
                const bylineHandle = normalizeHandleValue(extractRawHandle(bylineHref) || '');

                if (mappedId) {
                    id = mappedId;
                    handle = bylineHandle || '';
                } else if (bylineId || bylineHandle) {
                    id = bylineId || '';
                    handle = bylineHandle || '';
                } else {
                    // Playlist rows without explicit author links must not trust recycled stamped IDs/handles.
                    // They are rehydrated aggressively and can inherit channel identity from another row.
                    id = '';
                    handle = '';
                    try {
                        clearCachedChannelMetadata(card);
                    } catch (e) {
                        card.removeAttribute('data-filtertube-channel-id');
                        card.removeAttribute('data-filtertube-channel-handle');
                    }
                }
            }

            if (!name) {
                const stamped = card.getAttribute('data-filtertube-channel-name') ||
                    card.querySelector('[data-filtertube-channel-name]')?.getAttribute('data-filtertube-channel-name') ||
                    '';
                if (stamped && !stamped.includes('•')) {
                    name = stamped;
                }
            }

            // Playlist panel items often render the channel name as plain text (#byline), not a link.
            if (!name && cardTag === 'ytd-playlist-panel-video-renderer') {
                const bylineText = card.querySelector('#byline')?.textContent?.trim() || '';
                if (bylineText && !bylineText.includes('•')) {
                    name = bylineText;
                }
            }

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
                '.yt-content-metadata-view-model__metadata-row a[href^="/@"], ' +
                '.yt-content-metadata-view-model__metadata-row a[href^="/channel/"], ' +
                '.yt-content-metadata-view-model__metadata-row a[href^="/c/"], ' +
                '.yt-content-metadata-view-model__metadata-row a[href^="/user/"], ' +
                '.yt-lockup-metadata-view-model__metadata a[href^="/@"], ' +
                '.yt-lockup-metadata-view-model__metadata a[href^="/channel/"], ' +
                '.yt-lockup-metadata-view-model__metadata a[href^="/c/"], ' +
                '.yt-lockup-metadata-view-model__metadata a[href^="/user/"]'
            );
            if (channelNameEl) {
                name = channelNameEl.textContent?.trim();

                const href = channelNameEl.getAttribute('href') || channelNameEl.href || '';
                if (href) {
                    const domHandle = extractRawHandle(href);
                    if (domHandle) {
                        if (handle && handle.toLowerCase() !== domHandle.toLowerCase()) {
                            handle = domHandle;
                        } else if (!handle) {
                            handle = domHandle;
                        }
                    }
                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch && ucMatch[1]) {
                        if (!id || id !== ucMatch[1]) {
                            id = ucMatch[1];
                        }
                    }

                    if (!handle) {
                        const inferred = extractRawHandle(href);
                        if (inferred) handle = inferred;
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
                        !/\d+:\d+\s*Now playing/i.test(candidateName) &&
                        !candidateName.includes('•') &&
                        !/\bviews?\b/i.test(candidateName) &&
                        !/\bago\b/i.test(candidateName) &&
                        !/\bwatching\b/i.test(candidateName)) {
                        name = candidateName;
                    }
                }
            }

            if (!name) {
                const lockupName = card.querySelector(
                    '.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row:first-child .yt-content-metadata-view-model__metadata-text'
                )?.textContent?.trim() || '';
                if (
                    lockupName &&
                    !/\bviews?\b/i.test(lockupName) &&
                    !/\bago\b/i.test(lockupName) &&
                    !/\bwatching\b/i.test(lockupName) &&
                    !lockupName.includes('•')
                ) {
                    name = lockupName;
                }
            }

            if (!name) {
                const avatarImg = card.querySelector('yt-avatar-shape img, img.yt-avatar-shape__image');
                const avatarAlt = avatarImg?.getAttribute('alt')?.trim() || '';
                if (avatarAlt && !/go to channel/i.test(avatarAlt) && !avatarAlt.includes('•')) {
                    name = avatarAlt;
                }
            }

            const parsedCollaboratorsFromName = parseCollaboratorNames(name || '');
            const hasCollabDomSignal = Boolean(
                card.querySelector('yt-avatar-stack-view-model, #attributed-channel-name')
            );
            const hasCollabNameHint = Boolean(
                parsedCollaboratorsFromName.hasHiddenCollaborators ||
                (parsedCollaboratorsFromName.names.length >= 2 && (hasCollabDomSignal || isPlaylistPanelCard || cardTag.includes('lockup-view-model')))
            );

            if (hasCollabNameHint) {
                const collaboratorList = [];
                parsedCollaboratorsFromName.names.forEach((collabName, index) => {
                    collaboratorList.push({
                        name: collabName,
                        handle: index === 0 ? (handle || '') : '',
                        id: index === 0 ? (id || '') : '',
                        customUrl: ''
                    });
                });

                if (collaboratorList.length === 0 && name) {
                    collaboratorList.push({
                        name,
                        handle: handle || '',
                        id: id || '',
                        customUrl: ''
                    });
                }

                const expectedCollaboratorCount = Math.max(
                    2,
                    collaboratorList.length,
                    parsedCollaboratorsFromName.names.length + parsedCollaboratorsFromName.hiddenCount
                );

                return {
                    handle,
                    id,
                    name,
                    logo: extractAvatarUrl() || '',
                    videoId: videoIdHint || undefined,
                    isCollaboration: true,
                    allCollaborators: collaboratorList,
                    needsEnrichment: true,
                    expectedCollaboratorCount
                };
            }

            console.log('FilterTube: Extracted from data attribute:', { handle, id, name });
            return { handle, id, name, logo: extractAvatarUrl() || '', videoId: videoIdHint || undefined };
        }

        // Method 3: Find channel link - PRIORITIZE specific metadata areas over generic selectors
        // This prevents picking up links from thumbnail overlays (duration, "Now playing", etc.)

        // Priority 1: Channel name elements (most reliable for search results)
        const channelNameLink = card.querySelector(
            '#channel-info ytd-channel-name a[href*="/@"], ' +
            '#channel-info ytd-channel-name a[href*="/channel/"], ' +
            '#channel-info ytd-channel-name a[href*="/c/"], ' +
            '#channel-info ytd-channel-name a[href*="/user/"], ' +
            'ytd-video-meta-block ytd-channel-name a[href*="/@"], ' +
            'ytd-video-meta-block ytd-channel-name a[href*="/channel/"], ' +
            'ytd-video-meta-block ytd-channel-name a[href*="/c/"], ' +
            'ytd-video-meta-block ytd-channel-name a[href*="/user/"], ' +
            '#byline-container ytd-channel-name a[href*="/@"], ' +
            '#byline-container ytd-channel-name a[href*="/channel/"], ' +
            '#byline-container ytd-channel-name a[href*="/c/"], ' +
            '#byline-container ytd-channel-name a[href*="/user/"], ' +
            'ytd-channel-name #text a[href*="/@"], ' +
            'ytd-channel-name #text a[href*="/channel/"], ' +
            'ytd-channel-name #text a[href*="/c/"], ' +
            'ytd-channel-name #text a[href*="/user/"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href*="/@"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href*="/channel/"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href*="/c/"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href*="/user/"], ' +
            '.yt-lockup-metadata-view-model .yt-core-attributed-string__link[href*="/@"]'
        );

        if (channelNameLink) {
            const href = channelNameLink.getAttribute('href');
            const name = channelNameLink.textContent?.trim();
            if (href) {
                const extracted = extractRawHandle(href);
                if (extracted) {
                    console.log('FilterTube: Extracted from channel name link:', { handle: extracted, name });
                    return { handle: extracted, name, logo: extractAvatarUrl() || '' };
                }
                const ucMatch = href.match(/\/(UC[\w-]{22})/);
                if (ucMatch) {
                    console.log('FilterTube: Extracted from channel name link (UC):', { id: ucMatch[1], name });
                    return { id: ucMatch[1], name, logo: extractAvatarUrl() || '' };
                }

                let path = href;
                try {
                    if (/^https?:\/\//i.test(path)) {
                        path = new URL(path).pathname;
                    }
                } catch (e) {
                    // ignore
                }
                if (!path.startsWith('/')) path = '/' + path;
                path = path.split(/[?#]/)[0];

                if (path.startsWith('/c/')) {
                    const slug = path.split('/')[2];
                    if (slug) {
                        const customUrl = `c/${slug}`;
                        console.log('FilterTube: Extracted from channel name link (C):', { customUrl, name });
                        return { customUrl, name, logo: extractAvatarUrl() || '' };
                    }
                }

                if (path.startsWith('/user/')) {
                    const slug = path.split('/')[2];
                    if (slug) {
                        const customUrl = `user/${slug}`;
                        console.log('FilterTube: Extracted from channel name link (USER):', { customUrl, name });
                        return { customUrl, name, logo: extractAvatarUrl() || '' };
                    }
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
                    return { handle: extracted, name, logo: extractAvatarUrl() || '' };
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
                    return { handle: extracted, name: channelName, logo: extractAvatarUrl() || '' };
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
                    return { handle: extracted, name, logo: extractAvatarUrl() || '' };
                }

                const ucMatch = href.match(/\/(UC[\w-]{22})/);
                if (ucMatch) {
                    console.log('FilterTube: Extracted from metadata (UC):', { id: ucMatch[1], name });
                    return { id: ucMatch[1], name, logo: extractAvatarUrl() || '' };
                }

                let path = href;
                try {
                    if (/^https?:\/\//i.test(path)) {
                        path = new URL(path).pathname;
                    }
                } catch (e) {
                    // ignore
                }
                if (!path.startsWith('/')) path = '/' + path;
                path = path.split(/[?#]/)[0];

                if (path.startsWith('/c/')) {
                    const slug = path.split('/')[2];
                    if (slug) {
                        const customUrl = `c/${slug}`;
                        console.log('FilterTube: Extracted from metadata (C):', { customUrl, name });
                        return { customUrl, name, logo: extractAvatarUrl() || '' };
                    }
                }

                if (path.startsWith('/user/')) {
                    const slug = path.split('/')[2];
                    if (slug) {
                        const customUrl = `user/${slug}`;
                        console.log('FilterTube: Extracted from metadata (USER):', { customUrl, name });
                        return { customUrl, name, logo: extractAvatarUrl() || '' };
                    }
                }
            }
        }

        // Method 5: Homepage Lockup / Modern Metadata fallback
        if (!isShortsCard) {
            // First check for collaborations in lockup views
            const lockupMetadata = card.querySelector('yt-lockup-metadata-view-model, .yt-lockup-metadata-view-model') ||
                card.querySelector('yt-content-metadata-view-model, .yt-content-metadata-view-model');


            if (lockupMetadata) {
                const collaborators = extractCollaboratorMetadataFromElement(card);
                if (collaborators && collaborators.length > 1) {
                    console.log('FilterTube: Detected collaboration in homepage lockup:', collaborators);
                    const videoId = extractVideoIdFromCard(card);
                    const expectedCount = parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || collaborators.length;

                    return {
                        ...collaborators[0],
                        isCollaboration: true,
                        allCollaborators: collaborators,
                        needsEnrichment: collaborators.some(c => !c.handle && !c.id),
                        expectedCollaboratorCount: expectedCount,
                        videoId
                    };
                }

                const avatarImg = lockupMetadata.querySelector('yt-avatar-shape img, img.yt-avatar-shape__image');
                const avatarAlt = avatarImg?.getAttribute('alt')?.trim();
                if (avatarAlt && !/go to channel/i.test(avatarAlt)) {
                    // Try to find handle link first
                    const nearbyHandle = lockupMetadata.querySelector('.yt-core-attributed-string__link[href*="/@"]');
                    if (nearbyHandle) {
                        const href = nearbyHandle.getAttribute('href');
                        const extracted = extractRawHandle(href);
                        if (extracted) {
                            console.log('FilterTube: Extracted from lockup avatar/link:', { handle: extracted, name: avatarAlt });
                            return { handle: extracted, name: avatarAlt, logo: extractAvatarUrl() || '' };
                        }
                    }
                    // Try /c/ or /user/ links for custom URL channels
                    const customUrlLink = lockupMetadata.querySelector('.yt-core-attributed-string__link[href*="/c/"], .yt-core-attributed-string__link[href*="/user/"]');
                    if (customUrlLink) {
                        const href = customUrlLink.getAttribute('href');
                        let path = href;
                        try {
                            if (/^https?:\/\//i.test(path)) {
                                path = new URL(path).pathname;
                            }
                        } catch (e) { /* ignore */ }
                        if (!path.startsWith('/')) path = '/' + path;
                        path = path.split(/[?#]/)[0];

                        if (path.startsWith('/c/')) {
                            const slug = path.split('/')[2];
                            if (slug) {
                                const customUrl = `c/${slug}`;
                                console.log('FilterTube: Extracted from lockup avatar/custom URL (C):', { customUrl, name: avatarAlt });
                                return { customUrl, name: avatarAlt, logo: extractAvatarUrl() || '' };
                            }
                        }
                        if (path.startsWith('/user/')) {
                            const slug = path.split('/')[2];
                            if (slug) {
                                const customUrl = `user/${slug}`;
                                console.log('FilterTube: Extracted from lockup avatar/custom URL (USER):', { customUrl, name: avatarAlt });
                                return { customUrl, name: avatarAlt, logo: extractAvatarUrl() || '' };
                            }
                        }
                    }
                    console.log('FilterTube: Extracted channel name from lockup avatar alt:', { name: avatarAlt });

                    // If the lockup provides a channel name but no clickable link, still return the
                    // name (menu can display it; block flow can resolve via videoId).
                    const videoId = extractVideoIdFromCard(card) || ensureVideoIdForCard(card) || '';
                    if (videoId) {
                        return { name: avatarAlt, videoId, needsFetch: true };
                    }
                }

                const metadataLinks = lockupMetadata.querySelectorAll(
                    '.yt-core-attributed-string__link[href*="/@"], ' +
                    '.yt-core-attributed-string__link[href*="/c/"], ' +
                    '.yt-core-attributed-string__link[href*="/user/"], ' +
                    '.yt-content-metadata-view-model__metadata-text a[href*="/@"], ' +
                    '.yt-content-metadata-view-model__metadata-text a[href*="/channel/"], ' +
                    '.yt-content-metadata-view-model__metadata-text a[href*="/c/"], ' +
                    '.yt-content-metadata-view-model__metadata-text a[href*="/user/"]'
                );

                for (const link of metadataLinks) {
                    const href = link.getAttribute('href');
                    const text = link.textContent?.trim();
                    if (!href) continue;

                    // Try @handle first
                    const extracted = extractRawHandle(href);
                    if (extracted) {
                        console.log('FilterTube: Extracted from lockup metadata link:', { handle: extracted, name: text });
                        return { handle: extracted, name: text, logo: extractAvatarUrl() || '' };
                    }

                    // Try UC ID
                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch) {
                        console.log('FilterTube: Extracted from lockup metadata link (UC):', { id: ucMatch[1], name: text });
                        return { id: ucMatch[1], name: text, logo: extractAvatarUrl() || '' };
                    }

                    // Try /c/ or /user/ custom URLs
                    let path = href;
                    try {
                        if (/^https?:\/\//i.test(path)) {
                            path = new URL(path).pathname;
                        }
                    } catch (e) { /* ignore */ }
                    if (!path.startsWith('/')) path = '/' + path;
                    path = path.split(/[?#]/)[0];

                    if (path.startsWith('/c/')) {
                        const slug = path.split('/')[2];
                        if (slug) {
                            const customUrl = `c/${slug}`;
                            console.log('FilterTube: Extracted from lockup metadata link (C):', { customUrl, name: text });
                            return { customUrl, name: text, logo: extractAvatarUrl() || '' };
                        }
                    }
                    if (path.startsWith('/user/')) {
                        const slug = path.split('/')[2];
                        if (slug) {
                            const customUrl = `user/${slug}`;
                            console.log('FilterTube: Extracted from lockup metadata link (USER):', { customUrl, name: text });
                            return { customUrl, name: text, logo: extractAvatarUrl() || '' };
                        }
                    }
                }
            }
        }

        // Additional extraction for rich-grid lockup view models (new YouTube markup)
        const lockup = card.querySelector('.yt-lockup-view-model');
        if (lockup) {
            const dataHandle = lockup.getAttribute('data-filtertube-channel-handle');
            const dataId = lockup.getAttribute('data-filtertube-channel-id');
            const metaHandleLink = lockup.querySelector('.yt-lockup-metadata-view-model__metadata a[href*="/@"]');
            const metaIdLink = lockup.querySelector('.yt-lockup-metadata-view-model__metadata a[href*="/channel/UC"]');

            if (metaIdLink) {
                const href = metaIdLink.getAttribute('href') || '';
                const idMatch = href.match(/\/(UC[\w-]{22})/);
                if (idMatch && idMatch[1]) {
                    const name = metaIdLink.textContent?.trim() || '';
                    console.log('FilterTube: Extracted from lockup meta (UC):', { id: idMatch[1], name });
                    return { id: idMatch[1], name, logo: extractAvatarUrl() || '' };
                }
            }

            if (metaHandleLink) {
                const href = metaHandleLink.getAttribute('href') || '';
                const handle = extractRawHandle(href);
                const name = metaHandleLink.textContent?.trim() || '';
                if (handle) {
                    console.log('FilterTube: Extracted from lockup meta (handle):', { handle, name });
                    return { handle, name, logo: extractAvatarUrl() || '' };
                }
            }

            if (dataHandle || dataId) {
                let name = '';
                const channelLink = lockup.querySelector(
                    '.yt-lockup-metadata-view-model__metadata a[href*="/@"], ' +
                    '.yt-lockup-metadata-view-model__metadata a[href*="/channel/UC"], ' +
                    '.yt-lockup-metadata-view-model__metadata a[href*="/c/"], ' +
                    '.yt-lockup-metadata-view-model__metadata a[href*="/user/"]'
                );
                if (channelLink) {
                    name = channelLink.textContent?.trim() || '';
                }

                if (!name) {
                    const avatarImg = lockup.querySelector('yt-avatar-shape img, img.yt-avatar-shape__image');
                    const avatarAlt = avatarImg?.getAttribute('alt')?.trim() || '';
                    if (avatarAlt && !/go to channel/i.test(avatarAlt)) {
                        name = avatarAlt;
                    }
                }

                // Never treat lockup metadata text (which includes title + view count) as a channel name.
                if (name && name.includes('•')) {
                    name = '';
                }

                console.log('FilterTube: Extracted from lockup data attrs:', { handle: dataHandle, id: dataId, name });
                return { handle: dataHandle || null, id: dataId || null, name, logo: extractAvatarUrl() || '' };
            }
        }

        // Debug: Log card structure to help identify missing selectors
        console.debug('FilterTube: Failed to extract channel. Card type:', card.tagName,
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

    try {
        if (currentSettings?.listMode === 'whitelist') return;
    } catch (e) {
        return;
    }

    const videoCardTagName = (videoCard.tagName || '').toLowerCase();
    const isCommentContextCard = isCommentContextTag(videoCardTagName);

    if (isCommentContextCard) {
        try {
            videoCard.removeAttribute('data-filtertube-video-id');
        } catch (e) {
        }
    } else {
        try {
            const liveVideoId = ensureVideoIdForCard(videoCard) || extractVideoIdFromCard(videoCard) || '';
            if (liveVideoId) {
                resetCardIdentityIfStale(videoCard, liveVideoId);
            }
        } catch (e) {
        }
    }

    // Extract initial channel info (synchronous from DOM)
    let initialChannelInfo = extractChannelFromCard(videoCard);
    if (!initialChannelInfo) {
        initialChannelInfo = {};
    } else if (initialChannelInfo.handle) {
        applyHandleMetadata(initialChannelInfo, initialChannelInfo.handle, { force: true });
    } else if (initialChannelInfo.handleDisplay) {
        applyHandleMetadata(initialChannelInfo, initialChannelInfo.handleDisplay, { force: true });
    }
    // If YouTube recycled this card, ensure stale channel attrs are cleared, then re-extract.
    if (initialChannelInfo && videoCard && !isCommentContextCard) {
        const currentVideoId = extractVideoIdFromCard(videoCard);
        const cachedVideoId = videoCard.getAttribute('data-filtertube-video-id');
        if (currentVideoId && cachedVideoId && currentVideoId !== cachedVideoId) {
            resetCardIdentityIfStale(videoCard, currentVideoId);
            initialChannelInfo = extractChannelFromCard(videoCard) || {};
            if (initialChannelInfo.handle) {
                applyHandleMetadata(initialChannelInfo, initialChannelInfo.handle, { force: true });
            } else if (initialChannelInfo.handleDisplay) {
                applyHandleMetadata(initialChannelInfo, initialChannelInfo.handleDisplay, { force: true });
            }
        }
    }
    if (!isCommentContextCard) {
        // Prefer fresh DOM identifiers over any cached collaborator-derived data
        const domHandleAttr = videoCard.getAttribute('data-filtertube-channel-handle') ||
            videoCard.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
        const domIdAttr = videoCard.getAttribute('data-filtertube-channel-id') ||
            videoCard.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id');
        const domNameAttr = videoCard.getAttribute('data-filtertube-channel-name') ||
            videoCard.querySelector('[data-filtertube-channel-name]')?.getAttribute('data-filtertube-channel-name');
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

        if (domNameAttr && (!initialChannelInfo.name || typeof initialChannelInfo.name !== 'string' || !initialChannelInfo.name.trim())) {
            initialChannelInfo.name = domNameAttr;
        }
    }

    if (!initialChannelInfo || (!initialChannelInfo.handle && !initialChannelInfo.id && !initialChannelInfo.customUrl && !initialChannelInfo.isCollaboration && !initialChannelInfo.needsFetch)) {
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
    if (!isCommentContextCard) {
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
    }

    try {
        const isUcIdLike = (value) => {
            if (!value || typeof value !== 'string') return false;
            return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
        };
        const isHandleLike = (value) => {
            if (!value || typeof value !== 'string') return false;
            return value.trim().startsWith('@');
        };

        const hasVideoId = typeof initialChannelInfo.videoId === 'string' && initialChannelInfo.videoId.trim();
        const nameLooksBad = !initialChannelInfo.name || isUcIdLike(initialChannelInfo.name) || isHandleLike(initialChannelInfo.name);
        // IMPORTANT: Do NOT treat a missing/placeholder name as a reason to do main-world lookup
        // when we already have a stable UC ID. This was causing playlist/Mix items to be overridden
        // by unrelated channels found in ytInitialData deep search.
        // Only require main-world lookup when UC ID is missing.
        // If UC ID is already present, avoid extra lookup churn that can race with
        // recycled DOM nodes and cause identity overrides.
        const missingIdentityBits = !initialChannelInfo.id;

        if (!isCommentContextCard && initialChannelInfo.source !== 'comments' && !initialChannelInfo.isCollaboration && hasVideoId && missingIdentityBits) {
            initialChannelInfo.needsFetch = true;
            initialChannelInfo.fetchStrategy = 'mainworld';
            if (!initialChannelInfo.expectedHandle && initialChannelInfo.handle) {
                initialChannelInfo.expectedHandle = initialChannelInfo.handle;
            }
            if (!initialChannelInfo.expectedChannelName && initialChannelInfo.name && !nameLooksBad) {
                initialChannelInfo.expectedChannelName = initialChannelInfo.name;
            }
        }
    } catch (e) {
    }

    // Kick off collaborator enrichment (non-blocking) so handles/IDs stay accurate regardless of DOM ordering
    let collaboratorEnrichmentPromise = null;
    if (initialChannelInfo.isCollaboration && initialChannelInfo.videoId) {
        collaboratorEnrichmentPromise = enrichCollaboratorsWithMainWorld(initialChannelInfo);
    }

    // Wait for menu to be populated by YouTube (with timeout)
    const waitForMenu = () => {
        return new Promise((resolve) => {
            let settled = false;
            let observer = null;
            let closeObserver = null;
            let timeoutId = null;

            const isDropdownOpen = () => {
                if (!dropdown?.isConnected) return false;
                if (dropdown.getAttribute('aria-hidden') === 'true') return false;
                if (dropdown.hasAttribute('hidden')) return false;

                const style = window.getComputedStyle(dropdown);
                if (style.display === 'none' || style.visibility === 'hidden') return false;

                return true;
            };

            const finalize = (payload) => {
                if (settled) return;
                settled = true;

                if (observer) observer.disconnect();
                if (closeObserver) closeObserver.disconnect();
                if (timeoutId) clearTimeout(timeoutId);

                resolve(payload);
            };

            const checkMenu = () => {
                // Detect menu structure type (new vs old) - COMPREHENSIVE DETECTION
                const newMenuList = dropdown.querySelector('yt-list-view-model');
                const oldMenuList = dropdown.querySelector(
                    'tp-yt-paper-listbox#items, ' +
                    'tp-yt-paper-listbox, ' +
                    'div.menu-content[role="dialog"], ' +
                    'ytm-menu-popup-renderer, ' +
                    'ytm-menu-service-item-renderer, ' +
                    '#items.ytm-menu-popup-renderer, ' +
                    '#items.style-scope.ytm-menu-popup-renderer, ' +
                    'bottom-sheet-container, ' +
                    'ytd-menu-popup-renderer, ' +
                    'ytd-menu-service-item-renderer, ' +
                    '#items.ytd-menu-popup-renderer, ' +
                    '#items.style-scope.ytd-menu-popup-renderer'
                );

                if (newMenuList || oldMenuList) {
                    console.log('FilterTube: Menu detected - newMenuList:', !!newMenuList, 'oldMenuList:', !!oldMenuList);
                    finalize({ newMenuList, oldMenuList, status: 'ready' });
                    return true;
                }
                return false;
            };

            // Try immediately first
            if (checkMenu()) return;

            // Dropdown can close before YouTube populates menu (benign)
            if (!isDropdownOpen()) {
                finalize({ newMenuList: null, oldMenuList: null, status: 'closed' });
                return;
            }

            // If not found, observe for menu to be added
            console.log('FilterTube: Menu not ready, waiting for YouTube to populate...');
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds max wait

            observer = new MutationObserver(() => {
                if (settled) return;
                if (!isDropdownOpen()) {
                    finalize({ newMenuList: null, oldMenuList: null, status: 'closed' });
                    return;
                }

                attempts++;
                if (checkMenu()) {
                    return;
                } else if (attempts >= maxAttempts) {
                    finalize({ newMenuList: null, oldMenuList: null, status: 'timeout' });
                }
            });

            observer.observe(dropdown, { childList: true, subtree: true });

            closeObserver = new MutationObserver(() => {
                if (settled) return;
                if (!isDropdownOpen()) {
                    finalize({ newMenuList: null, oldMenuList: null, status: 'closed' });
                }
            });

            closeObserver.observe(dropdown, { attributes: true, attributeFilter: ['style', 'aria-hidden', 'hidden'] });

            // Also set a timeout as backup
            timeoutId = setTimeout(() => {
                if (settled) return;
                if (checkMenu()) return;
                if (!isDropdownOpen()) {
                    finalize({ newMenuList: null, oldMenuList: null, status: 'closed' });
                    return;
                }
                finalize({ newMenuList: null, oldMenuList: null, status: 'timeout' });
            }, 2000);
        });
    };

    // Wait for menu to be ready
    const { newMenuList, oldMenuList, status } = await waitForMenu();
    if (!newMenuList && !oldMenuList) {
        if (status !== 'closed') {
            await waitForNextFrameDelay(250);
            const retryNew = dropdown.querySelector('yt-list-view-model');
            const retryOld = dropdown.querySelector(
                'tp-yt-paper-listbox#items, ' +
                'tp-yt-paper-listbox, ' +
                'div.menu-content[role="dialog"], ' +
                'ytm-menu-popup-renderer, ' +
                'ytm-menu-service-item-renderer, ' +
                '#items.ytm-menu-popup-renderer, ' +
                '#items.style-scope.ytm-menu-popup-renderer, ' +
                'bottom-sheet-container, ' +
                'ytd-menu-popup-renderer, ' +
                'ytd-menu-service-item-renderer, ' +
                '#items.ytd-menu-popup-renderer, ' +
                '#items.style-scope.ytd-menu-popup-renderer'
            );
            if (retryNew || retryOld) {
                console.log('FilterTube: Menu detected on delayed retry');
                return await injectFilterTubeMenuItem(dropdown, videoCard);
            }
            console.debug('FilterTube: Could not detect menu structure after waiting (soft)');
        }
        return;
    }

    const videoId = isCommentContextCard ? '' : (extractVideoIdFromCard(videoCard) || initialChannelInfo.videoId || '');
    if (videoId && !initialChannelInfo.videoId) {
        initialChannelInfo.videoId = videoId;
    }

    if (videoId && videoCard && !videoCard.getAttribute('data-filtertube-video-id')) {
        try {
            videoCard.setAttribute('data-filtertube-video-id', videoId);
        } catch (e) {
        }
    }

    // Stamp the best synchronous identity we have onto the clicked card immediately.
    // This improves:
    // - menu label fallback (name/id/handle)
    // - mismatch-protection for main-world lookups
    // - watch/shorts surfaces where cards are recycled rapidly
    if (!isCommentContextCard && videoCard && initialChannelInfo) {
        try {
            const safeId = typeof initialChannelInfo.id === 'string' ? initialChannelInfo.id.trim() : '';
            if (safeId && safeId.toUpperCase().startsWith('UC') && !videoCard.getAttribute('data-filtertube-channel-id')) {
                videoCard.setAttribute('data-filtertube-channel-id', safeId);
            }

            const safeHandle = typeof initialChannelInfo.handle === 'string' ? initialChannelInfo.handle.trim() : '';
            if (safeHandle && safeHandle.startsWith('@') && !videoCard.getAttribute('data-filtertube-channel-handle')) {
                videoCard.setAttribute('data-filtertube-channel-handle', safeHandle);
            }

            const safeCustom = typeof initialChannelInfo.customUrl === 'string' ? initialChannelInfo.customUrl.trim() : '';
            if (safeCustom && !videoCard.getAttribute('data-filtertube-channel-custom')) {
                videoCard.setAttribute('data-filtertube-channel-custom', safeCustom);
            }

            const safeName = typeof initialChannelInfo.name === 'string' ? initialChannelInfo.name.trim() : '';
            if (safeName && safeName.toLowerCase() !== 'channel' && !safeName.startsWith('@') && !/^UC[a-zA-Z0-9_-]{22}$/.test(safeName) && !safeName.includes('•')) {
                if (!videoCard.getAttribute('data-filtertube-channel-name')) {
                    videoCard.setAttribute('data-filtertube-channel-name', safeName);
                }
            }
        } catch (e) {
        }
    }

    if (!initialChannelInfo.isCollaboration && videoId) {
        const cachedResolved = resolvedCollaboratorsByVideoId.get(videoId);
        const hasCollabDomSignal = (() => {
            try {
                if (!videoCard) return false;
                if (videoCard.querySelector('yt-avatar-stack-view-model, #attributed-channel-name')) return true;
                const rowText = (videoCard.querySelector('.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row')?.textContent || '').toLowerCase();
                return /\d+\s+more/.test(rowText) || /\s(and|&)\s/.test(rowText);
            } catch (e) {
                return false;
            }
        })();
        if (hasCollabDomSignal && Array.isArray(cachedResolved) && cachedResolved.length >= 2) {
            initialChannelInfo = {
                ...initialChannelInfo,
                ...cachedResolved[0],
                isCollaboration: true,
                allCollaborators: cachedResolved,
                needsEnrichment: false,
                expectedCollaboratorCount: Math.max(
                    parseInt(videoCard?.getAttribute?.('data-filtertube-expected-collaborators') || '0', 10) || 0,
                    cachedResolved.length
                )
            };
        }
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
        // Collaboration cards should NEVER fall back to single-channel fetch paths.
        if (initialChannelInfo.isCollaboration) {
            let finalInfo = { ...initialChannelInfo };
            if (collaboratorEnrichmentPromise) {
                try {
                    const collabs = await collaboratorEnrichmentPromise;
                    const sanitized = sanitizeCollaboratorList(collabs);
                    if (Array.isArray(sanitized) && sanitized.length > 0) {
                        finalInfo = {
                            ...finalInfo,
                            allCollaborators: sanitized,
                            needsEnrichment: false,
                            expectedCollaboratorCount: Math.max(
                                finalInfo.expectedCollaboratorCount || 0,
                                sanitized.length
                            )
                        };
                        if (videoId) {
                            resolvedCollaboratorsByVideoId.set(videoId, sanitized);
                        }
                    }
                } catch (err) {
                    console.warn('FilterTube: Collaborator enrichment promise failed (collab background path):', err);
                }
            }
            return finalInfo;
        }

        let finalChannelInfo = initialChannelInfo;

        const videoCardStampedId = (() => {
            try {
                return (videoCard?.getAttribute?.('data-filtertube-channel-id') || '').trim();
            } catch (e) {
                return '';
            }
        })();

        const videoCardStampedHandle = (() => {
            try {
                return (videoCard?.getAttribute?.('data-filtertube-channel-handle') || '').trim();
            } catch (e) {
                return '';
            }
        })();

        // For shorts, fetch channel info from shorts URL
        if (initialChannelInfo.needsFetch && initialChannelInfo.videoId) {
            // During menu hover/open we must avoid network fetches (these can trigger
            // google.com/sorry throttling). Prefer main-world ytInitialData only.
            const fetchStrategy = initialChannelInfo.fetchStrategy || 'mainworld';

            if (fetchStrategy === 'mainworld') {
                console.log('FilterTube: Background fetch - main-world channel info for:', initialChannelInfo.videoId);
                const fetchedInfo = await searchYtInitialDataForVideoChannel(initialChannelInfo.videoId, {
                    expectedHandle: initialChannelInfo.expectedHandle || null,
                    expectedName: initialChannelInfo.expectedChannelName || null
                });
                if (fetchedInfo) {
                    const fetchedId = (fetchedInfo.id || '').trim();
                    const fetchedHandle = (fetchedInfo.handle || '').trim();

                    // Defensive: if the card is already stamped with a UC ID/handle, and the main-world
                    // lookup returns a DIFFERENT identity, ignore the fetched result.
                    // This prevents playlist panels and Mix cards from inheriting the previous video's channel
                    // due to ytInitialData deep-search mismatches.
                    if (videoCardStampedId && fetchedId && videoCardStampedId !== fetchedId) {
                        console.warn('FilterTube: Ignoring main-world channel mismatch (card UCID vs fetched UCID):', {
                            videoId: initialChannelInfo.videoId,
                            cardId: videoCardStampedId,
                            fetchedId
                        });
                    } else if (videoCardStampedHandle && fetchedHandle && videoCardStampedHandle.toLowerCase() !== fetchedHandle.toLowerCase()) {
                        console.warn('FilterTube: Ignoring main-world channel mismatch (card handle vs fetched handle):', {
                            videoId: initialChannelInfo.videoId,
                            cardHandle: videoCardStampedHandle,
                            fetchedHandle
                        });
                    } else {
                        finalChannelInfo = {
                            ...initialChannelInfo,
                            ...fetchedInfo,
                            videoId: initialChannelInfo.videoId
                        };
                        console.log('FilterTube: Background fetch complete - main-world channel:', fetchedInfo);
                    }
                } else {
                    console.warn('FilterTube: Background fetch failed for main-world lookup');
                }
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

    fetchPromise
        .then(async (finalChannelInfo) => {
            if (!finalChannelInfo || pendingDropdownFetches.get(dropdown)?.cancelled) return;

            const isHandleLike = (value) => {
                if (!value || typeof value !== 'string') return false;
                return value.trim().startsWith('@');
            };

            const isUcIdLike = (value) => {
                if (!value || typeof value !== 'string') return false;
                return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
            };

            const isProbablyNotChannelName = (value) => {
                if (!value || typeof value !== 'string') return true;
                const trimmed = value.trim();
                if (!trimmed) return true;
                if (trimmed.includes('•')) return true;
                if (/\bviews?\b/i.test(trimmed)) return true;
                if (/\bago\b/i.test(trimmed)) return true;
                if (/\bwatching\b/i.test(trimmed)) return true;
                if (isUcIdLike(trimmed)) return true;
                const lower = trimmed.toLowerCase();
                if (lower === 'channel') return true;
                if (lower.startsWith('mix')) return true;
                if (lower.includes('mix') && trimmed.includes('–')) return true;
                return false;
            };

            let enrichedInfo = finalChannelInfo;
            const needsNameEnrichment = !enrichedInfo?.name || isHandleLike(enrichedInfo.name) || isProbablyNotChannelName(enrichedInfo.name);
            const lookup = enrichedInfo?.id || enrichedInfo?.handle || null;

            if (needsNameEnrichment && enrichedInfo?.videoId) {
                try {
                    const ytInfo = await searchYtInitialDataForVideoChannel(enrichedInfo.videoId, {
                        expectedHandle: enrichedInfo.expectedHandle || null,
                        expectedName: enrichedInfo.expectedChannelName || null
                    });
                    if (ytInfo) {
                        enrichedInfo = {
                            ...enrichedInfo,
                            ...ytInfo,
                            videoId: enrichedInfo.videoId
                        };
                    }
                } catch (e) {
                }
            }

            const stillNeedsNameEnrichment = !enrichedInfo?.name || isHandleLike(enrichedInfo.name) || isProbablyNotChannelName(enrichedInfo.name);

            if (stillNeedsNameEnrichment && lookup && !enrichedInfo?.videoId) {
                try {
                    const details = await browserAPI_BRIDGE.runtime.sendMessage({
                        action: 'fetchChannelDetails',
                        channelIdOrHandle: lookup
                    });
                    if (details && details.success) {
                        enrichedInfo = { ...enrichedInfo, ...details };
                    }
                } catch (e) {
                }
            }

            if (!enrichedInfo || pendingDropdownFetches.get(dropdown)?.cancelled) return;
            updateInjectedMenuChannelName(dropdown, enrichedInfo);

            try {
                if (videoCard && enrichedInfo) {
                    const safeName = typeof enrichedInfo.name === 'string' ? enrichedInfo.name.trim() : '';
                    if (safeName && !isHandleLike(safeName) && !isProbablyNotChannelName(safeName)) {
                        if (!videoCard.getAttribute('data-filtertube-channel-name')) {
                            videoCard.setAttribute('data-filtertube-channel-name', safeName);
                        }
                    }
                    const safeId = typeof enrichedInfo.id === 'string' ? enrichedInfo.id.trim() : '';
                    if (safeId && safeId.toUpperCase().startsWith('UC') && !videoCard.getAttribute('data-filtertube-channel-id')) {
                        videoCard.setAttribute('data-filtertube-channel-id', safeId);
                    }
                    const safeHandle = typeof enrichedInfo.handle === 'string' ? enrichedInfo.handle.trim() : '';
                    if (safeHandle && safeHandle.startsWith('@') && !videoCard.getAttribute('data-filtertube-channel-handle')) {
                        videoCard.setAttribute('data-filtertube-channel-handle', safeHandle);
                    }
                }
            } catch (e) {
            }
        })
        .catch(() => {
        });

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

    try {
        const cardTag = String(videoCard?.tagName || '').toLowerCase();
        const isCommentContext = Boolean(
            channelInfo?.source === 'comments'
            || isCommentContextTag(cardTag)
            || videoCard?.closest?.('#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"]')
        );
        if (isCommentContext) {
            menuItem.setAttribute('data-filtertube-context', 'comment');
        } else {
            menuItem.removeAttribute('data-filtertube-context');
        }
    } catch (e) {
    }

    if (injectionOptions?.disabled) {
        menuItem.setAttribute('data-filtertube-disabled', 'true');
        menuItem.setAttribute('aria-disabled', 'true');
        menuItem.style.opacity = '0.6';
        menuItem.style.pointerEvents = 'none';
        return;
    }

    const handleInteraction = async (event) => {
        if (menuItem.getAttribute('data-filtertube-disabled') === 'true') {
            return;
        }

        const isToggleTarget = toggle && (toggle === event.target || toggle.contains(event.target));
        if (isToggleTarget) {
            // Do NOT intercept toggle clicks. This handler is registered in capture phase,
            // so calling stopPropagation here would prevent the toggle's own click handler.
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (toggle) {
            toggle.blur();
        }

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
    const channelName = escapeHtml(pickMenuChannelDisplayName(channelInfo, injectionOptions));

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
    const menuList = menuContainer.querySelector('tp-yt-paper-listbox#items') || menuContainer.querySelector('tp-yt-paper-listbox') || (menuContainer.matches?.('bottom-sheet-container') ? menuContainer.querySelector('bottom-sheet-layout') : menuContainer);
    const isMobileMenu = Boolean(menuList.closest?.('ytm-menu-popup-renderer')) ||
        Boolean(menuList.closest?.('ytm-app')) ||
        Boolean(menuContainer?.matches?.('ytm-menu-popup-renderer')) ||
        Boolean(menuContainer?.matches?.('bottom-sheet-container')) ||
        Boolean(menuContainer?.matches?.('div.menu-content[role="dialog"]')) ||
        Boolean(menuContainer?.querySelector?.('ytm-menu-service-item-renderer'));
    const rendererTag = isMobileMenu ? 'ytm-menu-service-item-renderer' : 'ytd-menu-service-item-renderer';
    const rendererScope = isMobileMenu ? 'ytm-menu-popup-renderer' : 'ytd-menu-popup-renderer';
    const itemScope = isMobileMenu ? 'ytm-menu-service-item-renderer' : 'ytd-menu-service-item-renderer';

    // Inline SVG for FilterTube logo (user-provided SVG)
    const filterTubeSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128" style="display: block;">
        <path fill="#FF3333" d="M53.004837,77.261787 C55.004650,68.586563 48.961483,63.525127 45.151901,57.831970 C36.636456,45.106262 27.572891,32.747910 18.776752,20.208942 C17.048302,17.745022 18.246574,14.746576 21.199722,14.076863 C22.310389,13.824986 23.520674,14.001245 24.685543,14.001154 C51.482349,13.999036 78.279152,13.997606 105.075958,14.002748 C107.511017,14.003215 110.410080,13.422483 111.785439,15.933891 C113.178085,18.476864 111.026321,20.660681 109.690315,22.593620 C99.594292,37.200588 89.433075,51.763405 79.158081,66.244827 C77.520378,68.552994 76.925735,70.848900 76.965294,73.583061 C77.066391,80.572067 76.851021,87.568138 77.069214,94.551788 C77.160759,97.481934 76.221825,99.467453 74.122963,101.447235 C69.040611,106.241264 64.241066,111.333801 59.229191,116.204849 C58.138329,117.265060 57.330574,119.514366 55.379189,118.670372 C53.447678,117.834984 52.933788,115.906029 52.954082,113.675346 C53.063110,101.692680 53.005142,89.708488 53.004837,77.261787 z"/>
        <path fill="#FF0000" d="M63.316730,58.295921 C61.783310,59.317360 60.616657,60.253048 59.307014,60.898705 C55.871113,62.592613 54.045387,61.557888 54.023708,57.807045 C53.960236,46.824589 53.943741,35.841064 54.033154,24.858967 C54.064426,21.018126 56.738575,19.503649 60.024136,21.659582 C67.653084,26.665573 75.198029,31.814018 82.579330,37.176819 C86.212624,39.816536 85.950592,42.679234 82.150856,45.360466 C76.029831,49.679680 69.801399,53.846684 63.316730,58.295921 z"/>
    </svg>`;


    // Ensure styles are injected
    ensureFilterTubeMenuStyles();

    // Build channel display name
    const channelName = escapeHtml(pickMenuChannelDisplayName(channelInfo, injectionOptions));

    // Create FilterTube menu item (OLD structure)
    const filterTubeItem = document.createElement(rendererTag);
    filterTubeItem.className = `style-scope ${rendererScope} filtertube-block-channel-item`;
    filterTubeItem.setAttribute('system-icons', '');
    filterTubeItem.setAttribute('role', 'menuitem');
    filterTubeItem.setAttribute('use-icons', '');
    filterTubeItem.setAttribute('tabindex', '-1');

    filterTubeItem.innerHTML = `
        <tp-yt-paper-item class="style-scope ${itemScope} filtertube-menu-item" style-target="host" role="option" tabindex="0" aria-disabled="false">
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
        // Get current filtered channels + channelMap from storage
        const result = await browserAPI_BRIDGE.storage.local.get(['filterChannels', 'channelMap']);
        const channels = Array.isArray(result.filterChannels) ? result.filterChannels : [];
        const channelMap = result.channelMap || currentSettings?.channelMap || {};
        const identity = window.FilterTubeIdentity;
        const storedEntry = findStoredChannelEntry(channelInfo) ||
            channels.find(ch => {
                if (!ch) return false;
                if (identity && typeof identity.channelMatchesFilter === 'function') {
                    return identity.channelMatchesFilter(channelInfo, ch, channelMap);
                }
                const chHandle = ch.handle?.toLowerCase();
                const chId = ch.id?.toLowerCase();
                const inputHandle = normalizeHandleValue(channelInfo.handle || '').toLowerCase();
                const inputId = (channelInfo.id || '').toLowerCase();
                return (inputHandle && chHandle === inputHandle) || (inputId && chId === inputId);
            });

        // Check if this channel is already in the list (by handle or ID)
        const isBlocked = identity && typeof identity.isChannelBlocked === 'function'
            ? identity.isChannelBlocked(channels, channelInfo, channelMap)
            : (() => {
                const normalizedHandle = normalizeHandleValue(channelInfo.handle || '');
                const input = normalizedHandle || channelInfo.id || '';
                return input
                    ? channels.some(channel => {
                        // Match by handle (case-insensitive) or by ID
                        if (input.startsWith('@')) {
                            return channel.handle && channel.handle.toLowerCase() === input.toLowerCase();
                        } else {
                            return channel.id === input;
                        }
                    })
                    : false;
            })();

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
    if (channelInfo.customUrl) {
        element.setAttribute('data-filtertube-blocked-channel-custom', channelInfo.customUrl);
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
    element.removeAttribute('data-filtertube-blocked-channel-custom');
    element.removeAttribute('data-filtertube-blocked-channel-name');
    element.removeAttribute('data-filtertube-blocked-state');
    element.removeAttribute('data-filtertube-blocked-ts');
}

const COMMENT_CONTEXT_TAGS = new Set([
    'ytd-comment-thread-renderer',
    'ytm-comment-thread-renderer',
    'ytd-comment-renderer',
    'ytm-comment-renderer',
    'ytd-comment-view-model',
    'ytm-comment-view-model'
]);

function isCommentContextTag(tagName) {
    return COMMENT_CONTEXT_TAGS.has(String(tagName || '').toLowerCase());
}

function resolveCommentHideTarget(node) {
    if (!node || !(node instanceof Element)) return node;
    return node.closest('ytd-comment-thread-renderer, ytm-comment-thread-renderer')
        || node.closest('ytd-comment-view-model, ytm-comment-view-model, ytd-comment-renderer, ytm-comment-renderer')
        || node;
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
        const tag = (element.tagName || '').toLowerCase();
        const meta = {
            id: element.getAttribute('data-filtertube-blocked-channel-id') || '',
            handle: element.getAttribute('data-filtertube-blocked-channel-handle') || '',
            name: element.getAttribute('data-filtertube-blocked-channel-name') || ''
        };

        if (filterChannels.length > 0 && isStillBlocked(meta)) {
            markElementAsBlocked(element, meta, 'confirmed');
            if (isCommentContextTag(tag)) {
                toggleVisibility(element, true, `Blocked comment author: ${meta.handle || meta.id}`);
            } else {
                toggleVisibility(element, true, `Blocked channel: ${meta.handle || meta.id}`);
            }
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

    const explicitMenuContext = String(menuItem?.getAttribute?.('data-filtertube-context') || '').toLowerCase();
    const videoCardTag = String(videoCard?.tagName || '').toLowerCase();
    const isCommentContextBlock = Boolean(
        explicitMenuContext === 'comment'
        || channelInfo?.source === 'comments'
        || isCommentContextTag(videoCardTag)
    );

    const clickSnapshot = (() => {
        const snapshot = {
            videoId: (typeof channelInfo?.videoId === 'string' ? channelInfo.videoId.trim() : ''),
            cardVideoId: '',
            cardCustomUrl: '',
            cardRef: videoCard
        };
        try {
            if (videoCard && typeof videoCard.getAttribute === 'function') {
                snapshot.cardCustomUrl = videoCard.getAttribute('data-filtertube-channel-custom') || '';
            }
        } catch (e) {
        }
        try {
            if (videoCard && typeof extractVideoIdFromCard === 'function') {
                snapshot.cardVideoId = extractVideoIdFromCard(videoCard) || '';
            }
        } catch (e) {
        }
        if (!snapshot.videoId && snapshot.cardVideoId) snapshot.videoId = snapshot.cardVideoId;
        return snapshot;
    })();

    try {
        if (!isCommentContextBlock && clickSnapshot?.videoId && clickSnapshot.videoId !== (channelInfo?.videoId || '')) {
            channelInfo = { ...(channelInfo || {}), videoId: clickSnapshot.videoId };
        }
    } catch (e) {
    }

    if (isCommentContextBlock) {
        try {
            channelInfo = { ...(channelInfo || {}), videoId: '' };
        } catch (e) {
        }
    }

    let blockPersisted = false;

    const optimisticHideState = [];
    let didOptimisticHide = false;
    const recordOptimisticHide = (element, meta) => {
        if (!element || optimisticHideState.some(item => item?.element === element)) return;
        optimisticHideState.push({
            element,
            prevDisplay: element.style.display,
            prevHiddenAttr: element.getAttribute('data-filtertube-hidden'),
            prevHadHiddenClass: element.classList.contains('filtertube-hidden'),
            prevBlocked: {
                id: element.getAttribute('data-filtertube-blocked-channel-id'),
                handle: element.getAttribute('data-filtertube-blocked-channel-handle'),
                custom: element.getAttribute('data-filtertube-blocked-channel-custom'),
                name: element.getAttribute('data-filtertube-blocked-channel-name'),
                state: element.getAttribute('data-filtertube-blocked-state'),
                ts: element.getAttribute('data-filtertube-blocked-ts')
            }
        });
        markElementAsBlocked(element, meta, 'pending');
        element.style.display = 'none';
        element.classList.add('filtertube-hidden');
        element.setAttribute('data-filtertube-hidden', 'true');
    };

    const restoreOptimisticHide = () => {
        if (optimisticHideState.length === 0) return;
        for (const item of optimisticHideState) {
            const element = item?.element;
            if (!element) continue;
            try {
                element.style.display = item.prevDisplay || '';
                if (!item.prevHadHiddenClass) {
                    element.classList.remove('filtertube-hidden');
                }
                if (item.prevHiddenAttr == null) {
                    element.removeAttribute('data-filtertube-hidden');
                } else {
                    element.setAttribute('data-filtertube-hidden', item.prevHiddenAttr);
                }

                const prev = item.prevBlocked || {};
                const restoreAttr = (name, value) => {
                    if (value == null) element.removeAttribute(name);
                    else element.setAttribute(name, value);
                };
                restoreAttr('data-filtertube-blocked-channel-id', prev.id);
                restoreAttr('data-filtertube-blocked-channel-handle', prev.handle);
                restoreAttr('data-filtertube-blocked-channel-custom', prev.custom);
                restoreAttr('data-filtertube-blocked-channel-name', prev.name);
                restoreAttr('data-filtertube-blocked-state', prev.state);
                restoreAttr('data-filtertube-blocked-ts', prev.ts);

                filteringTracker?.recordRestore?.(element);
            } catch (e) {
            }
        }
        optimisticHideState.length = 0;
    };

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

    try {
        const isUcIdLike = (value) => {
            if (!value || typeof value !== 'string') return false;
            return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
        };

        const isHandleLike = (value) => {
            if (!value || typeof value !== 'string') return false;
            return value.trim().startsWith('@');
        };

        const isProbablyNotChannelName = (value) => {
            if (!value || typeof value !== 'string') return true;
            const trimmed = value.trim();
            if (!trimmed) return true;
            if (isUcIdLike(trimmed)) return true;
            if (isHandleLike(trimmed)) return true;
            if (trimmed.toLowerCase() === 'channel') return true;
            if (trimmed.includes('•')) return true;
            if (/\bviews?\b/i.test(trimmed)) return true;
            if (/\bago\b/i.test(trimmed)) return true;
            if (/\bwatching\b/i.test(trimmed)) return true;
            return false;
        };

        const hasStableCardChannelId = Boolean(
            channelInfo?.id &&
            typeof channelInfo.id === 'string' &&
            /^UC[a-zA-Z0-9_-]{22}$/.test(channelInfo.id.trim())
        );
        const needsStructuredLookup = Boolean(
            !isCommentContextBlock &&
            channelInfo?.videoId && (
                !hasStableCardChannelId &&
                (
                    !channelInfo?.id ||
                    !channelInfo?.handle ||
                    !channelInfo?.name ||
                    isProbablyNotChannelName(channelInfo.name)
                )
            )
        );

        if (needsStructuredLookup) {
            const ytInfo = await searchYtInitialDataForVideoChannel(channelInfo.videoId, {
                expectedHandle: requestedHandle || channelInfo.expectedHandle || null,
                expectedName: channelInfo.expectedChannelName || null
            });
            if (ytInfo) {
                channelInfo = { ...channelInfo, ...ytInfo, videoId: channelInfo.videoId };
                if (channelInfo?.handle) {
                    applyHandleMetadata(channelInfo, channelInfo.handle, { force: true });
                    requestedHandle = normalizeHandleValue(channelInfo.handle) || requestedHandle;
                    if (!requestedHandleForNetwork) {
                        requestedHandleForNetwork = extractRawHandle(channelInfo.handle) || '';
                    }
                }
            }
        }
    } catch (e) {
    }

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
                    const identifier = collaborator.handle || collaborator.id || collaborator.customUrl || collaborator.name;
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
                        .map(c => c.handle || c.id || c.customUrl || c.name);

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
                let input = collaborator.handle || collaborator.id || collaborator.customUrl;

                if (!input && collaborator.name) {
                    const guessedHandle = `@${collaborator.name.toLowerCase().replace(/\s+/g, '')}`;
                    console.log(`FilterTube: No handle/id for "${collaborator.name}", trying guessed handle: ${guessedHandle}`);
                    input = guessedHandle;
                }

                if (input) {
                    const otherChannels = channelInfo.allCollaborators
                        .filter((_, idx) => idx !== i)
                        .map(c => c.handle || c.id || c.customUrl || c.name);
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

            if (successCount === 0) {
                menuItem.style.pointerEvents = 'auto';
                return;
            }
        }

        // Hide ALL instances of this video card immediately
        if (videoCard) {
            console.log('FilterTube: Hiding video card immediately (Block All Collaborators)');

            // Immediate UX hide should only target the clicked card container.
            // Hiding all same-video instances here can over-hide recycled playlist/home/search cards.
            let cardsToHide = [];
            let fallbackTarget = videoCard;
            const tagName = (videoCard.tagName || '').toLowerCase();
            if (tagName.includes('lockup-view-model')) {
                const parentContainer = videoCard.closest('ytd-rich-item-renderer');
                if (parentContainer) {
                    fallbackTarget = parentContainer;
                }
            }
            cardsToHide = [fallbackTarget];
            console.log('FilterTube: Immediate hide target count:', cardsToHide.length);

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
                forceCloseDropdown(dropdown);
            }, 50);
        }

        return;
    }

    // Get the dropdown to check for pending fetches
    const dropdown = menuItem.closest('tp-yt-iron-dropdown, ytm-menu-popup-renderer, ytd-menu-popup-renderer, div.menu-content[role="dialog"]');

    // Check if there's a background fetch in progress with complete channel info
    const fetchData = dropdown ? pendingDropdownFetches.get(dropdown) : null;
    if (!isCommentContextBlock && fetchData?.collaboratorPromise) {
        try {
            await fetchData.collaboratorPromise;
        } catch (error) {
            console.warn('FilterTube: Collaborator enrichment failed, continuing with DOM data:', error);
        }
    }
    if (!isCommentContextBlock && fetchData && !fetchData.cancelled && fetchData.channelInfoPromise) {
        console.log('FilterTube: Waiting for background fetch to complete...');
        try {
            // Wait for the background fetch to complete (likely already done by now)
            const fetchedChannelInfo = await fetchData.channelInfoPromise;
            if (fetchedChannelInfo && (fetchedChannelInfo.id || fetchedChannelInfo.handle)) {
                console.log('FilterTube: Using pre-fetched channel info:', fetchedChannelInfo);

                const isUcIdLike = (value) => {
                    if (!value || typeof value !== 'string') return false;
                    return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
                };

                const isProbablyNotChannelName = (value) => {
                    if (!value || typeof value !== 'string') return true;
                    const trimmed = value.trim();
                    if (!trimmed) return true;
                    if (isUcIdLike(trimmed)) return true;
                    if (trimmed.includes('•')) return true;
                    if (/\bviews?\b/i.test(trimmed)) return true;
                    if (/\bago\b/i.test(trimmed)) return true;
                    if (/\bwatching\b/i.test(trimmed)) return true;
                    return false;
                };

                const clickedKey = (menuItem.getAttribute('data-collab-key') || '').trim().toLowerCase();
                const clickedVideoCardId = (() => {
                    try {
                        return (videoCard?.getAttribute?.('data-filtertube-channel-id') || '').trim();
                    } catch (e) {
                        return '';
                    }
                })();
                const preserveIdentity = (incoming) => {
                    if (!incoming || typeof incoming !== 'object') return;
                    const { id, handle, name, customUrl, canonicalHandle, handleDisplay, ...rest } = incoming;
                    channelInfo = { ...rest, ...channelInfo };
                };
                let canApplyFetchedIdentity = false;

                if (
                    clickedKey &&
                    Array.isArray(fetchedChannelInfo.allCollaborators) &&
                    fetchedChannelInfo.allCollaborators.length > 0
                ) {
                    const matchedCollaborator = fetchedChannelInfo.allCollaborators.find(c => getCollaboratorKey(c) === clickedKey) ||
                        fetchedChannelInfo.allCollaborators.find(c => {
                            if (!c) return false;
                            const cId = (c.id || '').trim();
                            if (channelInfo?.id && cId && channelInfo.id === cId) return true;
                            const cHandle = normalizeHandleValue(c.handle || '') || '';
                            if (requestedHandle && cHandle && requestedHandle === cHandle) return true;
                            if (channelInfo?.handle) {
                                const clickedHandleNorm = normalizeHandleValue(channelInfo.handle) || '';
                                if (clickedHandleNorm && cHandle && clickedHandleNorm === cHandle) return true;
                            }
                            return false;
                        });

                    if (matchedCollaborator) {
                        channelInfo = { ...fetchedChannelInfo, ...channelInfo, ...matchedCollaborator };
                        canApplyFetchedIdentity = true;
                    } else {
                        preserveIdentity(fetchedChannelInfo);
                    }
                } else {
                    const fetchedId = (fetchedChannelInfo.id || '').trim();
                    const clickedId = (channelInfo?.id || '').trim();
                    const fetchedHandle = normalizeHandleValue(fetchedChannelInfo.handle || '') || '';
                    const clickedHandle = normalizeHandleValue(channelInfo?.handle || '') || '';
                    const sameIdentity = (clickedId && fetchedId && clickedId === fetchedId) ||
                        (clickedHandle && fetchedHandle && clickedHandle === fetchedHandle);
                    const stampedMismatch = Boolean(
                        clickedVideoCardId &&
                        fetchedId &&
                        clickedVideoCardId !== fetchedId
                    );
                    const clickedHasStrongIdentity = Boolean(clickedId || clickedHandle || clickedVideoCardId);

                    if (!stampedMismatch && (sameIdentity || !clickedHasStrongIdentity)) {
                        channelInfo = { ...fetchedChannelInfo, ...channelInfo };
                        canApplyFetchedIdentity = true;
                    } else {
                        preserveIdentity(fetchedChannelInfo);
                    }
                }

                if (canApplyFetchedIdentity && (!channelInfo?.name || isProbablyNotChannelName(channelInfo.name)) && fetchedChannelInfo?.name && !isProbablyNotChannelName(fetchedChannelInfo.name)) {
                    channelInfo.name = fetchedChannelInfo.name;
                }
                if (canApplyFetchedIdentity && (!channelInfo?.handle || !String(channelInfo.handle).trim().startsWith('@')) && fetchedChannelInfo?.handle) {
                    channelInfo.handle = fetchedChannelInfo.handle;
                }
                if (canApplyFetchedIdentity && !channelInfo?.customUrl && fetchedChannelInfo?.customUrl) {
                    channelInfo.customUrl = fetchedChannelInfo.customUrl;
                }
                if (canApplyFetchedIdentity && (!channelInfo?.logo || !String(channelInfo.logo).trim()) && fetchedChannelInfo?.logo) {
                    channelInfo.logo = fetchedChannelInfo.logo;
                }

                // Ensure canonicalHandle/handleDisplay do not leak from the primary card channel
                // when blocking a collaborator. These fields influence what Background persists.
                if (channelInfo?.handle) {
                    applyHandleMetadata(channelInfo, channelInfo.handle, { force: true });
                }
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
        const expectedHandle = requestedHandle || channelInfo?.expectedHandle || null;
        const expectedName = channelInfo?.expectedChannelName || channelInfo?.name || null;

        try {
            const name = typeof channelInfo?.name === 'string' ? channelInfo.name.trim() : '';
            const expected = typeof channelInfo?.expectedChannelName === 'string' ? channelInfo.expectedChannelName.trim() : '';
            const nameLooksBad = (!name) || name.toLowerCase() === 'channel' || name.includes('•') || name.startsWith('@') || /^UC[a-zA-Z0-9_-]{22}$/.test(name);
            const expectedLooksOk = expected && expected.toLowerCase() !== 'channel' && !expected.includes('•') && !expected.startsWith('@') && !/^UC[a-zA-Z0-9_-]{22}$/.test(expected);
            if (nameLooksBad && expectedLooksOk) {
                channelInfo.name = expected;
            }
        } catch (e) {
        }

        // Identity integrity: ensure canonicalHandle/handleDisplay align with the handle we intend
        // to persist (especially important for collaborator rows, where prefetch data can carry
        // the primary card channel's canonical handle).
        if (requestedHandle) {
            applyHandleMetadata(channelInfo, requestedHandle, { force: true });
        } else if (channelInfo?.handle) {
            applyHandleMetadata(channelInfo, channelInfo.handle, { force: true });
        }

        // Preserve custom URL identity if that's all we have.
        // IMPORTANT: Use a click-time snapshot instead of reading from a possibly-recycled DOM node.
        if (!channelInfo.customUrl) {
            const attrCustom = clickSnapshot?.cardCustomUrl;
            if (attrCustom) channelInfo.customUrl = attrCustom;
        }

        let input = channelInfo.id || channelInfo.customUrl || requestedHandleForNetwork || channelInfo.handle;

        if (!input && channelInfo?.name) {
            const collabKey = (menuItem.getAttribute('data-collab-key') || '').trim();
            const collabGroup = (menuItem.getAttribute('data-collaboration-group-id') || '').trim();
            if (collabKey || collabGroup) {
                const guessedHandle = `@${String(channelInfo.name).trim().toLowerCase().replace(/\s+/g, '')}`;
                const normalizedGuess = normalizeHandleValue(guessedHandle);
                if (normalizedGuess) {
                    channelInfo.handle = normalizedGuess;
                    requestedHandle = requestedHandle || normalizedGuess;
                    requestedHandleForNetwork = requestedHandleForNetwork || normalizedGuess;
                    applyHandleMetadata(channelInfo, normalizedGuess, { force: true });
                    input = normalizedGuess;
                }
            }
        }

        // Get collaboration metadata from menu item attribute
        const collaborationWithAttr = menuItem.getAttribute('data-collaboration-with');
        const collaborationWith = collaborationWithAttr ? JSON.parse(collaborationWithAttr) : null;

        if (videoCard && menuItem.getAttribute('data-multi-step') !== 'true') {
            try {
                if (isCommentContextBlock) {
                    const commentTarget = resolveCommentHideTarget(videoCard);
                    if (commentTarget) {
                        recordOptimisticHide(commentTarget, channelInfo);
                    }
                    didOptimisticHide = true;
                } else {
                    const isShorts = videoCard.tagName.toLowerCase().includes('shorts-lockup-view-model') ||
                        videoCard.tagName.toLowerCase().includes('reel');
                    let containerToHide = videoCard;
                    if (isShorts) {
                        let parentContainer = videoCard.closest('ytd-rich-item-renderer');
                        if (!parentContainer) {
                            parentContainer = videoCard.closest('.ytGridShelfViewModelGridShelfItem');
                        }
                        if (parentContainer) {
                            containerToHide = parentContainer;
                        }
                    } else {
                        const isHomeLockup = videoCard.tagName.toLowerCase().includes('lockup-view-model');
                        if (isHomeLockup) {
                            const parentContainer = videoCard.closest('ytd-rich-item-renderer');
                            if (parentContainer) {
                                containerToHide = parentContainer;
                            }
                        }
                    }

                    recordOptimisticHide(containerToHide, channelInfo);
                    didOptimisticHide = true;

                    if (!isShorts) {
                        // Intentionally do not hide duplicate same-video cards in optimistic phase.
                        // Filter pass will hide true matches without causing transient over-hide/flicker.
                    }
                }
            } catch (e) {
            }
        }

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

        let result;
        if (typeof input === 'string' && input.trim()) {
            result = await addChannelDirectly(
                input,
                filterAll,
                collaborationWith,
                menuItem.getAttribute('data-collaboration-group-id'),
                buildChannelMetadataPayload(channelInfo)
            );
        } else {
            result = { success: false, error: 'No channel identifier available' };
        }
        let handleResolutionFailed404 = false;

        const initialWas404 = !result.success && /Failed to fetch channel page: 404/i.test(result.error || '');

        // If the background could not fetch the channel page (e.g., /@handle/about returns 404),
        // try to recover using ytInitialData for this video, then fall back to the Shorts URL helper.
        if (!isCommentContextBlock && !result.success && channelInfo.videoId && (
            initialWas404 ||
            /No channel identifier/i.test(result.error || '') ||
            !input
        )) {
            console.warn('FilterTube: Initial block failed. Attempting ytInitialData + shorts fallback for', channelInfo.videoId, 'error:', result.error);

            // 1) Try resolving the channel directly from ytInitialData (search/watch responses)
            try {
                const ytChannel = await searchYtInitialDataForVideoChannel(channelInfo.videoId, {
                    expectedHandle,
                    expectedName
                });
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
                        const cacheTarget = (() => {
                            const candidate = videoCard;
                            if (candidate && clickSnapshot?.videoId) {
                                try {
                                    const candidateVideoId = extractVideoIdFromCard(candidate) || '';
                                    if (candidateVideoId && candidateVideoId !== clickSnapshot.videoId) {
                                        return null;
                                    }
                                } catch (e) {
                                }
                            }
                            return candidate || document.querySelector(`ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]`)?.closest('[data-filtertube-channel-handle],[data-filtertube-channel-id]');
                        })();
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

            // 2) Network fallback: fetch the /watch?v=ID page directly (works for all video types including /c/ channels)
            if (!result.success && channelInfo.videoId) {
                console.log('FilterTube: Attempting watch page fallback for video:', channelInfo.videoId);
                try {
                    const watchInfo = await fetchChannelFromWatchUrl(channelInfo.videoId, expectedHandle);
                    if (watchInfo && (watchInfo.id || watchInfo.handle || watchInfo.customUrl)) {
                        let retryInput = null;

                        // Prefer UC ID when available
                        if (watchInfo.id && watchInfo.id.startsWith('UC')) {
                            channelInfo.id = watchInfo.id;
                            retryInput = watchInfo.id;
                        }

                        // Use customUrl for /c/ or /user/ channels if no UC ID yet
                        if (!retryInput && watchInfo.customUrl) {
                            channelInfo.customUrl = watchInfo.customUrl;
                            retryInput = watchInfo.customUrl;
                        }

                        // Fallback to handle
                        if (!retryInput && watchInfo.handle) {
                            const normalizedHandle = normalizeHandleValue(watchInfo.handle);
                            if (normalizedHandle) {
                                channelInfo.handle = normalizedHandle;
                                retryInput = normalizedHandle;
                            }
                        }

                        // Update name if available
                        if (watchInfo.name && !channelInfo.name) {
                            channelInfo.name = watchInfo.name;
                        }

                        // Broadcast mapping if we have both
                        if (channelInfo.id && channelInfo.handle) {
                            broadcastChannelMapping(channelInfo.id, channelInfo.handle);
                        }

                        if (retryInput) {
                            console.log('FilterTube: Retrying block with watch page identifier:', retryInput);

                            // Cache the resolved info
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
                } catch (e) {
                    console.warn('FilterTube: Watch page fallback failed:', e);
                }
            }

            // 3) Final fallback: Shorts-specific helper (only when applicable)
            if (!result.success && channelInfo.needsFetch && channelInfo.fetchStrategy !== 'mainworld') {
                const fallbackInfo = await fetchChannelFromShortsUrl(channelInfo.videoId, expectedHandle, { allowDirectFetch: true });
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

            if (initialWas404 && !result.success) {
                handleResolutionFailed404 = true;
            }
        }

        if (!result.success) {
            if (didOptimisticHide && !blockPersisted) {
                restoreOptimisticHide();
            }
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

        blockPersisted = true;

        if (result && result.channelData) {
            upsertFilterChannel(result.channelData);
            channelInfo = { ...channelInfo, ...result.channelData };
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

        // Store videoId → channelId mapping for Shorts persistence after refresh
        if (channelInfo.videoId && channelInfo.id) {
            persistVideoChannelMapping(channelInfo.videoId, channelInfo.id);
            try {
                const cards = document.querySelectorAll(`[data-filtertube-video-id="${channelInfo.videoId}"]`);
                for (const card of cards) {
                    if (!shouldStampCardForVideoId(card, channelInfo.videoId)) continue;
                    stampChannelIdentity(card, {
                        id: channelInfo.id,
                        handle: channelInfo.handle || '',
                        customUrl: channelInfo.customUrl || '',
                        name: channelInfo.name || ''
                    });
                }
            } catch (e) {
            }
        }

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

        if (!didOptimisticHide) {
            try {
                if (videoCard && isCommentContextBlock) {
                    const commentTarget = resolveCommentHideTarget(videoCard);
                    if (commentTarget) {
                        console.log('FilterTube: Hiding comment context immediately');
                        markElementAsBlocked(commentTarget, channelInfo, 'pending');
                        commentTarget.style.display = 'none';
                        commentTarget.classList.add('filtertube-hidden');
                        commentTarget.setAttribute('data-filtertube-hidden', 'true');
                    }
                }

                if (videoCard && !isCommentContextBlock) {
                    console.log('FilterTube: Hiding video card immediately');

                    const isShorts = videoCard.tagName.toLowerCase().includes('shorts-lockup-view-model') ||
                        videoCard.tagName.toLowerCase().includes('reel');

                    let containerToHide = videoCard;
                    if (isShorts) {
                        let parentContainer = videoCard.closest('ytd-rich-item-renderer');
                        if (!parentContainer) {
                            parentContainer = videoCard.closest('.ytGridShelfViewModelGridShelfItem');
                        }
                        if (parentContainer) {
                            containerToHide = parentContainer;
                        }
                        console.log('FilterTube: Shorts detected, hiding container:', containerToHide.tagName || containerToHide.className);
                    } else {
                        const isHomeLockup = videoCard.tagName.toLowerCase().includes('lockup-view-model');
                        if (isHomeLockup) {
                            const parentContainer = videoCard.closest('ytd-rich-item-renderer');
                            if (parentContainer) {
                                containerToHide = parentContainer;
                            }
                        }
                    }

                    markElementAsBlocked(containerToHide, channelInfo, 'pending');
                    containerToHide.style.display = 'none';
                    containerToHide.classList.add('filtertube-hidden');
                    containerToHide.setAttribute('data-filtertube-hidden', 'true');
                    console.log('FilterTube: Applied immediate hiding to:', containerToHide.tagName || containerToHide.className);

                    if (!isShorts) {
                        // Keep immediate hide scoped to the clicked card only.
                    }
                }
            } catch (e) {
                console.warn('FilterTube: Immediate hide failed', e);
            }
        }

        try {
            const menuDropdown = menuItem.closest('tp-yt-iron-dropdown, ytm-menu-popup-renderer, div.menu-content[role="dialog"]');
            if (menuDropdown) {
                forceCloseDropdown(menuDropdown);
            }
        } catch (e) {
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

        // Enrich all Shorts on the page with channel info so they can be matched to the blocked channel
        // This is async and will re-run DOM fallback after enrichment completes
        if (channelInfo.id) {
            enrichVisibleShortsWithChannelInfo(channelInfo.id, refreshedSettings || currentSettings);
        }

    } catch (error) {
        console.error('FilterTube: Error blocking channel:', error);
        if (!blockPersisted && didOptimisticHide) {
            restoreOptimisticHide();
        }
        if (!blockPersisted) {
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
        } else {
            try {
                if (titleSpan) {
                    titleSpan.textContent = '✓ Channel Blocked';
                    titleSpan.style.color = '#10b981';
                }
            } catch (e) {
            }
        }
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
        const rawValue = typeof input === 'string' ? input.trim() : '';
        if (!rawValue) {
            return { success: false, error: 'Empty input' };
        }

        const profile = (typeof location !== 'undefined' && String(location.hostname || '').includes('youtubekids.com'))
            ? 'kids'
            : 'main';

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
                channelName: metadata.channelName || null,
                channelLogo: metadata.channelLogo || null,
                videoId: metadata.videoId || null,
                profile,
                customUrl: metadata.customUrl || null,  // c/Name or user/Name for legacy channels
                source: metadata.source || null
            }, (response) => {
                resolve(response || { success: false, error: 'No response from background' });
                
                // Trigger auto-backup after successful channel addition
                if (response && response.success) {
                    try {
                        const action = 'FilterTube_ScheduleAutoBackup';
                        if (browserAPI_BRIDGE?.runtime?.sendMessage) {
                            browserAPI_BRIDGE.runtime.sendMessage({ action, triggerType: 'channel_added', delay: 1000 }, () => { });
                        } else if (typeof window.FilterTubeIO !== 'undefined' && window.FilterTubeIO.scheduleAutoBackup) {
                            window.FilterTubeIO.scheduleAutoBackup('channel_added');
                        }
                    } catch (e) {
                        console.warn('FilterTube: Failed to schedule backup:', e);
                    }
                }
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

window.addEventListener('message', handleMainWorldMessages, false);

setTimeout(() => initialize(), 50);

// Duplicate function removed - using the version at line 105
