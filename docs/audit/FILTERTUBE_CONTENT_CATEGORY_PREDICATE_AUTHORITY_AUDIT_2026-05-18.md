# FilterTube Content / Category Predicate Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

This pass isolates the non-keyword/non-channel rule families that can still
make FilterTube active when the visible blocklist/whitelist rows look empty:
duration, upload date, uppercase-title filtering, category filtering, comment
visibility, Shorts visibility, end-screen controls, search shelves, feed
controls, and watch-page UI controls.

The main finding is split authority: runtime activation decisions and final
hide decisions do not use one shared predicate contract. Seed JSON activation
and DOM fallback category activation now require selected categories before
category work is active, but duration/upload-date/uppercase content filters and
broad route booleans still have raw `enabled: true` activation paths before all
final predicate values and route relevance are proven.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Content Predicate Families

| Family | Current storage / UI shape | JSON engine decision | DOM fallback decision | Current authority risk |
| --- | --- | --- | --- | --- |
| Duration | `contentFilters.duration.enabled`, `condition`, `minMinutes`, `maxMinutes`, `value` | Active when enabled. `longer` with zero/blank threshold becomes `duration > 0`. `between` requires `max > 0` before hiding. | Active when enabled. Per-card logic uses its own duration parser and threshold checks. | Incomplete saved state can wake work; zero threshold can be broad for `longer`. |
| Upload date | `contentFilters.uploadDate.enabled`, `condition`, `fromDate`, `toDate`, relative value/unit fields | Active when enabled. Blank/invalid dates no-op at final decision. | Active when enabled. Can scan text, schedule metadata fetch, and mark pending state before valid dates are proven. | Blank date controls can wake DOM/JSON work without a real hide predicate. |
| Uppercase title | `contentFilters.uppercase.enabled`, `mode`, `minWordLength` | Active when enabled and title matches uppercase heuristic. | Active when enabled through the same broad active-content flag family. | A heuristic flag must be route/profile explicit because it is not tied to lists. |
| Categories | `categoryFilters.enabled`, `mode`, `selected[]` | Seed activation and final engine decision require `selected.length > 0`. | The top-level active predicate and per-card logic both require `selected.length > 0`. | Enabled-empty category state no longer wakes seed or DOM fallback category work; remaining category risk is shared route/metadata/reporting authority. |
| Boolean surface controls | `hideAllShorts`, `hideAllComments`, `hideEndscreen*`, `hideSearchShelves`, `hideVideoSidebar`, etc. | Some JSON paths run for comments/Shorts/player/watch-next depending on endpoint and flag. | `hasActiveDOMFallbackWork()` treats any true boolean key as active DOM work. | These are valid controls, but they share the same active bucket as list filters and need route-scoped policy. |

## Activation Versus Decision

The code currently has at least four places that answer "is there active
filter work?" independently:

```text
UI writes raw flags
  |
  +--> StateManager persists content/category objects
  |
  +--> background compiles raw content/category objects
  |
  +--> seed shouldSkipEngineProcessing() decides endpoint parse/rewrite work
  |
  +--> DOM fallback hasActiveDOMFallbackWork() decides scan lifecycle
  |
  +--> filter_logic.js / per-card DOM logic makes final hide/no-hide decisions
```

Because those decisions are split, a user can see no keyword/channel rows and
still pay runtime cost from a raw content-filter or boolean flag. The final card
decision may still no-op, but the parse, scan, metadata-fetch, pending-state, or
observer work has already happened.

## Engine Predicate Behavior

Source references:

- `js/filter_logic.js:940-992` builds default content/category objects.
- `js/filter_logic.js:2127-2134` requires non-empty selected categories before
  a category hide decision.
- `js/filter_logic.js:2724-2798` treats enabled duration filters as active and
  allows `longer` with `min = 0` to match every parsed-duration video.
- `js/filter_logic.js:2804-2849` treats upload date and uppercase as active
  when enabled, while blank upload-date cutoffs no-op only inside final
  decision logic.

Current verdict:

- Category final decision is safer than category activation because selected
  categories are required at decision time.
- Upload-date final decision is safer than upload-date activation because blank
  dates no-op only after endpoint/DOM work has already started.
- Duration `between` is relatively guarded by `max > 0`; duration `longer` with
  zero/blank state is broad.

## Seed Endpoint Activation

Source reference: `js/seed.js:205-241`.

Current seed activation treats these as JSON-active:

```text
contentFilters.duration.enabled
contentFilters.uploadDate.enabled
contentFilters.uppercase.enabled
categoryFilters.enabled === true with selected category values
hideAllComments === true
hideAllShorts === true
```

The seed gate does not validate:

