# FilterTube Mobile App Handoff Context

## Why this exists

This file is the compact handoff baseline for starting a new chat or app-focused implementation thread without replaying the full extension, Nanah, and YouTube APK research history.

## Current product direction

FilterTube mobile, tablet, and TV should be:

- a supervised viewing environment
- extension-parity in mental model
- native-shell-first
- managed-web-surface for content
- local-first for rules and profile authority

It should not be:

- a generic browser
- a patched third-party client
- a clone of the upstream app
- an ad blocker

## Core architecture decision

Recommended MVP:

- Android phone/tablet/TV: Kotlin native shell + WebView
- iPhone/iPad: Swift native shell + WKWebView
- shared JS or TS runtime for:
  - identity normalization
  - compiled matcher
  - YTD/YTM/YTK adapters
  - watch-context tracking
  - continuation tracking

Native owns:

- profiles
- parent and child authority
- PIN
- Nanah sync
- import/export
- launcher
- parent overlay
- fullscreen/back/orientation policy
- settings

Injected runtime owns:

- page observation
- JSON and DOM filtering
- identity extraction
- local matching
- adapter health reporting

## Key evidence behind this

From the YouTube APK reports:

- the Android app uses a native watch shell, not a thin browser wrapper
- watch-next, continuation, parse, cache, and prefetch seams are explicit
- fullscreen, PiP, back behavior, and shell state are native-owned
- WebView appears peripheral or fallback, not central to the main watch shell
- kids allowlist and blacklist are first-class supervised concepts

Product implication:

- FilterTube should copy the seam ownership pattern, not the private protocol stack

## UX direction

The app should feel familiar to existing extension users.

Preserve:

- profile model
- whitelist and blocklist vocabulary
- parent controls
- sync and backup concepts
- help and privacy language

Do not introduce a totally new dashboard logic that forces users to relearn the product.

Primary UI wording should prefer:

- `Main Viewing`
- `Kids Viewing`
- `Profiles`
- `Parent Controls`
- `Sync and Backup`
- `Safe Exit`

Avoid using third-party platform branding in the primary app shell.

Startup rule to preserve:

- first launch shows two obvious buttons:
  - `Main Viewing`
  - `Kids Viewing`
- user enters one immediately
- user can then save that as the default launch target
- later launches open the saved default directly
- if the launch target or chosen profile is PIN-protected, require profile selection or PIN before access

## Repo strategy

Recommended:

- public repo: FilterTube extension
- private repo: FilterTube mobile and TV app
- shared runtime extracted from extension logic and vendored into app at build time

Do not hot-load executable runtime JS from GitHub in production.

Preferred update model:

1. extension repo remains upstream for shared runtime logic
2. app repo syncs shared runtime at build time
3. bundled runtime ships inside app releases

## Shared vs non-shared code

Good shared candidates:

- `js/shared/identity.js`
- matcher core from `js/filter_logic.js`
- page adapters
- watch-context tracker
- continuation tracker
- compiled payload schema
- bridge event schema

Do not directly share:

- `background.js`
- `tab-view.js`
- popup/options shell
- browser storage glue
- extension manifest/runtime-specific wiring

## Design correction from recent discussion

Do not model the app as a polished marketing-card launcher that forgets the extension's structure.

The app can be more refined visually, but it should keep:

- extension parity in terminology
- extension parity in rule organization
- extension parity in sync and trust explanation
- extension parity in profile and PIN logic

Users should feel:

- "this is FilterTube on mobile and TV"

not:

- "this is a different product with the same brand"

## Immediate next build priorities

1. Android Studio project
2. Kotlin shell
3. WebView loading main and kids surfaces
4. injected JS hello-world
5. native bridge round trip
6. parent overlay
7. PIN flow
8. minimal rule application
9. fullscreen and back handling
10. watch-context and continuation-state prototype

## If starting a new chat

Start from these docs first:

- [filtertube_mobile_tv_architecture_plan.md](/Users/devanshvarshney/FilterTube/docs/filtertube_mobile_tv_architecture_plan.md)
- [filtertube_mobile_runtime_adapter_plan.md](/Users/devanshvarshney/FilterTube/docs/filtertube_mobile_runtime_adapter_plan.md)
- [MOBILE_APP_UI_SPEC.md](/Users/devanshvarshney/FilterTube/docs/MOBILE_APP_UI_SPEC.md)
- [MOBILE_APP_HANDOFF_CONTEXT.md](/Users/devanshvarshney/FilterTube/docs/MOBILE_APP_HANDOFF_CONTEXT.md)
