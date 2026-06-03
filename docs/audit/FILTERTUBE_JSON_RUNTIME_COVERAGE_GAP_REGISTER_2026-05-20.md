# FilterTube JSON Runtime Coverage Gap Register - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged. This register answers a narrower question than
the existing JSON path and surface availability docs:

```text
documented JSON field
        |
        v
is the field consumed by the current runtime path that can decide hide,
allow, stamp, persist, fetch, or only harvest?
```

The current answer is mixed. `docs/json_paths_encyclopedia.md` is a useful
source map, but a documented path is not the same as runtime coverage. Current
runtime coverage is split across:

```text
FILTER_RULES direct renderer fields
        |
        +--> hide/allow/remove renderer

_harvestRendererChannelMappings / _harvestVideoOwnerFromRenderer
        |
        +--> learned channel/video maps

ytInitialData / ytInitialPlayerResponse / YouTubei endpoint interception
        |
        +--> preferred JSON/player evidence when consumed

DOM extraction / learned maps / background resolver
        |
        +--> join, display, repair, or fallback fetch when JSON coverage is absent
```

## Current Coverage Classes

| Class | Meaning | Safe interpretation |
| --- | --- | --- |
| `direct-rule` | `FILTER_RULES` names the renderer and field family. | Can participate in current JSON hide/allow decisions, subject to list-mode and target effects. |
| `harvest-only` | Helper traversal learns identity or metadata but the renderer field is not a direct rule. | Can populate maps, but is not the same as direct filtering coverage. |
| `joined-by-video-id` | Runtime has only a `videoId` on this surface and joins through learned/fetched identity. | Good for recovery, not proof that the card JSON carried owner identity at decision time. |
| `documented-gap` | The encyclopedia documents the path, but the inspected runtime path does not consume it. | Must not be claimed as covered until a fixture and runtime path exist. |
| `unsupported/direct-gap` | Renderer is documented or inventoried, but no direct `FILTER_RULES` entry exists. | Needs a future fixture before implementation. |

## Source-Backed Gap Table

