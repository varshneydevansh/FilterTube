# FilterTube Synthetic Event/Action Register - 2026-05-20

Status: audit-only proof. Runtime behavior is unchanged. This is not an implementation patch.

This register pins active page-runtime source locations that synthesize browser
events or invoke DOM clicks. These paths matter for the user-review concern that
blocking may look like YouTube engagement: source code cannot prove YouTube's recommendation model, but it can prove where FilterTube can create observable
click, scroll, resize, readiness, or menu events.

## Register Boundary

Covered source files:

```text
js/content_bridge.js
js/content/dom_fallback.js
js/content/block_channel.js
js/injector.js
js/seed.js
js/content/bridge_settings.js
js/content/collab_dialog.js
js/content/first_run_prompt.js
js/content/release_notes_prompt.js
js/content/handle_resolver.js
js/content/dom_helpers.js
```

The scan covers direct `.click(` and `.dispatchEvent(` expressions in the
active page runtime. It intentionally excludes extension dashboard/popup UI,
website UI, generated UI shells, and vendor bundles because those are different
interaction surfaces with different user-action expectations.

## Current Counts

```text
page-runtime synthetic event/action writes: 18
direct click calls: 8
direct dispatchEvent calls: 10
files with direct synthetic actions: 5
```

## Current Direct References

| Reference | Action family | Current owner/effect |
| --- | --- | --- |
| `js/content_bridge.js:536` | `dispatchEvent` | Sends Escape into an open YouTube dropdown to close menu UI. |
| `js/content_bridge.js:538` | `dispatchEvent` | Sends Escape into the close-target node when YouTube wraps the visible dropdown. |
| `js/content_bridge.js:578` | `dispatchEvent` | Dispatches a synthetic click event to `ytd-app` as part of dropdown cleanup. |
| `js/content_bridge.js:2364` | `dispatchEvent` | Dispatches resize on a YouTube dropdown. |
| `js/content_bridge.js:2366` | `dispatchEvent` | Dispatches `iron-resize` on a YouTube popup. |
| `js/content/block_channel.js:2490` | `dispatchEvent` | Sends Escape into an injected menu dropdown during outside-pointer cleanup when the shared closer is unavailable. |
| `js/content/block_channel.js:3102` | `dispatchEvent` | Sends Escape into a dropdown when the source card is removed and the shared closer is unavailable. |
| `js/content/dom_fallback.js:776` | `click` | Opens a collapsed watch playlist panel. |
| `js/content/dom_fallback.js:875` | `click` | Clicks an alternate playlist target after current-watch owner blocking. |
| `js/content/dom_fallback.js:917` | `click` | Clicks the player next button after current-watch owner blocking. |
| `js/content/dom_fallback.js:2396` | `click` | Playlist navigation guard clicks an alternate playlist row/link. |
| `js/content/dom_fallback.js:2434` | `click` | Playlist navigation guard clicks a player next button. |
| `js/content/dom_fallback.js:3819` | `click` | Delayed playlist skip path clicks a next button. |
| `js/content/dom_fallback.js:4512` | `click` | Generic target-click helper path clicks a DOM target. |
| `js/injector.js:924` | `dispatchEvent` | Subscription import dispatches a scroll event after programmatic scrolling. |
| `js/injector.js:940` | `click` | Subscription import clicks a "show more" style button while importing subscriptions. |
| `js/injector.js:3572` | `dispatchEvent` | Injector readiness dispatches `filterTubeReady`. |
| `js/seed.js:1126` | `dispatchEvent` | Seed readiness dispatches `filterTubeSeedReady`. |

## Risk Classes

| Risk class | References | Why it matters |
| --- | --- | --- |
| `menu-cleanup-event` | `content_bridge.js:536`, `content_bridge.js:538`, `content_bridge.js:578`, `content_bridge.js:2364`, `content_bridge.js:2366`, `block_channel.js:2466`, `block_channel.js:3078` | Useful UI cleanup can still synthesize YouTube menu events and needs target, route, and user-action proof before cleanup changes. |
| `watch-playlist-navigation-click` | `dom_fallback.js:776`, `dom_fallback.js:875`, `dom_fallback.js:917`, `dom_fallback.js:2396`, `dom_fallback.js:2434`, `dom_fallback.js:3819` | Correct skip/block behavior can still look like navigation. It needs owner-confidence, selected-row, rule-match, and per-navigation budget proof. |
| `generic-target-click` | `dom_fallback.js:4512` | Generic click helpers need a bounded caller contract; otherwise one target policy can affect multiple route surfaces. |
| `subscription-import-automation` | `injector.js:924`, `injector.js:940` | This is intended user-requested automation, but it must remain impossible during passive filtering and must keep visible progress/budget proof. |
| `readiness-event` | `injector.js:3572`, `seed.js:1126` | Internal readiness events are expected, but they still need startup authority so duplicate injection, delayed settings, or browser fallback paths do not diverge. |

## Missing Runtime Authority

No runtime symbol exists yet for:

- `syntheticEventActionAuthority`
- `observableActionBudget`
- `syntheticClickDecision`
- `syntheticDispatchDecision`
- `navigationSideEffectBudget`
- `userInitiatedActionProof`

## Required Future Proof Before Touching These Paths

Any future patch that adds, removes, gates, or broadens a synthetic click or
event dispatch needs:

```text
actionReference
owner
actionType
targetSelectorOrObject
route
surface
profileType
listMode
ruleMatch
identityConfidence
userInitiated
observableToYouTube
maxPerNavigation
dedupeKey
disabledModeBudget
emptyRuleBudget
fullscreenNativeOverlayPolicy
positiveFixture
negativeNoRuleFixture
negativeWrongRouteFixture
restoreOrNoOpProof
```

## Current Verdict

```text
Completion is not proven.
The synthetic event/action register is proof-started, not complete.
Runtime behavior remains unchanged.
Synthetic clicks and synthetic YouTube DOM events remain not-ready for behavior
changes until an observable action authority exists.
```

Related artifacts:

- `docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20.md`
- `docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_PAGE_RUNTIME_OWNER_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
