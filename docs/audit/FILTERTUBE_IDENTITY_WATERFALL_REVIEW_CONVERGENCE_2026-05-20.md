# FilterTube Identity Waterfall Review Convergence - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This note preserves the latest focused review around the channel identity
waterfall:

```text
XHR JSON interception
  -> ytInitial* snapshots
  -> learned maps
  -> DOM extraction
  -> background resolver
```

The reviewers converged on the same correction: the waterfall is the intended
priority order for source confidence, but the current runtime is not a single
JSON-authoritative decision system. Some fields are direct filtering authority,
some fields only harvest learned maps, some visible surfaces expose only a
video id, some paths still use DOM text or page-level owner context, and some
targets can still reach a background resolver.

## Six Review Slices

| Slice | Current-behavior finding | Why it matters |
| --- | --- | --- |
| Seed and JSON engine | `js/seed.js` intercepts YouTubei fetch/XHR and page globals, but no-rule or harvest-only paths can still parse, harvest, store snapshots, and later wake DOM/map work. | JSON-first is not zero-work. Empty install and disabled/no-actionable-rule states still need an explicit work budget before optimization claims. |
| Renderer extraction | `js/filter_logic.js` has strong player and known-renderer extraction, but Shorts owner paths, direct watch-card renderers, compact playlists, Mix/radio playlist identity, shared posts, and comment metadata are not uniformly direct rules. | A path documented in `docs/json_paths_encyclopedia.md` is not covered until the runtime consumes it for a named effect. |
| DOM fallback and hide authority | `js/content/dom_fallback.js` can still use name-only indexes, current-page owner context, pending whitelist hides, stale markers, and broad container cleanup. | DOM is necessary for visible targets, but display text and stale markers are not canonical channel identity. |
| Menu/action identity | `js/content_bridge.js` can start from DOM/menu snapshots, join by `videoId`, persist learned maps, and after a successful block enrich visible Shorts and playlist rows beyond the clicked item. | User action proves the clicked target, not unlimited page-wide follow-up work. Exact-target repair and post-action fanout need separate budgets. |
| Background resolver | `js/background.js` still has Shorts, Main watch, Kids watch, and channel-detail fetch fallbacks after cache/map/pending checks. | Network is last-resort behavior, not deleted behavior. It must be reason-coded before pruning or expanding it. |
| Feature dependency scope | Feature rows must include identity confidence, endpoint/no-work behavior, DOM/hide authority, content predicates, settings/mutation authority, prompts, stats, imports, and release claims. | The disease is split authority across features, not one isolated end-screen, whitelist, or performance bug. |

## Converged Runtime Model

```text
YouTube data arrives
  |
  +-- direct JSON rule field
  |     -> may hide / allow / remove renderer now
  |
  +-- harvest-only JSON field
  |     -> may write channelMap / videoChannelMap / videoMetaMap
  |
  +-- visible DOM target
  |     -> may provide UC/handle link, video-id join key, or display-only text
  |
  +-- action or unresolved target
        -> may request a background resolver if allowed by future budget
```

This means every future fix needs two separate answers:

1. **What source tier is this value?**
   `canonical`, `harvest-only`, `joinedByVideoId`, `displayOnly`,
   `fallback`, or `unknown`.
2. **What effect may this value cause?**
   hide/allow, map write, menu label, persistence row, DOM rerun, network fetch,
   playback/navigation side effect, or no effect.

Without both answers, a JSON-first change can still leak blocked content, hide
nonmatching content, wake expensive no-rule work, or delete a fallback that is
still needed on sparse YouTube surfaces.

## Actual Decision Flow By Surface

The waterfall should be read as a per-surface decision flow, not as a claim that
one layer always completes identity before the next layer starts:

```text
route/surface + settings mode
        |
        v
Is there an explicit renderer/player field for this exact target?
        |
        +-- yes, and the runtime rule consumes it
        |       -> direct JSON effect may be allowed by future source/effect proof
        |
        +-- yes, but the runtime only harvests it today
        |       -> map write / cache / later DOM join, not direct hide proof
        |
        +-- no, but a video id is present
        |       -> joinedByVideoId through player JSON, learned map, or resolver
        |
        +-- no stable id, only visible text or page context
        |       -> displayOnly until a future DOM confidence authority proves more
        |
        +-- unresolved clicked/action target
                -> fallback resolver only with a reason-coded budget
```

Current examples:

