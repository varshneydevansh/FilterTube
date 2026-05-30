# FilterTube Fallback Menu Viewport Scan Bypass - 2026-05-26

Status: runtime fix with focused proof.

## Problem

Fallback menu repair was still enabled by default after the empty-install JSON
and DOM fallback gates. It no longer scanned the whole document on every
mutation, but scroll and warmup repairs still scheduled full matched-card passes.
The document click path also used to rescan after unrelated YouTube UI clicks.

## Runtime Change

- Mutation repair remains scoped to the changed card/subtree, and on desktop
  hover-capable YouTube the body MutationObserver is not attached; desktop
  fallback repair is driven by hover/focus/click events instead.
- Document-click repair now runs only when the click is inside a fallback card,
  fallback button, or fallback popover.
- Scroll and warmup repairs now use `scanVisible()`, which only processes
  fallback cards near the viewport and records offscreen skips; these eager
  scans are limited to mobile/coarse pointer surfaces.
- Route navigation schedules visible repair only on mobile/coarse surfaces.
- Desktop fallback buttons are created lazily from `pointerover`/`focusin` on a
  matching fallback card. Native YouTube dropdown menu injection is unchanged.
- Repeated `ensureFallbackMenuButtons()` calls after settings refreshes only
  invoke the fallback rescan path on eager mobile/coarse surfaces, so desktop
  refreshes do not re-open a full fallback scan.

## Safety Boundary

This keeps the fallback menu feature available for cards that need it, while
removing startup/SPA/scroll warmup injection from desktop pages. It does not
change block-channel commands, identity extraction, whitelist/blocklist
decisions, or native YouTube menu injection.

## Verification

- `node --check js/content_bridge.js`
- `node --test --test-reporter=dot tests/runtime/empty-install-performance-current-behavior.test.mjs`
