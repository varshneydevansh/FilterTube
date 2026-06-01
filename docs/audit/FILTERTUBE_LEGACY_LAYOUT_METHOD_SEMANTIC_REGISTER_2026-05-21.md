# FilterTube Legacy Layout Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime, build, and packaging
behavior are unchanged.

This register promotes `js/layout.js` from a quarantined legacy-layout marker to
a source-derived method, selector, visual side-effect, manifest, and package
quarantine inventory. The file is tracked and copied into current `dist`
browser package directories through the broad `js` directory package copy, but
it is not listed in the active browser manifests as a content script.

This is not completion proof for layout cleanup, deletion readiness, native sync
parity, renderer coverage, or safe reactivation. It is a current-behavior
boundary before changing `js/layout.js`, treating layout-only inventory rows as
active coverage, pruning watch-card/Shorts DOM fallbacks, or cleaning package
contents.

## Source-Derived Summary

```text
source file: js/layout.js
line count: 680
source bytes: 30604
source sha256: 48831ccdc2d62c75818d9c6a153d7bfacec9d7be9f2408485f74b1a7c13c57c7
export surface: window.filterTubeLayout
exported method declarations: 5
plain function declarations: 0
function expression properties: 5
async function declarations: 0
arrow token sites: 18
semantic method groups: 5
selector API sites: 63
static selector sites: 63
dynamic selector sites: 0
unique static selector literals: 52
querySelector calls: 42
querySelectorAll calls: 18
closest calls: 3
matches calls: 0
setAttribute calls: 12
direct style property writes: 146
style.display writes: 34
classList.add calls: 3
classList.contains calls: 3
filter-tube-visible token occurrences: 32
:not(.filter-tube-visible) selector clauses: 10
document literal occurrences: 15
window literal occurrences: 4
location literal occurrences: 3
console.log occurrences: 4
addEventListener calls: 0
removeEventListener calls: 0
setTimeout calls: 0
setInterval calls: 0
requestAnimationFrame calls: 0
MutationObserver references: 0
fetch calls: 0
runtime behavior changed: no
```

## Method Group Counts

