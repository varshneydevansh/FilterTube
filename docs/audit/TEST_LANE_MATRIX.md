# FilterTube Test Lane Matrix

Date: 2026-06-01
Status: audit/change-safety workflow

This matrix converts the full-codebase audit into a repeatable change flow.
It is not a replacement for manual YouTube smoke testing. It tells us which
proof lane must run after each logical change so regressions are caught before
release.

## Change Flow

```text
FilterTube change
  -> classify touched files/features
  -> run matching npm test lane
  -> add or update fixture if behavior changed
  -> update docs/audit proof
  -> manual YouTube smoke when user-facing
  -> commit only with passing lane
```

## Lane Commands

The lane definitions live in `scripts/test-lane-config.mjs`; package scripts
call `scripts/run-test-lane.mjs` so npm commands and lane contents share one
source of truth while execution stays separate from the declarative matrix.
Plain `npm test` runs the same bounded smoke lane as `npm run test:smoke`;
logical changes should still use `npm run test:changed` so touched files are
classified before lanes run.

| Lane | Command | Primary purpose |
|---|---|---|
| release | `npm run test:release` | Build/package/release docs, browser manifests, public claims, and artifact boundaries. |
| whitelist | `npm run test:whitelist` | Whitelist-only leaks, pending hides, Shorts/watch/end-screen/Kids/YTM allow behavior, and SPA cache boundaries. |
| blocking | `npm run test:blocking` | Keyword, channel, comment, blocklist, list-target, and hide-decision behavior. |
| json | `npm run test:json` | JSON-first filtering, network interception, response mutation, endpoint admission, and list-mode gates. |
| dom | `npm run test:dom` | DOM fallback selectors, hide/restore state, cleanup passes, recycled nodes, and route cleanup. |
| menu | `npm run test:menu` | 3-dot menu, quick-block, collaborator menus, native dropdown close state, and affordance gates. |
| performance | `npm run test:performance` | Empty/no-rule work budgets, disabled mode, active-rule gates, SPA lag guards, identity work budgets, and production console logging gates. |
| settings | `npm run test:settings` | Settings compile, profiles, storage refresh, migrations, import/export, backups, and sync boundaries. |
| smoke | `npm run test:smoke` | Small release confidence lane for common lag, blocking, menu, and release-surface regressions. |

## Resumed Goal Coverage

This matrix is the current executable contract for the resumed
`FilterTube Change-Safety Audit and Test Lanes` goal. It covers the explicit
goal requirements as follows:

| Goal requirement | Current proof owner |
|---|---|
| Keep audit proof files inside `docs/audit/` | Audit docs and handoff artifacts live under `docs/audit/`; product/core docs are not used as the audit workspace. `tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs` rejects tracked proof-style Markdown outside `docs/audit/`. |
| Turn confirmed risks into focused fixtures/tests | Each lane points to focused `tests/runtime/*current-behavior.test.mjs` fixtures for the matching risk family. |
| Create `docs/audit/TEST_LANE_MATRIX.md` | This file is the human-readable matrix; `tests/runtime/test-lane-matrix-current-behavior.test.mjs` pins classifier and matrix mechanics, while `tests/runtime/test-lane-visible-safety-current-behavior.test.mjs` pins named safety surfaces, user-report anchors, and the manual-smoke handoff. |
| Define required lanes by touched area | `scripts/test-lane-config.mjs` owns the declarative mapping; `scripts/run-test-lane.mjs` is the executable classifier; `npm run lanes:changed` and `npm run test:changed` use it. |
| Preserve blocklist, whitelist, keyword/channel blocking, Shorts, end screens, quick-block, 3-dot menus, JSON-first, DOM fallback, no-rule performance, SPA navigation, settings, and release packaging | The lane table, manual-smoke handoff, and file-to-lane matrix name each surface and bind it to focused tests or live-smoke rows. The whitelist lane explicitly owns end-screen videowall, card, autoplay, and player DOM boundary tests so allow-mode changes cannot skip issue-57-style proof. |
| Commit only with passing lane | The change flow requires lane execution before commit; `npm run test:changed` is the default proof command for a dirty logical change. |

