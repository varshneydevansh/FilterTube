import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const schedulerSource = fs.readFileSync('js/imported_channel_enrichment.js', 'utf8');

function clone(value) {
  return value == null ? value : structuredClone(value);
}

function validId(letter) {
  return `UC${String(letter).repeat(22)}`;
}

function incompleteChannel(id, source = 'import') {
  return {
    id,
    name: id,
    handle: null,
    handleDisplay: null,
    canonicalHandle: null,
    customUrl: null,
    logo: null,
    source
  };
}

function completeChannel(id, suffix = 'complete') {
  return {
    id,
    name: `Channel ${suffix}`,
    handle: `@${suffix}`,
    handleDisplay: `@${suffix}`,
    canonicalHandle: `@${suffix}`,
    customUrl: null,
    logo: `https://example.test/${suffix}.jpg`
  };
}

function profilesFor(channels, activeProfileId = 'default') {
  return {
    schemaVersion: 4,
    activeProfileId,
    profiles: {
      default: {
        type: 'account',
        parentProfileId: null,
        main: {
          channels,
          whitelistChannels: []
        },
        kids: {
          blockedChannels: [],
          whitelistChannels: []
        }
      }
    }
  };
}

async function flush() {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}

function createRuntime({ channels, responseForTask, authorized = true, storedJob = null, random = () => 0, schedulerOptions = {} }) {
  let currentTime = 1_000_000;
  const storage = storedJob ? { ftBlockTubeEnrichmentJobV1: clone(storedJob) } : {};
  const timers = [];
  const alarms = [];
  const enrichCalls = [];
  let timerId = 0;
  const profiles = profilesFor(channels);

  const context = {
    console,
    URL,
    Promise,
    Set,
    Map,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Date,
    Math,
    globalThis: null
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(schedulerSource, context, { filename: 'js/imported_channel_enrichment.js' });

  const scheduler = context.FilterTubeImportedChannelEnrichment.create({
    now: () => currentTime,
    random,
    setTimeout(callback, delayMs) {
      const timer = { id: ++timerId, callback, delayMs, cleared: false };
      timers.push(timer);
      return timer.id;
    },
    clearTimeout(id) {
      const timer = timers.find(item => item.id === id);
      if (timer) timer.cleared = true;
    },
    storageGet: async key => ({
      ftBlockTubeEnrichmentJobV1: clone(storage.ftBlockTubeEnrichmentJobV1)
    }),
    storageSet: async payload => {
      Object.assign(storage, clone(payload));
    },
    storageRemove: async key => {
      delete storage.ftBlockTubeEnrichmentJobV1;
    },
    createAlarm: async (name, when) => {
      alarms.push({ name, when });
    },
    clearAlarm: async name => {
      alarms.push({ name, cleared: true });
    },
    loadProfiles: async () => clone(profiles),
    isAuthorized: () => authorized,
    canManageTarget: (currentProfiles, actorProfileId, targetProfileId) => actorProfileId === targetProfileId,
    isComplete: channel => Boolean(channel?.id && channel?.name && channel?.handle && channel?.logo),
    maxAttempts: schedulerOptions.maxAttempts,
    enrich: async task => {
      enrichCalls.push(clone(task));
      return responseForTask ? responseForTask(task) : { success: true, channelData: completeChannel(task.input) };
    }
  });

  return {
    scheduler,
    storage,
    timers,
    alarms,
    enrichCalls,
    setNow(value) {
      currentTime = value;
    },
    async runNextTimer() {
      const timer = timers.find(item => !item.cleared);
      assert.ok(timer, 'expected a live background timer');
      timer.cleared = true;
      currentTime += timer.delayMs;
      await timer.callback();
      await flush();
    }
  };
}

test('background worker owns imported enrichment and keeps 7–15 second jitter separate from alarm wakeups', async () => {
  const runtime = createRuntime({
    channels: [incompleteChannel(validId('a')), incompleteChannel(validId('b'))]
  });

  const started = await runtime.scheduler.start();
  assert.equal(started.scheduler, 'background');
  assert.equal(started.pending, 2);
  assert.equal(started.initialTotal, 2);
  assert.equal(started.completed, 0);
  assert.equal(runtime.timers.at(-1).delayMs, 0);
  assert.ok(runtime.alarms.some(alarm => alarm.when >= 1_030_000));

  await runtime.runNextTimer();
  assert.equal(runtime.enrichCalls.length, 1);
  assert.equal(runtime.enrichCalls[0].input, validId('a'));
  assert.equal(runtime.timers.at(-1).delayMs, 7000);
  assert.ok(runtime.alarms.some(alarm => !alarm.cleared && alarm.when >= 1_030_000));

  const afterFirst = await runtime.scheduler.getStatus();
  assert.equal(afterFirst.pending, 1);
  assert.equal(afterFirst.initialTotal, 2);
  assert.equal(afterFirst.completed, 1);
  assert.equal(afterFirst.inFlight, false);
  assert.equal(afterFirst.minDelayMs, 7000);
  assert.equal(afterFirst.maxDelayMs, 15000);
  assert.equal(afterFirst.scheduler, 'background');

  await runtime.runNextTimer();
  assert.equal(runtime.enrichCalls.length, 2);
  assert.equal(runtime.storage.ftBlockTubeEnrichmentJobV1, undefined);
});

test('startup discovers incomplete generic imports even when no legacy job was saved', async () => {
  const runtime = createRuntime({
    channels: [incompleteChannel(validId('g'), 'managed_channel_list')]
  });

  const status = await runtime.scheduler.initialize();
  assert.equal(status.pending, 1);
  assert.equal(status.scheduler, 'background');
  assert.equal(runtime.timers.at(-1).delayMs, 0);
});

test('BlockTube name-only rules never enter the UC metadata queue', async () => {
  const runtime = createRuntime({
    channels: [{
      id: '',
      name: '@name-boundary-rule',
      originalInput: '@name-boundary-rule',
      source: 'blocktube-channel-name',
      logo: null
    }]
  });

  const status = await runtime.scheduler.start();
  assert.equal(status.pending, 0);
  assert.equal(runtime.enrichCalls.length, 0);
  assert.equal(runtime.timers.filter(timer => !timer.cleared).length, 0);
});

test('pause and explicit resume are persisted by the background owner', async () => {
  const runtime = createRuntime({ channels: [incompleteChannel(validId('p'))] });
  await runtime.scheduler.start();
  const paused = await runtime.scheduler.pause();

  assert.equal(paused.paused, true);
  assert.equal(paused.pausedReason, 'user');
  assert.equal(paused.pending, 1);
  assert.equal(runtime.timers.filter(timer => !timer.cleared).length, 0);

  const resumed = await runtime.scheduler.explicitResume();
  assert.equal(resumed.paused, false);
  assert.equal(resumed.pending, 1);
  assert.equal(runtime.timers.at(-1).delayMs, 0);
});

test('worker recovery requeues an interrupted lookup instead of losing it', async () => {
  const id = validId('r');
  const runtime = createRuntime({
    channels: [incompleteChannel(id)],
    storedJob: {
      version: 2,
      pending: [],
      inFlight: {
        input: id,
        profile: 'main',
        listType: 'blocklist',
        source: 'managed_channel_list',
        targetProfileId: 'default',
        actorProfileId: 'default'
      },
      nextRunAt: 0
    }
  });

  const status = await runtime.scheduler.initialize();
  assert.equal(status.pending, 1);
  assert.equal(status.inFlight, false);
  await runtime.runNextTimer();
  assert.equal(runtime.enrichCalls.length, 1);
  assert.equal(runtime.enrichCalls[0].input, id);
});

test('profile lock blocks background mutation without bypassing PIN authority', async () => {
  const runtime = createRuntime({
    channels: [incompleteChannel(validId('l'))],
    authorized: false
  });
  await runtime.scheduler.start();
  await runtime.runNextTimer();

  assert.equal(runtime.enrichCalls.length, 0);
  const status = await runtime.scheduler.getStatus();
  assert.equal(status.blockedReason, 'profile_locked');
  assert.equal(status.pending, 1);
  assert.equal(status.nextRunAt, 0);
});

test('incomplete responses remain queued with exponential retry backoff', async () => {
  const runtime = createRuntime({
    channels: [incompleteChannel(validId('x'))],
    responseForTask: () => ({ success: false, errorCode: 'temporary_fetch_failure', error: 'temporary' })
  });
  await runtime.scheduler.start();
  await runtime.runNextTimer();

  const task = runtime.storage.ftBlockTubeEnrichmentJobV1.pending[0];
  assert.equal(task.attempts, 1);
  assert.equal(task.nextAttemptAt, 1_000_000 + 2 * 60 * 1000);
  assert.equal(runtime.enrichCalls.length, 1);
});

test('permanent not-found responses stop retrying but remain reportable for manual verification', async () => {
  const id = validId('n');
  const runtime = createRuntime({
    channels: [incompleteChannel(id)],
    responseForTask: () => ({
      success: false,
      errorCode: 'channel_not_found',
      error: 'This channel does not exist.',
      retryable: false
    })
  });

  await runtime.scheduler.start();
  await runtime.runNextTimer();

  const job = runtime.storage.ftBlockTubeEnrichmentJobV1;
  assert.ok(job);
  assert.equal(job.pending.length, 0);
  assert.equal(job.attention.length, 1);
  assert.equal(job.attention[0].input, id);
  assert.equal(job.attention[0].failureKind, 'permanent');
  assert.equal(job.attention[0].errorCode, 'channel_not_found');
  assert.equal(job.attention[0].lastError, 'This channel does not exist.');
  assert.equal(job.attention[0].nextAttemptAt, 0);

  const status = await runtime.scheduler.getStatus();
  assert.equal(status.pending, 0);
  assert.equal(status.attention, 1);
  assert.equal(status.total, 0);
  assert.equal(status.nextRunAt, 0);
  assert.equal(runtime.timers.filter(timer => !timer.cleared).length, 0);

  await runtime.scheduler.wake();
  assert.equal(runtime.enrichCalls.length, 1);
});

test('terminated-account responses are also terminal and retain the YouTube reason', async () => {
  const id = validId('t');
  const runtime = createRuntime({
    channels: [incompleteChannel(id)],
    responseForTask: () => ({
      success: false,
      error: "This account has been terminated for a violation of YouTube's Terms of Service."
    })
  });

  await runtime.scheduler.start();
  await runtime.runNextTimer();

  const task = runtime.storage.ftBlockTubeEnrichmentJobV1.attention[0];
  assert.equal(task.failureKind, 'permanent');
  assert.equal(task.errorCode, 'channel_terminated');
  assert.equal(task.lastError, "This account has been terminated for a violation of YouTube's Terms of Service.");
});

test('reload migrates an old pending 404 row into manual attention instead of retrying it', async () => {
  const id = validId('h');
  const runtime = createRuntime({
    channels: [incompleteChannel(id)],
    storedJob: {
      version: 2,
      pending: [{
        id,
        input: id,
        targetProfileId: 'default',
        profile: 'main',
        listType: 'blocklist',
        source: 'import',
        attempts: 4,
        nextAttemptAt: 1_000_000 + 6 * 60 * 60 * 1000,
        lastError: 'Failed to fetch channel page: 404'
      }],
      nextRunAt: 1_000_000 + 6 * 60 * 60 * 1000
    }
  });

  const status = await runtime.scheduler.initialize();
  assert.equal(status.pending, 0);
  assert.equal(status.attention, 1);
  assert.equal(runtime.enrichCalls.length, 0);
  assert.equal(runtime.timers.filter(timer => !timer.cleared).length, 0);
  assert.equal(runtime.storage.ftBlockTubeEnrichmentJobV1.attention[0].failureKind, 'permanent');
});

test('a failed row does not pause fresh rows behind its retry timestamp', async () => {
  const failedId = validId('f');
  const freshId = validId('q');
  const runtime = createRuntime({
    channels: [incompleteChannel(failedId), incompleteChannel(freshId)],
    responseForTask: task => task.input === failedId
      ? { success: false, errorCode: 'temporary_fetch_failure', error: 'temporary' }
      : { success: true, channelData: completeChannel(task.input, 'fresh') }
  });

  await runtime.scheduler.start();
  await runtime.runNextTimer();

  assert.equal(runtime.enrichCalls.length, 1);
  assert.equal(runtime.enrichCalls[0].input, failedId);
  assert.equal(runtime.storage.ftBlockTubeEnrichmentJobV1.pending.length, 2);
  assert.ok(runtime.storage.ftBlockTubeEnrichmentJobV1.pending.some(task => task.input === freshId));
  assert.ok(runtime.timers.at(-1).delayMs >= 7000 && runtime.timers.at(-1).delayMs <= 15000);
  assert.ok(runtime.timers.at(-1).delayMs < 6 * 60 * 60 * 1000);

  await runtime.runNextTimer();
  assert.equal(runtime.enrichCalls.length, 2);
  assert.equal(runtime.enrichCalls[1].input, freshId);
});

test('reload recovers a stale queue-wide six-hour wake written by the old scheduler', async () => {
  const id = validId('o');
  const runtime = createRuntime({
    channels: [incompleteChannel(id)],
    storedJob: {
      version: 2,
      pending: [{
        input: id,
        id,
        profile: 'main',
        listType: 'blocklist',
        source: 'import',
        targetProfileId: 'default',
        actorProfileId: 'default',
        attempts: 0,
        nextAttemptAt: 0
      }],
      nextRunAt: 1_000_000 + 6 * 60 * 60 * 1000
    }
  });

  const status = await runtime.scheduler.initialize();
  assert.equal(status.pending, 1);
  assert.equal(runtime.timers.at(-1).delayMs, 0);
  await runtime.runNextTimer();
  assert.equal(runtime.enrichCalls.length, 1);
  assert.equal(runtime.enrichCalls[0].input, id);
});

test('reload collapses old duplicate tasks when a UC ID and handle belong to one row', async () => {
  const id = validId('d');
  const handle = '@duplicate-alias';
  const runtime = createRuntime({
    channels: [{
      ...incompleteChannel(id),
      originalInput: handle
    }, {
      ...incompleteChannel(id),
      originalInput: handle
    }],
    storedJob: {
      version: 2,
      pending: [
        {
          input: id,
          id,
          profile: 'main',
          listType: 'blocklist',
          source: 'import',
          targetProfileId: 'default',
          actorProfileId: 'default',
          attempts: 0,
          nextAttemptAt: 0
        },
        {
          input: handle,
          id: '',
          profile: 'main',
          listType: 'blocklist',
          source: 'import',
          targetProfileId: 'default',
          actorProfileId: 'default',
          attempts: 0,
          nextAttemptAt: 0
        }
      ],
      nextRunAt: 0
    }
  });

  const status = await runtime.scheduler.initialize();
  assert.equal(status.pending, 1);
});

test('repeated incomplete responses stay queued after the attempt cap', async () => {
  const runtime = createRuntime({
    channels: [incompleteChannel(validId('z'))],
    schedulerOptions: { maxAttempts: 1 },
    responseForTask: () => ({ success: false, errorCode: 'temporary_fetch_failure', error: 'temporary' })
  });
  await runtime.scheduler.start();
  await runtime.runNextTimer();

  const job = runtime.storage.ftBlockTubeEnrichmentJobV1;
  job.pending[0].nextAttemptAt = 0;
  job.nextRunAt = 0;
  await runtime.scheduler.wake();
  await flush();

  const retained = runtime.storage.ftBlockTubeEnrichmentJobV1;
  assert.ok(retained);
  assert.equal(retained.pending.length, 1);
  assert.equal(retained.pending[0].attempts, 1);
  assert.equal(retained.pending[0].nextAttemptAt, 1_000_000 + 30 * 60 * 1000);
  assert.equal(retained.pending[0].lastError, 'temporary');
  assert.equal(retained.pending[0].lastErrorAt, 1_000_000);
});
