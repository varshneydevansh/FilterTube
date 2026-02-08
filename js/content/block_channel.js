/**
 * Track the last clicked 3-dot button to find associated video card
 */
let lastClickedMenuButton = null;
const isKidsSite = typeof location !== 'undefined' && location.hostname.includes('youtubekids.com');

const blockChannelDebugLog = (...args) => {
    try {
        if (window.__filtertubeDebug) {
            console.log(...args);
        }
    } catch (e) {
    }
};

let lastKidsMenuContext = null;
const KIDS_MENU_CONTEXT_TTL_MS = 15000;
let lastKidsBlockActionTs = 0;
let lastKidsBlockClickTs = 0; // Track when user clicked block to suppress toast double-fire
const handledKidsBlockActions = new Set(); // Set of "videoId" or "channelId" recently handled

/**
 * Track which dropdowns we've already injected into (prevent flashing)
 * Map: dropdown -> {videoCardId, isProcessing}
 */
const injectedDropdowns = new WeakMap();

const isWhitelistModeActive = () => {
    try {
        return !!currentSettings && typeof currentSettings === 'object' && currentSettings.listMode === 'whitelist';
    } catch (e) {
        return false;
    }
};

const cleanupInjectedMenuItems = (dropdown) => {
    try {
        if (!dropdown || typeof dropdown.querySelectorAll !== 'function') return;
        dropdown.querySelectorAll('.filtertube-block-channel-item').forEach(item => {
            try {
                item.remove();
            } catch (e) {
            }
        });
        if (injectedDropdowns.has(dropdown)) {
            injectedDropdowns.delete(dropdown);
        }
    } catch (e) {
    }
};

// Menu helpers (`escapeHtml`, `ensureFilterTubeMenuStyles`) are defined in
// `js/content/menu.js` (loaded before this file via manifest ordering).

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
 * Track pending async channel fetches from /watch?v=ID pages (prevents duplicates)
 * Map: videoId -> Promise
 */
const pendingWatchFetches = new Map();

/**
 * Track pending channel info fetches per dropdown (for instant UI + background fetch)
 * WeakMap: dropdown -> {channelInfoPromise, cancelled, initialChannelInfo}
 */
const pendingDropdownFetches = new WeakMap();

const dropdownVisibilityObservers = new WeakMap();
let quickBlockStylesInjected = false;
let quickBlockObserverStarted = false;
let quickBlockSweepTimer = 0;
let quickBlockPeriodicTimer = 0;
const FT_DROPDOWN_SELECTORS = 'tp-yt-iron-dropdown, ytm-menu-popup-renderer, bottom-sheet-container, div.menu-content[role="dialog"]';
const isMobileYouTubeSurface = () => {
    try {
        const host = String(location?.hostname || '').toLowerCase();
        if (host.includes('m.youtube.com')) return true;

        // Prefer capability detection over DOM tag heuristics. Some desktop surfaces render `ytm-*`
        // components even on youtube.com, but we still want hover-only behavior when a fine pointer
        // exists.
        try {
            if (typeof window.matchMedia === 'function') {
                const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
                if (coarse) return true;
            }
        } catch (e) {
        }

        return false;
    } catch (e) {
        return false;
    }
};

const isHoverCapableDesktopSurface = () => {
    try {
        if (typeof window.matchMedia !== 'function') return true;
        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (e) {
        return true;
    }
};

function isPostLikeQuickBlockCard(card) {
    if (!card || !(card instanceof Element)) return false;
    try {
        const tag = String(card.tagName || '').toLowerCase();
        if (tag.includes('post')) return true;
        if (card.getAttribute?.('is-post') === '' || card.getAttribute?.('is-post') === 'true') return true;
        if (card.querySelector?.('ytd-post-renderer, ytm-post-renderer, ytm-backstage-post-renderer, ytm-backstage-post-thread-renderer')) return true;
    } catch (e) {
    }
    return false;
}

function resolveQuickBlockHost(node) {
    if (!node || !(node instanceof Element)) return null;
    const tag = String(node.tagName || '').toLowerCase();
    if (
        tag === 'yt-lockup-view-model' ||
        tag === 'yt-lockup-metadata-view-model' ||
        tag.startsWith('ytm-shorts-lockup-view-model')
    ) {
        return node.closest(
            'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-playlist-panel-video-renderer, ytd-playlist-panel-video-wrapper-renderer, ytm-rich-item-renderer, ytm-video-with-context-renderer, .ytGridShelfViewModelGridShelfItem'
        ) || node;
    }
    if (tag === 'ytd-rich-grid-media') {
        return node.closest('ytd-rich-item-renderer') || node;
    }
    return node;
}

function isRenderableQuickBlockAnchor(node) {
    if (!node || !(node instanceof Element)) return false;
    try {
        const style = window.getComputedStyle(node);
        if (!style) return true;
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (style.display === 'contents') return false;
    } catch (e) {
    }
    try {
        const rect = node.getBoundingClientRect();
        if (rect && (rect.width < 12 || rect.height < 12)) return false;
    } catch (e) {
    }
    return true;
}

function resolveQuickBlockAnchor(hostCard) {
    if (!hostCard || !(hostCard instanceof Element)) return hostCard;

    const candidates = [hostCard];
    const preferred = [
        '#dismissible',
        'ytd-rich-grid-media',
        'yt-lockup-view-model',
        'yt-lockup-metadata-view-model',
        'ytd-playlist-panel-video-wrapper-renderer',
        'ytd-playlist-panel-video-renderer',
        'ytd-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-compact-video-renderer',
        'ytm-video-with-context-renderer',
        'ytm-compact-video-renderer',
        'ytd-thumbnail'
    ];

    preferred.forEach((selector) => {
        try {
            const hit = hostCard.querySelector(selector);
            if (hit && !candidates.includes(hit)) {
                candidates.push(hit);
            }
        } catch (e) {
        }
    });

    const firstChild = hostCard.firstElementChild;
    if (firstChild && !candidates.includes(firstChild)) {
        candidates.push(firstChild);
    }

    for (const candidate of candidates) {
        if (isRenderableQuickBlockAnchor(candidate)) {
            return candidate;
        }
    }

    return hostCard;
}

function setQuickBlockHoverStateForHost(hostCard, active, stickyMs = 0) {
    if (!hostCard || !(hostCard instanceof Element)) return;

    try {
        if (hostCard.__filtertubeQuickHoverTimer) {
            clearTimeout(hostCard.__filtertubeQuickHoverTimer);
            hostCard.__filtertubeQuickHoverTimer = 0;
        }
    } catch (e) {
    }

    if (active) {
        try {
            hostCard.setAttribute('data-filtertube-quick-hover', 'true');
            hostCard.setAttribute('data-filtertube-quick-sticky', 'true');
        } catch (e) {
        }
        if (stickyMs > 0) {
            hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {
                try {
                    hostCard.removeAttribute('data-filtertube-quick-sticky');
                    hostCard.__filtertubeQuickHoverTimer = 0;
                } catch (e) {
                }
            }, stickyMs);
        }
        return;
    }

    try {
        hostCard.removeAttribute('data-filtertube-quick-hover');
    } catch (e) {
    }

    if (stickyMs > 0) {
        try {
            hostCard.setAttribute('data-filtertube-quick-sticky', 'true');
        } catch (e) {
        }
        hostCard.__filtertubeQuickHoverTimer = setTimeout(() => {
            try {
                hostCard.removeAttribute('data-filtertube-quick-sticky');
                hostCard.__filtertubeQuickHoverTimer = 0;
            } catch (e) {
            }
        }, stickyMs);
    } else {
        try {
            hostCard.removeAttribute('data-filtertube-quick-sticky');
        } catch (e) {
        }
    }
}

