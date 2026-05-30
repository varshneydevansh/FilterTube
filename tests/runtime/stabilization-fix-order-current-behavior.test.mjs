import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

test('stabilization fix order is explicitly audit-only and keeps the implementation gate closed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit consolidation/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /tests 1391/);
  assert.match(doc, /pass 1391/);
  assert.match(doc, /The implementation gate remains closed/);
  assert.match(doc, /It is not permission to implement now/);
});

test('stabilization fix order preserves the split-authority root cause', () => {
  const doc = read(docPath);

  for (const token of [
    'seed endpoint predicates',
    'JSON renderer rules',
    'DOM fallback active checks',
    'quick-block lifecycle',
    'fallback menu lifecycle',
    'learned identity fetch/map writes',
    'background compile/cache invalidation',
    'StateManager/import/Nanah mutation paths',
    'compiledRuleState + endpointPolicy + lifecycleBudget + mutationAuthority'
  ]) {
    assert.ok(doc.includes(token), `missing split-authority token ${token}`);
  }
});

test('stabilization fix order carries five-way review convergence forward', () => {
  const doc = read(docPath);

  for (const row of [
    'JSON/renderers',
    'DOM/lifecycle',
    'Endpoint/network/performance',
    'Settings/mutation/security',
    'Release/static/native'
  ]) {
    assert.ok(doc.includes(row), `missing review slice ${row}`);
  }

  for (const concrete of [
    'compactPlaylistRenderer',
    'showSheetCommand',
    'direct watch-card renderers',
    'Members-only',
    'Fetch/XHR interception',
    'Nanah scoped apply',
    'native runtime sync'
  ]) {
    assert.ok(doc.includes(concrete), `missing concrete convergence item ${concrete}`);
  }
});

