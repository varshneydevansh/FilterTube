import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STARTUP_INJECTION_READINESS_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function functionBody(source, name) {
  const index = source.indexOf(`function ${name}`);
  assert.notEqual(index, -1, `missing function ${name}`);
  const brace = source.indexOf('{', index);
  assert.notEqual(brace, -1, `missing body for ${name}`);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(index, i + 1);
    }
  }
  throw new Error(`unterminated function ${name}`);
}

test('startup injection readiness audit documents current behavior and future authority gate', () => {
  const doc = read(docPath);

  for (const marker of [
    'Status: current-behavior proof',
    'This is not an implementation patch',
    'startupInjectionAuthority',
    'Current Boot Path',
    'Required Future Contract',
    'Blocked now'
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }

  for (const risk of [
    'Firefox fallback injection',
    'Settings request after injection',
    'Injector bridge ready',
    'Full injector ready',
    'Duplicate injector execution'
  ]) {
    assert.ok(doc.includes(risk), `doc missing risk row ${risk}`);
  }
});

test('bridge injection idempotence is isolated-world state without startup authority report', () => {
  const bridge = read('js/content/bridge_injection.js');

  assert.match(bridge, /globalThis\.__filtertubeBridgeState \|\| \(globalThis\.__filtertubeBridgeState = \{/);
  for (const key of ['scriptsInjected', 'injectionInProgress', 'injectionPromise']) {
    assert.ok(bridge.includes(key), `bridge state missing ${key}`);
  }

  assert.doesNotMatch(bridge, /startupInjectionAuthority|startupAuthority|injectionReadinessReport/);
});

test('firefox fallback appends page scripts with sequential timeout and no structured ready report', () => {
  const bridge = read('js/content/bridge_injection.js');
  const fallback = functionBody(bridge, 'injectViaFallback');

  assert.match(fallback, /document\.createElement\('script'\)/);
  assert.match(fallback, /script\.src = api\.runtime\.getURL\(`js\/\$\{scriptName\}\.js`\)/);
  assert.match(fallback, /script\.onload = \(\) => \{/);
  assert.match(fallback, /setTimeout\(injectNext, 50\)/);
  assert.match(fallback, /script\.onerror = \(\) => \{\s*reject\(new Error\(`Failed to inject \$\{scriptName\}`\)\)/);
  assert.match(fallback, /\(document\.head \|\| document\.documentElement\)\.appendChild\(script\)/);
  assert.doesNotMatch(fallback, /fallbackInjectionReady|scriptLoadResult|startupInjectionAuthority/);
});

test('injectMainWorldScripts injects seed only for firefox fallback and requests settings from a timer', () => {
  const bridge = read('js/content/bridge_injection.js');
  const injector = functionBody(bridge, 'injectMainWorldScripts');

  assert.match(injector, /const scriptsToInject = \['shared\/identity', 'filter_logic'\]/);
  assert.match(injector, /if \(isFirefox\) scriptsToInject\.push\('seed'\)/);
  assert.match(injector, /scriptsToInject\.push\('injector'\)/);
  assert.match(injector, /if \(!isFirefox && api\.scripting\?\.executeScript\)/);
  assert.match(injector, /await injectViaScriptingAPI\(scriptsToInject\)/);
  assert.match(injector, /await injectViaFallback\(scriptsToInject\)/);
  assert.match(injector, /setTimeout\(\(\) => \{\s*try \{\s*if \(typeof requestSettingsFromBackground === 'function'\)/s);
  assert.match(injector, /\}, 100\)/);
});

test('content bridge starts initialization from a fixed timer then settings-gates MAIN-world runtime', () => {
  const contentBridge = read('js/content_bridge.js');

  assert.match(contentBridge, /window\.addEventListener\('message', handleMainWorldMessages, false\)/);
  assert.match(contentBridge, /setTimeout\(\(\) => initialize\(\), 50\)/);
  assert.match(contentBridge, /async function initialize\(\) \{[\s\S]*const response = await requestSettingsFromBackground\(\);[\s\S]*await ensureMainWorldRuntimeForSettings\(response\.settings\);[\s\S]*initializeDOMFallback\(response\.settings\)/);
  assert.match(contentBridge, /function needsMainWorldRuntimeWork\(settings\) \{[\s\S]*if \(settings\.enabled === false\) return false;[\s\S]*if \(settings\.listMode === 'whitelist'\) return true;[\s\S]*return hasBridgeEnabledContentFilters\(settings\) \|\| hasBridgeActiveJsonFilterRules\(settings\);/);
  assert.match(contentBridge, /async function initializeDOMFallback\(settings\) \{[\s\S]*await new Promise\(resolve => setTimeout\(resolve, 1000\)\)/);
  assert.doesNotMatch(contentBridge, /async function initialize\(\) \{[\s\S]{0,300}await injectMainWorldScripts\(\);/);
  assert.doesNotMatch(contentBridge, /startupInjectionAuthority|firstDomFallbackAllowed|startupReadinessReport/);
});

test('content bridge reacts to full injector ready but not injector bridge ready', () => {
  const contentBridge = read('js/content_bridge.js');
  const handlerStart = contentBridge.indexOf('function handleMainWorldMessages');
  const initializeStart = contentBridge.indexOf('async function initialize()');
  assert.ok(handlerStart >= 0 && initializeStart > handlerStart, 'expected main-world message handler before initialize');
  const handler = contentBridge.slice(handlerStart, initializeStart);

  assert.match(handler, /if \(type === 'FilterTube_InjectorToBridge_Ready'\) \{\s*requestSettingsFromBackground\(\);/);
  assert.doesNotMatch(handler, /FilterTube_InjectorBridgeReady/);
});

test('injector bridge ready and full engine ready are separate page messages today', () => {
  const injector = read('js/injector.js');

  assert.match(injector, /window\.filterTubeInjectorBridgeReady = true;\s*window\.postMessage\(\{\s*type: 'FilterTube_InjectorBridgeReady'/);
  assert.match(injector, /const engineCheckInterval = setInterval\(\(\) => \{/);
  assert.match(injector, /if \(window\.FilterTubeEngine\?\.processData\) \{/);
  assert.match(injector, /window\.ftInitialized = true;/);
  assert.match(injector, /window\.dispatchEvent\(new CustomEvent\('filterTubeReady'\)\)/);
  assert.match(injector, /type: 'FilterTube_InjectorToBridge_Ready'/);
  assert.match(injector, /\}, 100\)/);
  assert.match(injector, /setTimeout\(\(\) => \{\s*clearInterval\(engineCheckInterval\);[\s\S]*\}, 5000\)/);
});

test('duplicate injector execution reposts readiness messages conditionally', () => {
  const injector = read('js/injector.js');
  const guardIndex = injector.indexOf('if (window.filterTubeInjectorHasRun)');
  const runFlagIndex = injector.indexOf('window.filterTubeInjectorHasRun = true');
  assert.ok(guardIndex >= 0 && runFlagIndex > guardIndex, 'expected duplicate guard before run flag');
  const guard = injector.slice(guardIndex, runFlagIndex);

  assert.match(guard, /if \(window\.filterTubeInjectorBridgeReady === true \|\| window\.ftInitialized === true \|\| window\.FilterTubeEngine\?\.processData\)/);
  assert.match(guard, /type: 'FilterTube_InjectorBridgeReady'/);
  assert.match(guard, /type: 'FilterTube_InjectorToBridge_Ready'/);
  assert.match(guard, /return;/);
});
