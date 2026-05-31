import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('public release claim boundary audit documents blocked public-claim authority', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'current-behavior proof only',
    'implementation gate remains closed',
    'publicReleaseClaimAuthority',
    'Direct APK releases',
    'signed release APK',
    'SHA-256',
    'signing certificate fingerprint',
    'TestFlight',
    'Android TV / Fire TV'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }
});

test('downloads page exposes available browser claims with fixed store URLs', () => {
  const page = read('website/app/downloads/page.js');

  assert.match(page, /title: "Browser extension"/);
  assert.match(page, /label: "Available now"/);
  assert.match(page, /Chrome Web Store/);
  assert.match(page, /chromewebstore\.google\.com\/detail\/filtertube\/cjmdggnnpmpchholgnkfokibidbbnfgc/);
  assert.match(page, /Firefox Add-ons/);
  assert.match(page, /addons\.mozilla\.org\/en-US\/firefox\/addon\/filtertube/);
  assert.match(page, /GitHub ZIPs/);
  assert.match(page, /href: releaseHref/);
});

test('android direct apk claim points to latest release before artifact claim authority exists', () => {
  const page = read('website/app/downloads/page.js');

  assert.match(page, /title: "Android phone\/tablet"/);
  assert.match(page, /label: "Final release testing"/);
  assert.match(page, /label: "Direct APK releases"/);
  assert.match(page, /href: latestReleaseHref/);
  assert.match(page, /signed release APK can be attached/);
  assert.match(page, /SHA-256 checksum and signing fingerprint/);
  assert.match(page, /Direct APK distribution will\s+use GitHub release assets and checksums when the signed release\s+APK is attached/);
  assert.doesNotMatch(page, /\bpublicReleaseClaimAuthority\b/);
  assert.doesNotMatch(page, /\bartifactManifest\b/);
  assert.doesNotMatch(page, /\breleaseClaimIds\b/);
});

test('ios claim is status-only and does not expose public IPA install path', () => {
  const page = read('website/app/downloads/page.js');

  assert.match(page, /title: "iPhone and iPad"/);
  assert.match(page, /label: "Final release testing"/);
  assert.match(page, /TestFlight and App Store review/);
  assert.match(page, /Public IPA downloads are not the normal install path/);
  assert.match(page, /label: "iOS status"/);
  assert.match(page, /href: "#ios-status"/);
  assert.doesNotMatch(page, /href: .*\.ipa/);
});

test('tv claim remains a separate future package instead of a mobile apk claim', () => {
  const page = read('website/app/downloads/page.js');

  assert.match(page, /title: "Android TV \/ Fire TV"/);
  assert.match(page, /status: "Separate future app"/);
  assert.match(page, /not part of the current phone\/tablet APK/);
  assert.match(page, /Android TV \/ Fire TV should use a separate future package, not this mobile APK/);
});

test('release script can stage checksums but has no public claim manifest or signing fingerprint gate', () => {
  const build = read('build.js');

  assert.match(build, /MOBILE_ARTIFACT_FILE_RE = \/\^FilterTube-mobile-tablet-v/);
  assert.match(build, /selectLatestMobileArtifacts\(matchedSourceFiles\)/);
  assert.match(build, /sha256File\(targetPath\)/);
  assert.match(build, /dist', 'mobile'/);
  assert.doesNotMatch(build, /\bpublicClaimManifest\b/);
  assert.doesNotMatch(build, /\bpublicReleaseClaimAuthority\b/);
  assert.doesNotMatch(build, /\breleaseClaimIds\b/);
  assert.doesNotMatch(build, /\bapkSigningFingerprint\b/);
  assert.doesNotMatch(build, /\bapkAabPairGate\b/);
});

test('release notes align with package and browser manifest versions', () => {
  const packageJson = readJson('package.json');
  const releaseNotes = readJson('data/release_notes.json');

  assert.equal(packageJson.version, '3.3.2');
  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.equal(readJson(manifest).version, packageJson.version, `${manifest} should match package version today`);
  }

  assert.equal(releaseNotes[1].version, '3.3.2');
  assert.doesNotMatch(releaseNotes[1].headline, /Upcoming:/);
  assert.match(releaseNotes[1].summary, /included in this release/);
  assert.equal(releaseNotes[1].detailsUrl, 'https://github.com/varshneydevansh/FilterTube/releases/tag/v3.3.2');
});

test('public release and android distribution docs require direct apk proof before claim', () => {
  const publicAudit = read('docs/audit/FILTERTUBE_PUBLIC_RELEASE_SURFACE_AUDIT_2026-05-18.md');
  const androidDistribution = read('docs/ANDROID_PUBLIC_DISTRIBUTION.md');

  assert.match(publicAudit, /Direct APK gate: a GitHub release must contain the signed APK, SHA-256 file,\s+and signing fingerprint/);
  assert.match(androidDistribution, /Direct APK safety checklist/);
  assert.match(androidDistribution, /Build a signed release APK, not the Play Console developer-verification APK/);
  assert.match(androidDistribution, /Attach the generated `\.sha256` file/);
  assert.match(androidDistribution, /Publish the signing certificate fingerprint/);
  assert.match(androidDistribution, /Confirm the APK package is `com\.filtertube\.app`/);
  assert.match(androidDistribution, /Do not publish `UPLOAD_THIS_TO_PLAY_CONSOLE_FOR_PACKAGE_VERIFICATION\.apk`/);
});

test('product source has no committed public release claim authority implementation yet', () => {
  const sourceFiles = [
    'build.js',
    'package.json',
    'data/release_notes.json',
    'website/app/downloads/page.js',
    'website/app/privacy/page.js',
    'website/app/android/page.js',
    'website/app/ios/page.js',
    'website/app/ipados/page.js'
  ];

  const combined = sourceFiles
    .filter((file) => fs.existsSync(path.join(repoRoot, file)))
    .map((file) => read(file))
    .join('\n');

  assert.doesNotMatch(combined, /\bpublicReleaseClaimAuthority\b/);
  assert.doesNotMatch(combined, /\bpublicClaimManifest\b/);
  assert.doesNotMatch(combined, /\breleaseClaimIds\b/);
});
