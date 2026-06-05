import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceFingerprints = {
  'js/background.js': [6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5'],
  'js/content/handle_resolver.js': [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff'],
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
  'js/injector.js': [3593, 155830, '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/tab-view.js': [14381, 667956, '0f1ead56240490d51a895a22203b0298dc4c3d8813a976d0c70f1a66f153660f']
};

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-US');
}

function lineOf(file, needle) {
  const lines = read(file).split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle}`);
  return index + 1;
}

function lineOfAfter(file, afterNeedle, needle) {
  const lines = read(file).split(/\r?\n/);
  const start = lines.findIndex((line) => line.includes(afterNeedle));
  assert.ok(start >= 0, `${file} missing anchor ${afterNeedle}`);
  const index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle} after ${afterNeedle}`);
  return index + 1;
}

function lineOfAfterSequence(file, needles) {
  const lines = read(file).split(/\r?\n/);
  let start = 0;
  let index = -1;
  for (const needle of needles) {
    index = lines.findIndex((line, lineIndex) => lineIndex >= start && line.includes(needle));
    assert.ok(index >= 0, `${file} missing sequence needle ${needle}`);
    start = index + 1;
  }
  return index + 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function productScriptFiles() {
  return git(['ls-files', '*.js', '*.mjs', '*.jsx'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('docs/'))
    .filter(file => !file.includes('/vendor/'));
}

function networkRows() {
  const patterns = [
    ['fetch', /\bfetch\s*\(/],
    ['response.body.getReader', /\.body\.getReader\s*\(/],
    ['response.json', /\.json\s*\(/],
    ['response.text', /\.text\s*\(/],
    ['XMLHttpRequest', /\bXMLHttpRequest\b/],
    ['proto.open.assign', /\bproto\.open\s*=\s*function/],
    ['proto.send.assign', /\bproto\.send\s*=\s*function/]
  ];
  const rows = [];

  for (const file of productScriptFiles()) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**')) return;
      if (/\bfile\.text\s*\(/.test(line)) return;
      for (const [operation, regex] of patterns) {
        regex.lastIndex = 0;
        if (regex.test(line)) rows.push({ file, line: index + 1, operation, text: trimmed });
      }
    });
  }

  return rows;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

test('network fetch/xhr callsite register is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /tracked product JS\/JSX\/MJS files scanned: 71/);
  assert.match(text, /js\/nanah_managed_live_policy\.js.*zero network\s+fetch\/XHR rows/s);
  assert.match(text, /js\/managed_admin_authority\.js.*zero\s+network\s+fetch\/XHR rows/s);
  assert.match(text, /js\/managed_parent_command_center\.js.*zero\s+network\s+fetch\/XHR rows/s);
  assert.match(text, /tracked product files with network fetch\/XHR rows: 6/);
  assert.match(text, /network fetch\/XHR rows: 29/);
  assert.match(text, /request primitive rows: 16/);
  assert.match(text, /response consumption rows: 13/);
  assert.match(text, /fetch rows: 13/);
  assert.match(text, /XMLHttpRequest prototype rows: 3/);
  assert.match(text, /response.body.getReader rows: 3/);
  assert.match(text, /response.json rows: 3/);
  assert.match(text, /response.text rows: 7/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for network authority/);
  assertReleaseNetworkNoWorkAddendum(text);
  assertPassiveYouTubeiTransportPatchSnapshot(text);
  assertYouTubeiEndpointAdmissionOwnerFlow(text);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${formatNumber(expectedLines)} \\| ${formatNumber(expectedBytes)} \\| \`${expectedHash}\` \\|`)
    );
  }
});

function assertYouTubeiEndpointAdmissionOwnerFlow(text) {
  assert.match(text, /YouTubei Endpoint Admission Owner Flow Addendum - 2026-05-27/);
  assert.match(text, /YouTubei endpoint admission owner rows: 8/);
  assert.match(text, /ASCII YouTubei endpoint admission flow diagram: present/);
  assert.match(text, /Mermaid YouTubei endpoint admission flow diagram: present/);
  assert.match(text, /YouTubei endpoint admission source proof: PARTIAL/);
  assert.match(text, /endpoint policy promotion approval from owner flow: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /YouTube page fetch\/XHR URL/);
  assert.match(text, /pass through before clone\/parse\/replay/);

  const sourcePins = [
    [
      'youtubei_fetch_endpoint_array_owner',
      [
        ['js/seed.js', lineOfAfter('js/seed.js', 'function setupFetchInterception() {', 'const fetchEndpoints = ['), lineOfAfterSequence('js/seed.js', ['const fetchEndpoints = [', '];'])]
      ]
    ],
    [
      'youtubei_xhr_endpoint_array_owner',
      [
        ['js/seed.js', lineOfAfter('js/seed.js', 'function setupXhrInterception() {', 'const xhrEndpoints = ['), lineOfAfterSequence('js/seed.js', ['const xhrEndpoints = [', '];'])]
      ]
    ],
    [
      'youtubei_fetch_url_classification_owner',
      [
        ['js/seed.js', lineOfAfter('js/seed.js', 'const fetchEndpoints = [', 'const getPathname = (rawUrl) => {'), lineOfAfter('js/seed.js', 'const dataName = `fetch:${getPathname(urlStr)}`;', 'return originalFetch.apply(this, arguments);')]
      ]
    ],
    [
      'youtubei_xhr_marking_owner',
      [
        ['js/seed.js', lineOfAfter('js/seed.js', 'proto.open = function(method, url) {', 'proto.open = function(method, url) {'), lineOfAfterSequence('js/seed.js', ['proto.send = function() {', 'this.__filtertube_shouldProcessXhr = true;'])]
      ]
    ],
    [
      'youtubei_active_work_owner',
      [
        [
          'js/seed.js',
          lineOf('js/seed.js', 'function hasNetworkJsonWork(settings) {'),
          lineOfAfter('js/seed.js', 'seedDebugLog(`⏭️ Passing through ${dataName} before JSON parse (no active JSON work)`);', 'return true;')
        ],
        [
          'js/injector.js',
          lineOf('js/injector.js', 'function hasNetworkJsonWork(settings) {'),
          lineOfAfter('js/injector.js', "if (settings.listMode === 'whitelist') return true;", 'return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);')
        ]
      ]
    ],
    [
      'youtubei_fetch_response_owner',
      [
        [
          'js/seed.js',
          lineOfAfter('js/seed.js', 'if (shouldBypassYouTubeiNetworkResponse(dataName)) {', 'return originalFetch.apply(this, arguments).then(response => {'),
          lineOfAfterSequence('js/seed.js', ['// Normal processing for non-comment or non-hideAllComments requests', 'return new Response(JSON.stringify(processed)', '});'])
        ]
      ]
    ],
    [
      'youtubei_xhr_response_owner',
      [
        [
          'js/seed.js',
          lineOfAfter('js/seed.js', 'const getWrappedListener = (xhr, type, listener) => {', 'const ensureXhrResponseProcessed = (xhr) => {'),
          lineOfAfter('js/seed.js', 'const dataName = `xhr:${getPathname(urlStr)}`;', 'const processed = processWithEngine(jsonData, dataName);')
        ]
      ]
    ],
    [
      'youtubei_replay_queue_owner',
      [
        [
          'js/seed.js',
          lineOfAfter('js/seed.js', 'cachedSettings = newSettings;', 'if (!hasNetworkJsonWork(cachedSettings)) {'),
          lineOfAfter('js/seed.js', "seedDebugLog('⏭️ Settings update has no active JSON work; cleared queued seed data without replay');", 'return;')
        ],
        [
          'js/injector.js',
          lineOfAfter('js/injector.js', '// Process any queued data', 'if (!hasNetworkJsonWork(currentSettings)) {'),
          lineOfAfter('js/injector.js', 'if (!hasNetworkJsonWork(currentSettings)) {', 'processInitialDataQueue();')
        ],
        [
          'js/injector.js',
          lineOfAfter('js/injector.js', 'function processDataWithFilterLogic(data, dataName) {', 'if (!hasNetworkJsonWork(currentSettings)) {'),
          lineOfAfter('js/injector.js', "postLog('log', 'No active JSON work; cleared queued injector data');", 'return;')
        ]
      ]
    ]
  ];

  for (const [rowId, ranges] of sourcePins) {
    assert.ok(text.includes(`| \`${rowId}\` |`), `missing endpoint admission row ${rowId}`);
    for (const [file, startLine, endLine] of ranges) {
      assert.ok(text.includes(`\`${file}:${startLine}-${endLine}\``), `missing source pin ${file}:${startLine}-${endLine} for ${rowId}`);
    }
  }

  const seed = read('js/seed.js');
  const fetchHook = sliceBetween(
    seed,
    'const dataName = `fetch:${getPathname(urlStr)}`;',
    'return response.clone().json().then(jsonData => {'
  );
  assert.ok(fetchHook.indexOf('shouldBypassYouTubeiNetworkResponse(dataName)') < fetchHook.indexOf('originalFetch.apply'));

  const xhrOpenSend = sliceBetween(
    seed,
    'proto.open = function(method, url) {',
    'const processIfReady = function () {'
  );
  assert.ok(xhrOpenSend.indexOf('shouldBypassYouTubeiNetworkResponse(dataName)') < xhrOpenSend.indexOf('this.__filtertube_shouldProcessXhr = true;'));

  const xhrParse = sliceBetween(
    seed,
    'const ensureXhrResponseProcessed = (xhr) => {',
    'const processed = processWithEngine(jsonData, dataName);'
  );
  assert.ok(xhrParse.indexOf('shouldBypassYouTubeiNetworkResponse(dataName)') < xhrParse.indexOf('JSON.parse(trimmed)'));

  const replayCleanup = sliceBetween(
    seed,
    'if (!hasNetworkJsonWork(cachedSettings)) {',
    "seedDebugLog('⏭️ Settings update has no active JSON work; cleared queued seed data without replay');"
  );
  assert.ok(replayCleanup.includes('pendingDataQueue = [];'));
  assert.ok(replayCleanup.includes('rawYtInitialData = null;'));
  assert.ok(replayCleanup.includes('rawYtInitialPlayerResponse = null;'));

  const productSource = Object.keys(sourceFingerprints).map(read).join('\n');
  for (const symbol of [
    'youtubeiEndpointAdmissionAuthority',
    'networkEndpointAdmissionDecision',
    'networkEndpointOwnerReport',
    'youtubeiEndpointNoWorkBudget'
  ]) {
    assert.match(text, new RegExp(`\\b${symbol}\\b`));
    assert.doesNotMatch(productSource, new RegExp(`\\b${symbol}\\b`));
  }
}

function assertReleaseNetworkNoWorkAddendum(text) {
  assert.match(text, /Release Hot-Path Network No-Work Addendum - 2026-05-27/);
  assert.match(text, /release network no-work semantic rows: 9/);
  assert.match(text, /seed fetch\/XHR product callsite count changed by addendum: no/);
  assert.match(text, /network authority approval from this addendum: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);

  for (const [rowId, file, startNeedle, endNeedle, startAnchor = null, endAnchor = startNeedle] of [
    [
      'release_network_seed_active_work_predicate',
      'js/seed.js',
      'function hasNetworkJsonWork(settings) {',
      'return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);'
    ],
    [
      'release_network_seed_pre_parse_bypass',
      'js/seed.js',
      'function shouldBypassYouTubeiNetworkResponse(dataName) {',
      'return true;',
      null,
      'seedDebugLog(`⏭️ Passing through ${dataName} before JSON parse (no active JSON work)`);'
    ],
    [
      'release_network_seed_process_with_engine_no_work',
      'js/seed.js',
      'function processWithEngine(data, dataName) {',
      'return data; // Return unmodified data',
      null,
      'seedDebugLog(`⏭️ No active JSON work for ${dataName}, passing through without engine processing`);'
    ],
    [
      'release_network_seed_fetch_clone_guard',
      'js/seed.js',
      'if (shouldBypassYouTubeiNetworkResponse(dataName)) {',
      'return response.clone().json().then(jsonData => {',
      'const dataName = `fetch:${getPathname(urlStr)}`;',
      'return originalFetch.apply(this, arguments).then(response => {'
    ],
    [
      'release_network_seed_xhr_parse_guard',
      'js/seed.js',
      'if (shouldBypassYouTubeiNetworkResponse(dataName)) {',
      'const processed = processWithEngine(jsonData, dataName);',
      'const dataName = `xhr:${getPathname(urlStr)}`;',
      'const dataName = `xhr:${getPathname(urlStr)}`;'
    ],
    [
      'release_network_seed_replay_queue_no_work_cleanup',
      'js/seed.js',
      'if (!hasNetworkJsonWork(cachedSettings)) {',
      'return;',
      'cachedSettings = newSettings;',
      "seedDebugLog('⏭️ Settings update has no active JSON work; cleared queued seed data without replay');"
    ],
    [
      'release_network_injector_active_work_predicate',
      'js/injector.js',
      'function hasNetworkJsonWork(settings) {',
      'return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);'
    ],
    [
      'release_network_injector_settings_queue_gate',
      'js/injector.js',
      'if (!hasNetworkJsonWork(currentSettings)) {',
      'processInitialDataQueue();',
      '// Process any queued data',
      '// Process any queued data'
    ],
    [
      'release_network_injector_process_queue_gate',
      'js/injector.js',
      'if (!hasNetworkJsonWork(currentSettings)) {',
      'return;',
      'function processDataWithFilterLogic(data, dataName) {',
      "postLog('log', 'No active JSON work; cleared queued injector data');"
    ]
  ]) {
    const startLine = startAnchor ? lineOfAfter(file, startAnchor, startNeedle) : lineOf(file, startNeedle);
    const endLine = lineOfAfter(file, endAnchor, endNeedle);
    assert.ok(text.includes(`| \`${rowId}\` |`), `missing addendum row ${rowId}`);
    assert.ok(text.includes(`\`${file}:${startLine}-${endLine}\``), `missing source pin for ${rowId}`);
  }

  const seed = read('js/seed.js');
  const fetchHook = sliceBetween(
    seed,
    'const dataName = `fetch:${getPathname(urlStr)}`;',
    'return response.clone().json().then(jsonData => {'
  );
  assert.ok(fetchHook.includes('if (shouldBypassYouTubeiNetworkResponse(dataName))'));

  const xhrHook = sliceBetween(
    seed,
    'const dataName = `xhr:${getPathname(urlStr)}`;',
    'const processed = processWithEngine(jsonData, dataName);'
  );
  assert.ok(xhrHook.indexOf('if (shouldBypassYouTubeiNetworkResponse(dataName))') < xhrHook.indexOf('JSON.parse(trimmed)'));

  const injector = read('js/injector.js');
  const processDataGate = sliceBetween(
    injector,
    'function processDataWithFilterLogic(data, dataName) {',
    'function processInitialDataQueue() {'
  );
  assert.match(processDataGate, /if \(!hasNetworkJsonWork\(currentSettings\)\) \{[\s\S]*return data;/);
}

function assertPassiveYouTubeiTransportPatchSnapshot(text) {
  const seed = read('js/seed.js');
  const fetchEndpointsSlice = sliceBetween(
    seed,
    'const fetchEndpoints = [',
    'const getPathname = (rawUrl) => {'
  );
  const xhrEndpointsSlice = sliceBetween(
    seed,
    'const xhrEndpoints = [',
    'const proto = window.XMLHttpRequest'
  );
  const fetchHook = sliceBetween(
    seed,
    'function setupFetchInterception() {',
    'seedDebugLog("✅ Fetch interception established");'
  );
  const xhrHook = sliceBetween(
    seed,
    'function setupXhrInterception() {',
    'seedDebugLog("✅ XHR interception established");'
  );

  assert.match(text, /Passive YouTubei Transport Patch Token Snapshot - 2026-05-27/);
  assert.match(text, /Fetch and XHR both watch the same 5 YouTubei endpoint families/);
  assert.match(text, /passive page-traffic hooks, not explicit\s+product network requests/);
  assert.match(text, /preserve the no-work bypass before `response\.clone\(\)\.json`/);

  for (const endpoint of [
    '/youtubei/v1/search',
    '/youtubei/v1/guide',
    '/youtubei/v1/browse',
    '/youtubei/v1/next',
    '/youtubei/v1/player'
  ]) {
    assert.equal(countLiteral(fetchEndpointsSlice, endpoint), 1, `${endpoint} fetch endpoint array count`);
    assert.equal(countLiteral(xhrEndpointsSlice, endpoint), 1, `${endpoint} xhr endpoint array count`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(endpoint)}\` \\| 1 \\| 1 \\|`));
  }

  for (const [token, expected] of [
    ['originalFetch.apply', 3],
    ['shouldBypassYouTubeiNetworkResponse', 1],
    ['response.clone().json', 1],
    ['new Response', 2],
    ['JSON.stringify', 2],
    ['processWithEngine', 1]
  ]) {
    assert.equal(countLiteral(fetchHook, token), expected, `fetch hook token ${token}`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| ${expected} \\|`));
  }

  for (const [token, expected] of [
    ['__filtertube_shouldProcessXhr', 6],
    ['__filtertube_responseProcessed', 5],
    ['__filtertube_modifiedResponse', 8],
    ['__filtertube_modifiedResponseText', 4],
    ['__filtertube_responseInterceptorsInstalled', 2],
    ['listenerWrapperMap', 3],
    ['Object.defineProperty', 2],
    ['JSON.parse', 1],
    ['JSON.stringify', 1],
    ['originalAddEventListener', 7],
    ['originalRemoveEventListener', 4]
  ]) {
    assert.equal(countLiteral(xhrHook, token), expected, `xhr hook token ${token}`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| ${expected} \\|`));
  }
}

