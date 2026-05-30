import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WEBSITE_REMOTE_REQUEST_PRIVACY_PERFORMANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const selectedFingerprintFiles = [
  'website/app/[slug]/page.js',
  'website/app/downloads/page.js',
  'website/app/globals.css',
  'website/app/layout.js',
  'website/app/page.js',
  'website/app/privacy/page.js',
  'website/app/robots.js',
  'website/app/sitemap.js',
  'website/components/browser-logo-rail.js',
  'website/components/route-content.js',
  'website/components/site-data.js',
  'website/components/site-header.js',
  'website/components/site-shell-data.js',
  'website/next.config.mjs',
];

const websiteScopeFiles = [
  'website/.gitignore',
  'website/.vercelignore',
  'website/app/[slug]/page.js',
  'website/app/downloads/page.js',
  'website/app/globals.css',
  'website/app/layout.js',
  'website/app/not-found.js',
  'website/app/page.js',
  'website/app/privacy/page.js',
  'website/app/robots.js',
  'website/app/sitemap.js',
  'website/app/terms/page.js',
  'website/components/browser-logo-rail.js',
  'website/components/marketing-ui.js',
  'website/components/reveal.js',
  'website/components/route-content.js',
  'website/components/scene-controller.js',
  'website/components/scenic-detail-page.js',
  'website/components/scenic-illustration.js',
  'website/components/scenic-tones.js',
  'website/components/site-data.js',
  'website/components/site-footer.js',
  'website/components/site-header.js',
  'website/components/site-shell-data.js',
  'website/components/theme-toggle.js',
  'website/jsconfig.json',
  'website/next.config.mjs',
  'website/package.json',
  'website/postcss.config.mjs',
];

const futureSymbols = [
  'websiteRemoteRequestPrivacyPerformanceContract',
  'websiteRemoteRequestManifest',
  'websiteRemoteImageAssetPolicy',
  'websiteAnalyticsScopeReport',
  'websiteFontRequestPolicy',
  'websitePrivacyClaimParityReport',
  'websiteRemoteRequestPerformanceBudget',
  'websiteNoRemoteAssetBuildGate',
  'websiteExternalUrlClassReport',
  'websiteFirstClassJsonPublicClaimGate',
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sha256(source) {
  return crypto.createHash('sha256').update(source).digest('hex');
}

function lineCount(source) {
  return source.endsWith('\n') ? source.split(/\r?\n/).length - 1 : source.split(/\r?\n/).length;
}

function fileMetrics(file) {
  const source = read(file);
  return {
    lines: lineCount(source),
    bytes: Buffer.byteLength(source),
    sha256: sha256(source),
  };
}

function count(source, pattern) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  return (source.match(re) || []).length;
}

function websiteScopeSource() {
  return websiteScopeFiles.map((file) => read(file)).join('\n');
}

