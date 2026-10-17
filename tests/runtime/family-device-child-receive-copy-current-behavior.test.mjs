import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
function section(start, end) { const a = source.indexOf(start), b = source.indexOf(end, a); assert.ok(a >= 0 && b > a, start); return source.slice(a, b); }
function actualFunction(name) {
  const match = new RegExp(`^([ ]*)(?:async )?function ${name}\\(`, 'm').exec(source);
  assert.ok(match, name);
  const end = source.indexOf(`\n${match[1]}}`, match.index) + match[1].length + 2;
  return source.slice(match.index, end);
}
const localization = section('function tabViewUiText(', '\nfunction tabViewTaxonomyDisplayLabel');
const mapCopy = section('    const FAMILY_DEVICE_MAP_COPY = Object.freeze({', '    function getNanahFamilyDeviceMapActionContract(');
const render = section('    function renderNanahDeviceToolbar(', '    function renderNanahDeliveryPathStrip(');
const hint = section('    function buildNanahTargetHint(', '    async function ensureNanahStableDeviceId(');
const textNode = () => ({ textContent: '', hidden: false, dataset: {}, attributes: {}, closest: () => null, setAttribute(name, value) { this.attributes[name] = value; } });
function fixture({ child = false, personal = false, mode = 'send_once', translations = {} } = {}) {
  const context = {
    window: { FilterTubeUiLocalization: { text: key => translations[key] ?? null } },
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0,
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {}, safeArray: value => Array.isArray(value) ? value : [],
    isActiveChildNanahProfile: () => child,
    profilesV4Cache: { activeProfileId: 'local', profiles: { local: { name: 'Current local profile', type: child ? 'child' : 'account' } } },
    nanahFamilyDeviceSelectedIntent: {}, nanahSessionState: {}, nanahTrustedLinks: [], nanahNearbyToolbarBusy: false, nanahDeviceSelectionBusy: false,
    updateNanahFamilyDeviceMapSnapshot() {}, renderNanahTrustedDeviceStrip() {}, renderNanahHomeBridgePresenceRow() {}, setNanahCompassChoiceCopy() {},
    renderNanahDeviceSelectionPreview: value => { context.preview = value; },
    getNanahLocalDeviceLabel: () => 'This computer', getNanahUiMode: () => mode, getNanahScope: () => 'active',
    normalizeNanahTargetProfileContext: value => value || {}, normalizeNanahProfileContext: value => value || { profileName: 'Other profile' },
    getNanahSelectedRemoteTargetProfile: () => null, getNanahRemoteLabel: () => 'Other device',
    getNanahLocalProfileContext: () => ({ profileId: 'local', profileType: child ? 'child' : 'account' }),
    normalizeNanahTrustedLink: value => value, getNanahCurrentTrustedLink: () => null, getNanahScopeLabel: value => value
  };
  for (const name of new Set(render.match(/\bftNanah[A-Za-z0-9]+\b/g))) context[name] = null;
  for (const name of ['ftNanahDeviceCompass', 'ftNanahDeviceCompassRule', 'ftNanahMapEyebrow', 'ftNanahMapRuleTitle', 'ftNanahMapRuleDetail', 'ftNanahMapCenterEyebrow', 'ftNanahMapCenterTitle', 'ftNanahMapCenterDetail', 'ftNanahDeviceEmpty', 'ftNanahMapTitle', 'ftNanahMapDetail', 'ftNanahFindNearbyBtn', 'ftNanahShowNearbyBtn', 'ftNanahAddDeviceBtn']) context[name] = textNode();
  const stage = textNode(); const center = textNode();
  context.ftNanahMapTitle.closest = selector => selector === '.nanah-device-compass-stage' ? stage : null;
  context.ftNanahMapCenterTitle.closest = selector => selector === '.nanah-device-compass__center' ? center : null;
  vm.runInNewContext([localization, mapCopy, render, hint, actualFunction('getNanahDevicePickerPrimaryAction')].join('\n'), context);
  const model = { personalSyncOpen: personal, protectedCount: child ? 0 : 1, trustedDeviceCount: 0, devices: [], paths: [] };
  return { context, model, stage, center, render: () => context.renderNanahFamilyDeviceMapViewModel(model), hint: scope => context.buildNanahTargetHint(scope) };
}

