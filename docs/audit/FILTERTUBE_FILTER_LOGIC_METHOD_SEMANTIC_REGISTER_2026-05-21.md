# FilterTube Filter Logic Method Semantic Register - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/filter_logic.js` from representative method tokens to
a source-derived method and entrypoint inventory. It complements the direct
renderer rule register: `FILTER_RULES` says which renderer keys have rules, while
the method surface below says which helpers, class methods, and global entry
points normalize settings, harvest identity, build candidates, decide blocks,
parse fields, recurse, and publish side effects.

This is not completion proof for every nested local callback, local arrow
function, JSON field path, or every repository method. It is a current-behavior
boundary for the filter-logic engine file.

Current-source register reviewed on 2026-10-18. This refresh changes no runtime behavior or broad proof approval.

## Source-Derived Summary

```text
source file: js/filter_logic.js
split source lines: 4537
wc line count: 4536
source bytes: 222044
source sha256: 20c1426a56eeaa925b42d192a56699c2cfaafbc291bb7e2f583d3e5d29fc7f6c
source object/class: YouTubeDataFilter
global interface: window.FilterTubeEngine
method and entrypoint rows: 79
top-level helper function declarations: 21
YouTubeDataFilter class methods: 56
FilterTubeEngine global interface functions: 2
semantic method groups: 12
repo-wide broad parser lexical callable matches: 375
broad parser declaration/inventory matches: 101
semantic method rows promoted: 79
local callable tokens held below method authority: 19
control-flow lexical artifacts: 274
file-local executable proof probes: 7
global method proof count promoted: 0
runtime behavior changed: no
```

## Method Group Counts

```text
autoplayEndpointFiltering: 5
blockDecisionPipeline: 6
candidateAndRendererUnwrap: 8
channelHandleExtractionHelpers: 3
channelMatchPolicy: 9
constructionAndSettings: 5
debugBridgeAndBatchQueues: 3
fieldExtractionAndParsing: 17
harvestAndMapWrites: 10
loggingAndDecisionTelemetry: 2
pathTextAndMetadataHelpers: 6
recursionAndEntrypoints: 5
```

## Lexical Callable Reconciliation

The broad callable scanner sees class methods, top-level helpers, global
interface functions, local arrow helpers, and control-flow blocks in
`js/filter_logic.js`. Reconciliation for this source is:

```text
js/filter_logic.js broad callable matches: 375
accepted top-level helper function rows: 21
accepted YouTubeDataFilter class method rows: 56
accepted FilterTubeEngine global interface function rows: 2
accepted local arrow callable tokens: 19
accepted declaration/inventory rows total: 101
accepted semantic method rows promoted: 79
rejected control-flow artifacts total: 274
rejected if artifacts: 208
rejected for artifacts: 66
global method proof count promoted: 0
runtime behavior changed: no
```

The 19 accepted local callable tokens remain implementation details below the
79 promoted semantic method rows. They do not authorize JSON renderer expansion,
method extraction, no-work pruning, or map-write behavior changes.

The named `FilterTubePerfDebug.enabled`, `.now`, and `.log` object members add three
explicit diagnostic inventory rows below method authority. Together with 79
method rows and 19 local arrows, they reconcile the 101 non-control matches;
none of these lexical counts establishes complete behavioral proof.

## Current Method Inventory

