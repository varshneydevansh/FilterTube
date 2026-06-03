# FilterTube Identity Work Budget - Current Behavior - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

The documented identity waterfall:

```text
XHR JSON -> ytInitial* -> DOM -> network fetch
```

describes preferred source order. It does not answer a separate question:

```text
When is FilterTube allowed to spend work to find, store, stamp, refilter,
or fetch identity?
```

That second question is the identity work budget. Without it, an empty or
no-actionable-rule state can still pay for page-global hooks, JSON parse work,
harvest-only walks, learned-map writes, DOM stamping, DOM fallback reruns,
stale cleanup scans, and background identity resolvers. A successful user block
can also trigger post-action enrichment beyond the clicked card.

## Source Confidence Is Not Work Permission

```text
source confidence
  answers: how trustworthy is this identity?

work budget
  answers: should this route/settings/action state spend CPU, DOM, storage,
           or network work to obtain or propagate this identity?
```

Both are required. A future optimization must not delete needed identity
fallbacks simply because JSON is preferred, and it must not keep broad identity
work alive simply because identity might be useful later.

## Current Work Classes

| Work class | Current source proof | Why it matters |
| --- | --- | --- |
| `endpoint-body-work` | `js/seed.js` wraps fetch/XHR endpoints and can call `response.clone().json()`, `JSON.parse(trimmed)`, `processWithEngine(...)`, and `JSON.stringify(processed)`. | Empty installs and no-actionable-rule states can still pay endpoint body cost before a shared no-work authority exists. |
| `harvest-only-work` | `processWithEngine()` can call `window.FilterTubeEngine.harvestOnly(...)` when engine mutation is skipped for search/home/channel layouts. | This keeps learned identity fresh but still walks payloads and can stash snapshots. |
| `page-global-hook-work` | Fetch, XHR, `ytInitialData`, and `ytInitialPlayerResponse` hooks are installed as page-lifetime instrumentation. XHR has `window.__filtertubeXhrInterceptionInstalled`. | Source hooks are not zero-cost passive claims; patch ownership and restore/idempotence still need authority. |
| `learned-map-write-work` | `FilterTube_UpdateChannelMap`, `FilterTube_UpdateVideoChannelMap`, `persistVideoChannelMapping(videoId, channelId)`, `enqueueVideoChannelMapUpdate(...)`, and background cache flushes persist learned identity. | Map writes can affect later menu/filter decisions and storage/cache invalidation even when the original page did not hide anything. |
| `dom-stamp-rerun-work` | Video-channel map updates stamp `[data-filtertube-video-id]` cards, try matching anchors, call `stampChannelIdentity(...)`, then schedule `applyDOMFallback(null)` in `requestAnimationFrame`. | A learned identity update can wake DOM work and rerun fallback outside the original endpoint decision. |
| `metadata-map-work` | `FilterTube_UpdateVideoMetaMap`, `persistVideoMetaMapping(...)`, `touchDomForVideoMetaUpdate(...)`, `scheduleVideoMetaDomRerun()`, and `applyDOMFallback(null)` propagate video metadata. | Metadata maps are useful for duration/date/category decisions, but currently share no one active predicate budget. |
| `target-resolver-fetch` | `fetchChannelFromShortsUrl(...)`, `fetchWatchIdentityFromBackground(...)`, `performShortsIdentityFetch(videoId, ...)`, `performKidsWatchIdentityFetch(videoId)`, and `performWatchIdentityFetch(videoId)` resolve sparse Shorts/watch/Kids targets. | These are last-resort identity resolvers, but they still need reason codes, route state, cache state, and concurrency budget. |
| `post-action-fanout` | After a successful channel block, `enrichVisibleShortsWithChannelInfo(channelInfo.id, ...)` and `enrichVisiblePlaylistRowsWithChannelInfo(channelInfo.id, ...)` can inspect visible Shorts/playlist rows missing owner maps. | This is intentionally broader than the clicked target so same-channel visible rows can hide, but it needs an explicit user-action fanout budget. |
| `stale-restore-scan` | `applyDOMFallback(...)` can call `clearStaleDOMFallbackVisibility()` when no active fallback work exists but cleanup is due. | Cleanup protects restore behavior, but it can still query hidden markers on no-active-rule paths. |

