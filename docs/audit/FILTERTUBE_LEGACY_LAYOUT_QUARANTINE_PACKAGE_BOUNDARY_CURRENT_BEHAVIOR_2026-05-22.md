# FilterTube Legacy Layout Quarantine Package Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior package boundary. Runtime, build, and
packaging behavior are unchanged.

This register promotes `js/layout.js` from method-level legacy layout inventory
to a load, package, web-accessible, runtime-caller, and renderer-inventory
quarantine boundary. The file is tracked product source and is copied into
current browser package directories, but it is not loaded by the current
extension manifests, not exposed through current web-accessible resources, and
not loaded by popup or dashboard HTML.

This is not deletion readiness, reactivation readiness, native/runtime parity
proof, or optimization permission. It is the current behavior boundary before
removing `js/layout.js` from packages, reactivating the legacy layout object,
using renderer inventory rows as active coverage, or treating the old
`.filter-tube-visible` model as a safe hide authority.

## Source And Package Summary

```text
source file: js/layout.js
line count: 680
source bytes: 30604
source sha256: 48831ccdc2d62c75818d9c6a153d7bfacec9d7be9f2408485f74b1a7c13c57c7
global export: window.filterTubeLayout
exported method declarations: 5
selector API sites: 63
unique static selector literals: 52
direct style property writes: 146
style.display writes: 34
filter-tube-visible token occurrences: 32
addEventListener calls: 0
setTimeout calls: 0
setInterval calls: 0
requestAnimationFrame calls: 0
MutationObserver references: 0
fetch calls: 0
build package copy source: build.js COMMON_DIRS includes js
packaged dist copies: 3
dist copies hash-match source: yes
runtime behavior changed: no
```

## Manifest Load And Exposure Boundary

```text
active manifest files checked: 4
active manifest content_script entries checked: 7
active manifest content script JS refs checked: 59
active manifest web_accessible_resources entries checked: 4
active manifest web-accessible resource refs checked: 19
active manifest js/layout.js content script refs: 0
active manifest js/layout.js web-accessible refs: 0
dist manifest files checked: 3
dist manifest content_script entries checked: 5
dist manifest content script JS refs checked: 44
dist manifest web_accessible_resources entries checked: 3
dist manifest web-accessible resource refs checked: 14
dist manifest js/layout.js content script refs: 0
dist manifest js/layout.js web-accessible refs: 0
extension HTML files checked: 2
extension HTML script tags checked: 21
extension HTML js/layout.js script refs: 0
runtime behavior changed: no
```

## Current Manifest And HTML Evidence

| Surface | Files checked | Current `js/layout.js` load state |
| --- | ---: | --- |
| Active manifests | `manifest.json`, `manifest.chrome.json`, `manifest.firefox.json`, `manifest.opera.json` | no content-script load, no web-accessible exposure |
| Dist manifests | `dist/chrome/manifest.json`, `dist/firefox/manifest.json`, `dist/opera/manifest.json` | no content-script load, no web-accessible exposure |
| Extension HTML pages | `html/popup.html`, `html/tab-view.html` | no `<script src="../js/layout.js">` load |
| Package directories | `dist/chrome/js/layout.js`, `dist/firefox/js/layout.js`, `dist/opera/js/layout.js` | present and byte-identical to `js/layout.js` |
| Build script | `build.js` | `COMMON_DIRS` copies the whole `js` directory |

Current web-accessible resource lists expose `js/injector.js`,
`js/filter_logic.js`, `js/seed.js`, `js/shared/identity.js`, and selected icon
resources. They do not expose `js/layout.js`, `js/*`, or `**/*`.

## Runtime Caller And Inventory Boundary

```text
runtime source directories checked for filterTubeLayout callers: js, src, html, website, scripts, data, design
runtime source files with filterTubeLayout tokens: js/layout.js only
non-doc runtime callers of window.filterTubeLayout: 0
docs/youtube_renderer_inventory.md js/layout.js references: 3
watch-card inventory rows depending on layout-fix wording: 3
inventory rows citing js/layout.js: ytd-watch-card-hero-video-renderer, ytd-vertical-watch-card-list-renderer, ytd-watch-card-section-sequence-renderer
website/app/layout.js references in docs are website route references, not extension legacy layout callers
active filtering coverage proven by layout-fix inventory rows: no
runtime behavior changed: no
```

The current renderer inventory still cites `js/layout.js` as layout-fix coverage
for three watch-card renderer rows. Because the file is not loaded by active
manifest or extension HTML surfaces, those rows cannot be used as active
filtering proof. They are deletion blockers until renderer coverage, inventory
wording, package contents, and route fixtures are reconciled.

## Current Behavior Boundaries

```text
js/layout.js remains package burden because it is copied into all current dist browser js directories
js/layout.js remains manifest-inactive because no active or dist content_scripts entry names it
js/layout.js is not web-accessible under the current manifest resource lists
popup and dashboard HTML do not load the legacy layout script
no current non-doc runtime caller reaches window.filterTubeLayout outside js/layout.js itself
renderer inventory still contains three js/layout.js layout-fix claims
packaged but inactive code can be accidentally reactivated by future manifest, loader, native wrapper, or HTML changes
deleting packaged inactive code still needs inventory, package, native/runtime, and fixture proof
the old visible-marker layout model remains a false-hide risk if reactivated
runtime behavior changed: no
```

## Risk Notes

Reliability risk is a split boundary: package artifacts carry the legacy file,
but runtime load surfaces do not currently execute it. Future manifest, HTML,
loader, or native wrapper changes could revive the global layout object without
fresh route/mode/restore proof.

False-hide and leak risk are dormant today but real on reactivation. The legacy
file contains broad renderer selectors, 32 `.filter-tube-visible` token
occurrences, and 34 `style.display` writes. The old marker model is not enough
proof that siblings, recycled nodes, no-rule states, or allow-list states remain
visible.

Performance and code-burden risk come from shipping 30,604 bytes of inactive
legacy source in each current browser package. Cleanup is not a trivial delete:
the package copy rule, dist artifacts, renderer inventory, and possible native
sync assumptions need explicit proof first.

## Future Proof Fields

Each legacy layout quarantine/package decision needs source line, package,
manifest/load, web-accessible, caller, inventory, native/runtime, and fixture
evidence before reactivation, deletion, package cleanup, or renderer-coverage
claims can be trusted:

```text
legacyLayoutQuarantineReference
sourceFile
sourceHash
packageTarget
packageCopyRule
manifestFile
manifestContentScriptState
manifestWebAccessibleState
htmlScriptLoadState
distCopyHash
globalExportName
runtimeCaller
inventoryDependency
rendererCoverageClaim
visibleMarkerPolicy
hideDecisionAuthority
nativeRuntimeParity
reactivationFixture
deletionReadinessProof
packageCleanupProof
```

## Missing Runtime Authorities

These authority/report tokens do not exist in the layout source, build script,
active manifests, dist manifests, or extension HTML pages today:

```text
legacyLayoutQuarantineBoundaryContract
legacyLayoutPackageInclusionReport
legacyLayoutActiveLoadReport
legacyLayoutDistCopyParityReport
legacyLayoutRuntimeCallerReport
legacyLayoutInventoryDependencyReport
legacyLayoutWebAccessiblePolicy
legacyLayoutNativeSyncParityReport
legacyLayoutReactivationFixtureProvenance
legacyLayoutDeletionReadinessArtifact
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
