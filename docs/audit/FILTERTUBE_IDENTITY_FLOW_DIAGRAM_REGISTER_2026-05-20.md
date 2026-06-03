# FilterTube Identity Flow Diagram Register - 2026-05-20

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This register converts the channel-identity waterfall into source-backed flow
diagrams. It exists because the shorthand:

```text
XHR JSON -> ytInitial* -> learned maps -> DOM -> resolver/network
```

is useful only when each route also names its source-confidence class, join keys,
side effects, and fallback owner. These diagrams are current-behavior
maps, not future authority.

## Flow 1: Endpoint Body To Learned Maps

```text
YouTubei fetch/XHR/page global
        |
        v
seed processWithEngine(data, name)
        |
        +--> active JSON mutation path
        |
        +--> skip mutation but call FilterTubeEngine.harvestOnly(...)
                 |
                 v
          channelMap / videoChannelMap / videoMetaMap page messages
                 |
                 v
          content bridge persists or stamps learned identity
```

Current proof:

- `js/seed.js:336` defines `processWithEngine(data, dataName)`.
- `js/seed.js:368-371` can call `FilterTubeEngine.harvestOnly(...)` when
  engine mutation is skipped.
- `js/filter_logic.js:72` emits `FilterTube_UpdateVideoChannelMap`.
- `js/filter_logic.js:3485-3491` exposes `harvestOnly(data, settings)`.
- `js/content_bridge.js:5482` receives `FilterTube_UpdateVideoChannelMap`.

Audit consequence: no-rule or skipped-mutation states can still spend JSON
body work and learned-map work. A future no-work optimization must prove zero
clone/parse/rewrite/harvest/map-write work separately from hide correctness.

## Flow 2: Watch Current Video

```text
ytInitialPlayerResponse / /player / /next
        |
        v
videoId -> channelId mapping harvest
        |
        v
watch DOM owner row
        |
        +--> if DOM owner is usable: compare with active rules
        |
        +--> if only videoId or stale owner: join videoChannelMap[videoId]
        |
        +--> if still incomplete: watch:VIDEO_ID resolver
                 |
                 v
          background Main/Kids watch HTML fallback after cache/map checks
```

Current proof:

- `js/filter_logic.js:1174-1219` harvests player owner identity into maps.
- `js/content/dom_fallback.js:593` defines `getCurrentWatchOwnerMeta(settings)`.
- `js/content_bridge.js:12167-12224` routes watch/playlist actions through
  `watch:VIDEO_ID` when a stable channel identity is missing or incomplete.
- `js/background.js:2718` chooses Kids watch fallback before Main watch fallback
  on Kids surfaces.
- `js/background.js:2978` defines `performKidsWatchIdentityFetch(videoId)`.

Audit consequence: watch-page source confidence is not enough by itself because
watch effects can include hide, pause, selected playlist-row changes, alternate
clicks, map writes, and resolver fetches.

## Flow 3: Shorts

```text
Shorts renderer/player payload
        |
        +--> sometimes videoId/title only in current direct rule coverage
        |
        v
visible DOM often exposes /shorts/VIDEO_ID first
        |
        +--> join videoChannelMap[videoId] if present
        |
        +--> otherwise shorts:VIDEO_ID / fetchShortsIdentity resolver
                 |
                 v
          learned map update and optional post-action visible-row fanout
```

Current proof:

- `js/filter_logic.js:811-820` covers `reelItemRenderer`,
  `shortsLockupViewModel`, and `shortsLockupViewModelV2` with partial direct
  fields.
- `js/content_bridge.js:11457-11507` treats Shorts DOM hosts and `/shorts/`
  anchors as target surfaces.
- `js/content_bridge.js:7820` can enrich visible unmapped Shorts after a block.
- `js/content_bridge.js:8051-8083` sends `fetchShortsIdentity` for Shorts
  resolver recovery.
- `js/background.js:3961` handles the background `fetchShortsIdentity` action.

Audit consequence: Shorts cannot be treated as universally JSON-complete.
Blocklist leak proof and whitelist fail-closed proof must cover both map-hit
and map-miss states.

## Flow 4: Watch Playlist And Mix

```text
playlistPanelVideoRenderer / playlistVideoRenderer
        |
        v
row videoId + sometimes owner byline / browse id
        |
        +--> direct row decision when owner fields are enough
        |
        +--> videoChannelMap join when row has only videoId
        |
        +--> watch:VIDEO_ID resolver when persisted identity needs handle/custom URL

compactPlaylistRenderer / Mix / radio-like cards
        |
        v
playlist identity or seed video may exist while owner channel is absent
        |
        v
must not collapse playlist identity into creator/channel identity without fixture proof
```

