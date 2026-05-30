import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content/bridge_injection.js';
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function source() {
  return read(sourcePath);
}

function count(text, regex) {
  return [...text.matchAll(regex)].length;
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function groupForName(name) {
  if (name === 'debugLog') return 'bridgeInjectionDebugGlobalState';
  if (name === 'injectViaScriptingAPI') return 'bridgeInjectionBackgroundScripting';
  if (['injectViaFallback', 'injectNext'].includes(name)) return 'bridgeInjectionFallbackScriptDom';
  if (name === 'injectMainWorldScripts') return 'bridgeInjectionMainWorldOrchestration';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  source().split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    let match = line.match(/globalThis\.debugLog\s*=\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'functionExpression', name: match[1] });
      return;
    }
    match = line.match(/globalThis\.injectMainWorldScripts\s*=\s*async\s+function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'asyncFunctionExpression', name: match[1] });
      return;
    }
    match = line.match(/^\s*async\s+function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'asyncFunction', name: match[1] });
      return;
    }
    match = line.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'function', name: match[1] });
    }
  });
  return rows.map((row) => ({ ...row, group: groupForName(row.name) }));
}

function lineNumberAt(sourceText, index) {
  return sourceText.slice(0, index).split(/\r?\n/).length;
}

function broadCallableRows() {
  const sourceText = source();
  const lines = sourceText.split(/\r?\n/);
  const rows = [];
  let match;
  while ((match = broadCallableRe.exec(sourceText))) {
    const firstNonWhitespace = match[0].search(/\S/);
    const start = match.index + firstNonWhitespace;
    const line = lineNumberAt(sourceText, start);
    rows.push({
      line,
      name: match.slice(1).find(Boolean),
      sourceLine: lines[line - 1].trim()
    });
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function isolatedScripts(manifestFile) {
  const manifest = readJson(manifestFile);
  return manifest.content_scripts.find((entry) =>
    Array.isArray(entry.js) && entry.js.includes('js/content/bridge_injection.js')
  )?.js || [];
}

function webAccessibleResources(manifestFile) {
  const manifest = readJson(manifestFile);
  return manifest.web_accessible_resources.flatMap((entry) => entry.resources || []);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function createScriptDocument() {
  const appended = [];
  function append(target, node) {
    appended.push({ target, node });
    return node;
  }
  const document = {
    head: {
      appendChild(node) {
        return append('head', node);
      }
    },
    documentElement: {
      appendChild(node) {
        return append('documentElement', node);
      }
    },
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        src: '',
        onload: null,
        onerror: null,
        removed: false,
        remove() {
          this.removed = true;
        }
      };
    }
  };
  return { appended, document };
}

function runBridgeInjection(options = {}) {
  const messages = [];
  const timers = [];
  const settingsRequests = [];
  const { appended, document } = createScriptDocument();
  const runtime = {
    lastError: null,
    getURL(pathname) {
      return `${options.firefox ? 'moz-extension' : 'chrome-extension'}://filtertube/${pathname}`;
    },
    sendMessage(message, callback) {
      messages.push(message);
      runtime.lastError = options.lastError || null;
      if (callback) callback(options.response);
      runtime.lastError = null;
    }
  };
  const api = { runtime };
  if (options.scripting !== false) {
    api.scripting = {
      executeScript() {
      }
    };
  }

  const context = {
    document,
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    },
    requestSettingsFromBackground() {
      settingsRequests.push('requested');
    }
  };
  if (options.firefox) {
    context.browser = api;
  } else {
    context.chrome = api;
  }

  vm.createContext(context);
  vm.runInContext(source(), context, { filename: sourcePath });

  return { appended, api, context, messages, settingsRequests, timers };
}

