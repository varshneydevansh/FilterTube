import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WEBSITE_DYNAMIC_ROUTE_METHOD_SEMANTIC_REGISTER_2026-05-22.md';
const routePath = 'website/app/[slug]/page.js';

const sourceRows = [
  ['website/app/[slug]/page.js', 54, 1229, '0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3'],
  ['website/components/route-content.js', 903, 32419, '75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26'],
  ['website/components/site-shell-data.js', 21, 473, '28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0'],
  ['website/components/scenic-detail-page.js', 332, 14521, '2c8fcc51be06adc875c7496f478f6b61022d2ae8235216714f988ab8a5c27701']
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function doc() {
  return read(docPath);
}

function routeSource() {
  return read(routePath);
}

function lineCount(file) {
  const source = fs.readFileSync(filePath(file), 'binary');
  return (source.match(/\n/g) || []).length;
}

function bytes(file) {
  return fs.statSync(filePath(file)).size;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath(file))).digest('hex');
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function functionRows(source) {
  const rows = [];
  source.split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^export\s+(default\s+)?(async\s+)?function\s+([A-Za-z0-9_]+)/);
    if (match) {
      rows.push({
        line: index + 1,
        name: match[3],
        isDefault: Boolean(match[1]),
        isAsync: Boolean(match[2])
      });
    }
  });
  return rows;
}

