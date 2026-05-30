# FilterTube Source Surface Inventory - 2026-05-17

This audit artifact maps source files to the surfaces that can load or package
them. It is not a fix plan. It exists so the broader runtime audit cannot miss a
file just because that file is outside `filter_logic.js`, `seed.js`, or DOM
fallback.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Manifest-Loaded Content Runtime

These scripts are loaded on YouTube / YouTube Kids pages by at least one browser
manifest and therefore need runtime lifecycle, route, settings, and hide-safety
proof.

| File | Loader | Audit family |
| --- | --- | --- |
| `js/seed.js` | Chrome/Opera content script, Firefox web-accessible injected script | JSON endpoint interception, empty-install cost, route authority |
| `js/shared/identity.js` | isolated content script and web-accessible injected script | shared identity constants and browser/runtime identity |
| `js/content/menu.js` | isolated content script | menu affordance helpers |
| `js/content/dom_helpers.js` | isolated content script | central hide/show helper, container cleanup |
| `js/content/dom_extractors.js` | isolated content script | DOM identity extraction |
| `js/content/dom_fallback.js` | isolated content script | DOM fallback filtering, direct hides, metadata fetch scheduling |
| `js/content/block_channel.js` | isolated content script | quick-block and native menu action logic |
| `js/content/bridge_injection.js` | isolated content script | main-world runtime injection bridge |
| `js/content/bridge_settings.js` | isolated content script | settings refresh and compiled runtime delivery |
| `js/content/handle_resolver.js` | isolated content script | handle/UC resolution |
| `js/content/collab_dialog.js` | isolated content script | collaborator dialog and roster behavior |
| `js/content/release_notes_prompt.js` | isolated content script | release-note prompt lifecycle |
| `js/content/first_run_prompt.js` | isolated content script | first-run coachmark/prompt lifecycle |
| `js/content_bridge.js` | isolated content script | DOM action bridge, fallback menu, prefetch, sync with page runtime |

## Manifest Web-Accessible Runtime

These files can be injected into the page world or fetched by extension scripts.
They need source-version and browser-parity proof.

| File | Loader | Audit family |
| --- | --- | --- |
| `js/injector.js` | web-accessible injected runtime | subscriptions import, collaborator extraction, page-world bridge |
| `js/filter_logic.js` | web-accessible injected runtime | JSON filtering engine and renderer contracts |
| `js/seed.js` | web-accessible in Firefox / manifest main-world in Chromium | JSON endpoint interception |
| `js/shared/identity.js` | web-accessible injected runtime | shared identity constants |
| `icons/file.svg` | Chrome/Firefox web-accessible resource | menu/popup asset; release asset only |

## Background And Extension UI

| File | Loader | Audit family |
| --- | --- | --- |
| `js/background.js` | extension background service worker / Firefox background script | settings compiler, storage authority, message actions, release prompts |
| `html/popup.html` | browser action popup | popup UI surface |
| `html/tab-view.html` | dashboard / tab UI | main management UI surface |
| `html/troubleshoot.html` | packaged support page | troubleshooting UI surface |
| `js/popup.js` | popup page | popup mutation/actions |
| `js/tab-view.js` | dashboard page | dashboard mutation/actions, import/export, app cards |
| `js/state_manager.js` | popup/dashboard runtime | local UI state, persistence, profiles |
| `js/render_engine.js` | popup/dashboard runtime | UI rendering orchestration |
| `js/ui_components.js` | popup/dashboard runtime | shared UI widgets |
| `js/layout.js` | packaged legacy/layout runtime | quarantined unless a loader proves current use |
| `js/io_manager.js` | popup/dashboard runtime | import/export, backups |
| `js/security_manager.js` | popup/dashboard runtime | PIN/security helpers |
| `js/settings_shared.js` | background/UI/runtime shared settings | V3/V4 migration and settings defaults |
| `js/nanah_sync_adapter.js` | dashboard sync runtime | Nanah import/export/sync mutation path |
| `js/content_controls_catalog.js` | UI/settings catalog | content/category option source |
| `src/extension-shell/popup.jsx` | generated UI shell source | source input for popup ambient shell; output freshness required |
| `src/extension-shell/tab-view-decor.jsx` | generated UI shell source | source input for dashboard ambient shell; output freshness required |
| `src/extension-shell/shared/runtime.js` | generated UI shell source | shared source for extension shell theme/scene/surface runtime |
| `js/ui-shell/popup-shell.js` | generated UI shell | generated popup shell, freshness required |
| `js/ui-shell/tab-view-decor.js` | generated UI shell | generated dashboard decor, freshness required |
| `js/vendor/nanah.bundle.js` | bundled vendor/runtime | Nanah source revision proof required |
| `js/vendor/qrcode.bundle.js` | bundled vendor/runtime | QR vendor bundle proof required |

## CSS And Static Assets

