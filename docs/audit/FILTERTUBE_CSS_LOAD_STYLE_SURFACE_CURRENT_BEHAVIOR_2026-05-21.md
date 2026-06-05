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

Tracked source currently contains 9 CSS files, 11,222 counted source lines,
300,154 bytes, 1,569 lexical rule blocks, 593 `!important` declarations, 47
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
| `css/tab-view.css` | active extension dashboard CSS | 2,922 | 70,854 | `355c9c8f69d4714aff9042b7988d5606634ec6bc413224e2bb4511950b8bf282` |
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
| `css/tab-view.css` | 435 | 24 | 14 | 0 | 0 | 0 | 12 | 4 | 2 |
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
