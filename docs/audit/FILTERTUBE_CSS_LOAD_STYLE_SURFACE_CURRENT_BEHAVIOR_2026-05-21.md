# FilterTube CSS Load And Style Surface - Current Behavior - 2026-05-21

Status: audit-only current-behavior proof. Runtime behavior is unchanged. This
is not a CSS cleanup, UI redesign, manifest change, or package pruning patch.

## Purpose

This register extends the CSS/style hide authority audit from legacy hide risk
into the full tracked CSS surface. It pins which CSS files are active extension
page styles, which are packaged-but-quarantined content styles, which are
website-only styles, and what proof is still missing before any CSS file can be
deleted, merged, activated, or used as behavior evidence.

## Tracked CSS Surface

Tracked source currently contains 9 CSS files, 11,286 counted source lines,
301,511 bytes, 1,578 lexical rule blocks, 593 `!important` declarations, 47
`display:none` declarations, 72 `:not(.filter-tube-visible)` clauses, 167
`filter-tube-visible` tokens, 6 `filtertube-hidden` tokens, 37 `@media`
blocks, 7 `@keyframes` blocks, and 3 `[hidden]` selectors.

| Path | Family | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `css/components.css` | active extension UI shared CSS | 1,686 | 45,567 | `db01d30c717e34c108e48d92807ce3df4bcafccace62a1808d86d03ed7047ebc` |
| `css/content.css` | packaged quarantined content CSS | 385 | 12,890 | `442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b` |
| `css/design_tokens.css` | active extension UI token CSS | 301 | 10,361 | `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc` |
| `css/filter.css` | packaged quarantined content CSS | 74 | 2,412 | `e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032` |
| `css/layout.css` | packaged quarantined content CSS | 803 | 28,581 | `9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941` |
| `css/popup.css` | active extension popup CSS | 1,151 | 29,731 | `812cb4ba8b4c9be732bd8a2a6f7b06b5d8d0a8c3fb7416f391f475ae627d45fa` |
| `css/serene-shell.css` | active extension shell CSS | 3,414 | 87,230 | `785e988dd0176b16defcc08f77925de8eaa60ea831d53cd57147eb601c490f0a` |
| `css/tab-view.css` | active extension dashboard CSS | 2,986 | 72,211 | `3d07057381c63e2d3d117b6be466eb31eeb35df80f00747403f79fb0f28efdce` |
| `website/app/globals.css` | website-only global CSS | 486 | 12,528 | `2b583fc11e8f5a3a6fa5113daebf71b91d46bf685b02c544727167cf9ed7f760` |

## Load And Package Topology

- `html/popup.html` loads `css/design_tokens.css`, `css/components.css`,
  `css/popup.css`, `css/serene-shell.css`, plus one Google Fonts stylesheet.
- `html/tab-view.html` loads `css/design_tokens.css`, `css/components.css`,
  `css/tab-view.css`, `css/serene-shell.css`, plus one Google Fonts stylesheet.
- `website/app/layout.js` imports `website/app/globals.css`.
- `manifest.json`, `manifest.chrome.json`, `manifest.firefox.json`, and
  `manifest.opera.json` currently have no `content_scripts.css` entries.
- `build.js` includes `css` in `COMMON_DIRS`, so all root CSS files are copied
  into browser packages even when content CSS is not manifest-loaded.

Current root CSS ownership classes:

| Class | Files | Current load state | Risk boundary |
| --- | --- | --- | --- |
| Active extension UI CSS | `css/design_tokens.css`, `css/components.css`, `css/popup.css`, `css/tab-view.css`, `css/serene-shell.css` | Loaded only by extension HTML pages. | Needs popup/dashboard visual, responsive, accessibility, and mode-state proof before cleanup. |
| Quarantined content CSS | `css/content.css`, `css/filter.css`, `css/layout.css` | Packaged by build, not manifest-loaded. | Encodes old default-hide/reveal behavior and must remain quarantined unless rewritten with fixtures. |
| Website CSS | `website/app/globals.css` | Imported by the website app layout. | Website-only animation/layout surface; not extension filtering proof. |

