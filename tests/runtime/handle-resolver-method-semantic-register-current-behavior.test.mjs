import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/content/handle_resolver.js';
const manifestPath = 'manifest.json';
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
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

function broadCallableRows() {
  const source = read(sourcePath);
  const rows = [];
  let match;
  while ((match = broadCallableRe.exec(source))) {
    rows.push(match.slice(1).find(Boolean));
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function groupForMethod(name) {
  if (name === 'persistChannelMappings') return 'handleResolverMappingPersistence';
  if ([
    'normalizeHandleGlyphs',
    'extractRawHandle',
    'normalizeHandleValue',
    'extractHandleFromString'
  ].includes(name)) return 'handleResolverNormalization';
  if (name === 'scheduleDomFallbackRerun') return 'handleResolverDomFallbackRerun';
  if (name === 'fetchIdForHandle') return 'handleResolverFetchAndCache';
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  read(sourcePath).split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    let match = line.match(/^async\s+function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'asyncFunction', name: match[1] });
      return;
    }
    match = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'function', name: match[1] });
    }
  });
  return rows.map((row) => ({ ...row, group: groupForMethod(row.name) }));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function countRegex(source, regex) {
  return (source.match(regex) || []).length;
}

function sourceLineCount() {
  const source = read(sourcePath);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function createHandleResolverRuntime({
  storageChannelMap = {},
  runtimeResponses = [],
  fetchResponses = [],
  identity = null,
  debug = false
} = {}) {
  const events = {
    runtimeMessages: [],
    storageGets: [],
    fetches: [],
    postMessages: [],
    timers: new Map(),
    domFallbacks: [],
    consoleLogs: [],
    consoleWarns: []
  };
  let timerId = 0;
  const context = {
    console: {
      log: (...args) => events.consoleLogs.push(args),
      warn: (...args) => events.consoleWarns.push(args)
    },
    currentSettings: {
      channelMap: {}
    },
    browserAPI_BRIDGE: {
      runtime: {
        sendMessage(payload, callback) {
          events.runtimeMessages.push(payload);
          const response = runtimeResponses.length ? runtimeResponses.shift() : null;
          callback?.(response);
          return Promise.resolve(response);
        }
      },
      storage: {
        local: {
          async get(keys) {
            events.storageGets.push(keys);
            return { channelMap: { ...storageChannelMap } };
          }
        }
      }
    },
    applyDOMFallback(settings, options) {
      events.domFallbacks.push({ settings, options });
    },
    postMessage(message, target) {
      events.postMessages.push({ message, target });
    },
    setTimeout(callback, delay) {
      const id = ++timerId;
      events.timers.set(id, { callback, delay });
      return id;
    },
    async fetch(pathname, options) {
      events.fetches.push({ pathname, options });
      const response = fetchResponses.length ? fetchResponses.shift() : { ok: false, text: '' };
      return {
        ok: Boolean(response.ok),
        async text() {
          return String(response.text || '');
        }
      };
    },
    __filtertubeDebug: debug
  };
  if (identity) context.FilterTubeIdentity = identity;
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read(sourcePath), context);

  return {
    context,
    events,
    evaluate(expression) {
      return vm.runInContext(expression, context);
    },
    runTimer(id) {
      const timer = events.timers.get(id);
      assert.ok(timer, `missing timer ${id}`);
      return timer.callback();
    },
    async flush() {
      await Promise.resolve();
      await new Promise((resolve) => setImmediate(resolve));
    }
  };
}

test('handle resolver method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/content\/handle_resolver\.js/);
  assert.match(text, /line count: 282/);
  assert.equal(sourceLineCount(), 282);
  assert.match(text, /source bytes: 9785/);
  assert.equal(readBuffer(sourcePath).byteLength, 9785);
  assert.match(text, /source sha256: 67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff/);
  assert.equal(sha256(sourcePath), '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff');
  assert.match(text, /repo-wide broad parser lexical callable matches: 22/);
  assert.match(text, /broad parser runtime callable\/declaration matches: 7/);
  assert.match(text, /assignment-expression function declarations outside broad parser: 0/);
  assert.match(text, /control-flow lexical artifacts: 15/);
  assert.match(text, /file-local executable proof probes: 5/);
  assert.match(text, /global method proof count promoted: 0/);
  assert.match(text, /named method\/helper declarations in scope: 7/);
  assert.match(text, /plain function declarations: 6/);
  assert.match(text, /async function declarations: 1/);
  assert.match(text, /const helper\/callback declarations: 0/);
  assert.match(text, /const arrow helper\/callback declarations: 0/);
  assert.match(text, /arrow callback sites in scope: 5/);
  assert.match(text, /semantic method groups: 4/);
  assert.match(text, /browser\/global export: implicit isolated-world helper functions/);
  assert.match(text, /CommonJS export: none/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for resolver network authority/);
});

