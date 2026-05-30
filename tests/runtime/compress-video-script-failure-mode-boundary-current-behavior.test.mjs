import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_COMPRESS_VIDEO_SCRIPT_FAILURE_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const scriptPath = 'scripts/compress-video.swift';
const scriptHash = '196c1ebf918b94e3d36fd2bd04658c4fa4762a85ad5657b49ede7aaa93e2e36b';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function blockStats(startLine, endLine) {
  const sourceLines = read(scriptPath).split(/\r?\n/);
  const block = sourceLines.slice(startLine - 1, endLine).join('\n');
  return {
    lines: endLine - startLine + 1,
    bytes: Buffer.byteLength(block)
  };
}

function gitTrackedProductSource() {
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.startsWith('tests/'))
    .filter(file => file !== scriptPath)
    .filter(file => /\.(js|mjs|jsx|json|html|css|swift|md)$/.test(file) || file === 'build.js' || file === 'package.json')
    .map(read)
    .join('\n');
}

test('compress-video failure-mode boundary is audit-only and source pinned', () => {
  const source = read(scriptPath);
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime, build, website, and release\s+behavior are unchanged/);
  assert.match(text, /This is not a script rewrite/);
  assert.match(text, /script path: scripts\/compress-video\.swift/);
  assert.equal(lineCount(source), 97);
  assert.equal(fs.statSync(path.join(repoRoot, scriptPath)).size, 3339);
  assert.equal(sha256(scriptPath), scriptHash);
  assert.match(text, /counted source lines: 97/);
  assert.match(text, /source bytes: 3339/);
  assert.match(text, new RegExp(`source sha256: ${scriptHash}`));

  assert.deepEqual(blockStats(4, 25), { lines: 22, bytes: 834 });
  assert.deepEqual(blockStats(27, 40), { lines: 14, bytes: 407 });
  assert.deepEqual(blockStats(42, 97), { lines: 56, bytes: 2054 });
  assert.deepEqual(blockStats(57, 64), { lines: 8, bytes: 271 });
  assert.deepEqual(blockStats(66, 89), { lines: 24, bytes: 845 });
  assert.deepEqual(blockStats(91, 93), { lines: 3, bytes: 318 });
  assert.deepEqual(blockStats(94, 97), { lines: 4, bytes: 106 });

  for (const token of [
    'CompressionError enum block: 22 lines, 834 bytes',
    'presetName(for:) block: 14 lines, 407 bytes',
    'top-level driver block: 56 lines, 2054 bytes',
    'destructive output preflight block: 8 lines, 271 bytes',
    'export execution block: 24 lines, 845 bytes',
    'size-report print block: 3 lines, 318 bytes',
    'catch/exit block: 4 lines, 106 bytes'
  ]) {
    assert.ok(text.includes(token), `doc should pin block token ${token}`);
  }
});