function arrayStrings(file, name) {
  const source = read(file);
  const start = source.indexOf(`export const ${name} = [`);
  assert.notEqual(start, -1, `missing array ${name}`);
  const end = source.indexOf('];', start);
  assert.notEqual(end, -1, `missing end for ${name}`);
  return [...source.slice(start, end).matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function detailPageSlugs() {
  const source = read('website/components/route-content.js');
  const start = source.indexOf('export const detailPages = {');
  assert.notEqual(start, -1, 'missing detailPages export');
  return [...source.slice(start).matchAll(/^  (?:"([a-z0-9-]+)"|([a-z0-9-]+)): \{/gm)]
    .map((match) => match[1] || match[2]);
}

function relatedSlugs() {
  const source = read('website/components/route-content.js');
  return [...source.matchAll(/related: \[([^\]]*)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/g)].map((slugMatch) => slugMatch[1]));
}

test('website dynamic route method semantic register is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /does not open the implementation gate/);
  assert.match(text, /Scope: `website\/app\/\[slug\]\/page\.js`/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /The complete\s+audit remains open/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceRows) {
    assert.equal(lineCount(file), expectedLines, `${file} line count drifted`);
    assert.equal(bytes(file), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('website dynamic route method rows and primitive counts remain source-derived', () => {
  const text = doc();
  const source = routeSource();
  const rows = functionRows(source);

  assert.deepEqual(rows.map((row) => [row.line, row.name, row.isDefault, row.isAsync]), [
    [11, 'generateStaticParams', false, false],
    [15, 'generateMetadata', false, true],
    [41, 'DetailPage', true, true]
  ]);

  const expectedCounts = [
    ['dynamic route source lines', lineCount(routePath)],
    ['dynamic route source bytes', bytes(routePath)],
    ['import lines', count(source, /^import\s/gm)],
    ['export const declarations', count(source, /^export const /gm)],
    ['exported function declarations', count(source, /^export\s+(?:default\s+)?(?:async\s+)?function\s+[A-Za-z0-9_]+/gm)],
    ['async exported function declarations', count(source, /^export\s+(?:default\s+)?async\s+function\s+[A-Za-z0-9_]+/gm)],
    ['default async route exports', count(source, /^export\s+default\s+async\s+function/gm)],
    ['method rows', rows.length],
    ['map callsites', count(source, /\.map\(/g)],
    ['filter callsites', count(source, /\.filter\(/g)],
    ['notFound callsites', count(source, /\bnotFound\s*\(/g)],
    ['await params callsites', count(source, /await params/g)],
    ['fetch callsites', count(source, /\bfetch\s*\(/g)],
    ['setTimeout callsites', count(source, /setTimeout\s*\(/g)],
    ['setInterval callsites', count(source, /setInterval\s*\(/g)],
    ['addEventListener callsites', count(source, /addEventListener\s*\(/g)],
    ['MutationObserver tokens', count(source, /MutationObserver/g)]
  ];

  for (const [label, value] of expectedCounts) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }

  for (const row of rows) {
    assert.ok(text.includes(`| ${row.line} | \`${row.name}`), `missing method row for ${row.name}`);
  }
});

test('website dynamic route current behavior is pinned to static params metadata render and related pages', () => {
  const text = doc();
  const source = routeSource();
  const slugs = arrayStrings('website/components/site-shell-data.js', 'platformSlugs');
  const details = detailPageSlugs();
  const related = relatedSlugs();
  const unresolved = related.filter((slug) => !details.includes(slug));

  assert.deepEqual(slugs, [
    'mobile',
    'ios',
    'ipados',
    'android',
    'tv',
    'android-tv',
    'fire-tv',
    'kids',
    'ml-ai'
  ]);
  assert.deepEqual(details, slugs);
  assert.equal(related.length, 22);
  assert.equal(new Set(related).size, 9);
  assert.deepEqual(unresolved, []);

  assert.match(source, /export const dynamicParams = false/);
  assert.match(source, /return platformOrder\.map\(\(slug\) => \(\{ slug \}\)\)/);
  assert.match(source, /const \{ slug \} = await params/);
  assert.match(source, /const page = detailPages\[slug\]/);
  assert.match(source, /return \{\}/);
  assert.match(source, /canonical: `https:\/\/filtertube\.in\/\$\{slug\}`/);
  assert.match(source, /openGraph:/);
  assert.match(source, /twitter:/);
  assert.match(source, /notFound\(\)/);
  assert.match(source, /page\.related\s+\.\s*map\(\(relatedSlug\) => detailPages\[relatedSlug\]\)\s+\.\s*filter\(Boolean\)/);
  assert.match(source, /<ScenicDetailPage page=\{page\} relatedPages=\{relatedPages\} \/>/);

  assert.match(text, /platform slugs: 9/);
  assert.match(text, /detail page entries: 9/);
  assert.match(text, /related-page references: 22/);
  assert.match(text, /unresolved related-page references: 0/);
  assert.match(text, /mobile, ios, ipados, android, tv, android-tv, fire-tv, kids, ml-ai/);
});

test('website dynamic route register records risk boundaries future fields and missing authorities', () => {
  const text = doc();
  const trackedWebsiteSource = [
    'website/app/[slug]/page.js',
    'website/components/route-content.js',
    'website/components/site-shell-data.js',
    'website/components/scenic-detail-page.js'
  ].map(read).join('\n');

  for (const phrase of [
    'Static route closure',
    'Unknown slug behavior split',
    'Metadata from public-copy data',
    'Related route filtering',
    'Render dependency',
    'No local lifecycle/network work',
    'Public platform claims can outrun extension/native/release artifact proof',
    'Broken related links can disappear instead of failing a build or audit gate',
    'Route-level performance risk is mostly data/media/render-component driven'
  ]) {
    assert.match(text, new RegExp(escapeRegExp(phrase)));
  }

  for (const field of [
    'routeSlug',
    'routeExistsInStaticParams',
    'routeExistsInSitemap',
    'routeMetadataTitle',
    'routeMetadataDescription',
    'canonicalUrl',
    'openGraphUrl',
    'twitterTitle',
    'detailPageKey',
    'relatedSlug',
    'relatedSlugResolved',
    'unknownSlugMetadataBehavior',
    'unknownSlugRenderBehavior',
    'platformAvailabilityClaim',
    'downloadArtifactReference',
    'nativeRuntimeFreshnessReference',
    'firstClassJsonClaimReference',
    'desktopScreenshot',
    'mobileScreenshot',
    'accessibilityResult',
    'mediaBudget',
    'externalLinkPolicy',
    'releaseClaimOwner',
    'lastVerifiedDate'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const token of [
    'websiteDynamicRouteMethodAuthority',
    'websiteDynamicRouteStaticParamManifest',
    'websiteDynamicRouteMetadataParityReport',
    'websiteDynamicRouteRelatedPageIntegrityReport',
    'websiteDynamicRouteNotFoundFixture',
    'websiteDynamicRouteScreenshotProof',
    'websiteDynamicRouteAccessibilityReport',
    'websiteDynamicRoutePublicClaimGate',
    'websiteDynamicRouteMediaBudget',
    'websiteDynamicRouteFirstClassJsonClaimGate'
  ]) {
    assert.ok(text.includes(token), `missing missing-authority token ${token}`);
    assert.doesNotMatch(trackedWebsiteSource, new RegExp(token), `${token} should not exist in tracked website source yet`);
  }
});