for (const personal of [false, true]) {
  test(`child map stays receiving-only with retained personal mode ${personal}`, () => {
    const f = fixture({ child: true, personal });
    f.render();
    assert.equal(f.context.ftNanahMapCenterEyebrow.textContent, 'This device');
    assert.equal(f.context.ftNanahMapCenterDetail.textContent, 'Receives parent updates for this profile.');
    assert.equal(f.context.ftNanahDeviceEmpty.textContent, 'No parent device connected. Enter the parent code or choose Receive nearby.');
    assert.equal(f.context.ftNanahMapTitle.textContent, 'Receive a parent update');
    assert.equal(f.context.preview.title, 'Receive a parent update');
    assert.equal(f.context.ftNanahAddDeviceBtn.textContent, 'Enter parent code');
    assert.equal(f.context.ftNanahFindNearbyBtn.disabled, true);
    assert.equal(f.context.ftNanahDeviceEmpty.hidden, false);
    assert.equal(f.context.ftNanahDeviceCompass.dataset.syncContext, 'family');
    assert.equal(f.context.ftNanahDeviceCompass.attributes['aria-label'], 'Receive a parent update');
    assert.equal(f.stage.attributes['aria-label'], 'Enter the parent code or choose Receive nearby, then match the safety phrase.');
    assert.equal(f.center.dataset.filtertubeHelp, 'Receives parent updates for this profile.');
    assert.equal(f.context.ftNanahMapEyebrow.textContent, 'Family device map');
    assert.equal(f.context.ftNanahMapRuleTitle.textContent, 'Receive a parent update');
    assert.equal(f.context.ftNanahMapRuleDetail.textContent, 'Enter the parent code or choose Receive nearby, then match the safety phrase.');
    assert.equal(f.model.personalSyncOpen, personal, 'receiving copy must not mutate retained mode state');
  });
}

test('child empty text does not instruct a disabled Find action even if a previous search flag remains', () => {
  const f = fixture({ child: true });
  f.model.nearbyDiscoveryActive = true;
  f.render();
  assert.equal(f.context.ftNanahDeviceEmpty.textContent, 'No parent device connected. Enter the parent code or choose Receive nearby.');
});

test('child session hint always describes receiving, including a retained outgoing mode and sender target', () => {
  for (const mode of ['send_once', 'parent_control']) {
    const f = fixture({ child: true, mode });
    f.context.getNanahSelectedRemoteTargetProfile = () => ({ profileName: 'Remote child' });
    assert.equal(f.hint('active'), 'This profile only receives parent updates. Enter the parent code and confirm the safety phrase on both devices.');
  }
});

test('parent map and target hint retain their existing sending copy', () => {
  const f = fixture({ mode: 'parent_control' });
  f.render();
  assert.equal(f.context.ftNanahMapCenterEyebrow.textContent, 'Parent device');
  assert.equal(f.context.ftNanahMapCenterDetail.textContent, 'Choose rules here, then send.');
  assert.equal(f.context.ftNanahDeviceEmpty.textContent, 'No saved devices yet. Find a nearby device or add one with a code.');
  assert.equal(f.context.ftNanahFindNearbyBtn.disabled, false);
  assert.equal(f.context.preview.title, 'Pair a protected device');
  assert.equal(f.context.ftNanahDeviceCompass.dataset.syncContext, 'family');
  assert.match(f.context.ftNanahDeviceCompass.attributes['aria-label'], /^Family Devices map\./);
  assert.equal(f.stage.attributes['aria-label'], 'Choose how this parent device reaches a protected device');
  assert.match(f.hint('main'), /^main will write into Other profile on Other device\./);
});

