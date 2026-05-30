# FilterTube Live Chat DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, restore
patch, live chat behavior patch, JSON filter patch, or settings patch.

This slice follows the JSON-first `hideLiveChat` proof and isolates the direct
DOM/style cleanup boundary in `js/content/dom_fallback.js`. Today the live chat
toggle is implemented as a content-control CSS branch: it emits live chat frame
and container selectors into the shared style node, relies on the style
lifecycle to rewrite the rule set, and does not write a feature-local DOM
marker.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |

## Boundary Counts

```text
live-chat DOM cleanup boundary source files: 1
live-chat DOM cleanup source/effect blocks: 6
runtime live-chat DOM cleanup fixtures: 6
ensureContentControlStyles block lines: 345
ensureContentControlStyles block bytes: 12583
live-chat CSS block lines: 8
live-chat CSS block bytes: 195
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 21
disabled cleanup branch bytes: 959
live-chat CSS rules.push callsites: 1
live-chat CSS display-none declarations: 1
live-chat CSS selector rows: 2
live-chat CSS frame selector tokens: 1
live-chat CSS container selector tokens: 1
ensureContentControlStyles hideLiveChat references: 1
ensureContentControlStyles style.textContent writes: 1
ensureContentControlStyles Open App direct cleanup calls: 1
active DOM fallback hideLiveChat references: 1
clear-stale cleanup hideLiveChat references: 0
disabled cleanup hideLiveChat references: 0
clear-stale cleanup live-chat marker references: 0
disabled cleanup live-chat marker references: 0
product runtime live-chat marker references: 0
product runtime hideLiveChat tokens: 2
product runtime ytd-live-chat-frame#chat tokens: 1
product runtime #chat-container tokens: 1
product runtime #secondary.ytd-watch-flexy tokens: 1
product runtime #related tokens: 1
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| CSS branch | `settings.hideLiveChat` pushes one CSS rule block into the shared content-control style node. | Live chat hiding is style-owned rather than a JSON watch-next engagement-panel decision or marker-owned DOM decision. |
| Selector set | The branch hides `ytd-live-chat-frame#chat` and `#chat-container`. | The selector pair spans desktop frame and container surfaces without a target-shape report for engagement panels, mobile hosts, or chat-only containers. |
| Style lifecycle | `style.textContent = rules.join('\n')` rewrites the shared style node on each active style-writer pass. | Restore is a full style regeneration effect, not a per-node marker restore. |
| Open App coupling | The same writer calls `hideYouTubeOpenAppButtons()` after rewriting CSS. | Live chat style refresh also triggers unrelated mobile app-shell cleanup work. |
| List mode | The live chat branch is not gated by whitelist mode. | Whitelist behavior requires explicit policy before changing selector or mode semantics. |
| `:has()` support | Live chat selectors do not depend on the `supportsHasSelector` branch. | Browser support checks cannot be used as proof that live chat selectors are disabled or scoped. |
| Active work | `hasActiveDOMFallbackWork()` treats `hideLiveChat` as active DOM fallback work. | This can keep DOM fallback active even though JSON active-work predicates omit the feature. |
| Stale cleanup | Stale cleanup has no `hideLiveChat` or live chat marker reference. | There is no feature-local stale cleanup budget for this CSS-only effect. |
| Disabled cleanup | Disabled cleanup has no `hideLiveChat` or live chat marker reference. | Turning the extension off relies on shared style blanking, not a feature-local restore owner. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Enabling `hideLiveChat` writes the current live chat frame and container
   selectors into the shared style node, sets route attributes, and calls the
   Open App cleanup.
4. Toggling the setting off reuses the shared style node and removes the live
   chat selector rows while retaining unconditional Open App CSS.
5. Whitelist mode and unsupported `:has()` do not suppress the live chat CSS
   branch when `hideLiveChat` is true.
6. Product runtime source has no live chat feature marker or future live chat
   DOM cleanup authority symbols.

## Risk Interpretation

- Reliability: the feature has settings and DOM active-work coverage, but no
  JSON decision, DOM marker, or per-node restore proof.
- False-hide/leak: watch-next live chat JSON rows can leak before DOM styling
  applies, while selector-only hiding can remove any matching chat frame or
  container without renderer provenance.
- Performance: a live chat toggle keeps the broad DOM fallback style writer
  active and also runs Open App cleanup on each style-writer pass.
- Code burden: settings, JSON omission, DOM active work, style regeneration,
  selector ownership, and app-shell cleanup coupling remain split.

## Non-Completion Boundary

This does not close live chat DOM cleanup. Product runtime source still lacks a
DOM cleanup contract, decision report, style selector policy, target-shape
report, route policy, chat surface report, restore proof, stale cleanup budget,
disabled-state restore proof, metric artifact, and JSON/DOM parity gate. The
following symbols are intentionally absent from product runtime source today:

```text
liveChatDomCleanupBoundaryContract
liveChatDomCleanupDecisionReport
liveChatDomCleanupStyleSelectorPolicy
liveChatDomCleanupTargetShapeReport
liveChatDomCleanupRoutePolicy
liveChatDomCleanupChatSurfaceReport
liveChatDomCleanupRestoreProof
liveChatDomCleanupStaleCleanupBudget
liveChatDomCleanupDisabledRestoreProof
liveChatDomCleanupMetricArtifact
liveChatDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/live-chat-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
