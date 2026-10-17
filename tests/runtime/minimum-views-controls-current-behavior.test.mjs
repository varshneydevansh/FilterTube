import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function actual(name) {
  const start = source.search(new RegExp(`^    function ${name}\\(`, 'm'));
  const end = source.indexOf('\n    }', start) + 6;
  assert.ok(start > 0 && end > start, name);
  return source.slice(start, end);
}
function fixture(surface, { managed = false, saved = true, minimum = '500', enabled = true } = {}) {
  const prefix = surface === 'kids' ? 'kidsVideoFilter' : 'videoFilter';
  const inputs = {};
  let invalidReports = 0;
  inputs[`${prefix}_views_enabled`] = { checked: enabled };
  inputs[`${prefix}_views_min`] = { value: minimum, reportValidity() { invalidReports++; } };
  const prior = { views: { enabled: true, minViews: 700 }, duration: { enabled: true, condition: 'longer', minMinutes: 5 }, uploadDate: {}, uppercase: {} };
  const state = { contentFilters: prior, kids: { contentFilters: prior } };
  const writes = [], notices = [];
  const context = {
    document: { getElementById: id => inputs[id] || null, querySelector: () => null, querySelectorAll: () => [] },
    window: {
      __filtertubeIsManagedChildEditFor: () => managed,
      __filtertubeBuildManagedChildState: () => state,
      async __filtertubeSaveManagedChildSurface(target, mutate) {
        if (!saved) return false;
        const profile = { settings: {} }, kids = {};
        await mutate(kids, profile);
        writes.push(clone(target === 'kids' ? kids.contentFilters : profile.settings.contentFilters));
        return true;
      }
    },
    StateManager: { getState: () => state, async updateContentFilters(next) { writes.push(clone(next)); }, async updateKidsContentFilters(next) { writes.push(clone(next)); } },
    UIComponents: { showToast: (...args) => notices.push(args) }, tabViewUiText: (_, fallback) => fallback,
    isApplyingContentFiltersUI: false, isApplyingKidsUi: false,
    lastSavedVideoFiltersSignature: '', lastSavedKidsVideoFiltersSignature: '', lastVideoFiltersToastTs: 0, lastKidsVideoFiltersToastTs: 0,
    console: { error() {} }
  };
  vm.runInNewContext(['computeVideoFiltersSignature', 'computeSignature', 'saveVideoFilters', 'saveKidsVideoFilters'].map(actual).join('\n'), context);
  return { inputs, writes, notices, prior, get invalidReports() { return invalidReports; },
    save: () => context[surface === 'kids' ? 'saveKidsVideoFilters' : 'saveVideoFilters']({ showToast: true }) };
}
for (const surface of ['main', 'kids']) {
  test(`${surface}: saving a minimum retains other filter values and uses its own profile save path`, async () => {
    const f = fixture(surface);
    await f.save();
    assert.equal(f.writes.length, 1);
    assert.deepEqual(f.writes[0].views, { enabled: true, minViews: 500 });
    assert.equal(f.writes[0].duration.minMinutes, 5);
  });
  for (const minimum of ['', '0', '-1', '3.5', 'NaN', '9007199254740992']) {
    test(`${surface}: invalid active minimum ${JSON.stringify(minimum)} cannot replace saved rules`, async () => {
      const f = fixture(surface, { minimum });
      assert.equal(await f.save(), false);
      assert.equal(f.writes.length, 0);
      assert.equal(f.invalidReports, 1);
    });
  }
  test(`${surface}: switch off works while the number field is empty and retains the last minimum`, async () => {
    const f = fixture(surface, { enabled: false, minimum: '' });
    await f.save();
    assert.deepEqual(f.writes[0].views, { enabled: false, minViews: 700 });
  });
  test(`${surface}: an unrelated filter edit retains a saved view filter when its controls are absent`, async () => {
    const f = fixture(surface);
    const prefix = surface === 'kids' ? 'kidsVideoFilter' : 'videoFilter';
    delete f.inputs[`${prefix}_views_enabled`]; delete f.inputs[`${prefix}_views_min`];
    await f.save();
    assert.deepEqual(f.writes[0].views, f.prior.views);
  });
  test(`${surface}: managed denial neither falls back to personal saving nor announces success`, async () => {
    const f = fixture(surface, { managed: true, saved: false });
    assert.equal(await f.save(), false);
    assert.equal(f.writes.length, 0); assert.equal(f.notices.length, 0);
  });
  test(`${surface}: managed approval includes the selected minimum`, async () => {
    const f = fixture(surface, { managed: true });
    assert.equal(await f.save(), true);
    assert.deepEqual(f.writes[0].views, { enabled: true, minViews: 500 });
  });
}
