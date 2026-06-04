# FilterTube DOM Extractors Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior proof. This file does not change product
runtime behavior and does not open the implementation gate.

Scope: `js/content/dom_extractors.js`, loaded as an Isolated World content
script before `js/content_bridge.js`.

## Current Behavior Inventory

`js/content/dom_extractors.js` currently has 1,103 source lines by newline split
count, 1,102 `wc -l` lines, 18 top-level function declarations, 0 async
function declarations, 5 local const arrow or IIFE result declarations, 23
arrow token sites, 47 `VIDEO_CARD_SELECTORS` entries, and 5 semantic method
groups.

```text
source file: js/content/dom_extractors.js
split source lines: 1103
wc line count: 1102
source bytes: 45149
source sha256: 3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237
repo-wide broad parser lexical callable matches: 114
broad parser declaration/inventory matches: 23
assignment-expression function declarations outside broad parser: 0
control-flow lexical artifacts: 91
file-local executable proof probes: 7
global method proof count promoted: 0
runtime behavior changed: no
```

Manifest order remains:

- `manifest.json`: `js/content/dom_helpers.js`, then
  `js/content/dom_extractors.js`, then `js/content/handle_resolver.js`, then
  `js/content_bridge.js`.
- `manifest.firefox.json`: `js/content/dom_helpers.js`, then
  `js/content/dom_extractors.js`, then `js/content/handle_resolver.js`, then
  `js/content_bridge.js`.

## Method Rows

| Line | Declaration | Semantic group | Current side effects or proof burden |
| ---: | --- | --- | --- |
| 62 | `ensureVideoIdForCard(card)` | Card identity stamping and recycled-node cleanup | Reads and writes `data-filtertube-video-id`, rejects fast cached return for Kids and recycled high-risk card tags, clears stale channel, hide, blocked, collaborator, and pending metadata when a recycled node gets a new video id. |
| 211 | `getCardTitle(card)` | Card selector and title extraction | Reads title selectors, `aria-label`, and `aria-labelledby` through `document.getElementById()`. |
| 229 | `findVideoCardElement(element)` | Card selector and title extraction | Uses `VIDEO_CARD_SELECTORS` with `matches()` and `closest()` to promote child elements to card candidates. |
| 244 | `extractVideoDuration(element)` | Duration parsing and duration-cache behavior | Reads and writes `data-filtertube-duration`, treats empty cache as a no-duration sentinel, and re-scans only when duration indicators appear. |
| 328 | `parseAriaLabelDuration(ariaLabel)` | Duration parsing and duration-cache behavior | Converts hour/minute/second aria text to seconds. |
| 359 | `parseDuration(durationText)` | Duration parsing and duration-cache behavior | Converts colon-separated duration text to seconds. |
| 382 | `extractShelfTitle(shelf)` | Card selector and title extraction | Reads scoped shelf header/title selectors and aria labels. |
| 426 | `extractChannelIdFromString(value)` | Channel metadata normalization and cache behavior | Extracts UC channel ids from strings. |
| 432 | `normalizeHrefForParsing(href)` | Channel metadata normalization and cache behavior | Parses hrefs relative to `document.location?.origin` and falls back to the raw href on parse failure. |
| 442 | `extractCustomUrlFromPath(path)` | Channel metadata normalization and cache behavior | Extracts `/c/` and `/user/` custom channel paths while excluding handles and `/channel/` paths. |
| 472 | `buildChannelMetadata(channelText, channelHref)` | Channel metadata normalization and cache behavior | Builds `{ handle, id, customUrl }` from text and href using shared handle helpers plus UC/custom extraction. |
| 481 | `collectDatasetValues(element)` | Channel metadata normalization and cache behavior | Joins dataset values for identity fallback scanning. |
| 486 | `collectAttributeValues(element)` | Channel metadata normalization and cache behavior | Joins attribute values for identity fallback scanning. |
| 494 | `scanDataForVideoId(root)` | Video id extraction waterfall | Reads selected JSON-like data slots, playlist child renderer slots, and Kids blacklist endpoint slots for an 11-character video id. |
| 546 | `scanDataForChannelIdentifiers(root)` | Channel metadata normalization and cache behavior | Reads shallow channel fields, browse ids, canonical URLs, safe text runs, and navigation endpoints without deep-recursing into item collections. |
| 625 | `extractChannelMetadataFromElement(element, channelText, channelHref, options)` | Channel metadata normalization and cache behavior | Trusts cached handle/id only under local href consistency checks, removes stale cache when checks fail, scans dataset/attributes/data/anchors/innerText fallbacks, and writes `data-filtertube-channel-handle` plus `data-filtertube-channel-id`. |
| 916 | `clearCachedChannelMetadata(root)` | Channel metadata normalization and cache behavior | Removes cached channel handle/id stamps from a root and descendants with matching data attributes. |
| 947 | `extractVideoIdFromCard(card)` | Video id extraction waterfall | Extracts ids from watch, shorts, live, embed, Kids links, stamped data, dataset/attribute strings, and selected data host slots; logs and returns null on exception. |

