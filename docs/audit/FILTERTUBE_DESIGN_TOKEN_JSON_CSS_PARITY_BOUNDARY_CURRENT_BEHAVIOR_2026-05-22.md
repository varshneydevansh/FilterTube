# FilterTube Design Token JSON CSS Parity Boundary - Current Behavior - 2026-05-22

Status: audit-only proof. This is not an implementation patch.
Runtime behavior is unchanged.

## Scope

This slice audits the tracked design-token JSON path and its active CSS/package
boundary:

- `design/design_tokens.json`
- `css/design_tokens.css`
- `css/components.css`
- `css/popup.css`
- `css/tab-view.css`
- `html/popup.html`
- `html/tab-view.html`
- `html/troubleshoot.html`
- `build.js`
- `package.json`

This is not filter-engine JSON. It is a tracked JSON input that exercises the
same proof class required for first-class JSON promotion: schema, consumer
freshness, generated-output parity, package inclusion, no-dead-token budgets,
and fixture provenance.

## Pinned Facts

| Surface | Current evidence |
| --- | --- |
| JSON token input | `design/design_tokens.json` has 82 lines, 1,902 bytes, sha256 `57bada64f3690a22fedea5f07aadc029e129f971465f8c66baab4a005984b3f0`, 6 top-level keys, and 53 leaf values. Metadata is version `0.1.0`, updated `2025-11-18`, source `FilterTube neuroinclusive palette`. |
| Active CSS token file | `css/design_tokens.css` has 302 lines, 10,361 bytes, sha256 `7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc`. The base `:root` block has 136 selected lines and 80 unique `--ft-*` definitions. |
| Theme/scene overrides | The selected manual dark block has 43 lines and 35 `--ft-*` definitions. The selected auto dark media block has 45 lines and 35 `--ft-*` definitions. The selected scene block group has 62 lines and covers `dawn`, `day`, `sunset`, `night`, plus dark scene overrides for `dawn`, `sunset`, and `night`. |
| JSON-to-CSS value parity | A direct path-to-variable mapping covers 43 JSON leaves. All 43 mapped leaves have a CSS variable counterpart, but only 3 values match exactly; 40 mapped values diverge. |
| Active token references | Across 11 selected active UI files there are 715 `var(--ft-...)` references and 82 unique referenced variables. `css/components.css` contributes 176 references, `css/popup.css` 199, `css/tab-view.css` 336, and `html/tab-view.html` 4. |
| Undefined referenced variables | 29 unique referenced variables are not defined in `css/design_tokens.css`: `ft-category-color`, `ft-category-color-bg`, `ft-category-color-bg-active`, `ft-category-color-border`, `ft-color-bg-disabled`, `ft-color-bg-elevated`, `ft-color-bg-input`, `ft-color-bg-input-dark`, `ft-color-bg-panel-dark`, `ft-color-primary`, `ft-color-primary-alpha`, `ft-color-primary-light`, `ft-color-sem-neutral-border-dark`, `ft-color-text-primary-dark`, `ft-color-text-secondary-dark`, `ft-control-accent-border`, `ft-control-row-divider`, `ft-control-row-hover`, `ft-font-family-body`, `ft-font-size-xs`, `ft-kids-pink`, `ft-kids-pink-light`, `ft-kids-purple`, `ft-kids-purple-light`, `ft-popup-action-btn-width`, `ft-profile-accent`, `ft-profile-accent-bg`, `ft-profile-accent-border`, and `ft-space-xxs`. |
| Unreferenced CSS definitions | 27 unique CSS token definitions are not referenced by the selected active UI files. |
| Extension HTML loading | `html/popup.html` and `html/tab-view.html` both load `../css/design_tokens.css` before `components.css` and the page CSS. `html/troubleshoot.html` is empty and loads nothing. |
| Build/package boundary | The selected `build.js` configuration block has 26 lines, 904 bytes, sha256 `97fffd62025057cdfe51ab5a8a71b4dd41a71524617cf35eb791d1583f336fde`. `build.js` copies the `css` directory, but not the `design` directory. The same block now includes mobile artifact constants and text-file extension sets for release packaging, but `package.json` still has no script whose name or command mentions design tokens, and `build.js` does not reference `design/design_tokens.json`. |

Representative divergent mapped values:

- `colors.brand.primaryRed` maps to `--ft-color-brand-primary`: JSON `#FF2F2F`, CSS `#ab4438`.
- `colors.background.base` maps to `--ft-color-bg-base`: JSON `#F7F6F2`, CSS `#f6f2eb`.
- `colors.text.primary` maps to `--ft-color-text-primary`: JSON `#1F1F1F`, CSS `#1b1a18`.
- `typography.fontFamily` maps to `--ft-font-family-base`: JSON uses `Inter`/`Open Sans`, CSS uses `Plus Jakarta Sans`.
- `spacing.md` maps to `--ft-space-md`: JSON `12px`, CSS `16px`.
- `radiuses.pill` maps to `--ft-radius-pill`: JSON `999px`, CSS `9999px`.
- `shadows.elevated` maps to `--ft-shadow-elevated`: JSON `0 10px 25px rgba(15, 23, 42, 0.12)`, CSS `0 30px 80px -40px rgba(60, 42, 33, 0.24)`.

## Current Risks

1. The tracked JSON token file is not the active CSS generator. The active
   extension pages load CSS variables from `css/design_tokens.css`, while the
   build copies `css` and omits `design`.
2. JSON metadata can claim a design-token source/version/date without proving
   that the active CSS uses that version.
3. CSS token references include undefined variables. Several have fallbacks in
   local declarations, but there is no repository-wide undefined-token budget or
   visual fixture proving that missing variables are harmless.
4. CSS token definitions include unused active-scope variables. Some are
   reasonable theme/scene reserves, but there is no deletion-readiness or
   generated-token report that separates intentional reserves from stale tokens.
5. This JSON path is a public UI design input, not a filter rule input. It does
   not close first-class JSON filter readiness; it shows the same kind of schema,
   consumer, packaging, and drift proof a filter JSON path would need before
   promotion.

## Missing Future Authority Symbols

The following symbols do not exist in selected product source yet:

- `designTokenJsonCssParityContract`
- `designTokenJsonSchemaReport`
- `designTokenCssGenerationReport`
- `designTokenCssReferenceReport`
- `designTokenUndefinedVarReport`
- `designTokenUnusedVarBudget`
- `designTokenPackageInclusionReport`
- `designTokenHtmlLoadReport`
- `designTokenThemeSceneParityReport`
- `designTokenFirstClassJsonClaimGate`
- `designTokenVisualFixtureProvenance`
- `designTokenDeletionReadinessGate`

## Completion Boundary

This closes only the current-behavior proof slice for the design-token JSON/CSS
parity boundary. It does not close package artifact proof, visual regression
proof, accessibility proof, generated-token freshness, deletion readiness,
website/native parity, or first-class JSON filter promotion rows. Implementation
changes remain blocked.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
