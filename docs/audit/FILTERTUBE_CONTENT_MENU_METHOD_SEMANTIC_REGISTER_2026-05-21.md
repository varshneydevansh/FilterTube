# FilterTube Content Menu Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content/menu.js` from helper-count coverage to a
source-derived method inventory. It covers the isolated-world content menu
helper file that escapes HTML for menu templates and injects the shared
FilterTube menu CSS used by `js/content_bridge.js`.

This is not completion proof for menu affordance authority, load-order
ownership, style scope, theme parity, block/allow vocabulary, native menu
surface coverage, duplicate injection behavior, disabled/no-rule budgets, style
teardown, or future simultaneous allow/block semantics. It is a
current-behavior boundary before menu helper, menu style, escaping, load-order,
or content-script global sharing changes.

## Source-Derived Summary

```text
source file: js/content/menu.js
line count: 309
source bytes: 12913
source sha256: cd7cbfb240ea39174cb395a67e42ddb117feaf05e896773164a2c409ab21e1bc
repo-wide broad parser lexical callable matches: 3
runtime function declarations: 2
control-flow lexical artifacts: 1
file-local executable behavior rows: 2
global method proof count promoted: 0
named function declarations in scope: 2
plain function declarations: 2
async function declarations: 0
const helper/callback declarations: 0
module-scoped state declarations: 1
arrow callback sites in scope: 0
semantic method groups: 2
document literal occurrences: 3
window literal occurrences: 0
location literal occurrences: 0
document.querySelector calls: 0
document.querySelectorAll calls: 0
element querySelector calls: 0
element querySelectorAll calls: 0
closest calls: 0
matches calls: 0
document.createElement calls: 1
document.documentElement references: 1
addEventListener calls: 0
removeEventListener calls: 0
MutationObserver references: 0
observe calls: 0
disconnect calls: 0
setTimeout calls: 0
clearTimeout calls: 0
setInterval calls: 0
clearInterval calls: 0
requestAnimationFrame calls: 0
cancelAnimationFrame calls: 0
innerHTML references: 0
textContent references: 1
setAttribute calls: 0
removeAttribute calls: 0
appendChild calls: 1
remove calls: 0
postMessage calls: 0
chrome.runtime references: 0
fetch calls: 0
JSON.parse calls: 0
JSON.stringify calls: 0
.replace calls: 5
String calls: 1
styleTag.id assignments: 1
filterTubeMenuStylesInjected references: 3
styleContent references: 2
filtertube-menu-item selector token occurrences: 21
filtertube-block-channel-item selector token occurrences: 31
filtertube-modern-bottom-sheet-item selector token occurrences: 9
filtertube-filter-all-toggle selector token occurrences: 14
filtertube-collab-selected selector token occurrences: 17
filtertube-pending selector token occurrences: 2
filtertube-multistep-ready selector token occurrences: 4
html[dark="true"] selector token occurrences: 10
html[dark]:not([dark="false"]) selector token occurrences: 10
html[data-theme="dark"] selector token occurrences: 10
html[dark="false"] selector token occurrences: 4
!important declarations: 114
browser/global export: implicit isolated-world load-order helpers
CommonJS export: none
runtime behavior changed: no
```

## Method Group Counts

```text
contentMenuHtmlEscaping: 1
contentMenuStyleInjection: 1
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `contentMenuHtmlEscaping` | 1 | Converts caller-provided values to strings and replaces `&`, `<`, `>`, `"`, and `'` before `content_bridge` uses the result in menu HTML templates. | Caller input provenance, complete escaping policy, template insertion inventory, attribute-versus-text context proof, and negative injection fixtures. |
| `contentMenuStyleInjection` | 1 | Uses a module-scoped boolean guard, creates one `<style id="filtertube-menu-styles">`, writes a broad menu CSS block with `textContent`, appends it to `document.documentElement`, and never removes it. | Load-order contract, style scope owner, duplicate/removal behavior, dark/light theme parity, native menu surface proof, vocabulary migration policy, and teardown/no-rule budget proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 10 | `function` | `escapeHtml` | `contentMenuHtmlEscaping` |
| 25 | `function` | `ensureFilterTubeMenuStyles` | `contentMenuStyleInjection` |

