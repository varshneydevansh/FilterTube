#!/usr/bin/env node
// Regenerates docs/parity/FILE_MAP.tsv: each Android file changed since the sync point, mapped to the
// extension file(s) that carry the same feature. Rows whose match is "manual" are kept as written.
//
//   node tools/parity/derive-file-map.mjs [--android-ref <ref>] [--android-repo <path>]
//
// Match kinds, strongest first: manual, shared (the app bundles this extension file), cited (an
// extension source line names the Kotlin type), audit (docs/design/EXTENSION_ANDROID_PARITY_AUDIT_*.md
// pairs them), assets (same art, sound, icon or font), strings (a strings file; its words live in
// data/ui_locales/en.json), n/a (nothing to port in a browser extension) and none (a gap).
import fs from 'node:fs';
import path from 'node:path';
import {
    FILE_MAP_COLUMNS, FILE_MAP_TSV, ROOT, RUNTIME_BUNDLE, SHARED_FILES, SYNC_POINT, androidGit, androidRef, formatTsv,
    readFileMap,
} from './lib.mjs';

const RES = 'apps/android/app/src/main/res/';
const JAVA = 'apps/android/app/src/main/java/com/filtertube/app/';

// Kotlin files whose feature can't exist in a browser extension (the app's own player, TV, Sangeet,
// local media and downloads, its native viewer shell, OS integration). Checked after cited/audit, so
// a type the extension names still maps.
export const NA_KOTLIN = [
    [/(^|\/)tv\/|Tv[A-Z]|Television|^StudyRemote|TvCapability/, 'Android TV'],
    [/^StudyFeedMix$|^StudyHomeHost$|^NativeSidePanel$|^YouTubeSignIn$/, 'the app\'s native Home, side panel or sign-in (the site owns these in a browser)'],
    [/^PlatformCountNeutralizer$/, 'rewrites counts on the app\'s native screens; the extension never rewrites the site\'s page'],
    [/^NativeUiText$/, 'Android string-resource helper'],
    [/Music|Sangeet/, 'Sangeet, the app\'s music space'],
    [/LocalMedia|LocalPlaylist|Offline|Download/, 'local media and downloads'],
    [/Playback|Player|Caption|Chapter|AudioNowPlaying|MediaSession|Ambient/, 'the app\'s own player'],
    [/^NativeMain|^NativeOwned|^NativeViewer|^NativeOverlay|NativeImageViewer|ViewerAccount|YouTubeAccount|MainYouTubeSession|PullRefresh|UljhanLoadMore|ContinueWatching/, 'the app\'s native viewer (the extension filters the site\'s own pages)'],
    [/^Debug|FixturePreview|Instrumentation/, 'debug builds and screenshot fixtures'],
    [/DirectUpdate|AppIcon|SeasonalIcon|WebViewActivity|AndroidWebSurface|NanahWebEngine|FilterTubeApplication|FilterTubeLog|SafeWebLogUrl|PinGateActivity|PinCheck|NativeFocusDecoration|ThemedSurface|NearbyTransfer|NearbyUi|NanahPairLink|SubscriptionsImport|KidsThirdPartyCookie|OffPlatformLink|ManagedTimeBudget|ManagedAppTimeBudget/, 'Android platform plumbing (app icon, updates, WebView host, threading, deep links, insets)'],
    [/^Kids(Allowed|Exit|Offline|ParentAction|YouTubeParent|ParentProvider)|KidsViewerMotion/, 'the app\'s native Kids viewer'],
];

