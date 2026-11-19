/* Study mode in the extension's own pages (3.6.2, Phase 5), in the existing popup and dashboard style:
 * - the popup strip: phase, time left, pack, End with a 30-second cancel for self sessions, and
 *   "Locked until ..." for Locked and parent sessions;
 * - the options page study card: the dashboard (ring, today's plan bar, this week) and the setup and
 *   day planner (packs, days, start and end, the limit, rounds, breaks, music, Start now);
 * - the parent's plan for each protected profile, inside the Family command centre.
 * The background worker owns every rule (js/study_background.js); this file only shows state and
 * sends the FilterTube_Study* messages. Copy comes from data/ui_locales; nothing names the video site.
 */
(function (root) {
    'use strict';
    if (!root || root.FilterTubeStudyUi) return;

    const MINUTE = 60 * 1000;
    const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const STEP = 15;
    const MIN_STUDY = 30;

    function engine() { return root.FilterTubeStudyEngine || null; }
    function packsApi() { return root.FilterTubeStudyPacks || null; }
    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

    function t(key, fallback, values = {}) {
        try {
            const localized = root.FilterTubeUiLocalization?.text?.(key, values);
            if (typeof localized === 'string' && localized.trim()) return localized;
        } catch (e) {
        }
        return String(fallback).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }

    function language() {
        return text(root.FilterTubeUiLocalization?.locale) || text(root.navigator?.language) || 'en';
    }

    function runtime() {
        return (typeof chrome !== 'undefined' && chrome.runtime) ? chrome : (typeof browser !== 'undefined' ? browser : null);
    }

    function send(message) {
        return new Promise(resolve => {
            const api = runtime();
            if (!api?.runtime?.sendMessage) { resolve(null); return; }
            try {
                const pending = api.runtime.sendMessage(message, response => {
                    if (api.runtime.lastError) { resolve(null); return; }
                    resolve(response);
                });
                if (pending && typeof pending.then === 'function') pending.then(resolve, () => resolve(null));
            } catch (e) {
                resolve(null);
            }
        });
    }

    function el(tag, className, content) {
        const node = root.document.createElement(tag);
        if (className) node.className = className;
        if (content !== undefined && content !== null) node.textContent = String(content);
        return node;
    }

    function button(label, className, onClick) {
        const node = el('button', className || 'btn-secondary', label);
        node.type = 'button';
        if (onClick) node.addEventListener('click', onClick);
        return node;
    }

    function formatTime(ms) {
        try { return new Date(ms).toLocaleTimeString(language(), { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
    }

    function formatDayTime(ms) {
        try {
            const sameDay = new Date(ms).toDateString() === new Date().toDateString();
            if (sameDay) return formatTime(ms);
            return new Date(ms).toLocaleString(language(), { weekday: 'short', hour: 'numeric', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    function clockLabel(minutes) {
        const date = new Date(2026, 0, 5, 0, minutes);
        return formatTime(date.getTime());
    }

    function minuteOf(value) {
        const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text(value));
        return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    }

    function hhmm(minutes) {
        const value = ((Math.round(minutes) % 1440) + 1440) % 1440;
        return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
    }

    function localizedName(names, fallback) {
        const lang = language().toLowerCase().split(/[-_]/)[0];
        const value = object(names);
        return value[lang] || value.en || Object.values(value)[0] || fallback || '';
    }

    /** "GATE · CSE", or the pack's name. */
    function packLabel(pack) {
        if (!pack) return '';
        const base = text(pack.shortName) || localizedName(pack.names, pack.id);
        const variant = pack.variant ? localizedName(pack.variant.names, pack.variant.id) : '';
        return variant ? `${base} · ${variant}` : base;
    }

    function packsLabel(state) {
        return array(state?.packs).map(packLabel).filter(Boolean).join(', ');
    }

    /** The default parent profile name becomes "Set by a parent" (BUILD_PLAN decision). */
    function setByLabel(name) {
        const value = text(name);
        if (!value || value === 'Default' || value.toLowerCase() === 'default') return t('study.setByParent', 'Set by a parent');
        return t('study.setBy', 'Set by {name}', { name: value });
    }

    async function profileName(profileId) {
        if (!profileId) return '';
        try {
            const api = runtime();
            const stored = await new Promise(resolve => api.storage.local.get(['ftProfilesV4'], resolve));
            return text(object(object(stored?.ftProfilesV4?.profiles)[profileId]).name);
        } catch (e) {
            return '';
        }
    }

    /** {tone, word, line}: each state has a word as well as a colour. */
    function phaseInfo(state) {
        const value = object(state);
        const until = value.until ? formatTime(value.until) : '';
        const packs = packsLabel(value);
        if (value.clockHold) return { tone: 'hold', word: t('study.state.hold', 'On hold'), line: t('study.overlay.holdTitle', 'Study is on hold') };
        if (value.state === 'STUDY' && value.phase === 'rest') {
            return { tone: 'hold', word: t('study.state.locked', 'Locked'), line: t('study.overlay.unavailableTitle', 'Study pack unavailable') };
        }
        if (value.state === 'STUDY') {
            const end = value.sessionEnd ? formatTime(value.sessionEnd) : until;
            return { tone: 'focus', word: t('study.state.focus', 'Focus'), line: packs
                ? t('study.strip.studying', 'Studying {pack} until {time}', { pack: packs, time: end })
                : t('study.strip.studyingNoPack', 'Studying until {time}', { time: end }) };
        }
        if (value.state === 'BREAK') return { tone: 'break', word: t('study.state.break', 'Break'), line: t('study.strip.breakUntil', 'Break until {time}', { time: until }) };
        if (value.state === 'LIMIT') return { tone: 'done', word: t('study.state.done', 'Done'), line: t('study.overlay.limitTitle', 'Done for today') };
        return { tone: 'normal', word: t('study.state.off', 'Not studying'), line: t('study.strip.notStudying', 'No study session right now') };
    }

    function minutesLeft(state, at = Date.now()) {
        const until = Number(state?.until);
        return Number.isFinite(until) ? Math.max(0, Math.ceil((until - at) / MINUTE)) : null;
    }

    function openOptions() {
        const api = runtime();
        const url = api?.runtime?.getURL ? api.runtime.getURL('html/tab-view.html#study') : 'html/tab-view.html#study';
        try {
            const tabs = api?.tabs;
            if (tabs?.create) {
                const pending = tabs.create({ url });
                if (pending?.catch) pending.catch(() => {});
            } else {
                root.open(url, '_blank');
            }
        } catch (e) {
        }
    }

    // ---- The end-session control (Gentle: 30-second pause with Cancel) -------------------------

    function endControls(state, { onChange, compact = false } = {}) {
        const wrap = el('span', 'ft-study-end');
        const value = object(state);
        if (value.lockedUntil && (value.setByParentId || value.lockMode === 'locked')) {
            wrap.appendChild(el('span', 'ft-study-locked', t('study.lockedUntil', 'Locked until {time}', { time: formatDayTime(value.lockedUntil) })));
            return wrap;
        }
        if (!(value.state === 'STUDY' || value.state === 'BREAK') || value.endPolicy?.canEnd !== true) return wrap;
        if (Number.isFinite(value.endRequestedAt)) {
            const seconds = Math.max(0, Math.ceil((value.endRequestedAt + 30000 - Date.now()) / 1000));
            wrap.appendChild(el('span', 'ft-study-ending', t('study.endingIn', 'Ending in {seconds} s', { seconds })));
            wrap.appendChild(button(t('study.cancelEnd', 'Cancel'), compact ? 'ft-study-btn' : 'btn-secondary', async () => {
                await send({ action: 'FilterTube_StudyCancelEnd' });
                onChange?.();
            }));
            return wrap;
        }
        // The card says "End session" and the 30-second pause up front (Android ee59f65b4); the popup
        // strip keeps its short "End".
        wrap.appendChild(button(compact ? t('study.end', 'End') : t('study.endSession', 'End session'), compact ? 'ft-study-btn' : 'btn-secondary', async () => {
            await send({ action: 'FilterTube_StudyEndSession' });
            onChange?.();
        }));
        if (!compact) wrap.appendChild(el('span', 'ft-study-muted ft-study-end__hint', t('study.endHint', 'It ends after a 30-second pause, so you can still cancel.')));
        return wrap;
    }

    // ---- Popup strip --------------------------------------------------------------------------

    function renderStrip(host, state, { onChange, parentName = '' } = {}) {
        const value = object(state);
        const active = value.state && value.state !== 'NORMAL';
        host.hidden = !active;
        host.replaceChildren();
        if (!active) return;
        const info = phaseInfo(value);
        host.className = `ft-study-strip is-${info.tone}`;
        host.setAttribute('role', 'status');
        const copy = el('span', 'ft-study-strip__copy');
        const head = el('span', 'ft-study-strip__head');
        head.appendChild(el('span', 'ft-study-dot', ''));
        head.appendChild(el('strong', 'ft-study-strip__word', info.word));
        if (value.setByParentId) head.appendChild(el('span', 'ft-study-chip is-parent', setByLabel(parentName)));
        copy.appendChild(head);
        copy.appendChild(el('span', 'ft-study-strip__line', info.line));
        const left = minutesLeft(value);
        if ((value.state === 'STUDY' || value.state === 'BREAK') && left !== null && !value.clockHold) {
            copy.appendChild(el('span', 'ft-study-strip__meta', value.state === 'STUDY' && value.rounds
                ? t('study.strip.roundLeft', 'Round {round} of {rounds} · {minutes} min left', { round: value.round, rounds: value.rounds, minutes: left })
                : t('study.strip.minutesLeft', '{minutes} min left', { minutes: left })));
        }
        // The app's session strip (StudySessionViews): on a break, Skip break with what it costs; ending
        // lives on the Study page, so the strip has no End. A lock still says until when, and an end
        // already asked for keeps its countdown with Cancel.
        const actions = el('span', 'ft-study-strip__actions');
        if (value.lockedUntil && (value.setByParentId || value.lockMode === 'locked') || Number.isFinite(value.endRequestedAt)) {
            actions.appendChild(endControls(value, { onChange, compact: true }));
        }
        if (value.state === 'BREAK' && value.canSkipBreak && !value.breakSkipped) {
            const skip = button(t('study.overlay.skipBreak', 'Skip break'), 'ft-study-btn ft-study-btn--skip', async () => {
                skip.disabled = true;
                await send({ action: 'FilterTube_StudySkipBreak' });
                onChange?.();
            });
            if (value.skipPreview) {
                const cost = t('study.overlay.skipCost', '+{minutes} min to round {round}', { minutes: value.skipPreview.addedMinutes, round: value.skipPreview.round });
                skip.setAttribute('aria-label', `${t('study.overlay.skipBreak', 'Skip break')}, ${cost}`);
                skip.title = cost;
            }
            actions.appendChild(skip);
        }
        actions.appendChild(button(t('study.open', 'Open'), 'ft-study-btn', openOptions));
        host.append(copy, actions);
    }

    function mountStrip(host) {
        if (!host) return null;
        let state = null;
        let parentName = '';
        let time = null;
        let grantName = '';
        let askHost = null;
        let timer = 0;
        async function refresh() {
            const response = await send({ action: 'FilterTube_StudyGetState' });
            state = response && response.ok !== false ? response : null;
            const planParent = state?.setByParentId || text(object(state?.study?.plan).setByParentId) || text(object(state?.study?.lock).setByParentId);
            parentName = planParent ? await profileName(planParent) : '';
            time = state?.isChild ? await send({ action: 'FilterTube_AskParentTimeState' }) : null;
            grantName = state?.grantBy ? await profileName(state.grantBy) : '';
            draw();
            drawAsk(planParent);
        }
        /**
         * A child can't open the options page's Study card (it needs a parent's PIN), so the popup carries
         * "Ask for time" under the strip, and the minutes a parent gave while they run.
         */
        function drawAsk(planParent) {
            const managed = !!(state?.isChild && planParent && time?.isChild);
            if (!managed) { askHost?.remove(); askHost = null; return; }
            if (!askHost) {
                askHost = el('div', 'ft-study-ask-popup');
                host.insertAdjacentElement?.('afterend', askHost);
            }
            // Never redraw over a sheet the child is filling in.
            if (askHost.querySelector?.('.ft-study-ask__sheet')) return;
            const nodes = [];
            if (Number.isFinite(state.grantUntil)) {
                nodes.push(el('p', 'ft-study-ask__line is-given', t('study.ask.given', '{name} gave you {minutes} min · until {time}',
                    { name: grantName || text(time.parentName) || t('askParent.parentFallback', 'Your parent'), minutes: state.grantMinutes, time: formatTime(state.grantUntil) })));
            }
            // The sheet's own Send and Not now redraw it; the strip's timer never does.
            nodes.push(askForTime(time, () => { askHost?.replaceChildren(); return refresh(); }));
            // The child's study home in the app shows how search works; here it folds under the ask.
            const how = searchExplainerCard(state.study, null, true, state.searchHow);
            if (how) {
                const fold = el('details', 'ft-study-ask-popup__how');
                fold.appendChild(el('summary', '', t('study.searchHow.title', 'How search works while studying')));
                const body = how.children?.[1];
                if (body) fold.appendChild(body);
                nodes.push(fold);
            }
            askHost.replaceChildren(...nodes);
        }
        try { runtime()?.storage?.onChanged?.addListener((changes, area) => { if (area === 'local' && changes.ftAskParentV1) refresh(); }); } catch (e) { }
        function draw() {
            renderStrip(host, state, { onChange: refresh, parentName });
            clearTimeout(timer);
            const ending = Number.isFinite(state?.endRequestedAt);
            const until = Number(state?.validUntil);
            const next = ending ? 1000 : Math.min(30000, Number.isFinite(until) ? Math.max(1000, until - Date.now() + 500) : 30000);
            timer = setTimeout(() => (ending ? draw() : refresh()), next);
            if (ending && Date.now() > state.endRequestedAt + 31000) refresh();
        }
        root.addEventListener?.('filtertube-ui-locale-changed', draw);
        refresh();
        return { refresh };
    }

    // ---- The day planner (shared by the person's own plan and a parent's plan) ------------------

    /** The day's segments in minutes from midnight: normal, study, break, limit (BUILD_PLAN "Day planner"). */
    function planSegments(plan, focus, { from = 7 * 60, to = 22 * 60 } = {}) {
        const value = object(plan);
        const start = minuteOf(value.start);
        let end = minuteOf(value.end);
        const out = [];
        if (start === null || end === null) return [{ kind: 'normal', start: from, end: to }];
        if (end <= start) end += 1440;
        const first = Math.min(from, start);
        const limit = minuteOf(value.limit);
        const limitAt = limit === null ? null : Math.max(limit < start ? limit + 1440 : limit, end);
        const last = Math.max(to, end, limitAt === null ? 0 : Math.min(limitAt + 60, 1440 + 6 * 60));
        if (first < start) out.push({ kind: 'normal', start: first, end: start });
        const split = engine()?.splitRounds ? engine().splitRounds(start * MINUTE, end * MINUTE, focus) : [{ kind: 'STUDY', start: start * MINUTE, end: end * MINUTE }];
        for (const segment of split) out.push({ kind: segment.kind === 'BREAK' ? 'break' : 'study', start: segment.start / MINUTE, end: segment.end / MINUTE, round: segment.round });
        if (limitAt !== null) {
            if (limitAt > end) out.push({ kind: 'normal', start: end, end: limitAt });
            out.push({ kind: 'limit', start: limitAt, end: Math.max(limitAt, last) });
        } else if (end < last) {
            out.push({ kind: 'normal', start: end, end: last });
        }
        return out.filter(segment => segment.end > segment.start);
    }

    /** What the person sees during a segment, in plain words. */
    function segmentWords(segment, breakMode) {
        if (segment.kind === 'study') return t('study.planner.seeStudy', 'Only videos from the study plan.');
        if (segment.kind === 'break') {
            return breakMode === 'normal'
                ? t('study.planner.seeBreakNormal', 'Normal rules until the break ends.')
                : t('study.planner.seeBreakRest', 'A rest screen. Nothing plays.');
        }
        if (segment.kind === 'limit') return t('study.planner.seeLimit', 'Nothing plays until tomorrow.');
        return t('study.planner.seeNormal', 'Your normal rules.');
    }

    function segmentName(kind) {
        return {
            study: t('study.planner.study', 'Study'),
            break: t('study.state.break', 'Break'),
            limit: t('study.planner.limit', 'Limit reached'),
            normal: t('study.planner.normal', 'Normal rules')
        }[kind] || kind;
    }

    function segmented(options, current, onPick, label) {
        const group = el('div', 'ft-study-segmented');
        group.setAttribute('role', 'group');
        if (label) group.setAttribute('aria-label', label);
        for (const [value, name] of options) {
            const item = button(name, `ft-study-segmented__item${value === current ? ' is-on' : ''}`, () => onPick(value));
            item.setAttribute('aria-pressed', value === current ? 'true' : 'false');
            group.appendChild(item);
        }
        // Kept so mark() can find the pressed item.
        group.__values = options.map(([value]) => value);
        return group;
    }

    function currentSegment(plan, focus) {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const today = DAY_KEYS[(now.getDay() + 6) % 7];
        if (!array(plan.days).includes(today)) return { kind: 'normal' };
        return planSegments(plan, focus, { from: 0, to: 1440 }).find(segment => segment.start <= minutes && minutes < segment.end) || { kind: 'normal' };
    }

    function dayLabels() {
        const monday = new Date(2026, 10, 16);
        return DAY_KEYS.map((_, index) => {
            try { return new Date(monday.getTime() + index * 86400000).toLocaleDateString(language(), { weekday: 'short' }); } catch (e) { return DAY_KEYS[index]; }
        });
    }

    function field(label, control) {
        const row = el('div', 'ft-study-field');
        row.append(el('span', 'ft-study-field__label', label), control);
        return row;
    }

    function errorText(code) {
        const map = {
            set_by_parent: t('study.error.setByParent', 'A parent set this plan. Ask them to change it.'),
            set_by_other_parent: t('study.error.otherParent', 'Another parent set this plan.'),
            study_running: t('study.error.running', 'Can\'t change the plan while a lock is running.'),
            child_profile: t('study.error.setByParent', 'A parent set this plan. Ask them to change it.'),
            locked: t('study.error.locked', 'Locked until the session ends.'),
            no_active_pack: t('study.error.noPack', 'Choose a study pack first.'),
            already_studying: t('study.error.alreadyStudying', 'A study session is already running.'),
            session_already_active: t('study.error.alreadyStudying', 'A study session is already running.'),
            not_parent: t('study.error.notParent', 'Switch to the parent profile to change this plan.'),
            parent_unlock_required: t('study.parent.unlockBody', 'This profile is PIN-protected. Enter its PIN to continue.'),
            pin_wrong: t('study.switch.pinWrong', 'That PIN didn\'t work. Try again.'),
            pin_rate_limited: t('dashboard.toast.pinRateLimited', 'Too many incorrect PIN attempts. Try again later.'),
            cancelled: t('study.parent.unlockBody', 'This profile is PIN-protected. Enter its PIN to continue.'),
            invalid_duration: t('study.error.duration', 'Choose a shorter time.')
        };
        return map[code] || t('study.error.generic', 'That didn\'t save. Try again.');
    }

    /**
     * Android StudyLoosening (fcd8018b8, C41-C43): a change that would loosen study while it runs says why
     * instead of failing quietly. Gentle: "This would loosen your study rules" with End session;
     * self-Locked: "Locked until ..."; a parent's plan or lock: "Set by Mum until ...". Null for other
     * refusals.
     */
    function looseningSheet(error, state, parentName) {
        const value = object(state);
        const running = value.state === 'STUDY' || value.state === 'BREAK';
        const until = Number(value.lockedUntil || value.sessionEnd);
        const time = Number.isFinite(until) && until > 0 ? formatDayTime(until) : '';
        if (error === 'set_by_parent' && (running || value.setByParentId)) {
            const name = text(parentName) && text(parentName).toLowerCase() !== 'default' ? text(parentName) : t('study.loosen.aParent', 'a parent');
            return { title: time ? t('study.loosen.parentTitle', 'Set by {name} until {time}', { name, time }) : t('study.loosen.parentTitleNoTime', 'Set by {name} until study ends', { name }),
                body: t('study.loosen.parentBody', 'You can make your rules stricter, but not looser.') };
        }
        if (!running) return null;
        if (error === 'locked' || value.lockMode === 'locked') {
            return { title: time ? t('study.lockedUntil', 'Locked until {time}', { time }) : t('study.loosen.lockedTitleNoTime', 'Locked until study ends'),
                lockedUntil: time ? until : null,
                body: t('study.loosen.lockedBody', 'You can add to your block list, but you can\'t remove anything until then.') };
        }
        if (error === 'study_running') {
            return { title: t('study.loosen.title', 'This would loosen your study rules'),
                body: time ? t('study.loosen.body', 'End your session to change it, or change it after {time}.', { time }) : t('study.loosen.bodyNoTime', 'End your session to change it, or change it after study.'),
                endSession: value.endPolicy?.canEnd === true, keep: true };
        }
        return null;
    }

    /** Where a message lands: the card it belongs to, or the page's study card when a redraw replaced it. */
    function messageHolder(host) {
        const holder = host?.closest?.('.ft-study-card, .ft-study-parent') || host;
        if (holder && holder.isConnected === false) return root.document?.getElementById?.('ftStudyCard') || holder;
        return holder;
    }

    function showLoosening(host, sheet) {
        const holder = messageHolder(host);
        if (!holder) return;
        holder.querySelector?.(':scope > .ft-study-loosen')?.remove();
        const card = el('div', 'ft-study-loosen');
        card.setAttribute('role', 'alertdialog');
        // A Locked refusal: Kriti holds the "Locked until <time>" sign above the words (Android
        // StudyLooseningSheet, a still). Only where the companions load; Companion Off: words only.
        const sign = sheet.lockedUntil ? root.FilterTubeMascots?.lockedSign?.(sheet.lockedUntil, { height: 132, className: 'ft-study-loosen__sign' }) : null;
        if (sign) card.appendChild(sign);
        card.append(el('strong', 'ft-study-loosen__title', sheet.title), el('p', 'ft-study-muted', sheet.body));
        const actions = el('div', 'ft-study-actions');
        if (sheet.endSession) actions.appendChild(button(t('study.endSession', 'End session'), 'btn-secondary', async () => { card.remove(); await send({ action: 'FilterTube_StudyEndSession' }); }));
        actions.appendChild(button(sheet.keep ? t('study.loosen.keep', 'Keep studying') : t('study.loosen.gotIt', 'Got it'), 'btn-primary', () => card.remove()));
        card.appendChild(actions);
        holder.appendChild(card);
        try { actions.lastChild.focus(); } catch (e) { }
    }

    /**
     * A refusal from the background (FilterTube_StudyLooseningRefused, or a reply with error
     * 'study_loosening'): {sheet: 'gentle'|'locked'|'parent', endsAt, parentName, lockMode}. Shows the
     * app's loosening sheet over whichever page made the change (Android StudyLooseningSheet.post),
     * once per burst of refused saves.
     */
    let lastLooseningAt = 0;
    function showLooseningNotice(notice, host) {
        const value = object(notice);
        const errors = { gentle: 'study_running', locked: 'locked', parent: 'set_by_parent' };
        const error = errors[value.sheet];
        if (!error) return false;
        const at = Date.now();
        if (at - lastLooseningAt < 1500) return true;
        lastLooseningAt = at;
        const state = { state: 'STUDY', sessionEnd: Number(value.endsAt) || null, lockMode: value.lockMode || null,
            setByParentId: value.sheet === 'parent' ? 'parent' : null, endPolicy: { canEnd: value.sheet === 'gentle' } };
        const sheet = looseningSheet(error, state, value.parentName);
        if (!sheet) return false;
        const doc = root.document;
        let holder = host || null;
        if (!holder && doc?.body) {
            holder = doc.querySelector('.ft-study-loosen-float');
            if (!holder) {
                holder = doc.createElement('div');
                holder.className = 'ft-study-loosen-float';
                doc.body.appendChild(holder);
            }
        }
        if (!holder) return false;
        showLoosening(holder, sheet);
        return true;
    }

    /** A short message with an optional Undo: the app's paper toast with its brick drain (PaperKit). */
    function notify(host, message, undo) {
        const kit = root.UIComponents;
        if (kit?.showUndoBar) {
            kit.showUndoBar({ message, actionLabel: t('study.undo', 'Undo'), onUndo: undo ? async () => { await undo(); return true; } : null, holdMs: 5000 });
            return;
        }
        const holder = messageHolder(host);
        if (!holder) return;
        holder.querySelector?.(':scope > .ft-study-toast')?.remove();
        const toast = el('div', 'ft-study-toast');
        toast.setAttribute('role', 'status');
        toast.appendChild(el('span', '', message));
        if (undo) {
            toast.appendChild(button(t('study.undo', 'Undo'), 'ft-study-btn', async () => { toast.remove(); await undo(); }));
        }
        holder.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    // ---- Pack picker: Exams | School ----------------------------------------------------------

    /**
     * Android StudySetupViews' country card accent on the row that lists a country's packs: three short
     * wavy crayon dashes in the country's colours (22 px each, 5 px apart, 10 px tall, 3.2 px crayon),
     * the motif doodle (22 px, turned -8°) when there is one, and a 6 % wash of the mark on the row's
     * paper. Countries without an entry keep Study's sage and plain paper. Decoration only: hidden from
     * assistive technology, and brick stays the only action colour.
     */
    function applyCountryAccent(row, accent, Packs) {
        if (!row || !accent) return;
        const css = Packs.cssColor;
        for (const night of [false, true]) {
            const theme = night ? 'dark' : 'light';
            row.style.setProperty(`--ft-accent-wash-${theme}`, css(accent.wash(night)));
            row.style.setProperty(`--ft-accent-mark-${theme}`, css(accent.mark(night)));
            accent.stripes(night).forEach((color, index) => row.style.setProperty(`--ft-accent-${index + 1}-${theme}`, css(color)));
        }
        row.classList.add('ft-study-accent');
        if (!accent.isDefault) row.classList.add('is-country');
        row.dataset.country = accent.code || '';
        const ns = 'http://www.w3.org/2000/svg';
        const DASHES = 3, DASH = 22, GAP = 5, HEIGHT = 10, STROKE = 3.2;
        const width = DASH * DASHES + GAP * (DASHES - 1) + 8;
        const strip = el('div', 'ft-study-accent__strip');
        strip.setAttribute('aria-hidden', 'true');
        const svg = root.document.createElementNS(ns, 'svg');
        svg.setAttribute('class', 'ft-study-accent__stripe');
        svg.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`);
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(HEIGHT));
        const count = Math.max(1, accent.stripes(false).length);
        const cy = HEIGHT / 2;
        const amp = HEIGHT / 5;
        let x = STROKE;
        for (let i = 0; i < DASHES; i += 1) {
            // A one- or two-colour palette repeats, so a single green reads as a stroke, not a stray mark.
            const path = root.document.createElementNS(ns, 'path');
            const start = cy + (i % 2 === 0 ? amp / 2 : -amp / 2);
            const control = cy + (i % 2 === 0 ? -amp : amp);
            path.setAttribute('d', `M${x.toFixed(1)} ${start} Q${(x + DASH / 2).toFixed(1)} ${control} ${(x + DASH).toFixed(1)} ${cy}`);
            path.setAttribute('class', `ft-study-accent__dash is-${(i % count) + 1}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-width', String(STROKE));
            path.setAttribute('stroke-linecap', 'round');
            svg.appendChild(path);
            x += DASH + GAP;
        }
        strip.appendChild(svg);
        if (accent.motif) {
            const motif = el('img', 'ft-study-accent__motif');
            const api = runtime();
            const file = `assets/images/doodles/${accent.motif}.webp`;
            motif.src = api?.runtime?.getURL ? api.runtime.getURL(file) : `../${file}`;
            motif.alt = '';
            strip.appendChild(motif);
        }
        row.prepend(strip);
    }

    // ---- Study setup, step by step (Android StudySetupActivity, StudySetupViews, StudyAddChannelSheet) --

    function setupApi() { return root.FilterTubeStudySetup || null; }

    /** A still of Kriti or Uljhan when the Companion shows characters; null otherwise (and decorative). */
    function companionArt(name, className, height) {
        const Mascots = root.FilterTubeMascots;
        if (!Mascots || !Mascots.showsCharacters?.(Mascots.mode)) return null;
        const file = Mascots.stillImage?.(name);
        if (!file) return null;
        const img = el('img', className);
        const api = runtime();
        img.src = api?.runtime?.getURL ? api.runtime.getURL(`assets/images/mascots/${file}`) : `../assets/images/mascots/${file}`;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        if (height) img.style.height = `${height}px`;
        return img;
    }

    function doodleArt(name, className) {
        const img = el('img', className || 'ft-setup-doodle');
        const api = runtime();
        const file = `assets/images/doodles/${name}.webp`;
        img.src = api?.runtime?.getURL ? api.runtime.getURL(file) : `../${file}`;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        return img;
    }

    function countryName(code) {
        if (!code) return t('study.setup.anywhere', 'Anywhere');
        try { return new Intl.DisplayNames([language()], { type: 'region' }).of(code) || code; } catch (e) { return code; }
    }

    /** "UPSC", "UPSC + 1" (Android StudyPackLabels). */
    function packsShortLabel(ids, catalog) {
        const Packs = packsApi();
        const names = ids.map(id => Packs?.packById(catalog, id)).filter(Boolean).map(pack => Packs.packName(pack, language()));
        if (!names.length) return '';
        const short = name => {
            const plain = name.split(' (')[0].trim() || name.trim();
            const words = plain.split(/\s+/);
            return words.length >= 3 && /^[A-Z][A-Z0-9-]{1,}$/.test(words[0]) && !/^\d/.test(words[1]) && words[1].toLowerCase() !== 'class' ? words[0] : plain;
        };
        return names.length === 1 ? short(names[0]) : `${short(names[0])} + ${names.length - 1}`;
    }

    /** "24 channels · English, Hindi" (Android StudySetupText.meta). */
    function packMeta(pack) {
        let names = '';
        try {
            const display = new Intl.DisplayNames([language()], { type: 'language' });
            names = array(pack.languages).slice(0, 3).map(code => { const name = display.of(code) || code; return name.charAt(0).toUpperCase() + name.slice(1); }).join(', ');
        } catch (e) { }
        if (array(pack.languages).length > 3) names += ` +${pack.languages.length - 3}`;
        const count = plural('study.setup.nChannels', array(pack.channels).length, '{count} channel', '{count} channels');
        return names ? `${count} · ${names}` : count;
    }

    /** "Data structures, Algorithms, Operating systems and 10 more" (5 named). */
    function topicLine(topics) {
        const Engine = engine();
        const label = topic => (Engine?.topicLabel ? Engine.topicLabel(topic, language()) : topic);
        const named = topics.slice(0, 5).map(label).join(', ');
        const rest = topics.length - 5;
        return rest > 0 ? pluralWith('study.setup.andMore', rest, { names: named }, '{names} and {count} more') : named;
    }

    function pluralWith(key, count, values, fallback) {
        let category = count === 1 ? 'one' : 'other';
        try { category = new Intl.PluralRules(language()).select(count); } catch (e) { }
        return t(`${key}.${category}`, fallback, { ...values, count });
    }

    function setupChip(label, on, onClick, { quiet = false, square = false, description = '' } = {}) {
        const chip = button(label, `ft-setup-chip${on ? ' is-on' : ''}${quiet ? ' is-quiet' : ''}${square ? ' is-square' : ''}`, onClick);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (description) chip.setAttribute('aria-label', description);
        return chip;
    }

    function channelAvatar(row, size = 40) {
        const box = el('span', 'ft-setup-avatar');
        box.style.width = box.style.height = `${size}px`;
        box.setAttribute('aria-hidden', 'true');
        const letter = (Array.from(text(row.name)).find(ch => /[\p{L}\p{N}]/u.test(ch)) || '•').toUpperCase();
        box.appendChild(el('span', 'ft-setup-avatar__initial', letter));
        loadChannelAvatar(box, row);
        return box;
    }

    /**
     * Android StudyChannelAvatars: pack channels carry no picture, so each one is looked up once in the
     * background (FilterTube_PackChannelAvatar) and its picture address is remembered on this device.
     * Until then, and offline, the row keeps the channel's first letter in a soft circle.
     */
    const avatarRequests = new Map();
    function loadChannelAvatar(box, row) {
        const key = text(row.channelId) || text(row.handle).replace(/^@/, '').toLowerCase();
        if (!key) return;
        let pending = avatarRequests.get(key);
        if (!pending) {
            pending = send({ action: 'FilterTube_PackChannelAvatar', channelId: row.channelId || null, handle: row.handle || null })
                .then(response => text(response?.logo));
            avatarRequests.set(key, pending);
        }
        pending.then(url => {
            if (!/^https:\/\//.test(url)) { avatarRequests.delete(key); return; }
            const img = el('img', 'ft-setup-avatar__img');
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('load', () => box.classList.add('has-picture'), { once: true });
            img.addEventListener('error', () => img.remove(), { once: true });
            img.src = url;
            box.appendChild(img);
        });
    }

    /**
     * The setup, opened from the study card (or a parent's plan for a child). It takes over the card
     * until it closes: what for, the list, a stream, review, ready. options: {study, catalog, isSelf,
     * profileId, onPatch(patch) -> Promise<{ok}>, onStart(minutes, lock), onClose()}.
     */
    function openSetup(anchor, options) {
        const Setup = setupApi();
        const Packs = packsApi();
        const catalog = options.catalog;
        if (!Setup || !Packs || !catalog) return null;
        const holder = anchor?.closest?.('#ftStudyDashboard, .ft-study-parent__body') || anchor?.parentElement;
        if (!holder) return null;
        const study = object(options.study);
        const isSelf = options.isSelf !== false;
        const deviceCountry = Packs.countryFromLocale(root.navigator?.language || '') || Packs.countryFromLocale(language()) || null;
        const start = Setup.reopenAt(array(study.activePackIds), catalog, deviceCountry);
        const s = {
            step: start.step, mode: start.mode, country: start.country, query: '', alsoOpen: false, board: null,
            selected: array(study.activePackIds).filter(id => Packs.packById(catalog, id)),
            edits: clone(object(study.packEdits)) || {},
            opened: {}, showAll: new Set(), keptOwn: {}, grade: {}, lockMode: 'gentle', direction: 0, addFor: null
        };
        // The card's own styles set display, so the hidden attribute alone wouldn't hide it.
        const hidden = Array.from(holder.children).map(node => [node, node.style.display]);
        hidden.forEach(([node]) => { node.style.display = 'none'; });
        holder.dataset.ftStudySetupOpen = 'true';
        const panel = el('section', 'ft-setup');
        panel.setAttribute('aria-label', t('study.setup.title', 'Set up study'));
        holder.appendChild(panel);

        const packs = () => s.selected.map(id => Packs.packById(catalog, id)).filter(Boolean);
        const needsStream = () => Setup.StudySetupPath.needsStream(packs());
        const close = () => {
            panel.remove();
            delete holder.dataset.ftStudySetupOpen;
            hidden.forEach(([node, display]) => { node.style.display = display; });
            options.onClose?.();
        };
        const go = (next, forward = true) => {
            if (!next) { close(); return; }
            s.direction = forward ? 1 : -1;
            s.step = next;
            s.addFor = null;
            render();
            try { panel.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { }
        };
        const back = () => go(Setup.StudySetupPath.back(s.step, needsStream()), false);
        const goNext = () => go(Setup.StudySetupPath.next(s.step, needsStream()));
        const toggle = id => { s.selected = s.selected.includes(id) ? s.selected.filter(item => item !== id) : [...s.selected, id]; render(); };
        const chipLabel = pack => Setup.StudyExamList.chipLabel(pack, language());

        function title() {
            if (s.step === 'kind') return t('study.setup.title', 'Set up study');
            if (s.step === 'list') {
                if (s.mode === 'exam') return s.country ? t('study.setup.examsIn', 'Exams in {country}', { country: countryName(s.country) }) : t('study.setup.examsTitle', 'Exams');
                if (s.mode === 'school') return t('study.setup.kindSchool', 'School');
                return s.mode === 'interview' ? t('study.setup.kindInterview', 'A job interview') : t('study.setup.kindSkill', 'Learn a skill');
            }
            if (s.step === 'stream') {
                const list = packs().filter(pack => array(pack.variants).length && pack.kind !== 'class');
                return list.length === 1 ? chipLabel(list[0]) : t('study.setup.branch', 'Branch');
            }
            if (s.step === 'review') {
                const label = Setup.planLabel(packs(), s.edits, language());
                return label ? t('study.setup.reviewPlan', 'Your {plan} plan', { plan: label }) : t('study.setup.reviewPlanMany', 'Your plan');
            }
            return t('study.setup.readyTitle', 'What changes');
        }

        function header() {
            const head = el('div', 'ft-setup__head');
            const backButton = button('', 'ft-setup__back', back);
            backButton.setAttribute('aria-label', t('askParent.back', 'Back'));
            backButton.appendChild(el('span', '', '←')).setAttribute('aria-hidden', 'true');
            const heading = el('h4', 'ft-setup__title', title());
            const path = Setup.StudySetupPath.of(needsStream());
            const index = Math.max(0, path.indexOf(s.step));
            const dots = el('span', 'ft-setup__dots');
            dots.setAttribute('role', 'img');
            dots.setAttribute('aria-label', t('study.setup.step', 'Step {step} of {steps}', { step: index + 1, steps: path.length }));
            path.forEach((_, i) => dots.appendChild(el('span', `ft-setup__dot${i === index ? ' is-on' : i < index ? ' is-done' : ''}`)));
            head.append(backButton, heading, dots);
            return head;
        }

        function bar(label, action, onClick, enabled = true) {
            const node = el('div', 'ft-setup__bar');
            if (label) node.appendChild(el('span', 'ft-setup__bar-label', label));
            const go = button(action, 'btn-primary ft-setup__bar-action', onClick);
            go.disabled = !enabled;
            node.appendChild(go);
            if (!label) node.classList.add('is-wide');
            return node;
        }

        function render() {
            const body = el('div', `ft-setup__body${s.direction > 0 ? ' is-forward' : s.direction < 0 ? ' is-back' : ''}`);
            panel.dataset.step = s.step;
            const country = s.country;
            if (Packs.countryAccent) panel.dataset.country = country || '';
            const parts = { kind: renderKind, list: s.mode === 'exam' ? renderExams : s.mode === 'school' ? renderSchool : s.mode === 'interview' ? renderInterviews : renderSkills,
                stream: renderStream, review: renderReview, ready: renderReady }[s.step];
            const tail = parts(body);
            panel.replaceChildren(header(), body);
            if (tail) panel.appendChild(tail);
            s.direction = 0;
        }

        /** "Where are you studying?": the browser's region first, Anywhere, then every country with packs, A to Z. */
        function openCountrySheet() {
            root.document.querySelector('body > .ft-sheet-scrim')?.remove();
            const scrim = el('div', 'ft-sheet-scrim');
            const sheet = el('section', 'ft-sheet');
            sheet.setAttribute('role', 'dialog');
            sheet.setAttribute('aria-modal', 'true');
            sheet.setAttribute('aria-label', t('study.setup.countryTitle', 'Where are you studying?'));
            const close = () => { scrim.remove(); root.document.removeEventListener('keydown', onKey, true); try { panel.querySelector('.ft-setup-country__change')?.focus(); } catch (e) { } };
            const onKey = event => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
            root.document.addEventListener('keydown', onKey, true);
            scrim.addEventListener('click', event => { if (event.target === scrim) close(); });
            const head = el('div', 'ft-sheet__head');
            head.appendChild(el('h4', 'ft-sheet__title', t('study.setup.countryTitle', 'Where are you studying?')));
            const shut = button('', 'ft-sheet__close', close);
            shut.appendChild(icon('close'));
            shut.setAttribute('aria-label', t('study.end.done', 'Done'));
            head.appendChild(shut);
            const search = el('input', 'text-input ft-sheet__search');
            search.type = 'search';
            search.placeholder = t('study.setup.countrySearch', 'Search countries');
            search.setAttribute('aria-label', search.placeholder);
            const list = el('div', 'ft-sheet__list');
            list.setAttribute('role', 'listbox');
            const codes = Setup.countries(catalog).sort((x, y) => countryName(x).localeCompare(countryName(y), language()));
            const fill = () => {
                const words = text(search.value).toLowerCase();
                const first = [...new Set([deviceCountry, s.country].filter(Boolean))];
                const ordered = [...first, null, ...codes.filter(code => !first.includes(code))];
                list.replaceChildren();
                for (const code of ordered) {
                    const name = countryName(code);
                    if (words && !name.toLowerCase().includes(words) && (code || '').toLowerCase() !== words) continue;
                    const note = code && code === deviceCountry ? t('study.setup.countryDetected', 'Your browser\'s language')
                        : code === null ? t('study.setup.countryAnywhereBody', 'Only exams and lessons taken anywhere') : '';
                    const current = (code || null) === (s.country || null);
                    const row = button('', `ft-sheet__row${current ? ' is-current' : ''}`, () => {
                        close();
                        if ((code || null) !== (s.country || null)) { s.country = code || null; s.board = null; s.alsoOpen = false; render(); }
                    });
                    row.setAttribute('role', 'option');
                    row.setAttribute('aria-selected', current ? 'true' : 'false');
                    const label = el('span', 'ft-sheet__row-words');
                    label.appendChild(el('span', 'ft-sheet__row-name', name));
                    if (note) label.appendChild(el('span', 'ft-study-muted', note));
                    row.appendChild(label);
                    if (current) row.appendChild(icon('check'));
                    list.appendChild(row);
                }
            };
            search.addEventListener('input', fill);
            fill();
            sheet.append(head, search, list);
            scrim.appendChild(sheet);
            // On the page's body, above the sidebar and any transformed card (a fixed layer inside one is clipped).
            (root.document.body || panel).appendChild(scrim);
            try { search.focus(); } catch (e) { }
        }

        // ---- Step 1: what for
        function renderKind(body) {
            // The country card (StudySetupKit.countryCard): where, the country, where it came from, and
            // Change, which opens "Where are you studying?" (StudyCountrySheet).
            const card = el('div', 'ft-setup-country');
            const words = el('div', 'ft-setup-country__words');
            words.append(el('span', 'ft-study-muted', t('study.setup.where', 'You\'re studying in')), el('strong', '', countryName(s.country)));
            if (s.country && s.country === deviceCountry) words.appendChild(el('span', 'ft-study-muted ft-setup-country__note', t('study.setup.whereDetected', 'Picked from your browser\'s language')));
            const change = button(t('study.setup.change', 'Change'), 'ft-link-button ft-setup-country__change', () => openCountrySheet());
            change.setAttribute('aria-haspopup', 'dialog');
            if (Packs.countryAccent) applyCountryAccent(card, Packs.countryAccent(s.country), Packs);
            card.append(words, change);
            body.appendChild(card);

            const question = el('div', 'ft-setup-question');
            const qwords = el('div', 'ft-setup-question__words');
            qwords.append(el('h3', 'ft-setup-h1', t('study.setup.question', 'What are you studying for?')),
                doodleArt('underline_wavy', 'ft-setup-squiggle'),
                el('p', 'ft-study-muted', t('study.setup.questionBody', 'We\'ll pick channels and topics that fit. You can change any of them.')));
            question.appendChild(qwords);
            const kriti = companionArt('kritiPointing', 'ft-setup-mascot', 124);
            if (kriti) question.appendChild(kriti);
            body.appendChild(question);

            const own = Setup.StudyExamList.of(catalog, s.country, '', Setup.MIN_CHANNELS).own.flatMap(section => section.packs);
            const examLine = !s.country || !own.length ? t('study.setup.kindExamAnywhere', 'Exams people take anywhere, like IELTS and GRE')
                : t('study.setup.kindExamples', '{names} and more', { names: [...new Set([...own].sort((a, b) => (a.shortName ? 0 : 1) - (b.shortName ? 0 : 1))
                    .map(chipLabel).filter(label => label.length <= 12))].slice(0, 5).join(', ') });
            const boards = Setup.StudySchool.boards(catalog, s.country, Setup.MIN_CHANNELS);
            const schoolLine = !boards.length ? t('study.setup.kindSchoolNone', 'Lessons that fit any curriculum')
                : t('study.setup.kindExamples', '{names} and more', { names: boards.map(board => board.label).filter(label => label.length <= 16).slice(0, 3).join(', ') || boards[0].label });
            // The Interview tile shows only when the catalog has interview packs (Android StudySetupActivity).
            const hasInterviews = Setup.StudyInterviews.of(catalog, Setup.MIN_CHANNELS).length > 0;
            const tiles = el('div', 'ft-setup-tiles');
            for (const [mode, name, line, doodle] of [
                ['exam', t('study.setup.kindExam', 'An exam'), examLine, 'seal'],
                ['school', t('study.setup.kindSchool', 'School'), schoolLine, 'note'],
                ['skill', t('study.setup.kindSkill', 'Learn a skill'), t('study.setup.kindSkillBody', 'Maths, science and open lectures. Add your own channels too.'), 'crayon'],
                ['interview', t('study.setup.kindInterview', 'A job interview'),
                    t('study.setup.kindInterviewBody', 'Coding, system design, finance, HR and more. Add your own channels too.'), 'clip']
            ].filter(([mode]) => mode !== 'interview' || hasInterviews)) {
                const tile = button('', `ft-setup-tile is-${mode}`, () => {
                    if (s.mode !== mode) { s.query = ''; s.alsoOpen = false; }
                    s.mode = mode;
                    go('list');
                });
                const copy = el('span', 'ft-setup-tile__copy');
                copy.append(el('strong', 'ft-setup-tile__name', name), el('span', 'ft-setup-tile__line', line));
                const chevron = icon('chevron');
                chevron.classList.add('ft-setup-tile__chevron');
                tile.append(copy, doodleArt(doodle, 'ft-setup-tile__doodle'), chevron);
                tiles.appendChild(tile);
            }
            body.appendChild(tiles);
            if (isSelf) body.appendChild(el('p', 'ft-study-muted ft-setup-center', t('study.setup.familyNote', 'Setting this up for your child? Use Family instead.')));
            return null;
        }

        function listBar() {
            if (!s.selected.length) return null;
            return bar(packsShortLabel(s.selected, catalog), t('study.setup.next', 'Next'), goNext);
        }

        // ---- Step 2a: exams
        function renderExams(body) {
            const model = Setup.StudyExamList.of(catalog, s.country, '', Setup.MIN_CHANNELS);
            const example = model.own.flatMap(section => section.packs).find(pack => pack.shortName);
            const search = el('input', 'text-input ft-setup-search');
            search.type = 'search';
            search.value = s.query;
            search.placeholder = t('study.setup.examsSearch', 'Search exams, like {example}', { example: example ? chipLabel(example) : 'IELTS' });
            search.setAttribute('aria-label', search.placeholder);
            const host = el('div', 'ft-setup-list');
            search.addEventListener('input', () => { s.query = search.value; drawExamList(host); });
            body.append(search, host);
            drawExamList(host);
            return listBar();
        }

        function drawExamList(host) {
            const model = Setup.StudyExamList.of(catalog, s.country, s.query, Setup.MIN_CHANNELS);
            host.replaceChildren();
            if (model.isEmpty) { host.appendChild(el('p', 'ft-study-muted ft-setup-center', t('study.setup.empty', 'Nothing matches. Try another country or word.'))); return; }
            const section = (name, list, { withCountry = false, quiet = false } = {}) => {
                host.appendChild(el('p', 'ft-setup-section', name));
                const flow = el('div', 'ft-setup-flow');
                for (const pack of list) {
                    let label = chipLabel(pack);
                    if (withCountry && array(pack.countries).length) label = `${label} (${countryName(pack.countries[0])})`;
                    flow.appendChild(setupChip(label, s.selected.includes(pack.id), () => {
                        const keep = host.closest('.ft-setup')?.querySelector('.ft-setup-search');
                        toggle(pack.id);
                        keep?.focus?.();
                    }, { quiet, description: `${Packs.packName(pack, language())}. ${packMeta(pack)}` }));
                }
                host.appendChild(flow);
            };
            const fieldName = field => t(`study.setup.field.${field}`, field);
            model.own.forEach(group => section(fieldName(group.field), group.packs));
            const searching = !!text(s.query);
            if (model.also.length) {
                // A chosen exam is never hidden inside the fold.
                const open = s.alsoOpen || searching || model.alsoPacks.some(pack => s.selected.includes(pack.id));
                const names = model.alsoPacks.slice(0, 3).map(chipLabel).join(', ');
                const line = model.alsoPacks.length > 3 ? pluralWith('study.setup.andMore', model.alsoPacks.length - 3, { names }, '{names} and {count} more') : names;
                const fold = button('', `ft-setup-fold${open ? ' is-open' : ''}`, () => { if (!searching) { s.alsoOpen = !s.alsoOpen; drawExamList(host); } });
                fold.setAttribute('aria-expanded', open ? 'true' : 'false');
                const words = el('span', 'ft-setup-fold__words');
                words.appendChild(el('span', 'ft-setup-fold__title', t('study.setup.examsAlso', 'Also taken from {country}', { country: countryName(s.country) })));
                if (!open) words.appendChild(el('span', 'ft-study-muted', line));
                fold.append(words, el('span', 'ft-setup-fold__chevron', '⌄'));
                host.appendChild(el('hr', 'ft-setup-dashed'));
                host.appendChild(fold);
                if (open) model.also.forEach(group => section(fieldName(group.field), group.packs, { quiet: true }));
            }
            if (model.elsewhere.length) section(t('study.setup.examsElsewhere', 'From other countries'), model.elsewhere, { withCountry: true, quiet: true });
            // The bar follows the choice without redrawing the list.
            const panelBar = panel.querySelector(':scope > .ft-setup__bar');
            const nextBar = listBar();
            if (panelBar && nextBar) panelBar.replaceWith(nextBar);
            else if (panelBar) panelBar.remove();
            else if (nextBar && panel.contains(host)) panel.appendChild(nextBar);
        }

        // ---- Step 2b: school
        function chooseVariant(pack, variantId) {
            const current = object(s.edits[pack.id]);
            if (Setup.variant(pack, current.variant)?.id === variantId && current.variant) return;
            // A new stream brings its own channels and topics; earlier switches start over.
            s.edits[pack.id] = { ...current, variant: variantId, channelsRemoved: [], topicsRemoved: [] };
            render();
        }

        function renderSchool(body) {
            const boards = Setup.StudySchool.boards(catalog, s.country, Setup.MIN_CHANNELS);
            const globals = Setup.StudySchool.globals(catalog, Setup.MIN_CHANNELS);
            if (!boards.length) {
                body.append(el('h3', 'ft-setup-h1', t('study.setup.schoolNoneTitle', 'No school packs for {country} yet', { country: countryName(s.country) })),
                    el('p', 'ft-study-muted', t('study.setup.schoolNoneBody', 'These work with any curriculum. You can also add your own channels.')),
                    button(t('study.setup.schoolCheckExams', 'Check exams'), 'btn-secondary', () => { s.mode = 'exam'; s.query = ''; go('list'); }));
                addGlobals(body, globals);
                return s.selected.length ? bar(null, t('study.setup.nextChannels', 'Next: check channels'), goNext) : null;
            }
            const located = Setup.StudySchool.locate(boards, s.selected);
            const current = boards.find(board => board.key === s.board) || located?.board || boards[0];
            s.board = current.key;
            let grade = located && located.board.key === current.key ? located.grade : null;
            if (grade) {
                // The class picked last time, when it's in the same band (Class 12 rather than the band's first).
                const saved = s.grade[grade.packId];
                grade = current.grades.find(item => item.key === saved && item.packId === grade.packId) || grade;
            }
            const head = el('div', 'ft-setup-question');
            head.appendChild(el('h3', 'ft-setup-h1', t('study.setup.schoolQuestion', 'Which board and class?')));
            const kriti = companionArt('kritiNotebook', 'ft-setup-mascot', 108);
            if (kriti) head.appendChild(kriti);
            body.appendChild(head);
            body.appendChild(el('p', 'ft-setup-h2', t('study.setup.schoolBoard', 'Board')));
            const boardFlow = el('div', 'ft-setup-flow');
            boards.forEach(board => boardFlow.appendChild(setupChip(board.label, board.key === current.key, () => { if (s.board !== board.key) { s.board = board.key; render(); } })));
            body.appendChild(boardFlow);
            body.appendChild(el('p', 'ft-setup-h2', t('study.setup.schoolClass', 'Class')));
            const classFlow = el('div', 'ft-setup-flow');
            for (const item of current.grades) {
                const label = item.form ? t('study.setup.schoolFormN', 'Form {number}', { number: item.number }) : item.number;
                const spoken = item.form ? label : t('study.setup.schoolClassN', 'Class {number}', { number: item.number });
                classFlow.appendChild(setupChip(label, grade?.key === item.key && grade?.packId === item.packId, () => {
                    // A class picks its pack: this country's other school packs drop out; global ones stay.
                    const own = new Set(boards.flatMap(board => board.packIds));
                    s.selected = [...s.selected.filter(id => !own.has(id) || id === item.packId)];
                    if (!s.selected.includes(item.packId)) s.selected.push(item.packId);
                    s.grade[item.packId] = item.key;
                    render();
                }, { square: !item.form, description: spoken }));
            }
            body.appendChild(classFlow);
            const pack = grade ? Packs.packById(catalog, grade.packId) : null;
            if (!pack) {
                body.appendChild(el('p', 'ft-study-muted', t('study.setup.schoolPickClass', 'Pick your class to see its channels.')));
            } else {
                const variants = array(pack.variants);
                if (variants.length && (Number(grade.number) || 0) >= 11) {
                    const card = el('div', 'ft-setup-paper');
                    card.appendChild(el('p', 'ft-setup-h2', t('study.setup.branch', 'Branch')));
                    card.appendChild(el('p', 'ft-study-muted', t('study.setup.schoolStreamBody', 'Pick the one you\'re in.')));
                    const chosen = Setup.variant(pack, object(s.edits[pack.id]).variant);
                    const flow = el('div', 'ft-setup-flow');
                    variants.forEach(item => flow.appendChild(setupChip(Setup.variantName(item, language()), item.id === chosen?.id, () => chooseVariant(pack, item.id))));
                    card.appendChild(flow);
                    body.appendChild(card);
                }
                const chosen = variants.length ? Setup.variant(pack, object(s.edits[pack.id]).variant) : null;
                const who = [current.label, grade.form ? null : t('study.setup.schoolClassN', 'Class {number}', { number: grade.number }),
                    chosen ? Setup.variantName(chosen, language()) : null].filter(Boolean).join(', ');
                const chips = array(chosen?.chips).length ? chosen.chips : array(pack.chips).length ? pack.chips : array(pack.subjects);
                body.appendChild(el('p', 'ft-study-muted', t('study.setup.covers', '{who} covers {topics}.', { who, topics: topicLine(chips) })));
            }
            addGlobals(body, globals);
            body.appendChild(el('p', 'ft-study-muted', t('study.setup.schoolOtherCountry', 'Studying another country\'s board? Change the country first.')));
            return s.selected.length ? bar(null, t('study.setup.nextChannels', 'Next: check channels'), goNext) : null;
        }

        function addGlobals(body, globals) {
            if (!globals.length) return;
            body.appendChild(el('p', 'ft-setup-h2', t('study.setup.schoolEvery', 'For every curriculum')));
            body.appendChild(el('p', 'ft-study-muted', t('study.setup.schoolEveryBody', 'Add these to any class, or pick them on their own.')));
            const flow = el('div', 'ft-setup-flow');
            globals.forEach(pack => flow.appendChild(setupChip(chipLabel(pack).replace(/ for any curriculum$/, ''), s.selected.includes(pack.id), () => toggle(pack.id),
                { description: `${Packs.packName(pack, language())}. ${packMeta(pack)}` })));
            body.appendChild(flow);
        }

        // ---- Step 2c: a skill
        function skillDoodle(pack) {
            const words = new Set(Setup.StudyExamFields.words(pack.id));
            // Interview packs (Android skillDoodle: bridge, gear, atom, coins, bolt, peak, leaf), in the doodles we have.
            if (words.has('system')) return 'scribble_circle';
            if (words.has('devops') || words.has('cloud')) return 'cloud';
            if (words.has('data')) return 'sparkle';
            if (words.has('finance')) return 'stamp';
            if (words.has('product')) return 'star';
            if (words.has('consulting')) return 'magnifier';
            if (words.has('hr')) return 'heart';
            if (words.has('coding')) return 'note';
            if (words.has('maths')) return 'crayon';
            if (words.has('science')) return 'sparkle';
            if (words.has('university')) return 'star';
            if (words.has('crashcourse')) return 'cloud';
            return 'bubble';
        }

        function pickRow(pack) {
            const chosen = s.selected.includes(pack.id);
            const row = button('', `ft-setup-pick${chosen ? ' is-on' : ''}`, () => toggle(pack.id));
            row.setAttribute('role', 'checkbox');
            row.setAttribute('aria-checked', chosen ? 'true' : 'false');
            const name = Packs.packName(pack, language());
            const words = el('span', 'ft-setup-pick__words');
            words.append(el('strong', 'ft-setup-pick__name', name.split(' (')[0] || name), el('span', 'ft-study-muted', packMeta(pack)));
            row.append(doodleArt(skillDoodle(pack), 'ft-setup-pick__doodle'), words, el('span', 'ft-setup-pick__check', chosen ? '✓' : ''));
            row.setAttribute('aria-label', `${name}. ${packMeta(pack)}`);
            return row;
        }

        function renderSkills(body) {
            body.append(el('h3', 'ft-setup-h1', t('study.setup.skillQuestion', 'What do you want to learn?')),
                el('p', 'ft-study-muted', t('study.setup.skillBody', 'Pick one or more. You can add your own channels next.')));
            const list = el('div', 'ft-setup-picks');
            Setup.StudySkills.of(catalog, Setup.MIN_CHANNELS).forEach(pack => list.appendChild(pickRow(pack)));
            // Kids learning by age: these packs fill the Kids space during study.
            const kids = Packs.forTab(catalog, '', 'kids');
            if (kids.length) {
                list.appendChild(el('p', 'ft-setup-h2', t('study.setup.skillKidsHeading', 'Kids learning')));
                kids.forEach(pack => list.appendChild(pickRow(pack)));
            }
            body.appendChild(list);
            return listBar();
        }

        // ---- Step 2d: a job interview
        function renderInterviews(body) {
            body.append(el('h3', 'ft-setup-h1', t('study.setup.interviewQuestion', 'Which interview are you preparing for?')),
                el('p', 'ft-study-muted', t('study.setup.skillBody', 'Pick one or more. You can add your own channels next.')));
            const list = el('div', 'ft-setup-picks');
            Setup.StudyInterviews.of(catalog, Setup.MIN_CHANNELS).forEach(pack => list.appendChild(pickRow(pack)));
            body.appendChild(list);
            return listBar();
        }

        // ---- Step 3: stream
        function renderStream(body) {
            const list = packs().filter(pack => array(pack.variants).length && pack.kind !== 'class');
            const head = el('div', 'ft-setup-question');
            const words = el('div', 'ft-setup-question__words');
            words.append(el('h3', 'ft-setup-h1', t('study.setup.streamQuestion', 'Which one are you taking?')),
                el('p', 'ft-study-muted', t('study.setup.streamBody', 'Each one gets its own channels. Shared ones come along.')));
            head.appendChild(words);
            const kriti = companionArt('kritiThinking', 'ft-setup-mascot', 116);
            if (kriti) head.appendChild(kriti);
            body.appendChild(head);
            for (const pack of list) {
                const chosen = Setup.variant(pack, object(s.edits[pack.id]).variant);
                if (list.length > 1) body.appendChild(el('p', 'ft-setup-h2', chipLabel(pack)));
                const grid = el('div', 'ft-setup-streams');
                for (const item of pack.variants) {
                    const on = item.id === chosen?.id;
                    const tile = button('', `ft-setup-stream${on ? ' is-on' : ''}`, () => chooseVariant(pack, item.id));
                    tile.setAttribute('aria-pressed', on ? 'true' : 'false');
                    tile.append(el('strong', '', Setup.variantName(item, language())), el('span', 'ft-study-muted', array(item.chips).slice(0, 2).join(', ')));
                    grid.appendChild(tile);
                }
                body.appendChild(grid);
                if (chosen) {
                    const topics = [...new Map([...array(chosen.chips), ...array(chosen.keywords)].map(topic => [Setup.topicKey(topic), topic])).values()];
                    const card = el('div', 'ft-setup-paper');
                    card.appendChild(el('p', '', t('study.setup.covers', '{who} covers {topics}.', { who: Setup.variantName(chosen, language()), topics: topicLine(topics) })));
                    body.appendChild(card);
                }
            }
            return bar(null, t('study.setup.nextChannels', 'Next: check channels'), goNext);
        }

        // ---- Step 4: review
        function groupTitle(pack, kind) {
            if (kind === 'stream') return t('study.setup.groupStream', 'For {stream}', { stream: Setup.variantName(Setup.variant(pack, object(s.edits[pack.id]).variant), language()) });
            if (kind === 'shared') return pack.kind === 'class'
                ? t('study.setup.groupSharedClass', 'Everyone in {exam}', { exam: chipLabel(pack) })
                : t('study.setup.groupShared', 'Everyone taking {exam}', { exam: chipLabel(pack) });
            return t('study.setup.groupOwn', 'Your own');
        }

        function countsLabel() {
            const [channels, topics] = Setup.StudyReviewGroups.counts(packs(), s.edits);
            if (channels + topics === 0) return [t('study.setup.keepOne', 'Keep at least one channel or topic so Home has something to show.'), false];
            return [t('study.setup.reviewCounts', '{channels} · {topics}', {
                channels: plural('study.setup.nChannels', channels, '{count} channel', '{count} channels'),
                topics: plural('study.setup.nTopics', topics, '{count} topic', '{count} topics')
            }), true];
        }

        function updateReviewBar() {
            const node = panel.querySelector(':scope > .ft-setup__bar');
            if (!node) return;
            const [label, any] = countsLabel();
            node.querySelector('.ft-setup__bar-label').textContent = label;
            node.querySelector('.ft-setup__bar-action').disabled = !any;
        }

        function channelRow(pack, row) {
            const node = button('', `ft-setup-row${row.on ? ' is-on' : ''}`, () => {
                const on = !row.on;
                const ref = { channelId: row.channelId, handle: row.handle, name: row.name };
                if (row.own && !on) (s.keptOwn[pack.id] = s.keptOwn[pack.id] || []).push(ref);
                s.edits[pack.id] = Setup.StudyReviewGroups.setChannel(s.edits[pack.id], row, on);
                if (row.own && on) s.keptOwn[pack.id] = array(s.keptOwn[pack.id]).filter(item => Setup.refKey(item) !== Setup.refKey(ref));
                row.on = on;
                node.classList.toggle('is-on', on);
                node.setAttribute('aria-checked', on ? 'true' : 'false');
                updateReviewBar();
            });
            node.setAttribute('role', 'switch');
            node.setAttribute('aria-checked', row.on ? 'true' : 'false');
            node.setAttribute('aria-label', [row.name, row.displayHandle].filter(Boolean).join(', '));
            const words = el('span', 'ft-setup-row__words');
            words.appendChild(el('span', 'ft-setup-row__name', row.name));
            if (row.displayHandle) words.appendChild(el('span', 'ft-study-muted ft-setup-row__handle', row.displayHandle));
            node.append(channelAvatar(row), words, el('span', 'ft-setup-switch'));
            return node;
        }

        function addChannelGroups(host, pack) {
            const groups = Setup.StudyReviewGroups.channels(pack, s.edits[pack.id], array(s.keptOwn[pack.id]));
            const firstOpen = groups.find(group => group.kind !== 'own')?.kind;
            groups.forEach((group, index) => {
                const key = `${pack.id}:${group.kind}`;
                // An empty "Your own" has nothing to fold: the Add row below says what lands there.
                if (group.kind === 'own' && !group.rows.length) return;
                const open = s.opened[key] ?? (group.kind === firstOpen);
                if (index > 0) host.appendChild(el('hr', 'ft-setup-dashed'));
                const head = button('', `ft-setup-group${open ? ' is-open' : ''}`, () => { s.opened[key] = !open; render(); });
                head.setAttribute('aria-expanded', open ? 'true' : 'false');
                const words = el('span', 'ft-setup-group__words');
                words.append(el('strong', '', groupTitle(pack, group.kind)), el('span', 'ft-study-muted', plural('study.setup.nOn', group.onCount, '{count} on', '{count} on')));
                head.appendChild(words);
                // A folded group shows who's in it: the first three channels that are on.
                if (!open && group.onCount) {
                    const stack = el('span', 'ft-setup-stack');
                    group.rows.filter(row => row.on).slice(0, 3).forEach(row => stack.appendChild(channelAvatar(row, 28)));
                    head.appendChild(stack);
                }
                head.appendChild(el('span', 'ft-setup-fold__chevron', '⌄'));
                host.appendChild(head);
                if (!open) return;
                const all = s.showAll.has(key);
                const folds = Setup.StudyReviewGroups.folds(group.rows.length);
                const visible = all || !folds ? group.rows : group.rows.slice(0, Setup.ROWS_FOLDED);
                visible.forEach(row => host.appendChild(channelRow(pack, row)));
                if (folds) {
                    const more = group.rows.length - Setup.ROWS_FOLDED;
                    host.appendChild(button(all ? t('study.setup.showLess', 'Show fewer') : plural('study.setup.showMore', more, 'Show {count} more', 'Show {count} more'),
                        'ft-setup-text-button', () => { if (all) s.showAll.delete(key); else s.showAll.add(key); render(); }));
                }
            });
            const add = button('', 'ft-setup-add', () => { s.addFor = pack.id; render(); });
            const words = el('span', 'ft-setup-row__words');
            words.append(el('strong', '', t('study.setup.addChannel', 'Add a channel')), el('span', 'ft-study-muted', t('study.setup.addChannelLine', 'Search by name or paste a link')));
            add.append(el('span', 'ft-setup-add__plus', '+'), words);
            host.appendChild(add);
            if (s.addFor === pack.id) host.appendChild(addChannelSheet(pack));
        }

        function addTopicGroups(host, pack, named) {
            if (named) host.appendChild(el('p', 'ft-setup-h2', chipLabel(pack)));
            for (const group of Setup.StudyReviewGroups.topics(pack, s.edits[pack.id])) {
                host.appendChild(el('p', 'ft-setup-section', groupTitle(pack, group.kind)));
                const key = `${pack.id}:topics:${group.kind}`;
                const all = s.showAll.has(key);
                const flow = el('div', 'ft-setup-flow is-soft');
                const visible = all ? group.topics.slice(0, Setup.MAX_TOPICS) : group.topics.slice(0, Setup.TOPICS_FOLDED);
                for (const item of visible) {
                    const label = engine()?.topicLabel ? engine().topicLabel(item.topic, language()) : item.topic;
                    const chip = setupChip(label, item.on, () => {
                        const now = chip.getAttribute('aria-pressed') !== 'true';
                        s.edits[pack.id] = group.kind === 'own'
                            ? Setup.StudyReviewGroups.setOwnTopic(s.edits[pack.id], item.topic, now)
                            : Setup.StudyReviewGroups.setTopic(s.edits[pack.id], item.topic, now);
                        chip.classList.toggle('is-on', now);
                        chip.setAttribute('aria-pressed', now ? 'true' : 'false');
                        updateReviewBar();
                    });
                    chip.classList.add('is-soft');
                    flow.appendChild(chip);
                }
                if (!all && group.topics.length > Setup.TOPICS_FOLDED) {
                    const more = group.topics.length - Setup.TOPICS_FOLDED;
                    flow.appendChild(button(plural('study.setup.topicsMore', more, '+{count} more', '+{count} more'), 'ft-setup-chip is-more', () => { s.showAll.add(key); render(); }));
                }
                host.appendChild(flow);
            }
        }

        function renderReview(body) {
            const list = packs();
            body.appendChild(el('p', 'ft-study-muted', t('study.setup.reviewIntro', 'Turn off anything you don\'t want. Add your own.')));
            const columns = el('div', 'ft-setup-columns');
            const left = el('div', 'ft-setup-column');
            const right = el('div', 'ft-setup-column');
            list.forEach((pack, index) => {
                if (list.length > 1) {
                    if (index > 0) left.appendChild(el('hr', 'ft-setup-dashed'));
                    left.appendChild(el('h3', 'ft-setup-h1 is-small', chipLabel(pack)));
                }
                addChannelGroups(left, pack);
            });
            right.appendChild(el('p', 'ft-setup-h2', t('study.setup.reviewTopics', 'Topics')));
            list.forEach(pack => addTopicGroups(right, pack, list.length > 1));
            const explainer = searchExplainerCard({ activePackIds: s.selected, packEdits: s.edits }, catalog, !isSelf);
            if (explainer) right.appendChild(explainer);
            columns.append(left, right);
            body.appendChild(columns);
            const [label, any] = countsLabel();
            return bar(label, t('study.setup.next', 'Next'), goNext, any);
        }

        // ---- "Add a channel" (Android StudyAddChannelSheet)
        function addChannelSheet(pack) {
            const Input = Setup.StudyChannelInput;
            const sheet = el('div', 'ft-setup-sheet');
            sheet.setAttribute('role', 'group');
            sheet.setAttribute('aria-label', t('study.setup.addChannel', 'Add a channel'));
            sheet.appendChild(el('p', 'ft-study-muted', t('study.setup.addBody', 'Search by name, or paste a channel\'s link or @handle.')));
            const field = el('input', 'text-input');
            field.type = 'text';
            field.placeholder = t('study.setup.addHint', 'Name, @handle or link');
            field.setAttribute('aria-label', field.placeholder);
            const results = el('div', 'ft-setup-results');
            const status = el('p', 'ft-study-muted');
            status.setAttribute('role', 'status');
            const isOn = ref => Setup.StudyReviewGroups.isOn(pack, s.edits[pack.id], ref);
            const added = ref => {
                s.edits[pack.id] = Setup.StudyReviewGroups.add(s.edits[pack.id], ref, pack);
                s.keptOwn[pack.id] = array(s.keptOwn[pack.id]).filter(item => Setup.refKey(item) !== Setup.refKey(ref));
                s.opened[`${pack.id}:own`] = true;
                s.addFor = null;
                render();
                notify(panel, t('study.setup.addDone', '{name} added to Your own', { name: ref.name || ref.handle || ref.channelId }), null);
            };
            const resultRow = (ref, meta) => {
                const on = isOn(ref);
                const row = el('div', 'ft-setup-result');
                const words = el('span', 'ft-setup-row__words');
                words.append(el('span', 'ft-setup-row__name', ref.name || ref.handle || ref.channelId), el('span', 'ft-study-muted', meta || (ref.handle ? `@${String(ref.handle).replace(/^@/, '')}` : '')));
                const action = button(on ? t('study.setup.addAdded', 'Added') : t('study.setup.addAction', 'Add'), on ? 'btn-secondary' : 'btn-primary', () => added(ref));
                action.disabled = on;
                row.append(channelAvatar(ref, 32), words, action);
                return row;
            };
            const lookup = async value => {
                status.textContent = t('study.setup.addLooking', 'Looking it up…');
                results.replaceChildren();
                const info = await send({ action: 'fetchChannelDetails', channelIdOrHandle: value });
                if (info?.success && (info.id || info.handle)) {
                    status.textContent = '';
                    results.appendChild(resultRow({ channelId: info.id || null, handle: info.handle ? String(info.handle).replace(/^@/, '') : null, name: info.name || info.handle || info.id }));
                } else if (info?.errorCode === 'channel_not_found') {
                    status.textContent = t('study.setup.addNone', 'No channel called "{query}". Check the spelling or paste its link.', { query: field.value.trim() });
                } else {
                    status.textContent = t('study.setup.addFailed', 'Couldn\'t look that up. Check your connection and try again.');
                }
            };
            const search = () => {
                const input = Input.parse(field.value);
                results.replaceChildren();
                status.textContent = '';
                if (input.type === 'empty') return;
                const value = Input.lookup(input);
                if (value) { lookup(value); return; }
                const hits = Input.searchCatalog(catalog, input.value);
                if (hits.length) {
                    results.appendChild(el('p', 'ft-setup-section', t('study.setup.addKnown', 'From study packs')));
                    hits.forEach(channel => results.appendChild(resultRow({ channelId: channel.channelId, handle: channel.handle, name: channel.name })));
                }
                // The handle lookup hides when a pack channel already has that handle (Android b753aa71f).
                const guess = Input.handleGuess(input.value);
                if (guess && !hits.some(channel => String(channel.handle || '').replace(/^@/, '').toLowerCase() === guess.toLowerCase())) {
                    results.appendChild(button(t('study.setup.addLookupHandle', 'Look up @{handle}', { handle: guess }), 'btn-secondary', () => lookup(`@${guess}`)));
                }
                if (!hits.length && !guess) status.textContent = t('study.setup.addNone', 'No channel called "{query}". Check the spelling or paste its link.', { query: input.value });
            };
            let timer = 0;
            field.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 250); });
            field.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); clearTimeout(timer); search(); } if (event.key === 'Escape') { s.addFor = null; render(); } });
            const actions = el('div', 'ft-study-actions');
            actions.appendChild(button(t('popup.modal.cancel', 'Cancel'), 'btn-secondary', () => { s.addFor = null; render(); }));
            sheet.append(field, status, results, actions);
            setTimeout(() => { try { field.focus(); } catch (e) { } }, 0);
            return sheet;
        }

        // ---- Step 5: ready
        function renderReady(body) {
            const focus = object(study.focus);
            const round = Number.isFinite(focus.roundMinutes) ? focus.roundMinutes : 25;
            const rest = Number.isFinite(focus.breakMinutes) ? focus.breakMinutes : 5;
            const card = el('div', 'ft-setup-paper ft-setup-ready');
            const line = value => {
                const row = el('p', 'ft-setup-ready__line');
                row.append(el('span', 'ft-setup-ready__check', '✓'), el('span', '', value));
                card.appendChild(row);
                return row;
            };
            line(t('study.setup.readyAllow', 'During study, only {plan} channels and topics show.', { plan: packsShortLabel(s.selected, catalog) }));
            const blockLine = line('');
            blockLine.hidden = true;
            // The block list keeps working during study (layered rules); name only what's in it.
            blockCounts(options.profileId).then(([channels, words]) => {
                const channelText = plural('study.setup.nChannels', channels, '{count} channel', '{count} channels');
                const wordText = plural('study.setup.nWords', words, '{count} word', '{count} words');
                const list = channels > 0 && words > 0 ? t('study.setup.readyAnd', '{first} and {second}', { first: channelText, second: wordText })
                    : channels > 0 ? channelText : words > 0 ? wordText : '';
                if (!list) return;
                blockLine.lastChild.textContent = t('study.setup.readyBlockKept', 'Your block list still applies: {list}.', { list });
                blockLine.hidden = false;
            });
            line(t('study.setup.readyBreaks', 'A {breakMinutes}-minute break after every {roundMinutes} minutes.', { breakMinutes: rest, roundMinutes: round }));
            line(t('study.setup.readyShorts', 'Clips show only from these channels.'));
            line(t('study.setup.readySkip', 'You can always skip a video you don\'t want.'));
            const kidsNote = engine()?.kidsSetupNote ? engine().kidsSetupNote(s.selected, catalog) : null;
            if (kidsNote === 'kids_learning') line(t('study.setup.readyKidsLearning', 'Kids learning for this age shows in the Kids space.'));
            else if (kidsNote === 'kids_hold') line(t('study.setup.readyKidsHold', 'The Kids space keeps Kids videos and pauses at study time.'));
            body.appendChild(card);
            const actions = el('div', 'ft-setup-ready__actions');
            if (isSelf) {
                actions.appendChild(el('p', 'ft-setup-h2', t('study.setup.lockSection', 'Lock it in')));
                const lockCard = el('div', 'ft-setup-paper');
                const row = el('div', 'ft-setup-flow');
                for (const [mode, name] of [['gentle', t('study.setup.lockGentle', 'Gentle')], ['locked', t('study.setup.lockLocked', 'Locked')]]) {
                    row.appendChild(setupChip(name, s.lockMode === mode, () => { s.lockMode = mode; render(); }));
                }
                lockCard.append(row, el('p', 'ft-study-muted', s.lockMode === 'locked'
                    ? t('study.setup.lockLockedBody', 'No early end, up to 4 hours. Uses Self-Control.')
                    : t('study.setup.lockGentleBody', 'You can end early after a 30-second pause.')));
                actions.appendChild(lockCard);
            }
            const save = async startNowToo => {
                const result = await options.onPatch?.({ activePackIds: s.selected.slice(), packEdits: Setup.savedEdits(s.selected, s.edits, catalog) });
                if (result?.ok === false) { notify(panel, errorText(result.error), null); return; }
                if (startNowToo) {
                    const started = await options.onStart?.(50, s.lockMode);
                    if (started?.ok === false) { notify(panel, errorText(started.error), null); return; }
                }
                close();
            };
            actions.appendChild(button(t('study.setup.savePlan', 'Save plan'), isSelf ? 'btn-secondary' : 'btn-primary', () => save(false)));
            if (isSelf) actions.appendChild(button(t('study.setup.startNow', 'Start now'), 'btn-primary', () => save(true)));
            body.appendChild(actions);
            return null;
        }

        render();
        return { close, state: s };
    }

    async function blockCounts(profileId) {
        try {
            const stored = await new Promise(resolve => runtime().storage.local.get(['ftProfilesV4'], resolve));
            const profiles = object(stored?.ftProfilesV4);
            const profile = object(object(profiles.profiles)[profileId || profiles.activeProfileId]);
            const main = object(profile.main);
            return [array(main.channels).length, array(main.keywords).length];
        } catch (e) {
            return [0, 0];
        }
    }

    // ---- Dashboard (options page) -------------------------------------------------------------

    // ---- The Study home (Android StudyFocusActivity, STUDY_V3) ---------------------------------
    // One page: the hero card (Kriti's perch, the Day Ring, the moment's line and its one action),
    // Continue lecture, This week, "Session and channels" link rows, Settings and Family. "Change
    // plan" opens the plan page (the day planner and the daily limit) in the same place.

    const HOME_PREFS_KEY = 'ftStudyHomeUiV1';
    const SVG_NS = 'http://www.w3.org/2000/svg';
    /** Kriti arrives this long after the ring starts drawing: content leads (KRITI_DELAY_MILLIS). */
    const KRITI_DELAY_MS = 260;
    /** The ring's draw-on, once a day and after Start (NativeMotion.SIGNATURE_RING). */
    const RING_DRAW_MS = 900;
    /** Skip break's salute stays this long (THUMBS_UP_MILLIS). */
    const SALUTE_MS = 1800;
    /** Start now's lengths (Android addStartControls). */
    const START_LENGTHS = [25, 50, 60, 120];

    function homePrefs() {
        try { return object(JSON.parse(root.localStorage?.getItem(HOME_PREFS_KEY) || '{}')); } catch (e) { return {}; }
    }
    function setHomePref(key, value) {
        const prefs = homePrefs();
        if (value === null || value === undefined) delete prefs[key]; else prefs[key] = value;
        try { root.localStorage?.setItem(HOME_PREFS_KEY, JSON.stringify(prefs)); } catch (e) { }
    }

    function motionAllowed() {
        try { return !root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches; } catch (e) { return true; }
    }

    function svgNode(tag, attrs = {}) {
        const node = root.document.createElementNS(SVG_NS, tag);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
        return node;
    }

    function minutesLabel(value) {
        return value >= 60 && value % 60 === 0 ? t('study.hoursChip', '{hours} h', { hours: value / 60 }) : t('study.minutes', '{minutes} min', { minutes: value });
    }

    /** "4 – 7 PM", in the page's language (Android DateUtils.formatDateRange). */
    function timeRange(fromMinute, toMinute) {
        const at = minute => new Date(2026, 0, 5, 0, minute).getTime();
        try { return new Intl.DateTimeFormat(language(), { hour: 'numeric', minute: '2-digit' }).formatRange(at(fromMinute), at(toMinute)); } catch (e) { }
        return `${clockLabel(fromMinute)} – ${clockLabel(toMinute)}`;
    }

    function minuteOfDay(ms) { const date = new Date(ms); return date.getHours() * 60 + date.getMinutes(); }

    /**
     * The Day Ring (StudyDayRingView): today's plan as a crayon circle. Rounds are sage: solid for study
     * done, hatched for the rest of the running round, the pencil track for later rounds. The break
     * running now is a full sun arc with a thin sun arc inside that drains; every other break is a sun
     * bead. Now is a rounded brick pointer. The centre holds the big minutes, or a break's m:ss.
     * opts: {ring (Engine.dayRing), number, label, countdown, breakLeft, drawOn}.
     */
    function dayRing(opts) {
        const model = object(opts.ring);
        const svg = svgNode('svg', { viewBox: '0 0 236 236', class: 'ft-day-ring', 'aria-hidden': 'true' });
        const cx = 118; const cy = 118; const stroke = 24; const R = 118 - stroke / 2 - 9;
        const id = `ftRing${Math.random().toString(36).slice(2, 8)}`;
        const defs = svgNode('defs');
        // The running round's hatch: sage crayon stripes on the paper.
        const hatch = svgNode('pattern', { id: `${id}h`, width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(40)' });
        hatch.appendChild(svgNode('rect', { width: 7, height: 7, class: 'ft-day-ring__hatch-bg' }));
        hatch.appendChild(svgNode('rect', { width: 3.2, height: 7, class: 'ft-day-ring__hatch-line' }));
        defs.appendChild(hatch);
        // Wax: a slight wobble on every stroke.
        const wax = svgNode('filter', { id: `${id}w`, x: '-5%', y: '-5%', width: '110%', height: '110%' });
        wax.appendChild(svgNode('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 1, seed: 7, result: 'n' }));
        wax.appendChild(svgNode('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 1.6 }));
        defs.appendChild(wax);
        svg.appendChild(defs);
        const body = svgNode('g', { filter: `url(#${id}w)` });
        svg.appendChild(body);
        const point = (fraction, radius = R) => {
            const angle = fraction * 2 * Math.PI - Math.PI / 2;
            return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
        };
        const arcPath = (from, to, radius = R) => {
            if (to - from >= 0.9999) return `M${cx} ${cy - radius} A${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`;
            const [x1, y1] = point(from, radius);
            const [x2, y2] = point(to, radius);
            return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${radius} ${radius} 0 ${to - from > 0.5 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        };
        const arc = (from, to, className, width = stroke, radius = R, parent = body) => {
            const path = svgNode('path', { d: arcPath(from, to, radius), class: className, fill: 'none', 'stroke-width': width });
            parent.appendChild(path);
            return path;
        };
        arc(0, 1, 'ft-day-ring__track');
        const Engine = engine();
        const arcs = array(model.arcs);
        const breaks = array(model.breaks);
        const current = Engine?.currentBreak ? Engine.currentBreak(model) : null;
        // The running round (its done and live parts) swells once on the five-minute ripple.
        const runningRound = arcs.find(item => item.kind === 'LIVE')?.round ?? null;
        for (const item of arcs) {
            if (item.kind === 'TODO' || item.end - item.start <= 0.001) continue;
            const path = arc(item.start, item.end, item.kind === 'LIVE' ? 'ft-day-ring__live' : 'ft-day-ring__done');
            if (item.kind === 'LIVE') path.setAttribute('stroke', `url(#${id}h)`);
            if (opts.ripple && item.round === runningRound) path.classList.add('is-rippling');
            // A round completing (sealRound): the hatch it ran on turns solid sage over 300 ms.
            if (opts.sealRound && item.round === opts.sealRound && item.kind === 'DONE') {
                const hatchOver = arc(item.start, item.end, 'ft-day-ring__sealing');
                hatchOver.setAttribute('stroke', `url(#${id}h)`);
            }
        }
        breaks.forEach(([from, to], index) => {
            if (index === current) return;
            const [x, y] = point((from + to) / 2);
            body.appendChild(svgNode('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: (stroke * 0.27).toFixed(2), class: 'ft-day-ring__bead' }));
        });
        // The cuts (StudyRingModel.cuts): 12 o'clock and the current break's edges, a notch of the card's paper.
        const GAP = 2.5 / 360;
        const cuts = new Set([0]);
        if (current !== null && breaks[current]) breaks[current].forEach(edge => cuts.add(edge >= 1 ? 0 : edge));
        for (const at of cuts) arc(at - GAP, at + GAP, 'ft-day-ring__cut', stroke + 4);
        if (current !== null && breaks[current]) arc(breaks[current][0], breaks[current][1], 'ft-day-ring__sun');
        if (Number.isFinite(opts.breakLeft) && opts.breakLeft > 0) arc(0, Math.min(1, opts.breakLeft) * 0.9999, 'ft-day-ring__drain', 5, R - stroke / 2 - 9);
        // Skip break's scribble: a sage zigzag between the ring's inner and outer edge over the skipped
        // span, drawn on and then faded as the next round takes the ring.
        if (opts.scribble && opts.scribble.to > opts.scribble.from) {
            const { from, to } = opts.scribble;
            const steps = Math.max(6, Math.round(((to - from) * 360) / 2.2));
            let d = '';
            for (let i = 0; i <= steps; i += 1) {
                const [x, y] = point(from + ((to - from) * i) / steps, R + (i % 2 === 0 ? -1 : 1) * stroke * 0.38);
                d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
            }
            svg.appendChild(svgNode('path', { d, class: 'ft-day-ring__scribble', fill: 'none', pathLength: 1 }));
        }
        if (Number.isFinite(model.tick)) {
            const [x1, y1] = point(model.tick, R - stroke / 2 - 4);
            const [x2, y2] = point(model.tick, R + stroke / 2 + 6);
            const coords = { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2) };
            svg.appendChild(svgNode('line', { ...coords, class: 'ft-day-ring__pointer-edge' }));
            svg.appendChild(svgNode('line', { ...coords, class: 'ft-day-ring__pointer' }));
        }
        // The draw-on: the ring sweeps in clockwise from 12 o'clock under a mask.
        if (opts.drawOn && motionAllowed()) {
            const mask = svgNode('mask', { id: `${id}m` });
            const sweep = svgNode('circle', { cx, cy, r: R, fill: 'none', stroke: '#fff', 'stroke-width': stroke + 30, pathLength: 1,
                'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, transform: `rotate(-90 ${cx} ${cy})`, class: 'ft-day-ring__sweep' });
            sweep.style.animationDuration = `${RING_DRAW_MS}ms`;
            mask.appendChild(sweep);
            defs.appendChild(mask);
            body.setAttribute('mask', `url(#${id}m)`);
        }
        const number = svgNode('text', { x: cx, y: opts.label ? 124 : 134, class: `ft-day-ring__number${opts.countdown ? ' is-countdown' : ''}` });
        number.textContent = text(opts.number);
        // The figure stays inside the ring at any length.
        const length = text(opts.number).length;
        if (length >= 4) number.style.fontSize = `${Math.max(34, 62 - (length - 3) * 9)}px`;
        svg.appendChild(number);
        if (opts.label) {
            const label = svgNode('text', { x: cx, y: 150, class: `ft-day-ring__label${opts.countdown ? ' is-countdown' : ''}` });
            label.textContent = text(opts.label);
            svg.appendChild(label);
        }
        return svg;
    }

    /** What the ring shows now (ringState): a running session, or the next one (the plan's, or Start now's). */
    function ringState(state, study, now = Date.now()) {
        const Engine = engine();
        const value = object(state);
        const segments = array(value.segments);
        if ((value.state === 'STUDY' || value.state === 'BREAK') && segments.length && Engine?.dayRing) {
            const ring = Engine.dayRing(segments, now);
            const ends = Number(value.sessionEnd) || segments[segments.length - 1].end;
            if (value.state === 'STUDY') {
                const left = Math.max(0, Math.ceil((Number(value.until) - now) / MINUTE));
                return { ring, number: String(left), label: t('study.ring.left', 'min left'),
                    summary: t('study.ring.summaryRound', 'Round {round} of {rounds}. {left} min left in this round, {studied} min studied so far. Done at {time}.',
                        { round: value.round, rounds: value.rounds, left, studied: ring.studiedMinutes, time: formatTime(ends) }) };
            }
            const seconds = Math.max(0, Math.ceil((Number(value.until) - now) / 1000));
            const start = Number(value.segmentStart);
            const span = Number(value.until) - start;
            return { ring, number: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, label: t('study.ring.breakLeft', 'left of your break'),
                countdown: true, breakLeft: Number.isFinite(start) && span > 0 ? Math.min(1, Math.max(0, (Number(value.until) - now) / span)) : null,
                summary: t('study.ring.summaryBreak', 'Break until {time}. {studied} min studied so far. Done at {end}.',
                    { time: formatTime(value.until), studied: ring.studiedMinutes, end: formatTime(ends) }) };
        }
        const today = Number(value.todayMinutes) || 0;
        const focus = object(object(study).focus);
        const plan = object(study).plan;
        let planned = null;
        if (Engine?.planOccurrences && isObject(plan)) {
            const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
            const next = Engine.planOccurrences(plan, midnight.getTime(), midnight.getTime() + 86400000)
                .find(item => item.start > now && new Date(item.start).toDateString() === new Date(now).toDateString());
            if (next) planned = Engine.splitRounds(next.start, next.end, focus);
        }
        let ring; let summary;
        if (planned && Engine?.dayRing) {
            ring = Engine.dayRing(planned, null);
            summary = t('study.ring.summaryPlan', 'Today\'s plan, {range}: {minutes} min of study in {rounds}.', {
                range: timeRange(minuteOfDay(planned[0].start), minuteOfDay(planned[planned.length - 1].end)),
                minutes: ring.plannedMinutes, rounds: plural('study.nRounds', ring.rounds, '{count} round', '{count} rounds') });
        } else {
            const minutes = startMinutes(value.profileId);
            ring = Engine?.dayRing ? Engine.dayRing(Engine.splitRounds(now, now + minutes * MINUTE, focus), null) : { arcs: [], plannedMinutes: minutes, rounds: 1 };
            summary = t('study.ring.summaryStart', 'Start now: {minutes} min of study in {rounds}.',
                { minutes: ring.plannedMinutes, rounds: plural('study.nRounds', ring.rounds, '{count} round', '{count} rounds') });
        }
        // Never a zero in the middle: today's minutes once there are some, else what's ahead.
        if (today > 0) return { ring, number: String(today), label: t('study.ring.studied', 'min studied'),
            summary: `${t('study.ring.summaryToday', '{minutes} min studied today.', { minutes: today })} ${summary}` };
        return { ring, number: String(ring.plannedMinutes), label: planned ? t('study.ring.planned', 'min planned') : t('study.ring.session', 'min session'), summary };
    }

    function startMinutes(profileId) {
        const value = Number(homePrefs()[`minutes:${profileId || 'default'}`]);
        return START_LENGTHS.includes(value) ? value : 50;
    }
    function startLocked(profileId) { return homePrefs()[`lock:${profileId || 'default'}`] === 'locked'; }

    function hasPack(study, catalog) {
        const ids = array(object(study).activePackIds);
        if (!ids.length) return false;
        const Packs = packsApi();
        return !catalog || !Packs?.packById ? true : ids.some(id => Packs.packById(catalog, id));
    }

    function nextPlanLine(study, now = Date.now()) {
        const Engine = engine();
        const plan = object(study).plan;
        if (!Engine?.planOccurrences || !isObject(plan)) return null;
        const next = Engine.planOccurrences(plan, now, now + 8 * 86400000).find(item => item.start > now);
        if (!next) return null;
        const same = new Date(next.start).toDateString() === new Date(now).toDateString();
        let day = '';
        if (!same) { try { day = `${new Date(next.start).toLocaleDateString(language(), { weekday: 'short' })} `; } catch (e) { } }
        return t('study.dash.next', 'Next study {time}', { time: day + formatTime(next.start) });
    }

    /** The home's role (StudyHomeRender.Role): the person's own study, or a child's under a parent. */
    function homeRole(data) { return data.state?.isChild === true ? 'child' : 'self'; }

    function running(state) { return state?.state === 'STUDY' || state?.state === 'BREAK'; }

    function canStart(data, catalog) {
        const state = object(data.state);
        const study = object(state.study);
        return homeRole(data) === 'self' && !state.lock && !running(state) && hasPack(study, catalog)
            && !text(object(study.plan).setByParentId) && !state.clockHold;
    }

    /** heroLines: the title under the ring and its meta pill. */
    function heroLines(data, catalog) {
        const state = object(data.state);
        const study = object(state.study);
        if (Number.isFinite(state.grantUntil)) return [t('study.tile.extraTime', 'Extra time until {time}', { time: formatTime(state.grantUntil) }), null];
        if (state.clockHold) return [t('study.clockHold.title', 'Check the clock'), t('study.clockHold.body', 'The time or time zone changed during study. Videos stay off until it\'s set back.')];
        if (state.state === 'STUDY') {
            const next = array(state.segments).find(item => item.kind === 'BREAK' && item.start >= Number(state.until));
            return [t('study.roundOf', 'Round {round} of {rounds}', { round: state.round, rounds: state.rounds }),
                next ? t('study.roundMeta', 'Break at {time}, done by {end}', { time: formatTime(next.start), end: formatTime(state.sessionEnd) })
                    : t('study.doneBy', 'Done by {time}', { time: formatTime(state.sessionEnd) })];
        }
        if (state.state === 'BREAK') return [t('study.tile.onBreak', 'On a break until {time}', { time: formatTime(state.until) }),
            state.sessionEnd ? t('study.doneBy', 'Done by {time}', { time: formatTime(state.sessionEnd) }) : null];
        if (state.state === 'LIMIT') return [t('study.planner.limit', 'Limit reached'), t('study.detail.limit', 'Nothing plays until midnight.')];
        if (state.lock && Number.isFinite(state.lock.lockedUntil)) return [t('study.lockedUntil', 'Locked until {time}', { time: formatDayTime(state.lock.lockedUntil) }), null];
        const role = homeRole(data);
        if (!isObject(study.plan) && role !== 'self') return [t('study.invite.title', 'Set up a study plan'), null];
        if (!isObject(study.plan) && !hasPack(study, catalog)) return [t('study.invite.title', 'Set up a study plan'),
            t('study.invite.body', 'Pick an exam or a class. During study time, only those channels and topics show, and your block list still applies.')];
        if (canStart(data, catalog)) return [t('study.startRound', 'Start a round'), nextPlanLine(study)];
        return [phaseInfo(state).line, nextPlanLine(study)];
    }

    /**
     * Kriti always stands on something and never covers data (KritiPerch). Before a session she sits on
     * the hero card's top-right edge reading; in a round she peeks over its top-left edge from behind it
     * with her notebook; in the last five minutes she holds up "5 min"; on a break she has her mug; a
     * child under a parent's plan sees her pointing. Companion Off hides her.
     */
    function perchSpot(data, pageState, moment) {
        const Mascots = root.FilterTubeMascots;
        if (!Mascots?.showsCharacters?.(Mascots.mode)) return null;
        if (moment) return { pose: moment, size: 64, end: true, behind: false };
        const state = object(data.state);
        if (homeRole(data) === 'child' && text(object(object(state.study).plan).setByParentId)) return { pose: 'kritiPointing', size: 80, end: true, behind: false };
        if (pageState === 'ROUND') return { pose: 'kritiPencil', size: 64, end: false, behind: true };
        if (pageState === 'LAST_FIVE') return { pose: 'kritiSignRaised', size: 80, end: true, behind: false, sign: t('study.minutes', '{minutes} min', { minutes: 5 }) };
        if (pageState === 'BREAK') return { pose: 'kritiMug', size: 64, end: true, behind: false };
        // Late at night she's sleepy (the owner's 2026-11-18 pose).
        return new Date().getHours() >= 21 ? { pose: 'kritiSleepy', size: 80, end: true, behind: false } : { pose: 'kritiReading', size: 96, end: true, behind: false };
    }

    function perchImage(spot) {
        const Mascots = root.FilterTubeMascots;
        const file = Mascots?.stillImage?.(spot.pose);
        if (!file) return null;
        const img = el('img', `ft-perch__kriti is-${spot.end ? 'end' : 'start'}${spot.behind ? ' is-behind' : ''}`);
        const api = runtime();
        img.src = api?.runtime?.getURL ? api.runtime.getURL(`assets/images/mascots/${file}`) : `../assets/images/mascots/${file}`;
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.style.setProperty('--ft-perch-size', `${spot.size}px`);
        img.dataset.pose = spot.pose;
        return img;
    }

    /** At most one line per visit, and each kind at most once a day (bubbleLine). */
    let bubbleShownThisVisit = false;
    function bubbleLine(data, catalog) {
        const Mascots = root.FilterTubeMascots;
        if (bubbleShownThisVisit || Mascots?.mode !== 'lively') return null;
        const state = object(data.state);
        if (state.state && state.state !== 'NORMAL') return null;
        const today = new Date().toDateString();
        let key; let line;
        if (homeRole(data) === 'child' && text(object(object(state.study).plan).setByParentId)) {
            key = `kriti:parent:${today}`; line = t('study.kriti.parent', '{name} set today\'s plan.', { name: text(data.parentName) || t('study.parentFallback', 'Your parent') });
        } else if (canStart(data, catalog)) {
            key = `kriti:start:${today}`; line = t('study.kriti.start', 'One round is plenty to start.');
        } else return null;
        if (homePrefs()[key]) return null;
        setHomePref(key, true);
        bubbleShownThisVisit = true;
        return line;
    }

    /**
     * The ring's moments, each tied to its cause (StudyFocusActivity.heroMoments): a round completing
     * (replayed once when it finished while the page was closed; the first look at a session replays
     * none), the break arriving (the ring exhales), the five-minute ripple of a round, and Skip break's
     * scribble. Reduced motion shows none of them.
     */
    let lastPageState = null;
    let lastRippleCheck = null;
    let pendingScribble = null;
    function ringMoments(state, ringInfo, pageState) {
        const out = {};
        const before = lastPageState;
        lastPageState = pageState;
        if (!motionAllowed()) { pendingScribble = null; return out; }
        if (before && before !== 'BREAK' && pageState === 'BREAK') out.exhale = true;
        if (pendingScribble) { out.scribble = pendingScribble; pendingScribble = null; }
        const value = object(state);
        if (!(value.state === 'STUDY' || value.state === 'BREAK') || !Number.isFinite(Number(value.sessionStart))) { lastRippleCheck = null; return out; }
        const arcs = array(object(ringInfo.ring).arcs);
        const rounds = new Map();
        for (const item of arcs) rounds.set(item.round, (rounds.get(item.round) ?? true) && item.kind === 'DONE');
        const completed = [...rounds.values()].filter(Boolean).length;
        const seenKey = `seenRounds:${value.profileId || 'default'}:${value.sessionStart}`;
        const seen = homePrefs()[seenKey];
        if (Number.isFinite(seen) && completed > seen) out.sealRound = completed;
        if (seen !== completed) setHomePref(seenKey, completed);
        // Every five minutes of a round, counted from its start (StudyRipple.due).
        const now = Date.now();
        const round = array(value.segments).find(item => item.kind === 'STUDY' && item.start <= now && now < item.end);
        if (value.state === 'STUDY' && round) {
            const beat = at => Math.floor(Math.max(0, at - round.start) / (5 * MINUTE));
            if (lastRippleCheck && lastRippleCheck.start === round.start && beat(now) > beat(lastRippleCheck.at)) out.ripple = true;
            lastRippleCheck = { start: round.start, at: now };
        } else {
            lastRippleCheck = null;
        }
        return out;
    }

    let perchMoment = null;
    let perchCache = null;
    let shownPose = '';
    let startedJustNow = false;

    function heroCard(data, ctx) {
        const state = object(data.state);
        const study = object(state.study);
        const catalog = ctx.catalog;
        const stage = el('div', 'ft-perch');
        const card = el('section', 'ft-home-card ft-hero');
        const pageState = ctx.pageState;
        const ringInfo = ringState(state, study);
        // The draw-on: once a day, and after Start.
        const drawKey = `ringDrawOn:${state.profileId || 'default'}`;
        const today = new Date().toDateString();
        const drawOn = startedJustNow || (!ctx.redraw && homePrefs()[drawKey] !== today);
        if (drawOn) setHomePref(drawKey, today);
        const ringBox = el('div', 'ft-hero__ring');
        ringBox.setAttribute('role', 'img');
        ringBox.setAttribute('aria-label', ringInfo.summary);
        const moments = ringMoments(state, ringInfo, pageState);
        if (moments.exhale) ringBox.classList.add('is-exhaling');
        if (moments.sealRound) { try { root.FilterTubeMascots?.playSound?.('giggle'); } catch (e) { } }
        ringBox.appendChild(dayRing({ ...ringInfo, drawOn, ...moments }));
        card.appendChild(ringBox);
        const [heading, meta] = heroLines(data, catalog);
        const words = el('div', 'ft-hero__words');
        words.setAttribute('aria-live', 'polite');
        words.appendChild(el('h3', 'ft-hero__title', heading));
        if (meta) words.appendChild(el('p', 'ft-hero__meta', meta));
        card.appendChild(words);
        const actions = el('div', 'ft-hero__actions');
        buildHeroActions(actions, data, ctx);
        if (actions.childNodes.length) card.appendChild(actions);
        // A child's own card under a parent: Ask for time, and who gave the minutes running now.
        if (Number.isFinite(state.grantUntil)) {
            card.appendChild(el('p', 'ft-study-ask__line is-given', t('study.ask.given', '{name} gave you {minutes} min · until {time}',
                { name: data.grantName || data.parentName || t('askParent.parentFallback', 'Your parent'), minutes: state.grantMinutes, time: formatTime(state.grantUntil) })));
        }
        stage.appendChild(card);
        const spot = perchSpot(data, pageState, perchMoment && perchMoment.until > Date.now() ? perchMoment.pose : null);
        if (spot) {
            // The same picture across the page's redraws, so a frame animation plays on to its end.
            const kriti = perchCache && perchCache.pose === spot.pose ? perchCache.img : perchImage(spot);
            if (kriti) perchCache = { pose: spot.pose, img: kriti };
            if (kriti) {
                kriti.className = `ft-perch__kriti is-${spot.end ? 'end' : 'start'}${spot.behind ? ' is-behind' : ''}`;
                stage.classList.add(spot.behind ? 'has-peek' : 'has-perch');
                stage.style.setProperty('--ft-perch-size', `${spot.size}px`);
                // With a sign, she and the words share one box, so the words sit on the sign at any size.
                let figure = kriti;
                if (spot.sign) {
                    figure = el('span', 'ft-perch__figure is-end');
                    figure.style.setProperty('--ft-perch-size', `${spot.size}px`);
                    figure.appendChild(kriti);
                }
                if (spot.behind) stage.insertBefore(figure, card); else stage.appendChild(figure);
                const moved = shownPose !== spot.pose;
                shownPose = spot.pose;
                const Mascots = root.FilterTubeMascots;
                if (moved && motionAllowed()) {
                    kriti.classList.add('is-arriving');
                    kriti.style.animationDelay = `${drawOn ? KRITI_DELAY_MS : 0}ms`;
                    if (spot.pose === 'kritiMug' || spot.pose === 'kritiPencil') {
                        try { Mascots?.playSheet?.(kriti, spot.pose); } catch (e) { }
                    }
                }
                // "5 min" written on her blank sign (the art stays wordless; the page writes the words).
                if (spot.sign) {
                    const sign = el('span', 'ft-perch__sign', spot.sign);
                    sign.setAttribute('aria-hidden', 'true');
                    figure.appendChild(sign);
                }
                const line = !spot.behind && pageState === 'IDLE' ? bubbleLine(data, catalog) : null;
                if (line) {
                    const bubble = el('p', 'ft-perch__bubble', line);
                    bubble.setAttribute('role', 'status');
                    stage.appendChild(bubble);
                }
            }
        } else {
            shownPose = '';
            perchCache = null;
        }
        startedJustNow = false;
        return stage;
    }

    /**
     * The hero's action, by moment: in a round, Open study with End session quiet under it; on a break,
     * Skip break (a brick crayon pill) when allowed; outside a session, Start now with its "50 min,
     * Gentle · Change" line, or Set up when there's nothing to study yet.
     */
    function buildHeroActions(slot, data, ctx) {
        const state = object(data.state);
        const study = object(state.study);
        const role = homeRole(data);
        if (state.state === 'STUDY') {
            slot.appendChild(button(t('study.openStudy', 'Open study'), 'btn-primary ft-hero__primary', () => openSite('')));
        } else if (state.state === 'BREAK') {
            if (state.canSkipBreak && !state.breakSkipped) {
                const skip = button(t('study.overlay.skipBreak', 'Skip break'), 'btn-secondary ft-hero__skip', async () => {
                    skip.disabled = true;
                    // The break being skipped, as a span of the ring, for the scribble on the next draw.
                    const Engine = engine();
                    const segs = array(state.segments);
                    if (Engine?.dayRing && segs.length) {
                        const model = Engine.dayRing(segs, Date.now());
                        const index = Engine.currentBreak ? Engine.currentBreak(model) : null;
                        if (index !== null && model.breaks[index]) pendingScribble = { from: model.breaks[index][0], to: model.breaks[index][1] };
                    }
                    const result = await send({ action: 'FilterTube_StudySkipBreak' });
                    if (result?.ok === false) { pendingScribble = null; skip.disabled = false; skip.classList.add('is-rejected'); return; }
                    skip.classList.add('is-squash');
                    // "Break skipped. Round 3 is now 55 min." with Undo for 5 seconds (Android StudyRuntime.undoSkipBreak).
                    const preview = object(state.skipPreview);
                    if (Number.isFinite(result?.until)) {
                        notify(slot, preview.round
                            ? t('study.overlay.breakSkipped', 'Break skipped. Round {round} is now {minutes} min.', { round: preview.round, minutes: preview.roundMinutes })
                            : t('study.overlay.skipBreak', 'Skip break'),
                            async () => { await send({ action: 'FilterTube_StudyUndoSkipBreak', until: result.until }); ctx.refresh(); });
                    }
                    perchMoment = { pose: 'kritiSalute', until: Date.now() + SALUTE_MS };
                    try { root.FilterTubeMascots?.playSound?.('scribble'); } catch (e) { }
                    setTimeout(() => ctx.refresh(), SALUTE_MS + 40);
                    ctx.refresh();
                });
                slot.appendChild(skip);
                if (state.skipPreview) slot.appendChild(el('p', 'ft-hero__note', t('study.overlay.skipCost', '+{minutes} min to round {round}',
                    { minutes: state.skipPreview.addedMinutes, round: state.skipPreview.round })));
            }
        } else if (!isObject(study.plan) && !hasPack(study, ctx.catalog)) {
            if (role === 'self' && !state.lock) slot.appendChild(button(t('study.invite.action', 'Set up'), 'btn-primary ft-hero__primary', () => ctx.openSetup(slot)));
        } else if (canStart(data, ctx.catalog)) {
            addStartControls(slot, data, ctx);
        }
        // End session (Gentle, with its 30-second pause) or its countdown; nothing for Locked.
        if (role === 'self' && running(state) && state.endPolicy?.canEnd === true) {
            if (Number.isFinite(state.endRequestedAt)) {
                const row = el('div', 'ft-hero__ending');
                const seconds = Math.max(0, Math.ceil((state.endRequestedAt + 30000 - Date.now()) / 1000));
                row.append(el('span', 'ft-hero__ending-text', t('study.endingSeconds', 'Ending in {seconds} seconds', { seconds })),
                    button(t('study.cancelEnd', 'Cancel'), 'ft-link-button', async () => { await send({ action: 'FilterTube_StudyCancelEnd' }); ctx.refresh(); }));
                slot.appendChild(row);
            } else {
                slot.appendChild(button(t('study.endSession', 'End session'), 'ft-link-button ft-hero__end', async () => {
                    await send({ action: 'FilterTube_StudyEndSession' });
                    ctx.toast(t('study.endHint', 'It ends after a 30-second pause, so you can still cancel.'));
                    ctx.refresh();
                }));
            }
        } else if (role === 'self' && running(state) && state.lockedUntil) {
            slot.appendChild(el('p', 'ft-hero__note', t('study.lockedNoEnd', 'Locked until {time}. It can\'t end early.', { time: formatTime(state.lockedUntil) })));
        }
        if (role === 'child' && running(state) && (state.setByParentId || state.lockMode === 'locked') && state.lockedUntil) {
            slot.appendChild(el('p', 'ft-hero__note', t('study.lockedNoEnd', 'Locked until {time}. It can\'t end early.', { time: formatTime(state.lockedUntil) })));
        }
    }

    /** Out of session: Start now, "50 min, Gentle · Change" under it, and the folded choices. */
    let choosing = false;
    function addStartControls(slot, data, ctx) {
        const profileId = data.state?.profileId;
        const minutes = startMinutes(profileId);
        const locked = startLocked(profileId);
        const summary = t('study.startSummary', '{length}, {mode}', { length: minutesLabel(minutes), mode: locked ? t('study.start.locked', 'Locked') : t('study.start.gentle', 'Gentle') });
        const go = button(t('study.start.title', 'Start now'), 'btn-primary ft-hero__primary', async () => {
            go.disabled = true;
            choosing = false;
            const result = await send({ action: 'FilterTube_StudyStartSession', minutes, lock: locked ? 'locked' : 'gentle' });
            go.disabled = false;
            if (result?.ok === false) { ctx.toast(errorText(result.error)); ctx.refresh(); return; }
            startedJustNow = true;
            try { root.FilterTubeMascots?.playSound?.('pop'); } catch (e) { }
            ctx.refresh();
        });
        slot.appendChild(go);
        const line = el('div', 'ft-hero__summary');
        const change = button(t('study.setup.change', 'Change'), 'ft-link-button', () => { choosing = !choosing; ctx.redrawHome(); });
        change.setAttribute('aria-expanded', choosing ? 'true' : 'false');
        change.setAttribute('aria-label', `${t('study.setup.change', 'Change')}: ${summary}`);
        line.append(el('span', '', summary), change);
        slot.appendChild(line);
        if (!choosing) return;
        const choices = el('div', 'ft-hero__choices');
        choices.appendChild(choiceRow(START_LENGTHS.map(value => [value, minutesLabel(value)]), minutes, value => {
            setHomePref(`minutes:${profileId || 'default'}`, value); ctx.redrawHome();
        }, t('study.start.length', 'Session length')));
        choices.appendChild(choiceRow([[false, t('study.start.gentle', 'Gentle')], [true, t('study.start.locked', 'Locked')]], locked, value => {
            setHomePref(`lock:${profileId || 'default'}`, value ? 'locked' : 'gentle'); ctx.redrawHome();
        }, t('study.start.lock', 'How it ends')));
        choices.appendChild(el('p', 'ft-hero__note', locked
            ? t('study.lock.lockedBody', 'No early end, up to 4 hours. Uses Self-Control.')
            : t('study.lock.gentleBody', 'You can end early after a 30-second pause.')));
        slot.appendChild(choices);
    }

    /** PaperKit choice chips in a row: a check on the chosen one (choiceRow). */
    function choiceRow(options, current, onPick, label, enabled = true) {
        const group = el('div', 'ft-choice-row');
        group.setAttribute('role', 'radiogroup');
        if (label) group.setAttribute('aria-label', label);
        for (const [value, name] of options) {
            const on = String(value) === String(current);
            const chip = button('', `ft-choice${on ? ' is-on' : ''}`, () => { if (!on && enabled) onPick(value); });
            chip.setAttribute('role', 'radio');
            chip.setAttribute('aria-checked', on ? 'true' : 'false');
            chip.disabled = !enabled;
            chip.append(el('span', 'ft-choice__mark'), el('span', 'ft-choice__label', name));
            group.appendChild(chip);
        }
        return group;
    }

    function openSite(path) {
        const url = `https://www.youtube.com/${path || ''}`;
        try {
            const tabs = runtime()?.tabs;
            if (tabs?.create) { const pending = tabs.create({ url }); if (pending?.catch) pending.catch(() => {}); } else root.open(url, '_blank');
        } catch (e) { }
    }

    /** Continue lecture: the last video of this round, in a sage tile with a crayon play mark. */
    function continueRow(state) {
        const videoId = text(state.lastVideoId);
        if (state.state !== 'STUDY' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
        const row = button('', 'ft-home-card ft-continue', () => openSite(`watch?v=${videoId}`));
        const mark = el('span', 'ft-continue__mark');
        mark.setAttribute('aria-hidden', 'true');
        mark.appendChild(icon('play'));
        const words = el('span', 'ft-continue__words');
        words.append(el('strong', 'ft-continue__title', t('study.continue.title', 'Continue lecture')), el('span', 'ft-study-muted', t('study.continue.body', 'Pick up where you left off')));
        row.append(mark, words);
        return row;
    }

    function icon(name) {
        const paths = {
            play: 'M8 5.5v13l11-6.5z',
            chevron: 'M9 6l6 6-6 6',
            minus: 'M6 12h12',
            plus: 'M12 6v12M6 12h12',
            back: 'M15 6l-6 6 6 6',
            close: 'M6 6l12 12M18 6L6 18',
            check: 'M5 12.5l4.5 4.5L19 7.5'
        };
        const svg = svgNode('svg', { viewBox: '0 0 24 24', width: 24, height: 24, fill: 'none', 'aria-hidden': 'true', class: `ft-icon ft-icon--${name}` });
        svg.appendChild(svgNode('path', { d: paths[name] || '', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
            fill: name === 'play' ? 'currentColor' : 'none' }));
        return svg;
    }

    /**
     * This week (StudyWeekBeads): seven beads, today's ringed until a round fills it, the count on the
     * right ("2 study days", or "Your first round starts the week."); never the days missed.
     */
    function weekCard(state) {
        const week = object(state.week);
        const days = array(week.days);
        const card = el('section', 'ft-home-card ft-week');
        const todayIndex = (new Date().getDay() + 6) % 7;
        const studiedNow = running(state) && Number(state.todayMinutes) > 0;
        const studied = days.filter((day, index) => day.minutes > 0 || (index === todayIndex && studiedNow)).length;
        const head = el('div', 'ft-week__head');
        head.append(el('h4', 'ft-card-title', t('study.week.title', 'This week')),
            el('span', 'ft-study-muted', studied === 0 ? t('study.week.first', 'Your first round starts the week.') : plural('study.week.studyDays', studied, '{count} study day', '{count} study days')));
        card.appendChild(head);
        const row = el('div', 'ft-week__beads');
        const names = dayLabels();
        let narrow = names;
        try {
            const monday = new Date(2026, 10, 16);
            narrow = DAY_KEYS.map((_, index) => new Date(monday.getTime() + index * 86400000).toLocaleDateString(language(), { weekday: 'narrow' }));
        } catch (e) { }
        const studiedNames = [];
        DAY_KEYS.forEach((key, index) => {
            const day = object(days[index]);
            const done = day.minutes > 0 || (index === todayIndex && studiedNow);
            const mark = done ? 'full' : index === todayIndex ? 'today' : index < todayIndex ? 'past' : 'later';
            if (done) studiedNames.push(names[index]);
            const cell = el('span', 'ft-week__day');
            const bead = el('span', `ft-bead is-${mark}`);
            if (index === todayIndex && done && motionAllowed()) {
                const fillKey = `beadFilled:${state.profileId || 'default'}:${day.date || ''}`;
                if (!homePrefs()[fillKey]) { setHomePref(fillKey, true); bead.classList.add('is-popping'); }
            }
            cell.append(bead, el('span', 'ft-week__name', narrow[index]));
            row.appendChild(cell);
        });
        card.appendChild(row);
        card.setAttribute('aria-label', [t('study.week.title', 'This week'), head.lastChild.textContent,
            studiedNames.length ? t('study.week.studiedOn', 'Studied on {days}', { days: studiedNames.join(', ') }) : ''].filter(Boolean).join('. '));
        row.setAttribute('aria-hidden', 'true');
        return card;
    }

    /** "Change plan            4–6:55 pm ›": a 64 px row (linkRow). */
    function linkRow(title, value, onClick) {
        const row = onClick ? button('', 'ft-link-row', onClick) : el('div', 'ft-link-row is-static');
        const words = el('span', 'ft-link-row__words');
        words.append(el('span', 'ft-link-row__title', title));
        if (value) words.append(el('span', 'ft-link-row__value', value));
        row.appendChild(words);
        if (onClick) row.appendChild(icon('chevron'));
        return row;
    }

    function sectionTitle(value) { return el('h4', 'ft-section-title', value); }

    function packsValue(study, catalog) {
        const Packs = packsApi();
        const ids = array(object(study).activePackIds);
        const list = ids.map(id => (catalog && Packs?.packById ? Packs.packById(catalog, id) : null)).filter(Boolean);
        if (!list.length) return t('study.packs.noneChosen', 'No exam or class chosen yet');
        return list.map(pack => text(pack.shortName) || localizedName(pack.names, pack.id)).join(', ');
    }

    /** Change plan, What you study, Daily limit and Self-Control: one paper card (addLinks). */
    function linksCard(data, ctx) {
        const state = object(data.state);
        const study = object(state.study);
        const role = homeRole(data);
        const plan = isObject(study.plan) ? study.plan : null;
        const card = el('section', 'ft-home-card ft-links');
        const editable = role === 'self' && !state.lock;
        if (plan) {
            const start = minuteOf(plan.start); const end = minuteOf(plan.end);
            card.appendChild(linkRow(t('study.dash.changePlan', 'Change plan'), start !== null && end !== null ? timeRange(start, end) : '', () => ctx.setMode('plan')));
        }
        if (plan || hasPack(study, ctx.catalog)) {
            card.appendChild(linkRow(t('study.link.packs', 'What you study'), packsValue(study, ctx.catalog), editable ? () => ctx.openSetup(card) : null));
        }
        if (plan) {
            const limit = minuteOf(plan.limit);
            card.appendChild(linkRow(t('study.section.limit', 'Daily limit'), limit !== null ? t('study.limit.at', 'Nothing plays after {time}', { time: clockLabel(limit) })
                : t('study.limit.none', 'No daily limit'), () => ctx.setMode('plan')));
        }
        if (role === 'self') {
            card.appendChild(linkRow(t('study.selfControl.title', 'Self-Control Session'), state.lock && Number.isFinite(state.lock.lockedUntil)
                ? t('study.lockedUntil', 'Locked until {time}', { time: formatDayTime(state.lock.lockedUntil) })
                : t('study.selfControl.body', 'Freeze today\'s filters for a set time'), () => ctx.openSelfControl()));
        }
        const explainer = searchExplainerCard(study, ctx.catalog, role === 'child', state.searchHow);
        if (explainer) {
            const how = linkRow(t('study.searchHow.link', 'What search shows during study'), '', () => {
                const open = how.getAttribute('aria-expanded') === 'true';
                how.setAttribute('aria-expanded', open ? 'false' : 'true');
                explainer.hidden = open;
            });
            how.setAttribute('aria-expanded', 'false');
            explainer.hidden = true;
            card.append(how, explainer);
        }
        if (!card.childNodes.length) return null;
        const wrap = el('div', 'ft-home-section');
        wrap.append(sectionTitle(t('study.sessionChannels', 'Session and channels')), card);
        return wrap;
    }

    function switchRow(label, on, enabled, onChange) {
        const row = el('label', 'ft-switch-row');
        const input = el('input', 'ft-switch');
        input.type = 'checkbox';
        input.setAttribute('role', 'switch');
        input.checked = !!on;
        input.disabled = !enabled;
        input.addEventListener('change', () => onChange(input.checked));
        row.append(el('span', 'ft-switch-row__label', label), input);
        return row;
    }

    /** Settings (addPreferences): Show this week. */
    function preferencesCard(data, ctx) {
        const state = object(data.state);
        if (homeRole(data) === 'child' || !isObject(object(state.study).plan)) return null;
        const card = el('section', 'ft-home-card ft-prefs');
        card.appendChild(switchRow(t('study.weekSwitch', 'Show this week'), state.weekView === true, !state.lock, async on => {
            const result = await send({ action: 'FilterTube_StudyUpdate', patch: { weekView: on } });
            if (result?.ok === false) ctx.toast(t('study.saveRefused', 'Can\'t change the plan while a lock is running.'));
            ctx.refresh();
        }));
        const wrap = el('div', 'ft-home-section');
        wrap.append(sectionTitle(t('study.settingsTitle', 'Settings')), card);
        return wrap;
    }

    /** Family (addFamily): a plan row for each child the active parent manages. */
    function familyCard(data, ctx) {
        const children = array(ctx.children);
        if (homeRole(data) !== 'self' || data.state?.lock || !children.length) return null;
        const card = el('section', 'ft-home-card ft-links');
        for (const child of children) {
            const plan = object(child.plan);
            const start = minuteOf(plan.start); const end = minuteOf(plan.end);
            card.appendChild(linkRow(t('study.family.row', 'Plan for {name}', { name: child.name }),
                start !== null && end !== null ? t('study.tile.planned', 'Study plan · {range}', { range: timeRange(start, end) }) : t('study.invite.title', 'Set up a study plan'),
                () => ctx.openFamily(child.id)));
        }
        const wrap = el('div', 'ft-home-section');
        wrap.append(sectionTitle(t('study.family.title', 'Family')), card);
        return wrap;
    }

    // ---- The plan page (renderPlan: the day planner card, then the daily limit) -----------------

    /** A ±step row: label, a round − button, the rolling value, a round + button (stepperRow). */
    function stepperRow(label, value, { onLess, onMore, lessOk = true, moreOk = true, enabled = true }) {
        const row = el('div', 'ft-stepper');
        row.appendChild(el('span', 'ft-stepper__label', label));
        const less = button('', 'ft-stepper__btn', () => onLess());
        less.appendChild(icon('minus'));
        less.setAttribute('aria-label', t('study.planner.earlier', '{label}: 15 minutes earlier', { label }));
        less.disabled = !enabled || !lessOk;
        const shown = el('output', 'ft-stepper__value', value);
        shown.setAttribute('aria-live', 'polite');
        const more = button('', 'ft-stepper__btn', () => onMore());
        more.appendChild(icon('plus'));
        more.setAttribute('aria-label', t('study.planner.later', '{label}: 15 minutes later', { label }));
        more.disabled = !enabled || !moreOk;
        row.append(less, shown, more);
        return row;
    }

    function planDrag() { return root.FilterTubeStudyPlanDrag || null; }

    /** "Study starts, 4:00 PM" (study_handle_value) for a handle at a minute; the limit at the day's end is "No limit". */
    function handleValue(which, minute) {
        const names = {
            start: t('study.handle.start', 'Study starts'),
            end: t('study.handle.end', 'Study ends'),
            limit: t('study.handle.limit', 'Daily limit')
        };
        const time = which === 'limit' && (minute === null || minute >= 1440) ? t('study.handle.noLimit', 'No limit') : clockLabel(minute % 1440);
        return { name: names[which], time, label: t('study.handle.value', '{name}, {time}', { name: names[which], time }) };
    }

    /**
     * The day bar (StudyDayPlannerView): hour ticks, the plan's segments, now, and the START, END and LIMIT
     * handles. Each handle is a slider: drag it (pointer capture, 15-minute snap, a pill shows the time),
     * or focus it and use the arrows (15 min), Page Up / Page Down (1 h), Home / End. Escape or a cancelled
     * pointer puts it back. onLive(draft, which) runs while it moves; onCommit(before, after) once it lands.
     */
    function planBar(plan, focus, breakMode, { editable, onSelect, onLive, onCommit } = {}) {
        const Drag = planDrag();
        const segments = planSegments(plan, focus, { from: 6 * 60, to: 23 * 60 });
        const from = segments[0]?.start ?? 0;
        const to = segments[segments.length - 1]?.end ?? 1440;
        const span = Math.max(1, to - from);
        const pct = minute => `${(((Math.max(from, Math.min(to, minute)) - from) / span) * 100).toFixed(3)}%`;
        const wrap = el('div', 'ft-dayplan');
        const track = el('div', 'ft-dayplan__track');
        for (const segment of segments) {
            if (segment.kind === 'normal') continue;
            const part = button('', `ft-dayplan__seg is-${segment.kind}`, () => onSelect?.(segment));
            part.style.left = pct(segment.start);
            part.style.width = `${(((segment.end - segment.start) / span) * 100).toFixed(3)}%`;
            part.setAttribute('aria-label', `${segmentName(segment.kind)}, ${clockLabel(segment.start)} – ${clockLabel(segment.end)}`);
            track.appendChild(part);
        }
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        if (minutesNow >= from && minutesNow <= to) {
            const marker = el('span', 'ft-dayplan__now');
            marker.setAttribute('aria-hidden', 'true');
            marker.style.left = pct(minutesNow);
            track.appendChild(marker);
        }
        if (!Drag || minuteOf(plan.start) === null || minuteOf(plan.end) === null) {
            wrap.append(track);
            return wrap;
        }
        const saved = Drag.draftOf(plan);
        let draft = { ...saved };
        const handles = {};
        const spotOf = which => (which === 'limit' ? (draft.limit ?? Drag.NO_LIMIT) : draft[which]);
        const paint = () => {
            for (const which of Drag.HANDLES) {
                const handle = handles[which];
                const at = spotOf(which);
                handle.style.left = pct(at);
                const value = handleValue(which, which === 'limit' ? draft.limit : at);
                handle.setAttribute('aria-valuenow', String(which === 'limit' ? (draft.limit ?? Drag.NO_LIMIT) : at));
                handle.setAttribute('aria-valuetext', value.time);
                handle.setAttribute('aria-label', value.name);
                handle.querySelector('.ft-dayplan__pill').textContent = value.time;
                const range = which === 'start' ? [0, draft.end - Drag.MIN_STUDY_MINUTES]
                    : which === 'end' ? [draft.start + Drag.MIN_STUDY_MINUTES, Drag.LAST_END] : [draft.end, Drag.NO_LIMIT];
                handle.setAttribute('aria-valuemin', String(range[0]));
                handle.setAttribute('aria-valuemax', String(range[1]));
            }
        };
        const live = which => { paint(); onLive?.({ ...draft }, which); };
        const commit = () => {
            if (draft.start === saved.start && draft.end === saved.end && (draft.limit ?? null) === (saved.limit ?? null)) return;
            onCommit?.({ ...saved }, { ...draft });
        };
        const revert = which => { draft = { ...saved }; live(which); };
        for (const which of Drag.HANDLES) {
            const handle = el('span', `ft-dayplan__handle is-${which}`);
            handle.appendChild(el('span', 'ft-dayplan__pill'));
            handle.dataset.ftFocusKey = `dayplan-${which}`;
            if (editable && onCommit) {
                handle.setAttribute('role', 'slider');
                handle.setAttribute('aria-orientation', 'horizontal');
                handle.tabIndex = 0;
                let keyTimer = null;
                handle.addEventListener('keydown', event => {
                    const steps = { ArrowLeft: -15, ArrowDown: -15, ArrowRight: 15, ArrowUp: 15, PageDown: -60, PageUp: 60 };
                    if (event.key === 'Escape') { revert(which); return; }
                    if (event.key === 'Home' || event.key === 'End') {
                        event.preventDefault();
                        draft = Drag.move(draft, which, event.key === 'Home' ? 0 : Drag.DAY_MINUTES);
                    } else if (steps[event.key]) {
                        event.preventDefault();
                        draft = Drag.step(draft, which, steps[event.key]);
                    } else return;
                    handle.classList.add('is-active');
                    live(which);
                    // A run of key presses saves once, a moment after the last one.
                    clearTimeout(keyTimer);
                    keyTimer = setTimeout(() => { handle.classList.remove('is-active'); commit(); }, 700);
                });
                handle.addEventListener('blur', () => handle.classList.remove('is-active'));
            } else {
                handle.setAttribute('aria-hidden', 'true');
            }
            handles[which] = handle;
            track.appendChild(handle);
        }
        if (draft.limit === null) handles.limit.classList.add('is-unset');
        if (editable && onCommit) {
            let justDragged = false;
            track.addEventListener('click', event => { if (justDragged) { event.stopPropagation(); event.preventDefault(); } }, { capture: true });
            // Presses anywhere near a handle take it (±26 px, the nearest; LIMIT loses ties), as on the app.
            track.addEventListener('pointerdown', event => {
                if (event.button !== 0) return;
                const box = track.getBoundingClientRect();
                const at = Drag.minuteAt(event.clientX, box.left, box.width, from, to);
                const reach = (26 / Math.max(1, box.width)) * span;
                const which = Drag.nearestHandle(draft, at, reach);
                if (!which) return;
                event.preventDefault();
                const handle = handles[which];
                try { track.setPointerCapture(event.pointerId); } catch (e) { }
                handle.classList.add('is-dragging');
                try { handle.focus({ preventScroll: true }); } catch (e) { }
                const move = ev => {
                    const next = Drag.move(draft, which, Drag.minuteAt(ev.clientX, box.left, box.width, from, to));
                    if (next.start === draft.start && next.end === draft.end && next.limit === draft.limit) return;
                    draft = next;
                    live(which);
                };
                const finish = cancelled => {
                    track.removeEventListener('pointermove', move);
                    track.removeEventListener('pointerup', onUp);
                    track.removeEventListener('pointercancel', onCancel);
                    handle.classList.remove('is-dragging');
                    if (cancelled) revert(which); else commit();
                };
                const onUp = () => {
                    finish(false);
                    // The press was a drag, not a tap on a segment: the click that follows it is swallowed.
                    justDragged = true;
                    setTimeout(() => { justDragged = false; }, 0);
                };
                const onCancel = () => finish(true);
                track.addEventListener('pointermove', move);
                track.addEventListener('pointerup', onUp);
                track.addEventListener('pointercancel', onCancel);
            });
        }
        paint();
        const scale = el('div', 'ft-dayplan__scale');
        for (let hour = Math.ceil(from / 180) * 180; hour <= to - 60; hour += 180) {
            const tick = el('span', 'ft-dayplan__hour', clockLabel(hour % 1440).replace(/:00/, ''));
            tick.style.left = pct(hour);
            scale.appendChild(tick);
        }
        wrap.append(track, scale);
        return wrap;
    }

    /**
     * The plan page's card: the day bar with its "Right now" note, Days, Start and End steppers, During
     * breaks, Music while studying, Rounds, then Study round and Break lengths. Then the Daily limit
     * card. options: {study, state, editable, readOnlyLabel, onPatch(patch) -> Promise<{ok}>, toastHost}.
     */
    function renderPlanPage(host, options) {
        const study = object(options.study);
        const editable = options.editable !== false;
        const plan = isObject(study.plan) ? study.plan : { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '16:00', end: '18:00' };
        const focus = object(study.focus);
        const round = Number.isFinite(focus.roundMinutes) ? focus.roundMinutes : 25;
        const rest = Number.isFinite(focus.breakMinutes) ? focus.breakMinutes : 5;
        const breakMode = study.breakMode === 'normal' ? 'normal' : 'rest';
        const page = el('div', 'ft-plan-page');
        if (options.readOnlyLabel) page.appendChild(el('span', `ft-note-chip${editable ? '' : ' is-locked'}`, options.readOnlyLabel));
        const patch = async (change, undoChange) => {
            const result = await options.onPatch?.(change);
            if (result?.ok === false) {
                const sheet = looseningSheet(result.error, options.state, options.parentName);
                if (sheet) showLoosening(options.toastHost || host, sheet);
                else notify(options.toastHost || host, errorText(result.error), null);
                return;
            }
            notify(options.toastHost || host, t('study.planner.saved', 'Saved'), undoChange ? async () => { await options.onPatch?.(undoChange); } : null);
        };
        const planPatch = next => patch({ plan: next }, { plan: clone(study.plan ?? null) });
        const focusPatch = next => patch({ focus: { ...focus, ...next } }, { focus: clone(focus) });

        const card = el('section', 'ft-home-card ft-plan-card');
        const detail = el('div', 'ft-plan-card__detail');
        detail.setAttribute('aria-live', 'polite');
        const showDetail = (segment, now) => {
            const titleText = now
                ? `${t('study.planner.rightNow', 'Right now')} · ${segmentName(segment.kind)}`
                : `${segmentName(segment.kind)} · ${clockLabel(segment.start)} – ${clockLabel(segment.end)}`;
            detail.replaceChildren(el('strong', 'ft-plan-card__detail-title', titleText), el('span', 'ft-study-muted', segmentWords(segment, breakMode)));
        };
        const start = minuteOf(plan.start) ?? 16 * 60;
        const end = minuteOf(plan.end) ?? 18 * 60;
        const limit = minuteOf(plan.limit);
        const setStart = value => planPatch({ ...plan, start: hhmm(value), end: hhmm(Math.max(end, value + MIN_STUDY)) });
        const setEnd = value => {
            const next = Math.max(value, start + MIN_STUDY);
            const changed = { ...plan, end: hhmm(next) };
            if (limit !== null && limit < next) changed.limit = hhmm(next);
            planPatch(changed);
        };
        const Drag = planDrag();
        // While a handle moves: its time in the detail card ("Study starts, 4:00 PM") and the steppers below
        // follow it (StudyFocusActivity.onLiveDraft); it saves once, where it lands, with Undo.
        const liveOutputs = {};
        card.appendChild(planBar(plan, focus, breakMode, {
            editable,
            onSelect: segment => showDetail(segment, false),
            onLive: (draft, which) => {
                const value = handleValue(which, which === 'limit' ? draft.limit : draft[which]);
                const range = `${clockLabel(draft.start)} – ${clockLabel(draft.end % 1440)}${draft.limit !== null ? ` · ${clockLabel(draft.limit)}` : ''}`;
                detail.replaceChildren(el('strong', 'ft-plan-card__detail-title', value.label), el('span', 'ft-study-muted', range));
                if (liveOutputs.start) liveOutputs.start.textContent = clockLabel(draft.start);
                if (liveOutputs.end) liveOutputs.end.textContent = clockLabel(draft.end % 1440);
                if (liveOutputs.limit) liveOutputs.limit.textContent = draft.limit === null ? t('study.limit.noLimit', 'No limit') : clockLabel(draft.limit);
            },
            onCommit: (before, after) => Drag && patch({ plan: Drag.applyToPlan(plan, after) }, { plan: clone(study.plan ?? null) })
        }));
        const runningKind = { STUDY: 'study', BREAK: 'break', LIMIT: 'limit' }[text(object(options.state).state)];
        showDetail(runningKind ? { kind: runningKind } : currentSegment(plan, focus), true);
        card.appendChild(detail);

        card.appendChild(el('span', 'ft-plan-card__label', t('study.planner.days', 'Days')));
        const days = el('div', 'ft-plan-days');
        days.setAttribute('role', 'group');
        days.setAttribute('aria-label', t('study.planner.days', 'Days'));
        const dayNames = dayLabels();
        DAY_KEYS.forEach((day, index) => {
            const on = array(plan.days).includes(day);
            const chip = button(dayNames[index], `ft-plan-day${on ? ' is-on' : ''}`, () => {
                const next = on ? array(plan.days).filter(item => item !== day) : [...array(plan.days), day];
                planPatch({ ...plan, days: DAY_KEYS.filter(item => next.includes(item)) });
            });
            chip.setAttribute('aria-pressed', on ? 'true' : 'false');
            chip.disabled = !editable;
            days.appendChild(chip);
        });
        card.appendChild(days);
        const startRow = stepperRow(t('study.startLabel', 'Start'), clockLabel(start), { enabled: editable,
            lessOk: start >= STEP, moreOk: start + STEP <= 1440 - MIN_STUDY - STEP,
            onLess: () => setStart(start - STEP), onMore: () => setStart(start + STEP) });
        const endRow = stepperRow(t('study.endLabel', 'End'), clockLabel(end % 1440), { enabled: editable,
            lessOk: end - STEP >= start + MIN_STUDY, moreOk: end + STEP <= 1440 - STEP,
            onLess: () => setEnd(end - STEP), onMore: () => setEnd(end + STEP) });
        liveOutputs.start = startRow.querySelector('output');
        liveOutputs.end = endRow.querySelector('output');
        card.append(startRow, endRow);

        card.appendChild(el('span', 'ft-plan-card__label', t('study.planner.duringBreaks', 'During breaks')));
        card.appendChild(choiceRow([['rest', t('study.planner.restScreen', 'Rest screen')], ['normal', t('study.planner.normalVideos', 'Normal videos')]], breakMode,
            value => patch({ breakMode: value }, { breakMode }), t('study.planner.duringBreaks', 'During breaks'), editable));
        const music = typeof plan.music === 'boolean' ? plan.music : !text(plan.setByParentId);
        card.appendChild(el('span', 'ft-plan-card__label', t('study.planner.music', 'Music while studying')));
        card.appendChild(choiceRow([[true, t('study.on', 'On')], [false, t('study.off', 'Off')]], music,
            value => planPatch({ ...plan, music: value }), t('study.planner.music', 'Music while studying'), editable));
        card.appendChild(el('p', 'ft-plan-card__hint', t('study.music.body', 'Songs keep playing. Podcasts follow your study list, and music videos play as audio only.')));

        card.appendChild(el('span', 'ft-plan-card__label', t('study.planner.rounds', 'Rounds')));
        const preset = round === 25 && rest === 5 ? 25 : round === 50 && rest === 10 ? 50 : 0;
        card.appendChild(choiceRow([[25, t('study.planner.round25', '25 / 5 min')], [50, t('study.planner.round50', '50 / 10 min')]], preset,
            value => focusPatch({ roundMinutes: value, breakMinutes: value === 50 ? 10 : 5 }), t('study.planner.rounds', 'Rounds'), editable));
        card.appendChild(stepperRow(t('study.roundLength', 'Study round'), t('study.minutes', '{minutes} min', { minutes: round }), { enabled: editable,
            lessOk: round > 10, moreOk: round < 120,
            onLess: () => focusPatch({ roundMinutes: Math.max(10, round - 5) }), onMore: () => focusPatch({ roundMinutes: Math.min(120, round + 5) }) }));
        card.appendChild(stepperRow(t('study.breakLength', 'Break'), rest === 0 ? t('study.noBreak', 'No break') : t('study.minutes', '{minutes} min', { minutes: rest }), { enabled: editable,
            lessOk: rest > 0, moreOk: rest < 30,
            onLess: () => focusPatch({ breakMinutes: Math.max(0, rest - 5) }), onMore: () => focusPatch({ breakMinutes: Math.min(30, rest + 5) }) }));
        page.appendChild(card);

        // The daily limit (addLimit).
        const limitCard = el('section', 'ft-home-card ft-plan-card');
        limitCard.appendChild(el('h4', 'ft-card-title', limit !== null ? t('study.limit.at', 'Nothing plays after {time}', { time: clockLabel(limit) }) : t('study.limit.none', 'No daily limit')));
        if (editable) {
            limitCard.appendChild(el('p', 'ft-plan-card__hint', limit === null
                ? t('study.limit.bodyNone', 'Tap + to choose a time. After it, nothing plays until midnight.')
                : t('study.limit.body', 'Drag the grey limit handle on the plan, or step it here. After the limit, nothing plays until midnight.')));
            const endOfStudy = end % 1440;
            const limitRow = stepperRow(t('study.section.limit', 'Daily limit'), limit === null ? t('study.limit.noLimit', 'No limit') : clockLabel(limit), {
                lessOk: limit !== null, moreOk: limit === null || limit + STEP <= 1440 - STEP,
                onLess: () => {
                    const next = { ...plan };
                    if (limit - STEP < Math.max(endOfStudy, 0)) delete next.limit; else next.limit = hhmm(limit - STEP);
                    planPatch(next);
                },
                onMore: () => planPatch({ ...plan, limit: hhmm(limit === null ? Math.max(endOfStudy, 20 * 60) : limit + STEP) })
            });
            liveOutputs.limit = limitRow.querySelector('output');
            limitCard.appendChild(limitRow);
        }
        const limitWrap = el('div', 'ft-home-section');
        limitWrap.append(sectionTitle(t('study.section.limit', 'Daily limit')), limitCard);
        page.appendChild(limitWrap);
        host.replaceChildren(page);
        return page;
    }

    /**
     * The end card (showEndCard): the ring closes into a scalloped sage seal, Kriti jumps onto its rim
     * and settles with her medal, "{n} min studied. That counts." with a crayon underline, the rounds,
     * the week, Done and Plan tomorrow. The page is flat sage. Shown once.
     */
    let endCardShown = null;
    function endCard(ended, state, { onDone, onPlan } = {}) {
        const card = el('section', 'ft-endcard');
        card.setAttribute('role', 'status');
        const close = button('', 'ft-endcard__close', () => onDone?.());
        close.appendChild(icon('close'));
        close.setAttribute('aria-label', t('study.end.done', 'Done'));
        card.appendChild(close);
        const roundsText = plural('study.end.rounds', ended.rounds, '{count} round', '{count} rounds');
        const stage = el('div', 'ft-endcard__stage');
        const seal = svgNode('svg', { viewBox: '0 0 236 236', class: 'ft-seal', role: 'img',
            'aria-label': t('study.end.seal', 'Session sealed: {minutes} min studied in {rounds}.', { minutes: ended.studiedMinutes, rounds: roundsText }) });
        // A 22-point scalloped rosette, like a wax seal.
        let d = '';
        const r1 = 118 * 0.95; const r2 = 118 * 0.88;
        for (let i = 0; i <= 176; i += 1) {
            const angle = (i / 176) * 2 * Math.PI;
            const r = (r1 + r2) / 2 + ((r1 - r2) / 2) * Math.cos(22 * angle);
            d += `${i ? 'L' : 'M'}${(118 + r * Math.cos(angle)).toFixed(1)} ${(118 + r * Math.sin(angle)).toFixed(1)}`;
        }
        seal.appendChild(svgNode('path', { d: `${d}Z`, class: 'ft-seal__rim' }));
        seal.appendChild(svgNode('circle', { cx: 118, cy: 118, r: 118 * 0.81, class: 'ft-seal__dots' }));
        const parts = array(ended.perRound);
        const total = parts.reduce((sum, item) => sum + item.minutes, 0) || 1;
        const r = 118 * 0.66;
        const circumference = 2 * Math.PI * r;
        const gap = parts.length > 1 ? 0.02 * circumference : 0;
        let offset = 0;
        for (const item of parts.length ? parts : [{ minutes: 1 }]) {
            const length = (item.minutes / total) * circumference;
            seal.appendChild(svgNode('circle', { cx: 118, cy: 118, r: r.toFixed(2), class: 'ft-seal__arc',
                'stroke-dasharray': `${Math.max(1, length - gap).toFixed(1)} ${circumference.toFixed(1)}`, 'stroke-dashoffset': (-offset).toFixed(1),
                transform: 'rotate(-90 118 118)' }));
            if (parts.length > 1 && offset > 0) {
                const angle = (offset / circumference) * 2 * Math.PI - Math.PI / 2;
                seal.appendChild(svgNode('circle', { cx: (118 + r * Math.cos(angle)).toFixed(1), cy: (118 + r * Math.sin(angle)).toFixed(1), r: 7, class: 'ft-seal__bead' }));
            }
            offset += length;
        }
        const number = svgNode('text', { x: 118, y: 124, class: 'ft-seal__number' });
        number.textContent = String(ended.studiedMinutes);
        const label = svgNode('text', { x: 118, y: 150, class: 'ft-seal__label' });
        label.textContent = t('study.end.studied', 'min studied');
        seal.append(number, label);
        stage.appendChild(seal);
        const fresh = endCardShown !== ended.start;
        endCardShown = ended.start;
        if (fresh) card.classList.add('is-fresh');
        const Mascots = root.FilterTubeMascots;
        const kriti = companionArt(fresh && motionAllowed() ? 'kritiJump' : 'kritiMedal', 'ft-endcard__kriti');
        if (kriti) {
            stage.appendChild(kriti);
            if (fresh && motionAllowed()) {
                // Her jump lands as the seal stamps, then she settles with her medal.
                try {
                    Mascots.playSheet?.(kriti, 'kritiJump', { onDone: () => setTimeout(() => {
                        const file = Mascots.stillImage?.('kritiMedal');
                        const api = runtime();
                        if (file) kriti.src = api?.runtime?.getURL ? api.runtime.getURL(`assets/images/mascots/${file}`) : `../assets/images/mascots/${file}`;
                    }, 120) });
                } catch (e) { }
            }
        }
        card.appendChild(stage);
        if (fresh) { try { Mascots?.playSound?.('stamp'); } catch (e) { } }
        const headline = el('h3', 'ft-endcard__headline', t('study.end.headline', '{minutes} min studied. That counts.', { minutes: ended.studiedMinutes }));
        card.appendChild(headline);
        if (parts.length > 1) {
            const list = el('div', 'ft-home-card ft-endcard__rounds');
            for (const item of parts) {
                const row = el('div', 'ft-endcard__round');
                row.append(el('span', 'ft-endcard__bead'), el('span', '', t('study.end.round', 'Study, round {round}', { round: item.round })),
                    el('span', 'ft-study-muted', t('study.end.minutes', '{minutes} min', { minutes: item.minutes })));
                list.appendChild(row);
            }
            card.appendChild(list);
        }
        if (state && state.week) card.appendChild(weekCard(state));
        const actions = el('div', 'ft-endcard__actions');
        actions.appendChild(button(t('study.end.done', 'Done'), 'btn-primary ft-hero__primary', () => onDone?.()));
        if (onPlan) actions.appendChild(button(t('study.end.planTomorrow', 'Plan tomorrow'), 'ft-link-button', () => onPlan()));
        card.appendChild(actions);
        return card;
    }

    /**
     * Android StudyStateTheme: the page takes the colour of the moment (sage before and in a round, a
     * deeper sage in its last five minutes, sun on a break, flat sage at the end, panel in the evening;
     * night is navy with a thin state band). Both themes' colours go on as custom properties, so a theme
     * switch needs no redraw; they cross-fade over 450 ms. Returns the page state.
     */
    function paintPage(host, state, ended) {
        const Engine = engine();
        const page = host?.closest?.('.ft-study-card') || host;
        const at = Date.now();
        const value = object(state);
        if (!Engine?.pagePalette || !page?.style) return 'IDLE';
        const pageState = Engine.pageState(value.state === 'STUDY' ? Number(value.until) : null, value.state === 'BREAK', !!ended, at);
        const evening = Engine.pageEvening(new Date(at).getHours());
        const css = color => `#${(color & 0xFFFFFF).toString(16).padStart(6, '0')}`;
        for (const [theme, night] of [['light', false], ['dark', true]]) {
            const palette = Engine.pagePalette(pageState, night, evening && !night);
            page.style.setProperty(`--ft-page-top-${theme}`, css(palette.top));
            page.style.setProperty(`--ft-page-bottom-${theme}`, css(palette.bottom));
            page.style.setProperty(`--ft-page-fade-${theme}`, palette.fadePx ? `${palette.fadePx}px` : '100%');
            page.style.setProperty(`--ft-page-edge-${theme}`, css(palette.cardEdge));
        }
        page.dataset.studyPage = pageState.toLowerCase().replace('_', '-');
        return pageState;
    }

    /** The page header (buildScaffold): back on the plan page, the title, and the pack tag. */
    function pageHeader(data, ctx) {
        const head = el('div', 'ft-study-head');
        if (ctx.mode === 'plan') {
            const back = button('', 'ft-study-head__back', () => ctx.setMode('home'));
            back.appendChild(icon('back'));
            back.setAttribute('aria-label', t('askParent.back', 'Back'));
            head.appendChild(back);
        }
        // Home's title is the page header's own ("Study and focus"); the plan page names itself.
        const title = el('h3', 'ft-study-head__title', ctx.mode === 'plan' ? t('study.dash.changePlan', 'Change plan') : '');
        if (ctx.mode !== 'plan') title.setAttribute('aria-hidden', 'true');
        head.appendChild(title);
        const tag = packsLabel(data.state);
        if (tag && ctx.mode !== 'plan') head.appendChild(el('span', 'ft-study-head__tag', tag));
        return head;
    }

    /** The page redraws every second on a break: keyboard focus stays on the same control. */
    function replaceKeepingFocus(host, view) {
        const active = root.document?.activeElement;
        const focusKey = active && host.contains?.(active) ? active.dataset?.ftFocusKey : '';
        const key = active && host.contains?.(active) && active.tagName === 'BUTTON' ? `${active.className}|${active.textContent}|${active.getAttribute('aria-label') || ''}` : null;
        host.replaceChildren(view);
        if (focusKey) {
            // A slider handle or the length slider keeps the keyboard after the page redraws.
            try { view.querySelector(`[data-ft-focus-key="${focusKey}"]`)?.focus({ preventScroll: true }); } catch (e) { }
            return;
        }
        if (!key) return;
        const match = Array.from(view.querySelectorAll('button')).find(node => `${node.className}|${node.textContent}|${node.getAttribute('aria-label') || ''}` === key);
        try { match?.focus({ preventScroll: true }); } catch (e) { }
    }

    /**
     * After Skip break the clock still says BREAK until the break's own end; the home shows what the app
     * shows (StudyRuntime.skipBreak moves the session on): the next round, running now, to its new end.
     */
    function effectiveState(state) {
        const value = object(state);
        if (value.state !== 'BREAK' || !value.breakSkipped) return value;
        const now = Date.now();
        const round = array(value.segments).find(item => item.kind === 'STUDY' && item.start <= now && now < item.end)
            || array(value.segments).find(item => item.kind === 'STUDY' && item.end > now);
        return { ...value, state: 'STUDY', round: round?.round || (Number(value.round) || 0) + 1, until: round ? round.end : value.until, canSkipBreak: false };
    }

    function renderDashboard(host, data, ctx) {
        data = { ...data, state: effectiveState(data.state) };
        const state = object(data.state);
        const study = object(state.study);
        const role = homeRole(data);
        const ended = state.sessionEnded && !running(state) ? state.sessionEnded : null;
        const pageState = paintPage(host, state, !!ended);
        const view = el('div', 'ft-study-home');
        view.dataset.mode = ctx.mode;
        const local = { ...ctx, pageState };
        if (ended && role === 'self' && ctx.mode !== 'plan') {
            const seen = () => send({ action: 'FilterTube_StudyAckSessionEnd' });
            const canPlan = !state.setByParentId && !text(object(study.plan).setByParentId) && isObject(study.plan);
            view.appendChild(endCard(ended, state, {
                onDone: async () => { await seen(); ctx.refresh(); },
                onPlan: canPlan ? async () => { await seen(); ctx.setMode('plan'); } : null
            }));
            replaceKeepingFocus(host, view);
            return;
        }
        view.appendChild(pageHeader(data, ctx));
        if (ctx.mode === 'plan') {
            const holder = el('div', 'ft-study-plan-host');
            view.appendChild(holder);
            const parentPlan = text(object(study.plan).setByParentId) || state.setByParentId;
            const editable = role === 'self' && !parentPlan && !text(object(study.lock).setByParentId) && state.lockMode !== 'locked' && !state.lock;
            renderPlanPage(holder, {
                study, state, editable, parentName: data.parentName, toastHost: host,
                readOnlyLabel: role === 'child' || parentPlan ? setByLabel(data.parentName) : '',
                onPatch: async patch => { const result = await send({ action: 'FilterTube_StudyUpdate', patch }); await ctx.refresh(); return result; }
            });
            replaceKeepingFocus(host, view);
            return;
        }
        view.appendChild(heroCard(data, local));
        if (isObject(study.plan) && !ended) {
            // Study length: today's plan as one slider, right under the hero (owner, 2026-11-17).
            const lengthCard = el('section', 'ft-home-card ft-length-card');
            mountLengthSlider(lengthCard, { study, state: { ...state, parentName: data.parentName }, onPatch: async patch => {
                const result = await send({ action: 'FilterTube_StudyUpdate', patch });
                if (result?.ok !== false) ctx.refresh();
                return result;
            } });
            view.appendChild(lengthCard);
        }
        const resume = continueRow(state);
        if (resume) view.appendChild(resume);
        if (state.weekView) view.appendChild(weekCard(state));
        if (role === 'child') {
            const managed = !!(state.setByParentId || text(object(study.plan).setByParentId) || text(object(study.lock).setByParentId));
            if (managed && data.time?.isChild) {
                const ask = el('section', 'ft-home-card ft-ask-card');
                ask.appendChild(askForTime(data.time, ctx.refresh));
                view.appendChild(ask);
            }
        }
        for (const part of [linksCard(data, local), preferencesCard(data, local), familyCard(data, local)]) if (part) view.appendChild(part);
        // What an extension can't cover (review 4.4): said plainly, never enforced from here.
        if (state.incognitoAllowed === false && (state.study || running(state))) {
            const note = el('section', 'ft-home-card ft-study-coverage');
            note.setAttribute('role', 'note');
            note.append(el('strong', '', t('study.coverage.privateTitle', 'Private windows aren\'t covered')),
                el('p', 'ft-study-muted', t('study.coverage.privateBody', 'FilterTube isn\'t allowed in private windows, so study rules stop there. Turn on "Allow in private" for FilterTube in your browser\'s extension settings.')),
                el('p', 'ft-study-muted', t('study.coverage.familyPolicy', 'On a child\'s device, a browser policy can keep FilterTube installed and turn private windows off. Ask whoever manages the device about ExtensionSettings and IncognitoModeAvailability.')));
            view.appendChild(note);
        }
        replaceKeepingFocus(host, view);
    }
    /**
     * "Ask for time" (Android StudyFamilyUi.addAskForTime): the child's request line, then the button, or
     * the sheet: How long? 10, 20 or 30 min, an optional reason, Send request. Nothing is granted until a
     * parent answers.
     */
    function askForTime(time, refresh) {
        const box = el('div', 'ft-study-ask');
        box.setAttribute('data-ft-study-ask-time', 'true');
        const name = text(time.parentName) || t('askParent.parentFallback', 'Your parent');
        const latest = object(time.latest);
        const pending = latest.status === 'pending' && Number(latest.expiresAt) > Date.now();
        const line = pending
            ? t('study.ask.waiting', 'Asked for {minutes} min · Waiting for {name}', { minutes: latest.minutes, name })
            : latest.status === 'declined' && Date.now() - Number(latest.decidedAt || 0) < 6 * 60 * 60 * 1000
                ? t('study.ask.declined', '{name} said not now. You can ask again later.', { name })
                : latest.status === 'expired' && Date.now() - Number(latest.expiresAt || 0) < 60 * 60 * 1000
                    ? t('study.ask.expired', 'Your request ran out. You can ask again.')
                    : '';
        if (line) box.appendChild(el('p', 'ft-study-ask__line', line));
        if (pending && time.route === 'relay') {
            box.appendChild(el('p', 'ft-study-muted', t('askParent.waitingRemote', '{name} will see it next time their device connects.', { name })));
        }
        const row = el('div', 'ft-study-actions');
        if (pending) {
            row.appendChild(button(t('study.ask.cancel', 'Cancel request'), 'btn-secondary', async () => {
                await send({ action: 'FilterTube_AskParentTimeCancel', requestId: latest.id });
                refresh();
            }));
        } else if (time.canAsk) {
            row.appendChild(button(t('study.ask.forTime', 'Ask for time'), 'btn-primary', () => box.replaceChildren(askForTimeSheet(time, name, refresh))));
        } else {
            box.appendChild(el('p', 'ft-study-muted', t('askParent.noParent', 'No parent is linked yet, so this can\'t be sent.')));
        }
        box.appendChild(row);
        return box;
    }

    function askForTimeSheet(time, name, refresh) {
        const sheet = el('div', 'ft-study-ask__sheet');
        sheet.setAttribute('role', 'group');
        sheet.appendChild(el('h5', 'ft-study-ask__title', t('study.ask.title', 'Ask for more time')));
        sheet.appendChild(el('p', 'ft-study-muted', t('study.ask.body', '{name} decides. You\'ll see the answer here.', { name })));
        let minutes = 20;
        const length = segmented([10, 20, 30].map(value => [value, t('study.minutes', '{minutes} min', { minutes: value })]), minutes,
            value => { minutes = value; mark(length, value); }, t('study.ask.howLong', 'How long?'));
        const reason = el('input', 'text-input ft-study-ask__reason');
        reason.type = 'text';
        reason.maxLength = 80;
        reason.placeholder = t('study.ask.reasonHint', 'For example: finishing a lecture');
        reason.setAttribute('aria-label', t('study.ask.reason', 'Why? (optional)'));
        const status = el('p', 'ft-study-muted', '');
        status.setAttribute('role', 'status');
        const actions = el('div', 'ft-study-actions');
        actions.appendChild(button(t('study.ask.notNow', 'Not now'), 'btn-secondary', () => refresh()));
        const go = button(t('study.ask.send', 'Send request'), 'btn-primary', async () => {
            go.disabled = true;
            const result = await send({ action: 'FilterTube_AskParentTimeAsk', minutes, reason: reason.value });
            go.disabled = false;
            if (result?.type === 'already_waiting') status.textContent = t('study.ask.already', 'You already asked. Wait for the answer, or cancel it first.');
            else if (result?.ok) refresh();
            else status.textContent = t('askParent.noParent', 'No parent is linked yet, so this can\'t be sent.');
        });
        actions.appendChild(go);
        sheet.append(field(t('study.ask.howLong', 'How long?'), length), field(t('study.ask.reason', 'Why? (optional)'), reason), status, actions);
        return sheet;
    }

    /** A count with its plural form ("9 channels"), from key.one / key.other / key.<category>. */
    function plural(key, count, fallbackOne, fallbackOther) {
        let category = count === 1 ? 'one' : 'other';
        try { category = new Intl.PluralRules(language()).select(count); } catch (e) { }
        const values = { count };
        try {
            const exact = root.FilterTubeUiLocalization?.text?.(`${key}.${category}`, values);
            if (typeof exact === 'string' && exact.trim()) return exact;
        } catch (e) { }
        return t(`${key}.${count === 1 ? 'one' : 'other'}`, count === 1 ? fallbackOne : fallbackOther, values);
    }

    /**
     * "How search works while studying" (Android StudySearchExplainer): one short card, nothing to tap.
     * The plan's channel count, two of its subjects and two example searches; a child is told to ask a
     * parent for more. Null without an active pack.
     */
    function searchExplainerCard(study, catalog, child, precomputed = null) {
        const Engine = engine();
        if (!array(object(study).activePackIds).length) return null;
        const content = isObject(precomputed) ? { channels: Number(precomputed.channels) || 0, topics: array(precomputed.topics), examples: array(precomputed.examples) }
            : (Engine?.searchExplainer ? Engine.searchExplainer(study, catalog) : null);
        if (!content) return null;
        if (!content.channels && !content.topics.length) return null;
        const channels = plural('study.searchHow.channels', content.channels, '{count} channel', '{count} channels');
        const lines = [content.topics.length
            ? t('study.searchHow.body', 'While you study, search shows lessons from your {channels} and your topics ({topics}). Anything else waits until study ends.',
                { channels, topics: `${content.topics.map(topic => (Engine?.topicLabel ? Engine.topicLabel(topic, language()) : topic)).join(', ')}…` })
            : t('study.searchHow.bodyNoTopics', 'While you study, search shows lessons from your {channels}. Anything else waits until study ends.', { channels })];
        if (content.examples.length >= 2) lines.push(t('study.searchHow.try', 'Try “{first}” or “{second}”.', { first: content.examples[0], second: content.examples[1] }));
        if (child) lines.push(t('study.searchHow.askParent', 'Ask a parent for more.'));
        const box = el('div', 'ft-study-explainer');
        box.setAttribute('data-ft-study-search-explainer', 'true');
        box.appendChild(el('h5', 'ft-study-explainer__title', t('study.searchHow.title', 'How search works while studying')));
        box.appendChild(el('p', 'ft-study-explainer__body', lines.join(' ')));
        return box;
    }

    function mark(group, value) {
        const items = Array.from(group.querySelectorAll('button'));
        items.forEach((node, index) => {
            const on = String(group.__values?.[index] ?? '') === String(value);
            node.classList.toggle('is-on', on);
            node.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    async function loadCatalog() {
        try { return await packsApi()?.load?.(); } catch (e) { return null; }
    }

    function mountDashboard(host) {
        if (!host) return null;
        let catalog = null;
        let timer = 0;
        let mode = 'home';
        let last = null;
        const ctx = {
            get mode() { return mode; },
            catalog: null,
            children: [],
            redraw: false,
            refresh: () => refresh(),
            redrawHome: () => draw(true),
            setMode: next => {
                mode = next === 'plan' ? 'plan' : 'home';
                draw(false);
                try { host.closest('.ft-study-card')?.scrollIntoView({ block: 'start', behavior: motionAllowed() ? 'smooth' : 'auto' }); } catch (e) { }
            },
            toast: message => notify(host, message, null),
            openSetup: anchor => {
                const study = object(last?.state?.study);
                openSetup(anchor && anchor.isConnected ? anchor : host.firstChild || host, {
                    study, catalog, isSelf: true,
                    onPatch: change => send({ action: 'FilterTube_StudyUpdate', patch: change }),
                    onStart: (minutes, lock) => send({ action: 'FilterTube_StudyStartSession', minutes, lock }),
                    onClose: () => refresh()
                });
            },
            // Self-Control lives in Settings (Android SettingsSectionActivity CATEGORY_SELF_CONTROL).
            openSelfControl: () => { try { root.FilterTubeOpenSelfControl?.(); } catch (e) { } },
            openFamily: childId => { try { root.FilterTubeOpenStudyFamily?.(childId); } catch (e) { } }
        };
        function draw(redraw) {
            if (!last) return;
            ctx.redraw = !!redraw;
            ctx.catalog = catalog;
            try { ctx.children = array(root.FilterTubeStudyChildren?.()); } catch (e) { ctx.children = []; }
            renderDashboard(host, last, ctx);
            ctx.redraw = false;
        }
        async function refresh() {
            // Never redraw over setup while someone is in it; it refreshes when it closes.
            if (host.dataset.ftStudySetupOpen === 'true') { clearTimeout(timer); timer = setTimeout(refresh, 30000); return; }
            const state = await send({ action: 'FilterTube_StudyGetState' });
            if (!state || state.ok === false) { host.hidden = true; return; }
            host.hidden = false;
            if (!catalog) catalog = await loadCatalog();
            const parentName = state.setByParentId || text(object(state.study?.plan).setByParentId)
                ? await profileName(state.setByParentId || state.study.plan.setByParentId) : '';
            // A child's "Ask for time" and who gave the minutes running now.
            const time = state.isChild ? await send({ action: 'FilterTube_AskParentTimeState' }) : null;
            const grantName = state.grantBy ? await profileName(state.grantBy) : '';
            const first = !last;
            last = { state, parentName, time, grantName: grantName || text(time?.parentName) };
            // Every refresh after the first keeps motion for moments only (the draw-on is once a day).
            draw(!first);
            clearTimeout(timer);
            // A break counts down by the second; a Gentle end too; otherwise the minute.
            const fast = Number.isFinite(state.endRequestedAt) || state.state === 'BREAK';
            timer = setTimeout(refresh, fast ? 1000 : 20000);
        }
        root.addEventListener?.('filtertube-ui-locale-changed', () => draw(true));
        // Until the first state arrives: Kriti's loading moment with one of the app's loading lines
        // (LoadingPersonality); none with the Companion off.
        try {
            const waiting = root.FilterTubeMascots?.moment?.('loading', { height: 96 });
            if (waiting && !host.firstChild) { waiting.classList.add('ft-study-loading'); host.appendChild(waiting); }
        } catch (e) { }
        try { runtime()?.storage?.onChanged?.addListener((changes, area) => { if (area === 'local' && (changes.ftProfilesV4 || changes.ftStudyRuntimeV1 || changes.ftAskParentV1 || changes.ftCompanionMode)) refresh(); }); } catch (e) { }
        refresh();
        return { refresh, setMode: ctx.setMode };
    }

    // ---- The parent's plan, inside the Family command centre -----------------------------------

    /** One <details> per protected profile the active parent manages: their plan and a lock. */
    function renderParentPlans(container, { children = [] } = {}) {
        if (!container || !children.length) return null;
        const section = el('section', 'ft-study-parent');
        section.appendChild(el('div', 'help-item-title', t('study.parent.title', 'Study plans')));
        section.appendChild(el('div', 'help-item-body', t('study.parent.body', 'Set when each protected profile studies. They can make the plan stricter, never looser.')));
        for (const child of children) {
            const details = el('details', 'ft-study-parent__child');
            details.dataset.childId = child.id;
            const summary = el('summary', '', t('study.parent.planFor', 'Study plan for {name}', { name: child.name }));
            const body = el('div', 'ft-study-parent__body');
            details.append(summary, body);
            details.addEventListener('toggle', () => { if (details.open) drawChild(body, child.id); });
            section.appendChild(details);
        }
        container.appendChild(section);
        return section;
    }

    /**
     * A parent's edit needs a fresh unlock of that parent (Android ParentModeChrome: a sensitive
     * unlock, the PIN typed in the last 5 minutes). On 'parent_unlock_required' this asks for the
     * PIN inline, checks it in the background, then sends the edit once more.
     */
    async function sendAsParent(host, message) {
        const first = await send(message);
        if (first?.error !== 'parent_unlock_required' || !first.parentId) return first;
        const pin = await askParentPin(host);
        if (!pin) return { ok: false, error: 'cancelled' };
        const auth = await send({ action: 'FilterTube_SessionPinAuth', profileId: first.parentId, pin });
        if (auth?.ok !== true) {
            return { ok: false, error: auth?.reason === 'rate_limited' ? 'pin_rate_limited' : 'pin_wrong' };
        }
        return send(message);
    }

    function askParentPin(host) {
        return new Promise(resolve => {
            const holder = host?.closest?.('.ft-study-parent__body') || host;
            if (!holder) { resolve(''); return; }
            holder.querySelector?.(':scope > .ft-study-unlock')?.remove();
            const form = el('form', 'ft-study-unlock');
            form.appendChild(el('div', 'help-item-title', t('study.parent.unlockTitle', 'Parent Controls')));
            form.appendChild(el('div', 'help-item-body', t('study.parent.unlockBody', 'This profile is PIN-protected. Enter its PIN to continue.')));
            const input = el('input', 'text-input');
            input.type = 'password';
            input.inputMode = 'numeric';
            input.autocomplete = 'off';
            input.placeholder = t('study.parent.enterPin', 'Enter PIN');
            input.setAttribute('aria-label', input.placeholder);
            const done = value => { form.remove(); resolve(value); };
            const actions = el('div', 'ft-study-unlock__actions');
            actions.append(button(t('popup.modal.cancel', 'Cancel'), 'btn-secondary', () => done('')),
                button(t('study.parent.unlock', 'Unlock'), 'btn-primary', () => done(text(input.value))));
            form.append(input, actions);
            form.addEventListener('submit', event => { event.preventDefault(); done(text(input.value)); });
            holder.prepend(form);
            try { input.focus(); } catch (e) { }
        });
    }

    async function drawChild(body, childId) {
        const [data, catalog] = await Promise.all([send({ action: 'FilterTube_StudyGetChild', profileId: childId }), loadCatalog()]);
        if (!data || data.ok === false) {
            body.replaceChildren(el('p', 'import-export-hint', errorText(data?.error)));
            return;
        }
        const redraw = () => drawChild(body, childId);
        const plannerHost = el('div', 'ft-study-planner-host');
        const lockRow = el('div', 'ft-study-parent__lock');
        if (data.lockedUntil && data.lockedUntil > Date.now()) {
            lockRow.appendChild(el('span', 'ft-study-locked', t('study.lockedUntil', 'Locked until {time}', { time: formatDayTime(data.lockedUntil) })));
            lockRow.appendChild(button(t('study.parent.endLock', 'End lock now'), 'btn-secondary', async () => {
                const result = await sendAsParent(body, { action: 'FilterTube_StudyEndParentLock', profileId: childId });
                if (result?.ok === false) notify(body, errorText(result.error), null);
                redraw();
            }));
        } else {
            const choice = el('select', 'text-input');
            choice.setAttribute('aria-label', t('study.parent.lockFor', 'Lock study for'));
            for (const [minutes, label] of [[60, t('study.parent.hours', '{hours} h', { hours: 1 })], [120, t('study.parent.hours', '{hours} h', { hours: 2 })],
                [240, t('study.parent.hours', '{hours} h', { hours: 4 })], [1440, t('study.parent.oneDay', '1 day')], [7 * 1440, t('study.parent.days', '{days} days', { days: 7 })]]) {
                const option = el('option', '', label);
                option.value = String(minutes);
                choice.appendChild(option);
            }
            lockRow.append(el('span', 'ft-study-field__label', t('study.parent.lockFor', 'Lock study for')), choice,
                button(t('study.parent.lockNow', 'Lock now'), 'btn-primary', async () => {
                    const result = await sendAsParent(body, { action: 'FilterTube_StudyStartParentLock', profileId: childId, minutes: Number(choice.value) });
                    if (result?.ok === false) notify(body, errorText(result.error), null);
                    redraw();
                }));
        }
        // A parent planning for a child (StudyFocusActivity, PARENT role): "Set by you", what they
        // study (into setup), then the same plan page the person sees for their own plan.
        const onPatch = async patch => {
            const result = await sendAsParent(body, { action: 'FilterTube_StudyUpdateChild', profileId: childId, patch });
            if (!body.dataset.ftStudySetupOpen) redraw();
            return result;
        };
        const links = el('section', 'ft-home-card ft-links');
        const packsRow = linkRow(t('study.link.packs', 'What you study'), packsValue(data.study || {}, catalog), () => {
            openSetup(packsRow, { study: data.study || {}, catalog, isSelf: false, profileId: childId, onPatch, onClose: redraw });
        });
        links.appendChild(packsRow);
        body.replaceChildren(links, plannerHost, lockRow);
        renderPlanPage(plannerHost, {
            study: data.study || {}, catalog, editable: true, toastHost: body, readOnlyLabel: t('study.setByYou', 'Set by you'), onPatch
        });
    }

    /** "45 min", "2 h", "2 h 30 min" (study_family_hours_minutes). */
    function lengthLabel(minutes) {
        if (minutes < 60) return t('study.minutes', '{minutes} min', { minutes });
        if (minutes % 60 === 0) return t('study.hoursChip', '{hours} h', { hours: minutes / 60 });
        return t('study.hoursMinutes', '{hours} h {minutes} min', { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
    }

    /** Whether this person may change the plan here (a parent's plan or lock, or a locked session, may not). */
    function planEditable(state) {
        const value = object(state);
        const study = object(value.study);
        return value.isChild !== true && !value.setByParentId && !text(object(study.plan).setByParentId)
            && !text(object(study.lock).setByParentId) && value.lockMode !== 'locked' && !value.lock;
    }

    /**
     * Study length (owner, 2026-11-17: "where is the slider to make study longer or shorter?"): today's plan as
     * one slider. The start stays; dragging moves the end in 15-minute steps (30 min at least, 23:45 at
     * most) and pushes the daily limit along, as the plan page's END handle does. −/+ step 15 minutes.
     * It saves once the slider rests, with the same FilterTube_StudyUpdate the plan page sends.
     *
     * mountLengthSlider(host, {study, state, compact, onPatch, onSetup, onChange}) -> {refresh, destroy}
     * - study/state: FilterTube_StudyGetState's `study` (and the whole state); omitted, it asks for them.
     * - compact: a card-sized version without the hint line.
     * - onPatch(patch) -> Promise<{ok}>: defaults to FilterTube_StudyUpdate.
     * - onSetup(): "Set up study" when there is no plan (default: the Study page).
     * - onChange({start, end, minutes}): after a save.
     */
    function mountLengthSlider(host, options = {}) {
        const Drag = planDrag();
        let alive = true;
        let saveTimer = null;
        const onPatch = options.onPatch || (patch => send({ action: 'FilterTube_StudyUpdate', patch }));
        const openStudy = options.onSetup || (() => {
            const nav = root.document?.querySelector?.('.nav-item[data-tab="study"]');
            if (nav) { nav.click(); return; }
            try { root.open(runtime()?.runtime?.getURL?.('html/tab-view.html#study') || '#study', '_blank'); } catch (e) { }
        });
        function draw(study, state) {
            if (!alive || !host) return;
            const box = el('div', `ft-length${options.compact ? ' is-compact' : ''}`);
            const plan = object(study).plan;
            const head = el('div', 'ft-length__head');
            const title = el('span', 'ft-length__title', t('study.length.title', 'Study length'));
            title.id = `ftLengthTitle${Math.random().toString(36).slice(2, 8)}`;
            head.appendChild(title);
            box.appendChild(head);
            if (!Drag || !isObject(plan) || minuteOf(plan.start) === null) {
                box.appendChild(button(t('study.setup.title', 'Set up study'), 'btn-secondary ft-length__setup', () => openStudy()));
                host.replaceChildren(box);
                return;
            }
            let draft = Drag.draftOf(plan);
            const saved = { ...draft };
            const editable = planEditable(state ? { ...state, study } : { study });
            const value = el('strong', 'ft-length__value');
            const range = el('span', 'ft-length__range');
            head.append(value);
            box.appendChild(range);
            const row = el('div', 'ft-length__row');
            const less = button('', 'ft-stepper__btn ft-length__step', () => set(Drag.lengthOf(draft) - Drag.SNAP_MINUTES, true));
            less.appendChild(icon('minus'));
            less.setAttribute('aria-label', t('study.planner.earlier', '{label}: 15 minutes earlier', { label: t('study.handle.end', 'Study ends') }));
            const more = button('', 'ft-stepper__btn ft-length__step', () => set(Drag.lengthOf(draft) + Drag.SNAP_MINUTES, true));
            more.appendChild(icon('plus'));
            more.setAttribute('aria-label', t('study.planner.later', '{label}: 15 minutes later', { label: t('study.handle.end', 'Study ends') }));
            const input = el('input', 'ft-length__input');
            input.type = 'range';
            input.min = String(Drag.MIN_STUDY_MINUTES);
            input.max = String(Drag.maxLength(draft));
            input.step = String(Drag.SNAP_MINUTES);
            input.setAttribute('aria-labelledby', title.id);
            input.dataset.ftFocusKey = 'study-length';
            row.append(less, input, more);
            box.appendChild(row);
            if (!options.compact) box.appendChild(el('p', 'ft-length__hint', editable
                ? t('study.length.hint', 'Drag to make study longer or shorter. It starts at the same time.')
                : setByLabel(state?.parentName)));
            const paint = () => {
                const minutes = Drag.lengthOf(draft);
                value.textContent = lengthLabel(minutes);
                range.textContent = timeRange(draft.start, draft.end);
                input.value = String(minutes);
                input.setAttribute('aria-valuetext', `${lengthLabel(minutes)}, ${timeRange(draft.start, draft.end)}`);
                input.style.setProperty('--ft-length-fill', `${(((minutes - Drag.MIN_STUDY_MINUTES) / Math.max(1, Drag.maxLength(draft) - Drag.MIN_STUDY_MINUTES)) * 100).toFixed(2)}%`);
                less.disabled = !editable || minutes <= Drag.MIN_STUDY_MINUTES;
                more.disabled = !editable || minutes >= Drag.maxLength(draft);
            };
            const save = async () => {
                if (draft.end === saved.end && draft.limit === saved.limit) return;
                const before = Drag.applyToPlan(plan, saved);
                const result = await onPatch({ plan: Drag.applyToPlan(plan, draft) });
                if (result?.ok === false) {
                    draft = { ...saved };
                    paint();
                    notify(host, errorText(result.error), null);
                    return;
                }
                saved.end = draft.end;
                saved.limit = draft.limit;
                notify(host, t('study.planner.saved', 'Saved'), async () => { await onPatch({ plan: before }); refresh(); });
                options.onChange?.({ start: draft.start, end: draft.end, minutes: Drag.lengthOf(draft) });
            };
            const set = (minutes, soon) => {
                draft = Drag.withLength(draft, minutes);
                paint();
                clearTimeout(saveTimer);
                saveTimer = setTimeout(save, soon ? 500 : 0);
            };
            input.disabled = !editable;
            input.addEventListener('input', () => { draft = Drag.withLength(draft, Number(input.value)); paint(); });
            // A pointer drag saves where it rests; arrow keys save a moment after the last press.
            input.addEventListener('change', () => set(Number(input.value), true));
            paint();
            host.replaceChildren(box);
        }
        async function refresh() {
            if (options.study) { draw(options.study, options.state || null); return; }
            const state = await send({ action: 'FilterTube_StudyGetState' });
            draw(object(state?.study), state);
        }
        refresh();
        return {
            refresh,
            destroy() { alive = false; clearTimeout(saveTimer); host?.replaceChildren?.(); }
        };
    }

    root.FilterTubeStudyUi = Object.freeze({
        t, phaseInfo, planSegments, segmentWords, setByLabel, packLabel, renderStrip, mountStrip,
        renderPlanPage, renderDashboard, mountDashboard, mountLengthSlider, showLooseningNotice, lengthLabel, dayRing, ringState, heroLines, renderParentPlans, searchExplainerCard, askForTime, applyCountryAccent, openSetup
    });

    // Any page that loads this file shows the sheet when the background puts a loosening back.
    try {
        const runtimeApi = root.chrome?.runtime || root.browser?.runtime;
        runtimeApi?.onMessage?.addListener?.(message => {
            if (message?.action === 'FilterTube_StudyLooseningRefused') showLooseningNotice(message.notice);
        });
    } catch (e) { }

    // Popup: the strip takes the banner slot under the header. Options page: the study card.
    function autoMount() {
        const doc = root.document;
        if (!doc) return;
        const timeStatus = doc.getElementById('ftManagedTimeStatusPopup');
        if (timeStatus && !doc.getElementById('ftStudyStripPopup')) {
            const strip = doc.createElement('div');
            strip.id = 'ftStudyStripPopup';
            strip.className = 'ft-study-strip';
            strip.hidden = true;
            timeStatus.insertAdjacentElement('afterend', strip);
            mountStrip(strip);
        }
        const dashboard = doc.getElementById('ftStudyDashboard');
        if (dashboard) mountDashboard(dashboard);
    }
    if (root.document) {
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', autoMount, { once: true });
        else autoMount();
    }
})(typeof window !== 'undefined' ? window : globalThis);
