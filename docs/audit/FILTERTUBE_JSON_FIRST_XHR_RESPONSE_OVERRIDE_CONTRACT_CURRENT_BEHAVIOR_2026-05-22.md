# FilterTube JSON-First XHR Response Override Contract - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior changed for no-work gating.
This is not an implementation patch, optimization patch, XHR patch, or
permission to change YouTubei transport behavior.

## Purpose

This register isolates the XHR response mutation surface that JSON-first
filtering would have to own before XHR transport can be first-class behavior.
The current XHR path marks endpoint-like requests in `open()` and `send()`,
then later parses body data and installs per-instance `response` /
`responseText` getters only after a ready-state or load callback runs.

The current boundary is:

```text
XHR marking and hook installation happen before the late body-processing
guards. Response mutation is page-visible only through per-instance getters
installed after processing succeeds.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_PAGE_GLOBAL_PATCH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md`

## Current Counts

```text
source files with XHR response override surface: 1
XHR endpoint entries: 5
XHR mark sites before body guards: 2, now gated by no-work bypass
send-time ready/load hook installs: 2
listener wrapper hook sites: 2
response processor definitions: 1
pre-parse guard branches: 7
response body parse modes: 2
text JSON.parse sites: 1
processWithEngine XHR callsites: 1
modified response backing fields: 2
per-instance response getter override sites: 2
response getter return branches after mutation: 3
fallback prototype getter branches: 2
responseProcessed terminal write sites: 1
text response override positive fixtures: 1
json response override positive fixtures: 1
late guard no-mutation fixtures: 5
listener wrapper invocation fixtures: 1
runtime behavior changed: yes; missing-settings, disabled, and no-active-JSON-work XHRs now bypass mark, hooks, parse, stringify, and override work
not completion proof for JSON-first XHR response override authority
```

## XHR Override Inventory

| Surface | Source anchor | Current behavior | Current risk | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Listener wrapper | `js/seed.js:790` through `js/seed.js:803` | Wraps function listeners for `readystatechange` and `load` only when the XHR is already marked. | Listener wrapping is lifecycle work separate from actual body mutation. | One listener budget tied to endpoint and active-rule decision. |
| Response processor | `js/seed.js:813` through `js/seed.js:822` | Exits for missing XHR, already processed, unmarked, not ready, no settings, disabled settings, or status >= 400. | Missing settings and disabled settings now bypass earlier mark/hook work; these late guards still protect active marked XHRs. | Pre-hook no-work authority and negative fixtures. |
| Body parse mode | `js/seed.js:831` through `js/seed.js:843` | Accepts `responseType === "json"` object responses and text-like JSON-looking response bodies. | Unsupported types and malformed JSON silently pass through without a report. | Body-mode decision records and parse failure reason. |
| Engine call | `js/seed.js:851` and `js/seed.js:852` | Reconstructs URL string from `__filtertube_url` and calls `processWithEngine(jsonData, "xhr:<pathname>")`. | Parsed endpoint policy and mutation permission are not shared with fetch. | Shared endpoint and mutation decision. |
| Backing fields | `js/seed.js:854` and `js/seed.js:855` | Stores modified object and stringified modified body on the XHR instance. | The original page-visible fields are replaced through local private fields. | Response body and compatibility contract. |
| Getter installation guard | `js/seed.js:857` and `js/seed.js:858` | Getter overrides install once per XHR instance after successful mutation. | No teardown or owner registry records the per-instance patch. | Patch owner, lifetime, and compatibility proof. |
| `response` getter | `js/seed.js:863` through `js/seed.js:872` | Returns modified object for `json`, modified text for text-like response types, modified object for other types after mutation, or prototype getter fallback. | Page-visible `response` type changes by `responseType`. | Caller compatibility proof for every response type. |
| `responseText` getter | `js/seed.js:878` through `js/seed.js:884` | Returns modified text after mutation, otherwise prototype getter fallback or empty string. | Text readers always receive the stringified modified object. | Page read-order and responseText compatibility fixtures. |
| Processed marker | `js/seed.js:893` | Marks the XHR processed only after mutation and getter installation. | No report records why an XHR was skipped or mutated. | Pass-through and mutation reason registry. |
| Send-time hooks | `js/seed.js:961` and `js/seed.js:962` | Installs ready-state and load hooks only after send confirms the XHR should process. | Missing settings, disabled settings, and no active JSON work avoid these hooks entirely. | Hook budget should be derived from one endpoint and active-work decision. |

## Source-Derived Rows

```text
xhrEndpoints(5): /youtubei/v1/search,/youtubei/v1/guide,/youtubei/v1/browse,/youtubei/v1/next,/youtubei/v1/player
xhrPreBodyMarkSites(2): openShouldProcess,sendShouldProcess
xhrReadyLoadHookInstalls(2): readystatechange,load
xhrListenerWrapperSites(2): addEventListenerWrapper,removeEventListenerWrapper
xhrPreParseGuards(7): missingXhr,alreadyProcessed,notMarked,notReady,noSettings,disabled,errorStatus
xhrBodyParseModes(2): responseType-json,responseType-empty-or-text
xhrBodyGuardBranches(6): jsonNonObject,textMissingOrNonString,textNotJsonLooking,textParseFailure,unsupportedResponseType,processedNonObject
xhrMutationBackingFields(2): __filtertube_modifiedResponse,__filtertube_modifiedResponseText
xhrGetterOverrideSites(2): response,responseText
xhrResponseGetterBranches(3): jsonReturnsObject,textReturnsString,otherReturnsObject
xhrFallbackGetterBranches(2): protoGetterFallback,emptyOrUndefinedFallback
runtimePositiveOverrideFixtures(2): textResponseOverride,jsonResponseOverride
runtimeNoMutationFixtures(5): noSettings,disabled,errorStatus,invalidJson,unsupportedResponseType
runtimeListenerWrapperFixtures(1): markedLoadListenerProcessesBeforePageListener
```

