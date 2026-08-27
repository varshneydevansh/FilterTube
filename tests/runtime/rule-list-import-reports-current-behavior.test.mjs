import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const reportSource = fs.readFileSync('js/rule_list_import_reports.js', 'utf8');
const tabSource = fs.readFileSync('js/tab-view.js', 'utf8');
const html = fs.readFileSync('html/tab-view.html', 'utf8');

function loadReportApi() {
  const context = vm.createContext({ URL, Date, Math, globalThis: null });
  context.globalThis = context;
  vm.runInContext(reportSource, context, { filename: 'rule_list_import_reports.js' });
  return context.FilterTubeRuleListImportReports;
}

function completeChannel(id, name, handle) {
  return {
    id,
    name,
    handle,
    logo: `https://example.test/${id}.jpg`,
    originalInput: id,
    source: 'managed_channel_list'
  };
}

test('import reports distinguish complete, pending, retrying, and name-only rows across Main and Kids', () => {
  const api = loadReportApi();
  const completeId = `UC${'a'.repeat(22)}`;
  const pendingId = `UC${'b'.repeat(22)}`;
  const retryId = `UC${'c'.repeat(22)}`;
  const report = api.normalizeReport({
    id: 'report-a',
    label: 'Mixed import',
    targets: [
      { profileId: 'default', surface: 'main', listType: 'blocklist' },
      { profileId: 'default', surface: 'kids', listType: 'blocklist' }
    ],
    channels: [
      { id: completeId, originalValue: completeId, sourceRow: 2 },
      { id: pendingId, originalValue: pendingId, sourceRow: 3 },
      { id: retryId, originalValue: retryId, sourceRow: 4 },
      { name: 'Creator display name', originalValue: 'Creator display name', sourceRow: 5, nameOnly: true }
    ],
    issues: [{ row: 6, value: 'not a channel', reason: 'Unsupported row' }]
  });
  const partial = (id) => ({ id, name: id, originalInput: id, source: 'managed_channel_list' });
  const nameOnly = { id: '', name: 'Creator display name', originalInput: 'Creator display name', source: 'blocktube-channel-name' };
  const profiles = {
    profiles: {
      default: {
        main: {
          channels: [completeChannel(completeId, 'Complete', '@complete'), partial(pendingId), partial(retryId), nameOnly]
        },
        kids: {
          blockedChannels: [completeChannel(completeId, 'Complete', '@complete'), partial(pendingId), partial(retryId), nameOnly]
        }
      }
    }
  };
  const job = {
    pending: [
      ...['main', 'kids'].map((surface) => ({
        id: pendingId,
        input: pendingId,
        targetProfileId: 'default',
        profile: surface,
        listType: 'blocklist',
        attempts: 0
      })),
      ...['main', 'kids'].map((surface) => ({
        id: retryId,
        input: retryId,
        targetProfileId: 'default',
        profile: surface,
        listType: 'blocklist',
        attempts: 2,
        nextAttemptAt: 12345,
        lastError: 'incomplete_channel_metadata'
      }))
    ]
  };

  const summary = api.summarize(report, { profiles, job });
  assert.deepEqual(JSON.parse(JSON.stringify(summary.statuses)), {
    complete: 1,
    pending: 1,
    fetching: 0,
    retrying: 1,
    needs_attention: 2
  });
  assert.equal(summary.rows.find((row) => row.originalValue === retryId).attempts, 2);
  assert.match(summary.rows.find((row) => row.originalValue === 'Creator display name').reason, /name-only/i);
});

