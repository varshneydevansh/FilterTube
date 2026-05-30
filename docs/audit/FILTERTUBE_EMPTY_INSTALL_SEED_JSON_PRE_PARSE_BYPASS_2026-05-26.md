# FilterTube Empty-Install Seed JSON Pre-Parse Bypass - 2026-05-26

Status: runtime fix with focused proof.

## Problem

After the extension is installed with an empty blocklist, YouTube can still lag
because the seed fetch/XHR hooks intercept matching YouTubei endpoints and read
response bodies even when there is no active JSON-level work.

The affected endpoint families are:

- `/youtubei/v1/search`
- `/youtubei/v1/guide`
- `/youtubei/v1/browse`
- `/youtubei/v1/next`
- `/youtubei/v1/player`

Before this fix, loaded empty blocklist settings could still reach
`response.clone().json()`, `processData()`, `harvestOnly()`, and
`JSON.stringify()` depending on route and endpoint.

## Commit Attribution

The May 5+ whitelist commits can add work in whitelist mode, but the no-rule
blocklist body-work path was already present in `js/seed.js`. This fix therefore
treats the user-visible lag as a mixed issue:

- recent whitelist work can amplify drag when whitelist mode is active;
- empty-install YouTube lag also came from older always-on fetch/XHR and DOM
  affordance paths.

## Runtime Change

`js/seed.js` now computes cheap active-work predicates before reading matching
YouTubei response bodies:

- disabled settings: pass through before JSON parse;
- empty blocklist with no keyword/channel/comment/Shorts/content/category work:
  pass through before JSON parse;
- whitelist mode: keep JSON work active;
- keyword/channel/comment rules: keep JSON work active;
- `hideAllComments` and `hideAllShorts`: keep JSON work active;
- content filters with enabled flags: keep JSON work active;
- category filtering: JSON work is active only when `enabled === true` and
  `selected.length > 0`.

XHR open/send marks use the same predicate for loaded settings so no-rule XHRs
avoid response-read processing. Missing settings keep the old conservative path
so startup data can still queue until settings arrive.

## Safety Boundaries

This patch does not change renderer hide logic, whitelist decisions, storage
schema, dashboard settings, or menu commands. The related DOM addendum changes
blank-category classification so empty selected category filters no longer wake
DOM fallback work.

The focused proof keeps these active paths alive:

- a keyword rule on `/youtubei/v1/next` still parses and calls `processData`;
- `hideAllComments` still parses `/youtubei/v1/next` comment continuations and
  returns the synthetic empty continuation;
- selected category filters still parse and process;
- blank selected category filters now pass through.

## Verification

- `node --check js/seed.js`
- `node --test --test-reporter=dot tests/runtime/empty-install-performance-current-behavior.test.mjs`
