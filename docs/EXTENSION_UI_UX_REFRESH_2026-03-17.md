# Extension UI UX Refresh

Date: 2026-03-17  
Primary commit: `ece3c3e8d8b506cdf9e989b73752a9c617311ced`  
Commit title: `feat: Extension UI UX makeover`

This document covers the extension UI/UX overhaul completed on March 17, plus the March 18-19 follow-up tuning that remained in the workspace after the main commit.

## Scope

The goal of this workstream was to move FilterTube’s extension UI away from a plain utility extension look and closer to the calmer, scenic, application-like direction established by the website hero.

This was not a filtering-engine rewrite. Core filtering logic remained in the existing extension codebase. The work focused on:

- shell architecture
- popup UI
- tab/new-tab UI
- theme behavior
- responsive/mobile handling
- dropdowns and profile selection
- visual identity and motion/performance balance

## Stack And Build Direction

Current extension stack:

- Manifest V3 extension core
- vanilla JS for product logic and filtering
- `Preact` for shell-level UI composition
- `esbuild`-based shell bundling

Key build/runtime files:

- `/Users/devanshvarshney/FilterTube/package.json`
- `/Users/devanshvarshney/FilterTube/build.js`
- `/Users/devanshvarshney/FilterTube/scripts/build-extension-ui.mjs`
- `/Users/devanshvarshney/FilterTube/src/extension-shell/popup.jsx`
- `/Users/devanshvarshney/FilterTube/src/extension-shell/tab-view-decor.jsx`
- `/Users/devanshvarshney/FilterTube/src/extension-shell/shared/runtime.js`

Build commands:

```bash
npm run build:ui
npm run build:chrome
```

## Main Architectural Changes

### 1. Shell Layer Added On Top Of Existing Extension Logic

The extension now has a shell layer instead of relying entirely on legacy static markup styling.

Key files:

- `/Users/devanshvarshney/FilterTube/src/extension-shell/popup.jsx`
- `/Users/devanshvarshney/FilterTube/src/extension-shell/tab-view-decor.jsx`
- `/Users/devanshvarshney/FilterTube/js/ui-shell/popup-shell.js`
- `/Users/devanshvarshney/FilterTube/js/ui-shell/tab-view-decor.js`

What changed:

- Popup shell is rendered through Preact.
- Tab view ambient/decor layer is rendered through Preact.
- The underlying extension still uses the existing vanilla state and filtering flows.

What this represents:

- FilterTube can adopt a more application-like UI without destabilizing the filtering engine.
- Future mobile/iPad product directions now have a closer UI basis inside the extension.

### 2. Shared Serene Visual Layer

A new shell styling system was introduced to bring the extension closer to the homepage hero vibe.

Key files:

- `/Users/devanshvarshney/FilterTube/css/serene-shell.css`
- `/Users/devanshvarshney/FilterTube/css/design_tokens.css`
- `/Users/devanshvarshney/FilterTube/css/components.css`

What changed:

- Scenic shell tokens were added for popup and tab surfaces.
- Shared surface treatments, glass layers, rounded shells, and calmer accent handling were introduced.
- The extension now uses a more unified design language between popup and tab view.

What this represents:

- The extension is no longer visually disconnected from the website.
- FilterTube reads more like a product surface and less like an admin panel.

## Ambient Media And Brand World

### 3. Local Hero Video Added To Extension Surfaces

The scenic homepage hero was brought into the extension as local packaged media.

Key files:

- `/Users/devanshvarshney/FilterTube/assets/images/homepage_hero_day.mp4`
- `/Users/devanshvarshney/FilterTube/scripts/compress-video.swift`
- `/Users/devanshvarshney/FilterTube/build.js`
- `/Users/devanshvarshney/FilterTube/src/extension-shell/popup.jsx`
- `/Users/devanshvarshney/FilterTube/src/extension-shell/tab-view-decor.jsx`

What changed:

- A compressed local copy of the homepage hero clip was added to the extension.
- The build now carries the `assets/` directory into packaged builds.
- Popup and tab view ambient layers both use the local clip.

What this represents:

