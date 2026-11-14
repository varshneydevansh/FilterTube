#!/usr/bin/env node
// Builds the bundled Study pack catalog (data/study/packs-v1.json) from the curation draft:
//   node scripts/build-study-packs.mjs <study-packs-draft.json>           writes data/study/packs-v1.json
//   node scripts/build-study-packs.mjs <study-packs-draft.json> --check   fails when the committed catalog is out of date
//
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

function channelKey(row) {
    return row.channelId ? `id:${row.channelId}` : `h:${row.handle.slice(1).toLowerCase()}`;
}

export function buildCatalog(draft) {
    const packs = [];
    const hidden = [];
    for (const source of [...(draft.packs || []), ...(draft.kidsPacks || [])]) {
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
        for (const [key, value] of [['countries', countries(source.countries)], ['nearby', countries(source.nearby)],
            ['languages', strings(source.languages)], ['subjects', strings(source.subjects)], ['keywords', strings(source.keywords)]]) {
            if (value.length) pack[key] = value;
        }
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
        console.error('usage: node scripts/build-study-packs.mjs <study-packs-draft.json> [--check]');
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
