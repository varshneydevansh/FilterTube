import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BROWSER_MANIFEST_RUNTIME_LOAD_ORDER_CURRENT_BEHAVIOR_2026-05-21.md';
const manifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
];

const helperStack = [
  'js/shared/identity.js',
  'js/shared/view_count.js',
  'js/content/admission_overlay.js',
  'js/content/dom_state.js',
  'js/content/menu.js',
  'js/content/dom_helpers.js',
  'js/content/dom_extractors.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/bridge_injection.js',
  'js/content/bridge_settings.js',
  'js/content/handle_resolver.js',
  'js/content/collab_dialog.js',
  'js/content/release_notes_prompt.js',
  'js/content/first_run_prompt.js',
  'js/content_bridge.js',
];

const playbackStack = [
  'js/shared/content_playback_source.js',
  'js/shared/content_playback_resolver.js',
  'js/content/content_playback_admission.js',
  'js/content/content_playback_native.js',
  'js/content/content_playback.js',
];
const normalHelperStack = [...helperStack.slice(0, -1), ...playbackStack, 'js/content/video_notes.js', ...helperStack.slice(-1)];

const commonMatches = [
  '*://*.youtube.com/*',
  '*://*.youtubekids.com/*',
];

const commonPermissions = [
  'storage',
  'unlimitedStorage',
  'activeTab',
  'scripting',
  'tabs',
  'downloads',
  'alarms',
];

const commonHostPermissions = [
  '*://*.youtube.com/*',
  '*://*.youtube-nocookie.com/*',
  '*://*.youtubekids.com/*',
];

