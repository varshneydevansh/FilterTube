// js/content_bridge.js - Isolated world script

console.log("FilterTube: content_bridge.js loaded (Isolated World)");

function buildChannelMetadataPayload(channelInfo = {}) {
    const canonicalRaw = channelInfo.canonicalHandle || channelInfo.handleDisplay || channelInfo.handle || '';
    const canonicalExtracted = extractRawHandle(canonicalRaw);
    const canonical = normalizeHandleValue(canonicalExtracted || canonicalRaw || '');
    const normalizeComparableText = (value) => {
        if (!value || typeof value !== 'string') return '';
        return value
            .replace(/\s+/g, ' ')
            .replace(/\s*\n\s*/g, ' ')
            .trim()
            .toLowerCase();
    };
    const normalizedVideoTitleHint = normalizeComparableText(channelInfo?.videoTitleHint || '');

    const isHandleLike = (value) => {
        return Boolean(normalizeHandleValue(value || ''));
    };

    const isUcIdLike = (value) => {
        if (!value || typeof value !== 'string') return false;
        return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
    };

    const isProbablyNotChannelName = (value, allowMixAggregate = false) => {
        if (!value || typeof value !== 'string') return true;
        const trimmed = value.trim();
        if (!trimmed) return true;
        if (normalizedVideoTitleHint && normalizeComparableText(trimmed) === normalizedVideoTitleHint) return true;
        const currentVideoId = typeof channelInfo?.videoId === 'string' ? channelInfo.videoId.trim().toLowerCase() : '';
        if (currentVideoId) {
            const lower = trimmed.toLowerCase();
            if (lower === currentVideoId || lower === currentVideoId.slice(1) || lower === currentVideoId.slice(0, -1)) return true;
        }
        if (/^watch:[a-zA-Z0-9_-]{11}$/i.test(trimmed)) return true;
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return true;
        if (isHandleLike(trimmed)) return true;
        if (isUcIdLike(trimmed)) return true;
        if (/^uc[a-z0-9_-]{6,}$/i.test(trimmed)) return true;
        if (trimmed.includes('•')) return true;
        if (/\bviews?\b/i.test(trimmed)) return true;
        if (/\bago\b/i.test(trimmed)) return true;
        if (/\bwatching\b/i.test(trimmed)) return true;
        if (/^like\s+this\s+video\??$/i.test(trimmed)) return true;
        if (!allowMixAggregate) {
            if (/\band\s+\d+\s+more\b/i.test(trimmed) || /\band\s+more\b/i.test(trimmed)) return true;
        }
        if (COLLAB_NON_CHANNEL_LABEL_PATTERN.test(trimmed.toLowerCase())) return true;
        const lower = trimmed.toLowerCase();
        if (lower === 'youtube') return true;
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
        if (/^uc[a-z0-9_-]{6,}$/i.test(trimmed)) return true;
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
        expectedChannelName: safeName || null,
        videoId: channelInfo.videoId || null,
        videoTitleHint: normalizedVideoTitleHint || null,
        customUrl: channelInfo.customUrl || null,  // c/Name or user/Name for legacy channels
        source: channelInfo.source || null
    };
}

function hasCollapsedByline(value) {
    if (!value || typeof value !== 'string') return true;
    const trimmed = value
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!trimmed) return true;
    const normalized = trimmed
        // Some YouTube runs collapse "Name and 2 more" into "Nameand 2 more".
        .replace(/([A-Za-z0-9])and\s+(\d+\s+more\b)/gi, '$1 and $2')
        .replace(/([A-Za-z0-9])and\s+(more\b)/gi, '$1 and $2')
        .replace(/[،，﹐､]/g, ',');
    if (normalized.includes('•')) return true;
    if (/,/.test(normalized)) return true;
    if (/\band\s+\d+\s+more\b/i.test(normalized) || /\band\s+more\b/i.test(normalized)) return true;
    if (/;\s*$/.test(trimmed)) return true;

    const parsed = typeof parseCollaboratorNames === 'function' ? parseCollaboratorNames(normalized) : null;
    if (parsed?.names && parsed.names.length > 1) return true;
    if (parsed?.hasHiddenCollaborators) return true;

    return false;
}

// Backward-compatible alias for older helper call sites.
const hasCollapsedBylineText = hasCollapsedByline;

function pickMenuChannelDisplayName(channelInfo, injectionOptions = {}) {
    const normalizeCandidate = (value) => {
        const candidate = typeof value === 'string' ? value.trim() : '';
        if (!candidate) return '';
        return candidate;
    };

    const displayCandidate = normalizeCandidate(injectionOptions.displayName);
    const nameCandidate = normalizeCandidate(channelInfo?.name);
    const expectedNameCandidate = normalizeCandidate(channelInfo?.expectedChannelName);

    const isHandleLike = (value) => {
        return Boolean(normalizeHandleValue(value || ''));
    };

    const isUcIdLike = (value) => {
        if (!value || typeof value !== 'string') return false;
        return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
    };

    const isProbablyNotChannelName = (value) => {
        if (!value || typeof value !== 'string') return true;
        const trimmed = value.trim();
        if (!trimmed) return true;
        const currentVideoId = typeof channelInfo?.videoId === 'string' ? channelInfo.videoId.trim().toLowerCase() : '';
        if (currentVideoId) {
            const lowerVideo = trimmed.toLowerCase();
            if (lowerVideo === currentVideoId || lowerVideo === currentVideoId.slice(1) || lowerVideo === currentVideoId.slice(0, -1)) return true;
        }
        if (/^watch:[a-zA-Z0-9_-]{11}$/i.test(trimmed)) return true;
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return true;
        if (isUcIdLike(trimmed)) return true;
        if (/^uc[a-z0-9_-]{6,}$/i.test(trimmed)) return true;
        if (hasCollapsedByline(trimmed)) return true;
        if (trimmed.includes('•')) return true;
        if (/\bviews?\b/i.test(trimmed)) return true;
        if (/\bago\b/i.test(trimmed)) return true;
        if (/\bwatching\b/i.test(trimmed)) return true;
        if (/^like\s+this\s+video\??$/i.test(trimmed)) return true;
        const lower = trimmed.toLowerCase();
        if (lower === 'channel') return true;
        if (lower === 'unknown') return true;
        if (lower === 'youtube') return true;
        if (lower.startsWith('mix')) return true;
        if (lower.startsWith('my mix')) return true;
        if (/^my\s*mix/i.test(trimmed)) return true;
        if (/\band more\b/i.test(trimmed) && /mix/i.test(trimmed)) return true;
        if (lower.includes('mix') && trimmed.includes('–')) return true;
        if (COLLAB_NON_CHANNEL_LABEL_PATTERN.test(lower)) return true;
        return false;
    };

    const collaboratorPreferredName = Array.isArray(channelInfo?.allCollaborators)
        ? channelInfo.allCollaborators
            .map((collaborator) => normalizeCandidate(collaborator?.name))
            .find((candidate) => candidate && !isHandleLike(candidate) && !isProbablyNotChannelName(candidate))
        : '';

    const safeDisplay = (!isHandleLike(displayCandidate) && displayCandidate && !isProbablyNotChannelName(displayCandidate))
        ? displayCandidate
        : '';
    const safeName = (!isHandleLike(nameCandidate) && nameCandidate && !isProbablyNotChannelName(nameCandidate))
        ? nameCandidate
        : '';
    const safeExpectedName = (!isHandleLike(expectedNameCandidate) && expectedNameCandidate && !isProbablyNotChannelName(expectedNameCandidate))
        ? expectedNameCandidate
        : '';
    const seededFromVideo = getSeedIdentityForVideoId(typeof injectionOptions?.videoId === 'string'
        ? injectionOptions.videoId.trim()
        : channelInfo?.videoId
    );
    const safeSeededExpectedName = (!isHandleLike(seededFromVideo?.expectedChannelName) && seededFromVideo?.expectedChannelName &&
        !isProbablyNotChannelName(seededFromVideo.expectedChannelName))
        ? seededFromVideo.expectedChannelName
        : '';
    const safeSeededName = (!isHandleLike(seededFromVideo?.name) && seededFromVideo?.name && !isProbablyNotChannelName(seededFromVideo.name))
        ? seededFromVideo.name
        : '';
    const safeSeededHandle = typeof seededFromVideo?.handle === 'string' && seededFromVideo.handle.trim()
        ? normalizeHandleValue(seededFromVideo.handle) || ''
        : '';
    const safeSeededId = isSeedChannelId(seededFromVideo?.id) ? seededFromVideo.id : '';
    const safeSeededCustomUrl = typeof seededFromVideo?.customUrl === 'string' && seededFromVideo.customUrl.trim()
        ? seededFromVideo.customUrl.trim()
        : '';

    const cachePreferredName = safeSeededName || '';
    const expectedPreferredName = safeSeededExpectedName || safeExpectedName || '';
    const domPreferredName = safeName || safeDisplay || '';

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

    const directHandle = typeof channelInfo?.handle === 'string'
        ? normalizeHandleValue(channelInfo.handle) || ''
        : '';
    const channelIdPreferred = safeSeededId || (typeof channelInfo?.id === 'string' && isSeedChannelId(channelInfo.id) ? channelInfo.id : '');
    const customUrlPreferred = safeSeededCustomUrl || (typeof channelInfo?.customUrl === 'string' ? channelInfo.customUrl.trim() : '');
    const handlePreferred = safeSeededHandle || mappedHandle || directHandle || channelInfo?.handleDisplay || '';

    return (
        cachePreferredName ||
        collaboratorPreferredName ||
        expectedPreferredName ||
        domPreferredName ||
        handlePreferred ||
        customUrlPreferred ||
        channelIdPreferred ||
        'Block Channel'
    );
}

function setValidatedChannelId(card, value) {
    if (!card || typeof card.setAttribute !== 'function') return;
    const normalizedId = normalizeSeedChannelId(value);
    if (!normalizedId) return;
    card.setAttribute('data-filtertube-channel-id', normalizedId);
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

function isLikelyNonChannelName(value) {
    if (!value || typeof value !== 'string') return true;
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (/^UC[a-zA-Z0-9_-]{22}$/i.test(trimmed)) return true;
    if (trimmed.startsWith('@')) return true;
    if (trimmed.includes('•')) return true;
    if (/\bviews?\b/i.test(trimmed)) return true;
    if (/\bago\b/i.test(trimmed)) return true;
    if (/\bwatching\b/i.test(trimmed)) return true;
    if (/^like\s+this\s+video\??$/i.test(trimmed)) return true;
    if (/\band\s+\d+\s+more\b/i.test(trimmed) || /\band\s+more\b/i.test(trimmed)) return true;
    if (trimmed.toLowerCase() === 'youtube') return true;
    if (/^\d+:\d+/.test(trimmed)) return true;
    if (/^\s*mix\b/i.test(trimmed)) return true;
    return false;
}

function deriveExpectedChannelName(value) {
    if (!value || typeof value !== 'string') return '';
    let text = value
        .replace(/\s+/g, ' ')
        .replace(/\s*\n\s*/g, ' ')
        .trim();
    if (!text) return '';

    // Common YTM aria-label format:
    // "<title> by <channel> <views/age> <duration>"
    const byMatch = text.match(/\bby\s+(.+?)(?:\s+\d|$)/i);
    if (byMatch && byMatch[1]) {
        text = byMatch[1].trim();
    }

    text = text
        .replace(/\s+\d[\d,.]*\s+(?:views?|watching)\b.*$/i, '')
        .replace(/\s+\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago\b.*$/i, '')
        .trim();

    if (isLikelyNonChannelName(text)) return '';
    return text;
}

function normalizeComparableCardText(value) {
    if (!value || typeof value !== 'string') return '';
    return value
        .replace(/\s+/g, ' ')
        .replace(/\s*\n\s*/g, ' ')
        .trim()
        .toLowerCase();
}

function collectCardTitleHints(card) {
    if (!card || !(card instanceof Element)) return [];
    const values = new Set();
    const push = (value) => {
        const normalized = normalizeComparableCardText(value);
        if (!normalized) return;
        values.add(normalized);
    };

    try {
        const stampedTitle = card.getAttribute('data-filtertube-video-title') || '';
        if (stampedTitle) push(stampedTitle);
    } catch (e) {
    }

    try {
        const titleNodes = card.querySelectorAll(
            'a#video-title, ' +
            '#video-title, ' +
            '#video-title-link, ' +
            '.media-item-headline .yt-core-attributed-string, ' +
            '.YtmCompactMediaItemHeadline .yt-core-attributed-string, ' +
            '.YtmCompactMediaItemHeadline, ' +
            '.yt-lockup-metadata-view-model__title, ' +
            '.yt-lockup-view-model-wiz__title, ' +
            '.shortsLockupViewModelHostOutsideMetadataTitle, ' +
            '.shortsLockupViewModelHostInlineMetadataTitle, ' +
            'h3, h3 a'
        );
        titleNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            push(node.textContent || '');
            push(node.getAttribute('title') || '');
            push(node.getAttribute('aria-label') || '');
        });
    } catch (e) {
    }

    return Array.from(values);
}

function isLikelyVideoTitleForCard(card, candidate) {
    if (!candidate || typeof candidate !== 'string') return false;
    if (!card || !(card instanceof Element)) return false;

    const normalizedCandidate = normalizeComparableCardText(candidate);
    if (!normalizedCandidate || normalizedCandidate.length < 3) return false;

    const titleHints = collectCardTitleHints(card);
    if (!Array.isArray(titleHints) || titleHints.length === 0) return false;

    return titleHints.some((hint) => {
        if (!hint) return false;
        if (hint === normalizedCandidate) return true;
        if (hint.startsWith(`${normalizedCandidate} by `)) return true;
        if (hint.startsWith(`${normalizedCandidate} | `)) return true;
        return false;
    });
}

function sanitizeChannelNameForCard(value, card = null) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (isLikelyNonChannelName(trimmed)) return '';
    if (hasCollapsedByline(trimmed)) return '';
    if (trimmed.toLowerCase() === 'unknown') return '';
    if (card && isLikelyVideoTitleForCard(card, trimmed)) return '';
    return trimmed;
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
    try {
        dropdown.dispatchEvent(new CustomEvent('filtertube-force-close'));
    } catch (e) {
    }
    const isMobileSurface = (() => {
        try {
            const host = String(location?.hostname || '').toLowerCase();
            return host.startsWith('m.') || host.includes('music.youtube.com');
        } catch (e) {
            return false;
        }
    })();
    const isYtmSheetLike = (() => {
        try {
            return Boolean(
                dropdown.matches?.('bottom-sheet-container, ytm-bottom-sheet-renderer, ytm-menu-popup-renderer, div.menu-content[role="dialog"]') ||
                dropdown.closest?.('bottom-sheet-container, ytm-bottom-sheet-renderer, ytm-menu-popup-renderer')
            );
        } catch (e) {
            return false;
        }
    })();
    if (isMobileSurface && isYtmSheetLike) {
        closeYTMBottomSheet(dropdown);
        return;
    }

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
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === 'function') {
        try {
            activeElement.blur();
        } catch (e) {
        }
    }

    const hosts = new Set([dropdown]);
    const hostRoot = dropdown.closest?.('bottom-sheet-container, ytm-bottom-sheet-renderer, ytm-menu-popup-renderer, tp-yt-iron-dropdown');
    if (hostRoot) hosts.add(hostRoot);

    const closeHost = (host) => {
        if (!host) return;
        try {
            host.dispatchEvent(escapeEvent);
        } catch (e) {
        }
        if (typeof host.close === 'function') {
            try {
                host.close();
            } catch (error) {
                console.warn('FilterTube: Failed to call dropdown.close()', error);
            }
        }
        try {
            if ('opened' in host) host.opened = false;
            if ('open' in host) host.open = false;
        } catch (e) {
        }
    };
    hosts.forEach(closeHost);

    const scrims = new Set();
    hosts.forEach((host) => {
        try {
            host.querySelectorAll('ytw-scrim, .ytWebScrimHost, .ytWebScrimHostModernOverlay').forEach((el) => scrims.add(el));
        } catch (e) {
        }
    });
    scrims.forEach((scrim) => {
        try {
            const closeBtn = scrim.querySelector?.('button[aria-label="Close"], .ytWebScrimHiddenButton');
            if (closeBtn && typeof closeBtn.click === 'function') {
                closeBtn.click();
            }
        } catch (e) {
        }
    });

    hosts.forEach((host) => {
        try {
            host.querySelectorAll('button[aria-label="Close"], button.hidden-button, .ytWebScrimHiddenButton').forEach((btn) => {
                if (typeof btn.click === 'function') btn.click();
            });
        } catch (e) {
        }
    });

    if (isMobileSurface) {
        return;
    }

    setTimeout(() => {
        if (hasVisibleMiniplayer()) return;
        const clickTarget = document.querySelector('ytd-app') || document.body;
        if (clickTarget) {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            clickTarget.dispatchEvent(clickEvent);
        }
    }, 50);
}