| Source line | Scope | Method or function | Semantic group |
| --- | --- | --- | --- |
| 44 | `topLevelFunction` | `postLogToBridge` | `debugBridgeAndBatchQueues` |
| 77 | `topLevelFunction` | `isBlockTubeChannelNameRule` | `channelMatchPolicy` |
| 81 | `topLevelFunction` | `getBlockTubeChannelNameRegex` | `channelMatchPolicy` |
| 113 | `topLevelFunction` | `matchesBlockTubeChannelNameRule` | `channelMatchPolicy` |
| 130 | `topLevelFunction` | `hasAutoplayEndpointKey` | `autoplayEndpointFiltering` |
| 138 | `topLevelFunction` | `queueVideoChannelMapping` | `debugBridgeAndBatchQueues` |
| 175 | `topLevelFunction` | `normalizeVideoLanguageCode` | `fieldExtractionAndParsing` |
| 185 | `topLevelFunction` | `inferVideoLanguageFromPlayerMetadata` | `fieldExtractionAndParsing` |
| 225 | `topLevelFunction` | `extractDefaultAudioFormatLanguage` | `fieldExtractionAndParsing` |
| 240 | `topLevelFunction` | `extractVideoLanguageFromPlayerResponse` | `fieldExtractionAndParsing` |
| 293 | `topLevelFunction` | `queueVideoMetaMapping` | `debugBridgeAndBatchQueues` |
| 413 | `topLevelFunction` | `getByPath` | `pathTextAndMetadataHelpers` |
| 434 | `topLevelFunction` | `flattenText` | `pathTextAndMetadataHelpers` |
| 471 | `topLevelFunction` | `getTextFromPaths` | `pathTextAndMetadataHelpers` |
| 485 | `topLevelFunction` | `normalizeChannelHandle` | `channelHandleExtractionHelpers` |
| 521 | `topLevelFunction` | `findHandleInValue` | `channelHandleExtractionHelpers` |
| 555 | `topLevelFunction` | `extractChannelHandleFromPaths` | `channelHandleExtractionHelpers` |
| 564 | `topLevelFunction` | `flattenMetadataRow` | `pathTextAndMetadataHelpers` |
| 595 | `topLevelFunction` | `flattenMetadataRowsContainer` | `pathTextAndMetadataHelpers` |
| 614 | `topLevelFunction` | `getMetadataRowsText` | `pathTextAndMetadataHelpers` |
| 1164 | `classMethod` | `constructor` | `constructionAndSettings` |
| 1178 | `classMethod` | `_buildChannelFilterIndex` | `constructionAndSettings` |
| 1193 | `classMethod` | `_refreshChannelFilterIndexesIfNeeded` | `constructionAndSettings` |
| 1200 | `classMethod` | `_matchesAnyChannel` | `channelMatchPolicy` |
| 1222 | `classMethod` | `_harvestBrowseEndpoint` | `harvestAndMapWrites` |
| 1274 | `classMethod` | `_processSettings` | `constructionAndSettings` |
| 1426 | `classMethod` | `_harvestChannelData` | `harvestAndMapWrites` |
| 1543 | `classMethod` | `_harvestPlayerOwnerData` | `harvestAndMapWrites` |
| 1683 | `classMethod` | `_harvestRendererChannelMappings` | `harvestAndMapWrites` |
| 1737 | `classMethod` | `_harvestVideoOwnerFromRenderer` | `harvestAndMapWrites` |
| 1772 | `classMethod` | `_registerVideoChannelMapping` | `harvestAndMapWrites` |
| 1788 | `classMethod` | `_registerVideoMetaMapping` | `harvestAndMapWrites` |
| 1872 | `classMethod` | `_harvestFromRendererByline` | `harvestAndMapWrites` |
| 1928 | `classMethod` | `_registerMapping` | `harvestAndMapWrites` |
| 1969 | `classMethod` | `_registerCustomUrlMapping` | `harvestAndMapWrites` |
| 2011 | `classMethod` | `_log` | `loggingAndDecisionTelemetry` |
| 2024 | `classMethod` | `_logWhitelistDecision` | `loggingAndDecisionTelemetry` |
| 2043 | `classMethod` | `_unwrapRendererForFiltering` | `candidateAndRendererUnwrap` |
| 2087 | `classMethod` | `_paths` | `candidateAndRendererUnwrap` |
| 2092 | `classMethod` | `_collectTextFromPaths` | `candidateAndRendererUnwrap` |
| 2117 | `classMethod` | `_extractVideoId` | `candidateAndRendererUnwrap` |
| 2140 | `classMethod` | `_extractPlaylistId` | `candidateAndRendererUnwrap` |
| 2156 | `classMethod` | `_emptyChannelInfo` | `channelMatchPolicy` |
| 2160 | `classMethod` | `_hasChannelPolicyRules` | `channelMatchPolicy` |
| 2166 | `classMethod` | `_buildCandidate` | `candidateAndRendererUnwrap` |
| 2271 | `classMethod` | `_candidateSearchText` | `candidateAndRendererUnwrap` |
| 2286 | `classMethod` | `_extractAutoplayEndpointVideoId` | `autoplayEndpointFiltering` |
| 2300 | `classMethod` | `_autoplayEndpointCandidate` | `autoplayEndpointFiltering` |
| 2332 | `classMethod` | `_shouldBlockAutoplayEndpoint` | `autoplayEndpointFiltering` |
| 2399 | `classMethod` | `_shouldDropAutoplayEndpointSet` | `autoplayEndpointFiltering` |
| 2411 | `classMethod` | `_regexMatches` | `candidateAndRendererUnwrap` |
| 2426 | `classMethod` | `_parseKeywordDateBoundary` | `fieldExtractionAndParsing` |
| 2444 | `classMethod` | `_getCurrentWatchVideoId` | `fieldExtractionAndParsing` |
| 2457 | `classMethod` | `_extractKeywordTimestampFromVideoMeta` | `fieldExtractionAndParsing` |
| 2471 | `classMethod` | `_extractKeywordPublishTimestamp` | `fieldExtractionAndParsing` |
| 2501 | `classMethod` | `_keywordDateFilterAllows` | `blockDecisionPipeline` |
| 2524 | `classMethod` | `_shouldBlock` | `blockDecisionPipeline` |
| 2912 | `classMethod` | `_checkCategoryFilters` | `blockDecisionPipeline` |
| 2974 | `classMethod` | `_checkLanguageFilters` | `blockDecisionPipeline` |
| 3033 | `classMethod` | `_extractTitle` | `fieldExtractionAndParsing` |
| 3057 | `classMethod` | `_extractDescription` | `fieldExtractionAndParsing` |
| 3094 | `classMethod` | `_parseDurationToSeconds` | `fieldExtractionAndParsing` |
| 3125 | `classMethod` | `_parseAriaLabelDurationSeconds` | `fieldExtractionAndParsing` |
| 3140 | `classMethod` | `_parseRelativeTimeToTimestamp` | `fieldExtractionAndParsing` |
| 3179 | `classMethod` | `_extractDuration` | `fieldExtractionAndParsing` |
| 3417 | `classMethod` | `_extractPublishedTime` | `fieldExtractionAndParsing` |
| 3547 | `classMethod` | `_extractViewCount` | `fieldExtractionAndParsing` |
| 3585 | `classMethod` | `_checkContentFilters` | `blockDecisionPipeline` |
| 3754 | `classMethod` | `_checkUppercaseTitle` | `blockDecisionPipeline` |
| 3790 | `classMethod` | `_extractChannelInfo` | `fieldExtractionAndParsing` |
| 4112 | `classMethod` | `_matchesChannel` | `channelMatchPolicy` |
| 4285 | `classMethod` | `_hasChannelShelfCardOwner` | `channelMatchPolicy` |
| 4304 | `classMethod` | `_getChannelShelfOwner` | `channelMatchPolicy` |
| 4315 | `classMethod` | `_getChannelShelfChildScope` | `recursionAndEntrypoints` |
| 4330 | `classMethod` | `filter` | `recursionAndEntrypoints` |
| 4397 | `classMethod` | `processData` | `recursionAndEntrypoints` |
| 4478 | `topLevelFunction` | `getReusableFilter` | `constructionAndSettings` |
| 4515 | `globalInterfaceFunction` | `FilterTubeEngine.processData` | `recursionAndEntrypoints` |
| 4523 | `globalInterfaceFunction` | `FilterTubeEngine.harvestOnly` | `recursionAndEntrypoints` |

