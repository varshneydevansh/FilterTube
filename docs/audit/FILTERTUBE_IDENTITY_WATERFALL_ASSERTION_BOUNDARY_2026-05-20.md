# FilterTube Identity Waterfall Assertion Boundary - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This note exists because the shorthand:

```text
XHR JSON -> ytInitial* -> DOM -> network fetch
```

is useful as a product direction, but unsafe as an implementation claim. The
current product is better described as a source-confidence waterfall:

```text
YouTube-supplied JSON/player/page-global payloads
        |
        v
renderer/player harvest into channelMap, videoChannelMap, and videoMetaMap
        |
        v
surface-specific visible DOM and menu target extraction
        |
        v
bounded background resolver or post-action enrichment only when current
identity is still incomplete
```

The first layer is preferred because it comes from YouTube data already
delivered to the page. It is not proof that every surface has channel identity
before render, that every Shorts/watch/menu target has enough data in DOM, or
that network fallback can be deleted safely.

## Corrected Assertion

| Claim | Current audit verdict |
| --- | --- |
| FilterTube should prefer XHR/YouTubei and `ytInitial*` payloads over visible text. | Correct. JSON/player/page-global payloads are the strongest source when they expose stable fields. |
| XHR JSON always has enough identity before DOM render. | Incorrect. Some watch, Shorts, playlist, Kids, YTM, post, and collaborator surfaces can be sparse or delayed. |
| DOM can be a canonical fallback for channel identity. | Only sometimes. DOM links with stable UC/handle URLs can be useful, but visible names, avatar text, and video-id-only links are not canonical. |
| `videoId` means channel identity is known. | Incorrect. `videoId` is a join key. It needs a current JSON/player/map/fetch identity source before channel-accurate block/allow decisions are proven. |
| Network fetch is gone because proactive identity exists. | Incorrect. Watch, Shorts, Kids watch, channel-detail, some action fallback paths, and current post-block Shorts/playlist enrichment can still use background fetch after map/cache/pending checks. This is a resolver/enrichment layer, not proof that every fetch is exact-target only. |
| This waterfall is enough to implement optimizations. | Incorrect. Each feature still needs route, mode, source-confidence, side-effect, no-work, and restore proof. |

## Where The Current Source Supports The Waterfall

| Layer | Source proof | Boundary |
| --- | --- | --- |
| Fetch interception | `js/seed.js` hooks `/youtubei/v1/search`, `/guide`, `/browse`, `/next`, and `/player` and sends matching JSON through `processWithEngine`. | Endpoint body work can still happen before a future no-work authority proves it is needed. |
| XHR interception | `js/seed.js` wraps XHR `open`, `send`, and ready-state/load listeners for the same endpoint family. | This is page-lifetime instrumentation, not a zero-cost passive claim. |
| Page globals | `js/seed.js` hooks existing and future `ytInitialData` and `ytInitialPlayerResponse`. | Snapshots can be stale, replayed, or incomplete for the target visible node. |
| Player/watch owner harvest | `js/filter_logic.js` reads `videoDetails.videoOwnerChannelId`, `videoDetails.channelId`, `microformat.playerMicroformatRenderer.externalChannelId`, `ownerProfileUrl`, duration, date, and category. | Strong for current video/player metadata, but still needs route-specific side-effect proof before watch/player rewrites. |
| Renderer harvest | `js/filter_logic.js` recursively harvests known renderers, byline browse IDs, lockup avatar endpoints, and `kidsVideoOwnerExtension`. | Only renderer families actually handled by source are covered; direct renderer gaps remain gaps. |
| Learned maps | `channelMap`, `videoChannelMap`, and `videoMetaMap` bridge JSON/player knowledge into later DOM/menu decisions. | Maps need provenance/confidence/revision proof before they are treated as fresh canonical authority. |
| DOM target extraction | `js/content_bridge.js` extracts UC/handle links, stamped IDs, card video IDs, menu snapshots, and visible labels. | DOM text is best-effort. Video-id-only and display-only surfaces must not be over-trusted. |
| Background resolver and post-action enrichment | `js/background.js` contains Shorts, Kids watch, Main watch, and channel-detail fetch fallbacks. `js/content_bridge.js` can also enrich visible Shorts and playlist rows after a successful channel block. | These must become reason-coded and budgeted before optimization, not silently expanded or deleted. The current source can do more than resolve only the clicked target, so the waterfall must distinguish exact-target resolver work from page-visible enrichment. |