| Surface / renderer | Documented JSON evidence | Current runtime coverage | Risk |
| --- | --- | --- | --- |
| `shortsLockupViewModel` | The encyclopedia documents title/video id plus owner `browseEndpoint.browseId`, `canonicalBaseUrl`, logo, `belowThumbnailMetadata` author identity, and thumbnail fields. See `docs/json_paths_encyclopedia.md:2141-2163` and `4851-4869`. | Direct `FILTER_RULES` only read `videoId` and `accessibilityText` at `js/filter_logic.js:816-823`. Harvest can learn some lockup decorated-avatar owner ids through `_harvestVideoOwnerFromRenderer()` at `js/filter_logic.js:1335-1365`, but that is map harvest, not direct rule coverage for every documented Shorts owner path. | Channel rules for Shorts can depend on learned maps or fallback instead of the current card rule path; whitelist can fail closed while identity is unresolved. |
| `reelItemRenderer` / active reel overlay | The encyclopedia documents classic `reelItemRenderer` owner id and active `reelPlayerOverlayRenderer` channel name, UC id, handle, and logo at `docs/json_paths_encyclopedia.md:2186-2196` and `4872-4887`. | Direct `FILTER_RULES` read `videoId`, `headline.simpleText`, and one `channelTitleText.simpleText` name path at `js/filter_logic.js:811-815`. There is no direct UC id, handle, or logo extraction in the rule. | Name-only Shorts/reel coverage is weaker than canonical owner coverage; channel blocking may need map/fetch repair. |
| `videoWithContextRenderer` collaborator `showSheetCommand` | The encyclopedia documents the collaborator sheet discriminator and per-collaborator id/name/handle/logo paths at `docs/json_paths_encyclopedia.md:153-182`, `2762-2764`, and `4906-4907`. | Direct video fields are covered at `js/filter_logic.js:436-463`. The collaborator scanner in `_extractChannelInfo()` currently scans `showDialogCommand` at `js/filter_logic.js:3000-3027`, not the documented `showSheetCommand.sheetViewModel` path. | A collaborator roster can be documented and present in JSON but still miss direct filter-logic collaborator authority. |
| `compactPlaylistRenderer` | The encyclopedia documents playlist id, creator name, creator UC id, handle, thumbnail/sidebar fields, and menu items at `docs/json_paths_encyclopedia.md:930-972` and `4813-4834`. `docs/audit/FILTERTUBE_YTM_COMPACT_PLAYLIST_CREATOR_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`, `tests/runtime/ytm-compact-playlist-creator-authority-boundary-current-behavior.test.mjs`, and `tests/runtime/fixtures/captures/ytm-compact-playlist-renderer.json` prove canonical creator-looking fields are present in one real YTM fixture. | `compactPlaylistRenderer` appears in renderer allowlists and inventory checks, but it has no direct `FILTER_RULES` entry in the inspected rule block, so it remains unsupported/direct-gap and not first-class JSON filter authority. Current blocklist rules, whitelist nonmatch, whitelist match, and `hidePlaylistCards` preserve the row while channel-map side effects still fire. | Playlist creator blocking can leak or fall back to DOM/video-id workflows; adding a rule later needs playlist-owner versus playlist-id fixture proof plus whitelist fail-open/nonmatch policy, side-effect budget, route/surface scope, and sibling-visible proof. |
| `radioRenderer` / `compactRadioRenderer` Mix | The encyclopedia documents `playlistId` as primary identity, `videoId`, Mix overlays, title, counts, and notes that Mix usually lacks owner channel id at `docs/json_paths_encyclopedia.md:188-239` and `4789-4811`. | Current rules read `videoId`, `title`, and byline/count text as `description` at `js/filter_logic.js:673-690`. They do not model `playlistId` as the primary Mix identity and do not expose owner channel identity. | Treating Mix text/byline as channel identity can cause false confidence; treating Mix as normal video can leak playlist-level intent. |
| Direct watch-card renderers | The encyclopedia documents hero watch-card video/playlist and CTA fields at `docs/json_paths_encyclopedia.md:2711-2713` and `4939-4942`. The inventory still lists direct hero/watch-card gaps at `docs/youtube_renderer_inventory.md:455`, `660`, and `751`. | Wrapped `universalWatchCardRenderer` is covered at `js/filter_logic.js:528-566`, but direct `watchCardHeroVideoRenderer`, `watchCardRHPanelVideoRenderer`, and `watchCardRichHeaderRenderer` are not direct `FILTER_RULES` keys. | Watch rail/card JSON can be present but not direct-rule-authoritative; end-screen/rail fixes require direct and wrapper fixtures. |
| `sharedPostRenderer` | The encyclopedia documents sharer UC id, display name, and original nested post shape at `docs/json_paths_encyclopedia.md:3296-3302` and `4977-4982`. `docs/audit/FILTERTUBE_SHARED_POST_RENDERER_SOURCE_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` and `tests/runtime/shared-post-renderer-source-only-boundary-current-behavior.test.mjs` pin that this is still source/fixture-gap proof rather than route-complete support. | `backstagePostRenderer` and `backstagePostThreadRenderer` are covered at `js/filter_logic.js:727-740`, but `sharedPostRenderer` is not a direct `FILTER_RULES` key. Synthetic shared posts preserve under blocklist keyword/channel and whitelist nonmatch modes while map harvest can still learn sharer and original identities; the committed fixture corpus still has zero real `sharedPostRenderer` rows. | Shared posts can blur sharer versus original author unless a future rule proves both roles, whitelist behavior, side-effect budget, real route fixture behavior, and negative sibling behavior. |
| `commentRenderer` | The encyclopedia documents author name, UC id, handle URL, thumbnail, owner flag, text, vote/reply counts, and comment id at `docs/json_paths_encyclopedia.md:3857-3860` and `4984-4995`. | Current `commentRenderer` direct rule reads `authorEndpoint.browseEndpoint.browseId`, `authorText.simpleText`, and comment text at `js/filter_logic.js:827-831`. It does not direct-extract author handle URL, thumbnail, owner flag, or comment id. | Comment hiding can work for text/UC id while persistence/menu/context remains incomplete. |
| `kidsVideoOwnerExtension` | The encyclopedia documents Kids `kidsVideoOwnerExtension.externalChannelId` at `docs/json_paths_encyclopedia.md:3240` and `4931`. | `_harvestVideoOwnerFromRenderer()` consumes `kidsVideoOwnerExtension.externalChannelId/channelId` at `js/filter_logic.js:1342-1343`, while direct compact-video filtering still uses the shared video rule paths. | Kids owner identity is harvest-supported, but direct rule versus map timing still needs Kids browse/watch/whitelist fixtures. |

