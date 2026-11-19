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
 *    Branches (Android StudyPackCatalog channelsFor/topicsFor, StudyBranchFilter): a pack with
 *    branches gives the chosen branch's channels plus the pack channels no branch claims, and the
 *    shared topics plus the branch's own. For packs with separate branches, a title that names a
 *    topic only other branches study and none of the studied ones is hidden: one title-only block
 *    row (source "study_branch") on Main, so feeds, Shorts, search and the Watch gate agree.
 *    Kids (Android StudyKidsSpace): only Kids packs (kids_age, kids_classic) drive the Kids site.
 *    In a study round with one active, Kids gets those packs' allow layer ("learning"); with exam,
 *    class or skill packs only, Kids holds at rest ("study_time") and study_overlay.js shows Kriti's
 *    study-time card. Outside a round the Kids site is "untouched".
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
    // The one row that hides another branch's uploads (studyBranchFilter).
    const BRANCH_SOURCE = 'study_branch';
    const KIDS_KINDS = Object.freeze(['kids_age', 'kids_classic']);
    const KIDS_SPACE = Object.freeze({ UNTOUCHED: 'untouched', LEARNING: 'learning', STUDY_TIME: 'study_time' });
    /*
     * Branch words too common elsewhere to hide a video by (Android StudyPack.AMBIGUOUS_BRANCH_WORDS):
     * "networks" also names water and road networks, "manufacturing" cement factory tours a Civil
     * search wants, "logic" logic gates in ICT.
     */
    const AMBIGUOUS_BRANCH_WORDS = Object.freeze(['networks', 'measurements', 'communications', 'communication', 'manufacturing', 'logic']);

    /*
     * Study search suggestions (Android StudySuggestions.kt, StaticSuggestions; kept identical). The
     * curated lists are lowercase: English, plus the local words of packs taught in other languages: a topic's everyday words for
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
        in_jee: ['projectile motion', 'mole concept'],
        global_coding_interview: ['two sum', 'dynamic programming'],
        interview_system_design: ['url shortener', 'rate limiter'],
        interview_devops_cloud: ['kubernetes', 'ci/cd pipeline'],
        interview_data_science: ['sql interview questions', 'a/b testing'],
        interview_product: ['product sense', 'prioritization'],
        interview_consulting: ['market sizing', 'profitability case'],
        interview_finance: ['dcf', 'walk me through'],
        interview_hr: ['tell me about yourself', 'star method']
    });
    /**
     * Android StudyInterviewTopics: every interview pack is studied with these, so a search for "mock
     * interview" goes to its channels, such titles pass, and they rank first on an interview plan's Home.
     */
    const INTERVIEW_TOPICS = Object.freeze(['interview', 'interview questions', 'mock interview', 'interview preparation', 'interview prep']);
    /** The interview packs' ids: "interview_*" and the coding pack that kept its id from the Skill days. */
    function isInterviewPackId(id) {
        const value = typeof id === 'string' ? id.trim() : '';
        return value.startsWith('interview_') || value === 'global_coding_interview';
    }
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
        'complex numbers': ['argand plane', 'de moivre', 'roots of unity'],
        // ECAT / entry tests (Pakistan)
        'engineering entry test': ['ecat', 'uet ecat', 'nust net', 'fast entry test', 'giki entry test', 'entry test'],
        'ecat past papers': ['ecat past paper', 'ecat mcqs', 'ecat solved paper'],
        // Bangladesh admissions
        'medical admission': ['মেডিকেল ভর্তি', 'মেডিকেল এডমিশন', 'mbbs admission', 'medical admission test'],
        // LGS / lise (Turkey)
        'lgs matematik': ['üslü ifadeler', 'kareköklü ifadeler', 'çarpanlar ve katlar', 'veri analizi', 'olasılık'],
        'lgs fen bilimleri': ['dna ve genetik kod', 'basınç', 'mevsimler ve iklim', 'madde ve endüstri', 'basit makineler'],
        paragraf: ['paragraf soruları', 'okuduğunu anlama', 'sözel mantık', 'anlam bilgisi'],
        // Concursos / OAB (Brazil)
        'raciocínio lógico': ['raciocinio logico', 'lógica proposicional', 'rlm', 'tabela verdade', 'equivalências lógicas'],
        'direito constitucional': ['constituição federal', 'cf/88', 'direitos fundamentais', 'controle de constitucionalidade'],
        'direito administrativo': ['atos administrativos', 'licitações', 'lei 14.133', 'lei 8.112', 'improbidade administrativa'],
        'ética profissional': ['estatuto da advocacia', 'código de ética oab', 'ética oab'],
        // Oposiciones (Spain)
        'constitución española': ['constitucion española', 'ce 1978', 'título preliminar', 'derechos fundamentales'],
        'procedimiento administrativo': ['ley 39/2015', 'ley 40/2015', 'recursos administrativos', 'silencio administrativo'],
        // Brevet / lycée (France)
        brevet: ['dnb', 'diplôme national du brevet', 'annales brevet', 'sujet brevet', 'brevet blanc'],
        'trigonométrie': ['cosinus', 'sinus', 'tangente', 'trigonometrie'],
        // Abitur / Oberstufe (Germany)
        analysis: ['ableitung', 'integral', 'kurvendiskussion', 'integralrechnung', 'extremstellen'],
        stochastik: ['wahrscheinlichkeit', 'binomialverteilung', 'baumdiagramm', 'bedingte wahrscheinlichkeit'],
        // High school (Japan, Korea)
        '高校入試': ['高校受験', '入試対策', '公立高校入試', '過去問'],
        '미적분': ['미분', '적분', '극한', '도함수'],
        '확률과 통계': ['확률', '통계', '순열과 조합', '조건부확률'],
        // THPT (Vietnam)
        'thi tốt nghiệp thpt': ['thi thpt', 'thi thpt quốc gia', 'ôn thi thpt', 'đề thi tốt nghiệp'],
        'hàm số': ['khảo sát hàm số', 'đạo hàm', 'cực trị', 'đồ thị hàm số'],
        // SMA (Indonesia)
        trigonometri: ['sin cos tan', 'identitas trigonometri', 'aturan sinus', 'aturan cosinus'],
        stoikiometri: ['konsep mol', 'persamaan reaksi', 'mol'],
        // Interviews (coding, system design, cloud, data, product, consulting, finance, HR)
        'dynamic programming': ['dp', 'memoization', 'knapsack', 'longest common subsequence', 'tabulation'],
        graphs: ['bfs', 'dfs', 'dijkstra', 'topological sort', 'union find', 'graph algorithms'],
        'system design': ['load balancer', 'caching', 'sharding', 'rate limiter', 'url shortener', 'message queue',
            'consistent hashing', 'high level design', 'low level design', 'hld', 'lld', 'scalability'],
        'low level design': ['lld', 'design patterns', 'solid principles', 'object oriented design', 'class diagram'],
        kubernetes: ['k8s', 'pods', 'helm', 'kubectl', 'deployments'],
        docker: ['containers', 'dockerfile', 'docker compose'],
        'ci/cd': ['jenkins', 'github actions', 'pipelines', 'continuous integration', 'continuous delivery'],
        aws: ['ec2', 's3', 'iam', 'vpc', 'lambda', 'solutions architect'],
        sql: ['joins', 'window functions', 'group by', 'subqueries', 'sql interview questions'],
        'machine learning': ['ml', 'regression', 'classification', 'overfitting', 'bias variance', 'gradient descent'],
        statistics: ['probability', 'hypothesis testing', 'p value', 'a/b testing', 'confidence interval'],
        'product sense': ['product design', 'favorite product', 'improve a product', 'product design question'],
        'product metrics': ['north star metric', 'kpi', 'metrics question', 'root cause analysis', 'metric drop'],
        'case interview': ['case study', 'case interview framework', 'market sizing', 'profitability', 'market entry',
            'guesstimate', 'mece'],
        guesstimate: ['market sizing', 'estimation question', 'guesstimates'],
        valuation: ['dcf', 'discounted cash flow', 'comparable companies', 'precedent transactions', 'lbo', 'wacc'],
        accounting: ['three statements', 'financial statements', 'balance sheet', 'cash flow statement', 'income statement',
            'walk me through the three statements'],
        'behavioral interview': ['behavioural interview', 'star method', 'tell me about yourself', 'strengths and weaknesses',
            'why should we hire you', 'hr interview questions'],
        'hr interview': ['hr round', 'tell me about yourself', 'salary negotiation', 'why should we hire you',
            'hr interview questions'],
        // O/L (Sri Lanka)
        'o/l': ['ordinary level', 'gce o/l', 'සාමාන්‍ය පෙළ', 'சாதாரண தரம்']
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

    /** How long Undo stays after Skip break (Android StudyBreakSkip.UNDO_MILLIS). */
    const SKIP_UNDO_MS = 5000;

    /**
     * What Skip break does (Android StudyBreakSkip.preview): the break starting at `breakStart` joins the
     * round after it, which then runs from the break's start ("+5 min to round 3", "Round 3 is now 55
     * min"). The last break of a session has no round after it: the round before runs on through it.
     * {breakStart, breakEnd, addedMinutes, round, roundMinutes}, or null when that break isn't there.
     */
    function breakSkipPreview(segments, breakStart) {
        const list = Array.isArray(segments) ? segments : [];
        const index = list.findIndex(item => item && item.kind === BREAK && item.start === breakStart);
        if (index < 0) return null;
        const pause = list[index];
        const minutes = ms => Math.max(1, Math.floor((ms + 30 * 1000) / MINUTE));
        const added = minutes(pause.end - pause.start);
        const next = list[index + 1];
        if (next && next.kind === STUDY) {
            return { breakStart: pause.start, breakEnd: pause.end, addedMinutes: added, round: next.round, roundMinutes: minutes(next.end - pause.start) };
        }
        const before = list[index - 1];
        if (!before || before.kind !== STUDY) return null;
        return { breakStart: pause.start, breakEnd: pause.end, addedMinutes: added, round: before.round, roundMinutes: minutes(pause.end - before.start) };
    }

    // ---- The Day Ring (Android StudyRingModel.of, boundaries, currentBreak) --------------------------
    // A session's rounds and breaks bent into a circle; fractions run 0..1 clockwise from 12 o'clock.

    /** {arcs: [{kind: DONE|LIVE|TODO, start, end, round}], beads, breaks: [[from, to]], tick, studiedMinutes, plannedMinutes, rounds}. */
    function dayRing(segments, now) {
        const list = array(segments);
        if (!list.length) return { arcs: [], beads: [], breaks: [], tick: null, studiedMinutes: 0, plannedMinutes: 0, rounds: 0 };
        const start = list[0].start;
        const end = list[list.length - 1].end;
        const span = end - start;
        if (!(span > 0)) return { arcs: [], beads: [], breaks: [], tick: null, studiedMinutes: 0, plannedMinutes: 0, rounds: 0 };
        const f = t => Math.min(1, Math.max(0, (t - start) / span));
        const arcs = [];
        const beads = [];
        const breaks = [];
        let studied = 0;
        let planned = 0;
        for (const segment of list) {
            if (segment.kind === BREAK) {
                beads.push(f((segment.start + segment.end) / 2));
                breaks.push([f(segment.start), f(segment.end)]);
                continue;
            }
            planned += segment.end - segment.start;
            if (!Number.isFinite(now) || now <= segment.start) arcs.push({ kind: 'TODO', start: f(segment.start), end: f(segment.end), round: segment.round });
            else if (now >= segment.end) {
                arcs.push({ kind: 'DONE', start: f(segment.start), end: f(segment.end), round: segment.round });
                studied += segment.end - segment.start;
            } else {
                // The round running now: done up to now, the rest still to fill.
                arcs.push({ kind: 'DONE', start: f(segment.start), end: f(now), round: segment.round });
                arcs.push({ kind: 'LIVE', start: f(now), end: f(segment.end), round: segment.round });
                studied += now - segment.start;
            }
        }
        const tick = Number.isFinite(now) && now >= start && now < end ? f(now) : null;
        return { arcs, beads, breaks, tick, studiedMinutes: roundMinutes(studied), plannedMinutes: roundMinutes(planned),
            rounds: list.filter(segment => segment.kind === STUDY).length };
    }

    /** Where one segment meets the next, for the 5° gaps: not the join between a round's done and live parts. */
    function ringBoundaries(ring) {
        const arcs = array(ring?.arcs);
        const joins = new Set();
        for (let i = 0; i + 1 < arcs.length; i += 1) if (arcs[i].round === arcs[i + 1].round && arcs[i].end === arcs[i + 1].start) joins.add(arcs[i].end);
        const edges = [...arcs.flatMap(arc => [arc.start, arc.end]), ...array(ring?.breaks).flat()].map(edge => (edge >= 1 ? 0 : edge));
        return [...new Set(edges.filter(edge => !joins.has(edge)))].sort((a, b) => a - b);
    }

    /** The break running now (the tick lies inside it), as its index, or null. */
    function currentBreak(ring) {
        if (!Number.isFinite(ring?.tick)) return null;
        const index = array(ring.breaks).findIndex(([from, to]) => ring.tick >= from && ring.tick < to);
        return index >= 0 ? index : null;
    }

    // ---- Page colour by state (Android StudyStateTheme, Study v3 §1) --------------------------------
    // The page takes the colour of the moment; cards stay paper and only their edge takes the state.

    const PAGE_STATES = Object.freeze(['IDLE', 'ROUND', 'LAST_FIVE', 'BREAK', 'END']);
    /** The light band behind the header before a session, and every night band: 280 px. */
    const PAGE_BAND_PX = 280;
    /** The last five minutes of a round get their own (deeper) wash. */
    const PAGE_LAST_FIVE_MS = 5 * MINUTE;
    /** Page colours cross-fade over this long. */
    const PAGE_CROSSFADE_MS = 450;
    // BrandPalette tones (0xRRGGBB), light and night, and the washes only Study uses.
    const TONES = Object.freeze({
        light: { canvas: 0xF6F2EB, desk: 0xECE4D9, paper: 0xFFFCF6, line: 0xDCD1C2, sage: 0xEDF4E7, sageDeep: 0x28623F,
            sunWash: 0xFBEDC8, sunInk: 0x5A3A07, sun: 0xEDB12E, rose: 0xFAE8E6 },
        night: { canvas: 0x0F141B, desk: 0x0B0F14, paper: 0x151C24, line: 0x2A3440, sage: 0x1E2E26, sageDeep: 0x5E9C7D,
            sunWash: 0x3D3220, sunInk: 0xF6D58A, sun: 0xEDB12E, rose: 0x3A2422 }
    });
    const SAGE_DEEP_WASH = 0xDFECD5;
    const SAGE_LOW = 0xF2F1E8;
    const SUN_LOW = 0xFDF5E4;
    const PAPER_SUN = 0xFFF9EC;
    const PANEL_LOW = 0xF1EBE2;
    const PAPER_EVENING = 0xFBF6EE;
    const SUN_SOFT = 0xE3B062;
    const NIGHT_IDLE_BAND = 0x16211F;
    const NIGHT_SAGE_DEEP_BAND = 0x24392D;
    const EDGE_ALPHA = 0.22;

    /** Linear mix of two colours (0xRRGGBB), t of the way from a to b. */
    function mixColor(a, b, t) {
        const ch = (c, shift) => (c >> shift) & 0xFF;
        const lerp = shift => Math.min(255, Math.max(0, Math.trunc(ch(a, shift) + (ch(b, shift) - ch(a, shift)) * t)));
        return (lerp(16) << 16) | (lerp(8) << 8) | lerp(0);
    }

    /** The page state: roundEndsAt in a round, onBreak on a break, ended while the end card shows. */
    function pageState(roundEndsAt, onBreak, ended, now) {
        if (ended) return 'END';
        if (onBreak) return 'BREAK';
        if (Number.isFinite(roundEndsAt)) {
            const left = roundEndsAt - now;
            return left >= 1 && left <= PAGE_LAST_FIVE_MS ? 'LAST_FIVE' : 'ROUND';
        }
        return 'IDLE';
    }

    /** After 7 pm (and before 5 am) the light page steps down to panel. */
    function pageEvening(hour) { return hour >= 19 || hour < 5; }

    /** {top, bottom, fadePx (0: over the whole page), card, cardEdge, sun} for one state. */
    function pagePalette(state, night, evening) {
        const t = night ? TONES.night : TONES.light;
        const make = (top, bottom, fadePx, card, cardEdge, sun) => ({ top, bottom, fadePx, card, cardEdge, sun });
        if (night) {
            const band = { IDLE: NIGHT_IDLE_BAND, ROUND: t.sage, END: t.sage, LAST_FIVE: NIGHT_SAGE_DEEP_BAND, BREAK: t.sunWash }[state] ?? NIGHT_IDLE_BAND;
            return make(band, t.canvas, PAGE_BAND_PX, t.paper, t.line, SUN_SOFT);
        }
        const sun = evening ? SUN_SOFT : t.sun;
        const edge = (ink, over) => mixColor(over, ink, EDGE_ALPHA);
        switch (state) {
            case 'ROUND': return make(t.sage, SAGE_LOW, 0, t.paper, edge(t.sageDeep, t.paper), sun);
            case 'LAST_FIVE': return make(SAGE_DEEP_WASH, SAGE_LOW, 0, t.paper, edge(t.sageDeep, t.paper), sun);
            case 'BREAK': return make(t.sunWash, SUN_LOW, 0, PAPER_SUN, edge(t.sunInk, PAPER_SUN), sun);
            case 'END': return make(t.sage, t.sage, 0, t.paper, t.line, sun);
            default: return evening ? make(t.desk, PANEL_LOW, 0, PAPER_EVENING, t.line, sun) : make(t.sage, t.canvas, PAGE_BAND_PX, t.paper, t.line, sun);
        }
    }

    // ---- "Up next after the break" (Android StudyHomeFeed.chips, StudyPageRules.subjectOf) ---------

    /** The study Home's subject chips: the branch's chips, else the pack's ({label, words}). */
    function studySubjects(study, catalog) {
        const value = object(study);
        const out = [];
        const seen = new Set();
        for (const id of array(value.activePackIds)) {
            const pack = array(object(catalog).packs).find(item => item.id === id);
            if (!pack) continue;
            const variant = packVariant(pack, object(object(value.packEdits)[id]).variant);
            const labels = array(variant?.chips).length ? variant.chips : array(pack.chips);
            for (const label of labels.map(text).filter(Boolean)) {
                const key = label.toLowerCase();
                if (seen.has(key)) continue;
                seen.add(key);
                // Android's words are the label and its search query without the exam name: the label again.
                out.push({ label, words: [label] });
            }
        }
        return out;
    }

    /** The first subject a title names (a whole-word match, case-insensitive), or null. */
    function subjectOf(title, subjects) {
        const value = text(title);
        if (!value) return null;
        for (const subject of array(subjects)) {
            if (topicPatterns(subject.words).some(rx => rx.test(value))) return subject.label;
        }
        return null;
    }

    // ---- Session ends: the end card (Android StudySessionEnds, StudyRingModel.seal, StudyClock.withSkips) --

    /** An end card older than this isn't news any more: it's dropped unseen. */
    const SESSION_END_STALE_MS = 18 * 60 * MINUTE;
    /** Within this of its end, a session that left the clock counts as ended (the alarm wakes late). */
    const SESSION_CLOSE_SLACK_MS = MINUTE;
    /** Sessions shorter than this (a mistaken start) get no card. */
    const SESSION_MIN_STUDIED_MINUTES = 1;

    /** Skipped breaks (their start times) fold into the round before, which runs on to the next round's end. */
    function withSkips(segments, skippedBreaks) {
        const skipped = new Set(array(skippedBreaks));
        if (!skipped.size) return array(segments).slice();
        const list = array(segments);
        const out = [];
        for (let i = 0; i < list.length; i += 1) {
            const segment = list[i];
            const last = out[out.length - 1];
            if (segment.kind === BREAK && skipped.has(segment.start) && last && last.kind === STUDY) {
                const next = list[i + 1] && list[i + 1].kind === STUDY ? list[i + 1] : null;
                out[out.length - 1] = { ...last, end: next ? next.end : segment.end, round: next ? next.round : last.round };
                if (next) i += 1;
                continue;
            }
            out.push(segment);
        }
        return out;
    }

    /** Whole minutes, rounded to the nearest (a 39.6-minute round reads 40). */
    function roundMinutes(ms) { return Math.floor((ms + 30 * 1000) / MINUTE); }

    /**
     * The end seal (Android StudyRingModel.seal): the segments clipped to what really happened (a Gentle
     * end can stop early), trailing breaks dropped. {studiedMinutes, rounds, perRound: [{round, minutes}]}.
     */
    function sessionSeal(segments, endedAt) {
        const clipped = [];
        for (const segment of array(segments)) {
            const end = Math.min(segment.end, endedAt);
            if (end > segment.start) clipped.push({ ...segment, end });
        }
        while (clipped.length && clipped[clipped.length - 1].kind === BREAK) clipped.pop();
        const rounds = clipped.filter(segment => segment.kind === STUDY);
        const studied = rounds.reduce((sum, segment) => sum + (segment.end - segment.start), 0);
        const studiedMinutes = roundMinutes(studied);
        // The rounds with the minutes each one held, out of the rounded total.
        const perRound = rounds.map(segment => ({ round: segment.round,
            minutes: studied > 0 ? Math.round(((segment.end - segment.start) / studied) * studiedMinutes) : 0 }))
            .filter(item => item.minutes > 0);
        return { studiedMinutes, rounds: rounds.length, perRound };
    }

    /**
     * Android StudySessionEnds.step: the open session for `clock` at `now`, and a session that just ended.
     * open: {start, end, planEnd, roundMinutes, breakMinutes, skipped: [breakStart]}; returns [open, ended],
     * ended = {start, endedAt, studiedMinutes, rounds, perRound}.
     */
    function sessionEndStep(open, clock, focus, skippedBreaks, now) {
        const value = object(clock);
        const { round, rest } = focusMinutes(focus);
        const studying = (value.state === STUDY || value.state === BREAK) && Number.isFinite(value.sessionStart) && Number.isFinite(value.sessionEnd);
        const skipped = array(skippedBreaks).filter(Number.isFinite);
        if (studying) {
            if (open && open.start === value.sessionStart) {
                return [{ ...open, end: value.sessionEnd, planEnd: Math.max(open.planEnd, value.sessionEnd),
                    roundMinutes: round, breakMinutes: rest, skipped: [...new Set([...array(open.skipped), ...skipped])] }, null];
            }
            // A new session: the previous one (if any) ended where this one began, at the latest.
            const started = { start: value.sessionStart, end: value.sessionEnd, planEnd: value.sessionEnd, roundMinutes: round, breakMinutes: rest, skipped };
            return [started, open ? closeSession(open, Math.min(open.end, value.sessionStart)) : null];
        }
        if (!open) return [null, null];
        // A clock hold keeps the lock on; time a parent gave pauses study. Neither ends it before its time.
        if (now < open.end - SESSION_CLOSE_SLACK_MS) return [open, null];
        return [null, closeSession(open, Math.min(open.end, now))];
    }

    function closeSession(open, endedAt) {
        const segments = withSkips(splitRounds(open.start, open.planEnd, { roundMinutes: open.roundMinutes, breakMinutes: open.breakMinutes }), open.skipped);
        const seal = sessionSeal(segments, endedAt);
        if (seal.studiedMinutes < SESSION_MIN_STUDIED_MINUTES) return null;
        return { start: open.start, endedAt, ...seal };
    }

    /** The end waiting for its card, or null (none, or too old to be news). */
    function pendingSessionEnd(ended, now) {
        if (!ended || !Number.isFinite(ended.endedAt)) return null;
        return now - ended.endedAt > SESSION_END_STALE_MS ? null : ended;
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
            // A skipped break folds into study (Android StudyClock.withSkips): its rules and its time are study's.
            const raw = splitRounds(current.start, current.end, input.focus);
            const skips = array(input.skippedBreaks).filter(Number.isFinite);
            const segments = skips.length ? withSkips(raw, skips) : raw;
            const segment = segments.find(item => item.start <= now && now < item.end) || segments[segments.length - 1];
            const rawNow = raw.find(item => item.start <= now && now < item.end);
            const skippedBreak = rawNow && rawNow.kind === BREAK && segment.kind === STUDY && skips.includes(rawNow.start)
                ? { start: rawNow.start, end: rawNow.end } : null;
            return {
                state: segment.kind, round: segment.round, rounds: segment.rounds, until: segment.end,
                sessionStart: current.start, sessionEnd: current.end, source: current.source,
                setByParentId: current.setByParentId || null, segments, skippedBreak
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
     * Input: {plan, focus, breakMode, now, session?, endedUntil?, limitReached?, parentLock?, clockHold?,
     *         skippedBreaks?: [breakStart]} (skipped breaks fold into study, Android StudyClock.withSkips).
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
            clockHold: false, segments: [], skippedBreak: null, ...current, breakMode, next };
        // Within a skipped break's own time the round runs on; the UI still says the break was skipped.
        result.breakSkipped = !!result.skippedBreak;
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
        else if (kind === SUGGESTION_KINDS.PACK_TOPICS) {
            found = own(PACK_TOPIC_SUGGESTIONS, key) || own(PACK_TOPIC_SUGGESTIONS, key.split(':')[0])
                || (isInterviewPackId(key.split(':')[0]) ? INTERVIEW_TOPICS : null);
        }
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

    /**
     * Every term a plan's search may name: each topic and all it covers, single words included
     * ("cement" under "building materials"). Search suggestions use it in the page (topicsForQuery
     * without the catalog); capped so a big plan stays cheap to match.
     */
    function planSearchTerms(topics) {
        return distinctTopics(array(topics).flatMap(topic => topicTerms(topic))).slice(0, MAX_PLAN_SEARCH_TERMS);
    }
    const MAX_PLAN_SEARCH_TERMS = 600;

    /**
     * Each pack's channels (UC ids) and topics on a study surface (studySurface rows carry
     * managedListId "study:<pack>"), with every term the topics cover: what a search during a round
     * also asks (Android StudySearchGroup). Channels without an id are left out.
     */
    function channelSearchGroups(surface) {
        const data = object(surface);
        const groups = new Map();
        const groupOf = tag => {
            if (!groups.has(tag)) groups.set(tag, { packId: tag.slice(TAG_PREFIX.length), channels: [], topics: [] });
            return groups.get(tag);
        };
        for (const row of array(data.whitelistChannels)) {
            const tag = text(object(row).managedListId);
            const id = text(object(row).id);
            if (tag.startsWith(TAG_PREFIX) && /^UC[\w-]{10,}$/.test(id) && !groupOf(tag).channels.includes(id)) groupOf(tag).channels.push(id);
        }
        for (const row of array(data.whitelistKeywords)) {
            const value = object(row);
            const tag = text(value.managedListId);
            if (tag.startsWith(TAG_PREFIX) && value.source === TOPIC_SOURCE && text(value.word)) groupOf(tag).topics.push(text(value.word));
        }
        return [...groups.values()].filter(group => group.channels.length)
            .map(group => ({ ...group, terms: planSearchTerms(group.topics) }));
    }

    /** A couple of example searches for the first pack of the plan ({packId, variantId}). */
    function exampleSearches(groups) {
        const first = array(groups).find(isObject);
        return first ? suggest(SUGGESTION_KINDS.SEARCH_EXAMPLES, suggestionSeed(first.packId, first.variantId)) : [];
    }

    // Android StudyTopicLabel: known acronyms stay upper case in a topic label.
    const TOPIC_ACRONYMS = new Set([
        'gate', 'cse', 'ece', 'eee', 'dbms', 'os', 'dsa', 'oop', 'oops', 'sql', 'ai', 'ml', 'nlp', 'cn', 'toc', 'coa',
        'upsc', 'ssc', 'neet', 'jee', 'cat', 'gre', 'gmat', 'ielts', 'toefl', 'sat', 'act', 'cbse', 'icse', 'ncert',
        'html', 'css', 'api', 'dp', 'bfs', 'dfs', 'gk', 'ca', 'cs', 'it', 'ias', 'ips', 'pcm', 'pcb', 'mba', 'llb',
        'clat', 'nda', 'cds', 'ibps', 'rbi', 'sbi', 'ugc', 'net', 'csir', 'mcat', 'lsat', 'bba', 'bca', 'mca', 'ib', 'igcse', 'ap'
    ]);

    /**
     * A topic as a label (Android StudyTopicLabel.of): sentence case, but known acronyms stay upper case
     * ("dbms" -> "DBMS", "gate cse" -> "GATE CSE", "algorithms and dsa" -> "Algorithms and DSA").
     */
    function topicLabel(topic, locale) {
        const value = String(topic ?? '');
        const words = value.trim().split(/\s+/).filter(Boolean);
        if (!words.length) return value;
        const lang = text(locale) || undefined;
        const lower = word => { try { return word.toLocaleLowerCase(lang); } catch (e) { return word.toLowerCase(); } };
        const upper = word => { try { return word.toLocaleUpperCase(lang); } catch (e) { return word.toUpperCase(); } };
        return words.map((word, index) => {
            const bare = lower(word).replace(/^[,.()&]+|[,.()&]+$/g, '');
            if (TOPIC_ACRONYMS.has(bare)) return upper(word);
            if (index === 0) { const [first, ...rest] = [...word]; return upper(first) + rest.join(''); }
            return word;
        }).join(' ');
    }

    /**
     * "How search works while studying" (Android StudySearchExplainer.content): how many plan channels
     * study search looks in, two subjects (topics with words of their own; exam names and short words
     * never) and two example searches from the first pack. {channels, topics, examples}.
     */
    function searchExplainer(study, catalog) {
        const value = object(study);
        const layers = activePackLayers(value, catalog);
        const keys = new Set();
        for (const layer of layers) {
            for (const channel of layer.channels) {
                const id = channelIdentity(channel);
                const key = id.id || id.handle;
                if (key) keys.add(key);
            }
        }
        const all = distinctTopics(layers.flatMap(layer => layer.keywords)).filter(topic => wordKey(topic).length > 3);
        const topics = all.filter(topic => suggest(SUGGESTION_KINDS.TOPIC_SYNONYMS, topic).length).slice(0, 2);
        const first = layers[0];
        const variantId = first ? text(packVariant(packFor(value, catalog, first.id), object(object(value.packEdits)[first.id]).variant)?.id) || null : null;
        let examples = first ? exampleSearches([{ packId: first.id, variantId }]) : [];
        if (!examples.length && first) examples = first.keywords.filter(topic => wordKey(topic).length > 3);
        return { channels: keys.size, topics, examples: examples.slice(0, 2) };
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

    function handleKey(value) { return text(value).replace(/^@/, '').toLowerCase(); }

    function variantsOf(pack) { return array(object(pack).variants).filter(isObject); }

    function distinctByKey(list) {
        const seen = new Set();
        return array(list).filter(value => {
            const key = wordKey(value);
            return !!key && !seen.has(key) && !!seen.add(key);
        });
    }

    /**
     * The channels studied with a branch (Android StudyPack.channelsFor): that branch's own plus the
     * pack channels no branch claims (NPTEL, MIT OpenCourseWare). Another branch's channels drop out,
     * so GATE Civil doesn't keep the CSE channels. Packs without branches keep every channel.
     */
    function packChannelsFor(pack, variantId) {
        const channels = array(object(pack).channels).filter(isObject);
        const variants = variantsOf(pack);
        if (!variants.length) return channels;
        const chosen = new Set(array(packVariant(pack, variantId)?.channels).map(handleKey));
        const claimed = new Set(variants.flatMap(variant => array(variant.channels)).map(handleKey));
        return channels.filter(channel => {
            const keys = [channel.handle, channel.channelId].map(handleKey).filter(Boolean);
            return keys.some(key => chosen.has(key)) || !keys.some(key => claimed.has(key));
        });
    }

    /**
     * The topics studied with a branch (Android StudyPack.topicsFor): the pack's shared topics plus
     * that branch's own. A pack topic another branch names ("thermodynamics" for ME) drops out.
     */
    function packTopicsFor(pack, variantId) {
        const value = object(pack);
        const base = [...array(value.keywords), ...Object.values(object(value.gradeKeywords)).flat()].map(text).filter(Boolean);
        const variants = variantsOf(pack);
        if (!variants.length) return distinctByKey(base);
        const chosen = packVariant(pack, variantId);
        const terms = variant => [...array(variant?.keywords), ...array(variant?.chips)].map(wordKey);
        const own = new Set(terms(chosen));
        const claimed = new Set(variants.flatMap(terms));
        const shared = base.filter(topic => own.has(wordKey(topic)) || !claimed.has(wordKey(topic)));
        return distinctByKey([...shared, ...array(chosen?.keywords).map(text)]);
    }

    /** True when choosing a variant hides the other variants' uploads (GATE branches, school streams). */
    function hasSeparateBranches(pack) {
        return variantsOf(pack).length > 1 && object(pack).variantsShareTopics !== true;
    }

    function hasLowerCase(value) { return /\p{Ll}/u.test(value); }

    /** A branch's keywords and chips, its acronym name ("CSE", not "EE") and "<exam> <branch>" ("GATE Civil"). */
    function branchTerms(pack, variant) {
        const names = object(variant.names || variant.name);
        const name = text(names.en) || text(Object.values(names)[0]) || text(variant.id);
        const single = !!name && !/\s/.test(name);
        const out = [...array(variant.keywords), ...array(variant.chips)].map(text).filter(Boolean);
        if (single && name.length >= 3 && !hasLowerCase(name)) out.push(name);
        const exam = text(object(pack).shortName);
        if (single && exam) out.push(`${exam} ${name}`);
        return out;
    }

    /**
     * What names a branch in a title (Android StudyPack.branchTopics): its own keywords and chips, its
     * acronym and "<exam> <branch>", without the terms every branch shares ("Engineering maths",
     * "Previous year questions"), which name no branch. Empty without separate branches.
     */
    function branchTopics(pack, variantId) {
        if (!hasSeparateBranches(pack)) return [];
        const chosen = packVariant(pack, variantId);
        if (!chosen) return [];
        const sets = variantsOf(pack).map(variant => new Set(branchTerms(pack, variant).map(wordKey)));
        const common = new Set([...sets[0]].filter(key => sets.every(set => set.has(key))));
        return distinctByKey(branchTerms(pack, chosen).filter(term => !common.has(wordKey(term))));
    }

    /**
     * Topics only the other branches name ("dbms", "gate cse", "power electronics" for GATE Civil;
     * Android StudyPack.otherBranchTopics). Topics the chosen branch also names stay out, and so do
     * short or ambiguous words: a lowercase word of three letters or fewer ("toc", "som", "et") and
     * AMBIGUOUS_BRANCH_WORDS. "EE" and "ME" only count as "gate ee" / "gate me".
     */
    function otherBranchTopics(pack, variantId) {
        if (!hasSeparateBranches(pack)) return [];
        const chosen = packVariant(pack, variantId);
        if (!chosen) return [];
        const own = new Set(branchTerms(pack, chosen).map(wordKey));
        const others = variantsOf(pack).filter(variant => variant !== chosen && variant.id !== chosen.id)
            .flatMap(variant => branchTerms(pack, variant));
        return distinctByKey(others.filter(term => {
            const key = wordKey(term);
            if (own.has(key) || key.length < 2) return false;
            if (key.includes(' ')) return true;
            if (AMBIGUOUS_BRANCH_WORDS.includes(key)) return false;
            return key.length > 3 || (key.length === 3 && !hasLowerCase(term));
        }));
    }

    /**
     * Another branch's uploads (Android StudyBranchFilter.of): {ownTopics, otherBranchTopics}, or null
     * when no pack has separate branches. Multi-branch channels (MADE EASY, ACE, GATE Academy) upload
     * every branch's lectures, so a GATE Civil student would otherwise get "GATE CSE DBMS" lectures.
     * A branched pack counts its branch's topics and the topics the user added as its own; a pack
     * without branches counts all its topics, so GATE Civil + JEE keeps "thermodynamics". Shared
     * subjects (engineering maths, aptitude, past papers) name no branch, so they never hide a video.
     */
    function studyBranchFilter(packs, edits) {
        const list = array(packs).filter(isObject);
        if (!list.some(hasSeparateBranches)) return null;
        const changes = object(edits);
        const own = distinctByKey(list.flatMap(pack => {
            const edit = object(changes[pack.id]);
            return [...(hasSeparateBranches(pack) ? branchTopics(pack, edit.variant) : packTopicsFor(pack, edit.variant)),
                ...array(edit.topicsAdded).map(text)];
        }));
        const ownKeys = new Set(own.map(wordKey));
        const other = distinctByKey(list.flatMap(pack => otherBranchTopics(pack, object(changes[pack.id]).variant))
            .filter(topic => !ownKeys.has(wordKey(topic))));
        return other.length ? { ownTopics: own, otherBranchTopics: other } : null;
    }

    /** True for a title that names another branch's topic and none of the studied ones. */
    function branchFilterDrops(filter, title) {
        if (!filter) return false;
        const value = String(title || '');
        return topicPatterns(filter.otherBranchTopics).some(pattern => pattern.test(value))
            && !topicPatterns(filter.ownTopics).some(pattern => pattern.test(value));
    }

    /**
     * The filter as one title-only block row: a pattern that matches exactly the titles
     * branchFilterDrops() drops, so the JSON filter, the page filter and the Watch gate use it as they
     * use any blocked word. Null without a filter.
     */
    function branchFilterRow(filter) {
        if (!filter) return null;
        const alternatives = topics => topicPatterns(topics).map(pattern => pattern.source).join('|');
        const other = alternatives(filter.otherBranchTopics);
        if (!other) return null;
        const own = alternatives(filter.ownTopics);
        const word = `^${own ? `(?![\\s\\S]*(?:${own}))` : ''}(?=[\\s\\S]*(?:${other}))`;
        return { word, matchMode: 'regex', regexFlags: 'iu', exact: false, comments: false, titleOnly: true,
            source: BRANCH_SOURCE, managedListId: `${TAG_PREFIX}branch` };
    }

    function isKidsPack(pack) { return KIDS_KINDS.includes(text(object(pack).kind)); }

    /** The active packs that are Kids packs, in their order. Unknown packs (or no catalog) are not. */
    function kidsPackIds(packIds, catalog) {
        const packs = array(object(catalog).packs);
        return array(packIds).filter(id => isKidsPack(packs.find(pack => pack.id === id)));
    }

    /**
     * What the Kids site shows now (Android StudyKidsSpace.kind): "untouched" outside a study round
     * (normal rules, a break, the limit: those already have their own screens), "learning" in a round
     * with a Kids pack active, else "study_time".
     */
    function studyKidsSpace(phase, packIds, catalog) {
        if (phase !== 'study') return KIDS_SPACE.UNTOUCHED;
        return kidsPackIds(packIds, catalog).length ? KIDS_SPACE.LEARNING : KIDS_SPACE.STUDY_TIME;
    }

    /**
     * When Kids opens again during a study round (Android StudyKidsSpace.opensAt): the next break,
     * else (the last round) the end of the session. {at, atBreak}, or null outside a round.
     */
    function kidsOpensAt(clock) {
        const value = object(clock);
        if (value.state !== STUDY) return null;
        if (object(value.next).state === BREAK && Number.isFinite(value.until)) return { at: value.until, atBreak: true };
        const end = Number.isFinite(value.sessionEnd) ? value.sessionEnd : value.until;
        return Number.isFinite(end) ? { at: end, atBreak: false } : null;
    }

    /** The one-line Kids note under the pack picker (Android StudyKidsSpace.setupNote); null with nothing chosen. */
    function kidsSetupNote(selected, catalog) {
        if (!array(selected).length) return null;
        return kidsPackIds(selected, catalog).length ? 'kids_learning' : 'kids_hold';
    }

    function packLayer(pack, edits) {
        const change = object(edits);
        const removedChannels = array(change.channelsRemoved);
        const removedTopics = new Set(array(change.topicsRemoved).map(wordKey));
        const channels = [];
        for (const channel of [...packChannelsFor(pack, change.variant), ...array(change.channelsAdded)]) {
            if (removedChannels.some(removed => sameChannel(channel, removed))) continue;
            if (channels.some(existing => sameChannel(existing, channel))) continue;
            channels.push({ channelId: text(channel.channelId) || null, handle: text(channel.handle) || null, name: text(channel.name) });
        }
        const keywords = [];
        const seen = new Set();
        // The pack's shared topics and the chosen branch's own (GATE CSE: "dbms", ...); a topic
        // another branch names drops out.
        for (const word of [...packTopicsFor(pack, change.variant), ...array(change.topicsAdded)]) {
            const key = wordKey(word);
            if (!key || removedTopics.has(key) || seen.has(key)) continue;
            seen.add(key);
            keywords.push(text(word));
        }
        // Lesson phrases the kept topics cover (Android StudyEffectiveRules.layer synonyms).
        const variantId = text(packVariant(pack, change.variant)?.id) || null;
        const synonyms = studyAllowPhrases(pack.id, variantId, keywords)
            .filter(phrase => !removedTopics.has(wordKey(phrase)) && !seen.has(wordKey(phrase)));
        return { id: pack.id, kind: text(pack.kind), channels, keywords, synonyms, blockedWords: array(pack.blockedWords).map(text).filter(Boolean) };
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
                // The chosen branch's channels and topics (Android StudyPackCopy.of).
                const variantId = object(object(value.packEdits)[id]).variant;
                const topics = packTopicsFor(pack, variantId).slice(0, 400);
                copies[id] = {
                    channels: packChannelsFor(pack, variantId).slice(0, 400).map(channel => ({
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

    function studySurface(surface, layers, { kids, packChannelsOnly = false, branchRow = null }) {
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
        // Another branch's uploads ("GATE CSE DBMS" while GATE Civil is studied) are hidden by title.
        if (branchRow) blockWords.push(branchRow);
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
        // Trending and the search page's own shelves ("People also watched", "For you") are off while
        // study holds the rules (review E-08): they would only fill with what the plan hides.
        return { ...clone(object(settings)), enabled: true, syncKidsToMain: false, hideComments: true,
            hideExploreTrending: true, hideSearchShelves: true };
    }

    /** "study" during a round, "rest" for a rest break, the limit or a clock hold, else "normal". */
    function studyPhase(clock) {
        const value = object(clock);
        if (value.clockHold === true || value.state === LIMIT) return 'rest';
        if (value.state === STUDY) return 'study';
        // A skipped break is not a BREAK any more: the clock folds it into the round (withSkips).
        if (value.state === BREAK && value.breakMode !== 'normal') return 'rest';
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
        const unchanged = { profile, applied: false, packIds: [], phase: 'normal', failClosed: false, kidsSpace: KIDS_SPACE.UNTOUCHED, branchFilter: null };
        if (!isObject(value)) return unchanged;
        const phase = studyPhase(clock);
        if (phase === 'normal') return unchanged;
        if (phase === 'rest') {
            return {
                profile: { ...source, settings: studySettings(source.settings), main: restSurface(source.main, { kids: false }), kids: restSurface(source.kids, { kids: true }) },
                applied: true, packIds: [], phase: 'rest', failClosed: false, kidsSpace: KIDS_SPACE.UNTOUCHED, branchFilter: null
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
                    // No known pack is no Kids pack: Kids holds (study time), as on Android.
                    kids: restSurface(source.kids, { kids: true })
                },
                applied: true, packIds: [], phase: rest ? 'rest' : 'study', failClosed: true,
                kidsSpace: rest ? KIDS_SPACE.UNTOUCHED : KIDS_SPACE.STUDY_TIME, branchFilter: null
            };
        }
        const packIds = layers.map(layer => layer.id);
        // Another branch's uploads leave Main; needs the catalog's branches (a pack copy has none).
        const branchFilter = studyBranchFilter(packIds.map(id => array(object(catalog).packs).find(pack => pack.id === id)).filter(Boolean),
            value.packEdits);
        // Only Kids packs drive Kids: an exam or class pack never puts its videos there.
        const kidsLayers = layers.filter(isKidsPack);
        return {
            profile: {
                ...source,
                settings: studySettings(source.settings),
                main: studySurface(source.main, layers, { kids: false, packChannelsOnly, branchRow: branchFilterRow(branchFilter) }),
                kids: kidsLayers.length
                    ? studySurface(source.kids, kidsLayers, { kids: true, packChannelsOnly })
                    : restSurface(source.kids, { kids: true })
            },
            applied: true,
            packIds,
            phase: 'study',
            failClosed: false,
            kidsSpace: kidsLayers.length ? KIDS_SPACE.LEARNING : KIDS_SPACE.STUDY_TIME,
            branchFilter
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
        SUGGESTION_KINDS, INTERVIEW_TOPICS, isInterviewPackId, suggest, suggestionSeed, studyTopics, studyAllowPhrases, topicTerms, topicPatterns,
        topicsForQuery, planSearchTerms, channelSearchGroups, exampleSearches, searchExplainer, topicLabel, breakSkipPreview, SKIP_UNDO_MS,
        dayRing, ringBoundaries, currentBreak,
        PAGE_STATES, PAGE_BAND_PX, PAGE_LAST_FIVE_MS, PAGE_CROSSFADE_MS, pageState, pageEvening, pagePalette, mixColor,
        studySubjects, subjectOf, withSkips, sessionSeal, sessionEndStep, pendingSessionEnd, SESSION_END_STALE_MS, SESSION_CLOSE_SLACK_MS,
        packVariant, packLayer, activePackLayers, stampPackCopies, studyEffectiveProfile,
        BRANCH_SOURCE, KIDS_KINDS, KIDS_SPACE, AMBIGUOUS_BRANCH_WORDS,
        packChannelsFor, packTopicsFor, hasSeparateBranches, branchTopics, otherBranchTopics,
        studyBranchFilter, branchFilterDrops, branchFilterRow,
        isKidsPack, kidsPackIds, studyKidsSpace, kidsOpensAt, kidsSetupNote,
        addProgressMinutes, minutesOn, weekProgress, selfStarted, endPolicy
    });
}));