test('ordinary personal copy retains its profile label, outgoing hint and preview', () => {
  const f = fixture({ personal: true });
  f.render();
  assert.equal(f.context.ftNanahMapCenterEyebrow.textContent, 'This device');
  assert.equal(f.context.ftNanahMapCenterDetail.textContent, 'Current local profile');
  assert.equal(f.context.ftNanahDeviceEmpty.textContent, 'No saved devices yet. Find a nearby device or add one with a code.');
  assert.equal(f.context.preview.eyebrow, 'Copy this profile');
  assert.equal(f.context.ftNanahDeviceCompass.dataset.syncContext, 'personal');
  assert.match(f.context.ftNanahDeviceCompass.attributes['aria-label'], /^My Devices map\. Copying Current local profile\./);
  assert.equal(f.stage.attributes['aria-label'], 'Choose how to connect another personal device');
  assert.match(f.hint('active'), /^This profile will be offered to Other profile on Other device\./);
});

test('new child copy uses the existing localization lookup with English fallbacks', () => {
  const f = fixture({ child: true, translations: {
    'dashboard.sync.picker.receiveLocalHelp': 'Translated local receiving detail',
    'dashboard.sync.picker.receiveEmpty': 'Translated no parent connected',
    'dashboard.sync.picker.receiveSession': 'Translated receiving session hint'
  } });
  f.render();
  assert.equal(f.context.ftNanahMapCenterDetail.textContent, 'Translated local receiving detail');
  assert.equal(f.center.dataset.filtertubeHelp, 'Translated local receiving detail');
  assert.equal(f.context.ftNanahDeviceEmpty.textContent, 'Translated no parent connected');
  assert.equal(f.hint('active'), 'Translated receiving session hint');
});

const confirmedReceive = 'Phrase confirmed here. Keep both devices open. Waiting for a parent update.';
const permissionsReceive = 'Updates follow the permissions approved by a parent on this device.';
const receiveSaved = 'Use the trusted-device controls below to open a receive session or check waiting parent updates.';

for (const saved of [false, true]) {
  test(`locally confirmed child receives with saved link=${saved}, without assuming remote confirmation or a new approval`, () => {
    const f = fixture({ child: true, personal: true });
    Object.assign(f.context.nanahSessionState, { connected: true, sasConfirmed: true, remoteDevice: { deviceId: 'parent-device' } });
    f.model.liveReady = true;
    if (saved) {
      f.context.nanahTrustedLinks = [{ linkId: 'saved-parent' }];
      f.model.devices = [{ id: 'saved-parent', linkId: 'saved-parent', source: 'trusted-link' }];
    }
    const original = JSON.stringify([f.context.nanahSessionState, f.context.nanahTrustedLinks]);
    f.render();
    assert.equal(f.context.preview.title, 'Receive a parent update');
    assert.equal(f.context.preview.detail, confirmedReceive);
    assert.equal(f.context.preview.primaryAction, 'View receive status');
    assert.equal(f.context.ftNanahDeviceCompassRule.textContent, confirmedReceive);
    assert.equal(JSON.stringify([f.context.nanahSessionState, f.context.nanahTrustedLinks]), original);
    assert.equal('remoteSasConfirmed' in f.context.nanahSessionState, false);
  });
}

test('selected live child preview keeps the exact phrase prompt until local confirmation, then shows receiving status', () => {
  const f = fixture({ child: true });
  f.context.nanahFamilyDeviceSelectedIntent = { source: 'live-session', deviceId: 'parent-device', title: 'Parent' };
  Object.assign(f.context.nanahSessionState, { connected: true, sasConfirmed: false,
    remoteDevice: { deviceId: 'parent-device' }, remoteProfile: { profileName: 'Parent' } });
  f.render();
  assert.equal(f.context.preview.detail, 'Compare the safety phrase on both devices and confirm only if they match exactly.');
  assert.equal(f.context.preview.primaryAction, 'Match safety phrase');
  f.context.nanahSessionState.sasConfirmed = true; f.model.liveReady = true;
  f.render();
  assert.equal(f.context.preview.detail, confirmedReceive);
  assert.equal(f.context.preview.primaryAction, 'View receive status');
});

