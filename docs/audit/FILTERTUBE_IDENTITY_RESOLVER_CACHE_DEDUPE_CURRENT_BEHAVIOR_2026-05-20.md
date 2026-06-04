# FilterTube Identity Resolver Cache/Dedupe - Current Behavior - 2026-05-20

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

The identity waterfall and network fetch reason matrix prove that fallback
resolvers still exist. This register pins the narrower performance and
correctness question:

```text
resolver is requested
        |
        v
is the request already cached, pending, queued, rate-limited, or allowed to fan
out after a user action?
```

Resolver cache/dedupe is not the same as resolver authority. Current source has
useful local caches and pending maps, but no shared decision report that ties
them to route, profile, list mode, active rule state, clicked target, visible
sibling fanout, credential policy, and follow-up side effects.

## Current Resolver State Surfaces

| Resolver surface | Current cache / pending state | Current key | Current follow-up effect | Audit risk |
| --- | --- | --- | --- | --- |
| Background Shorts identity | `shortsIdentitySessionCache` and `pendingShortsIdentityFetches`. | `videoId` or `videoId:normalizedHandle`. | Returns identity to content bridge and may reuse stored `videoChannelMap` identity before network. | Good per-key coalescing, but no route/profile/list-mode/no-rule budget decides whether the request should have been made. |
| Background Main watch identity | `watchIdentitySessionCache` and `pendingWatchIdentityFetches`. | `videoId`. | Returns Main watch identity, merges stored video identity, and stores session identity on success. | Coalesces by video id but does not distinguish caller reason, route, or clicked target. |
| Background Kids watch identity | `kidsWatchIdentitySessionCache` and `pendingKidsWatchIdentityFetches`. | `videoId`. | Tries Kids public watch HTML before Main watch fallback through `handleFetchWatchIdentityMessage()`. | Kids and Main fallback order is profile-sensitive, but the cache key does not encode profile once inside the per-profile function. |
| Content-side watch identity bridge | `backgroundWatchIdentityInFlight`. | `videoId:normalizedExpectedHandle`. | Sends `fetchWatchIdentity`, validates expected handle, returns normalized identity. | Coalesces duplicate content calls, but all request reasons share the same pending map. |
| Content-side Shorts identity bridge | `pendingShortsFetches`. | `videoId`. | Reads current `videoChannelMap`, asks background, and optionally falls back to direct `/shorts/VIDEO_ID` only when allowed. | Coalesces by video id, but expected-handle variants are not part of this content-side key. |
| Handle resolver | `resolvedHandleCache` with a `PENDING` sentinel. | normalized handle core without `@`. | Reads `channelMap`, may call background channel details or direct `/@handle/about`, posts `FilterTube_UpdateChannelMap`, and schedules DOM fallback rerun. | Pending state returns `null` to callers rather than a shared promise, so callers can lose identity instead of awaiting the first resolver. |
| Watch metadata fetch | `pendingWatchMetaFetches`, `queuedWatchMetaFetches`, `watchMetaFetchQueue`, `lastWatchMetaFetchAttempt`, and `activeWatchMetaFetches`. | `videoId`. | Fetches watch HTML metadata, updates `videoMetaMap`, and can rerun DOM fallback. | This has concurrency and one-minute retry spacing, but metadata fetch permission is separate from active content/category/date/duration rules. |
| Fallback menu pending enrichment | `pendingDropdownFetches`. | dropdown element identity. | Stores channel info promise, collaborator promise, cancellation flag, and initial snapshot for later block action. | Scoped to a menu instance, but not a global fetch budget. Dropdown cleanup cancels local use, not necessarily all started async work. |
| Post-block background enrichment | `postBlockEnrichmentAttempted`, `queuedPostBlockEnrichmentKeys`, `pendingPostBlockEnrichments`, and serial `postBlockEnrichmentWorker`. | `profile:channelId`. | Delays and serializes `handleAddFilteredChannel(... source: postBlockEnrichment)`, then can update channel details before backups. | Good six-hour dedupe and serial worker, but it is intentionally post-action fanout and must not be mistaken for passive filtering. |

## Current Flow Diagram

```text
clicked/visible/unresolved target
        |
        +-- content-side cache/pending map
        |       |
        |       +-- hit: reuse promise or mapped identity
        |       +-- miss: send background resolver request
        |
        +-- background cache/pending map
                |
                +-- hit: return session/stored identity
                +-- miss: fetch watch/Shorts/Kids/channel HTML with timeout
                        |
                        +-- identity found: cache + return
                        +-- no identity: return stored partial or not_found
```

Post-action enrichment is a different shape:

```text
successful block by UC id
        |
        +-- visible Shorts enrichment, batch concurrency 3
        +-- visible playlist-row enrichment, batch concurrency 3
        +-- background delayed channel-detail enrichment, six-hour key window
```

