# FilterTube Direct Hide Writer Register - 2026-05-20

Status: audit-only current-behavior proof. Runtime behavior is unchanged.

This register pins every active page-runtime source line that writes
`display:none` directly in the extension page scripts that can run on YouTube
surfaces. It complements the broader hide/restore and broad-selector audits by
turning "direct writers exist" into an exact current source inventory.

## Why This Slice Exists

False hiding can be caused by three separate mistakes:

```text
wrong decision
  -> wrong DOM target
  -> wrong visual writer / missing restore owner
```

The previous P0 hide/restore proof already shows that the shared
`toggleVisibility()` helper is not the only visual writer. This register makes
that concrete: direct display writers exist in shared helpers, DOM fallback,
quick block, fallback menu, whitelist pending, Shorts/playlist enrichment,
optimistic block actions, comment hides, and mobile menu-shell cleanup.

These writes are not automatically wrong. Several are intentional. The current
risk is that they do not all share one `hideWriterRegistry`,
`hideRestoreAuthority`, stats policy, media policy, route policy, or disabled
cleanup contract.

## Current Direct Display-None Writers

| Ref | Class | Current owner | Current effect | Main risk |
| --- | --- | --- | --- | --- |
| `js/content/dom_helpers.js:91` | shared helper | `toggleVisibility()` | Adds `.filtertube-hidden`, `data-filtertube-hidden`, inline `display:none!important`, stats, tracker, and media side effects unless skipped. | Central sink is useful, but its input is a boolean and string reason rather than a structured decision. |
| `js/content/dom_fallback.js:1576` | shell/control cleanup | Inline mobile search-result control cleanup | Hides search controls that appear inside mobile result cards and marks `data-filtertube-hidden-search-inline`. | Route-scoped control cleanup is outside shared content stats/media policy and needs route restore proof. |
| `js/content/dom_fallback.js:1608` | shell cleanup | Open-app button cleanup | Directly hides mobile/open-app affordances and marks `data-filtertube-hidden-open-app`. | Shell cleanup is outside shared content stats/media policy and outside generic stale marker cleanup. |
| `js/content/dom_fallback.js:2367` | content broad hide | Members-only title/aria fallback | Hides the nearest video/card host and marks generic plus members-only markers. | Title/aria detection can broaden to host without a registry-owned sibling-visible proof. |
| `js/content/dom_fallback.js:2389` | content broad hide | Members-only badge fallback | Hides card/watch host and marks generic plus members-only markers. | Host selector includes watch-shell targets, so a false badge match can hide broad surfaces. |
| `js/content/dom_fallback.js:2395` | content broad hide | Members-only shelf fallback | Hides closest shelf/list around a membership host. | Parent hide can remove nonmatching siblings. |
| `js/content/dom_fallback.js:2407` | content broad hide | Members-only playlist/link fallback | Hides shelf from UUMO/members-only link evidence. | Shelf-level target needs route and sibling-visible proof. |
| `js/content/dom_fallback.js:2420` | content broad hide | Members-only shelf-title fallback | Hides shelf from title text. | Title text can make the whole shelf disappear. |
| `js/content/dom_fallback.js:2447` | content broad hide | Playlist-card lockup fallback | Hides a collection-stack lockup. | Direct writer has no local shared restore report. |
| `js/content/dom_fallback.js:2452` | content broad hide | Playlist-card shelf fallback | Hides closest shelf around a playlist lockup. | One matching lockup can remove a mixed shelf. |
| `js/content/dom_fallback.js:2457` | content broad hide | Playlist-card horizontal-list fallback | Hides closest horizontal list around a playlist lockup. | One matching lockup can remove a mixed horizontal row. |
| `js/content/dom_fallback.js:2469` | shell/control cleanup | Mixes chip fallback | Hides the `Mixes` chip when Mix playlists are hidden. | Control-chip cleanup uses generic hidden marker and can be restored by unrelated generic cleanup. |
| `js/content/block_channel.js:1740` | user-action optimistic hide | Quick block immediate hide | Hides the resolved quick-block target after marking it blocked pending. | Valid user-action UX, but outside shared stats/media/restore authority. |
| `js/content_bridge.js:517` | menu shell cleanup | FilterTube-owned fallback popover close helper | Hides a FilterTube-owned popover only if removal throws. | UI shell writer should be excluded from content hide/stats policy explicitly. |
| `js/content_bridge.js:566` | menu shell cleanup | Native/mobile menu close helper | Hides a mobile/native dropdown and updates accessibility state. | UI shell writer should be excluded from content hide/stats policy explicitly. |
| `js/content_bridge.js:12293` | user-action confirmed hide | Main block flow confirmed hide | Marks blocked confirmed and hides a resolved element. | Confirmation still writes direct visual state outside shared authority. |
| `js/content_bridge.js:6365` | pending hide | Whitelist pending hide | Hides newly observed cards in whitelist mode while identity is pending. | Fail-closed whitelist UX needs TTL, identity outcome, and restore owner. |
| `js/content_bridge.js:7501` | user-action optimistic hide | Fallback menu row immediate hide | Hides the clicked fallback-menu row after block action begins. | User action is valid, but rollback and stats/media policy are local. |
| `js/content_bridge.js:8486` | enrichment hide | Visible Shorts enrichment | Hides visible Shorts containers after a newly blocked channel is learned. | Post-action fanout can affect multiple visible nodes beyond the clicked target. |
| `js/content_bridge.js:8605` | enrichment hide | Playlist-row enrichment | Hides playlist row target and marks `data-filtertube-hidden-by-playlist-enrichment`. | Better marker ownership, but still outside shared writer registry. |
| `js/content_bridge.js:12345` | user-action optimistic hide | Main block flow optimistic hide transaction | Records previous state, marks blocked pending, then hides. | Stronger local rollback model, but not shared with other writers. |
| `js/content_bridge.js:12601` | user-action scoped immediate hide | Collaborator/channel immediate hide | Hides the clicked card target after collaborator/channel block. | The fanout was narrowed, but target and restore policy are still local. |
| `js/content_bridge.js:13337` | user-action immediate hide | Comment context immediate hide | Hides a resolved comment target after block action. | Comment target requires separate comment/surface restore proof. |
| `js/content_bridge.js:13354` | user-action immediate hide | Video/card immediate hide | Hides the clicked video/card target after block action. | Target resolver and restore policy are local to this path. |