test('selected saved child device uses receive controls even if row carries an outgoing action', () => {
  const f = fixture({ child: true });
  f.context.nanahFamilyDeviceSelectedIntent = { source: 'trusted-link', linkId: 'saved-parent', title: 'Parent' };
  Object.assign(f.context.nanahSessionState, { connected: true, sasConfirmed: true });
  f.model.liveReady = true;
  f.model.devices = [{ id: 'saved-parent', linkId: 'saved-parent', source: 'trusted-link', label: 'Parent computer',
    deliveryState: 'Ready', primaryAction: 'Send update', canSend: true, canReceive: true }];
  f.render();
  assert.ok(f.context.preview.detail.endsWith(receiveSaved));
  assert.doesNotMatch(f.context.preview.detail, /before sending|then send/);
  assert.equal(f.context.preview.primaryAction, 'View receive status');
});

test('confirmed receive intent suppresses obsolete outgoing detail without discarding selection state; adult copy is unchanged', () => {
  const f = fixture({ child: true });
  const nodes = { span: textNode(), strong: textNode(), small: textNode() };
  f.context.ftNanahSelectedIntent = { querySelector: selector => nodes[selector] };
  vm.runInNewContext([actualFunction('getNanahFamilyDeviceIntentStageCopy'), actualFunction('renderNanahFamilyDeviceIntent')].join('\n'), f.context);
  const intent = { title: 'Selected parent', source: 'trusted-link', linkId: 'parent-link', detail: 'Review the destination, then send the update.' };
  f.context.nanahFamilyDeviceSelectedIntent = intent;
  Object.assign(f.context.nanahSessionState, { connected: true, sasConfirmed: true });
  f.context.renderNanahFamilyDeviceIntent();
  assert.equal(nodes.small.textContent, confirmedReceive);
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent, intent);
  assert.equal(intent.detail, 'Review the destination, then send the update.');
  f.context.isActiveChildNanahProfile = () => false;
  f.context.renderNanahFamilyDeviceIntent();
  assert.equal(nodes.small.textContent, 'Review the profile update, then send it or save parent trust only for this verified device. Review the destination, then send the update.');
  f.context.isActiveChildNanahProfile = () => true;
  f.context.nanahSessionState.sasConfirmed = false; f.context.nanahSessionState.sasPhrase = 'exact test phrase';
  assert.equal(f.context.getNanahFamilyDeviceIntentStageCopy().detail, 'Do not send yet. Confirm only when both devices show the same safety phrase.');
});

test('actual retained disabled mode card labels and help return exactly to personal copy on leaving child profile', () => {
  const f = fixture({ child: true, personal: true });
  const runtime = [actualFunction('updateNanahModeCardCopy'), actualFunction('updateNanahModeUi')].join('\n');
  for (const name of new Set((runtime + actualFunction('setNanahModeButtons')).match(/\bftNanah\w+/g))) f.context[name] = null;
  const descendants = Object.fromEntries(['eyebrow', 'title', 'body'].map(name => [`.nanah-sync-mode__${name}`, textNode()]));
  const card = { ...textNode(), dataset: { mode: 'send_once' }, querySelector: selector => descendants[selector] };
  Object.assign(f.context, {
    ftNanahModeSendOnce: card, nanahClient: {},
    isNanahChildReceiveOnly: () => f.context.isActiveChildNanahProfile(), isNanahChildReplicaOnly: () => false,
    isChildProfileAdminSurface: () => f.context.isActiveChildNanahProfile(), normalizeNanahUiMode: value => value,
    getNanahRole: () => 'replica', getActiveProfileType: () => f.context.isActiveChildNanahProfile() ? 'child' : 'account',
    refreshNanahAdvancedSummary() {}, document: { createElement: textNode }
  });
  vm.runInNewContext([actualFunction('setNanahModeButtons'), runtime].join('\n'), f.context);
  f.context.updateNanahModeUi();
  assert.deepEqual(Object.values(descendants).map(node => node.textContent), ['Receive only', 'This protected profile', 'Parent sends changes.']);
  assert.equal(card.dataset.filtertubeHelp, permissionsReceive);
  assert.equal(card.disabled, true);
  assert.equal(card.dataset.mode, 'send_once');
  f.context.isActiveChildNanahProfile = () => false;
  f.context.updateNanahModeUi();
  assert.deepEqual(Object.values(descendants).map(node => node.textContent), ['Copy once', 'This profile', 'Copy to your own device.']);
  assert.equal(card.dataset.filtertubeHelp, 'Use this for your own second device. It copies this profile once and does not create parent control.');
  assert.equal(card.disabled, true, 'existing inflight-session guard remains in effect');
  f.context.nanahClient = null; f.context.updateNanahModeUi(); assert.equal(card.disabled, false);
});

