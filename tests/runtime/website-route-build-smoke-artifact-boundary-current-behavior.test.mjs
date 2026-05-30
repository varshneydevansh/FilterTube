import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_WEBSITE_ROUTE_BUILD_SMOKE_ARTIFACT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceRows = [
  ['website/app/[slug]/page.js', 54, 1229, '0233757cc9b72d7292750fc0a83560b54969f6489aa397091b408a16f25716f3'],
  ['website/app/downloads/page.js', 364, 14976, '946b20660d8633edda3d0ff1723e3c9229b66f03139eb28930647e9acf123eba'],
  ['website/app/page.js', 661, 31825, 'f396b57a6b5a4e83a3546957df084c9e71c63b35d4e8ba28adb85784c5f93f05'],
  ['website/app/privacy/page.js', 819, 35232, '41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9'],
  ['website/app/robots.js', 9, 163, '53946fae34f7c435da974b11d5509492267511744a516155c5e0b73d94c8945b'],
  ['website/app/sitemap.js', 10, 316, 'aee995ee3780b06c06a2f2a634b679922fe5c0d0bbb4f221aff884ca550392a9'],
  ['website/app/terms/page.js', 87, 3511, 'a06d00d4cfcde2113bb3c9a3dc66b7f5617e7875ac6ba22e264bf92cdb618e09'],
  ['website/components/route-content.js', 903, 32419, '75cdf761288ad1f325c9d883715b98845a89a8859f7c13bf7752d658da592a26'],
  ['website/components/site-shell-data.js', 21, 473, '28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0']
];

const artifactRows = [
  ['website/.next/BUILD_ID', 21, '8d244758baeadb7aae3f8c29e219e701ee8c393ae4f08f02c5b9abf7fab4e32f'],
  ['website/.next/app-path-routes-manifest.json', 332, '59af3a4d53943a7f09a3ffdf334f2c98f692b1597670b1457ae59e4a887292cb'],
  ['website/.next/routes-manifest.json', 2587, 'b23a2794a00d1493a1680bf76d595212116c761ee0c6b7b265d279730c5da9d0'],
  ['website/.next/prerender-manifest.json', 12680, '927d8e902155d2eb9731e0bb2ce0bdc7562a0389b974adde26833efb1468b5eb'],
  ['website/.next/server/app-paths-manifest.json', 444, 'b13aaac21a3d2045e205a671e0d80ce17b00335944b161ac09bc286f5f5ef5ac'],
  ['website/.next/server/pages-manifest.json', 58, 'c354059caa217e72bdeb145e351b2038990972872c52df215cb1e4105c35097b'],
  ['website/.next/server/app/sitemap.xml.body', 1181, '9ecbd1d75896eb929653717d842ee337fec06c1db51db9becd0ec44d781afa1a']
];

const sourcePublicRoutes = [
  '/',
  '/downloads',
  '/privacy',
  '/terms',
  '/mobile',
  '/ios',
  '/ipados',
  '/android',
  '/tv',
  '/android-tv',
  '/fire-tv',
  '/kids',
  '/ml-ai'
];

const routeArtifactBases = {
  '/': 'index',
  '/downloads': 'downloads',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/mobile': 'mobile',
  '/ios': 'ios',
  '/ipados': 'ipados',
  '/android': 'android',
  '/tv': 'tv',
  '/android-tv': 'android-tv',
  '/fire-tv': 'fire-tv',
  '/kids': 'kids',
  '/ml-ai': 'ml-ai'
};

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function doc() {
  return read(docPath);
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

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function json(file) {
  return JSON.parse(read(file));
}

function git(args) {
  const output = execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  return output ? output.split(/\r?\n/) : [];
}

function appFileNames(extension) {
  return fs.readdirSync(filePath('website/.next/server/app'))
    .filter((name) => name.endsWith(extension))
    .sort();
}

test('website route build smoke artifact boundary is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /does not open the implementation gate/);
  assert.match(text, /ignored local Next\.js output under `website\/\.next`/);
  assert.match(text, /local output tracked by git: no/);
  assert.match(text, /fresh build command captured: no/);
  assert.match(text, /browser screenshot proof captured: no/);
  assert.match(text, /accessibility fixture captured: no/);
  assert.match(text, /deploy artifact proof captured: no/);
  assert.match(text, /runtime behavior changed: no/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceRows) {
    assert.equal(lineCount(file), expectedLines, `${file} line count drifted`);
    assert.equal(bytes(file), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`));
  }

  assert.equal(git(['ls-files', 'website/.next']).length, 0);
});

test('website generated route manifests and artifact hashes remain pinned', () => {
  const text = doc();

  for (const [file, expectedBytes, expectedHash] of artifactRows) {
    assert.equal(bytes(file), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`));
  }

  assert.equal(read('website/.next/BUILD_ID'), 'mU-54AWzEaOTVx1n8fwjP');
  assert.match(text, /mU-54AWzEaOTVx1n8fwjP/);

  const prerender = json('website/.next/prerender-manifest.json');
  const routes = Object.keys(prerender.routes || {}).sort();
  const dynamicRoutes = Object.keys(prerender.dynamicRoutes || {}).sort();
  assert.deepEqual(routes, [
    '/',
    '/_global-error',
    '/_not-found',
    '/android',
    '/android-tv',
    '/downloads',
    '/fire-tv',
    '/icon.png',
    '/ios',
    '/ipados',
    '/kids',
    '/ml-ai',
    '/mobile',
    '/privacy',
    '/robots.txt',
    '/sitemap.xml',
    '/terms',
    '/tv'
  ]);
  assert.deepEqual(dynamicRoutes, ['/[slug]']);
  assert.deepEqual(prerender.notFoundRoutes || [], []);

  assert.match(text, /generated prerender routes: 18/);
  assert.match(text, /generated dynamic routes: 1/);
  assert.match(text, /generated notFoundRoutes entries: 0/);
});

