import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const batch = JSON.parse(read('data/ui_locales/batches/managed-overlays-source.json'));
const source = read('js/content/bridge_settings.js');
const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort().join(',');
const expectedPlaceholders = {
  'managedOverlay.blocked.title': 'surface',
  'managedOverlay.blocked.message': 'profileName',
  'managedOverlay.duration.hoursMinutes': 'hours,minutes',
  'managedOverlay.duration.hours': 'hours',
  'managedOverlay.duration.minutes': 'minutes',
  'managedOverlay.duration.minutesSeconds': 'minutes,seconds',
  'managedOverlay.duration.seconds': 'seconds',
  'managedOverlay.timeRemaining.status': 'surface,timeLeft',
  'managedOverlay.timeRemaining.title': 'profileName,timeLeft',
  'managedOverlay.reset.midnight': 'timezone',
  'managedOverlay.timeout.title.parentReview': 'surface',
  'managedOverlay.timeout.copy.parentReview': 'profileName,surface',
  'managedOverlay.timeout.copy.dailyPause': 'profileName,surface',
  'managedOverlay.timeout.profilePill': 'profileName,surface',
  'managedOverlay.switch.pinPrompt': 'profileName',
  'managedOverlay.switch.switchingTo': 'profileName'
};

function loadManagedOverlayText(translations = {}, shouldThrow = false) {
  const start = source.indexOf('function managedOverlayText(key, fallback, values = {}) {');
  const marker = '\n}\n';
  const end = source.indexOf(marker, start);
  assert.ok(start >= 0 && end > start, 'managed overlay text helper is present');
  const context = {
    window: {
      __filterTubeContentUiCopy: {
        text(key, fallback, values = {}) {
          if (shouldThrow) throw new Error('lookup unavailable');
          const value = translations[key] || fallback;
          return String(value).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
        }
      }
    },
    Object,
    String
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end + marker.length)}\nglobalThis.lookup = managedOverlayText;`, context);
  return context.lookup;
}

test('managed overlay English batch covers every localized UI fallback', () => {
  const entries = Object.entries(batch.english);
  assert.equal(entries.length, 51, 'managed overlay batch has a stable bounded key count');
  for (const [key, fallback] of entries) {
    assert.ok(source.includes(`'${key}'`), `missing runtime lookup for ${key}`);
    assert.ok(source.includes(`"${fallback}"`) || source.includes(`'${fallback}'`) || source.includes(`\`${fallback}\``),
      `missing English runtime fallback for ${key}`);
    assert.equal(placeholders(fallback), expectedPlaceholders[key] || '', `placeholder spelling is stable for ${key}`);
  }

  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = read(file);
    const helperIndex = manifest.indexOf('js/content/block_channel.js');
    const bridgeIndex = manifest.indexOf('js/content/bridge_settings.js');
    assert.ok(helperIndex >= 0 && bridgeIndex > helperIndex, `${file} loads content localization before managed overlays`);
  }
});

test('managed overlay lookup interpolates localized placeholders and falls back safely', () => {
  const localized = loadManagedOverlayText({
    'managedOverlay.blocked.title': '{surface} is blocked for this profile'
  });
  const english = loadManagedOverlayText();
  const unavailable = loadManagedOverlayText({}, true);

  assert.equal(localized('managedOverlay.blocked.title', batch.english['managedOverlay.blocked.title'], { surface: 'YouTube' }),
    'YouTube is blocked for this profile');
  assert.equal(english('managedOverlay.timeRemaining.status', batch.english['managedOverlay.timeRemaining.status'], {
    surface: 'YouTube', timeLeft: '12m 4s'
  }), 'YouTube time left: 12m 4s');
  assert.equal(unavailable('managedOverlay.switch.pinPrompt', batch.english['managedOverlay.switch.pinPrompt'], {
    profileName: 'Family'
  }), 'Enter the PIN for Family');
});

test('localizing managed overlays leaves timeout, admission, and request enforcement boundaries intact', () => {
  assert.match(source, /if \(!state \|\| state\.enforced !== true \|\| state\.timedOut === true\)\s*\{\s*removeManagedTimeLimitStatus\(\);\s*return;/);
  assert.match(source, /if \(!Number\.isFinite\(remainingSeconds\) \|\| remainingSeconds <= 0 \|\| !Number\.isFinite\(totalBudgetSeconds\) \|\| totalBudgetSeconds <= 0\)\s*\{\s*removeManagedTimeLimitStatus\(\);\s*return;/);
  assert.match(source, /globalThis\.__filtertubeManagedTimeLimitTimedOut = true;\s*ensureManagedTimeoutPlayGuard\(\);\s*removeManagedTimeLimitStatus\(\);\s*pauseManagedTimeoutVideos\(\);/);
  assert.match(source, /if \(!policyExpired\) actionArea\.appendChild\(askButton\);/);
  assert.match(source, /requestKey && requestKey !== managedTimeLimitParentRequestKey/);
  assert.match(source, /pauseManagedTimeoutVideos\(\);\s*\}\);\s*\} catch \(e\) \{/);
  assert.ok(source.split("'managedOverlay.request.unavailable'").length - 1 >= 2,
    'both request failure paths keep the paused-state explanation localized');
});