## What This Means For The Waterfall

The concise waterfall remains directionally correct:

```text
XHR JSON interception
  -> ytInitial* snapshots
  -> DOM extraction
  -> network fetch fallback
```

But the implementation is not a blanket guarantee. A future change must first
classify the exact field as:

```text
documented only
  direct-rule
  harvest-only
  joined-by-video-id
  display-only
  fallback resolver
```

Then it must prove the intended effect:

```text
hide/allow decision
  map write
  menu label/stamp
  persistence row
  DOM rerun
  network fetch
  no effect
```

Without that two-part proof, JSON-first wording can accidentally hide the real
bug: a field exists in YouTube JSON, but the runtime path being exercised does
not consume it where the user expects.

## Required Future Authority

Before changing JSON extraction, pruning DOM fallback, pruning network fallback,
or claiming JSON-first completeness, add a runtime/reporting authority that can
emit at least:

```text
jsonRuntimeCoverageAuthority
jsonRuntimeCoverageDecision
rendererFieldCoverageClass
jsonFieldEffectAuthority
jsonDocumentedButUnsupported
```

No runtime source currently defines those tokens. This document is a proof
register, not an implementation.

## Filter Logic Direct Renderer Rule Addendum

`docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs`
split direct runtime renderer rule declarations from documented JSON field
coverage. The addendum pins 45 current top-level `FILTER_RULES` declarations
and 44 unique renderer keys in `js/filter_logic.js`, including duplicate `gridVideoRenderer` source declarations and 7 `BASE_VIDEO_RULES` aliases. It
also keeps unsupported direct gaps explicit: `compactPlaylistRenderer`,
`watchCardHeroVideoRenderer`, `watchCardRHPanelVideoRenderer`,
`watchCardRichHeaderRenderer`, `searchRefinementCardRenderer`,
`compactChannelRenderer`, `sharedPostRenderer`, and
`reelPlayerOverlayRenderer` are documented evidence but not direct rule
declarations. No `filterLogicDirectRuleAuthority`,
`filterLogicRendererRuleReport`, `rendererRuleDuplicatePolicy`,
`rendererRuleFieldPathManifest`, `rendererRuleEffectDecision`, or
`rendererRuleFixtureProvenance` exists in runtime source yet.

## Filter Logic Rule Path Addendum

`docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs`
split current executable runtime path strings from broader documented JSON
field coverage. The addendum pins 440 effective runtime path rows after the
duplicate `gridVideoRenderer` override, 174 unique effective path literals,
177 effective renderer-field pairs, 151 text-match path rows, 152 channel identity path rows, 34 video identity path rows, and 103 metadata predicate path rows. It also pins the current syntax boundary: 157 effective path rows use dot numeric indexes, 0 use bracket numeric indexes, and runtime/build source does not load `docs/json_paths_encyclopedia.md`. This keeps the gap register honest:
documented Shorts, reel, collaborator, compact playlist, Mix, direct watch-card, post, and comment metadata paths remain gap classes until they are normalized
into runtime path syntax, tied to renderer/route/list-mode effects, and backed
by fixtures. No `filterLogicRulePathAuthority`,
`filterLogicRulePathManifest`, `filterLogicRulePathSyntaxContract`,
`filterLogicEffectiveRendererPathReport`,
`filterLogicDuplicatePathOverridePolicy`, `filterLogicJsonDomParityReport`,
`filterLogicPathFixtureProvenance`, `filterLogicJsonFirstReadinessGate`,
`filterLogicPathEffectDecision`, or `filterLogicPathNoRuleBudget` exists in
runtime source yet.

