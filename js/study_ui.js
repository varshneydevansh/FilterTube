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
        const url = api?.runtime?.getURL ? api.runtime.getURL('html/tab-view.html#settings') : 'html/tab-view.html#settings';
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
        wrap.appendChild(button(t('study.end', 'End'), compact ? 'ft-study-btn' : 'btn-secondary', async () => {
            await send({ action: 'FilterTube_StudyEndSession' });
            onChange?.();
        }));
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
        const actions = el('span', 'ft-study-strip__actions');
        actions.appendChild(endControls(value, { onChange, compact: true }));
        actions.appendChild(button(t('study.open', 'Open'), 'ft-study-btn', openOptions));
        host.append(copy, actions);
    }

    function mountStrip(host) {
        if (!host) return null;
        let state = null;
        let parentName = '';
        let timer = 0;
        async function refresh() {
            const response = await send({ action: 'FilterTube_StudyGetState' });
            state = response && response.ok !== false ? response : null;
            parentName = state?.setByParentId ? await profileName(state.setByParentId) : '';
            draw();
        }
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

    function renderPlanBar(plan, focus, breakMode, { now = new Date(), onSelect } = {}) {
        const segments = planSegments(plan, focus);
        const from = segments[0]?.start ?? 0;
        const to = segments[segments.length - 1]?.end ?? 1440;
        const span = Math.max(1, to - from);
        const wrap = el('div', 'ft-study-bar');
        const track = el('div', 'ft-study-bar__track');
        track.setAttribute('role', 'list');
        for (const segment of segments) {
            const part = el('button', `ft-study-bar__seg is-${segment.kind}`);
            part.type = 'button';
            part.setAttribute('role', 'listitem');
            part.style.left = `${((segment.start - from) / span) * 100}%`;
            part.style.width = `${((segment.end - segment.start) / span) * 100}%`;
            const label = `${segmentName(segment.kind)}, ${clockLabel(segment.start)} – ${clockLabel(segment.end)}`;
            part.setAttribute('aria-label', label);
            part.title = label;
            part.addEventListener('click', () => onSelect?.(segment, label));
            track.appendChild(part);
        }
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        if (minutesNow >= from && minutesNow <= to) {
            const marker = el('span', 'ft-study-bar__now', '▼');
            marker.setAttribute('aria-hidden', 'true');
            marker.style.left = `${((minutesNow - from) / span) * 100}%`;
            track.appendChild(marker);
        }
        const scale = el('div', 'ft-study-bar__scale');
        scale.append(el('span', '', clockLabel(from)), el('span', '', clockLabel(to)));
        wrap.append(track, scale);
        return wrap;
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

    function timeRow(label, minutes, { min, max, disabled, onChange }) {
        const row = el('div', 'ft-study-time');
        const id = `ftStudyTime${Math.random().toString(36).slice(2, 8)}`;
        const name = el('label', 'ft-study-time__label', label);
        name.htmlFor = id;
        const slider = el('input', 'ft-study-time__slider');
        slider.type = 'range';
        slider.id = id;
        slider.min = String(min);
        slider.max = String(max);
        slider.step = String(STEP);
        slider.value = String(minutes);
        slider.disabled = !!disabled;
        // Screen readers hear "Study starts, 4:00 pm".
        slider.setAttribute('aria-valuetext', `${label}, ${clockLabel(minutes)}`);
        const value = el('output', 'ft-study-time__value', clockLabel(minutes));
        value.htmlFor = id;
        slider.addEventListener('input', () => { value.textContent = clockLabel(Number(slider.value)); });
        slider.addEventListener('change', () => onChange(Number(slider.value)));
        const minus = button('−15', 'ft-study-btn', () => onChange(Math.max(min, minutes - STEP)));
        const plus = button('+15', 'ft-study-btn', () => onChange(Math.min(max, minutes + STEP)));
        minus.setAttribute('aria-label', t('study.planner.earlier', '{label}: 15 minutes earlier', { label }));
        plus.setAttribute('aria-label', t('study.planner.later', '{label}: 15 minutes later', { label }));
        minus.disabled = plus.disabled = !!disabled;
        row.append(name, minus, slider, plus, value);
        return row;
    }

    /**
     * The planner. options: {study, editable, readOnlyLabel, catalog, onPatch(patch) -> Promise<{ok}>}.
     * Every change can be undone; there are no confirmation dialogs.
     */
    function renderPlanner(host, options) {
        const study = object(options.study);
        const editable = options.editable !== false;
        const plan = isObject(study.plan) ? study.plan : { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '16:00', end: '18:00' };
        const focus = object(study.focus);
        const breakMode = study.breakMode === 'normal' ? 'normal' : 'rest';
        const box = el('div', 'ft-study-planner');
        if (!editable && options.readOnlyLabel) box.appendChild(el('span', 'ft-study-chip is-parent', options.readOnlyLabel));

        const detail = el('p', 'ft-study-planner__detail', `${t('study.planner.rightNow', 'Right now')}: ${segmentWords(currentSegment(plan, focus), breakMode)}`);
        detail.setAttribute('aria-live', 'polite');
        box.appendChild(renderPlanBar(plan, focus, breakMode, {
            onSelect: (segment, label) => { detail.textContent = `${label}: ${segmentWords(segment, breakMode)}`; }
        }));
        box.appendChild(detail);

        const patch = async (change, undoChange) => {
            const result = await options.onPatch?.(change);
            if (result?.ok === false) {
                notify(options.toastHost || host, errorText(result.error), null);
                return;
            }
            notify(options.toastHost || host, t('study.planner.saved', 'Saved'), undoChange ? async () => { await options.onPatch?.(undoChange); } : null);
        };
        const planPatch = next => patch({ plan: next }, { plan: clone(study.plan ?? null) });

        if (editable) box.appendChild(packPicker(study, options.catalog, patch));
        else if (array(options.packs).length) box.appendChild(el('p', 'ft-study-planner__packs', array(options.packs).map(packLabel).join(', ')));

        const days = el('div', 'ft-study-days');
        days.setAttribute('role', 'group');
        days.setAttribute('aria-label', t('study.planner.days', 'Days'));
        const dayNames = dayLabels();
        DAY_KEYS.forEach((day, index) => {
            const on = array(plan.days).includes(day);
            const chip = button(dayNames[index], `ft-study-day${on ? ' is-on' : ''}`, () => {
                const next = on ? array(plan.days).filter(item => item !== day) : [...array(plan.days), day];
                planPatch({ ...plan, days: DAY_KEYS.filter(item => next.includes(item)) });
            });
            chip.setAttribute('aria-pressed', on ? 'true' : 'false');
            chip.disabled = !editable;
            days.appendChild(chip);
        });
        box.appendChild(days);

        const start = minuteOf(plan.start) ?? 16 * 60;
        const end = minuteOf(plan.end) ?? 18 * 60;
        const limit = minuteOf(plan.limit);
        box.appendChild(timeRow(t('study.planner.starts', 'Study starts'), start, { min: 0, max: 1440 - MIN_STUDY - STEP, disabled: !editable,
            onChange: value => planPatch({ ...plan, start: hhmm(value), end: hhmm(Math.max(end, value + MIN_STUDY)) }) }));
        box.appendChild(timeRow(t('study.planner.ends', 'Study ends'), end, { min: MIN_STUDY, max: 1440 - STEP, disabled: !editable,
            onChange: value => {
                const next = Math.max(value, start + MIN_STUDY);
                const changed = { ...plan, end: hhmm(next) };
                if (limit !== null && limit < next) changed.limit = hhmm(next);
                planPatch(changed);
            } }));
        const limitRow = el('div', 'ft-study-limit');
        const limitToggle = el('input');
        limitToggle.type = 'checkbox';
        limitToggle.id = `ftStudyLimit${Math.random().toString(36).slice(2, 8)}`;
        limitToggle.checked = limit !== null;
        limitToggle.disabled = !editable;
        const limitLabel = el('label', '', t('study.planner.dailyLimit', 'Nothing plays after a daily limit'));
        limitLabel.htmlFor = limitToggle.id;
        limitToggle.addEventListener('change', () => {
            const next = { ...plan };
            if (limitToggle.checked) next.limit = hhmm(Math.max(end, 20 * 60));
            else delete next.limit;
            planPatch(next);
        });
        limitRow.append(limitToggle, limitLabel);
        box.appendChild(limitRow);
        if (limit !== null) {
            box.appendChild(timeRow(t('study.planner.limitAt', 'Limit'), limit, { min: end, max: 1440 - STEP, disabled: !editable,
                onChange: value => planPatch({ ...plan, limit: hhmm(Math.max(value, end)) }) }));
        }

        const settings = el('div', 'ft-study-settings');
        const round = Number(focus.roundMinutes) >= 50 ? 50 : 25;
        settings.appendChild(field(t('study.planner.rounds', 'Rounds'), segmented([[25, t('study.planner.round25', '25 / 5 min')], [50, t('study.planner.round50', '50 / 10 min')]], round,
            value => editable && patch({ focus: { ...focus, roundMinutes: value, breakMinutes: value === 50 ? 10 : 5 } }, { focus: clone(focus) }), t('study.planner.rounds', 'Rounds'))));
        settings.appendChild(field(t('study.planner.duringBreaks', 'During breaks'), segmented([['rest', t('study.planner.restScreen', 'Rest screen')], ['normal', t('study.planner.normalVideos', 'Normal videos')]], breakMode,
            value => editable && patch({ breakMode: value }, { breakMode }), t('study.planner.duringBreaks', 'During breaks'))));
        const music = typeof plan.music === 'boolean' ? plan.music : !text(plan.setByParentId);
        settings.appendChild(field(t('study.planner.music', 'Music while studying'), segmented([[true, t('study.on', 'On')], [false, t('study.off', 'Off')]], music,
            value => editable && planPatch({ ...plan, music: value }), t('study.planner.music', 'Music while studying'))));
        if (!editable) settings.querySelectorAll('button').forEach(node => { node.disabled = true; });
        box.appendChild(settings);
        host.replaceChildren(box);
        return box;
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
            invalid_duration: t('study.error.duration', 'Choose a shorter time.')
        };
        return map[code] || t('study.error.generic', 'That didn\'t save. Try again.');
    }

    /** A short message with an optional Undo, in the page's toast style when there is one. */
    function notify(host, message, undo) {
        const holder = host?.closest?.('.ft-study-card, .ft-study-parent') || host;
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

    function packPicker(study, catalog, patch) {
        const Packs = packsApi();
        const wrap = el('div', 'ft-study-packs');
        const active = array(study.activePackIds);
        const edits = object(study.packEdits);
        const chips = el('div', 'ft-study-packs__chips');
        for (const id of active) {
            const pack = Packs?.packById(catalog, id);
            const variant = pack && Packs.packVariant ? Packs.packVariant(pack, object(edits[id]).variant) : null;
            const label = packLabel(pack ? { ...pack, variant } : { id });
            const chip = el('span', 'ft-study-chip', label);
            const remove = button('×', 'ft-study-chip__remove', () => patch({ activePackIds: active.filter(item => item !== id) }, { activePackIds: active }));
            remove.setAttribute('aria-label', t('study.packs.remove', 'Remove {pack}', { pack: label }));
            chip.appendChild(remove);
            chips.appendChild(chip);
            if (pack && array(pack.variants).length) {
                const select = el('select', 'text-input ft-study-variant');
                select.setAttribute('aria-label', t('study.packs.branch', 'Branch or stream'));
                for (const item of pack.variants) {
                    const option = el('option', '', localizedName(item.names, item.id));
                    option.value = item.id;
                    option.selected = variant?.id === item.id;
                    select.appendChild(option);
                }
                select.addEventListener('change', () => patch(
                    { packEdits: { ...edits, [id]: { ...object(edits[id]), variant: select.value } } }, { packEdits: clone(edits) }));
                chips.appendChild(select);
            }
        }
        if (!active.length) chips.appendChild(el('span', 'ft-study-muted', t('study.packs.none', 'No study pack yet')));
        wrap.appendChild(chips);
        if (!Packs || !catalog) return wrap;
        let tab = 'exams';
        const country = Packs.countryFromLocale(root.navigator?.language || '') || Packs.countryFromLocale(language());
        const row = el('div', 'ft-study-packs__add');
        const select = el('select', 'text-input');
        select.setAttribute('aria-label', t('study.packs.choose', 'Choose a study pack'));
        const fill = () => {
            select.replaceChildren();
            const first = el('option', '', t('study.packs.choose', 'Choose a study pack'));
            first.value = '';
            select.appendChild(first);
            for (const pack of Packs.forTab(catalog, country, tab)) {
                if (active.includes(pack.id)) continue;
                const option = el('option', '', Packs.packName(pack, language()));
                option.value = pack.id;
                select.appendChild(option);
            }
        };
        const tabs = segmented([['exams', t('study.packs.exams', 'Exams')], ['school', t('study.packs.school', 'School')],
            ['kids', t('study.packs.kids', 'Kids learning')]], tab, value => {
            tab = value;
            mark(tabs, value);
            fill();
        }, t('study.packs.kind', 'Pack type'));
        fill();
        select.addEventListener('change', () => {
            if (select.value) patch({ activePackIds: [...active, select.value] }, { activePackIds: active });
        });
        row.append(tabs, select);
        wrap.appendChild(row);
        // What Kids does during study: Kids learning packs show there; exam and class packs never do.
        const kidsNote = engine()?.kidsSetupNote ? engine().kidsSetupNote(active, catalog) : null;
        if (kidsNote) {
            wrap.appendChild(el('p', 'ft-study-muted ft-study-packs__kids', kidsNote === 'kids_learning'
                ? t('study.packs.kidsLearning', 'Kids learning for this age shows in Kids.')
                : t('study.packs.kidsHold', 'Kids keeps Kids videos and pauses at study time.')));
        }
        return wrap;
    }

    // ---- Dashboard (options page) -------------------------------------------------------------

    function ring(state) {
        const ns = 'http://www.w3.org/2000/svg';
        const value = object(state);
        const start = Number(value.segmentStart);
        const until = Number(value.until);
        let fraction = 0;
        if (Number.isFinite(until)) {
            const segment = array(value.segments).find(item => item.end === until);
            const from = segment ? segment.start : (Number.isFinite(start) ? start : Number(value.sessionStart));
            if (Number.isFinite(from) && until > from) fraction = Math.min(1, Math.max(0, (Date.now() - from) / (until - from)));
        }
        const svg = root.document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 120 120');
        svg.setAttribute('class', 'ft-study-ring__svg');
        svg.setAttribute('aria-hidden', 'true');
        const track = root.document.createElementNS(ns, 'circle');
        const fill = root.document.createElementNS(ns, 'circle');
        for (const circle of [track, fill]) {
            circle.setAttribute('cx', '60'); circle.setAttribute('cy', '60'); circle.setAttribute('r', '52');
            circle.setAttribute('fill', 'none'); circle.setAttribute('stroke-width', '10');
        }
        track.setAttribute('class', 'ft-study-ring__track');
        fill.setAttribute('class', 'ft-study-ring__fill');
        const length = 2 * Math.PI * 52;
        // The ring fills and never shrinks.
        fill.setAttribute('stroke-dasharray', `${(fraction * length).toFixed(1)} ${length.toFixed(1)}`);
        fill.setAttribute('transform', 'rotate(-90 60 60)');
        svg.append(track, fill);
        return svg;
    }

    function renderDashboard(host, data, { refresh, catalog }) {
        const state = object(data.state);
        const study = object(state.study);
        const info = phaseInfo(state);
        const card = el('div', 'ft-study-dashboard');
        const head = el('div', 'ft-study-dashboard__head');
        head.appendChild(el('h4', 'ft-study-dashboard__title', t('study.title', 'Study')));
        if (state.setByParentId) head.appendChild(el('span', 'ft-study-chip is-parent', setByLabel(data.parentName)));
        else if (array(state.packs).length) head.appendChild(el('span', 'ft-study-chip', packsLabel(state)));
        card.appendChild(head);

        const status = el('div', `ft-study-status is-${info.tone}`);
        const ringBox = el('div', 'ft-study-ring');
        ringBox.appendChild(ring(state));
        const center = el('div', 'ft-study-ring__center');
        if (state.state === 'STUDY' || state.state === 'BREAK') {
            center.appendChild(el('strong', '', t('study.ring.until', 'until {time}', { time: formatTime(state.sessionEnd || state.until) })));
            const left = minutesLeft(state);
            if (left !== null) center.appendChild(el('span', '', t('study.ring.minutesLeft', '{minutes} min left', { minutes: left })));
        } else {
            center.appendChild(el('strong', '', info.word));
        }
        ringBox.appendChild(center);
        const words = el('div', 'ft-study-status__words');
        words.appendChild(el('span', 'ft-study-status__word', info.word));
        words.appendChild(el('p', 'ft-study-status__line', info.line));
        if (state.clockHold) words.appendChild(el('p', 'import-export-hint', t('study.overlay.holdBody', 'The time or time zone on this device changed during a lock. Study continues when the clock is right again.')));
        if (state.failClosed && state.state === 'STUDY') words.appendChild(el('p', 'import-export-hint', t('study.overlay.unavailableBody', 'Your study videos can\'t load right now, so nothing plays until this study time ends.')));
        const actions = el('div', 'ft-study-actions');
        actions.appendChild(endControls(state, { onChange: refresh }));
        if (state.canSkipBreak && !state.breakSkipped) {
            actions.appendChild(button(t('study.overlay.skipBreak', 'Skip break'), 'btn-secondary', async () => { await send({ action: 'FilterTube_StudySkipBreak' }); refresh(); }));
        }
        words.appendChild(actions);
        status.append(ringBox, words);
        card.appendChild(status);

        if (state.weekView && state.week) {
            const week = el('div', 'ft-study-week');
            const circles = el('div', 'ft-study-week__days');
            const labels = dayLabels();
            array(state.week.days).forEach((day, index) => {
                const circle = el('span', `ft-study-week__day is-${day.fill}`);
                circle.title = `${labels[index]}: ${t('study.week.minutes', '{minutes} min', { minutes: day.minutes })}`;
                circle.setAttribute('aria-label', circle.title);
                circles.appendChild(circle);
            });
            week.append(el('span', 'ft-study-field__label', t('study.week.title', 'This week')), circles,
                el('span', 'ft-study-muted', state.week.daysStudied === 1
                    ? t('study.week.oneDay', '1 day studied this week')
                    : t('study.week.days', '{count} days studied this week', { count: state.week.daysStudied })));
            card.appendChild(week);
        }

        const plannerHost = el('div', 'ft-study-planner-host');
        const editable = !state.setByParentId && !text(object(study.plan).setByParentId) && !text(object(study.lock).setByParentId) && state.lockMode !== 'locked';
        card.appendChild(el('h4', 'ft-study-dashboard__subtitle', t('study.planner.title', 'Study plan')));
        card.appendChild(plannerHost);
        renderPlanner(plannerHost, {
            study, catalog, editable, packs: state.packs,
            readOnlyLabel: text(object(study.plan).setByParentId) ? setByLabel(data.parentName) : t('study.lockedUntil', 'Locked until {time}', { time: formatDayTime(state.lockedUntil) }),
            toastHost: card,
            onPatch: async patch => { const result = await send({ action: 'FilterTube_StudyUpdate', patch }); await refresh(); return result; }
        });
        if (editable && state.state !== 'STUDY' && state.state !== 'BREAK') card.appendChild(startNow(study, refresh));
        host.replaceChildren(card);
    }

    function startNow(study, refresh) {
        const box = el('div', 'ft-study-start');
        box.appendChild(el('h4', 'ft-study-dashboard__subtitle', t('study.start.title', 'Start now')));
        let minutes = 50;
        let mode = 'gentle';
        const length = segmented([[25, t('study.minutes', '{minutes} min', { minutes: 25 })], [50, t('study.minutes', '{minutes} min', { minutes: 50 })],
            [90, t('study.minutes', '{minutes} min', { minutes: 90 })], [120, t('study.minutes', '{minutes} min', { minutes: 120 })]], minutes, value => { minutes = value; mark(length, value); }, t('study.start.length', 'Session length'));
        const lock = segmented([['gentle', t('study.start.gentle', 'Gentle')], ['locked', t('study.start.locked', 'Locked')]], mode, value => {
            mode = value; mark(lock, value); hint.textContent = lockHint(value);
        }, t('study.start.lock', 'How it ends'));
        const hint = el('p', 'import-export-hint', lockHint(mode));
        const go = button(t('study.start.action', 'Start studying'), 'btn-primary', async () => {
            go.disabled = true;
            const result = await send({ action: 'FilterTube_StudyStartSession', minutes, lock: mode });
            go.disabled = false;
            if (result?.ok === false) notify(box, errorText(result.error), null);
            refresh();
        });
        go.disabled = !array(study.activePackIds).length;
        box.append(field(t('study.start.length', 'Session length'), length), field(t('study.start.lock', 'How it ends'), lock), hint, go);
        return box;
    }

    function lockHint(mode) {
        return mode === 'locked'
            ? t('study.start.lockedHint', 'Locked can\'t be ended early. It runs for 4 hours at most.')
            : t('study.start.gentleHint', 'Gentle can be ended after a 30-second pause.');
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
        async function refresh() {
            const state = await send({ action: 'FilterTube_StudyGetState' });
            if (!state || state.ok === false) { host.hidden = true; return; }
            host.hidden = false;
            if (!catalog) catalog = await loadCatalog();
            const parentName = state.setByParentId || text(object(state.study?.plan).setByParentId)
                ? await profileName(state.setByParentId || state.study.plan.setByParentId) : '';
            renderDashboard(host, { state, parentName }, { refresh, catalog });
            clearTimeout(timer);
            const ending = Number.isFinite(state.endRequestedAt);
            timer = setTimeout(refresh, ending ? 1000 : 30000);
        }
        root.addEventListener?.('filtertube-ui-locale-changed', refresh);
        try { runtime()?.storage?.onChanged?.addListener((changes, area) => { if (area === 'local' && (changes.ftProfilesV4 || changes.ftStudyRuntimeV1)) refresh(); }); } catch (e) { }
        refresh();
        return { refresh };
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
            const summary = el('summary', '', t('study.parent.planFor', 'Study plan for {name}', { name: child.name }));
            const body = el('div', 'ft-study-parent__body');
            details.append(summary, body);
            details.addEventListener('toggle', () => { if (details.open) drawChild(body, child.id); });
            section.appendChild(details);
        }
        container.appendChild(section);
        return section;
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
                const result = await send({ action: 'FilterTube_StudyEndParentLock', profileId: childId });
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
                    const result = await send({ action: 'FilterTube_StudyStartParentLock', profileId: childId, minutes: Number(choice.value) });
                    if (result?.ok === false) notify(body, errorText(result.error), null);
                    redraw();
                }));
        }
        body.replaceChildren(plannerHost, lockRow);
        renderPlanner(plannerHost, {
            study: data.study || {}, catalog, editable: true, toastHost: body,
            onPatch: async patch => {
                const result = await send({ action: 'FilterTube_StudyUpdateChild', profileId: childId, patch });
                redraw();
                return result;
            }
        });
    }

    root.FilterTubeStudyUi = Object.freeze({
        t, phaseInfo, planSegments, segmentWords, setByLabel, packLabel, renderStrip, mountStrip,
        renderPlanner, renderDashboard, mountDashboard, renderParentPlans
    });

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