- The extension and website now live in the same visual world.
- The extension no longer relies on static decorative gradients alone.

## Popup UI Changes

### 4. Popup Shifted From Mini Page To Quick Control Tray

The popup was repeatedly tuned toward speed and compactness.

Key files:

- `/Users/devanshvarshney/FilterTube/src/extension-shell/popup.jsx`
- `/Users/devanshvarshney/FilterTube/css/popup.css`
- `/Users/devanshvarshney/FilterTube/css/serene-shell.css`

What changed:

- The popup shell became a dedicated rounded surface.
- The inner “card inside a card” effect was flattened so the popup reads as one shell.
- Header actions were compressed and rebalanced.
- The `FilterTube / Enabled` brand control was kept prominent but made more app-like.
- Popup scroll behavior was shifted toward internal content scrolling instead of awkward outer scrolling.
- The popup profile dropdown was reduced in width and density to match popup scale better.
- Popup controls were kept on a separate compact row contract so the quick-control tray does not inherit the taller full-list card behavior from tab view.

What this represents:

- The popup is meant to feel like a quick control surface again, not a squeezed version of the full tab UI.

## Tab / New-Tab UI Changes

### 5. Dashboard, Sidebar, And Top Bar Were Reframed As App Chrome

The tab view was reworked into a more application-like shell.

Key files:

- `/Users/devanshvarshney/FilterTube/html/tab-view.html`
- `/Users/devanshvarshney/FilterTube/css/tab-view.css`
- `/Users/devanshvarshney/FilterTube/css/serene-shell.css`
- `/Users/devanshvarshney/FilterTube/js/tab-view.js`

What changed:

- Sidebar became a stronger persistent navigation surface on desktop.
- Top bar was made slimmer and pinned more like a real website/app header.
- Dashboard and route-like sections gained ambient video behind the main shell.
- Main content and view container spacing were tightened to use width more efficiently.
- Browser-width drawer behavior and desktop sidebar behavior were repeatedly re-aligned so the sidebar and content pane stop visually colliding.

What this represents:

- The extension now feels closer to a desktop application shell.
- The tab UI is a base for future mobile/tablet product language rather than a one-off settings page.

## Responsive And Mobile Work

### 6. Mobile And Narrow-Width Layouts Were Reworked Repeatedly

The UI pass included multiple rounds of responsive fixes to reduce overflow, clipping, detached dropdowns, and wasted width.

Key files:

- `/Users/devanshvarshney/FilterTube/css/tab-view.css`
- `/Users/devanshvarshney/FilterTube/css/components.css`
- `/Users/devanshvarshney/FilterTube/css/popup.css`
- `/Users/devanshvarshney/FilterTube/js/ui_components.js`
- `/Users/devanshvarshney/FilterTube/js/tab-view.js`

What changed:

- Search, sort, date, and category controls were tightened for small screens.
- Main and Kids filters were pushed toward true single-column phone behavior.
- Dropdown anchoring was fixed so menus open from the trigger instead of detached below it.
- Mobile fallback scrolling remains available, but the target is better fit rather than horizontal dependency.
- Short-height devices now let the mobile drawer/sidebar scroll internally instead of clipping the lower navigation items.
- Tab-view page switches now reset scroll state so one page does not inherit the previous page’s scroll position.

What this represents:

- FilterTube’s extension UI is being treated as a multi-screen application surface, not just a desktop browser popup.

## Theme And State Presentation

### 7. Light / Dark Theme Presentation Was Tightened

Theme styling was revisited many times across popup and tab view.

Key files:

- `/Users/devanshvarshney/FilterTube/css/design_tokens.css`
- `/Users/devanshvarshney/FilterTube/css/serene-shell.css`
- `/Users/devanshvarshney/FilterTube/css/components.css`
- `/Users/devanshvarshney/FilterTube/js/settings_shared.js`
- `/Users/devanshvarshney/FilterTube/js/state_manager.js`

What changed:

