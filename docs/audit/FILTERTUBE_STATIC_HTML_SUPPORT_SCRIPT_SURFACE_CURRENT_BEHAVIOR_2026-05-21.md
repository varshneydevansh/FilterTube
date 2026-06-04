# FilterTube Static HTML And Support Script Surface - Current Behavior

Date: 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch, UI smoke pass, release gate, or permission to change
loader order, CSP/resource policy, external navigation, route handling, or
support-script output behavior.

This slice extends the active audit goal for tracked files that are not covered
well by method-only source registers: extension HTML surfaces and the manual
Swift video compression helper.

## Source Fingerprints

| Path | Current role | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `html/popup.html` | Browser action popup shell | 31 | 1,213 | `c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31` |
| `html/tab-view.html` | Dashboard/settings/help/What New shell | 1,577 | 133,585 | `e33ef1e0d1f2c3d607cb58c3275137df54c1c82ed06cf5cd03c053690fedb0b6` |
| `html/troubleshoot.html` | Tracked support HTML placeholder | 0 | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `scripts/compress-video.swift` | Manual website/release video compression helper | 97 | 3,339 | `196c1ebf918b94e3d36fd2bd04658c4fa4762a85ad5657b49ede7aaa93e2e36b` |

## Current HTML Facts

`html/popup.html` is the default popup in `manifest.json`,
`manifest.chrome.json`, `manifest.firefox.json`, and `manifest.opera.json`.
It has one mount node, `#popupRoot`, no `data-tab` routes, no `target="_blank"`
anchors, one external stylesheet URL to Google Fonts, and this hand-authored
script order:

1. `../js/settings_shared.js`
2. `../js/content_controls_catalog.js`
3. `../js/ui_components.js`
4. `../js/security_manager.js`
5. `../js/io_manager.js`
6. `../js/state_manager.js`
7. `../js/render_engine.js`
8. `../js/ui-shell/popup-shell.js`
9. `../js/popup.js`

`html/tab-view.html` is opened by current runtime source through
`html/tab-view.html`, `html/tab-view.html?view=kids&section=content`,
`html/tab-view.html?view=filters&section=categories`, and
`html/tab-view.html?view=whatsnew`. It has 100 source `id` attributes, all
unique in the current file, and these `data-tab` values:

`dashboard`, `filters`, `semantic`, `kids`, `settings`, `sync`, `whatsnew`,
`help`, and `donate`.

The `semantic` tab is present in source as a hidden future item:
`data-tab="semantic" hidden aria-hidden="true" data-feature-state="future"`.

`html/tab-view.html` has one external stylesheet URL to Google Fonts, 8 external
URL occurrences across 7 unique URLs, and 7 `target="_blank"` anchors. Source
navigation policy is inconsistent: the brand link has no `rel` attribute, two
download cards use `rel="noreferrer"`, and four support/Nanah links use
`rel="noopener noreferrer"`.

`html/tab-view.html` currently loads scripts in this order:

1. `../js/settings_shared.js`
2. `../js/security_manager.js`
3. `../js/io_manager.js`
4. `../js/vendor/qrcode.bundle.js`
5. `../js/vendor/nanah.bundle.js`
6. `../js/nanah_sync_adapter.js`
7. `../js/content_controls_catalog.js`
8. `../js/ui_components.js`
9. `../js/state_manager.js`
10. `../js/render_engine.js`
11. `../js/ui-shell/tab-view-decor.js`
12. `../js/tab-view.js`

`html/troubleshoot.html` is an empty tracked file. Current product source does
not reference `html/troubleshoot.html` from manifests, `build.js`,
`package.json`, or runtime JavaScript open/navigation paths.

## Current Support Script Facts

`scripts/compress-video.swift` imports `AVFoundation` and `Foundation`, accepts
`480p`, `540p`, `720p`, and `medium` preset labels, defaults to `540p`, and
sets `exporter.shouldOptimizeForNetworkUse = true`.

If the requested output path already exists, the script deletes it with
`FileManager.default.removeItem(at:)` before it verifies that the exporter can
write `.mp4` and before export succeeds. On macOS 15 and newer it uses
`try await exporter.export(to: outputURL, as: .mp4)`. On older macOS versions it
sets `outputURL` and `outputFileType`, waits on `exportAsynchronously`, and then
maps `.completed`, `.failed`, `.cancelled`, and unexpected statuses to process
success or `exit(1)`.

There is no package script for `compress-video.swift`, no dry-run mode, no
temporary-output path, no atomic replacement step, and no current failure-mode
artifact proving the old output remains available after an unsupported source,
unsupported preset, cancelled export, or failed export.

## Risk Register

| Risk area | Current evidence | Why this remains blocked |
| --- | --- | --- |
| Popup loader order | Popup loader order is hand-authored in HTML and shared-runtime scripts must precede `popup-shell.js` and `popup.js`. | No `extensionHtmlLoaderOrderManifest` or browser smoke fixture proves stale/missing/generated script behavior. |
| Dashboard loader order | Vendor QR, Nanah, adapter, generated shell, and `tab-view.js` order is hand-authored. | No source-owned loader authority proves all dashboard routes still boot after build/vendor output drift. |
| CSP/resource behavior | Popup and dashboard both include an external Google Fonts stylesheet and manifests do not define a repo-local `content_security_policy`. | No `extensionHtmlCspResourceReport` proves cross-browser extension-page resource behavior or failure fallback. |
| Route state | Dashboard route state is split between static `data-tab` values and JS query handling. | No `extensionHtmlRouteStateReport` proves each `?view=` and `section=` entrypoint, hidden future tab behavior, or invalid route fallback. |
| External navigation | Seven dashboard anchors open new tabs with three source-level `rel` states: none, `noreferrer`, and `noopener noreferrer`. | No `extensionHtmlExternalNavigationReport` defines a consistent extension-page external-link contract. |
| Empty support page | `html/troubleshoot.html` is tracked, empty, and has no current opener in product source. | No `troubleshootHtmlSurfaceDecision` says whether it is a dead asset, future page, packaged placeholder, or deletion candidate. |
| Swift support script output safety | Existing output is deleted before `.mp4` support is checked and before export success. | No `compressVideoDryRunContract`, `compressVideoAtomicOutputContract`, or failure-mode fixture protects release/video assets. |

## Missing Authority Symbols

No runtime or support-source symbol exists yet for:

- `staticHtmlSurfaceAuthority`
- `extensionHtmlLoaderOrderManifest`
- `extensionHtmlCspResourceReport`
- `extensionHtmlRouteStateReport`
- `extensionHtmlExternalNavigationReport`
- `extensionHtmlSmokeFixture`
- `troubleshootHtmlSurfaceDecision`
- `compressVideoScriptAuthority`
- `compressVideoDryRunContract`
- `compressVideoAtomicOutputContract`
- `supportScriptFailureModeReport`

## Completion Boundary

This register does not close the tracked-file objective. It only pins current
source facts for three HTML files and one support script. Before implementation
changes, each surface still needs owner, route, loader, resource/CSP, external
navigation, UI smoke, package/release, and failure-mode proof appropriate to the
file.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
