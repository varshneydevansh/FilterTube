# FilterTube Shared Identity Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/shared/identity.js` from content-helper callable
coverage to a source-derived method inventory. It covers the shared
`FilterTubeIdentity` API, cross-world load boundary, handle and UC id
normalization, custom URL normalization, channel filter index construction,
indexed and direct channel matching, fast HTML identity extraction, and the
current caller/parity risks that can affect false-hide or leak behavior.

This is not completion proof for shared identity authority, caller parity,
name-fallback policy, unicode/encoded-handle fixtures, HTML extraction
provenance, index/direct matching equivalence, cross-runtime load order, or
future simultaneous allow/block semantics. It is a current-behavior boundary
before shared identity, channel matching, resolver, learned-map, whitelist,
menu, DOM fallback, or compiler behavior changes.

## Source-Derived Summary

```text
source file: js/shared/identity.js
line count: 808
IIFE-scoped named function declarations: 22
plain function declarations: 22
async function declarations: 0
const arrow helper declarations: 5
returned arrow helper declarations: 1
arrow token sites: 8
public FilterTubeIdentity API entries: 14
semantic method groups: 6
document literal occurrences: 0
window literal occurrences: 3
self literal occurrences: 3
globalThis literal occurrences: 1
new URL calls: 4
JSON.parse calls: 1
JSON.stringify calls: 0
decodeURIComponent calls: 3
new RegExp calls: 1
new Set calls: 8
new Map calls: 0
Array.isArray calls: 2
try blocks: 9
catch blocks: 9
addEventListener calls: 0
removeEventListener calls: 0
MutationObserver references: 0
setTimeout calls: 0
setInterval calls: 0
fetch calls: 0
runtime sendMessage calls: 0
postMessage calls: 0
Object.assign calls: 1
match calls: 18
replace calls: 24
split calls: 9
trim calls: 11
toLowerCase calls: 6
startsWith calls: 15
includes calls: 6
forEach calls: 1
some calls: 1
test calls: 8
FilterTubeIdentity token occurrences: 5
internal normalizeUcIdForComparison export: absent
browser/global export: root.FilterTubeIdentity = Object.assign(existing, api)
CommonJS export: none
runtime behavior changed: no
```

## Method Group Counts

