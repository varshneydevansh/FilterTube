# FilterTube Tracked Public Doc Claim Surface Current Behavior - 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an implementation patch.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Scope

`git ls-files 'docs/*.md'` currently returns 33 tracked root-level documentation files. This slice covers the 29 tracked product/public docs that are not already covered by `docs/audit/FILTERTUBE_JSON_FIRST_REFERENCE_DOC_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md`.

Excluded because they already have a focused JSON-reference audit:

- `docs/JSON_FIRST_FILTERING_PLAN.md`
- `docs/json_paths_encyclopedia.md`
- `docs/watch_json_paths.md`
- `docs/youtube_renderer_inventory.md`

Ignored local docs are outside the tracked-doc obligation surface: `docs/MOBILE_APP_UI_SPEC.md`, `docs/spa-collab-watchlist-handoff.md`, and `docs/subscribed-channels-whitelist-import-plan.md`.

## Current Fingerprints

The 29 docs below have 16,276 newline counts and 707,346 bytes in current worktree content.

| Path | Newlines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `docs/ANDROID_PUBLIC_DISTRIBUTION.md` | 91 | 4,545 | `c4ae25ab8038caa3effe34b973eedd3832bb3543b4fa73113a25bb8938c2fce2` |
| `docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md` | 173 | 6,691 | `15dfa4c585061c21a34df271c1f3390cca7776a0b9435661858f025c2d2834d0` |
| `docs/ARCHITECTURE.md` | 1738 | 72,837 | `63da6f0edae079a1730f7b6790ba3183cdd8ba8511633d4eba5b7e5d29e6b448` |
| `docs/CHANNEL_BLOCKING_SYSTEM.md` | 1113 | 49,350 | `61b5ef34d05dd9e722468629151499167f491adf67dea4a39561dc413456c845` |
| `docs/CODEMAP.md` | 277 | 21,006 | `6c4fc1586083d62c5a2d91bfe51048a193050422e6fa82c0cdc1901fdb969dfc` |
| `docs/CONTENT_HIDING_PLAYBOOK.md` | 680 | 35,315 | `a57b703ae626f58911fb37f898cd166c880899359c80734a29f11763d31ed3e9` |
| `docs/DATA_PORTABILITY_SYNC_WHITELIST_PLAN.md` | 621 | 20,500 | `bcc435a2d18ab9587b7e69e76851f9759dd972bcb12f6484d5ed6cb19f001fd8` |
| `docs/DEVELOPER_GUIDE.md` | 546 | 15,805 | `f790737e4e8f6b8d0544c072b5caa0448f4f3ac194c519033f05f7e348af9dbb` |
| `docs/FUNCTIONALITY.md` | 881 | 45,960 | `8b4608a0874c4b925b11f1d425692fb9ecc031b14bb4474cbeb3ea6da74b0f60` |
| `docs/LEGACY_CHANNELS.md` | 40 | 2,056 | `53d12f59900027c06e2cc5d599f6f488885ad284a046fb18059e21370ec029de` |
| `docs/MOBILE_APP_HANDOFF_CONTEXT.md` | 221 | 6,991 | `da2659310107397e03f3d30f604302304b344cd711dc3a809c1ea24bb9e832b5` |
| `docs/NANAH_MANAGED_LINK_QA.md` | 147 | 4,092 | `3b83b2380c851da49852c1cc6a009aac0174866e12d445fdb86a96164cc90422` |
| `docs/NANAH_P2P_PROJECT_PLAN.md` | 456 | 13,431 | `bf1566eafbe7c68ab133d56a48e49ae404cd1d7f03da04ba3831d62b5db6b19f` |
| `docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md` | 169 | 17,134 | `54ae9a8d973609ccc8ac0ea3611c9caffe1af9c6d262978b3da160d7a798e078` |
| `docs/NANAH_USER_GUIDE.md` | 208 | 5,493 | `3f13761a36c502da128e53450334b855b881a0e5009d99607fa19b4d60dc1ed7` |
| `docs/NETWORK_REQUEST_PIPELINE.md` | 1067 | 36,009 | `1868caad4f29a05f17d784eed352d1b231ae358e576d02c19a4d3987f97ca5a5` |
| `docs/PROACTIVE_CHANNEL_IDENTITY.md` | 684 | 25,024 | `88e2d2ac6935b8fe623dcc776ac9ac25e94a758196b0c527adceb6c6aa7d0d41` |
| `docs/PROFILES_PIN_MODEL.md` | 613 | 26,872 | `31c3645a3d2829ca61cc51a9ca341ab7b05b634141594a7cab81dc75466c8082` |
| `docs/SUBSCRIBED_CHANNELS_IMPORT.md` | 291 | 10,550 | `afe276f3964bc9ba9991ae71c21066219bc740f8ee478902f3d3cb3cb23d295c` |
| `docs/TECHNICAL.md` | 2173 | 89,075 | `9060a8d98bce4ffb4e682aaaef886482e028b0aeea25f86bc48f8e14839371c9` |
| `docs/THREE_DOT_MENU_IMPROVEMENTS.md` | 605 | 25,117 | `cfce8072c7b827f96ceaa8812c7196efd364b295481ead3b055ed1cab5b785c6` |
| `docs/WATCH_PLAYLIST_BREAKDOWN.md` | 550 | 36,988 | `5f849eb9fc7bda3f54dc350d6aafe958fedccd43c9dafd1dc1eb2ffb18cfa804` |
| `docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md` | 156 | 6,939 | `216eb966bfebc8a6024f39d8ca30e0a5a8898e37c7dff4c5e1646cf6fb5b46d9` |
| `docs/YOUTUBE_KIDS_INTEGRATION.md` | 781 | 28,964 | `25e1326cb069e5728b81a74177005139e57659152dcf66f0a559976fa0f77476` |
| `docs/collab_three_dot_ui_google_aistudio.md` | 397 | 28,346 | `af45e120882611e93a04340fc7c004c984e2a571b65b1f3d3c79abf8bd53b94a` |
| `docs/filtertube-scenic-media-prompt-brief.md` | 316 | 13,328 | `c9d6cc852c3ba749e14ba09fad4fbad2b1fbe9e99c6d05ac28f75ce91ce38497` |
| `docs/filtertube-serene-website-platform-expansion-plan.md` | 500 | 27,547 | `ea957de2d3e171a7dd3caf8f7b7c9683cbd631d2f7a2c2adcc89ef5a6ed8fcd5` |
| `docs/filtertube_mobile_runtime_adapter_plan.md` | 366 | 10,943 | `f73a43c0836e0b7ee2a37860bd5009512b53fa5247279b0667e85c1a2390d18c` |
| `docs/filtertube_mobile_tv_architecture_plan.md` | 416 | 20,438 | `f86169e132f7ced02bdf8ac291b96531e3ab569ee0cb6fe2d5f1ca820901ee97` |

