# FilterTube Background Script Injection Trust Boundary - Current Behavior Audit (2026-05-23)

Status: audit-only.

Runtime behavior is unchanged. This is not an implementation patch.

This slice records the current boundary between isolated content startup code and
background-mediated script injection. It is relevant to recent whitelist/list-mode
work because JSON-first filtering depends on predictable startup, trusted settings
delivery, and clear ownership for any script that can affect page-world filtering.

runtime background script injection trust fixtures: 8

## Evidence Inputs

- `js/background.js`
  - lines: 6641
  - bytes: 298986
  - sha256: `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd`
- `js/content/bridge_injection.js`
  - lines: 127
  - bytes: 4741
  - sha256: `d1b84cf4c43ec5ff5cdc3bd607d8f3d3bf448c12829780b0d05fb9fc14fb5d3e`
- Manifest scripting permission carriers: 4 browser manifests.

## Selected Source Metrics

- background lines: 6641
- background bytes: 298986
- bridge_injection lines: 127
- bridge_injection bytes: 4741
- injectScripts block lines: 47
- injectScripts block bytes: 1612
- subscriptions bridge block lines: 33
- subscriptions bridge block bytes: 1207
- injectViaScriptingAPI block lines: 14
- injectViaScriptingAPI block bytes: 505
- injectViaFallback block lines: 23
- injectViaFallback block bytes: 904
- injectMainWorldScripts block lines: 46
- injectMainWorldScripts block bytes: 1752
- selected injectScripts tokens: 4
- selected request.scripts tokens: 1
- selected sender tab tokens: 1
- selected sender frame tokens: 1
- selected executeScript tokens: 5
- selected world MAIN tokens: 1
- selected world ISOLATED tokens: 1
- selected isTrustedUiSender tokens: 0
- selected allowlist tokens: 0
- selected sender url tokens: 0
- selected tabs.get tokens: 0
- selected tabs.query tokens: 0
- selected youtube host tokens: 0
- selected sendResponse success tokens: 3
- selected sendResponse failure tokens: 6
- selected return true tokens: 2
- selected return false tokens: 5
- selected frameIds tokens: 1
- selected tabId tokens: 8
- selected files tokens: 4
- selected setTimeout tokens: 2

## Current Behavior Proven

### Bridge Request Path

`js/content/bridge_injection.js` builds `scriptsToInject` as
`shared/identity`, `filter_logic`, optional Firefox `seed`, and `injector`.
On Chromium-like paths where `api.scripting?.executeScript` exists, it calls
`injectViaScriptingAPI(scriptsToInject)`. That function sends a background
message with `action: "injectScripts"` and `scripts: scripts`.

Fallback injection remains DOM-script based: it creates script elements from
`api.runtime.getURL(\`js/${scriptName}.js\`)`, appends them to
`document.head || document.documentElement`, and spaces loads with a fixed
50 ms timer.

### Background `injectScripts`

The background listener accepts `request.action === "injectScripts"`. It derives
the target from `Number(sender?.tab?.id)` and `Number(sender?.frameId)`, trims
caller-provided `request.scripts`, maps each name to either the existing `js/`
path or `js/${scriptName}.js`, and calls:

```text
browserAPI.scripting.executeScript({ target, files, world: 'MAIN' })
```

The branch fails if no sender tab exists or if the scripting API is unavailable.
An empty normalized file list returns `{ success: true }` without executing
scripts. A non-empty file list responds asynchronously and returns `true`.

Current normalization does not reject unclassified path shapes before
`executeScript`; for example, `../unexpected` maps to `js/../unexpected.js`
before browser-side loading decides the result. The branch also has no local
trusted UI sender guard, script allowlist, sender URL check, host route check,
manifest resource reason check, nonce, or caller capability token.

### Subscriptions Bridge Injection

`FilterTube_EnsureSubscriptionsImportBridge` is a separate background injection
branch. It takes `Number(request?.tabId)`, requires `browserAPI.scripting`,
and injects a fixed isolated-world file list:

- `js/shared/identity.js`
- `js/content/dom_helpers.js`
- `js/content/dom_extractors.js`
- `js/content/dom_fallback.js`
- `js/content/bridge_injection.js`
- `js/content/bridge_settings.js`

This branch uses `world: 'ISOLATED'` and `target: { tabId }`. It does not derive
the tab from `sender.tab.id`, does not preserve `sender.frameId`, and does not
check sender URL, route, host, or trusted UI sender state.

## Risk Register

- Reliability: startup depends on a message-mediated file list and browser
  loading errors instead of a named script injection policy.
- False-hide/leak: a failed or mis-targeted injection can leave page-world
  identity/filter logic absent while isolated fallback and settings paths keep
  running.
- Performance: repeated injection requests can reach `executeScript` without a
  shared budget or caller ownership report.
- Code burden: script names, manifest permission use, web-accessible resource
  exposure, and startup readiness are proved in separate files instead of a
  single injection contract.
- Message trust: this path sits beside guarded UI mutations, but the selected
  injection branches are not gated by `isTrustedUiSender`.

## Optimization And JSON-First Relevance

This codebase inspection is finding optimization locations and blockers for
making JSON filtering a first-class path. The current slice shows that before
optimizing recent whitelist/list-mode behavior, the startup and script-injection
authority still needs explicit proof: whitelist correctness can be undermined by
missing page-world filter logic, duplicate injection work, or inconsistent script
readiness across content bridge and fallback paths.

## Missing Authority

No `backgroundScriptInjectionTrustContract`,
`backgroundInjectScriptsAllowedScriptReport`,
`backgroundInjectScriptsSenderClassReport`,
`backgroundInjectScriptsTargetScopeReport`,
`backgroundInjectScriptsWorldPolicy`,
`backgroundSubscriptionsBridgeInjectionPolicy`,
`backgroundScriptingPermissionOwnerReport`,
`backgroundScriptInjectionFixtureProvenance`,
`backgroundScriptInjectionMetricArtifact`, or
`backgroundScriptInjectionWebAccessibleResourceReason` exists in product runtime
source yet.

## Boundary

This is not completion proof for background script injection trust authority.
It only pins current behavior so later optimization, whitelist, startup, and
first-class JSON filter work cannot accidentally treat the current injection
surface as audited implementation permission.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
