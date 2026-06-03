# FilterTube DOM Identity Confidence Current Behavior - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

This slice narrows the broad identity waterfall into the DOM-confidence question:
when a visible YouTube element gives us an `id`, `handle`, `customUrl`, `name`,
`videoId`, learned map entry, or current-page identity, what can that source do?

Current answer: the runtime has useful local guardrails, but it does not yet
have one shared `domIdentityConfidenceAuthority` that classifies identity as
canonical, joined-by-video-id, display-only, pending, stale, or unsafe before
hide/allow/stamp/persist decisions.

## Current Flow

```text
visible card / comment / row / shelf
        |
        v
extractChannelFromCard() / extractChannelMetadataFromElement()
        |
        +--> stable UC id / handle / custom URL
        |       |
        |       +--> may stamp card attrs
        |       +--> may feed menu label and block action
        |       +--> may enter videoChannelMap when joined to videoId
        |
        +--> name-only or weak byline
        |       |
        |       +--> may display or expected-name-check resolver
        |       +--> can be used as whitelist name fallback today
        |
        +--> videoId only
        |       |
        |       +--> join through videoChannelMap / ytInitial* / background resolver
        |
        +--> unresolved whitelist card
                |
                +--> may be hidden as pending while identity work runs
```

The risk is not that any one branch is obviously wrong. The risk is that
confidence, side-effect permission, and list-mode semantics are split across
extractors, DOM fallback, menu injection, learned-map writes, and hide/restore
paths.

## Source-Backed Current Behavior

| Source class | Current behavior | Risk / guardrail |
| --- | --- | --- |
| Recycled card identity | `queuePrefetchForCard()` clears channel attrs if the card has no prior cached video id, and `resetCardIdentityIfStale()` clears identity, collaborators, processed markers, hide markers, and inline display when video ids differ. | Good local guardrail, but reset is per-path rather than a shared confidence contract. See `js/content_bridge.js:1145-1184` and `js/content_bridge.js:1334-1403`. |
| Prefetch stamping | `prefetchIdentityForCard()` can stamp from `videoChannelMap`, DOM extraction, or `searchYtInitialDataForVideoChannel()`. A stamp schedules `applyDOMFallback()` after 120ms. | Identity enrichment also becomes DOM work authority. There is no central decision separating display-only identity from hide authority. See `js/content_bridge.js:1218-1305` and `js/content_bridge.js:1311-1331`. |
| Card ownership before stamping | `shouldStampCardForVideoId()` checks live video id, stamped video id, or an anchor containing that video id before accepting a map update for a card. | Good local ownership check for map updates, but not used everywhere DOM identity is inferred. See `js/content_bridge.js:1406-1452`. |
| Name normalization | `extractChannelFromCard()` rejects many bad YTM names (`@handle`, UC id, bullets, views, subscribers, watching, ago), and rejects lockup metadata containing title plus view count. | Good low-confidence boundary, but `name` still has a fallback role in whitelist matching. See `js/content_bridge.js:8633-8650` and `js/content_bridge.js:9983-9989`. |
| Text-derived handle fallback | `extractChannelMetadataFromElement()` can fall back from structured data and stable channel links to `channelText`, `cacheTarget.innerText`, `element.innerText`, and related element text, then extracts the first `@handle`-shaped value it finds. | This keeps some sparse cards usable, but the source is broader visible text rather than a proven channel-owner endpoint. Future tightening must preserve needed sparse-surface behavior while proving a title/description `@handle` cannot become canonical owner identity. See `js/content/dom_extractors.js:881-889`. |
| Shorts / watch / playlist video id only | Shorts and modern lockups can return `{ videoId, needsFetch: true }` when identity is not available. YTM fallback can return mapped UC id plus `needsFetch`. | Correctly treats `videoId` as a join key, not channel identity; still no single target-scope/work-budget authority. See `js/content_bridge.js:9026-9053` and `js/content_bridge.js:9998-10075`. |
| Menu-open identity | `injectFilterTubeMenuItem()` re-extracts after stale-video reset, promotes collaborator signals, hydrates from mappings, stamps safe synchronous identity, and ignores main-world fetched identity if it mismatches stamped UC id or handle. | Strong local guardrails for the clicked target, but this is menu-specific and not the DOM fallback hide contract. See `js/content_bridge.js:10126-10291`, `js/content_bridge.js:10451-10478`, and `js/content_bridge.js:10620-10663`. |
| Whitelist pending hide | In whitelist mode, mutation-driven candidates can be hidden pending identity after prefetch is queued. It skips home, search, feed/channels, and watch route entry points and avoids selected playlist rows. | It intentionally fails closed, but hides before an explicit identity outcome / TTL owner. See `js/content_bridge.js:5777-5945`. |
| DOM fallback current-page identity | DOM fallback can copy current-page identity into a card when the card lacks handle/id/customUrl. | Useful for creator pages, risky outside strict route proof. The whitelist allow path later only explicitly fail-opens on creator/channel pages. See `js/content/dom_fallback.js:3015-3041` and `js/content/dom_fallback.js:4662-4692`. |
| DOM fallback whitelist name fallback | In whitelist mode, if identity-only matching fails and no UC id exists, `channelMeta.name` or collaborator `name` can allow content via `allow:matched_channel_name_fallback` / `allow:matched_collaborator_name_fallback`. | This can preserve behavior for surfaces without ids, but it is lower confidence than UC/handle/customUrl and needs route/surface fixtures before being tightened. See `js/content/dom_fallback.js:4615-4658`. |
| Unresolved whitelist cards | `shouldHideContent()` blocks unresolved identity when channel whitelist rules exist and no keyword/channel/collaborator/page allow proof exists. Kids and Shorts are fail-closed. | Good leak guard, but it is also a false-hide/pending UX risk when identity arrives late. See `js/content/dom_fallback.js:4662-4699`. |

