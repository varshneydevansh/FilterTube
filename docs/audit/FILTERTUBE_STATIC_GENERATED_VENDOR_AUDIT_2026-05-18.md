# FilterTube Static / Generated / Vendor Surface Audit - 2026-05-18

Status: audit artifact only. This file does not change shipped CSS, HTML,
generated bundles, vendor bundles, release notes, or runtime behavior.

This pass covers files that are not part of the JSON filtering engine but still
ship with the extension or feed public UI behavior:

- extension HTML shells,
- active extension UI CSS,
- quarantined legacy YouTube CSS,
- generated UI shell source and generated outputs,
- vendor bundles,
- release-note data,
- packaged static app/brand/media assets.

## Accounted File Families

| Family | Files | Current proof boundary |
| --- | --- | --- |
| Extension HTML | `html/popup.html`, `html/tab-view.html`, `html/troubleshoot.html` | Popup/dashboard load order, external links, script dependency order, and empty troubleshoot page are pinned. |
| Active extension UI CSS | `css/design_tokens.css`, `css/components.css`, `css/popup.css`, `css/tab-view.css`, `css/serene-shell.css` | Scoped to extension pages by HTML, not YouTube content scripts. |
| Quarantined YouTube CSS | `css/filter.css`, `css/content.css`, `css/layout.css` | Packaged by build but not manifest-loaded; contains broad default-hide and layout-forcing selectors. |
| Generated UI shell source | `src/extension-shell/popup.jsx`, `src/extension-shell/tab-view-decor.jsx`, `src/extension-shell/shared/runtime.js` | Real source inputs for `scripts/build-extension-ui.mjs`; must be tracked with generated outputs. |
| Generated UI shell output | `js/ui-shell/popup-shell.js`, `js/ui-shell/tab-view-decor.js` | Browser IIFEs loaded by popup/dashboard pages. |
| Vendor bundles | `js/vendor/nanah.bundle.js`, `js/vendor/qrcode.bundle.js` | API-boundary/global-surface proof, not product-owned line-by-line behavior. |
| Release note data | `data/release_notes.json` | Dashboard and prompt copy source; staged version drift is pinned elsewhere. |
| Static app/brand/media assets | `icons/*`, `assets/images/*`, `website/public/brand/logo.png`, `website/public/videos/*` | Packaged/public asset burden; checksums and size budgets still needed before release gates. |

## Current Size Snapshot

| File | Bytes | Lines | Notes |
| --- | ---: | ---: | --- |
| `html/popup.html` | 1,213 | 31 | Popup root plus CSS/script order. |
| `html/tab-view.html` | 133,585 | 1,575 | Dashboard static shell, app cards, Nanah/status/help links, UI scripts. |
| `html/troubleshoot.html` | 0 | 0 | Manifest/support surface exists as an empty file today. |
| `css/design_tokens.css` | 10,361 | 301 | Shared token source. |
| `css/components.css` | 45,567 | 1,686 | Shared UI components. |
| `css/popup.css` | 29,731 | 1,151 | Popup-only layout and cards. |
| `css/tab-view.css` | 68,789 | 2,834 | Dashboard layout, app cards, profile controls, Kids/settings sections. |
| `css/serene-shell.css` | 86,093 | 3,358 | Shared shell/decor styling. |
| `css/filter.css` | 2,412 | 74 | Quarantined YouTube default-hide CSS. |
| `css/content.css` | 12,890 | 385 | Quarantined fallback YouTube CSS. |
| `css/layout.css` | 28,581 | 802 | Quarantined YouTube layout-restoration/default-hide CSS. |
| `js/ui-shell/popup-shell.js` | 21,080 | 374 | Generated popup shell. |
| `js/ui-shell/tab-view-decor.js` | 18,289 | 323 | Generated dashboard decor shell. |
| `js/vendor/nanah.bundle.js` | 27,692 | 876 | Nanah global bundle. |
| `js/vendor/qrcode.bundle.js` | 66,965 | 2,085 | QR code global bundle. |
| `data/release_notes.json` | 23,039 | 316 | Release-note copy data. |

## Extension HTML Load Order

Popup:

```text
design_tokens.css
components.css
popup.css
serene-shell.css
Google Fonts URL
settings_shared.js
content_controls_catalog.js
ui_components.js
security_manager.js
io_manager.js
state_manager.js
render_engine.js
ui-shell/popup-shell.js
popup.js
```

Dashboard:

```text
design_tokens.css
components.css
tab-view.css
serene-shell.css
Google Fonts URL
static dashboard DOM
qrcode.bundle.js
nanah.bundle.js
nanah_sync_adapter.js
content_controls_catalog.js
ui_components.js
state_manager.js
render_engine.js
ui-shell/tab-view-decor.js
tab-view.js
```

Risk:

```text
HTML order is part of settings authority:
shared settings -> IO/security/sync/vendor -> state manager -> render engine -> page controller
```

If this order changes, UI state and Nanah import/export behavior must be
re-tested.

## External Requests From Extension Pages

The extension HTML pages currently include non-YouTube/non-extension URLs:

- `https://fonts.googleapis.com/...` in popup and dashboard.
- `https://filtertube.in` and `https://www.filtertube.in/downloads` from the dashboard.
- `https://nanah-signaling.varshney-devansh614.workers.dev/` in dashboard copy/actions.
- `https://github.com/varshneydevansh/nanah` in dashboard copy/actions.
- Google support links for YouTube Kids help.

