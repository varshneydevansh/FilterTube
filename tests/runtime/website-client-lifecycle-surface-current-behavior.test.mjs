import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WEBSITE_CLIENT_LIFECYCLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';
const lifecycleFiles = [
  ['website/app/layout.js', 129, 3621, '9821e403c734a9b40c311be208a35fd6a3afc09e0ac240fa7c681e8aaba410b4'],
  ['website/components/scene-controller.js', 88, 1871, '9a396c57e3e91249916e3d0d1ecc3ce11a85885b32bd8dd8640311fbc1394a67'],
  ['website/components/site-header.js', 186, 7700, '6ffe1ff1815300d7e9f407c27bebe7bff14e2e6c1a794ce5290b9c0eb8c6f734'],
  ['website/components/theme-toggle.js', 106, 3577, '17352421ab9eee46d72aded73f0b1dacb27e8ab0b93dad7096c7343b4bdd323d'],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function bytes(file) {
  return fs.statSync(filePath(file)).size;
}

function wcLines(file) {
  const source = fs.readFileSync(filePath(file), 'binary');
  return (source.match(/\n/g) || []).length;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath(file))).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .sort();
}

function websiteJsFiles() {
  return git(['ls-files', 'website/app/*.js', 'website/components/*.js']);
}

function count(source, pattern) {
  return (source.match(pattern) || []).length;
}

function appComponentSource() {
  return websiteJsFiles().map(read).join('\n');
}

function clientComponents() {
  return websiteJsFiles().filter((file) => read(file).trim().startsWith('"use client";'));
}

test('website client lifecycle surface doc is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /website behavior change, build proof, analytics approval,\s+or first-class JSON filter public-claim gate/);

  assert.equal(websiteJsFiles().length, 22);
  assert.match(doc, /22\s+tracked JavaScript files/);
  assert.deepEqual(clientComponents(), [
    'website/components/scene-controller.js',
    'website/components/site-header.js',
    'website/components/theme-toggle.js',
  ]);
  assert.match(doc, /Only three files start with `"use client";`/);

  for (const [file, lineCount, byteCount, hash] of lifecycleFiles) {
    assert.equal(wcLines(file), lineCount, `${file} line count drifted`);
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(lineCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(byteCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(hash));
  }
});