const optionalPickupHostPermissions = [
  'http://*/*',
  'https://*/*',
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function bytes(file) {
  return fs.statSync(filePath(file)).size;
}

function lineCount(file) {
  return (read(file).match(/\n/g) || []).length;
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function contentScriptRefs(manifest) {
  return (manifest.content_scripts || []).flatMap((entry) => entry.js || []);
}

function contentScriptMatches(manifest) {
  return (manifest.content_scripts || []).flatMap((entry) => entry.matches || []);
}

function webAccessibleResources(manifest) {
  return (manifest.web_accessible_resources || []).flatMap((entry) => entry.resources || []);
}

function webAccessibleMatches(manifest) {
  return (manifest.web_accessible_resources || []).flatMap((entry) => entry.matches || []);
}

function trackedFiles() {
  return new Set(
    execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
  );
}

test('browser manifest current source inventory is pinned independently of historical May snapshot', () => {
  const expected = [["manifest.json",162,5630,"ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d"],["manifest.chrome.json",162,5630,"ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d"],["manifest.firefox.json",136,4593,"454805c26c62add8c1467d95ef41f1c4b6529b55ebcfbfbd81bfdcd93a0fb242"],["manifest.opera.json",170,5819,"c516d8c0439a79016b0ed04ffb3658bbd40f8e0868fc146d8707a9da076636a4"]];
  const doc = read(docPath).split('## Native Source Handoff Load Order - 2026-10-22')[1];
  assert.ok(doc, 'current review must distinguish historical claims');
  for (const [file, lines, size, hash] of expected) {
    assert.equal(lineCount(file), lines);
    assert.equal(bytes(file), size);
    assert.equal(sha256(file), hash);
    assert.ok(doc.includes(hash));
  }
  assert.equal(read('manifest.json'), read('manifest.chrome.json'));
});

test('all browser manifests retain localized identity, exact permissions and version alignment', () => {
  const version = readJson('package.json').version;
  assert.equal(version, '3.4.1');
  for (const file of manifestFiles) {
    const manifest = readJson(file);
    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.name, '__MSG_extensionName__');
    assert.equal(manifest.description, '__MSG_extensionDescription__');
    assert.equal(manifest.default_locale, 'en');
    assert.equal(manifest.version, version);
    assert.deepEqual(manifest.permissions, commonPermissions);
    assert.deepEqual(manifest.host_permissions, commonHostPermissions);
    assert.deepEqual(manifest.optional_host_permissions, optionalPickupHostPermissions);
    assert.equal(manifest.action.default_popup, 'html/popup.html');
    assert.deepEqual(manifest.action.default_icon, {16:'icons/icon-16.png',48:'icons/icon-48.png',128:'icons/icon-128.png'});
    assert.deepEqual(manifest.icons, {16:'icons/icon-16.png',32:'icons/icon-32.png',48:'icons/icon-48.png',128:'icons/icon-128.png'});
  }
});

test('normal, embedded and Google preview paths retain explicit browser-specific load order and worlds', () => {
  const embedMatches = ['*://*.youtube.com/embed/*', '*://*.youtube-nocookie.com/embed/*'];
  const googleMatches = ['https://*.google.com/search*'];
  const guardStack = [...helperStack.slice(0,3), 'js/content/external_youtube_guard.js', ...helperStack.slice(3)];
  for (const file of manifestFiles) {
    const manifest = readJson(file);
    const firefox = file.includes('firefox');
    const opera = file.includes('opera');
    const isolatedWorld = !firefox && !opera ? 'ISOLATED' : undefined;
    const entries = manifest.content_scripts;
    assert.equal(entries.length, firefox ? 5 : opera ? 7 : 6);
    const normal = entries.find(entry => entry.js.includes('js/content_bridge.js') && !entry.all_frames);
    assert.deepEqual(normal.js, normalHelperStack);
    assert.deepEqual(normal.matches, commonMatches);
    assert.deepEqual(normal.exclude_matches, ['*://*.youtube.com/embed/*']);
    assert.equal(normal.world, isolatedWorld);
    if (!firefox) {
      assert.deepEqual(entries[0].js, ['js/shared/view_count.js','js/seed.js']);
      assert.deepEqual(entries[0].matches, commonMatches);
      assert.equal(entries[0].world, opera ? undefined : 'MAIN');
      assert.deepEqual(entries[0].exclude_matches, ['*://*.youtube.com/embed/*']);
    }
    const embed = entries.filter(entry => entry.all_frames);
    assert.equal(embed.length, opera ? 3 : 2);
    assert.deepEqual(embed.at(-1).js, guardStack);
    assert.equal(embed.at(-1).world, isolatedWorld);
    for (const entry of embed) assert.deepEqual(entry.matches, embedMatches);
    assert.equal(embed[0].world, 'MAIN');
    assert.deepEqual(embed[0].js, !firefox && !opera
      ? ['js/content/external_youtube_network.js','js/shared/view_count.js','js/seed.js']
      : ['js/content/external_youtube_network.js']);
    if (opera) assert.deepEqual(embed[1].js, ['js/shared/view_count.js','js/seed.js']);
    const google = entries.filter(entry => entry.matches[0].includes('google.com'));
    assert.equal(google.length,2);
    for (const entry of google) assert.deepEqual(entry.matches, googleMatches);
    assert.deepEqual(google[0].js,['js/content/external_youtube_network.js']);
    assert.equal(google[0].world,'MAIN');
    assert.deepEqual(google[1].js,[...helperStack.slice(0,3),'js/content/external_youtube_guard.js']);
    assert.equal(google[1].world,isolatedWorld);
    for (const entry of entries) {
      assert.equal(entry.run_at,'document_start');
      assert.deepEqual(entry.css || [],[]);
    }
    if (firefox) {
      assert.deepEqual(manifest.background.scripts,['js/shared/identity.js','js/content/admission_overlay.js','js/imported_channel_enrichment.js','js/shared/saved_video_notes.js','js/video_notes_store.js','js/video_notes_background.js','js/background.js']);
      assert.equal(manifest.browser_specific_settings.gecko.id,'filtertube@devanshvarshney.com');
      assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required,['none']);
      assert.equal(manifest.browser_specific_settings.gecko_android.strict_min_version,'109.0');
    } else assert.equal(manifest.background.service_worker,'js/background.js');
  }
});

