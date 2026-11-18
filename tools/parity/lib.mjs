// Shared helpers for the Android -> extension port ledger (tools/parity/ledger.mjs).
// No dependencies: Node's standard library and the git CLI only.
// Adapted from the app repository's iOS ledger (FilterTubeApp tools/parity/lib.mjs).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const LEDGER_TSV = path.join(ROOT, 'docs/parity/PORT_LEDGER.tsv');
export const LEDGER_MD = path.join(ROOT, 'docs/parity/PORT_LEDGER.md');
export const FILE_MAP_TSV = path.join(ROOT, 'docs/parity/FILE_MAP.tsv');

// Android 3.6.1 (30604): the same sync point the app's iOS ledger uses. Every Android commit after
// it that touches apps/android/ needs a row here.
export const SYNC_POINT = 'ec9d91080';
// The Android source of truth, in the app repository. Override with FT_ANDROID_REF or --android-ref.
export const DEFAULT_ANDROID_REF = 'feature/android-3.6.2-study';
// Where the app repository lives. Override with FT_ANDROID_REPO or --android-repo.
export const DEFAULT_ANDROID_REPOS = [
    path.join(os.homedir(), 'FilterTubeWorktrees/study-3.6.2'),
    path.resolve(ROOT, '../FilterTubeApp'),
    path.join(os.homedir(), 'FilterTubeApp'),
];

export const TRACKED_PATHS = ['apps/android/'];

const ASSETS = 'apps/android/app/src/main/assets/';
// Files the Android app bundles from this repository (the app's tools/sync-runtime-from-extension.mjs
// and tools/runtime-sync-manifest.json). Each must match the extension file it was copied from.
export const SHARED_FILES = [
    [`${ASSETS}extension_shell/data/release_notes.json`, 'data/release_notes.json'],
    [`${ASSETS}study/packs-v1.json`, 'data/study/packs-v1.json'],
    [`${ASSETS}filtertube_nanah/vendor/nanah.bundle.js`, 'js/vendor/nanah.bundle.js'],
    [`${ASSETS}filtertube_nanah/vendor/qrcode.bundle.js`, 'js/vendor/qrcode.bundle.js'],
    [`${ASSETS}filtertube_nanah/shared/saved_video_notes.js`, 'js/shared/saved_video_notes.js'],
    [`${ASSETS}filtertube_nanah/shared/local_playlists.js`, 'js/shared/local_playlists.js'],
    [`${ASSETS}filtertube_nanah/shared/study_model.js`, 'js/shared/study_model.js'],
    ...['personal_sync', 'auto_sync_queue', 'managed_auto_sync', 'personal_auto_sync_runtime', 'device_auto_sync',
        'nanah_managed_live_policy', 'nanah_managed_open_sync', 'nanah_managed_mailbox_client',
        'nanah_managed_local_network_client', 'nanah_sync_adapter']
        .map((name) => [`${ASSETS}filtertube_nanah/${name}.js`, `js/${name}.js`]),
];
// The Android runtime bundle: one section per extension file, each headed "// js/<file>.js".
export const RUNTIME_BUNDLE = `${ASSETS}filtertube_runtime_full.js`;
export const BUNDLE_START = '// FILTERTUBE_APP_RUNTIME_BUNDLE_START';

// Copies the app's sync changes on purpose. Each names the adapter in the app repository that
// changes it; every other shared file should be identical (HOW_TO_PORT.md rule 5).
export const SHARED_DIFFERENCES = {
    'js/nanah_sync_adapter.js': 'Android apply binding (app tools/native-nanah-apply-binding.mjs adaptNativeNanahApplyBinding)',
    'js/content/admission_overlay.js': 'bundled locale catalogs and an inline logo (app tools/sync-runtime-from-extension.mjs adaptAdmissionOverlay)',
    'js/content/external_youtube_network.js': 'embed-only wrapper and the startup hold (app tools/sync-runtime-from-extension.mjs)',
    'js/content/external_youtube_guard.js': 'embed-only wrapper and one synchronous control transport (app tools/sync-runtime-from-extension.mjs)',
};
// Sections the app's whole-bundle adapters rewrite (adaptAndroidRuntimeBundle and its performance,
// continuation, menu and quick-block passes, adaptAndroidSubscriptionRuntime, adaptAndroidRuntimeRuleWrites:
// the Kids surface check, watch-channel mapping, rule writes through the app). A byte comparison can't
// tell an adapted copy from a stale one here; rerun the app's sync (npm run sync:native-runtime) and
// read the app's diff instead.
const BUNDLE_ADAPTED = 'rewritten by the app\'s Android bundle adapters (app tools/sync-runtime-from-extension.mjs adaptAndroidRuntimeBundle, '
    + 'android-subscriptions-runtime-adapter.mjs, android-runtime-rule-write-adapter.mjs); compare by rerunning the sync';
