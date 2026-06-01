# FilterTube Renderer Contract Coverage - 2026-05-17

Generated static artifact comparing documented YouTube renderer/ViewModel names with `FILTER_RULES` and whitelist structural containers in `js/filter_logic.js`. This is a contract audit, not a correctness proof: direct rule presence still needs fixtures for blocklist, whitelist, route, and identity confidence.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Summary

- FILTER_RULES top-level occurrences: 44
- FILTER_RULES unique top-level keys: 43
- Whitelist structural/container keys: 7
- Documented renderer/ViewModel names found in docs: 149
- Combined renderer/ViewModel names: 155

| Status | Count | Meaning |
| --- | ---: | --- |
| DIRECT_RULE_DOCUMENTED | 38 | Documented name has a direct `FILTER_RULES` entry. Still needs fixtures. |
| DIRECT_RULE_CODE_ONLY | 4 | Code has a direct rule not found in the current docs scan. Docs may be stale. |
| DUPLICATE_RULE_LAST_WINS | 1 | The key appears more than once in `FILTER_RULES`; JavaScript object semantics keep the later rule. |
| STRUCTURAL_ONLY_DOCUMENTED | 3 | Documented name is only treated as structural/container, not directly filtered. |
| STRUCTURAL_ONLY_CODE_ONLY | 2 | Structural key not found in docs scan. |
| DOCUMENTED_NO_DIRECT_RULE | 107 | Documented renderer/ViewModel has no direct rule and is not structural-only. |

## Duplicate Rule Keys

| Renderer | Rule lines | Required audit action |
| --- | --- | --- |
| `gridVideoRenderer` | `431`, `604` | Verify which rule is effective; add fixture for fields lost by earlier definitions. |

## Runnable Fixture Status

Current runnable renderer-contract proofs live in `tests/runtime/filter-engine-current-behavior.test.mjs` and run through:

```bash
npm run audit:runtime
```

Current fixture-backed renderer findings:

| Renderer/ViewModel | Fixture result | Contract finding |
| --- | --- | --- |
| `gridVideoRenderer` | pass-current-gap | Duplicate rule means description-only keyword text is currently ignored. Common `lengthText` duration extraction still works, but simple `publishedTimeText` upload-date filtering is currently ignored. |
| `shelfRenderer` | pass-current-behavior | Shelf title keyword matches remove the whole shelf container, including non-matching child videos. |
| `richShelfRenderer` | pass-current-behavior | Rich shelf title keyword matches remove the whole rich shelf container, including non-matching child videos. |
| `compactAutoplayRenderer` | pass-current-gap | Documented renderer has no direct JSON rule and matching title text currently passes through. |
| `endScreenVideoRenderer` | pass | Direct end-screen video renderer uses `BASE_VIDEO_RULES` and is removed by keyword. |
| `compactPlaylistRenderer` | pass-current-gap | Documented renderer has no direct JSON rule; matching title and creator channel identity currently pass through directly and after `richItemRenderer` unwrap. |
| `watchCardRichHeaderRenderer` | pass-current-gap | Direct renderer has no direct JSON rule and matching header text currently passes through. |
| `universalWatchCardRenderer` | pass | Nested watch-card header text is removed through the universal wrapper rule. |
| `watchCardCompactVideoRenderer` | pass | Direct compact watch-card video renderer uses `BASE_VIDEO_RULES` and is removed by keyword. |
| `watchCardHeroVideoRenderer` | pass-current-gap | Direct hero renderer has no direct JSON rule and matching label text currently passes through. |
| `watchCardRHPanelVideoRenderer` | pass-current-gap | Documented RHS panel video renderer has no direct JSON rule today; title/channel rules pass through. |
| `postRenderer` | pass-current-gap | Direct community post text currently passes through. |
| `backstagePostRenderer` | pass | Legacy backstage posts are filtered by post text and author channel identity. |
| `backstagePostThreadRenderer` | pass | Legacy thread-wrapped backstage posts are filtered by nested post text and author channel identity. |
| `sharedPostRenderer` | pass-current-gap | Shared community posts and nested original post text currently pass through. |
| `playlistPanelRenderer` | pass-boundary-proof | Header/title text has no direct rule, but nested `playlistPanelVideoRenderer` entries are recursively filtered. |
| `channelMetadataRenderer` | pass-current-gap | Channel about/metadata text currently passes through. |
| `channelRenderer` | pass-boundary-proof | Channel search rows are channel-only: keyword-only text is ignored, and matching channel ID/handle rules block the row. |
| `compactChannelRenderer` | pass-current-gap | Documented compact channel-card identity paths are not used by a direct JSON rule today. |
| `searchRefinementCardRenderer` | pass-current-gap | Refinement query text and associated entity channel identity are not used by a direct JSON rule today. |
| `horizontalCardListRenderer` | pass-current-gap | The horizontal refinement rail remains intact because neither the container nor child refinement card has a direct rule. |
| `commentRenderer` serialized comment keyword list | pass-current-gap | Serialized `{ pattern, flags }` comment keyword entries are currently ignored because `filterKeywordsComments` is not reconstructed like `filterKeywords`/`whitelistKeywords`. |
| `commentRenderer` direct `RegExp` comment keyword list | pass-boundary-proof | Comment-specific keyword filtering works when `filterKeywordsComments` already contains real `RegExp` objects. |
| `commentRenderer` global keyword fallback | pass-current-gap | Global keyword rules still remove comments through generic metadata matching even when the explicit comment keyword list is empty. |
| `commentRenderer` author channel | pass | Matching comment author channel IDs remove the comment renderer. |
| `commentThreadRenderer` hide-all | pass | `hideAllComments` removes the whole thread through the comment renderer-type branch. |
| `commentsHeaderRenderer` hide-all | pass-current-gap | Header/count renderers remain under `hideAllComments` because there is no direct rule or explicit structural policy. |
| `shortsLockupViewModel` | pass-current-gap | Title/accessibility keyword filtering works, but channel-only rules need `videoChannelMap` or another owner identity path. |
| `shortsLockupViewModel` below-thumbnail owner | pass-current-gap | Documented search-style owner UC/handle paths under `belowThumbnailMetadata` are not used for channel rules. |
| `reelItemRenderer` | pass-current-gap | Title keyword filtering works, but the direct rule does not extract channel-bar UC/handle identity. |
| `lockupViewModel` metadata row command-run owner | pass-current-gap | Metadata-row `commandRuns` owner browse IDs are ignored when decorated-avatar identity is absent. |
| `videoWithContextRenderer` show-sheet collaborators | pass-current-gap | `showSheetCommand.sheetViewModel` collaborator rosters are not extracted by the current show-dialog collaboration parser. |
| `videoWithContextRenderer` show-dialog collaborators | pass-boundary-proof | `showDialogCommand.dialogViewModel` collaborator rosters are extracted and can block a matching collaborator channel. |
| `radioRenderer` avatar stack | pass-current-gap | Avatar-stack identity can trigger channel blocking on Mix/Radio renderers, so collaborator extraction needs a mix/radio guardrail. |
| `expandableMetadataRenderer` | pass-current-gap | Expandable/generated metadata text currently passes through. |

