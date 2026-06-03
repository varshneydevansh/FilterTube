# FilterTube DOM Fallback Selector Semantic Register - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This slice promotes the `js/content/dom_fallback.js` and
`js/content/dom_helpers.js` selector rows from source-counted selector coverage
to source-derived selector/effect groups. It is not completion proof for every
DOM selector and it is not permission to broaden, prune, merge, escape, or
optimize selector behavior.

## Scope

```text
source files: js/content/dom_fallback.js, js/content/dom_helpers.js
selector APIs: querySelectorAll, querySelector, closest, matches
selector API sites: 166
static literal args: 153
dynamic/non-literal args: 13
unique static selector literals: 121
semantic selector groups: 10
dynamic selector families: 13
```

`js/content/dom_fallback.js` owns 163 of these selector sites. The shared helper
file owns 3 selector sites, including the caller-provided `childSelector` input
to `updateContainerVisibility()`.

## API Totals

| Selector API | Current call sites |
| --- | ---: |
| `querySelectorAll()` | 42 |
| `querySelector()` | 92 |
| `closest()` | 32 |
| `matches()` | 0 |
| **Total** | **166** |

## File Totals

| File | Selector API sites | Static literal args | Dynamic/non-literal args |
| --- | ---: | ---: | ---: |
| `js/content/dom_fallback.js` | 163 | 151 | 12 |
| `js/content/dom_helpers.js` | 3 | 2 | 1 |

## Semantic Selector Groups

| Group | Selector API sites | Static literal args | Dynamic/non-literal args | Current risk boundary |
| --- | ---: | ---: | ---: | --- |
| `commentFallbackSelectors` | 13 | 10 | 3 | Comment containers, comment renderers, author anchors, and composer guards are selected separately, so a comment hide path still needs thread/root and sibling-visible proof. |
| `currentWatchOwnerAndPlayerControlSelectors` | 6 | 6 | 0 | Current-watch owner blocking can select watch shells, videos, and next controls before the hide/click/pause effects are unified under one decision. |
| `guideSubscriptionFallbackSelectors` | 3 | 3 | 0 | Guide subscription entries use visible label extraction and direct entry targeting without a selector owner report. |
| `helperVisualWriters` | 3 | 2 | 1 | Shared visual helper selectors read caller-provided child selectors and hidden ancestors while also writing visual state elsewhere in the helper. |
| `mainCardIdentityAndTargetSelectors` | 73 | 71 | 2 | The main fallback loop mixes global card scans, owner extraction, current route checks, parent targeting, and direct display writers. |
| `mixPlaylistAndWatchIdentitySelectors` | 12 | 12 | 0 | Mix/radio, playlist panel, and current watch owner selectors join playlist/video/channel identity with fallback target decisions. |
| `pendingWhitelistAndMetadataSelectors` | 7 | 7 | 0 | Metadata rerun work is selector-triggered but not governed by a shared whitelist pending budget. |
| `shelfGridPlaylistGuardSelectors` | 18 | 15 | 3 | Shelf and grid cleanup can collapse sections and dedupe items, which requires sibling-visible proof before changes. |
| `staleRestoreAndBroadControlSelectors` | 11 | 10 | 1 | Stale marker cleanup, members-only, playlist, Mix chip, and style cleanup selectors include broad parent/shelf targets. |
| `surveyChipAndShortsSelectors` | 20 | 17 | 3 | Survey, chip, Shorts, guide/nav, disguised-Shorts, and shelf-title selectors mix route cleanup with content hide decisions. |

## Dynamic Selector Inventory