## Filter Logic Rule Field Effect Addendum

`docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs`
split field availability from effect authority. The addendum pins 11 runtime consumer fields, 9 consumer methods, 20 method-field consumer pairs, and 63
`rules.<field>` token references. It keeps runtime coverage gaps explicit:
`viewCount` is metadata/search text only with no current view-count threshold predicate, `videoId` is a join key rather than channel identity, category filtering can schedule `scheduleVideoMetaFetch()` when metadata is missing, and
disabled filtering still occurs after harvest in `processData()`. Documented paths cannot be promoted to first-class JSON filters until each field has
route/surface, list-mode, identity-confidence, mutation-effect, DOM parity,
native parity, no-rule, category-fetch, positive-fixture, and negative-sibling
proof. No `filterLogicRuleFieldEffectAuthority`,
`filterLogicRuleFieldEffectManifest`, `filterLogicJsonPathEffectDecision`,
`filterLogicFieldConsumerReport`, `filterLogicViewCountPredicateAuthority`,
`filterLogicCategoryFetchBudget`, `filterLogicWhitelistFieldEffectReport`,
`filterLogicRuleFieldFixtureProvenance`, `filterLogicRuleFieldNoWorkBudget`, or
`filterLogicJsonFirstEffectGate` exists in runtime source yet.

## JSON-First Readiness Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`
and
`tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs`
turn the gap into a blocked promotion matrix. It pins 13 blocked rows:
normalized path syntax, renderer ownership, field-effect authority,
route/surface scope, list-mode semantics, identity confidence, mutation effect,
category/network budget, no-rule/no-work budget, fixture provenance, DOM fallback parity, native parity, and optimization budget. It also preserves the
current source blockers: dot-index runtime paths rather than bracket-index docs paths, no loaded JSON path manifest, `viewCount` as metadata/search text only,
`videoId` as a join key rather than channel identity, category metadata fetch work through `scheduleVideoMetaFetch()`, harvest before disabled filtering in
`processData()`, and whitelist mode bypassing the old no-rule fast path. No
`jsonFirstFilterReadinessGate`, `jsonFirstPathSyntaxManifest`,
`jsonFirstRendererCoverageDecision`, `jsonFirstFieldEffectDecision`,
`jsonFirstRouteSurfaceReport`, `jsonFirstListModeMatrix`,
`jsonFirstIdentityConfidenceReport`, `jsonFirstMutationEffectReport`,
`jsonFirstCategoryFetchBudget`, `jsonFirstNoWorkBudget`,
`jsonFirstFixtureProvenance`, `jsonFirstDomParityReport`,
`jsonFirstNativeParityReport`, or `jsonFirstOptimizationBudget` exists in
runtime source yet.

## Runnable Proof

```bash
node --test tests/runtime/json-runtime-coverage-gap-current-behavior.test.mjs --test-reporter=spec
```

## Shared post renderer source-only boundary addendum

`docs/audit/FILTERTUBE_SHARED_POST_RENDERER_SOURCE_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/shared-post-renderer-source-only-boundary-current-behavior.test.mjs`
pin the current `sharedPostRenderer` source/fixture gap without opening the
implementation gate. Documented sharer/original paths exist, legacy post rules
exist, direct `postRenderer` and `sharedPostRenderer` rules do not, committed
capture fixtures still have zero real shared-post rows, and synthetic shared
posts preserve under blocklist and whitelist modes while channel-map side
effects can still harvest both identities.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON runtime coverage gap register can
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
