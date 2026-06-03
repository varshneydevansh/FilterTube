import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const chromeDefaultProfileRoot = '/Users/devanshvarshney/Library/Application Support/Google/Chrome/Default';
const chromeLiveSpaProfileRoot = '/private/tmp/filtertube-live-spa-chrome-profile/Default';
const chromeExtensionId = 'gkgjigdfdccckblmglboobikfcpeelio';
const manifestFiles = ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json'];
const distBrowserTargets = ['chrome', 'firefox', 'opera'];
const packageCopiedDirectoryRoots = ['js', 'css', 'html', 'icons', 'data', 'assets'];
const expectedManifestPermissions = ['storage', 'activeTab', 'scripting', 'tabs', 'downloads'];
const expectedManifestHostPermissions = [
  '*://*.youtube.com/*',
  '*://*.youtube-nocookie.com/*',
  '*://*.youtubekids.com/*'
];
const expectedActiveManifestMatches = ['*://*.youtube.com/*', '*://*.youtubekids.com/*'];
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

function readJsonAbs(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
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

function chromeDefaultUnpackedWorkspaceByteStats() {
  const preferences = readJsonAbs(path.join(chromeDefaultProfileRoot, 'Preferences'));
  const securePreferences = readJsonAbs(path.join(chromeDefaultProfileRoot, 'Secure Preferences'));
  const preferencesSetting = preferences.extensions?.settings?.[chromeExtensionId] || null;
  const secureSetting = securePreferences.extensions?.settings?.[chromeExtensionId] || null;
  const activePermissions = secureSetting?.active_permissions || {};
  const grantedPermissions = secureSetting?.granted_permissions || {};
  const localExtensionSettingsPath = path.join(chromeDefaultProfileRoot, 'Local Extension Settings', chromeExtensionId);
  const packedExtensionPath = path.join(chromeDefaultProfileRoot, 'Extensions', chromeExtensionId);
  const contentBridge = read('js/content_bridge.js');

  return {
    securePath: secureSetting?.path || '',
    pathMatchesWorkspace: secureSetting?.path === repoRoot,
    preferencesSettingPresent: !!preferencesSetting,
    secureSettingPresent: !!secureSetting,
    location: secureSetting?.location,
    fromWebstore: secureSetting?.from_webstore,
    wasInstalledByDefault: secureSetting?.was_installed_by_default,
    disableReasons: secureSetting?.disable_reasons || [],
    withholdingPermissions: secureSetting?.withholding_permissions,
    activeApiPermissions: [...(activePermissions.api || [])].sort(),
    grantedApiPermissions: [...(grantedPermissions.api || [])].sort(),
    activeExplicitHosts: [...(activePermissions.explicit_host || [])].sort(),
    grantedExplicitHosts: [...(grantedPermissions.explicit_host || [])].sort(),
    activeScriptableHosts: [...(activePermissions.scriptable_host || [])].sort(),
    grantedScriptableHosts: [...(grantedPermissions.scriptable_host || [])].sort(),
    version: secureSetting?.manifest?.version || secureSetting?.service_worker_registration_info?.version || '',
    localExtensionSettingsExists: fs.existsSync(localExtensionSettingsPath),
    packedExtensionDirExists: fs.existsSync(packedExtensionPath),
    manifestHash: sha256('manifest.json'),
    packageHash: sha256('package.json'),
    contentBridgeHash: sha256('js/content_bridge.js'),
    ampersandTopicFixTokenPresent: contentBridge.includes('const tokens = normalizedText.split(/\\s*(?:,|\\band\\b)\\s*/i);')
  };
}

function chromeLiveSpaProfileStatsIfPresent() {
  const securePreferencesPath = path.join(chromeLiveSpaProfileRoot, 'Secure Preferences');
  if (!fs.existsSync(securePreferencesPath)) return null;
  const securePreferences = readJsonAbs(securePreferencesPath);
  const secureSetting = securePreferences.extensions?.settings?.[chromeExtensionId] || null;
  return {
    settingPresent: !!secureSetting,
    path: secureSetting?.path || '',
    location: secureSetting?.location
  };
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
      if (!fs.existsSync(path.join(repoRoot, ref))) missing.push(`${file}:${ref}`);
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

function currentLocalDistPackageSnapshotStats() {
  const distFiles = walkFiles('dist').sort();
  const zipFiles = distFiles.filter(file => file.endsWith('.zip'));
  const browserStats = new Map();
  const groupCountsByBrowser = new Map();

  for (const browser of distBrowserTargets) {
    const browserPrefix = `dist/${browser}/`;
    const browserFiles = distFiles.filter(file => file.startsWith(browserPrefix));
    const manifestPath = `dist/${browser}/manifest.json`;
    const manifest = readJson(manifestPath);
    const contentScripts = manifest.content_scripts || [];
    const webAccessibleResources = manifest.web_accessible_resources || [];
    const sourceBackedFiles = [];
    const byteIdenticalSourceBackedFiles = [];
    const groupCounts = new Map();

    for (const file of browserFiles) {
      const stagedRelativePath = file.slice(browserPrefix.length);
      const firstSegment = stagedRelativePath.includes('/')
        ? stagedRelativePath.split('/')[0]
        : stagedRelativePath === 'manifest.json'
          ? 'manifest'
          : 'top-level-common';
      groupCounts.set(firstSegment, (groupCounts.get(firstSegment) || 0) + 1);

      if (stagedRelativePath === 'manifest.json') continue;
      if (fs.existsSync(path.join(repoRoot, stagedRelativePath))) {
        sourceBackedFiles.push(file);
        if (sha256(file) === sha256(stagedRelativePath)) {
          byteIdenticalSourceBackedFiles.push(file);
        }
      }
    }

    groupCountsByBrowser.set(browser, Object.fromEntries([...groupCounts.entries()].sort()));
    browserStats.set(browser, {
      stagedFiles: browserFiles.length,
      manifestBytes: fileSize(manifestPath),
      manifestSha256: sha256(manifestPath),
      version: manifest.version,
      contentScriptEntries: contentScripts.length,
      contentScriptJsRefs: contentScripts.flatMap(script => script.js || []).length,
      webAccessibleResourceRefs: webAccessibleResources.flatMap(resource => resource.resources || []).length,
      sourceBackedFiles: sourceBackedFiles.length,
      byteIdenticalSourceBackedFiles: byteIdenticalSourceBackedFiles.length,
      zipPath: `dist/filtertube-${browser}-v3.3.2.zip`,
      zipBytes: fileSize(`dist/filtertube-${browser}-v3.3.2.zip`),
      zipSha256: sha256(`dist/filtertube-${browser}-v3.3.2.zip`)
    });
  }

  return {
    distFiles,
    zipFiles,
    browserStats,
    groupCountsByBrowser
  };
}

function assertBrowserManifestReferenceClosureAddendum(doc) {
  const stats = manifestReferenceClosureStats();
  const expected = new Map([
    ['manifest.json', { references: 29, unique: 24 }],
    ['manifest.chrome.json', { references: 29, unique: 24 }],
    ['manifest.firefox.json', { references: 29, unique: 24 }],
    ['manifest.opera.json', { references: 28, unique: 23 }]
  ]);

  assert.match(doc, /Browser Manifest Package Reference Closure Addendum - 2026-05-27/);
  assert.match(doc, /combined unique referenced paths across browser manifests: 24/);
  assert.match(doc, /unresolved manifest file references: 0/);
  assert.match(doc, /manifest referenced roots outside COMMON_DIRS: 0/);
  assert.match(doc, /manifest content-script CSS references: 0/);
  assert.match(doc, /build-time manifest reference validation: absent/);
  assert.match(doc, /ASCII boundary:/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /Release package parity authority remains NO-GO/);

  assert.deepEqual([...stats.perManifest.keys()], manifestFiles);
  for (const [file, value] of expected) {
    assert.deepEqual(stats.perManifest.get(file), value, `${file} manifest reference stats drifted`);
    assert.ok(
      doc.includes(`| \`${file}\` | ${value.references} | ${value.unique} | 0 |`),
      `${file} manifest reference row missing from doc`
    );
  }
  assert.equal(stats.combinedUnique.size, 24);
  assert.deepEqual(stats.missing, []);
  assert.deepEqual(stats.outsideCopiedRoots, []);
  assert.equal(stats.contentScriptCssRefs, 0);

  const referencedRoots = [...new Set([...stats.combinedUnique].map(ref => ref.split('/')[0]))].sort();
  assert.deepEqual(referencedRoots, ['html', 'icons', 'js']);
  assert.match(read('build.js'), /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.doesNotMatch(read('build.js'), /validatePackagedReferences|releasePackageParity\.record|manifestReferenceClosureReport/);
}

function assertBrowserManifestPermissionAndResourceValidationSnapshot(doc) {
  const stats = manifestPermissionResourceValidationStats();
  const expected = new Map([
    ['manifest.json', { contentScriptEntries: 2, contentScriptJsRefs: 15, explicitWorlds: ['MAIN', 'ISOLATED'], webAccessibleResourceRefs: 5 }],
    ['manifest.chrome.json', { contentScriptEntries: 2, contentScriptJsRefs: 15, explicitWorlds: ['MAIN', 'ISOLATED'], webAccessibleResourceRefs: 5 }],
    ['manifest.firefox.json', { contentScriptEntries: 1, contentScriptJsRefs: 14, explicitWorlds: [], webAccessibleResourceRefs: 5 }],
    ['manifest.opera.json', { contentScriptEntries: 2, contentScriptJsRefs: 15, explicitWorlds: [], webAccessibleResourceRefs: 4 }]
  ]);

  assert.match(doc, /Browser Manifest Permission And Resource Validation Snapshot - 2026-05-27/);
  assert.match(doc, /exact permission list per manifest: storage, activeTab, scripting, tabs, downloads/);
  assert.match(doc, /exact host permission list per manifest: youtube\.com, youtube-nocookie\.com, youtubekids\.com/);
  assert.match(doc, /content-script active match hosts per manifest: youtube\.com, youtubekids\.com/);
  assert.match(doc, /web-accessible-resource active match hosts per manifest: youtube\.com, youtubekids\.com/);
  assert.match(doc, /host-only youtube-nocookie gap manifests: 4/);
  assert.match(doc, /content-script CSS references: 0/);
  assert.match(doc, /build-time permission\/resource\/world validation: absent/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /Release package parity authority remains NO-GO/);

  for (const [file, expectedStats] of expected) {
    const actual = stats.perManifest.get(file);
    assert.deepEqual(actual.permissions, expectedManifestPermissions, `${file} permissions drifted`);
    assert.deepEqual(actual.hostPermissions, expectedManifestHostPermissions, `${file} host permissions drifted`);
    assert.deepEqual(actual.contentMatches, expectedActiveManifestMatches, `${file} content matches drifted`);
    assert.deepEqual(actual.resourceMatches, expectedActiveManifestMatches, `${file} resource matches drifted`);
    assert.equal(actual.hostOnlyNocookieGap, true, `${file} youtube-nocookie host-only gap drifted`);
    assert.deepEqual(
      {
        contentScriptEntries: actual.contentScriptEntries,
        contentScriptJsRefs: actual.contentScriptJsRefs,
        explicitWorlds: actual.explicitWorlds,
        webAccessibleResourceRefs: actual.webAccessibleResourceRefs
      },
      expectedStats,
      `${file} manifest validation stats drifted`
    );

    const worlds = expectedStats.explicitWorlds.length ? expectedStats.explicitWorlds.map(world => `\`${world}\``).join(', ') : 'none';
    assert.ok(
      doc.includes(`| \`${file}\` | ${expectedStats.contentScriptEntries} | ${expectedStats.contentScriptJsRefs} | ${worlds} | ${expectedStats.webAccessibleResourceRefs} | yes |`),
      `${file} permission/resource row missing from doc`
    );
  }

  assert.equal(stats.contentScriptCssRefs, 0);
  assert.doesNotMatch(
    read('build.js'),
    /validateManifestPermissions|validateHostPermissions|validateWebAccessibleResources|validateContentScriptWorlds|manifestPermissionBuildValidationReport/
  );
  assert.match(read('build.js'), /ensureCollabDialogScriptOrder\(manifestJSON\)/);
}

function assertCurrentLocalDistPackageSnapshot(doc) {
  const stats = currentLocalDistPackageSnapshotStats();
  const expectedGroupCounts = {
    assets: 3,
    css: 8,
    data: 1,
    html: 3,
    icons: 7,
    js: 33,
    manifest: 1,
    'top-level-common': 3
  };
  const expectedBrowserStats = new Map([
    ['chrome', {
      manifestBytes: 2513,
      manifestSha256: '282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734',
      contentScriptEntries: 2,
      contentScriptJsRefs: 15,
      webAccessibleResourceRefs: 5,
      zipBytes: 8688743,
      zipSha256: '844a3ef1530ed1787e0911d43707e2b5ab687e83930edf7332c534c69e9ff898'
    }],
    ['firefox', {
      manifestBytes: 2603,
      manifestSha256: 'a1773c9e0acc1c2029cb6aef4757a282aa0ec8d89759be65ea975ff237d00bb0',
      contentScriptEntries: 1,
      contentScriptJsRefs: 14,
      webAccessibleResourceRefs: 5,
      zipBytes: 8688802,
      zipSha256: 'b39728fdec2292f7d54c839a383dae44142357ac0b8a0ffe056ee19078c51217'
    }],
    ['opera', {
      manifestBytes: 2518,
      manifestSha256: '0f0b77df312bf8b45a40e652bd7fc4ee4af270945b4e38e9353ebfdc1caf1e2b',
      contentScriptEntries: 2,
      contentScriptJsRefs: 15,
      webAccessibleResourceRefs: 4,
      zipBytes: 8688745,
      zipSha256: 'd1a70a71f376cbfd19670563b2e384f252879d10a62b8972768cebd63479fae1'
    }]
  ]);

  assert.match(doc, /Current Local Dist Package Snapshot - 2026-05-27/);
  assert.match(doc, /dist snapshot source: existing ignored local dist tree/);
  assert.match(doc, /browser staged directories: 3/);
  assert.match(doc, /browser staged files per directory: 59/);
  assert.match(doc, /dist zip artifacts: 3/);
  assert.match(doc, /total dist files including zips: 180/);
  assert.match(doc, /source-backed staged files per browser excluding manifest: 58/);
  assert.match(doc, /byte-identical source-backed staged files per browser excluding manifest: 54/);
  assert.match(doc, /committed package manifest: absent/);
  assert.match(doc, /zip checksum manifest: absent/);
  assert.match(doc, /reproducible build proof: absent/);
  assert.match(doc, /runtime behavior changed by this snapshot: no/);
  assert.match(doc, /ASCII boundary:/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /Release package parity authority remains NO-GO/);
  assert.match(doc, /local dist snapshot proof: PARTIAL/);
  assert.match(doc, /source-backed staged byte parity: partial/);
  assert.match(doc, /zip checksum snapshot: yes/);
  assert.match(doc, /committed release package manifest authority: NO-GO/);
  assert.match(doc, /reproducible package build authority: NO-GO/);
  assert.match(doc, /loaded-browser package\/runtime parity authority: NO-GO/);

  assert.equal(stats.distFiles.length, 180);
  assert.deepEqual(stats.zipFiles, [
    'dist/filtertube-chrome-v3.3.2.zip',
    'dist/filtertube-firefox-v3.3.2.zip',
    'dist/filtertube-opera-v3.3.2.zip'
  ]);

  for (const browser of distBrowserTargets) {
    assert.deepEqual(stats.groupCountsByBrowser.get(browser), expectedGroupCounts);
    const actual = stats.browserStats.get(browser);
    const expected = expectedBrowserStats.get(browser);
    assert.equal(actual.stagedFiles, 59);
    assert.equal(actual.version, '3.3.2');
    assert.equal(actual.sourceBackedFiles, 58);
    assert.equal(actual.byteIdenticalSourceBackedFiles, 54);
    assert.equal(actual.manifestBytes, expected.manifestBytes);
    assert.equal(actual.manifestSha256, expected.manifestSha256);
    assert.equal(actual.contentScriptEntries, expected.contentScriptEntries);
    assert.equal(actual.contentScriptJsRefs, expected.contentScriptJsRefs);
    assert.equal(actual.webAccessibleResourceRefs, expected.webAccessibleResourceRefs);
    assert.equal(actual.zipBytes, expected.zipBytes);
    assert.equal(actual.zipSha256, expected.zipSha256);
    assert.ok(
      doc.includes(`| \`${browser}\` | 59 | ${expected.manifestBytes} | \`${expected.manifestSha256}\` | \`3.3.2\` | ${expected.contentScriptEntries} | ${expected.contentScriptJsRefs} | ${expected.webAccessibleResourceRefs} | ${expected.zipBytes} | \`${expected.zipSha256}\` |`),
      `${browser} dist snapshot row missing from doc`
    );
  }

  assert.doesNotMatch(read('build.js'), /releasePackageParity|packageManifest|reproducibleBuildReport|zipContentAttestation/);
}

function assertInstalledRuntimeProvenanceSnapshot(doc) {
  const incognitoStats = manifestIncognitoBoundaryStats();

  assert.match(doc, /Installed Runtime Provenance Snapshot - 2026-05-27/);
  assert.match(doc, /workspace source tree/);
  assert.match(doc, /installed extension id \+ loaded path \+ manifest version \+ source hash/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /Installed Chrome runtime/);
  assert.match(doc, /\| Package command\/version surface \| `package\.json:3-18` \|/);
  assert.match(doc, /\| Default Chrome manifest load order \| `manifest\.json:1-88`, `manifest\.json:42-56` \|/);
  assert.match(doc, /\| Build package roots and manifest copy \| `build\.js:29-33`, `build\.js:82-158` \|/);
  assert.match(doc, /\| Manifest order repair \| `build\.js:161-181` \|/);
  assert.match(doc, /\| ZIP\/release output \| `build\.js:183-192`, `build\.js:644-700` \|/);
  assert.match(doc, /\| Current Topic ampersand and bare-`and` source proof \| `js\/content_bridge\.js:2759-2814`, `js\/content_bridge\.js:4784-4812`, `js\/content_bridge\.js:4902-4928`, `tests\/runtime\/content-bridge-collaborator-identity-promotion-handoff-current-behavior\.test\.mjs:510-544` \|/);
  assert.match(doc, /Kully B & Gussy G - Topic/);
  assert.match(doc, /installed extension provenance authority: NO-GO/);
  assert.match(doc, /workspace-to-loaded-runtime parity authority: NO-GO/);
  assert.match(doc, /reload\/package attestation gate: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /Chrome Default Profile Secure Preferences Probe - 2026-05-27/);
  assert.match(doc, /"extension_id": "gkgjigdfdccckblmglboobikfcpeelio"/);
  assert.match(doc, /"preferences_settings_object": "absent"/);
  assert.match(doc, /"preferences_pinned_extension": "present"/);
  assert.match(doc, /"secure_preferences_settings_object": "present"/);
  assert.match(doc, /"secure_preferences_path": "\$WORKSPACE_ROOT"/);
  assert.match(doc, /"service_worker_registration_info": \{\s+"version": "3\.3\.2"\s+\}/);
  assert.match(doc, /"withholding_permissions": false/);
  assert.match(doc, /Default\/Secure Preferences[\s\S]*proves Chrome is configured to load it from \$WORKSPACE_ROOT/);
  assert.match(doc, /incognito allow\/deny proof from the active incognito profile\/session/);
  assert.match(doc, /installed extension path proof: PARTIAL/);
  assert.match(doc, /running-tab content-script byte authority: NO-GO/);
  assert.match(doc, /incognito runtime availability authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this probe: no/);
  assert.match(doc, /Chrome Profile And Incognito Availability Boundary - 2026-05-27/);
  assert.match(doc, /Default\/Local Extension Settings\/<extension id>\/LOG/);
  assert.match(doc, /positive incognito-enabled flag under the extension settings object/);
  assert.match(doc, /"incognito_content_settings": \[\]/);
  assert.match(doc, /"incognito_preferences": \{\}/);
  assert.match(doc, /"regular_only_preferences": \{\}/);
  assert.match(doc, /"explicit_incognito_enabled_flag": "absent"/);
  assert.match(doc, /must use the same visible Chrome profile\/window where the extension icon/);
  assert.match(doc, /must reload YouTube tabs after source edits or extension reloads/);
  assert.match(doc, /Default profile path evidence: PARTIAL/);
  assert.match(doc, /alternate Chrome profile availability authority: NO-GO/);
  assert.match(doc, /active-tab content-script parity authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this boundary: no/);

  assert.equal(incognitoStats.files, 4);
  assert.equal(incognitoStats.explicitIncognitoKeys, 0);
  assert.equal(incognitoStats.youtubeHostPermissionFiles, 4);
  assert.equal(incognitoStats.youtubeContentMatchFiles, 4);
  assert.equal(incognitoStats.youtubeKidsContentMatchFiles, 4);
  assert.equal(incognitoStats.hostOnlyNocookieGapFiles, 4);
  for (const row of incognitoStats.rows) {
    assert.equal(row.hasExplicitIncognitoKey, false, `${row.file} should not declare incognito`);
    assert.equal(row.hasYoutubeContentMatch, true, `${row.file} should match YouTube`);
    assert.equal(row.hasYoutubeKidsContentMatch, true, `${row.file} should match YouTube Kids`);
    assert.equal(row.hostOnlyNocookieGap, true, `${row.file} should keep NoCookie host-only gap`);
  }

  assert.match(doc, /Manifest Incognito Static Boundary - 2026-05-30/);
  assert.match(doc, /manifest files scanned: 4/);
  assert.match(doc, /manifest files with explicit incognito key: 0/);
  assert.match(doc, /manifest files with YouTube host permissions: 4/);
  assert.match(doc, /manifest files with YouTube content-script matches: 4/);
  assert.match(doc, /manifest files with YouTube Kids content-script matches: 4/);
  assert.match(doc, /manifest files with youtube-nocookie host permission but no content-script match: 4/);
  for (const file of manifestFiles) {
    assert.match(doc, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| absent \\| YouTube, YouTube Kids \\| yes \\|`));
  }
  assert.match(doc, /source manifest incognito declaration\s+-> absent across all browser manifests/);
  assert.match(doc, /cannot prove that a private\/incognito browser session loaded FilterTube/);
  assert.match(doc, /must prove the active incognito window has extension runtime access/);
  assert.match(doc, /Keep incognito runtime authority NO-GO/);
  assert.match(doc, /manifest incognito declaration proof: absent/);
  assert.match(doc, /source manifest incognito runtime authority: NO-GO/);
  assert.match(doc, /active incognito session runtime authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this boundary: no/);

  assert.match(doc, /Chrome Default Unpacked Workspace Byte Snapshot - 2026-05-27/);
  assert.match(doc, /Chrome Default Secure Preferences extension id: gkgjigdfdccckblmglboobikfcpeelio/);
  assert.match(doc, /secure preferences extension path: \/Users\/devanshvarshney\/FilterTube/);
  assert.match(doc, /secure preferences path matches workspace root: yes/);
  assert.match(doc, /Default\/Preferences extension settings object present: no/);
  assert.match(doc, /Default\/Secure Preferences extension settings object present: yes/);
  assert.match(doc, /stored extension\/service-worker version: 3\.3\.2/);
  assert.match(doc, /Default Local Extension Settings directory exists: yes/);
  assert.match(doc, /Default packed Extensions directory for this id exists: no/);
  assert.match(doc, /workspace content_bridge ampersand Topic fix token present: yes/);
  assert.match(doc, /PARTIAL installed-profile path and byte snapshot/);
  assert.match(doc, /Running-tab parity remains NO-GO/);
  assert.match(doc, /Default profile unpacked workspace path proof: yes/);
  assert.match(doc, /workspace byte hash snapshot: yes/);
  assert.match(doc, /extension reload timestamp authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /Default Installed Permission Parity Crosscheck - 2026-05-30/);
  assert.match(doc, /installed active API permissions: activeTab, downloads, scripting, storage, tabs/);
  assert.match(doc, /installed granted API permissions: activeTab, downloads, scripting, storage, tabs/);
  assert.match(doc, /installed active explicit hosts: youtube-nocookie\.com, youtube\.com, youtubekids\.com/);
  assert.match(doc, /installed granted explicit hosts: youtube-nocookie\.com, youtube\.com, youtubekids\.com/);
  assert.match(doc, /installed active scriptable hosts: youtube\.com, youtubekids\.com/);
  assert.match(doc, /installed granted scriptable hosts: youtube\.com, youtubekids\.com/);
  assert.match(doc, /installed scriptable youtube-nocookie gap: yes/);
  assert.match(doc, /installed permission parity authority: PARTIAL/);
  assert.match(doc, /active-tab permission use proof: NO-GO/);
  assert.match(doc, /runtime behavior changed by this crosscheck: no/);
  assert.match(doc, /Live Chrome Process Attestation Boundary - 2026-05-27/);
  assert.match(doc, /Default Chrome explicit --user-data-dir flag observed: no/);
  assert.match(doc, /Default Chrome --remote-debugging-port flag observed: no/);
  assert.match(doc, /Default profile DevToolsActivePort file observed: absent/);
  assert.match(doc, /automation Chrome process observed: \/Applications\/Google Chrome\.app\/Contents\/MacOS\/Google Chrome --user-data-dir=\/private\/tmp\/filtertube-live-spa-chrome-profile --remote-debugging-port=9222 --load-extension=\/Users\/devanshvarshney\/FilterTube/);
  assert.match(doc, /automation profile extension id: gkgjigdfdccckblmglboobikfcpeelio/);
  assert.match(doc, /automation profile extension path: \/Users\/devanshvarshney\/FilterTube/);
  assert.match(doc, /automation profile extension location: 4/);
  assert.match(doc, /automation CDP \/json\/version Browser: Chrome\/148\.0\.7778\.179/);
  assert.match(doc, /automation CDP \/json\/version Protocol-Version: 1\.3/);
  assert.match(doc, /automation CDP webSocketDebuggerUrl present: yes/);
  assert.match(doc, /automation CDP \/json\/list target count observed: 0/);
  assert.match(doc, /visible Default Chrome CDP target list authority: NO-GO/);
  assert.match(doc, /visible YouTube tab content-script byte parity authority: NO-GO/);
  assert.match(doc, /visible YouTube tab extension reload timestamp authority: NO-GO/);
  assert.match(doc, /Not the visible Default profile session used for manual lag reports/);
  assert.match(doc, /Automation proof cannot replace visible-tab proof/);
  assert.match(doc, /runtime behavior changed by this boundary: no/);

  assert.match(read('package.json'), /"version": "3\.3\.2"/);
  assert.match(read('package.json'), /"build:chrome": "node build\.js chrome"/);
  assert.match(read('manifest.json'), /"version": "3\.3\.2"/);
  assert.match(read('manifest.json'), /"js\/content\/collab_dialog\.js"[\s\S]*"js\/content_bridge\.js"/);
  assert.equal(read('manifest.json'), read('manifest.chrome.json'));
  assert.match(read('build.js'), /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(read('build.js'), /ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(read('build.js'), /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);
  assert.match(read('build.js'), /const zipName = `filtertube-\$\{browser\}-v\$\{version\}\.zip`/);
  assert.match(read('build.js'), /fs\.writeFileSync\(readmePath, readme, 'utf8'\)/);
  assert.ok(read('js/content_bridge.js').includes('const tokens = normalizedText.split(/\\s*(?:,|\\band\\b)\\s*/i);'));
  assert.match(read('tests/runtime/content-bridge-collaborator-identity-promotion-handoff-current-behavior.test.mjs'), /watch-like collaboration warmup does not split ampersand Topic bylines/);

  const chromeStats = chromeDefaultUnpackedWorkspaceByteStats();
  assert.equal(chromeStats.securePath, repoRoot);
  assert.equal(chromeStats.pathMatchesWorkspace, true);
  assert.equal(chromeStats.preferencesSettingPresent, false);
  assert.equal(chromeStats.secureSettingPresent, true);
  assert.equal(chromeStats.location, 4);
  assert.equal(chromeStats.fromWebstore, false);
  assert.equal(chromeStats.wasInstalledByDefault, false);
  assert.deepEqual(chromeStats.disableReasons, []);
  assert.equal(chromeStats.withholdingPermissions, false);
  assert.deepEqual(chromeStats.activeApiPermissions, [...expectedManifestPermissions].sort());
  assert.deepEqual(chromeStats.grantedApiPermissions, [...expectedManifestPermissions].sort());
  assert.deepEqual(chromeStats.activeExplicitHosts, [...expectedManifestHostPermissions].sort());
  assert.deepEqual(chromeStats.grantedExplicitHosts, [...expectedManifestHostPermissions].sort());
  assert.deepEqual(chromeStats.activeScriptableHosts, [...expectedActiveManifestMatches].sort());
  assert.deepEqual(chromeStats.grantedScriptableHosts, [...expectedActiveManifestMatches].sort());
  assert.equal(chromeStats.version, '3.3.2');
  assert.equal(chromeStats.localExtensionSettingsExists, true);
  assert.equal(chromeStats.packedExtensionDirExists, false);
  assert.equal(chromeStats.ampersandTopicFixTokenPresent, true);
  assert.ok(doc.includes(`workspace manifest.json sha256: ${chromeStats.manifestHash}`));
  assert.ok(doc.includes(`workspace package.json sha256: ${chromeStats.packageHash}`));
  assert.ok(doc.includes(`workspace js/content_bridge.js sha256: ${chromeStats.contentBridgeHash}`));

  const liveSpaProfileStats = chromeLiveSpaProfileStatsIfPresent();
  if (liveSpaProfileStats) {
    assert.equal(liveSpaProfileStats.settingPresent, true);
    assert.equal(liveSpaProfileStats.path, repoRoot);
    assert.equal(liveSpaProfileStats.location, 4);
  }

  const productRuntime = [
    'manifest.json',
    'manifest.chrome.json',
    'build.js',
    'package.json',
    'js/content_bridge.js'
  ].map(read).join('\n');
  for (const missing of [
    'installedRuntimeSourceAttestation',
    'loadedExtensionSourceHash',
    'workspaceToLoadedRuntimeParityReport',
    'reloadPackageAttestationGate'
  ]) {
    assert.equal(productRuntime.includes(missing), false, `${missing} should not exist in product runtime today`);
  }
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

  assert.match(methodGap, /repo-wide lexical callables: 5701/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5701/);

  assert.equal(releasePackageFamilyDocs.length, 9);
  for (const familyDocPath of releasePackageFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5701/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5701/);
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
  const dirs = ['js', 'css', 'html', 'icons', 'data', 'assets'];

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
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

test('release_package_parity_github_release_is_draft_until_all_assets_upload is not satisfied today', () => {
  const build = read('build.js');
  const createIndex = build.indexOf('const release = await createGitHubRelease');
  const uploadIndex = build.indexOf('for (const assetPath of releaseAssetPaths)');

  assert.notEqual(createIndex, -1);
  assert.notEqual(uploadIndex, -1);
  assert.ok(createIndex < uploadIndex, 'release creation happens before asset upload loop');
  assert.match(build, /draft:\s*false/);
  assert.match(build, /prerelease:\s*false/);
  assert.doesNotMatch(build, /draft:\s*true/);
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

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
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
