import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const batch = JSON.parse(fs.readFileSync('data/ui_locales/batches/self-control-hard-whitelist.json', 'utf8'));
const english = batch.english;
const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort().join(',');

function extractBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `source markers exist: ${startMarker}`);
  return source.slice(start, end);
}

function loadRemainingTimeFormatter(translations = {}) {
  const formatter = extractBetween(
    'function formatSelfControlRemaining(seconds) {',
    '\n    function renderSelfControlSession()'
  );
  const context = {
    tabViewUiText(key, fallback, values = {}) {
      const template = translations[key] || fallback;
      return String(template).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }
  };
  vm.createContext(context);
  vm.runInContext(`${formatter}\nglobalThis.format = formatSelfControlRemaining;`, context);
  return context.format;
}

test('self-control and hard-whitelist batch covers the generated runtime copy and placeholders', () => {
  const entries = Object.entries(english);
  assert.equal(entries.length, 45, 'the bounded feature batch contains the reviewed source inventory');
  for (const [key, fallback] of entries) {
    assert.ok(source.includes(`'${key}'`), `missing runtime key ${key}`);
    assert.ok(source.includes(fallback), `missing English fallback ${key}`);
    assert.equal(typeof fallback, 'string');
    assert.ok(fallback.trim(), `English fallback is nonempty: ${key}`);
  }

  const expectedPlaceholders = {
    'dashboard.selfControl.duration.hoursMinutesSeconds': 'hours,minutes,seconds',
    'dashboard.selfControl.duration.minutesSeconds': 'minutes,seconds',
    'dashboard.selfControl.duration.seconds': 'seconds',
    'dashboard.selfControl.hardWhitelistActive.one': 'count',
    'dashboard.selfControl.hardWhitelistActive.other': 'count',
    'dashboard.selfControl.endsAt': 'dateTime,profileName,sessionLabel',
    'dashboard.selfControl.start.message.one': 'duration,profileName',
    'dashboard.selfControl.start.message.other': 'duration,profileName',
    'dashboard.selfControl.hardWhitelist.start.message.oneMinute.oneChannel': 'count,duration,profileName',
    'dashboard.selfControl.hardWhitelist.start.message.oneMinute.multipleChannels': 'count,duration,profileName',
    'dashboard.selfControl.hardWhitelist.start.message.multipleMinutes.oneChannel': 'count,duration,profileName',
    'dashboard.selfControl.hardWhitelist.start.message.multipleMinutes.multipleChannels': 'count,duration,profileName',
    'dashboard.selfControl.lockGate.unlocksAt': 'dateTime'
  };
  for (const [key, fallback] of entries) {
    assert.equal(placeholders(fallback), expectedPlaceholders[key] || '', `placeholder inventory is stable for ${key}`);
  }
});

test('self-control countdown keeps its current values and accepts localized unit labels', () => {
  const englishFormatter = loadRemainingTimeFormatter();
  assert.equal(englishFormatter(0), '0s');
  assert.equal(englishFormatter(61), '1m 1s');
  assert.equal(englishFormatter(3661), '1h 1m 1s');

  const localizedFormatter = loadRemainingTimeFormatter({
    'dashboard.selfControl.duration.hoursMinutesSeconds': '{hours} 小时 {minutes} 分 {seconds} 秒',
    'dashboard.selfControl.duration.minutesSeconds': '{minutes} 分 {seconds} 秒',
    'dashboard.selfControl.duration.seconds': '{seconds} 秒'
  });
  assert.equal(localizedFormatter(61), '1 分 1 秒');
  assert.equal(localizedFormatter(3661), '1 小时 1 分 1 秒');
});

test('localization leaves self-control admission bounds and session message flow intact', () => {
  assert.match(source, /Number\.isInteger\(duration\) \|\| duration < 1 \|\| duration > 10080/);
  assert.match(source, /action: 'FilterTube_StartSelfControlSession', minutes: duration/);
  assert.match(source, /action: 'FilterTube_StartHardWhitelistSession',[\s\S]{0,80}minutes: duration/);
  assert.match(source, /if \(selected !== 'start'\) return;/g);
  assert.match(source, /selfControlSessionState\?\.active === true && Number\(selfControlSessionState\.lockedUntil\) > Date\.now\(\)/);
});