| Surface case | Current source reality | Current audit boundary |
| --- | --- | --- |
| Main home/search video renderers | Many renderers expose title, video id, byline browse id, handle/custom URL, or avatar metadata. | JSON can be direct authority only for renderer fields the runtime actually consumes; discovered doc paths alone are not runtime coverage. |
| Main watch current video | `/player`, `ytInitialPlayerResponse`, and `/next` can provide canonical owner and metadata, while the visible owner row can be stale during SPA transitions. | Player owner fields are strongest; URL/DOM video id is only a join key; owner DOM text is not enough by itself. |
| Shorts/reels | DOM frequently exposes only `/shorts/VIDEO_ID`; some JSON/player surfaces can carry owner identity, but current renderer coverage is uneven. | Preserve video-id join behavior and fallback resolver proof before pruning Shorts network or DOM paths. |
| Watch rail/end screen | Some JSON renderers are covered, but compact autoplay, direct watch-card parts, and overlay DOM wall variants remain gaps. | Do not claim end-screen completeness until direct JSON and DOM wall fixtures prove matching and nonmatching siblings. |
| Playlist/Mix/radio | Playlist rows can expose video ids and sometimes owner bylines; Mix/radio often expose playlist/seed identity rather than owner identity. | Playlist creator, row owner, seed video, and visible byline must be kept separate. |
| YouTube Kids | `kidsVideoOwnerExtension` is canonical when present; public Kids web/watch DOM can still be sparse or video-id-only. | Kids extension filtering proof is separate from native app WebView layout proof, and Kids watch fallback still exists. |
| YouTube Music | YTM cards often need video-id plus learned map or main-world lookup; compact playlist and show-sheet collaborator paths remain partial. | Treat YTM text as mixed title/artist/metadata unless a stable endpoint proves channel identity. |
| Collaborator/avatar-stack | `showDialogCommand` can be direct roster proof, while `showSheetCommand` and avatar stacks are not equivalent in current filter logic. | Collaborator identity must record whether it came from dialog roster, sheet roster, avatar stack, cache, DOM, or resolver. |
| Posts/comments | Some author endpoints exist in JSON, but continuations, shared posts, and menu targets have split support. | Author identity, body keyword text, shared-original identity, and comment continuation type need separate fixtures. |

This is why the audit cannot say "use JSON and remove fallback" globally. The
correct target is a future `sourceConfidenceDecision` and `identityWorkBudget`
that can say, for each route/mode/renderer/action, whether a value may hide,
allow, harvest, persist, stamp, fetch, rerun DOM fallback, pause playback, or
only label a UI row.

## Source-Backed Boundaries

| Boundary | Current proof | Future gate |
| --- | --- | --- |
| XHR/fetch body work can precede a complete no-work decision. | `js/seed.js` endpoint hooks and `harvestOnly`/`processWithEngine` paths are active runtime layers. | `identityWorkBudget` plus endpoint counters for zero clone, zero parse, zero stringify, zero harvest, and zero DOM rerun in no-rule states. |
| `videoId` is a join key, not channel identity. | Watch URLs, Shorts URLs, playlist rows, and stamped DOM ids can route through `videoChannelMap`, `watch:VIDEO_ID`, or `shorts:VIDEO_ID`. | `sourceConfidenceDecision` that marks `joinedByVideoId` separately from canonical owner fields. |
| DOM names are display-only unless backed by stable endpoints. | DOM fallback contains name-only and stable-name matching paths, current-page owner injection, and pending whitelist hide behavior. | `domIdentityConfidenceAuthority` before name-only or page-owner data can cause durable hide/persist effects. |
| Renderer JSON coverage is uneven. | Current rules cover many video/comment/post/player paths but not every documented field or renderer family. | `jsonRuntimeCoverageAuthority` and per-renderer positive/negative fixtures before adding or claiming coverage. |
| Network fallback remains current behavior. | Shorts, watch, Kids watch, and channel-detail resolver functions still exist in background code. | `identityFetchReasonBudget` with reason, route, active rule state, target, credential policy, retry limit, and cache result. |
| Post-action enrichment can fan out. | A successful channel block can trigger visible Shorts and playlist-row enrichment beyond the clicked target. | `postActionIdentityFanoutBudget` to separate clicked-target repair from page-wide enrichment. |

## Implementation Boundary

This review convergence does not approve runtime changes. It narrows the
required proof before the first behavior patch:

- no-rule and disabled states need measured no-work proof,
- blocklist and whitelist modes need separate false-hide/leak fixtures,
- JSON path additions need direct-rule versus harvest-only classification,
- DOM fallback changes need sibling-visible and restore proof,
- learned-map trust changes need provenance/revision proof,
- network resolver changes need reason-coded budgets,
- action fanout changes need exact-target versus page-wide accounting.

No runtime symbol exists yet for:

- `identityWaterfallReviewAuthority`
- `identitySourceEffectDecision`
- `identityWorkBudget`
- `sourceConfidenceDecision`
- `jsonRuntimeCoverageAuthority`
- `domIdentityConfidenceAuthority`
- `identityFetchReasonBudget`
- `postActionIdentityFanoutBudget`

This document is a convergence record, not an implementation gate opening.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity waterfall review convergence
record can support runtime optimization or JSON-first promotion. Current proof
pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