// Kotlin types the extension doesn't name, paired by hand from the extension's structure.
export const KNOWN_KOTLIN = [
    [/^(Keyword|Channel)(Adapter|sFragment|AddSheet)$/, 'js/render_engine.js;js/tab-view.js;css/paperkit-parity.css'],
    [/^ContentControls(Adapter|Fragment)$/, 'js/content_controls_catalog.js;js/tab-view.js;css/paperkit-parity.css'],
    [/^Controls|^NativeControls|^ControlCenterModel$|^FiltersTabletLayout$/, 'html/tab-view.html;css/paperkit-parity.css;js/paperkit_parity.js'],
    [/^AskParentActivities$/, 'js/tab-view.js;js/popup.js;js/content/admission_overlay.js'],
    [/^ChildActorWriteGuard$|^SelfControlSessionCoordinator$|^ProfilePolicyGate$/, 'js/background.js'],
    [/^ParentMode$/, 'js/background.js;js/tab-view.js;js/study_background.js'],
    [/^CountryAccent$/, 'js/study_ui.js;css/study.css'],
    [/^FilterTubeMessageDialog$/, 'js/ui_components.js;css/paperkit-parity.css'],
    [/^IconKit$/, 'assets/icons/crayon/*.svg;scripts/export-crayon-icons.mjs'],
    [/^LoadingPersonalityViews$|^MascotIdleInteraction$|^MascotStage$|^SheetChoreography$/, 'js/mascots.js;css/mascots.css'],
    [/^NanahManagedReceiveStore$|^PendingNanahSyncReview$|^SyncRuntimeState$/, 'js/nanah_sync_adapter.js;js/nanah_managed_open_sync.js;js/device_auto_sync_ui.js'],
    [/^Profile(CreateFlow|DropdownPopup|PickerFooter|PickerRow|Visuals)$/, 'js/tab-view.js;js/popup.js;js/ui_components.js'],
    [/^Profile(Models|Repository)$/, 'js/settings_shared.js;js/background.js'],
    [/^ProfileRouteAccess$/, 'js/security_manager.js;js/background.js'],
    [/^StudyClock$|^StudySearch$/, 'js/shared/study_engine.js'],
    [/^Study(Rest|Session(Views|StripHost|Models)|PageRules|PagesHost|LooseningSheet)/, 'js/content/study_overlay.js;js/popup.js'],
    [/^Study/, 'js/study_ui.js;css/study.css'],
];

