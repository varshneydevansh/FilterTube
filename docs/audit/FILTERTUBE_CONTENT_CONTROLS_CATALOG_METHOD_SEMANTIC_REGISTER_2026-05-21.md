# FilterTube Content Controls Catalog Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content_controls_catalog.js` from broad UI/settings
callable accounting to a source-derived catalog and accessor inventory. It
covers the shared `FilterTubeContentControlsCatalog` helper used by popup and
tab-view paths to render content-control groups, labels, descriptions, and
control keys.

This is not completion proof for route scope, runtime enforcement, default
values, settings compiler parity, background cache invalidation, DOM fallback
selector ownership, JSON endpoint support, watch/player route policy, Kids/YTM
surface behavior, popup/tab-view visual parity, or future simultaneous
allow/block semantics. It is a current-behavior boundary before catalog,
content-control, settings-mode, UI visibility, or runtime enforcement behavior
changes.

## Source-Derived Summary

```text
source file: js/content_controls_catalog.js
line count: 222
named declarations: 3
plain function declarations: 3
async function declarations: 0
const arrow helper declarations: 0
public FilterTubeContentControlsCatalog entries: 3
semantic method groups: 2
catalog group count: 7
catalog control count: 29
catalog group ids: core, feed, watch, video_info, player, navigation, search
accentColor entries: 7
empty description entries: 1
escaped-newline description entries: 1
map calls: 2
flatMap calls: 1
find calls: 1
Array.isArray calls: 1
object spread copies: 2
array spread copies: 1
document references: 0
window references: 0
addEventListener calls: 0
setTimeout calls: 0
setInterval calls: 0
requestAnimationFrame calls: 0
MutationObserver references: 0
storage references: 0
global.FilterTubeContentControlsCatalog assignments: 1
module.exports references: 0
runtime behavior changed: no
```

## Catalog Group Counts

```text
core: 3
feed: 6
watch: 4
video_info: 6
player: 4
navigation: 5
search: 1
```

## Method Group Counts

```text
contentControlsCatalogLookupAccessor: 1
contentControlsCatalogSnapshotAccessors: 2
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `contentControlsCatalogSnapshotAccessors` | 2 | Returns shallow snapshots for popup/tab-view rendering; `getCatalog()` copies group objects and control arrays while preserving nested control object identity, and `getAllControls()` copies individual control objects. | Copy-depth contract, caller mutation fixture, UI ordering parity, missing-control fixture, and catalog-key alignment proof. |
| `contentControlsCatalogLookupAccessor` | 1 | Returns `null` for falsy keys and otherwise searches the current flattened catalog by exact `control.key` equality. | Unknown-key policy, duplicate-key fixture, route/surface validity report, and runtime enforcement alignment proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 201 | `function` | `getCatalog` | `contentControlsCatalogSnapshotAccessors` |
| 208 | `function` | `getAllControls` | `contentControlsCatalogSnapshotAccessors` |
| 212 | `function` | `getControlByKey` | `contentControlsCatalogLookupAccessor` |

## Current Public API Surface

```text
getCatalog
getAllControls
getControlByKey
```

## Current Catalog Key Surface

```text
core: hideShorts, hideHomeFeed, hideComments
feed: hideSponsoredCards, hidePlaylistCards, hideMembersOnly, hideMixPlaylists, showQuickBlockButton, showBlockMenuItem
watch: hideVideoSidebar, hideRecommended, hideLiveChat, hideWatchPlaylistPanel
video_info: hideVideoInfo, hideVideoButtonsBar, hideAskButton, hideVideoChannelRow, hideVideoDescription, hideMerchTicketsOffers
player: hideEndscreenVideowall, hideEndscreenCards, disableAutoplay, disableAnnotations
navigation: hideTopHeader, hideNotificationBell, hideExploreTrending, hideMoreFromYouTube, hideSubscriptions
search: hideSearchShelves
```

## Current Entrypoints And Dependencies

```text
module entrypoint: (function (global) { ... })(typeof window !== 'undefined' ? window : this)
browser/global export: global.FilterTubeContentControlsCatalog
known UI consumers: popup, tab-view
runtime enforcement owners are outside this file: settings_shared, state_manager, background, seed, filter_logic, content/dom_fallback, content/bridge_settings
getCatalog copy depth: group object and controls array copied, nested control objects shared
getAllControls copy depth: individual control objects copied
getControlByKey lookup policy: falsy key returns null, strict key equality otherwise
no DOM selector ownership: true
no listener ownership: true
no timer ownership: true
no storage mutation ownership inside this file: true
```

## Future Proof Fields

Each content controls catalog method and control-key row must eventually be
backed by a source line, caller fixture, and runtime effect decision before
catalog or content-control behavior changes can claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
publicApiEntry
catalogGroupId
catalogControlKey
controlTitle
controlDescription
accentColor
callerSurface
settingsKey
compiledSettingsKey
backgroundInvalidationKey
contentBridgeRefreshKey
jsonEndpointOwner
domFallbackSelectorOwner
routeScope
surfaceScope
enforcementEffect
uiOnlyEffect
defaultValuePolicy
copyDepthPolicy
duplicateKeyPolicy
unknownKeyPolicy
positiveUiFixture
negativeUnknownKeyFixture
negativeRouteScopeFixture
settingsCompilerParityFixture
runtimeEnforcementParityFixture
fixtureProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source yet. They name the
contracts that would be needed before implementation changes can be treated as
covered:

```text
contentControlsCatalogMethodAuthority
contentControlsCatalogRuntimeSemanticsManifest
contentControlsCatalogKeyParityReport
contentControlsCatalogRouteScopeReport
contentControlsCatalogControlEffectBudget
contentControlsCatalogAccessorCopyContract
contentControlsCatalogUiRuntimeAlignmentReport
contentControlsCatalogFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
