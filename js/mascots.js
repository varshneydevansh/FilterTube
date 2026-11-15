/* FilterTube's companions in the extension's own pages (docs: study-mode/mascots/BIBLE.md, "Extension").
 * Kriti and Uljhan are the only characters; doodles are accents, never characters.
 * - Popup: a still sparkle doodle beside the hidden counter; Kriti's sieve loop once at 100, 1,000 and
 *   10,000 hidden; Kriti with the upside-down sieve while the allow list (whitelist) is on.
 * - Options page: Kriti holding the logo on the first open after install; Kriti peeking over an empty
 *   keyword or channel list; Uljhan shrugging when a search finds nothing; Kriti's thumbs up after a
 *   backup import; Kriti waving over "Just you so far" in the profiles manager.
 * - Moments (moment()): one pose and one line for loading, empty, nothing-found and done states, with
 *   a slow breath (three cycles, then still) on Lively. Never on the player, a lock or a PIN screen.
 * - Sounds (Off by default; Gentle or Playful): never carry meaning on their own, and stay silent
 *   while the page is hidden.
 * - The Companion setting (Lively, Quiet, Off; Quiet by default) lives in chrome.storage.local beside the
 *   theme. Lively: lines appear in paper bubbles, including after events. Quiet: poses only; nothing pops
 *   up, a pose shows its line on hover, focus or click, and empty-list and welcome lines stay as plain
 *   captions. Off: no characters at all.
 * Motion is frame swaps plus transform and opacity. With reduced motion the last frame shows at once.
 * Copy comes from data/ui_locales; nothing names the video site.
 */