for (const file of ['js/seed.js', 'js/content/dom_extractors.js', 'js/content/dom_fallback.js', 'js/content/block_channel.js',
    'js/content/bridge_settings.js', 'js/content_bridge.js', 'js/injector.js']) {
    SHARED_DIFFERENCES[file] = BUNDLE_ADAPTED;
}
// Android-only Nanah files: native bridges with no extension source.
export const ANDROID_ONLY_SHARED = ['native_auto_sync.js', 'native_ed25519_crypto.js', 'native_trusted_link_mutation.js', 'nanah_local_transport.js'];

export const LEDGER_COLUMNS = [
    'android_sha', 'date', 'subject', 'area', 'status', 'ext_shas', 'reason', 'android_files', 'ext_files',
];
export const FILE_MAP_COLUMNS = ['android_file', 'kind', 'ext_files', 'match', 'note'];
export const STATUSES = ['ported', 'partial', 'todo', 'n/a'];
// Order used in reports; also the default user-visibility rank (lower = seen sooner). The same
// areas as the app's iOS ledger, so both ledgers read alike.
export const AREAS = [
    'brand-visual', 'home-viewer', 'watch', 'study', 'kids', 'profiles-family', 'settings-controls',
    'search', 'music', 'channel-playlist', 'subs-you', 'nearby-sync', 'support', 'strings',
    'tablet-tv', 'infra', 'release', 'docs-test',
];

let androidRepoCache;
export function androidRepo(argv = process.argv) {
    const i = argv.indexOf('--android-repo');
    const explicit = (i >= 0 && argv[i + 1]) || process.env.FT_ANDROID_REPO;
    if (explicit) return path.resolve(explicit);
    if (androidRepoCache !== undefined) return androidRepoCache;
    androidRepoCache = DEFAULT_ANDROID_REPOS.find((p) => fs.existsSync(path.join(p, 'apps/android'))) ?? null;
    return androidRepoCache;
}

export function git(args, opts = {}) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
}

export function androidGit(args, opts = {}) {
    const repo = androidRepo();
    if (!repo) throw new Error('Android repository not found; set FT_ANDROID_REPO or pass --android-repo <path>');
    return execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

// ---- TSV -------------------------------------------------------------------------------------

export function cleanCell(value) {
    return String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

export function parseTsv(text, columns) {
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0 && !l.startsWith('#'));
    if (lines.length === 0) return [];
    const header = lines[0].split('\t');
    if (columns) {
        const missing = columns.filter((c) => !header.includes(c));
        if (missing.length) throw new Error(`TSV header lacks column(s): ${missing.join(', ')}`);
    }
    return lines.slice(1).map((line, i) => {
        const cells = line.split('\t');
        if (cells.length > header.length) throw new Error(`TSV line ${i + 2} has ${cells.length} cells, header has ${header.length}`);
        const row = {};
        header.forEach((h, j) => { row[h] = cells[j] ?? ''; });
        return row;
    });
}

export function formatTsv(rows, columns) {
    return [columns.join('\t'), ...rows.map((r) => columns.map((c) => cleanCell(r[c])).join('\t'))].join('\n') + '\n';
}

export function readLedger(file = LEDGER_TSV) {
    return fs.existsSync(file) ? parseTsv(fs.readFileSync(file, 'utf8'), LEDGER_COLUMNS) : [];
}

export function readFileMap(file = FILE_MAP_TSV) {
    return fs.existsSync(file) ? parseTsv(fs.readFileSync(file, 'utf8'), FILE_MAP_COLUMNS) : [];
}

export const splitList = (cell) => String(cell ?? '').split(/[;,]\s*/).map((s) => s.trim()).filter(Boolean);

// ---- Validation and check logic (pure, tested) -------------------------------------------------

export function validateRows(rows) {
    const problems = [];
    const seen = new Map();
    rows.forEach((r, i) => {
        const where = `row ${i + 2} (${r.android_sha || '?'})`;
        if (!/^[0-9a-f]{7,40}$/.test(r.android_sha)) problems.push(`${where}: android_sha is not a SHA`);
        if (seen.has(r.android_sha)) problems.push(`${where}: duplicate of row ${seen.get(r.android_sha)}`);
        seen.set(r.android_sha, i + 2);
        if (!STATUSES.includes(r.status)) problems.push(`${where}: status "${r.status}" is not one of ${STATUSES.join(', ')}`);
        if ((r.status === 'partial' || r.status === 'n/a') && !r.reason) problems.push(`${where}: ${r.status} needs a reason`);
        if (r.status === 'ported' && !r.ext_shas) problems.push(`${where}: ported needs an ext_sha`);
        if (r.ext_shas && splitList(r.ext_shas).some((s) => !/^[0-9a-f]{7,40}$/.test(s))) problems.push(`${where}: ext_shas holds a value that is not a SHA`);
        if (r.area && !AREAS.includes(r.area)) problems.push(`${where}: unknown area "${r.area}"`);
    });
    return problems;
}

// True when a ledger SHA and a git SHA name the same commit (either may be abbreviated).
export const sameSha = (a, b) => Boolean(a && b) && (a.startsWith(b) || b.startsWith(a));

export function findMissing(commits, rows) {
    const known = rows.map((r) => r.android_sha);
    return commits.filter((c) => !known.some((k) => sameSha(k, c.sha)));
}

export function summarize(rows) {
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    const byArea = {};
    for (const r of rows) {
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        const a = (byArea[r.area || 'unassigned'] ??= Object.fromEntries(STATUSES.map((s) => [s, 0])));
        a[r.status] = (a[r.status] ?? 0) + 1;
    }
    const applicable = byStatus.ported + byStatus.partial + byStatus.todo;
    // Partial counts half, as in the app's ledger.
    const share = (n) => (n.ported + n.partial + n.todo === 0 ? 100 : (100 * (n.ported + 0.5 * n.partial)) / (n.ported + n.partial + n.todo));
    return {
        total: rows.length,
        byStatus,
        byArea,
        applicable,
        percentPorted: applicable === 0 ? 100 : (100 * byStatus.ported) / applicable,
        percentWeighted: share(byStatus),
        areaShare: Object.fromEntries(Object.entries(byArea).map(([a, n]) => [a, share(n)])),
    };
}

export function openByArea(rows) {
    const out = {};
    for (const r of rows) {
        if (r.status !== 'todo' && r.status !== 'partial') continue;
        (out[r.area || 'unassigned'] ??= []).push(r);
    }
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => areaRank(a) - areaRank(b)));
}