const QUICK_BLOCK_CARD_SELECTORS = [
    'yt-official-card-view-model',
    'ytd-rich-item-renderer',
    'ytd-rich-grid-media',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-watch-card-compact-video-renderer',
    'ytd-watch-card-hero-video-renderer',
    'ytd-watch-card-rhs-panel-video-renderer',
    'ytd-playlist-video-renderer',
    'ytd-playlist-renderer',
    'ytd-grid-playlist-renderer',
    'ytd-compact-playlist-renderer',
    'ytd-playlist-panel-video-renderer',
    'ytd-playlist-panel-video-wrapper-renderer',
    'ytd-radio-renderer',
    'ytd-compact-radio-renderer',
    'ytd-reel-item-renderer',
    'ytd-shorts-lockup-view-model',
    'yt-lockup-view-model',
    'yt-lockup-metadata-view-model',
    'ytm-rich-item-renderer',
    'ytm-compact-video-renderer',
    'ytm-video-with-context-renderer',
    'ytm-compact-playlist-renderer',
    'ytm-playlist-video-renderer',
    'ytm-playlist-panel-video-renderer',
    'ytm-reel-item-renderer',
    'ytm-radio-renderer',
    'ytm-compact-radio-renderer',
    'ytm-lockup-view-model',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
    'ytk-video-renderer',
    'ytk-grid-video-renderer',
    'ytk-compact-video-renderer',
    'ytk-compact-playlist-renderer'
].join(', ');

const isQuickBlockEnabled = () => {
    try {
        return !!currentSettings
            && typeof currentSettings === 'object'
            && currentSettings.showQuickBlockButton === true
            && currentSettings.listMode !== 'whitelist';
    } catch (e) {
        return false;
    }
};

function ensureQuickBlockStyles() {
    if (quickBlockStylesInjected) return;
    const mobileSurface = isMobileYouTubeSurface();
    try {
        document.documentElement.toggleAttribute('data-filtertube-mobile-surface', mobileSurface);
    } catch (e) {
    }
    const style = document.createElement('style');
    style.id = 'filtertube-quick-block-styles';
    style.textContent = `
	    .filtertube-quick-block-host {
	        position: relative !important;
	    }
	    .filtertube-quick-block-anchor {
	        position: relative !important;
	    }
	    .filtertube-quick-block-wrap {
	        position: absolute;
	        top: 8px;
	        left: 8px;
	        z-index: 2147483000;
	        opacity: 0;
	        pointer-events: none;
	        transition: opacity 0.15s ease;
	        will-change: opacity;
	    }
	    .filtertube-quick-block-host:hover .filtertube-quick-block-wrap,
	    .filtertube-quick-block-anchor:hover .filtertube-quick-block-wrap,
	    .filtertube-quick-block-host[data-filtertube-quick-hover="true"] .filtertube-quick-block-wrap,
	    .filtertube-quick-block-host[data-filtertube-quick-sticky="true"] .filtertube-quick-block-wrap,
	    .filtertube-quick-block-host[data-filtertube-quick-force="true"] .filtertube-quick-block-wrap,
	    .filtertube-quick-block-wrap[data-open="true"] {
	        opacity: 1;
	        pointer-events: auto;
	    }
	    .filtertube-quick-block-btn {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: 1px solid rgba(239, 68, 68, 0.65);
        background: rgba(15, 23, 42, 0.88);
        color: #fecaca;
        font-size: 18px;
        line-height: 1;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }
    .filtertube-quick-block-btn:hover {
        background: rgba(127, 29, 29, 0.96);
        color: #ffffff;
    }
    .filtertube-quick-block-btn[data-busy="true"] {
        opacity: 0.55;
        cursor: progress;
    }
    html[data-filtertube-mobile-surface] .filtertube-quick-block-wrap {
        opacity: 1;
        pointer-events: auto;
    }
    @media (hover: none) and (pointer: coarse) {
        .filtertube-quick-block-wrap {
            opacity: 1;
            pointer-events: auto;
        }
    }`;
    (document.head || document.documentElement).appendChild(style);
    quickBlockStylesInjected = true;
}

function removeQuickBlockButtons() {
    document.querySelectorAll('.filtertube-quick-block-wrap').forEach((el) => {
        try {
            el.remove();
        } catch (e) {
        }
    });
}

function createSyntheticQuickBlockMenuItem(label = 'Block') {
    const menuItem = document.createElement('div');
    menuItem.className = 'filtertube-block-channel-item filtertube-quick-block-synthetic';
    const title = document.createElement('span');
    title.className = 'filtertube-menu-title';
    title.textContent = label;
    menuItem.appendChild(title);
    return menuItem;
}

function collectQuickBlockCollaborators(base = {}, videoCard = null) {
    const candidates = [];

    if (Array.isArray(base?.allCollaborators)) {
        candidates.push(...base.allCollaborators.filter(Boolean));
    }

    if (typeof extractCollaboratorMetadataFromElement === 'function' && videoCard) {
        try {
            const fromDom = extractCollaboratorMetadataFromElement(videoCard);
            if (Array.isArray(fromDom) && fromDom.length > 0) {
                candidates.push(...fromDom.filter(Boolean));
            }
        } catch (e) {
        }
    }

    if (candidates.length === 0 && (base.handle || base.id || base.customUrl || base.name || base.needsFetch || base.videoId)) {
        candidates.push({ ...base });
    }

    let normalized = candidates;
    if (typeof sanitizeCollaboratorList === 'function') {
        try {
            normalized = sanitizeCollaboratorList(candidates);
        } catch (e) {
        }
    }

    const seen = new Set();
    const deduped = [];
    normalized.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        const key = [
            (entry.id || '').toLowerCase(),
            (entry.handle || '').toLowerCase(),
            (entry.customUrl || '').toLowerCase(),
            (entry.name || '').toLowerCase()
        ].join('|');
        if (!key.replace(/\|/g, '').trim()) return;
        if (seen.has(key)) return;
        seen.add(key);
        deduped.push(entry);
    });
    return deduped;
}