| File/family | Loader | Audit family |
| --- | --- | --- |
| `css/design_tokens.css`, `css/components.css`, `css/popup.css`, `css/tab-view.css`, `css/serene-shell.css` | extension UI HTML pages | active UI CSS, scoped to extension pages |
| `css/filter.css`, `css/content.css`, `css/layout.css` | packaged by build, not manifest-loaded | quarantined legacy/default-hide CSS |
| `data/release_notes.json` | UI/release prompt data | public copy and release-note state |
| `icons/icon-*.png`, `icons/icon-128.svg`, `icons/file.svg` | manifest action icons, extension icons, menu asset | packaged static assets and browser-store identity |
| `assets/images/*`, `assets/images/homepage_hero_day.mp4` | packaged static assets | app/download dashboard visuals and release asset burden |
| `assets/.DS_Store`, `js/.DS_Store` | local filesystem artifacts | should not be treated as product source; release packaging must exclude system junk |

## Build And Sync Scripts

| File | Role | Audit family |
| --- | --- | --- |
| `build.js` | extension package and optional GitHub release script | release artifact authority, build side effects |
| `scripts/build-extension-ui.mjs` | generated UI bundle builder | generated shell freshness |
| `scripts/build-nanah-vendor.mjs` | Nanah/QR vendor bundler | vendor source revision proof |
| `scripts/sync-native-runtime.mjs` | private app runtime sync wrapper | app parity and source hash proof |
| `scripts/compress-video.swift` | website/video optimization helper | manual asset transformation proof |

## Website Source Surface

These files are part of the public `filtertube.in` source surface and are
audited for privacy/download/release claims, route copy, analytics scope, and
public-platform positioning. Generated website output and dependency caches are
not product source.

| File/family | Role | Audit family |
| --- | --- | --- |
| `website/app/layout.js`, `website/app/page.js`, `website/app/[slug]/page.js`, `website/app/not-found.js` | Next.js route shell and marketing pages | public claims, analytics scope, route content |
| `website/app/downloads/page.js`, `website/app/privacy/page.js`, `website/app/terms/page.js` | Public policy/download pages | store/download claims, privacy wording, release-state truth |
| `website/app/robots.js`, `website/app/sitemap.js`, `website/app/icon.png`, `website/app/globals.css` | SEO, app icon, global styling | public indexability, brand/static source, visual surface |
| `website/components/browser-logo-rail.js`, `website/components/marketing-ui.js`, `website/components/reveal.js`, `website/components/route-content.js` | Shared marketing components and route data | public copy source, animation/reveal policy, platform cards |
| `website/components/scene-controller.js`, `website/components/scenic-detail-page.js`, `website/components/scenic-illustration.js`, `website/components/scenic-tones.js` | Scenic platform page system | platform detail claims and visual source |
| `website/components/site-data.js`, `website/components/site-footer.js`, `website/components/site-header.js`, `website/components/site-shell-data.js`, `website/components/theme-toggle.js` | Site navigation, footer, data, and theme controls | global public copy and navigation authority |
| `website/public/brand/logo.png`, `website/public/videos/homepage/day/homepage_hero_day.mp4`, `website/public/videos/homepage/homepage_hero_day.mp4`, `website/public/videos/ios/ios_hero_slow_540.mp4` | Public static assets | website asset weight and release-media proof |
| `website/package.json`, `website/package-lock.json`, `website/next.config.mjs`, `website/postcss.config.mjs`, `website/jsconfig.json`, `website/.vercelignore`, `website/.gitignore` | Website build/config source | Vercel build root, ignored build output, dependency scope |

## Local Generated / Dependency Noise

| File/family | Current boundary | Audit family |
| --- | --- | --- |
| `website/.next/**` | Ignored by root `.gitignore`; generated Next.js build/dev output. | local-generated-excluded |
| `website/node_modules/**` | Ignored by root `node_modules/`; installed dependency cache. | dependency-cache-excluded |
| `website/.vercel/**` | Ignored by `website/.gitignore`; local Vercel project metadata and env. | local-deployment-metadata-excluded |
| `dist/**`, `*.zip`, `*.apk`, `*.aab` | Ignored release/build outputs. Useful for separate package parity checks, not method-level source authority. | local-generated-excluded |
| root `*.json`, `*.html`, `*.txt`, historical scratch files listed in `.gitignore` | Ignored raw YouTube capture corpus used to build renderer/path docs. | raw-evidence-excluded |
| `src/.DS_Store`, `website/.DS_Store`, `website/assets/.DS_Store`, `assets/.DS_Store`, `js/.DS_Store`, `icons/.DS_Store` | Ignored by root `.gitignore`; local filesystem artifacts. | local-junk-excluded |

## Source Surface Invariant

```text
Every file loaded by a manifest, extension page, build script, or runtime sync
path, plus every public website source file, must have one of these statuses:

  runtime-audited
  ui-audited
  release-audited
  vendor-audited
  website-audited
  quarantined
  local-junk-excluded

No YouTube content-page stylesheet may be manifest-loaded until default-hide CSS
and reveal timing have their own fixtures.
```