## Executable Classification

Use the classifier before picking tests manually:

```bash
npm run lanes:changed
npm run test:changed
node scripts/run-test-lane.mjs --classify js/seed.js README.md
```

The classifier is intentionally conservative. Known high-risk paths produce
lane commands, lane-owned test files inherit their lane, audit docs/tests are
classified by filename families, and unknown product paths are reported as
requiring explicit classification instead of silently falling back to
`test:smoke`.

`npm run test:changed` uses the same classifier, includes tracked modifications
and nonignored untracked files, fails on any unclassified changed path, fails
when source, release, asset, or product-doc paths changed without a matching
`docs/audit/` proof file, fails when changed `docs/audit/` proof does not share
at least one non-smoke lane with the touched files, runs the lane-owned audit
proof drift guard, then runs the required lanes sequentially in matrix order.
After the lanes pass, it fails if focused lane execution leaves additional
tracked or unignored dirty paths beyond the logical change that was classified.
Use it when a logical change has already been made and you want the focused
proof lane set to execute without manually copying commands from
`lanes:changed`.

For user-facing runtime lanes and release/package lanes, the classifier also
prints a manual YouTube smoke advisory. That keeps the installed-extension
handoff visible beside the automated lane commands without pretending automated
fixtures can prove live YouTube SPA smoothness, browser profile state, package
parity, or native menu rendering.
The advisory includes the npm runner command, npm verifier command, structured
live-smoke template, lower-level verifier command, and required SPA row ids so
the manual handoff produces a verifiable artifact instead of an unstructured
note.

For proof discipline, the classifier also reports whether a changed
`docs/audit/` proof file is present. If source, release, asset, or product-doc
paths changed without a matching audit proof file in the same logical change,
it prints an audit-proof reminder before the matched-path details; in
`npm run test:changed`, that condition is a hard failure before any lane runs.
If an audit proof file is present but only maps to unrelated lanes, the
classifier prints the touched lanes and proof lanes and `npm run test:changed`
fails before running lanes. This keeps a random audit note from satisfying a
JSON, DOM, menu, performance, settings, or release change.

For runtime source changes, the classifier also prints a fixture-proof reminder
for the affected runtime lanes. This is intentionally phrased as
`when behavior changes`: source-only refactors can satisfy it with unchanged
fixtures plus a passing lane, while behavior changes should add or update the
focused fixture/test that proves the new contract.
The classifier also reports whether changed runtime fixture/test files share
at least one touched runtime lane. That relevance report is not a hard
`test:changed` failure because a behavior-neutral refactor can be proven by
existing fixtures, but it makes unrelated fixture churn visible before commit.

## Auxiliary Guards

These commands do not replace the feature lanes. They catch workflow drift in
the audit system itself.

| Guard | Command | Purpose |
|---|---|---|
| lane-owned audit proof drift | `npm run test:audit-drift` | Fails when a lane-owned test or proof doc still cites a stale whole-file source fingerprint. Its lane-owned scope includes `scripts/test-lane-config.mjs` directly, and this guard also runs inside `npm run test:changed` before focused lanes. |
| full audit proof drift inventory | `node scripts/audit-proof-drift.mjs --all --report-only` | Reports stale whole-file fingerprints in older audit files/tests that are not yet lane-owned. This is a backlog inventory, not a release blocker. |
| full historical runtime audit | `npm run audit:runtime` | Runs every historical runtime/current-boundary audit test. This is the broad backlog suite, not the default per-change release lane. |

The current broad-suite backlog is pinned in
`docs/audit/FILTERTUBE_CHANGE_SAFETY_RUNTIME_AUDIT_BACKLOG_2026-06-01.md`.
`tests/runtime/audit-runtime-backlog-current-behavior.test.mjs` keeps that
boundary visible in `test:smoke`.

