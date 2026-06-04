# FilterTube Identity Resolver And Fanout Authority - Current Behavior - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This slice narrows the identity work-budget finding into the resolver layer:
which identity lookups are passive menu enrichment, clicked-target recovery,
DOM fallback repair, background resolver fetches, or post-action fanout.

The current runtime has useful local guardrails, but no single
`identityResolverAuthority` that records why a resolver was allowed to run, who
requested it, which route/profile/list state needed it, whether network was
allowed, and what DOM/storage side effects were allowed afterward.

## Resolver Classes

| Resolver class | Current source proof | Current boundary |
| --- | --- | --- |
| `menu-open-mainworld-lookup` | `injectFilterTubeMenuItem(...)` can set `initialChannelInfo.needsFetch = true` and run `searchYtInitialDataForVideoChannel(...)` while the dropdown is open. Handle lookup uses `fetchIdForHandle(..., { skipNetwork: true })`. | This is intended to avoid page/network fetch during hover/open, but it is not one enforceable resolver policy. Later name enrichment can still ask the background for channel details when no `videoId` exists. |
| `clicked-target-videoid-recovery` | `handleBlockChannelClick(...)` can turn a sparse clicked target into `watch:VIDEO_ID` or `shorts:VIDEO_ID` input when no stable channel identifier exists. Watch playlist rows can prefer `watch:VIDEO_ID` over a bare mapped UC id to recover handle/custom URL. | This is user-action scoped and often correct, but needs a target-scope and persistence-quality report. |
| `clicked-target-retry-fallback` | If initial blocking fails, the click path retries from `ytInitialData`, then background `watch:VIDEO_ID`, then legacy direct watch page fallback, then Shorts helper with `{ allowDirectFetch: true }` when applicable. | Direct content-script page fetch is still present as a late clicked-target fallback and must remain user-action only. |
| `dom-fallback-handle-repair` | `js/content/dom_fallback.js` can call `fetchIdForHandle(..., { skipNetwork: true, backgroundOnly: true })`; `js/content/handle_resolver.js` then sends `fetchChannelDetails`. | `skipNetwork` only prevents page-context fetch. The `backgroundOnly` path can still become a credentialed background channel-page fetch plus map write and DOM fallback rerun. |
| `background-shorts-identity` | `fetchChannelFromShortsUrl(...)` sends `fetchShortsIdentity`; background handles `fetchShortsIdentity` and may call `performShortsIdentityFetch(videoId, ...)`, which fetches `https://www.youtube.com/shorts/${videoId}` after cache/map checks. | Useful for video-id-only Shorts surfaces, but current background receiver does not carry route/profile/list/user-action reason in the request contract. |
| `background-watch-identity` | `fetchWatchIdentityFromBackground(videoId)` sends `fetchWatchIdentity`; background can call `performWatchIdentityFetch(videoId)`, fetching `https://www.youtube.com/watch?v=${videoId}` after session/map checks. | Useful for watch/playlist rows with sparse owner data, but must be budgeted by exact target or post-action fanout. |
| `background-kids-watch-identity` | `handleFetchWatchIdentityMessage(...)` chooses `performKidsWatchIdentityFetch(videoId)` when `profileType === 'kids'`; that fetches `https://www.youtubekids.com/watch?v=${videoId}` before falling back to Main watch identity if needed. | Kids is not zero-network in all cases. It is a guarded last-resort resolver that needs explicit Kids route/profile proof. |
| `post-block-shorts-fanout` | After a successful block with `channelInfo.id`, `enrichVisibleShortsWithChannelInfo(...)` scans visible Shorts, fetches unmapped identities through `fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false })`, writes `videoChannelMap`, hides same-channel Shorts, then may refresh settings and rerun DOM fallback. | This avoids content-script direct fetch, but can still invoke background Shorts identity fetches for multiple visible rows. |
| `post-block-playlist-fanout` | After the same successful block, `enrichVisiblePlaylistRowsWithChannelInfo(...)` scans playlist rows, uses `videoChannelMap` first, calls `fetchWatchIdentityFromBackground(videoId)` for misses, persists maps, stamps rows, hides same-channel rows, and reruns DOM fallback. | This prevents playlist leaks, but can scan/fetch visible siblings beyond the clicked target. |

## Flow Diagram

```text
menu open
  -> DOM extraction
  -> main-world ytInitialData search
  -> handle cache lookup with skipNetwork
  -> possible background channel-details name enrichment when no videoId exists

click block
  -> exact clicked card optimistic hide
  -> addChannelDirectly(input)
      input can be UC | @handle | custom URL | watch:VIDEO_ID | shorts:VIDEO_ID
  -> retry stack if needed:
       ytInitialData
       background watch resolver
       legacy direct watch page fetch
       Shorts helper with allowDirectFetch:true
  -> persist rule
  -> force DOM fallback
  -> post-block Shorts and playlist fanout by blocked UC id
```

## Current Guardrails Worth Preserving

- Menu injection exits in whitelist mode and when `showBlockMenuItem === false`.
- Menu-open handle lookup uses `fetchIdForHandle(..., { skipNetwork: true })`.
- Post-block Shorts fanout calls `fetchChannelFromShortsUrl(..., { allowDirectFetch: false })`, so the content-script direct `/shorts/...` fallback is not used there.
- Playlist fanout uses `videoChannelMap` before background watch fetch.
- Background watch/Shorts/Kids resolvers check video-id shape, in-flight maps, session caches, stored `videoChannelMap`, and partial stream limits before or during fetch.
- Immediate optimistic hide is scoped to the clicked target before the later DOM fallback/fanout pass.

These are local guardrails, not a shared authority.

## Current Missing Authority

No runtime symbol exists yet for:

- `identityResolverAuthority`
- `identityResolverDecision`
- `identityResolverReason`
- `identityResolverTargetScope`
- `identityResolverNetworkPolicy`
- `postActionIdentityFanoutBudget`

The missing authority must distinguish:

```text
passive menu enrichment
clicked exact-target recovery
post-action visible-sibling fanout
DOM fallback unresolved-rule repair
explicit import/subscription workflows
debug/manual repair
```

## Required Future Resolver Report

Before changing any resolver, fallback, or fanout path, the patch must report:

```text
identityResolverDecision
  owner module and function
  sender class and tab/url proof
  user-action class
  profile id/type and viewing space
  list mode and active rule family
  route/surface
  input kind: UC id | handle | custom URL | videoId | watch:videoId | shorts:videoId
  source tier before resolver
  exact target versus visible-sibling fanout
  cache/session/map hit or miss
  network policy: none | page-context | background | credentials included
  max rows / max concurrency / timeout
  allowed writes: channelMap | videoChannelMap | videoMetaMap | DOM stamp | DOM fallback rerun
  restore behavior for optimistic hides
```

Until this exists, the safe audit verdict is:

```text
Network fallback is not one thing.
It is a set of resolver classes with different trigger, target, storage,
DOM, and user-action semantics.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity resolver fanout register can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
