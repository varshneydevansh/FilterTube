// js/shared/live_chat_filter.js
//
// Live chat under the full rules, ported from the Android app (NativeOwnedFilterDecider
// mainLiveChatMessageBlocked and NativeMainCommentsProvider liveChatBlocker): every channel and
// keyword of the profile decides each message, the way they decide cards. A channel blocked anywhere
// (cards, comments, an import) hides its messages, any keyword in the text hides the message (comment
// keywords too), and allow mode shows only messages whose sender or words are allowed. Without a
// real channel id a sender can't be proven either way: names and words still decide, otherwise the
// message stays hidden while any channel rule exists (as cards wait for their channel).
//
// Pure and storage-free; needs FilterTubeIdentity (js/shared/identity.js). Exposed as
// `FilterTubeLiveChatFilter`, and as a CommonJS module for tests.
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.FilterTubeLiveChatFilter = api;
}(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis), function (root) {
    'use strict';

    const UC_ID = /^UC[\w-]{22}$/;

    function compileKeywords(list) {
        const out = [];
        for (const entry of Array.isArray(list) ? list : []) {
            // Date-limited words describe videos, so they never decide a message.
            if (!entry || entry.dateFilter) continue;
            try {
                if (entry instanceof RegExp) out.push(entry);
                else if (typeof entry.pattern === 'string') out.push(new RegExp(entry.pattern, String(entry.flags || 'i').replace(/g/g, '')));
                else if (typeof entry === 'string' && entry.trim()) out.push(new RegExp(entry.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
            } catch (e) {
            }
        }
        return out;
    }

    /**
     * Compiles the parts of the compiled settings chat needs, once per settings object. Returns null
     * when filtering is off (then every message shows).
     */
    function compile(settings, Identity = root.FilterTubeIdentity) {
        const s = settings && typeof settings === 'object' ? settings : {};
        if (s.enabled === false || !Identity) return null;
        const filterChannels = Array.isArray(s.filterChannels) ? s.filterChannels : [];
        const whitelistChannels = Array.isArray(s.whitelistChannels) ? s.whitelistChannels : [];
        const channelMap = s.channelMap && typeof s.channelMap === 'object' ? s.channelMap : {};
        const studyState = String(s.study?.state || '');
        return {
            Identity,
            channelMap,
            allowMode: s.listMode === 'whitelist',
            layered: s.listMode === 'whitelist' && s.listLayered === true,
            // Android studyApplied.rest: nothing shows during a study break.
            rest: studyState === 'BREAK' || s.study?.rest === true,
            needsChannelIdentity: filterChannels.length > 0 || whitelistChannels.length > 0,
            blockIndex: filterChannels.length ? Identity.buildChannelFilterIndex(filterChannels, channelMap) : null,
            allowIndex: whitelistChannels.length ? Identity.buildChannelFilterIndex(whitelistChannels, channelMap) : null,
            blockKeywords: [...compileKeywords(s.filterKeywords), ...compileKeywords(s.filterKeywordsComments)],
            allowKeywords: compileKeywords(s.whitelistKeywords)
        };
    }

    /** Android RuleLayerDecision.decide: true shows, false hides, null when nothing matched. */
    function layerDecision(layered, block, allow) {
        if (layered) {
            if (block > 0) return false;
            if (allow > 0) return true;
            return null;
        }
        if (block === 0 && allow === 0) return null;
        return allow >= block && allow > 0;
    }

    /** One message: {authorChannelId, author, text}. True hides it. */
    function messageBlocked(compiled, message) {
        if (!compiled) return false;
        if (compiled.rest) return true;
        const Identity = compiled.Identity;
        const author = String(message?.author || '').trim();
        const text = String(message?.text || '').replace(/\s+/g, ' ').trim();
        const channelId = UC_ID.test(String(message?.authorChannelId || '').trim()) ? String(message.authorChannelId).trim() : '';
        // Chat shows the sender's handle as their name, so a handle rule matches without a lookup.
        const identity = { id: channelId, name: author, handle: author.startsWith('@') ? author : '' };
        const words = list => text && list.some(regex => { regex.lastIndex = 0; return regex.test(text); });
        const blockedName = Identity.matchesChannelNameRows(identity, compiled.blockIndex);
        const allowedName = Identity.matchesChannelNameRows(identity, compiled.allowIndex);
        const identityProven = !!channelId || !compiled.needsChannelIdentity;
        const matches = index => !!index && identityProven && Identity.channelMetaMatchesIndex(identity, index, compiled.channelMap);
        const blockedChannel = blockedName || matches(compiled.blockIndex);
        const allowedChannel = allowedName || matches(compiled.allowIndex);
        const block = blockedChannel ? 2 : (words(compiled.blockKeywords) ? 1 : 0);
        const allow = allowedChannel ? 2 : (words(compiled.allowKeywords) ? 1 : 0);
        const shown = layerDecision(compiled.layered, block, allow);
        if (shown !== null) return !shown;
        if (!identityProven) return true;
        return compiled.allowMode;
    }

    /** NativeMainLiveChatFilter.apply: the messages that show, and how many were hidden. */
    function apply(messages, compiled) {
        const list = Array.isArray(messages) ? messages : [];
        const shown = list.filter(message => !messageBlocked(compiled, message));
        return { messages: shown, hidden: list.length - shown.length };
    }

    return Object.freeze({ compile, messageBlocked, apply, layerDecision });
}));