test('import reports preserve a permanent channel lookup reason and manual-verification state', () => {
  const api = loadReportApi();
  const id = `UC${'p'.repeat(22)}`;
  const report = api.normalizeReport({
    id: 'report-permanent-failure',
    label: 'Not found import',
    targets: [{ profileId: 'default', surface: 'main', listType: 'blocklist' }],
    channels: [{ id, originalValue: id, sourceRow: 12 }]
  });
  const profiles = {
    profiles: {
      default: {
        main: {
          channels: [{
            id,
            name: id,
            handle: null,
            customUrl: null,
            logo: null,
            source: 'import',
            originalInput: id
          }]
        }
      }
    }
  };
  const summary = api.summarize(report, {
    profiles,
    job: {
      attention: [{
        id,
        input: id,
        targetProfileId: 'default',
        profile: 'main',
        listType: 'blocklist',
        failureKind: 'permanent',
        errorCode: 'channel_not_found',
        attempts: 1,
        lastError: 'This channel does not exist.'
      }]
    }
  });

  assert.equal(summary.statuses.needs_attention, 1);
  assert.equal(summary.rows[0].status, 'needs_attention');
  assert.equal(summary.rows[0].failureKind, 'permanent');
  assert.equal(summary.rows[0].errorCode, 'channel_not_found');
  assert.equal(summary.rows[0].reason, 'This channel does not exist.');
});

test('report derivation recognizes a legacy pending 404 as permanent attention', () => {
  const api = loadReportApi();
  const id = `UC${'q'.repeat(22)}`;
  const report = api.normalizeReport({
    id: 'report-legacy-404',
    targets: [{ profileId: 'default', surface: 'main', listType: 'blocklist' }],
    channels: [{ id, originalValue: id }]
  });
  const summary = api.summarize(report, {
    profiles: {
      profiles: {
        default: {
          main: {
            channels: [{ id, name: id, source: 'import', originalInput: id, logo: null }]
          }
        }
      }
    },
    job: {
      pending: [{
        id,
        input: id,
        targetProfileId: 'default',
        profile: 'main',
        listType: 'blocklist',
        lastError: 'Failed to fetch channel page: 404'
      }]
    }
  });

  assert.equal(summary.rows[0].status, 'needs_attention');
  assert.equal(summary.rows[0].reason, 'Failed to fetch channel page: 404');
});

test('report store persists newest reports with a bounded history', async () => {
  const api = loadReportApi();
  const storage = {};
  const store = api.createStore({
    storageGet: async () => storage,
    storageSet: async (payload) => Object.assign(storage, payload),
    maxReports: 2
  });
  await store.save({ id: 'old', createdAt: 1, label: 'Old' });
  await store.save({ id: 'middle', createdAt: 2, label: 'Middle' });
  await store.save({ id: 'new', createdAt: 3, label: 'New' });
  const reports = await store.read();
  assert.equal(Array.from(reports, (report) => report.id).join(','), 'new,middle');
});

test('older imported rows receive compact recovered reports without copying the large channel list into storage', () => {
  const api = loadReportApi();
  const id = `UC${'r'.repeat(22)}`;
  const profiles = {
    profiles: {
      default: {
        name: 'Default',
        main: {
          channels: [{
            id,
            name: id,
            source: 'managed_channel_list',
            managedListId: 'old-list',
            managedListName: 'User block list',
            managedListSourceLabel: 'channels.csv',
            originalInput: id
          }]
        }
      }
    }
  };
  const reports = api.createBackfillReports(profiles);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].channels.length, 0);
  assert.equal(reports[0].selector.managedListId, 'old-list');
  const summary = api.summarize(reports[0], {
    profiles,
    job: { pending: [{ input: id, id, targetProfileId: 'default', profile: 'main', listType: 'blocklist' }] }
  });
  assert.equal(summary.rows.length, 1);
  assert.equal(summary.rows[0].status, 'pending');
});

test('dashboard exposes persistent import reports without rendering every row at once', () => {
  assert.match(html, /id="ftImportReportsBtn"/);
  assert.match(html, /rule_list_import_reports\.js/);
  assert.match(tabSource, /visibleLimit = 200/);
  assert.match(tabSource, /Download unresolved CSV/);
  assert.match(tabSource, /View Import Report/);
  assert.match(tabSource, /Rows that will not be imported/);
  assert.match(tabSource, /createBackfillReports/);
  assert.match(tabSource, /Estimated active time/);
});