function buildQuickBlockContext(videoCard) {
    if (!videoCard || typeof extractChannelFromCard !== 'function') return null;
    const base = extractChannelFromCard(videoCard) || {};
    const isPostCard = (() => {
        try {
            if (videoCard.getAttribute?.('is-post') === '' || videoCard.getAttribute?.('is-post') === 'true') return true;
            if (videoCard.querySelector?.('ytd-post-renderer')) return true;
        } catch (e) {
        }
        return false;
    })();
    const videoId = isPostCard ? '' : (base.videoId || ensureVideoIdForCard(videoCard) || extractVideoIdFromCard(videoCard) || '');
    const collaborators = collectQuickBlockCollaborators({ ...base, videoId }, videoCard);
    if (!videoId && collaborators.length === 0) return null;
    return {
        base: { ...base, videoId },
        videoId,
        collaborators
    };
}

function getQuickBlockActionInfo(context) {
    if (!context) return null;
    const collaborators = Array.isArray(context.collaborators) ? context.collaborators : [];
    const videoId = context.videoId || '';
    const groupId = (typeof generateCollaborationGroupId === 'function') ? generateCollaborationGroupId() : `quick-${Date.now()}`;

    if (collaborators.length >= 2) {
        const targets = collaborators.slice(0, 6);
        return {
            channelInfo: {
                name: targets.length === 2 ? 'Both Channels' : `All ${targets.length} Collaborators`,
                isBlockAllOption: true,
                allCollaborators: targets,
                collaborationGroupId: groupId,
                videoId
            },
            attrs: {
                'data-collaboration-group-id': groupId,
                'data-is-block-all': 'true'
            }
        };
    }

    const primary = collaborators[0] || context.base;
    if (!primary) return null;
    return {
        channelInfo: {
            ...primary,
            videoId: primary.videoId || videoId
        },
        attrs: {}
    };
}

function buildQuickBlockFallbackMetadata(source, context, collaborator) {
    return {
        handleDisplay: collaborator?.handleDisplay || collaborator?.handle || null,
        canonicalHandle: collaborator?.canonicalHandle || collaborator?.handle || null,
        channelName: collaborator?.name || context?.base?.name || null,
        customUrl: collaborator?.customUrl || null,
        videoId: collaborator?.videoId || context?.videoId || context?.base?.videoId || null,
        source: source || 'quickBlock'
    };
}

function getQuickBlockInput(collaborator, context) {
    const id = (collaborator?.id || '').trim();
    const customUrl = (collaborator?.customUrl || '').trim();
    const handle = (collaborator?.handle || '').trim();
    if (id) return id;
    if (customUrl) return customUrl;
    if (handle) return handle;
    const videoId = (collaborator?.videoId || context?.videoId || context?.base?.videoId || '').trim();
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `watch:${videoId}`;
    }
    return '';
}

async function runQuickBlockFallback(context, info, source = 'quickBlock') {
    const targetGroup = (info?.channelInfo?.collaborationGroupId || (typeof generateCollaborationGroupId === 'function' ? generateCollaborationGroupId() : `quick-${Date.now()}`));
    const collaborators = info?.channelInfo?.isBlockAllOption
        ? (Array.isArray(info?.channelInfo?.allCollaborators) ? info.channelInfo.allCollaborators : [])
        : [info?.channelInfo].filter(Boolean);

    const targetList = collaborators.length > 0 ? collaborators : collectQuickBlockCollaborators(context?.base || {}, null);
    if (!Array.isArray(targetList) || targetList.length === 0) {
        return { success: false, successCount: 0 };
    }

    let successCount = 0;
    for (let index = 0; index < targetList.length; index++) {
        const collaborator = targetList[index] || {};
        const input = getQuickBlockInput(collaborator, context);
        if (!input) continue;

        const otherChannels = targetList
            .filter((_, idx) => idx !== index)
            .map(item => item?.handle || item?.id || item?.customUrl || item?.name)
            .filter(Boolean);
        const metadata = buildQuickBlockFallbackMetadata(source, context, collaborator);
        let result = null;
        try {
            if (typeof addChannelDirectly === 'function') {
                result = await addChannelDirectly(input, false, otherChannels, targetGroup, metadata);
            } else {
                result = await new Promise((resolve) => {
                    chrome.runtime?.sendMessage({
                        type: 'addFilteredChannel',
                        input,
                        filterAll: false,
                        collaborationWith: otherChannels,
                        collaborationGroupId: targetGroup,
                        displayHandle: metadata.handleDisplay,
                        canonicalHandle: metadata.canonicalHandle,
                        channelName: metadata.channelName,
                        customUrl: metadata.customUrl,
                        videoId: metadata.videoId,
                        source: metadata.source,
                        profile: isKidsSite ? 'kids' : 'main'
                    }, (response) => resolve(response || { success: false, error: 'No response from background' }));
                });
            }
        } catch (e) {
            result = { success: false, error: e?.message || 'Quick block failed' };
        }
        if (result?.success) successCount++;
    }

    return { success: successCount > 0, successCount };
}

function applyQuickBlockImmediateHide(videoCard, channelInfo) {
    if (!videoCard || !(videoCard instanceof Element)) return;
    try {
        let targetToHide = videoCard;
        const tag = (videoCard.tagName || '').toLowerCase();
        if (tag.includes('lockup-view-model')) {
            const parentContainer = videoCard.closest('ytd-rich-item-renderer, .ytGridShelfViewModelGridShelfItem');
            if (parentContainer) targetToHide = parentContainer;
        } else if (tag === 'ytd-shorts-lockup-view-model' || tag.includes('shorts-lockup-view-model')) {
            const parentContainer = videoCard.closest('ytd-rich-item-renderer, .ytGridShelfViewModelGridShelfItem');
            if (parentContainer) targetToHide = parentContainer;
        }

        if (typeof markElementAsBlocked === 'function') {
            markElementAsBlocked(targetToHide, channelInfo || {}, 'pending');
        }
        targetToHide.style.display = 'none';
        targetToHide.classList.add('filtertube-hidden');
        targetToHide.setAttribute('data-filtertube-hidden', 'true');
    } catch (e) {
    }
}

async function runQuickBlockAction(videoCard, triggerBtn) {
    if (!videoCard) return;
    if (triggerBtn?.getAttribute('data-busy') === 'true') return;
    if (triggerBtn) triggerBtn.setAttribute('data-busy', 'true');

    try {
        const context = buildQuickBlockContext(videoCard);
        const info = getQuickBlockActionInfo(context);
        if (!info || !info.channelInfo) return;

        if (typeof handleBlockChannelClick === 'function') {
            const synthetic = createSyntheticQuickBlockMenuItem('Blocking...');
            Object.entries(info.attrs || {}).forEach(([k, v]) => synthetic.setAttribute(k, v));
            await handleBlockChannelClick(info.channelInfo, synthetic, false, videoCard);
            return;
        }

        const fallbackResult = await runQuickBlockFallback(context, info, isKidsSite ? 'quickBlockKids' : 'quickBlock');
        if (fallbackResult?.success) {
            applyQuickBlockImmediateHide(videoCard, info.channelInfo?.allCollaborators?.[0] || info.channelInfo);
            try {
                if (typeof applyDOMFallback === 'function') {
                    setTimeout(() => applyDOMFallback(null, { preserveScroll: true }), 120);
                }
            } catch (e) {
            }
        }
    } catch (e) {
        console.warn('FilterTube: Quick block action failed:', e);
    } finally {
        if (triggerBtn) triggerBtn.setAttribute('data-busy', 'false');
    }
}

