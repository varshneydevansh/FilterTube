#!/usr/bin/env node
// Android -> extension port ledger. See docs/parity/HOW_TO_PORT.md.
// Adapted from the app repository's iOS ledger (FilterTubeApp tools/parity/ledger.mjs). Android lives
// in the app repository, so its git commands run there (FT_ANDROID_REPO or --android-repo).
//
//   node tools/parity/ledger.mjs check  [--android-ref <ref>] [--android-repo <path>] [--top N]
//       Android commits after the sync point with no ledger row (exit 1 if any, or if a row is
//       malformed), then todo/partial rows by area, counts, % ported and shared-code drift.
//   node tools/parity/ledger.mjs add <sha> [<sha>...]
//       Append a row prefilled from git (date, subject, guessed area and status, Android files).
//   node tools/parity/ledger.mjs render
//       Regenerate docs/parity/PORT_LEDGER.md from the TSV.
//   node tools/parity/ledger.mjs files <android_sha>
//       The extension files to touch for that Android commit, from FILE_MAP.tsv and the row itself.
//   node tools/parity/ledger.mjs shared [--android-ref <ref>]
//       Only the shared-code comparison: every file the Android app bundles from this repository.
import fs from 'node:fs';
import {
    ANDROID_ONLY_SHARED, AREAS, FILE_MAP_TSV, LEDGER_COLUMNS, LEDGER_MD, LEDGER_TSV, RUNTIME_BUNDLE, SHARED_DIFFERENCES,
    SHARED_FILES, STATUSES, SYNC_POINT, androidGit, androidRef, androidRepo, bundleSections, commitFiles, compactFiles,
    compareShared, findMissing, formatTsv, git, guessArea, guessExtensionStatus, openByArea, readFileMap, readLedger,
    sameSha, splitList, summarize, trackedCommits, validateRows, visibilityOrder,
} from './lib.mjs';

const pct = (n) => `${n.toFixed(1)}%`;

