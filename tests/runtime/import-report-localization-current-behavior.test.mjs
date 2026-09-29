import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sourceMap = JSON.parse(read('data/ui_locales/batches/import-reports.json'));
const tabSource = read('js/tab-view.js');
const reportSource = read('js/rule_list_import_reports.js');
const keys = Object.keys(sourceMap);
const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort();

test('import report English source keys are wired to generated report UI', () => {
  assert.ok(keys.length >= 70);
  for (const key of keys) {
    assert.ok(tabSource.includes(key.replace('dashboard.importReport.', '')), `${key} runtime wiring`);
  }
  assert.match(tabSource, /filtertube-ui-locale-changed', refreshLocalizedReport/);
  assert.match(tabSource, /setRuleListImportReportCopy\(card, 'aria-label', 'dialogLabel'/);
});

test('import report status and stable failure reasons use the selected UI locale', () => {
  const start = tabSource.indexOf('function formatRuleListReportTarget(target)');
  const end = tabSource.indexOf('const REPORT_IMPORTED_CHANNEL_SOURCES = new Set([', start);
  assert.ok(start >= 0 && end > start);
  const translations = {
    'dashboard.importReport.status.needsAttention': 'Status needs review (translated)',
    'dashboard.importReport.reason.nameOnly': 'Name-only channel rule (translated)',
    'dashboard.importReport.reason.channelNotFound': 'Channel missing (translated)'
  };
  const context = {
    normalizeString: value => typeof value === 'string' ? value.trim() : '',
    safeArray: value => Array.isArray(value) ? value : [],
    safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
    tabViewUiText(key, fallback) { return translations[key] || fallback; }
  };
  vm.createContext(context);
  vm.runInContext(tabSource.slice(start, end), context);

  assert.equal(context.ruleListReportStatusLabel('needs_attention'), 'Status needs review (translated)');
  assert.equal(context.formatRuleListReportReason({
    status: 'needs_attention',
    reasonCode: 'name_only_rule',
    reason: 'This is a name-only rule. Add a channel link or UC ID if you want exact channel identity and metadata.'
  }), 'Name-only channel rule (translated)');
  assert.equal(context.formatRuleListReportReason({
    status: 'needs_attention',
    reasonCode: 'channel_not_found',
    reason: 'This channel does not exist.'
  }), 'Channel missing (translated)');
});

test('report API includes stable codes for generated reasons while preserving readable English', () => {
  const context = vm.createContext({ URL, Date, Math, globalThis: null });
  context.globalThis = context;
  vm.runInContext(reportSource, context, { filename: 'rule_list_import_reports.js' });
  const api = context.FilterTubeRuleListImportReports;
  const id = `UC${'x'.repeat(22)}`;
  const report = api.normalizeReport({
    id: 'localized-reason',
    targets: [{ profileId: 'default', surface: 'main', listType: 'blocklist' }],
    channels: [{ id, nameOnly: true, originalValue: 'Creator name' }]
  });
  const summary = api.summarize(report, {
    profiles: {
      profiles: {
        default: {
          main: {
            channels: [{ id: '', name: 'Creator name', source: 'import' }]
          }
        }
      }
    }
  });

  assert.equal(summary.rows[0].reasonCode, 'name_only_rule');
  assert.match(summary.rows[0].reason, /name-only/i);
});

test('import report translation draft covers all 37 target locales and preserves placeholders', () => {
  const batchDirectory = path.join(root, 'data/ui_locales/batches');
  const draftFiles = fs.readdirSync(batchDirectory)
    .filter(file => /^import-reports-translations(?:-[\w-]+)?\.json$/.test(file))
    .sort();
  assert.ok(draftFiles.length > 0, 'import report translation draft exists');
  const translations = {};
  for (const file of draftFiles) {
    const draft = JSON.parse(fs.readFileSync(path.join(batchDirectory, file), 'utf8'));
    assert.deepEqual(draft.keys, keys, `${file} key order`);
    for (const [locale, values] of Object.entries(draft.translations || {})) {
      assert.equal(translations[locale], undefined, `${locale} appears in only one draft`);
      translations[locale] = values;
    }
  }
  const targets = JSON.parse(read('data/ui_locales/targets.json')).locales
    .map(locale => locale.code)
    .filter(locale => locale !== 'en');
  assert.deepEqual(Object.keys(translations).sort(), [...targets].sort());
  for (const locale of targets) {
    const values = translations[locale];
    assert.equal(values.length, keys.length, locale);
    values.forEach((value, index) => {
      assert.ok(typeof value === 'string' && value.trim(), `${locale}: ${keys[index]}`);
      assert.deepEqual(placeholders(value), placeholders(sourceMap[keys[index]]), `${locale}: ${keys[index]}`);
    });
  }
});
