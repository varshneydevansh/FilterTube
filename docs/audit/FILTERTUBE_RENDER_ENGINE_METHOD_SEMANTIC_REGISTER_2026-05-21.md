# FilterTube Render Engine Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/render_engine.js` from representative UI/render
tokens to a source-derived method inventory. It covers the popup/tab-view list
renderer that reads `StateManager` state, picks Main/Kids and blocklist/
whitelist row sources, merges Kids entries when sync is enabled, renders keyword
and channel rows, binds row actions to `StateManager` or caller overrides, and
uses idle batching for channel-list DOM writes.

This is not completion proof for every UI control, tab-view workflow, popup
workflow, style class, accessibility state, row-action mutation, callback body,
or rendered DOM effect. It is a current-behavior boundary for the
`RenderEngine` method surface before settings UI, row-action, rendering,
list-mode, or performance behavior changes.

## Source-Derived Summary

```text
source file: js/render_engine.js
source split lines: 1390
source wc -l: 1389
source bytes: 59073
source sha256: ceb77f3e50a17affb726f099b15b52fdce311cd027b8f0903174b8d1433cbfa0
broad lexical callable matches: 126
IIFE-scoped declarations: 35
plain function declarations: 30
const arrow helper declarations: 5
async function declarations: 0
public API entries: 4
semantic method groups: 6
accepted IIFE-scoped declaration rows: 35
semantic method rows promoted: 35
control-flow lexical artifacts: 85 (`if`: 84, `while`: 1)
local/render callback declarations held outside this IIFE method register: 6
row-action listener sites: 7
direct StateManager optional calls: 26
unique StateManager methods reached: 11
UIComponents optional factory calls: 5
scheduler primitive references: 5
document.createElement calls: 30
document.createDocumentFragment calls: 1
innerHTML writes: 10
setAttribute calls: 12
querySelector calls: 0
executable current-behavior probes: 6
runtime behavior changed: no
```

## Method Group Counts

