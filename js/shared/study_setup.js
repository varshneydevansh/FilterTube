/* The logic behind Study's step-by-step setup (Android StudySetupGroups.kt), free of views so it can be
 * tested:
 * - StudySetupPath: the steps (what for, the list, a stream, review, ready) and Back / Next.
 * - StudyExamFields: which field an exam belongs to (Engineering, Medical, ...), from its id.
 * - StudyExamList: a country's exams grouped by field, with neighbours' and global exams folded under
 *   "Also taken from {country}", and search across all of it.
 * - StudySchool: a country's boards, the classes each board covers, and the global class packs.
 * - StudySkills: the "Learn a skill" packs (global lessons).
 * - StudyInterviews: the "A job interview" packs (coding, system design, finance, HR, ...).
 * - StudyReviewGroups: Review's channel and topic groups ("For {stream}", "Everyone taking {exam}",
 *   "Your own"), the edits a switch or an added channel makes, and the bar's counts.
 * - StudyChannelInput: what someone typed into "Add a channel" (a name, an @handle, a UC id or a link).
 * Packs are the parsed rows of js/shared/study_packs.js; edits are study.packEdits rows
 * ({channelsAdded, channelsRemoved, topicsAdded, topicsRemoved, variant}). */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubeStudySetup = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const GLOBAL_PREFIX = 'global_';
    const KIND_CLASS = 'class';
    /** Job-interview prep (Android StudyPackCatalog.KIND_INTERVIEW): global packs, their own setup tile. */
    const KIND_INTERVIEW = 'interview';
    const EXAM_KINDS = Object.freeze(['study', 'exam']);
    /** Android StudySetupActivity.MIN_CHANNELS: a pack shows in setup with at least this many channels. */
    const MIN_CHANNELS = 3;
    /** Android StudyState.MAX_EDIT_ROWS. */
    const MAX_EDIT_ROWS = 500;
    /** Review folds a group of more than ROWS_FOLDED + 2 rows to ROWS_FOLDED (Android b753aa71f). */
    const ROWS_FOLDED = 6;
    const TOPICS_FOLDED = 12;
    const MAX_TOPICS = 60;

    function array(value) { return Array.isArray(value) ? value : []; }
    function text(value) { return typeof value === 'string' ? value.trim() : ''; }
    function object(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

    // ---- Shared pack helpers (Android StudyPack) ------------------------------------------------

    function normalizeHandle(value) { return text(value).replace(/^@/, '').toLowerCase(); }
    const CHANNEL_ID_RX = /^UC[A-Za-z0-9_-]{22}$/;
    /** Android StudyChannelRef.normalizeKey: "UC..." ids keep their case; handles compare without "@" and case. */
    function normalizeKey(value) {
        const trimmed = text(value);
        return CHANNEL_ID_RX.test(trimmed) ? `id:${trimmed}` : `h:${trimmed.replace(/^@/, '').toLowerCase()}`;
    }
    /** Android StudyChannelRef.key(): the channel id first, then the handle. */
    function refKey(ref) {
        const value = object(ref);
        const id = text(value.channelId);
        if (id) return `id:${id}`;
        const handle = text(value.handle);
        return handle ? normalizeKey(handle) : '';
    }
    function topicKey(value) { return text(value).replace(/\s+/g, ' ').toLowerCase(); }
    function isGlobal(pack) { return text(pack?.id).startsWith(GLOBAL_PREFIX) || array(pack?.countries).length === 0; }
    function packName(pack, language) {
        const names = object(pack?.names);
        const lang = text(language).toLowerCase().split(/[-_]/)[0];
        return (lang && names[lang]) || names.en || Object.values(names)[0] || text(pack?.id);
    }
    function variant(pack, id) {
        const variants = array(pack?.variants);
        return variants.find(item => item.id === id) || variants.find(item => item.isDefault) || variants[0] || null;
    }
    function variantName(item, language) {
        const names = object(item?.names);
        const lang = text(language).toLowerCase().split(/[-_]/)[0];
        return (lang && names[lang]) || names.en || Object.values(names)[0] || text(item?.id);
    }
    function distinctBy(list, key) {
        const seen = new Set();
        return list.filter(item => { const k = key(item); return !seen.has(k) && !!seen.add(k); });
    }
    function channelsFor(pack, variantId) {
        const channels = array(pack?.channels);
        const variants = array(pack?.variants);
        if (!variants.length) return channels;
        const chosen = new Set(array(variant(pack, variantId)?.channels).map(normalizeHandle));
        const claimed = new Set(variants.flatMap(item => array(item.channels)).map(normalizeHandle));
        return channels.filter(channel => {
            const keys = [channel.handle, channel.channelId].filter(Boolean).map(normalizeHandle);
            return keys.some(key => chosen.has(key)) || !keys.some(key => claimed.has(key));
        });
    }
    function topicsFor(pack, variantId) {
        const base = [...array(pack?.keywords), ...Object.values(object(pack?.gradeKeywords)).flat()];
        const variants = array(pack?.variants);
        if (!variants.length) return distinctBy(base, topicKey);
        const chosen = variant(pack, variantId);
        const terms = item => new Set([...array(item?.keywords), ...array(item?.chips)].map(topicKey));
        const own = chosen ? terms(chosen) : new Set();
        const claimed = new Set(variants.flatMap(item => [...terms(item)]));
        const shared = base.filter(topic => own.has(topicKey(topic)) || !claimed.has(topicKey(topic)));
        return distinctBy([...shared, ...array(chosen?.keywords)], topicKey);
    }
    function matchChannel(pack, channelId, handle) {
        const id = text(channelId);
        const wanted = normalizeHandle(handle);
        const channels = array(pack?.channels);
        if (id) {
            const byId = channels.find(channel => channel.channelId === id);
            if (byId) return byId;
        }
        if (!wanted) return null;
        return channels.find(channel => (!id || !channel.channelId) && channel.handle && normalizeHandle(channel.handle) === wanted) || null;
    }
    function emptyEdit() { return { channelsAdded: [], channelsRemoved: [], topicsAdded: [], topicsRemoved: [] }; }
    function editOf(edit) {
        const value = object(edit);
        const out = {
            channelsAdded: array(value.channelsAdded).filter(row => row && typeof row === 'object'),
            channelsRemoved: array(value.channelsRemoved).map(text).filter(Boolean),
            topicsAdded: array(value.topicsAdded).map(text).filter(Boolean),
            topicsRemoved: array(value.topicsRemoved).map(text).filter(Boolean)
        };
        if (text(value.variant)) out.variant = text(value.variant);
        return out;
    }

    // ---- Steps (Android StudySetupPath) ----------------------------------------------------------

    const MODES = Object.freeze({ EXAM: 'exam', SCHOOL: 'school', SKILL: 'skill', INTERVIEW: 'interview' });

    /** The tile a chosen pack lives under (Android StudySetupMode.of), so changing a plan reopens on its list. */
    function modeOf(pack) {
        if (pack?.kind === 'kids_age' || pack?.kind === 'kids_classic') return MODES.SKILL;
        if (pack?.kind === KIND_INTERVIEW) return MODES.INTERVIEW;
        if (isGlobal(pack) && (pack?.kind === KIND_CLASS || StudyExamFields.of(pack) === 'skills')) return MODES.SKILL;
        if (pack?.kind === KIND_CLASS) return MODES.SCHOOL;
        return MODES.EXAM;
    }
    const STEPS = Object.freeze(['kind', 'list', 'stream', 'review', 'ready']);

    const StudySetupPath = Object.freeze({
        /** The steps this setup walks through, for the progress dots and Back. */
        of(needsStream) { return STEPS.filter(step => step !== 'stream' || needsStream); },
        /** Exams with streams get their own stream step; school classes pick a stream inline. */
        needsStream(packs) { return array(packs).some(pack => array(pack?.variants).length > 0 && pack.kind !== KIND_CLASS); },
        /** The step Back goes to from `step`; null leaves setup. */
        back(step, needsStream) {
            const path = StudySetupPath.of(needsStream);
            const index = path.indexOf(step);
            return index <= 0 ? null : path[index - 1];
        },
        /** The step Next goes to from `step`; null at the end. */
        next(step, needsStream) {
            const path = StudySetupPath.of(needsStream);
            const index = path.indexOf(step);
            return path[index + 1] || null;
        }
    });

    // ---- Exam fields (Android StudyExamFields) ---------------------------------------------------

    /** In the order the exam list shows them. */
    const FIELDS = Object.freeze(['engineering', 'medical', 'civil', 'jobs', 'defence', 'law', 'finance', 'teaching',
        'school', 'languages', 'skills', 'other']);

    /**
     * Id words -> field; the first rule with a matching word wins. Ids are split on "_" and lose their
     * country prefix first ("in_ca_icai" -> ca, icai; "ca_provincial" -> provincial).
     */
    const RULES = Object.freeze([
        ['skills', ['coding', 'programming', 'interview']],
        ['defence', ['nda', 'cds', 'afcat', 'agniveer', 'ssb']],
        ['engineering', ['gate', 'jee', 'ioe', 'bitsat', 'ecat', 'engineering', 'fe', 'passport']],
        ['medical', ['neet', 'mbbs', 'mdcat', 'mcat', 'usmle', 'ucat', 'plab', 'nclex', 'mecee', 'gamsat', 'medical',
            'tus', 'medicina', 'enarm', 'residencia', 'mccqe', 'tms', 'pass', 'las']],
        ['civil', ['upsc', 'psc', 'lok', 'sewa', 'css', 'bcs', 'wbcs', 'tnpsc', 'kpsc', 'mpsc', 'appsc',
            'tspsc', 'cpns', 'kpss', 'civil', 'concursos', 'oposiciones', 'concorsi', 'kedinasan', 'ppsc', 'fpsc']],
        ['jobs', ['banking', 'ssc', 'rrb', 'police', 'ibps', 'sbi', 'bank', 'bumn']],
        ['law', ['clat', 'cat', 'lsat', 'bar', 'gmat', 'judiciary', 'ailet', 'law', 'oab', 'jura', 'sqe', 'lnat', 'takken']],
        ['finance', ['ca', 'icai', 'cs', 'icsi', 'cma', 'icmai', 'cfa', 'frm', 'acca', 'cima', 'cpa', 'boki', 'ican', 'kasneb', 'finra', 'icap']],
        ['teaching', ['ctet', 'tet', 'ugc', 'net', 'kvs', 'praxis', 'docente', 'crpe', 'teacher', 'tsc']],
        ['languages', ['ielts', 'toefl', 'gre', 'pte', 'det', 'jlpt', 'hsk', 'topik', 'eiken', 'duolingo', 'yds', 'step', 'toeic']],
        ['school', ['sat', 'act', 'ap', 'common', 'suneung', 'abitur', 'baccalaureat', 'bac', 'pau',
            'enem', 'admision', 'admission', 'saber11', 'paes', 'utbk', 'snbt', 'upcat', 'thpt', 'tcas', 'spm', 'yks', 'konkur',
            'thanaweya', 'qudurat', 'tahsili', 'ege', 'nmt', 'matura', 'maturita', 'vestibular', 'ingreso', 'cpge', 'provincial',
            'hsc', 'vce', 'atar', 'ncea', 'national', 'gcse', 'level', 'ib', 'cbse', 'waec', 'wassce', 'jamb', 'utme', 'kcse',
            'nsc', 'matric', 'uneb', 'gce', 'al', 'eju', 'gaokao', 'lgs', 'brevet', 'comipems', 'koukou', 'juken',
            'prep', 'certificate', 'osmoklasisty', 'oge', 'dgnl', 'vao10', 'tka', 'bece', 'neco', 'kjsea', 'ged', 'ales', 'dgs', 'exit',
            'cuet', 'plus', 'scholarship']]
    ]);

    /** Name words for packs no id rule knows (a pack added later): the same fields, by the English name. */
    const NAME_RULES = Object.freeze([
        ['medical', /\b(medical|medicine|nursing|mbbs)\b/],
        ['engineering', /\bengineering\b/],
        ['civil', /\b(civil service|public service|civil-service)/],
        ['languages', /\b(language|english|proficiency)\b/],
        ['law', /\b(law|mba|bar)\b/],
        ['finance', /\b(accountan\w*|finance)\b/],
        ['school', /\b(university|entrance|admission|secondary|school|certificate)\b/]
    ]);

    const StudyExamFields = Object.freeze({
        FIELDS,
        /** The id's words, without the country (or "global"/"cls") prefix. */
        words(id) {
            const parts = text(id).toLowerCase().split('_').filter(Boolean);
            const first = parts[0];
            if (!first) return [];
            return first.length === 2 || first === 'global' || first === 'cls' ? parts.slice(1) : parts;
        },
        of(pack) {
            const words = new Set(StudyExamFields.words(pack?.id));
            for (const [field, keys] of RULES) if (keys.some(key => words.has(key))) return field;
            const name = packName(pack, 'en').toLowerCase();
            for (const [field, rx] of NAME_RULES) if (rx.test(name)) return field;
            return 'other';
        }
    });

    // ---- Exam list (Android StudyExamList) -------------------------------------------------------

    function countryCode(country) {
        const code = text(country).toUpperCase();
        return code.length === 2 ? code : null;
    }

    function groupByField(packs) {
        const groups = new Map();
        for (const pack of packs) {
            const field = StudyExamFields.of(pack);
            if (!groups.has(field)) groups.set(field, []);
            groups.get(field).push(pack);
        }
        return FIELDS.filter(field => groups.has(field)).map(field => ({ field, packs: groups.get(field) }));
    }

    /** Search: the name in any language, the short name, keywords and subjects. */
    function matches(pack, words) {
        if (!words) return true;
        return Object.values(object(pack?.names)).some(name => String(name).toLowerCase().includes(words))
            || (!!text(pack?.shortName) && text(pack.shortName).toLowerCase().includes(words))
            || array(pack?.keywords).some(word => String(word).toLowerCase().includes(words))
            || array(pack?.subjects).some(word => String(word).toLowerCase().includes(words));
    }

    const StudyExamList = Object.freeze({
        EXAM_KINDS,
        /**
         * The exam list for one country: `own` exams grouped by field; `also` the neighbours' and global
         * exams people there take (folded, quiet); `elsewhere` only while searching, every other exam that
         * matches. With no country, `own` holds the global exams.
         */
        of(catalog, country, query = '', minChannels = 0) {
            const code = countryCode(country);
            const exams = array(catalog?.packs).filter(pack => EXAM_KINDS.includes(pack.kind)
                && array(pack.channels).length >= minChannels && StudyExamFields.of(pack) !== 'skills');
            const own = code === null ? exams.filter(isGlobal) : exams.filter(pack => array(pack.countries).includes(code));
            const ownIds = new Set(own.map(pack => pack.id));
            const also = code === null ? [] : exams.filter(pack => !ownIds.has(pack.id) && (array(pack.nearby).includes(code) || isGlobal(pack)));
            const words = text(query).toLowerCase();
            const model = (ownList, alsoList, elsewhere) => {
                const alsoGroups = groupByField(alsoList);
                const ownGroups = groupByField(ownList);
                return {
                    own: ownGroups, also: alsoGroups, elsewhere,
                    alsoPacks: alsoGroups.flatMap(group => group.packs),
                    isEmpty: !ownGroups.length && !alsoGroups.length && !elsewhere.length
                };
            };
            if (!words) return model(own, also, []);
            const seen = new Set([...ownIds, ...also.map(pack => pack.id)]);
            const elsewhere = exams.filter(pack => !seen.has(pack.id) && matches(pack, words));
            return model(own.filter(pack => matches(pack, words)), also.filter(pack => matches(pack, words)), elsewhere);
        },
        matches,
        /**
         * The short label on an exam chip: the pack's short name, else its name without a leading
         * "Country: " and without the bracketed detail ("CAT (MBA entrance)" -> "CAT").
         */
        chipLabel(pack, language) {
            const short = text(pack?.shortName);
            if (short) {
                // "JEE" for "JEE Main / Advanced" loses the detail; keep names that are already short.
                const name = packName(pack, language);
                return name.length <= 14 ? name : short;
            }
            let name = packName(pack, language);
            const colon = name.indexOf(': ');
            if (colon >= 1 && colon <= 24) name = name.slice(colon + 2);
            return name.split(' (')[0].trim() || packName(pack, language);
        }
    });

    // ---- School (Android StudySchool) ------------------------------------------------------------

    const TRAILING_RANGE = /\s+\d+\s*-\s*\d+\+?$/;
    const TRAILING_GRADE_WORD = /\s+(classes|class|grades|grade|years|year)$/i;
    const RANGE = /(\d+)\s*-\s*(\d+)/;

    const StudySchool = Object.freeze({
        /** A country's own school packs grouped by board, in catalog order. Never a neighbour's board or a global pack. */
        boards(catalog, country, minChannels = 0) {
            const code = countryCode(country);
            if (code === null) return [];
            const packs = array(catalog?.packs).filter(pack => pack.kind === KIND_CLASS && !isGlobal(pack)
                && array(pack.countries).includes(code) && array(pack.channels).length >= minChannels);
            const groups = new Map();
            for (const pack of packs) {
                const key = StudySchool.boardKey(pack);
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push(pack);
            }
            return [...groups.entries()].map(([key, group]) => {
                const grades = new Map();
                for (const pack of group) for (const grade of StudySchool.gradesOf(pack)) if (!grades.has(grade.key)) grades.set(grade.key, grade);
                const sorted = [...grades.values()].sort((a, b) => (Number(a.form) - Number(b.form))
                    || ((Number.isFinite(Number(a.number)) ? Number(a.number) : 99) - (Number.isFinite(Number(b.number)) ? Number(b.number) : 99)));
                return { key, label: StudySchool.boardLabel(group), packIds: group.map(pack => pack.id), grades: sorted };
            });
        },
        /** The class packs for every curriculum (Khan Academy, CrashCourse, ...). */
        globals(catalog, minChannels = 0) {
            return array(catalog?.packs).filter(pack => pack.kind === KIND_CLASS && isGlobal(pack) && array(pack.channels).length >= minChannels);
        },
        /** "CBSE (NCERT)" -> "CBSE"; "AQA / Edexcel / OCR" -> "AQA"; packs without a board group by their own id. */
        boardKey(pack) {
            const board = text(pack?.board).split(' (')[0].split(' / ')[0].trim();
            return board || pack.id;
        },
        /** "CBSE / NCERT Classes 6-8" -> "CBSE / NCERT"; "Maharashtra State Board (SSC 9-10, HSC 11-12)" -> "Maharashtra State Board". */
        stem(name) {
            let out = String(name).split(' (')[0].trim();
            out = out.replace(TRAILING_RANGE, '').trim();
            out = out.replace(TRAILING_GRADE_WORD, '').trim();
            return out || String(name).trim();
        },
        /** A board chip's label: the shared short name, else the one stem, else short stems joined, else the board. */
        boardLabel(packs) {
            const shorts = [...new Set(packs.map(pack => text(pack.shortName) || null))];
            if (shorts.length === 1 && shorts[0]) return shorts[0];
            const stems = [...new Set(packs.map(pack => StudySchool.stem(packName(pack, 'en'))))];
            if (stems.length === 1) return stems[0];
            if (stems.length <= 3 && stems.every(stem => stem.length <= 8)) return stems.join(' / ');
            return text(packs[0]?.board).split(' (')[0].trim() || stems[0];
        },
        /** The classes a pack covers: its grade band ("9-12"), else its per-grade topic keys ("form1"). */
        gradesOf(pack) {
            const grade = text(pack?.grade);
            const match = RANGE.exec(grade);
            // "Form 1-4" (Kenya) is not classes 1 to 4: forms come from the per-grade keys below.
            if (match && !/form/i.test(grade)) {
                const from = Number(match[1]);
                const to = Number(match[2]);
                if (from >= 0 && from <= to && to - from <= 13) {
                    const out = [];
                    for (let n = from; n <= to; n += 1) out.push({ key: String(n), number: String(n), form: false, packId: pack.id });
                    return out;
                }
            }
            return Object.keys(object(pack?.gradeKeywords)).map(key => {
                const digits = key.replace(/\D/g, '');
                if (/^\d+$/.test(key)) return { key, number: key, form: false, packId: pack.id };
                if (key.toLowerCase().startsWith('form') && digits) return { key, number: digits, form: true, packId: pack.id };
                return null;
            }).filter(Boolean);
        },
        /** The board and class a selected pack sits at, for reopening setup on the same chips. */
        locate(boards, selected) {
            const chosen = new Set(array(selected));
            for (const board of array(boards)) {
                const packId = board.packIds.find(id => chosen.has(id));
                if (!packId) continue;
                return { board, grade: board.grades.find(grade => grade.packId === packId) || null };
            }
            return null;
        }
    });

    const StudyInterviews = Object.freeze({
        /** Interview packs in catalog order: coding first, then system design, cloud, data, product, consulting, finance, HR. */
        of(catalog, minChannels = 0) {
            return array(catalog?.packs).filter(pack => pack.kind === KIND_INTERVIEW && array(pack.channels).length >= minChannels);
        },
        /** "DSA, System design, Finance": the tile's examples, from the packs' short names. */
        examples(catalog, minChannels = 0, count = 3) {
            return [...new Set(StudyInterviews.of(catalog, minChannels).map(pack => text(pack.shortName)).filter(Boolean))].slice(0, count);
        }
    });

    const StudySkills = Object.freeze({
        /** Lessons for anyone: the global class packs, then global skill packs such as coding interviews. */
        of(catalog, minChannels = 0) {
            return [...StudySchool.globals(catalog, minChannels), ...array(catalog?.packs).filter(pack => EXAM_KINDS.includes(pack.kind)
                && isGlobal(pack) && array(pack.channels).length >= minChannels && StudyExamFields.of(pack) === 'skills')];
        }
    });

    // ---- Review groups (Android StudyReviewGroups) -----------------------------------------------

    function row(channelId, handle, name, on, own = false) {
        const id = text(channelId) || null;
        const h = text(handle) || null;
        return {
            channelId: id, handle: h, name: text(name), on, own,
            keys: [id, h].filter(Boolean).map(normalizeKey),
            displayHandle: h ? (h.startsWith('@') ? h : `@${h}`) : null
        };
    }

    function rowMatches(item, ref) {
        const id = text(ref?.channelId) ? normalizeKey(ref.channelId) : null;
        const handle = text(ref?.handle) ? normalizeKey(ref.handle) : null;
        if (id && item.channelId) return normalizeKey(item.channelId) === id;
        return !!handle && !!item.handle && normalizeKey(item.handle) === handle;
    }

    function sameChannel(a, b) {
        if (text(a?.channelId) && text(b?.channelId)) return text(a.channelId) === text(b.channelId);
        const ha = text(a?.handle) ? normalizeKey(a.handle) : null;
        return !!ha && ha === (text(b?.handle) ? normalizeKey(b.handle) : null);
    }

    const StudyReviewGroups = Object.freeze({
        KINDS: Object.freeze(['stream', 'shared', 'own']),
        /**
         * The channel groups for `pack` with `edit`: the chosen stream's own channels ("For ECE"), the
         * channels every stream shares ("Everyone taking GATE"), then the ones added ("Your own"). A pack
         * without streams has only the shared group (and "Your own"). `keepOwn` keeps added channels
         * switched off in this visit on screen, so a mistaken switch can be undone.
         */
        channels(pack, edit, keepOwn = []) {
            const e = editOf(edit);
            const removed = new Set(e.channelsRemoved.map(normalizeKey));
            const variants = array(pack?.variants);
            const streamKeys = variants.length ? new Set(array(variant(pack, e.variant)?.channels).map(normalizeHandle)) : new Set();
            const stream = [];
            const shared = [];
            for (const channel of channelsFor(pack, e.variant)) {
                const item = row(channel.channelId, channel.handle, channel.name, false);
                const on = !item.keys.some(key => removed.has(key));
                const claimed = [channel.handle, channel.channelId].filter(Boolean).map(normalizeHandle).some(key => streamKeys.has(key));
                (claimed ? stream : shared).push({ ...item, on });
            }
            const addedKeys = new Set(e.channelsAdded.map(refKey));
            const label = ref => text(ref.name) || text(ref.handle) || text(ref.channelId);
            const own = [
                ...e.channelsAdded.map(ref => row(ref.channelId, ref.handle, label(ref), true, true)),
                ...array(keepOwn).filter(ref => !addedKeys.has(refKey(ref))).map(ref => row(ref.channelId, ref.handle, label(ref), false, true))
            ];
            const groups = [];
            if (variants.length && stream.length) groups.push({ kind: 'stream', rows: stream });
            if (shared.length) groups.push({ kind: 'shared', rows: shared });
            groups.push({ kind: 'own', rows: own });
            return groups.map(group => ({ ...group, onCount: group.rows.filter(item => item.on).length }));
        },
        /** The topics in the same groups: the stream's own, the shared ones, and the ones added. */
        topics(pack, edit) {
            const e = editOf(edit);
            const removed = new Set(e.topicsRemoved.map(topicKey));
            const variants = array(pack?.variants);
            const chosen = variants.length ? variant(pack, e.variant) : null;
            const streamKeys = chosen ? new Set([...array(chosen.keywords), ...array(chosen.chips)].map(topicKey)) : new Set();
            const all = topicsFor(pack, e.variant);
            const stream = all.filter(topic => streamKeys.has(topicKey(topic)));
            const shared = all.filter(topic => !streamKeys.has(topicKey(topic)));
            const pairs = list => list.map(topic => ({ topic, on: !removed.has(topicKey(topic)) }));
            const groups = [];
            if (stream.length) groups.push({ kind: 'stream', topics: pairs(stream) });
            if (shared.length) groups.push({ kind: 'shared', topics: pairs(shared) });
            if (e.topicsAdded.length) groups.push({ kind: 'own', topics: e.topicsAdded.map(topic => ({ topic, on: true })) });
            return groups.map(group => ({ ...group, onCount: group.topics.filter(item => item.on).length }));
        },
        /** Switches a pack channel on or off (channelsRemoved), the way setup always has. */
        setChannel(edit, item, on) {
            const current = editOf(edit);
            if (item.own) {
                const ref = { channelId: item.channelId, handle: item.handle, name: item.name };
                if (on) return StudyReviewGroups.add(current, ref);
                return { ...current, channelsAdded: current.channelsAdded.filter(added => refKey(added) !== refKey(ref)) };
            }
            const id = item.channelId || item.handle;
            if (!id) return current;
            const keys = new Set(item.keys);
            const without = current.channelsRemoved.filter(value => !keys.has(normalizeKey(value)));
            return { ...current, channelsRemoved: on ? without : [...without, id] };
        },
        /** Switches a pack topic on or off (topicsRemoved). */
        setTopic(edit, topic, on) {
            const current = editOf(edit);
            const key = topicKey(topic);
            const without = current.topicsRemoved.filter(value => topicKey(value) !== key);
            return { ...current, topicsRemoved: on ? without : [...without, topic] };
        },
        /** A topic in "Your own" switched on or off (topicsAdded). */
        setOwnTopic(edit, topic, on) {
            const current = editOf(edit);
            const key = topicKey(topic);
            return { ...current, topicsAdded: on ? distinctBy([...current.topicsAdded, topic], topicKey)
                : current.topicsAdded.filter(value => topicKey(value) !== key) };
        },
        /**
         * Adds a channel to "Your own" (channelsAdded). A channel the pack already teaches is switched back
         * on instead of listed twice; one already added stays where it is.
         */
        add(edit, ref, pack = null) {
            const current = editOf(edit);
            const match = pack ? matchChannel(pack, ref.channelId, ref.handle) : null;
            const inPack = !!match && channelsFor(pack, current.variant).includes(match);
            if (inPack) {
                const keys = new Set([ref.channelId, ref.handle, match.channelId, match.handle].filter(text).map(normalizeKey));
                return { ...current, channelsRemoved: current.channelsRemoved.filter(value => !keys.has(normalizeKey(value))) };
            }
            if (current.channelsAdded.some(added => refKey(added) === refKey(ref) || sameChannel(added, ref))) return current;
            const clean = {};
            if (text(ref.channelId)) clean.channelId = text(ref.channelId);
            if (text(ref.handle)) clean.handle = text(ref.handle);
            if (text(ref.name)) clean.name = text(ref.name);
            return { ...current, channelsAdded: [...current.channelsAdded, clean].slice(0, MAX_EDIT_ROWS) };
        },
        /** Whether a channel is already on in this pack's plan (shown as "Added" in search). */
        isOn(pack, edit, ref) {
            return StudyReviewGroups.channels(pack, edit).some(group => group.rows.some(item => item.on && rowMatches(item, ref)));
        },
        /** The sticky bar's counts over every chosen pack: [channels on, topics on]. */
        counts(packs, edits) {
            let channels = 0;
            let topics = 0;
            for (const pack of array(packs)) {
                const edit = object(edits)[pack.id];
                channels += StudyReviewGroups.channels(pack, edit).reduce((sum, group) => sum + group.onCount, 0);
                topics += StudyReviewGroups.topics(pack, edit).reduce((sum, group) => sum + group.onCount, 0);
            }
            return [channels, topics];
        },
        /** Fold only when it saves real scrolling: "Show 1 more" would cost a tap for one row. */
        folds(count) { return count > ROWS_FOLDED + 2; }
    });

    // ---- "Add a channel" input (Android StudyChannelInput) ---------------------------------------

    const CHANNEL_ID = /(?:^|[/=])(UC[A-Za-z0-9_-]{22})(?:$|[/?#&])/;
    const BARE_ID = /^UC[A-Za-z0-9_-]{22}$/;
    const HANDLE = /^@?([A-Za-z0-9._\-\u00B7\u0080-\uFFFF]{3,100})$/;
    const LINK_HANDLE = /\/@([^/?#\s]+)/;
    const LINK_HOST = /^(https?:\/\/)?([a-z0-9-]+\.)*(youtube\.com|youtu\.be)(\/|$)/i;

    const StudyChannelInput = Object.freeze({
        /** {type: 'empty'|'id'|'handle'|'link'|'name', value}. */
        parse(raw) {
            const value = String(raw ?? '').trim();
            if (!value) return { type: 'empty', value: '' };
            if (BARE_ID.test(value)) return { type: 'id', value };
            const isLink = LINK_HOST.test(value) || value.includes('://');
            if (isLink) {
                const id = CHANNEL_ID.exec(value);
                if (id) return { type: 'id', value: id[1] };
                const handle = LINK_HANDLE.exec(value);
                if (handle) {
                    let decoded = handle[1];
                    try { decoded = decodeURIComponent(handle[1]); } catch (e) { }
                    if (decoded.trim()) return { type: 'handle', value: decoded.trim() };
                }
                return { type: 'link', value };
            }
            if (value.startsWith('@')) {
                const handle = HANDLE.exec(value);
                if (handle) return { type: 'handle', value: handle[1] };
            }
            return { type: 'name', value };
        },
        /** What the resolver is asked for; null for a name or nothing. */
        lookup(input) {
            if (input?.type === 'id') return input.value;
            if (input?.type === 'handle') return `@${input.value}`;
            if (input?.type === 'link') return input.value;
            return null;
        },
        /** A name with no spaces may be someone's handle ("nesoacademy"): search offers to look it up as one. */
        handleGuess(name) {
            const value = String(name ?? '').trim().replace(/^@/, '');
            if (value.length < 3 || /\s/.test(value)) return null;
            const match = HANDLE.exec(value);
            return match ? match[1] : null;
        },
        /** Pack channels whose name or handle contains `query`, each once, best match first. */
        searchCatalog(catalog, query, limit = 8) {
            const words = String(query ?? '').trim().replace(/^@/, '').toLowerCase();
            if (words.length < 2 || !catalog) return [];
            const seen = new Set();
            const hits = [];
            for (const pack of array(catalog.packs)) {
                for (const channel of array(pack.channels)) {
                    const key = channel.channelId || (channel.handle ? normalizeHandle(channel.handle) : '');
                    if (!key) continue;
                    const name = text(channel.name).toLowerCase();
                    const handle = channel.handle ? normalizeHandle(channel.handle) : '';
                    let score;
                    if (name === words || handle === words) score = 0;
                    else if (name.startsWith(words) || (handle && handle.startsWith(words))) score = 1;
                    else if (name.includes(words) || (handle && handle.includes(words))) score = 2;
                    else continue;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    hits.push([score, channel]);
                }
            }
            return hits.sort((a, b) => a[0] - b[0]).slice(0, limit).map(hit => hit[1]);
        }
    });

    /**
     * The edits setup saves (Android StudySetupActivity.save): a pack with branches keeps the branch shown
     * on Review (the default when untouched); packs that weren't chosen lose their edits.
     */
    function savedEdits(selected, edits, catalog) {
        const out = {};
        for (const id of array(selected)) {
            const pack = array(catalog?.packs).find(item => item.id === id) || null;
            let edit = object(edits)[id] ? editOf(object(edits)[id]) : null;
            if (pack && array(pack.variants).length && !text(edit?.variant)) edit = { ...(edit || emptyEdit()), variant: variant(pack, null)?.id };
            if (edit) out[id] = edit;
        }
        return out;
    }

    /** "GATE CSE" for one pack (with its stream), null for several (Android planLabel). */
    function planLabel(packs, edits, language) {
        if (array(packs).length !== 1) return null;
        const pack = packs[0];
        const short = StudyExamList.chipLabel(pack, language);
        const chosen = array(pack.variants).length ? variant(pack, object(object(edits)[pack.id]).variant) : null;
        const name = chosen ? variantName(chosen, language) : '';
        return name && !short.toLowerCase().includes(name.toLowerCase()) ? `${short} ${name}` : short;
    }

    /** Where a saved plan reopens (Android: the chosen pack's kind and country, at the list step). */
    function reopenAt(selected, catalog, deviceCountry) {
        const chosen = array(selected).map(id => array(catalog?.packs).find(pack => pack.id === id)).find(Boolean);
        if (!chosen) return { step: 'kind', mode: MODES.EXAM, country: countryCode(deviceCountry) };
        const mode = modeOf(chosen);
        const device = countryCode(deviceCountry);
        const country = isGlobal(chosen) ? device : (array(chosen.countries).find(code => code === device) || array(chosen.countries)[0] || null);
        return { step: 'list', mode, country };
    }

    /** Every country that has study packs (codes; the page sorts them by their localized names). */
    function countries(catalog) {
        const out = new Set();
        for (const pack of array(catalog?.packs)) {
            if (!['study', 'exam', 'class'].includes(pack.kind)) continue;
            for (const code of array(pack.countries)) out.add(code);
        }
        return [...out];
    }

    return Object.freeze({
        MIN_CHANNELS, ROWS_FOLDED, TOPICS_FOLDED, MAX_TOPICS, MODES, STEPS, KIND_INTERVIEW, modeOf,
        StudySetupPath, StudyExamFields, StudyExamList, StudySchool, StudySkills, StudyInterviews, StudyReviewGroups, StudyChannelInput,
        channelsFor, topicsFor, normalizeKey, refKey, topicKey, isGlobal, packName, variant, variantName,
        savedEdits, planLabel, reopenAt, countries
    });
}));
