import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WEBSITE_ROUTE_ASSET_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function bytes(file) {
  return fs.statSync(path.join(repoRoot, file)).size;
}

function wcLines(file) {
  const source = fs.readFileSync(path.join(repoRoot, file), 'binary');
  return (source.match(/\n/g) || []).length;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function trackedWebsiteFiles() {
  return git(['ls-files', 'website']);
}

function platformSlugs() {
  const source = read('website/components/site-shell-data.js');
  const match = source.match(/export const platformSlugs = \[([\s\S]*?)\];/);
  assert.ok(match, 'missing platformSlugs array');
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function detailPageSlugs() {
  const source = read('website/components/route-content.js');
  const block = source.slice(source.indexOf('export const detailPages = {'));
  return [...block.matchAll(/^  (?:([a-z0-9-]+)|"([a-z0-9-]+)"): \{/gm)]
    .map((item) => item[1] || item[2]);
}

function arrayStringExport(file, name) {
  const source = read(file);
  const start = source.indexOf(`export const ${name} = [`);
  assert.notEqual(start, -1, `missing ${name}`);
  const end = source.indexOf('];', start);
  assert.notEqual(end, -1, `missing ${name} terminator`);
  const match = [null, source.slice(start, end)];
  assert.ok(match, `missing ${name}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function externalUrls() {
  const urls = new Map();
  const files = trackedWebsiteFiles()
    .filter((file) => file !== 'website/package-lock.json')
    .filter((file) => /\.(js|mjs|json|css|md|txt|gitignore|vercelignore)$/.test(file));

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(/https?:\/\/[^"'`\s<>),]+/g)) {
      const url = match[0];
      if (url === 'http://www.w3.org/2000/svg') continue;
      const refs = urls.get(url) || [];
      refs.push(file);
      urls.set(url, refs);
    }
  }

  return urls;
}

function websiteSource() {
  return trackedWebsiteFiles()
    .filter((file) => /\.(js|mjs|json|css|md|txt|gitignore|vercelignore)$/.test(file))
    .map(read)
    .join('\n');
}

test('website route asset surface doc is audit-only and source pinned', () => {
  const doc = read(docPath);
  const files = trackedWebsiteFiles();
  const totalLines = files.reduce((sum, file) => sum + wcLines(file), 0);
  const totalBytes = files.reduce((sum, file) => sum + bytes(file), 0);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /website redesign, public-claim approval, build proof, or\s+release gate/);

  assert.equal(files.length, 42);
  assert.equal(totalLines, 184633);
  assert.equal(totalBytes, 45861622);
  assert.match(doc, /42 tracked files/);
  assert.match(doc, /184,633 newline/);
  assert.match(doc, /45,861,622 bytes/);

  const counts = {
    app: files.filter((file) => file.startsWith('website/app/')).length,
    components: files.filter((file) => file.startsWith('website/components/')).length,
    assets: files.filter((file) => file.startsWith('website/assets/')).length,
    public: files.filter((file) => file.startsWith('website/public/')).length,
    config: files.filter((file) => !/^website\/(?:app|components|assets|public)\//.test(file)).length
  };
  assert.deepEqual(counts, { app: 11, components: 13, assets: 7, public: 4, config: 7 });

  for (const [file, lines, byteCount, hash] of [
    ['website/app/page.js', 661, 31825, 'f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05'],
    ['website/app/downloads/page.js', 364, 14976, '946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba'],
    ['website/app/layout.js', 129, 3621, '9821e403c734a9b40c311be208a35fd6a3afc09e0ac240fa7c681e8aaba410b4'],
    ['website/components/route-content.js', 903, 32419, '75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26'],
    ['website/components/site-shell-data.js', 21, 473, '28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0'],
    ['website/components/site-data.js', 211, 6999, '54858021772c73c7d4ceaabf123470e0611b03b7267291bf7360bf68a151bfd9'],
    ['website/components/scene-controller.js', 88, 1871, '9a396c57e3e91249916e3d0d1ecc3ce11a85885b32bd8dd8640311fbc1394a67'],
    ['website/components/theme-toggle.js', 106, 3577, '17352421ab9eee46d72aded73f0b1dacb27e8ab0b93dad7096c7343b4bdd323d']
  ]) {
    assert.equal(wcLines(file), lines, `${file} line count drift`);
    assert.equal(bytes(file), byteCount, `${file} byte count drift`);
    assert.equal(sha256(file), hash, `${file} hash drift`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(formatNumber(lines)));
    assert.match(doc, new RegExp(formatNumber(byteCount)));
    assert.match(doc, new RegExp(hash));
  }
});

