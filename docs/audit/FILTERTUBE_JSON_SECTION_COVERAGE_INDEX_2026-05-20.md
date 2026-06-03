# FilterTube JSON Section Coverage Index - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This index is narrower than `docs/json_paths_encyclopedia.md`. The
encyclopedia records paths seen in captured YouTube JSON. This index records
whether each documented `###` JSON section is consumed by current runtime code
as a direct rule, harvest-only input, joined identity input, support model, or
still a gap.

The important rule is:

```text
documented JSON section != live filtering authority
```

Every future renderer patch must keep this distinction until fixtures prove the
route, mode, source confidence, effect, and sibling-visible behavior.

## Coverage Classes

| Class | Meaning |
| --- | --- |
| `direct-rule` | The renderer or model is represented by `FILTER_RULES` and can influence current JSON hide/allow/removal decisions. |
| `direct-rule-partial` | The renderer is represented by `FILTER_RULES`, but documented identity or metadata fields are not fully consumed. |
| `harvest-only` | Current runtime can learn identity or metadata from the section, but that section is not direct JSON filtering authority. |
| `joined-by-video-id` | Runtime mostly uses a video id from this section and joins it to player data, learned maps, DOM, or a resolver. |
| `support-model` | The section supports badges, avatar stacks, menus, or UI/context logic rather than a direct content-renderer rule. |
| `unsupported/direct-gap` | The documented section is not a direct `FILTER_RULES` entry and must not be claimed as covered. |

## JSON Section Index

| JSON encyclopedia section | Current coverage class | Current runtime evidence | Boundary before behavior changes |
| --- | --- | --- | --- |
| `radioRenderer` | `direct-rule-partial` | `js/filter_logic.js` has `radioRenderer` direct fields for video id, title, and byline/count text. | `playlistId` is documented as primary Mix identity but is not modeled as primary runtime identity. |
| `compactRadioRenderer` | `direct-rule-partial` | `js/filter_logic.js` has `compactRadioRenderer` direct fields for video id, title, and byline/count text. | Same Mix boundary: playlist/seed identity is not channel-owner proof. |
| `compactPlaylistRenderer` | `unsupported/direct-gap` | The renderer is allowlisted in traversal contexts, but it is not a direct `FILTER_RULES` key. `docs/audit/FILTERTUBE_YTM_COMPACT_PLAYLIST_CREATOR_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`, `tests/runtime/ytm-compact-playlist-creator-authority-boundary-current-behavior.test.mjs`, and `tests/runtime/fixtures/captures/ytm-compact-playlist-renderer.json` prove canonical creator-looking fields are present while blocklist rules, whitelist nonmatch, whitelist match, and `hidePlaylistCards` preserve the row. | Needs playlist creator versus playlist id versus row owner fixtures, whitelist fail-open policy, side-effect budget, and sibling-visible proof before coverage claims or JSON-first promotion. |
| `playlistPanelVideoRenderer` / `playlistVideoRenderer` | `direct-rule` plus `harvest-only` | `playlistPanelVideoRenderer` and `playlistVideoRenderer` use `BASE_VIDEO_RULES`; playlist-panel mappings are also harvested into video/channel maps. | Selected-row, stale-row, playlist owner, and nonmatching sibling behavior still need fixtures. |
| `shortsLockupViewModel` (Modern Feed / Up Next) | `direct-rule-partial` plus `harvest-only` | Direct rules consume video id and title/accessibility text; decorated-avatar owner identity can be harvested in helper traversal. | Documented owner id/handle/logo paths are not fully direct-rule coverage. |
| `shortsLockupViewModel` (Grid Shelf Variant) | `direct-rule-partial` | Current direct rule does not consume all documented grid-shelf author/avatar owner fields. | Grid-shelf owner-present and owner-missing fixtures are required before changing Shorts behavior. |
| `reelItemRenderer` | `direct-rule-partial` | Direct rule consumes video id, headline, and one channel-name path. | Documented active overlay UC id, handle, and logo remain outside direct rule coverage. |
| `reelPlayerOverlayRenderer` | `unsupported/direct-gap` | The active overlay is documented but is not a direct `FILTER_RULES` key. | Active Shorts playback identity needs separate source/effect proof before use. |
| `universalWatchCardRenderer` | `direct-rule-partial` | Wrapped universal watch-card fields are direct rules. | Direct child renderers such as hero/RH panel/rich header remain separate gaps. |
| `searchRefinementCardRenderer` | `unsupported/direct-gap` | The section is documented, but no direct `FILTER_RULES` key exists. `docs/audit/FILTERTUBE_MAIN_SEARCH_REFINEMENT_CARD_CURRENT_BEHAVIOR_2026-05-24.md`, `tests/runtime/main-search-refinement-card-current-behavior.test.mjs`, and `tests/runtime/fixtures/captures/main-search-refinement-card-renderer.json` prove one real Main mobile search refinement album card passes through matching blocklist and whitelist nonmatch modes while a supported watch-card sibling can be removed. | Search refinement cards still need first-class decision policy, route/surface side-effect proof, no-work budget, and broader sibling-visible fixtures before filtering claims or JSON-first promotion. |
| `compactChannelRenderer` | `unsupported/direct-gap` | `channelRenderer` exists, but `compactChannelRenderer` is not a direct `FILTER_RULES` key. | Standalone compact channel-card behavior needs a dedicated fixture. |
| `videoWithContextRenderer` | `direct-rule-partial` | Direct rule consumes video id, headline, byline ids, canonical URLs, description, duration, published time, and views. | Documented `showSheetCommand` collaborator roster is not consumed by the filter-logic collaborator scanner today. |
| `lockupViewModel` | `direct-rule-partial` plus `harvest-only` | Direct rule consumes content/video id, title, decorated-avatar id/handle, metadata rows, duration, and published time; harvest helpers can learn lockup owner mappings. | Collaborator sheet and some nested high-nesting variants still need fixture proof. |
| `compactVideoRenderer` | `direct-rule` plus `harvest-only` | `compactVideoRenderer` uses `BASE_VIDEO_RULES`; Kids owner extension can be harvested. | Kids direct rule timing versus learned-map timing still needs Kids browse/watch/list-mode fixtures. |
| `backstagePostRenderer` | `direct-rule` | `backstagePostRenderer` and `backstagePostThreadRenderer` are direct rule entries. | Modern post variants and shared-post identity splits still need separate proof. |
| `sharedPostRenderer` | `unsupported/direct-gap` | The section is documented, but no direct `FILTER_RULES` key exists. | Future support must separate sharer identity from original post author identity. |
| `commentRenderer` | `direct-rule-partial` | Direct rule consumes author UC id, author text, and comment text. | Documented handle URL, thumbnail, owner flag, comment id, counts, and continuation context are not direct fields. |
| `yt-badge-view-model` | `support-model` | Badge models can support content/category/status interpretation, but they are not a direct renderer rule. | Badge effects must be tied to an explicit content/category predicate, not broad renderer authority. |
| `yt-avatar-stack-view-model` | `support-model` plus `harvest-only` | Filter logic and content bridge scan avatar stacks for collaborator candidates. | Avatar stacks can be contextual or decorative; collaborator identity needs provenance proof. |
| `ytm-bottom-sheet-renderer` | `support-model` | It supports YTM/fallback menu surfaces, not direct JSON filtering. | Menu action authority and YTM route proof must precede behavior changes. |