- Enabled/disabled brand state was strengthened with clearer green/red presentation.
- Pills such as `Exact`, `Comments`, and `Filter All` were re-tinted so they keep their semantic color better across light/dark modes.
- Import/export buttons were given stronger state colors.
- Light mode was made less milky so the background video reads more like it does in dark mode.
- Dark mode was tuned to keep the background video visible while avoiding heavy white center glow.

What this represents:

- Theme is no longer just “invert some colors”; it now tries to preserve the same design intent across both modes.

## Interaction And List-Shell Follow-Up

### 8. Shared List Rows Were Stabilized Across Main And Kids Surfaces

After the major shell refresh, the long scrolling keyword/channel lists needed a separate pass because rows started either overlapping or clipping their inner metadata lines.

Key files:

- `/Users/devanshvarshney/FilterTube/css/tab-view.css`
- `/Users/devanshvarshney/FilterTube/js/render_engine.js`

What changed:

- The shared full-list row shell was corrected for tab-view lists so rows keep their natural height instead of collapsing into each other.
- Channel rows stopped inheriting the wrong alignment behavior from the generic list shell.
- Overflow was relaxed so the lower metadata / identity line can remain visible inside the row instead of being cut off.
- The fix applies to the shared tab-view list surfaces:
  - main keywords
  - main channels
  - Kids keywords
  - Kids channels
- Popup minimal rows were intentionally left separate because they use a different compact row contract.

What this represents:

- FilterTube’s dashboard lists are now treated as reusable application surfaces rather than one-off DOM stacks.
- Shared row behavior is clearer, which lowers the risk of future UI polish work accidentally breaking only one list mode.

### 9.5 Profile Lock Behavior Was Re-synced Across Popup And Tab View

The profile/PIN follow-up work was not just visual. It corrected a real cross-surface behavior split.

Key files:

- `/Users/devanshvarshney/FilterTube/js/popup.js`
- `/Users/devanshvarshney/FilterTube/js/tab-view.js`
- `/Users/devanshvarshney/FilterTube/css/popup.css`

What changed:

- Popup now exports the same lock-state contract to shared state code that tab view already relied on.
- The popup header `Enabled / Disabled` brand control is visually locked and cannot mutate profile state while the active profile is still PIN-protected.
- Tab-view profile switching now refreshes its selector/badge/lock UI after denied or cancelled PIN prompts, matching popup behavior.
- The tab-view profile badge/dropdown and navigation scroll-reset helpers were hardened so locked-profile flows do not get stuck on stale UI state or scope errors.

What this represents:

- Popup and tab view now agree more closely on what “locked profile” means.
- Security-sensitive profile actions are less dependent on which extension surface the user happened to open.

### 9. Custom Fallback 3-Dot Menu Received Real Interaction Feedback

The custom fallback 3-dot menu path had become functionally correct but visually dead. A follow-up polish pass fixed that.

Key files:

- `/Users/devanshvarshney/FilterTube/js/content_bridge.js`

What changed:

- The fallback 3-dot launcher now has clearer pressed/open/focus feedback.
- The fallback menu row now shows an actual pressed pulse before the menu closes.
- `Filter All` inside the custom fallback popover is now selection-only, not an immediate block action.
- Only activating the actual `Block • Channel` row counts as the blocking action.

What this represents:

- The custom fallback path now behaves more like a real product surface and less like a brittle emergency path.
- Interaction semantics are clearer: selection state and destructive action are no longer conflated.

### 9.6 Mobile/App Parity UI Checkpoint Was Backported Upstream

The app parity work created several UI/UX clarifications that now belong to the extension source of truth, because the app mirrors the extension's product language.

Reference:

- `/Users/devanshvarshney/FilterTube/docs/MOBILE_APP_UPSTREAM_CHECKPOINT_2026-04-28.md`

What changed:

- `Exact`, `Comment`, and `Filter All` pills now have documented active/inactive semantics that must apply wherever the controls are used.
- Source badge colors are explicit product semantics: green `From Channel`, brown `From Comments`, yellow `Collaboration`, pink `From Kids`.
- Channel-derived keyword rows are green; multi-source derived rows should blend green with the relevant source color.
- Kids Mode is documented as a parallel rule surface, not a child of Main filters.
- Kids `Filter All` creates Kids-derived keywords; Kids -> Main sync shows derived Kids rules in Main only when modes match.
- Fallback 3-dot selected/blocked states should stay readable: green success text is allowed, but the background tint should remain soft.
- Semantic ML is documented as disabled/future unless runtime matching is implemented.