test('every declared script/resource exists and quarantined CSS cannot be activated by manifests', () => {
  const tracked = trackedFiles();
  for (const file of manifestFiles) {
    const manifest = readJson(file);
    for (const ref of contentScriptRefs(manifest)) assert.ok(tracked.has(ref), `${file}: ${ref}`);
    for (const ref of webAccessibleResources(manifest)) {
      if (ref === 'data/ui_locales/*.json') {
        assert.ok([...tracked].filter(path => path.startsWith('data/ui_locales/') && path.endsWith('.json')).length > 1);
      } else assert.ok(tracked.has(ref), `${file}: ${ref}`);
      assert.doesNotMatch(ref,/^css\//);
    }
    assert.ok(contentScriptMatches(manifest).includes('*://*.youtube-nocookie.com/embed/*'));
  }
});

test('fallback resources explicitly cover view counts, admission, localization and host-limited Google icons', () => {
  const resources = ['html/video-notes.html','js/injector.js','js/content/content_playback_response.js','js/filter_logic.js','js/seed.js','js/shared/identity.js','js/shared/view_count.js','js/content/admission_overlay.js','data/ui_locales/*.json','assets/images/homepage_hero_day.mp4','icons/icon-48.png'];
  for (const file of manifestFiles) {
    const entries = readJson(file).web_accessible_resources;
    assert.deepEqual(entries[0].resources, file.includes('opera') ? resources : [...resources,'icons/file.svg']);
    assert.deepEqual(entries[0].matches,commonHostPermissions);
    assert.deepEqual(entries[1],{resources:['icons/icon-48.png','data/ui_locales/*.json'],matches:['https://*.google.com/*']});
  }
});

test('fallback and build keep dependency ordering without claiming a runtime readiness authority', () => {
  const bridge = read('js/content/bridge_injection.js');
  assert.match(bridge,/const scriptsToInject = \['shared\/identity', 'shared\/view_count', 'filter_logic'\]/);
  assert.match(bridge,/if \(isFirefox\) scriptsToInject\.push\('seed'\)/);
  assert.match(bridge,/scriptsToInject\.push\('content\/content_playback_response'\)/);
  assert.match(bridge,/scriptsToInject\.push\('injector'\)/);
  assert.ok(bridge.indexOf("scriptsToInject.push('content/content_playback_response')")
    > bridge.indexOf("if (isFirefox) scriptsToInject.push('seed')"));
  assert.ok(bridge.indexOf("scriptsToInject.push('content/content_playback_response')")
    < bridge.indexOf("scriptsToInject.push('injector')"));
  const build = read('build.js');
  assert.match(build,/ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(build,/fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);
});

test('owned playback dependencies stay isolated on normal pages and out of embed and preview stacks', () => {
  for (const file of manifestFiles) {
    const manifest = readJson(file);
    const containing = manifest.content_scripts.filter(entry => entry.js.some(path => playbackStack.includes(path)));
    assert.equal(containing.length, 1);
    const [entry] = containing;
    assert.deepEqual(entry.js.filter(path => playbackStack.includes(path)), playbackStack);
    assert.notEqual(entry.world, 'MAIN');
    assert.equal(entry.all_frames, undefined);
    assert.deepEqual(entry.matches, commonMatches);
    assert.deepEqual(entry.exclude_matches, ['*://*.youtube.com/embed/*']);
    assert.ok(entry.js.indexOf(playbackStack.at(-1)) < entry.js.indexOf('js/content_bridge.js'));
    assert.equal(contentScriptRefs(manifest).includes('js/content/content_playback_response.js'), false);
    for (const inactive of ['transport', 'player', 'captions']) {
      assert.equal(contentScriptRefs(manifest).includes(`js/content/content_playback_${inactive}.js`), false,
        `${file} must leave the superseded separate engine inactive`);
    }
  }
});

test('browser manifest runtime load-order authority symbols are not implemented in product source', () => {
  const doc = read(docPath);
  const productSource = [
    ...manifestFiles,
    'build.js',
    'js/content/bridge_injection.js',
    'package.json',
  ].map(read).join('\n');

  for (const symbol of [
    'browserManifestRuntimeLoadOrderAuthority',
    'browserManifestPackageParityReport',
    'browserManifestContentScriptWorldReport',
    'browserManifestSeedReadyReport',
    'browserManifestHostScopeClassification',
    'browserManifestWebAccessibleResourceDecision',
    'browserManifestPermissionFeatureMap',
    'browserManifestBuildValidationReport',
    'browserManifestPackageQuarantineReport',
    'browserManifestJsonFirstStartupGate',
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.equal(productSource.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }

  assert.match(doc, /This register does not close browser-manifest tracked-file obligations/);
  assert.match(doc, /startup readiness reports, host classification, resource reasons/);
});
