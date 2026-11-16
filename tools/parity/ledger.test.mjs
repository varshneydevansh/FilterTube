// node --test tools/parity/ledger.test.mjs
// Pure checks only: nothing here needs the app repository.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    LEDGER_COLUMNS, SHARED_DIFFERENCES, SHARED_FILES, bundleSections, compactFiles, compareShared, findMissing, formatTsv,
    guessExtensionStatus, openByArea, parseTsv, readFileMap, readLedger, sameSha, summarize, validateRows, visibilityOrder,
} from './lib.mjs';
import { filesFor, renderMarkdown } from './ledger.mjs';
import { auditPairs, mapFile } from './derive-file-map.mjs';

const row = (o) => ({
    android_sha: 'aaaaaaaaa', date: '2026-11-16', subject: 'feat(x): y', area: 'study', status: 'todo',
    ext_shas: '', reason: '', android_files: '', ext_files: '', ...o,
});

test('TSV round-trips and strips tabs and newlines from cells', () => {
    const rows = [row({ subject: 'a\tb\nc', android_files: 'x.kt;y.kt' })];
    const back = parseTsv(formatTsv(rows, LEDGER_COLUMNS), LEDGER_COLUMNS);
    assert.equal(back.length, 1);
    assert.equal(back[0].subject, 'a b c');
    assert.equal(back[0].android_files, 'x.kt;y.kt');
});

test('parseTsv rejects a missing column and an overlong line', () => {
    assert.throws(() => parseTsv('android_sha\tdate\n', LEDGER_COLUMNS), /lacks column/);
    assert.throws(() => parseTsv('a\tb\n1\t2\t3\n'), /has 3 cells/);
});

test('validateRows wants reasons for partial and n/a, an extension SHA for ported, no duplicates', () => {
    const problems = validateRows([
        row({ android_sha: '111111111', status: 'partial' }),
        row({ android_sha: '222222222', status: 'n/a' }),
        row({ android_sha: '333333333', status: 'ported' }),
        row({ android_sha: '333333333', status: 'todo' }),
        row({ android_sha: '444444444', status: 'ported', ext_shas: 'not-a-sha' }),
        row({ android_sha: 'zzz', status: 'done' }),
    ]);
    assert.equal(problems.filter((p) => /needs a reason/.test(p)).length, 2);
    assert.ok(problems.some((p) => /ported needs an ext_sha/.test(p)));
    assert.ok(problems.some((p) => /not a SHA/.test(p) && /444444444/.test(p)));
    assert.ok(problems.some((p) => /duplicate/.test(p)));
    assert.ok(problems.some((p) => /status "done"/.test(p)));
    assert.deepEqual(validateRows([row({ status: 'ported', ext_shas: 'bbbbbbbb,cccccccc' })]), []);
});

test('check finds Android commits with no row, matching abbreviated SHAs either way', () => {
    assert.ok(sameSha('abcdef123', 'abcdef1234567'));
    assert.ok(!sameSha('abcdef123', 'abcdef124'));
    const commits = [{ sha: 'abcdef123' }, { sha: '999999999' }, { sha: '1234567aa' }];
    const rows = [row({ android_sha: 'abcdef1234' }), row({ android_sha: '1234567' })];
    assert.deepEqual(findMissing(commits, rows).map((c) => c.sha), ['999999999']);
});

test('summary counts by status and area; partial weighs half; n/a is left out', () => {
    const s = summarize([
        row({ status: 'ported', area: 'study' }), row({ status: 'partial', area: 'study' }),
        row({ status: 'todo', area: 'kids' }), row({ status: 'n/a', area: 'docs-test' }),
    ]);
    assert.equal(s.total, 4);
    assert.equal(s.applicable, 3);
    assert.equal(Math.round(s.percentPorted * 10) / 10, 33.3);
    assert.equal(s.percentWeighted, 50);
    assert.equal(s.areaShare.study, 75);
});

test('open rows group by area in visibility order, todo before partial', () => {
    const rows = [
        row({ android_sha: '1', area: 'search', status: 'partial' }),
        row({ android_sha: '2', area: 'brand-visual', status: 'partial' }),
        row({ android_sha: '3', area: 'brand-visual', status: 'todo', subject: 'fix: a' }),
        row({ android_sha: '4', area: 'brand-visual', status: 'ported' }),
    ];
    assert.deepEqual(Object.keys(openByArea(rows)), ['brand-visual', 'search']);
    assert.deepEqual(visibilityOrder(openByArea(rows)['brand-visual']).map((r) => r.android_sha), ['3', '2']);
});

test('translated resources and big same-kind folders collapse', () => {
    assert.deepEqual(compactFiles(['a/res/values/s.xml', 'a/res/values-de/s.xml', 'a/res/values-ja/s.xml', 'a/res/drawable-nodpi/k.webp']),
        ['a/res/values/s.xml', 'a/res/drawable-nodpi/k.webp', 'a/res/values-*/s.xml (2)']);
    const many = Array.from({ length: 13 }, (_, i) => `r/drawable/icon_${i}.xml`);
    assert.deepEqual(compactFiles(['r/A.kt', ...many]), ['r/A.kt', 'r/drawable/*.xml (13)']);
});