## Current Behavior Boundaries

- `processData()` harvests channel and video metadata before the
  `settings.enabled === false` skip. Disabled filtering is not zero side-effect
  for harvest work.
- `FilterTubeEngine.harvestOnly()` constructs `YouTubeDataFilter` and calls
  `_harvestChannelData()` without mutating the returned YouTube data, but harvest
  helpers can still queue map-update page messages.
- `queueVideoChannelMapping()` and `queueVideoMetaMapping()` use delayed
  `setTimeout()` flushes and `window.postMessage()` batches, so map learning is
  lifecycle and message work, not a pure parse helper.
- `_shouldBlock()` mixes Shorts, route exceptions, whitelist fail-closed
  decisions, channel rules, keyword rules, comments, content filters, category
  filters, collaboration caching, and candidate construction in one method.
- Autoplay endpoint filtering is now an explicit method family:
  `hasAutoplayEndpointKey()`, `_shouldDropAutoplayEndpointSet()`, and
  `_shouldBlockAutoplayEndpoint()` decide whether watch autoplay endpoint sets
  survive JSON filtering.
- `_extractDuration()` and `_extractPublishedTime()` recursively unwrap nested
  renderers and consult learned `videoMetaMap`; field availability is not the
  same as permission to hide.

## File-Local Executable Behavior Proof