```text
sharedIdentityCanonicalInput: 6
sharedIdentityDirectFilterMatching: 1
sharedIdentityHandleNormalization: 4
sharedIdentityHtmlFragmentExtraction: 5
sharedIdentityIndexConstruction: 4
sharedIdentityIndexMatching: 2
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `sharedIdentityHandleNormalization` | 4 | Normalizes handle glyphs, strips zero-width marks, decodes percent escapes when possible, extracts raw display handles, and canonicalizes comparison handles to lowercase `@handle`. | Unicode fixture matrix, encoded-handle provenance, whitespace/terminator policy, and caller parity for every fallback implementation. |
| `sharedIdentityCanonicalInput` | 6 | Normalizes UC ids, channel URLs, `@handle` inputs, `/c/` and `/user/` paths, and arbitrary input into typed canonical forms or an `unknown` value. | UC id export policy, route-specific URL fixtures, custom URL case policy, and unknown-input mutation boundaries. |
| `sharedIdentityIndexConstruction` | 4 | Builds Sets for ids, handles, custom URLs, all names, stable names, name-only names, and unresolved handle keys from string/object channel entries plus `channelMap`. | Index schema authority, unresolved-handle action policy, stale map conflict policy, and compiler/UI parity fixtures. |
| `sharedIdentityIndexMatching` | 2 | Matches channel metadata against a prebuilt index, including id, handle, custom URL, map-derived id/handle, name-only names, and stable-name fallback only when metadata has no UC id. | Match decision report, confidence tier, negative sibling-visible fixtures, and no-rule/empty-list budget proof. |
| `sharedIdentityDirectFilterMatching` | 1 | Directly matches one meta/filter pair for object filters, `@handle` strings, custom URL strings, and UC id strings, with map cross-matches and handle/name back-compat. | Direct-vs-index parity, object-name false-hide policy, caller-specific fallback proof, and future allow/block conflict proof. |
| `sharedIdentityHtmlFragmentExtraction` | 5 | Performs regex-based fast identity extraction from bounded HTML/JSON string fragments and assigns owner id, handle, custom URL, and name candidates. | HTML fixture provenance, owner-block confidence, chunk-size budget, regex drift proof, and network/resolver caller authority. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 32 | `function` | `normalizeHandleGlyphs` | `sharedIdentityHandleNormalization` |
| 46 | `function` | `extractRawHandle` | `sharedIdentityHandleNormalization` |
| 92 | `function` | `normalizeHandleValue` | `sharedIdentityHandleNormalization` |
| 114 | `function` | `normalizeHandleForComparison` | `sharedIdentityHandleNormalization` |
| 119 | `function` | `normalizeUcIdForComparison` | `sharedIdentityCanonicalInput` |
| 133 | `function` | `isUcId` | `sharedIdentityCanonicalInput` |
| 147 | `function` | `canonicalizeChannelInput` | `sharedIdentityCanonicalInput` |
| 191 | `function` | `collectHandleVariants` | `sharedIdentityIndexConstruction` |
| 209 | `function` | `normalizeChannelNameForComparison` | `sharedIdentityIndexConstruction` |
| 214 | `function` | `normalizeCustomUrlForComparison` | `sharedIdentityCanonicalInput` |
| 241 | `function` | `getChannelMapLookup` | `sharedIdentityIndexConstruction` |
| 254 | `function` | `buildChannelFilterIndex` | `sharedIdentityIndexConstruction` |
| 372 | `function` | `channelMetaMatchesIndex` | `sharedIdentityIndexMatching` |
| 424 | `function` | `channelMatchesFilter` | `sharedIdentityDirectFilterMatching` |
| 588 | `function` | `extractCustomUrlFromPath` | `sharedIdentityCanonicalInput` |
| 613 | `function` | `extractChannelIdFromPath` | `sharedIdentityCanonicalInput` |
| 619 | `function` | `decodeJsonStringFragment` | `sharedIdentityHtmlFragmentExtraction` |
| 632 | `function` | `readJsonStringField` | `sharedIdentityHtmlFragmentExtraction` |
| 639 | `function` | `assignOwnerBlockIdentity` | `sharedIdentityHtmlFragmentExtraction` |
| 670 | `function` | `fastExtractIdentityFromHtmlChunk` | `sharedIdentityHtmlFragmentExtraction` |
| 742 | `function` | `assignCanonicalPathIdentity` | `sharedIdentityHtmlFragmentExtraction` |
| 773 | `function` | `isChannelBlocked` | `sharedIdentityIndexMatching` |

## Local Helper And Callback Inventory

| Source line | Name | Kind | Owner |
| ---: | --- | --- | --- |
| 194 | `addHandle` | local const arrow helper | `collectHandleVariants` |
| 242 | `(key) =>` | returned arrow helper | `getChannelMapLookup` |
| 267 | `addId` | local const arrow helper | `buildChannelFilterIndex` |
| 275 | `addHandle` | local const arrow helper | `buildChannelFilterIndex` |
| 296 | `addCustomUrl` | local const arrow helper | `buildChannelFilterIndex` |
| 304 | `addName` | local const arrow helper | `buildChannelFilterIndex` |
| 657 | `path =>` | inline `forEach` callback | `assignOwnerBlockIdentity` |
| 779 | `filterChannel =>` | inline `some` callback | `isChannelBlocked` |

## Public API Entries

```text
extractRawHandle
normalizeHandleValue
normalizeHandleForComparison
normalizeChannelNameForComparison
normalizeCustomUrlForComparison
isUcId
canonicalizeChannelInput
buildChannelFilterIndex
channelMetaMatchesIndex
channelMatchesFilter
isChannelBlocked
extractCustomUrlFromPath
extractChannelIdFromPath
fastExtractIdentityFromHtmlChunk
```

`normalizeUcIdForComparison` is currently internal only. `js/state_manager.js`
probes `window.FilterTubeIdentity?.normalizeUcIdForComparison`, but the shared
API does not export that method today; current behavior falls through to its
local path when the optional probe is absent.

## Current Entrypoints And Dependencies

```text
Chrome MV3 background path: js/background.js importScripts('shared/identity.js') when globalThis.FilterTubeIdentity is absent
Firefox background path: manifest.firefox.json loads js/shared/identity.js before js/background.js
isolated content path: manifest.json and manifest.firefox.json load js/shared/identity.js before content/menu, dom_helpers, dom_extractors, dom_fallback, block_channel, bridge_settings, handle_resolver, collab_dialog, prompts, and content_bridge
main-world availability path: manifest web_accessible_resources includes js/shared/identity.js for injection callers
root selection: window, then self, then globalThis
existing object behavior: Object.assign(existing, api) preserves extra existing keys and overwrites API keys
DOM ownership: none
listener ownership: none
observer ownership: none
timer ownership: none
network ownership: none
storage ownership: none
runtime message ownership: none
```

## Current Caller Surface

```text
js/background.js: normalizeHandleValue, canonicalizeChannelInput, extractChannelIdFromPath, extractCustomUrlFromPath, fastExtractIdentityFromHtmlChunk
js/filter_logic.js: extractRawHandle, buildChannelFilterIndex, channelMetaMatchesIndex, extractCustomUrlFromPath, channelMatchesFilter
js/content_bridge.js: channelMatchesFilter
js/content/dom_fallback.js: normalizeHandleForComparison, channelMatchesFilter
js/content/handle_resolver.js: extractRawHandle, normalizeHandleValue
js/content/block_channel.js: extractChannelIdFromPath, extractRawHandle
js/injector.js: extractRawHandle, extractCustomUrlFromPath, extractChannelIdFromPath
js/state_manager.js: optional normalizeUcIdForComparison probe plus isUcId
```

Several callers still keep local fallback implementations for handle, UC id,
custom URL, channel match, or DOM identity behavior. The shared API is therefore
not a sole identity authority yet.

## Current Behavior Boundaries

```text
encoded zero-width handles: extractRawHandle('https://youtube.com/@Some%E2%80%8BHandle/videos') returns @SomeHandle
plain strings: normalizeHandleValue('plain') returns ''
UC-shaped strings: normalizeHandleValue('UC1234567890123456789012') returns ''
whitespace handles: normalizeHandleValue('@Some Handle') returns @some because extraction stops at whitespace before later whitespace removal
canonical UC URL: canonicalizeChannelInput('https://www.youtube.com/channel/UC1234567890123456789012') returns { type: 'ucid', value: 'UC1234567890123456789012' }
canonical handle URL: canonicalizeChannelInput('youtube.com/@SomeHandle/videos') returns { type: 'handle', value: '@somehandle' }
unknown canonical input: canonicalizeChannelInput('custom text') returns { type: 'unknown', value: 'custom text' }
custom URL normalization: normalizeCustomUrlForComparison('https://www.youtube.com/c/SomeName?x=1') returns c/somename
path extraction case: extractCustomUrlFromPath('/user/Foo/') returns user/Foo
indexed stable-name guard: channelMetaMatchesIndex does not match a stable filter name when metadata already has a different UC id
direct object-name behavior: channelMatchesFilter can match an object filter by equal name even when filter id and metadata id differ
name-only index behavior: buildChannelFilterIndex plus channelMetaMatchesIndex can match a string name-only entry by metadata name
direct string-name behavior: channelMatchesFilter does not match a plain string name-only entry by metadata name
HTML extraction: fastExtractIdentityFromHtmlChunk returns null unless it finds id, handle, or customUrl
```

## Future Proof Fields

Each shared-identity method row must eventually be backed by source line,
fixture, caller path, and observed positive/negative effect before identity,
matching, whitelist, learned-map, resolver, compiler, or menu behavior changes
can claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
callerFile
runtimeWorld
routeSurface
settingsMode
listMode
profileTarget
filterEntryShape
metadataShape
channelMapShape
normalizedHandle
normalizedUcId
customUrl
nameFallbackClass
matchDecision
matchConfidence
indexDecision
directDecision
parityOutcome
htmlChunkSource
regexPath
sourceFamilyProvenance
negativeFixture
positiveFixture
falseHideRisk
leakRisk
noRuleBudget
unknownInputPolicy
loadOrderProof
callerFallbackProof
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source today:

```text
sharedIdentityMethodAuthority
sharedIdentityApiManifest
sharedIdentityNormalizationContract
sharedIdentityMatchDecisionReport
sharedIdentityIndexParityReport
sharedIdentityCallerParityReport
sharedIdentityHtmlExtractionProvenance
sharedIdentityNameFallbackPolicy
sharedIdentityUnicodeFixtureProvenance
sharedIdentityLoadOrderContract
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
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