test('deliberate live and saved child tile selection uses receiving copy immediately, before a polling render', () => {
  const f = fixture({ child: true });
  Object.assign(f.context.nanahSessionState, { connected: true, sasConfirmed: true });
  Object.assign(f.context, {
    setNanahCompassSelectedButton() {},
    setNanahFamilyDeviceIntent: value => { f.context.nanahFamilyDeviceSelectedIntent = value; }
  });
  vm.runInNewContext([actualFunction('selectNanahLiveMapDevice'), actualFunction('selectNanahTrustedMapDevice')].join('\n'), f.context);
  const button = textNode();
  f.context.selectNanahLiveMapDevice({ id: 'parent-device', label: 'Parent', profileName: 'Parent profile' }, button);
  assert.equal(f.context.preview.detail, confirmedReceive);
  assert.equal(f.context.preview.primaryAction, 'View receive status');
  assert.equal(button.attributes['aria-pressed'], 'true');
  f.context.selectNanahTrustedMapDevice({ id: 'parent-link', linkId: 'parent-link', source: 'trusted-link',
    label: 'Parent', canSend: true, primaryAction: 'Send update' }, button);
  assert.equal(f.context.preview.detail, receiveSaved);
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.detail, receiveSaved);
  assert.equal(f.context.nanahFamilyDeviceSelectedIntent.linkId, 'parent-link');
  assert.equal(f.context.preview.primaryAction, 'View receive status');
});

test('new receiving messages use their own localized keys and English catalog entries', () => {
  const translations = {
    'dashboard.sync.picker.receiveConfirmed': 'Translated waiting for parent',
    'dashboard.sync.picker.receivePermissions': 'Translated approved permissions'
  };
  const f = fixture({ child: true, translations });
  f.model.liveReady = true;
  Object.assign(f.context.nanahSessionState, { connected: true, sasConfirmed: true });
  f.render();
  assert.equal(f.context.preview.detail, translations['dashboard.sync.picker.receiveConfirmed']);
  assert.equal(f.context.familyDeviceMapCopy(permissionsReceive), translations['dashboard.sync.picker.receivePermissions']);
  const english = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/en.json', import.meta.url), 'utf8'));
  const batch = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/batches/family-device-map-source.json', import.meta.url), 'utf8')).english;
  for (const key of ['receiveConfirmed', 'receivePermissions', 'receiveModeEyebrow', 'receiveModeTitle', 'receiveModeBody']) {
    const fullKey = `dashboard.sync.picker.${key}`;
    assert.ok(english[fullKey]); assert.equal(batch[fullKey], undefined, 'picker entries are outside the family-map source inventory');
  }
});

