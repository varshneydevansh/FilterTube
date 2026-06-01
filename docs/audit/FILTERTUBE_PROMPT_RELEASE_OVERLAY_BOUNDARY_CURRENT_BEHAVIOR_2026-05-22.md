# FilterTube Prompt Release Overlay Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior boundary.
Runtime behavior is unchanged.
This is not an implementation patch.

## Purpose

This slice promotes the older prompt/onboarding and release-note proof into the
newer source-pinned boundary format. The codebase inspection is finding
optimization and first-class JSON filter promotion blockers, but public prompts
and release-note surfaces also need a proof boundary because they can claim
runtime behavior, open extension pages, mutate prompt acknowledgement storage,
and overlap with document-start content scripts.

The active question is whether install/update prompts, release-note banners,
dashboard What's New cards, and background tab-opening behavior currently share
one reviewed prompt owner. Current behavior is split across browser manifests,
two content prompt modules, background install/update and message handlers, the
release-note data file, and the dashboard renderer.

## Current Proof Surface

| Metric | Current value |
| --- | ---: |
| prompt release boundary source files pinned | 10 |
| prompt release source/effect blocks pinned | 12 |
| browser manifest prompt load-order lists pinned | 4 |
| prompt content modules pinned | 2 |
| overlay prompt ids pinned | 2 |
| background prompt action branches pinned | 5 |
| release note data entries | 24 |
| release note version rows | 23 |
| staged newest release-note version | 3.3.2 |
| packaged extension/browser version | 3.3.2 |
| runtime implementation changed | no |

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `manifest.json` | 88 | 2,513 | `282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734` |
| `manifest.chrome.json` | 88 | 2,513 | `282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734` |
| `manifest.firefox.json` | 75 | 2,029 | `c84368c9db6a4900bb6ff055b66a645a88176d3533e307eee0dcb8d230fae2bb` |
| `manifest.opera.json` | 89 | 2,518 | `0f0b77df312bf8b45a40e652bd7fc4ee4af270945b4e38e9353ebfdc1caf1e2b` |
| `package.json` | 61 | 2,405 | `36053d322780ce787de403be574cc400936ef2a994b4c8eca62561154fe81aec` |
| `data/release_notes.json` | 317 | 23,020 | `a8d59b18e9bffd1c828538ee58b3b8e9be7c641fea3ff064220311485a3b1c6b` |
| `js/content/first_run_prompt.js` | 190 | 7,453 | `5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409` |
| `js/content/release_notes_prompt.js` | 250 | 9,866 | `30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474` |
| `js/background.js` | 6,320 | 285,103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/tab-view.js` | 11,617 | 526,763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |

## Source/Effect Blocks

| Block | Source anchor | Lines | Bytes | Current behavior pinned |
| --- | --- | ---: | ---: | --- |
| `firstRunCreatePrompt` | `js/content/first_run_prompt.js:39` | 133 | 5,412 | First-run prompt builds a fixed top-right overlay, writes inline style and an anonymous style node, reloads on primary action, and removes itself through local timers. |
| `firstRunMarkComplete` | `js/content/first_run_prompt.js:172` | 5 | 139 | Completion sends `FilterTube_FirstRunComplete` without a local sender-class or prompt-owner token. |
| `firstRunInit` | `js/content/first_run_prompt.js:177` | 12 | 453 | Eligibility asks background through `FilterTube_FirstRunCheck` and attaches one `DOMContentLoaded` listener when needed. |
| `releaseRemovePrompt` | `js/content/release_notes_prompt.js:58` | 8 | 250 | Release banner removal adds a closing class and schedules DOM removal after 180 ms. |
| `releaseAckAndDismiss` | `js/content/release_notes_prompt.js:70` | 14 | 349 | Release ack sends `FilterTube_ReleaseNotesAck` for the cached payload version and only then marks local dismissed state. |
| `releaseCreatePrompt` | `js/content/release_notes_prompt.js:87` | 147 | 6,306 | Release banner builds a neighboring fixed overlay, opens What's New through background, then falls back to `window.open` or `location.href`. |
| `releaseInit` | `js/content/release_notes_prompt.js:237` | 12 | 494 | Eligibility asks background through `FilterTube_ReleaseNotesCheck` and attaches one `DOMContentLoaded` listener when needed. |
| `backgroundLoadReleaseNotesData` | `js/background.js:1719` | 14 | 523 | Background fetches packaged `data/release_notes.json` through `runtime.getURL()` and caches it for the service-worker lifetime. |
| `backgroundBuildReleaseNotesPayload` | `js/background.js:1737` | 21 | 864 | Background builds banner/dashboard payloads from a matching release-note version or template fallback. |
| `backgroundInstalledPromptFlow` | `js/background.js:2572` | 94 | 4,281 | Install/update storage writes and proactive tab injection can set first-run refresh and release-note payload state without a prompt coordinator. |
| `backgroundPromptMessageFlow` | `js/background.js:3171` | 65 | 3,064 | Background owns release check, release ack, first-run check, first-run complete, and open What's New message branches. |
| `tabDashboardReleaseNotes` | `js/tab-view.js:2652` | 105 | 4,047 | Dashboard fetches the same release-note JSON, renders cards, marks current version, and opens `detailsUrl` links in new tabs. |

## Current Runtime Findings

| Runtime path | Current behavior | Risk class |
| --- | --- | --- |
| Manifest load order | All four manifests load `release_notes_prompt.js` before `first_run_prompt.js`, and both before `content_bridge.js`. | overlay overlap, startup order drift |
| Install flow | Install sets `firstRunRefreshNeeded: true`, marks release notes seen for `CURRENT_VERSION`, and injects only the first-run prompt into open YouTube tabs. | source-local owner, replay ambiguity |
| Update flow | Update stores a release-note payload and `firstRunRefreshNeeded: true`, then proactively injects only the first-run prompt into open YouTube tabs. | prompt priority ambiguity |
| First-run prompt | The first-run overlay has z-index `2147483647` and the release banner has `2147483646`; both use top/right `16px` fixed placement and local mobile CSS. | visual overlap, mobile fit uncertainty |
| Release ack | `FilterTube_ReleaseNotesAck` writes `releaseNotesSeenVersion` and clears `releaseNotesPayload` without a prompt-owner or trusted sender-class gate. | spoofable acknowledgement |
| First-run complete | `FilterTube_FirstRunComplete` writes `firstRunRefreshNeeded: false` without a prompt-owner or trusted sender-class gate. | spoofable acknowledgement |
| What's New open | `FilterTube_OpenWhatsNew` uses `request?.url || WHATS_NEW_PAGE_URL` and passes it directly to `tabs.create`; the content script can fall back to `window.open` or `location.href`. | URL policy drift, external navigation risk |
| Release-note data | `data/release_notes.json`, package metadata, and browser manifests all start at `3.3.2`; dashboard marks the package version current. | public-claim/version drift |
| Dashboard render | The dashboard renders `detailsUrl` as `_blank` links and consumes the same packaged JSON as the release banner. | release claim coupling |

## Optimization And JSON-First Boundary

Prompt and release-note behavior is not the filtering engine, but it can expose
claims about filtering readiness and open UI routes tied to those claims. A
future first-class JSON filter claim should not be surfaced in release prompts
until the claim is tied to runtime fixtures, version gates, and release artifacts.

This slice does not approve changing prompt behavior. It identifies where future
work needs proof:

- a single prompt owner and priority decision for install/update/replay;
- sender-class and prompt-instance proof before acknowledgement writes;
- allowlisted URL classes before opening What's New or payload links;
- viewport/safe-area proof for mobile YouTube and YouTube Kids pages;
- release-note version gates tying staged notes to package and manifest versions;
- style-node teardown and duplicate-overlay proof before adding new prompts.

## Missing Runtime Authority Symbols

The current product runtime does not contain these symbols:

- `promptReleaseOverlayBoundaryContract`
- `promptCoordinatorDecisionReport`
- `promptPriorityQueueContract`
- `promptAckSenderClassGate`
- `promptWhatsNewUrlPolicy`
- `promptViewportFitReport`
- `promptReleaseNoteVersionGate`
- `promptStyleTeardownRegistry`
- `promptInstallUpdateFixtureProvenance`
- `promptFirstClassJsonClaimGate`

Until those or equivalent reviewed mechanisms exist with fixtures and metrics,
this audit slice is evidence of current behavior only.

## Non-Completion Boundary

This does not complete the active goal. It adds current-behavior proof for one
prompt, release-note, manifest load-order, background message, dashboard,
external-navigation, mobile viewport, public-claim, and cross-feature boundary,
but it does not prove every feature, file, method, JSON path, DOM selector,
runtime observer/listener/timer, settings mode, or cross-feature interaction.

Required future proof before changing prompt or release-note behavior:

| Gate | Required proof before implementation |
| --- | --- |
| Prompt owner and priority | Fixtures proving install, update, replay, and simultaneous prompt eligibility resolve to one visible owner. |
| Acknowledgement authority | Sender-class and prompt-instance fixtures proving wrong senders cannot mark prompts complete or seen. |
| URL navigation policy | Allowlist fixtures proving only extension-owned What's New URLs or reviewed external release URLs can open. |
| Mobile viewport fit | Visual fixtures for desktop, mobile YouTube, YouTube Kids, short-height, and safe-area layouts. |
| Release version gate | Package, manifest, release-note, and public-claim fixtures proving staged notes cannot imply shipped runtime behavior. |
| JSON-first public claim gate | Release-note text and CTA fixtures tied to runtime JSON-first proof artifacts before user-facing promotion. |

## Linked Evidence

- `tests/runtime/prompt-release-overlay-boundary-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_PROMPT_ONBOARDING_AUTHORITY_AUDIT_2026-05-18.md`
- `tests/runtime/prompt-onboarding-authority-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_P0_PROMPT_ONBOARDING_CURRENT_BEHAVIOR_2026-05-19.md`
- `tests/runtime/p0-prompt-onboarding-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `tests/runtime/prompt-onboarding-method-semantic-register-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this release/package/public-claim surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, release package behavior, public release
claims, prompt release overlays, raw-capture packaging, whitelist behavior,
metric collectors, artifact creation, native sync, or release publication.