## Named Safety Surface Coverage

These rows bind the explicit goal surfaces to lane-owned proof tests. They are
not the only tests for each surface; they are the minimum sentinels that keep
the surface connected to a focused lane.

| Goal safety surface | Lane-owned sentinel proof |
|---|---|
| blocklist behavior | `test:blocking` keeps `filter-engine-current-behavior` and `main-profile-blocklist-keyword-alias-current-behavior` in lane. |
| whitelist behavior | `test:whitelist` keeps `json-first-whitelist-decision-identity-boundary` and `content-bridge-whitelist-pending-refresh-boundary` in lane. |
| keyword/channel blocking | `test:blocking` keeps `json-first-keyword-match-boundary` and `json-first-channel-match-boundary` in lane. |
| Shorts behavior | `test:whitelist` keeps `main-watch-initial-lockup-shorts-json-current-behavior`, `main-watch-initial-shorts-owner-absent-boundary-current-behavior`, `json-first-hide-all-shorts-boundary-current-behavior`, and `shorts-dom-cleanup-boundary-current-behavior` in lane for watch/Shorts allow-mode, owner-absent, Hide Shorts, and DOM cleanup proof. |
| end screens | `test:whitelist` keeps end-screen videowall, card, autoplay, and player DOM cleanup tests in lane. |
| quick-block and 3-dot menus | `test:menu` keeps `quick-block-block-menu-affordance-boundary`, `native-dropdown-close-state`, and `content-bridge-collaborator-identity-promotion-handoff` in lane. |
| JSON-first filtering | `test:json` keeps seed/network, readiness, snapshot, list-mode, and response-mutation tests in lane. |
| DOM fallback | `test:dom` keeps DOM fallback selector, CSS hide authority, quarantined content CSS package boundary, run-state cleanup, virtual-attribute, and route cleanup tests in lane. |
| no-rule performance | `test:performance` keeps empty-install, no-work, active-rule, diagnostic logging policy, and route-surface budget tests in lane. |
| SPA navigation | `test:performance` keeps whitelist-cache SPA metric and route-surface no-work tests in lane; live SPA rows remain in manual smoke. |
| code-burden growth | `test:performance` keeps the code-burden declutter boundary in lane, including the 1000-line product-owned source guard and near-threshold file list. |
| settings | `test:settings` keeps settings-mode, refresh fanout, compiled-cache, import/export, and state-manager tests in lane. |
| release packaging | `test:release` keeps package parity, public release surface, audit proof directory boundary, live-smoke boundary, and artifact claim tests in lane. |

## User-Reported Regression Anchors

These anchors keep known release-critical user reports tied to proof lanes
without claiming that automated fixtures replace manual YouTube validation.

| Report anchor | Required automated proof | Manual proof boundary |
|---|---|---|
| Issue #55: whitelist leaks after SPA/cache reuse | `test:whitelist` owns `json-first-whitelist-decision-identity-boundary`, `content-bridge-whitelist-pending-refresh-boundary`, `right-rail-whitelist-observer`, and `whitelist-cache-spa-metric-packet-gate`; `test:smoke` runs the first two as release sentinels. | Repeat Home/Search/Watch/right-rail SPA navigation in whitelist-only mode and confirm non-whitelisted cards do not reappear. |
| Issue #56: Shorts hidden on whitelisted channels while Hide Shorts is disabled | `test:whitelist` owns watch-initial Shorts, owner-absent Shorts, JSON `hideAllShorts`, and Shorts DOM cleanup fixtures; `test:smoke` runs `json-first-whitelist-decision-identity-boundary` because it pins whitelisted channel Shorts with Hide Shorts disabled. | Visit a whitelisted channel Shorts tab with Hide Shorts disabled and confirm Shorts render instead of a permanent spinner. |
| Issue #57: end-screen videowall/cards/autoplay panel leak in whitelist mode | `test:whitelist` owns `json-first-hide-endscreen-videowall`, `json-first-hide-endscreen-cards`, `json-first-disable-autoplay-annotations`, and `player-endscreen-dom-cleanup` fixtures; `test:smoke` runs `main-watch-autoplay-video-endpoint`. | Let a whitelisted video end and confirm the configured end-screen and autoplay controls match settings. |
| Issue #59: public `data-filtertube-*` DOM fingerprint risk | `test:dom` owns `dom-state-virtual-attributes-current-behavior`; `test:json` and `test:dom` own stale marker cleanup boundaries; `test:smoke` runs the virtual-attribute sentinel. | Inspect live rendered cards for necessary visible markers only and verify recycled nodes do not keep stale identifiers. |

