# FilterTube JSON/DOM Inventory Truth Audit - 2026-05-18

Status: audit-only. This document does not change renderer rules, selectors, or
runtime behavior.

## Purpose

`docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md` are
important discovery maps. They were built from local ignored captures, live
YouTube observations, and implementation notes. They are not proof that the
current runtime filters every documented renderer or that every DOM selector is
safe on every route.

This distinction matters because some inventory rows use optimistic historical
phrasing such as "Covered", "Implemented", or "Targeted (Layout Fix)" while the
current executable source and tests show a narrower truth.

## Truth Boundary

```text
ignored root captures
  -> raw evidence only
  -> may be mined into minimal fixtures

json_paths_encyclopedia.md / youtube_renderer_inventory.md
  -> discovery indexes and fixture backlog
  -> not runtime proof by themselves

js/filter_logic.js + seed/content runtime
  -> current behavior source
  -> must be proven by tests/runtime fixtures

tests/runtime/*
  -> executable current-behavior proof
  -> expected source of pass/fail claims
```

## Current Drift Examples

| Inventory topic | Inventory evidence | Current source truth | Risk |
| --- | --- | --- | --- |
| `compactPlaylistRenderer` | Documented in `json_paths_encyclopedia.md` with playlist title, creator UC ID, handle, thumbnails, and menu paths. | `richItemRenderer` can unwrap to `compactPlaylistRenderer`, but `FILTER_RULES` has no direct `compactPlaylistRenderer` rule. | Playlist and YTM compact playlist cards can leak or force late DOM fallback. |
| `showSheetCommand` collaborator rosters | Documented as the preferred collaborator roster with header title `Collaborators` and list item identity paths. | `filter_logic.js` currently extracts `showDialogCommand` in the main JSON collaboration path; show-sheet parity is fixture-proven as a gap. | Modern collaborator rosters can be missed even when docs have the exact JSON path. |
| Direct watch-card renderers | Inventory/docs list `watchCardRichHeaderRenderer`, `watchCardHeroVideoRenderer`, and `watchCardRHPanelVideoRenderer`. | `universalWatchCardRenderer` has nested paths, but direct watch-card renderers do not have first-class direct `FILTER_RULES` entries. | Direct watch-card payloads can leak or be handled only by later DOM fallback. |
| `searchRefinementCardRenderer` and `compactChannelRenderer` | Documented with query/name/channel identity paths. | There are no direct `FILTER_RULES` entries for those renderer keys. | Search entity/refinement cards can leak or be broad-hidden if fixed too generally. |
| `postRenderer` / `sharedPostRenderer` | Documented alongside legacy backstage post shapes. | Legacy `backstagePostRenderer`/thread rules exist, but modern direct `postRenderer` and `sharedPostRenderer` are not first-class keys. | Community post behavior can diverge by renderer generation. |
| Layout-fix coverage | `youtube_renderer_inventory.md` cites `js/layout.js` for some watch-card layout targets. | `js/layout.js` is not manifest-loaded in the active browser manifests. | Layout-only coverage should not count as active filtering proof. |
| Global DOM card selectors | `VIDEO_CARD_SELECTORS` includes desktop Main, mobile, YTM, Kids, channel, playlist, radio, and watch-card hosts. | There is no central selector registry keyed by surface, route, action, and allowed hide target. | A selector added for one route can increase scans or false-hide another route. |

## Required Future Rule

Every renderer/selector mentioned in the inventories should be classified as one
of:

| Classification | Meaning |
| --- | --- |
| `json-first-supported` | Has direct fixture-backed JSON filter behavior. |
| `nested-supported` | Supported only when nested under a specific wrapper, with fixture proof. |
| `dom-supported` | Supported by DOM fallback with route-scoped selector and false-hide fixture proof. |
| `metadata-only` | Harvested for identity/meta but never removes content directly. |
| `ui-only` | UI text/control surface; no content filtering expected. |
| `unsupported-gap` | Known renderer/selector exists but current runtime does not enforce it. |
| `quarantined-legacy` | Historical code or CSS mentions it, but it is not active runtime coverage. |

No renderer should be called "covered" in release-facing claims unless it has a
fixture in `tests/runtime` or an explicit non-filtering classification.

## Immediate Audit Implication

The next renderer/selector fixes should not broaden `FILTER_RULES` or DOM
selectors directly. They should first add fixtures for:

1. documented JSON path -> extracted candidate fields,
2. blocklist decision,
3. whitelist decision,
4. no-rule/no-work behavior,
5. false-hide boundary for surrounding shelves/cards,
6. route/surface scope.

Only after those fixtures exist should runtime rules be changed.

## First Optimization Metric Collector Parity Rollout Boundary Addendum

First optimization metric collector parity rollout boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs`
maps this inventory truth boundary into first-collector parity and rollout
requirements. The addendum pins 12 collector parity rollout rows, 12 collector
fixture provenance rows covered, 12 route/surface obligations covered, 2
evidence parity rollout rows covered, 8 parity and release boundary source docs
covered, 0 runtime collector parity rollout proofs approved, and 0
implementation-ready parity rollout rows. Inventory rows remain discovery and
fixture backlog until executable JSON, DOM, native, release, and public-claim
proof exists for the scoped surface.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
maps this inventory truth boundary into the future `parity-rollout.json`
contract without creating rollout artifacts or approving runtime behavior. The
addendum pins 12 parity rollout contract rows, 1 reserved parity rollout path
covered, 0 committed parity rollout files, 0 runtime metric collector approvals,
and 0 implementation-ready parity rollout contract rows. JSON and DOM inventory
rows remain route/surface evidence until executable fixtures, sibling proof,
native sync proof, release proof, and public claim proof exist.

## First Optimization Rollback Unclaimed Surface Boundary Addendum

First optimization rollback unclaimed surface boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs`
isolates rollback, unclaimed-surface, native sync, release package,
raw-capture, diagnostic performance, and public-claim limits before any
metric-foundation artifact is committed or runtime behavior changes. The
addendum pins 12 rollback/unclaimed boundary rows, 8 release/native/public
source docs covered, 0 committed rollback/unclaimed artifacts, 0 runtime
rollback approvals, 0 runtime unclaimed-surface approvals, 0 runtime metric
collector approvals, 0 implementation-ready rollback/unclaimed rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It keeps JSON-first, whitelist, collector, native,
release, and public claim work blocked until measured surfaces, unclaimed
surfaces, rollback command, artifact absence, authority absence, raw-capture
exclusion, and release/public claim limits are proved.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
