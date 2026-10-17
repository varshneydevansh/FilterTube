import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function actualFunction(name) {
  const start = source.indexOf(`    function ${name}(`);
  const end = source.indexOf('\n    }', start) + '\n    }'.length;
  assert.ok(start > 0 && end > start);
  return source.slice(start, end);
}
const cases = [
  { name: 'saveCategoryFilters', surface: 'main', category: true, cache: 'lastSavedCategoryFiltersSignatureMain', personal: 'updateCategoryFilters' },
  { name: 'saveVideoFilters', surface: 'main', category: false, cache: 'lastSavedVideoFiltersSignature', personal: 'updateContentFilters' },
  { name: 'saveKidsCategoryFilters', surface: 'kids', category: true, personal: 'updateKidsCategoryFilters' },
  { name: 'saveKidsVideoFilters', surface: 'kids', category: false, cache: 'lastSavedKidsVideoFiltersSignature', personal: 'updateKidsContentFilters' }
];
function fixture(config, { managed = true } = {}) {
  const toasts = []; const calls = []; const writes = [];
  const prior = { categoryFilters: {}, contentFilters: {}, kids: { contentFilters: {} } };
  const inputs = { categoryFilter_enabled: { checked: true }, categoryFilter_mode: { value: 'allow' } };
  for (const prefix of ['videoFilter', 'kidsVideoFilter']) {
    inputs[`${prefix}_duration_enabled`] = { checked: true };
    inputs[`${prefix}_duration_longer_value`] = { value: '4.5' };
    inputs[`${prefix}_uppercase_enabled`] = { checked: true };
    inputs[`${prefix}_uppercase_mode`] = { value: 'all_caps' };
  }
  let result = () => true;
  const context = {
    window: {},
    document: { getElementById: id => inputs[id] || null, querySelector: selector => ({ value: selector.includes('_duration_condition') ? 'longer' : 'newer' }) },
    StateManager: { getState: () => prior },
    UIComponents: { showToast: (message, type) => { toasts.push({ message, type }); } },
    tabViewUiText: (_, fallback) => fallback, console: { error() {} },
    isApplyingCategoryFiltersUI: false, isApplyingContentFiltersUI: false, isApplyingKidsUi: false,
    categorySelectedMain: ['Music', 'music', ' Education '], kidsCategorySelected: ['Music', 'music', ' Education '],
    kidsCategoryEnabled: { checked: true }, kidsCategoryMode: { value: 'allow' },
    lastSavedCategoryFiltersSignatureMain: '', lastSavedVideoFiltersSignature: '', lastSavedKidsVideoFiltersSignature: '',
    lastCategoryFiltersToastTs: 0, lastVideoFiltersToastTs: 0, lastKidsVideoFiltersToastTs: 0
  };
  context.window.__filtertubeIsManagedChildEditFor = () => managed;
  context.window.__filtertubeBuildManagedChildState = () => prior;
  context.window.__filtertubeSaveManagedChildSurface = async (surface, mutate) => {
    calls.push(['managed', surface]);
    const target = {}; const profile = { settings: { kept: true } };
    await mutate(target, profile);
    const saved = await result();
    if (saved === true) writes.push({ surface, target: clone(target), profile: clone(profile) });
    return saved;
  };
  for (const config of cases) context.StateManager[config.personal] = async next => {
    calls.push(['personal', config.personal]);
    await result(); writes.push({ personal: config.personal, next: clone(next) });
    // The production personal StateManager methods fulfill without a boolean.
  };
  vm.runInNewContext(['normalizeSelectedArray', 'computeCategoryFiltersSignature', 'computeVideoFiltersSignature', 'computeSignature', ...cases.map(item => item.name)]
    .map(actualFunction).join('\n'), context);
  return { context, toasts, calls, writes, setResult: next => { result = next; },
    save: (options = { showToast: true }) => config.name === 'saveCategoryFilters'
      ? context[config.name]('main', options) : context[config.name](options) };
}
function deferred() {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

for (const config of cases) {
  test(`${config.name} waits for actual managed persistence before success and preserves its filter payload`, async () => {
    const f = fixture(config); const pending = deferred(); f.setResult(() => pending.promise);
    const completion = f.save();
    await Promise.resolve(); await Promise.resolve();
    assert.equal(f.toasts.length, 0); assert.equal(f.writes.length, 0);
    if (config.cache) assert.equal(f.context[config.cache], '', 'pending saves are not cached as successful');
    pending.resolve(true);
    assert.equal(await completion, true);
    assert.deepEqual(f.toasts.map(toast => toast.type), ['success']);
    assert.deepEqual(f.calls, [['managed', config.surface]]);
    const write = f.writes[0];
    const payload = config.surface === 'main' ? write.profile.settings[config.category ? 'categoryFilters' : 'contentFilters']
      : write.target[config.category ? 'categoryFilters' : 'contentFilters'];
    if (config.category) assert.deepEqual(payload, { enabled: true, mode: 'allow', selected: ['Music', 'Education'] });
    else {
      assert.equal(payload.duration.enabled, true); assert.equal(payload.duration.condition, 'longer');
      assert.equal(payload.duration.minMinutes, 4.5); assert.equal(payload.duration.value, '4.5');
      assert.deepEqual(payload.uppercase, { enabled: true, mode: 'all_caps', minWordLength: 2 });
    }
    if (config.surface === 'main') assert.equal(write.profile.settings.kept, true);
  });

  test(`${config.name} treats cancelled/false managed save as unsaved and allows an identical retry`, async () => {
    const f = fixture(config); f.setResult(() => false);
    assert.equal(await f.save(), false);
    assert.equal(f.toasts.length, 0); assert.equal(f.writes.length, 0);
    if (config.cache) assert.equal(f.context[config.cache], '');
    f.setResult(() => true); assert.equal(await f.save(), true);
    assert.equal(f.calls.length, 2); assert.equal(f.writes.length, 1);
    assert.deepEqual(f.toasts.map(toast => toast.type), ['success']);
  });

  test(`${config.name} catches managed rejection without false success or suppressing retry`, async () => {
    const f = fixture(config); const pending = deferred(); f.setResult(() => pending.promise);
    const completion = f.save();
    await Promise.resolve(); await Promise.resolve(); pending.reject(new Error('storage failed'));
    assert.equal(await completion, false);
    assert.deepEqual(f.toasts.map(toast => toast.type), ['error']);
    assert.equal(f.writes.length, 0);
    if (config.cache) assert.equal(f.context[config.cache], '');
    f.setResult(() => true); await f.save(); assert.equal(f.writes.length, 1);
    assert.deepEqual(f.toasts.map(toast => toast.type), ['error', 'success']);
  });

  test(`${config.name} retains ordinary personal saves that fulfill without a boolean`, async () => {
    const f = fixture(config, { managed: false });
    assert.equal(await f.save(), true);
    assert.deepEqual(f.calls, [['personal', config.personal]]);
    assert.equal(f.writes.length, 1);
    assert.deepEqual(f.toasts.map(toast => toast.type), ['success']);
  });
}

test('the small Kids category producer handles a missing managed helper and synchronous failures without unhandled promises', async () => {
  const config = cases.find(item => item.name === 'saveKidsCategoryFilters');
  for (const helper of [undefined, () => { throw new Error('sync producer failure'); }]) {
    const f = fixture(config); f.context.window.__filtertubeSaveManagedChildSurface = helper;
    assert.equal(await f.save(), false);
    assert.ok(f.toasts.every(toast => toast.type !== 'success'));
  }
});