## Structure Counts

Across these 29 docs:

- H1 headings: 29
- H2 headings: 388
- H3 headings: 681
- Inline-code spans: 3,136
- Absolute local path strings: 146
- File-reference tokens for product/build/site paths: 306

## Claim Token Counts

These counts are lexical evidence only. They identify language that needs runtime, fixture, release, native, or metric proof before it can authorize behavior.

| Token class | Count |
| --- | ---: |
| s/t phrase | 12 |
| complete | 42 |
| implemented | 7 |
| guarantee | 14 |
| always | 22 |
| never | 37 |
| zero | 17 |
| instant | 25 |
| performance | 34 |
| optimization | 13 |
| runtime | 129 |
| release | 146 |
| native | 118 |
| sync | 201 |
| JSON-first | 12 |
| first-class | 4 |
| authority | 27 |
| manifest | 4 |
| fetch | 217 |
| observer | 12 |
| listener | 8 |
| timer | 4 |

Highest current claim-density rows by the narrow risk token sum:

| Path | Risk sum | complete | guarantee | always | never | zero | instant | performance | optimization |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `docs/TECHNICAL.md` | 27 | 6 | 1 | 2 | 7 | 2 | 2 | 5 | 2 |
| `docs/CHANNEL_BLOCKING_SYSTEM.md` | 20 | 4 | 4 | 2 | 2 | 2 | 4 | 0 | 2 |
| `docs/WATCH_PLAYLIST_BREAKDOWN.md` | 17 | 4 | 0 | 2 | 6 | 0 | 4 | 1 | 0 |
| `docs/ARCHITECTURE.md` | 15 | 2 | 2 | 0 | 2 | 2 | 3 | 2 | 2 |
| `docs/CONTENT_HIDING_PLAYBOOK.md` | 15 | 4 | 0 | 0 | 1 | 1 | 1 | 4 | 4 |
| `docs/PROACTIVE_CHANNEL_IDENTITY.md` | 14 | 5 | 1 | 0 | 1 | 1 | 2 | 4 | 0 |
| `docs/collab_three_dot_ui_google_aistudio.md` | 12 | 3 | 0 | 1 | 4 | 0 | 4 | 0 | 0 |
| `docs/FUNCTIONALITY.md` | 12 | 2 | 1 | 1 | 3 | 0 | 0 | 4 | 1 |
| `docs/NETWORK_REQUEST_PIPELINE.md` | 11 | 2 | 2 | 0 | 0 | 0 | 1 | 5 | 1 |
| `docs/YOUTUBE_KIDS_INTEGRATION.md` | 11 | 2 | 2 | 1 | 1 | 3 | 2 | 0 | 0 |