function ensureQuickBlockButton(card) {
    if (!card || !(card instanceof Element)) return;
    if (isPostLikeQuickBlockCard(card)) return;

    const hostCard = resolveQuickBlockHost(card);
    if (!hostCard) return;
    const parentCard = hostCard.parentElement?.closest?.(QUICK_BLOCK_CARD_SELECTORS);
    if (parentCard && parentCard !== hostCard) return;

    if (!isQuickBlockEnabled()) {
        const existing = hostCard.querySelector('.filtertube-quick-block-wrap');
        if (existing) {
            try {
                existing.remove();
            } catch (e) {
            }
        }
        return;
    }

    if (hostCard.closest(`${FT_DROPDOWN_SELECTORS}, ytd-menu-popup-renderer`)) return;

    hostCard.classList.add('filtertube-quick-block-host');
    try {
        const shouldForceVisible = isMobileYouTubeSurface();
        if (shouldForceVisible) {
            hostCard.setAttribute('data-filtertube-quick-force', 'true');
        } else {
            hostCard.removeAttribute('data-filtertube-quick-force');
        }
    } catch (e) {
    }

    // Keep host as the action identity root, but anchor the visual control to a renderable
    // descendant (some hosts are `display: contents`, so absolutely-positioned children are invisible).
    const anchor = resolveQuickBlockAnchor(hostCard) || hostCard;
    anchor.classList.add('filtertube-quick-block-anchor');
    try {
        hostCard.__filtertubeQuickAnchor = anchor;
    } catch (e) {
    }

    const HOVER_STICKY_MS = 900;
    const LEAVE_STICKY_MS = 320;

    if (!hostCard.hasAttribute('data-filtertube-quick-events')) {
        hostCard.setAttribute('data-filtertube-quick-events', 'true');
        hostCard.addEventListener('mouseenter', () => {
            setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
        }, { passive: true });
        hostCard.addEventListener('mouseleave', () => {
            setQuickBlockHoverStateForHost(hostCard, false, LEAVE_STICKY_MS);
        }, { passive: true });
        hostCard.addEventListener('pointerenter', () => {
            setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
        }, { passive: true });
        hostCard.addEventListener('pointerleave', () => {
            setQuickBlockHoverStateForHost(hostCard, false, LEAVE_STICKY_MS);
        }, { passive: true });
        hostCard.addEventListener('focusin', () => {
            setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
        });
        hostCard.addEventListener('focusout', () => {
            setQuickBlockHoverStateForHost(hostCard, false, LEAVE_STICKY_MS);
        });
    }
    if (anchor !== hostCard && !anchor.hasAttribute('data-filtertube-quick-anchor-events')) {
        anchor.setAttribute('data-filtertube-quick-anchor-events', 'true');
        anchor.addEventListener('mouseenter', () => {
            setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
        }, { passive: true });
        anchor.addEventListener('mouseleave', () => {
            setQuickBlockHoverStateForHost(hostCard, false, LEAVE_STICKY_MS);
        }, { passive: true });
        anchor.addEventListener('pointerenter', () => {
            setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
        }, { passive: true });
        anchor.addEventListener('pointerleave', () => {
            setQuickBlockHoverStateForHost(hostCard, false, LEAVE_STICKY_MS);
        }, { passive: true });
        anchor.addEventListener('focusin', () => {
            setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
        });
        anchor.addEventListener('focusout', () => {
            setQuickBlockHoverStateForHost(hostCard, false, LEAVE_STICKY_MS);
        });
    }

    // Reuse any existing control and migrate it to the current anchor when needed.
    let wrap = hostCard.querySelector('.filtertube-quick-block-wrap');
    if (wrap) {
        if (wrap.parentElement !== anchor) {
            try {
                anchor.appendChild(wrap);
                wrap.__filtertubeQuickAnchor = anchor;
            } catch (e) {
            }
        }
        return;
    }

    wrap = document.createElement('div');
    wrap.className = 'filtertube-quick-block-wrap';
    wrap.setAttribute('data-open', 'false');
    wrap.__filtertubeQuickHost = hostCard;
    wrap.__filtertubeQuickAnchor = anchor;

    const trigger = document.createElement('button');
    trigger.className = 'filtertube-quick-block-btn';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', 'Quick block all channels on this card');
    trigger.title = 'Quick block all channels on this card';
    trigger.textContent = '×';

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        // Use the closest matched card for extraction (more accurate than wrapper hosts).
        const actionCard = (card && card.isConnected) ? card : hostCard;
        runQuickBlockAction(actionCard, trigger);
    });
    trigger.addEventListener('mouseenter', () => {
        setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
    }, { passive: true });
    trigger.addEventListener('mouseleave', () => {
        setQuickBlockHoverStateForHost(hostCard, false, LEAVE_STICKY_MS);
    }, { passive: true });

    wrap.appendChild(trigger);
    anchor.appendChild(wrap);
    try {
        if (!isMobileYouTubeSurface() && (hostCard.matches(':hover') || anchor.matches(':hover') || hostCard.contains(document.activeElement))) {
            setQuickBlockHoverStateForHost(hostCard, true, HOVER_STICKY_MS);
        }
    } catch (e) {
    }
}

function sweepQuickBlockButtons(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    if (!isQuickBlockEnabled()) {
        removeQuickBlockButtons();
        return;
    }
    root.querySelectorAll(QUICK_BLOCK_CARD_SELECTORS).forEach((card) => {
        ensureQuickBlockButton(card);
    });
}

function scheduleQuickBlockSweep(root = document) {
    if (quickBlockSweepTimer) return;
    quickBlockSweepTimer = setTimeout(() => {
        quickBlockSweepTimer = 0;
        sweepQuickBlockButtons(root);
    }, 80);
}

