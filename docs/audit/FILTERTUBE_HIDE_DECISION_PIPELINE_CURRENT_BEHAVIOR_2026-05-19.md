# FilterTube Hide-Decision Pipeline Current Behavior

Status: audit-only proof. Runtime behavior is unchanged.

Last updated: 2026-05-19.

This document pins how FilterTube currently decides whether content is removed
from YouTube JSON, hidden after render, restored after stale state, or left for a
fallback resolver. It does not propose a fix. It exists so later optimization or
robustness work cannot treat one symptom, such as empty-install lag or a single
false hide, as the full problem.

## Why This Slice Exists

The user-facing symptoms are:

- YouTube Main can feel slower even when the visible blocklist/whitelist rows
  look empty.
- Search or feed cards can disappear even when the user does not expect any
  rule to match.
- Whitelist mode must fail closed on some surfaces, but that behavior can look
  like false hiding if identity has not arrived yet.
- Watch, Shorts, playlist, Kids, and YTM surfaces can expose only a video id in
  DOM, so JSON/player/learned-map/fetch identity is sometimes required.

Those symptoms all converge on a split hide-decision pipeline.

## Current Source Flow

```text
storage / profiles / legacy aliases
        |
        v
background compiled settings
  - listMode
  - filterKeywords / filterChannels
  - whitelistKeywords / whitelistChannels
  - content/category booleans
  - channelMap / videoChannelMap / videoMetaMap
        |
        +-------------------------+
        |                         |
        v                         v
seed main-world JSON hooks       isolated-world DOM fallback
  shouldSkipEngineProcessing       hasActiveDOMFallbackWork
  processWithEngine                applyDOMFallback
        |                         |
        v                         v
filter_logic JSON mutation       shouldHideContent + per-card predicates
  YouTubeDataFilter._shouldBlock   targetToHide selection
  recursive filter/remove          pending markers / background resolver
        |                         |
        +------------+------------+
                     v
              visual side effects
              toggleVisibility
              direct markers / CSS
              stats/media/restore
```

There is no single `hideDecisionAuthority`, `hideDecisionTrace`, or structured
decision object today that records source, route, surface, rule row, identity
confidence, target element, restore owner, stats policy, and side-effect policy.

## Background Compile Boundary

Runtime decisions begin before page code runs. `background.js` builds the
settings payload that the page/DOM code consumes.

Current behavior:

- Main blocklist keywords prefer `activeMain.blockedKeywords` and fall back to
  `activeMain.keywords` during migration.
- Main blocklist channels prefer `activeMain.blockedChannels` and fall back to
  `activeMain.channels` or legacy `items.filterChannels`.
- Whitelist mode compiles separate `whitelistKeywords` and
  `whitelistChannels`.
- Kids-to-Main sync can merge Kids rows into Main runtime settings when modes
  match.
- Channel `filterAll` can add derived keyword regexes and can persist those
  generated entries back into profile storage.
- `channelMap`, `videoChannelMap`, and `videoMetaMap` are passed into compiled
  settings and can later affect hide decisions.

Proof:

- `js/background.js:2057-2074` selects Main/Kids keyword entries and compiles
  `filterKeywords` plus `filterKeywordsComments`.
- `js/background.js:2211-2228` compiles whitelist and blocklist channel rows.
- `js/background.js:2330-2398` merges channel-derived keywords and persists
  generated `filterAll_channel` entries.
- `js/background.js:2408-2415` starts learned-map passthrough into runtime
  settings.
- `js/settings_shared.js:918-925` writes canonical `main.channels` and
  `main.keywords`, which is not the same as clearing every legacy alias.

Risk carried forward:

- Visible UI rows can be empty while stale aliases still compile.
- Runtime truth can differ depending on whether settings came from shared UI
  compilation, background compilation, cache, storage change, import, Nanah, or
  native/app sync.
- A no-work optimization cannot only inspect visible UI row arrays.

## Seed JSON Boundary

`seed.js` owns the main-world interception path for `ytInitialData`,
`ytInitialPlayerResponse`, fetch, and XHR payloads.

Current behavior:

- `shouldSkipEngineProcessing()` computes a local activity predicate from
  `listMode`, keyword/channel arrays, comment keywords, hide-all booleans,
  content filters, and category filters.
- Some search/channel/home payloads skip mutation in blocklist/no-rule cases,
  but still run `harvestOnly()` to learn identity maps.
