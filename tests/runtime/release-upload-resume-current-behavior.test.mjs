import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');
const build = fs.readFileSync(path.join(repoRoot, 'build.js'), 'utf8');

test('release publishing resumes existing tags and uploads only missing assets', () => {
  assert.match(build, /githubReleaseExists\(githubAuth, tagName\)/);
  assert.match(build, /Resuming existing GitHub release/);
  assert.match(build, /missingAssetPaths = releaseAssetPaths\.filter/);
  assert.match(build, /uploadGitHubReleaseAssets\(githubAuth, tagName, missingAssetPaths\)/);
  assert.match(build, /Release upload incomplete; missing:/);
});

test('new releases stay draft until every expected asset is verified', () => {
  const createIndex = build.indexOf('createDraftGitHubRelease(githubAuth');
  const verifyIndex = build.indexOf('const stillMissing = releaseAssetPaths');
  const publishIndex = build.indexOf('publishDraftGitHubRelease(githubAuth, tagName)');

  assert.ok(createIndex >= 0);
  assert.ok(verifyIndex > createIndex);
  assert.ok(publishIndex > verifyIndex);
  assert.match(build, /'--draft'/);
  assert.match(build, /'--draft=false'/);
});

test('release assets use GitHub CLI transport rather than a raw Node request stream', () => {
  assert.match(build, /'release', 'upload', tagName/);
  assert.doesNotMatch(build, /fs\.createReadStream\(filePath\)\.pipe\(req\)/);
  assert.doesNotMatch(build, /https\.request\(uploadUrl/);
});

test('only an explicit not-found response permits release creation', () => {
  assert.match(build, /if \(\/release not found\/i\.test\(details\)\)/);
  assert.match(build, /throw err;/);
});
