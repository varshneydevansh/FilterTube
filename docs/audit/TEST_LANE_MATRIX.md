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

The lane definitions live in `scripts/run-test-lane.mjs`; package scripts call
that runner so npm commands and lane contents share one source of truth.

| Lane | Command | Primary purpose |
|---|---|---|
| release | `npm run test:release` | Build/package/release docs, browser manifests, public claims, and artifact boundaries. |
| whitelist | `npm run test:whitelist` | Whitelist-only leaks, pending hides, Shorts/watch/Kids/YTM allow behavior, and SPA cache boundaries. |
| blocking | `npm run test:blocking` | Keyword, channel, comment, blocklist, list-target, and hide-decision behavior. |
| json | `npm run test:json` | JSON-first filtering, network interception, response mutation, endpoint admission, and list-mode gates. |
| dom | `npm run test:dom` | DOM fallback selectors, hide/restore state, cleanup passes, recycled nodes, and route cleanup. |
| menu | `npm run test:menu` | 3-dot menu, quick-block, collaborator menus, native dropdown close state, and affordance gates. |
| performance | `npm run test:performance` | Empty/no-rule work budgets, disabled mode, active-rule gates, SPA lag guards, and identity work budgets. |
| settings | `npm run test:settings` | Settings compile, profiles, storage refresh, migrations, import/export, backups, and sync boundaries. |
| smoke | `npm run test:smoke` | Small release confidence lane for common lag, blocking, menu, and release-surface regressions. |

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

`npm run test:changed` uses the same classifier, fails on any unclassified
changed path, then runs the required lanes sequentially in matrix order. Use it
when a logical change has already been made and you want the focused proof lane
set to execute without manually copying commands from `lanes:changed`.

## Auxiliary Guards

These commands do not replace the feature lanes. They catch workflow drift in
the audit system itself.

| Guard | Command | Purpose |
|---|---|---|
| lane-owned audit proof drift | `npm run test:audit-drift` | Fails when a lane-owned test or proof doc still cites a stale whole-file source fingerprint. |
| full audit proof drift inventory | `node scripts/audit-proof-drift.mjs --all --report-only` | Reports stale whole-file fingerprints in older audit files/tests that are not yet lane-owned. This is a backlog inventory, not a release blocker. |
| full historical runtime audit | `npm run audit:runtime` | Runs every historical runtime/current-boundary audit test. This is the broad backlog suite, not the default per-change release lane. |

The current broad-suite backlog is pinned in
`docs/audit/FILTERTUBE_CHANGE_SAFETY_RUNTIME_AUDIT_BACKLOG_2026-06-01.md`.
`tests/runtime/audit-runtime-backlog-current-behavior.test.mjs` keeps that
boundary visible in `test:smoke`.

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
| no-rule/no-work performance | Empty blocklist and whitelist: Home, Search, Watch, Shorts, and repeated SPA navigation stay snappy; no visible forced-refresh loop; production console has no unclassified severe FilterTube errors. |
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

## File-To-Lane Matrix

| Touched area | Required lane(s) | Notes |
|---|---|---|
| `js/seed.js` | `test:json`, `test:performance` | Covers fetch/XHR interception, no-work gates, response clone/parse work, and JSON replay behavior. |
| `js/injector.js` | `test:json`, `test:whitelist`, `test:performance` | Covers main-world JSON lookup, settings application, pending queues, and whitelist JSON work. |
| `js/filter_logic.js` | `test:json`, `test:blocking`, affected content lane | Add `test:whitelist` when allow-list behavior changes and `test:performance` when active-work gates change. |
| `js/content/dom_fallback.js` | `test:dom`, `test:blocking`, `test:performance` | Covers DOM hides/restores, route cleanup, no-rule work, and false-hide/leak risk. |
| `js/content/block_channel.js` | `test:menu`, `test:performance` | Covers native 3-dot menus, quick-block affordances, outside-click close, and menu observer/timer budgets. |
| `js/content/menu.js` | `test:menu` | Covers injected menu styles/classes and menu item surface behavior. |
| `js/content_bridge.js` | `test:menu`, `test:settings`, affected runtime lane | Add `test:whitelist`, `test:dom`, `test:json`, or `test:performance` depending on touched branch. |
| `js/content/bridge_settings.js` | `test:settings`, `test:json`, `test:performance` | Covers cross-context settings fanout, seed updates, dirty-key refresh, and force reprocess behavior. |
| `js/background.js` | `test:settings`, `test:blocking`, affected runtime lane | Covers compiled settings, profile/list-mode mutation, block actions, cache invalidation, and message authority. |
| `js/settings_shared.js` | `test:settings`, `test:blocking`, `test:whitelist` | Covers canonical settings shape, aliases, legacy migration, and list-mode compilation. |
| `js/state_manager.js`, `js/io_manager.js` | `test:settings` | Covers persistence, import/export, backups, profile mutation, and storage refresh behavior. |
| `js/shared/identity.js`, `js/content/dom_extractors.js`, `js/content/handle_resolver.js` | `test:blocking`, `test:menu`, `test:whitelist` | Covers identity confidence, collaborators, menu labels, channel matching, and stale identity risk. |
| `manifest*.json`, `build.js`, `scripts/build-*.mjs` | `test:release` | Covers package content, manifests, generated UI shell, release claims, and artifact behavior. |
| `README.md`, `CHANGELOG.md`, `data/release_notes.json` | `test:release`, `test:smoke` | Covers public release claims, packaged release notes, and changelog/version drift. |
| `html/*.html`, `css/*.css`, `js/ui-shell/*.js`, `src/extension-shell/*.jsx` | `test:release`, affected UI/runtime lane | Add manual dashboard/popup smoke when the extension UI changes. |
| YouTube surface fixtures under `tests/runtime/fixtures/` | Lane that owns the fixture plus `test:smoke` if release-relevant | Fixture changes must state which behavior changed and whether old behavior remains intentional. |

The executable mapping in `scripts/run-test-lane.mjs` is the source of truth.
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

## Current Boundary

This matrix defines the lane workflow and pins the npm commands. It does not
claim full audit completion, full performance proof, or complete browser/live
YouTube parity. Missing future work should add or refine lane tests instead of
expanding manual-only release checks.

The 2026-06-01 full historical runtime audit currently remains backlog evidence:
`4694` tests ran, `4533` passed, and `161` failed. The failing rows are mostly
stale current-boundary snapshots for source fingerprints, generated counters,
website build artifacts, version/package metadata, and large inventory
registers outside the focused lane set. The focused lanes and
`test:audit-drift` are the change-safety gates; `audit:runtime` is the
inventory to retire or refresh in smaller proof batches.
