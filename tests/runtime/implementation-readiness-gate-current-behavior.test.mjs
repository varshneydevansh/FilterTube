import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const gateDocPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

test('implementation readiness gate explicitly blocks broad behavior changes', () => {
  const doc = read(gateDocPath);

  assert.match(doc, /Implementation readiness: NOT READY for broad behavior changes/);
  assert.match(doc, /Allowed next work: fixtures, instrumentation, source-boundary proof/);
  assert.match(doc, /Blocked next work: changing JSON filtering, DOM fallback, message trust/);
  assert.match(doc, /Green current-behavior tests prove what the source does today/);
});

test('readiness gate covers every current high-risk implementation area', () => {
  const doc = read(gateDocPath);

  for (const area of [
    '`compiledRuleState`',
    'Content/category predicate authority',
    'Keyword match authority',
    'Stats/time-saved side-effect authority',
    'Backup/export authority',
    'Profile/viewing-space authority',
    'Watch/player control authority',
    '`endpointPolicy`',
    'Network/fetch authority',
    'External navigation/link authority',
    'Message trust contract',
    'Message side-effect contract',
    'Lifecycle registry',
    'Lifecycle instance register',
    'Renderer JSON expansion',
    'DOM selector registry',
    'DOM selector instance register',
    'Hide/restore authority',
    'Storage/cache key authority',
    'Settings mutation/revision',
    'Rule mutation entrypoint authority',
    'Learned identity provenance',
    'Diagnostic logging convergence boundary',
    'Public/release claims',
    'Release package parity',
    'Native runtime sync authority',
    'Prompt/onboarding coordinator',
    'Manifest/permission authority',
    'Security/PIN lock authority',
    'Simultaneous allow/block UI'
  ]) {
    assert.ok(doc.includes(area), `missing readiness area ${area}`);
  }

  const noRows = doc.match(/\| [^|\n]+ \| [^|\n]+ \| No \|/g) || [];
  assert.equal(noRows.length, 29, 'all twenty-nine readiness rows should be blocked today');
  assertReadinessGateLinksCurrentYouTubeSpaHotTimerAudit();
});

