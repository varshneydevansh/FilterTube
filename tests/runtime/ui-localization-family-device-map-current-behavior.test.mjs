import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'js/tab-view.js'), 'utf8');
const batch = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/batches/family-device-map-source.json'), 'utf8'));

function buildFamilyDeviceMapHelpers(translations = {}) {
  const localizationStart = source.indexOf('function tabViewUiText(');
  const localizationEnd = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', localizationStart);
  const familyStart = source.indexOf('const FAMILY_DEVICE_MAP_COPY = Object.freeze({');
  const familyEnd = source.indexOf('\n    function getNanahFamilyDeviceMapActionContract', familyStart);
  assert.ok(localizationStart >= 0 && localizationEnd > localizationStart, 'tab-view text helper exists');
  assert.ok(familyStart >= 0 && familyEnd > familyStart, 'Family Devices copy helpers exist');

  const context = {
    translations,
    window: {
      FilterTubeUiLocalization: {
        text(key, values = {}) {
          const template = translations[key];
          if (typeof template !== 'string') return null;
          return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
        }
      }
    },
    normalizeString(value) {
      return String(value ?? '').trim();
    },
    normalizeNonNegativeInteger(value) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
    }
  };
  const helperSource = `${source.slice(localizationStart, localizationEnd)}\n${source.slice(familyStart, familyEnd)}`;
  return vm.runInNewContext(`(() => { ${helperSource}\nreturn {
    copy: familyDeviceMapCopy,
    count: familyDeviceMapCount,
    deliveryStatus: familyDeviceMapDeliveryStatus,
    dictionary: FAMILY_DEVICE_MAP_COPY,
    reused: FAMILY_DEVICE_MAP_REUSED_COPY
  }; })()`, context);
}

function buildFamilyDeviceMapRedactor() {
  const start = source.indexOf('function redactNanahFamilyDeviceMapSnapshot(');
  const end = source.indexOf('\n    function updateNanahFamilyDeviceMapSnapshot', start);
  assert.ok(start >= 0 && end > start, 'redacted map snapshot helper exists');
  const context = {
    nanahFamilyDeviceSelectedIntent: { source: 'home-map-choice' },
    safeObject(value) {
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    },
    safeArray(value) {
      return Array.isArray(value) ? value : [];
    },
    normalizeString(value) {
      return String(value ?? '').trim();
    },
    normalizeNonNegativeInteger(value) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
    }
  };
  return vm.runInNewContext(`(() => { ${source.slice(start, end)}\nreturn redactNanahFamilyDeviceMapSnapshot; })()`, context);
}

