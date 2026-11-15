/* Study mode engine (3.6.2, Phase 2). Pure functions shared by the background worker, the content
 * scripts and the tests; the same rules as the Android engine:
 *
 * 1. studyClock(): the plan, the focus settings, the break mode and the clock give the state now
 *    (NORMAL, STUDY round i of n until, BREAK until, LIMIT) and the next transition. Nothing running is
 *    stored, so a device that was asleep or offline is still right.
 *    - A plan occurrence starts on each listed day at plan.start and ends at plan.end, the next day
 *      when end <= start (a session crossing midnight belongs to the day it started).
 *    - Rounds repeat roundMinutes of study then breakMinutes of break. The last round is clamped to the
 *      end: when no further round and break fits, that round runs to the end (cut short, or taking a
 *      leftover too short for another round), so a session never ends on a break.
 *    - plan.limit ("HH:MM", optional; the day planner's third handle, never before the end of study)
 *      starts LIMIT, which lasts until local midnight. `limitReached` (the daily minutes are used up)
 *      gives LIMIT outside study too.
 *    - A self-started session ({startedAt, endsAt}) is one more occurrence. `endedUntil` hides
 *      occurrences that end at or before it (a Gentle session ended early).
 * 2. studyEffectiveProfile(): during STUDY the active packs, with packEdits (and the chosen variant)
 *    applied, are the allow layer of Main and Kids; the block list plus each pack's blocked words still
 *    subtract (mode "whitelist", layered: true). Pack topics and pack blocked words match the video
 *    title only (titleOnly rows), never its description or channel name, as on Android. The user's own
 *    allowed channels stay (not under a parent's plan or lock with "pack channels only"); their allow
 *    keywords and allowed video ids are left out for the session, as in a Hard Whitelist session.
 *    A rest BREAK, LIMIT and a clock hold use the rest profile: allow mode with nothing allowed.
 *    Fail closed: a study round with no known pack (catalog failed, pack removed, empty pack list)
 *    uses the person's own allowed channels, or rest; never the normal rules. The master switch and
 *    comments can't be turned on during study.
 * 3. Progress helpers: minutes per device id and local date.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudyEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const NORMAL = 'NORMAL';
    const STUDY = 'STUDY';
    const BREAK = 'BREAK';
    const LIMIT = 'LIMIT';
    const MINUTE = 60 * 1000;
    const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const BREAK_NOTICE_MS = 2 * MINUTE;
    // A break waits for the video that is playing, for 5 minutes at most.
    const BREAK_WAIT_MAX_MS = 5 * MINUTE;
    const GENTLE_END_PAUSE_MS = 30 * 1000;
    const SELF_LOCK_MAX_MINUTES = 240;
    const PARENT_LOCK_MAX_MINUTES = 7 * 24 * 60;
    const STUDY_SOURCE = 'study_pack';
    // Pack topics: they match a video's title only, never its channel name or category (audit M1).
    const TOPIC_SOURCE = 'study_topic';
    const TAG_PREFIX = 'study:';

    /*
     * Study search suggestions (Android StudySuggestions.kt, StaticSuggestions; kept identical). The
     * curated lists are lowercase English, like the packs' own topics: a topic's everyday words for
     * routing a search, plus the multi-word phrases that are clearly lessons. A topic's multi-word
     * synonyms ("concrete technology" under "building materials") allow a title like the topic
     * does; single everyday words ("cement") never allow on their own, since "cement" alone names
     * price lists and factory tours as often as lessons.
     */
    const SUGGESTION_KINDS = Object.freeze({ TOPIC_SYNONYMS: 'topic_synonyms', PACK_TOPICS: 'pack_topics', SEARCH_EXAMPLES: 'search_examples' });
    const PACK_TOPIC_SUGGESTIONS = Object.freeze({
        'in_gate:civil': ['building materials', 'construction materials', 'civil engineering']
    });
    const SEARCH_EXAMPLE_SUGGESTIONS = Object.freeze({
        'in_gate:civil': ['cement', 'beam deflection'],
        'in_gate:cse': ['deadlock', 'linked list'],
        'in_gate:ece': ['bode plot', 'op amp'],
        'in_gate:ee': ['transformer', 'load flow'],
        'in_gate:me': ['rankine cycle', 'gears'],
        in_gate: ['previous year questions', 'engineering mathematics'],
        'in_jee:main': ['projectile motion', 'mole concept'],
        'in_jee:advanced': ['rotational motion', 'irodov'],
        in_jee: ['projectile motion', 'mole concept']
    });
    const TOPIC_SYNONYMS = Object.freeze({
        // GATE Civil
        'building materials': ['cement', 'concrete', 'aggregate', 'aggregates', 'bricks', 'brick', 'mortar', 'lime',
            'timber', 'fly ash', 'admixtures', 'construction materials', 'concrete technology', 'building materials'],
        'construction materials': ['cement', 'concrete', 'aggregate', 'bricks', 'mortar', 'concrete technology'],
        'concrete structures': ['rcc', 'concrete', 'reinforced concrete', 'reinforced cement concrete', 'prestressed concrete',
            'psc', 'slab', 'footing', 'limit state', 'concrete technology'],
        rcc: ['reinforced concrete', 'reinforced cement concrete', 'rcc design', 'prestressed concrete', 'limit state'],
        'steel structures': ['steel', 'steel design', 'plate girder', 'bolted connections', 'welded connections'],
        'structural analysis': ['beam', 'truss', 'deflection', 'beam deflection', 'influence lines', 'slope deflection',
            'moment distribution', 'indeterminate structures'],
        'solid mechanics': ['stress', 'strain', 'torsion', 'strength of materials', 'bending moment', 'shear force',
            "mohr's circle", 'mohr circle'],
        'geotechnical engineering': ['soil', 'foundation', 'consolidation', 'compaction', 'permeability', 'soil mechanics',
            'bearing capacity', 'shear strength', 'earth pressure', 'foundation engineering'],
        'soil mechanics': ['soil', 'consolidation', 'compaction', 'permeability', 'bearing capacity', 'shear strength'],
        'fluid mechanics': ['fluid', 'hydraulics', 'bernoulli', 'viscosity', 'open channel', 'open channel flow', 'pipe flow',
            'fluid mechanics'],
        hydrology: ['rainfall', 'runoff', 'hydrograph', 'groundwater', 'irrigation engineering'],
        irrigation: ['canal', 'irrigation engineering', 'water requirement of crops'],
        'environmental engineering': ['sewage', 'wastewater', 'water treatment', 'wastewater treatment', 'air pollution',
            'solid waste', 'solid waste management'],
        'transportation engineering': ['highway', 'pavement', 'railway', 'traffic', 'highway engineering', 'traffic engineering',
            'pavement design'],
        'highway engineering': ['highway', 'pavement', 'pavement design', 'traffic engineering'],
        surveying: ['levelling', 'leveling', 'theodolite', 'traverse', 'contour', 'total station', 'chain surveying'],
        'engineering mechanics': ['friction', 'equilibrium', 'free body diagram', 'virtual work', 'centroid', 'moment of inertia'],
        // GATE CSE
        'data structures': ['array', 'stack', 'queue', 'tree', 'heap', 'hashing', 'linked list', 'binary tree', 'binary search tree'],
        algorithms: ['sorting', 'greedy', 'dynamic programming', 'time complexity', 'graph algorithms', 'divide and conquer'],
        'operating systems': ['deadlock', 'paging', 'semaphore', 'scheduling', 'cpu scheduling', 'virtual memory',
            'process synchronization'],
        'operating system': ['deadlock', 'paging', 'semaphore', 'cpu scheduling', 'virtual memory'],
        dbms: ['sql', 'normalization', 'transactions', 'indexing', 'er model', 'relational algebra', 'database management'],
        'computer networks': ['tcp', 'subnetting', 'routing', 'osi model', 'ip addressing', 'congestion control'],
        'theory of computation': ['dfa', 'nfa', 'automata', 'regular expressions', 'turing machine', 'context free grammar'],
        'compiler design': ['parsing', 'lexical analysis', 'syntax directed translation', 'll parser', 'lr parser'],
        'digital logic': ['flip flops', 'multiplexer', 'k map', 'boolean algebra', 'combinational circuits', 'sequential circuits'],
        'computer organisation': ['pipelining', 'cache', 'cache memory', 'addressing modes', 'instruction pipeline'],
        'computer organization': ['pipelining', 'cache', 'cache memory', 'addressing modes', 'instruction pipeline'],
        'discrete mathematics': ['graph theory', 'set theory', 'propositional logic', 'combinatorics', 'group theory'],
        // GATE ECE / EE
        'signals and systems': ['convolution', 'fourier transform', 'laplace transform', 'z transform', 'sampling theorem'],
        'control systems': ['root locus', 'bode plot', 'nyquist', 'transfer function', 'state space', 'nyquist plot'],
        'network theory': ['thevenin', 'norton', 'network theorems', 'two port network', 'transient analysis'],
        'electronic devices': ['diode', 'mosfet', 'bjt', 'pn junction', 'semiconductor physics'],
        'analog circuits': ['op amp', 'amplifier', 'oscillator', 'operational amplifier', 'feedback amplifier'],
        'digital circuits': ['flip flops', 'counters', 'multiplexer', 'k map', 'logic gates'],
        'communication systems': ['modulation', 'amplitude modulation', 'frequency modulation', 'digital communication'],
        electromagnetics: ["maxwell's equations", 'transmission lines', 'waveguides', 'antenna', 'plane waves'],
        'electrical machines': ['transformer', 'induction motor', 'dc machine', 'dc machines', 'synchronous machine'],
        'power systems': ['load flow', 'fault analysis', 'transmission line', 'power system stability'],
        'power electronics': ['rectifier', 'inverter', 'chopper', 'thyristor', 'dc dc converter'],
        // GATE ME
        thermodynamics: ['entropy', 'enthalpy', 'carnot cycle', 'rankine cycle', 'otto cycle', 'first law', 'second law'],
        'heat transfer': ['conduction', 'convection', 'radiation', 'heat exchanger', 'fins'],
        'theory of machines': ['gears', 'cams', 'flywheel', 'governors', 'vibrations', 'gear trains'],
        'strength of materials': ['stress', 'strain', 'torsion', 'bending moment', 'shear force', "mohr's circle"],
        'machine design': ['shafts', 'bearings', 'springs', 'fatigue', 'design of shafts'],
        manufacturing: ['casting', 'welding', 'machining', 'metal cutting', 'metal forming'],
        // JEE
        kinematics: ['projectile', 'projectile motion', 'relative motion', 'motion in a straight line', 'motion in a plane'],
        'rotational motion': ['torque', 'rolling', 'moment of inertia', 'angular momentum', 'rigid body'],
        electrostatics: ['capacitor', 'capacitance', 'electric field', 'electric potential', 'gauss law', "coulomb's law"],
        'current electricity': ['kirchhoff', 'resistance', "ohm's law", 'wheatstone bridge', 'potentiometer'],
        optics: ['lens', 'mirror', 'refraction', 'interference', 'ray optics', 'wave optics', "young's double slit"],
        'modern physics': ['photoelectric', 'photoelectric effect', 'bohr model', 'nuclear physics', 'dual nature', 'atoms and nuclei'],
        'organic chemistry': ['isomerism', 'hydrocarbons', 'goc', 'reaction mechanism', 'named reactions', 'aldehydes and ketones'],
        'inorganic chemistry': ['p block', 'd block', 'coordination compounds', 'periodic table', 'chemical bonding'],
        'physical chemistry': ['equilibrium', 'electrochemistry', 'mole concept', 'chemical kinetics', 'solutions', 'thermochemistry'],
        'chemical bonding': ['hybridisation', 'hybridization', 'vsepr', 'molecular orbital theory'],
        calculus: ['limits', 'continuity', 'derivatives', 'differential equations', 'definite integration', 'application of derivatives'],
        integration: ['definite integration', 'indefinite integration', 'area under curves'],
        'coordinate geometry': ['parabola', 'ellipse', 'hyperbola', 'circles', 'straight lines', 'conic sections'],
        vectors: ['dot product', 'cross product', '3d geometry', 'three dimensional geometry'],
        probability: ['bayes theorem', 'conditional probability', 'binomial distribution'],
        matrices: ['determinants', 'inverse of a matrix'],
        'complex numbers': ['argand plane', 'de moivre', 'roots of unity']
    });
    const MAX_TOPIC_PATTERNS = 200;

    function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
    function object(value) { return isObject(value) ? value : {}; }
    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
    function toMs(now) {
        const value = now instanceof Date ? now.getTime() : Number(now);
        return Number.isFinite(value) ? value : Date.now();
    }

    function parseTime(value) {
        const match = TIME.exec(text(value));
        return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    }

    function localMidnight(ms) {
        const date = new Date(ms);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    /** Local midnight `days` calendar days after the one holding `ms` (DST-safe). */
    function addDays(ms, days) {
        const date = new Date(ms);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
    }

    /** Local wall-clock minutes after a day's midnight; DST-safe because Date normalizes. */
    function atMinutes(dayStart, minutes) {
        const date = new Date(dayStart);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, minutes).getTime();
    }

    function localDateKey(now) {
        const date = new Date(toMs(now));
        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function dayKey(ms) { return DAY_KEYS[new Date(ms).getDay()]; }

    function focusMinutes(focus) {
        const value = object(focus);
        const round = Number.isFinite(value.roundMinutes) ? Math.max(1, Math.trunc(value.roundMinutes)) : 25;
        const rest = Number.isFinite(value.breakMinutes) ? Math.max(0, Math.trunc(value.breakMinutes)) : 5;
        return { round, rest };
    }

    /** The study and break segments of one occurrence; the last round is clamped to the end. */
    function splitRounds(start, end, focus) {
        const { round, rest } = focusMinutes(focus);
        const segments = [];
        let at = start;
        let index = 0;
        while (at < end) {
            index += 1;
            let studyEnd = at + round * MINUTE;
            if (studyEnd + rest * MINUTE >= end) studyEnd = end;
            segments.push({ kind: STUDY, round: index, start: at, end: studyEnd });
            if (studyEnd >= end) break;
            if (rest > 0) segments.push({ kind: BREAK, round: index, start: studyEnd, end: studyEnd + rest * MINUTE });
            at = studyEnd + rest * MINUTE;
        }
        const rounds = segments.filter(segment => segment.kind === STUDY).length;
        return segments.map(segment => ({ ...segment, rounds }));
    }

    /** Plan occurrences that overlap [from, to): {start, end, limitAt, day}. */
    function planOccurrences(plan, from, to) {
        const value = object(plan);
        const startMin = parseTime(value.start);
        const endMin = parseTime(value.end);
        if (startMin === null || endMin === null) return [];
        const days = new Set(array(value.days).map(day => text(day).toLowerCase()));
        const limitMin = parseTime(value.limit);
        const out = [];
        for (let day = addDays(from, -1); day < to; day = addDays(day, 1)) {
            if (!days.has(dayKey(day))) continue;
            const start = atMinutes(day, startMin);
            const end = endMin > startMin ? atMinutes(day, endMin) : atMinutes(addDays(day, 1), endMin);
            let limitAt = null;
            if (limitMin !== null) {
                limitAt = limitMin >= startMin ? atMinutes(day, limitMin) : atMinutes(addDays(day, 1), limitMin);
                limitAt = Math.max(limitAt, end);
            }
            if (end > from - 2 * 24 * 60 * MINUTE) out.push({ start, end, limitAt, day, source: 'plan', setByParentId: text(value.setByParentId) || null });
        }
        return out;
    }

    function occurrencesAround(input, now) {
        const from = localMidnight(now);
        const to = addDays(from, 8);
        const list = planOccurrences(input.plan, from, to);
        const session = object(input.session);
        const startedAt = Number(session.startedAt);
        const endsAt = Number(session.endsAt);
        if (Number.isFinite(startedAt) && Number.isFinite(endsAt) && endsAt > startedAt) {
            list.push({ start: startedAt, end: endsAt, limitAt: null, day: localMidnight(startedAt), source: 'session', setByParentId: null });
        }
        // A parent's session lock ({startsAt, endsAt, setByParentId}) runs study rounds for its whole
        // window. It wins over a self session that overlaps it (audit M5).
        const lock = object(input.parentLock);
        const lockStart = Number(lock.startsAt);
        const lockEnd = Number(lock.endsAt);
        if (Number.isFinite(lockStart) && Number.isFinite(lockEnd) && lockEnd > lockStart) {
            for (let index = list.length - 1; index >= 0; index -= 1) {
                const item = list[index];
                if (item.source === 'session' && item.start < lockEnd && item.end > lockStart) list.splice(index, 1);
            }
            list.push({ start: lockStart, end: lockEnd, limitAt: null, day: localMidnight(lockStart), source: 'parent_lock', setByParentId: text(lock.setByParentId) || 'parent' });
        }
        const endedUntil = Number(input.endedUntil);
        return list
            // Only self occurrences can be ended early; a parent's plan or lock can't.
            .filter(occurrence => occurrence.setByParentId || !(Number.isFinite(endedUntil) && occurrence.end <= endedUntil))
            .sort((a, b) => a.start - b.start);
    }

    function stateAt(input, now, occurrences) {
        // The clock guard saw the time or zone change during a lock or a parent's plan: hold at rest.
        if (input.clockHold === true) {
            return { state: LIMIT, until: now + MINUTE, reason: 'clock_hold', clockHold: true, setByParentId: null };
        }
        // A parent's occurrence wins over a self one that overlaps it (audit M5).
        const covering = occurrences.filter(occurrence => occurrence.start <= now && now < occurrence.end);
        const current = covering.find(occurrence => occurrence.setByParentId) || covering[0];
        if (current) {
            const segments = splitRounds(current.start, current.end, input.focus);
            const segment = segments.find(item => item.start <= now && now < item.end) || segments[segments.length - 1];
            return {
                state: segment.kind, round: segment.round, rounds: segment.rounds, until: segment.end,
                sessionStart: current.start, sessionEnd: current.end, source: current.source,
                setByParentId: current.setByParentId || null, segments
            };
        }
        const limited = occurrences.find(occurrence => occurrence.limitAt !== null
            && occurrence.limitAt <= now && now < addDays(occurrence.limitAt, 1) && localMidnight(now) === localMidnight(occurrence.limitAt));
        if (limited) return { state: LIMIT, until: addDays(limited.limitAt, 1), reason: 'plan_limit' };
        if (input.limitReached === true) return { state: LIMIT, until: addDays(now, 1), reason: 'daily_limit' };
        return { state: NORMAL, until: null };
    }

    /**
     * The study state at `now`:
     *   {state, round, rounds, until, sessionStart, sessionEnd, source, breakMode, segments,
     *    next: {state, at} | null, breakNoticeAt}
     * Input: {plan, focus, breakMode, now, session?, endedUntil?, limitReached?, parentLock?, clockHold?}.
     */
    function studyClock(input = {}) {
        const now = toMs(input.now);
        const occurrences = occurrencesAround(input, now);
        const current = stateAt(input, now, occurrences);
        const boundaries = [];
        if (current.until) boundaries.push(current.until);
        for (const occurrence of occurrences) {
            if (occurrence.start > now) boundaries.push(occurrence.start);
            if (occurrence.limitAt !== null && occurrence.limitAt > now) boundaries.push(occurrence.limitAt);
        }
        const nextAt = boundaries.filter(at => at > now).sort((a, b) => a - b)[0];
        let next = null;
        if (Number.isFinite(nextAt)) {
            const after = stateAt(input, nextAt, occurrences);
            next = { state: after.state, at: nextAt, round: after.round || null };
        }
        const breakMode = text(input.breakMode) === 'normal' ? 'normal' : 'rest';
        const result = { round: null, rounds: null, sessionStart: null, sessionEnd: null, source: null, setByParentId: null,
            clockHold: false, segments: [], ...current, breakMode, next };
        result.breakNoticeAt = result.state === STUDY && next && next.state === BREAK ? Math.max(now, next.at - BREAK_NOTICE_MS) : null;
        result.studying = result.state === STUDY || result.state === BREAK;
        return result;
    }

    /** Whether the study allow layer applies: during STUDY, and during a "rest" BREAK (the feed is hidden). */
    function studyRulesApply(clock) {
        const value = object(clock);
        return value.state === STUDY || (value.state === BREAK && value.breakMode !== 'normal');
    }

    function channelIdentity(value) {
        if (typeof value === 'string') {
            const item = text(value);
            if (/^UC[A-Za-z0-9_-]{22}$/.test(item)) return { id: item, handle: '' };
            return { id: '', handle: item.replace(/^@/, '').toLowerCase() };
        }
        const ref = object(value);
        const id = text(ref.channelId) || (/^UC[A-Za-z0-9_-]{22}$/.test(text(ref.id)) ? text(ref.id) : '');
        const handle = text(ref.handle || ref.canonicalHandle).replace(/^@/, '').toLowerCase();
        return { id, handle };
    }

    function sameChannel(a, b) {
        const left = channelIdentity(a);
        const right = channelIdentity(b);
        if (left.id && right.id) return left.id === right.id;
        return !!left.handle && left.handle === right.handle;
    }

    function wordKey(value) { return text(typeof value === 'string' ? value : value?.word).replace(/\s+/g, ' ').toLowerCase(); }

    /** "packId:variantId", or "packId" with no branch. */
    function suggestionSeed(packId, variantId) {
        const pack = text(packId);
        const variant = text(variantId);
        return variant ? `${pack}:${variant}` : pack;
    }

    function own(table, key) {
        return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : null;
    }

    /**
     * The curated suggestions for a kind: TOPIC_SYNONYMS takes a topic, PACK_TOPICS and
     * SEARCH_EXAMPLES take "packId:variantId" (falling back to the pack). Returns a new array.
     */
    function suggest(kind, seed) {
        const key = wordKey(seed);
        let found = null;
        if (kind === SUGGESTION_KINDS.TOPIC_SYNONYMS) found = own(TOPIC_SYNONYMS, key);
        else if (kind === SUGGESTION_KINDS.PACK_TOPICS) found = own(PACK_TOPIC_SUGGESTIONS, key) || own(PACK_TOPIC_SUGGESTIONS, key.split(':')[0]);
        else if (kind === SUGGESTION_KINDS.SEARCH_EXAMPLES) found = own(SEARCH_EXAMPLE_SUGGESTIONS, key) || own(SEARCH_EXAMPLE_SUGGESTIONS, key.split(':')[0]);
        return array(found).slice();
    }

    function distinctTopics(list) {
        const seen = new Set();
        const out = [];
        for (const value of list) {
            const key = wordKey(value);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            out.push(text(value));
        }
        return out;
    }

    /** The pack's topics for this branch plus the extra ones the suggestions give it ("building materials"). */
    function studyTopics(packId, variantId, packTopics) {
        return distinctTopics([...array(packTopics), ...suggest(SUGGESTION_KINDS.PACK_TOPICS, suggestionSeed(packId, variantId))]);
    }

    /**
     * Phrases that allow a title like a topic does: the branch's extra topics, and every multi-word
     * synonym of a topic ("concrete technology", "beam deflection"). Single words stay out.
     */
    function studyAllowPhrases(packId, variantId, topics) {
        const given = distinctTopics(array(topics));
        const all = studyTopics(packId, variantId, given);
        const givenKeys = new Set(given.map(wordKey));
        const extra = all.filter(topic => !givenKeys.has(wordKey(topic)));
        const phrases = all.flatMap(topic => suggest(SUGGESTION_KINDS.TOPIC_SYNONYMS, topic)).filter(phrase => wordKey(phrase).includes(' '));
        return distinctTopics([...extra, ...phrases]);
    }

    /** The topic itself and everything it covers. */
    function topicTerms(topic) {
        return distinctTopics([topic, ...suggest(SUGGESTION_KINDS.TOPIC_SYNONYMS, topic)]);
    }

    function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    /** Whole-word, case-insensitive patterns for topics (Android StudyHomeFeed.topicPatterns). */
    function topicPatterns(topics) {
        const keys = [...new Set(array(topics).map(wordKey).filter(key => key.length >= 2))].slice(0, MAX_TOPIC_PATTERNS);
        return keys.map(key => new RegExp(`(?<![\\p{L}\\p{N}])${key.split(' ').map(escapeRegExp).join('\\s+')}(?![\\p{L}\\p{N}])`, 'iu'));
    }

    /**
     * The topics a search is about: a term named whole in the query ("cement test" names "cement"),
     * or the whole query named in a term ("beam" in "beam deflection").
     */
    function topicsForQuery(query, topics) {
        const q = wordKey(query);
        if (q.length < 2) return [];
        const queryPattern = topicPatterns([q])[0];
        if (!queryPattern) return [];
        return array(topics).filter(topic => {
            const terms = topicTerms(topic);
            return topicPatterns(terms).some(pattern => pattern.test(q)) || terms.some(term => queryPattern.test(term));
        });
    }

    /** A couple of example searches for the first pack of the plan ({packId, variantId}). */
    function exampleSearches(groups) {
        const first = array(groups).find(isObject);
        return first ? suggest(SUGGESTION_KINDS.SEARCH_EXAMPLES, suggestionSeed(first.packId, first.variantId)) : [];
    }

    /**
     * One pack with its edits: {id, channels, keywords, blockedWords}. channelsRemoved and topicsRemoved
     * take rows out; channelsAdded and topicsAdded put rows in. Class packs add every grade's words.
     */
    /** The chosen variant, else the default one, else the first (parsed or raw catalog rows). */
    function packVariant(pack, id) {
        const variants = array(object(pack).variants).filter(isObject);
        const wanted = text(id).toLowerCase();
        return variants.find(variant => text(variant.id).toLowerCase() === wanted && wanted)
            || variants.find(variant => variant.isDefault === true || variant.default === true) || variants[0] || null;
    }

    function packLayer(pack, edits) {
        const change = object(edits);
        const removedChannels = array(change.channelsRemoved);
        const removedTopics = new Set(array(change.topicsRemoved).map(wordKey));
        const channels = [];
        for (const channel of [...array(pack.channels), ...array(change.channelsAdded)]) {
            if (removedChannels.some(removed => sameChannel(channel, removed))) continue;
            if (channels.some(existing => sameChannel(existing, channel))) continue;
            channels.push({ channelId: text(channel.channelId) || null, handle: text(channel.handle) || null, name: text(channel.name) });
        }
        const keywords = [];
        const seen = new Set();
        const grades = Object.values(object(pack.gradeKeywords)).flat();
        // The chosen branch's topics (GATE CSE: "dbms", ...) join the pack's own.
        const variantWords = array(packVariant(pack, change.variant)?.keywords);
        for (const word of [...array(pack.keywords), ...grades, ...variantWords, ...array(change.topicsAdded)]) {
            const key = wordKey(word);
            if (!key || removedTopics.has(key) || seen.has(key)) continue;
            seen.add(key);
            keywords.push(text(word));
        }
        // Lesson phrases the kept topics cover (Android StudyEffectiveRules.layer synonyms).
        const variantId = text(packVariant(pack, change.variant)?.id) || null;
        const synonyms = studyAllowPhrases(pack.id, variantId, keywords)
            .filter(phrase => !removedTopics.has(wordKey(phrase)) && !seen.has(wordKey(phrase)));
        return { id: pack.id, channels, keywords, synonyms, blockedWords: array(pack.blockedWords).map(text).filter(Boolean) };
    }

    /**
     * A pack copy kept inside `study.packCopies[id]` ({channels, topics, blockedWords}, the Android
     * StudyPackCopy shape) read as a pack, so a catalog that fails to load or an update that removes
     * the pack can't switch study off.
     */
    function copyAsPack(id, copy) {
        const value = object(copy);
        const channels = array(value.channels).filter(isObject);
        if (!channels.length) return null;
        return { id, kind: 'copy', channels, keywords: array(value.topics), blockedWords: array(value.blockedWords) };
    }

    function packFor(study, catalog, id) {
        const packs = array(object(catalog).packs);
        return packs.find(pack => pack.id === id) || copyAsPack(id, object(object(study).packCopies)[id]);
    }

    /** The active packs found in the catalog (or in the study's own pack copies), with packEdits applied. */
    function activePackLayers(study, catalog) {
        const value = object(study);
        return array(value.activePackIds)
            .map(id => packFor(value, catalog, id))
            .filter(Boolean)
            .map(pack => packLayer(pack, object(value.packEdits)[pack.id]));
    }

    /** `study` with a copy of each active pack the catalog knows (as Android stampCopies); others stay. */
    function stampPackCopies(study, catalog) {
        const value = object(study);
        const packs = array(object(catalog).packs);
        if (!packs.length) return study;
        const current = object(value.packCopies);
        const copies = {};
        for (const id of array(value.activePackIds)) {
            const pack = packs.find(item => item.id === id);
            if (pack) {
                const variantWords = array(packVariant(pack, object(object(value.packEdits)[id]).variant)?.keywords);
                const seen = new Set();
                const topics = [...array(pack.keywords), ...Object.values(object(pack.gradeKeywords)).flat(), ...variantWords]
                    .map(text).filter(word => word && !seen.has(wordKey(word)) && seen.add(wordKey(word))).slice(0, 400);
                copies[id] = {
                    channels: array(pack.channels).slice(0, 400).map(channel => ({
                        ...(text(channel.channelId) ? { channelId: text(channel.channelId) } : {}),
                        ...(text(channel.handle) ? { handle: text(channel.handle) } : {}),
                        ...(text(channel.name) ? { name: text(channel.name) } : {})
                    })),
                    topics,
                    blockedWords: array(pack.blockedWords).map(text).filter(Boolean).slice(0, 400)
                };
            } else if (isObject(current[id])) {
                copies[id] = current[id];
            }
        }
        if (JSON.stringify(copies) === JSON.stringify(current)) return study;
        return { ...value, packCopies: copies };
    }

    function packChannelRow(channel, packId) {
        const handle = channel.handle ? (channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`) : null;
        return {
            ...(channel.channelId ? { id: channel.channelId } : {}),
            ...(handle ? { handle, canonicalHandle: handle } : {}),
            name: channel.name || handle || channel.channelId,
            source: STUDY_SOURCE,
            managedListId: `${TAG_PREFIX}${packId}`
        };
    }

    /** Pack topics (allow) and pack blocked words: whole words, matched against the title only. */
    function packWordRow(word, packId, source = STUDY_SOURCE) {
        return { word, exact: true, comments: false, titleOnly: true, source, managedListId: `${TAG_PREFIX}${packId}` };
    }

    function appendWords(list, rows) {
        const out = [...array(list)];
        const seen = new Set(out.map(wordKey));
        for (const row of rows) {
            const key = wordKey(row);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            out.push(row);
        }
        return out;
    }

    function studySurface(surface, layers, { kids, packChannelsOnly = false }) {
        const data = object(surface);
        const savedLayering = text(data.mode) === 'whitelist' ? (data.layered === true ? 'layered' : 'whitelist') : 'blocklist';
        // The user's own allowed channels stay; rows a mode switch only copied over (blocklist users)
        // and paused managed rows do not.
        const ownChannels = array(data.whitelistChannels).filter(row => {
            if (!row) return false;
            if (typeof row === 'object' && row.managedListPaused === true) return false;
            if (typeof row === 'object' && row.modeBootstrapCopy === true && savedLayering === 'blocklist') return false;
            if (typeof row === 'object' && text(row.managedListId).startsWith(TAG_PREFIX)) return false;
            return true;
        });
        const channels = packChannelsOnly ? [] : [...ownChannels];
        for (const layer of layers) {
            for (const channel of layer.channels) {
                if (channels.some(existing => sameChannel(existing, channel))) continue;
                channels.push(packChannelRow(channel, layer.id));
            }
        }
        // Topics first, then the synonyms they cover; a phrase that is also a topic stays the topic.
        const allowWords = [
            ...layers.flatMap(layer => layer.keywords.map(word => packWordRow(word, layer.id, TOPIC_SOURCE))),
            ...layers.flatMap(layer => array(layer.synonyms).map(word => packWordRow(word, layer.id, TOPIC_SOURCE)))
        ];
        const blockWords = layers.flatMap(layer => layer.blockedWords.map(word => packWordRow(word, layer.id)));
        const blockKey = kids ? 'blockedKeywords' : (Array.isArray(data.keywords) || !Array.isArray(data.blockedKeywords) ? 'keywords' : 'blockedKeywords');
        const next = {
            ...clone(data),
            mode: 'whitelist',
            layered: true,
            whitelistChannels: clone(channels),
            whitelistKeywords: appendWords([], allowWords),
            allowedVideoIds: [],
            [blockKey]: appendWords(clone(array(data[blockKey])), blockWords)
        };
        if (kids) next.subscriptions = [];
        return next;
    }

    /** Rest break, the limit or a clock hold: allow mode with nothing allowed, so every surface is empty. */
    function restSurface(surface, { kids }) {
        const next = { ...clone(object(surface)), mode: 'whitelist', layered: true, whitelistChannels: [], whitelistKeywords: [], allowedVideoIds: [] };
        if (kids) next.subscriptions = [];
        return next;
    }

    function ownAllowedChannels(surface) {
        const data = object(surface);
        const blocklist = text(data.mode) !== 'whitelist';
        return array(data.whitelistChannels).some(row => row && !(typeof row === 'object' && (row.managedListPaused === true
            || (row.modeBootstrapCopy === true && blocklist) || text(row.managedListId).startsWith(TAG_PREFIX))));
    }

    /** Fail closed: the master switch can't turn study off, and comments are off while studying. */
    function studySettings(settings) {
        return { ...clone(object(settings)), enabled: true, syncKidsToMain: false, hideComments: true };
    }

    /** "study" during a round, "rest" for a rest break, the limit or a clock hold, else "normal". */
    function studyPhase(clock) {
        const value = object(clock);
        if (value.clockHold === true || value.state === LIMIT) return 'rest';
        if (value.state === STUDY) return 'study';
        if (value.state === BREAK && value.breakMode !== 'normal' && value.breakSkipped !== true) return 'rest';
        return 'normal';
    }

    /**
     * The profile the filters use right now. Outside study (and in a "normal" or skipped break) it is the
     * profile unchanged; during a round Main and Kids get the pack allow layer with layered blocking;
     * a rest break, the limit and a clock hold get the rest profile.
     * `clock.setByParentId` (a parent's plan or lock) defaults to "pack channels only" (audit L2).
     * Returns {profile, applied, packIds, phase, failClosed}.
     */
    function studyEffectiveProfile(profile, { catalog, clock, study } = {}) {
        const source = object(profile);
        const value = study || source.study;
        const unchanged = { profile, applied: false, packIds: [], phase: 'normal', failClosed: false };
        if (!isObject(value)) return unchanged;
        const phase = studyPhase(clock);
        if (phase === 'normal') return unchanged;
        if (phase === 'rest') {
            return {
                profile: { ...source, settings: studySettings(source.settings), main: restSurface(source.main, { kids: false }), kids: restSurface(source.kids, { kids: true }) },
                applied: true, packIds: [], phase: 'rest', failClosed: false
            };
        }
        const packChannelsOnly = !!text(object(clock).setByParentId) && value.packChannelsOnly !== false;
        const layers = activePackLayers(value, catalog);
        if (!layers.length) {
            // Fail closed (audit H3): the person's own allowed channels, or rest. Never the normal rules.
            const own = !packChannelsOnly && (ownAllowedChannels(source.main) || ownAllowedChannels(source.kids));
            const rest = !own;
            return {
                profile: {
                    ...source,
                    settings: studySettings(source.settings),
                    main: rest ? restSurface(source.main, { kids: false }) : studySurface(source.main, [], { kids: false }),
                    kids: rest ? restSurface(source.kids, { kids: true }) : studySurface(source.kids, [], { kids: true })
                },
                applied: true, packIds: [], phase: rest ? 'rest' : 'study', failClosed: true
            };
        }
        return {
            profile: {
                ...source,
                settings: studySettings(source.settings),
                main: studySurface(source.main, layers, { kids: false, packChannelsOnly }),
                kids: studySurface(source.kids, layers, { kids: true, packChannelsOnly })
            },
            applied: true,
            packIds: layers.map(layer => layer.id),
            phase: 'study',
            failClosed: false
        };
    }

    /** Adds whole minutes for a device and local date; returns a new progress object. */
    function addProgressMinutes(progress, deviceId, dateKey, minutes) {
        const out = clone(object(progress));
        const device = text(deviceId);
        const count = Math.trunc(Number(minutes));
        if (!device || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isFinite(count) || count <= 0) return out;
        const days = object(out[device]);
        days[dateKey] = Math.min(1440, (Number(days[dateKey]) || 0) + count);
        out[device] = days;
        return out;
    }

    /** Minutes studied on a local date across every device. */
    function minutesOn(progress, dateKey) {
        return Object.values(object(progress)).reduce((sum, days) => sum + (Number(object(days)[dateKey]) || 0), 0);
    }

    /** The 7 days Monday to Sunday holding `now`: {date, minutes, fill: "full"|"half"|"empty"}. */
    function weekProgress(progress, now, goalMinutes = 0) {
        const today = localMidnight(toMs(now));
        const monday = addDays(today, -((new Date(today).getDay() + 6) % 7));
        const days = [];
        for (let index = 0; index < 7; index += 1) {
            const date = localDateKey(addDays(monday, index));
            const minutes = minutesOn(progress, date);
            const fill = minutes <= 0 ? 'empty' : (goalMinutes > 0 && minutes < goalMinutes ? 'half' : 'full');
            days.push({ date, minutes, fill });
        }
        return { days, daysStudied: days.filter(day => day.minutes > 0).length };
    }

    /** Who may skip a break or end a session: only sessions the person started themselves. */
    function selfStarted(study) {
        const value = object(study);
        return !text(object(value.plan).setByParentId) && !text(object(value.lock).setByParentId);
    }

    /** End rules: Gentle ends after a 30-second pause; Locked (or parent-set) cannot be ended here. */
    function endPolicy(study) {
        const lock = object(object(study).lock);
        if (!selfStarted(study)) return { canEnd: false, reason: 'set_by_parent' };
        if (text(lock.mode) === 'locked') return { canEnd: false, reason: 'locked' };
        return { canEnd: true, pauseMs: GENTLE_END_PAUSE_MS };
    }

    return Object.freeze({
        NORMAL, STUDY, BREAK, LIMIT, BREAK_NOTICE_MS, BREAK_WAIT_MAX_MS, GENTLE_END_PAUSE_MS,
        SELF_LOCK_MAX_MINUTES, PARENT_LOCK_MAX_MINUTES, STUDY_SOURCE, TOPIC_SOURCE,
        parseTime, localDateKey, splitRounds, planOccurrences, studyClock, studyRulesApply, studyPhase,
        SUGGESTION_KINDS, suggest, suggestionSeed, studyTopics, studyAllowPhrases, topicTerms, topicPatterns,
        topicsForQuery, exampleSearches,
        packVariant, packLayer, activePackLayers, stampPackCopies, studyEffectiveProfile,
        addProgressMinutes, minutesOn, weekProgress, selfStarted, endPolicy
    });
}));