## Count Baseline

Current active page-runtime direct `display:none` writes:

| File | Count |
| --- | ---: |
| `js/content/dom_helpers.js` | 1 |
| `js/content/dom_fallback.js` | 11 |
| `js/content/block_channel.js` | 1 |
| `js/content_bridge.js` | 11 |
| **Total** | **24** |

This count intentionally excludes dashboard/popup UI display toggles, legacy
layout normalization, and generated/package output. Those are covered by the
lifecycle and code-burden audits. This register is about active page-runtime
writers that can affect YouTube content or in-page FilterTube affordances.

## Current Risk Classes

| Class | Refs | Why it matters |
| --- | --- | --- |
| Shared helper | `js/content/dom_helpers.js:91` | Correct central visual sink, but still lacks structured writer/report fields. |
| Shell/menu cleanup | `js/content/dom_fallback.js:1576`; `1608`; `2469`; `js/content_bridge.js:517`; `js/content_bridge.js:566` | These should not count as content filtering, but no shared policy says that. |
| Broad-control fallback | `js/content/dom_fallback.js:2367`; `2389`; `2395`; `2407`; `2420`; `2447`; `2452`; `2457` | These can hide parents/shelves/rows and need sibling-visible fixtures. |
| Pending identity | `js/content_bridge.js:6365` | Whitelist fail-closed can be correct, but needs identity outcome and TTL proof. |
| User-action optimistic/confirmed hide | `js/content/block_channel.js:1740`; `js/content_bridge.js:7501`; `12293`; `12345`; `12601`; `13337`; `13354` | User actions justify immediate UX, but rollback, stats, media, and fanout must be explicit. |
| Post-action enrichment hide | `js/content_bridge.js:8486`; `8605` | Successful channel block can hide additional visible Shorts/playlist rows. That needs a post-action fanout budget. |