function setupQuickBlockObserver() {
    if (quickBlockObserverStarted) return;
    quickBlockObserverStarted = true;
    ensureQuickBlockStyles();

    const boot = () => {
        scheduleQuickBlockSweep(document);

        document.addEventListener('pointerenter', (event) => {
            if (!isQuickBlockEnabled()) return;
            const card = event?.target?.closest?.(QUICK_BLOCK_CARD_SELECTORS);
            if (card) {
                ensureQuickBlockButton(card);
            }
        }, true);

        // Home/Search hover-preview overlays can sit above the card, preventing `:hover` and
        // `mouseenter` from firing on the underlying host. Track the pointer position and
        // force the quick-block hover state on the best card under the pointer.
        // This eliminates the "1st hover bad, 2nd better, 3rd stable" pattern.
        if (!isMobileYouTubeSurface() && isHoverCapableDesktopSurface()) {
            let lastHost = null;
            let pending = false;
            let lastX = 0;
            let lastY = 0;

            const clearLast = () => {
                if (lastHost) {
                    setQuickBlockHoverStateForHost(lastHost, false, 160);
                    lastHost = null;
                }
            };

            const pickHostFromPoint = (x, y) => {
                try {
                    const list = document.elementsFromPoint(x, y) || [];
                    for (const el of list) {
                        if (!(el instanceof Element)) continue;
                        if (el.closest?.(FT_DROPDOWN_SELECTORS)) continue;
                        const candidate = el.closest?.(QUICK_BLOCK_CARD_SELECTORS);
                        if (!candidate) continue;
                        if (isPostLikeQuickBlockCard(candidate)) continue;
                        const host = resolveQuickBlockHost(candidate);
                        if (host) return host;
                    }
                } catch (e) {
                }
                return null;
            };

            const resolveHostBoundsElement = (host) => {
                if (!host || !(host instanceof Element)) return null;
                try {
                    const hostRect = host.getBoundingClientRect();
                    if (hostRect && hostRect.width >= 12 && hostRect.height >= 12) {
                        return host;
                    }
                } catch (e) {
                }
                try {
                    const anchor = host.__filtertubeQuickAnchor;
                    if (anchor instanceof Element) {
                        const anchorRect = anchor.getBoundingClientRect();
                        if (anchorRect && anchorRect.width >= 12 && anchorRect.height >= 12) {
                            return anchor;
                        }
                    }
                } catch (e) {
                }
                return null;
            };

            const pointInsideElementRect = (el, x, y, pad = 2) => {
                if (!el || !(el instanceof Element)) return false;
                try {
                    const rect = el.getBoundingClientRect();
                    if (!rect || rect.width <= 0 || rect.height <= 0) return false;
                    return (
                        x >= (rect.left - pad) &&
                        x <= (rect.right + pad) &&
                        y >= (rect.top - pad) &&
                        y <= (rect.bottom + pad)
                    );
                } catch (e) {
                    return false;
                }
            };

            const tick = () => {
                pending = false;
                if (!isQuickBlockEnabled()) {
                    clearLast();
                    return;
                }
                let host = pickHostFromPoint(lastX, lastY);
                if (!host && lastHost) {
                    const boundsEl = resolveHostBoundsElement(lastHost);
                    if (boundsEl && pointInsideElementRect(boundsEl, lastX, lastY, 3)) {
                        host = lastHost;
                    }
                }
                if (!host) {
                    clearLast();
                    return;
                }
                if (host !== lastHost) {
                    clearLast();
                    lastHost = host;
                }
                ensureQuickBlockButton(host);
                setQuickBlockHoverStateForHost(host, true, 900);
            };

            document.addEventListener('pointermove', (event) => {
                try {
                    if (!event || (event.pointerType && event.pointerType !== 'mouse')) return;
                    lastX = event.clientX;
                    lastY = event.clientY;
                    if (pending) return;
                    pending = true;
                    requestAnimationFrame(tick);
                } catch (e) {
                }
            }, { passive: true, capture: true });

            document.addEventListener('mouseleave', () => {
                clearLast();
            }, { passive: true, capture: true });
        }

        const observer = new MutationObserver((mutations) => {
            if (!isQuickBlockEnabled()) {
                removeQuickBlockButtons();
                return;
            }
            for (const mutation of mutations) {
                try {
                    const target = mutation.target;
                    if (target instanceof Element) {
                        const closestCard = target.matches?.(QUICK_BLOCK_CARD_SELECTORS)
                            ? target
                            : target.closest?.(QUICK_BLOCK_CARD_SELECTORS);
                        if (closestCard) {
                            ensureQuickBlockButton(closestCard);
                        }
                    }
                } catch (e) {
                }
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) continue;
                    if (node.matches?.(QUICK_BLOCK_CARD_SELECTORS)) {
                        ensureQuickBlockButton(node);
                    } else {
                        scheduleQuickBlockSweep(node);
                    }
                }
                for (const node of mutation.removedNodes) {
                    if (!(node instanceof Element)) continue;
                    if (node.classList?.contains('filtertube-quick-block-wrap')) {
                        const hostFromWrap = node.__filtertubeQuickHost instanceof Element ? node.__filtertubeQuickHost : null;
                        const host = hostFromWrap || (mutation.target instanceof Element
                            ? (mutation.target.matches?.(QUICK_BLOCK_CARD_SELECTORS)
                                ? mutation.target
                                : mutation.target.closest?.(QUICK_BLOCK_CARD_SELECTORS))
                            : null);
                        if (host) ensureQuickBlockButton(host);
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        if (!quickBlockPeriodicTimer) {
            quickBlockPeriodicTimer = window.setInterval(() => {
                sweepQuickBlockButtons(document);
            }, 1800);
        }
    };

    if (document.body) {
        boot();
    } else {
        window.addEventListener('DOMContentLoaded', boot, { once: true });
    }

}

/**
 * Observe dropdowns and inject FilterTube menu items
 */
function setupMenuObserver() {
    if (isKidsSite) {
        setupKidsPassiveBlockListener();
        return;
    }

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
            'ytm-menu-renderer button, ' +
            'ytm-bottom-sheet-renderer button'
        );
        if (menuButton) {
            lastClickedMenuButton = menuButton;
            blockChannelDebugLog('FilterTube: 3-dot button clicked, button:', menuButton.getAttribute('aria-label'));

            // Also try to find and inject immediately into existing dropdown
            setTimeout(() => {
                tryInjectIntoVisibleDropdown();
            }, 150);
        }
    }, true);

    function ensureDropdownVisibilityObserver(dropdown) {
        if (!dropdown || dropdownVisibilityObservers.has(dropdown)) return;
        const obs = new MutationObserver(() => {
            try {
                const hiddenAttr = dropdown.getAttribute('aria-hidden') === 'true' || dropdown.hasAttribute('hidden');
                let styleVisible = true;
                try {
                    const style = window.getComputedStyle(dropdown);
                    styleVisible = style.display !== 'none' && style.visibility !== 'hidden';
                } catch (e) {
                    styleVisible = dropdown.style.display !== 'none';
                }
                const isVisible = !hiddenAttr && styleVisible;
                if (isVisible) {
                    handleDropdownAppeared(dropdown).catch(err => {
                        console.error('FilterTube: Error in handleDropdownAppeared:', err);
                    });
                } else {
                    if (injectedDropdowns.has(dropdown)) {
                        injectedDropdowns.delete(dropdown);
                    }
                }
            } catch (e) {
            }
        });
        dropdownVisibilityObservers.set(dropdown, obs);
        try {
            obs.observe(dropdown, { attributes: true, attributeFilter: ['style', 'aria-hidden', 'hidden'] });
        } catch (e) {
        }
    }

    // Wait for document.body to be ready
    const startObserver = () => {
        if (!document.body) {
            setTimeout(startObserver, 100);
            return;
        }

        try {
            document.querySelectorAll(FT_DROPDOWN_SELECTORS).forEach(dd => ensureDropdownVisibilityObserver(dd));
        } catch (e) {
        }

        // Observe dropdown menus appearing (childList for new nodes)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Check for new nodes
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    const dropdown = node.matches?.(FT_DROPDOWN_SELECTORS)
                        ? node
                        : node.querySelector?.(FT_DROPDOWN_SELECTORS);

                    if (dropdown) {
                        ensureDropdownVisibilityObserver(dropdown);
                        const hiddenAttr = dropdown.getAttribute('aria-hidden') === 'true' || dropdown.hasAttribute('hidden');
                        let styleVisible = true;
                        try {
                            const style = window.getComputedStyle(dropdown);
                            styleVisible = style.display !== 'none' && style.visibility !== 'hidden';
                        } catch (e) {
                            styleVisible = dropdown.style.display !== 'none';
                        }
                        const isVisible = !hiddenAttr && styleVisible;

                        if (isVisible) {
                            blockChannelDebugLog('FilterTube: Dropdown added to DOM');
                            // Call async function without awaiting (fire and forget)
                            handleDropdownAppeared(dropdown).catch(err => {
                                console.error('FilterTube: Error in handleDropdownAppeared:', err);
                            });
                        }
                    }
                }

            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        blockChannelDebugLog('FilterTube: Menu observer started');
    };

    startObserver();
}

