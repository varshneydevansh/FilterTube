# FilterTube P0 Settings Mutation Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice narrows the settings/mutation audit around locked profiles, list-mode
transfer, Kids rule mutations, encrypted imports, and Nanah profile-scoped sync.
These are the paths that can corrupt or bypass user intent if simultaneous
allow/block, import cleanup, or sender hardening is implemented without proof.

## P0 Fixture Families Covered

```text
P0 security/PIN lock:
  locked_profile_rejects_set_list_mode
  locked_profile_rejects_add_whitelist_channel
  locked_profile_rejects_transfer_whitelist_to_blocklist
  settings_mode_locked_profile_rejects_all_rule_mutations

P0 rule mutation authority:
  rule_mutation_report_exists_for_kids_block_and_whitelist
  rule_mutation_report_exists_for_list_mode_transfer
  rule_mutation_report_exists_for_nanah_scoped_apply

P0 import/export/Nanah:
  encrypted_import_preserves_target_profile_id
  nanah_envelope_requires_filtertube_app_action_version
```

These names are future expectations. The current tests intentionally pin where
today's source is weaker, split, or missing a structured authority report.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `locked_profile_rejects_set_list_mode` | `FilterTube_SetListMode` checks trusted UI sender, but does not call `isProfileSessionAuthorized()` before changing mode, clearing/moving lists, invalidating caches, scheduling backup, and broadcasting refresh. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Locked profiles should reject mode mutation unless an explicit session unlock authorizes the active target profile. |
| `locked_profile_rejects_add_whitelist_channel` | `addWhitelistChannelPersistent` checks trusted UI sender, but does not check profile session authorization before adding a Main whitelist channel. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Single-row rule mutations should share the same lock/session result as bulk import. |
| `locked_profile_rejects_transfer_whitelist_to_blocklist` | `FilterTube_TransferWhitelistToBlocklist` checks trusted UI sender, then moves allow-list rows into blocklists and clears whitelist arrays without lock/session proof or dry-run mutation report. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Destructive transfers need target profile, lock result, preview, mutation plan, rollback, and user intent proof. |
| `settings_mode_locked_profile_rejects_all_rule_mutations` | Batch subscription import checks `isProfileSessionAuthorized()`, but SetListMode, Kids whitelist, and Kids block branches do not share that lock gate. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Every rule mutation path should use one lock contract, not per-feature partial gates. |
| `rule_mutation_report_exists_for_kids_block_and_whitelist` | Kids whitelist is trusted-UI gated while Kids block is not; neither returns a rule mutation report with sender, target profile, list, revision, lock result, or side effects. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Kids block and allow rows need the same authority report and sender/lock gate. |
| `rule_mutation_report_exists_for_list_mode_transfer` | `FilterTube_SetListMode` combines mode change, list transfer, legacy mirror clearing, cache invalidation, backup scheduling, and tab refresh in one branch without a dry-run mutation report. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Mode transfer must be a plan-then-apply mutation with explicit copy/clear behavior. |
| `encrypted_import_preserves_target_profile_id` | `importV3()` supports `targetProfileId`, but `importV3Encrypted()` does not accept or forward it. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Encrypted and unencrypted import options must share one typed option object and target-profile behavior. |
| `nanah_envelope_requires_filtertube_app_action_version` | `extractPortableFromEnvelope()` parses `app_sync` and `control_proposal` payloads without validating app id, payload version, proposal action, or allowed operation. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Nanah envelopes should validate FilterTube app identity, payload version, action, scope, and strategy before exposing payloads. |
| `rule_mutation_report_exists_for_nanah_scoped_apply` | `applyScopedPortablePayload()` falls back to the active profile, writes V4 directly, and returns success without a lock result, revision, refresh/broadcast result, or mutation report. | `tests/runtime/p0-settings-mutation-current-behavior.test.mjs` | Nanah scoped apply needs preview confirmation, target profile authority, lock/trust result, schema validation, revision, refresh, and per-write status. |

## Why This Matters

```text
visible UI lock
  -> trusted UI sender
      -> some mutation branches check session lock
      -> sibling mutation branches skip session lock
          -> storage write / list transfer / cache invalidation / refresh

Nanah or encrypted import
  -> target profile may be explicit in one path
  -> sibling path can fall back to active profile
      -> profile-scoped rule writes without one mutation report
```

This is a data-shape risk, not just a security wording issue. If a future dual
allow/block schema is layered on top of these branches, a locked profile,
encrypted backup, or P2P payload can still enter through a sibling mutation path
that does not carry the same target-profile or lock proof.

## Required Future Settings Mutation Contract

Every settings/rule mutation needs one report:

```text
settingsMutationAuthority
  -> senderClass
  -> source surface
  -> target profile and target viewing space
  -> lock/session result
  -> operation type and user intent
  -> normalized input and sanitizer used
  -> dry-run mutation report for destructive moves
  -> storage keys touched
  -> revision/cache invalidation/broadcast result
  -> backup/network/script/stat side effects
  -> rollback or partial-failure status
```

## Current Verdict

```text
P0 settings/mutation slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
```

Related artifacts:

- `docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_SECURITY_PIN_LOCK_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_UNIFIED_MUTATION_CONTRACT_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_IMPORT_EXPORT_NANAH_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