Local const arrow or IIFE result declarations:

| Line | Declaration | Kind | Semantic group |
| ---: | --- | --- | --- |
| 66 | `isKidsHost` | local const IIFE result | Card identity stamping and recycled-node cleanup |
| 736 | `addSource` | local const arrow helper | Channel metadata normalization and cache behavior |
| 952 | `isKidsHost` | local const IIFE result | Video id extraction waterfall |
| 960 | `extractFromHref` | local const arrow helper | Video id extraction waterfall |
| 1074 | `addSource` | local const arrow helper | Video id extraction waterfall |

## Lexical Callable Reconciliation

The repo-wide broad callable parser overmatches control-flow blocks in this
extractor file. File-local reconciliation keeps those artifacts out of the
method inventory:

```text
broad parser total matches: 114
accepted declaration/inventory rows: 23
top-level function declarations accepted: 18
local const arrow or IIFE inventory rows accepted: 5
control-flow artifacts rejected: 91
if artifacts rejected: 80
for artifacts rejected: 11
assignment-expression function declarations outside broad parser: 0
global method proof count promoted: 0
runtime behavior changed: no
```

The local `isKidsHost`, `addSource`, and `extractFromHref` rows are scoped
helper/inventory rows. They are included because they own route/profile
branching and provenance filtering, but they do not become global runtime
authorities.

## Selector And DOM Effect Counts

Current source-counted primitive totals:

```text
document literal occurrences: 2
window literal occurrences: 2
location literal occurrences: 3
Element token occurrences: 4
Node token occurrences: 2
querySelector calls: 21
querySelectorAll calls: 4
matches calls: 1
closest calls: 9
getAttribute calls: 20
setAttribute calls: 7
removeAttribute calls: 59
hasAttribute calls: 8
classList.remove calls: 2
style.display references: 2
textContent references: 10
innerText references: 3
dataset references: 4
data-filtertube-* token occurrences: 87
new URL calls: 2
Array.isArray calls: 4
new Set calls: 9
forEach calls: 6
map calls: 7
filter calls: 15
some calls: 1
startsWith calls: 22
console.error calls: 1
setTimeout calls: 0
setInterval calls: 0
addEventListener calls: 0
MutationObserver references: 0
postMessage calls: 0
runtime sendMessage calls: 0
fetch calls: 0
```

The 47 `VIDEO_CARD_SELECTORS` entries span desktop Main, watch cards,
playlist/radio surfaces, mobile/YTM, Shorts lockups, channel renderers, and
YouTube Kids DOM-only renderers. Representative current selector entries
include `ytd-watch-card-rhs-panel-video-renderer`,
`ytm-shorts-lockup-view-model-v2`, and `ytk-kids-slim-owner-renderer`. This
selector family is therefore not a single route-scoped authority.

## Current Risk Boundaries

Recycled-node cleanup is already present but incomplete as proof. When
`ensureVideoIdForCard()` extracts a new video id, it can remove stale
`data-filtertube-*` identity, hidden, blocked, collaborator, processed, and
pending attributes, and it restores `style.display` only on one mismatch path.
That is current mitigation, not proof that every recycled card is restored.

Cached channel metadata remains a high-impact trust path.
`extractChannelMetadataFromElement()` may trust cached handle/id when no fresh
href identity exists, may remove stale cached values when href checks fail,
and may write new channel stamps back to a DOM node. That makes the function a
cache mutation boundary for future false-hide and wrong-menu-label fixes.

Fallback identity scanning is intentionally broad. The function reads dataset
values, all attribute values, selected data-host objects, anchors, channel
links, and finally `innerText` from cache targets, elements, and related
elements. This helps weak surfaces but needs a confidence tier and work budget
before any change can claim reduced false hides or reduced layout cost.