```text
badgeAndSourceDecoration: 5
channelDisplayIdentityHelpers: 9
channelRenderingAndRowActions: 7
collaborationGrouping: 3
dependencyAndSchedulingHelpers: 6
keywordRenderingAndRowActions: 5
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `dependencyAndSchedulingHelpers` | 6 | Reads global dependencies lazily, provides timestamp fallback, and schedules/cancels channel render batches through `requestIdleCallback` or `setTimeout`. | UI owner, idle budget, cancellation proof, fallback timer proof, stale-render prevention, and no-rule render budget. |
| `badgeAndSourceDecoration` | 5 | Creates source badges, Kids sync badges, source classes, and collaboration badge DOM. | Display contract, localization/accessibility proof, source-class meaning, class/style ownership, and negative visual-regression fixtures. |
| `channelDisplayIdentityHelpers` | 9 | Decodes and normalizes handles/custom URLs, creates YouTube channel links, detects topic channels, derives mapping arrows, and formats channel display identity. | Identity confidence, URL safety, topic-channel policy, mapping provenance, display-versus-rule distinction, and negative identity fixtures. |
| `keywordRenderingAndRowActions` | 5 | Chooses keyword source by profile/list mode, merges synced Kids entries, filters/sorts/date-filters, writes empty states, renders rows, and binds exact/comment/delete actions. | Visible-row parity, Main/Kids mode fixtures, callback-vs-StateManager authority, row-action mutation report, no-rule row behavior, and keyboard accessibility proof. |
| `channelRenderingAndRowActions` | 7 | Chooses channel source by profile/list mode, merges synced Kids entries, filters/sorts/date-filters, batches DOM append work, renders minimal/full rows, and binds delete/Filter All actions. | Idle work budget, stale batch cancellation, list-index stability, whitelist spacer policy, callback-vs-StateManager authority, and large-list performance fixtures. |
| `collaborationGrouping` | 3 | Groups channels by collaboration id, compares collaborator identity, and builds present/missing collaboration metadata for row badges. | Collaboration identity policy, partial-group display proof, missing-member negative fixtures, and cross-feature row-action proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 14 | `const arrow` | `getStateManager` | `dependencyAndSchedulingHelpers` |
| 15 | `const arrow` | `getUIComponents` | `dependencyAndSchedulingHelpers` |
| 16 | `const arrow` | `getSettings` | `dependencyAndSchedulingHelpers` |
| 18 | `const arrow` | `scheduleIdle` | `dependencyAndSchedulingHelpers` |
| 25 | `const arrow` | `cancelIdle` | `dependencyAndSchedulingHelpers` |
| 35 | `function` | `safeTimestamp` | `dependencyAndSchedulingHelpers` |
| 39 | `function` | `createPillBadge` | `badgeAndSourceDecoration` |
| 47 | `function` | `applySourceClasses` | `badgeAndSourceDecoration` |
| 55 | `function` | `createSourceBadge` | `badgeAndSourceDecoration` |
| 70 | `function` | `createKidsSyncBadge` | `badgeAndSourceDecoration` |
| 78 | `function` | `normalizeChannelHandle` | `channelDisplayIdentityHelpers` |
| 85 | `function` | `decodeChannelDisplayValue` | `channelDisplayIdentityHelpers` |
| 95 | `function` | `normalizeChannelCustomPath` | `channelDisplayIdentityHelpers` |
| 110 | `function` | `getChannelPageUrl` | `channelDisplayIdentityHelpers` |
| 132 | `function` | `getChannelDisplayName` | `channelDisplayIdentityHelpers` |
| 139 | `function` | `createChannelNameNode` | `channelDisplayIdentityHelpers` |
| 169 | `function` | `renderKeywordList` | `keywordRenderingAndRowActions` |
| 312 | `function` | `createKeywordListItem` | `keywordRenderingAndRowActions` |
| 548 | `function` | `renderChannelList` | `channelRenderingAndRowActions` |
| 767 | `function` | `groupChannelsByCollaboration` | `collaborationGrouping` |
| 785 | `function` | `buildCollaborationMeta` | `collaborationGrouping` |
| 832 | `function` | `matchesCollaborator` | `collaborationGrouping` |
| 845 | `function` | `createCollaborationBadge` | `badgeAndSourceDecoration` |
| 872 | `function` | `createChannelListItem` | `channelRenderingAndRowActions` |
| 895 | `function` | `createMinimalChannelItem` | `channelRenderingAndRowActions` |
| 959 | `function` | `createFullChannelItem` | `channelRenderingAndRowActions` |
| 1074 | `function` | `createNodeMapping` | `channelRenderingAndRowActions` |
| 1121 | `function` | `createFilterAllToggle` | `channelRenderingAndRowActions` |
| 1168 | `function` | `createFallbackFilterAllToggle` | `channelRenderingAndRowActions` |
| 1203 | `function` | `isTopicChannel` | `channelDisplayIdentityHelpers` |
| 1214 | `function` | `getTopicChannelTooltip` | `channelDisplayIdentityHelpers` |
| 1222 | `function` | `findChannelByRef` | `keywordRenderingAndRowActions` |
| 1241 | `function` | `deriveChannelMapping` | `channelDisplayIdentityHelpers` |
| 1334 | `function` | `createFallbackExactToggle` | `keywordRenderingAndRowActions` |
| 1366 | `function` | `createFallbackDeleteButton` | `keywordRenderingAndRowActions` |

## Current Public API

```text
renderKeywordList
renderChannelList
createKeywordListItem
createChannelListItem
```

## Current Row-Action and DOM Surface

Unique `StateManager` methods reached directly from this renderer:

```text
getState
removeChannel
removeKeyword
removeKidsChannel
removeKidsKeyword
toggleChannelFilterAll
toggleChannelFilterAllCommentsByRef
toggleKeywordComments
toggleKeywordExact
toggleKidsChannelFilterAll
toggleKidsKeywordExact
```

The renderer has 7 current `addEventListener` sites: five `click` listeners and
two `keydown` listeners. The listeners are fallback row-action bindings for
comment toggles, exact toggles, delete buttons, and Filter All toggles.

This file does not call `querySelector` or `querySelectorAll`. Its DOM target
surface is created markup and class names rather than selector lookup: 30
`document.createElement()` calls, one `document.createDocumentFragment()` call,
10 `innerHTML` writes, and 12 `setAttribute()` calls in current source.

## Executable Current-Behavior Probes

`tests/runtime/render-engine-method-semantic-register-current-behavior.test.mjs`
now loads `js/render_engine.js` in a VM with a minimal DOM and mocked
`StateManager`/`FilterTubeSettings`. The executable probes prove these current
behaviors without changing runtime source:

- Main keyword rendering merges synced Kids-only entries, de-duplicates a Kids
  duplicate by lowercase word, applies newest-first order, and marks
  channel-derived/Kids rows with current source classes.
- Fallback user-keyword controls call `toggleKeywordComments`,
  `toggleKeywordExact` through Space/Enter keyboard handling, and
  `removeKeyword`.
- Fallback channel-derived keyword comment controls call
  `toggleChannelFilterAllCommentsByRef(channelRef)`.
- Full channel rows create outbound YouTube links with `_blank` and
  `noopener noreferrer`, dispatch Main/Kids delete and Filter All actions to
  `StateManager`, and keep the current fallback behavior where caller
  callbacks are not used unless `UIComponents.createToggleButton` is present.
- Fallback Filter All currently bypasses `onToggleFilterAll` and dispatches to
  `StateManager`; whitelist mode returns a hidden disabled spacer with no click
  listener.
- Channel rendering cancels a previous container task, appends the first 60
  full rows immediately, schedules the remaining batch, and clears the
  container task id after completion.

## Current Behavior Boundaries

- `renderKeywordList()` reads state from `StateManager.getState()` unless a
  `stateOverride` is supplied, chooses Main/Kids and blocklist/whitelist keyword
  sources, optionally merges Kids rows into Main when `syncKidsToMain` and modes
  match, filters by search/date, sorts by selected order, clears the container
  through `innerHTML`, writes empty-state markup, and appends row nodes.
- `createKeywordListItem()` binds row actions either through caller callbacks or
  direct `StateManager` methods. Channel-derived keyword rows call
  `toggleChannelFilterAllCommentsByRef`; user keyword rows can call Main or Kids
  exact/delete/comment mutation methods.
- `renderChannelList()` cancels any prior container idle task, increments
  `container.__ftChannelRenderGen`, chooses Main/Kids and blocklist/whitelist
  channel sources, optionally merges Kids rows into Main, builds index maps,
  clears the container, and appends channel rows in idle batches guarded by the
  render generation.
- `createFilterAllToggle()` and `createFallbackFilterAllToggle()` return a
  hidden disabled spacer in whitelist mode, so whitelist visual parity depends
  on row-render policy rather than a shared row-action authority.
- `createFullChannelItem()` and `createMinimalChannelItem()` bind delete actions
  directly to Main or Kids channel removal methods when caller overrides are not
  supplied.
- Channel display helpers create outbound YouTube channel links, decode encoded
  handles/custom URLs, mark topic channels as display-resolved, and show mapping
  arrows from original input to resolved ids, handles, custom paths, or map
  entries.

## Future Method Proof Fields

Any future behavior change in this file needs rows with at least:

```text
methodReference
sourceLine
semanticGroup
callerUi
profileType
profileId
listModeInput
stateSource
stateOverridePolicy
visibleRows
syncedKidsRows
sortFilterPolicy
domWriteEffect
listenerEffect
keyboardEffect
stateManagerMutationEffect
uiComponentFallbackPolicy
idleRenderBudget
renderCancellationBoundary
emptyStateBehavior
whitelistSpacerBehavior
identityDisplayPolicy
channelMappingPolicy
collaborationDisplayPolicy
accessibilityFixture
positiveFixture
negativeModeFixture
negativeCallbackFixture
negativeSiblingFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

No runtime source currently implements:

- `renderEngineMethodAuthority`
- `renderEngineRowActionContract`
- `renderEngineDomEffectReport`
- `renderEngineIdleRenderBudget`
- `renderEngineVisibleRowParityReport`
- `renderEngineAccessibilityContract`
- `renderEngineIdentityDisplayPolicy`

These are future contract names. This register does not authorize UI rendering
changes, row-action rewrites, list-mode display changes, idle batching changes,
callback fallback changes, accessibility changes, channel-display changes, or
collaboration row changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

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
