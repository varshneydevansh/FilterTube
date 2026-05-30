# FilterTube Empty-Install DOM Prefetch Mutation Bypass - 2026-05-26

Status: runtime fix with focused proof.

## Problem

After the seed JSON pre-parse bypass, an empty blocklist could still pay page
lifecycle cost from DOM fallback mutation handling and channel-identity prefetch.
That work can wake frequently during YouTube SPA navigation even when no rule can
use the resulting DOM scan or identity mapping.

## Runtime Change

- `hasActiveDOMFallbackWork()` now treats category filters as active only when
  `categoryFilters.enabled === true` and `categoryFilters.selected` is non-empty.
- The DOM fallback mutation observer now disconnects and stays unobserved when
  `hasActiveDOMFallbackWork(currentSettings)` is false, instead of receiving
  every YouTube SPA mutation and returning from the callback.
- Channel identity prefetch now requires either whitelist mode or a non-empty
  channel blocklist before it schedules scans, attaches card observers, handles
  intersection callbacks, or queues identity lookups.
- Storage refresh now calls a gated runtime-observer refresh, so pages that
  started empty still attach DOM fallback/prefetch/whitelist observers after the
  user adds a channel rule, adds active DOM work, or switches to whitelist mode.

## Safety Boundary

This does not change hide/allow decisions for active keyword, channel,
whitelist, comment, Shorts, content, or selected category rules. It only avoids
inactive DOM scans and identity prefetch side effects for loaded empty/disabled
blocklist settings.

## Verification

- `node --check js/content/dom_fallback.js`
- `node --check js/content_bridge.js`
- `node --check js/content/bridge_settings.js`
- `node --test --test-reporter=dot tests/runtime/empty-install-performance-current-behavior.test.mjs`
