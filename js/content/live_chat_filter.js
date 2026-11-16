// js/content/live_chat_filter.js (live chat frame only)
//
// Live chat under the full rules (Android NativeMainCommentsProvider liveChatBlocker): each message
// is decided by FilterTubeLiveChatFilter (js/shared/live_chat_filter.js) with the profile's compiled
// rules, and a hidden message is simply not shown. The sender's channel id comes from
// js/content/live_chat_identity.js; until it arrives the message waits hidden while channel rules exist.
(function () {
    'use strict';
    if (window.__filtertubeLiveChatFilter) return;
    window.__filtertubeLiveChatFilter = true;

    const api = typeof browser !== 'undefined' && browser.runtime ? browser : (typeof chrome !== 'undefined' ? chrome : null);
    const Filter = window.FilterTubeLiveChatFilter;
    if (!api?.runtime || !Filter) return;

    const SELECTOR = 'yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer, yt-live-chat-membership-item-renderer, yt-live-chat-paid-sticker-renderer, yt-gift-message-view-model';
    let compiled = null;

    function messageOf(element) {
        const author = element.getAttribute('data-filtertube-author-name')
            || element.querySelector('#author-name')?.textContent || '';
        const text = element.getAttribute('data-filtertube-message-text')
            || element.querySelector('#message')?.textContent || '';
        return { authorChannelId: element.getAttribute('data-filtertube-author-id') || '', author, text };
    }

    function decide(element) {
        const hide = Filter.messageBlocked(compiled, messageOf(element));
        if (hide) {
            if (element.getAttribute('data-filtertube-hidden') !== 'live-chat') {
                element.setAttribute('data-filtertube-hidden', 'live-chat');
                element.style.setProperty('display', 'none', 'important');
            }
        } else if (element.getAttribute('data-filtertube-hidden') === 'live-chat') {
            element.removeAttribute('data-filtertube-hidden');
            element.style.removeProperty('display');
        }
    }

    function scanAll() {
        document.querySelectorAll(SELECTOR).forEach(decide);
    }

    function applySettings(settings) {
        compiled = settings && typeof settings === 'object' ? Filter.compile(settings) : null;
        scanAll();
    }

    function requestSettings() {
        try {
            const done = response => applySettings(response && !response.error ? response : null);
            const maybe = api.runtime.sendMessage({ action: 'getCompiledSettings', profileType: 'main' }, response => {
                if (api.runtime.lastError) return;
                done(response);
            });
            if (maybe && typeof maybe.then === 'function') maybe.then(done, () => {});
        } catch (e) {
        }
    }

    api.runtime.onMessage.addListener(request => {
        if (request?.action === 'FilterTube_ApplySettings' && request.settings) applySettings(request.settings);
        else if (request?.action === 'FilterTube_RefreshNow' || request?.action === 'FilterTube_StudyState') requestSettings();
    });

    const observer = new MutationObserver(records => {
        for (const record of records) {
            if (record.type === 'attributes') {
                if (record.target.matches?.(SELECTOR)) decide(record.target);
                continue;
            }
            record.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.matches?.(SELECTOR)) decide(node);
                node.querySelectorAll?.(SELECTOR).forEach(decide);
            });
        }
    });
    const start = () => {
        observer.observe(document.documentElement, {
            childList: true, subtree: true, attributes: true,
            attributeFilter: ['data-filtertube-author-id', 'data-filtertube-author-name', 'data-filtertube-message-text']
        });
        requestSettings();
    };
    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
