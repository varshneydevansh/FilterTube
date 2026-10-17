import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../../html/tab-view.html', import.meta.url), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, start);
  return source.slice(a, b);
}
function element(attributes = {}, classes = []) {
  const names = new Set(classes);
  return { attributes, dataset: {}, handlers: {},
    classList: {
      add: name => names.add(name), remove: name => names.delete(name),
      contains: name => names.has(name),
      toggle(name, force) {
        const enabled = force ?? !names.has(name);
        if (enabled) names.add(name); else names.delete(name);
      }
    },
    getAttribute: name => attributes[name] ?? null,
    setAttribute: (name, value) => { attributes[name] = value; },
    removeAttribute: name => { delete attributes[name]; },
    addEventListener(name, callback) { this.handlers[name] = callback; }
  };
}
function fixture({ hash = '#sync', search = '', type = 'child', locked = false, selfControl = false } = {}) {
  assert.match(html, /class="nav-item active" data-tab="dashboard"/);
  const tabs = ['dashboard', 'filters', 'kids', 'settings', 'sync', 'help', 'whatsnew', 'donate'];
  const nav = tabs.map(tab => element({ 'data-tab': tab }, tab === 'dashboard' ? ['active'] : []));
  const views = tabs.map(tab => Object.assign(element({}, tab === 'dashboard' ? ['active'] : []), { id: `${tab}View` }));
  const pageTitle = {};
  const document = { body: element(), documentElement: element(), dispatchEvent() {},
    querySelectorAll: selector => selector === '.nav-item' ? nav : selector === '.view-section' ? views : [],
    querySelector: selector => selector === '.nav-item.active' ? nav.find(item => item.classList.contains('active')) : null,
    getElementById: id => id === 'pageTitle' ? pageTitle : null
  };
  const window = { location: { pathname: '/html/tab-view.html', search, hash },
    FilterTubeResolveViewAccess: () => ({ viewId: 'help', reason: 'boot' }) };
  window.history = { replaceState(_, __, url) {
    const parsed = new URL(url, 'https://extension.invalid');
    Object.assign(window.location, { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash });
  } };
  const context = vm.createContext({ window, document, URLSearchParams,
    CustomEvent: class { constructor(name, init) { this.type = name; this.detail = init.detail; } },
    FILTERTUBE_SEMANTIC_ML_ENABLED: false,
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    getActiveProfileType: () => type,
    isSelfControlSessionActive: () => selfControl,
    isUiLocked: () => locked || selfControl,
    profilesV4Cache: { activeProfileId: 'profile', profiles: {} }, activeProfileId: 'profile',
    isProfileLocked: () => locked, isProfileUnlockSessionValid: { check: () => !locked },
    updateAutoBackupPolicyControls() {}, updateCheckboxes() {}
  });
  vm.runInContext([
    section('function resolveRequestedView() {', '/**\n * Switches to the requested view'),
    section('function handleNavigationIntent() {', 'function focusFamilyDeviceUpdatesCard() {'),
    section('    const LOCK_ALLOWED_VIEWS =', '    const MANAGED_TIME_LIMIT_SCHEMA ='),
    section('    function isViewAllowedForCurrentAccess(', '    function ensureNonChildAdminAction('),
    section('    function resolveViewAccess(', '    async function showPromptModal('),
    section('function setupNavigation() {', '// ============================================================================\n// UI UTILITY FUNCTIONS')
  ].join('\n'), context);
  // The boot snapshot must precede all startup access checks that rewrite hashes.
  const capture = '    const initialRequestedView = resolveRequestedView();';
  assert.ok(source.indexOf(capture) < source.indexOf('    applyLockGateIfNeeded();\n    // The initial access gate'));
  vm.runInContext(capture, context);
  context.setupNavigation();
  const startup = section('    applyLockGateIfNeeded();\n    // The initial access gate', '    if (selfControlCountdownTimer) clearInterval(selfControlCountdownTimer);');
  return { window, document, context, nav, pageTitle,
    run() { vm.runInContext(startup, context); context.handleNavigationIntent(); } };
}

test('the initial child Dashboard fallback cannot erase a captured #sync request', () => {
  const f = fixture();
  f.context.applyLockGateIfNeeded();
  assert.equal(f.window.location.hash, '#help', 'reproduces the startup Dashboard fallback');
  f.run();
  assert.equal(f.window.location.hash, '#sync');
  assert.equal(f.document.body.dataset.activeView, 'sync');
  assert.equal(f.pageTitle.textContent, 'Accounts & Sync');
});

for (const [label, options, expected] of [
  ['child sync', { hash: '#sync' }, 'sync'],
  ['child query alias', { hash: '', search: '?view=nanahsync' }, 'sync'],
  ['child Dashboard stays forbidden', { hash: '#dashboard' }, 'help'],
  ['child Kids editor stays forbidden', { hash: '#kids' }, 'help'],
  ['child Help', { hash: '#help' }, 'help'],
  ['adult sync', { type: 'account' }, 'sync'],
  ['adult Kids', { type: 'account', hash: '#kids' }, 'kids'],
  ['locked adult sync stays forbidden', { type: 'account', locked: true }, 'help'],
  ['locked adult Kids stays forbidden', { type: 'account', locked: true, hash: '#kids' }, 'help'],
  ['locked adult Help', { type: 'account', locked: true, hash: '#help' }, 'help'],
  ['locked child receive hub', { type: 'child', locked: true }, 'sync'],
  ['self-control sync stays forbidden', { type: 'account', selfControl: true }, 'settings'],
  ['self-control Settings', { type: 'account', selfControl: true, hash: '#settings' }, 'settings']
]) {
  test(`initial navigation preserves access policy: ${label}`, () => {
    const f = fixture(options);
    f.run();
    assert.equal(f.window.location.hash, `#${expected}`);
    assert.equal(f.document.body.dataset.activeView, expected);
    assert.equal(f.nav.find(item => item.classList.contains('active')).getAttribute('data-tab'), expected);
    assert.equal(f.document.body.classList.contains('ft-app-locked'), Boolean(options.locked || options.selfControl));
  });
}

test('later child navigation still rejects forbidden destinations after restoring sync', () => {
  const f = fixture();
  f.run();
  f.window.switchView('filters');
  assert.equal(f.window.location.hash, '#help');
  f.window.location.hash = '#sync';
  f.context.handleNavigationIntent();
  assert.equal(f.window.location.hash, '#sync');
});