## Manual YouTube Smoke Handoff

Automated lanes prove source and fixture contracts. User-facing changes still
need a manual installed-extension smoke pass because YouTube SPA hydration,
browser profile state, extension load order, console noise, and visible lag
are live-browser properties.

The release smoke contract is pinned here:

```text
docs/audit/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md
docs/audit/artifacts/release-live-youtube-spa-smoke/template.json
docs/audit/artifacts/release-live-youtube-spa-smoke/run-live-smoke.mjs
docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs
tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs
```

Required live SPA rows:

```text
FT-LIVE-SPA-00-home-to-search
FT-LIVE-SPA-01-search-to-channel
FT-LIVE-SPA-02-channel-to-watch
FT-LIVE-SPA-03-watch-to-home
FT-LIVE-SPA-04-watch-rail-scroll
FT-LIVE-SPA-05-cache-repeat-navigation
```

Manual smoke scope by touched behavior:

| Touched behavior | Manual smoke observation |
|---|---|
| no-rule/no-work performance | Empty blocklist and whitelist: Home, Search, Watch, Shorts, and repeated SPA navigation stay snappy; no visible forced-refresh loop; production routine console logging stays gated unless debug is enabled and has no unclassified severe FilterTube errors. |
| blocklist keyword/channel hiding | Temporary keyword and channel rules hide matching Home/Search/Watch/right-rail cards after the expected identity decision; unrelated cards remain visible. |
| whitelist-only mode | Allowed channel cards remain usable; non-whitelisted Home/Search/Watch/right-rail cards do not leak after SPA navigation or cache reuse. |
| Shorts behavior | Shorts remain visible when the Shorts hide setting is disabled, including whitelisted channel Shorts tabs. |
| end-screen behavior | End-screen videowall, cards, and autoplay panel follow their settings at video end. |
| quick-block and 3-dot menus | Quick-block controls appear on supported cards; native YouTube menus open, close on outside click, and comment 3-dot menus are not hidden by stale FilterTube state. |
| JSON-first and DOM fallback | JSON-hidden and DOM-hidden cards agree on visible results; recycled YouTube nodes do not keep stale hidden/menu state. |
| settings/profile/storage | Mode/profile changes reprocess already-rendered cards without requiring a refresh; import/export and storage migration preserve list authority. |
| release packaging | Built Chrome/Firefox/Opera packages include the intended source, manifests, UI shells, release notes, and optional Android mobile/tablet artifacts only when explicitly attached. |

The `test:release` and `test:smoke` lanes keep this handoff visible by running
`tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs`.
That test does not claim the manual smoke has passed; it prevents the template,
runner, and missing-live-proof boundary from silently disappearing.

When a dated live-smoke artifact is produced, verify it before using it as
release evidence:

```bash
npm run smoke:youtube
npm run smoke:youtube:verify -- docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json
node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json
```

The verifier requires every live SPA row to pass, a clean console summary, all
recording fields, and `installedByteParity.verdict=GO`. The template and any
artifact with missing byte parity remain `NO-GO`.

## File-To-Lane Matrix