## Current No-Rule And Empty-State Boundary

The pure engine can leave simple videos intact in empty blocklist mode, but the
page runtime still has independent work surfaces:

```text
installed hooks
  -> endpoint match
  -> clone/parse/stringify or XHR parse/override
  -> harvest-only walks
  -> learned map writes
  -> DOM stamping
  -> applyDOMFallback reruns
  -> stale marker cleanup
```

The current source has partial skips. It does not have one runtime authority
that says:

- no endpoint body work,
- no harvest work,
- no map writes,
- no DOM stamp/rerun,
- no stale cleanup scan,
- no resolver fetch,
- no post-action fanout,

for a given disabled, empty, no-actionable-rule, route, mode, and profile
state.

## Current Post-Action Fanout Boundary

The user action "block this channel" is not limited to one clicked card after
storage succeeds:

```text
clicked menu target
  -> optimistic hide clicked target
  -> persist channel rule
  -> refresh settings
  -> applyDOMFallback(forceReprocess)
  -> enrich visible Shorts for the blocked UC id
  -> enrich visible playlist rows for the blocked UC id
  -> maybe persist videoChannelMap / channelMap
  -> maybe hide matching visible rows
  -> maybe rerun DOM fallback again
```

That behavior may be desirable for immediate same-channel cleanup, especially on
Shorts and playlist rows that only expose a video id in DOM. It is still
observable work and must become budgeted before performance pruning or network
claims are made.

Important nuance: current Shorts enrichment calls
`fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false })`, so that
path avoids the content-script direct `/shorts/...` fetch fallback. It can still
ask the background resolver to fetch Shorts identity if storage/session caches
do not already prove the owner. Playlist enrichment can call
`fetchWatchIdentityFromBackground(videoId)`.

## Why This Matters For The User-Reported Symptoms

| Symptom | Work-budget interpretation |
| --- | --- |
| Empty install feels slower than plain YouTube. | The runtime can still patch page APIs, parse endpoint bodies, harvest identity, and run lifecycle/restore work even when no visible rules exist. |
| A nonmatching search result disappears. | Source confidence, active rule state, hide target, and restore ownership are split; identity work can wake DOM fallback, but hide decisions still need a separate `hideDecisionAuthority`. |
| Blocking a channel seems to influence recommendations. | Passive filtering should not prefetch or engage with content. Current post-action enrichment is user-action-scoped, but network and DOM fanout need explicit reporting and limits. |
| JSON-first sounds complete but watch/Shorts still need fallback. | Some surfaces expose only video ids or delayed/sparse owner data. The budget must keep sparse-surface fallbacks while preventing unnecessary work elsewhere. |

## Required Future Budget Record

Before changing identity work, the patch must record:

```text
identityWorkBudgetDecision
  route/surface
  profile id/type and viewing space
  enabled/disabled state
  blocklist/whitelist mode
  active rule families and empty/non-empty lists
  user-action class: passive, clicked-target, explicit-import, restore-cleanup
  target scope: exact target, visible siblings, whole surface, none
  source tier: canonical, joinedByVideoId, displayOnly, fallback, unknown
  allowed work classes
  max resolver concurrency
  cache/map read policy
  map write policy
  DOM stamp/rerun policy
  network credential policy
  retry/timeout/fanout limits
  side-effect and restore report
```

## Current Missing Runtime Authority

No runtime symbol exists yet for:

- `identityWorkBudget`
- `identityWorkBudgetReport`
- `identityWorkBudgetDecision`
- `postActionIdentityFanoutBudget`
- `noRuleIdentityWorkCounter`

Until those exist, the current audit verdict is:

```text
The identity waterfall names preferred sources.
The identity work budget is still split across seed, content bridge,
DOM fallback, background cache, and background fetch paths.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity work budget can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
