/* The search box dropdown, last line (isolated world). The network layers in seed.js already filter
 * the suggestions; this catches any other way they arrive (a cached list, a new delivery path).
 * - A row whose text the rules don't allow is hidden (search_suggestions_filter.allowsSearchText).
 * - Pictures: none on Kids, in allow mode, Study or a rest break (the network layer keeps only admitted
 *   ones, and the dropdown can't tell which those were); a block list keeps them.
 * - Before settings arrive every row stays hidden on the Kids site; elsewhere rows wait hidden until
 *   settings are known, at most a moment.
 * Hidden rows carry data-filtertube-suggestion-hidden; nothing is removed, so the site's own list
 * code keeps working.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeSearchSuggestionsDom = api;
    try {
        if (!api.autoStarted && root.document && root.MutationObserver
            && /(^|\.)youtube(kids)?\.com$/.test(String(root.location?.hostname || ''))) {
            api.autoStarted = true;
            api.watch({ window: root, document: root.document });
        }
    } catch (e) {
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const CONTAINERS = '.ytSearchboxComponentSuggestionsContainer, .sbdd_b, .gstl_50, ytd-searchbox, .ytm-searchbox';
    const ROWS = '[role="option"], li.sbsb_c, .sbse';
    const HIDDEN_ATTR = 'data-filtertube-suggestion-hidden';
    const PICTURE_ATTR = 'data-filtertube-suggestion-picture-hidden';

    function rowText(row) {
        return String(row?.innerText || row?.textContent || '').replace(/\s+/g, ' ').trim();
    }

    /** What the dropdown does with one row: {hide, hidePicture}. Pure, for tests. */
    function rowDecision(text, settings, { kidsHost = false, filter } = {}) {
        if (!filter) return { hide: false, hidePicture: false };
        if (!settings) return { hide: true, hidePicture: true };
        if (settings.enabled === false) return { hide: false, hidePicture: false };
        const rules = filter.compile(settings, { kids: kidsHost });
        const hide = !!text && !filter.allowsSearchText(settings, text, { rules });
        const hidePicture = rules.kids || rules.allowMode || rules.rest || rules.studying;
        return { hide, hidePicture };
    }

    function apply(row, decision) {
        if (decision.hide) {
            if (row.getAttribute(HIDDEN_ATTR) !== 'true') {
                row.setAttribute(HIDDEN_ATTR, 'true');
                row.style.setProperty('display', 'none', 'important');
            }
        } else if (row.getAttribute(HIDDEN_ATTR) === 'true') {
            row.removeAttribute(HIDDEN_ATTR);
            row.style.removeProperty('display');
        }
        for (const picture of row.querySelectorAll('img, yt-img-shadow, .ytSearchboxComponentSuggestionImage')) {
            if (decision.hidePicture) {
                picture.setAttribute(PICTURE_ATTR, 'true');
                picture.style.setProperty('visibility', 'hidden', 'important');
            } else if (picture.getAttribute(PICTURE_ATTR) === 'true') {
                picture.removeAttribute(PICTURE_ATTR);
                picture.style.removeProperty('visibility');
            }
        }
    }

    function watch(env) {
        const win = env.window;
        const doc = env.document;
        const kidsHost = /(^|\.)youtubekids\.com$/i.test(String(win.location?.hostname || ''));
        const settings = () => env.settings ? env.settings() : (win.currentSettings || null);
        let scheduled = false;
        let waitTimer = null;

        function sweep() {
            scheduled = false;
            const filter = win.FilterTubeSearchSuggestions;
            if (!filter) return;
            const current = settings();
            observeContainers();
            for (const container of doc.querySelectorAll(CONTAINERS)) {
                for (const row of container.querySelectorAll(ROWS)) apply(row, rowDecision(rowText(row), current, { kidsHost, filter }));
            }
            // Rows held back for settings get another look once they're likely in.
            if (!current && !waitTimer) waitTimer = win.setTimeout(() => { waitTimer = null; schedule(); }, 400);
        }

        function schedule() {
            if (scheduled) return;
            scheduled = true;
            (win.requestAnimationFrame || (fn => win.setTimeout(fn, 16)))(sweep);
        }

        // Only the dropdown is observed, and only once the search box is used: the page itself is busy.
        const observed = new WeakSet();
        const observers = [];
        function observeContainers() {
            for (const container of doc.querySelectorAll(CONTAINERS)) {
                if (observed.has(container)) continue;
                observed.add(container);
                const observer = new win.MutationObserver(schedule);
                observer.observe(container, { childList: true, subtree: true, characterData: true });
                observers.push(observer);
            }
        }
        const onSearchBox = event => {
            const target = event.target;
            if (!target?.matches?.('input[name="search_query"], input.ytSearchboxComponentInput, input#search, .ytm-searchbox input')) return;
            observeContainers();
            schedule();
            // The dropdown is drawn when the answer comes back.
            win.setTimeout(schedule, 350);
        };
        for (const type of ['focusin', 'input', 'keyup']) doc.addEventListener(type, onSearchBox, true);
        return { sweep, stop: () => observers.forEach(observer => observer.disconnect()) };
    }

    return { rowDecision, rowText, watch, HIDDEN_ATTR, PICTURE_ATTR };
}));
