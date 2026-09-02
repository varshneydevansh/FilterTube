import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const background = read('js/background.js');
const tabView = read('js/tab-view.js');
const popup = read('js/popup.js');
const html = read('html/tab-view.html');
const docs = read('docs/SELF_CONTROL_SESSION_SPEC_2026-08-17.md');

test('background owns a persisted profile-scoped Self-Control Session', () => {
  assert.match(background, /const SELF_CONTROL_SESSION_KEY = 'ftSelfControlSessionV1'/);
  assert.match(background, /async function startSelfControlSession\([\s\S]*?sessionKind = SELF_CONTROL_SESSION_KIND_GENERAL/);
  assert.match(background, /profileSnapshot/);
  assert.match(background, /profileSnapshot\.settings = \{[\s\S]*?enabled: true/);
  assert.match(background, /lockedUntil: startedAt \+ \(minutes \* 60 \* 1000\)/);
  assert.match(background, /async function enforceSelfControlProfileSnapshot\(changedProfilesV4\)/);
  assert.match(background, /activeProfileId: session\.profileId/);
  assert.match(background, /profiles\[session\.profileId\] = cloneJsonValue\(session\.profileSnapshot\)/);
  assert.match(background, /canClearExpiredSession/);
});

test('actual background helpers enable, snapshot, pin, and restore the active profile', async () => {
  const start = background.indexOf('function cloneJsonValue');
  const end = background.indexOf("try {\n    if (browserAPI.tabs?.onRemoved", start);
  assert.ok(start >= 0 && end > start);
  const helperSource = background.slice(start, end);
  const writes = [];
  const storage = {
    ftProfilesV4: {
      schemaVersion: 4,
      activeProfileId: 'focus',
      profiles: {
        default: { name: 'Default', settings: { enabled: true }, main: { mode: 'blocklist' } },
        focus: {
          name: 'Focus',
          settings: { enabled: false },
          main: {
            mode: 'whitelist',
            whitelistChannels: [{ id: 'UCfocus', name: 'Focus Channel' }],
            whitelistKeywords: ['study'],
            allowedVideoIds: ['focus-video']
          },
          kids: { mode: 'blocklist', whitelistChannels: [{ id: 'UCkids' }] }
        }
      }
    }
  };
  const alarms = [];
  const context = {
    console,
    Date,
    Math,
    JSON,
    SELF_CONTROL_SESSION_KEY: 'ftSelfControlSessionV1',
    SELF_CONTROL_SESSION_SCHEMA: 'filtertube_self_control_session',
    SELF_CONTROL_SESSION_KIND_GENERAL: 'self_control',
    SELF_CONTROL_SESSION_KIND_HARD_WHITELIST: 'hard_whitelist',
    SELF_CONTROL_SESSION_ALARM: 'ftSelfControlSessionExpiry',
    SELF_CONTROL_MIN_MINUTES: 1,
    SELF_CONTROL_MAX_MINUTES: 10080,
    FT_PROFILES_V4_KEY: 'ftProfilesV4',
    DEFAULT_PROFILE_ID: 'default',
    compiledSettingsCache: { main: {}, kids: {} },
    restoringExpiredHardWhitelistSession: false,
    safeArray: (value) => Array.isArray(value) ? value : [],
    safeObject: (value) => value && typeof value === 'object' ? value : {},
    normalizeString: (value) => typeof value === 'string' ? value.trim() : '',
    normalizeNonNegativeInteger: (value) => Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null,
    isTrustedUiSender: () => true,
    isValidProfilesV4: (value) => !!(value?.activeProfileId && value?.profiles),
    storageGet: async (keys) => Object.fromEntries(keys.map((key) => [key, storage[key]])),
    browserAPI: {
      storage: {
        local: {
          set: async (payload) => {
            Object.assign(storage, JSON.parse(JSON.stringify(payload)));
            writes.push(payload);
          },
          remove: async (key) => { delete storage[key]; }
        }
      },
      alarms: {
        create: async (name, details) => { alarms.push({ name, details }); },
        clear: async (name) => { alarms.push({ clear: name }); return true; }
      }
    }
  };
  vm.runInNewContext(`${helperSource}\nthis.api = { startSelfControlSession, getActiveSelfControlSession, enforceSelfControlProfileSnapshot };`, context);

  let response = null;
  await context.api.startSelfControlSession({ minutes: 30 }, { url: 'chrome-extension://test/html/tab-view.html' }, (value) => { response = value; });
  assert.equal(response?.active, true);
  assert.equal(storage.ftProfilesV4.activeProfileId, 'focus');
  assert.equal(storage.ftProfilesV4.profiles.focus.settings.enabled, true);
  assert.equal(storage.ftSelfControlSessionV1.profileSnapshot.main.mode, 'whitelist');
  assert.equal(alarms[0]?.name, 'ftSelfControlSessionExpiry');

  const attempted = structuredClone(storage.ftProfilesV4);
  attempted.activeProfileId = 'default';
  attempted.profiles.focus.main.mode = 'blocklist';
  const restored = await context.api.enforceSelfControlProfileSnapshot(attempted);
  assert.equal(restored, true);
  assert.equal(storage.ftProfilesV4.activeProfileId, 'focus');
  assert.equal(storage.ftProfilesV4.profiles.focus.main.mode, 'whitelist');
  assert.ok(writes.length >= 2);

  delete storage.ftSelfControlSessionV1;
  const originalHardProfile = structuredClone(storage.ftProfilesV4.profiles.focus);
  response = null;
  await context.api.startSelfControlSession(
    { minutes: 30 },
    { url: 'chrome-extension://test/html/tab-view.html' },
    (value) => { response = value; },
    'hard_whitelist'
  );
  assert.equal(response?.active, true);
  assert.equal(response?.sessionKind, 'hard_whitelist');
  assert.equal(response?.hardWhitelist, true);
  assert.equal(response?.allowedChannelCount, 1);
  assert.equal(storage.ftProfilesV4.profiles.focus.settings.enabled, true);
  assert.equal(storage.ftProfilesV4.profiles.focus.main.mode, 'whitelist');
  assert.deepEqual(storage.ftProfilesV4.profiles.focus.main.whitelistChannels, [{ id: 'UCfocus', name: 'Focus Channel' }]);
  assert.deepEqual(storage.ftProfilesV4.profiles.focus.main.whitelistKeywords, []);
  assert.deepEqual(storage.ftProfilesV4.profiles.focus.main.allowedVideoIds, []);
  assert.equal(storage.ftProfilesV4.profiles.focus.kids.mode, 'blocklist');

  const expiredAt = Date.now();
  storage.ftSelfControlSessionV1.startedAt = expiredAt - 2_000;
  storage.ftSelfControlSessionV1.lockedUntil = expiredAt - 1_000;
  const expired = await context.api.getActiveSelfControlSession();
  assert.equal(expired, null);
  assert.ok(alarms.some((entry) => entry.clear === 'ftSelfControlSessionExpiry'));
  assert.equal(storage.ftProfilesV4.profiles.focus.main.mode, originalHardProfile.main.mode);
  assert.deepEqual(storage.ftProfilesV4.profiles.focus.main.whitelistKeywords, originalHardProfile.main.whitelistKeywords);
  assert.deepEqual(storage.ftProfilesV4.profiles.focus.main.allowedVideoIds, originalHardProfile.main.allowedVideoIds);

  // The expired hard session remains the recovery authority if restoring the
  // profile fails, and a later read can retry once storage is available.
  response = null;
  await context.api.startSelfControlSession(
    { minutes: 30 },
    { url: 'chrome-extension://test/html/tab-view.html' },
    (value) => { response = value; },
    'hard_whitelist'
  );
  assert.equal(response?.active, true);
  const failedRestoreAt = Date.now();
  storage.ftSelfControlSessionV1.startedAt = failedRestoreAt - 2_000;
  storage.ftSelfControlSessionV1.lockedUntil = failedRestoreAt - 1_000;
  const storedForcedProfiles = storage.ftProfilesV4;
  storage.ftProfilesV4 = null;
  const failedRestore = await context.api.getActiveSelfControlSession();
  assert.equal(failedRestore, null);
  assert.ok(storage.ftSelfControlSessionV1, 'expired hard session must be retained for retry');
  assert.ok(alarms.some((entry) => entry.name === 'ftSelfControlSessionExpiry' && entry.details?.when > failedRestoreAt));
  storage.ftProfilesV4 = storedForcedProfiles;
  const retriedRestore = await context.api.getActiveSelfControlSession();
  assert.equal(retriedRestore, null);
  assert.equal(storage.ftSelfControlSessionV1, undefined);
  assert.equal(storage.ftProfilesV4.profiles.focus.main.mode, originalHardProfile.main.mode);

  storage.ftProfilesV4.profiles.focus.main.whitelistChannels = [];
  response = null;
  await context.api.startSelfControlSession(
    { minutes: 30 },
    { url: 'chrome-extension://test/html/tab-view.html' },
    (value) => { response = value; },
    'hard_whitelist'
  );
  assert.equal(response?.ok, false);
  assert.equal(response?.error, 'hard_whitelist_requires_allowed_channels');
});

test('strict session rejects switching and has no early-cancel message action', () => {
  assert.match(background, /error: 'self_control_profile_switch_locked'/);
  assert.match(background, /FilterTube_StartSelfControlSession/);
  assert.match(background, /FilterTube_GetSelfControlSession/);
  assert.doesNotMatch(background, /FilterTube_(Cancel|Stop|End)SelfControlSession/);
  assert.doesNotMatch(tabView, /FilterTube_(Cancel|Stop|End)SelfControlSession/);
});

test('hard whitelist path forces Main channel-only policy and rejects empty allow sets', () => {
  assert.match(background, /FilterTube_StartHardWhitelistSession/);
  assert.match(background, /SELF_CONTROL_SESSION_KIND_HARD_WHITELIST/);
  assert.match(background, /hard_whitelist_requires_allowed_channels/);
  assert.match(background, /mode: 'whitelist'/);
  assert.match(background, /whitelistKeywords: \[\]/);
  assert.match(background, /allowedVideoIds: \[\]/);
  assert.match(background, /Keep the hard-session record as the recovery authority/);
  assert.match(background, /scheduleSelfControlSessionExpiry/);
  assert.match(background, /reconcileSelfControlSessionExpiry/);
  assert.match(background, /alarm\?\.name === SELF_CONTROL_SESSION_ALARM/);
  assert.match(tabView, /startHardWhitelistSession/);
  assert.match(html, /Hard Timer Whitelist/);
});

test('dashboard and popup show countdown state and pin profile switching', () => {
  assert.match(html, /id="ftSelfControlCountdown"/);
  assert.match(html, /there is no FilterTube cancel button after activation/i);
  assert.match(tabView, /Profile switching is locked for/);
  assert.match(tabView, /setInterval\(\(\) => \{[\s\S]*?renderSelfControlSession\(\)/);
  assert.match(popup, /action: 'FilterTube_GetSelfControlSession'/);
  assert.match(popup, /Profile switching is locked until the Self-Control Session ends/);
});

test('documentation separates commitment locking from daily viewing allowance', () => {
  assert.match(docs, /It is separate from the per-profile daily YouTube allowance/);
  assert.match(docs, /cannot honestly promise an operating-system-level lock/);
  assert.match(docs, /there is no early-cancel path/);
});