Current proof:

- `js/filter_logic.js:433` maps `playlistPanelVideoRenderer` to
  `BASE_VIDEO_RULES`.
- `js/filter_logic.js:1250` harvests `playlistPanelVideoRenderer` rows.
- `js/filter_logic.js:1615` treats `compactPlaylistRenderer` as traversal
  context, not a direct identity authority.
- `js/content_bridge.js:3904-3931` unwraps `playlistPanelVideoRenderer` shapes.
- `js/content_bridge.js:12203-12224` prefers `watch:VIDEO_ID` recovery for
  watch playlist rows when identity quality is insufficient.

Audit consequence: selected/current playlist-row behavior must be preserved,
and Mix/playlist identity must stay separate from channel identity.

## Flow 5: Collaborator Dialogs And Sheets

```text
JSON renderer byline command
        |
        +--> filter_logic reads showDialogCommand list items
        |
        +--> bridge/injector reads showDialogCommand and showSheetCommand variants
        |
        v
collaborator cache / DOM menu enrichment
        |
        v
hide or persist only after role and source confidence are proven
```

Current proof:

- `js/filter_logic.js:2900` notes avatar-stack collaborator surfaces.
- `js/filter_logic.js:3000-3027` prioritizes `showDialogCommand`.
- `js/content_bridge.js:3792-3801` reads both `showDialogCommand` and
  `showSheetCommand` list-item variants.
- `js/content_bridge.js:3815-3822` reads sheet/dialog header title variants.
- `js/content_bridge.js:4422` treats a byline as a collaboration signal so
  enrichment can run.

Audit consequence: collaborator identity can mean uploader, collaborator,
sharer, or original owner depending on surface. Future behavior needs a role
field before hide, whitelist, or persistence changes.

## Flow 6: Kids And YouTube Music

```text
Kids/YTM JSON payload
        |
        +--> Kids owner extension or compact owner field when present
        +--> YTM video-with-context field when present
        |
        v
public web DOM may expose sparse labels or mixed metadata
        |
        +--> learned-map join
        +--> route-specific resolver
```

Current proof:

- `js/filter_logic.js:1335` harvests `kidsVideoOwnerExtension`.
- `js/content_bridge.js:1228` explicitly avoids Kids passive prefetch network
  and relies on network JSON/map paths for that prefetch surface.
- `js/background.js:2718` still allows Kids watch resolver fallback for explicit
  watch identity requests.
- `js/content_bridge.js:10036-10068` treats YTM identity as map/main-world
  lookup work when compact DOM is not enough.

Audit consequence: Kids and YTM are not alien paths, but they are not identical
to Main YouTube. They need route-specific source/effect proof before pruning
fallbacks or reusing Main DOM assumptions.

## Flow 7: Post-Action Fanout

```text
user confirms block on one target
        |
        v
clicked target hide / persist
        |
        +--> visible Shorts enrichment for unmapped rows
        +--> visible playlist-row enrichment for unmapped rows
        |
        v
additional hide/map/fetch work can occur beyond clicked target
```

Current proof:

- `js/content_bridge.js:7722-8008` contains visible Shorts and playlist
  enrichment loops after block actions.
- `js/content_bridge.js:7868-7890` sends `fetchWatchIdentity`.
- `js/content_bridge.js:8051-8083` sends `fetchShortsIdentity`.
- `js/background.js:3961-3964` handles both Shorts and watch identity actions.

Audit consequence: this may be useful same-channel cleanup, but it is not the
same as exact clicked-target work. A future authority must distinguish clicked
target effects from visible-sibling fanout effects.

## Checklist Before Any Identity Optimization

For the route being changed, require all of the following:

- route and renderer/DOM target family
- profile type, viewing space, and list mode
- active rule family and empty/disabled state
- source tier before the decision
- confidence class: `canonical`, `joinedByVideoId`, `displayOnly`, `fallback`,
  or `unknown`
- exact target versus visible-sibling fanout
- allowed effects and forbidden effects
- resolver reason and credential policy
- positive fixture and negative sibling fixture
- restore, teardown, and no-work proof

No runtime symbol exists yet for:

- `identityFlowDiagramAuthority`
- `identityFlowDecision`
- `identityFlowEffectReport`

This register is a map for the audit. It does not authorize JSON expansion,
DOM fallback deletion, resolver pruning, learned-map trust changes, whitelist
fail-closed changes, post-action fanout changes, or no-work optimization.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this identity flow diagram register can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
