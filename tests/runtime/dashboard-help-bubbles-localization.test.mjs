import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync('js/tab-view.js', 'utf8');
const html = fs.readFileSync('html/tab-view.html', 'utf8');
const batch = JSON.parse(fs.readFileSync('data/ui_locales/batches/dashboard-help-bubbles-source.json', 'utf8'));

test('every explicit HTML help tooltip has a catalog-backed display lookup', () => {
  const helperStart = source.indexOf('function tabViewUiText(');
  const helperEnd = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', helperStart);
  const start = source.indexOf('const DASHBOARD_HELP_BUBBLE_COPY =');
  const end = source.indexOf('function initializeDashboardHelpBubbles', start);
  const used = new Set();
  const context = vm.createContext({ window: { FilterTubeUiLocalization: { text(key) { used.add(key); return `Localized: ${key}`; } } } });
  vm.runInContext(`${source.slice(helperStart, helperEnd)}\n${source.slice(start, end)}\nthis.render = value => tabViewDisplayCopy(value, DASHBOARD_HELP_BUBBLE_COPY);`, context);
  const tips = [...html.matchAll(/data-filtertube-help="([^"]+)"/g)].map(([, value]) => value);
  assert.equal(tips.length, 55);
  assert.equal(Object.keys(batch.english).length, 54);
  for (const tip of tips) assert.ok(context.render(tip).startsWith('Localized:'), tip);
  for (const key of Object.keys(batch.english)) assert.ok(used.has(key), key);
  assert.ok(used.has('dashboard.sync.familyDeviceMap.map.familyCenterHelp'), 'existing exact source is reused');
  assert.equal(context.render('My private tooltip <🙂>'), 'My private tooltip <🙂>');
  assert.ok(source.includes('tabViewDisplayCopy(explicit.trim(), DASHBOARD_HELP_BUBBLE_COPY)'));
  assert.ok(source.includes("window.addEventListener('filtertube-ui-locale-changed', hideBubble)"), 'an open old-language bubble is dismissed on language change');
});

test('release banner receives localized action and accessibility text from the same local catalog', () => {
  const prompt = fs.readFileSync('js/content/release_notes_prompt.js', 'utf8');
  assert.ok(prompt.includes("dismissBtn.textContent = payload.dismissLabel || 'Got it'"));
  assert.ok(prompt.includes("closeBtn.setAttribute('aria-label', payload.dismissAriaLabel || 'Dismiss')"));
  assert.ok(prompt.includes("container.dir = payload.direction === 'rtl' ? 'rtl' : 'ltr'"));
});

test('actual hover handler displays selected-language help and removes stale bubbles on language change', () => {
  const listeners = {};
  let bubble;
  let language = 'one';
  const tip = Object.values(batch.english)[0];
  class Element {
    getAttribute(name) { return name === 'data-filtertube-help' ? tip : ''; }
    closest(selector) { return selector === '[data-filtertube-help], [title]' ? this : null; }
    getBoundingClientRect() { return { left: 100, width: 200, top: 100, bottom: 140 }; }
    contains(value) { return value === this; }
  }
  const target = new Element();
  const body = {
    contains(value) { return value === target; },
    appendChild(value) { bubble = value; value.parentNode = body; },
    removeChild(value) { assert.equal(value, bubble); bubble = null; }
  };
  const document = {
    documentElement: { dataset: {}, clientWidth: 1000, clientHeight: 800 }, body,
    addEventListener(name, callback) { listeners[name] = callback; },
    createElement() { return { style: {}, classList: { toggle() {} }, setAttribute() {}, getBoundingClientRect: () => ({ width: 200, height: 50 }) }; }
  };
  const context = vm.createContext({ Element, Node: Element, document, clearTimeout, setTimeout,
    window: { innerWidth: 1000, innerHeight: 800,
      addEventListener(name, callback) { listeners[name] = callback; },
      FilterTubeUiLocalization: { text: key => `${language}: ${key}` }
    }
  });
  const helperStart = source.indexOf('function tabViewUiText(');
  const helperEnd = source.indexOf('\nfunction tabViewTaxonomyDisplayLabel', helperStart);
  const start = source.indexOf('const DASHBOARD_HELP_BUBBLE_COPY =');
  const end = source.indexOf('async function initializeAndroidClosedTestingInvite', start);
  vm.runInContext(`${source.slice(helperStart, helperEnd)}\n${source.slice(start, end)}\ninitializeDashboardHelpBubbles();`, context);
  listeners.mouseover({ target });
  assert.equal(bubble.textContent, 'one: dashboard.helpBubble.tip01');
  language = 'two';
  listeners['filtertube-ui-locale-changed']();
  assert.equal(bubble, null);
  listeners.mouseover({ target });
  assert.equal(bubble.textContent, 'two: dashboard.helpBubble.tip01');
  assert.equal(target.getAttribute('data-filtertube-help'), tip, 'source tooltip is not rewritten');
});
