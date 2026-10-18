import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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

  assert.match(packageVersion, /^\d+\.\d+\.\d+$/);
  for (const file of manifestFiles) {
    assert.equal(readJson(file).version, packageVersion, `${file} should match package version`);
  }
});

test('release notes now align with the packaged extension version', () => {
  const packageVersion = readJson('package.json').version;
  const firstEntry = firstReleaseNoteEntry();

  assert.match(packageVersion, /^\d+\.\d+\.\d+$/);
  assert.equal(firstEntry.version, packageVersion);
  assert.doesNotMatch(firstEntry.headline, /Upcoming:/);
  assert.equal(firstEntry.detailsUrl, `https://github.com/varshneydevansh/FilterTube/releases/tag/v${packageVersion}`);
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

test('downloads page distinguishes the complete Play app from the simpler direct APK', () => {
  const downloads = read('website/app/downloads/page.js');

  assert.match(downloads, /const latestReleaseHref = `\$\{githubHref\}\/releases\/latest`/);
  assert.match(downloads, /label: "Open on Google Play"/);
  assert.match(downloads, /label: "Simpler direct APK"/);
  assert.match(downloads, /href: latestReleaseHref/);
  assert.match(downloads, /direct APK is a separate, simpler build/);
  assert.match(downloads, /does not include the complete custom frontend/);
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

// Execute only the production release orchestration/helpers with an inert CLI spy.
// No build, credentials, network operation or external release is performed.
async function releaseFixture({ existing = false, missingAfterUpload = false, uploadError = false, tty = true, approve = true } = {}) {
  const build = read('build.js');
  const release = build.slice(build.indexOf('async function maybePromptRelease('), build.indexOf('function extractLatestChangelogEntry('));
  const cliHelpers = build.slice(build.indexOf('function createDraftGitHubRelease('), build.indexOf('function promptYesNo('));
  const events = [];
  const logs = [];
  let viewCount = 0;
  const context = vm.createContext({
    path, REPO_OWNER: 'fixture', REPO_NAME: 'fixture',
    process: { stdout: { isTTY: tty } },
    console: { log: value => logs.push(value), error: value => logs.push(value) },
    promptYesNo: async () => { events.push('prompt'); return approve; },
    resolveGitHubToken: () => ({ source: 'inert fixture' }),
    extractLatestChangelogEntry: () => ({ section: 'Fixture release notes' }),
    buildReleaseBody: () => 'Fixture body', buildReleaseTitle: () => 'Fixture title',
    githubReleaseExists: () => existing,
    runGitHubCli: (_auth, args) => {
      if (args[1] === 'create') { assert.ok(args.includes('--draft')); events.push('draft'); }
      if (args[1] === 'view') {
        events.push('verify-assets');
        return viewCount++ === 0 || missingAfterUpload ? '' : 'chrome.zip\nfirefox.zip';
      }
      if (args[1] === 'upload') { events.push('upload'); if (uploadError) throw new Error('fixture upload rejected'); }
      if (args[1] === 'edit') { assert.ok(args.includes('--draft=false')); events.push('publish'); }
      return '';
    }
  });
  vm.runInContext(`${release}\n${cliHelpers}\nglobalThis.invoke = maybePromptRelease;`, context);
  await context.invoke('3.4.1', ['/fixture/chrome.zip', '/fixture/firefox.zip']);
  return { events, logs };
}

test('release publication creates a draft, uploads and verifies all assets before publishing', async () => {
  const { events } = await releaseFixture();
  assert.deepEqual(events, ['prompt', 'draft', 'verify-assets', 'upload', 'verify-assets', 'publish']);
});

test('missing or failed release assets never reach the publish operation', async () => {
  for (const options of [{ missingAfterUpload: true }, { uploadError: true }]) {
    const { events, logs } = await releaseFixture(options);
    assert.ok(events.includes('draft'));
    assert.ok(events.includes('upload'));
    assert.ok(!events.includes('publish'));
    assert.ok(logs.some(value => String(value).includes('Failed to publish release')));
  }
});

test('noninteractive or declined release prompts perform no release CLI operation', async () => {
  assert.deepEqual((await releaseFixture({ tty: false })).events, []);
  assert.deepEqual((await releaseFixture({ approve: false })).events, ['prompt']);
});

test('resuming an existing release does not create or publish a new release', async () => {
  const { events } = await releaseFixture({ existing: true });
  assert.deepEqual(events, ['prompt', 'verify-assets', 'upload', 'verify-assets']);
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
