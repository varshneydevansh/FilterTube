import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const backgroundSource = read('js/background.js');
const dashboardSource = read('js/tab-view.js');
const dashboardHtml = read('html/tab-view.html');

function sectionBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

function extractFunction(source, signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `missing function: ${signature}`);

  const openBrace = source.indexOf('{', start + signature.length);
  assert.notEqual(openBrace, -1, `missing opening brace: ${signature}`);

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  assert.fail(`missing closing brace: ${signature}`);
}

function makeCheckbox() {
  return {
    checked: false,
    listeners: new Map(),
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadDashboardSettingRuntime({ stored = {}, getError = null, setError = null } = {}) {
  const writes = [];
  const toasts = [];
  const context = {
    runtimeAPI: {
      storage: {
        local: {
          async get() {
            if (getError) throw getError;
            return stored;
          },
          async set(value) {
            writes.push(value);
            if (setError) throw setError;
          }
        }
      }
    },
    UIComponents: {
      showToast(message, type) {
        toasts.push({ message, type });
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(`
    const SHOW_UPDATE_REFRESH_PROMPT_KEY = 'showUpdateRefreshPrompt';
    ${extractFunction(dashboardSource, 'async function initializeUpdateRefreshPromptSetting(setting)')}
    this.initializeSetting = initializeUpdateRefreshPromptSetting;
  `, context);
  return { context, writes, toasts };
}

function loadBackgroundDecisionRuntime() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`
    const SHOW_UPDATE_REFRESH_PROMPT_KEY = 'showUpdateRefreshPrompt';
    ${extractFunction(backgroundSource, 'function shouldShowUpdateRefreshPrompt(settings = {})')}
    this.shouldShow = shouldShowUpdateRefreshPrompt;
  `, context);
  return context.shouldShow;
}

test('dashboard exposes the update refresh reminder setting', () => {
  assert.match(
    dashboardHtml,
    /<input id="setting_showUpdateRefreshPrompt" type="checkbox"\s*\/>/
  );
});

test('dashboard setting loads default-on and persists both choices', async () => {
  for (const [stored, initialValue] of [
    [{}, true],
    [{ showUpdateRefreshPrompt: true }, true],
    [{ showUpdateRefreshPrompt: false }, false]
  ]) {
    const checkbox = makeCheckbox();
    const runtime = loadDashboardSettingRuntime({ stored });
    await runtime.context.initializeSetting(checkbox);

    assert.equal(checkbox.checked, initialValue);
    assert.equal(typeof checkbox.listeners.get('change'), 'function');

    checkbox.checked = !initialValue;
    await checkbox.listeners.get('change')();
    assert.deepEqual(plain(runtime.writes), [{ showUpdateRefreshPrompt: !initialValue }]);
    assert.deepEqual(runtime.toasts, [{
      message: !initialValue
        ? 'Update refresh reminders enabled'
        : 'Update refresh reminders disabled',
      type: !initialValue ? 'success' : 'info'
    }]);
  }
});

test('dashboard setting defaults on after a read error and rolls back a failed write', async () => {
  const checkbox = makeCheckbox();
  const runtime = loadDashboardSettingRuntime({
    getError: new Error('read failed'),
    setError: new Error('write failed')
  });
  await runtime.context.initializeSetting(checkbox);

  assert.equal(checkbox.checked, true);
  checkbox.checked = false;
  await checkbox.listeners.get('change')();

  assert.equal(checkbox.checked, true);
  assert.deepEqual(plain(runtime.writes), [{ showUpdateRefreshPrompt: false }]);
  assert.deepEqual(runtime.toasts, [{
    message: 'Could not update refresh reminders',
    type: 'error'
  }]);
});

test('background decision requires both the preference and pending refresh flag', () => {
  const shouldShow = loadBackgroundDecisionRuntime();

  assert.equal(shouldShow({}), true);
  assert.equal(shouldShow({ showUpdateRefreshPrompt: true, firstRunRefreshNeeded: true }), true);
  assert.equal(shouldShow({ showUpdateRefreshPrompt: false, firstRunRefreshNeeded: true }), false);
  assert.equal(shouldShow({ showUpdateRefreshPrompt: true, firstRunRefreshNeeded: false }), false);
  assert.equal(shouldShow({ showUpdateRefreshPrompt: false, firstRunRefreshNeeded: false }), false);
});

test('background message path reads both inputs and delegates to the tested decision', () => {
  const installBlock = sectionBetween(
    backgroundSource,
    "if (details.reason === 'install') {",
    "} else if (details.reason === 'update') {"
  );
  assert.match(installBlock, /\[SHOW_UPDATE_REFRESH_PROMPT_KEY\]: true/);

  const checkBlock = sectionBetween(
    backgroundSource,
    "} else if (action === 'FilterTube_FirstRunCheck') {",
    "} else if (action === 'FilterTube_FirstRunComplete') {"
  );
  assert.match(checkBlock, /storageGet\(\['firstRunRefreshNeeded', SHOW_UPDATE_REFRESH_PROMPT_KEY\]\)/);
  assert.match(checkBlock, /needed: shouldShowUpdateRefreshPrompt\(data\)/);
  assert.match(checkBlock, /return true;/);

  assert.match(
    dashboardSource,
    /const settingShowUpdateRefreshPrompt = document\.getElementById\('setting_showUpdateRefreshPrompt'\);/
  );
  assert.match(
    dashboardSource,
    /await initializeUpdateRefreshPromptSetting\(settingShowUpdateRefreshPrompt\);/
  );

  const updateBlock = sectionBetween(
    backgroundSource,
    "} else if (details.reason === 'update') {",
    "browserAPI.runtime.onMessage.addListener"
  );
  assert.doesNotMatch(updateBlock, /SHOW_UPDATE_REFRESH_PROMPT_KEY/);
});