test('actual static localization survives child/adult card transitions and the locale event refreshes child copy without resetting mode UI', async () => {
  const f = fixture({ child: false });
  const sources = ['Copy once', 'This profile', 'Copy to your own device.'];
  const selectors = ['eyebrow', 'title', 'body'].map(name => `.nanah-sync-mode__${name}`);
  function label(sourceText) {
    const node = { closest: () => null, childNodes: [] };
    const text = { nodeType: 3, nodeValue: sourceText, isConnected: true, parentElement: node };
    node.childNodes = [text];
    Object.defineProperty(node, 'firstChild', { get: () => node.childNodes[0] });
    Object.defineProperty(node, 'textContent', {
      get: () => node.childNodes.map(child => child.nodeValue).join(''),
      set: value => {
        node.childNodes.forEach(child => { child.isConnected = false; });
        node.childNodes = [{ nodeType: 3, nodeValue: value, isConnected: true, parentElement: node }];
      }
    });
    return node;
  }
  const labels = sources.map(label), originalTexts = labels.map(node => node.firstChild);
  const card = { dataset: { mode: 'send_once' }, querySelector: selector => labels[selectors.indexOf(selector)], querySelectorAll: () => [] };
  const document = {
    body: card, documentElement: {}, querySelectorAll: () => [],
    createTreeWalker() { const nodes = [...originalTexts]; return { nextNode: () => nodes.shift() || null }; }
  };
  delete f.context.window.FilterTubeUiLocalization;
  f.context.window.document = document; f.context.document = document;
  f.context.chrome = { runtime: { getURL: path => `extension://test/${path}` } };
  f.context.fetch = async url => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(new URL(`../../${url.split('extension://test/')[1]}`, import.meta.url), 'utf8')) });
  vm.runInNewContext(fs.readFileSync(new URL('../../js/ui_localization.js', import.meta.url), 'utf8'), f.context);
  const api = f.context.window.FilterTubeUiLocalization;
  api.captureStatic(card);
  let transitionApplies = 0;
  f.context.window.FilterTubeUiLocalization = { ...api, apply: container => { transitionApplies++; api.apply(container); } };
  Object.assign(f.context, { ftNanahModeSendOnce: card, isNanahChildReceiveOnly: () => f.context.isActiveChildNanahProfile() });
  vm.runInNewContext(actualFunction('updateNanahModeCardCopy'), f.context);
  const spanish = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/es_static.json', import.meta.url), 'utf8'));
  const french = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/fr_static.json', import.meta.url), 'utf8'));
  await api.select('es'); api.apply(document);
  const values = () => labels.map(node => node.textContent);
  assert.deepEqual(values(), sources.map(value => spanish[value]));
  f.context.updateNanahModeCardCopy(); f.context.updateNanahModeCardCopy();
  assert.deepEqual(values(), sources.map(value => spanish[value]), 'ordinary adult refresh leaves captured translated nodes untouched');
  assert.equal(transitionApplies, 0);
  f.context.isActiveChildNanahProfile = () => true;
  f.context.updateNanahModeCardCopy();
  const childKeys = ['receiveModeEyebrow', 'receiveModeTitle', 'receiveModeBody'];
  assert.deepEqual(values(), childKeys.map(key => api.text(`dashboard.sync.picker.${key}`)));
  assert.equal(transitionApplies, 0);

  let localeHandler;
  f.context.window.addEventListener = (name, handler) => { assert.equal(name, 'filtertube-ui-locale-changed'); localeHandler = handler; };
  for (const name of ['renderListModeControls', 'renderNanahDeliveryPathStrip', 'syncNanahRemoteTargetOptions',
    'renderSubscriptionsImportState', 'renderProfileSelector', 'renderProfilesManager']) f.context[name] = () => {};
  f.context.updateNanahModeUi = () => assert.fail('a locale event must not reset the broader mode surface');
  const localeEventStart = source.lastIndexOf("    window.addEventListener('filtertube-ui-locale-changed', () => {");
  vm.runInNewContext(source.slice(localeEventStart, source.indexOf('    async function switchToProfile(', localeEventStart)), f.context);
  await api.select('fr'); api.apply(document); localeHandler();
  assert.deepEqual(values(), childKeys.map(key => api.text(`dashboard.sync.picker.${key}`)));
  assert.equal(transitionApplies, 0, 'locale event and child polling do not trigger global static apply');
  await api.select('es'); api.apply(document); localeHandler();
  f.context.isActiveChildNanahProfile = () => false;
  f.context.updateNanahModeCardCopy();
  assert.deepEqual(values(), sources.map(value => spanish[value]));
  assert.equal(transitionApplies, 1);
  assert.equal(card.dataset.filtertubeHelp, 'Use this for your own second device. It copies this profile once and does not create parent control.');
  await api.select('fr'); api.apply(document); localeHandler();
  assert.deepEqual(values(), sources.map(value => french[value]), 'later locale changes still reach the original static bindings');
  assert.equal(transitionApplies, 1);
  assert.ok(originalTexts.every((node, index) => node.isConnected && labels[index].firstChild === node));
  assert.equal(card.dataset.mode, 'send_once');
});