test('network fetch/xhr callsite counts remain source-derived', () => {
  const rows = networkRows();
  const text = doc();

  assert.equal(productScriptFiles().length, 71);
  assert.equal(rows.length, 29);
  assert.deepEqual(countBy(rows, 'operation'), {
    XMLHttpRequest: 1,
    fetch: 13,
    'proto.open.assign': 1,
    'proto.send.assign': 1,
    'response.body.getReader': 3,
    'response.json': 3,
    'response.text': 7
  });
  assert.deepEqual(countBy(rows, 'file'), {
    'js/background.js': 13,
    'js/content/handle_resolver.js': 2,
    'js/content_bridge.js': 6,
    'js/injector.js': 2,
    'js/seed.js': 4,
    'js/tab-view.js': 2
  });

  for (const row of rows) {
    assert.ok(
      text.includes(`${row.file}:${row.line}:${row.operation}:`),
      `missing network row ${row.file}:${row.line}:${row.operation}`
    );
  }
});

test('network fetch/xhr register records current boundaries and exclusions', () => {
  const text = doc();

  assert.match(text, /releaseNotesExtensionResource/);
  assert.match(text, /shortsIdentityBackgroundHtmlFetch/);
  assert.match(text, /kidsWatchIdentityHtmlFetch/);
  assert.match(text, /watchIdentityHtmlFetch/);
  assert.match(text, /channelInfoPrimaryHtmlFetch/);
  assert.match(text, /channelInfoHandleFallbackHtmlFetch/);
  assert.match(text, /channelInfoPublicFallbackHtmlFetch/);
  assert.match(text, /directHandleHtmlFetch/);
  assert.match(text, /watchMetaDirectHtmlFetch/);
  assert.match(text, /shortsDirectHtmlFetch/);
  assert.match(text, /watchIdentityDirectHtmlFetch/);
  assert.match(text, /subscriptionImportYoutubeiPost/);
  assert.match(text, /passiveFetchCloneJsonDecode/);
  assert.match(text, /xhrPrototypeLookup/);
  assert.match(text, /xhrOpenPrototypePatch/);
  assert.match(text, /xhrSendPrototypePatch/);
  assert.match(text, /dashboardReleaseNotesExtensionResource/);
  assert.match(text, /runtime\.getURL\(\.\.\.\) constructs extension resource URLs but is not a fetch/);
  assert.match(text, /URL\.createObjectURL\(\.\.\.\) creates local Blob download URLs and is not network/);
  assert.match(text, /file\.text\(\) reads an uploaded\/imported local File and is not a network response/);
});

test('network fetch/xhr register records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const field of [
    'networkFetchXhrReference',
    'requestOwner',
    'requestReason',
    'responseConsumptionMode',
    'endpointOrUrlPattern',
    'credentialsPolicy',
    'dedupeKey',
    'maxPerNavigationBudget',
    'bodyParseBudget',
    'xhrPatchBudget',
    'jsonFirstBodyDecision',
    'negativeNoRuleFixture',
    'negativeDisabledFixture',
    'negativeSiblingFixture'
  ]) {
    assert.match(text, new RegExp(`\\b${field}\\b`), `missing future proof field ${field}`);
  }

  const productSource = Object.keys(sourceFingerprints).map(read).join('\n');
  for (const symbol of [
    'networkFetchXhrCallsiteAuthority',
    'networkRequestPrimitiveRegister',
    'networkResponseConsumptionDecision',
    'networkFetchNoWorkBudget',
    'networkXhrPatchBudget',
    'networkCredentialPolicyReport',
    'networkJsonFirstBodyDecision',
    'networkFetchFixtureProvenance'
  ]) {
    assert.match(text, new RegExp(`\\b${symbol}\\b`));
    assert.doesNotMatch(productSource, new RegExp(`\\b${symbol}\\b`));
  }
});