| Touched area | Required lane(s) | Notes |
|---|---|---|
| `js/seed.js` | `test:json`, `test:performance` | Covers fetch/XHR interception, no-work gates, response clone/parse work, and JSON replay behavior. |
| `js/injector.js` | `test:json`, `test:whitelist`, `test:performance` | Covers main-world JSON lookup, settings application, pending queues, and whitelist JSON work. |
| `js/filter_logic.js` | `test:json`, `test:blocking`, `test:whitelist`, `test:performance` | Covers core renderer decisions, list-mode fail-close/allow behavior, keyword/channel/comment blocking, Shorts/end-screen JSON behavior, content-filter predicates, and active-work/no-work boundaries. |
| `js/content/dom_fallback.js` | `test:whitelist`, `test:dom`, `test:blocking`, `test:performance` | Covers DOM hides/restores, whitelist pending/fail-close behavior, selected-row and right-rail recovery, route cleanup, no-rule work, and false-hide/leak risk. |
| `js/content/block_channel.js` | `test:menu`, `test:blocking`, `test:performance` | Covers native 3-dot menus, quick-block affordances, quick-block/Kids native block mutations, outside-click close, and menu observer/timer budgets. |
| `js/content/menu.js` | `test:menu` | Covers injected menu styles/classes and menu item surface behavior. |
| `js/content/bridge_injection.js` | `test:release`, `test:json`, `test:performance`, `test:settings` | Covers content-script load/injection order, main-world script injection, settings bootstrap, and startup/no-work risk. |
| `js/content/collab_dialog.js` | `test:whitelist`, `test:blocking`, `test:menu`, `test:performance` | Covers collaborator identity collection, dialog/menu propagation, block/allow decisions, and observer/listener budgets. |
| `js/content/dom_helpers.js`, `js/content/dom_state.js` | `test:whitelist`, `test:blocking`, `test:dom`, `test:performance` | Covers hide/restore helpers, virtual DOM attributes, selector state, recycled-node cleanup, and no-rule DOM side effects. |
| `js/content/first_run_prompt.js`, `js/content/release_notes_prompt.js` | `test:release`, `test:settings`, `test:smoke` | Covers manifest-loaded prompt UI, release-note payload handling, background message actions, and visible installed-extension handoff. |
| `js/content_bridge.js` | `test:whitelist`, `test:blocking`, `test:json`, `test:dom`, `test:menu`, `test:performance`, `test:settings` | The bridge is the cross-context runtime hub for settings fanout, JSON snapshot consumers, whitelist pending refreshes, DOM fallback reprocess calls, hide/block action targets, collaborator identity, quick-block/native menu injection, and observer/timer budgets. The menu lane still owns collaborator identity promotion handoff proof, including the ampersand Topic guard. Treat every bridge edit as broad runtime risk instead of selecting a partial lane after the fact. |
| `js/content/bridge_settings.js` | `test:json`, `test:performance`, `test:settings` | Covers cross-context settings fanout, seed updates, dirty-key refresh, and force reprocess behavior. |
| `js/background.js` | `test:release`, `test:whitelist`, `test:blocking`, `test:json`, `test:performance`, `test:settings` | Covers release-note/background messages, compiled settings, profile/list-mode mutation, whitelist import/transfer/add flows, block actions, JSON settings payloads, cache invalidation, and no-work/SPA-sensitive refresh authority. |
| `js/settings_shared.js` | `test:whitelist`, `test:blocking`, `test:settings` | Covers canonical settings shape, aliases, legacy migration, and list-mode compilation. |
| `js/state_manager.js`, `js/io_manager.js` | `test:settings` | Covers persistence, import/export, backups, profile mutation, and storage refresh behavior. |
| `js/content_controls_catalog.js` | `test:whitelist`, `test:blocking`, `test:json`, `test:dom`, `test:menu`, `test:performance`, `test:settings` | Covers content-control keys that activate JSON, DOM, menu affordance, settings, and no-work behavior. |
| `js/popup.js`, `js/tab-view.js`, `js/render_engine.js`, `js/ui_components.js` | `test:release`, `test:whitelist`, `test:blocking`, `test:menu`, `test:settings`, `test:smoke` | Covers dashboard/popup UI, visible list authority, profile/list-mode mutation, content-control toggles, and release-facing UI claims. |
| `js/nanah_sync_adapter.js`, `js/security_manager.js` | `test:release`, `test:settings`, `test:smoke` | Covers Nanah sync payloads, profile-scoped import/export, PIN/encrypted payload helpers, and package/release parity. |
| `js/layout.js` | `test:release`, `test:dom`, `test:smoke` | Covers the quarantined legacy layout file, package burden, manifest-inactive status, and DOM/layout selector claims. |
| `js/shared/identity.js`, `js/content/dom_extractors.js`, `js/content/handle_resolver.js` | `test:whitelist`, `test:blocking`, `test:menu` | Covers identity confidence, collaborators, menu labels, channel matching, and stale identity risk. |
| identity, resolver, handle, or waterfall audit docs under `docs/audit/` | `test:whitelist`, `test:blocking`, `test:menu`, `test:smoke` | Covers audit proof for channel identity, learned identity, resolver escalation, stale identity, and identity waterfall behavior that can affect allow/block decisions and injected/native menu labels. |
| alias, list-mode, or row-list-mode audit docs under `docs/audit/` | `test:whitelist`, `test:blocking`, `test:settings`, `test:smoke` | Covers proof for visible-list authority, stale aliases, mode transitions, and allow/block state migration that can produce leaks or false hides. |
| backup or Nanah audit docs under `docs/audit/` | `test:settings`, `test:smoke` | Covers proof for import/export, encrypted backup, trusted-device restore, sync payloads, profile scope, and storage side effects. |
| renderer, watch, search, Shorts, end-screen, autoplay, playlist, or Kids browse audit docs under `docs/audit/` | `test:whitelist`, `test:blocking`, `test:json`, `test:dom`, `test:smoke` | Covers proof for YouTube renderer authority, JSON-first surface decisions, DOM cleanup/fallback, allow-mode leaks, blocklist false hides, watch playback controls, and end-screen/autoplay behavior. |
| menu, quick-block, collaborator, or dropdown audit docs under `docs/audit/` | `test:menu`, `test:smoke` | Covers proof for native 3-dot/dropdown close state, quick-block affordances, collaborator identity/menu handoff, and ampersand Topic guard behavior such as `Kully B & Gussy G - Topic`. |
| filter-logic method, direct renderer, rule-field, or rule-path audit docs under `docs/audit/` | `test:whitelist`, `test:blocking`, `test:json`, `test:dom`, `test:performance`, `test:smoke` | Covers proof for `js/filter_logic.js` renderer rules, JSON path reads, rule-field effects, list-mode decisions, blocklist/whitelist behavior, and no-work/performance-sensitive method boundaries. |
| network, fetch, XHR, or credential audit docs under `docs/audit/` | `test:json`, `test:performance`, `test:smoke` | Covers proof for network interception, request admission, credential policy, JSON response mutation, and no-work transport pass-through behavior. |
| main-world message, injection, trust, or startup-injection audit docs under `docs/audit/` | `test:release`, `test:json`, `test:settings`, `test:smoke` | Covers proof for content-script/page-script trust, main-world message dispatch, injection readiness, and cross-context settings handoff. Match `trust` as a filename token so trusted-state backup docs stay in the settings lane. |
| generic message action, sender, side-effect, transport, or mutation audit docs under `docs/audit/` | `test:settings`, `test:smoke` | Covers proof for background message actions, sender classes, message-triggered state mutation, transport callsites, and settings/storage fanout. |
| page-runtime lifecycle, observer, teardown, or selector lifecycle audit docs under `docs/audit/` | `test:dom`, `test:performance`, `test:smoke` | Covers proof for observers, listeners, timers, selector lifecycle, teardown ownership, and no-rule lifecycle budgets that affect lag and DOM fallback recovery. |
| document-start or seed page-global patch audit docs under `docs/audit/` | `test:json`, `test:performance`, `test:smoke` | Covers proof for seed startup, page-global fetch/XHR patch lifetime, zero-flash limits, and no-work JSON pass-through budgets. |
| `manifest*.json`, `build.js`, other `scripts/build-*.mjs` | `test:release` | Covers package content, manifests, generated release artifacts, release claims, and artifact behavior. |
| `README.md`, `CHANGELOG.md`, `data/release_notes.json` | `test:release`, `test:smoke` | Covers public release claims, packaged release notes, and changelog/version drift. |
| `LICENSE`, root `*.md` | `test:release`, `test:smoke` | Covers root legal text and top-level planning/recovery docs that can affect release review context or public project claims. |
| `docs/*.md` outside `docs/audit/` | `test:release`, `test:smoke` | Covers product docs, release-facing architecture/behavior claims, and the audit-doc boundary that keeps proof files inside `docs/audit/`. |
| `docs/audit/artifacts/release-live-youtube-spa-smoke/*.{json,mjs}` | `test:release`, `test:smoke` | Covers live-smoke templates, runners, verifiers, and future dated smoke artifacts. |
| `docs/audit/artifacts/empty-install-idle-probe.mjs` | `test:performance`, `test:smoke` | Covers the no-rule/no-work idle observer probe used as performance evidence. |
| diagnostic, logging, console, no-work, cache, SPA, lag, active-work, active-rule, disabled-runtime, master-switch, or performance audit docs under `docs/audit/` | `test:performance`, `test:smoke` | Covers audit proof for production console gates, diagnostic logging budgets, empty-rule/no-work behavior, cache/SPA lag, active-rule gates, disabled-mode gates, and performance-risk boundaries even when only the proof doc changes. Match these as filename tokens only, so `SPA` does not accidentally classify unrelated words such as `DISPATCH`. |
| code-burden, declutter, structural-burden, large-file, or large-source audit docs/tests under `docs/audit/` or `tests/runtime/` | `test:performance`, `test:smoke` | Covers maintainability pressure that can turn into runtime lag or risky optimizations, including the large-file guard for product-owned source files crossing 1000 lines. |
| `html/popup.html`, `css/popup.css`, `js/ui-shell/popup-shell.js`, `src/extension-shell/popup.jsx` | `test:release`, `test:settings`, `test:smoke` | Covers the popup shell that carries enabled/profile/list-mode and filter-tab controls before `js/popup.js` wires behavior. Add manual popup smoke when this surface changes. |
| `html/tab-view.html` | `test:release`, `test:settings`, `test:smoke` | Covers the dashboard shell that carries profile/list-mode, import/export, backup, Accounts & Sync, and Nanah settings markup before `js/tab-view.js` wires behavior. Add manual dashboard smoke when this surface changes. |
| `css/content.css`, `css/filter.css`, `css/layout.css` | `test:release`, `test:dom`, `test:smoke` | Covers packaged-but-quarantined content CSS, old `filter-tube-visible` reveal selectors, accidental manifest activation false-hide risk, and dist package parity. |
| other `html/*.html`, `css/*.css`, `js/ui-shell/*.js`, `src/extension-shell/*.jsx` | `test:release`, affected UI/runtime lane | Add manual dashboard/popup smoke when the extension UI changes; use the popup or tab-view shell rows above when settings controls are touched. |
| `assets/images/*`, `icons/*`, `design/design_tokens.json` | `test:release`, `test:smoke` | Covers packaged images, extension icons, dashboard artwork, and shared design tokens. |
| `js/vendor/*.bundle.js` | `test:release`, `test:settings`, `test:smoke` | Covers vendored Nanah/QR bundles, dashboard load order, sync UI behavior, package contents, and bundle provenance. |
| `scripts/build-extension-ui.mjs`, `scripts/build-nanah-vendor.mjs` | `test:release`, `test:settings`, `test:smoke` | Covers generator scripts for popup/dashboard UI shells and Nanah/QR vendor bundles, because changes here can alter settings, sync, dashboard load order, and packaged release contents even when generated files are unchanged in the same diff. |
| `scripts/compress-video.swift`, `scripts/sync-native-runtime.mjs` | `test:release`, `test:smoke` | Covers media compression and native-runtime sync helpers that can affect release assets and extension/app parity. |
| `tests/runtime/harness/load-filter-engine.mjs` | `test:whitelist`, `test:blocking`, `test:json`, `test:dom`, `test:menu`, `test:performance`, `test:settings`, `test:smoke` | Covers the shared filter-engine harness used by runtime decision, identity, menu, settings, and boundary fixtures. |
| `tests/runtime/harness/load-seed-runtime.mjs` | `test:whitelist`, `test:json`, `test:performance`, `test:smoke` | Covers the shared seed/network harness used by JSON-first, whitelist end-screen, and no-work performance fixtures. |
| `tests/runtime/fixtures/**/*.json` | `test:json`, `test:smoke` | Covers captured YouTube JSON payloads that feed JSON-first renderer, endpoint, continuation, and response-mutation fixtures. |
| `tests/runtime/fixtures/**/*.html` | `test:dom`, `test:smoke` | Covers captured YouTube DOM fragments that feed DOM fallback, selector, cleanup, and recycled-node fixtures. |
| fixture names containing `collab`, `dialog`, or `show-sheet` | `test:whitelist`, `test:blocking`, `test:menu` | Covers collaborator identity fixtures that affect allow/block decisions and injected/native menu labels. |
| fixture names containing `comment`, `channel`, or `keyword` | `test:blocking` | Covers blocking fixtures for comment, channel, keyword, guide, post, and list-target behavior. |
| fixture names containing `kids`, `shorts`, `watch`, `upnext`, `endscreen`, `autoplay`, `playlist`, or `ytm` | `test:whitelist` | Covers allow-mode fixtures for Kids, Shorts, watch, right-rail/up-next, end-screen, autoplay, playlist, and YouTube Music surfaces. |
| other YouTube surface fixtures under `tests/runtime/fixtures/` | `test:smoke` | Fixture changes must state which behavior changed and whether old behavior remains intentional; add a focused classifier row when a fixture belongs to a runtime lane not covered above. |