test('stabilization fix order lists the first safe clusters with proof artifacts', () => {
  const doc = read(docPath);

  for (const cluster of [
    'Empty install / disabled no-work',
    'XHR no-work boundary',
    'Page-global patch authority',
    'Startup injection readiness',
    'Seed initial global hook',
    'Document-start zero-flash boundary',
    'Settings refresh fanout',
    'Compiled cache authority',
    'Compiler parity',
    'Settings mode source/effect authority',
    'Lifecycle effect budget',
    'Page runtime owner/effect matrix',
    'Lifecycle teardown decision register',
    'Route/surface effect authority',
    'Source tier/effect authority',
    'Identity effect obligation crosswalk',
    'Tracked file obligation index',
    'Mode/surface effect matrix',
    'Identity information waterfall',
    'Identity waterfall assertion boundary',
    'Immediacy claim boundary',
    'Identity waterfall review convergence',
    'Identity work budget',
    'Identity resolver and fanout authority',
    'Identity resolver cache/dedupe',
    'DOM identity confidence authority',
    'Surface information availability',
    'Route identity decision index',
    'Identity flow diagram register',
    'Audit completion gap register',
    'Feature source dependency register',
    'Method semantic audit register',
    'JSON runtime coverage gaps',
    'Reference doc claim drift',
    'Performance claim evidence boundary',
    'Hide-decision pipeline',
    'Direct hide-writer register',
    'Synthetic event/action register',
    'Collaborator dialog lifecycle',
    'Compiled active-state split',
    'Endpoint policy',
    'Lifecycle overwork',
    'Visible-empty false hides',
    'FILTERTUBE_STALE_ALIAS_FALSE_HIDE_CHAIN_2026-05-20.md',
    'Broad DOM false hides',
    'JSON renderer leaks',
    'Capture fixture traceability',
    'Ignored root evidence corpus',
    'Raw capture extraction obligation index',
    'Source-of-truth claim register',
    'Root evidence/source taxonomy',
    'Root planning doc boundary',
    'Watch/player split',
    'Network/engagement side effects',
    'Network fetch reason matrix',
    'Background identity fetch trigger chain',
    'External navigation/link side effects',
    'Settings/mutation/revision',
    'Rule mutation authority',
    'Learned identity authority',
    'Learned identity map write entrypoints',
    'Security/PIN lock',
    'Backup/export mutation safety',
    'Prompt/onboarding authority',
    'Release/static/native boundaries',
    'Code-burden declutter boundary',
    'Five-way review convergence',
    'P0 family proof coverage',
    'P0 obligation status ledger'
  ]) {
    assert.ok(doc.includes(cluster), `missing cluster ${cluster}`);
  }

  for (const proof of [
    'FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md',
    'FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_PAGE_GLOBAL_PATCH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_STARTUP_INJECTION_READINESS_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_DOCUMENT_START_ZERO_FLASH_BOUNDARY_2026-05-21.md',
    'FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_COMPILED_CACHE_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_COMPILER_PARITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_LIFECYCLE_EFFECT_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_PAGE_RUNTIME_OWNER_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20.md',
    'FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_SOURCE_TIER_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
    'FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_IDENTITY_WATERFALL_ASSERTION_BOUNDARY_2026-05-20.md',
    'FILTERTUBE_IDENTITY_WATERFALL_REVIEW_CONVERGENCE_2026-05-20.md',
    'FILTERTUBE_IDENTITY_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_IDENTITY_RESOLVER_CACHE_DEDUPE_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_ROUTE_IDENTITY_DECISION_INDEX_2026-05-20.md',
    'FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
    'FILTERTUBE_FEATURE_SOURCE_DEPENDENCY_REGISTER_2026-05-20.md',
    'FILTERTUBE_METHOD_SEMANTIC_AUDIT_REGISTER_2026-05-20.md',
    'FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
    'FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md',
    'FILTERTUBE_REFERENCE_DOC_CLAIM_DRIFT_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md',
    'FILTERTUBE_HIDE_DECISION_PIPELINE_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20.md',
    'FILTERTUBE_SYNTHETIC_EVENT_ACTION_REGISTER_2026-05-20.md',
    'FILTERTUBE_COLLAB_DIALOG_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md',
    'FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md',
    'FILTERTUBE_VISIBLE_EMPTY_RUNTIME_ACTIVE_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_DOM_BROAD_HIDE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_IGNORED_ROOT_EVIDENCE_CORPUS_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md',
    'FILTERTUBE_ROOT_PLANNING_DOC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_WATCH_ENDSCREEN_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'FILTERTUBE_BACKGROUND_IDENTITY_FETCH_TRIGGER_CHAIN_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_RULE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_LEARNED_IDENTITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20.md',
    'FILTERTUBE_P0_SECURITY_PIN_LOCK_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_BACKUP_EXPORT_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_PROMPT_ONBOARDING_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_MANIFEST_PERMISSION_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_CODE_BURDEN_DECLUTTER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'FILTERTUBE_P0_FAMILY_PROOF_COVERAGE_2026-05-19.md',
    'FILTERTUBE_P0_OBLIGATION_STATUS_LEDGER_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(proof), `missing proof artifact ${proof}`);
  }
});

test('stabilization fix order is ordered around authority before symptom fixes', () => {
  const doc = read(docPath);
  const fixOrderStart = doc.indexOf('## Fix Order After The Gate');
  assert.notEqual(fixOrderStart, -1, 'missing fix order section');
  const fixOrder = doc.slice(fixOrderStart);

  const ordered = [
    '**Compiled no-work authority**',
    '**Endpoint policy before body work**',
    '**Lifecycle registry**',
    '**Visible-empty and stale-alias cleanup**',
    '**Selector plus hide/restore authority**',
    '**JSON renderer expansion**',
    'Treat "JSON-first" as an information waterfall',
    'video-id-only surfaces',
    'JSON, player payload, or learned',
    'surfaceInformationAvailability',
    'learned-map trust',
    '**Watch/player authority**',
    '**Network and engagement budgets**',
    '**Mutation/revision authority**',
    '**Rule mutation authority**',
    '**Security/PIN lock authority**',
    '**Backup/export authority**',
    '**Release and native sync proof**',
    '**Manifest and permission authority**',
    '**Prompt/onboarding coordinator**'
  ];

  let previous = -1;
  for (const heading of ordered) {
    const index = fixOrder.indexOf(heading);
    assert.notEqual(index, -1, `missing heading ${heading}`);
    assert.ok(index > previous, `${heading} should appear after the previous fix lane`);
    previous = index;
  }
});

test('stabilization fix order records document start zero flash as a bounded startup lane', () => {
  const doc = read(docPath);

  assert.match(doc, /Document-start zero-flash boundary/);
  assert.match(doc, /Document-start seed injection is a startup capability, not a global guarantee/);
  assert.match(doc, /supported YouTube JSON\/page-global payloads before render/);
  assert.match(doc, /active rules, route\/surface, endpoint\/global, and covered fields prove mutation is allowed/);
  assert.match(doc, /empty\/disabled states can still install hooks, mark endpoints, parse\/clone, harvest, queue, and replay work/);
  assert.match(doc, /FILTERTUBE_DOCUMENT_START_ZERO_FLASH_BOUNDARY_2026-05-21\.md/);
  assert.match(doc, /document-start-zero-flash-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /`documentStartWorkDecision`, `zeroFlashClaimAuthority`, `prePaintMutationDecision`/);
  assert.match(doc, /`seedNoWorkDecision`, and `initialGlobalReplayBudget`/);
  assert.match(doc, /before changing early hooks, zero-flash claims, empty-install no-work behavior/);
});

test('stabilization fix order preserves blocked behavior-change boundaries', () => {
  const doc = read(docPath);

  for (const blocked of [
    'broad JSON filtering changes',
    'DOM fallback deletion or broadening',
    'empty whitelist/blocklist semantic changes',
    'simultaneous allow/block migration',
    'lifecycle teardown behavior flips',
    'watch/player/end-screen behavior changes',
    'network/fetch/open side-effect changes',
    'public release claim expansion without artifact proof',
    'manifest/permission changes without package-specific authority proof',
    'prompt/coachmark behavior changes without a prompt coordinator'
  ]) {
    assert.ok(doc.includes(blocked), `missing blocked boundary ${blocked}`);
  }
});

test('stabilization fix order records mode surface matrix before empty-list and allow-block changes', () => {
  const doc = read(docPath);

  assert.match(doc, /Mode\/surface effect matrix/);
  assert.match(doc, /Profile type, viewing-space flags, Main\/Kids\/YTM surface, list mode/);
  assert.match(doc, /Empty blocklist, empty whitelist, UI viewing-space denial/);
  assert.match(doc, /Kids public web, YTM, watch\/Shorts\/video-id-only surfaces/);
  assert.match(doc, /post-action enrichment all need separate allowed-effect proof/);
  assert.match(doc, /`modeSurfaceEffectAuthority`, `modeSurfaceEffectDecision`, `profileModeSurfacePolicy`/);
  assert.match(doc, /`emptyListModePolicy`, `surfaceModeEffectBudget`, and `runtimeViewingSpacePolicy`/);
  assert.match(doc, /empty-list semantics, viewing-space enforcement, fallback deletion, or simultaneous allow\/block migration/);
});

test('stabilization fix order records direct hide writers before visual cleanup', () => {
  const doc = read(docPath);

  assert.match(doc, /Direct hide-writer register/);
  assert.match(doc, /23 direct `display:none` writes/);
  assert.match(doc, /shared helper, shell\/menu cleanup, members-only\/playlist broad fallback/);
  assert.match(doc, /quick-block\/fallback-menu actions, whitelist pending hides/);
  assert.match(doc, /Shorts\/playlist enrichment, optimistic\/confirmed block hides/);
  assert.match(doc, /comment hides, and clicked video\/card hides/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/direct-hide-writer-register-current-behavior\.test\.mjs/);
  assert.match(doc, /Add `hideWriterRegistry`, `hideWriterDecision`, `hideRestoreAuthority`/);
  assert.match(doc, /stats\/media policy, fanout budget, restore owner, disabled\/no-rule cleanup/);
});

test('stabilization fix order records lifecycle teardown before lifecycle cleanup', () => {
  const doc = read(docPath);

  assert.match(doc, /Lifecycle teardown decision register/);
  assert.match(doc, /Lifecycle cleanup is mixed/);
  assert.match(doc, /injector polling, fallback warmups, playlist popovers, dropdown observers/);
  assert.match(doc, /seed patches, bridge listeners, quick-block resize\/orientation\/mutation\/interval work/);
  assert.match(doc, /DOM fallback guards, collaborator observation/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/lifecycle-teardown-decision-register-current-behavior\.test\.mjs/);
  assert.match(doc, /Add `lifecycleTeardownDecision`, `lifecycleTeardownRegistry`, `lifecycleOwnerTeardownReport`/);
  assert.match(doc, /route\/native\/fullscreen\/no-rule teardown counters/);
  assert.match(doc, /local `disconnect`,\s+`removeEventListener`, `clearInterval`, or warmup stop/);
});

test('stabilization fix order records resolver cache dedupe before resolver pruning', () => {
  const doc = read(docPath);

  assert.match(doc, /Identity resolver cache\/dedupe/);
  assert.match(doc, /background Shorts\/watch\/Kids caches and pending maps/);
  assert.match(doc, /content-side watch\/Shorts pending maps/);
  assert.match(doc, /handle resolver `PENDING` state/);
  assert.match(doc, /watch metadata queues, dropdown pending enrichment/);
  assert.match(doc, /post-block six-hour fanout/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IDENTITY_RESOLVER_CACHE_DEDUPE_CURRENT_BEHAVIOR_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/identity-resolver-cache-dedupe-current-behavior\.test\.mjs/);
  assert.match(doc, /Add `identityResolverCacheDecision`, `identityResolverDedupeAuthority`, `resolverFetchBudget`/);
  assert.match(doc, /`noRuleResolverCounter`, `postActionResolverFanoutBudget`, and `handleResolverPendingPolicy`/);
});

test('stabilization fix order records immediacy claims before fast-path changes', () => {
  const doc = read(docPath);

  assert.match(doc, /Immediacy claim boundary/);
  assert.match(doc, /Fast user-facing behavior is not one global guarantee/);
  assert.match(doc, /Quick-block and menu actions can have scoped optimistic hides/);
  assert.match(doc, /post-block Shorts\/playlist fanout can hide already-proven same-channel rows/);
  assert.match(doc, /Instant playlist identity/);
  assert.match(doc, /nothing escapes during race conditions/);
  assert.match(doc, /hide any stray playlist rows instantaneously/);
  assert.match(doc, /Zero-Flash guarantees for Shorts even when metadata is missing/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IMMEDIACY_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/immediacy-claim-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /Add `immediacyClaimAuthority`, `immediateHideDecision`, `noEscapeBehaviorAuthority`/);
  assert.match(doc, /`exactTargetFanoutDecision`, `noRuleImmediateWorkBudget`, and `optimisticHideTransactionAuthority`/);
  assert.match(doc, /fast paths, broad DOM scans, fallback deletion, playlist\/Shorts fanout/);
});

test('stabilization fix order records learned identity map write entrypoints before map trust changes', () => {
  const doc = read(docPath);

  assert.match(doc, /Learned identity map write entrypoints/);
  assert.match(doc, /one current write plane/);
  assert.match(doc, /engine video\/channel\/meta harvest/);
  assert.match(doc, /channel\/custom URL map posts, card prefetch\/hydration/);
  assert.match(doc, /generic persistence helpers, same-window page messages/);
  assert.match(doc, /direct custom URL storage, post-block Shorts\/playlist fanout/);
  assert.match(doc, /menu\/action mapping broadcast, successful block video mapping/);
  assert.match(doc, /content handle resolver writes, background queues\/message receivers/);
  assert.match(doc, /compiled cache patching, and channel-add resolver repair/);
  assert.match(doc, /Passive harvest, visible DOM hydration, resolver repair, post-action fanout, metadata rerun, and direct storage bypass/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/learned-identity-map-write-entrypoint-current-behavior\.test\.mjs/);
  assert.match(doc, /Add `learnedIdentityMapWriteDecision`, `learnedIdentityMapWriteAuthority`, `identityMapProvenanceReport`/);
  assert.match(doc, /`mapWriteRevisionPolicy`, and `mapWriteEffectBudget`/);
  assert.match(doc, /pruning, merging, trusting, or cache-patching learned map writes/);
});

test('stabilization fix order records synthetic event actions before engagement cleanup', () => {
  const doc = read(docPath);

  assert.match(doc, /Synthetic event\/action register/);
  assert.match(doc, /15 direct synthetic `\.click\(\)` and `\.dispatchEvent\(\)` writes/);
  assert.match(doc, /YouTube menu cleanup, watch\/playlist navigation, generic target clicks/);
  assert.match(doc, /subscription-import automation, and readiness events/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SYNTHETIC_EVENT_ACTION_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/synthetic-event-action-register-current-behavior\.test\.mjs/);
  assert.match(doc, /Add `syntheticEventActionAuthority`, `observableActionBudget`, `syntheticClickDecision`/);
  assert.match(doc, /`syntheticDispatchDecision`, navigation budget, user-initiation proof/);
  assert.match(doc, /YouTube-observable side-effect classification/);
});
