# FilterTube JSON-First Network Snapshot Consumer Application - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, cache patch, DOM patch,
or permission to change JSON filtering behavior.

## Purpose

This register connects the network snapshot consumer request path to the
current collaborator application path in `content_bridge.js`. The request
transport register proves how collaborator and channel requests are sent and
cleared. This register proves what happens after collaborator data arrives:
which cache is updated, which DOM attributes are stamped or cleared, when active
collaboration menus are re-rendered, when playlist fallback popovers are
refreshed, and when DOM fallback is scheduled again.

The current boundary is:

```text
Resolved collaborator payloads are sanitized, compared against the global
resolved-collaborator cache and per-card cached collaborator score, optionally
stamped onto matching cards, always written into the resolved map after the
early global richer-cache gate, then used to refresh active collaboration menus,
playlist fallback popovers, and a zero-delay DOM fallback reprocess.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_REQUEST_TRANSPORT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20.md`
- `docs/audit/FILTERTUBE_LIFECYCLE_EFFECT_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md`

## Current Counts

```text
consumer application source files: 1
resolved collaborator cache maps: 1
active collaboration menu maps: 1
applyResolvedCollaborators token occurrences: 7
applyResolvedCollaborators callsites outside declaration: 6
refreshActiveCollaborationMenu token occurrences: 4
refreshActiveCollaborationMenu callsites outside declaration: 3
resolved collaborator map set callsites: 5
resolved collaborator map get callsites: 5
applyResolvedCollaborators direct card collaborator serialized write sites: 1
applyResolvedCollaborators direct card collaborator source-label write sites: 1
applyResolvedCollaborators direct card collaborator timestamp write sites: 1
applyResolvedCollaborators direct card resolved-state write sites: 1
applyResolvedCollaborators direct card pending-dialog cleanup sites: 1
applyResolvedCollaborators direct card requested cleanup sites: 1
applyResolvedCollaborators active menu refresh callsites: 1
applyResolvedCollaborators playlist fallback refresh callsites: 1
applyResolvedCollaborators zero-delay DOM fallback rerun timers: 1
runtime matching-card application fixture: 1
runtime no-card cache-and-rerun fixture: 1
runtime richer-global-cache gate fixture: 1
runtime force-downgrade card-skip fixture: 1
runtime active-menu richer-resolved-cache fixture: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Application Inventory

| Surface | Source anchor | Current behavior | Current risk boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Resolved collaborator cache | `js/content_bridge.js:1911` and `js/content_bridge.js:3363` | `resolvedCollaboratorsByVideoId` stores sanitized collaborator rosters by video id after the early richer-cache gate. | Map writes are not tied to a settings revision, route, source capability, or card-stamp success report. | Resolved-cache decision report and settings revision gate. |
| Active collaboration menu cache | `js/content_bridge.js:1910` and `js/content_bridge.js:846` through `js/content_bridge.js:939` | Active menus are tracked by video id and can be refreshed when a later collaborator roster is richer or more complete. | Menu refresh chooses among incoming, card, resolved, and avatar-stack lists without a shared winner report. | Winning-roster and rejected-roster report. |
| Card stamping | `js/content_bridge.js:3322` through `js/content_bridge.js:3357` | Matching `[data-filtertube-video-id]` cards receive serialized collaborators, optional source label, timestamp, resolved state, and pending-request cleanup. | The returned `updated` flag is based on matching-card presence, not proof that every card was actually stamped. | Per-card stamp outcome and skip reason report. |
| Source-card fallback | `js/content_bridge.js:3358` through `js/content_bridge.js:3361` | If no matching cards are found, `options.sourceCard` can still be stamped. | A missing card plus no source card still writes resolved cache and schedules follow-on effects. | Card-correlation decision and no-target effect policy. |
| Active-menu refresh | `js/content_bridge.js:3376` through `js/content_bridge.js:3378` | `applyResolvedCollaborators()` calls `refreshActiveCollaborationMenu()` with the resolved expected count. | Refresh can rerender an open menu even when the original request was not pending. | Pending/request ownership or trusted application token. |
| Playlist fallback refresh | `js/content_bridge.js:3380` | Open playlist fallback popover refresh is called for the video id after cache application. | Popover refresh is coupled to collaborator cache application without a per-surface budget. | Playlist fallback refresh budget. |
| DOM fallback rerun | `js/content_bridge.js:3382` through `js/content_bridge.js:3389` | If `applyDOMFallback` exists, a zero-delay timer reprocesses DOM with `preserveScroll` and `forceReprocess`. | Every non-empty resolved roster that passes the early gate can schedule DOM work, including no-card cache-only updates. | DOM fallback rerun budget and route/surface permission. |

## Source-Derived Rows

```text
resolvedCollaboratorApplication: sanitize, score, early richer-cache gate, card stamp, resolved map set, active menu refresh, playlist fallback refresh, zero-delay DOM fallback rerun
cardStampAttributes: data-filtertube-collaborators, data-filtertube-collaborators-source, data-filtertube-collaborators-ts, data-filtertube-collab-state, data-filtertube-expected-collaborators
cardPendingCleanup: data-filtertube-collab-awaiting-dialog and data-filtertube-collab-requested removed after stamp
noCardApplication: resolved map, active menu refresh, playlist fallback refresh, and DOM fallback timer can still run while returned updated flag is false
forceApplicationBoundary: force bypasses the global richer-cache early return but does not bypass per-card richer-cache skip
activeMenuRosterChoice: incoming roster, validated card cache, resolved map cache, and avatar-stack data compete by length then quality
```

Anchor map:

```text
activeCollaborationDropdownsMap: `js/content_bridge.js:1910`
resolvedCollaboratorsByVideoIdMap: `js/content_bridge.js:1911`
refreshActiveCollaborationMenuFunction: `js/content_bridge.js:846` through `js/content_bridge.js:939`
refreshActiveMenuContextLookup: `js/content_bridge.js:848`
refreshActiveMenuDisconnectedDelete: `js/content_bridge.js:851`
refreshActiveMenuResolvedCacheRead: `js/content_bridge.js:858`
refreshActiveMenuCardCacheWrite: `js/content_bridge.js:896`
refreshActiveMenuRender: `js/content_bridge.js:930` through `js/content_bridge.js:935`
refreshActiveMenuContextUpdate: `js/content_bridge.js:936` through `js/content_bridge.js:939`
applyResolvedCollaboratorsFunction: `js/content_bridge.js:3298` through `js/content_bridge.js:3391`
applyResolvedCollaboratorsEarlyGlobalGate: `js/content_bridge.js:3311` through `js/content_bridge.js:3314`
applyResolvedCollaboratorsCardQuery: `js/content_bridge.js:3322`
applyResolvedCollaboratorsCardSerializedWrite: `js/content_bridge.js:3332`
applyResolvedCollaboratorsCardSourceWrite: `js/content_bridge.js:3334`
applyResolvedCollaboratorsCardTimestampWrite: `js/content_bridge.js:3336`
applyResolvedCollaboratorsCardResolvedStateWrite: `js/content_bridge.js:3337`
applyResolvedCollaboratorsPendingDialogCleanup: `js/content_bridge.js:3350`
applyResolvedCollaboratorsRequestedCleanup: `js/content_bridge.js:3339`
applyResolvedCollaboratorsExpectedCountWrite: `js/content_bridge.js:3349`
applyResolvedCollaboratorsResolvedMapWrite: `js/content_bridge.js:3363`
applyResolvedCollaboratorsActiveMenuRefresh: `js/content_bridge.js:3376` through `js/content_bridge.js:3378`
applyResolvedCollaboratorsPlaylistRefresh: `js/content_bridge.js:3380`
applyResolvedCollaboratorsDomFallbackTimer: `js/content_bridge.js:3382` through `js/content_bridge.js:3389`
```

## Runtime Fixture Summary

The matching-card fixture proves that a non-empty resolved roster can stamp a
matching card, set `data-filtertube-collaborators-source`, set a timestamp, mark
the card resolved, clear pending collaborator attributes, update the resolved
map, refresh playlist fallback state, and schedule a zero-delay DOM fallback
rerun.

The no-card fixture proves that a non-empty resolved roster with no matching
card and no `sourceCard` still updates `resolvedCollaboratorsByVideoId`, calls
the follow-on refresh hooks, schedules DOM fallback, and returns `false`.

The richer-global-cache fixture proves that a higher-quality existing resolved
cache blocks lower-quality incoming collaborators when `force` is not set.

The force-downgrade fixture proves that `force: true` bypasses the global
richer-cache early return and can replace the resolved map with a lower-quality
roster, while a richer per-card cache still prevents the card attribute write.

The active-menu fixture proves that `refreshActiveCollaborationMenu()` can choose
a richer resolved-map roster over the incoming list and the card cache, write the
card collaborator cache, rerender the active menu, and mark the menu as no
longer awaiting full render when the roster is complete.

## Risks Identified

- Reliability: resolved map application is not represented by a shared
  request/result/apply contract, so response handling, dialog data, XHR cache
  messages, and background enrichment can all reach the same cache and DOM
  refresh path through local gates.
- False-hide/leak: collaborator data can schedule DOM fallback reprocessing even
  when no current card was stamped, so stale or route-mismatched cache effects
  need stronger target proof before behavior changes.
- Performance: every accepted resolved roster can trigger active-menu work,
  playlist fallback refresh, and zero-delay DOM fallback work without a shared
  no-work budget.
- Code burden: collaborator application is split across response handling,
  dialog handling, direct card stamping, active menu refresh, playlist fallback
  refresh, and DOM fallback rerun code rather than one reportable application
  boundary.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstNetworkSnapshotConsumerApplicationContract
jsonFirstNetworkSnapshotConsumerApplicationDecision
jsonFirstNetworkSnapshotConsumerResolvedCacheReport
jsonFirstNetworkSnapshotConsumerDomStampReport
jsonFirstNetworkSnapshotConsumerActiveMenuRefreshReport
jsonFirstNetworkSnapshotConsumerPlaylistPopoverRefreshReport
jsonFirstNetworkSnapshotConsumerDomFallbackRerunBudget
jsonFirstNetworkSnapshotConsumerCacheDowngradePolicy
jsonFirstNetworkSnapshotConsumerCardStampCorrelationReport
jsonFirstNetworkSnapshotConsumerApplicationMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-application-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first network
snapshot consumer gap from request transport into cache and DOM application
behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer application
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, consumer application changes, cache
downgrade policy changes, DOM application changes, or network snapshot
authority changes.