function urlSummary(source) {
  const urls = [...source.matchAll(/https?:\/\/[^\s"'`)<>]+/g)].map((match) => match[0].replace(/[),.;]+$/, ''));
  const hostCounts = {};

  for (const url of urls) {
    const host = new URL(url).host;
    hostCounts[host] = (hostCounts[host] || 0) + 1;
  }

  return {
    total: urls.length,
    unique: new Set(urls).size,
    hostCounts,
  };
}

function browserLinksBlock() {
  const source = read('website/components/route-content.js');
  const start = source.indexOf('export const browserLinks = [');
  const end = source.indexOf('export const featuredRouteSlugs', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return source.slice(start, end);
}

test('website remote request privacy performance boundary doc is audit-only', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an\s+implementation patch/);
  assert.match(source, /public website remote-request surface/);
  assert.match(source, /not YouTube response JSON/);
  assert.match(source, /not extension page-runtime\s+filtering code/);
  assert.match(source, /first-class public-claim, remote-request,\s+asset-budget, analytics-scope, and JSON\/config proof/);
  assert.match(source, /Implementation changes remain blocked/);
});

test('selected website remote request source fingerprints remain pinned', () => {
  const expected = {
    'website/app/[slug]/page.js': {
      lines: 54,
      bytes: 1229,
      sha256: '0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3',
    },
    'website/app/downloads/page.js': {
      lines: 364,
      bytes: 14976,
      sha256: '946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba',
    },
    'website/app/globals.css': {
      lines: 486,
      bytes: 12528,
      sha256: '2b583fc11e8f5a3a6fa5113daebf71b91d46bf685b02c544727167cf9ed7f760',
    },
    'website/app/layout.js': {
      lines: 129,
      bytes: 3621,
      sha256: '9821e403c734a9b40c311be208a35fd6a3afc09e0ac240fa7c681e8aaba410b4',
    },
    'website/app/page.js': {
      lines: 661,
      bytes: 31825,
      sha256: 'f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05',
    },
    'website/app/privacy/page.js': {
      lines: 819,
      bytes: 35232,
      sha256: '41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9',
    },
    'website/app/robots.js': {
      lines: 9,
      bytes: 163,
      sha256: '53946fae34f7c435da974b11d5509492267511744a516155c5e0b73d94c8945b',
    },
    'website/app/sitemap.js': {
      lines: 10,
      bytes: 316,
      sha256: 'aee995ee3780b06c06a2f2a634b679922fe5c0d0bbb4f221aff884ca550392a9',
    },
    'website/components/browser-logo-rail.js': {
      lines: 64,
      bytes: 2681,
      sha256: '2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b',
    },
    'website/components/route-content.js': {
      lines: 903,
      bytes: 32419,
      sha256: '75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26',
    },
    'website/components/site-data.js': {
      lines: 211,
      bytes: 6999,
      sha256: '54858021772c73c7d4ceaabf123470e0611b03b7267291bf7360bf68a151bfd9',
    },
    'website/components/site-header.js': {
      lines: 186,
      bytes: 7700,
      sha256: '6ffe1ff1815300d7e9f407c27bebe7bff14e2e6c1a794ce5290b9c0eb8c6f734',
    },
    'website/components/site-shell-data.js': {
      lines: 21,
      bytes: 473,
      sha256: '28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0',
    },
    'website/next.config.mjs': {
      lines: 12,
      bytes: 250,
      sha256: 'ab2d3beb7a94f0264112c0cdb5372d724cdf36c683c0d44005352021b257b9f6',
    },
  };

  assert.deepEqual(selectedFingerprintFiles, Object.keys(expected));
  for (const [file, metrics] of Object.entries(expected)) {
    assert.deepEqual(fileMetrics(file), metrics);
  }

  const source = doc();
  assert.match(source, /`website\/app\/\[slug\]\/page\.js` \| 54 \| 1,229/);
  assert.match(source, /`website\/app\/layout\.js` \| 129 \| 3,621/);
  assert.match(source, /`website\/components\/route-content\.js` \| 903 \| 32,419/);
  assert.match(source, /`website\/components\/site-header\.js` \| 186 \| 7,700/);
  assert.match(source, /`website\/next\.config\.mjs` \| 12 \| 250/);
});

test('website URL literal and side-effect token surface remains pinned', () => {
  const source = websiteScopeSource();
  const summary = urlSummary(source);

  assert.equal(websiteScopeFiles.length, 29);
  assert.equal(summary.total, 39);
  assert.equal(summary.unique, 23);
  assert.deepEqual(summary.hostCounts, {
    'filtertube.in': 6,
    'chromewebstore.google.com': 4,
    'addons.mozilla.org': 3,
    'www.w3.org': 1,
    'support.google.com': 1,
    'nanah-signaling.varshney-devansh614.workers.dev': 1,
    'github.com': 13,
    'filtertube.in${route}': 1,
    'm.youtube.com': 1,
    'cdnjs.cloudflare.com': 6,
    'microsoftedge.microsoft.com': 2,
  });

  assert.equal(count(source, '@vercel/analytics/next'), 1);
  assert.equal(count(source, '<Analytics />'), 1);
  assert.equal(count(source, 'next/font/google'), 1);
  assert.equal(count(source, 'cdnjs.cloudflare.com/ajax/libs/browser-logos'), 6);
  assert.equal(count(source, 'browser-logos/74.1.0'), 6);
  assert.equal(count(source, 'fetch('), 0);
  assert.equal(count(source, 'MutationObserver'), 0);
  assert.equal(count(source, 'new Image'), 0);
  assert.equal(count(source, '<img'), 1);
  assert.equal(count(source, '<Image'), 1);
  assert.equal(count(source, 'target="_blank"'), 8);
  assert.equal(count(source, 'rel="noreferrer"'), 8);
  assert.equal(count(source, 'rel="noopener noreferrer"'), 0);
  assert.equal(count(source, 'window.localStorage'), 3);

  const text = doc();
  assert.match(text, /tracked website source\/config text scan covers 29 files/);
  assert.match(text, /URL-like literal tokens: 39/);
  assert.match(text, /unique URL-like literal tokens: 23/);
  assert.match(text, /`github\.com`: 13/);
  assert.match(text, /`cdnjs\.cloudflare\.com`: 6/);
  assert.match(text, /`www\.w3\.org`: 1 embedded SVG namespace in CSS data URI/);
  assert.match(text, /`filtertube\.in\$\{route\}`: 1 sitemap template literal token/);
  assert.match(text, /`fetch\(` callsites: 0/);
  assert.match(text, /`MutationObserver` tokens: 0/);
  assert.match(text, /`new Image` tokens: 0/);
});

test('website analytics fonts CDN logos and image policy facts remain current', () => {
  const layout = read('website/app/layout.js');
  const route = read('website/components/route-content.js');
  const rail = read('website/components/browser-logo-rail.js');
  const nextConfig = read('website/next.config.mjs');
  const browserBlock = browserLinksBlock();

  assert.match(layout, /import \{ Analytics \} from "@vercel\/analytics\/next"/);
  assert.match(layout, /<Analytics \/>/);
  assert.match(layout, /from "next\/font\/google"/);
  for (const font of ['Outfit', 'Plus_Jakarta_Sans', 'Cormorant_Garamond', 'JetBrains_Mono']) {
    assert.match(layout, new RegExp(`${font}\\(`));
  }
  assert.match(layout, /window\.localStorage\.getItem\('filtertube-theme'\)/);

  assert.equal(count(browserBlock, /name: "/g), 6);
  assert.equal(count(browserBlock, /href:/g), 6);
  assert.equal(count(browserBlock, /logo:/g), 6);
  assert.equal(count(browserBlock, 'cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0'), 6);
  assert.match(route, /logo: "https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos\/74\.1\.0\/chrome\/chrome_48x48\.png"/);
  assert.match(route, /logo: "https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos\/74\.1\.0\/opera\/opera_48x48\.png"/);
  assert.match(rail, /src=\{browser\.logo\}/);
  assert.match(rail, /rel="noreferrer"/);
  assert.match(rail, /target="_blank"/);
  assert.doesNotMatch(nextConfig, /remotePatterns/);
  assert.doesNotMatch(nextConfig, /images\s*:/);

  const text = doc();
  assert.match(text, /renders `<Analytics \/>` once/);
  assert.match(text, /four Google font families: `Outfit`, `Plus_Jakarta_Sans`,\s+`Cormorant_Garamond`, and `JetBrains_Mono`/);
  assert.match(text, /declares 6 browser-logo CDN URL\s+literals/);
  assert.match(text, /renders those values through one raw\s+`<img src=\{browser\.logo\}>` path/);
  assert.match(text, /no\s+`remotePatterns` policy/);
  assert.match(text, /remote image manifest/);
  assert.match(text, /local-logo asset policy/);
});

test('website privacy public claim and future authority boundary remains blocked', () => {
  const privacy = read('website/app/privacy/page.js');
  const selectedSource = selectedFingerprintFiles.map((file) => read(file)).join('\n');

  assert.match(privacy, /Vercel Web Analytics is used only on filtertube\.in/);
  assert.match(privacy, /not included in the browser extension or native apps/);
  assert.match(privacy, /The website does not use Google Analytics, advertising pixels,\s+session replay, or cross-site ad targeting/);
  assert.match(privacy, /aggregate Vercel Web Analytics only for filtertube\.in page views/);

  for (const symbol of futureSymbols) {
    assert.equal(selectedSource.includes(symbol), false, `${symbol} should remain absent from selected website source`);
  }

  const text = doc();
  assert.match(text, /This slice does not prove website privacy compliance/);
  assert.match(text, /third-party request counts in a browser/);
  assert.match(text, /CDN logo\s+localization readiness/);
  assert.match(text, /public link policy/);
  assert.match(text, /route\s+performance budgets/);
  assert.match(text, /permission to change website copy\/assets/);
  for (const symbol of futureSymbols) {
    assert.match(text, new RegExp(symbol));
  }
});