| File | Line | API | Group | Dynamic family | Expression |
| --- | ---: | --- | --- | --- | --- |
| `js/content/dom_fallback.js` | 1571 | `querySelectorAll` | `commentFallbackSelectors` | `inlineMobileSearchControlSelectorArray` | `INLINE_MOBILE_SEARCH_CONTROL_SELECTORS.join(',')` |
| `js/content/dom_fallback.js` | 1707 | `querySelectorAll` | `commentFallbackSelectors` | `commentEntryCandidateArray` | `['ytm-comment-section-renderer', ...]` |
| `js/content/dom_fallback.js` | 1747 | `querySelectorAll` | `commentFallbackSelectors` | `homeFeedSelectorArray` | `homeFeedSelectors` |
| `js/content/dom_fallback.js` | 2196 | `querySelectorAll` | `staleRestoreAndBroadControlSelectors` | `staleHiddenSelectorArgument` | `hiddenSelector` |
| `js/content/dom_fallback.js` | 2507 | `querySelectorAll` | `mainCardIdentityAndTargetSelectors` | `videoCardPendingTemplate` | `` `${VIDEO_CARD_SELECTORS}[data-filtertube-whitelist-pending="true"]` `` |
| `js/content/dom_fallback.js` | 2508 | `querySelectorAll` | `mainCardIdentityAndTargetSelectors` | `globalVideoCardSelectorConstant` | `VIDEO_CARD_SELECTORS` |
| `js/content/dom_fallback.js` | 4220 | `querySelectorAll` | `surveyChipAndShortsSelectors` | `shortsContainerSelectorArray` | `shortsContainerSelectors` |
| `js/content/dom_fallback.js` | 4225 | `querySelectorAll` | `surveyChipAndShortsSelectors` | `mobileShortsNavSelectorArray` | `['ytm-pivot-bar-renderer a[href*="/shorts"]', ...]` |
| `js/content/dom_fallback.js` | 4272 | `querySelectorAll` | `surveyChipAndShortsSelectors` | `disguisedShortsSelectorArray` | `disguisedShortsSelectors` |
| `js/content/dom_fallback.js` | 4326 | `querySelector` | `shelfGridPlaylistGuardSelectors` | `iteratedLinkSelectorCandidate` | `sel` |
| `js/content/dom_fallback.js` | 4353 | `querySelectorAll` | `shelfGridPlaylistGuardSelectors` | `shortsSelectorArray` | `shortsSelectors` |
| `js/content/dom_fallback.js` | 4383 | `querySelector` | `shelfGridPlaylistGuardSelectors` | `iteratedShortsSelectorCandidate` | `selector` |
| `js/content/dom_helpers.js` | 160 | `querySelectorAll` | `helperVisualWriters` | `callerProvidedChildSelector` | `childSelector` |

## Current Behavior Boundaries

- `VIDEO_CARD_SELECTORS` is still the central dynamic card scan for the main
  fallback loop. It mixes route/surface families and is not a selector
  authority.
- The whitelist-pending template restricts a rerun to marked cards, but the
  marker is written by other hide/identity paths and has no shared provenance
  report.
- `hiddenSelector` cleanup restores markers by source-local selector strings;
  it does not prove that broad parent hides, shelf hides, and helper hides share
  one restore owner.
- Comment selectors separate containers, threads, root comments, view models,
  author anchors, and composer exclusion. False-hide proof still needs root
  thread and sibling-visible fixtures.
- Members-only, playlist, Mix, Shorts, chip, survey, shelf, and grid selectors
  can hide or restore broad ancestors and controls through direct display
  writers outside a structured selector effect report.
- `childSelector` in `updateContainerVisibility()` remains caller-provided,
  so helper use needs caller ownership and escape policy proof before reuse.

## Required Future Selector Fields

```text
selectorSiteId
selectorApi
expressionKind
staticLiteralOrExpression
semanticGroup
ownerFunction
sourceTier
routeOrSurface
settingsPredicate
listMode
targetKind
actionKind
identitySourceTier
dynamicFamily
escapePolicy
allowedDomRead
allowedDomWrite
hideTargetBoundary
restoreOwner
teardownOwner
noRuleBudget
positiveFixture
negativeRouteFixture
negativeSiblingVisibleFixture
negativeNoRuleFixture
```

## Missing Runtime Authorities

The following authority names intentionally do not exist in current runtime
source:

- `domFallbackSelectorSemanticAuthority`
- `domFallbackSelectorEffectReport`
- `domFallbackSelectorOwnerContract`
- `domFallbackDynamicSelectorEscapePolicy`
- `domFallbackSelectorNoRuleBudget`
- `domFallbackSelectorRestoreProof`
- `domFallbackSiblingVisibleFixtureReport`
- `domHelperSelectorInputContract`

They are future contract names, not current implementation symbols.

## Current Verdict

```text
Completion is not proven.
This is selector semantic proof for one DOM fallback/helper slice only.
Repository-wide DOM selector authority remains incomplete.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