(function (root) {
    'use strict';
    if (!root || root.FilterTubeMascots) return;

    const COMPANION_KEY = 'ftCompanionMode';
    const MILESTONES_KEY = 'ftMascotMilestonesSeen';
    const WELCOME_KEY = 'ftMascotWelcomePending';
    const LAST_LIST_MODE_KEY = 'ftMascotLastListMode';
    const MODES = Object.freeze(['lively', 'quiet', 'off']);
    const DEFAULT_MODE = 'quiet';
    const MILESTONES = Object.freeze([100, 1000, 10000]);
    const SIEVE_FRAME_MS = 180;
    const SIEVE_LOOPS = 2;
    const SIEVE_FRAME_COUNT = 5;
    const BUBBLE_MAX_CHARS = 48;
    const EVENT_BUBBLE_MS = 5000;
    const ASSET_DIR = 'assets/images/mascots/';
    const ASSETS = Object.freeze({
        counterMark: '../doodles/sparkle.webp',
        kritiLogo: 'kriti_logo.webp',
        kritiAllow: 'kriti_allow_sieve.webp',
        kritiPeek: 'kriti_peek.webp',
        kritiThumbsUp: 'kriti_thumbsup.webp',
        kritiWave: 'kriti_wave.webp',
        kritiReading: 'kriti_reading.webp',
        uljhanShrug: 'uljhan_shrug.webp',
        sieve: Object.freeze([1, 2, 3, 4, 5].map(index => `kriti_sieve_0${index}.webp`))
    });

    const COPY = Object.freeze({
        welcome: ['mascot.welcome.line', "I'll keep what you block out of sight."],
        welcomeDismiss: ['mascot.welcome.dismiss', 'Got it'],
        hiddenCount: ['mascot.popup.hiddenCount', '{count} hidden so far'],
        milestone: ['mascot.popup.milestone', '{count} things kept out of your way.'],
        allowOnly: ['mascot.popup.allowOnly', 'Only allowed channels get through.'],
        emptyKeywords: ['mascot.options.emptyKeywords', 'Add a word to start filtering.'],
        emptyChannels: ['mascot.options.emptyChannels', 'Block a channel to hide it everywhere.'],
        imported: ['mascot.options.imported', 'Settings imported.'],
        noMatches: ['mascot.moment.noMatches', 'Nothing here. Try fewer words.'],
        loading: ['mascot.moment.loading', 'Sorting the good stuff…'],
        error: ['mascot.moment.error', 'That didn\'t load. Try again.']
    });

    // Sounds (aKriti sounds, assets/sounds): Off by default. Gentle plays the big moments only.
    const SOUNDS_KEY = 'ftUiSounds';
    const SOUND_MODES = Object.freeze(['off', 'gentle', 'playful']);
    const SOUND_FILES = Object.freeze({
        success: 'success.ogg', celebrate: 'celebrate.ogg', error: 'gentle_error.ogg',
        select: 'select.ogg', pop: 'soft_pop.ogg', page: 'paper_flip.ogg'
    });
    const GENTLE_SOUNDS = Object.freeze(['success', 'celebrate', 'error']);
    // Moment poses: one character and one line each (BIBLE.md moments map).
    const MOMENTS = Object.freeze({
        loading: Object.freeze({ image: 'kritiReading', copy: 'loading', character: 'Kriti' }),
        empty: Object.freeze({ image: 'kritiPeek', copy: null, character: 'Kriti' }),
        noMatches: Object.freeze({ image: 'uljhanShrug', copy: 'noMatches', character: 'Uljhan' }),
        error: Object.freeze({ image: 'uljhanShrug', copy: 'error', character: 'Uljhan' }),
        done: Object.freeze({ image: 'kritiThumbsUp', copy: null, character: 'Kriti' }),
        hello: Object.freeze({ image: 'kritiWave', copy: null, character: 'Kriti' })
    });

    // ---- Pure rules (unit-tested) ----------------------------------------------------------------

    function normalizeMode(value) {
        const mode = typeof value === 'string' ? value.trim().toLowerCase() : '';
        return MODES.includes(mode) ? mode : DEFAULT_MODE;
    }

    /** How a character line appears. kind: 'static' (welcome, empty lists) or 'event' (milestone, allow list, import). */
    function linePresentation(mode, kind) {
        const normalized = normalizeMode(mode);
        if (normalized === 'off') return 'none';
        if (normalized === 'lively') return 'bubble';
        return kind === 'static' ? 'caption' : 'on-demand';
    }

    function showsCharacters(mode) {
        return normalizeMode(mode) !== 'off';
    }

    function normalizeSeen(value) {
        const list = Array.isArray(value) ? value : [];
        return MILESTONES.filter(milestone => list.some(entry => Number(entry) === milestone));
    }

    /**
     * Which milestone to celebrate, once each. Every reached milestone is marked seen; when several were
     * crossed since the last look, only the highest plays. Off still marks them so they never arrive late.
     */
    function evaluateMilestone(total, seenValue, mode = DEFAULT_MODE) {
        const count = Math.max(0, Math.floor(Number(total) || 0));
        const seen = normalizeSeen(seenValue);
        const reached = MILESTONES.filter(milestone => count >= milestone);
        const fresh = reached.filter(milestone => !seen.includes(milestone));
        const nextSeen = MILESTONES.filter(milestone => seen.includes(milestone) || reached.includes(milestone));
        const celebrate = fresh.length && showsCharacters(mode) ? fresh[fresh.length - 1] : null;
        return { celebrate, seen: nextSeen, changed: nextSeen.length !== seen.length };
    }

    /** Lifetime hidden count: the sum of every surface's running total, with the legacy main entry as fallback. */
    function totalHidden(storage) {
        const data = storage && typeof storage === 'object' ? storage : {};
        const bySurface = data.statsBySurface && typeof data.statsBySurface === 'object' && !Array.isArray(data.statsBySurface)
            ? data.statsBySurface : {};
        let total = 0;
        let sawMain = false;
        for (const [surface, entry] of Object.entries(bySurface)) {
            if (!entry || typeof entry !== 'object') continue;
            if (surface === 'main') sawMain = true;
            total += Math.max(0, Number(entry.totalHiddenCount) || 0);
        }
        if (!sawMain && data.stats && typeof data.stats === 'object') {
            total += Math.max(0, Number(data.stats.totalHiddenCount) || 0);
        }
        return Math.floor(total);
    }

    /** Frame numbers (1-based) for the sieve loop; reduced motion jumps to the last frame. */
    function sieveFrames(reducedMotion) {
        if (reducedMotion) return [SIEVE_FRAME_COUNT];
        const frames = [];
        for (let loop = 0; loop < SIEVE_LOOPS; loop++) {
            for (let frame = 1; frame <= SIEVE_FRAME_COUNT; frame++) frames.push(frame);
        }
        return frames;
    }

    /** Whether the allow-list bubble should pop: only when the mode turned on since the popup last looked. */
    function allowListSwitchedOn(previous, current) {
        return current === 'whitelist' && previous !== 'whitelist' && previous !== undefined && previous !== null;
    }

    function clampLine(value) {
        const line = String(value || '').trim();
        return [...line].length > BUBBLE_MAX_CHARS ? [...line].slice(0, BUBBLE_MAX_CHARS - 1).join('') + '…' : line;
    }

    // ---- Environment helpers ---------------------------------------------------------------------

    function t(entry, values = {}) {
        const [key, fallback] = entry;
        try {
            const localized = root.FilterTubeUiLocalization?.text?.(key, values);
            if (typeof localized === 'string' && localized.trim()) return localized;
        } catch (e) {
        }
        return String(fallback).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }

    function locale() {
        return root.FilterTubeUiLocalization?.locale || root.navigator?.language || 'en';
    }

    function formatCount(value) {
        const count = Math.max(0, Math.floor(Number(value) || 0));
        try {
            return new Intl.NumberFormat(locale()).format(count);
        } catch (e) {
            return String(count);
        }
    }

    function api() {
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) return chrome;
        if (typeof browser !== 'undefined' && browser?.storage?.local) return browser;
        return null;
    }

    function storageGet(keys) {
        return new Promise(resolve => {
            const area = api()?.storage?.local;
            if (!area?.get) { resolve({}); return; }
            let settled = false;
            const finish = value => {
                if (settled) return;
                settled = true;
                resolve(value && typeof value === 'object' ? value : {});
            };
            try {
                const pending = area.get(keys, finish);
                if (pending && typeof pending.then === 'function') pending.then(finish, () => finish({}));
            } catch (e) {
                finish({});
            }
        });
    }

    function storageSet(items) {
        return new Promise(resolve => {
            const area = api()?.storage?.local;
            if (!area?.set) { resolve(false); return; }
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                resolve(true);
            };
            try {
                const pending = area.set(items, finish);
                if (pending && typeof pending.then === 'function') pending.then(finish, finish);
            } catch (e) {
                finish();
            }
        });
    }

    function assetUrl(name) {
        const path = `${ASSET_DIR}${name}`;
        try {
            const url = api()?.runtime?.getURL?.(path);
            if (url) return url;
        } catch (e) {
        }
        return `../${path}`;
    }

    function prefersReducedMotion() {
        try {
            return !!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        } catch (e) {
            return false;
        }
    }

    function el(tag, className, content) {
        const node = root.document.createElement(tag);
        if (className) node.className = className;
        if (content !== undefined && content !== null) node.textContent = String(content);
        return node;
    }

    function image(name, className, height) {
        const node = el('img', className);
        node.src = assetUrl(name);
        node.alt = '';
        node.setAttribute('aria-hidden', 'true');
        node.decoding = 'async';
        node.draggable = false;
        if (height) node.height = height;
        return node;
    }

    // ---- Shared state ----------------------------------------------------------------------------

    let companionMode = DEFAULT_MODE;
    let modeLoaded = false;
    const modeListeners = new Set();

    function onModeChange(listener) {
        modeListeners.add(listener);
        return () => modeListeners.delete(listener);
    }

    function applyMode(next) {
        const normalized = normalizeMode(next);
        const changed = normalized !== companionMode || !modeLoaded;
        companionMode = normalized;
        modeLoaded = true;
        if (root.document?.documentElement) root.document.documentElement.dataset.ftCompanion = normalized;
        if (changed) modeListeners.forEach(listener => { try { listener(normalized); } catch (e) { } });
    }

    let modeReady = null;

    /** Reads the stored Companion setting once per page; later changes arrive through storage.onChanged. */
    function loadMode() {
        if (!modeReady) {
            modeReady = storageGet([COMPANION_KEY]).then(stored => {
                applyMode(stored[COMPANION_KEY]);
                return companionMode;
            });
        }
        return modeReady;
    }

    async function setMode(value) {
        const normalized = normalizeMode(value);
        await storageSet({ [COMPANION_KEY]: normalized });
        applyMode(normalized);
        return normalized;
    }

    // ---- Speech line: a paper bubble, a caption, or a pose that speaks on demand ------------------

    /**
     * A character figure with its line. Returns { root, figure, picture, line, say(text, options), reveal(), hush() }.
     */
    function createCharacter({ className, imageName, height, kind, tail = 'left' }) {
        const wrap = el('div', `ft-mascot ${className || ''}`.trim());
        wrap.dataset.kind = kind;
        const presentation = linePresentation(companionMode, kind);
        // Event poses are buttons, so their line can be read again after it fades (and in Quiet, at all).
        const figure = kind === 'event' && presentation !== 'none' ? el('button', 'ft-mascot__figure') : el('span', 'ft-mascot__figure');
        if (figure.tagName === 'BUTTON') {
            figure.type = 'button';
            figure.setAttribute('aria-expanded', 'false');
        }
        const picture = image(imageName, 'ft-mascot__image', height);
        figure.appendChild(picture);
        const line = el('div', 'ft-mascot__line');
        line.dataset.tail = tail;
        line.hidden = true;
        wrap.append(figure, line);

        let hideTimer = 0;
        let pinned = false;
        let currentText = '';

        function reveal(text, { autoHideMs = 0 } = {}) {
            if (text) currentText = clampLine(text);
            if (!currentText) return;
            line.textContent = currentText;
            line.hidden = false;
            line.classList.remove('is-leaving');
            line.classList.add('is-visible');
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-expanded', 'true');
            root.clearTimeout(hideTimer);
            if (autoHideMs > 0) hideTimer = root.setTimeout(() => hush(), autoHideMs);
        }

        function hush() {
            root.clearTimeout(hideTimer);
            if (line.hidden) return;
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-expanded', 'false');
            line.classList.remove('is-visible');
            line.classList.add('is-leaving');
            const done = () => {
                if (line.classList.contains('is-leaving')) {
                    line.hidden = true;
                    line.classList.remove('is-leaving');
                }
            };
            if (prefersReducedMotion()) done();
            else root.setTimeout(done, 150);
        }

        /** Sets the line. Static lines show at once; event lines pop only in Lively. */
        function say(text, { event = false, autoHideMs = 0 } = {}) {
            currentText = clampLine(text);
            const mode = linePresentation(companionMode, kind);
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-label', currentText);
            line.classList.toggle('ft-mascot__line--bubble', mode === 'bubble');
            line.classList.toggle('ft-mascot__line--caption', mode === 'caption');
            line.classList.toggle('ft-mascot__line--popover', mode === 'on-demand');
            line.textContent = currentText;
            if ((mode === 'bubble' || mode === 'caption') && (event || kind === 'static')) {
                reveal(currentText, { autoHideMs: mode === 'bubble' ? autoHideMs : 0 });
            }
        }

        /** Swaps the words (a language change) without showing or hiding anything. */
        function retext(text) {
            currentText = clampLine(text);
            line.textContent = currentText;
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-label', currentText);
        }

        if (figure.tagName === 'BUTTON') {
            figure.addEventListener('click', () => {
                pinned = line.hidden || !pinned;
                if (pinned) reveal(); else hush();
            });
            figure.addEventListener('mouseenter', () => reveal());
            figure.addEventListener('mouseleave', () => { if (!pinned) hush(); });
            figure.addEventListener('focus', () => reveal());
            figure.addEventListener('blur', () => { pinned = false; hush(); });
            figure.addEventListener('keydown', event => {
                if (event.key === 'Escape') { pinned = false; hush(); }
            });
        }

        return { root: wrap, figure, picture, line, say, retext, reveal, hush };
    }

    function announce(host, text) {
        if (!host || !text || !showsCharacters(companionMode)) return;
        let region = host.querySelector?.('.ft-mascot-live');
        if (!region) {
            region = el('span', 'ft-mascot-live');
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            host.appendChild(region);
        }
        region.textContent = '';
        root.setTimeout(() => { region.textContent = text; }, 50);
    }

    // ---- Popup -----------------------------------------------------------------------------------

    function preload(names) {
        return Promise.all(names.map(name => new Promise(resolve => {
            const probe = new root.Image();
            probe.onload = probe.onerror = () => resolve();
            probe.src = assetUrl(name);
        })));
    }

    function readListMode(doc) {
        const pill = doc.querySelector('#ftTopBarListModeControlsPopup .ft-list-mode-pill');
        if (!pill) return null;
        return pill.classList.contains('toggle-variant-red') ? 'blocklist' : 'whitelist';
    }

    function mountPopup(doc) {
        const header = doc.querySelector('.ft-popup-header');
        if (!header || doc.getElementById('ftMascotTallyPopup')) return null;

        const tally = el('div', 'ft-mascot-tally');
        tally.id = 'ftMascotTallyPopup';
        const counter = el('p', 'ft-mascot-tally__counter');
        const bindu = image(ASSETS.counterMark, 'ft-mascot-tally__bindu', 20);
        const count = el('span', 'ft-mascot-tally__count');
        counter.append(bindu, count);
        const stage = el('div', 'ft-mascot-tally__stage');
        tally.append(counter, stage);
        header.insertAdjacentElement('afterend', tally);

        const state = {
            total: 0,
            seen: [],
            listMode: null,
            lastListMode: undefined,
            character: null,
            pose: null,
            frameTimer: 0
        };

        function stopFrames() {
            root.clearTimeout(state.frameTimer);
            state.frameTimer = 0;
        }

        function clearStage() {
            stopFrames();
            state.character = null;
            state.pose = null;
            stage.replaceChildren();
        }

        function renderCount() {
            count.textContent = t(COPY.hiddenCount, { count: formatCount(state.total) });
            bindu.hidden = !showsCharacters(companionMode);
        }

        function showCharacter(pose, imageName) {
            clearStage();
            if (!showsCharacters(companionMode)) return null;
            const character = createCharacter({ className: 'ft-mascot--popup', imageName, height: 48, kind: 'event', tail: 'up' });
            stage.appendChild(character.root);
            character.root.classList.add('is-entering');
            root.requestAnimationFrame?.(() => character.root.classList.remove('is-entering'));
            state.character = character;
            state.pose = pose;
            return character;
        }

        function playMilestone(milestone) {
            const character = showCharacter('milestone', ASSETS.sieve[0]);
            if (!character) return;
            const line = t(COPY.milestone, { count: formatCount(milestone) });
            const frames = sieveFrames(prefersReducedMotion());
            bindu.classList.remove('is-popping');
            void bindu.offsetWidth;
            if (!prefersReducedMotion()) bindu.classList.add('is-popping');
            let index = 0;
            const step = () => {
                character.picture.src = assetUrl(ASSETS.sieve[frames[index] - 1]);
                index += 1;
                if (index < frames.length) {
                    state.frameTimer = root.setTimeout(step, SIEVE_FRAME_MS);
                    return;
                }
                state.frameTimer = 0;
                character.root.classList.add('is-resting');
            };
            preload(ASSETS.sieve).then(() => {
                if (state.character !== character) return;
                step();
                character.say(line, { event: true, autoHideMs: EVENT_BUBBLE_MS });
                announce(tally, line);
            });
        }

        function showAllowList({ switched }) {
            if (state.pose === 'allow') return;
            const character = showCharacter('allow', ASSETS.kritiAllow);
            if (!character) return;
            const line = t(COPY.allowOnly);
            character.say(line, { event: switched, autoHideMs: EVENT_BUBBLE_MS });
            if (switched) announce(tally, line);
        }

        function syncListMode() {
            const mode = readListMode(doc);
            if (!mode) return;
            const previous = state.listMode === null ? state.lastListMode : state.listMode;
            state.listMode = mode;
            if (mode !== state.lastListMode) {
                state.lastListMode = mode;
                storageSet({ [LAST_LIST_MODE_KEY]: mode });
            }
            if (state.pose === 'milestone' && state.frameTimer) return;
            if (mode === 'whitelist') showAllowList({ switched: allowListSwitchedOn(previous, mode) });
            else if (state.pose === 'allow') clearStage();
        }

        function refreshPoses() {
            renderCount();
            const pose = state.pose;
            clearStage();
            if (pose === 'milestone' && showsCharacters(companionMode)) {
                const character = showCharacter('milestone', ASSETS.sieve[SIEVE_FRAME_COUNT - 1]);
                character?.root.classList.add('is-resting');
                character?.say(t(COPY.milestone, { count: formatCount(state.milestone || 0) }));
                return;
            }
            state.listMode = null;
            syncListMode();
        }

        async function start() {
            const stored = await storageGet(['stats', 'statsBySurface', MILESTONES_KEY, LAST_LIST_MODE_KEY]);
            await loadMode();
            state.total = totalHidden(stored);
            state.seen = normalizeSeen(stored[MILESTONES_KEY]);
            const lastMode = stored[LAST_LIST_MODE_KEY];
            state.lastListMode = lastMode === 'whitelist' || lastMode === 'blocklist' ? lastMode : undefined;
            renderCount();
            const verdict = evaluateMilestone(state.total, state.seen, companionMode);
            if (verdict.changed) {
                state.seen = verdict.seen;
                storageSet({ [MILESTONES_KEY]: verdict.seen });
            }
            if (verdict.celebrate) {
                state.milestone = verdict.celebrate;
                playMilestone(verdict.celebrate);
            }
            syncListMode();
        }

        const pillHost = doc.getElementById('ftTopBarListModeControlsPopup');
        if (pillHost && typeof root.MutationObserver === 'function') {
            new root.MutationObserver(() => syncListMode()).observe(pillHost, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }

        onModeChange(() => refreshPoses());
        root.addEventListener?.('filtertube-ui-locale-changed', () => {
            renderCount();
            if (state.pose === 'milestone') state.character?.retext(t(COPY.milestone, { count: formatCount(state.milestone || 0) }));
            if (state.pose === 'allow') state.character?.retext(t(COPY.allowOnly));
        });
        api()?.storage?.onChanged?.addListener?.((changes, area) => {
            if (area && area !== 'local') return;
            if (changes.stats || changes.statsBySurface) {
                storageGet(['stats', 'statsBySurface']).then(stored => {
                    state.total = totalHidden(stored);
                    renderCount();
                    const verdict = evaluateMilestone(state.total, state.seen, companionMode);
                    if (!verdict.changed) return;
                    state.seen = verdict.seen;
                    storageSet({ [MILESTONES_KEY]: verdict.seen });
                    if (verdict.celebrate) {
                        state.milestone = verdict.celebrate;
                        playMilestone(verdict.celebrate);
                    }
                });
            }
        });

        start();
        return { tally, refresh: refreshPoses };
    }

    // ---- Options page ----------------------------------------------------------------------------

    const decoratedEmptyLists = new Set();
    // RenderEngine's empty-list copy keys. Blocked lists get Kriti peeking, a search with no matches gets Uljhan; an allow list stays plain. A search with
    // no matches or an empty allow list needs different words.
    const EMPTY_LIST_KEYS = Object.freeze({
        'render.emptyKeywordsBlocked': 'keywords',
        'render.emptyChannelsBlocked': 'channels',
        'render.emptyKeywordsFound': 'search',
        'render.emptyChannelsFound': 'search'
    });

    /** Which list an empty-state node belongs to, read from RenderEngine's copy record; null otherwise. */
    function emptyListKind(node) {
        const record = node?.__ftRendererCopy?.textContent
            || node?.querySelector?.('.ft-mascot-empty__label')?.__ftRendererCopy?.textContent;
        return record && Object.prototype.hasOwnProperty.call(EMPTY_LIST_KEYS, record.key) ? EMPTY_LIST_KEYS[record.key] : null;
    }

    /** Puts Kriti (empty list) or Uljhan (no matches) on a keyword or channel list on the options page. */
    function decorateEmptyList(node, list, details = {}) {
        if (!node || !root.document || details.minimal) return;
        if (!root.document.getElementById('viewContainer')) return;
        if ([...decoratedEmptyLists].some(entry => entry.node === node)) return;
        decoratedEmptyLists.add({ node, list, details });
        drawEmptyList(node, list, details);
    }

    function scanEmptyLists(scope) {
        const nodes = scope?.matches?.('.empty-state-large') ? [scope] : [...(scope?.querySelectorAll?.('.empty-state-large') || [])];
        for (const node of nodes) {
            const list = emptyListKind(node);
            if (list) decorateEmptyList(node, list);
        }
    }

    /** RenderEngine redraws lists by replacing their children; watch for fresh empty states. */
    function watchEmptyLists(doc) {
        const container = doc.getElementById('viewContainer');
        if (!container) return;
        scanEmptyLists(container);
        if (typeof root.MutationObserver !== 'function') return;
        new root.MutationObserver(records => {
            for (const record of records) {
                for (const added of record.addedNodes) {
                    if (added.nodeType === 1 && !added.closest?.('.ft-mascot')) scanEmptyLists(added);
                }
            }
        }).observe(container, { childList: true, subtree: true });
    }

    function drawEmptyList(node, list, details) {
        // RenderEngine rewrites the node's textContent on a language change. Move its copy record onto a
        // child span first, so that refresh rewrites only the label and leaves the character in place.
        if (!node.querySelector?.('.ft-mascot-empty__label')) {
            const label = el('span', 'ft-mascot-empty__label', node.textContent);
            if (node.__ftRendererCopy) {
                label.__ftRendererCopy = node.__ftRendererCopy;
                delete node.__ftRendererCopy;
            }
            node.replaceChildren(label);
        }
        node.querySelector?.('.ft-mascot--empty')?.remove();
        node.classList.remove('ft-mascot-empty');
        if (!showsCharacters(companionMode)) return;
        if (list === 'search') {
            // Uljhan looks around when a search finds nothing (his face says it; the line is Kriti's tip).
            const character = createCharacter({ className: 'ft-mascot--empty ft-mascot--search', imageName: ASSETS.uljhanShrug, height: 88, kind: 'static', tail: 'up' });
            node.classList.add('ft-mascot-empty');
            node.insertBefore(character.root, node.firstChild);
            character.say(t(COPY.noMatches));
            breathe(character.root);
            return;
        }
        if (details.searching || details.mode === 'whitelist') return;
        const character = createCharacter({ className: 'ft-mascot--empty', imageName: ASSETS.kritiPeek, height: 112, kind: 'static', tail: 'up' });
        node.classList.add('ft-mascot-empty');
        node.insertBefore(character.root, node.firstChild);
        character.say(t(list === 'channels' ? COPY.emptyChannels : COPY.emptyKeywords));
        breathe(character.root);
    }

    function redrawEmptyLists() {
        for (const entry of [...decoratedEmptyLists]) {
            if (!entry.node.isConnected) {
                decoratedEmptyLists.delete(entry);
                continue;
            }
            drawEmptyList(entry.node, entry.list, entry.details);
        }
    }

    function mountWelcome(doc) {
        const container = doc.getElementById('viewContainer');
        if (!container) return;
        let card = null;
        const draw = async () => {
            const stored = await storageGet([WELCOME_KEY]);
            if (stored[WELCOME_KEY] !== true) {
                card?.remove();
                return;
            }
            // First open after install: show once, then clear the flag so it never returns.
            storageSet({ [WELCOME_KEY]: false });
            if (!showsCharacters(companionMode)) return;
            card = el('section', 'ft-mascot-welcome');
            card.setAttribute('aria-label', t(COPY.welcome));
            const character = createCharacter({ className: 'ft-mascot--welcome', imageName: ASSETS.kritiLogo, height: 160, kind: 'static', tail: 'left' });
            const dismiss = el('button', 'btn-secondary ft-mascot-welcome__dismiss', t(COPY.welcomeDismiss));
            dismiss.type = 'button';
            dismiss.addEventListener('click', () => {
                card.classList.add('is-leaving');
                const remove = () => card.remove();
                if (prefersReducedMotion()) remove();
                else root.setTimeout(remove, 150);
            });
            const body = el('div', 'ft-mascot-welcome__body');
            body.append(character.line, dismiss);
            card.append(character.root, body);
            container.insertBefore(card, container.firstChild);
            character.say(t(COPY.welcome));
            root.addEventListener?.('filtertube-ui-locale-changed', () => {
                character.retext(t(COPY.welcome));
                card.setAttribute('aria-label', t(COPY.welcome));
                dismiss.textContent = t(COPY.welcomeDismiss);
            });
            card.classList.add('is-entering');
            root.requestAnimationFrame?.(() => root.requestAnimationFrame?.(() => card.classList.remove('is-entering')));
        };
        draw();
    }

    let importMoment = null;

    /** Kriti gives a thumbs up beside the backup importer after a verified import. */
    function celebrateImport() {
        const doc = root.document;
        const button = doc?.getElementById('ftImportV3Btn');
        const item = button?.closest?.('.help-item') || button?.parentElement;
        if (!item) return;
        importMoment?.remove();
        importMoment = null;
        if (!showsCharacters(companionMode)) return;
        const character = createCharacter({ className: 'ft-mascot--stamp', imageName: ASSETS.kritiThumbsUp, height: 80, kind: 'event', tail: 'left' });
        const holder = el('div', 'ft-mascot-import');
        holder.appendChild(character.root);
        item.appendChild(holder);
        importMoment = holder;
        const line = t(COPY.imported);
        if (!prefersReducedMotion()) {
            character.root.classList.add('is-stamping');
            character.root.addEventListener('animationend', () => character.root.classList.remove('is-stamping'), { once: true });
        }
        character.say(line, { event: true });
        announce(holder, line);
        playSound('celebrate');
    }

    // ---- Idle life and moments -------------------------------------------------------------------

    /** A slow breath, three cycles then still (Lively only; never with reduced motion). */
    function breathe(node) {
        if (!node || companionMode !== 'lively' || prefersReducedMotion()) return;
        node.classList.add('pk-breathing');
        node.addEventListener('animationend', () => node.classList.remove('pk-breathing'), { once: true });
    }

    /**
     * One pose and one line for a state: loading, empty, noMatches, error, done or hello.
     * Returns null with the Companion set to Off, so the caller's words stand alone.
     */
    function moment(kind, { line = '', height = 96 } = {}) {
        const spec = MOMENTS[kind];
        if (!spec || !root.document || !showsCharacters(companionMode)) return null;
        const holder = el('div', `pk-moment pk-moment--${kind}`);
        holder.dataset.ftMoment = kind;
        const art = image(ASSETS[spec.image], 'pk-moment__art', height);
        art.style.setProperty('--pk-moment-size', `${height}px`);
        holder.appendChild(art);
        const text = line || (spec.copy ? t(COPY[spec.copy]) : '');
        if (text) holder.appendChild(el('p', 'pk-moment__line', clampLine(text)));
        if (!prefersReducedMotion()) {
            holder.classList.add('is-pop');
            if (companionMode === 'lively') art.addEventListener('animationend', () => {
                holder.classList.remove('is-pop');
                holder.classList.add('is-idle');
            }, { once: true });
        }
        return holder;
    }

    // ---- Sounds -----------------------------------------------------------------------------------

    let soundMode = 'off';
    const soundCache = new Map();

    function normalizeSoundMode(value) {
        const mode = typeof value === 'string' ? value.trim().toLowerCase() : '';
        return SOUND_MODES.includes(mode) ? mode : 'off';
    }

    /** Whether a sound plays in a mode: Off never, Gentle the big moments only, Playful all. Pure. */
    function soundAllowed(mode, name) {
        const normalized = normalizeSoundMode(mode);
        if (normalized === 'off' || !Object.prototype.hasOwnProperty.call(SOUND_FILES, name)) return false;
        return normalized === 'playful' || GENTLE_SOUNDS.includes(name);
    }

    function playSound(name) {
        if (!soundAllowed(soundMode, name)) return false;
        if (root.document?.visibilityState === 'hidden' || typeof root.Audio !== 'function') return false;
        try {
            let audio = soundCache.get(name);
            if (!audio) {
                const path = `assets/sounds/${SOUND_FILES[name]}`;
                const url = api()?.runtime?.getURL ? api().runtime.getURL(path) : `../${path}`;
                audio = new root.Audio(url);
                audio.volume = 0.45;
                soundCache.set(name, audio);
            }
            audio.currentTime = 0;
            const played = audio.play();
            played?.catch?.(() => {});
            return true;
        } catch (_) {
            return false;
        }
    }

    async function loadSoundMode() {
        const stored = await storageGet([SOUNDS_KEY]);
        soundMode = normalizeSoundMode(stored[SOUNDS_KEY]);
        return soundMode;
    }

    function mountSoundSetting(doc) {
        const select = doc.getElementById('ftUiSounds');
        if (!select) return;
        loadSoundMode().then(mode => { select.value = mode; });
        select.addEventListener('change', async () => {
            soundMode = normalizeSoundMode(select.value);
            await storageSet({ [SOUNDS_KEY]: soundMode });
            playSound('select') || playSound('success');
        });
    }

    function mountCompanionSetting(doc) {
        const select = doc.getElementById('ftCompanionMode');
        if (!select) return;
        select.value = companionMode;
        select.addEventListener('change', () => { setMode(select.value); });
        onModeChange(mode => { if (select.value !== mode) select.value = mode; });
    }

    function mountOptions(doc) {
        mountCompanionSetting(doc);
        mountSoundSetting(doc);
        mountWelcome(doc);
        watchEmptyLists(doc);
        onModeChange(() => redrawEmptyLists());
        root.addEventListener?.('filtertube-ui-locale-changed', () => redrawEmptyLists());
    }

    // ---- Boot ------------------------------------------------------------------------------------

    root.FilterTubeMascots = Object.freeze({
        COMPANION_KEY, MILESTONES_KEY, WELCOME_KEY, MODES, DEFAULT_MODE, MILESTONES,
        SIEVE_FRAME_MS, SIEVE_LOOPS, BUBBLE_MAX_CHARS, COPY, ASSETS,
        SOUNDS_KEY, SOUND_MODES, SOUND_FILES, MOMENTS,
        normalizeMode, linePresentation, showsCharacters, evaluateMilestone, totalHidden, sieveFrames,
        allowListSwitchedOn, clampLine, loadMode, setMode,
        normalizeSoundMode, soundAllowed, playSound, loadSoundMode, moment,
        get mode() { return companionMode; },
        emptyListKind, decorateEmptyList, celebrateImport, mountPopup
    });

    function autoMount() {
        const doc = root.document;
        if (!doc?.getElementById) return;
        api()?.storage?.onChanged?.addListener?.((changes, area) => {
            if ((!area || area === 'local') && changes[COMPANION_KEY]) applyMode(changes[COMPANION_KEY].newValue);
            if ((!area || area === 'local') && changes[SOUNDS_KEY]) soundMode = normalizeSoundMode(changes[SOUNDS_KEY].newValue);
        });
        loadSoundMode();
        loadMode().then(() => {
            if (doc.getElementById('viewContainer')) mountOptions(doc);
        });
        if (doc.getElementById('popupRoot')) {
            const tryPopup = () => mountPopup(doc);
            if (!tryPopup() && typeof root.MutationObserver === 'function') {
                const watcher = new root.MutationObserver(() => { if (tryPopup()) watcher.disconnect(); });
                watcher.observe(doc.getElementById('popupRoot'), { childList: true, subtree: true });
            }
        }
    }
    if (root.document) {
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', autoMount, { once: true });
        else autoMount();
    }
})(typeof window !== 'undefined' ? window : globalThis);
