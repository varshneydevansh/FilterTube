# FilterTube Background Identity Fetch Trigger Chain Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.
Runtime behavior remains unchanged.

This slice connects a previously split network finding into one causal chain:
an active DOM fallback pass can start unresolved-handle repair, the content
resolver can delegate to the background, the background can fetch YouTube
channel HTML, and a successful result can write learned identity and schedule
another DOM fallback pass.

## Current Chain

```text
DOM fallback unresolved-handle repair
  js/content/dom_fallback.js:4758-4804
  -> fetchIdForHandle(`@${safeKey}`, { skipNetwork: true, backgroundOnly: true })

content handle resolver
  js/content/handle_resolver.js:200-224
  -> browserAPI_BRIDGE.runtime.sendMessage({ action: 'fetchChannelDetails' })
  -> window.postMessage({ type: 'FilterTube_UpdateChannelMap', source: 'content_bridge' }, '*')
  -> scheduleDomFallbackRerun()

background message receiver
  js/background.js:4437-4445
  -> fetchChannelInfo(request.channelIdOrHandle)

background channel scraper
  js/background.js:4532-4640
  -> fetch(channelUrl, { credentials: 'include' })
  -> fallback /@handle fetch also uses credentials: 'include'
```

## Current Findings

| Area | Current behavior | Why it matters |
| --- | --- | --- |
| DOM fallback trigger | `js/content/dom_fallback.js:4758-4804` rotates through `index.unresolvedHandleKeys`, throttles attempts, and calls `fetchIdForHandle(..., { skipNetwork: true, backgroundOnly: true })`. | `skipNetwork` avoids page-context fetches, but the `backgroundOnly` path can still cause background network work during a fallback pass. |
| Content resolver bridge | `js/content/handle_resolver.js:200-224` sends `fetchChannelDetails`, then posts `FilterTube_UpdateChannelMap` and calls `scheduleDomFallbackRerun()` after a resolved UC id. | One identity repair can become a learned-map write plus another DOM fallback pass. |
| Background fetch branch | `js/background.js:4437-4445` calls `fetchChannelInfo(request.channelIdOrHandle)` directly. | The branch does not declare sender class, trusted route, active-rule reason, rate budget, or owner record. |
| YouTube-visible fetch | `js/background.js:4616-4634` fetches channel HTML with `credentials: 'include'`, including the fallback handle URL. | This is observable network work and should be tied to an explicit identity-fetch authority before performance or engagement fixes. |
| Missing shared authority | The chain has local throttles/caches, but no shared `networkAuthority`, `identityFetchAuthority`, `activeRuleReason`, or `ownerCredentialPolicy` contract. | Optimizing only fetch/XHR interception or only DOM fallback would leave this cross-context work path intact. |

## Boundary Before Implementation

The future fix should not delete this recovery path blindly, because it helps
resolve handle-only blocklist rows against UC-only DOM cards. The safer target
is one shared identity-fetch authority:

```text
identityFetchAuthority
  -> trigger: user action | active unresolved rule | explicit import | debug
  -> sender class and tab/url proof
  -> profile/list/surface
  -> input normalized handle/UC/video id
  -> cache hit/miss and per-navigation/per-profile budget
  -> credential policy
  -> storage/map writes
  -> DOM rerun decision
```

Until that exists, this chain remains a supplemental blocker for Main YouTube
performance work, false-hide/false-allow hardening, and any simultaneous
allow/block migration that depends on precise channel identity.

Related artifacts:

- `docs/audit/FILTERTUBE_NETWORK_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_NETWORK_AUTHORITY_CURRENT_BEHAVIOR_2026-05-18.md`
- `tests/runtime/background-identity-fetch-trigger-chain-current-behavior.test.mjs`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