## Selector And Hide Counters

| Path | Rule blocks | `!important` | `display:none` | `:not(.filter-tube-visible)` | `filter-tube-visible` | `filtertube-hidden` | `@media` | `@keyframes` | `[hidden]` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `css/components.css` | 240 | 47 | 1 | 0 | 0 | 0 | 5 | 1 | 0 |
| `css/content.css` | 45 | 113 | 6 | 5 | 35 | 0 | 0 | 0 | 0 |
| `css/design_tokens.css` | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/filter.css` | 6 | 12 | 5 | 5 | 6 | 0 | 0 | 0 | 0 |
| `css/layout.css` | 86 | 353 | 11 | 62 | 126 | 6 | 0 | 0 | 0 |
| `css/popup.css` | 182 | 5 | 3 | 0 | 0 | 0 | 2 | 0 | 1 |
| `css/serene-shell.css` | 494 | 39 | 7 | 0 | 0 | 0 | 16 | 1 | 0 |
| `css/tab-view.css` | 444 | 24 | 14 | 0 | 0 | 0 | 12 | 4 | 2 |
| `website/app/globals.css` | 69 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 |

The most important split is still the class model:

```text
packaged quarantined content CSS:
  default-hide renderer families and reveal with .filter-tube-visible

active runtime hide model:
  default-show content and hide with .filtertube-hidden / .filtertube-hidden-shelf