test('handle resolver method register accounts for every current declaration row', () => {
  const rows = methodRows();
  const broadRows = broadCallableRows();

  assert.equal(rows.length, 7);
  assert.equal(broadRows.length, 22);
  assert.equal(broadRows.filter((name) => rows.some((row) => row.name === name)).length, 7);
  assert.equal(broadRows.filter((name) => name === 'if').length, 13);
  assert.equal(broadRows.filter((name) => name === 'for').length, 2);
  assert.deepEqual(countBy(rows, 'kind'), {
    asyncFunction: 1,
    function: 6
  });
  assert.deepEqual(countBy(rows, 'group'), {
    handleResolverDomFallbackRerun: 1,
    handleResolverFetchAndCache: 1,
    handleResolverMappingPersistence: 1,
    handleResolverNormalization: 4
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
  }

  const text = doc();
  assert.match(text, /## Lexical Callable Reconciliation/);
  assert.match(text, /\| Plain function declarations \| 6 \| yes \|/);
  assert.match(text, /\| Async function declarations \| 1 \| yes \|/);
  assert.match(text, /\| Assignment function expression \| 0 \| no \|/);
  assert.match(text, /\| `if` artifacts \| 13 \| no \|/);
  assert.match(text, /\| `for` artifacts \| 2 \| no \|/);
  assert.match(text, /does not promote the global method proof\s+count/);
});

test('handle resolver method register preserves every source row', () => {
  const text = doc();

  for (const row of methodRows()) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing handle resolver method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('handle resolver register pins identity resolver message network and timer counts', () => {
  const text = doc();
  const source = read(sourcePath);

  assert.equal(countRegex(source, /=>/g), 5);
  assert.equal(countLiteral(source, 'document'), 0);
  assert.equal(countLiteral(source, 'window'), 5);
  assert.equal(countLiteral(source, 'location'), 0);
  assert.equal(countLiteral(source, 'globalThis'), 0);
  assert.equal(countLiteral(source, 'browserAPI_BRIDGE'), 4);
  assert.equal(countLiteral(source, 'currentSettings'), 8);
  assert.equal(countLiteral(source, 'applyDOMFallback'), 3);
  assert.equal(countLiteral(source, 'resolvedHandleCache'), 15);
  assert.equal(countLiteral(source, 'pendingDomFallbackRerunTimer'), 4);
  assert.equal(countLiteral(source, 'persistChannelMappings'), 2);
  assert.equal(countLiteral(source, 'normalizeHandleGlyphs'), 2);
  assert.equal(countLiteral(source, 'extractRawHandle'), 6);
  assert.equal(countLiteral(source, 'normalizeHandleValue'), 5);
  assert.equal(countLiteral(source, 'extractHandleFromString'), 2);
  assert.equal(countLiteral(source, 'scheduleDomFallbackRerun'), 3);
  assert.equal(countLiteral(source, 'fetchIdForHandle'), 2);
  assert.equal(countLiteral(source, 'FilterTube_UpdateChannelMap'), 2);
  assert.equal(countLiteral(source, 'fetchChannelDetails'), 1);
  assert.equal(countLiteral(source, 'updateChannelMap'), 1);
  assert.equal(countLiteral(source, 'channelMap'), 12);
  assert.equal(countLiteral(source, 'PENDING'), 4);
  assert.equal(countLiteral(source, 'skipNetwork'), 2);
  assert.equal(countLiteral(source, 'backgroundOnly'), 3);
  assert.equal(countLiteral(source, 'setTimeout'), 1);
  assert.equal(countLiteral(source, 'clearTimeout'), 0);
  assert.equal(countLiteral(source, 'setInterval'), 0);
  assert.equal(countLiteral(source, 'clearInterval'), 0);
  assert.equal(countLiteral(source, 'MutationObserver'), 0);
  assert.equal(countLiteral(source, 'observe('), 0);
  assert.equal(countLiteral(source, 'disconnect('), 0);
  assert.equal(countLiteral(source, 'addEventListener'), 0);
  assert.equal(countLiteral(source, 'removeEventListener'), 0);
  assert.equal(countLiteral(source, 'postMessage'), 2);
  assert.equal(countLiteral(source, 'browserAPI_BRIDGE.runtime.sendMessage'), 2);
  assert.equal(countLiteral(source, 'sendMessage'), 2);
  assert.equal(countLiteral(source, 'fetch('), 1);
  assert.equal(countLiteral(source, 'credentials'), 1);
  assert.equal(countLiteral(source, 'same-origin'), 1);
  assert.equal(countLiteral(source, 'decodeURIComponent'), 1);
  assert.equal(countLiteral(source, 'encodeURIComponent'), 1);
  assert.equal(countLiteral(source, 'console.warn'), 3);
  assert.equal(countLiteral(source, 'console.log'), 2);
  assert.equal(countLiteral(source, 'new Map'), 1);
  assert.equal(countLiteral(source, 'Array.isArray'), 1);
  assert.equal(countLiteral(source, 'forEach'), 2);
  assert.equal(countLiteral(source, 'browserAPI_BRIDGE.storage.local.get'), 1);
  assert.equal(countLiteral(source, 'response.text'), 1);
  assert.equal(countLiteral(source, 'text.match'), 1);

  for (const token of [
    'document literal occurrences: 0',
    'window literal occurrences: 5',
    'location literal occurrences: 0',
    'globalThis literal occurrences: 0',
    'browserAPI_BRIDGE references: 4',
    'currentSettings references: 8',
    'applyDOMFallback references: 3',
    'resolvedHandleCache references: 15',
    'pendingDomFallbackRerunTimer references: 4',
    'persistChannelMappings references: 2',
    'normalizeHandleGlyphs references: 2',
    'extractRawHandle references: 6',
    'normalizeHandleValue references: 5',
    'extractHandleFromString references: 2',
    'scheduleDomFallbackRerun references: 3',
    'fetchIdForHandle references: 2',
    'FilterTube_UpdateChannelMap references: 2',
    'fetchChannelDetails references: 1',
    'updateChannelMap references: 1',
    'channelMap references: 12',
    'PENDING token occurrences: 4',
    'skipNetwork token occurrences: 2',
    'backgroundOnly token occurrences: 3',
    'setTimeout calls: 1',
    'clearTimeout calls: 0',
    'setInterval calls: 0',
    'clearInterval calls: 0',
    'MutationObserver references: 0',
    'observe calls: 0',
    'disconnect calls: 0',
    'addEventListener calls: 0',
    'removeEventListener calls: 0',
    'postMessage calls: 2',
    'browserAPI_BRIDGE.runtime.sendMessage calls: 2',
    'sendMessage token occurrences: 2',
    'fetch calls: 1',
    'credentials token occurrences: 1',
    'same-origin token occurrences: 1',
    'decodeURIComponent references: 1',
    'encodeURIComponent references: 1',
    'console.warn references: 3',
    'console.log references: 2',
    'new Map references: 1',
    'Array.isArray references: 1',
    'forEach references: 2',
    'browserAPI_BRIDGE.storage.local.get references: 1',
    'response.text references: 1',
    'text.match references: 1'
  ]) {
    assert.ok(text.includes(token), `missing handle resolver count token ${token}`);
  }
});

test('handle resolver source still proves current resolver cache message and network boundaries', () => {
  const text = doc();
  const source = read(sourcePath);
  const manifest = JSON.parse(read(manifestPath));
  const isolatedScripts = manifest.content_scripts.find((entry) => entry.world === 'ISOLATED').js;

  assert.ok(isolatedScripts.indexOf('js/content/handle_resolver.js') > -1);
  assert.ok(isolatedScripts.indexOf('js/content/handle_resolver.js') < isolatedScripts.indexOf('js/content_bridge.js'));

  for (const token of [
    'const HANDLE_TERMINATOR_REGEX',
    'const HANDLE_GLYPH_NORMALIZERS',
    "action: \"updateChannelMap\"",
    'currentSettings.channelMap = {}',
    'map[idKey] = mapping.handle;',
    'map[handleKey] = mapping.id;',
    'window.FilterTubeIdentity?.extractRawHandle',
    'window.FilterTubeIdentity?.normalizeHandleValue',
    'const resolvedHandleCache = new Map();',
    'let pendingDomFallbackRerunTimer = 0;',
    'pendingDomFallbackRerunTimer = setTimeout(() => {',
    'applyDOMFallback(currentSettings, { forceReprocess: true });',
    'const { skipNetwork = false, backgroundOnly = false } = options;',
    "cached !== 'PENDING'",
    "browserAPI_BRIDGE.storage.local.get(['channelMap'])",
    "resolvedHandleCache.set(cleanHandle, 'PENDING');",
    "action: 'fetchChannelDetails'",
    "channelIdOrHandle: `@${networkHandleCore}`",
    "type: 'FilterTube_UpdateChannelMap'",
    "source: 'content_bridge'",
    "}, '*')",
    'const handlePaths = [',
    'response = await fetch(path, {',
    "credentials: 'same-origin'",
    "'Accept': 'text/html'",
    'const text = await response.text();',
    'const match = text.match(/channel\\/(UC[\\w-]{22})/);',
    'resolvedHandleCache.delete(cleanHandle);'
  ]) {
    assert.ok(source.includes(token), `missing current source token ${token}`);
  }

  for (const token of [
    'module entrypoint: manifest-loaded isolated-world content script before content_bridge.js',
    'implicit helper exports: persistChannelMappings, extractRawHandle, normalizeHandleValue, extractHandleFromString, fetchIdForHandle',
    'background learned-map write: browserAPI_BRIDGE.runtime.sendMessage({ action: "updateChannelMap", mappings })',
    'in-memory learned-map write: currentSettings.channelMap[idLower] = handle and currentSettings.channelMap[handleLower] = id',
    'resolver cache: resolvedHandleCache Map keyed by clean lowercase handle core',
    'pending sentinel: string PENDING returns null to callers and suppresses duplicate work',
    "storage first path: browserAPI_BRIDGE.storage.local.get(['channelMap'])",
    "background resolver path: browserAPI_BRIDGE.runtime.sendMessage({ action: 'fetchChannelDetails', channelIdOrHandle: '@...' })",
    "direct resolver path: fetch('/@handle/about') then fetch('/@handle') with credentials same-origin and Accept text/html",
    'direct parse path: response.text() then text.match(/channel\\/(UC[\\w-]{22})/)',
    "page-message map update: window.postMessage({ type: 'FilterTube_UpdateChannelMap', source: 'content_bridge' }, '*')",
    'DOM fallback rerun path: setTimeout(..., 250) then applyDOMFallback(currentSettings, { forceReprocess: true })',
    'listener ownership: none',
    'observer ownership: none',
    'interval ownership: none',
    'teardown path: none',
    'settings revision gate: none',
    'network budget gate: none',
    'message trust token: none'
  ]) {
    assert.ok(text.includes(token), `missing current behavior boundary token ${token}`);
  }

  assert.doesNotMatch(source, /addEventListener/);
  assert.doesNotMatch(source, /MutationObserver/);
  assert.doesNotMatch(source, /module\.exports/);
});

test('handle resolver executable proof covers current normalization map cache network and rerun behavior', async () => {
  const text = doc();
  const id = 'UC1234567890123456789012';

  const runtime = createHandleResolverRuntime();
  const { context, events } = runtime;

  assert.equal(context.extractRawHandle('https://youtube.com/@Fancy%E2%80%94Name/videos'), '@Fancy-Name');
  assert.equal(context.normalizeHandleValue(' https://youtube.com/@Fancy%E2%80%94Name/videos '), '@fancy-name');
  assert.equal(context.extractHandleFromString('watch @Mixed_Name?x=1'), '@mixed_name');
  assert.equal(context.normalizeHandleValue(`@${id}`), '');

  const sharedRuntime = createHandleResolverRuntime({
    identity: {
      extractRawHandle(value) {
        return value === 'delegated-raw' ? '@Shared_Raw' : '';
      },
      normalizeHandleValue(value) {
        return value === '@Shared_Raw' ? '@shared_raw' : '';
      }
    }
  });
  assert.equal(sharedRuntime.context.extractRawHandle('delegated-raw'), '@Shared_Raw');
  assert.equal(sharedRuntime.context.normalizeHandleValue('@Shared_Raw'), '@shared_raw');

  context.persistChannelMappings([{ id, handle: '@Creator' }, { id: '', handle: '@Ignored' }]);
  assert.deepEqual(plain(events.runtimeMessages[0]), {
    action: 'updateChannelMap',
    mappings: [{ id, handle: '@Creator' }, { id: '', handle: '@Ignored' }]
  });
  assert.equal(context.currentSettings.channelMap[id.toLowerCase()], '@Creator');
  assert.equal(context.currentSettings.channelMap['@creator'], id);

  const storageRuntime = createHandleResolverRuntime({
    storageChannelMap: {
      '@stored': id
    }
  });
  assert.equal(await storageRuntime.context.fetchIdForHandle('@Stored'), id);
  assert.deepEqual(plain(storageRuntime.events.storageGets), [['channelMap']]);
  assert.equal(storageRuntime.evaluate('resolvedHandleCache.get("stored")'), id);
  assert.equal(storageRuntime.events.runtimeMessages.length, 0);
  assert.equal(storageRuntime.events.fetches.length, 0);

  const skipRuntime = createHandleResolverRuntime();
  assert.equal(await skipRuntime.context.fetchIdForHandle('@Skip', { skipNetwork: true }), null);
  assert.deepEqual(plain(skipRuntime.events.storageGets), [['channelMap']]);
  assert.equal(skipRuntime.evaluate('resolvedHandleCache.has("skip")'), false);
  assert.equal(skipRuntime.events.runtimeMessages.length, 0);
  assert.equal(skipRuntime.events.fetches.length, 0);

  const backgroundRuntime = createHandleResolverRuntime({
    runtimeResponses: [{ id, handle: '@FromBackground' }]
  });
  assert.equal(await backgroundRuntime.context.fetchIdForHandle('@FromBackground', { backgroundOnly: true }), id);
  assert.deepEqual(plain(backgroundRuntime.events.runtimeMessages[0]), {
    action: 'fetchChannelDetails',
    channelIdOrHandle: '@FromBackground'
  });
  assert.deepEqual(plain(backgroundRuntime.events.postMessages[0]), {
    message: {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{ id, handle: '@FromBackground' }],
      source: 'content_bridge'
    },
    target: '*'
  });
  assert.equal([...backgroundRuntime.events.timers.values()].at(-1).delay, 250);
  backgroundRuntime.runTimer([...backgroundRuntime.events.timers.keys()].at(-1));
  assert.equal(backgroundRuntime.events.domFallbacks.length, 1);
  assert.equal(backgroundRuntime.events.domFallbacks[0].settings, backgroundRuntime.context.currentSettings);
  assert.deepEqual(plain(backgroundRuntime.events.domFallbacks[0].options), { forceReprocess: true });

  const networkRuntime = createHandleResolverRuntime({
    fetchResponses: [
      { ok: false, text: '' },
      { ok: true, text: `<a href="/channel/${id}">channel</a>` }
    ]
  });
  assert.equal(await networkRuntime.context.fetchIdForHandle('@DirectOne'), id);
  assert.deepEqual(networkRuntime.events.fetches.map((entry) => entry.pathname), [
    '/@DirectOne/about',
    '/@DirectOne'
  ]);
  assert.deepEqual(plain(networkRuntime.events.fetches[0].options), {
    credentials: 'same-origin',
    headers: {
      Accept: 'text/html'
    }
  });
  assert.deepEqual(plain(networkRuntime.events.postMessages[0]), {
    message: {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{ id, handle: '@directone' }],
      source: 'content_bridge'
    },
    target: '*'
  });
  assert.equal([...networkRuntime.events.timers.values()].at(-1).delay, 250);

  assert.match(text, /## File-Local Executable Behavior Proof/);
  assert.match(text, /Encoded and typography-normalized handles decode through `extractRawHandle`/);
  assert.match(text, /sends `updateChannelMap` to background/);
  assert.match(text, /reads `channelMap` before network work/);
  assert.match(text, /posts `FilterTube_UpdateChannelMap` to `\*`/);
  assert.match(text, /fetches `\/@handle\/about` then `\/@handle` with same-origin credentials/);
});

test('handle resolver register preserves future proof fields', () => {
  const text = doc();

  for (const token of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'callerSurface',
    'routeSurface',
    'settingsMode',
    'listMode',
    'profileTarget',
    'handleInput',
    'normalizedHandle',
    'identityConfidence',
    'cacheKey',
    'cacheState',
    'pendingSentinel',
    'storageKey',
    'channelMapMutation',
    'backgroundAction',
    'networkPath',
    'networkBudget',
    'pageMessageType',
    'pageMessageTarget',
    'forceReprocess',
    'domFallbackEffect',
    'settingsRevision',
    'senderClass',
    'teardownPolicy',
    'noRuleBudget',
    'negativeFixture',
    'positiveFixture',
    'sourceFamilyProvenance'
  ]) {
    assert.ok(text.includes(token), `missing future proof field ${token}`);
  }
});

test('runtime source lacks handle resolver method authority symbols', () => {
  const runtime = productRuntimeSource();

  for (const missingAuthority of [
    'handleResolverMethodAuthority',
    'handleResolverNetworkPolicy',
    'handleResolverCacheContract',
    'handleResolverMapWriteAuthority',
    'handleResolverPageMessageTrustContract',
    'handleResolverDomFallbackRerunBudget',
    'handleResolverBackgroundFetchContract',
    'handleResolverIdentityConfidenceReport',
    'handleResolverNoRuleBudget',
    'handleResolverFixtureProvenance'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});