test('website route topology and platform data remain source-derived', () => {
  const slugPage = read('website/app/[slug]/page.js');
  const sitemap = read('website/app/sitemap.js');
  const routeContent = read('website/components/route-content.js');

  const expectedSlugs = [
    'mobile',
    'ios',
    'ipados',
    'android',
    'tv',
    'android-tv',
    'fire-tv',
    'kids',
    'ml-ai'
  ];

  assert.deepEqual(platformSlugs(), expectedSlugs);
  assert.deepEqual(detailPageSlugs(), expectedSlugs);
  assert.deepEqual(
    arrayStringExport('website/components/route-content.js', 'featuredRouteSlugs'),
    ['mobile', 'tv', 'kids', 'ml-ai']
  );

  assert.match(slugPage, /export const dynamicParams = false/);
  assert.match(slugPage, /return platformOrder\.map\(\(slug\) => \(\{ slug \}\)\)/);
  assert.match(slugPage, /return \{\}/);
  assert.match(slugPage, /notFound\(\)/);

  assert.match(sitemap, /const routes = \["", "\/downloads", "\/privacy", "\/terms", \.\.\.platformOrder\.map/);
  assert.match(sitemap, /lastModified: "2026-05-16"/);

  assert.match(routeContent, /export const heroVideoUrl = "\/videos\/homepage\/day\/homepage_hero_day\.mp4"/);
  assert.equal((routeContent.match(/name: "/g) || []).length, 6);
  assert.match(read(docPath), /sitemap\.js` builds 13\s+routes/);
});

test('website asset duplicates and served media paths are pinned', () => {
  const logoFiles = [
    'website/assets/images/logo.png',
    'website/app/icon.png',
    'website/public/brand/logo.png'
  ];
  const homepageVideoFiles = [
    'website/assets/videos/homepage/day/homepage_hero_day.mp4',
    'website/public/videos/homepage/day/homepage_hero_day.mp4',
    'website/public/videos/homepage/homepage_hero_day.mp4'
  ];

  for (const file of logoFiles) {
    assert.equal(bytes(file), 3406);
    assert.equal(sha256(file), '2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755');
  }

  for (const file of homepageVideoFiles) {
    assert.equal(bytes(file), 12419424);
    assert.equal(sha256(file), '3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3');
  }

  assert.equal(bytes('website/assets/videos/ios/ios.mp4'), 6152963);
  assert.equal(sha256('website/assets/videos/ios/ios.mp4'), '6a6b2b08fe198440ca1e25695f3029d9311039d5ce3d75e30c171d4fe5ebd463');
  assert.equal(bytes('website/public/videos/ios/ios_hero_slow_540.mp4'), 2179940);
  assert.equal(sha256('website/public/videos/ios/ios_hero_slow_540.mp4'), '00da591840296f2c0005dbb83800a6987edad7efda1536cf7b20304f92ba78fc');

  const source = websiteSource();
  assert.match(source, /\/brand\/logo\.png/);
  assert.match(source, /\/videos\/homepage\/day\/homepage_hero_day\.mp4/);
  assert.match(source, /\/videos\/ios\/ios_hero_slow_540\.mp4/);
  assert.doesNotMatch(source, /website\/assets\/videos\/ios\/ios\.mp4/);
  assert.doesNotMatch(source, /website\/assets\/videos\/homepage\/day\/homepage_hero_day\.mp4/);
});

test('website config ignored output and client lifecycle boundaries are explicit', () => {
  const pkg = JSON.parse(read('website/package.json'));
  const nextConfig = read('website/next.config.mjs');
  const vercelIgnore = read('website/.vercelignore');
  const layout = read('website/app/layout.js');
  const scene = read('website/components/scene-controller.js');
  const theme = read('website/components/theme-toggle.js');

  assert.deepEqual(Object.keys(pkg.scripts), ['dev', 'build', 'start']);
  assert.equal(pkg.engines.node, '22.x');
  assert.equal(pkg.dependencies.next, '^16.1.6');
  assert.equal(pkg.dependencies.react, '^19.2.4');
  assert.equal(pkg.dependencies['react-dom'], '^19.2.4');
  assert.equal(pkg.dependencies['@vercel/analytics'], '^2.0.1');
  assert.equal(pkg.dependencies.tailwindcss, '^4.2.1');
  assert.equal(pkg.dependencies['@phosphor-icons/react'], '^2.1.10');

  assert.match(nextConfig, /optimizePackageImports: \["@phosphor-icons\/react"\]/);
  assert.match(nextConfig, /root: fileURLToPath\(new URL\("\.\/", import\.meta\.url\)\)/);
  assert.deepEqual(vercelIgnore.trim().split(/\r?\n/), ['.git', '.vercel', '.next', 'node_modules']);

  for (const ignoredPath of [
    'website/.next/BUILD_ID',
    'website/node_modules/.package-lock.json',
    'website/.vercel/project.json',
    'website/.DS_Store',
    'website/assets/.DS_Store'
  ]) {
    const output = execFileSync('git', ['check-ignore', '-v', ignoredPath], { cwd: repoRoot, encoding: 'utf8' });
    assert.ok(output.includes(ignoredPath), `${ignoredPath} should be ignored`);
  }

  const clientFiles = trackedWebsiteFiles()
    .filter((file) => file.endsWith('.js'))
    .filter((file) => /^"use client";/.test(read(file).trim()));
  assert.deepEqual(clientFiles, [
    'website/components/scene-controller.js',
    'website/components/site-header.js',
    'website/components/theme-toggle.js'
  ]);

  assert.match(layout, /strategy="beforeInteractive"/);
  assert.match(layout, /window\.localStorage\.getItem\('filtertube-theme'\)/);
  assert.match(layout, /root\.dataset\.scene = scene/);

  assert.equal((scene.match(/addEventListener/g) || []).length, 1);
  assert.equal((scene.match(/removeEventListener/g) || []).length, 1);
  assert.equal((scene.match(/setTimeout/g) || []).length, 1);
  assert.equal((scene.match(/clearTimeout/g) || []).length, 2);

  assert.equal((theme.match(/addEventListener/g) || []).length, 2);
  assert.equal((theme.match(/removeEventListener/g) || []).length, 2);
  assert.equal((theme.match(/localStorage/g) || []).length, 2);
  assert.equal((theme.match(/dispatchEvent/g) || []).length, 1);

  const appAndComponents = trackedWebsiteFiles()
    .filter((file) => /^website\/(?:app|components)\//.test(file))
    .filter((file) => file.endsWith('.js'))
    .map(read)
    .join('\n');
  assert.doesNotMatch(appAndComponents, /\bfetch\s*\(/);
  assert.doesNotMatch(appAndComponents, /MutationObserver/);
});

test('website remote navigation and legacy data risks are current source facts', () => {
  const urls = externalUrls();
  const source = websiteSource();
  const routeContent = read('website/components/route-content.js');
  const privacy = read('website/app/privacy/page.js');
  const browserRail = read('website/components/browser-logo-rail.js');
  const siteDataImports = trackedWebsiteFiles()
    .filter((file) => /^website\/(?:app|components)\//.test(file))
    .filter((file) => file.endsWith('.js'))
    .filter((file) => file !== 'website/components/site-data.js')
    .map(read)
    .join('\n');

  assert.equal(urls.size, 22);
  for (const url of [
    'https://filtertube.in',
    'https://chromewebstore.google.com/detail/filtertube/cjmdggnnpmpchholgnkfokibidbbnfgc',
    'https://addons.mozilla.org/en-US/firefox/addon/filtertube/',
    'https://microsoftedge.microsoft.com/addons/detail/filtertube/lgeflbmplcmljnhffmoghkoccflhlbem',
    'https://m.youtube.com/watch?v=dmLUu3lm7dE',
    'https://nanah-signaling.varshney-devansh614.workers.dev/',
    'https://github.com/varshneydevansh/FilterTube/releases'
  ]) {
    assert.ok(urls.has(url), `missing website remote ${url}`);
  }

  assert.equal((routeContent.match(/cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/g) || []).length, 6);
  assert.match(browserRail, /src=\{browser\.logo\}/);
  assert.match(read('website/app/layout.js'), /@vercel\/analytics\/next/);
  assert.match(read('website/app/layout.js'), /<Analytics \/>/);
  assert.match(privacy, /Vercel Web Analytics is used only on filtertube\.in/);
  assert.match(privacy, /Vercel Analytics is not\s+included in the FilterTube browser extension, Android app,\s+iOS\/iPad app, or TV app path/);
  assert.match(privacy, /rel=\{href\.startsWith\("http"\) \? "noreferrer" : undefined\}/);
  assert.match(privacy, /target=\{href\.startsWith\("http"\) \? "_blank" : undefined\}/);

  assert.equal((source.match(/target="_blank"/g) || []).length, 8);
  assert.equal((source.match(/rel="noreferrer"/g) || []).length, 8);
  assert.doesNotMatch(siteDataImports, /site-data/);
});

test('tracked website source lacks website route asset authority symbols', () => {
  const source = websiteSource();

  for (const missingAuthority of [
    'websiteRouteSurfaceAuthority',
    'websiteRouteManifest',
    'websitePlatformClaimManifest',
    'websiteAssetProvenanceManifest',
    'websiteMediaDerivativeManifest',
    'websiteExternalNavigationAuthority',
    'websiteRemoteRequestManifest',
    'websitePublicClaimArtifactGate',
    'websiteGeneratedOutputBoundary',
    'websiteLegacyDataDeletionDecision'
  ]) {
    assert.doesNotMatch(source, new RegExp(missingAuthority));
    assert.match(read(docPath), new RegExp(missingAuthority));
  }
});