```

That split makes `css/content.css`, `css/filter.css`, and `css/layout.css`
package-risk files, not deletion-ready files. They are risky if activated and
risky if deleted without package/native/release proof.

## Dynamic Style Surface

Current product source has dynamic style creation sites in these files:

- `js/content/block_channel.js` quick-block styles.
- `js/content/first_run_prompt.js` first-run prompt styles.
- `js/content/menu.js` shared content menu styles.
- `js/content/release_notes_prompt.js` release notes prompt styles.
- `js/content/dom_helpers.js` current `.filtertube-hidden` helper style.
- `js/content/dom_fallback.js` content-control style rules.
- `js/content_bridge.js` fallback menu style.

No product source currently contains `insertCSS`, `scripting.insertCSS`,
`tabs.insertCSS`, `adoptedStyleSheets`, or `new CSSStyleSheet`.

## Missing Authority Symbols

No product runtime, build, website, or tracked CSS source currently defines:

```text
cssLoadSurfaceAuthority
cssPackageQuarantineManifest
cssExtensionPageLoadManifest
cssContentScriptActivationGate
cssLegacyRevealModelDecision
cssSelectorEffectReport
cssImportantDebtBudget
cssResponsiveVisualFixtureReport
cssDynamicStyleLifecycleRegistry
cssWebsiteExtensionBoundaryReport
cssDeletionReadinessReport
```

## Completion Boundary

This register does not close CSS tracked-file obligations. It makes the current
CSS surface auditable: active extension UI styles, packaged quarantined content
styles, website-only CSS, dynamic style injection, and missing cleanup authority
are all now explicit. Future CSS changes still need visual fixtures,
responsive/accessibility proof, manifest/package proof, false-hide fixtures,
dynamic style lifecycle ownership, and release/native boundary proof.

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


## October 18, 2026 current source inventory

The older measurements are historical. Current totals: 9 CSS files, 20,734 counted source lines; 566,053 bytes, 2,877 lexical rule blocks; 615 `!important` declarations, 76 `display:none` declarations. Selector counts are lexical only; responsive visual evidence is separately recorded in RESPONSIVE_UI_2026-10-17.md. `_locales` now ships alongside the existing common roots; the three quarantined CSS files remain unreferenced by active manifests/HTML.

| File | Classification | Lines | Bytes | SHA256 |
|---|---|---:|---:|---|
| css/components.css | active extension UI shared CSS | 1966 | 52694 | f7aefe9b0400f0427bbbd8dc52c9dfc7ccd675847d28e6555c564426a29e5036 |
| css/content.css | packaged quarantined content CSS | 385 | 12890 | 442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b |
| css/design_tokens.css | active extension UI token CSS | 301 | 10361 | 7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc |
| css/filter.css | packaged quarantined content CSS | 74 | 2412 | e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032 |
| css/layout.css | packaged quarantined content CSS | 803 | 28581 | 9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941 |
| css/popup.css | active extension popup CSS | 1259 | 32376 | c388d39fab962528365711baa0bfe953ed84ca660ac6123571f79b2c4be820c5 |
| css/serene-shell.css | active extension shell CSS | 9656 | 267377 | 53608a364e8e62a326a0a7b98daa0ef2f6762cff272730f24a33c425690ee75b |
| css/tab-view.css | active extension dashboard CSS | 5749 | 144577 | 8fbfff1804e96aefe5d211ff633be081233361ed551fff55e45496b9206648b2 |
| website/app/globals.css | website-only global CSS | 541 | 14785 | 2341d3570c01f4ac118fa8587937d60c2a1ccf750163e74f90428c56fe5d7d06 |

## Watch Notes source inventory update - 2026-10-23

10 CSS files, 20,738 counted source lines; 568,494 bytes, 2,918 lexical rule blocks.

| `css/video-notes.css` | active extension private Notes editor CSS | 4 | 2441 | a96732ddb9ea92efff27291e81bb89c87c584afadcb7177c9e5f7af34b37fa6f | 41 | 1 | 1 | 0 | 0 | 0 | 3 | 0 | 1 |

The private extension-origin html/video-notes.html loads this stylesheet. It does not activate quarantined content CSS; the public Notes action and closed panel style live in js/content/video_notes.js.

## Notes dialog readability inventory - 2026-10-23

10 CSS files, 20,861 counted source lines; 571,323 bytes, 2,936 lexical rule blocks.

| `css/video-notes.css` | active extension private Notes editor CSS | 127 | 5270 | da72df5db2d9ad321927cb710d8d48d01dc0127f656da11b920b7049c22ac388 | 59 | 1 | 2 | 0 | 0 | 0 | 3 | 0 | 1 |

Readability changes use larger note text, higher contrast disabled states, a compact app-style header, separated timestamp controls and a visible Save action. Quarantined content styles remain inactive.

## Auto-sync source inventory - 2026-10-24

11 CSS files, 21,063 counted source lines; 586,423 bytes, 3,050 lexical rule blocks.

| `css/components.css` | active extension UI shared CSS | 1966 | 52694 | `f7aefe9b0400f0427bbbd8dc52c9dfc7ccd675847d28e6555c564426a29e5036` | 283 | 48 | 2 | 0 | 0 | 0 | 7 | 1 | 1 |
| `css/content.css` | packaged quarantined content CSS | 385 | 12890 | `442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b` | 45 | 113 | 6 | 5 | 35 | 0 | 0 | 0 | 0 |
| `css/design_tokens.css` | active extension UI token CSS | 301 | 10361 | `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc` | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/device-auto-sync.css` | active extension Auto-sync dashboard CSS | 202 | 15100 | `9cbe4a611981f2ef4e153d153bbf24d1831edd07e4094e1624e1c0f7397f6201` | 114 | 3 | 6 | 0 | 0 | 0 | 3 | 0 | 3 |
| `css/filter.css` | packaged quarantined content CSS | 74 | 2412 | `e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032` | 6 | 12 | 5 | 5 | 6 | 0 | 0 | 0 | 0 |
| `css/layout.css` | packaged quarantined content CSS | 803 | 28581 | `9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941` | 86 | 353 | 11 | 62 | 126 | 6 | 0 | 0 | 0 |
| `css/popup.css` | active extension popup CSS | 1259 | 32376 | `c388d39fab962528365711baa0bfe953ed84ca660ac6123571f79b2c4be820c5` | 197 | 5 | 3 | 0 | 0 | 0 | 2 | 0 | 1 |
| `css/serene-shell.css` | active extension shell CSS | 9656 | 267377 | `53608a364e8e62a326a0a7b98daa0ef2f6762cff272730f24a33c425690ee75b` | 1328 | 59 | 27 | 0 | 0 | 0 | 28 | 2 | 8 |
| `css/tab-view.css` | active extension dashboard CSS | 5749 | 144577 | `8fbfff1804e96aefe5d211ff633be081233361ed551fff55e45496b9206648b2` | 844 | 25 | 22 | 0 | 0 | 0 | 21 | 5 | 6 |
| `css/video-notes.css` | active extension private Notes editor CSS | 127 | 5270 | `da72df5db2d9ad321927cb710d8d48d01dc0127f656da11b920b7049c22ac388` | 59 | 1 | 2 | 0 | 0 | 0 | 3 | 0 | 1 |
| `website/app/globals.css` | website-only global CSS | 541 | 14785 | `2341d3570c01f4ac118fa8587937d60c2a1ccf750163e74f90428c56fe5d7d06` | 76 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 |