export const areaRank = (area) => (AREAS.includes(area) ? AREAS.indexOf(area) : AREAS.length);

// User visibility: brand first; inside an area todo before partial, feat before fix, newest first.
export function visibilityOrder(rows) {
    const kind = (s) => (/^feat/.test(s) ? 0 : /^fix/.test(s) ? 1 : 2);
    return [...rows].sort((a, b) => areaRank(a.area) - areaRank(b.area)
        || (a.status === 'todo' ? 0 : 1) - (b.status === 'todo' ? 0 : 1)
        || kind(a.subject) - kind(b.subject)
        || String(b.date).localeCompare(String(a.date)));
}

// Collapse translated resource folders: res/values-de/x.xml + 36 more -> res/values-*/x.xml (37).
export function compactFiles(files) {
    const groups = new Map();
    const out = [];
    for (const f of files) {
        const m = f.match(/^(.*\/res\/)(values|drawable|mipmap|layout)-[^/]+(\/.+)$/);
        if (m && !/-(night|nodpi|anydpi-v26|xxxhdpi|television)\//.test(f)) {
            const key = `${m[1]}${m[2]}-*${m[3]}`;
            groups.set(key, (groups.get(key) ?? 0) + 1);
        } else out.push(f);
    }
    for (const [k, n] of groups) out.push(`${k} (${n})`);
    // Many files of one kind in one folder (icon sets, mascot frames) -> folder/*.ext (N).
    const byDir = new Map();
    for (const f of out) {
        const m = f.match(/^(.*\/)[^/*]+(\.[a-z0-9]+)$/);
        if (m) byDir.set(m[1] + m[2], [...(byDir.get(m[1] + m[2]) ?? []), f]);
    }
    const folded = new Set();
    const result = [];
    for (const f of out) {
        const m = f.match(/^(.*\/)[^/*]+(\.[a-z0-9]+)$/);
        const list = m && byDir.get(m[1] + m[2]);
        if (list && list.length > 12 && !/\.kt$/.test(f)) {
            if (!folded.has(m[1] + m[2])) { folded.add(m[1] + m[2]); result.push(`${m[1]}*${m[2]} (${list.length})`); }
        } else result.push(f);
    }
    return result;
}

// ---- Shared code: the Android copies of this repository's files ---------------------------------

// Split the Android runtime bundle into {source, code} sections ("// js/x.js" then the file, trimmed).
export function bundleSections(bundle) {
    const start = bundle.indexOf(BUNDLE_START);
    const body = start >= 0 ? bundle.slice(start + BUNDLE_START.length) : bundle;
    const lines = body.split('\n');
    const sections = [];
    let current = null;
    for (const line of lines) {
        const m = line.match(/^\/\/ ((?:js|data)\/[A-Za-z0-9_./-]+\.js)$/);
        // A file whose own first line repeats its path ("// js/seed.js - ...") stays in its section.
        if (m && !(current && current.lines.length === 0 && current.source === m[1])) {
            current = { source: m[1], lines: [] };
            sections.push(current);
            continue;
        }
        if (current) current.lines.push(line);
    }
    return sections.map((s) => ({ source: s.source, code: s.lines.join('\n').trim() }));
}

// Compare one Android copy against the extension text. 'identical', 'differs' or 'missing'.
export function compareShared(androidText, extText, { section = false } = {}) {
    if (androidText == null) return 'missing on Android';
    if (extText == null) return 'missing in extension';
    const a = section ? androidText.trim() : androidText;
    const e = section ? extText.trim() : extText;
    return a === e ? 'identical' : 'differs';
}

// ---- git ----------------------------------------------------------------------------------------

export function androidRef(argv = process.argv) {
    const i = argv.indexOf('--android-ref');
    return (i >= 0 && argv[i + 1]) || process.env.FT_ANDROID_REF || DEFAULT_ANDROID_REF;
}

export function trackedCommits(ref, since = SYNC_POINT) {
    const out = androidGit(['log', '--no-merges', '--format=%H%x09%ad%x09%s', '--date=short', `${since}..${ref}`, '--', ...TRACKED_PATHS]);
    return out.trim().split('\n').filter(Boolean).map((l) => {
        const [sha, date, ...rest] = l.split('\t');
        return { sha: sha.slice(0, 9), date, subject: rest.join('\t') };
    });
}

export function commitFiles(sha, prefixes = TRACKED_PATHS) {
    return androidGit(['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', sha]).trim().split('\n')
        .filter((f) => f && prefixes.some((p) => f.startsWith(p)));
}

export function guessArea(subject, files) {
    const s = subject.toLowerCase();
    const scope = (s.match(/^\w+\(([^)]+)\)/) || [])[1] || '';
    if (/^docs|^test|^chore/.test(s) && !/release/.test(s)) return 'docs-test';
    if (/release/.test(s)) return 'release';
    if (/tv|tablet/.test(scope)) return 'tablet-tv';
    if (/study/.test(scope) || /study/.test(s)) return 'study';
    if (/kids/.test(scope)) return 'kids';
    if (/music|sangeet/.test(scope + s)) return 'music';
    if (/watch|player/.test(scope)) return 'watch';
    if (/viewer|home/.test(scope)) return 'home-viewer';
    if (/search/.test(scope + s)) return 'search';
    if (/mascot|doodle|icon|launch|motion|paperkit/.test(scope + s)) return 'brand-visual';
    if (/profile|pin|family|parent/.test(scope + s)) return 'profiles-family';
    if (/nearby|sync|nanah/.test(scope + s)) return 'nearby-sync';
    if (/support|billing/.test(scope + s)) return 'support';
    if (/^i18n|l10n/.test(s)) return 'strings';
    if (/controls|filter|settings|privacy/.test(scope + s)) return 'settings-controls';
    if (files.some((f) => f.includes('/tv/'))) return 'tablet-tv';
    return 'infra';
}

// What a row usually is for a browser extension, from its files and subject. Only a hint for new
// rows (`add`); a person decides the status.
export function guessExtensionStatus(subject, files) {
    const s = subject.toLowerCase();
    if (/^docs\(release-notes\)|^release android/.test(s)) return { status: 'todo', reason: 'mirror the release-notes line into data/release_notes.json' };
    if (/\(android-(tv|music)\)|sangeet|download|local media|offline/.test(s)) return { status: 'n/a', reason: 'Android-only surface (TV, Sangeet, downloads or local media)' };
    if (files.length && files.every((f) => /\/src\/(test|androidTest|debug|tvDebug)\//.test(f) || /\/Debug[^/]*\.kt$/.test(f))) {
        return { status: 'n/a', reason: 'Android tests or debug builds only' };
    }
    return { status: 'todo', reason: '' };
}

export function extFilesForCommits(shas) {
    const files = new Set();
    for (const sha of shas) {
        for (const f of git(['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', sha]).trim().split('\n')) {
            if (!f || /^data\/ui_locales\/(?!en\.json)|^_locales\/(?!en\/)|^docs\/|\.(png|webp|jpg|ogg)$/.test(f)) continue;
            files.add(f);
        }
    }
    return [...files];
}