What this represents:

- Mobile UI improvements are not app-only inventions. They are now treated as extension product-language refinements that downstream app UI should mirror natively.

## Performance Tuning

### 10. Dark-Mode Slowness Was Reduced By Cutting Paint Cost

Once ambient video and glass layers were added, dark mode started to feel heavier. Follow-up tuning reduced compositing overhead.

Key files:

- `/Users/devanshvarshney/FilterTube/css/serene-shell.css`
- `/Users/devanshvarshney/FilterTube/css/tab-view.css`
- `/Users/devanshvarshney/FilterTube/js/ui_components.js`

What changed:

- Expensive blur and backdrop-filter usage on large dark scrolling surfaces was reduced.
- Decorative edge layers and glows were toned down or removed on the dark path.
- Dropdown repositioning work was throttled.

What this represents:

- The scenic shell stays present, but performance is treated as part of the design system rather than an afterthought.

## Help And Support Layout Changes

### 11. Help And Support Were Rebalanced As Product Reference Surfaces

The Help and Support pages were reworked so they are less like a dump of equal cards.

Key files:

- `/Users/devanshvarshney/FilterTube/html/tab-view.html`
- `/Users/devanshvarshney/FilterTube/css/serene-shell.css`

What changed:

- Help clusters were rebalanced for desktop.
- `Whitelist Mode` was moved to sit with later reference surfaces.
- `YouTube Kids Integration` and `Troubleshooting` were grouped into a flatter late-stage row.
- The `Trust and payment handling` support area was tightened for better desktop composition.

What this represents:

- Reference pages now read more like structured product guidance instead of uniformly stacked documentation cards.

## Current Status Of The Work

The main extension UI refresh is represented by commit `ece3c3e8d8b506cdf9e989b73752a9c617311ced`.

Same-day follow-up tuning after that commit is currently reflected in:

- `/Users/devanshvarshney/FilterTube/js/background.js`
- `/Users/devanshvarshney/FilterTube/js/content_bridge.js`
- `/Users/devanshvarshney/FilterTube/js/tab-view.js`
- `/Users/devanshvarshney/FilterTube/css/components.css`
- `/Users/devanshvarshney/FilterTube/css/popup.css`
- `/Users/devanshvarshney/FilterTube/css/serene-shell.css`
- `/Users/devanshvarshney/FilterTube/css/tab-view.css`
- `/Users/devanshvarshney/FilterTube/html/tab-view.html`
- `/Users/devanshvarshney/FilterTube/src/extension-shell/popup.jsx`

Those follow-up changes cover:

- popup shell cleanup
- popup dropdown sizing
- shared list-row stability across long keyword/channel lists
- fallback 3-dot pressed/open feedback
- selection-only `Filter All` behavior in the custom fallback popover
- help/support layout tuning
- export button alignment/color tuning
- dark-mode performance cuts
- light-mode transparency rebalancing

## Meaning Of The Extension Refresh

This extension work represents a shift in product direction:

- from utility extension UI to application-like product shell
- from isolated popup and tab styling to one shared scenic system
- from browser-only admin aesthetics to a calmer UI language that can inform future mobile and tablet products

The key idea is not just “make it prettier.” The point is:

- faster recognition of product state
- calmer and more coherent interaction
- better continuity with the website and brand
- a reusable base for future FilterTube surfaces beyond desktop browser settings

## Known Follow-Up Areas

This refresh established a direction, but there are still likely future passes:

- deeper cleanup of legacy DOM-driven sections that still inherit older UI contracts
- more route-by-route desktop/mobile QA in the tab view
- final popup density tuning after real-user flow review
- additional performance trimming if more scenic motion is added later
- more targeted QA on short-height / narrow-height device classes where the shell and drawer rules are most sensitive
