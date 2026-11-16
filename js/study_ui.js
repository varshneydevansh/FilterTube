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

        if (editable) box.appendChild(packPicker(study, options.catalog, patch, options));
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
            parent_unlock_required: t('study.parent.unlockBody', 'This profile is PIN-protected. Enter its PIN to continue.'),
            pin_wrong: t('study.switch.pinWrong', 'That PIN didn\'t work. Try again.'),
            pin_rate_limited: t('dashboard.toast.pinRateLimited', 'Too many incorrect PIN attempts. Try again later.'),
            cancelled: t('study.parent.unlockBody', 'This profile is PIN-protected. Enter its PIN to continue.'),
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

    /**
     * The chosen packs as chips, and the way into setup (Android StudyFocusActivity "Change plan" ->
     * StudySetupActivity): what for, the list, a stream, review, ready. Setup saves through `patch`'s
     * onPatch, so a parent's plan for a child goes through the same fresh-PIN path.
     */
    function packPicker(study, catalog, patch, options = {}) {
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
        }
        if (!active.length) chips.appendChild(el('span', 'ft-study-muted', t('study.packs.none', 'No study pack yet')));
        wrap.appendChild(chips);
        if (!Packs || !catalog) return wrap;
        const row = el('div', 'ft-study-packs__add');
        const country = Packs.countryFromLocale(root.navigator?.language || '') || Packs.countryFromLocale(language());
        // The packs listed in setup are for `country`: the row wears its light accent (Android CountryAccent).
        if (Packs.countryAccent) applyCountryAccent(row, Packs.countryAccent(country), Packs);
        const open = button(active.length ? t('study.setup.change', 'Change') : t('study.setup.title', 'Set up study'),
            active.length ? 'btn-secondary ft-study-packs__open' : 'btn-primary ft-study-packs__open', () => {
                openSetup(open, {
                    study, catalog, isSelf: options.isSelf !== false, profileId: options.profileId || null,
                    onPatch: change => options.onPatch?.(change),
                    onStart: (minutes, lock) => send({ action: 'FilterTube_StudyStartSession', minutes, lock }),
                    onClose: () => options.onSetupClosed?.()
                });
            });
        row.appendChild(open);
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
                return s.mode === 'school' ? t('study.setup.kindSchool', 'School') : t('study.setup.kindSkill', 'Learn a skill');
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
            const parts = { kind: renderKind, list: s.mode === 'exam' ? renderExams : s.mode === 'school' ? renderSchool : renderSkills,
                stream: renderStream, review: renderReview, ready: renderReady }[s.step];
            const tail = parts(body);
            panel.replaceChildren(header(), body);
            if (tail) panel.appendChild(tail);
            s.direction = 0;
        }

        // ---- Step 1: what for
        function renderKind(body) {
            const card = el('div', 'ft-setup-country');
            const words = el('div', 'ft-setup-country__words');
            words.append(el('span', 'ft-study-muted', t('study.setup.where', 'You\'re studying in')), el('strong', '', countryName(s.country)));
            const select = el('select', 'text-input ft-setup-country__select');
            select.setAttribute('aria-label', t('study.setup.countryTitle', 'Where are you studying?'));
            const codes = Setup.countries(catalog).sort((a, b) => countryName(a).localeCompare(countryName(b), language()));
            // The chosen country leads the list (Android b753aa71f).
            const ordered = s.country && codes.includes(s.country) ? [s.country, ...codes.filter(code => code !== s.country)] : codes;
            const anywhere = el('option', '', `${t('study.setup.anywhere', 'Anywhere')} · ${t('study.setup.countryAnywhereBody', 'Only exams and lessons taken anywhere')}`);
            anywhere.value = '';
            select.appendChild(anywhere);
            for (const code of ordered) {
                const option = el('option', '', countryName(code));
                option.value = code;
                option.selected = code === s.country;
                select.appendChild(option);
            }
            if (!s.country) anywhere.selected = true;
            select.addEventListener('change', () => { s.country = select.value || null; s.board = null; s.alsoOpen = false; render(); });
            if (Packs.countryAccent) applyCountryAccent(card, Packs.countryAccent(s.country), Packs);
            card.append(words, select);
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
            const tiles = el('div', 'ft-setup-tiles');
            for (const [mode, name, line, doodle] of [
                ['exam', t('study.setup.kindExam', 'An exam'), examLine, 'seal'],
                ['school', t('study.setup.kindSchool', 'School'), schoolLine, 'note'],
                ['skill', t('study.setup.kindSkill', 'Learn a skill'), t('study.setup.kindSkillBody', 'Coding, maths and science. Add your own channels too.'), 'crayon']
            ]) {
                const tile = button('', `ft-setup-tile is-${mode}`, () => {
                    if (s.mode !== mode) { s.query = ''; s.alsoOpen = false; }
                    s.mode = mode;
                    go('list');
                });
                const copy = el('span', 'ft-setup-tile__copy');
                copy.append(el('strong', 'ft-setup-tile__name', name), el('span', 'ft-setup-tile__line', line));
                tile.append(copy, doodleArt(doodle, 'ft-setup-tile__doodle'));
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

    /**
     * The end card (Android StudyFocusActivity end card, StudyDayRingView seal): once a session leaves
     * the clock, the seal stamps with the minutes studied, Kriti jumps beside it, "{n} min studied.
     * That counts.", the rounds when there were several, Done and Plan tomorrow. Shown once: Done (or
     * Plan tomorrow) tells the background it was seen.
     */
    let endCardShown = null;
    function endCard(ended, { onDone, onPlan } = {}) {
        const ns = 'http://www.w3.org/2000/svg';
        const card = el('section', 'ft-study-endcard');
        card.setAttribute('role', 'status');
        const roundsText = plural('study.end.rounds', ended.rounds, '{count} round', '{count} rounds');
        const stage = el('div', 'ft-study-endcard__stage');
        const seal = root.document.createElementNS(ns, 'svg');
        seal.setAttribute('viewBox', '0 0 200 200');
        seal.setAttribute('class', 'ft-study-seal');
        seal.setAttribute('role', 'img');
        seal.setAttribute('aria-label', t('study.end.seal', 'Session sealed: {minutes} min studied in {rounds}.', { minutes: ended.studiedMinutes, rounds: roundsText }));
        // A scalloped rim: 24 bumps around the paper disc.
        const bumps = 24;
        let d = '';
        for (let i = 0; i <= bumps * 2; i += 1) {
            const angle = (Math.PI * i) / bumps - Math.PI / 2;
            const r = i % 2 === 0 ? 96 : 89;
            d += `${i ? 'L' : 'M'}${(100 + r * Math.cos(angle)).toFixed(1)} ${(100 + r * Math.sin(angle)).toFixed(1)}`;
        }
        const rim = root.document.createElementNS(ns, 'path');
        rim.setAttribute('d', `${d}Z`);
        rim.setAttribute('class', 'ft-study-seal__rim');
        seal.appendChild(rim);
        // The rounds close the circle: one sage arc each, with a small gap between.
        const parts = array(ended.perRound);
        const total = parts.reduce((sum, item) => sum + item.minutes, 0) || 1;
        const r = 70;
        const circumference = 2 * Math.PI * r;
        const gap = parts.length > 1 ? 0.011 * circumference : 0;
        let offset = 0;
        for (const item of parts.length ? parts : [{ minutes: 1 }]) {
            const length = (item.minutes / total) * circumference;
            const arc = root.document.createElementNS(ns, 'circle');
            arc.setAttribute('cx', '100'); arc.setAttribute('cy', '100'); arc.setAttribute('r', String(r));
            arc.setAttribute('class', 'ft-study-seal__arc');
            arc.setAttribute('stroke-dasharray', `${Math.max(1, length - gap).toFixed(1)} ${circumference.toFixed(1)}`);
            arc.setAttribute('stroke-dashoffset', (-offset).toFixed(1));
            arc.setAttribute('transform', 'rotate(-90 100 100)');
            seal.appendChild(arc);
            offset += length;
        }
        const number = root.document.createElementNS(ns, 'text');
        number.setAttribute('x', '100'); number.setAttribute('y', '104');
        number.setAttribute('class', 'ft-study-seal__number');
        number.textContent = String(ended.studiedMinutes);
        const label = root.document.createElementNS(ns, 'text');
        label.setAttribute('x', '100'); label.setAttribute('y', '128');
        label.setAttribute('class', 'ft-study-seal__label');
        label.textContent = t('study.end.studied', 'min studied');
        seal.append(number, label);
        stage.appendChild(seal);
        const Mascots = root.FilterTubeMascots;
        // The stamp, the jump and the sound play once per session end; the 30 s redraw shows it still.
        const fresh = endCardShown !== ended.start;
        endCardShown = ended.start;
        if (fresh) card.classList.add('is-fresh');
        const kriti = companionArt('kritiJump', 'ft-study-endcard__kriti', 128);
        if (kriti) {
            stage.appendChild(kriti);
            // Her jump lands as the seal stamps, then she rests on the last frame.
            if (fresh) { try { Mascots.playSheet?.(kriti, 'kritiJump'); } catch (e) { } }
        }
        card.appendChild(stage);
        if (fresh) { try { Mascots?.playSound?.('stamp'); } catch (e) { } }
        card.appendChild(el('h4', 'ft-study-endcard__headline', t('study.end.headline', '{minutes} min studied. That counts.', { minutes: ended.studiedMinutes })));
        if (parts.length > 1) {
            const list = el('div', 'ft-study-endcard__rounds');
            for (const item of parts) {
                const row = el('div', 'ft-study-endcard__round');
                row.append(el('span', 'ft-study-endcard__bead'), el('span', '', t('study.end.round', 'Study, round {round}', { round: item.round })),
                    el('span', 'ft-study-muted', t('study.end.minutes', '{minutes} min', { minutes: item.minutes })));
                list.appendChild(row);
            }
            card.appendChild(list);
        }
        const actions = el('div', 'ft-study-endcard__actions');
        actions.appendChild(button(t('study.end.done', 'Done'), 'btn-primary', () => onDone?.()));
        if (onPlan) actions.appendChild(button(t('study.end.planTomorrow', 'Plan tomorrow'), 'btn-secondary', () => onPlan()));
        card.appendChild(actions);
        return card;
    }

    /**
     * Android StudyStateTheme: the study card takes the colour of the moment (sage before and in a round,
     * a deeper sage in its last five minutes, sun on a break, flat sage at the end, panel in the
     * evening; night is navy with a thin state band). Both themes' colours go on as custom properties,
     * so a theme switch needs no redraw; they cross-fade over 450 ms.
     */
    function paintPage(host, state, ended) {
        const Engine = engine();
        const page = host?.closest?.('.ft-study-card') || host;
        if (!Engine?.pagePalette || !page?.style) return;
        const at = Date.now();
        const value = object(state);
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
        if (state.sessionEnded && state.state !== 'STUDY' && state.state !== 'BREAK') {
            const seen = () => send({ action: 'FilterTube_StudyAckSessionEnd' });
            const canPlan = !state.setByParentId && !text(object(study.plan).setByParentId) && isObject(study.plan);
            card.appendChild(endCard(state.sessionEnded, {
                onDone: async () => { await seen(); refresh(); },
                onPlan: canPlan ? async () => {
                    await seen();
                    await refresh();
                    try { host.querySelector('.ft-study-planner-host')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { }
                } : null
            }));
        }

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
        if (Number.isFinite(state.grantUntil)) {
            card.appendChild(el('p', 'ft-study-ask__line is-given', t('study.ask.given', '{name} gave you {minutes} min · until {time}',
                { name: data.grantName || data.parentName || t('askParent.parentFallback', 'Your parent'), minutes: state.grantMinutes, time: formatTime(state.grantUntil) })));
        }
        if (data.isChild === true || state.isChild === true) {
            const managed = !!(state.setByParentId || text(object(study.plan).setByParentId) || text(object(study.lock).setByParentId));
            if (managed && data.time?.isChild) card.appendChild(askForTime(data.time, refresh));
        }

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
            onPatch: async patch => { const result = await send({ action: 'FilterTube_StudyUpdate', patch }); await refresh(); return result; },
            onSetupClosed: refresh
        });
        const explainer = searchExplainerCard(study, catalog, data.isChild === true || state.isChild === true, state.searchHow);
        if (explainer) card.appendChild(explainer);
        // No "Start now" while the clock is on hold (Android 2280f4ee3).
        if (editable && state.state !== 'STUDY' && state.state !== 'BREAK' && !state.clockHold) card.appendChild(startNow(study, refresh));
        host.replaceChildren(card);
        paintPage(host, state, !!state.sessionEnded && state.state !== 'STUDY' && state.state !== 'BREAK');
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
            renderDashboard(host, { state, parentName, time, grantName: grantName || text(time?.parentName) }, { refresh, catalog });
            clearTimeout(timer);
            const ending = Number.isFinite(state.endRequestedAt);
            timer = setTimeout(refresh, ending ? 1000 : 30000);
        }
        root.addEventListener?.('filtertube-ui-locale-changed', refresh);
        try { runtime()?.storage?.onChanged?.addListener((changes, area) => { if (area === 'local' && (changes.ftProfilesV4 || changes.ftStudyRuntimeV1 || changes.ftAskParentV1)) refresh(); }); } catch (e) { }
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
        body.replaceChildren(plannerHost, lockRow);
        renderPlanner(plannerHost, {
            study: data.study || {}, catalog, editable: true, toastHost: body, isSelf: false, profileId: childId,
            onPatch: async patch => {
                const result = await sendAsParent(body, { action: 'FilterTube_StudyUpdateChild', profileId: childId, patch });
                if (!body.dataset.ftStudySetupOpen) redraw();
                return result;
            },
            onSetupClosed: redraw
        });
    }

    root.FilterTubeStudyUi = Object.freeze({
        t, phaseInfo, planSegments, segmentWords, setByLabel, packLabel, renderStrip, mountStrip,
        renderPlanner, renderDashboard, mountDashboard, renderParentPlans, searchExplainerCard, askForTime, applyCountryAccent, openSetup
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
