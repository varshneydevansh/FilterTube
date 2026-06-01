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

## Source-Derived Summary

```text
source file: js/filter_logic.js
split source lines: 3499
wc line count: 3498
source bytes: 165151
source sha256: 4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641
source object/class: YouTubeDataFilter
global interface: window.FilterTubeEngine
method and entrypoint rows: 55
top-level helper function declarations: 12
YouTubeDataFilter class methods: 41
FilterTubeEngine global interface functions: 2
semantic method groups: 11
repo-wide broad parser lexical callable matches: 298
broad parser declaration/inventory matches: 68
semantic method rows promoted: 55
local callable tokens held below method authority: 13
control-flow lexical artifacts: 230
file-local executable proof probes: 7
global method proof count promoted: 0
runtime behavior changed: no
```

## Method Group Counts

```text
blockDecisionPipeline: 4
candidateAndRendererUnwrap: 8
channelHandleExtractionHelpers: 3
channelMatchPolicy: 4
constructionAndSettings: 3
debugBridgeAndBatchQueues: 3
fieldExtractionAndParsing: 8
harvestAndMapWrites: 10
loggingAndDecisionTelemetry: 2
pathTextAndMetadataHelpers: 6
recursionAndEntrypoints: 4
```

## Lexical Callable Reconciliation

The broad callable scanner sees class methods, top-level helpers, global
interface functions, local arrow helpers, and control-flow blocks in
`js/filter_logic.js`. Reconciliation for this source is:

```text
js/filter_logic.js broad callable matches: 298
accepted top-level helper function rows: 12
accepted YouTubeDataFilter class method rows: 41
accepted FilterTubeEngine global interface function rows: 2
accepted local arrow callable tokens: 13
accepted declaration/inventory rows total: 68
accepted semantic method rows promoted: 55
rejected control-flow artifacts total: 230
rejected if artifacts: 176
rejected for artifacts: 54
global method proof count promoted: 0
runtime behavior changed: no
```

The 13 accepted local callable tokens remain implementation details below the
55 promoted semantic method rows. They do not authorize JSON renderer expansion,
method extraction, no-work pruning, or map-write behavior changes.

## Current Method Inventory