The first flow is exact-target or resolver recovery. The second flow is
visible-sibling and channel-detail fanout after a user action. They need
different future budgets.

## Source Proof

- `js/background.js:929-938` declares Shorts/watch/Kids session caches,
  pending maps, post-block attempted state, queue set, pending enrichment map,
  and serial worker.
- `js/background.js:1108-1167` dedupes post-block enrichment by
  `profile:channelId`, applies a six-hour window unless forced, delays the
  work, serializes it through `postBlockEnrichmentWorker`, and clears pending
  state in `finally`.
- `js/background.js:2665-2703` validates Shorts video ids, normalizes expected
  handles, checks session and pending caches, stores successful identities, and
  deletes pending state in `finally`.
- `js/background.js:2984-3068` reads stored video identity, checks Kids session
  cache, coalesces pending Kids watch fetches, fetches Kids watch HTML with a
  timeout, stores session identity, and clears pending state.
- `js/background.js:3071-3161` checks Main watch session cache, coalesces
  pending watch fetches, merges stored video identity, fetches watch HTML with a
  timeout, stores session identity, and clears pending state.
- `js/content_bridge.js:1610-1712` manages watch metadata pending/queued maps,
  one-minute retry spacing, a 3000-key trim, queueing, and concurrency of 3.
- `js/content_bridge.js:7867-7920` coalesces content-side watch identity
  requests by `videoId:expectedHandle` and clears in-flight state in `finally`.
- `js/content_bridge.js:7848-7917` and `js/content_bridge.js:7980-8115` batch
  visible Shorts and playlist-row post-action enrichment with concurrency 3.
- `js/content_bridge.js:8066-8116` reads mapped Shorts identity first, coalesces
  pending Shorts fetches by video id, asks background, and only uses direct
  `/shorts` fetch when `allowDirectFetch === true`.
- `js/content_bridge.js:466-489` cancels and removes dropdown-scoped pending
  menu enrichment state during dropdown cleanup.
- `js/content_bridge.js:10480-10780` stores menu-open enrichment promises in
  `pendingDropdownFetches`, avoids direct network for main-world lookups, uses
  `fetchIdForHandle(..., { skipNetwork: true })`, and still has a later
  `fetchChannelDetails` name-enrichment path when no video id is available.
- `js/content/handle_resolver.js:133-279` stores resolved handle cache entries,
  uses a `PENDING` sentinel, reads `channelMap`, optionally asks background,
  optionally fetches `/@handle/about` and `/@handle`, posts learned mappings,
  schedules DOM fallback rerun, and deletes pending state on failure.

## Current Risk Conclusions

| Risk | Current proof | Required future decision |
| --- | --- | --- |
| Empty/no-rule performance | Cache and pending maps reduce duplicate resolver work, but they do not prevent the first request if another owner asks for identity. | `noRuleResolverCounter` proving no resolver request is made in disabled/no-actionable-rule states. |
| False hide / stale identity | Resolver caches can return stored or session identities without an owner/effect report tying the value to the current visible target. | `resolverSourceConfidenceDecision` with exact target, join key, cache age/class, and allowed effects. |
| YouTube-visible side effects | Background watch/Shorts/Kids/channel fetches use credentials and timeouts; post-block enrichment is delayed and serial but still network-visible. | `resolverFetchBudget` with reason, profile, route, credential policy, per-navigation cap, retry cap, and post-action fanout cap. |
| Lost identity under pending handle resolution | `resolvedHandleCache` uses `PENDING` and returns `null` rather than sharing the pending promise. | `handleResolverPendingPolicy` deciding whether callers should await, retry, or continue with display-only identity. |
| Overbroad post-action fanout | Visible Shorts/playlist enrichment and background post-block enrichment can do more work than the clicked target. | `postActionResolverFanoutBudget` separating exact clicked target repair from visible-sibling cleanup and delayed channel-detail enrichment. |

## Required Future Resolver Budget Record

```text
identityResolverCacheDecision
  owner
  resolver reason
  route/surface
  profile id/type and viewing space
  list mode and active rule family
  user action class: passive | menu-open | clicked-target | post-action | import
  target scope: exact target | visible siblings | delayed channel repair
  cache key and cache class
  pending coalescing policy
  retry/rate-limit policy
  concurrency budget
  credential policy
  follow-up map/storage/DOM/stats effects
  positive fixture
  negative no-rule fixture
```

No runtime symbol exists yet for:

- `identityResolverCacheDecision`
- `identityResolverDedupeAuthority`
- `resolverFetchBudget`
- `noRuleResolverCounter`
- `postActionResolverFanoutBudget`
- `handleResolverPendingPolicy`

This register is not permission to remove fallbacks. It proves that resolver
work is partially coalesced today, while the authority deciding whether that
work may start is still split across content bridge, background, DOM fallback,
menu actions, and post-block enrichment.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity resolver cache dedupe register
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
