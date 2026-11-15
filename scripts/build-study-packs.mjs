#!/usr/bin/env node
// Builds the bundled Study pack catalog (data/study/packs-v1.json) from the curation draft:
//   node scripts/build-study-packs.mjs <study-packs-draft-v2.json>           writes data/study/packs-v1.json
//   node scripts/build-study-packs.mjs <study-packs-draft-v2.json> --check   fails when the committed catalog is out of date
//
// Sources, in this order: draft.packs (exam packs), draft.classPacks (kind "class": grade, board,
// subjects, gradeKeywords) and draft.kidsPacks. Each pack is written as
//   id, kind, name, [shortName], [grade], [board], [countries], [nearby], [taughtIn], [languages],
//   [subjects], [keywords], [gradeKeywords], [blockedWords], [chips], [variantLabel], [variants], channels
// shortName is the exam's short label ("GATE"); chips are the study Home's subject chips; variants
// are branches or streams (GATE CSE, ECE, ...), each {id, name, [default], [chips], [keywords],
// [channels]}, where channels lists handles or ids of the pack's own approved channels that teach it.
// taughtIn labels countries where a curriculum is taught abroad ({"AE": "Indian curriculum"}) and
// variantLabel is the heading over the variant chips ({"en": "Stream"}); both are {lang|country: text}.
// where a bracketed field is written only when it has a value. The catalog format stays version 1:
// the new fields are additive and older loaders skip them.
// The same generator as FilterTubeApp tools/generate-study-packs.mjs, so the extension and the apps
// bundle byte-identical catalogs. Curation-only fields (why, confidence, sources, url, subscribers,
// coverage, notes) are left out, channels the curators marked low or unverified are dropped, and a
// pack with fewer than MIN_CHANNELS approved channels is hidden. Output is deterministic.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUTPUT = path.join(root, 'data/study/packs-v1.json');

const APPROVED = new Set(['high', 'medium']);
export const MIN_CHANNELS = 3;

const text = value => typeof value === 'string' ? value.trim() : '';
const strings = value => Array.isArray(value) ? [...new Set(value.map(text).filter(Boolean))] : [];
const countries = value => strings(value).map(code => code.toUpperCase()).filter(code => /^[A-Z]{2}$/.test(code));

/** {"6": ["class 6 maths"], ...}: keys trimmed, each list cleaned like keywords, empty lists dropped. */
function gradeKeywords(value) {
    const out = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
    for (const [grade, words] of Object.entries(value)) {
        const key = text(grade);
        const list = strings(words);
        if (key && list.length) out[key] = list;
    }
    return out;
}

function channel(row) {
    const out = {};
    const channelId = text(row.channelId);
    if (/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) out.channelId = channelId;
    const handle = text(row.handle);
    if (handle) out.handle = handle.startsWith('@') ? handle : `@${handle}`;
    out.name = text(row.name);
    const language = text(row.language).toLowerCase();
    if (language) out.language = language;
    return out.name && (out.channelId || out.handle) ? out : null;
}

/** {"AE": "Indian curriculum"} or {"en": "Stream"}: keys and labels trimmed, empty ones dropped. */
function labels(value, key = k => k) {
    const out = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
    for (const [raw, label] of Object.entries(value)) {
        const k = key(text(raw));
        if (k && text(label)) out[k] = text(label);
    }
    return out;
}

/** Branches or streams: ids unique and pack-id shaped; channels kept only when the pack lists them. */
function variants(value, packChannels) {
    if (!Array.isArray(value)) return [];
    const known = new Set(packChannels.flatMap(row => [row.channelId, row.handle && row.handle.toLowerCase()]).filter(Boolean));
    const out = [];
    const ids = new Set();
    for (const row of value) {
        const id = text(row && row.id).toLowerCase();
        if (!/^[a-z0-9_.-]{1,64}$/.test(id) || ids.has(id)) continue;
        ids.add(id);
        const name = {};
        Object.entries((row && row.name) || {}).forEach(([lang, label]) => { if (text(label)) name[lang] = text(label); });
        const variant = { id, name };
        if (row.default === true) variant.default = true;
        for (const [key, list] of [['chips', strings(row.chips)], ['keywords', strings(row.keywords)],
            ['channels', strings(row.channels).filter(ref => known.has(ref) || known.has(ref.toLowerCase()))]]) {
            if (list.length) variant[key] = list;
        }
        out.push(variant);
    }
    return out;
}

