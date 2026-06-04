# FilterTube Runtime Audit - 2026-05-17

Status: in progress

Purpose: audit the complete FilterTube codebase as a system, not as a single bug fix. The goal is to prove which paths are correct, which paths are too broad, which paths create lag, which paths can hide non-matching content, and which paths should be moved toward more precise JSON-first enforcement.

Current synthesis:

- `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md`

Scope:

- Extension manifests and content-script loading.
- Settings, profiles, Kids/Main mode, sync/import/export, and compiled runtime settings.
- Main-world JSON/XHR interception and renderer filtering.
- Isolated-world DOM fallback, quick block, 3-dot/fallback menus, layout repair, and CSS hiding.
- Channel/video identity resolution, background fetches, collaborator logic, and immediate-hide behavior.
- Extension UI, website/download claims, build/release scripts, and docs drift.
- App-shared runtime handoff points where extension logic is copied or synced into native apps.

## Audit Rules

- No implementation changes during audit unless explicitly approved after this ledger is reviewed.
- Every finding needs file and line proof.
- Verdicts use: `KEEP`, `INSTRUMENT`, `GATE`, `REWRITE`, `REMOVE`.
- Symptoms like lag, false hiding, and end-screen leaks are evidence, not the audit boundary.
- Prefer JSON/XHR renderer-level enforcement when reliable. Keep DOM work as fallback, UI affordance, or last-mile repair.

## Repository Size Snapshot

Measured on 2026-05-17:

| Area | Lines |
| --- | ---: |
| `js/content_bridge.js` | 12,985 |
| `js/background.js` | 6,270 |
| `js/content/dom_fallback.js` | 4,838 |
| `js/filter_logic.js` | 3,498 |
| `js/injector.js` | 3,536 |
| `js/content/block_channel.js` | 2,397 |
| `js/tab-view.js` | 11,617 |
| Core docs inspected | 9,851+ |

The runtime is large enough that feature-level gates and a source-of-truth map are required. Small local edits without a call-flow map are risky.

## Source Inventory For Audit Tracking

Current high-impact source files by size:

| File | Lines | Current audit status |
| --- | ---: | --- |
| `js/content_bridge.js` | 12,985 | Full method-family ledger complete for `3-12985`; needs instrumentation/tests before any source behavior changes. |
| `js/tab-view.js` | 11,617 | UI-state ledger expanded for category/video filters, mode switch, managed-child edits, active-list rendering, add/remove flows, and import/list-mode copy drift. Needs executable UI mutation fixtures. |
| `js/background.js` | 6,270 | Deep method-family and action-registry ledger complete for compiled settings, mode switch, storage listeners, fetch resolvers, map/cache writers, message mutation/provenance, and add/toggle channel families. Needs executable action schema. |
| `js/content/dom_fallback.js` | 4,838 | Initial method-family ledger complete for active gate, CSS controls, main card pass, metadata pending, playlist side effects, and hide/restore gaps. Needs executable DOM fixtures. |
| `js/injector.js` | 3,536 | Method-family ledger complete for subscriptions import, main-world runtime startup, collaborator/channel lookup, backup `ytInitialData` hook, seed settings relay, and high-cost import expansion. Needs executable capability-token/settings-revision fixtures. |
| `js/filter_logic.js` | 3,498 | Initial method-family ledger complete for JSON rules, harvest, candidate building, decisions, and recursive mutation. Needs executable fixtures before any rewrite. |
| `js/state_manager.js` | 2,469 | Method-family mutation ledger complete for load, enrichment, Main/Kids keyword/channel APIs, imports, content/category filters, broadcasts, and storage listeners. Needs executable mutation fixtures. |
| `js/content/block_channel.js` | 2,397 | Observer/action lifecycle ledger complete for quick block, fallback menu observer, Kids passive block sync, and startup gates. Needs identity/action fixtures. |
| `js/io_manager.js` | 2,008 | Import/export/backup/Nanah ledger complete for V3/V4 migration, full-replace import, scoped sync apply, trusted-state restore, and backup scheduling. Needs import/sync fixtures. |
| `js/popup.js` | 1,841 | Popup-state ledger complete for active-tab surface resolution, mode switch UI, compact content-filter writes, profile dropdown, PIN notifications, and popup-only list filtering. Needs popup mutation fixtures. |
| `js/render_engine.js` | 1,389 | Method-family ledger expanded for active-list-only keyword/channel rendering, Kids sync merge display, idle-batched channel rows, filter-all suppression in whitelist, and row mutation targets. Needs fixtures. |
| `js/settings_shared.js` | 1,173 | Method-family and key-contract ledger complete for shared UI compiler/load/save/migration. Needs executable migration and mode-broadcast fixtures. |
| `js/content/dom_extractors.js` | 1,102 | Method-family ledger complete for selectors, video ID stamping, channel metadata confidence, stale cleanup, and cache mutation. Needs executable identity fixtures. |
| `js/seed.js` | 1,027 | Initial method-family ledger complete for hooks, skip classifier, fetch/XHR, pending queue, and settings reprocessing. Needs measured no-op passthrough fixtures. |

This is the working inventory. A checkbox marked done below means "initial proof-backed pass done", not "file fully proven safe".

### Tracked File Coverage Ledger

The audit is not limited to the largest hot files. These tracked packaged files are in scope for a complete stabilization pass.

| Group | Files | Lines | Current coverage | Next proof needed |
| --- | ---: | ---: | --- | --- |
| Runtime entry/manifests | `manifest*.json`, `js/seed.js`, `js/content/bridge_injection.js`, `js/injector.js`, `js/content_bridge.js` | 17,860 | Initial load, message, JSON, fallback startup paths mapped; `content_bridge.js`, `seed.js`, `injector.js`, and `bridge_injection.js` method-family ledgers complete. | Browser-specific startup fixtures and quiet-mode instrumentation points. |
| Filtering engines | `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/content/dom_extractors.js`, `js/content/dom_helpers.js`, `js/content_controls_catalog.js`, `js/render_engine.js` | 11,232 | Initial JSON/DOM active gates, renderer gaps, hide writers, content/category risks, and `filter_logic.js` / `dom_fallback.js` / extractor-helper method-family ledgers mapped. | Executable fixture harness with JSON and DOM card fixtures. |
| Identity/action UI in content pages | `js/content/block_channel.js`, `js/content/handle_resolver.js`, `js/content/menu.js`, `js/content/collab_dialog.js`, `js/content/first_run_prompt.js`, `js/content/release_notes_prompt.js` | 3,737 | Quick-block/menu lifecycle, handle resolver side effects, collaboration observer, menu CSS, and prompt entry points mapped. | Executable no-rule lifecycle counters and user-action side-effect fixtures. |
| Background/state/storage | `js/background.js`, `js/state_manager.js`, `js/settings_shared.js`, `js/io_manager.js`, `js/security_manager.js`, `js/nanah_sync_adapter.js` | 12,531 | Compiled settings, migration, mode switch, sync/import risks, and message mutation provenance mapped at architecture level. | Every storage mutation API, migration path, and scoped import rule verified. |
| Extension UI | `js/tab-view.js`, `js/popup.js`, `js/ui_components.js`, `js/layout.js`, `js/ui-shell/*.js`, `html/*.html` | 17,440 | Mode switching, filters UI, profile/Nanah release surfaces partially mapped. | Confirm UI cannot silently create unsafe empty whitelist/category states. |
| CSS/layout | `css/*.css` | 10,588 | Global hide/visible CSS risk mapped initially. | Every `.filtertube-hidden`, `.filtertube-visible`, overlay, and shell class mapped to writer/restorer. |
| Data/build/vendor | `data/release_notes.json`, `scripts/*.mjs`, `js/vendor/*.js` | 3,426 | Release/runtime sync drift and Nanah vendor source noted. | Build reproducibility and release artifact flow proof. |

Current tracked count for this packaged surface: 48 files, 78,318 lines. This excludes website `node_modules` and private native app repos, but includes native runtime sync scripts because app behavior depends on copied extension runtime.

### Repo-Wide Reconciliation - 2026-05-17

`git ls-files` currently reports 149 tracked files. The runtime audit above is intentionally concentrated on browser extension code because that is the surface that can slow YouTube, hide non-matching content, leak blocked content, or affect recommendations. A complete codebase audit still needs explicit classification for the rest of the repo so lower-risk files do not remain invisible.

Static reconciliation command used:

```text
while read file; do
  if the audit ledger does not mention it directly, classify the file group here.
done < git ls-files
```

| File group | Representative paths | Runtime filtering risk | Current status | Next proof needed |
| --- | --- | --- | --- | --- |
| Website app and components | `website/app/*.js`, `website/app/*/page.js`, `website/components/*.js`, `website/app/globals.css` | Low for YouTube filtering; medium for public privacy/download claims and website performance. | Initial website ledger added below. | Build/render checks, copy accuracy against release status, media budget, analytics-scope proof. |
| Website media and public assets | `website/public/videos/*`, `website/assets/videos/*`, `website/public/brand/logo.png` | No filtering risk; can affect website load/performance and release trust. | Asset-size snapshot recorded below. | Asset manifest with source/output mapping and max byte budgets. |
| Extension visual assets | `assets/images/*.png`, `assets/images/*.mp4`, `icons/*.png`, `icons/*.svg` | No direct filtering risk; popup/dashboard media can slow UI open. | Asset-size and shell usage recorded. | UI asset budget and reduced-motion checks. |
| Planning and historical docs | `docs/*`, `channel-identity-watch-mix-collab-recovery-plan.md` | No direct runtime effect; high risk for stale claims steering future fixes incorrectly. | Major runtime docs inspected: JSON path encyclopedia, renderer inventory, release/runtime sync docs. Many product/planning docs still need a docs-to-runtime claims table. | For each public/architecture doc, classify as current, plan, historical, or stale; link each runtime claim to code/tests. |
| Design tokens | `design/design_tokens.json`, `css/design_tokens.css`, website theme CSS | No filtering risk; UI consistency and accessibility risk. | Extension CSS and website theme surfaces partially mapped. | Token drift check between design JSON, CSS variables, and rendered UI. |
| Lockfiles and package manifests | `package-lock.json`, `website/package-lock.json`, `package.json`, `website/package.json` | No filtering semantics; dependency/release reproducibility risk. | Package scripts/dependencies recorded for extension and website. | Dependency provenance and build reproducibility checks. |

Files not yet directly mentioned by path in this ledger are not assumed safe; they are classified as lower-direct-risk surfaces that need separate proof before this audit goal can be called complete.

Direct-path reconciliation backlog from `git ls-files`:

| Backlog class | Paths now explicitly classified | Why it remains in scope | Required proof before audit completion |
| --- | --- | --- | --- |
| Website route files | `website/app/[slug]/page.js`, `website/app/downloads/page.js`, `website/app/layout.js`, `website/app/not-found.js`, `website/app/page.js`, `website/app/privacy/page.js`, `website/app/robots.js`, `website/app/sitemap.js`, `website/app/terms/page.js` | These files do not run on YouTube, but they publish the public product, privacy, release, SEO, and download contract. | Build/render every route, verify metadata/robots/sitemap consistency, and map public privacy/download claims to runtime facts. |
| Website component files | `website/components/browser-logo-rail.js`, `website/components/marketing-ui.js`, `website/components/reveal.js`, `website/components/route-content.js`, `website/components/scene-controller.js`, `website/components/scenic-detail-page.js`, `website/components/scenic-illustration.js`, `website/components/scenic-tones.js`, `website/components/site-data.js`, `website/components/site-footer.js`, `website/components/site-header.js`, `website/components/site-shell-data.js`, `website/components/theme-toggle.js` | Component copy, external images, timers, localStorage theme state, and video rendering can affect trust and page performance even though they cannot hide YouTube content. | Component-by-component proof of listeners/timers/storage/media/external requests and a copy-source-of-truth map. |
| Website config/assets | `website/.gitignore`, `website/.vercelignore`, `website/app/globals.css`, `website/app/icon.png`, `website/assets/images/logo.png`, `website/assets/videos/README.md`, `website/assets/videos/homepage/dawn/prompt.txt`, `website/assets/videos/homepage/day/homepage_hero_day.mp4`, `website/assets/videos/homepage/night/prompt.txt`, `website/assets/videos/homepage/sunset/prompt.txt`, `website/assets/videos/ios/ios.mp4`, `website/jsconfig.json`, `website/next.config.mjs`, `website/package-lock.json`, `website/package.json`, `website/postcss.config.mjs`, `website/public/brand/logo.png`, `website/public/videos/homepage/day/homepage_hero_day.mp4`, `website/public/videos/homepage/homepage_hero_day.mp4`, `website/public/videos/ios/ios_hero_slow_540.mp4` | These determine deployment root behavior, Vercel ignore behavior, dependency reproducibility, CSS layout, icons, and website media weight. | Asset manifest with source/output/hash/size, duplicate media decision, Vercel root/ignore proof, and package-lock reproducibility proof. |
| Runtime reference docs | `docs/ARCHITECTURE.md`, `docs/CHANNEL_BLOCKING_SYSTEM.md`, `docs/CODEMAP.md`, `docs/CONTENT_HIDING_PLAYBOOK.md`, `docs/DEVELOPER_GUIDE.md`, `docs/FUNCTIONALITY.md`, `docs/JSON_FIRST_FILTERING_PLAN.md`, `docs/NETWORK_REQUEST_PIPELINE.md`, `docs/PROACTIVE_CHANNEL_IDENTITY.md`, `docs/PROFILES_PIN_MODEL.md`, `docs/TECHNICAL.md`, `docs/THREE_DOT_MENU_IMPROVEMENTS.md`, `docs/WATCH_PLAYLIST_BREAKDOWN.md`, `docs/json_paths_encyclopedia.md`, `docs/watch_json_paths.md`, `docs/youtube_renderer_inventory.md` | These docs steer runtime changes. A stale renderer, channel identity, or network claim can create false fixes. | Claims table: current/proposed/historical/stale, each tied to code lines or fixtures. |
| Product/release/sync docs | `docs/ANDROID_PUBLIC_DISTRIBUTION.md`, `docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md`, `docs/DATA_PORTABILITY_SYNC_WHITELIST_PLAN.md`, `docs/LEGACY_CHANNELS.md`, `docs/MOBILE_APP_HANDOFF_CONTEXT.md`, `docs/NANAH_MANAGED_LINK_QA.md`, `docs/NANAH_P2P_PROJECT_PLAN.md`, `docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md`, `docs/NANAH_USER_GUIDE.md`, `docs/SUBSCRIBED_CHANNELS_IMPORT.md`, `docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md`, `docs/YOUTUBE_KIDS_INTEGRATION.md`, `docs/collab_three_dot_ui_google_aistudio.md`, `docs/filtertube-scenic-media-prompt-brief.md`, `docs/filtertube-serene-website-platform-expansion-plan.md`, `docs/filtertube_mobile_runtime_adapter_plan.md`, `docs/filtertube_mobile_tv_architecture_plan.md` | These files connect extension runtime, apps, Nanah, Kids, public distribution, and website release surfaces. | Release-state proof and native-runtime-copy proof; mark each doc as authoritative plan, shipped behavior, or historical context. |
| Extension visual assets | `assets/images/Android_icon.png`, `assets/images/iOS_icon.png`, `assets/images/homepage_hero_day.mp4`, `icons/file.svg`, `icons/icon-16.png`, `icons/icon-32.png`, `icons/icon-48.png`, `icons/icon-64.png`, `icons/icon-128.png`, `icons/icon-128.svg` | Popup/dashboard visuals cannot change filter semantics, but can slow extension UI, bloat packages, or create icon/store mismatch. | Packaged asset budget and generated shell usage proof, including reduced-motion behavior for videos. |

### Website Surface Ledger - 1

The website does not run on YouTube pages and therefore is not a direct cause of extension false hides or YouTube lag. It is still in scope because it publishes privacy, download, and release-state claims and includes media/analytics code that can affect public trust and site performance.

| Surface | Proof | Reads / writes / sends | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Website layout analytics | `website/app/layout.js:7`, `website/app/layout.js:125`. | Adds Vercel `<Analytics />` only inside the website root layout. | Confirms analytics is website-only from code location; privacy copy should keep saying this is not in extension/native apps. | `KEEP` + policy fixture |
| Website early theme script | `website/app/layout.js:89-112`. | Reads `window.localStorage['filtertube-theme']`, sets document theme/scene datasets before interactive. | Website-only local storage; no product rule data. Low risk, but privacy policy should not imply app/extension analytics. | `KEEP` |
| Theme toggle | `website/components/theme-toggle.js:37-64`, `website/components/theme-toggle.js:67-76`. | Adds/removes storage and custom-event listeners; writes localStorage theme. | Website-only preference. Good cleanup. | `KEEP` |
| Scene controller | `website/components/scene-controller.js:57-85`. | Schedules one timeout until next scene boundary and listens to `visibilitychange`; cleanup removes both. | Website-only time-based DOM dataset update; no repeated scroll/load observer. | `KEEP` |
| Reveal component | `website/components/reveal.js:1-10`. | Adds `data-reveal="true"` only; no delayed JS observer. | Good correction from earlier delayed reveal concern: content is present immediately. | `KEEP` |
| Homepage hero video | `website/app/page.js:177-?`, route source `website/components/route-content.js:20`. | Uses `/videos/homepage/day/homepage_hero_day.mp4`; public copies are ~12.4 MB each. | Website performance risk. Asset duplication exists under `website/public/videos/homepage/day/` and `website/public/videos/homepage/`. | `INSTRUMENT` asset manifest |
| iOS scenic hero video | `website/components/route-content.js:367`, render path `website/components/scenic-detail-page.js:111-126`. | iOS route uses `/videos/ios/ios_hero_slow_540.mp4` with `preload="metadata"`, autoplay, loop, muted, playsInline. | Website-only visual media; optimized public video is ~2.18 MB, source asset is ~6.15 MB. Needs mobile/perf check but not extension lag. | `KEEP` + media budget |
| External browser logos | `website/components/route-content.js:30-67`. | Uses CDN image URLs for browser logo rail. | Public website makes third-party image requests; privacy page should avoid claiming zero third-party website requests beyond analytics/hosting if these remain. | `INSTRUMENT` privacy copy check |
| Downloads page claims | `website/app/downloads/page.js:14-18`, Android/iOS cards `website/app/downloads/page.js:23-78`, market claims `website/app/downloads/page.js:80-117`. | Static copy links GitHub releases, Play status anchor, iOS status anchor. | Public release claims must be synchronized with actual GitHub/Play/App Store readiness. | `GATE` release checklist |
| Privacy page coverage | `website/app/privacy/page.js:5-9`, summary cards `website/app/privacy/page.js:11-36`, platform coverage `website/app/privacy/page.js:38-69`, no-collection list `website/app/privacy/page.js:71-79`. | Static policy copy covers extension, Android, iOS/iPad, TV path, website, Nanah. | Needs copy QA against actual runtime, especially Vercel Analytics website-only and Nanah signaling limitations. | `KEEP` + policy proof |
| Website dependency surface | `website/package.json:5-22`, `website/next.config.mjs:3-10`. | Next build scripts, Node 22, Next/React/Tailwind/Vercel Analytics dependencies, optimize Phosphor imports. | Build reproducibility/performance risk, not filtering risk. | `KEEP` + lockfile check |

Website asset snapshot from current tracked files:

```text
assets/images/Android_icon.png                         2.20 MB
assets/images/iOS_icon.png                             1.59 MB
assets/images/homepage_hero_day.mp4                    4.54 MB
website/assets/videos/ios/ios.mp4                      6.15 MB
website/public/videos/ios/ios_hero_slow_540.mp4        2.18 MB
website/public/videos/homepage/homepage_hero_day.mp4  12.42 MB
website/public/videos/homepage/day/homepage_hero_day.mp4 12.42 MB
```

Website audit target:

```text
Website code cannot cause YouTube filtering bugs directly.
It can still cause:
  stale public claims,
  privacy copy drift,
  download/release mismatch,
  heavy media loads,
  third-party request surprises.

Therefore website completion needs:
  copy-to-runtime proof,
  release status proof,
  media budget proof,
  analytics/third-party request proof.
```

### Audit Execution Matrix

The symptoms reported so far - empty-install lag, false hiding, end-screen gaps, and recommendation drift - are not the audit boundary. They are evidence that the system needs a full method-by-method pass across four dimensions:

| Dimension | Question | Required proof | Current status |
| --- | --- | --- | --- |
| Correctness | Can this path hide/show the wrong content, leak blocked content, or preserve stale state? | Input state, route/surface, decision branch, hide writer or JSON mutation line. | In progress; active-state and whitelist/blocklist contracts have initial proof. |
| Performance | Can this path wake YouTube, scan broad DOM, parse/stringify JSON, fetch pages, or keep observers/timers alive when no enforcement exists? | Observer/listener/timer/query/fetch line plus active predicate proof. | In progress; empty blocklist wakeup paths have initial proof. |
| Side effects | Can this path click, pause/play, fetch, import, sync, broadcast settings, or write storage in a way users/YouTube can observe? | User-action suppression, network route, background action, storage mutation, broadcast line. | In progress; click/fetch/message mutation tables exist but need full action schema. |
| Code burden | Is the same identity, mode, hide, menu, import, or profile logic implemented in multiple places? | Duplicate function list, caller graph, source-of-truth proposal. | In progress; metadata builder and active-state consolidation candidates recorded. |

Audit unit rule:

```text
For every file/method:
  1. Identify whether it reads settings, reads YouTube data, mutates JSON, mutates DOM, writes storage, sends messages, fetches, clicks, or schedules work.
  2. Prove the active predicate that allows it to run.
  3. Prove the quiet/no-rule behavior.
  4. Prove the route/profile/list-mode behavior.
  5. Record KEEP / INSTRUMENT / GATE / REWRITE / REMOVE.
```

This prevents a narrow "fix whitelist" response. A whitelist regression can originate in import, Nanah, V3 migration, UI optimistic state, background merge, content storage listeners, seed JSON skip logic, DOM fallback active gates, or CSS restore drift.

### Remaining Method Ledger Queue

The full audit should not be considered complete until these queues have proof-backed entries. "Initial" means one architectural pass exists; "method ledger" means every function/action in the file is classified.

| Queue | Files | Current proof | Remaining work |
| --- | --- | --- | --- |
| Runtime entry queue | `manifest*.json`, `js/seed.js`, `js/content/bridge_injection.js`, `js/injector.js`, `js/content_bridge.js` | Load order, fetch/XHR hook, main-world bridge, subscriptions import, early queue, no-op rewrite risks, and `content_bridge.js` / `seed.js` / `injector.js` / `bridge_injection.js` method-family ledgers complete. | Convert startup/settings-revision/capability-token expectations into browser-specific fixtures and instrumentation. |
| Decision engine queue | `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/content/dom_extractors.js`, `js/content/dom_helpers.js` | Core JSON decision order, `filter_logic.js` and `dom_fallback.js` method-family ledgers, DOM active gate, hide writers/restorers, extractor groups, and CSS drift identified. | Convert boolean hide decisions into reason/confidence map; fixture every renderer/card type in `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`; complete extractor/helper method ledgers. |
| Affordance queue | `js/content/block_channel.js`, `js/content/menu.js`, `js/content/collab_dialog.js`, `js/content/handle_resolver.js` | Quick block, 3-dot/fallback menu, collaboration observer, resolver fetches, prompt scripts, and menu CSS helpers are ledgered. | Convert lifecycle gates into no-rule/action fixtures: install, pause, disconnect, route scope, and mutation target. |
| State queue | `js/background.js`, `js/state_manager.js`, `js/settings_shared.js`, `js/io_manager.js`, `js/nanah_sync_adapter.js`, `js/security_manager.js` | Compiled settings, message mutation, imports, Nanah sync, backup/restore, profile locks, and key drift are ledgered. | Turn the storage/action schema into executable tests with allowed sender, writes, network, profile unlock, broadcast, and transition report assertions. |
| UI queue | `js/tab-view.js`, `js/popup.js`, `js/render_engine.js`, `js/ui_components.js`, `js/layout.js`, `js/ui-shell/*.js`, `html/*.html` | Mode UI, active filter UI, popup target resolution, render-engine optimistic toggles, custom dropdowns, prompts, shell media, and legacy reveal CSS are ledgered. | Prove every user control maps to one canonical state mutation and cannot silently create empty active rules or stale runtime state. |
| CSS/build/docs queue | `css/*.css`, build/release scripts, docs | Global hide/layout drift, inactive default-hide CSS quarantine, release artifact flow, and docs/runtime drift are ledgered. | Build packaged-asset guards and docs-to-runtime checks so default-hide CSS or stale release artifacts cannot ship accidentally. |
| Vendor/sync queue | `js/vendor/nanah.bundle.js`, `js/vendor/qrcode.bundle.js`, Nanah docs | Vendor bundles, Nanah source drift, QR bundle source, and native runtime sync boundary are ledgered. | Record exact vendor source revisions and release manifests; verify app/extension runtime copies are reproducible. |

Immediate next proof queue from the latest pass:

| Priority | Target | Why next |
| ---: | --- | --- |
| 1 | `js/content_bridge.js` full method ledger | Method-family ledger is complete at line-level family granularity for `js/content_bridge.js:3-12985`. Remaining work is to convert accepted invariants into tests/instrumentation before source fixes. |
| 2 | `js/filter_logic.js` route/renderer decision ledger | Initial method-family ledger is complete. Next proof is executable route/renderer fixtures against `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`. |
| 3 | `js/seed.js` no-op/endpoint ledger | Initial method-family ledger is complete. Next proof is measured endpoint fixtures that classify every branch as passthrough, metadata harvest, snapshot, or mutation. |
| 4 | `js/content/dom_fallback.js` writer/restorer ledger | Initial method-family ledger is complete. Next proof is executable DOM fixtures and a writer/restorer table for every direct display/class/attr mutation. |
| 5 | `js/content/block_channel.js` affordance lifecycle ledger | Quick block and menu interactions must prove no-rule/no-visible-feature behavior, observer teardown, and action mutation targets. |
| 6 | `js/background.js` executable action schema | The audit now has a documented schema; it still needs code-level declaration/tests before behavior changes. |

Latest function-inventory refinement:

| Hot runtime file | Lexical functions / nested helpers found | Current method proof state | Completion blocker |
| --- | ---: | --- | --- |
| `js/content_bridge.js` | 330 | Family-level ledgers cover the full file at line-range granularity; generated helper-to-family map now exists in `docs/audit/FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md`. | Counter/fixture proof is still missing for direct hides, prefetch, map writes, fallback menu scans, and action rollback. |
| `js/background.js` | 139 | Background authority and action-family ledgers exist. | Action registry fixtures must prove sender/write/network/profile/broadcast contract per action. |
| `js/injector.js` | 103 | Import, data hook, collaborator/channel lookup, seed relay families are ledgered. | Capability-token and settings-revision fixtures are missing. |
| `js/content/dom_fallback.js` | 80 | DOM fallback method-family ledger exists. | Direct writer/restorer inventory and structured decision fixtures are missing. |
| `js/content/block_channel.js` | 61 | Quick block/menu lifecycle ledger exists. | Disabled-affordance observer/timer proof is missing. |
| `js/filter_logic.js` | 25 | JSON decision-function ledger exists. | Renderer fixture matrix and reason/confidence result object are missing. |
| `js/seed.js` | 21 | Seed endpoint/no-op ledger exists. | Fetch/XHR current-behavior fixtures are missing. |
| `js/content/bridge_settings.js` | 22 | Settings delivery/refresh methods are ledgered. | One-revision/one-apply fixture is missing. |
| `js/content/handle_resolver.js` | 7 | Resolver method table exists. | Passive resolver side-effect budget fixture is missing. |

Generated function-to-family artifact:

- `docs/audit/FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md`
- 874 lines
- 788 lexical function/helper rows
- Covers `js/seed.js`, `js/injector.js`, `js/content_bridge.js`, `js/content/dom_fallback.js`, `js/content/block_channel.js`, `js/content/bridge_settings.js`, `js/content/handle_resolver.js`, `js/background.js`, and `js/filter_logic.js`

This closes the first strict "every method" mapping gap for the hot runtime stack: every detected lexical helper now has a line number, proposed family, marker scan, and required proof gate. It does **not** prove safety yet. Safety still requires executable fixtures/counters for each accepted family and direct tests for functions with observer/timer/network/message/storage/hide-write/engagement markers.

Heuristic function-family distribution from the same scan:

| File | Total | Settings/runtime | Network/JSON | Filter/hide | Identity/meta | Lifecycle | UI/DOM | Import/trust | Background action | General |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `js/seed.js` | 21 | 4 | 4 | 0 | 2 | 6 | 0 | 0 | 0 | 5 |
| `js/injector.js` | 103 | 8 | 9 | 3 | 32 | 5 | 5 | 8 | 0 | 33 |
| `js/content_bridge.js` | 330 | 15 | 28 | 52 | 126 | 15 | 36 | 0 | 0 | 58 |
| `js/content/dom_fallback.js` | 80 | 3 | 0 | 36 | 13 | 0 | 4 | 0 | 0 | 24 |
| `js/content/block_channel.js` | 61 | 2 | 0 | 38 | 2 | 4 | 5 | 0 | 0 | 10 |
| `js/content/bridge_settings.js` | 22 | 11 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 6 |
| `js/content/handle_resolver.js` | 7 | 0 | 1 | 0 | 5 | 1 | 0 | 0 | 0 | 0 |
| `js/background.js` | 139 | 22 | 13 | 26 | 41 | 1 | 1 | 6 | 29 | 0 |
| `js/filter_logic.js` | 25 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 15 |

This distribution is heuristic, but it exposes where the code-burden risk lives:

- `js/content_bridge.js` has the heaviest identity/metadata surface and also owns many hide/action paths. It should be split by capability before optimizing.
- `js/background.js` has mixed settings, identity, filtering, trust, and storage/action responsibilities. It needs a declared action registry before more UI writes are added.
- `js/content/dom_fallback.js` and `js/content/block_channel.js` are dominated by filter/hide and affordance behavior. They need active-report and lifecycle gates before any further selector work.
- `js/injector.js` has a large "general helper" tail because nested JSON scanners and imported helper predicates are not named by capability. This should be cleaned by capability sections or generated coverage comments after fixtures exist.

Function-coverage artifact interpretation:

```text
Mapped:
  every lexical function/helper detected in the hot runtime stack

Not yet proven:
  runtime execution count,
  quiet no-rule behavior,
  route/profile/list-mode behavior,
  side-effect budget,
  false-hide / leak behavior,
  fixture-backed renderer behavior.

Therefore:
  function coverage is an audit index, not a release gate by itself.
```

### Current Proof Coverage Matrix

This table is the working "what have we actually looked at" map. `Initial proof` means a line-backed disease-level pass exists; it does not mean the subsystem is fully safe.

| Subsystem | Current proof state | Strongest proof so far | Still not proven |
| --- | --- | --- | --- |
| Main-world JSON/XHR hook | Initial proof | `manifest.json:31-35`, `js/content/bridge_injection.js:85-91`, and `js/seed.js:353-356`, `js/seed.js:427-431` prove early responses can pass unfiltered before settings/engine are ready. | Endpoint-by-endpoint response fixtures, pending-classification policy, and XHR/fetch equivalence tests. |
| DOM fallback hide/restore | Initial proof | `js/content/dom_helpers.js:88`, `js/content/dom_helpers.js:197`, `js/content/dom_fallback.js:2253-2272`, and `js/content/dom_extractors.js:171-178` prove hide writers and restore cleanup are not symmetric. | Every writer/restorer pair, every direct `style.display` mutation, and all route-specific restore behavior. |
| Quick block and fallback menu affordances | Initial proof | `js/content/block_channel.js:1463`, `js/content/block_channel.js:1607`, `js/content/block_channel.js:1651`, `js/content_bridge.js:6061-6615` prove observers/listeners/timers exist beyond a single visible UI action. | Full install/pause/resume/teardown lifecycle and no-rule/no-visible-feature behavior. |
| Background message surface | Deep proof started | `js/background.js:3242-3265`, `js/background.js:4381-4396`, `js/background.js:5209-5255`, and the peer-integrated storage-write family map prove open settings retrieval, content-origin mutations, compile-time writes, map writes, and script injection surfaces. | Convert the documented action schema into code-level declarations and tests for allowed sender class, storage writes, network side effects, profile lock requirements, cache invalidation, and rate limits. |
| Settings compiler/cache | Deepening now | `js/background.js:1784-1827`, `js/background.js:2474-2551`, `js/background.js:4458-4495`, and `js/content/bridge_settings.js:547-603` prove reader keys, background invalidation keys, and content refresh keys are not the same contract. | Canonical key contract and proof that no consumer can use stale compiled settings after any user-visible control changes. |
| UI intent and mode transitions | Deep proof started | `js/popup.js:816-860`, `js/background.js:3302`, `js/background.js:3443-3445`, `js/state_manager.js:1009-1236`, `js/tab-view.js:10314-10630`, and import/Nanah paths prove UI copy intent, mode/list mutation, direct map writes, and push-compiled-settings paths can drift from background authority. | Every popup/tab-view/render-engine control mapped to one canonical mutation API with background-built runtime revision. |
| Import/export/Nanah | Initial proof | `js/io_manager.js:1330-1645`, `js/nanah_sync_adapter.js:168-257`, and migration paths prove mode/list changes can arrive outside manual UI. | Fixtures for old V3, V4, scoped Nanah, full import, merge/replace, and empty-whitelist warnings. |
| Identity and metadata fetches | Initial proof | Background fetch points and `filter_logic.js:2162-2172` prove metadata/category rules can fail open and can trigger background work. | Per-feature policy for when extension-origin fetches are allowed and how missing identity is classified. |
| CSS/global layout | Deep proof started | `.filtertube-hidden` / `.filtertube-visible` drift is recorded, and `css/filter.css:8-35`, `css/content.css:8-36`, `css/layout.css:509-803` prove copied legacy CSS contains default-hide and aggressive `:not(.filter-tube-visible)` hazards. | Full CSS writer ownership map, route-specific layout proof, and explicit legacy/orphan classification for copied but inactive CSS assets. |
| Website/build/release/app sync | Initial proof | Release/download pages, app runtime copy paths, and `build.js:214-272`, `build.js:388-435` artifact/release behavior have drift notes. | Reproducible packaged asset map across extension, Android, and iOS runtime copies plus release checklist gating app artifacts. |

### Current Hypothesis Ranking

These are not final fixes; they are the current strongest hypotheses to prove or discard as the audit progresses.

| Rank | Hypothesis | Why credible | Proof already captured | Required next proof |
| ---: | --- | --- | --- | --- |
| 1 | Fresh-install lag comes from always-on scaffolding, not from actual empty-blocklist hide decisions. | Empty blocklist does not hide by core rules, but observers, scanners, prefetch, and JSON hooks still wake. | `js/content_bridge.js:5717-6055`, `js/content_bridge.js:6498-6624`, `js/content/block_channel.js:2358-2397`, `js/seed.js:633-785`. | Instrument no-rule install: observer count, scanned nodes, parsed bytes, response replacements, fetches. |
| 2 | Some false hides are state-mode bugs, not matcher bugs. | Empty whitelist is intentionally fail-closed; imports/sync/mode switch can enter whitelist or preserve it. | `js/filter_logic.js:1933-1967`, `js/background.js:3302`, `js/background.js:3443-3445`, `js/io_manager.js:1330-1645`, `js/nanah_sync_adapter.js:168-257`. | Transition-report fixtures for popup, dashboard, import, full restore, Nanah main/kids/active/full. |
| 3 | Some false hides are active-predicate bugs. | `categoryFilters.enabled` and some content filters can mark enforcement active even when inner rule values are empty/invalid. | `js/seed.js:214-223`, `js/content/dom_fallback.js:1992-1995`, `js/filter_logic.js:2130-2133`, `js/content/dom_fallback.js:2468-2471`. | Canonical active report and fixtures for enabled-empty controls. |
| 4 | Recommendation drift risk comes from side effects and identity resolution, not simple hide CSS. | Static code shows synthetic clicks, media actions, and extra watch/shorts/channel fetches. | `js/content/dom_fallback.js:2384-2396`, `js/content/dom_fallback.js:2434`, `js/content_bridge.js:8123`, `js/content_bridge.js:8272`, `js/background.js:2889-3102`. | Instrument extension-initiated clicks/fetches and prove they are only user-action or active-rule dependent. |
| 5 | End-screen leakage is a coverage contract gap. | JSON renderer support exists but DOM/player end-screen inventory is not first-class and defaults are off. | `js/filter_logic.js:369`, `js/filter_logic.js:429`, `js/content/dom_fallback.js:1316`, `js/state_manager.js:77-78`. | Fixture end-screen JSON/player DOM and decide user-facing default/setting behavior. |

### Ignored/Orphan Runtime Artifacts

| File | Proof | Status | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `WHITELIST_content.JS` | 9,301 lines; ignored by `.gitignore:54` through case-insensitive match; not referenced by manifests or tracked git. | Local ignored artifact, likely old/minified whitelist experiment. | Can confuse manual audits and should not be treated as shipped extension code unless deliberately restored. | `QUARANTINE` |

Current shipped manifests do not reference this artifact. The audit should focus on tracked files and packaged assets, but ignored local runtime bundles should be kept out of release/build paths.

Ignored root captures such as `YT_MAIN_NEXT.json`, `YT_MAIN_WATCH.html`,
`YT_MAIN_UPNEXT_FEED_WATCHPAGE*.json`, `reel_item_watch?prettyPrint=False.JSON`,
`ytkids_browse?alt=json.json`, and YTM JSON/HTML/TXT files are different from
ignored runtime bundles: they are raw YouTube evidence inputs used to derive
`docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`.
They should not be shipped or blindly committed, but they are valid audit
inputs for generating minimal tracked fixtures.

## Runtime Wakeup Map

Static scan of `js/**/*.js` shows the runtime has many wakeup points. These are not bugs by themselves; they are places that can wake YouTube while the page is hydrating.

| Wakeup type | Highest-density files | Initial verdict |
| --- | --- | --- |
| `MutationObserver` | `js/content_bridge.js` 7, `js/content/block_channel.js` 6 | `GATE` observers behind active features where possible. |
| `setTimeout` | `js/content_bridge.js` 35, `js/tab-view.js` 14, `js/content/block_channel.js` 12, `js/background.js` 10, `js/content/dom_fallback.js` 10 | `INSTRUMENT` before pruning; many are debounces/retries, some are warmups. |
| `setInterval` | `js/content/block_channel.js`, `js/content_bridge.js`, `js/injector.js`, `js/tab-view.js` | `GATE`; intervals need explicit stop conditions and active-feature reasons. |
| `requestAnimationFrame` | `js/tab-view.js` 11, `js/content_bridge.js` 9, `js/ui_components.js` 4, `js/content/block_channel.js` 3 | `KEEP` for UI positioning, `GATE` for runtime scans. |
| Programmatic clicks | `js/content/dom_fallback.js`, `js/injector.js`, `js/tab-view.js`, `js/popup.js` | `INSTRUMENT`; YouTube-facing clicks require a special engagement-risk ledger. |
| Direct fetches | `js/seed.js`, `js/background.js`, `js/content_bridge.js`, `js/content/handle_resolver.js`, `js/injector.js` | `KEEP` only when they ride YouTube requests or are user-initiated; extra identity fetches need gates. |

### Automated Symbol / Lifecycle Inventory - 2026-05-17

This inventory was generated from the current worktree with a Node static scan over tracked runtime/UI/build JavaScript files, excluding `node_modules`, `dist`, and website build output. Counts are lexical and intentionally conservative: they are not proof of execution frequency, but they identify where fixtures and counters must attach.

| File | LOC | funcs | lifecycle refs | side-effect refs | observers | timers/RAF/idle | messages/storage | fetch/XHR | hide writes | click/media |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `js/tab-view.js` | 11618 | 311 | 173 | 41 | 0 | 26 | 2 | 5 | 2 | 19 |
| `js/content_bridge.js` | 12922 | 330 | 75 | 44 | 8 | 44 | 10 | 4 | 29 | 1 |
| `js/background.js` | 6271 | 139 | 10 | 31 | 0 | 10 | 35 | 7 | 0 | 0 |
| `js/injector.js` | 3537 | 103 | 8 | 14 | 0 | 6 | 10 | 1 | 0 | 1 |
| `js/content/dom_fallback.js` | 4839 | 80 | 13 | 32 | 0 | 10 | 0 | 0 | 21 | 11 |
| `js/content/block_channel.js` | 2363 | 61 | 55 | 4 | 6 | 15 | 0 | 0 | 4 | 0 |
| `js/popup.js` | 1842 | 53 | 33 | 5 | 0 | 3 | 0 | 5 | 0 | 5 |
| `js/state_manager.js` | 2470 | 64 | 6 | 4 | 0 | 6 | 4 | 0 | 0 | 0 |
| `js/ui_components.js` | 999 | 33 | 25 | 4 | 1 | 7 | 0 | 0 | 1 | 1 |
| `js/io_manager.js` | 2009 | 52 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `js/render_engine.js` | 1390 | 41 | 9 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `js/filter_logic.js` | 3499 | 25 | 2 | 6 | 0 | 2 | 6 | 0 | 0 | 0 |
| `js/content/bridge_settings.js` | 610 | 22 | 8 | 2 | 0 | 6 | 2 | 0 | 0 | 0 |
| `js/settings_shared.js` | 1174 | 29 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/shared/identity.js` | 809 | 27 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `build.js` | 687 | 25 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/seed.js` | 1028 | 21 | 1 | 2 | 0 | 1 | 1 | 2 | 0 | 0 |
| `js/nanah_sync_adapter.js` | 414 | 23 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/content/dom_extractors.js` | 1103 | 21 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/content/collab_dialog.js` | 345 | 13 | 6 | 1 | 1 | 2 | 1 | 0 | 0 | 0 |
| `js/security_manager.js` | 199 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `js/content/handle_resolver.js` | 283 | 7 | 1 | 3 | 0 | 1 | 3 | 1 | 0 | 0 |
| `js/content/release_notes_prompt.js` | 251 | 6 | 2 | 0 | 0 | 1 | 0 | 1 | 0 | 0 |
| `js/content/dom_helpers.js` | 207 | 3 | 0 | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| `js/content/first_run_prompt.js` | 191 | 4 | 3 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `js/content/bridge_injection.js` | 128 | 3 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |

Inventory interpretation:

| Finding | Evidence from inventory | Audit consequence |
| --- | --- | --- |
| Extension UI is the largest code mass but not the page-load disease by itself. | `js/tab-view.js` has 11,618 LOC, 311 functions, and many UI listeners, but it runs in the dashboard/tab UI, not every YouTube document. | Keep UI mutation-authority audit, but do not blame fresh YouTube page lag on tab-view unless it broadcasts settings or opens managed flows. |
| Page-resident hot surface is concentrated. | `js/content_bridge.js`, `js/content/dom_fallback.js`, `js/content/block_channel.js`, `js/injector.js`, and `js/seed.js` are the page/runtime stack from the manifest flow. | First counters must attach here, not in website/app-card/UI code. |
| Observer density is not evenly spread. | `content_bridge` has 8 observer refs and `block_channel` has 6; most other files have none. | Empty-install observer fixture can be narrow and still cover the likely lag disease. |
| Hide writes are split across three owners. | `content_bridge` has 29 hide-write refs, `dom_fallback` has 21, `dom_helpers` has 4. | Structured hide decision must become cross-file; fixing only `dom_helpers` would leave direct hide writers. |
| Engagement-sensitive calls are concentrated. | `dom_fallback` has 11 click/media refs and `tab-view`/`popup` have UI click refs. | YouTube-facing click/media fixture should target `dom_fallback` first; UI click refs are separate user-interface actions. |
| Settings/message authority remains split. | `background` has 35 message/storage refs; `content_bridge` and `injector` each have 10; `filter_logic` has 6 post/message-style refs. | Runtime revision/source authority needs tests across background, bridge, injector, and seed. |

Inventory stop condition before behavior changes:

```text
For each page-resident hot file:
  js/seed.js
  js/injector.js
  js/content_bridge.js
  js/content/dom_fallback.js
  js/content/block_channel.js
  js/content/bridge_settings.js
  js/content/handle_resolver.js

there must be at least one fixture or counter that can prove:
  whether it starts on empty blocklist,
  whether it starts on empty whitelist,
  whether it creates observers/listeners/timers,
  whether it writes hidden state,
  whether it posts or persists learned maps,
  whether it performs YouTube-facing fetch/click/media side effects.
```

Coverage reconciliation from this inventory:

| Hot file | Existing audit coverage | Missing proof before fixes |
| --- | --- | --- |
| `js/seed.js` | Seed endpoint behavior, no-settings queues, harvest-only side effects, fetch/XHR divergence, and startup parse/rebuild risk are documented. | Executable fetch/XHR fixture proving empty blocklist no replacement, settings-delay queue cap, and harvest-only map-write budget. |
| `js/injector.js` | Main-world message listener, subscription import, snapshot roots, collaborator lookup, duplicate settings delivery, and import click/scroll side effects are documented. | Capability-token fixture proving import-only paths cannot be spoofed and collaborator/channel lookup only runs for action/active-rule reasons. |
| `js/content_bridge.js` | Prefetch, fallback initialization, menu injection, stats, media pause, collaborator enrichment, map writes, direct hides, and fallback menu scans are deeply documented. | Counter coverage for observer install, prefetch scan, forced DOM rerun, direct hide writers, map writes, and action rollback. |
| `js/content/dom_fallback.js` | Active-work gates, playlist side effects, whitelist fail-closed behavior, category metadata fetch, shelf cleanup, and hide decisions are documented. | Structured hide-decision fixture, YouTube-facing click/media fixture, and active-report fixture for enabled-empty category/content controls. |
| `js/content/block_channel.js` | Quick-block observer/listener/timer density, viewport/fullscreen churn, and fallback menu observer startup are documented. | Affordance lifecycle fixture proving disabled quick block and disabled 3-dot item install no observers/timers/scans. |
| `js/content/bridge_settings.js` | Duplicate settings application and settings refresh/invalidation drift are documented. | Revision fixture proving one background settings change creates one seed apply and no caller-pushed partial settings overwrite. |
| `js/content/handle_resolver.js` | Content-origin handle fetch side effects are documented. | Side-effect budget fixture proving passive handle resolution only runs under active unresolved rules, not empty installs. |
| `js/background.js` | Message/action schema, settings compiler impurity, cache invalidation, identity fetches, script injection, map writes, and mode transitions are documented. | Background action registry fixture proving sender class, storage writes, network permission, profile lock, cache invalidation, and revision output per action. |
| `js/filter_logic.js` | JSON renderer gaps, active predicate drift, whitelist/blocklist semantics, category metadata pending, and identity confidence are documented. | Renderer fixture suite and `channelMatchResult` proof for UC/handle/custom/name/collab/recycled DOM confidence. |
| `js/tab-view.js`, `js/popup.js`, `js/render_engine.js`, `js/state_manager.js`, `js/io_manager.js`, `js/nanah_sync_adapter.js` | UI mutation intent, import/export/Nanah state shape, render-engine enabled-empty toggles, profile switching, and list-mode copy intent are documented. | Mutation intent fixtures proving every UI/import/Nanah/native action flows through a single background-owned profile transaction. |

Reconciled disease statement:

```text
The audit no longer needs more broad guessing to explain the lag/false-hide class.
The current proof points converge on three missing executable contracts:

1. activeRuntimeReport:
   controls whether seed, DOM fallback, quick block, fallback menu, prefetch,
   metadata fetch, handle resolver, and map writes are allowed to wake up.

2. background-owned mutation/settings revision:
   controls whether popup, dashboard, import, Nanah, native apps, content actions,
   bridge, injector, and seed all describe the same profile/list/mode state.

3. structured decision/result objects:
   controls whether JSON, DOM, optimistic action hides, playlist skips, stats,
   media pauses, and restore paths can be audited as the same decision.
```

## Top-Level Runtime Flow

```text
manifest.json
  |
  +-- MAIN world document_start
  |     js/seed.js
  |       -> intercepts ytInitialData / ytInitialPlayerResponse
  |       -> wraps fetch() and XMLHttpRequest
  |       -> queues data until settings arrive
  |       -> calls FilterTubeEngine.processData() or harvestOnly()
  |
  +-- ISOLATED world document_start
        shared identity + menu/dom helpers + dom fallback + block_channel
        bridge_injection + bridge_settings + prompts + content_bridge
          -> injects MAIN scripts: identity, filter_logic, injector
          -> requests compiled settings from background
          -> initializes DOM fallback, fallback menu scans, observers, prefetch
          -> handles quick block / 3-dot / fallback menu actions
```

Proof:

- `manifest.json:25-61` and `manifest.chrome.json:25-61` load `js/seed.js` plus the isolated stack on every YouTube and YouTube Kids page.
- `js/content_bridge.js:5704-5711` initializes stats, injects main-world scripts, requests settings, and starts DOM fallback.
- `js/content/bridge_injection.js:75-103` injects `shared/identity`, `filter_logic`, `injector`, and schedules another settings request.
- `js/seed.js:606-680` wraps `fetch()` for `/youtubei/v1/search`, `/guide`, `/browse`, `/next`, `/player`.
- `js/seed.js:692-820` wraps `XMLHttpRequest` for the same endpoint family.

Initial verdict: `INSTRUMENT` and then `GATE`. The entry model is functionally powerful but not quiet on empty installs.

## Content Bridge Lifecycle Ledger - Initial Pass

`js/content_bridge.js` is the largest isolated-world runtime file and currently acts as a coordinator for all of these concerns:

```text
content_bridge
  -> debug/native-overlay quiet gates
  -> channel/card identity metadata helpers
  -> prefetch and main-world identity request queues
  -> stats and media side effects
  -> DOM fallback startup
  -> fallback 3-dot UI injection
  -> collaboration menu/dialog data
  -> message bridge from seed/injector/main world
  -> user actions that mutate blocklist/whitelist state
```

That concentration is useful for feature velocity, but it is now a runtime risk: an optimization in one feature can leave another observer/timer/fetch path active.

### Content Bridge Method Family Ledger - Start

Static method inventory from `js/content_bridge.js`: 12,985 lines and 169 function-like declarations. This is too large to treat as one "content script"; the audit needs family ownership and side-effect budgets.

| Method family | Representative proof | Reads/mutates/fetches/schedules | Disease-level concern | Current verdict |
| --- | --- | --- | --- | --- |
| Debug/native overlay gates | `isFilterTubeDebugEnabled()` `js/content_bridge.js:3-9`; `isFilterTubeNativeOverlayQuietMode()` `js/content_bridge.js:16-25`. | Reads document/native overlay attributes. | Helpful for native apps, but separate from true active-enforcement/no-rule quiet mode. | `KEEP` + integrate with active report |
| Channel metadata builders | `buildChannelMetadataPayload()` `js/content_bridge.js:119-193`; `hydrateChannelInfoFromCurrentMappings()` `js/content_bridge.js:280-343`; `collectCardTitleHints()` `js/content_bridge.js:345-408`. | Reads DOM/map state; normalizes identity. | Many call sites depend on confidence, but confidence is not a first-class return contract everywhere. | `INSTRUMENT` |
| Menu rendering state | Active menu register/cleanup `js/content_bridge.js:432-555`; render entries `js/content_bridge.js:571-789`; refresh menu `js/content_bridge.js:846-947`. | Mutates YouTube menu DOM and internal maps/timers. | Correct user-facing feature, but must be installed only when menu affordance is enabled and route-scoped. | `GATE` |
| Prefetch and identity queues | `schedulePrefetchScan()` `js/content_bridge.js:974-982`; observers `js/content_bridge.js:983-1143`; queue/drain/fetch `js/content_bridge.js:1145-1310`. | Observes cards, schedules scans, sends background/main-world requests, stamps DOM, writes maps. | A major empty-install cost and passive-learning/enforcement coupling point. | `REWRITE` lifecycle owner |
| Video metadata queue | `persistVideoMetaMapping()` `js/content_bridge.js:1465-1539`; `scheduleVideoMetaFetch()` `js/content_bridge.js:1621-1696`; `fetchVideoMetaFromWatchUrl()` `js/content_bridge.js:1716-1807`. | Writes media map, fetches watch HTML, schedules DOM reruns. | Needed for date/duration/category filters, but must be inactive unless those filters are active. | `GATE` |
| Multi-collaborator menu state | `setupMultiStepMenu()` `js/content_bridge.js:2097-2141`; collaborator sanitizers/quality methods `js/content_bridge.js:2221-2590`. | Mutates menu rows, selected collaborators, filter-all state, cached roster data. | User action feature with many fallbacks; needs one identity-confidence contract so wrong collaborator rows do not become rules. | `INSTRUMENT` |
| Renderer/DOM identity extraction | Renderer/data methods `js/content_bridge.js:2829-3139`; collaborator enrichment `js/content_bridge.js:3171-3479`; element metadata extraction `js/content_bridge.js:3778-4867`. | Reads YouTube renderer data, DOM text, attributes, cached data. | Large duplicated extraction surface; it can make different confidence decisions than `dom_extractors.js` and `filter_logic.js`. | `CONSOLIDATE` |
| Stats and playback side effects | Stats `js/content_bridge.js:3490-3734`; playback pause `js/content_bridge.js:3738-3776`. | Writes stats storage and pauses media on hide/show transitions. | Side effects must be downstream of structured first-hide decisions only. | `GATE` |
| Main-world request/response bridge | Requests `js/content_bridge.js:5146-5289`; handler `js/content_bridge.js:5468-5700`. | Posts window messages, tracks pending timeouts, applies responses to DOM/maps. | Needs exact source labels, request correlation, timeout cleanup, and no persistent writes outside background schema. | `GATE` |
| Initialization and DOM fallback owner | `initialize()` `js/content_bridge.js:5704-5715`; `initializeDOMFallback()` `js/content_bridge.js:5717-6056`. | Injects scripts, requests settings, starts fallback, observers, prefetch, menu scanner. | This is the central boot budget and should become the owner of feature lifecycle declarations. | `REWRITE` lifecycle |
| Fallback menu scan/popover | Scanner `js/content_bridge.js:6061-6624`; playlist popover `js/content_bridge.js:6629-7261`. | Scans DOM, injects buttons/popovers, adds click/scroll/mutation/timer hooks. | Pure affordance work should be completely dormant when block menu/quick actions are hidden or irrelevant. | `GATE` |
| Network identity fallbacks | Initial data search `js/content_bridge.js:7350-7721`; background/direct fetches `js/content_bridge.js:7868-8277`. | Reads global initial data or fetches `/shorts` and `/watch`. | High-cost and recommendation/privacy-sensitive. Requires active rule/action reason and rate budget. | `GATE` |
| Card extraction/action execution | Card extractor `js/content_bridge.js:8561-10089`; menu injection `js/content_bridge.js:10090-11340`; block/click paths `js/content_bridge.js:11342-12909`. | Extracts identity, injects 3-dot UI, sends add-channel actions, hides optimistic rows, toggles filter-all. | User action is legitimate, but it must carry selector confidence, profile/list target, and rollback metadata. | `INSTRUMENT` then `REWRITE` action API |

Method-ledger invariant for this file:

```text
content_bridge methods must declare one owner:
  bootstrap
  active filtering
  passive learning
  user affordance
  stats/playback side effect
  main-world bridge
  native quiet integration

Only active filtering and explicit user affordances may mutate visible YouTube DOM.
Only passive learning may persist maps, and only through the background schema.
```

### Content Bridge Method Detail Ledger - 1

This is the first per-method slice, covering `js/content_bridge.js:3-1813`. The audit status here is stronger than the family table: each row names the method range, side effects, active predicate, and the root-disease relevance.

| Method/range | Owner | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `isFilterTubeDebugEnabled()` / `filterTubeDebugLog()` (`js/content_bridge.js:3-15`) | Diagnostics | Console only. | Debug flag or document attribute. | `KEEP`. Debug logging is cleanly gated. |
| `isFilterTubeNativeOverlayQuietMode()` (`js/content_bridge.js:16-25`) | Native/app quiet integration | Reads global/document fullscreen/overlay flags. | Any caller can consult it; not tied to active rules. | `KEEP` but it is not a substitute for `hasActiveEnforcement(settings)`. |
| `extractJsonObjectFromHtml()` (`js/content_bridge.js:31-81`) | HTML JSON parser helper | CPU parse scan only. | Called by fetch parsing paths. | `KEEP`, but duplicate helper exists inside `fetchVideoMetaFromWatchUrl()` at `js/content_bridge.js:1722-1767`; consolidate to reduce drift. |
| `extractCustomUrlFromHref()` (`js/content_bridge.js:82-92`) | Identity normalization | None. | Called by extractors/action builders. | `KEEP`. |
| `isLowConfidenceExpectedChannelLabel()` (`js/content_bridge.js:93-118`) | Identity confidence | None. | Only if channel info has expected name + needs fetch + video id + mainworld strategy. | `KEEP` as confidence guard; future structured identity should return this as explicit confidence metadata. |
| `buildChannelMetadataPayload()` (`js/content_bridge.js:119-194`) | Identity payload builder | None; sanitizes names/handles/logos. | Any menu/action builder using channel info. | `KEEP` with fixture. It correctly avoids treating handles/UC IDs/views/ago/mix strings as display names. |
| `pickMenuChannelDisplayName()` (`js/content_bridge.js:195-279`) | Menu display identity | Reads `currentSettings.channelMap`. | Menu render/update paths. | `INSTRUMENT`. Display-name selection depends on mutable `currentSettings` rather than a passed identity snapshot. |
| `hydrateChannelInfoFromCurrentMappings()` (`js/content_bridge.js:280-344`) | Identity hydration | Reads `currentSettings.channelMap` and `videoChannelMap`; may infer video id from DOM. | Menu/action paths when channel info is incomplete. | `INSTRUMENT`. Useful repair path, but it couples UI action identity to passive learned maps. |
| `collectCardTitleHints()` (`js/content_bridge.js:345-409`) | DOM title extraction | Queries DOM selectors/aria labels. | Identity/action enrichment paths. | `KEEP` with confidence grade. It filters obvious metadata strings, but should return source selector/hint confidence. |
| `upsertFilterChannel()` (`js/content_bridge.js:410-431`) | Local runtime mirror | Mutates `currentSettings.filterChannels` only. | Content action paths can call it after background write. | `REWRITE`. Content should not own a persistent-looking list mirror without a background revision/result; this can diverge from storage normalization. |
| Active collaboration menu registry/cleanup (`js/content_bridge.js:432-570`) | Menu lifecycle | Mutates dropdown attrs, in-memory maps, removes menu items, dispatches Escape/click, sets `display:none`, timers/RAF. | User menu interaction only, but no central lifecycle declaration. | `GATE`. Legitimate user affordance, but force-close synthetic events (`js/content_bridge.js:506-552`) must be logged as UI-cleanup side effects, not content engagement. |
| Placeholder/menu rendering (`js/content_bridge.js:571-845`) | Menu UI rendering | Creates/removes DOM menu entries, pointer-event disabled placeholders, updates channel names. | Menu injection paths. | `KEEP` + source confidence. It must stay behind `showBlockMenuItem`/affordance gates and never install during no-visible-feature sessions. |
| `refreshActiveCollaborationMenu()` (`js/content_bridge.js:846-949`) | Collaboration menu refresh | Reads card attrs/caches, writes `data-filtertube-collaborators`, re-renders menu. | Active dropdown tracked for a video id. | `INSTRUMENT`. Good live repair, but collaborator roster changes need request/source correlation to avoid wrong collaborator actions. |
| `getStatsSurfaceKey()` (`js/content_bridge.js:950-957`) | Stats partition | Reads hostname only. | Stats paths. | `KEEP`. |

Prefetch and metadata queue detail:

| Method/range | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- |
| `schedulePrefetchScan()` (`js/content_bridge.js:974-982`) | Schedules RAF and calls `attachPrefetchObservers()`. | Only `prefetchScanScheduled`; no rule/route predicate. | `GATE`. Scheduling should require identity-prefetch active reason. |
| `attachPrefetchObservers()` (`js/content_bridge.js:983-1011`) | Queries playlist/card selectors and observes up to 120 cards. | Requires existing observer; no active-rule check. | `GATE`. Broad DOM query and observe budget on empty/no-rule sessions. |
| `startCardPrefetchObserver()` (`js/content_bridge.js:1012-1037`) | Creates `IntersectionObserver`, adds `visibilitychange` listener, observes cards. | Only observer availability. | `REWRITE` lifecycle owner. Needs active predicate, disconnect, and counters. |
| `installPlaylistPanelPrefetchHook()` (`js/content_bridge.js:1038-1081`) | Adds capture scroll listener, playlist `MutationObserver`, `yt-navigate-finish` listener. | One-time install only. | `GATE`. Route-specific feature but installed globally; no teardown. |
| `installRightRailWhitelistObserver()` (`js/content_bridge.js:1082-1144`) | Adds right-rail observer and `yt-navigate-finish` listeners; schedules forced DOM fallback passes. | One-time install; refresh callback checks whitelist and skips `/watch`. | `MERGE` into route scheduler. It observes watch-related rails but the callback returns on `/watch`, so purpose/scope must be clarified before changing behavior. |
| `queuePrefetchForCard()` (`js/content_bridge.js:1145-1198`) | Clears stale card identity attrs, may persist existing mapping, queues fetch work. | Any observed intersecting card with video id. | `GATE`. Correct stale cleanup, but learned-map persistence should happen only through passive-learning policy. |
| `drainPrefetchQueue()` / `withTimeout()` (`js/content_bridge.js:1199-1217`) | Runs up to two async prefetches, timer timeout. | Queue not paused and document visible. | `KEEP` caps; still needs active reason. |
| `prefetchIdentityForCard()` (`js/content_bridge.js:1218-1310`) | Kids: no network, DOM/main-world snapshot only. Main: DOM/main-world snapshot, stamps attrs, mutates `currentSettings.videoChannelMap`, sends `updateVideoChannelMap`. | Any queued card. | `REWRITE` split. Extraction is useful, but stamping + storage-message + DOM fallback rerun must be separated from passive learning. |
| `stampChannelIdentity()` (`js/content_bridge.js:1311-1333`) | Writes `data-filtertube-channel-*` attrs and schedules `applyDOMFallback(null)` after 120ms. | Any identity learn path. | `GATE`. DOM reprocess should only run if an active rule can use the learned identity. |
| `resetCardIdentityIfStale()` (`js/content_bridge.js:1334-1405`) | Clears blocked, collaborator, processed, hidden, and inline display attrs on recycled cards/wrappers. | Called when a card/video id changes. | `KEEP` with tests. This is an important stale-false-hide cleanup path. |
| `shouldStampCardForVideoId()` (`js/content_bridge.js:1421-1454`) | May call stale reset, reads links/live ids. | Map/main-world update paths. | `KEEP`. Good guard that prevents stamping a card without video-id proof. |
| `persistVideoChannelMapping()` (`js/content_bridge.js:1465-1486`) | Mutates `currentSettings.videoChannelMap`, sends background `updateVideoChannelMap`. | Any caller with video id/channel id. | `GATE`. Needs source/provenance and no-op equality check before storage wake. |
| `persistVideoMetaMapping()` (`js/content_bridge.js:1465-1540`) | Mutates `currentSettings.videoMetaMap`, evicts old entries, sends `updateVideoMetaMap`. | Any metadata fetch/update caller. | `GATE`. Needs active metadata rule or explicit harvest policy plus source/count report. |
| `scheduleVideoMetaDomRerun()` / `touchDomForVideoMetaUpdate()` (`js/content_bridge.js:1541-1620`) | Clears processed/duration/channel cache attrs, queries matching anchors, schedules DOM fallback. | Any video meta update. | `GATE`. Correct only when metadata-dependent filters are active. |
| `scheduleVideoMetaFetch()` (`js/content_bridge.js:1621-1697`) | Queues watch HTML fetch, rate-limits each video for 60s, caps attempt map at 3000. | Caller-provided needs; default `needDuration:true`. | `INSTRUMENT` then `GATE`. It has useful caps, but default duration need means callers that omit options create duration fetch intent. |
| `processWatchMetaFetchQueue()` / `fetchVideoMetaFromWatchUrl()` (`js/content_bridge.js:1698-1813`) | Up to 3 concurrent `https://www.youtube.com/watch?v=...` fetches; parses player response; persists meta; touches DOM; reruns fallback. | Not Kids; queued by DOM/JSON category/date/duration paths. | `GATE`. This is a high-cost side-effect path and must be tied to active category/date/duration rules and request budget. |

Metadata-fetch caller proof:

| Caller | Proof | Intent | Audit note |
| --- | --- | --- | --- |
| JSON category rule path | `js/filter_logic.js:2165-2169` | Fetch category when JSON item has video id but no category meta. | Correct only when category filters are enabled with selected values. |
| DOM category rule path | `js/content/dom_fallback.js:2468-2489` | Fetch category and mark pending for allow/home/search cases. | Good pending policy; needs active report. |
| DOM upload-date path | `js/content/dom_fallback.js:3312-3316` | Fetch dates when local/relative extraction fails. | Needs valid date condition proof before fetching. |
| DOM duration path | `js/content/dom_fallback.js:3528-3539` | Fetch Kids/mix-like durations when local duration missing. | The Kids branch calls the fetch scheduler, but `fetchVideoMetaFromWatchUrl()` returns null on Kids (`js/content_bridge.js:1718-1720`), so this path may schedule useless work unless guarded earlier. |

### Content Bridge Method Detail Ledger - 2

This slice covers `js/content_bridge.js:1814-4945`. It is still audit-only: no behavior change is implied here. The main disease-level pattern in this slice is that collaborator, stats, and playback helpers are useful, but several of them can write DOM attributes, schedule retries, touch storage, or force DOM fallback without first proving that an active rule or user action needs that work.

Debug tracker and collaboration menu state:

| Method/range | Owner | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `filteringTracker` (`js/content_bridge.js:1818-1885`) | Diagnostics | Keeps in-memory hidden/restored history and logs. | Debug object is always constructed, but heavy output is caller-driven. | `KEEP`. It should eventually receive structured decision IDs so hide/restore audits can correlate reason, renderer, and rule. |
| Collaboration globals (`js/content_bridge.js:1907-1913`) | Collaboration/menu lifecycle | Keeps pending cards, active dropdowns, resolved collaborator rosters, multi-step selection state, and cleanup timers. | File-level state, no central lifecycle owner. | `INSTRUMENT`. Needed for the feature, but must publish counts/timers so no-rule sessions can prove it is idle. |
| `findStoredChannelEntry()` (`js/content_bridge.js:1915-1929`) | Menu state hydration | Reads `currentSettings.filterChannels`. | Called by filter-all toggle hydration. | `REWRITE`. It is blocklist/list-shape blind: it does not consult whitelist collections, active profile target, Kids/Main list target, or future dual-list semantics. |
| Dropdown cleanup timers (`js/content_bridge.js:1931-1953`) | Menu lifecycle | Creates and clears timeout cleanup per dropdown. | Only when dropdown cleanup is scheduled. | `KEEP` with lifecycle counters. |
| Multi-step/filter-all helpers (`js/content_bridge.js:1955-2220`) | User affordance | Mutates menu labels, selected classes, `pointerEvents`, filter-all toggle state, and dropdown sizing. | Active dropdown/user menu action. | `GATE`. This is legitimate UI work, but it must stay behind `showBlockMenuItem` and action-scope gates; it must not be part of empty-install boot. |

Collaborator identity normalization and cache:

| Method/range | Owner | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `applyHandleMetadata()` (`js/content_bridge.js:2221-2237`) | Identity normalization | Mutates collaborator objects passed to it. | Extractor/sanitizer callers. | `KEEP` with fixture. |
| Placeholder/strong-identity/composite helpers (`js/content_bridge.js:2238-2313`) | Identity confidence | Pure string/object classification. | Extractor callers. | `KEEP`. These are the right kind of guards against channels with weak labels. |
| `sanitizeCollaboratorListWithMeta()` / `sanitizeCollaboratorList()` (`js/content_bridge.js:2314-2364`) | Identity normalization | Returns deduped sanitized collaborator list. | Extractor/cache/enrichment callers. | `KEEP` with regression fixtures for composite names, handles, UC IDs, and hidden-count labels. |
| `resolveExpectedCollaboratorCount()` / `getCollaboratorListQuality()` (`js/content_bridge.js:2365-2392`) | Identity confidence | Pure scoring/counting. | Extractor/cache callers. | `KEEP`. Good primitive, but its output should be recorded in reason metadata when used to hide. |
| `extractCollaboratorsFromAvatarStackElement()` (`js/content_bridge.js:2393-2441`) | DOM identity extraction | Reads DOM text, images, and links. | Any extractor path with avatar stack. | `INSTRUMENT`. It needs source confidence because avatar stack is strong on collab rows but dangerous if ever applied to Mix/Radio-like collections. |
| Cache merge/validation helpers (`js/content_bridge.js:2442-2591`) | DOM cache and stale cleanup | Reads/writes cached collaborator data and clears stale attrs on video-id mismatch. | Extractor callers. | `KEEP` stale cleanup, `REWRITE` the empty branch at `js/content_bridge.js:2551-2554` because `resolvedCollaboratorsByVideoId.has(cachedVideoId)` currently proves nothing and performs no reconciliation. |
| Text/byline/renderer helper group (`js/content_bridge.js:2592-3112`) | Renderer and DOM extraction | Reads text, link counts, renderer data, and mix signals. | Extractor/enrichment callers. | `CONSOLIDATE`. This overlaps with `js/content/dom_extractors.js` and `js/filter_logic.js`; decisions must converge on one confidence contract rather than three similar-but-different extractor worlds. |

Collaborator enrichment side effects:

| Method/range | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- |
| `generateCollabEntryKey()` (`js/content_bridge.js:3113-3123`) | Stamps random/time fallback keys when no video id exists. | Any enrichment target without a video id. | `KEEP` only for transient UI state; never persist or use as a filtering identity. |
| `markCardForDialogEnrichment()` (`js/content_bridge.js:3124-3170`) | Sets pending enrichment attrs and a 20s timeout. | Called by collaborator enrichment paths. | `GATE`. Legitimate only when an action, visible menu, or active collaboration/channel rule needs the roster. |
| `scheduleCollaboratorRetry()` (`js/content_bridge.js:3171-3187`) | Retry timer, max 3, clears request attr. | Empty/error enrichment results. | `KEEP` cap; still needs active reason and counter. |
| `buildCollaboratorLookupRequestOptions()` / `requestCollaboratorEnrichment()` (`js/content_bridge.js:3188-3297`) | Builds hints, posts main-world request, marks pending, retries on empty/error. | Any caller that asks for enrichment. | `GATE`. This is not passive free work; it should carry request reason, route, video id, visible action id, and active rule class. |
| `applyResolvedCollaborators()` (`js/content_bridge.js:3298-3394`) | Writes collaborator attrs to all matching cards, updates `resolvedCollaboratorsByVideoId`, refreshes open menus/popovers, schedules `applyDOMFallback(null, { forceReprocess: true })`. | Any collaborator response with a video id. | `REWRITE` gate. The forced fallback rerun must require an active collaborator/channel rule or visible menu, otherwise enrichment can turn into global DOM reprocessing. |
| `applyCollaboratorsByVideoId()` (`js/content_bridge.js:3395-3489`) | Same write/refresh/forced-fallback pattern for a map of video IDs. | Any batch collaborator response. | `REWRITE` gate for the same reason as above. |

Stats and playback side effects:

| Method/range | Owner | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `initializeStats()` (`js/content_bridge.js:3490-3518`) | Stats restore | Reads `stats` and `statsBySurface`. | Called during initialize. | `KEEP`. Low cost, but stats should be decoupled from filtering startup if boot budget becomes strict. |
| `getContentType()` (`js/content_bridge.js:3525-3569`) | Stats classifier | DOM selector checks only. | Stats increment path. | `TEST`. Playlist/Mix detection uses `[aria-label*="Mix"]` and `[title*="Mix"]`, which is okay for stats avoidance but must not become a filtering predicate. |
| `estimateTimeSaved()` (`js/content_bridge.js:3577-3601`) | Stats estimator | Pure estimate. | Not a hide decision source. | `KEEP`. |
| `incrementHiddenStats()` (`js/content_bridge.js:3607-3674`) | Stats write | Reads title/link/duration, sets `data-filtertube-time-saved`, logs, calls `saveStats()`. | Any hide caller can invoke it. | `GATE`. Must be downstream of a structured first-hide decision only. If a false hide happens, stats make it look like intentional engagement/time-saved. |
| `decrementHiddenStats()` (`js/content_bridge.js:3680-3697`) | Stats restore | Removes `data-filtertube-time-saved`, writes storage. | Unhide callers. | `KEEP` paired with increment, but only if every hide writer has a corresponding restore call. |
| `saveStats()` (`js/content_bridge.js:3702-3736`) | Storage write | Writes `statsBySurface` and legacy `stats` for Main. | Stats increment/decrement. | `INSTRUMENT`. Storage writes are fine, but should be debounced if hide bursts occur. |
| `handleMediaPlayback()` (`js/content_bridge.js:3738-3776`) | Playback side effect | Pauses `video/audio`, disables autoplay, calls `moviePlayer.pauseVideo()`/`stopVideo()`. | Any hide caller. | `GATE`. This is the clearest engagement-sensitive side effect in this slice. It must be allowed only for a confirmed blocked/hidden media surface, not for pending whitelist probes, layout cleanup, or stale hide repair. |

Renderer and element collaborator extraction:

| Method/range | Owner | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `extractCollaboratorMetadataFromRenderer()` (`js/content_bridge.js:3778-4018`) | Renderer extraction | Bounded deep object scan to depth 10 and array slice 25; no DOM writes. | Any caller with renderer candidate. | `KEEP` with route fixtures. It correctly rejects Mix signals, but it duplicates JSON-path knowledge that should be shared with `filter_logic.js`. |
| `hydrateCollaboratorsFromRendererData()` (`js/content_bridge.js:4020-4063`) | Renderer extraction | Reads many possible `data`/`__data` branches. | Element extraction caller. | `CONSOLIDATE`. Good coverage, but it is another local renderer inventory separate from docs and JSON engine. |
| `extractCollaboratorMetadataFromElement()` (`js/content_bridge.js:4065-4547`) | DOM/renderer hybrid extraction | Ensures/stamps video id attrs, writes collaborator cache attrs, may call `applyResolvedCollaborators()`, may request enrichment. | Any caller that asks for collaborator metadata. | `REWRITE` gate. Extraction should have a pure read mode. Cache writes, enrichment requests, and forced fallback reruns must be opt-in side effects. |
| `isYtmWatchLikeCollaboratorCard()` / `isDesktopWatchLikeCollaboratorCard()` (`js/content_bridge.js:4549-4579`) | Route/card classifier | Selector reads only. | Collaborator extraction and promotion paths. | `KEEP` with fixtures. |
| `getWatchLikeCollaborationWarmup()` (`js/content_bridge.js:4581-4607`) | Warmup signal | Parses byline text into partial collaborators. | Watch-like rows. | `TEST`. It deliberately accepts partial identity and must not hide until main-world/renderer enrichment resolves confidence. |
| `promoteYtmWatchRowIdentityFromCollaboratorMetadata()` (`js/content_bridge.js:4609-4695`) | Identity promotion | Calls extractor, reads resolved map, returns collaboration-shaped channel info. | Watch-like YTM rows. | `GATE`. Good targeted repair, but it can call side-effecting extraction; should use pure extraction or declare side effects. |
| `cardHasCollaborationDomSignal()` (`js/content_bridge.js:4697-4721`) | Signal classifier | DOM/link/text reads only. | Promotion/cache paths. | `KEEP` but fixture channels containing "and" or `&` without avatar stack. |
| `normalizeCollaboratorChannelInfoForCard()` (`js/content_bridge.js:4723-4857`) | Identity normalization | Reads/writes collaborator attrs and expected count; may use avatar stack and resolved maps. | Channel-info normalization caller. | `INSTRUMENT`. Useful convergence function; should become the single collaborator normalization authority if side effects are separated. |
| `promoteChannelInfoFromCollaboratorSignals()` (`js/content_bridge.js:4859-4939`) | Identity promotion | Calls side-effecting extractor and returns collaboration-shaped channel info. | Channel-info promotion caller. | `GATE`. Same issue: it should not trigger enrichment/cache writes unless the caller explicitly asked for them. |
| `normalizeHandleForComparison()` (`js/content_bridge.js:4941-4945`) | Pure helper | None. | Filter/match callers. | `KEEP`. |

Critical flow discovered in this slice:

```text
extractCollaboratorMetadataFromElement(card)
  -> hydrate renderer / parse DOM / cache attrs
  -> applyResolvedCollaborators(videoId, roster)
       -> write attrs to all matching cards
       -> refresh open menus/popovers
       -> setTimeout(applyDOMFallback(forceReprocess), 0)

Required future invariant:
  pure collaborator extraction must be callable without DOM writes,
  enrichment requests, or forced fallback reruns.

Only these contexts may enable the side-effect mode:
  1. user opened a FilterTube menu/popover for that card
  2. active filtering rule needs collaborator/channel identity
  3. explicit diagnostics/probe mode is enabled
```

Peer-agent convergence added to this slice:

| Finding | Proof | Disease relevance |
| --- | --- | --- |
| Empty/no-rule sessions can still run identity and menu affordance work. | Prefetch and map writes from `js/content_bridge.js:974-1539`; quick/fallback menu observers from `js/content/block_channel.js:1454-1782`; fallback menu install/open paths from `js/content_bridge.js:6061-7078`. | Explains why even empty blocklist installs can slow Main YouTube. |
| Some documented JSON renderer families are not first-class in `filter_logic.js`. | `compactPlaylistRenderer`, search refinement/horizontal cards, watch-card RHS/hero, modern Shorts identity, and post renderer gaps were independently confirmed against `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`. | Explains why DOM fallback is forced to compensate and why JSON-first precision is still incomplete. |
| Seed/settings timing can fail open before settings/engine are ready. | `js/seed.js:353-356`, `js/seed.js:427-431`, fetch response replacement at `js/seed.js:633-680`, content bridge initialization at `js/content_bridge.js:5704-5726`. | Explains visible leaks/late hides on cold load and why delayed DOM cleanup can look like false interaction. |
| Runtime settings authority is split. | `js/settings_shared.js:524`, `js/state_manager.js:1057`, `js/background.js:1990-2211`, `js/content/bridge_settings.js:501-514`, `js/injector.js:1872-1894`. | Explains stale list-mode/profile payload risk and duplicate reprocessing. |

### Content Bridge Method Detail Ledger - 3

This slice covers `js/content_bridge.js:4946-5716`. It is the identity-match and main-world message bridge slice: this is where learned identity can become rule matching, storage writes, DOM stamping, or forced fallback reruns.

Identity matching:

| Method/range | Owner | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `channelMatchesFilter()` (`js/content_bridge.js:4947-5101`) | Channel identity matching | Pure match. Delegates to `window.FilterTubeIdentity.channelMatchesFilter` if present. | Menu/action/sync cleanup paths. | `KEEP` with drift warning. Manifest loads `js/shared/identity.js` before `content_bridge.js` (`manifest.json:42-55`), so shared matching should normally own behavior. The local fallback is a stale duplicate and should eventually be removed or fixture-locked. |
| Shared identity index/match (`js/shared/identity.js:254-424`, `js/shared/identity.js:424-586`) | Canonical channel matching | Pure index/match. | JSON engine, DOM fallback, menu checks. | `KEEP` as canonical owner. It intentionally supports UC ID, handle, custom URL, name-only, and channel-map cross-matches; every other local duplicate should route here. |
| DOM fallback wrapper (`js/content/dom_fallback.js:964-970`) | DOM match wrapper | Pure delegation only. | DOM fallback channel checks. | `KEEP`. This is a better pattern than carrying another fallback implementation. |

Main-world request queue:

| Method/range | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- |
| Pending request globals (`js/content_bridge.js:5116-5138`) | Creates global maps/counters for collaborator, channel, and subscription requests. | File load. | `KEEP` with counters. These are cheap, but request counts/timeouts should be observable during audits. |
| `requestCollaboratorInfoFromMainWorld()` (`js/content_bridge.js:5146-5196`) | Posts `FilterTube_RequestCollaboratorInfo` up to three times over 1s, timeout 2s. | Any enrichment caller. | `GATE`. Needs active reason/action id. Repeated postMessage is acceptable only when a rule/menu really needs collaborator data. |
| `requestChannelInfoFromMainWorld()` (`js/content_bridge.js:5198-5241`) | Posts `FilterTube_RequestChannelInfo` up to three times over 1s, timeout 2s. | Any channel-info caller. | `GATE`. Same as collaborator request; tie to active rule/action. |
| `requestSubscribedChannelsFromMainWorld()` (`js/content_bridge.js:5243-5280`) | Posts subscription import request with 5s-150s timeout and 5000 max channel cap. | Explicit import flow. | `KEEP` action-scoped, but message authentication should be shared with all bridge messages. |
| `window.FilterTubeRequestSubscribedChannelsFromMainWorld` export (`js/content_bridge.js:5283`) | Exposes request function on isolated-world window. | Always set. | `INSTRUMENT`. Export is probably for UI import flow; document the only intended caller. |

Collaborator merge/enrich:

| Method/range | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- |
| `normalizeCollaboratorName()` (`js/content_bridge.js:5290-5293`) | Pure string normalization. | Merge callers. | `KEEP`. |
| `mergeCollaboratorsWithMainWorld()` (`js/content_bridge.js:5300-5435`) | Mutates `initialChannelInfo.allCollaborators` and primary fields in place. | Main-world collaborator response. | `INSTRUMENT`. Useful repair logic, but mutating the input should be declared because callers may assume extracted DOM identity remained unchanged. |
| `enrichCollaboratorsWithMainWorld()` (`js/content_bridge.js:5442-5466`) | Queries document by video id, builds lookup options, posts main-world request, mutates channel info via merge. | Collaboration channel info with video id. | `GATE`. It must be inactive for empty/no-rule sessions unless a visible menu/action requested it. |

Main-world message receiver:

| Message branch | Proof | Side effects | Verdict |
| --- | --- | --- | --- |
| Receiver guard | `js/content_bridge.js:5468-5470` | Accepts any same-window `FilterTube_*` message unless `source === 'content_bridge'`. | `REWRITE` trust boundary. Page scripts can also call `window.postMessage`; response/mutation branches need nonce/request correlation and strict type allowlist. |
| `FilterTube_InjectorToBridge_Ready` / `FilterTube_Refresh` | `js/content_bridge.js:5473-5478` | Requests settings and may run forced DOM fallback. | `GATE`. Refresh should be authenticated and rate-limited. |
| `FilterTube_UpdateChannelMap` | `js/content_bridge.js:5479-5481` | Persists learned channel mappings. | `GATE`. Map writes need provenance and dedupe. |
| `FilterTube_UpdateVideoChannelMap` | `js/content_bridge.js:5482-5530` | Persists video-channel map, stamps cards/anchors, then RAF `applyDOMFallback(null)`. | `REWRITE` active predicate. This can create empty-session work and must only rerun fallback if active rules can use the new identity. |
| `FilterTube_UpdateVideoMetaMap` | `js/content_bridge.js:5531-5556` | Persists video metadata, clears processed markers, schedules metadata DOM rerun. | `GATE`. Correct only for active duration/date/category rules or explicit harvest mode. |
| `FilterTube_UpdateCustomUrlMap` | `js/content_bridge.js:5557-5569` | Reads/writes `channelMap` directly from content bridge. | `REWRITE` action schema. Background should own storage writes; content should send a typed persisted-map action with provenance. |
| `FilterTube_CollaboratorInfoResponse` | `js/content_bridge.js:5570-5595` | Resolves pending request, then applies collaborators and forced fallback with `force:true`. | `REWRITE` correlation. Must verify response belongs to the pending video id/request and should not accept unsolicited roster writes. |
| `FilterTube_SubscriptionsImportProgress` / `Response` | `js/content_bridge.js:5596-5622` | Extends timeout, calls progress callback, resolves import response. | `KEEP` with request id correlation; should reject missing/unknown payload safely. |
| `FilterTube_CacheCollaboratorInfo` | `js/content_bridge.js:5623-5661` | Finds/stamps cards by anchors, applies collaborators, forced fallback with `sourceLabel:'xhr'`. | `REWRITE` trust boundary + active predicate. This is an unsolicited cache mutation path unless authenticated/correlated. |
| `FilterTube_ChannelInfoResponse` | `js/content_bridge.js:5662-5672` | Resolves pending channel request. | `KEEP` with request/video id correlation check. |
| `FilterTube_CollabDialogData` | `js/content_bridge.js:5673-5700` | Updates pending card entry, applies collaborators by video id. | `GATE` action-scoped. Correct for a user-opened dialog; should not run as a global cache input. |
| `initialize()` (`js/content_bridge.js:5704-5716`) | Injects main-world scripts, requests settings, initializes fallback. | `INSTRUMENT`. Boot sequence still needs the central active report described below before installing broad observers. |

Critical trust/side-effect flow:

```text
MAIN world / page-visible postMessage
  -> handleMainWorldMessages(event)
     -> map persistence or collaborator cache branch
        -> stamp card attrs
        -> applyResolvedCollaborators()
        -> applyDOMFallback(force/null)

Required future invariant:
  a message that mutates storage or visible DOM must have:
    request id or nonce
    expected video id / profile / route
    allowed sender branch
    side-effect class: map-write | dom-stamp | forced-filter-pass
```

### Content Bridge Method Detail Ledger - 4

This slice covers `js/content_bridge.js:5717-6057`, the DOM fallback bootstrap and whole-page mutation watcher. This section is central to the empty-install lag question because it installs broad observation and prefetch lifecycle after a fixed delay, not after a central "active work is needed" report.

| Method/block | Proof | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `initializeDOMFallback(settings)` entry delay | `js/content_bridge.js:5717-5724` | Waits 1000ms, fetches settings if absent, then runs `applyDOMFallback(settings)`. | Any successful settings load. | `INSTRUMENT`. The delay reduces contention but does not skip work for empty/no-rule sessions. |
| Fallback menu bootstrap | `js/content_bridge.js:5725-5728` | Calls `ensureFallbackMenuButtons()` immediately after first DOM fallback. | Any settings object. | `GATE`. Menu affordance installation should require visible block/menu affordance and correct list mode. |
| `debouncedFallback()` | `js/content_bridge.js:5736-5740` | Debounced `applyDOMFallback(null)`. | Mutation scheduler. | `KEEP` debounce, but route/active-rule gate is missing at this owner level. |
| `scheduleImmediateFallback()` | `js/content_bridge.js:5742-5775` | RAF + 250ms min interval; runs `applyDOMFallback(null)` and `schedulePrefetchScan()`. | Any relevant added-node mutation. | `GATE`. It couples fallback reruns to prefetch scans, so visible DOM churn can wake identity observers even without active channel rules. |
| Whitelist pending state | `js/content_bridge.js:5777-5783` | Keeps pending recheck timer, pending hide timer, and up to 160 candidates. | Initialized for all sessions. | `KEEP` cap; actual pending hide is mode-gated below. |
| `scheduleWhitelistPendingRecheck()` | `js/content_bridge.js:5784-5797` | Runs `applyDOMFallback(null, { onlyWhitelistPending: true })`. | Called after pending hide. | `KEEP` for whitelist leak control; should expose counters because it hides before proof. |
| `queueWhitelistPendingHide()` | `js/content_bridge.js:5799-5844` | Scans added nodes for `VIDEO_CARD_SELECTORS`, stores candidates, timer 40ms. | Any added node while observer is active; later mode-gated. | `GATE`. It is cheap-ish but still queries nested card selectors on every relevant mutation. |
| `applyWhitelistPendingHide()` mode/route gate | `js/content_bridge.js:5846-5855` | Returns unless list mode is whitelist; explicitly skips `/`, `/results`, `/feed/channels`, and `/watch`. | Whitelist mode only, but not major routes. | `TEST`. The skip protects hot pages from over-hiding but also means whitelist leak prevention is weakest on the main card surfaces. This matches peer finding and must be settled by JSON-first coverage. |
| Pending hide target resolution | `js/content_bridge.js:5857-5897` | Avoids non-card watch/comment/related containers; maps wrappers to hide targets. | Whitelist pending hide. | `KEEP` with fixture. Correct intent, but the selector list must stay aligned with `docs/youtube_renderer_inventory.md`. |
| `hidePending()` | `js/content_bridge.js:5900-5937` | Calls `queuePrefetchForCard()`, adds `filtertube-hidden`, `data-filtertube-hidden`, `data-filtertube-whitelist-pending`, and `display:none!important`. | Whitelist mode, non-skipped route, unprocessed card. | `REWRITE` reason ownership. This directly hides content before a final allow/deny reason; it must carry a pending-hide reason and guaranteed restore path. |
| Relevant selector builder | `js/content_bridge.js:5957-5983` | Builds selector list including videos, sections, guide entries, comments, chips. | Observer callback. | `INSTRUMENT`. Broad by design; should be derived from feature active report so comments/chips do not wake when only channel rules exist. |
| `nodeLooksFallbackRelevant()` / summary | `js/content_bridge.js:5985-6024` | Reads added nodes and existing FilterTube attrs/classes. | Observer callback. | `KEEP` filter, but note it treats previously hidden/pending nodes as relevant and can trigger cleanup reruns. |
| Body `MutationObserver` | `js/content_bridge.js:6025-6040` | Observes `document.body || document.documentElement` with `{ childList:true, subtree:true }`; queues whitelist pending hide and immediate fallback. | Installed after first fallback, no teardown. | `REWRITE` lifecycle. This needs central active-state installation, route scope, and disconnect on native/fullscreen/empty runtime. |
| DOMContentLoaded fallback | `js/content_bridge.js:6043-6048` | Late observer attach plus immediate fallback. | Only if body missing. | `KEEP`. |
| Startup of prefetch/playlist/right-rail observers | `js/content_bridge.js:6050-6055` | Starts card prefetch observer, playlist hook, right-rail whitelist observer, and initial scan. | Always after fallback init. | `REWRITE` lifecycle. This is a proven empty-install lag suspect: passive learning and menu-adjacent observers start even if there are no block/allow/channel/content rules. |

Required future active-work report:

```text
initializeDOMFallback(settings)
  -> computeRuntimeWorkReport(settings, route)
       filteringActive
       whitelistFailClosedActive
       metadataFiltersActive
       channelIdentityNeeded
       menuAffordanceVisible
       passiveLearningAllowed
       nativeQuietMode

  Only install:
    body fallback observer if filteringActive || whitelistFailClosedActive
    prefetch observer if channelIdentityNeeded || passiveLearningAllowed
    menu scanner if menuAffordanceVisible
    metadata rerun paths if metadataFiltersActive
```

### Content Bridge Method Detail Ledger - 5

This slice covers `js/content_bridge.js:6058-6625`, the fallback menu scanner. It is intentionally UI-affordance code, so the audit question is simple: can it prove it is completely idle when the fallback/block menu affordance is not supposed to exist? Today the answer is no.

| Method/block | Proof | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `fallbackMenuButtonsInstalled` / `fallbackMenuButtonsRescan` | `js/content_bridge.js:6059-6069`, `js/content_bridge.js:6554-6560` | One-way install flag, global rescan callback exposed as `window.FilterTube_rescanFallbackMenus`. | First call to `ensureFallbackMenuButtons()`. | `GATE`. No uninstall/disable path exists after settings change to hide block menu or whitelist mode. |
| Fallback menu style injection | `js/content_bridge.js:6071-6251` | Injects a large style tag into page head. | First fallback menu init. | `KEEP` only if menu affordance is enabled. Otherwise it is unnecessary page mutation on empty install. |
| Native menu detection / cleanup | `js/content_bridge.js:6255-6288` | Scans for native menu buttons and removes fallback artifacts when native menu exists. | Per scan. | `KEEP`. Good repair path for duplicate UI, but should run only when scanner is active. |
| Slot/host creation | `js/content_bridge.js:6290-6400` | Appends fallback slots/menu host divs into playlist, lockup, mobile, shorts, and comment DOM. | Per card scan, if no native menu host. | `GATE`. This mutates YouTube DOM for UI only and does not check `currentSettings.showBlockMenuItem` or `listMode`. |
| `createFallbackButton()` | `js/content_bridge.js:6403-6432` | Creates button, inline SVG, click capture handler, opens fallback popover. | Called by card scanner. | `KEEP` behind menu gate. The click handler correctly suppresses propagation before opening FilterTube UI. |
| `ensureFallbackButtonForCard()` | `js/content_bridge.js:6435-6496` | Classifies card surfaces, cleans native duplicates, appends fallback button. | Scanner finds matching card. | `GATE`. It handles many surfaces, but again no product-level affordance predicate. |
| `scan()` | `js/content_bridge.js:6498-6538` | Queries playlist, lockup, mobile, shorts, and comment selectors; writes `window.FilterTube_lastFallbackScan`. | Scheduled by init/mutation/navigation/click/scroll/warmup. | `REWRITE` lifecycle. Broad UI scan runs for surfaces unrelated to active filtering unless scanner is disabled earlier. |
| `scheduleScan()` / rescan callback | `js/content_bridge.js:6540-6557` | RAF plus 120ms timeout duplicate run. | Any scanner trigger. | `KEEP` debounce shape, but only inside gated lifecycle. |
| Body mutation observer | `js/content_bridge.js:6563-6572` | Whole-page `{ childList:true, subtree:true }` observer. | Always after scanner install. | `REWRITE`. This is a second broad observer in addition to fallback filtering observer. |
| Navigation/click listeners | `js/content_bridge.js:6584-6596` | Rescans on `yt-navigate-finish` and capture-phase click, with a 700ms post-click rescan. | Always after scanner install. | `GATE`. Useful after menus open/change, but too broad if fallback menus are disabled. |
| Scroll listener | `js/content_bridge.js:6597-6613` | Capture passive scroll listener and 180ms rescan timer. | Always after scanner install. | `GATE`. This is a direct hot-scroll cost source. |
| Warmup interval | `js/content_bridge.js:6615-6624` | Eight warmup scans at 1500ms intervals. | Always after scanner install. | `REWRITE`. This is proven background work in the first 12 seconds of a page, even when no visible fallback menu is desired. |

Missing gate proof:

```text
Normal menu injection has:
  js/content_bridge.js:10094 -> skip whitelist mode
  js/content_bridge.js:10095 -> skip showBlockMenuItem === false

Fallback menu scanner has:
  no equivalent listMode/showBlockMenuItem gate in js/content_bridge.js:6061-6625

Required invariant:
  if currentSettings.listMode === "whitelist" or showBlockMenuItem === false,
  fallback menu scanner must not install observers/listeners/timers or buttons.
```

### Content Bridge Method Detail Ledger - 6

This slice covers `js/content_bridge.js:6626-7350`, fallback popover rendering and action handoff. Compared with the scanner slice, this code is more action-scoped: once the user opens the popover, the feature is legitimately allowed to resolve identity and mutate state. The remaining risks are target/list-mode correctness, action provenance, and duplicated identity pathways.

| Method/block | Proof | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `playlistFallbackPopoverState` / `refreshOpenPlaylistFallbackPopoverForVideo()` | `js/content_bridge.js:6627-6648` | Keeps one open popover, RAF refreshes if video id matches. | Open fallback popover. | `KEEP`. Good scoped refresh guard. |
| `openFilterTubePlaylistFallbackPopover()` close lifecycle | `js/content_bridge.js:6650-6684` | Removes popover, resets opener attrs, disconnects row observer, removes document click listener. | Popover open/close. | `KEEP`. This has a clear teardown path unlike scanner install. |
| Initial row identity extraction | `js/content_bridge.js:6699-6716`, `js/content_bridge.js:7100-7123` | Calls `extractChannelFromCard()`, `promoteChannelInfoFromCollaboratorSignals()`, `hydrateChannelInfoFromCurrentMappings()`, `normalizeCollaboratorChannelInfoForCard()`. | User opened popover. | `KEEP` action-scoped, but it calls some side-effecting collaborator extraction functions identified in Ledger 2. Prefer pure extraction mode later. |
| `createFallbackMenuRow()` | `js/content_bridge.js:6754-6843` | Creates menu row, FilterTube icon, filter-all toggle, click handler on toggle, hydrates filter-all state. | Open popover render. | `TEST`. UI text is hard-coded to `Block`; future dual block/allow mode needs explicit action labels and target list state. |
| `performBlock()` collaborator block-all path | `js/content_bridge.js:6846-6912` | Calls `addChannelDirectly()` up to 6 collaborators, closes, hides row after success, refreshes settings, forced DOM fallback. | User clicked Block All in fallback popover. | `INSTRUMENT`. Action-scoped and capped, but every persisted add needs profile/list target, source row/video id, and success/failure result. |
| `performBlock()` watch playlist handoff | `js/content_bridge.js:6923-6945`, `js/content_bridge.js:7012-7031` | Creates synthetic menu item and delegates to `handleBlockChannelClick()`. | Watch playlist row with fallback popover. | `KEEP` directionally. Reusing the quick-cross identity recovery path reduces divergent persistence logic. |
| Main-world recovery for missing identity | `js/content_bridge.js:6947-6963` | Calls `requestChannelInfoFromMainWorld()` using video id and expected name. | User action and no identifier. | `KEEP` action-scoped; response must be request-correlated as Ledger 3 notes. |
| `watch:videoId` fallback | `js/content_bridge.js:6965-6988` | Converts weak/missing row identity into background watch-page recovery input. | User action with video id. | `KEEP`. This is safer than persisting bare weak UC-only rows, but should be visible in action provenance. |
| `addChannelDirectly()` call | `js/content_bridge.js:6997-7010` | Sends source `playlist_fallback_menu`, filterAll, collaboration metadata. | User clicked fallback row. | `INSTRUMENT`. Correct to carry source, but must also carry active profile/list target once dual block/allow exists. |
| Success hide/refresh | `js/content_bridge.js:7032-7048` | Hides row, requests settings, updates `currentSettings`, forced DOM fallback. | Successful add result. | `KEEP` with rollback/report. The row is hidden only after success here, which is safer than pending hide. |
| Row click/keyboard binding | `js/content_bridge.js:7061-7096` | Prevents propagation, presses state for 85ms, calls `performBlock()`. | Open popover. | `KEEP`. |
| Collaboration row render | `js/content_bridge.js:7125-7185` | Renders up to 6 collaborator rows plus block-all option; disables missing identifiers. | Open popover. | `KEEP` with fixture. Correctly disables unresolved collaborator actions. |
| Popover positioning/open state | `js/content_bridge.js:7190-7209` | Appends fixed popover to body, sets `aria-expanded`. | User action. | `KEEP`. |
| Row attribute observer | `js/content_bridge.js:7210-7242` | Observes collaborator/channel attrs on the row and refreshes popover. | Open popover only; disconnected on close. | `KEEP`. Good scoped observer model. |
| Document close listener | `js/content_bridge.js:7249-7259` | Capture click closes popover unless click inside popover/button. | Open popover only. | `KEEP`. |
| `injectCollaboratorPlaceholderMenu()` | `js/content_bridge.js:7262-7316` | Inserts disabled placeholder rows while collaborator roster resolves. | Menu injection/enrichment paths. | `KEEP` if behind menu gate; text/action labels need dual-list future review. |
| `debounce()` | `js/content_bridge.js:7318-7328` | Timer helper. | Shared. | `KEEP`. |
| Identity cache globals | `js/content_bridge.js:7334-7341` | In-memory caches/in-flight maps for ytInitialData and background watch identity. | Loaded at file scope. | `KEEP` with counters and TTL tests. |

Action flow:

```text
fallback button click
  -> open popover
     -> extract identity from row / maps / main-world if needed
     -> user clicks Block / Block All
        -> addChannelDirectly() or handleBlockChannelClick()
        -> on success: hide row, refresh settings, force DOM fallback

Safe part:
  expensive identity recovery is mostly user-action scoped here.

Unsafe part inherited from scanner:
  users should never see this popover if showBlockMenuItem is false
  or if current mode should not expose block actions.
```

### Content Bridge Method Detail Ledger - 7

This slice covers `js/content_bridge.js:7350-8560`, the main-world lookup and same-origin watch/shorts identity fallback layer. This is a high-value layer because it can recover precise UC IDs/handles when the DOM is weak. It is also a high-risk performance and recommendation layer because it can issue YouTube requests and then force DOM reruns.

| Method/block | Proof | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| `searchYtInitialDataForVideoChannel()` | `js/content_bridge.js:7350-7449` | Main-world channel request, positive cache 5min, negative cache 20s, in-flight dedupe. | Any caller with video id. | `KEEP` if caller-scoped. It has good cache and expectation checks, but still depends on postMessage trust/correlation from Ledger 3. |
| `extractChannelFromInitialData()` | `js/content_bridge.js:7462-7711` | Deep traversal of ytInitialData-like object; reads renderer/collaborator/sheet/thumbnail fields. | Direct fetch/main-world parsing callers. | `CONSOLIDATE`. This duplicates renderer knowledge in `js/filter_logic.js`, `js/content/dom_extractors.js`, and docs. It should become a shared fixture-backed extractor or be generated from the renderer inventory. |
| `enrichVisibleShortsWithChannelInfo()` | `js/content_bridge.js:7722-7866`; caller after block action at `js/content_bridge.js:12747` | Scans visible Shorts, fetches background Shorts identity for unmapped videos with concurrency 3, sends `updateVideoChannelMap`, hides matching Shorts, then refreshes settings/fallback. | Called after blocking a channel by UC ID. | `KEEP` action-scoped with budget. It uses `allowDirectFetch:false`, so it does not directly fetch Shorts pages here. Still must cap visible scan count and report network/map writes. |
| `fetchWatchIdentityFromBackground()` | `js/content_bridge.js:7868-7922` | Sends background `fetchWatchIdentity`, de-dupes in-flight by `videoId:expectedHandle`, validates expected handle. | Playlist enrichment/action paths. | `KEEP` with action/rule reason. Background owns network fetch, which is better than content direct fetch, but request must be rate-limited and provenance-tagged. |
| `enrichVisiblePlaylistRowsWithChannelInfo()` | `js/content_bridge.js:7924-8044`; caller after block action at `js/content_bridge.js:12748` | Scans playlist rows, uses maps, background watch identity fetch concurrency 3, persists video/channel and channel maps, stamps/hides rows, forced DOM fallback. | Called after blocking a UC ID. | `INSTRUMENT`. Action-scoped and useful for playlist leak prevention, but it can scan/fetch many visible rows. Needs max row count, timing, and storage-write counters. |
| `fetchChannelFromShortsUrl()` | `js/content_bridge.js:8051-8118`; direct-fetch caller at `js/content_bridge.js:12500` | Checks maps, sends background `fetchShortsIdentity`, optionally falls back to direct `/shorts/{id}` fetch. | Action recovery path; direct fetch only if caller passes `allowDirectFetch:true`. | `GATE`. Good default (`allowDirectFetch:false`), but direct fetch must remain user-action only and never passive. |
| `fetchChannelFromShortsUrlDirect()` | `js/content_bridge.js:8120-8242` | Same-origin fetch `/shorts/{videoId}`, parses HTML/ytInitialData/meta with regex/object extractors. | Only when `allowDirectFetch:true`. | `GATE` + `INSTRUMENT`. This is a network-sensitive fallback. It may look like a page request to YouTube; not proven to affect recommendations, but it must be minimized and measured. |
| `fetchChannelFromWatchUrl()` | `js/content_bridge.js:8251-8551`; direct caller at `js/content_bridge.js:12407` | Same-origin fetch `/watch?v={id}`, parses HTML, ytInitialData, ytInitialPlayerResponse, meta tags; in-flight de-dupe; disabled on Kids. | Action recovery path. | `GATE` + `INSTRUMENT`. This is the highest recommendation-sensitive path in the slice. It should be replaced with JSON/main-world/background metadata where possible and only run after explicit user action or active leak-prevention reason. |

Network-sensitive flow:

```text
User blocks channel
  -> handleBlockChannelClick()
     -> if identity weak:
          fetchChannelFromWatchUrl(videoId) or fetchChannelFromShortsUrl(... allowDirectFetch:true)
     -> after success:
          enrichVisibleShortsWithChannelInfo(blockedChannelId)
          enrichVisiblePlaylistRowsWithChannelInfo(blockedChannelId)

Better properties already present:
  - background lookup is preferred for Shorts/watch identity
  - direct Shorts fetch is opt-in
  - Kids watch direct fetch is disabled
  - concurrency is capped at 3 for visible Shorts/playlist enrichment

Required future invariant:
  direct `/watch` or `/shorts` HTML fetches must never run for empty install,
  passive prefetch, or ordinary scrolling. They need an action id or an
  active leak-prevention rule id.
```

### Content Bridge Method Detail Ledger - 8

This slice covers `js/content_bridge.js:8561-10089`, the main `extractChannelFromCard()` extractor. This method is not one feature. It is a combined identity resolver for mobile channel cards, comments, Shorts, mixes, YouTube Music cards, posts, collaborations, data-attribute stamped cards, playlist rows, lockup view models, and final main-world lookup handoff. It is therefore a central disease point: a wrong result can persist the wrong channel, hide the wrong row, or force fetch-heavy recovery.

| Method/block | Proof | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| Local avatar/name helpers | `js/content_bridge.js:8567-8650` | Pure URL/name normalization helpers used inside the extractor. | Any `extractChannelFromCard()` call. | `KEEP`. These are cheap and local; move into shared identity helpers later so menu, quick block, DOM fallback, and native runtimes do not fork the same cleanup rules. |
| Mobile/YTM channel surface extraction | `js/content_bridge.js:8652-8724`, `js/content_bridge.js:8837-8847` | Reads `card.data`, `card.__data`, channel links, and avatar alt text; returns handle/UC/custom URL/name/logo. | Any card extraction, including action popovers and prefetch. | `KEEP` with fixtures. This is a precise path for mobile channel/artist cards and does not fetch. It should be fixture-backed against `docs/youtube_renderer_inventory.md`. |
| Comment author extraction | `js/content_bridge.js:8726-8835` | Reads comment author links, thumbnail aria labels, and alt text; rejects timestamp/metadata-like strings. | Any extraction on comment cards. | `KEEP` action-scoped. It is broad selector work, but it requires stable author identity before returning. It should not run during empty-install passive scans unless comment controls or menu affordances are active. |
| Shorts explicit/data/renderer extraction | `js/content_bridge.js:8849-9059` | Reads explicit `data-filtertube-short` attrs, stamped channel attrs, renderer data, endpoint params, DOM links, then returns `needsFetch:true` only if a video id exists. | Shorts card extraction. | `KEEP` + `CONSOLIDATE`. This answers several known Shorts identity gaps, but the renderer path belongs in the JSON/domain extractor layer. The fetch handoff must remain action/rule scoped and never become passive empty-install work. |
| Mix card extraction | `js/content_bridge.js:9062-9172` | Clears collaborator metadata from mix cards, derives non-mix names, reads maps/data/links, may return `needsFetch:true` for video id. | Mix card extraction. | `INSTRUMENT`. Correctly avoids treating "Mix" as a channel, but `clearCollaboratorMetadataFromCard()` is a DOM mutation inside an extractor. Future split should make this a pure resolver plus an explicit cleanup step. |
| YouTube Music video-like extraction | `js/content_bridge.js:9174-9257` | Reads YTM renderer links/bylines; suppresses simple return when collaboration signals exist. | YTM video/playlist/compact cards. | `KEEP` with route fixtures. Good collaboration guard, but YTM byline parsing and collaborator parsing should share one confidence model with the main DOM extractor. |
| Post card extraction | `js/content_bridge.js:9259-9330` | Reads desktop/mobile post author links and thumbnails; returns handle or UC id; otherwise null. | Post renderers only. | `KEEP`. This is a focused special case and important for the user-reported channel-post menu gap. Needs a test for `postRenderer` / `sharedPostRenderer` JSON plus DOM cards. |
| Collaboration extraction handoff | `js/content_bridge.js:9332-9362`, `js/content_bridge.js:9800-9821` | Calls `extractCollaboratorMetadataFromElement()`, returns collaborator roster, enrichment flags, expected count, video id. | Any non-special card with collaboration signals. | `INSTRUMENT`. Collaboration coverage is valuable, but previous ledgers show collaborator extraction can stamp attrs and request enrichment. `extractChannelFromCard()` should be able to request a pure read-only collaborator mode. |
| Data-attribute extraction and playlist-panel protection | `js/content_bridge.js:9364-9613` | Reads stamped channel attrs, validates UC ids, uses `videoChannelMap`, rejects overlay text, clears cached metadata for playlist rows without trustworthy author links, may return collaboration enrichment. | Cards previously stamped by FilterTube or renderer import. | `KEEP` + `INSTRUMENT`. The playlist-panel recycled-attr protection at `9425-9434` is a concrete false-hide guard. However, clearing cached channel metadata is another mutation inside extraction and needs a reason counter. |
| Metadata/channel-link extraction ladder | `js/content_bridge.js:9615-9797` | Prioritizes channel-name metadata links, avatar links, generic links, then metadata fallback; rejects overlay names. | Ordinary desktop cards. | `KEEP`. The selector priority is defensible because it avoids thumbnail overlays. It needs fixture coverage for search, home, watch rail, playlist rows, and end-screen-like cards. |
| Modern lockup fallback | `js/content_bridge.js:9799-9990` | Reads lockup metadata/collaborators/avatar alt, may return `needsFetch:true` with video id, supports stamped attrs. | New YouTube lockup markup. | `KEEP` + `CONSOLIDATE`. This is a necessary new-renderer fallback, but renderer knowledge now exists in multiple files. It should converge with JSON path docs and `js/content/dom_extractors.js`. |
| Final fallback to main-world lookup | `js/content_bridge.js:9993-10075` | Logs failed card HTML prefix, derives video id, consults `videoChannelMap`, may return `needsFetch:true` with `fetchStrategy:'mainworld'`. | Any card where direct identity extraction failed. | `GATE`. This is correct as an action recovery path. It is unsafe as passive empty-install work because it can escalate a weak DOM card into map lookup/fetch orchestration. |
| Extractor catch/null return | `js/content_bridge.js:10078-10082` | Logs errors and returns null. | Any extractor exception. | `KEEP`, but errors should include card type and route counters without dumping large HTML in production. |

Extractor disease flow:

```text
extractChannelFromCard(card)
  -> many surface-specific fast paths
  -> sometimes mutates stale attrs / collaborator attrs
  -> sometimes returns precise id/handle/customUrl
  -> sometimes returns { videoId, needsFetch, fetchStrategy }

Safe when:
  called from a user action or an active filter needing identity

Unsafe when:
  called from passive scans on empty install, because weak identity can still
  trigger map lookup, main-world lookup, DOM stamping, storage writes, and
  follow-up fallback passes.
```

Required future split:

```text
readIdentityFromCard(card, { mode: "pure" })
  -> returns candidates with source/confidence/no mutations/no fetch flags

resolveIdentityForAction(candidate, actionContext)
  -> may fetch or enrich, with action id and budget

repairStaleCardIdentity(card, reason)
  -> explicit DOM cleanup, counted and route-scoped
```

### Content Bridge Method Detail Ledger - 9

This slice covers `js/content_bridge.js:10090-11341`, the primary YouTube 3-dot menu injection path. This path is important because it has better feature gates than the fallback menu scanner, but it still performs a lot of work once opened.

| Method/block | Proof | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| Primary injection gate | `js/content_bridge.js:10090-10102` | Exits in whitelist mode and when `showBlockMenuItem === false`; clears existing FilterTube menu state if disabled. | User/YouTube menu open path. | `KEEP`. This is the correct affordance gate. The fallback scanner must be brought under the same gate before source changes. |
| Card stale-state repair before extraction | `js/content_bridge.js:10104-10124`, `js/content_bridge.js:10135-10148` | Clears mix collaborator metadata, clears comment video IDs, resets stale card identity when video ID changed, then re-extracts. | Menu open. | `INSTRUMENT`. Correct false-hide protection, but extraction and repair are intertwined. Needs counters for recycled-card repairs. |
| Initial identity extraction and promotion | `js/content_bridge.js:10126-10214` | Calls `extractChannelFromCard()`, applies handle metadata, promotes collaborator/YTM identity, hydrates maps, possibly exits if identity is missing. | Menu open. | `KEEP` action-scoped. This should remain allowed only after explicit menu interaction, not passive observer scans. |
| Synchronous card stamping | `js/content_bridge.js:10232-10245`, `js/content_bridge.js:10439-10480` | Writes video id/channel id/handle/custom/name attrs onto clicked card. | Menu open with extracted identity. | `INSTRUMENT`. Useful for recycled cards and later click handling, but it is a DOM mutation. It needs source/confidence attrs or a reason counter. |
| Missing identity bits escalation | `js/content_bridge.js:10247-10293` | Marks `needsFetch`/`fetchStrategy:'mainworld'` when UC ID is missing, with expected handle/name guards. | Menu open. | `KEEP` if action-scoped. Comment explains a past playlist/Mix mismatch bug; this guard should become a test. |
| Wait-for-YouTube menu observers | `js/content_bridge.js:10295-10437` | Installs dropdown `MutationObserver`s and a 2s timeout; disconnects on settle/close. | Menu open only. | `KEEP`. This is bounded and scoped to an opened menu. |
| Menu render and collaborator warmup | `js/content_bridge.js:10483-10570` | Normalizes collaborator info, maybe registers active collaboration menu, renders placeholder or rows. | Menu open. | `KEEP` with fixtures. Important for collaboration blocking, but future dual block/allow UI needs labels/actions generated from target operation, not hard-coded "Block". |
| Background enrichment promise | `js/content_bridge.js:10572-10779` | Main-world identity lookup, no-network handle resolution, optional background `fetchChannelDetails`, updates menu label and stamps DOM attrs. | Menu open; promise stored in `pendingDropdownFetches`. | `INSTRUMENT`. Mostly action-scoped and avoids direct network for hover/open, but still can issue background channel-detail fetch for name enrichment when no video id exists. Needs provenance and budgets. |
| Collaborator enrichment refresh | `js/content_bridge.js:10781-10823` | Stores resolved collaborators by video id, rerenders menu entries, refreshes active collaboration menu. | Menu open and collaborator promise resolves. | `KEEP`. Scoped lifecycle is acceptable. |
| Click/key handlers | `js/content_bridge.js:10828-10897` | Captures menu clicks/keydown, lets toggle own click run, blocks native click, delegates to `handleBlockChannelClick()`. | Injected menu row. | `KEEP`. Event suppression is correct for preventing YouTube's native action from also firing. |
| Menu UI builders | `js/content_bridge.js:10899-10974` | Creates inline SVG/title/placeholder DOM. | Menu render. | `KEEP` but dedupe. SVG/title creation is duplicated between new/old/mobile menu structures. |
| New menu insertion | `js/content_bridge.js:10976-11090` | Creates `yt-list-item-view-model`, filter-all toggle, collaborator attrs, inserts at top, checks blocked state. | New menu structure. | `KEEP` + future `REWRITE` labels. The row is block-specific; simultaneous allow/block mode will need operation-aware copy, color, and persistence target. |
| Old/mobile menu insertion | `js/content_bridge.js:11095-11335` | Creates mobile bottom-sheet or old paper item, inline SVG, filter-all toggle, collaborator attrs, inserts at top, checks blocked state. | Old/mobile menu structure. | `KEEP` but consolidate with new menu builder. Duplicate icon/title/toggle logic increases drift risk across desktop/mobile/app surfaces. |

Primary-vs-fallback menu proof:

```text
primary inject path:
  currentSettings.listMode === "whitelist" -> no block row
  showBlockMenuItem === false -> no block row

fallback menu scanner path:
  currently documented at `js/content_bridge.js:6061-6625`
  installs/scans independently and must inherit the same gates.
```

### Content Bridge Method Detail Ledger - 10

This slice covers `js/content_bridge.js:11342-12985`, the post-injection action path: already-blocked state, optimistic hide, background add actions, retry/fetch recovery, settings refresh, enrichment, and file-tail startup. This is where recommendation-sensitivity, false-hide, and persistence correctness meet.

| Method/block | Proof | Side effects | Active predicate today | Risk / verdict |
| --- | --- | --- | --- | --- |
| Already-blocked state check | `js/content_bridge.js:11342-11409` | Reads storage `filterChannels`/`channelMap`, checks identity matches, disables row, hydrates filter-all toggle. | Menu row render. | `KEEP` but target-aware. Future dual allow/block lists require this to check the active operation/list, not only "blocked". |
| Blocked marker helpers | `js/content_bridge.js:11399-11427` | Writes/removes `data-filtertube-blocked-*` attrs. | Optimistic/confirmed hide paths. | `KEEP`. This gives rollback metadata, but markers need a reason id so stale hides can be reconciled after settings changes. |
| Context and target helpers | `js/content_bridge.js:11429-11516` | Detects comment/Shorts context and resolves clicked hide target. | Action path. | `KEEP` with fixtures. These helpers are exactly where false-hide risk concentrates; every selector needs a renderer inventory fixture. |
| `syncBlockedElementsWithFilters()` | `js/content_bridge.js:11518-11549` | Scans blocked-marked nodes, confirms hide when still blocked, otherwise clears attrs and restores visibility. | Called after settings update paths. | `KEEP` + `INSTRUMENT`. This is a necessary rollback/restore safety net. It needs counters for restored pending hides and must support future allow/block target lists. |
| Click snapshot and optimistic hide rollback | `js/content_bridge.js:11558-11704`, `js/content_bridge.js:12247-12266`, `js/content_bridge.js:12569-12599`, `js/content_bridge.js:12751-12780` | Captures video/card identity, hides clicked target immediately, stores previous style/class/attrs, restores on failure. | User clicked block. | `KEEP`. This is one of the strongest false-hide mitigations in the file. It should become a reusable action transaction helper. |
| Structured lookup before persistence | `js/content_bridge.js:11735-11795`, `js/content_bridge.js:11977-12117` | Uses menu-time enrichment promise, main-world lookup, collaborator promise, handle cache resolution. | User clicked block. | `KEEP` action-scoped. This improves precision but must never run passively. Add action id, timing, and source confidence to logs/tests. |
| Multi-step collaborator selection/blocking | `js/content_bridge.js:11797-11975`, plus state helpers at `js/content_bridge.js:2143-2177` | Selects collaborators, blocks selected/all, persists filter-all per collaborator, hides clicked content after success. | Collaboration menu action. | `KEEP` with cap. The flow is bounded by rendered collaborators, but it guesses handles from names at `11901-11905`; that should be `GATE` or removed unless verified by a resolver. |
| Input selection and watch/shorts resolver handoff | `js/content_bridge.js:12134-12241` | Chooses UC/custom/handle, or `watch:{videoId}` / `shorts:{videoId}` for background resolver; special handling for playlist rows. | User clicked block. | `KEEP`. This is the right direction: route weak identity through resolver instead of persisting a weak row. Needs tests for playlist row identity and recycled cards. |
| Background/action add | `js/content_bridge.js:12282-12293`, `js/content_bridge.js:12792-12844` | Sends `addFilteredChannel` with profile inferred from hostname, filterAll, collaborator metadata, video hints, expected names, source; schedules auto-backup after success. | User clicked block/add. | `INSTRUMENT`. Correct mutation chokepoint, but it hard-codes `profile` as hostname main/kids and not active viewing-space/profile. Future app/extension parity needs explicit profile/list target in the action. |
| Retry and direct-fetch recovery ladder | `js/content_bridge.js:12296-12567` | On failure uses ytInitialData lookup, background watch resolver, legacy direct watch fetch, Shorts fetch with `allowDirectFetch:true`, caches attrs, broadcasts mappings, retries add. | User clicked block and first add failed. | `GATE` + `INSTRUMENT`. Good for reliability, but this is the most recommendation-sensitive action tail. Direct `/watch`/`/shorts` HTML fetches need counters, action ids, and eventual removal in favor of background/JSON metadata. |
| Success path and forced refilter | `js/content_bridge.js:12601-12749` | Upserts local channel, confirms optimistic hide, persists video-channel map, stamps same-video cards, closes dropdown, refreshes settings, force-runs DOM fallback, enriches visible Shorts/playlist rows. | Successful add. | `INSTRUMENT`. Correct behavior after an explicit block, but expensive. Needs bounded row/card counts and one consolidated post-action scheduler instead of immediate forced fallback plus async enrich reruns. |
| Filter-all checkbox after blocked state | `js/content_bridge.js:12851-12915` | Adds checkbox UI and sends `toggleChannelFilterAll`. | Already-blocked menu row. | `KEEP` but operation-aware. Needs one toggle component shared with the primary menu row and app UI. |
| File tail startup | `js/content_bridge.js:12917-12919` | Registers main-world message listener and starts `initialize()` after 50ms. | Every matched page load. | Already covered in startup ledger. This is the root wakeup point for empty-install performance work. |

Action disease flow:

```text
menu row click
  -> optimistic hide clicked target
  -> resolve weak identity through maps/main-world/background/direct fetches
  -> addFilteredChannel background mutation
  -> on success:
       confirm hide
       refresh settings
       force DOM fallback
       enrich visible Shorts/playlist rows

Correctness strength:
  rollback exists if persistence fails.

Disease risk:
  successful action triggers multiple independent follow-up passes and map writes.
  Empty install must never reach this flow except through explicit user action.
```

### Bridge Startup And Always-On Work

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Native overlay quiet gate | `js/content_bridge.js:16-25` | Allows native apps/fullscreen overlays to suppress some bridge scans. | Good local guard, but it does not answer whether extension runtime has active rules. | `KEEP` |
| Initial boot | `js/content_bridge.js:5704-5711`, `js/content_bridge.js:12917-12919` | Registers main-world message listener and starts `initialize()` after 50ms; `initialize()` loads stats, injects main-world scripts, requests settings, then initializes DOM fallback. | Runs on all manifest-matched YouTube/Kids pages, regardless of empty rule state. | `INSTRUMENT` |
| DOM fallback initialization delay | `js/content_bridge.js:5717-5726` | Waits 1s, gets settings if needed, runs `applyDOMFallback(settings)`, then installs fallback menu buttons. | Delay reduces startup contention but still installs the fallback/menu layer without a no-op enforcement report. | `GATE` |
| Body mutation observer | `js/content_bridge.js:6025-6040` | Watches body/document mutations, queues whitelist pending hide, and schedules DOM fallback when relevant nodes are added. | Good filtering coverage, but still observes the whole page after startup. | `GATE` |
| Prefetch stack startup | `js/content_bridge.js:6050-6055` | Starts card prefetch observer, playlist prefetch hook, right-rail whitelist observer, then schedules a prefetch scan. | Strong empty-install lag suspect because it boots identity plumbing even when blocklist has no rules. | `GATE` |

Required invariant:

```text
content_bridge.initialize()
  must compute/load a central active report before installing broad observers:
    enforcementActive
    uiAffordancesActive
    identityPrefetchActive
    whitelistFailClosedActive
    contentFilterMetadataActive
```

The current code has feature-local gates, but not one system-level "quiet runtime" decision.

Latest no-rule control finding:

```text
applyDOMFallback()
  -> hasActiveDOMFallbackWork(settings)
  -> can return before scroll listener/styles/card scans when blocklist has no active rules

initializeDOMFallback()
  -> calls applyDOMFallback(settings) without awaiting the quiet verdict
  -> always proceeds to ensureFallbackMenuButtons()
  -> installs body MutationObserver
  -> starts prefetch / playlist / right-rail observer stack

Therefore the local DOM fallback gate is not the system lifecycle gate.
```

Proof:

- `js/content/dom_fallback.js:1933-1999` defines `hasActiveDOMFallbackWork()`. In blocklist mode it requires non-empty keyword/channel/comment lists, boolean controls, content filters, or category filters; in whitelist mode it returns true immediately.
- `js/content/dom_fallback.js:2075-2088` uses that predicate to return early from `applyDOMFallback()` and occasionally clean stale hidden state.
- `js/content_bridge.js:5717-5726` calls `applyDOMFallback(settings)` and immediately installs fallback menu work when settings exist.
- `js/content_bridge.js:6025-6040` installs a broad body `MutationObserver`.
- `js/content_bridge.js:6050-6055` starts card prefetch, playlist prefetch, right-rail whitelist observer, and a scan.

Verdict:

```text
KEEP the local applyDOMFallback active check.
REWRITE the caller lifecycle so the same central active report controls observer/menu/prefetch installation.
```

### JSON Engine Local Precision Vs Passive Harvest

The same pattern exists in the JSON path: there is useful renderer-level precision, but map-harvest and response-wrapping are currently coupled to broad runtime startup.

| Path | Proof | What is good | Disease concern | Verdict |
| --- | --- | --- | --- | --- |
| Engine idempotency and map queues | `js/filter_logic.js:7-17`, `js/filter_logic.js:46-80`, `js/filter_logic.js:82-140`. | Prevents duplicate engine init and batches video-channel/meta map messages. | Batching is good, but map writes are still a side effect of processing/harvest. Empty/no-rule sessions need a reason for every map-write batch. | `INSTRUMENT` |
| Renderer inventory breadth | `js/filter_logic.js:432-435`, `js/filter_logic.js:613-670`, `js/filter_logic.js:811-823`, `js/filter_logic.js:1589-1631`. | Supports video, playlist, end-screen, Shorts, and nested rich-item wrappers including `compactPlaylistRenderer`. | Coverage is broad but not fixture-proven against every path in `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`. Broadening without fixtures can create false hides. | `KEEP` + fixtures |
| Whitelist fail-closed JSON decision | `js/filter_logic.js:1933-1967`. | Explicit whitelist with no allow rules blocks non-container renderers, which is correct for a strict allow-list mode. | If state/migration/import incorrectly enters whitelist, this looks like random false hiding. The matcher is doing what the mode says; the disease is mode authority and transition reporting. | `KEEP` + transition gate |
| Category metadata fetch side effect | `js/filter_logic.js:2126-2172`. | Missing category data fails open and schedules metadata fetch instead of guessing. | `scheduleVideoMetaFetch()` is a runtime side effect from a decision function. It must only run when category filters are active and selected values are valid. | `GATE` |
| Harvest before disabled check | `js/filter_logic.js:3434-3452`. | Keeps channel maps warm for actions even when mutation is disabled. | Disabled/no-rule product states can still perform harvest work and emit map updates. That is useful for action reliability but not free; it needs active identity need or debug counters. | `REWRITE` lifecycle |
| Public harvest-only entry | `js/filter_logic.js:3482-3493`. | Lets `seed.js` learn mappings without mutating JSON. | Harvest-only is not side-effect-free because harvesting can queue map writes. The name should not be used as proof of no cost/no interaction. | `RENAME`/`INSTRUMENT` |

JSON disease statement:

```text
JSON filtering itself can be precise.
The risk is that parsing, harvesting, map writes, metadata fetches, and response replacement
are not separately budgeted from hide/show decisions.
```

### Mode Authority Cross-Check - Current Proof

Whitelist false-hide reports must be separated into two classes:

```text
Class A: matcher bug
  The runtime is in the intended mode but hides/allows the wrong renderer.

Class B: authority bug
  Runtime entered whitelist/blocklist or received stale compiled settings without the user intending it.
```

The strongest current evidence points to Class B as a root class that can make correct whitelist fail-closed behavior look like random false hiding.

| Path | Proof | Risk |
| --- | --- | --- |
| Background compiled-settings authority | `js/background.js:2059-1830`, `js/background.js:3242-3265`. | Background can compile and cache canonical runtime settings, but compilation still reads broad storage and can perform migration/derived writes elsewhere in the function. It needs a pure compiler boundary. |
| UI-pushed compiled cache | `js/background.js:4381-4395`. | `FilterTube_ApplySettings` accepts caller-provided settings, writes `compiledSettingsCache[targetProfile]`, and broadcasts those settings to tabs. This can bypass a fresh background compile/revision. |
| Shared UI compiler omits list-mode payload | `js/settings_shared.js:524-560`. | Shared compiled settings include blocklist channels/keywords and controls, but not `listMode`, `whitelistChannels`, or `whitelistKeywords`. Any caller relying on this payload can broadcast blocklist-shaped settings during whitelist state. |
| StateManager broadcast accepts shared result | `js/state_manager.js:1009-1059`. | `saveSettings()` broadcasts `result.compiledSettings` after a save, so shared compiler gaps can leave runtime state stale or mode-blind. |
| Popup list-mode transition copy intent | `js/popup.js:816-860`. | UI asks whether to copy blocklist; sends `copyBlocklist` as user intent. This is good UX evidence that background must honor the flag exactly. |
| Dashboard import-to-whitelist path | `js/tab-view.js:4648-4660`. | Import flow explicitly sends `copyBlocklist:false`, meaning imported allow-list activation should not merge/clear the existing blocklist. |
| Background mode transition | `js/background.js:3290-3445`. | Background calculates `shouldCopyBlocklist` but currently merges and clears blocklist whenever `requestedMode === 'whitelist'`, independent of that flag. This is a direct authority drift source. |
| Managed child local transition path | `js/tab-view.js:10532-10630`. | Managed edit mode mutates target state locally and then saves, separate from background transition action. It needs the same transition contract as popup/background. |

Required invariant:

```text
Every mode transition must produce a transition report:
  previousMode
  nextMode
  profile/surface
  copyBlocklist requested/applied
  blocklist before/after counts
  whitelist before/after counts
  compiledSettingsRevision after commit

Without this, a strict whitelist matcher can be blamed for state drift it did not cause.
```

### Recommendation-Sensitive Side Effects - Current Proof

The user review claims YouTube recommendations can get worse after blocking topics. Static code cannot prove YouTube's algorithm interpretation, but it can prove which FilterTube paths interact with playback/navigation/network in ways YouTube may observe. These must become explicit action-budgeted operations.

| Side effect | Proof | Current predicate | Disease concern | Required invariant |
| --- | --- | --- | --- | --- |
| Playlist next-button skip guard | `js/content/dom_fallback.js:2337-2399`, `js/content/dom_fallback.js:2401-2440`. | Watch playlist, blocklist mode, immediate playlist row is explicitly hidden. | Programmatic `targetLink.click()` / `nextBtn.click()` can look like navigation engagement. Useful for skipping blocked playlist items, but must be counted and strictly tied to hidden rows. | Synthetic navigation only when selected/next playlist row is explicitly hidden by FilterTube reason. |
| Selected hidden row auto-skip | `js/content/dom_fallback.js:4457-4513`. | Watch playlist, selected row is explicitly hidden, blocklist mode. | Pauses/reset video and clicks next visible row. This is a direct user-visible playback/navigation side effect. | One skip per selected video id/direction with reason and rollback proof. |
| Metadata fetch from DOM decisions | `js/content/dom_fallback.js:2487-2488`, `js/content/dom_fallback.js:3312-3315`, `js/content/dom_fallback.js:3528-3539`. | Missing category/date/duration metadata or mix-like heuristics. | Fetch scheduling happens while evaluating DOM cards. It should not run in empty/no-rule sessions or broad passive scans. | Only active duration/date/category/mix rules can schedule metadata fetches; every fetch has `need*` reason. |
| Background watch/Shorts/Kids identity fetches | `js/background.js:2877-2941`, `js/background.js:2978-3070`, `js/background.js:3072-3110`. | Resolver/action paths or background fetch actions. | These fetch YouTube/YouTube Kids HTML with credentials. They are useful for identity repair but must not be passive warmup. | Fetch allowed only for explicit user action or active unresolved rule, with source/reason/rate cap. |
| Content-script direct watch/Shorts recovery | `js/content_bridge.js:12383-12561`. | User clicked block and persistence/identity resolution failed. | This is action-scoped and mostly defensive, but it is still a network fallback plus DOM cache mutation. | Keep only action-scoped; log action id and prefer background/JSON path over content fetch. |
| DOM optimistic hide transaction | `js/content_bridge.js:12247-12263`, rollback/success around `js/content_bridge.js:12569-12607`. | User clicked block. | Good false-hide mitigation: hides immediately but restores on failed persistence. This pattern should become shared for every user action. | Every optimistic hide must have transaction id, old-state snapshot, persistence result, and restore path. |

Interpretation:

```text
The review's recommendation concern is plausible enough to instrument.
The source does not show passive "click blocked videos" behavior generally.
It does show legitimate playlist skip and resolver fetch paths that need explicit budgets
so we can prove they only happen after a real FilterTube rule/action requires them.
```

### Identity Prefetch And Metadata Queues

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Card prefetch observer | `js/content_bridge.js:983-1032` | Scans video-card selectors and attaches an `IntersectionObserver` to up to 120 cards per scan. | Broad card work even when no block/allow rule can use the identity. | `GATE` |
| Playlist prefetch hook | `js/content_bridge.js:1038-1080` | Adds capture scroll listener and a playlist panel `MutationObserver`, then schedules prefetch scans. | Route-specific and useful for playlist filtering, but should not run outside active playlist/channel enforcement. | `GATE` |
| Right-rail whitelist observer | `js/content_bridge.js:1082-1143` | Observes right rail and schedules two forced DOM fallback passes in whitelist mode. | Good leak prevention for whitelist, but expensive and should be impossible to enter silently. | `KEEP` + mode warning |
| Prefetch queue limits | `js/content_bridge.js:962-970`, `js/content_bridge.js:1199-1208` | Caps queue at 10 and concurrency at 2. | Healthy cap, but cap does not make the feature free on empty install. | `KEEP` |
| Kids prefetch network guard | `js/content_bridge.js:1222-1262` | Kids path avoids network fetch and relies on maps/DOM/main-world snapshot. | Correct privacy/performance choice for Kids. | `KEEP` |
| Main prefetch DOM/main-world path | `js/content_bridge.js:1265-1305` | Uses known map, DOM extraction, or main-world `ytInitialData` search; persists video-channel maps. | Better than page fetch, but still writes state and schedules fallback when no active rule needs it. | `GATE` |
| Stamp-triggered fallback rerun | `js/content_bridge.js:1311-1328` | Stamping identity schedules a debounced `applyDOMFallback(null)`. | Can create self-sustaining reruns: observe -> prefetch -> stamp -> fallback -> observe. Needs active reason. | `INSTRUMENT` |
| Video metadata fetch queue | `js/content_bridge.js:1621-1696`, `js/content_bridge.js:1716-1779` | Schedules watch-page HTML fetches for metadata, concurrency 3, 60s/video throttle, disabled for Kids. | Side-effect/network path; should be tied only to duration/date/category filters that are truly active. | `GATE` |
| Metadata-triggered DOM rerun | `js/content_bridge.js:1541-1553`, `js/content_bridge.js:1556-1611` | Clears processed markers for matching video IDs and reruns DOM fallback after metadata updates. | Correct when content filters are active; too expensive if metadata fetch was unnecessary. | `INSTRUMENT` |

### Fallback Menu Scanner

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Style injection and host discovery | `js/content_bridge.js:6071-6251`, `js/content_bridge.js:6255-6400` | Injects fallback menu CSS and finds menu hosts for playlist/mobile/comment surfaces. | UI-only work, but currently installed as part of fallback initialization. | `GATE` |
| Button creation | `js/content_bridge.js:6403-6432` | Adds a FilterTube menu button and suppresses event propagation before opening popover. | Event handling is good; installation cost is the issue. | `KEEP` |
| Broad scan | `js/content_bridge.js:6498-6538` | Queries playlist, lockup, mobile playlist/compact/shorts, and comment renderers; then ensures a fallback button for every card. | Major empty-install lag suspect. It is affordance work, not enforcement work, so it needs a user-visible affordance setting and route gate. | `GATE` |
| Scan scheduler | `js/content_bridge.js:6540-6557` | Runs scanner on RAF and 120ms timeout. | Good for catching SPA render timing, but too eager for no-op installs. | `INSTRUMENT` |
| Fallback menu observer/listeners | `js/content_bridge.js:6563-6624` | Body `MutationObserver`, `yt-navigate-finish`, capture `click`, capture/passive `scroll`, and 8 warmup scans every 1.5s. | This is the strongest static proof that UI affordance scanning can slow YouTube even with empty lists. | `GATE` |

### Main-World Message Side Effects

| Message | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `FilterTube_InjectorToBridge_Ready` | `js/content_bridge.js:5472-5503` | Requests settings when main-world runtime announces readiness. | Expected. | `KEEP` |
| `FilterTube_Refresh` | `js/content_bridge.js:5503-5478` | Requests settings and force-runs DOM fallback. | Needs active reason in logs. | `INSTRUMENT` |
| `FilterTube_UpdateChannelMap` | `js/content_bridge.js:5479-5482` | Persists learned channel mappings. | Good if harvested from already-loaded JSON. | `KEEP` |
| `FilterTube_UpdateVideoChannelMap` | `js/content_bridge.js:5482-5530` | Persists video->channel mappings, stamps matching DOM cards, and schedules fallback. | Good identity source, but fallback rerun needs active predicate. | `INSTRUMENT` |
| `FilterTube_UpdateVideoMetaMap` | `js/content_bridge.js:5531-5556` | Persists video metadata, clears processed markers, and schedules metadata DOM rerun. | Correct only when metadata-dependent filters are active. | `GATE` |
| `FilterTube_CollaboratorInfoResponse` | `js/content_bridge.js:5570-5595` | Resolves pending collaborator requests and applies collaborator metadata to cards. | Useful for collaboration blocking; must be rule/action scoped. | `INSTRUMENT` |
| `FilterTube_CacheCollaboratorInfo` | `js/content_bridge.js:5623-5661` | Stamps cards and applies collaborator data from main-world/XHR cache. | Can wake UI/menu paths; should be cheap when no collaborator rules are active. | `GATE` |
| `FilterTube_ChannelInfoResponse` | `js/content_bridge.js:5662-5672` | Resolves pending channel info requests. | Expected action resolver. | `KEEP` |
| `FilterTube_CollabDialogData` | `js/content_bridge.js:5673-5700` | Applies collaborator dialog data to pending cards and video ID. | UI/action-scoped. | `KEEP` |

### Stats And Media Side Effects

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Stats load/save | `js/content_bridge.js:3490-3518`, `js/content_bridge.js:3702-3734` | Reads/writes daily hidden counters in storage. | Useful product feedback, but stats should only count confirmed rule hides, not pending/layout cleanup. | `INSTRUMENT` |
| Hidden stats increment | `js/content_bridge.js:3607-3685` | Extracts title/link/duration and logs saved seconds, then stores counters. | Adds DOM reads/storage writes to hide path. Should be async/deferred and reason-aware. | `INSTRUMENT` |
| Media pause/autoplay mutation | `js/content_bridge.js:3738-3765` | On hide, pauses media and disables autoplay under hidden element. | Correct for blocked current playback, but broad hide writers must classify this as a side effect. | `INSTRUMENT` |

Initial bridge verdict: `REWRITE` the lifecycle contract, not the whole file at once. The safer path is to add a central runtime activity report and instrumentation first, then gate broad observers and UI affordances based on that report.

## Current Verified Findings

### 1. Empty Blocklist Is Not Actually Runtime-Quiet

Finding: an empty blocklist should not hide ordinary main YouTube results, but it still starts significant runtime work.

Proof:

- Defaults are empty blocklist: `js/state_manager.js:49-89`.
- Compiled defaults keep boolean hide controls false and quick-block/menu UI true: `js/background.js:2474-2506`.
- DOM fallback active-work gate returns false for empty blocklist unless lists/toggles/content filters/category filters are active: `js/content/dom_fallback.js:1933-1995`.
- But `initializeDOMFallback()` still calls `applyDOMFallback()`, installs fallback menus, installs a body `MutationObserver`, starts card prefetch, playlist prefetch, and right-rail whitelist observer: `js/content_bridge.js:5717-6055`.
- Fallback menu scanner queries broad card selectors and installs mutation/click/scroll/warmup scans: `js/content_bridge.js:6498-6624`.
- Quick block observer starts after one second regardless of settings readiness: `js/content/block_channel.js:2358-2397`.
- Quick block then adds focus/input/click/scroll/resize/orientation listeners and sweeps cards: `js/content/block_channel.js:1454-1491`.
- `seed.js` still parses/stringifies targeted JSON responses before or while deciding whether to mutate: `js/seed.js:633-680`, `js/seed.js:748-785`.

Verdict:

- Empty blocklist hide semantics: `KEEP`.
- Empty blocklist runtime baseline: `GATE` after measurement.
- First implementation should be instrumentation-only, then gate prefetch/menu/quick-block/fallback observers behind a central active-state predicate.

### 2. Empty Whitelist Is Fail-Closed And Can Look Like False Hiding

Finding: empty whitelist intentionally hides content. This is correct for strict whitelist semantics but dangerous if UI/runtime mode drifts or the user thinks they are in empty blocklist.

Proof:

- JSON engine returns blocked when `listMode === "whitelist"` and no whitelist channel/keyword rules exist: `js/filter_logic.js:1933-1967`.
- DOM fallback treats whitelist as always active: `js/content/dom_fallback.js:1937-1939`.
- DOM fallback mirrors empty-whitelist hide semantics in `shouldHideContent()` area: `js/content/dom_fallback.js:4596-4603` (to be expanded in DOM audit section).
- Kids host has a normalization guard for non-Kids empty whitelist, but main YouTube does not have equivalent fail-open protection: `js/content/bridge_settings.js:322`.

Verdict:

- Strict whitelist fail-closed behavior: `KEEP` only if UI makes it explicit.
- Silent empty-whitelist on Main YouTube: `GATE` or `REWRITE` UX semantics.
- Add debug assertion/log for every hide source when list counts are zero.

### 3. Category Filters Can Make Runtime Active Even When Empty

Finding: `categoryFilters.enabled === true` is treated as active even if selected category values are empty. That can keep JSON/DOM work alive without useful filtering.

Proof:

- JSON skip logic includes `cachedSettings.categoryFilters?.enabled === true` in active-rule detection: `js/seed.js:214-223`.
- DOM fallback active-work gate returns active on `categoryFilters?.enabled === true`: `js/content/dom_fallback.js:1992-1995`.

Verdict: `REWRITE`. Enabled-with-empty-selection should be inactive or should carry explicit selected categories in the active predicate.

### 4. End-Screen Coverage Is Not First-Class Enough

Finding: end-screen JSON support exists, but player DOM and docs coverage are incomplete. User review about end-screen video wall leakage is plausible.

Proof:

- `endScreenVideoRenderer` is present in JSON renderer handling: `js/filter_logic.js:369` and `js/filter_logic.js:429`.
- Current player DOM broad controls target only `#movie_player .ytp-endscreen-content`, `#movie_player .ytp-fullscreen-grid-stills-container`, and `.ytp-ce-element`: `js/content/dom_fallback.js:1316`.
- `hideEndscreenVideowall` and `hideEndscreenCards` default false: `js/state_manager.js:77-78`.
- `docs/youtube_renderer_inventory.md` mentions dropdown observers but needs first-class player videowall DOM inventory expansion.
- `docs/json_paths_encyclopedia.md` does not currently act as an explicit end-screen path contract.

Verdict: `INSTRUMENT` then `REWRITE` toward JSON-first end-screen renderer coverage plus documented player DOM fallback.

### 5. There Are Direct User-Action And Fetch Paths That Need A Separate Safety Ledger

Finding: most UI click handlers suppress propagation before FilterTube work, but the identity resolver can fetch YouTube pages and some playlist code can synthesize navigation clicks.

Proof:

- Quick-block button click calls `preventDefault()` and `stopPropagation()`: `js/content/block_channel.js:1406-1408`.
- Injected menu item interaction suppresses event propagation: `js/content_bridge.js:10867-10868`.
- Watch and Shorts identity fallback fetches exist in content/background paths: `js/content_bridge.js:8123`, `js/content_bridge.js:8272`, plus background resolver paths to be expanded.
- Playlist skip logic can click next/target links in `js/content/dom_fallback.js` around the playlist guard section (line-specific expansion pending).

Verdict: `INSTRUMENT`. We need a strict ledger of extension-initiated fetch/click/dispatch paths and whether they can be observed as engagement.

### 6. Whitelist Mode Switch Ignores The User's Copy Choice

Finding: the popup/dashboard UI asks whether switching to whitelist should copy the current blocklist, but the background currently ignores that answer. It always merges the active blocklist into whitelist and clears the blocklist when `requestedMode === "whitelist"`.

Proof:

- `js/background.js:3302` reads `const shouldCopyBlocklist = request?.copyBlocklist === true;`.
- `js/background.js:3406-3441` defines `mergeAndClearBlocklistIntoWhitelist()`.
- `js/background.js:3443-3445` calls that merge whenever whitelist mode is requested, without checking `shouldCopyBlocklist`.
- `js/popup.js:821` and `js/tab-view.js:10548` send the user's copy/no-copy choice.
- `js/tab-view.js:4655` sends `copyBlocklist: false` after subscription import but the current background behavior still merges, so fixing this later will require preserving that import flow deliberately.

Verdict: `REWRITE`. This is not a performance issue; it is a state-contract issue. It can make whitelist behavior feel random because UI intent and stored runtime state can diverge.

## Subsystem A - Settings, Profiles, And State Contracts

### Current Flow

```text
popup.js / tab-view.js
  -> StateManager methods
  -> settings_shared.js load/save + V4 profile shape
  -> chrome.storage.local
  -> background.js compileRuntimeSettings()
  -> content_bridge / seed / injector settings update
```

### Verified Risks

| Area | Proof | Verdict | Reason |
| --- | --- | --- | --- |
| Default blocklist state | `js/state_manager.js:49-89`, `js/background.js:2474-2506` | `KEEP` | Empty blocklist should be no-hide. The problem is runtime wakeup, not default semantics. |
| Empty whitelist semantics | `js/filter_logic.js:1933-1967`, `js/content/dom_fallback.js:1937-1939` | `KEEP` + `GATE` | Strict whitelist is valid only if the UI makes fail-closed behavior impossible to miss. |
| Category/content active predicates | `js/seed.js:214-223`, `js/content/dom_fallback.js:1992-1995` | `REWRITE` | Enabled containers with no selected inner rules should not keep heavy work active. |
| Mode switch copy flag | `js/background.js:3302`, `js/background.js:3443-3445` | `REWRITE` | User-facing copy/no-copy choice is ignored. |
| Legacy settings migration | `js/settings_shared.js:17`, `js/settings_shared.js:102`, `js/settings_shared.js:691` | `INSTRUMENT` | `contentFilters` and `categoryFilters` need explicit migration proof so old installs do not silently reset. |
| Compiler side effects | `js/background.js:2330-2400` | `REWRITE` | Compiling runtime settings should not persist Filter All keyword mutations as a side effect. |
| Save listener fanout | `js/settings_shared.js:742-1110` | `INSTRUMENT` | Many storage keys can change on one save and wake every listener layer. |
| Kids/Main mode normalization | `js/content/bridge_settings.js:322-351` | `GATE` | Kids empty-whitelist protection can differ from Main YouTube semantics. |

Required next proof:

- Map every storage key from UI control to compiled runtime field.
- Add a state transition table for `main.mode`, `kids.mode`, `syncKidsToMain`, import, Nanah restore, and profile switch.
- Add invariants: if blocklist empty and all toggles false, compiled settings must report no active enforcement.

### Settings Key Contract Drift

There is not one canonical list of setting keys. The UI, state manager, shared settings helper, background compiler, background storage listener, and content storage listener each carry their own key view.

| Contract location | Proof | Contains | Omits / drift | Verdict |
| --- | --- | --- | --- | --- |
| Shared settings key list | `js/settings_shared.js:17-54` | Core booleans, quick-block/menu flags, stats, `channelMap`. | Omits `contentFilters`, `categoryFilters`, `filterKeywordsComments`, `ftProfilesV4`, `videoChannelMap`, `videoMetaMap`. Yet `loadSettings()` returns `contentFilters`/`categoryFilters` at `js/settings_shared.js:691-736`. | `REWRITE` |
| State manager toggle keys | `js/state_manager.js:2006-2039` | `enabled`, app booleans, quick-block/menu flags. | Does not include content/category filters because those have separate APIs. Correct split, but no shared schema object. | `KEEP` + `CONSOLIDATE` |
| State manager content/category APIs | `js/state_manager.js:2115-2188`, `js/state_manager.js:2190-2217` | Dedicated Main/Kids content/category mutators; request runtime refresh after save. | Category filter can be saved as `enabled: true` with empty `selected`. | `REWRITE` validation |
| Background compiler | `js/background.js:2474-2551` | Emits `enabled`, booleans, quick-block/menu, `contentFilters`, `categoryFilters`. | Does not emit an enforcement report, so consumers recompute active state differently. | `REWRITE` |
| Background storage listener | `js/background.js:4458-4495` | Watches some lists, `contentFilters`, some booleans, profile keys. | Omits `enabled`, `categoryFilters`, `showQuickBlockButton`, `showBlockMenuItem`, end-screen controls, and many compiled booleans. | `REWRITE` |
| Content storage listener | `js/content/bridge_settings.js:547-609` | Watches `enabled`, list keys, `contentFilters`, maps, many booleans, quick-block/menu. | Omits `categoryFilters`; refreshes full DOM for many UI-affordance changes. | `REWRITE` |

Contract target:

```text
settings_schema.js
  -> persisted keys
  -> profile settings keys
  -> compiled runtime keys
  -> hot content-script refresh keys
  -> background cache invalidation keys
  -> active-enforcement derivation
```

This is a correctness issue, not just cleanup. If one listener misses a key, YouTube can remain filtered with stale state until navigation/reload. If one listener over-watches a UI-only key, YouTube can be rescanned unnecessarily.

### StateManager Method Ledger - Initial Pass

`StateManager` runs in extension UI contexts, not in the YouTube content-script runtime. That means it is not the direct source of Main YouTube page-load lag, but it is a major source of state mutation, mode drift, profile migration, auto-backup scheduling, and background fetch requests.

| Method/path | Proof | Reads/writes | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Default state | `js/state_manager.js:49-157` | Defines Main/Kids defaults, including blocklist mode, empty lists, quick-block/menu true, and empty content/category filters. | Good initial semantics, but UI-affordance defaults are later mixed with enforcement active state in content scripts. | `KEEP` + central active report |
| `loadSettings()` | `js/state_manager.js:178-492` | Loads shared settings, Profiles V3/V4, Main/Kids modes/lists, content/category filters, then optionally schedules channel enrichment. | Load is not read-only: it can trigger asynchronous enrichment after UI opens. It also normalizes Kids lists differently than Main. | `INSTRUMENT` |
| Main profile picker | `js/state_manager.js:298-327` | V4 Main mode/list values override legacy storage. | Correct precedence, but if V4 contains whitelist with zero allow rules, UI state becomes strict whitelist even if legacy top-level lists are empty. | `GATE` transition warning |
| Kids profile picker | `js/state_manager.js:352-410`, `js/state_manager.js:413-477` | V4 or V3 Kids lists are loaded and placeholder Kids channels are dropped. | Useful cleanup, but Kids cleanup rules are not shared with background/import normalizers. | `CONSOLIDATE` |
| Channel enrichment scheduler | `js/state_manager.js:495-503`, `js/state_manager.js:614-695` | Queues channel entries and sends `type: addFilteredChannel` to background, capped at 10/session with 5-7s delay. | UI-context only, but it can mutate channel entries and fetch channel info after a dashboard/popup load. It should be in the side-effect budget. | `INSTRUMENT` |
| Kids keyword mutations | `js/state_manager.js:701-800` | Add/remove/toggle Kids keywords in active Kids list according to Kids mode, then persist Kids profile and refresh Kids runtime. | Correct either/or mode behavior; future simultaneous allow/block model needs explicit list target. | `KEEP` for current model |
| Kids channel add | `js/state_manager.js:861-937` | Validates input, then delegates to `FilterTube_KidsWhitelistChannel` or `FilterTube_KidsBlockChannel`. | Duplicate detection is partial and background owns final persistence. Needs action transition report and sender contract. | `INSTRUMENT` |
| Main save | `js/state_manager.js:1009-1066` | Calls `SettingsAPI.saveSettings()` with blocklist-oriented Main lists and content/category filters, then broadcasts compiled settings. | This path is correct for blocklist settings. Whitelist mutations intentionally bypass it through `persistMainProfiles()`, so callers must choose the correct path. | `KEEP` + caller fixtures |
| `persistMainProfiles()` | `js/state_manager.js:1077-1146` | Writes Main mode/lists into V3 and V4 active profile. | Correct whitelist/blocklist path, but lacks transition summary and empty-whitelist warning. | `INSTRUMENT` |
| `persistKidsProfiles()` | `js/state_manager.js:1148-1204` | Writes Kids mode/lists into V3 and V4 active profile. | Same transition-report requirement as Main. | `INSTRUMENT` |
| `broadcastSettings()` / `requestRefresh()` | `js/state_manager.js:1209-1236` | Sends `FilterTube_ApplySettings` and `getCompiledSettings` messages. | UI can push compiled settings to content pages; background/content already need profile and sender validation. | `GATE` through action schema |
| Main keyword mutations | `js/state_manager.js:1338-1550` | Writes either `userWhitelistKeywords` via `persistMainProfiles()` or blocklist keywords via `saveSettings()`. | Current either/or behavior is consistent, but render and future dual-mode UI must expose which list is touched. | `KEEP` current, `REWRITE` future dual-list |
| `recomputeKeywords()` | `js/state_manager.js:1555-1571` | Derives channel keywords from Main channels and optionally Kids channels only when modes match. | Good mode guard. Needs fixture for Kids-to-Main whitelist and blocklist separately. | `KEEP` + fixture |
| Main channel add | `js/state_manager.js:1582-1654` | Delegates to `addWhitelistChannelPersistent` or `addChannelPersistent`. | Background persistence is authoritative; local optimistic update can diverge from background normalization until reload. | `INSTRUMENT` |
| Subscriptions import | `js/state_manager.js:1656-1819` | Talks to a YouTube tab, sends channels to `FilterTube_BatchImportWhitelistChannels`, reloads state, refreshes Main. | Good profile-changed and lock checks. It imports into whitelist without changing mode, so UI must communicate inactive-until-whitelist if current mode is blocklist. | `KEEP` + transition report |
| Main channel remove/toggle | `js/state_manager.js:1826-1946` | Removes/toggles current Main list by mode; `filterAll` disabled in whitelist. | Correct for current either/or model. Future dual allow/block entries require list-type-specific row identity. | `KEEP` current |
| `persistChannelMap()` | `js/state_manager.js:1973-1986` | Writes `channelMap` directly. | Support map only; content/storage listeners ignore single `channelMap` changes in UI state reload, but content scripts consume map refreshes elsewhere. | `KEEP` + staleness policy |
| Boolean setting update | `js/state_manager.js:1998-2108` | Validates against local key list, writes state, saves or special-cases `syncKidsToMain`. | `validKeys` is another local schema copy. `syncKidsToMain` bypasses `saveSettings()` and relies on manual profile writes. | `CONSOLIDATE` |
| Content filters | `js/state_manager.js:2115-2160` | Merges partial content filter objects and saves/refreshes. | No validation that enabled duration/upload-date filters have usable values. | `REWRITE` validation |
| Category filters | `js/state_manager.js:2162-2217` | Saves `enabled`, `mode`, and `selected` for Main/Kids. | Proven enabled-empty active risk: `enabled:true` with `selected:[]` is persisted. | `REWRITE` validation |
| Storage listener | `js/state_manager.js:2291-2408` | UI reloads on many storage keys with debounce and avoids channelMap-only reload. | Missing `contentFilters` and `categoryFilters` top-level keys, but catches V4 profile writes through `ftProfilesV4`. Legacy/top-level changes can drift. | `REWRITE` shared schema |

StateManager invariant:

```text
StateManager should be the UI mutation coordinator, not another filtering engine.
It must expose:
  - exact list target: main.block / main.allow / kids.block / kids.allow
  - before/after counts
  - mode transitions
  - validation warnings for enabled-empty rules
  - background action used
```

This is required before adding simultaneous allow/block rows. Without it, quick block, 3-dot menu, dashboard rows, import, Nanah, Android, and iOS can each make a different assumption about whether an entry is "blocked", "allowed", "active", or merely stored.

### Settings Shared Compiler Ledger - Initial Pass

`settings_shared.js` is the closest thing to a shared settings library, but it still exposes values rather than a complete schema. The strongest finding is that it compiles lists and booleans but does not produce a canonical enforcement report.

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `SETTINGS_KEYS` | `js/settings_shared.js:17-54`, `js/settings_shared.js:56` | Lists top-level legacy/storage keys watched by shared helper. | Omits `contentFilters`, `categoryFilters`, `filterKeywordsComments`, `ftProfilesV4`, maps, and mode/list allow keys. Other files add their own local key lists. | `REWRITE` schema |
| Legacy V4 builder | `js/settings_shared.js:102-168` | Converts legacy state into V4 default profile with Main/Kids blocklist mode and empty allow lists. | Safe default for old blocklist users, but any legacy whitelist intent outside V4 is lost. | `KEEP` + migration fixture |
| Keyword sanitizer | `js/settings_shared.js:171-202` | Normalizes keyword object entries and packed `channel:` source references. | Rejects legacy raw string keyword entries if passed directly; `normalizeKeywords()` handles arrays by assuming objects. UI render should still be defensive. | `INSTRUMENT` |
| Keyword normalization | `js/settings_shared.js:204-258` | Converts raw keyword arrays, compiled keyword arrays, or comma strings into object entries. | Array branch expects object-like entries; if an imported array contains strings, it can sanitize to null and drop entries. Needs fixture. | `GATE` import validation |
| Channel sanitizer | `js/settings_shared.js:261-341` | Converts strings/objects to channel entries and defaults `filterAllComments` true. | Defaulting `filterAllComments` true is correct for Filter All, but it must be explicit in UI/import transition reports. | `KEEP` + docs |
| Channel-derived keyword sync | `js/settings_shared.js:412-481` | Creates exact channel-derived keywords for channels with `filterAll`. | Good central logic, but only works for the active list passed by caller. Future simultaneous allow/block must not derive "allow keywords" accidentally from allow-channel rows unless explicitly designed. | `KEEP` current |
| `buildCompiledSettings()` | `js/settings_shared.js:484-561` | Emits compiled keyword regexes, channel list, booleans, and raw content/category filters. | No mode, no whitelist lists, no active-enforcement report, no validation of enabled-empty content/category filters. | `REWRITE` schema/report |
| `loadSettings()` | `js/settings_shared.js:564-740` | Reads V4 active profile when present and writes missing profile settings back to storage. | Load can write storage (`js/settings_shared.js:647-685`), so read paths can create storage-change fanout. | `INSTRUMENT` |
| V4 save path | `js/settings_shared.js:742-947` | Saves active profile settings and Main blocklist `channels`/`keywords`; preserves existing Kids. | This function is blocklist-oriented. It does not write Main `mode`, `whitelistChannels`, or `whitelistKeywords`; whitelist callers must use `persistMainProfiles()`. | `KEEP` + caller invariant |
| Legacy save path | `js/settings_shared.js:950-1069` | Writes legacy compiled top-level keys and builds V4 from legacy state. | Comment notes category filters are not reliably preserved without V4 (`js/settings_shared.js:950-951`). | `GATE` legacy import warnings |
| Settings change helper | `js/settings_shared.js:1136-1138` | Detects changes only from `SETTINGS_CHANGE_KEYS`. | Same key drift as `SETTINGS_KEYS`; cannot be source of truth for runtime refresh. | `REWRITE` schema |

Compiler target:

```text
buildRuntimeSettings(profile, route?) -> {
  values: compiled values,
  modeState: {
    mainMode, kidsMode, listTarget,
    blockCounts, allowCounts
  },
  enforcementReport: {
    hasBlockRules,
    hasAllowRules,
    strictWhitelistActive,
    hasValidContentRules,
    hasValidCategoryRules,
    shouldRunJson,
    shouldRunDom,
    shouldRunUiAffordances,
    shouldResolveIdentity
  },
  warnings: []
}
```

Until this exists, every content/runtime file keeps inventing its own active predicate, which is the central disease behind empty-install lag and enabled-empty false work.

### Active-State Key List

These are the keys currently capable of waking enforcement or UI-affordance work. The important distinction is whether the key represents real filtering or just a UI control.

| Key/group | Proof | Active when | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `enabled` | Default true `js/state_manager.js:50`; runtime checks `js/seed.js:359-362`, `js/content/dom_fallback.js:1935-1937`. | `enabled !== false`. | Correct top-level gate. | `KEEP` |
| Main blocklist lists | Defaults `js/state_manager.js:57-59`; DOM active test `js/content/dom_fallback.js:1940-1947`; JSON active test `js/seed.js:214-223`. | Non-empty `filterKeywords`, `filterKeywordsComments`, or `filterChannels`. | Correct, but derived channel keywords can inflate work. | `KEEP` + `INSTRUMENT` |
| Main whitelist lists | Defaults `js/state_manager.js:54-56`; JSON strict path `js/filter_logic.js:1933-1967`; DOM whitelist always active `js/content/dom_fallback.js:1937-1939`. | Any whitelist mode, even with zero allow rules. | Correct only when whitelist is intentional and visible to user. | `KEEP` + `UX GATE` |
| Kids block/allow lists | Defaults `js/state_manager.js:95-103`; Kids/Main sync rules in `js/tab-view.js:10756-10808`; background sync paths `js/background.js:1996`, `js/background.js:2016`, `js/background.js:2064`, `js/background.js:2220`. | Depends on active profile and surface mode. | Must not leak Kids mode into Main unless `syncKidsToMain` and same mode are both true. | `KEEP` + `TEST` |
| Boolean content controls | Defaults `js/state_manager.js:60-88`; DOM active list `js/content/dom_fallback.js:1949-1979`; save shape `js/settings_shared.js:742-915`. | Individual boolean true. | Many are route-specific but currently contribute to broad active state. | `GATE` by route |
| `contentFilters.duration` | Defaults `js/state_manager.js:131-138`; popup can enable only the checkbox `js/popup.js:474-501`; JSON active checks only `enabled` `js/seed.js:205-213`; DOM same `js/content/dom_fallback.js:1981-1990`. | Currently `enabled === true`, even if value/min/max are ineffective. | Can wake JSON/DOM and metadata fetch paths without a valid rule. | `REWRITE` inner-rule validation |
| `contentFilters.uploadDate` | Defaults `js/state_manager.js:139-145`; popup can enable only checkbox `js/popup.js:493-500`; JSON/DOM active checks only `enabled`. | Currently `enabled === true`. | Same enabled-empty risk as duration. | `REWRITE` inner-rule validation |
| `contentFilters.uppercase` | Defaults `js/state_manager.js:146-150`; popup can enable only checkbox `js/popup.js:493-500`. | `enabled === true`; min length defaults to 2. | This one has a usable default, but still needs explicit route scope. | `KEEP` + `GATE` by route |
| `categoryFilters` | Defaults `js/state_manager.js:152-156`; UI saves `enabled` plus selected array `js/tab-view.js:840-844`; JSON active checks enabled only `js/seed.js:214-223`; DOM active checks enabled only `js/content/dom_fallback.js:1992-1995`; actual filter no-ops when selected empty `js/filter_logic.js:2130-2133`, `js/content/dom_fallback.js:2468-2471`. | Currently `enabled === true`. | Proven enabled-empty active bug. | `REWRITE` |
| `showQuickBlockButton` | Defaults true `js/state_manager.js:86`; UI-affordance setting in `js/settings_shared.js:48`; quick-block boot `js/content/block_channel.js:2358-2397`. | UI affordance, not enforcement. | Must not imply filtering work in empty sessions. | `GATE` |
| `showBlockMenuItem` | Defaults true `js/state_manager.js:87`; fallback menu init `js/content_bridge.js:6061-6069`, scanner `js/content_bridge.js:6498-6624`. | UI affordance, not enforcement. | Must not imply broad card scanner in empty sessions. | `GATE` |

Active-state invariant: UI affordance flags can make buttons available when the user hovers/taps, but they should not make the filtering engine, broad DOM scans, metadata prefetch, or identity fetches active by themselves.

### UI State Entry Points For Active Filters

The UI is a first-class source of runtime behavior. It can create active settings even when a user-facing list appears empty, so it must be audited with the same rigor as JSON and DOM filtering code.

| UI path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Content-control catalog | `js/content_controls_catalog.js:4-199` | Defines the visible boolean control list used by popup and dashboard. | Catalog is UI-facing only; it does not declare route scope, runtime cost, JSON support, DOM fallback selectors, or whether a control is enforcement vs UI affordance. | `REWRITE` as schema source |
| Popup catalog rendering | `js/popup.js:66-148` | Builds checkbox rows from the catalog and writes `data-ft-setting` keys. | Same catalog key can become a storage write without a central validation contract. | `CONSOLIDATE` |
| Dashboard catalog rendering | `js/tab-view.js:229-326` | Builds matching dashboard checkbox rows from the same catalog. | Good reuse, but route scope and cost are still implicit. | `CONSOLIDATE` |
| Popup boolean writes | `js/popup.js:1780-1788` | Calls `StateManager.updateSetting(key, checked)` for catalog settings. | Storage write is key-only; no route/cost metadata travels with it. | `KEEP` + schema |
| Dashboard boolean writes | `js/tab-view.js:11397-11428` | Writes catalog settings directly or into a managed child profile. | Managed-child path writes `profile.settings[key]`; runtime proof must cover child profile compilation too. | `INSTRUMENT` |
| Main category UI | `js/tab-view.js:810-870` | Saves `{ enabled, mode, selected }` from the dashboard. | Proven path can save `enabled: true` with `selected: []`, which wakes JSON/DOM active checks but does no useful filtering. | `REWRITE` validation |
| Kids category UI | `js/tab-view.js:2034-2075` | Same shape for Kids category filters. | Same enabled-empty risk; Kids runtime and app-shared paths must not wake on empty selected categories. | `REWRITE` validation |
| Main video filter UI | `js/tab-view.js:1043-1187` | Saves duration/upload/uppercase filter objects after reading compact controls. | Duration/upload can remain enabled while numeric fields are empty/invalid; previous values may persist silently. | `REWRITE` inner-rule validation |
| Kids video filter UI | `js/tab-view.js:2152-2284` | Same video filter write path for Kids. | Same enabled-invalid risk, plus Kids route support needs separate proof. | `REWRITE` inner-rule validation |
| Popup simplified video filters | `js/popup.js:474-501` | Popup toggles only `enabled` bits and preserves previous detailed values. | Good for convenience, but it can reactivate stale duration/upload values that are no longer visible in the popup. | `INSTRUMENT` |

Target replacement contract:

```text
control_schema[key] = {
  persistedKey,
  profileLocation: "settings" | "main" | "kids",
  surface: "main" | "kids" | "both",
  kind: "enforcement" | "ui-affordance" | "stat" | "backup",
  routeScope: ["home", "search", "watch", "shorts", "kids"],
  activePredicate(settings) -> boolean,
  jsonSupport: renderer/path list,
  domFallbackSupport: selector/writer list,
  expectedCost: "none" | "cheap" | "scan" | "network"
}
```

The runtime, UI, storage listeners, docs, and tests should consume the same schema. This is how we avoid the current drift where a checkbox looks simple in UI but can wake broad runtime code.

### Render Engine And Shared UI Interaction Ledger

`render_engine.js` and `ui_components.js` do not directly filter YouTube, but they decide what state a user can see and mutate. This layer therefore has to prove that visible UI state, stored state, and runtime active state stay aligned.

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Keyword mode source | `js/render_engine.js:193-210` | Main/Kids keyword list shows blocklist or whitelist source based on each surface mode. | Current UI hides the non-active list, so users cannot inspect the opposite list before mode switching or import/sync apply. | `GATE` for future dual-list UI |
| Keyword Kids-to-Main sync display | `js/render_engine.js:212-240` | Shows Kids entries in Main only when `syncKidsToMain` and modes match. | Correct guard; needs fixture so Kids whitelist cannot visually bleed into Main blocklist or vice versa. | `KEEP` + fixture |
| Keyword search filter | `js/render_engine.js:242-248` | Calls `k.word.toLowerCase()` directly. | If a legacy/imported keyword entry is still a string, render can throw instead of showing repairable state. Storage normalizers may prevent this, but render should still be defensive. | `INSTRUMENT` + fixture |
| Keyword toggles | `js/render_engine.js:370-531`, `js/ui_components.js:133-156` | Toggle component flips visual state before async state mutation finishes. | If a lock gate, validation error, or async failure rejects the mutation, UI can momentarily show a state that storage/runtime did not accept. | `CONSOLIDATE` with mutation result |
| Channel mode source | `js/render_engine.js:575-596` | Main/Kids channel list shows either blocked or allowed channels based on active mode. | Same hidden-opposite-list risk as keywords; especially important before adding simultaneous allow/block support. | `GATE` for future dual-list UI |
| Channel Kids-to-Main sync display | `js/render_engine.js:598-615` | Adds Kids channels to Main only when modes match and dedupes by derived key. | Good mode guard; needs fixture for UC/handle/custom URL dedupe. | `KEEP` + fixture |
| Channel first-batch render | `js/render_engine.js:724-760` | Clears container, renders first 60/80 rows synchronously, then idle-batches the rest. | Good for large lists, but first synchronous batch can still be expensive on low-end popup/dashboard surfaces. | `INSTRUMENT` render time |
| Collaboration grouping source | `js/render_engine.js:617`, `js/render_engine.js:767-843` | Groups only `state.channels`, not current whitelist channel source. | Collaboration badges are blocklist-oriented; future dual allow/block UI must not treat this as universal channel metadata. | `DOCUMENT` |
| Channel delete and filter-all controls | `js/render_engine.js:932-948`, `js/render_engine.js:1032-1064`, `js/render_engine.js:1121-1163` | Delete writes by list index; Filter All hides itself in whitelist mode. | Correct for current either/or model, but not sufficient for simultaneous allow/block entries. | `REWRITE` when dual-mode schema begins |
| Channel-derived keyword lookup | `js/render_engine.js:1222-1235` | Resolves `channelRef` only across Main blocked channels and Kids blocked channels. | Any future allow-derived channel rule will not resolve origin labels unless lookup includes allow lists. | `GATE` for dual-mode work |
| Custom select dropdown | `js/ui_components.js:468-845` | Enhances selects by appending dropdown to `document.body`, adding resize/scroll/document listeners and a MutationObserver. | Good clipping fix for profile dropdowns, but old listeners/dropdowns can remain if parent UI is rebuilt. This is dashboard/popup performance debt, not YouTube page lag. | `INSTRUMENT` + cleanup API |
| Tab/content HTML helpers | `js/ui_components.js:260-281`, `js/ui_components.js:860-866` | Some shared helpers accept `innerHTML` strings. | Safe only for trusted static labels/icons; do not pass imported profile/rule text through these APIs. | `KEEP` with callsite audit |

Render-state invariant:

```text
Every UI mutation should resolve through:
  validate desired state
  persist state
  receive success/failure
  re-render from persisted state

Optimistic CSS toggles are allowed only when rollback is explicit.
```

This is one reason the future simultaneous allow/block UI must be schema-first. Otherwise, quick block, 3-dot menu, dashboard rows, app native controls, import, and Nanah can each invent their own meaning for "blocked", "allowed", "filter all", and "active".

### Background Message Surface Initial Map

`js/background.js:3166` is the main runtime message router. This is the initial action inventory:

| Action group | Actions | Runtime risk |
| --- | --- | --- |
| Release/first-run UI | `FilterTube_ReleaseNotesCheck`, `FilterTube_ReleaseNotesAck`, `FilterTube_FirstRunCheck`, `FilterTube_FirstRunComplete`, `FilterTube_OpenWhatsNew` | Low filtering risk, but can wake background/UI on install/update. |
| Settings/session | `getCompiledSettings`, `FilterTube_SessionPinAuth`, `FilterTube_ClearSessionPin`, `FilterTube_ApplySettings` | High contract importance; wrong profile/settings cache can affect all runtime decisions. |
| Mode/list mutation | `FilterTube_SetListMode`, `addWhitelistChannelPersistent`, `FilterTube_BatchImportWhitelistChannels`, `FilterTube_KidsWhitelistChannel`, `FilterTube_TransferWhitelistToBlocklist`, `addChannelPersistent` | Highest data-model risk; must be covered by state transition tests. |
| Identity fetch/enrichment | `fetchShortsIdentity`, `fetchWatchIdentity`, `FilterTube_KidsBlockChannel`, `fetchChannelDetails` | Highest privacy/engagement-risk surface; must be gated and logged. |
| Injection/import bridge | `injectScripts`, `FilterTube_EnsureSubscriptionsImportBridge`, `processFetchData` | Medium/high; can create duplicate main-world runtime paths. |
| Maps/stats | `updateChannelMap`, `updateVideoChannelMap`, `updateVideoMetaMap`, `recordTimeSaved` | Mostly support state, but map staleness can affect channel decisions. |
| Browser/runtime info | `getBrowserInfo` | Low. |

Verdict: `INSTRUMENT`. Before changing behavior, add one debug-only decision log around this router: action, trusted sender status, profile target, whether it writes storage, whether it fetches network, and whether it broadcasts settings.

### Background Message Mutation And Provenance Audit

The background router is a trust boundary. Some actions are UI-only, some are content-runtime actions, and some write maps/stats from harvested YouTube data. The code currently mixes those categories in one `onMessage` chain, so each mutating action needs an explicit provenance contract.

| Action/path | Proof | Current sender check | Mutates / wakes | Risk | Verdict |
| --- | --- | --- | --- | --- | --- |
| `FilterTube_SetListMode` | `js/background.js:3290-3497` | Requires `isTrustedUiSender()` at `js/background.js:3291-3293`. | Writes V4 profiles, clears legacy lists on Main whitelist, broadcasts `FilterTube_RefreshNow`. | Correct trust boundary, but ignores `copyBlocklist:false` and always merges blocklist when entering whitelist. | `REWRITE` |
| `addWhitelistChannelPersistent` | `js/background.js:3498-3537` | Requires `isTrustedUiSender()` at `js/background.js:3499-3501`. | Adds Main whitelist channel through shared add helper. | Good UI-only gate; needs transition/count report. | `KEEP` + `INSTRUMENT` |
| `FilterTube_BatchImportWhitelistChannels` | `js/background.js:3537-3705` | Requires trusted UI, active profile check, and session authorization at `js/background.js:3538-3572`. | Merges imported subscriptions into Main whitelist, updates `channelMap`, broadcasts refresh. | Good gate; mode is not changed, so whitelist entries can be imported while still in blocklist until user switches. Needs UI copy to make that explicit. | `KEEP` + transition report |
| `FilterTube_KidsWhitelistChannel` | `js/background.js:3706-3759` | Requires trusted UI. | Adds Kids whitelist channel. | Good gate; should share same transition/count report as Main whitelist add. | `KEEP` + `INSTRUMENT` |
| `FilterTube_TransferWhitelistToBlocklist` | `js/background.js:3759-3950` | Requires trusted UI. | Moves allow lists into blocklists and sets mode to blocklist. | Correct explicit destructive transfer; must fixture legacy V3 writes and channel-derived keyword preservation. | `KEEP` + fixture |
| `FilterTube_ScheduleAutoBackup` | `js/background.js:3950-3960` | No trusted sender check. | Schedules backup work. | Content runtime can request backup scheduling; likely acceptable, but should rate-limit and log source. | `INSTRUMENT` |
| Identity fetches | `js/background.js:3961-3966` | No trusted UI check; content-runtime action. | Fetches Shorts/watch identity through background helper. | Needs route/profile/request-budget contract; can be expensive and privacy-sensitive. | `GATE` |
| `FilterTube_KidsBlockChannel` | `js/background.js:3967-4008` | No trusted UI check. | Adds Kids blocked channel through shared add helper. | This is a storage mutation from content/native Kids action. It needs explicit allowed sender surface, profile target, and reason logging. | `INSTRUMENT` + sender contract |
| `injectScripts` | `js/background.js:4009-4055` | Uses sender tab/frame, no script allowlist beyond requested extension file path construction. | Injects requested files into MAIN world. | Should be limited to known script names; current request-to-file conversion is flexible. | `GATE` allowlist |
| `FilterTube_EnsureSubscriptionsImportBridge` | `js/background.js:4055-4087` | Takes `tabId` from request. | Injects import bridge scripts into isolated world. | UI-driven import path; should require trusted UI sender and expected YouTube tab URL. | `GATE` |
| `processFetchData` | `js/background.js:4087-4094` | None; currently no-op. | No current mutation. | Should be removed or kept debug-only to avoid future central processing drift. | `REMOVE` or `DOCUMENT` |
| `addChannelPersistent` | `js/background.js:4095-4380` | No trusted UI check. | Adds Main blocked channel, fetches channel info, writes `filterChannels` and V4 active profile. | Content quick-block path likely depends on this, but the mutation contract is implicit and duplicates newer helper paths. | `CONSOLIDATE` |
| `FilterTube_ApplySettings` | `js/background.js:4381-4396` | No trusted UI check. | Updates compiled settings cache and pushes settings to matching tabs. | A stale or wrong sender can push runtime settings even if storage is different. Content receiver partially corrects profile mismatch at `js/content/bridge_settings.js:283-314`. | `GATE` to UI/storage-derived settings |
| Map/stat writes | `js/background.js:4397-4434` | No trusted UI check; content-runtime action. | Updates channel/video/meta maps and stats. | Necessary harvesting path, but needs caps, staleness, source route, and no-op budget. | `INSTRUMENT` |
| `fetchChannelDetails` | `js/background.js:4437-4445` | No trusted UI check. | Network fetch for channel info. | Should be allowed only from extension UI/content actions with rate limiting and reason. | `GATE` |

Action contract target:

```text
background_action_schema[action] = {
  allowedSenders: ["popup", "tab-view", "content:youtube", "content:kids"],
  writesStorage: boolean,
  writesFilterRules: boolean,
  fetchesNetwork: boolean,
  broadcastsRuntimeRefresh: boolean,
  requiresProfileUnlock: boolean,
  rateLimitKey,
  transitionReport: boolean
}
```

This would make the background router auditable and would also support app parity, where native controls need the same action semantics without copying accidental extension-only behavior.

### Background Action Schema Ledger - Control Plane Pass

This pass treats `js/background.js` as a control plane, not merely a message switch. The disease is not one action; it is that several features can mutate the same filtering truth through different paths, with different sender checks, different compatibility writes, and different refresh side effects.

Proof anchors:

- `isTrustedUiSender()` only accepts extension pages by comparing `sender.url` to `runtime.getURL('')` (`js/background.js:369-379`).
- The primary message router starts at `js/background.js:3166-3168`.
- A second message listener handles 3-dot menu actions at `js/background.js:5209-5263`.
- Cross-tab wakeups use `sendMessageToTabQuietly()` (`js/background.js:44-55`) and occur from mode/import/list writes (`js/background.js:3482-3488`, `js/background.js:3666-3685`, `js/background.js:3929-3935`, `js/background.js:6113-6120`).
- Channel/map/video cache writes are debounced in helper queues (`js/background.js:1472-1515`, `js/background.js:1594-1673`) but direct channel additions can still perform immediate `storage.local.set()` writes (`js/background.js:6006-6037`, `js/background.js:6032-6034`, `js/background.js:6141-6144`).

Action schema table:

| Action/path | Sender class today | Storage/network side effects | Disease-level risk | Required contract |
| --- | --- | --- | --- | --- |
| `getCompiledSettings` | Any sender; profile inferred from requested profile or URL (`js/background.js:3242-3265`). | Reads and caches compiled settings. | Correctly open to content runtime, but `forceRefresh` is caller-controlled and can bypass cache. | Content-runtime allowed, but rate/count log `forceRefresh` and profile target. |
| `FilterTube_SetListMode` | Trusted UI only (`js/background.js:3290-3294`). | Writes V4, may clear legacy Main lists, schedules backup, broadcasts refresh (`js/background.js:3462-3488`). | `copyBlocklist` is read at `js/background.js:3302` but the code still merges blocklist into whitelist unconditionally when enabling whitelist at `js/background.js:3443-3445`. | Explicit transition report: before/after mode, copied counts, cleared counts, active profile id. |
| `FilterTube_BatchImportWhitelistChannels` | Trusted UI + active profile + session authorization (`js/background.js:3537-3572`). | Merges whitelist, updates `channelMap`, writes V4/V3, schedules backup, refreshes YouTube tabs (`js/background.js:3574-3685`). | Good gate; import can update whitelist while mode remains blocklist (`targetMode` is observed at `js/background.js:3581`, not changed). | Import result must state "imported but not active" unless mode is whitelist. |
| `FilterTube_KidsWhitelistChannel` | Trusted UI only (`js/background.js:3706-3710`). | Calls shared channel add helper with profile `kids` and list type `whitelist` (`js/background.js:3726-3740`). | Safe sender, but shares the same deep helper used by content/runtime mutations. | Same channel-add result contract as Main/Kids block: source, profile, list type, identity confidence. |
| `FilterTube_KidsBlockChannel` | No trusted UI check (`js/background.js:3967-4008`). | Mutates Kids blocklist through `handleAddFilteredChannel()`, can fetch watch/channel identity, schedules backup. | This is probably intentional for native/Kids surface actions, but the allowed content origin is implicit. | Explicit allowed surface: Kids content/native action only; reject non-Kids sender URL unless native/app bridge is identified. |
| `addChannelPersistent` | No trusted UI check (`js/background.js:4095-4380`). | Direct Main blocklist add path with its own normalizer/fetch/write logic, separate from `handleAddFilteredChannel()`. | Duplicate source of truth. This can diverge from the newer helper that handles list type, Kids, whitelist, identity repair, and V4/V3 writes. | Deprecate into `handleAddFilteredChannel()` or prove why it remains separate. |
| `addFilteredChannel` second listener | No sender check in second listener (`js/background.js:5209-5246`). | Calls `handleAddFilteredChannel()` for 3-dot menu/native context. | Better helper, but still not schema-gated; any extension content script with runtime access can call it. | Allowed sender URL + route + profile/list type contract. |
| `toggleChannelFilterAll` second listener | No sender check (`js/background.js:5249-5259`). | Updates Main legacy/V4 channel `filterAll` (`js/background.js:6175-6263`). | Only searches legacy `filterChannels` (`js/background.js:6188-6193`) and updates active Main V4 (`js/background.js:6202-6244`), so it is not a general profile/list toggle. | UI-only or content quick-menu allowed; must include profile/list identity and reject Kids/whitelist until supported. |
| `FilterTube_ApplySettings` | No trusted UI check (`js/background.js:4381-4396`). | Replaces compiled settings cache and pushes runtime settings to all matching tabs. | This is an immediate runtime override path independent of storage truth. A stale UI/content sender can make content behave differently from persisted state. | Only extension UI should send; settings must include profile id/revision or be rebuilt in background from storage. |
| `updateChannelMap`, `updateVideoChannelMap`, `updateVideoMetaMap` | No trusted UI check; content-runtime harvesting (`js/background.js:4397-4422`). | Queues map/meta writes (`js/background.js:1472-1515`, `js/background.js:1594-1673`). | Necessary for JSON-first identity, but can grow/wake storage and influence future channel matching. | Route-scoped source, cap proof, and no-op logging when unchanged. |
| `recordTimeSaved` | No trusted UI check (`js/background.js:4423-4434`). | Mutates stats. | Low safety risk, but false hide or repeated hide calls inflate product stats. | Only count after first hide per stable content id; include source writer. |
| `fetchChannelDetails` | No trusted UI check (`js/background.js:4437-4445`). | Network fetch and HTML/JSON parse through `fetchChannelInfo()`. | Expensive action callable by content/UI; can amplify YouTube page load cost if used freely. | Rate-limit by input + route + tab, cache result, require reason. |
| `injectScripts` | Uses sender tab/frame, but script list is request-controlled (`js/background.js:4009-4055`). | Injects arbitrary requested extension files into MAIN world after `js/` normalization. | Too flexible for a safety-critical runtime; accidental or compromised content path can request unexpected files. | Static allowlist of known bootstrap files. |
| `FilterTube_EnsureSubscriptionsImportBridge` | Request-supplied tab id, no trusted UI check (`js/background.js:4055-4087`). | Injects import bridge bundle into requested tab. | Should be UI-only and target a verified subscriptions/import YouTube URL. | Trusted UI sender + tab URL allowlist. |

Control-plane flow:

```text
UI/content/native event
  -> background action router
  -> sender/profile/list schema check
  -> single mutation helper or read-only fetch helper
  -> storage write / cache write / tab refresh
  -> transition report
```

Current flow has forks:

```text
quick block -> addChannelPersistent -> custom normalizer/fetch/write
3-dot menu -> addFilteredChannel -> shared helper/fetch/write
Kids native block -> FilterTube_KidsBlockChannel -> shared helper/fetch/write
UI whitelist add -> addWhitelistChannelPersistent -> shared helper/fetch/write
UI mode toggle -> SetListMode -> direct profile rewrite
import/sync -> IO/Nanah managers -> direct profile rewrite
```

This is the strongest background-level explanation for why bugs feel hard to reason about: "add a channel" and "change filtering state" are not single operations. They are multiple operations that happen to produce similar storage shapes.

Required invariant:

```text
Every background action must declare:
  allowed sender class
  target profile id and surface: main/kids
  target list type: blocklist/whitelist/read-only/map/stat
  storage keys it may write
  whether it may fetch YouTube
  whether it may broadcast refresh/apply settings
  whether it requires unlocked profile/admin context
  transition report payload
```

No implementation change should merge blocklist/whitelist modes or optimize runtime wakeups until this schema is defined, because otherwise old mutation forks will keep bypassing the new assumptions.

### Background Action Schema Deep Pass - Peer Agent Integration

This pass integrates the independent background-control-plane review. It confirms the local finding and sharpens the action schema: the background script is not only forwarding messages; it is compiling settings, mutating profile stores, mutating learned maps, injecting scripts, scheduling prompts/backups, and broadcasting runtime refreshes.

Storage deletion check: no direct `browserAPI.storage.local.remove(...)` call was found in the current source. The disease is not accidental deletion; it is multi-owner writes plus incomplete cache invalidation.

| Action family | Proof | Writes / fetches / broadcasts | Peer verdict | Audit meaning |
| --- | --- | --- | --- | --- |
| Runtime compilation | `getCompiledSettings` handler at `js/background.js:3242-3265`, compiler/cache helper at `js/background.js:2059-2558`; fixture `background compiler currently writes storage during getCompiledSettings read path`. | Can write migration/default `storageUpdates`, `ftProfilesV4`, then writes `compiledSettingsCache` (`js/background.js:3247-3259`, `js/background.js:2556`). | `REWRITE` | A "get" action is not pure. It can mutate storage and cache, so runtime boot cannot be reasoned about as a read-only operation. |
| Mode transitions | `FilterTube_SetListMode` at `js/background.js:3290-3497`; callers include `js/popup.js:856` and `js/tab-view.js:4656`. | Writes `ftProfilesV4`, may clear legacy lists, nulls caches, sends `FilterTube_RefreshNow`. | `REWRITE` | Correctly UI-gated, but too much direct profile rewriting lives inside the router. It must become a named transition with fixtures. |
| Legacy persistent block add | `addChannelPersistent` at `js/background.js:4095-4380`; caller `js/state_manager.js:1613`; fixture `background currently has two separate channel-add implementations`. | Writes `channelMap`, `filterChannels`, optional `ftProfilesV4`, may fetch channel identity, relies on storage listener/cache effects. | `REWRITE` | This old add path still bypasses the newer shared helper, so "block a channel" has multiple semantics. |
| 3-dot/native persistent add | Second listener `type:addFilteredChannel` at `js/background.js:5218-5254`; shared helper at `js/background.js:5283-6174`; callers `js/content/block_channel.js:1199`, `js/content_bridge.js:12806`, `js/state_manager.js:666`; fixtures `background currently has two separate channel-add implementations` and `addFilteredChannel message path forwards normalized listType to handleAddFilteredChannel`. | Writes many profile/list/map keys and may fetch channel identity. | `INSTRUMENT` | Better central helper, but it still needs sender/profile/list/write declarations before it becomes the only mutation path. The message bridge now forwards explicit list type; authority proof is still missing. |
| Channel filter-all toggle | `type:toggleChannelFilterAll` at `js/background.js:5249-5260`; helper at `js/background.js:6175-6268`; caller `js/content_bridge.js:12897`. | Writes `filterChannels`, optional active Main `ftProfilesV4`, nulls caches. | `REWRITE` | Toggle semantics are Main/legacy-shaped and should not silently apply to Kids, whitelist, or inactive profile states. |
| Runtime settings broadcast | `FilterTube_ApplySettings` at `js/background.js:4381-4396`; callers include `js/state_manager.js:1212`; receiver `js/content/bridge_settings.js:283`. | Overwrites one compiled cache entry from caller payload and sends settings to matching tabs. | `GATE` | Runtime authority can be caller supplied. The background should rebuild from storage or verify revision/profile before broadcasting. |
| Learned channel map update | `updateChannelMap` at `js/background.js:4397-4399`; caller `js/content/handle_resolver.js:29`. | Debounced `channelMap` write and in-place cache-map mutation. | `GATE` | Useful learning path, but it influences future matches and needs provenance, caps, and active-rule routing. |
| Learned video-channel map update | `updateVideoChannelMap` at `js/background.js:4400-4406`; callers `js/content_bridge.js:1281`, `js/content_bridge.js:1471`. | Debounced `videoChannelMap` write and in-place cache-map mutation. | `INSTRUMENT` | Needs count/cap/no-op logs and a strict separation from DOM reprocess decisions. |
| Learned video metadata update | `updateVideoMetaMap` at `js/background.js:4407-4422`; caller `js/content_bridge.js:1534`. | Debounced `videoMetaMap` write and in-place cache-map mutation. | `GATE` | Metadata can affect category decisions, so updates must be route-scoped and only trigger reprocess when an active metadata rule exists. |
| Identity fetches | `fetchShortsIdentity` at `js/background.js:3961-3963` with helper `js/background.js:2664-2704`; `fetchWatchIdentity` at `js/background.js:3964-3966` with helper `js/background.js:2706-2732`. | Fetches YouTube/YouTube Kids identity from content requests. | `GATE` | Network fetches must be reason-coded, route-budgeted, and disabled when no active rule can use the result. |
| Kids content block action | `FilterTube_KidsBlockChannel` at `js/background.js:3967-4008`; caller `js/content/block_channel.js:2038`. | Delegates to shared helper, may fetch identity, writes Kids block rules, refreshes Kids. | `GATE` | Likely intentional, but the allowed sender must be Kids/native action only, not any content page. |
| Script injection | `injectScripts` at `js/background.js:4009-4055`; caller `js/content/bridge_injection.js:39`. | Injects request-named extension files into MAIN world. | `GATE` | Needs a static allowlist; request-shaped script injection is too broad for a safety-critical runtime. |
| Subscription import bridge | `FilterTube_EnsureSubscriptionsImportBridge` at `js/background.js:4055-4087`; caller `js/tab-view.js:3276`. | Uses request-supplied `tabId` and injects import bridge scripts. | `GATE` | Must be trusted-UI only and verify a supported YouTube subscriptions/import URL. |

Storage write family map:

| Family | Proof | Why it matters |
| --- | --- | --- |
| Install/update defaults and migrations | Quick-block migration at `js/background.js:1013`, `js/background.js:1015`; keyword-comments migration at `js/background.js:1100`, `js/background.js:1102`; install defaults at `js/background.js:2576-2587`. | An apparently empty install can still perform writes and later refreshes before the user creates rules. |
| Map flushes | `js/background.js:1481`, `js/background.js:1604`, `js/background.js:1626`. | Passive identity learning can write storage and mutate caches outside active filtering. |
| Compile-time writes | `js/background.js:2380`, `js/background.js:2397`. | Runtime compilation can be a migration writer; tests must assert both output payload and side effects. |
| Release/first-run prompts | `js/background.js:2626-2629`, `js/background.js:3190`, `js/background.js:3200-3203`, `js/background.js:3214`. | Low filtering risk, but still part of empty-install wakeup budget. |
| Mode and whitelist import | `js/background.js:3472`, `js/background.js:3656`, `js/background.js:3924`. | Direct profile/list rewrites must emit transition reports and preserve compatibility mirrors. |
| Old add-channel path and helper add-channel path | Old path `js/background.js:4318`, `js/background.js:4365`; helper path `js/background.js:6036`, `js/background.js:6033`, `js/background.js:6142`. | The same user intent can write different key sets depending on entry point. |
| Stats | `js/background.js:4432`. | Stats can inflate when hide decisions are repeated or false-positive. Count only structured first-hide decisions. |
| Filter-all toggle | `js/background.js:6254`. | Toggle must be explicit about profile/list support and should not masquerade as a universal channel action. |

Peer-integrated invariant:

```text
background actions are data operations, not incidental message branches.

For each action:
  declare sender class,
  declare target profile/list/surface,
  declare storage keys,
  declare network permission,
  declare cache invalidation policy,
  declare broadcast policy,
  declare transition/result payload.

No action may both "read compiled settings" and "silently migrate/write settings"
without returning a sideEffect report in debug builds.
```

### Background Action Registry Completeness Pass - 3

This pass checks the message router as a registry. The previous action-schema sections proved the architectural problem; this section records remaining action families and the exact trust boundary gaps found in the current code.

| Action | Proof | Current sender rule | Side effects | Risk | Verdict |
| --- | --- | --- | --- | --- | --- |
| `FilterTube_ReleaseNotesCheck` | `js/background.js:3169-3197`. | Any runtime sender. | Reads/stores release notes payload and may return banner payload. | Low filtering risk; still wakes background on YouTube pages and depends on release data freshness. | `KEEP` + version contract |
| `FilterTube_ReleaseNotesAck` | `js/background.js:3198-3207`. | Any runtime sender. | Writes `releaseNotesSeenVersion` and clears payload. | Low filtering risk, but any content sender can suppress release notes. | `GATE` UI/content prompt sender |
| `FilterTube_FirstRunCheck` / `FilterTube_FirstRunComplete` | `js/background.js:3208-3220`; install/update injection at `js/background.js:2593-2615`, `2634-2656`. | Any runtime sender. | Reads/writes `firstRunRefreshNeeded`. | Low filtering risk; currently part of empty-install wakeup budget and should be measured. | `INSTRUMENT` |
| `FilterTube_OpenWhatsNew` | `js/background.js:3221-3232`. | Any runtime sender. | Opens requested `request.url` or default What’s New page. | A content sender can open arbitrary URL if it controls `request.url`. | `GATE` fixed URL allowlist |
| `FilterTube_SubscriptionsImportProgress` | `js/background.js:3233-3241`; sender relay at `js/content/bridge_settings.js:255-272`. | Any runtime sender. | Logs progress only. | Low direct risk, but logs can be noisy and should include request provenance. | `KEEP` + request id |
| `getCompiledSettings` | `js/background.js:3242-3265`. | Any runtime sender. | Reads settings, can run migration/default compile work, writes cache. | Caller-controlled `forceRefresh` can make content runtime bypass cache and increase startup cost. | `GATE` force-refresh budget |
| `FilterTube_SessionPinAuth` / `FilterTube_ClearSessionPin` | `js/background.js:3266-3289`. | Trusted UI sender only. | Verifies/caches/removes profile session PIN. | Correct trust model; keep as example for other mutation actions. | `KEEP` |
| `FilterTube_SetListMode` | `js/background.js:3290-3497`. | Trusted UI sender only. | Rewrites active V4 profile, clears compatibility keys on Main whitelist, schedules backup, refreshes tabs. | Correct sender gate, but `copyBlocklist` is read at `js/background.js:3302` while merge happens unconditionally at `js/background.js:3443-3445`. | `REWRITE` transition function |
| `addWhitelistChannelPersistent` | `js/background.js:3498-3536`. | Trusted UI sender only. | Calls shared add helper for Main whitelist, schedules backup. | Trust gate is correct; must share one add-channel result contract with blocklist path. | `KEEP` + unify |
| `FilterTube_BatchImportWhitelistChannels` | `js/background.js:3537-3705`. | Trusted UI sender, active profile, session authorized. | Writes whitelist, V3 compatibility mirror, optional channelMap, backup, tab refresh. | Strong gate; result should explicitly state if whitelist is not active in current blocklist mode. | `KEEP` + UX report |
| `FilterTube_KidsWhitelistChannel` | `js/background.js:3706-3758`. | Trusted UI sender only. | Calls shared add helper for Kids whitelist, schedules backup. | Trust gate is correct; must return identity confidence and list target. | `KEEP` + result schema |
| `FilterTube_TransferWhitelistToBlocklist` | `js/background.js:3759-3950`. | Trusted UI sender only. | Moves whitelist entries into blocklist and clears whitelist for active profile. | Correct sender gate; future simultaneous allow/block model should retire this destructive transfer. | `QUARANTINE` for dual-list future |
| `FilterTube_ScheduleAutoBackup` | `js/background.js:3950-3960`; content caller at `js/content_bridge.js:12825-12832`. | Any runtime sender. | Schedules local auto-backup. | Low direct risk, but add-channel helpers already schedule backups, so duplicate backup triggers need proof. | `INSTRUMENT` debounce count |
| `fetchShortsIdentity` | `js/background.js:3961-3963`, helper `js/background.js:2664-2704`. | Any runtime sender. | Network identity fetch and session cache. | Must be route/rule scoped and disabled when no active channel rule needs identity. | `GATE` |
| `fetchWatchIdentity` | `js/background.js:3964-3966`, helper `js/background.js:2706-3163`. | Any runtime sender. | Network identity fetch and session cache. | Same as Shorts; watch path can become expensive during page load or fullscreen. | `GATE` |
| `FilterTube_KidsBlockChannel` | `js/background.js:3967-4008`. | Any runtime sender. | Calls shared helper for Kids blocklist, may fetch identity, backup. | Whitelist equivalent is UI-gated, but this block path is not. If content-origin is intended, it still needs allowed sender URL/surface proof. | `GATE` Kids sender |
| `injectScripts` | `js/background.js:4009-4055`; caller `js/content/bridge_injection.js:39`. | Any content sender with a tab/frame. | Injects request-named extension files into MAIN world. | Request-controlled file list is too broad. | `GATE` static allowlist |
| `FilterTube_EnsureSubscriptionsImportBridge` | `js/background.js:4055-4087`; caller `js/tab-view.js:3276`. | Any runtime sender with requested tab id. | Injects import bridge files into requested tab. | Should be trusted UI only and tab URL checked. | `GATE` trusted UI + URL |
| `processFetchData` | `js/background.js:4087-4094`. | Any runtime sender. | Currently logs/no response. | Dead/placeholder action; can be removed or explicitly no-op. | `REMOVE` or schema no-op |
| `addChannelPersistent` | `js/background.js:4095-4380`; caller `js/state_manager.js:1613`. | Any runtime sender. | Legacy Main block add path with separate normalizer, channel fetch, channelMap write, `filterChannels`/V4 write. | Duplicate persistence engine versus shared helper. This is a major source-of-truth risk. | `REWRITE` into shared helper |
| `FilterTube_ApplySettings` | `js/background.js:4381-4396`; receiver `js/content/bridge_settings.js:283-307`. | Any runtime sender. | Overwrites compiled settings cache from caller payload and pushes settings to tabs. | Caller-supplied settings can bypass background compiler/storage truth. | `GATE` UI-only + revision |
| `updateChannelMap` | `js/background.js:4397-4399`; caller `js/content/handle_resolver.js:25-48`, `149-281`. | Any runtime sender. | Queues learned channel map writes. | Useful but map updates can influence future filtering; requires provenance and caps. | `GATE` |
| `updateVideoChannelMap` | `js/background.js:4400-4406`. | Any runtime sender. | Queues video-channel map writes. | Must not wake DOM fallback or storage churn when no active channel rules exist. | `INSTRUMENT` |
| `updateVideoMetaMap` | `js/background.js:4407-4422`. | Any runtime sender. | Queues video metadata writes. | Metadata controls must be active before this becomes page-load work. | `GATE` active-rule scope |
| `recordTimeSaved` | `js/background.js:4423-4434`. | Any runtime sender. | Mutates stats. | Stats can inflate from false/repeated hides. | `GATE` first-hide proof |
| `fetchChannelDetails` | `js/background.js:4437-4445`. | Any runtime sender. | Network fetch for channel identity/details. | Can amplify page cost if enrichment loops call freely. | `GATE` rate + cache |
| `getBrowserInfo` | `js/background.js:4448-4455`. | Any runtime sender. | Returns browser info. | Low risk. | `KEEP` |
| Content receiver `FilterTube_RefreshNow` | `js/content/bridge_settings.js:223-230`. | Any extension runtime sender. | Requests settings and force-runs DOM fallback. | Correct for background refresh, but must not become general page-load wakeup. | `GATE` source/action budget |
| Content receiver `FilterTube_ImportSubscribedChannels` | `js/content/bridge_settings.js:231-282`. | Any extension runtime sender. | Injects main-world import bridge and fetches subscriptions. | Should be trusted UI initiated only. | `GATE` request id + UI origin |
| Content receiver `FilterTube_ApplySettings` | `js/content/bridge_settings.js:283-307`. | Any extension runtime sender. | Applies pushed settings, or refetches if profile mismatch. | Good profile mismatch guard, but receiver still trusts payload when profile matches. | `GATE` settings revision |

Registry invariant:

```text
backgroundActionRegistry[action] = {
  handlerLine,
  allowedSender,
  allowedTabUrl,
  targetProfile,
  targetList,
  storageWrites,
  networkFetches,
  cacheInvalidations,
  tabBroadcasts,
  requiresUnlock,
  maxFrequency,
  resultSchema
}
```

This registry should be executable in tests. Until it exists, performance fixes and dual allow/block work will keep fighting hidden mutation paths.

### Background Action Schema Latest Pass - 2026-05-17

This latest pass re-read the background routers as active product authority. The important disease-level finding is that background work is split across two `runtime.onMessage` listeners and mixes read requests, profile mutations, learned-map writes, network fetches, script injection, tab refresh, backup scheduling, and caller-pushed runtime settings in one broad control plane.

Proof anchors:

- Primary router starts at `js/background.js:3166`.
- Secondary 3-dot/native channel router starts at `js/background.js:5209`.
- `FilterTube_SetListMode` reads `copyBlocklist` at `js/background.js:3302`, but the later whitelist merge path still merges blocklist entries at `js/background.js:3443-3445`.
- Caller-pushed runtime settings are accepted at `js/background.js:4381-4396`.
- Learned channel/video/meta map writes are accepted at `js/background.js:4397-4422`.
- Shared channel-add helper starts at `js/background.js:5276` and can perform identity resolution, map writes, profile/list writes, backup scheduling, and tab refresh by the time it reaches `js/background.js:6145`.

Latest action pass:

| Action family | Proof | Current authority shape | Hidden work | Disease-level risk | Required schema contract |
| --- | --- | --- | --- | --- | --- |
| Release notes / first-run / What's New | `FilterTube_ReleaseNotesCheck`, `FilterTube_ReleaseNotesAck`, `FilterTube_FirstRunStatus`, `FilterTube_FirstRunComplete`, and `FilterTube_OpenWhatsNew` at `js/background.js:3169-3232`. | Any runtime sender. | Storage writes and optional tab open. | Low filtering risk, but these still count toward empty-install background wakeups. | Keep broad only if payload is pure product UI state; log empty-install wakeups separately from filtering work. |
| Compiled settings read | `getCompiledSettings` at `js/background.js:3242-3265`; compile/cache helpers at `js/background.js:2059-2558`. | Any sender, with caller-controlled `forceRefresh`. | Can compile, migrate, populate cache, and return mode/profile payload. | Runtime startup is not a pure read path. If compile has side effects, page-load cost and state mutation are coupled. | Return `sideEffectReport` in debug builds: cache hit/miss, migration writes, profile id, surface, forceRefresh source. |
| PIN session mutation | `FilterTube_PIN_AUTHENTICATED` and `FilterTube_PIN_CLEAR_SESSION` at `js/background.js:3266-3289`. | Trusted UI sender only. | Session timestamp writes/removes. | This is the clean model other sensitive mutations should copy. | Keep; document as reference sender gate. |
| List-mode transition | `FilterTube_SetListMode` at `js/background.js:3290-3497`. | Trusted UI sender only. | V4 rewrite, compatibility-list clearing, cache invalidation, backup, tab refresh. | UI intent is not fully preserved: `copyBlocklist` is collected but not honored by the merge path. | Named transition function with before/after counts, `copyBlocklistRequested`, `copyBlocklistApplied`, cleared compatibility keys, and active profile id. |
| Whitelist import / transfer | Batch import at `js/background.js:3537-3705`; transfer at `js/background.js:3759-3950`. | Trusted UI + profile/session checks for import; trusted UI for transfer. | Profile/list rewrite, channelMap updates, backup, refresh. | Stronger gates exist here, but transfer is destructive and will conflict with future simultaneous allow/block. | Transaction result must say whether imported rules are active under current mode; transfer should be quarantined before dual-list model. |
| Kids block / whitelist add | Kids whitelist at `js/background.js:3706-3758`; Kids block at `js/background.js:3967-4008`. | Whitelist is trusted UI; block is any runtime sender. | Shared helper can fetch identity and write Kids lists. | Same Kids rule family has different trust boundaries depending on allow vs block. | Sender schema must allow only trusted UI/native Kids surface/content Kids quick-action, with route and surface proof. |
| Identity fetches | `fetchShortsIdentity` / `fetchWatchIdentity` at `js/background.js:3961-3966`; helper fetches around `js/background.js:2664-2732`; channel detail fetch at `js/background.js:4437-4445`. | Any runtime sender. | Network fetch, parse, cache/session updates. | This can amplify page-load and fullscreen cost if called by hydration or enrichment loops. | Require `reason`, `route`, `tabId`, active-rule need, per-input rate limit, and cache status in result. |
| Script injection | `injectScripts` at `js/background.js:4009-4055`; subscription bridge injection at `js/background.js:4055-4087`. | Any content sender for generic injection; requested tab id for subscription bridge. | Executes request-named extension files in isolated or MAIN world. | Request-shaped script lists are too flexible for a critical runtime. | Static action allowlist: known bundle id -> fixed file list -> allowed tab URL -> allowed sender. |
| Legacy Main block add | `addChannelPersistent` at `js/background.js:4095-4380`; caller path noted at `js/state_manager.js:1613`. | Any runtime sender. | Separate normalizer/fetch/write path for Main blocklist. | Duplicate add-channel semantics versus the newer shared helper. | Deprecate into shared transaction helper or prove an invariant that keeps outputs byte-equivalent. |
| Runtime settings broadcast | `FilterTube_ApplySettings` at `js/background.js:4381-4396`; receiver at `js/content/bridge_settings.js:283-307`. | Any runtime sender with a settings payload. | Overwrites compiled cache and pushes payload to matching tabs. | Background is not the only settings authority; stale/caller-shaped settings can temporarily drive runtime decisions. | Background rebuilds from storage/revision, or rejects payloads without signed `settingsRevision`, profile id, and source. |
| Learned map/meta/stat writes | `updateChannelMap`, `updateVideoChannelMap`, `updateVideoMetaMap`, and `recordTimeSaved` at `js/background.js:4397-4434`. | Any runtime sender. | Debounced storage writes, cache-map mutation, stats mutation. | Passive learning can influence future JSON-first matches and storage churn even when no visible filtering rule is active. | Provenance fields: route, renderer, producer, stable id, active-rule requirement, old/new value, no-op status, cap decision. |
| Shared add/filter helper | Secondary listener `addFilteredChannel` / `toggleChannelFilterAll` at `js/background.js:5209-5266`; helper at `js/background.js:5283-6152`; fixture `addFilteredChannel message path forwards normalized listType to handleAddFilteredChannel`. | Any runtime sender. | User-rule mutation, identity fetch, channelMap write, compatibility write, backup, refresh. | This is the better central path, but it currently accepts multiple intents without a declared transaction phase and still lacks actor/profile/list authority proof. | Decompose into `resolveIdentity`, `validateIntent`, `writeRule`, `writeCompatibilityMirror`, `refreshRuntime`, each with result fields. |

Background disease flow:

```text
content/UI/native event
  -> one of two background message listeners
  -> sometimes trusted sender check, sometimes none
  -> maybe fetch YouTube identity
  -> maybe update learned maps
  -> maybe rewrite profile/list state
  -> maybe overwrite compiled cache from caller payload
  -> maybe broadcast runtime refresh
```

Target flow:

```text
message
  -> backgroundActionRegistry[action]
  -> sender/url/profile/list/schema validation
  -> transaction phase execution
  -> storage/cache/network/broadcast according to declared contract
  -> structured result + debug side-effect counters
```

This pass strengthens the conclusion: performance work must not only throttle observers. The background must first expose which actions are allowed to create rules, which actions are passive enrichment, which actions can fetch YouTube, and which actions can wake all content scripts.

### Main-World / Isolated-World Bridge Message Ledger

This pass treats `window.postMessage` as a second control plane. It moves data between the page MAIN world, isolated content scripts, and background storage. The disease risk is not only security; it is also source-of-truth drift, duplicate response consumers, and map writes triggered outside explicit user actions.

| Bridge path | Proof | Current source check | Mutates / wakes | Disease-level risk | Verdict |
| --- | --- | --- | --- | --- | --- |
| Subscription import request: content -> injector | `js/content/bridge_settings.js:130-139`, `js/injector.js:23-36` | Injector requires `type === FilterTube_RequestSubscriptionImport` and `source === content_bridge` (`js/injector.js:26-29`). | MAIN world fetches subscriptions through `fetchSubscribedChannelsFromYoutubei()`. | Good explicit source check; must remain user-initiated because it can fetch multiple pages. | `KEEP` + provenance log |
| Subscription import responses in bridge settings | `js/content/bridge_settings.js:146-195` | Requires `event.source === window` and `data.source === injector` (`js/content/bridge_settings.js:148-152`). | Resolves pending import requests and progress timers. | Good source check; duplicates part of `content_bridge` response handling. | `KEEP` + consolidate |
| Injector settings receiver | `js/injector.js:1873-1898` | Requires `type === FilterTube_SettingsToInjector` and `source === content_bridge` (`js/injector.js:1881`). | Updates `currentSettings`, forwards to seed, processes queued data. | Correct source check, but if content sends a mode-blind/shared payload the injector will trust it. | `KEEP` + payload schema |
| Injector collaborator cache receiver | `js/injector.js:1900-1911` | Requires `type === FilterTube_CacheCollaboratorInfo` and `source === filter_logic`. | Caches collaborator data in MAIN world. | Good source check; cache quality logic exists. Count message volume. | `INSTRUMENT` |
| Injector collaborator/channel lookup responses | `js/injector.js:1913-1984` | Requires request `source === content_bridge`. | Reads MAIN-world cache/`ytInitialData`, posts response back. | Useful precise identity path; should not trigger network. | `KEEP` |
| Content bridge message ingress | `js/content_bridge.js:5468-5472` | Accepts any same-window message with `type` starting `FilterTube_`, rejects only `source === content_bridge`. | Dispatches many storage/DOM/cache actions. | Broader than injector-side checks; several branches do not require `source === injector` or `source === filter_logic`. | `GATE` per message type |
| Content bridge settings/refresh ready | `js/content_bridge.js:5473-5478` | No explicit source whitelist beyond type prefix and not-own-source. | Requests settings and can force DOM fallback. | A spoofed page message with `FilterTube_Refresh` can wake DOM fallback. | `GATE` source whitelist |
| Content bridge channel/video/meta map updates | `js/content_bridge.js:5479-5556` | No explicit source whitelist per branch. | Persists channel/video/meta maps, stamps DOM, may rerun fallback. | These messages influence future filtering identity and can cause storage refresh churn. Must accept only known `filter_logic`/`injector` producers. | `GATE` |
| Content bridge custom URL map update | `js/content_bridge.js:5557-5569` | No explicit source whitelist per branch. | Directly reads/writes `channelMap` via `storage.local`. | Direct storage write bypasses background map queue and source metadata. | `REWRITE` through background queue |
| Content bridge collaborator response/cache | `js/content_bridge.js:5570-5595`, `js/content_bridge.js:5623-5661` | No explicit source whitelist per branch. | Resolves pending requests and stamps collaborator state on cards. | Source ambiguity can poison collaborator decisions or menu metadata. | `GATE` |
| Content bridge subscription response duplicate | `js/content_bridge.js:5596-5622` | No explicit source whitelist per branch. | Resolves same `pendingSubscriptionImportRequests` shape as bridge settings. | Duplicate consumers are mostly harmless but increase lifecycle burden and make timeout behavior harder to prove. | `CONSOLIDATE` |
| Content bridge channel info response | `js/content_bridge.js:5662-5672` | No explicit source whitelist per branch. | Resolves pending channel info requests. | Should only accept injector response for the matching request id. | `GATE` |
| Content bridge collab dialog data | `js/content_bridge.js:5673-5685` | No explicit source whitelist per branch. | Stores partial collaborator data for pending cards. | Needs request id/card key validation and known producer source. | `GATE` |
| Filter logic -> bridge map messages | `js/filter_logic.js:71-140`, `js/filter_logic.js:1502-1544`, `js/filter_logic.js:1898-1909` | Producer sets `source: filter_logic`. | Sends map/meta/collaboration data. | Correct producer label exists; receiver should enforce it. | `KEEP` producer, `GATE` receiver |
| Handle resolver -> bridge map messages | `js/content/handle_resolver.js:218-264` | Producer posts `FilterTube_UpdateChannelMap`. | Feeds channel map updates. | Receiver must accept this only from known extension producer or move to direct extension runtime message. | `GATE` |

Bridge trust invariant:

```text
For every window message type:
  allowedSourceLabels = exact set, e.g. ["injector"], ["filter_logic"], ["content_bridge"]
  allowedPayloadShape = required fields and size caps
  sideEffect = none / DOM stamp / storage map write / settings refresh / pending request resolve
  requestCorrelation = required when resolving a pending request
  backgroundRoute = required for any persistent storage write
```

This is especially important because `window.postMessage` shares the page window. Even when the practical threat is low, a permissive receiver also makes accidental internal messages hard to reason about and lets map/meta writes escape the same background action schema.

### Caller Intent And Source-Of-Truth Drift Ledger

The background action problem is confirmed by caller paths. UI, content, native/Kids, and enrichment code all reach similar mutation helpers with different assumptions. That means a future fix must normalize caller intent before it changes the data model.

| Caller | Proof | Intent it represents | Background action | Drift / risk |
| --- | --- | --- | --- | --- |
| StateManager enrichment queue | `js/state_manager.js:639-690` | Passive repair/enrichment of existing channel rows, not a user block click. | Sends `type: addFilteredChannel` with `source: task.source`. | Same mutation path as real user 3-dot block; needs `intent: enrich_existing_identity` so it cannot accidentally create a new user rule without proof. |
| Kids manual add from app/UI state | `js/state_manager.js:912-920` | User/admin adds Kids channel according to current Kids mode. | Sends `FilterTube_KidsWhitelistChannel` or `FilterTube_KidsBlockChannel`. | Kids block action lacks the trusted UI check that whitelist has; source says `user`, but sender contract is not enforced in background. |
| StateManager settings broadcast | `js/state_manager.js:1209-1215`, `js/state_manager.js:1224-1235` | Push freshly compiled settings after local state changes. | Sends `FilterTube_ApplySettings` after `getCompiledSettings(forceRefresh)`. | `FilterTube_ApplySettings` accepts caller-provided settings (`js/background.js:4381-4396`), so background is not the sole compiler. |
| Main channel add from UI | `js/state_manager.js:1590-1617` | User adds Main channel to current mode. | Chooses `addWhitelistChannelPersistent` in whitelist, `addChannelPersistent` in blocklist. | Whitelist path uses shared helper; blocklist path uses older direct helper. Same UI command uses different persistence engines depending on mode. |
| StateManager local mirror update | `js/state_manager.js:1620-1646` | Keep UI state responsive after background write. | Mutates `state.whitelistChannels` or `state.channels` locally after background response. | Background already wrote storage. Local in-memory mirror can diverge until load/refresh if background normalized differently. |
| Subscriptions import | `js/state_manager.js:1711-1805` | Admin imports subscriptions into whitelist. | Sends `FilterTube_BatchImportWhitelistChannels`, reloads, requests refresh. | Strong profile/lock checks in StateManager and background, but imported whitelist can be dormant if mode remains blocklist. |
| Quick block button | `js/content/block_channel.js:1191-1213` | User clicked on-card quick block. | Calls `addChannelDirectly()` if available, otherwise sends `type: addFilteredChannel`. | Correctly user initiated, but still bypasses the trusted UI sender model because it is content-origin. Needs allowed content sender + surface proof. |
| Content bridge fallback menu | `js/content_bridge.js:12803-12823` | User selected custom fallback menu block/filter action. | Sends `type: addFilteredChannel` with metadata and profile. | Same as quick block; needs `surface`, `route`, `selector confidence`, and `identity confidence` in the mutation report. |
| Content bridge post-fetch enrichment | `js/content_bridge.js:10732-10743` | Repair missing channel name/details. | Sends `fetchChannelDetails`. | Read-only network fetch, but can become expensive if many rows need enrichment; needs rate/cached reason. |
| Content bridge auto-backup trigger | `js/content_bridge.js:12825-12832` | Backup after successful content-origin add. | Sends `FilterTube_ScheduleAutoBackup`. | Background helper already schedules backup for `addFilteredChannel` at `js/background.js:5238-5244`; this may double-request backup unless debouncing hides it. |

Caller normalization target:

```text
mutationIntent:
  user_block_click
  user_whitelist_add
  user_mode_change
  subscriptions_import
  native_kids_block
  passive_identity_enrichment
  map_harvest
  stats_harvest
  settings_broadcast
```

Only `user_*`, `subscriptions_import`, and approved `native_kids_block` intents should be allowed to create or move filter rules. Passive enrichment may update identity fields of an existing row only when it matches by stable UC ID.

### UI Intent Drift Ledger

UI review found cases where the interface asks the right question but the backend/state path does not preserve that intent.

| UI/control path | Proof | Drift | Required invariant |
| --- | --- | --- | --- |
| Popup list-mode label vs mutation target | Popup renders label from `popupActiveProfileType` (`js/popup.js:776-793`), but mode toggle target is resolved from active tab URL (`js/popup.js:408-433`, `js/popup.js:804-813`). | User can see one profile mode and mutate another if the popup-selected profile and active tab surface disagree. | Every control must target the visible profile, or show a target-confirmation row before mutation. |
| Popup copy blocklist prompt | UI asks whether to copy blocklist (`js/popup.js:816-831`) and sends `copyBlocklist` (`js/popup.js:854-860`). | Background computes `shouldCopyBlocklist` but does not use it before merging/clearing (`js/background.js:3302`, `js/background.js:3443-3445`, `js/background.js:3464-3470`). | `copyBlocklist:false` must preserve existing blocklist and activate empty whitelist only after explicit warning. |
| Main add channel by mode | StateManager chooses `addWhitelistChannelPersistent` or `addChannelPersistent` based on mode (`js/state_manager.js:1610-1617`). | Same UI command uses shared helper in whitelist and older direct helper in blocklist. | One channel-add API must own both modes. |
| User whitelist keywords | State load separates channel-derived whitelist keywords from user whitelist keywords (`js/state_manager.js:348-350`), then add/toggle/remove replaces `state.whitelistKeywords` with only `userWhitelistKeywords` (`js/state_manager.js:1366-1368`, `js/state_manager.js:1427-1431`, `js/state_manager.js:1478-1481`). | Channel-derived whitelist keyword entries can be dropped by ordinary user keyword edits. | Whitelist keyword mutation must preserve `source: channel` / derived entries unless intentionally deleting that channel rule. |
| Video/category controls | Popup video filters target active tab profile (`js/popup.js:474-480`), while keyword add uses `popupActiveProfileType` (`js/popup.js:1718-1720`). | Different controls on the same popup can resolve target differently. | A popup session needs one visible target model shared by all mutating controls. |

This is directly relevant to future simultaneous block/allow UX. If target profile, list type, and copy/merge intent are not explicit now, dual-list mode will multiply ambiguity.

### UI And State Mutation Authority Ledger - Deep Pass

This pass treats `StateManager`, popup controls, tab-view controls, render helpers, import/export, and Nanah as data writers. The disease is that UI code is not only "displaying settings"; it can compile, mirror, broadcast, import, and directly mutate profile/map state.

| UI/state path | Proof | Current behavior | Disease-level risk | Verdict |
| --- | --- | --- | --- | --- |
| Normal Main settings save | `js/state_manager.js:1009-1059`, `js/state_manager.js:1209-1215`. | Saves through `SettingsAPI.saveSettings()` and then broadcasts `FilterTube_ApplySettings` with `result.compiledSettings`. | UI can push runtime settings into background cache instead of background rebuilding from storage. This duplicates the runtime authority drift at `js/background.js:4381-4396`. | `REWRITE` authority |
| Background refresh rebound | `js/state_manager.js:1224-1236`. | Calls `getCompiledSettings(forceRefresh:true)` and immediately rebroadcasts that payload through `FilterTube_ApplySettings`. | A refresh result becomes a second apply command. If the payload or profile target is stale, UI code can amplify it across tabs. | `GATE` |
| Main profile compatibility write | `js/state_manager.js:1077-1146`. | Persists V4 plus legacy V3 aliases including `whitelisted*`, `channels`, and `keywords`. | Necessary compatibility, but each write multiplies storage-change fanout and can make one UI action look like several state changes. | `KEEP` + transition report |
| Kids profile compatibility write | `js/state_manager.js:1148-1204`. | Persists Kids V4/V3 profile state with mode/list mirrors. | Same compatibility fanout; Kids and Main must share one transition result shape before dual-list support. | `KEEP` + transition report |
| Direct channel-map UI write | `js/state_manager.js:1973-1985`. | Writes `channelMap` directly from UI state. | Bypasses the background debounced map queue/provenance contract and can invalidate maps without source metadata. | `ROUTE` through background map API |
| Generic setting update | `js/state_manager.js:1998-2108`. | Accepts many boolean/key updates and may call `saveSettings()`, `persistMainProfiles()`, `persistKidsProfiles()`, or `requestRefresh()`. | Different keys take different persistence paths, making active-state and invalidation harder to prove. | `INSTRUMENT` key-to-writer map |
| `syncKidsToMain` special case | `js/state_manager.js:2048-2099`. | Copies Kids settings from Main, writes V4/V3, then requests Main refresh. | Correct product feature, but it is a bulk mutation with no before/after report. It can change future Kids behavior without the same UI ceremony as per-rule edits. | `KEEP` + explicit transition |
| Content/category filter writes | Main content `js/state_manager.js:2115-2135`, Kids content `js/state_manager.js:2137-2160`, Main category `js/state_manager.js:2162-2188`, Kids category `js/state_manager.js:2190-2217`. | Main path uses `saveSettings()`; Kids path writes profiles then requests refresh. | Metadata/category filters can activate expensive runtime work even when keyword/channel lists are empty. Each update must feed the active-enforcement report. | `GATE` with active-state output |
| UI storage listener | `js/state_manager.js:2334-2407`. | Reloads UI on selected keys, but omits `contentFilters`, `categoryFilters`, `videoChannelMap`, and `videoMetaMap`. | UI can display stale filter/category/map-dependent state while content/background runtime already changed. | `REWRITE` shared key schema |
| Shared compiler payload | `js/settings_shared.js:484-561`. | Builds a compact compiled payload but omits list mode, profile type, whitelist arrays, and maps. | Shared compiler is not equivalent to background compiler; any UI save using it can be blocklist-shaped even when profile truth is richer. | `REMOVE` as runtime compiler or narrow to UI preview |
| Shared settings load | `js/settings_shared.js:564-691`. | Reads active V4 `main.keywords/channels`, not `blockedKeywords/blockedChannels`; may write V4 during load if missing. | Load is not read-only and aliases can hide which list actually owns the rule. | `REWRITE` canonical schema load |
| Shared settings save | `js/settings_shared.js:918-933`, `js/settings_shared.js:950-1069`. | Writes Main `channels`/`keywords`, preserves some profile state, and can build V4 from legacy values. | Save path cannot be the canonical source for a future simultaneous block/allow model unless it writes typed entries. | `REWRITE` before dual-list work |
| Tab-view keyword/channel edits | Keyword add/remove/toggle at `js/tab-view.js:10314-10354`; channel add/remove at `js/tab-view.js:10372-10402`; filter-all disabled in whitelist at `js/tab-view.js:10405-10420`. | Mutates active Main/Kids list based on current mode; filter-all is not available in whitelist. | Current UI is either/or mode. Simultaneous allow/block requires action controls to specify list type per entry, not infer from mode. | `KEEP` current behavior, `DESIGN` typed-list future |
| Tab-view mode switch | Target selection `js/tab-view.js:10496-10511`, copy confirm `js/tab-view.js:10538-10559`, managed-child path `js/tab-view.js:10574-10599`, background action `js/tab-view.js:10606-10630`. | Sends either `FilterTube_TransferWhitelistToBlocklist` or `FilterTube_SetListMode`; managed child mutates local target directly. | Mode change is not one operation across all paths; managed child, popup, and background behave differently. | `REWRITE` canonical transition |
| Popup mode switch | Label `js/popup.js:776-793`, target `js/popup.js:804-813`, copy flag send `js/popup.js:854-860`. | Visible label can be derived separately from target profile; sends copy intent to background. | User can intend one surface/profile while active-tab targeting mutates another. | `GATE` target confirmation |
| Render-engine list selection | Keyword source `js/render_engine.js:192-210`, sync kids mode comparison `js/render_engine.js:212-220`, filter-all hidden in whitelist `js/render_engine.js:1121-1139`, fallback `js/render_engine.js:1168-1184`. | Displays mode-dependent lists and hides unsupported actions. | Good display separation; must remain read-only and consume a canonical view model rather than infer persistence shape. | `KEEP` |
| IO import | Incoming mode/list parse `js/io_manager.js:1320-1359`, V3 write `js/io_manager.js:1429-1481`, V4 merge/replace `js/io_manager.js:1492-1645`, channel-map write `js/io_manager.js:1665-1667`. | Can apply incoming modes/lists and map state directly. | Import can create a strict whitelist or map changes without the same warnings as manual UI. | `GATE` preview and report |
| Nanah scoped import | `js/nanah_sync_adapter.js:168-257`. | Can set/merge profile mode and lists from peer payload. | Peer-to-peer sync is local-first, but it is still a high-authority state writer. It needs the same result summary as file import. | `GATE` preview and report |

UI/state invariant:

```text
UI code may request mutations; it should not define runtime truth.

All mutation requests should produce:
  target profile id,
  surface: main/kids,
  rule class: keyword/channel/category/content/map,
  list type: block/allow/not-applicable,
  before/after counts,
  legacy mirror writes,
  background-compiled runtime revision.

Only background-built settings may be broadcast to content runtimes.
```

### Import/Export/Nanah State Shape Initial Map

| Surface | Proof | Verdict | Reason |
| --- | --- | --- | --- |
| IO profile export shape | `js/io_manager.js:214-249`, `js/io_manager.js:439-467` | `KEEP` + `INSTRUMENT` | V3 export derives Main/Kids list modes and lists from V4; needs fixtures for old and new profiles. |
| IO V4 migration from legacy | `js/io_manager.js:490-618` | `INSTRUMENT` | Builds default V4 from legacy channels/keywords/V3 Kids lists; must be tested with content/category filters and whitelist modes. |
| Settings load migration | `js/settings_shared.js:564-691` | `INSTRUMENT` | `loadSettings()` can write missing profile settings during load, so it can wake storage listeners. |
| Settings save fanout | `js/settings_shared.js:742-910` | `INSTRUMENT` | Saves legacy keys plus V4 settings, making one UI action broadcast across all runtime listeners. |
| Nanah scoped export | `js/nanah_sync_adapter.js:119-166` | `KEEP` | Main/Kids scoped payloads export the active profile subtree directly. |
| Nanah scoped import | `js/nanah_sync_adapter.js:168-257` | `GATE` | Incoming scoped payload can set `mode`, merge/replace block/allow lists, and activate empty whitelist if incoming data says so. |
| Nanah envelope parsing | `js/nanah_sync_adapter.js:302-376` | `KEEP` + `INSTRUMENT` | Payloads are JSON strings transported by Nanah; apply path must log scope, strategy, and profile target. |

Import/sync invariant:

```text
Any import/sync that can change mode or lists must produce:
  before mode/list counts
  after mode/list counts
  scope: main/kids/active/full
  strategy: merge/replace/preview
  active profile id
  explicit warning when result is whitelist with zero allow rules
```

This matters because false hiding can be introduced by state import even if the filtering engine itself is correct.

### Import/Sync Mode Activation Risks

The import/sync surface is now proven to be a first-class source of filtering behavior. It can create or remove whitelist/blocklist mode independent of normal UI mode toggles.

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| V4 export -> V3 compatibility | `js/io_manager.js:214-249`, `js/io_manager.js:914-1005` | Derives V3 `main.mode`, `kids.mode`, whitelisted lists, blocked lists, and embeds sanitized `profilesV4` when available. | Good compatibility bridge, but exported `settings.main` omits `contentFilters` and `categoryFilters`; full truth depends on embedded `profilesV4`. | `KEEP` + fixture |
| Legacy -> V4 default migration | `js/io_manager.js:490-558`, `js/io_manager.js:615-617` | Builds default V4 profile from legacy storage and forces Main/Kids modes to `blocklist`, with empty whitelist arrays. | Can preserve safety for old blocklist users, but can lose an old whitelist-mode intent if only V3 data had it. | `REWRITE` migration proof |
| Existing V4 sanitization | `js/io_manager.js:627-718` | Normalizes profile type/parent, settings, modes, and list entries. | Does not reject or warn on `mode: whitelist` with zero `whitelistChannels` and zero `whitelistKeywords`. | `GATE` |
| Import active/full mode | `js/io_manager.js:1330-1359`, `js/io_manager.js:1624-1645` | Incoming profile mode and lists are written into target profile. | Can activate strict whitelist via import without the same durable UI warning as manual toggle. | `GATE` |
| Import legacy V3 write | `js/io_manager.js:1429-1481` | Writes parsed V3 Main/Kids modes and lists into `ftProfilesV3` for legacy compatibility. | Another mode surface that needs the same before/after count audit. | `INSTRUMENT` |
| Full merge mode | `js/io_manager.js:1492-1549` | Merges incoming full profile tree into local tree and keeps incoming per-profile modes. | Merge can turn an existing profile into whitelist even if local user did not manually choose that mode. | `GATE` |
| Nanah scoped export | `js/nanah_sync_adapter.js:119-166` | Sends raw active profile `main` or `kids` subtree. | Good local-first shape, but raw subtree includes mode/lists without summary invariants. | `KEEP` + `INSTRUMENT` |
| Nanah scoped apply | `js/nanah_sync_adapter.js:168-257` | Applies `mode`, blocklists, allowlists directly to active/target profile with merge or replace semantics. | Can preserve existing whitelist mode even if incoming data lacks mode, and can create empty whitelist in replace. | `GATE` |
| Nanah envelope apply | `js/nanah_sync_adapter.js:351-377` | `preview` returns payload; `main/kids` apply scoped payload; `active/full` calls IO import. | Preview is the correct place to surface resulting mode/list counts before apply. | `KEEP` + `REWRITE` preview summary |
| Settings legacy -> V4 migration | `js/settings_shared.js:151-164` | Builds V4 with Main/Kids mode forced to `blocklist` and whitelist arrays empty. | Legacy whitelist state is not preserved by this migration builder. | `REWRITE` migration fixture |
| IO legacy -> V4 migration | `js/io_manager.js:541-554` | Same forced blocklist/empty whitelist migration shape. | Import/export migration can drop old whitelist intent even if legacy data contained it. | `REWRITE` migration fixture |
| Compile-time migration write | `js/background.js:1962-2080` | `getCompiledSettings()` can build and write `ftProfilesV4` during compile. | Compile is not pure; read path can mutate storage and trigger listeners. | `REWRITE` explicit migration phase |
| Compile-time channel keyword write | `js/background.js:2330-2397` | Compiling channel-derived keywords can write updated `ftProfilesV4`. | Filter compilation can change persisted rules, making source-of-truth audits harder. | `REWRITE` explicit repair phase |

### Import/Export/Nanah Deep Pass - 2

This pass covers `js/io_manager.js`, `js/nanah_sync_adapter.js`, and `js/security_manager.js` at storage-mutation level. These files are not hot YouTube DOM scanners, but they are high-authority state writers. A wrong mode/list/profile write here can later look like a filtering-engine bug.

| Method / block | Proof | Current behavior | Disease risk | Required invariant |
| --- | --- | --- | --- | --- |
| Profile V4 load repair | `js/io_manager.js:561-618` | Reads `ftProfilesV4`; if existing shape has invalid profile type/parent, sanitizes and writes storage; if missing, builds and writes default V4. | Read path can mutate storage, waking listeners and content refreshes during startup or import screens. Same disease as background compile-time migration. | `loadProfilesV4()` should report repair-needed; caller performs explicit migration/write once. |
| Legacy V4 builder | `js/io_manager.js:490-558` | Builds Default profile from `filterChannels`, `uiKeywords`, and V3 Kids lists, but always sets Main/Kids `mode: "blocklist"` and empty allow lists. | Preserves blocklist users but can erase legacy whitelist intent. This is especially risky because `loadProfilesV4()` writes it automatically at `js/io_manager.js:615-617`. | Legacy fixtures must prove whitelist mode/lists are preserved or explicitly declared unsupported before migration. |
| Existing V4 sanitizer | `js/io_manager.js:627-718` | Normalizes profile type, settings, Main/Kids modes, and lists. | Sanitizer accepts `whitelist` mode with zero allow entries and no warning/report. Import/sync can therefore create intentional-looking strict hiding without user-facing proof. | Sanitizer returns warnings, not only sanitized data. Empty active whitelist must be represented in transition report. |
| Invalid V4 save | `js/io_manager.js:620-625` | If `nextProfiles` is invalid, calls `writeStorage({})` instead of throwing. | Caller can believe profile save succeeded while no real key changed. That can desync UI and runtime expectations. | Profile save should return `{ok:false,error}` or throw; never silently "save" an empty payload. |
| Imported mode parse | `js/io_manager.js:1088-1089`; V3 compatibility write at `js/io_manager.js:1432-1481`; V4 write normalizes at `js/io_manager.js:1631-1639`. | `normalizeIncomingV3()` carries raw imported mode strings; V4 path normalizes later, but V3 compatibility mirror can receive `parsed.profilesV3.main.mode` / `kids.mode` directly. | Legacy mirror can store invalid mode strings even when V4 normalizes. Future code that reads V3 directly may behave differently. | Normalize imported modes at parse boundary before any V3 or V4 write. |
| Import writes two state layers | Runtime settings write `js/io_manager.js:1376-1411`; V3 mirror write `js/io_manager.js:1429-1481`; V4 write `js/io_manager.js:1488-1653`; map write `js/io_manager.js:1665-1667`. | A single import can call `SettingsAPI.saveSettings()`, write `ftProfilesV3`, write `ftProfilesV4`, and write `channelMap`. | Multiple storage writes can wake background/content several times, and partial failure can leave layers inconsistent. | Import should stage one transition, validate, then commit atomically or write one authoritative profile state plus derived mirrors. |
| Full replace active profile | `js/io_manager.js:1552-1556`, final save `js/io_manager.js:1648-1653`. | Full replace can carry incoming `activeProfileId` into local storage. | A backup import can change not only rules but also the active profile, which changes which runtime state content receives. | Full replace report must explicitly show active-profile change and require confirmation. |
| Profile import into separate profile | `js/io_manager.js:1285-1292`, skipped runtime save `js/io_manager.js:1409-1411`, V4 target write `js/io_manager.js:1562-1645`. | Profile import can avoid Main legacy runtime save and write a separate V4 profile subtree. | Good parent workflow, but compiled runtime for current content should not refresh as if active rules changed unless active profile changed. | Transition report distinguishes active-profile changes from inactive profile library updates. |
| Channel map import | `js/io_manager.js:1372`, `js/io_manager.js:1665-1667`. | Imports channel map into storage if non-empty. | Imported maps can influence future channel identity decisions without source confidence, timestamp, or route provenance. | Imported map entries need provenance and should not be trusted above fresh high-confidence identity unless verified. |
| Nanah scoped export | `js/nanah_sync_adapter.js:119-166`. | Exports raw active profile `main` or `kids` subtree as `data`. | Accurate local-first transfer, but raw subtree can include unknown future fields without schema summary. | Scoped envelope should include schema version, mode, list counts, and supported-field manifest. |
| Nanah scoped apply spread | Main apply `js/nanah_sync_adapter.js:193-216`; Kids apply `js/nanah_sync_adapter.js:217-244`. | Spreads `...data` into current `main`/`kids`, then normalizes mode and key lists. | Unknown incoming fields can land in profile subtrees. Also, when incoming mode is absent, existing whitelist mode is preserved, so a merge can leave strict whitelist active even if payload only carried list deltas. | Scoped apply validates allowed keys and returns before/after mode/list counts. |
| Nanah replace semantics | Main `js/nanah_sync_adapter.js:199-210`; Kids `js/nanah_sync_adapter.js:226-237`. | `replace` uses incoming arrays directly for channels/whitelist in some branches and normalized keyword helpers in others. | Replace can create `mode:"whitelist"` with empty allow arrays, or raw channel entries with weaker sanitization than IO. | Use one sanitizer and empty-active-whitelist warning for IO, Nanah, import, and UI. |
| Nanah envelope parsing | `js/nanah_sync_adapter.js:333-349`. | Parses JSON payload from `app_sync` or `control_proposal`; unsupported envelope throws. | Good tight envelope switch, but JSON parse errors are not wrapped with scope/id provenance. | Parse/apply errors should include envelope id, scope, source device, and never partially apply. |
| Nanah preview | `js/nanah_sync_adapter.js:351-364`. | Preview returns raw portable payload and summary. | Preview is the right hook, but it does not compute resulting mode/list deltas. | Preview must return the same transition report as apply would commit. |
| Trusted Nanah state backup | Export include `js/io_manager.js:1707-1735`; import restore `js/io_manager.js:1669-1704`. | Full encrypted backup can include trusted links and device id, restored only with `auth.restoreTrustedNanahState === true`. | Good explicit flag. Still a high-authority trust-store write and must be surfaced separately from rule import. | Backup restore report separates filtering-rule changes from trusted-device trust changes. |
| Security manager scope | PIN verifier `js/security_manager.js:97-123`; encrypted JSON `js/security_manager.js:125-190`. | Pure crypto helper: PBKDF2/SHA-256 verifier, AES-GCM encrypted JSON. | No direct filtering mutation here. Security risk belongs to callers deciding when import/export/profile changes require PIN. | Keep helper pure; caller contracts decide admin gate and transition preview. |
| Auto-backup trigger | `js/io_manager.js:1760-1847`; scheduler `js/io_manager.js:1971-1988`. | Creates backup only when `autoBackupEnabled === true`; debounces by timer. | Low direct filtering risk. But backup can call `loadProfilesV4()` and therefore trigger migration writes if profile V4 is missing/broken. | Auto-backup must not perform implicit migration writes during a content-page action. |

Storage authority flow observed:

```text
file import / Nanah sync / backup restore
  -> normalize payload
  -> maybe SettingsAPI.saveSettings()
  -> maybe saveProfilesV3()
  -> maybe saveProfilesV4()
  -> maybe write channelMap / trusted Nanah state
  -> storage listeners and content refresh paths decide what runtime sees
```

Target import/sync flow:

```text
incoming payload
  -> parse + sanitize
  -> compute transitionReport {
       activeProfileBefore/After,
       main/kids mode before/after,
       block/allow counts before/after,
       maps/trust-store changes,
       empty-active-whitelist warnings,
       legacy-field omissions
     }
  -> require admin confirmation for destructive/strict changes
  -> one authoritative commit
  -> derived mirrors/cache invalidation generated from same schema
```

### Compiled Settings Purity And Cache Invalidation Ledger

This is now a root-disease candidate, not a small implementation detail. Runtime correctness depends on `getCompiledSettings()` being the authoritative settings snapshot, but the current compiler, background cache, content storage listener, and UI broadcast path do not share one key contract.

| Path | Proof | Behavior | Disease-level risk | Verdict |
| --- | --- | --- | --- | --- |
| Compiler read key set | `js/background.js:1784-1827` | Reads legacy toggles, profile keys, `channelMap`, `videoChannelMap`, `videoMetaMap`, `stats`, `ftProfilesV3`, and `ftProfilesV4`. | This is the true dependency list for compiled runtime behavior. Any invalidation list smaller than this can leave stale decisions. | `REWRITE` key contract |
| Compiler emits broad runtime controls | `js/background.js:2474-2551` | Emits enabled state, content hiding booleans, end-screen controls, quick-block/menu flags, content filters, and category filters. | Consumers cannot know whether runtime work is active because the compiler emits values but not a canonical active-enforcement summary. | `INSTRUMENT` then `REWRITE` payload |
| Background cache hit | `js/background.js:1778-1781`, `js/background.js:3247-3249` | Returns cached settings unless caller passes `forceRefresh`. | Cache is useful, but correctness relies on every storage writer invalidating exactly the same dependency set. | `KEEP` + invariant |
| Background storage invalidation list | `js/background.js:4458-4495` | Invalidates both `main` and `kids` caches only for a smaller relevant-key list. | Omits several keys the compiler reads/emits, including `enabled`, `categoryFilters`, `hideAllComments`, many watch/end-screen booleans, `showQuickBlockButton`, `showBlockMenuItem`, `videoChannelMap`, and `videoMetaMap`. This can produce stale behavior or stale payloads. | `REWRITE` |
| Content storage refresh list | `js/content/bridge_settings.js:547-603` | Watches a wider list than background, including `enabled`, map keys, watch/sidebar/end-screen flags, quick-block/menu flags, and media maps. | Content can request a forced refresh for keys that background itself would not invalidate. This hides some stale-cache risk only when content is alive and the request path succeeds. | `REWRITE` shared schema |
| Map-only update exception | `js/content/bridge_settings.js:550-556`, `js/content/bridge_settings.js:601-603` | Ignores `channelMap`-only changes, but refreshes on `videoChannelMap` or `videoMetaMap` without force reprocess. | Reasonable performance intent, but it is a bespoke local policy separate from the compiler dependency list. Map changes can affect identity decisions even if no DOM reprocess is requested. | `INSTRUMENT` |
| Compile-time V4 migration write | `js/background.js:1962-2080` | `getCompiledSettings()` builds missing V4 state and writes it through `browserAPI.storage.local.set`. | A read/compile path mutates storage, which can trigger storage listeners and create startup churn on fresh installs/migrations. | `REWRITE` explicit migration |
| Compile-time channel-keyword repair write | `js/background.js:2330-2397` | Channel `filterAll` derived keywords can be persisted while compiling. | A derived runtime repair becomes a storage mutation. This complicates "what rule did the user create?" and can wake listeners during page load. | `REWRITE` explicit repair |
| UI push compiled settings | `js/state_manager.js:1057-1059`, `js/state_manager.js:1209-1215`, `js/background.js:4381-4396` | UI can send `FilterTube_ApplySettings`; background trusts the supplied settings and puts them into `compiledSettingsCache`. | Background is no longer the only compiler. A UI-side stale/partial payload can replace cache and broadcast to tabs. | `GATE` |
| Content profile mismatch retry | `js/content/bridge_settings.js:283-315`, `js/content/bridge_settings.js:390-456` | Content validates incoming profile and may force a background refetch if profile mismatches. | Good defensive step, but it is downstream. Cache correctness should be solved in background, not repaired per content host. | `KEEP` + background fix |

### Background Cache Writer Ledger - Deep Pass

`compiledSettingsCache` is currently written by multiple classes of code: the compiler, the message handler, UI-pushed payloads, and map-harvesting queues. That makes it hard to prove that content always receives the exact background-compiled state for the current profile.

| Writer or mutator | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Compiler cache write | `js/background.js:2059-1781`, `js/background.js:2553-2558` | `getCompiledSettings()` returns cache unless forced, and writes compiled settings after a storage read. | Correct only if invalidation exactly matches all compiler dependencies. | `KEEP` + schema |
| Message handler cache hit/write | `js/background.js:3242-3259` | `getCompiledSettings` message can return existing cache or write compiler result back into the same cache. | Duplicates cache authority but still uses background compiler. | `KEEP` |
| UI pushed cache overwrite | `js/background.js:4381-4396` | `FilterTube_ApplySettings` accepts `request.settings`, writes it directly to `compiledSettingsCache[targetProfile]`, and broadcasts it to matching tabs. | This bypasses background compilation and can install a mode-blind, stale, or partial UI-compiled payload. | `REWRITE` |
| Channel map in-place mutation | `js/background.js:1495-1512` | `enqueueChannelMapUpdate()` mutates `channelMapCache`, then attaches that object to cached Main/Kids settings if present. | Persistent map repair is useful, but mutating cached runtime objects bypasses normal compile/invalidation semantics. | `INSTRUMENT` |
| Video-channel map cache mutation | `js/background.js:1933-1670` | `enqueueVideoChannelMapUpdate()` updates pending map writes and copies the new mapping into cached Main/Kids settings. | Can change filtering identity without a full compile. Needs source/freshness/provenance. | `KEEP` + provenance |
| Video-meta map cache mutation | `js/background.js:1958-1712` | `enqueueVideoMetaMapUpdate()` may mutate `videoMetaMapCache`, then points cached Main/Kids settings at that cache. | Category/duration/upload filters can observe metadata changes through cache mutation instead of compile. | `INSTRUMENT` |
| Storage flush side effect | `js/background.js:1594-1605`, `js/background.js:1610-1627` | Pending video maps/meta maps are flushed to storage after short timers. | Storage write can wake content listeners even when maps came from passive prefetch. | `GATE` by active reason |
| Background map actions | `js/background.js:4397-4422` | `updateChannelMap`, `updateVideoChannelMap`, and `updateVideoMetaMap` enqueue persistent map mutations from runtime messages. | These actions have no per-sender schema in this branch and can alter future identity decisions. | `GATE` source/provenance |

Cache authority invariant:

```text
compiledSettingsCache may only contain:
  - output of background getCompiledSettings(), or
  - output of a typed background map-overlay function that records provenance and active reason.

It must not contain:
  - UI-compiled payloads,
  - partial payloads,
  - payloads without listMode/profileType,
  - payloads produced before the user's current list-mode transition completes.
```

### Background Invalidation Gap Ledger

The compiler reads and emits more runtime controls than the background storage listener invalidates.

| Key class | Compiler proof | Background invalidation proof | Current gap | Risk | Verdict |
| --- | --- | --- | --- | --- | --- |
| Master enabled flag | `js/background.js:1784-1785`, `js/background.js:2474-2475` | Listener keys `js/background.js:4461-4476` omit `enabled`. | Cache can stay enabled/disabled incorrectly until forced refresh. | Empty-install and disabled-state mismatch. | `FIX` |
| Category filters | `js/background.js:2544-2551` | Listener keys omit `categoryFilters`. | Background cache may not invalidate after legacy/top-level category write. | Stale category allow/block behavior. | `FIX` |
| Watch/sidebar/end-screen controls | `js/background.js:2479-2506` | Listener keys include only a subset: `hideMembersOnly`, `hideAllShorts`, `hideComments`, `filterComments`, `hideHomeFeed`, `hideSponsoredCards`. | Missing `hideWatchPlaylistPanel`, `hidePlaylistCards`, `hideMixPlaylists`, `hideVideoSidebar`, `hideRecommended`, `hideLiveChat`, watch metadata controls, `hideEndscreenVideowall`, `hideEndscreenCards`, and more. | UI toggles can rely on content force refresh or stale cache can persist. | `FIX` |
| Affordance flags | `js/background.js:2504-2505` | Listener keys omit `showQuickBlockButton` and `showBlockMenuItem`. | Background may keep old affordance flags. | Quick-block/menu lifecycle cannot be proven from cache. | `FIX` |
| Derived identity/media maps | `js/background.js:1822-1824`, `js/background.js:2409-2425` | Listener keys omit `channelMap`, `videoChannelMap`, and `videoMetaMap`. | Cache does not invalidate on storage map changes; separate queue mutates cached objects in some paths. | Map authority and staleness become implicit. | `REWRITE` policy |
| Content listener broader than background | `js/content/bridge_settings.js:547-603` | Content watches `enabled`, `videoChannelMap`, `videoMetaMap`, many booleans, quick-block/menu flags. | Content can request forced refresh for keys background would not independently invalidate. | Correctness depends on content being present and asking with `forceRefresh`. | `REWRITE` shared key schema |

Concrete invariant:

```text
compilerDependencyKeys === cacheInvalidationKeys
contentRefreshKeys derive from compilerDependencyKeys plus:
  - per-key reprocess policy,
  - map-only cheap-refresh policy,
  - UI-affordance lifecycle policy.
```

### Passive Map Learning And DOM Reprocess Ledger

Identity and metadata learning is valuable, but it is currently mixed with filter enforcement. A passive scroll, JSON harvest, or card stamp can mutate maps, mutate the active settings object, write storage, and schedule DOM filtering. That is one root reason an empty blocklist or newly installed extension can still feel active.

| Path | Proof | Current behavior | Disease-level risk | Verdict |
| --- | --- | --- | --- | --- |
| Prefetch observer attach | `js/content_bridge.js:974-1031` | Creates an `IntersectionObserver`, observes up to 120 cards per scan, and wakes on `visibilitychange`. | Runs as identity infrastructure, not only when active rules need channel identity. This is a likely empty-install cost center. | `GATE` by active identity need |
| Playlist panel prefetch hook | `js/content_bridge.js:1038-1079` | Adds a captured scroll listener and a playlist `MutationObserver`, then schedules prefetch scans. | Watch playlist surfaces can keep observer work alive even before any matching rule exists. | `GATE` by route + rule |
| Right-rail whitelist observer | `js/content_bridge.js:1082-1142` | Installs a rail observer once, then schedules two forced DOM fallback passes in whitelist mode outside `/watch`. | Correctness repair for whitelist hydration, but it is another mode-specific observer outside the central DOM scheduler. | `MERGE` into scheduler |
| Card identity stamp side effect | `js/content_bridge.js:1311-1331` | `stampChannelIdentity()` writes `data-filtertube-channel-*` attributes and schedules `applyDOMFallback(null)` after 120ms. | Merely learning identity triggers filtering. Needed for active channel rules, unnecessary for empty/no channel-rule states. | `GATE` by channel-rule need |
| Content video map persistence | `js/content_bridge.js:1465-1486` | `persistVideoChannelMapping()` mutates `currentSettings.videoChannelMap` and sends `updateVideoChannelMap`. | The content runtime settings object changes outside a background-compiled payload. This blurs current state versus learned cache overlay. | `SEPARATE` learned maps |
| Content video meta persistence | `js/content_bridge.js:1465-1536` | `persistVideoMetaMapping()` mutates `currentSettings.videoMetaMap`, enforces a local cap, and sends `updateVideoMetaMap`. | Metadata cache learning can alter duration/category/date decisions without a fresh authoritative settings payload. | `SEPARATE` learned maps |
| Metadata DOM touch | `js/content_bridge.js:1527-1611` | Video-meta updates remove processed/duration attributes from cards, then later rerun DOM fallback. | Good targeted invalidation, but currently not tied to "duration/date/category filters are active for this route". | `GATE` by metadata filter need |
| Watch meta fetch queue | `js/content_bridge.js:1621-1713`, `js/content_bridge.js:1716-1807` | Queues up to 3 watch-page HTML fetches, stores metadata, touches DOM, and reruns fallback. | Fetching watch pages can look like engagement-adjacent traffic and costs network/CPU. It must be impossible when no metadata filter needs it. | `REWRITE` fetch budget |
| Main-world video map update | `js/content_bridge.js:5482-5530` | On `FilterTube_UpdateVideoChannelMap`, persists mapping, stamps matching DOM cards, and schedules fallback. | JSON harvest can cause isolated-world DOM filtering as a side effect. Correct for active channel rules, too broad otherwise. | `GATE` by active identity need |
| Main-world video meta update | `js/content_bridge.js:5531-5556` | On `FilterTube_UpdateVideoMetaMap`, persists metadata, touches cards, and schedules a meta rerun. | Metadata harvest can wake DOM filtering on every page where cards exist, unless centrally gated by active metadata rules. | `GATE` by active metadata need |
| Custom URL map direct storage write | `js/content_bridge.js:5557-5568` | Reads/writes `channelMap` directly from content bridge instead of routing through background map action. | Bypasses the background action schema and provenance ledger. | `ROUTE` through background |
| Background map cache mutation | `js/background.js:1495-1512`, `js/background.js:1933-1670`, `js/background.js:1958-1712` | Updates persistent queues and mutates cached compiled settings maps. | Passive learning mutates the runtime payload cache instead of producing an explicit map-overlay event. | `REWRITE` overlay layer |

Required separation:

```text
learnedIdentityStore:
  may harvest and persist channel/video/meta facts with source + timestamp.

filterRuntimeState:
  may consume learned facts only when hasActiveEnforcement(settings).needsIdentity === true
  or hasActiveEnforcement(settings).needsVideoMeta === true.

DOM reprocess:
  may run after a learned fact only when that learned fact can change a currently active decision.
```

### Small Content Bootstrap And Settings Delivery Ledger - 2

This pass covers the smaller content-script files that can still affect lifecycle, settings delivery, or user-visible overlays: `js/content/bridge_injection.js`, `js/content/bridge_settings.js`, `js/content/menu.js`, `js/content/first_run_prompt.js`, and `js/content/release_notes_prompt.js`.

| File / block | Proof | Current behavior | Disease risk | Required invariant |
| --- | --- | --- | --- | --- |
| Main-world injection bridge | `js/content/bridge_injection.js:75-120` | Injects `shared/identity`, `filter_logic`, Firefox `seed`, and `injector`, then calls `requestSettingsFromBackground()` after 100ms. | Correct boot sequence, but it guarantees a settings request and MAIN-world injector path even before proving active enforcement. | Injection is acceptable; expensive runtime work after injection must be gated by active-state report. |
| Background script injection action | `js/content/bridge_injection.js:36-48`, background action `js/background.js:3242-3265` | Isolated content asks background to inject a script list. | Content passes a fixed list here, but background action itself accepts request-shaped lists. | Background must enforce a static allowlist independent of caller payload. |
| Fallback script tag injection | `js/content/bridge_injection.js:51-72` | Appends script tags into page DOM with 50ms spacing. | Needed for fallback/Firefox paths, but page-DOM script injection makes MAIN-world trust boundaries important. | Every MAIN-world message/settings path needs source + payload authentication, not only string labels. |
| Runtime `FilterTube_RefreshNow` | `js/content/bridge_settings.js:223-230` | Fetches compiled settings, then immediately calls `applyDOMFallback(..., {forceReprocess:true})`. | Any refresh action wakes DOM fallback. If background sends refresh after storage-map/import churn, the content page can re-scan even if the active report did not change. | Refresh must carry reason and active-work diff; no-op revisions should not force reprocess. |
| Runtime pushed settings | `js/content/bridge_settings.js:283-315` | Accepts `FilterTube_ApplySettings`, checks profile mismatch, normalizes, sends to MAIN world, then force-runs DOM fallback. | Downstream repair for profile mismatch is good, but content still trusts pushed settings enough to run. This depends on background sender/schema correctness. | Content should accept only background-compiled settings with revision/profile/surface; UI-pushed partial settings should be rejected upstream. |
| Kids host normalization | `js/content/bridge_settings.js:322-351`, receive path `js/content/bridge_settings.js:456-458`. | If on YouTube Kids and incoming settings are non-Kids empty whitelist, forces `listMode:"blocklist"` fail-open. | Good defensive patch against catastrophic Kids blanking, but it is host-local behavior that can disagree with background/runtime truth. | Compile profile selection must prevent wrong-profile delivery; content should not need to rewrite list mode except as a logged emergency guard. |
| Settings delivery to MAIN world | `js/content/bridge_settings.js:501-514` | Sets `latestSettings/currentSettings`, posts `FilterTube_SettingsToInjector` to `window`, then tries `window.filterTube.updateSettings()`, retrying every 250ms if missing. | `window.postMessage` and page-visible `window.filterTube` remain implicit trust boundaries. Retry loop can continue until seed appears. | One authenticated bridge channel with bounded retries and revision id; page scripts must not be able to spoof settings. |
| Seed retry loop | `js/content/bridge_settings.js:481-499`, `js/content/bridge_settings.js:510-514`. | Adds `filterTubeSeedReady` listener and recursively schedules 250ms retries while `pendingSeedSettings` exists. | Usually short-lived, but if seed never exposes `window.filterTube`, this can run indefinitely. | Retry count/time budget plus terminal log; no infinite retry on inactive surfaces. |
| Storage refresh key list | `js/content/bridge_settings.js:547-604`. | Watches a wide set of keys; ignores `channelMap`-only; video map/meta-only refreshes without force reprocess. | Better than background invalidation list, but still hand-maintained. Can request forced background refresh for keys background cache did not invalidate. | Generate content refresh keys from compiler dependency schema and per-key reprocess policy. |
| Subscription import MAIN-world bridge | Request `js/content/bridge_settings.js:104-143`; listener `js/content/bridge_settings.js:146-196`; runtime action `js/content/bridge_settings.js:231-282`. | Sends `FilterTube_RequestSubscriptionImport` to MAIN world and resolves responses/progress by request id. | User-initiated import path, but it uses `window.postMessage` and long timeout/page delays. Must never run as passive runtime work. | Only trusted UI action may start import; request id and sender tab must be logged through background. |
| First-run prompt | `js/content/first_run_prompt.js:177-186`, `js/content/first_run_prompt.js:39-170`. | Asks background if needed and renders a fixed overlay with reload/dismiss. | Low performance risk. It is a content overlay on YouTube and should not appear during playback/fullscreen/native app shells. | Keep one-time, background-gated, and suppress during fullscreen/player/native overlay contexts. |
| Release-notes prompt | Check `js/content/release_notes_prompt.js:237-246`, render `js/content/release_notes_prompt.js:87-231`, ack/open actions `js/content/release_notes_prompt.js:70-81`, `162-175`. | Background decides if prompt is needed; content renders fixed overlay and delegates What’s New open to background. | Low filtering risk, but content-page overlay can still interfere with first paint or fullscreen if shown at the wrong moment. | Prompt display should be idle/fullscreen-aware and never install observers/scanners. |
| Menu style helper | `js/content/menu.js:23-309`. | Injects style rules for FilterTube menu rows and status states. | No scans by itself. Risk is semantic drift: green `filtertube-blocked` styling means "blocked" today, but future dual allow/block UI needs distinct `blocked`/`allowed` language. | Style classes must map to explicit action/state names before dual-list UI ships. |

### Shared Settings Compiler Drift Ledger

The UI/shared settings path is not only a storage helper; it builds compiled settings and can return/persist a payload that competes with the background compiler. This is a prime candidate for "the UI says one thing, runtime does another".

| Path | Proof | Behavior | Disease-level risk | Verdict |
| --- | --- | --- | --- | --- |
| Shared V4 Main list read | `js/settings_shared.js:573-579` | If V4 exists, loads `activeProfile.main.keywords` and `activeProfile.main.channels`. | Background compiler now uses canonical Main keyword/channel rows before `blockedKeywords`/`blockedChannels` aliases (`js/background.js:2057-2076`, `js/background.js:2213-2226`). Alias import/direct-write conflict policy is still not centralized. | `REWRITE` single V4 accessor |
| Shared compiler payload omits mode/allow lists | `js/settings_shared.js:484-561` | Emits blocklist compiled values and booleans, but no `listMode`, `profileType`, `whitelistChannels`, `whitelistKeywords`, maps, or active-enforcement report. | A `compiledSettings` produced by this path is not equivalent to background `getCompiledSettings()`, yet StateManager can broadcast compiled settings to content. | `REWRITE` payload authority |
| Shared load mutates profile defaults | `js/settings_shared.js:647-685` | `loadSettings()` can write missing V4 profile settings while reading. | UI load can trigger storage listeners and compile refreshes, causing avoidable startup churn and making read paths impure. | `REWRITE` explicit repair |
| Shared save V4 Main write | `js/settings_shared.js:918-926` | Saves sanitized channels/keywords into `activeProfile.main.channels` and `activeProfile.main.keywords`, and mirrors `blockedChannels` / `blockedKeywords` when Main is in blocklist mode. | Normal settings saves now keep Main blocklist aliases aligned, but the schema still needs one direct-write/import authority. | `REWRITE` single schema |
| Shared save V4 Kids write | `js/settings_shared.js:927-933` | Preserves Kids mode/strictMode and writes blocked lists, but does not write Kids whitelist lists in this branch. | A generic settings save can preserve or omit fields depending on branch, so Kids allow/block parity depends on caller path. | `INSTRUMENT` + fixture |
| Shared legacy fallback save | `js/settings_shared.js:950-1069` | When V4 is absent, builds compiled settings, writes legacy keys, and builds V4 from legacy state. | Comment notes category filters cannot be reliably preserved; migration can silently alter runtime filter shape. | `REWRITE` migration fixture |
| StateManager setting key list | `js/state_manager.js:1998-2108` | Allows many toggle writes and then calls `saveSettings()`. | User toggles can flow through shared compiler and background compiler with different payload schemas. | `GATE` through canonical mutation API |
| StateManager content/category refresh | `js/state_manager.js:2115-2217` | Updates content/category filters, calls `saveSettings()`, then `requestRefresh(profile)`. | Correctly forces background refresh, but this is a per-method repair. The underlying storage/listener schema still differs across background/content/UI. | `KEEP` + shared schema |
| StateManager storage listener | `js/state_manager.js:2334-2407` | Reloads UI on many keys but omits `contentFilters`, `categoryFilters`, `videoChannelMap`, and `videoMetaMap` top-level changes. | UI can miss legacy/top-level filter changes while content runtime sees them. V4 changes usually cover current UI, but legacy imports/repairs can still drift. | `REWRITE` key contract |

Peer-review additions from the follow-up pass:

| Addition | Proof | Risk | Required invariant |
| --- | --- | --- | --- |
| Shared compiled payload can be mode-blind | `js/settings_shared.js:524-561`, `js/state_manager.js:1057-1059`, `js/background.js:1990-2011`, `js/background.js:2211` | A UI save can broadcast a payload without `listMode`, `profileType`, `whitelistChannels`, or `whitelistKeywords`, while background compiled settings include those fields. | Runtime broadcasts must be background-compiled or include the full profile/list-mode contract. |
| Normal and managed list-mode transitions diverge | `js/tab-view.js:10574-10597`, `js/tab-view.js:4273`, `js/background.js:3443-3445` | Managed child edit path handles copy/empty whitelist locally, while normal path uses background behavior. | One list-mode transition function for popup, tab-view, managed child, import, and Nanah. |
| Content/category saves can double-broadcast | `js/state_manager.js:2131-2132`, `js/state_manager.js:2184-2185` | Main filter edits save and local-broadcast, then request a background force refresh and broadcast again. | One user edit should produce one authoritative runtime payload. |
| Enabled filter state can be incomplete | `js/tab-view.js:1072-1121`, `js/tab-view.js:2180-2223`, `js/popup.js:486-497` | Duration/upload/category controls can preserve stale thresholds or enable empty predicates. | Enabled filter must serialize a complete valid predicate or be rejected/disabled. |

Required invariant before source edits:

```text
compiled settings contract:
  dependencyKeys = every storage key read by compiler
  emittedKeys = every key delivered to seed/dom/menu/native runtime
  invalidationKeys = dependencyKeys plus derived-map keys with route policy
  contentRefreshKeys = same schema, with per-key reprocess policy
  compilePurity = no storage writes inside getCompiledSettings()
  cacheAuthority = only background compiler writes compiledSettingsCache
```

Failure mode relevant to user reports:

```text
UI/storage change
  -> background misses invalidation for that key
  -> getCompiledSettings returns old cached payload
  -> content receives/applyDOMFallback runs stale runtime state
  -> cards can be hidden/restored according to previous rules

Fresh install or migration
  -> content requests compiled settings
  -> compiler writes migration/repair storage
  -> storage listeners wake background/content again
  -> no-rule install still performs avoidable work
```

Required transition report for every import/sync path:

```text
before: {
  mainMode, mainBlockCounts, mainAllowCounts,
  kidsMode, kidsBlockCounts, kidsAllowCounts
}
incoming: {
  scope, strategy, profileId,
  mainMode, mainBlockCounts, mainAllowCounts,
  kidsMode, kidsBlockCounts, kidsAllowCounts
}
after: same shape as before
warnings: [
  "main whitelist has zero allow rules",
  "kids whitelist has zero allow rules",
  "mode changed by import/sync",
  "content/category filters omitted from legacy envelope"
]
```

This makes imported false-hiding distinguishable from runtime false-hiding.

### Security, PIN, And Parent-Control Gate Initial Map

The lock layer is part of the filtering correctness model because it decides who can change modes, lists, content filters, Kids access, and backup/import behavior.

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| PIN verifier implementation | `js/security_manager.js:97-123` | Creates and verifies PBKDF2/SHA-256 PIN verifiers with per-verifier salt. | Crypto helper is focused and local. Needs timing-safe compare consideration later, but no filtering state mutation here. | `KEEP` |
| Encrypted backup helper | `js/security_manager.js:125-190` | AES-GCM encrypted JSON using PBKDF2-derived key. | Correct scope; backup import/export must still report mode/list transitions separately. | `KEEP` |
| Shared UI lock predicate | `js/state_manager.js:15-23` | StateManager delegates to `window.FilterTubeIsUiLocked()` when present. | Good central choke point, but only works if each UI shell installs the function before mutation handlers run. | `INSTRUMENT` |
| Popup lock gate | `js/popup.js:1265-1313` | Child profiles or locked profiles block popup content and call `updateCheckboxes()`. | Popup blocks direct UI edits; content-script runtime still depends on compiled active profile state. | `KEEP` + test |
| Dashboard lock predicate | `js/tab-view.js:4585-4592` | Treats child profile as locked for setting mutation; PIN-locked profiles are locked until unlocked. | Good mutation gate. Must be kept consistent with popup copy. | `CONSOLIDATE` |
| Dashboard lock gate | `js/tab-view.js:5055-5120` | Shows unlock gate for PIN lock and exposes `FilterTubeIsUiLocked`. | The visual gate only checks PIN lock at `js/tab-view.js:5057`, while `isUiLocked()` also treats child profiles as locked. Navigation restrictions handle child profiles separately at `js/tab-view.js:4517-4525`. This split needs tests. | `INSTRUMENT` |
| Profile unlock flow | `js/tab-view.js:8357-8390` | Prompts for PIN, verifies locally, stores unlocked profile id in memory, then notifies background. | In-memory unlock is expected. Background session cache is used for encrypted auto-backups. | `KEEP` + test |
| Background session PIN cache | `js/background.js:647-678` | Verifies PIN against V4 profile and caches the submitted PIN in memory. | Necessary for encrypted auto-backup at `js/background.js:819-828`, but must never be persisted or sent to content pages. | `KEEP` + audit |
| Viewing-space access | `js/tab-view.js:4085-4090`, `js/tab-view.js:4534-4583` | Profiles can allow/block Main or Kids viewing, requiring at least one viewing space. | This is native/app-like product behavior inside extension UI; runtime compile must not ignore it on app handoff. | `INSTRUMENT` |
| Child management boundary | `js/tab-view.js:4101-4108`, `js/tab-view.js:4261-4264`, `js/tab-view.js:8699-8680` | Default or parent account can edit a child profile without switching into it. | Correct product direction, but child edit writes must use the same schema validation as active profile writes. | `CONSOLIDATE` |

Security-state invariant:

```text
Any method that changes filtering state must pass through one of:
  StateManager mutation API -> isUiLocked()
  saveManagedChildSurface() -> canActiveProfileManageProfile()
  background trusted UI sender + explicit profile transition validator
  IO/Nanah import -> preview/transition report + admin unlock for destructive apply
```

Open proof gap: direct IO manager writes and some Nanah apply paths operate outside `StateManager.updateSetting()`. They need a caller-side admin/preview contract, not just storage-level validation.

## Subsystem B - Main-World JSON And XHR Engine

### Current Flow

```text
seed.js document_start
  -> read inline ytInitialData / ytInitialPlayerResponse
  -> wrap fetch and XHR for youtubei endpoints
  -> clone + parse response JSON
  -> FilterTubeEngine.harvestOnly() or processData()
  -> JSON.stringify(modified data)
  -> YouTube renders filtered response
```

### Verified Risks

| Area | Proof | Verdict | Reason |
| --- | --- | --- | --- |
| Fetch/XHR response parsing | `js/seed.js:633-680`, `js/seed.js:748-785` | `REWRITE` | No-rule paths should avoid clone/parse/stringify whenever no harvesting or enforcement is needed. |
| Endpoint skip logic | `js/seed.js:214-223` | `KEEP` + `INSTRUMENT` | Good direction, but route predicates are still incomplete and category enabled is too broad. |
| Renderer recursion | `js/filter_logic.js:2139`, `js/filter_logic.js:2524`, `js/filter_logic.js:2715` | `INSTRUMENT` | Recursive traversal is flexible but allocates and can over-process large watch/player payloads. |
| End-screen renderer support | `js/filter_logic.js:435`, `js/content_bridge.js:8465` | `KEEP` + `REWRITE` | JSON path exists, but must be first-class in coverage tests and docs. |
| Playlist renderer gaps | `docs/json_paths_encyclopedia.md:930`, `docs/json_paths_encyclopedia.md:4813` | `REWRITE` | `compactPlaylistRenderer` paths are documented but not first-class filtered by owner/channel. |
| Search refinement/channel gaps | `docs/youtube_renderer_inventory.md:438`, `docs/json_paths_encyclopedia.md:2715-2726` | `REWRITE` | `searchRefinementCardRenderer` and `compactChannelRenderer` need explicit contracts. |
| Active Shorts overlay | `docs/json_paths_encyclopedia.md:2194-2196` | `REWRITE` | `reelPlayerOverlayRenderer` must be included in route-specific Shorts handling. |
| Kids owner identity | `docs/json_paths_encyclopedia.md` Kids paths plus runtime extraction | `INSTRUMENT` | Kids external channel IDs must be UC-backed before whitelist/block decisions. |

### Seed Startup, Replay, And No-Op Replacement

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Idempotent boot | `js/seed.js:7-18` | Prevents duplicate seed initialization in the same page world. | Correct base guard; does not reduce first-run interception cost. | `KEEP` |
| Snapshot stash | `js/seed.js:43-95` | Stores recent search/browse/next/player JSON snapshots on `window.filterTube`. | Useful for JSON-first identity, but can retain large response objects; needs bounded memory metric. | `INSTRUMENT` |
| Pending queue before settings | `js/seed.js:100-134`, `js/seed.js:353-356`, `js/seed.js:922-930` | Queues early data until settings/engine are ready, clones queued data, and replays processing. | Correct for early page loads, but needs route/size/timing metrics because YouTube startup is already busy. | `INSTRUMENT` |
| `structuredClone` / JSON clone | `js/seed.js:180-195` | Clones pending/raw data before processing or replay. | Correctness-safe, but heavy on large YouTube responses; should not run in no-op mode unless mutation is expected. | `GATE` |
| Active skip predicate | `js/seed.js:197-223` | Computes active rules for JSON processing; treats category enabled as active. | Current proof of enabled-empty category bug; no central active-report object is returned. | `REWRITE` |
| Engine disabled path | `js/filter_logic.js:3434-3452` | `processData()` harvests channel data before checking `settings.enabled === false`. | Disabled mode still does metadata traversal. This may be intentional for menus, but it violates a strict quiet-mode mental model. | `GATE` harvest by affordance |
| Fetch no-op replacement | `js/seed.js:633-680` | For matching YouTube API fetches, clones JSON, calls `processWithEngine()`, and returns a new `Response(JSON.stringify(processed))`. | If filtering is disabled or no rules are active, response replacement can still occur even when data is unchanged. | `REWRITE` |
| XHR no-op replacement | `js/seed.js:748-785` | Disabled mode returns before parsing; otherwise parses and stores modified response text after `processWithEngine()`. | Empty blocklist can still rewrite response text if processing returns the same object. | `REWRITE` |
| Skip-processing harvest-only | `js/seed.js:364-382` | In selected search/home/channel cases, skips filtering but runs `harvestOnly()` and stashes network snapshot. | Good for mapping, but should require active menu/identity need, not just passive empty browsing. | `GATE` |
| Settings update replay | `js/seed.js:902-970` | Applies new settings, processes queued data, then reprocesses stored raw `ytInitialData` and `ytInitialPlayerResponse` snapshots. | A profile/import/sync change can trigger heavy JSON traversal on already-loaded pages. Needs timing and mutation/no-op reporting. | `INSTRUMENT` |
| Global seed interface | `js/seed.js:976-999` | Exposes settings, last/raw snapshots, update hook, and stats on `window.filterTube`. | Useful bridge surface; must remain internal and should expose audit counters for parse/stringify/no-op replacement. | `KEEP` + `INSTRUMENT` |
| Mandatory hook install | `js/seed.js:1005-1011` | Always establishes data hooks, fetch interception, and XHR interception. | Correct for zero-flash filtering, but this is the earliest disease source if no-op mode cannot exit before clone/parse/stringify. | `REWRITE` fast no-op |

Target network response contract:

```text
processWithEngine(data, route) -> {
  data,
  mutated: boolean,
  harvested: boolean,
  blockedCount: number,
  reason: string[]
}

if mutated === false:
  return original Response/XHR payload
```

This would let FilterTube keep JSON-first precision while proving that a no-rule install is not rewriting YouTube's network responses.

### JSON/XHR Cold-Load And Response Delivery Risk

Subagent critique confirmed a higher-priority JSON disease: early filtering can fail open before the full engine/settings path is ready, and replay cannot repair data that has already been delivered to YouTube.

Proof:

- Manifest injects only `js/seed.js` in the MAIN world at document start (`manifest.json:31-35`).
- `bridge_injection` injects `shared/identity`, `filter_logic`, and `injector` later via scripting/fallback (`js/content/bridge_injection.js:83-95`).
- If settings are missing, `processWithEngine()` queues the data but returns the original object immediately (`js/seed.js:342-356`).
- If `FilterTubeEngine` is missing, it queues for later and returns original data (`js/seed.js:427-431`).
- Fetch interception returns a `Response` to YouTube from the immediate `processWithEngine()` result (`js/seed.js:633-680`).
- XHR installs processing listeners during `send()` and modifies instance getters only after ready-state/load processing (`js/seed.js:748-823`, `js/seed.js:864-882`).
- Settings update replay reprocesses queued/global snapshots (`js/seed.js:921-970`), but that does not retroactively replace a fetch/XHR payload already consumed by YouTube.

Cold-load invariant:

```text
For each critical endpoint:
  ytInitialData
  ytInitialPlayerResponse
  /youtubei/v1/browse
  /youtubei/v1/next
  /youtubei/v1/search

If active filtering rules exist:
  data must not be delivered unfiltered merely because settings or engine are still loading.
```

This does not mean "block page load forever." It means the startup path needs an explicit state:

```text
startupState:
  settingsReady
  engineReady
  hasActiveRules
  endpointCriticality
  decision: passThrough | holdBriefly | filter | harvestOnly
```

The max hold budget must be small and measured. For empty/no-rule installs, the decision should be `passThrough` before clone/parse/stringify. For active rules, the decision should not silently fail open.

### XHR Equivalence Risk

The fetch path and XHR path are not proven equivalent.

```text
fetch:
  originalFetch -> clone().json() -> processWithEngine -> new Response(JSON)

XHR:
  open marks endpoint
  send installs internal listeners
  ready/load calls ensureXhrResponseProcessed
  instance response/responseText getters return modified data
```

Required tests:

- Page uses `xhr.onreadystatechange = fn` before `send()`.
- Page uses `xhr.addEventListener('readystatechange', fn)` before and after `send()`.
- Page uses `load` listener.
- `responseType === ''`, `text`, and `json`.
- Settings missing at first response, then settings arrive.
- Engine missing at first response, then engine arrives.

Pass condition: every consumer sees the same hide/pass decision as fetch, or the XHR path is explicitly declared harvest-only/no-filter for that scenario.

### Category And Video-Metadata Classification Risk

Category filtering is currently a metadata-dependent rule that can wake work before it can enforce reliably.

Proof:

- Seed active-rule detection treats `categoryFilters.enabled === true` as active (`js/seed.js:214-223`).
- JSON category filtering only acts when a selected category list is non-empty (`js/filter_logic.js:2130-2133`) and when `videoMetaMap[videoId].category` is already known (`js/filter_logic.js:2162-2181`).
- If category is missing, JSON filtering attempts `scheduleVideoMetaFetch(videoId, { needCategory: true })` (`js/filter_logic.js:2165-2172`).
- `scheduleVideoMetaFetch()` is defined in `js/content_bridge.js`, not `js/filter_logic.js` (`js/content_bridge.js:1621-1632`). Since `filter_logic` is injected into the MAIN world by `bridge_injection` (`js/content/bridge_injection.js:83-95`), that function is not guaranteed to exist in the same world.
- `/player` metadata documents the currently playing or hovered video, not feed-wide categories (`docs/json_paths_encyclopedia.md:3247-3267`).
- Player harvest can register category when `/player` data exists (`js/filter_logic.js:1174-1237`) and queues a bridge update via `postMessage` (`js/filter_logic.js:82-140`).

Risk:

```text
category enabled
  -> seed treats JSON filtering as active
  -> feed/search/watch-next item lacks cached category
  -> _checkCategoryFilters returns false
  -> bridge may later fetch/store metadata
  -> card already rendered unfiltered
```

This is acceptable only if category filtering is documented as best-effort after metadata is known. If it is sold as deterministic filtering, it needs a pending-classification policy:

```text
category rule policy:
  block mode + unknown category -> allow pending? hide pending? mark pending?
  allow mode + unknown category -> allow pending? hide pending? mark pending?
  metadata fetch budget per route
  reprocess trigger when videoMetaMap fills
```

Until this is explicit, category filters are a correctness and performance risk: they make an empty/unknown metadata state look active to the runtime while not necessarily blocking anything.

JSON-first target:

```text
Route classifier
  -> endpoint classifier
  -> renderer-specific extractor
  -> identity confidence
  -> rule decision
  -> mutation only if decision is hide
  -> metrics: scanned, mutated, unresolved, elapsedMs, bytes
```

This is the direction that reduces DOM dependence. It also makes false hides easier to prove because every hide can carry renderer name, identity source, rule source, and confidence.

### JSON Decision Function Findings

`js/filter_logic.js:_shouldBlock()` is the core JSON hide decision. It is generally structured in the right order, but it returns only a boolean, so downstream cannot prove why a renderer disappeared without debug logs.

| Decision branch | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Unknown renderer | `js/filter_logic.js:1837-1844` | Returns false unless debug logs unknown renderer. | Good fail-open behavior. | `KEEP` |
| Candidate build | `js/filter_logic.js:1846-1855` | Extracts identity only when channel policy exists. | Good optimization direction; must depend on canonical active-state report. | `KEEP` + `INSTRUMENT` |
| VideoId -> channel map | `js/filter_logic.js:1858-1868` | Fills missing Shorts/card channel identity from `videoChannelMap`. | Useful, but map entries lack age/provenance. | `KEEP` + staleness policy |
| Collaboration cache postMessage | `js/filter_logic.js:1895-1909` | Sends collaborator info to bridge when multiple collaborators found. | Good, but message volume should be counted. | `INSTRUMENT` |
| Hide all Shorts | `js/filter_logic.js:1912-1916` | Blocks Shorts renderers before route exceptions. | Correct explicit boolean. | `KEEP` |
| `/feed/channels` exception | `js/filter_logic.js:1918-1922` | Always returns false on subscriptions/channel feed import route. | Protects import flow; should be route-contract tested. | `KEEP` + `TEST` |
| Whitelist empty | `js/filter_logic.js:1933-1967` | Blocks non-container/non-comment renderers when no allow rules exist. | Correct strict whitelist, dangerous if mode entered accidentally through import/sync/migration. | `KEEP` + UX gate |
| Whitelist channel allow | `js/filter_logic.js:1969-1983` | Allows if any collaborator matches allow channel index. | Needs match confidence in return result. | `REWRITE` result object |
| Whitelist keyword allow | `js/filter_logic.js:1986-1999` | Allows if allow keyword regex matches candidate search text. | Good semantics; needs reason payload for fixtures. | `KEEP` + `INSTRUMENT` |
| Creator page whitelist exception | `js/filter_logic.js:2001-2026` | Allows unresolved cards on a whitelisted creator page if page channel matches. | Good leak/overhide tradeoff, but route-specific only. | `KEEP` + fixture |
| Blocklist channel block | `js/filter_logic.js:2038-2053` | Blocks if any collaborator matches block channel index. | Correct for collaborations; needs confidence and no name-only strictness by default. | `REWRITE` confidence |
| Blocklist keyword block | `js/filter_logic.js:2055-2074` | Blocks title/description/metadata/channel text against regexes. | Good; must prove no comments-only regex enters video path unless intended. | `KEEP` + fixture |
| Comment block | `js/filter_logic.js:2076-2107` | Applies hide-all-comments, comment keywords, and comment author channel block. | Correct but route/continuation heavy. | `KEEP` + `INSTRUMENT` |
| Content/category filters | `js/filter_logic.js:2110-2119` | Runs after channel/keyword decisions. Category no-ops if selected empty. | Active predicates earlier do not mirror inner no-op checks. | `REWRITE` active predicates |

Future return shape:

```text
shouldHideCandidate(candidate, settings) -> {
  hide: boolean,
  reason: "keyword" | "channel" | "whitelist-empty" | "whitelist-miss" | "content" | "category" | "shorts" | "comments" | "none",
  rendererType,
  identityConfidence,
  matchedRuleKey,
  matchedTextField,
  source: "json"
}
```

That change is the key to making JSON-first enforcement auditable without relying on after-the-fact DOM inspection.

### JSON Route Contracts To Prove

These are the first route-specific contracts that need tests before implementation cleanup:

| Route/surface | Current proof | Required contract |
| --- | --- | --- |
| Search `/results` | Skip path exists at `js/seed.js:261-270`; documented gaps include `searchRefinementCardRenderer` at `docs/json_paths_encyclopedia.md:2715-2723` and `compactChannelRenderer` at `docs/json_paths_encyclopedia.md:2725-2730`. | Empty blocklist must return original response. Active blocklist must filter `videoRenderer`, `videoWithContextRenderer`, `universalWatchCardRenderer`, `compactChannelRenderer`, and `searchRefinementCardRenderer` with reason logging. |
| Home `/` | Browse-continuation skip exists at `js/seed.js:297-333`; initial home `ytInitialData` is not proven no-op. | Empty blocklist must not full-traverse initial home payload. Active rules filter JSON first; DOM only cleans already-painted cards. |
| Watch `/watch` | Common renderers and `endScreenVideoRenderer` exist in `FILTER_RULES`: `js/filter_logic.js:426-436`; playlist and player metadata are still mixed with DOM guard clicks. | Watch owner, up-next, playlist panel, end-screen, comments, and player overlay must each have separate expected renderer lists and no-op behavior. |
| Shorts `/shorts` | Active overlay path documented at `docs/json_paths_encyclopedia.md:2194-2200`; runtime has `reelPlayerOverlayRenderer` partial handling. | Active Shorts playback and Shorts feed cards must use explicit channel ID paths before DOM/name fallback. |
| Playlist/search playlist cards | `compactPlaylistRenderer` owner paths documented at `docs/json_paths_encyclopedia.md:930-953`; only appears in unwrap preference at `js/filter_logic.js:1615`, not first-class `FILTER_RULES`. | Playlist cards must be filtered by creator channel ID/handle when rules target the owner; hidePlaylistCards should remain a separate content-control toggle. |
| Kids | Kids-specific owner ID paths documented; current direct rule proof still needs expansion. | Kids cards must prefer `kidsVideoOwnerExtension.externalChannelId` before title/name fallback and must keep parent-gate/setup surfaces unfiltered unless explicitly supported. |

### Required Fixture Matrix

The repository currently has strong renderer documentation but no dedicated executable test/fixture harness in the public extension tree (`rg --files | rg "(test|spec|fixtures|__tests__)"` returned no paths). Before rewriting the runtime, the documented JSON paths should become fixtures that prove both correctness and no-op performance.

| Fixture state | Expected behavior |
| --- | --- |
| Empty blocklist | No renderer removed, no replacement JSON response when no harvest is required, no DOM fallback force pass, no identity fetch. |
| Blocklist keyword | Only renderers whose title/description/metadata/comment fields match the keyword are removed; unrelated cards remain. |
| Blocklist channel by UC ID | Only renderers with matching owner/channel UC ID are removed; name-only matches do not hide unrelated same-name channels. |
| Whitelist with allow rule | Only allowed channel/keyword renderers and structural containers remain; non-matching renderers carry `whitelist-miss` reason. |
| Whitelist empty | Non-container renderers are hidden only when the user intentionally selected whitelist; fixture must distinguish intentional mode from migration/import accident. |
| Category enabled with empty selected list | Inactive; no traversal/fetch/removal caused by category filters. |
| Duration/upload enabled with incomplete values | Inactive or validation warning; no broad hidden content. |

Route coverage must include at least:

```text
Home:
  richItemRenderer -> videoRenderer / videoWithContextRenderer / lockupViewModel / shortsLockupViewModel

Search:
  videoRenderer / channelRenderer / compactChannelRenderer / searchRefinementCardRenderer / playlistRenderer / compactPlaylistRenderer

Watch:
  videoPrimaryInfoRenderer / videoSecondaryInfoRenderer / compactVideoRenderer / playlistPanelVideoRenderer / endScreenVideoRenderer / commentThreadRenderer

Shorts:
  shortsLockupViewModel / shortsLockupViewModelV2 / reelItemRenderer / reelPlayerOverlayRenderer

Kids:
  Kids card renderer with externalChannelId / Kids search card / Kids watch-next card / parent-gate/setup payload
```

Fixture target:

```text
processFixture(json, settings, route)
  -> {
       removedRendererPaths: [],
       keptRendererPaths: [],
       reasonsByPath: {},
       metadataWrites: [],
       networkRequests: [],
       elapsedMs,
       replacedResponse: boolean
     }
```

This should become the safety net before pruning DOM fallback or broad observers. The current docs (`docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`) should be treated as fixture source material, not merely reference prose.

### JSON-First Seed And Engine Ledger

This pass audits the exact `seed.js -> FilterTubeEngine -> recursive JSON mutation` path. The goal is not only to find missing renderers, but to prove whether the JSON layer can be a precise, low-cost source of truth.

Current flow:

```text
YouTube JSON source
  -> seed.js hook
     -> parse/clone response
     -> processWithEngine(data, endpointName)
        -> shouldSkipEngineProcessing(data, endpointName)
        -> FilterTubeEngine.processData(data, settings, endpointName)
           -> new YouTubeDataFilter(settings)
           -> harvest channel/video/meta maps
           -> recursive filter(obj)
              -> renderer key discovered by suffix
              -> _shouldBlock(rendererPayload, rendererType)
              -> boolean hide/no-hide
```

Key findings:

| Finding | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Fetch no-rule skip happens after parse | `js/seed.js:633-680`, `js/seed.js:197-333` | Every matching fetch response is cloned and parsed before `shouldSkipEngineProcessing()` can no-op. | Empty blocklist still pays JSON parse/stringify path for `/search`, `/browse`, `/next`, and `/player`. | `REWRITE` active predicate before parse where possible |
| Fetch always returns a replacement response | `js/seed.js:675-680` | Even when `processWithEngine()` returns the original object, fetch returns `new Response(JSON.stringify(processed))`. | Replacement can alter timing/body identity and costs stringify even when no renderer is removed. | `REWRITE` no-op passthrough |
| XHR cold-load differs from fetch | `js/seed.js:748-755`, `js/seed.js:779-784`, compared with `js/seed.js:353-357` | XHR processing exits if `cachedSettings` is missing; fetch calls `processWithEngine()`, which queues when settings are missing. | Early XHR responses can fail open while fetch responses are queued. This creates inconsistent first-paint behavior. | `REWRITE` endpoint startup policy |
| Initial globals are cloned before settings readiness | `js/seed.js:509-517`, `js/seed.js:553-562`, `js/seed.js:180-195` | Existing `ytInitialData` and `ytInitialPlayerResponse` are cloned, then processed/queued. | Large startup payloads can be cloned even before active enforcement is known. | `GATE` by active state and route |
| Settings update reprocesses stored snapshots | `js/seed.js:921-967` | On settings update, queued data and stored initial/player snapshots are cloned and reprocessed. | Correct for live mode changes, but expensive if a UI save broadcasts unchanged or partial settings. | `INSTRUMENT` dirty-key report |
| Settings delivery has overlapping owners | `js/content/bridge_settings.js:501-514`, `js/injector.js:1881-1897`, `js/injector.js:3335-3349`, `js/seed.js:902-969` | Content bridge posts settings to injector and also calls `window.filterTube.updateSettings()` directly; injector then calls the same seed updater. | A single refresh can double-apply settings and reprocess snapshots unless guarded by version/signature. | `REWRITE` single settings delivery owner |
| MAIN-world settings are publicly mutable | `js/seed.js:976-984`, `js/content/bridge_settings.js:468-478`, `js/injector.js:1872-1894` | Seed exposes `window.filterTube.settings` and `window.filterTube.updateSettings()` in MAIN world, while injector accepts payloads whose trust check is a message string source. | A page script can imitate extension-origin settings unless a bridge-authenticated token/schema exists. This is a trust-boundary disease, not just performance. | `REWRITE` authenticated settings channel |
| Pending fetch/XHR replay cannot rewrite returned responses | `js/seed.js:353-357`, `js/seed.js:116-122`, `js/seed.js:928-944` | Missing-settings fetch data is queued but the original response is already returned; replay discards processed fetch/XHR results and only writes queued globals for `ytInitialData` / `ytInitialPlayerResponse`. | The queue is harvest/cache-only for network responses, so cold-load filtering can still miss first paint. | `REWRITE` startup readiness contract |
| No-settings queue has weaker cap | `js/seed.js:342-349`, `js/seed.js:353-356`, `js/seed.js:100-111` | Engine-missing queue is capped; no-settings branch pushes directly and replay can retry many times. | Slow background/settings delivery can grow queue and later replay work on heavy pages. | `GATE` queue cap and telemetry |
| `/player` uses feed-style recursion | `js/seed.js:607-612`, `js/filter_logic.js:1174-1237`, `js/filter_logic.js:3391-3428`, `docs/json_paths_encyclopedia.md:4958-4969` | `/player` is intercepted and sent through recursive filtering, while useful `/player` fields are owner/meta harvest fields. | Player responses should normally harvest metadata, not remove arbitrary renderer-like objects unless a route contract proves it. | `REWRITE` metadata-only endpoint contract |
| Route classification uses document path | `js/seed.js:200-203`, `js/seed.js:261-333` | Skip decisions use `document.location.pathname` plus endpoint name. | SPA navigation and background continuations can make response URL and document route disagree. | `INSTRUMENT` response-route classifier |
| Engine result is boolean-only | `js/filter_logic.js:3411-3416`, `js/filter_logic.js:3434-3464` | Recursive filter drops an object when `_shouldBlock()` returns true; no reason object is retained. | False hides cannot be audited after mutation except by debug logs. | `REWRITE` structured decision result |
| Channel identity extraction is intentionally lazy | `js/filter_logic.js:1706-1719`, `js/filter_logic.js:1846-1850` | Candidate channel identity is extracted only when channel policy rules exist. | Good performance direction for empty keyword-only sessions, but active-state must be exact or whitelist can lack identity. | `KEEP` + tests |
| Harvest recursively scans all objects | `js/filter_logic.js:1281-1332` | `_harvestRendererChannelMappings()` traverses the full tree and calls `_harvestBrowseEndpoint()` on each object. | Useful map learning, but should be separated from enforcement and disabled in empty sessions unless an affordance needs it. | `GATE` harvest work |

Fetch/XHR equivalence target:

```text
classifyEndpoint(requestUrl, documentRoute, settings)
  -> {
       shouldParse: boolean,
       shouldHarvest: boolean,
       shouldMutate: boolean,
       endpointKind: "search" | "browse" | "next" | "player" | "guide" | "unknown",
       expectedRendererSet: [...]
     }

if !shouldParse:
  return original response untouched
if shouldHarvest && !shouldMutate:
  harvest metadata without replacement response
if shouldMutate:
  return replacement response with per-path decision reasons
```

This is the core JSON-side fix direction: parsing and replacement must be conditional, not the default cost of installing FilterTube.

### Seed Method Ledger - 1

This pass classifies `js/seed.js:1-1027`, the earliest MAIN-world hook. This file decides whether YouTube JSON is observed, cloned, parsed, queued, rewritten, or passed through. It is therefore a prime suspect for empty-install lag even when filtering rules are empty.

Current flow:

```text
document_start seed.js
  -> create window.filterTube public interface
  -> establishDataHooks()
     -> clone/process existing ytInitialData/player response
     -> define setters for future globals
  -> setupFetchInterception()
     -> clone().json() every matched youtubei response
     -> processWithEngine()
     -> always create new Response(JSON.stringify(processed))
  -> setupXhrInterception()
     -> wrap XHR listener/read response
     -> processWithEngine()
     -> override response/responseText getters on XHR instance
```

| Method family | Proof | Reads/mutates | Finding | Verdict |
| --- | --- | --- | --- | --- |
| Seed startup and globals | `js/seed.js:7-42`, `js/seed.js:976-999`, `js/seed.js:1005-1025` | Sets MAIN-world globals and public `window.filterTube`. | Idempotency is good, but the public settings/update surface is page-visible and overlaps with injector/bridge settings delivery. | `REWRITE` authenticated/versioned settings channel |
| Network snapshots | `js/seed.js:43-95` | Stores recent search/browse/next/player response objects on `window.filterTube`. | Useful for diagnostics/import-like flows, but it retains large response objects and runs outside debug. Needs route/budget policy. | `INSTRUMENT` + `GATE` |
| Pending replay queue | `js/seed.js:100-135`, `js/seed.js:342-357` | Queues data when settings/engine are unavailable. | `queueForLater()` caps the queue, but the no-settings branch pushes directly at `js/seed.js:353-356` without that cap. Replayed network responses cannot change the already-returned fetch/XHR response. | `REWRITE` startup readiness contract |
| Debug helpers | `js/seed.js:139-169` | Console/log relay when debug is enabled. | The helper itself is gated. Call sites must avoid doing expensive argument work before the helper checks debug. | `KEEP` helper, audit callers |
| Clone helper | `js/seed.js:180-195` | Deep clones by `structuredClone` or JSON stringify/parse. | Needed for reprocessing snapshots, but expensive on large YouTube payloads and should not run before active enforcement is known. | `GATE` |
| Skip classifier | `js/seed.js:197-333` | Reads document path, cached settings, and response shape. | This is the right idea, but it runs after fetch JSON parsing. It also uses `document.location.pathname`, not the request/response route, and treats `categoryFilters.enabled === true` as active even when selected categories are empty. | `REWRITE` endpoint classifier |
| Engine dispatcher | `js/seed.js:336-433` | Queues, harvests, filters, snapshots. | The skip path still calls `FilterTubeEngine.harvestOnly()` at `js/seed.js:368-372`, so empty blocklist/search/home/channel paths can still harvest and write maps. The full path snapshots results and returns boolean-mutated JSON without reason data. | `GATE` harvest and structured result |
| Basic fallback | `js/seed.js:438-488` | Mutates comments panels/sections when main engine fails. | Narrow fallback for comments is understandable, but it is another mutation engine and should become a declared endpoint contract. | `KEEP` + fixture |
| Initial data hooks | `js/seed.js:497-597` | Hooks `ytInitialData` and `ytInitialPlayerResponse`. | Existing data is cloned and processed immediately. The setters compute `JSON.stringify(newValue).length` inside `seedDebugLog(...)` arguments at `js/seed.js:534` and `js/seed.js:579`, so large stringify cost happens even when debug logging is off. | `REWRITE` debug argument laziness |
| Existing global assignment | `js/seed.js:506-517`, `js/seed.js:526-544`, `js/seed.js:551-562`, `js/seed.js:571-589` | Assigns processed existing globals before installing getters/setters. | For existing `ytInitialData`, `originalYtInitialData` is captured before processing and is not reassigned to the processed value before the getter is installed. After `defineProperty`, the getter can return the pre-processed object. This needs a fixture because it can undercut zero-flash filtering. | `TEST` + likely `REWRITE` |
| Fetch interception | `js/seed.js:606-690` | Overrides `window.fetch`, clones response, parses JSON, rewrites response. | Every matched endpoint pays clone/json parse before skip. The normal path always returns `new Response(JSON.stringify(processed))`, even if no rules exist or `processWithEngine()` returned the original data. | `REWRITE` no-op passthrough |
| Comment continuation shortcut | `js/seed.js:638-671` | Returns synthetic empty comment continuation when `hideAllComments` is enabled. | Correct for a strong comment rule, but it should be measured because it changes YouTube continuation behavior. | `KEEP` + route fixture |
| XHR interception | `js/seed.js:692-893` | Overrides XHR open/send/add/remove listener; parses JSON; overrides response getters. | XHR does less work before settings arrive because it exits when `!cachedSettings` at `js/seed.js:753`, while fetch still queues/rebuilds. Fetch and XHR therefore have different cold-load behavior. | `REWRITE` fetch/XHR equivalence |
| Settings update | `js/seed.js:902-970` | Updates cached settings, public settings, queued data, stored snapshots. | Every settings update can clone and reprocess stored snapshots without dirty-key/version checks. Assigning `window.ytInitialData = reprocessed` after setters exist can invoke the setter and process again. | `GATE` by revision/dirty keys |

Highest-risk seed findings:

| Disease | Proof | Why it matters |
| --- | --- | --- |
| Empty install can still parse/rewrite network responses | Fetch matches `/youtubei/v1/*` at `js/seed.js:607-613`, parses at `js/seed.js:636`, and rewrites at `js/seed.js:675-680`; skip happens inside `processWithEngine()` after parsing. | Explains YouTube Main slowness with no blocklist/whitelist entries. |
| Empty skip can still side-effect harvest | Skip classifier returns true for no active rules on search/channel/home paths, then `processWithEngine()` calls `harvestOnly()` at `js/seed.js:368-372`. | No-hide mode can still write maps, post messages, refresh DOM fallback, and retain snapshots. |
| Hidden debug stringify cost | Setter log arguments call `JSON.stringify(newValue).length` at `js/seed.js:534`, `js/seed.js:579` before `seedDebugLog()` can early-return. | Large startup payloads can be stringified just because the setter ran, even with debug off. |
| Reprocess can double-process | `updateSettings()` sets `window.ytInitialData = reprocessed` at `js/seed.js:956` and `window.ytInitialPlayerResponse = reprocessed` at `js/seed.js:964` after setters are installed. | A settings refresh can recursively wake the engine again and make UI saves feel like YouTube lag. |
| Fetch/XHR cold path differs | Fetch queues when settings are missing through `processWithEngine()` at `js/seed.js:353-356`; XHR exits before processing at `js/seed.js:753`. | First paint can differ by transport, making bugs intermittent by surface and browser. |
| Response route is under-classified | Fetch passes only `fetch:${getPathname(urlStr)}` at `js/seed.js:675`; `shouldSkipEngineProcessing()` uses `document.location.pathname` at `js/seed.js:200-203`. | SPA route and response route can disagree; background continuations can be classified against the wrong page. |

Seed target contract:

```text
classifyYoutubeJsonRequest(requestUrl, documentRoute, settings)
  -> {
       shouldObserve: boolean,
       shouldParse: boolean,
       shouldHarvest: boolean,
       shouldMutate: boolean,
       shouldSnapshot: boolean,
       endpointKind,
       reason
     }

if !shouldParse:
  return original response untouched
if shouldParse && no mutation:
  do not rebuild Response unless a consumer needs a transformed body
if shouldHarvest:
  write maps only with explicit active reason and budget
if shouldMutate:
  require structured per-path decisions from filter_logic.js
```

This is the no-op performance boundary: installing the extension must not mean every YouTube JSON response becomes a FilterTube parse/stringify job.

### Seed Endpoint Decision Ledger - 2

This pass sharpens the `seed.js` finding from "fetch/XHR can be expensive" into endpoint-level contracts. The important point is that `/youtubei/v1/search`, `/browse`, `/next`, `/player`, and `/guide` do not all deserve the same treatment. Some endpoints should be mutation-capable, some should be metadata-only, and some should be passthrough in empty/no-rule sessions.

| Endpoint / source | Proof | Current behavior | Disease risk | Target contract |
| --- | --- | --- | --- | --- |
| Fetch wrapper matched endpoint set | `js/seed.js:607-613`, wrapper at `js/seed.js:624-680` | Any fetch URL containing `/search`, `/guide`, `/browse`, `/next`, or `/player` is cloned, parsed as JSON, processed, and rebuilt as a new `Response`. | The broad endpoint list makes parse/stringify the default cost. No-rule passthrough is decided only after response parse. | Endpoint classifier must run before parse using URL + current runtime activity report. |
| XHR wrapper matched endpoint set | `js/seed.js:697-703`, processing at `js/seed.js:748-785` | Same endpoint family as fetch; parsed at ready-state/load and response getters are overridden when processed. | Better cold-load guard than fetch because it exits on `!cachedSettings`, but empty blocklist can still stringify unchanged data. | Fetch and XHR must share one classifier and one no-op replacement rule. |
| Search `/youtubei/v1/search` | Skip path `js/seed.js:261-270`; renderer gaps in `docs/json_paths_encyclopedia.md:2715-2730`, `docs/youtube_renderer_inventory.md:438` | In blocklist/no active JSON rules, search can skip engine filtering after parse and optionally harvest. Active rules run the recursive engine. | Empty search still paid parse cost. Active search still lacks first-class fixture proof for search refinements and compact channel/playlist variants. | No active enforcement: passthrough, no parse, no harvest unless explicit identity budget. Active enforcement: parse/mutate with renderer fixture coverage. |
| Browse `/youtubei/v1/browse` on home | Skip path `js/seed.js:297-333` | Home feed browse continuations skip mutation only on desktop home, blocklist mode, and no active rules/content/category filters. | Initial home `ytInitialData` is not covered by the same fetch path; enabled-empty category keeps browse active without useful filtering. | Home initial and continuation payloads need the same `home-feed` endpoint contract and active-report validation. |
| Browse `/youtubei/v1/browse` on channels | Channel skip path `js/seed.js:275-294` | Channel payloads can skip mutation only when document route looks like a channel route and no active rules exist. | Uses current `document.location.pathname`, not the route that initiated/owns the response. SPA navigations can misclassify continuations. | Classifier input must include request route, response endpoint, document route at send time, and document route at resolve time. |
| Next `/youtubei/v1/next` | Endpoint matched at `js/seed.js:611`; comment shortcut `js/seed.js:638-671`; channel skip allows `/next` at `js/seed.js:283-287` | Handles comment continuations when `hideAllComments`; otherwise general recursive processing. | `/next` spans watch recommendations, comments, playlists, live panels, and channel continuations. One recursive contract is too generic. | Split endpoint kind: `watch-next`, `comment-continuation`, `playlist-panel`, `channel-continuation`, `unknown-next`. |
| Player `/youtubei/v1/player` | Endpoint matched at `js/seed.js:612`; engine player handling at `js/filter_logic.js:1174-1237`, `/player` docs at `docs/json_paths_encyclopedia.md:4958-4969` | Player responses are sent through the same `processData()` path. Useful fields include `videoDetails` and `microformat` owner/category/date metadata. | Player response mutation is high-risk; it can affect playback. Most value is metadata harvest, not renderer removal. | Default `/player` contract should be metadata-only harvest with no response replacement unless a specific fixture proves a safe mutation need. |
| Guide `/youtubei/v1/guide` | Endpoint matched at `js/seed.js:609`, XHR at `js/seed.js:699` | Included in fetch/XHR endpoint family, then handled by generic engine path. | Guide sidebar/channel list filtering may be useful, but it is not the same as feed/watch filtering. Empty install should not parse it. | Separate guide contract: only parse when guide/channel controls are active; otherwise passthrough. |
| `ytInitialData` global | Existing and setter paths `js/seed.js:509-544` | Existing global is cloned and processed immediately; setter logs size with eager `JSON.stringify`. | Large startup clone/stringify before active proof; current getter capture may preserve pre-processed value. | Process only after authenticated settings revision is available or a documented early-active state exists; debug size must be lazy. |
| `ytInitialPlayerResponse` global | Existing and setter paths `js/seed.js:553-589` | Same pattern as `ytInitialData`, but for player response. | Player data is latency-sensitive and usually metadata-only for FilterTube. | Metadata-only, no mutation by default, lazy debug sizing. |
| Settings update replay | `js/seed.js:921-967` | On each settings update, queued data and raw snapshots are cloned/reprocessed. | A UI save, import, Nanah sync, or duplicated settings delivery can wake full JSON traversal even if the runtime-active report did not change. | Only replay if the new revision changes a key that can affect the relevant endpoint kind. |

Endpoint decision object:

```text
seedEndpointDecision = {
  endpoint: "search" | "browse" | "next" | "player" | "guide" | "initial-data" | "initial-player",
  routeAtRequest,
  routeAtResolve,
  settingsRevision,
  enforcementActive: boolean,
  metadataHarvestActive: boolean,
  uiAffordanceHarvestActive: boolean,
  shouldParse: boolean,
  shouldMutateResponse: boolean,
  shouldSnapshot: boolean,
  reason
}
```

Minimum invariant:

```text
empty install / empty blocklist / no active toggles:
  search -> passthrough
  browse -> passthrough
  next -> passthrough unless comments rule active
  player -> passthrough or metadata-only without replacement
  guide -> passthrough
  ytInitialData -> no mutation unless active revision exists
```

This does not remove JSON-first filtering. It makes JSON-first filtering precise: active rules still get first-paint enforcement, while empty sessions avoid becoming a network-response rewriting layer.

### Filter Logic Method Ledger - 1

This pass classifies `js/filter_logic.js:1-3498` as the main JSON decision engine. It is the layer that should eventually carry the strongest correctness guarantee because it can inspect YouTube response JSON before DOM cards hydrate. The current implementation has the right broad direction, but it still mixes four responsibilities: renderer extraction, identity harvest, rule decision, and map writes.

Current flow:

```text
seed fetch/XHR hook
  -> FilterTubeEngine.processData(data, settings, endpointName)
     -> new YouTubeDataFilter(settings)
     -> harvest channel/video/meta maps
        -> postMessage map updates
     -> enabled false? return original data after harvest
     -> recursive filter()
        -> _unwrapRendererForFiltering()
        -> _buildCandidate()
        -> _shouldBlock()
        -> remove object when boolean true
```

| Method family | Proof | Reads/mutates | Finding | Verdict |
| --- | --- | --- | --- | --- |
| Startup and log bridge | `js/filter_logic.js:7-44` | Reads global guard, posts log messages. | The idempotency guard is correct. Log relay is fine when debug-scoped, but it should not be part of hot-path diagnosis unless enabled. | `KEEP` |
| Map update queues | `js/filter_logic.js:46-141` | Posts video/channel/meta map updates into the isolated bridge. | Useful JSON-first learning, but map writes can happen from harvest paths even when runtime is disabled or when `harvestOnly()` is called. Map writes need active reason, route, producer, and freshness metadata. | `GATE` + `INSTRUMENT` |
| Text/path helpers | `js/filter_logic.js:154-362` | Pure extraction. | These are low-risk utility helpers. They should remain pure and should be covered by fixture snapshots for renderer text paths. | `KEEP` |
| Renderer rule map | `js/filter_logic.js:369-835` | Static extraction contract. | This is the highest leverage correctness table. Several documented renderers are missing or incomplete, and `gridVideoRenderer` is declared twice (`js/filter_logic.js:431`, `js/filter_logic.js:604-609`), so the later rule overrides `BASE_VIDEO_RULES`. | `REWRITE` + `TEST` |
| Channel filter index | `js/filter_logic.js:856-884` | Builds channel matcher index. | Correct direction: compile once per engine instance. It still depends on later match confidence and source quality. | `KEEP` |
| Settings processing | `js/filter_logic.js:938-1061` | Compiles mode, regexes, content filters, category filters, channel indices. | This normalizes runtime settings well, but active-state validation is not centralized here. A filter can be "enabled" in upstream gates while this engine later no-ops because inner values are empty. | `INSTRUMENT` then `REWRITE` canonical active report |
| Browse/player/channel harvest | `js/filter_logic.js:1067-1552` | Reads response JSON, mutates local maps, posts map update messages. | Harvest is valuable, but it is not side-effect-free. It runs before the disabled check in `processData()` and is also used by `harvestOnly()`. Empty install must be able to prove no harvest/write unless an explicit approved affordance or active rule needs it. | `GATE` |
| Renderer unwrap | `js/filter_logic.js:1589-1631` | Chooses nested renderer to evaluate. | It unwraps known nested structures, including `compactPlaylistRenderer` at `js/filter_logic.js:1615`, but `compactPlaylistRenderer` has no `FILTER_RULES` entry, so it later fails open as unknown. | `REWRITE` + fixture |
| Candidate builder | `js/filter_logic.js:1712-1790` | Builds title, metadata, channel, playlist, mix, Shorts, and comment candidate data. | Good lazy direction: expensive channel extraction only runs when channel policy exists. The return shape is still plain data, not a reason/confidence object. | `KEEP` + `INSTRUMENT` |
| Core decision | `js/filter_logic.js:1825-2124` | Decides whitelist/blocklist/comment/content/category hide. Can post collaborator cache. | The order is defensible, but boolean-only hides make false-hide debugging weak. Current route checks use current `document.location`, not response route. Whitelist fail-closed is correct only when mode activation is explicit and visible. | `REWRITE` structured decision result |
| Category filtering | `js/filter_logic.js:2126-2182` | Reads cached metadata, may try to schedule metadata fetch. | Category filters are metadata-dependent and can fail open when category is unknown. Upstream gates treat `enabled` as active even when `selected` is empty. Allow-mode category behavior needs an explicit unknown-category policy. | `REWRITE` active + pending policy |
| Duration/date/title content filters | `js/filter_logic.js:2187-2855` | Reads renderer/meta-map values and applies content controls. | Missing duration/date fails open, which is safer than broad false hiding. The active predicate must reject incomplete controls so this does not wake runtime with no enforceable value. | `KEEP` + `TEST` |
| Channel identity extraction | `js/filter_logic.js:2896-3212` | Reads renderer paths, deep-scans avatar stacks, collaborator data. | This duplicates identity work from `content_bridge.js` and `dom_extractors.js`. It scans `avatarStackViewModel` before mix/radio classification and lacks the documented preferred `showSheetCommand -> sheetViewModel -> listViewModel.listItems` collaborator path. | `REWRITE` shared extractor |
| Channel matching | `js/filter_logic.js:3218-3386` | Delegates to shared identity matcher when available, falls back to legacy string matching. | Delegating to `FilterTubeIdentity.channelMatchesFilter()` is right. Legacy fallback should eventually be limited to fixtures and degraded-confidence paths. | `KEEP` then consolidate |
| Recursive filter | `js/filter_logic.js:3391-3429` | Traverses arrays/objects and drops an object when any recognized renderer decision is true. | Flexible but opaque. Parent-object removal must be fixture-proven per renderer wrapper so one nested hit does not remove unrelated siblings. | `TEST` |
| Public engine entry points | `js/filter_logic.js:3434-3493` | `processData()` harvests then filters; `harvestOnly()` harvests and returns original data. | `processData()` performs harvest before `settings.enabled === false`; `harvestOnly()` can still mutate maps and post messages. Disabled/harvest-only states need explicit side-effect policy. | `GATE` |

Renderer contract gaps proven in this pass:

| Gap | Proof | Why it matters |
| --- | --- | --- |
| `compactPlaylistRenderer` missing | Documented owner paths at `docs/json_paths_encyclopedia.md:4813-4835`; unwrap preference at `js/filter_logic.js:1615`; unknown renderers fail open at `js/filter_logic.js:1837-1844`. | Playlist owner/channel rules can leak or fall back to late DOM cleanup. |
| `compactChannelRenderer` missing | Docs list channel ID/name/handle at `docs/json_paths_encyclopedia.md:2725-2732`; only `channelRenderer` and `gridChannelRenderer` are channel-only at `js/filter_logic.js:404-407`. | Search compact channel cards may not obey channel rules JSON-first. |
| Search refinement and horizontal cards missing | Docs list `searchRefinementCardRenderer` and inventory gaps at `docs/json_paths_encyclopedia.md:2715-2723`, `docs/youtube_renderer_inventory.md:436-438`. | Search page can still require DOM repair even though response JSON contains structured renderers. |
| Shorts identity incomplete | Runtime rules for `reelItemRenderer` and `shortsLockupViewModel` are minimal at `js/filter_logic.js:811-823`; docs list owner/channel paths at `docs/json_paths_encyclopedia.md:4851-4887`. | Shorts by-channel filtering can depend on warmed `videoChannelMap` or DOM fallback. |
| Community post families incomplete | Runtime covers `backstagePostRenderer` / `backstagePostThreadRenderer` at `js/filter_logic.js:726-739`; docs also list `postRenderer` / `sharedPostRenderer` at `docs/json_paths_encyclopedia.md:3275`, `docs/json_paths_encyclopedia.md:3296-3302`. | Channel posts can leak or wake DOM fallback. |
| Collaborator sheet path missing | Inventory marks `showSheetCommand -> sheetViewModel -> listViewModel.listItems` as the preferred collaborator path; `_extractChannelInfo()` handles `showDialogCommand` at `js/filter_logic.js:3000-3027`. | Multi-channel videos may be under-detected or detected from weaker avatar-stack signals. |
| `/player` endpoint over-scope | `/player` owner/meta paths documented at `docs/json_paths_encyclopedia.md:4958-4969`; harvest reads those at `js/filter_logic.js:1174-1237`; recursive mutation still runs at `js/filter_logic.js:3454-3464`. | `/player` should normally be metadata harvest only, not a generic renderer mutation surface. |

Target split:

```text
extractRendererCandidate(rendererType, payload, route)
  -> pure candidate + identity confidence + missing fields

decideRenderer(candidate, compiledRules)
  -> { hide, reason, matchedRule, confidence, pendingReason }

applyJsonDecision(json, decision)
  -> remove only the exact renderer path, record reason

harvestIdentity(json, policy)
  -> map writes only when policy permits side effects
```

This split matters because it lets an empty install prove quiet behavior, lets whitelist fail-closed behavior explain itself, and lets JSON-first filtering replace broad DOM fallback without losing coverage.

### JSON Renderer Coverage Ledger - Current Gaps

The current `FILTER_RULES` map is broad and valuable, but coverage is uneven relative to the renderer inventory. Missing JSON coverage pushes work back to DOM fallback, which is exactly where precision and performance get harder.

| Renderer/surface | Documentation proof | Runtime proof | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `compactPlaylistRenderer` | `docs/json_paths_encyclopedia.md:4813-4835` documents creator UC ID, handle, title, playlist ID, and metadata. | It appears in unwrap preference at `js/filter_logic.js:1597-1616`, but has no first-class `FILTER_RULES` entry; unknown renderers fail open at `js/filter_logic.js:1837-1844`. | User-created playlist cards can leak through JSON filtering or require DOM fallback. | `REWRITE` renderer rule |
| `searchRefinementCardRenderer` | `docs/json_paths_encyclopedia.md:2715-2723`; inventory marks it not parsed at `docs/youtube_renderer_inventory.md:438`. | No `FILTER_RULES.searchRefinementCardRenderer`; unknown renderer returns false. | Search refinement cards can show blocked entities/queries and confuse search results. | `REWRITE` renderer rule |
| `compactChannelRenderer` | `docs/json_paths_encyclopedia.md:2725-2732` documents channel ID/name/handle. | No `FILTER_RULES.compactChannelRenderer`; only `channelRenderer` / `gridChannelRenderer` exist at `js/filter_logic.js:404-407`, `js/filter_logic.js:716-725`. | Standalone compact channel cards can leak or be handled only by DOM. | `REWRITE` renderer rule |
| Shorts lockup channel identity | `docs/json_paths_encyclopedia.md:4851-4869` documents channel ID/handle/avatar paths. | Runtime rules for `shortsLockupViewModel` only include videoId/title at `js/filter_logic.js:816-823`. Later extraction has generic lockup fallbacks but depends on channel extraction being requested. | Shorts block/allow by channel can fail until `videoChannelMap` is warmed. | `REWRITE` explicit identity paths |
| Active Shorts overlay | `docs/json_paths_encyclopedia.md:4880-4887` documents `reelPlayerOverlayRenderer` channel ID/handle/logo. | No first-class `FILTER_RULES.reelPlayerOverlayRenderer`; active overlay only appears as a nested path in `reelItemRenderer` channelName at `js/filter_logic.js:811-815`. | Active Shorts playback identity is weaker than feed-card identity. | `REWRITE` route-specific Shorts contract |
| Collaborator `showSheetCommand` roster | `docs/json_paths_encyclopedia.md:153-182`, `docs/youtube_renderer_inventory.md:224-236` mark `showSheetCommand -> sheetViewModel -> listViewModel.listItems` as preferred. | `_extractChannelInfo()` scans avatar stacks and then only handles `showDialogCommand` at `js/filter_logic.js:3000-3027`. | Preferred collaborator identity can be missed, while weaker avatar-stack signals can be promoted. | `REWRITE` collaborator extractor |
| Avatar-stack collaborator scope | Inventory says avatar stacks are fallback signals and Mix/Radio must be guarded: `docs/json_paths_encyclopedia.md:158`, `docs/youtube_renderer_inventory.md:7`. | `_extractChannelInfo()` recursively scans any item for `avatarStackViewModel` at `js/filter_logic.js:2899-2996` before candidate `isMix` classification at `js/filter_logic.js:1749-1755`. | A Mix/Radio card with avatar stack could be misclassified as collaboration and block by a participant. | `GATE` by renderer type |
| `gridVideoRenderer` rule shadowing | `js/filter_logic.js:431`, `js/filter_logic.js:604-609` | `gridVideoRenderer` is declared twice; the later object overrides `BASE_VIDEO_RULES`. | Handle/description/duration/published/view-count paths can be silently reduced for grid videos. | `TEST` then unify |
| Community `postRenderer` / `sharedPostRenderer` | `docs/json_paths_encyclopedia.md:3275`, `docs/json_paths_encyclopedia.md:3296-3302`, `docs/json_paths_encyclopedia.md:4977-4982`. | Rules cover `backstagePostThreadRenderer` and `backstagePostRenderer` at `js/filter_logic.js:726-739`, but not `postRenderer` or `sharedPostRenderer`. | Channel posts can leak or rely on DOM fallback even though JSON paths are documented. | `REWRITE` post renderer rules |
| `/player` response | `docs/json_paths_encyclopedia.md:4958-4969` documents `videoDetails` and `microformat.playerMicroformatRenderer`. | Harvest code reads `/player` owner/meta at `js/filter_logic.js:1174-1237`, but recursive filter still traverses entire response at `js/filter_logic.js:3454-3464`. | Metadata endpoint can be over-processed; filtering decisions should come from watch/next renderers, not arbitrary player payload shape. | `GATE` mutate path |
| End-screen video renderer | Runtime has `endScreenVideoRenderer: BASE_VIDEO_RULES` at `js/filter_logic.js:435`. | User review says end-screen video wall still leaks; likely DOM/player endscreen surface does not always arrive as JSON or the content-control toggle is separate. | This is not only a missing rule; it needs route evidence for player endscreen DOM/video wall. | `TEST` with watch endscreen fixture |

Renderer coverage rule:

```text
If docs/json_paths_encyclopedia.md documents a renderer with stable owner/title IDs,
then runtime needs either:
  1. first-class JSON renderer rule,
  2. explicit "metadata-only / do not filter" decision,
  3. or a documented DOM-only fallback with reason.
```

Anything else is an audit gap because it leaves behavior implicit.

### Content Script Load Order And Boot Ledger

This pass checks what runs before user intent or active rules are known. It explains why an empty install can still feel heavy even if the filter decision later returns "no hide."

| Boot surface | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| MAIN seed at document start | `manifest.json:25-35` | `js/seed.js` runs in MAIN world at `document_start` for YouTube and YouTube Kids. | Correct for zero-flash JSON interception, but it must be as small and conditional as possible. | `KEEP` + active predicate |
| Large isolated bundle at document start | `manifest.json:37-58` | Identity, menu, DOM helper/extractor/fallback, quick-block, settings bridge, resolver, collab, prompts, and `content_bridge.js` all load at `document_start`. | Empty install still loads feature code for UI affordances, prompts, collaboration, fallback, and prefetch. | `GATE` boot modules |
| MAIN-world reinjection path | `js/content/bridge_injection.js:75-103` | Isolated script injects `shared/identity`, `filter_logic`, and `injector`; Firefox also injects `seed`. | Main-world engine is installed even before active enforcement is known. | `KEEP` for engine, `GATE` heavy work |
| DOM fallback boot after settings | `js/content_bridge.js:5704-5711`, `js/content_bridge.js:5717-5727` | Initialization loads stats, injects main scripts, requests settings, then applies DOM fallback and ensures fallback menu buttons. | Settings success is treated as enough to start fallback work; no central `hasActiveEnforcement()` check exists. | `REWRITE` active-state gate |
| Body observer and prefetch boot | `js/content_bridge.js:6025-6055` | Body mutation observer, card prefetch observer, playlist prefetch hook, right-rail whitelist observer, and prefetch scan start after DOM fallback init. | Good coverage for active filtering, but too much for empty blocklist/no-affordance sessions. | `GATE` lifecycle |
| Quick-block/menu delayed boot | `js/content/block_channel.js:2358-2397` | After one second, both menu observer and quick-block observer start. | The injection predicates may later no-op, but observers/listeners are still installed. | `GATE` by visible affordance |
| Collaboration dialog boot | `js/content/collab_dialog.js:75-80`, `js/content/collab_dialog.js:306-336` | On DOMContentLoaded, global click/keydown listeners and document-wide dialog observer are installed. | Useful for collaboration identity, but should be demand-driven or rule/affordance gated. | `GATE` |

Boot target:

```text
document_start:
  seed minimal hooks
  settings request
  active-state classify

if no active enforcement and no visible block affordance:
  no DOM fallback observer
  no prefetch observer
  no quick-block/menu observer
  no collaboration observer

if active enforcement:
  install only route-required JSON/DOM modules
```

This does not mean removing those features. It means their lifecycle should be owned by explicit runtime state instead of "content script loaded successfully."

### No-Op Passthrough Requirement

The strongest performance and correctness invariant:

```text
If:
  enabled === true
  listMode === "blocklist"
  no keywords
  no channels
  no comment keywords
  all hide booleans false
  content filters inactive
  category filters inactive
Then:
  seed.js may harvest low-cost identity maps only when explicitly enabled,
  must not remove renderers,
  must not stringify a replacement response,
  must not schedule DOM fallback scans beyond UI-affordance boot that is explicitly enabled.
```

Current violation evidence:

- `setupFetchInterception()` clones/parses/stringifies every matching endpoint response: `js/seed.js:633-680`.
- `setupXhrInterception()` parses/stringifies matching XHR responses once ready: `js/seed.js:748-785`.
- `initializeDOMFallback()` always applies DOM fallback and starts observers after settings: `js/content_bridge.js:5717-6055`.
- `ensureFallbackMenuButtons()` starts mutation/click/scroll/warmup scanning: `js/content_bridge.js:6498-6624`.

Verdict: `REWRITE` after instrumentation. This is the core "disease" for empty-install lag.

## Subsystem C - DOM Fallback, CSS Hiding, And Layout Repair

### Current Flow

```text
content_bridge.initializeDOMFallback()
  -> applyDOMFallback()
  -> body MutationObserver
  -> queueWhitelistPendingHide()
  -> fallback menu scanner
  -> card prefetch observers
  -> route-specific repair/cleanup branches
```

### DOM Fallback Method Ledger - 1

This pass classifies `js/content/dom_fallback.js:1-4838` at method-family level. DOM fallback is necessary because YouTube can hydrate after JSON hooks, but it must become a bounded repair layer rather than the default first decision engine for every visible card.

| Method family | Proof | Reads/mutates | Finding | Verdict |
| --- | --- | --- | --- | --- |
| Normalization and caches | `js/content/dom_fallback.js:16-108`, `js/content/dom_fallback.js:263-447` | Compiles regex and channel filter indices. | Mostly pure and cached by list/settings identity. This should remain shared with JSON/UI through one identity module. | `KEEP` + consolidate |
| Mix/radio and playlist helpers | `js/content/dom_fallback.js:110-245`, `js/content/dom_fallback.js:681-781` | Reads text, selectors, playlist rows; `openWatchPlaylistPanelIfCollapsed()` can click. | Read helpers are useful, but any helper that clicks is an action side effect and should not sit beside pure extraction. | `KEEP` reads, `GATE` click |
| Current page/watch owner helpers | `js/content/dom_fallback.js:496-679` | Reads route, channel header, watch owner, `videoChannelMap`; may use stale page DOM. | Correctly prefers `videoChannelMap` for current watch owner, but this is another identity extractor separate from JSON and content bridge. | `CONSOLIDATE` |
| Current-watch block enforcement | `js/content/dom_fallback.js:783-931` | Pauses video, hides selected row/shell, may open playlist panel, may click next link/button, schedules retries. | Necessary to prevent blocked current-watch playback, but it is the strongest DOM-side engagement path and must be action/reason gated. | `INSTRUMENT` + `GATE` |
| Stamped block state helpers | `js/content/dom_fallback.js:933-1062` | Reads/clears blocked attrs and hidden markers. | Good stale-row protection exists at `js/content/dom_fallback.js:1024-1039`, but marker vocabulary is duplicated across files. | `KEEP` + shared hide record |
| Content-control CSS builder | `js/content/dom_fallback.js:1064-1407` | Creates a runtime `<style>` and sometimes calls direct DOM hiding for open-app buttons. | Powerful and route-aware in places, but CSS rules are broad and not individually represented as decisions. Direct `hideYouTubeOpenAppButtons()` writes display none without a normal restore path. | `REWRITE` schema-backed controls |
| Keyword helpers | `js/content/dom_fallback.js:1431-1514` | Normalizes and matches text. | Useful fallback behavior, but `matchesKeyword()` allows a match when either left or right boundary exists (`js/content/dom_fallback.js:1505-1509`), not both. This broadens fallback keyword matching relative to strict whole-token expectations. | `TEST` |
| Home/comment/guide handlers | `js/content/dom_fallback.js:1520-1931` | Queries comments/home/guide DOM, hides/restores with `toggleVisibility()`. | Comment handling is mature but broad: it scans several comment representations and uses full `textContent`. Guide whitelist is route-specific and should remain whitelist-only. | `KEEP` + route fixtures |
| Active-work gate | `js/content/dom_fallback.js:1933-1999` | Reads settings only. | Empty blocklist returns false unless lists/toggles/content/category are active, which is good. But whitelist always returns active, and category/content enabled-empty states still return active. Catch block returns true, making failures fail-open for work. | `REWRITE` canonical active report |
| Stale cleanup | `js/content/dom_fallback.js:2001-2032`, `js/content/dom_fallback.js:2304-2323` | Restores hidden/pending nodes and clears some attrs. | Useful, but it does not clear every direct-hide reason (`data-filtertube-members-only-hidden`, `data-filtertube-hidden-by-mix-radio`, `data-filtertube-hidden-by-shelf-title`, `data-filtertube-hidden-open-app`). Restore ownership is incomplete. | `REWRITE` writer/restorer pairs |
| Main fallback scheduler | `js/content/dom_fallback.js:2035-2097`, `js/content/dom_fallback.js:4522-4531` | Coalesces concurrent runs and schedules pending reruns. | Coalescing is good. Rerun should carry reason/initiator so we can distinguish settings change, metadata update, whitelist pending repair, and generic mutation. | `INSTRUMENT` |
| Scroll/listener boot | `js/content/dom_fallback.js:2098-2115` | Adds one global scroll listener after active fallback starts. | Better than installing on empty no-rule paths. Still needs lifecycle accounting because it never disconnects. | `INSTRUMENT` |
| Watch/feed repair prologue | `js/content/dom_fallback.js:2127-2167` | Restores `/feed/channels` and watch metadata in whitelist. | Correctness repair for import/watch surfaces; should be explicit route contract, not broad cleanup. | `KEEP` + tests |
| Direct JS content-control hides | `js/content/dom_fallback.js:2172-2302` | Members-only, playlist, mix chip fallback; several direct `style.setProperty('display','none')` writes. | Members-only has a restore branch, but playlist lockup/shelf hides do not have a dedicated toggle-off restore while other fallback work remains active. Mix chip restore targets only chip text. | `REWRITE` through central helper |
| Main card scan | `js/content/dom_fallback.js:2325-3945` | Queries `VIDEO_CARD_SELECTORS`, extracts title/channel/meta, schedules metadata fetches, sets reason attrs, calls `toggleVisibility()`. | This is the largest hot path. It has yield points every 60 cards and many stale-card guards, but it mixes extraction, metadata fetch scheduling, decision, hide, pending state, and target selection. | `REWRITE` into extractor/decision/apply stages |
| Playlist click/autoplay guards | `js/content/dom_fallback.js:2337-2441`, `js/content/dom_fallback.js:3795-3823`, `js/content/dom_fallback.js:4462-4513` | Adds click/ended listeners, pauses video, clicks playlist links/next button. | This directly interacts with YouTube player controls. It may be necessary for blocked playlist items, but it is the most credible recommendation/engagement drift path. | `GATE` + event audit |
| Metadata pending timers | `js/content/dom_fallback.js:2465-2501`, `js/content/dom_fallback.js:3216-3382`, `js/content/dom_fallback.js:3696-3768` | Schedules `scheduleVideoMetaFetch()`, marks pending category/date, reruns fallback after TTL. | Correct for content filters, too expensive if enabled values are invalid or not route-relevant. Pending vs confirmed hide must be explicit. | `GATE` |
| Identity extraction inside card loop | `js/content/dom_fallback.js:2657-3185`, `js/content/dom_fallback.js:3427-3471` | Reads many selectors, stamps channel IDs, uses page meta and videoChannelMap. | This duplicates `filter_logic.js`, `content_bridge.js`, and `dom_extractors.js`. Good coverage, but too much to reason about without shared identity confidence. | `CONSOLIDATE` |
| Container/chip/shelf cleanup | `js/content/dom_fallback.js:3951-4424` | Hides surveys, chips, empty rich items, Shorts containers, shelves, duplicate whitelist home items. | Visual cleanup is necessary after true hides. It should only run after child decisions are known and should not create first-order hide reasons without fixtures. | `KEEP` + `INSTRUMENT` |
| Scroll preservation and summary | `js/content/dom_fallback.js:4427-4455` | Restores scroll unless user scrolled; logs summary in debug. | Good defensive behavior. Keep measured because it can fight YouTube layout if run too often. | `KEEP` |
| DOM decision helper | `js/content/dom_fallback.js:4535-4838` | Applies whitelist/blocklist keyword/channel logic; may call background-only handle resolution. | Semantics mostly mirror JSON, but this path has broader text/name fallback and unresolved-handle escalation. It should return structured reasons and route through shared identity. | `REWRITE` structured result |

Immediate DOM fallback disease findings:

| Disease | Proof | Why it matters |
| --- | --- | --- |
| Active-state drift remains | DOM active gate: `js/content/dom_fallback.js:1933-1995`; JSON active gate: `js/seed.js:197-333`; inner filter no-ops: `js/content/dom_fallback.js:2468-2471`, `js/filter_logic.js:2130-2133`. | One layer can wake when another cannot enforce. This is a core cause of lag without useful filtering. |
| Direct hide writers bypass central reason model | `js/content/dom_fallback.js:2184-2186`, `js/content/dom_fallback.js:2206-2214`, `js/content/dom_fallback.js:2224-2226`, `js/content/dom_fallback.js:2264-2275`, `js/content/dom_fallback.js:2286-2287`, `js/content/dom_fallback.js:1424-1425`. | Direct writes can hide real UI without stats/rollback/reason parity and without symmetric cleanup. |
| Playlist/action side effects can look like engagement | `js/content/dom_fallback.js:820-823`, `js/content/dom_fallback.js:873-878`, `js/content/dom_fallback.js:913-920`, `js/content/dom_fallback.js:2384-2397`, `js/content/dom_fallback.js:2432-2437`, `js/content/dom_fallback.js:4501-4513`. | These are intentional skip/protection actions, but they are the exact paths to instrument for the user review claim that YouTube reacts as if content was engaged. |
| Keyword boundary fallback may be too permissive | `js/content/dom_fallback.js:1505-1509`. | The fallback substring path returns true if either side has a boundary, not both. This can match partial terms more broadly than expected. |
| Restore vocabulary is incomplete | Cleanup clears a subset at `js/content/dom_fallback.js:2001-2032` and disabled cleanup at `js/content/dom_fallback.js:2304-2323`. | Hides caused by different direct writers can survive until a very specific toggle branch runs. |

### Verified Risks

| Area | Proof | Verdict | Reason |
| --- | --- | --- | --- |
| Broad fallback selectors | `js/content/dom_fallback.js:2325-2328` | `KEEP` + `GATE` | Needed as fallback, but should not scan all cards on empty/no-op state. |
| Playlist card direct hide restore gap | `js/content/dom_fallback.js:2253-2278` | `REWRITE` | Hides lockups/shelves/horizontal containers but lacks a matching restore branch when toggle turns off while fallback remains active. |
| Playlist synthetic navigation | `js/content/dom_fallback.js:2337-2397`, `js/content/dom_fallback.js:2401-2437` | `INSTRUMENT` | This intentionally clicks next/target links to skip hidden playlist items and is the clearest engagement-sensitive path. |
| Legacy visible CSS | `css/content.css:40-48`, `css/layout.css:654-668` | `REMOVE` or `QUARANTINE` | `:not(.filter-tube-visible)` rules are dangerous if those CSS files are injected. Current runtime uses `.filtertube-hidden`; legacy visible CSS should not ship to content pages. |
| Current hide helper | `js/content/dom_helpers.js:16-18`, `js/content/dom_helpers.js:71-126` | `KEEP` | Central `.filtertube-hidden` helper is the correct model. |
| Shelf/container cleanup | `js/content/dom_fallback.js:4324-4378` | `INSTRUMENT` | Needed for visual gaps, but it can hide containers if child visibility accounting is wrong. |
| Whitelist pending queue | `js/content_bridge.js:5919-5927`, `js/content_bridge.js:5995-5999` | `KEEP` + `GATE` | Important for leak prevention, but should not run in empty blocklist mode. |

### CSS And Legacy Reveal/Hide Drift

Some tracked CSS and JS still represents an older "hide first, reveal with `.filter-tube-visible`" model. Current manifest proof shows those CSS files are not directly injected as content-script CSS, so this audit must keep shipped runtime behavior separate from stale or build-reintroduced assets.

| Asset/path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Current manifest content scripts | `manifest.json:25-59`, `manifest.firefox.json:30-49` | Declares JS content scripts only; no `content_scripts.css` entry. | CSS files can be tracked without being shipped, so package proof is required before blaming live behavior. | `INSTRUMENT` packaged-asset map |
| Legacy initial-hide stylesheet | `css/filter.css:8-35`, `css/content.css:8-45` | Hides many YouTube renderers by default until `.filter-tube-visible` is added. | If this model is reintroduced accidentally, an empty install could hide surfaces before JS reveal logic runs. | `QUARANTINE` unless intentionally shipped |
| Aggressive Shorts/Mix CSS | `css/layout.css:509-576`, `css/layout.css:737-803` | Hides Shorts, mix, and playlist assets using `.filtertube-hidden` and `:not(.filter-tube-visible)` patterns. | Dangerous when loaded without a complete reveal writer; can create false hides independent of rule matching. | `QUARANTINE` unless intentionally shipped |
| Legacy reveal layout script | `js/layout.js:19-56`, `js/layout.js:652-663` | Repairs `.filter-tube-visible` layout and scans missing-visible-class elements. | Not listed in current manifests; likely stale, but still a future regression source. | `VERIFY` build references |
| Current runtime hide helper | `js/content/dom_helpers.js:16-29`, `js/content/dom_helpers.js:67-131` | Injects `.filtertube-hidden` CSS and reversible hide/show helpers. | Direct writers bypass reason metadata and rollback accounting. | `KEEP` + consolidate direct writers |

Packaging invariant:

```text
Before release, produce a packaged-asset map:
  manifest content scripts
  web-accessible scripts
  popup/tab HTML dependencies
  dynamically injected styles/scripts
  app runtime sync inputs
  build-only files
  stale tracked files
```

This matters because performance and false-hide analysis must only blame assets that are actually loaded, while still guarding against future packaging regressions.

### Hide Writer Initial Map

This is not the full writer/restorer ledger yet, but it identifies the highest-risk hide writers:

| Writer | Proof | Restore status | Verdict |
| --- | --- | --- | --- |
| Central helper | `js/content/dom_helpers.js:67-131` | Has explicit restore for class/attr/display. | `KEEP`. This should become the only normal card hide path. |
| Whitelist pending hide | `js/content_bridge.js:5919-5931` | Rechecked by later DOM fallback pass. | `KEEP` + `GATE`. Only run in whitelist mode and not during empty blocklist. |
| Fallback card pass | `js/content/dom_fallback.js:2325-2445` onward | Mixed restore via helper and stale cleanup. | `KEEP` + `INSTRUMENT`. Needs per-reason counters. |
| Playlist cards direct inline hide | `js/content/dom_fallback.js:2253-2278` | Missing dedicated toggle-off restore branch. | `REWRITE`. |
| Members-only direct inline hide | `js/content/dom_fallback.js:2172-2250` | Has explicit restore branch. | `KEEP` + `INSTRUMENT`. |
| Immediate quick/fallback menu hide | `js/content_bridge.js:11632-11663`, `js/content/block_channel.js:1232-1234` | Quick-block rollback exists for some paths. | `KEEP` + `INSTRUMENT`. Must record optimistic hide vs confirmed hide. |
| Fallback menu row hide | `js/content_bridge.js:6853-6855`, `js/content_bridge.js:7838-7840`, `js/content_bridge.js:7957-7960` | Directly sets `display:none`, class, and attr. Restore depends on surrounding action-specific paths. | `REWRITE` through shared hide helper/result object. |
| Comment/action hide paths | `js/content_bridge.js:11953-11955`, `js/content_bridge.js:12689-12691`, `js/content_bridge.js:12706-12708` | Direct hidden writes for comment/channel action paths. | `INSTRUMENT` + consolidate reason metadata. |
| Legacy layout repair | `js/layout.js:622-626` and broad `.filter-tube-visible` CSS | No normal current restore contract. | `REMOVE` or hard-gate as legacy-only. |

### `toggleVisibility()` Coverage Summary

Static count: 59 calls to `toggleVisibility()` across `js/content/dom_helpers.js`, `js/content/dom_fallback.js`, and `js/content_bridge.js`.

| Surface group | Proof | Current behavior | Verdict |
| --- | --- | --- | --- |
| Current watch blocking | `js/content/dom_fallback.js:858`, `js/content/dom_fallback.js:927` | Hides selected watch/player shells when current video owner is blocked. | `KEEP` + `TEST` |
| Home feed and guide controls | `js/content/dom_fallback.js:1567`, `js/content/dom_fallback.js:1925` | Hides home feed / guide entries from explicit controls. | `KEEP` + route-gate |
| Comments | `js/content/dom_fallback.js:1605-1882`, `js/content_bridge.js:11540-11546` | Mixes all-comments hide, comment keyword hide, and blocked author/channel hide. | `KEEP` + reason counters |
| Global stale cleanup | `js/content/dom_fallback.js:2015`, `js/content/dom_fallback.js:2132`, `js/content/dom_fallback.js:2311`, `js/content/dom_fallback.js:2532`, `js/content/dom_fallback.js:2577` | Restores stale FilterTube-hidden elements when fallback has no active work or when a card no longer matches. | `KEEP` |
| Main card pass | `js/content/dom_fallback.js:3929` | Central card decision point after identity/title/duration/upload/category checks. | `KEEP` + `INSTRUMENT` |
| Chips/shelves/empty containers | `js/content/dom_fallback.js:3965-4015`, `js/content/dom_fallback.js:4060-4071`, `js/content/dom_fallback.js:4337-4385`, `js/content/dom_fallback.js:4420` | Visual cleanup after content hides. | `KEEP` but only after child hide reasons are known |
| Shorts specific | `js/content/dom_fallback.js:4223-4294` | Blocks active Shorts/short cards based on owner/keyword/global Shorts controls. | `KEEP` + Shorts route fixtures |

Finding: the main reversible helper is used broadly, which is good. The risk is not the helper; the risk is direct inline hide paths that sit beside it and broad scans that reach the helper before JSON-first decisions are available.

### Hide, Stats, And Playback Side-Effect Ledger

This layer is where visual filtering becomes user-visible side effects: stored stats, media pause/stop, synthetic navigation, and rollback. It must be treated as a side-effect boundary, not a simple CSS helper.

| Path | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Central hide helper | `js/content/dom_helpers.js:67-149` | Adds/removes `.filtertube-hidden`, `data-filtertube-hidden`, inline `display:none`, stats, tracker entries, and media pause/restoration hooks. | This is the right central point, but it currently mixes visual hide, analytics counters, and playback side effects. | `KEEP` + split effects |
| Stats increment | `js/content_bridge.js:3607-3685` | Counts newly hidden video-like cards and writes `data-filtertube-time-saved`, then calls `saveStats()`. | A false positive hide becomes persistent product telemetry in local storage. It also emits console logs for every counted hide. | `INSTRUMENT` reason + source |
| Stats decrement | `js/content_bridge.js:3680-3696` | Decrements only if `data-filtertube-time-saved` exists on the restored element. | Direct hide writers that bypass `incrementHiddenStats()` will not decrement, and restored equivalent containers may not carry the saved-time attr. | `REWRITE` hide record id |
| Stats storage write | `js/content_bridge.js:3702-3734` | Writes `statsBySurface` and legacy `stats` for Main after each counted hide/restore. | Frequent storage writes can wake UI/content listeners and should be batched separately from filtering decisions. | `BATCH` |
| Playback pause on hide | `js/content_bridge.js:3738-3776` | Pauses media elements and calls `pauseVideo()`/`stopVideo()` on `#movie_player` when an element is hidden. | Correct when hiding the current blocked watch/player. Risky when a broad container is hidden during pending/repair work. | `GATE` by current-player reason |
| Immediate optimistic action hide | `js/content_bridge.js:11624-11703`, `js/content_bridge.js:12682-12708` | User-initiated block can directly write `display:none`, hidden class, and blocked attrs before background persistence/refetch. | Good UX, but it bypasses central stats/playback semantics and has rollback only on some failure branches. | `CONSOLIDATE` optimistic hide helper |
| Block-all collaborator direct hide | `js/content_bridge.js:11938-11957` | Directly hides clicked block-all target and marks pending. | Action-scoped and likely acceptable, but still not represented by the central hide record. | `INSTRUMENT` |
| Selected playlist synthetic skip | `js/content/dom_fallback.js:3795-3823` | A hidden selected playlist row can trigger a synthetic next-button click. | This is the strongest engagement-drift suspect because it interacts with YouTube controls, not just DOM visibility. | `GATE` + event audit |
| Pending metadata skipStats | `js/content/dom_fallback.js:3920-3929` | Category/upload/date pending states can call `toggleVisibility(..., pendingMetaOnly)` and avoid stats. | Good intent; pending/confirmed transition must be represented explicitly so stats are counted only on confirmed rule matches. | `KEEP` + decision states |

Side-effect invariant:

```text
evaluateContent() returns a decision.
applyDecision(decision) may:
  - hide/show DOM,
  - count stats,
  - pause media,
  - navigate/skip,
  - persist local facts.

Each side effect requires an explicit allowed flag and reason code.
No direct display:none write should bypass applyDecision() unless it is a named optimistic user-action hide with rollback metadata.
```

Hide invariant:

```text
Every content hide should create the same audit shape:
  element kind
  route
  source: json | dom-fallback | quick-block | native-menu | fallback-menu | cleanup
  rule source: channel | keyword | comment | category | content-filter | boolean | user-action
  confidence
  optimistic: true/false
  reversible: true/false
```

Direct `display:none` writes should be rare and documented. Otherwise, a false hide can be visually real but invisible to the stats, rollback, debug, and fixture systems.

DOM coverage gaps already documented:

- `ytd-search-refinement-card-renderer`: `docs/youtube_renderer_inventory.md:438`.
- `compactPlaylistRenderer`: `docs/json_paths_encyclopedia.md:930-972`.
- `reelPlayerOverlayRenderer`: `docs/json_paths_encyclopedia.md:2194-2196`.
- `compactChannelRenderer`: `docs/json_paths_encyclopedia.md:2725-2726`.

DOM fallback rule:

```text
Use DOM fallback only for:
  1. YouTube markup that has already rendered before JSON hooks had settings.
  2. Player overlays/end-screen surfaces where JSON coverage is incomplete.
  3. UI affordances owned by FilterTube: quick block, native menu, comments actions.
  4. Last-mile cleanup after JSON-first hides.

Do not use DOM fallback as the first place to decide every feed card once JSON can decide it.
```

### DOM Extractor Confidence Ledger

`js/content/dom_extractors.js` is a correctness-critical file. It does not decide whether to block, but it decides which video/channel a DOM card represents. A wrong identity stamp can create a false hide even when blocklist/whitelist logic is correct.

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Shared card selector set | `js/content/dom_extractors.js:10-60` | Defines desktop, mobile, and Kids card selectors consumed by fallback, prefetch, quick-block, and menu logic. | Any broad selector here expands every downstream scan. It must be route/surface tagged. | `KEEP` + fixture |
| `ensureVideoIdForCard()` stale-state cleanup | `js/content/dom_extractors.js:62-209` | Extracts current video ID and clears stale FilterTube identity/hidden/collab/block markers when YouTube recycles DOM nodes. | This is a key protection against false hides. It should become a tested invariant because it also removes hide markers. | `KEEP` + `TEST` |
| Stale marker removal on unstamped recycled cards | `js/content/dom_extractors.js:109-168` | If a new video ID is found on a card with old FilterTube identity/state but no cached video ID, clears cached metadata and hidden markers. | Correct disease-level fix for recycled YouTube nodes; needs reason logging so it does not hide/unhide invisibly. | `KEEP` + `INSTRUMENT` |
| Stale marker removal on mismatched cached ID | `js/content/dom_extractors.js:171-201` | If cached video ID differs from extracted ID, removes processed, identity, hidden, block, and display state. | Correct for recycled nodes; this path may explain some "content suddenly reappeared" behavior after SPA hydration. | `KEEP` + `TEST` |
| Title extraction | `js/content/dom_extractors.js:211-227` | Reads selected title selectors, aria label, or labelled-by source. | Low risk; should emit title source in future hide-decision object. | `KEEP` |
| Card ancestor lookup | `js/content/dom_extractors.js:229-233` | Returns matching selector or closest matching card. | Broad fallback to `element` can make action code operate on too-small nodes if no card matches. | `INSTRUMENT` |
| Duration extraction cache | `js/content/dom_extractors.js:244-321` | Reads badge/legacy duration selectors and caches seconds or blank miss marker. | Good performance cache; blank miss can be stale until explicit metadata/rerun clears it. | `KEEP` |
| Duration parsers | `js/content/dom_extractors.js:328-376` | Parses aria-label durations and `HH:MM:SS` text. | Simple and safe. | `KEEP` |
| Shelf title extraction | `js/content/dom_extractors.js:382-420` | Reads multiple shelf header selectors and aria labels. | Shelf-title controls depend on this; exact title source should be included in debug logs. | `INSTRUMENT` |
| Channel ID/custom/handle helpers | `js/content/dom_extractors.js:426-479` | Extracts UC IDs, handles, and `/c`/`/user` custom URLs from strings/hrefs. | Correct low-level primitives; avoid using arbitrary card text as a channel source. | `KEEP` |
| Renderer-data video scan | `js/content/dom_extractors.js:494-544` | Reads direct video IDs, nested playlist/video IDs, and Kids blacklist endpoint item IDs. | Useful for JSON/DOM parity; deliberately shallow. | `KEEP` |
| Renderer-data channel scan | `js/content/dom_extractors.js:546-623` | Reads direct channel fields, canonical base URLs, and a small safe property list while avoiding broad `items/contents/results`. | Good guard against stealing identity from related videos. | `KEEP` |
| Channel metadata cache trust | `js/content/dom_extractors.js:625-671` | Uses cached channel handle/id only when compatible with current href. | Correct protection against stale stamps; needs unit fixtures for handle-to-channel URL transitions. | `TEST` |
| Dataset/attribute extraction | `js/content/dom_extractors.js:673-731` | Searches dataset/attribute values for IDs/handles, with narrower sources for handle extraction when explicit channel nodes exist. | Medium risk because attributes can contain unrelated IDs; confidence should be recorded. | `INSTRUMENT` |
| Polymer/data-object extraction | `js/content/dom_extractors.js:734-789` | Reads known `.data`/`.__data` object sources and parent candidates. | Prefer this over broad `innerText`; should map to renderer docs. | `KEEP` + fixture |
| Anchor extraction | `js/content/dom_extractors.js:791-879` | Scans anchors for channel links, IDs, handles, custom URLs, dataset, attrs, and text handles. | Correct fallback, but every result should carry source confidence (`href`, `dataset`, `attr`, `text`). | `REWRITE` result object |
| Broad text fallback | `js/content/dom_extractors.js:881-889` | If no handle exists, scans `channelText`, `cacheTarget.innerText`, `element.innerText`, and related element text for a handle. | Highest false-identity risk in this file: a title mentioning `@handle` can look like a channel handle if call sites pass broad elements. | `GATE` by confidence |
| Cache writes/removal | `js/content/dom_extractors.js:899-913`, `js/content/dom_extractors.js:916-936` | Writes/removes `data-filtertube-channel-handle` and `data-filtertube-channel-id`. | Good speed optimization, but every stamp should include source/confidence/timestamp in future. | `REWRITE` metadata |
| Video ID extraction | `js/content/dom_extractors.js:947-1102` | Prioritizes primary watch/shorts/live/embed hrefs, handles Kids specially, then datasets/attrs/data objects. | Correct ordering overall; expensive fallback should not run from broad scans unless active. | `KEEP` + `GATE` |

### DOM Extractors And Helpers Method Ledger - 1

This pass classifies `js/content/dom_extractors.js:1-1102` and `js/content/dom_helpers.js:1-206` as shared infrastructure. Static references show these helpers are not local utilities: `ensureVideoIdForCard()` has 32 references, `extractVideoIdFromCard()` has 29 references, `extractChannelMetadataFromElement()` has 11 references, `toggleVisibility()` has 59 references, and `clearCachedChannelMetadata()` has 16 references across `js/`.

| Method family | Proof | Reads/mutates | Finding | Verdict |
| --- | --- | --- | --- | --- |
| Shared card selector surface | `js/content/dom_extractors.js:10-60`; consumers include `js/content_bridge.js:999`, `js/content_bridge.js:5814-5819`, `js/content/dom_fallback.js:2327-2328` | Defines a single desktop/mobile/Kids selector string used by fallback, menu, prefetch, and quick-block paths. | Correct as a central inventory, but it is not route scoped. Adding one broad renderer expands every downstream scanner. | `KEEP` + route tags |
| Video ID stamp and recycled-node cleanup | `js/content/dom_extractors.js:62-209` | Reads current href/data identity; mutates `data-filtertube-video-id`; clears many stale hidden/channel/block/collab attrs. | This is a critical correctness repair for YouTube recycled nodes. It is also not pure extraction, because it can unhide and erase state while returning an ID. | `KEEP` + split pure/mutate |
| Generic title/card helpers | `js/content/dom_extractors.js:211-233` | Reads title selectors, aria labels, labelled-by targets, and closest card selector. | Low complexity. Risk is `findVideoCardElement()` returning the original element when no card matches, which can make action paths operate on too-small nodes. | `KEEP` + confidence |
| Duration extraction/cache | `js/content/dom_extractors.js:244-321`, `js/content/dom_extractors.js:328-376`; called by helper stats at `js/content/dom_helpers.js:83-85` and stats at `js/content_bridge.js:3644-3646` | Reads duration badges and stores either seconds or blank miss marker on DOM. | Good cache, but a blank miss marker can freeze an early hydration miss until another path explicitly clears it. Duration extraction is also invoked as a side effect of hiding. | `KEEP` + TTL/test |
| Shelf title extraction | `js/content/dom_extractors.js:382-420` | Reads shelf/header text and aria labels. | Necessary for shelf controls. It needs source tagging so a bad aria/header fallback does not silently hide a full shelf. | `INSTRUMENT` |
| Low-level channel parsers | `js/content/dom_extractors.js:426-479` | Pure string parsing for UC IDs, handles, and custom URLs. | This is the correct foundation. It should be shared by JSON, DOM, background imports, and UI preview code instead of reimplemented. | `KEEP` + consolidate |
| Dataset/attribute/data-object scanners | `js/content/dom_extractors.js:481-623`, `js/content/dom_extractors.js:673-879`, `js/content/dom_extractors.js:947-1102` | Reads datasets, all attributes, Polymer data objects, anchors, and known renderer-like objects. | Coverage is valuable, but attribute/dataset and all-anchor scans should only run after cheap high-confidence sources fail and only when enforcement is active. | `GATE` |
| Channel metadata cache trust and mutation | `js/content/dom_extractors.js:625-671`, `js/content/dom_extractors.js:899-913` | Trusts/removes cached channel attrs based on current href compatibility, then writes current handle/id attrs. | Good stale-cache protection, but the cache value has no source, confidence, video ID, route, or timestamp. A future bug cannot explain why a destructive decision trusted it. | `REWRITE` stamp schema |
| Broad text fallback | `js/content/dom_extractors.js:881-889` | Reads `innerText` from cache target, element, and related elements. | This is the highest identity false-positive and performance risk in this file. `innerText` can force layout, and arbitrary titles/descriptions can mention `@handle` that is not the owner. | `GATE` or remove from destructive paths |
| Cache clear helper | `js/content/dom_extractors.js:916-936` | Removes channel handle/id from root and descendants. | Useful cleanup primitive, but narrower than the stale video cleanup vocabulary. It clears only channel attrs, not source/confidence attrs because those do not exist yet. | `KEEP` + expand schema |
| Style injector | `js/content/dom_helpers.js:11-57` | Injects `.filtertube-hidden`, `.filtertube-hidden-shelf`, and pending shimmer CSS into the page. | Correct central CSS model. The danger is older CSS files and direct inline writers, not this helper. | `KEEP` |
| Central hide/show helper | `js/content/dom_helpers.js:67-149` | Adds/removes classes, attrs, inline display; records tracker; increments/decrements stats; pauses/restores media. | This is the correct single visual hide path, but it currently combines DOM visibility, local stats, debug tracking, and playback side effects. | `KEEP` + split effects |
| Container visibility helper | `js/content/dom_helpers.js:154-206`; called at `js/content/dom_fallback.js:4341` | Hides shelves/containers when all children are hidden. | Necessary for visual gaps, but it can create second-order hides. It removes class/attr but not inline display when restoring a directly hidden container. | `FIX` restore parity |

Extractor/helper disease findings:

| Disease | Proof | Why it matters |
| --- | --- | --- |
| Extraction and mutation are mixed | `ensureVideoIdForCard()` writes IDs and clears hidden/block/collab state while returning an ID: `js/content/dom_extractors.js:96-205`; `extractChannelMetadataFromElement()` writes/removes channel attrs: `js/content/dom_extractors.js:656-660`, `js/content/dom_extractors.js:899-910`. | Callers cannot know whether asking "what card is this?" also changed page visibility or identity state. This makes false-hide debugging harder. |
| Low-confidence identity can become destructive | Broad text fallback reads `innerText`: `js/content/dom_extractors.js:881-889`; fallback decision later can hide through `toggleVisibility()`: `js/content/dom_fallback.js:3929`. | A title/description mentioning a handle can become a channel identity if call-site context is broad enough. Destructive channel decisions need high-confidence identity or user confirmation. |
| Helper side effects are too broad | `toggleVisibility()` calls `incrementHiddenStats()` and `handleMediaPlayback()`: `js/content/dom_helpers.js:97-107`, `js/content/dom_helpers.js:135-147`; `handleMediaPlayback()` pauses media/movie player: `js/content_bridge.js:3738-3776`. | A visual hide, pending hide, cleanup hide, or container hide can become a stats write or playback pause unless every caller gets `skipStats` and target selection right. |
| Stale cleanup vocabulary is duplicated | Cleanup attrs in `ensureVideoIdForCard()`: `js/content/dom_extractors.js:130-166`, `js/content/dom_extractors.js:171-199`; fallback cleanup elsewhere: `js/content/dom_fallback.js:2001-2032`, `js/content/dom_fallback.js:2304-2323`. | Different cleanup paths clear different attrs/classes/inline display. This can leave content hidden or wrongly unhidden after SPA recycling. |
| Broad selector changes amplify globally | `VIDEO_CARD_SELECTORS` is consumed by content bridge/fallback paths, including whole-document scans: `js/content_bridge.js:5814-5819`, `js/content/dom_fallback.js:2327-2328`. | Selector additions should require a route/surface proof table because they affect performance and quick-block/menu behavior everywhere. |

Target helper split:

```text
readDomIdentity(element, route) -> {
  videoId,
  channel,
  title,
  source,
  confidence,
  touchedDom: false
}

repairRecycledNode(element, previousIdentity, currentIdentity) -> {
  clearedAttrs,
  clearedInlineDisplay,
  reason: "recycled-node-id-mismatch"
}

applyVisibilityDecision(element, decision) -> {
  visual: hide/show,
  stats: count/skip,
  media: pause/skip,
  reason,
  writerId
}
```

Hard invariant: the normal filter path should call the pure identity reader first. DOM mutation should happen only through a named repair or apply step with a writer ID.

Target extractor result:

```text
extractChannelMetadataFromElement(...) -> {
  handle,
  id,
  customUrl,
  source: "href" | "renderer-data" | "dataset" | "attribute" | "text-fallback" | "cache",
  confidence: "high" | "medium" | "low",
  matchedNodeTag,
  matchedHref
}
```

Filtering should only treat `low` confidence identity as authoritative when the action is user-confirmed or a stronger JSON/UC mapping has arrived.

### DOM Hide Writer And Restore Ledger

DOM review found a separate disease from selector breadth: multiple hide writers exist, and not every writer has a matching restore that clears classes, attributes, and inline styles.

| Writer / cleanup path | Proof | Risk | Required invariant |
| --- | --- | --- | --- |
| Central hide writer | `toggleVisibility()` adds `filtertube-hidden`, `data-filtertube-hidden`, and inline `display:none!important` (`js/content/dom_helpers.js:67-96`). | Any restore must clear all three. | Every hide reason must have a same-scope restore that removes class, attrs, and inline display. |
| Container restore | `updateContainerVisibility()` removes shelf classes/attrs when children become visible (`js/content/dom_helpers.js:197-204`). | It does not remove inline `display` if the container was directly styled hidden elsewhere. | Container restore must clear inline display when it clears hidden state. |
| Playlist card direct writer | `hidePlaylistCards` directly sets `display:none!important` on lockups, shelves, and horizontal lists (`js/content/dom_fallback.js:2253-2277`). | No local off-switch restore exists for this toggle when other fallback work remains active. | Direct writers should be replaced by `toggleVisibility()` with reason-specific restore, or have explicit off cleanup. |
| Stale-card cleanup, generic path | Recycled card cleanup removes FilterTube attrs/classes (`js/content/dom_extractors.js:130-166`). | This path does not clear inline `display`; a recycled card can remain visually hidden. | Any stale-card cleanup that clears `filtertube-hidden` must also remove inline display. |
| Stale-card cleanup, cached-id mismatch | Cached-id mismatch cleanup clears more state after detecting id mismatch (`js/content/dom_extractors.js:171-178` and following). | Confirms generic cleanup path is incomplete by comparison. | Unify stale cleanup through one helper. |
| Whitelist pending stat conversion | Pending hidden item can later be counted if already hidden and pending (`js/content/dom_helpers.js:70-78`). | Stats can depend on timing/order of pending -> final hide. | Hide stats must be counted exactly once per stable content id and reason. |
| `innerText` fallback | Extractor can scan `cacheTarget.innerText`, `element.innerText`, and related element text (`js/content/dom_extractors.js:881-886`). | Broad selectors plus `innerText` can force layout and infer low-confidence handles. | `innerText` fallback must be rare, instrumented, and never the only basis for destructive identity. |

Restore invariant:

```text
hide(element, reason)
  -> record writer id
  -> class + attrs + inline display
restore(element, writer id or stale identity)
  -> remove class + attrs + inline display
  -> decrement/count only if that writer recorded a counted hide
```

## Subsystem D - Quick Block, 3-Dot Menus, Fetches, And Identity

### User Interaction Verdict

Most FilterTube UI affordances do not click YouTube content accidentally:

- Quick block button suppresses propagation before action: `js/content/block_channel.js:1406-1408`.
- Injected menu item interaction suppresses propagation: `js/content_bridge.js:10867-10868`.
- Quick block immediate hide stores rollback state before confirmation path: `js/content_bridge.js:11633-11663`.

The exception class is intentional playlist navigation:

- `targetLink.click()` in playlist skip guard: `js/content/dom_fallback.js:2396`.
- `nextBtn.click()` on ended playlist guard: `js/content/dom_fallback.js:2434`.

Verdict: `INSTRUMENT`. These should emit debug counters and should eventually become confidence-gated or replaced with pause/overlay behavior where possible.

### Native Dropdown And Fallback Menu Observer Audit

There are two menu-injection systems loaded in the content runtime:

```text
js/content/block_channel.js
  -> observes native YouTube dropdowns
  -> injects FilterTube block item into YouTube menu

js/content_bridge.js
  -> injects FilterTube fallback menu buttons/popovers for surfaces without a usable native menu
  -> also owns newer collaboration/multi-step menu state
```

| Path | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Legacy/native dropdown click listener | `js/content/block_channel.js:1675-1700` | Captures all common YouTube 3-dot menu clicks and tries injection after 150ms. | Runs even on empty blocklist because setup starts unconditionally after 1s. | `GATE` |
| Dropdown visibility observers | `js/content/block_channel.js:1702-1732` | Adds a MutationObserver per dropdown for `style`, `aria-hidden`, and `hidden`. | Correct for dropdown race handling, but no global shutdown contract. | `INSTRUMENT` |
| Body dropdown observer | `js/content/block_channel.js:1746-1785` | Observes all added DOM nodes to find dropdowns. | Empty-install and no-menu sessions still pay mutation observer overhead. | `GATE` |
| Per-card removal observer | `js/content/block_channel.js:2292-2308` | Watches the card parent and closes dropdown if the card disappears. | Good cleanup behavior after hide. | `KEEP` |
| Per-dropdown close observer | `js/content/block_channel.js:2310-2327` | Cancels pending dropdown fetches when `aria-hidden` changes. | Good cancellation contract, but only checks `aria-hidden`, not all hidden/remove paths. | `KEEP` + `TEST` |
| Unconditional boot | `js/content/block_channel.js:2358-2397` | Starts menu observer and quick-block observer after 1 second. | This is one of the strongest empty-install lag candidates. | `REWRITE` active predicate |
| Fallback menu scanner | `js/content_bridge.js:6498-6557` | Broadly scans playlist, mobile, Shorts, and comment card selectors and appends fallback buttons. | This is valuable for missing native menus, but should not scan unless block-menu UI is enabled and blocklist actions are allowed. | `GATE` |
| Fallback menu observer/listeners | `js/content_bridge.js:6563-6624` | Body MutationObserver, navigation listener, click listener, scroll listener, and warmup interval. | Layered wakeups can run independently of actual filtering rules. | `REWRITE` owned lifecycle |
| Injected menu wait observers | `js/content_bridge.js:10295-10404` | Waits up to 2 seconds for YouTube menu structure with child/attribute observers. | Correct for a user-opened menu, acceptable because user initiated. | `KEEP` |
| Menu click suppression | `js/content_bridge.js:10854-10891` | Prevents native menu item click propagation before FilterTube block action. | Correct; protects against accidental YouTube engagement. | `KEEP` |

Menu invariant:

```text
Native dropdown observer:
  may start only if showBlockMenuItem === true
  and listMode !== "whitelist"
  and current route/surface supports block actions.

Fallback menu scanner:
  may start only if native menu coverage is missing for that surface
  and the user-visible menu affordance is enabled.

Quick block:
  may start only if showQuickBlockButton === true
  and listMode !== "whitelist"
  and the surface is not covered by native app controls.
```

This does not remove menu features. It changes ownership: UI affordance observers should be owned by the affordance flag, not by the general filtering runtime.

### Fallback Menu Action Path Ledger

This pass separates the fallback menu lifecycle from the actual fallback block action. The block action is user-initiated; the scanner that creates the action is not.

```text
initializeDOMFallback()
  -> ensureFallbackMenuButtons()
      -> document-wide scan
      -> body MutationObserver
      -> yt-navigate-finish listener
      -> document click listener
      -> window scroll listener
      -> warmup interval
      -> create fallback button
          -> open fallback popover on user click
              -> performBlock()
                  -> addChannelDirectly()
                  -> background handleAddFilteredChannel()
                  -> immediate local hide
                  -> force DOM fallback reprocess
```

| Step | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Fallback menu scanner boot | `js/content_bridge.js:5724-5727`, `js/content_bridge.js:6061-6069` | DOM fallback initialization calls `ensureFallbackMenuButtons()` after settings load. The function only checks prior installation and native overlay quiet mode. | `showBlockMenuItem:false`, empty blocklist, and whitelist mode are not lifecycle gates for the scanner. | `REWRITE` |
| Fallback button selector sweep | `js/content_bridge.js:6498-6514` | Every scan queries playlist rows, lockup view models, mobile cards, Shorts lockups, and comment renderers. | Broad DOM query cost exists even if there are no filter rules and no user intent to open a menu. | `GATE` |
| Fallback wakeups | `js/content_bridge.js:6563-6624` | Installs body mutation observer, navigation listener, document click listener, window scroll listener, and eight warmup scans. | Layered wakeups can compete with YouTube hydration and scrolling. | `REWRITE` owned lifecycle |
| Normal native menu affordance gate | `js/content_bridge.js:10094-10099` | Primary injected menu item returns in whitelist mode or when `showBlockMenuItem === false`. | Good action predicate, but it applies only after a native YouTube menu is opened. | `KEEP` |
| Fallback affordance missing equivalent gate | `js/content_bridge.js:6403-6423`, `js/content_bridge.js:7068-7079`; executable fixtures in `tests/runtime/dom-target-source-current-behavior.test.mjs` | Fallback buttons and rows are created without checking `currentSettings.listMode` or `currentSettings.showBlockMenuItem`. | The fallback UI can expose block actions when the primary menu path would suppress them. | `FIX` |
| User-click fallback popover | `js/content_bridge.js:6650-7260` | Opens a FilterTube popover, observes row attributes while open, and closes on outside click. | Acceptable because it is user-driven; row observer cleanup exists on close. | `KEEP` |
| Immediate fallback hide | `js/content_bridge.js:6846-6858`, `js/content_bridge.js:7034-7046` | On success, marks the clicked row as blocked, sets `display:none`, adds `.filtertube-hidden`, refreshes settings, and forces DOM fallback. | Valid UX, but this is another direct hide writer outside the central helper and should be reason/counter tracked. | `CONSOLIDATE` |
| Watch playlist handoff | `js/content_bridge.js:6923-6945`, `js/content_bridge.js:7012-7031` | Watch playlist fallback tries to reuse `handleBlockChannelClick()` for stronger identity recovery. | Good correctness move; must remain action-only because it can trigger watch/video resolver paths. | `KEEP` |
| Background add channel path | `js/content_bridge.js:12792-12839`, `js/background.js:5218-5247`, `js/background.js:5276-5485` | Content sends `addFilteredChannel`; background normalizes handles/UC/custom URLs and may resolve `watch:`/`shorts:` video IDs. | Correct for explicit block action, but should not be reachable from passive identity scans. | `KEEP` + provenance |
| Auto-backup duplication | `js/content_bridge.js:12825-12831`, `js/background.js:5237-5244` | Content schedules auto-backup after success, and background also schedules auto-backup after success. | Duplicate backup scheduling after one action is possible unless debounced elsewhere. | `VERIFY` |

Fallback menu invariant:

```text
showBlockMenuItem === false
  -> no native menu injection
  -> no fallback menu scanner
  -> no fallback button
  -> no fallback block popover

listMode === "whitelist"
  -> no block-menu affordance unless a future allow/block dual-mode explicitly replaces this contract
```

Current verdict: fallback action identity recovery is useful and should be kept, but the fallback scanner is part of the empty-install/empty-rule disease. It must be gated by UI affordance state and route support before installation, not merely no-op after finding cards.

### Quick Block Lifecycle And Action Ledger

`js/content/block_channel.js` has good local checks before adding a quick-cross button, but the subsystem itself still boots globally after one second. The correct audit distinction is:

```text
Action gate: is a quick-block button/action allowed right now?
Observer gate: should the quick-block subsystem install document/window observers at all?
```

The action gate mostly exists. The observer gate does not.

| Path | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Global state and queues | `js/content/block_channel.js:16-87` | Tracks Kids menu context, injected dropdowns, pending Shorts/watch/dropdown fetches, quick-block timers, and overlay selectors. | Central mutable state spans Kids, native menu, quick-block, and dropdown fetches. Needs a lifecycle owner. | `INSTRUMENT` |
| Whitelist action gate | `js/content/block_channel.js:28-34`, `js/content/block_channel.js:808-817`, `js/content/block_channel.js:2119-2122` | Quick-block and menu injection are disabled in whitelist mode. | Correct current UX, but observers still boot and keep checking. | `GATE` observer boot |
| Surface/overlay detection | `js/content/block_channel.js:106-228` | Detects mobile, hover-capable desktop, search overlays, YouTube overlays, and toggles root attributes. | Necessary for avoiding visible UI overlap, but it uses DOM scans and geometry checks on focus/click/scroll/resize. | `INSTRUMENT` |
| Quick-block host/target/anchor resolver | `js/content/block_channel.js:230-438` | Resolves mobile watch-next cards, posts, Shorts, host cards, hide target, and renderable anchors. | Broad selector/ancestor logic; should share selector inventory with DOM extractor docs and fixtures. | `KEEP` + fixture |
| Occlusion sampling | `js/content/block_channel.js:462-632` | Samples fixed top/bottom surfaces with `querySelectorAll()` and `elementsFromPoint()` to hide quick-cross near UI chrome. | Good UI safety fix, but expensive when called from scroll/resize/pointer loops. | `INSTRUMENT` |
| Viewport state scheduler | `js/content/block_channel.js:655-696` | Updates all `.filtertube-quick-block-host` elements in RAF. | Should not run if quick-block disabled or no quick-block hosts exist. | `GATE` |
| Hover sticky timers | `js/content/block_channel.js:698-760` | Stores per-host timers for hover/sticky visibility. | Good UX, but timers can accumulate on recycled nodes unless host cleanup is measured. | `INSTRUMENT` |
| Quick-block card selectors | `js/content/block_channel.js:762-806` | Includes desktop, mobile, Kids, playlist, Shorts, radio, lockup, and channel surfaces. | Broad selector set expands every sweep and mutation pass. | `KEEP` + route scope |
| Quick-block enabled check | `js/content/block_channel.js:808-817` | Requires settings, `showQuickBlockButton === true`, and non-whitelist mode. | Correct action predicate; should be lifted to boot predicate before installing observers. | `KEEP` |
| Style injection | `js/content/block_channel.js:819-930` | Injects quick-cross CSS and root mobile/search/overlay attributes. | Should only run when quick-block affordance can be enabled. | `GATE` |
| Button removal | `js/content/block_channel.js:932-939`, `js/content/block_channel.js:1435-1439`, `js/content/block_channel.js:1607-1610` | Removes buttons when quick-block is disabled. | Good cleanup after boot, but still requires observers to run to notice disabled state. | `KEEP` |
| Quick-block context builder | `js/content/block_channel.js:951-1104` | Extracts collaborators, channel info, Shorts/watch video IDs, and video-channel map identity for a card. | Duplicates metadata extraction and may set `needsFetch` for Shorts. Must emit evidence/confidence. | `CONSOLIDATE` |
| Quick-block action info | `js/content/block_channel.js:1106-1138` | Converts collaborators into single-channel or Block All action target. | Correct for collaboration UX; needs cap/confirmation policy for >6 collaborators. | `KEEP` |
| Quick-block fallback metadata/input | `js/content/block_channel.js:1140-1168` | Converts target evidence into `id`, `customUrl`, `handle`, `watch:<id>`, or `shorts:<id>`. | `watch:`/`shorts:` causes background resolution; valid for user action, not passive scans. | `KEEP` + side-effect log |
| Fallback channel add | `js/content/block_channel.js:1170-1222` | Calls `addChannelDirectly()` or sends `addFilteredChannel` to background with metadata/profile. | User-initiated action path. Should record exact target/source/confidence in future action schema. | `KEEP` |
| Optimistic immediate hide | `js/content/block_channel.js:1224-1237` | Marks target pending/blocked, sets `display:none`, `.filtertube-hidden`, and `data-filtertube-hidden`. | Direct hide writer outside `toggleVisibility()`; valid only after action success and should be rollback-aware. | `CONSOLIDATE` |
| Quick-block action runner | `js/content/block_channel.js:1239-1270` | Builds context, dispatches action, applies fallback immediate hide, and schedules DOM fallback after 120ms. | Good user flow; needs reason counters and failure rollback proof. | `INSTRUMENT` |
| Per-card hover listeners | `js/content/block_channel.js:1273-1427` | Adds hover/focus/listener sets to host, anchor, wrapper, and trigger. | Correct for visible affordance but large per-card listener footprint. | `INSTRUMENT` |
| Sweep scheduler | `js/content/block_channel.js:1435-1452` | Debounces quick-block card scan by 80ms and calls `querySelectorAll(QUICK_BLOCK_CARD_SELECTORS)`. | Should not run in no-op/disabled quick-block sessions. | `GATE` |
| Quick-block observer boot | `js/content/block_channel.js:1454-1664` | Injects styles, initial sweep, focus/input/click/scroll/resize/orientation/pointer listeners, body mutation observer, and 1.8s interval. | Strong empty-install lag source. Local action gate exists, but observer boot is unconditional. | `REWRITE` lifecycle |
| Pointer tracking loop | `js/content/block_channel.js:1493-1604` | Desktop hover fix uses `pointermove`, `elementsFromPoint`, host fallback scan, and RAF. | Useful for hover reliability; expensive unless quick-block is visible/enabled. | `GATE` |
| Body mutation observer | `js/content/block_channel.js:1607-1649` | Watches all body child/subtree changes and either removes buttons or ensures buttons on added cards. | Should not be installed unless quick-block is enabled and non-whitelist. | `GATE` |
| Periodic sweep | `js/content/block_channel.js:1651-1655` | Sweeps all cards every 1.8s. | High-confidence performance risk on old devices and empty installs. | `REWRITE` |
| Unconditional delayed boot | `js/content/block_channel.js:2358-2397` | Calls `setupMenuObserver()` and `setupQuickBlockObserver()` after one second. | This is the lifecycle root of the quick-block/native-menu empty-install cost. | `REWRITE` active predicate |

Quick-block boot invariant:

```text
Only install quick-block observers when:
  currentSettings.showQuickBlockButton === true
  currentSettings.listMode !== "whitelist"
  extension enabled !== false
  surface is not handled by native app controls
  route/surface supports quick block

If those conditions become false:
  remove buttons
  disconnect mutation observer
  remove or ignore global listeners
  clear periodic sweep
```

Because DOM event listeners cannot all be cleanly removed without stored handler references, the remediation should introduce a single owner object:

```text
QuickBlockLifecycle {
  start(settings, surface)
  stop(reason)
  refresh(settings, route)
  counters: { sweeps, scannedCards, buttonsAdded, buttonsRemoved, pointerTicks }
}
```

### Kids Native Block Sync Ledger

The Kids path is different: it does not inject a custom menu item. It listens for native Kids block actions and mirrors them into the Kids profile.

| Path | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Kids branch in menu observer | `js/content/block_channel.js:1669-1673` | On YouTube Kids, skips desktop menu injection and starts passive Kids listener. | Correct platform split. | `KEEP` |
| Kids click listener | `js/content/block_channel.js:1797-1815` | Tracks Kids menu button context and catches native "Block this video/channel" menu item clicks. | User-initiated, acceptable. Needs proof against duplicate handling. | `KEEP` |
| Kids toast observer | `js/content/block_channel.js:1817-1840` | Watches body mutations for blocked toast fallback. | Useful fallback, but body observer is global on Kids. Should be scoped to Kids only, which it is through branch. | `KEEP` + `INSTRUMENT` |
| Kids context capture | `js/content/block_channel.js:1843-1964` | Extracts video ID, UC ID, handle, custom URL, channel name from card, watch URL, channel page, or owner link. | Several fallbacks are name-only or label-derived; should emit confidence. | `INSTRUMENT` |
| Kids dedup/throttle | `js/content/block_channel.js:1966-2024` | 1s throttle, 10s dedup set by video/channel/name key. | Good duplicate protection. | `KEEP` |
| Kids background mutation | `js/content/block_channel.js:2037-2060` | Sends `FilterTube_KidsBlockChannel` with video/channel metadata. | User-action path; requires trusted sender and target profile proof in background audit. | `INSTRUMENT` |

Kids invariant:

```text
Kids native sync may listen to native block actions,
but should not independently infer and block content without a user click/toast from YouTube Kids.
Name-only Kids channel entries should be visibly marked lower confidence or resolved to UC ID when possible.
```

### Metadata Builder Consolidation Candidates

The channel/block menu pipeline contains multiple independent metadata builders and extractors. Some duplication is intentional because each surface has different evidence, but the current code makes it hard to prove that quick-block, native 3-dot, fallback menu, comments, playlist rows, and Shorts resolve the same channel the same way.

| Function/path | Proof | Role | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `buildChannelMetadataPayload` | `js/content_bridge.js:119-191` | Builds background payload for block/add actions. | Good central shape; should become the only action payload builder. | `KEEP` + `CONSOLIDATE` |
| `pickMenuChannelDisplayName` | `js/content_bridge.js:195-280` | Chooses menu label while avoiding low-confidence expected names. | Good UX guard; should share confidence model with filtering. | `KEEP` |
| `hydrateChannelInfoFromCurrentMappings` | `js/content_bridge.js:280` onward | Repairs channel info from existing maps/settings. | Needed, but map provenance/freshness missing. | `KEEP` + `INSTRUMENT` |
| Quick-block fallback metadata | `js/content/block_channel.js:1043-1191` | Builds metadata for quick-block actions and collaborators. | Duplicates content_bridge metadata construction. | `CONSOLIDATE` |
| Fallback playlist metadata | `js/content_bridge.js:6705-7175` | Builds menu rows and payloads for playlist fallback popover. | Correctly handles hard surfaces, but has separate metadata source decisions. | `CONSOLIDATE` |
| DOM card extractor | `js/content_bridge.js:8561` onward and `js/content/dom_extractors.js:472-673` | Extracts channel identity from live DOM. | Two extraction stacks can disagree on confidence/source. | `REWRITE` shared result |
| JSON candidate builder | `js/filter_logic.js:1712-1789`, `js/filter_logic.js:2896-3211` | Extracts renderer title/channel/metadata for JSON decisions. | Returns booleans/strings, not shared identity-confidence objects. | `REWRITE` shared result |

Target shared shape:

```text
ChannelEvidence {
  id,
  handle,
  customUrl,
  name,
  logo,
  videoId,
  source: "json" | "dom" | "mainworld" | "background-fetch" | "user-input" | "map",
  confidence: "uc-id" | "handle" | "custom-url" | "mapped-id" | "name-only" | "unknown",
  route,
  rendererType,
  surface,
  stale: boolean
}
```

Then all block/allow actions can consume the same evidence model:

```text
extract evidence
  -> validate confidence for action
  -> build action payload
  -> optimistic hide only if action is user-initiated
  -> background confirms
  -> storage writes one canonical channel row
```

This is the main way to reduce code burden without weakening hard-won surface coverage.

### Fetch/Identity Risk Classes

| Source | Example proof | Verdict | Reason |
| --- | --- | --- | --- |
| Main-world inline/JSON identity | `js/seed.js:606-820`, `js/filter_logic.js` | `KEEP` | Best source because it rides responses already requested by YouTube. |
| Content-side watch/shorts fetches | `js/content_bridge.js:8123`, `js/content_bridge.js:8272` | `GATE` | Extra page fetches are useful for identity but should be avoided when JSON maps already know the channel. |
| Background watch/shorts/channel fetches | `js/background.js:2889-2893`, `js/background.js:3005-3009`, `js/background.js:3098-3102`, `js/background.js:4617-4620`, `js/background.js:4784-4791` | `INSTRUMENT` | Most privacy/engagement-sensitive identity source; must record when used and why. |
| Handle resolver network fetch | `js/content/handle_resolver.js:149-282`, especially `js/content/handle_resolver.js:237-244` | `GATE` | Reads channel pages from content context; should prefer maps/background and should not run on empty/no-op sessions. |
| Shared identity canonicalization | `js/shared/identity.js:46-188` | `KEEP` | Central handle/UC/custom URL parsing is the right shared primitive. |
| Name-only channel matching | `js/shared/identity.js:390-399`, `js/shared/identity.js:453-468` | `REWRITE` | Name-only is low confidence and should not drive strict whitelist/block decisions unless user explicitly chose a name-only rule. |
| Video/channel maps | `js/content_bridge.js`, `js/background.js` mapping paths | `KEEP` + `INSTRUMENT` | Good bridge between JSON and DOM, but needs staleness policy. |

Identity confidence target:

```text
UC channel ID          -> high confidence
UC ID + handle/name    -> highest confidence
@handle/custom URL     -> medium/high if resolved
videoId -> channel map -> high if fresh
watch/shorts fetch     -> high identity, higher side-effect risk
channel display name   -> low confidence
unknown identity       -> never block in blocklist by channel; whitelist behavior must be explicit
```

### Identity Resolver Direction

The safe identity ladder should be:

```text
1. Renderer UC channel ID from JSON response already requested by YouTube.
2. VideoId -> channelId map learned from JSON/player data.
3. @handle/custom URL mapped locally to UC ID.
4. Main-world ytInitialData lookup for the active SPA page.
5. Background fetch resolver only when user explicitly performs a block/add action or when active strict filtering needs a missing ID.
6. Name-only fallback only for user-created name-only entries, never for silently inferred strict matches.
```

The product should not treat every missing identity as permission to fetch YouTube pages. That is where we reduce both lag and possible recommendation side effects without weakening the actual blocker.

### `FilterTubeIdentity` Method Table

`js/shared/identity.js` is the right long-term home for pure identity logic because it is loaded in isolated content scripts, main-world injection, and background service worker contexts (`js/shared/identity.js:1-17`).

| Method | Proof | Role | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `extractRawHandle` | `js/shared/identity.js:46-85` | Extracts display `@handle` from strings/URLs, preserves case. | Good low-level primitive. | `KEEP` |
| `normalizeHandleValue` / `normalizeHandleForComparison` | `js/shared/identity.js:92-117` | Produces lowercase comparison key. | Good primitive. | `KEEP` |
| `normalizeUcIdForComparison` / `isUcId` | `js/shared/identity.js:119-140` | Canonical UC ID recognition. | Good primitive. | `KEEP` |
| `canonicalizeChannelInput` | `js/shared/identity.js:147-188` | Classifies user input as UC ID, handle, or unknown. | Should become the only UI import entry normalization path. | `KEEP` + `CONSOLIDATE` |
| `normalizeCustomUrlForComparison` | `js/shared/identity.js:214-239` | Normalizes `c/...` and `user/...` URLs. | Good primitive, but custom URLs should be resolved when possible. | `KEEP` |
| `buildChannelFilterIndex` | `js/shared/identity.js:254-370` | Builds sets for IDs, handles, custom URLs, names, stable names, name-only names. | Name-only and stable-name fallback are mixed into the same index contract. | `REWRITE` confidence model |
| `channelMetaMatchesIndex` | `js/shared/identity.js:372-418` | Fast index match against runtime channel metadata. | Lines `390-399` allow name-only matching; this must be explicit and low-confidence. | `REWRITE` |
| `channelMatchesFilter` | `js/shared/identity.js:424-585` | Legacy/individual filter-channel matcher. | Lines `453-468` cross-match names and handle-without-at; useful, but dangerous for strict whitelist unless rule origin is name-only. | `REWRITE` |
| `fastExtractIdentityFromHtmlChunk` | `js/shared/identity.js:670-740` | Extracts owner/channel identity from already-fetched HTML chunks. | Acceptable when parsing a response already fetched for an allowed reason. Should not itself trigger fetches. | `KEEP` |
| `isChannelBlocked` | `js/shared/identity.js:773-780` | Convenience wrapper over index/per-entry matcher. | Should expose match confidence/reason, not only boolean, for auditing. | `REWRITE` |

Required future identity result shape:

```text
matchChannel(meta, rule) -> {
  matched: boolean,
  confidence: "uc-id" | "handle" | "custom-url" | "mapped-id" | "name-only" | "none",
  ruleSource: "user-id" | "user-handle" | "user-custom-url" | "user-name" | "imported" | "inferred",
  reason: string
}
```

This is necessary for whitelist correctness. A low-confidence name match should not have the same authority as a UC channel ID match unless the user explicitly created a name-only rule.

### `handle_resolver.js` Method Table

`js/content/handle_resolver.js` is isolated-world glue around the shared identity primitives. It also performs network resolution, so it must be under the side-effect budget.

| Method | Proof | Role | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `persistChannelMappings` | `js/content/handle_resolver.js:25-48` | Writes handle/ID mappings to background and current settings. | Good cache path; needs source/reason instrumentation. | `KEEP` + `INSTRUMENT` |
| `extractRawHandle` / `normalizeHandleValue` | `js/content/handle_resolver.js:58-123` | Delegates to `FilterTubeIdentity` when available, fallback duplicate otherwise. | Duplicate fallback should stay only for load-order resilience. | `KEEP` |
| `scheduleDomFallbackRerun` | `js/content/handle_resolver.js:136-147` | Reruns DOM fallback after handle resolution. | Must be gated by active enforcement; today it can force reprocess after resolver success. | `GATE` |
| `fetchIdForHandle` map lookup | `js/content/handle_resolver.js:149-189` | Checks cache and persisted `channelMap` before network. | Correct order. | `KEEP` |
| `fetchIdForHandle` background-only branch | `js/content/handle_resolver.js:200-229` | Delegates to background `fetchChannelDetails`. | Side-effectful; only allowed with reason. | `INSTRUMENT` |
| `fetchIdForHandle` content fetch branch | `js/content/handle_resolver.js:231-281` | Fetches `/@handle/about` or `/@handle` and parses UC ID. | High cost/risk in content context; should be disabled in no-rule sessions and avoided when JSON maps are enough. | `GATE` |

### `handle_resolver.js` Side-Effect Contract - 2

This file is small, but it is a correctness boundary because learned handle/id mappings influence future block and whitelist decisions.

| Method / block | Proof | Current behavior | Disease risk | Required invariant |
| --- | --- | --- | --- | --- |
| `persistChannelMappings()` | `js/content/handle_resolver.js:25-48` | Sends `updateChannelMap` to background, then mutates `currentSettings.channelMap` in-place. | A learned map can affect current-page matching before the next background-compiled settings revision. That blurs "runtime settings" with "learned cache overlay". | Map writes must be background-owned, no-op checked, provenance tagged, and consumed as a separate learned-map overlay. |
| Shared identity fallback | `js/content/handle_resolver.js:58-123` | Delegates to `window.FilterTubeIdentity` when present, otherwise uses duplicate local parsing. | Duplication is acceptable for load-order resilience, but parser drift would create handle mismatch bugs. | Keep fallback, but add identity parser fixtures that run against both shared and local implementations. |
| Forced fallback rerun | `js/content/handle_resolver.js:136-147`, `218-224`, `263-274` | Successful handle resolution schedules `applyDOMFallback(currentSettings, { forceReprocess: true })`. | A passive identity lookup can wake a full DOM reprocess. On empty/no-op installs this must not happen, and on active sessions it must carry a reason. | Rerun only when an active rule was waiting on that exact identity; record `resolvedHandle`, `reason`, and affected node count. |
| Cache sentinel | `js/content/handle_resolver.js:155-183`, `191-193`, `276-279` | Uses `PENDING` sentinel to avoid duplicate resolution loops and returns `null` to callers while pending. | Good loop guard, but there is no age, route, or requester metadata. | Cache entries need `{state,id,createdAt,requester,reason}` so stale failures do not suppress later user actions silently. |
| Map-first lookup | `js/content/handle_resolver.js:165-179` | Reads persisted `channelMap` before network. | Correct ordering; still reads storage on demand from content context. | Keep, but count lookups and skip entirely when no active channel rule or user action needs UC resolution. |
| Background-only branch | `js/content/handle_resolver.js:200-229` | Sends `fetchChannelDetails` to background, posts `FilterTube_UpdateChannelMap`, then schedules DOM fallback rerun. | Despite the name, this can still fetch channel HTML in background and then wake DOM fallback. | Allowed for user action or active unresolved rule only; never for broad warmup/no-rule passes. |
| Content fetch branch | `js/content/handle_resolver.js:231-281` | Fetches `/<handle>/about` and `/<handle>`, parses `channel/UC...`, posts map update. | This competes with YouTube navigation and is the least controlled identity path. | Prefer JSON, stamped DOM, `videoChannelMap`, then background fetch; content fetch should be a last-resort user-action path. |

Side-effect flow:

```text
DOM card with @handle
  -> fetchIdForHandle()
     -> channelMap lookup
     -> optional background/content fetch
     -> post FilterTube_UpdateChannelMap
     -> mutate currentSettings.channelMap
     -> force DOM fallback rerun
```

Target flow:

```text
DOM card with @handle
  -> rule engine asks: "is a UC id required for this active decision?"
  -> resolver returns {id, confidence, source, asyncState}
  -> background records learned map with provenance
  -> only affected pending nodes re-evaluate
```

Disease summary: `handle_resolver.js` is not the main empty-install lag by itself, but it is a multiplier. Once another layer asks for identity, resolver success can mutate runtime maps and wake a forced DOM pass. That is acceptable for a precise pending rule decision; it is not acceptable as a passive enrichment side effect.

### Collaboration / Prompt / Menu Lifecycle Ledger - 1

These smaller content files are not the core rule engine, but they install page-level UI affordances and must be audited because "no rules" must mean "quiet runtime".

| File / method | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `scheduleCollaboratorRefresh()` | `js/content/collab_dialog.js:29-36` | Debounces and calls `applyDOMFallback(null, { preserveScroll: true, forceReprocess: false })`. | Collaboration data resolution can wake DOM fallback without an active channel rule proof in this file. | `GATE` by active collaboration-relevant rule or open FilterTube menu. |
| Collaboration trigger listeners | `js/content/collab_dialog.js:75-80`, startup `333-336` | Installs capture-phase `click` and `keydown` listeners on every YouTube page after DOMContentLoaded. | Low per-event cost, but still not quiet; it should not exist on empty installs unless collaboration/channel affordance is enabled. | `LAZY-INSTALL` |
| Collaboration dialog observer | `js/content/collab_dialog.js:306-329`, startup `333-336` | Installs a document-wide `MutationObserver` watching all added nodes for `tp-yt-paper-dialog`. | Global observer is unnecessary until a pending collaboration card exists or menu action requested enrichment. | `LAZY-INSTALL` + disconnect after pending map empty. |
| Pending collaboration card queue | `js/content_bridge.js:3124-3169` | Marks cards `data-filtertube-collab-awaiting-dialog`, stores entries in `window.pendingCollabCards`, clears after 20s. | Correctly time-bounded, but queue creation happens inside broader extraction/menu flows; needs count cap and route proof. | `KEEP` + counters. |
| Main-world collaborator request | `js/content_bridge.js:3242-3297` | Marks element requested, calls main-world collaborator lookup, retries up to 3 times. | Good for collaboration UI, too expensive as passive scan. | `GATE` by user-opened menu or active channel rule needing collaborator identity. |
| Resolved collaborator writeback | `js/content_bridge.js:3298-3392` | Stamps all cards with same `data-filtertube-video-id`, updates resolved map, refreshes active menu, calls forced DOM fallback with timeout 0. | This is another DOM fallback wake path. It should re-evaluate only cards whose decision waited on collaborator identity. | `REWRITE` from global fallback to targeted pending-node scheduler. |
| Dialog broadcast receiver | `js/content_bridge.js:5673-5700` | Accepts `FilterTube_CollabDialogData`, applies resolved collaborators, force-updates video id state. | Message source is window-level; useful internally but should be correlated to pending entry/request. | `GATE` with request/collab key correlation. |
| Menu CSS injection | `js/content/menu.js:23-309` | Injects large style block when `ensureFilterTubeMenuStyles()` is called. | Style helper is inert until called; wording/classes are blocklist-centric (`filtertube-blocked`) and will need dual allow/block vocabulary later. | `KEEP` now, rename semantics during dual-list design. |
| First-run prompt | `js/content/first_run_prompt.js:177-189` | Always asks background `FilterTube_FirstRunCheck` from content script load, renders only if needed. | One message per injected surface; not a hide bug, but should be excluded from performance suspicion once counted. | `KEEP` + message counter. |
| Release notes prompt | `js/content/release_notes_prompt.js:237-249` | Always asks background `FilterTube_ReleaseNotesCheck`, renders only if needed. | Same as first-run; not part of rule runtime but contributes startup messages. | `KEEP` + message counter. |

Affordance lifecycle invariant:

```text
empty install / no active rules
  -> no quick-block sweep
  -> no fallback menu scan
  -> no collaboration MutationObserver
  -> no resolver network
  -> no forced DOM fallback from identity/collab enrichment
  -> only minimal settings/release/first-run messages remain
```

### Identity And Map Storage Findings

| Area | Proof | Risk | Verdict |
| --- | --- | --- | --- |
| DOM fallback unresolved handle escalation | `js/content/dom_fallback.js:4768-4805` calls `fetchIdForHandle(..., { skipNetwork: true, backgroundOnly: true })`; resolver sends `fetchChannelDetails` in `js/content/handle_resolver.js:200-206`; background fetches channel HTML in `js/background.js:4437-4445`, `js/background.js:4532-4645`. | A normal DOM fallback pass can trigger authenticated YouTube page requests when channel identity is incomplete. | `GATE` |
| Channel map queued writer | `js/background.js:1495-1505` updates pending map and compiled caches. | This is the right pattern. | `KEEP` |
| Channel map direct background writes | `js/background.js:5995-6038` writes custom URL and handle mappings directly with `storage.local.set`. | Can bypass queue/cache semantics and make compiled/current settings stale. | `REWRITE` |
| Channel map direct content write | `js/content_bridge.js:5557-5569` writes custom URL map directly from content context. | Content ignores channelMap-only storage changes in `js/content/bridge_settings.js:547-553`, so other content state may stay stale. | `REWRITE` |
| Video/channel map harvest | `js/filter_logic.js:1335-1370`, `js/content_bridge.js:1465-1487`, `js/background.js:1933-1665`. | Useful, but stores plain `videoId -> channelId` without provenance, freshness, or confidence. | `KEEP` + `INSTRUMENT` |
| Visible Shorts enrichment | `js/content_bridge.js:7873-7866`. | Can batch identity lookups and direct-hide elements; must be active-rule gated. | `GATE` |
| Playlist row enrichment | `js/content_bridge.js:7924-8018`. | Fetches missing watch identity for playlist rows and direct-hides rows. Needs reason/counter. | `GATE` + `INSTRUMENT` |
| Message router surface | `js/background.js:3165-3188`, `js/background.js:5209-5235`, `js/content_bridge.js:5468`. | Broad mutation/fetch/hide actions should have a message ledger with trusted sender, storage mutation, network, and DOM effects. | `INSTRUMENT` |

Map invariant:

```text
channelMap and videoChannelMap writes should flow through background APIs only.
Each write should carry:
  key,
  value,
  source,
  confidence,
  timestamp,
  source video/renderer when applicable.
```

No content script should directly write `channelMap` unless the background API is unavailable and the write is explicitly marked as a degraded fallback.

### DOM Writer Contract

`toggleVisibility()` is the central reversible hide helper and generally follows the right pattern: class + attribute + inline `display:none`, with restore removing class, attr, and inline display (`js/content/dom_helpers.js:67-149`).

However, the broader DOM fallback still has direct writers that bypass or partially duplicate that contract:

| Writer class | Proof | Risk | Verdict |
| --- | --- | --- | --- |
| Central hide/unhide helper | `js/content/dom_helpers.js:67-149` | Good reversible contract, stats-aware. | `KEEP` |
| Container hide helper | `js/content/dom_helpers.js:154-206` | Can hide parent shelves when all children hidden; needs route-specific tests. | `KEEP` + `TEST` |
| Direct playlist/members/mix attr hides | `js/content/dom_fallback.js:2185-2287` | Some set `data-filtertube-hidden` without calling `toggleVisibility()`. Restore coverage is harder to prove. | `REWRITE` |
| Whitelist pending pre-hide | `js/content_bridge.js:5926-5931`, `js/content/dom_fallback.js:3668-3681` | Intentional fail-closed pre-hide, but must be restricted to strict whitelist and always restored on no-match/no-rules. | `GATE` |
| Quick-block immediate hide | `js/content/block_channel.js:1224-1234` | User-action hide before background confirmation. Needs rollback proof. | `KEEP` + `TEST` |

DOM writer invariant:

```text
Every hide must have:
  - owner reason attribute,
  - active settings/mode that caused it,
  - restore condition,
  - stats policy,
  - route/surface scope.

No direct `data-filtertube-hidden` writer should exist without a matching restore path.
```

### Observer And Timer Risk Table

This table is intentionally separate from hide correctness. A path can be visually correct and still make YouTube feel slow because it wakes up on every route, scroll, mutation, resize, or orientation change.

Static density snapshot from packaged content/main-world files:

| File | Static observer/listener/timer hits | Main risk |
| --- | ---: | --- |
| `js/content_bridge.js` | 77 | Fallback, menus, identity maps, collaborator responses, popup rows, settings/bootstrap. |
| `js/content/block_channel.js` | 56 | Quick-block hover, viewport, mutation, periodic sweep, menu observers. |
| `js/content/dom_fallback.js` | 13 | Scroll tracking, playlist synthetic controls, async/yield timers. |
| `js/injector.js` | 8 | Main-world bridges, subscription import, engine-ready polling. |
| `js/content/bridge_settings.js` | 8 | Settings delivery, storage refresh, seed retry, subscription import bridge. |
| `js/content/collab_dialog.js` | 6 | Click/keydown trigger capture and global mutation observer. |

| Runtime path | Proof | Empty/no-rule relevance | Verdict |
| --- | --- | --- | --- |
| Content scripts load on supported YouTube/Kids pages at `document_start` | `manifest.json:25`, `manifest.json:42` | Necessary baseline, but the scripts must quickly prove no-op state. | `KEEP` + `INSTRUMENT` |
| Main-world fetch interception | `js/seed.js:606-680` | Even when `shouldSkipEngineProcessing()` later skips mutation, the wrapper still checks endpoints and sometimes parses/stringifies. | `GATE` |
| Main-world XHR interception | `js/seed.js:748-785` | Same as fetch path. | `GATE` |
| DOM fallback body observer | `js/content_bridge.js:6025-6040` | Installed after fallback init; should not exist in blocklist/no-rule sessions. | `GATE` |
| Fallback menu mutation/click/scroll/warmup | `js/content_bridge.js:6563-6624` | Empty install pays scanner cost because block menu UI defaults enabled. | `GATE` |
| Quick block observer boot | `js/content/block_channel.js:2358-2397` | Starts after 1 second regardless of whether enforcement exists. | `GATE` |
| Quick block document/window listeners | `js/content/block_channel.js:1454-1491` | Focus/input/click/scroll/resize/orientation listeners are installed as part of setup. These are also exactly the events that fire during fullscreen/orientation changes in native apps. | `GATE` |
| Quick block mutation observer and periodic sweep | `js/content/block_channel.js:1607-1652` | Persistent scan loop; currently has removal for buttons, not a full stop contract. Periodic sweep continues every 1800ms once installed. | `REWRITE` |
| Card prefetch observer | `js/content_bridge.js:962-1038`, `js/content_bridge.js:1145-1218` | Useful for whitelist and missing identity, but should not run in no-rule blocklist mode. | `GATE` |
| Playlist prefetch observer/listener | `js/content_bridge.js:1038-1079` | Adds a captured scroll listener and playlist mutation observer for identity prefetch. | `GATE` |
| Right-rail whitelist observer | `js/content_bridge.js:1082-1142` | Installs once and schedules forced reprocess passes in whitelist mode. | `MERGE` into scheduler |
| Video metadata fetch queue | `js/content_bridge.js:1621-1716`, `js/content_bridge.js:1770` | Only needed when content/category rules require metadata; high cost when enabled. | `INSTRUMENT` |
| DOM fallback observer bundle | `js/content_bridge.js:6025-6055` | Body observer starts fallback, then immediately starts card prefetch, playlist prefetch, right-rail whitelist observer, and existing-card prefetch scan. | `REWRITE` lifecycle owner |
| Fallback menu scanner bundle | `js/content_bridge.js:6563-6624` | Mutation observer, `yt-navigate-finish`, captured click, captured scroll, and 8 warmup scans are installed after first call. | `GATE` by visible affordance |
| Native overlay quiet mode consumers | `js/content_bridge.js:16`, `js/content_bridge.js:5737`, `js/content_bridge.js:6499` | The repo has consumers for `data-filtertube-native-overlay-covered` / `data-filtertube-native-fullscreen`, but the producer contract is not proven in extension code. | `INSTRUMENT` + `GATE` |
| Native controls quiet CSS for quick block | `js/content/block_channel.js:914` | CSS consumer exists for `data-filtertube-native-controls-open`; producer must be proven in native runtime copies. | `INSTRUMENT` |

Observer invariant:

```text
Every observer/listener/timer must declare:
  - owning feature,
  - active predicate,
  - route/surface scope,
  - shutdown condition,
  - debug counter name.
```

Current likely implementation direction is not "remove all observers"; it is to make observers feature-owned and dormant unless the active enforcement report says the feature needs them.

### Runtime Active Report Design Audit - 2026-05-17

The active-state disease is not that every worker ignores settings. Several local workers do check their final condition. The bug class is that the surrounding lifecycle can start before a central active report says the feature is needed. That explains why a fresh install or an empty blocklist can still feel slower even when no content is supposed to be hidden.

Current local gates:

| Local gate | Proof | What it protects | What remains active outside it |
| --- | --- | --- | --- |
| DOM fallback active-work check | `hasActiveDOMFallbackWork()` at `js/content/dom_fallback.js:1933-1999`; early return at `js/content/dom_fallback.js:2075-2088`. | Prevents the expensive fallback body from scanning/hiding in empty blocklist or disabled states, except cleanup. | `initializeDOMFallback()` still calls `applyDOMFallback()`, installs body observer, prefetch observers, playlist hook, right-rail observer, and menu scanners through `js/content_bridge.js:5717-6055`. |
| Whitelist pending hide mode check | `applyWhitelistPendingHide()` checks `currentSettings?.listMode === 'whitelist'` at `js/content_bridge.js:5846-5850`. | Prevents pending fail-closed hides in blocklist mode. | Candidate collection and queue machinery are still installed from the global fallback observer at `js/content_bridge.js:5777-5841` and `js/content_bridge.js:6025-6088`. |
| Right-rail whitelist check | `scheduleWhitelistRefresh()` checks whitelist mode and non-watch route at `js/content_bridge.js:1086-1090`. | Avoids forced reprocess outside whitelist. | The observer/listeners are installed once at `js/content_bridge.js:1082-1142`; lifecycle is not owned by a global active report. |
| Quick-block visibility check | `isQuickBlockEnabled()` checks settings and non-whitelist mode at `js/content/block_channel.js:808-817`. | Prevents adding/showing quick-block buttons when disabled or in whitelist. | `setupQuickBlockObserver()` still installs focus/input/click/scroll/resize/orientation listeners, a body mutation observer, and a 1.8s periodic sweep at `js/content/block_channel.js:1454-1655`. |
| Fallback 3-dot menu item check | `injectFilterTubeMenuItem()` exits in whitelist or `showBlockMenuItem === false` at `js/content_bridge.js:10090-10102`. | Prevents menu item injection for the final dropdown action. | Fallback menu scanner still installs style, mutation observer, navigate/click/scroll listeners, and eight warmup scans at `js/content_bridge.js:6061-6624`. |
| Prefetch observer existence check | `startCardPrefetchObserver()` only starts once and uses `IntersectionObserver` at `js/content_bridge.js:1012-1032`. | Avoids duplicate prefetch observers. | It is started as part of DOM fallback init at `js/content_bridge.js:6050-6055`, even though prefetch is only useful for strict whitelist, unresolved identity, or explicit action readiness. |
| Handle resolver fallback rerun | `scheduleDomFallbackRerun()` calls `applyDOMFallback(currentSettings, { forceReprocess: true })` at `js/content/handle_resolver.js:135-147`. | Coalesces reruns after mapping updates. | Resolver/map persistence can wake DOM fallback after passive identity work unless the caller declares active-rule or user-action intent. |

Required active report vocabulary:

```text
activeRuntimeReport(settings, route, surface) = {
  enforcement: {
    enabled,
    blocklistRulesActive,
    whitelistStrictActive,
    commentsActive,
    shortsActive,
    routeControlsActive,
    contentMetadataActive,
    categoryMetadataActive
  },
  affordances: {
    quickBlockVisible,
    fallbackMenuVisible,
    collaborationDialogNeeded,
    firstRunPromptNeeded,
    releaseNotesPromptNeeded
  },
  identity: {
    needsPassiveCardPrefetch,
    needsPlaylistPrefetch,
    needsHandleResolution,
    needsVideoChannelMapHarvest,
    needsVideoMetaHarvest
  },
  lifecycle: {
    mayInstallBodyObserver,
    mayInstallScrollListener,
    mayInstallResizeOrientationListener,
    mayInstallPeriodicSweep,
    mayParseYoutubeiResponse,
    mayRewriteYoutubeiResponse
  }
}
```

Active-report rules:

| Work class | May start when | Must not start when |
| --- | --- | --- |
| JSON mutation / response replacement | An active rule can alter that endpoint route, or strict whitelist needs fail-closed JSON filtering. | Empty blocklist, disabled filtering, or metadata-harvest-only states without explicit harvest budget. |
| DOM fallback body observer | Route has active fallback enforcement or strict whitelist pending-hide needs fail-closed DOM coverage. | Empty blocklist with no route/content/category/comment/shorts controls. |
| Fallback menu scanner | Block menu affordance is enabled and visible for this surface/route. | Whitelist mode, disabled menu affordance, native overlay/fullscreen quiet mode, or unsupported route. |
| Quick-block observer and periodic sweep | Quick-block affordance is enabled, current surface supports it, and it is not hidden by native controls/whitelist. | Disabled quick block, whitelist mode, mobile/native surface where native controls own block actions, or fullscreen/native overlay quiet mode. |
| Card/playlist prefetch | Strict whitelist needs identity before reveal, unresolved active channel rule exists, or user has opened a block/menu action that needs enrichment. | Empty blocklist, no active channel/whitelist rule, no user action, or hidden/native fullscreen surface. |
| Metadata fetch queue | Duration/upload/category/mix controls are enabled with complete predicates. | No active metadata controls, enabled-empty category state, invalid duration/upload predicate, or no-rule mode. |
| Passive map writes | A stable renderer id was already encountered inside an allowed processing path and the write is within cap. | No active enforcement/affordance/harvest budget, repeated no-op, or weak identity source. |

This active report should be computed once per settings revision and route/surface transition, then consumed by `seed.js`, `content_bridge.js`, `dom_fallback.js`, `block_channel.js`, `handle_resolver.js`, and the native runtime copies. Local guards should stay, but they become second-line safety checks rather than the only thing preventing a large observer graph from starting.

### Seed JSON/XHR Active-Report Pass - 2026-05-17

This pass connects the active-report vocabulary to the earliest YouTube data path. The seed layer is correct to exist at `document_start`; the disease is that the current fetch path does expensive work before it knows whether the current settings/route actually need JSON mutation or harvest.

Seed proof table:

| Seed path | Proof | Current behavior | Disease-level risk | Required active-report behavior |
| --- | --- | --- | --- | --- |
| Endpoint match list | `fetchEndpoints` / `xhrEndpoints` include `/search`, `/guide`, `/browse`, `/next`, `/player` at `js/seed.js:606-613` and `js/seed.js:697-703`. | Broad endpoint family is intercepted globally. | Correct coverage, but endpoint type alone is not enough to justify parsing or rewriting. | Endpoint classifier must combine endpoint + route + `activeRuntimeReport.lifecycle`. |
| Fetch response path | `window.fetch` wrapper clones and parses JSON at `js/seed.js:633-636`, then always creates `new Response(JSON.stringify(processed))` at `js/seed.js:674-680`. | Even when `processWithEngine()` returns the same data, fetch path has already parsed and will stringify/rebuild. | Explains empty-install lag: no hide decision can still cost parse/stringify/replacement on YouTube API responses. | If no JSON mutation and no harvest budget, return `response` before clone/parse. If processed result is unchanged, return original response or recorded pass-through where possible. |
| XHR response path | `ensureXhrResponseProcessed()` exits when no settings or disabled at `js/seed.js:748-755`, then parses/rewrites only after that. | XHR is closer to a no-settings no-op than fetch. | Fetch/XHR parity is broken; fetch can be more expensive during delayed settings. | Fetch and XHR should share one endpoint decision function. |
| No-settings queue | `processWithEngine()` queues data when `!cachedSettings` at `js/seed.js:353-357`; replay clones and reprocesses at `js/seed.js:116-123` and `js/seed.js:921-947`. | Initial data/network blobs can be held for later processing. | Useful for zero-flash after settings arrive, but empty/no-rule sessions should not replay large blobs for no-op work. | Queue only when active report is unknown and endpoint may be mutation-relevant; drop/pass-through queue entries when later report says no active work. |
| No-rule skip | `shouldSkipEngineProcessing()` starts at `js/seed.js:197` and uses data shape, route, mode, content filters, and active rules at `js/seed.js:200-307`. | The skip is reasonably route-aware but runs after JSON has already been parsed on fetch and after initial/global data has been cloned. | Good decision logic placed too late for performance. It also still performs harvest-only work after skip. | Split into cheap pre-parse endpoint decision and post-parse mutation decision. Harvest must be separately budgeted. |
| Harvest-only after skip | Skip branch calls `FilterTubeEngine.harvestOnly()` at `js/seed.js:364-382`. | Even when filtering is skipped, channel identity can be harvested from blobs. | Useful for 3-dot/quick-block identity, but passive harvest should not be free on empty installs. | `activeRuntimeReport.identity.needsVideoChannelMapHarvest` must be true, or there must be a user-action prefetch reason. |
| Engine processing debug sizes | Debug mode computes `JSON.stringify(data).length` and `JSON.stringify(result).length` at `js/seed.js:399-408`. | Only debug-enabled cost. | Fine for debug, but instrumentation must not become release overhead. | Keep debug-only; add cheap counters that do not stringify large blobs by default. |
| Stored global reprocess | Settings update clones raw initial data/player response at `js/seed.js:950-966`. | Every settings update can reprocess stored snapshots. | Correct when settings changed to an active JSON-relevant rule; expensive when updating unrelated UI/profile state. | Reprocess only when `settingsRevision` changes a JSON-relevant active class for the current route/surface. |
| Global hooks | `establishDataHooks()` hooks `ytInitialData` and `ytInitialPlayerResponse` at `js/seed.js:497-595`. | Intercepts globals before YouTube consumes them. | Needed for zero-flash, but hook setters should delegate to active report before cloning/mutating snapshots. | For no-rule/disabled/pass-through, store only bounded debug snapshots or none; never clone large globals without a declared need. |

Endpoint contract sketch:

```text
seedEndpointDecision(endpoint, route, activeRuntimeReport) =
  passThrough          // no clone, no parse, no response replacement
  harvestOnly          // parse allowed, no response replacement, capped map writes
  mutateJson           // parse + process + replace, with changed/unchanged result report
  queueUntilSettings   // only if endpoint may need mutateJson after settings arrive
```

The key implementation guard for later: do not remove JSON-first filtering. Move the expensive JSON work behind a cheap active/endpoint decision and keep mutation-capable paths for routes where active rules need zero-flash filtering.

### Seed Endpoint Current-Behavior Pass - 2026-05-17

This pass records what the current seed layer actually does, not the target design. This matters because the user-visible disease is lag even when nothing is hidden. A path can be "functionally no-op" and still be expensive if it parses, harvests, recursively walks, stringifies, or replays large YouTube blobs.

Current endpoint behavior matrix:

| Endpoint / source | Empty/no-rule behavior today | Proof | Disease risk | Fixture requirement |
| --- | --- | --- | --- | --- |
| Non-YouTubei fetch | `NO_FETCH` / pass-through. | Fetch wrapper returns original fetch for URLs not containing listed endpoints at `js/seed.js:629-631`. | Correct. | Baseline fixture asserts no FilterTube JSON counters increment. |
| `/youtubei/v1/search` fetch on `/results` in blocklist mode with no active content/category/list rules | `PARSE_THEN_HARVEST_ONLY_RECURSE_THEN_REBUILD_RESPONSE`. | Route skip returns true at `js/seed.js:261-270`, but fetch already cloned/parsed at `js/seed.js:633-636`; skip branch harvests at `js/seed.js:364-382`; fetch always returns `new Response(JSON.stringify(processed))` at `js/seed.js:674-680`. | "Skipped filtering" still costs JSON parse, harvest recursion, stringify, and response replacement. | `seed.search.empty_blocklist.no_parse_or_rebuild` should fail today and guide the future fix. |
| `/youtubei/v1/browse` desktop home in blocklist mode with no active rules | `PARSE_THEN_HARVEST_ONLY_RECURSE_THEN_REBUILD_RESPONSE` when the post-parse home detector matches. | Home skip requires `/` and not mobile at `js/seed.js:297-307`, rich-grid detector at `js/seed.js:308-333`; fetch parse/rebuild proof same as above. | Empty desktop home can still feel slower despite no hide. | `seed.desktop_home.empty_blocklist.pass_through_before_parse`. |
| `/youtubei/v1/browse` mobile home in blocklist mode with no active rules | Likely `FULL_RECURSE_THEN_REBUILD_RESPONSE`. | Home skip explicitly excludes mobile at `js/seed.js:300-301`; fetch then calls `processWithEngine()` at `js/seed.js:674-675`; engine filter recursively walks renderer objects at `js/filter_logic.js:3391-3428`. | This aligns with Android/mobile WebView lag reports and means `videoWithContextRenderer`/mobile lockups are not just correctness concerns. | `seed.mobile_home.empty_blocklist.no_full_recurse`. |
| `/youtubei/v1/next` watch/sidebar in blocklist mode with no active rules | Usually `FULL_RECURSE_THEN_REBUILD_RESPONSE` unless channel-page special case matches. | `/next` is intercepted at `js/seed.js:611`; skip logic has search, channel, and desktop browse cases but no generic watch `/next` empty-rule skip at `js/seed.js:261-307`; recursive processing at `js/filter_logic.js:3391-3428`. | Watch page and fullscreen lag can happen even without active filters because `/next` is large and player-adjacent. | `seed.next.watch_empty_blocklist.pass_through_or_harvest_budgeted`. |
| `/youtubei/v1/player` fetch | `FULL_RECURSE_THEN_REBUILD_RESPONSE` unless disabled/no-settings. | `/player` is intercepted at `js/seed.js:612`; no `shouldSkipEngineProcessing()` branch for player at `js/seed.js:197-333`; process then rebuild at `js/seed.js:674-680`. | Player metadata should not be recursively filtered by default. It risks both performance and player-shell correctness. | `seed.player.metadata_only_no_mutation`. |
| `/youtubei/v1/guide` fetch | `FULL_RECURSE_THEN_REBUILD_RESPONSE` unless disabled/no-settings. | `/guide` is intercepted at `js/seed.js:609`; no guide branch in skip classifier at `js/seed.js:197-333`. | Guide/sidebar UI can be walked even though normal content filtering may not need it. | `seed.guide.no_rule_pass_through`. |
| Fetch before settings arrive | `PARSE_THEN_QUEUE_THEN_REBUILD_RESPONSE`; later replay can clone/process. | Fetch parses first at `js/seed.js:633-636`; `processWithEngine()` queues with no settings at `js/seed.js:353-357`; queue replay clones and reprocesses at `js/seed.js:116-123`, `js/seed.js:921-947`. | Delayed settings can double work on startup, and empty/no-rule sessions may replay data that should have been discarded. | `seed.no_settings.queue_only_if_potentially_active`. |
| XHR before settings arrive or disabled | Closer to true no-op. | XHR processing exits if `!cachedSettings` or disabled at `js/seed.js:748-755` before JSON parse/rewrite. | Fetch and XHR have different cost behavior for the same endpoint family. | Shared endpoint decision fixture for fetch and XHR parity. |
| Settings update with raw globals | `CLONE_THEN_REPROCESS_GLOBALS`. | Settings update clones raw `ytInitialData` and `ytInitialPlayerResponse` at `js/seed.js:950-966`. | Unrelated settings changes can trigger large reprocessing unless revision categories are checked. | `seed.settings_revision.only_json_relevant_reprocesses`. |

Endpoint-state disease diagram:

```text
current fetch path
  endpoint string match
  -> network response
  -> clone().json()
  -> processWithEngine()
       -> no settings? queue
       -> disabled? return data
       -> shouldSkip? harvestOnly(data)
       -> else FilterTubeEngine.processData(data)
            -> harvestNetworkMappings(data)
            -> recursive filter(data)
  -> JSON.stringify(processed)
  -> new Response(...)

target path
  endpoint string match
  -> cheap seedEndpointDecision(endpoint, route, activeRuntimeReport)
       passThrough: return original response
       queueUntilSettings: queue only bounded metadata
       harvestOnly: parse, harvest, return original response if possible
       mutateJson: parse, process, replace only when changed
```

This is why the audit should not start by deleting a single renderer or observer. The root fix is an endpoint lifecycle contract. Renderer-specific fixes are still required, but they need to sit behind a cheap "should this endpoint do any work at all" decision.

### Active Predicate Divergence Pass - 2026-05-17

This pass checks whether every subsystem agrees on what "active filtering work" means. The answer is no. Some layers treat a toggle as active even when the rule has no complete predicate. Other layers later no-op. That mismatch is enough to slow YouTube or create confusing "empty settings but still doing work" reports.

Active predicate divergence table:

| Rule family | Writer / stored shape | Early active predicate | Later decision predicate | Disease risk | Required invariant |
| --- | --- | --- | --- | --- | --- |
| Main category filter | Dashboard saves `{ enabled, mode, selected }` directly at `js/tab-view.js:840-870`; StateManager stores `enabled: nextCategoryFilters.enabled === true` and selected array at `js/state_manager.js:2172-2182`. | Seed treats `cachedSettings.categoryFilters?.enabled === true` as active at `js/seed.js:214-223`; DOM fallback active gate returns true for `categoryFilters?.enabled === true` at `js/content/dom_fallback.js:1992-1995`. | Filter logic no-ops when `selected.length === 0` at `js/filter_logic.js:2126-2134`; later DOM content/category check requires selected values at `js/content/dom_fallback.js:3605-3607`. | Empty selected list can wake seed processing, endpoint mutation, and DOM fallback lifecycle even though no category can match. | Active only if `enabled === true && selected.length > 0`. UI save should coerce empty selected to disabled or block save. |
| Kids category filter | Kids dashboard saves `{ enabled, mode, selected }` at `js/tab-view.js:2064-2075`; StateManager stores similarly at `js/state_manager.js:2198-2205`. | Compiled settings carry category object without validation at `js/settings_shared.js:522-560`, then seed/DOM use the same early active booleans. | Runtime category logic still requires selected values. | Same enabled-empty disease, plus Kids/app surfaces can inherit the work. | Same validator for Main, Kids, managed-child, import, and sync writes. |
| Main duration filter | Dashboard saves `duration: { ...prior.duration, enabled, condition }` at `js/tab-view.js:1072-1102`; it only overwrites numeric thresholds when visible parse succeeds. | Seed treats `contentFilters.duration?.enabled` as active at `js/seed.js:205-213`; DOM fallback active gate does the same at `js/content/dom_fallback.js:1981-1989`. | Filter logic can only make a meaningful duration decision if renderer has extractable duration and saved condition/thresholds are coherent. | A blank/invalid input can preserve stale hidden thresholds or wake processing with incomplete values. | Enabled duration needs a complete predicate for the selected condition, derived from visible UI or validated imported state. |
| Kids duration filter | Kids dashboard mirrors the same spread/prior pattern at `js/tab-view.js:2180-2210`. | Same compiled/seed/DOM predicates. | Same later extraction dependency. | Kids rules can silently inherit old thresholds after visible input is blank or invalid. | Shared content-filter validator, not duplicated UI-only parsing. |
| Main upload-date filter | Dashboard saves `uploadDate: { ...prior.uploadDate, enabled, condition }` at `js/tab-view.js:1115-1156`; it only updates date fields when visible parse succeeds. | Seed and DOM active gates treat `uploadDate.enabled` as active at `js/seed.js:205-213`, `js/content/dom_fallback.js:1981-1989`. | Later filter logic needs coherent date/window values. | Stale `fromDate`/`toDate` can survive UI changes and look like false hiding. | Enabled upload-date rule must carry a validated normalized range and a visible source signature. |
| Popup content toggles | Popup only toggles `.enabled` and preserves prior nested settings at `js/popup.js:474-501`. | Any enabled boolean wakes seed/DOM active gates. | Predicate values may be old, absent, or not visible in popup. | Popup can activate stale dashboard thresholds without showing the full predicate to the user. | Popup quick toggles should only re-enable a previously valid predicate and surface that predicate, or route user to full settings. |
| Settings compiler | `buildCompiledSettings()` passes `contentFilters` and `categoryFilters` through `safeObject()` at `js/settings_shared.js:522-560`. | Runtime consumers interpret raw stored objects independently. | No single compiled `activeRuntimeReport` exists. | Every subsystem reinvents active checks and drifts. | Compiler should emit validated rule objects plus `activeRuntimeReport`; raw storage remains editable but runtime consumes compiled validity. |

Canonical active-rule target:

```text
compiledRuleState = {
  lists: {
    blockKeywordsActive,
    blockChannelsActive,
    commentKeywordsActive,
    allowListActive
  },
  content: {
    duration: { active, condition, minSeconds, maxSeconds, sourceValid },
    uploadDate: { active, condition, fromTs, toTs, sourceValid },
    uppercase: { active, mode, minWordLength }
  },
  categories: {
    active,
    mode,
    selectedNormalized
  },
  uiBooleans: {
    routeControlsActive,
    shortsControlsActive,
    commentsControlsActive,
    watchChromeControlsActive
  }
}
```

The future `activeRuntimeReport()` should be derived from this compiled state, not from raw UI booleans. That keeps UI affordances, JSON mutation, DOM fallback, quick-block, menu insertion, and native WebView copies from waking different work for the same apparent settings.

### DOM Hide Side-Effect Pass - 2026-05-17

This pass maps where a filter decision becomes a real page mutation. The disease is not only whether a rule matches; it is that multiple code paths can write the same hide classes/attributes, stats, pending markers, media pauses, and restores with different ownership models.

DOM side-effect ledger:

| Writer / sink | Proof | Current behavior | Disease risk | Required invariant |
| --- | --- | --- | --- | --- |
| Central `toggleVisibility()` | `js/content/dom_helpers.js:67-149`. | Adds/removes `.filtertube-hidden`, `data-filtertube-hidden`, inline `display:none!important`, records hide/restore stats, and calls `handleMediaPlayback()` for both hide and restore. | This is the right central sink, but its input is `shouldHide + reason + skipStats`, not a structured decision. Media side effects and stats are coupled to visual hide. | Replace call-site booleans with `hideDecision { writer, ruleId, confidence, reason, statsPolicy, mediaPolicy, restoreOwner }`. |
| Container visibility repair | `js/content/dom_helpers.js:154-205`. | Adds `.filtertube-hidden-shelf` when all children are hidden; restores when at least one child appears visible. | Inherits every child false-hide; zero-child/had-child behavior can hide shelves without a direct rule reason. | Container hides need `childSelector`, count, and parent reason; never count stats. |
| Stale DOM cleanup | `clearStaleDOMFallbackVisibility()` selects hidden/pending elements at `js/content/dom_fallback.js:2001-2025`; inactive fallback cleanup calls it at `js/content/dom_fallback.js:2075-2088`. | Restores any FilterTube hidden/pending element when fallback has no active work or cleanup is due. | Good fail-open pressure, but broad cleanup does not know which writer owns the hide. A future UI overlay or pending resolver can be undone accidentally. | Every hide marker should include `data-filtertube-hide-owner`; cleanup only restores owners it owns or expired pending states. |
| DOM fallback video-card loop | Video card scan starts at `js/content/dom_fallback.js:2325-2328`; final write uses reason attributes and `toggleVisibility()` around `js/content/dom_fallback.js:3844-3929`. | One path sets `data-filtertube-hidden-by-*` attributes for keyword/channel/duration/upload/category/mix/shorts and then calls central toggle. | This is the best candidate for structured hide decisions, but current state is scattered across attributes and a string reason. | Evaluation must produce one decision object before writing any attribute/class/style. |
| Whitelist pending hide in content bridge | `applyWhitelistPendingHide()` directly adds `.filtertube-hidden`, `data-filtertube-hidden`, `data-filtertube-whitelist-pending`, and inline display at `js/content_bridge.js:5916-5931`. | Bypasses central `toggleVisibility()` and does not record a structured restore owner. | Pending-hide is necessary for whitelist fail-closed, but direct write increases false-hide/stale-hide risk. | Pending hide should go through central writer with `decision.kind = "pendingIdentity"` and TTL/owner. |
| Fallback stale/pending clear around no-active mode | DOM fallback inactive branch restores all `[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]` at `js/content/dom_fallback.js:2310-2319`. | Broad fail-open cleanup when settings disabled or no work. | Can restore hides from another writer, but also proves the code already needs centralized ownership. | Cleanup by owner and active report category. |
| Immediate 3-dot/fallback-menu block row hide | Fallback menu block row path writes `row.style.display='none'`, `.filtertube-hidden`, and `data-filtertube-hidden` at `js/content_bridge.js:6846-6856`. | Optimistic hide after user action. | User-initiated side effect is valid, but it bypasses stats/restore semantics unless persistence fails. | User-action optimistic hide needs explicit rollback transaction and must not be confused with runtime filter hide. |
| Playlist enrichment hide | Direct write at `js/content_bridge.js:7948-7960`; later checks ownership attributes at `js/content_bridge.js:7966-7975`. | Hides rows during playlist/channel enrichment and marks `data-filtertube-hidden-by-playlist-enrichment`. | Better ownership than some paths, but still direct class/style mutation. | Move to central writer with `owner=playlist-enrichment`; preserve current ownership guard. |
| Optimistic quick/channel block hide | Records prior state at `js/content_bridge.js:11626-11648`, restores prior style/class/attr at `js/content_bridge.js:11650-11666`. | This is one of the stronger rollback models. | Useful pattern, but it is local to this action; central runtime hides do not carry equivalent rollback metadata. | Promote this transaction pattern into the shared hide writer. |
| Direct comment/channel hides in content bridge | Multiple paths call `toggleVisibility()` or direct class writes around `js/content_bridge.js:11540-11546`, `js/content_bridge.js:12690-12708`. | Multiple ownership models for comments and containers. | Comments can be hidden by author, keyword, global hide, or container cleanup; string reason alone is not enough for restore/debug. | Comment hides need same decision schema with rule family and confidence. |
| Media pauses | DOM fallback directly pauses videos at `js/content/dom_fallback.js:822`, `js/content/dom_fallback.js:866`, `js/content/dom_fallback.js:2391`, `js/content/dom_fallback.js:4503`; central hide also calls media handler at `js/content/dom_helpers.js:107`, `js/content/dom_helpers.js:147`. | Some hides pause media through central path; others pause directly. | This can look like the extension "engaged" with videos or fight YouTube playback/fullscreen state. | Media pause must be an explicit `mediaPolicy`, only for current blocked playback or user-confirmed action. |

Structured hide decision target:

```text
hideDecision = {
  writer: "json" | "domFallback" | "whitelistPending" | "quickBlock" | "playlistEnrichment" | "routeControl",
  kind: "finalHide" | "pendingIdentity" | "optimisticUserAction" | "containerRepair" | "restore",
  ruleFamily: "keyword" | "channel" | "duration" | "uploadDate" | "category" | "shorts" | "comments" | "route" | "none",
  ruleId,
  confidence: "stable" | "mapped" | "weak" | "pending" | "structural",
  target: { rendererType, domTag, route, videoId, channelId, handle },
  statsPolicy: "count" | "skip" | "restoreOnly",
  mediaPolicy: "none" | "pauseCurrentPlayback" | "pauseNestedMedia",
  restoreOwner,
  ttlMs
}
```

The immediate remediation should not be "remove all direct writes" in one step. First add a central decision object and counters, then migrate direct writers one family at a time. This protects existing working hides while making false-hide and engagement-like side effects debuggable.

## Subsystem E - UI, Docs, Build, Website, And Native Runtime Drift

### Verified Risks

| Area | Proof | Verdict | Reason |
| --- | --- | --- | --- |
| What’s New version drift | `data/release_notes.json:5`, `html/tab-view.html:884`, `js/tab-view.js:2652` | `GATE` | Packaged 3.3.1 UI can surface staged 3.3.2 notes. |
| Docs version drift | `docs/CODEMAP.md:1`, `docs/FUNCTIONALITY.md:1` | `REWRITE` | Docs describe mixed 3.2.7/3.3.0/3.3.1 behavior. |
| Copy-blocklist docs drift | `docs/ARCHITECTURE.md:152`, `docs/ARCHITECTURE.md:197-204` | `REWRITE` | Docs conflict with runtime and UI around conditional copy. |
| Release source drift | `build.js:80`, `build.js:315`, `data/release_notes.json`, `CHANGELOG.md` | `GATE` | Release body, in-app notes, website notes can diverge. |
| Native runtime sync drift | `scripts/sync-native-runtime.mjs:5` | `INSTRUMENT` | Native app runtime copy is external/optional; releases need a recorded source revision. |
| Nanah vendor source drift | `scripts/build-nanah-vendor.mjs:9` | `INSTRUMENT` | Public sync/privacy claim should record exact Nanah source revision used in a release. |

This is part of the runtime audit because incorrect docs/UI can create the same user-visible failure as incorrect filtering: the user believes one mode or version is active while a different one is actually running.

### Manifest, CSS, And Release Packaging Ledger

This pass checks what is actually packaged and what can drift from runtime reality. The disease risk here is subtle: a file can be copied into the release and look authoritative even when it is not loaded, or a broad CSS rule can become catastrophic if a future manifest/build change starts loading it.

| Surface | Proof | Behavior today | Disease-level risk | Verdict |
| --- | --- | --- | --- | --- |
| Chrome/Opera MAIN seed | `manifest.json:25-35`, `manifest.chrome.json:25-35`, `manifest.opera.json:29-39`. | `js/seed.js` runs at `document_start` in MAIN world on YouTube and YouTube Kids. | Correct for JSON interception, but this is the first performance budget line. Empty-install no-op must be proven inside seed, not left to later content scripts. | `KEEP` + no-op contract |
| Chrome/Opera isolated bundle | `manifest.json:37-59`, `manifest.chrome.json:37-59`, `manifest.opera.json:41-63`. | Large isolated bundle runs at `document_start`: identity, menu CSS injector, DOM helpers/extractors/fallback, quick block, bridge injection/settings/resolver/dialog/prompts, and `content_bridge.js`. | This load order is the base cost for every supported YouTube/Kids page. Each module needs its own active predicate even if script injection itself remains eager. | `INSTRUMENT` |
| Firefox content model | `manifest.firefox.json:30-49`. | Firefox content script bundle omits MAIN-world `seed.js` content script entry but exposes `js/seed.js` as web-accessible (`manifest.firefox.json:51-61`). | Browser parity depends on bridge injection rather than manifest MAIN world. JSON interception timing can differ from Chrome/Opera. | `GATE` with browser fixture |
| Web-accessible runtime files | Chrome `manifest.json:61-75`; Firefox `manifest.firefox.json:51-61`. | Exposes `js/injector.js`, `js/filter_logic.js`, `js/seed.js`, `js/shared/identity.js`, and `icons/file.svg`. | These are injectable runtime assets. The background `injectScripts` action must allowlist exactly this intended set. | `KEEP` + background allowlist |
| Host permission scope | `manifest.json:82-86`, `manifest.firefox.json:69-73`. | Host permissions cover YouTube, YouTube NoCookie, and YouTube Kids. | Product scope is correct, but all content modules must route-scope themselves. YouTube Kids should not pay full Main YT observer cost unless needed. | `GATE` by surface |
| CSS files copied but not content-script loaded | `build.js:30`, `manifest.json:25-60`, `manifest.firefox.json:30-50`; search found no manifest `css` entries or runtime `insertCSS` for `css/filter.css`, `css/layout.css`, or `css/content.css`. | Build copies `css/` into release, but YouTube content pages do not currently load these stylesheet files through manifest CSS. | These files are legacy/high-risk runtime claims. Future developers may assume they are live or add them to manifest, causing default-hide behavior. | `DOCUMENT` or remove from content-runtime path |
| Default-hide CSS hazard | `css/filter.css:8-35`, `css/content.css:8-36`. | Broad YouTube renderer selectors are `display:none !important` unless `.filter-tube-visible` is added. | If loaded eagerly, empty install would hide content until JS marks visibility. That is incompatible with the no-op quiet contract. | `DO NOT LOAD` unless converted to explicit decision classes |
| Aggressive layout CSS hazard | `css/layout.css:509-683`, `css/layout.css:737-803`. | Many `:not(.filter-tube-visible)` and `:has(...)` selectors force zero-size/absolute/hidden states. | If active, any missed reveal class becomes a false hide or layout collapse. It also risks expensive selector matching on large YouTube DOMs. | `REWRITE` before use |
| Menu style injector | `js/content/menu.js:25-308`. | Injects scoped FilterTube menu styles into the page once. | This is live and class-scoped, lower risk than renderer-wide CSS. Still part of content-script startup budget. | `KEEP` + lifecycle budget |
| Build release artifact collection | `build.js:214-272`. | Optional Android mobile artifacts are copied into `dist/mobile` with SHA-256 files, selecting latest versionCode by default. | Good public-release direction, but public release should not accidentally attach debug/proof APKs without explicit operator choice. | `KEEP` + release checklist |
| GitHub release body app links | `build.js:388-435`. | Release body includes Android direct APK/AAB notes when artifacts are attached, otherwise points to `https://filtertube.in/downloads`. | Public release messaging can outrun app-store readiness if release notes are not aligned with website/store status. | `GATE` with changelog/release checklist |

Package-surface invariant:

```text
Packaged does not mean active.

Every packaged runtime asset needs one of:
  active in manifest/build path with a startup budget,
  web-accessible injection path with an allowlist,
  UI-only asset scope,
  documented legacy/orphan status.

No stylesheet may hide YouTube renderers by default unless the runtime has
already made a structured decision for that renderer.
```

### Main-World Bridge And Auxiliary Content UI

These files are not the main filtering decisions, but they can still affect performance, trust boundaries, and perceived product behavior on YouTube pages.

| Surface | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| First-run refresh prompt | `js/content/first_run_prompt.js:177-189`, `js/content/first_run_prompt.js:172-175` | Asks background whether prompt is needed, then marks first-run complete when user refreshes/dismisses. | Low filtering risk; can add top-level DOM on YouTube until dismissed. | `KEEP` |
| Release-notes prompt | `js/content/release_notes_prompt.js:237-249`, `js/content/release_notes_prompt.js:70-82` | Asks background for unseen release notes and renders a fixed banner. | Low filtering risk, but version drift can create noise on YouTube pages. | `GATE` with release version contract |
| Menu style injector | `js/content/menu.js:25-308` | Injects menu styles into `document.documentElement` once. | Style scope is broad and uses many `!important` rules; currently menu-owned but should remain isolated to FilterTube classes and YouTube menu containers. | `KEEP` + CSS scope audit |
| Collaboration trigger listeners | `js/content/collab_dialog.js:75-80`, `js/content/collab_dialog.js:332-336` | Adds capture `click`/`keydown` listeners and a dialog observer on DOMContentLoaded. | Starts regardless of active rules; collaboration support is useful but should be dormant unless collaboration cards are pending. | `GATE` |
| Collaboration dialog observer | `js/content/collab_dialog.js:306-329` | Observes whole document for `tp-yt-paper-dialog`, extracts collaborators, and broadcasts dialog data. | User-initiated dialog path, but observer is global and has no disconnect. | `INSTRUMENT` lifecycle |
| Main-world subscription import bridge | `js/injector.js:23-78`, `js/content/bridge_settings.js:120-195` | Uses `window.postMessage` between isolated and main world for subscription import. | Correct main-world requirement, but request path must remain explicitly user-initiated. | `KEEP` + provenance log |
| Subscription import fetch loop | `js/injector.js:1239-1545` | Reads YouTube config, waits for seed data, then POSTs `/youtubei/v1/browse` continuation requests with abort/time limits. | High-cost and account-sensitive, but user-initiated import only. Must never be part of normal page-load filtering. | `KEEP` + `GATE` |
| Main-world `ytInitialData` backup hook | `js/injector.js:3440-3500` | Defines a setter/getter hook if `seed.js` did not already hook `ytInitialData`. | Duplicate hook path can process initial data outside the primary `seed.js` no-op contract. | `CONSOLIDATE` |
| Engine readiness polling | `js/injector.js:3502-3532` | Polls every 100ms up to 5 seconds for `FilterTubeEngine`. | Small but constant startup timer; acceptable if main-world injection remains required. | `KEEP` + timing log |
| Isolated bridge injection state | `js/content/bridge_injection.js:11-17`, `js/content/bridge_injection.js:75-120` | Guards main-world injection with `scriptsInjected` / `injectionPromise` and requests settings after injection. | Good idempotency; flexible `injectScripts` background action still needs script allowlist. | `KEEP` + background gate |
| Popup shell bundle | `js/ui-shell/popup-shell.js:270-300`, `js/ui-shell/popup-shell.js:307-373` | Sets popup environment and mounts a Preact shell with a looping metadata-preloaded hero video. | Popup-only visual cost, not YouTube page lag. Needs asset-size budget for low-end popup open. | `KEEP` + UI budget |
| Tab-view decor bundle | `js/ui-shell/tab-view-decor.js:270-323` | Sets tab-view environment and mounts ambient video/glow decor. | Dashboard-only visual cost, not YouTube page lag. Should remain outside content scripts. | `KEEP` |

Auxiliary-script invariant:

```text
Anything injected onto YouTube pages must be classified as:
  filtering-critical
  user-affordance
  user-initiated import/sync
  informational prompt
  debug-only

Only filtering-critical code may run on every page load. User-affordance code needs feature flags. Import/sync code needs explicit user initiation.
```

### Shared Identity And Content Helper Ledger - 1

This pass covers the smaller shared helper files that many larger runtime paths depend on. These helpers are important because they either centralize identity matching correctly, or they create duplicate source-of-truth and side-effect paths that later look like false hides.

| Helper family | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Shared identity module scope | `js/shared/identity.js:1-17`, exposed at `js/shared/identity.js:782-804` | Declares a framework-free global `FilterTubeIdentity` for isolated world, main world, and background. | Correct architectural direction: one identity API across engines. Must stay the canonical owner so content bridge/filter logic/dom fallback do not keep divergent fallbacks. | `KEEP` |
| Handle/UC/custom URL normalization | `js/shared/identity.js:21-128`, `js/shared/identity.js:214-239`, `js/shared/identity.js:588-617` | Normalizes handles, UC IDs, and custom URLs without throwing. | Good purity and defensive parsing. Needs fixtures for percent encoding, zero-width chars, full-width glyphs, `/c/`, `/user/`, and accidental UC-as-handle inputs. | `KEEP` + fixtures |
| Channel input canonicalization | `js/shared/identity.js:147-188` | Converts URLs, handles, and UC IDs into typed canonical forms. | Good UI/storage boundary, but unknown strings still return as raw `unknown`; callers must decide whether name-only entries are allowed. | `KEEP` + caller validation |
| Filter index construction | `js/shared/identity.js:254-370` | Builds sets for ids, handles, custom URLs, names, stable names, name-only names, and unresolved handles. | Useful performance optimization and canonical matching. Risk: stable entries also add display names, so weak metadata can match by name when no UC ID is present. | `INSTRUMENT` confidence reason |
| Index matching | `js/shared/identity.js:372-418` | Matches meta against ids/handles/custom URLs/channelMap/name sets. | Back-compat name matching is useful but must expose whether the match was stable-id, handle, custom URL, name-only, or stable-name fallback. False hides are hardest to debug when every match is just boolean. | `REWRITE` to reason object |
| Per-entry channel match fallback | `js/shared/identity.js:424-586` | Matches one filter entry to meta; supports object and legacy string entries. | Several low-confidence fallbacks are intentional (`@handle` vs name-without-at, stable object name vs meta name). They need confidence labels so whitelist/blocklist can choose stricter behavior on weak cards. | `INSTRUMENT` then reason object |
| HTML chunk identity fast extractor | `js/shared/identity.js:619-740` | Regex-extracts owner/channel identity from watch/shorts HTML chunks. | Useful action recovery helper, but regex HTML parsing must remain action/background resolver scoped, not passive empty-install work. | `GATE` |
| DOM hide writer | `js/content/dom_helpers.js:67-149` | Adds/removes `.filtertube-hidden`, `data-filtertube-hidden`, inline `display:none!important`, stats, tracker records, and media playback handling. | This is a central side-effect sink. A boolean `shouldHide` plus string reason is not enough; it needs structured reason, confidence, rule id, pending-vs-final, and paired restore ownership. | `REWRITE` reason object |
| Container hide repair | `js/content/dom_helpers.js:154-205` | Hides a shelf/container when all children are hidden and restores when any child is visible. | Correct gap cleanup, but it inherits every child false-hide. It must not count stats and should record which child selector caused container hiding. | `INSTRUMENT` |
| Handle resolver map persistence | `js/content/handle_resolver.js:25-48` | Sends `updateChannelMap` and mutates `currentSettings.channelMap` locally. | Duplicates content bridge map persistence authority. The local mirror can diverge from background normalization/revision. | `REWRITE` through typed background map action |
| Handle resolver fallback normalization | `js/content/handle_resolver.js:58-128` | Delegates to `FilterTubeIdentity` when present, otherwise uses local duplicate parser. | Good compatibility, but duplicate fallback should be fixture-locked or removed after manifest load order is guaranteed. | `KEEP` short term; `CONSOLIDATE` |
| Handle network resolver | `js/content/handle_resolver.js:149-281` | Reads `channelMap`, can ask background `fetchChannelDetails`, can fetch `/@handle/about` and `/@handle`, posts map updates, then forces DOM fallback rerun. | High-value recovery path, but it is network and forced-filter work. It needs an explicit active-rule or user-action reason; direct content fetches should not run during empty installs. | `GATE` + counters |
| Menu CSS utilities | `js/content/menu.js:10-17`, `js/content/menu.js:23-309` | Escapes strings and injects FilterTube menu CSS once when requested. | Mostly inert by itself. CSS vocabulary is blocklist-specific (`filtertube-block-channel-item`, `filtertube-blocked`) and will need decision-type rename before simultaneous allow/block mode. | `KEEP` current; future `REWRITE` naming |

Identity decision target:

```text
channelMatchResult = {
  matched: boolean,
  reason: "ucid" | "handle" | "customUrl" | "channelMap" | "nameOnly" | "stableNameFallback",
  confidence: "stable" | "mapped" | "weak",
  filterEntryId,
  metaSources,
  allowWeakMatch: boolean
}
```

The important disease finding is that the pure shared identity layer is a good direction, but most callers still consume it as `true/false`. To prevent false hides and make JSON-first filtering defensible, channel matching must return a reason/confidence object, and weak-name fallbacks must be route/list-mode aware.

### Identity Match Confidence Pass - 2026-05-17

This pass focuses on false-hide risk. The code is not randomly hiding channels; it is matching through multiple identity confidence levels, then returning a boolean. That loses the evidence needed to decide whether a blocklist, whitelist, DOM fallback, JSON renderer, or quick-action path should trust the match.

Current confidence sources:

| Match source | Proof | Current behavior | Confidence | Risk |
| --- | --- | --- | --- | --- |
| Stable UC ID | Shared index adds UC IDs at `js/shared/identity.js:267-273`; matches `meta.id` at `js/shared/identity.js:376-378`. | Exact UC ID match returns `true`. | `stable` | This is the safest channel match and should be preferred everywhere. |
| Stable handle | Handles are normalized and added at `js/shared/identity.js:275-294`; matched at `js/shared/identity.js:379-385`. | Exact handle and handle-without-@ fallback can return `true`. | `stable` for exact handle, `weak` for without-@ name fallback. | Handle-without-@ matching can collide with ordinary channel names if no UC ID is present. |
| Custom URL | Added/matched at `js/shared/identity.js:296-302`, `js/shared/identity.js:387-388`, and cross-mapped at `js/shared/identity.js:412-415`. | Custom URL and channelMap-derived UC match return `true`. | `mapped` / `stable` depending source. | Needs provenance because custom URLs are less canonical than UC IDs and can be stale. |
| Name-only entry | `nameOnlyNames` is filled at `js/shared/identity.js:304-312`; matched at `js/shared/identity.js:390-392`. | A saved name-only filter can match a meta name. | `weak` but intentional legacy support. | False-hide risk when renderer supplies ambiguous or recycled names. |
| Stable-entry name fallback | Stable entries also add names/handles/original input at `js/shared/identity.js:333-358`; matched only when `!metaId` at `js/shared/identity.js:390-392`. | If card has no UC ID, a stored stable channel's display name may allow/block the card. | `weak` fallback. | Needed for sparse DOM/JSON, but should be route-scoped and logged. |
| ChannelMap cross-match | `getChannelMapLookup()` maps normalized keys at `js/shared/identity.js:241-251`; cross checks at `js/shared/identity.js:402-415`. | Learned mappings can turn UC-only/handle-only/custom-url cards into matches. | `mapped`. | Map writes are learned elsewhere; match must include map source/staleness in debug. |
| DOM fallback duplicate index | `js/content/dom_fallback.js:310-447` duplicates index construction and `channelMetaMatchesIndex()` at `js/content/dom_fallback.js:449-485`. | Uses similar sets but only a single `meta.handle` family at `js/content/dom_fallback.js:456-457`. | Mixed. | Divergence from shared identity can make DOM and JSON disagree for `canonicalHandle` / `handleDisplay` variants. |
| JSON engine shared boolean | `_matchesAnyChannel()` calls shared `channelMetaMatchesIndex()` and returns boolean at `js/filter_logic.js:867-884`. | JSON filtering loses whether match was UC, handle, map, or weak name. | Unknown to caller. | Logs cannot prove why a card was removed; blocklist and whitelist cannot apply different confidence policies. |
| DOM whitelist identity-only split | DOM whitelist clears `name` when stable identity exists before matching at `js/content/dom_fallback.js:4619-4632`. | Good attempt to prefer stable identity, then name fallback only when no ID. | Better than raw boolean. | Still logs only a string reason, not confidence/matched rule id. |
| JSON whitelist channel branch | JSON whitelist checks collaborators through `_matchesAnyChannel()` at `js/filter_logic.js:1969-1981`. | Any boolean channel match allows the renderer. | Unknown to whitelist caller. | Whitelist should usually require stable/mapped identity on broad feeds and only allow weak name fallback in tightly scoped contexts. |
| JSON blocklist channel branch | JSON blocklist checks collaborators through `_matchesAnyChannel()` at `js/filter_logic.js:2038-2050`. | Any boolean channel match blocks the renderer. | Unknown to blocklist caller. | A weak name fallback can create the “it hid something unrelated” symptom. |
| Legacy fallback matcher | If shared identity is unavailable, `_matchesChannel()` falls back at `js/filter_logic.js:3218-3385`; content bridge has another fallback at `js/content_bridge.js:4947-5094`. | Multiple older boolean matchers remain. | Mixed. | These should become compatibility fallbacks only; the shared reason-object matcher must be source of truth. |
| Active handle resolution | DOM fallback schedules background-only handle resolution for unresolved handle keys at `js/content/dom_fallback.js:4755-4805`. | Tries to repair handle-vs-UC gaps without page-context fetches. | Potentially stable after resolution. | Good direction, but it is still a side effect from fallback evaluation and needs active-rule/user-action budget. |

Required matcher result:

```text
channelMatchResult = {
  matched: boolean,
  confidence: "stable" | "mapped" | "weak" | "none",
  reason:
    "ucid"
    | "handle"
    | "customUrl"
    | "channelMap:ucidToHandle"
    | "channelMap:handleToUcid"
    | "channelMap:customUrlToUcid"
    | "nameOnly"
    | "stableEntryNameFallback"
    | "handleWithoutAtNameFallback",
  matchedEntryKey,
  matchedEntrySource: "blocklist" | "whitelist" | "kidsBlocklist" | "kidsWhitelist",
  metaSource: "json" | "dom" | "mainWorld" | "backgroundFetch" | "channelMap",
  rendererType,
  route,
  allowWeakMatch: boolean
}
```

Confidence policy target:

| Runtime decision | Stable / mapped match | Weak name fallback |
| --- | --- | --- |
| Blocklist JSON removal on Home/Search/Watch rail | Allowed. | Allowed only if rule was explicitly name-only or route fixture proves the renderer has reliable owner name. |
| Blocklist DOM fallback | Allowed. | Allowed only for known reliable DOM surfaces; otherwise mark pending/enrich instead of final hide. |
| Whitelist broad feed reveal | Allowed. | Prefer pending hide until identity arrives; weak reveal only on creator page/scope where page identity vouches for cards. |
| Whitelist watch/player primary UI | Must not remove primary watch metadata/player UI. | Never use weak fallback to hide watch shell UI. |
| Quick block / 3-dot action | Stable/mapped identity can write rule directly. | Weak identity requires confirmation label and resolver attempt before persistent rule write. |

This is the main correctness bridge between JSON-first filtering and user trust. The product can stay aggressive where identity is stable, but weak matches must be visible in logs and fixtures instead of collapsing into `true`.

### Renderer Fixture Inventory Pass - 2026-05-17

This pass compares the documented YouTube renderer inventory with current JSON runtime handling. The conclusion is not "add every missing renderer immediately." The conclusion is that every renderer must be classified before source changes: first-class JSON filtering, DOM fallback only, UI-only/structural, metadata-only harvest, or intentionally ignored.

Renderer classification:

| Renderer / surface | Documentation proof | Runtime proof | Current classification | Fixture requirement |
| --- | --- | --- | --- | --- |
| `videoRenderer`, `compactVideoRenderer`, `playlistVideoRenderer`, `playlistPanelVideoRenderer`, `watchCardCompactVideoRenderer`, `endScreenVideoRenderer` | Inventory marks core video/sidebar/watch cards as covered around `docs/youtube_renderer_inventory.md:404-455`; playlist panel docs at `docs/json_paths_encyclopedia.md:1749-1753`. | These reuse `BASE_VIDEO_RULES` at `js/filter_logic.js:429-435`. | `JSON_FIRST` | Fixture per route: home/search/watch rail/playlist/end screen; assert title, channel identity, duration/date and block/allow behavior. |
| `gridVideoRenderer` | Inventory marks grid video surfaces as covered at `docs/youtube_renderer_inventory.md:442`; grid/channel docs overlap with home/channel shelves. | It first appears in the shared group at `js/filter_logic.js:431`, but is later defined again at `js/filter_logic.js:604-609`; the later object wins in JavaScript and drops handle, description, duration, date, and view-count paths from `BASE_VIDEO_RULES`. | `JSON_FIRST_PARTIAL` | Fixture must prove whether the duplicate rule is intentional. If not, remove the duplicate or extend it to match `BASE_VIDEO_RULES` plus grid-specific paths. |
| `videoWithContextRenderer` | Mobile/lockup docs mention mobile context renderers at `docs/json_paths_encyclopedia.md:3216-3217`, and collaborator sheet paths are documented at `docs/json_paths_encyclopedia.md:153-163`. | Dedicated rules at `js/filter_logic.js:436-465`; collaboration extraction currently checks `showDialogCommand` / `dialogViewModel` at `js/filter_logic.js:3021-3027`, not the documented `showSheetCommand.sheetViewModel` roster. | `JSON_FIRST_PARTIAL_COLLAB` | Mobile Main fixture with owner thumbnail/channel endpoint and no unrelated name fallback; collaborator fixture must cover `showSheetCommand` before this can be considered full JSON-first. |
| `lockupViewModel` | Detailed modern lockup paths at `docs/json_paths_encyclopedia.md:3199-3213`; inventory says DOM lockup maps to JSON lockup at `docs/youtube_renderer_inventory.md:167`. | Dedicated rules at `js/filter_logic.js:489-514`; unwrapped from rich item at `js/filter_logic.js:1604`. Runtime channel ID comes from decorated avatar at `js/filter_logic.js:496`, while docs also show metadata-row command-run IDs at `docs/json_paths_encyclopedia.md:3206`. | `PARTIAL_JSON_HIGH_RISK` | Fixture for video lockup, playlist lockup, metadata-row owner fallback, and mix/radio lockup; ensure collection thumbnails/badges do not become false collaborator identity. |
| `universalWatchCardRenderer` | Hero/search card paths at `docs/json_paths_encyclopedia.md:2696-2713`. | Dedicated rules at `js/filter_logic.js:528-567`. | `JSON_FIRST` | Fixture for hero entity card where header/title/handle are entity identity and CTA is playlist/mix, not the same as a normal video card. |
| `watchCardRichHeaderRenderer` | Inventory says header direct renderer missing/implemented tension at `docs/youtube_renderer_inventory.md:432` and `docs/youtube_renderer_inventory.md:761`. | No direct `FILTER_RULES.watchCardRichHeaderRenderer`; only nested paths inside `universalWatchCardRenderer` at `js/filter_logic.js:533-566`. | `NESTED_ONLY` | Fixture must prove direct renderer does not appear alone or add direct rules if it does. |
| `watchCardHeroVideoRenderer` | Inventory lists missing/extraction need at `docs/youtube_renderer_inventory.md:455`, `docs/youtube_renderer_inventory.md:751`. | Only nested paths inside `universalWatchCardRenderer` at `js/filter_logic.js:529-539`. | `NESTED_ONLY` / missing direct. | Fixture for direct hero renderer and universal wrapper variant; avoid hiding structural card shell. |
| `watchCardSectionSequenceRenderer` | Inventory says layout-targeted but still missing as a renderer at `docs/youtube_renderer_inventory.md:433`, `docs/youtube_renderer_inventory.md:752`. | No direct `FILTER_RULES.watchCardSectionSequenceRenderer`; recursive filter can walk child renderers at `js/filter_logic.js:3391-3425`. | `STRUCTURAL_RECURSE` | Fixture must prove sequence containers remain visible while child cards are individually filtered. |
| `watchCardRHPanelRenderer` / `watchCardRHPanelVideoRenderer` | Inventory says not parsed at `docs/youtube_renderer_inventory.md:434-435`, still missing at `docs/youtube_renderer_inventory.md:749`. | No matching `FILTER_RULES` entries found. | `MISSING` | Fixture first, then classify as JSON-first or DOM fallback; do not broad-hide RHS panel containers. |
| `compactAutoplayRenderer` | Inventory says it is still missing and frequently used in autoplay modules at `docs/youtube_renderer_inventory.md:460`, `docs/youtube_renderer_inventory.md:746`. | Not present in `FILTER_RULES` or the video-renderer allowlists at `js/filter_logic.js:2136-2143`, `js/filter_logic.js:2712-2719`. | `MISSING_AUTOPLAY` | Fixture must cover autoplay/end-screen continuity because this is directly related to the user review saying blocked videos still appear in the end-screen/autoplay wall. |
| `horizontalCardListRenderer` | Inventory marks album/refinement horizontal list as missing at `docs/youtube_renderer_inventory.md:436`, `docs/youtube_renderer_inventory.md:750`. | No direct `FILTER_RULES.horizontalCardListRenderer`; recursive processing will only affect recognized child renderers at `js/filter_logic.js:3408-3425`. | `STRUCTURAL_RECURSE_OR_UI_ONLY` | Fixture should leave the rail container intact, then classify child `searchRefinementCardRenderer` separately. |
| `searchRefinementCardRenderer` | Docs provide query/entity paths at `docs/json_paths_encyclopedia.md:2715-2723`; inventory says not parsed at `docs/youtube_renderer_inventory.md:438`. | No `FILTER_RULES.searchRefinementCardRenderer`; CHIP renderers are ignored at `js/filter_logic.js:409-413`, but refinement cards are not listed there. | `MISSING` / likely `UI_CHIP_OR_ENTITY`. | Fixture should decide whether keyword/channel blocking should hide refinement cards or leave them as navigation chips. |
| `compactChannelRenderer` | Docs provide standalone channel-card path at `docs/json_paths_encyclopedia.md:2725-2726`. | No `FILTER_RULES.compactChannelRenderer`; channel-only set has only `channelRenderer` and `gridChannelRenderer` at `js/filter_logic.js:404-407`. | `MISSING` | Fixture for search/channel cards; channel rule should hide only channel result, keyword rules should not misclassify. |
| `compactPlaylistRenderer` | Docs provide compact playlist paths at `docs/json_paths_encyclopedia.md:930-932` and release checklist repeats at `docs/json_paths_encyclopedia.md:4813-4817`. | Unwrapped from `richItemRenderer` at `js/filter_logic.js:1614-1615`, but no `FILTER_RULES.compactPlaylistRenderer`. | `UNWRAPPED_BUT_NO_RULES` | Fixture must decide owner/channel semantics for user-created playlists and whether playlist title keyword blocking should apply. |
| `playlistRenderer` / `gridPlaylistRenderer` | Playlist/mix docs at `docs/json_paths_encyclopedia.md:4755`; inventory marks playlist surfaces at `docs/youtube_renderer_inventory.md:582-586`. | Rules at `js/filter_logic.js:613-672`; `isPlaylist` at `js/filter_logic.js:1762-1767`. | `JSON_FIRST`, but playlist semantics need proof. | Fixture separates user playlist, channel playlist, and Mix; channel identity should be owner/creator, not arbitrary byline summary. |
| `radioRenderer` / `compactRadioRenderer` | Mix trace at `docs/json_paths_encyclopedia.md:188-239`; docs explicitly say radio renderers are not collaborator renderers at `docs/json_paths_encyclopedia.md:239`. | Rules at `js/filter_logic.js:673-689`; `isMix` guard at `js/filter_logic.js:1749-1755`; avatar-stack collaborator extraction exists at `js/filter_logic.js:2899-2995` and runs before the caller can apply a mix-only identity policy. | `MIX_GATED_METADATA_ONLY`, but current runtime still needs proof. | Mix/radio fixture with avatar stack must prove no collaborator hide unless the renderer is explicitly collaborative. |
| `shortsLockupViewModel` / `shortsLockupViewModelV2` | Docs show owner paths at `docs/json_paths_encyclopedia.md:2141-2172` and expanded checklist at `docs/json_paths_encyclopedia.md:4851-4869`. | Rules only include videoId/title at `js/filter_logic.js:816-823`; fallback can use `videoChannelMap` at `js/filter_logic.js:1858-1865`. | `PARTIAL_JSON` | Fixture must cover owner UC ID/handle paths, videoChannelMap fallback, and strict whitelist pending behavior. |
| `reelItemRenderer` | Docs show classic shorts paths at `docs/json_paths_encyclopedia.md:2186-2201`, `4872-4886`. | Rules have videoId/title/channelName only at `js/filter_logic.js:811-815`. | `PARTIAL_JSON` | Fixture for channel ID/logo path if present; avoid title-as-channel confusion. |
| `postRenderer` / `sharedPostRenderer` | Docs provide post paths at `docs/json_paths_encyclopedia.md:3275-3302` and checklist at `docs/json_paths_encyclopedia.md:4977-4982`. | Runtime has `backstagePostThreadRenderer` and `backstagePostRenderer` at `js/filter_logic.js:726-739`, but no `postRenderer` / `sharedPostRenderer`. | `PARTIAL_LEGACY_ONLY` | Fixture for new post renderers; decide whether comments/keyword/channel rules apply to posts and shared posts. |
| `channelRenderer` / `gridChannelRenderer` | Inventory/docs mark channel result surfaces as covered around `docs/youtube_renderer_inventory.md:404`. | Rules at `js/filter_logic.js:716-725`; channel-only set at `js/filter_logic.js:404-407`. | `JSON_FIRST_CHANNEL_ONLY` | Fixture that keyword rules do not accidentally hide channel cards unless channel-only policy says so; channel block/allow should use UC/handle. |
| `expandableMetadataRenderer` / `video-summary-content-view-model` | Inventory says AI summary text is not parsed at `docs/youtube_renderer_inventory.md:444-445`, still missing at `docs/youtube_renderer_inventory.md:747`. | No matching `FILTER_RULES` entries. | `MISSING_METADATA_OR_UI_ONLY` | Fixture must answer product intent first: if summaries are informational UI, ignore; if they can contain filtered terms, use metadata-only decision and never hide the player shell. |
| `channelSubMenuRenderer` / `sortFilterSubMenuRenderer` | Inventory says playlist/channel menu text is not parsed at `docs/youtube_renderer_inventory.md:504`, `docs/youtube_renderer_inventory.md:526`, `docs/youtube_renderer_inventory.md:748`. | No matching `FILTER_RULES` entries. | `UI_MENU_ONLY` unless future route-control needs it. | Fixture should prove menu labels are not hidden by keyword/channel rules; route-control can separately remove menu options if required. |
| `secondarySearchContainerRenderer` | Search container surface. | Empty rule at `js/filter_logic.js:591-593`; not in `WHITELIST_CONTAINER_RENDERERS` at `js/filter_logic.js:415-423`; search route has a special-case keep at `js/filter_logic.js:1923`. | `ROUTE_GATED_STRUCTURAL` | Fixture proves search containers stay intact on `/results` and do not fail-closed if the same renderer appears elsewhere. |
| `shelfRenderer`, `richShelfRenderer` | Inventory treats many shelves as containers/structural. | Both have title rules at `js/filter_logic.js:486-488`, `js/filter_logic.js:706-708`; recursive filter can remove whole renderer objects at `js/filter_logic.js:3408-3415`. | `STRUCTURAL_WITH_KEYWORD_HIDE` | Fixture proves shelf-title keyword matches are an intentional product behavior, not accidental broad shelf removal. |
| `horizontalListRenderer`, `itemSectionRenderer`, `sectionListRenderer`, `guideSectionRenderer`, `guideRenderer` | Inventory treats these as containers/structural. | Included in `WHITELIST_CONTAINER_RENDERERS` at `js/filter_logic.js:415-423`; recursion at `js/filter_logic.js:3391-3425`. | `STRUCTURAL_RECURSE` | Fixture proves containers are not hidden only because children are filtered; only child cards should be removed unless route-control says otherwise. |
| `relatedChipCloudRenderer`, `chipCloudRenderer`, `chipCloudChipRenderer` | Search/watch chip surfaces. | CHIP renderers at `js/filter_logic.js:409-413`; `_shouldBlock()` returns false at `js/filter_logic.js:1833-1835`. | `UI_ONLY_IGNORED` | Fixture that chips remain visible under normal keyword/channel blocking; separate route-control can hide chips if product wants. |
| `/youtubei/v1/player` response | Docs note player should be metadata-oriented at `docs/json_paths_encyclopedia.md:4958`; seed currently includes `/player`. | Seed endpoint list includes `/youtubei/v1/player` at `js/seed.js:612`; fetch path parses cloned JSON at `js/seed.js:633-636`, rebuilds `Response(JSON.stringify(processed))` at `js/seed.js:674-680`, and `processData()` harvests then recursively filters at `js/filter_logic.js:3434-3460`. | Desired `METADATA_ONLY_TARGET`; current behavior is `FULL_RECURSE_UNLESS_ENDPOINT_GATED`. | Fixture: `/player` may harvest owner/category/duration, but must not recursively remove player metadata/UI objects unless a specific rule requires it. |

Renderer inventory target:

```text
rendererContract = {
  rendererType,
  sourceDocPath,
  runtimeRulePath,
  classification:
    "JSON_FIRST"
    | "PARTIAL_JSON"
    | "NESTED_ONLY"
    | "DOM_FALLBACK_ONLY"
    | "STRUCTURAL_RECURSE_OR_UI_ONLY"
    | "METADATA_ONLY_TARGET"
    | "INTENTIONALLY_IGNORED",
  surfaces: ["home", "search", "watch", "shorts", "kids", "mobile"],
  allowedDecisions: ["block", "allow", "metadataHarvest", "noDecision"],
  identityRequirement: "stable" | "mapped" | "weak-ok" | "none",
  emptyInstallBehavior:
    "NO_FETCH"
    | "PARSE_ONLY"
    | "HARVEST_ONLY_RECURSE"
    | "FULL_RECURSE"
    | "DOM_GATED"
    | "DOM_ALWAYS_WHEN_ACTIVE",
  fixtureName
}
```

This is the path to reducing code burden safely. We should delete or narrow DOM fallback only after the corresponding renderer has a JSON fixture and a documented classification. The performance dimension is not optional: "skip filtering" is not enough if the code still parses, harvests, recursively walks, stringifies, or installs observers on an empty or irrelevant surface.

Renderer fixture seed list:

| Fixture name | Renderer / path | Failure mode it prevents |
| --- | --- | --- |
| `renderer.video.basic.home_search_watch.json` | `videoRenderer`, `compactVideoRenderer`, `playlistPanelVideoRenderer`, `endScreenVideoRenderer` | Core videos leak from watch rail/end screen or get removed without exact rule match. |
| `renderer.compact_autoplay.end_screen.json` | `compactAutoplayRenderer` | User blocks a video/channel but autoplay/end-screen wall still suggests it. |
| `renderer.compact_playlist.sidebar.json` | `compactPlaylistRenderer` | Rich item unwrap reaches a renderer with no rules and silently lets playlist cards through. |
| `renderer.search_refinement.entity_chip.json` | `searchRefinementCardRenderer` under `horizontalCardListRenderer` | Keyword rules hide navigational refinement chips or channel rules fail to identify entity-backed refinement cards. |
| `renderer.compact_channel.search.json` | `compactChannelRenderer` | Channel block/allow misses compact channel result or keyword rules hide channel cards by text only. |
| `renderer.watch_card_rhs_panel.json` | `watchCardRHPanelRenderer`, `watchCardRHPanelVideoRenderer` | New watch hero/right-hand panel either leaks blocked suggestions or container removal destroys layout. |
| `renderer.universal_watch_card.hero.json` | `universalWatchCardRenderer`, nested rich header/hero video | Entity/header identity is confused with CTA video or YouTube Mix playlist identity. |
| `renderer.shorts_lockup.owner_identity.json` | `shortsLockupViewModel`, `shortsLockupViewModelV2` | Shorts block/allow relies on title-only JSON and misses documented owner UC/handle paths. |
| `renderer.reel_item.owner_identity.json` | `reelItemRenderer` and active `reelPlayerOverlayRenderer` | Classic Shorts shelf hides by title/name without stable owner identity. |
| `renderer.mix_radio.avatar_stack_guard.json` | `radioRenderer`, `compactRadioRenderer`, avatar stack | YouTube Mix avatar stack is treated as a collaborator list and causes false channel block/allow. |
| `renderer.collaborator_sheet.authoritative.json` | `showDialogCommand` collaborator list | Real collaboration identity remains supported while mix/avatar visual stacks are ignored. |
| `renderer.post.shared_post.json` | `postRenderer`, `sharedPostRenderer`, legacy backstage renderers | Modern community posts leak or shared post author/original author gets confused. |
| `renderer.chip_cloud.ui_only.json` | `relatedChipCloudRenderer`, `chipCloudRenderer`, `chipCloudChipRenderer` | Search/watch chips stay visible under normal content rules unless a route-control explicitly targets chips. |
| `renderer.metadata.ai_summary_ui_only.json` | `expandableMetadataRenderer`, `video-summary-content-view-model` | AI summary/metadata text does not cause player/watch shell removal. |

Peer review corrections integrated in this pass:

- `gridVideoRenderer` is not safely covered by the shared base rule because the later duplicate `FILTER_RULES.gridVideoRenderer` object overrides the earlier `BASE_VIDEO_RULES` reference.
- `videoWithContextRenderer` and `lockupViewModel` need collaborator/owner fallback fixtures before they can be called complete JSON-first coverage.
- `/youtubei/v1/player` is only a desired metadata-only target; current seed/runtime behavior can still parse, stringify, harvest, and recursively filter player payloads.
- Structural containers are not uniform: some are pure recurse containers, `secondarySearchContainerRenderer` is route-gated, and shelves have title rules that can remove whole shelves.
- Renderer classification must carry `emptyInstallBehavior` because user-visible lag can come from parse/harvest/recursion even when no content is ultimately hidden.

### Renderer Fixture Deepening Pass - 2026-05-17

The fixture inventory must now become concrete payload expectations. A renderer is not considered covered because its name appears in `FILTER_RULES`; it is covered only when a sample payload proves candidate extraction and decision behavior on the documented surface.

| Fixture | Proof paths | Current code state | Expected candidate | Required decision assertions |
| --- | --- | --- | --- | --- |
| `renderer.grid_video.override_regression.json` | Initial shared base at `js/filter_logic.js:430-431`; later duplicate override at `js/filter_logic.js:604-609`. | Duplicate `gridVideoRenderer` rule drops shared fields such as description, duration, published time, and view count. | `videoId`, `title`, `channelName`, `channelId`, plus duration/date/view metadata if present. | Blocklist keyword/channel match works; no-rule does not mutate; duration/date filters do not silently fail because of duplicate override. |
| `renderer.video_with_context.collaborator_sheet.json` | Docs mark `showSheetCommand.sheetViewModel` as authoritative at `docs/json_paths_encyclopedia.md:152-168`; runtime currently lists normal byline/avatar paths at `js/filter_logic.js:436-465` and collaborator extraction reads `showDialogCommand` elsewhere. | Partial JSON support; collaborator sheet can be missed or replaced by weak fallback. | Primary uploader plus collaborator roster with id, handle, name, and logo. | Blocking any collaborator hides the video only when roster is authoritative; Mix/radio avatar stacks must not count as this fixture. |
| `renderer.lockup.owner_metadata_row.json` | Docs show decorated avatar path and metadata-row command-run fallback at `docs/json_paths_encyclopedia.md:3202-3208`; runtime only lists decorated-avatar channel ID at `js/filter_logic.js:489-501`. | Partial JSON support; mobile/YTM lockups can lack the avatar path while still carrying row command-run identity. | `contentId`/watch video ID, title, owner UC ID from avatar or metadata row, handle, duration/date. | Whitelist mode should not fail closed when metadata-row owner exists; blocklist should match owner by UC ID or handle. |
| `renderer.lockup.collaborator_sheet.json` | Docs describe nested collaborator roster for `videoWithContextRenderer` and `lockupViewModel` at `docs/json_paths_encyclopedia.md:3215-3221`. | Runtime collaborator roster path is not proven for this renderer family. | Same collaborator shape as the video-with-context sheet, associated to the lockup video. | Block/allow collaborator decisions must be identical between mobile `videoWithContextRenderer` and `lockupViewModel`. |
| `renderer.shorts_lockup.owner_identity.json` | Docs show modern Shorts owner ID/handle at `docs/json_paths_encyclopedia.md:2144-2151` and rich below-thumbnail owner paths at `docs/json_paths_encyclopedia.md:2166-2172`; runtime Shorts rule is title/video focused at `js/filter_logic.js:816` in earlier inventory. | Partial JSON support; Shorts whitelist can fail closed if owner identity is present but not extracted. | Video ID from `reelWatchEndpoint`, fallback inline video ID, title, owner UC ID, owner handle, thumbnail, view badge. | Blocklist owner match hides; whitelist owner allow shows; home-grid payload with no owner must enter explicit pending/unknown policy rather than accidental no-match hide. |
| `renderer.reel_item.owner_identity.json` | Docs list classic reel channel bar owner ID at `docs/json_paths_encyclopedia.md:2186-2190` and later summary at `docs/json_paths_encyclopedia.md:4872-4885`. | Runtime has classic reel support but fixture coverage is not proven. | `videoId`, headline/title, view count, channel bar UC ID/handle/name. | Same Shorts block/allow policy as modern lockup; active playback overlay must not be treated as unrelated metadata. |
| `renderer.search_refinement.entity_chip.json` | Docs show refinement query and associated entity ID/name at `docs/json_paths_encyclopedia.md:2715-2723`. | Missing/unsafe area: refinement cards are UI/entity chips, not ordinary video cards. | Query text, associated entity UC ID, associated entity name, thumbnail. | Normal keyword block must not broad-hide search refinement chips unless product explicitly defines route-control/category behavior; channel block may hide only if entity chip policy says so. |
| `renderer.compact_channel.search.json` | Docs show standalone channel card ID/display name at `docs/json_paths_encyclopedia.md:2725-2730`. | Needs first-class contract so channel cards are not hidden by video-only logic. | Channel ID, display name, subscriber/video count, thumbnail. | Channel block/allow must apply; video duration/date/content filters must not apply to a pure channel card. |
| `renderer.compact_playlist.creator_identity.json` | Docs list compact playlist base and creator name at `docs/json_paths_encyclopedia.md:4813-4820`; runtime unwraps `compactPlaylistRenderer` from rich item but no rule exists, so missing-rule path returns false. | Functional leak for playlist creator block/allow; performance no-op traversal on empty/no-rule paths. | Playlist ID, title, creator name/identity when present, video count. | Playlist cards should not be treated as videos. Creator block/allow only applies with stable identity; title keyword behavior needs explicit playlist policy. |
| `renderer.compact_autoplay.end_screen.json` | Inventory marks autoplay/end-screen modules as gaps; seed currently treats `/next` broadly. | Watch/autoplay wall can leak blocked suggestions or pay full recurse with no active rules. | Current video ID, autoplay candidate video ID/title/channel, duration. | End-screen/autoplay blocklist hides exact blocked video/channel; empty install does not recurse or rewrite `/next` beyond approved endpoint decision. |
| `renderer.watch_card_rhs_panel.json` | Inventory gap covers `watchCardSectionSequenceRenderer`, `watchCardRHPanelRenderer`, and `watchCardRHPanelVideoRenderer`; docs show universal watch card paths at `docs/json_paths_encyclopedia.md:2701-2713`. | Universal watch card nested rule exists, but direct RHS/panel containers are unproven. | Header entity identity, hero video/playlist, CTA label, nested panel video candidate. | Do not remove whole panel by container text unless rule is explicit; nested video/channel rules should target the nested candidate. |
| `renderer.post.shared_post.json` | Docs describe `postRenderer`/`backstagePostRenderer` and `sharedPostRenderer` author/sharer paths at `docs/json_paths_encyclopedia.md:3274-3302`. | Code covers old backstage shapes but not every modern `postRenderer`/`sharedPostRenderer` identity path. | Post ID, author UC/handle/name, shared post sharer UC/name, original post author/content. | Channel block can target author or sharer only by explicit policy; keyword block applies to post text without confusing original/sharer identity. |
| `renderer.mix_radio.avatar_stack_guard.json` | Docs warn Mix/radio avatar stacks are not collaborator rosters at `docs/json_paths_encyclopedia.md:238`; runtime has broad collaborator/avatar extraction in earlier proof. | False collaborator risk. | Mix/radio title, playlist ID, avatar stack names/images, no authoritative roster header. | Must not hide because an avatar stack name matches a blocked collaborator/channel unless a stable owner/playlist policy says so. |
| `renderer.metadata.ai_summary_ui_only.json` | Inventory notes AI summary/metadata renderers are missing; prior pass classified them UI-only unless explicit content-control exists. | Summary text should not remove a player/watch shell. | Summary text blocks, source metadata, no video owner candidate. | Keyword matches in summary must not hide the whole video card/player by default; future behavior requires a separate summary-content policy. |

Renderer fixture file shape:

```text
{
  "name": "renderer.lockup.owner_metadata_row",
  "surface": "main",
  "route": "home|search|watch|shorts|kids",
  "endpoint": "/youtubei/v1/browse",
  "rendererKey": "lockupViewModel",
  "payload": {},
  "expectedCandidate": {
    "kind": "video|short|playlist|channel|post|ui",
    "videoId": "",
    "channel": {
      "id": "",
      "handle": "",
      "name": "",
      "confidence": "stable|metadata-row|name-only|unknown"
    }
  },
  "settingsCases": [
    { "name": "empty-blocklist", "expect": "pass-through-no-mutate" },
    { "name": "block-channel", "expect": "hide" },
    { "name": "allow-channel", "expect": "show" },
    { "name": "unresolved-whitelist", "expect": "pending-or-explicit-fail-closed" }
  ]
}
```

Stop condition for renderer coverage:

```text
Every renderer in the inventory is one of:
  fixture-backed JSON enforcement
  fixture-backed metadata harvest only
  fixture-backed UI-only/non-filtering
  intentionally unsupported with documented leak/DOM fallback

No renderer can be considered covered only because a broad DOM selector or legacy layout script might see it later.
```

### UI State Creation Findings

| UI path | Proof | What the user can create | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Popup list-mode toggle | `js/popup.js:776-860` | Switches current surface between blocklist and whitelist; asks whether to copy blocklist if whitelist is empty. | UI sends `copyBlocklist`, but background currently ignores false and always merges. | `REWRITE` |
| Dashboard/topbar list-mode toggle | `js/tab-view.js:10506-10630` | Same mode switch for Main/Kids, plus managed-child edit support. | Managed child path respects `copyBlocklist`; background path does not. Same UI action has different semantics depending on profile edit context. | `REWRITE` |
| Rendered keyword list | `js/render_engine.js:193-210`, `js/render_engine.js:276-285` | Shows either blocklist keywords or whitelist keywords based on mode, not both. | User cannot inspect/compare both lists at once, which makes migration/copy/empty-whitelist mistakes harder to see. | `GATE` for future dual-mode UI |
| Rendered channel list | `js/render_engine.js:575-596`, `js/render_engine.js:660-662` | Shows either blocked channels or allowed channels based on mode, not both. | Same visibility problem as keywords; also hides `filterAll` in whitelist mode. | `GATE` |
| Channel `Filter All` toggle | `js/tab-view.js:10405-10419`, `js/render_engine.js:1125-1186` | Only available in blocklist mode. | Correct for current either/or model, but future simultaneous allow/block model needs separate semantics. | `KEEP` current, future `REWRITE` |
| Popup content filters | `js/popup.js:380-405`, `js/popup.js:474-501` | Popup can toggle duration/upload/uppercase enabled states without editing full parameters. | Duration/upload can become enabled with empty/old values and still wake active filters. | `REWRITE` validation |
| Tab category filters | `js/tab-view.js:800-844` | Saves `enabled`, `mode`, and `selected`. | Allows enabled with empty selected list; runtime later no-ops but still wakes. | `REWRITE` |
| Managed child edit state | `js/tab-view.js:4156-4204`, `js/tab-view.js:4222-4301` | Parent can edit child Main/Kids lists and settings without switching into child profile. | Good model; must keep Main/Kids state shape identical to active-profile path. | `KEEP` + fixtures |
| Subscriptions import whitelist enable | `js/tab-view.js:4648-4685`, `js/tab-view.js:4968-5006`, `js/tab-view.js:8320-8331` | Imports subscriptions into whitelist and can turn whitelist mode on. | Copy says blocklist left unchanged in one path but success text and background behavior conflict in another. | `REWRITE` copy contract |

### Popup And Dashboard UI Mutation Ledger - 2

This pass focuses on whether popup/dashboard UI creates clean runtime states. It is not enough for the UI to look correct; every control must mutate exactly one canonical target and must not wake filtering with incomplete rules.

| Method family | Proof | Mutation target | Finding | Verdict |
| --- | --- | --- | --- | --- |
| Popup profile/surface resolver | `js/popup.js:735-905` | `popupActiveProfileType`, then `FilterTube_SetListMode`. | The visible popup mode pill is rendered from `popupActiveProfileType`, which is later derived from the active browser tab URL. The click handler re-resolves the active tab and may target Main/Kids by URL, not by an explicit user-selected surface. This works for current popup-as-current-tab model but is not a strong state contract. | `REWRITE` with explicit surface parameter |
| Popup content-control booleans | `js/popup.js:474-501`, listeners at `js/popup.js:514-540` | `StateManager.updateContentFilters()` / `updateKidsContentFilters()`. | Popup only toggles `enabled` for duration/upload/uppercase and preserves prior parameter objects. If the prior parameter object is empty, stale, or invalid, the runtime can see an enabled filter with weak parameters. | `VALIDATE` before active |
| Popup keyword/channel add | `js/popup.js:1712-1767` | `StateManager.addKeyword/addKidsKeyword/addChannel/addKidsChannel`. | Current behavior adds to whichever list is active for the current surface through StateManager. That is coherent for either/or mode. Future simultaneous allow/block cannot reuse this handler without an explicit `listType`. | `KEEP` current; future `REWRITE` |
| Popup generic settings toggles | `js/popup.js:1778-1788`, enabled toggle at `js/popup.js:1818-1838` | `StateManager.updateSetting()`. | Direct UI-to-StateManager writes are simple but bypass a typed background mutation report. Runtime state is refreshed by storage broadcasts later. | `KEEP` short term; target background mutation API |
| Dashboard category selection | `js/tab-view.js:726-785`, save at `js/tab-view.js:828-877` | Main `categoryFilters`. | Allows `{ enabled:true, selected:[] }`. Runtime may later no-op, but active-state detection can still wake category filtering work. | `VALIDATE` selected non-empty before active |
| Dashboard video filters | `js/tab-view.js:1043-1187` | Main `contentFilters`. | Saving preserves prior values and only overwrites numeric fields when parsing succeeds. An enabled filter with no valid visible value can keep stale values or remain active without a clear user-visible reason. | `VALIDATE` structured rules |
| Kids dashboard category filters | `js/tab-view.js:2047-2084` | Kids `categoryFilters`. | Same enabled-empty risk as Main category filters, written through either managed-child surface save or StateManager. | `VALIDATE` selected non-empty before active |
| Kids dashboard video filters | `js/tab-view.js:2141-2284` | Kids `contentFilters`. | Same stale/incomplete parameter risk as Main video filters. | `VALIDATE` structured rules |
| Managed child surface editor | `js/tab-view.js:4156-4204`, `js/tab-view.js:4252-4301` | Direct `FilterTubeIO.loadProfilesV4()` / `saveProfilesV4()` profile mutation. | Powerful and useful parent workflow, but it is another persistence owner beside StateManager and background actions. It reloads StateManager after saving, but it does not get a typed background transition report. | `KEEP` + schema/fixtures |
| Managed child list-mode transfer | `js/tab-view.js:10562-10604` | In-place child surface mutation. | Managed child mode switch honors `copyBlocklist` and handles transfer locally, while normal active-profile mode delegates to background. Same UI action therefore has two implementations. | `CONSOLIDATE` |
| Active profile list-mode transfer | `js/tab-view.js:10606-10639`, popup analog `js/popup.js:835-869` | Background `FilterTube_TransferWhitelistToBlocklist` or `FilterTube_SetListMode`. | Correct central direction, but background implementation must honor copy/transfer intent exactly and return mutation details. | `KEEP` + transition report |
| Rendered keyword list | `js/render_engine.js:169-303`, row actions `js/render_engine.js:312-537` | `StateManager` keyword mutation APIs. | Renders only the active list and mutates by current mode. Good for current either/or model; insufficient for simultaneous block+allow UI because action intent is implicit. | `KEEP` current; future `listType` |
| Rendered channel list | `js/render_engine.js:548-760`, row actions `js/render_engine.js:872-1196` | `StateManager` channel mutation APIs. | Idle batching is good. Filter All is hidden in whitelist mode (`js/render_engine.js:1121-1157`, `js/render_engine.js:1168-1196`), which matches current semantics but must be redesigned before dual allow/block. | `KEEP` current |

### UI State Creation Findings - 2

Fresh proof pass on `tab-view.js` and `render_engine.js` confirms the UI disease is not a single button bug. The current UI model is "one active list per surface", while the future product direction is "block and allow can coexist". That migration cannot be done by only adding DOM cards; mutation APIs must become explicit about list type.

| Method / block | Proof | Current behavior | Disease risk | Required invariant |
| --- | --- | --- | --- | --- |
| Main category selection | `js/tab-view.js:726-785`, save `828-870` | Maintains `categorySelectedMain`; saves `{enabled, mode, selected}` through `StateManager.updateCategoryFilters(next)`. | `enabled:true` with `selected:[]` is still serializable and can wake runtime active checks with no useful filtering. | Save should coerce `enabled:false` or block save when `selected` is empty. |
| Main video filters | `js/tab-view.js:1043-1187` | Spreads prior duration/upload objects and only overwrites numeric fields when parsed values are valid. | A user can enable a filter while visible input is blank/invalid and still inherit old hidden thresholds. This can look like false hiding. | Enabled filter must have a complete visible predicate; invalid visible inputs must not preserve stale values silently. |
| Kids category/video filters | Category save `js/tab-view.js:2058-2075`; video save `js/tab-view.js:2152-2284`. | Same shape as Main, with managed-child and active profile variants. | Same enabled-empty/stale-threshold problem, plus Kids/app paths depend on these settings. | Same validation schema for Main, Kids, managed child, import, and sync. |
| Active list add/remove | Main/Kids add handlers `js/tab-view.js:11034-11324`; managed mutations `10314-10402`; StateManager mutations `js/state_manager.js:701-937`, `1338-1654`. | User add/remove goes to active list inferred from current `mode`. | Future simultaneous allow/block cannot infer user intent from `mode`; quick-block and 3-dot menu will also need explicit action intent. | Every list mutation takes `listType: "block" | "allow"` and `surface`. |
| List-mode toggle | `js/tab-view.js:10506-10630`. | Managed-child path mutates profile locally; active-profile path sends background actions. | Same visible action has two implementation paths and can diverge in copy/no-copy behavior. | One named transition function for popup, dashboard, managed child, import, Nanah. |
| Active-list-only keyword render | `js/render_engine.js:193-210`, empty copy `276-285`. | Main/Kids render only blocklist or whitelist based on active mode. | Users cannot inspect hidden inactive list at the same time, which masks migration bugs and makes dual-list design a schema change, not only UI chrome. | Future UI must show both lists or at least explicit per-row `Blocked`/`Allowed` tags. |
| Active-list-only channel render | `js/render_engine.js:575-596`, empty copy `655-663`. | Main/Kids render only blocklist or whitelist based on active mode. | Same as keywords; current row index points into whichever list is active. | Row actions must carry stable entry id/key and list type, not just list index. |
| Kids-to-Main display merge | Keywords `js/render_engine.js:212-240`; channels `js/render_engine.js:598-615`. | If `syncKidsToMain` and modes match, Kids entries are appended to Main display as `__ftFromKids`. | Good current guard. Future dual-list mode must not accidentally mix Kids allow entries into Main block entries or vice versa. | Sync merge requires matching surface + list type, not matching mode string only. |
| Channel row index lookup | `js/render_engine.js:673-721`. | Computes list index from active Main/Kids list and derived key for Kids synced rows. | Index-based actions are fragile once both block/allow lists can render together or when search/sort/date filters are applied. | Use stable normalized entry key plus list type for delete/toggle operations. |
| Filter All visibility | `js/render_engine.js:1121-1163`, fallback `1168-1196`; managed toggle guard `js/tab-view.js:10405-10420`. | Hidden/disabled in whitelist mode; mutates channel-derived keywords only in blocklist mode. | Correct for current model. Future "allow and block simultaneously" needs a clearer action: block all from channel, allow channel, allow all from channel, etc. | Keep current behavior until dual-list schema exists; do not bolt allow behavior onto `filterAll`. |

UI-to-runtime state flow:

```text
tab-view / popup control
  -> StateManager direct save OR background action OR managed-child IO write
  -> storage changes
  -> compiled settings refresh
  -> content bridge / seed / DOM fallback reprocess
```

Target flow:

```text
uiIntent(surface, listType, mutation)
  -> one background transition/mutation API
  -> validation schema rejects incomplete active rules
  -> returns mutation report + runtime revision
  -> UI/content consume the same revision
```

UI mutation target:

```text
uiMutation = {
  source: "popup" | "tab-view" | "managed-child" | "import" | "sync",
  profileId,
  surface: "main" | "kids",
  listType: "blocklist" | "whitelist" | "none",
  mutation,
  previousRevision,
  nextRevision,
  validationReport,
  runtimeActiveReport
}
```

Future dual allow/block cannot be implemented as a visual split only. The UI, StateManager, background action schema, JSON engine, DOM fallback, quick block, and 3-dot menu all need explicit `listType` / `decisionType` semantics.

### Canonical UI Mutation Intent Pass - 2026-05-17

This pass converts the popup/dashboard/import findings into named mutation intents. The disease is not that one UI control is wrong. The disease is that several UI surfaces can mutate the same profile/list state through different owners, with different validation, different background reports, and different runtime refresh behavior.

| Intent family | Current callers / proof | Current mutation owner(s) | Canonical intent | Required report |
| --- | --- | --- | --- | --- |
| `profile.switchActive` | Popup writes the active profile through direct storage/IO flow at `js/popup.js:1476-1508`; dashboard has separate profile management and unlock state paths. | Popup/dashboard local state plus IO/background refresh. | Background-owned active-profile transition with explicit `profileId`, profile type, lock state, and selected viewing surface. | Before/after active profile id, lock/auth result, affected Main/Kids surface modes, runtime revision. |
| `listMode.set` | Popup sends `FilterTube_SetListMode` at `js/popup.js:835-860`; dashboard normal path sends the same action at `js/tab-view.js:10624-10630`; managed-child path mutates profile objects directly at `js/tab-view.js:10574-10599`; background reads `copyBlocklist` at `js/background.js:3302` but currently enters merge/clear code at `js/background.js:3443-3445`. | Background for active profile, local IO write for managed child. | One transition function for active profiles and managed-child edits: `{ profileId, surface, nextMode, copyBlocklist, transferDirection }`. | Before/after mode, block/allow counts, copied count, cleared count, empty-whitelist warning, refresh targets, runtime revision. |
| `listMode.transferWhitelistToBlocklist` | Popup/dashboard call `FilterTube_TransferWhitelistToBlocklist`; background moves whitelist into blocklist and clears whitelist at `js/background.js:3866-3894`. | Background only for active profile; managed child has local equivalent. | Explicit destructive transfer intent, separate from a plain mode switch. It must not become the default behavior for future simultaneous allow/block. | Moved counts, dedupe count, cleared lists, active surface, refresh targets, rollback impossibility warning. |
| `rule.keyword.add` / `rule.keyword.remove` / `rule.keyword.toggleExact` / `rule.keyword.toggleComments` | Popup add calls `StateManager.addKeyword/addKidsKeyword` at `js/popup.js:1712-1725`; dashboard add calls the same APIs at `js/tab-view.js:11034-11045`; managed-child edits directly choose list keys from mode at `js/tab-view.js:10314-10369`; StateManager chooses whitelist/blocklist by current mode at `js/state_manager.js:1338-1535` and `js/state_manager.js:701-837`. | StateManager direct storage path, managed-child IO path. | `{ profileId, surface, listType: "block" | "allow", entryType:"keyword", word, exact, comments, source }`. | Normalized key, duplicate result, list changed, channel-derived keyword preservation, runtime revision. |
| `rule.channel.add` / `rule.channel.remove` / `rule.channel.toggleFilterAll` | Popup channel add uses `StateManager.addChannel/addKidsChannel` at `js/popup.js:1737-1767`; dashboard add uses same APIs at `js/tab-view.js:11131-11149`; managed-child channel edits choose list keys by mode at `js/tab-view.js:10372-10420`; background whitelist add uses `addWhitelistChannelPersistent` at `js/background.js:3498-3536`; subscription import writes whitelist at `js/background.js:3537-3705`. | Split between StateManager, background, and managed-child IO. | `{ profileId, surface, listType, channelIdentity, action:"add"|"remove"|"toggleFilterAll", confidence }`. | Identity confidence, normalized channel key, network fetch budget, channelMap writes, filterAll derived keyword delta, refresh targets. |
| `contentFilter.set` | Popup toggles enabled-only content controls at `js/popup.js:474-501`; dashboard saves video filters at `js/tab-view.js:1043-1187`; Kids dashboard saves equivalent state at `js/tab-view.js:2152-2284`; StateManager shallow-merges at `js/state_manager.js:2115-2155`. | StateManager direct save and managed-child direct save. | Validated predicate update, not raw boolean storage. Enabled duration/upload filters must contain complete visible thresholds/dates. | Validation result, normalized predicate, previous stale values discarded or explicitly kept, active-runtime delta. |
| `categoryFilter.set` | Dashboard saves Main categories at `js/tab-view.js:828-877`; Kids saves at `js/tab-view.js:2058-2075`; StateManager persists selected lists at `js/state_manager.js:2162-2205`; seed treats enabled as active at `js/seed.js:214-223`, while filter logic no-ops empty selected at `js/filter_logic.js:2126-2134`. | StateManager and managed-child direct save. | Category filter is active only when `selected.length > 0`. Empty selected coerces inactive or blocks save. | Selected count, normalized categories, active-runtime delta, reason if inactive. |
| `subscriptions.importWhitelist` | Tab import path switches to whitelist with `copyBlocklist:false` at `js/tab-view.js:4648-4660`; background batch import writes whitelist channels and maps at `js/background.js:3537-3705`; StateManager import sender calls `FilterTube_BatchImportWhitelistChannels` at `js/state_manager.js:1787`. | Background plus tab-view follow-up mode action. | Import adds allow entries only unless the user separately chooses transfer/copy. | Imported count, duplicate count, channelMap writes, mode change requested, proof blocklist was preserved when `copyBlocklist:false`. |
| `settings.importFullOrScoped` | IO import extracts Main/Kids modes and lists at `js/io_manager.js:1323-1359`, writes root/settings/V3/V4 at `js/io_manager.js:1361-1653`; Nanah scoped apply writes active profile Main/Kids data at `js/nanah_sync_adapter.js:168-257`; incoming apply routes through scoped apply or full IO import at `js/nanah_sync_adapter.js:351-377`. | IO manager and Nanah adapter direct writes. | Transactional settings transfer with preview, validation, and one runtime revision after commit. | Scope, strategy, before/after mode/list counts, empty whitelist warnings, writes performed, channelMap/trusted-state changes. |
| `runtime.learnIdentityMap` | Seed harvest can emit learned maps through filter logic; content bridge persists video/channel metadata and map updates; storage listeners can refresh settings and DOM fallback. | Seed/filter engine, content bridge, background/storage maps. | Learned identity is metadata, not a rule mutation. It must be budgeted separately from enforcement and tied to a pending rule or explicit harvest mode. | Learned key count, confidence, source endpoint/DOM route, whether any active pending decision can use it, whether DOM rerun is justified. |
| `contentUserAction.quickBlockOrMenu` | Quick block, 3-dot menu, fallback menu, playlist/post/channel paths can add rules and often optimistically hide DOM before background confirmation. | Content bridge, block-channel helper, background channel add, StateManager refresh. | User action intent must carry target identity, visible surface, rule destination, optimistic hide policy, and rollback owner. | Action id, identity confidence, created rule id, optimistic hide decision, rollback/success outcome, runtime revision. |

Canonical mutation payload target:

```text
filterTubeMutationIntent = {
  name,
  source: "popup" | "dashboard" | "managedChild" | "backgroundAction" | "import" | "nanah" | "contentUserAction" | "nativeApp",
  actor: {
    trustedUi,
    profileUnlocked,
    userInitiated
  },
  target: {
    profileId,
    surface: "main" | "kids",
    listType?: "block" | "allow",
    route?: "home" | "search" | "watch" | "shorts" | "kids" | "unknown"
  },
  payload,
  validation,
  expectedWrites,
  sideEffects,
  report: {
    before,
    after,
    warnings,
    runtimeRevision,
    refreshTargets
  }
}
```

Mutation authority invariant:

```text
UI does not write compiled runtime truth.

UI requests a typed mutation.
Background/profile transaction validates and writes state.
The same transaction compiles or requests the compiled runtime payload.
Content, seed, DOM fallback, quick block, and native apps consume the same revision.
```

This is also the migration boundary for the future simultaneous block/allow UI. The existing either/or model can keep working, but every new UI row, quick action, app control, import flow, and Nanah transfer must say whether it is creating a block rule or an allow rule. Inferring list type from the current mode is the exact pattern that will keep causing false hides and migration bugs.

### Popup UI Mutation Ledger - 3

Fresh read of `js/popup.js:1-1841` confirms the popup is not a YouTube-page performance source by itself, but it is a settings-authority source. Its risk is not DOM lag; its risk is creating or broadcasting states that later make the content runtime heavy or imprecise.

| Surface | Proof | Current behavior | Disease risk | Required invariant |
| --- | --- | --- | --- | --- |
| Popup session lock marker | `js/popup.js:609-616` | Sets `window.FilterTubeIsUiLocked = () => true` before UI boot, then later replaces it from profile lock state in `js/popup.js:1276-1287`. | Good local guard for popup components, but it is popup-local and should not be treated as runtime authority. | Popup lock state must only gate UI interaction; compiled runtime state must come from profile/background authority. |
| Duplicate active-tab surface resolver | First resolver `js/popup.js:408-433`; second resolver inside list-mode render `js/popup.js:738-774`; visibility use `js/popup.js:435-459`; mutation use `js/popup.js:804-860`. | Popup repeatedly derives Main/Kids from the active browser tab URL. | Same popup session can render, hide rows, and mutate modes from separate async URL lookups. If active tab changes or popup-selected profile state lags, the target can drift. | Resolve one immutable popup target at open time, display it, and pass it to every mutating control. |
| Visible mode label versus write target | Label uses `popupActiveProfileType` at `js/popup.js:776-793`; click handler re-resolves active tab at `js/popup.js:810-813`. | User sees a mode pill for `popupActiveProfileType`, but mutation target is independently resolved. | Mis-targeted Main/Kids mode changes are possible if visible state and active-tab URL diverge. | UI intent must carry `{profileId, surface}`; write path must not re-infer target. |
| Content filter profile target | Visibility uses active tab URL at `js/popup.js:435-459`; apply uses active tab URL at `js/popup.js:461-469`; save uses passed profile type at `js/popup.js:474-501`; listeners re-resolve at `js/popup.js:514-540`. | Compact popup video filters show Main or Kids rows and save only enabled bits. | Target is URL-derived, not a stable UI selection. Enabled-only saves can revive stale duration/upload settings that are hidden from popup. | Compact controls must validate a complete active predicate or route user to full editor before enabling. |
| Popup-only search filtering | `js/popup.js:1598-1617`; search listeners `js/popup.js:1691-1709`. | Uses `row.style.display` and `groupEl.style.display` only inside popup UI. | Low risk for YouTube page lag or false-hide because this does not touch content scripts. | Keep scoped to popup DOM; never reuse this as YouTube renderer filtering logic. |
| Generic catalog toggles | Checkbox list captured at `js/popup.js:631-634`; checked state from `state[key]` at `js/popup.js:1620-1629`; write at `js/popup.js:1778-1788`. | Every catalog key becomes a direct `StateManager.updateSetting(key, checked)` write. | Settings have no per-key route/cost metadata at mutation time, so a cheap-looking toggle can wake JSON/DOM runtime work later. | Catalog controls need schema metadata: affected surfaces, active-work cost, required supporting values, and runtime revision. |
| Keyword/channel add | Keyword add `js/popup.js:1712-1725`; channel add `js/popup.js:1736-1767`. | Delegates to `StateManager.addKeyword/addKidsKeyword/addChannel/addKidsChannel` based on `popupActiveProfileType`. | Correct for current either/or mode, but it inherits StateManager active-list inference. Future simultaneous allow/block cannot use this button without explicit action intent. | Add actions carry `{surface, listType, entryType, source:"popup"}`. |
| List-mode copy prompt | Prompt `js/popup.js:816-831`; transfer prompt `js/popup.js:835-851`; background message `js/popup.js:854-860`. | Popup asks whether to copy blocklist into whitelist or transfer whitelist back. | User intent is captured in UI, but background behavior currently diverges from `copyBlocklist:false`. | Background transition must return a report proving what moved, what stayed, and whether resulting active mode is empty. |
| Profile switching | Profile menu writes active profile through IO at `js/popup.js:1476-1508`. | Popup directly saves `ftProfilesV4.activeProfileId` then reloads StateManager and UI. | Another writer beside background and tab-view; active profile changes can invalidate runtime without one mutation report. | Profile switches must be a typed background/profile transition with revision and compiled-runtime refresh result. |
| PIN unlock notification | Local verification at `js/popup.js:1226-1262`; background notification sends raw PIN at `js/popup.js:721-730`. | Popup verifies locally and notifies background session auth. | Trusted extension UI path is acceptable, but background action schema must reject content/page senders. | `FilterTube_SessionPinAuth` sender must be trusted UI only, with payload schema and no content-script access. |

Popup mutation flow observed:

```text
popup open
  -> StateManager.loadSettings()
  -> popupActiveProfileType inferred asynchronously from active tab URL
  -> user action
     -> StateManager direct write OR background mode action OR FilterTubeIO profile save
  -> StateManager reload / UI rerender
  -> storage listeners/content refresh later decide runtime truth
```

Target popup mutation flow:

```text
popup open
  -> background returns popupSessionTarget {
       activeProfileId,
       surface,
       mode,
       runtimeRevision,
       uiLocked
     }
  -> user action emits typed intent with that target
  -> background/profile mutation API validates and writes
  -> returns mutationReport + nextRuntimeRevision
  -> popup rerenders from returned state, not from a second tab inference
```

### Legacy Layout Repair Ledger - 2

This pass covers `js/layout.js`. Static search shows `layout.js` is not referenced by `manifest.json`, `manifest.chrome.json`, `manifest.firefox.json`, `manifest.opera.json`, or the current `dist/*/manifest.json` files. It is therefore not an active content script today. It still matters because `docs/youtube_renderer_inventory.md` marks several watch-card renderers as handled by this file, and because reintroducing it would create a broad false-hide and layout-fight risk.

| Method / block | Proof | Current behavior | Disease risk | Required invariant |
| --- | --- | --- | --- | --- |
| Global export only | `js/layout.js:9`, no refs from `rg "layout\\.js|filterTubeLayout"` except the file itself and docs | Defines `window.filterTubeLayout` with no active caller in current manifests. | Dead code can become dangerous if later copied into apps or re-added to content scripts without the current audit context. | Classify as `legacy/orphan`; do not ship as an active script until rewritten behind tests. |
| Search/mix repair | `js/layout.js:14-47` | For every `.yt-lockup-view-model-wiz--horizontal.filter-tube-visible`, forces image/metadata containers visible and flexes widths to `50%`. | Assumes `filter-tube-visible` is authoritative. If stale visible classes remain on recycled cards, it can force YouTube layout into an old state. | Layout repair may only run on nodes with a fresh decision revision and route-specific renderer contract. |
| Visibility propagation to watch list containers | `js/layout.js:49-60`, watch-card repairs `245-324` | Adds `.filter-tube-visible` to nested lists when parent watch card is visible, then force-writes display/width/margins. | This promotes a visual marker into a decision marker. Nested children become "visible" without independent filtering evaluation. | Visibility classes must not be decision inputs; use structured `data-filtertube-decision-revision` / owner ids instead. |
| Channel grid rewrite | `js/layout.js:62-113` | Detects channel pages and force-sets rich-grid containers to CSS grid with inline `!important`, then rewrites row renderers to `display:contents`. | Fights YouTube's virtualized grid layout and can create scroll/measurement jank, especially after SPA route changes. | No global YouTube layout rewrites; only remove/restore FilterTube-owned hidden nodes. |
| Search page rewrite | `js/layout.js:116-181` | Forces search result items to flex, thumbnails to `360x202`, Shorts thumbnails to `176x312`, and containers to max width. | Can override responsive layouts, compact variants, and newer renderer models. It can also make empty-install/search lag worse if called after every fallback pass. | Renderer-specific CSS should be static, scoped, and only applied to FilterTube-owned wrappers if needed. |
| Shorts shelf rewrite | `js/layout.js:333-468`, homepage direct rewrite `474-614` | Forces Shorts shelves/items into horizontal flex, removes transforms, rewrites arrow positions, and sets fixed card sizes. | YouTube horizontal lists use transforms/virtualization; removing transforms and fixed sizing can break scrolling and cause expensive layout recalculation. | Shorts layout should not be rewritten by JS; JSON/DOM filtering should remove blocked items and let YouTube's shelf own layout. |
| Extreme hidden writer | `js/layout.js:622-640` | Sets display, dimensions, overflow, position, visibility, opacity, and pointer events on any passed element. | This is not symmetric with current `toggleVisibility()` restore semantics. If applied to a false-positive or recycled node, normal restore may not recover all inline styles. | One hide/restore primitive only; never use one-off extreme inline style writers. |
| Broad non-visible hide sweep | `js/layout.js:645-679` | Selects many YouTube renderers with `:not(.filter-tube-visible)` and applies extreme hiding, then rewrites grid layout. | This is the clearest false-hide disease: if the file runs before visible markers are stamped, every normal result is treated as hidden even without matching a filter. | Never infer "hide" from absence of a visible marker. Hide only from an explicit structured decision. |
| Renderer inventory dependency | `docs/youtube_renderer_inventory.md:429`, `431`, `433` | Marks watch-card hero/list/sequence tags as handled by `js/layout.js`. | Because `layout.js` is not active, those entries overstate runtime coverage. | Update inventory later: layout-only coverage is not accepted coverage; JSON/DOM fallback fixtures must prove those renderers. |

Current layout-script flow if re-enabled:

```text
filter pass stamps some .filter-tube-visible classes
  -> filterTubeLayout.fixLayoutAfterFiltering()
  -> broad querySelectorAll(:not(.filter-tube-visible))
  -> ensureElementHidden()
  -> inline display/size/position/visibility/opacity writes
  -> YouTube layout engine must recover around forced styles
```

Target rule:

```text
No content is hidden because it is missing a "visible" marker.

Only this may hide content:
  structuredDecision.hide === true
  decision.revision is current
  decision.reason is explicit
  writer is the central hide primitive
  restore path clears every style/attr/class the writer owns
```

Verdict: `js/layout.js` should remain quarantined. The useful idea inside it is not the JS layout rewriting; it is the list of renderer surfaces that need real JSON/DOM fixtures. The file should either be removed after inventory migration or kept with a clear `legacy/orphan` note so future work does not accidentally revive it.

### UI Component / HTML Entry / Shell Asset Ledger - 1

This pass covers shared UI components, static extension HTML entries, and shell-only decorative assets. These files are not the core YouTube page filtering engine, but they can still create unsafe state, version drift, release/privacy drift, or low-end UI cost.

| Surface | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Basic text components | `js/ui_components.js:82-89`, `js/ui_components.js:193-212`, `js/ui_components.js:331-360`, `js/ui_components.js:882-888` | Uses `textContent` / input values for labels, list items, badges, and normal buttons. | Low injection risk for user-entered keywords/channels. | `KEEP` |
| `flashButtonSuccess()` | `js/ui_components.js:97-121` | Stores original text/style, then restores with `setTimeout`. | If a button is removed/reused or flashed twice, the delayed restore can write stale text/styles into a new UI state. | `INSTRUMENT` and add timeout ownership/cancel path |
| `createToggleButton()` | `js/ui_components.js:133-157` | Toggles visual active state and `aria-pressed` before `onToggle()` result is known. | Optimistic UI can drift from storage/background if an async mutation fails, is rejected by PIN/profile policy, or is overwritten by managed-child state. | `REWRITE` for async mutation result binding |
| `createTabs()` | `js/ui_components.js:244-316` | Uses `btn.innerHTML = tab.label` and `contentWrapper.innerHTML = tab.content` when strings are supplied. | Safe only for static trusted strings. Imported profile names, rule names, Nanah metadata, or YouTube-derived text must never enter these string paths. | `KEEP` with callsite allowlist |
| Static SVG/icon HTML helpers | `js/ui_components.js:164-175`, `js/ui_components.js:860-867` | Uses `innerHTML` for static SVG delete/icon buttons. | Safe while icons are compile-time constants; unsafe if any caller passes user/imported markup. | `KEEP` with static-icon contract |
| Custom select enhancement | `js/ui_components.js:468-845` | Hides the real select, appends dropdown to `document.body`, positions with `getBoundingClientRect()`, schedules RAFs, dispatches `change` and `input`, and installs resize/scroll/document listeners plus a `MutationObserver`. | Good UX, but there is no destroy method. Rebuilt popup/dashboard surfaces can leave body dropdowns, global listeners, and observers alive. Dispatching both `change` and `input` can also double-run callers that listen to both. | `INSTRUMENT` then add cleanup API |
| Toast helper | `js/ui_components.js:940-958` | Removes existing `.ft-toast`, appends one toast, and removes after timers. | Popup/dashboard-only; low runtime risk, but timers should be ignored when surface unmounts. | `KEEP` |
| Legacy layout repair JS | `js/layout.js:9-680` | Defines `window.filterTubeLayout`, rewrites YouTube display/layout styles, and hides every matching renderer lacking `.filter-tube-visible`. | Search shows no manifest/script reference to `layout.js`, but if reintroduced it can hide non-matching content by default and fight YouTube layout. | `QUARANTINE` |
| Extension HTML font loading | `html/popup.html:12-14`, `html/tab-view.html:12-14` | Loads Google Fonts in extension UI documents. | Not a YouTube page lag source, but it weakens offline/privacy/store-review claims compared with a fully bundled UI. | `REWRITE` to bundled/local fonts before public release hardening |
| Popup shell media | `src/extension-shell/popup.jsx:12-22`, `js/ui-shell/popup-shell.js:270-300` | Popup mounts a muted looping hero video with `preload="metadata"`. | Popup-only visual cost; acceptable if asset stays small and reduced-motion is honored. Not related to Main YT page lag. | `KEEP` + UI asset budget |
| Tab-view shell media | `src/extension-shell/tab-view-decor.jsx:7-18`, `js/ui-shell/tab-view-decor.js:270-323` | Dashboard mounts ambient video/glow decor outside YouTube content pages. | Dashboard-only visual cost; should remain out of content scripts and obey reduced-motion. | `KEEP` + UI asset budget |
| Popup fixed width shell | `src/extension-shell/shared/runtime.js:34-50` | Forces popup root/body width to `392px`. | Correct for extension popup, but it should not be reused for native/app responsive surfaces. | `KEEP` scoped to popup only |
| Dashboard app release cards | `html/tab-view.html:193-230` | Static Android/iOS app cards link to `https://www.filtertube.in/downloads`. | Product claim surface only; not filtering logic. Needs release-state copy to match actual Play/TestFlight availability. | `KEEP` with release checklist |
| Release version drift | `html/tab-view.html:137`, `html/tab-view.html:884`, `data/release_notes.json:5-18` | Static dashboard says `v3.3.1`, while release notes include `3.3.2`. | Users can see future/current mismatch, and packaged release claims may diverge from runtime version. | `GATE` release build on one version source |
| Whitelist help copy | `html/tab-view.html:1378-1385` | Help tells users to switch to blocklist, use the 3-dot menu, then switch to whitelist. | This documents current workaround but conflicts with the future simultaneous allow/block model and can be stale if whitelist mode intentionally hides quick/3-dot actions. | `REWRITE` when dual-list model is designed |
| YouTube Kids help copy | `html/tab-view.html:1443-1485` | Explains passive YouTube Kids behavior and native YouTube block separation. | Good clarity; must remain aligned with app/native Kids changes and not imply child-accessible rule mutation. | `KEEP` |
| Empty troubleshoot page | `html/troubleshoot.html` is `0` lines. | Tracked empty entry file. | Dead packaged artifact if included anywhere; creates maintenance confusion. | `REMOVE` or document as placeholder |

UI component invariant:

```text
Extension UI helpers may mutate popup/dashboard DOM,
but any control that mutates filtering state must resolve through:
  explicit profile id
  explicit surface: main | kids
  explicit list type: blocklist | whitelist
  validated active-state report
  storage/background success result before final visual commit
```

This does not explain the reported Main YouTube lag by itself. It does explain how UI-created state can become the wrong runtime state, and it marks stale/orphan UI assets that can confuse release testing.

### IO / Import / Export / Nanah Mutation Ledger - 1

This pass treats file import/export, encrypted backup, auto-backup, and Nanah sync as high-authority settings writers. These paths can change active list mode, lists, profile settings, channel maps, and trusted-device state without the user touching the normal popup/dashboard controls.

| Method family | Proof | Mutation target | Finding | Verdict |
| --- | --- | --- | --- | --- |
| Keyword import sanitizer | `js/io_manager.js:136-180` | Keyword entries for Main/Kids blocklists and whitelists. | Missing `comments` defaults to `false` in IO imports (`js/io_manager.js:148-153`), while other runtime paths often treat comments as enabled unless explicitly false. Import can therefore change rule reach compared with UI-created entries. | `INSTRUMENT` + fixture |
| Channel import sanitizer | `js/io_manager.js:321-338` | Channel entries from raw strings. | Raw string imports set both `name` and `id` to the same text. This preserves old backups, but it creates low-confidence "id-like" records from names until enrichment resolves them. | `KEEP` + confidence flag |
| V4 profile load | `js/io_manager.js:561-618` | `ftProfilesV4`. | `loadProfilesV4()` is not read-only. It writes sanitized profile repairs and writes a legacy-derived V4 profile when missing. Any caller that only wanted to inspect profiles can trigger a migration write. | `INSTRUMENT` |
| V4 profile save | `js/io_manager.js:620-625` | `ftProfilesV4`. | Invalid saves return `writeStorage({})` rather than throwing. Callers can believe a profile mutation succeeded when nothing meaningful was written. | `REWRITE` to explicit failure |
| Full import auth gate | `js/io_manager.js:1234-1271` | Import into Default/Master profile. | Local and incoming master PIN checks exist for Default/Master import. Good protection boundary; needs fixtures so future import UI cannot bypass it. | `KEEP` + tests |
| Import parse and list-mode extraction | `js/io_manager.js:1323-1359` | Main/Kids channels, keywords, whitelist lists, and modes. | Import can carry blocklist or whitelist mode for Main and Kids directly from V4/V3 payload. This is correct for backup restore, but it means empty or strict whitelist states can arrive outside the manual warning flow. | `GATE` preview |
| Root settings import write | `js/io_manager.js:1361-1411` | Legacy/root settings through `FilterTubeSettings.saveSettings()`. | Full/default import can write root settings and Main lists before V3/V4 profile writes finish. Import is a multi-write transaction without a revision/rollback envelope. | `REWRITE` transaction report |
| Legacy V3 mirror write | `js/io_manager.js:1429-1485` | `ftProfilesV3`. | V3 mirror is still updated for Default/Master scope. This keeps compatibility, but it is a second state owner and can drift if later V4 write fails. | `INSTRUMENT` |
| V4 merge/replace write | `js/io_manager.js:1488-1653` | `ftProfilesV4`. | Import merges/replaces profile settings and Main/Kids lists directly, including `mode`. This is the correct authority for backups, but it must emit the same active-mode warning summary as UI list-mode changes. | `GATE` preview/summary |
| Channel map import write | `js/io_manager.js:1665-1667` | `channelMap`. | Import can update channel identity map independently from profile rules. Good for fidelity, but imported map confidence/version should be visible in the transition report. | `INSTRUMENT` |
| Trusted Nanah restore | `js/io_manager.js:1669-1704`, export path `js/io_manager.js:1707-1734` | `ftNanahTrustedLinks`, `ftNanahDeviceId`. | Trusted-device state is exported only when requested and restored only with `auth.restoreTrustedNanahState === true`, full scope, and Default/Master target. This is a good safety gate and should be kept. | `KEEP` + tests |
| Encrypted import wrapper | `js/io_manager.js:1737-1748` | Delegates to `importV3()`. | Decrypts then applies the same multi-write import path. Encrypted import security does not reduce the need for the same preview/transition report. | `KEEP` + report |
| Auto-backup flow | `js/io_manager.js:1760-1988` | Downloads folder backup files. | Auto-backup writes files and probes backup directory by creating/removing a test file. Not a YouTube-page lag source, but it is a side-effect path that should remain off unless user enabled it. | `KEEP` + side-effect log |
| Nanah scoped export | `js/nanah_sync_adapter.js:119-166` | Active profile Main/Kids subtree. | Scoped export sends the raw active profile section. Good local-first shape, but the payload does not carry a validation summary of mode/list counts. | `KEEP` + summary |
| Nanah scoped apply | `js/nanah_sync_adapter.js:168-257` | Direct `ftProfilesV4` save through IO. | Applies Main/Kids `mode` and lists directly to the target profile. The merge path preserves existing whitelist mode if incoming mode is absent (`js/nanah_sync_adapter.js:198`, `js/nanah_sync_adapter.js:222`), which can surprise users. | `GATE` preview |
| Nanah envelope serialization | `js/nanah_sync_adapter.js:302-349` | JSON-string envelope payload. | Payload is transported as a JSON string inside `app_sync` / `control_proposal`. Correct for Nanah, but parsing failures and payload summary should be first-class diagnostics. | `INSTRUMENT` |
| Nanah incoming apply | `js/nanah_sync_adapter.js:351-377` | Scoped V4 apply or full IO import. | `preview` returns the portable payload, while `main/kids` apply directly and `active/full` call IO import. The preview should compute the resulting target mode/list counts before the user approves. | `REWRITE` preview summary |
| Tab-view Nanah apply/refresh | `js/tab-view.js:7651-7697` | Runtime UI refresh after sync apply. | After applying an envelope, tab-view reloads StateManager and refreshes the dashboard. Good UI recovery, but there is no shared mutation revision proving content scripts consumed the same settings. | `INSTRUMENT` revision |
| Managed Nanah proposal path | `js/tab-view.js:7874-8103` | Trusted/managed incoming control proposals. | Trusted managed receivers can auto-apply proposals according to local policy. This is intentional parent-control behavior, but it must share import preview warnings for destructive/empty whitelist states. | `GATE` policy fixtures |

Settings-transfer target:

```text
settingsTransfer = {
  channel: "file-import" | "encrypted-import" | "nanah" | "subscriptions-import" | "auto-backup",
  scope: "full" | "active" | "main" | "kids",
  strategy: "merge" | "replace" | "preview",
  targetProfileId,
  writes: ["rootSettings", "ftProfilesV3", "ftProfilesV4", "channelMap", "nanahTrustedState"],
  authReport,
  validationReport,
  runtimeRefreshReport
}
```

Import/sync invariant:

```text
Every path that can change mode or lists must produce the same transition summary:
  before mode/list counts,
  after mode/list counts,
  empty whitelist warnings,
  active content/category rule warnings,
  writes performed,
  content-runtime revision to refresh.
```

Without this, the product can look correct in the popup while a file import, Nanah sync, managed-child edit, or old-profile migration silently creates a state that hides too much or wakes too much.

### Security / PIN / Encryption Boundary Ledger - 1

This pass does not judge UX polish. It records which security paths protect profile access, backup import/export, and background session unlocks. The main audit question is whether protected state writes can happen outside those gates.

| Method family | Proof | Boundary | Finding | Verdict |
| --- | --- | --- | --- | --- |
| WebCrypto availability | `js/security_manager.js:4-10`, `js/security_manager.js:37-42` | Browser WebCrypto. | Security manager fails closed when WebCrypto/subtle is unavailable. Good for backup/PIN features. | `KEEP` |
| PIN verifier creation | `js/security_manager.js:97-110` | PBKDF2-SHA256, 150,000 iterations, random 16-byte salt. | Stores verifier metadata, not raw PIN. Adequate local profile lock primitive for current product scope; needs compatibility tests across browsers. | `KEEP` + tests |
| PIN verification | `js/security_manager.js:112-123` | PBKDF2-SHA256 verifier compare. | Uses direct base64 string compare. The PIN threat model is local UI access, not a remote timing oracle, but this should still be documented as local-only protection. | `KEEP` |
| Backup encryption | `js/security_manager.js:125-154` | AES-GCM with PBKDF2-SHA256, random salt and IV. | Encrypted exports are real encrypted JSON containers, not just obfuscation. Password/PIN is required and never defaulted. | `KEEP` |
| Backup decryption | `js/security_manager.js:156-190` | AES-GCM decrypt then JSON parse. | Unsupported KDF/cipher and empty payload fail closed. Decrypted payload still enters IO import, so import validation/preview remains required. | `KEEP` |
| Background session PIN cache | `js/background.js:647-677`, sender gate `js/background.js:3266-3278` | In-memory background Map keyed by profileId. | Trusted UI sender can cache a verified PIN for session use. This supports encrypted auto-backup and app unlock state, but cache lifetime should be explicit and clear on lock/profile change. | `INSTRUMENT` |
| Auto-backup encryption decision | `js/background.js:811-829` | Active profile PIN + session cache. | Auto-backup encrypts when configured or when active profile has PIN, but skips if no session PIN is cached. Good fail-safe; user should see skip status. | `KEEP` + surfaced status |
| Popup unlock flow | `js/popup.js:1226-1262`, background notification `js/popup.js:721-730` | Local verifier check then `FilterTube_SessionPinAuth`. | Popup verifies locally and notifies background with the raw PIN so background can verify/cache it. This is acceptable inside extension-local trust, but should stay restricted to trusted UI senders. | `KEEP` + sender tests |
| Tab-view unlock flow | `js/tab-view.js:8349-8385` | Local verifier check and UI unlocked set. | Dashboard keeps its own `unlockedProfiles` state and also syncs with background. This is another state owner; needs expiration and profile-switch tests. | `INSTRUMENT` |
| Master PIN set/remove | `js/tab-view.js:10018-10132` | Default profile only, admin unlock required for changes/removal. | Correctly restricts Master PIN management to Default and blocks child surface. Writes profiles directly through IO, so it should return a mutation report like other profile writes. | `KEEP` + report |
| Profile PIN set/remove | `js/tab-view.js:8710-8760` | Self/default unlock gate before profile PIN update. | Correct local gate, but direct `io.saveProfilesV4()` again bypasses a central background mutation report. | `KEEP` + report |
| Encrypted export UI | `js/tab-view.js:9190-9264` | Password prompt + optional Master PIN auth for full/default export. | Full encrypted export can include Nanah trusted-device recovery data when exporting more than active profile. This is explicit and should remain visible in success text. | `KEEP` |
| Backup import UI | `js/tab-view.js:9267-9345` | Default-only import, decrypt prompt, local/incoming Master PIN prompts. | Import asks for local and incoming Master PINs before IO import. Good gate, but no state transition preview yet. | `GATE` preview |
| Nanah incoming backup PIN | `js/tab-view.js:7568-7590` | Incoming Master-protected payload auth. | Incoming protected payloads prompt for the incoming Master PIN. This protects backup provenance, but again must pair with preview warnings for destructive list-mode changes. | `KEEP` + preview |

Security boundary invariant:

```text
PIN/encryption controls protect access to state writers.
They do not prove the imported/synced state is safe.

Therefore:
  unlock/auth result -> allows mutation path to proceed
  transition report -> proves what that mutation will do
  runtime revision -> proves content scripts consumed the new state
```

This is important for the current disease-level audit: a correctly authorized import can still create a bad runtime state if mode/list/content-filter validation is weak.

### Content Controls And Render Engine Method Ledger - 1

This pass classifies `js/content_controls_catalog.js:1-222`, `js/render_engine.js:1-1389`, and the matching shared settings compiler surface in `js/settings_shared.js:1-1173`. These files are not on the YouTube page hot path by themselves, but they define which runtime states users can create and which booleans the hot path treats as active.

| Method family | Proof | Reads/mutates | Finding | Verdict |
| --- | --- | --- | --- | --- |
| Content-control catalog | `js/content_controls_catalog.js:4-199` | Static groups/keys/titles only. | Catalog is presentation metadata; it does not define defaults, validity rules, route scope, or whether a control can wake JSON/DOM filtering. Those rules are duplicated elsewhere. | `KEEP` + schema |
| Catalog accessors | `js/content_controls_catalog.js:201-215` | Returns shallow copies of groups/controls. | Safe and low risk. Missing richer metadata means UI cannot validate incomplete controls from the catalog alone. | `KEEP` |
| Shared legacy/profile key list | `js/settings_shared.js:17-54` | Defines storage keys watched by shared UI utilities. | Omits `contentFilters`, `categoryFilters`, `filterKeywordsComments`, `videoChannelMap`, `videoMetaMap`, and profile storage keys even though load/save later handles profile settings. This is a contract drift source. | `REWRITE` canonical keys |
| Default profile migration | `js/settings_shared.js:102-169` | Creates V4 profile from legacy storage. | Migrates existing Main/Kids lists as blocklist and creates empty whitelist lists. Correct for old blocklist users, but legacy whitelist intent cannot survive this path. | `TEST` migration fixtures |
| Keyword/channel sanitizers | `js/settings_shared.js:171-365` | Normalizes entries, timestamps, channel fields, filterAll defaults. | Good central normalizers. Channel string fallback sets `name` and `id` to the raw text, so unresolved names can look like IDs until enrichment. | `KEEP` + confidence |
| Channel-derived keyword compiler | `js/settings_shared.js:380-481` | Adds/removes exact keywords for channels with `filterAll`. | Useful current blocklist feature. It sorts by `addedAt`, so UI order and runtime keyword order depend on timestamp preservation. | `KEEP` + fixtures |
| Compiled settings builder | `js/settings_shared.js:484-561` | Produces runtime booleans, compiled regexes, content/category objects, quick/menu flags. | Defaults `showQuickBlockButton` and `showBlockMenuItem` to true when omitted (`js/settings_shared.js:556-557`). Empty install can therefore still run user-affordance code even with no block/allow rules. | `KEEP` product default, `GATE` runtime cost |
| Shared settings load | `js/settings_shared.js:564-740` | Reads storage and may write missing V4 profile/settings defaults. | Load is not strictly read-only. It can migrate/write profile defaults and fills missing quick/menu flags as true. | `INSTRUMENT` |
| Shared settings save | `js/settings_shared.js:742-1110` | Writes root legacy keys and active profile settings/lists. | Correct bridge for current UI, but it writes root and profile copies together, so profile/root drift can still exist after partial import/background actions. | `KEEP` + revision contract |
| Keyword list render | `js/render_engine.js:169-303` | Reads active Main/Kids mode and renders only the current mode's keyword list. | Current either/or UI is coherent, but users cannot inspect block and allow entries simultaneously. Future simultaneous allow/block needs a new schema, not a styling tweak. | `KEEP` current |
| Keyword row actions | `js/render_engine.js:312-537` | Creates comments/exact/delete controls; calls `StateManager` mutation APIs. | UI mutation paths depend on profile and source. Channel-derived keywords are treated specially and Kids hides comments toggles. Needs fixtures so future dual-list UI does not toggle wrong list. | `TEST` |
| Channel list render | `js/render_engine.js:548-760` | Reads active Main/Kids mode, syncKidsToMain, search/date/sort; renders in idle batches. | Idle batching is good. It only displays one mode's channels and appends Kids-synced entries only when modes match. | `KEEP` + tests |
| Collaboration UI grouping | `js/render_engine.js:767-855` | Groups channels by collaboration metadata and renders badges/tooltips. | UI-only; important for explaining block-all actions, but deletion/toggle still operates by list index. | `KEEP` + index fixtures |
| Channel row actions | `js/render_engine.js:872-1069` | Creates delete, node mapping, and Filter All controls. | Delete and filterAll actions use `index` into the current rendered effective list. Synced Kids rows resolve index by key; this is good but needs fixtures for duplicate keys and mode mismatch. | `TEST` |
| Filter All toggle gate | `js/render_engine.js:1121-1197` | Hides Filter All control in whitelist mode by returning invisible spacer. | Correct for current either/or semantics. In a future dual allow/block model this cannot remain "disabled because whitelist"; action must become "block-derived keyword" or "allow-derived keyword" explicitly. | `KEEP` current, future `REWRITE` |
| Channel mapping display | `js/render_engine.js:1203-1329` | Derives UI mapping from raw input, resolved ID/handle/custom URL, and channelMap. | UI explains identity resolution, but does not represent source confidence. Same disease as runtime extractors: identity is displayed as resolved/unresolved, not confidence-graded. | `INSTRUMENT` |

Control/render disease findings:

| Disease | Proof | Why it matters |
| --- | --- | --- |
| Empty lists are not quiet mode | Quick/menu controls default true in shared settings (`js/settings_shared.js:556-557`, `js/settings_shared.js:642-643`), State defaults true (`js/state_manager.js:86-87`), and content UI code runs scanner/observer paths for those affordances. | A new install with no keywords/channels can still pay YouTube-page runtime cost for UI affordances. This is a product choice, but it must be measured and budgeted separately from filtering. |
| Catalog lacks runtime semantics | Catalog keys exist at `js/content_controls_catalog.js:4-199`, while active enforcement lives in `js/seed.js`, `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/settings_shared.js`, and `js/state_manager.js`. | There is no single source saying "this control is valid only when these parameters exist, on these routes, and wakes these modules." |
| Current UI hides non-active list | Rendered keyword/channel list switches by mode: `js/render_engine.js:193-210`, `js/render_engine.js:590-596`. | This is correct for today but makes it harder for users to understand that blocklist data can still exist while whitelist mode is active, or vice versa. |
| Filter All semantics are mode-bound | Filter All is hidden in whitelist mode: `js/render_engine.js:1133-1139`, `js/render_engine.js:1178-1184`. | Current behavior avoids contradictory semantics, but future simultaneous allow/block must define exactly what quick block, 3-dot menu, and Filter All write. |
| Settings load can write defaults | `js/settings_shared.js:647-689`. | Opening UI can mutate profile settings and then trigger settings-change broadcasts elsewhere. That is acceptable only with revision/provenance logs. |

Target content-control schema:

```text
controlDefinition = {
  key,
  storageKeys,
  compiledKeys,
  defaultValue,
  routes: ["home", "search", "watch", "shorts", "kids"],
  wakes: ["seed-json", "dom-fallback", "quick-block", "fallback-menu"],
  requires: {
    selectedNotEmpty: true/false,
    minValue: optional,
    maxValue: optional
  },
  emptyBehavior: "disabled" | "valid-noop" | "dangerous-fail-closed"
}
```

This schema should eventually drive the UI, settings compiler, active-enforcement report, seed skip logic, and DOM fallback gate so they cannot disagree.

UI invariant for the next design pass:

```text
The UI must always show:
  current surface: Main or Kids,
  current mode: blocklist or whitelist,
  block rule counts,
  allow rule counts,
  whether empty whitelist will hide everything,
  whether content/category filters are valid or incomplete.
```

The future simultaneous allow/block model is promising, but it is a schema and semantics project. It should not be mixed into the current performance/reliability cleanup until current either/or behavior is fully fixture-tested.

### Shared Settings Key Contract Ledger - 2

This pass tightens the earlier `settings_shared.js` audit from "load/save/compiler risks" into a key-level contract. The file is not a YouTube content-page hot path by itself, but it defines the payload that UI surfaces can save and sometimes broadcast. That makes it a root-cause candidate for stale mode, missing whitelist fields, and empty-install non-quiet behavior.

| Contract surface | Proof | Emits / omits | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Shared top-level storage key list | `js/settings_shared.js:17-54`, change set at `js/settings_shared.js:56`. | Includes legacy booleans, `filterKeywords`, `uiKeywords`, `filterChannels`, stats, `channelMap`. Omits `ftProfilesV4`, `contentFilters`, `categoryFilters`, `filterKeywordsComments`, `videoChannelMap`, and `videoMetaMap`. | This list cannot be treated as a complete runtime schema. It is a UI compatibility list, not the enforcement source of truth. | `REWRITE` as explicit schema |
| Legacy -> V4 builder | `js/settings_shared.js:102-168`. | Creates default profile, Main `mode:'blocklist'`, Kids `mode:'blocklist'`, and empty whitelist arrays. | Safe for old blocklist installs, but any legacy whitelist intent entering through this builder is lost. Existing proof already shows the same risk in background/IO builders. | `TEST` migration fixture |
| Keyword normalization | `js/settings_shared.js:171-258`. | Object entries, compiled patterns, and comma strings become keyword objects. | Array branch assumes object-like entries; raw string arrays from import/sync can be dropped unless callers sanitize earlier. | `GATE` import validation |
| Channel normalization | `js/settings_shared.js:261-365`. | String channels become `{ name:id:raw }`; object entries preserve handle/logo/collaboration fields. | Good backward compatibility, but unresolved names can look like ids until enrichment. Runtime matchers need confidence labels before strict whitelist/block decisions. | `KEEP` + confidence |
| Channel-derived keyword sync | `js/settings_shared.js:412-481`. | Adds exact `source:'channel'` keyword entries for channels with `filterAll`, then sorts by `addedAt`. | Correct current feature, but derived rules are stored as keyword entries. In future dual allow/block mode, derived allow-vs-block intent must be explicit, not inferred from current mode. | `KEEP` current |
| Shared compiled payload | `js/settings_shared.js:484-561`. | Emits compiled keyword regexes, channels, booleans, `contentFilters`, `categoryFilters`, quick/menu flags. Does not emit `listMode`, `profileType`, `whitelistKeywords`, `whitelistChannels`, `videoChannelMap`, `videoMetaMap`, or an active-work report. | This payload is not equivalent to background `getCompiledSettings()`. If broadcast as runtime settings, content code can see a mode-blind blocklist-shaped payload. | `REWRITE` background-authoritative compile |
| Empty-install affordance defaults | `js/settings_shared.js:556-557`, load defaults `js/settings_shared.js:642-643`, state defaults `js/state_manager.js:86-87`, install defaults `js/background.js:2582-2583`. | `showQuickBlockButton` and `showBlockMenuItem` default true. | A fresh install with no rules is still an active user-affordance runtime. That can explain lag without any false-hide rule. Affordance work needs its own budget and lifecycle gate. | `GATE` affordance observers |
| Shared settings load | `js/settings_shared.js:564-740`. | Reads storage, normalizes active profile Main `keywords/channels`, and can write missing V4/default settings at `js/settings_shared.js:647-685`. | `loadSettings()` is not read-only. UI open/load can trigger storage-change fanout and runtime refreshes. | `REWRITE` explicit repair command |
| Shared V4 read aliases | `js/settings_shared.js:573-579`; background fallback comparison `js/background.js:2057-2064`, `js/background.js:2213-2220`. | Shared loader reads `main.keywords/channels`; background compiler prefers `blockedKeywords/blockedChannels` and falls back to `keywords/channels`. | Different readers can observe different active lists after mixed migrations or background actions. | `REWRITE` one V4 accessor |
| Shared V4 save | `js/settings_shared.js:742-947`, main write at `js/settings_shared.js:918-926`. | Writes root legacy mirrors plus active profile `main.channels/main.keywords`; preserves existing Kids shape. | A generic UI save can update legacy aliases while background-owned blocklist fields remain separate. This is manageable today only because callers route whitelist saves elsewhere. | `KEEP` current + fixture |
| Shared legacy save fallback | `js/settings_shared.js:950-1069`. | Writes legacy keys and builds V4 when no V4 exists. | Comment admits category filters are not reliably preserved without V4. Same branch has whitelist migration risk through the blocklist-only builder. | `GATE` legacy fixture |
| StateManager broadcast of shared compiled payload | `js/state_manager.js:1009-1065`; broadcast at `js/state_manager.js:1057-1059`. | After shared save, broadcasts `result.compiledSettings` when present. | This is the most important settings_shared disease path: a mode-blind shared compiled payload can be sent to content, while background runtime compile includes `listMode`, `profileType`, whitelist lists, maps, and profile-specific content/category data. | `REWRITE` broadcast background revision only |
| Background authoritative runtime compiler | `js/background.js:1984-2011`, `js/background.js:2211`, `js/background.js:2408-2425`, `js/background.js:2474-2551`. | Emits `listMode`, `profileType`, whitelist lists, blocklist channels/keywords, maps, booleans, content filters, and category filters. | This is closer to a runtime source of truth, but it also writes migrations and channel-derived keywords during compile (`js/background.js:2078-2080`, `js/background.js:2348-2398`). Compile should be pure or return a migration transaction. | `KEEP` + purify |

Settings contract disease finding:

```text
settings_shared.js is not the direct false-hide engine.
The disease is authority drift:

  UI shared compiler:
    saves root mirrors + V4 aliases
    emits no listMode/profileType/whitelist/maps
    may be broadcast by StateManager

  Background compiler:
    emits real runtime profile/list-mode payload
    also performs migration/write side effects

  Content runtime:
    expects currentSettings to already mean one authoritative profile/mode.

Target:
  UI saves should produce storage mutations only.
  Background should produce one revisioned runtime payload.
  Content should ignore mode-blind compiled payloads.
  Reads should not write storage unless the action is an explicit migration/repair.
```

### StateManager Mutation Method Ledger - 2

This pass maps every exported StateManager mutation family. The file is UI-side, but it is central to the disease because it decides which list a UI action writes, when background refreshes are requested, and when local state can broadcast a partial settings payload.

| Method family | Proof | Writes / sends | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Defaults and local state | `js/state_manager.js:49-157`. | Initializes Main/Kids lists, booleans, content/category filters, and quick/menu flags. | Defaults are mostly quiet, but quick block and block-menu affordances default true (`js/state_manager.js:86-87`), so empty installs are not lifecycle-empty. | `KEEP` + affordance gate |
| Auto-backup scheduler | `js/state_manager.js:25-42`; called after most mutations. | Sends `FilterTube_ScheduleAutoBackup` or calls IO fallback. | Good side-effect isolation, but every state mutation can schedule backup work. Needs trigger counters so performance reports distinguish filtering from backup. | `INSTRUMENT` |
| `loadSettings()` | `js/state_manager.js:178-493`. | Reads shared settings, then IO V3/V4, populates state, may schedule enrichment. | Reads from three authorities (`settings_shared`, V3, V4) and prefers aliases differently from background. It also schedules enrichment unless suppressed. | `REWRITE` canonical load |
| V4 Main selection aliases | `js/state_manager.js:318-327`. | Uses `main.channels/main.keywords` before `blockedChannels/blockedKeywords`. | Background compiler prefers `blocked*` first (`js/background.js:2057-2064`, `js/background.js:2213-2220`). Mixed-schema installs can show one list in UI and compile another at runtime. | `REWRITE` one accessor |
| Kids cleanup during load | `js/state_manager.js:352-386`, V3 path `js/state_manager.js:413-450`. | Drops placeholder Kids channel rows without stable ids/handles/custom URLs unless name is non-placeholder. | Good cleanup, but state load is silently mutating the in-memory view of stored data. Needs migration report if persisted later. | `INSTRUMENT` |
| Channel enrichment queue | `js/state_manager.js:496-695`. | Scans Main/Kids blocked channels, sends `type:'addFilteredChannel'`, throttles 5-7s, caps 10/session. | This is background/network work from UI state, not page filtering. It is capped, but it can run after every load and storage refresh if signatures change. | `KEEP` + counters |
| Kids keyword APIs | `js/state_manager.js:701-836`. | Mutate `kids.whitelistKeywords` or `kids.blockedKeywords` based on `kids.mode`; persist profiles; request Kids refresh. | Current either/or behavior is coherent. Future simultaneous allow/block needs explicit `listType`; current method names do not encode allow/block intent. | `KEEP` current |
| Kids channel add | `js/state_manager.js:861-937`. | Validates input, sends `FilterTube_KidsWhitelistChannel` or `FilterTube_KidsBlockChannel` based on `kids.mode`, reloads settings. | Good central background ownership. It refuses plain channel names, while some legacy/import paths allow name-only rows; user-visible validation differs by path. | `KEEP` + fixture |
| Kids channel remove/filterAll | `js/state_manager.js:939-1001`. | Removes from active Kids list; `filterAll` only in blocklist mode. | Correct current semantics. Index-based removal needs rendered-list fixture for sorted/search-filtered lists. | `TEST` |
| Shared `saveSettings()` | `js/state_manager.js:1009-1065`. | Calls `FilterTubeSettings.saveSettings()`, then broadcasts `result.compiledSettings` when present. | This is the mode-blind broadcast path identified above. UI-side save should not be the runtime compiler authority. | `REWRITE` |
| Main profile persistence | `js/state_manager.js:1077-1146`. | Writes V3 Main and V4 active profile Main directly through IO. | Useful for whitelist actions, but duplicates persistence authority with background actions. Needs mutation report and one V4 field schema. | `KEEP` current + report |
| Kids profile persistence | `js/state_manager.js:1148-1204`. | Writes V3 Kids and V4 active profile Kids directly through IO. | Same duplicated authority as Main persistence; direct UI profile writes must share revision with background refresh. | `KEEP` current + report |
| Broadcast and refresh | `js/state_manager.js:1209-1237`. | Sends `FilterTube_ApplySettings`; or asks `getCompiledSettings` then broadcasts. | `requestRefresh()` is the better shape because background compiles full runtime payload. Direct `broadcastSettings(result.compiledSettings)` is the unsafe shape. | `REWRITE` direct broadcast |
| Tab messaging helper | `js/state_manager.js:1243-1299`. | Sends messages to a selected tab and classifies missing receiver errors. | Good explicit error model for subscriptions import. Low filtering risk. | `KEEP` |
| Active profile context | `js/state_manager.js:1301-1326`. | Loads V4 and returns active profile id/profile. | Reuses IO load, which can repair/migrate. Import actions depend on this for profile-change checks. Needs revision id, not just active id. | `INSTRUMENT` |
| Main keyword APIs | `js/state_manager.js:1338-1550`. | Whitelist mode writes `whitelistKeywords` through `persistMainProfiles` + `requestRefresh`; blocklist mode writes `userKeywords` then shared save. | Two persistence paths depending on mode. Correct today, but easy to break because the method name `addKeyword` does not encode target list. | `KEEP` current; future `listType` |
| `recomputeKeywords()` | `js/state_manager.js:1555-1571`. | Builds `state.keywords` from user keywords plus `filterAll` channel-derived keywords, optionally merging Kids channels when `syncKidsToMain` and modes match. | Important false-hide risk: Kids-derived channel keywords can be persisted into Main through later saves if not treated as derived overlay. | `REWRITE` derived overlay |
| Main channel add | `js/state_manager.js:1582-1654`. | Sends `addWhitelistChannelPersistent` or `addChannelPersistent` based on Main mode; locally mirrors result. | Background owns persistence, which is good. Local optimistic mirror can still race storage sync; code has duplicate guard but needs mutation revision proof. | `KEEP` + revision |
| Subscriptions import fetch | `js/state_manager.js:1656-1709`. | Retries tab message up to 12 times and waits up to import timeout. | Explicit user action, high-cost by design. Needs one-active-import and cancellation/progress proof. | `GATE` |
| Subscriptions import save | `js/state_manager.js:1711-1819`. | Verifies active profile before/after fetch, then background batch imports whitelist channels, reloads, refreshes Main. | Good profile-change guard. Needs transition report: before/after mode, allow counts, whether whitelist mode was enabled, and whether blocklist was touched. | `KEEP` + report |
| Main channel remove/filterAll/comments | `js/state_manager.js:1826-1946`. | Whitelist removal persists whitelist only; blocklist removal/toggles recompute derived keywords and shared-save. | Correct current either/or split. `filterAllComments` defaults true (`js/state_manager.js:1931`) and must be visible in UI/import reports. | `KEEP` + fixture |
| Duplicate/channel map helpers | `js/state_manager.js:1953-1986`. | Checks current Main blocklist only; `persistChannelMap()` writes `channelMap` directly. | Duplicate helper ignores whitelist/Kids lists. Direct channelMap write bypasses typed background map provenance. | `REWRITE` map authority |
| Generic setting update | `js/state_manager.js:1998-2108`. | Validates a fixed key list; `syncKidsToMain` writes V4 and V3 directly, then requests background refresh; other keys shared-save. | Special-case sync path avoids shared mode-blind broadcast, but writes direct V3/V4. Other toggles still use shared save/broadcast. | `REWRITE` background mutation API |
| Main/Kids content filters | `js/state_manager.js:2115-2160`. | Merges partial objects and saves/refreshes. | No validation that enabled filters have valid parameters. This can wake runtime work with incomplete rules. | `VALIDATE` |
| Main/Kids category filters | `js/state_manager.js:2162-2217`. | Saves `{enabled, mode, selected}` and refreshes. | Allows enabled with empty selected list. Runtime may no-op, but active-state detection can still wake work. | `VALIDATE` |
| Theme APIs | `js/state_manager.js:2227-2252`. | Applies and stores UI theme. | UI-only. Low filtering risk. | `KEEP` |
| Listener system | `js/state_manager.js:2263-2282`. | Stores callbacks and notifies all. | No weak cleanup except unsubscribe; UI must call unsubscribe on rebuilt surfaces. | `INSTRUMENT` |
| Storage listener | `js/state_manager.js:2291-2409`. | Debounces storage reloads 150ms, suppresses during local save, reloads without enrichment reset/schedule, notifies `load` or `externalUpdate`. | Good fanout control. Key list still omits `contentFilters`, `categoryFilters`, `videoChannelMap`, and `videoMetaMap`; changes to those can skip UI reload. | `REWRITE` shared schema |
| Public API export | `js/state_manager.js:2419-2468`. | Exposes broad mutation API and assigns `globalThis.StateManager`. | API names encode feature, not mutation target/list type. Future dual allow/block must add explicit target params instead of overloading current mode. | `KEEP` current |

StateManager disease finding:

```text
StateManager is not mainly a DOM-hiding bug.
It is the UI mutation router.

Today:
  mode decides which list a generic action writes,
  shared save can broadcast partial compiled settings,
  background refresh can broadcast full compiled settings,
  profile persistence happens through both IO and background,
  derived keywords can become stored policy.

For stabilization:
  every mutation needs explicit profile + surface + listType,
  every save needs one background-generated runtime revision,
  derived rules should be overlays unless user explicitly stores them,
  storage listeners should consume a canonical settings key schema.
```

### Quick Block / Menu Observer Lifecycle Ledger - 2

This pass maps `js/content/block_channel.js` as a live YouTube-page affordance module. It does not decide normal filtering by itself, but it explains a large part of empty-install lag: the feature can install observers/listeners/timers even when there are no blocklist keywords/channels.

| Method / block | Proof | Runtime behavior | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Module state and mode helper | `js/content/block_channel.js:1-34`, pending maps at `js/content/block_channel.js:61-79`. | Tracks last clicked menu button, Kids context, dropdown state, pending fetches, and checks `currentSettings.listMode === 'whitelist'`. | State is global per page and long-lived; whitelist suppresses injection but not startup listener installation. | `KEEP` + lifecycle gate |
| Mobile/overlay surface detection | `js/content/block_channel.js:106-228`. | Uses host, pointer media queries, search suggestion DOM, visible overlay selectors, and writes root attributes. | Useful mobile/tablet fix, but it queries broad overlay selectors on focus/click/input/scroll/resize paths. | `INSTRUMENT` |
| Quick-block card selector set | `js/content/block_channel.js:780-806`. | Covers desktop, mobile, Shorts, playlists, channels, posts-ish lockups, and Kids renderers. | Broad selector set is necessary for coverage, but expensive when swept globally in no-rule sessions. | `KEEP` + route gate |
| Quick-block active predicate | `js/content/block_channel.js:808-817`. | Requires `currentSettings.showQuickBlockButton === true` and non-whitelist mode. | Correct visual predicate, but it is checked inside already-installed observers/timers rather than before installing them. | `REWRITE` install gate |
| Quick-block styles | `js/content/block_channel.js:819-930`. | Injects live page CSS, mobile visibility rules, native-control quiet CSS, overlay/search hide CSS. | Scoped to FilterTube classes, acceptable. Still should be injected only if quick block can be active. | `GATE` |
| Quick-block immediate hide | `js/content/block_channel.js:1224-1237`. | Calls `markElementAsBlocked` when available, then direct `display:none`, class, and attr. | Intentional user-action hide. Needs rollback/confirmation reason if background add fails or identity is weak. | `KEEP` + rollback test |
| Quick-block action path | `js/content/block_channel.js:1239-1271`. | Builds context, routes through `handleBlockChannelClick` when present, otherwise sends fallback add and schedules DOM fallback rerun after 120ms. | Correct user action, but fallback schedules DOM work immediately after action. Need action reason/counter and background result. | `KEEP` + report |
| Per-card hover/event attachment | `js/content/block_channel.js:1273-1433`. | Adds pointer/mouse/focus listeners to host/anchor/wrap and creates the quick button. | Guards duplicate attachment with attributes; no detach path except card removal. Reasonable if quick-block installed only when active. | `KEEP` + install gate |
| Sweep scheduler | `js/content/block_channel.js:1435-1451`. | Global query over `QUICK_BLOCK_CARD_SELECTORS`; if disabled, removes buttons. | This becomes no-rule overhead if observers keep scheduling sweeps after settings disable/whitelist. | `GATE` |
| Quick-block observer boot | `js/content/block_channel.js:1454-1664`; startup call `js/content/block_channel.js:2358-2397`. | After 1s, always calls `setupQuickBlockObserver()`, injects styles, schedules sweep, installs document/window listeners, body MutationObserver, and 1800ms interval. | This is a direct root cause for empty-install lag. `isQuickBlockEnabled()` prevents buttons, not observer/timer work. | `REWRITE` feature-owned lifecycle |
| Document/window event bundle | `js/content/block_channel.js:1463-1491`. | Capture focus/input/click/scroll plus resize/orientation events all schedule viewport/surface work. | These are high-frequency events and also fire during native fullscreen/orientation churn. Must be suspended when quick block is disabled, hidden by native controls, or in fullscreen. | `GATE` |
| Pointermove hover repair | `js/content/block_channel.js:1505-1605`. | Desktop-only pointermove uses `elementsFromPoint`, fallback query of existing hosts, and RAF. | Good UX fix, but should be enabled only on hover-capable desktop and when quick block is active. It is currently inside observer boot, not dynamic lifecycle. | `GATE` |
| Body MutationObserver and periodic sweep | `js/content/block_channel.js:1607-1655`. | On mutations, syncs surface state and ensures buttons; when disabled, removes buttons; interval sweeps every 1800ms. | No disconnect/stop path is recorded. Disabled state still keeps observer and timer alive. | `REWRITE` disconnectable owner |
| Fallback menu observer startup | `js/content/block_channel.js:1669-1791`; startup call `js/content/block_channel.js:2358-2397`. | Non-Kids pages install capture click listener, dropdown visibility observers, and body MutationObserver. | It starts even if `showBlockMenuItem` is false; actual injection later returns in `js/content_bridge.js:10090-10096`. Observer cost remains. | `REWRITE` feature gate |
| Dropdown visibility observers | `js/content/block_channel.js:1702-1732`, body observer `js/content/block_channel.js:1746-1785`. | Per-dropdown MutationObserver plus document body observer watches for menu nodes. | Necessary for YouTube menus, but no global shutdown path. Needs active predicate: block menu enabled, non-whitelist, supported surface. | `GATE` |
| Kids passive listener | `js/content/block_channel.js:1797-1841`. | Kids path does not inject custom menu items; listens for native block clicks/toasts and syncs to Kids profile. | Good product direction. It still installs capture click and body observer on Kids surfaces; should be scoped to Kids mode/profile enabled. | `KEEP` + surface gate |
| Kids context extractor | `js/content/block_channel.js:1843-1964`. | Extracts video/channel identity from Kids cards/watch/channel pages. | Good best-effort identity path. Needs confidence/source labels so weak name-only Kids blocks do not become broad channel rules silently. | `INSTRUMENT` |
| Kids native block sync | `js/content/block_channel.js:1966-2061`. | Dedupes recent actions, sends `FilterTube_KidsBlockChannel` with video/channel hints. | Good double-fire suppression. Needs result surface if background rejects and should avoid name-only broad blocks unless confirmed. | `KEEP` + confidence |
| Dropdown handling and whitelist cleanup | `js/content/block_channel.js:2066-2122`. | Finds visible dropdown and, in whitelist mode, removes injected menu items. | Whitelist correctly avoids 3-dot custom menu. But observer still runs and dropdown processing still enters far enough to clean. | `GATE` install |
| Menu card resolution | `js/content/block_channel.js:2124-2190`. | Resolves comments, feed, mobile, playlist, posts, watch metadata, and watch root cards. | Broad and necessary. The playlist/watch fallback must avoid stamping current watch video onto unrelated playlist/feed rows; code has a watch-header guard later. Needs fixtures. | `TEST` |
| Watch URL stamping guard | `js/content/block_channel.js:2192-2229`. | Stamps URL video id only for watch header/owner/watch-flexy wrappers, not normal feed cards. | Good fix against blocking wrong channel from modern lockup rows. Needs watch/playlist row tests because user saw missing 3-dot UI on playlist DOM. | `KEEP` + fixture |
| Dropdown duplicate/state guards | `js/content/block_channel.js:2231-2290`. | Uses per-dropdown state, detects stale "blocked" menu text, reinjects if reused/missing. | Good race protection, but dropdown identity is still tied to extracted `videoCardId`; random fallback ids can make reuse diagnostics hard. | `INSTRUMENT` |
| Card-removal/dropdown-close observers | `js/content/block_channel.js:2292-2327`. | Adds observers to close dropdown if card removed and cancel pending fetch on close. | Per-dropdown cleanup exists, but observers are only disconnected on specific close/remove paths. Needs timeout/catch-all cleanup. | `INSTRUMENT` |
| Menu item injection handoff | `js/content/block_channel.js:2333-2344`, actual injection guard in `js/content_bridge.js:10090-10096`. | Calls `injectFilterTubeMenuItem(dropdown, videoCard)` from content bridge. | Split ownership: block_channel owns observers/context; content_bridge owns injection and action handler. This makes lifecycle gating harder. | `CONSOLIDATE` |

Quick block/menu disease finding:

```text
Empty rules are not enough.

If showQuickBlockButton/showBlockMenuItem are true:
  block_channel.js starts after 1s,
  installs capture listeners and MutationObservers,
  injects quick-block CSS,
  starts an 1800ms sweep timer,
  watches dropdowns even before an actual custom menu item is allowed.

Therefore the performance fix is not "no keywords => no DOM fallback" only.
The affordance layer needs its own feature-owned lifecycle:
  install only when visible/enabled/non-whitelist/supported route,
  disconnect when settings change,
  suspend under native overlays/fullscreen,
  emit counters for observer, sweep, card scans, dropdown scans, and user actions.
```

### State And Release Contract Findings

| Area | Proof | Risk | Verdict |
| --- | --- | --- | --- |
| `copyBlocklist` contract | UI asks/sends copy choice in `js/popup.js:821-859` and `js/tab-view.js:10548-10629`; background reads it in `js/background.js:3302` but always merges in `js/background.js:3443-3445`. | User can decline copy but background still copies and clears blocklist. | `REWRITE` |
| Subscription import depends on broken copy behavior | Import enable sends `copyBlocklist:false` in `js/tab-view.js:4655-4660`, but success copy says blocklist merged in `js/tab-view.js:4676-4678`. | Fixing background alone changes user-visible import semantics. | `GATE` + `REWRITE` |
| Manual whitelist warning is UI-only | Popup warning `js/popup.js:822-831`; tab warning `js/tab-view.js:10549-10559`; runtime fail-closed `js/filter_logic.js:1933-1967`. | Import/sync/migration can activate empty whitelist without the same durable warning. | `GATE` |
| Legacy V3 -> V4 migration loses whitelist mode/lists | Background migration forces blocklist/empty whitelist `js/background.js:1432-1445`; settings migration same `js/settings_shared.js:151-164`; IO path same `js/io_manager.js:541-546`. | Older whitelist users can become blocklist users or lose active whitelist state depending on migration path. | `REWRITE` |
| File import/export shape | V4 -> V3 export preserves modes/lists `js/io_manager.js:214-249`; V3 import preserves parsed whitelist data into V4 `js/io_manager.js:1330-1340`, `js/io_manager.js:1597-1640`. | Good core path, but needs fixtures across old/new states. | `KEEP` + `INSTRUMENT` |
| Nanah scoped import | Raw profile subtrees exported `js/nanah_sync_adapter.js:133-160`; mode/lists applied directly `js/nanah_sync_adapter.js:193-225`; UI approval `js/tab-view.js:8063-8102`. | A peer can create whitelist with zero allow rules without an explicit warning in the approval modal. | `GATE` |
| Kids/Main sync mode match | UI copy `js/tab-view.js:1569-1573`; background blocklist sync `js/background.js:2064`, `js/background.js:2220`; whitelist sync `js/background.js:1996`, `js/background.js:2016`. | Matching-mode-only behavior is correct; add tests so later dual allow/block work does not invert rules. | `KEEP` + `TEST` |
| Category filters enabled-empty | UI saves enabled/empty `js/tab-view.js:840-844`; state saves enabled/empty `js/state_manager.js:2172-2181`; JSON active gate `js/seed.js:214-223`; DOM active gate `js/content/dom_fallback.js:1992-1995`; actual filter no-ops `js/filter_logic.js:2130-2133`, `js/content/dom_fallback.js:2468-2471`. | Empty category filter slows runtime because gates call it active while enforcement later does nothing. | `REWRITE` |
| Public/native version drift | Public package/manifest 3.3.1; public release notes 3.3.2; Android/iOS app artifacts 3.3.2. | Public GitHub release can combine mismatched extension/app versions. | `GATE` |
| Native release-note drift | Public `data/release_notes.json` can lead native resources; native sync path does not first mirror public data into Android. | Apps can show stale or future notes. | `REWRITE` |
| Gradle runtime sync inputs | Android task watches JS/manifest while sync copies JS/HTML/CSS/data/runtime resources. | CSS/HTML/data-only extension changes can fail to sync into native builds. | `GATE` |
| Hardcoded sync source | Public wrapper can discover app repo, but native sync manifest and Gradle point at `/Users/devanshvarshney/FilterTube`. | Another checkout or CI can sync stale runtime. | `REWRITE` |
| GitHub release asset body | `build.js` can build one browser but release body always lists all browser zips. | Public release can advertise missing assets. | `GATE` |
| Release before upload success | GitHub release is non-draft before upload loop completes. | Users can see a public release with missing artifacts. | `GATE` |
| Downloads page direct APK link | Website downloads Android card points to GitHub latest release while docs say APK appears only once attached. | Users can land on extension-only release and think Android direct APK is missing/broken. | `REWRITE` |
| Privacy copy drift | README broad claim says no data leaves browser while privacy page correctly qualifies YouTube, Nanah, Vercel, app stores. | Over-broad claim conflicts with actual product/network model. | `REWRITE` |
| Native sync patching | Native sync script uses string replacements for app-specific runtime guards. | Source drift can silently skip app-specific guards. | `INSTRUMENT` |
| What’s New future notes | Dashboard renders release notes in file order; packaged data can lead installed manifest version. | Installed extension can show unreleased notes. | `GATE` |

### Docs Alignment Findings

| Doc/source | Proof | Drift | Verdict |
| --- | --- | --- | --- |
| README privacy bullets | `README.md:146`, `README.md:265`, `README.md:282` | Says "No data leaves your browser" / no external requests, but current product has optional Nanah signaling, website analytics, app store services, and YouTube identity fetches. The privacy page is more accurate. | `REWRITE` |
| Functionality privacy bullets | `docs/FUNCTIONALITY.md:376-377` | Says no external servers/no analytics globally. This conflicts with website-only analytics and Nanah signaling nuance. | `REWRITE` |
| Whitelist import semantics docs | `docs/FUNCTIONALITY.md:100`, `docs/FUNCTIONALITY.md:315-337`, `docs/CHANNEL_BLOCKING_SYSTEM.md:315-321` | Docs describe "Import Only keeps blocklist untouched" and "turn on whitelist merges blocklist". Runtime background currently merges whenever whitelist is requested, ignoring `copyBlocklist:false`. | `REWRITE` after state fix |
| Nanah user docs | `docs/NANAH_USER_GUIDE.md:5-17`, `docs/NANAH_USER_GUIDE.md:88-98` | Good plain-language P2P description, but release docs should link it from the privacy/download paths so users do not infer a cloud account. | `KEEP` + link |
| Nanah project docs | `docs/NANAH_P2P_PROJECT_PLAN.md:44-70`, `docs/NANAH_P2P_PROJECT_PLAN.md:338` | Correctly explains signaling reality and "no upload to your servers"; should be treated as internal architecture, not user-facing policy copy. | `KEEP` |
| JSON-first plan | `docs/JSON_FIRST_FILTERING_PLAN.md:351-381`, `docs/JSON_FIRST_FILTERING_PLAN.md:512-530` | Matches current direction but overstates the fast no-filter path because fetch/XHR wrappers still clone/parse/stringify before returning responses. | `UPDATE` |
| Renderer inventories | `docs/json_paths_encyclopedia.md:930-953`, `docs/json_paths_encyclopedia.md:2194-2200`, `docs/json_paths_encyclopedia.md:2715-2730`, `docs/youtube_renderer_inventory.md:438` | Inventories have richer route coverage than `FILTER_RULES` currently enforces first-class. | `KEEP` + convert to fixtures |
| Legacy CSS files | `css/filter.css:39-49`, `css/content.css:40-87`, `css/layout.css:654-668`; manifests do not list CSS content scripts `manifest.json:25-60`. | Dangerous `.filter-tube-visible` CSS is present but not manifest-injected. It must not re-enter content runtime through a future build/sync step. | `QUARANTINE` |

### Public Docs / Website / Release Claim Audit - 2026-05-17

This pass checks whether the public story can accidentally outrun the runtime. It is not a copy-edit pass. A claim is acceptable only if it is clearly one of:

```text
shipped and fixture-backed
shipped but explicitly limited
release-testing with a status link
planned/future with no availability promise
historical/internal architecture context
```

| Claim surface | Proof | Current claim | Runtime/release truth | Verdict |
| --- | --- | --- | --- | --- |
| Public README version | `README.md:6`, `README.md:18-31`; manifests `manifest.json:5`, `manifest.chrome.json:5`, `manifest.firefox.json:5`; `package.json:3`; staged notes `data/release_notes.json:6-18`. | README and packaged manifests are `3.3.1`; release notes have an upcoming `3.3.2` entry. | This is valid as staging only if release tooling prevents a `3.3.1` package from showing or publishing `3.3.2` as shipped. | `GATE` |
| README privacy shorthand | `README.md:146`, `README.md:265`, `README.md:282`. | "No data leaves your browser" and "No External Requests" appear as broad product claims. | The current product is local-first, but it also has optional Nanah signaling, website-only analytics, app-store surfaces, and normal YouTube/YouTube Kids network activity. The privacy page wording is more precise. | `REWRITE` |
| Functionality privacy shorthand | `docs/FUNCTIONALITY.md:373-378`. | "Local Processing Only" and "No Analytics" are phrased globally. | Good old extension posture, but now incomplete as a unified product statement because the website has Vercel analytics and Nanah uses a signaling meeting point. | `REWRITE` |
| Unified privacy page | `website/app/privacy/page.js:11-36`, `:38-69`, `:201-232`, `:632-673`. | Covers browser, Android, iOS/iPad, TV path, website analytics, YouTube services, and Nanah P2P. | This is currently the strongest public wording: no FilterTube account/settings vault, website analytics only, Nanah meeting-point model. Needs to stay generated from a checked claim ledger before store submission. | `KEEP` + `TEST` |
| Nanah "known place" claim | `README.md:33-60`; `website/app/privacy/page.js:201-232`, `:318-325`, `:632-650`. | Devices meet through a signaling point; sync is P2P and optional. | Product copy should say Nanah is open-source P2P and the signaling endpoint is a meeting place, not a settings cloud. Claims like "cannot count devices" must be backed by signaling-code proof or softened to "we do not use it for device analytics." | `KEEP` + proof link |
| Website analytics scope | `website/app/privacy/page.js:31-35`, `:96-99`, `:251-254`, `:667-673`. | Vercel Web Analytics is website-only and not in extension/native apps. | Correct boundary. CI should ensure analytics import remains only in website layout/components, never extension or app runtime. | `TEST` |
| Downloads Android availability | `website/app/downloads/page.js:47-63`, `:80-117`, `:231-233`, `:302-356`. | Android phone/tablet is complete for current release scope; direct APK goes to GitHub latest release; Play internal testing is active. | Safe only if the linked GitHub release actually has the signed release APK/AAB/checksum. Otherwise users can land on an extension-only release and think Android is missing. | `GATE` |
| Direct APK safety | `docs/ANDROID_PUBLIC_DISTRIBUTION.md:60-76`; `website/app/downloads/page.js:119-125`, `:314-316`. | Public APK must be signed, checksummed, official, and not the Play verification/debug APK. | Correct. Release script needs to distinguish browser ZIP-only releases from APK/AAB releases and refuse debug/proof verification artifacts. | `KEEP` + release check |
| Android package and TV separation | `docs/ANDROID_PUBLIC_DISTRIBUTION.md:11-15`, `:68-69`; `website/app/downloads/page.js:112-115`, `:122-123`; native plan recorded in this audit. | Phone/tablet stays `com.filtertube.app`; TV/Fire TV is a future separate package/listing. | Correct and important. Public download and app docs should not imply the mobile APK is the TV app. | `KEEP` |
| iOS/iPad availability | `website/app/downloads/page.js:65-76`, `:239-244`; `website/components/route-content.js:342-371`, `:415-438`. | iPhone/iPad are in final release testing / TestFlight and App Store path. | Acceptable if no public install button implies an IPA download. Website currently points to downloads/status, which is safer than a fake store link. | `KEEP` |
| Platform pages product-state wording | `website/components/route-content.js:93-97`, `:139-147`, `:484-507`, `:552-618`, `:620-759`, `:760-785`; `website/app/page.js:197-200`, `:626-632`. | Desktop is live; Android phone/tablet testing is active; iOS/iPad/TV move as separate store paths; Kids is available today. | Mostly aligned. TV pages must keep "Mapping" / "Planned"; Kids page should distinguish extension/Kids rules from native public Kids WebView access and deeper future polish. | `KEEP` + precision pass |
| Dashboard app cards | `html/tab-view.html:193-231`. | Extension dashboard advertises Android and iOS app release-testing paths linking to downloads. | Correct as status navigation. It should not show Play/App Store badges until real links exist. | `KEEP` |
| YouTube Kids public support | `README.md:121`, `README.md:155`; `website/components/route-content.js:760-777`; `website/app/privacy/page.js:236-239`, `:685-688`, `:722-723`. | Kids mode and YouTube Kids are presented as supported. | Support exists, but "Zero-Network Kids" can be misleading: FilterTube should mean no extra identity-fetch network by FilterTube, not that YouTube Kids itself is offline. | `REWRITE` |
| JSON-first performance claims | `README.md:141-146`, `:263-269`; `website/components/route-content.js:99-108`; `docs/JSON_FIRST_FILTERING_PLAN.md:351-381`. | Pre-render filtering, fallback selective cleanup, fast no-filter direction. | Direction is correct, but current audit proves empty/no-rule states still run seed/DOM/observer work. Public claims should be guarded until empty-runtime fixtures pass. | `GATE` |
| Whitelist/import semantics claims | `data/release_notes.json:57-60`; `docs/FUNCTIONALITY.md:100`, `:315-337`; `docs/SUBSCRIBED_CHANNELS_IMPORT.md`; UI mutation audit above. | Import-only keeps blocklist untouched; import + whitelist follows migration path. | Current background ignores `copyBlocklist:false` in the normal transition path. Do not publish this claim as fixed until mutation fixtures pass. | `REWRITE` after fix |
| Renderer inventory docs | `docs/json_paths_encyclopedia.md`, `docs/youtube_renderer_inventory.md`; current runtime gaps recorded above. | Docs list many YouTube JSON and DOM renderer paths. | Treat these as fixture source material, not a claim that every renderer is already enforced JSON-first. | `KEEP` as internal/proof source |
| Ignored raw capture corpus | `.gitignore:32-77`, `docs/audit/FILTERTUBE_CAPTURE_CORPUS_INVENTORY_2026-05-17.md`. | Root-level YouTube JSON/HTML/TXT captures are intentionally ignored but locally present as evidence inputs for fixture extraction. | Keep ignored captures out of release/source history; extract only minimal representative fragments into committed runtime fixtures. | `KEEP` as local proof source |
| Extracted capture fragments | `tests/runtime/fixtures/captures/*`, `tests/runtime/extracted-capture-current-behavior.test.mjs`. | First minimal fragments cover YTM compact playlists, Kids compact video owner extension, YTM end-screen, classic comments, modern comment view models, collaboration dialog rosters, and selected playlist rows. | This turns local raw evidence into reproducible committed tests without committing full captures. | `KEEP` and expand |
| Source surface inventory | `docs/audit/FILTERTUBE_SOURCE_SURFACE_INVENTORY_2026-05-17.md`, `tests/runtime/source-surface-current-behavior.test.mjs`. | Manifest-loaded scripts, web-accessible files, background/UI files, CSS/static assets, build scripts, and native sync wrappers are classified. | Prevents the audit from missing a file outside the hot filtering stack; keeps legacy default-hide CSS quarantined. | `KEEP` and expand |
| Native runtime sync docs | `docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md:68-81`, `:138-155`; `scripts/sync-native-runtime.mjs:5-23`; native audit above. | Native apps share/sync extension runtime. | Operationally true, but not release-proof until sync reports include source commit, per-file hashes, bundle order, and platform patches. | `INSTRUMENT` |
| App/source repository disclosure | `website/app/privacy/page.js:750-762`; `docs/ANDROID_PUBLIC_DISTRIBUTION.md:91`. | Browser/website/Nanah are public; native app can remain private while release assets/metadata live in public repo. | Acceptable if privacy promises describe behavior and APK direct distribution provides signing/checksum proof. F-Droid/Izzy claims must remain future until source path is public/buildable. | `KEEP` |
| Terms page product direction | `website/app/terms/page.js:14`, `:35`, `:62`. | Website/app surfaces are product direction rather than binding delivery promise. | Good legal/status guard. Needs date refresh only when privacy/download pages are finalized for release. | `KEEP` |

Public claim manifest target:

```text
publicClaim = {
  surface,              // README, privacy page, downloads page, dashboard card, release notes, docs
  text,
  status: "shipped" | "limited" | "release-testing" | "planned" | "historical",
  codeProof,
  releaseProof,
  owner,
  lastVerified,
  requiredBeforePublish
}
```

Public-claim disease finding:

```text
The runtime disease has a matching release-copy disease:
source code, native app bundles, website claims, README claims, dashboard cards,
and release notes can each describe a different state of FilterTube.

Fixing runtime behavior without a claim manifest still lets users install one
artifact while reading promises from another artifact.
```

### Build / Vendor / Release Reproducibility Ledger - 1

This pass records how runtime files become shipped browser zips, vendor bundles, native app runtime copies, and public GitHub release artifacts. This matters for the current audit because the user can test one build while source inspection describes another.

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Extension UI shell build | `scripts/build-extension-ui.mjs:8-17`, `scripts/build-extension-ui.mjs:23-43`; invoked by `build.js:80-82`. | Bundles popup/tab-view decor into `js/ui-shell/*.js` before packaging. | Good generated asset path, but source and generated JS should be checked together in release diffs. | `KEEP` + generated check |
| Package build inputs | `build.js:27-31`, `build.js:106-118`. | Copies `js`, `css`, `html`, `icons`, `data`, `assets`, plus README/CHANGELOG/LICENSE into each dist target. | Copies inactive/legacy CSS and all data/assets into releases, so packaged asset classification is required. | `GATE` asset manifest |
| Manifest script-order patch | `build.js:159-179`. | Ensures `collab_dialog.js` appears before `content_bridge.js` in content-script list. | Helpful guard, but build mutates manifest JSON at packaging time. Source manifests and dist manifests can differ. | `KEEP` + diff report |
| ZIP version source | `build.js:140-145`; package version at `package.json:3`. | Release version is `package.json`; each zip name uses manifest version when available. | If package and manifest versions drift, release tag/body can differ from zip names. | `GATE` version assert |
| Mobile artifact collection | `build.js:34`, `build.js:216-282`. | Optionally stages Android APK/AAB artifacts for the current package version and writes SHA-256 files. | Default source now prefers the sibling app artifact directory and falls back to local staging, but package/signing proof is still filename-only. | `GATE` artifact metadata proof |
| Latest mobile artifact selection | `build.js:314-327`. | Picks latest versionCode unless `--all-mobile-artifacts` is set. | Correct for releases and now warns if the selected versionCode lacks APK or AAB, but still needs signed package metadata proof before public direct-APK claims. | `GATE` pairing proof |
| GitHub release creation | `build.js:292-348`, `build.js:484-505`, `build.js:507-540`. | Creates a public non-draft GitHub release, then uploads assets sequentially. | If upload fails after release creation, users can see a public release with missing assets. | `REWRITE` draft-first release |
| Release body asset links | `build.js:388-432`, install links `build.js:439-467`. | Release body always prints browser download URLs and optionally Android artifact links. | If a browser target was not built, release body can still advertise that browser zip. | `GATE` generated asset list |
| Nanah vendor bundle source | `scripts/build-nanah-vendor.mjs:9`, `scripts/build-nanah-vendor.mjs:29-52`. | Bundles sibling `../nanah` source into `js/vendor/nanah.bundle.js`. | Public release cannot be reproduced unless the exact Nanah commit/source path is recorded. | `INSTRUMENT` source revision |
| QR vendor bundle source | `scripts/build-nanah-vendor.mjs:16-26`, `package.json:41`. | Bundles `qrcode` from local `node_modules`. | Reproducible if lockfile is trusted, but release notes should not imply hand-written runtime. | `KEEP` |
| Native runtime sync wrapper | `scripts/sync-native-runtime.mjs:5-23`; package command `package.json:14`. | Runs the private app repo sync script from `../FilterTubeApp` or `FILTERTUBE_APP_REPO`. | Public repo can trigger app runtime sync, but actual copy list/patching lives in private repo. Extension/app parity cannot be proven from this repo alone. | `INSTRUMENT` sync manifest |
| Dev manifest shortcuts | `package.json:15-17`. | Copies browser manifest variants to `manifest.json`. | Easy local testing path, but it mutates a tracked manifest file. It can create accidental manifest drift if committed. | `GATE` status check |

Build/release invariant:

```text
Every public release should produce:
  source commit,
  package version,
  manifest versions,
  browser zips actually uploaded,
  Android artifacts actually uploaded,
  SHA-256 for native artifacts,
  Nanah source revision,
  generated UI bundle freshness,
  native runtime sync revision when app artifacts are included.
```

Release script disease finding:

```text
The current script packages the right surfaces, but it does not yet prove that
release copy, uploaded assets, website/download links, native runtime copies,
and vendor bundle sources all describe the same runtime revision.
```

### Native Runtime Copy Audit - 2026-05-17

This pass checks the extension-to-app runtime boundary. No app source changes are part of this audit. The question is whether future extension fixes can be synced into Android/iOS without creating another runtime fork.

| Native sync surface | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Public sync wrapper | `scripts/sync-native-runtime.mjs:5-23`. | Public repo delegates to `/Users/devanshvarshney/FilterTubeApp/tools/sync-runtime-from-extension.mjs` or `FILTERTUBE_APP_REPO`. | The public repo can start sync, but the actual copy/patch policy lives outside the public repo. | `KEEP` + sync report |
| Private sync manifest | `/Users/devanshvarshney/FilterTubeApp/tools/runtime-sync-manifest.json` lists extension JS files copied into app packages, including `js/seed.js`, `js/filter_logic.js`, DOM helpers, `content_bridge.js`, `injector.js`, StateManager/UI sources, Nanah, QR, and release notes. | There is a real source-of-truth list. | It needs source commit/hash output so app builds can prove which extension runtime they contain. | `INSTRUMENT` |
| Native runtime bundle order | `/Users/devanshvarshney/FilterTubeApp/tools/sync-runtime-from-extension.mjs:98-116`. | Android/iOS bundle includes `seed`, identity, filter logic, DOM helpers/extractors/fallback, menu, block channel, bridge/settings/resolver/collab, `js/layout.js`, content bridge, and injector. | App currently bundles `js/layout.js`, which this audit marked quarantined in the extension context. If app wrapper exposes its layout globals or calls it later, broad default-hide logic could return through native. | `GATE` layout quarantine |
| Runtime wrapper and markers | Android runtime asset starts with app bridge wrapper and has `// FILTERTUBE_APP_RUNTIME_BUNDLE_START` at current generated asset line 912. | App runtime is not byte-identical to extension files; it is a wrapped bundle. | Plain hash comparison against one extension file is not enough. Need manifest of per-source hashes inside bundle. | `INSTRUMENT` |
| Android runtime size | Current audit measured `/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/assets/filtertube_runtime_full.js` at `1,509,739` bytes. | Android WebView injects a large extension-era runtime. | Confirms mobile lag suspects: even if no rules exist, a big runtime plus observers can cost startup. | `REWRITE` after fixtures |
| iOS runtime size | Current audit measured `/Users/devanshvarshney/FilterTubeApp/apps/ios/FilterTube/Resources/filtertube_runtime_full.js` at `1,508,060` bytes. | iOS receives a normalized/adapted copy of Android runtime. | iOS can drift by app-specific patches and line-ending normalization; proof must be patch-aware. | `INSTRUMENT` |
| Android/iOS runtime hash drift | Current SHA-256: Android runtime `b53e6e2e4bf80f06724eb8d0020ba8c19e6c6fc578f5e78ff254d03e6b686b43`; iOS runtime `f47819ac35fc8bcf27b578b2d9110e2c7064c1cdc84db5bbb27ee5464789b996`. | Hashes differ because iOS normalization/patches are applied. | Difference is expected, but release docs need a generated "same sources plus these patches" report. | `KEEP` + patch report |
| iOS Kids runtime patching | `/Users/devanshvarshney/FilterTubeApp/tools/sync-runtime-from-extension.mjs:226-350`. | Sync script injects iOS-specific Kids viewport helpers and performance gates through string replacement. | String replacement can silently skip if upstream Kids runtime changes. This matches recent iOS Kids fragility. | `GATE` with patch-applied assertions |
| Android WebView Kids scaling | `/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/java/com/filtertube/app/AndroidWebSurfaceAdapter.kt:193-215`. | Android uses wide viewport/overview/desktop UA and initial scale for Kids. | This behavior is intentionally not equivalent to iOS `WKWebView`; app docs and fixtures must keep platform-specific expectations. | `KEEP` |
| Runtime bootstrap read/injection | Android subscription import reads `filtertube_runtime_full.js` synchronously at `/Users/devanshvarshney/FilterTubeApp/apps/android/app/src/main/java/com/filtertube/app/SubscriptionsImportActivity.kt:28` and injects at `:67`; main managed WebView injects via adapter around `AndroidWebSurfaceAdapter.kt:267`. | App carries extension runtime into multiple WebViews. | Empty-runtime and active-report fixtures must also run against app bundle, not only source files. | `TEST` |
| App repo status | Current `git -C /Users/devanshvarshney/FilterTubeApp status --short` returned clean in this pass. | No uncommitted app drift at audit time. | Good baseline, but app runtime copied files can still be stale relative to public repo if sync is not rerun. | `KEEP` + sync check |

Native sync report target:

```text
nativeRuntimeSyncReport = {
  publicRepoCommit,
  appRepoCommit,
  generatedAt,
  sources: [
    { source, destination, sha256, bundled: true|false }
  ],
  bundle: {
    androidRuntimeSha256,
    iosRuntimeSha256,
    bundleOrder,
    wrapperVersion,
    includesLayoutJs,
    iosPatchesApplied
  },
  unsupportedExtensionFeatures: [
    "extension first-run prompt",
    "extension release prompt",
    "extension script injection loader"
  ],
  appSpecificGates: [
    "native overlay quiet mode",
    "native fullscreen quiet mode",
    "Kids platform viewport scaling"
  ]
}
```

Native runtime invariant:

```text
Extension fixes are upstream.
Native apps may adapt transport, bridge, viewport, and shell ownership.
Native apps must not fork filtering semantics silently.

Every app runtime bundle must prove:
  source files and hashes,
  applied app-only patches,
  unsupported extension-only features,
  active-runtime report parity,
  renderer fixture parity,
  mutation-intent parity.
```

The immediate risk is not that Android/iOS exist. The risk is that a future extension fix changes `filter_logic.js`, `seed.js`, DOM fallback, or mutation semantics, while app bundles keep an older generated runtime or apply a platform patch that changes behavior without a report.

### Build / Release Script Method Ledger - 2

This pass goes one level deeper than the release-surface ledger above. The goal is not to redesign the release process yet; it is to record which script methods can silently ship stale runtime, stale UI, stale mobile artifacts, or stale user-facing claims.

| Script/method | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `package.json` release scripts | `package.json:6-17`. | Provides build commands and manifest-copy dev shortcuts, but no `test`, `lint`, `audit`, or release-check command. | A release can be produced without proving JSON fixtures, DOM fixtures, manifest parity, generated bundle freshness, or empty-install quietness. | `GATE` release checklist |
| `build.js` version authority | `build.js:25-31`, `build.js:140-145`; `package.json:3`; manifests at `manifest*.json:5`. | `VERSION` comes from package.json, while zip names use each manifest's version when present. | Package, manifest variants, release notes, and website copy can drift. Current repo already has release-note/UI version drift recorded elsewhere. | `REWRITE` single version source |
| `main()` generated UI step | `build.js:80-82`; UI entries at `scripts/build-extension-ui.mjs:8-17`. | Always rebuilds `js/ui-shell/popup-shell.js` and `js/ui-shell/tab-view-decor.js` before packaging. | Good for packaging, but direct commits can still change generated files without source, or source without generated files. | `GATE` generated diff check |
| `main()` README badge mutation | `build.js:84-85`, `build.js:602-658`. | Build mutates `README.md` LoC/version badges as a side effect. | A normal package build is not read-only. It can create unrelated doc diffs and hide release-critical diffs in noise. | `REWRITE` separate docs update |
| Target dist cleanup | `build.js:87-104`. | Full build wipes `dist`; single-target build only wipes that target directory. | Release body still advertises all browser zips even when only one target was built. Stale zips can remain in `dist` across partial builds. | `GATE` actual asset manifest |
| Common directory copy | `build.js:27-31`, `build.js:106-118`. | Copies `js`, `css`, `html`, `icons`, `data`, `assets`, README, changelog, license. | Releases include dormant legacy CSS and all assets unless classified. This is a release-burden issue even if manifests do not inject those files. | `INSTRUMENT` packaged asset map |
| Manifest variant packaging | `build.js:120-145`; manifest content scripts at `manifest.chrome.json:25-55`, `manifest.firefox.json:30-46`, `manifest.opera.json:29-58`. | Reads browser-specific manifest, applies script-order patch, writes `dist/<browser>/manifest.json`. | The build output manifest can differ from source manifest, and source `manifest.json` can be locally overwritten by dev shortcuts. | `GATE` source/dist manifest diff |
| `ensureCollabDialogScriptOrder()` | `build.js:159-179`. | Inserts or reorders `js/content/collab_dialog.js` before `js/content_bridge.js`. | Corrects one load-order invariant at packaging time, but it masks source manifest errors instead of failing. | `REWRITE` assert/fail source manifests |
| `createZip()` | `build.js:181-211`. | Archives every file under target dir except system junk. | No deterministic manifest of zipped files, no file hash list for browser zips, and no check that web-accessible runtime files match injection allowlist. | `INSTRUMENT` zip manifest + hashes |
| Mobile artifact regex | `build.js:34`. | Accepts `FilterTube-mobile-tablet-v...-code...-(release|debug).(apk|aab)` and exposes version/code/variant/extension parsing. | Good naming guard, but package id/signing/version cannot be proven from filename. | `GATE` artifact metadata proof |
| `maybeCollectMobileArtifacts()` | `build.js:216-282`. | Reads a source directory, selects current-version Android artifacts, copies them into `dist/mobile`, writes SHA-256 files, and warns when the selected versionCode lacks an APK/AAB pair. | Pair warnings are useful, but release/public copy still needs package name, signer fingerprint, install proof, and direct APK availability authority. | `GATE` artifact metadata proof |
| `selectLatestMobileArtifacts()` | `build.js:314-318`. | Chooses files with max parsed versionCode. | If release AAB and direct APK are not both present for that versionCode, the release warns but still can publish an incomplete Android surface unless a higher-level release gate blocks it. | `GATE` APK/AAB pair check |
| `sha256File()` | `build.js:286-290`. | Hashes copied mobile artifact bytes. | Good for direct APK trust; browser zip hashes are not produced. | `KEEP` + extend to zips |
| `maybePromptRelease()` | `build.js:292-348`. | In TTY, asks whether to publish, creates GitHub release, then uploads assets. | The release is public/non-draft before uploads finish. Any upload failure leaves a visible partial release. | `REWRITE` draft-first publish |
| `extractLatestChangelogEntry()` | `build.js:350-373`. | Parses `CHANGELOG.md` sections named `## Version x.y.z`. | Release body depends on changelog shape, but package data/release-notes/website can still diverge. | `GATE` release text source map |
| `buildReleaseBody()` | `build.js:388-479`. | Constructs browser and optional Android install instructions. | Advertises all browser targets from the package version, not from actual `zipPaths`; Android fallback says download page even if that page has not been updated. | `REWRITE` generated from asset manifest |
| GitHub HTTP helpers | `build.js:482-574`. | Calls GitHub releases API and uploads assets. | No retry/backoff or cleanup on partial upload failure. This is not filtering risk, but it affects public trust in releases. | `INSTRUMENT` release transaction log |
| Prompt helpers | `build.js:576-600`. | Simple TTY prompts for release and artifact directory. | Fine for manual release, but release decisions are not captured into a machine-readable manifest. | `INSTRUMENT` release decision file |
| `updateReadmeBadges()` | `build.js:602-658`. | Counts tracked file lines and rewrites README badges. | Counts generated/vendor files and can change docs during any build. This makes "build" non-idempotent and raises review burden. | `REWRITE` opt-in docs task |
| `scripts/build-extension-ui.mjs` | `scripts/build-extension-ui.mjs:8-43`. | Bundles Preact UI shells as browser IIFEs, unminified, no sourcemaps. | Good debug visibility. Needs a freshness check because runtime UI source and generated JS are both shipped. | `KEEP` + generated freshness test |
| `scripts/build-nanah-vendor.mjs` QR bundle | `scripts/build-nanah-vendor.mjs:16-26`; dependency at `package.json:41-43`. | Bundles `qrcode` from installed node_modules into `js/vendor/qrcode.bundle.js`. | Reproducible only if lockfile and dependency install are trusted. | `KEEP` |
| `scripts/build-nanah-vendor.mjs` Nanah bundle | `scripts/build-nanah-vendor.mjs:9`, `scripts/build-nanah-vendor.mjs:29-52`. | Bundles sibling `../nanah` core/client source onto `window.FilterTubeNanah`. | The exact Nanah revision is not recorded in the generated file or release manifest. A user cannot reproduce the sync runtime from the FilterTube repo alone. | `INSTRUMENT` Nanah commit stamp |
| `scripts/sync-native-runtime.mjs` | `scripts/sync-native-runtime.mjs:5-34`. | Delegates to private/sibling app repo `tools/sync-runtime-from-extension.mjs`. | Extension-to-app parity is real operationally, but not auditable from the public repo. Needs a sync report listing copied runtime files and source commit. | `INSTRUMENT` app sync report |
| `scripts/compress-video.swift` | `scripts/compress-video.swift:27-40`, `scripts/compress-video.swift:48-93`. | Compresses a video to MP4 at a named AVFoundation preset. | Website asset optimization is manual and not tied to build/deploy. It can prevent website lag, but release reproducibility needs source/output mapping. | `KEEP` + asset manifest |
| Dev manifest shortcuts | `package.json:15-17`. | `cp manifest.<browser>.json manifest.json`. | Mutates a tracked root manifest. This can accidentally ship/test the wrong browser variant. | `GATE` dirty manifest guard |

Build/release proof target:

```text
releaseBuildReport = {
  sourceCommit,
  workingTreeStatus,
  packageVersion,
  manifestVersions,
  generatedUiBundles: {
    inputs,
    outputs,
    fresh
  },
  browserArtifacts: [
    { target, zipPath, manifestPath, sha256, fileCount }
  ],
  mobileArtifacts: [
    { fileName, packageName, versionName, versionCode, sha256, signingFingerprint }
  ],
  nanahVendor: {
    sourcePath,
    sourceCommit,
    bundlePath
  },
  nativeRuntimeSync: {
    appRepoPath,
    appRepoCommit,
    copiedFiles
  },
  publicCopyTargets: [
    "CHANGELOG.md",
    "data/release_notes.json",
    "website/downloads",
    "GitHub release body"
  ]
}
```

Build/release disease finding:

```text
The current build path can produce usable artifacts, but it does not yet
prove that the shipped browser/runtime/app artifacts, public website copy,
Nanah vendor bundle, and native app runtime copy all came from one coherent
release state.
```

### CSS Hide Ownership Ledger - 2

This pass separates active UI CSS from dormant runtime CSS. CSS is part of the filtering disease because a broad selector can hide content even when JSON/DOM matcher logic did not decide to hide it.

| CSS file/surface | Proof | Current role | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `css/filter.css` default-hide model | `css/filter.css:8-35`, reveal rule `css/filter.css:37-42`. | Packaged asset, not content-script loaded by current manifests. | If loaded, it hides broad YouTube renderer families by default and relies on JS adding `.filter-tube-visible`. This is incompatible with the current selective-hide runtime. | `QUARANTINE` |
| `css/filter.css` child default-hide | `css/filter.css:44-50`. | Packaged dormant rule. | Hides watch-card and lockup child surfaces when parent lacks `.filter-tube-visible`. Can create partial cards/blank shelves if reactivated. | `QUARANTINE` |
| `css/content.css` fallback default-hide | `css/content.css:8-45`, child/image hide `css/content.css:72-90`. | Packaged asset described as fallback. | Same broad default-hide model plus direct image hiding. It should not be a fallback unless the JS reveal model is fully restored and tested. | `QUARANTINE` |
| `css/content.css` layout overrides | `css/content.css:98-120` and wider file. | Packaged dormant YouTube layout fixer. | Rewrites search/channel/grid layout outside a specific filter decision. If activated globally it can cause page layout regressions that look like filtering bugs. | `QUARANTINE` |
| `css/layout.css` Shorts default-hide | `css/layout.css:509-529`, `css/layout.css:531-548`, `css/layout.css:559-576`. | Packaged dormant layout/hide fixer. | Uses `:not(.filter-tube-visible)` and zero-dimension absolute hiding for Shorts. Dangerous if not paired with a complete reveal pass. | `QUARANTINE` |
| `css/layout.css` Mix/Playlist default-hide | `css/layout.css:604-631`, `css/layout.css:737-756`, `css/layout.css:758-768`. | Packaged dormant layout/hide fixer. | Aggressive `:has()` plus `:not(.filter-tube-visible)` hides playlists/mixes by default. This directly intersects the reported playlist/watch-page and 3-dot concerns. | `QUARANTINE` |
| `css/layout.css` catch-all image hide | `css/layout.css:770-803`. | Packaged dormant rule. | Hides images/pictures inside non-visible rich items. If activated before JS marks visibility, it can create visually empty non-matching cards. | `REMOVE` or sealed legacy |
| Active UI CSS files | `css/components.css`, `css/popup.css`, `css/tab-view.css`, `css/serene-shell.css`, `css/design_tokens.css`; UI manifests/pages load them, content manifests do not. | Extension popup/dashboard styles. | Not YouTube-page runtime lag. Must remain UI-page scoped and never be injected into YouTube content pages. | `KEEP` + scope |
| JS hide class writers | Central helper `js/content/dom_helpers.js:88`, content bridge optimistic hide `js/content_bridge.js:11646-11663`, playlist enrichment `js/content_bridge.js:7958-7960`, comment hide `js/content_bridge.js:12690-12708`. | Active runtime hide writers. | Active JS uses `.filtertube-hidden` / `data-filtertube-hidden`, while dormant CSS often keys off `.filter-tube-visible`. This vocabulary split is the root of CSS drift. | `CONSOLIDATE` |

CSS invariant:

```text
The active runtime should have one hide vocabulary:
  hidden because rule matched -> .filtertube-hidden + data-filtertube-hidden reason
  restored because no rule matched -> remove that exact writer state

The active runtime should not depend on:
  default-hide all renderers,
  reveal-everything classes,
  global :not(.filter-tube-visible) selectors,
  broad layout rewrites on YouTube content pages.
```

CSS action rule before any source fix:

```text
Do not delete or load these CSS files casually.
First classify each file in a package manifest:
  active-ui,
  active-content,
  legacy-default-hide,
  orphan,
  vendor.

Then tests must fail if a legacy-default-hide file becomes content-script loaded.
```

### Executable Fixture Gap Ledger - 1

Static audit has found enough disease-level risks that the next phase cannot be manual-only. A repository scan found no project-owned `test`, `tests`, `fixtures`, `__tests__`, `.test.*`, or `.spec.*` directories/files in the top-level extension repo; the only matching test directories are dependency-owned under `node_modules`.

| Needed harness | Proof / source material | What it must prove | Priority |
| --- | --- | --- | ---: |
| JSON renderer fixture harness | Runtime: `js/seed.js`, `js/filter_logic.js`; data docs: `docs/json_paths_encyclopedia.md`, `docs/youtube_renderer_inventory.md`. | Given settings and saved YouTube JSON, prove which renderers are removed, which are retained, which are harvest-only, and whether response replacement occurs. | 1 |
| Empty-install/no-rule performance harness | Startup paths: `js/seed.js:633-785`, `js/content_bridge.js:5717-6056`, `js/content/block_channel.js:2358-2397`. | With no keywords/channels and blocklist mode, prove no JSON mutation, no broad DOM fallback scan, no identity fetch, and bounded observer/listener/timer count. | 1 |
| State transition fixture harness | Mutation owners: popup/tab-view/background/StateManager/IO/Nanah ledgers above. | For every `blocklist <-> whitelist`, import, scoped Nanah, managed child edit, and migration, assert before/after mode, list counts, warnings, and compiled runtime revision. | 1 |
| CSS packaged asset guard | Manifests and CSS ledger above. | Fail build if legacy-default-hide CSS becomes content-script loaded or runtime-injected without explicit approved tests. | 1 |
| DOM card fixture harness | `js/content/dom_fallback.js`, `js/content/dom_extractors.js`, `docs/youtube_renderer_inventory.md`. | Given HTML card fixtures, prove hide/restoration decisions, identity confidence, no stale card carry-over, and no non-matching card hidden. | 2 |
| Quick block/menu lifecycle harness | `js/content/block_channel.js`, `js/content_bridge.js` menu ledgers. | Prove feature install/pause/resume/teardown; no global observers when quick/menu affordances are disabled or native overlay/fullscreen quiet mode is active. | 2 |
| Interaction side-effect harness | `js/content/dom_fallback.js:2384-2396`, `js/content_bridge.js:8123`, `js/content_bridge.js:8272`, background fetches. | Count synthetic clicks, media pauses/plays, and extension-origin fetches; prove they occur only under explicit user action or active-rule need. | 2 |
| Import/encryption/Nanah harness | `js/io_manager.js`, `js/security_manager.js`, `js/nanah_sync_adapter.js`. | Fixture old V3, new V4, encrypted full backup, active profile export, scoped Main/Kids Nanah, trusted-state restore, and rejected bad PIN. | 2 |
| Build/release harness | `build.js`, `scripts/*.mjs`, manifests. | Assert package/manifest version match, uploaded release body lists only built assets, mobile APK/AAB versionCodes pair, and Nanah vendor revision is recorded. | 3 |

Minimum first test matrix:

```text
empty install:
  mode=blocklist, lists empty -> no hide, no JSON mutation, no broad DOM scan

intentional empty whitelist:
  mode=whitelist, allow lists empty -> fail closed, visible warning required

accidental empty whitelist:
  migration/import/Nanah creates same state -> blocked by preview or explicit warning

blocklist keyword:
  matching renderer removed; non-matching renderer retained

blocklist channel:
  UC id / handle / custom URL / videoId map paths agree

playlist/mix:
  playlist owner/seed semantics do not treat "YouTube" byline as real owner

end screen:
  blocked video/channel does not reappear in player end-screen wall
```

Test invariant:

```text
No runtime source optimization should be accepted until it has at least:
  one JSON fixture,
  one DOM fixture,
  one state-transition fixture,
  and one empty-install/no-rule fixture for the touched path.
```

### Accepted Invariant Fixture Plan - 1

This section converts the current audit findings into the first executable proof plan. It does not implement the harness yet. It defines what must be proven before source behavior changes are accepted.

Current test/harness proof:

- `package.json:6-17` contains build/dev/sync commands only; no test command exists.
- A repository scan of project-owned files found no top-level `test`, `tests`, `fixtures`, `__tests__`, `.test.*`, or `.spec.*` files. Matches currently come from dependencies under `node_modules`.
- Therefore any future source optimization would currently rely on manual testing unless this harness is created first.

#### Invariant Group A - Empty Install Must Be Quiet

| Requirement | Current proof that makes it necessary | Fixture input | Required result |
| --- | --- | --- | --- |
| Empty blocklist must not mutate YouTube JSON. | Fetch path parses and rebuilds responses at `js/seed.js:624-680` before/while `processWithEngine()` decides no-op; XHR path differs and skips when settings missing at `js/seed.js:748-755`. | Settings: enabled, blocklist mode, all lists empty, all hide/content/category toggles false. JSON: home/search/watch/shorts sample responses. | `removedRendererPaths=[]`, `replacedResponse=false`, `harvestOnly=false` unless explicit passive-harvest mode is enabled. |
| Empty blocklist must not install broad DOM work. | `initializeDOMFallback()` applies fallback, installs menu buttons, observers, and prefetch stack at `js/content_bridge.js:5717-6055`; quick block starts after fixed delay at `js/content/block_channel.js:2358-2397`. | Simulated page with empty settings and feature flags off/on separated. | Observer/listener/timer count must be zero for enforcement work; UI affordance listeners may install only when the visible affordance is enabled and route-relevant. |
| Empty category/content toggles must not wake filtering. | Category active checks treat `enabled === true` as active in seed/DOM gates, while engine no-ops on empty selected at `js/filter_logic.js:2126-2134`; duration `longer` with `min=0` matches broadly at `js/filter_logic.js:2776-2783`. | Settings with category enabled but `selected=[]`; duration/upload enabled with blank/zero bounds. | Runtime active report says inactive or returns validation warning; no JSON rewrite, DOM scan, metadata fetch, or hide. |

#### Invariant Group B - Whitelist Must Be Explicit And Auditable

| Requirement | Current proof that makes it necessary | Fixture input | Required result |
| --- | --- | --- | --- |
| Intentional empty whitelist must be distinguishable from accidental empty whitelist. | JSON engine fail-closes when no whitelist rules exist at `js/filter_logic.js:1933-1967`; UI/import/Nanah paths can change mode outside one transition contract. | Manual mode switch, V3 migration, full import, scoped Nanah apply, managed-child edit. | Manual switch requires explicit warning/confirmation; migration/import/Nanah must emit transition preview with before/after mode and list counts. |
| `copyBlocklist=false` must be honored. | UI sends `copyBlocklist` from popup/tab/import, but background always merges/clears when requested mode is whitelist at `js/background.js:3302`, `js/background.js:3443-3445`, `js/background.js:3464-3470`. | Existing blocklist plus requested whitelist switch with `copyBlocklist=false`. | Existing blocklist remains unchanged; whitelist changes only according to explicit user/import action. |
| Managed-child and active-profile mode switches must share one contract. | Managed-child path mutates profile locally, normal path delegates to background, and current audit records divergent semantics. | Same starting profile, same requested mode change, once through active profile and once through managed-child editor. | Persisted V4 profile state, legacy mirrors, compiled runtime payload, warnings, and refresh revision are identical except target profile id. |

#### Invariant Group C - Channel Identity Decisions Need Reasons

| Requirement | Current proof that makes it necessary | Fixture input | Required result |
| --- | --- | --- | --- |
| Stable identity must outrank name-only matches. | Shared identity matcher returns boolean from UC/handle/custom URL/name fallbacks at `js/shared/identity.js:372-418` and `js/shared/identity.js:424-586`. | Same display name on two different channels; block one by UC ID/handle. | Only matching UC/handle/custom URL is blocked; same-name channel remains. Decision includes `reason` and `confidence`. |
| Weak name fallback must be route/list-mode aware. | Current matcher supports back-compat name matching (`@handle` against name-without-at and stable-name fallback). | Watch playlist/card with weak name-only metadata; whitelist and blocklist variants. | Blocklist may use weak fallback only if route contract allows it; whitelist should not allow weak fallback to reveal content unless explicitly approved. |
| Handle resolver network work must be action/rule scoped. | `js/content/handle_resolver.js:149-281` can read storage, ask background, fetch `/@handle/about`, post map updates, and force DOM fallback rerun. | Empty install, hover/menu open, explicit block action, active channel rule with unresolved handle. | Empty install does no network; menu/action/rule paths include action id, source reason, map writes, and rerun count. |

#### Invariant Group D - JSON Renderer Coverage Must Reduce DOM Burden

| Requirement | Current proof that makes it necessary | Fixture input | Required result |
| --- | --- | --- | --- |
| Documented renderer paths must be first-class or explicitly ignored. | Docs list `compactPlaylistRenderer`, search refinements, Shorts owner paths, `postRenderer`, and collaborator roster variants; current code has partial rules around `js/filter_logic.js:426-436`, `js/filter_logic.js:811-823`, and `js/filter_logic.js:3012-3045`. | JSON fixtures generated from `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`. | Each renderer has `supported`, `ignored`, or `metadataOnly` status. Unsupported but present renderers fail the fixture until classified. |
| `/player` is metadata-only unless proven otherwise. | Seed intercepts `/youtubei/v1/player`; engine harvests player metadata, but player response rewrite behavior is not separately classified. | Player response with owner/channel/title metadata and no feed renderer list. | No feed removal. Only metadata harvest/map writes occur when explicitly enabled and deduped. |
| End-screen wall must have both JSON and DOM proof. | `endScreenVideoRenderer` exists in rules at `js/filter_logic.js:435`, while player DOM end-screen fallback is separate. | Watch JSON/player DOM fixtures with blocked and unblocked recommendations. | Blocked end-screen entries are removed/hidden; unrelated end-screen entries remain; no synthetic click or playback side effect occurs. |

#### Invariant Group E - Background Must Be The Runtime Authority

| Requirement | Current proof that makes it necessary | Fixture input | Required result |
| --- | --- | --- | --- |
| Runtime compile must be pure or report writes. | `getCompiledSettings()` can migrate/write V4 at `js/background.js:1966-2080` and persist channel-derived keywords at `js/background.js:2330-2397`. | Storage with no V4, legacy blocklist, filterAll channels, and both Main/Kids surfaces. | Compile result and side effects are separated: either no writes during compile, or returned report lists exact writes and tests assert them. |
| Caller-provided runtime settings must not overwrite background authority. | `FilterTube_ApplySettings` accepts request settings and overwrites cache at `js/background.js:4381-4396`. | UI sends partial/stale blocklist-shaped payload while V4 active profile is whitelist. | Background rejects partial caller payload or recompiles authoritative payload before broadcasting. |
| Storage invalidation keys must match compile dependencies. | Compiler reads many keys at `js/background.js:1784-1827`; storage listener watches a smaller/different set at `js/background.js:4458-4495`. | Change every key read by compiler one at a time. | Either cache invalidates for every dependency or dependency list is generated/shared. |

Fixture output shape for all groups:

```text
auditFixtureResult = {
  fixtureId,
  sourceArea: "seed" | "json-engine" | "dom" | "background" | "ui-state" | "sync",
  inputStateHash,
  expectedContract,
  actual: {
    removedRendererPaths,
    hiddenDomSelectors,
    restoredDomSelectors,
    storageWrites,
    mapWrites,
    networkRequests,
    observerCount,
    listenerCount,
    timerCount,
    runtimeBroadcasts,
    decisionReasons
  },
  pass: boolean
}
```

Release contract target:

```text
One release manifest should declare:
  extensionVersion,
  androidVersionName/versionCode,
  iosVersion/build,
  runtimeSourceCommit,
  nanahSourceCommit,
  websiteCommit,
  releaseNotesVersion,
  expected assets,
  asset sha256,
  native runtime sync status.
```

Release scripts should fail closed when this manifest and actual artifacts disagree.

## Cross-Subsystem Finding - Message And Event Ledger

The extension has three major execution worlds:

```text
background service worker
  <-> isolated content scripts
    <-> main-world injected scripts
```

Filtering correctness depends on the messages between these worlds. A boolean hide decision is not the only risk; a message can also trigger a storage write, a network fetch, a forced DOM fallback pass, or a settings refresh.

### Main-World Injection And Startup

| Browser path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Chrome/Edge manifest main-world seed | `manifest.json:25-35`, `manifest.chrome.json:25-35` | Loads `js/seed.js` at `document_start` in `world: "MAIN"`. | Lowest-latency JSON/XHR hook, but empty-install cost still exists unless seed proves no-op quickly. | `KEEP` + `INSTRUMENT` |
| Chrome/Edge isolated bridge | `manifest.json:37-58`, `manifest.chrome.json:37-58`; `js/content/bridge_injection.js:85-93` | Isolated bridge later injects `shared/identity`, `filter_logic`, and `injector`; it does not inject `seed` because manifest already did. | Two-stage readiness can duplicate settings sends and refreshes if not counted. | `INSTRUMENT` |
| Firefox isolated-only manifest | `manifest.firefox.json:30-49`, `manifest.firefox.json:51-60`; `js/content/bridge_injection.js:85-93` | Firefox manifest exposes `seed.js` as web-accessible and the bridge injects `shared/identity`, `filter_logic`, `seed`, and `injector` through DOM script fallback. | Startup timing differs from Chromium; JSON-first behavior may begin later and must have Firefox fixtures. | `KEEP` + `TEST` |
| Background script injection API | `js/background.js:4009-4054` | Executes requested files in `world: "MAIN"` for Chromium-style injection. | Trusted only because caller is the content bridge, but action should be in a message ledger. | `INSTRUMENT` |

### Main-World To Isolated Messages

| Message | Proof | Effect | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `FilterTube_SettingsToInjector` | Sent in `js/content/bridge_settings.js:501-514`, received in `js/injector.js:1881-1898`. | Updates main-world settings, seed settings, and queued initial data processing. | Good core path; should carry active-enforcement report so main world can stay quiet when no rules exist. | `KEEP` + `REWRITE` payload |
| `FilterTube_InjectorToBridge_Ready` / `FilterTube_InjectorBridgeReady` | Sent in `js/injector.js:1995-1999`, handled in `js/content_bridge.js:5473-5478` and `js/content/bridge_settings.js:155-160`. | Triggers settings request from background. | Necessary, but startup should count duplicate ready/settings cycles. | `INSTRUMENT` |
| `FilterTube_UpdateVideoChannelMap` | Sent in `js/filter_logic.js:71-82`, handled in `js/content_bridge.js:5482-5530`. | Persists videoId -> channelId and then schedules a DOM fallback rerun. | Good JSON-first learning, but rerun must be active-rule gated and source-tagged. | `KEEP` + `GATE` |
| `FilterTube_UpdateVideoMetaMap` | Sent in `js/filter_logic.js:132-140`, handled in `js/content_bridge.js:5531-5556`. | Persists duration/date/category metadata and reruns DOM for touched cards. | Needed only when metadata filters are active; otherwise it adds churn. | `GATE` |
| `FilterTube_UpdateChannelMap` | Sent in `js/filter_logic.js:1502-1508`, `js/filter_logic.js:1543-1549`, `js/content/handle_resolver.js:218-222`, `js/content/handle_resolver.js:263-267`; handled in `js/content_bridge.js:5479-5481`. | Persists handle/custom URL -> UC ID mappings. | Multiple producers with different confidence levels; map writes need provenance. | `REWRITE` |
| `FilterTube_CacheCollaboratorInfo` | Sent in `js/filter_logic.js:1895-1909`, handled in `js/injector.js:1900-1911` and `js/content_bridge.js:5623-5661`. | Caches collaborator/channel identity for multi-channel videos. | Useful for collaboration blocking, but can wake DOM scans after JSON processing. | `INSTRUMENT` |
| `FilterTube_RequestCollaboratorInfo` / response | Request in `js/content_bridge.js:5168-5169`, handled in `js/injector.js:1913-1961`; response handled in `js/content_bridge.js:5570-5595`. | Isolated DOM card requests richer main-world collaborator info. | Good fallback, but should be route/active-rule scoped. | `GATE` |
| `FilterTube_RequestChannelInfo` / response | Request in `js/content_bridge.js:5215-5216`, handled in `js/injector.js:1963-1991`; response handled in `js/content_bridge.js:5662-5672`. | Isolated DOM card asks main-world `ytInitialData` for a channel. | Prefer this before network fetch, but still count it as enrichment work. | `KEEP` + `INSTRUMENT` |
| Subscription import bridge | Request in `js/content/bridge_settings.js:130-139`; main-world readiness/response in `js/injector.js:12-89`, `js/injector.js:1262-1263`; isolated responses in `js/content/bridge_settings.js:164-194` and `js/content_bridge.js:5596-5622`. | Explicit user-initiated import path. | Acceptable side effect because user asked for import; keep isolated from passive page load. | `KEEP` |

### Isolated To Background Messages

| Message/action | Proof | Effect | Risk | Verdict |
| --- | --- | --- | --- | --- |
| `getCompiledSettings` | `js/background.js:3242-3265`; requested by bridge settings refresh paths. | Compiles profile-specific settings for current YouTube/Kids host. | Correct source of truth; should return active-enforcement report. | `KEEP` + `REWRITE` payload |
| `FilterTube_RefreshNow` | `js/background.js:3483-3487`, `js/background.js:3930-3934`, `js/background.js:6113-6118`; handled in `js/content/bridge_settings.js:223-229`. | Forces settings reload and full DOM fallback reprocess. | Correct after settings mutations, too expensive as a generic repair hammer. | `GATE` |
| `FilterTube_ApplySettings` | Background broadcast in `js/background.js:4381-4395`; content receive in `js/content/bridge_settings.js:283-315`. | Pushes settings to matching host tabs and forces DOM fallback. | Good live-update path, but profile mismatch handling refetches and reprocesses. | `INSTRUMENT` |
| `updateVideoChannelMap` | Produced in `js/content_bridge.js:1280-1284`, `js/content_bridge.js:1465-1487`; handled in `js/background.js:4400-4406`. | Queues video/channel map write. | Good, but no source/freshness metadata. | `KEEP` + `INSTRUMENT` |
| `updateVideoMetaMap` | Produced in `js/content_bridge.js:1531-1536`; handled in `js/background.js:4407-4422`. | Queues video metadata write. | Should be disabled when metadata filters are inactive. | `GATE` |
| `updateChannelMap` | Produced in `js/content/handle_resolver.js:25-31`; handled in `js/background.js:4397-4399`. | Queues channel map mappings. | Good central API. Direct `storage.local.set({ channelMap })` paths should migrate here. | `KEEP` |
| `fetchChannelDetails` | Produced in `js/content/handle_resolver.js:200-206`; handled in `js/background.js:4437-4445`. | Background fetches channel info. | High side-effect/cost path; allowed only for explicit action or active strict rule need. | `GATE` |
| `fetchWatchIdentity` / `fetchShortsIdentity` | `js/content_bridge.js:7888-7890`, `js/content_bridge.js:8081-8083`; handled in `js/background.js:3961-3966`. | Background fetches watch/Shorts identity. | High side-effect/cost path; should not run in empty blocklist sessions. | `GATE` |
| `addFilteredChannel` / `toggleChannelFilterAll` | `js/background.js:5209-5263`; UI/fallback menu producers. | Mutates channel rules and may trigger identity fetch/enrichment. | User-action path is valid; must preserve click suppression and rollback proof. | `KEEP` + `TEST` |

### Storage Change Fanout

| Listener | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Background storage listener | `js/background.js:4458-4495` | Invalidates compiled settings and recompiles both Main and Kids when a small relevant-key list changes. | Correct cache invalidation shape, but key list omits `enabled`, `categoryFilters`, and many compiled booleans that `getCompiledSettings()` emits in `js/background.js:2474-2551`. Recompiling both surfaces after every watched change can add cost. | `REWRITE` key contract + `INSTRUMENT` |
| Content storage listener | `js/content/bridge_settings.js:547-609` | Ignores `channelMap` only, refreshes settings for `videoChannelMap`, `videoMetaMap`, rules, UI flags, and layout toggles. | Better coverage than background, but still omits `categoryFilters`. It also treats UI affordance flags as a full DOM refresh reason. | `REWRITE` active predicate |
| State manager storage listener | `js/state_manager.js:2292-2334` | UI-side state synchronization. | Needs later UI audit for duplicate redraws, but not part of content runtime hot path. | `KEEP` |

Message invariant:

```text
Every message/action should declare:
  direction,
  trusted sender requirement,
  whether it mutates storage,
  whether it fetches network,
  whether it forces DOM fallback,
  whether it is user-initiated or passive,
  active-enforcement predicate.
```

This ledger turns hidden performance work into countable product behavior. The current likely disease is not one bad observer; it is that many messages can independently wake expensive paths without one shared "should this surface do work right now?" report.

## Cross-Subsystem Finding - Quiet Mode Contract

FilterTube has several local "do not filter" checks, but it does not yet have one global quiet-mode contract. That matters for three user-visible states:

```text
extension enabled=false
  -> should not mutate JSON
  -> should not hide DOM
  -> should not attach hot observers/scanners beyond minimal settings listeners
  -> should not fetch identity pages

blocklist mode + no block rules/toggles
  -> should not hide DOM
  -> should not mutate JSON
  -> should not do fallback scans, quick-block sweeps, or identity fetches

whitelist mode + no allow rules
  -> intentional fail-closed mode only
  -> hide can be correct, but UI/import/migration must prove the user intentionally entered strict whitelist
```

### Current Quiet-Mode Proof

| Layer | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| JSON engine disabled check | `js/seed.js:359-362`, `js/filter_logic.js:3449-3452` | Returns original data when `enabled=false`. | Correct semantic guard. | `KEEP` |
| Fetch interceptor | `js/seed.js:625-680` | Every matching YouTube API fetch is still cloned, parsed, sent through `processWithEngine`, and rewrapped as a new `Response`, even if `processWithEngine()` returns the original object for disabled/no-op states. | Disabled or no-rule sessions can still pay parse/stringify/response-replacement cost. | `REWRITE` |
| XHR interceptor | `js/seed.js:748-785` | Avoids response rewrite when `enabled=false`, but still installs XHR wrappers globally for YouTube API endpoints. | Acceptable if measured low, but should be counted. No-rule blocklist still rewrites when `processWithEngine()` returns the original object. | `INSTRUMENT` + `REWRITE` no-op |
| DOM fallback init | `js/content_bridge.js:5704-5711`, `js/content_bridge.js:5717-5727` | Always waits 1 second, applies DOM fallback, and initializes fallback menu when settings exist. | Empty install and disabled sessions can still start fallback/menu work before any active-work report is checked. | `GATE` |
| DOM fallback observer | `js/content_bridge.js:5736-6040` | Observer is installed after DOM fallback init; callback then decides whether to apply. | Body observer itself is still hot infrastructure in quiet/no-rule sessions. | `GATE` |
| Prefetch hooks | `js/content_bridge.js:6050-6055` | Card prefetch observer, playlist panel prefetch hook, right-rail whitelist observer, and prefetch scan start with DOM fallback initialization. | Can create hidden metadata/identity work even when no user rule needs it. | `GATE` |
| Quick block enabled predicate | `js/content/block_channel.js:808-817` | Quick block action is off in whitelist and unless `showQuickBlockButton === true`. | Predicate ignores `enabled=false`; startup still occurs separately. | `REWRITE` |
| Quick block startup | `js/content/block_channel.js:1438-1451`, `js/content/block_channel.js:1454-1664`, `js/content/block_channel.js:2358-2397` | Installs listeners, a body MutationObserver, and a `1800ms` periodic sweep after one second. Worker removes buttons when predicate false. | Quiet sessions can still pay listener/observer/timer cost. Resize/orientation handlers can also collide with fullscreen/orientation changes. | `GATE` |
| Native dropdown startup | `js/content/block_channel.js:1667-1785`, `js/content/block_channel.js:2358-2397` | Starts menu observer after one second and watches dropdown nodes for injection. | Correct feature when 3-dot affordance is enabled, but should not run in disabled/whitelist/no-affordance states. | `GATE` |
| Whitelist pending hide queue | `js/content_bridge.js:5777-5955`, `js/content_bridge.js:6025-6034` | Queue machinery is installed globally with DOM fallback observer; worker checks whitelist mode before hiding. | Semantically guarded, but still contributes hot mutation processing outside whitelist. | `GATE` |

### Quiet-Mode Invariant

```text
Only one layer should decide quiet mode.

background compiled settings
  -> include enforcementReport
  -> content bridge receives it
  -> seed, DOM fallback, quick block, fallback menu, prefetch, and identity resolvers all consume the same report
```

Required report fields:

```text
runtimeEnabled: boolean
hasAnyBlockingRule: boolean
hasAnyAllowRule: boolean
hasAnyBooleanRule: boolean
hasAnyValidContentRule: boolean
hasAnyValidCategoryRule: boolean
strictWhitelistActive: boolean
shouldInstallMutationObserver: boolean
shouldInstallQuickBlock: boolean
shouldInstallNativeMenuObserver: boolean
shouldRewriteNetworkResponses: boolean
shouldResolveIdentityInBackground: boolean
```

No-op response rule:

```text
If the JSON engine returns the same object reference and no metadata side effect is required,
return the original fetch/XHR response instead of stringifying and replacing it.
```

This section is the strongest current explanation for "fresh install is slowing YouTube": filtering semantics may be no-op, but runtime infrastructure is still installed and some network responses are still parsed/replaced.

## Cross-Subsystem Finding - Active Enforcement Contract

The audit now has enough evidence to name a system-level problem: FilterTube does not have one canonical runtime predicate for whether enforcement is actually active. Different layers use different local tests.

### Current Active-State Tests

| Layer | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Background compiled settings | `js/background.js:2474-2551` | Compiles many booleans, content filters, category filters, and UI affordance flags into one settings object. | Correct source of values, but does not emit a canonical "enforcement active" summary. | `KEEP` + `INSTRUMENT` |
| Settings shared save/load | `js/settings_shared.js:17-54`, `js/settings_shared.js:691-736` | Loads profile `contentFilters` and `categoryFilters`, but `SETTINGS_KEYS` omits them from the top-level key list. | Cross-view change detection can drift from actual enforcement state. | `REWRITE` |
| JSON skip gate | `js/seed.js:197-330` | Skips JSON engine on search/channel/home only when blocklist mode has no active lists, comments/Shorts flags, content filters, or category filter flag. | Good intent, but category filter is considered active even with zero selected categories. | `REWRITE` |
| DOM fallback gate | `js/content/dom_fallback.js:1933-1999` | Blocklist mode checks lists/booleans/content/category filters. Whitelist mode is always active. | Empty whitelist fail-closed is explicit, but this also means expensive DOM work begins just because mode is whitelist. Category filter flag has same enabled-empty problem. | `KEEP` semantics + `GATE` work |
| JSON filter engine | `js/filter_logic.js:938-994`, `js/filter_logic.js:1933-1967` | Normalizes content/category filters and blocks all non-container renderers in whitelist when there are no whitelist rules. | Correct for strict whitelist only if UI makes the mode explicit. Bad if a migration/import silently creates an empty whitelist. | `KEEP` + `UX GATE` |
| Quick block | `js/content/block_channel.js:808-817`, `js/content/block_channel.js:2358-2397` | Disabled in whitelist and when `showQuickBlockButton` false, but observer still starts after 1 second. | Empty blocklist install can still attach observer/listener scaffolding. | `GATE` |
| Fallback 3-dot menu | `js/content_bridge.js:5723-5727`, `js/content_bridge.js:6061-6069`, `js/content_bridge.js:10090-10102` | Menu style/scanner initialization runs after DOM fallback init, then individual injection returns in whitelist or when disabled. | Empty install still pays scanning/init cost for an affordance, even if no filtering rules exist. | `GATE` |
| Whitelist pending hide | `js/content_bridge.js:5777-5955` | Mutation observer queues added cards and may pre-hide pending whitelist cards outside excluded routes. | Useful for fail-closed whitelist, but must never run in blocklist/no-rule sessions. Current guard checks mode inside worker, but queue setup is still installed globally. | `GATE` |

### Required Runtime Predicate

Future implementation should create one shared predicate, with a report object, used by seed, DOM fallback, quick block, fallback menu, bridge prefetch, and native app runtime copies.

```text
hasActiveEnforcement(settings, route, surface) -> {
  mode: "blocklist" | "whitelist",
  strictWhitelist: boolean,
  hasBlockRules: boolean,
  hasAllowRules: boolean,
  hasBooleanRules: boolean,
  hasContentRules: boolean,
  hasCategoryRules: boolean,
  hasUiAffordances: boolean,
  shouldRunJsonEngine: boolean,
  shouldRunDomFallback: boolean,
  shouldRunQuickBlock: boolean,
  shouldRunFallbackMenu: boolean,
  shouldRunIdentityFetches: boolean,
  reason: string[]
}
```

Important edge rules:

```text
blocklist + no lists + no toggles + disabled/empty content/category rules
  -> no hide, no JSON mutation, no DOM fallback scan, no prefetch, no identity fetch.

whitelist + no allow rules
  -> fail closed only if the user intentionally selected whitelist for that profile/surface.
  -> show explicit UI status and instrument the reason.

categoryFilters.enabled === true + selected.length === 0
  -> inactive, not active enforcement.

contentFilters.*.enabled === true + incomplete values
  -> inactive or validation-warning, not a hidden broad filter.

showQuickBlockButton/showBlockMenuItem
  -> UI affordance flags, not enforcement rules.
```

### Active-State Flow

```text
storage/profile state
  -> background compiled settings
    -> active enforcement report
      -> seed JSON/XHR processing
      -> isolated DOM fallback processing
      -> quick block observer
      -> fallback 3-dot menu scanner
      -> identity resolver/fetch policy
      -> stats/log counters
```

Without this contract, each optimization can be locally correct and still globally wrong because a different subsystem wakes up and does work or hides content under a different definition of "active."

## Cross-Subsystem Finding - Runtime Settings Authority Drift

Settings mutation is currently split between shared UI compilation, `StateManager`, background profile mutation, and managed-child profile mutation. This matters because a correct filter predicate can still behave wrongly if it receives a transient or incorrectly migrated runtime payload.

### Settings Broadcast And List-Mode Transition Ledger

| Path | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Shared settings compile shape | `js/settings_shared.js:524-560` | Compiles `filterKeywords`, `filterKeywordsComments`, `filterChannels`, booleans, content filters, category filters, and affordance flags. | This local compiled payload does not include `listMode`, `profileType`, `whitelistChannels`, or `whitelistKeywords`. | `REWRITE` background-authoritative compile |
| StateManager local broadcast | `js/state_manager.js:1057-1059` | After save, `StateManager` broadcasts `result.compiledSettings` when present. | UI saves can briefly send a blocklist-shaped runtime payload even when background profile mode is whitelist. | `FIX` |
| Background profile compile authority | `js/background.js:1990`, `js/background.js:2011`, `js/background.js:2211` | Background compiled settings include active mode/profile and active allow/block lists. | This is closer to the authority that content runtime should trust. | `KEEP` |
| UI copy prompt | `js/tab-view.js:10548-10560` | When enabling empty whitelist, UI asks whether to copy current blocklist; if user declines, it says whitelist stays empty and content will stay hidden. | User intent is explicit and should be respected exactly. | `KEEP` |
| Background ignores no-copy intent | `js/background.js:3302`, `js/background.js:3406-3445` | Background reads `copyBlocklist`, but any `requestedMode === "whitelist"` calls `mergeAndClearBlocklistIntoWhitelist()`. | `copyBlocklist:false` can still copy blocklist into whitelist and clear blocklist. This is a serious mode-transition contract bug. | `FIX` |
| Main legacy blocklist clear | `js/background.js:3464-3470` | Main whitelist transition clears legacy `filterChannels`, `uiChannels`, `uiKeywords`, and compiled keyword arrays. | If no-copy was intended, legacy blocklist can still be cleared. | `FIX` |
| Managed child divergence | `js/tab-view.js:10574-10598` | Managed-child mode implements copy/no-copy locally before saving target mode. | Managed-child and normal mode transitions can produce different persisted shapes for the same UI choice. | `REWRITE` shared transition |
| Import-to-whitelist path | `js/tab-view.js:4648-4660` | Subscription import enables Main whitelist with `copyBlocklist:false`. | Because background ignores no-copy, import can still copy/clear blocklist during a flow that explicitly requested no copy. | `FIX` |
| Popup mode toggle path | `js/popup.js:810-860` | Popup resolves active profile type, asks the same copy prompt, then sends `FilterTube_SetListMode`. | Same background bug affects popup and full dashboard. | `FIX` |
| Category filter enabled-empty save | `js/tab-view.js:840-844`, `js/state_manager.js:2172-2185` | UI and state manager can persist `enabled:true` with `selected:[]`. | Active gates wake JSON/DOM work while actual category filter does no useful matching. | `REWRITE` validation |
| Video filter stale threshold save | `js/tab-view.js:1072-1102`, `js/tab-view.js:1115-1130`, `js/state_manager.js:2125-2132` | UI spreads prior duration/upload state and only overwrites parsed positive inputs. | Turning a filter on with blank/currently invalid input can preserve old thresholds and surprise-hide content. | `REWRITE` validation |

Mode transition invariant:

```text
setListMode(profile, surface, "whitelist", { copyBlocklist: false })
  -> mode becomes whitelist
  -> whitelist remains exactly existing whitelist
  -> blocklist remains exactly existing blocklist
  -> runtime receives one background-compiled whitelist payload

setListMode(profile, surface, "whitelist", { copyBlocklist: true })
  -> mode becomes whitelist
  -> blocklist entries are copied into whitelist according to a documented migration rule
  -> clearing blocklist is explicit, tested, and user-confirmed
```

Current verdict: before any dual allow/block redesign, list-mode transition must become a single background-owned transaction that returns the compiled runtime payload. Otherwise import/sync/profile edits can silently enter strict whitelist or clear/copy lists differently from what the UI told the user.

### Background Authority Method Ledger - 2

This pass treats `js/background.js` as the runtime authority layer, not merely a message relay. The important disease is that compile, migration, cache updates, learned identity maps, profile/list transitions, fetches, and broadcasts are not separated by one action contract.

| Method/action family | Proof | Reads / writes / broadcasts | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| `getCompiledSettings()` cache hit and storage read | `js/background.js:2059-1828` | Reads a broad storage key set, returns cached payload unless `forceRefresh` is true. | Cache correctness depends on every writer invalidating exactly the same dependency set. | `KEEP` cache, `REWRITE` dependency schema |
| Compile-time V4 migration | `js/background.js:1963-1973`, `js/background.js:2078-2081` | A settings read can build and persist `ftProfilesV4`. | The compiler is not pure. A read-looking action can write storage, trigger listeners, and change profile schema before user intent. | `REWRITE` |
| Compile-time channel-derived keyword write | `js/background.js:2330-2400` | Derives `filterAll` channel-name keywords and persists them back into profile/root keyword lists. | Channel rows can mutate keyword policy during compile, which weakens false-hide attribution: a display name can become stored filtering policy. | `REWRITE` |
| Compiled affordance defaults | `js/background.js:2504-2505`, `js/settings_shared.js:556-557`, `js/state_manager.js:86-87` | Emits `showQuickBlockButton` and `showBlockMenuItem` as true unless explicitly false. | Empty install is not an empty lifecycle. UI affordance observers/scanners can still wake even when no rules exist. | `GATE` lifecycle |
| Compiled cache write | `js/background.js:2555-2556`, `js/background.js:3247-3259` | Stores compiled payloads under `compiledSettingsCache.main/kids`; `getCompiledSettings` message returns cache directly. | Cached payloads need a revision and dependency key contract. Otherwise stale settings can survive storage writes. | `INSTRUMENT` |
| Background storage invalidation | `js/background.js:4458-4495` | Clears both caches and recompiles both profiles when a smaller key list changes. | The listener key list is not the compiler dependency list; it omits keys such as `enabled`, `categoryFilters`, many compiled booleans, map keys, and affordance flags. | `REWRITE` |
| Content-side storage refresh | `js/content/bridge_settings.js:547-603` | Watches a broader key list and requests background settings with `forceRefresh`; skips single `channelMap` writes but refreshes on video maps without forced DOM reprocess. | Content and background disagree on relevant keys. Some writes can over-refresh content while background cache may not invalidate, or vice versa. | `REWRITE` shared key schema |
| UI-pushed settings to background | `js/background.js:4381-4396` | Accepts `request.settings`, assigns it to `compiledSettingsCache[targetProfile]`, then broadcasts it to matching tabs. | Background stops being the sole runtime compiler. A stale or partial UI payload can become authoritative cache and force DOM fallback across tabs. | `GATE` / `REWRITE` |
| Content receive of pushed settings | `js/content/bridge_settings.js:283-315` | Normalizes profile/host mismatch, sends settings to Main world, and forces DOM fallback. | Good live-update shape, but it should only consume background-compiled payloads with a revision/source, not arbitrary caller settings. | `INSTRUMENT` |
| List-mode switch | `js/background.js:3290-3497` | Reads mode/profile, writes `ftProfilesV4`, may clear legacy Main lists, invalidates caches, broadcasts refresh, schedules backup. | `copyBlocklist` is read at `js/background.js:3302` but any whitelist request still calls merge-and-clear at `js/background.js:3443-3445`. | `FIX` |
| Explicit whitelist-to-blocklist transfer | `js/background.js:3759-3945` | Moves whitelist lists into blocked lists and clears whitelist, writes V4 and root Main mirrors, broadcasts refresh. | Destructive transfer is explicit, but it duplicates mode/list sanitizer logic from other actions. | `INSTRUMENT` then consolidate |
| Shared `handleAddFilteredChannel()` | `js/background.js:5276-6167` | Normalizes input, may fetch channel/watch/Kids/Shorts identity, writes V4/V3/root list mirrors and `channelMap`, schedules enrichment/backup. | Correct as explicit user mutation, but network/map/list writes are bundled in one helper and must carry sender, profile, list type, and reason. | `INSTRUMENT` |
| Old/shared channel-add split | `js/background.js:4095-4365`, `js/background.js:5218-5247`, `js/background.js:5276-6167` | Different add paths exist for older Main add and shared content/Kids/whitelist add. | Normalization, duplicate handling, refresh, backup, and map writes can diverge by caller. | `REWRITE` one add action |
| Toggle Filter All | `js/background.js:6175-6268` | Mutates root `filterChannels`, updates V4 Main channels, syncs channel-derived keywords, invalidates caches. | Toggling one channel control mutates keyword policy as a side effect. That must be explicit in UI and transition reports. | `INSTRUMENT` |
| Learned video/channel map updates | `js/background.js:1594-1627`, `js/background.js:1933-1712`, `js/background.js:4397-4422` | Runtime messages enqueue/persist `channelMap`, `videoChannelMap`, and `videoMetaMap`; cache maps are mutated in-place. | Passive learning alters future identity decisions and compiled payloads without profile/route/confidence provenance. | `GATE` |
| Fetch channel/watch/Shorts/Kids identity | `js/background.js:2877-3102`, `js/background.js:4437-4445`, `js/background.js:4532-4645`, `js/background.js:4773-4800` | Background performs YouTube/YouTube Kids/channel fetches for identity. | Legitimate for explicit block/add or active strict filtering; risky if reachable from passive/no-rule sessions. | `GATE` rate/reason |

Background action contract target:

```text
backgroundAction = {
  action,
  allowedSenders: ["ui", "content", "main-world-bridge", "native-app"],
  reads: ["storage keys"],
  writes: ["storage keys"],
  mutatesCache: boolean,
  broadcasts: ["message names"],
  network: ["none" | "youtube-watch" | "youtube-shorts" | "youtube-kids" | "channel-page"],
  profileTarget: "main" | "kids" | "active-profile" | "explicit-profile-id",
  listTarget: "blocklist" | "whitelist" | "none",
  requiresPinSession: boolean,
  requiresActiveRule: boolean,
  requiresExplicitUserAction: boolean,
  invalidatesCaches: ["main", "kids"],
  returnsRevision: boolean
}
```

Required invariants:

```text
getCompiledSettings(...)
  -> may read storage
  -> may return a background-compiled payload
  -> must not persist migrations, sync keywords, write maps, or mutate profile state

FilterTube_ApplySettings
  -> may request a refresh or deliver a background revision
  -> must not accept arbitrary caller settings as compiled cache truth

map/meta learning
  -> may write only when a declared active rule or explicit user action needs the learned fact
  -> must include source, route, confidence, and expiration/cap policy

mode/list mutations
  -> one transaction owns V4, V3, legacy mirrors, cache invalidation, backup trigger, and broadcast
```

Peer-agent convergence on the same background disease:

| Agent proof | Added point | Required test |
| --- | --- | --- |
| `settings_shared.js:102`, `settings_shared.js:151`, `settings_shared.js:158`, `settings_shared.js:647`; `state_manager.js:318` | Legacy V3-to-V4 migration can erase whitelist mode/lists because shared settings migration creates blocklist/default whitelist shape, writes it during load, then StateManager prefers V4. | V3-only fixture with Main and Kids whitelist mode and allow rules must preserve mode/lists after `FilterTubeSettings.loadSettings()` and `StateManager.loadSettings()`. |
| `state_manager.js:1009`, `state_manager.js:1387`, `state_manager.js:2046`, `state_manager.js:2125`, `state_manager.js:2182` | `saveSettings()` drops concurrent saves while in-memory mutators continue and listeners may report success. | Two quick mutations with delayed persistence must end with storage and broadcast containing both changes. |
| `tab-view.js:4655`, `background.js:3302`, `background.js:3443`, `background.js:3433` | Import flow asks for `copyBlocklist:false`, but background still merges and clears blocklist on whitelist activation. | Existing blocklist + imported whitelist fixture must prove no-copy preserves blocklist. |
| `state_manager.js:53`, `tab-view.js:10549`, `tab-view.js:10624`, `filter_logic.js:1960` | Empty whitelist mode is an intentional fail-closed state, but it needs explicit UX/runtime status because it hides broadly. | Empty whitelist fixture must distinguish user-confirmed strict mode from accidental migration/import drift. |
| `state_manager.js:1560`, `settings_shared.js:784`, `settings_shared.js:922`, `background.js:2057` | `syncKidsToMain` can turn Kids channel-derived keywords into persisted Main keyword policy. | Enable sync with Kids `filterAll`, mutate Main, disable sync, and assert Main rules do not retain Kids-derived keywords. |

### State Manager And Shared Settings Mutation Ledger - 1

This pass maps the UI/state layer that feeds background runtime settings. The core concern is not that UI state exists; it is that UI state can mutate first, persist later, then broadcast or notify success even if persistence/refresh did not actually produce the authoritative background runtime payload.

| Method/action family | Proof | Reads / writes / broadcasts | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Shared V3-to-V4 builder | `js/settings_shared.js:102-168` | Builds a default V4 profile from legacy/root state. | Main and Kids modes are forced to `blocklist`, while whitelist channels/keywords are initialized empty at `js/settings_shared.js:151-164`; legacy whitelist state can be dropped in this path. | `FIX` |
| Shared settings load write | `js/settings_shared.js:647-653`, `js/settings_shared.js:667-684` | `loadSettings()` writes missing V4 or missing profile settings during a read. | Another read-looking path mutates storage and can trigger reloads; migration/default filling must be explicit and fixture-backed. | `REWRITE` |
| Shared settings save compile | `js/settings_shared.js:784-841`, `js/settings_shared.js:843-947` | Sanitizes channels/keywords, builds a local compiled payload, writes root mirrors and V4 active profile. | UI/shared code compiles runtime-shaped settings separately from background, but does not include every background-owned field/mode contract. | `REWRITE` background-only runtime compile |
| Shared save V4 main write | `js/settings_shared.js:918-934` | Writes active profile `main.channels` and `main.keywords`; preserves existing Kids mode/block lists. | Fine for simple Main blocklist save, but dual allow/block and profile transitions need one background transaction, not local V4 patching. | `GATE` |
| Shared no-V4 save migration | `js/settings_shared.js:950-1068` | Builds V4 from legacy storage and writes it during save. | Comment admits category filters cannot be reliably preserved; whitelist state is also at risk through the same builder. | `FIX` |
| State load V4 preference | `js/state_manager.js:318-327`, `js/state_manager.js:328-347` | Prefers V4 Main lists/mode, falls back to V3 only when V4 Main is absent. | If an earlier read generated lossy V4, StateManager will trust it and never recover V3 whitelist lists. | `FIX` |
| User whitelist keyword rebuild | `js/state_manager.js:348-350`, `js/state_manager.js:1366-1372`, `js/state_manager.js:1427-1435`, `js/state_manager.js:1478-1485`, `js/state_manager.js:1523-1531` | Splits out `source:'channel'` whitelist keywords, then user keyword mutations rebuild `state.whitelistKeywords` only from user entries. | Channel-derived allow keywords can be lost after a user edit unless they are re-derived elsewhere. | `FIX` |
| Main blocklist save queue | `js/state_manager.js:1009-1065` | If `isSaving` is true, returns immediately; otherwise calls `SettingsAPI.saveSettings`, may broadcast `result.compiledSettings`, notifies save. | Concurrent mutations can update in-memory state while later save calls are dropped. A saved/broadcast runtime payload may represent only the first mutation. | `REWRITE` save queue |
| Main/Kids profile persistence | `js/state_manager.js:1077-1145`, `js/state_manager.js:1148-1204` | Writes V3 and V4 profile slices; catches and only warns on failures. | Callers often notify success and schedule backup after these methods, so persistence failure can be invisible to users and runtime. | `FIX` failure contract |
| UI local settings broadcast | `js/state_manager.js:1209-1215` | Sends `FilterTube_ApplySettings` with a local compiled payload. | Amplifies the background cache-authority problem: UI can push settings rather than requesting background-compiled revision delivery. | `GATE` |
| Background refresh rebound | `js/state_manager.js:1224-1235` | Calls `getCompiledSettings(forceRefresh:true)`, then rebroadcasts via `FilterTube_ApplySettings`. | Good intent, but still routes through the same apply-settings surface; should instead ask background to broadcast its own revision or return it to the exact caller. | `INSTRUMENT` |
| Main keyword add/toggle/remove | `js/state_manager.js:1346-1399`, `js/state_manager.js:1420-1453`, `js/state_manager.js:1474-1498`, `js/state_manager.js:1519-1544` | Mutates state first, persists via profile save or `saveSettings()`, requests refresh, then notifies and backs up. | Success events/backups are not conditional on persistence and background refresh being authoritative. | `FIX` |
| `syncKidsToMain` keyword synthesis | `js/state_manager.js:1555-1570`, `js/settings_shared.js:784-785`, `js/settings_shared.js:922-925` | Merges Kids channels into Main keyword synthesis when modes match; shared save persists the synthesized keyword list. | Kids-derived channel keywords can become stored Main policy, making later false hides look like user Main rules. | `REWRITE` derived overlay |
| Content filter updates | `js/state_manager.js:2115-2135`, `js/state_manager.js:2137-2160` | Shallow-merges duration/upload/uppercase state, saves, refreshes, notifies. | Incomplete values can preserve stale thresholds or enable active no-op/heavy-work states. | `REWRITE` validation |
| Category filter updates | `js/state_manager.js:2162-2188`, `js/state_manager.js:2190-2217` | Persists `enabled:true` even when `selected` is empty. | Active gates can wake JSON/DOM work while rule evaluation has no useful selected categories. | `FIX` active validation |
| StateManager storage listener | `js/state_manager.js:2334-2407` | Ignores changes while `isSaving`; watches a long but still hand-maintained key list; reloads after 150ms. | Local save windows can suppress external changes, and this key list still differs from background/content/shared compiler dependencies. | `REWRITE` generated key schema |

State-layer target contract:

```text
stateMutation(name, payload)
  -> validates user intent and input shape
  -> sends one typed background mutation
  -> receives { ok, profileRevision, runtimeSettingsRevision, warnings, changedKeys }
  -> updates UI state from the returned authoritative snapshot
  -> notifies success only after persistence and runtime refresh succeed

derived rules, such as filterAll channel-name keywords or syncKidsToMain overlays,
  -> remain derived overlays in compiled runtime settings
  -> do not become persisted user keyword entries unless the user explicitly converts them
```

Required state fixtures:

```text
V3-only whitelist profile
  -> load shared settings
  -> load StateManager
  -> assert Main/Kids whitelist modes and allow lists survive

two quick mutations while save is delayed
  -> assert final storage and runtime broadcast include both changes

whitelist channel-derived keyword + user keyword
  -> add/toggle/remove user keyword
  -> assert source:"channel" allow keyword survives

categoryFilters.enabled true + selected []
  -> assert active enforcement report says inactive, not active/no-op

duration/upload filters enabled with blank/stale values
  -> assert validator blocks the state or stores an explicit disabled warning state
```

## Cross-Subsystem Finding - Quick Block And Menu Lifecycle Drift

`js/content/block_channel.js` proves a common pattern in the runtime: final UI rendering is gated, but feature lifecycle installation is not equally gated. That means an empty or whitelist session may remove visible quick-block buttons while still keeping global listeners, observers, viewport work, and periodic sweeps alive.

### Quick Block / Menu Method Ledger - 1

| Method/action family | Proof | Installs / mutates / sends | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Global startup | `js/content/block_channel.js:2358-2397` | After 1000ms, always calls `setupMenuObserver()` and `setupQuickBlockObserver()`. | Startup does not ask whether quick block/menu UI is enabled, whether rules exist, or whether current mode is whitelist. | `GATE` |
| Quick-block enabled predicate | `js/content/block_channel.js:808-817` | Requires `currentSettings.showQuickBlockButton === true` and `listMode !== 'whitelist'`. | Good final predicate, but it is consulted inside sweeps/handlers, not before installing the whole lifecycle. | `KEEP` + move earlier |
| Quick-block selector surface | `js/content/block_channel.js:762-806` | Covers desktop, mobile, Shorts, playlist, modern lockup, YT Kids card renderers. | Broad selector list is appropriate for UI reach, but expensive if swept periodically without active affordance. | `GATE` |
| Style injection | `js/content/block_channel.js:819-929` | Injects quick-block CSS and mobile/native overlay hiding rules. | Low cost, but still part of the always-installed feature. It should follow the same lifecycle owner as button scanning. | `INSTRUMENT` |
| Button sweep | `js/content/block_channel.js:1435-1452` | If disabled, removes buttons; otherwise scans all matching cards and calls `ensureQuickBlockButton()`. | Correct visible behavior, but disabled state still wakes the timer/listener that calls it. | `GATE` |
| Quick-block observer boot | `js/content/block_channel.js:1454-1664`; executable fixture in `tests/runtime/lifecycle-source-current-behavior.test.mjs` | Adds document focus/input/click/scroll listeners, window resize/orientation listeners, pointerenter/pointermove/mouseleave listeners, body `MutationObserver`, and a 1800ms interval before the first feature-enabled guard. | This is the strongest empty-install/fullscreen/resize lag proof in this file. The lifecycle is one-way: no disconnect/remove path is stored. | `REWRITE` lifecycle |
| Viewport refresh scheduler | `js/content/block_channel.js:683-697`, `js/content/block_channel.js:1463-1491` | Schedules viewport checks on focus, scroll, resize, and orientation. | Fullscreen/orientation churn can wake quick-block viewport work even when the visible button is disabled or covered. | `GATE` |
| Desktop pointer tracker | `js/content/block_channel.js:1505-1604` | Tracks pointer position, calls `elementsFromPoint()`, scans `.filtertube-quick-block-host`, ensures buttons. | Useful for hover precision, but too costly to run as a permanent global listener without feature lifecycle state. | `GATE` |
| Quick-block mutation observer | `js/content/block_channel.js:1607-1649` | On mutations, checks enabled, removes buttons if disabled, or ensures buttons/schedules sweeps. | Disabled quick block still keeps the observer active and reacts to every large YouTube DOM mutation. | `REWRITE` lifecycle |
| Quick-block periodic sweep | `js/content/block_channel.js:1651-1655` | Calls `sweepQuickBlockButtons(document)` every 1800ms forever. | Periodic full-document sweep is not acceptable for no-rule or disabled-affordance sessions. | `GATE` / maybe `REMOVE` after observer proof |
| Menu observer startup | `js/content/block_channel.js:1669-1791` | Adds capture click listener, dropdown visibility observers, and a body `MutationObserver` for dropdowns. | The observer installs even when `showBlockMenuItem:false`; injection later may gate in `injectFilterTubeMenuItem`, but the observer cost remains. | `GATE` |
| Whitelist cleanup before injection | `js/content/block_channel.js:2119-2122` | Cleans menu items and exits when whitelist mode is active. | Correct behavior for current either/or mode, but it happens after dropdown detection and processing already woke. | `KEEP` + earlier gate |
| Injection function gate | `js/content_bridge.js:10090-10095` | Main injection exits if whitelist mode or `showBlockMenuItem === false`. | Correct final affordance gate; fallback/menu observer installation must share this predicate before installing. | `KEEP` |
| Kids passive block listener | `js/content/block_channel.js:1797-1840`, `js/content/block_channel.js:1966-2061` | Listens for Kids menu/toast block actions and sends `FilterTube_KidsBlockChannel`. | Legitimate because it piggybacks explicit native Kids block action, but it needs provenance and should be dormant outside Kids. | `KEEP` + action schema |
| Dropdown fetch cancel observer | `js/content/block_channel.js:2292-2327` | Opens temporary observers to close dropdown/cancel pending fetch when card/dropdown disappears. | Action-scoped and disconnects itself; this is closer to the desired lifecycle shape. | `KEEP` |

Quick-block lifecycle target:

```text
quickBlockFeature = {
  installed: false,
  enabledBySettings: settings.showQuickBlockButton === true,
  enabledByMode: settings.listMode !== "whitelist",
  enabledBySurface: youtubeMain && !nativeOverlayQuiet && !fullscreenSensitiveTransition,
  install(): add observers/listeners/timers,
  pause(reason): keep state but skip scans and viewport work,
  teardown(): remove observers/listeners/timers and clear wrappers,
  counters: { scans, matchedCards, buttonsAdded, buttonsRemoved, mutationBatches }
}
```

Menu affordance target:

```text
canShowBlockAffordance(settings, surface)
  -> false in whitelist mode for current either/or behavior
  -> false when showBlockMenuItem === false
  -> false under native overlay quiet/fullscreen transition
  -> true only for explicit dropdown/menu interaction

If false before install:
  no body dropdown observer,
  no global click tracker,
  no fallback menu scanner,
  cleanup any existing FilterTube menu items once.
```

## Cross-Subsystem Finding - Main-World Injector Authority Drift

`js/injector.js` is the Main-world bridge. It has legitimate reasons to exist: isolated content scripts cannot directly inspect YouTube's page globals, subscriptions import needs page credentials/config, and collaborator/channel identity often lives in `ytInitialData`. The risk is that the bridge currently mixes settings delivery, seed wiring, data queue processing, subscriptions import, collaborator lookup, and backup `ytInitialData` hooks without one versioned trust contract.

### Injector Method Ledger - 1

| Method/action family | Proof | Reads / writes / sends | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Subscriptions import bridge install | `js/injector.js:8-78` | Sets page-visible ready flags and listens for `FilterTube_RequestSubscriptionImport` messages from `source:'content_bridge'`. | Message source is a string label on a same-window `postMessage`; this needs request correlation and schema validation because Main world is page-visible. | `GATE` |
| Subscriptions fetch loop | `js/injector.js:1239-1688` | Fetches YouTubei browse/continuation endpoints, posts progress and response messages. | Legitimate explicit import feature, but high-cost and credential-bearing. Must never run from passive runtime or malformed page messages. | `KEEP` + action token |
| Main-world message listener | `js/injector.js:1872-1993` | Accepts settings, collaborator cache info, collaborator lookup requests, and channel info lookup requests. | Multiple authority classes share one listener. Settings writes, collaborator caching, and identity lookup should be separate message schemas. | `REWRITE` schema |
| Settings delivery | `js/injector.js:1881-1897` | Merges payload into `currentSettings`, marks `settingsReceived`, calls `updateSeedSettings()`, then processes queued data. | Runtime settings become whatever the bridge payload says. There is no background revision/source proof at this boundary. | `GATE` |
| Filter-logic collaborator cache | `js/injector.js:1900-1910` | Caches collaborator info from `source:'filter_logic'`. | Useful JSON-to-DOM bridge, but the cache should carry source renderer, route, and confidence so poorer data cannot overwrite stronger data. | `INSTRUMENT` |
| Collaborator lookup request | `js/injector.js:1913-1961` | Searches collaborator cache and `ytInitialData`, posts response to content bridge. | Good action-scoped lookup; needs request id, expected matcher, and budget proof from caller. | `KEEP` + provenance |
| Channel lookup request | `js/injector.js:1963-1991` | Searches Main-world snapshots for a video channel by video id and expectations. | Correctly avoids network, but can scan large cached roots; should only be called for explicit menu/action or active strict rule need. | `GATE` |
| Seed settings update | `js/injector.js:3335-3355` | Calls `window.filterTube.updateSettings(currentSettings)` immediately or after one retry. | This is a second settings delivery path into seed in addition to `bridge_settings.js` direct seed update. Duplicate delivery can reprocess queues. | `REWRITE` single apply path |
| Seed processing callbacks | `js/injector.js:3401-3428` | Assigns `window.filterTube.processFetchResponse` and `processXhrResponse` to call `FilterTubeEngine.processData`. | Correct bridge shape, but seed and injector both need the same endpoint/no-op classifier to avoid expensive parse/rewrite when inactive. | `KEEP` + shared classifier |
| Backup `ytInitialData` hook | `js/injector.js:3440-3500` | Installs setter if seed did not; queues or processes `ytInitialData`. | Good fallback, but queue is uncapped and can duplicate seed's own hook/reprocess behavior if ownership is unclear. | `INSTRUMENT` |
| Engine readiness polling | `js/injector.js:3502-3532` | Polls every 100ms up to 5s, processes queued data, posts ready messages. | Acceptable startup cost, but queue processing must be idempotent and tied to settings revision. | `KEEP` + counters |

Main-world bridge target:

```text
mainWorldMessage = {
  type,
  requestId,
  source: "content_bridge" | "filter_logic",
  capability: "settings-apply" | "subscription-import" | "identity-lookup" | "collaborator-cache",
  settingsRevision?: string,
  route?: string,
  videoId?: string,
  expectedIdentity?: object,
  payloadSchemaVersion: number
}

Settings payloads must include a background-generated revision.
Subscription import requests must include a one-time token created by the isolated bridge.
Identity lookup responses must include source/confidence and never write persistent storage directly.
```

Injector disease summary:

```text
content_bridge -> injector -> seed
                -> FilterTubeEngine
                -> queued ytInitialData

Today:
  settings are merged by payload shape,
  queues process whenever settingsReceived && engine,
  seed may receive settings from both bridge_settings and injector,
  page-visible messages rely on string source labels.

Target:
  one background revision enters isolated bridge,
  one authenticated/nonce-bound message enters Main world,
  one seed apply call happens per revision,
  queued data processes once with endpoint/no-op classification.
```

### Injector Data Hook / Identity Method Ledger - 2

This pass expands the first injector ledger from "major action families" to the specific high-cost methods inside `js/injector.js`. This file sits in the page MAIN world, so its risks are different from normal extension scripts: it can read page globals and use YouTube credentials/config, but it also shares a `window.postMessage` boundary with page scripts.

| Method / block | Proof | Reads / writes / sends | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Idempotency / ready replay | `js/injector.js:80-103`, ready messages `js/injector.js:84-91`. | If already initialized, re-posts injector-ready messages. | Correct duplicate-load guard, but duplicate ready messages can cause repeated settings requests and fallback refreshes unless content-side receivers dedupe by revision. | `KEEP` + ready counter |
| Debug log relay | `js/injector.js:105-128`. | Logs locally and posts `FilterTube_InjectorToBridge_Log` with raw `args`. | Debug-only for `log`, but `warn/error` relay can pass arbitrary objects into content bridge. Keep disabled/noisy payloads bounded in production. | `INSTRUMENT` |
| Local settings defaults | `js/injector.js:132-143`. | Initializes permissive empty settings and `initialDataQueue`. | Defaults are safe, but queued data can accumulate before real settings/engine arrive. | `KEEP` + queue cap |
| Collaborator sanitizer group | `js/injector.js:148-321`. | Normalizes handles, removes placeholders, scores collaborator identity quality. | Good false-positive protection; should be shared with `filter_logic.js` and `content_bridge.js` because collaborator confidence is currently reimplemented in multiple places. | `KEEP` + consolidate |
| YouTube config reader | `js/injector.js:354-375`. | Reads `window.ytcfg.get()` / `window.ytcfg.data_`. | Necessary for user-initiated subscriptions import. Should not be used during normal filtering startup. | `KEEP` |
| Subscription request profile builder | `js/injector.js:398-516`. | Builds WEB/MWEB YouTubei contexts and credential-like headers from page config. | Correct main-world capability, but this is account/session-adjacent. It must remain behind explicit import action and a request token. | `GATE` import action token |
| Subscription artifact collector | `js/injector.js:554-643`. | Recursively scans response objects for channel renderers, continuations, and expected counts. | Useful import parser; recursion is broad but only should run during import. Needs max-node/depth/time counters. | `INSTRUMENT` |
| DOM seed collector | `js/injector.js:645-722`. | Reads Polymer element data from `ytd-channel-renderer` / `ytm-channel-list-item-renderer`. | Correct fallback for `/feed/channels`, but it reads live DOM data and should not be on page-load path. | `KEEP` import-only |
| Page snapshot seed collector | `js/injector.js:724-818`. | Reads `ytInitialData`, `__INITIAL_DATA__`, and `window.filterTube` recent browse responses. | Reuses stored page snapshots. Good for import, but also shows why snapshot ownership must be bounded: large roots are retained and reused. | `INSTRUMENT` memory budget |
| Import page expansion | `js/injector.js:833-930`. | Calls `getComputedStyle()`, `getBoundingClientRect()`, programmatically clicks "More" buttons, scrolls page, dispatches `scroll`, sleeps. | This is the highest engagement/performance-risk block in injector. It is acceptable only because subscriptions import is explicit user action; it must never run from passive startup or a spoofed message. | `GATE` import-only + action token |
| Import seed wait loop | `js/injector.js:950-1010`. | Waits up to caller budget, repeatedly expands page seed, sleeps, checks snapshot growth. | Can run for many seconds and keep touching the page. Needs progress/cancel path and one active import at a time. | `GATE` concurrency |
| Subscription entry normalizer | `js/injector.js:1012-1111`. | Converts renderers into whitelist channel entries with id/handle/custom/name/logo. | Good source-specific normalizer; result should include confidence/source fields because imported whitelist entries become future allow rules. | `KEEP` + confidence |
| Debug tracked matches | `js/injector.js:1113-1150`. | Hard-coded tracked terms: Demi/Pitbull/Nyusha. | Useful during QA, but product runtime should not ship personal debug probes unless gated by debug flag. | `REMOVE` or debug-only |
| Response summarizer/logging | `js/injector.js:1163-1237`, logs at `js/injector.js:1280-1292`, `1623-1635`, `1650-1659`. | Summarizes renderer/continuation keys and logs samples/tracked matches. | Good diagnostics, but logging channel samples can leak personal subscriptions into console during normal import. Gate full samples behind debug. | `GATE` privacy log level |
| Subscriptions fetch loop | `js/injector.js:1239-1688`. | Fetches `/youtubei/v1/browse` with `credentials:'include'`, continuations, abort timers, retries alternate profiles. | Explicit feature, but high-cost and account-sensitive. Requires request token, user-visible progress, cancellation, max page/time proof, and no passive access. | `KEEP` + strict gate |
| Expected collaborator matcher | `js/injector.js:1690-1777`. | Builds fuzzy matcher from expected names/handles/count. | Good guard against wrong collaborator lists; should be part of shared identity result contract. | `KEEP` |
| Collaborator response validator/scorer/cache | `js/injector.js:1779-1870`. | Rejects poor lists, scores source quality, caches better lists by video id. | Good quality gate. Cache entries need source/route/timestamp/video identity so stale collaborator data can be explained and expired. | `INSTRUMENT` |
| Main message listener | `js/injector.js:1872-1993`. | Accepts settings, collaborator cache, collaborator lookup, and channel lookup messages. | Single listener mixes four capability classes. The source string check is necessary but not sufficient for a page-visible channel. | `REWRITE` capability schema |
| Settings receiver | `js/injector.js:1881-1898`. | Merges bridge payload into `currentSettings`, updates seed, processes queued data. | This is a second settings authority. Needs background-generated revision, active-work report, and single apply owner. | `REWRITE` |
| Collaborator lookup | `js/injector.js:1913-1961`, snapshot search helper `js/injector.js:3055-3333`. | Searches cache, page snapshots, and DOM hydration candidates, returns response. | Useful no-network lookup, but can deep-scan large roots and DOM. Needs caller reason: explicit menu/action or active strict collaborator rule. | `GATE` |
| Channel lookup | `js/injector.js:1963-1991`, channel search `js/injector.js:2520-3048`. | Searches page snapshots/player response/watch owner by video id and expectations. | Preferable to network, but still large-root traversal. Must return source/confidence and be bounded. | `KEEP` + instrumentation |
| Collaborator data extractor | `js/injector.js:2008-2438`. | Extracts avatar-stack, sheet/dialog/list-view collaborators and owner fallbacks. | Important coverage for collaboration videos, but overlaps with `filter_logic.js` and `content_bridge.js`; the shared extractor contract is missing. | `CONSOLIDATE` |
| Snapshot root list | `js/injector.js:2683-2724`, collaborator roots `js/injector.js:3069-3092`. | Searches `ytInitialData`, stored initial/raw/search/next/browse/player responses and recent arrays. | Powerful, but can retain and traverse many large response roots. Needs memory cap and route scope. | `INSTRUMENT` |
| Deep recursive channel search | `js/injector.js:2813-3048`. | Recurses through many renderer wrappers, matches video id, extracts channel candidates, returns fallback only when target video was matched. | Anchored fallback is a good false-positive guard; still needs max-node/time counters and result confidence. | `KEEP` + counters |
| DOM hydration fallback for collaborators | `js/injector.js:3162-3333`. | Queries `[data-filtertube-video-id]`, wrappers, watch metadata, stamped collaborator attrs, and Polymer data. | This is action-scoped rescue behavior, not a normal page-load scanner. Needs proof the request path is action/active-rule gated. | `GATE` |
| Seed settings update retry | `js/injector.js:3335-3355`. | Calls `window.filterTube.updateSettings()` now or after 300ms. | Duplicate with `bridge_settings.js` direct seed update. Can trigger repeated snapshot reprocessing. | `REWRITE` single settings owner |
| `processDataWithFilterLogic()` | `js/injector.js:3357-3373`. | Calls `FilterTubeEngine.processData(data, currentSettings, dataName)` and returns original on error. | Correct fail-open behavior on exception. Needs timing and mutation/no-op reporting. | `KEEP` + timing |
| Initial data queue | `js/injector.js:3375-3399`. | Processes queued data items after settings + engine are ready. | Queue items are functions with no revision/idempotency marker; stale settings could process old data after a profile switch. | `GATE` revision |
| Seed callback connection | `js/injector.js:3401-3438`. | Assigns `window.filterTube.processFetchResponse` and `processXhrResponse`; retries once after 200ms. | Necessary bridge, but endpoint/no-op classification must be shared with `seed.js` so empty installs avoid full parse/rewrite. | `KEEP` + shared classifier |
| Backup `ytInitialData` hook | `js/injector.js:3440-3500`. | If seed did not define a getter, defines `ytInitialData` setter/getter and queues/processes values. | Fallback is useful, but duplicate ownership can create double processing. Queue is uncapped and lacks settings revision. | `INSTRUMENT` |
| Engine readiness polling | `js/injector.js:3502-3532`. | Polls every 100ms for up to 5s; processes queue, dispatches `filterTubeReady`, posts ready. | Acceptable startup path, but should report duplicate ready/settings cycles and queue length. | `KEEP` + counters |

Injector-specific disease finding:

```text
The injector does not appear to be the source of empty-rule hiding by itself.
Its disease contribution is control-plane breadth:
  - it can run explicit high-cost import work,
  - it can deep-scan retained YouTube snapshots for identity,
  - it can apply settings into seed through a second path,
  - it relies on page-visible postMessage source labels.

Therefore injector fixes should focus on capability tokens, settings revisions,
result confidence, queue caps, and timing counters before changing filtering
semantics.
```

### Bridge Injection Method Ledger - 1

`js/content/bridge_injection.js` is small, but it is a critical runtime entry point: it creates the isolated-world bridge globals and injects MAIN-world scripts. A bug here does not directly hide cards, but it can duplicate settings refreshes, load different script sets per browser, or allow a too-flexible background injection path.

| Method / block | Proof | Reads / writes / sends | Disease-level concern | Verdict |
| --- | --- | --- | --- | --- |
| Shared bridge state | `js/content/bridge_injection.js:11-17`. | Stores `debugSequence`, `scriptsInjected`, `injectionInProgress`, and `injectionPromise` on `globalThis.__filtertubeBridgeState`. | Good idempotency primitive. Needs counters for duplicate inject attempts because ready messages/settings refreshes can repeat across SPA/frame reloads. | `KEEP` + counters |
| Browser API globals | `js/content/bridge_injection.js:19-27`, exports at `js/content/bridge_injection.js:123-127`. | Defines `IS_FIREFOX_BRIDGE`, `browserAPI_BRIDGE`, `currentSettings`, `debugLog`, and `injectMainWorldScripts`. | Shared global names are intentional for later content files, but they are another implicit module contract. | `KEEP` + contract test |
| Debug logger | `js/content/bridge_injection.js:29-34`. | Increments sequence; console output is commented out. | Low runtime cost. Sequence can support future instrumentation. | `KEEP` |
| Background scripting injection | `js/content/bridge_injection.js:36-49`; background handler `js/background.js:4009-4055`. | Sends `action:"injectScripts"` with script names to background. | Caller asks for a known static list, but background currently accepts request-shaped script names. The fix belongs in background allowlist, not this callsite. | `KEEP` callsite, `GATE` background |
| DOM fallback injection | `js/content/bridge_injection.js:51-73`. | Appends `<script src="chrome-extension://.../js/{name}.js">` sequentially with 50ms gaps. | Firefox fallback is necessary, but appended scripts are not removed and ordering differs from Chromium executeScript timing. Needs browser parity fixture. | `KEEP` + Firefox fixture |
| `injectMainWorldScripts()` idempotency | `js/content/bridge_injection.js:75-83`, `119-120`. | Returns existing promise when injected or in progress. | Good protection against concurrent import/ping/startup calls. Need proof that a failed injection clears promise and a successful one never reinjects stale script sets. | `KEEP` + failure test |
| Script set selection | `js/content/bridge_injection.js:84-88`. | Injects `shared/identity`, `filter_logic`, Firefox-only `seed`, then `injector`. | Browser split is important: Chromium manifest loads `seed.js` directly, Firefox injects it here. Needs browser-specific JSON hook timing tests. | `KEEP` + route/browser fixture |
| Post-injection settings request | `js/content/bridge_injection.js:95-103`. | Schedules `requestSettingsFromBackground()` after 100ms if available. | This is one of several settings request triggers (`content_bridge.js:5474-5476`, `5707-5736`, `bridge_settings.js:526-539`). Without revision dedupe it can cause repeated settings delivery and reprocessing. | `INSTRUMENT` then `REWRITE` revision gate |
| Failure path | `js/content/bridge_injection.js:104-116`. | Marks `scriptsInjected=false`, clears promise only on failure, rethrows. | Correct basic behavior; should emit one structured startup failure event so fallback DOM-only mode is explicit. | `INSTRUMENT` |

Bridge injection invariant:

```text
For each tab/frame:
  one script-set request per world,
  one successful MAIN-world runtime version,
  one settings revision applied after runtime ready,
  no request-shaped script names outside the static allowlist,
  browser-specific seed timing covered by fixtures.
```

## Cross-Subsystem Finding - Packaged Asset And CSS Ownership Drift

The active content-page manifests load JavaScript only. However, the repo still packages CSS files that contain broad YouTube default-hide rules. They are not automatically dangerous while inactive, but they are dangerous as undocumented release assets because a future manifest/build edit could activate broad false-hide behavior instantly.

### Manifest And CSS Ownership Ledger - 1

| Asset/path | Proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Chrome/Edge Main-world seed | `manifest.json:25-36`, `manifest.chrome.json:25-36` | Loads `js/seed.js` at `document_start` in `MAIN` world on YouTube and YouTube Kids. | Correct for JSON hooks, but always present even before active enforcement is known. | `KEEP` + endpoint quiet classifier |
| Chrome/Edge isolated stack | `manifest.json:37-59`, `manifest.chrome.json:37-59` | Loads identity/menu/helpers/fallback/block/bridge scripts at `document_start`. | Entire isolated stack starts on every matched YouTube/Kids page; feature lifecycles must prove no-rule quiet behavior internally. | `KEEP` + lifecycle gates |
| Firefox content stack | `manifest.firefox.json:30-49` | Loads isolated stack only; no `world:"MAIN"` seed entry. | Firefox path differs from Chromium/Opera Main-world seed model; parity tests must be browser-specific. | `INSTRUMENT` |
| Opera content stack | `manifest.opera.json:29-61` | Loads `js/seed.js` and isolated stack but no explicit `world` fields. | Browser-world semantics may differ from Chrome; seed/injector readiness tests must include Opera if supported. | `INSTRUMENT` |
| Web-accessible runtime scripts | `manifest.json:61-75`, `manifest.chrome.json:61-75`, `manifest.firefox.json:51-62`, `manifest.opera.json:63-75` | Exposes `js/injector.js`, `js/filter_logic.js`, `js/seed.js`, and identity to matched YouTube/Kids pages. | Necessary for injection, but script ownership/versioning should be explicit because apps copy similar runtime assets. | `KEEP` + asset map |
| Active UI CSS | `html/popup.html:8-11`, `html/tab-view.html:8-11` | UI pages load `design_tokens.css`, `components.css`, `popup/tab-view.css`, and `serene-shell.css`. | UI CSS is scoped to extension pages; lower false-hide risk. | `KEEP` |
| No content CSS injection found | Static search for `insertCSS`, `filter.css`, `content.css`, and `layout.css` found UI links only. | Content pages currently rely on dynamic styles from JS helpers such as `dom_helpers.js` and quick-block/menu style injectors. | Good if intentional; must be documented so old default-hide CSS is not accidentally reattached. | `INSTRUMENT` |
| `css/filter.css` default hide | `css/filter.css:8-35` | Broadly hides many YouTube renderer tags unless `.filter-tube-visible` is applied. | If activated, empty/no-rule sessions would hide content by default until every visible card is explicitly revealed. | `QUARANTINE` unless proven active |
| `css/content.css` fallback hide | `css/content.css:8-36`, `css/content.css:72-89` | Same default-hide model plus child-image hiding for non-visible lockups. | Same false-hide risk, plus child image rules can make partial cards look broken. | `QUARANTINE` unless proven active |
| `css/layout.css` aggressive default-hide sections | `css/layout.css:509-683`, `css/layout.css:604-631`, `css/layout.css:737-803` | Uses `:not(.filter-tube-visible)`, `:has(...)`, zero dimensions, absolute positioning, `clip`, and image hiding for Shorts/Mix/Playlist cases. | This is too broad to be loaded globally; it assumes a reveal-class renderer model that the current JS runtime does not universally own. | `QUARANTINE` |

Packaged asset policy target:

```text
assetManifest = {
  path,
  loadedBy: ["manifest", "html", "runtime-injection", "web-accessible-only", "unused"],
  surface: ["content-page", "popup", "tab-view", "background", "build-only"],
  riskClass: ["safe-ui", "runtime", "legacy-default-hide", "vendor", "orphan"],
  owner,
  activationTests
}

Content-page CSS rule:
  no shipped stylesheet may default-hide YouTube renderer tags with :not(.filter-tube-visible)
  unless the same release has tests proving every non-matching card is revealed before paint.
```

## Cross-Subsystem Finding - Hide Writer Source Of Truth

FilterTube currently has one central hide helper, plus several direct `display:none` and marker writers inside DOM fallback. This is manageable only if every hide reason is explicit and every writer has a matching restorer.

### DOM Hide Helper Ledger

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Central CSS | `js/content/dom_helpers.js:11-56` | Injects `.filtertube-hidden`, `.filtertube-hidden-shelf`, and pending metadata shimmer styles. | Good central CSS, but global class use requires all writers/restorers to agree on ownership. | `KEEP` |
| Central toggle | `js/content/dom_helpers.js:67-149` | Adds/removes `.filtertube-hidden`, `data-filtertube-hidden`, inline `display:none`, stats, and media pause/resume hook. | Boolean-only API loses structured reason; hide reasons are text strings, not machine-verifiable rule sources. | `REWRITE` result object |
| Container cleanup | `js/content/dom_helpers.js:154-205` | Hides shelves when all children are hidden. | Correct cleanup, but can hide parent shells if child visibility markers drift. | `INSTRUMENT` |
| Direct members-only hide | `js/content/dom_fallback.js:2172-2250` | Directly writes `display:none`, `data-filtertube-hidden`, and `data-filtertube-members-only-hidden`. | Bypasses `toggleVisibility()` stats/reason path; restore only removes members-only markers when toggle path runs. | `CONSOLIDATE` |
| Direct playlist hide | `js/content/dom_fallback.js:2253-2277` | Directly hides collection stack lockups and parent shelves. | Bypasses central reason/stats helper; direct shelf markers can combine with generic hidden markers. | `CONSOLIDATE` |
| Direct Mix chip hide | `js/content/dom_fallback.js:2280-2299` | Directly hides/restores `yt-chip-cloud-chip-renderer` for Mixes. | Overlaps later chip filtering path `js/content/dom_fallback.js:3980-4000`. | `CONSOLIDATE` |
| Disabled cleanup | `js/content/dom_fallback.js:2304-2323` | Clears generic hidden/pending markers when extension disabled. | Good broad cleanup, but direct feature-specific markers need full inventory. | `INSTRUMENT` |
| Main card hide | `js/content/dom_fallback.js:3929-3936` | Applies final card hide decision and stores processed id/mode. | Central card path, but decision is boolean from multiple sources and not attached as structured reason. | `REWRITE` reason object |
| Shorts card hide | `js/content/dom_fallback.js:4281-4294` | Independently calls `shouldHideContent()` and `toggleVisibility()`. | Duplicates main card hide path and can diverge in future route changes. | `CONSOLIDATE` |
| Shelf/title cleanup | `js/content/dom_fallback.js:4311-4385` | Hides shelves by title or empty visible children. | Valid fallback surface, but must not run in no-rule blocklist mode after central active report says no work. | `GATE` |
| Duplicate whitelist home item | `js/content/dom_fallback.js:4399-4423` | In whitelist Home only, hides duplicate video IDs as container cleanup. | Good layout cleanup, but should be marked as layout cleanup not filtering. | `KEEP` + reason |

Target hide API:

```text
hideElement(element, {
  source: "json" | "dom" | "ui-action" | "layout-cleanup",
  ruleType: "channel" | "keyword" | "content" | "category" | "shorts" | "whitelist" | "shelf" | "none",
  ruleId,
  identityConfidence,
  route,
  reversibleBy,
  countStats: boolean
})
```

This would let us answer "why was this card hidden?" from the DOM itself, instead of reconstructing it from several scattered attributes.

### DOM Fallback Decision Ledger

| Path | Proof | Behavior | Risk | Verdict |
| --- | --- | --- | --- | --- |
| Active-work gate | `js/content/dom_fallback.js:1933-1999` | Whitelist always active; blocklist active with lists, booleans, content filters, or category flag. | Category/content enabled-empty values can wake fallback. Whitelist active is semantically correct but expensive. | `REWRITE` via central report |
| No-active cleanup | `js/content/dom_fallback.js:2075-2088` | If no active work, periodically clears stale visibility and returns. | Good protection, but the body observer/menu/quick-block layers can still call into this path repeatedly. | `KEEP` + upstream gate |
| Scroll listener | `js/content/dom_fallback.js:2098-2110` | Installs scroll listener only once after active fallback work starts. | Better than always-on; still needs active-report lifecycle for route changes. | `KEEP` |
| `/feed/channels` fail-open | `js/content/dom_fallback.js:2127-2137`, `js/content/dom_fallback.js:4580-4583` | Clears/avoids hides on subscriptions import route. | Correct for import, must be fixture-protected. | `KEEP` |
| Watch metadata whitelist restore | `js/content/dom_fallback.js:2141-2167` | In whitelist mode, force-restores watch metadata/actions/owner/description. | This is a repair path for over-hide. It proves earlier paths can hide too broadly on SPA swaps. | `INSTRUMENT` |
| Video meta fetch scheduling | `js/content/dom_fallback.js:2487-2491`, `js/content/dom_fallback.js:3312-3316`, `js/content/dom_fallback.js:3528-3539` | Category/upload/duration filters can request video metadata from cards. | Must be route-scoped and active-rule-scoped; otherwise content filters become a fetch amplifier. | `GATE` |
| Processed-card cache | `js/content/dom_fallback.js:2504-2655` | Skips processed cards unless id/mode/content/identity state changed. | Good performance idea, but hidden state restore depends on markers being accurate. | `KEEP` + reason markers |
| Playlist click guard | `js/content/dom_fallback.js:2337-2441` | Installs click and ended listeners during fallback; can pause video and synthetic-click next/target link. | Side-effect-sensitive path. Should only be installed when playlist enforcement is active. | `GATE` |
| Selected playlist skip | `js/content/dom_fallback.js:3786-3827`, `js/content/dom_fallback.js:4462-4518` | Avoids hiding selected row unless explicitly blocked, then can click next allowed item. | Important UX but high side-effect risk and possible recommendation/playback interaction. | `INSTRUMENT` |
| Whitelist unresolved identity | `js/content/dom_fallback.js:4587-4593`, `js/content/dom_fallback.js:4662-4693` | Fails closed for Kids/Shorts/unresolved identity in whitelist except creator-page allow. | Correct strict whitelist semantics, but dangerous if mode drift enters whitelist accidentally. | `KEEP` + mode transition warning |
| Whitelist empty allow rules | `js/content/dom_fallback.js:4596-4603` | Hides all non-comment cards when no whitelist channel/keyword rules exist. | Intentional strict mode. Must be impossible to enter silently via import/sync/migration. | `KEEP` + UX gate |
| Blocklist keyword match | `js/content/dom_fallback.js:4715-4723` | Matches title or channel text. | Good fallback; needs reason payload for exact matched text and rule. | `INSTRUMENT` |
| Blocklist playlist name fallback | `js/content/dom_fallback.js:4725-4735` | If playlist row lacks identity, can block by normalized channel name. | Potential false positive if byline is ambiguous. Needs confidence class and eventual UC-backed map. | `GATE` by confidence |
| Blocklist channel/collab match | `js/content/dom_fallback.js:4737-4753` | Matches primary channel or collaborators against compiled channel index. | Correct feature; needs same identity confidence model as JSON. | `KEEP` + fixture |
| Active handle resolution | `js/content/dom_fallback.js:4755-4805` | For UC-only cards and unresolved handle filters, rate-limits background-only handle resolution. | Good no-page-fetch guard (`skipNetwork`, `backgroundOnly`), but still a side-effect path from DOM fallback. | `INSTRUMENT` |

DOM fallback should remain as the resilience layer, but the future target is:

```text
JSON first decides most video/comment/channel renderers.
DOM fallback handles:
  - surfaces not present in JSON,
  - late-rendered SPA cards,
  - UI affordances,
  - repair/cleanup.
DOM fallback should not be the primary engine on an empty install.
```

### JSON/DOM Decision Gate Ledger

The JSON engine and DOM fallback have similar semantics, but they do not share one decision object. This is a root cause for "why did this card hide?" being hard to answer.

| Decision area | JSON proof | DOM proof | Current behavior | Risk | Verdict |
| --- | --- | --- | --- | --- | --- |
| Blocklist active work | `js/filter_logic.js:2038-2074`, `js/filter_logic.js:2110-2121` | `js/content/dom_fallback.js:1933-1999`, `js/content/dom_fallback.js:4715-4814` | Both engines only block with non-empty lists/content controls/category, but active-state validation is duplicated. | One engine can wake while the other no-ops, especially enabled-empty category/content controls. | `REWRITE` central active report |
| Whitelist empty rules | `js/filter_logic.js:1960-1967` | `js/content/dom_fallback.js:4596-4603` | Both engines fail closed when whitelist mode has no allow rules. | Semantically correct only when the user intentionally selected whitelist; dangerous if migration/import/sync accidentally flips mode. | `KEEP` + transition warning |
| Whitelist no match | `js/filter_logic.js:2028-2035` | `js/content/dom_fallback.js:4699-4700` | Both engines hide non-comment content when no whitelist rule matches. | Correct strict mode, but reason is not attached to the renderer/card as structured metadata. | `INSTRUMENT` |
| Whitelist unresolved identity | `js/filter_logic.js:2001-2025` | `js/content/dom_fallback.js:4662-4693` | Both can fail closed for unresolved identity, with creator-page exceptions. | Good leak prevention; can look like false hiding when identity extraction is incomplete. | `KEEP` + evidence badge/log |
| Channel identity extraction cost | `js/filter_logic.js:1706-1719`, `js/filter_logic.js:1846-1850` | `js/content/dom_fallback.js:3394-3468`, `js/content/dom_fallback.js:4725-4814` | JSON avoids channel extraction unless channel policy exists; DOM has several fallback/meta-map repair paths. | DOM path can do extra work even when JSON had enough authoritative data. | `CONSOLIDATE` |
| Category metadata pending | `js/filter_logic.js:2126-2173` | `js/content/dom_fallback.js:2465-2501` | Missing category metadata schedules a fetch and usually does not hide yet. | Enabled-empty category is active but no-op; allow mode can create pending hides while metadata arrives. | `REWRITE` validated active state |
| Action-driven identity fetch | `js/content_bridge.js:11778-11792`, `js/content_bridge.js:12167-12224`, `js/background.js:5454-5485` | `js/content/dom_fallback.js:4755-4805` | User-click paths may resolve `watch:`/`shorts:` identifiers; DOM fallback can request background-only handle resolution. | User-click resolver is fine; passive resolver needs explicit side-effect budget and metrics. | `KEEP` action, `INSTRUMENT` passive |

Decision object target:

```text
evaluateContent(candidate, settings) -> {
  action: "hide" | "show" | "pending" | "ignore",
  mode: "blocklist" | "whitelist",
  engine: "json" | "dom",
  matchedRule: { type, value, id },
  reasonCode,
  identity: { id, handle, customUrl, confidence, source },
  pendingFetch: "none" | "category" | "uploadDate" | "handleMap" | "watchOwner",
  sideEffectAllowed: boolean
}
```

Without this, optimizing one path can accidentally change another path's hide/restore semantics.

## Cross-Subsystem Finding - Interaction Side-Effect Budget

The user review about YouTube recommendation drift cannot be proven from static code alone, but there are enough direct interaction and fetch paths to treat it as a product risk class.

### Direct Interaction Paths

| Path | Proof | Classification | Verdict |
| --- | --- | --- | --- |
| Quick block button click | `js/content/block_channel.js:1406-1412` | Suppresses propagation before FilterTube action. | `KEEP` |
| Injected 3-dot menu click | `js/content_bridge.js:10854-10891`, `js/content_bridge.js:11303-11316` | Suppresses propagation for menu command and toggle. | `KEEP` |
| Playlist selected-row guard | `js/content/dom_fallback.js:2384-2396` | Prevents native click, pauses video, then synthetic-clicks a link. | `INSTRUMENT` |
| Playlist ended guard | `js/content/dom_fallback.js:2434` | Synthetic-clicks next button. | `INSTRUMENT` |
| Collapsed playlist opener | `js/content/dom_fallback.js:762-777` | Clicks a collapsed playlist entry point to expose rows. | `INSTRUMENT` |
| Current blocked watch skip | `js/content/dom_fallback.js:871-918` | Pauses current video, clicks next allowed playlist target or YouTube next button. | `INSTRUMENT` + `GATE` |
| Hidden selected playlist skip | `js/content/dom_fallback.js:3795-3823` | If selected playlist row is hidden, synthetic-clicks next button after a throttle. | `INSTRUMENT` |
| Watch playlist repair skip | `js/content/dom_fallback.js:4462-4512` | Pauses/reset current video and clicks next visible playlist target. | `INSTRUMENT` |
| Broad DOM media actions | `js/content/dom_fallback.js:822`, `js/content/dom_fallback.js:866`, `js/content_bridge.js:3749` | Pauses media under some filter states. | `INSTRUMENT` |

### Network Identity Paths

| Path | Proof | Classification | Verdict |
| --- | --- | --- | --- |
| Already-requested JSON | `js/seed.js:633-785`, `js/filter_logic.js:1846-1882` | Lowest side-effect path. | `KEEP` |
| Content watch fetch | `js/content_bridge.js:8272` | Extra page request from YouTube origin context. | `GATE` |
| Content Shorts fetch | `js/content_bridge.js:8123` | Extra page request from YouTube origin context. | `GATE` |
| Background Shorts fetch | `js/background.js:2889-2893` | Extra extension-origin request. | `INSTRUMENT` |
| Background Kids watch fetch | `js/background.js:3005-3009` | Extra extension-origin request. | `INSTRUMENT` |
| Background YouTube watch fetch | `js/background.js:3098-3102` | Extra extension-origin request. | `INSTRUMENT` |
| Background channel fetch | `js/background.js:4617-4620`, `js/background.js:4784-4791` | Extra channel page request. | `INSTRUMENT` |
| Content handle resolver fetch | `js/content/handle_resolver.js:237-244` | Extra content-context page request. | `GATE` |

Side-effect budget rule:

```text
If JSON already provides a UC channel ID or a fresh videoId->channelId map,
do not fetch watch/shorts/channel pages for identity.

If the user explicitly clicks "block/allow this channel",
identity fetch can run as an action resolver.

If the page is in no-rule blocklist mode,
identity fetch should not run.
```

## Subsystem Audit Checklist

### A. Loading And Settings

- [x] Manifests load model recorded.
- [x] Default state snapshot recorded.
- [x] Background compiled settings initial ledger.
- [x] Cross-world message/event ledger initial map.
- [x] Quiet-mode contract initial proof.
- [x] Profile/Kids/Main selection flow diagram.
- [x] Sync/import/export influence initial risks recorded.
- [x] Import/export/Nanah state shape initial map.
- [x] Import/sync mode activation risk table.
- [x] Complete active-state key list with valid inner-rule checks.
- [x] Settings key contract drift initial proof.
- [x] `js/settings_shared.js` key-contract ledger completed for storage keys, V4 aliases, shared compiled payload gaps, load-write side effects, and background compiler comparison.
- [x] Background message mutation/provenance initial table.
- [x] Background action/storage mutation schema integrated from peer-agent deep pass.
- [x] Main-world / isolated-world bridge message trust ledger initial pass.
- [x] `js/injector.js` method-family ledger completed for subscription import, import page expansion, collaborator/channel lookup, seed relay, backup `ytInitialData` hook, queueing, and engine readiness polling.
- [x] `js/content/bridge_injection.js` method-family ledger completed for shared bridge globals, scripting fallback, static script set selection, post-injection settings request, and startup failure handling.
- [x] Runtime settings authority/list-mode transition drift recorded.
- [x] Background compiled settings cache writer and invalidation gap deep pass recorded.
- [x] Background authority method ledger recorded for compile purity, UI-pushed settings, map/cache writers, list-mode transfer, channel add/toggle, and fetch gates.
- [x] UI/state mutation authority deep pass recorded.
- [x] StateManager/settings_shared mutation ledger recorded for V3/V4 migration loss, concurrent save drops, derived keyword persistence, validation gaps, and broadcast authority drift.
- [x] `js/state_manager.js` method-family ledger completed for load, enrichment, Main/Kids keyword/channel APIs, subscriptions import, content/category filters, direct profile persistence, refresh/broadcast, and storage listener behavior.
- [x] IO/import/export/Nanah mutation ledger recorded for multi-write imports, direct V4 saves, trusted-state restore, and scoped sync semantics.
- [x] Security/PIN/encryption boundary ledger recorded for local profile locks, backup encryption, session PIN cache, import auth, and direct profile security writes.
- [x] IO/Nanah/security deep pass recorded for profile migration writes, multi-layer import commits, full-replace active-profile changes, scoped Nanah apply, trusted Nanah state restore, and pure crypto boundaries.

### B. JSON/XHR Engine

- [x] Fetch/XHR endpoint family identified.
- [x] Empty blocklist skip logic located.
- [x] `ytInitialData` and `ytInitialPlayerResponse` hook initial audit.
- [x] Seed startup/replay/no-op replacement initial audit.
- [x] `js/seed.js` method-family ledger completed for hooks, fetch/XHR, pending queue, skip classifier, and settings reprocess.
- [x] `js/seed.js` endpoint decision ledger completed for search, browse, next, player, guide, initial globals, and settings replay contracts.
- [x] Hidden seed startup costs recorded: debug-argument stringify, no-rule fetch parse/rebuild, harvest-only side effects, and settings reprocess loops.
- [x] Seed JSON/XHR active-report pass recorded for pass-through, harvest-only, mutation, and queue-until-settings endpoint decisions.
- [x] Seed endpoint current-behavior pass recorded for empty/no-rule search, browse, mobile home, watch next, player, guide, no-settings queue, XHR parity, and settings reprocess paths.
- [x] Active predicate divergence pass recorded for category/content filters, popup quick toggles, compiler pass-through, and raw-vs-compiled runtime active state.
- [x] `FilterTubeEngine.processData()` recursion initial audit.
- [x] Renderer coverage matrix initial gaps from `docs/json_paths_encyclopedia.md`.
- [x] `js/filter_logic.js` method-family ledger completed for renderer rules, harvest, candidate building, decision branches, and recursive mutation.
- [x] `js/filter_logic.js` renderer gaps cross-checked against `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`.
- [x] Renderer fixture inventory pass recorded with JSON-first, partial, nested-only, structural, UI-only, metadata-only, and missing classifications.
- [x] Renderer fixture deepening pass recorded for concrete high-risk fixture names, documented JSON paths, expected candidates, and decision assertions.
- [x] End-screen/autoplay/player overlay JSON path initial proof.
- [x] Comments/Shorts/watch/search/home route-specific contracts with test vectors drafted.
- [ ] Executable JSON fixture harness exists and runs those contracts.

### C. DOM Fallback And Layout

- [x] Active-work gate located.
- [x] Body mutation observer located.
- [x] Fallback menu scanner located.
- [x] Every `toggleVisibility()` call mapped at group level.
- [x] DOM hide side-effect pass recorded for central writer, direct pending/optimistic hides, container repair, stale cleanup, stats, and media pause coupling.
- [x] Initial `filtertube-hidden` writer/restorer risk map.
- [x] Hide/stats/playback side-effect boundary ledger.
- [x] CSS global hiding/layout repair initial map.
- [x] DOM inventory gap table initial entries.
- [x] DOM extractor confidence and stale-card cleanup ledger.
- [x] `js/content/dom_fallback.js` method-family ledger completed for active gate, card scan, content controls, playlist side effects, pending metadata, and direct hide writers.
- [x] `js/content/dom_extractors.js` and `js/content/dom_helpers.js` method-family ledger completed for selector breadth, identity confidence, cache mutation, stale cleanup, central hide, stats, and playback side effects.
- [x] DOM direct-hide/restore asymmetry recorded for playlist lockups, open-app buttons, mix chips, members-only fallbacks, and stale cleanup vocabulary.
- [x] `js/layout.js` legacy layout repair ledger recorded; current manifests do not load it, and broad `:not(.filter-tube-visible)` hiding is quarantined as a false-hide regression source.

### D. Quick Block, 3-Dot, Fallback Menu

- [x] Quick-block observer startup located.
- [x] Quick-block event suppression located.
- [x] Fallback menu scanner located.
- [x] Native dropdown observer audit.
- [x] Fallback menu action/lifecycle split recorded.
- [x] `js/content/block_channel.js` quick-block and menu lifecycle ledger recorded for startup, listeners, observers, intervals, final gates, Kids passive block handling, and no-rule affordance cost.
- [x] Channel/post/comment/playlist initial action path table.
- [x] Immediate hide rollback/confirm path initial audit.
- [x] Duplicated metadata builder consolidation candidates.
- [x] Collaboration dialog observer and trigger listener initial audit.
- [x] Collaboration lifecycle ledger expanded for trigger listeners, document observer, pending queues, main-world collaborator retries, resolved writeback, and DOM fallback wakeups.
- [x] Observer/listener/timer density snapshot for hot content files.
- [x] `content_bridge.js` method-family ledger started.
- [x] `content_bridge.js:3-1813` method detail ledger completed.
- [x] `content_bridge.js:1814-4945` method detail ledger completed.
- [x] `content_bridge.js:4946-5716` method detail ledger completed.
- [x] `content_bridge.js:5717-6057` method detail ledger completed.
- [x] `content_bridge.js:6058-6625` method detail ledger completed.
- [x] `content_bridge.js:6626-7350` method detail ledger completed.
- [x] `content_bridge.js:7351-8560` method detail ledger completed.
- [x] `content_bridge.js:8561-10089` method detail ledger completed.
- [x] `content_bridge.js:10090-11341` method detail ledger completed.
- [x] `content_bridge.js:11342-12985` method detail ledger completed.
- [x] Small content bootstrap/settings-delivery ledger recorded for main-world injection, pushed settings, seed retry, storage refresh keys, subscription import bridge, prompts, and menu style semantics.
- [x] Runtime active report design audit recorded for JSON mutation, DOM fallback, fallback menu, quick block, prefetch, metadata fetch, and passive map-write work classes.

### E. Identity And Background Fetches

- [x] `FilterTubeIdentity` method table.
- [x] `handle_resolver.js` method table.
- [x] `handle_resolver.js` side-effect contract expanded for currentSettings mutation, map-first lookup, background/content fetch branches, cache sentinel, global map message, and forced DOM fallback rerun.
- [x] Content-side watch/shorts direct fetch initial table.
- [x] Background resolver/fetch table with exact line ranges.
- [x] Background action registry completeness pass recorded for release prompts, first-run prompts, PIN actions, list transitions, identity fetches, script injection, map writes, stats, and content-side action receivers.
- [x] Background action latest pass recorded for the two message listeners, read-looking compile actions, mode transitions, identity fetches, learned map writes, script injection, caller-pushed settings, and shared channel-add transaction phases.
- [x] Channel map/video map persistence and staleness policy.
- [x] Passive map learning versus DOM reprocess side-effect ledger.
- [x] Engagement-risk classification for initial fetch/click/dispatch paths.
- [x] Main-world subscription import bridge and fetch-loop initial audit.

### F. UI, Docs, Build, Website

- [x] Extension dashboard/filter UI can create every settings state intentionally.
- [x] Empty whitelist and empty category-filter UX initial review.
- [x] Nanah sync and profile transfer docs align with actual settings shape at architecture level; public README/FUNCTIONALITY privacy copy still needs rewrite.
- [x] Runtime copy/sync into native apps initial drift risk recorded.
- [x] Website/privacy/download claims initial drift risk recorded.
- [x] Release script and artifact flow initial drift risk recorded.
- [x] Render engine and shared UI component mutation risks recorded.
- [x] Content-control catalog, shared settings compiler, and render engine method-family ledger completed for defaults, active-cost drift, mode-visible lists, and Filter All semantics.
- [x] Popup/tab-view UI mutation ledger recorded for surface targeting, incomplete content/category rule activation, managed-child save ownership, and future dual-list prerequisites.
- [x] Canonical UI mutation intent pass recorded for profile switches, list-mode transitions, keyword/channel rules, content/category filters, imports, Nanah sync, learned identity maps, and content quick actions.
- [x] Popup-focused mutation ledger recorded for active-tab target inference, compact content-filter enabled-only writes, profile switching, PIN notification, and popup-only display filtering scope.
- [x] Tab-view/render-engine UI-state ledger expanded for enabled-empty category filters, stale video thresholds, active-list-only rendering, index-based row mutation, Kids-to-Main display merge, and dual-list migration invariants.
- [x] Legacy layout script and renderer-inventory dependency drift recorded: `docs/youtube_renderer_inventory.md` cannot count `js/layout.js` as active coverage.
- [x] First-run/release-notes prompt behavior recorded.
- [x] Manifest/CSS/release-packaging surface ledger recorded.
- [x] Manifest and packaged CSS ownership ledger recorded for active JS load order, UI CSS, inactive default-hide CSS, and quarantine policy.
- [x] Automated symbol/lifecycle inventory recorded for current runtime/UI/build JavaScript files, including function counts, observer/timer/message/fetch/hide/click density, hot-file interpretation, and fixture coverage reconciliation.
- [x] Generated function-to-family coverage artifact recorded at `docs/audit/FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md` for 788 lexical functions/helpers in the hot runtime stack.
- [x] Build/vendor/release reproducibility ledger recorded for UI bundles, Nanah vendor source, mobile artifacts, GitHub release upload order, and native runtime sync boundary.
- [x] Build/release script method ledger recorded for version authority, generated UI freshness, mobile artifact pairing, Nanah commit stamping, draft-first releases, and app sync reporting.
- [x] Native runtime copy audit recorded for public/private sync scripts, runtime bundle order, Android/iOS runtime hashes, iOS Kids string patches, Android WebView scaling, app runtime size, and sync-report requirements.
- [x] Repo-wide tracked-file reconciliation added: all 149 tracked paths are now directly classified as runtime, website, docs, assets, config, or release/sync surfaces.
- [x] CSS hide ownership deep pass recorded for default-hide files, `.filter-tube-visible` drift, active UI CSS scope, and JS hide vocabulary mismatch.
- [x] Executable fixture gap ledger recorded; no project-owned test/fixture harness exists yet, and first required matrices are specified.
- [x] Accepted invariant fixture plan recorded for empty-install quietness, explicit whitelist transitions, channel identity confidence, JSON renderer coverage, and background runtime authority.
- [x] Executable fixture harness design pass recorded for Node test structure, VM/fake-window script loading, seed endpoint simulation, audit counters, and first fixture groups.
- [x] Runnable fixture implementation plan recorded for package scripts, harness files, first fixtures, phase order, counter baseline, behavior gates, mutation authority, renderer precision, release claims, and native sync reporting.
- [x] UI component/html/shell asset ledger recorded for optimistic toggles, custom dropdown lifecycle cleanup, trusted HTML-string helper contracts, legacy layout repair quarantine, release-version drift, and extension UI network/media budgets.
- [x] Shared identity/content helper ledger recorded for canonical identity helper strength, weak name-match confidence risk, handle resolver network/map side effects, and structured hide/match reason requirements.
- [x] Identity match confidence pass recorded for UC ID, handle, custom URL, channelMap, name-only, stable-entry name fallback, DOM/JSON matcher divergence, and future reason-object policy.
- [x] Docs-to-runtime claim table exists for every public or architecture document family: README, functionality docs, privacy page, downloads page, dashboard app cards, release notes, Android distribution docs, app sync docs, platform pages, terms page, renderer inventories, and native runtime sync docs.
- [ ] Website release/privacy/download claim checks are executable in CI.

### G. Peer-Critique Convergence

- [x] JSON/XHR cold-load fail-open risk recorded.
- [x] Category/video-meta classification risk recorded.
- [x] Background action schema and caller intent drift recorded.
- [x] Main-world injector authority ledger recorded for settings delivery, seed update, subscription import, collaborator/channel lookup, and backup data hook ownership.
- [x] DOM hide writer/restore asymmetry recorded.
- [x] UI target/copy intent drift recorded.
- [x] Legacy/V4 migration whitelist-drop risk recorded.
- [x] Seed/filter JSON engine cold-load, response replacement, and renderer coverage risks recorded.
- [x] MAIN-world settings mutability and duplicate settings delivery risks recorded.
- [x] Content-script load order and boot lifecycle risks recorded.
- [x] Fallback menu affordance-gate bypass risk recorded.
- [x] JSON/DOM decision gate divergence risk recorded.
- [x] Peer-agent JSON hook critique integrated: fetch path parses/stringifies matching `/youtubei/v1/*` responses before no-rule skip wins, unlike XHR startup path.
- [x] Peer-agent renderer critique integrated: `compactPlaylistRenderer`, modern Shorts/reel channel identity, collaborator `showSheetCommand`, top-level community post renderers, and search refinement surfaces need fixture-backed contracts.
- [x] Peer-agent authority critique integrated: MAIN-world `window.filterTube.updateSettings` and settings `postMessage` payload source strings are not a trusted boundary.
- [x] Peer-agent storage/state critique integrated: concurrent StateManager saves, V3->V4 whitelist migration, copyBlocklist ignore, and enabled invalid filters are all fixture priorities.
- [x] Peer-agent full batch integrated: no-settings queue caps, duplicate seed settings apply, fetch/XHR replay limits, UI mode-intent drift, background compiler impurity, renderer path gaps, and empty-runtime lifecycle gates.
- [ ] Source-level fixes designed and approved.
- [ ] Regression harness written for each accepted invariant.

## Converged Disease Map

The peer critique and local audit now converge on these root classes:

| Root class | Symptom examples | Primary proof sections | Fix direction |
| --- | --- | --- | --- |
| Runtime active-state is not centralized | Empty install still feels heavy; enabled-empty category wakes work. | Active-state ledger, Seed startup, DOM active gate, Category risk. | One `hasActiveEnforcement(settings)` report shared by seed, DOM, menu, quick-block, and apps. |
| Mutations have multiple owners | Copy flag ignored; UI mode changes differ by popup/tab/import/Nanah; block and whitelist paths diverge. | Background action schema, Caller intent drift, UI intent drift, Import/Nanah risks. | One canonical profile mutation API with transition reports and legacy mirrors derived from V4. |
| Background action surface is untyped | Read-looking actions can write storage; add-channel paths differ; map/stat/script-injection actions lack one sender/write/fetch contract. | Background action schema deep pass, background message mutation audit. | Typed background action schema with sender classes, storage-key declarations, network permissions, cache policy, and transition reports. |
| UI writes runtime truth | StateManager can save, compile, rebroadcast settings, write maps directly, and import/sync modes while background also owns compilation. | UI/state mutation authority ledger, runtime settings authority drift. | UI emits typed mutation requests; background performs writes, compiles runtime payloads, and returns revisions/reports. |
| Runtime settings authority is split | UI/shared compile can broadcast blocklist-shaped settings while background profile compile owns whitelist/list mode. | Runtime settings authority drift. | Background-only runtime compilation; UI save returns authoritative compiled payload. |
| Filtering decisions are boolean, not auditable | False-hide reports are hard to prove; stats depend on timing; DOM/JSON disagree. | JSON decision function, DOM hide writer ledger, extractor confidence ledger. | Return structured decisions with reason, source, confidence, matched rule, and writer id. |
| DOM affordance lifecycle is always-on | Quick cross/menu/prefetch observers run even when the visible feature is disabled or covered by native UI. | Content bridge lifecycle, quick-block lifecycle, native/fallback menu audit. | Owned lifecycle per affordance with install, pause, resume, teardown, and counters. |
| Hide effects are bundled | Visual hide, local stats, media pause, and synthetic playlist skip can be triggered from adjacent code paths without one effect contract. | Hide/stats/playback ledger, interaction side-effect budget. | `evaluateContent()` + `applyDecision()` split with explicit side-effect flags. |
| UI affordance gates are inconsistent | Primary 3-dot injection honors whitelist and `showBlockMenuItem:false`, but fallback button/popover creation does not prove the same gate before installing or rendering. | Fallback menu action path ledger. | Shared `canShowBlockAffordance(settings, surface)` predicate used before observer install, button render, and action execution. |
| Early JSON delivery and async metadata fail open | Active rules can miss cold fetch/XHR; category filters depend on later metadata. | JSON/XHR cold-load risk, XHR equivalence risk, category/video-meta risk. | Endpoint-specific startup state and pending-classification policy. |
| Restore paths are not symmetric | Recycled cards can stay hidden; direct playlist hides can lack local restore. | DOM hide writer/restore ledger, DOM extractor stale cleanup ledger. | Single hide/restore primitive and stale cleanup helper. |
| Compiled settings contract is split | UI/shared/background/content disagree on keys, emitted payload, invalidation, and cache authority. | Compiled settings purity ledger, shared settings compiler drift, peer-review key-contract findings. | One generated settings key schema and background-only runtime compilation. |
| Passive learning is coupled to enforcement | Scrolling or JSON harvest can stamp identity, persist maps, mutate `currentSettings`, and rerun DOM fallback even when no user rule needs it. | Passive map learning ledger, content bridge lifecycle, interaction side-effect budget. | Separate learned identity/media stores from active filter runtime; rerun DOM only when a learned fact can affect an active rule. |
| Cache invalidation is hand-maintained | Background invalidates fewer keys than the compiler reads, while content watches a broader local list. | Background invalidation gap ledger. | Generate invalidation keys from compiler dependencies and derive content refresh policy from the same schema. |
| Bridge trust boundaries are implicit | Map/meta/collaboration/subscription messages can bypass the background action schema. | Main-world / isolated-world bridge message ledger. | Per-message source allowlists, payload schemas, request correlation, and background-routed persistent writes. |
| JSON interception is too eager and too generic | Empty install parses/replaces network responses; `/player` is recursively filtered; fetch/XHR/settings timing differ. | JSON-first seed and engine ledger, peer critique, no-op passthrough requirement. | Endpoint classifier with parse/harvest/mutate decisions before response replacement. |
| Renderer coverage is documented but not contractual | `compactPlaylistRenderer`, `searchRefinementCardRenderer`, `compactChannelRenderer`, Shorts identity, collaborator sheet, and post renderers are documented but incomplete in runtime. | JSON renderer coverage ledger, renderer inventory, JSON path encyclopedia. | Convert documentation into fixture-backed renderer contracts. |
| Packaged assets are not classified | Legacy CSS files with default-hide renderer selectors are copied into releases but not currently manifest-loaded; future changes could activate broad false-hide rules. | Manifest/CSS/release-packaging ledger. | Classify each packaged asset as active, injectable, UI-only, or legacy/orphan; forbid default-hide renderer CSS. |
| Legacy layout repair encodes old assumptions | `js/layout.js` is not currently manifest-loaded, but it can hide every renderer lacking `.filter-tube-visible` and the renderer inventory still cites it as coverage. | Legacy Layout Repair Ledger. | Keep quarantined; replace layout-only coverage claims with JSON/DOM fixture coverage and never infer hide from missing visible markers. |

## Peer-Agent Convergence Addendum - 2026-05-17

Six read-only critic passes were compared against this ledger. The following items are additive or sharpen existing findings.

| Agent theme | New / sharpened finding | Proof | Required fixture |
| --- | --- | --- | --- |
| Empty-install performance | Fetch hook still clones/parses/stringifies matching `/youtubei/v1/*` before no-rule skip returns original data; XHR exits earlier when settings are missing. | `js/seed.js:624-680`, `js/seed.js:748-755`, `js/seed.js:267-333`, `js/seed.js:675-676`, `js/seed.js:779-784`. | Empty install with all rules/affordances off: assert no JSON parse/stringify/replacement for no-op endpoints unless explicit harvest mode is enabled. |
| Route scoping | Seed skip logic uses `document.location.pathname`, while response processing passes only endpoint-ish `dataName`. SPA navigation can make route decisions use the path at response completion, not the path that initiated the request. | `js/seed.js:197-205`, `js/seed.js:261-333`, `js/seed.js:675`, `js/seed.js:779-780`. | Start search/watch fetch, navigate before resolve, assert decision uses request/response scope. |
| MAIN-world trust | Page-visible `window.filterTube.updateSettings()` and `window.postMessage({ source:"content_bridge" })` settings payloads are not authenticated. | `js/seed.js:976-984`, `js/injector.js:1872-1894`, `js/injector.js:3335-3349`, `js/content/bridge_settings.js:501-514`. | Page script tries to disable settings through both paths; seed/injector must reject unless bridge-authenticated. |
| Renderer contract gaps | `compactPlaylistRenderer` is unwrapped but has no rule; modern Shorts/reel identity paths are documented but not first-class; collaborator `showSheetCommand` roster is missing; `postRenderer` / `sharedPostRenderer` are not first-class. | `js/filter_logic.js:1615`, `js/filter_logic.js:1837`, `js/filter_logic.js:816`, `js/filter_logic.js:811`, `js/filter_logic.js:3021-3027`, `js/filter_logic.js:726-733`; docs at `docs/json_paths_encyclopedia.md:930-949`, `2147-2188`, `3274-3299`; inventory at `docs/youtube_renderer_inventory.md:235-244`. | Renderer fixtures for compact playlist, Shorts lockup, reel overlay, collaborator sheet roster, post renderer, and shared post renderer. |
| Broad collaborator extraction | Avatar-stack collaborator extraction can run before mix/radio renderer guardrails, conflicting with docs that mix/radio artist stacks must not become collaborators. | `js/filter_logic.js:2899`, `js/filter_logic.js:1749`; docs guardrail `docs/json_paths_encyclopedia.md:238`. | Mix/radio fixture with avatar stack must not hide as collaborator content unless explicitly proven as collaboration. |
| State/save authority | `StateManager.saveSettings()` drops saves while `isSaving` is true, while mutations have already touched in-memory state. | `js/state_manager.js:1009-1012`, mutation examples `js/state_manager.js:1387`, `2046`, `2125`, `2182`. | Delayed save fixture with two fast mutations; final storage and runtime broadcast must contain both. |
| Whitelist migration | V3->V4 builder in shared settings forces blocklist mode and empty whitelists, then writes V4 on read. | `js/settings_shared.js:102-168`, `js/settings_shared.js:647-685`, `js/state_manager.js:318-327`. | V3-only whitelist fixture must preserve mode and allow lists after `loadSettings()`. |
| Copy intent | UI can send `copyBlocklist:false`; background reads but unconditionally merges/clears on whitelist transition. | `js/popup.js:822-855`, `js/tab-view.js:10549-10630`, `js/tab-view.js:4655`, `js/background.js:3302`, `js/background.js:3433-3445`. | `FilterTube_SetListMode({mode:"whitelist", copyBlocklist:false})` must preserve blocklist entries. |
| Affordance lifecycle | Quick-block, fallback menu, and collaboration observers install globally before active-rule/visible-affordance proof. | `js/content/block_channel.js:1454-1664`, `1669-1791`, `2358-2397`; `js/content/collab_dialog.js:75-80`, `306-336`; injection gate later at `js/content_bridge.js:10090-10096`. | Empty install with quick/menu disabled must show zero quick sweeps, zero fallback inserts, zero collaboration observer work. |
| Passive learning | Identity/video map learning can persist maps, mutate current settings, and cause settings refresh/fallback churn without active enforcement. | `js/content_bridge.js:1015`, `1192-1280`, `1477-1487`; `js/content/bridge_settings.js:547-603`; `js/content/handle_resolver.js:25-48`, `136-147`. | Passive-learning fixture must distinguish harvest counters from enforcement reruns; no DOM fallback rerun unless active pending decision exists. |

Peer-agent verdict: the current "disease" is a split authority and lifecycle problem, not a single whitelist bug. Fixing one false-hide symptom without centralizing active-state, mutation authority, renderer fixtures, and bridge trust would leave the same class of bugs available elsewhere.

### Peer-Critique Addendum - 2026-05-17 Follow-Up

The second agent review did not contradict the local audit. It added these disease-level proofs:

| Disease | Proof | Why it matters |
| --- | --- | --- |
| No-rule JSON still costs work | `js/seed.js:624`, `js/seed.js:636`, `js/seed.js:675-676`, `js/seed.js:779-784` | The seed no-rule skip is downstream of JSON parse/stringify for matching `/youtubei/v1/*` responses. Empty installs can still slow YouTube even if no card is hidden. |
| DOM lifecycle starts without active rules | `js/content_bridge.js:5707`, `js/content_bridge.js:5724`, `js/content_bridge.js:6025-6051` | Settings load can install fallback observer/prefetch work before proving active enforcement exists. |
| Identity prefetch is not rule-gated | `js/content_bridge.js:999-1015`, `js/content_bridge.js:1192`, `js/content_bridge.js:1280`, `js/content_bridge.js:1470` | Card identity harvesting can message/write maps in empty sessions, then map storage changes can refresh settings/fallback. |
| Quick-block disabled is not lifecycle-disabled | `js/content/block_channel.js:808`, `js/content/block_channel.js:1454-1463`, `js/content/block_channel.js:1607`, `js/content/block_channel.js:1651`, `js/content/block_channel.js:2359` | UI injection is gated, but listeners/observers/timers can still exist. |
| Fallback menu can bypass block-menu affordance gate | `js/content_bridge.js:6061`, `js/content_bridge.js:6403-6423`, `js/content_bridge.js:7068-7078`, compared with normal menu gate at `js/content_bridge.js:10094-10095` | `showBlockMenuItem:false` must disable all block-menu surfaces, not only the primary injection path. |
| Precise JSON renderer gaps remain | `docs/json_paths_encyclopedia.md:4813`, `js/filter_logic.js:1614`, `js/filter_logic.js:1837`; `docs/json_paths_encyclopedia.md:2715`, `docs/youtube_renderer_inventory.md:436`; `docs/json_paths_encyclopedia.md:4851-4880`, `js/filter_logic.js:811` | `compactPlaylistRenderer`, search refinement cards, and Shorts channel identity have documented JSON paths but incomplete runtime rules, forcing DOM fallback or allowing leaks. |
| `/player` should be metadata-only | `docs/json_paths_encyclopedia.md:4958`, `js/seed.js:607`, `js/filter_logic.js:1174`, `js/filter_logic.js:3391` | `/player` is useful for metadata harvest but should not be recursively rewritten like a feed response unless proven necessary. |
| DOM stale cleanup is still asymmetric | `js/content/dom_extractors.js:130`, `js/content/dom_extractors.js:196`, `js/content/dom_helpers.js:88-122`, `js/content/dom_fallback.js:1424`, `js/content/dom_fallback.js:2003`, `js/content/dom_fallback.js:2310` | Some cleanup paths clear attrs/classes but not inline display or custom hidden markers. |

### Peer-Critique Addendum - 2026-05-17 Batch 2

The later agent batch again converged with the local audit. It broadened the proof from "whitelist bug" into the same runtime disease:

| Area | Added proof | Why it changes the next audit step |
| --- | --- | --- |
| Seed no-rule cost | `js/seed.js:624-680`, `js/seed.js:748-755`, `js/seed.js:779-784` | Fetch and XHR behave differently when settings are missing. Fetch can parse/stringify/rebuild responses even when no rules exist. `js/seed.js` must get its own endpoint-by-endpoint ledger next. |
| Main-world authority | `js/seed.js:976-984`, `js/injector.js:1872-1894`, `js/content/bridge_settings.js:501-514` | Page-visible state and bridge-delivered state overlap. Runtime settings need one authenticated source and one versioned apply path. |
| Background actions | `js/background.js:3242-3265`, `js/background.js:3290-3497`, `js/background.js:4381-4396`, `js/background.js:5218-5260` | `getCompiledSettings` can write, list-mode copy intent can drift, caller-supplied settings can overwrite cache, and add/toggle actions need explicit sender/profile/network/storage schema. |
| UI mode intent | `js/popup.js:822-855`, `js/tab-view.js:4655`, `js/tab-view.js:10549-10625`, `js/background.js:3302`, `js/background.js:3443-3445` | The UI has "copy or do not copy blocklist" intent, but the normal background transition does not consistently honor it. This can create unexpected whitelist/blocklist states that look like false filtering. |
| JSON renderer gaps | `docs/json_paths_encyclopedia.md:2715`, `docs/json_paths_encyclopedia.md:4813`, `docs/json_paths_encyclopedia.md:4851`, `docs/youtube_renderer_inventory.md:432-438`, `js/filter_logic.js:528`, `js/filter_logic.js:811`, `js/filter_logic.js:1614`, `js/filter_logic.js:1837` | `filter_logic.js` is the next highest-value ledger after `content_bridge.js`: compact playlists, search refinements, watch cards, and Shorts owner paths decide whether DOM fallback has to do risky late cleanup. |

Consensus invariant from agents and local audit:

```text
The extension must prove "quiet" before it installs or runs work:
  no active enforcement
  no visible affordance
  no active metadata/category rule
  no explicit user action
  no approved identity harvest mode

If all are false:
  do not parse/rewrite YouTube JSON,
  do not observe all cards,
  do not prefetch identity,
  do not stamp DOM attrs,
  do not write maps,
  do not run fallback menu scans.
```

### Peer-Critique Addendum - 2026-05-17 Batch 3

The completed critic agents did not contradict the local ledger. They added these sharper invariants and proof points:

| Area | Added proof | Why it matters | Required invariant |
| --- | --- | --- | --- |
| MAIN-world settings spoof | `js/seed.js:976-984`, `js/injector.js:1872-1894`, `js/content/bridge_settings.js:501-514`. | Page-visible `window.filterTube.updateSettings()` and same-window `postMessage({ source:"content_bridge" })` are not a trusted boundary. | A page script must not be able to disable/alter runtime settings through either path without a bridge-authenticated token and background revision. |
| Duplicate seed apply | Bridge settings both posts to injector and tries direct seed update (`js/content/bridge_settings.js:501-514`); injector then updates seed (`js/injector.js:1881-1897`, `js/injector.js:3335-3349`); seed reprocesses snapshots on settings update (`js/seed.js:902-969`). | One background settings refresh can produce multiple seed apply/reprocess paths. | One settings revision should produce exactly one seed apply and one bounded reprocess pass. |
| Pending fetch/XHR replay limit | Missing settings queues data and returns the original object (`js/seed.js:353-356`); fetch still constructs a response (`js/seed.js:633-680`); later replay discards fetch/XHR results except initial globals (`js/seed.js:116-122`, `js/seed.js:928-944`). | Queued fetch/XHR responses cannot rewrite a response that YouTube already consumed. This path is harvest/replay bookkeeping, not guaranteed filtering. | The contract must explicitly classify pre-settings network JSON as `harvest-only` or stop queuing it as if it can still enforce. |
| No-settings queue cap | Engine-missing queue is capped (`js/seed.js:342-349`), but no-settings queue push is not (`js/seed.js:353-356`). | Startup/background delay can build an unbounded queue on busy pages. | Delayed-settings fixture must cap queue length, heap growth, and replay count. |
| Fetch/XHR startup divergence | Fetch parses/stringifies matching responses during startup (`js/seed.js:624-680`), while XHR exits when settings are missing (`js/seed.js:748-755`). | Empty install and delayed settings can cost more on fetch-backed YouTube endpoints. | Fetch and XHR no-settings/no-rule behavior must be equivalent: no replacement and no parse/stringify unless explicit harvest is enabled. |
| Harvest-only side effects | Seed calls `FilterTubeEngine.harvestOnly()` (`js/seed.js:364-382`), which harvests maps (`js/filter_logic.js:3482-3489`) and can emit persistence messages (`js/filter_logic.js:1370-1412`, `js/filter_logic.js:1476-1547`), handled by content bridge (`js/content_bridge.js:5479-5484`, `5531-5568`). | "Skip filtering" is not side-effect-free. It can still learn, write maps, and trigger later refreshes. | Harvest must have its own explicit budget, source attribution, dedupe, and no DOM rerun unless an active pending rule needs the learned fact. |
| Empty-runtime lifecycle | DOM fallback initializes from settings load (`js/content_bridge.js:5707-5724`, `6025-6051`); card identity prefetch observes cards and writes maps (`js/content_bridge.js:999-1015`, `1192-1280`, `1470`); quick/fallback menus install observers/listeners even when UI affordances are disabled (`js/content/block_channel.js:1454-1664`, `1675-1782`). | Empty blocklist mode can still do JSON, DOM, observer, map, and menu work. | Empty runtime fixture must assert zero fallback inserts, quick sweeps, identity prefetch messages, map writes, and fallback menu scans. |
| Background compiler impurity | `getCompiledSettings()` reads broad state and writes migrations/derived filter-all keywords (`js/background.js:2059-1828`, `1966-2080`, `2330-2397`). | A read-looking settings action can mutate rules and storage before user intent. | Runtime compilation should be pure; migrations should be explicit transactions with reports. |
| Caller-pushed runtime cache | `FilterTube_ApplySettings` accepts caller settings and overwrites cache/broadcasts (`js/background.js:4381-4394`). | Background can stop being the single compiler authority. | Runtime broadcasts must originate from a fresh background compile, not caller-provided partial settings. |
| List-mode copy intent | UI sends `copyBlocklist:false` (`js/popup.js:822-855`, `js/tab-view.js:4655`, `10549-10625`), but background always merges/clears when entering whitelist (`js/background.js:3302`, `3433-3445`). | Import or user mode switch can mutate the opposite list and look like false filtering. | `copyBlocklist:false` must preserve blocklist entries; import-to-whitelist must only change imported allow entries. |
| UI mode-blind broadcast | Shared settings compiler omits list mode/whitelist arrays (`js/settings_shared.js:524-560`), while `StateManager.saveSettings()` broadcasts it (`js/state_manager.js:1057-1059`); background compiler includes mode/profile/whitelist (`js/background.js:1990-2211`). | A UI save in whitelist mode can transiently broadcast blocklist-shaped settings. | UI saves must either delegate compilation to background or include the authoritative mode/profile/list payload and revision. |
| Renderer path gaps | Documented but not first-class paths include `compactPlaylistRenderer`, modern Shorts/reel owner identity, collaborator `showSheetCommand` roster, `postRenderer`/`sharedPostRenderer`, and `compactChannelRenderer` guardrails (`docs/json_paths_encyclopedia.md:930-949`, `2147-2188`, `3274-3299`; `docs/youtube_renderer_inventory.md:235-244`, `432-438`; code gaps around `js/filter_logic.js:811`, `816`, `1615`, `1837`, `3021-3027`). | Missing JSON rules force late DOM fallback or fail-closed whitelist behavior; broad additions can false-hide UI/entity cards if not scoped. | Add fixture-backed renderer contracts before changing runtime coverage. |
| Avatar-stack collaborator broadness | Docs say mix/radio avatar stacks must not become collaborators (`docs/json_paths_encyclopedia.md:238`), but collaborator extraction scans avatar stacks broadly before some mix/radio guardrails (`js/filter_logic.js:2899`, `1749`). | A Mix/Radio artist stack could become a collaborator match and hide unrelated content. | Mix/radio fixture with avatar stack must never hide as collaborator content unless the renderer is proven collaborative. |

Agent consensus matches the local conclusion: the disease is not "whitelist is slow" or "one card hid wrong." The disease is split authority plus unbudgeted lifecycle work:

```text
Settings authority is split:
  UI/shared compile
  background compile
  seed public settings
  injector settings merge

Runtime lifecycle is split:
  seed JSON hooks
  DOM fallback
  identity prefetch
  quick block/menu observers
  map harvest/persistence

Filtering decisions are split:
  JSON boolean hide
  DOM boolean hide
  optimistic action hide
  layout cleanup hide

Therefore the next fixes must centralize:
  active enforcement report,
  settings revision/source,
  typed mutation/action schema,
  structured decision reason,
  fixture-backed renderer contracts.
```

## Fixture And Instrumentation Roadmap

The next branch should not start by changing filter semantics. It should first make the disease measurable. These fixtures are the minimum proof set before source-level fixes:

| Priority | Fixture / instrumentation group | Proves | Primary files |
| ---: | --- | --- | --- |
| 1 | Empty runtime quiet fixture | Empty blocklist install does not parse/rewrite JSON, observe all cards, prefetch identity, stamp DOM, write maps, insert fallback menus, or run quick sweeps. | `js/seed.js`, `js/content_bridge.js`, `js/content/block_channel.js`, `js/content/dom_fallback.js`, `js/content/bridge_settings.js` |
| 2 | Settings authority fixture | One background settings revision enters runtime once; page scripts cannot spoof seed/injector settings; caller-provided UI payloads cannot overwrite background cache. | `js/background.js`, `js/content/bridge_settings.js`, `js/injector.js`, `js/seed.js`, `js/state_manager.js`, `js/settings_shared.js` |
| 3 | List-mode transition fixture | `copyBlocklist:false` preserves blocklist, imports only alter allowlist, managed-child and normal profiles share the same transition contract, empty whitelist requires explicit confirmed state. | `js/background.js`, `js/tab-view.js`, `js/popup.js`, `js/state_manager.js`, `js/settings_shared.js` |
| 4 | Storage mutation schema fixture | Every background action declares sender class, storage writes, network permission, profile unlock requirement, cache invalidation, and broadcast behavior. | `js/background.js`, `js/state_manager.js`, `js/io_manager.js`, `js/nanah_sync_adapter.js` |
| 5 | JSON renderer contract fixture | Documented renderers either have first-class JSON rules or explicit non-filtering classification; additions cannot broad-hide search refinement/entity cards. | `js/filter_logic.js`, `docs/json_paths_encyclopedia.md`, `docs/youtube_renderer_inventory.md` |
| 6 | DOM decision fixture | Every visual hide has structured reason/source/confidence and symmetric restore; stale-card cleanup clears class, attrs, and inline display. | `js/content/dom_helpers.js`, `js/content/dom_fallback.js`, `js/content/dom_extractors.js`, `js/content_bridge.js` |
| 7 | Side-effect budget fixture | Synthetic clicks, pauses, watch/channel fetches, subscription import scroll/click expansion, and map writes occur only for explicit user action or active pending rule. | `js/content/dom_fallback.js`, `js/content_bridge.js`, `js/content/handle_resolver.js`, `js/injector.js`, `js/background.js` |
| 8 | Identity confidence fixture | UC ID, handle, custom URL, channelMap, name-only, and stable-entry name fallback matches return structured reasons and obey different blocklist/whitelist policies. | `js/shared/identity.js`, `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/content_bridge.js` |
| 9 | Packaged asset guard | No legacy default-hide CSS becomes content-script loaded or runtime-injected; release artifacts and vendor bundles record exact source/version/hashes. | `manifest*.json`, `css/*.css`, `build.js`, `scripts/*.mjs`, `js/vendor/*.js` |

Instrumentation counters should be small and removable or debug-gated. Suggested counters:

```text
filtertube.audit = {
  settingsRevisionApplied,
  seedApplyCount,
  jsonResponsesParsed,
  jsonResponsesReplaced,
  harvestOnlyRuns,
  fallbackObserverInstalls,
  fallbackScans,
  quickBlockSweeps,
  fallbackMenuScans,
  identityPrefetchRequests,
  mapWrites,
  directHideWrites,
  syntheticClicks,
  networkIdentityFetches
}
```

These counters should be asserted in tests, not used as product telemetry.

### Executable Fixture Harness Design Pass - 2026-05-17

Current repository proof:

| Surface | Proof | Current state | Risk |
| --- | --- | --- | --- |
| Root package scripts | `package.json` has build scripts but no `test`, `audit`, `fixtures`, `jest`, `vitest`, or `node:test` script. | No project-owned extension runtime test harness exists. | Behavior can regress while docs stay correct. |
| Existing fixture directories | Repository search finds no project `test`, `tests`, `__tests__`, `fixtures`, or `spec` directory outside `node_modules`. | Required fixtures are design-only today. | Renderer, empty-runtime, and mutation invariants cannot be enforced before release. |
| Runtime engine export | `js/filter_logic.js:1-12` wraps the engine in an IIFE and exports `window.FilterTubeEngine` at `js/filter_logic.js:3457-3478`. | Can be tested in a controlled VM-like window/document harness without changing product code. | Tests must emulate `window`, `document`, timers, and postMessage carefully. |
| Seed runtime export | `js/seed.js:1-18` is also an IIFE and creates `window.filterTube` plus fetch/XHR hooks at the end of the file. | Seed tests require a browser-like or VM harness with fake fetch, XHR, Response, location, and event APIs. | Seed can parse/rebuild network responses without a real browser if the harness supplies these APIs. |
| DOM fallback/runtime scripts | Content files use real DOM selectors, MutationObserver, timers, and chrome messages. | Need a DOM-capable fixture layer or a narrow adapter around DOM APIs. | Without counters, observer/listener/timer cost remains invisible. |

Harness target:

```text
tests/
  runtime/
    harness/
      load-script.mjs
      fake-window.mjs
      fake-chrome.mjs
      audit-counters.mjs
    fixtures/
      settings/
      youtubei/
      dom/
      mutations/
    filter-logic.test.mjs
    seed-endpoints.test.mjs
    active-runtime-report.test.mjs
    mutation-intents.test.mjs
    dom-decision.test.mjs
```

Minimum dependency direction: prefer Node's built-in `node:test` and `assert/strict` first. Add a DOM library only when DOM fallback fixtures are ready. The first JSON/seed tests can run without Playwright or a full browser, which keeps the harness fast enough to run before every release build.

Harness load flow for `filter_logic.js`:

```text
createFakeWindow()
  -> install console, postMessage recorder, timers, minimal document
  -> evaluate js/filter_logic.js in VM context
  -> call window.FilterTubeEngine.processData(payload, settings, dataName)
  -> assert output JSON + audit side effects
```

Harness load flow for `seed.js`:

```text
createFakeWindow({
  location: { hostname, pathname },
  fetch: fakeFetchReturningJson(endpointPayload),
  XMLHttpRequest: fakeXHR,
  Response: fakeResponse
})
  -> evaluate js/filter_logic.js
  -> evaluate js/seed.js
  -> optionally call window.filterTube.updateSettings(settings)
  -> invoke fake fetch/XHR endpoint
  -> assert parse count, response replacement count, harvest count, mutation count
```

First fixture groups:

| Fixture group | Sample names | Required assertions |
| --- | --- | --- |
| Empty runtime quiet | `empty.blocklist.main.clean-install`, `empty.blocklist.mobile-home`, `empty.blocklist.watch-next`, `empty.blocklist.player` | No response rebuild, no recursive mutation, no DOM fallback scan, no map write, no quick/menu observer unless explicit harvest/affordance mode is enabled. |
| Explicit whitelist fail-closed | `whitelist.empty.confirmed`, `whitelist.allow-channel`, `whitelist.unresolved-identity-pending` | Empty whitelist behavior is explicit; allow rules show only matching content; unresolved identity policy is route/renderer-specific and not accidental. |
| List-mode transitions | `set-list-mode.copy-false`, `set-list-mode.copy-true`, `transfer-whitelist-to-blocklist`, `subscriptions-import-allow-only` | `copyBlocklist:false` preserves blocklist; explicit transfer moves and clears; import does not mutate blocklist unless requested. |
| Active predicate validation | `category.enabled-empty`, `duration.enabled-empty`, `upload-date.enabled-empty`, `popup-enabled-only-stale` | Raw booleans with empty/invalid inner rules do not wake runtime active work. |
| Renderer contracts | Seed list from the renderer inventory pass. | Every renderer fixture returns expected candidate fields, decision reason, and false-hide/leak result. |
| Mutation intents | `keyword.add.block`, `keyword.add.allow`, `channel.toggle-filter-all`, `content-filter.set`, `nanah.scoped-apply` | Every UI/import/native action maps to one canonical intent shape and report. |
| DOM hide decisions | `central-toggle-restore`, `pending-whitelist-hide`, `optimistic-menu-hide-rollback`, `playlist-direct-hide` | Every hide has writer id, reason, side-effect flags, and symmetric restore. |

Required audit counter API for tests:

```text
window.__filtertubeAudit = {
  increment(name, detail),
  snapshot(),
  reset()
}
```

The first implementation step should not change product behavior. It should add optional counter hooks around existing code paths and prove the current behavior. Only after baseline fixtures pass or intentionally fail should optimization changes begin.

### Runnable Fixture Implementation Plan - 2026-05-17

This is the concrete file/sequencing plan for the first proof branch. It is intentionally split so the first commits can measure current behavior before any runtime behavior changes.

Proposed package scripts:

```json
{
  "test:runtime": "node --test tests/runtime/*.test.mjs",
  "audit:runtime": "node --test tests/runtime/*.test.mjs",
  "audit:claims": "node tests/release/claim-manifest-check.mjs",
  "audit:release": "node tests/release/release-artifact-check.mjs"
}
```

Proposed first file set:

| File | Purpose | Allowed in first commit |
| --- | --- | --- |
| `tests/runtime/harness/load-script.mjs` | Load IIFE scripts into a VM-like context and return `window` exports. | New test-only file. |
| `tests/runtime/harness/fake-window.mjs` | Minimal `window`, `document`, timers, URL/location, event, and `postMessage` recorder. | New test-only file. |
| `tests/runtime/harness/fake-chrome.mjs` | Fake `chrome.runtime`, `chrome.storage`, and message routing for content/background-adjacent tests. | New test-only file. |
| `tests/runtime/harness/fake-network.mjs` | Fake `fetch`, `Response`, and `XMLHttpRequest` for seed endpoint tests. | New test-only file. |
| `tests/runtime/harness/audit-counters.mjs` | Test counter adapter that can read `window.__filtertubeAudit.snapshot()`. | New test-only file. |
| `tests/runtime/fixtures/settings/empty-blocklist.json` | Clean install / no active rules. | New fixture. |
| `tests/runtime/fixtures/settings/empty-whitelist-confirmed.json` | Explicit whitelist mode with no allow rules. | New fixture. |
| `tests/runtime/fixtures/settings/block-channel-ucid.json` | One strict UC-ID block rule. | New fixture. |
| `tests/runtime/fixtures/youtubei/*.json` | Minimal renderer payloads copied from documented JSON paths. | New fixtures; no generated secrets. |
| `tests/runtime/filter-logic.test.mjs` | First JSON renderer and channel decision assertions. | New test-only file. |
| `tests/runtime/seed-endpoints.test.mjs` | Fetch/XHR pass-through/replacement assertions. | New test-only file. |
| `tests/runtime/active-runtime-report.test.mjs` | Current behavior baseline now; expected future contract later. | New test-only file. |
| `tests/runtime/mutation-intents.test.mjs` | UI/background intent contract once schema exists. | New test-only file, initially skipped or TODO. |
| `tests/release/claim-manifest-check.mjs` | Ensure public claims declare shipped/limited/testing/planned/historical status. | New test-only file. |
| `tests/release/release-artifact-check.mjs` | Ensure release zips/APK/AAB/checksum/version claims match uploaded artifacts. | New test-only file. |

Phase 0 - harness only:

```text
Add tests/runtime harness files.
Add package scripts.
Do not touch js/ runtime code.
Prove filter_logic.js can load and process one no-op payload.
Prove seed.js can load with fake network and no settings.
Expected result: tests may expose current behavior, but no product behavior changes.
```

Phase 1 - current-behavior counters:

```text
Add debug/test-only __filtertubeAudit hooks.
Hooks must default to no-op when window.__filtertubeAudit is absent.
Counters are not telemetry and are not persisted.
Measure:
  seed settings applies,
  JSON parse/rebuild attempts,
  harvest-only runs,
  map writes,
  DOM fallback scan starts,
  quick/fallback menu scan starts.
Expected result: baseline tests can fail with documented current counts.
```

Phase 2 - fixture baseline:

```text
Add fixtures for:
  empty blocklist,
  empty whitelist explicit,
  enabled-empty content/category filters,
  one blocked UC ID,
  one allowed UC ID,
  compact playlist,
  Shorts/reel,
  collaborator sheet,
  search refinement,
  post/shared post.

Do not optimize yet. Record which tests fail under current code.
Expected result: fixture failures become the implementation queue.
```

Phase 3 - first behavior fix gate:

```text
Implement activeRuntimeReport(settings, route, surface).
Use it only to report active state first.
Then gate seed pass-through and no-rule DOM lifecycle after baseline approval.
Required passing proof:
  empty blocklist has zero hide decisions,
  no response replacement when no active rules exist,
  no fallback menu/quick-block scan when affordances are disabled,
  empty whitelist still fails closed only when explicitly selected.
```

Phase 4 - authority and mutation fixes:

```text
Add background-owned settings revision.
Reject caller-pushed compiled settings as runtime authority.
Add canonical mutation intent schema.
Fix copyBlocklist:false and import-only whitelist semantics.
Required passing proof:
  one user action -> one mutation report -> one settings revision -> one runtime apply.
```

Phase 5 - renderer precision:

```text
Convert json_paths_encyclopedia.md and youtube_renderer_inventory.md entries into fixtures.
Add first-class JSON extraction only when a fixture proves renderer kind, identity confidence, and route.
Do not broaden DOM fallback as a substitute for missing JSON contracts.
Required passing proof:
  compact playlists, Shorts/reels, collaborator sheets, posts, search refinements, and channel cards either hide/show correctly or are explicitly unsupported.
```

Phase 6 - release and native sync proof:

```text
Add publicClaim manifest.
Add nativeRuntimeSyncReport generation.
Add release-artifact checks for version, ZIP list, APK/AAB pair, checksums, and Nanah source revision.
Required passing proof:
  public website, README, dashboard cards, release notes, browser ZIPs, Android artifacts, and native runtime copy all describe the same release state.
```

Implementation order invariant:

```text
Fixtures first.
Counters second.
Behavior gates third.
Public/release claims last.

No optimization is accepted unless it has:
  before-count,
  after-count,
  fixture coverage,
  unchanged explicit block/allow behavior.
```

## Initial Staged Remediation Direction

No implementation is approved yet. If the audit continues to support the current evidence, the safest future order is:

1. Add instrumentation and a central `hasActiveEnforcement(settings)` / `activeRuntimeReport(settings)` without changing behavior.
2. Add regression tests for empty blocklist no-hide/no-heavy-work and empty whitelist explicit fail-closed.
3. Make background the only runtime settings compiler; UI saves should request mutations and receive revisioned compiled settings.
4. Gate empty-install observers, prefetch, map writes, fallback menu scans, and quick-block sweeps behind active feature predicates.
5. Move enforcement toward JSON-first route/renderer-specific paths backed by renderer fixtures.
6. Reduce DOM fallback to documented fallback surfaces only, with structured hide reasons and symmetric restore.
7. Consolidate identity resolution, menu/quick-block metadata paths, and learned-map writes behind one side-effect budget.
8. Replace boolean channel matching with a reason/confidence result before changing whitelist/blocklist semantics or adding simultaneous allow/block UI.

Implementation prerequisites from latest passes:

| Prerequisite | Why it must come first | Minimal proof before behavior changes |
| --- | --- | --- |
| `activeRuntimeReport(settings, route, surface)` | Prevents no-rule work from starting in seed, DOM fallback, quick block, fallback menu, prefetch, and metadata fetch paths. | Empty blocklist fixture proves no JSON parse/rewrite, no broad DOM scan, no map write, no quick sweep, no fallback menu scan. |
| `seedEndpointDecision(endpoint, route, activeRuntimeReport)` | Keeps JSON-first precision while avoiding parse/stringify/replacement in pass-through cases. | Fetch and XHR no-settings/no-rule behavior match; unchanged responses are not rebuilt. |
| `backgroundActionRegistry` | Stops split mutation authority and makes fetch/map/write/broadcast side effects explicit. | Every current background action has sender class, storage writes, network permission, cache policy, and result schema. |
| Background-owned settings revisions | Removes caller-pushed runtime settings and duplicate seed apply paths. | One settings change produces one background revision and one seed apply; page scripts cannot spoof settings. |
| Canonical mutation intent schema | Prevents popup, dashboard, managed-child edits, import, Nanah, quick actions, and native apps from creating different state shapes for the same user action. | Each mutating UI/control path maps to one `filterTubeMutationIntent` with profile, surface, list type, validation, expected writes, side effects, warnings, and runtime revision. |
| `channelMatchResult` reason object | Makes false-hide/false-allow cases diagnosable and lets weak matches be policy-scoped. | Fixtures cover UC, handle, custom URL, channelMap, name-only, stable-name fallback, collaborator, and recycled DOM cases. |
| Structured hide decision | Separates evaluation from visual hide, stats, media pause, playlist skip, and restore. | Every hide has writer id, rule id, confidence, side-effect flags, and symmetric restore test. |
| `compiledRuleState` validator | Prevents raw UI toggles with empty/stale predicates from waking seed/DOM/runtime work. | Category enabled with empty selected is inactive everywhere; duration/upload-date enabled states require complete normalized predicates. |

## Next Audit Pass Selection

The audit is not complete, but the current root-cause pass now has enough proof to stop guessing. Runtime active report design, background action schema, first renderer fixture inventory, seed endpoint current-behavior, active predicate divergence, DOM hide side-effect, canonical UI mutation intent, executable fixture harness design, runnable fixture implementation plan, renderer fixture deepening, native runtime copy, and public docs/website/release claim passes are now recorded in this document. Based on current proof, the next highest-value work is not another isolated symptom fix; it is a controlled fixture/instrumentation branch.

| Order | Workstream | Why this is next | Stop condition |
| ---: | --- | --- | --- |
| 1 | Fixture/instrumentation implementation branch | The harness, renderer expectations, native sync report target, and public claim manifest target now exist in docs, but no files/scripts exist yet. | Test harness and no-op counters land without changing filtering semantics. |
| 2 | Behavior gates after baseline | Empty-install and no-rule runtime cost must be measured before observers/parsers/scans are gated. | Empty blocklist fixtures prove zero false hides and reduced seed/DOM/menu/quick-block work. |
| 3 | Authority and mutation rewrite after fixtures | Whitelist/import/Nanah/UI bugs share split settings authority. | One mutation intent produces one background revision and one runtime apply. |

Current non-negotiable before source fixes:

```text
Do not start "optimization" by deleting individual scans.
First define and test:
  activeRuntimeReport(settings, route, surface)
  settingsRevision/source authority
  mode transition report
  side-effect budget counters
  renderer fixture expectations
  channelMatchResult confidence policy
```

## Subagent Judge Synthesis - 2026-05-17

Six independent audit passes were run against the current worktree. They were instructed to challenge the current assumptions rather than defend a single symptom such as end-screen gaps, whitelist lag, or empty-install slowness. No source edits were made by the agents.

Consensus:

```text
The disease is not one bad selector or one whitelist regression.
The disease is split authority plus eager lifecycle work:

  seed / injector / content bridge / DOM fallback / quick block
  all start work before the runtime has a proven active-work report.

  background / state manager / shared settings / UI import
  can mutate or compile settings through separate paths.

  JSON-first and DOM fallback are both valuable,
  but neither currently has enough fixture-backed boundaries.
```

### Subagent Findings To Carry Forward

| Area | Finding | Proof status | Required gate |
| --- | --- | --- | --- |
| Empty-install cost | Seed fetch/XHR hooks still parse and sometimes reserialize YouTube JSON before no-rule skip can win. `/player`, `/next`, `/guide`, and mobile home are not covered by the current skip story. | Proven by line-backed subagent review of `js/seed.js` and `js/filter_logic.js`. | `seedEndpointDecision(endpoint, route, activeRuntimeReport)` must decide pass-through before JSON parse/rewrite whenever no enforcement or harvest is needed. |
| DOM fallback lifecycle | DOM fallback has a real no-rule gate in its own module, but content bridge can still install observers/prefetch/fallback lifecycle around it. | Proven by line-backed review of bridge install paths. | Top-level page lifecycle gate before installing fallback observer, prefetch observer, fallback menu scan, or quick-block sweep. |
| Quick block / 3-dot lifecycle | Quick block and fallback menu observers/listeners can remain active even when their visible affordance is disabled or irrelevant. | Proven by line-backed review of `js/content/block_channel.js` and `js/content_bridge.js`. | Feature-visible gate plus teardown/pause counters for every observer/listener/timer. |
| Background authority | `getCompiledSettings` is not pure enough: compile, migration, normalization, derived keyword writes, learned map overlays, and cache writes are mixed. | Proven by line-backed review of `js/background.js`. | Background-owned revisioned settings authority; migrations explicit; compiler becomes pure or reports writes separately. |
| Runtime settings spoof/drift | Background can accept caller-provided runtime settings and broadcast them, which weakens background as sole compiler. | Proven. | Runtime apply must originate from a freshly background-compiled payload with revision/source. |
| Legacy migration | V3-to-V4 settings migration can default modes/lists in ways that erase whitelist state. | Proven by line-backed review of `js/settings_shared.js` and `js/state_manager.js`. | Migration fixture for V3-only blocklist/whitelist profiles across main and Kids. |
| Concurrent saves | `StateManager.saveSettings()` can return while a save is already active, allowing later mutations to appear successful but not persist/broadcast. | Proven. | Queued or revisioned save fixture; two mutations before first save resolves must persist and broadcast both. |
| Mode transfer | `copyBlocklist:false` is passed by UI/import paths but background whitelist mode switch still merges and clears blocklist. | Proven. | Mode-transition report fixture; no destructive transfer unless explicitly requested and confirmed. |
| Empty whitelist mode | Empty whitelist mode is allowed and can intentionally or accidentally block broadly. | Proven. | Explicit UX/policy fixture distinguishing empty blocklist no-op from empty whitelist fail-closed. |
| Renderer classification drift | Several audit classifications were too optimistic: `gridVideoRenderer` duplicate rule override, `lockupViewModel` missing documented owner paths, Shorts owner paths missing, shelves not purely structural, `/player` not actually metadata-only. | Proven/likely by JSON path and renderer inventory review. | Renderer fixture matrix before claiming JSON-first coverage. |
| Missing renderer contracts | `compactPlaylistRenderer`, `compactAutoplayRenderer`, broader watch-card containers, search refinement cards, `postRenderer`, `sharedPostRenderer`, `expandableMetadataRenderer`, and Shorts owner paths need fixtures or explicit unsupported status. | Proven by inventory/doc/code comparison. | JSON fixture rows for each renderer family and route. |
| Learned maps | `videoChannelMap` / `videoMetaMap` storage changes can refresh runtime and alter identity decisions without route/confidence/provenance. | Proven/likely. | Map writes require source, route, confidence, TTL/cap policy, and no-rule budget. |

### Judge-Level Invariants

These are now audit invariants. Future source changes must satisfy them before being accepted:

```text
No renderer is JSON_FIRST unless fixtures prove:
  title extraction,
  stable channel identity,
  keyword behavior,
  blocklist behavior,
  whitelist behavior,
  route/surface behavior.

No lifecycle starts on a page unless activeRuntimeReport says why:
  JSON mutation,
  JSON metadata harvest,
  DOM fallback,
  quick block,
  fallback menu,
  learned identity map,
  native/app overlay bridge.

No mutation path writes rules directly unless it produces:
  mutation intent,
  validation result,
  expected storage writes,
  side-effect budget,
  background revision,
  runtime refresh payload.

No visual hide is accepted without:
  writer id,
  rule id or reason,
  confidence,
  side-effect flags,
  restore proof.
```

## Selector And Lifecycle Inventory - 2026-05-17

Generated artifact:

- `docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md`

Feature-risk matrix:

- `docs/audit/FILTERTUBE_FEATURE_RISK_MATRIX_2026-05-17.md`

Endpoint/authority inventory:

- `docs/audit/FILTERTUBE_ENDPOINT_AUTHORITY_INVENTORY_2026-05-17.md`

Renderer contract coverage:

- `docs/audit/FILTERTUBE_RENDERER_CONTRACT_COVERAGE_2026-05-17.md`

Settings/mutation authority inventory:

- `docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md`

Lifecycle teardown audit:

- `docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_AUDIT_2026-05-17.md`

Fixture candidate matrix:

- `docs/audit/FILTERTUBE_FIXTURE_CANDIDATE_MATRIX_2026-05-17.md`

Scope:

```text
tracked JavaScript files under js/ plus build.js
vendor bundles excluded
literal selector calls only
static lifecycle and side-effect markers only
```

Counts:

| Metric | Count |
| --- | ---: |
| Files scanned | 31 |
| Literal selector calls | 599 |
| Lifecycle / side-effect markers | 727 |

Top current files by selector + lifecycle marker volume:

| File | Selector calls | Lifecycle / side-effect markers | Audit meaning |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 226 | 142 | Main page-resident risk center: DOM selectors, fallback lifecycle, prefetch, hidden-card state, fallback menu, runtime messages. |
| `js/tab-view.js` | 68 | 250 | Large UI surface; risky for settings mutation and import/profile flows, but not direct YouTube page-load cost. |
| `js/content/dom_fallback.js` | 151 | 29 | Largest fallback selector dependency; must be fixture-backed and route-scoped. |
| `js/layout.js` | 63 | 37 | Restore/layout helper that can undo or interact with hidden/visible states. |
| `js/content/block_channel.js` | 28 | 61 | Quick block and 3-dot affordance lifecycle risk. |
| `js/popup.js` | 16 | 51 | UI mutation/event risk, not page-load runtime risk. |
| `js/content/dom_extractors.js` | 23 | 4 | Core DOM metadata extraction dependency; selector drift can cause false hide/leak. |
| `js/background.js` | 0 | 21 | Authority and async/action lifecycle risk rather than DOM risk. |
| `js/injector.js` | 5 | 14 | Page bridge, JSON/import/collaboration injection risk. |

Interpretation:

```text
The inventory does not prove bugs by itself.
It proves where proof is missing.

Selector rows need:
  YouTube renderer/DOM fixture,
  route scope,
  no-rule behavior,
  false-hide/leak expectation.

Lifecycle rows need:
  active gate,
  teardown/pause path,
  counter,
  no-rule budget,
  fullscreen/native-overlay pause behavior where relevant.

Side-effect rows need:
  structured reason,
  rollback/restore,
  stats/media/navigation side-effect flags.
```

Checklist update:

- [x] Generated function-to-family coverage artifact recorded at `docs/audit/FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md`.
- [x] Generated selector/lifecycle inventory artifact recorded at `docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md`.
- [x] Added feature-risk matrix at `docs/audit/FILTERTUBE_FEATURE_RISK_MATRIX_2026-05-17.md`.
- [x] Added endpoint/authority inventory at `docs/audit/FILTERTUBE_ENDPOINT_AUTHORITY_INVENTORY_2026-05-17.md`.
- [x] Added renderer contract coverage at `docs/audit/FILTERTUBE_RENDERER_CONTRACT_COVERAGE_2026-05-17.md`.
- [x] Added settings/mutation authority inventory at `docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md`.
- [x] Added lifecycle teardown audit at `docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_AUDIT_2026-05-17.md`.
- [x] Added fixture candidate matrix at `docs/audit/FILTERTUBE_FIXTURE_CANDIDATE_MATRIX_2026-05-17.md`.
- [ ] Convert selector inventory into feature-owned selector families.
- [ ] Convert lifecycle inventory into start/stop/pause/teardown proof rows.
- [ ] Add endpoint-level seed behavior inventory for `/browse`, `/search`, `/next`, `/player`, `/guide`, Shorts, Kids, and account/profile routes.
- [ ] Add renderer fixture candidate table from `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`.
- [ ] Add mutation authority table for every background/state/UI/import/Nanah/native write path.

## Renderer Contract Coverage - 2026-05-17

Generated artifact:

- `docs/audit/FILTERTUBE_RENDERER_CONTRACT_COVERAGE_2026-05-17.md`

Counts:

| Metric | Count |
| --- | ---: |
| `FILTER_RULES` top-level occurrences | 44 |
| `FILTER_RULES` unique top-level keys | 43 |
| Whitelist structural/container keys | 7 |
| Documented renderer/ViewModel names found in docs | 149 |
| Combined renderer/ViewModel names | 155 |

Status counts:

| Status | Count | Audit meaning |
| --- | ---: | --- |
| `DIRECT_RULE_DOCUMENTED` | 38 | A direct rule exists, but fixtures are still needed. |
| `DIRECT_RULE_CODE_ONLY` | 4 | Code has a rule that the current docs scan did not document; docs may be stale. |
| `DUPLICATE_RULE_LAST_WINS` | 1 | JavaScript keeps the last object key; earlier fields can silently disappear. |
| `STRUCTURAL_ONLY_DOCUMENTED` | 3 | Documented renderer is only a container/structural pass-through today. |
| `STRUCTURAL_ONLY_CODE_ONLY` | 2 | Structural key exists in code but was not found in the current docs scan. |
| `DOCUMENTED_NO_DIRECT_RULE` | 107 | Highest renderer leak-risk bucket unless intentionally structural or unsupported. |

Immediate proof findings:

```text
gridVideoRenderer appears twice in FILTER_RULES:
  js/filter_logic.js:431
  js/filter_logic.js:604

The later rule wins. Any fields present in BASE_VIDEO_RULES but absent in
the later gridVideoRenderer rule are not effective for gridVideoRenderer.
```

High-priority documented-no-direct-rule examples:

```text
compactAutoplayRenderer
compactPlaylistRenderer
watchCardHeroVideoRenderer
watchCardRichHeaderRenderer
watchCardRHPanelRenderer
watchCardRHPanelVideoRenderer
horizontalCardListRenderer
searchRefinementCardRenderer
postRenderer
sharedPostRenderer
expandableMetadataRenderer
playlistPanelRenderer
channelMetadataRenderer
channelSubMenuRenderer
sortFilterSubMenuRenderer
contentMetadataViewModel
```

Renderer audit invariant:

```text
No renderer may be marked complete because it appears in docs or in FILTER_RULES.
Completion requires fixtures proving:
  blocklist match,
  whitelist allow,
  whitelist no-match behavior,
  identity confidence,
  route/surface behavior,
  no unintended parent container removal.
```

## Settings And Mutation Authority Inventory - 2026-05-17

Generated artifact:

- `docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md`

Scope:

```text
js/background.js
js/state_manager.js
js/settings_shared.js
js/tab-view.js
js/popup.js
js/io_manager.js
js/nanah_sync_adapter.js
js/security_manager.js
```

Counts:

| Marker | Count |
| --- | ---: |
| Total authority markers | 526 |
| Unique action names | 25 |
| List writes | 296 |
| Settings save calls | 91 |
| Message action comparisons | 34 |
| Profile mode writes | 26 |
| Storage writes | 25 |
| Message action objects | 23 |
| Storage reads | 12 |
| Background auto-backup triggers | 11 |
| Tab broadcast/query markers | 8 |

Interpretation:

```text
This confirms the settings disease is broader than whitelist UI.
List and mode writes are spread across background, state manager,
shared migration, popup, dashboard, IO, Nanah, and security/support files.

Before simultaneous allow/block mode or whitelist fixes,
each mutation path needs one authority report:
  sender trust,
  profile/surface,
  mutation intent,
  validation result,
  storage writes,
  background revision,
  runtime broadcast,
  backup trigger,
  failure/rollback behavior.
```

## Lifecycle Teardown Audit - 2026-05-17

Generated artifact:

- `docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_AUDIT_2026-05-17.md`

Counts:

| Metric | Count |
| --- | ---: |
| Files with lifecycle markers | 21 |
| Total lifecycle marker rows | 496 |
| Page-resident lifecycle marker rows | 212 |

Top lifecycle files:

| File | Page-resident | Total | add/remove listeners | observers/disconnects | intervals/clears | timeouts/clears | RAF/cancel |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `js/tab-view.js` | no | 180 | 147/0 | 0/0 | 1/1 | 14/4 | 11/2 |
| `js/content_bridge.js` | yes | 100 | 23/1 | 8/5 | 1/1 | 35/10 | 8/0 |
| `js/content/block_channel.js` | yes | 64 | 34/0 | 6/2 | 1/0 | 11/1 | 3/0 |
| `js/popup.js` | no | 33 | 30/0 | 0/0 | 0/0 | 2/0 | 1/0 |
| `js/content/dom_fallback.js` | yes | 13 | 3/0 | 0/0 | 0/0 | 10/0 | 0/0 |
| `js/injector.js` | yes | 12 | 2/0 | 0/0 | 1/2 | 5/2 | 0/0 |

Lifecycle audit invariant:

```text
Listener start/cleanup ratios are not direct bug counts.
Some listeners intentionally live for a document lifetime.

But page-resident observers, intervals, RAF loops, and anonymous listeners
must have one of:
  strict install gate,
  explicit teardown/disconnect/clear path,
  or documented lifetime plus no-op counters for inactive states.
```

## Fixture Candidate Matrix - 2026-05-17

Generated artifact:

- `docs/audit/FILTERTUBE_FIXTURE_CANDIDATE_MATRIX_2026-05-17.md`

P0 fixture groups now defined:

| Group | Purpose |
| --- | --- |
| Runtime no-work fixtures | Prove empty blocklist and disabled extension do not parse/rewrite/hide/scan/write maps unnecessarily. |
| Whitelist/blocklist mode fixtures | Prove empty whitelist policy, exact allow, pending restore, one-keyword block, and weak channel identity behavior. |
| Endpoint fixtures | Prove `/search`, `/browse`, `/next`, `/player`, `/guide`, and comment continuation decisions. |
| Renderer contract fixtures | Prove high-risk renderer gaps such as `gridVideoRenderer`, `compactAutoplayRenderer`, `compactPlaylistRenderer`, watch cards, posts, Shorts, playlists, and AI summaries. |
| DOM selector fixtures | Prove selectors hide the intended card/row and not parent/primary/player surfaces. |
| Lifecycle fixtures | Prove quick block/menu/fallback/prefetch/native-overlay/fullscreen lifecycle gates and teardown. |
| Settings/mutation fixtures | Prove V3 migration, save queuing, mode transfer, import, filterAll derivation, category validation, and background revision authority. |

Completion rule:

```text
The audit cannot be marked complete until every P0 fixture has:
  runnable fixture file,
  known input sample,
  expected decision,
  side-effect counters,
  and pass/fail result.
```

## Runnable Runtime Proof Harness - 2026-05-17

Generated artifact:

- `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md`

Runnable files:

- `tests/runtime/harness/load-filter-engine.mjs`
- `tests/runtime/harness/load-seed-runtime.mjs`
- `tests/runtime/dom-target-source-current-behavior.test.mjs`
- `tests/runtime/filter-engine-current-behavior.test.mjs`
- `tests/runtime/lifecycle-source-current-behavior.test.mjs`
- `tests/runtime/seed-network-current-behavior.test.mjs`
- `tests/runtime/settings-authority-source-current-behavior.test.mjs`

Command:

```bash
npm run audit:runtime
```

Latest result:

```text
tests 274
pass 274
fail 0
```

Initial proof coverage:

| Fixture | Status | Proof |
| --- | --- | --- |
| Empty blocklist/simple `videoRenderer` | passing | Engine leaves the card intact with no blocklist rules. |
| Disabled filtering/reference return | passing | `settings.enabled=false` returns the original payload reference. |
| Empty whitelist/simple `videoRenderer` | passing-current-gap | Engine removes the card because whitelist mode is fail-closed with no allow rules. |
| Empty category selection | passing-boundary-proof | Engine category filter no-ops when `selected=[]`, proving raw enabled state is not enough for a meaningful rule. |
| Duration longer with zero threshold | passing-current-gap | Engine removes any parsed-duration video when `condition=longer` and `minMinutes=0`. |
| Duration shorter with zero threshold | passing-boundary-proof | Engine leaves parsed-duration videos intact for `condition=shorter`, proving zero-threshold behavior is condition-dependent. |
| Duration between with zero thresholds | passing-boundary-proof | Engine leaves parsed-duration videos intact for `condition=between` with zero min/max, even though enabled state can still wake work. |
| Blank upload-date fields | passing-boundary-proof | Engine upload-date filter no-ops with blank dates, proving raw enabled state can wake work without a rule. |
| Duplicate `gridVideoRenderer` description-only keyword | passing-current-gap | Later `gridVideoRenderer` rule shadows `BASE_VIDEO_RULES` description coverage. |
| Duplicate `gridVideoRenderer` common duration | passing-boundary-proof | Common `lengthText` duration extraction still removes matching grid videos despite the duplicate/narrow rule. |
| Duplicate `gridVideoRenderer` published-time upload date | passing-current-gap | Simple `publishedTimeText` upload-date filtering is ignored for grid videos under the later duplicate rule. |
| `shelfRenderer` broad shelf hide | passing-current-behavior | Shelf-title keyword matches remove the entire shelf container and its non-matching children. |
| `richShelfRenderer` broad rich shelf hide | passing-current-behavior | Rich-shelf title keyword matches remove the entire rich shelf container and its non-matching children. |
| `compactAutoplayRenderer` keyword | passing-current-gap | No direct JSON rule currently removes it. |
| `endScreenVideoRenderer` keyword | passing | Direct end-screen video renderer uses `BASE_VIDEO_RULES` and is removed by keyword. |
| `compactPlaylistRenderer` keyword/channel | passing-current-gap | No direct JSON rule currently removes it, and matching creator identity also passes through. |
| Wrapped `richItemRenderer > compactPlaylistRenderer` | passing-current-gap | Rich-item unwrap chooses `compactPlaylistRenderer`, then the missing direct rule lets the wrapped playlist pass through. |
| Direct `watchCardRichHeaderRenderer` keyword | passing-current-gap | No direct JSON rule currently removes it. |
| Nested `universalWatchCardRenderer` keyword | passing | Nested watch-card header text is removed through the universal wrapper rule. |
| `watchCardCompactVideoRenderer` keyword | passing | Direct compact watch card uses `BASE_VIDEO_RULES` and is removed by keyword. |
| Direct `watchCardHeroVideoRenderer` keyword | passing-current-gap | No direct JSON rule currently removes it. |
| `watchCardRHPanelVideoRenderer` keyword/channel | passing-current-gap | Direct RHS panel watch-card video payloads pass through despite matching keyword/channel data. |
| `postRenderer` keyword | passing-current-gap | No direct JSON rule currently removes it. |
| Legacy `backstagePostRenderer` keyword/channel | passing | Legacy post renderer removes matching post text and author channel identity. |
| Legacy `backstagePostThreadRenderer` keyword/channel | passing | Legacy thread-wrapped post removes matching nested post text and author channel identity. |
| `sharedPostRenderer` original post keyword | passing-current-gap | Shared community posts and nested original post text currently pass through. |
| `playlistPanelRenderer` header and nested video | passing-boundary-proof | Playlist panel header/title text is not first-class, but nested `playlistPanelVideoRenderer` entries are recursively filtered. |
| `channelMetadataRenderer` about text | passing-current-gap | Channel about/metadata text currently passes through. |
| `channelRenderer` channel-only behavior | passing-boundary-proof | Search channel rows ignore keyword-only text but hide when the channel ID/handle matches a channel rule. |
| `compactChannelRenderer` channel identity | passing-current-gap | Compact channel cards carry documented channel identity but are not blocked by channel rules because no direct rule exists. |
| `searchRefinementCardRenderer` query/entity identity | passing-current-gap | Refinement cards with matching query text or associated entity channel identity pass through. |
| `horizontalCardListRenderer` refinement children | passing-current-gap | Horizontal refinement rails preserve child refinement cards even when keyword/channel rules match those children. |
| `commentRenderer` serialized comment keyword list | passing-current-gap | Serialized `filterKeywordsComments` entries are ignored because the engine does not reconstruct them into `RegExp` instances. |
| `commentRenderer` direct `RegExp` comment keyword list | passing-boundary-proof | Comment-specific keyword filtering works when the list already contains real `RegExp` objects. |
| `commentRenderer` global keyword fallback | passing-current-gap | Global keyword matching can still remove comments when the explicit comment keyword list is empty. |
| `commentRenderer` author channel | passing | Comment author channel ID matching removes the comment renderer. |
| `commentThreadRenderer` hide-all | passing | `hideAllComments` removes comment threads. |
| `commentsHeaderRenderer` hide-all | passing-current-gap | Comment header/count renderers currently remain under `hideAllComments`. |
| `shortsLockupViewModel` title keyword and channel-only rule | passing-current-gap | Title/accessibility keyword filtering works, but channel-only rules need `videoChannelMap` or another owner identity path. |
| `shortsLockupViewModel` below-thumbnail owner | passing-current-gap | Search-style Shorts owner UC/handle data under `belowThumbnailMetadata` is currently ignored by channel rules. |
| `reelItemRenderer` title keyword and channel handle rule | passing-current-gap | Title keyword filtering works, but channel-bar UC/handle identity is not extracted by the direct rule. |
| `lockupViewModel` row command-run owner | passing-current-gap | Modern lockup owner browse IDs in metadata row command-runs are ignored without decorated-avatar identity. |
| `videoWithContextRenderer` show-sheet collaborators | passing-current-gap | Mobile/YTM show-sheet collaborator rosters are not parsed by the current show-dialog collaboration path. |
| `videoWithContextRenderer` show-dialog collaborators | passing-boundary-proof | Legacy dialog-style collaborator rosters are parsed and matching collaborator channel rules hide the renderer. |
| `radioRenderer` avatar-stack guard | passing-current-gap | Avatar-stack extraction can currently treat Mix/Radio artist stacks as collaboration identity and block the renderer by channel rule. |
| `expandableMetadataRenderer` keyword | passing-current-gap | No direct JSON rule currently removes it. |
| Player-shaped payload with nested `videoRenderer` | passing-boundary-proof | Generic engine is endpoint-agnostic; `/player` protection belongs in seed endpoint policy. |
| Harvest-only video-channel map write | passing-current-gap | Real `harvestOnly()` can emit `FilterTube_UpdateVideoChannelMap` from renderer bylines. |
| Harvest-only video-meta map write | passing-current-gap | Real `harvestOnly()` can emit `FilterTube_UpdateVideoMetaMap` from player metadata. |
| `/youtubei/v1/search` empty blocklist | passing | Search on `/results` skips `processData` and calls `harvestOnly`. |
| Non-YouTubei fetch bypass | passing | Non-YouTubei requests do not parse response JSON, stringify a replacement body, or call engine hooks. |
| Fetch endpoint text in query | passing-current-gap | A non-YouTube URL whose query contains `/youtubei/v1/search` is still intercepted and processed as `fetch:/log`. |
| Fetch endpoint prefix collision | passing-current-gap | `/youtubei/v1/searchExtra` is still intercepted and processed because matching uses substring inclusion. |
| XHR endpoint text in query | passing-current-gap | XHR marks requests for processing when the YouTubei endpoint text appears only in a query value. |
| Harvest-only parse/stringify cost | passing-current-gap | Search harvest-only skip still parses the cloned response and stringifies a replacement response body. |
| `/youtubei/v1/search` active blocklist | passing | Search switches to `processData` once an active rule exists. |
| `/youtubei/v1/search` category enabled-empty | passing-current-gap | Search calls `processData` for `categoryFilters.enabled=true` even with `selected=[]`. |
| `/youtubei/v1/search` upload-date blank | passing-current-gap | Search calls `processData` for enabled upload-date filters with blank dates. |
| Desktop `/youtubei/v1/browse` empty blocklist | passing | Desktop home continuation skips `processData` and calls `harvestOnly`. |
| Desktop `/youtubei/v1/browse` active blocklist | passing | Desktop home switches to `processData` once an active rule exists. |
| Desktop `/youtubei/v1/browse` category enabled-empty | passing-current-gap | Seed calls `processData` for `categoryFilters.enabled=true` even with `selected=[]`. |
| Desktop `/youtubei/v1/browse` duration enabled-empty | passing-current-gap | Seed calls `processData` for `duration.enabled=true` even with empty/zero thresholds. |
| Desktop `/youtubei/v1/browse` upload-date blank | passing-current-gap | Desktop home calls `processData` for enabled upload-date filters with blank dates. |
| Mobile `/youtubei/v1/browse` empty blocklist | passing-current-gap | Mobile home continuation still calls `processData` with no rules. |
| Disabled fetch responses | passing-current-gap | `enabled=false` skips both `harvestOnly` and `processData`, but intercepted YouTubei responses still pay parse/stringify cost. |
| `/youtubei/v1/player` empty blocklist | passing-current-gap | Player endpoint still calls `processData` with no rules. |
| `/youtubei/v1/player` response replacement | passing-current-gap | Player endpoint fetches can return the engine output as the player response body; the current contract is not metadata-only. |
| `/youtubei/v1/player` actual engine mutation | passing-current-gap | When the real engine removes renderer arrays inside a player-shaped response, seed returns that mutated body. This proves `/player` is not metadata-only today. |
| `/youtubei/v1/next` empty blocklist | passing-current-gap | Watch next endpoint still calls `processData` with no rules. |
| `/youtubei/v1/next` actual engine mutation | passing | Watch next recommendation arrays are returned with real engine removals when active keyword rules match. |
| `/youtubei/v1/next` comment continuation shortcut | passing-boundary-proof | `hideAllComments` comment continuations bypass the engine and return a synthetic end-of-comments marker. |
| `/youtubei/v1/next` reload comment continuation | passing-current-gap | Reload-style comment continuation payloads miss the synthetic `hideAllComments` shortcut and call `processData`. |
| `/youtubei/v1/guide` empty blocklist | passing-current-gap | Guide endpoint still calls `processData` with no rules. |
| YouTubei before settings loaded | passing-current-gap | A YouTubei response can be parsed, queued, stringified into a replacement response, and returned before settings are available. |
| Lifecycle primitive counts | passing-boundary-proof | Page-resident listener/observer/timer/RAF counts are pinned for `content_bridge`, `block_channel`, `dom_fallback`, and `injector`. |
| Quick-block lifecycle source | passing-current-gap | Quick block has global resize/orientation and route sweep listener paths without a local teardown path in `block_channel.js`; the previous periodic timer source path is gone. |
| Fallback menu lifecycle source | passing-current-gap | Fallback menu has warmup interval and scroll rescan source paths. |
| Fallback menu scan gates | passing-current-gap | Fallback menu scanning respects native overlay quiet mode but does not share the primary dropdown's list-mode or `showBlockMenuItem` gate. |
| DOM fallback listener source | passing-current-gap | DOM fallback has document/window listeners without local removal paths. |
| DOM fallback split enabled predicate | passing-current-gap | `hasActiveDOMFallbackWork()` now requires strict content-filter booleans and selected category values, but still does not validate duration/date values or route scope before lifecycle work. |
| DOM category selected guard | passing-boundary-proof | Per-card category metadata fetch is guarded by selected categories, so empty category selection is mostly scan/wakeup overwork at this layer. |
| DOM upload-date metadata scheduling | passing-current-gap | Upload-date metadata fetch can be scheduled before the later valid-date predicate check. |
| DOM duration zero threshold | passing-current-gap | DOM fallback uses zero fallback thresholds for `longer`/`shorter`, matching the engine false-hide risk. |
| DOM keyword one-sided boundary | passing-current-gap | Normalized keyword fallback accepts matches when either side has a boundary, rather than requiring both sides. |
| DOM members-only broad host selector | passing-current-gap | Members-only badge fallback includes watch primary containers and whole-shelf direct hides. |
| `FilterTube_SetListMode` copy flag | passing-current-gap | Background reads `copyBlocklist` but unconditionally merges/clears when switching to whitelist. |
| Subscription import enable-whitelist path | passing | UI sends `copyBlocklist:false` before enabling whitelist after import. |
| `FilterTube_ApplySettings` cache authority | passing-current-gap | Caller-provided settings are assigned into compiled cache and forwarded to tabs. |
| Shared settings key drift | passing-current-gap | `SETTINGS_KEYS` omits runtime compiler dependencies such as content/category filters, comments keywords, learned video maps, V4 profiles, exact matching, and channel-derived keyword keys. |
| Background invalidation drift | passing-current-gap | `getCompiledSettings()` reads more keys than the background storage invalidation listener watches, so some changes can leave stale compiled caches while other changes trigger broad recompiles. |
| Bridge refresh key drift | passing-current-gap | Content bridge refresh omits category filters and exact/channel-derived keyword keys, so source-of-truth changes are not uniformly pushed into page runtime. |
| StateManager reload key drift | passing-current-gap | Tab state reload omits content/category filters, learned video maps, exact matching, channel-derived keyword keys, and `statsBySurface`. |
| `syncKidsToMain` whitelist merge | passing-boundary-proof | Main compiled whitelist can include Kids whitelist entries when sync and matching modes are active. |
| Legacy V3-to-V4 migration builder | passing-current-gap | Shared migration currently forces blocklist mode and empty whitelist lists, so V3-only whitelist data needs an explicit preservation fix. |
| Shared settings read-path V4 write | passing-current-gap | `FilterTubeSettings.loadSettings()` can write generated V4 data while reading, which can trigger storage fanout and persist lossy migration state. |
| StateManager concurrent save drop | passing-current-gap | `StateManager.saveSettings()` drops overlapping saves instead of queueing them. |
| StateManager optimistic mutators | passing-current-gap | Keyword/content/category mutators update state before save and can notify after a save path that may have been dropped. |
| Profile persistence failure swallowing | passing-current-gap | Main/Kids profile persistence helpers catch and warn on V3/V4 failures without reporting failure to mutation callers. |
| `syncKidsToMain` channel-derived keyword persistence | passing-current-gap | Kids `filterAll` channel-derived keywords can be merged into Main keyword recomputation and then saved as Main keyword input. |
| Quick-block DOM target selectors | passing | Quick-block includes watch-card and playlist targets and is disabled in whitelist mode. |
| Native dropdown context order | passing | Comment context is preferred before watch/playlist fallback targets; post renderers are included. |
| Fallback 3-dot post coverage | passing-current-gap | Fallback scan omits post renderers even though native dropdown targeting includes them. |
| Selected playlist row current-watch block | passing-current-behavior | Current-watch owner block can mark and hide the selected playlist row. |
| Clicked content hide target scoping | passing | Shorts and lockup parent scoping are present in clicked hide target resolution. |

This harness intentionally asserts current behavior first. The next phase is to
add DOM-target and remaining endpoint-policy fixtures before changing filtering
code, so each fix has a measurable before/after contract.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