## Structural Container Keys

- `guideRenderer`
- `guideSectionRenderer`
- `horizontalListRenderer`
- `itemSectionRenderer`
- `richShelfRenderer`
- `sectionListRenderer`
- `shelfRenderer`

## Documented Without Direct Rule

| Renderer/ViewModel | Status | Doc references | Required audit action |
| --- | --- | --- | --- |
| `accessibilityRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2271`<br>`docs/json_paths_encyclopedia.md:2527` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `anchoredSectionRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3233` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `avatarStackViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:158`<br>`docs/json_paths_encyclopedia.md:1854`<br>`docs/youtube_renderer_inventory.md:7`<br>`docs/youtube_renderer_inventory.md:80`<br>`docs/youtube_renderer_inventory.md:89`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `avatarViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:168`<br>`docs/json_paths_encyclopedia.md:175`<br>`docs/json_paths_encyclopedia.md:182`<br>`docs/json_paths_encyclopedia.md:1855`<br>`docs/json_paths_encyclopedia.md:2170`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `backstageImageRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:608`<br>`docs/json_paths_encyclopedia.md:3290`<br>`docs/json_paths_encyclopedia.md:3386`<br>`docs/youtube_renderer_inventory.md:181`<br>`docs/youtube_renderer_inventory.md:517` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `buttonBannerViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:440` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `buttonRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:602`<br>`docs/json_paths_encyclopedia.md:1873`<br>`docs/json_paths_encyclopedia.md:2355`<br>`docs/json_paths_encyclopedia.md:3294`<br>`docs/json_paths_encyclopedia.md:3400`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `buttonViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:605`<br>`docs/json_paths_encyclopedia.md:1857`<br>`docs/youtube_renderer_inventory.md:193`<br>`docs/youtube_renderer_inventory.md:678` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `callToActionButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2713`<br>`docs/json_paths_encyclopedia.md:4941`<br>`docs/youtube_renderer_inventory.md:439` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `channelAboutMetadataRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:524` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `channelFeaturedContentRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:524` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `channelListItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:11`<br>`docs/json_paths_encyclopedia.md:15`<br>`docs/json_paths_encyclopedia.md:16`<br>`docs/json_paths_encyclopedia.md:17`<br>`docs/json_paths_encyclopedia.md:18`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `channelMetadataRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:496` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `channelSubMenuRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:504`<br>`docs/youtube_renderer_inventory.md:526`<br>`docs/youtube_renderer_inventory.md:665`<br>`docs/youtube_renderer_inventory.md:748` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `channelThumbnailWithLinkRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:149`<br>`docs/json_paths_encyclopedia.md:615`<br>`docs/json_paths_encyclopedia.md:940`<br>`docs/json_paths_encyclopedia.md:941`<br>`docs/json_paths_encyclopedia.md:1693`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `chipDividerRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:626` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `cinematicContainerViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1850` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `collectionThumbnailViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:395` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `commentActionButtonsRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:609`<br>`docs/json_paths_encyclopedia.md:3294`<br>`docs/json_paths_encyclopedia.md:3480`<br>`docs/json_paths_encyclopedia.md:4973` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `commentDialogRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3941`<br>`docs/json_paths_encyclopedia.md:4009` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `commentRepliesRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3857`<br>`docs/json_paths_encyclopedia.md:3953`<br>`docs/json_paths_encyclopedia.md:4586` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `commentReplyDialogRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3947`<br>`docs/json_paths_encyclopedia.md:4187` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `commentsHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3939`<br>`docs/json_paths_encyclopedia.md:3969`<br>`docs/youtube_renderer_inventory.md:514` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `commentSimpleboxRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3940`<br>`docs/json_paths_encyclopedia.md:3971` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `compactAutoplayRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:460`<br>`docs/youtube_renderer_inventory.md:482`<br>`docs/youtube_renderer_inventory.md:660`<br>`docs/youtube_renderer_inventory.md:746` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `compactChannelRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2696`<br>`docs/json_paths_encyclopedia.md:2725`<br>`docs/json_paths_encyclopedia.md:2726`<br>`docs/json_paths_encyclopedia.md:4950` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `compactPlaylistRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:930`<br>`docs/json_paths_encyclopedia.md:931`<br>`docs/json_paths_encyclopedia.md:932`<br>`docs/json_paths_encyclopedia.md:972`<br>`docs/json_paths_encyclopedia.md:1355`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `contentLoadingRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:613`<br>`docs/json_paths_encyclopedia.md:3789`<br>`docs/json_paths_encyclopedia.md:3952`<br>`docs/json_paths_encyclopedia.md:4495` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `contentMetadataViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1853`<br>`docs/json_paths_encyclopedia.md:2150`<br>`docs/json_paths_encyclopedia.md:3205`<br>`docs/json_paths_encyclopedia.md:3206`<br>`docs/json_paths_encyclopedia.md:3210`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `contentPreviewImageViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1852` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `continuationItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:57`<br>`docs/json_paths_encyclopedia.md:618`<br>`docs/json_paths_encyclopedia.md:1870`<br>`docs/json_paths_encyclopedia.md:3954`<br>`docs/json_paths_encyclopedia.md:4589`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `createRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3970` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `creatorHeartRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3955` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `decoratedAvatarViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2147`<br>`docs/json_paths_encyclopedia.md:2148`<br>`docs/json_paths_encyclopedia.md:3204`<br>`docs/json_paths_encyclopedia.md:3207`<br>`docs/json_paths_encyclopedia.md:3208`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `descriptionPreviewViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1859` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `dialogViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:236` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `dividerViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:624` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `dynamicTextViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1851` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `engagementPanelSectionListRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:611`<br>`docs/json_paths_encyclopedia.md:3759`<br>`docs/json_paths_encyclopedia.md:3950`<br>`docs/json_paths_encyclopedia.md:4465` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `engagementPanelTitleHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:612`<br>`docs/json_paths_encyclopedia.md:3761`<br>`docs/json_paths_encyclopedia.md:3951`<br>`docs/json_paths_encyclopedia.md:4467` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `expandableMetadataRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:444`<br>`docs/youtube_renderer_inventory.md:747` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `extractFromAvatarStackViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:80`<br>`docs/youtube_renderer_inventory.md:727` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `feedFilterChipBarRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:619` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `feedTabbedHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:582` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `flexibleActionsViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:604`<br>`docs/json_paths_encyclopedia.md:1856` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `gridRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:507` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `gridShelfViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:594`<br>`docs/json_paths_encyclopedia.md:2154`<br>`docs/json_paths_encyclopedia.md:2184`<br>`docs/json_paths_encyclopedia.md:2209` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `guideEntryRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:672` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `horizontalCardListRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2717`<br>`docs/youtube_renderer_inventory.md:436`<br>`docs/youtube_renderer_inventory.md:750` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `kidsHomeScreenRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3233` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `likeButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:230`<br>`docs/json_paths_encyclopedia.md:231`<br>`docs/json_paths_encyclopedia.md:370` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `likeButtonViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2202`<br>`docs/json_paths_encyclopedia.md:4887` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `listItemViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:164`<br>`docs/json_paths_encyclopedia.md:165`<br>`docs/json_paths_encyclopedia.md:166`<br>`docs/json_paths_encyclopedia.md:167`<br>`docs/json_paths_encyclopedia.md:168`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `listViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:158`<br>`docs/json_paths_encyclopedia.md:164`<br>`docs/json_paths_encyclopedia.md:165`<br>`docs/json_paths_encyclopedia.md:166`<br>`docs/json_paths_encyclopedia.md:167`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `lockupMetadataViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2146`<br>`docs/json_paths_encyclopedia.md:2147`<br>`docs/json_paths_encyclopedia.md:2148`<br>`docs/json_paths_encyclopedia.md:2149`<br>`docs/json_paths_encyclopedia.md:2150`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `logoViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:622` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `menuNavigationItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:143`<br>`docs/json_paths_encyclopedia.md:414`<br>`docs/json_paths_encyclopedia.md:591`<br>`docs/json_paths_encyclopedia.md:788`<br>`docs/json_paths_encyclopedia.md:1202`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `menuRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:141`<br>`docs/json_paths_encyclopedia.md:208`<br>`docs/json_paths_encyclopedia.md:381`<br>`docs/json_paths_encyclopedia.md:589`<br>`docs/json_paths_encyclopedia.md:755`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `menuServiceItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:142`<br>`docs/json_paths_encyclopedia.md:144`<br>`docs/json_paths_encyclopedia.md:145`<br>`docs/json_paths_encyclopedia.md:208`<br>`docs/json_paths_encyclopedia.md:384`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `metadataBadgeRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:950`<br>`docs/json_paths_encyclopedia.md:1139`<br>`docs/json_paths_encyclopedia.md:4835`<br>`docs/youtube_renderer_inventory.md:195` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `microformatDataRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1875` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `mobileTopbarRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:627`<br>`docs/json_paths_encyclopedia.md:1871` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `moreDrawerViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:621` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `movingThumbnailRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:617`<br>`docs/json_paths_encyclopedia.md:3160`<br>`docs/json_paths_encyclopedia.md:4903` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `multiPageMenuRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:640` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `navigationItemViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:623` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `notificationMultiActionRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:601`<br>`docs/json_paths_encyclopedia.md:2345` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `notificationTextRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:470`<br>`docs/json_paths_encyclopedia.md:592`<br>`docs/json_paths_encyclopedia.md:845`<br>`docs/json_paths_encyclopedia.md:1182` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `pageHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1848` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `pageHeaderViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1849` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `panelHeaderViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:153`<br>`docs/json_paths_encyclopedia.md:4778`<br>`docs/youtube_renderer_inventory.md:81`<br>`docs/youtube_renderer_inventory.md:268` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `playerMicroformatRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3263`<br>`docs/json_paths_encyclopedia.md:4961` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `playlistPanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:545`<br>`docs/youtube_renderer_inventory.md:551`<br>`docs/youtube_renderer_inventory.md:590` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `playlistVideoListRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1754`<br>`docs/json_paths_encyclopedia.md:1864`<br>`docs/json_paths_encyclopedia.md:1894` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `playlistVideoThumbnailRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1239`<br>`docs/json_paths_encyclopedia.md:1578` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `postRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3275`<br>`docs/json_paths_encyclopedia.md:3302`<br>`docs/json_paths_encyclopedia.md:4982` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `privacyTosViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:625` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `reelChannelBarViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2190`<br>`docs/json_paths_encyclopedia.md:2198`<br>`docs/json_paths_encyclopedia.md:2199`<br>`docs/json_paths_encyclopedia.md:2200`<br>`docs/json_paths_encyclopedia.md:2201`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `reelPlayerOverlayRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:596`<br>`docs/json_paths_encyclopedia.md:2190`<br>`docs/json_paths_encyclopedia.md:2194`<br>`docs/json_paths_encyclopedia.md:2196`<br>`docs/json_paths_encyclopedia.md:2253`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `reelWatchAccessibilityRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:597`<br>`docs/json_paths_encyclopedia.md:2272`<br>`docs/json_paths_encyclopedia.md:2528` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `richGridRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:112`<br>`docs/json_paths_encyclopedia.md:585`<br>`docs/json_paths_encyclopedia.md:657`<br>`docs/youtube_renderer_inventory.md:190` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `richSectionRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:593`<br>`docs/json_paths_encyclopedia.md:2154`<br>`docs/json_paths_encyclopedia.md:2207`<br>`docs/json_paths_encyclopedia.md:3275`<br>`docs/json_paths_encyclopedia.md:3306`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `searchRefinementCardRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2715`<br>`docs/json_paths_encyclopedia.md:2717`<br>`docs/json_paths_encyclopedia.md:2720`<br>`docs/json_paths_encyclopedia.md:2721`<br>`docs/json_paths_encyclopedia.md:2722`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `sectionHeaderViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:603` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `sharedPostRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3296`<br>`docs/json_paths_encyclopedia.md:3297`<br>`docs/json_paths_encyclopedia.md:4977` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `sheetViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:153`<br>`docs/json_paths_encyclopedia.md:164`<br>`docs/json_paths_encyclopedia.md:165`<br>`docs/json_paths_encyclopedia.md:166`<br>`docs/json_paths_encyclopedia.md:167`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `singleColumnBrowseResultsRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:112`<br>`docs/json_paths_encyclopedia.md:583`<br>`docs/json_paths_encyclopedia.md:636`<br>`docs/json_paths_encyclopedia.md:1754`<br>`docs/json_paths_encyclopedia.md:1860`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `sortFilterSubMenuRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:505`<br>`docs/youtube_renderer_inventory.md:526`<br>`docs/youtube_renderer_inventory.md:665` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `subscriptionNotificationToggleButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:194` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `tabRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:112`<br>`docs/json_paths_encyclopedia.md:584`<br>`docs/json_paths_encyclopedia.md:639`<br>`docs/json_paths_encyclopedia.md:1754`<br>`docs/json_paths_encyclopedia.md:1861`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `thumbnailBadgeViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:191`<br>`docs/youtube_renderer_inventory.md:396` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `thumbnailOverlayBottomPanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:205`<br>`docs/json_paths_encyclopedia.md:206`<br>`docs/json_paths_encyclopedia.md:233`<br>`docs/json_paths_encyclopedia.md:234`<br>`docs/json_paths_encyclopedia.md:240`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `thumbnailOverlaySidePanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:951`<br>`docs/json_paths_encyclopedia.md:1320`<br>`docs/json_paths_encyclopedia.md:1664` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `thumbnailRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1238`<br>`docs/json_paths_encyclopedia.md:1577` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `thumbnailViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2151`<br>`docs/json_paths_encyclopedia.md:4862` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `titleAndButtonListHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:437` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `toggleButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:610`<br>`docs/json_paths_encyclopedia.md:3482`<br>`docs/json_paths_encyclopedia.md:3629`<br>`docs/youtube_renderer_inventory.md:185` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `toggleButtonViewModel` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:1858` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `toggleMenuServiceItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:3948`<br>`docs/json_paths_encyclopedia.md:4266`<br>`docs/json_paths_encyclopedia.md:4356` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `topbarLogoRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:628`<br>`docs/json_paths_encyclopedia.md:1872` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `twoColumnBrowseResultsRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:498` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `voiceSearchDialogRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:629`<br>`docs/json_paths_encyclopedia.md:1874` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `watchCardHeroVideoRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2711`<br>`docs/json_paths_encyclopedia.md:2712`<br>`docs/json_paths_encyclopedia.md:2713`<br>`docs/json_paths_encyclopedia.md:4941`<br>`docs/json_paths_encyclopedia.md:4942`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `watchCardRHPanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:434`<br>`docs/youtube_renderer_inventory.md:749` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `watchCardRHPanelVideoRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:435` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `watchCardRichHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/json_paths_encyclopedia.md:2705`<br>`docs/json_paths_encyclopedia.md:2706`<br>`docs/json_paths_encyclopedia.md:2707`<br>`docs/json_paths_encyclopedia.md:2708`<br>`docs/json_paths_encyclopedia.md:4937`<br>... | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |
| `watchCardSectionSequenceRenderer` | DOCUMENTED_NO_DIRECT_RULE | `docs/youtube_renderer_inventory.md:433`<br>`docs/youtube_renderer_inventory.md:461`<br>`docs/youtube_renderer_inventory.md:660`<br>`docs/youtube_renderer_inventory.md:752` | Decide fixture-backed direct rule, structural-only status, or explicit unsupported status. |

## Full Renderer Contract Ledger

| Renderer/ViewModel | Status | Rule lines | Structural | Doc references |
| --- | --- | --- | --- | --- |
| `accessibilityRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2271`<br>`docs/json_paths_encyclopedia.md:2527` |
| `anchoredSectionRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3233` |
| `avatarStackViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:158`<br>`docs/json_paths_encyclopedia.md:1854`<br>`docs/youtube_renderer_inventory.md:7`<br>... |
| `avatarViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:168`<br>`docs/json_paths_encyclopedia.md:175`<br>`docs/json_paths_encyclopedia.md:182`<br>... |
| `backstageImageRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:608`<br>`docs/json_paths_encyclopedia.md:3290`<br>`docs/json_paths_encyclopedia.md:3386`<br>... |
| `backstagePollRenderer` | DIRECT_RULE_DOCUMENTED | `740` | no | `docs/youtube_renderer_inventory.md:34`<br>`docs/youtube_renderer_inventory.md:182`<br>`docs/youtube_renderer_inventory.md:518`<br>... |
| `backstagePostRenderer` | DIRECT_RULE_DOCUMENTED | `733` | no | `docs/json_paths_encyclopedia.md:607`<br>`docs/json_paths_encyclopedia.md:3274`<br>`docs/json_paths_encyclopedia.md:3275`<br>... |
| `backstagePostThreadRenderer` | DIRECT_RULE_DOCUMENTED | `726` | no | `docs/json_paths_encyclopedia.md:606`<br>`docs/json_paths_encyclopedia.md:3275`<br>`docs/json_paths_encyclopedia.md:3308`<br>... |
| `backstageQuizRenderer` | DIRECT_RULE_DOCUMENTED | `749` | no | `docs/youtube_renderer_inventory.md:35`<br>`docs/youtube_renderer_inventory.md:519`<br>`docs/youtube_renderer_inventory.md:763` |
| `buttonBannerViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:440` |
| `buttonRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:602`<br>`docs/json_paths_encyclopedia.md:1873`<br>`docs/json_paths_encyclopedia.md:2355`<br>... |
| `buttonViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:605`<br>`docs/json_paths_encyclopedia.md:1857`<br>`docs/youtube_renderer_inventory.md:193`<br>... |
| `callToActionButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2713`<br>`docs/json_paths_encyclopedia.md:4941`<br>`docs/youtube_renderer_inventory.md:439` |
| `channelAboutMetadataRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:524` |
| `channelFeaturedContentRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:524` |
| `channelListItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:11`<br>`docs/json_paths_encyclopedia.md:15`<br>`docs/json_paths_encyclopedia.md:16`<br>... |
| `channelMetadataRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:496` |
| `channelRenderer` | DIRECT_RULE_DOCUMENTED | `716` | no | `docs/json_paths_encyclopedia.md:12`<br>`docs/youtube_renderer_inventory.md:204`<br>`docs/youtube_renderer_inventory.md:443` |
| `channelSubMenuRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:504`<br>`docs/youtube_renderer_inventory.md:526`<br>`docs/youtube_renderer_inventory.md:665`<br>... |
| `channelThumbnailWithLinkRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:149`<br>`docs/json_paths_encyclopedia.md:615`<br>`docs/json_paths_encyclopedia.md:940`<br>... |
| `channelVideoPlayerRenderer` | DIRECT_RULE_DOCUMENTED | `712` | no | `docs/youtube_renderer_inventory.md:49`<br>`docs/youtube_renderer_inventory.md:490`<br>`docs/youtube_renderer_inventory.md:768` |
| `chipCloudChipRenderer` | DIRECT_RULE_DOCUMENTED | `575` | no | `docs/json_paths_encyclopedia.md:620`<br>`docs/youtube_renderer_inventory.md:53`<br>`docs/youtube_renderer_inventory.md:478`<br>... |
| `chipCloudRenderer` | DIRECT_RULE_DOCUMENTED | `572` | no | `docs/youtube_renderer_inventory.md:52`<br>`docs/youtube_renderer_inventory.md:477`<br>`docs/youtube_renderer_inventory.md:771` |
| `chipDividerRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:626` |
| `cinematicContainerViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1850` |
| `collectionThumbnailViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:395` |
| `commentActionButtonsRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:609`<br>`docs/json_paths_encyclopedia.md:3294`<br>`docs/json_paths_encyclopedia.md:3480`<br>... |
| `commentDialogRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3941`<br>`docs/json_paths_encyclopedia.md:4009` |
| `commentRenderer` | DIRECT_RULE_DOCUMENTED | `827` | no | `docs/json_paths_encyclopedia.md:3857`<br>`docs/json_paths_encyclopedia.md:3859`<br>`docs/json_paths_encyclopedia.md:3860`<br>... |
| `commentRepliesRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3857`<br>`docs/json_paths_encyclopedia.md:3953`<br>`docs/json_paths_encyclopedia.md:4586` |
| `commentReplyDialogRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3947`<br>`docs/json_paths_encyclopedia.md:4187` |
| `commentSimpleboxRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3940`<br>`docs/json_paths_encyclopedia.md:3971` |
| `commentThreadRenderer` | DIRECT_RULE_DOCUMENTED | `832` | no | `docs/json_paths_encyclopedia.md:3848`<br>`docs/json_paths_encyclopedia.md:3853`<br>`docs/json_paths_encyclopedia.md:3860`<br>... |
| `commentVideoThumbnailHeaderRenderer` | DIRECT_RULE_DOCUMENTED | `778` | no | `docs/youtube_renderer_inventory.md:641` |
| `commentsHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3939`<br>`docs/json_paths_encyclopedia.md:3969`<br>`docs/youtube_renderer_inventory.md:514` |
| `compactAutoplayRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:460`<br>`docs/youtube_renderer_inventory.md:482`<br>`docs/youtube_renderer_inventory.md:660`<br>... |
| `compactChannelRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2696`<br>`docs/json_paths_encyclopedia.md:2725`<br>`docs/json_paths_encyclopedia.md:2726`<br>... |
| `compactPlaylistRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:930`<br>`docs/json_paths_encyclopedia.md:931`<br>`docs/json_paths_encyclopedia.md:932`<br>... |
| `compactRadioRenderer` | DIRECT_RULE_DOCUMENTED | `682` | no | `docs/json_paths_encyclopedia.md:123`<br>`docs/json_paths_encyclopedia.md:188`<br>`docs/json_paths_encyclopedia.md:191`<br>... |
| `compactVideoRenderer` | DIRECT_RULE_DOCUMENTED | `430` | no | `docs/json_paths_encyclopedia.md:3231`<br>`docs/json_paths_encyclopedia.md:3232`<br>`docs/json_paths_encyclopedia.md:3233`<br>... |
| `contentLoadingRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:613`<br>`docs/json_paths_encyclopedia.md:3789`<br>`docs/json_paths_encyclopedia.md:3952`<br>... |
| `contentMetadataViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1853`<br>`docs/json_paths_encyclopedia.md:2150`<br>`docs/json_paths_encyclopedia.md:3205`<br>... |
| `contentPreviewImageViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1852` |
| `continuationItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:57`<br>`docs/json_paths_encyclopedia.md:618`<br>`docs/json_paths_encyclopedia.md:1870`<br>... |
| `createRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3970` |
| `creatorHeartRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3955` |
| `decoratedAvatarViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2147`<br>`docs/json_paths_encyclopedia.md:2148`<br>`docs/json_paths_encyclopedia.md:3204`<br>... |
| `descriptionPreviewViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1859` |
| `dialogViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:236` |
| `dividerViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:624` |
| `dynamicTextViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1851` |
| `endScreenVideoRenderer` | DIRECT_RULE_CODE_ONLY | `435` | no |  |
| `engagementPanelSectionListRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:611`<br>`docs/json_paths_encyclopedia.md:3759`<br>`docs/json_paths_encyclopedia.md:3950`<br>... |
| `engagementPanelTitleHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:612`<br>`docs/json_paths_encyclopedia.md:3761`<br>`docs/json_paths_encyclopedia.md:3951`<br>... |
| `expandableMetadataRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:444`<br>`docs/youtube_renderer_inventory.md:747` |
| `extractFromAvatarStackViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:80`<br>`docs/youtube_renderer_inventory.md:727` |
| `feedFilterChipBarRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:619` |
| `feedTabbedHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:582` |
| `flexibleActionsViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:604`<br>`docs/json_paths_encyclopedia.md:1856` |
| `gridChannelRenderer` | DIRECT_RULE_CODE_ONLY | `721` | no |  |
| `gridPlaylistRenderer` | DIRECT_RULE_CODE_ONLY | `640` | no |  |
| `gridRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:507` |
| `gridShelfViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:594`<br>`docs/json_paths_encyclopedia.md:2154`<br>`docs/json_paths_encyclopedia.md:2184`<br>... |
| `gridVideoRenderer` | DUPLICATE_RULE_LAST_WINS | `431`, `604` | no | `docs/youtube_renderer_inventory.md:21`<br>`docs/youtube_renderer_inventory.md:442`<br>`docs/youtube_renderer_inventory.md:491`<br>... |
| `guideEntryRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:672` |
| `guideRenderer` | STRUCTURAL_ONLY_CODE_ONLY | - | yes |  |
| `guideSectionRenderer` | STRUCTURAL_ONLY_CODE_ONLY | - | yes |  |
| `horizontalCardListRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2717`<br>`docs/youtube_renderer_inventory.md:436`<br>`docs/youtube_renderer_inventory.md:750` |
| `horizontalListRenderer` | STRUCTURAL_ONLY_DOCUMENTED | - | yes | `docs/youtube_renderer_inventory.md:497` |
| `itemSectionRenderer` | STRUCTURAL_ONLY_DOCUMENTED | - | yes | `docs/json_paths_encyclopedia.md:123`<br>`docs/json_paths_encyclopedia.md:932`<br>`docs/json_paths_encyclopedia.md:1754`<br>... |
| `kidsHomeScreenRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3233` |
| `likeButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:230`<br>`docs/json_paths_encyclopedia.md:231`<br>`docs/json_paths_encyclopedia.md:370` |
| `likeButtonViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2202`<br>`docs/json_paths_encyclopedia.md:4887` |
| `listItemViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:164`<br>`docs/json_paths_encyclopedia.md:165`<br>`docs/json_paths_encyclopedia.md:166`<br>... |
| `listViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:158`<br>`docs/json_paths_encyclopedia.md:164`<br>`docs/json_paths_encyclopedia.md:165`<br>... |
| `lockupMetadataViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2146`<br>`docs/json_paths_encyclopedia.md:2147`<br>`docs/json_paths_encyclopedia.md:2148`<br>... |
| `lockupViewModel` | DIRECT_RULE_DOCUMENTED | `489` | no | `docs/json_paths_encyclopedia.md:3199`<br>`docs/json_paths_encyclopedia.md:3200`<br>`docs/json_paths_encyclopedia.md:3216`<br>... |
| `logoViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:622` |
| `menuNavigationItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:143`<br>`docs/json_paths_encyclopedia.md:414`<br>`docs/json_paths_encyclopedia.md:591`<br>... |
| `menuRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:141`<br>`docs/json_paths_encyclopedia.md:208`<br>`docs/json_paths_encyclopedia.md:381`<br>... |
| `menuServiceItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:142`<br>`docs/json_paths_encyclopedia.md:144`<br>`docs/json_paths_encyclopedia.md:145`<br>... |
| `metadataBadgeRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:950`<br>`docs/json_paths_encyclopedia.md:1139`<br>`docs/json_paths_encyclopedia.md:4835`<br>... |
| `microformatDataRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1875` |
| `mobileTopbarRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:627`<br>`docs/json_paths_encyclopedia.md:1871` |
| `moreDrawerViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:621` |
| `movingThumbnailRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:617`<br>`docs/json_paths_encyclopedia.md:3160`<br>`docs/json_paths_encyclopedia.md:4903` |
| `multiPageMenuRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:640` |
| `navigationItemViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:623` |
| `notificationMultiActionRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:601`<br>`docs/json_paths_encyclopedia.md:2345` |
| `notificationRenderer` | DIRECT_RULE_DOCUMENTED | `761` | no | `docs/youtube_renderer_inventory.md:36`<br>`docs/youtube_renderer_inventory.md:638`<br>`docs/youtube_renderer_inventory.md:639` |
| `notificationTextRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:470`<br>`docs/json_paths_encyclopedia.md:592`<br>`docs/json_paths_encyclopedia.md:845`<br>... |
| `pageHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1848` |
| `pageHeaderViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1849` |
| `panelHeaderViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:153`<br>`docs/json_paths_encyclopedia.md:4778`<br>`docs/youtube_renderer_inventory.md:81`<br>... |
| `playerMicroformatRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3263`<br>`docs/json_paths_encyclopedia.md:4961` |
| `playlistPanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:545`<br>`docs/youtube_renderer_inventory.md:551`<br>`docs/youtube_renderer_inventory.md:590` |
| `playlistPanelVideoRenderer` | DIRECT_RULE_DOCUMENTED | `433` | no | `docs/json_paths_encyclopedia.md:1749`<br>`docs/json_paths_encyclopedia.md:1752`<br>`docs/json_paths_encyclopedia.md:1753`<br>... |
| `playlistRenderer` | DIRECT_RULE_DOCUMENTED | `613` | no | `docs/youtube_renderer_inventory.md:22` |
| `playlistVideoListRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1754`<br>`docs/json_paths_encyclopedia.md:1864`<br>`docs/json_paths_encyclopedia.md:1894` |
| `playlistVideoRenderer` | DIRECT_RULE_DOCUMENTED | `432` | no | `docs/json_paths_encyclopedia.md:1749`<br>`docs/json_paths_encyclopedia.md:1754`<br>`docs/json_paths_encyclopedia.md:1865`<br>... |
| `playlistVideoThumbnailRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1239`<br>`docs/json_paths_encyclopedia.md:1578` |
| `podcastRenderer` | DIRECT_RULE_DOCUMENTED | `693` | no | `docs/youtube_renderer_inventory.md:47`<br>`docs/youtube_renderer_inventory.md:393`<br>`docs/youtube_renderer_inventory.md:394`<br>... |
| `postRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3275`<br>`docs/json_paths_encyclopedia.md:3302`<br>`docs/json_paths_encyclopedia.md:4982` |
| `privacyTosViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:625` |
| `radioRenderer` | DIRECT_RULE_DOCUMENTED | `673` | no | `docs/json_paths_encyclopedia.md:188`<br>`docs/json_paths_encyclopedia.md:191`<br>`docs/json_paths_encyclopedia.md:193`<br>... |
| `reelChannelBarViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2190`<br>`docs/json_paths_encyclopedia.md:2198`<br>`docs/json_paths_encyclopedia.md:2199`<br>... |
| `reelItemRenderer` | DIRECT_RULE_DOCUMENTED | `811` | no | `docs/json_paths_encyclopedia.md:2186`<br>`docs/json_paths_encyclopedia.md:2187`<br>`docs/json_paths_encyclopedia.md:4872`<br>... |
| `reelPlayerOverlayRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:596`<br>`docs/json_paths_encyclopedia.md:2190`<br>`docs/json_paths_encyclopedia.md:2194`<br>... |
| `reelWatchAccessibilityRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:597`<br>`docs/json_paths_encyclopedia.md:2272`<br>`docs/json_paths_encyclopedia.md:2528` |
| `relatedChipCloudRenderer` | DIRECT_RULE_DOCUMENTED | `568` | no | `docs/youtube_renderer_inventory.md:51`<br>`docs/youtube_renderer_inventory.md:476`<br>`docs/youtube_renderer_inventory.md:770` |
| `richGridMedia` | DIRECT_RULE_CODE_ONLY | `597` | no |  |
| `richGridRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:112`<br>`docs/json_paths_encyclopedia.md:585`<br>`docs/json_paths_encyclopedia.md:657`<br>... |
| `richItemRenderer` | DIRECT_RULE_DOCUMENTED | `469` | no | `docs/json_paths_encyclopedia.md:112`<br>`docs/json_paths_encyclopedia.md:123`<br>`docs/json_paths_encyclopedia.md:191`<br>... |
| `richSectionRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:593`<br>`docs/json_paths_encyclopedia.md:2154`<br>`docs/json_paths_encyclopedia.md:2207`<br>... |
| `richShelfRenderer` | DIRECT_RULE_DOCUMENTED | `706` | yes | `docs/youtube_renderer_inventory.md:48`<br>`docs/youtube_renderer_inventory.md:177`<br>`docs/youtube_renderer_inventory.md:393`<br>... |
| `searchRefinementCardRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2715`<br>`docs/json_paths_encyclopedia.md:2717`<br>`docs/json_paths_encyclopedia.md:2720`<br>... |
| `secondarySearchContainerRenderer` | DIRECT_RULE_DOCUMENTED | `591` | no | `docs/youtube_renderer_inventory.md:54`<br>`docs/youtube_renderer_inventory.md:406`<br>`docs/youtube_renderer_inventory.md:773` |
| `sectionHeaderViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:603` |
| `sectionListRenderer` | STRUCTURAL_ONLY_DOCUMENTED | - | yes | `docs/json_paths_encyclopedia.md:1754`<br>`docs/json_paths_encyclopedia.md:1862`<br>`docs/json_paths_encyclopedia.md:1888`<br>... |
| `sharedPostRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3296`<br>`docs/json_paths_encyclopedia.md:3297`<br>`docs/json_paths_encyclopedia.md:4977` |
| `sheetViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:153`<br>`docs/json_paths_encyclopedia.md:164`<br>`docs/json_paths_encyclopedia.md:165`<br>... |
| `shelfRenderer` | DIRECT_RULE_DOCUMENTED | `486` | yes | `docs/youtube_renderer_inventory.md:23` |
| `shortsLockupViewModel` | DIRECT_RULE_DOCUMENTED | `816` | no | `docs/json_paths_encyclopedia.md:595`<br>`docs/json_paths_encyclopedia.md:2141`<br>`docs/json_paths_encyclopedia.md:2142`<br>... |
| `singleColumnBrowseResultsRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:112`<br>`docs/json_paths_encyclopedia.md:583`<br>`docs/json_paths_encyclopedia.md:636`<br>... |
| `sortFilterSubMenuRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:505`<br>`docs/youtube_renderer_inventory.md:526`<br>`docs/youtube_renderer_inventory.md:665` |
| `subscriptionNotificationToggleButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:194` |
| `tabRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:112`<br>`docs/json_paths_encyclopedia.md:584`<br>`docs/json_paths_encyclopedia.md:639`<br>... |
| `thumbnailBadgeViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:191`<br>`docs/youtube_renderer_inventory.md:396` |
| `thumbnailOverlayBottomPanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:205`<br>`docs/json_paths_encyclopedia.md:206`<br>`docs/json_paths_encyclopedia.md:233`<br>... |
| `thumbnailOverlayNowPlayingRenderer` | DIRECT_RULE_DOCUMENTED | `805` | no | `docs/youtube_renderer_inventory.md:603` |
| `thumbnailOverlayPlaybackStatusRenderer` | DIRECT_RULE_DOCUMENTED | `796` | no | `docs/youtube_renderer_inventory.md:593`<br>`docs/youtube_renderer_inventory.md:601` |
| `thumbnailOverlayResumePlaybackRenderer` | DIRECT_RULE_DOCUMENTED | `802` | no | `docs/json_paths_encyclopedia.md:138`<br>`docs/json_paths_encyclopedia.md:2784`<br>`docs/json_paths_encyclopedia.md:3095`<br>... |
| `thumbnailOverlaySidePanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:951`<br>`docs/json_paths_encyclopedia.md:1320`<br>`docs/json_paths_encyclopedia.md:1664` |
| `thumbnailOverlayTimeStatusRenderer` | DIRECT_RULE_DOCUMENTED | `799` | no | `docs/json_paths_encyclopedia.md:616`<br>`docs/json_paths_encyclopedia.md:1869`<br>`docs/json_paths_encyclopedia.md:2087`<br>... |
| `thumbnailRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1238`<br>`docs/json_paths_encyclopedia.md:1577` |
| `thumbnailViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2151`<br>`docs/json_paths_encyclopedia.md:4862` |
| `ticketShelfRenderer` | DIRECT_RULE_DOCUMENTED | `690` | no | `docs/youtube_renderer_inventory.md:46`<br>`docs/youtube_renderer_inventory.md:765` |
| `titleAndButtonListHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:437` |
| `toggleButtonRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:610`<br>`docs/json_paths_encyclopedia.md:3482`<br>`docs/json_paths_encyclopedia.md:3629`<br>... |
| `toggleButtonViewModel` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:1858` |
| `toggleMenuServiceItemRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:3948`<br>`docs/json_paths_encyclopedia.md:4266`<br>`docs/json_paths_encyclopedia.md:4356` |
| `topbarLogoRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:628`<br>`docs/json_paths_encyclopedia.md:1872` |
| `twoColumnBrowseResultsRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:498` |
| `universalWatchCardRenderer` | DIRECT_RULE_DOCUMENTED | `528` | no | `docs/json_paths_encyclopedia.md:2696`<br>`docs/json_paths_encyclopedia.md:2701`<br>`docs/json_paths_encyclopedia.md:2702`<br>... |
| `videoPrimaryInfoRenderer` | DIRECT_RULE_DOCUMENTED | `518` | no | `docs/youtube_renderer_inventory.md:452`<br>`docs/youtube_renderer_inventory.md:466`<br>`docs/youtube_renderer_inventory.md:469` |
| `videoRenderer` | DIRECT_RULE_DOCUMENTED | `429` | no | `docs/youtube_renderer_inventory.md:21`<br>`docs/youtube_renderer_inventory.md:404`<br>`docs/youtube_renderer_inventory.md:427`<br>... |
| `videoSecondaryInfoRenderer` | DIRECT_RULE_DOCUMENTED | `521` | no | `docs/youtube_renderer_inventory.md:452`<br>`docs/youtube_renderer_inventory.md:466`<br>`docs/youtube_renderer_inventory.md:467`<br>... |
| `videoWithContextRenderer` | DIRECT_RULE_DOCUMENTED | `436` | no | `docs/json_paths_encyclopedia.md:123`<br>`docs/json_paths_encyclopedia.md:127`<br>`docs/json_paths_encyclopedia.md:130`<br>... |
| `voiceSearchDialogRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:629`<br>`docs/json_paths_encyclopedia.md:1874` |
| `watchCardCompactVideoRenderer` | DIRECT_RULE_DOCUMENTED | `434` | no | `docs/youtube_renderer_inventory.md:430`<br>`docs/youtube_renderer_inventory.md:454` |
| `watchCardHeroVideoRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2711`<br>`docs/json_paths_encyclopedia.md:2712`<br>`docs/json_paths_encyclopedia.md:2713`<br>... |
| `watchCardRHPanelRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:434`<br>`docs/youtube_renderer_inventory.md:749` |
| `watchCardRHPanelVideoRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:435` |
| `watchCardRichHeaderRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/json_paths_encyclopedia.md:2705`<br>`docs/json_paths_encyclopedia.md:2706`<br>`docs/json_paths_encyclopedia.md:2707`<br>... |
| `watchCardSectionSequenceRenderer` | DOCUMENTED_NO_DIRECT_RULE | - | no | `docs/youtube_renderer_inventory.md:433`<br>`docs/youtube_renderer_inventory.md:461`<br>`docs/youtube_renderer_inventory.md:660`<br>... |

## Interpretation

- `DIRECT_RULE_DOCUMENTED` is not enough to claim safe filtering. It only proves a top-level rule exists.
- `DOCUMENTED_NO_DIRECT_RULE` entries are the highest leak-risk candidates unless they are purely structural or intentionally unsupported.
- Duplicate keys are high false-hide/leak risk because earlier rule fields can silently disappear.
- Structural-only entries need whitelist fail-open/fail-closed fixtures so containers do not hide meaningful children or leak blocked children.
