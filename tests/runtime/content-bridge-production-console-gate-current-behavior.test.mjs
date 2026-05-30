import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const sourcePath = 'js/content_bridge.js';

function readSource() {
  return fs.readFileSync(path.join(repoRoot, sourcePath), 'utf8');
}

function bootConsoleGate({ debug = false } = {}) {
  const source = readSource();
  const helperEndMarker = 'function isFilterTubeNativeOverlayQuietMode';
  const helperEnd = source.indexOf(helperEndMarker);
  const gateStart = source.indexOf('const filterTubeRawConsole = (() => {');
  const gateEnd = source.indexOf("window.addEventListener('message'");
  assert.ok(helperEnd > 0, 'expected debug helper slice marker');
  assert.ok(gateStart > helperEnd, 'expected console gate start marker');
  assert.ok(gateEnd > gateStart, 'expected console gate end marker');

  const calls = {
    log: [],
    debug: [],
    warn: [],
    error: []
  };
  const context = {
    window: {
      __filtertubeDebug: debug
    },
    document: {
      documentElement: {
        getAttribute(name) {
          return name === 'data-filtertube-debug' && debug ? 'true' : null;
        }
      }
    },
    console: {
      log: (...args) => calls.log.push(args),
      debug: (...args) => calls.debug.push(args),
      warn: (...args) => calls.warn.push(args),
      error: (...args) => calls.error.push(args)
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    `${source.slice(0, helperEnd)}\n${source.slice(gateStart, gateEnd)}`,
    context,
    { filename: sourcePath }
  );
  return { context, calls };
}

test('content_bridge installs an isolated-world production console gate for log/debug only', () => {
  const source = readSource();

  assert.match(source, /const filterTubeRawConsole = \(\(\) => \{/);
  assert.match(source, /function installFilterTubeProductionConsoleGate\(\)/);
  assert.match(source, /window\.__filtertubeContentBridgeConsoleGateInstalled === true/);
  assert.match(source, /console\['log'\] = function filterTubeProductionLogGate/);
  assert.match(source, /console\['debug'\] = function filterTubeProductionDebugGate/);
  assert.doesNotMatch(source, /console\['warn'\]\s*=/);
  assert.doesNotMatch(source, /console\['error'\]\s*=/);
});

test('content_bridge production console gate suppresses log/debug when debug is disabled', () => {
  const { context, calls } = bootConsoleGate({ debug: false });

  context.console.log('hidden log');
  context.console.debug('hidden debug');
  context.console.warn('kept warn');
  context.console.error('kept error');

  assert.deepEqual(calls.log, []);
  assert.deepEqual(calls.debug, []);
  assert.deepEqual(calls.warn, [['kept warn']]);
  assert.deepEqual(calls.error, [['kept error']]);
});

test('content_bridge production console gate allows log/debug when debug is enabled', () => {
  const { context, calls } = bootConsoleGate({ debug: true });
  calls.log.length = 0;
  calls.debug.length = 0;

  context.console.log('visible log');
  context.console.debug('visible debug');

  assert.deepEqual(calls.log, [['visible log']]);
  assert.deepEqual(calls.debug, [['visible debug']]);
});

test('content_bridge debug helper uses captured raw console after production gate installation', () => {
  const { context, calls } = bootConsoleGate({ debug: false });

  context.filterTubeDebugLog('still hidden');
  assert.deepEqual(calls.log, []);

  context.window.__filtertubeDebug = true;
  context.filterTubeDebugLog('visible helper');
  assert.deepEqual(calls.log, [['FilterTube:', 'visible helper']]);
});
