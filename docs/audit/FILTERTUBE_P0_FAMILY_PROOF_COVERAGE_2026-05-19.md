# FilterTube P0 Family Proof Coverage - 2026-05-19

Status: audit coverage index. This is not an implementation patch.

This document maps every P0 family from
`docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md` to the current
proof artifact that pins today's behavior. It does not mark the gate green.
It proves that each family now has at least one source-backed current-behavior
slice, while future behavior remains blocked until positive/negative fixtures
and side-effect counters are added for the exact change being made.

Runtime proof: `tests/runtime/p0-family-proof-coverage-current-behavior.test.mjs`

## Coverage Rule

```text
readiness gate family
  -> at least one current-behavior doc
  -> at least one runnable current-behavior test
  -> family fixture names remain in the readiness gate
  -> current verdict remains not green / blocked / not implementation-ready
```

## P0 Family Coverage Index

| P0 family | Current proof doc | Runtime proof | Current verdict |
| --- | --- | --- | --- |
| no-work | `docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md` | `tests/runtime/p0-no-work-current-behavior.test.mjs` | Empty/disabled runtime work is proof-pinned, not fixed. |
| endpoint policy | `docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md` | `tests/runtime/p0-endpoint-policy-current-behavior.test.mjs` | Endpoint parse/rewrite policy remains blocked. |
| network/fetch authority | `docs/audit/FILTERTUBE_P0_NETWORK_AUTHORITY_CURRENT_BEHAVIOR_2026-05-18.md` | `tests/runtime/p0-network-authority-current-behavior.test.mjs` | Network/fetch side-effect authority remains blocked. |
| external navigation/link authority | `docs/audit/FILTERTUBE_P0_EXTERNAL_NAVIGATION_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-external-navigation-current-behavior.test.mjs` | External open/link authority remains blocked. |
| release package parity | `docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-release-package-current-behavior.test.mjs` | Package/public artifact proof remains blocked. |
| native runtime sync authority | `docs/audit/FILTERTUBE_P0_NATIVE_RUNTIME_SYNC_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-native-runtime-sync-current-behavior.test.mjs` | Extension/app runtime sync authority remains blocked. |
| content/category predicates | `docs/audit/FILTERTUBE_P0_CONTENT_CATEGORY_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-content-category-current-behavior.test.mjs` | Predicate activation and route scope remain blocked. |
| keyword match authority | `docs/audit/FILTERTUBE_P0_KEYWORD_MATCH_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-keyword-match-current-behavior.test.mjs` | Keyword exactness/comment/provenance authority remains blocked. |
| stats/time-saved authority | `docs/audit/FILTERTUBE_P0_STATS_TIME_SAVED_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-stats-time-saved-current-behavior.test.mjs` | Stats and saved-time side-effect authority remains blocked. |
| backup/export authority | `docs/audit/FILTERTUBE_P0_BACKUP_EXPORT_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-backup-export-current-behavior.test.mjs` | Backup/export/import/Nanah restore authority remains blocked. |
| profile/viewing-space authority | `docs/audit/FILTERTUBE_P0_PROFILE_VIEWING_SPACE_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-profile-viewing-space-current-behavior.test.mjs` | Profile/viewing-space compile and mutation authority remains blocked. |
| watch/player control authority | `docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Watch/player/comment/rail/fullscreen authority remains blocked. |
| capture fixture traceability | `docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-capture-fixture-traceability-current-behavior.test.mjs` | Raw captures still need minimal fixture extraction before behavior changes. |
| message trust | `docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Sender trust and message side-effect authority remains blocked. |
| lifecycle | `docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md` | `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | Observer/listener/timer zero-work and teardown authority remains blocked. |
| hide/restore authority | `docs/audit/FILTERTUBE_P0_HIDE_RESTORE_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-hide-restore-current-behavior.test.mjs` | Visual writer/marker/restore authority remains blocked. |
| selector authority | `docs/audit/FILTERTUBE_P0_SELECTOR_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-selector-authority-current-behavior.test.mjs` | Route/surface/action selector authority remains blocked. |
| storage/cache key authority | `docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Storage dependency, invalidation, and revision authority remains blocked. |
| mutation | `docs/audit/FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-mutation-current-behavior.test.mjs` | Lost/destructive mutation and revision authority remains blocked. |
| prompt/onboarding | `docs/audit/FILTERTUBE_P0_PROMPT_ONBOARDING_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-prompt-onboarding-current-behavior.test.mjs` | Prompt owner, ack, and URL authority remains blocked. |
| manifest/permission | `docs/audit/FILTERTUBE_P0_MANIFEST_PERMISSION_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-manifest-permission-current-behavior.test.mjs` | Browser package startup and permission authority remains blocked. |
| security/PIN lock | `docs/audit/FILTERTUBE_P0_SECURITY_PIN_LOCK_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-security-pin-lock-current-behavior.test.mjs` | Lock/session mutation authority remains blocked. |
| rule mutation authority | `docs/audit/FILTERTUBE_P0_RULE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md` | `tests/runtime/p0-rule-mutation-current-behavior.test.mjs` | Rule writer actor/target/effect/revision authority remains blocked. |

## Supplemental P0 Slices

Some current-behavior slices are narrower than the readiness-gate family names
but remain important blockers for implementation:

| Supplemental slice | Why it matters |
| --- | --- |
| `docs/audit/FILTERTUBE_P0_COMPILED_RULE_STATE_CURRENT_BEHAVIOR_2026-05-19.md` | Connects no-work, endpoint, DOM, menu, quick-block, content/category, and stale-alias active-state splits. |
| `docs/audit/FILTERTUBE_P0_DOM_RENDERER_CURRENT_BEHAVIOR_2026-05-19.md` | Bridges JSON renderer gaps and DOM target/selector gaps. |
| `docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md` | Pins concrete renderer leaks and false-hide risks before JSON expansion. |
| `docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md` | Adds lock/import/Nanah settings mutation proof around the generic mutation family. |
| `docs/audit/FILTERTUBE_P0_LEARNED_IDENTITY_CURRENT_BEHAVIOR_2026-05-19.md` | Pins identity-map provenance, cache, and DOM-rerun risks that cut across renderers, settings, and menu actions. |

## Current Verdict

```text
Every readiness-gate P0 family has at least one current-behavior proof slice.
No readiness-gate P0 family has future-behavior proof yet.
The implementation gate remains closed.
```

This means the audit has moved from scattered discovery toward a complete
family-level proof map, but it is not the same as final audit completion.
Completion still requires method/path/selector/lifecycle/setting-mode coverage
to move from current-gap proof to behavior-backed positive and negative proof
for every feature and cross-feature interaction.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 family proof ledger can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
