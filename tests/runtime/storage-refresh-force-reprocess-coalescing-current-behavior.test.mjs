import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const sourcePath = 'js/content/bridge_settings.js';
const docPath = 'docs/audit/FILTERTUBE_STORAGE_REFRESH_FORCE_REPROCESS_COALESCING_CURRENT_BEHAVIOR_2026-05-30.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function createBridgeRuntime({ now = 0, runtimeResponses = [] } = {}) {
  const events = {
    storageListeners: [],
    runtimeMessages: [],
    timers: new Map(),
    domFallbacks: [],
    postMessages: []
  };
  let currentNow = now;
  let timerId = 0;
  const context = {
    console,
    Map,
    Set,
    Promise,
    URL,
    URLSearchParams,
    Date: {
      now: () => currentNow
    },
    location: {
      hostname: 'www.youtube.com',
      pathname: '/watch',
      href: 'https://www.youtube.com/watch?v=abcdefghijk'
    },
    document: {
      readyState: 'complete',
      documentElement: {
        getAttribute() {
          return null;
        }
      }
    },
    browserAPI_BRIDGE: {
      runtime: {
        id: 'filtertube-test-extension',
        lastError: null,
        onMessage: {
          addListener() {}
        },
        sendMessage(payload, callback) {
          events.runtimeMessages.push(payload);
          const response = runtimeResponses.length
            ? runtimeResponses.shift()
            : { enabled: true, profileType: 'main', listMode: 'blocklist' };
          callback?.(response);
        }
      },
      storage: {
        onChanged: {
          addListener(listener) {
            events.storageListeners.push(listener);
          }
        }
      }
    },
    debugLog() {},
    applyDOMFallback(settings, options) {
      events.domFallbacks.push({ settings, options });
    },
    refreshFilterTubeRuntimeObservers() {},
    addEventListener() {},
    postMessage(message, target) {
      events.postMessages.push({ message, target });
    },
    setTimeout(callback, delay) {
      const id = ++timerId;
      events.timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      events.timers.delete(id);
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read(sourcePath), context);

  return {
    events,
    setNow(value) {
      currentNow = value;
    },
    fireStorageChange(changes) {
      assert.equal(events.storageListeners.length, 1);
      events.storageListeners[0](changes, 'local');
    },
    runNextTimer() {
      const next = events.timers.entries().next();
      assert.equal(next.done, false, 'expected a pending timer');
      const [id, timer] = next.value;
      events.timers.delete(id);
      timer.callback();
    },
    async flush() {
      await Promise.resolve();
      await new Promise(resolve => setImmediate(resolve));
    }
  };
}

test('pending map-only storage refresh is upgraded when a keyword/profile change arrives before the timer fires', async () => {
  const runtime = createBridgeRuntime({
    runtimeResponses: [
      {
        enabled: true,
        profileType: 'main',
        listMode: 'blocklist',
        filterKeywords: [{ pattern: 'shakira', flags: 'i' }]
      }
    ]
  });

  runtime.fireStorageChange({
    videoChannelMap: { oldValue: {}, newValue: { abcdefghijk: 'UC-test' } }
  });
  assert.equal(runtime.events.domFallbacks.length, 0);

  runtime.fireStorageChange({
    ftProfilesV4: { oldValue: null, newValue: { schemaVersion: 4 } }
  });
  assert.equal(runtime.events.domFallbacks.length, 0);

  runtime.runNextTimer();
  await runtime.flush();

  assert.equal(runtime.events.domFallbacks.length, 1);
  assert.equal(runtime.events.domFallbacks[0].options.forceReprocess, true);
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.events.runtimeMessages[0])), {
    action: 'getCompiledSettings',
    profileType: 'main',
    forceRefresh: true
  });
});

test('pending map-only storage refresh stays non-forcing when no rule-changing key arrives', async () => {
  const runtime = createBridgeRuntime();

  runtime.fireStorageChange({
    videoChannelMap: { oldValue: {}, newValue: { abcdefghijk: 'UC-test' } }
  });
  runtime.runNextTimer();
  await runtime.flush();

  assert.equal(runtime.events.domFallbacks.length, 1);
  assert.equal(runtime.events.domFallbacks[0].options.forceReprocess, false);
});

test('bridge settings source carries an explicit pending force-reprocess upgrade bit', () => {
  const source = read(sourcePath);

  assert.match(source, /let pendingStorageRefreshForceReprocess = false;/);
  assert.match(source, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;/);
  assert.match(source, /const forcePendingReprocess = pendingStorageRefreshForceReprocess === true;/);
});

test('storage refresh force-reprocess coalescing audit boundary is source pinned', () => {
  const text = read(docPath);
  const bridge = read(sourcePath);

  for (const token of [
    'storage refresh force-reprocess coalescing rows: 6',
    'map-only pending refresh upgrade proof: PRESENT',
    'map-only non-forcing proof: PRESENT',
    'rule/profile forced refresh preservation: PRESENT',
    'settings refresh optimization approval from this proof: NO-GO',
    'runtime behavior changed by this boundary: no',
    'storage_force_reprocess_pending_upgrade_bit',
    'storage_force_reprocess_executable_upgrade_fixture',
    'storage_force_reprocess_executable_nonforcing_fixture',
    'accept storage force-reprocess coalescing as current correctness proof: GO',
    'accept storage force-reprocess coalescing as broad refresh pruning approval: NO-GO',
    'accept storage force-reprocess coalescing as map-only pruning approval: NO-GO',
    'accept storage force-reprocess coalescing as visible-tab stale-card parity proof: NO-GO',
    'storageRefreshForceReprocessDecisionReport',
    'storageRefreshInstalledTabParityTrace'
  ]) {
    assert.ok(text.includes(token), `missing storage refresh coalescing audit token ${token}`);
  }

  for (const row of [
    'storage_force_reprocess_refreshnow_forced',
    'storage_force_reprocess_applysettings_forced',
    'storage_force_reprocess_pending_upgrade_bit',
    'storage_force_reprocess_map_only_nonforcing',
    'storage_force_reprocess_executable_upgrade_fixture',
    'storage_force_reprocess_executable_nonforcing_fixture'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing storage refresh coalescing row ${row}`);
  }

  assert.match(bridge, /request\.action === 'FilterTube_RefreshNow'[\s\S]*?applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\);/);
  assert.match(bridge, /request\.action === 'FilterTube_ApplySettings' && request\.settings[\s\S]*?sendSettingsToMainWorld\(normalized\);[\s\S]*?applyDOMFallback\(normalized, \{ forceReprocess: true \}\);/);
  assert.match(bridge, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;[\s\S]*?const forcePendingReprocess = pendingStorageRefreshForceReprocess === true;[\s\S]*?applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);
  assert.match(bridge, /const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap';[\s\S]*?const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap';[\s\S]*?scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\);/);

  for (const futureToken of [
    'storageRefreshForceReprocessDecisionReport',
    'storageRefreshVisibleCardStaleProof',
    'storageRefreshMapOnlyOptimizationApproval',
    'storageRefreshInstalledTabParityTrace',
    'storageRefreshMetricArtifact',
    'storageRefreshRollbackProof'
  ]) {
    assert.doesNotMatch(bridge, new RegExp(`\\b${futureToken}\\b`), `${futureToken} should remain absent from bridge source`);
  }
});
