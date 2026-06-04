# FilterTube Empty-Install Performance Audit - 2026-05-18

Status: current-behavior proof with 2026-05-26 implementation addendum.

Purpose: answer whether FilterTube can slow YouTube even when the user has just
installed it, is in blocklist mode, and has no keyword/channel/comment rules.
The original evidence said yes: some paths did no mutation, but still installed
page-global lifecycle work, parsed YouTubei responses, harvested identity, or ran
generic engine processing. The 2026-05-25 and 2026-05-26 addenda remove the
highest-risk always-on quick-block/fallback menu scans and the no-rule YouTubei
fetch/XHR body parsing path. The latest 2026-05-26 follow-up also returns the
native fetch promise before response hooks on empty/no-work settings, gates
desktop SPA quick-block overlay scans, delays desktop quick-block creation
behind hover intent, and defers 3-dot menu injection by a frame.

## Empty Install Definition

```text
settings.enabled = true
settings.listMode = "blocklist"
filterKeywords = []
filterChannels = []
filterKeywordsComments = []
hideAllComments = false
hideAllShorts = false
contentFilters.*.enabled = false
categoryFilters.enabled = false
showQuickBlockButton = false or absent
showBlockMenuItem = false or absent
```

This should eventually mean:

```text
no JSON mutation
no response clone/parse/rewrite unless a route needs explicit harvest
no DOM fallback scan
no fallback menu scan
no quick-block viewport sweep
no whitelist-pending work
no map write or YouTube-visible side effect
```

Current code now provides the network-body pass-through and the highest-risk DOM
mutation/prefetch no-op parts of that contract for loaded empty/disabled
blocklist settings, but does not yet provide a single shared no-work authority
across all page lifecycle owners.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Current No-Rule Work Map

| Surface | Current behavior | Evidence | Risk |
| --- | --- | --- | --- |
| Search YouTubei fetch | Empty blocklist now passes through before attaching response hooks, clone/parse/stringify once settings are loaded and no JSON work is active. | `js/seed.js`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Remaining risk is active-rule startup coverage, where `ytInitialData` still provides the early safety path. |
| Desktop home browse | Empty blocklist now passes through before harvest or mutation. | `js/seed.js:234`, `js/seed.js:663`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Identity harvest no longer runs on this empty-install path, so active-rule fixtures must continue to pin channel behavior. |
| Mobile home browse | Empty blocklist now passes through before `processData`. | `js/seed.js:234`, `js/seed.js:663`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Strong lag suspect addressed for loaded empty settings. |
| Player endpoint | Empty blocklist now passes through before `processData`. | `js/seed.js:234`, `js/seed.js:663`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Active player/content-filter fixtures must remain green. |
| Watch next endpoint | Empty blocklist now passes through before `processData`; active keyword and hide-comments fixtures still force JSON work. | `js/seed.js:234`, `js/seed.js:663`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Watch recommendations no longer pay work before a rule exists. |
| Guide endpoint | Empty blocklist now passes through before `processData`. | `js/seed.js:234`, `js/seed.js:663`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Sidebar/guide no-rule body cost addressed. |
| Disabled settings | Disabled settings now pass matching YouTubei fetches through before clone/parse/stringify. | `js/seed.js:234`, `js/seed.js:240`, `js/seed.js:663`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | XHR listener marks are also gated at open/send for loaded disabled/no-work settings. |
| DOM fallback predicate | Empty blocklist returns inactive, and the fallback mutation observer now exits before mutation-summary scans when no DOM fallback work is active. | `js/content/dom_fallback.js:1933`; `js/content_bridge.js:5999`, `js/content_bridge.js:6039`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Lifecycle is still installed for later settings changes, but no-rule mutation callbacks avoid content scanning. |
| Prefetch/hydration | Channel identity prefetch scans now require whitelist mode or a non-empty channel blocklist. Empty blocklist no longer attaches card observers or queues identity prefetch work. | `js/content_bridge.js:974`, `js/content_bridge.js:987`, `js/content_bridge.js:1158`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Identity prefetch still needs a unified owner and teardown policy, but no-rule identity learning is gated. |
| Fallback menu | Fallback menu repair is still enabled by default, but mutation repair is scoped to changed roots, document clicks rescan only fallback-relevant card/button/popover clicks, and scroll/warmup repairs process near-viewport cards instead of every matched card. | `js/content_bridge.js:6498`, `js/content_bridge.js:6590`, `js/content_bridge.js:6763`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Route scans remain until a unified affordance owner exists. |
| Quick block | Action gate requires `showQuickBlockButton === true`, body observation remains mobile/coarse-only, empty desktop SPA navigation no longer forces overlay scans, stale tracked hosts are pruned, and desktop button creation is delayed behind hover intent. | `js/content/block_channel.js`; `tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs` | Page-level listeners still exist for the desktop quick-block affordance, but the expensive no-rule body scan / route scan paths are now gated. |
| Blank enabled filters | Seed JSON and DOM fallback now require `categoryFilters.enabled === true` and a non-empty `selected` array before category work wakes. Raw content filter enabled flags still wake seed/DOM work before threshold/date validation. | `js/seed.js:213`, `js/content/dom_fallback.js:1992`; `tests/runtime/empty-install-performance-current-behavior.test.mjs` | Category no-op body and DOM work addressed; content-threshold cleanup remains. |