test('files maps Android files through FILE_MAP, translations through their base, tests to app-parity tests', () => {
    const map = [
        { android_file: 'a/X.kt', ext_files: 'js/x.js', match: 'cited' },
        { android_file: 'a/res/values/s.xml', ext_files: 'data/ui_locales/en.json', match: 'strings' },
    ];
    const plan = filesFor(row({ android_files: 'a/X.kt;a/res/values-*/s.xml (37);a/Y.kt;a/src/test/java/com/f/StudyMergeTest.kt;a/src/main/java/DebugFoo.kt' }), map);
    assert.deepEqual(plan.map((p) => p.ext), ['js/x.js', 'data/ui_locales/en.json', '(not in FILE_MAP)',
        'tests/runtime/app-parity-study-merge.test.mjs', '(debug-only; skip)']);
});

test('render writes every row once with the summary line', () => {
    const md = renderMarkdown([row({ android_sha: '111111111', status: 'ported', ext_shas: 'b1b1b1b1,b2b2b2b2' }), row({ android_sha: '222222222', subject: 'a | b' })]);
    assert.match(md, /\*\*2 rows:\*\* 1 ported, 0 partial, 1 todo, 0 n\/a/);
    assert.match(md, /`b1b1b1b1`, `b2b2b2b2`/);
    assert.match(md, /a \\\| b/);
});

test('the runtime bundle splits into one section per extension file', () => {
    const bundle = [
        '(function wrapper() {', '// FILTERTUBE_APP_RUNTIME_BUNDLE_START', '',
        '// js/seed.js', '// js/seed.js - Early data interception', 'const a = 1;', '',
        '// js/shared/identity.js', 'const b = 2;', '',
    ].join('\n');
    const sections = bundleSections(bundle);
    assert.deepEqual(sections.map((s) => s.source), ['js/seed.js', 'js/shared/identity.js']);
    assert.equal(sections[0].code, '// js/seed.js - Early data interception\nconst a = 1;');
    assert.equal(compareShared(sections[1].code, 'const b = 2;\n', { section: true }), 'identical');
    assert.equal(compareShared('x', 'y'), 'differs');
    assert.equal(compareShared(null, 'y'), 'missing on Android');
    assert.equal(compareShared('x', null), 'missing in extension');
});

test('every shared file names an extension source, and each documented difference is a shared file', () => {
    for (const [android, ext] of SHARED_FILES) {
        assert.match(android, /^apps\/android\/app\/src\/main\/assets\//);
        assert.match(ext, /^(js|data)\//);
    }
    for (const [file, reason] of Object.entries(SHARED_DIFFERENCES)) {
        assert.match(file, /^js\//);
        assert.match(reason, /app tools\//);
    }
});

test('new rows guess n/a for Android-only surfaces and debug-only commits, todo otherwise', () => {
    assert.equal(guessExtensionStatus('fix(android-tv): rail', ['x/Tv.kt']).status, 'n/a');
    assert.equal(guessExtensionStatus('fix(android): keep Sangeet calm', ['x/A.kt']).status, 'n/a');
    assert.equal(guessExtensionStatus('chore: previews', ['apps/android/app/src/main/java/com/filtertube/app/DebugFoo.kt']).status, 'n/a');
    assert.equal(guessExtensionStatus('feat(android-study): a new gate', ['x/StudyGate.kt']).status, 'todo');
});

test('FILE_MAP pairs a cited Kotlin type, an audit row, art, sounds and strings', () => {
    const ctx = {
        sources: new Map([['js/mascots.js', '// Android UiSound and SupportSheetVariants']]),
        audit: auditPairs('| Undo | A/PaperUndoBar.kt | Missing | Present | js/state_manager.js `undoRemoval`, js/ui_components.js |\n| Row | res/layout/item_keyword.xml | P | P | css/paperkit-parity.css |'),
        exists: (p) => ['assets/sounds/soft_pop.ogg', 'assets/images/mascots/duo_shoo_01.webp'].includes(p),
        shared: new Map([['apps/android/app/src/main/assets/study/packs-v1.json', 'data/study/packs-v1.json']]),
    };
    const J = 'apps/android/app/src/main/java/com/filtertube/app/';
    const R = 'apps/android/app/src/main/res/';
    assert.deepEqual(mapFile(`${J}UiSound.kt`, ctx).ext_files, 'js/mascots.js');
    assert.equal(mapFile(`${J}PaperUndoBar.kt`, ctx).ext_files, 'js/state_manager.js;js/ui_components.js');
    assert.equal(mapFile(`${R}layout/item_keyword.xml`, ctx).match, 'audit');
    assert.equal(mapFile(`${R}raw/ui_soft_pop.ogg`, ctx).ext_files, 'assets/sounds/soft_pop.ogg');
    assert.equal(mapFile(`${R}drawable-nodpi/study_duo_shoo_01.webp`, ctx).ext_files, 'assets/images/mascots/duo_shoo_01.webp');
    assert.equal(mapFile(`${R}values/strings_study.xml`, ctx).match, 'strings');
    assert.equal(mapFile('apps/android/app/src/main/assets/study/packs-v1.json', ctx).match, 'shared');
    assert.equal(mapFile(`${J}NativeTvBrowseShell.kt`, ctx).match, 'n/a');
    assert.equal(mapFile(`${J}StudyMerge.kt`, ctx).match, 'known');
});

test('the committed ledger and file map parse and validate', () => {
    const rows = readLedger();
    assert.ok(rows.length > 0);
    assert.deepEqual(validateRows(rows), []);
    assert.ok(readFileMap().length > 0);
});