## Current Risk Shape

```text
identity source confidence
        |
        +--> display label?
        +--> block/allow decision?
        +--> stamp DOM attrs?
        +--> persist learned map?
        +--> schedule DOM fallback?
        +--> hide pending?
        +--> restore stale hidden state?

Today these decisions are distributed across multiple call sites.
```

The highest-risk split is whitelist behavior:

- A strong UC id / handle / custom URL can be a real allow signal.
- A handle found in broad visible text is weaker than a handle found on a
  stable channel link or JSON endpoint.
- A `name` can still be an allow fallback.
- A missing identity can be a pending hide or hard block.
- A later map update can rerun DOM fallback.
- A stale card can restore only if the specific reset path sees the new video id.

That means future changes must not simply remove DOM name fallback, disable
pending hide, or trust all stamped attrs. Each change needs route/surface
fixtures proving both no leak and no false hide.

## Required Future Authority

Before changing filtering behavior, add a runtime authority report that names:

```text
domIdentityConfidenceAuthority({
  source: "json" | "ytInitial" | "videoChannelMap" | "dom-link" |
          "dom-name" | "current-page" | "collaborator" | "resolver",
  confidence: "canonical" | "joinedByVideoId" | "linkDerived" |
              "displayOnly" | "pending" | "stale" | "unknown",
  route,
  surface,
  targetScope,
  listMode,
  allowedEffects: {
    displayLabel,
    hideDecision,
    allowDecision,
    stampDom,
    persistMap,
    scheduleFallback,
    networkResolver
  },
  restoreOwner,
  fixtureId
})
```

Missing runtime tokens today:

- `domIdentityConfidenceAuthority`
- `domIdentityConfidenceDecision`
- `identitySourceConfidence`
- `displayOnlyIdentity`
- `pendingIdentityRestoreOwner`

## Fix Direction After Proof

Do not implement these yet. They are the likely stabilization direction once
fixtures exist:

1. Treat UC id, handle, and custom URL as high-confidence identity only when
   tied to card ownership (`videoId` or direct channel link).
2. Treat `name` as display-only by default, with explicit compatibility fixtures
   for surfaces that still need name fallback.
3. Give pending whitelist hides a TTL, identity outcome, and restore owner.
4. Make learned map writes carry source, route, target card ownership, and
   confidence.
5. Require negative sibling-visible fixtures before broadening current-page
   identity, parent hide, or shelf hide behavior.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM identity confidence audit can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