/**
 * YouTube Kids: passively listen to native "Block this video" toast and sync to kids profile.
 * We do NOT inject custom menu items on Kids; we only piggyback on the native block action.
 */
function setupKidsPassiveBlockListener() {
    document.addEventListener('click', (e) => {
        const menuButton = e.target.closest('ytk-menu-renderer tp-yt-paper-icon-button, tp-yt-paper-icon-button#menu-button');
        if (menuButton) {
            lastClickedMenuButton = menuButton;
            lastKidsMenuContext = captureKidsMenuContext(menuButton);
        }

        const menuItem = e.target.closest('ytk-menu-service-item-renderer, tp-yt-paper-item#menu-service-item, tp-yt-paper-item');
        if (menuItem) {
            const text = (menuItem.textContent || '').trim().toLowerCase();
            if (text.includes('block this video') || text.includes('block this channel')) {
                const blockType = text.includes('block this channel') ? 'channel' : 'video';
                lastKidsBlockClickTs = Date.now();
                // Trigger immediately on click - toast will be ignored if this succeeds
                handleKidsNativeBlock(blockType, { source: 'click' }).catch(err => console.error('FilterTube: Kids native block handler error', err));
            }
        }
    }, true);

    const waitBody = () => {
        if (!document.body) return void setTimeout(waitBody, 100);
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!(node instanceof Element)) continue;
                    const toast = node.matches?.('tp-yt-paper-toast#toast') ? node : node.querySelector?.('tp-yt-paper-toast#toast');
                    const text = toast?.textContent || '';
                    if (toast && /(video|channel)\s+blocked/i.test(text)) {
                        // Suppress toast if click handler recently did it
                        if (Date.now() - lastKidsBlockClickTs < 2000) {
                            blockChannelDebugLog('FilterTube: Kids block toast suppressed (click recently handled)');
                            return;
                        }
                        const blockType = /channel\s+blocked/i.test(text) ? 'channel' : 'video';
                        // The toast is a fallback if the click listener missed it or if it took a while
                        handleKidsNativeBlock(blockType, { source: 'toast' }).catch(err => console.error('FilterTube: Kids native block handler error', err));
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };
    waitBody();
}

function captureKidsMenuContext(menuButton) {
    const now = Date.now();

    const context = {
        ts: now,
        videoId: '',
        channelId: '',
        channelHandle: '',
        customUrl: '',
        channelName: '',
        source: 'kidsMenu'
    };

    try {
        const card = menuButton?.closest?.('ytk-compact-video-renderer, ytk-grid-video-renderer, ytk-video-renderer, ytk-slim-video-metadata-renderer, ytk-compact-playlist-renderer, ytk-compact-channel-renderer');
        if (card) {
            try {
                const extracted = typeof extractVideoIdFromCard === 'function' ? extractVideoIdFromCard(card) : null;
                if (extracted) context.videoId = extracted;
            } catch (e) {
            }

            const channelAnchor = card.querySelector('a[href*="/channel/UC"], a[href*="/channel/"], a[href^="/channel/"], a[href^="/user/"], a[href^="/c/"], a[href^="/@"]');
            const href = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
            if (href && window.FilterTubeIdentity?.extractChannelIdFromPath) {
                context.channelId = window.FilterTubeIdentity.extractChannelIdFromPath(href) || '';
            }

            if (href) {
                try {
                    const extractedHandle = window.FilterTubeIdentity?.extractRawHandle?.(href) || '';
                    if (extractedHandle && extractedHandle.startsWith('@')) {
                        context.channelHandle = extractedHandle;
                    }
                } catch (e) {
                }

                try {
                    const decoded = (() => {
                        try { return decodeURIComponent(href); } catch (e) { return href; }
                    })();
                    if (decoded.startsWith('/c/')) {
                        const slug = decoded.split('/')[2] || '';
                        if (slug) context.customUrl = `c/${slug}`;
                    } else if (decoded.startsWith('/user/')) {
                        const slug = decoded.split('/')[2] || '';
                        if (slug) context.customUrl = `user/${slug}`;
                    }
                } catch (e) {
                }
            }
            const channelName = channelAnchor?.textContent?.trim() || '';
            if (channelName) {
                context.channelName = channelName;
            } else {
                // Fallback: extract from aria-label of the card or its main link
                const labelElement = card.querySelector('[aria-label]') || card;
                const label = labelElement?.getAttribute('aria-label') || '';
                if (label) {
                    // Pattern 1: "... by [Channel Name] [Stats/Duration]"
                    const byMatch = label.match(/\s+by\s+(.+?)(?:\s+\d|$)/i);
                    if (byMatch && byMatch[1]) {
                        context.channelName = byMatch[1].trim();
                    }
                    // Pattern 2: "Video [Title] I [Channel Name] I [Duration]"
                    else if (label.includes(' I ')) {
                        const parts = label.split(' I ');
                        if (parts.length >= 2) {
                            // If it starts with "Video ", title is 0, channel is 1.
                            if (parts[0].startsWith('Video ')) {
                                context.channelName = parts[1].trim();
                            } else {
                                // Fallback to last but one or just 1
                                context.channelName = parts[1].trim();
                            }
                        }
                    }
                    // Pattern 3: "Channel [Name]"
                    else if (label.toLowerCase().startsWith('channel ')) {
                        context.channelName = label.substring(8).trim();
                    }
                }
            }
        }
    } catch (e) {
    }

    try {
        const isWatch = (document.location?.pathname || '').startsWith('/watch');
        if (isWatch && !context.videoId) {
            const params = new URLSearchParams(document.location?.search || '');
            const v = params.get('v') || '';
            if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
                context.videoId = v;
            }
        }
    } catch (e) {
    }

    try {
        const isChannel = (document.location?.pathname || '').startsWith('/channel/');
        if (isChannel && !context.channelId) {
            context.channelId = window.FilterTubeIdentity?.extractChannelIdFromPath?.(document.location?.pathname || '') || '';
        }
    } catch (e) {
    }

    try {
        const isWatch = (document.location?.pathname || '').startsWith('/watch');
        if (isWatch && !context.channelId) {
            const ownerLink = document.querySelector('#owner-data-container a[href^="/channel/UC"], a[href^="/channel/UC"] #video-owner')?.closest?.('a[href^="/channel/UC"]');
            const href = ownerLink?.getAttribute?.('href') || '';
            const extractedId = window.FilterTubeIdentity?.extractChannelIdFromPath?.(href) || '';
            if (extractedId) context.channelId = extractedId;
            const ownerName = ownerLink?.querySelector?.('#video-owner')?.textContent?.trim?.() || '';
            if (ownerName && !context.channelName) context.channelName = ownerName;
        }
    } catch (e) {
    }

    return context;
}

