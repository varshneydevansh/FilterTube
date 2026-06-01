# FilterTube JSON-First Uppercase Title Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, content-filter patch,
DOM fallback patch, or settings schema patch.

This slice promotes the JSON-first content-filter audit into uppercase-title
proof. It isolates how the uppercase title heuristic currently crosses settings
defaults, compiled background settings, seed active-work predicates, JSON engine
content-filter decisions, non-video renderer scope, and DOM fallback activation.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |

## Boundary Counts

```text
uppercase title boundary source files: 4
uppercase title source/effect blocks: 9
filter_logic content filter defaults block lines: 6
filter_logic content filter defaults block bytes: 395
filter_logic content filter merge block lines: 19
filter_logic content filter merge block bytes: 1098
filter_logic check content filters block lines: 155
filter_logic check content filters block bytes: 7747
filter_logic uppercase-title method block lines: 31
filter_logic uppercase-title method block bytes: 1342
seed active content-filter predicate block lines: 12
seed active content-filter predicate block bytes: 393
DOM fallback active content-filter predicate block lines: 11
DOM fallback active content-filter predicate block bytes: 395
DOM fallback loop content-filter predicate block lines: 18
DOM fallback loop content-filter predicate block bytes: 906
DOM fallback shouldHideContent tail block lines: 303
DOM fallback shouldHideContent tail block bytes: 15752
background content filter default block lines: 6
background content filter default block bytes: 390
filter_logic total uppercase tokens: 11
filter_logic total _checkUppercaseTitle tokens: 2
filter_logic total contentFilters tokens: 7
DOM fallback total uppercase tokens: 2
DOM fallback total _checkUppercaseTitle tokens: 0
DOM fallback total contentFilters tokens: 18
seed total uppercase tokens: 1
seed total contentFilters tokens: 4
background total uppercase tokens: 1
background total contentFilters tokens: 9
runtime uppercase-title fixtures: 8
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Settings defaults | `js/filter_logic.js` and `js/background.js` both default `contentFilters.uppercase` to disabled `single_word` mode with `minWordLength: 2`. | Versioned uppercase-title settings validity report shared across compile and runtime. |
| Settings merge | `processSettings()` merges incoming `contentFilters.uppercase` over the default object without validating mode or numeric range. | Uppercase-title settings normalization contract with invalid-value decisions. |
| Seed active work | `hasNetworkJsonWork()` and `shouldSkipEngineProcessing()` treat `contentFilters.uppercase.enabled` as active JSON work, so uppercase mode bypasses empty-install pass-through and disables engine no-work skipping. | No-work budget that distinguishes JSON-enforceable filters from DOM-only wakeups. |
| JSON engine scope | `_checkContentFilters()` only runs uppercase decisions for the video/content renderer allowlist. Channel-only renderers skip uppercase title filtering. | Renderer-scope policy for content filters. |
| JSON heuristic | `_checkUppercaseTitle()` has `single_word`, `all_caps`, and `both` modes. It replaces punctuation with spaces for word extraction, strips only ASCII letters for all-caps checks, and requires uppercase words to be ASCII-letter-only. | Decision report showing mode, token, alphabet policy, and matched title field. |
| Length fallback | `const minLength = settings.minWordLength || 2` means `0`, empty string, and other falsy values fall back to 2. | Settings validity report for zero, missing, and non-numeric thresholds. |
| DOM active predicates | `hasActiveDOMFallbackWork()` and the DOM fallback main loop both count uppercase enabled as active content-filter work. | DOM parity report explaining whether uppercase should wake DOM fallback. |
| DOM enforcement | `shouldHideContent()` contains no `uppercase` token and has no `_checkUppercaseTitle()` equivalent, so DOM fallback can be active for uppercase without enforcing uppercase hides. | Shared JSON/DOM uppercase decision policy. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- `single_word` mode hides a video title with a standalone uppercase ASCII word.
- lowercase words remain visible under `single_word`.
- non-ASCII uppercase-looking words such as `ETE` with accents are not treated
  as uppercase words by the ASCII-only heuristic.
- `all_caps` mode hides all-ASCII uppercase titles and allows mixed-case titles
  even when one word is uppercase.
- `both` mode can hide either an all-caps title or a single uppercase word.
- `minWordLength` controls standalone uppercase word matching, while
  `minWordLength: 0` falls back to 2.
- channel-only renderers skip uppercase content filtering.
- DOM fallback has uppercase active predicates but no uppercase enforcement
  branch in `shouldHideContent()`.

## Risk Interpretation

- Reliability: settings can wake JSON and DOM work while enforcement exists only
  in the JSON content-filter path.
- False-hide/leak: uppercase filtering can hide JSON video renderers while DOM
  fallback cards with equivalent titles remain visible.
- Performance: uppercase enabled disables no-work skipping and activates DOM
  fallback work even though DOM `shouldHideContent()` cannot enforce it.
- Code burden: defaults, compile, active-work predicates, JSON enforcement, and
  DOM activation are split across four files without one decision contract.

## Non-Completion Boundary

This does not close JSON-first uppercase-title filtering. Product runtime source
still lacks first-class uppercase title contracts, decision reports, boundary
policies, DOM parity reports, locale/alphabet policies, renderer-scope reports,
no-work budgets, fixture provenance, metric artifacts, and settings validity
reports. The following symbols are intentionally absent from product runtime
source today:

```text
jsonFirstUppercaseTitleContract
jsonFirstUppercaseDecisionReport
jsonFirstUppercaseBoundaryPolicy
jsonFirstUppercaseDomParityReport
jsonFirstUppercaseLocalePolicy
jsonFirstUppercaseRendererScope
jsonFirstUppercaseNoWorkBudget
jsonFirstUppercaseFixtureProvenance
jsonFirstUppercaseMetricArtifact
jsonFirstUppercaseSettingsValidityReport
```

## Validation

```text
node --test tests/runtime/json-first-uppercase-title-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
