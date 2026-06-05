# FilterTube Extension UI CSS Page-State Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged. This
is not a CSS cleanup, UI redesign, generated-shell rebuild, manifest change, or
visual-regression approval.

## Purpose

This addendum moves the open extension UI CSS rows one step beyond load
topology. The earlier CSS surface register proves which CSS files load and
which YouTube content styles remain quarantined; this slice pins the active
popup/dashboard CSS state surface that still needs visual, responsive,
accessibility, motion, generated-shell parity, and runtime-state owner proof
before any UI CSS can be merged, deleted, regenerated, or treated as a behavior
contract.

## Selected Source Surface

This slice covers 15 selected source files: 5 active extension UI CSS files, 2
extension HTML pages, 3 generated-shell source files, 2 generated-shell output
files, and 3 hand-owned UI runtime files. It intentionally excludes the
quarantined content CSS files because their default-hide/reveal risk is already
covered by the CSS load/style surface and style-hide authority audits.

| Path | Role | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `css/design_tokens.css` | active extension token CSS | 301 | 10,361 | `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc` |
| `css/components.css` | active extension component CSS | 1,686 | 45,567 | `db01d30c717e34c108e48d92807ce3df4bcafccace62a1808d86d03ed7047ebc` |
| `css/popup.css` | active popup CSS | 1,151 | 29,731 | `812cb4ba8b4c9be732bd8a2a6f7b06b5d8d0a8c3fb7416f391f475ae627d45fa` |
| `css/tab-view.css` | active dashboard CSS | 2,986 | 72,211 | `3d07057381c63e2d3d117b6be466eb31eeb35df80f00747403f79fb0f28efdce` |
| `css/serene-shell.css` | active generated-shell CSS | 3,414 | 87,230 | `785e988dd0176b16defcc08f77925de8eaa60ea831d53cd57147eb601c490f0a` |
| `html/popup.html` | popup loader shell | 31 | 1,213 | `c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31` |
| `html/tab-view.html` | dashboard loader shell | 1,600 | 136,305 | `5124626e39cd3879da6593bc9bfa8287f0ad5b9ae29dcbb075d9e5bce0389d0b` |
| `src/extension-shell/popup.jsx` | popup generated-shell source | 113 | 3,864 | `3a3772e7d77f8466fea609a80c1d4f09873e47022aee17f3b8b09858397b298c` |
| `src/extension-shell/tab-view-decor.jsx` | dashboard ambient-shell source | 34 | 1,101 | `354cd36fa62b215a415e88b8b0c84bd43725196613766d6af921eac44d1f63f1` |
| `src/extension-shell/shared/runtime.js` | shell environment source | 52 | 1,462 | `d54cc87b8f48736df6ca063fa79e37b2439b580710746e215e8b428fc7207ec8` |
| `js/ui-shell/popup-shell.js` | generated popup shell output | 374 | 21,080 | `dc750d44dd4b9fde63b85b4dfc9f5ce9ba76964afbd6dfcedc7b3b7cce084b05` |
| `js/ui-shell/tab-view-decor.js` | generated dashboard ambient output | 323 | 18,289 | `234171091e523aa5de4c3c0f97e7341c55893bdd31b3e25a075490170fa9742f` |
| `js/popup.js` | hand-owned popup runtime | 1,841 | 75,587 | `cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a` |
| `js/tab-view.js` | hand-owned dashboard runtime | 14,926 | 695,872 | `5cdae945aca165b11af3c3f9fc246e89da3ce6780939013081e5d035b4163323` |
| `js/managed_parent_command_center.js` | hand-owned managed parent command-center runtime | 296 | 14,757 | `23138da6164f82b507f355cae5cd4d594d78222cec3023f0f5c98d5fcd6514a6` |

## Active CSS State Counters

The 5 active extension UI CSS files currently total 9,538 counted source lines,
245,100 bytes, 1,372 lexical rule blocks, 115 `!important` declarations, 25
`display:none` declarations, 36 `@media` blocks, 6 `@keyframes` blocks, 3
`[hidden]` selectors, 16 `:focus-visible` selectors, 134 `:hover` selectors,
255 dark-theme selector prefixes, 331 `data-theme` tokens, 54 `data-surface`
tokens, 7 `data-scene` tokens, 12 `aria-` selector tokens, 47 `.active`
selectors, 1 `.show` selector, 0 `.hidden` selectors, 56 `transition`
declarations, 91 `transform` declarations, 38 `z-index` declarations, 26
`pointer-events:none` declarations, 32 overflow-hidden declarations, and 1
`prefers-reduced-motion` token.

