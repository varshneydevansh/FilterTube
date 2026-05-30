# FilterTube Tracked Public Doc Claim Surface Current Behavior - 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an implementation patch.

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

## Scope

`git ls-files 'docs/*.md'` currently returns 33 tracked root-level documentation files. This slice covers the 29 tracked product/public docs that are not already covered by `docs/audit/FILTERTUBE_JSON_FIRST_REFERENCE_DOC_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md`.

Excluded because they already have a focused JSON-reference audit:

- `docs/JSON_FIRST_FILTERING_PLAN.md`
- `docs/json_paths_encyclopedia.md`
- `docs/watch_json_paths.md`
- `docs/youtube_renderer_inventory.md`

Ignored local docs are outside the tracked-doc obligation surface: `docs/MOBILE_APP_UI_SPEC.md`, `docs/spa-collab-watchlist-handoff.md`, and `docs/subscribed-channels-whitelist-import-plan.md`.

## Current Fingerprints

The 29 docs below have 16,072 newline counts and 693,919 bytes in current worktree content.

| Path | Newlines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `docs/ANDROID_PUBLIC_DISTRIBUTION.md` | 91 | 4,545 | `c4ae25ab8038caa3effe34b973eedd3832bb3543b4fa73113a25bb8938c2fce2` |
| `docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md` | 156 | 5,797 | `c4831186eb625020d557681392b52ba605132c07537a2561e296cbf082a880d1` |
| `docs/ARCHITECTURE.md` | 1714 | 71,575 | `d47fab9c67fbbcac58580cab13da0da2feb5c118a380cdfc237855c1a957e882` |
| `docs/CHANNEL_BLOCKING_SYSTEM.md` | 1106 | 48,770 | `ce42fcd17dc8f8bb35b484b7bb979028c4bac7f83aa152324c1c7027ea0b251a` |
| `docs/CODEMAP.md` | 265 | 19,634 | `4ccca1a4629a19889e78760974ad5aeb5754dbc9e0fd47e1821da9b4394899a8` |
| `docs/CONTENT_HIDING_PLAYBOOK.md` | 658 | 34,262 | `b81e15f9d62c3e2e76b13c8b2fe5fa47a1586885208893dd9c3af0d109b597d3` |
| `docs/DATA_PORTABILITY_SYNC_WHITELIST_PLAN.md` | 621 | 20,500 | `bcc435a2d18ab9587b7e69e76851f9759dd972bcb12f6484d5ed6cb19f001fd8` |
| `docs/DEVELOPER_GUIDE.md` | 536 | 15,150 | `9d8e05d19135625379b691b9aaddefb312fccb6e13d2d14c5ec4e4d63ce552c5` |
| `docs/FUNCTIONALITY.md` | 872 | 45,044 | `cf9cbe10dc8333ca5404fa950d2cef39a7906cecc0f8025c7be56eaddb95bf1e` |
| `docs/LEGACY_CHANNELS.md` | 40 | 2,056 | `53d12f59900027c06e2cc5d599f6f488885ad284a046fb18059e21370ec029de` |
| `docs/MOBILE_APP_HANDOFF_CONTEXT.md` | 200 | 5,965 | `b9b9d182d76e113682c09574842ddddcc33712cb4650b15005d0358c9b6c0c73` |
| `docs/NANAH_MANAGED_LINK_QA.md` | 147 | 4,092 | `3b83b2380c851da49852c1cc6a009aac0174866e12d445fdb86a96164cc90422` |
| `docs/NANAH_P2P_PROJECT_PLAN.md` | 456 | 13,431 | `bf1566eafbe7c68ab133d56a48e49ae404cd1d7f03da04ba3831d62b5db6b19f` |
| `docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md` | 169 | 17,134 | `54ae9a8d973609ccc8ac0ea3611c9caffe1af9c6d262978b3da160d7a798e078` |
| `docs/NANAH_USER_GUIDE.md` | 208 | 5,493 | `3f13761a36c502da128e53450334b855b881a0e5009d99607fa19b4d60dc1ed7` |
| `docs/NETWORK_REQUEST_PIPELINE.md` | 1052 | 35,212 | `a7643d9dd513e0865f2816e639dd481113e2b671fe35eac22268bd1f95d9a40b` |
| `docs/PROACTIVE_CHANNEL_IDENTITY.md` | 674 | 24,303 | `8c99c2ad84817b9d47dde9156a476b6883091b3b828cdf5fac89aa4b6415ed96` |
| `docs/PROFILES_PIN_MODEL.md` | 613 | 26,872 | `31c3645a3d2829ca61cc51a9ca341ab7b05b634141594a7cab81dc75466c8082` |
| `docs/SUBSCRIBED_CHANNELS_IMPORT.md` | 291 | 10,550 | `afe276f3964bc9ba9991ae71c21066219bc740f8ee478902f3d3cb3cb23d295c` |
| `docs/TECHNICAL.md` | 2163 | 87,928 | `3518c7d72339d7162e681ce2277ea54dd76f601bba692a4b133b95f02aeb58f9` |
| `docs/THREE_DOT_MENU_IMPROVEMENTS.md` | 597 | 24,571 | `bc97c3fe73b678b649846fb7ce442c9e8cdd8d3141516f39b0ae248f18d46324` |
| `docs/WATCH_PLAYLIST_BREAKDOWN.md` | 549 | 36,711 | `d032dc823b5d9bdc0a142191eca17838ec11cfaf7b42203aae2d007838dd4698` |
| `docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md` | 125 | 5,319 | `431164028d05d829d959ddd8676b03587660abadd23d3a4b60e2834dae9a02e3` |
| `docs/YOUTUBE_KIDS_INTEGRATION.md` | 774 | 28,403 | `c752ec50fd8afdb689ec04e54fcefa6ceb5500d472f20d669ed88c08637de057` |
| `docs/collab_three_dot_ui_google_aistudio.md` | 397 | 28,346 | `af45e120882611e93a04340fc7c004c984e2a571b65b1f3d3c79abf8bd53b94a` |
| `docs/filtertube-scenic-media-prompt-brief.md` | 316 | 13,328 | `c9d6cc852c3ba749e14ba09fad4fbad2b1fbe9e99c6d05ac28f75ce91ce38497` |
| `docs/filtertube-serene-website-platform-expansion-plan.md` | 500 | 27,547 | `ea957de2d3e171a7dd3caf8f7b7c9683cbd631d2f7a2c2adcc89ef5a6ed8fcd5` |
| `docs/filtertube_mobile_runtime_adapter_plan.md` | 366 | 10,943 | `f73a43c0836e0b7ee2a37860bd5009512b53fa5247279b0667e85c1a2390d18c` |
| `docs/filtertube_mobile_tv_architecture_plan.md` | 416 | 20,438 | `f86169e132f7ced02bdf8ac291b96531e3ab569ee0cb6fe2d5f1ca820901ee97` |

## Structure Counts

Across these 29 docs:

- H1 headings: 29
- H2 headings: 376
- H3 headings: 676
- Inline-code spans: 3,099
- Absolute local path strings: 144
- File-reference tokens for product/build/site paths: 291

## Claim Token Counts

These counts are lexical evidence only. They identify language that needs runtime, fixture, release, native, or metric proof before it can authorize behavior.

| Token class | Count |
| --- | ---: |
| s/t phrase | 11 |
| complete | 41 |
| implemented | 7 |
| guarantee | 14 |
| always | 22 |
| never | 37 |
| zero | 17 |
| instant | 25 |
| performance | 34 |
| optimization | 13 |
| runtime | 108 |
| release | 93 |
| native | 108 |
| sync | 183 |
| JSON-first | 9 |
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

1. Documentation claim language is broad enough to be mistaken for runtime proof. Current docs contain 41 `complete`, 14 `guarantee`, 17 `zero`, 25 `instant`, and 34 `performance` tokens before line-specific fixture and metric authority exists for every route/mode/surface.
2. Release/native/sync language is dense: 93 `release`, 108 `native`, and 183 `sync` tokens. These docs need package artifact, native runtime freshness, app revision, and generated-resource parity proof before release or app behavior changes rely on them.
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
