# FilterTube Identity Information Waterfall - Current Behavior - 2026-05-19

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged. This document records how FilterTube currently
learns video, channel, handle, title, duration, and owner identity across
YouTube Main, Shorts, watch, playlist, YouTube Kids, and YouTube Music surfaces.
It exists because "JSON-first" is directionally correct but not precise enough
to safely optimize the extension.

## Summary

FilterTube currently uses an information waterfall, not a single source:

```text
YouTube page / endpoint payloads
        |
        v
Main-world interception
  - ytInitialData
  - ytInitialPlayerResponse
  - fetch /youtubei/v1/{search,guide,browse,next,player}
  - XMLHttpRequest /youtubei/v1/{search,guide,browse,next,player}
        |
        v
JSON harvest and mutation engine
  - channelMap: UC id <-> @handle/custom URL
  - videoChannelMap: video id -> UC channel id
  - videoMetaMap: video id -> duration/date/category metadata
        |
        v
Persisted learned maps + compiled settings
        |
        v
DOM card / watch owner / menu snapshot extraction
        |
        v
Background HTML fetch fallback only when current data is insufficient
```

That means XHR/JSON is the preferred evidence source for identity when YouTube
provides the exact field needed for the current surface. It is not a standalone
permission to hide, restore, mutate, persist, fetch, stamp, or count anything,
and it does not mean every screen always has complete JSON metadata at the exact
moment DOM fallback, quick block, or a 3-dot menu action runs.

## Current Source Order

### 1. Main-world JSON and page globals are the first evidence tier

`js/seed.js` runs early and records YouTube's own data surfaces before the
isolated content bridge tries to infer card identity from rendered DOM.

Proof:

- `js/seed.js:43-92` stashes `/youtubei/v1/search`, `/next`, `/browse`, and
  `/player` responses on `window.filterTube`.
- `js/seed.js:505-593` hooks `ytInitialData` and `ytInitialPlayerResponse`,
  including the already-existing startup values.
- `js/seed.js:606-613` patches `fetch` for `/youtubei/v1/search`, `/guide`,
  `/browse`, `/next`, and `/player`.
- `js/seed.js:692-703` patches XHR for the same endpoint family.

Why it works:

- YouTube's endpoint payloads usually carry renderer identity before or while
  the DOM is hydrating.
- Main-world access can see `ytInitialData` and `ytInitialPlayerResponse` that
  isolated-world DOM code cannot own directly.
- This can avoid many resolver requests when the runtime is reading complete
  identity fields YouTube already delivered to the page.

Current boundary:

- This path can be delayed by settings delivery, seed replay, SPA timing, or a
  surface that only exposes a video id until a later `/player` or `/next`
  payload arrives.
- A JSON snapshot is only evidence for the renderer/surface fields it actually
  contains. It is not proof that every visible DOM node has complete owner
  metadata, and it is not enough by itself to justify broad no-work,
  false-hide, network, or lifecycle changes.

### 2. The filter engine harvests identity before or while filtering

`js/filter_logic.js` registers learned identity from player payloads, watch
playlist payloads, video renderers, lockups, Kids owner extensions, and byline
browse endpoints.

Proof:

- `js/filter_logic.js:46-80` batches `FilterTube_UpdateVideoChannelMap`
  messages.
- `js/filter_logic.js:82-140` batches `FilterTube_UpdateVideoMetaMap`
  messages.
- `js/filter_logic.js:1174-1237` harvests owner identity from
  `videoDetails.videoOwnerChannelId`, `videoDetails.channelId`,
  `microformat.playerMicroformatRenderer.externalChannelId`,
  `ownerProfileUrl`, duration, publish date, upload date, and category.
- `js/filter_logic.js:1240-1273` harvests playlist-panel video-to-channel
  mappings.
- `js/filter_logic.js:1281-1333` recursively scans known renderer wrappers.
- `js/filter_logic.js:1335-1367` registers video owner identity from
  `kidsVideoOwnerExtension`, byline browse IDs, and lockup avatar metadata.
- `js/filter_logic.js:1476-1507` registers UC id <-> handle mappings and posts
  `FilterTube_UpdateChannelMap`.

Why it works:

- Filtering decisions often need canonical UC IDs, while UI and DOM surfaces
  may expose only handles, custom URLs, names, or video IDs.
- Learned maps let a later card or route use identity learned from a previous
  JSON payload without fetching again.

