import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function firstReleaseNoteEntry() {
  const entries = readJson('data/release_notes.json');
  return entries.find(entry => entry && typeof entry.version === 'string');
}

test('extension package and browser manifest versions currently match', () => {
  const packageVersion = readJson('package.json').version;
  const manifestFiles = ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json'];

  assert.equal(packageVersion, '3.3.2');
  for (const file of manifestFiles) {
    assert.equal(readJson(file).version, packageVersion, `${file} should match package version`);
  }
});

test('release notes now align with the packaged extension version', () => {
  const packageVersion = readJson('package.json').version;
  const firstEntry = firstReleaseNoteEntry();

  assert.equal(packageVersion, '3.3.2');
  assert.equal(firstEntry.version, packageVersion);
  assert.doesNotMatch(firstEntry.headline, /Upcoming:/);
  assert.equal(firstEntry.detailsUrl, 'https://github.com/varshneydevansh/FilterTube/releases/tag/v3.3.2');
});

test('website analytics are website-only in code and privacy copy', () => {
  const layout = read('website/app/layout.js');
  const privacy = read('website/app/privacy/page.js');

  assert.match(layout, /@vercel\/analytics\/next/);
  assert.match(layout, /<Analytics \/>/);
  assert.match(privacy, /Vercel Web Analytics is used only on filtertube\.in/);
  assert.match(privacy, /It is not included in the browser extension or native apps/);
  assert.match(privacy, /website page views only/);
});

test('README privacy language is now scoped to local-first extension runtime', () => {
  const readme = read('README.md');

  assert.doesNotMatch(readme, /No data leaves your browser\. No analytics\. No tracking\./);
  assert.doesNotMatch(readme, /FilterTube does not talk to any servers other than YouTube/);
  assert.match(readme, /Extension rules and settings stay in browser storage/);
  assert.match(readme, /does not run a FilterTube account service, extension analytics, or ad-tracking profile/);
  assert.match(readme, /YouTube and YouTube Kids pages still load their normal services/);
  assert.match(readme, /weak identity targets may use bounded YouTube resolver requests/);
  assert.match(readme, /Nanah Device Trust & Sync/);
});

test('downloads page exposes direct APK CTA before an artifact manifest gate exists', () => {
  const downloads = read('website/app/downloads/page.js');

  assert.match(downloads, /const latestReleaseHref = `\$\{githubHref\}\/releases\/latest`/);
  assert.match(downloads, /label: "Direct APK releases"/);
  assert.match(downloads, /href: latestReleaseHref/);
  assert.match(downloads, /signed release APK can be attached/);
  assert.equal(fs.existsSync(path.join(repoRoot, 'release-artifacts/manifest.json')), false);
});

test('build script can stage mobile artifacts with sha256 but interactive release publishing is prompt-driven', () => {
  const build = read('build.js');

  assert.match(build, /MOBILE_ARTIFACT_FILE_RE/);
  assert.match(build, /FilterTube-mobile-tablet-v/);
  assert.match(build, /fs\.writeFileSync\(checksumPath, `\$\{sha256File\(targetPath\)\}  \$\{fileName\}\\n`/);
  assert.match(build, /Non-interactive terminal detected; skipping release prompt/);
  assert.match(build, /Publish GitHub release v\$\{version\}\?/);
});

test('build script currently mutates README badges as part of normal build', () => {
  const build = read('build.js');

  assert.match(build, /Updating README badges with latest stats/);
  assert.match(build, /await updateReadmeBadges\(VERSION\)/);
  assert.match(build, /fs\.writeFileSync\(readmePath, readme, 'utf8'\)/);
});

test('release publishing currently creates a public release before asset uploads complete', () => {
  const build = read('build.js');
  const publishBlock = build.slice(
    build.indexOf('async function maybePromptRelease'),
    build.indexOf('function extractLatestChangelogEntry')
  );
  const createReleaseBlock = build.slice(
    build.indexOf('function createGitHubRelease'),
    build.indexOf('function uploadReleaseAsset')
  );

  assert.ok(publishBlock.indexOf('await createGitHubRelease') < publishBlock.indexOf('await uploadReleaseAsset'));
  assert.match(createReleaseBlock, /draft:\s*false/);
  assert.match(createReleaseBlock, /prerelease:\s*false/);
});

test('website home and browser-logo surfaces currently carry public performance and remote-request risks', () => {
  const home = read('website/app/page.js');
  const heroVideo = read('website/components/hero-video.js');
  const routeContent = read('website/components/route-content.js');
  const logoRail = read('website/components/browser-logo-rail.js');

  assert.match(home, /import \{ HeroVideo \}/);
  assert.match(home, /<HeroVideo src=\{heroVideoUrl\} \/>/);
  assert.match(heroVideo, /<video/);
  assert.match(heroVideo, /preload="metadata"/);
  assert.match(heroVideo, /IntersectionObserver/);
  assert.match(heroVideo, /prefers-reduced-motion: reduce/);
  assert.match(routeContent, /heroVideoUrl = "\/videos\/homepage\/day\/homepage_hero_day\.mp4"/);

  assert.match(routeContent, /cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/);
  assert.match(logoRail, /src=\{browser\.logo\}/);
  assert.doesNotMatch(routeContent, /\/assets\/images\/browser-logos/);
});