async function handleKidsNativeBlock(blockType = 'video', options = {}) {
    const now = Date.now();
    if (now - lastKidsBlockActionTs < 1000) {
        return;
    }

    let ctx = (lastKidsMenuContext && (now - (lastKidsMenuContext.ts || 0) < KIDS_MENU_CONTEXT_TTL_MS))
        ? lastKidsMenuContext
        : null;

    try {
        // Best-effort refresh to reduce stale menu context (Kids toast can fire late).
        if (!ctx || (!ctx.channelId && !ctx.channelName)) {
            const fresh = captureKidsMenuContext(lastClickedMenuButton);
            if (fresh) {
                lastKidsMenuContext = fresh;
                ctx = fresh;
            }
        }
    } catch (e) {
    }

    const videoId = ctx?.videoId || '';
    const channelIdHint = ctx?.channelId || '';
    const channelHandleHint = (ctx?.channelHandle || '').trim();
    const customUrlHint = (ctx?.customUrl || '').trim();

    let channelName = (ctx?.channelName || '').trim();
    const channelId = (channelIdHint || '').trim();

    // Some Kids surfaces can yield an ID-like token in our fallback parsing; avoid persisting that as the channel name.
    if (/^[a-zA-Z0-9_-]{11}$/.test(channelName) || /^UC[\w-]{22}$/i.test(channelName)) {
        channelName = '';
    }

    if (!videoId && !channelId && !channelName) return;

    // Deduplication logic: prevents infinite loop from toast detection
    // Build a unique key based on what we know
    let dedupKey = '';
    if (videoId) {
        dedupKey = `v:${videoId}`;
    } else if (channelId && channelId.startsWith('UC')) {
        dedupKey = `c:${channelId.toLowerCase()}`;
    } else if (channelName) {
        dedupKey = `n:${channelName.toLowerCase()}`;
    }

    if (!dedupKey) return;

    if (handledKidsBlockActions.has(dedupKey)) {
        blockChannelDebugLog(`FilterTube: Kids block for "${dedupKey}" already handled (${options.source || 'event'})`);
        return;
    }

    // Mark as handled for 10 seconds to cover late toasts
    handledKidsBlockActions.add(dedupKey);
    lastKidsBlockActionTs = now;
    setTimeout(() => handledKidsBlockActions.delete(dedupKey), 10000);

    blockChannelDebugLog(`FilterTube: Handling Kids native ${blockType} block for:`, dedupKey);

    const safeHandle = (channelHandleHint && channelHandleHint.startsWith('@')) ? channelHandleHint : '';
    const safeCustomUrl = (customUrlHint && (customUrlHint.startsWith('c/') || customUrlHint.startsWith('user/'))) ? customUrlHint : '';

    // Important: only set originalInput when it is a canonical identifier.
    // Otherwise allow background to use watch:<videoId> resolution.
    const originalInput = (channelId && channelId.startsWith('UC'))
        ? channelId
        : (safeHandle || safeCustomUrl || '');

    chrome.runtime?.sendMessage({
        action: 'FilterTube_KidsBlockChannel',
        videoId: videoId || null,
        channel: {
            name: channelName || null,
            id: channelId || '',
            handle: safeHandle || null,
            handleDisplay: safeHandle || null,
            canonicalHandle: safeHandle || null,
            customUrl: safeCustomUrl || null,
            // Prefer stable identifiers (UC id / channel name). If unavailable, let background fall back to watch:<videoId>.
            originalInput: originalInput || null,
            source: blockType === 'channel' ? 'kidsNativeChannel' : 'kidsNativeVideo',
            addedAt: Date.now()
        }
    }, (response) => {
        if (chrome.runtime?.lastError) {
            console.warn('FilterTube: Kids block message failed:', chrome.runtime.lastError.message);
            return;
        }
        if (!response?.success) {
            console.warn('FilterTube: Kids block message rejected:', response);
        }
    });
}

/**
 * Try to inject into currently visible dropdown
 */
