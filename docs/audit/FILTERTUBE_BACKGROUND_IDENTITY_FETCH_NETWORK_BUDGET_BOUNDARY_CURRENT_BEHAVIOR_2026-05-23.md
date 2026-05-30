# FilterTube Background Identity Fetch Network Budget Boundary - Current Behavior

Date: 2026-05-23

Status: current-behavior proof only. This is not an implementation patch, not a
network policy implementation, and not approval to change filtering, whitelist,
JSON mutation, DOM mutation, storage, message, cache, fetch, or lifecycle
behavior.

## Scope

This slice pins the background identity-fetch network path that can affect
whitelist decisions, JSON-first identity repair, false-hide/leak outcomes, and
page-load performance. It extends the earlier trigger-chain note by pinning the
current background helpers, cache/pending behavior, credentialed request shapes,
and selected content callers.

background identity fetch network budget boundary source files: 4
background identity fetch network budget source/effect blocks: 13

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/content/handle_resolver.js` | 282 | 9785 | `67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |

## Source / Effect Blocks

- background handleFetchShortsIdentityMessage block: line 2666, 42 lines, 1658 bytes
- background handleFetchWatchIdentityMessage block: line 2708, 28 lines, 1054 bytes
- background performShortsIdentityFetch block: line 2879, 67 lines, 2543 bytes
- background performKidsWatchIdentityFetch block: line 2980, 94 lines, 3605 bytes
- background performWatchIdentityFetch block: line 3074, 93 lines, 3584 bytes
- background fetchShorts/fetchWatch action branch block: line 3975, 7 lines, 272 bytes
- background fetchChannelDetails branch block: line 4463, 12 lines, 607 bytes
- background fetchChannelInfo block: line 4558, 751 lines, 32503 bytes
- content_bridge fetchWatchIdentityFromBackground block: line 8451, 56 lines, 2118 bytes
- content_bridge fetchChannelFromShortsUrl block: line 8634, 69 lines, 2661 bytes
- content_bridge fetchChannelFromShortsUrlDirect block: line 8703, 124 lines, 6367 bytes
- handle_resolver fetchIdForHandle block: line 149, 134 lines, 4787 bytes
- dom_fallback unresolved handle escalation block: line 4758, 53 lines, 3572 bytes

## Selected Token Counts

background message/cache blocks:

- handleFetchShortsIdentityMessage `pendingShortsIdentityFetches`: 4
- handleFetchShortsIdentityMessage `shortsIdentitySessionCache`: 3
- handleFetchShortsIdentityMessage `sendResponse`: 5
- handleFetchWatchIdentityMessage `sendResponse`: 5
- performKidsWatchIdentityFetch `pendingKidsWatchIdentityFetches`: 4
- performKidsWatchIdentityFetch `kidsWatchIdentitySessionCache`: 2
- performWatchIdentityFetch `pendingWatchIdentityFetches`: 4
- performWatchIdentityFetch `watchIdentitySessionCache`: 2

background credentialed fetch blocks:

- performShortsIdentityFetch `fetch(`: 1
- performShortsIdentityFetch `credentials`: 1
- performShortsIdentityFetch `include`: 1
- performShortsIdentityFetch `AbortController`: 1
- performShortsIdentityFetch `setTimeout`: 1
- performShortsIdentityFetch `clearTimeout`: 1
- performKidsWatchIdentityFetch `fetch(`: 1
- performKidsWatchIdentityFetch `credentials`: 1
- performKidsWatchIdentityFetch `include`: 1
- performKidsWatchIdentityFetch `AbortController`: 1
- performKidsWatchIdentityFetch `setTimeout`: 1
- performKidsWatchIdentityFetch `clearTimeout`: 1
- performWatchIdentityFetch `fetch(`: 1
- performWatchIdentityFetch `credentials`: 1
- performWatchIdentityFetch `include`: 1
- performWatchIdentityFetch `AbortController`: 1
- performWatchIdentityFetch `setTimeout`: 1
- performWatchIdentityFetch `clearTimeout`: 1
- fetchChannelInfo `fetch(`: 3
- fetchChannelInfo `credentials`: 3
- fetchChannelInfo `include`: 2

content caller blocks:

- fetchWatchIdentityFromBackground `browserAPI_BRIDGE.runtime.sendMessage`: 1
- fetchChannelFromShortsUrl `browserAPI_BRIDGE.runtime.sendMessage`: 1
- fetchChannelFromShortsUrl `allowDirectFetch`: 3
- fetchChannelFromShortsUrlDirect `fetch(`: 1
- fetchChannelFromShortsUrlDirect `credentials`: 1
- fetchChannelFromShortsUrlDirect `same-origin`: 1
- fetchIdForHandle `fetch(`: 1
- fetchIdForHandle `credentials`: 1
- fetchIdForHandle `same-origin`: 1
- fetchIdForHandle `fetchChannelDetails`: 1
- fetchIdForHandle `FilterTube_UpdateChannelMap`: 2
- fetchIdForHandle `scheduleDomFallbackRerun`: 2
- unresolved handle escalation `fetchIdForHandle`: 2
- unresolved handle escalation `skipNetwork`: 1
- unresolved handle escalation `backgroundOnly`: 1
- unresolved handle escalation `__filtertubeActiveHandleResolveState`: 2
- unresolved handle escalation `__filtertubeActiveHandleResolveAttempts`: 2
- unresolved handle escalation `10 * 60 * 1000`: 2
- unresolved handle escalation `1500`: 1