| Source line | Scope | Method or function | Semantic group |
| --- | --- | --- | --- |
| 21 | `topLevelFunction` | `postLogToBridge` | `debugBridgeAndBatchQueues` |
| 49 | `topLevelFunction` | `queueVideoChannelMapping` | `debugBridgeAndBatchQueues` |
| 85 | `topLevelFunction` | `queueVideoMetaMapping` | `debugBridgeAndBatchQueues` |
| 154 | `topLevelFunction` | `getByPath` | `pathTextAndMetadataHelpers` |
| 175 | `topLevelFunction` | `flattenText` | `pathTextAndMetadataHelpers` |
| 212 | `topLevelFunction` | `getTextFromPaths` | `pathTextAndMetadataHelpers` |
| 226 | `topLevelFunction` | `normalizeChannelHandle` | `channelHandleExtractionHelpers` |
| 262 | `topLevelFunction` | `findHandleInValue` | `channelHandleExtractionHelpers` |
| 296 | `topLevelFunction` | `extractChannelHandleFromPaths` | `channelHandleExtractionHelpers` |
| 305 | `topLevelFunction` | `flattenMetadataRow` | `pathTextAndMetadataHelpers` |
| 336 | `topLevelFunction` | `flattenMetadataRowsContainer` | `pathTextAndMetadataHelpers` |
| 355 | `topLevelFunction` | `getMetadataRowsText` | `pathTextAndMetadataHelpers` |
| 845 | `classMethod` | `constructor` | `constructionAndSettings` |
| 856 | `classMethod` | `_buildChannelFilterIndex` | `constructionAndSettings` |
| 867 | `classMethod` | `_matchesAnyChannel` | `channelMatchPolicy` |
| 886 | `classMethod` | `_harvestBrowseEndpoint` | `harvestAndMapWrites` |
| 938 | `classMethod` | `_processSettings` | `constructionAndSettings` |
| 1067 | `classMethod` | `_harvestChannelData` | `harvestAndMapWrites` |
| 1174 | `classMethod` | `_harvestPlayerOwnerData` | `harvestAndMapWrites` |
| 1281 | `classMethod` | `_harvestRendererChannelMappings` | `harvestAndMapWrites` |
| 1335 | `classMethod` | `_harvestVideoOwnerFromRenderer` | `harvestAndMapWrites` |
| 1370 | `classMethod` | `_registerVideoChannelMapping` | `harvestAndMapWrites` |
| 1386 | `classMethod` | `_registerVideoMetaMapping` | `harvestAndMapWrites` |
| 1420 | `classMethod` | `_harvestFromRendererByline` | `harvestAndMapWrites` |
| 1476 | `classMethod` | `_registerMapping` | `harvestAndMapWrites` |
| 1516 | `classMethod` | `_registerCustomUrlMapping` | `harvestAndMapWrites` |
| 1557 | `classMethod` | `_log` | `loggingAndDecisionTelemetry` |
| 1570 | `classMethod` | `_logWhitelistDecision` | `loggingAndDecisionTelemetry` |
| 1589 | `classMethod` | `_unwrapRendererForFiltering` | `candidateAndRendererUnwrap` |
| 1633 | `classMethod` | `_paths` | `candidateAndRendererUnwrap` |
| 1638 | `classMethod` | `_collectTextFromPaths` | `candidateAndRendererUnwrap` |
| 1663 | `classMethod` | `_extractVideoId` | `candidateAndRendererUnwrap` |
| 1686 | `classMethod` | `_extractPlaylistId` | `candidateAndRendererUnwrap` |
| 1702 | `classMethod` | `_emptyChannelInfo` | `channelMatchPolicy` |
| 1706 | `classMethod` | `_hasChannelPolicyRules` | `channelMatchPolicy` |
| 1712 | `classMethod` | `_buildCandidate` | `candidateAndRendererUnwrap` |
| 1792 | `classMethod` | `_candidateSearchText` | `candidateAndRendererUnwrap` |
| 1807 | `classMethod` | `_regexMatches` | `candidateAndRendererUnwrap` |
| 1825 | `classMethod` | `_shouldBlock` | `blockDecisionPipeline` |
| 2126 | `classMethod` | `_checkCategoryFilters` | `blockDecisionPipeline` |
| 2187 | `classMethod` | `_extractTitle` | `fieldExtractionAndParsing` |
| 2211 | `classMethod` | `_extractDescription` | `fieldExtractionAndParsing` |
| 2248 | `classMethod` | `_parseDurationToSeconds` | `fieldExtractionAndParsing` |
| 2279 | `classMethod` | `_parseAriaLabelDurationSeconds` | `fieldExtractionAndParsing` |
| 2294 | `classMethod` | `_parseRelativeTimeToTimestamp` | `fieldExtractionAndParsing` |
| 2333 | `classMethod` | `_extractDuration` | `fieldExtractionAndParsing` |
| 2571 | `classMethod` | `_extractPublishedTime` | `fieldExtractionAndParsing` |
| 2701 | `classMethod` | `_checkContentFilters` | `blockDecisionPipeline` |
| 2860 | `classMethod` | `_checkUppercaseTitle` | `blockDecisionPipeline` |
| 2896 | `classMethod` | `_extractChannelInfo` | `fieldExtractionAndParsing` |
| 3218 | `classMethod` | `_matchesChannel` | `channelMatchPolicy` |
| 3391 | `classMethod` | `filter` | `recursionAndEntrypoints` |
| 3434 | `classMethod` | `processData` | `recursionAndEntrypoints` |
| 3477 | `globalInterfaceFunction` | `FilterTubeEngine.processData` | `recursionAndEntrypoints` |
| 3485 | `globalInterfaceFunction` | `FilterTubeEngine.harvestOnly` | `recursionAndEntrypoints` |

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
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, renderer expansion, identity trust changes,
map-write pruning, no-work optimization, or lifecycle cleanup.
