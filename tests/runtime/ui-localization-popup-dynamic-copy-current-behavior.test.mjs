import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const popupPath = path.join(root, 'js/popup.js');
const popupSource = fs.readFileSync(popupPath, 'utf8');
const localesDir = path.join(root, 'data/ui_locales');
const targets = JSON.parse(fs.readFileSync(path.join(localesDir, 'targets.json'), 'utf8'));
const readCatalog = locale => JSON.parse(fs.readFileSync(path.join(localesDir, `${locale}.json`), 'utf8'));

test('popup runtime-generated status copy uses existing localized catalog keys', () => {
  const translations = readCatalog('es');
  const helperSource = popupSource.match(
    /function popupUiText\(key, fallback, values = \{\}\) \{[\s\S]*?^\}/m
  )?.[0];
  assert.ok(helperSource, 'popupUiText helper is present');

  const context = {
    window: {
      FilterTubeUiLocalization: {
        text(key) { return translations[key]; }
      }
    }
  };
  vm.runInNewContext(helperSource, context);

  for (const key of ['popup.enabled', 'popup.disabled', 'popup.youtubeTime']) {
    assert.ok(translations[key], `Spanish catalog provides ${key}`);
    assert.equal(context.popupUiText(key, 'English fallback'), translations[key]);
  }
  assert.equal(context.popupUiText('missing.key', 'English fallback'), 'English fallback');

  assert.match(popupSource, /const statusKey = enabled \? 'popup\.enabled' : 'popup\.disabled'/);
  assert.match(popupSource, /statusText\.textContent = popupUiText\(statusKey, enabled \? 'Enabled' : 'Disabled'\)/);
  assert.match(popupSource, /statusLabel\.textContent = popupUiText\('popup\.youtubeTime', 'YouTube time'\)/);
  assert.match(popupSource, /window\.addEventListener\('filtertube-ui-locale-changed'[\s\S]*?updateCheckboxes\(\)/);
});

test('all 38 bundled keyed catalogs already contain the runtime popup labels', () => {
  const keys = [
    'popup.enabled', 'popup.disabled', 'popup.youtubeTime',
    'popup.blocklist', 'popup.whitelist',
    'popup.listMode.whitelistTooltip', 'popup.listMode.blocklistTooltip',
    'popup.limitReached', 'popup.timeHoursMinutesLeft', 'popup.timeMinutesSecondsLeft',
    'popup.timeSecondsLeft', 'popup.timeHoursMinutesCompact',
    'popup.timeMinutesSecondsCompact', 'popup.timeSecondsCompact',
    'popup.hardWhitelist', 'popup.strictSession', 'popup.hardWhitelistTimerTitle',
    'popup.strictSessionTimerTitle', 'popup.managedTimeTimerTitle',
    'popup.selfControlSessionActive', 'popup.selfControlPinnedHint'
  ];
  assert.equal(targets.locales.length, 38);
  for (const { code } of targets.locales) {
    const catalog = readCatalog(code);
    for (const key of keys) {
      assert.equal(typeof catalog[key], 'string', `${code}: ${key}`);
      assert.ok(catalog[key].trim(), `${code}: ${key} is non-empty`);
    }
  }
});

test('popup timer formatter localizes zero, hours, minutes, and seconds in both display forms', () => {
  const helperSource = popupSource.match(
    /function popupUiText\(key, fallback, values = \{\}\) \{[\s\S]*?^\}/m
  )?.[0];
  const formatterSource = popupSource.match(
    /^    function formatPopupManagedTimeRemaining\(seconds, compact = false\) \{[\s\S]*?^    \}/m
  )?.[0];
  assert.ok(helperSource, 'popupUiText helper is present');
  assert.ok(formatterSource, 'popup timer formatter is present');

  const beforeCatalog = { window: {} };
  vm.runInNewContext(`${helperSource}\n${formatterSource}`, beforeCatalog);
  assert.equal(beforeCatalog.popupUiText('missing.key', '{name}: {count}', { name: 'Home', count: 3 }), 'Home: 3');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(0), 'Limit reached');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(3661), '1h 1m left');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(65), '1m 5s left');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(23), '23s left');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(0, true), 'Limit reached');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(3661, true), '1h 1m');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(65, true), '1m 5s');
  assert.equal(beforeCatalog.formatPopupManagedTimeRemaining(23, true), '23s');

  const spanish = readCatalog('es');
  const translated = {
    window: {
      FilterTubeUiLocalization: {
        text(key, values = {}) {
          const template = spanish[key];
          if (typeof template !== 'string') throw new Error(`Missing ${key}`);
          return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
            (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
        }
      }
    }
  };
  vm.runInNewContext(`${helperSource}\n${formatterSource}`, translated);
  assert.equal(translated.formatPopupManagedTimeRemaining(0), 'Límite alcanzado');
  assert.equal(translated.formatPopupManagedTimeRemaining(3661), 'Quedan 1 h y 1 min');
  assert.equal(translated.formatPopupManagedTimeRemaining(65), 'Quedan 1 min y 5 s');
  assert.equal(translated.formatPopupManagedTimeRemaining(23), 'Quedan 23 s');
  assert.equal(translated.formatPopupManagedTimeRemaining(3661, true), '1 h 1 min');
  assert.equal(translated.formatPopupManagedTimeRemaining(65, true), '1 min 5 s');
  assert.equal(translated.formatPopupManagedTimeRemaining(23, true), '23 s');
  assert.equal(translated.popupUiText(
    'popup.hardWhitelistTimerTitle',
    'Main channels allowed for {profileName}: {channelCount} · until the session ends',
    { profileName: 'My Custom Profile', channelCount: 2 }
  ), 'Canales permitidos en Principal para My Custom Profile: 2 · hasta que termine la sesión');
  assert.equal(translated.popupUiText(
    'popup.strictSessionTimerTitle',
    '{profileName} is pinned until the session ends',
    { profileName: 'My Custom Profile' }
  ), 'My Custom Profile está fijado hasta que termine la sesión');
  assert.equal(translated.popupUiText(
    'popup.managedTimeTimerTitle',
    '{profileName} · {remaining}',
    { profileName: 'My Custom Profile', remaining: '2 min 5 s' }
  ), 'My Custom Profile · 2 min 5 s');
  assert.equal(translated.popupUiText(
    'popup.selfControlPinnedHint',
    'This profile and its filters are pinned. {remaining}.',
    { remaining: '2 min 5 s' }
  ), 'Este perfil y sus filtros están fijados. 2 min 5 s.');

  assert.doesNotMatch(popupSource, /\.replace\(['"] left['"]\)/);
  assert.match(popupSource, /popup\.hardWhitelistTimerTitle/);
  assert.match(popupSource, /popup\.strictSessionTimerTitle/);
  assert.match(popupSource, /popup\.managedTimeTimerTitle/);
  assert.match(popupSource, /popup\.selfControlPinnedHint/);
});

test('mode labels, tooltips, and ARIA labels use localized keys while behavior stays unchanged', () => {
  const translations = readCatalog('es');
  const helperSource = popupSource.match(
    /function popupUiText\(key, fallback, values = \{\}\) \{[\s\S]*?^\}/m
  )?.[0];
  assert.ok(helperSource, 'popupUiText helper is present');
  const context = {
    window: {
      FilterTubeUiLocalization: {
        text(key) { return translations[key]; }
      }
    }
  };
  vm.runInNewContext(helperSource, context);

  assert.match(popupSource, /const modeKey = effectiveMode === 'whitelist' \? 'popup\.whitelist' : 'popup\.blocklist'/);
  assert.match(popupSource, /const modeLabel = popupUiText\(modeKey, effectiveMode === 'whitelist' \? 'Whitelist' : 'Blocklist'\)/);
  assert.match(popupSource, /const modeTooltipKey = effectiveMode === 'whitelist'[\s\S]*?'popup\.listMode\.whitelistTooltip'[\s\S]*?:\s*'popup\.listMode\.blocklistTooltip'/);
  assert.match(popupSource, /const modeTooltip = popupUiText\(modeTooltipKey, effectiveMode === 'whitelist'[\s\S]*?'Whitelist mode: show content matching Allowed rules'[\s\S]*?'Blocklist mode: hide content matching Blocked rules'/);
  assert.match(popupSource, /toggle\.textContent = modeLabel/);
  assert.match(popupSource, /toggle\.setAttribute\('data-ft-i18n', modeKey\)/);
  assert.match(popupSource, /toggle\.title = modeTooltip/);
  assert.match(popupSource, /toggle\.setAttribute\('data-ft-i18n-title', modeTooltipKey\)/);
  assert.match(popupSource, /toggle\.setAttribute\('aria-label', modeLabel\)/);
  assert.match(popupSource, /toggle\.setAttribute\('data-ft-i18n-aria-label', modeKey\)/);
  assert.equal(context.popupUiText('popup.whitelist', 'Whitelist'), translations['popup.whitelist']);
  assert.equal(context.popupUiText('popup.blocklist', 'Blocklist'), translations['popup.blocklist']);
  assert.equal(context.popupUiText('popup.listMode.whitelistTooltip', 'English fallback'), translations['popup.listMode.whitelistTooltip']);
  assert.equal(context.popupUiText('popup.listMode.blocklistTooltip', 'English fallback'), translations['popup.listMode.blocklistTooltip']);

  assert.doesNotMatch(popupSource, /toggle\.title = effectiveMode ===/);
  assert.match(popupSource, /mode: nextState \? 'whitelist' : 'blocklist',[\s\S]*?copyBlocklist/);
  assert.match(popupSource, /const word = \(newKeywordInput\?\.value \|\| ''\)\.trim\(\)/);
  assert.match(popupSource, /const input = \(channelInput\?\.value \|\| ''\)\.trim\(\)/);
});

test('all target catalogs provide translated list-mode tooltip keys with placeholder parity', () => {
  const english = readCatalog('en');
  const keys = ['popup.listMode.whitelistTooltip', 'popup.listMode.blocklistTooltip'];
  assert.equal(targets.locales.length, 38);
  for (const { code } of targets.locales) {
    const catalog = readCatalog(code);
    for (const key of keys) {
      assert.ok(typeof english[key] === 'string' && english[key].trim(), `English source: ${key}`);
      assert.ok(typeof catalog[key] === 'string' && catalog[key].trim(), `${code}: ${key}`);
      assert.deepEqual(
        [...String(catalog[key]).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]).sort(),
        [...String(english[key]).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]).sort(),
        `${code}: ${key} placeholders`
      );
      if (code !== 'en') assert.notEqual(catalog[key], english[key], `${code}: ${key} should not be English fallback`);
    }
  }
});

test('popup profile, PIN, list-mode, and channel feedback uses localization fallbacks', () => {
  const helperSource = popupSource.match(
    /^function popupUiText\(key, fallback, values = \{\}\) \{[\s\S]*?^\}/m
  )?.[0];
  const channelErrorSource = popupSource.match(
    /^function popupChannelErrorText\(error\) \{[\s\S]*?^\}/m
  )?.[0];
  assert.ok(helperSource, 'popupUiText helper is present');
  assert.ok(channelErrorSource, 'popup channel error localizer is present');

  const translated = {
    'popup.channel.invalidFormat': 'Format invalide: @handle, identifiant de chaîne, c/ChannelName ou URL YouTube',
    'popup.channel.addError': 'Échec de l’ajout de la chaîne: {error}',
    'popup.listMode.copiedRules': '{count} règles bloquées copiées dans les règles autorisées. Les règles bloquées sont conservées.'
  };
  const context = {
    window: {
      FilterTubeUiLocalization: {
        text(key, values = {}) {
          const template = translated[key];
          if (typeof template !== 'string') return '';
          return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
            (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
        }
      }
    }
  };
  vm.runInNewContext(`${helperSource}\n${channelErrorSource}`, context);
  assert.equal(context.popupChannelErrorText(
    'Invalid format. Use @handle, Channel ID, legacy c/ChannelName, or YouTube URL'
  ), translated['popup.channel.invalidFormat']);
  assert.equal(context.popupChannelErrorText('Service-specific failure'), 'Échec de l’ajout de la chaîne: Service-specific failure');
  assert.equal(context.popupChannelErrorText(''), 'Failed to add channel');
  assert.equal(context.popupUiText('popup.listMode.copiedRules',
    'Copied {count} blocked rules into Allowed rules. Blocked rules were kept.', { count: 3 }),
  '3 règles bloquées copiées dans les règles autorisées. Les règles bloquées sont conservées.');

  for (const key of [
    'popup.listMode.copyRulesConfirm', 'popup.listMode.copyKidsRulesConfirm',
    'popup.listMode.emptyAllowedRules', 'popup.listMode.emptyKidsAllowedRules',
    'popup.listMode.updateFailed', 'popup.listMode.copiedRule', 'popup.listMode.copiedRules',
    'popup.pin.incorrect', 'popup.pin.unlocked', 'popup.pin.unlockFailed',
    'popup.profile.switchLocked', 'popup.profile.unavailable', 'popup.profile.notFound',
    'popup.profile.switched', 'popup.profile.switchFailed', 'popup.profile.unlockRequired',
    'popup.profile.defaultName', 'popup.profile.genericName', 'popup.profile.groupMaster',
    'popup.profile.groupAccount', 'popup.profile.managedChildTitle',
    'popup.profile.managedChildHint', 'popup.profile.switchAction', 'popup.modal.cancel',
    'popup.rule.added', 'popup.channel.fetching', 'popup.channel.addFailed',
    'popup.channel.addError', 'popup.channel.profileLocked', 'popup.channel.invalidKidsFormat',
    'popup.channel.invalidFormat', 'popup.channel.alreadyExists',
    'popup.channel.kidsAddFailed', 'popup.channel.connectionFailed', 'popup.channel.unknownError'
  ]) {
    assert.ok(popupSource.includes(`'${key}'`), `popup.js uses ${key}`);
  }
  assert.match(popupSource, /`popup\.profile\.label\$\{type\}\$\{locked \? 'Locked' : ''\}`/);
  assert.match(popupSource, /`popup\.profile\.subtitle\$\{type\}\$\{locked \? 'Locked' : ''\}`/);
  assert.match(popupSource, /profileAccess\.masterEyebrow/);
  assert.match(popupSource, /profileAccess\.masterGateTitle/);
  assert.match(popupSource, /profileAccess\.masterGateMessage/);
  assert.match(popupSource, /profileAccess\.protectedAccountEyebrow/);
  assert.match(popupSource, /profileAccess\.protectedAccountGateTitle/);
  assert.match(popupSource, /profileAccess\.protectedProfileEyebrow/);
  assert.match(popupSource, /profileAccess\.protectedProfileGateTitle/);
  assert.match(popupSource, /profileAccess\.unlockButton/);
  assert.match(popupSource, /window\.addEventListener\('filtertube-ui-locale-changed',[\s\S]*?renderProfileSelector\(profilesV4Cache\)[\s\S]*?applyLockGateIfNeeded\(\)/);
});
