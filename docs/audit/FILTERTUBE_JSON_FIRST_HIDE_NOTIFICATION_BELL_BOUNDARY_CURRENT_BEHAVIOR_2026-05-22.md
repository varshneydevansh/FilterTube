# FilterTube JSON-First Hide Notification Bell Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, notification-bell filtering patch, selector patch, cache
patch, or JSON renderer expansion.

This slice promotes the JSON-first feature audit into `hideNotificationBell`
proof. It pins the current code path where the setting is compiled and
refreshed, the DOM fallback owns the visible topbar bell hide, and notification
JSON remains governed by ordinary renderer rules rather than a first-class
notification-bell decision.

## Boundary Source Files

hideNotificationBell boundary source files: 6

hideNotificationBell source/effect blocks: 10

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 651 | 26462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |

## Pinned Source Counts

filter_logic notificationRenderer rule block lines: 17

filter_logic notificationRenderer rule block bytes: 899

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback notification-bell CSS rules block lines: 8

DOM fallback notification-bell CSS rules block bytes: 248

DOM fallback active boolean keys block lines: 28

DOM fallback active boolean keys block bytes: 905

background storage read keys block lines: 44

background storage read keys block bytes: 1408

background boolean pass-through block lines: 35

background boolean pass-through block bytes: 3596

background storage refresh keys block lines: 16

background storage refresh keys block bytes: 461

settings_shared settings keys block lines: 38

settings_shared settings keys block bytes: 1031

settings_shared notification-bell compile block lines: 2

settings_shared notification-bell compile block bytes: 102

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideNotificationBell tokens: 0

seed total hideNotificationBell tokens: 0

DOM fallback total hideNotificationBell tokens: 2

background total hideNotificationBell tokens: 12

settings_shared total hideNotificationBell tokens: 23

bridge_settings total hideNotificationBell token: 1

filter_logic total notificationRenderer tokens: 1

seed total notificationRenderer tokens: 0

DOM fallback total ytd-notification-topbar-button-renderer tokens: 1

DOM fallback total ytd-notification-topbar-button-shape-renderer tokens: 1

runtime hideNotificationBell fixtures: 6

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| JSON notification-bell decision | `js/filter_logic.js` has no `hideNotificationBell` token and no direct `notificationTopbarButtonRenderer` decision. Topbar notification button JSON passes through unchanged when only `hideNotificationBell` is enabled. | A `hideNotificationBell` contract that separates topbar bell controls from notification feed rows, inbox rows, account menu rows, mobile buttons, and ordinary renderer filtering. |
| JSON notification renderer traversal | `filter_logic.js` has a `notificationRenderer` extraction rule. Ordinary keyword rules can remove a matching `notificationRenderer` row, but that removal is not owned by `hideNotificationBell`. | A renderer inventory policy that classifies notification feed rows separately from topbar bell controls and proves expected allow/block behavior by route. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideNotificationBell`. `/youtubei/v1/next` now bypasses `processData` with only `hideNotificationBell` enabled because the no-active-JSON-work gate now passes through watch-next payloads. | A route no-work budget that proves when `/next`, `/browse`, `/search`, `/guide`, and `/player` may parse/stringify, harvest only, mutate, or pass through for bell-only settings. |
| DOM fallback | DOM fallback owns the visible hide with `ytd-notification-topbar-button-renderer` and `ytd-notification-topbar-button-shape-renderer`. The broad DOM boolean gate also treats `hideNotificationBell` as active work. | A JSON/DOM parity report for desktop topbar bell, mobile top app bar, account flyout notification controls, and native YouTube surfaces. |
| Background compile and invalidation | Background storage reads and compiles `hideNotificationBell`. Background storage-change invalidation does not include `hideNotificationBell` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideNotificationBell` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideNotificationBell`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Proof

Topbar notification button JSON and ordinary neighboring rows pass through
unchanged when only `hideNotificationBell` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only
`hideNotificationBell` enabled.

The runtime fixture proves:

1. Topbar notification button JSON and notification renderer rows pass through
   unchanged when only `hideNotificationBell` is enabled.
2. Ordinary keyword rules can remove a matching `notificationRenderer` row
   while topbar notification button JSON remains.
3. `/youtubei/v1/next` now bypasses `processData` with only
   `hideNotificationBell` enabled, so the setting is not a no-work
   optimization boundary today.
4. `filter_logic.js` and seed active JSON rules have no hide-notification-bell
   decision.
5. Background reads and compiles the setting but storage-change invalidation
   omits it.
6. DOM fallback owns `ytd-notification-topbar-button-renderer` and
   `ytd-notification-topbar-button-shape-renderer`.

## Non-Completion Boundary

JSON-first hide-notification-bell filtering still needs hide-notification-bell
contracts, decision reports, renderer inventory policies, JSON/DOM
notification-bell parity reports, DOM-only policy reports, route no-work
budgets, cache invalidation reports, route policies, settings parity reports,
fixture provenance, metric artifacts, and first-class hide-notification-bell
authority gates.

No `jsonFirstHideNotificationBellContract`,
`jsonFirstHideNotificationBellDecisionReport`,
`jsonFirstNotificationBellRendererInventoryPolicy`,
`jsonFirstNotificationBellJsonDomParityReport`,
`jsonFirstNotificationBellDomOnlyPolicy`,
`jsonFirstNotificationBellNoWorkBudget`,
`jsonFirstNotificationBellCacheInvalidationReport`,
`jsonFirstNotificationBellRoutePolicy`,
`jsonFirstNotificationBellSettingsParityReport`,
`jsonFirstNotificationBellFixtureProvenance`, or
`jsonFirstNotificationBellMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