test('website current public route set has generated html rsc and meta artifacts', () => {
  const text = doc();
  const html = appFileNames('.html');
  const rsc = appFileNames('.rsc');
  const meta = appFileNames('.meta');
  const sitemapBody = read('website/.next/server/app/sitemap.xml.body');

  assert.equal(html.length, 15);
  assert.equal(rsc.length, 15);
  assert.equal(meta.length, 18);
  assert.equal([...sitemapBody.matchAll(/<loc>/g)].length, 13);

  assert.match(text, /public route source set size: 13/);
  assert.match(text, /generated route html files: 15/);
  assert.match(text, /generated route rsc files: 15/);
  assert.match(text, /generated route meta files: 18/);
  assert.match(text, /public source routes with generated html\/rsc\/meta triplets: 13/);
  assert.match(text, /sitemap body loc entries: 13/);

  for (const route of sourcePublicRoutes) {
    const base = routeArtifactBases[route];
    const row = `${base}:true:true:true`;
    assert.ok(html.includes(`${base}.html`), `${route} missing html`);
    assert.ok(rsc.includes(`${base}.rsc`), `${route} missing rsc`);
    assert.ok(meta.includes(`${base}.meta`), `${route} missing meta`);
    assert.ok(text.includes(row), `missing route matrix row ${row}`);
  }

  assert.match(text, /\/, \/downloads, \/privacy, \/terms, \/mobile, \/ios, \/ipados, \/android, \/tv, \/android-tv, \/fire-tv, \/kids, \/ml-ai/);
  assert.match(text, /\/, \/_global-error, \/_not-found, \/android, \/android-tv, \/downloads, \/fire-tv, \/icon\.png, \/ios, \/ipados, \/kids, \/ml-ai, \/mobile, \/privacy, \/robots\.txt, \/sitemap\.xml, \/terms, \/tv/);
});

test('website route build smoke artifact boundary records future proof fields and missing authorities', () => {
  const text = doc();
  const trackedWebsiteAndConfig = git(['ls-files', 'website'])
    .filter((file) => /\.(js|mjs|json|css|md|txt|png|mp4|gitignore|vercelignore)$/.test(file))
    .map(read)
    .join('\n');

  for (const phrase of [
    'Build artifacts can be stale, local-only, or machine-specific',
    'Presence is not proof that the artifacts came from the current revision or a clean build',
    'No committed build command report, exit-code record, environment record, or source revision record accompanies these artifacts',
    'Generated pages can exist while the user-visible experience is broken',
    'Public platform claims can outrun product and native evidence',
    'A public optimization claim can land before runtime, package, or native proof exists'
  ]) {
    assert.match(text, new RegExp(escapeRegExp(phrase)));
  }

  for (const field of [
    'buildCommand',
    'buildExitCode',
    'nodeVersion',
    'npmVersion',
    'sourceRevision',
    'dirtyWorktreePolicy',
    'routePath',
    'routeSourceFile',
    'generatedHtmlPath',
    'generatedRscPath',
    'generatedMetaPath',
    'generatedArtifactHash',
    'browserViewport',
    'browserScreenshot',
    'accessibilityResult',
    'hydrationResult',
    'mediaLoadBudget',
    'externalLinkResult',
    'deployArtifactReference',
    'publicClaimReference',
    'nativeRuntimeFreshnessReference',
    'firstClassJsonRuntimeReference',
    'lastVerifiedDate'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const token of [
    'websiteRouteBuildSmokeAuthority',
    'websiteFreshBuildCommandReport',
    'websiteRouteArtifactManifest',
    'websiteRouteSmokeScreenshotProof',
    'websiteRouteAccessibilityProof',
    'websiteRouteHydrationSmokeProof',
    'websiteRouteMediaLoadBudget',
    'websiteRouteDeployArtifactReport',
    'websiteRoutePublicClaimParityReport',
    'websiteRouteFirstClassJsonClaimGate'
  ]) {
    assert.ok(text.includes(token), `missing missing-authority token ${token}`);
    assert.doesNotMatch(trackedWebsiteAndConfig, new RegExp(token), `${token} should not exist in tracked website source yet`);
  }

  assert.match(text, /does not prove\s+a fresh build, clean dependency reproducibility, browser rendering, screenshot\s+quality, accessibility, deploy parity, public claim parity, native runtime\s+freshness, media performance, or first-class JSON public-claim readiness/);
});