The executable mapping in `scripts/test-lane-config.mjs` and
`scripts/run-test-lane.mjs` is the source of truth.
This table is the human-readable review copy.

## Done Criteria

A change is not release-ready until:

- the relevant lane command passes;
- `npm run test:audit-drift` passes when lane-owned source fingerprints changed;
- a fixture or runtime test proves any behavior change;
- the relevant proof doc under `docs/audit/` is updated;
- visible YouTube behavior gets a manual smoke pass when user-facing;
- blocklist and whitelist behavior remain intact;
- empty-rule and SPA navigation paths remain snappy;
- unrelated docs/product files are not dirtied.

`tests/runtime/test-lane-visible-safety-current-behavior.test.mjs` pins these
done criteria in `test:smoke` so the active objective cannot be weakened by
editing this checklist without a focused regression failure.

## Current Boundary

This matrix defines the lane workflow and pins the npm commands. It does not
claim full audit completion, full performance proof, or complete browser/live
YouTube parity. Missing future work should add or refine lane tests instead of
expanding manual-only release checks.

The 2026-06-01 full historical runtime audit currently remains backlog evidence:
`4719` tests ran, `4491` passed, and `228` failed. The failing rows are mostly
stale current-boundary snapshots for source fingerprints, method-gap counts,
generated counters, website build artifacts, version/package metadata,
optimization gate docs, native/runtime mirrors, YouTube Music/YTM provenance,
and large inventory registers outside the focused lane set. The focused lanes and
`test:audit-drift` are the change-safety gates; `audit:runtime` is the
inventory to retire or refresh in smaller proof batches.
