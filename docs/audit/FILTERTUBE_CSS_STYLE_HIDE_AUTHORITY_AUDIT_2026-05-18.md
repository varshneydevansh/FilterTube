# FilterTube CSS / Style Hide Authority Audit - 2026-05-18

Status: current-behavior proof. This is not an implementation patch.

Purpose: distinguish live CSS/style hide behavior from packaged legacy CSS, so
false-hide investigations do not confuse inactive styles with runtime logic.

## Current Style Authority Map

| Surface | Loaded on YouTube today? | Hide model | Evidence | Risk |
| --- | --- | --- | --- | --- |
| Manifest content CSS | No. Current manifests load JS content scripts only and have no `content_scripts.css` entries. | None from manifest CSS. | `manifest.json`, `manifest.chrome.json`, `manifest.firefox.json`, `manifest.opera.json`; `tests/runtime/css-style-hide-authority-current-behavior.test.mjs` | Good current boundary, but must stay guarded. |
| Build-packaged `css/` directory | Yes, packaged by `build.js`, but not content-loaded by the manifests. | Includes legacy default-hide and old reveal-class CSS. | `build.js:30`; `css/filter.css`; `css/content.css`; `css/layout.css` | A future `insertCSS` or manifest CSS entry could instantly reintroduce broad default-hide behavior. |
| Legacy `filter.css` | Not manifest-loaded. | Hides many YouTube renderers by default until `.filter-tube-visible` exists. | `css/filter.css:9-35` | Empty installs would hide content if loaded without a complete reveal writer. |
| Legacy `content.css` | Not manifest-loaded. | Fallback default-hide plus `.filter-tube-visible` reveal and direct media hides. | `css/content.css:9-78` | Same default-hide risk plus old lockup/image hiding. |
| Legacy `layout.css` | Not manifest-loaded. | Heavy `:not(.filter-tube-visible)` Shorts/Mix/playlist layout hides. | `css/layout.css:509-803` | High false-hide risk if active; this file has many old reveal-class assumptions. |
| Runtime hide helper style | Yes, injected by content script. | `.filtertube-hidden` and `.filtertube-hidden-shelf` display-none plus pending metadata shimmer. | `js/content/dom_helpers.js:11-57` | Correct central model, but direct writers can bypass reason/restore metadata. |
| Runtime content-control style | Yes, created dynamically by DOM fallback. | Feature-driven CSS rules for open-app buttons, inline mobile search-result controls, home, playlist, Mix, members-only, watch UI, comments, end-screen, guide, etc. | `js/content/dom_fallback.js:1134-1524` | Broad selectors are valid only when tied to compiled active settings and route. |
| Fallback menu style | Yes, created dynamically by content bridge. | Button/popover styling, not content hiding. | `js/content_bridge.js:6067-6135` | Low hide risk; still part of style lifecycle ownership. |

## Class Model Drift

```text
legacy packaged CSS:
  default hide many renderers
  reveal with .filter-tube-visible

active runtime:
  leave content alone by default
  hide with .filtertube-hidden / .filtertube-hidden-shelf
```

That means the legacy CSS files are not just old styling; they encode the
opposite default behavior. They should remain quarantined unless a migration
explicitly rebuilds them around the current `.filtertube-hidden` model.

## Current Counts

| File | `display:none!important` count | `:not(.filter-tube-visible)` count | Meaning |
| --- | ---: | ---: | --- |
| `css/filter.css` | 5 | 5 | Default-hide legacy reveal model. |
| `css/content.css` | 6 | 5 | Fallback legacy reveal model. |
| `css/layout.css` | 11 | 62 | Aggressive legacy layout hide model. |
| `js/content/dom_helpers.js` | 2 | 0 | Current central hide class injection. |
| `js/content/dom_fallback.js` | 27 | 0 | Current dynamic content-control CSS. |
| `js/content_bridge.js` | 0 | 0 | Current fallback menu style, not content hide. |

## Required Guardrails

1. No manifest may add `content_scripts.css` for `css/filter.css`,
   `css/content.css`, or `css/layout.css` unless tests are flipped and the old
   reveal model is removed.
2. No release script may use `chrome.scripting.insertCSS` or equivalent for the
   legacy default-hide files without a proof fixture.
3. Runtime dynamic styles must be owned by a lifecycle registry:
   - `filtertube-style`
   - `filtertube-content-controls-style`
   - `filtertube-fallback-menu-style`
4. Every dynamic content-control selector must have a compiled setting, route,
   and restore policy. Members-only watch-page selectors and whole-surface
   selectors need especially strong false-hide fixtures.
5. Direct inline `display:none` writers should route through the shared hide
   decision contract or carry rollback metadata.

## Fix Direction

```text
source CSS package
        |
        +--> extension UI CSS: loaded only by extension pages
        +--> legacy YouTube CSS: packaged/quarantined only
        +--> runtime dynamic CSS:
              generated from compiledRuleState + route
              tracked by lifecycle registry
              cleared when disabled or route-inapplicable
```

The CSS problem is not that live manifests currently load old styles. They do
not. The problem is that old default-hide styles still ship in the package and
look plausible enough to be accidentally reintroduced later.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this CSS style hide authority can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