Current boundary:

- Learned identity is useful memory, but it is not yet governed by a shared
  provenance/confidence authority.
- If a map is stale, weakly validated, or missing, a later DOM decision may
  either fail open, fail closed, or trigger a fallback resolver depending on
  the caller.

### 3. Learned maps are persisted and pushed through compiled settings

The isolated content bridge forwards map updates to the background script and
also restamps matching DOM cards when a video id becomes known.

Proof:

- `js/content_bridge.js:5479-5483` forwards channel and video-channel map
  updates from main-world code.
- `js/content_bridge.js:5484-5529` persists `videoId -> channelId`, stamps
  matching cards, and schedules another DOM fallback pass.
- `js/background.js:1452-1526` loads and flushes `channelMap`.
- `js/background.js:1528-1565` loads `videoChannelMap` and `videoMetaMap`.
- `js/background.js:2408-2425` includes `channelMap`, `videoChannelMap`, and
  `videoMetaMap` in compiled settings.

Why it works:

- It bridges the main-world JSON harvester into isolated-world DOM fallback and
  background-compiled settings.
- It makes Shorts, playlist rows, and mobile/YTM cards filterable even when
  the current DOM only carries a video id.

Current boundary:

- Map-only updates are not currently a full compiled-settings revision report.
- DOM restamping and forced fallback reruns can be performance-sensitive on
  heavy YouTube pages.

### 4. DOM extraction is the visible-card fallback, not the primary truth

DOM extraction exists because menu actions and visible cards need a current
target, and YouTube does not always expose all identity in a stable JSON path
before a user interacts with a specific card.

Proof:

- `js/content_bridge.js:9700-9797` extracts channel identity from avatar,
  metadata, UC, `/c/`, and `/user/` links when available.
- `js/content_bridge.js:9800-9932` uses modern lockup metadata for non-Shorts
  cards, including collaboration and low-confidence name-only cases.
- `js/content_bridge.js:9983-9986` explicitly refuses to treat lockup metadata
  text containing title/view-count separators as a channel name.
- `js/content_bridge.js:10031-10065` uses `videoChannelMap` as stronger
  evidence for YTM fallback cards when only video id is stable.
- `js/content/dom_fallback.js:593-679` resolves the current watch owner from
  DOM but prefers `videoChannelMap[videoId]` when present to avoid stale owner
  rows during SPA transitions.

Why it works:

- It lets quick/menu actions operate on the card the user clicked.
- It covers rendered surfaces where the JSON harvester has not yet populated a
  map or where modern lockup DOM carries a direct canonical link.

Current boundary:

- DOM identity can be incomplete or stale during SPA transitions.
- DOM text is especially weak on watch and Shorts pages because the surface can
  expose only `/watch?v=VIDEO_ID` or `/shorts/VIDEO_ID`.
- DOM fallback must not be treated as a license to infer owner/title data that
  YouTube has not exposed.

### 5. Video-id-only surfaces require map, player, JSON, or fallback resolver proof

Shorts, watch-page player surfaces, playlist rows, and some YTM/mobile cards
often expose only video identifiers in DOM. In those states, FilterTube can
only make channel-accurate decisions if another layer already learned identity.

Proof:

- `js/content_bridge.js:11449-11475` detects Shorts cards structurally and by
  `/shorts/` links.
- `js/content_bridge.js:11477-11490` extracts Shorts video IDs from
  `data-filtertube-video-id` or `/shorts/VIDEO_ID` links.
- `js/content_bridge.js:12167-12180` turns a no-identifier menu click into
  `shorts:VIDEO_ID` or `watch:VIDEO_ID`.
- `js/content_bridge.js:12183-12206` consults `videoChannelMap` for watch
  playlist rows, but still routes through watch resolution when alternate
  identity is missing.
- `js/content_bridge.js:12298-12380` retries a failed block through
  `ytInitialData` before falling through to background watch/Shorts helpers.
- `js/content_bridge.js:12637-12649` stores and restamps `videoId -> channelId`
  after successful block resolution.

Why it works:

- A video id is a stable join key across JSON, player payloads, watch URLs,
  Shorts URLs, playlist rows, and learned maps.
- This lets the runtime avoid guessing channel identity from unrelated text.

Current boundary:

- If no map/player/JSON identity exists yet, channel-accurate filtering cannot
  be proven from the DOM alone.