test('bridge injection method semantic register is audit-only and source scoped', () => {
  const text = doc();
  const bridge = source();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content\/bridge_injection\.js/);
  assert.equal(sourceLineCount(bridge), 127);
  assert.match(text, /line count: 127/);
  assert.equal(readBuffer(sourcePath).length, 4741);
  assert.match(text, /source bytes: 4741/);
  assert.equal(sha256(sourcePath), 'd1b84cf4c43ec5ff5cdc3bd607d8f3d3bf448c12829780b0d05fb9fc14fb5d3e');
  assert.match(text, /source sha256: d1b84cf4c43ec5ff5cdc3bd607d8f3d3bf448c12829780b0d05fb9fc14fb5d3e/);
  assert.match(text, /repo-wide broad parser lexical callable matches: 12/);
  assert.match(text, /runtime method\/helper declarations in scope: 5/);
  assert.match(text, /broad-parser runtime declarations in scope: 3/);
  assert.match(text, /assignment-expression method declarations outside broad parser: 2/);
  assert.match(text, /control-flow lexical artifacts: 9/);
  assert.match(text, /file-local executable behavior rows: 4/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /named method\/helper declarations in scope: 5/);
  assert.match(text, /plain function declarations: 1/);
  assert.match(text, /async function declarations: 2/);
  assert.match(text, /named function expression declarations: 1/);
  assert.match(text, /async named function expression declarations: 1/);
  assert.match(text, /const helper\/callback declarations: 0/);
  assert.match(text, /const arrow helper\/callback declarations: 0/);
  assert.match(text, /arrow callback sites in scope: 8/);
  assert.match(text, /semantic method groups: 4/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for script injection trust/);

  assert.equal(count(bridge, /^\s*function\s+[A-Za-z_$][\w$]*\s*\(/gm), 1);
  assert.equal(count(bridge, /^\s*async\s+function\s+[A-Za-z_$][\w$]*\s*\(/gm), 2);
  assert.equal(count(bridge, /globalThis\.debugLog\s*=\s*function\s+debugLog\s*\(/g), 1);
  assert.equal(count(bridge, /globalThis\.injectMainWorldScripts\s*=\s*async\s+function\s+injectMainWorldScripts\s*\(/g), 1);
  assert.equal(count(bridge, /=>/g), 8);
});

test('bridge injection register accounts for every current method row', () => {
  const text = doc();
  const rows = methodRows();
  const broadRows = broadCallableRows();

  assert.equal(rows.length, 5);
  assert.deepEqual(broadRows.map((row) => row.name), [
    'if',
    'if',
    'injectViaScriptingAPI',
    'if',
    'injectViaFallback',
    'injectNext',
    'if',
    'if',
    'if',
    'if',
    'if',
    'if'
  ]);
  assert.deepEqual(countBy(rows, 'kind'), {
    asyncFunction: 2,
    asyncFunctionExpression: 1,
    function: 1,
    functionExpression: 1
  });
  assert.deepEqual(countBy(rows, 'group'), {
    bridgeInjectionBackgroundScripting: 1,
    bridgeInjectionDebugGlobalState: 1,
    bridgeInjectionFallbackScriptDom: 2,
    bridgeInjectionMainWorldOrchestration: 1
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing bridge injection method row ${row.kind}:${row.name}:${row.line}`
    );
  }

  assert.match(text, /## Lexical Callable Reconciliation/);
  assert.match(text, /the 12 broad-parser matches reconcile to\s+3 runtime declarations and 9 control-flow artifacts/i);
  assert.match(text, /`debugLog` and\s+`injectMainWorldScripts` are real assignment-expression method declarations/);
  assert.match(text, /it does not promote the global method\s+proof count/);
  assert.match(text, /0 complete per-callable semantic files/);
  for (const token of [
    '| 25 | `if` | no | `if (typeof globalThis.currentSettings ===',
    '| 29 | `if` | no | `if (typeof globalThis.debugLog !==',
    '| 36 | `injectViaScriptingAPI` | yes | `async function injectViaScriptingAPI(scripts) {`',
    '| 42 | `if` | no | `if (api.runtime.lastError || !response?.success) {`',
    '| 51 | `injectViaFallback` | yes | `async function injectViaFallback(scripts) {`',
    '| 54 | `injectNext` | yes | `function injectNext() {`',
    '| 55 | `if` | no | `if (currentIndex >= scripts.length) {`',
    '| 76 | `if` | no | `if (bridgeState.scriptsInjected) {`',
    '| 79 | `if` | no | `if (bridgeState.injectionPromise) {`',
    '| 90 | `if` | no | `if (!isFirefox && api.scripting?.executeScript) {`',
    "| 98 | `if` | no | `if (typeof requestSettingsFromBackground === 'function') {`",
    '| 113 | `if` | no | `if (!bridgeState.scriptsInjected) {`'
  ]) {
    assert.ok(text.includes(token), `missing broad callable reconciliation token ${token}`);
  }
});

test('bridge injection register pins callback inventory and primitive counts', () => {
  const text = doc();
  const bridge = source();
  const expectedCallbacks = [
    [11, '(() =>', 'bridge bootstrap immediately'],
    [37, 'new Promise((resolve, reject) =>', 'background scripting request lifetime'],
    [41, 'sendMessage(..., (response) =>', 'runtime.lastError'],
    [52, 'new Promise((resolve, reject) =>', 'fallback sequential script tag injection lifetime'],
    [62, 'script.onload = () =>', 'setTimeout(injectNext, 50)'],
    [66, 'script.onerror = () =>', 'Failed to inject'],
    [84, '(async () =>', 'resets bridge state on failure'],
    [96, 'setTimeout(() =>', 'requestSettingsFromBackground()']
  ];

  for (const [line, callback, effectToken] of expectedCallbacks) {
    assert.ok(text.includes(`| ${line} | \`${callback}\` |`), `missing callback row ${line}`);
    assert.ok(text.includes(effectToken), `missing callback effect token ${effectToken}`);
  }

  const countPairs = [
    ['globalThis literal occurrences', countLiteral(bridge, 'globalThis')],
    ['bridgeState references', countLiteral(bridge, 'bridgeState')],
    ['scriptsInjected references', countLiteral(bridge, 'scriptsInjected')],
    ['injectionInProgress references', countLiteral(bridge, 'injectionInProgress')],
    ['injectionPromise references', countLiteral(bridge, 'injectionPromise')],
    ['browserAPI_BRIDGE references', countLiteral(bridge, 'browserAPI_BRIDGE')],
    ['IS_FIREFOX_BRIDGE references', countLiteral(bridge, 'IS_FIREFOX_BRIDGE')],
    ['currentSettings references', countLiteral(bridge, 'currentSettings')],
    ['debugLog references', countLiteral(bridge, 'debugLog')],
    ['injectMainWorldScripts references', countLiteral(bridge, 'injectMainWorldScripts')],
    ['requestSettingsFromBackground references', countLiteral(bridge, 'requestSettingsFromBackground')],
    ['api.runtime.sendMessage calls', countLiteral(bridge, 'api.runtime.sendMessage')],
    ['api.runtime.getURL calls', countLiteral(bridge, 'api.runtime.getURL')],
    ['api.scripting?.executeScript references', countLiteral(bridge, 'api.scripting?.executeScript')],
    ['document literal occurrences', countLiteral(bridge, 'document')],
    ['document.createElement calls', countLiteral(bridge, 'document.createElement')],
    ['document.head references', countLiteral(bridge, 'document.head')],
    ['document.documentElement references', countLiteral(bridge, 'document.documentElement')],
    ['appendChild calls', countLiteral(bridge, 'appendChild')],
    ['setTimeout calls', countLiteral(bridge, 'setTimeout')],
    ['addEventListener calls', countLiteral(bridge, 'addEventListener')],
    ['removeEventListener calls', countLiteral(bridge, 'removeEventListener')],
    ['MutationObserver references', countLiteral(bridge, 'MutationObserver')],
    ['postMessage calls', countLiteral(bridge, 'postMessage')],
    ['new Promise calls', countLiteral(bridge, 'new Promise')],
    ['Promise.resolve references', countLiteral(bridge, 'Promise.resolve')],
    ['new Error calls', countLiteral(bridge, 'new Error')],
    ['try blocks', count(bridge, /\btry\s*\{/g)],
    ['catch blocks', count(bridge, /\bcatch\s*\(/g)],
    ['finally blocks', countLiteral(bridge, 'finally')],
    ['await expressions', count(bridge, /\bawait\b/g)],
    ['script.onload assignments', countLiteral(bridge, 'script.onload')],
    ['script.onerror assignments', countLiteral(bridge, 'script.onerror')],
    ['scriptsToInject references', countLiteral(bridge, 'scriptsToInject')],
    ['shared/identity references', countLiteral(bridge, 'shared/identity')],
    ['filter_logic references', countLiteral(bridge, 'filter_logic')],
    ['seed references', countLiteral(bridge, 'seed')],
    ['injector references', countLiteral(bridge, 'injector')],
    ['browser word references', count(bridge, /\bbrowser\b/g)],
    ['chrome word references', count(bridge, /\bchrome\b/g)],
    ['isFirefox references', count(bridge, /\bisFirefox\b/g)],
    ['api references', count(bridge, /\bapi\b/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }
});

test('bridge injection register preserves manifest background and fallback entrypoint facts', () => {
  const text = doc();
  const background = read('js/background.js');
  const injectScriptsBlock = sliceBetween(
    background,
    '} else if (request.action === "injectScripts")',
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')"
  );

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const scripts = isolatedScripts(manifestFile);
    assert.ok(scripts.includes('js/content/block_channel.js'), `${manifestFile} missing block channel`);
    assert.ok(scripts.includes('js/content/bridge_injection.js'), `${manifestFile} missing bridge injection`);
    assert.ok(scripts.includes('js/content/bridge_settings.js'), `${manifestFile} missing bridge settings`);
    assert.ok(scripts.includes('js/content_bridge.js'), `${manifestFile} missing content bridge`);
    assert.ok(
      scripts.indexOf('js/content/block_channel.js') < scripts.indexOf('js/content/bridge_injection.js'),
      `${manifestFile} should load block_channel before bridge_injection`
    );
    assert.ok(
      scripts.indexOf('js/content/bridge_injection.js') < scripts.indexOf('js/content/bridge_settings.js'),
      `${manifestFile} should load bridge_injection before bridge_settings`
    );
    assert.ok(
      scripts.indexOf('js/content/bridge_injection.js') < scripts.indexOf('js/content_bridge.js'),
      `${manifestFile} should load bridge_injection before content_bridge`
    );
    for (const resource of ['js/injector.js', 'js/filter_logic.js', 'js/seed.js', 'js/shared/identity.js']) {
      assert.ok(webAccessibleResources(manifestFile).includes(resource), `${manifestFile} missing ${resource}`);
    }
  }

  assert.equal(readJson('manifest.json').content_scripts[0].js[0], 'js/seed.js');
  assert.equal(readJson('manifest.json').content_scripts[0].world, 'MAIN');
  assert.equal(readJson('manifest.chrome.json').content_scripts[0].js[0], 'js/seed.js');
  assert.equal(readJson('manifest.chrome.json').content_scripts[0].world, 'MAIN');
  assert.equal(readJson('manifest.opera.json').content_scripts[0].js[0], 'js/seed.js');
  assert.equal(readJson('manifest.firefox.json').content_scripts.length, 1);

  assert.match(injectScriptsBlock, /const tabId = Number\(sender\?\.tab\?\.id\)/);
  assert.match(injectScriptsBlock, /const frameId = Number\(sender\?\.frameId\)/);
  assert.match(injectScriptsBlock, /\.map\(\(scriptName\) => scriptName\.startsWith\('js\/'\) \? scriptName : `js\/\$\{scriptName\}\.js`\)/);
  assert.match(injectScriptsBlock, /browserAPI\.scripting\.executeScript\(\{/);
  assert.match(injectScriptsBlock, /world: 'MAIN'/);

  const requiredDocTokens = [
    'manifest order: block_channel.js before bridge_injection.js before bridge_settings.js before content_bridge.js',
    'Chromium content script world: ISOLATED for bridge_injection.js',
    'default/chrome seed content script: js/seed.js in MAIN world before isolated bridge scripts',
    'Firefox seed behavior: seed is not a separate MAIN-world manifest entry',
    'Opera seed behavior: js/seed.js is a separate first content script without an explicit world declaration',
    'web-accessible scripts required by fallback: js/shared/identity.js, js/filter_logic.js, js/seed.js, js/injector.js',
    'background injectScripts path: maps request.scripts to js/*.js files and calls browserAPI.scripting.executeScript',
    'fallback script cleanup path: none',
    'fallback load spacing: setTimeout(injectNext, 50)',
    'post-injection settings replay: setTimeout(..., 100) calls requestSettingsFromBackground() when available'
  ];

  for (const token of requiredDocTokens) {
    assert.ok(text.includes(token), `missing bridge injection entrypoint token ${token}`);
  }
});

test('bridge injection register pins current behavior boundaries and missing authorities', async () => {
  const text = doc();
  const bridge = source();
  const scriptingPath = sliceBetween(bridge, 'async function injectViaScriptingAPI(scripts)', 'async function injectViaFallback(scripts)');
  const fallbackPath = sliceBetween(bridge, 'async function injectViaFallback(scripts)', 'globalThis.injectMainWorldScripts');
  const orchestrationPath = sliceBetween(bridge, 'globalThis.injectMainWorldScripts', '})();');

  assert.match(scriptingPath, /api\.runtime\.sendMessage\(\{\s*action: "injectScripts",\s*scripts: scripts/s);
  assert.match(scriptingPath, /api\.runtime\.lastError \|\| !response\?\.success/);
  assert.match(scriptingPath, /reject\(new Error\(api\.runtime\.lastError\?\.message \|\| response\?\.error\)\)/);

  assert.match(fallbackPath, /document\.createElement\('script'\)/);
  assert.match(fallbackPath, /script\.src = api\.runtime\.getURL\(`js\/\$\{scriptName\}\.js`\)/);
  assert.match(fallbackPath, /script\.onload = \(\) => \{\s*currentIndex\+\+;\s*setTimeout\(injectNext, 50\);/s);
  assert.match(fallbackPath, /script\.onerror = \(\) => \{\s*reject\(new Error\(`Failed to inject \$\{scriptName\}`\)\);/s);
  assert.match(fallbackPath, /\(document\.head \|\| document\.documentElement\)\.appendChild\(script\)/);
  assert.doesNotMatch(fallbackPath, /\.remove\(/);

  assert.match(orchestrationPath, /const scriptsToInject = \['shared\/identity', 'filter_logic'\]/);
  assert.match(orchestrationPath, /if \(isFirefox\) scriptsToInject\.push\('seed'\)/);
  assert.match(orchestrationPath, /scriptsToInject\.push\('injector'\)/);
  assert.match(orchestrationPath, /if \(!isFirefox && api\.scripting\?\.executeScript\)/);
  assert.match(orchestrationPath, /await injectViaScriptingAPI\(scriptsToInject\)/);
  assert.match(orchestrationPath, /await injectViaFallback\(scriptsToInject\)/);
  assert.match(orchestrationPath, /bridgeState\.scriptsInjected = true/);
  assert.match(orchestrationPath, /setTimeout\(\(\) => \{[\s\S]*requestSettingsFromBackground\(\)/);
  assert.match(orchestrationPath, /bridgeState\.scriptsInjected = false/);
  assert.match(orchestrationPath, /bridgeState\.injectionPromise = null/);

  for (const token of [
    'script list base: [',
    'Firefox-only script addition: seed',
    'final script addition: injector',
    'fallback append target: document.head || document.documentElement',
    'fallback script removal after load: absent',
    'duplicate injection success behavior: returns existing injectionPromise or Promise.resolve()',
    'duplicate in-progress behavior: returns existing injectionPromise',
    'successful injection settings handoff: fixed 100ms timer',
    "settings handoff readiness proof: checks only typeof requestSettingsFromBackground === 'function'",
    'explicit retry budget: absent',
    'explicit sender/capability token: absent',
    'explicit script allowlist token in bridge file: absent'
  ]) {
    assert.ok(text.includes(token), `missing bridge injection boundary token ${token}`);
  }

  const chromiumSuccess = runBridgeInjection({ response: { success: true } });
  assert.equal(chromiumSuccess.context.IS_FIREFOX_BRIDGE, false);
  assert.equal(chromiumSuccess.context.browserAPI_BRIDGE, chromiumSuccess.api);
  assert.equal(chromiumSuccess.context.currentSettings, null);
  chromiumSuccess.context.debugLog('probe');
  assert.equal(chromiumSuccess.context.__filtertubeBridgeState.debugSequence, 1);
  const firstPromise = chromiumSuccess.context.injectMainWorldScripts();
  const secondPromise = chromiumSuccess.context.injectMainWorldScripts();
  await Promise.all([firstPromise, secondPromise]);
  assert.equal(chromiumSuccess.messages.length, 1);
  assert.equal(chromiumSuccess.messages[0].action, 'injectScripts');
  assert.deepEqual([...chromiumSuccess.messages[0].scripts], ['shared/identity', 'filter_logic', 'injector']);
  assert.equal(chromiumSuccess.context.__filtertubeBridgeState.scriptsInjected, true);
  assert.equal(chromiumSuccess.context.__filtertubeBridgeState.injectionInProgress, false);
  assert.equal(chromiumSuccess.timers.length, 1);
  assert.equal(chromiumSuccess.timers[0].delay, 100);
  chromiumSuccess.timers[0].callback();
  assert.equal(chromiumSuccess.settingsRequests.length, 1);

  const chromiumFailure = runBridgeInjection({
    response: { success: false, error: 'background denied injection' }
  });
  await assert.rejects(
    chromiumFailure.context.injectMainWorldScripts(),
    /background denied injection/
  );
  assert.equal(chromiumFailure.context.__filtertubeBridgeState.scriptsInjected, false);
  assert.equal(chromiumFailure.context.__filtertubeBridgeState.injectionPromise, null);
  assert.equal(chromiumFailure.context.__filtertubeBridgeState.injectionInProgress, false);
  assert.equal(chromiumFailure.context.__filtertubeBridgeState.debugSequence, 1);

  const firefoxFallback = runBridgeInjection({ firefox: true, scripting: false });
  const fallbackPromise = firefoxFallback.context.injectMainWorldScripts();
  const expectedFallbackScripts = [
    'shared/identity',
    'filter_logic',
    'seed',
    'injector'
  ];
  for (const [index, scriptName] of expectedFallbackScripts.entries()) {
    assert.equal(firefoxFallback.appended.length, index + 1);
    const appended = firefoxFallback.appended[index];
    assert.equal(appended.target, 'head');
    assert.equal(appended.node.src, `moz-extension://filtertube/js/${scriptName}.js`);
    assert.equal(appended.node.removed, false);
    appended.node.onload();
    assert.equal(firefoxFallback.timers.at(-1).delay, 50);
    firefoxFallback.timers.at(-1).callback();
  }
  await fallbackPromise;
  assert.equal(firefoxFallback.context.IS_FIREFOX_BRIDGE, true);
  assert.equal(firefoxFallback.context.__filtertubeBridgeState.scriptsInjected, true);
  assert.equal(firefoxFallback.appended.length, 4);
  assert.equal(firefoxFallback.appended.every(({ node }) => node.removed === false), true);
  assert.equal(firefoxFallback.timers.filter((timer) => timer.delay === 50).length, 4);
  assert.equal(firefoxFallback.timers.at(-1).delay, 100);
  firefoxFallback.timers.at(-1).callback();
  assert.equal(firefoxFallback.settingsRequests.length, 1);

  for (const token of [
    'Chromium executable proof: one successful injectMainWorldScripts() call sends injectScripts for shared/identity, filter_logic, and injector',
    'Chromium executable proof: a duplicate in-progress injectMainWorldScripts() call reuses the same promise and sends no second injectScripts message',
    'Chromium executable proof: failed background injection rejects, clears injectionPromise, leaves scriptsInjected false, and calls debugLog once',
    'Firefox fallback executable proof: appends shared/identity, filter_logic, seed, and injector script tags in order with 50ms load spacing',
    'Firefox fallback executable proof: fallback script tags are not removed after load and successful injection schedules the same 100ms settings request timer'
  ]) {
    assert.ok(text.includes(token), `missing executable proof token ${token}`);
  }

  const runtime = productRuntimeSource();
  for (const missingAuthority of [
    'bridgeInjectionMethodAuthority',
    'bridgeInjectionScriptManifest',
    'bridgeInjectionMainWorldLoadOrderContract',
    'bridgeInjectionSenderContract',
    'bridgeInjectionFallbackDomLifecycleReport',
    'bridgeInjectionRetryBudget',
    'bridgeInjectionSettingsReplayContract',
    'bridgeInjectionGlobalAliasContract',
    'bridgeInjectionFixtureProvenance'
  ]) {
    assert.match(text, new RegExp(missingAuthority));
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});
