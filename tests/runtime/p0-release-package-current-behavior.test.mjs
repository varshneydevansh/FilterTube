import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const manifestFiles = ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json'];
const distBrowserTargets = ['chrome', 'firefox', 'opera'];
const packageCopiedDirectoryRoots = ['_locales', 'js', 'css', 'html', 'icons', 'data', 'assets'];
const expectedManifestPermissions = ['storage', 'unlimitedStorage', 'activeTab', 'scripting', 'tabs', 'downloads', 'alarms'];
const expectedManifestHostPermissions = [
  '*://*.youtube.com/*',
  '*://*.youtube-nocookie.com/*',
  '*://*.youtubekids.com/*'
];
const expectedManifestOptionalHostPermissions = [
  'http://*/*',
  'https://*/*'
];
const expectedActiveManifestMatches = ['*://*.youtube.com/*', '*://*.youtubekids.com/*', '*://*.youtube.com/embed/*', '*://*.youtube-nocookie.com/embed/*', 'https://*.google.com/search*'];
const expectedResourceMatches = ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*', '*://*.youtubekids.com/*', 'https://*.google.com/*'];
const releasePackageFamilyDocs = [
  'docs/audit/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_PROMPT_RELEASE_OVERLAY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_PUBLIC_RELEASE_SURFACE_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_RAW_CAPTURE_RELEASE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_RELEASE_PACKAGE_PARITY_AUDIT_2026-05-18.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function fileSize(file) {
  return fs.statSync(path.join(repoRoot, file)).size;
}