test('Family Devices English batch exactly covers its wired source keys and placeholders', () => {
  const helpers = buildFamilyDeviceMapHelpers();
  const expected = Object.fromEntries(Object.entries(helpers.dictionary)
    .filter(([, fallback]) => !Object.prototype.hasOwnProperty.call(helpers.reused, fallback))
    .map(([key, fallback]) => [`dashboard.sync.familyDeviceMap.${key}`, fallback]));
  assert.equal(Object.keys(batch).length, 1, 'batch has only its English source map');
  assert.deepEqual(Object.keys(batch.english).sort(), Object.keys(expected).sort());
  assert.deepEqual(batch.english, expected);

  const start = source.indexOf('function getNanahFamilyDeviceMapActionContract');
  const end = source.indexOf('function renderNanahDeliveryPathStrip', start);
  const familySource = source.slice(start, end);
  const directKeys = new Set([...familySource.matchAll(/familyDeviceMap(?:Text|Count)\(\s*'([^']+)'/g)]
    .map(match => match[1]));
  for (const key of directKeys) {
    assert.ok(Object.hasOwn(helpers.dictionary, key), `direct Family Devices key has an English fallback: ${key}`);
  }
  for (const [key, value] of Object.entries(batch.english)) {
    assert.deepEqual(placeholders(value), placeholders(expected[key]), `placeholders remain stable for ${key}`);
  }
});

test('Family Devices copy helper localizes exact and template copy but preserves unknown data', () => {
  const helpers = buildFamilyDeviceMapHelpers({
    'dashboard.sync.familyDeviceMap.map.familyTitle': 'Localized family-map heading',
    'dashboard.sync.familyDeviceMap.device.profileTitle': '{profile} / {device}',
    'dashboard.sync.familyDeviceMap.action.reviewAndSend': 'Review, then send',
    'dashboard.modal.continue': 'Proceed',
    'dashboard.sync.familyDeviceMap.device.status.checked': 'Checked locally',
    'dashboard.sync.familyDeviceMap.device.status.checkedAge': '{status} · {age}',
    'dashboard.sync.familyDeviceMap.device.status.ageMinutes': '{count} minutes ago',
    'dashboard.sync.familyDeviceMap.device.status.homePickupPrefix': 'Home pickup: {status}'
  });

  assert.equal(helpers.copy('Choose how to reach the protected device'), 'Localized family-map heading');
  assert.equal(helpers.copy('Continue'), 'Proceed', 'existing catalog keys are reused');
  assert.equal(helpers.copy('Review and send'), 'Review, then send');
  assert.equal(helpers.copy('Tablet - Kids'), 'Kids / Tablet', 'placeholder values survive template localization');
  assert.equal(helpers.copy('Mira’s personal tablet'), 'Mira’s personal tablet', 'unknown user data is unchanged');
  assert.equal(
    helpers.deliveryStatus('Home Pickup: Checked (3m ago)'),
    'Home pickup: Checked locally · 3 minutes ago'
  );
});

test('Family Devices counts choose translated singular and non-singular messages explicitly', () => {
  const helpers = buildFamilyDeviceMapHelpers({
    'dashboard.sync.familyDeviceMap.map.oneReady': 'One ready: {count}',
    'dashboard.sync.familyDeviceMap.map.manyReady': 'Ready count: {count}'
  });
  for (const count of [0, 1, 2, 5]) {
    assert.equal(
      helpers.count(count, 'map.oneReady', 'map.manyReady', '{count} ready', '{count} ready'),
      count === 1 ? 'One ready: 1' : `Ready count: ${count}`
    );
  }
});

test('render-copy lookup does not mutate the policy model or localize redacted evidence fields', () => {
  const helpers = buildFamilyDeviceMapHelpers({
    'dashboard.sync.familyDeviceMap.action.reviewAndSend': 'Review, then send',
    'dashboard.sync.familyDeviceMap.action.skipParentReview': 'Skip parent review (localized)'
  });
  const redact = buildFamilyDeviceMapRedactor();
  const model = {
    mapState: 'pickup-eligible',
    liveReady: false,
    protectedCount: 1,
    verifiedCount: 1,
    readyCount: 0,
    pickupCheckCount: 1,
    trustedDeviceCount: 1,
    nearbyCandidateCount: 0,
    paths: [{
      id: 'live', state: 'pair', configured: false, healthChecked: true, healthOk: true,
      source: 'live-session', primaryAction: 'Review and send', blockedAction: 'Skip parent review'
    }],
    devices: [{
      source: 'trusted-link', role: 'protected', trustState: 'verified', deliveryState: 'Ready',
      route: 'verified', routeLabel: 'Verified device', profileId: 'kids', profileName: 'Kids',
      canSend: true, canReceive: false, canCheckPickup: true,
      primaryAction: 'Review and send', blockedAction: 'Skip parent review'
    }]
  };
  const before = JSON.stringify(model);
  assert.equal(helpers.copy(model.paths[0].primaryAction), 'Review, then send');
  assert.equal(helpers.copy(model.paths[0].blockedAction), 'Skip parent review (localized)');
  const snapshot = redact(model);

  assert.equal(JSON.stringify(model), before, 'render-copy lookups leave the source model unchanged');
  assert.equal(snapshot.paths[0].primaryAction, 'Review and send');
  assert.equal(snapshot.paths[0].blockedAction, 'Skip parent review');
  assert.equal(snapshot.devices[0].primaryAction, 'Review and send');
  assert.equal(snapshot.devices[0].blockedAction, 'Skip parent review');
  assert.equal(snapshot.devices[0].profileBound, true);
  assert.equal(Object.hasOwn(snapshot.devices[0], 'profileName'), false, 'redacted evidence still excludes profile names');
});

function placeholders(value) {
  return [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]).sort();
}