`tests/runtime/filter-logic-method-semantic-register-current-behavior.test.mjs`
loads the current `js/filter_logic.js` source through the runtime harness and
executes the exported `window.FilterTubeEngine` entrypoints. It proves these
current-behavior edges without changing runtime source:

| Probe | Executable proof | Current behavior pinned | Risk exposed before optimization |
| --- | --- | --- | --- |
| Disabled processData harvest | disabled harvest proof: executable | `processData()` returns the original payload when `settings.enabled === false`, but still harvests video-channel map updates before the disabled skip. | Disabled/no-work optimization cannot assume zero side effects. |
| Harvest-only channel map | harvest-only channel proof: executable | `harvestOnly()` emits `FilterTube_UpdateVideoChannelMap` for renderer byline UC identity without mutating data. | JSON-first map learning is message/timer work, not pure parsing. |
| Harvest-only video metadata | harvest-only meta proof: executable | `harvestOnly()` emits `FilterTube_UpdateVideoMetaMap` for player length/date/category metadata. | Metadata harvesting has its own side-effect budget before filter pruning. |
| Blocklist keyword decision | blocklist keyword proof: executable | A matching blocklist keyword removes a `videoRenderer`; an empty blocklist preserves the same row. | Keyword behavior is renderer-rule and list-mode dependent. |
| Empty whitelist fail-closed | whitelist fail-closed proof: executable | Empty whitelist mode removes a normal `videoRenderer`. | Whitelist no-work pruning must preserve fail-closed semantics. |
| Whitelist allow decisions | whitelist allow proof: executable | Matching whitelist keyword or channel identity preserves the row. | JSON-first channel/keyword allow paths must stay explicit. |
| Content duration decision | content duration proof: executable | Duration "longer than zero" removes any parsed-duration `videoRenderer`; empty category selections do not remove by themselves. | Field availability does not imply permission to hide without the mode rule. |

## Future Method Proof Fields

Any future behavior change in this file needs rows with at least:

```text
methodReference
sourceLine
semanticGroup
ownerRuntime
callerClass
triggerSurface
settingsModeInput
profileInput
listModeInput
routeOrEndpoint
jsonRendererInput
identitySourceTier
observableSideEffects
harvestOnlyBehavior
disabledBehavior
noRuleBehavior
emptyListBehavior
teardownOrFlushBoundary
positiveFixture
whitelistFixture
negativeSiblingFixture
falseHideFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

No runtime source currently implements:

- `filterLogicMethodAuthority`
- `filterLogicMethodEffectReport`
- `filterLogicNoRuleMethodBudget`
- `filterLogicHarvestMutationDecision`
- `filterLogicEntrypointContract`
- `filterLogicMethodFixtureProvenance`

These are future contract names. This register does not authorize renderer
expansion, selector changes, identity trust changes, map-write pruning, no-work
optimizations, or lifecycle cleanup.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this filter-logic method surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, renderer expansion, identity trust changes,
map-write pruning, no-work optimization, or lifecycle cleanup.


## Reviewed additions - 2026-10-18

BlockTube channel-name helpers use declared imported rule semantics. Language
helpers extract/normalize loaded Player evidence. Keyword-date helpers join
publication evidence and evaluate per-rule bounds. View totals use the shared
conservative parser and an optional off-by-default threshold. Index reuse only
rebuilds derived channel indexes. Shelf helpers accept consistent explicit UC
endpoints and propagate scope only down the known shelf/list/card chain; mixed
or explicitly owned children do not acquire a guessed owner. None creates trust,
loads the encyclopedia, or proves native/installed parity. Diagnostics remain
below method authority. Existing global semantic completion remains zero/NO-GO.

## Controls source inventory refresh - 2026-10-25

The current `js/filter_logic.js` fingerprint and any affected line references above reflect the narrow autoplay correction: decorative end-screen hiding preserves playback endpoints; explicit Disable autoplay and individual filtering rules still govern them. This inventory refresh itself changes no runtime code and promotes none of the unresolved semantic-proof gates. See `docs/audit/TIME_LIMITS_AUTOPLAY_RESET_IMPLEMENTATION_2026-10-25.md` for implementation and executable validation.
