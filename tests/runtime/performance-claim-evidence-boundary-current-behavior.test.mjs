import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

test('performance claim evidence boundary is audit-only and defines the metric gate', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof slice/);
  assert.match(doc, /Runtime behavior remains unchanged/);
  assert.match(doc, /Do not use a performance percentage or latency target as proof/);
  assert.match(doc, /runtime has a named metric source/);
  assert.match(doc, /route\/surface/);
  assert.match(doc, /device\/browser profile/);
  assert.match(doc, /active-rule state/);
  assert.match(doc, /sample size/);
  assert.match(doc, /committed result artifact/);
});

test('historical performance claims are explicitly labeled instead of used as proof', () => {
  const proactive = read('docs/PROACTIVE_CHANNEL_IDENTITY.md');
  const network = read('docs/NETWORK_REQUEST_PIPELINE.md');
  const playbook = read('docs/CONTENT_HIDING_PLAYBOOK.md');
  const technical = read('docs/TECHNICAL.md');
  const menu = read('docs/THREE_DOT_MENU_IMPROVEMENTS.md');
  const inventory = read('docs/youtube_renderer_inventory.md');
  const codemap = read('docs/CODEMAP.md');
  const architecture = read('docs/ARCHITECTURE.md');

  assert.match(proactive, /Historical performance note/);
  assert.match(proactive, /historical estimates, not current proof/);
  assert.match(proactive, /performanceClaimAuthority/);
  assert.doesNotMatch(proactive, /reducing CPU usage by 60-80%/);

  assert.match(network, /Historical performance note/);
  assert.match(network, /historical estimates, not current proof/);
  assert.match(network, /performanceClaimAuthority/);
  assert.doesNotMatch(network, /eliminating UI lag during heavy filtering operations/);

  assert.match(playbook, /not proof of lag-free operation/);
  assert.match(playbook, /Historical reports described near-zero lag/);
  assert.match(playbook, /Earlier docs used 60-80% CPU-reduction language; that is a historical estimate/);

  assert.match(technical, /Earlier docs used 60-80% CPU-reduction language; treat that as a historical estimate/);
  assert.match(technical, /Earlier docs used 70-90% I\/O-reduction language; treat that as a historical estimate/);

  assert.match(menu, /DOM extraction time target \/ historical estimate\*\*: < 5ms/);
  assert.match(menu, /Network fetch time target \/ historical estimate\*\*: < 2000ms \(95th percentile\)/);
  assert.match(menu, /Cache hit rate target \/ historical estimate\*\*: > 80%/);
  assert.match(menu, /performanceClaimAuthority/);

  assert.match(inventory, /historical estimates, not current measured proof/);
  assert.match(codemap, /historical estimate until measured/);
  assert.match(architecture, /historical estimate until measured/);
});

test('runtime audit already proves lag-relevant work remains in empty or disabled states', () => {
  const emptyInstall = read('tests/runtime/empty-install-performance-current-behavior.test.mjs');
  const xhrBoundary = read('tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs');
  const activeRules = read('tests/runtime/active-rule-authority-current-behavior.test.mjs');

  assert.match(emptyInstall, /empty blocklist passes mobile browse player watch-next and guide endpoints through without body work/);
  assert.match(emptyInstall, /name: 'mobile browse'/);
  assert.match(emptyInstall, /seed fetch interception returns native fetch promise before response hooks when no JSON work is active/);
  assert.match(emptyInstall, /disabled filtering passes intercepted YouTubei responses through before JSON parse/);
  assert.match(emptyInstall, /quick block action is disabled by default and desktop eager sweeps are lazy/);

  assert.match(xhrBoundary, /XHR open bypasses YouTubei URLs before settings exist/);
  assert.match(xhrBoundary, /XHR send installs ready-state hooks only after endpoint and no-work gates pass/);

  assert.match(activeRules, /seed active predicate now centralizes JSON-active helper checks/);
  assert.match(activeRules, /DOM fallback active predicate validates selected categories but still lacks one compiled active-state report/);
});

test('performance claim boundary links stale numbers to the current behavior proof suite', () => {
  const doc = read(docPath);

  for (const artifact of [
    'tests/runtime/empty-install-performance-current-behavior.test.mjs',
    'tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs',
    'tests/runtime/active-rule-authority-current-behavior.test.mjs',
    'tests/runtime/dom-route-scope-current-behavior.test.mjs',
    'tests/runtime/selector-authority-current-behavior.test.mjs',
    'tests/runtime/identity-work-budget-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(artifact), `missing proof artifact ${artifact}`);
  }

  for (const claim of [
    '60-80%',
    '70-90%',
    '90%+ reduction',
    '< 5ms',
    '< 2000ms',
    '> 80%'
  ]) {
    assert.ok(doc.includes(claim), `missing claim token ${claim}`);
  }
});

test('future performance authority symbols do not exist in product runtime source yet', () => {
  const source = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ].map(read).join('\n');

  for (const token of [
    'performanceClaimAuthority',
    'runtimeMetricSample',
    'emptyInstallNoWorkMetric',
    'routeWorkBudgetReport',
    'menuResolutionLatencyMetric'
  ]) {
    assert.doesNotMatch(source, new RegExp(token));
  }
});