const kindOf = (f) => (f.endsWith('.kt') ? (/\/src\/(test|androidTest)\//.test(f) ? 'test' : 'kotlin')
    : f.includes('/res/layout') ? 'layout' : f.includes('/res/values') ? 'values' : f.includes('/res/drawable') ? 'drawable'
        : f.includes('/res/mipmap') ? 'app-icon' : f.includes('/res/raw/') ? 'raw' : f.includes('/res/font/') ? 'font'
            : f.includes('/src/main/assets/') ? 'asset' : 'other');

function extensionSources() {
    const out = new Map();
    const walk = (dir) => {
        for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
            const rel = path.join(dir, entry.name);
            if (entry.isDirectory()) { if (!/vendor|locales/.test(entry.name)) walk(rel); continue; }
            if (/\.(js|css|html)$/.test(entry.name)) out.set(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8'));
        }
    };
    for (const dir of ['js', 'css', 'html']) walk(dir);
    return out;
}

// A/Foo.kt (and res/layout/x.xml) -> the extension files the audit's row names.
export function auditPairs(markdown) {
    const pairs = new Map();
    for (const line of markdown.split('\n')) {
        if (!line.startsWith('|')) continue;
        const cells = line.split('|').map((c) => c.trim());
        const names = [...line.matchAll(/A\/([A-Za-z0-9]+)\.kt|res\/layout\/([a-z0-9_]+\.xml)/g)].map((m) => m[1] ? `${m[1]}.kt` : `layout/${m[2]}`);
        const files = [...(cells.at(-2) || '').matchAll(/((?:js|css|html|data|assets)\/[A-Za-z0-9_./*-]+\.(?:js|css|html|json))/g)].map((m) => m[1]);
        if (!names.length || !files.length) continue;
        for (const n of names) pairs.set(n, [...new Set([...(pairs.get(n) ?? []), ...files])]);
    }
    return pairs;
}

export function mapFile(file, { sources, audit, exists, shared }) {
    const base = path.basename(file);
    const kind = kindOf(file);
    const row = (ext, match, note = '') => ({ android_file: file, kind, ext_files: ext, match, note });
    if (shared.has(file)) return row(shared.get(file), 'shared', 'the app bundles this extension file (ledger.mjs shared)');
    if (file === RUNTIME_BUNDLE) return row('js/seed.js;js/shared/identity.js;js/filter_logic.js;js/content/*.js;js/content_bridge.js;js/injector.js;js/layout.js', 'shared', 'built from the extension sources (ledger.mjs shared compares each section)');
    if (kind === 'kotlin') {
        const type = base.replace(/\.kt$/, '');
        const word = new RegExp(`\\b${type}\\b`);
        const cited = [...sources].filter(([, text]) => word.test(text)).map(([f]) => f).sort();
        if (cited.length) return row(cited.slice(0, 6).join(';'), 'cited', `named in ${cited.length} extension file(s)`);
        if (audit.has(base)) return row(audit.get(base).join(';'), 'audit', 'EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md');
        const known = KNOWN_KOTLIN.find(([re]) => re.test(type));
        if (known) return row(known[1], 'known', 'paired by hand in derive-file-map.mjs KNOWN_KOTLIN; check before trusting');
        const na = NA_KOTLIN.find(([re]) => re.test(type));
        if (na) return row('n/a', 'n/a', na[1]);
        return row('none (gap)', 'none');
    }
    if (kind === 'test') return row('n/a', 'n/a', 'Android test; port its cases to tests/runtime/app-parity-*.test.mjs with the feature');
    if (kind === 'layout') {
        const hit = audit.get(`layout/${base}`);
        return hit ? row(hit.join(';'), 'audit', 'EXTENSION_ANDROID_PARITY_AUDIT_2026-11-16.md') : row('n/a', 'n/a', 'Android layout; the extension builds its own markup');
    }
    if (kind === 'values') {
        if (/strings[^/]*\.xml$/.test(base)) return row('data/ui_locales/en.json', 'strings', 'English words; the 37 other catalogs are data/ui_locales/<locale>.json');
        return row('n/a', 'n/a', 'Android resource ids, dimensions or themes');
    }
    if (kind === 'raw') {
        const ext = `assets/sounds/${base.replace(/^ui_/, '')}`;
        return exists(ext) ? row(ext, 'assets') : row('none (gap)', 'none');
    }
    if (kind === 'font') {
        const ext = /delius/i.test(base) ? 'assets/fonts/delius.ttf' : /outfit/i.test(base) ? 'assets/fonts/outfit_variable.ttf' : '';
        return ext && exists(ext) ? row(ext, 'assets') : row('none (gap)', 'none');
    }
    if (kind === 'drawable') {
        if (/-(xxxhdpi|xxhdpi|xhdpi|hdpi|mdpi|anydpi-v26)\//.test(file) || /ic_launcher|app_icon|launcher/.test(base)) return row('n/a', 'n/a', 'app icon');
        const name = base.replace(/\.(webp|png|xml)$/, '');
        const candidates = [
            `assets/images/mascots/${name.replace(/^study_/, '')}.webp`,
            `assets/icons/crayon/${name.replace(/^icon_/, '')}.svg`,
            `assets/images/doodles/${name.replace(/^doodle_/, '').replace(/_\d+$/, '')}.webp`,
        ];
        const hit = candidates.find(exists);
        if (hit) return row(hit, 'assets');
        if (/mascot_(kagaz|mohar|phoolu|bindu|rekha)/.test(name)) return row('n/a', 'n/a', 'retired character (only Kriti and Uljhan)');
        if (/^splash_/.test(name)) return row('n/a', 'n/a', 'the app\'s launch story; the extension has no launch screen');
        if (/^doodle_/.test(name)) return row('none (gap)', 'none', 'doodle not in assets/images/doodles yet');
        return row('n/a', 'n/a', 'Android drawable (shape, selector or player art)');
    }
    if (kind === 'app-icon') return row('n/a', 'n/a', 'app icon');
    if (kind === 'asset') return row('n/a', 'n/a', 'Android-only asset (native bridge or WebView host)');
    return row('n/a', 'n/a', 'build or manifest');
}

function main() {
    const ref = androidRef();
    const files = androidGit(['log', '--no-merges', '--name-only', '--format=', `${SYNC_POINT}..${ref}`, '--', 'apps/android/app/src/main/'])
        .trim().split('\n').filter(Boolean);
    const exists = (p) => fs.existsSync(path.join(ROOT, p));
    const live = [...new Set(files)].filter((f) => {
        try { androidGit(['cat-file', '-e', `${ref}:${f}`]); return true; } catch { return false; }
    }).filter((f) => !/\/res\/(values|layout)-[^/]+\//.test(f)).sort();
    const auditFile = fs.readdirSync(path.join(ROOT, 'docs/design')).filter((f) => /^EXTENSION_ANDROID_PARITY_AUDIT_.*\.md$/.test(f)).sort().at(-1);
    const audit = auditPairs(auditFile ? fs.readFileSync(path.join(ROOT, 'docs/design', auditFile), 'utf8') : '');
    const ctx = { sources: extensionSources(), audit, exists, shared: new Map(SHARED_FILES) };
    const manual = new Map(readFileMap().filter((r) => r.match === 'manual').map((r) => [r.android_file, r]));
    const rows = live.map((f) => manual.get(f) ?? mapFile(f, ctx));
    for (const [f, r] of manual) if (!live.includes(f)) rows.push(r);
    fs.writeFileSync(FILE_MAP_TSV, formatTsv(rows, FILE_MAP_COLUMNS));
    const by = rows.reduce((m, r) => ({ ...m, [r.match]: (m[r.match] ?? 0) + 1 }), {});
    console.log(`wrote ${path.relative(ROOT, FILE_MAP_TSV)}: ${rows.length} rows (${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(', ')})`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