test('website client lifecycle primitive totals remain bounded and explicit', () => {
  const source = appComponentSource();
  const doc = read(docPath);

  assert.equal(count(source, /\buseEffect\s*\(/g), 3);
  assert.equal(count(source, /\buseEffectEvent\s*\(/g), 1);
  assert.equal(count(source, /\buseState\s*\(/g), 2);
  assert.equal(count(source, /\bstartTransition\s*\(/g), 1);
  assert.equal(count(source, /\b(?:window|document)\.addEventListener\s*\(/g), 3);
  assert.equal(count(source, /\b(?:window|document)\.removeEventListener\s*\(/g), 3);
  assert.equal(count(source, /\bwindow\.setTimeout\s*\(/g), 1);
  assert.equal(count(source, /\bwindow\.clearTimeout\s*\(/g), 2);
  assert.equal(count(source, /\bwindow\.localStorage\.getItem\s*\(/g), 2);
  assert.equal(count(source, /\bwindow\.localStorage\.setItem\s*\(/g), 1);
  assert.equal(count(source, /\bwindow\.dispatchEvent\s*\(/g), 1);
  assert.equal(count(source, /\bonClick=/g), 4);

  for (const absent of [
    /\bfetch\s*\(/,
    /MutationObserver/,
    /IntersectionObserver/,
    /ResizeObserver/,
    /\bsetInterval\s*\(/,
    /\bclearInterval\s*\(/,
    /\brequestAnimationFrame\s*\(/,
    /\bcancelAnimationFrame\s*\(/,
    /sessionStorage/,
  ]) {
    assert.doesNotMatch(source, absent);
  }

  assert.match(doc, /`useEffect\(\.\.\.\)` calls \| 3/);
  assert.match(doc, /`window`\/`document` `addEventListener\(\.\.\.\)` calls \| 3/);
  assert.match(doc, /`window\.setTimeout\(\.\.\.\)` calls \| 1/);
  assert.match(doc, /zero `fetch\(\.\.\.\)`,\s+`MutationObserver`, `IntersectionObserver`, `ResizeObserver`, `setInterval`/);
});

test('root layout hydration script owns pre-hydration theme and scene mutation', () => {
  const layout = read('website/app/layout.js');
  const doc = read(docPath);

  assert.match(layout, /<Script id="filtertube-js" strategy="beforeInteractive">/);
  assert.match(layout, /document\.documentElement\.classList\.add\('js'\)/);
  assert.match(layout, /window\.localStorage\.getItem\('filtertube-theme'\)/);
  assert.match(layout, /hour >= 20 \|\| hour < 5/);
  assert.match(layout, /hour >= 17/);
  assert.match(layout, /hour >= 10/);
  assert.match(layout, /root\.dataset\.themePreference = storedTheme/);
  assert.match(layout, /root\.dataset\.theme = storedTheme/);
  assert.match(layout, /root\.dataset\.scene = scene/);
  assert.match(layout, /root\.style\.colorScheme = storedTheme/);
  assert.match(layout, /document\.documentElement\.dataset\.themePreference = 'light'/);
  assert.match(layout, /document\.documentElement\.dataset\.scene = 'day'/);

  assert.match(doc, /adds the `js` class to `document\.documentElement`/);
  assert.match(doc, /falls back to light\/day state/);
  assert.match(doc, /hydration-consistency behavior, not a filtering behavior/);
});

test('scene controller schedules and tears down one visibility-bound timer owner', () => {
  const scene = read('website/components/scene-controller.js');
  const doc = read(docPath);

  assert.match(scene, /const sceneBoundaries = \[/);
  assert.match(scene, /\{ hour: 5, scene: "dawn" \}/);
  assert.match(scene, /\{ hour: 10, scene: "day" \}/);
  assert.match(scene, /\{ hour: 17, scene: "sunset" \}/);
  assert.match(scene, /\{ hour: 20, scene: "night" \}/);
  assert.match(scene, /function getSceneForHour\(hour\)/);
  assert.match(scene, /function getNextSceneBoundary\(now\)/);
  assert.match(scene, /const applyScene = useEffectEvent\(\(\) => \{/);
  assert.match(scene, /timeoutId = window\.setTimeout\(\(\) => \{/);
  assert.match(scene, /nextBoundary\.getTime\(\) - now\.getTime\(\) \+ 250/);
  assert.match(scene, /document\.visibilityState === "visible"/);
  assert.match(scene, /document\.addEventListener\("visibilitychange", handleVisibility\)/);
  assert.match(scene, /window\.clearTimeout\(timeoutId\)/);
  assert.match(scene, /document\.removeEventListener\("visibilitychange", handleVisibility\)/);

  assert.match(doc, /05:00 `dawn`/);
  assert.match(doc, /20:00 `night`/);
  assert.match(doc, /background-tab\s+fixture/);
  assert.match(doc, /route-level timer budget/);
});

test('theme toggle and site header keep interactions source-local without lifecycle authority', () => {
  const scene = read('website/components/scene-controller.js');
  const theme = read('website/components/theme-toggle.js');
  const header = read('website/components/site-header.js');
  const reveal = read('website/components/reveal.js');
  const doc = read(docPath);

  assert.match(theme, /const storageKey = "filtertube-theme"/);
  assert.match(theme, /const themeSyncEvent = "filtertube:theme-change"/);
  assert.match(theme, /function normalizeThemePreference\(themePreference\)/);
  assert.match(theme, /window\.addEventListener\("storage", handleStorage\)/);
  assert.match(theme, /window\.addEventListener\(themeSyncEvent, handleThemeSync\)/);
  assert.match(theme, /window\.removeEventListener\("storage", handleStorage\)/);
  assert.match(theme, /window\.removeEventListener\(themeSyncEvent, handleThemeSync\)/);
  assert.match(theme, /window\.localStorage\.setItem\(storageKey, resolvedTheme\)/);
  assert.match(theme, /new CustomEvent\(themeSyncEvent/);
  assert.match(theme, /event\.detail\?\.themePreference/);
  assert.match(theme, /onClick=\{\(\) => handleThemeChange\(nextTheme\)\}/);

  assert.match(header, /const \[menuOpen, setMenuOpen\] = useState\(false\)/);
  assert.match(header, /useEffect\(\(\) => \{\s+setMenuOpen\(false\);\s+\}, \[pathname\]\)/);
  assert.match(header, /startTransition\(\(\) => \{/);
  assert.match(header, /setMenuOpen\(\(current\) => !current\)/);
  assert.match(header, /onClick=\{toggleMenu\}/);
  assert.match(header, /onClick=\{\(\) => setMenuOpen\(false\)\}/);
  assert.doesNotMatch(header, /addEventListener|setTimeout|localStorage|document\.|window\./);

  assert.match(doc, /storage key `filtertube-theme`/);
  assert.match(doc, /custom event name `filtertube:theme-change`/);
  assert.match(doc, /route-change menu closure/);
  assert.match(doc, /escape-key behavior/);
  assert.match(doc, /mobile overlay click-away behavior\s+remain unproven/);

  assert.match(doc, /Website Client Method Semantic Addendum - 2026-05-27/);
  assert.match(doc, /website client method\/callback rows covered: 22/);
  assert.match(doc, /scene controller rows: 8/);
  assert.match(doc, /theme toggle rows: 8/);
  assert.match(doc, /site header rows: 5/);
  assert.match(doc, /reveal rows: 1/);
  assert.match(doc, /website client listener rows covered: 3/);
  assert.match(doc, /website client timer rows covered: 1/);
  assert.match(doc, /website client storage-write rows covered: 1/);
  assert.match(doc, /website client dispatch rows covered: 1/);
  assert.match(doc, /ASCII lifecycle flow:/);
  assert.match(doc, /Mermaid lifecycle flow:/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);

  assert.match(scene, /function getSceneForHour\(hour\)/);
  assert.match(scene, /function getNextSceneBoundary\(now\)/);
  assert.match(scene, /export function SceneController\(\)/);
  assert.match(scene, /const applyScene = useEffectEvent\(\(\) => \{/);
  assert.match(scene, /const scheduleNextUpdate = \(\) => \{/);
  assert.match(scene, /timeoutId = window\.setTimeout\(\(\) => \{/);
  assert.match(scene, /const handleVisibility = \(\) => \{/);
  assert.match(scene, /return \(\) => \{\s+window\.clearTimeout\(timeoutId\);\s+document\.removeEventListener\("visibilitychange", handleVisibility\);/);

  assert.match(theme, /function normalizeThemePreference\(themePreference\)/);
  assert.match(theme, /function applyTheme\(themePreference\)/);
  assert.match(theme, /function getStoredThemePreference\(\)/);
  assert.match(theme, /export function ThemeToggle\(\{ mobile = false \}\)/);
  assert.match(theme, /const syncPreference = \(\) => \{/);
  assert.match(theme, /const handleStorage = \(event\) => \{/);
  assert.match(theme, /const handleThemeSync = \(event\) => \{/);
  assert.match(theme, /function handleThemeChange\(nextTheme\)/);

  assert.match(header, /function NavLink\(\{/);
  assert.match(header, /export function SiteHeader\(\)/);
  assert.match(header, /useEffect\(\(\) => \{\s+setMenuOpen\(false\);\s+\}, \[pathname\]\);/);
  assert.match(header, /function toggleMenu\(\)/);
  assert.match(header, /startTransition\(\(\) => \{\s+setMenuOpen\(\(current\) => !current\);/);
  assert.match(reveal, /export function Reveal\(\{/);

  for (const row of [
    ['website_scene_getSceneForHour', 'website/components/scene-controller.js:12'],
    ['website_scene_getNextSceneBoundary', 'website/components/scene-controller.js:25'],
    ['website_scene_SceneController', 'website/components/scene-controller.js:50'],
    ['website_scene_applyScene', 'website/components/scene-controller.js:51'],
    ['website_scene_scheduleNextUpdate', 'website/components/scene-controller.js:60'],
    ['website_scene_timerCallback', 'website/components/scene-controller.js:63'],
    ['website_scene_handleVisibility', 'website/components/scene-controller.js:69'],
    ['website_scene_effectCleanup', 'website/components/scene-controller.js:81'],
    ['website_theme_normalizeThemePreference', 'website/components/theme-toggle.js:9'],
    ['website_theme_applyTheme', 'website/components/theme-toggle.js:13'],
    ['website_theme_getStoredThemePreference', 'website/components/theme-toggle.js:22'],
    ['website_theme_ThemeToggle', 'website/components/theme-toggle.js:34'],
    ['website_theme_syncPreference', 'website/components/theme-toggle.js:38'],
    ['website_theme_handleStorage', 'website/components/theme-toggle.js:46'],
    ['website_theme_handleThemeSync', 'website/components/theme-toggle.js:51'],
    ['website_theme_handleThemeChange', 'website/components/theme-toggle.js:67'],
    ['website_header_NavLink', 'website/components/site-header.js:16'],
    ['website_header_SiteHeader', 'website/components/site-header.js:47'],
    ['website_header_routeCloseEffect', 'website/components/site-header.js:52'],
    ['website_header_toggleMenu', 'website/components/site-header.js:56'],
    ['website_header_transitionCallback', 'website/components/site-header.js:57'],
    ['website_reveal_Reveal', 'website/components/reveal.js:1']
  ]) {
    const [id, source] = row;
    assert.ok(doc.includes(`| \`${id}\` | \`${source}\` |`), `missing website client row ${id}`);
  }

  assert.match(doc, /website client method semantic proof: PARTIAL/);
  assert.match(doc, /website client lifecycle cleanup approval: NO-GO/);
  assert.match(doc, /website theme preference authority approval: NO-GO/);
  assert.match(doc, /website timer\/listener budget approval: NO-GO/);
  assert.match(doc, /website first-class JSON public-claim use: NO-GO/);
});

test('tracked website app and component source lacks website lifecycle authority symbols', () => {
  const source = appComponentSource();
  const doc = read(docPath);

  for (const symbol of [
    'websiteClientLifecycleAuthority',
    'websiteHydrationScriptContract',
    'websiteSceneScheduleBudget',
    'websiteThemePreferenceAuthority',
    'websiteClientListenerRegistry',
    'websiteClientTimerBudget',
    'websiteLocalStorageContract',
    'websiteHeaderMenuInteractionAuthority',
    'websiteClientLifecycleFixtureProvenance',
    'websiteFirstClassJsonPublicClaimGate',
  ]) {
    assert.doesNotMatch(source, new RegExp(symbol));
    assert.match(doc, new RegExp(symbol));
  }

  assert.match(doc, /This register does not close website tracked-file obligations/);
  assert.match(doc, /route smoke proof/);
  assert.match(doc, /browser screenshots/);
  assert.match(doc, /accessibility fixtures/);
  assert.match(doc, /timer\/listener budgets/);
  assert.match(doc, /localStorage error and cross-tab fixtures/);
  assert.match(doc, /public-claim parity proof/);
});
