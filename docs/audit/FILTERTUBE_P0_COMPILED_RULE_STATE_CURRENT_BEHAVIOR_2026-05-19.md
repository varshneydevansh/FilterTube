# FilterTube P0 Compiled Rule State Current Behavior - 2026-05-19

Status: current-behavior audit only. This file does not change filtering,
settings, menu insertion, quick-block behavior, endpoint interception, or app
runtime output.

This slice pins why the first stabilization layer needs one compiled active
state before broad runtime cleanup. Today the product has good local guards in
several places, but no single `compiledRuleState` report that decides whether a
profile/surface/route has meaningful filtering work.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Blocked Verdict

P0 compiled rule state is not green. Current behavior proves split authority:

- Seed JSON processing wakes from strict content-filter `enabled === true`
  booleans, active JSON rules, selected category values, or whitelist mode, but
  still lacks one compiled validity report for duration/date thresholds.
- DOM fallback wakes from strict content-filter `enabled === true` booleans,
  selected category values, broad boolean controls, or whitelist mode, but still
  lacks the same route/predicate budget as JSON work.
- Quick-block lifecycle installs styles, listeners, observer, and a periodic
  sweep outside the action gate.
- Fallback 3-dot scanning has native-overlay quiet checks, but not the same
  `listMode` and `showBlockMenuItem` gate as the normal menu.
- Background compilation passes raw content/category objects through without a
  normalized active-state record.
- Background compilation can prefer V4 `blockedKeywords` / `blockedChannels`
  aliases over the canonical UI rows.
- Background compile dependencies, storage invalidation, and shared settings
  reload keys are not one source of truth.

## Current Split

```text
profile state
  |
  +--> background compile
  |       +--> raw contentFilters/categoryFilters copied
  |       +--> blocked* aliases can win over canonical rows
  |
  +--> seed.js
  |       +--> strict booleans and selected categories decide JSON work
  |
  +--> dom_fallback.js
  |       +--> strict booleans and selected categories decide DOM work
  |
  +--> block_channel.js
  |       +--> action gate exists, lifecycle still starts separately
  |
  +--> content_bridge.js fallback menu
          +--> native-overlay quiet mode only, no shared action gate
```

## Current Proof Table

| Fixture | Current behavior | Source proof | Risk |
| --- | --- | --- | --- |
| `compiled_rule_state_future_token_absent` | Product source does not implement `compiledRuleState` today. | `tests/runtime/p0-compiled-rule-state-current-behavior.test.mjs` | Each feature keeps inferring work differently. |
| `compiled_rule_state_seed_uses_split_enabled_predicates` | `seed.js` treats strict `contentFilters.*.enabled === true`, selected `categoryFilters`, ordinary JSON rules, and whitelist mode as JSON-active work. | `js/seed.js:202-238` | Blank duration/date thresholds can still wake JSON work, and no single compiled report owns the route/surface decision. |
| `compiled_rule_state_dom_fallback_uses_split_enabled_predicates` | DOM fallback treats whitelist mode, broad boolean controls, strict `contentFilters.*.enabled === true`, and selected `categoryFilters` as active. | `js/content/dom_fallback.js:1933-1995` | Blank duration/date thresholds and broad route controls can still wake DOM scans without shared route/predicate authority. |
| `compiled_rule_state_quick_block_lifecycle_is_outside_action_gate` | `setupQuickBlockObserver()` starts styles/listeners/observer/timer before the first mutation callback action guard. | `js/content/block_channel.js:808-817`, `1454-1655` | Disabled quick-block can still cost listeners/timers. |
| `compiled_rule_state_fallback_menu_lacks_shared_action_gate` | Fallback menu scanning checks native overlay quiet mode but not the normal `listMode` / `showBlockMenuItem` action gate. | `js/content_bridge.js:6563-6624`, `10090-10101` | Normal and fallback menus disagree about whether action UI should exist. |
| `compiled_rule_state_background_passes_raw_predicates` | Background compile stores raw content/category objects without active predicate validity. | `js/background.js:2508-2551` | Seed/DOM/UI must reinterpret the same raw settings. |
| `compiled_rule_state_background_aliases_can_override_visible_rows` | Background compile prefers `blockedKeywords` / `blockedChannels` aliases before canonical `keywords` / `channels`. | `js/background.js:2057-2063`, `2213-2219`; `docs/audit/FILTERTUBE_VISIBLE_EMPTY_RUNTIME_ACTIVE_CURRENT_BEHAVIOR_2026-05-19.md` | UI can look empty while runtime still hides matching content. |
| `compiled_rule_state_dependency_keys_are_split` | Compiler dependencies, storage invalidation, and shared settings load/reload key lists are separate authorities. | `docs/audit/FILTERTUBE_STORAGE_KEY_AUTHORITY_AUDIT_2026-05-18.md`; `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Cache refresh can be stale or over-broad. |

## Future Contract Before Behavior Changes

The first safe implementation should introduce an implementation-neutral report,
for example:

```text
compiledRuleState(profile, surface, route, settings) -> {
  filteringEnabled,
  listMode,
  visibleCanonicalCounts,
  legacyAliasCounts,
  aliasConflict,
  hasValidKeywordRules,
  hasValidChannelRules,
  hasValidCommentRules,
  hasValidShortsRules,
  hasValidDurationRule,
  hasValidUploadDateRule,
  hasValidCategoryRule,
  hasLayoutRules,
  canShowBlockMenu,
  canShowQuickBlock,
  needsJSONMutation,
  needsDOMFallback,
  needsIdentityHarvest,
  noWorkReason
}
```

Minimum proof before changing runtime behavior:

- Empty install and disabled mode must be real no-work states.
- Enabled-empty category is now inactive before seed/DOM lifecycle work, while
  blank upload-date and zero/blank duration thresholds still need one compiled
  active-state decision unless explicitly meaningful.
- Visible canonical rows and legacy aliases must have one migration winner.
- Normal menu, fallback menu, and quick-block must share one action/lifecycle
  authority.
- Endpoint, DOM, stats, and storage refresh work must consume the same compiled
  state instead of raw settings.