## Why This Explains The User Reports

```text
fresh install / no rules
        |
        +--> seed fetch/XHR interceptors are page-lifetime patches
        |       |
        |       +--> loaded empty/disabled blocklist settings now pass through
        |            before response hooks, clone, parse, or rewrite
        |
        +--> DOM fallback initialization
        |       |
        |       +--> observer remains installed for later settings changes
        |            but exits before mutation scans when no DOM work is active
        |
        +--> fallback menu lifecycle
        |       |
        |       +--> mutation/click scans are scoped; scroll/warmup use
        |            near-viewport scans while fallback menu is enabled
        |
        +--> quick-block lifecycle
                |
                +--> desktop hover intent + stale-host pruning; mobile/coarse
                     keeps eager visible quick-block affordance
```

The pure JSON engine has a good no-rule baseline for a simple `videoRenderer`.
The performance issue is higher in the page lifecycle and endpoint layers:
work can begin before the engine receives a renderer.

## Remaining Fix Gates

1. Define `compiledRuleState(settings, profile, surface)` with explicit
   `hasAnyBlockingRule`, `hasAnyWhitelistRule`, `hasValidContentRule`,
   `hasValidCategoryRule`, `hasMenuAction`, `hasQuickBlockAction`,
   `needsIdentityHarvest`, and `needsDomFallback`.
2. Promote the 2026-05-26 seed pass-through predicate into a named
   `endpointPolicy(url, route, compiledRuleState)` with three decisions:
   pass-through, harvest-only, or mutate.
3. Add a page lifecycle registry for observers/listeners/timers. Every owner
   needs a reason, active-state gate, pause rule for overlays/fullscreen, and
   teardown/disable behavior.
4. Broaden the empty-install fixture from network-body and DOM-mutation
   pass-through into zero DOM scans for inactive fallback, zero quick-block
   sweeps, zero fallback menu scans, and zero side-effect map writes.
5. Preserve current safety behavior with separate fixtures before flipping
   expectations:
   - search restore / harvest behavior
   - desktop home harvest behavior
   - watch-next recommendation filtering when active rules exist
   - hide-all-comments synthetic continuation behavior
   - player metadata handling

## Non-Goals

- Do not remove DOM fallback wholesale; renderer gaps still need it.
- Do not disable identity harvest globally; it supports channel blocking and
  whitelist confidence.
- Do not treat empty whitelist as the same as empty blocklist; empty whitelist is
  fail-closed today and must remain an explicit product decision.
- Do not change behavior before the no-rule and active-rule fixture wall exists.
