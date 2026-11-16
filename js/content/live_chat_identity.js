// js/content/live_chat_identity.js (MAIN world, live chat frame only)
//
// Each chat message element carries its sender's channel id only in the page's own data. This
// script copies it (and the shown name) onto the element as attributes, so the isolated-world filter
// (js/content/live_chat_filter.js) can decide the message by channel like the app does. It reads
// nothing else and sends nothing anywhere.
(function () {
    'use strict';
    if (window.__filtertubeLiveChatIdentity) return;
    window.__filtertubeLiveChatIdentity = true;

    const SELECTOR = 'yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer, yt-live-chat-membership-item-renderer, yt-live-chat-paid-sticker-renderer, yt-gift-message-view-model';

    function textOf(value) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value.content === 'string') return value.content;
        if (typeof value.simpleText === 'string') return value.simpleText;
        if (Array.isArray(value.runs)) return value.runs.map(run => run.text || run.emoji?.shortcuts?.[0] || '').join('');
        return '';
    }

    function stamp(element) {
        try {
            const data = element.data || element.__data?.data || element.polymerController?.data || null;
            if (!data) return false;
            const id = typeof data.authorExternalChannelId === 'string' ? data.authorExternalChannelId : '';
            if (!id && data.authorName) {
                // A gift names its sender but not their channel: the filter decides it by name and words.
                const name = textOf(data.authorName);
                if (name && element.getAttribute('data-filtertube-author-name') !== name) element.setAttribute('data-filtertube-author-name', name);
                const line = textOf(data.text);
                if (line && element.getAttribute('data-filtertube-message-text') !== line) element.setAttribute('data-filtertube-message-text', line);
                return true;
            }
            if (id && element.getAttribute('data-filtertube-author-id') !== id) element.setAttribute('data-filtertube-author-id', id);
            const name = textOf(data.authorName);
            if (name && element.getAttribute('data-filtertube-author-name') !== name) element.setAttribute('data-filtertube-author-name', name);
            // Gifts (view models) carry the sender and their line as plain text.
            const message = textOf(data.message || data.headerSubtext || data.text);
            if (message && element.getAttribute('data-filtertube-message-text') !== message) element.setAttribute('data-filtertube-message-text', message);
            return !!id;
        } catch (e) {
            return false;
        }
    }

    function stampLater(element, tries = 0) {
        if (stamp(element) || tries > 10) return;
        setTimeout(() => stampLater(element, tries + 1), 60 * (tries + 1));
    }

    function scan(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        if (root.matches?.(SELECTOR)) stampLater(root);
        root.querySelectorAll(SELECTOR).forEach(element => stampLater(element));
    }

    const observer = new MutationObserver(records => {
        for (const record of records) record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); });
    });
    const start = () => {
        scan(document.documentElement);
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };
    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