## Runtime And Build Boundary

The tracked docs are not package input by default. Current product/build/source scan found one non-doc source reference to these 29 docs: `website/assets/videos/README.md` links to `/Users/devanshvarshney/FilterTube/docs/filtertube-scenic-media-prompt-brief.md`. That is a website asset note, not runtime behavior authority.

`build.js` does not list `docs` in the package-copy directory set. The public browser package currently copies `README.md`, `CHANGELOG.md`, and `LICENSE` as root metadata, not these tracked product docs.

## Risk Findings

1. Documentation claim language is broad enough to be mistaken for runtime proof. Current docs contain 42 `complete`, 14 `guarantee`, 17 `zero`, 25 `instant`, and 34 `performance` tokens before line-specific fixture and metric authority exists for every route/mode/surface.
2. Release/native/sync language is dense: 146 `release`, 118 `native`, and 201 `sync` tokens. These docs need package artifact, native runtime freshness, app revision, and generated-resource parity proof before release or app behavior changes rely on them.
3. Network/lifecycle terms are present but not executable coverage: 217 `fetch`, 12 `observer`, 8 `listener`, and 4 `timer` tokens. These words must cite source loci, budgets, teardown ownership, no-work proof, and negative fixtures before optimization or cleanup.
4. The 144 absolute local path strings are useful for developer context but are not portable product contracts. They need release-safe path, repo-boundary, and generated/native path parity decisions before public docs can rely on them.
5. `docs/filtertube-scenic-media-prompt-brief.md` is referenced by website asset documentation, but no product loader consumes its contents. It remains a prompt/provenance note rather than a website behavior contract.

## Non-Completion Boundary

This slice does not close the tracked-doc rows. The following remain missing before these docs can authorize behavior, releases, deletion, or optimization:

- claim-to-runtime traceability per claim family
- line-specific source and test references for broad reliability claims
- route/surface/profile/list-mode fixtures for filtering and identity claims
- release package artifact parity for public distribution docs
- native app revision and generated-runtime freshness proof
- performance metric artifacts for each route/browser/device/rule-state claim
- network and lifecycle no-work budgets for fetch/observer/listener/timer language
- ignored-doc and tracked-doc migration decisions
- public docs deletion/readiness reports
- first-class JSON filter promotion gates

No `trackedPublicDocClaimAuthority`, `trackedPublicDocRuntimeParityReport`, `trackedPublicDocReleaseParityReport`, `trackedPublicDocNativeParityReport`, `trackedPublicDocMetricAuthority`, `trackedPublicDocLifecycleBudget`, `trackedPublicDocIgnoredBoundaryReport`, `trackedPublicDocDeletionReadinessReport`, or `trackedPublicDocJsonFirstPromotionGate` exists in product source yet.

## First Optimization Rollback Unclaimed Surface Boundary Addendum

First optimization rollback unclaimed surface boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs`
isolates rollback, unclaimed-surface, native sync, release package,
raw-capture, diagnostic performance, and public-claim limits before any
metric-foundation artifact is committed or runtime behavior changes. The
addendum pins 12 rollback/unclaimed boundary rows, 8 release/native/public
source docs covered, 0 committed rollback/unclaimed artifacts, 0 runtime
rollback approvals, 0 runtime unclaimed-surface approvals, 0 runtime metric
collector approvals, 0 implementation-ready rollback/unclaimed rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It keeps JSON-first, whitelist, collector, native,
release, and public claim work blocked until measured surfaces, unclaimed
surfaces, rollback command, artifact absence, authority absence, raw-capture
exclusion, and release/public claim limits are proved.
