import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('../../scripts/build-lock.cjs');
const { acquireBuildLock } = require(modulePath);

test('another process cannot acquire the shared lock until packaging finishes', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-build-lock-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const lockPath = path.join(directory, 'lock');
  const release = acquireBuildLock(lockPath);
  const child = spawnSync(process.execPath, ['-e',
    'const {acquireBuildLock}=require(process.argv[1]); const release=acquireBuildLock(process.argv[2]); release();',
    modulePath, lockPath], { encoding: 'utf8' });
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /Another FilterTube build owns/);
  assert.ok(fs.existsSync(lockPath));
  release();
  release();
  acquireBuildLock(lockPath)();
  assert.equal(fs.existsSync(lockPath), false);
});

test('unreadable or stale owner metadata never permits silent lock replacement', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'filtertube-build-lock-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const lockPath = path.join(directory, 'lock');
  fs.writeFileSync(lockPath, 'incomplete metadata');
  assert.throws(() => acquireBuildLock(lockPath), /confirm no build is running/);
  assert.equal(fs.readFileSync(lockPath, 'utf8'), 'incomplete metadata');
});

test('build acquires the shared lock before UI, cleanup and asynchronous ZIP work', () => {
  const source = fs.readFileSync(new URL('../../build.js', import.meta.url), 'utf8');
  const main = source.slice(source.indexOf('async function main()'), source.indexOf('async function buildTargets()'));
  assert.ok(main.indexOf('acquireBuildLock(') < main.indexOf('await buildTargets()'));
  assert.match(main, /finally\s*\{\s*releaseLock\(\)/);
  assert.match(main, /SIGINT/);
  assert.match(main, /SIGTERM/);
});