```text
legacySearchWatchLayoutRepair: 1
legacyShortsShelfLayoutRepair: 1
legacyHomepageShortsLayoutRewrite: 1
legacyExtremeHideWriter: 1
legacyPostFilterHideSweep: 1
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `legacySearchWatchLayoutRepair` | 1 | Rewrites Mix/search/watch-card child layout when `.filter-tube-visible` is present, and can add that class to nested watch-card lists from a visible parent. | Fresh decision revision proof, selector owner, nested-child decision policy, route-specific watch-card fixtures, and restore proof. |
| `legacyShortsShelfLayoutRepair` | 1 | Forces Shorts shelves, horizontal lists, arrows, thumbnails, and metadata into fixed horizontal layouts. | Shorts route ownership, virtualization/transform safety proof, responsive fixtures, and no-rule/no-filter work budget. |
| `legacyHomepageShortsLayoutRewrite` | 1 | Force-writes homepage Shorts rich-shelf containers and item dimensions through inline `style` strings. | Homepage-only gate, YouTube layout ownership policy, mobile/desktop negative fixtures, and package/reactivation proof. |
| `legacyExtremeHideWriter` | 1 | Applies one-way inline display, dimensions, visibility, opacity, pointer-events, overflow, and positioning writes to a caller-supplied element. | Shared hide/restore primitive, false-positive recovery fixture, recycled-node cleanup proof, and symmetric style restoration. |
| `legacyPostFilterHideSweep` | 1 | Calls the layout repair methods, then hides broad renderer selectors matching `:not(.filter-tube-visible)` and rewrites rich-grid layout. | Explicit hide-decision contract, visible-marker non-authority proof, no-rule negative fixture, and inventory coverage correction. |

## Current Method Inventory

| Source file | Source line | Kind | Method or function | Semantic group |
| --- | ---: | --- | --- | --- |
| `js/layout.js` | 14 | `objectFunctionProperty` | `fixSearchResultsLayout` | `legacySearchWatchLayoutRepair` |
| `js/layout.js` | 333 | `objectFunctionProperty` | `fixShortsLayout` | `legacyShortsShelfLayoutRepair` |
| `js/layout.js` | 474 | `objectFunctionProperty` | `fixHomepageShorts` | `legacyHomepageShortsLayoutRewrite` |
| `js/layout.js` | 622 | `objectFunctionProperty` | `ensureElementHidden` | `legacyExtremeHideWriter` |
| `js/layout.js` | 645 | `objectFunctionProperty` | `fixLayoutAfterFiltering` | `legacyPostFilterHideSweep` |

## Current Selector And Visual Boundaries

```text
search/Mix selectors: .yt-lockup-view-model-wiz--horizontal, .yt-lockup-view-model-wiz__content-image, .yt-lockup-view-model-wiz__metadata
channel/search route probes: ytd-browse[page-subtype="channels"], ytd-search
watch-card selectors: ytd-watch-card-compact-video-renderer.filter-tube-visible, ytd-universal-watch-card-renderer.filter-tube-visible, ytd-watch-card-rich-header-renderer.filter-tube-visible, ytd-vertical-watch-card-list-renderer.filter-tube-visible, ytd-watch-card-section-sequence-renderer.filter-tube-visible, ytd-watch-card-hero-video-renderer.filter-tube-visible
Shorts selectors: ytd-reel-shelf-renderer.filter-tube-visible, ytm-shorts-lockup-view-model-v2.filter-tube-visible, ytm-shorts-lockup-view-model.filter-tube-visible, .shortsLockupViewModelHost.filter-tube-visible, ytd-rich-shelf-renderer[is-shorts]:not([hidden])
broad hide selector: ytd-video-renderer:not(.filter-tube-visible), ytd-grid-video-renderer:not(.filter-tube-visible), ytd-rich-item-renderer:not(.filter-tube-visible), ytd-compact-video-renderer:not(.filter-tube-visible), ytd-radio-renderer:not(.filter-tube-visible), ytd-mix-renderer:not(.filter-tube-visible), ytd-playlist-renderer:not(.filter-tube-visible), ytd-shelf-renderer:not(.filter-tube-visible), ytd-horizontal-card-list-renderer:not(.filter-tube-visible), ytd-universal-watch-card-renderer:not(.filter-tube-visible)
visual side-effect density: 146 direct style property writes, 34 style.display writes, 3 classList.add calls, 12 setAttribute calls
old visible-marker assumption: absence of .filter-tube-visible can be interpreted as hidden by fixLayoutAfterFiltering()
restore authority: absent
runtime behavior changed: no
```

## Current Entrypoints And Package Boundary

```text
global export: window.filterTubeLayout
active manifest load: absent from manifest.json, manifest.chrome.json, manifest.firefox.json, manifest.opera.json
dist manifest load: absent from dist/chrome/manifest.json, dist/firefox/manifest.json, dist/opera/manifest.json
package copy source: build.js COMMON_DIRS includes js
dist copies currently present: dist/chrome/js/layout.js, dist/firefox/js/layout.js, dist/opera/js/layout.js
runtime callers in current repo: no non-doc source reference to filterTubeLayout
renderer inventory dependency: docs/youtube_renderer_inventory.md cites js/layout.js layout-fix coverage for watch-card targets
active coverage status: layout-only coverage is not active filtering proof
quarantine status: packaged legacy file, manifest-inactive
```

## Current Behavior Boundaries

```text
js/layout.js is tracked product source and packaged into dist through broad directory copying
js/layout.js is not loaded by the active extension manifests today
the file defines a global window.filterTubeLayout object but no current non-doc source calls it
layout repair methods promote .filter-tube-visible from a visual marker into a layout decision input
fixLayoutAfterFiltering() can hide broad renderer families solely because .filter-tube-visible is absent
ensureElementHidden() is not symmetric with current DOM fallback restore semantics
the file has no listener, observer, timer, interval, requestAnimationFrame, or fetch primitives
the main risk is accidental reactivation, stale package inclusion, or using layout-only inventory rows as runtime coverage
```

## Risk Notes

Reliability risk is concentrated in reactivation. A future manifest, native
wrapper, or content-script loader could call the global object and revive old
layout assumptions without current route, mode, decision-revision, or restore
proof.

False-hide risk is direct. `fixLayoutAfterFiltering()` treats absence of
`.filter-tube-visible` as a hide signal for broad renderer families. That is a
different authority model from the current explicit hide-decision pipeline.

Performance and code-burden risk come from 63 selector sites and 146 direct
style writes in a file that is not active manifest runtime but remains copied
into release directories. Cleanup needs package, native, inventory, and fixture
proof rather than a casual deletion or reactivation.

## Future Proof Fields

Each legacy layout row must eventually be backed by source line, manifest/load
owner, package target, selector owner, visual side-effect reason, restore proof,
and fixtures before layout repair, renderer coverage, native sync, package
cleanup, or deletion claims can be trusted:

```text
legacyLayoutMethodReference
sourceFile
sourceLine
semanticGroup
globalExportName
manifestLoadState
packageTarget
distCopyHash
selectorApi
selectorLiteral
routeSurface
visibleMarkerPolicy
hideDecisionAuthority
visualWriteReason
restoreProof
nativeSyncGate
inventoryCoveragePolicy
positiveFixture
negativeFixture
siblingVisibleFixture
reactivationFixture
deletionReadinessProof
```

## Missing Runtime Authorities

These authority/report tokens do not exist in the layout source, manifests,
package script, or current dist manifests today:

```text
legacyLayoutMethodAuthority
legacyLayoutManifestLoadContract
legacyLayoutPackageQuarantineManifest
legacyLayoutSelectorEffectReport
legacyLayoutVisibleMarkerDecisionContract
legacyLayoutExtremeHideRestoreProof
legacyLayoutInventoryCoveragePolicy
legacyLayoutNativeSyncGate
legacyLayoutFixtureProvenance
legacyLayoutDeletionReadinessReport
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