function assertReadinessGateLinksCurrentYouTubeSpaHotTimerAudit() {
  const doc = read(gateDocPath);
  const lifecycle = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');
  const priority = read('docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md');
  const whitelistCache = read('docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_AFFECTED_CALLABLE_PROOF_BOUNDARY_CURRENT_BEHAVIOR_2026-05-30.md');
  const releaseLag = read('docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md');
  const messageSideEffect = read('docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md');
  const ruleMutation = read('docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md');
  const settingsSourceEffect = read('docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md');
  const contentFilterRoute = read('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md');
  const contentFilterNoWork = read('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md');
  const selectorAuthority = read('docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md');
  const methodSemanticGap = read('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md');
  const jsonPathAuthority = read('docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');
  const diagnosticPolicy = read('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md');
  const quickBlockHover = read('docs/audit/FILTERTUBE_QUICK_BLOCK_HOVER_LIFECYCLE_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md');
  const installedChromePath = read('docs/audit/FILTERTUBE_INSTALLED_CHROME_UNPACKED_PATH_PARITY_CURRENT_BEHAVIOR_2026-05-30.md');
  const visibleInstalledTabParity = read('docs/audit/FILTERTUBE_VISIBLE_INSTALLED_TAB_BYTE_PARITY_PREFLIGHT_CURRENT_BEHAVIOR_2026-05-31.md');
  const engagementBudget = read('docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md');
  const watchEndscreen = read('docs/audit/FILTERTUBE_WATCH_ENDSCREEN_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');
  const directWatchCard = read('docs/audit/FILTERTUBE_DIRECT_WATCH_CARD_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');
  const compactAutoplay = read('docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');

  assert.match(doc, /YouTube SPA Runtime Optimization Boundary - 2026-05-30/);
  assert.match(doc, /This addendum pulls the current lag-relevant lifecycle audit into the global\s+implementation gate/);
  assert.match(doc, /ASCII runtime optimization boundary flow diagram: present/);
  assert.match(doc, /Mermaid runtime optimization boundary flow diagram: present/);
  assert.match(doc, /YouTube SPA runtime optimization boundary rows: 8/);
  assert.match(doc, /YouTube SPA hot timer lifecycle rows classified: 33/);
  assert.match(doc, /YouTube SPA desktop residual lifecycle rows classified: 29/);
  assert.match(doc, /YouTube SPA mobile\/coarse eager lifecycle rows classified: 4/);
  assert.match(doc, /implementation-ready YouTube SPA runtime optimization rows: 0/);
  assert.match(doc, /runtime YouTube SPA optimization patch approval: NO-GO/);
  assert.match(doc, /runtime whitelist cache optimization approval: NO-GO/);
  assert.match(doc, /runtime JSON-first promotion approval: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /Home\/Shorts Quick-Block Placement Preflight - 2026-05-31/);
  assert.match(doc, /now carries a Home\/Shorts placement preflight for the missing quick-cross risk/);
  assert.match(doc, /pins 6 placement rows: nested Shorts target detection, outer-host promotion,\s+renderable anchor selection, desktop hover-lazy placement, mobile\/coarse\s+force-visible placement, and release gating/);
  assert.match(doc, /desktop startup\/navigation\/mutation no longer run eager\s+full-document sweeps/);
  assert.match(doc, /desktop Home\/Shorts always-visible startup status: NOT_CURRENT_BEHAVIOR/);
  assert.match(doc, /live installed Home\/Shorts placement proof: NO-GO/);
  assert.match(doc, /quick-block placement behavior-change approval: NO-GO/);
  assert.match(quickBlockHover, /Home\/Shorts Quick-Cross Placement Preflight - 2026-05-31/);
  assert.match(quickBlockHover, /Home\/Shorts quick-cross placement preflight rows: 6/);
  assert.match(quickBlockHover, /runtime behavior changed by this preflight: no/);
  assert.match(doc, /Watch\/player route convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/watch-player-control-authority-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins `\/next`, `\/player`, comments, watch recommendations,\s+watch playlist panels, player overlays, autoplay endpoints, selected-row\s+side effects, whitelist scaffolding, and fullscreen quiet behavior into one\s+audit-only convergence boundary/);
  assert.match(doc, /It pins 8 watch\/player convergence rows,\s+0 implementation-ready watch\/player convergence rows/);
  assert.match(doc, /route-scoped `\/next`\s+optimization, metadata-only `\/player` optimization, selected-row JSON-first\s+promotion, watch whitelist\/fullscreen no-work approval, and\s+`watchSurfaceControlAuthority` implementation at `NO-GO`/);
  assert.match(doc, /Storage\/cache key convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_STORAGE_KEY_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/storage-key-authority-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins compiler\/invalidation drift, content bridge map-only\s+refresh, force-reprocess coalescing, StateManager reload drift, shared\s+settings load, background map dirty-state, profile\/import\/Nanah revision\s+gaps, stats dashboard reload drift, settings-refresh evidence packets, and\s+whitelist-cache hot paths into one audit-only convergence boundary/);
  assert.match(doc, /It pins\s+10 storage\/cache convergence rows, 0 implementation-ready storage\/cache\s+convergence rows/);
  assert.match(doc, /map-only pruning, compiled-cache invalidation changes,\s+whitelist\/cache optimization, JSON-first promotion, and\s+`storageKeyAuthority` implementation at `NO-GO`/);
  assert.match(doc, /Message side-effect convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/message-side-effect-register-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins background receiver trust split, settings cache\s+broadcast, refresh\/DOM rerun broadcast, page-world request ownership,\s+learned identity writes, rule mutation storage\/backup\/refresh, stats\s+storage, script\/tab\/network authority, import\/Nanah\/backup trust, and\s+negative spoof fixture gaps into one audit-only convergence boundary/);
  assert.match(doc, /It\s+pins 10 message side-effect convergence rows, 0 implementation-ready\s+message side-effect convergence rows/);
  assert.match(doc, /message trust hardening, rule mutation\s+optimization, storage\/cache optimization, JSON-first promotion, release\s+claims, and `messageSideEffectAuthority` implementation at `NO-GO`/);
  assert.match(doc, /Rule mutation convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/rule-mutation-entrypoint-authority-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins StateManager mode-inferred rows, background sender split,\s+quick\/menu action payloads, Filter All comment scope, list-mode transfer\s+copy policy, batch whitelist import mode behavior, managed child direct\s+writes, import\/Nanah apply paths, storage\/cache\/backup\/refresh fanout, and\s+learned identity rule inputs into one audit-only convergence boundary/);
  assert.match(doc, /pins 10 rule mutation convergence rows, 0 implementation-ready rule mutation\s+convergence rows/);
  assert.match(doc, /rule mutation implementation, blocklist\/whitelist mutation optimization,\s+quick\/menu rewrites, Filter All optimization, import\/Nanah mutation\s+optimization, JSON-first promotion, release claims, and\s+`ruleMutationAuthority` implementation at `NO-GO`/);
  assert.match(doc, /Content-filter route\/surface convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(doc.includes('tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(doc.includes('tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins field semantics, field-effect manifests, JSON renderer\s+content\/category decisions, metadata fetch side effects, DOM fallback\s+route\/surface effects, watch selected-row risks, whitelist pending-hide\s+no-work gates, comment exclusions, YTM\/Kids\/native parity gaps, and missing\s+no-work artifacts into one audit-only convergence boundary/);
  assert.match(doc, /It pins 10\s+content-filter route\/surface convergence rows, 12 field-effect route\/surface\s+rows, 12 no-work budget rows, 9 route\/surface classes, 7 cheap no-work gate\s+families, 6 known over-work gap families, 0 implementation-ready\s+content-filter convergence rows/);
  assert.match(doc, /JSON-first content-filter\s+authority, DOM fallback deletion, metadata fetch pruning, watch\/YTM\/Kids\s+parity, release claims, and `contentFilterRouteSurfaceConvergenceAuthority`\s+implementation at `NO-GO`/);
  assert.match(doc, /Settings\/profile\/list-mode convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md'));
  assert.ok(doc.includes('tests/runtime/settings-mode-source-effect-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins visible row versus compiled source drift, empty\s+blocklist versus empty whitelist policy, Main\/Kids profile selection,\s+`syncKidsToMain` merge behavior, list-mode transition storage, seed\/injector\s+JSON admission, JSON decision comment exceptions, DOM pending\/action gates,\s+content-control active-work, and refresh\/cache revision fanout into one\s+audit-only convergence boundary/);
  assert.match(doc, /pins 10 settings\/profile\/list-mode\s+convergence rows, 0 implementation-ready settings\/profile\/list-mode\s+convergence rows/);
  assert.match(doc, /settings-mode implementation, alias cleanup, simultaneous allow\/block mode,\s+whitelist\/cache optimization, JSON-first promotion, refresh pruning, release\s+claims, and `settingsModeSourceEffectAuthority` implementation at `NO-GO`/);
  assert.match(doc, /Selector convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/selector-authority-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins selector instance census, page-runtime dominance,\s+YouTube DOM contract ownership, dynamic\/caller-owned selectors,\s+content_bridge hot-file selectors, DOM fallback hot-file selectors,\s+quick\/menu release hot-path selectors, watch\/comment\/playlist boundaries,\s+extension UI mutation selectors, and legacy\/inventory boundaries into one\s+audit-only convergence boundary/);
  assert.match(doc, /It pins 10 selector convergence rows,\s+0 implementation-ready selector convergence rows/);
  assert.match(doc, /selector rewrites, DOM fallback selector pruning,\s+quick\/menu selector rewrites, watch-shell selector behavior changes, legacy\s+layout reactivation, JSON-first selector promotion, release claims, and\s+`selectorAuthority` implementation at `NO-GO`/);
  assert.match(doc, /JSON path convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(doc.includes('tests/runtime/json-path-authority-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins documentation\/runtime authority split, dot-path syntax,\s+executable JSON owner flow, runtime coverage classes, section coverage\s+classes, effective `FILTER_RULES` runtime path rows, field-effect gaps,\s+JSON-first readiness promotion blockers, method semantic dependency, and\s+missing runtime authority symbols into one audit-only convergence boundary/);
  assert.match(doc, /It pins 10 JSON path convergence rows, 0 implementation-ready JSON path\s+convergence rows/);
  assert.match(doc, /440 effective\s+runtime path rows, 20 section rows, 5 unsupported\/direct-gap section rows,\s+13 blocked JSON-first promotion rows/);
  assert.match(doc, /renderer promotion,\s+JSON-first behavior, DOM fallback deletion, no-work optimization,\s+whitelist\/cache optimization, release claims, and `jsonPathAuthority`\s+implementation at `NO-GO`/);
  assert.match(doc, /Method semantic convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(doc.includes('tests/runtime/all-callable-index-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins the repo-wide callable census, selected method semantic\s+triage rows, required semantic fields, parser visibility debt,\s+whitelist\/cache affected-callable packet gaps, JSON-first method blockers,\s+first optimization source-locus blockers, and missing runtime authority\s+symbols into one audit-only convergence boundary/);
  assert.match(doc, /It pins 10 method semantic\s+convergence rows, 0 implementation-ready method semantic convergence rows/);
  assert.match(doc, /method deletion, method\s+merging, affected-callable closure, whitelist\/cache method optimization,\s+JSON-first method promotion, release claims, and\s+`methodSemanticCoverageComplete` implementation at `NO-GO`/);
  assert.match(doc, /Runtime lifecycle convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins lifecycle primitive census, listener add\/remove shape,\s+observer observe\/release shape, timer\/frame shape, hot YouTube SPA owners,\s+mode\/surface observer budgets, teardown\/effect-budget gaps, menu\/overlay\s+timing, method\/JSON dependencies, and missing runtime authority symbols into\s+one audit-only convergence boundary/);
  assert.match(doc, /It pins 10 runtime lifecycle convergence\s+rows, 0 implementation-ready runtime lifecycle convergence rows, 524 tracked\s+lifecycle primitive instances, 469 install-or-schedule rows, 55 explicit\s+teardown rows, 16 hot YouTube SPA lifecycle owner rows, 33 YouTube SPA\s+immediate\/short hot timer rows/);
  assert.match(doc, /observer\/listener\/timer\/frame cleanup, route teardown,\s+native-overlay pause rewrites, whitelist\/cache optimization, JSON-first\s+promotion, release claims, and `lifecycleEffectBudget` implementation at\s+`NO-GO`/);
  assert.match(doc, /Diagnostic logging convergence boundary - 2026-05-30/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(doc.includes('tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs'));
  assert.match(doc, /This addendum joins console inventory, diagnostic source-flow rows, debug\s+gate and relay ownership, direct console paths, identity\/import privacy\s+exposure, JSON decision diagnostics, build\/release diagnostics, metric\s+replacement blockers, and missing runtime authority symbols into one\s+audit-only convergence boundary/);
  assert.match(doc, /It pins 10 diagnostic logging convergence\s+rows, 21 diagnostic logging policy source files, 419 active console\s+callsites, 9 diagnostic source-flow rows, 0 implementation-ready diagnostic\s+logging convergence rows/);
  assert.match(doc, /keeps logging cleanup, diagnostic metric replacement, privacy\/redaction\s+promotion, whitelist\/cache optimization, JSON-first promotion, release\s+claims, and `diagnosticLoggingConvergenceAuthority` implementation at\s+`NO-GO`/);
  assert.match(doc, /Production console gate coverage reconciliation - 2026-05-31/);
  assert.match(doc, /pins 3 runtime console\s+gate owner files \(`js\/background\.js`, `js\/content\/dom_fallback\.js`, and\s+`js\/content_bridge\.js`\)/);
  assert.match(doc, /background `log\/debug\/info` gating, isolated-world\s+DOM fallback `log\/debug\/info` gating, content-bridge backup `log\/debug`\s+gating/);
  assert.match(doc, /no `warn\/error` suppression, no MAIN-world global console override,\s+no extension-UI cleanup approval, no live installed-tab console sampling\s+proof, and no release\/public-claim proof/);
  assert.match(doc, /route\/mode console budgets, whitelist\/cache optimization, JSON-first\s+promotion, release claims, and `diagnosticLoggingConvergenceAuthority`\s+implementation at `NO-GO`/);
  assert.match(doc, /Production console residual hot-path preflight - 2026-05-31/);
  assert.match(doc, /separates textual console callsites from execution-time\s+production console work/);
  assert.match(doc, /pins 7 residual preflight rows, 210 selected\s+routine `log\/debug\/info` token rows, 126 textual content-bridge routine rows/);
  assert.match(doc, /1 content-bridge top-level executed routine\s+row before that backup gate, 124 content-bridge function-body rows that run\s+through post-install entrypoints/);
  assert.match(doc, /62 background routine rows behind the\s+startup gate, 135 manifest-isolated routine rows behind the `dom_fallback`\s+gate, 7 MAIN-world local-debug rows, and 6 extension-UI\/inactive-layout rows/);
  assert.match(doc, /keeps live installed-tab console sampling,\s+route\/mode console budgets, release cleanup, whitelist\/cache optimization,\s+JSON-first promotion, release claims, and\s+`diagnosticLoggingConvergenceAuthority` implementation at `NO-GO`/);
  assert.match(doc, /Installed Chrome unpacked path parity boundary - 2026-05-31/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_INSTALLED_CHROME_UNPACKED_PATH_PARITY_CURRENT_BEHAVIOR_2026-05-30.md'));
  assert.match(doc, /pins extension id `gkgjigdfdccckblmglboobikfcpeelio`, Chrome Default\s+profile path `\/Users\/devanshvarshney\/FilterTube`, matching workspace root/);
  assert.match(doc, /no CRX-style copy under `Default\/Extensions`, Default-profile local extension\s+storage presence, service worker version `3\.3\.2`, and `incognito: null`/);
  assert.match(doc, /Default-profile source-path owner question is `GO_PATH`, while\s+already-open visible-tab injected byte freshness, incognito runtime\s+availability, stale open-tab cache cleanup, live `Kully B & Gussy G - Topic`\s+negative fixture proof, live smoke acceptance, release\/public-claim use, and\s+broad audit completion remain `NO-GO`/);
  assert.match(doc, /Runtime behavior changed by this\s+addendum: no/);
  assert.match(doc, /Visible installed-tab byte parity preflight boundary - 2026-05-31/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_VISIBLE_INSTALLED_TAB_BYTE_PARITY_PREFLIGHT_CURRENT_BEHAVIOR_2026-05-31.md'));
  assert.match(doc, /makes the remaining installed-tab byte\/reload proof a\s+first-class release gate/);
  assert.match(doc, /pins the Chrome runtime parity\s+set to 17 unique files/);
  assert.match(doc, /service worker `js\/background\.js`, MAIN declarative\s+`js\/seed\.js`, the ISOLATED content-script chain/);
  assert.match(doc, /visible-tab byte hashes or runtime markers, service-worker reload timestamp,\s+stale open-tab status, incognito availability, automation-profile exclusion,\s+release\/public-claim use, and broad audit completion remain `NO-GO`/);
  assert.match(visibleInstalledTabParity, /Status: audit-only preflight contract\. Runtime behavior changed: no/);
  assert.match(visibleInstalledTabParity, /Unique runtime files in this parity set: 17/);
  assert.match(visibleInstalledTabParity, /`js\/background\.js`/);
  assert.match(visibleInstalledTabParity, /`js\/content_bridge\.js`/);
  assert.match(visibleInstalledTabParity, /`js\/injector\.js`/);
  assert.match(visibleInstalledTabParity, /`js\/filter_logic\.js`/);
  assert.match(visibleInstalledTabParity, /`profile_owner`/);
  assert.match(visibleInstalledTabParity, /`target_url`/);
  assert.match(visibleInstalledTabParity, /`service_worker_source_hash`/);
  assert.match(visibleInstalledTabParity, /`content_script_hashes`/);
  assert.match(visibleInstalledTabParity, /`runtime_injection_markers`/);
  assert.match(visibleInstalledTabParity, /`reload_timestamp`/);
  assert.match(visibleInstalledTabParity, /`automation_profile_excluded`/);
  assert.match(visibleInstalledTabParity, /Path owner: GO_PATH/);
  assert.match(visibleInstalledTabParity, /NO_GO_VISIBLE_TAB/);
  assert.match(visibleInstalledTabParity, /NO_GO_RELOAD/);
  assert.match(visibleInstalledTabParity, /Connected Chrome Tab Inventory Recheck - 2026-05-31/);
  assert.match(visibleInstalledTabParity, /connected Chrome endpoint reachable: yes/);
  assert.match(visibleInstalledTabParity, /connected open top-level tabs observed: 45/);
  assert.match(visibleInstalledTabParity, /connected relevant YouTube\/FilterTube tabs observed: 0/);
  assert.match(visibleInstalledTabParity, /raw tab titles or URLs committed: no/);
  assert.match(visibleInstalledTabParity, /tab claimed or mutated: no/);
  assert.match(visibleInstalledTabParity, /visible-tab byte parity from connector recheck: NO-GO/);
  assert.match(visibleInstalledTabParity, /production console sampling from connector recheck: NO-GO/);
  assert.match(doc, /Connected Chrome tab inventory recheck boundary - 2026-05-31/);
  assert.match(doc, /returned a\s+read-only tab inventory, but exposed 0 relevant YouTube\/FilterTube tabs out\s+of 45 open top-level tabs/);
  assert.match(doc, /committed no raw unrelated tab titles\/URLs/);
  assert.match(doc, /visible-tab byte parity, live SPA route rows, production\s+console runtime sampling, release\/public-claim use, and broad audit\s+completion remain `NO-GO`/);
  assert.match(doc, /Store feedback engagement\/end-screen readiness boundary - 2026-05-31/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_WATCH_ENDSCREEN_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_DIRECT_WATCH_CARD_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.match(doc, /user\/store feedback about recommendation degradation and\s+end-screen video-wall leaks into the global implementation gate/);
  assert.match(doc, /It does not\s+prove YouTube ranking causality/);
  assert.match(doc, /direct and nested `endScreenVideoRenderer` JSON rows use `BASE_VIDEO_RULES`,\s+while `compactAutoplayRenderer`, endpoint-only `autoplayVideo`\/`nextButtonVideo`\s+\/ `previousButtonVideo`, direct watch-card child rows, player DOM wall\/card\s+overlays, direct identity fetches, synthetic playlist\/player clicks, media\s+pause\/stop paths, and recommendation-observable side effects still lack one\s+shared authority/);
  assert.match(doc, /End-screen behavior changes, recommendation side-effect\s+pruning, JSON-first promotion, whitelist\/cache optimization, DOM fallback\s+pruning, release\/public-claim use, and broad audit completion remain\s+`NO-GO`/);

  for (const phrase of [
    '33 YouTube SPA immediate/short hot timer rows',
    '4 mobile/coarse eager rows',
    '29 desktop hover/fine residual rows',
    'live installed-byte parity',
    'route/list-mode/no-work/side-effect fixtures'
  ]) {
    assert.ok(doc.includes(phrase), `readiness boundary missing ${phrase}`);
  }

  assert.match(lifecycle, /YouTube SPA immediate-short predicate crosswalk rows: 33/);
  assert.match(lifecycle, /YouTube SPA desktop residual class-closure hot timer rows: 29/);
  assert.match(lifecycle, /source-admitted desktop hover\/fine eager hot timer rows: 0/);
  assert.match(priority, /implementation-ready candidates: 0/);
  assert.match(priority, /live evidence execution blocker rows: 8/);
  assert.match(whitelistCache, /runtime whitelist\/cache optimization approvals: 0/);
  assert.match(whitelistCache, /not completion proof for whitelist\/cache optimization/);
  assert.match(releaseLag, /release lag fix/);
  assert.match(releaseLag, /runtime behavior changed: no/);
  assert.match(messageSideEffect, /message side-effect convergence rows: 10/);
  assert.match(messageSideEffect, /implementation-ready message side-effect convergence rows: 0/);
  assert.match(messageSideEffect, /message side-effect implementation approval: NO-GO/);
  assert.match(messageSideEffect, /JSON-first promotion approval: NO-GO/);
  assert.match(ruleMutation, /rule mutation convergence rows: 10/);
  assert.match(ruleMutation, /implementation-ready rule mutation convergence rows: 0/);
  assert.match(ruleMutation, /rule mutation implementation approval: NO-GO/);
  assert.match(ruleMutation, /blocklist\/whitelist mutation optimization approval: NO-GO/);
  assert.match(contentFilterRoute, /content-filter route\/surface convergence rows: 10/);
  assert.match(contentFilterRoute, /implementation-ready content-filter convergence rows: 0/);
  assert.match(contentFilterRoute, /content-filter JSON-first route authority: NO-GO/);
  assert.match(contentFilterRoute, /contentFilterRouteSurfaceConvergenceAuthority/);
  assert.match(contentFilterNoWork, /content-filter route\/surface convergence rows: 10/);
  assert.match(contentFilterNoWork, /content-filter no-work authority from convergence: NO-GO/);
  assert.match(settingsSourceEffect, /settings\/profile\/list-mode convergence rows: 10/);
  assert.match(settingsSourceEffect, /implementation-ready settings\/profile\/list-mode convergence rows: 0/);
  assert.match(settingsSourceEffect, /settingsModeSourceEffectAuthority product source symbol: absent/);
  assert.match(settingsSourceEffect, /settings-mode implementation approval: NO-GO/);
  assert.match(settingsSourceEffect, /settings-mode JSON-first promotion approval: NO-GO/);
  assert.match(selectorAuthority, /selector convergence rows: 10/);
  assert.match(selectorAuthority, /implementation-ready selector convergence rows: 0/);
  assert.match(selectorAuthority, /selectorAuthority product source symbol: absent/);
  assert.match(selectorAuthority, /selector rewrite approval: NO-GO/);
  assert.match(selectorAuthority, /quick\/menu selector rewrite approval: NO-GO/);
  assert.match(jsonPathAuthority, /JSON path convergence rows: 10/);
  assert.match(jsonPathAuthority, /implementation-ready JSON path convergence rows: 0/);
  assert.match(jsonPathAuthority, /jsonPathAuthority product source symbol: absent/);
  assert.match(jsonPathAuthority, /JSON-first behavior approval: NO-GO/);
  assert.match(jsonPathAuthority, /DOM fallback deletion approval: NO-GO/);
  assert.match(methodSemanticGap, /method semantic convergence rows: 10/);
  assert.match(methodSemanticGap, /implementation-ready method semantic convergence rows: 0/);
  assert.match(methodSemanticGap, /methodSemanticCoverageComplete product source symbol: absent/);
  assert.match(methodSemanticGap, /method deletion approval: NO-GO/);
  assert.match(methodSemanticGap, /JSON-first method promotion approval: NO-GO/);
  assert.match(lifecycle, /runtime lifecycle convergence rows: 10/);
  assert.match(lifecycle, /implementation-ready runtime lifecycle convergence rows: 0/);
  assert.match(lifecycle, /tracked lifecycle primitive instances: 524/);
  assert.match(lifecycle, /runtime lifecycle cleanup approval: NO-GO/);
  assert.match(lifecycle, /lifecycleEffectBudget product source symbol: absent/);
  assert.match(diagnosticPolicy, /diagnostic logging convergence rows: 10/);
  assert.match(diagnosticPolicy, /implementation-ready diagnostic logging convergence rows: 0/);
  assert.match(diagnosticPolicy, /diagnostic logging cleanup approval: NO-GO/);
  assert.match(diagnosticPolicy, /diagnosticLoggingConvergenceAuthority/);
  assert.match(installedChromePath, /installed_default_profile_unpacked_path/);
  assert.match(installedChromePath, /Chrome Default profile extension metadata points\s+`gkgjigdfdccckblmglboobikfcpeelio` at `\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(installedChromePath, /workspace_path_match/);
  assert.match(installedChromePath, /incognito_runtime_availability/);
  assert.match(installedChromePath, /already_open_tab_injected_byte_parity/);
  assert.match(installedChromePath, /live_kully_gussy_negative_fixture/);
  assert.match(installedChromePath, /GO_PATH/);
  assert.match(installedChromePath, /NO_GO_VISIBLE_TAB/);
  assert.match(engagementBudget, /This does not prove YouTube recommendation behavior/);
  assert.match(engagementBudget, /Mozilla review feedback is now pinned as an audit input/);
  assert.match(engagementBudget, /Direct `endScreenVideoRenderer` filtering is source-supported,\s+but player DOM\s+video walls, compact\/autoplay variants, current-watch skip logic, playlist guard\s+clicks, direct identity fetches, and media pause\/stop paths still lack one\s+shared owner\/budget contract/);
  assert.match(watchEndscreen, /The store feedback that blocked videos can reappear in the end-screen video\s+wall remains a valid product risk/);
  assert.match(watchEndscreen, /Direct and nested `endScreenVideoRenderer` JSON rows are supported by\s+`BASE_VIDEO_RULES`/);
  assert.match(watchEndscreen, /`compactAutoplayRenderer` still has no direct JSON rule/);
  assert.match(watchEndscreen, /Rendered player DOM video-wall and end-card overlays are broad CSS toggle\s+targets, not per-card blocklist or whitelist decisions/);
  assert.match(watchEndscreen, /per-card decision \+ sibling-visible \+ no-engagement proof/);
  assert.match(directWatchCard, /watchRecommendationRendererAuthority/);
  assert.match(directWatchCard, /sibling-visible proof, and no-rule work budget/);
  assert.match(compactAutoplay, /`compactAutoplayRenderer` is not covered by direct JSON filtering today/);
  assert.match(compactAutoplay, /has no committed extracted capture fixture/);
}

test('current product source does not yet define the future authority control points', () => {
  const sourceFiles = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'));
  const combined = sourceFiles.map(read).join('\n');

  for (const token of [
    'compiledRuleState',
    'contentPredicateAuthority',
    'contentFilterRouteSurfaceConvergenceAuthority',
    'contentFilterRouteSurfaceConvergenceReport',
    'contentFilterRouteSurfaceNoWorkBudget',
    'keywordMatchAuthority',
    'statsSideEffectAuthority',
    'backupExportAuthority',
    'profileViewingAuthority',
    'watchSurfaceControlAuthority',
    'endpointPolicy',
    'networkAuthority',
    'externalNavigationAuthority',
    'messageSideEffectAuthority',
    'releasePackageParity',
    'nativeRuntimeSyncAuthority',
    'lifecycleRegistry',
    'mutationContract',
    'settingsRevision',
    'trustedUi',
    'allowedYoutubeContentScript',
    'ownedPageWorldRequest',
    'backgroundInternal',
    'promptCoordinator',
    'manifestAuthority',
    'securityLockAuthority',
    'ruleMutationAuthority',
    'settingsModeSourceEffectAuthority',
    'settingsSourceEffectDecision',
    'modeSurfaceEffectAuthority',
    'hideRestoreAuthority',
    'selectorAuthority',
    'selectorEffectReport',
    'selectorTargetDecision',
    'selectorRouteSurfaceAuthority',
    'selectorRestoreAuthority',
    'storageKeyAuthority',
    'jsonPathAuthority',
    'rulePathManifest',
    'jsonPathProvenance',
    'jsonRuntimeCoverageAuthority',
    'rendererFieldCoverageClass',
    'jsonFieldEffectAuthority',
    'jsonSectionCoverageDecision',
    'documentedJsonSectionAuthority',
    'jsonFirstFilterReadinessGate',
    'jsonFirstPathSyntaxManifest',
    'jsonFirstOptimizationBudget',
    'methodSemanticCoverageComplete',
    'callableBehaviorProofReady',
    'behaviorPatchMayProceed',
    'methodSemanticAuthority',
    'callableEffectReport',
    'callableNoWorkBudget',
    'callableTeardownRegistry',
    'lifecycleEffectBudget',
    'lifecycleOwnerDecision',
    'routeSurfaceLifecycleScope',
    'fullscreenPauseAuthority',
    'nativeOverlayPauseAuthority',
    'noRuleLifecycleCounter',
    'lifecycleTeardownAuthority',
    'listenerLifecycleAuthority',
    'observerLifecycleAuthority',
    'timerLifecycleAuthority',
    'routeTeardownAuthority',
    'diagnosticLoggingConvergenceAuthority',
    'diagnosticLoggingConvergenceReport',
    'diagnosticLogWorkBudget',
    'diagnosticMetricReplacementAuthority',
    'diagnosticPrivacyRedactionAuthority'
  ]) {
    assert.doesNotMatch(combined, new RegExp(`\\b${token}\\b`), `${token} should not be implemented in product source yet`);
  }
});

test('minimum behavior-patch gate names concrete P0 fixture families', () => {
  const doc = read(gateDocPath);

  for (const fixture of [
    'empty_blocklist_desktop_home_no_work',
    'empty_blocklist_mobile_home_no_work',
    'empty_blocklist_watch_no_player_mutation',
    'disabled_extension_no_mutation',
    'seed_search_no_rule_pass_through',
    'seed_browse_mobile_home_no_rule_pass_through',
    'seed_next_watch_no_rule_pass_through',
    'seed_player_metadata_only',
    'seed_guide_no_rule_pass_through',
    'network_authority_counts_all_tracked_fetch_xhr_open_surfaces',
    'network_authority_release_note_fetches_are_extension_resource_only',
    'network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason',
    'network_authority_kids_identity_fetch_requires_kids_surface_reason',
    'network_authority_channel_detail_fetch_rejects_untrusted_sender',
    'network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason',
    'network_authority_subscription_import_fetch_requires_explicit_user_import',
    'network_authority_seed_interception_no_rule_passes_through_without_parse',
    'network_authority_fetch_credentials_policy_is_declared_per_owner',
    'network_authority_website_remotes_are_website_only_claims',
    'network_authority_external_tab_open_urls_are_allowlisted',
    'network_authority_raw_capture_urls_never_become_runtime_fetch_targets',
    'external_navigation_authority_counts_extension_runtime_open_surfaces',
    'external_navigation_authority_open_whats_new_rejects_caller_supplied_url',
    'external_navigation_authority_release_banner_fallbacks_use_allowlisted_extension_url',
    'external_navigation_authority_popup_internal_opens_use_runtime_geturl',
    'external_navigation_authority_kofi_link_is_fixed_and_user_initiated',
    'external_navigation_authority_subscription_import_tab_uses_fixed_youtube_channels_url',
    'external_navigation_authority_extension_target_blank_links_have_noopener_policy',
    'external_navigation_authority_website_external_links_share_one_component_policy',
    'external_navigation_authority_public_link_data_is_classified_by_url_class',
    'external_navigation_authority_raw_capture_urls_never_become_open_targets',
    'release_package_parity_build_common_dirs_are_explicit',
    'release_package_parity_common_files_are_explicit',
    'release_package_parity_quarantined_css_is_packaged_but_not_manifest_loaded',
    'release_package_parity_build_has_no_committed_package_manifest',
    'release_package_parity_generated_shells_have_source_output_freshness_manifest',
    'release_package_parity_build_does_not_mutate_readme_during_package_dry_run',
    'release_package_parity_browser_manifest_validation_covers_permissions_and_resources',
    'release_package_parity_github_release_is_draft_until_all_assets_upload',
    'release_package_parity_mobile_artifacts_have_checksum_and_claim_gate',
    'release_package_parity_raw_captures_never_enter_package_contents',
    'native_runtime_sync_public_wrapper_delegates_to_app_sync_script',
    'native_runtime_sync_manifest_sources_exist_and_are_public_repo_owned',
    'native_runtime_sync_manifest_destinations_are_byte_identical_after_sync',
    'native_runtime_sync_generated_main_assets_are_not_source_authority',
    'native_runtime_sync_ios_kids_runtime_documents_intentional_divergence',
    'native_runtime_sync_extension_source_mirror_drift_is_detected',
    'native_runtime_sync_android_has_prebuild_freshness_but_ios_needs_release_gate',
    'native_runtime_sync_raw_root_captures_never_become_app_runtime_inputs',
    'native_runtime_sync_future_authority_token_is_absent_from_product_source',
    'content_predicate_enabled_empty_category_is_inactive',
    'content_predicate_blank_upload_date_is_inactive',
    'content_predicate_zero_duration_longer_is_inactive',
    'content_predicate_blank_duration_save_clears_old_threshold',
    'content_predicate_route_scope_home_does_not_scan_watch_controls',
    'content_predicate_route_scope_watch_does_not_scan_home_feed_controls',
    'content_predicate_category_storage_change_refreshes_runtime',
    'content_predicate_kids_and_main_are_independent',
    'content_predicate_boolean_controls_are_route_scoped',
    'content_predicate_metadata_fetch_requires_valid_pending_reason',
    'keyword_non_exact_substring_policy_is_explicit',
    'keyword_exact_unicode_boundary_matches_json_and_dom',
    'keyword_dom_normalized_fallback_requires_both_boundaries',
    'keyword_comment_serialized_rules_are_reconstructed',
    'keyword_global_rules_do_not_affect_comments_unless_enabled',
    'keyword_channel_derived_metadata_round_trips',
    'keyword_channel_derived_comments_policy_round_trips',
    'keyword_kids_to_main_sync_preserves_source_and_action',
    'keyword_whitelist_keyword_miss_reports_fail_closed_reason',
    'keyword_import_legacy_compiled_exactness_round_trips',
    'stats_rejects_untrusted_record_time_saved',
    'stats_rejects_negative_or_nonfinite_seconds',
    'stats_records_only_structured_hide_decisions',
    'stats_restore_decrements_only_prior_counted_hide',
    'stats_skipstats_does_not_pause_media_without_side_effect_reason',
    'stats_surface_scope_main_and_kids_are_separate',
    'stats_dashboard_refreshes_on_stats_by_surface_change',
    'stats_storage_write_is_batched_or_debounced',
    'stats_legacy_background_path_cannot_override_surface_stats',
    'stats_no_rule_hide_path_does_not_increment_dashboard',
    'backup_schedule_rejects_untrusted_sender_or_non_internal_actor',
    'backup_schedule_clamps_delay_to_known_range',
    'backup_schedule_dedupes_same_mutation_trigger',
    'backup_auto_encryption_policy_matches_manual_export_policy',
    'backup_auto_missing_session_pin_reports_visible_skip',
    'backup_io_and_background_paths_share_one_filename_policy',
    'backup_rotation_policy_does_not_claim_file_deletion_without_remove_proof',
    'backup_directory_probe_does_not_write_test_file_per_backup',
    'backup_manual_export_child_gate_and_master_pin_gate_are_consistent',
    'backup_import_encrypted_and_plain_share_target_profile_contract',
    'backup_trusted_nanah_restore_requires_explicit_same_device_choice',
    'backup_after_import_or_nanah_apply_refreshes_compiled_runtime_revision',
    'profile_switch_invalidates_compiled_main_and_kids_by_revision',
    'profile_switch_rejects_locked_profile_without_session_unlock',
    'profile_viewing_space_main_denied_blocks_main_runtime_compile',
    'profile_viewing_space_kids_denied_blocks_kids_runtime_compile',
    'profile_viewing_space_cannot_disable_both_surfaces',
    'child_profile_cannot_mutate_parent_policy_from_child_surface',
    'parent_managed_child_edit_reports_target_profile_and_surface',
    'managed_child_edit_refreshes_only_target_surface_or_reports_broadcast_scope',
    'sync_kids_to_main_requires_matching_modes_and_profile_authority',
    'import_nanah_profile_apply_updates_profile_viewing_authority_revision',
    'watch_controls_background_invalidation_covers_all_compiled_keys',
    'watch_controls_content_refresh_is_derived_from_background_schema',
    'watch_next_no_rule_pass_through_without_json_rewrite',
    'watch_player_no_rule_metadata_only_without_recommendation_mutation',
    'watch_comments_hide_all_uses_comment_continuation_rewrite_only_for_comments',
    'watch_comments_keyword_filter_does_not_hide_non_comment_watch_scaffolding',
    'watch_sidebar_toggle_is_route_scoped_to_watch',
    'watch_playlist_panel_toggle_does_not_disable_playlist_card_identity_fixtures',
    'watch_endscreen_videowall_json_and_dom_have_separate_fixtures',
    'watch_endscreen_cards_do_not_depend_on_broad_movie_player_hide',
    'watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible',
    'watch_fullscreen_pauses_non_player_dom_work',
    'capture_traceability_main_watch_end_screen_dom_wall',
    'capture_traceability_main_next_compact_autoplay_renderer',
    'capture_traceability_main_search_no_rule_real_capture_pass_through',
    'capture_traceability_main_guide_no_rule_real_capture_pass_through',
    'capture_traceability_comment_continuation_append_reload_replace',
    'capture_traceability_reel_item_owner_identity',
    'capture_traceability_kids_browse_public_web_renderer_drift',
    'capture_traceability_ytm_dom_selector_guardrails',
    'capture_traceability_collab_homepage_avatar_stack_false_positive',
    'capture_traceability_post_menu_insertion_boundaries',
    'capture_traceability_playlist_json_creator_identity',
    'message_sender_matrix_background_actions_are_complete_current_inventory',
    'message_sender_matrix_page_messages_are_complete_current_inventory',
    'message_sender_matrix_main_world_receivers_are_complete_current_inventory',
    'message_sender_matrix_channel_mutations_have_uniform_sender_classes',
    'message_sender_matrix_ignored_captures_are_evidence_only',
    'message_sender_matrix_future_contract_has_side_effect_columns',
    'background_rejects_untrusted_apply_settings',
    'background_rejects_untrusted_script_injection',
    'background_rejects_untrusted_subscriptions_bridge_injection',
    'background_rejects_arbitrary_whats_new_url',
    'background_rejects_untrusted_channel_detail_fetch',
    'page_message_rejects_spoof_refresh',
    'page_message_rejects_spoof_video_channel_map',
    'page_message_requires_pending_collaborator_response',
    'quick_block_disabled_zero_lifecycle_work',
    'menu_disabled_zero_fallback_insertion',
    'native_overlay_quiet_mode_pauses_runtime',
    'fullscreen_pauses_non_player_runtime',
    'navigation_disconnects_route_observers',
    'hide_restore_shared_toggle_reports_writer_reason_and_marker',
    'hide_restore_direct_display_writes_have_registered_restorers',
    'hide_restore_disabled_extension_clears_all_filtertube_hide_markers',
    'hide_restore_css_control_rules_have_route_owner_and_disable_path',
    'hide_restore_members_only_restore_clears_members_marker_and_generic_marker',
    'hide_restore_open_app_button_hide_is_excluded_from_content_filter_stats',
    'hide_restore_pending_whitelist_restore_requires_identity_outcome',
    'hide_restore_recycled_card_cleanup_clears_identity_and_hide_markers',
    'hide_restore_shelf_title_restore_clears_specific_marker',
    'hide_restore_current_watch_owner_block_has_playback_side_effect_reason',
    'hide_restore_no_rule_path_does_not_leave_inline_display_none',
    'hide_restore_writer_registry_covers_toggle_visibility_direct_style_and_css',
    'selector_authority_global_card_selector_split_by_surface_route_action',
    'selector_authority_dom_fallback_no_rule_zero_card_scan',
    'selector_authority_quick_block_disabled_zero_selector_scan',
    'selector_authority_fallback_menu_uses_primary_menu_action_gate',
    'selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy',
    'selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture',
    'selector_authority_playlist_selected_row_preserves_current_watch_card',
    'selector_authority_kids_selectors_have_kids_surface_gate',
    'selector_authority_ytm_selectors_are_not_claimed_for_main_release_without_fixture',
    'selector_authority_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly',
    'selector_authority_inventory_rows_require_runtime_source_or_fixture_status',
    'selector_authority_raw_capture_extracts_minimal_committed_dom_fixture',
    'storage_key_background_invalidation_covers_compiler_dependencies',
    'storage_key_content_bridge_map_only_refresh_policy_is_named',
    'storage_key_state_manager_reload_keys_match_ui_claims',
    'storage_key_settings_shared_load_keys_are_classified',
    'storage_key_video_channel_map_change_has_cache_and_dom_policy',
    'storage_key_video_meta_map_change_has_cache_and_dom_policy',
    'storage_key_stats_by_surface_change_refreshes_dashboard',
    'storage_key_channel_map_only_change_does_not_force_dom_reprocess',
    'storage_key_read_path_write_reports_migration_revision',
    'storage_key_import_nanah_profile_write_reports_target_profile_revision',
    'storage_key_unknown_key_is_ignored_with_no_runtime_reprocess',
    'storage_key_raw_capture_evidence_never_becomes_storage_authority',
    'set_list_mode_copy_false_does_not_clear_blocklist',
    'apply_settings_payload_cannot_override_background_revision',
    'two_mutations_during_save_are_not_dropped',
    'v3_to_v4_preserves_modes_and_whitelists',
    'install_shows_one_prompt_owner',
    'update_prompt_priority_is_explicit',
    'replay_prompt_has_named_owner',
    'prompt_ack_rejects_wrong_sender_class',
    'whats_new_url_is_allowlisted',
    'prompt_overlay_fits_mobile_viewport',
    'current_manifest_version_has_release_note_entry',
    'chrome_manifest_main_world_seed_ready',
    'firefox_fallback_injection_reports_seed_ready',
    'opera_world_model_is_proven_or_not_claimed',
    'youtube_nocookie_host_scope_is_classified',
    'web_accessible_resources_are_allowlisted',
    'build_rejects_manifest_permission_drift',
    'permissions_map_to_trusted_sender_features',
    'locked_profile_rejects_set_list_mode',
    'locked_profile_rejects_add_whitelist_channel',
    'locked_profile_rejects_transfer_whitelist_to_blocklist',
    'child_profile_rejects_parent_policy_mutation',
    'content_script_rejects_add_filtered_channel_without_ui_owner',
    'nanah_apply_requires_target_profile_authority',
    'encrypted_import_preserves_target_profile_id',
    'sync_kids_to_main_setter_requires_unlocked_ui_or_background_authority',
    'rule_mutation_report_exists_for_state_manager_add_keyword',
    'rule_mutation_report_exists_for_state_manager_add_channel',
    'rule_mutation_report_exists_for_background_add_filtered_channel',
    'rule_mutation_report_exists_for_kids_block_and_whitelist',
    'rule_mutation_report_exists_for_list_mode_transfer',
    'rule_mutation_report_exists_for_managed_child_edit',
    'rule_mutation_report_exists_for_import_v3',
    'rule_mutation_report_exists_for_nanah_scoped_apply',
    'rule_mutation_report_exists_for_learned_identity_writes',
    'content_script_channel_add_requires_allowed_youtube_action',
    'page_world_identity_update_requires_owned_request'
  ]) {
    assert.ok(doc.includes(fixture), `missing gate fixture ${fixture}`);
  }
});

test('readiness gate is backed by existing fixture candidate and trust gap artifacts', () => {
  const gate = read(gateDocPath);
  const fixtureMatrix = read('docs/audit/FILTERTUBE_FIXTURE_CANDIDATE_MATRIX_2026-05-17.md');
  const captureTraceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const trustGap = read('docs/audit/FILTERTUBE_MESSAGE_TRUST_HARDENING_GAP_2026-05-18.md');
  const senderMatrix = read('docs/audit/FILTERTUBE_MESSAGE_SENDER_CLASS_MATRIX_2026-05-18.md');
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');

  for (const phrase of [
    'P0 Runtime No-Work Fixtures',
    'P0 Endpoint Fixtures',
    'P0 Lifecycle Fixtures',
    'P0 Settings / Mutation Fixtures'
  ]) {
    assert.ok(fixtureMatrix.includes(phrase), `fixture matrix must still define ${phrase}`);
  }

  assert.ok(trustGap.includes('Required Sender Classes'));
  assert.ok(trustGap.includes('Required Negative Fixture Names'));
  assert.ok(captureTraceability.includes('Current Committed Fixture Coverage'));
  assert.ok(captureTraceability.includes('Unextracted High-Priority Evidence'));
  assert.ok(captureTraceability.includes('Required Traceability Gates'));
  assert.ok(senderMatrix.includes('Current Background Runtime Message Inventory'));
  assert.ok(senderMatrix.includes('Current Page-World Message Inventory'));
  assert.ok(senderMatrix.includes('messageSenderClassMatrix'));
  assert.ok(objectiveLedger.includes('Completion is not proven'));
  assert.ok(objectiveLedger.includes('NOT READY for implementation changes'));
  assert.ok(objectiveLedger.includes('Raw capture corpus boundary'));
  assert.ok(objectiveLedger.includes('tests/runtime/fixtures/captures/'));
  assert.ok(convergence.includes('Improvement Areas That Look Safe To Pursue After Baseline Fixtures'));
  assert.ok(convergence.includes('Objective coverage ledger'));
  assert.ok(gate.includes('Safe next work means adding proof without changing runtime behavior'));
});

test('readiness gate blocks the exact broad cleanup paths called out in convergence', () => {
  const doc = read(gateDocPath);
  const convergence = read('docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md');

  for (const futureArea of [
    'compiledRuleState(settings, profile, surface)',
    'endpointPolicy(url, pageRoute, compiledRuleState)',
    'lifecycle registry',
    'settings mutation authority',
    'renderer gaps',
    'public release claim manifest'
  ]) {
    assert.ok(convergence.includes(futureArea), `convergence should still mention ${futureArea}`);
  }

  for (const unsafePath of [
    /deleting broad scans/,
    /broadening renderer rules/,
    /changing\s+empty whitelist behavior/,
    /merging allow\/block semantics/,
    /hardening only one\s+message path/
  ]) {
    assert.match(doc, unsafePath, `readiness gate should block ${unsafePath}`);
  }

  assert.match(doc, /assuming Firefox or Opera has Chrome's\s+MAIN-world startup behavior/);
});