## Current Runtime Boundary

Current runtime has no single section-level coverage report. The absence of a
direct `FILTER_RULES` key does not mean a section is irrelevant, and the
presence of a direct key does not mean every documented field is safe for every
effect.

Future changes need a report with at least:

```text
jsonSectionCoverageDecision {
  sectionName,
  rendererFamily,
  routeSurface,
  settingsMode,
  runtimeClass,
  consumedFields,
  documentedButUnconsumedFields,
  allowedEffects,
  deniedEffects,
  requiredFixtures
}
```

No runtime symbol currently exists for:

- `jsonSectionCoverageDecision`
- `jsonSectionCoverageIndex`
- `documentedJsonSectionAuthority`
- `jsonSectionFieldEffectAuthority`

## Filter Logic Direct Renderer Rule Addendum

`docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs`
pin the direct-rule side of this section index to current source. The addendum
enumerates 45 top-level `FILTER_RULES` source declarations, 44 unique direct renderer names, 7 `BASE_VIDEO_RULES` aliases, 38 object literal rules, and 11 semantic rule groups. It records the `gridVideoRenderer` duplicate as a
source-burden and JSON-path authority boundary, not as proof that every
documented `gridVideoRenderer` field is covered. No
`filterLogicDirectRuleAuthority`, `filterLogicRendererRuleReport`,
`rendererRuleDuplicatePolicy`, `rendererRuleFieldPathManifest`,
`rendererRuleEffectDecision`, or `rendererRuleFixtureProvenance` exists in
runtime source yet.

This file is an audit index only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON section coverage index can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