function channelKey(row) {
    return row.channelId ? `id:${row.channelId}` : `h:${row.handle.slice(1).toLowerCase()}`;
}

export function buildCatalog(draft) {
    const packs = [];
    const hidden = [];
    for (const source of [...(draft.packs || []), ...(draft.classPacks || []), ...(draft.kidsPacks || [])]) {
        const seen = new Set();
        const channels = [];
        for (const row of source.channels || []) {
            if (!APPROVED.has(text(row.confidence).toLowerCase())) continue;
            const next = channel(row);
            if (!next) continue;
            // The same channel twice (by id, or by handle) is listed once.
            const keys = [channelKey(next), next.handle ? `h:${next.handle.slice(1).toLowerCase()}` : ''].filter(Boolean);
            if (keys.some(key => seen.has(key))) continue;
            keys.forEach(key => seen.add(key));
            channels.push(next);
        }
        const id = text(source.id);
        if (!id) continue;
        if (channels.length < MIN_CHANNELS) { hidden.push(id); continue; }
        const name = {};
        Object.entries(source.name || {}).forEach(([lang, value]) => { if (text(value)) name[lang] = text(value); });
        const pack = { id, kind: text(source.kind) || 'study', name };
        if (text(source.shortName)) pack.shortName = text(source.shortName);
        for (const key of ['grade', 'board']) if (text(source[key])) pack[key] = text(source[key]);
        for (const [key, value] of [['countries', countries(source.countries)], ['nearby', countries(source.nearby)]]) {
            if (value.length) pack[key] = value;
        }
        const taughtIn = labels(source.taughtIn, code => /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : '');
        if (Object.keys(taughtIn).length) pack.taughtIn = taughtIn;
        for (const [key, value] of [['languages', strings(source.languages)], ['subjects', strings(source.subjects)],
            ['keywords', strings(source.keywords)]]) {
            if (value.length) pack[key] = value;
        }
        const grades = gradeKeywords(source.gradeKeywords);
        if (Object.keys(grades).length) pack.gradeKeywords = grades;
        // Words hidden while this pack is studied ("reaction", "vlog", "result live").
        const blockedWords = strings(source.blockedWords);
        if (blockedWords.length) pack.blockedWords = blockedWords;
        const chips = strings(source.chips);
        if (chips.length) pack.chips = chips;
        const branches = variants(source.variants, channels);
        const variantLabel = labels(source.variantLabel, lang => lang.toLowerCase());
        if (branches.length && Object.keys(variantLabel).length) pack.variantLabel = variantLabel;
        if (branches.length) pack.variants = branches;
        pack.channels = channels;
        packs.push(pack);
    }
    return { catalog: { schema: 'filtertube_study_packs', version: 1, draftGenerated: text(draft.generated), packs }, hidden };
}

export function renderCatalog(draft) {
    return `${JSON.stringify(buildCatalog(draft).catalog, null, 1)}\n`;
}

function main() {
    const args = process.argv.slice(2);
    const draftPath = args.find(arg => !arg.startsWith('--'));
    if (!draftPath) {
        console.error('usage: node scripts/build-study-packs.mjs <study-packs-draft-v2.json> [--check]');
        process.exit(2);
    }
    const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
    const { catalog, hidden } = buildCatalog(draft);
    const output = renderCatalog(draft);
    if (args.includes('--check')) {
        const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
        if (current !== output) {
            console.error(`${path.relative(root, OUTPUT)} is out of date; run node scripts/build-study-packs.mjs <draft>`);
            process.exit(1);
        }
        return;
    }
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, output);
    const channels = catalog.packs.reduce((sum, pack) => sum + pack.channels.length, 0);
    console.log(`Wrote ${catalog.packs.length} packs (${channels} channels) to ${path.relative(root, OUTPUT)}`);
    if (hidden.length) console.log(`Hidden (fewer than ${MIN_CHANNELS} approved channels): ${hidden.join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