## Shared Helper External Dependency Boundary

`toggleVisibility()` is the central shared hide/restore sink, but it is not a
local-only visual helper. The file is loaded before `content_bridge.js`, and the
function body resolves several globals only when callers execute a hide or
restore. That means a selector or cache optimization that appears to touch only
visual state can still alter stats, duration extraction, debug tracking, media
pause/restore, and storage writes.

Current external side-effect dependencies:

| Dependency | Helper callsites | Provider | Current effect boundary |
| --- | --- | --- | --- |
| `filteringTracker` | `js/content/dom_helpers.js:76`, `98`, `138` | `js/content_bridge.js:1985`, published at `js/content_bridge.js:2052` | Records hide/restore debug summaries when active. Missing or reordered providers can turn a hide path into a runtime exception. |
| `incrementHiddenStats` | `js/content/dom_helpers.js:77`, `104` | `js/content_bridge.js:3786` | Increments count/time-saved state and can write `stats`/`statsBySurface` through `saveStats()`. |
| `extractVideoDuration` | `js/content/dom_helpers.js:84` | `js/content/dom_extractors.js:244` | Reads the visible DOM before hide; the helper currently discards the local value, but the call can still traverse card metadata. |
| `decrementHiddenStats` | `js/content/dom_helpers.js:143` | `js/content_bridge.js:3859` | Decrements only from `data-filtertube-time-saved`, not a structured hide-decision id. |
| `handleMediaPlayback` | `js/content/dom_helpers.js:107`, `147` | `js/content_bridge.js:3917` | Pauses media on hide and restores autoplay state on restore; this runs even when `skipStats` is true. |

Current dependency counts:

```text
external shared-helper dependency symbols: 5
external shared-helper side-effect callsites: 9
content_bridge-provided dependency symbols: 4
dom_extractors-provided dependency symbols: 1
skipStats-guarded stats/tracker callsites: 5
skipStats-unguarded media callsites: 2
provider guard checks in toggleVisibility: 0
provider try/catch wrappers in toggleVisibility: 0
runtime behavior changed: no
```

This boundary is why a future hide-writer change must prove not only visual
targeting, but also provider load order, missing-provider behavior, stats
policy, media policy, and storage-write policy. The current audit still has no
first-class `sharedHideSideEffectAuthority`.

Current manifest provider load-order boundary:

| Manifest | Helper stack entry | `dom_helpers.js` position | `dom_extractors.js` position | `content_bridge.js` position | Current meaning |
| --- | --- | ---: | ---: | ---: | --- |
| `manifest.json` | second content-script entry, isolated world | 3 | 4 | 13 | Shared helper is declared before extractor and bridge providers. |
| `manifest.chrome.json` | second content-script entry, isolated world | 3 | 4 | 13 | Same byte-identical Chromium-style stack as `manifest.json`. |
| `manifest.firefox.json` | only content-script entry, default world field absent | 3 | 4 | 13 | Firefox shares helper stack order but uses fallback page-world seed injection separately. |
| `manifest.opera.json` | second content-script entry, world field absent | 3 | 4 | 13 | Opera shares helper stack order but lacks explicit world declarations. |

Pinned load-order counts:

```text
manifest helper-stack rows checked: 4
manifest rows with dom_helpers before dom_extractors: 4
manifest rows with dom_extractors before content_bridge: 4
manifest rows with dom_helpers before content_bridge: 4
provider symbols available from a pre-bridge provider file: 1
provider symbols defined only in content_bridge: 4
call-time provider authority: absent
runtime delta from this load-order subsection: no
```