function argValue(name, fallback) {
    const i = process.argv.indexOf(name);
    return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const showAndroid = (ref, p) => { try { return androidGit(['show', `${ref}:${p}`]); } catch { return null; } };
const showExtension = (p) => { try { return git(['show', `HEAD:${p}`]); } catch { return null; } };

// The newest extension commit whose copy of `ext` equals Android's text: the extension has moved on
// since then (Android needs a runtime sync). Null when no version matches (Android changed its copy).
function extensionVersionMatching(ext, androidText, section) {
    let shas = [];
    try { shas = git(['log', '--format=%h', '-n', '400', 'HEAD', '--', ext]).trim().split('\n').filter(Boolean); } catch { return null; }
    for (const sha of shas) {
        let text;
        try { text = git(['show', `${sha}:${ext}`]); } catch { continue; }
        if (compareShared(androidText, text, { section }) === 'identical') return sha;
    }
    return null;
}

export function sharedDrift(ref, { history = true } = {}) {
    const out = [];
    const push = (android, ext, androidText, section) => {
        const state = compareShared(androidText, showExtension(ext), { section });
        const row = { android, ext, state };
        if (state === 'differs' && history && !SHARED_DIFFERENCES[ext]) {
            const at = extensionVersionMatching(ext, androidText, section);
            row.note = at ? `Android has the extension's ${at}; extension is ahead (needs a runtime sync)` : 'no extension version matches (Android changed its copy)';
        }
        out.push(row);
    };
    for (const [android, ext] of SHARED_FILES) push(android, ext, showAndroid(ref, android), false);
    const bundle = showAndroid(ref, RUNTIME_BUNDLE);
    if (bundle) {
        for (const { source, code } of bundleSections(bundle)) push(`${RUNTIME_BUNDLE} § ${source}`, source, code, true);
    } else out.push({ android: RUNTIME_BUNDLE, ext: '(runtime sections)', state: 'missing on Android' });
    return out;
}

function printShared(ref) {
    const drift = sharedDrift(ref);
    const documented = (d) => d.state === 'differs' && SHARED_DIFFERENCES[d.ext];
    const same = drift.filter((d) => d.state === 'identical');
    const undocumented = drift.filter((d) => d.state !== 'identical' && !documented(d));
    console.log(`\nShared code (Android's copies of extension files; informational): ${drift.length} compared, ${same.length} identical, `
        + `${drift.filter(documented).length} documented differences, ${undocumented.length} differ.`);
    for (const d of drift) {
        if (d.state === 'identical') continue;
        const reason = documented(d);
        console.log(`  ${(reason ? 'documented' : d.state).padEnd(20)} ${d.ext}  <-  ${d.android.replace('apps/android/app/src/main/assets/', 'assets/')}${reason ? `  [${reason}]` : ''}${d.note ? `  (${d.note})` : ''}`);
    }
    console.log(`  android-only        assets/filtertube_nanah/{${ANDROID_ONLY_SHARED.join(',')}} (native bridges, no extension source)`);
}

function check() {
    const rows = readLedger();
    const problems = validateRows(rows);
    const repo = androidRepo();
    const ref = androidRef();
    let commits = null;
    if (repo) {
        try { commits = trackedCommits(ref); } catch (e) { console.log(`Cannot read ${ref} in ${repo}: ${e.message.split('\n')[0]}`); }
    } else console.log('Android repository not found (set FT_ANDROID_REPO); checking the ledger file only.');
    const missing = commits ? findMissing(commits, rows) : [];
    const s = summarize(rows);

    if (commits) console.log(`Port ledger check: ${SYNC_POINT}..${ref} (${androidGit(['rev-parse', '--short=9', ref]).trim()} in ${repo}), ${commits.length} tracked Android commits, ${rows.length} ledger rows.`);
    else console.log(`Port ledger check: ${rows.length} ledger rows.`);
    if (problems.length) {
        console.log(`\nMalformed rows (${problems.length}):`);
        for (const p of problems) console.log(`  ${p}`);
    }
    if (missing.length) {
        console.log(`\nAndroid commits with no ledger row (${missing.length}). Add them with: node tools/parity/ledger.mjs add <sha>`);
        for (const c of missing) console.log(`  ${c.sha} ${c.date} ${c.subject}`);
    } else if (commits) {
        console.log('\nEvery tracked Android commit has a ledger row.');
    }

    console.log(`\nStatus: ${STATUSES.map((st) => `${st} ${s.byStatus[st]}`).join(', ')}.`);
    console.log(`Ported: ${pct(s.percentPorted)} of ${s.applicable} applicable rows (${pct(s.percentWeighted)} counting partial as half).`);
    console.log('\nBy area                ported partial todo  n/a   share');
    for (const area of [...AREAS, 'unassigned']) {
        const n = s.byArea[area];
        if (!n) continue;
        console.log(`  ${area.padEnd(20)} ${String(n.ported).padStart(6)} ${String(n.partial).padStart(7)} ${String(n.todo).padStart(4)} ${String(n['n/a']).padStart(4)}  ${n.ported + n.partial + n.todo ? pct(s.areaShare[area]).padStart(6) : '     -'}`);
    }

    const open = openByArea(rows);
    console.log('\nOpen rows (todo / partial) by area:');
    for (const [area, list] of Object.entries(open)) {
        const t = list.filter((r) => r.status === 'todo').length;
        console.log(`\n  ${area}: ${t} todo, ${list.length - t} partial`);
        for (const r of visibilityOrder(list)) {
            console.log(`    ${r.status.padEnd(7)} ${r.android_sha} ${r.subject}${r.reason ? `  [${r.reason}]` : ''}`);
        }
    }

    const top = Number(argValue('--top', 20));
    const todos = visibilityOrder(rows.filter((r) => r.status === 'todo')).slice(0, top);
    console.log(`\nTop ${todos.length} todo by user visibility:`);
    todos.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. [${r.area}] ${r.android_sha} ${r.subject}`));

    if (repo) printShared(ref);
    if (missing.length || problems.length) process.exitCode = 1;
}

function add(shas) {
    if (!shas.length) throw new Error('usage: ledger.mjs add <sha> [<sha>...]');
    const rows = readLedger();
    for (const raw of shas) {
        const sha = androidGit(['rev-parse', '--short=9', `${raw}^{commit}`]).trim();
        if (rows.some((r) => sameSha(r.android_sha, sha))) { console.log(`${sha} already has a row`); continue; }
        const [date, subject] = androidGit(['log', '-1', '--format=%ad%x09%s', '--date=short', sha]).trim().split('\t');
        const files = commitFiles(sha);
        const guess = guessExtensionStatus(subject, files);
        rows.push({
            android_sha: sha, date, subject, area: guessArea(subject, files), status: guess.status, ext_shas: '', reason: guess.reason,
            android_files: compactFiles(files).join(';'), ext_files: '',
        });
        console.log(`added ${sha} [${rows.at(-1).area}] ${guess.status}: ${subject}`);
    }
    fs.writeFileSync(LEDGER_TSV, formatTsv(rows, LEDGER_COLUMNS));
}

const mdCell = (v) => String(v ?? '').replace(/\|/g, '\\|');

export function renderMarkdown(rows) {
    const s = summarize(rows);
    const lines = [
        '# Android → extension port ledger',
        '',
        'Generated from `PORT_LEDGER.tsv` by `node tools/parity/ledger.mjs render`. Edit the TSV, never this file.',
        `Rules: [HOW_TO_PORT.md](HOW_TO_PORT.md). Sync point: Android \`${SYNC_POINT}\` (Release Android 3.6.1), in the app repository.`,
        '',
        `**${rows.length} rows:** ${STATUSES.map((st) => `${s.byStatus[st]} ${st}`).join(', ')}. `
            + `**${pct(s.percentPorted)}** of ${s.applicable} applicable rows ported (${pct(s.percentWeighted)} counting partial as half).`,
        '',
        '| Area | ported | partial | todo | n/a | share |',
        '|---|---|---|---|---|---|',
    ];
    for (const area of [...AREAS, 'unassigned']) {
        const n = s.byArea[area];
        if (!n) continue;
        lines.push(`| ${area} | ${n.ported} | ${n.partial} | ${n.todo} | ${n['n/a']} | ${n.ported + n.partial + n.todo ? pct(s.areaShare[area]) : '-'} |`);
    }
    for (const area of [...AREAS, 'unassigned']) {
        const list = rows.filter((r) => (r.area || 'unassigned') === area);
        if (!list.length) continue;
        lines.push('', `## ${area}`, '', '| Android | Date | Subject | Status | Extension | Reason / note |', '|---|---|---|---|---|---|');
        const order = ['todo', 'partial', 'ported', 'n/a'];
        for (const r of [...list].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.date.localeCompare(b.date))) {
            lines.push(`| \`${r.android_sha}\` | ${r.date} | ${mdCell(r.subject)} | ${r.status} | ${splitList(r.ext_shas).map((x) => `\`${x}\``).join(', ')} | ${mdCell(r.reason)} |`);
        }
    }
    lines.push('', 'Android and extension files per row are in the TSV (`android_files`, `ext_files`); `ledger.mjs files <sha>` adds the FILE_MAP counterparts.', '');
    return lines.join('\n');
}

function render() {
    fs.writeFileSync(LEDGER_MD, renderMarkdown(readLedger()));
    console.log(`wrote ${LEDGER_MD}`);
}

export function filesFor(row, fileMap, exists = () => false) {
    const byAndroid = new Map(fileMap.map((m) => [m.android_file, m]));
    const plan = [];
    for (const f of splitList(row.android_files)) {
        const file = f.replace(/ \(\d+\)$/, '');
        const test = file.match(/\/src\/(?:test|androidTest)\/.*\/([A-Za-z0-9]+?)Tests?\.kt$/);
        if (test) {
            // Android tests become extension tests (HOW_TO_PORT.md rule 4).
            const kebab = test[1].replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            const ext = `tests/runtime/app-parity-${kebab}.test.mjs`;
            plan.push({ android: f, ext, match: exists(ext) ? 'test' : 'test (new file)' });
            continue;
        }
        const glob = file.match(/^(.*\/)\*(\.[a-z0-9]+)$/);
        if (glob) {
            const hits = fileMap.filter((m) => m.android_file.startsWith(glob[1]) && m.android_file.endsWith(glob[2]) && !m.android_file.slice(glob[1].length).includes('/'));
            const gaps = hits.filter((m) => m.ext_files.startsWith('none')).length;
            plan.push({ android: f, ext: `(${hits.length} FILE_MAP rows under ${glob[1]}, ${gaps} without an extension counterpart)`, match: 'folder' });
            continue;
        }
        if (/\/Debug[^/]*\.kt$|\/src\/(?:debug|tvDebug)\//.test(file)) { plan.push({ android: f, ext: '(debug-only; skip)', match: '' }); continue; }
        // A translated copy maps through its base resource (values-*/x.xml -> values/x.xml).
        const base = file.replace(/\/(values|drawable|mipmap|layout)-\*\//, '/$1/');
        const m = byAndroid.get(file) ?? byAndroid.get(base);
        plan.push({ android: f, ext: m ? m.ext_files : '(not in FILE_MAP)', match: m?.match ?? '' });
    }
    return plan;
}

function files(raw) {
    if (!raw) throw new Error('usage: ledger.mjs files <android_sha>');
    const rows = readLedger();
    const row = rows.find((r) => sameSha(r.android_sha, raw));
    if (!row) throw new Error(`${raw} has no ledger row; run: node tools/parity/ledger.mjs add ${raw}`);
    console.log(`${row.android_sha} [${row.area}] ${row.status}: ${row.subject}`);
    if (row.reason) console.log(`  note: ${row.reason}`);
    const plan = filesFor(row, readFileMap(FILE_MAP_TSV), (p) => fs.existsSync(new URL(`../../${p}`, import.meta.url)));
    console.log('\nAndroid file -> extension counterpart (FILE_MAP):');
    for (const p of plan) console.log(`  ${p.android}\n      -> ${p.ext}${p.match ? `  (${p.match})` : ''}`);
    const touched = splitList(row.ext_files);
    if (touched.length) {
        console.log(`\nAlready touched by ${row.ext_shas}:`);
        for (const f of touched) console.log(`  ${f}`);
    }
    const extSet = new Set(plan.flatMap((p) => splitList(p.ext)).filter((f) => /^(js|css|html|data|assets|tests|scripts|_locales)\//.test(f)));
    console.log(`\nExtension files to touch (${extSet.size}):`);
    for (const f of [...extSet].sort()) console.log(`  ${f}`);
    const gaps = plan.filter((p) => p.ext.startsWith('none'));
    if (gaps.length) {
        console.log(`\nNo extension counterpart yet (port into a new or nearest file, then add a FILE_MAP row with match "manual"):`);
        for (const g of gaps) console.log(`  ${g.android}`);
    }
}

const [cmd, ...rest] = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        if (cmd === 'check') check();
        else if (cmd === 'add') add(rest.filter((a, i) => !a.startsWith('--') && !String(rest[i - 1] ?? '').startsWith('--android')));
        else if (cmd === 'render') render();
        else if (cmd === 'files') files(rest[0]);
        else if (cmd === 'shared') printShared(androidRef());
        else { console.log('usage: ledger.mjs check | add <sha>... | render | files <android_sha> | shared'); process.exitCode = 2; }
    } catch (e) {
        console.error(e.message);
        process.exitCode = 2;
    }
}
