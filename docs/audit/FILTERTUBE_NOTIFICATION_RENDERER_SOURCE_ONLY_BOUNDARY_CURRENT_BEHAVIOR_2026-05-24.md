# FilterTube Notification Renderer Source-Only Boundary Current Behavior - 2026-05-24

Status: audit-only current-behavior source slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice separates direct source coverage from fixture-backed route coverage
for `notificationRenderer`. The product runtime has a direct
`FILTER_RULES.notificationRenderer` entry and synthetic harness behavior can
hide notification rows by keyword or channel identity. That is not the same as
proving real YouTube notification/bell route behavior: the committed capture
fixtures currently have no real `notificationRenderer` row.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Evidence

| Evidence | Current value |
| --- | --- |
| Runtime rule | `js/filter_logic.js` has `FILTER_RULES.notificationRenderer` |
| Inventory claim | `docs/youtube_renderer_inventory.md` marks `notificationRenderer` / `<ytd-notification-renderer>` as covered |
| Fixture corpus | `tests/runtime/fixtures/captures/*` has zero `notificationRenderer` fixture rows |
| Related setting proof | `docs/audit/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` proves `hideNotificationBell` is not a JSON notification-row decision |

The current direct rule reads:

```text
title.simpleText
title.runs
shortMessage.simpleText
shortMessage.runs
longMessage.simpleText
longMessage.runs
sentTimeText.simpleText
navigationEndpoint.browseEndpoint.browseId
feedbackButton.buttonRenderer.navigationEndpoint.browseEndpoint.browseId
navigationEndpoint.browseEndpoint.canonicalBaseUrl
navigationEndpoint.commandMetadata.webCommandMetadata.url
```

## Current Synthetic Behavior Matrix

| Mode | Current result | Risk pinned |
| --- | --- | --- |
| No rule | Preserves a synthetic notification row and queues a channel-map side effect when browse id and handle fields are present. | Direct rule extraction and map side effects exist without route fixture proof. |
| Blocklist keyword | Removes a synthetic notification row when title/short-message text matches. | Keyword filtering is source-backed for this renderer. |
| Blocklist channel | Removes a synthetic notification row when browse id/handle matches. | Channel filtering is source-backed for this renderer. |
| Whitelist channel | Preserves a synthetic notification row when browse id/handle matches. | Whitelist behavior exists synthetically, but lacks route fixture proof. |
| `hideNotificationBell` | Preserves the synthetic JSON notification row. | Notification bell hiding remains a DOM/topbar concern today, not notification-row JSON authority. |

## Optimization Implication

Do not treat the inventory `covered` wording as route-complete proof. Any future
notification optimization still needs a real notification capture with route,
surface, list mode, sibling preservation, disabled/no-rule behavior, map
side-effect budget, and DOM/topbar parity evidence.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
notificationRendererRouteFixtureContract
notificationRendererDecisionReport
notificationRendererInventoryCoveragePolicy
notificationRendererMapSideEffectBudget
notificationRendererHideBellParityGate
notificationRendererWhitelistPolicy
notificationRendererNoRuleBudget
notificationRendererJsonFirstGate
```