- upload-date `fromDate` / `toDate`,
- duration threshold/range values,
- route-specific relevance for each content-control family.

That does not always mean a false hide. It does mean the endpoint can be cloned,
parsed, processed, harvested, or rewritten because a raw flag exists.

## DOM Fallback Predicate Behavior

Source references:

- `js/content/dom_fallback.js:1981-1995` makes strict content-filter enabled
  flags active for DOM fallback lifecycle and requires selected category values
  before category lifecycle work.
- `js/content/dom_fallback.js:2468-2500` category per-card logic requires
  `selected.length > 0`.
- `js/content/dom_fallback.js:3218-3380` upload-date logic can scan card text,
  schedule metadata fetches, and set pending upload-date state before a valid
  cutoff is known.
- `js/content/dom_fallback.js:3596-3607` has a second content/category
  activation check that is narrower for category selected values but still raw
  for duration/upload-date/uppercase.

Current verdict:

- DOM fallback has two different active-content concepts in one file.
- Category is now selected-value gated in both the top-level lifecycle gate and
  the inner card path.
- Upload-date can create pending work if a metadata request was scheduled and
  the cutoff later proves valid; the schedule attempt happens before that final
  predicate proof.

## Settings Transport And Invalidation

Source references:

- `js/tab-view.js:1051-1161` and `js/tab-view.js:2159-2269` save Main/Kids
  content filters by merging the prior object and only updating numeric/date
  fields when input parses as positive. Invalid or blank fields can therefore
  leave old thresholds behind while toggling `enabled` or `condition`.
- `js/state_manager.js:2115-2187` persists content/category changes and
  immediately requests runtime refresh.
- `js/settings_shared.js:17-56` omits `contentFilters` and `categoryFilters`
  from the legacy `SETTINGS_KEYS` list, while profile V4 loading can still
  carry those objects.
- `js/content/bridge_settings.js:557-600` includes `contentFilters` in storage
  refresh keys but omits `categoryFilters`.

Current verdict:

- Main/Kids content-control UI has duplicated save logic.
- Storage refresh dependencies are not one canonical list.
- Category changes can rely on profile V4 refresh paths rather than a direct
  `categoryFilters` storage-key refresh in the bridge list.

## Why This Explains The User Symptoms

This audit does not claim every user-visible lag or false hide comes from these
settings. It proves a specific disease pattern:

1. Empty keyword/channel lists do not imply zero runtime work.
2. Raw content/category/boolean flags can make JSON and DOM paths active.
3. Final hide decisions are often more precise than activation decisions.
4. Work can happen before a predicate proves it can hide anything.
5. Old saved values can survive when UI saves an enabled flag with blank input.

That matches the report class: "I have no visible blocklist rules, but YouTube
still feels slower or hides unexpected things."

## Required Future Contract

Before changing behavior, add one implementation-neutral predicate report:

```text
contentPredicateAuthority({
  profileId,
  surface: "main" | "kids" | "ytm",
  route: "home" | "search" | "watch" | "shorts" | "comments" | "kids",
  listMode,
  predicates: {
    duration: { active, condition, minMinutes, maxMinutes, reason },
    uploadDate: { active, condition, fromDate, toDate, reason },
    uppercase: { active, mode, minWordLength, reason },
    categories: { active, mode, selected, reason },
    booleans: { activeKeys, routeRelevantKeys }
  },
  endpointNeeds: {
    parseResponse,
    mutateResponse,
    harvestIdentity,
    harvestVideoMeta
  },
  domNeeds: {
    scanCards,
    scanComments,
    scanPlayer,
    scanEndscreen,
    scheduleMetadataFetch
  }
})
```

Behavior changes should then depend on this report rather than raw UI flags.

## Proof Gates Before Fixing

Add and flip behavior fixtures only after these current-behavior baselines are
covered:

```text
content_predicate_enabled_empty_category_is_inactive
content_predicate_blank_upload_date_is_inactive
content_predicate_zero_duration_longer_is_inactive
content_predicate_blank_duration_save_clears_old_threshold
content_predicate_route_scope_home_does_not_scan_watch_controls
content_predicate_route_scope_watch_does_not_scan_home_feed_controls
content_predicate_category_storage_change_refreshes_runtime
content_predicate_kids_and_main_are_independent
content_predicate_boolean_controls_are_route_scoped
content_predicate_metadata_fetch_requires_valid_pending_reason
```

The first safe implementation direction is not "delete content filters." It is:

1. normalize settings into one predicate authority report,
2. make endpoint and DOM lifecycles consult that report,
3. preserve exact current final-hide behavior with positive/negative fixtures,
4. then remove no-op parse/scan/fetch work for inactive predicates.
