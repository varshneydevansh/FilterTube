/* The app's Controls look on the extension's options page (docs/app/controls/mockups/controls-v2.html,
 * ControlsPaper.kt, NativeControlCenterView). It adds, without changing how anything is saved:
 * - The Controls hub on the dashboard: the today card (a big Delius numeral on a brick crayon
 *   swoosh, and what is at work) and the two-column area tiles. Each tile wears its area's hue
 *   (Filters rose, Content Controls sky, Kids Mode sun, Study sage, people lilac, the rest paper),
 *   is washed only while its area holds something, and opens the same page as the sidebar.
 * - The area of the page you are on (data-pk-area on <html>), so switches, ticks and tabs take its ink.
 * - Under each content control, the app's status line: "Hidden everywhere" or "Showing".
 * - While the allow list is on, a scribble circle round "Allowed rules" (DoodleKit.scribbleCircle).
 * - On Keywords and Channels, the date and sort options fold behind one filter button beside search
 *   (NativeMainRuleFilterSheet); the button fills brick-soft while they narrow the list.
 * Words come from data/ui_locales; tile titles and summaries are the sidebar's own, so they stay in
 * step with it in every language.
 */
(function (root) {
    'use strict';
    if (!root || !root.document || root.FilterTubePaperParity) return;
    const doc = root.document;

    const COPY = Object.freeze({
        todayHidden: ['pk.hub.todayHidden', 'videos kept out of sight today'],
        todayDetail: ['pk.hub.todayDetail', '{channels} and {words} at work on {space}'],
        countChannels: ['pk.hub.countChannels', '{count} channels'],
        countWords: ['pk.hub.countWords', '{count} words'],
        todayRules: ['pk.hub.todayRules', 'rules at work on {space}'],
        rulesDetail: ['pk.hub.rulesDetail', '{channels} and {words}'],
        emptyTitle: ['pk.hub.emptyTitle', 'No rules yet'],
        emptyDetail: ['pk.hub.emptyDetail', 'Add a word or channel and it stays out of sight everywhere.'],
        allowedTitle: ['pk.hub.allowedTitle', 'Allowed only on {space}'],
        allowedDetail: ['pk.hub.allowedDetail', 'Only what is on your list can show.'],
        allowedOnly: ['pk.hub.allowedOnly', 'Allowed only'],
        tileFilters: ['pk.hub.tileFilters', '{channels}, {words}'],
        noRules: ['pk.hub.noRules', 'No rules yet'],
        contentStatus: ['pk.hub.contentStatus', 'Clips, comments, categories and video types'],
        spaceMain: ['pk.space.main', 'Main Viewing'],
        spaceKids: ['pk.space.kids', 'Kids Viewing'],
        hidden: ['pk.toggle.hidden', 'Hidden everywhere'],
        showing: ['pk.toggle.showing', 'Showing'],
        // Android reuses the TV's translated "More options" for this button (93cf50d53).
        ruleOptions: ['dashboard.ruleEditor.moreOptions', 'More options']
    });

    // ControlsPaper.areaOf and tileIcon: which hue and crayon icon each destination wears.
    const TILES = Object.freeze([
        { nav: '.nav-item[data-tab="filters"]:not(.nav-item--sub)', area: 'filters', icon: 'filtertube_filter', count: 'rules' },
        { nav: '.nav-item[data-nav-id="content"]', area: 'content', icon: 'hide', count: 'content' },
        { nav: '.nav-item[data-tab="kids"]', area: 'kids', icon: 'kids', count: 'kids' },
        { nav: '.nav-item[data-tab="settings"]:not(.nav-item--sub)', area: 'neutral', icon: 'settings' },
        { nav: '.nav-item[data-nav-id="timeLimits"]', area: 'study', icon: 'timer' },
        { nav: '.nav-item[data-nav-id="backup"]', area: 'neutral', icon: 'folder' },
        { nav: '.nav-item[data-tab="sync"]:not(.nav-item--sub)', area: 'family', icon: 'refresh' },
        { nav: '.nav-item[data-nav-id="profiles"]', area: 'family', icon: 'you' },
        { nav: '.nav-item[data-tab="whatsnew"]', area: 'neutral', icon: 'notifications' },
        { nav: '.nav-item[data-tab="help"]', area: 'neutral', icon: 'help' },
        { nav: '.nav-item[data-tab="about"]', area: 'neutral', icon: 'info' },
        { nav: '.nav-item[data-tab="donate"]', area: 'neutral', icon: 'favourite' }
    ]);
    const NAV_AREA = Object.freeze({
        dashboard: 'neutral', filters: 'filters', content: 'content', kids: 'kids', settings: 'family',
        timeLimits: 'study', backup: 'neutral', sync: 'family', profiles: 'family', whatsnew: 'neutral',
        help: 'neutral', about: 'neutral', donate: 'neutral'
    });

    function t(entry, values = {}) {
        const [key, fallback] = entry;
        let text = '';
        try { text = root.FilterTubeUiLocalization?.text?.(key, values) || ''; } catch (e) { }
        if (!text || text === key) text = fallback;
        return String(text).replace(/\{([a-zA-Z]+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }

    function locale() {
        return root.FilterTubeUiLocalization?.locale || doc.documentElement.lang || 'en';
    }

    /** A plural line from "<key>.<category>" (Intl plural rules), falling back to ".other". */
    function plural(entry, count, values = {}) {
        let category = 'other';
        try { category = new Intl.PluralRules(locale()).select(count); } catch (e) { }
        const [key, fallback] = entry;
        const one = category === 'one' ? fallback.replace(/^videos/, 'video').replace(/^rules/, 'rule').replace(/channels\b/, 'channel').replace(/words\b/, 'word') : fallback;
        for (const candidate of [category, 'other']) {
            let text = '';
            try { text = root.FilterTubeUiLocalization?.text?.(`${key}.${candidate}`, values) || ''; } catch (e) { }
            if (text && text !== `${key}.${candidate}`) return text.replace(/\{count\}/g, formatCount(count));
        }
        return t([key, one], { count: formatCount(count), ...values });
    }

    function formatCount(value) {
        try { return new Intl.NumberFormat(locale()).format(value); } catch (e) { return String(value); }
    }

    /**
     * The app's RollingCounterView: a change of 1 to 9 rolls only the digits that changed (the old one
     * rises 60 % of its height while fading, the new one comes up from below, 220 ms, standard curve);
     * a change of 10 or more, or new words, crossfades the whole line over 120 ms. Instant with reduced
     * motion, and the first time a number is drawn.
     */
    const ROLL_MS = 220;
    const CROSSFADE_MS = 120;
    const ROLL_TRAVEL = 0.6;
    const BIG_CHANGE = 10;
    const STANDARD = 'cubic-bezier(0.4, 0, 0.2, 1)';

    function rollTo(node, text) {
        const next = String(text);
        const previous = node.dataset.pkRoll ?? null;
        if (previous === next) return;
        node.dataset.pkRoll = next;
        const reduced = !!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        if (previous === null || reduced || !node.animate || !next || !previous) {
            node.textContent = next;
            return;
        }
        const from = Number(previous.replace(/[^\d]/g, ''));
        const to = Number(next.replace(/[^\d]/g, ''));
        const numeric = /\d/.test(previous) && /\d/.test(next);
        if (!numeric || Math.abs(to - from) >= BIG_CHANGE || previous.length !== next.length) {
            node.textContent = next;
            node.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: CROSSFADE_MS, easing: 'linear' });
            return;
        }
        node.textContent = '';
        for (let i = 0; i < next.length; i += 1) {
            const cell = el('span', 'pk-roll-digit');
            const now = el('span', 'pk-roll-digit__now', next[i]);
            cell.appendChild(now);
            if (previous[i] !== next[i]) {
                const old = el('span', 'pk-roll-digit__old', previous[i]);
                old.setAttribute('aria-hidden', 'true');
                cell.appendChild(old);
                const up = to >= from;
                const travel = `${ROLL_TRAVEL * 100}%`;
                old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${up ? '-' : ''}${travel})`, opacity: 0 }],
                    { duration: ROLL_MS, easing: STANDARD, fill: 'forwards' });
                now.animate([{ transform: `translateY(${up ? '' : '-'}${travel})`, opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
                    { duration: ROLL_MS, easing: STANDARD });
            }
            node.appendChild(cell);
        }
        root.setTimeout(() => { if (node.dataset.pkRoll === next) node.textContent = next; }, ROLL_MS + 40);
    }

    function numberIn(text) {
        return (String(text || '').match(/\d[\d,.\s]*/g) || []).map(part => Number(part.replace(/[^\d]/g, '')) || 0);
    }

    function iconUrl(name) {
        const path = `assets/icons/crayon/${name}.svg`;
        try { return root.chrome?.runtime?.getURL?.(path) || `../${path}`; } catch (e) { return `../${path}`; }
    }

    function el(tag, className, text) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    /** The tile's icon inside a hand-drawn ring that does not quite close (ControlsPaper.ringIcon). */
    function ring() {
        const holder = el('span', 'pk-tile__ring');
        holder.setAttribute('aria-hidden', 'true');
        const ns = 'http://www.w3.org/2000/svg';
        const svg = doc.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 40 40');
        const path = doc.createElementNS(ns, 'path');
        const r = 18.5;
        const point = deg => [20 + r * Math.cos(deg * Math.PI / 180), 20 + r * Math.sin(deg * Math.PI / 180)];
        const [x0, y0] = point(-78);
        const [x1, y1] = point(-78 + 344);
        path.setAttribute('d', `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 1 1 ${x1.toFixed(2)},${y1.toFixed(2)}`);
        svg.appendChild(path);
        holder.append(svg, el('span', 'pk-tile__icon'));
        return holder;
    }

    // ---- The hub ---------------------------------------------------------------------------------

    function readCounts() {
        const value = id => Number(String(doc.getElementById(id)?.textContent || '0').replace(/[^\d]/g, '')) || 0;
        const listMode = doc.querySelector('#ftTopBarListModeControlsTab .ft-list-mode-pill');
        return {
            hidden: value('statHiddenToday'),
            keywords: value('statActiveKeywords'),
            channels: value('statFilteredChannels'),
            kids: doc.getElementById('dashboardStatsKidsBtn')?.classList.contains('active') === true,
            allowOnly: !!listMode && !listMode.classList.contains('toggle-variant-red')
        };
    }

    function mountHub() {
        const view = doc.getElementById('dashboardView');
        const hero = view?.querySelector('.ft-dash-hero');
        if (!view || !hero || view.querySelector('.pk-hub')) return;
        const hub = el('section', 'pk-hub');
        const today = el('div', 'pk-today');
        const number = el('span', 'pk-today__number');
        const digits = el('span', 'pk-today__digits');
        number.appendChild(digits);
        const words = el('div', 'pk-today__words');
        const title = el('strong', 'pk-today__title');
        const detail = el('span', 'pk-today__detail');
        words.append(title, detail);
        today.append(number, words);
        const grid = el('div', 'pk-hub__grid');
        const tiles = [];
        for (const spec of TILES) {
            const nav = doc.querySelector(spec.nav);
            if (!nav || nav.hidden) continue;
            const tile = el('button', 'pk-tile');
            tile.type = 'button';
            tile.dataset.area = spec.area;
            tile.style.setProperty('--pk-tile-icon', `url("${iconUrl(spec.icon)}")`);
            tile.style.setProperty('--pk-tile-icon-on', `url("${iconUrl(`${spec.icon}_selected`)}")`);
            const head = el('span', 'pk-tile__head');
            const count = el('span', 'pk-tile__count');
            count.setAttribute('aria-hidden', 'true');
            head.append(ring(), count);
            const name = el('span', 'pk-tile__title');
            const sub = el('span', 'pk-tile__sub');
            const badge = el('span', 'pk-tile__badge');
            badge.hidden = true;
            tile.append(head, name, sub, badge);
            tile.addEventListener('click', () => nav.click());
            grid.appendChild(tile);
            tiles.push({ spec, nav, tile, count, name, sub, badge });
        }
        hub.append(today, grid);
        hero.insertAdjacentElement('afterend', hub);
        let underline = null;

        const render = () => {
            const counts = readCounts();
            const space = t(counts.kids ? COPY.spaceKids : COPY.spaceMain);
            const channels = plural(COPY.countChannels, counts.channels);
            const wordsText = plural(COPY.countWords, counts.keywords);
            const rules = counts.channels + counts.keywords;
            let big = counts.hidden;
            if (counts.allowOnly) {
                big = rules;
                title.textContent = t(COPY.allowedTitle, { space });
                detail.textContent = t(COPY.allowedDetail);
            } else if (counts.hidden > 0) {
                title.textContent = plural(COPY.todayHidden, counts.hidden);
                detail.textContent = t(COPY.todayDetail, { channels, words: wordsText, space });
            } else if (rules > 0) {
                big = rules;
                title.textContent = plural(COPY.todayRules, rules, { space });
                detail.textContent = t(COPY.rulesDetail, { channels, words: wordsText });
            } else {
                title.textContent = t(COPY.emptyTitle);
                detail.textContent = t(COPY.emptyDetail);
            }
            const shown = formatCount(big);
            if ((digits.dataset.pkRoll ?? digits.textContent) !== shown) {
                rollTo(digits, shown);
                if (!underline) underline = root.FilterTubeDoodles?.underline?.(number, { delay: 220 }) || null;
            }
            for (const entry of tiles) {
                const label = entry.nav.querySelector('.nav-label')?.textContent?.trim() || '';
                const summary = entry.nav.querySelector('.nav-summary')?.textContent?.trim() || '';
                entry.name.textContent = label;
                let value = null;
                if (entry.spec.count === 'rules') {
                    value = rules;
                    entry.sub.textContent = rules ? t(COPY.tileFilters, { channels, words: wordsText }) : t(COPY.noRules);
                    entry.badge.hidden = !counts.allowOnly;
                    entry.badge.textContent = t(COPY.allowedOnly);
                } else if (entry.spec.count === 'content') {
                    value = numberIn(summary)[0] ?? null;
                    entry.sub.textContent = t(COPY.contentStatus);
                } else if (entry.spec.count === 'kids') {
                    // The Kids numeral is its rule count, like Filters ("No rules yet" is 0).
                    value = numberIn(summary).reduce((sum, item) => sum + item, 0);
                    entry.sub.textContent = summary;
                } else {
                    entry.sub.textContent = summary;
                }
                // Study's tile always wears its sage (Android ControlsPaper); the others when they count something.
                const washed = entry.spec.area === 'study' || (value !== null && value > 0 && entry.spec.area !== 'neutral');
                entry.tile.classList.toggle('is-washed', washed);
                // The numeral shows 0 too (Android shows "0" on Filters and Kids Mode).
                rollTo(entry.count, value !== null ? formatCount(value) : '');
                entry.tile.setAttribute('aria-label', [label, entry.sub.textContent, entry.badge.hidden ? '' : entry.badge.textContent].filter(Boolean).join(', '));
            }
        };
        render();
        let queued = false;
        const queue = () => {
            if (queued) return;
            queued = true;
            root.requestAnimationFrame(() => { queued = false; render(); });
        };
        const watch = [doc.getElementById('sidebarNav'), view.querySelector('.ft-dash-stats'), doc.getElementById('ftTopBarListModeControlsTab'),
            doc.getElementById('dashboardStatsKidsBtn')].filter(Boolean);
        const observer = new root.MutationObserver(queue);
        for (const node of watch) observer.observe(node, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden'] });
        root.addEventListener('filtertube-ui-locale-changed', queue);
        // The grid rises once, as one block, the first time the hub opens (Animation plan 1.7).
        if (!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches && grid.animate) {
            grid.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
        }
    }

    // ---- The area of the open page ------------------------------------------------------------------

    function syncArea() {
        const active = doc.querySelector('#sidebarNav .nav-item[aria-current="page"]') || doc.querySelector('#sidebarNav .nav-item.active');
        const id = active?.dataset.navId || active?.dataset.tab || 'dashboard';
        doc.documentElement.dataset.pkArea = NAV_AREA[id] || 'neutral';
    }

    // ---- Content control status lines -------------------------------------------------------------

    function syncToggleStatus(scope) {
        const rows = (scope || doc).querySelectorAll('.content-control-group .toggle-row');
        for (const row of rows) {
            const input = row.querySelector(':scope > .switch input[type="checkbox"]');
            const info = row.querySelector(':scope > .toggle-info');
            if (!input || !info) continue;
            let line = info.querySelector(':scope > .pk-toggle-status');
            if (!line) {
                line = el('span', 'pk-toggle-status');
                line.setAttribute('aria-hidden', 'true');
                info.appendChild(line);
            }
            const on = input.checked;
            const text = t(on ? COPY.hidden : COPY.showing);
            if (line.textContent !== text) line.textContent = text;
            line.classList.toggle('is-on', on);
        }
    }

    // ---- Allowed rules circled while the allow list is on --------------------------------------------

    function syncAllowCircle() {
        const counts = readCounts();
        for (const tab of doc.querySelectorAll('.ft-rule-target-tab[data-rule-target="allow"]')) {
            const marked = tab.querySelector(':scope > .pk-doodle-mark--scribble');
            if (counts.allowOnly && !marked) {
                root.FilterTubeDoodles?.scribble?.(tab);
                if (tab.offsetParent) root.FilterTubeMascots?.playSound?.('scribble');
            } else if (!counts.allowOnly && marked) root.FilterTubeDoodles?.clear?.(tab);
        }
    }

    /**
     * Android NativeMainRuleFilterSheet (a5efd779d, 93cf50d53): on Keywords and Channels the search field
     * shares its row with one filter button (56 px square, 18 px corners, 22 px brand icon, 8 px gap) that
     * opens the same date ("Rule added") and sort controls, so the rule list starts higher. The controls
     * are moved, not copied, so their listeners and saved behaviour are unchanged. The button fills
     * brick-soft while a non-default sort, a date range or a source narrows the list.
     */
    function ruleOptionsNarrowed(panel) {
        const value = selector => panel.querySelector(selector)?.value || '';
        const sort = panel.querySelector('.sort-controls select:not(.channel-source-filter)');
        const preset = panel.querySelector('.date-range-controls select');
        const source = panel.querySelector('.channel-source-filter');
        return (sort && sort.value && sort.value !== 'newest')
            || (preset && preset.value && preset.value !== 'all')
            || !!value('.date-inputs input[type="date"]:first-of-type') || !!value('.date-inputs input[type="date"]:last-of-type')
            || !!(source && source.value && source.value !== 'all');
    }

    function syncRuleOptions() {
        let index = 0;
        for (const controls of doc.querySelectorAll('.filter-controls:not([data-pk-rule-options])')) {
            const search = controls.querySelector(':scope > .search-input');
            const sort = controls.querySelector(':scope > .sort-controls');
            const dates = controls.nextElementSibling?.classList?.contains('date-filter-controls') ? controls.nextElementSibling : null;
            if (!search || !sort) continue;
            controls.setAttribute('data-pk-rule-options', '');
            controls.classList.add('pk-rule-search-row');
            const panelId = `pkRuleOptions${search.id ? `-${search.id}` : `-${index += 1}`}`;
            const button = el('button', 'pk-rule-options-btn');
            button.type = 'button';
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-controls', panelId);
            // The crayon filter icon tinted brand brick (the app's iconTint), drawn through a mask.
            const icon = el('span', 'pk-rule-options-btn__icon');
            icon.setAttribute('aria-hidden', 'true');
            icon.style.setProperty('--pk-rule-icon', `url("${iconUrl('filtertube_filter')}")`);
            button.appendChild(icon);
            const label = () => {
                const words = t(COPY.ruleOptions);
                button.setAttribute('aria-label', words);
                button.title = words;
            };
            label();
            root.addEventListener('filtertube-ui-locale-changed', label);
            const panel = el('div', 'pk-rule-options');
            panel.id = panelId;
            panel.hidden = true;
            panel.setAttribute('role', 'group');
            panel.setAttribute('aria-label', t(COPY.ruleOptions));
            controls.after(panel);
            if (dates) panel.appendChild(dates);
            panel.appendChild(sort);
            controls.appendChild(button);
            const refresh = () => button.classList.toggle('is-active', !!ruleOptionsNarrowed(panel));
            const setOpen = open => {
                panel.hidden = !open;
                button.setAttribute('aria-expanded', open ? 'true' : 'false');
                button.classList.toggle('is-open', open);
            };
            button.addEventListener('click', () => setOpen(panel.hidden));
            panel.addEventListener('keydown', event => {
                if (event.key !== 'Escape') return;
                setOpen(false);
                button.focus();
            });
            // Values also change from code (Clear, a profile switch), so check after any change or click.
            for (const type of ['change', 'input', 'click']) panel.addEventListener(type, () => root.setTimeout(refresh, 0));
            refresh();
        }
    }

    function start() {
        if (!doc.getElementById('viewContainer')) return;
        doc.documentElement.classList.add('pk-parity');
        mountHub();
        syncArea();
        syncToggleStatus();
        syncAllowCircle();
        syncRuleOptions();
        const nav = doc.getElementById('sidebarNav');
        if (nav) new root.MutationObserver(syncArea).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-current'] });
        let queued = false;
        new root.MutationObserver(() => {
            if (queued) return;
            queued = true;
            root.setTimeout(() => { queued = false; syncToggleStatus(); syncAllowCircle(); syncRuleOptions(); }, 0);
        }).observe(doc.getElementById('viewContainer'), { subtree: true, childList: true });
        const pill = doc.getElementById('ftTopBarListModeControlsTab');
        if (pill) new root.MutationObserver(syncAllowCircle).observe(pill, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
        doc.addEventListener('change', event => {
            if (event.target?.closest?.('.content-control-group')) syncToggleStatus(event.target.closest('.content-control-group'));
        });
        root.addEventListener('filtertube-ui-locale-changed', () => syncToggleStatus());
    }

    root.FilterTubePaperParity = Object.freeze({ COPY, TILES, NAV_AREA, plural, numberIn, rollTo, syncRuleOptions, ruleOptionsNarrowed });
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => root.setTimeout(start, 0), { once: true });
    else root.setTimeout(start, 0);
})(typeof window !== 'undefined' ? window : globalThis);
