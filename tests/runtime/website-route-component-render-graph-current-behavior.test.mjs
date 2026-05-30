import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WEBSITE_ROUTE_COMPONENT_RENDER_GRAPH_CURRENT_BEHAVIOR_2026-05-21.md';
const sourceRows = [
  ['website/app/[slug]/page.js', 54, 1229, '0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3'],
  ['website/app/downloads/page.js', 364, 14976, '946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba'],
  ['website/app/layout.js', 129, 3621, '9821e403c734a9b40c311be208a35fd6a3afc09e0ac240fa7c681e8aaba410b4'],
  ['website/app/not-found.js', 34, 1639, '45633bebc0aba712e2dc4c3051e7ef834ed244b93f04721d67f685e228b618eb'],
  ['website/app/page.js', 661, 31825, 'f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05'],
  ['website/app/privacy/page.js', 819, 35232, '41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9'],
  ['website/app/robots.js', 9, 163, '53946fae34f7c435da974b11d5509492267511744a516155c5e0b73d94c8945b'],
  ['website/app/sitemap.js', 10, 316, 'aee995ee3780b06c06a2f2a634b679922fe5c0d0bbb4f221aff884ca550392a9'],
  ['website/app/terms/page.js', 87, 3511, 'a06d00d4cfcde2113bb3c9a3dc66b7f5617e7875ac6ba22e264bf92cdb618e09'],
  ['website/components/browser-logo-rail.js', 64, 2681, '2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b'],
  ['website/components/marketing-ui.js', 89, 3155, 'f16f6e72b9761b09dc65e2fcd69f786e30b893afba76118401577254d8160302'],
  ['website/components/reveal.js', 11, 194, '64e73c6666e63a043b7f446824d042a0366caad2b26af40322b5bc9100c17a40'],
  ['website/components/route-content.js', 903, 32419, '75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26'],
  ['website/components/scene-controller.js', 88, 1871, '9a396c57e3e91249916e3d0d1ecc3ce11a85885b32bd8dd8640311fbc1394a67'],
  ['website/components/scenic-detail-page.js', 332, 14521, '2c8fcc51be06adc875c7496f478f6b61022d2ae8235216714f988ab8a5c27701'],
  ['website/components/scenic-illustration.js', 193, 8573, '37238b5d80e68ef14db79433d28e3cf21f92108f42850e24466bb233f3ddeab5'],
  ['website/components/scenic-tones.js', 102, 4671, '7732ffaa1751d9ceb403f5e0710e57a44a72d999b346cc96fb12dd1ffbb2a67c'],
  ['website/components/site-data.js', 211, 6999, '54858021772c73c7d4ceaabf123470e0611b03b7267291bf7360bf68a151bfd9'],
  ['website/components/site-footer.js', 135, 6073, 'c7e344060916fa91cd8f597d661626ef82298032ce7615c777b8d5c61954a4f8'],
  ['website/components/site-header.js', 186, 7700, '6ffe1ff1815300d7e9f407c27bebe7bff14e2e6c1a794ce5290b9c0eb8c6f734'],
  ['website/components/site-shell-data.js', 21, 473, '28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0'],
  ['website/components/theme-toggle.js', 106, 3577, '17352421ab9eee46d72aded73f0b1dacb27e8ab0b93dad7096c7343b4bdd323d'],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function wcLines(file) {
  const source = fs.readFileSync(filePath(file), 'binary');
  return (source.match(/\n/g) || []).length;
}

function bytes(file) {
  return fs.statSync(filePath(file)).size;
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

function appComponentSource() {
  return websiteJsFiles().map(read).join('\n');
}

function count(source, pattern) {
  return (source.match(pattern) || []).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function importConsumers(modulePath) {
  const quotedDouble = `from "${modulePath}"`;
  const quotedSingle = `from '${modulePath}'`;
  return websiteJsFiles()
    .filter((file) => file !== modulePath.replace('@/', 'website/'))
    .filter((file) => {
      const source = read(file);
      return source.includes(quotedDouble) || source.includes(quotedSingle);
    });
}

function arrayStrings(file, name) {
  const source = read(file);
  const start = source.indexOf(`export const ${name} = [`);
  assert.notEqual(start, -1, `missing ${name}`);
  const end = source.indexOf('];', start);
  assert.notEqual(end, -1, `missing end for ${name}`);
  return [...source.slice(start, end).matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function detailPageSlugs() {
  const source = read('website/components/route-content.js');
  const block = source.slice(source.indexOf('export const detailPages = {'));
  return [...block.matchAll(/^  (?:([a-z0-9-]+)|"([a-z0-9-]+)"): \{/gm)]
    .map((item) => item[1] || item[2]);
}

test('website route component render graph doc is audit-only and source pinned', () => {
  const doc = read(docPath);
  const files = websiteJsFiles();
  const totalLines = sourceRows.reduce((sum, [file]) => sum + wcLines(file), 0);
  const totalBytes = sourceRows.reduce((sum, [file]) => sum + bytes(file), 0);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /website redesign, route screenshot proof, public-claim\s+approval, build proof, or first-class JSON filter public-claim gate/);

  assert.deepEqual(files, sourceRows.map(([file]) => file).sort());
  assert.equal(files.length, 22);
  assert.equal(files.filter((file) => file.startsWith('website/app/')).length, 9);
  assert.equal(files.filter((file) => file.startsWith('website/components/')).length, 13);
  assert.equal(totalLines, 4608);
  assert.equal(totalBytes, 185419);
  assert.match(doc, /22\s+tracked JavaScript files/);
  assert.match(doc, /9 route\/app files and 13 component\/data files/);
  assert.match(doc, /4,608 newline counts and 185,419 bytes/);

  for (const [file, lineCount, byteCount, hash] of sourceRows) {
    assert.equal(wcLines(file), lineCount, `${file} line count drifted`);
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(escapeRegExp(file)));
    assert.match(doc, new RegExp(lineCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(byteCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(hash));
  }
});

test('website route component callable and render primitive counts remain source-derived', () => {
  const source = appComponentSource();
  const doc = read(docPath);

  assert.equal(count(source, /^(?:export\s+(?:default\s+)?(?:async\s+)?function|function)\s+[A-Za-z0-9_]+/gm), 44);
  assert.equal(count(source, /^export\s+(?:default\s+)?(?:async\s+)?function\s+[A-Za-z0-9_]+/gm), 24);
  assert.equal(count(source, /^function\s+[A-Za-z0-9_]+/gm), 20);
  assert.equal(count(source, /^export const /gm), 31);
  assert.equal(count(source, /^export \{/gm), 1);
  assert.equal(count(source, /^export default /gm), 9);
  assert.equal(count(source, /^import\s/gm), 55);
  assert.equal(count(source, /<Link\b/g), 12);
  assert.equal(count(source, /<Image\b/g), 1);
  assert.equal(count(source, /<video\b/g), 2);
  assert.equal(count(source, /<Script\b/g), 1);
  assert.equal(count(source, /<a\b/g), 14);
  assert.equal(count(source, /<button\b/g), 2);
  assert.equal(count(source, /\.map\(/g), 35);
  assert.equal(count(source, /\.filter\(/g), 2);

  assert.match(doc, /Function declarations \| 44/);
  assert.match(doc, /Exported function declarations \| 24/);
  assert.match(doc, /Local function declarations \| 20/);
  assert.match(doc, /`export const` declarations \| 31/);
  assert.match(doc, /Default exports \| 9/);
  assert.match(doc, /55 `import` lines/);
  assert.match(doc, /12 JSX `<Link>`\s+sites/);
  assert.match(doc, /35 `\.map\(\.\.\.\)` calls/);
});

test('website route owners and dynamic platform route behavior remain pinned', () => {
  const slugPage = read('website/app/[slug]/page.js');
  const sitemap = read('website/app/sitemap.js');
  const robots = read('website/app/robots.js');
  const doc = read(docPath);
  const expectedSlugs = [
    'mobile',
    'ios',
    'ipados',
    'android',
    'tv',
    'android-tv',
    'fire-tv',
    'kids',
    'ml-ai',
  ];

  assert.match(slugPage, /export const dynamicParams = false/);
  assert.match(slugPage, /export function generateStaticParams\(\)/);
  assert.match(slugPage, /return platformOrder\.map\(\(slug\) => \(\{ slug \}\)\)/);
  assert.match(slugPage, /export async function generateMetadata\(\{ params \}\)/);
  assert.match(slugPage, /return \{\}/);
  assert.match(slugPage, /export default async function DetailPage\(\{ params \}\)/);
  assert.match(slugPage, /notFound\(\)/);
  assert.match(slugPage, /\.map\(\(relatedSlug\) => detailPages\[relatedSlug\]\)/);
  assert.match(slugPage, /\.filter\(Boolean\)/);

  assert.deepEqual(arrayStrings('website/components/site-shell-data.js', 'platformSlugs'), expectedSlugs);
  assert.deepEqual(detailPageSlugs(), expectedSlugs);
  assert.match(sitemap, /const routes = \["", "\/downloads", "\/privacy", "\/terms", \.\.\.platformOrder\.map/);
  assert.match(sitemap, /lastModified: "2026-05-16"/);
  assert.match(robots, /userAgent: "\*"/);
  assert.match(robots, /allow: "\/"/);
  assert.match(robots, /sitemap: "https:\/\/filtertube\.in\/sitemap\.xml"/);

  assert.match(doc, /Current route entry ownership/);
  assert.match(doc, /The dynamic platform route has `dynamicParams = false`/);
  assert.match(doc, /calls `notFound\(\)` during rendering/);
  assert.match(doc, /builds 13 routes/);
  assert.match(doc, /static\s+`lastModified: "2026-05-16"`/);
});

test('website internal import graph and legacy site-data burden stay explicit', () => {
  const routeContent = read('website/components/route-content.js');
  const browserRail = read('website/components/browser-logo-rail.js');
  const siteData = read('website/components/site-data.js');
  const doc = read(docPath);

  assert.deepEqual(importConsumers('@/components/site-data'), []);
  assert.equal(count(siteData, /^export const /gm), 7);
  assert.deepEqual(importConsumers('@/components/site-shell-data'), [
    'website/components/route-content.js',
    'website/components/site-header.js',
  ]);
  assert.deepEqual(importConsumers('@/components/route-content'), [
    'website/app/[slug]/page.js',
    'website/app/downloads/page.js',
    'website/app/page.js',
    'website/app/sitemap.js',
    'website/components/browser-logo-rail.js',
    'website/components/site-footer.js',
    'website/components/site-header.js',
  ]);
  assert.deepEqual(importConsumers('@/components/marketing-ui'), [
    'website/app/downloads/page.js',
    'website/app/not-found.js',
    'website/app/page.js',
    'website/app/privacy/page.js',
    'website/app/terms/page.js',
    'website/components/scenic-detail-page.js',
    'website/components/site-footer.js',
  ]);
  assert.deepEqual(importConsumers('@/components/scenic-detail-page'), ['website/app/[slug]/page.js']);
  assert.deepEqual(importConsumers('@/components/browser-logo-rail'), ['website/app/page.js']);
  assert.deepEqual(importConsumers('@/components/theme-toggle'), ['website/components/site-header.js']);
  assert.deepEqual(importConsumers('@/components/scene-controller'), ['website/app/layout.js']);

  assert.match(routeContent, /export \{ extensionInstallHref, navigationLinks \}/);
  assert.equal(count(routeContent, /cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/g), 6);
  assert.match(browserRail, /src=\{browser\.logo\}/);

  assert.match(doc, /`@\/components\/site-data` has 0 current imports/);
  assert.match(doc, /still exports 7 public-copy data groups/);
  assert.match(doc, /`browserLinks` has 6 rows and every logo is a cdnjs URL/);
  assert.match(doc, /plain `<img src=\{browser\.logo\}>`/);
});

test('BrowserLogoRail method semantics are pinned without closing public claim proof', () => {
  const routeContent = read('website/components/route-content.js');
  const browserRail = read('website/components/browser-logo-rail.js');
  const homepage = read('website/app/page.js');
  const doc = read(docPath);

  assert.match(doc, /BrowserLogoRail Method-Semantic Addendum - 2026-05-27/);
  assert.match(doc, /source file: website\/components\/browser-logo-rail\.js/);
  assert.match(doc, /line count: 64/);
  assert.match(doc, /source bytes: 2681/);
  assert.match(doc, /source sha256: 2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b/);
  assert.match(doc, /method rows covered: 1/);
  assert.match(doc, /exported function declarations covered: 1/);
  assert.match(doc, /prop defaults covered: 3/);
  assert.match(doc, /rendered browser link rows: 6/);
  assert.match(doc, /remote browser logo URL rows: 6/);
  assert.match(doc, /raw img render sites: 1/);
  assert.match(doc, /target blank anchor sites: 1/);
  assert.match(doc, /rel noreferrer sites: 1/);
  assert.match(doc, /rel noopener sites: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  assert.match(browserRail, /export function BrowserLogoRail\(\{/);
  assert.match(browserRail, /className = ""/);
  assert.match(browserRail, /muted = false/);
  assert.match(browserRail, /panel = false/);
  assert.equal(count(browserRail, /^import\s/gm), 2);
  assert.equal(count(browserRail, /^  const [A-Za-z]+Classes =/gm), 3);
  assert.equal(count(browserRail, /browserLinks\.map\(/g), 1);
  assert.equal(count(browserRail, /<a\b/g), 1);
  assert.equal(count(browserRail, /target="_blank"/g), 1);
  assert.equal(count(browserRail, /rel="noreferrer"/g), 1);
  assert.equal(count(browserRail, /rel="noopener/g), 0);
  assert.equal(count(browserRail, /<img\b/g), 1);
  assert.match(browserRail, /src=\{browser\.logo\}/);
  assert.match(browserRail, /alt=\{`\$\{browser\.name\} logo`\}/);
  assert.match(browserRail, /<ArrowUpRight aria-hidden="true"/);
  assert.match(homepage, /import \{ BrowserLogoRail \} from "@\/components\/browser-logo-rail"/);
  assert.match(homepage, /<BrowserLogoRail muted \/>/);
  assert.match(homepage, /<BrowserLogoRail panel \/>/);
  assert.equal(count(routeContent, /cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/g), 6);

  for (const token of [
    'Rendered by the homepage through `website/app/page.js`',
    'receives optional `className`, `muted`, and `panel` props with defaults',
    'maps the six `browserLinks` rows into external anchors',
    'renders plain `<img>` elements from `browser.logo`',
    'No storage, timers, listeners, observers, fetch calls, or extension runtime mutations',
    'remote-asset privacy policy',
    'deploy artifact proof',
  ]) {
    assert.ok(doc.includes(token), `missing BrowserLogoRail method-semantic token ${token}`);
  }
  assert.match(doc, /does not\s+reduce the repo-wide method semantic gap count/);
});

test('website route data ownership and render graph risks remain current-behavior only', () => {
  const routeContent = read('website/components/route-content.js');
  const doc = read(docPath);

  assert.match(routeContent, /export const heroVideoUrl = "\/videos\/homepage\/day\/homepage_hero_day\.mp4"/);
  assert.match(routeContent, /export const featuredRouteSlugs = \["mobile", "tv", "kids", "ml-ai"\]/);
  assert.equal(count(routeContent, /^  \{\n    name:/gm), 6);
  assert.equal(detailPageSlugs().length, 9);

  for (const slug of ['mobile', 'ios', 'ipados', 'android', 'tv', 'android-tv', 'fire-tv', 'kids', 'ml-ai']) {
    assert.ok(detailPageSlugs().includes(slug), `missing ${slug}`);
    assert.match(doc, new RegExp(slug.replace('-', '\\-')));
  }

  assert.match(doc, /no route screenshot, static export, or deploy artifact proving every route/);
  assert.match(doc, /metadata returns `\{\}`, while rendering calls `notFound\(\)`/);
  assert.match(doc, /sitemap has static `lastModified: "2026-05-16"`/);
  assert.match(doc, /Data arrays drive 35 render `\.map\(\.\.\.\)` sites/);
  assert.match(doc, /does not\s+prove extension JSON filtering, DOM fallback behavior, native parity/);
});

test('tracked website source lacks route component render graph authority symbols', () => {
  const source = appComponentSource();
  const doc = read(docPath);

  for (const symbol of [
    'websiteRouteComponentGraphAuthority',
    'websiteRouteRenderManifest',
    'websiteRouteScreenshotProof',
    'websiteStaticParamMetadataContract',
    'websiteRouteDataOwnershipReport',
    'websiteComponentImportGraphManifest',
    'websiteLegacySiteDataDeletionDecision',
    'websiteRenderMapAccessibilityReport',
    'websitePublicCopyRuntimeParityGate',
    'websiteJsonFirstPublicClaimGate',
  ]) {
    assert.doesNotMatch(source, new RegExp(symbol));
    assert.match(doc, new RegExp(symbol));
  }

  assert.match(doc, /This register does not close website tracked-file obligations/);
  assert.match(doc, /route smoke\/build proof/);
  assert.match(doc, /browser screenshots/);
  assert.match(doc, /accessibility fixtures/);
  assert.match(doc, /external-navigation policy/);
  assert.match(doc, /media budgets/);
  assert.match(doc, /deploy\s+artifact evidence/);
  assert.match(doc, /public-claim parity/);
  assert.match(doc, /runtime\/native parity proof/);
});