missing policy tokens in the selected background blocks:

- `identityFetchAuthority`: 0
- `networkAuthority`: 0
- `activeRuleReason`: 0
- `fetchBudget`: 0
- `request.reason`: 0
- `request.route`: 0
- `request.tabId`: 0
- `isTrustedUiSender`: 0
- `isProfileSessionAuthorized`: 0

## Current Behavior Pinned

1. Background `fetchShortsIdentity` validates an 11-character video id, caches
   by video id plus expected handle, dedupes with `pendingShortsIdentityFetches`,
   and can call a credentialed Shorts HTML fetch.
2. Background `fetchWatchIdentity` validates an 11-character video id and uses
   caller-provided profile type to choose Kids-first or Main watch identity
   fetching.
3. Shorts, Main watch, and Kids watch background helpers use
   `AbortController`, timeout timers, credentialed HTML fetches, streaming
   preview reads, partial stream limits, and session/pending caches.
4. The background action branch for `fetchShortsIdentity` and
   `fetchWatchIdentity` forwards caller requests to the helpers without a local
   trusted-sender, tab, route, reason, active-rule, or budget policy.
5. The `fetchChannelDetails` branch calls `fetchChannelInfo()` directly, and
   `fetchChannelInfo()` can make credentialed YouTube channel fetches including
   handle fallback fetches.
6. Content bridge watch and Shorts callers send background identity requests;
   Shorts can optionally use a direct same-origin `/shorts/{id}` fetch only
   when `allowDirectFetch` reaches that path.
7. `fetchIdForHandle()` can use a background `fetchChannelDetails` request,
   direct same-origin handle page fetches, learned-map page messages, and DOM
   fallback reruns.
8. DOM fallback unresolved-handle repair can escalate from an active fallback
   pass into `fetchIdForHandle(..., { skipNetwork: true, backgroundOnly: true })`;
   `skipNetwork` avoids the direct content fetch path but still permits the
   background channel-detail fetch path.

## Risk Boundary

| Surface | Current behavior | Risk before optimization or JSON-first promotion |
| --- | --- | --- |
| Background watch/Shorts identity | Credentialed HTML fetch with validation, pending dedupe, and partial stream limits. | Missing reason/route/profile/tab budget can make identity repair look cheaper or safer than it is. |
| Kids watch identity | Kids fetch can fall back to Main watch identity in the message helper. | Profile-specific leak/allow proof needs explicit Kids/Main decision and result provenance. |
| Channel detail identity | `fetchChannelDetails` can fetch channel HTML for caller input. | Caller-triggered enrichment can amplify page work unless it has sender class, action reason, and cache budget proof. |
| Direct Shorts fallback | Content bridge direct fetch is gated by `allowDirectFetch` in the selected path. | User-action-only intent is not a shared runtime policy and needs fixture provenance. |
| Handle resolver | Background-only mode still permits background network and map writes. | A future no-work optimization must not treat `skipNetwork` as meaning no network at all. |
| DOM unresolved handles | Active fallback passes can rotate through unresolved handles and schedule repair attempts. | Whitelist/blocklist identity fixes need active-rule reason, per-input throttling, and DOM rerun budgets. |

## Non-Completion Boundary

This slice does not close network authority, identity fetch authority, whitelist
decision safety, or JSON-first promotion readiness. Product runtime source still
lacks:

- `backgroundIdentityFetchNetworkBudgetContract`
- `backgroundIdentityFetchSenderPolicy`
- `backgroundIdentityFetchReasonReport`
- `backgroundIdentityFetchRouteProfileReport`
- `backgroundIdentityFetchCredentialPolicy`
- `backgroundIdentityFetchCacheBudgetReport`
- `backgroundIdentityFetchActiveRuleGate`
- `backgroundIdentityFetchDirectFallbackPolicy`
- `backgroundIdentityFetchDomEscalationReport`
- `backgroundIdentityFetchMetricArtifact`

Required proof before implementation work:

- sender class and tab/url proof for each identity fetch action,
- reason codes for user action, active unresolved rule, DOM repair, and menu
  enrichment,
- profile/list-mode/surface proof for Main, Kids, Shorts, watch, and channel
  details,
- cache hit/miss, pending-dedupe, timeout, and partial-stream budget metrics,
- direct content fetch versus background fetch provenance,
- false-hide/false-allow fixtures for stale, unresolved, and mismatched identity,
- DOM rerun and learned-map write budgets after identity repair.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