| Path | Rules | `!important` | `display:none` | `@media` | `@keyframes` | `[hidden]` | `:focus-visible` | `:hover` | dark prefix | `data-theme` | `data-surface` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `css/design_tokens.css` | 12 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 5 | 0 |
| `css/components.css` | 240 | 47 | 1 | 5 | 1 | 0 | 1 | 49 | 53 | 53 | 0 |
| `css/popup.css` | 182 | 5 | 3 | 2 | 0 | 1 | 3 | 23 | 52 | 75 | 0 |
| `css/tab-view.css` | 444 | 24 | 14 | 12 | 4 | 2 | 1 | 28 | 26 | 74 | 0 |
| `css/serene-shell.css` | 494 | 39 | 7 | 16 | 1 | 0 | 11 | 34 | 124 | 124 | 54 |

## Loader And Shell Coupling

- `html/popup.html` loads `../css/design_tokens.css`,
  `../css/components.css`, `../css/popup.css`, `../css/serene-shell.css`, then
  the Google Fonts URL. It has 1 static id: `popupRoot`.
- `html/tab-view.html` loads `../css/design_tokens.css`,
  `../css/components.css`, `../css/tab-view.css`,
  `../css/serene-shell.css`, then the Google Fonts URL. It has 106 static ids
  and 9 `data-tab` values.
- `html/popup.html` loads 9 scripts and places `../js/ui-shell/popup-shell.js`
  before `../js/popup.js`.
- `html/tab-view.html` loads 16 scripts and places
  `../js/ui-shell/tab-view-decor.js`,
  `../js/managed_admin_authority.js`, and
  `../js/managed_parent_command_center.js` before `../js/tab-view.js`.
- `src/extension-shell/shared/runtime.js` sets `root.dataset.scene`,
  `root.dataset.theme`, `root.dataset.surface`, `body.dataset.surface`,
  `body.classList.add("ft-extension-surface")`, and popup inline width values
  of `392px`.
- `src/extension-shell/popup.jsx` and `js/ui-shell/popup-shell.js` supply 13
  `ft-popup-shell` tokens and 1 `homepage_hero_day.mp4` token each.
- `src/extension-shell/tab-view-decor.jsx` and
  `js/ui-shell/tab-view-decor.js` supply 11 `ft-tab-view-ambient` tokens and 1
  `homepage_hero_day.mp4` token each.
- `js/popup.js` currently supplies 1 `ft-enabled` token, 1 `ft-disabled`
  token, 2 `is-locked` tokens, 2 `aria-expanded` tokens, and 2 `aria-pressed`
  tokens.
- `js/tab-view.js` currently supplies 2 `is-locked` tokens, 2 `aria-expanded`
  tokens, and 8 `aria-pressed` tokens.

## Current Behavior Pinned

The active UI CSS is loaded only by extension pages, but its state surface is
not static HTML. Popup shell classes, dashboard ambient classes, theme, scene,
surface, lock, enabled/disabled, active-tab, profile dropdown, hidden, hover,
focus, reduced-motion, and responsive states are split across generated shell
source, generated shell output, hand-owned popup/dashboard runtime code, and
CSS selectors.

This is a reliability and code-burden risk, not a permission to rewrite CSS:
static HTML cannot prove page-state coverage, generated output freshness is not
expressed as a manifest, CSS transition/motion counters are not tied to a
budget, and visual/accessibility/responsive proof is still missing for popup
and dashboard state changes.

## Missing Authority Symbols

No product runtime, generated shell source/output, CSS source, HTML source, or
build source currently defines:

```text
extensionUiCssPageStateAuthority
extensionUiCssStateSelectorReport
extensionUiCssShellStateParityReport
extensionUiCssResponsiveFixtureReport
extensionUiCssAccessibilityFixtureReport
extensionUiCssMotionBudgetReport
extensionUiCssVisualRegressionReport
extensionUiCssGeneratedShellParityGate
extensionUiCssThemeScenePolicy
extensionUiCssRuntimeStateOwnerReport
extensionUiCssFixtureProvenance
```

## Completion Boundary

This addendum does not close the active extension UI CSS rows. It proves the
current popup/dashboard CSS page-state surface and preserves the implementation
gate: future UI CSS work still needs generated source-output parity manifests,
browser visual fixtures, responsive and accessibility checks, reduced-motion
proof, theme/scene policy, runtime state owner reports, and fixture provenance
before any CSS merge, deletion, rebuild, or design claim can be treated as
implementation-ready.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6166
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6166
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
