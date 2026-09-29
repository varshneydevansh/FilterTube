import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const tabView = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

const textHelpers = sliceBetween(tabView, 'function tabViewUiText(', 'function localizeFilterModeOptions(');

function localizationContext(translations = {}) {
  const calls = [];
  const context = {
    window: {
      FilterTubeUiLocalization: {
        text(key, values = {}) {
          calls.push({ key, values });
          const template = translations[key];
          if (typeof template !== 'string') throw new Error(`missing key: ${key}`);
          return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
            (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
        }
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(`${textHelpers}\nthis.tabViewUiText = tabViewUiText;\nthis.tabViewModalActionText = tabViewModalActionText;`, context);
  return { context, calls };
}

test('dashboard localization interpolates placeholders without transforming profile or tab names', () => {
  const dynamicName = 'Mira $& <Kids>';
  const { context, calls } = localizationContext({
    'profileAccess.masterGateMessage': 'Unlock {name} with the Master PIN to view management controls.',
    'dashboard.import.waitPageMessage': 'Waiting for {tabTitle} to finish loading.'
  });

  assert.equal(context.tabViewUiText('profileAccess.masterGateMessage', 'Unlock {name}', { name: dynamicName }),
    `Unlock ${dynamicName} with the Master PIN to view management controls.`);
  assert.equal(context.tabViewUiText('dashboard.import.waitPageMessage', 'Waiting for {tabTitle}.', { tabTitle: dynamicName }),
    `Waiting for ${dynamicName} to finish loading.`);
  assert.equal(context.tabViewUiText('dashboard.import.missing', 'Fallback for {name}', { name: dynamicName }),
    `Fallback for ${dynamicName}`);
  assert.deepEqual(calls.map(call => call.key), [
    'profileAccess.masterGateMessage', 'dashboard.import.waitPageMessage', 'dashboard.import.missing'
  ]);
});

test('PIN access gate and modal copy uses existing unlock keys plus the new dashboard gate keys', () => {
  const accessCopy = sliceBetween(tabView, 'function getProfileAccessCopy(', 'function getAccountPolicy(');
  const dynamicName = 'Family $& <School>';
  const translations = {
    'profileAccess.masterEyebrow': 'Master access (translated)',
    'profileAccess.masterGateTitle': 'Master profile locked (translated)',
    'profileAccess.masterGateMessage': 'Unlock {name} (translated).',
    'profileAccess.enterMasterPinTitle': 'Enter master PIN (translated)',
    'profileAccess.masterPinMessage': 'Master PIN required (translated)',
    'profileAccess.masterPinPlaceholder': 'Master PIN (translated)',
    'profileAccess.protectedProfileEyebrow': 'Protected profile (translated)',
    'profileAccess.protectedProfileGateTitle': 'Protected profile (translated)',
    'profileAccess.unlockProfileTitle': 'Unlock {name} (translated)',
    'profileAccess.lockedProfileMessage': '{name} is locked (translated).',
    'profileAccess.profilePinPlaceholder': 'Profile PIN (translated)',
    'profileAccess.unlockProfileGateMessage': 'Unlock {name} to manage (translated).'
  };
  const context = {
    window: {
      FilterTubeUiLocalization: {
        text(key, values = {}) {
          const template = translations[key];
          if (!template) throw new Error(`missing ${key}`);
          return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
            (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
        }
      }
    },
    getProfileName(_profiles, profileId) { return profileId === 'default' ? 'Default' : dynamicName; },
    getProfileType(_profiles, profileId) { return profileId === 'default' ? 'account' : 'child'; }
  };
  vm.createContext(context);
  vm.runInContext(`${accessCopy}\nthis.getAccessCopy = getProfileAccessCopy;`, context);

  const master = context.getAccessCopy({}, 'default');
  assert.equal(master.eyebrow, 'Master access (translated)');
  assert.equal(master.title, 'Enter master PIN (translated)');
  assert.equal(master.gateTitle, 'Master profile locked (translated)');
  assert.equal(master.gateMessage, 'Unlock Default (translated).');

  const child = context.getAccessCopy({}, 'child');
  assert.equal(child.eyebrow, 'Protected profile (translated)');
  assert.equal(child.title, `Unlock ${dynamicName} (translated)`);
  assert.equal(child.message, `${dynamicName} is locked (translated).`);
  assert.equal(child.gateTitle, 'Protected profile (translated)');
  assert.equal(child.gateMessage, `Unlock ${dynamicName} to manage (translated).`);
});

test('subscription import mode choice localizes copy while preserving the stored choice values', async () => {
  const choiceFunction = sliceBetween(tabView, 'async function confirmSubscriptionsImportModeChoice()', 'async function verifyPin(');
  const { context, calls } = localizationContext(Object.fromEntries([
    'dashboard.import.modeChoiceTitle', 'dashboard.import.modeChoiceMessage',
    'dashboard.import.modeChoiceImportOnly', 'dashboard.import.modeChoiceTurnOn',
    'dashboard.import.modeChoiceSummary', 'dashboard.import.importOnly',
    'dashboard.import.importAndEnable'
  ].map(key => [key, `localized:${key}`])));
  let captured = null;
  context.StateManager = { getState: () => ({ mode: 'blocklist' }) };
  context.showChoiceModal = options => { captured = options; return Promise.resolve('import-only'); };
  vm.runInContext(`${choiceFunction}\nthis.chooseImportMode = confirmSubscriptionsImportModeChoice;`, context);

  assert.equal(await context.chooseImportMode(), 'import-only');
  assert.equal(captured.title, 'localized:dashboard.import.modeChoiceTitle');
  assert.equal(captured.message, 'localized:dashboard.import.modeChoiceMessage');
  assert.deepEqual(Array.from(captured.details), [
    'localized:dashboard.import.modeChoiceImportOnly',
    'localized:dashboard.import.modeChoiceTurnOn',
    'localized:dashboard.import.modeChoiceSummary'
  ]);
  assert.deepEqual(Array.from(captured.choices, choice => [choice.value, choice.label]), [
    ['import-only', 'localized:dashboard.import.importOnly'],
    ['import-and-enable', 'localized:dashboard.import.importAndEnable']
  ]);
  assert.ok(calls.some(call => call.key === 'dashboard.import.modeChoiceTurnOn'));
});

test('subscription wait status localizes phase copy but leaves tab title and runtime metadata intact', () => {
  const waitFunction = sliceBetween(tabView, 'function updateSubscriptionsImportWaitState(', 'async function waitForYoutubeTabReady(');
  const translations = {
    'dashboard.import.waitPageTitle': 'Waiting title',
    'dashboard.import.waitPageMessage': 'Waiting for {tabTitle} (translated).',
    'dashboard.import.waitPageMeta': 'Keep tab open (translated).',
    'dashboard.import.selectedYoutubeTab': 'selected tab (translated)'
  };
  const { context } = localizationContext(translations);
  let latestState = null;
  context.normalizeString = value => String(value ?? '').trim();
  context.setSubscriptionsImportState = state => { latestState = state; };
  vm.runInContext(`${waitFunction}\nthis.updateWaitState = updateSubscriptionsImportWaitState;`, context);

  context.updateWaitState('waiting_page', { tabTitle: 'Family YouTube — <Kids>' });
  assert.equal(latestState.title, 'Waiting title');
  assert.equal(latestState.message, 'Waiting for Family YouTube — <Kids> (translated).');
  assert.equal(latestState.meta, 'Keep tab open (translated).');

  context.updateWaitState('waiting_page', { meta: 'runtime-generated diagnostic' });
  assert.equal(latestState.message, 'Waiting for selected tab (translated) (translated).');
  assert.equal(latestState.meta, 'runtime-generated diagnostic');
  assert.equal(latestState.inProgress, true);
});

test('coded subscription import errors localize known cases but preserve raw runtime error text', () => {
  const errorFunction = sliceBetween(tabView, 'function describeSubscriptionsImportError(', 'function getProfileColors(');
  const translations = {
    'dashboard.import.errorSignedOut': 'translated signed out',
    'dashboard.import.errorReceiverUnavailable': 'translated receiver unavailable',
    'dashboard.import.errorProfileLocked': 'translated locked',
    'dashboard.import.errorProfileChanged': 'translated profile changed',
    'dashboard.import.errorTabImportFailed': 'translated tab failure',
    'dashboard.import.errorFallback': 'translated generic failure'
  };
  const { context } = localizationContext(translations);
  context.normalizeString = value => String(value ?? '').trim();
  vm.runInContext(`${errorFunction}\nthis.describeImportError = describeSubscriptionsImportError;`, context);

  assert.equal(context.describeImportError({ errorCode: 'signed_out' }), 'translated signed out');
  assert.equal(context.describeImportError({ errorCode: 'profile_locked' }), 'translated locked');
  assert.equal(context.describeImportError({ error: 'Exact response: <not translated>' }), 'Exact response: <not translated>');
  assert.equal(context.describeImportError({}), 'translated generic failure');
});

test('dashboard dynamic filter, PIN, modal, and import feedback paths use their keyed copy', () => {
  const keyFallbacks = [
    ['dashboard.toast.categoryFiltersSaved', 'Category filters saved'],
    ['dashboard.toast.protectedCategoryFiltersSaved', 'Protected profile category filters saved'],
    ['dashboard.toast.videoFiltersSaved', 'Video filters saved'],
    ['dashboard.toast.protectedVideoFiltersSaved', 'Protected profile video filters saved'],
    ['dashboard.toast.videoFiltersSaveFailed', 'Failed to save video filters'],
    ['dashboard.toast.kidsCategoryFiltersSaved', 'Kids category filters saved'],
    ['dashboard.toast.protectedKidsCategoryFiltersSaved', 'Protected profile Kids category filters saved'],
    ['dashboard.toast.kidsCategoryFiltersSaveFailed', 'Failed to save kids category filters'],
    ['dashboard.toast.kidsVideoFiltersSaved', 'Kids video filters saved'],
    ['dashboard.toast.protectedKidsVideoFiltersSaved', 'Protected profile Kids video filters saved'],
    ['dashboard.toast.kidsVideoFiltersSaveFailed', 'Failed to save kids video filters'],
    ['dashboard.toast.pinRateLimited', 'Too many incorrect PIN attempts. Try again later.'],
    ['dashboard.toast.pinIncorrect', 'Incorrect PIN'],
    ['dashboard.toast.pinMismatch', 'PINs do not match'],
    ['dashboard.toast.unlockSuccess', 'Unlocked'],
    ['dashboard.toast.unlockFailed', 'Failed to unlock'],
    ['dashboard.toast.profilePinUpdated', 'Profile switching PIN updated'],
    ['dashboard.toast.profilePinRemoved', 'Profile switching PIN removed'],
    ['dashboard.toast.masterPinUpdated', 'Master PIN updated'],
    ['dashboard.toast.masterPinRemoved', 'Master PIN removed'],
    ['dashboard.toast.securityManagerUnavailable', 'Security manager unavailable'],
    ['dashboard.toast.subscriptionsImportLocked', 'Unlock this profile to import subscribed channels'],
    ['dashboard.toast.subscriptionsImportSignIn', 'Sign in to YouTube, then retry the import'],
    ['dashboard.toast.subscriptionsImportTabLoading', 'YouTube tab is still loading'],
    ['dashboard.toast.subscriptionsImportFailed', 'Subscribed channel import failed'],
    ['dashboard.toast.subscriptionsImportNoChannels', 'No subscribed channels found'],
    ['dashboard.toast.subscriptionsImportComplete', 'Subscribed channels imported'],
    ['dashboard.toast.subscriptionsImportCompleteAndWhitelistEnabled', 'Subscribed channels imported and whitelist mode enabled']
  ];
  for (const [key, fallback] of keyFallbacks) {
    assert.ok(tabView.includes(`tabViewUiText('${key}', '${fallback}')`), `${key} uses the exact English fallback`);
  }

  for (const key of [
    'dashboard.pin.profileSetTitle', 'dashboard.pin.profilePrompt', 'dashboard.pin.profileConfirmTitle',
    'dashboard.pin.profileConfirmPrompt', 'dashboard.pin.profilePlaceholder', 'dashboard.pin.masterSetTitle',
    'dashboard.pin.masterChangeTitle', 'dashboard.pin.masterPrompt', 'dashboard.pin.masterConfirmTitle',
    'dashboard.pin.masterConfirmPrompt', 'dashboard.pin.setButton', 'dashboard.pin.changeButton', 'dashboard.pin.removeButton',
    'dashboard.modal.confirm', 'dashboard.modal.cancel', 'dashboard.modal.continue', 'dashboard.modal.save',
    'dashboard.import.turnOnWhitelistAction', 'dashboard.import.retryAction', 'dashboard.import.buttonLabel',
    'dashboard.import.buttonBusyLabel', 'dashboard.import.waitSearchTitle', 'dashboard.import.waitSearchMessage',
    'dashboard.import.waitPageTitle', 'dashboard.import.waitPageMessage', 'dashboard.import.waitPageMeta',
    'dashboard.import.waitBridgeTitle', 'dashboard.import.waitBridgeMessage', 'dashboard.import.waitBridgeMeta',
    'dashboard.import.bootstrapTitle', 'dashboard.import.bootstrapMessage', 'dashboard.import.bootstrapMeta',
    'dashboard.import.openingTitle', 'dashboard.import.openingMessage', 'dashboard.import.openingMeta',
    'dashboard.import.errorSignedOut', 'dashboard.import.errorReceiverUnavailable', 'dashboard.import.errorProfileLocked',
    'dashboard.import.errorProfileChanged', 'dashboard.import.errorTabImportFailed', 'dashboard.import.errorFallback'
  ]) assert.ok(tabView.includes(key), `${key} is wired into dashboard copy`);
});