Auto-sync adds one scoped dashboard stylesheet with responsive controls. Counts and selector totals are lexical evidence; existing quarantined styles stay inactive. Installed, keyboard, phone and TV acceptance remain separate.

## Conservative website content inventory - 2026-10-25

Current totals: 11 CSS files, 21,322 counted source lines; 596,357 bytes, 3,128 lexical rule blocks.

| File | Classification | Lines | Bytes | SHA256 | Rules | Important | Display none | Old reveal selectors | Visible tokens | Hidden tokens | Media | Keyframes | Hidden attribute |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `css/components.css` | active extension UI shared CSS | 1966 | 52694 | `f7aefe9b0400f0427bbbd8dc52c9dfc7ccd675847d28e6555c564426a29e5036` | 283 | 48 | 2 | 0 | 0 | 0 | 7 | 1 | 1 |
| `css/content.css` | packaged quarantined content CSS | 385 | 12890 | `442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b` | 45 | 113 | 6 | 5 | 35 | 0 | 0 | 0 | 0 |
| `css/design_tokens.css` | active extension UI token CSS | 301 | 10361 | `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc` | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/device-auto-sync.css` | active extension Auto-sync dashboard CSS | 202 | 15100 | `9cbe4a611981f2ef4e153d153bbf24d1831edd07e4094e1624e1c0f7397f6201` | 114 | 3 | 6 | 0 | 0 | 0 | 3 | 0 | 3 |
| `css/filter.css` | packaged quarantined content CSS | 74 | 2412 | `e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032` | 6 | 12 | 5 | 5 | 6 | 0 | 0 | 0 | 0 |
| `css/layout.css` | packaged quarantined content CSS | 803 | 28581 | `9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941` | 86 | 353 | 11 | 62 | 126 | 6 | 0 | 0 | 0 |
| `css/popup.css` | active extension popup CSS | 1259 | 32376 | `c388d39fab962528365711baa0bfe953ed84ca660ac6123571f79b2c4be820c5` | 197 | 5 | 3 | 0 | 0 | 0 | 2 | 0 | 1 |
| `css/serene-shell.css` | active extension shell CSS | 9656 | 267377 | `53608a364e8e62a326a0a7b98daa0ef2f6762cff272730f24a33c425690ee75b` | 1328 | 59 | 27 | 0 | 0 | 0 | 28 | 2 | 8 |
| `css/tab-view.css` | active extension dashboard CSS | 5749 | 144577 | `8fbfff1804e96aefe5d211ff633be081233361ed551fff55e45496b9206648b2` | 844 | 25 | 22 | 0 | 0 | 0 | 21 | 5 | 6 |
| `css/video-notes.css` | active extension private Notes editor CSS | 127 | 5270 | `da72df5db2d9ad321927cb710d8d48d01dc0127f656da11b920b7049c22ac388` | 59 | 1 | 2 | 0 | 0 | 0 | 3 | 0 | 1 |
| `website/app/globals.css` | website-only global CSS | 800 | 24719 | `d90ac06ae5ba0ce4415eea79eb8dc4ed2479ef32081c5a3962944dc2bc29ad10` | 154 | 0 | 1 | 0 | 0 | 0 | 2 | 1 | 0 |

The conservative change retains the original scenic visual system and adds a limited website disclosure style. No extension CSS, quarantine activation, manifest, native mirror or package pruning changed. Counts are lexical evidence, not a waiver of semantic, rendered accessibility, deployment or installed-device acceptance gates.

## Page tones and compact dashboard preview - 2026-11-01

Current totals: 12 CSS files, 21,834 counted source lines; 619,965 bytes, 3,179 lexical rule blocks.

| File | Classification | Lines | Bytes | SHA256 | Rules | Important | Display none | Old reveal selectors | Visible tokens | Hidden tokens | Media | Keyframes | Hidden attribute |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `css/components.css` | active extension UI shared CSS | 1966 | 52694 | `f7aefe9b0400f0427bbbd8dc52c9dfc7ccd675847d28e6555c564426a29e5036` | 283 | 48 | 2 | 0 | 0 | 0 | 7 | 1 | 1 |
| `css/content.css` | packaged quarantined content CSS | 385 | 12890 | `442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b` | 45 | 113 | 6 | 5 | 35 | 0 | 0 | 0 | 0 |
| `css/design_tokens.css` | active extension UI token CSS | 301 | 10361 | `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc` | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/device-auto-sync.css` | active extension Auto-sync dashboard CSS | 202 | 15100 | `9cbe4a611981f2ef4e153d153bbf24d1831edd07e4094e1624e1c0f7397f6201` | 114 | 3 | 6 | 0 | 0 | 0 | 3 | 0 | 3 |
| `css/filter.css` | packaged quarantined content CSS | 74 | 2412 | `e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032` | 6 | 12 | 5 | 5 | 6 | 0 | 0 | 0 | 0 |
| `css/layout.css` | packaged quarantined content CSS | 803 | 28581 | `9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941` | 86 | 353 | 11 | 62 | 126 | 6 | 0 | 0 | 0 |
| `css/page-tones.css` | active extension page tone CSS | 571 | 26074 | `85e7828385dc86dc40228abe39cd28393c8df31409edc68e4181fab196f0b45f` | 57 | 4 | 2 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/popup.css` | active extension popup CSS | 1259 | 32376 | `c388d39fab962528365711baa0bfe953ed84ca660ac6123571f79b2c4be820c5` | 197 | 5 | 3 | 0 | 0 | 0 | 2 | 0 | 1 |
| `css/serene-shell.css` | active extension shell CSS | 9597 | 264911 | `298de9d76c480186c923ebf40e0a3e0b0981c0b4eeb5b09293aa26b7066938c8` | 1322 | 59 | 27 | 0 | 0 | 0 | 28 | 2 | 8 |
| `css/tab-view.css` | active extension dashboard CSS | 5749 | 144577 | `8fbfff1804e96aefe5d211ff633be081233361ed551fff55e45496b9206648b2` | 844 | 25 | 22 | 0 | 0 | 0 | 21 | 5 | 6 |
| `css/video-notes.css` | active extension private Notes editor CSS | 127 | 5270 | `da72df5db2d9ad321927cb710d8d48d01dc0127f656da11b920b7049c22ac388` | 59 | 1 | 2 | 0 | 0 | 0 | 3 | 0 | 1 |
| `website/app/globals.css` | website-only global CSS | 800 | 24719 | `d90ac06ae5ba0ce4415eea79eb8dc4ed2479ef32081c5a3962944dc2bc29ad10` | 154 | 0 | 1 | 0 | 0 | 0 | 2 | 1 | 0 |

`css/page-tones.css` is loaded last by the popup and dashboard and sets the per-page colour tones; it also hides the scenic video under reduced motion. `css/serene-shell.css` replaces the large dashboard app preview block with a compact thumbnail row. No quarantined CSS is activated and no manifest changed. Counts are lexical evidence only.

## Local playlists merged with the compact dashboard preview - 2026-11-01

Current totals: 12 CSS files, 21,869 counted source lines; 620,765 bytes, 3,183 lexical rule blocks.

| File | Classification | Lines | Bytes | SHA256 | Rules | Important | Display none | Old reveal selectors | Visible tokens | Hidden tokens | Media | Keyframes | Hidden attribute |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `css/components.css` | active extension UI shared CSS | 1966 | 52694 | `f7aefe9b0400f0427bbbd8dc52c9dfc7ccd675847d28e6555c564426a29e5036` | 283 | 48 | 2 | 0 | 0 | 0 | 7 | 1 | 1 |
| `css/content.css` | packaged quarantined content CSS | 385 | 12890 | `442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b` | 45 | 113 | 6 | 5 | 35 | 0 | 0 | 0 | 0 |
| `css/design_tokens.css` | active extension UI token CSS | 301 | 10361 | `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc` | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/device-auto-sync.css` | active extension Auto-sync dashboard CSS | 202 | 15100 | `9cbe4a611981f2ef4e153d153bbf24d1831edd07e4094e1624e1c0f7397f6201` | 114 | 3 | 6 | 0 | 0 | 0 | 3 | 0 | 3 |
| `css/filter.css` | packaged quarantined content CSS | 74 | 2412 | `e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032` | 6 | 12 | 5 | 5 | 6 | 0 | 0 | 0 | 0 |
| `css/layout.css` | packaged quarantined content CSS | 803 | 28581 | `9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941` | 86 | 353 | 11 | 62 | 126 | 6 | 0 | 0 | 0 |
| `css/page-tones.css` | active extension page tone CSS | 571 | 26074 | `85e7828385dc86dc40228abe39cd28393c8df31409edc68e4181fab196f0b45f` | 57 | 4 | 2 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/popup.css` | active extension popup CSS | 1259 | 32376 | `c388d39fab962528365711baa0bfe953ed84ca660ac6123571f79b2c4be820c5` | 197 | 5 | 3 | 0 | 0 | 0 | 2 | 0 | 1 |
| `css/serene-shell.css` | active extension shell CSS | 9597 | 264911 | `298de9d76c480186c923ebf40e0a3e0b0981c0b4eeb5b09293aa26b7066938c8` | 1322 | 59 | 27 | 0 | 0 | 0 | 28 | 2 | 8 |
| `css/tab-view.css` | active extension dashboard CSS | 5784 | 145377 | `29f581698f473e74936917089764b2df40a9f1a3f83984a284ad7f6826cec8b8` | 848 | 25 | 22 | 0 | 0 | 0 | 21 | 5 | 6 |
| `css/video-notes.css` | active extension private Notes editor CSS | 127 | 5270 | `da72df5db2d9ad321927cb710d8d48d01dc0127f656da11b920b7049c22ac388` | 59 | 1 | 2 | 0 | 0 | 0 | 3 | 0 | 1 |
| `website/app/globals.css` | website-only global CSS | 800 | 24719 | `d90ac06ae5ba0ce4415eea79eb8dc4ed2479ef32081c5a3962944dc2bc29ad10` | 154 | 0 | 1 | 0 | 0 | 0 | 2 | 1 | 0 |

Remeasured after merging the local playlists work into master: `css/tab-view.css` adds the read-only FilterTube playlists list and `css/serene-shell.css` keeps the compact dashboard preview row. No quarantined CSS is activated and no manifest changed. Counts are lexical evidence only.

## YouTube Kids profiles - 2026-11-02

Current totals: 12 CSS files, 22,047 counted source lines; 624,546 bytes, 3,209 lexical rule blocks.

| File | Classification | Lines | Bytes | SHA256 | Rules | Important | Display none | Old reveal selectors | Visible tokens | Hidden tokens | Media | Keyframes | Hidden attribute |
| --- | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `css/components.css` | active extension UI shared CSS | 1966 | 52694 | `f7aefe9b0400f0427bbbd8dc52c9dfc7ccd675847d28e6555c564426a29e5036` | 283 | 48 | 2 | 0 | 0 | 0 | 7 | 1 | 1 |
| `css/content.css` | packaged quarantined content CSS | 385 | 12890 | `442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b` | 45 | 113 | 6 | 5 | 35 | 0 | 0 | 0 | 0 |
| `css/design_tokens.css` | active extension UI token CSS | 301 | 10361 | `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc` | 12 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/device-auto-sync.css` | active extension Auto-sync dashboard CSS | 202 | 15100 | `9cbe4a611981f2ef4e153d153bbf24d1831edd07e4094e1624e1c0f7397f6201` | 114 | 3 | 6 | 0 | 0 | 0 | 3 | 0 | 3 |
| `css/filter.css` | packaged quarantined content CSS | 74 | 2412 | `e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032` | 6 | 12 | 5 | 5 | 6 | 0 | 0 | 0 | 0 |
| `css/layout.css` | packaged quarantined content CSS | 803 | 28581 | `9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941` | 86 | 353 | 11 | 62 | 126 | 6 | 0 | 0 | 0 |
| `css/page-tones.css` | active extension page tone CSS | 571 | 26074 | `85e7828385dc86dc40228abe39cd28393c8df31409edc68e4181fab196f0b45f` | 57 | 4 | 2 | 0 | 0 | 0 | 1 | 0 | 0 |
| `css/popup.css` | active extension popup CSS | 1325 | 33895 | `da90e7288eca25b5bcf667d6fd51a500f424c2e89e462f543df9c39de7405cfb` | 206 | 5 | 4 | 0 | 0 | 0 | 2 | 0 | 1 |
| `css/serene-shell.css` | active extension shell CSS | 9597 | 264911 | `298de9d76c480186c923ebf40e0a3e0b0981c0b4eeb5b09293aa26b7066938c8` | 1322 | 59 | 27 | 0 | 0 | 0 | 28 | 2 | 8 |
| `css/tab-view.css` | active extension dashboard CSS | 5896 | 147639 | `492dcbc8747f29572ea804d407e7064fc7aeaf5ab4e9d2bf0f4002900d34b46d` | 865 | 25 | 23 | 0 | 0 | 0 | 21 | 5 | 6 |
| `css/video-notes.css` | active extension private Notes editor CSS | 127 | 5270 | `da72df5db2d9ad321927cb710d8d48d01dc0127f656da11b920b7049c22ac388` | 59 | 1 | 2 | 0 | 0 | 0 | 3 | 0 | 1 |
| `website/app/globals.css` | website-only global CSS | 800 | 24719 | `d90ac06ae5ba0ce4415eea79eb8dc4ed2479ef32081c5a3962944dc2bc29ad10` | 154 | 0 | 1 | 0 | 0 | 0 | 2 | 1 | 0 |

`css/tab-view.css` adds the YouTube Kids profiles card in Kids Mode and `css/popup.css` adds the compact profile chips shown on youtubekids.com. No quarantined CSS is activated and no manifest content script changed. Counts are lexical evidence only.