function tryInjectIntoVisibleDropdown() {
    const visibleDropdowns = document.querySelectorAll(FT_DROPDOWN_SELECTORS);

    for (const dropdown of visibleDropdowns) {
        const hiddenAttr = dropdown.getAttribute('aria-hidden') === 'true' || dropdown.hasAttribute('hidden');
        let styleVisible = true;
        try {
            const style = window.getComputedStyle(dropdown);
            styleVisible = style.display !== 'none' && style.visibility !== 'hidden';
        } catch (e) {
            styleVisible = dropdown.style.display !== 'none';
        }
        const isVisible = !hiddenAttr && styleVisible;

        if (isVisible) {
            blockChannelDebugLog('FilterTube: Found visible dropdown');
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
        blockChannelDebugLog('FilterTube: Dropdown already being processed (sync lock), skipping');
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
        blockChannelDebugLog('FilterTube: No button reference, skipping injection');
        return;
    }

    if (isWhitelistModeActive()) {
        cleanupInjectedMenuItems(dropdown);
        return;
    }

    blockChannelDebugLog('FilterTube: Dropdown appeared, finding video card...');

    // Prefer comment context first (thread + modern comment view/renderer nodes).
    // This prevents fallback to watch/playlist wrappers when blocking from comment menus.
    const commentContextCard = lastClickedMenuButton.closest(
        'ytd-comment-thread-renderer, ' +
        'ytm-comment-thread-renderer, ' +
        'ytd-comment-view-model, ' +
        'ytm-comment-view-model, ' +
        'ytd-comment-renderer, ' +
        'ytm-comment-renderer'
    );
    const clickInComments = Boolean(lastClickedMenuButton.closest(
        '#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"]'
    ));

    // Find the associated video/short card from the button (comprehensive selectors)
    let videoCard = commentContextCard || lastClickedMenuButton.closest(
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
        'ytm-compact-playlist-renderer, ' +
        'ytm-playlist-video-renderer, ' +
        'ytm-playlist-panel-video-renderer, ' +
        'ytm-reel-item-renderer, ' +
        'ytm-radio-renderer, ' +
        'ytm-compact-radio-renderer, ' +
        'ytm-lockup-view-model, ' +
        'ytd-post-renderer, ' +                          // YouTube Posts
        'ytm-post-renderer, ' +                          // Mobile posts
        'ytm-backstage-post-renderer, ' +                // Mobile community post
        'ytm-backstage-post-thread-renderer, ' +         // Mobile community post thread
        'ytm-rich-section-renderer, ' +                  // Mobile section wrapper
        'ytd-playlist-panel-video-renderer, ' +         // Playlist videos
        'ytd-playlist-video-renderer, ' +               // Playlist videos (alternate)
        'ytm-shorts-lockup-view-model, ' +              // Shorts in mobile/search
        'ytm-shorts-lockup-view-model-v2, ' +           // Shorts variant
        'ytm-item-section-renderer, ' +                 // Container for shorts
        'yt-lockup-view-model, ' +                      // Modern video lockup (collabs)
        'ytd-rich-shelf-renderer'                       // Shelf containing shorts
    );
    if (!videoCard && !clickInComments) {
        videoCard = lastClickedMenuButton.closest(
            'ytd-watch-metadata, ' +                    // Watch page header
            'ytd-video-primary-info-renderer, ' +       // Watch page primary info
            'ytd-video-secondary-info-renderer, ' +     // Watch page secondary info
            'ytd-video-owner-renderer, ' +              // Watch page channel row
            'ytd-watch-flexy'                           // Watch page root
        );
    }

    if (!videoCard && !clickInComments) {
        try {
            const watchMeta = document.querySelector('ytd-watch-metadata');
            if (watchMeta) {
                videoCard = watchMeta;
            }
        } catch (e) {
        }
    }

    if (videoCard) {
        blockChannelDebugLog('FilterTube: Found video card:', videoCard.tagName);

        // Watch page: if we are using a watch header/owner renderer (which may not contain a watch link),
        // stamp the current videoId from URL so the menu enrichment path can use main-world lookups.
        // IMPORTANT: Do NOT stamp URL videoId onto normal feed cards (e.g., yt-lockup-view-model),
        // otherwise we can overwrite the card's real identity and block the wrong channel.
        try {
            const tag = (videoCard.tagName || '').toLowerCase();
            const isWatchHeaderCard = (
                tag === 'ytd-watch-metadata' ||
                tag === 'ytd-video-primary-info-renderer' ||
                tag === 'ytd-video-secondary-info-renderer' ||
                tag === 'ytd-video-owner-renderer' ||
                tag === 'ytd-watch-flexy'
            );

            if (isWatchHeaderCard && !videoCard.getAttribute('data-filtertube-video-id')) {
                const path = (document.location?.pathname || '');
                let v = '';

                if (path.startsWith('/watch')) {
                    const params = new URLSearchParams(document.location?.search || '');
                    v = params.get('v') || '';
                } else if (path.startsWith('/shorts/')) {
                    const parts = path.split('/').filter(Boolean);
                    v = parts.length >= 2 ? (parts[1] || '') : '';
                } else {
                    const params = new URLSearchParams(document.location?.search || '');
                    v = params.get('v') || '';
                }

                if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
                    videoCard.setAttribute('data-filtertube-video-id', v);
                }
            }
        } catch (e) {
        }

        // Get unique ID for this video card
        let videoCardId = videoCard.getAttribute('data-filtertube-unique-id');
        if (!videoCardId) {
            const stampedVideoId = videoCard.getAttribute('data-filtertube-video-id') || '';
            if (stampedVideoId && /^[a-zA-Z0-9_-]{11}$/.test(stampedVideoId)) {
                videoCardId = stampedVideoId;
            } else {
                // Try to extract video ID from links
                const videoLink = videoCard.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
                const videoIdMatch = videoLink?.href.match(/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);

                if (videoIdMatch) {
                    videoCardId = videoIdMatch[1];
                } else {
                    // Fallback: generate random ID
                    videoCardId = `card-${Math.random().toString(36).substr(2, 9)}`;
                }
            }
            videoCard.setAttribute('data-filtertube-unique-id', videoCardId);
        }

        // CRITICAL: Check if this dropdown is already being processed for this video
        const dropdownState = injectedDropdowns.get(dropdown);

        if (dropdownState?.videoCardId === videoCardId) {
            if (dropdownState.isProcessing) {
                blockChannelDebugLog('FilterTube: Dropdown already processing for this video, skipping');
                return;
            }
            if (dropdownState.isComplete) {
                // Verify menu item still exists in DOM before skipping
                const existingMenuItem = dropdown.querySelector('.filtertube-block-channel-item');
                if (existingMenuItem) {
                    // Check if the menu item has stale state (e.g., "✓ Channel Blocked" or "✓ Blocked")
                    const titleSpan = existingMenuItem.querySelector('.filtertube-menu-title');
                    const isStaleState = titleSpan?.textContent?.includes('✓') || titleSpan?.textContent?.includes('Blocking');

                    if (isStaleState) {
                        blockChannelDebugLog('FilterTube: Menu item has stale state, re-injecting fresh');
                        injectedDropdowns.delete(dropdown);
                        // Continue to re-inject
                    } else {
                        blockChannelDebugLog('FilterTube: Dropdown already injected for this video, skipping');
                        return;
                    }
                } else {
                    blockChannelDebugLog('FilterTube: State says complete but menu item missing, re-injecting');
                    // Reset state and continue to re-inject
                    injectedDropdowns.delete(dropdown);
                }
            }
        }

        if (dropdownState && dropdownState.videoCardId !== videoCardId) {
            blockChannelDebugLog('FilterTube: Dropdown reused for different video - will clean and reinject');
            // Old items will be removed by injectFilterTubeMenuItem automatically
        }

        // Mark as being processed IMMEDIATELY (prevents duplicate calls)
        injectedDropdowns.set(dropdown, { videoCardId, isProcessing: true, isComplete: false });

        // Watch for card removal (video hidden) and close dropdown
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.removedNodes) {
                    if (node === videoCard || node.contains(videoCard)) {
                        blockChannelDebugLog('FilterTube: Video card removed, closing dropdown');
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
                            blockChannelDebugLog('FilterTube: Dropdown closed, marked fetch as cancelled');
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
        blockChannelDebugLog('FilterTube: Could not find video card from button');

        // CRITICAL: Clean up any stale FilterTube items from dropdown
        // (prevents old "✓ Channel Blocked" showing when we can't identify the video)
        const oldItems = dropdown.querySelectorAll('.filtertube-block-channel-item');
        if (oldItems.length > 0) {
            blockChannelDebugLog('FilterTube: Removing stale FilterTube items from dropdown');
            oldItems.forEach(item => item.remove());
        }
    }
}

// Initialize menu observer after a delay
setTimeout(() => {
    setupMenuObserver();
    setupQuickBlockObserver();
}, 1000);