- This is why the future fix order must preserve route-specific behavior for
  Shorts/watch instead of demanding DOM-only filtering.

### 6. Background network fetch is the last fallback, not the normal path

Network fetches exist today, but they are not the intended primary metadata
source. They are used when a user action or unresolved visible target needs a
stable owner and the current page data/maps do not provide enough.

Proof:

- `js/background.js:2664-2704` handles `fetchShortsIdentity` with session
  caching and pending fetch coalescing.
- `js/background.js:2877-2884` checks stored `videoChannelMap` before fetching
  a Shorts page.
- `js/background.js:2889-2893` fetches `https://www.youtube.com/shorts/VIDEO_ID`
  with credentials as a fallback.
- `js/background.js:2978-2995` checks stored/cached Kids watch identity before
  fetching.
- `js/background.js:3005-3009` fetches
  `https://www.youtubekids.com/watch?v=VIDEO_ID` as a fallback.
- `js/background.js:3072-3093` checks cached/stored watch identity before
  fetching.
- `js/background.js:3098-3102` fetches
  `https://www.youtube.com/watch?v=VIDEO_ID` as a fallback.
- `js/background.js:4437-4445` accepts `fetchChannelDetails` requests.
- `js/background.js:4532` starts `fetchChannelInfo`, which scrapes a YouTube
  channel page when channel details must be resolved.

Why it exists:

- Some user actions must persist a stable channel rule, not just hide one card.
- If the visible surface exposes only a video id and learned maps are missing,
  a background resolver is the only current path that can recover the canonical
  channel id/handle without relying on brittle DOM guesses.
- Background fetch avoids content-script CORS limits for direct page fetches.

Current boundary:

- There is no shared `identityInformationWaterfallAuthority` or
  `identityFetchAuthority` report that records owner, reason, route, active
  rule state, credential policy, budget, cache hit/miss, and resulting map
  writes for every fetch.
- Therefore optimization must not delete fallback fetches blindly. It must
  first prove which surfaces already have JSON/player/map identity and which do
  not.

## Surface-Specific Current Behavior

| Surface | Preferred identity source | Why DOM alone is insufficient | Current fallback |
| --- | --- | --- | --- |
| Main home/search | `/browse` and `/search` JSON, renderer byline browse endpoints, learned maps | Modern lockup DOM can carry only display text or delayed links | DOM lockup extraction, then channel details only for unresolved menu actions |
| Main watch | `ytInitialPlayerResponse`, `/player`, `/next`, `videoChannelMap` | Owner DOM can be stale during SPA transitions and the URL is only `v=VIDEO_ID` | `watch:VIDEO_ID` background resolver |
| Shorts | `reelItemRenderer`, player payload, learned `videoChannelMap` | Shorts DOM frequently exposes only `/shorts/VIDEO_ID` | `shorts:VIDEO_ID` resolver, then Shorts page fallback |
| Watch playlist / Mix | `/next` playlist panel and player playlist payloads | Rows may expose video ids and byline text but no stable alternate id | `videoChannelMap`, then `watch:VIDEO_ID` resolver |
| YouTube Kids | Kids renderer owner extensions and learned video maps | Public Kids web can expose sparse watch/card DOM | Kids watch identity fallback after stored/cached identity |
| YouTube Music | `/browse`/watch data and learned maps | YTM cards often use mobile-like text nodes and compact lockups | DOM fallback with `videoChannelMap` preference |

## Surface Information Availability Matrix

The detailed field-by-field matrix now lives in
`docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md`.
That document separates `canonical`, `joinedByVideoId`, `displayOnly`,
`fallback`, and `unknown` states for Main home/search, Main watch, Shorts,
watch rail/end screen, playlist/Mix, YouTube Kids, YouTube Music,
collaborators, posts, and comments.

This distinction matters because the four-step shorthand can otherwise hide a
critical boundary: XHR/JSON is preferred when the renderer/player payload
contains the needed field, but a URL such as `watch?v=VIDEO_ID`, a Shorts link
such as `/shorts/VIDEO_ID`, a row byline, or an avatar alt is not channel
identity by itself. Those surfaces need player/renderer proof, a learned map
join, or an explicit fallback resolver before channel-accurate decisions can be
claimed.

## Why the Existing Four-Step Shorthand Is Incomplete

The old high-level shorthand is kept here only as an audit target, not as the
current implementation contract:

```text
1. XHR JSON interception (Main World)
2. ytInitial* snapshots (Main World)
3. DOM extraction (Isolated World)
4. Network fetch (Background fallback)
```

That shorthand is useful only as a source-order mnemonic. It misses two
behavior-critical layers and must not be used as proof that identity is
proactive, complete before render, network-free, or enough to authorize a hide
decision. In particular, the old "rare fallback" wording is not safe as a
global claim because watch, Shorts, Kids watch, channel-detail, menu-action,
and post-action enrichment paths all have separate resolver reasons and
budgets.

1. **Harvested learned maps are a first-class layer.** JSON/player data is not
   just filtered once. It is converted into `channelMap`, `videoChannelMap`, and
   `videoMetaMap`, then persisted and passed back into future decisions.
2. **Video id is a join key, not full identity.** Shorts/watch/playlist cards
   can legitimately have no channel/title metadata in DOM. In those cases the
   current code must join video id to JSON/player/map/fetch data before a
   channel-accurate rule can be proven.

## Current Risks Found In This Slice

| Risk | Current proof | Why it matters |
| --- | --- | --- |
| No single identity authority | No source symbol named `identityInformationWaterfallAuthority` exists today. | Future performance work can remove or duplicate a fallback without recording why it was safe. |
| Network fetches have local guards, not a global budget | Background fetches check caches/pending maps locally, but no shared reason/budget report exists. | A no-rule/empty-list performance fix needs to prove zero unnecessary fetches. |
| Learned maps are powerful but not confidence-scored | Maps can be persisted, compiled, restamped, and used by DOM fallback. | Stale or weak identity can cause false hides or missing blocks. |
| DOM fallback is necessary but cannot infer missing semantics | Watch/Shorts DOM may only expose video id. | Broadening DOM selectors can create false confidence and false hides. |
| Menu actions can trigger identity resolution | No-identifier menu clicks route to `shorts:` or `watch:` resolvers. | Quick/menu behavior must be audited separately from passive filtering. |

## Future Authority Shape

Any future optimization should produce an identity decision record like:

```text
identityDecision {
  surface: main | shorts | kids | ytm
  route: home | search | watch | shorts | playlist | comments | post
  source: ytInitialData | ytInitialPlayerResponse | youtubei | learnedMap | dom | backgroundFetch
  sourceConfidence: canonical | joinedByVideoId | displayOnly | fallback
  videoId: optional
  channelId: optional
  handle: optional
  title: optional
  reason: passiveHarvest | activeFilter | userMenuAction | quickBlock | repair
  networkUsed: true | false
  credentialPolicy: none | include
  cacheHit: true | false
  writes: channelMap | videoChannelMap | videoMetaMap | domStamp | none
  budgetOwner: compiledRuleState / userAction / explicitResolver
}
```

Until that exists, the audit gate remains closed for broad behavior changes.

## Subagent Validation

The read-only subagent review from Ptolemy independently confirmed the same
waterfall:

- Main-world `seed.js` hooks page globals and `/youtubei/v1/*` endpoints first.
- `filter_logic.js` harvests player, renderer, playlist, and Kids owner data
  before or while filtering.
- `channelMap`, `videoChannelMap`, and `videoMetaMap` are the cross-surface
  memory layer.
- Watch, Shorts, playlist, Kids, and YTM need surface-specific handling because
  DOM sometimes exposes only video IDs or weak display text.
- Background Shorts/watch/Kids/channel fetches are fallback resolvers and still
  need shared owner/reason/budget authority before optimization.

## Current Behavior Fixtures Added By This Slice

- `identity_waterfall_doc_documents_actual_source_order`
- `identity_waterfall_seed_intercepts_page_globals_and_youtubei_endpoints`
- `identity_waterfall_filter_logic_harvests_player_renderer_playlist_and_kids_identity`
- `identity_waterfall_content_bridge_persists_maps_and_uses_video_id_join_keys`
- `identity_waterfall_dom_extraction_has_explicit_low_confidence_boundaries`
- `identity_waterfall_background_fetch_checks_maps_or_caches_before_html_fetch`
- `identity_waterfall_menu_actions_can_escalate_to_watch_or_shorts_resolvers`
- `identity_waterfall_background_channel_details_fetch_is_action_fallback`
- `identity_waterfall_no_shared_authority_symbol_exists_yet`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity information waterfall can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