test('compress-video script primitive counts and preset surface remain current behavior', () => {
  const source = read(scriptPath);
  const text = doc();

  const counts = {
    enumDecl: count(source, /enum\s+CompressionError/g),
    errorCases: count(source, /case\s+\w+/g),
    presetFunction: count(source, /func\s+presetName/g),
    presets: count(source, /AVAssetExportPreset/g),
    commandArgs: count(source, /CommandLine\.arguments/g),
    avUrlAsset: count(source, /AVURLAsset/g),
    exportSession: count(source, /AVAssetExportSession/g),
    fileExists: count(source, /fileExists\(/g),
    removeItem: count(source, /removeItem/g),
    supportedMp4: count(source, /supportedFileTypes\.contains\(\.mp4\)/g),
    optimizeNetwork: count(source, /shouldOptimizeForNetworkUse/g),
    modernExport: count(source, /export\(to:\s*outputURL,\s*as:\s*\.mp4\)/g),
    exportAsync: count(source, /exportAsynchronously/g),
    semaphore: count(source, /DispatchSemaphore|semaphore\./g),
    statusSwitch: count(source, /switch\s+exporter\.status/g),
    attributes: count(source, /attributesOfItem/g),
    printCalls: count(source, /print\(/g),
    stderrWrites: count(source, /FileHandle\.standardError\.write/g),
    exitCalls: count(source, /exit\(1\)/g)
  };

  assert.deepEqual(counts, {
    enumDecl: 1,
    errorCases: 5,
    presetFunction: 1,
    presets: 4,
    commandArgs: 1,
    avUrlAsset: 1,
    exportSession: 2,
    fileExists: 1,
    removeItem: 1,
    supportedMp4: 1,
    optimizeNetwork: 1,
    modernExport: 1,
    exportAsync: 1,
    semaphore: 3,
    statusSwitch: 1,
    attributes: 2,
    printCalls: 1,
    stderrWrites: 1,
    exitCalls: 1
  });

  for (const token of [
    'CompressionError enum declarations: 1',
    'CompressionError cases: 5',
    'presetName(for:) functions: 1',
    'AVAssetExportPreset tokens: 4',
    'CommandLine.arguments reads: 1',
    'AVURLAsset constructions: 1',
    'AVAssetExportSession tokens: 2',
    'fileExists checks: 1',
    'removeItem calls: 1',
    'supported .mp4 checks: 1',
    'shouldOptimizeForNetworkUse writes: 1',
    'modern export(to:as:) calls: 1',
    'legacy exportAsynchronously calls: 1',
    'DispatchSemaphore/semaphore tokens: 3',
    'exporter.status switches: 1',
    'attributesOfItem reads: 2',
    'stdout print calls: 1',
    'stderr writes: 1',
    'exit(1) calls: 1'
  ]) {
    assert.ok(text.includes(token), `doc should pin primitive token ${token}`);
  }

  for (const preset of [
    'AVAssetExportPreset640x480',
    'AVAssetExportPreset960x540',
    'AVAssetExportPreset1280x720',
    'AVAssetExportPresetMediumQuality'
  ]) {
    assert.ok(source.includes(preset), `missing preset ${preset}`);
  }
});

test('compress-video script deletion happens before support and export success proof', () => {
  const source = read(scriptPath);
  const text = doc();

  const removeIndex = source.indexOf('try fileManager.removeItem(at: outputURL)');
  const supportIndex = source.indexOf('exporter.supportedFileTypes.contains(.mp4)');
  const optimizeIndex = source.indexOf('exporter.shouldOptimizeForNetworkUse = true');
  const modernExportIndex = source.indexOf('try await exporter.export(to: outputURL, as: .mp4)');
  const legacyExportIndex = source.indexOf('exporter.exportAsynchronously');

  assert.ok(removeIndex > -1, 'expected existing-output deletion');
  assert.ok(supportIndex > -1, 'expected .mp4 support check');
  assert.ok(optimizeIndex > -1, 'expected network optimization write');
  assert.ok(modernExportIndex > -1, 'expected modern export path');
  assert.ok(legacyExportIndex > -1, 'expected legacy export path');
  assert.ok(removeIndex < supportIndex, 'existing output deletion should still precede .mp4 support check');
  assert.ok(removeIndex < optimizeIndex, 'existing output deletion should still precede export setup');
  assert.ok(removeIndex < modernExportIndex, 'existing output deletion should still precede modern export');
  assert.ok(removeIndex < legacyExportIndex, 'existing output deletion should still precede legacy export');

  assert.match(source, /case \.failed:/);
  assert.match(source, /case \.cancelled:/);
  assert.match(source, /Unexpected exporter status/);
  assert.doesNotMatch(source, /\bdryRun\b|--dry-run/);
  assert.doesNotMatch(source, /\btemporary\b|temporaryDirectory|\.tmp/);
  assert.doesNotMatch(source, /\.moveItem|replaceItem/);

  assert.match(text, /delete existing output if present/);
  assert.match(text, /check whether exporter supports \.mp4/);
  assert.match(text, /write output through modern or legacy AVFoundation path/);
  assert.match(text, /existing output file can be removed before unsupported file type,\s+export failure, cancellation, process interruption, or unexpected status/);
  assert.match(text, /no current dry-run mode, no temporary output path, no\s+atomic move\/replace step/);
});

test('compress-video script is not currently wired into package build or website media manifests', () => {
  const text = doc();
  const packageScripts = Object.values(readJson('package.json').scripts || {}).join('\n');
  const build = read('build.js');
  const productSource = gitTrackedProductSource();
  const websiteRouteContent = read('website/components/route-content.js');
  const websiteAssetReadme = read('website/assets/videos/README.md');
  const websiteChangelog = read('docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md');

  assert.doesNotMatch(packageScripts, /compress-video/);
  assert.doesNotMatch(build, /compress-video/);
  assert.doesNotMatch(productSource, /scripts\/compress-video\.swift|compress-video\.swift|compress-video/);
  assert.match(websiteRouteContent, /\/videos\/homepage\/day\/homepage_hero_day\.mp4/);
  assert.match(websiteRouteContent, /\/videos\/ios\/ios_hero_slow_540\.mp4/);
  assert.match(websiteAssetReadme, /website\/public\/videos\/homepage\/day\/homepage_hero_day\.mp4/);
  assert.match(websiteChangelog, /ffmpeg -y -i website\/assets\/videos\/ios\/ios\.mp4/);
  assert.doesNotMatch(websiteChangelog, /compress-video\.swift/);

  for (const token of [
    'package.json scripts referencing compress-video: 0',
    'build.js compress-video references: 0',
    'tracked non-doc source callers outside scripts/compress-video.swift: 0'
  ]) {
    assert.ok(text.includes(token), `doc should pin integration token ${token}`);
  }
  assert.match(text, /`docs\/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG\.md` records an `ffmpeg` command/);
  assert.match(text, /No committed media manifest maps `scripts\/compress-video\.swift` inputs/);
});

test('compress-video future authority symbols remain absent from product source', () => {
  const text = doc();
  const source = gitTrackedProductSource();

  for (const missing of [
    'compressVideoFailureModeBoundaryContract',
    'compressVideoPresetManifest',
    'compressVideoOutputDestructionReport',
    'compressVideoDryRunPlan',
    'compressVideoTemporaryOutputContract',
    'compressVideoAtomicReplacementContract',
    'compressVideoSourceOutputManifest',
    'compressVideoPackageScriptGate',
    'compressVideoMediaBudgetReport',
    'compressVideoFailureFixtureProvenance'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(source.includes(missing), false, `${missing} should remain absent from product source`);
  }
});