function closeYTMBottomSheet(bottomSheet) {
    if (!bottomSheet) return;
    cleanupDropdownState(bottomSheet);

    try {
        const active = document.activeElement;
        if (active && typeof active.blur === 'function') {
            active.blur();
        }
    } catch (e) {
    }

    const hostRoot = (() => {
        try {
            if (bottomSheet.matches?.('bottom-sheet-container')) return bottomSheet;
            return bottomSheet.closest?.('bottom-sheet-container') || bottomSheet;
        } catch (e) {
            return bottomSheet;
        }
    })();

    try {
        const scrimBtn = (hostRoot || bottomSheet).querySelector?.('ytw-scrim button, button[aria-label="Close"], .ytWebScrimHiddenButton');
        if (scrimBtn && typeof scrimBtn.click === 'function') {
            scrimBtn.click();
        }
    } catch (e) {
    }

    const hosts = new Set([bottomSheet, hostRoot]);
    hosts.forEach((host) => {
        if (!host) return;
        if (typeof host.close === 'function') {
            try {
                host.close();
            } catch (e) {
            }
        }
        try {
            if ('opened' in host) host.opened = false;
            if ('open' in host) host.open = false;
        } catch (e) {
        }
    });
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

const OLD_MENU_PRIMARY_CONTAINER_SELECTOR = [
    'tp-yt-paper-listbox#items',
    'tp-yt-paper-listbox',
    'div.menu-content[role="dialog"]',
    'ytm-menu-popup-renderer',
    'ytm-bottom-sheet-renderer',
    'ytd-menu-popup-renderer',
    'ytd-menu-service-item-renderer',
    '#items.ytd-menu-popup-renderer',
    '#items.style-scope.ytd-menu-popup-renderer'
].join(', ');

const OLD_MENU_MARKER_SELECTOR = [
    'ytm-menu-service-item-renderer',
    'ytm-menu-navigation-item-renderer',
    'ytm-menu-item',
    'ytm-menu-renderer',
    'ytm-menu'
].join(', ');

const YTM_MENU_ROOT_SELECTOR = [
    'div.menu-content[role="dialog"]',
    'ytm-menu-popup-renderer',
    'ytm-bottom-sheet-renderer',
    'bottom-sheet-container',
    'ytm-menu-renderer',
    'ytm-menu'
].join(', ');

function resolveOldMenuContainer(dropdown) {
    if (!dropdown) return null;
    try {
        // ytm-bottom-sheet-renderer is the trigger wrapper; real menu is body-level bottom-sheet-container.
        if (dropdown.matches?.('ytm-bottom-sheet-renderer')) return null;
        if (dropdown.matches?.('bottom-sheet-container') && dropdown.querySelector('yt-list-view-model')) {
            // Shorts/mobile action sheets use list-view model; avoid legacy menu path.
            return null;
        }
        if (dropdown.matches?.('bottom-sheet-container')) {
            const legacySheetList = dropdown.querySelector('.bottom-sheet-media-menu-item');
            if (legacySheetList) return legacySheetList;
        }
    } catch (e) {
    }

    try {
        if (dropdown.matches?.(OLD_MENU_PRIMARY_CONTAINER_SELECTOR)) {
            if (dropdown.matches?.('ytm-bottom-sheet-renderer')) return null;
            return dropdown;
        }
    } catch (e) {
    }

    const primary = dropdown.querySelector?.(OLD_MENU_PRIMARY_CONTAINER_SELECTOR);
    if (primary && !primary.matches?.('ytm-bottom-sheet-renderer')) return primary;

    const marker = dropdown.querySelector?.(OLD_MENU_MARKER_SELECTOR);
    if (!marker) return null;
    const markerRoot = marker.closest?.(YTM_MENU_ROOT_SELECTOR);
    if (markerRoot?.matches?.('ytm-bottom-sheet-renderer')) return null;
    if (markerRoot?.matches?.('bottom-sheet-container')) {
        const legacySheetList = marker.closest?.('.bottom-sheet-media-menu-item');
        if (legacySheetList) return legacySheetList;
    }
    return markerRoot || marker.parentElement || marker;
}

function resolveMenuInsertionTarget(menuContainer) {
    if (!menuContainer) return null;
    const listbox = menuContainer.querySelector?.('tp-yt-paper-listbox#items') ||
        menuContainer.querySelector?.('tp-yt-paper-listbox');
    if (listbox) return listbox;
    if (
        menuContainer.matches?.('ytm-menu-service-item-renderer, ytm-menu-navigation-item-renderer, ytm-menu-item') &&
        menuContainer.parentElement
    ) {
        return menuContainer.parentElement;
    }
    if (menuContainer.matches?.('bottom-sheet-container, bottom-sheet-layout')) {
        const legacySheetList = menuContainer.querySelector?.('.bottom-sheet-media-menu-item');
        if (legacySheetList) return legacySheetList;
    }
    const existingMobileItem = menuContainer.querySelector?.('ytm-menu-service-item-renderer, ytm-menu-navigation-item-renderer');
    if (existingMobileItem?.parentElement) {
        return existingMobileItem.parentElement;
    }
    return menuContainer;
}

function isMobileMenuContainer(menuList, menuContainer) {
    const container = menuContainer || menuList;
    const target = menuList || container;
    const hostHint = (() => {
        try {
            const host = String(location?.hostname || '').toLowerCase();
            return host.startsWith('m.youtube.') || host.includes('music.youtube.com');
        } catch (e) {
            return false;
        }
    })();
    return Boolean(
        hostHint ||
        target?.closest?.('ytm-menu-popup-renderer, ytm-bottom-sheet-renderer, bottom-sheet-container, ytm-menu-renderer, ytm-menu, ytm-app') ||
        container?.matches?.('div.menu-content[role="dialog"], ytm-menu-popup-renderer, ytm-bottom-sheet-renderer, bottom-sheet-container, ytm-menu-renderer, ytm-menu') ||
        container?.querySelector?.('ytm-menu-service-item-renderer, ytm-menu-navigation-item-renderer, ytm-menu-item')
    );
}

function injectCollaboratorPlaceholderMenu(newMenuList, oldMenuList, message = 'Fetching collaborators…') {
    const blockAllMessage = getAdaptiveMenuCopy().pendingAll;
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
        const menuList = resolveMenuInsertionTarget(oldMenuList);
        if (!menuList) return;
        const isMobileMenu = isMobileMenuContainer(menuList, oldMenuList);
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
    const oldMenuList = resolveOldMenuContainer(dropdown);
    return { newMenuList, oldMenuList };
}

function renderFilterTubeMenuEntries({ dropdown, newMenuList, oldMenuList, channelInfo, videoCard, placeholder = false }) {
    if (!dropdown) return;
    const containers = getMenuContainers(dropdown, newMenuList, oldMenuList);
    const targetMenu = containers.newMenuList || containers.oldMenuList;
    if (!targetMenu) return;

    const sanitizeMenuDisplayName = (value) => {
        return sanitizeChannelNameForCard(typeof value === 'string' ? value : '', videoCard);
    };

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
        const totalCollaboratorCount = Math.max(
            channelInfo.expectedCollaboratorCount || 0,
            collaborators.length
        );
        const isMultiStep = totalCollaboratorCount >= 3;
        const groupId = generateCollaborationGroupId();
        const hasIdentifier = (c) => Boolean(c?.handle || c?.id || c?.customUrl);
        const anyMissingIdentifiers = collaborators.some(c => !hasIdentifier(c));

        if (containers.newMenuList) {
            for (let i = 0; i < collaboratorCount; i++) {
                const collaborator = collaborators[i];
                const otherChannels = collaborators
                    .filter((_, idx) => idx !== i)
                    .map(c => c.handle || c.id || c.customUrl || c.name);
                const collaboratorDisplayName = sanitizeMenuDisplayName(collaborator?.name) || 'Channel';
                const collaboratorHasIdentifier = hasIdentifier(collaborator);

                injectIntoNewMenu(containers.newMenuList, collaborator, videoCard, {
                    collaborationWith: otherChannels,
                    collaborationGroupId: groupId,
                    isMultiStep
                }, {
                    disabled: !collaboratorHasIdentifier,
                    displayName: collaboratorHasIdentifier ? collaboratorDisplayName : `${collaboratorDisplayName} (resolving…)`
                });
            }

            const blockAllMenuItem = injectIntoNewMenu(containers.newMenuList, {
                name: totalCollaboratorCount === 2 ? 'Both Channels' : `All ${totalCollaboratorCount} Collaborators`,
                isBlockAllOption: true,
                allCollaborators: collaborators.slice(0, collaboratorCount),
                collaborationGroupId: groupId,
                isMultiStep
            }, videoCard, null, {
                disabled: anyMissingIdentifiers,
                displayName: anyMissingIdentifiers ? 'All Collaborators (resolving…)'
                    : (totalCollaboratorCount === 2 ? 'Both Channels' : `All ${totalCollaboratorCount} Collaborators`)
            });
            setupMultiStepMenu(
                dropdown,
                groupId,
                collaborators.slice(0, collaboratorCount),
                blockAllMenuItem,
                totalCollaboratorCount
            );
        } else if (containers.oldMenuList) {
            for (let i = 0; i < collaboratorCount; i++) {
                const collaborator = collaborators[i];
                const otherChannels = collaborators
                    .filter((_, idx) => idx !== i)
                    .map(c => c.handle || c.id || c.customUrl || c.name);
                const collaboratorDisplayName = sanitizeMenuDisplayName(collaborator?.name) || 'Channel';
                const collaboratorHasIdentifier = hasIdentifier(collaborator);

                injectIntoOldMenu(containers.oldMenuList, collaborator, videoCard, {
                    collaborationWith: otherChannels,
                    collaborationGroupId: groupId,
                    isMultiStep
                }, {
                    disabled: !collaboratorHasIdentifier,
                    displayName: collaboratorHasIdentifier ? collaboratorDisplayName : `${collaboratorDisplayName} (resolving…)`
                });
            }

            const blockAllMenuItem = injectIntoOldMenu(containers.oldMenuList, {
                name: totalCollaboratorCount === 2 ? 'Both Channels' : `All ${totalCollaboratorCount} Collaborators`,
                isBlockAllOption: true,
                allCollaborators: collaborators.slice(0, collaboratorCount),
                collaborationGroupId: groupId,
                isMultiStep
            }, videoCard, null, {
                disabled: anyMissingIdentifiers,
                displayName: anyMissingIdentifiers ? 'All Collaborators (resolving…)'
                    : (totalCollaboratorCount === 2 ? 'Both Channels' : `All ${totalCollaboratorCount} Collaborators`)
            });
            setupMultiStepMenu(
                dropdown,
                groupId,
                collaborators.slice(0, collaboratorCount),
                blockAllMenuItem,
                totalCollaboratorCount
            );
        }
        forceDropdownResize(dropdown);
        return;
    }

    const singleChannelInjectionOptions = (() => {
        try {
        const stored = findStoredChannelEntry(channelInfo);
            const storedName = typeof stored?.name === 'string' ? stored.name.trim() : '';
            if (storedName && !hasCollapsedByline(storedName) && !isLikelyNonChannelName(storedName)) {
                return { displayName: storedName };
            }
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

function updateInjectedMenuChannelName(dropdown, channelInfo, injectionOptions = {}) {
    if (!dropdown || !channelInfo) return;
    const menuItem = dropdown.querySelector('.filtertube-block-channel-item');
    if (!menuItem) return;

    const nameEl = menuItem.querySelector('.filtertube-channel-name');
    if (!nameEl) return;

    const current = (nameEl.textContent || '').trim();
    const next = pickMenuChannelDisplayName(channelInfo, injectionOptions) || '';
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
        if (trimmed.toLowerCase() === 'unknown') return true;
        if (/\bviews?\b/i.test(trimmed)) return true;
        if (/\bago\b/i.test(trimmed)) return true;
        if (/\bwatching\b/i.test(trimmed)) return true;
        if (/^like\s+this\s+video\??$/i.test(trimmed)) return true;
        if (/\band\s+\d+\s+more\b/i.test(trimmed) || /\band\s+more\b/i.test(trimmed)) return true;
        if (isUcIdLike(trimmed)) return true;
        if (/^uc[a-z0-9_-]{6,}$/i.test(trimmed)) return true;
        const lower = trimmed.toLowerCase();
        if (lower === 'channel') return true;
        if (lower.startsWith('mix')) return true;
        if (lower.startsWith('my mix')) return true;
        if (/^my\s*mix/i.test(trimmed)) return true;
        if (/\band more\b/i.test(trimmed) && /mix/i.test(trimmed)) return true;
        if (lower.includes('mix') && trimmed.includes('–')) return true;
        return false;
    };

    const nextIsHandle = isHandleLike(next);
    const nextIsId = isUcIdLike(next);
    const nextIsCustomUrlLike = /^(c|user)\/[^/?#]+$/i.test(next);
    if (next.toLowerCase() === 'channel') return;
    if (!nextIsHandle && !nextIsId && !nextIsCustomUrlLike && isProbablyNotChannelName(next)) return;
    const currentLooksWeak = !current || current.toLowerCase() === 'channel' || hasCollapsedByline(current) || isProbablyNotChannelName(current);

    // Replace placeholder-ish values (handles, UC IDs, mix titles, or metadata strings) once enrichment delivers a real name.
    if (currentLooksWeak) {
        nameEl.textContent = next;
        return;
    }

    if (isHandleLike(current) && !isHandleLike(next)) {
        nameEl.textContent = next;
        return;
    }

    if (isUcIdLike(current) && !isUcIdLike(next)) {
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
const VIDEO_IDENTITY_CACHE_MAX_SIZE = 5000;
const VIDEO_IDENTITY_CACHE_EVICT_BATCH_SIZE = 1000;
const videoIdentityCache = new Map();
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
    const normalizeVideoId = (value) => {
        if (!value || typeof value !== 'string') return '';
        const match = value.match(/[A-Za-z0-9_-]{11}/);
        return match ? match[0] : '';
    };
    const priorCachedVideoId = normalizeVideoId(card?.getAttribute?.('data-filtertube-video-id') || '');
    const dataVideoId = normalizeVideoId(card?.getAttribute?.('data-video-id') || '');
    const videoId = normalizeVideoId(extractVideoIdFromCard(card)) || dataVideoId || priorCachedVideoId;
    if (!videoId) return;

    resetCardIdentityIfStale(card, videoId);
    // Also clear stale collaborator metadata if this DOM node was recycled
    getValidatedCachedCollaborators(card);

    // If YouTube recycled a DOM node without our video-id attribute, any existing channel
    // attrs on it are untrusted. Clear them to avoid persisting a wrong mapping.
    if (!priorCachedVideoId) {
        try {
            card.removeAttribute('data-filtertube-channel-id');
            card.removeAttribute('data-filtertube-channel-authority');
            card.removeAttribute('data-filtertube-channel-handle');
            card.removeAttribute('data-filtertube-channel-name');
            card.removeAttribute('data-filtertube-channel-custom');
            card.removeAttribute('data-filtertube-channel-logo');
            card.removeAttribute('data-filtertube-channel-source');
            card.removeAttribute('data-filtertube-channel-fetch-strategy');
            card.removeAttribute('data-filtertube-channel-expected-channel-name');
            card.removeAttribute('data-filtertube-blocked-channel-id');
            card.removeAttribute('data-filtertube-blocked-channel-handle');
            card.removeAttribute('data-filtertube-blocked-channel-custom');
            card.removeAttribute('data-filtertube-blocked-channel-name');
            card.removeAttribute('data-filtertube-blocked-state');
            card.removeAttribute('data-filtertube-blocked-ts');
            if (typeof clearBlockedElementAttributes === 'function') {
                clearBlockedElementAttributes(card);
            }

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
        } catch (e) {
        }
    }

    const existingIdentity = readCardChannelIdentity(card);
    const existingId = existingIdentity.id || '';
    const existingHandle = existingIdentity.handle || '';
    const existingAuthority = normalizeIdentityAuthority(existingIdentity.authority, existingIdentity);

    const existingRichIdentity = {
        handle: existingHandle || null,
        customUrl: existingIdentity.customUrl || null,
        name: existingIdentity.name || null,
        logo: existingIdentity.logo || null,
        source: existingIdentity.source || null,
        fetchStrategy: existingIdentity.fetchStrategy || null,
        expectedChannelName: existingIdentity.expectedChannelName || null
    };
    const existingHasRichIdentity = hasNonIdRichFields(existingRichIdentity);
    const hasValidExistingId = isSeedChannelId(existingId);
    const hasConfirmedMappedId = hasConfirmedVideoChannelMapping(videoId, existingId);
    const canTrustExistingIdentity = hasConfirmedMappedId;

    // If we already have an ID that was associated with this element's cached video id,
    // persist and skip only when we also have rich details.
    if (priorCachedVideoId && priorCachedVideoId === videoId) {
        if (hasValidExistingId && canTrustExistingIdentity) {
            persistVideoChannelMapping(videoId, existingId);
        }

        // If rich identity already exists, allow a fast-path skip.
        // Map-only/partial states still need enrichment to fill missing fields.
        if (existingHasRichIdentity && hasValidExistingId && canTrustExistingIdentity) return;

        // Ensure stale/legacy IDs do not block enrichment.
        if (existingId && !hasValidExistingId) {
            try {
                card.removeAttribute('data-filtertube-channel-id');
                card.removeAttribute('data-filtertube-channel-authority');
            } catch (e) {
            }
        }
    }

    // If we only have a handle, try to resolve to UC ID immediately using channelMap.
    // Only trust this path when the stamped identity is already confirmed.
    if (existingAuthority === 'confirmed' && !existingHasRichIdentity && !existingId && existingHandle) {
        const resolvedId = resolveIdFromHandle(existingHandle);
        if (resolvedId) {
            stampChannelIdentity(card, { id: resolvedId, handle: existingHandle, authority: 'confirmed' });
        }
    }

    // If we only have a raw handle and no cached id, still attempt one quick map resolve.
    if (existingAuthority === 'confirmed' && !existingHasRichIdentity && !hasValidExistingId && existingHandle) {
        const resolvedId = resolveIdFromHandle(existingHandle);
        if (resolvedId) {
            stampChannelIdentity(card, { id: resolvedId, handle: existingHandle, authority: 'confirmed' });
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

function setVideoIdentityCache(videoId, identity = {}) {
    if (!videoId || !identity || typeof identity !== 'object') return;
    const existing = videoIdentityCache.get(videoId) || {};
    const merged = { ...existing };
    const sanitizeNameValue = (value) => {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) return '';
        if (isLikelyNonChannelName(trimmed)) return '';
        if (hasCollapsedByline(trimmed)) return '';
        return trimmed;
    };

    const normalizedSeedId = normalizeSeedChannelId(identity?.id);
    const existingAuthority = normalizeIdentityAuthority(existing?.authority, existing);
    const incomingAuthority = normalizeIdentityAuthority(identity?.authority, {
        ...identity,
        id: normalizedSeedId || identity?.id || ''
    });
    if (normalizedSeedId) {
        merged.id = normalizedSeedId;
    } else if (Object.prototype.hasOwnProperty.call(identity, 'id') && typeof identity.id === 'string') {
        delete merged.id;
    }
    if (typeof identity.handle === 'string' && identity.handle.trim()) {
        merged.handle = identity.handle.trim().toLowerCase();
    }
    if (typeof identity.customUrl === 'string' && identity.customUrl.trim()) {
        merged.customUrl = identity.customUrl.trim();
    }
    if (Object.prototype.hasOwnProperty.call(identity, 'name')) {
        const safeName = sanitizeNameValue(identity.name);
        if (safeName) {
            merged.name = safeName;
        } else {
            delete merged.name;
        }
    }
    if (typeof identity.logo === 'string' && identity.logo.trim()) {
        merged.logo = identity.logo.trim();
    }
    if (typeof identity.source === 'string' && identity.source.trim()) {
        merged.source = identity.source.trim();
    }
    if (typeof identity.fetchStrategy === 'string' && identity.fetchStrategy.trim()) {
        merged.fetchStrategy = identity.fetchStrategy.trim();
    }
    if (Object.prototype.hasOwnProperty.call(identity, 'expectedChannelName')) {
        const safeExpected = sanitizeNameValue(identity.expectedChannelName);
        if (safeExpected) {
            merged.expectedChannelName = safeExpected;
        } else {
            delete merged.expectedChannelName;
        }
    }
    if (incomingAuthority === 'confirmed') {
        merged.authority = 'confirmed';
    } else if (incomingAuthority === 'hint') {
        if (existingAuthority !== 'confirmed') {
            merged.authority = 'hint';
        }
    } else if (existingAuthority) {
        merged.authority = existingAuthority;
    }

    if (!merged.id && !merged.handle && !merged.customUrl && !merged.name && !merged.logo && !merged.source && !merged.fetchStrategy && !merged.expectedChannelName) {
        return;
    }

    if (videoIdentityCache.has(videoId)) {
        videoIdentityCache.delete(videoId);
    }
    videoIdentityCache.set(videoId, merged);

    if (videoIdentityCache.size > VIDEO_IDENTITY_CACHE_MAX_SIZE) {
        const evictCount = Math.min(
            VIDEO_IDENTITY_CACHE_EVICT_BATCH_SIZE,
            videoIdentityCache.size - VIDEO_IDENTITY_CACHE_MAX_SIZE
        );
        if (evictCount > 0) {
            const keys = [...videoIdentityCache.keys()];
            for (let i = 0; i < evictCount; i++) {
                videoIdentityCache.delete(keys[i]);
            }
        }
    }
}

function getSeedIdentityForVideoId(videoId, card = null) {
    if (!videoId) return null;
    const cached = videoIdentityCache.get(videoId);
    const mappedId = getConfirmedVideoChannelId(videoId);
    const cachedCopy = cached ? { ...cached } : {};
    const extractCandidateVideoId = (value) => {
        if (!value || typeof value !== 'string') return '';
        const match = value.match(/[A-Za-z0-9_-]{11}/);
        return match ? match[0] : '';
    };
    const cardVideoId = (() => {
        if (!card || typeof card.getAttribute !== 'function') return '';
        try {
            return extractCandidateVideoId(
                card.getAttribute('data-filtertube-video-id') ||
                card.getAttribute('data-video-id') ||
                ''
            );
        } catch (e) {
            return '';
        }
    })();
    const sanitizeSeedName = (value) => {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) return '';
        if (isLikelyNonChannelName(trimmed)) return '';
        if (hasCollapsedByline(trimmed)) return '';
        return trimmed;
    };
    const hasMatchingVideoContext = !cardVideoId || cardVideoId === videoId;
    if (mappedId) {
        cachedCopy.id = mappedId;
        cachedCopy.authority = 'confirmed';
    } else if (cachedCopy.id) {
        const normalized = normalizeSeedChannelId(cachedCopy.id);
        if (normalized) {
            cachedCopy.id = normalized;
        } else {
            delete cachedCopy.id;
        }
    }

    if (card && typeof extractChannelFromCard === 'function' && hasMatchingVideoContext) {
        try {
            const domInfo = extractChannelFromCard(card) || {};
            if (!cachedCopy.id) {
                const domId = normalizeSeedChannelId(domInfo.id);
                if (domId) cachedCopy.id = domId;
            }
            if (!cachedCopy.handle && domInfo.handle) cachedCopy.handle = domInfo.handle;
            if (!cachedCopy.customUrl && domInfo.customUrl) cachedCopy.customUrl = domInfo.customUrl;
            if (!cachedCopy.name && domInfo.name) cachedCopy.name = domInfo.name;
            if (!cachedCopy.logo && domInfo.logo) cachedCopy.logo = domInfo.logo;
            if (!cachedCopy.source && domInfo.source) cachedCopy.source = domInfo.source;
            if (!cachedCopy.fetchStrategy && domInfo.fetchStrategy) cachedCopy.fetchStrategy = domInfo.fetchStrategy;
            if (!cachedCopy.expectedChannelName && domInfo.expectedChannelName) cachedCopy.expectedChannelName = domInfo.expectedChannelName;
        } catch (e) {
        }
    }

    if (cachedCopy.id && !isSeedChannelId(cachedCopy.id)) {
        delete cachedCopy.id;
    }
    const normalizedAuthority = normalizeIdentityAuthority(cachedCopy.authority, cachedCopy);
    if (normalizedAuthority) {
        cachedCopy.authority = normalizedAuthority;
    } else {
        delete cachedCopy.authority;
    }
    if (typeof cachedCopy.name === 'string') {
        const safeName = sanitizeSeedName(cachedCopy.name);
        cachedCopy.name = safeName || '';
    }
    if (typeof cachedCopy.expectedChannelName === 'string') {
        const safeExpectedName = sanitizeSeedName(cachedCopy.expectedChannelName);
        cachedCopy.expectedChannelName = safeExpectedName || '';
    }
    if (cachedCopy.name === '') {
        delete cachedCopy.name;
    }
    if (cachedCopy.expectedChannelName === '') {
        delete cachedCopy.expectedChannelName;
    }
    if (
        cachedCopy.id ||
        cachedCopy.handle ||
        cachedCopy.customUrl ||
        cachedCopy.name ||
        cachedCopy.logo ||
        cachedCopy.expectedChannelName ||
        cachedCopy.isLikelyMix
    ) {
        return cachedCopy;
    }

    return null;
}

function isSeedChannelId(value) {
    if (!value || typeof value !== 'string') return false;
    return /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());
}

function normalizeSeedChannelId(value) {
    if (!value || typeof value !== 'string') return '';
    const match = value.trim().match(/\b(UC[a-zA-Z0-9_-]{22})\b/);
    return match ? match[1] : '';
}

function normalizeIdentityAuthority(value, identity = null) {
    const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (raw === 'confirmed' || raw === 'hint') {
        return raw;
    }
    return '';
}

function getConfirmedVideoChannelId(videoId) {
    if (!videoId || typeof videoId !== 'string') return '';
    const entry = currentSettings?.videoChannelMap?.[videoId];
    const raw = typeof entry === 'string'
        ? entry
        : (entry && typeof entry === 'object'
            ? (entry.channelId || entry.id || '')
            : '');
    return normalizeSeedChannelId(raw);
}

function hasConfirmedVideoChannelMapping(videoId, channelId = '') {
    const mappedId = getConfirmedVideoChannelId(videoId);
    if (!mappedId) return false;
    if (!channelId) return true;
    return mappedId === normalizeSeedChannelId(channelId);
}

function hasRichIdentity(identity) {
    if (!identity || typeof identity !== 'object') return false;
    const isSafeName = (value) => {
        if (!value || typeof value !== 'string') return false;
        const trimmed = value.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith('@')) return false;
        if (isLikelyNonChannelName(trimmed)) return false;
        if (hasCollapsedByline(trimmed)) return false;
        return true;
    };

    return Boolean(
        (identity.id && isSeedChannelId(identity.id)) ||
        (identity.handle && normalizeHandleValue(identity.handle)) ||
        identity.customUrl ||
        identity.logo ||
        isSafeName(identity.name) ||
        isSafeName(identity.expectedChannelName)
    );
}

function mergeIdentityObjects(primary, fallback = {}) {
    const merged = { ...fallback };
    if (!primary || typeof primary !== 'object') return merged;
    for (const key of ['id', 'handle', 'customUrl', 'name', 'logo', 'source', 'fetchStrategy', 'expectedChannelName', 'authority']) {
        if (primary[key]) {
            merged[key] = primary[key];
        }
    }
    return merged;
}

function resolveVideoIdIdentity(videoId, card = null) {
    return getSeedIdentityForVideoId(videoId, card);
}

function buildIdentityForCard(videoId, card, baseIdentity = {}) {
    let seed = mergeIdentityObjects(baseIdentity || {}, getSeedIdentityForVideoId(videoId, card) || {});

    if (seed.id && !isSeedChannelId(seed.id)) {
        delete seed.id;
    }

    const safeName = sanitizeChannelNameForCard(seed.name, card);
    if (safeName) {
        seed.name = safeName;
    } else {
        delete seed.name;
    }
    return seed;
}

async function prefetchIdentityForCard({ videoId, card }) {
    try {
        if (!card || !card.isConnected) return;

        const normalizeStampedIdentity = (identity = {}) => {
            const stamped = { ...identity };
            const safeName = sanitizeChannelNameForCard(stamped.name, card);
            if (safeName) {
                stamped.name = safeName;
            } else {
                delete stamped.name;
            }
            if (stamped.id && !isSeedChannelId(stamped.id)) {
                delete stamped.id;
            }
            const normalizedAuthority = normalizeIdentityAuthority(stamped.authority, stamped);
            if (normalizedAuthority) {
                stamped.authority = normalizedAuthority;
            } else {
                delete stamped.authority;
            }
            return stamped;
        };

    const seededIdentity = buildIdentityForCard(videoId, card);
    const initial = normalizeStampedIdentity(seededIdentity);
    const hasConfirmedInitialId = hasConfirmedVideoChannelMapping(videoId, initial?.id || '');

    if (initial.id) {
        // Seeded DOM/cache identity is cosmetic until it matches a confirmed video->channel mapping.
        stampChannelIdentity(card, {
            ...initial,
            authority: hasConfirmedInitialId ? 'confirmed' : 'hint'
        });
    }
    const hasStableSecondaryIdentity = (() => {
        if (!initial || typeof initial !== 'object') return false;
        if (!isSeedChannelId(initial.id)) return false;
        const safeName = sanitizeChannelNameForCard(initial.name || '', card);
        if (safeName && !hasCollapsedByline(safeName) && !isLikelyNonChannelName(safeName)) return true;
        const safeExpected = sanitizeChannelNameForCard(initial.expectedChannelName || '', card);
        if (safeExpected && !hasCollapsedByline(safeExpected) && !isLikelyNonChannelName(safeExpected)) return true;
        return false;
    })();
    if (hasConfirmedInitialId && hasStableSecondaryIdentity) return;

        // If we are still missing both map identity and rich fields, use a lightweight
        // main-world fallback (ytInitialData snapshot) before giving up.
        try {
            const ytInfo = await withTimeout(searchYtInitialDataForVideoChannel(videoId, null), PREFETCH_TIMEOUT_MS);
            if (ytInfo && (ytInfo.id || ytInfo.handle || ytInfo.customUrl || ytInfo.name || ytInfo.logo)) {
                if (!ytInfo.id && ytInfo.handle) {
                    const resolvedId = resolveIdFromHandle(ytInfo.handle);
                    if (resolvedId) {
                        ytInfo.id = resolvedId;
                    }
                }
                const merged = mergeIdentityObjects({
                    ...ytInfo,
                    authority: 'confirmed'
                }, seededIdentity);
                const finalIdentity = normalizeStampedIdentity(merged);
                if (finalIdentity.id || hasRichIdentity(finalIdentity)) {
                    stampChannelIdentity(card, finalIdentity);
                    if (finalIdentity.id) {
                        persistVideoChannelMapping(videoId, finalIdentity.id);
                    }
                }
            }
        } catch (e) {
            // keep silent in prefetch
        }
    } catch (e) {
        // keep silent in prefetch
    }
}

function stampChannelIdentity(card, info) {
    if (!card || !info) return;
    const normalizedId = Object.prototype.hasOwnProperty.call(info, 'id')
        ? normalizeSeedChannelId(info.id)
        : '';
    if (Object.prototype.hasOwnProperty.call(info, 'id')) {
        if (normalizedId) {
            setValidatedChannelId(card, normalizedId);
        } else {
            card.removeAttribute('data-filtertube-channel-id');
            card.removeAttribute('data-filtertube-channel-authority');
        }
    }
    const normalizedAuthority = normalizeIdentityAuthority(info.authority, {
        ...info,
        id: normalizedId || info.id || ''
    });
    if (normalizedAuthority) {
        card.setAttribute('data-filtertube-channel-authority', normalizedAuthority);
    } else if (normalizedId) {
        card.setAttribute('data-filtertube-channel-authority', 'confirmed');
    } else if (Object.prototype.hasOwnProperty.call(info, 'authority')) {
        card.removeAttribute('data-filtertube-channel-authority');
    }
    if (info.handle) card.setAttribute('data-filtertube-channel-handle', info.handle);
    if (info.customUrl) card.setAttribute('data-filtertube-channel-custom', info.customUrl);
    if (info.name) card.setAttribute('data-filtertube-channel-name', info.name);
    if (info.logo) card.setAttribute('data-filtertube-channel-logo', info.logo);
    if (info.source) card.setAttribute('data-filtertube-channel-source', info.source);
    if (info.fetchStrategy) card.setAttribute('data-filtertube-channel-fetch-strategy', info.fetchStrategy);
    if (info.expectedChannelName) card.setAttribute('data-filtertube-channel-expected-channel-name', info.expectedChannelName);

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

function clearChannelIdentityDisplayFields(card, { preserveId = false, preserveExpectedChannelName = false } = {}) {
    if (!card || typeof card.removeAttribute !== 'function') return;
    if (!preserveId) {
        card.removeAttribute('data-filtertube-channel-id');
        card.removeAttribute('data-filtertube-channel-authority');
    }
    card.removeAttribute('data-filtertube-channel-handle');
    card.removeAttribute('data-filtertube-channel-custom');
    card.removeAttribute('data-filtertube-channel-name');
    card.removeAttribute('data-filtertube-channel-logo');
    card.removeAttribute('data-filtertube-channel-source');
    card.removeAttribute('data-filtertube-channel-fetch-strategy');
    if (!preserveExpectedChannelName) {
        card.removeAttribute('data-filtertube-channel-expected-channel-name');
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
                card.removeAttribute('data-filtertube-channel-authority');
                card.removeAttribute('data-filtertube-channel-handle');
                card.removeAttribute('data-filtertube-channel-name');
                card.removeAttribute('data-filtertube-channel-custom');
                card.removeAttribute('data-filtertube-channel-logo');
                card.removeAttribute('data-filtertube-channel-source');
                card.removeAttribute('data-filtertube-channel-fetch-strategy');
                card.removeAttribute('data-filtertube-channel-expected-channel-name');
            }
        } catch (e) {
            card.removeAttribute('data-filtertube-channel-id');
            card.removeAttribute('data-filtertube-channel-authority');
            card.removeAttribute('data-filtertube-channel-handle');
            card.removeAttribute('data-filtertube-channel-name');
            card.removeAttribute('data-filtertube-channel-custom');
            card.removeAttribute('data-filtertube-channel-logo');
            card.removeAttribute('data-filtertube-channel-source');
            card.removeAttribute('data-filtertube-channel-fetch-strategy');
            card.removeAttribute('data-filtertube-channel-expected-channel-name');
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
    const normalizeVideoId = (value) => {
        if (!value || typeof value !== 'string') return '';
        const match = value.match(/[A-Za-z0-9_-]{11}/);
        return match ? match[0] : '';
    };
    const normalizeCandidateVideoId = (candidate) => {
        if (!candidate || typeof candidate !== 'string') return '';
        const fromWatchParam = candidate.match(/[?&]v=([A-Za-z0-9_-]{11})/i);
        if (fromWatchParam?.[1]) return fromWatchParam[1];
        const fromShorts = candidate.match(/\/shorts\/([A-Za-z0-9_-]{11})(?:$|[/?#])/i);
        if (fromShorts?.[1]) return fromShorts[1];
        const fromAny = candidate.match(/[A-Za-z0-9_-]{11}/);
        return fromAny ? fromAny[0] : '';
    };
    const normalizedTargetId = normalizeVideoId(videoId);
    if (!normalizedTargetId) return false;

    try {
        const anchors = card.querySelectorAll('a[href*="watch"], a[href*="/shorts/"]');
        if (!anchors || !anchors.length) return false;
        for (const anchor of anchors) {
            const href = anchor.getAttribute?.('href') || '';
            const normalizedHrefId = normalizeCandidateVideoId(href);
            if (normalizedHrefId && normalizedHrefId === normalizedTargetId) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function readCardChannelIdentity(card) {
    if (!card) return {};
    const rawId = card.getAttribute?.('data-filtertube-channel-id')
        || card.querySelector?.('[data-filtertube-channel-id]')?.getAttribute?.('data-filtertube-channel-id')
        || '';
    const rawHandle = card.getAttribute?.('data-filtertube-channel-handle')
        || card.querySelector?.('[data-filtertube-channel-handle]')?.getAttribute?.('data-filtertube-channel-handle')
        || '';
    const rawCustomUrl = card.getAttribute?.('data-filtertube-channel-custom')
        || card.querySelector?.('[data-filtertube-channel-custom]')?.getAttribute?.('data-filtertube-channel-custom')
        || '';
    const rawName = card.getAttribute?.('data-filtertube-channel-name')
        || card.querySelector?.('[data-filtertube-channel-name]')?.getAttribute?.('data-filtertube-channel-name')
        || '';
    const rawExpected = card.getAttribute?.('data-filtertube-channel-expected-channel-name')
        || card.querySelector?.('[data-filtertube-channel-expected-channel-name]')?.getAttribute?.('data-filtertube-channel-expected-channel-name')
        || '';
    const rawLogo = card.getAttribute?.('data-filtertube-channel-logo')
        || card.querySelector?.('[data-filtertube-channel-logo]')?.getAttribute?.('data-filtertube-channel-logo')
        || '';
    const rawSource = card.getAttribute?.('data-filtertube-channel-source')
        || card.querySelector?.('[data-filtertube-channel-source]')?.getAttribute?.('data-filtertube-channel-source')
        || '';
    const rawFetch = card.getAttribute?.('data-filtertube-channel-fetch-strategy')
        || card.querySelector?.('[data-filtertube-channel-fetch-strategy]')?.getAttribute?.('data-filtertube-channel-fetch-strategy')
        || '';
    const rawAuthority = card.getAttribute?.('data-filtertube-channel-authority')
        || card.querySelector?.('[data-filtertube-channel-authority]')?.getAttribute?.('data-filtertube-channel-authority')
        || '';

    return {
        id: normalizeSeedChannelId(rawId) || '',
        handle: normalizeHandleValue(rawHandle) || (typeof rawHandle === 'string' ? rawHandle.trim() : ''),
        customUrl: typeof rawCustomUrl === 'string' ? rawCustomUrl.trim() : '',
        name: typeof rawName === 'string' ? rawName.trim() : '',
        logo: typeof rawLogo === 'string' ? rawLogo.trim() : '',
        source: typeof rawSource === 'string' ? rawSource.trim() : '',
        fetchStrategy: typeof rawFetch === 'string' ? rawFetch.trim() : '',
        authority: normalizeIdentityAuthority(rawAuthority, { id: rawId }) || '',
        expectedChannelName: typeof rawExpected === 'string' ? rawExpected.trim() : ''
    };
}

function isRicherIdentity(candidate, current) {
    if (!candidate || typeof candidate !== 'object') return false;
    if (!current || typeof current !== 'object') {
        return hasRichIdentity(candidate);
    }
    if (candidate.id && isSeedChannelId(candidate.id) && candidate.id !== (current.id || '')) return true;
    if (candidate.handle && !current.handle) return true;
    if (candidate.customUrl && !current.customUrl) return true;
    if (
        candidate.name &&
        (!current.name || isLikelyNonChannelName(current.name) || hasCollapsedByline(current.name))
    ) return true;
    if (candidate.logo && !current.logo) return true;
    if (
        candidate.expectedChannelName &&
        (!current.expectedChannelName || isLikelyNonChannelName(current.expectedChannelName) || hasCollapsedByline(current.expectedChannelName))
    ) return true;
    return false;
}

function hasNonIdRichFields(identity) {
    if (!identity || typeof identity !== 'object') return false;
    if (identity.handle && normalizeHandleValue(identity.handle)) return true;
    if (identity.customUrl) return true;
    if (identity.logo) return true;
    const normalizedName = typeof identity.name === 'string' ? identity.name.trim() : '';
    const normalizedExpected = typeof identity.expectedChannelName === 'string' ? identity.expectedChannelName.trim() : '';
    if (normalizedName && !isLikelyNonChannelName(normalizedName) && !hasCollapsedByline(normalizedName)) return true;
    if (normalizedExpected && !isLikelyNonChannelName(normalizedExpected) && !hasCollapsedByline(normalizedExpected)) return true;
    return false;
}

function shouldStampCardForVideoId(card, videoId, options = {}) {
    if (!card || !videoId) return false;
    const normalizeVideoId = (value) => {
        if (!value || typeof value !== 'string') return '';
        const match = value.match(/[A-Za-z0-9_-]{11}/);
        return match ? match[0] : '';
    };
    const normalizedTargetId = normalizeVideoId(videoId);
    if (!normalizedTargetId) return false;
    const hasTargetLink = (() => {
        try {
            return cardContainsVideoIdLink(card, normalizedTargetId);
        } catch (e) {
            return false;
        }
    })();

    const incomingSeed = getSeedIdentityForVideoId(normalizedTargetId, card) || {};
    const existingIdentity = readCardChannelIdentity(card);
    const incomingProvidesRicherIdentity = isRicherIdentity(incomingSeed, existingIdentity);
    const incomingHasNonIdIdentity = hasNonIdRichFields(incomingSeed);
    const incomingHasAnyIdentity = Boolean(
        incomingSeed.id ||
        incomingHasNonIdIdentity
    );
    const hasExistingIdentity = Boolean(
        existingIdentity.id ||
        hasNonIdRichFields(existingIdentity)
    );
    const existingPartialOrPlaceholder = !hasNonIdRichFields(existingIdentity);
    const shouldRefreshForMismatch = incomingProvidesRicherIdentity || incomingHasAnyIdentity || existingPartialOrPlaceholder || options?.allowLooseMatch === true;
    const shouldPurgeDisplayFields = (
        incomingProvidesRicherIdentity ||
        incomingHasAnyIdentity ||
        existingPartialOrPlaceholder
    ) && (incomingProvidesRicherIdentity || existingPartialOrPlaceholder || !hasExistingIdentity);

    let liveVideoId = '';
    try {
        liveVideoId = normalizeVideoId(extractVideoIdFromCard(card) || '');
        if (!liveVideoId) {
            liveVideoId = normalizeVideoId(card.getAttribute?.('data-filtertube-video-id') || card.getAttribute?.('data-video-id') || '');
        }
    } catch (e) {
        liveVideoId = '';
    }

    if (liveVideoId) {
        if (liveVideoId !== normalizedTargetId) {
            if (hasTargetLink || shouldRefreshForMismatch || hasExistingIdentity || options?.allowLooseMatch === true) {
                resetCardIdentityIfStale(card, normalizedTargetId);
                return true;
            }
            if (incomingProvidesRicherIdentity || existingPartialOrPlaceholder || hasExistingIdentity || options?.allowLooseMatch === true) {
                resetCardIdentityIfStale(card, normalizedTargetId);
                return true;
            }
            resetCardIdentityIfStale(card, liveVideoId);
            return false;
        }
        if (shouldPurgeDisplayFields && hasExistingIdentity) {
            clearChannelIdentityDisplayFields(card, {
                preserveId: true,
                preserveExpectedChannelName: Boolean(
                    incomingSeed?.expectedChannelName ||
                    existingIdentity?.expectedChannelName
                )
            });
        }
        return true;
    }

    const stampedVideoId = normalizeVideoId(
        card.getAttribute?.('data-filtertube-video-id') ||
        card.getAttribute?.('data-video-id') ||
        ''
    );
    if (stampedVideoId && stampedVideoId !== normalizedTargetId) {
        if (hasTargetLink || shouldRefreshForMismatch || hasExistingIdentity || options?.allowLooseMatch === true) {
            resetCardIdentityIfStale(card, normalizedTargetId);
            return true;
        }
        if (incomingProvidesRicherIdentity || existingPartialOrPlaceholder || hasExistingIdentity || options?.allowLooseMatch === true) {
            resetCardIdentityIfStale(card, normalizedTargetId);
            return true;
        }
        resetCardIdentityIfStale(card, stampedVideoId);
        return false;
    }

    if (stampedVideoId === normalizedTargetId) {
        if (shouldPurgeDisplayFields && hasExistingIdentity) {
            clearChannelIdentityDisplayFields(card, { preserveId: true });
        }
        return true;
    }

    if (hasTargetLink) {
        if (shouldPurgeDisplayFields || options?.allowLooseMatch === true) {
            clearChannelIdentityDisplayFields(card, { preserveId: true });
            resetCardIdentityIfStale(card, normalizedTargetId);
        }
        return true;
    }

    // No live/anchor proof this card belongs to `videoId` yet.
    if (options?.allowLooseMatch === true && incomingProvidesRicherIdentity && (hasExistingIdentity || existingPartialOrPlaceholder)) {
        resetCardIdentityIfStale(card, normalizedTargetId);
        return true;
    }
    return options?.allowLooseMatch === true && !stampedVideoId;
}

function resolveIdFromHandle(handle) {
    if (!handle) return '';
    const normalized = normalizeHandleValue(handle);
    if (!normalized) return '';
    const map = currentSettings?.channelMap || {};
    const direct = normalizeSeedChannelId(map[normalized] || map[normalized.toLowerCase()]);
    if (direct) return direct;
    return '';
}

function persistVideoChannelMapping(videoId, channelId) {
    const normalizedVideoId = (typeof videoId === 'string' ? videoId.match(/[A-Za-z0-9_-]{11}/)?.[0] : '') || '';
    const normalizedChannelId = normalizeSeedChannelId(channelId);
    if (!normalizedVideoId || !normalizedChannelId) return;
    currentSettings = currentSettings || {};
    currentSettings.videoChannelMap = currentSettings.videoChannelMap || {};
    currentSettings.videoChannelMap[normalizedVideoId] = normalizedChannelId;
    browserAPI_BRIDGE.runtime.sendMessage({
        action: 'updateVideoChannelMap',
        videoId: normalizedVideoId,
        channelId: normalizedChannelId
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
const COLLAB_NON_CHANNEL_LABEL_PATTERN = /^(?:not interested|send feedback|save(?:\s+to(?:\s+playlist|\s+watch\s+later)?)?|share|report|undo|action menu|channel|block channel|filter all)$/i;
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

function normalizeUcIdForCollaborator(value) {
    const raw = typeof value === 'string' ? value.trim() : '';
    return /^UC[\w-]{22}$/i.test(raw) ? raw : '';
}

function normalizeCustomUrlForCollaborator(value) {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toLowerCase().replace(/^\/+/, '').replace(/\/+$/, '');
}

function lookupChannelMapAlias(key) {
    const normalizedKey = typeof key === 'string' ? key.trim().toLowerCase() : '';
    if (!normalizedKey) return '';
    const map = currentSettings?.channelMap || {};
    const direct = typeof map[normalizedKey] === 'string' ? map[normalizedKey].trim() : '';
    if (direct) return direct;
    // Defensive: some entries may be stored as original-cased keys.
    const original = typeof map[key] === 'string' ? map[key].trim() : '';
    return original || '';
}

function resolveMappedIdForHandle(handle) {
    const normalizedHandle = normalizeHandleValue(handle || '');
    if (!normalizedHandle) return '';
    const mappedId = normalizeUcIdForCollaborator(lookupChannelMapAlias(normalizedHandle));
    if (!mappedId) return '';
    const mappedHandle = normalizeHandleValue(lookupChannelMapAlias(mappedId));
    if (mappedHandle && mappedHandle !== normalizedHandle) return '';
    return mappedId;
}

function resolveMappedHandleForId(id) {
    const normalizedId = normalizeUcIdForCollaborator(id || '');
    if (!normalizedId) return '';
    const mappedHandle = normalizeHandleValue(lookupChannelMapAlias(normalizedId));
    if (!mappedHandle) return '';
    const mappedId = normalizeUcIdForCollaborator(lookupChannelMapAlias(mappedHandle));
    if (mappedId && mappedId !== normalizedId) return '';
    return mappedHandle;
}

function extractPlaylistIdFromHref(href) {
    const value = typeof href === 'string' ? href.trim() : '';
    if (!value || !/playlist\?list=/i.test(value)) return '';
    try {
        const parsed = new URL(value, location.origin);
        return parsed.searchParams.get('list') || '';
    } catch (e) {
        const qs = value.split('?')[1] || '';
        const params = new URLSearchParams(qs);
        return params.get('list') || '';
    }
}

function extractPlaylistIdFromElement(root) {
    if (!root?.querySelector) return '';
    const anchor = root.querySelector('a[href^="/playlist?list="], a[href*="/playlist?list="]');
    const href = anchor?.getAttribute?.('href') || anchor?.href || '';
    return extractPlaylistIdFromHref(href);
}

function getCollaboratorKey(channelInfo) {
    if (!channelInfo) return '';
    const id = normalizeUcIdForCollaborator(channelInfo.id || '');
    const handle = normalizeHandleValue(channelInfo.handle || channelInfo.canonicalHandle || channelInfo.handleDisplay || '');
    const customUrl = normalizeCustomUrlForCollaborator(channelInfo.customUrl || '');
    const name = normalizeCollaboratorName(channelInfo.name || '');

    const mappedIdFromHandle = handle ? resolveMappedIdForHandle(handle) : '';
    const canonicalId = id || mappedIdFromHandle;
    if (canonicalId) return canonicalId.toLowerCase();
    if (handle) return handle.toLowerCase();
    if (customUrl) return customUrl;
    return name;
}

function getAdaptiveMenuCopy() {
    let compact = false;
    try {
        const host = String(location?.hostname || '').toLowerCase();
        const mobileHost = host.startsWith('m.youtube.');
        const narrowViewport = (window.innerWidth || 0) > 0 && (window.innerWidth || 0) <= 420;
        compact = Boolean(mobileHost || narrowViewport);
    } catch (e) {
        compact = false;
    }
    return {
        block: 'Block',
        filterAllToggle: compact ? 'All' : 'Filter All',
        fallbackBlock: compact ? 'Block' : 'Block channel',
        fallbackBlockAll: compact ? 'Block + All' : 'Block channel (Filter All)',
        pendingAll: compact ? 'All (pending…)' : 'Block All (pending…)'
    };
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
    const totalCount = Math.max(state.expectedTotal || 0, state.total || 0);

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

    if (totalCount > 0) {
        const clampedSelected = Math.min(selectedCount, totalCount);
        const counterLabel = `🤝 ${clampedSelected}/${totalCount}`;
        setTitleParts(selectedCount > 0 ? 'Done' : (state.defaultLabel || 'Block'), counterLabel);
        if (selectedCount > 0) {
            state.blockAllItem.setAttribute('data-is-done-button', 'true');
            state.blockAllItem.classList.add('filtertube-multistep-ready');
        } else {
            state.blockAllItem.removeAttribute('data-is-done-button');
            state.blockAllItem.classList.remove('filtertube-multistep-ready');
        }
    } else if (selectedCount > 0) {
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

    // Keep n in "k/n" synced with the card's currently known collaborator total.
    // Prefer active dropdown/card context, then fall back to rendered rows.
    state.total = collaboratorItems.length;
    try {
        const videoId = state.dropdown.getAttribute('data-filtertube-collab-video-id') || '';
        const context = videoId ? activeCollaborationDropdowns.get(videoId) : null;
        const contextExpected = parseInt(context?.expectedCount || '0', 10) || 0;
        const cardExpected = parseInt(context?.videoCard?.getAttribute?.('data-filtertube-expected-collaborators') || '0', 10) || 0;
        const infoExpected = parseInt(context?.channelInfo?.expectedCollaboratorCount || '0', 10) || 0;
        state.expectedTotal = Math.max(
            state.total || 0,
            state.expectedTotal || 0,
            contextExpected,
            cardExpected,
            infoExpected
        );
    } catch (e) {
        state.expectedTotal = Math.max(state.total || 0, state.expectedTotal || 0);
    }

    updateMultiStepActionLabel(state);
}

function setupMultiStepMenu(dropdown, groupId, collaborators = [], blockAllItemRef = null, expectedTotal = 0) {
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
        expectedTotal: Math.max(expectedTotal || 0, collaborators.length),
        selected: new Set(),
        // --- FIX: Initialize state properties ---
        filterAllMap: new Map(),
        // ---------------------------------------
        blockAllItem,
        collaborators,
        defaultLabel: blockAllItem?.querySelector('.filtertube-menu-label')?.textContent || 'Block',
        defaultChannelName: blockAllItem?.querySelector('.filtertube-channel-name')?.textContent ||
            `All ${Math.max(expectedTotal || 0, collaborators.length)} Collaborators`
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
    return COLLAB_PLACEHOLDER_NAME_PATTERN.test(normalized) || COLLAB_NON_CHANNEL_LABEL_PATTERN.test(normalized);
}

function buildCollaboratorAliasKeys(collaborator) {
    if (!collaborator || typeof collaborator !== 'object') return [];

    const keys = [];
    const addKey = (type, value) => {
        const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
        if (!normalized) return;
        const key = `${type}:${normalized}`;
        if (!keys.includes(key)) keys.push(key);
    };

    const normalizedId = normalizeUcIdForCollaborator(collaborator.id || '');
    const normalizedHandle = normalizeHandleValue(collaborator.handle || '');
    const normalizedCustom = normalizeCustomUrlForCollaborator(collaborator.customUrl || '');
    const normalizedName = normalizeCollaboratorName(collaborator.name || '');

    if (normalizedId) {
        addKey('id', normalizedId);
        const mappedHandle = resolveMappedHandleForId(normalizedId);
        if (mappedHandle) addKey('handle', mappedHandle);
    }
    if (normalizedHandle) {
        addKey('handle', normalizedHandle);
        const mappedId = resolveMappedIdForHandle(normalizedHandle);
        if (mappedId) addKey('id', mappedId);
    }
    if (normalizedCustom) addKey('custom', normalizedCustom);
    if (normalizedName) addKey('name', normalizedName);

    return keys;
}

function mergeCollaboratorIdentity(target, incoming) {
    if (!target || !incoming) return target;
    if (!target.id && incoming.id) target.id = incoming.id;
    if (!target.handle && incoming.handle) target.handle = incoming.handle;
    if (!target.customUrl && incoming.customUrl) target.customUrl = incoming.customUrl;
    if (!target.name && incoming.name) target.name = incoming.name;

    // Prefer keeping a human-readable non-handle name when both exist.
    const targetLooksHandle = typeof target.name === 'string' && target.name.trim().startsWith('@');
    const incomingLooksDisplayName = typeof incoming.name === 'string'
        && incoming.name.trim()
        && !incoming.name.trim().startsWith('@')
        && !COLLAB_NON_CHANNEL_LABEL_PATTERN.test(incoming.name.trim().toLowerCase());
    if (targetLooksHandle && incomingLooksDisplayName) {
        target.name = incoming.name.trim();
    }
    const targetLooksWeakId = typeof target.name === 'string' && (
        /^UC[\w-]{22}$/i.test(target.name.trim()) ||
        /^[a-zA-Z0-9_-]{11}$/.test(target.name.trim()) ||
        /^watch:[a-zA-Z0-9_-]{11}$/i.test(target.name.trim())
    );
    if (targetLooksWeakId && incomingLooksDisplayName) {
        target.name = incoming.name.trim();
    }

    return target;
}

function sanitizeCollaboratorList(collaborators = [], card = null) {
    if (!Array.isArray(collaborators)) return [];
    const sanitized = [];
    const aliasToIndex = new Map();

    collaborators.forEach(collab => {
        if (!collab || typeof collab !== 'object') return;
        const normalized = {
            name: sanitizeChannelNameForCard(collab.name || '', card),
            handle: normalizeHandleValue(collab.handle),
            id: normalizeUcIdForCollaborator(collab.id || ''),
            customUrl: normalizeCustomUrlForCollaborator(collab.customUrl || '')
        };

        if (normalized.handle && !normalized.id) {
            const mappedId = resolveMappedIdForHandle(normalized.handle);
            if (mappedId) normalized.id = mappedId;
        }
        if (normalized.id && normalized.handle) {
            const mappedIdFromHandle = resolveMappedIdForHandle(normalized.handle);
            if (mappedIdFromHandle && mappedIdFromHandle !== normalized.id) {
                // Handle alias conflicts with explicit UC ID. Keep UC ID as canonical identity.
                normalized.handle = '';
            }
        }

        if (!normalized.name && !normalized.handle && !normalized.id && !normalized.customUrl) return;
        if (isPlaceholderCollaboratorEntry(normalized)) return;

        const aliasKeys = buildCollaboratorAliasKeys(normalized);
        if (aliasKeys.length === 0) return;

        let existingIndex = -1;
        for (const key of aliasKeys) {
            if (!aliasToIndex.has(key)) continue;
            existingIndex = aliasToIndex.get(key);
            break;
        }

        if (existingIndex !== -1) {
            const merged = mergeCollaboratorIdentity(sanitized[existingIndex], normalized);
            sanitized[existingIndex] = merged;
            const mergedKeys = buildCollaboratorAliasKeys(merged);
            mergedKeys.forEach((key) => aliasToIndex.set(key, existingIndex));
            return;
        }

        const nextIndex = sanitized.length;
        sanitized.push(normalized);
        aliasKeys.forEach((key) => aliasToIndex.set(key, nextIndex));
    });

    // If we already have a strong UC-ID roster, drop handle-only aliases that map to a different UC.
    // This prevents VEVO/main-handle alias noise from inflating collaborator counts.
    const ucIdSet = new Set(
        sanitized
            .map((entry) => normalizeUcIdForCollaborator(entry?.id || '').toLowerCase())
            .filter(Boolean)
    );
    if (ucIdSet.size >= 2) {
        return sanitized.filter((entry) => {
            if (!entry || typeof entry !== 'object') return false;
            if (entry.id) return true;
            const mappedId = resolveMappedIdForHandle(entry.handle || '');
            if (!mappedId) return true;
            return ucIdSet.has(mappedId.toLowerCase());
        });
    }

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

    const normalizedText = rawText
        .replace(/\u00a0/g, ' ')
        .replace(/\u2068|\u2069/g, '')
        .replace(/([A-Za-z0-9])and\s+(\d+\s+more\b)/gi, '$1 and $2')
        .replace(/([A-Za-z0-9])and\s+(more\b)/gi, '$1 and $2')
        .replace(/[،，﹐､]/g, ',')
        .replace(/\s+/g, ' ')
        .trim();

    const tokens = normalizedText.split(/\s+(?:and|&)\s+/i);
    const names = [];
    let hasHidden = COLLAB_MULTI_MORE_PATTERN.test(normalizedText);
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
                const countMatch = lower.match(/(\d+)\s*more/);
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
    const seedIdentity = getSeedIdentityForVideoId(videoId, null) || {};
    if (seedIdentity.name) expectedNames.push(seedIdentity.name);
    if (seedIdentity.expectedChannelName && !expectedNames.includes(seedIdentity.expectedChannelName)) {
        expectedNames.push(seedIdentity.expectedChannelName);
    }
    if (seedIdentity.handle) expectedHandles.push(seedIdentity.handle);
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

        // Stamp primary collaborator identity so menu injection and quick-block labels
        // stay stable even when DOM avatar stacks are absent.
        const primary = sanitized[0] || null;
        if (primary) {
            const identity = {};
            if (typeof primary.id === 'string' && /^UC[\w-]{22}$/i.test(primary.id.trim())) {
                identity.id = primary.id.trim();
            }
            if (typeof primary.handle === 'string' && primary.handle.trim()) {
                identity.handle = normalizeHandleValue(primary.handle);
            }
            if (typeof primary.customUrl === 'string' && primary.customUrl.trim()) {
                identity.customUrl = primary.customUrl.trim();
            }
            if (typeof primary.name === 'string' && primary.name.trim() && !isLikelyNonChannelName(primary.name)) {
                identity.name = primary.name.trim();
            }
            if (Object.keys(identity).length > 0) {
                stampChannelIdentity(card, identity);
            }
            if (identity.id) {
                persistVideoChannelMapping(videoId, identity.id);
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
        const primary = sanitized[0] || null;
        if (primary) {
            const identity = {};
            if (typeof primary.id === 'string' && /^UC[\w-]{22}$/i.test(primary.id.trim())) {
                identity.id = primary.id.trim();
            }
            if (typeof primary.handle === 'string' && primary.handle.trim()) {
                identity.handle = normalizeHandleValue(primary.handle);
            }
            if (typeof primary.customUrl === 'string' && primary.customUrl.trim()) {
                identity.customUrl = primary.customUrl.trim();
            }
            if (typeof primary.name === 'string' && primary.name.trim() && !isLikelyNonChannelName(primary.name)) {
                identity.name = primary.name.trim();
            }
            if (Object.keys(identity).length > 0) {
                stampChannelIdentity(card, identity);
            }
            if (identity.id) {
                persistVideoChannelMapping(videoId, identity.id);
            }
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

    const unwrapKnownRenderer = (source) => {
        if (!source || typeof source !== 'object') return source;

        if (source.content?.videoRenderer) {
            return source.content.videoRenderer;
        }
        if (source.content?.lockupViewModel) {
            return source.content.lockupViewModel;
        }
        if (source.content?.playlistPanelVideoRenderer) {
            return source.content.playlistPanelVideoRenderer;
        }
        if (source.content?.compactPlaylistRenderer) {
            return source.content.compactPlaylistRenderer;
        }
        if (source.content?.playlistVideoRenderer) {
            return source.content.playlistVideoRenderer;
        }
        if (source.richItemRenderer?.content?.videoRenderer) {
            return source.richItemRenderer.content.videoRenderer;
        }
        if (source.richItemRenderer?.content?.lockupViewModel) {
            return source.richItemRenderer.content.lockupViewModel;
        }
        if (source.richItemRenderer?.content?.playlistPanelVideoRenderer) {
            return source.richItemRenderer.content.playlistPanelVideoRenderer;
        }
        if (source.richItemRenderer?.content?.compactPlaylistRenderer) {
            return source.richItemRenderer.content.compactPlaylistRenderer;
        }
        if (source.richItemRenderer?.content?.playlistVideoRenderer) {
            return source.richItemRenderer.content.playlistVideoRenderer;
        }
        if (source.data?.content?.videoRenderer) {
            return source.data.content.videoRenderer;
        }
        if (source.data?.content?.lockupViewModel) {
            return source.data.content.lockupViewModel;
        }
        if (source.data?.content?.playlistPanelVideoRenderer) {
            return source.data.content.playlistPanelVideoRenderer;
        }
        if (source.data?.content?.compactPlaylistRenderer) {
            return source.data.content.compactPlaylistRenderer;
        }
        if (source.data?.content?.playlistVideoRenderer) {
            return source.data.content.playlistVideoRenderer;
        }
        if (source.data?.videoRenderer) {
            return source.data.videoRenderer;
        }
        if (source.data?.lockupViewModel) {
            return source.data.lockupViewModel;
        }
        if (source.data?.playlistPanelVideoRenderer) {
            return source.data.playlistPanelVideoRenderer;
        }
        if (source.data?.compactPlaylistRenderer) {
            return source.data.compactPlaylistRenderer;
        }
        if (source.data?.playlistVideoRenderer) {
            return source.data.playlistVideoRenderer;
        }
        if (source.videoRenderer) {
            return source.videoRenderer;
        }
        if (source.lockupViewModel) {
            return source.lockupViewModel;
        }
        if (source.playlistPanelVideoRenderer) {
            return source.playlistPanelVideoRenderer;
        }
        if (source.compactPlaylistRenderer) {
            return source.compactPlaylistRenderer;
        }
        if (source.playlistVideoRenderer) {
            return source.playlistVideoRenderer;
        }
        return source;
    };

    const extractListItemsFromSheetLikeCommand = (command) => {
        if (!command || typeof command !== 'object') return [];
        const listItems =
            command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems ||
            command?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems ||
            command?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel?.content?.listViewModel?.listItems ||
            command?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel?.listViewModel?.listItems ||
            command?.dialog?.presenterDialogViewModel?.content?.listViewModel?.listItems ||
            command?.dialog?.presenterDialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.dialog?.presenterDialogViewModel?.listViewModel?.listItems ||
            command?.dialog?.dialogViewModel?.content?.listViewModel?.listItems ||
            command?.dialog?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.dialog?.dialogViewModel?.listViewModel?.listItems ||
            command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems ||
            command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems ||
            command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems ||
            command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems ||
            command?.showDialogCommand?.dialog?.presenterDialogViewModel?.content?.listViewModel?.listItems ||
            command?.showDialogCommand?.dialog?.presenterDialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.showDialogCommand?.dialog?.dialogViewModel?.content?.listViewModel?.listItems ||
            command?.showDialogCommand?.dialog?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.showDialogCommand?.dialog?.dialogViewModel?.listViewModel?.listItems ||
            command?.showSheetCommand?.presenterDialogViewModel?.content?.listViewModel?.listItems ||
            command?.showSheetCommand?.presenterDialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.showDialogCommand?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.showDialogCommand?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems ||
            command?.showSheetCommand?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems ||
            command?.showSheetCommand?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems ||
            command?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel?.customContent?.listViewModel?.listItems ||
            [];
        return Array.isArray(listItems) ? listItems : [];
    };

    const extractFromSheetLikeCommand = (sheetCommand) => {
        const listItems = extractListItemsFromSheetLikeCommand(sheetCommand);
        if (!Array.isArray(listItems) || listItems.length === 0) return [];

        const parseCustomUrl = (value) => {
            if (!value || typeof value !== 'string') return '';
            const match = value.match(/\/(c|user)\/([^/?#]+)/);
            if (!match || !match[1] || !match[2]) return '';
            try {
                return `${match[1]}/${decodeURIComponent(match[2])}`;
            } catch (e) {
                return `${match[1]}/${match[2]}`;
            }
        };

        const pickBrowseEndpoint = (viewModel) => {
            if (!viewModel || typeof viewModel !== 'object') return null;
            const fromContext = (
                viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint ||
                viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                viewModel?.rendererContext?.commandContext?.onTap?.browseEndpoint ||
                null
            );
            const commandRuns = Array.isArray(viewModel?.title?.commandRuns) ? viewModel.title.commandRuns : [];
            let fromTitleRuns = null;
            for (const run of commandRuns) {
                const browse =
                    run?.onTap?.innertubeCommand?.browseEndpoint ||
                    run?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                    run?.onTap?.browseEndpoint ||
                    null;
                if (browse) {
                    fromTitleRuns = browse;
                    break;
                }
            }
            const normalizeUc = (value) => {
                const raw = typeof value === 'string' ? value.trim() : '';
                return /^UC[\w-]{22}$/i.test(raw) ? raw : '';
            };
            const contextId = normalizeUc(fromContext?.browseId || '');
            const titleId = normalizeUc(fromTitleRuns?.browseId || '');
            const idsConflict = Boolean(contextId && titleId && contextId !== titleId);
            const preferred = idsConflict ? fromContext : (fromTitleRuns || fromContext);
            if (!preferred) return null;
            return {
                ...(fromContext || {}),
                ...(fromTitleRuns || {}),
                browseId: idsConflict
                    ? (fromContext?.browseId || '')
                    : (fromTitleRuns?.browseId || fromContext?.browseId || ''),
                canonicalBaseUrl: idsConflict
                    ? (fromContext?.canonicalBaseUrl || '')
                    : (fromTitleRuns?.canonicalBaseUrl || fromContext?.canonicalBaseUrl || ''),
                __idsConflict: idsConflict
            };
        };

        const pickMetadataUrl = (viewModel) => {
            const directUrl = viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url ||
                viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.command?.commandMetadata?.webCommandMetadata?.url ||
                '';
            if (directUrl) return directUrl;
            const commandRuns = Array.isArray(viewModel?.title?.commandRuns) ? viewModel.title.commandRuns : [];
            for (const run of commandRuns) {
                const candidate = run?.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url ||
                    run?.onTap?.innertubeCommand?.command?.commandMetadata?.webCommandMetadata?.url ||
                    run?.onTap?.commandMetadata?.webCommandMetadata?.url ||
                    '';
                if (candidate) return candidate;
            }
            return '';
        };

        const collaborators = [];
        for (const item of listItems) {
            const viewModel = item?.listItemViewModel;
            if (!viewModel) continue;

            const browseEndpoint = pickBrowseEndpoint(viewModel);
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

            if (!collab.customUrl) {
                const metadataUrl = pickMetadataUrl(viewModel);
                const parsedCustom = parseCustomUrl(metadataUrl);
                if (parsedCustom) {
                    collab.customUrl = parsedCustom;
                }
            }

            if (browseEndpoint?.browseId?.startsWith?.('UC')) {
                collab.id = browseEndpoint.browseId;
            }

            if (!collab.handle && viewModel.subtitle?.content) {
                const extracted = extractRawHandle(viewModel.subtitle.content);
                if (extracted) {
                    collab.handle = normalizeHandleValue(extracted);
                }
            }

            if (browseEndpoint?.__idsConflict && collab.id && collab.handle) {
                // Conflicting IDs in the same collaborator row (seen on some VEVO/music cards):
                // keep UC ID as canonical identity and drop handle alias from the conflicting path.
                collab.handle = '';
            }

            if (collab.name || collab.handle || collab.id) {
                collaborators.push(collab);
            }
        }

        return collaborators;
    };

    let renderer = unwrapKnownRenderer(rendererCandidate);

    if (!renderer || typeof renderer !== 'object') return [];

    const collaborators = [];
    const byline = renderer.shortBylineText || renderer.longBylineText;
    const runs = Array.isArray(byline?.runs) ? byline.runs : [];

    for (const run of runs) {
        const showSheetCommand = run.navigationEndpoint?.showSheetCommand;
        const showDialogCommand = run.navigationEndpoint?.showDialogCommand;
        const sheetLikeCommand = showSheetCommand || showDialogCommand;
        if (!sheetLikeCommand) continue;

        const listItems = extractListItemsFromSheetLikeCommand(sheetLikeCommand);
        if (!Array.isArray(listItems) || listItems.length === 0) continue;

        const extracted = extractFromSheetLikeCommand(sheetLikeCommand);
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

            const sheetLikeCommand = node.showSheetCommand || node.showDialogCommand;
            if (sheetLikeCommand) {
                const extracted = extractFromSheetLikeCommand(sheetLikeCommand);
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
        card.data?.content?.playlistPanelVideoRenderer,
        card.data?.content?.compactPlaylistRenderer,
        card.data?.content?.playlistVideoRenderer,
        card.data?.richItemRenderer?.content?.playlistPanelVideoRenderer,
        card.data?.richItemRenderer?.content?.compactPlaylistRenderer,
        card.data?.richItemRenderer?.content?.playlistVideoRenderer,
        card.__data,
        card.__data?.data,
        card.__data?.item,
        card.__data?.data?.content,
        card.__data?.data?.content?.videoRenderer,
        card.__data?.data?.content?.lockupViewModel,
        card.__data?.data?.content?.playlistPanelVideoRenderer,
        card.__data?.data?.content?.compactPlaylistRenderer,
        card.__data?.data?.content?.playlistVideoRenderer,
        card.__data?.data?.richItemRenderer?.content?.playlistPanelVideoRenderer,
        card.__data?.data?.richItemRenderer?.content?.compactPlaylistRenderer,
        card.__data?.data?.richItemRenderer?.content?.playlistVideoRenderer,
        card.__data?.richItemRenderer?.content?.playlistPanelVideoRenderer,
        card.__data?.richItemRenderer?.content?.compactPlaylistRenderer,
        card.__data?.richItemRenderer?.content?.playlistVideoRenderer
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
                const merged = mergeCollaboratorLists(existing, sanitized);
                const candidates = [sanitized, existing, merged];
                bestList = candidates.reduce((best, candidate) => {
                    if (!Array.isArray(candidate) || candidate.length === 0) return best;
                    if (!Array.isArray(best) || best.length === 0) return candidate;
                    if (candidate.length > best.length) return candidate;
                    if (candidate.length < best.length) return best;
                    return getCollaboratorListQuality(candidate) > getCollaboratorListQuality(best)
                        ? candidate
                        : best;
                }, bestList);
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
        const missingAlternateIdentity = collaborators.some(c =>
            Boolean(c?.id) &&
            !c?.handle &&
            !c?.customUrl &&
            !/\s-\stopic$/i.test(String(c?.name || '').trim())
        );
        const needsMoreCollaborators = expectedCollaboratorCount > 0 && collaborators.length < expectedCollaboratorCount;
        if (missingIdentifiers || missingAlternateIdentity || needsMoreCollaborators) {
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
        const channelId = typeof options?.channelId === 'string' ? options.channelId.trim() : '';

        const timeoutId = setTimeout(() => {
            const pending = window.pendingChannelInfoRequests.get(requestId);
            if (pending) {
                window.pendingChannelInfoRequests.delete(requestId);
                console.log('FilterTube: Channel info request timed out for video/channel:', videoId || 'n/a', channelId || 'n/a');
                resolve(null);
            }
        }, timeoutMs);

        window.pendingChannelInfoRequests.set(requestId, { resolve, timeoutId, videoId, channelId });

        const sendRequest = () => {
            window.postMessage({
                type: 'FilterTube_RequestChannelInfo',
                payload: {
                    videoId,
                    channelId: channelId || null,
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

        console.log('FilterTube: Sent channel info request to Main World for video/channel:', videoId || 'n/a', channelId || 'n/a', 'expectedName:', options.expectedName || 'n/a');
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
        if (!match && normalizedId) {
            match = tryMatch(candidate => candidate.id && candidate.id.toLowerCase() === normalizedId);
        }
        if (!match && normalizedHandle) {
            match = tryMatch(candidate => {
                const candidateHandle = candidate.handle && candidate.handle.toLowerCase();
                if (!candidateHandle || candidateHandle !== normalizedHandle) return false;
                if (!normalizedId) return true;
                const candidateId = candidate.id && candidate.id.toLowerCase();
                return !candidateId || candidateId === normalizedId;
            });
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
        const expectedNames = [];
        const expectedHandles = [];
        const seenNames = new Set();
        const seenHandles = new Set();

        const pushHint = (name, handle) => {
            if (typeof name === 'string') {
                const normalized = name.trim();
                const lowered = normalized.toLowerCase();
                if (normalized && !seenNames.has(lowered)) {
                    expectedNames.push(normalized);
                    seenNames.add(lowered);
                }
            }
            if (typeof handle === 'string') {
                const normalized = normalizeHandleValue(handle) || '';
                if (normalized && !seenHandles.has(normalized)) {
                    expectedHandles.push(normalized);
                    seenHandles.add(normalized);
                }
            }
        };

        pushHint(initialChannelInfo.name, initialChannelInfo.handle);
        pushHint(initialChannelInfo.expectedChannelName, initialChannelInfo.expectedHandle);
        pushHint(initialChannelInfo.seededFromVideo?.expectedChannelName, initialChannelInfo.seededFromVideo?.handle);
        pushHint(initialChannelInfo.seededFromVideo?.name, initialChannelInfo.seededFromVideo?.handle);

        const seededIdentity = getSeedIdentityForVideoId(initialChannelInfo.videoId, null) || {};
        pushHint(seededIdentity.name, seededIdentity.handle);
        pushHint(seededIdentity.expectedChannelName, seededIdentity.handle);
        if (Array.isArray(initialChannelInfo.allCollaborators)) {
            for (const collaborator of initialChannelInfo.allCollaborators) {
                if (!collaborator || typeof collaborator !== 'object') continue;
                pushHint(collaborator.name, collaborator.handle);
            }
        }

        const mainWorldCollaborators = await requestCollaboratorInfoFromMainWorld(
            initialChannelInfo.videoId,
            {
                expectedNames,
                expectedHandles
            }
        );
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
    } else if (type === 'FilterTube_UpdateVideoChannelMap' || type === 'FilterTube_UpdateVideoIdentityHint') {
        // Persist learned videoId → channelId mappings (Kids browse/search + player payloads)
        // `FilterTube_UpdateVideoIdentityHint` is cosmetic only and must not complete the authoritative pipeline.
        const isAuthoritativeVideoMap = type === 'FilterTube_UpdateVideoChannelMap';
        const updates = Array.isArray(payload) ? payload : (payload ? [payload] : []);
        let didPersist = false;
        const normalizeCustomUrlKey = (value) => {
            if (!value || typeof value !== 'string') return '';
            const raw = value.trim();
            if (!raw) return '';
            const direct = raw.match(/^(c|user)\/([^/?#]+)/i);
            if (direct && direct[1] && direct[2]) {
                try {
                    return `${direct[1].toLowerCase()}/${decodeURIComponent(direct[2]).toLowerCase()}`;
                } catch (e) {
                    return `${direct[1].toLowerCase()}/${direct[2].toLowerCase()}`;
                }
            }
            const fromPath = raw.match(/\/(c|user)\/([^/?#]+)/i);
            if (fromPath && fromPath[1] && fromPath[2]) {
                try {
                    return `${fromPath[1].toLowerCase()}/${decodeURIComponent(fromPath[2]).toLowerCase()}`;
                } catch (e) {
                    return `${fromPath[1].toLowerCase()}/${fromPath[2].toLowerCase()}`;
                }
            }
            return '';
        };
        const persistCustomUrlMapping = (customUrlKey, id) => {
            if (!customUrlKey || !id) return;
            try {
                browserAPI_BRIDGE.storage.local.get(['channelMap'], (result) => {
                    const channelMap = result?.channelMap || {};
                    if (!channelMap[customUrlKey] || channelMap[customUrlKey] !== id) {
                        channelMap[customUrlKey] = id;
                        browserAPI_BRIDGE.storage.local.set({ channelMap }, () => { });
                    }
                });
            } catch (e) {
            }
        };
        const normalizeVideoIdFromPayload = (value) => {
            if (!value || typeof value !== 'string') return '';
            const match = value.match(/[A-Za-z0-9_-]{11}/);
            return match ? match[0] : '';
        };
        const normalizeCardVideoId = (value) => {
            if (!value || typeof value !== 'string') return '';
            const match = value.match(/[A-Za-z0-9_-]{11}/);
            return match ? match[0] : '';
        };

        const collectCardsForVideoId = (videoId) => {
            const targetVideoId = normalizeCardVideoId(videoId);
            if (!targetVideoId) return [];
            const cards = new Set();
            const addCard = (candidate) => {
                if (!candidate || !(candidate instanceof Element)) return;
                const card = (typeof findVideoCardElement === 'function' && candidate !== document.documentElement)
                    ? findVideoCardElement(candidate)
                    : candidate;
                if (card && card instanceof Element) {
                    cards.add(card);
                }
            };

            try {
                const directSelectors = [
                    `[data-filtertube-video-id="${targetVideoId}"]`,
                    `[data-video-id="${targetVideoId}"]`
                ];
                for (const selector of directSelectors) {
                    document.querySelectorAll(selector).forEach?.(addCard);
                }
            } catch (e) {
            }

            try {
                const anchorSelectors = [
                    `a[href*="watch?v=${targetVideoId}"]`,
                    `a[href*="/watch?v=${targetVideoId}"]`,
                    `a[href*="/shorts/${targetVideoId}"]`,
                    `a[href*="/watch/${targetVideoId}"]`,
                    `a[href="/watch/${targetVideoId}"]`
                ];
                const anchors = document.querySelectorAll(anchorSelectors.join(','));
                anchors?.forEach?.(addCard);
            } catch (e) {
            }

            if (cards.size === 0) {
                const fallbackSelectors = [
                    'ytd-playlist-panel-video-wrapper-renderer',
                    'ytd-playlist-panel-video-renderer',
                    'ytd-watch-next-secondary-results-renderer',
                    '.ytd-watch-next-secondary-results-renderer',
                    'ytd-watch-next-secondary-results-renderer',
                    'yt-lockup-view-model',
                    '.yt-lockup-view-model',
                    'ytd-lockup-view-model',
                    'ytm-playlist-panel-video-renderer',
                    'ytm-video-with-context-renderer',
                    '.ytmPlaylistPanelVideoRendererV2Host',
                    '.ytmCompactMediaItemRenderer'
                ];
                const fallbackCards = new Set();
                for (const selector of fallbackSelectors) {
                    try {
                        document.querySelectorAll(selector).forEach?.(node => fallbackCards.add(node));
                    } catch (e) {
                    }
                }
                try {
                    const hintedCards = document.querySelectorAll('[data-filtertube-video-id], [data-video-id]');
                    hintedCards?.forEach?.(node => fallbackCards.add(node));
                } catch (e) {
                }

                for (const node of fallbackCards) {
                    try {
                        const videoIdFromNode = normalizeCardVideoId(
                            extractVideoIdFromCard(node) ||
                            node.getAttribute?.('data-filtertube-video-id') ||
                            node.getAttribute?.('data-video-id') ||
                            ''
                        );
                        const hasMatchingLink = cardContainsVideoIdLink(node, targetVideoId);
                        if (videoIdFromNode === targetVideoId || hasMatchingLink) {
                            addCard(node);
                        }
                    } catch (e) {
                    }
                }
            }

            return Array.from(cards);
        };

        const applyVideoIdentityFromMessage = (videoId, card) => {
            if (!card || !videoId) return;
            if (!shouldStampCardForVideoId(card, videoId, { allowLooseMatch: true })) return;

            const stamped = getSeedIdentityForVideoId(videoId, card) || {};
            const hasConfirmedStampedId = hasConfirmedVideoChannelMapping(videoId, stamped?.id || '');
            const shouldStamp = Boolean(stamped && (stamped.id || stamped.handle || stamped.customUrl || stamped.name || stamped.logo || stamped.expectedChannelName));
            if (shouldStamp) {
                stampChannelIdentity(card, {
                    ...stamped,
                    authority: hasConfirmedStampedId ? 'confirmed' : 'hint'
                });
            }
            const normalizedStampedName = sanitizeChannelNameForCard(stamped?.name || '', card);
            const normalizedStampedExpected = sanitizeChannelNameForCard(stamped?.expectedChannelName || '', card);
            const hasUsableSeedName = Boolean(
                normalizedStampedName &&
                !isLikelyNonChannelName(normalizedStampedName) &&
                !hasCollapsedByline(normalizedStampedName)
            );
            const hasUsableSeedExpected = Boolean(
                normalizedStampedExpected &&
                !isLikelyNonChannelName(normalizedStampedExpected) &&
                !hasCollapsedByline(normalizedStampedExpected)
            );
            const needsPrefetch = (!hasConfirmedStampedId || (!hasUsableSeedName && !hasUsableSeedExpected));

            if (needsPrefetch) {
                prefetchIdentityForCard({
                    videoId,
                    card
                }).catch(() => { });
            }
        };

        for (const entry of updates) {
            const videoId = normalizeVideoIdFromPayload(entry?.videoId);
            const rawChannelId = normalizeSeedChannelId(
                typeof entry?.channelId === 'string' ? entry.channelId.trim() : ''
            );
            const channelId = isAuthoritativeVideoMap ? rawChannelId : '';
            if (!videoId) continue;
            if (isAuthoritativeVideoMap && channelId) persistVideoChannelMapping(videoId, channelId);

            const normalizedHandle = normalizeHandleValue(
                entry?.handle ||
                entry?.channelHandle ||
                entry?.canonicalHandle ||
                ''
            ) || '';
            const normalizedCustomUrl = normalizeCustomUrlKey(entry?.customUrl || '');
            const rawName = (typeof entry?.channelName === 'string' ? entry.channelName.trim() : '')
                || (typeof entry?.name === 'string' ? entry.name.trim() : '');
            const rawLogo = (typeof entry?.channelLogo === 'string' ? entry.channelLogo.trim() : '')
                || (typeof entry?.logo === 'string' ? entry.logo.trim() : '');
            const source = (typeof entry?.source === 'string' && entry.source.trim()) ? entry.source.trim() : 'filter_logic';
            const fetchStrategy = (typeof entry?.fetchStrategy === 'string' && entry.fetchStrategy.trim()) ? entry.fetchStrategy.trim() : 'rules';
            const expectedChannelName = (typeof entry?.expectedChannelName === 'string' && entry.expectedChannelName.trim()) ? entry.expectedChannelName.trim() : '';

            if (isAuthoritativeVideoMap && channelId && normalizedHandle) {
                persistChannelMappings([{ id: channelId, handle: normalizedHandle }]);
            }
            if (isAuthoritativeVideoMap && channelId && normalizedCustomUrl) {
                persistCustomUrlMapping(normalizedCustomUrl, channelId);
            }
            const cachedIdentity = {
                ...(channelId ? { id: channelId } : {}),
                ...(normalizedHandle ? { handle: normalizedHandle } : {}),
                ...(normalizedCustomUrl ? { customUrl: normalizedCustomUrl } : {}),
                ...(rawName ? { name: rawName } : {}),
                ...(rawLogo ? { logo: rawLogo } : {}),
                ...(source ? { source } : {}),
                ...(fetchStrategy ? { fetchStrategy } : {}),
                ...(expectedChannelName ? { expectedChannelName } : {}),
                authority: (isAuthoritativeVideoMap && channelId) ? 'confirmed' : 'hint'
            };
            setVideoIdentityCache(videoId, cachedIdentity);

            try {
                const cards = collectCardsForVideoId(videoId);
                cards.forEach((card) => applyVideoIdentityFromMessage(videoId, card));
                if (!cards || cards.length === 0) {
                    continue;
                }
            } catch (e) {
                // ignore
            }
            if (isAuthoritativeVideoMap && channelId) {
                didPersist = true;
            }
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

        // Opportunistically persist id<->handle mappings learned from main-world lookups.
        // This improves later UC->@handle enrichment in background without waiting for manual blocks.
        try {
            const cid = typeof channel?.id === 'string' ? channel.id.trim() : '';
            const chandle = normalizeHandleValue(channel?.handle || '') || '';
            if (cid && /^UC[\w-]{22}$/i.test(cid) && chandle && chandle.startsWith('@')) {
                persistChannelMappings([{ id: cid, handle: chandle }]);
            }
        } catch (e) {
        }

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
        syncBlockedElementsWithFilters(settings);
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
            syncBlockedElementsWithFilters(currentSettings || settings || {});
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
                        syncBlockedElementsWithFilters(currentSettings || settings || {});
                        try {
                            schedulePrefetchScan();
                        } catch (e) {
                        }
                    }, MIN_FALLBACK_INTERVAL_MS - elapsed);
                    return;
                }

                lastFallbackRunTs = now;
                applyDOMFallback(null);
                syncBlockedElementsWithFilters(currentSettings || settings || {});
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

    const isWatchPage = () => {
        try {
            const path = document.location?.pathname || '';
            return path.startsWith('/watch');
        } catch (e) {
            return false;
        }
    };

    const isWatchPlaylist = () => {
        try {
            if (!isWatchPage()) return false;
            const params = new URLSearchParams(document.location?.search || '');
            return params.has('list');
        } catch (e) {
            return false;
        }
    };

    const isMobileYoutubeSurface = () => {
        try {
            const host = String(document.location?.hostname || '').toLowerCase();
            return (
                host === 'm.youtube.com' ||
                host.startsWith('m.youtube.') ||
                host === 'music.youtube.com' ||
                host.endsWith('.music.youtube.com')
            );
        } catch (e) {
            return false;
        }
    };

    watchPlaylistFallbackMenuInstalled = true;

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
                    color: var(--yt-spec-text-primary, #fff);
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    margin: 0;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 999px;
                    opacity: 0.7;
                    transition: opacity 0.15s ease, background 0.15s ease;
                    flex-shrink: 0;
                }
                .filtertube-playlist-menu-fallback-btn--mobile {
                    width: 28px;
                    height: 28px;
                    margin-left: 6px;
                }
                .filtertube-playlist-menu-fallback-btn:hover {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.10);
                }
                html[dark] .filtertube-playlist-menu-fallback-btn,
                html[data-theme="dark"] .filtertube-playlist-menu-fallback-btn,
                ytd-app[dark] .filtertube-playlist-menu-fallback-btn {
                    color: #fff;
                }
                html:not([dark]) .filtertube-playlist-menu-fallback-btn,
                html[data-theme="light"] .filtertube-playlist-menu-fallback-btn {
                    color: #030303;
                }
                html[dark] .filtertube-playlist-menu-fallback-btn:hover,
                html[data-theme="dark"] .filtertube-playlist-menu-fallback-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                }
                html:not([dark]) .filtertube-playlist-menu-fallback-btn:hover,
                html[data-theme="light"] .filtertube-playlist-menu-fallback-btn:hover {
                    background: rgba(0, 0, 0, 0.08);
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
                .filtertube-playlist-menu-fallback-popover .ft-menu-items {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    max-height: 320px;
                    overflow-y: auto;
                    padding: 2px;
                }
                .filtertube-playlist-menu-fallback-popover .ft-menu-items ytm-menu-service-item-renderer,
                .filtertube-playlist-menu-fallback-popover .ft-menu-items ytd-menu-service-item-renderer,
                .filtertube-playlist-menu-fallback-popover .ft-menu-items yt-list-item-view-model {
                    display: block;
                }
                .filtertube-playlist-menu-fallback-popover .ft-menu-items tp-yt-paper-item.filtertube-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 8px 10px;
                    box-sizing: border-box;
                    cursor: pointer;
                }
                .filtertube-playlist-menu-fallback-popover .ft-menu-items .filtertube-menu-item {
                    border-radius: 10px;
                }
                .filtertube-playlist-menu-fallback-popover .ft-menu-items .filtertube-menu-item:hover {
                    background: rgba(255, 255, 255, 0.08);
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

    const isMenuLabel = (label) => {
        return /(action|more|overflow|menu|options|ellipsis|three|dot)/i.test(label || '');
    };

    const isMenuControl = (button) => {
        if (!button || !(button instanceof Element)) return false;
        const label = String(button.getAttribute?.('aria-label') || '').trim().toLowerCase();
        if (button.getAttribute?.('aria-haspopup') === 'menu' || button.getAttribute?.('aria-haspopup') === 'true') return true;
        if (button.classList?.contains('dropdown-trigger') || button.classList?.contains('menu-renderer')) return true;
        if (button.id === 'button') return true;
        if (button.matches?.('ytd-menu-renderer') || button.matches?.('ytm-menu-renderer') || button.matches?.('yt-icon-button#button')) return true;
        if (label && isMenuLabel(label)) return true;
        return false;
    };

    const isVisible = (el) => {
        if (!el || !(el instanceof Element)) return false;
        try {
            const style = window.getComputedStyle(el);
            if (!style || style.display === 'none' || style.visibility === 'hidden') return false;
            if (style.opacity === '0') return false;
            if (!el.getClientRects || el.getClientRects().length === 0) return false;
            if (el.closest?.('[hidden], [aria-hidden="true"]')) return false;
        } catch (e) {
        }
        return true;
    };

    const getMenuHost = (row) => {
        if (!row) return null;
        try {
            const children = row.children ? Array.from(row.children) : [];
            const direct = children.find(ch => ch && (ch.id === 'menu' || ch.id === 'action-menu')) || null;
            if (direct) return direct;
        } catch (e) {
        }
        try {
            // For yt-lockup-view-model (Mix cards etc.), use the menu-button slot
            const lockupMenuSlot = row.querySelector('.yt-lockup-metadata-view-model__menu-button');
            if (lockupMenuSlot) {
                // Avoid forcing placement into empty host placeholders when native button is not present.
                if (lockupMenuSlot.querySelector('button')) return lockupMenuSlot;
                const metadataSlot = row.querySelector('.yt-lockup-metadata-view-model__metadata');
                if (metadataSlot) return metadataSlot;
                return row;
            }
            return row.querySelector(
                '#menu, #action-menu, #menu-container, ytd-comment-action-buttons-renderer, .comment-action-buttons, ytd-menu-renderer, .menu-renderer'
            ) || row;
        } catch (e) {
            return row;
        }
    };

    const rowHasNativeMenuButton = (row, menuHost) => {
        const root = menuHost || row;
        if (!root) return false;
        try {
            const menuRenderer = root.querySelector(
                'ytd-menu-renderer, ytm-menu-renderer, ytm-menu, ytm-bottom-sheet-renderer, tp-yt-paper-listbox, .menu-renderer, .overflow-menu'
            );
            if (menuRenderer) return true;
            // .yt-lockup-metadata-view-model__menu-button only counts if it actually has a button inside
            // (on Mix cards this div exists but is empty)
            const lockupMenuBtn = root.querySelector('.yt-lockup-metadata-view-model__menu-button');
            if (lockupMenuBtn && lockupMenuBtn.querySelector('button')) return true;
        } catch (e) {
        }
        try {
            const menuButtons = root.querySelectorAll?.(
                'ytd-menu-renderer button[aria-label], ' +
                'ytd-menu-renderer button[aria-haspopup="menu"], ' +
                'ytd-menu-renderer button[aria-haspopup="true"], ' +
                '#menu button[aria-haspopup="menu"], ' +
                '#menu button[aria-haspopup="true"], ' +
                '#action-menu button[aria-haspopup="menu"], ' +
                '#action-menu button[aria-haspopup="true"], ' +
                '#action-menu button[aria-label], ' +
                'ytd-comment-action-buttons-renderer button[aria-label], ' +
                'yt-icon-button.dropdown-trigger button, ' +
                'yt-button-shape button[aria-haspopup="menu"], ' +
                'yt-button-shape button[aria-haspopup="true"], ' +
                '#menu ytd-menu-renderer button[aria-label], ' +
                '.overflow-menu button, ' +
                '.comment-action-buttons button, ' +
                '.yt-lockup-metadata-view-model__menu-button button[aria-label], ' +
                '.yt-lockup-metadata-view-model__menu-button button[aria-label*="Action menu"], ' +
                '.yt-lockup-metadata-view-model__menu-button button[aria-label*="More actions"], ' +
                '.yt-lockup-metadata-view-model__menu-button button[aria-label*="Action"], ' +
                '.yt-lockup-metadata-view-model__menu-button button[aria-label*="menu"], ' +
                '.media-item-menu button[aria-label*="Action menu"], ' +
                '.media-item-menu button[aria-label*="More actions"], ' +
                '.media-item-menu button[aria-label*="menu"], ' +
                'ytm-bottom-sheet-renderer button, ' +
                'ytm-bottom-sheet-renderer button[aria-label*="Action menu"], ' +
                'ytm-bottom-sheet-renderer button[aria-label*="More actions"], ' +
                'ytm-bottom-sheet-renderer button[aria-label*="menu"], ' +
                'button[aria-label*="Action"], ' +
                'button[aria-label*="Action menu"], ' +
                'button[aria-label*="More actions"], ' +
                'button[aria-label*="menu"], ' +
                'button[aria-haspopup="menu"], ' +
                'button[aria-haspopup="true"]'
            );
            for (const btn of menuButtons || []) {
                if (!isVisible(btn)) continue;
                if (isMenuControl(btn)) {
                    const host = btn.closest?.(
                        '.yt-lockup-metadata-view-model__menu-button, ytd-menu-renderer, ytm-menu-renderer, ytm-menu, ytm-bottom-sheet-renderer, .menu-renderer, .overflow-menu, #menu, #action-menu, .comment-action-buttons, ytd-comment-action-buttons-renderer'
                    );
                    if (host) return true;
                }
            }
        } catch (e) {
        }
        return false;
    };

    const isShortsSurface = (el) => {
        if (!el || !(el instanceof Element)) return false;
        try {
            const tag = el.tagName?.toLowerCase() || '';
            if (tag === 'ytm-shorts-lockup-view-model' || tag === 'ytm-shorts-lockup-view-model-v2') return true;
            if (el.classList?.contains('shortsLockupViewModelHost')) return true;
            if (el.closest?.('ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, ytd-reel-item-renderer')) return true;
            // Check if the card links to /shorts/
            const href = el.querySelector?.('a[href*="/shorts/"]');
            if (href && !el.querySelector?.('a[href*="/watch?"]')) return true;
        } catch (e) { }
        return false;
    };

    const ensureFallbackButtonForRow = (row) => {
        if (!row || !(row instanceof Element)) return;
        // Skip Shorts cards — they always have native 3-dot menus
        if (isShortsSurface(row)) return;
        // Keep only one fallback button per card, regardless of host resolution timing.
        if (row.querySelector?.('.filtertube-playlist-menu-fallback-btn')) return;
        const menuHost = getMenuHost(row);
        if (!menuHost) return;
        try {
            const staleNativeMarker = menuHost.getAttribute?.('data-filtertube-native-menu-seen');
            if (staleNativeMarker === '1' && !rowHasNativeMenuButton(row, menuHost)) {
                menuHost.removeAttribute?.('data-filtertube-native-menu-seen');
                menuHost.removeAttribute?.('data-filtertube-native-menu-seen-at');
                row.removeAttribute?.('data-filtertube-native-menu-seen');
                row.removeAttribute?.('data-filtertube-native-menu-seen-at');
            }
            if (
                menuHost.getAttribute?.('data-filtertube-native-menu-seen') === '1'
                || row.getAttribute?.('data-filtertube-native-menu-seen') === '1'
            ) {
                return;
            }
        } catch (e) {
        }

        // If YouTube menu exists, remove our fallback if present.
        if (rowHasNativeMenuButton(row, menuHost)) {
            // Keep stale cleanup idempotent even when a fallback was previously injected.
            const existing = menuHost.querySelector('.filtertube-playlist-menu-fallback-btn')
                || row.querySelector('.filtertube-playlist-menu-fallback-btn');
            if (existing) {
                try { existing.remove(); } catch (e) { }
            }
            try {
                row.setAttribute('data-filtertube-native-menu-seen', '1');
                row.setAttribute('data-filtertube-native-menu-seen-at', String(Date.now()));
                menuHost.setAttribute('data-filtertube-native-menu-seen', '1');
                menuHost.setAttribute('data-filtertube-native-menu-seen-at', String(Date.now()));
            } catch (e) {
            }
            return;
        }

        // Skip if this ROW (at any depth) already has a fallback button
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
        let lastOpenAt = 0;
        const openFallback = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const now = Date.now();
            if (now - lastOpenAt < 220) return;
            lastOpenAt = now;
            try {
                openFilterTubePlaylistFallbackPopover(btn, row);
            } catch (err) {
                console.warn('FilterTube: Failed to open playlist fallback menu', err);
            }
        };
        btn.addEventListener('pointerup', openFallback, true);
        btn.addEventListener('click', openFallback, true);

        try {
            menuHost.appendChild(btn);
        } catch (e) {
        }

        // Remove accidental duplicates that can appear when host detection changes after DOM swaps.
        try {
            const extras = row.querySelectorAll?.('.filtertube-playlist-menu-fallback-btn');
            if (extras && extras.length > 1) {
                for (let i = 1; i < extras.length; i++) {
                    try { extras[i].remove(); } catch (e) { }
                }
            }
        } catch (e) {
        }
    };

    const ytmCardHasNativeMenuButton = (card) => {
        if (!card) return false;
        try {
            if (card.getAttribute?.('data-has-overflow-menu') === 'false') {
                return false;
            }
        } catch (e) {
        }
        const isVisible = (el) => {
            if (!el || !(el instanceof Element)) return false;
            try {
                const style = window.getComputedStyle(el);
                if (!style || style.display === 'none' || style.visibility === 'hidden') return false;
                if (style.opacity === '0') return false;
                if (!el.getClientRects || el.getClientRects().length === 0) return false;
                if (el.closest?.('[hidden], [aria-hidden="true"]')) return false;
            } catch (e) {
            }
            return true;
        };
        try {
            const explicitYtmMenuHost = card.querySelector(
                '.ytmPlaylistPanelVideoRendererV2Host .media-item-menu, ' +
                '.details .media-item-menu, ' +
                '.details ytm-bottom-sheet-renderer, ' +
                '.ytmPlaylistPanelVideoRendererV2Host ytm-bottom-sheet-renderer, ' +
                '.media-item-menu, ' +
                'ytm-bottom-sheet-renderer'
            );
            if (explicitYtmMenuHost) {
                const explicitBtn = explicitYtmMenuHost.querySelector(
                    'button[aria-label="Action menu"], button[aria-label="More actions"], button[aria-label*="Action menu"], button[aria-label*="More actions"], button[aria-label*="menu"], button[aria-haspopup="menu"], button[aria-haspopup="true"]'
                );
                if (isVisible(explicitBtn)) return true;
            }
        } catch (e) {
        }
        try {
            const btn = card.querySelector(
                'ytm-menu-renderer button[aria-label], ' +
                'ytm-menu-renderer button[aria-haspopup="menu"], ' +
                'ytm-menu-renderer button[aria-haspopup="true"], ' +
                'ytm-menu button[aria-label], ' +
                'ytm-menu button[aria-haspopup="menu"], ' +
                'ytm-menu button[aria-haspopup="true"], ' +
                '.menu-renderer button[aria-label], ' +
                '.overflow-menu button, ' +
                '.overflow-menu button[aria-label], ' +
                '.overflow-menu button[aria-label*="Action menu"], ' +
                '.overflow-menu button[aria-label*="More actions"], ' +
                '.overflow-menu button[aria-haspopup="menu"], ' +
                '.overflow-menu button[aria-haspopup="true"], ' +
                '.menu-renderer button[aria-label*="Action menu"], ' +
                '.menu-renderer button[aria-label*="More actions"], ' +
                '.media-item-menu button[aria-label*="menu"], ' +
                '.media-item-menu button[aria-label*="Action menu"], ' +
                '.media-item-menu button[aria-label*="More actions"], ' +
                'ytm-bottom-sheet-renderer button[aria-label], ' +
                'ytm-bottom-sheet-renderer button[aria-label*="Action menu"], ' +
                'ytm-bottom-sheet-renderer button[aria-label*="More actions"], ' +
                'ytm-bottom-sheet-renderer button[aria-label*="menu"], ' +
                '.details button[aria-label*="Action menu"], ' +
                '.details button[aria-label*="More actions"], ' +
                '.details button[aria-label*="Action"], ' +
                '.details button[aria-label*="menu"], ' +
                '.media-item-menu button[aria-label*="Action menu"], ' +
                '.media-item-menu button[aria-label*="More actions"]'
            );
            if (isVisible(btn)) {
                const host = btn.closest?.('.media-item-menu, ytm-bottom-sheet-renderer, ytm-menu-renderer, ytm-menu, .menu-renderer, .overflow-menu, .details');
                if (host) return true;
            }
        } catch (e) {
        }
        return false;
    };

    const getYtmFallbackMenuHost = (card) => {
        if (!card) return null;
        const explicitHost = card.querySelector('.media-item-menu, ytm-bottom-sheet-renderer');
        if (explicitHost) return explicitHost;
        const playlistPanelHost = card.querySelector('.ytmPlaylistPanelVideoRendererV2Host .media-item-menu, .ytmPlaylistPanelVideoRendererV2Host ytm-bottom-sheet-renderer, .ytmPlaylistPanelVideoRendererV2Host');
        if (playlistPanelHost) return playlistPanelHost;
        const detailsHost = card.querySelector('.details');
        if (detailsHost) return detailsHost;

        return card.querySelector(
            'ytm-menu-renderer, ' +
            'ytm-menu, ' +
            '#menu, ' +
            '.comment-action-buttons, ' +
            '.YtmCompactMediaItemHost, ' +
            '.ytmPlaylistPanelVideoRendererV2Host .YtmCompactMediaItemMetadata, ' +
            '.watch-card-rich-header-call-to-actions-container, ' +
            '.watch-card-rich-header-renderer, ' +
            '.media-item-info, ' +
            '.YtmCompactMediaItemMetadata, ' +
            '.YtmCompactMediaItemMetadataContent, ' +
            'ytm-playlist-panel-video-wrapper-renderer, ' +
            'ytm-playlist-panel-video-renderer'
        ) || card;
    };

    const YTM_FALLBACK_ALLOWED_TAGS = new Set([
        'ytm-compact-playlist-renderer',
        'ytm-playlist-video-renderer',
        'ytm-playlist-panel-video-renderer',
        'ytm-playlist-panel-video-wrapper-renderer',
        'ytm-compact-radio-renderer',
        'ytm-radio-renderer',
        'ytm-compact-channel-renderer',
        'ytm-rich-item-renderer',
        'ytm-comment-thread-renderer',
        'ytm-comment-renderer',
        'ytm-comment-view-model'
    ]);

    const ensureFallbackButtonForYtmCard = (card) => {
        if (!card || !(card instanceof Element)) return;
        const tag = String(card.tagName || '').toLowerCase();
        if (!YTM_FALLBACK_ALLOWED_TAGS.has(tag)) {
            const isContextVideoCard = tag === 'ytm-video-with-context-renderer';
            if (!isContextVideoCard) {
                return;
            }
        }
        if (card.querySelector?.('.filtertube-playlist-menu-fallback-btn[data-filtertube-fallback-menu="ytm"]')) return;
        const menuHost = getYtmFallbackMenuHost(card);
        if (!menuHost) return;
        try {
            const staleNativeMarker = menuHost.getAttribute?.('data-filtertube-native-menu-seen');
            if (staleNativeMarker === '1' && !ytmCardHasNativeMenuButton(card)) {
                menuHost.removeAttribute?.('data-filtertube-native-menu-seen');
                menuHost.removeAttribute?.('data-filtertube-native-menu-seen-at');
                card.removeAttribute?.('data-filtertube-native-menu-seen');
                card.removeAttribute?.('data-filtertube-native-menu-seen-at');
            }
            if (
                menuHost.getAttribute?.('data-filtertube-native-menu-seen') === '1'
                || card.getAttribute?.('data-filtertube-native-menu-seen') === '1'
            ) {
                return;
            }
        } catch (e) {
        }

        if (ytmCardHasNativeMenuButton(card)) {
            const existing = menuHost.querySelector('.filtertube-playlist-menu-fallback-btn[data-filtertube-fallback-menu="ytm"]')
                || card.querySelector('.filtertube-playlist-menu-fallback-btn[data-filtertube-fallback-menu="ytm"]');
            if (existing) {
                try { existing.remove(); } catch (e) { }
            }
            try {
                card.setAttribute('data-filtertube-native-menu-seen', '1');
                card.setAttribute('data-filtertube-native-menu-seen-at', String(Date.now()));
                menuHost.setAttribute('data-filtertube-native-menu-seen', '1');
                menuHost.setAttribute('data-filtertube-native-menu-seen-at', String(Date.now()));
            } catch (e) {
            }
            return;
        }

        if (menuHost.querySelector('.filtertube-playlist-menu-fallback-btn[data-filtertube-fallback-menu="ytm"]')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'filtertube-playlist-menu-fallback-btn filtertube-playlist-menu-fallback-btn--mobile';
        btn.setAttribute('aria-label', 'FilterTube menu');
        btn.setAttribute('data-filtertube-fallback-menu', 'ytm');
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="currentColor" d="M12 4a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4a2 2 0 0 0 0-4Z"/>
            </svg>
        `;
        let lastOpenAt = 0;
        const openFallback = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const now = Date.now();
            if (now - lastOpenAt < 220) return;
            lastOpenAt = now;
            try {
                openFilterTubePlaylistFallbackPopover(btn, card);
            } catch (err) {
                console.warn('FilterTube: Failed to open YTM fallback menu', err);
            }
        };
        btn.addEventListener('pointerup', (e) => {
            // On touch surfaces, rely on click to avoid interfering with scroll gestures.
            if (e?.pointerType === 'touch') return;
            openFallback(e);
        }, true);
        btn.addEventListener('click', openFallback, true);

        try {
            menuHost.appendChild(btn);
        } catch (e) {
        }

        // Remove accidental duplicates in case this card was processed multiple times in one frame.
        try {
            const extras = card.querySelectorAll?.('.filtertube-playlist-menu-fallback-btn[data-filtertube-fallback-menu="ytm"]');
            if (extras && extras.length > 1) {
                for (let i = 1; i < extras.length; i++) {
                    try { extras[i].remove(); } catch (e) { }
                }
            }
        } catch (e) {
        }
    };

    const scan = () => {
        const root = document.body || document.documentElement;
        if (!root) return;
        processNode(root);
    };

    const DESKTOP_FALLBACK_SELECTOR =
        'ytd-rich-item-renderer, ' +
        'ytd-rich-grid-slim-media, ' +
        'ytd-rich-grid-media, ' +
        'ytd-video-renderer, ' +
        'ytd-grid-video-renderer, ' +
        'ytd-compact-video-renderer, ' +
        'ytd-playlist-video-renderer, ' +
        'ytd-watch-card-compact-video-renderer, ' +
        'ytd-watch-card-hero-video-renderer, ' +
        'ytd-watch-card-rhs-panel-video-renderer, ' +
        'yt-lockup-view-model, ' +
        'ytd-radio-renderer, ' +
        'ytd-compact-radio-renderer, ' +
        'ytd-playlist-renderer, ' +
        'ytd-grid-playlist-renderer, ' +
        'ytd-compact-playlist-renderer, ' +
        'ytd-comment-thread-renderer, ' +
        'ytd-comment-renderer, ' +
        'ytd-comment-view-model';

    const YTM_FALLBACK_SELECTOR =
        'ytm-compact-playlist-renderer, ' +
        'ytm-playlist-video-renderer, ' +
        'ytm-playlist-panel-video-renderer, ' +
        'ytm-playlist-panel-video-wrapper-renderer, ' +
        'ytm-compact-radio-renderer, ' +
        'ytm-radio-renderer, ' +
        'ytm-compact-channel-renderer, ' +
        'ytm-video-with-context-renderer, ' +
        'ytm-rich-item-renderer, ' +
        'ytm-comment-thread-renderer, ' +
        'ytm-comment-renderer, ' +
        'ytm-comment-view-model';

    const visitSelector = (node, selector, visitor) => {
        if (!node || !(node instanceof Element)) return;
        try {
            if (node.matches?.(selector)) {
                visitor(node);
            }
        } catch (e) {
        }
        try {
            const found = node.querySelectorAll?.(selector);
            found?.forEach?.(visitor);
        } catch (e) {
        }
    };

    const processNode = (node) => {
        if (!node || !(node instanceof Element)) return;
        const isWatchSurface = isWatchPage();
        const isMobileSurface = isMobileYoutubeSurface();

        if (isWatchSurface && isWatchPlaylist()) {
            visitSelector(node, 'ytd-playlist-panel-video-renderer', ensureFallbackButtonForRow);
        }

        if (!isMobileSurface) {
            visitSelector(node, DESKTOP_FALLBACK_SELECTOR, ensureFallbackButtonForRow);
        }

        if (isMobileSurface) {
            visitSelector(node, YTM_FALLBACK_SELECTOR, ensureFallbackButtonForYtmCard);
        }
    };

    const MENU_HOST_SELECTOR = [
        'ytm-bottom-sheet-renderer',
        '.media-item-menu',
        'ytm-menu-renderer',
        'ytm-menu',
        'ytd-menu-renderer',
        '.yt-lockup-metadata-view-model__menu-button',
        '.comment-action-buttons',
        '.overflow-menu',
        '#menu',
        '#action-menu',
        '[aria-label="Action menu"]',
        '[aria-label="More actions"]',
        '[aria-label*="Action menu"]',
        '[aria-label*="More actions"]',
        '[aria-haspopup="menu"]',
        '[aria-haspopup="true"]'
    ].join(', ');

    const ensureFallbackForMenuMutation = (node) => {
        if (!node || !(node instanceof Element)) return;

        let menuHost = null;
        try {
            if (node.matches?.(MENU_HOST_SELECTOR)) {
                menuHost = node;
            } else {
                menuHost = node.closest?.(MENU_HOST_SELECTOR);
            }
        } catch (e) {
        }
        if (!menuHost) return;

        const isWatchSurface = isWatchPage();
        const isMobileSurface = isMobileYoutubeSurface();
        const hostSelector = isMobileSurface
            ? `${YTM_FALLBACK_SELECTOR}, ytm-bottom-sheet-renderer, .media-item-menu, ytm-menu-renderer, ytm-menu, .comment-action-buttons, [data-filtertube-video-id]`
            : `${DESKTOP_FALLBACK_SELECTOR}, [data-filtertube-video-id]`;

        try {
            const fallbackHost = menuHost.closest?.(hostSelector);
            if (!fallbackHost) return;

            if (isWatchSurface && isWatchPlaylist() && fallbackHost.matches?.('ytd-playlist-panel-video-renderer')) {
                ensureFallbackButtonForRow(fallbackHost);
                return;
            }
            if (isMobileSurface) {
                ensureFallbackButtonForYtmCard(fallbackHost);
            } else {
                ensureFallbackButtonForRow(fallbackHost);
            }
        } catch (e) {
        }

        // Also run a secondary pass when a native-menu mutation appears inside a card wrapper.
        try {
            const fallbackCard = menuHost.closest?.('.ytd-lockup-view-model, ytd-playlist-panel-video-renderer, .yt-lockup-view-model--wrapper, ytd-watch-next-secondary-results-renderer, ytm-playlist-panel-video-renderer, ytm-playlist-video-renderer');
            if (fallbackCard) {
                if (isMobileSurface) {
                    ensureFallbackButtonForYtmCard(fallbackCard);
                } else {
                    ensureFallbackButtonForRow(fallbackCard);
                }
            }
        } catch (e) {
        }
    };

    const observerWithNodes = new MutationObserver((mutations) => {
        for (const mutation of mutations || []) {
            const added = mutation?.addedNodes;
            if (!added || !added.length) continue;
            for (const node of added) {
                if (!(node instanceof Element)) continue;
                processNode(node);
                ensureFallbackForMenuMutation(node);
            }
        }
    });

    const attach = () => {
        const root = document.body || document.documentElement;
        if (!root) return false;
        try {
            observerWithNodes.observe(root, { childList: true, subtree: true });
        } catch (e) {
            return false;
        }
        return true;
    };

    if (!attach()) {
        const t = setInterval(() => {
            if (attach()) {
                clearInterval(t);
                scan();
            }
        }, 700);
        setTimeout(() => clearInterval(t), 12000);
    } else {
        scan();
    }

    document.addEventListener('yt-navigate-finish', () => {
        window.setTimeout(() => {
            try { scan(); } catch (e) { }
        }, 220);
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
    pop.addEventListener('filtertube-force-close', () => {
        try {
            close();
        } catch (e) {
        }
    });

    const ensuredVideoId = (() => {
        try {
            const tag = String(row?.tagName || '').toLowerCase();
            const looksLikePlaylistRow = tag.includes('playlist') && !tag.includes('playlist-panel-video');
            const playlistLink = row.querySelector?.(
                'a[href*="list="]:not([href*="watch?v="]):not([href*="/shorts/"])'
            );
            if (looksLikePlaylistRow || playlistLink) {
                const stampedVideoId = (typeof row?.getAttribute === 'function')
                    ? (row.getAttribute('data-filtertube-video-id') || '')
                    : '';
                const extractedVideoId = stampedVideoId || extractVideoIdFromCard(row) || '';
                return extractedVideoId;
            }
            return ensureVideoIdForCard(row) || '';
        } catch (e) {
            return '';
        }
    })();

    let extracted = null;
    try {
        extracted = extractChannelFromCard(row);
    } catch (e) {
        extracted = null;
    }

    const fallbackByline = row.querySelector(
        '.YtmCompactMediaItemByline .yt-core-attributed-string, ' +
        '.YtmCompactMediaItemByline, ' +
        '#byline'
    )?.textContent?.trim() || '';
    const fallbackHeadlineAria = row.querySelector(
        '.YtmCompactMediaItemHeadline [aria-label], ' +
        '.YtmCompactMediaItemHeadline'
    )?.getAttribute?.('aria-label') || '';
    const isMixFallbackRow = isMixCardElement(row);
    const normalizeFallbackName = (value) => {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) return '';
        if (isLikelyNonChannelName(trimmed)) return '';
        if (isMixFallbackRow && trimmed.toLowerCase() === 'youtube') return '';
        return trimmed;
    };
    const derivedExpectedName = deriveExpectedChannelName(fallbackByline)
        || deriveExpectedChannelName(fallbackHeadlineAria)
        || '';
    const fallbackDisplayName = normalizeFallbackName(derivedExpectedName || fallbackByline || '');
    const expectedNameForLookup = normalizeFallbackName(derivedExpectedName || '');
    const hasBylineCollabHint = Boolean(/\b\d+\s+more\b/i.test(fallbackByline || fallbackHeadlineAria || ''));

    const title = (() => {
        const name = extracted?.name || fallbackDisplayName || '';
        const vid = ensuredVideoId || extracted?.videoId || '';
        const label = name ? `FilterTube: ${name}` : 'FilterTube';
        return vid ? `${label}` : label;
    })();

    const hint = document.createElement('div');
    hint.className = 'ft-hint';
    hint.textContent = 'Fallback menu (native 3-dot unavailable for this item).';

    const menuItemsHost = document.createElement('div');
    menuItemsHost.className = 'ft-menu-items';
    menuItemsHost.setAttribute('role', 'menu');

    const playlistIdFromRow = extractPlaylistIdFromElement(row);
    const isPlaylistFallbackCard = Boolean(
        extracted?.fetchStrategy === 'playlist' ||
        extracted?.playlistId ||
        playlistIdFromRow
    );
    let channelInfoForMenu = {
        ...(extracted || {}),
        source: extracted?.source || (isPlaylistFallbackCard ? 'ytm_playlist_card' : 'playlist_fallback_menu'),
        fetchStrategy: isPlaylistFallbackCard ? 'playlist' : extracted?.fetchStrategy,
        playlistId: extracted?.playlistId || playlistIdFromRow || '',
        // For playlist cards we intentionally avoid using the thumbnail videoId (top video channel).
        videoId: isPlaylistFallbackCard ? '' : (ensuredVideoId || extracted?.videoId || ''),
        name: extracted?.name || fallbackDisplayName || ''
    };

    if (channelInfoForMenu.name) {
        channelInfoForMenu.expectedChannelName = channelInfoForMenu.expectedChannelName || channelInfoForMenu.name;
    }
    if (!channelInfoForMenu.expectedChannelName && expectedNameForLookup) {
        channelInfoForMenu.expectedChannelName = expectedNameForLookup;
    }

    // If we only have byline text, bootstrap a provisional collaboration roster.
    // This covers:
    // - "A and B" (explicit pair)
    // - "A and 2 more" (partial list with hidden collaborators)
    if (!isMixFallbackRow && (!Array.isArray(channelInfoForMenu.allCollaborators) || channelInfoForMenu.allCollaborators.length < 2) && fallbackDisplayName) {
        try {
            const parsed = parseCollaboratorNames(fallbackDisplayName);
            const hasExplicitPair = parsed?.names?.length >= 2;
            const hasHiddenTail = parsed?.names?.length >= 1 && parsed?.hasHiddenCollaborators;
            if (hasExplicitPair || hasHiddenTail) {
                const provisionalNames = Array.isArray(parsed.names) ? parsed.names.slice(0, 6) : [];
                if (parsed.hasHiddenCollaborators && parsed.hiddenCount > 0) {
                    const maxItems = Math.min(6, provisionalNames.length + parsed.hiddenCount);
                    for (let i = provisionalNames.length; i < maxItems; i++) {
                        provisionalNames.push(`Collaborator ${i + 1}`);
                    }
                }
                channelInfoForMenu.isCollaboration = true;
                channelInfoForMenu.allCollaborators = provisionalNames.map((name) => ({
                    name,
                    handle: '',
                    id: '',
                    customUrl: ''
                }));
                channelInfoForMenu.needsEnrichment = true;
                channelInfoForMenu.expectedCollaboratorCount = Math.max(
                    parsed.names.length + (parsed.hiddenCount || 0),
                    parsed.names.length
                );
            }
        } catch (e) {
        }
    }

    // Allow block actions even when identity is weak by routing through watch:<videoId>.
    if (!isPlaylistFallbackCard && !channelInfoForMenu.id && !channelInfoForMenu.handle && !channelInfoForMenu.customUrl && channelInfoForMenu.videoId) {
        channelInfoForMenu.needsFetch = true;
        channelInfoForMenu.fetchStrategy = 'mainworld';
    }

    const renderFallbackMenu = (info) => {
        try {
            renderFilterTubeMenuEntries({
                dropdown: pop,
                newMenuList: null,
                oldMenuList: menuItemsHost,
                channelInfo: info,
                videoCard: row,
                placeholder: Boolean(info?.isCollaboration && info?.needsEnrichment)
            });
        } catch (e) {
            console.warn('FilterTube: Failed to render fallback menu entries', e);
        }
    };

    const titleEl = document.createElement('div');
    titleEl.className = 'ft-title';
    titleEl.textContent = title;
    pop.appendChild(titleEl);
    pop.appendChild(menuItemsHost);
    pop.appendChild(hint);

    renderFallbackMenu(channelInfoForMenu);

    const refreshFallbackIdentity = async () => {
        try {
            let nextInfo = { ...channelInfoForMenu };
            let changed = false;

            if (nextInfo.isCollaboration || nextInfo.needsEnrichment || hasBylineCollabHint) {
                try {
                    const expectedNames = [];
                    if (fallbackDisplayName) expectedNames.push(fallbackDisplayName);
                    if (nextInfo?.name) expectedNames.push(nextInfo.name);
                    if (!nextInfo.videoId) {
                        // Collaborator enrichment requires a videoId; playlist cards have none here.
                        throw new Error('missing_video_id_for_collabs');
                    }
                    const collabs = await requestCollaboratorInfoFromMainWorld(nextInfo.videoId, { expectedNames });
                    const sanitized = sanitizeCollaboratorList(collabs);
                    if (sanitized.length >= 2) {
                        nextInfo = {
                            ...nextInfo,
                            isCollaboration: true,
                            allCollaborators: sanitized.slice(0, 6),
                            needsEnrichment: false,
                            expectedCollaboratorCount: Math.max(
                                nextInfo.expectedCollaboratorCount || 0,
                                sanitized.length
                            )
                        };
                        changed = true;
                    }
                } catch (e) {
                }
            }

            if (((!nextInfo.id && !nextInfo.handle && !nextInfo.customUrl) || nextInfo.needsFetch) && nextInfo.fetchStrategy !== 'playlist') {
                try {
                    if (!nextInfo.videoId) throw new Error('missing_video_id');
                    const resolved = await requestChannelInfoFromMainWorld(nextInfo.videoId, {
                        expectedHandle: nextInfo.expectedHandle || nextInfo.handle || '',
                        expectedName: nextInfo.expectedChannelName || expectedNameForLookup || '',
                        channelId: nextInfo.id || null
                    });
                    if (resolved) {
                        nextInfo = {
                            ...nextInfo,
                            ...resolved,
                            videoId: nextInfo.videoId,
                            expectedChannelName: nextInfo.expectedChannelName || expectedNameForLookup || ''
                        };
                        changed = true;
                    }
                } catch (e) {
                }
            }

            if (changed && playlistFallbackPopoverState?.popover === pop && pop.isConnected) {
                channelInfoForMenu = nextInfo;
                const refreshedName = pickMenuChannelDisplayName(channelInfoForMenu, {});
                titleEl.textContent = refreshedName ? `FilterTube: ${refreshedName}` : 'FilterTube';
                renderFallbackMenu(channelInfoForMenu);
            }
        } catch (e) {
        }
    };
    refreshFallbackIdentity().catch(() => { });

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
    const blockAllMessage = getAdaptiveMenuCopy().pendingAll;
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
        const menuList = resolveMenuInsertionTarget(oldMenuList);
        if (!menuList) return;
        const isMobileMenu = isMobileMenuContainer(menuList, oldMenuList);
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
    const resolvedOptions = typeof options === 'object' && options !== null
        ? options
        : { expectedHandle: options };
    const fallbackChannelId = typeof resolvedOptions.channelId === 'string' ? resolvedOptions.channelId.trim() : '';
    if (!videoId && !fallbackChannelId) {
        console.log('FilterTube: ytInitialData search skipped - no videoId/channelId');
        return null;
    }

    const expectedHandleKey = resolvedOptions.expectedHandle ? normalizeHandleValue(resolvedOptions.expectedHandle).toLowerCase() : '';
    const expectedNameKey = (typeof resolvedOptions.expectedName === 'string' ? resolvedOptions.expectedName.trim().toLowerCase().replace(/\s+/g, ' ') : '');
    const cacheKey = `${videoId || 'novid'}|cid:${fallbackChannelId || 'none'}|h:${expectedHandleKey}|n:${expectedNameKey}`;

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
        const result = await requestChannelInfoFromMainWorld(videoId || '', resolvedOptions);
        if (!result) return null;

        if (resolvedOptions.expectedHandle) {
            const normalizedExpected = normalizeHandleValue(resolvedOptions.expectedHandle);
            const normalizedFound = normalizeHandleValue(result.handle);
            if (normalizedExpected && normalizedFound && normalizedExpected !== normalizedFound) {
                console.warn('FilterTube: ytInitialData handle mismatch, rejecting result', {
                    expected: normalizedExpected,
                    found: normalizedFound,
                    videoId: videoId || null,
                    channelId: fallbackChannelId || null
                });
                return null;
            }
        }

        if (typeof resolvedOptions.expectedName === 'string' && resolvedOptions.expectedName.trim()) {
            const allowNameMismatch = resolvedOptions.allowNameMismatch === true;
            const normalizeName = (value) => {
                if (!value || typeof value !== 'string') return '';
                return value.trim().toLowerCase().replace(/\s+/g, ' ');
            };
            const normalizedExpectedName = normalizeName(resolvedOptions.expectedName);
            const normalizedFoundName = normalizeName(result.name);
            if (!allowNameMismatch && normalizedExpectedName && normalizedFoundName && normalizedExpectedName !== normalizedFoundName) {
                console.warn('FilterTube: ytInitialData name mismatch, rejecting result', {
                    expected: normalizedExpectedName,
                    found: normalizedFoundName,
                    videoId: videoId || null,
                    channelId: fallbackChannelId || null
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
        const extractPlaylistOwnerFromRendererData = (rendererLike, playlistIdHint = '') => {
            if (!rendererLike || typeof rendererLike !== 'object') return null;

            const renderer =
                rendererLike.compactPlaylistRenderer ||
                rendererLike.content?.compactPlaylistRenderer ||
                rendererLike.richItemRenderer?.content?.compactPlaylistRenderer ||
                rendererLike.lockupViewModel ||
                rendererLike.content?.lockupViewModel ||
                rendererLike.richItemRenderer?.content?.lockupViewModel ||
                null;
            if (!renderer || typeof renderer !== 'object') return null;

            const normalizedPlaylistHint = typeof playlistIdHint === 'string' ? playlistIdHint.trim() : '';
            const rendererPlaylistId = typeof renderer?.playlistId === 'string' ? renderer.playlistId.trim() : '';
            if (normalizedPlaylistHint && rendererPlaylistId && normalizedPlaylistHint !== rendererPlaylistId) {
                return null;
            }

            const extractCustomUrlFromCanonical = (value) => {
                if (!value || typeof value !== 'string') return '';
                const decoded = decodeURIComponentSafe(value);
                const m = decoded.match(/\/(c|user)\/([^/?#]+)/i);
                if (!m || !m[1] || !m[2]) return '';
                return `${m[1].toLowerCase()}/${m[2]}`;
            };

            const parseRunNavigationEndpoint = (run) => {
                if (!run || typeof run !== 'object') return null;
                const nav = run.navigationEndpoint || {};
                const browse = nav.browseEndpoint || nav.command?.browseEndpoint || nav.innertubeCommand?.browseEndpoint || null;
                const browseId = typeof browse?.browseId === 'string' ? browse.browseId.trim() : '';
                const canonical = (
                    browse?.canonicalBaseUrl ||
                    nav?.commandMetadata?.webCommandMetadata?.url ||
                    nav?.webCommandMetadata?.url ||
                    ''
                );
                const handle = normalizeHandleValue(extractRawHandle(canonical) || '');
                const customUrl = extractCustomUrlFromCanonical(canonical);
                const text = typeof run.text === 'string' ? run.text.trim() : '';
                return {
                    id: browseId && browseId.startsWith('UC') ? browseId : '',
                    handle,
                    customUrl,
                    name: text
                        && !/^\s*playlist\s*$/i.test(text)
                        && !/^\s*podcast\s*$/i.test(text)
                        && !/^[•·]$/.test(text)
                        ? text
                        : ''
                };
            };

            // compactPlaylistRenderer: shortBylineText/longBylineText carries owner endpoint.
            const runs = [
                ...(Array.isArray(renderer.shortBylineText?.runs) ? renderer.shortBylineText.runs : []),
                ...(Array.isArray(renderer.longBylineText?.runs) ? renderer.longBylineText.runs : [])
            ];
            const candidates = runs
                .map(parseRunNavigationEndpoint)
                .filter(Boolean)
                .filter(entry => entry.id || entry.handle || entry.customUrl);

            // lockupViewModel: owner can be in metadataRows[*].metadataParts[*].text.commandRuns[*].onTap
            if (candidates.length === 0) {
                const metadataRows = renderer?.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows;
                if (Array.isArray(metadataRows)) {
                    for (const row of metadataRows) {
                        const parts = Array.isArray(row?.metadataParts) ? row.metadataParts : [];
                        for (const part of parts) {
                            const commandRuns = Array.isArray(part?.text?.commandRuns) ? part.text.commandRuns : [];
                            for (const cmd of commandRuns) {
                                const onTap = cmd?.onTap;
                                if (!onTap) continue;
                                const pseudoRun = {
                                    text: part?.text?.content || '',
                                    navigationEndpoint: {
                                        browseEndpoint: onTap?.innertubeCommand?.browseEndpoint,
                                        commandMetadata: onTap?.innertubeCommand?.commandMetadata
                                    }
                                };
                                const parsed = parseRunNavigationEndpoint(pseudoRun);
                                if (parsed && (parsed.id || parsed.handle || parsed.customUrl)) {
                                    candidates.push(parsed);
                                }
                            }
                        }
                    }
                }
            }

            if (candidates.length === 0) return null;

            // Prefer entries with UC ID first; otherwise handle/custom.
            candidates.sort((a, b) => {
                const score = (x) => (x.id ? 3 : 0) + (x.handle ? 2 : 0) + (x.customUrl ? 1 : 0);
                return score(b) - score(a);
            });

            return candidates[0];
        };

        // YTM compact playlist cards:
        // Block the PLAYLIST CREATOR (owner), not the thumbnail's top video channel.
        if (cardTag === 'ytm-compact-playlist-renderer') {
            const playlistAvatarUrl = (() => {
                const img = card.querySelector(
                    'ytm-channel-thumbnail-with-link-renderer img, ' +
                    'ytm-profile-icon img, ' +
                    'yt-avatar-shape img, ' +
                    'yt-img-shadow img'
                );
                if (!img) return '';
                return (img.getAttribute('src') || img.src || '').trim();
            })();

            const playlistHref = card.querySelector('a[href^="/playlist?list="], a[href*="/playlist?list="]')?.getAttribute?.('href') || '';
            const playlistId = (() => {
                if (!playlistHref) return '';
                const qs = playlistHref.split('?')[1] || '';
                const params = new URLSearchParams(qs);
                return params.get('list') || '';
            })();
            const inlineOwner = (() => {
                const candidates = [
                    card.data,
                    card.data?.content,
                    card.__data,
                    card.__data?.data,
                    card.__data?.item,
                    card.__data?.data?.content
                ];
                for (const candidate of candidates) {
                    const parsed = extractPlaylistOwnerFromRendererData(candidate, playlistId);
                    if (parsed && (parsed.id || parsed.handle || parsed.customUrl)) {
                        return parsed;
                    }
                }
                return null;
            })();

            const bylineText = card.querySelector(
                '.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string, ' +
                '.YtmBadgeAndBylineRendererItemByline, ' +
                '.YtmCompactMediaItemByline .yt-core-attributed-string, ' +
                '.YtmCompactMediaItemByline'
            )?.textContent?.trim() || '';

            const creatorName = (() => {
                const raw = (bylineText || '').trim();
                if (!raw) return '';
                const match = raw.match(/^(.+?)\s*[•·]\s*playlist\b/i);
                if (!match || !match[1]) return '';
                const candidate = match[1].trim();
                if (!candidate || isLikelyNonChannelName(candidate)) return '';
                return candidate;
            })();

            if (inlineOwner) {
                return {
                    handle: inlineOwner.handle || '',
                    id: inlineOwner.id || '',
                    customUrl: inlineOwner.customUrl || '',
                    name: inlineOwner.name || creatorName || '',
                    logo: playlistAvatarUrl || '',
                    source: 'ytm_playlist_card',
                    playlistId,
                    needsFetch: false,
                    fetchStrategy: 'playlist',
                    expectedChannelName: creatorName || inlineOwner.name || null
                };
            }

            // Sometimes YTM provides an owner link in the byline; prefer that.
            const creatorLink = card.querySelector(
                '.YtmBadgeAndBylineRendererItemByline a[href^="/@"], ' +
                '.YtmBadgeAndBylineRendererItemByline a[href^="/channel/"], ' +
                '.YtmBadgeAndBylineRendererItemByline a[href^="/c/"], ' +
                '.YtmBadgeAndBylineRendererItemByline a[href^="/user/"], ' +
                '.YtmCompactMediaItemByline a[href^="/@"], ' +
                '.YtmCompactMediaItemByline a[href^="/channel/"], ' +
                '.YtmCompactMediaItemByline a[href^="/c/"], ' +
                '.YtmCompactMediaItemByline a[href^="/user/"]'
            );
            const creatorHref = creatorLink?.getAttribute?.('href') || '';
            const creatorHandle = normalizeHandleValue(extractRawHandle(creatorHref) || '');
            const creatorId = extractChannelIdFromString(creatorHref) || '';
            const creatorCustomUrl = (() => {
                const match = creatorHref.match(/\/(c|user)\/([^/?#]+)/);
                if (match && match[1] && match[2]) {
                    try {
                        return `${match[1]}/${decodeURIComponent(match[2])}`;
                    } catch (_) {
                        return `${match[1]}/${match[2]}`;
                    }
                }
                return '';
            })();

            if (creatorHandle || creatorId || creatorCustomUrl) {
                const linkedText = creatorLink?.textContent?.trim() || '';
                const linkedName = (() => {
                    const raw = linkedText;
                    if (!raw) return '';
                    const match = raw.match(/^(.+?)\s*[•·]\s*playlist\b/i);
                    if (match && match[1]) return match[1].trim();
                    return raw;
                })();
                return {
                    handle: creatorHandle || '',
                    id: creatorId || '',
                    customUrl: creatorCustomUrl || '',
                    name: linkedName || creatorName || '',
                    logo: playlistAvatarUrl || '',
                    source: 'ytm_playlist_card',
                    playlistId
                };
            }

            if (playlistId) {
                return {
                    handle: '',
                    id: '',
                    customUrl: '',
                    name: creatorName || '',
                    logo: playlistAvatarUrl || '',
                    source: 'ytm_playlist_card',
                    playlistId,
                    needsFetch: true,
                    fetchStrategy: 'playlist',
                    expectedChannelName: creatorName || null
                };
            }
        }

        // YTM lockup playlist cards can hide owner identity in inline lockupViewModel metadata rows.
        // Prefer this over seed-video heuristics when the card points to a playlist.
        if (cardTag === 'ytm-rich-item-renderer' || cardTag === 'yt-lockup-view-model') {
            const playlistHref = card.querySelector('a[href^="/playlist?list="], a[href*="/playlist?list="]')?.getAttribute?.('href') || '';
            if (playlistHref) {
                const qs = playlistHref.split('?')[1] || '';
                const params = new URLSearchParams(qs);
                const playlistId = params.get('list') || '';

                const inlineOwner = (() => {
                    const candidates = [
                        card.data,
                        card.data?.content,
                        card.data?.content?.lockupViewModel,
                        card.__data,
                        card.__data?.data,
                        card.__data?.item,
                        card.__data?.data?.content,
                        card.__data?.data?.content?.lockupViewModel
                    ];
                    for (const candidate of candidates) {
                        const parsed = extractPlaylistOwnerFromRendererData(candidate, playlistId);
                        if (parsed && (parsed.id || parsed.handle || parsed.customUrl)) return parsed;
                    }
                    return null;
                })();

                if (inlineOwner) {
                    const bylineText = card.querySelector(
                        '.yt-content-metadata-view-model__metadata-row .yt-core-attributed-string, ' +
                        '.yt-lockup-metadata-view-model .yt-core-attributed-string'
                    )?.textContent?.trim() || '';
                    const expectedChannelName = (() => {
                        const raw = (bylineText || '').trim();
                        const match = raw.match(/^(.+?)\s*[•·]\s*playlist\b/i);
                        if (match && match[1]) return match[1].trim();
                        return inlineOwner.name || '';
                    })();
                    return {
                        handle: inlineOwner.handle || '',
                        id: inlineOwner.id || '',
                        customUrl: inlineOwner.customUrl || '',
                        name: inlineOwner.name || expectedChannelName || '',
                        logo: '',
                        source: 'ytm_playlist_card',
                        playlistId,
                        needsFetch: false,
                        fetchStrategy: 'playlist',
                        expectedChannelName: expectedChannelName || null
                    };
                }
            }
        }

        const extractAvatarUrl = () => {
            const img = card.querySelector(
                '#avatar img, ' +
                'ytd-channel-name img, ' +
                'ytd-video-owner-renderer img, ' +
                'ytm-channel-thumbnail-with-link-renderer img, ' +
                'ytm-slim-owner-renderer img, ' +
                'ytm-profile-icon img, ' +
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
                const name = sanitizeChannelNameForCard(channelNameEl.textContent?.trim() || '', card);

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
                const channelName = sanitizeChannelNameForCard(
                    card.querySelector('#channel-info #channel-name a, #channel-name #text a, ytd-channel-name #text a')?.textContent?.trim() || '',
                    card
                );
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
                // Avoid deriving channel names from thumbnail/title anchors on Shorts cards.
                // Those links frequently carry video title text and can poison persisted channel names.
                const canonicalNameFromDom = sanitizeChannelNameForCard(
                    card.querySelector(
                        '#channel-info #channel-name a, ' +
                        '#channel-name #text a, ' +
                        'ytd-channel-name #text a, ' +
                        '.shortsLockupViewModelHostOutsideMetadataChannelName, ' +
                        '.shortsLockupViewModelHostInlineMetadataChannelName'
                    )?.textContent?.trim() || '',
                    card
                );
                const stampedName = sanitizeChannelNameForCard(
                    card.getAttribute('data-filtertube-channel-name') ||
                    card.querySelector('[data-filtertube-channel-name]')?.getAttribute('data-filtertube-channel-name') ||
                    '',
                    card
                );
                const attrTextName = (() => {
                    const channelLinkWithAttr = card.querySelector('[data-filtertube-channel-handle], [data-filtertube-channel-id]');
                    if (!channelLinkWithAttr) return '';
                    let candidate = channelLinkWithAttr.textContent?.trim() || '';
                    if (candidate && channelLinkWithAttr?.childNodes) {
                        const directText = Array.from(channelLinkWithAttr.childNodes)
                            .filter(n => n.nodeType === Node.TEXT_NODE)
                            .map(n => n.textContent.trim())
                            .join('')
                            .trim();
                        if (directText) {
                            candidate = directText;
                        }
                    }
                    return sanitizeChannelNameForCard(candidate, card);
                })();
                const name = canonicalNameFromDom || stampedName || attrTextName || '';
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
                    const name = sanitizeChannelNameForCard(shortsChannelLink.textContent?.trim() || '', card);
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
                    const expectedNameFromShorts = sanitizeChannelNameForCard(
                        card.querySelector(
                            '.shortsLockupViewModelHostOutsideMetadataChannelName, ' +
                            '.shortsLockupViewModelHostInlineMetadataChannelName, ' +
                            'ytm-slim-owner-renderer a, ' +
                            'ytm-channel-thumbnail-with-link-renderer a'
                        )?.textContent?.trim() || '',
                        card
                    );
                    const expectedHandle = extractRawHandle(
                        card.querySelector(
                            '.shortsLockupViewModelHostOutsideMetadataChannelName[href*="/@"], ' +
                            '.shortsLockupViewModelHostInlineMetadataChannelName[href*="/@"], ' +
                            'ytm-slim-owner-renderer a[href*="/@"], ' +
                            'ytm-channel-thumbnail-with-link-renderer a[href*="/@"]'
                        )?.getAttribute?.('href') || ''
                    );
                    // Return a promise marker - we'll need to handle this async
                    return {
                        videoId,
                        needsFetch: true,
                        fetchStrategy: 'mainworld',
                        expectedChannelName: expectedNameFromShorts || null,
                        expectedHandle: expectedHandle || null
                    };
                }
            }

            console.warn('FilterTube: SHORTS card detected but no channel info found in card - skipping menu injection');
            // Return null - we can't block without channel info
            return null;
        }

        // SPECIAL CASE: Mix cards (collection stacks / "My Mix")
        const isMixCard = isMixCardElement(card);
        if (isMixCard) {
            const mixVideoId = extractVideoIdFromCard(card) || '';
            const cachedMixIdentity = getSeedIdentityForVideoId(mixVideoId, null) || {};
            const cachedMixCanonicalName = sanitizeChannelNameForCard(
                cachedMixIdentity.name || '',
                card
            );
            const cachedMixExpectedName = sanitizeChannelNameForCard(
                cachedMixIdentity.expectedChannelName || '',
                card
            );
            const mixBylineText = () => card.querySelector(
                '.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string, ' +
                '.YtmCompactMediaItemByline .yt-core-attributed-string, ' +
                '.YtmCompactMediaItemByline'
            )?.textContent?.trim() || '';
            const rawMixByline = mixBylineText();
            const parsedBylineCollaborators = parseCollaboratorNames(rawMixByline);
            const bylineExpectedCollaboratorCount = (() => {
                if (!parsedBylineCollaborators?.names) return 0;
                const explicit = parsedBylineCollaborators.names.length;
                const hidden = parsedBylineCollaborators.hasHiddenCollaborators ? (parsedBylineCollaborators.hiddenCount || 0) : 0;
                return explicit + hidden;
            })();
            const expectedFromByline = (() => {
                const candidate = deriveExpectedChannelName(rawMixByline);
                const safeCandidate = sanitizeChannelNameForCard(candidate, card);
                if (!safeCandidate || hasCollapsedBylineText(safeCandidate)) return '';
                if (isLikelyVideoTitle(safeCandidate)) return '';
                return safeCandidate;
            })();

            const normalizeText = (value) => {
                if (!value || typeof value !== 'string') return '';
                return value.trim().toLowerCase().replace(/\s+/g, ' ');
            };
            const getHeadlineText = () => {
                return card.querySelector(
                    '.media-item-headline .yt-core-attributed-string, ' +
                    '.YtmCompactMediaItemHeadline .yt-core-attributed-string, ' +
                    '.YtmCompactMediaItemHeadline, ' +
                    'h3.media-item-headline, h3'
                )?.textContent?.trim() || '';
            };
            const isLikelyVideoTitle = (candidate) => {
                if (!candidate || typeof candidate !== 'string') return false;
                const normalizedCandidate = normalizeText(candidate);
                if (!normalizedCandidate) return false;
                const headline = normalizeText(getHeadlineText());
                if (headline && normalizedCandidate === headline) return true;
                const headlineAria = normalizeText(
                    card.querySelector(
                        '.media-item-headline [aria-label], .YtmCompactMediaItemHeadline [aria-label]'
                    )?.getAttribute?.('aria-label') || ''
                );
                if (headlineAria && (headlineAria.startsWith(`${normalizedCandidate} by `) || headlineAria.startsWith(normalizedCandidate))) {
                    return true;
                }
                return false;
            };
            const deriveMixName = () => {
                if (cachedMixCanonicalName) return cachedMixCanonicalName;
                if (cachedMixExpectedName) return cachedMixExpectedName;

                if (rawMixByline) {
                    const parsed = parseCollaboratorNames(rawMixByline);
                    if (parsed.names.length === 1 && !parsed.hasHiddenCollaborators) {
                        const candidate = sanitizeChannelNameForCard(parsed.names[0], card);
                        if (candidate && !isLikelyVideoTitle(candidate) && !hasCollapsedBylineText(candidate)) {
                            return candidate;
                        }
                    }
                    const safeCandidate = sanitizeChannelNameForCard(rawMixByline, card);
                    if (safeCandidate && !isLikelyVideoTitle(safeCandidate) && !hasCollapsedBylineText(safeCandidate)) {
                        return safeCandidate;
                    }
                }

                const nameEl = card.querySelector(
                    '#channel-info ytd-channel-name a, ' +
                    '#channel-name #text a, ' +
                    '.YtmBadgeAndBylineRendererItemByline a[href*="/@"], ' +
                    '.YtmBadgeAndBylineRendererItemByline a[href*="/channel/"], ' +
                    'ytd-channel-name #text a'
                );
                const candidate = nameEl?.textContent?.trim() || '';
                if (!candidate) return '';
                const lower = candidate.toLowerCase();
                if (lower.startsWith('mix') || lower.startsWith('my mix')) return '';
                if (lower.includes('mix') && candidate.includes('–')) return '';
                if (isLikelyVideoTitle(candidate)) return '';
                if (hasCollapsedBylineText(candidate)) return '';
                return sanitizeChannelNameForCard(candidate, card);
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
                if (
                    stamped &&
                    !stamped.includes('•') &&
                    !isLikelyVideoTitle(stamped) &&
                    !hasCollapsedBylineText(stamped)
                ) {
                    name = stamped;
                }
                }
                const handleOnlyName = normalizeHandleValue(handle);
                if (!name && !cachedMixCanonicalName && !cachedMixExpectedName && !expectedFromByline && handleOnlyName) {
                    name = handleOnlyName;
                }

                const expectedCollaboratorCountFromData = parseInt(card.getAttribute('data-filtertube-expected-collaborators') || '0', 10) || 0;
                const parsedNameCollaborators = parseCollaboratorNames(name || cachedMixExpectedName || expectedFromByline || rawMixByline || '');
                const parsedNameExpectedCount = parsedNameCollaborators.names.length + (parsedNameCollaborators.hasHiddenCollaborators ? (parsedNameCollaborators.hiddenCount || 0) : 0);
                const hasMixNameCollaborationHint = parsedNameCollaborators.hasHiddenCollaborators || parsedNameCollaborators.names.length > 1;
                const expectedCollaboratorCount = Math.max(
                    expectedCollaboratorCountFromData,
                    bylineExpectedCollaboratorCount,
                    parsedNameExpectedCount,
                    0
                );
                const mixCollaborators = (() => {
                    const extracted = extractCollaboratorMetadataFromElement(card) || [];
                    return sanitizeCollaboratorList(extracted);
                })();
                const provisionalMixCollaborators = (() => {
                    const seen = new Set();
                    const names = Array.isArray(parsedNameCollaborators?.names) ? parsedNameCollaborators.names : [];
                    if (!names.length) return [];
                    return names.map((entryName, index) => {
                        if (!entryName) return null;
                        const normalized = String(entryName).trim();
                        if (!normalized) return null;
                        const lower = normalized.toLowerCase();
                        if (seen.has(lower)) return null;
                        seen.add(lower);
                        const fallback = mixCollaborators[index] || {};
                        return {
                            name: normalized,
                            id: index === 0 ? (fallback.id || id || '') : (fallback.id || ''),
                            handle: index === 0 ? (fallback.handle || handle || '') : (fallback.handle || ''),
                            customUrl: index === 0 ? (fallback.customUrl || customUrl || '') : (fallback.customUrl || '')
                        };
                    }).filter(Boolean);
                })();
                const finalMixCollaborators = mixCollaborators.length > 0 ? mixCollaborators : provisionalMixCollaborators;
                if (mixCollaborators.length >= 2 || expectedCollaboratorCount > 1 || (hasMixNameCollaborationHint && finalMixCollaborators.length > 0)) {
                    const first = finalMixCollaborators[0] || {};
                    const hasMissingIdentity = finalMixCollaborators.some((collaborator) => !collaborator?.id && !collaborator?.handle && !collaborator?.customUrl);
                    return {
                        ...(first || {}),
                        id: first.id || id || '',
                        handle: first.handle || handle || '',
                        customUrl: first.customUrl || customUrl || '',
                        name: name || first.name || '',
                        expectedChannelName: cachedMixExpectedName || expectedFromByline || null,
                        logo: extractAvatarUrl() || '',
                        isCollaboration: true,
                        allCollaborators: finalMixCollaborators,
                        needsEnrichment: hasMissingIdentity || finalMixCollaborators.length < expectedCollaboratorCount,
                        expectedCollaboratorCount: Math.max(expectedCollaboratorCount, finalMixCollaborators.length),
                        videoId: mixVideoId
                    };
                }

                console.log('FilterTube: Extracted from Mix card:', { id, handle, customUrl, name });
                return {
                    id: id || '',
                    handle: handle || '',
                    customUrl: customUrl || '',
                    name: name || '',
                    expectedChannelName: cachedMixExpectedName || expectedFromByline || null,
                    logo: extractAvatarUrl() || ''
                };
            }
        }

        // SPECIAL CASE: Detect if this is a Post card (desktop + mobile YTM variants)
        const isPostCard = (
            card.tagName.toLowerCase() === 'ytd-post-renderer' ||
            card.tagName.toLowerCase() === 'ytm-post-renderer' ||
            card.tagName.toLowerCase() === 'ytm-backstage-post-renderer' ||
            card.tagName.toLowerCase() === 'ytm-backstage-post-thread-renderer' ||
            card.tagName.toLowerCase() === 'ytm-rich-section-renderer'
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
        const collabBylineText = (() => {
            const selectors = [
                '#attributed-channel-name',
                '#byline',
                '#byline-container',
                'ytd-video-owner-renderer .yt-core-attributed-string',
                '.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row:first-child .yt-content-metadata-view-model__metadata-text',
                '.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string',
                '.YtmCompactMediaItemByline .yt-core-attributed-string'
            ];
            for (const selector of selectors) {
                const text = card.querySelector(selector)?.textContent?.trim();
                if (text) return text;
            }
            return '';
        })();
        const parsedBylineCollaborators = parseCollaboratorNames(collabBylineText || '');
        const expectedBylineCount = (
            (Array.isArray(parsedBylineCollaborators?.names) ? parsedBylineCollaborators.names.length : 0) +
            (parsedBylineCollaborators?.hasHiddenCollaborators ? (parsedBylineCollaborators.hiddenCount || 0) : 0)
        );
        const resolvedExpectedCount = Math.max(
            expectedCount,
            expectedBylineCount
        );
        const collabBylineSignal = parsedBylineCollaborators?.hasHiddenCollaborators ||
            (parsedBylineCollaborators?.names?.length > 1 && (avatarStackSignal || card.querySelector('yt-avatar-stack-view-model, #attributed-channel-name') || isMixCardElement(card)));
        const provisionalCollabFromByline = (() => {
            const names = Array.isArray(parsedBylineCollaborators?.names) ? parsedBylineCollaborators.names : [];
            if (!names.length) return [];
            const seen = new Set();
            return names.map((entryName, index) => {
                if (!entryName) return null;
                const normalized = String(entryName).trim();
                if (!normalized) return null;
                const lowered = normalized.toLowerCase();
                if (seen.has(lowered)) return null;
                seen.add(lowered);
                const seed = collaborators[index] || {};
                return {
                    name: normalized,
                    id: index === 0 ? (seed.id || '') : '',
                    handle: index === 0 ? (seed.handle || '') : '',
                    customUrl: index === 0 ? (seed.customUrl || '') : ''
                };
            }).filter(Boolean);
        })();
        const fallbackCollaborators = collaborators.length > 0 ? collaborators : provisionalCollabFromByline;

        const hasCollaborationSignal = Boolean(
            collaborators && collaborators.length > 1 ||
            (avatarStackSignal && expectedCount > 1 && collaborators && collaborators.length > 0) ||
            (collabBylineSignal && resolvedExpectedCount > 1)
        );

        if (hasCollaborationSignal) {
            const hasMissingData = fallbackCollaborators.some(c => !c.handle && !c.id && !c.customUrl);
            const hasMissingAlternateIdentity = fallbackCollaborators.some(c =>
                Boolean(c?.id) &&
                !c?.handle &&
                !c?.customUrl &&
                !/\s-\stopic$/i.test(String(c?.name || '').trim())
            );
            const needsMoreCollaborators = resolvedExpectedCount > 0 && fallbackCollaborators.length < resolvedExpectedCount;

            console.log('FilterTube: Collaboration detected through unified extraction:', {
                count: fallbackCollaborators.length,
                expected: resolvedExpectedCount,
                needsEnrichment: hasMissingData || hasMissingAlternateIdentity || needsMoreCollaborators
            });

            return {
                ...(fallbackCollaborators[0] || {}),
                isCollaboration: true,
                allCollaborators: fallbackCollaborators,
                needsEnrichment: hasMissingData || hasMissingAlternateIdentity || needsMoreCollaborators,
                expectedCollaboratorCount: resolvedExpectedCount,
                videoId: videoId
            };
        }

        // Method 2: Check for data attributes (added by FilterTube's own processing)
        const dataHandle = card.getAttribute('data-filtertube-channel-handle') ||
            card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
        const dataId = card.getAttribute('data-filtertube-channel-id') ||
            card.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id');
        const dataCustomUrl = card.getAttribute('data-filtertube-channel-custom') ||
            card.querySelector('[data-filtertube-channel-custom]')?.getAttribute('data-filtertube-channel-custom') ||
            '';
        const isPlaylistPanelCard = (
            cardTag === 'ytd-playlist-panel-video-renderer' ||
            cardTag === 'ytd-playlist-panel-video-wrapper-renderer' ||
            cardTag === 'ytm-playlist-panel-video-renderer' ||
            cardTag === 'ytm-playlist-panel-video-wrapper-renderer'
        );
        const isCollectionPlaylistCard = (
            cardTag === 'ytm-compact-playlist-renderer' ||
            cardTag === 'ytm-compact-radio-renderer' ||
            cardTag === 'ytm-radio-renderer'
        );

        const parseCustomUrlFromHref = (href) => {
            if (!href || typeof href !== 'string') return '';
            const match = href.match(/\/(c|user)\/([^/?#]+)/);
            if (match && match[1] && match[2]) {
                try {
                    return `${match[1]}/${decodeURIComponent(match[2])}`;
                } catch (e) {
                    return `${match[1]}/${match[2]}`;
                }
            }
            return '';
        };

        if (dataHandle || dataId) {
            let name = null;
            let handle = dataHandle;
            let id = dataId;
            let customUrl = dataCustomUrl;
            const videoIdHint = extractVideoIdFromCard(card) || '';
            const playlistIdHint = isCollectionPlaylistCard ? extractPlaylistIdFromElement(card) : '';

            if (isCollectionPlaylistCard) {
                const explicitAuthorAnchor = card.querySelector(
                    '.YtmCompactMediaItemByline a[href*="/@"], ' +
                    '.YtmCompactMediaItemByline a[href*="/channel/UC"], ' +
                    '.YtmCompactMediaItemByline a[href*="/c/"], ' +
                    '.YtmCompactMediaItemByline a[href*="/user/"], ' +
                    '.yt-content-metadata-view-model__metadata-row a[href*="/@"], ' +
                    '.yt-content-metadata-view-model__metadata-row a[href*="/channel/UC"], ' +
                    '.yt-content-metadata-view-model__metadata-row a[href*="/c/"], ' +
                    '.yt-content-metadata-view-model__metadata-row a[href*="/user/"]'
                );
                const collectionNav = card.querySelector(
                    'a[href*="/playlist?list="], a[href*="list=RD"], a[href*="start_radio=1"]'
                );
                if (!explicitAuthorAnchor && collectionNav) {
                    // Recycled collection cards frequently inherit stale stamped IDs/handles.
                    // When no explicit author link exists, force identity refresh from visible text.
                    id = '';
                    handle = '';
                    customUrl = '';
                    try {
                        clearCachedChannelMetadata(card);
                        card.removeAttribute('data-filtertube-channel-custom');
                        card.removeAttribute('data-filtertube-channel-name');
                        card.removeAttribute('data-filtertube-channel-id');
                        card.removeAttribute('data-filtertube-channel-handle');
                        card.removeAttribute('data-filtertube-channel-logo');
                        card.removeAttribute('data-filtertube-channel-source');
                        card.removeAttribute('data-filtertube-channel-fetch-strategy');
                        card.removeAttribute('data-filtertube-channel-expected-channel-name');
                    } catch (e) {
                        card.removeAttribute('data-filtertube-channel-id');
                        card.removeAttribute('data-filtertube-channel-handle');
                        card.removeAttribute('data-filtertube-channel-name');
                        card.removeAttribute('data-filtertube-channel-custom');
                        card.removeAttribute('data-filtertube-channel-logo');
                        card.removeAttribute('data-filtertube-channel-source');
                        card.removeAttribute('data-filtertube-channel-fetch-strategy');
                        card.removeAttribute('data-filtertube-channel-expected-channel-name');
                    }
                }
            }

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
                    '#byline a[href*="/@"], #byline a[href*="/channel/"], #byline a[href*="/c/"], #byline a[href*="/user/"], ' +
                    '.YtmCompactMediaItemByline a[href*="/@"], ' +
                    '.YtmCompactMediaItemByline a[href*="/channel/"], ' +
                    '.YtmCompactMediaItemByline a[href*="/c/"], ' +
                    '.YtmCompactMediaItemByline a[href*="/user/"]'
                );
                const bylineHref = bylineAnchor?.getAttribute('href') || bylineAnchor?.href || '';
                const bylineId = extractChannelIdFromString(bylineHref) || '';
                const bylineHandle = normalizeHandleValue(extractRawHandle(bylineHref) || '');
                const bylineCustomUrl = parseCustomUrlFromHref(bylineHref);

                if (mappedId) {
                    id = mappedId;
                    handle = bylineHandle || '';
                    if (!customUrl && bylineCustomUrl) customUrl = bylineCustomUrl;
                } else if (bylineId || bylineHandle) {
                    id = bylineId || '';
                    handle = bylineHandle || '';
                    if (!customUrl && bylineCustomUrl) customUrl = bylineCustomUrl;
                } else {
                    // Playlist rows without explicit author links must not trust recycled stamped IDs/handles.
                    // They are rehydrated aggressively and can inherit channel identity from another row.
                    id = '';
                    handle = '';
                    try {
                        clearCachedChannelMetadata(card);
                        card.removeAttribute('data-filtertube-channel-name');
                        card.removeAttribute('data-filtertube-channel-custom');
                        card.removeAttribute('data-filtertube-channel-source');
                        card.removeAttribute('data-filtertube-channel-fetch-strategy');
                        card.removeAttribute('data-filtertube-channel-expected-channel-name');
                    } catch (e) {
                        card.removeAttribute('data-filtertube-channel-id');
                        card.removeAttribute('data-filtertube-channel-handle');
                        card.removeAttribute('data-filtertube-channel-name');
                        card.removeAttribute('data-filtertube-channel-custom');
                        card.removeAttribute('data-filtertube-channel-source');
                        card.removeAttribute('data-filtertube-channel-fetch-strategy');
                        card.removeAttribute('data-filtertube-channel-expected-channel-name');
                    }
                }
            }

            if (!name) {
                const stamped = card.getAttribute('data-filtertube-channel-name') ||
                    card.querySelector('[data-filtertube-channel-name]')?.getAttribute('data-filtertube-channel-name') ||
                    '';
                const safeStamped = sanitizeChannelNameForCard(stamped, card);
                if (safeStamped && !hasCollapsedBylineText(safeStamped)) {
                    name = safeStamped;
                }
            }

            // Playlist panel items often render the channel name as plain text (#byline), not a link.
            if (!name && isPlaylistPanelCard) {
                const bylineText = card.querySelector(
                    '.YtmCompactMediaItemByline .yt-core-attributed-string, ' +
                    '.YtmCompactMediaItemByline, ' +
                    '#byline'
                )?.textContent?.trim() || '';
                const safeBylineText = sanitizeChannelNameForCard(bylineText, card);
                if (safeBylineText &&
                    !safeBylineText.includes('•') &&
                    !hasCollapsedBylineText(safeBylineText) &&
                    !isLikelyVideoTitle(safeBylineText)) {
                    name = safeBylineText;
                }
                if (!name) {
                    const ytmHeadlineAria = card.querySelector('.YtmCompactMediaItemHeadline [aria-label]')?.getAttribute('aria-label') || '';
                    const derived = deriveExpectedChannelName(ytmHeadlineAria);
                    const safeDerived = sanitizeChannelNameForCard(derived, card);
                    if (safeDerived && !hasCollapsedBylineText(safeDerived)) name = safeDerived;
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
                'ytm-slim-owner-renderer a, ' +
                'ytm-channel-thumbnail-with-link-renderer a, ' +
                '.watch-card-rich-header-text a, ' +
                '.YtmCompactMediaItemByline a[href^="/@"], ' +
                '.YtmCompactMediaItemByline a[href^="/channel/"], ' +
                '.YtmCompactMediaItemByline a[href^="/c/"], ' +
                '.YtmCompactMediaItemByline a[href^="/user/"], ' +
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
                const safeNameFromLink = sanitizeChannelNameForCard(channelNameEl.textContent?.trim() || '', card);
                if (safeNameFromLink) {
                    name = safeNameFromLink;
                }

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
                    if (!customUrl) {
                        const hrefCustom = parseCustomUrlFromHref(href);
                        if (hrefCustom) customUrl = hrefCustom;
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
                    const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '');
                    const headlineText = normalize(
                        card.querySelector(
                            '.media-item-headline .yt-core-attributed-string, ' +
                            '.YtmCompactMediaItemHeadline .yt-core-attributed-string, ' +
                            '.YtmCompactMediaItemHeadline, h3.media-item-headline, h3'
                        )?.textContent || ''
                    );
                    const normalizedCandidate = normalize(candidateName);
                    // Reject if it looks like overlay text (duration or "Now playing")
                    if (candidateName &&
                        !candidateName.includes('Now playing') &&
                        !/^\d+:\d+/.test(candidateName) &&
                        !/\d+:\d+\s*Now playing/i.test(candidateName) &&
                        !candidateName.includes('•') &&
                        !/\bviews?\b/i.test(candidateName) &&
                        !/\bago\b/i.test(candidateName) &&
                        !/\bwatching\b/i.test(candidateName) &&
                        !(headlineText && normalizedCandidate === headlineText)) {
                        const safeCandidate = sanitizeChannelNameForCard(candidateName, card);
                        if (safeCandidate) {
                            name = safeCandidate;
                        }
                    }
                }
            }

            if (!name) {
                const lockupName = card.querySelector(
                    '.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row:first-child .yt-content-metadata-view-model__metadata-text'
                )?.textContent?.trim() || '';
                if (
                    lockupName &&
                    !hasCollapsedBylineText(lockupName) &&
                    !/\bviews?\b/i.test(lockupName) &&
                    !/\bago\b/i.test(lockupName) &&
                    !/\bwatching\b/i.test(lockupName) &&
                    !lockupName.includes('•')
                ) {
                    const safeLockupName = sanitizeChannelNameForCard(lockupName, card);
                    if (safeLockupName) {
                        name = safeLockupName;
                    }
                }
            }

            if (!name) {
                const avatarImg = card.querySelector('yt-avatar-shape img, img.yt-avatar-shape__image');
                const avatarAlt = avatarImg?.getAttribute('alt')?.trim() || '';
                if (avatarAlt && !/go to channel/i.test(avatarAlt) && !avatarAlt.includes('•')) {
                    const safeAvatarAlt = sanitizeChannelNameForCard(avatarAlt, card);
                    if (safeAvatarAlt) {
                        name = safeAvatarAlt;
                    }
                }
            }

            if (!name) {
                const ytmBylineText = card.querySelector(
                    '.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string, ' +
                    '.YtmBadgeAndBylineRendererItemByline, ' +
                    '.YtmCompactMediaItemByline .yt-core-attributed-string, ' +
                    '.YtmCompactMediaItemByline'
                )?.textContent?.trim() || '';
                if (
                    ytmBylineText &&
                    !hasCollapsedBylineText(ytmBylineText) &&
                    !ytmBylineText.includes('•') &&
                    !/\bviews?\b/i.test(ytmBylineText) &&
                    !/\bago\b/i.test(ytmBylineText) &&
                    !/\bwatching\b/i.test(ytmBylineText)
                ) {
                    const safeYtmByline = sanitizeChannelNameForCard(ytmBylineText, card);
                    if (safeYtmByline) {
                        name = safeYtmByline;
                    }
                }
            }

            const isMixLikeCard = isMixCardElement(card);
            if (isMixLikeCard) {
                const mixBylineText = card.querySelector(
                    '.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string, ' +
                    '.YtmBadgeAndBylineRendererItemByline, ' +
                    '.YtmCompactMediaItemByline .yt-core-attributed-string, ' +
                    '.YtmCompactMediaItemByline'
                )?.textContent?.trim() || '';
                if (mixBylineText) {
                    const parsedMixByline = parseCollaboratorNames(mixBylineText);
                    if (parsedMixByline.hasHiddenCollaborators && parsedMixByline.names.length > 0) {
                        const safeParsedMix = sanitizeChannelNameForCard(parsedMixByline.names[0], card);
                        if (safeParsedMix) {
                            name = safeParsedMix;
                        }
                    } else if (
                        !isLikelyNonChannelName(mixBylineText) &&
                        !hasCollapsedBylineText(mixBylineText) &&
                        !isLikelyVideoTitle(mixBylineText) &&
                        !/^mix\b/i.test(mixBylineText) &&
                        mixBylineText.toLowerCase() !== 'youtube'
                    ) {
                        const safeMixByline = sanitizeChannelNameForCard(mixBylineText, card);
                        if (safeMixByline) {
                            name = safeMixByline;
                        }
                    }
                }
            }

            const parsedCollaboratorsFromName = parseCollaboratorNames(name || '');
            const hasCollabDomSignal = Boolean(
                card.querySelector('yt-avatar-stack-view-model, #attributed-channel-name')
            );
            const avatarMatchesFirstOnly = (() => {
                // Heuristic: for true collaborations the card avatar alt/aria usually matches the FIRST
                // collaborator only (e.g. "Go to channel A"), while the byline string is "A and B".
                // For single channels whose literal name includes "and" (e.g. "Salt and Pepper"),
                // the avatar alt matches the FULL byline string, not just the first token.
                if (!name || typeof name !== 'string') return false;
                if (!parsedCollaboratorsFromName?.names || parsedCollaboratorsFromName.names.length < 2) return false;
                const rawAlt = card.querySelector(
                    'ytm-channel-thumbnail-with-link-renderer img[alt], ' +
                    'ytm-profile-icon img[alt], ' +
                    'yt-avatar-shape img[alt], ' +
                    'yt-img-shadow img[alt], ' +
                    '#avatar img[alt]'
                )?.getAttribute?.('alt') || '';
                const cleanedAlt = rawAlt.replace(/^Go to channel\s+/i, '').trim();
                if (!cleanedAlt) return false;
                const full = name.trim().toLowerCase();
                const first = String(parsedCollaboratorsFromName.names[0] || '').trim().toLowerCase();
                const altLower = cleanedAlt.toLowerCase();
                if (!first) return false;
                if (altLower !== first) return false;
                return altLower !== full;
            })();
            const hasCollabNameHint = Boolean(
                parsedCollaboratorsFromName.hasHiddenCollaborators ||
                (
                    parsedCollaboratorsFromName.names.length >= 2 &&
                    (
                        hasCollabDomSignal ||
                        avatarMatchesFirstOnly ||
                        isMixLikeCard ||
                        /[,،，﹐､]/.test(name || '')
                    )
                )
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

            console.log('FilterTube: Extracted from data attribute:', { handle, id, customUrl, name });
            if (isCollectionPlaylistCard && playlistIdHint) {
                return {
                    handle,
                    id,
                    customUrl,
                    name,
                    logo: extractAvatarUrl() || '',
                    videoId: '',
                    source: 'ytm_playlist_card',
                    playlistId: playlistIdHint,
                    fetchStrategy: 'playlist',
                    needsFetch: !id && !handle && !customUrl,
                    expectedChannelName: name || null
                };
            }
            return { handle, id, customUrl, name, logo: extractAvatarUrl() || '', videoId: videoIdHint || undefined };
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
            const name = sanitizeChannelNameForCard(channelNameLink.textContent?.trim() || '', card);
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
                    const name = sanitizeChannelNameForCard(nameEl?.textContent?.trim() || '', card);
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
                    channelName = sanitizeChannelNameForCard(channelName || '', card);
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
            let name = sanitizeChannelNameForCard(channelNameEl.textContent?.trim() || '', card);

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
                        needsEnrichment: collaborators.some(c =>
                            (!c.handle && !c.id)
                            || (Boolean(c?.id) && !c?.handle && !c?.customUrl && !/\s-\stopic$/i.test(String(c?.name || '').trim()))
                        ),
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
                    const name = sanitizeChannelNameForCard(metaIdLink.textContent?.trim() || '', card);
                    console.log('FilterTube: Extracted from lockup meta (UC):', { id: idMatch[1], name });
                    return { id: idMatch[1], name, logo: extractAvatarUrl() || '' };
                }
            }

            if (metaHandleLink) {
                const href = metaHandleLink.getAttribute('href') || '';
                const handle = extractRawHandle(href);
                const name = sanitizeChannelNameForCard(metaHandleLink.textContent?.trim() || '', card);
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
                    name = sanitizeChannelNameForCard(channelLink.textContent?.trim() || '', card);
                }

                if (!name) {
                    const avatarImg = lockup.querySelector('yt-avatar-shape img, img.yt-avatar-shape__image');
                    const avatarAlt = avatarImg?.getAttribute('alt')?.trim() || '';
                    if (avatarAlt && !/go to channel/i.test(avatarAlt)) {
                        name = sanitizeChannelNameForCard(avatarAlt, card);
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
            const fallbackNameRaw = card.querySelector(
                '#channel-info ytd-channel-name a, ' +
                '#channel-info #channel-name a, ' +
                '.yt-lockup-metadata-view-model__metadata a[href*="/@"], ' +
                '.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string, ' +
                '.YtmCompactMediaItemByline .yt-core-attributed-string, ' +
                '.YtmCompactMediaItemByline, ' +
                '.YtmCompactMediaItemMetadata a, ' +
                'ytm-slim-owner-renderer a, ' +
                '.watch-card-rich-header-text a'
            )?.textContent?.trim() || '';
            const fallbackHeadlineAria = card.querySelector('.YtmCompactMediaItemHeadline [aria-label]')?.getAttribute('aria-label') || '';
            const fallbackName = sanitizeChannelNameForCard(
                deriveExpectedChannelName(fallbackNameRaw)
                || deriveExpectedChannelName(fallbackHeadlineAria)
                || '',
                card
            );
            const playlistOwnerFromByline = (() => {
                const raw = (fallbackNameRaw || '').trim();
                if (!raw) return '';
                const match = raw.match(/^(.+?)\s*[•·]\s*playlist\b/i);
                if (!match || !match[1]) return '';
                const candidate = match[1].trim();
                if (!candidate || isLikelyNonChannelName(candidate)) return '';
                return candidate;
            })();
            const fallbackHandleHref = card.querySelector(
                'ytm-channel-thumbnail-with-link-renderer a[href*="/@"], ' +
                'ytm-slim-owner-renderer a[href*="/@"], ' +
                '.watch-card-rich-header-text a[href*="/@"], ' +
                '.yt-core-attributed-string__link[href*="/@"]'
            )?.getAttribute('href') || '';
            const fallbackHandle = extractRawHandle(fallbackHandleHref);
            console.log('FilterTube: Falling back to main-world lookup for video:', fallbackVideoId, 'expectedName:', fallbackName || 'n/a');
            return {
                videoId: fallbackVideoId,
                needsFetch: true,
                fetchStrategy: 'mainworld',
                expectedChannelName: fallbackName || playlistOwnerFromByline || null,
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
    const isYtmTriggerWrapper = (() => {
        try {
            const tag = String(dropdown?.tagName || '').toLowerCase();
            return tag === 'ytm-bottom-sheet-renderer' || tag === 'ytm-menu-renderer' || tag === 'ytm-menu';
        } catch (e) {
            return false;
        }
    })();
    if (isYtmTriggerWrapper) {
        // On YTM this host wraps the trigger button. The actual menu dialog appears as
        // body-level `bottom-sheet-container` and is handled when that container appears.
        return;
    }

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
        const isPlaylistCreatorFlow = Boolean(
            initialChannelInfo?.fetchStrategy === 'playlist' ||
            initialChannelInfo?.source === 'ytm_playlist_card' ||
            initialChannelInfo?.playlistId
        );

        // Prefer fresh DOM identifiers over any cached collaborator-derived data.
        //
        // IMPORTANT: Playlist collection cards must block the PLAYLIST CREATOR. Those cards are often
        // stamped with a thumbnail seed videoId and then later get a seed channel-id via video→channel
        // stamping. Never allow those stamped IDs/handles to overwrite playlist creator intent.
        const domNameAttr = videoCard.getAttribute('data-filtertube-channel-name') ||
            videoCard.querySelector('[data-filtertube-channel-name]')?.getAttribute('data-filtertube-channel-name');

        if (!isPlaylistCreatorFlow) {
            const domHandleAttr = videoCard.getAttribute('data-filtertube-channel-handle') ||
                videoCard.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
            const domIdAttr = videoCard.getAttribute('data-filtertube-channel-id') ||
                videoCard.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id');

            const domHandleCandidate =
                extractRawHandle(domHandleAttr) ||
                extractRawHandle(
                    videoCard
                        .querySelector(
                            '#channel-info ytd-channel-name a[href*="/@"], ' +
                            'ytd-channel-name #text a[href*="/@"], ' +
                            'ytm-channel-thumbnail-with-link-renderer a[href*="/@"], ' +
                            'ytm-slim-owner-renderer a[href*="/@"], ' +
                            '.watch-card-rich-header-text a[href*="/@"]'
                        )
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
                    videoCard.querySelector(
                        '#channel-info ytd-channel-name a[href*="/channel/UC"], ' +
                        'a#thumbnail[href*="/channel/UC"], ' +
                        'ytm-channel-thumbnail-with-link-renderer a[href*="/channel/UC"], ' +
                        'ytm-slim-owner-renderer a[href*="/channel/UC"], ' +
                        '.watch-card-rich-header-text a[href*="/channel/UC"]'
                    )?.getAttribute('href') || ''
                );

            if (domId) {
                initialChannelInfo.id = domId;
            }
        }

        if (domNameAttr && (!initialChannelInfo.name || typeof initialChannelInfo.name !== 'string' || !initialChannelInfo.name.trim())) {
            const safeDomName = sanitizeChannelNameForCard(domNameAttr, videoCard);
            if (safeDomName) {
                initialChannelInfo.name = safeDomName;
            }
        }
    }

    if (!initialChannelInfo || (!initialChannelInfo.handle && !initialChannelInfo.id && !initialChannelInfo.customUrl && !initialChannelInfo.isCollaboration && !initialChannelInfo.needsFetch)) {
        console.log('FilterTube: Could not extract channel info from card');
        clearFilterTubeMenuItems(dropdown);
        return;
    }

    console.log('FilterTube: Initial channel info:', initialChannelInfo);

    const isMixCardContext = (() => {
        try {
            return !isCommentContextCard && typeof isMixCardElement === 'function' && isMixCardElement(videoCard);
        } catch (e) {
            return false;
        }
    })();

    if (isMixCardContext) {
        try {
            if (!initialChannelInfo?.isCollaboration) {
                videoCard?.removeAttribute('data-filtertube-collaborators');
                videoCard?.removeAttribute('data-filtertube-collaborators-source');
                videoCard?.removeAttribute('data-filtertube-collaborators-ts');
                videoCard?.removeAttribute('data-filtertube-expected-collaborators');
                videoCard?.removeAttribute('data-filtertube-collab-state');
                videoCard?.removeAttribute('data-filtertube-collab-awaiting-dialog');
                initialChannelInfo = {
                    ...initialChannelInfo,
                    isCollaboration: false,
                    allCollaborators: [],
                    needsEnrichment: false,
                    expectedCollaboratorCount: 0
                };
            }
        } catch (e) {
        }
    }

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
        // IMPORTANT: For playlist cards we must not backfill a thumbnail videoId and then
        // resolve the top video's channel. Playlists block the playlist creator.
        const isPlaylistCreatorFlow = initialChannelInfo?.fetchStrategy === 'playlist' || Boolean(initialChannelInfo?.playlistId);
        if (isPlaylistCreatorFlow) {
            // Defensive: playlist cards should never carry a seed thumbnail videoId/channel stamp.
            // Clear any stale stamps so quick-block and future passes can't accidentally treat this
            // playlist as a video card.
            try {
                videoCard.removeAttribute('data-filtertube-video-id');
                videoCard.removeAttribute('data-filtertube-channel-id');
                videoCard.removeAttribute('data-filtertube-channel-handle');
                videoCard.removeAttribute('data-filtertube-channel-custom');
            } catch (e) {
            }
        }
        if (!isPlaylistCreatorFlow && initialChannelInfo.videoId) {
            if (!videoCard.getAttribute('data-filtertube-video-id')) {
                videoCard.setAttribute('data-filtertube-video-id', initialChannelInfo.videoId);
            }
        } else if (!isPlaylistCreatorFlow) {
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
            return Boolean(normalizeHandleValue(value || ''));
        };

        const hasVideoId = typeof initialChannelInfo.videoId === 'string' && initialChannelInfo.videoId.trim();
        const safeCurrentName = sanitizeChannelNameForCard(initialChannelInfo?.name || '', videoCard);
        const safeExpectedName = sanitizeChannelNameForCard(initialChannelInfo?.expectedChannelName || '', videoCard);
        if (safeCurrentName) {
            initialChannelInfo.name = safeCurrentName;
        }
        if (safeExpectedName) {
            initialChannelInfo.expectedChannelName = safeExpectedName;
        } else if (initialChannelInfo?.expectedChannelName) {
            initialChannelInfo.expectedChannelName = null;
        }
        const nameLooksBad = !safeCurrentName || isUcIdLike(safeCurrentName) || isHandleLike(safeCurrentName);
        // IMPORTANT: Do NOT treat a missing/placeholder name as a reason to do main-world lookup
        // when we already have a stable UC ID. This was causing playlist/Mix items to be overridden
        // by unrelated channels found in ytInitialData deep search.
        // Only require main-world lookup when UC ID is missing.
        // If UC ID is already present, avoid extra lookup churn that can race with
        // recycled DOM nodes and cause identity overrides.
        const missingIdentityBits = !initialChannelInfo.id;

        if (!isCommentContextCard
            && initialChannelInfo.source !== 'comments'
            && !initialChannelInfo.isCollaboration
            && initialChannelInfo.fetchStrategy !== 'playlist'
            && hasVideoId
            && missingIdentityBits
        ) {
            initialChannelInfo.needsFetch = true;
            initialChannelInfo.fetchStrategy = 'mainworld';
            if (!initialChannelInfo.expectedHandle && initialChannelInfo.handle) {
                initialChannelInfo.expectedHandle = initialChannelInfo.handle;
            }
            if (!initialChannelInfo.expectedChannelName && safeCurrentName && !nameLooksBad) {
                initialChannelInfo.expectedChannelName = safeCurrentName;
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
                const oldMenuList = resolveOldMenuContainer(dropdown);

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
            const retryOld = resolveOldMenuContainer(dropdown);
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
            if (!videoCard.getAttribute('data-filtertube-channel-id')) {
                setValidatedChannelId(videoCard, safeId);
            }

            const safeHandle = typeof initialChannelInfo.handle === 'string' ? initialChannelInfo.handle.trim() : '';
            if (safeHandle && safeHandle.startsWith('@') && !videoCard.getAttribute('data-filtertube-channel-handle')) {
                videoCard.setAttribute('data-filtertube-channel-handle', safeHandle);
            }

            const safeCustom = typeof initialChannelInfo.customUrl === 'string' ? initialChannelInfo.customUrl.trim() : '';
            if (safeCustom && !videoCard.getAttribute('data-filtertube-channel-custom')) {
                videoCard.setAttribute('data-filtertube-channel-custom', safeCustom);
            }

            const safeName = sanitizeChannelNameForCard(
                (typeof initialChannelInfo.name === 'string' ? initialChannelInfo.name.trim() : ''),
                videoCard
            );
            if (safeName && safeName.toLowerCase() !== 'channel' && !safeName.startsWith('@') && !/^UC[a-zA-Z0-9_-]{22}$/.test(safeName) && !safeName.includes('•')) {
                const currentName = sanitizeChannelNameForCard(
                    videoCard.getAttribute('data-filtertube-channel-name') || '',
                    videoCard
                );
                const isCurrentNamePlaceholder = !currentName || isLikelyNonChannelName(currentName) || hasCollapsedByline(currentName);
                if (!videoCard.getAttribute('data-filtertube-channel-name') || isCurrentNamePlaceholder) {
                    videoCard.setAttribute('data-filtertube-channel-name', safeName);
                }
            }
        } catch (e) {
        }
    }

    if (!isMixCardContext && !initialChannelInfo.isCollaboration && videoId) {
        const cachedResolved = resolvedCollaboratorsByVideoId.get(videoId);
        const bylineHintText = (() => {
            try {
                if (!videoCard) return '';
                const selectors = [
                    '#attributed-channel-name',
                    '#byline',
                    '#byline-container',
                    'ytd-video-owner-renderer .yt-core-attributed-string',
                    '.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row:first-child .yt-content-metadata-view-model__metadata-text',
                    '.YtmBadgeAndBylineRendererItemByline .yt-core-attributed-string',
                    '.YtmCompactMediaItemByline .yt-core-attributed-string',
                    '.YtmCompactMediaItemByline'
                ];
                for (const selector of selectors) {
                    const text = videoCard.querySelector(selector)?.textContent?.trim();
                    if (text) return text;
                }
            } catch (e) {
            }
            return '';
        })();
        const parsedBylineHint = parseCollaboratorNames(bylineHintText || '');
        const hasStrongBylineCollabHint = Boolean(
            parsedBylineHint.hasHiddenCollaborators ||
            (
                parsedBylineHint.names.length >= 2 &&
                (
                    /[,،，﹐､]/.test(bylineHintText || '') ||
                    /\band\s+\d+\s+more\b/i.test(bylineHintText || '') ||
                    /\band\s+more\b/i.test(bylineHintText || '')
                )
            )
        );
        const hasCollabDomSignal = (() => {
            try {
                if (!videoCard) return false;
                if (videoCard.querySelector('yt-avatar-stack-view-model, #attributed-channel-name')) return true;
                const rowText = (videoCard.querySelector('.yt-lockup-metadata-view-model__metadata .yt-content-metadata-view-model__metadata-row')?.textContent || '').toLowerCase();
                return /\d+\s+more/.test(rowText) || /\s(and|&)\s/.test(rowText) || hasStrongBylineCollabHint;
            } catch (e) {
                return hasStrongBylineCollabHint;
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
        } else if (hasStrongBylineCollabHint && parsedBylineHint.names.length > 0) {
            const provisionalNames = parsedBylineHint.names.slice(0, 6);
            if (parsedBylineHint.hasHiddenCollaborators && parsedBylineHint.hiddenCount > 0) {
                const maxItems = Math.min(6, provisionalNames.length + parsedBylineHint.hiddenCount);
                for (let i = provisionalNames.length; i < maxItems; i++) {
                    provisionalNames.push(`Collaborator ${i + 1}`);
                }
            }
            const provisionalCollaborators = provisionalNames.map((name, index) => ({
                name,
                id: index === 0 ? (initialChannelInfo.id || '') : '',
                handle: index === 0 ? (initialChannelInfo.handle || '') : '',
                customUrl: index === 0 ? (initialChannelInfo.customUrl || '') : ''
            }));
            const expectedFromHint = parsedBylineHint.names.length + (parsedBylineHint.hasHiddenCollaborators ? (parsedBylineHint.hiddenCount || 0) : 0);
            initialChannelInfo = {
                ...initialChannelInfo,
                ...(provisionalCollaborators[0] || {}),
                isCollaboration: true,
                allCollaborators: provisionalCollaborators,
                needsEnrichment: true,
                expectedCollaboratorCount: Math.max(
                    parseInt(videoCard?.getAttribute?.('data-filtertube-expected-collaborators') || '0', 10) || 0,
                    expectedFromHint,
                    provisionalCollaborators.length
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
            const mergedResolvedFirst = mergeCollaboratorLists(sanitizedResolved, sanitizedCard);
            const mergedCardFirst = mergeCollaboratorLists(sanitizedCard, sanitizedResolved);
            const candidates = [sanitizedResolved, sanitizedCard, mergedResolvedFirst, mergedCardFirst];
            sanitizedCollaborators = candidates.reduce((best, candidate) => {
                if (!Array.isArray(candidate) || candidate.length === 0) return best;
                if (!Array.isArray(best) || best.length === 0) return candidate;
                if (candidate.length > best.length) return candidate;
                if (candidate.length < best.length) return best;
                return getCollaboratorListQuality(candidate) > getCollaboratorListQuality(best)
                    ? candidate
                    : best;
            }, []);
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

        // For cards that need enrichment, resolve identity without causing noisy network fetches.
        // For shorts / video cards, fetch channel info from main-world ytInitialData
        if (initialChannelInfo.needsFetch && initialChannelInfo.videoId && initialChannelInfo.fetchStrategy !== 'playlist') {
            // During menu hover/open we must avoid network fetches (these can trigger
            // google.com/sorry throttling). Prefer main-world ytInitialData only.
            const fetchStrategy = initialChannelInfo.fetchStrategy || 'mainworld';

            if (fetchStrategy === 'mainworld') {
                console.log('FilterTube: Background fetch - main-world channel info for:', initialChannelInfo.videoId);
                const fetchedInfo = await searchYtInitialDataForVideoChannel(initialChannelInfo.videoId, {
                    expectedHandle: initialChannelInfo.expectedHandle || null,
                    expectedName: initialChannelInfo.expectedChannelName || null,
                    channelId: initialChannelInfo.id || null
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
                        const safeFetchedName = sanitizeChannelNameForCard(finalChannelInfo?.name || '', videoCard);
                        if (safeFetchedName) {
                            finalChannelInfo.name = safeFetchedName;
                        } else if (finalChannelInfo?.name) {
                            delete finalChannelInfo.name;
                        }
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
                if (/^uc[a-z0-9_-]{6,}$/i.test(trimmed)) return true;
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
                        expectedName: enrichedInfo.expectedChannelName || null,
                        channelId: enrichedInfo.id || null
                    });
                    if (ytInfo) {
                        enrichedInfo = {
                            ...enrichedInfo,
                            ...ytInfo,
                            videoId: enrichedInfo.videoId
                        };
                        const safeEnrichedName = sanitizeChannelNameForCard(enrichedInfo?.name || '', videoCard);
                        if (safeEnrichedName) {
                            enrichedInfo.name = safeEnrichedName;
                        } else if (enrichedInfo?.name) {
                            delete enrichedInfo.name;
                        }
                    }
                } catch (e) {
                }
            }

            let stillNeedsNameEnrichment = !enrichedInfo?.name || isHandleLike(enrichedInfo.name) || isProbablyNotChannelName(enrichedInfo.name);

            // JSON-first fallback: if videoId is missing but we still have a UC ID, ask main-world
            // snapshots by channelId before any background network fetch.
            const ucIdForMainWorldLookup = (typeof enrichedInfo?.id === 'string' && /^UC[\w-]{22}$/i.test(enrichedInfo.id.trim()))
                ? enrichedInfo.id.trim()
                : '';
            if (stillNeedsNameEnrichment && !enrichedInfo?.videoId && ucIdForMainWorldLookup) {
                try {
                    const byChannelId = await searchYtInitialDataForVideoChannel('', {
                        expectedHandle: enrichedInfo.expectedHandle || enrichedInfo.handle || null,
                        expectedName: enrichedInfo.expectedChannelName || enrichedInfo.name || null,
                        channelId: ucIdForMainWorldLookup,
                        allowNameMismatch: true
                    });
                    if (byChannelId) {
                        enrichedInfo = {
                            ...enrichedInfo,
                            ...byChannelId
                        };
                        const safeByIdName = sanitizeChannelNameForCard(enrichedInfo?.name || '', videoCard);
                        if (safeByIdName) {
                            enrichedInfo.name = safeByIdName;
                        } else if (enrichedInfo?.name) {
                            delete enrichedInfo.name;
                        }
                    }
                } catch (e) {
                }
                stillNeedsNameEnrichment = !enrichedInfo?.name || isHandleLike(enrichedInfo.name) || isProbablyNotChannelName(enrichedInfo.name);
            }

            const lookupForNetwork = enrichedInfo?.id || enrichedInfo?.handle || lookup || null;
            if (stillNeedsNameEnrichment && lookupForNetwork && !enrichedInfo?.videoId) {
                try {
                    const details = await browserAPI_BRIDGE.runtime.sendMessage({
                        action: 'fetchChannelDetails',
                        channelIdOrHandle: lookupForNetwork
                    });
                    if (details && details.success) {
                        enrichedInfo = { ...enrichedInfo, ...details };
                    }
                } catch (e) {
                }
            }

            if (!enrichedInfo || pendingDropdownFetches.get(dropdown)?.cancelled) return;
            updateInjectedMenuChannelName(dropdown, enrichedInfo, { videoId: videoId || enrichedInfo?.videoId });

            try {
                if (videoCard && enrichedInfo) {
                    const safeName = sanitizeChannelNameForCard(
                        (typeof enrichedInfo.name === 'string' ? enrichedInfo.name.trim() : ''),
                        videoCard
                    );
                    if (safeName && !isHandleLike(safeName) && !isProbablyNotChannelName(safeName)) {
                        if (!videoCard.getAttribute('data-filtertube-channel-name')) {
                            videoCard.setAttribute('data-filtertube-channel-name', safeName);
                        }
                    }
                    const safeId = typeof enrichedInfo.id === 'string' ? enrichedInfo.id.trim() : '';
                    if (!videoCard.getAttribute('data-filtertube-channel-id')) {
                        setValidatedChannelId(videoCard, safeId);
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
    const menuCopy = getAdaptiveMenuCopy();

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
                        ${menuCopy.filterAllToggle}
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
    const menuList = resolveMenuInsertionTarget(menuContainer) ||
        (menuContainer.matches?.('bottom-sheet-container, ytm-bottom-sheet-renderer') ? menuContainer.querySelector('bottom-sheet-layout') : menuContainer);
    if (!menuList) return null;
    const isMobileMenu = isMobileMenuContainer(menuList, menuContainer);
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
    const menuCopy = getAdaptiveMenuCopy();

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
                ${menuCopy.filterAllToggle}
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
    const filterKeywords = effectiveSettings?.filterKeywords || [];
    const channelMap = effectiveSettings?.channelMap || {};

    // Fail-open safety: if there are no active channel/keyword rules, nothing should remain hidden.
    // This protects against SPA node recycling leaving behind `data-filtertube-hidden` without
    // a corresponding active filter (e.g., phantom Shakira hides on fresh sessions).
    if ((Array.isArray(filterChannels) ? filterChannels.length : 0) === 0
        && (Array.isArray(filterKeywords) ? filterKeywords.length : 0) === 0
    ) {
        try {
            document.querySelectorAll('[data-filtertube-hidden="true"]').forEach((el) => {
                try {
                    clearBlockedElementAttributes(el);
                    toggleVisibility(el, false, '', true);
                } catch (e) {
                }
            });
        } catch (e) {
        }
    }

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
        const currentStamped = {
            id: element.getAttribute('data-filtertube-channel-id') || '',
            handle: element.getAttribute('data-filtertube-channel-handle') || '',
            name: element.getAttribute('data-filtertube-channel-name') || ''
        };
        const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
        const blockedId = normalize(meta.id);
        const blockedHandle = normalize(meta.handle);
        const stampedId = normalize(currentStamped.id);
        const stampedHandle = normalize(currentStamped.handle);
        const hasStampedIdentity = Boolean(stampedId || stampedHandle);
        const hasBlockedIdentity = Boolean(blockedId || blockedHandle);
        const idMismatch = blockedId && stampedId && blockedId !== stampedId;
        const handleMismatch = blockedHandle && stampedHandle && blockedHandle !== stampedHandle;
        const staleBlockedIdentity = hasStampedIdentity && hasBlockedIdentity && (idMismatch || handleMismatch);

        // YTM aggressively recycles DOM nodes. If blocked metadata belongs to a previous channel
        // but the card is now stamped with a different identity, clear stale blocked state first.
        if (staleBlockedIdentity) {
            if (filterChannels.length > 0 && isStillBlocked(currentStamped)) {
                markElementAsBlocked(element, currentStamped, 'confirmed');
                if (isCommentContextTag(tag)) {
                    toggleVisibility(element, true, `Blocked comment author: ${currentStamped.handle || currentStamped.id}`);
                } else {
                    toggleVisibility(element, true, `Blocked channel: ${currentStamped.handle || currentStamped.id}`);
                }
            } else {
                clearBlockedElementAttributes(element);
                toggleVisibility(element, false, '', true);
            }
            return;
        }

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
            videoTitleHint: '',
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
        try {
            const hints = collectCardTitleHints(videoCard);
            if (Array.isArray(hints) && hints.length > 0) {
                snapshot.videoTitleHint = String(hints[0] || '').trim().toLowerCase();
            }
        } catch (e) {
        }
        if (!snapshot.videoTitleHint && typeof channelInfo?.videoTitleHint === 'string') {
            snapshot.videoTitleHint = channelInfo.videoTitleHint.trim().toLowerCase();
        }
        if (!snapshot.videoId && snapshot.cardVideoId) snapshot.videoId = snapshot.cardVideoId;
        return snapshot;
    })();
    if (clickSnapshot.videoTitleHint) {
        channelInfo = { ...(channelInfo || {}), videoTitleHint: clickSnapshot.videoTitleHint };
    }

    const clickedCollabKey = (menuItem.getAttribute('data-collab-key') || '').trim().toLowerCase();
    const isSingleCollaboratorSelection = Boolean(
        clickedCollabKey &&
        menuItem.getAttribute('data-is-block-all') !== 'true'
    );
    const normalizeIdentityName = (value) => {
        if (!value || typeof value !== 'string') return '';
        return value.trim().toLowerCase();
    };
    const clickedIdentityLock = {
        id: (typeof channelInfo?.id === 'string' ? channelInfo.id.trim() : ''),
        handle: normalizeHandleValue(channelInfo?.handle || channelInfo?.canonicalHandle || channelInfo?.handleDisplay || '') || '',
        customUrl: (typeof channelInfo?.customUrl === 'string' ? channelInfo.customUrl.trim().toLowerCase() : ''),
        name: normalizeIdentityName(channelInfo?.name || channelInfo?.expectedChannelName || '')
    };
    const candidateMatchesClickedIdentity = (candidate) => {
        if (!isSingleCollaboratorSelection) return true;
        if (!candidate || typeof candidate !== 'object') return false;

        const candidateKey = (getCollaboratorKey(candidate) || '').trim().toLowerCase();
        if (clickedCollabKey && candidateKey && clickedCollabKey === candidateKey) return true;

        const candidateId = (typeof candidate.id === 'string' ? candidate.id.trim() : '');
        const candidateHandle = normalizeHandleValue(candidate.handle || candidate.canonicalHandle || candidate.handleDisplay || '') || '';
        const candidateCustomUrl = (typeof candidate.customUrl === 'string' ? candidate.customUrl.trim().toLowerCase() : '');
        const candidateName = normalizeIdentityName(candidate.name || candidate.expectedChannelName || '');

        if (clickedIdentityLock.id && candidateId && clickedIdentityLock.id === candidateId) return true;
        if (clickedIdentityLock.handle && candidateHandle && clickedIdentityLock.handle === candidateHandle) return true;
        if (clickedIdentityLock.customUrl && candidateCustomUrl && clickedIdentityLock.customUrl === candidateCustomUrl) return true;
        if (clickedIdentityLock.name && candidateName && clickedIdentityLock.name === candidateName) return true;

        const clickedHasStrongIdentity = Boolean(
            clickedIdentityLock.id ||
            clickedIdentityLock.handle ||
            clickedIdentityLock.customUrl
        );
        // When the clicked row had no strong identity, allow enrichment candidates.
        return !clickedHasStrongIdentity;
    };

    // Playlist cards on YTM often have creator name immediately but identifiers only in page/header JSON.
    // Stamp playlist context early so block flow resolves creator via fetchPlaylistCreator instead of
    // falling through to generic channel-page fetches.
    try {
        if (!isCommentContextBlock) {
            const playlistIdHint =
                (typeof channelInfo?.playlistId === 'string' ? channelInfo.playlistId.trim() : '') ||
                extractPlaylistIdFromElement(videoCard) ||
                extractPlaylistIdFromElement(menuItem?.closest?.('ytm-compact-playlist-renderer, ytm-rich-item-renderer, yt-lockup-view-model') || null);
            if (playlistIdHint) {
                channelInfo = {
                    ...(channelInfo || {}),
                    playlistId: playlistIdHint,
                    fetchStrategy: 'playlist',
                    source: channelInfo?.source || 'ytm_playlist_card',
                    expectedChannelName: channelInfo?.expectedChannelName || channelInfo?.name || ''
                };
                if (!channelInfo.id && !channelInfo.customUrl) {
                    channelInfo.videoId = '';
                }
            }
        }
    } catch (e) {
    }

    try {
        const isPlaylistCreatorFlow = Boolean(channelInfo?.fetchStrategy === 'playlist' || channelInfo?.source === 'ytm_playlist_card' || channelInfo?.playlistId);
        if (!isPlaylistCreatorFlow && !isCommentContextBlock && clickSnapshot?.videoId && clickSnapshot.videoId !== (channelInfo?.videoId || '')) {
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

    // Playlist cards: resolve playlist creator BEFORE persisting blocks.
    try {
        const needsPlaylistResolve = !isCommentContextBlock
            && channelInfo
            && (
                channelInfo.fetchStrategy === 'playlist'
                || channelInfo.source === 'ytm_playlist_card'
                || (typeof channelInfo.playlistId === 'string' && channelInfo.playlistId.trim())
            )
            && typeof channelInfo.playlistId === 'string'
            && channelInfo.playlistId.trim()
            && !channelInfo.id
            && !channelInfo.customUrl;

        if (needsPlaylistResolve) {
            const details = await browserAPI_BRIDGE.runtime.sendMessage({
                action: 'fetchPlaylistCreator',
                playlistId: channelInfo.playlistId.trim(),
                expectedName: channelInfo.expectedChannelName || channelInfo.name || ''
            });
            if (details && details.success) {
                channelInfo = { ...(channelInfo || {}), ...details };
            }
        }
    } catch (e) {
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

    // Keep the existing menu label; no synthetic spinner text to avoid
    // stale UX on SPA surfaces when details resolve after the click.
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
            if (/^uc[a-z0-9_-]{6,}$/i.test(trimmed)) return true;
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
            const lookupExpectedName = sanitizeChannelNameForCard(
                channelInfo?.expectedChannelName || channelInfo?.name || '',
                videoCard
            );
            const ytInfo = await searchYtInitialDataForVideoChannel(channelInfo.videoId, {
                expectedHandle: requestedHandle || channelInfo.expectedHandle || null,
                expectedName: lookupExpectedName || null,
                channelId: channelInfo.id || null
            });
            if (ytInfo) {
                if (candidateMatchesClickedIdentity(ytInfo)) {
                    channelInfo = { ...channelInfo, ...ytInfo, videoId: channelInfo.videoId };
                    if (channelInfo?.handle) {
                        applyHandleMetadata(channelInfo, channelInfo.handle, { force: true });
                        requestedHandle = normalizeHandleValue(channelInfo.handle) || requestedHandle;
                        if (!requestedHandleForNetwork) {
                            requestedHandleForNetwork = extractRawHandle(channelInfo.handle) || '';
                        }
                    }
                } else {
                    console.warn('FilterTube: Ignoring mismatched structured lookup for clicked collaborator', {
                        clickedCollabKey,
                        candidate: ytInfo
                    });
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
                    const identifier = collaborator.id || collaborator.handle || collaborator.customUrl || collaborator.name;
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
                    const collaboratorMetadata = buildChannelMetadataPayload({
                        ...collaborator,
                        videoId: collaborator.videoId || channelInfo.videoId || '',
                        videoTitleHint: clickSnapshot.videoTitleHint || channelInfo.videoTitleHint || '',
                        source: collaborator.source || channelInfo.source || 'collab_block_all'
                    });
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
                let input = collaborator.id || collaborator.handle || collaborator.customUrl;

                if (input) {
                    const otherChannels = channelInfo.allCollaborators
                        .filter((_, idx) => idx !== i)
                        .map(c => c.handle || c.id || c.customUrl || c.name);
                    const collaboratorFilterAll = resolveFilterAllPreference(collaborator);

                    console.log(`FilterTube: Blocking collaborator ${i + 1}/${collaboratorCount}: ${input}`, 'filterAll:', collaboratorFilterAll);
                    const collaboratorMetadata = buildChannelMetadataPayload({
                        ...collaborator,
                        videoId: collaborator.videoId || channelInfo.videoId || '',
                        videoTitleHint: clickSnapshot.videoTitleHint || channelInfo.videoTitleHint || '',
                        source: collaborator.source || channelInfo.source || 'collab_block_all'
                    });
                    const result = await addChannelDirectly(input, collaboratorFilterAll, otherChannels, groupId, collaboratorMetadata);
                    if (result.success) {
                        successCount++;
                        console.log(`FilterTube: Successfully blocked ${input}`);
                    } else {
                        console.error(`FilterTube: Failed to block ${input}:`, result.error);
                    }
                } else {
                    console.warn('FilterTube: Skipping collaborator without resolvable identifier', collaborator);
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
                    if (/^uc[a-z0-9_-]{6,}$/i.test(trimmed)) return true;
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
                    const safeFetchedName = sanitizeChannelNameForCard(fetchedChannelInfo.name, videoCard);
                    if (safeFetchedName) {
                        channelInfo.name = safeFetchedName;
                    }
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
            const skipNetwork = (() => {
                try {
                    return String(location?.hostname || '').toLowerCase().startsWith('m.youtube.');
                } catch (e) {
                    return false;
                }
            })();
            const cacheResolvedId = await fetchIdForHandle(requestedHandle, { skipNetwork });
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
        const safeExpectedName = sanitizeChannelNameForCard(channelInfo?.expectedChannelName || '', videoCard);
        const safeCurrentName = sanitizeChannelNameForCard(channelInfo?.name || '', videoCard);
        if (safeCurrentName) {
            channelInfo.name = safeCurrentName;
        } else if (safeExpectedName) {
            channelInfo.name = safeExpectedName;
        }
        if (safeExpectedName) {
            channelInfo.expectedChannelName = safeExpectedName;
        }
        const expectedName = safeExpectedName || safeCurrentName || null;

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

        // Ensure we carry a videoId whenever available on watch surfaces.
        // This enables background watch-identity enrichment for UC-only blocks.
        const isPlaylistCreatorFlow = Boolean(
            channelInfo?.fetchStrategy === 'playlist' ||
            channelInfo?.source === 'ytm_playlist_card' ||
            channelInfo?.playlistId
        );
        if (!isPlaylistCreatorFlow && !channelInfo.videoId) {
            try {
                const currentV = new URLSearchParams(location.search || '').get('v') || '';
                if (/^[a-zA-Z0-9_-]{11}$/.test(currentV)) {
                    channelInfo.videoId = currentV;
                }
            } catch (e) {
            }
            if (!channelInfo.videoId) {
                try {
                    const path = String(location?.pathname || '');
                    const shortsMatch = path.match(/\/shorts\/([a-zA-Z0-9_-]{11})(?:[/?#]|$)/i);
                    const watchPathMatch = path.match(/\/watch\/([a-zA-Z0-9_-]{11})(?:[/?#]|$)/i);
                    const recovered = (shortsMatch && shortsMatch[1])
                        ? shortsMatch[1]
                        : ((watchPathMatch && watchPathMatch[1]) ? watchPathMatch[1] : '');
                    if (recovered) {
                        channelInfo.videoId = recovered;
                    }
                } catch (e) {
                }
            }
        }

        // Pre-persist identity hydration:
        // If we already have UC ID but no alternate identity, resolve from main-world by videoId first.
        // This avoids storing fresh entries as "UC -> Not fetched".
        if (
            !isCommentContextBlock &&
            channelInfo?.videoId &&
            channelInfo?.id &&
            String(channelInfo.id).trim().startsWith('UC') &&
            !normalizeHandleValue(channelInfo.handle || '') &&
            !String(channelInfo.customUrl || '').trim()
        ) {
            try {
                const ytInfo = await searchYtInitialDataForVideoChannel(channelInfo.videoId, {
                    expectedHandle: requestedHandle || channelInfo.expectedHandle || '',
                    expectedName: sanitizeChannelNameForCard(
                        channelInfo.expectedChannelName || channelInfo.name || '',
                        videoCard
                    ) || '',
                    channelId: channelInfo.id || null,
                    // This call is only trying to fill alternate IDs (handle/customUrl) for a UC-known entry.
                    // Do not hard-reject on name mismatch; instead, require that the UC id stays consistent.
                    allowNameMismatch: true
                });
                const knownId = typeof channelInfo?.id === 'string' ? channelInfo.id.trim() : '';
                const foundId = typeof ytInfo?.id === 'string' ? ytInfo.id.trim() : '';
                const idConsistent = !knownId || !foundId || knownId === foundId;
                if (ytInfo && idConsistent && candidateMatchesClickedIdentity(ytInfo)) {
                    const hydratedHandle = normalizeHandleValue(ytInfo.handle || '');
                    if (hydratedHandle) {
                        channelInfo.handle = hydratedHandle;
                        applyHandleMetadata(channelInfo, hydratedHandle, { force: true });
                    }
                    if (!channelInfo.customUrl && ytInfo.customUrl) {
                        channelInfo.customUrl = ytInfo.customUrl;
                    }
                    if ((!channelInfo.name || isProbablyNotChannelName(channelInfo.name)) && ytInfo.name) {
                        const safeYtName = sanitizeChannelNameForCard(ytInfo.name, videoCard);
                        if (safeYtName) {
                            channelInfo.name = safeYtName;
                        }
                    }
                }
            } catch (e) {
            }
        }

        let input = channelInfo.id || channelInfo.customUrl || requestedHandleForNetwork || channelInfo.handle;
        const playlistIdFromDomHint = !channelInfo?.playlistId
            ? extractPlaylistIdFromElement(videoCard)
            : '';
        if (!channelInfo?.playlistId && playlistIdFromDomHint) {
            channelInfo.playlistId = playlistIdFromDomHint;
        }
        const isPlaylistOwnerFlow = Boolean(
            channelInfo?.fetchStrategy === 'playlist' ||
            channelInfo?.source === 'ytm_playlist_card' ||
            channelInfo?.playlistId ||
            playlistIdFromDomHint
        );
        const isMobileYtmHost = (() => {
            try {
                const host = String(location?.hostname || '').toLowerCase();
                return host.startsWith('m.youtube.') || host.startsWith('music.youtube.');
            } catch (e) {
                return false;
            }
        })();

        // YTM-first policy: when we do not have a stable channel identifier yet,
        // prefer watch-based identity flow over handle-page fetches.
        if (
            isMobileYtmHost &&
            !isPlaylistOwnerFlow &&
            !channelInfo.id &&
            !channelInfo.customUrl &&
            channelInfo.videoId
        ) {
            input = `watch:${channelInfo.videoId}`;
        }

        // Identity lock for single-collaborator row: never drop the clicked row's own identifier.
        if (!input && isSingleCollaboratorSelection) {
            input = clickedIdentityLock.id || clickedIdentityLock.customUrl || clickedIdentityLock.handle || '';
            if (!channelInfo.id && clickedIdentityLock.id) channelInfo.id = clickedIdentityLock.id;
            if (!channelInfo.customUrl && clickedIdentityLock.customUrl) channelInfo.customUrl = clickedIdentityLock.customUrl;
            if (!channelInfo.handle && clickedIdentityLock.handle) {
                channelInfo.handle = clickedIdentityLock.handle;
                applyHandleMetadata(channelInfo, clickedIdentityLock.handle, { force: true });
            }
        }

        // Playlist hardening: some YTM cards arrive with only name/logo and no identifiers.
        // Recover playlistId from DOM and resolve creator identity before persisting.
        if (
            !isCommentContextBlock &&
            !input &&
            channelInfo &&
            !channelInfo.id &&
            !channelInfo.customUrl
        ) {
            try {
                if (!channelInfo.playlistId) {
                    const playlistHref = videoCard?.querySelector?.('a[href^="/playlist?list="], a[href*="/playlist?list="]')?.getAttribute?.('href') || '';
                    if (playlistHref) {
                        const qs = playlistHref.split('?')[1] || '';
                        const params = new URLSearchParams(qs);
                        const pid = params.get('list') || '';
                        if (pid) channelInfo.playlistId = pid;
                    }
                }
                if (channelInfo.playlistId) {
                    channelInfo.fetchStrategy = 'playlist';
                    if (!channelInfo.source) channelInfo.source = 'ytm_playlist_card';
                    const details = await browserAPI_BRIDGE.runtime.sendMessage({
                        action: 'fetchPlaylistCreator',
                        playlistId: channelInfo.playlistId.trim(),
                        expectedName: channelInfo.expectedChannelName || channelInfo.name || ''
                    });
                    if (details?.success) {
                        channelInfo = { ...(channelInfo || {}), ...details };
                        if (channelInfo.handle) applyHandleMetadata(channelInfo, channelInfo.handle, { force: true });
                        input = channelInfo.id || channelInfo.customUrl || requestedHandleForNetwork || channelInfo.handle || '';
                    }
                }
            } catch (e) {
            }
        }

        // YTM playlist/mix cards frequently start with weak DOM identity. Prefer background
        // watch-resolution by videoId over noisy inferred handles/custom strings.
        if (
            !isCommentContextBlock &&
            !channelInfo.id &&
            channelInfo.videoId &&
            (channelInfo.needsFetch || channelInfo.fetchStrategy === 'mainworld') &&
            channelInfo.fetchStrategy !== 'playlist' &&
            channelInfo.source !== 'ytm_playlist_card' &&
            !channelInfo.playlistId
        ) {
            input = `watch:${channelInfo.videoId}`;
        }

        if (
            !input &&
            !isCommentContextBlock &&
            channelInfo?.videoId &&
            channelInfo?.fetchStrategy !== 'playlist' &&
            !channelInfo?.playlistId
        ) {
            input = `watch:${channelInfo.videoId}`;
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
        const playlistIdForFlow = typeof channelInfo?.playlistId === 'string' ? channelInfo.playlistId.trim() : '';
        const isPlaylistCreatorRetryFlow = Boolean(
            !isCommentContextBlock &&
            (
                channelInfo?.fetchStrategy === 'playlist' ||
                channelInfo?.source === 'ytm_playlist_card' ||
                playlistIdForFlow
            )
        );
        const isAlgorithmicPlaylistFlow = Boolean(
            isPlaylistCreatorRetryFlow &&
            (
                /^RD/i.test(playlistIdForFlow) ||
                String(channelInfo?.source || '').toLowerCase().includes('mix') ||
                String(channelInfo?.source || '').toLowerCase().includes('radio') ||
                /(?:^|\b)(?:mix|my mix)\b/i.test(String(channelInfo?.name || channelInfo?.expectedChannelName || ''))
            )
        );

        // Playlist creator fallback: when we only had a weak handle and channel page lookup 404s,
        // retry by resolving owner identity from the playlist page itself.
        if (!result.success && channelInfo?.playlistId && (
            /Failed to fetch channel page: 404/i.test(result.error || '') ||
            /No channel identifier/i.test(result.error || '')
        )) {
            try {
                const details = await browserAPI_BRIDGE.runtime.sendMessage({
                    action: 'fetchPlaylistCreator',
                    playlistId: String(channelInfo.playlistId).trim(),
                    expectedName: channelInfo.expectedChannelName || channelInfo.name || ''
                });
                if (details?.success) {
                    channelInfo = { ...(channelInfo || {}), ...details };
                    if (channelInfo.handle) applyHandleMetadata(channelInfo, channelInfo.handle, { force: true });
                    const retryInput = channelInfo.id || channelInfo.customUrl || channelInfo.handle || '';
                    if (retryInput) {
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
            }

            // Deterministic fallback: re-read owner identity from card renderer data/DOM.
            // Do NOT guess handles from display text for playlist cards.
            if (!result.success) {
                try {
                    const parsedFromCard = videoCard ? extractChannelFromCard(videoCard) : null;
                    if (parsedFromCard && (parsedFromCard.id || parsedFromCard.handle || parsedFromCard.customUrl)) {
                        channelInfo = { ...(channelInfo || {}), ...parsedFromCard };
                        if (channelInfo.handle) applyHandleMetadata(channelInfo, channelInfo.handle, { force: true });
                        const retryInput = channelInfo.id || channelInfo.customUrl || channelInfo.handle || '';
                        if (retryInput) {
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
                }
            }

            // Final playlist fallback: use seed video identity from playlist thumbnail.
            if (!result.success && isAlgorithmicPlaylistFlow) {
                try {
                    const seedVideoId = (() => {
                        const direct = typeof extractVideoIdFromCard === 'function' ? (extractVideoIdFromCard(videoCard) || '') : '';
                        if (/^[a-zA-Z0-9_-]{11}$/.test(direct)) return direct;
                        const img = videoCard?.querySelector?.('img[src*="/vi/"], img[src*="/vi_webp/"]');
                        const src = img?.getAttribute?.('src') || img?.src || '';
                        const m = src.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})(?:[/?]|$)/i);
                        return m?.[1] || '';
                    })();
                    if (seedVideoId) {
                        result = await addChannelDirectly(
                            `watch:${seedVideoId}`,
                            filterAll,
                            collaborationWith,
                            menuItem.getAttribute('data-collaboration-group-id'),
                            buildChannelMetadataPayload({
                                ...channelInfo,
                                videoId: seedVideoId,
                                source: channelInfo?.source || 'playlist_seed_video_fallback'
                            })
                        );
                    }
                } catch (e) {
                }
            }
        }

        // If the background could not fetch the channel page (e.g., /@handle/about returns 404),
        // try to recover using ytInitialData for this video, then fall back to the Shorts URL helper.
        if (!isCommentContextBlock && !result.success && channelInfo.videoId && !isPlaylistCreatorRetryFlow && (
            initialWas404 ||
            /No channel identifier/i.test(result.error || '') ||
            !input
        )) {
            console.warn('FilterTube: Initial block failed. Attempting ytInitialData + shorts fallback for', channelInfo.videoId, 'error:', result.error);

            // 1) Try resolving the channel directly from ytInitialData (search/watch responses)
            try {
                const ytChannel = await searchYtInitialDataForVideoChannel(channelInfo.videoId, {
                    expectedHandle,
                    expectedName,
                    channelId: channelInfo.id || null
                });
                if (ytChannel && (ytChannel.id || ytChannel.handle)) {
                    if (isSingleCollaboratorSelection && !candidateMatchesClickedIdentity(ytChannel)) {
                        console.warn('FilterTube: Skipping mismatched ytInitialData fallback for collaborator row', {
                            clickedCollabKey,
                            candidate: ytChannel
                        });
                    } else {
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
                                setValidatedChannelId(cacheTarget, channelInfo.id);
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
                }
            } catch (e) {
                console.warn('FilterTube: ytInitialData channel lookup failed, continuing to Shorts fallback:', e);
            }

            // 2) Background watch-identity fallback (CORS-safe on m.youtube.com).
            if (!result.success && channelInfo.videoId && !isSingleCollaboratorSelection) {
                console.log('FilterTube: Attempting background watch fallback for video:', channelInfo.videoId);
                try {
                    result = await addChannelDirectly(
                        `watch:${channelInfo.videoId}`,
                        filterAll,
                        collaborationWith,
                        menuItem.getAttribute('data-collaboration-group-id'),
                        buildChannelMetadataPayload({
                            ...channelInfo,
                            source: channelInfo?.source || 'watch_fallback',
                            videoId: channelInfo.videoId
                        })
                    );
                } catch (e) {
                    console.warn('FilterTube: Background watch fallback failed:', e);
                }
            }

            // 2b) Desktop-only direct watch fetch fallback (legacy; skipped on m.youtube.com due CORS).
            if (!result.success && channelInfo.videoId && !isSingleCollaboratorSelection) {
                const isMobileOrigin = (() => {
                    try {
                        return String(location?.hostname || '').toLowerCase().startsWith('m.youtube.');
                    } catch (e) {
                        return false;
                    }
                })();
                if (!isMobileOrigin) {
                    console.log('FilterTube: Attempting direct watch page fallback for video:', channelInfo.videoId);
                    try {
                        const watchInfo = await fetchChannelFromWatchUrl(channelInfo.videoId, expectedHandle);
                        if (watchInfo && (watchInfo.id || watchInfo.handle || watchInfo.customUrl)) {
                            let retryInput = null;

                            if (watchInfo.id && watchInfo.id.startsWith('UC')) {
                                channelInfo.id = watchInfo.id;
                                retryInput = watchInfo.id;
                            }

                            if (!retryInput && watchInfo.customUrl) {
                                channelInfo.customUrl = watchInfo.customUrl;
                                retryInput = watchInfo.customUrl;
                            }

                            if (!retryInput && watchInfo.handle) {
                                const normalizedHandle = normalizeHandleValue(watchInfo.handle);
                                if (normalizedHandle) {
                                    channelInfo.handle = normalizedHandle;
                                    retryInput = normalizedHandle;
                                }
                            }

                            if (watchInfo.name && !channelInfo.name) {
                                const safeWatchName = sanitizeChannelNameForCard(watchInfo.name, videoCard);
                                if (safeWatchName) {
                                    channelInfo.name = safeWatchName;
                                }
                            }

                            if (channelInfo.id && channelInfo.handle) {
                                broadcastChannelMapping(channelInfo.id, channelInfo.handle);
                            }

                            if (retryInput) {
                                console.log('FilterTube: Retrying block with direct watch identifier:', retryInput);
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
                        console.warn('FilterTube: Direct watch page fallback failed:', e);
                    }
                }
            }

            // 3) Final fallback: Shorts-specific helper (only when applicable)
            if (!result.success && channelInfo.needsFetch && channelInfo.fetchStrategy !== 'mainworld' && !isSingleCollaboratorSelection) {
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
                            setValidatedChannelId(cacheTarget, channelInfo.id);
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

        // If we hid the card optimistically before the block completed, upgrade that hidden node
        // with the final resolved identity so the later sync/restore pass cannot "unhide" it due
        // to missing blocked metadata (common on Mix cards where DOM identity is weak at click time).
        if (didOptimisticHide && optimisticHideState.length > 0) {
            try {
                for (const item of optimisticHideState) {
                    const element = item?.element;
                    if (!element) continue;
                    try {
                        markElementAsBlocked(element, channelInfo, 'confirmed');
                        element.style.display = 'none';
                        element.classList.add('filtertube-hidden');
                        element.setAttribute('data-filtertube-hidden', 'true');
                    } catch (e) {
                    }
                }
            } catch (e) {
            } finally {
                optimisticHideState.length = 0;
            }
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

        // Store videoId → channelId mapping for Shorts persistence after refresh.
        // Never persist a watch video mapping when blocking a playlist creator; that would poison
        // the map (current watch video → playlist owner) and cause wrong future resolutions.
        const isPlaylistCreatorBlock = Boolean(
            channelInfo?.fetchStrategy === 'playlist' ||
            channelInfo?.source === 'ytm_playlist_card' ||
            channelInfo?.playlistId
        );
        if (!isPlaylistCreatorBlock && channelInfo.videoId && channelInfo.id) {
            persistVideoChannelMapping(channelInfo.videoId, channelInfo.id);
            try {
                const cards = document.querySelectorAll(`[data-filtertube-video-id="${channelInfo.videoId}"]`);
                for (const card of cards) {
                    if (!shouldStampCardForVideoId(card, channelInfo.videoId)) continue;
                    stampChannelIdentity(card, {
                        id: channelInfo.id,
                        handle: channelInfo.handle || '',
                        customUrl: channelInfo.customUrl || '',
                        name: channelInfo.name || '',
                        logo: channelInfo.logo || '',
                        source: channelInfo.source || '',
                        fetchStrategy: channelInfo.fetchStrategy || '',
                        expectedChannelName: channelInfo.expectedChannelName || channelInfo.name || ''
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
                expectedChannelName: metadata.expectedChannelName || null,
                channelLogo: metadata.channelLogo || null,
                videoId: metadata.videoId || null,
                videoTitleHint: metadata.videoTitleHint || null,
                profile,
                customUrl: metadata.customUrl || null,  // c/Name or user/Name for legacy channels
                source: metadata.source || null,
                pageHost: (typeof location !== 'undefined' ? String(location.hostname || '') : '')
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