## Lexical Callable Reconciliation

The repo-wide callable parser intentionally uses a broad JavaScript regex so it
can catch top-level declarations, object-method shorthand, and generated output
without requiring a full parser. For `js/content/menu.js`, that broad parser
currently reports 3 lexical callable matches:

| Broad parser match | Runtime callable? | Source fact | Semantic interpretation |
| --- | --- | --- | --- |
| `escapeHtml` | yes | `function escapeHtml(str = '')` | Real file-local helper. It is pure string escaping and has no DOM, storage, message, network, listener, observer, timer, or settings side effect. |
| `ensureFilterTubeMenuStyles` | yes | `function ensureFilterTubeMenuStyles()` | Real file-local helper. It appends one style node per isolated-world runtime through a module boolean guard. |
| `if` | no | `if (filterTubeMenuStylesInjected) {` inside `ensureFilterTubeMenuStyles()` | Control-flow artifact from the broad method-shorthand branch, not a behavior-changing callable. It remains part of the current 5,701 lexical count until the repo-wide proof layer has a callable-kind classifier. |

This file-local reconciliation reduces ambiguity for `js/content/menu.js`, but
it does not promote the global method proof count. The repo-wide index still
pins 0 complete per-callable semantic files because the audit has not yet
reconciled broad-parser artifacts across all 69 tracked JS/JSX/MJS files.

## File-Local Executable Behavior Rows

| Method | Owner / source | Trigger and caller class | Inputs and mode state | Route / surface scope | Observable effects | Disabled / no-rule behavior | Teardown / idempotence | Current executable proof | Remaining blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `escapeHtml` | Isolated content-menu helper at `js/content/menu.js:10` | Called by `js/content_bridge.js` placeholder template builders for collaborator placeholder rows. | One optional string-ish value. No settings, profile, list-mode, route, or lock input is read in this helper. | FilterTube menu placeholder HTML inside YouTube native menu structures. | Returns a string with `&`, `<`, `>`, `"`, and `'` escaped. No DOM mutation, no storage, no message, no network, no listener, no observer, no timer. | Not settings-aware. It only runs when a caller is already building a placeholder row. | Pure/idempotent for the same input; no teardown. | Runtime fixture evaluates the function and proves `&<>"'` becomes `&amp;&lt;&gt;&quot;&#39;`. | Attribute-context escaping, full template insertion inventory, and spoof/hostile-label fixtures remain missing. |
| `ensureFilterTubeMenuStyles` | Isolated content-menu helper at `js/content/menu.js:25` | Called by `js/content_bridge.js` playlist fallback and new/old menu injection paths. | No explicit arguments. Reads only the module boolean `filterTubeMenuStylesInjected` and global `document`. | YouTube menu popup/listbox containers plus FilterTube menu classes and mobile bottom-sheet classes. | Creates a `<style>` node, assigns id `filtertube-menu-styles`, writes the CSS block by `textContent`, appends to `document.documentElement`, and flips the module boolean. | Not settings-aware. Disabled, whitelist, no-rule, and hidden-affordance gating belongs to callers, not this helper. | Boolean-only idempotence inside one isolated-world runtime; no DOM duplicate check if the style node is removed; no teardown path. | Runtime fixture calls the function twice with a stub document and proves one append with the expected id and CSS tokens. | CSS scope, native menu side effects, dark/light theme parity, block/allow vocabulary, duplicate-DOM recovery, and teardown/no-rule budget fixtures remain missing. |

## File-Local Executable Behavior Proof

The current verifier executes `js/content/menu.js` in a VM context with a stub
`document` and no extension APIs. It proves these current behaviors without
changing runtime source:

| Probe | Current executable proof | Risk boundary |
| --- | --- | --- |
| Escaping dangerous characters | `escapeHtml('&<>"'')` returns `&amp;&lt;&gt;&quot;&#39;`, `escapeHtml()` returns an empty string, and an already-escaped value is escaped again as `&amp;lt;`. | This is HTML escaping only. It does not prove attribute-context safety, caller template safety, or hostile menu-label provenance. |
| DOM side-effect isolation | The escaping helper runs in the same VM context as the style helper and does not create, append, message, store, fetch, listen, observe, or schedule work. | Caller-owned template insertion remains outside this file-local proof. |
| First style injection | `ensureFilterTubeMenuStyles()` creates exactly one `style` element with id `filtertube-menu-styles`, writes CSS through `textContent`, and appends it to `document.documentElement`. | The helper owns a global menu CSS side effect but not menu action eligibility, settings gating, or route gating. |
| Duplicate call | A second `ensureFilterTubeMenuStyles()` call in the same isolated-world VM appends no second node because the module boolean is set. | Idempotence is boolean-only and runtime-local. It is not a DOM inventory proof. |
| Removed-node call | If the appended node is removed outside the helper, a later call still appends no replacement because there is no DOM lookup by id. | There is no teardown or duplicate-DOM recovery contract today. |
| CSS token surface | The appended text includes desktop menu containers, FilterTube item classes, bottom-sheet classes, pending/blocked/collab states, and dark/light selectors. | CSS scope, theme parity, native menu visual parity, block/allow vocabulary migration, and no-rule visual budget remain future proof work. |

## Current Entrypoints And Dependencies

```text
module entrypoint: manifest-loaded isolated-world content script before content_bridge.js
manifest load order: js/shared/identity.js, js/content/menu.js, js/content/dom_helpers.js, js/content/dom_extractors.js, js/content/dom_fallback.js, js/content/block_channel.js, js/content/bridge_injection.js, js/content/bridge_settings.js, js/content/handle_resolver.js, js/content/collab_dialog.js, js/content/release_notes_prompt.js, js/content/first_run_prompt.js, js/content_bridge.js
explicit export path: none
implicit helper consumers: js/content_bridge.js calls escapeHtml(...) and ensureFilterTubeMenuStyles()
style injection guard: filterTubeMenuStylesInjected boolean only
style tag id: filtertube-menu-styles
style host: document.documentElement
style write path: styleTag.textContent = styleContent
style append path: document.documentElement.appendChild(styleTag)
style teardown path: none
duplicate DOM check: none beyond filterTubeMenuStylesInjected
listener ownership: none
observer ownership: none
timer ownership: none
network ownership: none
runtime message ownership: none
HTML helper behavior: String(str).replace(&).replace(<).replace(>).replace(").replace(')
primary menu CSS families: filtertube-menu-item, filtertube-menu-title, filtertube-menu-label, filtertube-channel-name, filtertube-filter-all-toggle
state CSS families: filtertube-block-channel-item, filtertube-blocked, filtertube-pending, filtertube-collab-selected, filtertube-multistep-ready
native/mobile CSS families: filtertube-modern-bottom-sheet-item and menu-item-button
theme CSS families: html[dark="true"], html[dark]:not([dark="false"]), html[data-theme="dark"], html[dark="false"]
```

## Future Proof Fields

Each content-menu method row must eventually be backed by source line, fixture,
caller path, and observed success/failure effect before menu helper, menu CSS,
escaping, content-script load-order, or affordance styling behavior changes can
claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
callerSurface
routeSurface
settingsMode
listMode
profileTarget
contentScriptWorld
loadOrderOwner
styleScope
styleSelector
htmlInput
htmlOutput
escapingPolicy
domMutationEffect
styleTagId
styleInjectionState
themeMode
visualVocabulary
menuStructure
nativeMenuScope
lifecyclePrimitive
teardownPolicy
duplicateInjectionPolicy
noRuleBudget
negativeFixture
positiveFixture
sourceFamilyProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source today:

```text
contentMenuMethodAuthority
contentMenuStyleInjectionContract
contentMenuHtmlEscapingContract
contentMenuStyleScopeReport
contentMenuLoadOrderContract
contentMenuThemeParityReport
contentMenuTeardownRegistry
contentMenuFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
