import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function sha256(textOrBuffer) {
  return crypto.createHash('sha256').update(textOrBuffer).digest('hex');
}

function count(source, regex) {
  return (source.match(regex) || []).length;
}

function sliceBetween(source, start, end, fromIndex = 0) {
  const startIndex = source.indexOf(start, fromIndex);
  assert.notEqual(startIndex, -1, `missing start marker ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `missing end marker ${end}`);
  return source.slice(startIndex, endIndex).trimEnd();
}

function blockMetrics(text) {
  return {
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text),
    sha256: sha256(text),
  };
}

function doc() {
  return read(docPath);
}

const futureSymbols = [
  'releaseNotesJsonVersionGateContract',
  'releaseNotesJsonSchemaReport',
  'releaseNotesPackageVersionParityReport',
  'releaseNotesManifestVersionParityReport',
  'releaseNotesCurrentVersionEntryReport',
  'releaseNotesStagedEntryPolicy',
  'releaseNotesDetailsUrlPolicy',
  'releaseNotesRuntimeConsumerReport',
  'releaseNotesPromptSenderGate',
  'releaseNotesWhatsNewUrlPolicy',
  'releaseNotesDashboardRenderFixture',
  'releaseNotesNativeParityReport',
  'releaseNotesPublicClaimGate',
  'releaseNotesFirstClassJsonClaimGate',
];

test('release notes JSON version gate doc is audit-only and scoped to current behavior', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /first-class JSON filtering behavior changes/);
  assert.match(source, /not a\s+filter-engine JSON path/);
  assert.match(source, /same class of schema, version, runtime-consumer, and artifact-parity questions/);
  assert.match(source, /Implementation changes remain blocked/);
  assert.match(source, /does\s+not approve any first-class JSON filter expansion/);
});

function assertReleaseNotesSchema(notes, current) {
  assert.ok(Array.isArray(notes) && notes.length > 0, 'release notes must be a nonempty array');
  const versions = [];
  for (const note of notes) {
    assert.ok(note && typeof note === 'object' && !Array.isArray(note), 'release note must be an object');
    if (Object.hasOwn(note, '_comment')) {
      assert.deepEqual(Object.keys(note), ['_comment'], 'metadata record may contain only _comment');
      assert.ok(typeof note._comment === 'string' && note._comment.trim(), 'metadata comment must be nonempty');
      continue;
    }
    assert.ok(typeof note.version === 'string' && note.version.trim(), 'every release record needs a version');
    assert.ok(typeof note.headline === 'string' && note.headline.trim());
    assert.ok(typeof note.summary === 'string' && note.summary.trim());
    assert.ok(Array.isArray(note.highlights) && note.highlights.every(value => typeof value === 'string' && value.trim()));
    const url = new URL(note.detailsUrl);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'github.com');
    assert.ok(url.pathname.startsWith('/varshneydevansh/FilterTube/'));
    versions.push(note);
  }
  assert.ok(versions.length > 0, 'at least one versioned release is required');
  assert.equal(new Set(versions.map(note => note.version)).size, versions.length);
  assert.equal(versions[0].version, current);
}

test('release notes schema validates every non-metadata record and matches every browser package', () => {
  const notes = readJson('data/release_notes.json');
  const current = readJson('package.json').version;
  assertReleaseNotesSchema(notes, current);
  for (const file of ['manifest.json','manifest.chrome.json','manifest.firefox.json','manifest.opera.json']) {
    assert.equal(readJson(file).version,current);
  }
});

test('release notes schema cannot silently discard malformed version records as metadata', () => {
  const current = readJson('package.json').version;
  const valid = readJson('data/release_notes.json').find(note => note.version === current);
  for (const invalid of [{}, {...valid, version: undefined}, {...valid, version: 34}, {...valid, version: ''},
    {_comment: 'not a release', version: current}, {_comment: ''}]) {
    assert.throws(() => assertReleaseNotesSchema([valid, invalid], current));
  }
  assert.doesNotThrow(() => assertReleaseNotesSchema([{_comment: 'Shared release notes'}, valid], current));
});

function releaseMessageFixture(initial = {}) {
  const state = {...initial};
  const writes = [];
  const builds = [];
  const current = readJson('package.json').version;
  const generated = {version: current, headline: 'Generated release'};
  const source = read('js/background.js');
  const branch = sliceBetween(source, "    if (action === 'FilterTube_ReleaseNotesCheck') {", "    } else if (action === 'FilterTube_FirstRunCheck')");
  const context = vm.createContext({
    CURRENT_VERSION: current,
    SHOW_UPDATE_REFRESH_PROMPT_KEY: 'showUpdateRefreshPrompt',
    storageGet: async () => ({...state}),
    buildReleaseNotesPayload: async version => { builds.push(version); return generated; },
    browserAPI: {storage: {local: {set: async values => { writes.push(values); Object.assign(state, values); }}}},
    console: {warn() {}}
  });
  vm.runInContext(`function handle(request, sendResponse) { const action = request.action; ${branch}\n} }`, context);
  return {state, writes, builds, current, generated, request(action, fields = {}) {
    return new Promise(resolve => {
      assert.equal(context.handle({action, ...fields}, resolve), true, 'async response channel stays open');
    });
  }};
}

test('actual release Check honors opt-out and already-seen state without building or writing', async () => {
  const current = readJson('package.json').version;
  for (const state of [
    {showUpdateRefreshPrompt: false, releaseNotesPayload: {version: current}},
    {releaseNotesSeenVersion: current, releaseNotesPayload: {version: current}}
  ]) {
    const fixture = releaseMessageFixture(state);
    const response = await fixture.request('FilterTube_ReleaseNotesCheck');
    assert.equal(response.needed, false);
    assert.equal(response.payload, undefined);
    assert.equal(fixture.builds.length, 0);
    assert.equal(fixture.writes.length, 0);
  }
});

test('actual release Check reuses unseen cached payload and only builds when no unseen cache exists', async () => {
  const cached = {version: readJson('package.json').version, headline: 'Already prepared'};
  const reuse = releaseMessageFixture({releaseNotesSeenVersion: 'older', releaseNotesPayload: cached});
  const response = await reuse.request('FilterTube_ReleaseNotesCheck');
  assert.equal(response.needed, true);
  assert.equal(response.payload, cached);
  assert.equal(reuse.builds.length, 0);
  assert.equal(reuse.writes.length, 0);
  const fresh = releaseMessageFixture();
  const built = await fresh.request('FilterTube_ReleaseNotesCheck');
  assert.equal(built.needed, true);
  assert.equal(built.payload, fresh.generated);
  assert.deepEqual(fresh.builds, [fresh.current]);
  assert.equal(fresh.writes.length, 1);
  assert.equal(fresh.state.releaseNotesPayload, fresh.generated);
});

test('actual release Ack persists the acknowledged version and clears cached payload', async () => {
  for (const version of [undefined, '  acknowledged-version  ']) {
    const fixture = releaseMessageFixture({releaseNotesPayload: {version: 'cached'}});
    const response = await fixture.request('FilterTube_ReleaseNotesAck', {version});
    assert.equal(response.ok, true);
    assert.equal(fixture.state.releaseNotesSeenVersion, version?.trim() || fixture.current);
    assert.equal(fixture.state.releaseNotesPayload, null);
    assert.equal(fixture.writes.length, 1);
    assert.equal(fixture.builds.length, 0);
  }
});

test('actual install initializes seen state while update prepares the current release payload', async () => {
  const source = read('js/background.js');
  const handler = sliceBetween(source, 'browserAPI.runtime.onInstalled.addListener(function (details) {', 'function handleFetchShortsIdentityMessage');
  const current = readJson('package.json').version;
  for (const reason of ['install', 'update']) {
    const writes = [];
    const builds = [];
    const payload = {version: current, headline: 'Prepared update'};
    let listener;
    const context = vm.createContext({
      CURRENT_VERSION: current,
      SHOW_UPDATE_REFRESH_PROMPT_KEY: 'showUpdateRefreshPrompt',
      browserAPI: {runtime: {onInstalled: {addListener(callback) { listener = callback; }}},
        storage: {local: {set(values, callback) { writes.push(values); callback?.(); return Promise.resolve(); }}}},
      applyQuickBlockDefaultMigrationOnce: async () => {},
      applyKeywordCommentsScopeMigrationOnce: async () => {},
      applyAdvertVoidDefaultMigrationOnce: async () => {},
      refreshYouTubeTabs() {},
      buildReleaseNotesPayload: async version => { builds.push(version); return payload; },
      console: {log() {}, warn() {}}
    });
    vm.runInContext(handler, context);
    listener({reason, previousVersion: 'older'});
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].firstRunRefreshNeeded, true);
    if (reason === 'install') {
      assert.equal(writes[0].releaseNotesSeenVersion, current);
      assert.equal(writes[0].releaseNotesPayload, null);
      assert.equal(builds.length, 0);
    } else {
      assert.deepEqual(builds, [current]);
      assert.equal(writes[0].releaseNotesPayload, payload);
      assert.equal(Object.hasOwn(writes[0], 'releaseNotesSeenVersion'), false, 'update must not mark its prompt seen');
    }
  }
});

test('actual release payload chooses localized fields, English fallback and internal details destination', async () => {
  const source = read('js/background.js');
  const body = sliceBetween(source,'async function buildReleaseNotesPayload(version)','function getBackgroundRuntimeLabel()');
  let localized = null;
  let fail = false;
  const entry = readJson('data/release_notes.json').find(note => note.version === readJson('package.json').version);
  const context = vm.createContext({
    loadReleaseNotesData: async () => { if (fail) throw new Error('fixture failure'); return [entry]; },
    loadLocalizedReleaseNote: async () => localized,
    RELEASE_NOTES_TEMPLATE: {headline:'Fallback title',body:'Fallback body',ctaLabel:'Read'},
    WHATS_NEW_PAGE_URL: 'moz-extension://fixture/html/tab-view.html?view=whatsnew',
    console: {warn() {}}
  });
  vm.runInContext(body,context);
  let payload = await context.buildReleaseNotesPayload(entry.version);
  assert.equal(payload.headline,entry.headline);
  assert.equal(payload.body,entry.bannerSummary || entry.summary);
  assert.equal(payload.direction,'ltr');
  localized = {headline:'Localized title',summary:'Localized body',direction:'rtl',dismissLabel:'Close'};
  payload = await context.buildReleaseNotesPayload(entry.version);
  assert.equal(payload.headline,'Localized title');
  assert.equal(payload.body,'Localized body');
  assert.equal(payload.direction,'rtl');
  assert.equal(payload.dismissLabel,'Close');
  assert.equal(payload.link,context.WHATS_NEW_PAGE_URL);
  localized = {};
  assert.equal((await context.buildReleaseNotesPayload(entry.version)).headline,entry.headline);
  assert.equal((await context.buildReleaseNotesPayload('missing')).headline,'Fallback title');
  fail = true;
  assert.equal((await context.buildReleaseNotesPayload(entry.version)).body,'Fallback body');
});

test('release prompt retains opt-out, acknowledgement and ordered dashboard consumers', () => {
  const background = read('js/background.js');
  const branch = sliceBetween(background,"    if (action === 'FilterTube_ReleaseNotesCheck') {","    } else if (action === 'FilterTube_FirstRunCheck')");
  assert.match(branch,/data\?\.\[SHOW_UPDATE_REFRESH_PROMPT_KEY\] === false/);
  assert.match(branch,/seenVersion && seenVersion === CURRENT_VERSION/);
  assert.match(branch,/releaseNotesSeenVersion: version \|\| CURRENT_VERSION/);
  assert.match(branch,/releaseNotesPayload: null/);
  const dashboard = read('js/tab-view.js');
  assert.match(dashboard,/async function loadReleaseNotesIntoDashboard\(\)/);
  assert.match(dashboard,/data\/release_notes\.json/);
  assert.match(dashboard,/link\.rel = 'noopener noreferrer'/);
  const prompt = read('js/content/release_notes_prompt.js');
  for (const action of ['FilterTube_ReleaseNotesCheck','FilterTube_ReleaseNotesAck','FilterTube_OpenWhatsNew']) {
    assert.ok(prompt.includes(action));
  }
  for (const file of ['manifest.json','manifest.chrome.json','manifest.firefox.json','manifest.opera.json']) {
    const entries = readJson(file).content_scripts.filter(entry => entry.js.includes('js/content_bridge.js'));
    assert.ok(entries.length > 0);
    for (const entry of entries) {
      assert.ok(entry.js.indexOf('js/content/release_notes_prompt.js') < entry.js.indexOf('js/content_bridge.js'));
      assert.ok(entry.js.indexOf('js/content/release_notes_prompt.js') >= 0);
    }
  }
});

test('release notes version gate future authority symbols are absent from product source', () => {
  const selectedProductSource = [
    'data/release_notes.json',
    'package.json',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'js/background.js',
    'js/tab-view.js',
    'js/content/release_notes_prompt.js',
  ].map((file) => read(file)).join('\n');
  const audit = doc();

  for (const symbol of futureSymbols) {
    assert.equal(selectedProductSource.includes(symbol), false, `${symbol} unexpectedly exists in product source`);
    assert.ok(audit.includes(symbol), `audit doc missing future symbol ${symbol}`);
  }

  assert.match(audit, /schema report enforces required fields/);
  assert.match(audit, /sender-class\/version membership contract/);
  assert.match(audit, /not a release\s+version gate/);
  assert.match(audit, /not a\s+URL policy/);
  assert.match(audit, /renderer ownership, path syntax, field-effect, route\/surface, settings-mode/);
});
