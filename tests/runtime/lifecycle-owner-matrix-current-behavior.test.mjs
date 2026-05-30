import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const matrixDoc = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_LIFECYCLE_OWNER_MATRIX_2026-05-18.md'),
  'utf8'
);

const PATTERNS = {
  addEventListener: /\.addEventListener\s*\(/g,
  removeEventListener: /\.removeEventListener\s*\(/g,
  mutationObserver: /new\s+MutationObserver\s*\(/g,
  setInterval: /\bsetInterval\s*\(/g,
  clearInterval: /\bclearInterval\s*\(/g,
  setTimeout: /\bsetTimeout\s*\(/g,
  clearTimeout: /\bclearTimeout\s*\(/g,
  fetch: /\bfetch\s*\(/g,
  postMessage: /\.postMessage\s*\(/g,
  sendMessage: /\.sendMessage\s*\(/g,
  dispatchEvent: /\.dispatchEvent\s*\(/g,
  clickCall: /\.click\s*\(/g,
  styleDisplay: /\.style\.display\s*=/g,
  classListMutation: /\.classList\.(?:add|remove|toggle)\s*\(/g
};

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function stats(file) {
  const text = source(file);
  return Object.fromEntries(
    Object.entries(PATTERNS).map(([name, pattern]) => [name, count(text, pattern)])
  );
}

function assertDocPhrase(phrase) {
  assert.match(matrixDoc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

test('lifecycle owner matrix defines the future owner contract and all owner families', () => {
  for (const phrase of [
    'owner id',
    'active-state gate',
    'pause rule for fullscreen/native overlays/hidden tabs when relevant',
    'teardown or documented page-lifetime reason',
    'side-effect reason for display/class/click/dispatch/network/message work',
    'Seed network owner',
    'Content bridge prefetch/hydration owner',
    'Fallback menu owner',
    'Quick block owner',
    'Normal/Kids menu owner',
    'DOM fallback owner',
    'Collaborator dialog owner',
    'Injector/page-world owner',
    'Background authority owner',
    'Dashboard UI owner',
    'Popup UI owner',
    'State/import owner',
    'Quarantined legacy owner',
    'Vendor transport owner',
    'Generated shell owner',
    'Website client owner'
  ]) {
    assertDocPhrase(phrase);
  }
});

test('tracked source still has no shared lifecycle or side-effect owner registry', () => {
  const files = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .toString('utf8')
    .trim()
    .split('\n')
    .filter((file) => file && !file.startsWith('docs/audit/') && !file.startsWith('tests/'));
  const combined = files.map(source).join('\n');
  assert.doesNotMatch(
    combined,
    /lifecycleRegistry|registerLifecycle|observerRegistry|timerRegistry|sideEffectRegistry|disposeAll|teardownAll/
  );
});

test('page-runtime owner matrix is backed by current high-risk owner source tokens', () => {
  const seed = source('js/seed.js');
  const bridge = source('js/content_bridge.js');
  const quick = source('js/content/block_channel.js');
  const fallback = source('js/content/dom_fallback.js');
  const collab = source('js/content/collab_dialog.js');
  const injector = source('js/injector.js');

  assert.match(seed, /proto\.open = function/);
  assert.match(seed, /proto\.send = function/);
  assert.match(seed, /urlStr\.includes\(endpoint\)/);

  assert.match(bridge, /prefetchObserver = new IntersectionObserver/);
  assert.match(bridge, /const warmupTimer = setInterval/);
  assert.match(bridge, /pendingImmediateFallbackTimer = setTimeout/);

  assert.doesNotMatch(quick, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(quick, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(quick, /window\.addEventListener\('resize'/);
  assert.match(quick, /window\.addEventListener\('orientationchange'/);

  assert.match(fallback, /window\.__filtertubePlaylistNavGuardInstalled = true/);
  assert.match(fallback, /nextBtn\.click\(\)/);

  assert.match(collab, /document\.addEventListener\('click', handlePotentialCollabTrigger, true\)/);
  assert.match(collab, /collabDialogObserver = new MutationObserver/);

  assert.match(injector, /handleSubscriptionsImportBridgeMessage/);
  assert.match(injector, /button\.click\(\)/);
  assert.match(injector, /window\.dispatchEvent\(new Event\('scroll'\)\)/);
});

test('UI background and state owners are backed by current primitive counts and tokens', () => {
  assert.equal(stats('js/tab-view.js').addEventListener, 147);
  assert.equal(stats('js/tab-view.js').setInterval, 1);
  assert.equal(stats('js/tab-view.js').styleDisplay, 22);
  assert.equal(stats('js/tab-view.js').classListMutation, 28);
  assert.match(source('js/tab-view.js'), /dashboardStatsRotationTimer = setInterval/);
  assert.match(source('js/tab-view.js'), /ftNanahHostBtn\.addEventListener/);

  assert.equal(stats('js/popup.js').addEventListener, 30);
  assert.equal(stats('js/state_manager.js').sendMessage, 8);
  assert.equal(stats('js/background.js').fetch, 7);
  assert.match(source('js/background.js'), /channelMapFlushTimer = setTimeout/);
  assert.match(source('js/background.js'), /videoChannelMapFlushTimer = setTimeout/);
  assert.match(source('js/io_manager.js'), /backupScheduleTimer = setTimeout/);
});

test('visual side-effect owners are split across page runtime UI and quarantined legacy code', () => {
  assert.deepEqual(
    {
      contentBridge: {
        styleDisplay: stats('js/content_bridge.js').styleDisplay,
        classListMutation: stats('js/content_bridge.js').classListMutation
      },
      tabView: {
        styleDisplay: stats('js/tab-view.js').styleDisplay,
        classListMutation: stats('js/tab-view.js').classListMutation
      },
      popup: {
        styleDisplay: stats('js/popup.js').styleDisplay,
        classListMutation: stats('js/popup.js').classListMutation
      },
      layout: {
        styleDisplay: stats('js/layout.js').styleDisplay,
        classListMutation: stats('js/layout.js').classListMutation
      }
    },
    {
      contentBridge: { styleDisplay: 20, classListMutation: 31 },
      tabView: { styleDisplay: 22, classListMutation: 28 },
      popup: { styleDisplay: 6, classListMutation: 7 },
      layout: { styleDisplay: 34, classListMutation: 3 }
    }
  );
  assertDocPhrase('Direct visual side effects are multi-owner');
});

test('vendor generated and website lifecycle owners stay separate from product-authored page runtime', () => {
  assert.equal(stats('js/vendor/nanah.bundle.js').addEventListener, 8);
  assert.equal(stats('website/components/theme-toggle.js').addEventListener, 2);
  assert.equal(stats('website/components/theme-toggle.js').removeEventListener, 2);
  assert.equal(stats('js/ui-shell/popup-shell.js').removeEventListener, 1);
  assert.equal(stats('js/ui-shell/tab-view-decor.js').removeEventListener, 1);

  assertDocPhrase('Vendor/source hash proof and no hand-edit policy');
  assertDocPhrase('Generated freshness proof and source/output parity');
  assertDocPhrase('Website media/analytics/animation budget and route-level public claim proof');
});
