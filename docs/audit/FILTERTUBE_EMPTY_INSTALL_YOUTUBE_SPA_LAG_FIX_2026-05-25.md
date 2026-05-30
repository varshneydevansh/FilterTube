# FilterTube Empty-Install YouTube SPA Lag Fix - 2026-05-25

Status: runtime fix with proof-backed attribution.

## User Symptom

Installed extension on YouTube Main with no active blocklist rules still made the
watch page and 3-dot menus lag. The lag got worse after repeated SPA navigation.

## May 5+ Commit Attribution

`git log --since=2026-05-05` shows the recent whitelist work did add extra
whitelist pending refresh/recheck paths:

- `2241042` 2026-05-09: coalesced whitelist pending rechecks.
- `777ad8a` 2026-05-10: batched whitelist pending observer scans.
- `27f1639` 2026-05-10: capped whitelist pending hide candidates.
- `e88414e` 2026-05-11: quieted whitelist observer under native overlays.

Those changes can contribute to whitelist-mode drag, but they are not the root
cause of no-rule blocklist lag. The two hot resident owners predate May 5:

- `94df020` 2026-02-08 introduced quick-block hover support in
  `js/content/block_channel.js`, including the former 1800 ms full-document
  sweep.
- `cadcf54` 2026-03-13 introduced broad fallback 3-dot menu repair scanning in
  `js/content_bridge.js`.

So the current no-rule lag is mostly old always-on affordance lifecycle work,
with recent whitelist changes making the performance problem more visible.

## Runtime Fix

- Removed the quick-block 1800 ms full-document periodic sweep.
- Replaced quick-block repeated full sweeps with coalesced mutation/root scoped
  scans and one route-navigation sweep on `yt-navigate-finish`.
- 2026-05-26 addendum: made desktop quick-block insertion lazy. Mobile/coarse
  surfaces still get eager visible sweeps, but desktop startup, mutation, and
  SPA navigation no longer pre-inject quick-block buttons across the page.
- 2026-05-26 addendum: removed the desktop quick-block body MutationObserver and
  target-gated the pointermove recovery path, so ordinary mouse movement does
  not call `elementsFromPoint()` unless the pointer is already on a card/host.
- 2026-05-26 addendum: cached the last pointer target's quick-block host
  resolution so repeated movement over the same element does not rerun the
  broad card `closest()` selector.
- 2026-05-26 addendum: changed native dropdown discovery from an always-on body
  MutationObserver to a short-lived observer armed only after an actual menu
  click or keyboard menu action.
- Changed fallback menu mutation repair from whole-document scanning on every
  mutation to added-subtree and nearest-card scoped scanning.
- Changed fallback menu document-click repair from every page click to only
  fallback-relevant card/button/popover clicks.
- Changed fallback menu scroll and warmup repairs from full matched-card passes
  to near-viewport passes.
- 2026-05-26 addendum: made desktop fallback menu repair lazy. Desktop hover and
  focus on a fallback card still create the button, but startup, mutation, SPA
  navigation, scroll, and warmup eager passes are reserved for mobile/coarse
  surfaces where hover is unavailable.
- 2026-05-26 addendum: stopped attaching the fallback menu body MutationObserver
  on desktop hover-capable YouTube; desktop remains event-driven through
  pointer/focus/click handlers.
- Preserved target-card repair so existing 3-dot menu affordance behavior is not
  lost when YouTube mutates inside an already rendered card.
- 2026-05-26 addendum: added seed fetch/XHR pre-parse pass-through for loaded
  disabled or empty blocklist settings, so no-rule YouTubei responses avoid
  clone/parse/process/stringify body work.
- 2026-05-26 addendum: gated DOM fallback mutation scans and channel identity
  prefetch behind active DOM/channel work, so empty blocklist pages do not scan
  mutation payloads or attach card prefetch observers.
- 2026-05-26 addendum: changed the DOM fallback mutation lifecycle from
  observe-then-return to active-settings-only observation; empty blocklist pages
  disconnect the body observer until a relevant setting is added.

## Behavior Boundary

This patch does not change whitelist/blocklist rule decisions, hidden/allowed
classification, JSON filtering semantics, storage schema, or menu action
commands. It only reduces resident scanning work while YouTube mutates.

## Remaining Release Risks

- Quick-block/menu affordance lifecycle still needs broader release cleanup before
  claiming full empty-install zero work.
- End-screen video wall coverage and algorithm-pollution risk remain separate
  blocking-quality issues.
- Firefox/mobile refresh persistence remains a separate route/startup reliability
  issue.

## Verification

- `node --check js/content_bridge.js`
- `node --check js/content/block_channel.js`
- `node --check js/seed.js`
- `node --test --test-reporter=dot tests/runtime/empty-install-performance-current-behavior.test.mjs`
- Focused runtime proof suite covering quick-block, fallback menu, empty-install
  performance, JSON-first no-work predicates, lifecycle ownership, YTM watch
  observer budgets, native overlay quiet mode, and whitelist cache hot paths.