This narrows the earlier provider-load-order proof gap but does not close it.
The manifest stack proves `extractVideoDuration()` is declared after
`toggleVisibility()` and before `content_bridge.js`. It also proves
`filteringTracker`, `incrementHiddenStats()`, `decrementHiddenStats()`, and
`handleMediaPlayback()` are not provider-ready until the final helper-stack
script has run. Therefore load order is a current source fact, not permission to
change hide timing, stats/media coupling, or early lifecycle callbacks.

## Lane Promotion Addendum - 2026-06-01

The executable proof now compares the manifest helper-stack table above against
the live browser manifests instead of pinning a second hardcoded index set in
the test file. Current source still loads `dom_helpers.js`,
`dom_extractors.js`, and `content_bridge.js` at positions `3`, `4`, and `13`
in all four manifests.

This register is now owned by `test:dom` through
`tests/runtime/direct-hide-writer-register-current-behavior.test.mjs`,
`scripts/test-lane-config.mjs`, and `docs/audit/TEST_LANE_MATRIX.md`.
Runtime behavior is unchanged. This only promotes the existing visual-writer
proof into the focused DOM lane so future visual hide/restore, broad-hide,
CSS hide, or visibility-cleanup changes cannot skip the direct writer source
order check.

Current missing-provider behavior is source-order dependent:

| Scenario | Current result | Risk |
| --- | --- | --- |
| `extractVideoDuration` is absent and `skipStats === false` on a new hide | Throws before `.filtertube-hidden`, `data-filtertube-hidden`, or inline `display:none!important` are written. | The card remains visible, but the caller can abort the remaining pass. |
| `extractVideoDuration` exists but `filteringTracker` is absent on a new counted hide | Throws after `.filtertube-hidden`, `data-filtertube-hidden`, and inline `display:none!important` are written. | A visually hidden card can remain without stats or tracker state. |
| `skipStats === true` and `handleMediaPlayback` is absent on a new hide | Throws after visual hide markers and inline display are written. | Cleanup/container paths can leave a visual hide even though the helper raised. |
| `skipStats === true` and `handleMediaPlayback` is absent on restore | Throws after hidden markers and inline display are removed. | Restore can visually succeed while still surfacing an exception to the caller. |

Pinned executable missing-provider scenarios:

```text
missing-provider scenarios pinned: 4
missing-provider paths that mutate before throwing: 3
missing-provider paths that throw before visual mutation: 1
runtime behavior changed: no
```

Current source-order failure map:

```text
toggleVisibility(new hide, skipStats=false)
  -> extractVideoDuration(element)
      missing provider: throw before visual hide
  -> add .filtertube-hidden / data-filtertube-hidden / display:none!important
  -> filteringTracker.recordHidden()
      missing provider: throw after visual hide
  -> incrementHiddenStats(...)
  -> handleMediaPlayback(element, true)

toggleVisibility(new hide or restore, skipStats=true)
  -> visual hide/restore markers and inline display mutation
  -> handleMediaPlayback(...)
      missing provider: throw after visual mutation
```

## Missing Runtime Authority

No runtime symbol exists today for:

- `hideWriterRegistry`
- `hideWriterDecision`
- `hideRestoreAuthority`
- `directHideWriterReport`
- `displayWriterStatsPolicy`
- `displayWriterRestoreOwner`
- `sharedHideSideEffectAuthority`

## Future Proof Required Before Changing A Writer

Any behavior patch that touches one of these writers must first provide:

1. writer id and owner,
2. route and surface,
3. target kind and selector family,
4. source tier and identity confidence,
5. list mode and profile/viewing-space state,
6. matched rule or user-action reason,
7. stats policy,
8. media/playback policy,
9. fanout budget when more than one target is touched,
10. restore owner and disabled/no-rule cleanup path,
11. positive matching fixture,
12. negative nonmatching or sibling-visible fixture,
13. stale/recycled-node fixture when the target can be reused by YouTube.

Until that exists, direct display writers are current-behavior facts and remain
implementation blockers, not cleanup permission.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this side-effect writer register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