function walkFiles(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      walkFiles(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function contentScriptCss(file) {
  return (readJson(file).content_scripts || []).flatMap(script => script.css || []);
}

function referencedPathExists(ref) {
  if (!ref.includes('*')) return fs.existsSync(path.join(repoRoot, ref));
  const directory = path.dirname(ref.slice(0, ref.indexOf('*')));
  const pattern = new RegExp(`^${ref.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^/]*')}$`);
  return walkFiles(directory).some(file => pattern.test(file));
}

function manifestReferenceEntries(file) {
  const manifest = readJson(file);
  const entries = [];
  const push = (type, value) => {
    if (typeof value === 'string' && value.trim()) entries.push({ file, type, path: value.trim() });
  };

  push('background.service_worker', manifest.background?.service_worker);
  for (const script of manifest.background?.scripts || []) push('background.scripts', script);
  push('action.default_popup', manifest.action?.default_popup);
  for (const icon of Object.values(manifest.action?.default_icon || {})) push('action.default_icon', icon);
  for (const icon of Object.values(manifest.icons || {})) push('icons', icon);
  for (const script of manifest.content_scripts || []) {
    for (const js of script.js || []) push('content_scripts.js', js);
    for (const css of script.css || []) push('content_scripts.css', css);
  }
  for (const resource of manifest.web_accessible_resources || []) {
    for (const item of resource.resources || []) push('web_accessible_resources', item);
  }

  return entries;
}

function manifestReferenceClosureStats() {
  const perManifest = new Map();
  const combinedUnique = new Set();
  const missing = [];
  const outsideCopiedRoots = [];
  let contentScriptCssRefs = 0;

  for (const file of manifestFiles) {
    const entries = manifestReferenceEntries(file);
    const unique = new Set(entries.map(entry => entry.path));
    for (const entry of entries) {
      combinedUnique.add(entry.path);
      if (entry.type === 'content_scripts.css') contentScriptCssRefs += 1;
    }
    for (const ref of unique) {
      if (!referencedPathExists(ref)) missing.push(`${file}:${ref}`);
      const root = ref.split('/')[0];
      if (!packageCopiedDirectoryRoots.includes(root)) outsideCopiedRoots.push(`${file}:${ref}`);
    }
    perManifest.set(file, {
      references: entries.length,
      unique: unique.size
    });
  }

  return { perManifest, combinedUnique, missing, outsideCopiedRoots, contentScriptCssRefs };
}

function manifestPermissionResourceValidationStats() {
  const perManifest = new Map();
  let contentScriptCssRefs = 0;

  for (const file of manifestFiles) {
    const manifest = readJson(file);
    const contentScripts = manifest.content_scripts || [];
    const webAccessibleResources = manifest.web_accessible_resources || [];
    const contentMatches = [...new Set(contentScripts.flatMap(script => script.matches || []))];
    const resourceMatches = [...new Set(webAccessibleResources.flatMap(resource => resource.matches || []))];
    const explicitWorlds = [...new Set(contentScripts.map(script => script.world).filter(Boolean))];
    const hostOnlyNocookieGap = (manifest.host_permissions || []).some(host => host.includes('youtube-nocookie.com'))
      && !contentMatches.some(match => match.includes('youtube-nocookie.com'))
      && !resourceMatches.some(match => match.includes('youtube-nocookie.com'));

    contentScriptCssRefs += contentScripts.flatMap(script => script.css || []).length;
    perManifest.set(file, {
      permissions: manifest.permissions || [],
      hostPermissions: manifest.host_permissions || [],
      optionalHostPermissions: manifest.optional_host_permissions || [],
      contentScriptEntries: contentScripts.length,
      contentScriptJsRefs: contentScripts.flatMap(script => script.js || []).length,
      explicitWorlds,
      webAccessibleResourceRefs: webAccessibleResources.flatMap(resource => resource.resources || []).length,
      contentMatches,
      resourceMatches,
      hostOnlyNocookieGap
    });
  }

  return { perManifest, contentScriptCssRefs };
}

function manifestIncognitoBoundaryStats() {
  const rows = manifestFiles.map(file => {
    const manifest = readJson(file);
    const contentMatches = [...new Set((manifest.content_scripts || []).flatMap(script => script.matches || []))];
    const hostPermissions = manifest.host_permissions || [];
    const hasNocookieHostPermission = hostPermissions.some(host => host.includes('youtube-nocookie.com'));
    const hasNocookieContentMatch = contentMatches.some(match => match.includes('youtube-nocookie.com'));

    return {
      file,
      hasExplicitIncognitoKey: Object.prototype.hasOwnProperty.call(manifest, 'incognito'),
      hasYoutubeHostPermission: hostPermissions.some(host => host.includes('youtube.com')),
      hasYoutubeContentMatch: contentMatches.some(match => match.includes('youtube.com')),
      hasYoutubeKidsContentMatch: contentMatches.some(match => match.includes('youtubekids.com')),
      hostOnlyNocookieGap: hasNocookieHostPermission && !hasNocookieContentMatch
    };
  });

  return {
    rows,
    files: rows.length,
    explicitIncognitoKeys: rows.filter(row => row.hasExplicitIncognitoKey).length,
    youtubeHostPermissionFiles: rows.filter(row => row.hasYoutubeHostPermission).length,
    youtubeContentMatchFiles: rows.filter(row => row.hasYoutubeContentMatch).length,
    youtubeKidsContentMatchFiles: rows.filter(row => row.hasYoutubeKidsContentMatch).length,
    hostOnlyNocookieGapFiles: rows.filter(row => row.hostOnlyNocookieGap).length
  };
}

// Current source closure is checked independently of dated installed-profile
// observations. Routine release tests never inspect a personal browser profile.
const currentManifestSnapshot = {
  "manifest.json": {
    "references": 72,
    "unique": 38,
    "entries": 6,
    "js": 49,
    "worlds": [
      "MAIN",
      "ISOLATED"
    ],
    "resources": 14
  },
  "manifest.chrome.json": {
    "references": 72,
    "unique": 38,
    "entries": 6,
    "js": 49,
    "worlds": [
      "MAIN",
      "ISOLATED"
    ],
    "resources": 14
  },
  "manifest.firefox.json": {
    "references": 74,
    "unique": 42,
    "entries": 5,
    "js": 45,
    "worlds": [
      "MAIN"
    ],
    "resources": 14
  },
  "manifest.opera.json": {
    "references": 71,
    "unique": 37,
    "entries": 7,
    "js": 49,
    "worlds": [
      "MAIN"
    ],
    "resources": 13
  }
};

function assertBrowserManifestReferenceClosureAddendum(doc) {
  const stats = manifestReferenceClosureStats();
  assert.match(doc, /2026-10-18 Current Source And Historical Evidence Boundary/);
  assert.equal(stats.combinedUnique.size, 42);
  assert.deepEqual(stats.missing, []);
  assert.deepEqual(stats.outsideCopiedRoots, []);
  assert.equal(stats.contentScriptCssRefs, 0);
  for (const file of manifestFiles) {
    const expected = currentManifestSnapshot[file];
    assert.deepEqual(stats.perManifest.get(file), { references: expected.references, unique: expected.unique });
    assert.ok(doc.includes(`| \`${file}\` | ${expected.references} | ${expected.unique} | ${expected.entries} | ${expected.js} | ${expected.resources} |`));
  }
}

function assertBrowserManifestPermissionAndResourceValidationSnapshot(doc) {
  const stats = manifestPermissionResourceValidationStats();
  for (const file of manifestFiles) {
    const actual = stats.perManifest.get(file);
    const expected = currentManifestSnapshot[file];
    assert.deepEqual(actual.permissions, expectedManifestPermissions);
    assert.deepEqual(actual.hostPermissions, expectedManifestHostPermissions);
    assert.deepEqual(actual.optionalHostPermissions, expectedManifestOptionalHostPermissions);
    assert.deepEqual(actual.contentMatches, expectedActiveManifestMatches);
    assert.deepEqual(actual.resourceMatches, expectedResourceMatches);
    assert.deepEqual(actual.explicitWorlds, expected.worlds);
    assert.equal(actual.contentScriptEntries, expected.entries);
    assert.equal(actual.contentScriptJsRefs, expected.js);
    assert.equal(actual.webAccessibleResourceRefs, expected.resources);
    assert.equal(actual.hostOnlyNocookieGap, false);
  }
  assert.equal(stats.contentScriptCssRefs, 0);
  assert.match(doc, /source closure does not establish installed or incognito access/);
}

function assertInstalledRuntimeProvenanceSnapshot(doc) {
  assert.match(doc, /Installed Runtime Provenance Snapshot - 2026-05-27/);
  assert.match(doc, /Chrome Default Unpacked Workspace Byte Snapshot - 2026-05-27/);
  assert.match(doc, /running-tab content-script byte authority: NO-GO/);
  assert.match(doc, /Historical profile and dist observations remain dated/);
  assert.match(doc, /routine release lane does not read personal browser profiles/);
  const stats = manifestIncognitoBoundaryStats();
  assert.equal(stats.files, 4);
  assert.equal(stats.explicitIncognitoKeys, 0);
  assert.equal(stats.youtubeContentMatchFiles, 4);
  assert.equal(stats.youtubeKidsContentMatchFiles, 4);
  assert.equal(stats.hostOnlyNocookieGapFiles, 0);
}

function assertCurrentLocalDistPackageSnapshot(doc) {
  // Byte checks bind existing local packages to current source; historical
  // ZIP hashes in the document are not reinterpreted as current artifacts.
  const version = readJson('package.json').version;
  const archiveScript = `import hashlib,json,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
 rows=[item for item in archive.infolist() if not item.is_dir()]
 if len({item.filename for item in rows}) != len(rows): raise ValueError('duplicate ZIP paths')
 print(json.dumps({item.filename:hashlib.sha256(archive.read(item)).hexdigest() for item in rows}))`;
  for (const browser of distBrowserTargets) {
    const prefix = `dist/${browser}/`;
    const staged = walkFiles(`dist/${browser}`).sort();
    assert.ok(staged.length > 0, `build ${browser} before the release package lane`);
    const archivePath = `dist/filtertube-${browser}-v${version}.zip`;
    assert.ok(fs.existsSync(archivePath), `missing current archive ${archivePath}`);
    const archivedHashes = JSON.parse(execFileSync('python3', ['-c', archiveScript, archivePath], {
      encoding: 'utf8', maxBuffer: 5 * 1024 * 1024
    }));
    assert.deepEqual(Object.keys(archivedHashes).sort(), staged.map(file => file.slice(prefix.length)).sort());
    for (const file of staged) {
      const relative = file.slice(prefix.length);
      assert.equal(archivedHashes[relative], sha256(file), `${browser} ZIP/staged mismatch: ${relative}`);
      if (relative === 'manifest.json') continue;
      assert.ok(fs.existsSync(path.join(repoRoot, relative)), `unexpected staged file ${relative}`);
      assert.equal(sha256(file), sha256(relative), `${browser} stale packaged source: ${relative}; rebuild packages`);
    }
    assert.deepEqual(readJson(`${prefix}manifest.json`), readJson(`manifest.${browser}.json`));
  }
  assert.match(doc, /current ZIP, staged tree and source bytes are compared/);
  assert.match(doc, /not reproducible-build, installed-browser or physical-device proof/);
}

test('P0 release package audit documents blocked verdict and all named gates', () => {
  const doc = read(auditDocPath);
  const methodGap = read(methodGapPath);

  for (const phrase of [
    'P0 release package parity is not green',
    'release_package_parity_build_common_dirs_are_explicit',
    'release_package_parity_common_files_are_explicit',
    'release_package_parity_quarantined_css_is_packaged_but_not_manifest_loaded',
    'release_package_parity_build_has_no_committed_package_manifest',
    'release_package_parity_generated_shells_have_source_output_freshness_manifest',
    'release_package_parity_build_does_not_mutate_readme_during_package_dry_run',
    'release_package_parity_browser_manifest_validation_covers_permissions_and_resources',
    'release_package_parity_github_release_is_draft_until_all_assets_upload',
    'release_package_parity_mobile_artifacts_have_checksum_and_claim_gate',
    'release_package_parity_raw_captures_never_enter_package_contents',
    'releasePackageParity.record'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }

  assert.match(methodGap, /repo-wide lexical callables: 6315/);
  assert.match(methodGap, /files with lexical accounting: 73/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 6315/);

  assert.equal(releasePackageFamilyDocs.length, 9);
  for (const familyDocPath of releasePackageFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 73/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 6315/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 6315/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  assertInstalledRuntimeProvenanceSnapshot(doc);
  assertBrowserManifestReferenceClosureAddendum(doc);
  assertBrowserManifestPermissionAndResourceValidationSnapshot(doc);
  assertCurrentLocalDistPackageSnapshot(doc);
});

test('release_package_parity_build_common_dirs_are_explicit', () => {
  const build = read('build.js');
  const dirs = ['_locales', 'js', 'css', 'html', 'icons', 'data', 'assets'];

  assert.match(build, /const COMMON_DIRS = \['_locales', 'js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(build, /COMMON_DIRS\.forEach\(dir =>/);
  assert.match(build, /fs\.copySync\(dir, path\.join\(targetDir, dir\), \{ filter: filterFunc \}\)/);

  for (const dir of dirs) {
    assert.ok(fs.existsSync(path.join(repoRoot, dir)), `${dir} should exist`);
  }
});

test('release_package_parity_common_files_are_explicit', () => {
  const build = read('build.js');
  const files = ['README.md', 'CHANGELOG.md', 'LICENSE'];

  assert.match(build, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\]/);
  assert.match(build, /COMMON_FILES\.forEach\(file =>/);
  assert.match(build, /fs\.copySync\(file, path\.join\(targetDir, file\), \{ filter: filterFunc \}\)/);

  for (const file of files) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} should exist`);
  }
});

test('release_package_parity_quarantined_css_is_packaged_but_not_manifest_loaded', () => {
  const build = read('build.js');

  assert.match(build, /'css'/);
  for (const css of ['css/filter.css', 'css/content.css', 'css/layout.css']) {
    assert.ok(fs.existsSync(path.join(repoRoot, css)), `${css} should exist`);
  }
  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.deepEqual(contentScriptCss(manifest), [], `${manifest} should not load content CSS`);
  }
  assert.match(read('css/filter.css'), /display:\s*none\s*!important/);
});

test('release_package_parity_build_has_no_committed_package_manifest', () => {
  const build = read('build.js');

  assert.doesNotMatch(build, /\breleasePackageParity\b/);
  assert.doesNotMatch(build, /\bpackageManifest\b/);
  for (const absent of [
    'release-package-manifest.json',
    'dist/package-manifest.json',
    'release-artifacts/package-manifest.json',
    'docs/audit/FILTERTUBE_RELEASE_PACKAGE_MANIFEST.json'
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, absent)), false, `${absent} should be absent today`);
  }
});

test('release_package_parity_generated_shells_have_source_output_freshness_manifest is not satisfied today', () => {
  const build = read('build.js');
  const script = read('scripts/build-extension-ui.mjs');

  assert.match(build, /execSync\('node scripts\/build-extension-ui\.mjs'/);
  assert.match(script, /src\/extension-shell\/popup\.jsx/);
  assert.match(script, /js\/ui-shell\/popup-shell\.js/);
  assert.match(script, /src\/extension-shell\/tab-view-decor\.jsx/);
  assert.match(script, /js\/ui-shell\/tab-view-decor\.js/);

  for (const file of [
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
    'src/extension-shell/shared/runtime.js',
    'js/ui-shell/popup-shell.js',
    'js/ui-shell/tab-view-decor.js'
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} should exist`);
  }
  for (const absent of [
    'docs/audit/FILTERTUBE_UI_SHELL_FRESHNESS_MANIFEST.json',
    'release-artifacts/ui-shell-freshness.json'
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, absent)), false, `${absent} should be absent today`);
  }
});

test('release_package_parity_build_does_not_mutate_readme_during_package_dry_run is not satisfied today', () => {
  const build = read('build.js');

  assert.match(build, /await updateReadmeBadges\(VERSION\)/);
  assert.match(build, /async function updateReadmeBadges\(version\)/);
  assert.match(build, /fs\.writeFileSync\(readmePath, readme, 'utf8'\)/);
  assert.match(build, /README\.md badges updated successfully/);
  assert.match(read(auditDocPath), /Not satisfied\. `build\.js` calls `updateReadmeBadges\(\)`/);
});

test('release_package_parity_browser_manifest_validation_covers_permissions_and_resources is not satisfied today', () => {
  const build = read('build.js');

  assert.match(build, /const manifestFile = `manifest\.\$\{browser\}\.json`/);
  assert.match(build, /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);
  assert.match(build, /ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(build, /const collabDialogPath = 'js\/content\/collab_dialog\.js'/);
  assert.match(build, /const contentBridgePath = 'js\/content_bridge\.js'/);
  assert.doesNotMatch(build, /validateManifestPermissions|validateWebAccessibleResources|validateHostPermissions|validatePackagedReferences/);

  const manifests = ['manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json'].map(readJson);
  assert.ok(manifests.every(manifest => Array.isArray(manifest.permissions)));
  assert.ok(manifests.every(manifest => Array.isArray(manifest.host_permissions)));
  assert.ok(manifests.every(manifest => Array.isArray(manifest.web_accessible_resources)));
});

test('release_package_parity_github_release_new_draft_waits_for_expected_asset_names', () => {
  const build = read('build.js');
  const create = build.indexOf('createDraftGitHubRelease(githubAuth, {');
  const upload = build.indexOf('uploadGitHubReleaseAssets(githubAuth, tagName, missingAssetPaths)');
  const verify = build.indexOf('const stillMissing = releaseAssetPaths');
  const publish = build.indexOf('publishDraftGitHubRelease(githubAuth, tagName);');
  assert.ok(create >= 0 && create < upload && upload < verify && verify < publish);
  assert.match(build, /Release upload incomplete/);
  assert.match(build, /if \(createdDraft\) \{\s*publishDraftGitHubRelease/);
  assert.match(build, /'--draft'/);
  assert.match(build, /'--draft=false'/);
});

test('release_package_parity_mobile_artifacts_have_checksum_and_claim_gate is only partial today', () => {
  const build = read('build.js');

  assert.match(build, /MOBILE_ARTIFACT_FILE_RE = \/\^FilterTube-mobile-tablet-v/);
  assert.match(build, /selectLatestMobileArtifacts\(matchedSourceFiles\)/);
  assert.match(build, /const checksumPath = `\$\{targetPath\}\.sha256`/);
  assert.match(build, /sha256File\(targetPath\)/);
  assert.match(build, /dist', 'mobile'/);
  assert.doesNotMatch(build, /publicClaimManifest|releaseClaimIds|signingFingerprint|storeTrackStatus/);
});

test('release_package_parity_raw_captures_never_enter_package_contents is locally true today', () => {
  const build = read('build.js');
  const gitignore = read('.gitignore');

  assert.match(build, /const COMMON_DIRS = \['_locales', 'js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(build, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\]/);

  for (const capture of [
    'YT_MAIN.json',
    'YT_MAIN_WATCH.html',
    'YT_MAIN_next?prettyPrint.json',
    'YT_KIDS.json',
    'YTM.json',
    'YTM-DOM.html',
    'comments.json',
    'playlist.json',
    'collab.json',
    'extracted_watch_paths.txt'
  ]) {
    assert.ok(gitignore.includes(capture), `${capture} should remain ignored raw evidence`);
    assert.equal(build.includes(capture), false, `${capture} should not be a package input`);
  }
});