- Whitelist mode does not use the same no-rule skip. Empty whitelist means
  fail-closed content removal is still possible.
- If processing is not skipped, `processWithEngine()` calls
  `FilterTubeEngine.processData(data, cachedSettings, dataName)`.

Proof:

- `js/seed.js:197-224` computes `hasActiveJsonFilterRules`.
- `js/seed.js:261-306` skips some search/channel/home JSON mutation only under
  blocklist/no-active-rule conditions.
- `js/seed.js:364-382` still performs `harvestOnly()` when mutation is skipped.
- `js/seed.js:395-419` calls full engine processing and stashes the resulting
  network snapshot.

Risk carried forward:

- JSON interception can still do clone/parse/hook/harvest work even when a
  payload is not ultimately mutated.
- Whitelist fail-closed semantics are intentionally different from blocklist
  no-rule semantics.
- JSON skip and DOM fallback active predicates are not one compiled authority.

## JSON Renderer Hide Boundary

`filter_logic.js` removes renderer objects from YouTube JSON by returning
`null` from the recursive filter.

Current behavior:

- `YouTubeDataFilter._shouldBlock()` unwraps renderers, ignores chip renderers,
  checks `FILTER_RULES`, builds a candidate, and decides via list mode.
- In whitelist mode, no channel or keyword whitelist rules means non-comment
  renderers are blocked.
- In whitelist mode, matched channel or keyword allows the renderer; unresolved
  identity or no whitelist match blocks it except for explicitly protected
  scaffolding/container renderers.
- In blocklist mode, matched channels, matched keywords, comments, content
  filters, and category filters can block.
- Shorts/video-id-only renderers can use `videoChannelMap` when channel identity
  is otherwise missing.

Proof:

- `js/filter_logic.js:1825-1856` builds the renderer candidate and identifies
  list mode.
- `js/filter_logic.js:1858-1868` can fill missing owner identity from
  `videoChannelMap`.
- `js/filter_logic.js:1933-2035` implements whitelist allow/block behavior,
  including empty-whitelist fail closed.
- `js/filter_logic.js:2038-2074` implements blocklist channel and keyword
  matching.
- `js/filter_logic.js:2076-2107` separately handles comment hides.
- `js/filter_logic.js:2110-2120` applies content and category predicates.
- `js/filter_logic.js:3391-3429` recursively removes blocked renderer objects.
- `js/filter_logic.js:3434-3464` harvests first, then filters.

Risk carried forward:

- JSON removes whole renderer objects, while DOM fallback hides selected DOM
  targets. Their target granularity is not equivalent.
- Whitelist can hide content before identity is complete, which is sometimes
  correct but requires structured pending/identity proof.
- Renderer gaps cannot be fixed by broad DOM selectors without sibling-visible
  negative fixtures.

## DOM Fallback Active Boundary

`dom_fallback.js` decides whether rendered content should be scanned and hidden.

Current behavior:

- `hasActiveDOMFallbackWork()` returns true for whitelist mode unconditionally.
- In blocklist mode, it returns true for active lists, many boolean controls,
  enabled content filters, or enabled category filters.
- On no active DOM work, `applyDOMFallback()` clears stale FilterTube visibility
  markers and returns.
- The DOM fallback loop scans `VIDEO_CARD_SELECTORS`, extracts title/channel/
  metadata from many surface-specific selectors, computes content predicates,
  calls `shouldHideContent()`, maps a target to hide, then writes markers and
  visual state.

Proof:

- `js/content/dom_fallback.js:1933-1999` defines the active predicate.
- `js/content/dom_fallback.js:2001-2032` clears stale DOM fallback visibility.
- `js/content/dom_fallback.js:2034-2055` begins the coalesced DOM fallback run.
- `js/content/dom_fallback.js:2325-2328` selects all video/card candidates.
- `js/content/dom_fallback.js:2602-2645` reprocesses cards when late identity or
  `videoChannelMap` becomes available.
- `js/content/dom_fallback.js:2657-3471` extracts DOM title/channel/identity
  across desktop, mobile, Kids, Shorts, watch-card, playlist, and YTM-style
  shapes.
- `js/content/dom_fallback.js:3492-3619` computes duration/category/keyword/
  channel predicates and calls `shouldHideContent()`.
- `js/content/dom_fallback.js:3621-3654` can hide a parent/wrapper rather than
  the original candidate node.

Risk carried forward:

- Whitelist mode always keeps DOM fallback active because hidden-by-default is
  part of its semantics.
- Blocklist no-work and stale cleanup are different actions.
- Parent/wrapper target selection is a false-hide boundary independent of the
  correctness of the match predicate.

## DOM `shouldHideContent()` Boundary

`shouldHideContent()` is a predicate helper, not the whole hide decision.

Current behavior:

- Identity-less non-Kids cards generally return false when there is no title,
  channel, channel identity, or collaborator metadata.
- Identity-less Kids cards in whitelist mode return true.
- Whitelist mode blocks when there are no whitelist channel or keyword rules.
- Whitelist mode allows matched whitelist keywords or channels.
- Unresolved identity on Shorts/Kids likely cards returns true in whitelist
  mode; creator pages can fail open only when page channel identity matches the
  whitelist.
- Blocklist keyword matching tests title and channel text.
- Blocklist channel matching uses compiled channel indexes, collaborators,
  learned `channelMap`, and a background-only handle resolver path.

Proof:

- `js/content/dom_fallback.js:4535-4594` handles empty title/channel/identity
  and Kids whitelist fail-closed behavior.
- `js/content/dom_fallback.js:4595-4700` implements DOM whitelist allow/block.
- `js/content/dom_fallback.js:4715-4723` implements DOM keyword block checks.
- `js/content/dom_fallback.js:4725-4753` implements blocklist channel matching.
- `js/content/dom_fallback.js:4755-4805` can trigger the background-only handle
  resolver for UC-only DOM cards with unresolved handle block rows.

Risk carried forward:

- This function does not record a decision id, rule id, identity confidence,
  source payload, or restore owner.
- A `false` result can still be followed by pending metadata markers or wrapper
  cleanup elsewhere.
- A `true` result can be correct under whitelist fail-closed semantics even
  though it looks like a false hide until identity proof is understood.

## Visual Side-Effect Boundary

The final visual state is not controlled only by JSON removal or
`shouldHideContent()`.

Current behavior:

- `toggleVisibility()` adds/removes `.filtertube-hidden`,
  `data-filtertube-hidden`, and inline `display:none!important`.
- The same helper records tracker events, updates hidden stats, and touches
  media playback unless `skipStats` only disables the stats/tracker path.
- Other code paths can write markers directly before or without the shared
  helper.
- Pending whitelist and pending metadata markers can trigger delayed reruns.
- Playlist next/previous and ended guards can intercept user/player actions
  based on hidden state.

Proof:

- `js/content/dom_helpers.js:67-149` defines `toggleVisibility()` and its
  stats/media coupling.
- `js/content/dom_fallback.js:972-989` writes blocked-channel markers.
- `js/content/dom_fallback.js:2337-2441` installs playlist navigation/autoplay
  guards that depend on hidden state.
- `js/content/dom_fallback.js:3656-3687` computes the final hide reason and
  writes mix/radio markers.
- `js/content/dom_fallback.js:3696-3736` schedules pending metadata rechecks.

Risk carried forward:

- Correct matching can still produce wrong UX if the target node is too broad,
  stale markers are not restored, or stats/media side effects fire on cleanup.
- The end-screen/playlist engagement complaint must be audited under both
  visual hide and player/navigation side-effect authority, not only under
  keyword/channel matching.

## Out-of-Band Hide/Show Writers

Ptolemy challenged the first version of this slice correctly: the main flow
above is real, but it is not exhaustive. Current FilterTube visibility can also
change through feature-specific paths that do not pass through the normal
`shouldHideContent() -> toggleVisibility()` shape.

Current behavior:

- `seed.js` can return an empty comment-continuation response when
  `/youtubei/v1/next` is a comment continuation and `hideAllComments` is active.
- `ensureContentControlStyles()` injects CSS that hides whole surfaces such as
  Home feed, sponsored cards, playlist panels, comments, sidebars, live chat,
  watch metadata, headers, Shorts/search shelves, and open-app banners.
- Members-only, playlist-card, and Mix/Radio passes can write inline
  `display:none` and FilterTube markers directly.
- Quick Block can optimistically hide the clicked target immediately after the
  user action, before normal fallback convergence.
- Shorts and playlist enrichment can hide rows directly after learned identity
  resolves a video id to a blocked channel.
- DOM extractor cleanup and stale DOM fallback cleanup can restore/removal-hide
  state outside a matching predicate.

Proof:

- `js/seed.js:637-665` rewrites comment continuation JSON for
  `hideAllComments`.
- `js/content/dom_fallback.js:1064-1115` starts dynamic content-control CSS
  generation; later branches add the broad feature selectors.
- `js/content/dom_fallback.js:2172-2215` directly hides members-only hosts and
  shelves.
- `js/content/dom_fallback.js:2253-2277` directly hides playlist lockups and
  parent shelves/horizontal lists.
- `js/content/dom_fallback.js:2280-2288` directly hides Mix chips.
- `js/content/block_channel.js:1224-1235` performs immediate Quick Block hide.
- `js/content_bridge.js:7829-7841` directly hides Shorts after enrichment.
- `js/content_bridge.js:7946-7961` directly hides playlist rows after
  enrichment.
- `js/content/dom_fallback.js:2001-2032` clears stale visibility markers.

Risk carried forward:

- A future `hideDecisionAuthority` must cover CSS hide rules, direct inline
  writers, optimistic user-action hides, enrichment hides, cleanup restores, and
  JSON rewrites, not only `shouldHideContent()`.
- These out-of-band writers explain why changing one predicate can leave the
  user-visible symptom intact.

## Cross-Surface Constraints

Current behavior must preserve surface-specific facts:

- Search/home often have enough JSON and DOM card text for proactive matching,
  but renderer gaps still exist.
- Watch and Shorts can expose only video ids in DOM; owner identity can depend
  on `ytInitialPlayerResponse`, `/next`, `/player`, `videoChannelMap`, or
  fallback fetches.
- Playlist panel rows can require video-id mapping and selected-row handling.
- Kids public web cards can be identity-light; whitelist intentionally fails
  closed more often.
- YTM and mobile surfaces use different DOM tags and can rely on extracted or
  learned identity.

This means a future "JSON first" fix must be written as a source-priority
waterfall, not as a claim that every surface always has complete JSON identity
before rendering.

## Subagent Validation

Ptolemy was asked to validate this slice against the source chain and to look
for missing hide/show paths. Its review should be treated as read-only audit
input. Any challenge from that review must be resolved with source references
and current-behavior fixtures before implementation.

## Current Findings

| Finding | Current behavior | Risk |
| --- | --- | --- |
| No single hide-decision authority | JSON, DOM predicate, target selection, markers, stats, media, and navigation guards are separate. | Fixing one branch can leave false-hide, leak, or lag in another. |
| No-work predicates are split | Seed, DOM fallback, background compile, quick/menu lifecycle, and learned-map refresh infer activity separately. | Empty install can still do work, and stale aliases can stay active. |
| Whitelist fail-closed is intentional but under-instrumented | JSON and DOM both block when whitelist has no allow match; Kids/Shorts unresolved identity can block. | Correct privacy behavior can look like false hiding without traceable reason. |
| Learned maps are decision inputs | `channelMap`, `videoChannelMap`, and `videoMetaMap` influence matching and reruns. | Stale or weakly proven identity can affect hide/show decisions. |
| Visual target can be broader than matched content | DOM fallback can hide wrappers, shelves, playlist rows, or parent items. | Sibling-visible negative fixtures are required before selector cleanup. |
| Side effects are coupled to hide writes | `toggleVisibility()` can update stats and media state; playlist guards can click/pause/skip. | A hide bug can become an engagement or algorithmic side-effect bug. |

## Required Future Authority

Before changing behavior, add a structured hide-decision report with at least:

```text
hideDecisionId
runtimeRevision
profileId
viewingSpace
surface
route
sourceKind: json | dom | learned-map | background-fetch | direct-writer
rendererType or domTag
videoId
channelIdentity + confidence + provenance
listMode
ruleKind
ruleRowId
matchPolicy
decision: hide | allow | pending | restore | no-work
targetKind
writer
restoreOwner
statsPolicy
mediaPolicy
networkPolicy
engagementPolicy
reason
```

Until that exists, this audit keeps the implementation gate closed for:

- no-work optimization,
- stale alias cleanup,
- JSON renderer expansion,
- DOM selector narrowing,
- whitelist behavior changes,
- simultaneous allow/block migration,
- learned identity trust changes,
- stats/time-saved changes,
- playlist/end-screen/player side-effect changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this hide decision pipeline can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, hide decision changes, stale alias cleanup,
whitelist behavior changes, learned identity trust changes, or side-effect
authority changes.