These are not content-script requests and are not the cause of YouTube page lag.
They are still privacy/store-disclosure and extension-page performance surfaces.
The public privacy wording should distinguish:

```text
YouTube content runtime filtering data: local-first.
Extension dashboard/popup assets and links: may request fonts or external pages when opened/clicked.
```

## Quarantined YouTube CSS Risk

The three legacy YouTube CSS files are not manifest-loaded today, but they are
still packaged by `build.js` because the whole `css` directory is copied.

Key current counts:

| File | YouTube selectors | `filtertube-hidden` / `filter-tube-visible` refs | `display:none` rules | `!important` rules |
| --- | ---: | ---: | ---: | ---: |
| `css/filter.css` | 35 | 6 | 6 | 12 |
| `css/content.css` | 109 | 35 | 7 | 113 |
| `css/layout.css` | 270 | 132 | 13 | 353 |

The highest-risk rule is the default-hide model:

```css
ytd-video-renderer,
ytd-compact-video-renderer,
ytd-grid-video-renderer,
ytd-rich-item-renderer,
...
.yt-lockup-view-model-wiz {
    display: none !important;
}
```

If any of these stylesheets becomes manifest-loaded or dynamically injected
without exact route/rule gates, the result can be broad content disappearance,
page flicker, and apparent YouTube slowness. This matches the user's symptom
class, so the quarantine must stay explicit.

## Generated UI Shell Boundary

Source inputs:

```text
src/extension-shell/popup.jsx
src/extension-shell/tab-view-decor.jsx
src/extension-shell/shared/runtime.js
```

Generated outputs:

```text
js/ui-shell/popup-shell.js
js/ui-shell/tab-view-decor.js
```

Both source and generated output are in the repo. This has two risks:

1. Source changes can be committed without regenerated output.
2. Generated output can be edited or drift without source review.

The generated shells are extension UI only. They mount ambient videos with
`preload="metadata"`, set `data-surface`, add `ft-extension-surface`, and, for
popup, force a fixed `392px` shell width. They are not content scripts and
should not affect YouTube Main page performance.

## Vendor Bundle Boundary

| Bundle | Global | Source authority | Risk |
| --- | --- | --- | --- |
| `js/vendor/nanah.bundle.js` | `window.FilterTubeNanah` | Built from sibling `../nanah` by `scripts/build-nanah-vendor.mjs` | Needs source revision/hash proof. |
| `js/vendor/qrcode.bundle.js` | `FilterTubeQrCode` | Built from `node_modules/qrcode/lib/browser.js` | Needs package/version/hash proof. |

These bundles should be audited by API surface and provenance, not by claiming
every vendor line is product-owned logic.

## High-Confidence Findings

1. **`src/extension-shell/*` is a real source surface.**
   The earlier source inventory classified generated outputs but did not
   explicitly list the source inputs. This pass closes that accounting gap.

2. **The extension dashboard is not a pure local/offline page.**
   It includes Google Fonts and external product/support links. That is fine if
   documented, but broad "no external requests" copy should be scoped to the
   filtering runtime, not extension UI pages.

3. **The troubleshoot page exists but is empty.**
   `html/troubleshoot.html` is a zero-byte packaged page. If linked from UI or
   store support flows, it is a broken support surface.

4. **Quarantined CSS would be dangerous if loaded on YouTube.**
   `filter.css`, `content.css`, and `layout.css` contain broad default-hide and
   layout-forcing rules. Their safety depends on staying out of manifest
   content CSS and any dynamic injection path.

5. **Generated UI shell freshness is unproven.**
   The build script regenerates shell files, but there is not yet a CI-style
   check that source and generated output match.

6. **Vendor bundle provenance is unproven.**
   Nanah and QR bundle globals are present, but their source revision/package
   identity is not recorded in a committed manifest.

7. **UI media is extension-page scoped.**
   The popup/dashboard generated shells use the homepage MP4 with
   `preload="metadata"`. This can affect popup/dashboard open performance, but
   it is not YouTube Main content-page lag unless the asset is accidentally
   loaded by content scripts.

## Required Follow-Up Proof

| Requirement | Proof needed |
| --- | --- |
| Generated shell freshness | Run `npm run build:ui`, then assert `js/ui-shell/*.js` is unchanged or commit generated diffs with source diffs. |
| Vendor provenance | Record Nanah source revision, QR package version, and bundle SHA-256 hashes. |
| Quarantined CSS safety | CI fixture that no manifest content script lists `css/filter.css`, `css/content.css`, or `css/layout.css`, and no runtime injects them into YouTube pages. |
| Extension-page request disclosure | Privacy/docs wording or local font assets for popup/dashboard. |
| Troubleshoot surface | Either implement `html/troubleshoot.html`, remove it from package references, or classify it as intentionally empty with no UI links. |
| Static asset budget | Size/hash manifest for icons, app images, and extension shell MP4. |

## Fixture Coverage

Executable current-behavior fixtures are in:

```text
tests/runtime/static-generated-vendor-current-behavior.test.mjs
```

They pin:

- current extension HTML dependency order and external refs,
- active UI CSS vs quarantined YouTube CSS boundaries,
- current default-hide selector burden in quarantined CSS,
- source/generated UI shell linkage,
- vendor global surfaces,
- release-note data shape,
- static asset existence and local junk exclusion.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this backup/import/Nanah/vendor surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