## Surface Exceptions That Must Stay Explicit

| Surface / workflow | Why the simple XHR-first claim is incomplete | Required proof before behavior changes |
| --- | --- | --- |
| Shorts | DOM can expose only `/shorts/VIDEO_ID`; owner data may arrive through JSON/player/map/fetch later. | Positive and negative fixtures for owner-present JSON, video-id-only DOM, stale map, map miss, and fallback resolver. |
| Main watch current video | DOM owner row can be stale during SPA transitions; player payload is stronger when available. | Current video owner confidence, selected playlist preservation, no player side effect, and stale-owner negative fixtures. |
| Watch rail / end screen | Direct `endScreenVideoRenderer` has coverage, but compact autoplay and direct watch-card variants remain gaps. | JSON and DOM end-screen fixtures with sibling-visible proof and player-overlay separation. |
| Playlist / Mix | Playlist rows can expose video IDs and selected state without stable owner proof; Mix seed metadata is not owner identity. | Selected-row, compact playlist, Mix owner-absence, and row-recycling fixtures. |
| YouTube Kids | `kidsVideoOwnerExtension` is strong when present, but public Kids web/watch DOM can be sparse and the background Kids watch resolver still exists. | Kids browse/watch/profile/list-mode fixtures and app-runtime parity proof. |
| YouTube Music | Mobile-like YTM DOM can mix artist/title/metadata, and compact playlist/show-sheet renderer coverage is incomplete. | YTM compact playlist, showSheet collaborator, DOM guardrail, and whitelist/blocklist fixtures. |
| Collaborator menus | `showDialogCommand` and `showSheetCommand` are not equivalent; avatar stacks can be non-collaborator identity. | Dialog/sheet/avatar-stack provenance fixtures and menu/action persistence proof. |
| Posts/comments | Author endpoints are canonical when present, but text-only author labels and split continuation shapes are not enough. | Modern post, comment continuation, author identity, and sibling-visible fixtures. |

## Network And Work Budget Correction

The waterfall is not only a read order. It also has a work budget problem:

- seed fetch interception can clone and parse matching YouTubei responses before
  a future no-work authority proves the body is needed,
- XHR interception installs page-global hooks and can parse/process matched
  endpoints in enabled empty-list states,
- learned identity messages can persist maps, stamp DOM cards, and schedule DOM
  fallback reruns,
- video metadata updates can write maps and trigger fallback reruns even when
  content/date/category predicates are not currently actionable,
- after a successful channel block, visible Shorts and playlist rows can be
  enriched beyond the clicked item so rows from the newly blocked channel can
  hide.

That means the missing future authority is not just `sourceConfidenceDecision`.
It also needs an `identityWorkBudget`: enabled state, list/mode activity,
route/surface, user-action class, exact target versus fanout, credential policy,
map-write policy, DOM-scan policy, and retry budget.

## Implementation Boundary

Before using the waterfall to optimize or simplify any feature, the patch must
name:

1. the feature or workflow,
2. the route and surface,
3. the active settings mode and profile type,
4. the exact source tier: `canonical`, `joinedByVideoId`, `displayOnly`,
   `fallback`, or `unknown`,
5. the JSON/player/DOM/fetch fields present for the target,
6. the allowed side effects,
7. the no-work budget when no active rule can use the data,
8. positive matching fixtures,
9. negative nonmatching/sibling-visible fixtures,
10. restore or teardown proof for any DOM state written.

Until a runtime authority exists, `JSON-first` is only a priority order. It is
not an implementation-ready guarantee.

## Current Missing Runtime Authority

No runtime symbol exists yet for:

- `identityWaterfallAssertionAuthority`
- `sourceConfidenceDecision`
- `identitySourceTier`
- `identityFetchReasonBudget`
- `identityWorkBudget`

The existing docs and tests are current-behavior proof, not permission to
delete fallbacks, broaden DOM inference, or assume zero work on empty installs.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity waterfall assertion boundary
can support runtime optimization or JSON-first promotion. Current proof pins:

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