Duration extraction uses a negative cache. `extractVideoDuration()` writes an
empty `data-filtertube-duration` string after a miss and returns null on later
calls unless a visible duration indicator appears. This is a performance
optimization and a potential leak/false-negative boundary when badges hydrate
late.

Video id extraction is route-sensitive but not centrally reported.
`extractVideoIdFromCard()` prefers current hrefs for Kids surfaces, scans all
Kids anchors, reads watch/shorts/live/embed hrefs, then falls back to stamped,
dataset, attribute, and selected data-host slots. It does not emit a confidence
class or provenance report.

## File-Local Executable Behavior Proof

`tests/runtime/dom-extractors-method-semantic-register-current-behavior.test.mjs`
now executes `js/content/dom_extractors.js` in a controlled VM harness. The
probes pin current behavior without promoting implementation authority:

```text
recycled no-stamp cleanup proof: executable
cached mismatch restore proof: executable
duration negative-cache proof: executable
channel cache trust proof: executable
related-element handle-source proof: executable
Kids href precedence proof: executable
data-host scanner proof: executable
runtime behavior changed: no
```

| Probe | Current behavior pinned | Risk boundary |
| --- | --- | --- |
| Recycled no-stamp cleanup | A high-risk video card with stale channel/hidden/collaborator/block state and a fresh watch href gets a new `data-filtertube-video-id`; stale FilterTube attributes and `filtertube-hidden` class are removed. | On this no-cached-id cleanup path, `style.display = 'none'` remains untouched. Restore proof is still incomplete for every recycled node. |
| Cached mismatch restore | A high-risk card with an old stamped video id and a fresh watch href gets the new id, stale channel/hide state is removed, and `style.display` is restored from `none` to empty string. | This proves one mismatch branch, not all hidden-state writers or sibling-visible restore paths. |
| Duration negative cache | A miss writes empty `data-filtertube-duration`; later calls return null until a duration indicator appears, then `3:54` is parsed and cached as `234`. | Late-hydration behavior remains a performance/leak boundary until duration provenance and budgets are first-class. |
| Channel cache trust | A stale cached channel handle/id is not trusted when the fresh href is a different `/channel/UC...` identity; stale values are removed, a fresh anchor handle may be rediscovered, and the fresh id is written. | Cached identity still lacks a confidence/provenance report for whitelist and menu authority. |
| Related handle source | With an explicit channel anchor plus unrelated title text, handle extraction uses the channel source rather than an unrelated `@mention` in the title. | This pins one false-handle guard but does not prove every title/byline/card family. |
| Kids href precedence | On YouTube Kids, a current `/watch?v=...` href beats a stale `data-filtertube-video-id` stamp. | Kids/native profile handling still needs sender/profile trust proof outside this extractor. |
| Data-host scanner | `scanDataForVideoId()` and `scanDataForChannelIdentifiers()` return selected shallow video/channel identifiers from structured data. | Scanner coverage remains intentionally shallow and not JSON-first filter authority. |

## Missing Runtime Authorities

The following authorities or reports do not exist in runtime source yet:

- `domExtractorMethodAuthority`
- `domExtractorIdentityConfidenceReport`
- `domExtractorSelectorScopeContract`
- `domExtractorCacheFreshnessContract`
- `domExtractorVideoStampMutationReport`
- `domExtractorChannelMetadataReport`
- `domExtractorDurationCacheBudget`
- `domExtractorInnerTextBudget`
- `domExtractorRecycledNodeRestoreProof`
- `domExtractorFixtureProvenance`

## Required Future Fixture Fields

Before implementation changes rely on this extractor layer, fixtures need:

```text
route
surface
rendererOrDomHost
profileType
listMode
ruleState
inputElementTag
inputHref
inputText
cachedVideoId
extractedVideoId
cachedChannelHandle
cachedChannelId
freshChannelHref
identityConfidenceClass
identityProvenance
videoStampMutation
channelStampMutation
removedStaleAttributes
restoreDisplayProof
durationCacheState
innerTextFallbackUsed
selectorFamily
negativeSiblingVisibleProof
noRuleBudget
performanceBudget
```

## Audit Boundary

This register proves only the current source shape and current behavior
tokens for `js/content/dom_extractors.js`. It does not prove every DOM surface,
every selector target, every cached identity freshness case, every late
duration badge, every recycled node, or every cross-feature hide/restore
interaction. The complete audit remains open.

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
