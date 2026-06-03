# FilterTube P0 Content / Category Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice converts the P0 content/category predicate family into runnable
proof. It exists because users can have no visible keyword/channel rows while
duration, upload-date, uppercase, category, comments, Shorts, watch, search, or
feed controls still wake JSON, DOM, metadata, storage, or refresh work.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Verdict

```text
P0 content/category predicate slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Implementation gate remains closed.
```

The product has useful content controls, but there is no central
`contentPredicateAuthority` report that decides whether a predicate is active,
route-relevant, metadata-backed, and safe to spend endpoint or DOM work on.

## Current Authority Shape

```text
UI raw enabled flags
        |
        +--> StateManager saves Main/Kids content/category objects
        +--> background compiles raw profile/legacy content/category objects
        +--> seed endpoint predicate wakes JSON parse/process/rewrite work
        +--> DOM fallback predicate wakes selector scans and metadata work
        +--> engine/card decision validates some values later
```

## P0 Fixture Status

| P0 fixture | Current behavior pinned here | Future green condition |
| --- | --- | --- |
| `content_predicate_enabled_empty_category_is_inactive` | Engine no-ops enabled-empty category, and seed plus DOM top-level activation now require selected category values. | Enabled-empty category is inactive before endpoint parse, DOM scan, or metadata work. |
| `content_predicate_blank_upload_date_is_inactive` | Engine no-ops blank upload dates, but seed and DOM top-level predicates treat raw upload-date enabled as active work. | Blank/invalid upload-date controls are inactive before endpoint or DOM lifecycle work. |
| `content_predicate_zero_duration_longer_is_inactive` | Engine currently hides any parsed-duration video for `longer` with min `0`. | Zero/blank duration thresholds are inactive unless explicitly confirmed as a product policy. |
| `content_predicate_blank_duration_save_clears_old_threshold` | Main/Kids UI saves clone prior duration state and only replace thresholds when parsed positive values exist. | Blank duration input clears stale thresholds or produces a structured inactive reason. |
| `content_predicate_route_scope_home_does_not_scan_watch_controls` | DOM active work can wake on watch-only booleans without consulting route in the top-level predicate. | Home route ignores watch-only controls before selector/lifecycle work. |
| `content_predicate_route_scope_watch_does_not_scan_home_feed_controls` | DOM active work can wake on home/search/feed booleans without consulting route in the top-level predicate. | Watch route ignores home/feed/search controls before selector/lifecycle work. |
| `content_predicate_category_storage_change_refreshes_runtime` | StateManager requests refresh for category updates, but background and bridge storage-key lists omit direct `categoryFilters`. | Category storage changes refresh every runtime owner through one storage authority. |
| `content_predicate_kids_and_main_are_independent` | Main/Kids have separate StateManager update paths and background compile paths, but no predicate report identifies the target surface. | Main/Kids predicate decisions carry explicit surface and target profile. |
| `content_predicate_boolean_controls_are_route_scoped` | Boolean controls are compiled and DOM-active as a broad list, then route specificity appears later in CSS/DOM branches. | Boolean controls are route-scoped before work starts. |
| `content_predicate_metadata_fetch_requires_valid_pending_reason` | DOM upload-date logic can schedule metadata before final date validity proof; category metadata is safer after selected-category proof. | Metadata fetches require a valid predicate, route, reason, and owner before scheduling. |

## Risk Interpretation

This slice explains a concrete symptom class: a profile can look empty in the
keyword/channel UI while still waking expensive or surprising work from another
saved control. The risk is not that every control is wrong; the risk is that
activation, final hide decision, metadata fetch, storage refresh, and route
scope are owned by different code paths.

## Safe Next Proof

Before changing content/category behavior, add fixtures for:

- endpoint no-parse counters for enabled-empty category and blank upload-date
- DOM no-scan counters for enabled-empty category and blank upload-date
- duration `longer` zero/blank threshold migration behavior
- Main/Kids independent content/category storage changes
- route-scoped boolean controls for home/search/watch/Shorts/comments
- metadata-fetch reason records for duration/upload-date/category
- stale threshold cleanup when UI fields are blanked