Anchor map:

```text
listenerWrapperStart: `js/seed.js:790`
listenerWrapperReadyLoadGate: `js/seed.js:802`
listenerWrapperProcessCall: `js/seed.js:803`
ensureXhrResponseProcessedStart: `js/seed.js:813`
alreadyProcessedGuard: `js/seed.js:815`
notMarkedGuard: `js/seed.js:816`
notReadyGuard: `js/seed.js:817`
noSettingsGuard: `js/seed.js:818`
disabledGuard: `js/seed.js:819`
statusGuard: `js/seed.js:822`
responseTypeRead: `js/seed.js:831`
jsonResponseMode: `js/seed.js:834`
textResponseMode: `js/seed.js:837`
responseTextRead: `js/seed.js:838`
trimmedJsonShapeGuard: `js/seed.js:841`
textJsonParse: `js/seed.js:843`
xhrProcessWithEngine: `js/seed.js:851`
processedObjectGuard: `js/seed.js:852`
modifiedResponseField: `js/seed.js:854`
modifiedResponseTextField: `js/seed.js:855`
getterInstallGuard: `js/seed.js:857`
getterInstallMarker: `js/seed.js:858`
protoResponseDescriptor: `js/seed.js:860`
protoResponseTextDescriptor: `js/seed.js:861`
responseGetterOverride: `js/seed.js:863`
responseGetterModifiedBranch: `js/seed.js:866`
responseGetterJsonReturn: `js/seed.js:868`
responseGetterTextReturn: `js/seed.js:869`
responseGetterOtherReturn: `js/seed.js:870`
responseGetterFallback: `js/seed.js:872`
responseTextGetterOverride: `js/seed.js:878`
responseTextGetterModifiedBranch: `js/seed.js:881`
responseTextGetterModifiedReturn: `js/seed.js:882`
responseTextGetterFallback: `js/seed.js:884`
responseProcessedTerminalWrite: `js/seed.js:893`
sendReadyStateHook: `js/seed.js:961`
sendLoadHook: `js/seed.js:962`
```

## Current XHR Override Risks

- XHR `open()` and `send()` no longer mark or install lifecycle hooks for
  missing settings, disabled settings, or no active JSON work.
- When active JSON work exists, XHR `open()` and `send()` can still mark and
  install lifecycle hooks before late body guards decide status, parseability,
  and response type.
- Text-like XHR responses receive a string from both `response` and
  `responseText` after mutation; JSON responseType receives an object from
  `response` and a string from `responseText`.
- Unsupported response types pass through until a prior mutation exists, but the
  getter code still has an "other" branch after mutation.
- Parse failures, unsupported types, disabled settings, no settings, and error
  statuses silently return without mutation or pass-through reason records.
- Getter overrides are per-instance, installed after mutation, and have no
  teardown registry.
- Page listeners wrapped through `addEventListener()` can observe already
  modified response values because processing runs before the page listener.
- Fetch and XHR still do not share one response mutation authority.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
text responseType empty: load hook parses responseText, calls processWithEngine, installs getters, response returns string, responseText returns string
json responseType: load hook reads response object, calls processWithEngine, installs getters, response returns object, responseText returns string
no settings: matching XHR bypasses mark, hooks, parse, stringify, and mutation fields
disabled settings: matching XHR bypasses mark, hooks, parse, stringify, and mutation fields
status >= 400: matching XHR is marked and hookable but no mutation fields are installed
invalid JSON text: parse failure avoids mutation fields and processed marker
unsupported responseType: body processing returns without mutation fields
marked load listener: processing runs before the page listener reads responseText
```

## Future Proof Shape

A future XHR response override contract should contain at least:

```text
transport
endpoint
parsedPathname
rawUrl
route
surface
profileType
listMode
settingsRevision
activeRuleState
listenerHookAllowed
bodyParseAllowed
mutationAllowed
responseType
readyState
status
responseBeforeType
responseTextBeforeSize
parseSucceeded
parseFailureReason
processedValueType
responseGetterReturnType
responseTextGetterReturnType
prototypeGetterFallbackPolicy
pageListenerReadOrder
overrideInstallAllowed
overrideLifetime
passThroughReason
textResponseFixture
jsonResponseFixture
disabledFixture
noSettingsFixture
errorStatusFixture
invalidJsonFixture
unsupportedResponseTypeFixture
listenerOrderFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstXhrResponseOverrideContract
jsonFirstXhrResponseOverrideDecision
jsonFirstXhrBodyModeReport
jsonFirstXhrGetterCompatibilityReport
jsonFirstXhrListenerOrderReport
jsonFirstXhrPassThroughReason
jsonFirstXhrOverrideLifetimeRegistry
jsonFirstXhrResponseOverrideFixtureProvenance
jsonFirstXhrResponseOverrideMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-xhr-response-override-contract-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this XHR response override contract can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
